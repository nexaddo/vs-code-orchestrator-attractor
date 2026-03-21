import { describe, expect, it, vi } from "vitest";

import {
  AttractorViewProvider,
  type WebviewLike,
  type WebviewViewLike,
  generateNonce
} from "../../src/dashboard/webview-provider";

const normalizePath = (value: string): string => value.replaceAll("\\", "/");

const makeWebview = (): {
  webview: WebviewLike;
  asUriCalls: string[];
} => {
  const asUriCalls: string[] = [];
  const webview: WebviewLike = {
    options: {},
    html: "",
    cspSource: "vscode-webview-resource:",
    asWebviewUri(uri) {
      const normalized = normalizePath(uri.fsPath);
      asUriCalls.push(normalized);
      return {
        toString: () => `vscode-resource:/${normalized}`
      };
    },
    onDidReceiveMessage: vi.fn(() => ({ dispose: vi.fn() }))
  };

  return { webview, asUriCalls };
};

describe("AttractorViewProvider", () => {
  it("resolveWebviewView enables scripts", () => {
    const { webview } = makeWebview();
    const provider = new AttractorViewProvider({
      extensionUri: { fsPath: "/repo-root" },
      webviewBundlePath: ["packages", "webview", "dist", "bundle"]
    });

    provider.resolveWebviewView({ webview });

    expect(webview.options.enableScripts).toBe(true);
  });

  it("resolveWebviewView sets html containing the root mount div", () => {
    const { webview } = makeWebview();
    const provider = new AttractorViewProvider({
      extensionUri: { fsPath: "/repo-root" },
      webviewBundlePath: ["packages", "webview", "dist", "bundle"]
    });

    provider.resolveWebviewView({ webview } satisfies WebviewViewLike);

    expect(webview.html).toContain('<div id="root"></div>');
  });

  it("resolveWebviewView html includes a CSP meta tag", () => {
    const { webview } = makeWebview();
    const provider = new AttractorViewProvider({
      extensionUri: { fsPath: "/repo-root" },
      webviewBundlePath: ["packages", "webview", "dist", "bundle"]
    });

    provider.resolveWebviewView({ webview });

    expect(webview.html).toContain('http-equiv="Content-Security-Policy"');
    expect(webview.html).toContain("default-src 'none'");
    expect(webview.html).toContain("style-src vscode-webview-resource:");
    expect(webview.html).toMatch(/script-src 'nonce-[a-f0-9]+';/);
  });

  it("resolveWebviewView uses script and css URIs from asWebviewUri", () => {
    const { webview, asUriCalls } = makeWebview();
    const provider = new AttractorViewProvider({
      extensionUri: { fsPath: "/repo-root" },
      webviewBundlePath: ["packages", "webview", "dist", "bundle"]
    });

    provider.resolveWebviewView({ webview });

    expect(asUriCalls).toHaveLength(2);
    expect(asUriCalls).toContain(
      "/repo-root/packages/webview/dist/bundle/webview.css"
    );
    expect(asUriCalls).toContain(
      "/repo-root/packages/webview/dist/bundle/webview.js"
    );
    expect(webview.html).toContain(
      'href="vscode-resource://repo-root/packages/webview/dist/bundle/webview.css"'
    );
    expect(webview.html).toContain(
      'src="vscode-resource://repo-root/packages/webview/dist/bundle/webview.js"'
    );
  });

  it("viewType static property equals attractor.dashboard", () => {
    expect(AttractorViewProvider.viewType).toBe("attractor.dashboard");
  });

  it("generateNonce returns a dash-free nonce", () => {
    const nonce = generateNonce();

    expect(nonce).toMatch(/^[a-f0-9]+$/);
    expect(nonce).not.toContain("-");
    expect(nonce.length).toBeGreaterThan(0);
  });
});
