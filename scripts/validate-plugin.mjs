#!/usr/bin/env node
/** Validate modelbound-claude-code-plugin structure and mb commands exist. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "commands/mb-report.md",
  "commands/mb-reliability.md",
  "README.md",
];

let failed = 0;
for (const rel of required) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`✗ missing ${rel}`);
    failed++;
  } else {
    console.log(`✓ ${rel}`);
  }
}

if (failed) process.exit(1);
console.log("\nPlugin validation passed.");
