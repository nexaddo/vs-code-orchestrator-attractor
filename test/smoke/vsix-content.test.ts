import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("VSIX content smoke test", () => {
  it("includes expected bundle files and excludes source/test files", () => {
    // Build first to ensure artifacts exist
    execSync("pnpm build", {
      cwd: process.cwd(),
      stdio: "pipe",
      timeout: 120_000
    });

    // Get the list of files that would be included in the VSIX
    const output = execSync(
      "pnpm --filter attractor exec vsce ls --no-dependencies",
      { cwd: process.cwd(), encoding: "utf8", stdio: "pipe", timeout: 30_000 }
    );

    const lines = output
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Must include bundle files
    expect(lines.some((l) => l.includes("dist/bundle/extension.js"))).toBe(
      true
    );
    expect(
      lines.some((l) => l.includes("dist/bundle/webview/webview.js"))
    ).toBe(true);
    expect(
      lines.some((l) => l.includes("dist/bundle/webview/webview.css"))
    ).toBe(true);

    // Must NOT include .ts source files (except .d.ts)
    const tsSourceFiles = lines.filter(
      (l) => l.endsWith(".ts") && !l.endsWith(".d.ts")
    );
    expect(tsSourceFiles).toEqual([]);

    // Must NOT include test paths
    const testFiles = lines.filter((l) => l.includes("test/"));
    expect(testFiles).toEqual([]);

    // Must NOT include node_modules
    const nodeModulesFiles = lines.filter((l) => l.includes("node_modules/"));
    expect(nodeModulesFiles).toEqual([]);
  }, 180_000); // generous timeout for build + vsce ls
});
