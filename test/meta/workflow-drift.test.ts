import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type PackageJson = {
  scripts?: Record<string, string>;
};

const readJson = <T>(filePath: string): T => {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
};

describe("ci:fast-checks baseline", () => {
  it("defines the root ci:fast-checks script", () => {
    const packageJson = readJson<PackageJson>(
      path.resolve(process.cwd(), "package.json")
    );

    expect(packageJson.scripts?.["ci:fast-checks"]).toBe(
      "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test"
    );
  });

  it("keeps the workflow job aligned with the root script", () => {
    const workflow = readFileSync(
      path.resolve(process.cwd(), ".github/workflows/ci.yml"),
      "utf8"
    );

    expect(workflow).toContain("fast-checks:");
    expect(workflow).toContain("run: pnpm ci:fast-checks");
  });
});
