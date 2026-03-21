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
  });
});

describe("appReducer", () => {
  const base: AppState = {
    activeSurface: "overview",
    payloads: {},
    error: null,
    loading: true
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
});

describe("createStore", () => {
  it("getState returns the initial state", () => {
    const store = createStore();
    const state = store.getState();

    expect(state.activeSurface).toBe("overview");
    expect(state.loading).toBe(true);
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
      loading: false
    };

    const store = createStore(custom);
    expect(store.getState().activeSurface).toBe("run");
    expect(store.getState().loading).toBe(false);
  });
});
