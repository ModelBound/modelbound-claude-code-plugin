// Send a file to ModelBound's optimizer; write .optimized.md alongside.
import { promises as fs } from "node:fs";
import { callMcpTool, requireApiKey } from "./config.js";

async function main() {
  const path = process.argv[2];
  if (!path) { console.error("Usage: /mb:optimize <file>"); process.exit(1); }
  const { cfg, apiKey } = await requireApiKey();
  const content = await fs.readFile(path, "utf8");
  const result = await callMcpTool<{
    content?: string;
    optimized?: boolean;
    savings_pct?: number;
    tokens_saved?: number;
    reason?: string;
  }>(
    cfg,
    apiKey,
    "optimize_content",
    { content, intensity: "balanced", label: path },
    ["skills.optimize", "optimization.content"],
  );
  const optimized = result?.content;
  if (!optimized) {
    console.error(result?.reason ?? "Optimizer returned no content.");
    process.exit(1);
  }
  const outPath = path.replace(/(\.\w+)?$/, ".optimized.md");
  await fs.writeFile(outPath, optimized, "utf8");
  const savings = result.savings_pct != null ? ` · ${result.savings_pct}% smaller` : "";
  const saved = result.tokens_saved != null ? ` · ${result.tokens_saved} tokens saved` : "";
  console.log(`Wrote ${outPath}${savings}${saved}`);
  console.log("Review the diff before replacing the original.");
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
