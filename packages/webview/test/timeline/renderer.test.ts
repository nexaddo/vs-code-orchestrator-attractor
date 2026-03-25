import { describe, it, expect } from "vitest";
import { renderTimeline } from "../../src/timeline/renderer";
import type { TimelineState } from "../../src/timeline/model";

const baseEvent = {
  version: 1 as const,
  id: "evt_001",
  name: "run.started",
  aggregateType: "Run",
  aggregateId: "run_001",
  correlationId: "corr_001",
  timestamp: "2026-01-01T00:00:00.000Z",
  payload: {}
};

describe("renderTimeline", () => {
  it("should render Timeline heading", () => {
    const state: TimelineState = { runId: "run_001", events: [] };
    const html = renderTimeline(state);
    expect(html).toContain("<h1>Timeline</h1>");
    expect(html).toContain("timeline-container");
  });

  it("should render run ID", () => {
    const state: TimelineState = { runId: "run_001", events: [] };
    const html = renderTimeline(state);
    expect(html).toContain("run_001");
  });

  it("should render empty timeline message when no events", () => {
    const state: TimelineState = { runId: "run_001", events: [] };
    const html = renderTimeline(state);
    expect(html).toContain("No events yet");
  });

  it("should render event feed section", () => {
    const state: TimelineState = { runId: "run_001", events: [] };
    const html = renderTimeline(state);
    expect(html).toContain("timeline-events");
    expect(html).toContain("event-feed");
  });

  it("should render events with name and timestamp", () => {
    const state: TimelineState = {
      runId: "run_001",
      events: [
        baseEvent,
        {
          ...baseEvent,
          id: "evt_002",
          name: "step.started",
          timestamp: "2026-01-01T00:00:01.000Z"
        }
      ]
    };
    const html = renderTimeline(state);
    expect(html).toContain("run.started");
    expect(html).toContain("step.started");
    expect(html).toContain("2026-01-01T00:00:00.000Z");
    expect(html).toContain("2026-01-01T00:00:01.000Z");
  });

  it("should render aggregate type and ID", () => {
    const state: TimelineState = { runId: "run_001", events: [baseEvent] };
    const html = renderTimeline(state);
    expect(html).toContain("Run:run_001");
  });

  it("should escape HTML in event names", () => {
    const state: TimelineState = {
      runId: "run_001",
      events: [{ ...baseEvent, name: "<script>xss</script>" }]
    };
    const html = renderTimeline(state);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("should render AgentActionFeed section", () => {
    const state: TimelineState = { runId: "run_001", events: [] };
    const html = renderTimeline(state);
    expect(html).toContain("agent-action-feed");
    expect(html).toContain("Agent Action Feed");
    expect(html).toContain("No agent actions yet");
  });
});

describe("renderTimeline — HandoffEventRow", () => {
  const handoffEvent = {
    version: 1 as const,
    id: "evt_handoff_001",
    name: "handoff.created",
    aggregateType: "Run",
    aggregateId: "run_001",
    correlationId: "corr_001",
    timestamp: "2026-01-01T00:01:00.000Z",
    payload: {
      fromRole: "planner",
      toRole: "implementer",
      reason: "Task pack ready: 3 steps"
    }
  };

  it("should render handoff events with distinct CSS class", () => {
    const state: TimelineState = { runId: "run_001", events: [handoffEvent] };
    const html = renderTimeline(state);
    expect(html).toContain("timeline-event--handoff");
  });

  it("should render handoff role transition", () => {
    const state: TimelineState = { runId: "run_001", events: [handoffEvent] };
    const html = renderTimeline(state);
    expect(html).toContain("PLANNER");
    expect(html).toContain("IMPLEMENTER");
    expect(html).toContain("handoff-roles");
  });

  it("should render handoff reason", () => {
    const state: TimelineState = { runId: "run_001", events: [handoffEvent] };
    const html = renderTimeline(state);
    expect(html).toContain("Task pack ready: 3 steps");
    expect(html).toContain("handoff-reason");
  });

  it("should render handoff arrow indicator", () => {
    const state: TimelineState = { runId: "run_001", events: [handoffEvent] };
    const html = renderTimeline(state);
    expect(html).toContain("handoff-arrow");
  });

  it("should render handoff events in AgentActionFeed tab", () => {
    const regularEvent = {
      version: 1 as const,
      id: "evt_001",
      name: "run.started",
      aggregateType: "Run",
      aggregateId: "run_001",
      correlationId: "corr_001",
      timestamp: "2026-01-01T00:00:00.000Z",
      payload: {}
    };
    const state: TimelineState = {
      runId: "run_001",
      events: [regularEvent, handoffEvent]
    };
    const html = renderTimeline(state);
    const feedSection = html.split("Agent Action Feed")[1] ?? "";
    expect(feedSection).toContain("PLANNER");
    expect(feedSection).toContain("IMPLEMENTER");
  });

  it("should render regular events normally when mixed with handoff events", () => {
    const regularEvent = {
      version: 1 as const,
      id: "evt_001",
      name: "run.started",
      aggregateType: "Run",
      aggregateId: "run_001",
      correlationId: "corr_001",
      timestamp: "2026-01-01T00:00:00.000Z",
      payload: {}
    };
    const state: TimelineState = {
      runId: "run_001",
      events: [regularEvent, handoffEvent]
    };
    const html = renderTimeline(state);
    expect(html).toContain("run.started");
    expect(html).toContain("timeline-event--handoff");
  });
});
