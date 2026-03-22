// @ts-check

import esbuild from "esbuild";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const watch = process.argv.includes("--watch");
// Default to production for one-shot builds; dev only when watching unless
// NODE_ENV is set explicitly.
const production =
  process.env.NODE_ENV !== undefined
    ? process.env.NODE_ENV === "production"
    : !watch;

const outDir = path.join(__dirname, "dist", "bundle");

const stageWebviewBundle = () => {
  // Post-build: stage webview bundle into extension package
  const webviewSrc = path.join(__dirname, "..", "webview", "dist", "bundle");
  const webviewDest = path.join(outDir, "webview");
  if (existsSync(webviewSrc)) {
    cpSync(webviewSrc, webviewDest, { recursive: true });
  }
};

// Ensure output directory exists
mkdirSync(outDir, { recursive: true });

/** @type {import('esbuild').BuildOptions} */
const baseOptions = {
  entryPoints: [path.join(__dirname, "src", "extension.ts")],
  bundle: true,
  outfile: path.join(outDir, "extension.js"),
  platform: "node",
  format: "cjs",
  target: ["node22"],
  external: ["vscode"],
  sourcemap: watch ? "external" : false,
  minify: production
};

if (watch) {
  let hasStagedWebviewBundle = false;

  const ctx = await esbuild.context({
    ...baseOptions,
    plugins: [
      {
        name: "stage-webview-bundle-once",
        setup(build) {
          build.onEnd((result) => {
            if (!result.errors.length && !hasStagedWebviewBundle) {
              stageWebviewBundle();
              hasStagedWebviewBundle = true;
            }
          });
        }
      }
    ]
  });

  await ctx.watch();
  console.log("[attractor/extension] watching for changes…");
} else {
  await esbuild.build(baseOptions);
  stageWebviewBundle();
  console.log("[attractor/extension] build complete");
}
