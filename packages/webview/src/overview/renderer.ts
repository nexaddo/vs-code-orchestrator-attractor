import type { OverviewState } from "./model";

export function renderOverview(state: OverviewState): string {
  const { summary, repositories } = state;

  const repositoriesHtml = repositories
    .map(
      (repo) =>
        `<div class="repository-item"><span class="repo-name">${escapeHtml(repo.name)}</span></div>`
    )
    .join("");

  return `
<div class="overview-container">
  <h1>Overview</h1>
  
  <section class="workspace-summary">
    <h2>Workspace Summary</h2>
    <div class="summary-stats">
      <div class="stat">
        <span class="stat-label">Repositories</span>
        <span class="stat-value">${summary.totalRepositories}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Plans</span>
        <span class="stat-value">${summary.totalPlans}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Active Runs</span>
        <span class="stat-value">${summary.activeRuns}</span>
      </div>
    </div>
  </section>
  
  <section class="repositories">
    <h2>Repositories</h2>
    <div class="repository-list">
      ${repositoriesHtml}
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
