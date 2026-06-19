// Restore a skill to a previous version (non-destructive — creates new version).
import { callMcpTool, requireApiKey } from "./config.js";
import { resolveSkillId } from "./skill.js";

async function main() {
  const target = process.argv[2];
  const version = process.argv[3];
  if (!target || !version) {
    console.error("Usage: /mb:restore <skill-file|slug> <version>");
    process.exit(1);
  }
  const { cfg, apiKey } = await requireApiKey();
  const skillId = await resolveSkillId(cfg, apiKey, process.cwd(), target);

  const result = await callMcpTool<{ new_version?: string }>(
    cfg,
    apiKey,
    "get_file_variants",
    { skill_id: skillId, action: "restore", version },
  );

  console.log(`Restored v${version} of ${target}${result?.new_version ? ` → new version ${result.new_version}` : ""}`);
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
