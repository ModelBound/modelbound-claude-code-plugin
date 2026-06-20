import {
  setWorkspaceContext
} from "./chunk-GL2Y2YS7.js";
import "./chunk-S5DLGVNZ.js";
import "./chunk-3W7TYMR3.js";
import {
  callMcpTool,
  requireApiKey
} from "./chunk-WNETRTE4.js";

// scripts/skills.ts
async function main() {
  const [platform, aiType] = process.argv.slice(2);
  const { cfg, apiKey } = await requireApiKey();
  await setWorkspaceContext(cfg, apiKey, process.cwd());
  const args = {};
  if (platform)
    args.source_platform = platform;
  if (aiType)
    args.ai_type = aiType;
  const data = await callMcpTool(cfg, apiKey, "list_skills", args);
  const rows = data?.skills ?? data?.items ?? [];
  if (rows.length === 0) {
    console.log("No skills found for the given filters.");
    return;
  }
  console.log(`| Name | ai_type | source_platform | repo | source_path |`);
  console.log(`| --- | --- | --- | --- | --- |`);
  for (const r of rows) {
    const name = r.name || r.slug || r.id || "(unnamed)";
    console.log(
      `| ${name} | ${r.ai_type ?? "\u2014"} | ${r.source_platform ?? "\u2014"} | ${r.repo ?? "\u2014"} | ${r.source_path ?? "\u2014"} |`
    );
  }
  console.log(`
${rows.length} skill(s).`);
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
