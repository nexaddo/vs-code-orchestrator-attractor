import { describe, expect, it } from "vitest";

import { makeGraphId, makeRunId, makeWorktreeId } from "../../src/domain";

describe("value objects", () => {
  it("creates a RunId from a non-empty string", () => {
    const id = makeRunId("run_001");
    expect(id).toBe("run_001");
  });

  it("throws if RunId is empty", () => {
    expect(() => makeRunId("")).toThrow("RunId must not be empty");
  });

  it("creates a GraphId from a non-empty string", () => {
    const id = makeGraphId("graph_001");
    expect(id).toBe("graph_001");
  });

  it("throws if GraphId is empty", () => {
    expect(() => makeGraphId("")).toThrow("GraphId must not be empty");
  });

  it("creates a WorktreeId from a non-empty string", () => {
    const id = makeWorktreeId("worktree_001");
    expect(id).toBe("worktree_001");
  });

  it("throws if WorktreeId is empty", () => {
    expect(() => makeWorktreeId("")).toThrow("WorktreeId must not be empty");
  });
});
