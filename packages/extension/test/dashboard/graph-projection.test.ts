import { describe, expect, it } from "vitest";
import { buildGraphUpdate } from "../../src/dashboard/graph-projection";

describe("buildGraphUpdate", () => {
  it("builds payload with correct nodeId and status", () => {
    const payload = buildGraphUpdate("node-1", "running");

    expect(payload).toStrictEqual({
      nodeId: "node-1",
      status: "running"
    });
  });

  it("builds payload with queued status", () => {
    const payload = buildGraphUpdate("node-2", "queued");

    expect(payload.nodeId).toBe("node-2");
    expect(payload.status).toBe("queued");
  });

  it("builds payload with blocked status", () => {
    const payload = buildGraphUpdate("node-3", "blocked");

    expect(payload.nodeId).toBe("node-3");
    expect(payload.status).toBe("blocked");
  });

  it("builds payload with failed status", () => {
    const payload = buildGraphUpdate("node-4", "failed");

    expect(payload.nodeId).toBe("node-4");
    expect(payload.status).toBe("failed");
  });

  it("builds payload with succeeded status", () => {
    const payload = buildGraphUpdate("node-5", "succeeded");

    expect(payload.nodeId).toBe("node-5");
    expect(payload.status).toBe("succeeded");
  });

  it("builds payload with canceled status", () => {
    const payload = buildGraphUpdate("node-6", "canceled");

    expect(payload.nodeId).toBe("node-6");
    expect(payload.status).toBe("canceled");
  });

  it("produces valid payloads for all statuses", () => {
    const statuses: Array<
      "queued" | "running" | "blocked" | "failed" | "succeeded" | "canceled"
    > = ["queued", "running", "blocked", "failed", "succeeded", "canceled"];

    statuses.forEach((status) => {
      const payload = buildGraphUpdate(`node-${status}`, status);
      expect(payload.nodeId).toBe(`node-${status}`);
      expect(payload.status).toBe(status);
    });
  });
});
