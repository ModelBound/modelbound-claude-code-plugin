import {
  resolveSkillId
} from "./chunk-GL2Y2YS7.js";
import "./chunk-S5DLGVNZ.js";
import "./chunk-3W7TYMR3.js";
import {
  callMcpTool,
  requireApiKey
} from "./chunk-WNETRTE4.js";

// scripts/versions.ts
async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: /mb:versions <skill-file|slug>");
    process.exit(1);
  }
  const { cfg, apiKey } = await requireApiKey();
  const skillId = await resolveSkillId(cfg, apiKey, process.cwd(), target);
  const result = await callMcpTool(
    cfg,
    apiKey,
    "get_file_variants",
    { skill_id: skillId },
    ["skill.versions"]
  );
  const versions = result?.versions ?? [];
  if (!versions.length) {
    console.log("No versions found.");
    return;
  }
  console.log(`Versions for ${target} (${skillId}):`);
  for (const v of versions) {
    console.log(`  v${v.version ?? "?"}${v.created_at ? "  " + v.created_at : ""}${v.note ? "  " + v.note : ""}`);
  }
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
