#!/usr/bin/env node
/**
 * modelbound-claude-code-plugin E2E (no Claude Code install required).
 *
 * Usage:
 *   npm run test:e2e              # offline hooks + slash-command parity
 *   npm run test:e2e:full         # build first, then all phases
 *   MODELBOUND_API_KEY=... npm run test:e2e:full
 *
 * Env:
 *   MODELBOUND_API_KEY — enables cloud phase (npx modelbound + dist/health.js)
 *   PLUGIN_E2E_CLI_VERSION — default 0.3.6 (pinned npx for slash-command parity)
 *
 * Flags:
 *   --skip-validate — skip phase 1 (use after npm test)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const COMMANDS = path.join(ROOT, "commands");
const DIST = path.join(ROOT, "dist");
const CLI_PIN = process.env.PLUGIN_E2E_CLI_VERSION || "0.3.6";

function loadApiKey() {
  const fromEnv = process.env.MODELBOUND_API_KEY?.trim();
  if (fromEnv?.startsWith("mb_live_")) return fromEnv;
  for (const envPath of [
    path.join(ROOT, ".env"),
    path.join(ROOT, "../modelbound-cli/.env"),
    path.join(ROOT, "../.env"),
  ]) {
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^(?:MODELBOUND_API_KEY|MB_TOKEN)=(.+)$/);
      if (m?.[1]?.trim().startsWith("mb_live_")) return m[1].trim();
    }
  }
  return fromEnv || "";
}

const API_KEY = loadApiKey();
const skipValidate = process.argv.includes("--skip-validate");

let passed = 0;
let failed = 0;
let skipped = 0;

function ok(label) {
  passed++;
  console.log(`  ✓ ${label}`);
}
function fail(label, detail) {
  failed++;
  console.log(`  ✗ ${label}`);
  if (detail) console.log(`    ${String(detail).trim().slice(0, 600)}`);
}
function skip(label, reason) {
  skipped++;
  console.log(`  ○ ${label} (${reason})`);
}

function runNode(script, args = [], opts = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8",
    cwd: opts.cwd ?? ROOT,
    env: opts.env ?? process.env,
    input: opts.input,
  });
}

function runNpxModelbound(args, env = process.env) {
  return spawnSync(
    "npx",
    ["-y", `modelbound@${CLI_PIN}`, ...args],
    { encoding: "utf8", cwd: ROOT, env, shell: process.platform === "win32" },
  );
}

function expectExit(label, r, code, checkStdout) {
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  if (r.status !== code) {
    fail(label, `expected exit ${code}, got ${r.status}\n${out}`);
    return false;
  }
  if (checkStdout && !checkStdout(out, r)) {
    fail(label, "output check failed");
    return false;
  }
  ok(label);
  return true;
}

function phaseValidate() {
  console.log("\nPhase 1 · validate (structure + guard-bash smoke)\n");
  const r = runNode(path.join(ROOT, "scripts/validate-plugin.mjs"), ["--smoke"]);
  if (r.status !== 0) {
    fail("validate-plugin.mjs --smoke", r.stderr || r.stdout);
    return;
  }
  ok("validate-plugin.mjs --smoke");
}

function phaseSlashCommands() {
  console.log("\nPhase 2 · mb-* slash command docs\n");
  const files = fs.readdirSync(COMMANDS).filter((f) => f.startsWith("mb-") && f.endsWith(".md"));
  if (files.length < 10) {
    fail("mb-* command count", `found ${files.length}`);
    return;
  }
  ok(`${files.length} mb-* command files`);

  const npxRe = /npx\s+-y\s+modelbound\s+/;
  const mbRe = /\bmb\s+(report|reliability|harness|trace)\b/;
  const mcpRe = /report_run|ModelBound MCP/i;

  for (const file of files.sort()) {
    const text = fs.readFileSync(path.join(COMMANDS, file), "utf8");
    if (!text.startsWith("---")) {
      fail(`${file} has YAML frontmatter`, "missing ---");
      continue;
    }
    const distRe = /CLAUDE_PLUGIN_ROOT\/dist\//;
    if (!npxRe.test(text) && !mbRe.test(text) && !distRe.test(text) && !mcpRe.test(text)) {
      fail(
        `${file} documents CLI invocation`,
        "expected npx -y modelbound …, mb …, dist/*.js, or MCP report_run",
      );
      continue;
    }
    ok(`${file} references modelbound CLI or MCP`);
  }

  const report = fs.readFileSync(path.join(COMMANDS, "mb-report.md"), "utf8");
  if (!/mb report/.test(report)) fail("mb-report.md uses mb report", "");
  else ok("mb-report.md uses mb report");

  const reliability = fs.readFileSync(path.join(COMMANDS, "mb-reliability.md"), "utf8");
  if (!/mb reliability/.test(reliability)) fail("mb-reliability.md uses mb reliability", "");
  else ok("mb-reliability.md uses mb reliability");

  const harness = fs.readFileSync(path.join(COMMANDS, "mb-harness.md"), "utf8");
  if (!/mb harness/.test(harness)) fail("mb-harness.md uses mb harness", "");
  else ok("mb-harness.md uses mb harness");

  const trace = fs.readFileSync(path.join(COMMANDS, "mb-trace.md"), "utf8");
  if (!/report_run/.test(trace)) fail("mb-trace.md uses report_run MCP", "");
  else ok("mb-trace.md uses report_run MCP");
}

function phaseHooks() {
  console.log("\nPhase 3 · hook scripts (dist)\n");

  for (const rel of [
    "session-start.js",
    "post-edit-sync.js",
    "backup.js",
    "guard-bash.js",
    "guard-webfetch.js",
  ]) {
    if (!fs.existsSync(path.join(DIST, rel))) {
      fail(`dist/${rel} exists`, "run npm run build");
    } else {
      ok(`dist/${rel} exists`);
    }
  }

  const guardBash = path.join(DIST, "guard-bash.js");
  expectExit(
    "guard-bash blocks rm -rf",
    runNode(guardBash, [], {
      input: JSON.stringify({ tool_input: { command: "rm -rf /" } }),
    }),
    2,
  );
  expectExit(
    "guard-bash allows echo",
    runNode(guardBash, [], {
      input: JSON.stringify({ tool_input: { command: "echo ok" } }),
    }),
    0,
  );

  const guardWeb = path.join(DIST, "guard-webfetch.js");
  expectExit(
    "guard-webfetch blocks localhost",
    runNode(guardWeb, [], {
      input: JSON.stringify({ tool_input: { url: "http://127.0.0.1/admin" } }),
    }),
    2,
    (o) => /block/i.test(o),
  );
  expectExit(
    "guard-webfetch allows public https",
    runNode(guardWeb, [], {
      input: JSON.stringify({ tool_input: { url: "https://modelbound.co/docs" } }),
    }),
    0,
  );

  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "mb-plugin-e2e-"));
  const skillPath = path.join(fixture, ".modelbound", "skills", "hook-fixture", "SKILL.md");
  fs.mkdirSync(path.dirname(skillPath), { recursive: true });
  const skillBody = "---\nname: hook-fixture\ndescription: E2E backup hook fixture\n---\n\n# Fixture\n";
  fs.writeFileSync(skillPath, skillBody);

  const backup = path.join(DIST, "backup.js");
  const backupArg = JSON.stringify([skillPath]);
  const br = runNode(backup, [backupArg], { cwd: fixture });
  if (br.status !== 0) {
    fail("backup.js snapshots skill file", br.stderr || br.stdout);
  } else {
    const backups = path.join(fixture, ".mb-backup");
    const entries = fs.existsSync(backups) ? fs.readdirSync(backups) : [];
    if (entries.length === 0) fail("backup.js wrote .mb-backup/", "");
    else ok(`backup.js wrote .mb-backup/ (${entries.length} file)`);
  }

  const sessionStart = path.join(DIST, "session-start.js");
  const sr = runNode(sessionStart, [], {
    cwd: fixture,
    env: { ...process.env, MODELBOUND_DISABLE_BACKUP: "1" },
  });
  if (sr.status !== 0) fail("session-start.js exits cleanly without auth", sr.stderr || sr.stdout);
  else ok("session-start.js exits cleanly without auth");
}

function phaseDistHealth() {
  console.log("\nPhase 4 · dist/health.js (plugin MCP path)\n");
  const apiKey = API_KEY;
  if (!apiKey) {
    skip("dist/health.js with API key", "no MODELBOUND_API_KEY");
    return;
  }
  const health = path.join(DIST, "health.js");
  const r = runNode(health, [], {
    cwd: ROOT,
    env: { ...process.env, MODELBOUND_API_KEY: apiKey },
  });
  expectExit("dist/health.js", r, 0, (o) => /health|mcp|Project/i.test(o));
}

function phaseNpxParity() {
  console.log("\nPhase 5 · npx modelbound (same as slash commands)\n");
  const apiKey = API_KEY;
  if (!apiKey) {
    skip("npx modelbound health", "no MODELBOUND_API_KEY");
    skip("npx modelbound auth status", "no MODELBOUND_API_KEY");
    skip("npx modelbound report", "no MODELBOUND_API_KEY");
    skip("npx modelbound reliability", "no MODELBOUND_API_KEY");
    return;
  }
  const env = { ...process.env, MODELBOUND_API_KEY: apiKey };

  expectExit(
    `npx modelbound@${CLI_PIN} health`,
    runNpxModelbound(["health"], env),
    0,
    (o) => /ok|health|connected|api/i.test(o) || o.length > 20,
  );

  expectExit(
    `npx modelbound@${CLI_PIN} auth status`,
    runNpxModelbound(["auth", "status"], env),
    0,
  );

  const reportSlug = process.env.PLUGIN_E2E_REPORT_SLUG || "plugin-e2e-nonexistent-slug";
  const rep = runNpxModelbound(["report", reportSlug, "--verdict", "worked", "--note", "plugin e2e"], env);
  const repOut = `${rep.stdout ?? ""}${rep.stderr ?? ""}`;
  if (rep.status === 0) ok(`npx modelbound report (${reportSlug})`);
  else if (/skill_not_found|not found/i.test(repOut)) {
    ok(`npx modelbound report (skill_not_found acceptable for harness slug)`);
  } else {
    fail("npx modelbound report", repOut);
  }

  expectExit(
    `npx modelbound@${CLI_PIN} reliability`,
    runNpxModelbound(["reliability", "--days", "7"], env),
    0,
  );

  expectExit(
    `npx modelbound@${CLI_PIN} harness --help`,
    runNpxModelbound(["harness", "--help"], env),
    0,
    (o) => /unattended|slug/i.test(o),
  );

  expectExit(
    `npx modelbound@${CLI_PIN} trace --help`,
    runNpxModelbound(["trace", "--help"], env),
    0,
    (o) => /--skill/.test(o),
  );
}

function main() {
  console.log("ModelBound Claude Code plugin E2E");
  console.log(`Root: ${ROOT}`);
  console.log(`CLI pin: modelbound@${CLI_PIN}`);

  if (!fs.existsSync(path.join(DIST, "guard-bash.js"))) {
    console.error("\nMissing dist/. Run: npm run build\n");
    process.exit(1);
  }

  if (skipValidate) {
    console.log("\nPhase 1 · validate (skipped — already ran via npm test)\n");
    skip("validate-plugin.mjs --smoke", "--skip-validate");
  } else {
    phaseValidate();
  }
  phaseSlashCommands();
  phaseHooks();
  phaseDistHealth();
  phaseNpxParity();

  console.log(`\nDone: ${passed} passed, ${failed} failed, ${skipped} skipped\n`);
  if (failed) process.exit(1);
}

main();
