import {
  resolveSkillId
} from "./chunk-GL2Y2YS7.js";
import "./chunk-S5DLGVNZ.js";
import "./chunk-3W7TYMR3.js";
import {
  callMcpTool,
  requireApiKey
} from "./chunk-WNETRTE4.js";

// scripts/compare.ts
async function main() {
  const targetIdx = process.argv.indexOf("--skill");
  const fromIdx = process.argv.indexOf("--from");
  const toIdx = process.argv.indexOf("--to");
  const target = targetIdx >= 0 ? process.argv[targetIdx + 1] : process.argv[2];
  const fromVersion = fromIdx >= 0 ? process.argv[fromIdx + 1] : targetIdx >= 0 ? "latest" : process.argv[3] ?? "latest";
  const toVersion = toIdx >= 0 ? process.argv[toIdx + 1] : targetIdx >= 0 ? "current" : process.argv[4] ?? "current";
  if (!target) {
    console.error("Usage: /mb:compare --skill <file|slug> [--from latest] [--to current]");
    process.exit(1);
  }
  const { cfg, apiKey } = await requireApiKey();
  const skillId = await resolveSkillId(cfg, apiKey, process.cwd(), target);
  const args = {
    skill_id: skillId,
    from_version: fromVersion,
    to_version: toVersion
  };
  const result = await callMcpTool(
    cfg,
    apiKey,
    "compare_skill_versions",
    args,
    ["skills.compareVersions", "skill.compareVersions"]
  );
  console.log(JSON.stringify(result, null, 2));
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
