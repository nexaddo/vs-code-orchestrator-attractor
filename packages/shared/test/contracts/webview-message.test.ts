import { describe, expect, it } from "vitest";

import {
  OverviewStatePayloadSchema,
  WebviewInboundMessageSchema,
  WebviewOutboundMessageSchema
} from "../../src/contracts";

describe("webview message contracts", () => {
  it("accepts a valid inbound message", () => {
    const parsed = WebviewInboundMessageSchema.parse({
      version: 1,
      requestId: "req_1",
      type: "plan.run",
      payload: {
        planId: "plan_1"
      }
    });

    expect(parsed.type).toBe("plan.run");
  });

  it("rejects an inbound message without a requestId", () => {
    const result = WebviewInboundMessageSchema.safeParse({
      version: 1,
      type: "plan.run",
      payload: {}
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid outbound message", () => {
    const parsed = WebviewOutboundMessageSchema.parse({
      version: 1,
      requestId: "req_2",
      type: "toast",
      payload: {
        message: "ok"
      }
    });

    expect(parsed.type).toBe("toast");
  });

  it("accepts an outbound message with orchestration.state type", () => {
    const parsed = WebviewOutboundMessageSchema.parse({
      version: 1,
      requestId: "req_3",
      type: "orchestration.state",
      payload: {
        runId: "run_001",
        milestoneIndex: 0
      }
    });

    expect(parsed.type).toBe("orchestration.state");
  });

  it("OverviewStatePayload accepts optional error field", () => {
    const payload = {
      repositories: [],
      activeRuns: [],
      recentFailures: [],
      stats: {
        totalRepos: 0,
        totalPlans: 0,
        activeRuns: 0,
        pausedRuns: 0,
        failedRuns24h: 0
      },
      error: "Storage unavailable"
    };

    expect(OverviewStatePayloadSchema.safeParse(payload).success).toBe(true);

    const withoutError = {
      repositories: payload.repositories,
      activeRuns: payload.activeRuns,
      recentFailures: payload.recentFailures,
      stats: payload.stats
    };
    expect(OverviewStatePayloadSchema.safeParse(withoutError).success).toBe(
      true
    );
  });
});
