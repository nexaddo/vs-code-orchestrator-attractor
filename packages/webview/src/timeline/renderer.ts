import type { EventEnvelope } from "@attractor/shared";
import type { TimelineState } from "./model";

const HANDOFF_EVENT_NAME = "handoff.created";

function isHandoffEvent(evt: EventEnvelope): boolean {
  return evt.name === HANDOFF_EVENT_NAME;
}

function renderHandoffEventRow(evt: EventEnvelope): string {
  const payload = evt.payload as Record<string, unknown>;
  const fromRole =
    typeof payload["fromRole"] === "string" ? payload["fromRole"] : "?";
  const toRole =
    typeof payload["toRole"] === "string" ? payload["toRole"] : "?";
  const reason = typeof payload["reason"] === "string" ? payload["reason"] : "";

  return `<div class="timeline-event timeline-event--handoff">
  <span class="event-timestamp">${escapeHtml(evt.timestamp)}</span>
  <span class="handoff-arrow">→</span>
  <span class="handoff-roles">${escapeHtml(fromRole.toUpperCase())} → ${escapeHtml(toRole.toUpperCase())}</span>
  ${reason.length > 0 ? `<span class="handoff-reason">"${escapeHtml(reason)}"</span>` : ""}
</div>`;
}

function renderRegularEventRow(evt: EventEnvelope): string {
  return `<div class="timeline-event">
  <span class="event-timestamp">${escapeHtml(evt.timestamp)}</span>
  <span class="event-name">${escapeHtml(evt.name)}</span>
  <span class="event-aggregate">${escapeHtml(evt.aggregateType)}:${escapeHtml(evt.aggregateId)}</span>
</div>`;
}

function renderAgentActionFeed(events: EventEnvelope[]): string {
  const handoffEvents = events.filter(isHandoffEvent);
  const feedHtml =
    handoffEvents.length > 0
      ? handoffEvents.map(renderHandoffEventRow).join("")
      : `<div class="action-feed-empty">No agent actions yet</div>`;

  return `<div class="agent-action-feed">
  <h3 class="action-feed-heading">Agent Action Feed</h3>
  <div class="action-feed-events">${feedHtml}</div>
</div>`;
}

export function renderTimeline(state: TimelineState): string {
  const { runId, events } = state;

  const eventsHtml =
    events.length > 0
      ? events
          .map((evt) =>
            isHandoffEvent(evt)
              ? renderHandoffEventRow(evt)
              : renderRegularEventRow(evt)
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

  <section class="timeline-action-feed">
    ${renderAgentActionFeed(events)}
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
