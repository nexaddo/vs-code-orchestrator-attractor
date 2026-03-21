/**
 * Browser entry point for the Attractor webview bundle.
 *
 * This file is the esbuild entry point and runs in the VS Code WebviewPanel
 * browser context.  It is NOT imported by the extension host.
 *
 * Styles are built separately via postcss CLI → dist/bundle/webview.css
 * and loaded via a <link> tag in the extension's HTML shell (M3.9).
 *
 * Boot sequence:
 *  1. Call bootWebview() which acquires the VS Code API and sends the "ready"
 *     handshake to the extension host
 *  2. Listen for inbound messages and dispatch to the appropriate view renderer
 */
import { bootWebview, decodeOverviewState, renderOverview } from "./index";

/**
 * Root mount point injected by the extension HTML shell.
 * Falls back to document.body if no #root element is present.
 */
function getRoot(): HTMLElement {
  return document.getElementById("root") ?? document.body;
}

/**
 * Handle inbound messages from the extension host.
 */
window.addEventListener("message", (event: MessageEvent) => {
  const raw = event.data as unknown;
  if (typeof raw !== "object" || raw === null) return;

  const msg = raw as { type?: string; payload?: unknown; requestId?: string };

  switch (msg.type) {
    case "overview.state": {
      const result = decodeOverviewState(raw);
      if (result.success) {
        getRoot().innerHTML = renderOverview(result.state);
      }
      break;
    }

    default:
      // Unknown message types are silently ignored in v1.
      break;
  }
});

// Kick off the boot handshake — sends "ready" to the extension host.
bootWebview();
