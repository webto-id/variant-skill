#!/usr/bin/env node
/**
 * Release check for the skill's Markdown: catches an escape sequence that got
 * DECODED on its way into the file -- `\n` turned into a real line break, `\t`
 * into a TAB -- which is invisible when you read the rendered page and only
 * shows up when someone copies the example (2026-09-17: the paragraph that
 * announced multi-paragraph defaults shipped an example that failed with the
 * very error it said was fixed).
 *
 * Two rules, both applied OUTSIDE fenced code blocks:
 *   - a TAB character anywhere (Markdown never needs one);
 *   - an odd number of backticks in a paragraph (a code span that opens on one
 *     line and closes on another means a line break landed inside it).
 * Backticks are counted per PARAGRAPH, not per line, so a code span that is
 * deliberately wrapped across two lines does not trip it.
 *
 * Usage: node scripts/check-docs.mjs   (exit 1 on any finding)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath, not URL.pathname: pathname keeps percent-encoding, so a
// folder with a space became `webto%20variant%20format` and readdirSync
// died with ENOENT before checking a single file (reported 2026-09-17).
// It also handles the Windows drive letter, so no regex is needed.
const root = fileURLToPath(new URL("..", import.meta.url));
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".md")) files.push(p);
  }
})(root);

let findings = 0;
for (const file of files) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  let inFence = false;
  let para = [];
  let paraStart = 0;
  const flush = () => {
    if (!para.length) return;
    const ticks = (para.join("\n").match(/`/g) ?? []).length;
    if (ticks % 2 === 1) {
      console.log(`${file}:${paraStart}: odd number of backticks in this paragraph -- a code span is split across lines (decoded \\n?)`);
      findings++;
    }
    para = [];
  };
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) { flush(); inFence = !inFence; return; }
    if (inFence) return;
    if (line.includes("\t")) { console.log(`${file}:${i + 1}: TAB character outside a code block (decoded \\t?)`); findings++; }
    if (line.trim() === "") { flush(); return; }
    if (!para.length) paraStart = i + 1;
    para.push(line);
  });
  flush();
}
console.log(findings ? `${findings} finding(s) in ${files.length} file(s)` : `clean: ${files.length} file(s)`);
process.exit(findings ? 1 : 0);
