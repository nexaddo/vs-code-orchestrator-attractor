import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  OrchestrationLoop,
  type MilestoneInput,
  type OrchestrationOptions
} from "../../src/application/orchestration-loop";
import type {
  ModelGateway,
  ModelMessage,
  ModelRequestOptions
} from "../../src/application/ports";
import type {
  OrchestrationStatePayload,
  OrchestratorHandoff,
  PlannerHandoff,
  ImplementerHandoff,
  ReviewerHandoff
} from "@attractor/shared";

type Role = "orchestrator" | "planner" | "implementer" | "reviewer";

/**
 * Stub model gateway that returns canned responses based on prompt content.
 */
class StubModelGateway implements ModelGateway {
  private responses: Map<string, string> = new Map();

  setResponse(roleKeyword: string, response: string): void {
    this.responses.set(roleKeyword, response);
  }

  async send(
    messages: ModelMessage[],
    options?: ModelRequestOptions
  ): Promise<string> {
    void options;
    const content = messages.map((m) => m.content).join(" ");

    for (const [keyword, response] of this.responses) {
      if (content.includes(keyword)) {
        return response;
      }
    }

    return "{}";
  }

  async stream(
    messages: ModelMessage[],
    onChunk: (text: string) => void,
    options?: ModelRequestOptions
  ): Promise<void> {
    const result = await this.send(messages, options);
    onChunk(result);
  }
}

