import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { PlanRecordSchema } from "../../src/contracts";

// Use file-relative path instead of process.cwd() for robustness
// Resolve relative to this test file's directory
const fixturesDir = path.resolve(
  __dirname,
  "../../../../test/fixtures/contracts/plans"
);

const loadFixture = (relativePath: string): unknown => {
  const fullPath = path.join(fixturesDir, relativePath);
  return JSON.parse(readFileSync(fullPath, "utf8")) as unknown;
};

describe("PlanRecordSchema", () => {
  it("accepts a minimal valid plan fixture", () => {
    const parsed = PlanRecordSchema.parse(loadFixture("valid/minimal.json"));

    expect(parsed.version).toBe(1);
    expect(parsed.status).toBe("draft");
    expect(parsed.primaryExecutableRepositoryId).toBe("repo_alpha");
    expect(parsed.repositories[0]?.repositoryId).toBe("repo_alpha");
  });

  it("rejects a plan without a primary executable repository id", () => {
    const result = PlanRecordSchema.safeParse(
      loadFixture("invalid/missing-primary-executable-repository-id.json")
    );

    expect(result.success).toBe(false);
  });

  it("rejects a plan with multiple writable repositories", () => {
    const result = PlanRecordSchema.safeParse(
      loadFixture("invalid/multiple-writable-repos.json")
    );

    expect(result.success).toBe(false);
  });

  it("rejects a primary repository that is read only", () => {
    const result = PlanRecordSchema.safeParse(
      loadFixture("invalid/primary-read-only.json")
    );

    expect(result.success).toBe(false);
  });

  it("rejects a plan with zero writable repositories", () => {
    const result = PlanRecordSchema.safeParse(
      loadFixture("invalid/zero-writable-repos.json")
    );

    expect(result.success).toBe(false);
  });

  it("rejects a plan with duplicate repository ids", () => {
    const result = PlanRecordSchema.safeParse(
      loadFixture("invalid/duplicate-repository-id.json")
    );

    expect(result.success).toBe(false);
  });

  it("rejects a plan with multiple executable repositories", () => {
    const result = PlanRecordSchema.safeParse(
      loadFixture("invalid/multiple-executable-repos.json")
    );

    expect(result.success).toBe(false);
  });

  it("rejects a primary repository that is a context role", () => {
    const result = PlanRecordSchema.safeParse(
      loadFixture("invalid/primary-context-repo.json")
    );

    expect(result.success).toBe(false);
  });

  it("rejects a primary executable repository id that is not in repositories", () => {
    const result = PlanRecordSchema.safeParse(
      loadFixture("invalid/primary-not-in-repositories.json")
    );

    expect(result.success).toBe(false);
  });

  it("survives a json round trip", () => {
    const fixture = loadFixture("valid/minimal.json");
    const parsed = PlanRecordSchema.parse(fixture);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(PlanRecordSchema.parse(roundTripped)).toEqual(parsed);
  });
});
