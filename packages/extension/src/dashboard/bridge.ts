import { type WebviewInboundMessage } from "@attractor/shared";

import { type StorageServices } from "../storage/services";
import { type ModelGateway } from "../application/ports";
import { projectOverview } from "./overview-projection";
import { projectRepository } from "./repository-projection";
import { projectPlan } from "./plan-projection";
import { projectRun } from "./run-projection";
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
 * Optional orchestration context for wiring command handlers to the runtime
 * orchestration loop.
 */
export interface BridgeOrchestrationContext {
  modelGateway: ModelGateway;
  startOrchestration: (options: {
    runId: string;
    planId: string;
    panel: WebviewPanelLike;
    signal?: AbortSignal;
  }) => Promise<void>;
  cancelOrchestration: (runId: string) => void;
}

/**
 * Handles inbound messages from the webview and dispatches them to the
 * appropriate projectors.
 *
 * Behaviour:
 * - Query routes (ready, repository.open, milestone.open, graph.focus) post
 *   a state or update message back to the webview.
 * - Command routes (plan.create, plan.run, run.resume, run.cancel, run.retry)
 *   post toast acknowledgments and call orchestration handlers when context is provided.
 * - The outbound `requestId` echoes the one from the inbound message so the
 *   webview can correlate the response to its request.
 * - Bridge code MUST NOT duplicate logic — all projection lives in the
 *   respective projector functions.
 */
export async function handleWebviewMessage(
  message: WebviewInboundMessage,
  services: StorageServices,
  panel: WebviewPanelLike,
  orchestration?: BridgeOrchestrationContext
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

    case "plan.open": {
      const planId = message.payload.planId;
      if (typeof planId !== "string" || planId.trim().length === 0) {
        await panel.postMessage({
          version: 1,
          requestId: message.requestId,
          type: "toast",
          payload: {
            message:
              "Invalid plan.open payload: planId must be a non-empty string",
            severity: "warning",
            actions: []
          }
        });
        break;
      }
      const state = await projectPlan(planId, services);
      await panel.postMessage({
        version: 1,
        requestId: message.requestId,
        type: "plan.state",
        payload: state
      });
      break;
    }

    case "run.open": {
      const runId = message.payload.runId;
      if (typeof runId !== "string" || runId.trim().length === 0) {
        await panel.postMessage({
          version: 1,
          requestId: message.requestId,
          type: "toast",
          payload: {
            message:
              "Invalid run.open payload: runId must be a non-empty string",
            severity: "warning",
            actions: []
          }
        });
        break;
      }
      const state = await projectRun(runId, services);
      await panel.postMessage({
        version: 1,
        requestId: message.requestId,
        type: "run.state",
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

    // Command messages
    case "plan.create": {
      await panel.postMessage({
        version: 1,
        requestId: message.requestId,
        type: "toast",
        payload: {
          message: "Plan creation acknowledged",
          severity: "info",
          actions: []
        }
      });
      break;
    }

    case "plan.run": {
      const planId = message.payload.planId;
      const runId = message.payload.runId;
      if (typeof planId !== "string" || planId.trim().length === 0) {
        await panel.postMessage({
          version: 1,
          requestId: message.requestId,
          type: "toast",
          payload: {
            message:
              "Invalid plan.run payload: planId must be a non-empty string",
            severity: "warning",
            actions: []
          }
        });
        break;
      }
      if (runId !== undefined && typeof runId !== "string") {
        await panel.postMessage({
          version: 1,
          requestId: message.requestId,
          type: "toast",
          payload: {
            message:
              "Invalid plan.run payload: runId must be a string when provided",
            severity: "warning",
            actions: []
          }
        });
        break;
      }
      if (orchestration) {
        const resolvedRunId = runId ?? `run-${Date.now()}`;
        // Fire and forget — orchestration runs async, but catch rejections
        orchestration
          .startOrchestration({
            runId: resolvedRunId,
            planId,
            panel
          })
          .catch((err: unknown) => {
            void panel.postMessage({
              version: 1,
              requestId: message.requestId,
              type: "toast",
              payload: {
                message: `Orchestration failed: ${err instanceof Error ? err.message : String(err)}`,
                severity: "error",
                actions: []
              }
            });
          });
      }
      await panel.postMessage({
        version: 1,
        requestId: message.requestId,
        type: "toast",
        payload: {
          message: `Orchestration started for plan ${planId}`,
          severity: "info",
          actions: []
        }
      });
      break;
    }

    case "run.cancel": {
      const cancelRunId = message.payload.runId;
      if (typeof cancelRunId !== "string" || cancelRunId.trim().length === 0) {
        await panel.postMessage({
          version: 1,
          requestId: message.requestId,
          type: "toast",
          payload: {
            message:
              "Invalid run.cancel payload: runId must be a non-empty string",
            severity: "warning",
            actions: []
          }
        });
        break;
      }
      if (orchestration) {
        orchestration.cancelOrchestration(cancelRunId);
      }
      await panel.postMessage({
        version: 1,
        requestId: message.requestId,
        type: "toast",
        payload: {
          message: `Cancellation requested for run ${cancelRunId}`,
          severity: "info",
          actions: []
        }
      });
      break;
    }

    case "run.resume":
    case "run.retry": {
      await panel.postMessage({
        version: 1,
        requestId: message.requestId,
        type: "toast",
        payload: {
          message: `${message.type} is not yet supported in v1`,
          severity: "warning",
          actions: []
        }
      });
      break;
    }
  }
}
