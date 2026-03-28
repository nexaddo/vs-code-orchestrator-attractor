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
 *  1. Create the app store and mount the Preact app
 *  2. Listen for inbound messages and dispatch to the store
 *  3. Call bootWebview() which acquires the VS Code API and sends the "ready"
 *     handshake to the extension host
 */
import { dispatchInboundMessage } from "./app/message-dispatch";
import { createStore } from "./app/store";
import { bootWebview } from "./index";
import { mountApp } from "./mount";

/**
 * Root mount point injected by the extension HTML shell.
 * Falls back to document.body if no #root element is present.
 */
function getRoot(): HTMLElement {
  return document.getElementById("root") ?? document.body;
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const store = createStore();

// Mount the Preact app
mountApp(store, getRoot());

// Route inbound messages from the extension host to the store
window.addEventListener("message", (event: MessageEvent) => {
  dispatchInboundMessage(store, event.data);
});

// Kick off the boot handshake — sends "ready" to the extension host.
bootWebview();
