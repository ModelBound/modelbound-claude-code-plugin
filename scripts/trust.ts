// Score every local SKILL.md / .claude/skills/* 0-100 with the same heuristics
// used by the @modelbound/skill-trust package on ModelBound.co.
import { promises as fs } from "node:fs";
import { join, relative } from "node:path";

interface Score { path: string; score: number; reasons: string[]; }

function scoreContent(content: string): { score: number; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];
  if (/^---[\s\S]*?name:\s*\S+/m.test(content)) { score += 10; reasons.push("+10 has SKILL.md frontmatter"); }
  if (/^##\s+(when to use|usage|examples?)/im.test(content)) { score += 10; reasons.push("+10 documents usage"); }
  if (/```/.test(content)) { score += 5; reasons.push("+5 contains code examples"); }
  if (content.length < 200) { score -= 20; reasons.push("-20 very short"); }
  if (content.length > 20000) { score -= 10; reasons.push("-10 very long (consider Smart Split)"); }
  if (/TODO|FIXME|XXX/i.test(content)) { score -= 10; reasons.push("-10 contains TODO/FIXME"); }
  if (/ignore previous|disregard tools/i.test(content)) { score -= 30; reasons.push("-30 contains injection-like phrasing"); }
  return { score: Math.max(0, Math.min(100, score)), reasons };
}

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  let entries: import("node:fs").Dirent[] = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (/\.md$/i.test(e.name)) out.push(p);
  }
  return out;
}

async function main() {
  const files = await walk(join(process.cwd(), ".claude"));
  if (files.length === 0) { console.log("No .md files under .claude/"); return; }
  const rows: Score[] = [];
  for (const f of files) {
    const content = await fs.readFile(f, "utf8");
    const { score, reasons } = scoreContent(content);
    rows.push({ path: relative(process.cwd(), f), score, reasons });
  }
  rows.sort((a, b) => a.score - b.score);
  console.log("Score  File");
  for (const r of rows) {
    console.log(`${String(r.score).padStart(5)}  ${r.path}`);
    for (const reason of r.reasons) console.log(`         ${reason}`);
  }
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
