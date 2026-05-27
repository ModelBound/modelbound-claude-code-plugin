// Send a file to ModelBound's optimizer; write .optimized.md alongside.
import { promises as fs } from "node:fs";
import { callMcpTool, requireApiKey } from "./config.js";

async function main() {
  const path = process.argv[2];
  if (!path) { console.error("Usage: /mb:optimize <file>"); process.exit(1); }
  const { cfg, apiKey } = await requireApiKey();
  const content = await fs.readFile(path, "utf8");
  const result = await callMcpTool<{ compacted: string; savings_pct?: number; trust?: number }>(
    cfg, apiKey, "skills.optimize", { content, source: "claude-code-plugin" }
  );
  if (!result?.compacted) { console.error("Optimizer returned no content."); process.exit(1); }
  const outPath = path.replace(/(\.\w+)?$/, ".optimized.md");
  await fs.writeFile(outPath, result.compacted, "utf8");
  console.log(`Wrote ${outPath}${result.savings_pct != null ? ` · ${result.savings_pct}% smaller` : ""}${result.trust != null ? ` · trust ${result.trust}/100` : ""}`);
  console.log("Review the diff before replacing the original.");
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
