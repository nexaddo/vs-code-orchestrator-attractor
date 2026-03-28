import { describe, it, expect } from "vitest";
import { decodeOverviewState } from "../../src/overview/decoder";
import validMinimal from "../../../../test/fixtures/webview/overview/valid/minimal.json";
import wrongMessageType from "../../../../test/fixtures/webview/overview/invalid/wrong-message-type.json";
import missingSummary from "../../../../test/fixtures/webview/overview/invalid/missing-summary.json";
import missingRepositories from "../../../../test/fixtures/webview/overview/invalid/missing-repositories.json";

describe("decodeOverviewState", () => {
  it("should decode a valid overview.state message", () => {
    const result = decodeOverviewState(validMinimal);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.stats.totalRepos).toBe(2);
      expect(result.state.stats.totalPlans).toBe(1);
      expect(result.state.activeRuns).toHaveLength(1);
      expect(result.state.recentFailures).toHaveLength(0);
      expect(result.state.repositories).toHaveLength(2);
      expect(result.state.repositories[0].name).toBe("repo-alpha");
      expect(result.state.repositories[1].name).toBe("repo-docs");
    }
  });

  it("should reject wrong message type", () => {
    const result = decodeOverviewState(wrongMessageType);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/overview\.state|Failed to decode/);
    }
  });

  it("should reject missing summary", () => {
    const result = decodeOverviewState(missingSummary);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Failed to decode/);
    }
  });

  it("should reject missing repositories", () => {
    const result = decodeOverviewState(missingRepositories);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Failed to decode/);
    }
  });
});
