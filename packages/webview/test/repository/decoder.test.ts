import { describe, it, expect } from "vitest";
import { decodeRepositoryState } from "../../src/repository/decoder";
import validMinimal from "../../../../test/fixtures/webview/repository/valid/minimal.json";
import validWithPlans from "../../../../test/fixtures/webview/repository/valid/with-plans.json";
import wrongMessageType from "../../../../test/fixtures/webview/repository/invalid/wrong-message-type.json";
import missingRepository from "../../../../test/fixtures/webview/repository/invalid/missing-repository.json";

describe("decodeRepositoryState", () => {
  it("should decode a valid repository.state message", () => {
    const result = decodeRepositoryState(validMinimal);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.repository.name).toBe("repo-alpha");
      expect(result.state.repository.id).toBe("repo_alpha");
      expect(result.state.plans).toHaveLength(0);
    }
  });

  it("should decode a repository.state message with plans", () => {
    const result = decodeRepositoryState(validWithPlans);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.repository.remoteUrl).toBe(
        "https://github.com/org/repo-alpha"
      );
      expect(result.state.repository.labels).toContain("workspace");
      expect(result.state.plans).toHaveLength(1);
      expect(result.state.plans[0]?.title).toBe("Implement Feature X");
    }
  });

  it("should reject wrong message type", () => {
    const result = decodeRepositoryState(wrongMessageType);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Failed to decode/);
    }
  });

  it("should reject missing repository", () => {
    const result = decodeRepositoryState(missingRepository);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Failed to decode/);
    }
  });

  it("should reject non-object input", () => {
    const result = decodeRepositoryState(null);

    expect(result.success).toBe(false);
  });
});
