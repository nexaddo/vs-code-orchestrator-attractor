import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/shared/vitest.config.ts",
      "packages/extension/vitest.config.ts"
    ]
  }
});
