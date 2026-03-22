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
});
