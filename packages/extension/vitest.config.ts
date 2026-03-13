import { defineConfig } from "vitest/config";

export default defineConfig({
  root: __dirname,
  test: {
    name: "extension",
    include: ["test/**/*.test.ts"]
  }
});
