/**
 * Minimal reactive store for the Attractor webview app.
 *
 * State tracks which surface is active and the latest payload for each
 * surface.  Components subscribe to changes and re-render when the active
 * surface or its payload updates.
 *
 * This is intentionally NOT a full state-management library.  A simple
 * pub-sub model keeps the bundle small and avoids framework lock-in.
 */

// ---------------------------------------------------------------------------
// Surface types
// ---------------------------------------------------------------------------

/** Discriminated surface identifiers matching outbound message types. */
export type SurfaceId = "overview" | "repository" | "plan" | "run";

export interface AppState {
  /** Currently active surface. Starts as "overview". */
  activeSurface: SurfaceId;
  /** Surface-specific payload, keyed by surface id. */
  payloads: Partial<Record<SurfaceId, unknown>>;
  /** Last error message, if any. */
  error: string | null;
  /** True while waiting for initial state from the extension host. */
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type AppAction =
  | { type: "surface.update"; surface: SurfaceId; payload: unknown }
  | { type: "surface.navigate"; surface: SurfaceId }
  | { type: "error"; message: string }
  | { type: "loading"; loading: boolean };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "surface.update":
      return {
        ...state,
        activeSurface: action.surface,
        payloads: {
          ...state.payloads,
          [action.surface]: action.payload
        },
        loading: false,
        error: null
      };

    case "surface.navigate":
      return {
        ...state,
        activeSurface: action.surface
      };

    case "error":
      return {
        ...state,
        error: action.message,
        loading: false
      };

    case "loading":
      return {
        ...state,
        loading: action.loading
      };
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export type Listener = (state: AppState) => void;

export interface AppStore {
  getState(): AppState;
  dispatch(action: AppAction): void;
  subscribe(listener: Listener): () => void;
}

export function createInitialState(): AppState {
  return {
    activeSurface: "overview",
    payloads: {},
    error: null,
    loading: true
  };
}

export function createStore(initial?: AppState): AppStore {
  let state: AppState = initial ?? createInitialState();
  const listeners = new Set<Listener>();

  return {
    getState() {
      return state;
    },

    dispatch(action: AppAction) {
      const next = appReducer(state, action);
      if (next !== state) {
        state = next;
        for (const listener of listeners) {
          listener(state);
        }
      }
    },

    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}
