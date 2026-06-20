import {
  resolveSkillId
} from "./chunk-GL2Y2YS7.js";
import "./chunk-S5DLGVNZ.js";
import "./chunk-3W7TYMR3.js";
import {
  callMcpTool,
  requireApiKey
} from "./chunk-WNETRTE4.js";

// scripts/benchmark.ts
async function main() {
  const targetIdx = process.argv.indexOf("--skill");
  const target = targetIdx >= 0 ? process.argv[targetIdx + 1] : process.argv[2];
  if (!target) {
    console.error("Usage: /mb:benchmark --skill <file|slug>");
    process.exit(1);
  }
  const { cfg, apiKey } = await requireApiKey();
  const skillId = await resolveSkillId(cfg, apiKey, process.cwd(), target);
  const result = await callMcpTool(
    cfg,
    apiKey,
    "benchmark_skill",
    { skill_id: skillId },
    ["skills.benchmark", "skill.benchmark"]
  );
  console.log(JSON.stringify(result, null, 2));
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
