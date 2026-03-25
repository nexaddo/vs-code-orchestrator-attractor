import type { RepositoryRecord } from "@attractor/shared";
import type { PlanRepositoryPickerState, PlanState } from "./model";

function renderRepoBadgeRow(
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

export function renderPlanRepositoryPicker(
  state: PlanRepositoryPickerState
): string {
  const {
    availableRepositories,
    selectedExecutableId,
    selectedContextIds,
    contextAliases
  } = state;

  const executableOptions = availableRepositories
    .map((repo) => {
      const isSelected = repo.id === selectedExecutableId;
      const radioAttr = isSelected ? " checked" : "";
      return `<div class="picker-repo-row">
  <input type="radio" name="executable-repo" value="${escapeHtml(repo.id)}"${radioAttr}
    data-action="plan.picker.executable" id="exec-${escapeHtml(repo.id)}">
  <label for="exec-${escapeHtml(repo.id)}">
    <span class="repo-name">${escapeHtml(repo.name)}</span>
    <span class="repo-branch">${escapeHtml(repo.defaultBranch)}</span>
  </label>
</div>`;
    })
    .join("");

  const contextOptions = availableRepositories
    .filter((repo) => repo.id !== selectedExecutableId)
    .map((repo) => {
      const isChecked = selectedContextIds.includes(repo.id);
      const checkAttr = isChecked ? " checked" : "";
      const alias = contextAliases[repo.id] ?? repo.name;
      return `<div class="picker-repo-row">
  <input type="checkbox" name="context-repo" value="${escapeHtml(repo.id)}"${checkAttr}
    data-action="plan.picker.context" id="ctx-${escapeHtml(repo.id)}">
  <label for="ctx-${escapeHtml(repo.id)}">
    <span class="repo-name">${escapeHtml(repo.name)}</span>
    <span class="repo-branch">${escapeHtml(repo.defaultBranch)}</span>
    <span class="repo-alias">mount as: ${escapeHtml(alias)}</span>
  </label>
</div>`;
    })
    .join("");

  const noContextAvailable =
    availableRepositories.filter((r) => r.id !== selectedExecutableId)
      .length === 0;

  return `<div class="plan-repository-picker">
  <section class="picker-section picker-section--executable">
    <h3>Executable Repository <span class="picker-note">(writable — one per plan in v1)</span></h3>
    <div class="picker-repo-list">
      ${executableOptions.length > 0 ? executableOptions : `<p class="picker-empty">No repositories registered</p>`}
    </div>
  </section>

  <section class="picker-section picker-section--context">
    <h3>Context Repositories <span class="picker-note">(read-only — optional)</span></h3>
    <div class="picker-repo-list">
      ${noContextAvailable ? `<p class="picker-empty">No additional repositories available</p>` : contextOptions}
    </div>
    <button class="action-btn action-btn--secondary" data-action="repository.add">+ Register Another Repository</button>
  </section>

  <p class="picker-v1-note">ⓘ v1 allows exactly one writable repository per plan.</p>
</div>`;
}

export function renderPlan(state: PlanState): string {
  const { plan, graph, runs, activeRun, repositories } = state;

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
          .map((run) =>
            `
<div class="run-item">
  <span class="run-id">${escapeHtml(run.id)}</span>
  <span class="run-status run-status--${escapeHtml(run.status)}">${escapeHtml(run.status)}</span>
  <span class="run-created">${escapeHtml(run.createdAt)}</span>
</div>`.trim()
          )
          .join("")
      : `<div class="run-empty">No runs yet</div>`;

  const repoBadgeHtml =
    repositories != null && repositories.length > 0
      ? renderRepoBadgeRow(repositories, plan.repositories)
      : "";

  const reposHtml = plan.repositories
    .map((ref) =>
      `
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
    ${repoBadgeHtml}
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
