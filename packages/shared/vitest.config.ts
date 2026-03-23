import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "shared",
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // Barrel re-export: no logic, skipped by tests importing directly
      exclude: ["src/index.ts"],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 85,
        lines: 90
      }
    }
  }
});
