import { describe, expect, it, vi } from "vitest";

import { OrchestrationLoop } from "../../src/application/orchestration-loop";
import type {
  ModelGateway,
  ModelMessage,
  ModelRequestOptions
} from "../../src/application/ports";
import type { GraphRecord, OrchestrationStatePayload } from "@attractor/shared";

const makeGraph = (nodes: GraphRecord["nodes"]): GraphRecord => ({
  version: 1,
  id: "graph-001",
  planId: "plan-001",
  source: "digraph { A -> B }",
  nodes,
  createdAt: "2026-01-01T00:00:00.000Z"
});

// Match on unique schema field names present in each system prompt.
// Using schema-field keys avoids false positives (e.g. planner prompt contains
// the word "orchestrator" in "given an orchestrator's milestone breakdown").
function makeStubGateway(responses: {
  acceptanceCriteria: string; // orchestrator
  filesLikelyAffected: string; // planner
  testsPassed: string; // implementer
  requiresChanges: string; // reviewer
}): ModelGateway {
  return {
    send: vi.fn(
      async (
        _messages: ModelMessage[],
        options?: ModelRequestOptions
      ): Promise<string> => {
        const sys = options?.systemPrompt ?? "";
        if (sys.includes("acceptanceCriteria"))
          return responses.acceptanceCriteria;
        if (sys.includes("filesLikelyAffected"))
          return responses.filesLikelyAffected;
        if (sys.includes("testsPassed")) return responses.testsPassed;
        if (sys.includes("requiresChanges")) return responses.requiresChanges;
        throw new Error(
          `No stub response for system prompt: ${sys.slice(0, 80)}`
        );
      }
    ),
    stream: vi.fn()
  };
}

const orchestratorResponse = JSON.stringify({
  version: 1,
  milestoneId: "A",
  milestoneName: "Set up auth",
  description: "Implement JWT authentication.",
  acceptanceCriteria: ["User can log in", "JWT expires in 1h"]
});

const plannerResponse = JSON.stringify({
  version: 1,
  milestoneId: "A",
  tasks: [{ id: "t1", description: "Create login endpoint", testFirst: true }],
  filesLikelyAffected: ["src/auth.ts"]
});

const implementerResponse = JSON.stringify({
  version: 1,
  milestoneId: "A",
  tasksCompleted: ["t1"],
  summary: "Created JWT login endpoint with tests.",
  testsPassed: true
});

const reviewerResponseApproved = JSON.stringify({
  version: 1,
  milestoneId: "A",
  approved: true,
  comments: ["LGTM"],
  requiresChanges: false
});

const reviewerResponseRejected = JSON.stringify({
  version: 1,
  milestoneId: "A",
  approved: false,
  comments: ["Missing error handling"],
  requiresChanges: true
});

const happyGateway = () =>
  makeStubGateway({
    acceptanceCriteria: orchestratorResponse,
    filesLikelyAffected: plannerResponse,
    testsPassed: implementerResponse,
    requiresChanges: reviewerResponseApproved
  });

