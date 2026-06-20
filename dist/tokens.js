import {
  callMcpTool,
  loadConfig,
  resolveApiKey
} from "./chunk-WNETRTE4.js";

// scripts/tokens.ts
import { promises as fs } from "node:fs";
import { join, relative } from "node:path";
import { encode } from "gpt-tokenizer";
var DEFAULTS = { system: 5e3, skills: 1e5, rules: 2e3, total: 128e3 };
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
    else if (/\.(md|mdc|json|txt)$/i.test(e.name))
      out.push(p);
  }
  return out;
}
function classify(path) {
  if (/CLAUDE\.md$/i.test(path))
    return "system";
  if (/\/skills\//i.test(path))
    return "skills";
  return "rules";
}
async function main() {
  const cfg = await loadConfig();
  const apiKey = resolveApiKey(cfg);
  let thresholds = DEFAULTS;
  if (apiKey) {
    try {
      const prefs = await callMcpTool(cfg, apiKey, "team.getPreferences", {});
      if (prefs?.token_thresholds)
        thresholds = { ...DEFAULTS, ...prefs.token_thresholds };
    } catch {
    }
  }
  const files = await walk(join(process.cwd(), ".claude"));
  const bucketTotals = { system: 0, skills: 0, rules: 0 };
  let grandTotal = 0;
  const rows = [];
  for (const f of files) {
    const content = await fs.readFile(f, "utf8");
    const tokens = encode(content).length;
    const bucket = classify(f);
    bucketTotals[bucket] += tokens;
    grandTotal += tokens;
    const cap = thresholds[bucket];
    rows.push({ path: relative(process.cwd(), f), bucket, tokens, over: tokens > cap });
  }
  rows.sort((a, b) => b.tokens - a.tokens);
  console.log("File".padEnd(60), "Bucket".padEnd(10), "Tokens");
  console.log("-".repeat(85));
  for (const r of rows) {
    const flag = r.over ? " \u26A0 over" : "";
    console.log(r.path.padEnd(60), r.bucket.padEnd(10), String(r.tokens).padStart(7) + flag);
  }
  console.log("-".repeat(85));
  for (const b of ["system", "skills", "rules"]) {
    const cap = thresholds[b];
    const used = bucketTotals[b];
    const flag = used > cap ? " \u26A0 OVER" : "";
    console.log(`${b.padEnd(10)} ${String(used).padStart(7)} / ${cap}${flag}`);
  }
  const totalFlag = grandTotal > thresholds.total ? " \u26A0 OVER BUDGET" : "";
  console.log(`${"total".padEnd(10)} ${String(grandTotal).padStart(7)} / ${thresholds.total}${totalFlag}`);
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
