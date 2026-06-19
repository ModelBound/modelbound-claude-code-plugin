// Trust & Safety: cloud findings when signed in, local heuristics otherwise.
import { promises as fs } from "node:fs";
import { join, relative } from "node:path";
import { callMcpTool, ensureValidApiKey } from "./config.js";
import { isSkillFile, resolveSkillId } from "./skill.js";

interface Score { path: string; score: number; reasons: string[]; }

function scoreContent(content: string): { score: number; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];
  if (/^---[\s\S]*?name:\s*\S+/m.test(content)) { score += 10; reasons.push("+10 has frontmatter"); }
  if (/^##\s+(when to use|usage|examples?)/im.test(content)) { score += 10; reasons.push("+10 documents usage"); }
  if (/```/.test(content)) { score += 5; reasons.push("+5 contains code examples"); }
  if (content.length < 200) { score -= 20; reasons.push("-20 very short"); }
  if (content.length > 20000) { score -= 10; reasons.push("-10 very long"); }
  if (/TODO|FIXME|XXX/i.test(content)) { score -= 10; reasons.push("-10 contains TODO/FIXME"); }
  if (/ignore previous|disregard tools/i.test(content)) { score -= 30; reasons.push("-30 injection-like phrasing"); }
  return { score: Math.max(0, Math.min(100, score)), reasons };
}

async function walkSkillDirs(cwd: string, out: string[] = []): Promise<string[]> {
  const dirs = [".modelbound", ".claude", ".cursor/rules", ".kiro/skills", ".agents/skills"];
  for (const d of dirs) {
    await walk(join(cwd, d), out);
  }
  return out;
}

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  let entries: import("node:fs").Dirent[] = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (/\.(md|mdc|json)$/i.test(e.name)) out.push(p);
  }
  return out;
}

async function renderLocalScores(cwd: string): Promise<void> {
  const files = await walkSkillDirs(cwd);
  if (files.length === 0) { console.log("No skill files found under .modelbound/, .claude/, .cursor/rules/, .kiro/skills/, .agents/skills/"); return; }
  const rows: Score[] = [];
  for (const f of files) {
    const rel = relative(cwd, f).replace(/\\/g, "/");
    if (!isSkillFile(rel) && !/SKILL\.md$/i.test(rel)) continue;
    const content = await fs.readFile(f, "utf8");
    const { score, reasons } = scoreContent(content);
    rows.push({ path: rel, score, reasons });
  }
  rows.sort((a, b) => a.score - b.score);
  console.log("(local heuristics — run /mb:findings for cloud Trust & Safety scores)\n");
  console.log("Score  File");
  for (const r of rows) {
    console.log(`${String(r.score).padStart(5)}  ${r.path}`);
    for (const reason of r.reasons) console.log(`         ${reason}`);
  }
}

async function renderCloudFindings(cwd: string, target: string): Promise<void> {
  const { cfg, apiKey } = await ensureValidApiKey();
  if (!apiKey) throw new Error("Not signed in");
  const skillId = await resolveSkillId(cfg, apiKey!, cwd, target);
  const r = await callMcpTool<{
    scores?: { total?: number; clarity?: number; safety?: number; fit?: number };
    findings?: Array<{ severity: string; class: string; message: string; key: string; ignored?: boolean }>;
  }>(
    cfg,
    apiKey!,
    "list_skill_findings",
    { skill_id: skillId },
    ["skills.listFindings", "skill.findings"],
  );
  const scores = r?.scores;
  if (scores) {
    console.log(`Trust score: ${scores.total ?? "—"}/100 · clarity ${scores.clarity ?? "—"} · safety ${scores.safety ?? "—"} · fit ${scores.fit ?? "—"}`);
  }
  for (const f of r?.findings ?? []) {
    console.log(`  ${f.severity} ${f.class}: ${f.message}${f.ignored ? " [ignored]" : ""}`);
    console.log(`    key: ${f.key}`);
  }
  if (!r?.findings?.length) console.log("✓ No findings");
}

async function main() {
  const cwd = process.cwd();
  const target = process.argv[2];
  if (target) {
    try {
      await renderCloudFindings(cwd, target);
    } catch {
      console.log("Cloud findings unavailable — showing local heuristics:\n");
      await renderLocalScores(cwd);
    }
    return;
  }
  const { apiKey } = await ensureValidApiKey();
  if (apiKey) {
    console.log("Signed in. Pass a skill file for cloud Trust & Safety findings, e.g. /mb:trust .modelbound/my-skill.md");
    console.log("Or use /mb:findings list --skill <file>\n");
  }
  await renderLocalScores(cwd);
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
