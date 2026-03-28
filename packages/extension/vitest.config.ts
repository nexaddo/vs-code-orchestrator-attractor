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
    name: "extension",
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        // VS Code runtime glue — require the extension host, covered by integration tests
        "src/extension.ts",
        "src/runtime.ts",
        "src/infrastructure/chat/**",
        "src/infrastructure/copilot/**",
        "src/infrastructure/git/**",
        "src/infrastructure/webview/**",
        // Pure TypeScript type/interface declarations — no runtime code
        "src/domain/events.ts",
        "src/application/ports.ts"
      ],
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 90,
        lines: 85
      }
    }
  }
});
