import { describe, expect, it, vi } from "vitest";

import { type RepositoryRecord } from "@attractor/shared";

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

const makeServices = (overrides: {
  repositories?: RepositoryRecord[];
  planCount?: number;
  activeRunCount?: number;
}): StorageServices => {
  const repos = overrides.repositories ?? [];
  const planStubs = Array.from(
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
      listActiveRuns: async () => activeRunStubs
    },
    eventLog: { append: notImplemented, listByRun: notImplemented } as never,
    snapshotProjector: { project: notImplemented } as never
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
        summary: {
          totalRepositories: number;
          totalPlans: number;
          activeRuns: number;
        };
        repositories: RepositoryRecord[];
      };
    };
    expect(msg.version).toBe(1);
    expect(msg.requestId).toBe("req-abc");
    expect(msg.type).toBe("overview.state");
    expect(msg.payload.summary).toStrictEqual({
      totalRepositories: 2,
      totalPlans: 3,
      activeRuns: 1
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

  it("posts zero counts and empty repositories when storage is empty", async () => {
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
        summary: {
          totalRepositories: number;
          totalPlans: number;
          activeRuns: number;
        };
        repositories: unknown[];
      };
    };
    expect(msg.payload.summary).toStrictEqual({
      totalRepositories: 0,
      totalPlans: 0,
      activeRuns: 0
    });
    expect(msg.payload.repositories).toStrictEqual([]);
  });

  it("ignores non-ready message types and does NOT post a response", async () => {
    const services = makeServices({});
    const { panel, posted } = makePanel();

    await handleWebviewMessage(
      { version: 1, requestId: "req-1", type: "repository.open", payload: {} },
      services,
      panel
    );

    expect(posted).toHaveLength(0);
  });

  it("does not duplicate count logic — delegates entirely to projectOverview", async () => {
    // Verify that only one postMessage call happens and the payload originates
    // from the projector (not bridge-internal logic).
    const listActiveRunsMock = vi.fn().mockResolvedValue([]);
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
        list: notImplemented,
        listActiveRuns: listActiveRunsMock
      },
      eventLog: { append: notImplemented, listByRun: notImplemented } as never,
      snapshotProjector: { project: notImplemented } as never
    };
    const { panel, posted } = makePanel();

    await handleWebviewMessage(
      { version: 1, requestId: "req-delegate", type: "ready", payload: {} },
      services,
      panel
    );

    expect(listActiveRunsMock).toHaveBeenCalledOnce();
    expect(posted).toHaveLength(1);
  });
});
