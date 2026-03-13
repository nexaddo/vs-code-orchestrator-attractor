import { defineConfig } from "vitest/config";

export default defineConfig({
  root: __dirname,
  test: {
    name: "webview",
    include: ["test/**/*.test.ts"]
  }
});
