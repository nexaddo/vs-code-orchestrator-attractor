import { describe, expect, it } from "vitest";

import {
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
});
