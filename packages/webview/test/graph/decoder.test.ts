import { describe, it, expect } from "vitest";
import { decodeGraphUpdate } from "../../src/graph/decoder";
import validMinimal from "../../../../test/fixtures/webview/graph/valid/minimal.json";
import wrongMessageType from "../../../../test/fixtures/webview/graph/invalid/wrong-message-type.json";
import missingGraph from "../../../../test/fixtures/webview/graph/invalid/missing-graph.json";

describe("decodeGraphUpdate", () => {
  it("should decode a valid graph.update message", () => {
    const result = decodeGraphUpdate(validMinimal);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.runId).toBe("run_001");
      expect(result.state.graph.nodes).toHaveLength(2);
      expect(result.state.nodeStatuses).toHaveLength(2);
      expect(result.state.nodeStatuses[0]?.nodeId).toBe("A");
      expect(result.state.nodeStatuses[0]?.status).toBe("done");
      expect(result.state.nodeStatuses[1]?.status).toBe("running");
    }
  });

  it("should reject wrong message type", () => {
    const result = decodeGraphUpdate(wrongMessageType);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Failed to decode/);
    }
  });

  it("should reject missing graph", () => {
    const result = decodeGraphUpdate(missingGraph);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Failed to decode/);
    }
  });

  it("should reject non-object input", () => {
    const result = decodeGraphUpdate([]);
    expect(result.success).toBe(false);
  });
});
