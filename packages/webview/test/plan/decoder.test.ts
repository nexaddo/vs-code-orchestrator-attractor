import { describe, it, expect } from "vitest";
import { decodePlanState } from "../../src/plan/decoder";
import validMinimal from "../../../../test/fixtures/webview/plan/valid/minimal.json";
import validWithGraphAndRuns from "../../../../test/fixtures/webview/plan/valid/with-graph-and-runs.json";
import wrongMessageType from "../../../../test/fixtures/webview/plan/invalid/wrong-message-type.json";
import missingPlan from "../../../../test/fixtures/webview/plan/invalid/missing-plan.json";

describe("decodePlanState", () => {
  it("should decode a valid plan.state message with null graph", () => {
    const result = decodePlanState(validMinimal);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.plan.title).toBe("Implement Feature X");
      expect(result.state.plan.status).toBe("draft");
      expect(result.state.graph).toBeNull();
      expect(result.state.runs).toHaveLength(0);
      expect(result.state.activeRun).toBeNull();
    }
  });

  it("should decode a plan.state message with graph and runs", () => {
    const result = decodePlanState(validWithGraphAndRuns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.graph).not.toBeNull();
      expect(result.state.graph?.nodes).toHaveLength(2);
      expect(result.state.runs).toHaveLength(1);
      expect(result.state.activeRun).not.toBeNull();
      expect(result.state.activeRun?.status).toBe("running");
    }
  });

  it("should reject wrong message type", () => {
    const result = decodePlanState(wrongMessageType);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Failed to decode/);
    }
  });

  it("should reject missing plan", () => {
    const result = decodePlanState(missingPlan);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Failed to decode/);
    }
  });

  it("should reject non-object input", () => {
    const result = decodePlanState("not an object");
    expect(result.success).toBe(false);
  });
});
