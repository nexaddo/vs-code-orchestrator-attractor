export const WEBVIEW_SHELL_VERSION = 1;

export * from "./overview";

/**
 * Sends the initial `ready` message to the extension host.
 *
 * Call this once when the webview document is loaded.  The extension bridge
 * responds with an `overview.state` message that the webview can decode using
 * `decodeOverviewState`.
 *
 * Uses `acquireVsCodeApi()` which is only available in the VS Code webview
 * browser context.  In unit tests this path is not executed — tests drive the
 * bridge directly via `handleWebviewMessage`.
 */
export function sendReadyMessage(): void {
  // acquireVsCodeApi is injected by VS Code at runtime; the type is not
  // available in our build tooling so we access it via a type assertion.
  const vscode = (
    globalThis as unknown as {
      acquireVsCodeApi: () => { postMessage: (msg: unknown) => void };
    }
  ).acquireVsCodeApi();

  vscode.postMessage({
    version: 1,
    requestId: crypto.randomUUID(),
    type: "ready",
    payload: {}
  });
}

/**
 * Boots the webview shell: posts the `ready` handshake to the extension host
 * once the document is fully loaded.
 *
 * Idempotent — safe to call multiple times; the `load` event fires only once
 * per page lifecycle.
 */
export function bootWebview(): void {
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    sendReadyMessage();
  } else {
    window.addEventListener("load", () => sendReadyMessage(), { once: true });
  }
}
