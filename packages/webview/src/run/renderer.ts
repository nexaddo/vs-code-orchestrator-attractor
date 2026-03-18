import type { RunState } from "./model";

export function renderRun(state: RunState): string {
  const { run, plan, currentStep, logTail } = state;

  const isTerminal = run.status === "completed" || run.status === "failed" || run.status === "canceled";

  const controlsHtml = isTerminal
    ? `<button class="action-btn action-btn--retry" data-action="run.retry" data-run-id="${escapeHtml(run.id)}">Retry</button>`
    : `
<button class="action-btn action-btn--resume" data-action="run.resume" data-run-id="${escapeHtml(run.id)}"${run.status !== "paused" ? " disabled" : ""}>Resume</button>
<button class="action-btn action-btn--cancel" data-action="run.cancel" data-run-id="${escapeHtml(run.id)}"${isTerminal ? " disabled" : ""}>Cancel</button>
    `.trim();

  const currentStepHtml =
    currentStep != null
      ? `<div class="current-step">
  <span class="current-step-label">Current Step</span>
  <span class="current-step-id">${escapeHtml(currentStep)}</span>
</div>`
      : "";

  const logHtml =
    logTail.length > 0
      ? logTail.map((line) => `<div class="log-line">${escapeHtml(line)}</div>`).join("")
      : `<div class="log-empty">No log output</div>`;

  return `
<div class="run-container">
  <h1>Run Inspector</h1>

  <section class="run-details">
    <dl class="detail-list">
      <dt>Run ID</dt>
      <dd>${escapeHtml(run.id)}</dd>
      <dt>Plan</dt>
      <dd>${escapeHtml(plan.title)}</dd>
      <dt>Status</dt>
      <dd class="run-status run-status--${escapeHtml(run.status)}">${escapeHtml(run.status)}</dd>
      <dt>Created</dt>
      <dd>${escapeHtml(run.createdAt)}</dd>
      ${run.startedAt != null ? `<dt>Started</dt><dd>${escapeHtml(run.startedAt)}</dd>` : ""}
      ${run.completedAt != null ? `<dt>Completed</dt><dd>${escapeHtml(run.completedAt)}</dd>` : ""}
    </dl>
  </section>

  ${currentStepHtml}

  <section class="run-controls">
    <h2>Controls</h2>
    <div class="control-buttons">
      ${controlsHtml}
    </div>
  </section>

  <section class="run-log">
    <h2>Log</h2>
    <div class="log-tail">
      ${logHtml}
    </div>
  </section>
</div>
  `.trim();
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, (char) => map[char] ?? char);
}
