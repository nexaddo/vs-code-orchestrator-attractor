import { describe, expect, it, vi } from "vitest";

import {
  type RepositoryRecord,
  type PlanRecord,
  type MilestoneRecord
} from "@attractor/shared";

import { type StorageServices } from "../../src/storage/services";
import {
  handleWebviewMessage,
  type WebviewPanelLike
} from "../../src/dashboard/bridge";

// ---------------------------------------------------------------------------
// Minimal fixture helpers
// ---------------------------------------------------------------------------

const notImplemented = (): never => {
  throw new Error("not implemented");
};

const makeRepo = (id: string): RepositoryRecord => ({
  version: 1,
  id,
  name: `repo-${id}`,
  rootUri: `/workspace/${id}`,
  defaultBranch: "main",
  labels: []
});

const makePlan = (id: string, repoId: string): PlanRecord => ({
  version: 1,
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

const makeMilestone = (id: string, planId: string): MilestoneRecord => ({
  version: 1,
  id,
  planId,
  title: `milestone-${id}`,
  order: 0,
  status: "pending",
  acceptanceCriteria: ["criterion 1"],
  nodeIds: ["node1"]
});

const makeServices = (overrides: {
  repositories?: RepositoryRecord[];
  planCount?: number;
  activeRunCount?: number;
  repositoryById?: (id: string) => RepositoryRecord | null;
  plans?: PlanRecord[];
  milestones?: MilestoneRecord[];
}): StorageServices => {
  const repos = overrides.repositories ?? [];
  const planStubs =
    overrides.plans ??
    Array.from(
      { length: overrides.planCount ?? 0 },
      (_, i) => ({ id: `p${i}` }) as never
    );
  const activeRunStubs = Array.from(
    { length: overrides.activeRunCount ?? 0 },
    (_, i) =>
      ({
        version: 1,
        id: `run-${i}`,
        planId: "plan-1",
        status: "running",
        attempt: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }) as never
  );

  return {
    repositoryRegistry: {
      save: notImplemented,
      getById: async (id: string) => {
        if (overrides.repositoryById) {
          return overrides.repositoryById(id);
        }
        return repos.find((r) => r.id === id) ?? null;
      },
      list: async () => repos
    },
    planRegistry: {
      save: notImplemented,
      getById: async (id: string) => {
        return planStubs.find((p) => p.id === id) ?? null;
      },
      list: async () => planStubs
    },
    runRegistry: {
      save: notImplemented,
      getById: notImplemented,
      list: async () => activeRunStubs,
      listActiveRuns: notImplemented
    },
    eventLog: { append: notImplemented, listByRun: async () => [] } as never,
    snapshotProjector: { project: notImplemented } as never,
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
      listByPlanId: async () => overrides.milestones ?? []
    },
    artifactRegistry: {
      save: notImplemented,
      getById: notImplemented,
      listByRunId: notImplemented,
      listByNodeId: notImplemented
    }
  };
};

const makePanel = (): { panel: WebviewPanelLike; posted: unknown[] } => {
  const posted: unknown[] = [];
  const panel: WebviewPanelLike = {
    postMessage: (msg) => {
      posted.push(msg);
    }
  };
  return { panel, posted };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("handleWebviewMessage — bridge", () => {
  it("responds to a ready message with a valid overview.state message", async () => {
    const services = makeServices({
      repositories: [makeRepo("r1"), makeRepo("r2")],
      planCount: 3,
      activeRunCount: 1
    });
    const { panel, posted } = makePanel();

    await handleWebviewMessage(
      {
        version: 1,
        requestId: "req-abc",
        type: "ready",
        payload: {}
      },
      services,
      panel
    );

    expect(posted).toHaveLength(1);
    const msg = posted[0] as {
      version: number;
      requestId: string;
      type: string;
      payload: {
        repositories: RepositoryRecord[];
        activeRuns: unknown[];
        recentFailures: unknown[];
        stats: {
          totalRepos: number;
          totalPlans: number;
          activeRuns: number;
          pausedRuns: number;
          failedRuns24h: number;
        };
      };
    };
    expect(msg.version).toBe(1);
    expect(msg.requestId).toBe("req-abc");
    expect(msg.type).toBe("overview.state");
    expect(msg.payload.stats).toStrictEqual({
      totalRepos: 2,
      totalPlans: 3,
      activeRuns: 1,
      pausedRuns: 0,
      failedRuns24h: 0
    });
    expect(msg.payload.repositories).toHaveLength(2);
  });

  it("echoes the requestId from the inbound ready message", async () => {
    const services = makeServices({});
    const { panel, posted } = makePanel();

    await handleWebviewMessage(
      { version: 1, requestId: "echo-this-id", type: "ready", payload: {} },
      services,
      panel
    );

    const msg = posted[0] as { requestId: string };
    expect(msg.requestId).toBe("echo-this-id");
  });

  it("posts zero counts and empty arrays when storage is empty", async () => {
    const services = makeServices({});
    const { panel, posted } = makePanel();

    await handleWebviewMessage(
      { version: 1, requestId: "req-zero", type: "ready", payload: {} },
      services,
      panel
    );

    expect(posted).toHaveLength(1);
    const msg = posted[0] as {
      payload: {
        repositories: unknown[];
        activeRuns: unknown[];
        recentFailures: unknown[];
        stats: {
          totalRepos: number;
          totalPlans: number;
          activeRuns: number;
          pausedRuns: number;
          failedRuns24h: number;
        };
      };
    };
    expect(msg.payload.stats).toStrictEqual({
      totalRepos: 0,
      totalPlans: 0,
      activeRuns: 0,
      pausedRuns: 0,
      failedRuns24h: 0
    });
    expect(msg.payload.repositories).toStrictEqual([]);
    expect(msg.payload.activeRuns).toStrictEqual([]);
    expect(msg.payload.recentFailures).toStrictEqual([]);
  });

  it("does not duplicate count logic — delegates entirely to projectOverview", async () => {
    // Verify that only one postMessage call happens and the payload originates
    // from the projector (not bridge-internal logic).
    const listMock = vi.fn().mockResolvedValue([]);
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
        list: listMock,
        listActiveRuns: notImplemented
      },
      eventLog: { append: notImplemented, listByRun: notImplemented } as never,
      snapshotProjector: { project: notImplemented } as never,
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
    const { panel, posted } = makePanel();

    await handleWebviewMessage(
      { version: 1, requestId: "req-delegate", type: "ready", payload: {} },
      services,
      panel
    );

    expect(listMock).toHaveBeenCalledOnce();
    expect(posted).toHaveLength(1);
  });

  describe("query routes", () => {
    it("repository.open posts repository.state with correct payload", async () => {
      const repo1 = makeRepo("r1");
      const plan1 = makePlan("p1", "r1");
      const services = makeServices({
        repositories: [repo1],
        plans: [plan1]
      });
      const { panel, posted } = makePanel();

      await handleWebviewMessage(
        {
          version: 1,
          requestId: "req-repo",
          type: "repository.open",
          payload: { repositoryId: "r1" }
        },
        services,
        panel
      );

      expect(posted).toHaveLength(1);
      const msg = posted[0] as {
        version: number;
        requestId: string;
        type: string;
        payload: unknown;
      };
      expect(msg.version).toBe(1);
      expect(msg.requestId).toBe("req-repo");
      expect(msg.type).toBe("repository.state");
      expect(msg.payload).toBeDefined();
    });

    it("repository.open echoes the requestId", async () => {
      const services = makeServices({
        repositories: [makeRepo("r1")],
        plans: [makePlan("p1", "r1")]
      });
      const { panel, posted } = makePanel();

      await handleWebviewMessage(
        {
          version: 1,
          requestId: "echo-repo-123",
          type: "repository.open",
          payload: { repositoryId: "r1" }
        },
        services,
        panel
      );

      const msg = posted[0] as { requestId: string };
      expect(msg.requestId).toBe("echo-repo-123");
    });

    it("milestone.open posts plan.state with correct payload", async () => {
      const plan1 = makePlan("p1", "r1");
      const milestone1 = makeMilestone("m1", "p1");
      const services = makeServices({
        plans: [plan1],
        milestones: [milestone1]
      });
      const { panel, posted } = makePanel();

      await handleWebviewMessage(
        {
          version: 1,
          requestId: "req-milestone",
          type: "milestone.open",
          payload: { planId: "p1" }
        },
        services,
        panel
      );

      expect(posted).toHaveLength(1);
      const msg = posted[0] as {
        version: number;
        requestId: string;
        type: string;
        payload: unknown;
      };
      expect(msg.version).toBe(1);
      expect(msg.requestId).toBe("req-milestone");
      expect(msg.type).toBe("plan.state");
      expect(msg.payload).toBeDefined();
    });

    it("milestone.open echoes the requestId", async () => {
      const services = makeServices({
        plans: [makePlan("p1", "r1")]
      });
      const { panel, posted } = makePanel();

      await handleWebviewMessage(
        {
          version: 1,
          requestId: "echo-milestone-456",
          type: "milestone.open",
          payload: { planId: "p1" }
        },
        services,
        panel
      );

      const msg = posted[0] as { requestId: string };
      expect(msg.requestId).toBe("echo-milestone-456");
    });

    it("graph.focus posts graph.update with correct payload", async () => {
      const services = makeServices({});
      const { panel, posted } = makePanel();

      await handleWebviewMessage(
        {
          version: 1,
          requestId: "req-graph",
          type: "graph.focus",
          payload: { nodeId: "node-1", status: "running" }
        },
        services,
        panel
      );

      expect(posted).toHaveLength(1);
      const msg = posted[0] as {
        version: number;
        requestId: string;
        type: string;
        payload: { nodeId: string; status: string };
      };
      expect(msg.version).toBe(1);
      expect(msg.requestId).toBe("req-graph");
      expect(msg.type).toBe("graph.update");
      expect(msg.payload.nodeId).toBe("node-1");
      expect(msg.payload.status).toBe("running");
    });

    it("graph.focus echoes the requestId", async () => {
      const services = makeServices({});
      const { panel, posted } = makePanel();

      await handleWebviewMessage(
        {
          version: 1,
          requestId: "echo-graph-789",
          type: "graph.focus",
          payload: { nodeId: "node-1", status: "succeeded" }
        },
        services,
        panel
      );

      const msg = posted[0] as { requestId: string };
      expect(msg.requestId).toBe("echo-graph-789");
    });

    it("graph.focus handles all valid status values", async () => {
      const statuses = [
        "queued",
        "running",
        "blocked",
        "failed",
        "succeeded",
        "canceled"
      ] as const;
      for (const status of statuses) {
        const services = makeServices({});
        const { panel, posted } = makePanel();

        await handleWebviewMessage(
          {
            version: 1,
            requestId: `req-${status}`,
            type: "graph.focus",
            payload: { nodeId: "node-1", status }
          },
          services,
          panel
        );

        expect(posted).toHaveLength(1);
        const msg = posted[0] as { payload: { status: string } };
        expect(msg.payload.status).toBe(status);
      }
    });
  });

  describe("command routes — no-op (deferred to runtime)", () => {
    it("plan.create does not post any response", async () => {
      const services = makeServices({});
      const { panel, posted } = makePanel();

      await handleWebviewMessage(
        {
          version: 1,
          requestId: "req-create",
          type: "plan.create",
          payload: { title: "New Plan" }
        },
        services,
        panel
      );

      expect(posted).toHaveLength(0);
    });

    it("plan.run does not post any response", async () => {
      const services = makeServices({});
      const { panel, posted } = makePanel();

      await handleWebviewMessage(
        {
          version: 1,
          requestId: "req-run",
          type: "plan.run",
          payload: { planId: "p1" }
        },
        services,
        panel
      );

      expect(posted).toHaveLength(0);
    });

    it("run.resume does not post any response", async () => {
      const services = makeServices({});
      const { panel, posted } = makePanel();

      await handleWebviewMessage(
        {
          version: 1,
          requestId: "req-resume",
          type: "run.resume",
          payload: { runId: "run-1" }
        },
        services,
        panel
      );

      expect(posted).toHaveLength(0);
    });

    it("run.cancel does not post any response", async () => {
      const services = makeServices({});
      const { panel, posted } = makePanel();

      await handleWebviewMessage(
        {
          version: 1,
          requestId: "req-cancel",
          type: "run.cancel",
          payload: { runId: "run-1" }
        },
        services,
        panel
      );

      expect(posted).toHaveLength(0);
    });

    it("run.retry does not post any response", async () => {
      const services = makeServices({});
      const { panel, posted } = makePanel();

      await handleWebviewMessage(
        {
          version: 1,
          requestId: "req-retry",
          type: "run.retry",
          payload: { runId: "run-1" }
        },
        services,
        panel
      );

      expect(posted).toHaveLength(0);
    });
  });
});
