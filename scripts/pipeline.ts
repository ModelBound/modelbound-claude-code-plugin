// Run the ModelBound Skill Development Pipeline (test → benchmark → optimize).
import { callMcpTool, requireApiKey } from "./config.js";

async function main() {
  const skillId = process.argv[2];
  if (!skillId) {
    console.error("Usage: /mb:pipeline <skill-id> [--dry-run]");
    process.exit(1);
  }
  const dryRun = process.argv.includes("--dry-run");
  const { cfg, apiKey } = await requireApiKey();

  if (dryRun) {
    const preview = await callMcpTool<{ stages: string[]; estimatedTokens: number }>(
      cfg, apiKey, "pipeline.config", { skillId, source: "claude-code-plugin" }
    );
    console.log("Pipeline preview:");
    console.log(`  Stages: ${preview?.stages?.join(" → ") ?? "test → benchmark → optimize"}`);
    console.log(`  Est. tokens: ${preview?.estimatedTokens ?? "unknown"}`);
    return;
  }

  const result = await callMcpTool<{
    runId: string;
    status: string;
    stages: Array<{ name: string; status: string; durationMs: number }>;
    score?: number;
    optimizedSkillId?: string;
  }>(cfg, apiKey, "pipeline.run", {
    skillId,
    source: "claude-code-plugin",
  });

  if (!result) {
    console.error("Pipeline returned no result.");
    process.exit(1);
  }

  console.log(`Pipeline ${result.runId} — ${result.status}`);
  for (const s of result.stages ?? []) {
    const icon = s.status === "passed" ? "✓" : s.status === "failed" ? "✗" : "○";
    console.log(`  ${icon} ${s.name} (${s.durationMs}ms)`);
  }
  if (result.score != null) console.log(`  Score: ${result.score}/100`);
  if (result.optimizedSkillId) console.log(`  Optimized skill: ${result.optimizedSkillId}`);
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
