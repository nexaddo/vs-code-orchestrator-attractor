// @ts-check
/**
 * esbuild build script for the Attractor webview package.
 *
 * Produces two output artefacts under dist/bundle/:
 *   dist/bundle/webview.js   – browser-targeted JS bundle
 *   dist/bundle/webview.css  – Tailwind v4 stylesheet (via postcss CLI)
 *
 * Architecture:
 *   JS:  esbuild bundles src/client.ts → dist/bundle/webview.js
 *   CSS: postcss CLI processes src/styles/index.css → dist/bundle/webview.css
 *        (Tailwind v4 requires PostCSS to drive CSS resolution; esbuild cannot
 *        handle the `@import "tailwindcss"` directive directly because Tailwind
 *        v4 exports under the "style" condition which esbuild does not activate)
 *
 * Usage:
 *   node esbuild.config.mjs            # production build
 *   node esbuild.config.mjs --watch    # development watch mode
 */

import esbuild from "esbuild";
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
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

const distDir = path.join(__dirname, "dist");
const outDir = path.join(distDir, "bundle");
const cssIn = path.join(__dirname, "src", "styles", "index.css");
const cssOut = path.join(outDir, "webview.css");

// Resolve postcss binary from this package's node_modules (platform-aware)
const postcssBinBase = path.join(__dirname, "node_modules", ".bin", "postcss");
const postcssBin =
  process.platform === "win32" ? `${postcssBinBase}.cmd` : postcssBinBase;

// Ensure output directory exists
mkdirSync(outDir, { recursive: true });

// Copy preview harness to dist so it can be served alongside the bundle
copyFileSync(
  path.join(__dirname, "ui-preview.html"),
  path.join(distDir, "ui-preview.html")
);

/** @type {import('esbuild').BuildOptions} */
const jsOptions = {
  entryPoints: [path.join(__dirname, "src", "client.ts")],
  bundle: true,
  outfile: path.join(outDir, "webview.js"),
  platform: "browser",
  format: "iife",
  target: ["chrome111", "safari16"],
  external: [],
  sourcemap: watch ? "external" : false,
  minify: production
};

if (watch) {
  // JS: esbuild watch
  const jsCtx = await esbuild.context(jsOptions);
  await jsCtx.watch();

  // CSS: postcss --watch
  const cssProc = spawn(
    postcssBin,
    [cssIn, "--output", cssOut, "--watch", "--poll"],
    {
      stdio: "inherit",
      shell: process.platform === "win32",
      cwd: __dirname
    }
  );
  cssProc.on("error", (err) => {
    console.error("[attractor/webview] postcss watch error:", err.message);
  });

  console.log("[attractor/webview] watching for changes…");
} else {
  // JS: esbuild one-shot
  await esbuild.build(jsOptions);

  // CSS: postcss one-shot
  execFileSync(postcssBin, [cssIn, "--output", cssOut], {
    stdio: "inherit",
    shell: process.platform === "win32",
    cwd: __dirname
  });

  console.log("[attractor/webview] build complete");
}
