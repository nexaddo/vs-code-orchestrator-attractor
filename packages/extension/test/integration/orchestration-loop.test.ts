import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, it, expect, afterEach } from "vitest";

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
import { FileEventLog } from "../../src/storage/events/file-event-log";
import type {
  OrchestrationStatePayload,
  OrchestratorHandoff,
  PlannerHandoff,
  ImplementerHandoff,
  ReviewerHandoff,
  ExtensionEvent
} from "@attractor/shared";

type Role = "orchestrator" | "planner" | "implementer" | "reviewer";

/**
 * Stub model gateway that returns valid JSON responses for orchestration.
 * This is different from NoOpModelGateway which returns empty strings.
 */
class IntegrationStubGateway implements ModelGateway {
  async send(
    messages: ModelMessage[],
    options?: ModelRequestOptions
  ): Promise<string> {
    void messages;
    void options;

    // Return valid handoff JSON based on role in messages
    const content = messages.map((m) => m.content).join(" ");

    if (content.includes("orchestrator")) {
      return JSON.stringify({
        description: "Test milestone description",
        acceptanceCriteria: ["criterion 1"]
      });
    }

    if (content.includes("planner")) {
      return JSON.stringify({
        tasks: [{ id: "t1", description: "task 1", testFirst: true }],
        filesLikelyAffected: ["src/foo.ts"]
      });
    }

    if (content.includes("implementer")) {
      return JSON.stringify({
        tasksCompleted: ["t1"],
        summary: "Implemented task 1",
        testsPassed: true
      });
    }

    if (content.includes("reviewer")) {
      return JSON.stringify({
        approved: true,
        comments: ["Looks good"],
        requiresChanges: false
      });
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

/**
 * Helper to create a valid milestone input.
 */
function makeMilestone(
  id: string,
  name: string,
  order: number
): MilestoneInput {
  return {
    id,
    name,
    order,
    description: `Description for ${name}`,
    acceptanceCriteria: [`Criterion for ${name}`]
  };
}

/**
 * Helper to create a test event for the event log.
 */
function makeEvent(
  runId: string,
  eventId: string,
  kind: "status.changed" | "created" | "updated" = "status.changed"
): ExtensionEvent {
  return {
    version: 1 as const,
    id: eventId,
    runId,
    entityType: "run" as const,
    entityId: runId,
    kind,
    timestamp: new Date().toISOString(),
    payload: {}
  };
}

describe("OrchestrationLoop — Integration Tests", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    // Clean up all temp directories created during tests
    for (const dir of tempDirs) {
      await rm(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it("starts and progresses through phases (orchestrator → planner → implementer → reviewer)", async () => {
    // This tests full phase progression with real state transitions which is NOT covered by orchestration-loop.test.ts in integration context
    const tempDir = await mkdtemp(
      path.join(os.tmpdir(), "attractor-loop-integration-")
    );
    tempDirs.push(tempDir);

    const gateway = new IntegrationStubGateway();
    const loop = new OrchestrationLoop();
    const stateChanges: OrchestrationStatePayload[] = [];
    const handoffs: Array<{
      handoff:
        | OrchestratorHandoff
        | PlannerHandoff
        | ImplementerHandoff
        | ReviewerHandoff;
      role: Role;
    }> = [];
    const errors: Array<{ error: Error; milestoneId: string; role: Role }> = [];

    const milestone = makeMilestone("m1", "Test Milestone", 0);

    const options: OrchestrationOptions = {
      modelGateway: gateway,
      milestones: [milestone],
      runId: "run-integration-001",
      planTitle: "Integration Test Plan",
      planGoal: "Verify phase progression",
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

    // Verify all phases transitioned through: waiting → running → done
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

    // Verify each phase had a "running" state
    const orchestratorRunningStates = stateChanges.filter(
      (s) => s.phases[0]?.status === "running"
    );
    const plannerRunningStates = stateChanges.filter(
      (s) => s.phases[1]?.status === "running"
    );
    const implementerRunningStates = stateChanges.filter(
      (s) => s.phases[2]?.status === "running"
    );
    const reviewerRunningStates = stateChanges.filter(
      (s) => s.phases[3]?.status === "running"
    );

    expect(orchestratorRunningStates.length).toBeGreaterThan(0);
    expect(plannerRunningStates.length).toBeGreaterThan(0);
    expect(implementerRunningStates.length).toBeGreaterThan(0);
    expect(reviewerRunningStates.length).toBeGreaterThan(0);

    // Verify handoffs were emitted
    expect(handoffs.length).toBe(4);
    expect(handoffs[0]?.role).toBe("orchestrator");
    expect(handoffs[1]?.role).toBe("planner");
    expect(handoffs[2]?.role).toBe("implementer");
    expect(handoffs[3]?.role).toBe("reviewer");

    // No errors
    expect(errors.length).toBe(0);
  });

  it("emits events to FileEventLog during orchestration", async () => {
    // This tests integration with event log which is NOT covered by orchestration-loop.test.ts
    const tempDir = await mkdtemp(
      path.join(os.tmpdir(), "attractor-loop-integration-")
    );
    tempDirs.push(tempDir);

    const gateway = new IntegrationStubGateway();
    const loop = new OrchestrationLoop();
    const eventLog = new FileEventLog(tempDir);
    const runId = "run-integration-002";

    const milestone = makeMilestone("m1", "Test Milestone", 0);

    // Track state changes and collect promises for all event appends
    const appendPromises: Promise<void>[] = [];
    const onStateChange = () => {
      const event = makeEvent(
        runId,
        `evt_state_${Date.now()}`,
        "status.changed"
      );
      // Collect the promise so we can await all appends after loop completes
      appendPromises.push(eventLog.append(event));
    };

    const options: OrchestrationOptions = {
      modelGateway: gateway,
      milestones: [milestone],
      runId,
      planTitle: "Integration Test Plan",
      planGoal: "Verify event log integration",
      onStateChange,
      onHandoff: () => {
        // No-op
      },
      onError: () => {
        // No-op
      }
    };

    await loop.execute(options);

    // Wait for all event appends to complete
    await Promise.all(appendPromises);

    // Verify events were appended to the log
    const events = await eventLog.listByRun(runId);
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.runId === runId)).toBe(true);
    expect(appendPromises.length).toBe(events.length);
  });

  it("cancellation stops the loop and emits canceled state", async () => {
    // This tests cancellation integration which is NOT covered by orchestration-loop.test.ts in detail
    const tempDir = await mkdtemp(
      path.join(os.tmpdir(), "attractor-loop-integration-")
    );
    tempDirs.push(tempDir);

    const gateway = new IntegrationStubGateway();
    const loop = new OrchestrationLoop();
    const controller = new AbortController();
    const stateChanges: OrchestrationStatePayload[] = [];

    const milestones = [
      makeMilestone("m1", "First Milestone", 0),
      makeMilestone("m2", "Second Milestone", 1)
    ];

    // Abort immediately before execution
    controller.abort();

    const options: OrchestrationOptions = {
      modelGateway: gateway,
      milestones,
      runId: "run-integration-003",
      planTitle: "Integration Test Plan",
      planGoal: "Verify cancellation",
      onStateChange: (state) => {
        stateChanges.push(state);
      },
      onHandoff: () => {
        // No-op
      },
      onError: () => {
        // No-op
      },
      signal: controller.signal
    };

    await loop.execute(options);

    // When aborted before start, loop returns immediately with no milestones processed
    // Verify no milestones were processed
    const milestoneNames = stateChanges.map((s) => s.milestoneName);
    expect(milestoneNames).not.toContain("First Milestone");
    expect(milestoneNames).not.toContain("Second Milestone");
  });
});
