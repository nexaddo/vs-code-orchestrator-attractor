import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "meta",
    include: ["*.test.ts"]
  }
});
