import {
  resolveSkillId,
  setWorkspaceContext
} from "./chunk-GL2Y2YS7.js";
import "./chunk-S5DLGVNZ.js";
import "./chunk-3W7TYMR3.js";
import {
  callMcpTool,
  requireApiKey
} from "./chunk-WNETRTE4.js";

// scripts/test.ts
async function runSkillTest(cfg, apiKey, skillId, extra = {}) {
  return callMcpTool(
    cfg,
    apiKey,
    "run_skill_test",
    { skill_id: skillId, ...extra },
    ["skill.test"]
  );
}
async function main() {
  const target = process.argv[2];
  const { cfg, apiKey } = await requireApiKey();
  const cwd = process.cwd();
  if (!target) {
    console.error("Usage: /mb:test <skill-file|slug>");
    process.exit(1);
  }
  await setWorkspaceContext(cfg, apiKey, cwd);
  const skillId = await resolveSkillId(cfg, apiKey, cwd, target);
  console.log(`Running tests for ${target} (${skillId})\u2026`);
  let result;
  try {
    result = await runSkillTest(cfg, apiKey, skillId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("test_case_id"))
      throw err;
    const cases = await callMcpTool(
      cfg,
      apiKey,
      "list_skill_test_cases",
      { skill_id: skillId },
      ["skill.testCases"]
    );
    const first = cases?.cases?.[0]?.id ?? cases?.test_cases?.[0]?.id;
    if (!first)
      throw new Error("No saved test cases for this skill. Add one in ModelBound first.");
    result = await runSkillTest(cfg, apiKey, skillId, { test_case_id: first });
  }
  console.log(JSON.stringify(result, null, 2));
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
