import { describe, expect, it, vi } from "vitest";

import {
  appReducer,
  createInitialState,
  createStore,
  type AppState
} from "../../src/app/store";

describe("createInitialState", () => {
  it("returns loading overview state", () => {
    const state = createInitialState();

    expect(state.activeSurface).toBe("overview");
    expect(state.payloads).toEqual({});
    expect(state.error).toBeNull();
    expect(state.loading).toBe(true);
    expect(state.toasts).toEqual([]);
    expect(state.graphUpdate).toBeNull();
  });
});

describe("appReducer", () => {
  const base: AppState = {
    activeSurface: "overview",
    payloads: {},
    error: null,
    loading: true,
    toasts: [],
    graphUpdate: null
  };

  it("surface.update sets surface, payload, loading=false, clears error", () => {
    const next = appReducer(base, {
      type: "surface.update",
      surface: "repository",
      payload: { id: "repo-1" }
    });

    expect(next.activeSurface).toBe("repository");
    expect(next.payloads.repository).toEqual({ id: "repo-1" });
    expect(next.loading).toBe(false);
    expect(next.error).toBeNull();
  });

  it("surface.navigate changes activeSurface without altering payloads", () => {
    const withPayload = appReducer(base, {
      type: "surface.update",
      surface: "overview",
      payload: { stats: {} }
    });

    const next = appReducer(withPayload, {
      type: "surface.navigate",
      surface: "plan"
    });

    expect(next.activeSurface).toBe("plan");
    expect(next.payloads.overview).toEqual({ stats: {} });
  });

  it("error action sets message and clears loading", () => {
    const next = appReducer(base, {
      type: "error",
      message: "Connection lost"
    });

    expect(next.error).toBe("Connection lost");
    expect(next.loading).toBe(false);
  });

  it("loading action toggles the loading flag", () => {
    const loaded = appReducer(base, { type: "loading", loading: false });
    expect(loaded.loading).toBe(false);

    const reloading = appReducer(loaded, { type: "loading", loading: true });
    expect(reloading.loading).toBe(true);
  });

  it("toast.show adds a toast to the queue", () => {
    const next = appReducer(base, {
      type: "toast.show",
      toast: {
        id: "t1",
        message: "Hello",
        severity: "info",
        actions: []
      }
    });

    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0]).toMatchObject({ id: "t1", message: "Hello" });
  });

  it("toast.show keeps only latest five toasts", () => {
    const withFive = ["t1", "t2", "t3", "t4", "t5"].reduce((state, id) => {
      return appReducer(state, {
        type: "toast.show",
        toast: {
          id,
          message: id,
          severity: "info",
          actions: []
        }
      });
    }, base);

    const next = appReducer(withFive, {
      type: "toast.show",
      toast: {
        id: "t6",
        message: "t6",
        severity: "warning",
        actions: []
      }
    });

    expect(next.toasts).toHaveLength(5);
    expect(next.toasts.map((toast) => toast.id)).toEqual([
      "t2",
      "t3",
      "t4",
      "t5",
      "t6"
    ]);
  });

  it("toast.dismiss removes a toast by id", () => {
    const withToasts = appReducer(base, {
      type: "toast.show",
      toast: {
        id: "remove-me",
        message: "bye",
        severity: "error",
        actions: []
      }
    });

    const next = appReducer(withToasts, {
      type: "toast.dismiss",
      toastId: "remove-me"
    });

    expect(next.toasts).toEqual([]);
  });

  it("toast.dismiss with unknown id is a no-op", () => {
    const withToasts = appReducer(base, {
      type: "toast.show",
      toast: {
        id: "keep-me",
        message: "still here",
        severity: "info",
        actions: []
      }
    });

    const next = appReducer(withToasts, {
      type: "toast.dismiss",
      toastId: "missing"
    });

    expect(next.toasts).toEqual(withToasts.toasts);
  });

  it("graph.update sets latest graphUpdate payload", () => {
    const next = appReducer(base, {
      type: "graph.update",
      nodeId: "node-1",
      status: "running"
    });

    expect(next.graphUpdate).toEqual({ nodeId: "node-1", status: "running" });
  });

  it("graph.update overwrites previous graphUpdate payload", () => {
    const first = appReducer(base, {
      type: "graph.update",
      nodeId: "node-1",
      status: "queued"
    });

    const next = appReducer(first, {
      type: "graph.update",
      nodeId: "node-2",
      status: "failed"
    });

    expect(next.graphUpdate).toEqual({ nodeId: "node-2", status: "failed" });
  });
});

describe("createStore", () => {
  it("getState returns the initial state", () => {
    const store = createStore();
    const state = store.getState();

    expect(state.activeSurface).toBe("overview");
    expect(state.loading).toBe(true);
    expect(state.toasts).toEqual([]);
    expect(state.graphUpdate).toBeNull();
  });

  it("dispatch updates state and notifies subscribers", () => {
    const store = createStore();
    const states: AppState[] = [];

    store.subscribe((s) => states.push(s));
    store.dispatch({
      type: "surface.update",
      surface: "plan",
      payload: { title: "my-plan" }
    });

    expect(states).toHaveLength(1);
    expect(states[0]!.activeSurface).toBe("plan");
    expect(store.getState().activeSurface).toBe("plan");
  });

  it("unsubscribe prevents further notifications", () => {
    const store = createStore();
    const cb = vi.fn();

    const unsub = store.subscribe(cb);
    store.dispatch({ type: "loading", loading: false });
    expect(cb).toHaveBeenCalledOnce();

    unsub();
    store.dispatch({ type: "loading", loading: true });
    expect(cb).toHaveBeenCalledOnce(); // still 1
  });

  it("accepts a custom initial state", () => {
    const custom: AppState = {
      activeSurface: "run",
      payloads: { run: { id: "r1" } },
      error: null,
      loading: false,
      toasts: [],
      graphUpdate: null
    };

    const store = createStore(custom);
    expect(store.getState().activeSurface).toBe("run");
    expect(store.getState().loading).toBe(false);
  });
});
