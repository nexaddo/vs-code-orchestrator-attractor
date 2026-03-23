import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      "@attractor/shared": path.resolve(__dirname, "../shared/src/index.ts")
    }
  },
  test: {
    name: "webview",
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        // Barrel re-exports — no logic
        "src/index.ts",
        "src/**/index.ts",
        // Pure TypeScript interface declarations — no runtime code
        "src/**/model.ts"
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    }
  }
});
