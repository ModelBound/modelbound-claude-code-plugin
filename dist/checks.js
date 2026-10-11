import {
  isSkillFile,
  resolveSkillId
} from "./chunk-GL2Y2YS7.js";
import "./chunk-S5DLGVNZ.js";
import "./chunk-3W7TYMR3.js";
import {
  callMcpTool,
  ensureValidApiKey
} from "./chunk-WNETRTE4.js";

// scripts/checks.ts
import { promises as fs } from "node:fs";
import { join, relative } from "node:path";
function checkContent(content) {
  const issues = [];
  if (/ignore previous|disregard tools/i.test(content))
    issues.push({ severity: "critical", message: "injection-like phrasing" });
  if (!/^---[\s\S]*?name:\s*\S+/m.test(content))
    issues.push({ severity: "warn", message: "no frontmatter name" });
  if (!/^##\s+(when to use|usage|examples?)/im.test(content))
    issues.push({ severity: "warn", message: "no usage section" });
  if (content.length < 200)
    issues.push({ severity: "warn", message: "very short" });
  if (content.length > 2e4)
    issues.push({ severity: "warn", message: "very long (token cost)" });
  if (/TODO|FIXME|XXX/i.test(content))
    issues.push({ severity: "warn", message: "contains TODO/FIXME" });
  return issues;
}
function statusOf(issues) {
  const open = issues.filter((i) => !i.ignored);
  const critical = open.filter((i) => i.severity === "critical").length;
  const warnings = open.filter((i) => i.severity === "warn" || i.severity === "warning").length;
  if (critical)
    return `\u2717 ${critical} blocking`;
  if (warnings)
    return `! ${warnings} warning${warnings === 1 ? "" : "s"}`;
  return "\u2713 passing";
}
async function walk(dir, out = []) {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory())
      await walk(p, out);
    else if (/\.(md|mdc|json)$/i.test(e.name))
      out.push(p);
  }
  return out;
}
async function renderLocal(cwd) {
  const files = [];
  for (const d of [".modelbound", ".claude", ".cursor/rules", ".kiro/skills", ".agents/skills"])
    await walk(join(cwd, d), files);
  const rows = [];
  for (const f of files) {
    const rel = relative(cwd, f).replace(/\\/g, "/");
    if (!isSkillFile(rel) && !/SKILL\.md$/i.test(rel))
      continue;
    rows.push({ path: rel, issues: checkContent(await fs.readFile(f, "utf8")) });
  }
  if (!rows.length) {
    console.log("No skill files found under .modelbound/, .claude/, .cursor/rules/, .kiro/skills/, .agents/skills/");
    return;
  }
  const rank = (r) => r.issues.filter((i) => i.severity === "critical").length * 100 + r.issues.length;
  rows.sort((a, b) => rank(b) - rank(a));
  console.log("(local heuristics \u2014 pass a skill file while signed in for the full cloud review)\n");
  for (const r of rows) {
    console.log(`${statusOf(r.issues).padEnd(16)} ${r.path}`);
    for (const i of r.issues)
      console.log(`                 ${i.severity === "critical" ? "blocking" : "warning"}: ${i.message}`);
  }
}
async function renderCloud(cwd, target) {
  const { cfg, apiKey } = await ensureValidApiKey();
  if (!apiKey)
    throw new Error("Not signed in");
  const skillId = await resolveSkillId(cfg, apiKey, cwd, target);
  const r = await callMcpTool(cfg, apiKey, "list_skill_findings", { skill_id: skillId }, ["skills.listFindings", "skill.findings"]);
  const findings = r?.findings ?? [];
  console.log(statusOf(findings));
  for (const f of findings) {
    console.log(`  ${f.severity} ${f.class}: ${f.message}${f.ignored ? " [ignored]" : ""}`);
    console.log(`    key: ${f.key}`);
  }
}
async function main() {
  const cwd = process.cwd();
  const target = process.argv[2];
  if (target) {
    try {
      await renderCloud(cwd, target);
    } catch {
      console.log("Cloud review unavailable \u2014 showing local heuristics:\n");
      await renderLocal(cwd);
    }
    return;
  }
  const { apiKey } = await ensureValidApiKey();
  if (apiKey)
    console.log("Signed in. Pass a skill file for the cloud review, e.g. /mb:checks .modelbound/my-skill.md\n");
  await renderLocal(cwd);
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
