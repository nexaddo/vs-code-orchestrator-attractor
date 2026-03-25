import type { RepositoryRecord } from "@attractor/shared";
import type { AgentRolePhaseView, OrchestrationState, RunState } from "./model";

const ROLE_LABELS: Record<string, string> = {
  orchestrator: "Orchestrator",
  planner: "Planner",
  implementer: "Implementer",
  reviewer: "Reviewer"
};

export function renderRepoBadgeRow(
  repositories: RepositoryRecord[],
  planRepositories: Array<{ repositoryId: string; access: string }>
): string {
  if (repositories.length === 0) return "";

  const repoMap = new Map(repositories.map((r) => [r.id, r]));
  const badges = planRepositories
    .map((ref) => {
      const repo = repoMap.get(ref.repositoryId);
      if (repo == null) return null;
      const isWritable = ref.access === "read_write";
      const label = isWritable ? "WRITABLE" : "READ-ONLY";
      const cssClass = isWritable
        ? "repo-badge repo-badge--writable"
        : "repo-badge repo-badge--readonly";
      return `<span class="${cssClass}">[${label}] ${escapeHtml(repo.name)} / ${escapeHtml(repo.defaultBranch)}</span>`;
    })
    .filter((b): b is string => b != null);

  if (badges.length === 0) return "";

  return `<div class="repo-badge-row">${badges.join(" ")}</div>`;
}

function renderRetryFromRoleActions(role: string, runId: string): string {
  const actions: string[] = [];

  if (role === "implementer") {
    actions.push(
      `<button class="action-btn action-btn--retry" data-action="run.retry.implementer" data-run-id="${escapeHtml(runId)}">Retry Implementer</button>`,
      `<button class="action-btn action-btn--retry" data-action="run.retry.from-planner" data-run-id="${escapeHtml(runId)}">Retry From Planner</button>`
    );
  } else if (role === "reviewer") {
    actions.push(
      `<button class="action-btn action-btn--retry" data-action="run.retry.from-planner" data-run-id="${escapeHtml(runId)}">Retry From Planner</button>`
    );
  } else {
    actions.push(
      `<button class="action-btn action-btn--retry" data-action="run.retry.milestone" data-run-id="${escapeHtml(runId)}">Retry Milestone</button>`
    );
  }
  actions.push(
    `<button class="action-btn action-btn--secondary" data-action="run.artifacts.view" data-run-id="${escapeHtml(runId)}">View Artifacts</button>`
  );

  return `<div class="retry-role-actions">${actions.join("")}</div>`;
}

function renderAgentRolePhase(
  phase: AgentRolePhaseView,
  runId: string
): string {
  const label = ROLE_LABELS[phase.role] ?? phase.role;
  const statusIcon =
    phase.status === "done"
      ? "✓"
      : phase.status === "failed"
        ? "✗"
        : phase.status === "running"
          ? "..."
          : "";

  const statusLine =
    phase.status === "running" && phase.taskSummary != null
      ? `<span class="role-task-summary">${escapeHtml(phase.taskSummary)}</span>`
      : phase.status === "failed" && phase.errorLabel != null
        ? `<span class="role-error-label">${escapeHtml(phase.errorLabel)}</span>`
        : "";

  const retryActions =
    phase.status === "failed"
      ? renderRetryFromRoleActions(phase.role, runId)
      : "";

  return `<div class="agent-role-status agent-role-status--${escapeHtml(phase.status)}">
  <span class="role-label">${escapeHtml(label)}</span>
  <span class="role-status-value">${escapeHtml(phase.status.toUpperCase())} ${statusIcon}</span>
  ${statusLine}
  ${retryActions}
</div>`;
}

export function renderOrchestrationPhaseBar(
  state: OrchestrationState,
  runId: string
): string {
  const phasesHtml = state.phases
    .map((phase) => renderAgentRolePhase(phase, runId))
    .join(`<span class="phase-arrow">--></span>`);

  const runningPhase = state.phases.find((p) => p.status === "running");
  const activeStatusLine =
    runningPhase != null && runningPhase.taskSummary != null
      ? `<p class="orchestration-active-task">Currently: ${escapeHtml(ROLE_LABELS[runningPhase.role] ?? runningPhase.role)} — "${escapeHtml(runningPhase.taskSummary)}"</p>`
      : "";

  return `<section class="orchestration-phase-bar">
  <h2 class="orchestration-heading">Orchestration — Milestone ${state.milestoneIndex}/${state.milestoneCount}: "${escapeHtml(state.milestoneName)}"</h2>
  <div class="phase-strip">${phasesHtml}</div>
  ${activeStatusLine}
</section>`;
}

export function renderRun(state: RunState): string {
  const { run, plan, currentStep, logTail, repositories, orchestration } =
    state;

  const isTerminal =
    run.status === "completed" ||
    run.status === "failed" ||
    run.status === "canceled";

  const controlsHtml = isTerminal
    ? `<button class="action-btn action-btn--retry" data-action="run.retry" data-run-id="${escapeHtml(run.id)}">Retry</button>`
    : `
<button class="action-btn action-btn--resume" data-action="run.resume" data-run-id="${escapeHtml(run.id)}"${run.status !== "paused" ? " disabled" : ""}>Resume</button>
<button class="action-btn action-btn--cancel" data-action="run.cancel" data-run-id="${escapeHtml(run.id)}"${isTerminal ? " disabled" : ""}>Cancel</button>
    `.trim();

  const repoBadgeHtml =
    repositories != null && repositories.length > 0
      ? renderRepoBadgeRow(repositories, plan.repositories)
      : "";

  const orchestrationHtml =
    orchestration != null
      ? renderOrchestrationPhaseBar(orchestration, run.id)
      : "";

  const currentStepHtml =
    currentStep != null
      ? `<div class="current-step">
  <span class="current-step-label">Current Step</span>
  <span class="current-step-id">${escapeHtml(currentStep)}</span>
</div>`
      : "";

  const logHtml =
    logTail.length > 0
      ? logTail
          .map((line) => `<div class="log-line">${escapeHtml(line)}</div>`)
          .join("")
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
    ${repoBadgeHtml}
  </section>

  ${orchestrationHtml}

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
