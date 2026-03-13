import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "test/meta/vitest.config.ts",
      "packages/shared/vitest.config.ts",
      "packages/webview/vitest.config.ts",
      "packages/extension/vitest.config.ts"
    ]
  }
});
