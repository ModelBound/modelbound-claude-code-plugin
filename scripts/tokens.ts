// Count tokens across .claude/, compare to team thresholds.
import { promises as fs } from "node:fs";
import { join, relative } from "node:path";
import { encode } from "gpt-tokenizer";
import { callMcpTool, loadConfig, resolveApiKey } from "./config.js";

interface Thresholds { system: number; skills: number; rules: number; total: number; }
const DEFAULTS: Thresholds = { system: 5000, skills: 100000, rules: 2000, total: 128000 };

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  let entries: import("node:fs").Dirent[] = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (/\.(md|mdc|json|txt)$/i.test(e.name)) out.push(p);
  }
  return out;
}

function classify(path: string): "system" | "skills" | "rules" {
  if (/CLAUDE\.md$/i.test(path)) return "system";
  if (/\/skills\//i.test(path)) return "skills";
  return "rules";
}

async function main() {
  const cfg = await loadConfig();
  const apiKey = resolveApiKey(cfg);
  let thresholds: Thresholds = DEFAULTS;
  if (apiKey) {
    try {
      const prefs = await callMcpTool<{ token_thresholds?: Thresholds }>(cfg, apiKey, "team.getPreferences", {});
      if (prefs?.token_thresholds) thresholds = { ...DEFAULTS, ...prefs.token_thresholds };
    } catch { /* fall back to defaults */ }
  }

  const files = await walk(join(process.cwd(), ".claude"));
  const bucketTotals: Record<string, number> = { system: 0, skills: 0, rules: 0 };
  let grandTotal = 0;
  const rows: Array<{ path: string; bucket: string; tokens: number; over: boolean }> = [];

  for (const f of files) {
    const content = await fs.readFile(f, "utf8");
    const tokens = encode(content).length;
    const bucket = classify(f);
    bucketTotals[bucket] += tokens;
    grandTotal += tokens;
    const cap = thresholds[bucket as keyof Thresholds];
    rows.push({ path: relative(process.cwd(), f), bucket, tokens, over: tokens > cap });
  }

  rows.sort((a, b) => b.tokens - a.tokens);
  console.log("File".padEnd(60), "Bucket".padEnd(10), "Tokens");
  console.log("-".repeat(85));
  for (const r of rows) {
    const flag = r.over ? " ⚠ over" : "";
    console.log(r.path.padEnd(60), r.bucket.padEnd(10), String(r.tokens).padStart(7) + flag);
  }
  console.log("-".repeat(85));
  for (const b of ["system", "skills", "rules"] as const) {
    const cap = thresholds[b];
    const used = bucketTotals[b];
    const flag = used > cap ? " ⚠ OVER" : "";
    console.log(`${b.padEnd(10)} ${String(used).padStart(7)} / ${cap}${flag}`);
  }
  const totalFlag = grandTotal > thresholds.total ? " ⚠ OVER BUDGET" : "";
  console.log(`${"total".padEnd(10)} ${String(grandTotal).padStart(7)} / ${thresholds.total}${totalFlag}`);
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
