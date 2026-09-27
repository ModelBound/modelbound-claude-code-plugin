#!/usr/bin/env node
/** Validate modelbound-claude-code-plugin structure, hooks, and optional hook smoke tests. */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const smoke = process.argv.includes("--smoke");

let failed = 0;
function ok(msg) {
  console.log(`✓ ${msg}`);
}
function bad(msg) {
  console.error(`✗ ${msg}`);
  failed++;
}

const required = [
  ".claude-plugin/plugin.json",
  "hooks/hooks.json",
  "README.md",
];

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) bad(`missing ${rel}`);
  else ok(rel);
}

const pluginJson = JSON.parse(
  fs.readFileSync(path.join(root, ".claude-plugin/plugin.json"), "utf8"),
);
const commandsDir = path.join(root, pluginJson.commands?.replace(/^\.\//, "") ?? "commands");
if (!fs.existsSync(commandsDir)) {
  bad(`commands dir missing: ${pluginJson.commands}`);
} else {
  const mbCommands = fs
    .readdirSync(commandsDir)
    .filter((f) => f.startsWith("mb-") && f.endsWith(".md"));
  if (mbCommands.length < 10) {
    bad(`expected many mb-*.md commands, found ${mbCommands.length}`);
  } else {
    ok(`${mbCommands.length} mb-* slash command files`);
  }
  for (const name of [
    "mb-report.md",
    "mb-reliability.md",
    "mb-trace.md",
    "mb-harness.md",
    "mb-login.md",
    "mb-health.md",
  ]) {
    if (!fs.existsSync(path.join(commandsDir, name))) bad(`missing commands/${name}`);
    else ok(`commands/${name}`);
  }
}

const hooksPath = path.join(root, "hooks/hooks.json");
const hooks = JSON.parse(fs.readFileSync(hooksPath, "utf8"));
const distRefs = new Set();
for (const phase of ["SessionStart", "PostToolUse", "PreToolUse"]) {
  for (const entry of hooks[phase] ?? []) {
    const m = String(entry.command ?? "").match(/\$\{CLAUDE_PLUGIN_ROOT\}\/(dist\/[^\s'"]+\.js)/);
    if (m) distRefs.add(m[1]);
  }
}
for (const rel of distRefs) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) bad(`hook target missing (run npm run build): ${rel}`);
  else ok(`hook script ${rel}`);
}

if (smoke) {
  const guardBash = path.join(root, "dist/guard-bash.js");
  const blockPayload = JSON.stringify({
    tool_input: { command: "rm -rf /" },
  });
  const block = spawnSync(process.execPath, [guardBash], {
    input: blockPayload,
    encoding: "utf8",
  });
  if (block.status !== 2) {
    bad(`guard-bash should block denylisted command (exit 2), got ${block.status}`);
  } else {
    ok("guard-bash blocks denylisted rm -rf");
  }

  const allowPayload = JSON.stringify({
    tool_input: { command: "echo hello" },
  });
  const allow = spawnSync(process.execPath, [guardBash], {
    input: allowPayload,
    encoding: "utf8",
  });
  if (allow.status !== 0) {
    bad(`guard-bash should allow safe command (exit 0), got ${allow.status}`);
  } else {
    ok("guard-bash allows safe echo");
  }
}

if (failed) process.exit(1);
console.log("\nPlugin validation passed.");
