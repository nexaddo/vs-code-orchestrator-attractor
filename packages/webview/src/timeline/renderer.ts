import type { TimelineState } from "./model";

export function renderTimeline(state: TimelineState): string {
  const { runId, events } = state;

  const eventsHtml =
    events.length > 0
      ? events
          .map(
            (evt) => `
<div class="timeline-event">
  <span class="event-timestamp">${escapeHtml(evt.timestamp)}</span>
  <span class="event-name">${escapeHtml(evt.name)}</span>
  <span class="event-aggregate">${escapeHtml(evt.aggregateType)}:${escapeHtml(evt.aggregateId)}</span>
</div>`.trim()
          )
          .join("")
      : `<div class="timeline-empty">No events yet</div>`;

  return `
<div class="timeline-container">
  <h1>Timeline</h1>
  <p class="timeline-run-id">Run: ${escapeHtml(runId)}</p>

  <section class="timeline-events">
    <div class="event-feed">
      ${eventsHtml}
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
