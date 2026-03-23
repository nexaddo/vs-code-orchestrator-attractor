import esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/bundle.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node22",
  sourcemap: true,
  minify: !isWatch,
  // Treat @attractor/shared as bundled (no node_modules at runtime)
  alias: {}
};

if (isWatch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("esbuild: watching for changes...");
} else {
  const result = await esbuild.build({ ...options, metafile: true });
  const text = await esbuild.analyzeMetafile(result.metafile, {
    verbose: false
  });
  console.log(text);
}
