import {
  ensureSkillSynced,
  setWorkspaceContext
} from "./chunk-GL2Y2YS7.js";
import "./chunk-S5DLGVNZ.js";
import "./chunk-3W7TYMR3.js";
import {
  callMcpTool,
  requireApiKey
} from "./chunk-WNETRTE4.js";

// scripts/seed-test-data.ts
async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: seed-test-data.ts <skill-file> [--repo org/repo]");
    process.exit(1);
  }
  const repoIdx = process.argv.indexOf("--repo");
  const repo = repoIdx >= 0 ? process.argv[repoIdx + 1] : void 0;
  const { cfg, apiKey } = await requireApiKey();
  const cwd = process.cwd();
  await setWorkspaceContext(cfg, apiKey, cwd, { repo });
  const skillId = await ensureSkillSynced(cfg, apiKey, cwd, target, { repo });
  console.log(`Skill: ${skillId}`);
  const existing = await callMcpTool(
    cfg,
    apiKey,
    "list_skill_test_cases",
    { skill_id: skillId },
    ["skill.testCases"]
  );
  let testCaseId = existing?.test_cases?.[0]?.id;
  if (!testCaseId) {
    const created = await callMcpTool(
      cfg,
      apiKey,
      "create_skill_test_case",
      {
        skill_id: skillId,
        name: "PR summary draft",
        prompt: "Draft a PR summary for a sync bugfix in the ModelBound Claude Code plugin.",
        notes: "Should describe the bug, the fix, and list test steps."
      },
      ["skills.createTestCase"]
    );
    testCaseId = created?.test_case?.id;
    console.log(`Created test case: ${testCaseId}`);
  } else {
    console.log(`Using existing test case: ${testCaseId}`);
  }
  const run1 = await callMcpTool(
    cfg,
    apiKey,
    "run_skill_pipeline",
    {
      skill_id: skillId,
      stage: "test_optimize",
      targets: ["save"],
      changelog: null,
      version_bump: "patch",
      override_gate: false
    },
    ["skills.runPipeline"]
  );
  console.log(`Pipeline run 1: ${run1?.run_id ?? run1?.id} \u2192 ${run1?.version_after ?? "\u2014"}`);
  const compare = await callMcpTool(
    cfg,
    apiKey,
    "compare_skill_versions",
    { skill_id: skillId, from_version: "latest", to_version: "current" },
    ["skills.compareVersions"]
  );
  console.log("Compare latest\u2192current:", JSON.stringify(compare, null, 2).slice(0, 500));
  if (testCaseId) {
    const testRun = await callMcpTool(
      cfg,
      apiKey,
      "run_skill_test",
      { skill_id: skillId, test_case_id: testCaseId },
      ["skill.test"]
    );
    const verdict = testRun?.run?.verdict ?? testRun?.verdict;
    console.log(`Test run verdict: ${verdict ?? JSON.stringify(testRun).slice(0, 200)}`);
  }
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
