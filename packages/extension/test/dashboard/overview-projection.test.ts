import { describe, expect, it } from "vitest";

import {
  CONTRACT_VERSION,
  type PlanRecord,
  type RepositoryRecord,
  type RunRecord
} from "@attractor/shared";

import { type StorageServices } from "../../src/storage/services";
import { projectOverview } from "../../src/dashboard/overview-projection";

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

const makeRun = (id: string, status: RunRecord["status"]): RunRecord => ({
  version: CONTRACT_VERSION,
  id,
  planId: "plan-1",
  status,
  attempt: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const notImplemented = (): never => {
  throw new Error("not implemented");
};

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

const makeServices = (overrides: {
  repositoryList?: RepositoryRecord[];
  planCount?: number;
  allRuns?: RunRecord[];
}): StorageServices => {
  const repos = overrides.repositoryList ?? [];
  const planCount = overrides.planCount ?? 0;
  const allRuns = overrides.allRuns ?? [];

  const planStubs = Array.from({ length: planCount }, (_, i) =>
    makePlan(`p${i}`)
  );

  return {
    repositoryRegistry: {
      save: notImplemented,
      getById: notImplemented,
      list: async () => repos
    },
    planRegistry: {
      save: notImplemented,
      getById: notImplemented,
      list: async () => planStubs
    },
    runRegistry: {
      save: notImplemented,
      getById: notImplemented,
      list: async () => allRuns,
      listActiveRuns: notImplemented
    },
    eventLog: {
      append: async () => notImplemented(),
      listByRun: async () => notImplemented()
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

describe("projectOverview", () => {
  it("returns zero counts and empty arrays when storage is empty", async () => {
    const services = makeServices({});

    const state = await projectOverview(services);

    expect(state.repositories).toStrictEqual([]);
    expect(state.activeRuns).toStrictEqual([]);
    expect(state.recentFailures).toStrictEqual([]);
    expect(state.stats).toStrictEqual({
      totalRepos: 0,
      totalPlans: 0,
      activeRuns: 0,
      pausedRuns: 0,
      failedRuns24h: 0
    });
  });

  it("counts mixed populations correctly", async () => {
    const allRuns = [
      makeRun("run-1", "running"),
      makeRun("run-2", "paused"),
      makeRun("run-3", "failed")
    ];
    const services = makeServices({
      repositoryList: [makeRepo("r1"), makeRepo("r2")],
      planCount: 3,
      allRuns
    });

    const state = await projectOverview(services);

    expect(state.repositories).toHaveLength(2);
    expect(state.activeRuns).toHaveLength(2);
    expect(state.recentFailures).toHaveLength(1);
    expect(state.stats).toStrictEqual({
      totalRepos: 2,
      totalPlans: 3,
      activeRuns: 2,
      pausedRuns: 1,
      failedRuns24h: 1
    });
  });

  it("passes repositories through structurally", async () => {
    const repos = [makeRepo("r1"), makeRepo("r2")];

    const services = makeServices({ repositoryList: repos });

    const state = await projectOverview(services);

    expect(state.repositories).toStrictEqual(repos);
  });

  it("correctly separates active runs (queued | running | paused)", async () => {
    const allRuns = [
      makeRun("run-q", "queued"),
      makeRun("run-r", "running"),
      makeRun("run-p", "paused")
    ];

    const services = makeServices({ allRuns });

    const state = await projectOverview(services);

    expect(state.activeRuns).toHaveLength(3);
    expect(
      state.activeRuns.every((r) =>
        ["queued", "running", "paused"].includes(r.status)
      )
    ).toBe(true);
    expect(state.recentFailures).toHaveLength(0);
  });

  it("counts paused runs correctly in stats", async () => {
    const allRuns = [
      makeRun("run-1", "queued"),
      makeRun("run-2", "paused"),
      makeRun("run-3", "paused"),
      makeRun("run-4", "running")
    ];

    const services = makeServices({ allRuns });

    const state = await projectOverview(services);

    expect(state.stats.pausedRuns).toBe(2);
    expect(state.stats.activeRuns).toBe(4); // all three statuses: queued + running + paused
  });
});
