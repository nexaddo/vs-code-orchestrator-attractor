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
  /** Queue of active toasts. */
  toasts: ToastItem[];
  /** Latest graph update payload, if any. */
  graphUpdate: GraphUpdateItem | null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export interface ToastItem {
  id: string;
  message: string;
  severity: "info" | "warning" | "error";
  actions: string[];
}

export interface GraphUpdateItem {
  nodeId: string;
  status:
    | "queued"
    | "running"
    | "blocked"
    | "failed"
    | "succeeded"
    | "canceled";
}

export type AppAction =
  | { type: "surface.update"; surface: SurfaceId; payload: unknown }
  | { type: "surface.navigate"; surface: SurfaceId }
  | { type: "error"; message: string }
  | { type: "loading"; loading: boolean }
  | { type: "toast.show"; toast: ToastItem }
  | { type: "toast.dismiss"; toastId: string }
  | {
      type: "graph.update";
      nodeId: string;
      status: GraphUpdateItem["status"];
    };

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

    case "toast.show": {
      const toasts = [...state.toasts, action.toast];
      return {
        ...state,
        toasts: toasts.length > 5 ? toasts.slice(toasts.length - 5) : toasts
      };
    }

    case "toast.dismiss":
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.toastId)
      };

    case "graph.update":
      return {
        ...state,
        graphUpdate: {
          nodeId: action.nodeId,
          status: action.status
        }
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
    loading: true,
    toasts: [],
    graphUpdate: null
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
