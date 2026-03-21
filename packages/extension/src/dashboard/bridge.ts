import { type WebviewInboundMessage } from "@attractor/shared";

import { type StorageServices } from "../storage/services";
import { projectOverview } from "./overview-projection";
import { projectRepository } from "./repository-projection";
import { projectPlan } from "./plan-projection";
import { buildGraphUpdate } from "./graph-projection";

/**
 * Thin seam over a VS Code WebviewPanel so the bridge is testable without
 * launching an extension host.  Only the `postMessage` surface is needed
 * for the initial load flow.
 */
export interface WebviewPanelLike {
  postMessage(message: unknown): void | PromiseLike<boolean>;
}

/**
 * Handles inbound messages from the webview and dispatches them to the
 * appropriate projectors.
 *
 * Behaviour:
 * - Query routes (ready, repository.open, milestone.open, graph.focus) post
 *   a state or update message back to the webview.
 * - Command routes (plan.create, plan.run, run.resume, run.cancel, run.retry)
 *   do not post a response in v1 — these are deferred to M4+ runtime handling.
 * - The outbound `requestId` echoes the one from the inbound message so the
 *   webview can correlate the response to its request.
 * - Bridge code MUST NOT duplicate logic — all projection lives in the
 *   respective projector functions.
 */
export async function handleWebviewMessage(
  message: WebviewInboundMessage,
  services: StorageServices,
  panel: WebviewPanelLike
): Promise<void> {
  switch (message.type) {
    case "ready": {
      const state = await projectOverview(services);
      await panel.postMessage({
        version: 1,
        requestId: message.requestId,
        type: "overview.state",
        payload: state
      });
      break;
    }

    case "repository.open": {
      const repositoryId = message.payload.repositoryId as string;
      const state = await projectRepository(repositoryId, services);
      await panel.postMessage({
        version: 1,
        requestId: message.requestId,
        type: "repository.state",
        payload: state
      });
      break;
    }

    case "milestone.open": {
      // milestone.open resolves to plan.state for the milestone's parent plan
      const planId = message.payload.planId as string;
      const state = await projectPlan(planId, services);
      await panel.postMessage({
        version: 1,
        requestId: message.requestId,
        type: "plan.state",
        payload: state
      });
      break;
    }

    case "graph.focus": {
      const nodeId = message.payload.nodeId as string;
      const status = message.payload.status as
        | "queued"
        | "running"
        | "blocked"
        | "failed"
        | "succeeded"
        | "canceled";
      const payload = buildGraphUpdate(nodeId, status);
      await panel.postMessage({
        version: 1,
        requestId: message.requestId,
        type: "graph.update",
        payload
      });
      break;
    }

    // Command messages — deferred to M4+ runtime. No-op: do not post a response.
    case "plan.create":
    case "plan.run":
    case "run.resume":
    case "run.cancel":
    case "run.retry":
      // These are command intents, not queries. Runtime handling is deferred.
      break;
  }
}
