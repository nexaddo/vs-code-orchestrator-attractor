/**
 * Acceptance tests for Timeline UAC scenarios.
 *
 * UAC source: docs/ui-design.md (Orchestration Workflow UI — Handoff Events in Timeline)
 *
 * Coverage areas:
 * - UAC-TL-1: Handoff event row renders gracefully without reason field
 * - UAC-TL-2: AgentActionFeed shows empty state when events exist but none are handoffs
 */
import { describe, it, expect } from "vitest";
import { renderTimeline } from "../../src/timeline/renderer";
import type { TimelineState } from "../../src/timeline/model";

const baseHandoff = {
  version: 1 as const,
  id: "evt_h_001",
  name: "handoff.created",
  aggregateType: "Run",
  aggregateId: "run_001",
  correlationId: "corr_001",
  timestamp: "2026-01-01T00:01:00.000Z",
  payload: {
    fromRole: "orchestrator",
    toRole: "planner",
    reason: "Starting milestone: Generate changelog"
  }
};

const regularEvent = {
  version: 1 as const,
  id: "evt_r_001",
  name: "run.started",
  aggregateType: "Run",
  aggregateId: "run_001",
  correlationId: "corr_001",
  timestamp: "2026-01-01T00:00:00.000Z",
  payload: {}
};

// ── UAC-TL-1: Handoff event row without reason field ─────────────────────────

describe("UAC-TL-1: HandoffEventRow renders gracefully when reason is absent", () => {
  /**
   * Given: a handoff.created event with no reason in payload
   * When: renderTimeline is called
   * Then: no empty quoted string ('""') is rendered for the reason
   */
  it("handoff without reason — does not render empty quoted reason", () => {
    const handoffNoReason = {
      ...baseHandoff,
      payload: { fromRole: "planner", toRole: "implementer" }
    };
    const state: TimelineState = {
      runId: "run_001",
      events: [handoffNoReason]
    };
    const html = renderTimeline(state);
    expect(html).toContain("timeline-event--handoff");
    expect(html).toContain("PLANNER");
    expect(html).toContain("IMPLEMENTER");
    // No empty quoted reason like: <span class="handoff-reason">""</span>
    expect(html).not.toContain('""');
    expect(html).not.toContain("handoff-reason");
  });

  /**
   * Given: a handoff event with an empty string reason
   * When: renderTimeline is called
   * Then: no handoff-reason span is rendered for empty reason
   */
  it("handoff with empty string reason — does not render empty quoted reason", () => {
    const handoffEmptyReason = {
      ...baseHandoff,
      payload: { fromRole: "implementer", toRole: "reviewer", reason: "" }
    };
    const state: TimelineState = {
      runId: "run_001",
      events: [handoffEmptyReason]
    };
    const html = renderTimeline(state);
    expect(html).toContain("timeline-event--handoff");
    expect(html).not.toContain("handoff-reason");
  });
});

// ── UAC-TL-2: AgentActionFeed empty state with non-handoff events ─────────────

describe("UAC-TL-2: AgentActionFeed shows empty state when no handoff events present", () => {
  /**
   * Given: a timeline with only regular (non-handoff) events
   * When: renderTimeline is called
   * Then: AgentActionFeed shows "No agent actions yet"
   */
  it("regular events only — AgentActionFeed shows 'No agent actions yet'", () => {
    const state: TimelineState = {
      runId: "run_001",
      events: [
        regularEvent,
        { ...regularEvent, id: "evt_r_002", name: "step.completed" }
      ]
    };
    const html = renderTimeline(state);
    expect(html).toContain("Agent Action Feed");
    expect(html).toContain("No agent actions yet");
    // The main event feed should still show the regular events
    expect(html).toContain("run.started");
    expect(html).toContain("step.completed");
  });

  /**
   * Given: a timeline mixing regular and handoff events
   * When: renderTimeline is called
   * Then: AgentActionFeed contains only handoff events, not regular events
   */
  it("mixed events — AgentActionFeed contains only handoff transitions", () => {
    const state: TimelineState = {
      runId: "run_001",
      events: [regularEvent, baseHandoff]
    };
    const html = renderTimeline(state);
    // Extract the AgentActionFeed section
    const feedSection = html.split("Agent Action Feed")[1] ?? "";
    expect(feedSection).toContain("ORCHESTRATOR");
    expect(feedSection).toContain("PLANNER");
    // Regular event should NOT appear in the action feed
    expect(feedSection).not.toContain("run.started");
  });

  /**
   * Given: handoff roles contain HTML injection
   * When: renderTimeline is called
   * Then: role names are HTML-escaped in the handoff row
   */
  it("handoff with XSS in role names — roles are escaped (uppercased before escaping)", () => {
    const handoffXss = {
      ...baseHandoff,
      payload: {
        fromRole: "<script>evil</script>",
        toRole: "<img onerror=1>",
        reason: "test"
      }
    };
    const state: TimelineState = {
      runId: "run_001",
      events: [handoffXss]
    };
    const html = renderTimeline(state);
    // Roles are toUpperCase()'d then HTML-escaped, so < becomes &lt; in uppercase context
    expect(html).not.toContain("<SCRIPT>");
    expect(html).not.toContain("<IMG");
    // The escaped version of uppercased roles
    expect(html).toContain("&lt;SCRIPT&gt;");
    expect(html).toContain("&lt;IMG");
  });
});
