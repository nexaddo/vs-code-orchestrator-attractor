import type { RepositoryState } from "./model";

export function renderRepository(state: RepositoryState): string {
  const { repository, plans } = state;

  const labelsHtml =
    repository.labels.length > 0
      ? repository.labels
          .map((l) => `<span class="label">${escapeHtml(l)}</span>`)
          .join("")
      : `<span class="label-empty">No labels</span>`;

  const plansHtml =
    plans.length > 0
      ? plans
          .map((plan) =>
            `
<div class="plan-item">
  <span class="plan-title">${escapeHtml(plan.title)}</span>
  <span class="plan-status plan-status--${escapeHtml(plan.status)}">${escapeHtml(plan.status)}</span>
</div>`.trim()
          )
          .join("")
      : `<div class="plan-empty">No plans registered</div>`;

  return `
<div class="repository-container">
  <h1>Repository Inspector</h1>

  <section class="repository-details">
    <h2>${escapeHtml(repository.name)}</h2>
    <dl class="detail-list">
      <dt>Root URI</dt>
      <dd>${escapeHtml(repository.rootUri)}</dd>
      <dt>Default Branch</dt>
      <dd>${escapeHtml(repository.defaultBranch)}</dd>
      ${
        repository.remoteUrl != null
          ? `<dt>Remote</dt><dd>${escapeHtml(repository.remoteUrl)}</dd>`
          : ""
      }
      <dt>Labels</dt>
      <dd class="label-list">${labelsHtml}</dd>
    </dl>
  </section>

  <section class="repository-plans">
    <h2>Plans</h2>
    <div class="plan-list">
      ${plansHtml}
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
