import { type WebviewInboundMessage } from "@attractor/shared";

import { type StorageServices } from "../storage/services";
import { projectOverview } from "./overview-projection";

/**
 * Thin seam over a VS Code WebviewPanel so the bridge is testable without
 * launching an extension host.  Only the `postMessage` surface is needed
 * for the initial load flow.
 */
export interface WebviewPanelLike {
  postMessage(message: unknown): void | PromiseLike<boolean>;
}

/**
 * Handles the `ready` message from the webview by projecting the current
 * storage state and posting an `overview.state` message back.
 *
 * Behaviour:
 * - Only the `"ready"` inbound type triggers a response in v1.
 * - The outbound `requestId` echoes the one from the inbound message so the
 *   webview can correlate the response to its boot request.
 * - Bridge code MUST NOT duplicate count logic — all projection lives in
 *   `projectOverview`.
 */
export async function handleWebviewMessage(
  message: WebviewInboundMessage,
  services: StorageServices,
  panel: WebviewPanelLike
): Promise<void> {
  if (message.type !== "ready") {
    return;
  }

  const state = await projectOverview(services);

  await panel.postMessage({
    version: 1,
    requestId: message.requestId,
    type: "overview.state",
    payload: state
  });
}
