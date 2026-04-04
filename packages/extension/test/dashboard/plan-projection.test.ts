import { describe, expect, it } from "vitest";

import {
  CONTRACT_VERSION,
  type ExtensionEvent,
  type MilestoneRecord,
  type PlanRecord,
  type RepositoryRecord,
  type RunRecord
} from "@attractor/shared";

import { type StorageServices } from "../../src/storage/services";
import { projectPlan } from "../../src/dashboard/plan-projection";

// ---------------------------------------------------------------------------
// Minimal fixture helpers
// ---------------------------------------------------------------------------

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

const makeRun = (
  id: string,
  planId: string,
  status: RunRecord["status"] = "completed"
): RunRecord => ({
  version: CONTRACT_VERSION,
  id,
  planId,
  status,
  attempt: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const makeMilestone = (id: string, planId: string): MilestoneRecord => ({
  version: CONTRACT_VERSION,
  id,
  planId,
  title: `milestone-${id}`,
  order: 0,
  status: "pending",
  acceptanceCriteria: [],
  nodeIds: []
});

const makeValidationEvent = (
  id: string,
  runId: string,
  timestamp: string
): ExtensionEvent => {
  const event: Partial<ExtensionEvent> = {
    version: CONTRACT_VERSION,
    id,
    runId,
    entityType: "run",
    entityId: runId,
    kind: "validation.failed",
    timestamp,
    payload: {}
  };
  return event as ExtensionEvent;
};

const notImplemented = (): never => {
  throw new Error("not implemented");
};

const makeServices = (overrides: {
  plan?: PlanRecord | null;
  milestones?: MilestoneRecord[];
  allRuns?: RunRecord[];
  eventsByRunId?: Map<string, ExtensionEvent[]>;
  repositoriesById?: Map<string, RepositoryRecord>;
}): StorageServices => {
  const plan = overrides.plan ?? null;
  const milestones = overrides.milestones ?? [];
  const allRuns = overrides.allRuns ?? [];
  const eventsByRunId = overrides.eventsByRunId ?? new Map();
  const repositoriesById = overrides.repositoriesById ?? new Map();

  return {
    repositoryRegistry: {
      save: notImplemented,
      getById: async (id: string) => repositoriesById.get(id) ?? null,
      list: async () => notImplemented()
    },
    planRegistry: {
      save: notImplemented,
      getById: async (id: string) => (plan?.id === id ? plan : null),
      list: async () => notImplemented()
    },
    runRegistry: {
      save: notImplemented,
      getById: notImplemented,
      list: async () => allRuns,
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
      listByRunId: notImplemented,
      listByMilestoneId: notImplemented
    },
    milestoneRegistry: {
      save: notImplemented,
      getById: notImplemented,
      list: notImplemented,
      listByPlanId: async (planId: string) =>
        milestones.filter((m) => m.planId === planId)
    },
    artifactRegistry: {
      save: notImplemented,
      getById: notImplemented,
      listByRunId: notImplemented,
      listByNodeId: notImplemented
    }
  };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("projectPlan", () => {
  it("returns plan with milestones from milestoneRegistry", async () => {
    const plan = makePlan("p1");
    const milestones = [makeMilestone("m1", "p1"), makeMilestone("m2", "p1")];

    const services = makeServices({
      plan,
      milestones,
      allRuns: []
    });

    const state = await projectPlan("p1", services);

    expect(state.plan).toStrictEqual(plan);
    expect(state.milestones).toStrictEqual(milestones);
    expect(state.milestones).toHaveLength(2);
  });

  it("returns run history filtered by planId", async () => {
    const plan = makePlan("p1");
    const runs = [
      makeRun("r1", "p1"),
      makeRun("r2", "p1"),
      makeRun("r3", "p2") // different plan
    ];

    const services = makeServices({
      plan,
      milestones: [],
      allRuns: runs
    });

    const state = await projectPlan("p1", services);

    expect(state.history).toHaveLength(2);
    expect(state.history.map((r) => r.id)).toEqual(["r1", "r2"]);
  });

  it("extracts only validation.failed events across plan runs", async () => {
    const plan = makePlan("p1");
    const runs = [makeRun("r1", "p1"), makeRun("r2", "p1")];

    const validationEvent1 = makeValidationEvent(
      "v1",
      "r1",
      "2025-01-01T10:00:00Z"
    );
    const validationEvent2 = makeValidationEvent(
      "v2",
      "r2",
      "2025-01-01T11:00:00Z"
    );
    const otherEvent: ExtensionEvent = {
      version: CONTRACT_VERSION,
      id: "other",
      runId: "r1",
      entityType: "run",
      entityId: "r1",
      kind: "status.changed",
      timestamp: "2025-01-01T09:00:00Z",
      payload: {}
    };

    const eventsByRunId = new Map<string, ExtensionEvent[]>([
      ["r1", [otherEvent, validationEvent1]],
      ["r2", [validationEvent2]]
    ]);

    const services = makeServices({
      plan,
      milestones: [],
      allRuns: runs,
      eventsByRunId
    });

    const state = await projectPlan("p1", services);

    expect(state.validationEvents).toHaveLength(2);
    expect(state.validationEvents[0]!.id).toBe("v1");
    expect(state.validationEvents[1]!.id).toBe("v2");
  });

  it("returns empty arrays when plan has no runs or milestones", async () => {
    const plan = makePlan("p1");

    const services = makeServices({
      plan,
      milestones: [],
      allRuns: []
    });

    const state = await projectPlan("p1", services);

    expect(state.milestones).toStrictEqual([]);
    expect(state.history).toStrictEqual([]);
    expect(state.validationEvents).toStrictEqual([]);
  });

  it("throws when plan not found", async () => {
    const services = makeServices({
      plan: null,
      milestones: [],
      allRuns: []
    });

    await expect(projectPlan("nonexistent", services)).rejects.toThrow(
      "Plan not found: nonexistent"
    );
  });

  it("sorts validation events by timestamp ascending", async () => {
    const plan = makePlan("p1");
    const runs = [makeRun("r1", "p1")];

    const validationEvents = [
      makeValidationEvent("v1", "r1", "2025-01-01T12:00:00Z"),
      makeValidationEvent("v2", "r1", "2025-01-01T10:00:00Z"),
      makeValidationEvent("v3", "r1", "2025-01-01T11:00:00Z")
    ];

    const services = makeServices({
      plan,
      milestones: [],
      allRuns: runs,
      eventsByRunId: new Map([["r1", validationEvents]])
    });

    const state = await projectPlan("p1", services);

    expect(state.validationEvents).toHaveLength(3);
    expect(state.validationEvents[0]!.id).toBe("v2");
    expect(state.validationEvents[1]!.id).toBe("v3");
    expect(state.validationEvents[2]!.id).toBe("v1");
  });

  it("enriches plan repositories with names from repositoryRegistry", async () => {
    const plan = makePlan("p1");
    const repoRecord: RepositoryRecord = {
      version: CONTRACT_VERSION,
      id: "repo-1",
      name: "my-app",
      rootUri: "/workspace/my-app",
      defaultBranch: "main",
      labels: []
    };
    const repositoriesById = new Map<string, RepositoryRecord>([
      ["repo-1", repoRecord]
    ]);

    const services = makeServices({
      plan,
      milestones: [],
      allRuns: [],
      repositoriesById
    });

    const state = await projectPlan("p1", services);

    expect(state.plan.repositories[0]!.name).toBe("my-app");
  });

  it("leaves repository name undefined when not found in registry", async () => {
    const plan = makePlan("p1");

    const services = makeServices({
      plan,
      milestones: [],
      allRuns: [],
      repositoriesById: new Map()
    });

    const state = await projectPlan("p1", services);

    expect(state.plan.repositories[0]!.name).toBeUndefined();
  });
});
