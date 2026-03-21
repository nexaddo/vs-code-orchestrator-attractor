import { describe, expect, it, vi } from "vitest";

import {
  AttractorViewProvider,
  type WebviewLike,
  type WebviewPostTarget,
  type WebviewViewLike,
  generateNonce
} from "../../src/dashboard/webview-provider";

const normalizePath = (value: string): string => value.replaceAll("\\", "/");

/**
 * Build a mock webview. When `captureListener` is true the
 * `onDidReceiveMessage` spy stores the listener so tests can invoke it
 * later (simulating inbound messages from the webview).
 */
const makeWebview = (
  opts: { captureListener?: boolean } = {}
): {
  webview: WebviewLike;
  asUriCalls: string[];
  /** Invoke the listener registered via onDidReceiveMessage */
  simulateMessage: (raw: unknown) => void;
  posted: unknown[];
} => {
  const asUriCalls: string[] = [];
  const posted: unknown[] = [];
  let listener: ((e: unknown) => void) | undefined;

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
    onDidReceiveMessage: vi.fn((cb: (e: unknown) => void) => {
      if (opts.captureListener) {
        listener = cb;
      }
      return { dispose: vi.fn() };
    }),
    postMessage: vi.fn((msg: unknown) => {
      posted.push(msg);
    })
  };

  return {
    webview,
    asUriCalls,
    simulateMessage: (raw: unknown) => {
      if (!listener) {
        throw new Error("No listener captured — use captureListener: true");
      }
      listener(raw);
    },
    posted
  };
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

// ---------------------------------------------------------------------------
// Bridge adapter wiring (Slice 2)
// ---------------------------------------------------------------------------

describe("AttractorViewProvider — bridge adapter wiring", () => {
  it("subscribes to onDidReceiveMessage during resolveWebviewView", () => {
    const { webview } = makeWebview();
    const provider = new AttractorViewProvider({
      extensionUri: { fsPath: "/repo-root" },
      webviewBundlePath: ["packages", "webview", "dist", "bundle"]
    });

    provider.resolveWebviewView({ webview });

    expect(webview.onDidReceiveMessage).toHaveBeenCalledOnce();
  });

  it("forwards inbound messages to the onMessage callback with a WebviewPostTarget", async () => {
    const { webview, simulateMessage } = makeWebview({
      captureListener: true
    });
    const received: Array<{ raw: unknown; target: WebviewPostTarget }> = [];

    const provider = new AttractorViewProvider({
      extensionUri: { fsPath: "/repo-root" },
      webviewBundlePath: ["packages", "webview", "dist", "bundle"],
      onMessage: async (raw, target) => {
        received.push({ raw, target });
      }
    });

    provider.resolveWebviewView({ webview });

    simulateMessage({
      version: 1,
      requestId: "r1",
      type: "ready",
      payload: {}
    });

    // onMessage is called asynchronously via void — give microtask a tick
    await vi.waitFor(() => expect(received).toHaveLength(1));

    expect(received[0]!.raw).toEqual({
      version: 1,
      requestId: "r1",
      type: "ready",
      payload: {}
    });
    // The post target should forward to webview.postMessage
    received[0]!.target.postMessage({ type: "test-response" });
    expect(webview.postMessage).toHaveBeenCalledWith({ type: "test-response" });
  });

  it("does not throw when onMessage is not provided (no handler)", () => {
    const { webview, simulateMessage } = makeWebview({
      captureListener: true
    });

    const provider = new AttractorViewProvider({
      extensionUri: { fsPath: "/repo-root" },
      webviewBundlePath: ["packages", "webview", "dist", "bundle"]
      // no onMessage
    });

    provider.resolveWebviewView({ webview });

    // Should not throw
    expect(() => simulateMessage({ some: "random message" })).not.toThrow();
  });

  it("postTarget adapter forwards to webview.postMessage", async () => {
    const { webview, simulateMessage, posted } = makeWebview({
      captureListener: true
    });

    const provider = new AttractorViewProvider({
      extensionUri: { fsPath: "/repo-root" },
      webviewBundlePath: ["packages", "webview", "dist", "bundle"],
      onMessage: async (_raw, target) => {
        // Simulate the bridge posting a response back
        target.postMessage({ type: "overview.state", payload: {} });
      }
    });

    provider.resolveWebviewView({ webview });
    simulateMessage({
      version: 1,
      requestId: "r2",
      type: "ready",
      payload: {}
    });

    await vi.waitFor(() => expect(posted).toHaveLength(1));

    expect(posted[0]).toEqual({ type: "overview.state", payload: {} });
  });
});
