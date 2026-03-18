import { describe, it, expect } from "vitest";
import { decodeRunState } from "../../src/run/decoder";
import validMinimal from "../../../../test/fixtures/webview/run/valid/minimal.json";
import wrongMessageType from "../../../../test/fixtures/webview/run/invalid/wrong-message-type.json";
import missingRun from "../../../../test/fixtures/webview/run/invalid/missing-run.json";

describe("decodeRunState", () => {
  it("should decode a valid run.state message", () => {
    const result = decodeRunState(validMinimal);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.run.id).toBe("run_001");
      expect(result.state.run.status).toBe("running");
      expect(result.state.plan.title).toBe("Implement Feature X");
      expect(result.state.currentStep).toBe("A");
      expect(result.state.logTail).toHaveLength(2);
    }
  });

  it("should reject wrong message type", () => {
    const result = decodeRunState(wrongMessageType);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Failed to decode/);
    }
  });

  it("should reject missing run field", () => {
    const result = decodeRunState(missingRun);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Failed to decode/);
    }
  });

  it("should reject non-object input", () => {
    const result = decodeRunState(42);
    expect(result.success).toBe(false);
  });
});
