#!/usr/bin/env node
/**
 * Extracts draw.io XML from ```drawio fenced code blocks in .drawio.md files
 * and writes them as standalone .drawio files for VS Code preview.
 *
 * Usage: node scripts/extract-drawio.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const wireframesDir = path.join(__dirname, "..", "docs", "wireframes");

const mdFiles = fs
  .readdirSync(wireframesDir)
  .filter((f) => f.endsWith(".drawio.md"));

if (mdFiles.length === 0) {
  console.log("No .drawio.md files found in docs/wireframes/");
  process.exit(0);
}

for (const mdFile of mdFiles) {
  const content = fs.readFileSync(path.join(wireframesDir, mdFile), "utf8");
  const match = content.match(/```drawio\s*\n([\s\S]*?)```/);
  if (!match) {
    console.warn(`⚠  No drawio block found in ${mdFile}, skipping`);
    continue;
  }
  const xml = match[1].trim();
  const outName = mdFile.replace(/\.drawio\.md$/, ".drawio");
  const outPath = path.join(wireframesDir, outName);
  fs.writeFileSync(outPath, xml, "utf8");
  console.log(`✓  ${outName}`);
}

console.log(
  "\nDone. Open any .drawio file in VS Code with the Draw.io extension."
);
