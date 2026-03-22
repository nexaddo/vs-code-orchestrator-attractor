import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "smoke",
    include: ["*.test.ts"]
  }
});
