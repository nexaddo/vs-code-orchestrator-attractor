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
});
