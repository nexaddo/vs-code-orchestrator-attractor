import { describe, expect, it, vi } from "vitest";

import { type ModelGateway } from "../../src/application/ports";
import {
  handleWebviewMessage,
  type WebviewPanelLike,
  type BridgeOrchestrationContext
} from "../../src/dashboard/bridge";
import { type StorageServices } from "../../src/storage/services";

// ---------------------------------------------------------------------------
// Integration test fixtures - closer to real runtime behavior
// ---------------------------------------------------------------------------

const notImplemented = (): never => {
  throw new Error("not implemented");
};

const makeMinimalServices = (): StorageServices => ({
  repositoryRegistry: {
    save: notImplemented,
    getById: async () => null,
    list: async () => []
  },
  planRegistry: {
    save: notImplemented,
    getById: async () => null,
    list: async () => []
  },
  runRegistry: {
    save: notImplemented,
    getById: notImplemented,
    list: async () => [],
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
    listByPlanId: async () => []
  },
  artifactRegistry: {
    save: notImplemented,
    getById: notImplemented,
    listByRunId: notImplemented,
    listByNodeId: notImplemented
  }
});

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
// Integration Tests - Bridge Command Handler Logic
// ---------------------------------------------------------------------------

describe("bridge command handler integration", () => {
  it("plan.run: valid planId sends orchestration-started toast with exact message", async () => {
    // This tests the full plan.run flow with exact toast verification
    // which is NOT covered by unit tests that only check partial content
    const services = makeMinimalServices();
    const { panel, posted } = makePanel();
    const startOrchestration = vi.fn().mockResolvedValue(undefined);
    const orchestration: BridgeOrchestrationContext = {
      modelGateway: {
        send: vi.fn(),
        stream: vi.fn()
      } as unknown as ModelGateway,
      startOrchestration,
      cancelOrchestration: vi.fn()
    };

    await handleWebviewMessage(
      {
        version: 1,
        requestId: "r1",
        type: "plan.run",
        payload: { planId: "plan-001" }
      },
      services,
      panel,
      orchestration
    );

    expect(posted).toHaveLength(1);
    const msg = posted[0] as {
      version: number;
      requestId: string;
      type: string;
      payload: { message: string; severity: string; actions: unknown[] };
    };
    expect(msg.version).toBe(1);
    expect(msg.requestId).toBe("r1");
    expect(msg.type).toBe("toast");
    expect(msg.payload.message).toBe("Orchestration started for plan plan-001");
    expect(msg.payload.severity).toBe("info");
    expect(msg.payload.actions).toEqual([]);
  });

  it("plan.run: empty planId sends validation warning toast with exact message", async () => {
    // This tests validation path with empty string (not undefined)
    // which is NOT covered by existing tests that check undefined payload
    const services = makeMinimalServices();
    const { panel, posted } = makePanel();
    const startOrchestration = vi.fn();
    const orchestration: BridgeOrchestrationContext = {
      modelGateway: {
        send: vi.fn(),
        stream: vi.fn()
      } as unknown as ModelGateway,
      startOrchestration,
      cancelOrchestration: vi.fn()
    };

    await handleWebviewMessage(
      {
        version: 1,
        requestId: "r2",
        type: "plan.run",
        payload: { planId: "" }
      },
      services,
      panel,
      orchestration
    );

    expect(startOrchestration).not.toHaveBeenCalled();
    expect(posted).toHaveLength(1);
    const msg = posted[0] as {
      type: string;
      payload: { message: string; severity: string; actions: unknown[] };
    };
    expect(msg.type).toBe("toast");
    expect(msg.payload.message).toBe(
      "Invalid plan.run payload: planId must be a non-empty string"
    );
    expect(msg.payload.severity).toBe("warning");
    expect(msg.payload.actions).toEqual([]);
  });

  it("run.cancel: valid runId sends cancellation toast with exact message", async () => {
    // This tests the full run.cancel flow with exact toast verification
    // which is NOT covered by unit tests that only check partial content
    const services = makeMinimalServices();
    const { panel, posted } = makePanel();
    const cancelOrchestration = vi.fn();
    const orchestration: BridgeOrchestrationContext = {
      modelGateway: {
        send: vi.fn(),
        stream: vi.fn()
      } as unknown as ModelGateway,
      startOrchestration: vi.fn(),
      cancelOrchestration
    };

    await handleWebviewMessage(
      {
        version: 1,
        requestId: "r3",
        type: "run.cancel",
        payload: { runId: "run-001" }
      },
      services,
      panel,
      orchestration
    );

    expect(cancelOrchestration).toHaveBeenCalledWith("run-001");
    expect(posted).toHaveLength(1);
    const msg = posted[0] as {
      version: number;
      requestId: string;
      type: string;
      payload: { message: string; severity: string; actions: unknown[] };
    };
    expect(msg.version).toBe(1);
    expect(msg.requestId).toBe("r3");
    expect(msg.type).toBe("toast");
    expect(msg.payload.message).toBe("Cancellation requested for run run-001");
    expect(msg.payload.severity).toBe("info");
    expect(msg.payload.actions).toEqual([]);
  });

  it("plan.create: sends acknowledgment toast with exact structure", async () => {
    // This tests the full plan.create acknowledgment with exact structure verification
    // which is NOT covered by unit tests that only check partial content
    const services = makeMinimalServices();
    const { panel, posted } = makePanel();

    await handleWebviewMessage(
      {
        version: 1,
        requestId: "r4",
        type: "plan.create",
        payload: { title: "New Plan", goal: "Test Goal" }
      },
      services,
      panel
    );

    expect(posted).toHaveLength(1);
    const msg = posted[0] as {
      version: number;
      requestId: string;
      type: string;
      payload: { message: string; severity: string; actions: unknown[] };
    };
    expect(msg.version).toBe(1);
    expect(msg.requestId).toBe("r4");
    expect(msg.type).toBe("toast");
    expect(msg.payload.message).toBe("Plan creation acknowledged");
    expect(msg.payload.severity).toBe("info");
    expect(msg.payload.actions).toEqual([]);
  });

  it("run.resume and run.retry: send not-yet-supported warning with exact v1 message", async () => {
    // This tests unsupported command path with exact v1 message verification
    // which is NOT covered by existing bridge.test.ts that only checks partial content
    const services = makeMinimalServices();

    // Test run.resume
    {
      const { panel, posted } = makePanel();
      await handleWebviewMessage(
        {
          version: 1,
          requestId: "r5",
          type: "run.resume",
          payload: { runId: "run-002" }
        },
        services,
        panel
      );

      expect(posted).toHaveLength(1);
      const msg = posted[0] as {
        version: number;
        requestId: string;
        type: string;
        payload: { message: string; severity: string; actions: unknown[] };
      };
      expect(msg.version).toBe(1);
      expect(msg.requestId).toBe("r5");
      expect(msg.type).toBe("toast");
      expect(msg.payload.message).toBe("run.resume is not yet supported in v1");
      expect(msg.payload.severity).toBe("warning");
      expect(msg.payload.actions).toEqual([]);
    }

    // Test run.retry
    {
      const { panel, posted } = makePanel();
      await handleWebviewMessage(
        {
          version: 1,
          requestId: "r6",
          type: "run.retry",
          payload: { runId: "run-003" }
        },
        services,
        panel
      );

      expect(posted).toHaveLength(1);
      const msg = posted[0] as {
        version: number;
        requestId: string;
        type: string;
        payload: { message: string; severity: string; actions: unknown[] };
      };
      expect(msg.version).toBe(1);
      expect(msg.requestId).toBe("r6");
      expect(msg.type).toBe("toast");
      expect(msg.payload.message).toBe("run.retry is not yet supported in v1");
      expect(msg.payload.severity).toBe("warning");
      expect(msg.payload.actions).toEqual([]);
    }
  });
});
