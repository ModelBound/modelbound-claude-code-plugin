// Show diff between two skill versions.
import { callMcpTool, requireApiKey } from "./config.js";
import { resolveSkillId } from "./skill.js";

async function main() {
  const target = process.argv[2];
  const fromVersion = process.argv[3];
  const toVersion = process.argv[4];
  if (!target || !fromVersion) {
    console.error("Usage: /mb:diff <skill-file|slug> <from-version> [to-version]");
    process.exit(1);
  }
  const { cfg, apiKey } = await requireApiKey();
  const skillId = await resolveSkillId(cfg, apiKey, process.cwd(), target);

  const args: Record<string, string> = {
    skill_id: skillId,
    from_version: fromVersion,
    mode: "diff",
  };
  if (toVersion) args.to_version = toVersion;

  const result = await callMcpTool<Record<string, unknown>>(
    cfg,
    apiKey,
    "get_file_variants",
    args,
    ["skill.diff"],
  );

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
