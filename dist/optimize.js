import {
  callMcpTool,
  requireApiKey
} from "./chunk-WNETRTE4.js";

// scripts/optimize.ts
import { promises as fs } from "node:fs";
async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: /mb:optimize <file>");
    process.exit(1);
  }
  const { cfg, apiKey } = await requireApiKey();
  const content = await fs.readFile(path, "utf8");
  const result = await callMcpTool(
    cfg,
    apiKey,
    "optimize_content",
    { content, intensity: "balanced", label: path },
    ["skills.optimize", "optimization.content"]
  );
  const optimized = result?.content;
  if (!optimized) {
    console.error(result?.reason ?? "Optimizer returned no content.");
    process.exit(1);
  }
  const outPath = path.replace(/(\.\w+)?$/, ".optimized.md");
  await fs.writeFile(outPath, optimized, "utf8");
  const savings = result.savings_pct != null ? ` \xB7 ${result.savings_pct}% smaller` : "";
  const saved = result.tokens_saved != null ? ` \xB7 ${result.tokens_saved} tokens saved` : "";
  console.log(`Wrote ${outPath}${savings}${saved}`);
  console.log("Review the diff before replacing the original.");
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