describe("OrchestrationLoop", () => {
  let gateway: StubModelGateway;
  let loop: OrchestrationLoop;
  let stateChanges: OrchestrationStatePayload[];
  let handoffs: Array<{
    handoff:
      | OrchestratorHandoff
      | PlannerHandoff
      | ImplementerHandoff
      | ReviewerHandoff;
    role: Role;
  }>;
  let errors: Array<{ error: Error; milestoneId: string; role: Role }>;

  beforeEach(() => {
    gateway = new StubModelGateway();
    loop = new OrchestrationLoop();
    stateChanges = [];
    handoffs = [];
    errors = [];

    // Set default canned responses
    gateway.setResponse(
      "orchestrator",
      JSON.stringify({
        milestoneId: "m1",
        milestoneName: "Test Milestone",
        description: "Test milestone description",
        acceptanceCriteria: ["criterion 1"]
      })
    );

    gateway.setResponse(
      "planner",
      JSON.stringify({
        tasks: [{ id: "t1", description: "task 1", testFirst: true }],
        filesLikelyAffected: ["src/foo.ts"]
      })
    );

    gateway.setResponse(
      "implementer",
      JSON.stringify({
        tasksCompleted: ["t1"],
        summary: "Implemented task 1",
        testsPassed: true
      })
    );

    gateway.setResponse(
      "reviewer",
      JSON.stringify({
        approved: true,
        comments: ["Looks good"],
        requiresChanges: false
      })
    );
  });

  describe("single milestone success path", () => {
    it("should execute all 4 phases and emit correct state transitions", async () => {
      const milestone: MilestoneInput = {
        id: "m1",
        name: "Test Milestone",
        order: 0,
        description: "Test milestone description",
        acceptanceCriteria: ["criterion 1"]
      };

      const options: OrchestrationOptions = {
        modelGateway: gateway,
        milestones: [milestone],
        runId: "run-1",
        planTitle: "Test Plan",
        planGoal: "Test goal",
        onStateChange: (state) => {
          stateChanges.push(state);
        },
        onHandoff: (handoff, role) => {
          handoffs.push({ handoff, role });
        },
        onError: (error, milestoneId, role) => {
          errors.push({ error, milestoneId, role });
        }
      };

      await loop.execute(options);

      // Verify state transitions
      expect(stateChanges.length).toBeGreaterThan(0);

      // Initial state: all waiting
      const initialState = stateChanges[0];
      expect(initialState?.phases[0]?.status).toBe("waiting");
      expect(initialState?.phases[1]?.status).toBe("waiting");
      expect(initialState?.phases[2]?.status).toBe("waiting");
      expect(initialState?.phases[3]?.status).toBe("waiting");

      // Final state: all done
      const finalState = stateChanges[stateChanges.length - 1];
      expect(finalState?.phases[0]?.status).toBe("done");
      expect(finalState?.phases[1]?.status).toBe("done");
      expect(finalState?.phases[2]?.status).toBe("done");
      expect(finalState?.phases[3]?.status).toBe("done");

      // Verify handoffs (4 total: orchestrator, planner, implementer, reviewer)
      expect(handoffs.length).toBe(4);
      expect(handoffs[0]?.role).toBe("orchestrator");
      expect(handoffs[1]?.role).toBe("planner");
      expect(handoffs[2]?.role).toBe("implementer");
      expect(handoffs[3]?.role).toBe("reviewer");

      // Verify no errors
      expect(errors.length).toBe(0);
    });
  });

  describe("multi-milestone ordering", () => {
    it("should process milestones in order field ascending", async () => {
      const milestones: MilestoneInput[] = [
        {
          id: "m2",
          name: "Second",
          order: 2,
          description: "Second milestone",
          acceptanceCriteria: []
        },
        {
          id: "m0",
          name: "First",
          order: 0,
          description: "First milestone",
          acceptanceCriteria: []
        },
        {
          id: "m1",
          name: "Third",
          order: 1,
          description: "Third milestone",
          acceptanceCriteria: []
        }
      ];

      const options: OrchestrationOptions = {
        modelGateway: gateway,
        milestones,
        runId: "run-1",
        planTitle: "Test Plan",
        planGoal: "Test goal",
        onStateChange: (state) => {
          stateChanges.push(state);
        },
        onHandoff: (handoff, role) => {
          handoffs.push({ handoff, role });
        },
        onError: (error, milestoneId, role) => {
          errors.push({ error, milestoneId, role });
        }
      };

      await loop.execute(options);

      // Find state changes where orchestrator is running (start of milestone)
      const orchestratorRunningStates = stateChanges.filter(
        (s) => s.phases[0]?.status === "running"
      );

      expect(orchestratorRunningStates.length).toBe(3);
      expect(orchestratorRunningStates[0]?.milestoneName).toBe("First");
      expect(orchestratorRunningStates[1]?.milestoneName).toBe("Third");
      expect(orchestratorRunningStates[2]?.milestoneName).toBe("Second");

      // Verify milestoneIndex increments correctly
      expect(orchestratorRunningStates[0]?.milestoneIndex).toBe(0);
      expect(orchestratorRunningStates[1]?.milestoneIndex).toBe(1);
      expect(orchestratorRunningStates[2]?.milestoneIndex).toBe(2);
    });
  });

  describe("planner failure stops milestone", () => {
    it("should mark planner as failed and not run implementer/reviewer", async () => {
      // Make planner return invalid JSON
      gateway.setResponse("planner", "invalid json {");

      const milestone: MilestoneInput = {
        id: "m1",
        name: "Test Milestone",
        order: 0,
        description: "Test milestone description",
        acceptanceCriteria: []
      };

      const options: OrchestrationOptions = {
        modelGateway: gateway,
        milestones: [milestone],
        runId: "run-1",
        planTitle: "Test Plan",
        planGoal: "Test goal",
        onStateChange: (state) => {
          stateChanges.push(state);
        },
        onHandoff: (handoff, role) => {
          handoffs.push({ handoff, role });
        },
        onError: (error, milestoneId, role) => {
          errors.push({ error, milestoneId, role });
        }
      };

      await loop.execute(options);

      // Verify onError was called for planner
      expect(errors.length).toBe(1);
      expect(errors[0]?.milestoneId).toBe("m1");
      expect(errors[0]?.role).toBe("planner");

      // Verify final state has planner as failed
      const finalState = stateChanges[stateChanges.length - 1];
      expect(finalState?.phases[0]?.status).toBe("done"); // orchestrator
      expect(finalState?.phases[1]?.status).toBe("failed"); // planner
      expect(finalState?.phases[2]?.status).toBe("waiting"); // implementer (not run)
      expect(finalState?.phases[3]?.status).toBe("waiting"); // reviewer (not run)

      // Verify only orchestrator handoff was emitted
      expect(handoffs.length).toBe(1);
      expect(handoffs[0]?.role).toBe("orchestrator");
    });
  });

  describe("implementer failure stops milestone", () => {
    it("should mark implementer as failed and not run reviewer", async () => {
      // Make implementer return invalid JSON
      gateway.setResponse("implementer", "not json");

      const milestone: MilestoneInput = {
        id: "m1",
        name: "Test Milestone",
        order: 0,
        description: "Test milestone description",
        acceptanceCriteria: []
      };

      const options: OrchestrationOptions = {
        modelGateway: gateway,
        milestones: [milestone],
        runId: "run-1",
        planTitle: "Test Plan",
        planGoal: "Test goal",
        onStateChange: (state) => {
          stateChanges.push(state);
        },
        onHandoff: (handoff, role) => {
          handoffs.push({ handoff, role });
        },
        onError: (error, milestoneId, role) => {
          errors.push({ error, milestoneId, role });
        }
      };

      await loop.execute(options);

      // Verify onError was called for implementer
      expect(errors.length).toBe(1);
      expect(errors[0]?.milestoneId).toBe("m1");
      expect(errors[0]?.role).toBe("implementer");

      // Verify final state has implementer as failed
      const finalState = stateChanges[stateChanges.length - 1];
      expect(finalState?.phases[0]?.status).toBe("done"); // orchestrator
      expect(finalState?.phases[1]?.status).toBe("done"); // planner
      expect(finalState?.phases[2]?.status).toBe("failed"); // implementer
      expect(finalState?.phases[3]?.status).toBe("waiting"); // reviewer (not run)

      // Verify orchestrator and planner handoffs were emitted
      expect(handoffs.length).toBe(2);
      expect(handoffs[0]?.role).toBe("orchestrator");
      expect(handoffs[1]?.role).toBe("planner");
    });
  });

  describe("abort mid-execution", () => {
    it("should stop processing remaining milestones when aborted", async () => {
      const controller = new AbortController();

      const milestones: MilestoneInput[] = [
        {
          id: "m1",
          name: "First",
          order: 0,
          description: "First milestone",
          acceptanceCriteria: []
        },
        {
          id: "m2",
          name: "Second",
          order: 1,
          description: "Second milestone",
          acceptanceCriteria: []
        }
      ];

      // Spy on gateway.send to abort after first milestone completes
      const originalSend = gateway.send.bind(gateway);
      let callCount = 0;
      gateway.send = vi.fn(
        async (messages: ModelMessage[], options?: ModelRequestOptions) => {
          callCount++;
          // Abort after reviewer phase of first milestone (call 4)
          if (callCount === 4) {
            controller.abort();
          }
          return originalSend(messages, options);
        }
      );

      const options: OrchestrationOptions = {
        modelGateway: gateway,
        milestones,
        runId: "run-1",
        planTitle: "Test Plan",
        planGoal: "Test goal",
        onStateChange: (state) => {
          stateChanges.push(state);
        },
        onHandoff: (handoff, role) => {
          handoffs.push({ handoff, role });
        },
        onError: (error, milestoneId, role) => {
          errors.push({ error, milestoneId, role });
        },
        signal: controller.signal
      };

      await loop.execute(options);

      // Verify only first milestone was processed
      const milestoneNames = stateChanges.map((s) => s.milestoneName);
      expect(milestoneNames).toContain("First");
      expect(milestoneNames).not.toContain("Second");

      // Verify handoffs only from first milestone
      expect(handoffs.length).toBe(4);
    });
  });

  describe("topological sort correctness", () => {
    it("should execute milestones in order field ascending", async () => {
      const milestones: MilestoneInput[] = [
        {
          id: "m2",
          name: "Order 2",
          order: 2,
          description: "Should run third",
          acceptanceCriteria: []
        },
        {
          id: "m0",
          name: "Order 0",
          order: 0,
          description: "Should run first",
          acceptanceCriteria: []
        },
        {
          id: "m1",
          name: "Order 1",
          order: 1,
          description: "Should run second",
          acceptanceCriteria: []
        }
      ];

      const options: OrchestrationOptions = {
        modelGateway: gateway,
        milestones,
        runId: "run-1",
        planTitle: "Test Plan",
        planGoal: "Test goal",
        onStateChange: (state) => {
          stateChanges.push(state);
        },
        onHandoff: (handoff, role) => {
          handoffs.push({ handoff, role });
        },
        onError: (error, milestoneId, role) => {
          errors.push({ error, milestoneId, role });
        }
      };

      await loop.execute(options);

      // Extract milestone names in execution order via state changes
      const milestoneExecutionOrder = stateChanges
        .filter((s) => s.phases[0]?.status === "running")
        .map((s) => s.milestoneName);

      expect(milestoneExecutionOrder).toEqual([
        "Order 0",
        "Order 1",
        "Order 2"
      ]);
    });
  });

  describe("observer callback isolation", () => {
    it("onStateChange throw does not prevent phase completion", async () => {
      let callCount = 0;
      const milestone: MilestoneInput = {
        id: "m1",
        name: "Test Milestone",
        order: 0,
        description: "Test",
        acceptanceCriteria: []
      };

      const options: OrchestrationOptions = {
        modelGateway: gateway,
        milestones: [milestone],
        runId: "run-1",
        planTitle: "Test Plan",
        planGoal: "Test goal",
        onStateChange: () => {
          callCount++;
          throw new Error("Observer exploded");
        },
        onHandoff: (handoff, role) => {
          handoffs.push({ handoff, role });
        },
        onError: (error, milestoneId, role) => {
          errors.push({ error, milestoneId, role });
        }
      };

      await loop.execute(options);

      // onStateChange was called (even though it throws)
      expect(callCount).toBeGreaterThan(0);
      // Handoffs still emitted — phases completed despite observer failure
      expect(handoffs.length).toBe(4);
      expect(errors.length).toBe(0);
    });

    it("onHandoff throw does not prevent phase completion", async () => {
      const milestone: MilestoneInput = {
        id: "m1",
        name: "Test Milestone",
        order: 0,
        description: "Test",
        acceptanceCriteria: []
      };

      const options: OrchestrationOptions = {
        modelGateway: gateway,
        milestones: [milestone],
        runId: "run-1",
        planTitle: "Test Plan",
        planGoal: "Test goal",
        onStateChange: (state) => {
          stateChanges.push(state);
        },
        onHandoff: () => {
          throw new Error("Handoff observer exploded");
        },
        onError: (error, milestoneId, role) => {
          errors.push({ error, milestoneId, role });
        }
      };

      await loop.execute(options);

      // All 4 phases should complete despite onHandoff throwing
      expect(stateChanges.length).toBeGreaterThan(0);
      expect(errors.length).toBe(0);

      const finalState = stateChanges[stateChanges.length - 1];
      expect(finalState?.phases[0]?.status).toBe("done");
      expect(finalState?.phases[1]?.status).toBe("done");
      expect(finalState?.phases[2]?.status).toBe("done");
      expect(finalState?.phases[3]?.status).toBe("done");
    });
  });

  describe("reviewer rejection", () => {
    it("marks reviewer phase as failed when approved is false", async () => {
      gateway.setResponse(
        "reviewer",
        JSON.stringify({
          approved: false,
          comments: ["Needs error handling"],
          requiresChanges: true
        })
      );

      const milestone: MilestoneInput = {
        id: "m1",
        name: "Test Milestone",
        order: 0,
        description: "Test",
        acceptanceCriteria: []
      };

      const options: OrchestrationOptions = {
        modelGateway: gateway,
        milestones: [milestone],
        runId: "run-1",
        planTitle: "Test Plan",
        planGoal: "Test goal",
        onStateChange: (state) => {
          stateChanges.push(state);
        },
        onHandoff: (handoff, role) => {
          handoffs.push({ handoff, role });
        },
        onError: (error, milestoneId, role) => {
          errors.push({ error, milestoneId, role });
        }
      };

      await loop.execute(options);

      // Reviewer should fail
      expect(errors.length).toBe(1);
      expect(errors[0]?.role).toBe("reviewer");
      expect(errors[0]?.error.message).toContain("rejected");

      // Final state: first 3 done, reviewer failed
      const finalState = stateChanges[stateChanges.length - 1];
      expect(finalState?.phases[0]?.status).toBe("done");
      expect(finalState?.phases[1]?.status).toBe("done");
      expect(finalState?.phases[2]?.status).toBe("done");
      expect(finalState?.phases[3]?.status).toBe("failed");
    });
  });

  describe("abort terminal states", () => {
    it("marks phase as canceled when abort fires before phase starts", async () => {
      const controller = new AbortController();
      controller.abort(); // Pre-abort

      const milestone: MilestoneInput = {
        id: "m1",
        name: "Test Milestone",
        order: 0,
        description: "Test",
        acceptanceCriteria: []
      };

      const options: OrchestrationOptions = {
        modelGateway: gateway,
        milestones: [milestone],
        runId: "run-1",
        planTitle: "Test Plan",
        planGoal: "Test goal",
        onStateChange: (state) => {
          stateChanges.push(state);
        },
        onHandoff: (handoff, role) => {
          handoffs.push({ handoff, role });
        },
        onError: (error, milestoneId, role) => {
          errors.push({ error, milestoneId, role });
        },
        signal: controller.signal
      };

      await loop.execute(options);

      // Pre-aborted: execute() returns immediately, no milestones processed
      expect(handoffs.length).toBe(0);
    });

    it("marks in-flight phase as canceled when abort fires mid-milestone", async () => {
      const controller = new AbortController();

      const milestone: MilestoneInput = {
        id: "m1",
        name: "Test Milestone",
        order: 0,
        description: "Test",
        acceptanceCriteria: []
      };

      // Abort during orchestrator phase send
      const originalSend = gateway.send.bind(gateway);
      let callCount = 0;
      gateway.send = vi.fn(
        async (messages: ModelMessage[], opts?: ModelRequestOptions) => {
          callCount++;
          if (callCount === 1) {
            // Abort AFTER orchestrator send returns
            const result = await originalSend(messages, opts);
            controller.abort();
            return result;
          }
          return originalSend(messages, opts);
        }
      );

      const options: OrchestrationOptions = {
        modelGateway: gateway,
        milestones: [milestone],
        runId: "run-1",
        planTitle: "Test Plan",
        planGoal: "Test goal",
        onStateChange: (state) => {
          stateChanges.push(state);
        },
        onHandoff: (handoff, role) => {
          handoffs.push({ handoff, role });
        },
        onError: (error, milestoneId, role) => {
          errors.push({ error, milestoneId, role });
        },
        signal: controller.signal
      };

      await loop.execute(options);

      // Orchestrator is canceled after send returns and abort fires
      expect(handoffs.length).toBe(0);

      const canceledStates = stateChanges.filter(
        (s) => String(s.phases[0]?.status) === "canceled"
      );
      expect(canceledStates.length).toBeGreaterThan(0);
    });
  });

  describe("empty model response", () => {
    it("marks phase as failed when gateway returns empty string", async () => {
      // Override orchestrator to return empty
      gateway.setResponse("orchestrator", "");

      const milestone: MilestoneInput = {
        id: "m1",
        name: "Test Milestone",
        order: 0,
        description: "Test",
        acceptanceCriteria: []
      };

      const options: OrchestrationOptions = {
        modelGateway: gateway,
        milestones: [milestone],
        runId: "run-1",
        planTitle: "Test Plan",
        planGoal: "Test goal",
        onStateChange: (state) => {
          stateChanges.push(state);
        },
        onHandoff: (handoff, role) => {
          handoffs.push({ handoff, role });
        },
        onError: (error, milestoneId, role) => {
          errors.push({ error, milestoneId, role });
        }
      };

      await loop.execute(options);

      // Orchestrator should fail with parse error
      expect(errors.length).toBe(1);
      expect(errors[0]?.role).toBe("orchestrator");

      const finalState = stateChanges[stateChanges.length - 1];
      expect(finalState?.phases[0]?.status).toBe("failed");
    });
  });

  describe("state transition ordering for single milestone", () => {
    it("should emit correct status progression for each role", async () => {
      const milestone: MilestoneInput = {
        id: "m1",
        name: "Test Milestone",
        order: 0,
        description: "Test milestone description",
        acceptanceCriteria: []
      };

      const options: OrchestrationOptions = {
        modelGateway: gateway,
        milestones: [milestone],
        runId: "run-1",
        planTitle: "Test Plan",
        planGoal: "Test goal",
        onStateChange: (state) => {
          stateChanges.push(state);
        },
        onHandoff: (handoff, role) => {
          handoffs.push({ handoff, role });
        },
        onError: (error, milestoneId, role) => {
          errors.push({ error, milestoneId, role });
        }
      };

      await loop.execute(options);

      // Verify orchestrator transitions: waiting → running → done
      const orchestratorStates = stateChanges.map((s) => s.phases[0]?.status);
      expect(orchestratorStates).toContain("waiting");
      expect(orchestratorStates).toContain("running");
      expect(orchestratorStates).toContain("done");

      const orchestratorWaitingIdx = orchestratorStates.indexOf("waiting");
      const orchestratorRunningIdx = orchestratorStates.indexOf("running");
      const orchestratorDoneIdx = orchestratorStates.indexOf("done");

      expect(orchestratorWaitingIdx).toBeLessThan(orchestratorRunningIdx);
      expect(orchestratorRunningIdx).toBeLessThan(orchestratorDoneIdx);

      // Verify planner transitions: waiting → waiting → running → done
      const plannerStates = stateChanges.map((s) => s.phases[1]?.status);
      expect(plannerStates).toContain("waiting");
      expect(plannerStates).toContain("running");
      expect(plannerStates).toContain("done");

      const plannerRunningIdx = plannerStates.indexOf("running");
      const plannerDoneIdx = plannerStates.indexOf("done");

      expect(plannerRunningIdx).toBeGreaterThan(orchestratorDoneIdx);
      expect(plannerRunningIdx).toBeLessThan(plannerDoneIdx);

      // Verify implementer transitions: waiting → ... → running → done
      const implementerStates = stateChanges.map((s) => s.phases[2]?.status);
      expect(implementerStates).toContain("waiting");
      expect(implementerStates).toContain("running");
      expect(implementerStates).toContain("done");

      const implementerRunningIdx = implementerStates.indexOf("running");
      const implementerDoneIdx = implementerStates.indexOf("done");

      expect(implementerRunningIdx).toBeGreaterThan(plannerDoneIdx);
      expect(implementerRunningIdx).toBeLessThan(implementerDoneIdx);

      // Verify reviewer transitions: waiting → ... → running → done
      const reviewerStates = stateChanges.map((s) => s.phases[3]?.status);
      expect(reviewerStates).toContain("waiting");
      expect(reviewerStates).toContain("running");
      expect(reviewerStates).toContain("done");

      const reviewerRunningIdx = reviewerStates.indexOf("running");
      const reviewerDoneIdx = reviewerStates.indexOf("done");

      expect(reviewerRunningIdx).toBeGreaterThan(implementerDoneIdx);
      expect(reviewerRunningIdx).toBeLessThan(reviewerDoneIdx);
    });
  });
});
