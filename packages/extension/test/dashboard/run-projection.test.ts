import { describe, expect, it } from "vitest";

import {
  CONTRACT_VERSION,
  type ArtifactRecord,
  type ExtensionEvent,
  type HandoffEnvelope,
  type MilestoneRunRecord,
  type PlanRecord,
  type RunRecord
} from "@attractor/shared";

import { type StorageServices } from "../../src/storage/services";
import { projectRun } from "../../src/dashboard/run-projection";

// ---------------------------------------------------------------------------
// Minimal fixture helpers
// ---------------------------------------------------------------------------

const makeRun = (
  id: string,
  planId: string,
  status: RunRecord["status"] = "running"
): RunRecord => ({
  version: CONTRACT_VERSION,
  id,
  planId,
  status,
  attempt: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const makePlan = (id: string): PlanRecord => ({
  version: CONTRACT_VERSION,
  id,
  title: `plan-${id}`,
  goal: `goal-${id}`,
  status: "draft",
  repositories: [
    {
      repositoryId: "repo-1",
      role: "executable",
      access: "read_write",
      mountAlias: "app"
    }
  ],
  primaryExecutableRepositoryId: "repo-1",
  graphSource: "digraph { start -> exit }",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const makeMilestoneRun = (
  id: string,
  runId: string,
  status: MilestoneRunRecord["status"] = "succeeded"
): MilestoneRunRecord => ({
  version: CONTRACT_VERSION,
  id,
  runId,
  milestoneId: "ms-1",
  nodeId: "node-1",
  status,
  startedAt: new Date().toISOString()
});

const makeArtifact = (id: string, runId: string): ArtifactRecord => ({
  version: CONTRACT_VERSION,
  id,
  runId,
  type: "log",
  title: `artifact-${id}`,
  uri: `file:///artifacts/${id}`,
  createdAt: new Date().toISOString()
});

const makeHandoffEvent = (
  id: string,
  runId: string,
  handoffEnvelope: HandoffEnvelope
): ExtensionEvent => ({
  version: CONTRACT_VERSION,
  id,
  runId,
  entityType: "handoff",
  entityId: handoffEnvelope.id,
  kind: "handoff.created",
  timestamp: new Date().toISOString(),
  payload: handoffEnvelope as Record<string, unknown>
});

const notImplemented = (): never => {
  throw new Error("not implemented");
};

const makeServices = (overrides: {
  run?: RunRecord | null;
  plan?: PlanRecord | null;
  milestoneRuns?: MilestoneRunRecord[];
  artifacts?: ArtifactRecord[];
  eventsByRunId?: Map<string, ExtensionEvent[]>;
}): StorageServices => {
  const run = overrides.run ?? null;
  const plan = overrides.plan ?? null;
  const milestoneRuns = overrides.milestoneRuns ?? [];
  const artifacts = overrides.artifacts ?? [];
  const eventsByRunId = overrides.eventsByRunId ?? new Map();

  return {
    repositoryRegistry: {
      save: notImplemented,
      getById: notImplemented,
      list: async () => notImplemented()
    },
    planRegistry: {
      save: notImplemented,
      getById: async (id: string) => (plan?.id === id ? plan : null),
      list: async () => notImplemented()
    },
    runRegistry: {
      save: notImplemented,
      getById: async (id: string) => (run?.id === id ? run : null),
      list: async () => notImplemented(),
      listActiveRuns: notImplemented
    },
    eventLog: {
      append: async () => notImplemented(),
      listByRun: async (runId: string) => eventsByRunId.get(runId) ?? []
    },
    snapshotProjector: {
      project: async () => notImplemented()
    },
    milestoneRunRegistry: {
      save: notImplemented,
      getById: notImplemented,
      listByRunId: async (runId: string) =>
        milestoneRuns.filter((m) => m.runId === runId),
      listByMilestoneId: notImplemented
    },
    milestoneRegistry: {
      save: notImplemented,
      getById: notImplemented,
      list: notImplemented,
      listByPlanId: notImplemented
    },
    artifactRegistry: {
      save: notImplemented,
      getById: notImplemented,
      listByRunId: async (runId: string) =>
        artifacts.filter((a) => a.runId === runId),
      listByNodeId: notImplemented
    }
  };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("projectRun", () => {
  it("returns run with parent plan, milestoneRuns, and artifacts", async () => {
    const run = makeRun("r1", "p1");
    const plan = makePlan("p1");
    const milestoneRuns = [
      makeMilestoneRun("mr1", "r1"),
      makeMilestoneRun("mr2", "r1")
    ];
    const artifacts = [makeArtifact("a1", "r1"), makeArtifact("a2", "r1")];

    const services = makeServices({
      run,
      plan,
      milestoneRuns,
      artifacts,
      eventsByRunId: new Map()
    });

    const state = await projectRun("r1", services);

    expect(state.run).toStrictEqual(run);
    expect(state.plan).toStrictEqual(plan);
    expect(state.milestoneRuns).toHaveLength(2);
    expect(state.milestoneRuns).toStrictEqual(milestoneRuns);
    expect(state.artifacts).toHaveLength(2);
    expect(state.artifacts).toStrictEqual(artifacts);
    expect(state.currentHandoff).toBeUndefined();
  });

  it("returns currentHandoff from the latest handoff.created event", async () => {
    const run = makeRun("r1", "p1");
    const plan = makePlan("p1");

    const handoff1: HandoffEnvelope = {
      version: CONTRACT_VERSION,
      id: "h1",
      runId: "r1",
      nodeId: "node-1",
      fromRole: "orchestrator",
      toRole: "planner",
      task: "plan the work",
      reason: "initial handoff",
      createdAt: "2025-01-01T10:00:00Z"
    };

    const handoff2: HandoffEnvelope = {
      version: CONTRACT_VERSION,
      id: "h2",
      runId: "r1",
      nodeId: "node-1",
      fromRole: "planner",
      toRole: "implementer",
      task: "implement the work",
      reason: "plan complete",
      createdAt: "2025-01-01T11:00:00Z"
    };

    const events = [
      makeHandoffEvent("e1", "r1", handoff1),
      makeHandoffEvent("e2", "r1", handoff2)
    ];

    const services = makeServices({
      run,
      plan,
      milestoneRuns: [],
      artifacts: [],
      eventsByRunId: new Map([["r1", events]])
    });

    const state = await projectRun("r1", services);

    // Should return the LAST (most recent) handoff
    expect(state.currentHandoff).toBeDefined();
    expect(state.currentHandoff?.id).toBe("h2");
    expect(state.currentHandoff?.fromRole).toBe("planner");
    expect(state.currentHandoff?.toRole).toBe("implementer");
  });

  it("omits currentHandoff when no handoff.created events exist", async () => {
    const run = makeRun("r1", "p1");
    const plan = makePlan("p1");

    const otherEvent: ExtensionEvent = {
      version: CONTRACT_VERSION,
      id: "e1",
      runId: "r1",
      entityType: "run",
      entityId: "r1",
      kind: "status.changed",
      timestamp: new Date().toISOString(),
      payload: {}
    };

    const services = makeServices({
      run,
      plan,
      milestoneRuns: [],
      artifacts: [],
      eventsByRunId: new Map([["r1", [otherEvent]]])
    });

    const state = await projectRun("r1", services);

    expect(state.currentHandoff).toBeUndefined();
  });

  it("throws when run not found", async () => {
    const services = makeServices({
      run: null,
      plan: null,
      milestoneRuns: [],
      artifacts: [],
      eventsByRunId: new Map()
    });

    await expect(projectRun("nonexistent", services)).rejects.toThrow(
      "Run not found: nonexistent"
    );
  });

  it("throws when parent plan not found", async () => {
    const run = makeRun("r1", "p1");

    const services = makeServices({
      run,
      plan: null,
      milestoneRuns: [],
      artifacts: [],
      eventsByRunId: new Map()
    });

    await expect(projectRun("r1", services)).rejects.toThrow(
      "Plan not found for run r1: p1"
    );
  });

  it("filters artifacts and milestoneRuns by runId", async () => {
    const run = makeRun("r1", "p1");
    const plan = makePlan("p1");

    const milestoneRuns = [
      makeMilestoneRun("mr1", "r1"),
      makeMilestoneRun("mr2", "r1"),
      makeMilestoneRun("mr3", "r2") // different run
    ];

    const artifacts = [
      makeArtifact("a1", "r1"),
      makeArtifact("a2", "r2") // different run
    ];

    const services = makeServices({
      run,
      plan,
      milestoneRuns,
      artifacts,
      eventsByRunId: new Map()
    });

    const state = await projectRun("r1", services);

    expect(state.milestoneRuns).toHaveLength(2);
    expect(state.milestoneRuns.every((m) => m.runId === "r1")).toBe(true);
    expect(state.artifacts).toHaveLength(1);
    expect(state.artifacts[0]?.runId).toBe("r1");
  });

  it("returns empty arrays when no milestoneRuns or artifacts exist", async () => {
    const run = makeRun("r1", "p1");
    const plan = makePlan("p1");

    const services = makeServices({
      run,
      plan,
      milestoneRuns: [],
      artifacts: [],
      eventsByRunId: new Map()
    });

    const state = await projectRun("r1", services);

    expect(state.milestoneRuns).toStrictEqual([]);
    expect(state.artifacts).toStrictEqual([]);
  });
});
