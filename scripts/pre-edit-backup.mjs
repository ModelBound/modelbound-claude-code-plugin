#!/usr/bin/env node
// Pre-edit backup hook for the ModelBound Claude Code plugin.
//
// Triggered by Claude Code before Edit / MultiEdit / Write tools run.
// When the target file path looks like an agent-skill file, we copy it to
// `<cwd>/.modelbound/backups/<UTC>-<basename>` so accidental content wipes
// or frontmatter regressions are recoverable with a single `cp`.
//
// Contract (Claude Code hooks):
//   - Hook receives the tool invocation JSON on stdin.
//   - Exit 0 = allow the tool call (we always do).
//   - We never block edits; this is a safety net, not a gate.
//   - Honors MODELBOUND_DISABLE_BACKUP=1 to opt out per session.
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const SKILL_PATTERNS = [
  /(^|\/)\.claude\/skills\//,
  /(^|\/)\.agents\/skills\//,
  /(^|\/)\.workspace\/skills\//,
  /(^|\/)skills\//,
  /(^|\/)SKILL\.md$/,
];

const looksLikeSkill = (p) => SKILL_PATTERNS.some((re) => re.test(p));

async function readStdin() {
  return await new Promise((resolve) => {
    let data = "";
    if (process.stdin.isTTY) return resolve("");
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    // Safety timeout — Claude always pipes within ms, but never hang.
    setTimeout(() => resolve(data), 1000).unref?.();
  });
}

function targetPaths(payload) {
  const out = new Set();
  const visit = (v) => {
    if (!v) return;
    if (typeof v === "string") return;
    if (Array.isArray(v)) return v.forEach(visit);
    if (typeof v === "object") {
      for (const k of ["file_path", "filePath", "path"]) {
        if (typeof v[k] === "string") out.add(v[k]);
      }
      for (const val of Object.values(v)) visit(val);
    }
  };
  visit(payload);
  return [...out];
}

try {
  if (process.env.MODELBOUND_DISABLE_BACKUP === "1") process.exit(0);
  const raw = await readStdin();
  if (!raw.trim()) process.exit(0);
  let payload;
  try { payload = JSON.parse(raw); } catch { process.exit(0); }

  const cwd = process.cwd();
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupRoot = path.join(cwd, ".modelbound", "backups");

  for (const p of targetPaths(payload)) {
    const abs = path.isAbsolute(p) ? p : path.join(cwd, p);
    if (!looksLikeSkill(abs)) continue;
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
    fs.mkdirSync(backupRoot, { recursive: true });
    const dst = path.join(backupRoot, `${ts}-${path.basename(abs)}`);
    fs.copyFileSync(abs, dst);
  }
} catch {
  // Never break the user's edit because of a backup failure.
}
process.exit(0);
