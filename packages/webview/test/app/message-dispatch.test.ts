import { describe, expect, it } from "vitest";

import { dispatchInboundMessage } from "../../src/app/message-dispatch";
import { createStore } from "../../src/app/store";

describe("dispatchInboundMessage", () => {
  it("dispatches overview.state to the overview surface", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, {
      type: "overview.state",
      requestId: "r1",
      payload: { stats: { totalRepos: 3 } }
    });

    expect(result).toBe(true);
    expect(store.getState().activeSurface).toBe("overview");
    expect(store.getState().payloads.overview).toEqual({
      stats: { totalRepos: 3 }
    });
    expect(store.getState().loading).toBe(false);
  });

  it("dispatches repository.state to the repository surface", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, {
      type: "repository.state",
      requestId: "r2",
      payload: { id: "repo-1", name: "my-repo" }
    });

    expect(result).toBe(true);
    expect(store.getState().activeSurface).toBe("repository");
    expect(store.getState().payloads.repository).toEqual({
      id: "repo-1",
      name: "my-repo"
    });
  });

  it("dispatches plan.state to the plan surface", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, {
      type: "plan.state",
      requestId: "r3",
      payload: { planId: "p-1" }
    });

    expect(result).toBe(true);
    expect(store.getState().activeSurface).toBe("plan");
  });

  it("dispatches run.state to the run surface", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, {
      type: "run.state",
      requestId: "r4",
      payload: { runId: "run-1" }
    });

    expect(result).toBe(true);
    expect(store.getState().activeSurface).toBe("run");
  });

  it("dispatches toast messages and returns true", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, {
      type: "toast",
      requestId: "r5",
      payload: {
        message: "Plan created",
        severity: "warning",
        actions: ["Open plan"]
      }
    });

    expect(result).toBe(true);
    expect(store.getState().toasts).toEqual([
      {
        id: "r5",
        message: "Plan created",
        severity: "warning",
        actions: ["Open plan"]
      }
    ]);
  });

  it("dispatches toast with defaults when payload fields are missing", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, {
      type: "toast",
      requestId: "toast-defaults",
      payload: {}
    });

    expect(result).toBe(true);
    expect(store.getState().toasts).toEqual([
      {
        id: "toast-defaults",
        message: "Unknown notification",
        severity: "info",
        actions: []
      }
    ]);
  });

  it("dispatches graph.update messages and returns true", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, {
      type: "graph.update",
      requestId: "r6",
      payload: {
        nodeId: "node-1",
        status: "running"
      }
    });

    expect(result).toBe(true);
    expect(store.getState().graphUpdate).toEqual({
      nodeId: "node-1",
      status: "running"
    });
  });

  it("dispatches graph.update payload fields to state", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, {
      type: "graph.update",
      requestId: "r7",
      payload: {
        nodeId: "node-xyz",
        status: "failed"
      }
    });

    expect(result).toBe(true);
    expect(store.getState().graphUpdate).toEqual({
      nodeId: "node-xyz",
      status: "failed"
    });
  });

  it("returns false for unknown message types", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, {
      type: "timeline.update",
      requestId: "r8",
      payload: {}
    });

    expect(result).toBe(false);
    expect(store.getState().loading).toBe(true);
  });

  it("returns false for non-object messages", () => {
    const store = createStore();

    expect(dispatchInboundMessage(store, null)).toBe(false);
    expect(dispatchInboundMessage(store, "hello")).toBe(false);
    expect(dispatchInboundMessage(store, 42)).toBe(false);
  });

  it("returns false when type is missing", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, { payload: {} });

    expect(result).toBe(false);
  });

  it("uses empty object when payload is missing", () => {
    const store = createStore();
    dispatchInboundMessage(store, {
      type: "overview.state",
      requestId: "r6"
    });

    expect(store.getState().payloads.overview).toEqual({});
  });

  it("dispatches orchestration.state and returns true", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, {
      type: "orchestration.state",
      requestId: "r-orch-1",
      payload: {
        runId: "run-42",
        milestoneIndex: 1,
        milestoneCount: 3,
        milestoneName: "Setup Phase",
        phases: [
          { role: "orchestrator", status: "done" },
          { role: "planner", status: "running" },
          { role: "implementer", status: "waiting" },
          { role: "reviewer", status: "waiting" }
        ]
      }
    });

    expect(result).toBe(true);
    expect(store.getState().orchestration).toEqual({
      runId: "run-42",
      milestoneIndex: 1,
      milestoneCount: 3,
      milestoneName: "Setup Phase",
      phases: [
        {
          role: "orchestrator",
          status: "done",
          model: "",
          tokenUsage: { prompt: 0, completion: 0 }
        },
        {
          role: "planner",
          status: "running",
          model: "",
          tokenUsage: { prompt: 0, completion: 0 }
        },
        {
          role: "implementer",
          status: "waiting",
          model: "",
          tokenUsage: { prompt: 0, completion: 0 }
        },
        {
          role: "reviewer",
          status: "waiting",
          model: "",
          tokenUsage: { prompt: 0, completion: 0 }
        }
      ]
    });
  });

  it("dispatches orchestration.state with defaults for missing fields", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, {
      type: "orchestration.state",
      requestId: "r-orch-2",
      payload: {}
    });

    expect(result).toBe(true);
    const orchestration = store.getState().orchestration;
    expect(orchestration).not.toBeNull();
    expect(orchestration!.runId).toBe("");
    expect(orchestration!.phases).toHaveLength(4);
  });

  it("orchestration state is null in initial store", () => {
    const store = createStore();
    expect(store.getState().orchestration).toBeNull();
  });

  it("dispatches orchestration.state defaults when payload is null", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, {
      type: "orchestration.state",
      requestId: "r-orch-null",
      payload: null
    });

    expect(result).toBe(true);
    expect(store.getState().orchestration).toEqual({
      runId: "",
      milestoneIndex: 0,
      milestoneCount: 1,
      milestoneName: "",
      phases: [
        {
          role: "orchestrator",
          status: "queued",
          model: "",
          tokenUsage: { prompt: 0, completion: 0 }
        },
        {
          role: "planner",
          status: "queued",
          model: "",
          tokenUsage: { prompt: 0, completion: 0 }
        },
        {
          role: "implementer",
          status: "queued",
          model: "",
          tokenUsage: { prompt: 0, completion: 0 }
        },
        {
          role: "reviewer",
          status: "queued",
          model: "",
          tokenUsage: { prompt: 0, completion: 0 }
        }
      ]
    });
  });

  it("normalizes orchestration phases when phases is not an array", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, {
      type: "orchestration.state",
      requestId: "r-orch-bad-phases",
      payload: {
        runId: "run-bad-phases",
        phases: "not-an-array"
      }
    });

    expect(result).toBe(true);
    expect(store.getState().orchestration?.phases).toEqual([
      {
        role: "orchestrator",
        status: "queued",
        model: "",
        tokenUsage: { prompt: 0, completion: 0 }
      },
      {
        role: "planner",
        status: "queued",
        model: "",
        tokenUsage: { prompt: 0, completion: 0 }
      },
      {
        role: "implementer",
        status: "queued",
        model: "",
        tokenUsage: { prompt: 0, completion: 0 }
      },
      {
        role: "reviewer",
        status: "queued",
        model: "",
        tokenUsage: { prompt: 0, completion: 0 }
      }
    ]);
  });

  it("normalizes orchestration phases to exactly four items", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, {
      type: "orchestration.state",
      requestId: "r-orch-normalized-phases",
      payload: {
        runId: "run-normalized",
        phases: [
          { role: "anything", status: "running" },
          { role: "anything", status: "done" },
          { role: "anything", status: "blocked" },
          { role: "anything", status: "succeeded" },
          { role: "extra", status: "failed" }
        ]
      }
    });

    expect(result).toBe(true);
    expect(store.getState().orchestration?.phases).toEqual([
      {
        role: "orchestrator",
        status: "running",
        model: "",
        tokenUsage: { prompt: 0, completion: 0 }
      },
      {
        role: "planner",
        status: "done",
        model: "",
        tokenUsage: { prompt: 0, completion: 0 }
      },
      {
        role: "implementer",
        status: "blocked",
        model: "",
        tokenUsage: { prompt: 0, completion: 0 }
      },
      {
        role: "reviewer",
        status: "succeeded",
        model: "",
        tokenUsage: { prompt: 0, completion: 0 }
      }
    ]);
  });
});
