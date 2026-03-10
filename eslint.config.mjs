import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const testGlobals = {
  describe: "readonly",
  expect: "readonly",
  it: "readonly",
  beforeAll: "readonly",
  afterAll: "readonly",
  beforeEach: "readonly",
  afterEach: "readonly",
  vi: "readonly"
};

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "test/snapshots/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.cts", "**/*.mts"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      "no-console": "off"
    }
  },
  {
    files: ["**/*.test.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...testGlobals
      }
    }
  }
);
