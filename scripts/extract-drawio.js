#!/usr/bin/env node
/**
 * Extracts draw.io XML from ```drawio fenced code blocks in .drawio.md files
 * and writes them as standalone .drawio files for VS Code preview.
 *
 * Processes all wireframe directories under docs/ by default.
 * Pass directory names as arguments to process specific ones:
 *   node scripts/extract-drawio.js wireframes wireframes-v2
 *
 * Usage: node scripts/extract-drawio.js
 */
const fs = require("fs");
const path = require("path");

const docsDir = path.join(__dirname, "..", "docs");

// Determine which directories to process:
// - explicit args override the default list
// - default: all dirs under docs/ whose name starts with "wireframes"
const argDirs = process.argv.slice(2);
const targetDirs = argDirs.length
  ? argDirs
  : fs
      .readdirSync(docsDir)
      .filter((entry) => {
        if (!entry.startsWith("wireframes")) return false;
        return fs.statSync(path.join(docsDir, entry)).isDirectory();
      })
      .sort();

if (targetDirs.length === 0) {
  console.log("No wireframe directories found under docs/");
  process.exit(0);
}

let totalProcessed = 0;
let totalSkipped = 0;

for (const dirName of targetDirs) {
  const wireframesDir = path.join(docsDir, dirName);

  if (!fs.existsSync(wireframesDir)) {
    console.warn(`⚠  Directory not found, skipping: docs/${dirName}`);
    continue;
  }

  const mdFiles = fs
    .readdirSync(wireframesDir)
    .filter((f) => f.endsWith(".drawio.md"));

  if (mdFiles.length === 0) {
    console.log(`  No .drawio.md files found in docs/${dirName}/`);
    continue;
  }

  console.log(`\ndocs/${dirName}/`);

  for (const mdFile of mdFiles) {
    const content = fs.readFileSync(path.join(wireframesDir, mdFile), "utf8");
    const match = content.match(/```drawio\s*\n([\s\S]*?)```/);
    if (!match) {
      console.warn(`  ⚠  No drawio block found in ${mdFile}, skipping`);
      totalSkipped++;
      continue;
    }
    const xml = match[1].trim();
    const outName = mdFile.replace(/\.drawio\.md$/, ".drawio");
    const outPath = path.join(wireframesDir, outName);
    fs.writeFileSync(outPath, xml, "utf8");
    console.log(`  ✓  ${outName}`);
    totalProcessed++;
  }
}

console.log(
  `\nDone. ${totalProcessed} file(s) written, ${totalSkipped} skipped.`
);
console.log("Open any .drawio file in VS Code with the Draw.io extension.");
