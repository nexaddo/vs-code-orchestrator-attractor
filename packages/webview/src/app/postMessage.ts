/**
 * Typed helper for sending inbound messages from the webview to the
 * extension host.  Each function corresponds to a WebviewInboundMessage type.
 *
 * acquireVsCodeApi() is only available in the VS Code webview browser context.
 * In unit tests, the VS Code API is not present — tests should verify
 * the message shape directly rather than calling these functions.
 */

type VsCodeApi = { postMessage: (msg: unknown) => void };

let cachedApi: VsCodeApi | null = null;

function getVsCodeApi(): VsCodeApi {
  if (!cachedApi) {
    cachedApi = (
      globalThis as unknown as {
        acquireVsCodeApi: () => VsCodeApi;
      }
    ).acquireVsCodeApi();
  }
  return cachedApi;
}

function sendMessage(type: string, payload: Record<string, unknown>): void {
  getVsCodeApi().postMessage({
    version: 1,
    requestId: crypto.randomUUID(),
    type,
    payload
  });
}

// ---- Query commands ----

export function openRepository(repositoryId: string): void {
  sendMessage("repository.open", { repositoryId });
}

export function openMilestone(planId: string): void {
  sendMessage("milestone.open", { planId });
}

export function focusGraphNode(nodeId: string, status: string): void {
  sendMessage("graph.focus", { nodeId, status });
}

export function openRun(runId: string): void {
  sendMessage("run.open", { runId });
}

// ---- Action commands (deferred to M4+ runtime, but message shape is ready) ----

export function createPlan(
  repositoryId: string,
  title: string,
  goal: string
): void {
  sendMessage("plan.create", { repositoryId, title, goal });
}

export function runPlan(planId: string): void {
  sendMessage("plan.run", { planId });
}

export function resumeRun(runId: string): void {
  sendMessage("run.resume", { runId });
}

export function cancelRun(runId: string): void {
  sendMessage("run.cancel", { runId });
}

export function retryRun(runId: string): void {
  sendMessage("run.retry", { runId });
}
