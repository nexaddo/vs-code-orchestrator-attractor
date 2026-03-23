import { defineConfig } from "vitest/config";

export default defineConfig({
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
