import type * as vscode from "vscode";

import type {
  OrchestrationStatePayload,
  WebviewOutboundMessageType
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
    void this.panel.webview.postMessage({
      version: CONTRACT_VERSION,
      requestId: crypto.randomUUID(),
      type: "orchestration.state" satisfies WebviewOutboundMessageType,
      payload: state
    });
  }
}
