import {
  resolveSkillId
} from "./chunk-GL2Y2YS7.js";
import "./chunk-S5DLGVNZ.js";
import "./chunk-3W7TYMR3.js";
import {
  callMcpTool,
  requireApiKey
} from "./chunk-WNETRTE4.js";

// scripts/restore.ts
async function main() {
  const target = process.argv[2];
  const version = process.argv[3];
  if (!target || !version) {
    console.error("Usage: /mb:restore <skill-file|slug> <version>");
    process.exit(1);
  }
  const { cfg, apiKey } = await requireApiKey();
  const skillId = await resolveSkillId(cfg, apiKey, process.cwd(), target);
  const result = await callMcpTool(
    cfg,
    apiKey,
    "get_file_variants",
    { skill_id: skillId, action: "restore", version }
  );
  console.log(`Restored v${version} of ${target}${result?.new_version ? ` \u2192 new version ${result.new_version}` : ""}`);
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
