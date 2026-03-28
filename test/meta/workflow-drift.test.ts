import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

type PackageJson = {
  scripts?: Record<string, string>;
};

const readJson = <T>(filePath: string): T => {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
};

// Resolve root from test file location (test/meta/workflow-drift.test.ts)
// Go up 2 levels to reach the repository root.
// Uses import.meta.url; requires ESM (or a test runner that supports import.meta.url).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

describe("ci:fast-checks baseline", () => {
  it("defines the root ci:fast-checks script", () => {
    const packageJson = readJson<PackageJson>(
      path.resolve(ROOT, "package.json")
    );

    expect(packageJson.scripts?.["ci:fast-checks"]).toBe(
      "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test"
    );
  });

  it("keeps the workflow job aligned with the root script", () => {
    const workflow = readFileSync(
      path.resolve(ROOT, ".github/workflows/ci.yml"),
      "utf8"
    );

    expect(workflow).toContain("fast-checks:");
    expect(workflow).toContain("run: pnpm ci:fast-checks");
  });
});
