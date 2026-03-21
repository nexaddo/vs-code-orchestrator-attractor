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
}

export interface WebviewViewLike {
  webview: WebviewLike;
}

export interface AttractorViewProviderDeps {
  extensionUri: { fsPath: string };
  webviewBundlePath: string[];
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

  constructor(private readonly deps: AttractorViewProviderDeps) {}

  resolveWebviewView(webviewView: WebviewViewLike): void {
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
  }
}
