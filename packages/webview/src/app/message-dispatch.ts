/**
 * Routes inbound messages from the extension host to store dispatches.
 *
 * This is the single entry point for all messages arriving via
 * `window.addEventListener("message", ...)`.  Each outbound message type
 * maps to a store action that updates the active surface and its payload.
 */

import type { AppStore, SurfaceId } from "./store";

/**
 * Map from outbound message type → surface id.
 *
 * Only message types that carry a surface payload are included.
 * Types like "toast" or "graph.update" are handled separately or deferred.
 */
const MESSAGE_TO_SURFACE: Record<string, SurfaceId> = {
  "overview.state": "overview",
  "repository.state": "repository",
  "plan.state": "plan",
  "run.state": "run"
};

export interface InboundMessage {
  type?: string;
  payload?: unknown;
  requestId?: string;
}

/**
 * Dispatch an inbound message from the extension host.
 *
 * Returns `true` if the message was recognized and dispatched, `false`
 * otherwise (unknown or malformed messages are silently ignored).
 */
export function dispatchInboundMessage(store: AppStore, raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) {
    return false;
  }

  const msg = raw as InboundMessage;

  if (typeof msg.type !== "string") {
    return false;
  }

  const surface = MESSAGE_TO_SURFACE[msg.type];
  if (surface) {
    store.dispatch({
      type: "surface.update",
      surface,
      payload: msg.payload ?? {}
    });
    return true;
  }

  // graph.update, toast, timeline.update — deferred to slice 7-9.
  // Unknown types are silently ignored.
  return false;
}
