// Check project health scores and token budgets.
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { loadConfig, callMcpTool, requireApiKey } from "./config.js";
import { encode } from "gpt-tokenizer";

async function main() {
  const { cfg, apiKey } = await requireApiKey();

  // Local file analysis
  const claudeDir = join(process.cwd(), ".claude");
  let localTokens = 0;
  let fileCount = 0;
  try {
    const files = await fs.readdir(claudeDir, { recursive: true });
    for (const f of files) {
      const p = join(claudeDir, String(f));
      try {
        const stat = await fs.stat(p);
        if (!stat.isFile()) continue;
        const content = await fs.readFile(p, "utf8");
        localTokens += encode(content).length;
        fileCount++;
      } catch { /* ignore */ }
    }
  } catch { /* .claude/ may not exist */ }

  // Server-side health
  const health = await callMcpTool<{
    overallScore: number;
    budgets: Array<{ name: string; used: number; limit: number; status: string }>;
    suggestions: string[];
  }>(cfg, apiKey, "pipeline.status", { source: "claude-code-plugin" });

  console.log("Project Health");
  console.log("==============");
  console.log(`Local .claude/ context: ${fileCount} files · ${localTokens.toLocaleString()} tokens`);

  if (health) {
    console.log(`\nOverall score: ${health.overallScore ?? "—"}/100`);
    if (health.budgets?.length) {
      console.log("\nBudgets:");
      for (const b of health.budgets) {
        const pct = Math.round((b.used / Math.max(b.limit, 1)) * 100);
        const icon = b.status === "ok" ? "✓" : b.status === "warning" ? "⚠" : "✗";
        console.log(`  ${icon} ${b.name}: ${b.used.toLocaleString()}/${b.limit.toLocaleString()} (${pct}%)`);
      }
    }
    if (health.suggestions?.length) {
      console.log("\nSuggestions:");
      for (const s of health.suggestions) console.log(`  • ${s}`);
    }
  } else {
    console.log("\n(Remote health data unavailable — check sign-in or server status.)");
  }
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
