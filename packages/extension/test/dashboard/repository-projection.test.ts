import { describe, expect, it } from "vitest";

import {
  CONTRACT_VERSION,
  type ExtensionEvent,
  type PlanRecord,
  type RepositoryRecord,
  type RunRecord
} from "@attractor/shared";

import { type StorageServices } from "../../src/storage/services";
import { projectRepository } from "../../src/dashboard/repository-projection";

// ---------------------------------------------------------------------------
// Minimal fixture helpers
// ---------------------------------------------------------------------------

const makeRepo = (id: string): RepositoryRecord => ({
  version: CONTRACT_VERSION,
  id,
  name: `repo-${id}`,
  rootUri: `/workspace/${id}`,
  defaultBranch: "main",
  labels: []
});

const makePlan = (id: string, repoId: string): PlanRecord => ({
  version: CONTRACT_VERSION,
  id,
  title: `plan-${id}`,
  goal: `goal-${id}`,
  status: "draft",
  repositories: [
    {
      repositoryId: repoId,
      role: "executable",
      access: "read_write",
      mountAlias: "app"
    }
  ],
  primaryExecutableRepositoryId: repoId,
  graphSource: "digraph { start -> exit }",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const makeRun = (id: string, planId: string): RunRecord => ({
  version: CONTRACT_VERSION,
  id,
  planId,
  status: "completed",
  attempt: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const makeEvent = (
  id: string,
  runId: string,
  kind: string,
  timestamp: string
): ExtensionEvent => ({
  version: CONTRACT_VERSION,
  id,
  runId,
  entityType: "run",
  entityId: runId,
  kind: kind as ExtensionEvent["kind"],
  timestamp,
  payload: {}
});

const notImplemented = (): never => {
  throw new Error("not implemented");
};

const makeServices = (overrides: {
  repositoriesById?: Record<string, RepositoryRecord>;
  plansForRepo?: PlanRecord[];
  runsForPlans?: RunRecord[];
  eventsByRunId?: Record<string, ExtensionEvent[]>;
}): StorageServices => {
  const repositoriesById = overrides.repositoriesById ?? {};
  const plansForRepo = overrides.plansForRepo ?? [];
  const runsForPlans = overrides.runsForPlans ?? [];
  const eventsByRunId = overrides.eventsByRunId ?? {};

  return {
    repositoryRegistry: {
      save: notImplemented,
      getById: async (id) => repositoriesById[id] ?? null,
      list: notImplemented
    },
    planRegistry: {
      save: notImplemented,
      getById: notImplemented,
      list: async () => plansForRepo
    },
    runRegistry: {
      save: notImplemented,
      getById: notImplemented,
      list: async () => runsForPlans,
      listActiveRuns: notImplemented
    },
    eventLog: {
      append: notImplemented,
      listByRun: async (runId) => eventsByRunId[runId] ?? []
    },
    snapshotProjector: {
      project: notImplemented
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
      listByPlanId: notImplemented
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

describe("projectRepository", () => {
  it("returns repository and linked plans (plans whose repositories include the given repoId)", async () => {
    const repo = makeRepo("repo-1");
    const plan1 = makePlan("plan-1", "repo-1");
    const plan2 = makePlan("plan-2", "repo-2"); // different repo

    const services = makeServices({
      repositoriesById: { "repo-1": repo },
      plansForRepo: [plan1, plan2]
    });

    const state = await projectRepository("repo-1", services);

    expect(state.repository).toStrictEqual(repo);
    expect(state.plans).toHaveLength(1);
    expect(state.plans[0]).toStrictEqual(plan1);
  });

  it("returns only runs belonging to those plans", async () => {
    const repo = makeRepo("repo-1");
    const plan1 = makePlan("plan-1", "repo-1");
    const plan2 = makePlan("plan-2", "repo-1");

    const run1 = makeRun("run-1", "plan-1");
    const run2 = makeRun("run-2", "plan-1");
    const run3 = makeRun("run-3", "plan-other"); // different plan

    const services = makeServices({
      repositoriesById: { "repo-1": repo },
      plansForRepo: [plan1, plan2],
      runsForPlans: [run1, run2, run3]
    });

    const state = await projectRepository("repo-1", services);

    expect(state.runs).toHaveLength(2);
    expect(state.runs.map((r) => r.id)).toEqual(["run-1", "run-2"]);
  });

  it("merges event logs from multiple runs into sorted activity", async () => {
    const repo = makeRepo("repo-1");
    const plan = makePlan("plan-1", "repo-1");
    const run1 = makeRun("run-1", "plan-1");
    const run2 = makeRun("run-2", "plan-1");

    const event1 = makeEvent("e1", "run-1", "created", "2025-01-01T10:00:00Z");
    const event2 = makeEvent("e2", "run-2", "created", "2025-01-01T09:00:00Z");
    const event3 = makeEvent(
      "e3",
      "run-1",
      "completed",
      "2025-01-01T11:00:00Z"
    );

    const services = makeServices({
      repositoriesById: { "repo-1": repo },
      plansForRepo: [plan],
      runsForPlans: [run1, run2],
      eventsByRunId: {
        "run-1": [event1, event3],
        "run-2": [event2]
      }
    });

    const state = await projectRepository("repo-1", services);

    expect(state.activity).toHaveLength(3);
    // After toHaveLength assertion, we know the array has exactly 3 elements
    expect(state.activity[0]!.id).toBe("e2"); // 09:00
    expect(state.activity[1]!.id).toBe("e1"); // 10:00
    expect(state.activity[2]!.id).toBe("e3"); // 11:00
  });

  it("returns empty arrays for plans/runs/activity when repo has no plans", async () => {
    const repo = makeRepo("repo-1");

    const services = makeServices({
      repositoriesById: { "repo-1": repo },
      plansForRepo: [],
      runsForPlans: [],
      eventsByRunId: {}
    });

    const state = await projectRepository("repo-1", services);

    expect(state.repository).toStrictEqual(repo);
    expect(state.plans).toStrictEqual([]);
    expect(state.runs).toStrictEqual([]);
    expect(state.activity).toStrictEqual([]);
  });

  it("throws when repository not found", async () => {
    const services = makeServices({
      repositoriesById: {}
    });

    await expect(projectRepository("nonexistent", services)).rejects.toThrow(
      "Repository not found: nonexistent"
    );
  });
});
