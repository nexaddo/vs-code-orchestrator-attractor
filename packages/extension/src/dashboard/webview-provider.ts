import { randomUUID } from "node:crypto";
import path from "node:path";

import { buildWebviewHtml } from "./webview-html";

export interface WebviewLike {
  options: {
    enableScripts?: boolean;
    localResourceRoots?: Array<{ fsPath: string }>;
  };
  html: string;
  cspSource?: string;
  asWebviewUri(uri: { fsPath: string }): { toString(): string };
  onDidReceiveMessage: (listener: (e: unknown) => void) => { dispose(): void };
  postMessage?(message: unknown): void | PromiseLike<boolean>;
}

export interface WebviewViewLike {
  webview: WebviewLike;
  reveal?(): void;
}

/**
 * Thin adapter matching WebviewPanelLike from bridge.ts so we can post
 * messages back to the webview without coupling to the VS Code API.
 */
export interface WebviewPostTarget {
  postMessage(message: unknown): void | PromiseLike<boolean>;
}

export interface AttractorViewProviderDeps {
  extensionUri: { fsPath: string };
  webviewBundlePath: string[];
  /**
   * Bridge callback wired in runtime.ts — receives raw inbound messages
   * from the webview and a post-target adapter.  When undefined the provider
   * silently drops inbound messages (useful for headless tests).
   */
  onMessage?: (raw: unknown, panel: WebviewPostTarget) => Promise<void>;
}

const joinPathLike = (
  base: { fsPath: string },
  ...segments: string[]
): { fsPath: string } => ({
  fsPath: path.join(base.fsPath, ...segments)
});

export const generateNonce = (): string => randomUUID().replace(/-/g, "");

export class AttractorViewProvider {
  static readonly viewType = "attractor.dashboard";

  private webviewView: WebviewViewLike | null = null;

  constructor(private readonly deps: AttractorViewProviderDeps) {}

  /**
   * Reveal/focus the webview view if it exists.
   * Called by the attractor.openDashboard command for E2E automation.
   */
  revealView(): void {
    this.webviewView?.reveal?.();
  }

  resolveWebviewView(webviewView: WebviewViewLike): void {
    this.webviewView = webviewView;
    const { webview } = webviewView;
    const bundleRoot = joinPathLike(
      this.deps.extensionUri,
      ...this.deps.webviewBundlePath
    );

    webview.options = {
      ...webview.options,
      enableScripts: true,
      localResourceRoots: [bundleRoot]
    };

    const cssUri = webview
      .asWebviewUri(joinPathLike(bundleRoot, "webview.css"))
      .toString();
    const scriptUri = webview
      .asWebviewUri(joinPathLike(bundleRoot, "webview.js"))
      .toString();
    const nonce = generateNonce();

    webview.html = buildWebviewHtml({
      scriptUri,
      cssUri,
      nonce,
      cspSource: webview.cspSource ?? "vscode-webview-resource:"
    });

    // --- Bridge adapter wiring ---
    // Create a WebviewPostTarget that forwards outbound messages to the
    // actual webview, then subscribe to inbound messages and route them
    // through the bridge callback provided by runtime.ts.
    const postTarget: WebviewPostTarget = {
      postMessage: (message: unknown) => webview.postMessage?.(message)
    };

    webview.onDidReceiveMessage((raw: unknown) => {
      if (this.deps.onMessage) {
        void this.deps.onMessage(raw, postTarget);
      }
    });
  }
}
