// Run skill tests or view recent test results.
import { callMcpTool, requireApiKey } from "./config.js";

async function main() {
  const skillId = process.argv[2];
  const { cfg, apiKey } = await requireApiKey();

  if (!skillId) {
    // List recent test runs
    const runs = await callMcpTool<{ runs: Array<{ id: string; skillId: string; status: string; createdAt: string }> }>(
      cfg, apiKey, "skill.testRuns", { limit: 10, source: "claude-code-plugin" }
    );
    if (!runs?.runs?.length) {
      console.log("No recent test runs.");
      return;
    }
    console.log("Recent test runs:");
    for (const r of runs.runs) {
      console.log(`  ${r.id} · ${r.skillId} · ${r.status} · ${r.createdAt}`);
    }
    return;
  }

  console.log(`Running tests for ${skillId}…`);
  const result = await callMcpTool<{
    passed: number;
    failed: number;
    skipped: number;
    cases: Array<{ name: string; status: string; durationMs: number; message?: string }>;
  }>(cfg, apiKey, "skill.test", { skillId, source: "claude-code-plugin" });

  if (!result) {
    console.error("Tests returned no result.");
    process.exit(1);
  }

  const total = result.passed + result.failed + result.skipped;
  console.log(`Results: ${result.passed}/${total} passed, ${result.failed} failed, ${result.skipped} skipped`);
  for (const c of result.cases ?? []) {
    const icon = c.status === "passed" ? "✓" : c.status === "failed" ? "✗" : "○";
    console.log(`  ${icon} ${c.name} (${c.durationMs}ms)${c.message ? ` — ${c.message}` : ""}`);
  }
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
