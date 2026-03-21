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

  it("returns false for unknown message types", () => {
    const store = createStore();
    const result = dispatchInboundMessage(store, {
      type: "graph.update",
      requestId: "r5",
      payload: {}
    });

    expect(result).toBe(false);
    // State unchanged — still loading
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
