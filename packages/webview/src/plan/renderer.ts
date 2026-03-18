import type { PlanState } from "./model";

export function renderPlan(state: PlanState): string {
  const { plan, graph, runs, activeRun } = state;

  const graphSection =
    graph != null
      ? `
<section class="plan-graph-source">
  <h2>Graph</h2>
  <p class="graph-node-count">${graph.nodes.length} node${graph.nodes.length === 1 ? "" : "s"}</p>
  <pre class="graph-source">${escapeHtml(graph.source)}</pre>
</section>`
      : `
<section class="plan-graph-source">
  <h2>Graph</h2>
  <p class="graph-empty">No graph compiled yet</p>
</section>`;

  const activeRunBanner =
    activeRun != null
      ? `<div class="active-run-banner">
  <span class="active-run-label">Active Run</span>
  <span class="active-run-id">${escapeHtml(activeRun.id)}</span>
  <span class="active-run-status run-status--${escapeHtml(activeRun.status)}">${escapeHtml(activeRun.status)}</span>
</div>`
      : "";

  const runsHtml =
    runs.length > 0
      ? runs
          .map(
            (run) => `
<div class="run-item">
  <span class="run-id">${escapeHtml(run.id)}</span>
  <span class="run-status run-status--${escapeHtml(run.status)}">${escapeHtml(run.status)}</span>
  <span class="run-created">${escapeHtml(run.createdAt)}</span>
</div>`.trim()
          )
          .join("")
      : `<div class="run-empty">No runs yet</div>`;

  const reposHtml = plan.repositories
    .map(
      (ref) => `
<div class="repo-ref">
  <span class="repo-ref-id">${escapeHtml(ref.repositoryId)}</span>
  <span class="repo-ref-role">${escapeHtml(ref.role)}</span>
  <span class="repo-ref-access">${escapeHtml(ref.access)}</span>
</div>`.trim()
    )
    .join("");

  return `
<div class="plan-container">
  <h1>Plan Inspector</h1>

  ${activeRunBanner}

  <section class="plan-details">
    <h2>${escapeHtml(plan.title)}</h2>
    <p class="plan-goal">${escapeHtml(plan.goal)}</p>
    <dl class="detail-list">
      <dt>Status</dt>
      <dd class="plan-status plan-status--${escapeHtml(plan.status)}">${escapeHtml(plan.status)}</dd>
      <dt>Created</dt>
      <dd>${escapeHtml(plan.createdAt)}</dd>
    </dl>
  </section>

  <section class="plan-repositories">
    <h2>Repositories</h2>
    <div class="repo-ref-list">
      ${reposHtml}
    </div>
  </section>

  ${graphSection}

  <section class="plan-runs">
    <h2>Runs</h2>
    <div class="run-list">
      ${runsHtml}
    </div>
    <div class="plan-actions">
      <button class="action-btn action-btn--create" data-action="plan.run" data-plan-id="${escapeHtml(plan.id)}">Start New Run</button>
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
