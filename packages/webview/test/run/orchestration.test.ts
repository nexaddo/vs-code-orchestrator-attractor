import { describe, it, expect } from "vitest";
import { decodeOrchestrationState } from "../../src/run/decoder";
import happyPath from "../../../../test/fixtures/webview/run/orchestration/valid/happy-path.json";
import implementerFailed from "../../../../test/fixtures/webview/run/orchestration/valid/implementer-failed.json";
import missingRunId from "../../../../test/fixtures/webview/run/orchestration/invalid/missing-run-id.json";
import wrongPhaseCount from "../../../../test/fixtures/webview/run/orchestration/invalid/wrong-phase-count.json";

describe("decodeOrchestrationState", () => {
  it("should decode a valid happy-path orchestration.state message", () => {
    const result = decodeOrchestrationState(happyPath);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.runId).toBe("run_001");
      expect(result.state.milestoneIndex).toBe(2);
      expect(result.state.milestoneCount).toBe(5);
      expect(result.state.milestoneName).toBe("Generate changelog");
      expect(result.state.phases).toHaveLength(4);
      expect(result.state.phases[2]?.status).toBe("running");
      expect(result.state.phases[2]?.taskSummary).toBe(
        "Generating CHANGELOG.md from commit log (step 2 of 3)"
      );
    }
  });

  it("should decode implementer-failed orchestration state", () => {
    const result = decodeOrchestrationState(implementerFailed);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.phases[2]?.status).toBe("failed");
      expect(result.state.phases[2]?.errorLabel).toBe(
        "git log command failed — repository has no commits"
      );
      expect(result.state.phases[3]?.status).toBe("skipped");
    }
  });

  it("should reject message with missing runId", () => {
    const result = decodeOrchestrationState(missingRunId);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Failed to decode orchestration.state/);
    }
  });

  it("should reject message with wrong phase count", () => {
    const result = decodeOrchestrationState(wrongPhaseCount);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Failed to decode/);
    }
  });

  it("should reject non-object input", () => {
    const result = decodeOrchestrationState(null);
    expect(result.success).toBe(false);
  });

  it("should reject wrong message type", () => {
    const wrongType = { ...happyPath, type: "run.state" };
    const result = decodeOrchestrationState(wrongType);
    expect(result.success).toBe(false);
  });
});