describe("OrchestrationLoop", () => {
  it("executes all 4 phases for a single-node graph (happy path)", async () => {
    const loop = new OrchestrationLoop(happyGateway());
    const states: OrchestrationStatePayload[] = [];
    const graph = makeGraph([{ id: "A", label: "Set up auth", dependsOn: [] }]);

    await loop.execute({
      runId: "run-001",
      graph,
      worktreePath: "/tmp/worktrees/run-001",
      onStateUpdate: (state) => states.push(state)
    });

    // 4 phases × 2 state emissions each: running → done
    expect(states.length).toBe(8);
    expect(states[0]).toMatchObject({
      runId: "run-001",
      milestoneIndex: 1,
      milestoneCount: 1
    });

    const finalState = states[states.length - 1];
    expect(finalState).toBeDefined();
    expect(finalState!.phases[0]).toMatchObject({
      role: "orchestrator",
      status: "done"
    });
    expect(finalState!.phases[1]).toMatchObject({
      role: "planner",
      status: "done"
    });
    expect(finalState!.phases[2]).toMatchObject({
      role: "implementer",
      status: "done"
    });
    expect(finalState!.phases[3]).toMatchObject({
      role: "reviewer",
      status: "done"
    });
  });

  it("marks reviewer as failed when reviewer rejects", async () => {
    const gateway = makeStubGateway({
      acceptanceCriteria: orchestratorResponse,
      filesLikelyAffected: plannerResponse,
      testsPassed: implementerResponse,
      requiresChanges: reviewerResponseRejected
    });
    const loop = new OrchestrationLoop(gateway);
    const states: OrchestrationStatePayload[] = [];
    const graph = makeGraph([{ id: "A", label: "Set up auth", dependsOn: [] }]);

    await loop.execute({
      runId: "run-001",
      graph,
      worktreePath: "/tmp/worktrees/run-001",
      onStateUpdate: (state) => states.push(state)
    });

    const finalState = states[states.length - 1];
    expect(finalState!.phases[3]).toMatchObject({
      role: "reviewer",
      status: "failed"
    });
    expect(finalState!.phases[3]!.errorLabel).toContain(
      "Missing error handling"
    );
  });

  it("skips downstream phases when orchestrator fails", async () => {
    const gateway: ModelGateway = {
      send: vi.fn(
        async (
          _messages: ModelMessage[],
          options?: ModelRequestOptions
        ): Promise<string> => {
          if (options?.systemPrompt?.includes("acceptanceCriteria")) {
            throw new Error("LLM unavailable");
          }
          return "{}";
        }
      ),
      stream: vi.fn()
    };

    const loop = new OrchestrationLoop(gateway);
    const states: OrchestrationStatePayload[] = [];
    const graph = makeGraph([{ id: "A", label: "Set up auth", dependsOn: [] }]);

    await loop.execute({
      runId: "run-001",
      graph,
      worktreePath: "/tmp/worktrees/run-001",
      onStateUpdate: (state) => states.push(state)
    });

    const finalState = states[states.length - 1];
    expect(finalState!.phases[0]).toMatchObject({
      role: "orchestrator",
      status: "failed"
    });
    expect(finalState!.phases[1]).toMatchObject({
      role: "planner",
      status: "skipped"
    });
    expect(finalState!.phases[2]).toMatchObject({
      role: "implementer",
      status: "skipped"
    });
    expect(finalState!.phases[3]).toMatchObject({
      role: "reviewer",
      status: "skipped"
    });
  });

  it("skips downstream phases when implementer fails", async () => {
    const gateway: ModelGateway = {
      send: vi.fn(
        async (
          _messages: ModelMessage[],
          options?: ModelRequestOptions
        ): Promise<string> => {
          const sys = options?.systemPrompt ?? "";
          if (sys.includes("acceptanceCriteria")) return orchestratorResponse;
          if (sys.includes("filesLikelyAffected")) return plannerResponse;
          throw new Error("Implementer failed");
        }
      ),
      stream: vi.fn()
    };

    const loop = new OrchestrationLoop(gateway);
    const states: OrchestrationStatePayload[] = [];
    const graph = makeGraph([{ id: "A", label: "Set up auth", dependsOn: [] }]);

    await loop.execute({
      runId: "run-001",
      graph,
      worktreePath: "/tmp/worktrees/run-001",
      onStateUpdate: (state) => states.push(state)
    });

    const finalState = states[states.length - 1];
    expect(finalState!.phases[2]).toMatchObject({
      role: "implementer",
      status: "failed"
    });
    expect(finalState!.phases[3]).toMatchObject({
      role: "reviewer",
      status: "skipped"
    });
  });

  it("processes nodes in dependency order for a two-node graph", async () => {
    const loop = new OrchestrationLoop(happyGateway());
    const milestoneNames: string[] = [];
    const graph = makeGraph([
      { id: "B", label: "Milestone B", dependsOn: ["A"] },
      { id: "A", label: "Milestone A", dependsOn: [] }
    ]);

    await loop.execute({
      runId: "run-001",
      graph,
      worktreePath: "/tmp/worktrees/run-001",
      onStateUpdate: (state) => {
        if (!milestoneNames.includes(state.milestoneName)) {
          milestoneNames.push(state.milestoneName);
        }
      }
    });

    expect(milestoneNames).toEqual(["Milestone A", "Milestone B"]);
  });

  it("emits correct milestoneCount for multi-node graphs", async () => {
    const loop = new OrchestrationLoop(happyGateway());
    const milestoneCounts = new Set<number>();
    const graph = makeGraph([
      { id: "A", label: "Step A", dependsOn: [] },
      { id: "B", label: "Step B", dependsOn: [] }
    ]);

    await loop.execute({
      runId: "run-001",
      graph,
      worktreePath: "/tmp/worktrees/run-001",
      onStateUpdate: (state) => {
        milestoneCounts.add(state.milestoneCount);
      }
    });

    expect(milestoneCounts.has(2)).toBe(true);
  });
});
