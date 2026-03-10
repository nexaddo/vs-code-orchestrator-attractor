import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { RepositoryRecordSchema } from "../../src/contracts";

const fixturesDir = path.resolve(
  process.cwd(),
  "test/fixtures/contracts/repositories"
);

const loadFixture = (relativePath: string): unknown => {
  const fullPath = path.join(fixturesDir, relativePath);
  return JSON.parse(readFileSync(fullPath, "utf8")) as unknown;
};

describe("RepositoryRecordSchema", () => {
  it("accepts a valid repository fixture", () => {
    const parsed = RepositoryRecordSchema.parse(
      loadFixture("valid/minimal.json")
    );

    expect(parsed.name).toBe("repo-alpha");
  });

  it("rejects a fixture without a version", () => {
    const result = RepositoryRecordSchema.safeParse(
      loadFixture("invalid/missing-version.json")
    );

    expect(result.success).toBe(false);
  });
});
