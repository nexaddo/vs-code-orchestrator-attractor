import { describe, it, expect } from "vitest";
import { decodeTimelineUpdate } from "../../src/timeline/decoder";
import validMinimal from "../../../../test/fixtures/webview/timeline/valid/minimal.json";
import wrongMessageType from "../../../../test/fixtures/webview/timeline/invalid/wrong-message-type.json";
import missingRunId from "../../../../test/fixtures/webview/timeline/invalid/missing-run-id.json";

describe("decodeTimelineUpdate", () => {
  it("should decode a valid timeline.update message", () => {
    const result = decodeTimelineUpdate(validMinimal);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.runId).toBe("run_001");
      expect(result.state.events).toHaveLength(2);
      expect(result.state.events[0]?.name).toBe("run.started");
      expect(result.state.events[1]?.name).toBe("step.started");
    }
  });

  it("should reject wrong message type", () => {
    const result = decodeTimelineUpdate(wrongMessageType);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Failed to decode/);
    }
  });

  it("should reject missing runId", () => {
    const result = decodeTimelineUpdate(missingRunId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Failed to decode/);
    }
  });

  it("should reject non-object input", () => {
    const result = decodeTimelineUpdate(undefined);
    expect(result.success).toBe(false);
  });
});
