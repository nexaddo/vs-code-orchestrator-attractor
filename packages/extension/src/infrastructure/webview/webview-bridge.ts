import type * as vscode from "vscode";

import type {
  OrchestrationStatePayload,
  WebviewOutboundMessage
} from "@attractor/shared";
import { CONTRACT_VERSION } from "@attractor/shared";

export class WebviewBridge {
  private panel: vscode.WebviewPanel | undefined;

  setPanel(panel: vscode.WebviewPanel): void {
    this.panel = panel;
    panel.onDidDispose(() => {
      if (this.panel === panel) {
        this.panel = undefined;
      }
    });
  }

  postOrchestrationState(state: OrchestrationStatePayload): void {
    if (this.panel === undefined) return;
    const message: WebviewOutboundMessage = {
      version: CONTRACT_VERSION,
      requestId: crypto.randomUUID(),
      type: "orchestration.state",
      payload: state as unknown as Record<string, unknown>
    };
    void this.panel.webview.postMessage(message);
  }
}
