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
  activeRuns?: RunRecord[];
}): StorageServices => {
  const repos = overrides.repositoryList ?? [];
  const planCount = overrides.planCount ?? 0;
  const activeRuns = overrides.activeRuns ?? [];

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
      list: notImplemented,
      listActiveRuns: async () => activeRuns
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
  it("returns zero counts and empty repositories when storage is empty", async () => {
    const services = makeServices({});

    const state = await projectOverview(services);

    expect(state.summary).toStrictEqual({
      totalRepositories: 0,
      totalPlans: 0,
      activeRuns: 0
    });
    expect(state.repositories).toStrictEqual([]);
  });

  it("counts mixed populations correctly", async () => {
    const services = makeServices({
      repositoryList: [makeRepo("r1"), makeRepo("r2")],
      planCount: 3,
      activeRuns: [makeRun("run-1", "running")]
    });

    const state = await projectOverview(services);

    expect(state.summary).toStrictEqual({
      totalRepositories: 2,
      totalPlans: 3,
      activeRuns: 1
    });
    expect(state.repositories).toHaveLength(2);
  });

  it("passes repositories through structurally", async () => {
    const repos = [makeRepo("r1"), makeRepo("r2")];

    const services = makeServices({ repositoryList: repos });

    const state = await projectOverview(services);

    expect(state.repositories).toStrictEqual(repos);
  });

  it("counts only active runs as returned by listActiveRuns (queued | running | paused)", async () => {
    // The active-run rule is enforced by listActiveRuns(); here we verify that
    // projectOverview counts whatever listActiveRuns returns — exactly 3.
    const activeRuns = [
      makeRun("run-q", "queued"),
      makeRun("run-r", "running"),
      makeRun("run-p", "paused")
    ];

    const services = makeServices({ activeRuns });

    const state = await projectOverview(services);

    expect(state.summary.activeRuns).toBe(3);
  });

  it("counts only runs returned by listActiveRuns even when list() contains terminal runs", async () => {
    const allSixStatuses: RunRecord["status"][] = [
      "queued",
      "running",
      "paused",
      "completed",
      "failed",
      "canceled"
    ];
    const allRuns = allSixStatuses.map((s, i) => makeRun(`run-${i}`, s));
    const activeOnly = allRuns.filter((r) =>
      (["queued", "running", "paused"] as RunRecord["status"][]).includes(
        r.status
      )
    );

    // Use a custom services object so we can wire both list() and listActiveRuns()
    const services: StorageServices = {
      repositoryRegistry: {
        save: notImplemented,
        getById: notImplemented,
        list: async () => []
      },
      planRegistry: {
        save: notImplemented,
        getById: notImplemented,
        list: async () => []
      },
      runRegistry: {
        save: notImplemented,
        getById: notImplemented,
        list: async () => allRuns,
        listActiveRuns: async () => activeOnly
      },
      eventLog: {
        append: async () => notImplemented(),
        listByRun: async () => notImplemented()
      },
      snapshotProjector: { project: async () => notImplemented() },
      milestoneRunRegistry: {
        save: notImplemented,
        getById: notImplemented,
        listByRunId: notImplemented,
        listByMilestoneId: notImplemented
      },
      artifactRegistry: {
        save: notImplemented,
        getById: notImplemented,
        listByRunId: notImplemented,
        listByNodeId: notImplemented
      }
    };

    const state = await projectOverview(services);

    expect(state.summary.activeRuns).toBe(3);
    expect(state.summary.activeRuns).not.toBe(6);
  });
});
