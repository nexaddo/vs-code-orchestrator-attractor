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
    include: ["test/**/*.test.ts"]
  }
});
