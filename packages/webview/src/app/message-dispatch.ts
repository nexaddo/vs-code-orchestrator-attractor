/**
 * Routes inbound messages from the extension host to store dispatches.
 *
 * This is the single entry point for all messages arriving via
 * `window.addEventListener("message", ...)`.  Each outbound message type
 * maps to a store action that updates the active surface and its payload.
 */

import type {
  AppStore,
  GraphUpdateItem,
  SurfaceId,
  OrchestrationPhaseItem
} from "./store";

/**
 * Map from outbound message type → surface id.
 *
 * Only message types that carry a surface payload are included.
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

  if (msg.type === "toast") {
    store.dispatch({
      type: "toast.show",
      toast: {
        id: msg.requestId ?? crypto.randomUUID(),
        message:
          (msg.payload as { message?: string })?.message ??
          "Unknown notification",
        severity:
          ((msg.payload as { severity?: string })?.severity as
            | "info"
            | "warning"
            | "error") ?? "info",
        actions: (msg.payload as { actions?: string[] })?.actions ?? []
      }
    });
    return true;
  }

  if (msg.type === "graph.update") {
    store.dispatch({
      type: "graph.update",
      nodeId: (msg.payload as { nodeId?: string })?.nodeId ?? "",
      status:
        ((msg.payload as { status?: string })
          ?.status as GraphUpdateItem["status"]) ?? "queued"
    });
    return true;
  }

  if (msg.type === "orchestration.state") {
    const payload = msg.payload as {
      runId?: string;
      milestoneIndex?: number;
      milestoneCount?: number;
      milestoneName?: string;
      phases?: OrchestrationPhaseItem[];
    };

    store.dispatch({
      type: "orchestration.update",
      orchestration: {
        runId: payload.runId ?? "",
        milestoneIndex: payload.milestoneIndex ?? 0,
        milestoneCount: payload.milestoneCount ?? 1,
        milestoneName: payload.milestoneName ?? "",
        phases: (payload.phases ?? [
          { role: "orchestrator", status: "waiting" },
          { role: "planner", status: "waiting" },
          { role: "implementer", status: "waiting" },
          { role: "reviewer", status: "waiting" }
        ]) as [
          OrchestrationPhaseItem,
          OrchestrationPhaseItem,
          OrchestrationPhaseItem,
          OrchestrationPhaseItem
        ]
      }
    });
    return true;
  }

  // Unknown types are silently ignored.
  return false;
}
