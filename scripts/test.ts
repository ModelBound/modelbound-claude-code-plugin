// Run skill tests via MCP (resolves file path → repo-linked UUID).
import { callMcpTool, requireApiKey } from "./config.js";
import { resolveSkillId } from "./skill.js";

async function main() {
  const target = process.argv[2];
  const { cfg, apiKey } = await requireApiKey();
  const cwd = process.cwd();

  if (!target) {
    console.error("Usage: /mb:test <skill-file|slug>");
    process.exit(1);
  }

  const skillId = await resolveSkillId(cfg, apiKey, cwd, target);
  console.log(`Running tests for ${target} (${skillId})…`);

  const result = await callMcpTool<Record<string, unknown>>(
    cfg,
    apiKey,
    "run_skill_test",
    { skill_id: skillId },
    ["skill.test"],
  );

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
