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

// scripts/pipeline.ts
var TERMINAL = /* @__PURE__ */ new Set(["passed", "failed", "completed", "errored", "skipped"]);
function parseArgs(argv) {
  const target = argv.find((a) => !a.startsWith("--"));
  if (!target) {
    console.error("Usage: /mb:pipeline <skill-file|slug> [--stage test_optimize|production|full] [--targets save,marketplace] [--no-watch]");
    process.exit(1);
  }
  const stageIdx = argv.indexOf("--stage");
  const targetsIdx = argv.indexOf("--targets");
  const bumpIdx = argv.indexOf("--bump");
  const repoIdx = argv.indexOf("--repo");
  return {
    target,
    stage: stageIdx >= 0 ? argv[stageIdx + 1] ?? "full" : "full",
    targets: targetsIdx >= 0 ? (argv[targetsIdx + 1] ?? "save,marketplace,claude_export").split(",").map((s) => s.trim()).filter(Boolean) : ["save", "marketplace", "claude_export"],
    bump: bumpIdx >= 0 ? argv[bumpIdx + 1] ?? "patch" : "patch",
    overrideGate: argv.includes("--override-gate"),
    watch: !argv.includes("--no-watch"),
    repo: repoIdx >= 0 ? argv[repoIdx + 1] : void 0
  };
}
async function watchRun(cfg, apiKey, runId) {
  const seen = /* @__PURE__ */ new Set();
  while (true) {
    const s = await callMcpTool(
      cfg,
      apiKey,
      "get_skill_pipeline_status",
      { run_id: runId },
      ["skills.getPipelineStatus", "pipeline.status"]
    );
    const run = s?.runs?.[0] ?? s;
    if (run?.stage_results) {
      for (const [stage, detail] of Object.entries(run.stage_results)) {
        const key = `${stage}:${JSON.stringify(detail)}`;
        if (seen.has(key))
          continue;
        seen.add(key);
        console.log(`  \xB7 ${stage}${detail ? " \u2014 " + JSON.stringify(detail) : ""}`);
      }
    }
    if (run?.status && TERMINAL.has(run.status)) {
      console.log(`Pipeline ${run.status} \xB7 run ${runId}${run.version_after ? ` \xB7 ${run.version_after}` : ""}`);
      if (run.failed_stage)
        console.log(`  Failed stage: ${run.failed_stage}`);
      return;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { cfg, apiKey } = await requireApiKey();
  const cwd = process.cwd();
  await setWorkspaceContext(cfg, apiKey, cwd, { repo: opts.repo });
  const skillId = await ensureSkillSynced(cfg, apiKey, cwd, opts.target, { repo: opts.repo });
  const result = await callMcpTool(
    cfg,
    apiKey,
    "run_skill_pipeline",
    {
      skill_id: skillId,
      stage: opts.stage,
      targets: opts.targets,
      changelog: null,
      version_bump: opts.bump,
      override_gate: opts.overrideGate
    },
    ["skills.runPipeline", "pipeline.run"]
  );
  const runId = result?.run_id ?? result?.id;
  console.log(`Pipeline started \xB7 skill ${skillId} \xB7 run ${runId ?? "\u2014"} \xB7 stage ${opts.stage}`);
  if (!opts.watch || !runId) {
    console.log(`Status: ${result?.status ?? "started"}`);
    return;
  }
  await watchRun(cfg, apiKey, runId);
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
