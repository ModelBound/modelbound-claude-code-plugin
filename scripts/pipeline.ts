// Run the ModelBound Skill Development Pipeline (test_optimize | production | full).
import { callMcpTool, requireApiKey } from "./config.js";
import { ensureSkillSynced, setWorkspaceContext } from "./skill.js";

const TERMINAL = new Set(["passed", "failed", "completed", "errored", "skipped"]);

function parseArgs(argv: string[]): {
  target: string;
  stage: string;
  targets: string[];
  bump: string;
  overrideGate: boolean;
  watch: boolean;
  repo?: string;
} {
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
    targets: targetsIdx >= 0
      ? (argv[targetsIdx + 1] ?? "save,marketplace,claude_export").split(",").map((s) => s.trim()).filter(Boolean)
      : ["save", "marketplace", "claude_export"],
    bump: bumpIdx >= 0 ? argv[bumpIdx + 1] ?? "patch" : "patch",
    overrideGate: argv.includes("--override-gate"),
    watch: !argv.includes("--no-watch"),
    repo: repoIdx >= 0 ? argv[repoIdx + 1] : undefined,
  };
}

interface PipelineRun {
  id?: string;
  status?: string;
  failed_stage?: string;
  stage_results?: Record<string, unknown>;
  version_before?: string;
  version_after?: string;
}

async function watchRun(
  cfg: Awaited<ReturnType<typeof requireApiKey>>["cfg"],
  apiKey: string,
  runId: string,
): Promise<void> {
  const seen = new Set<string>();
  while (true) {
    const s = await callMcpTool<{ runs?: PipelineRun[] } & PipelineRun>(
      cfg,
      apiKey,
      "get_skill_pipeline_status",
      { run_id: runId },
      ["skills.getPipelineStatus", "pipeline.status"],
    );
    const run = s?.runs?.[0] ?? s;
    if (run?.stage_results) {
      for (const [stage, detail] of Object.entries(run.stage_results)) {
        const key = `${stage}:${JSON.stringify(detail)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        console.log(`  · ${stage}${detail ? " — " + JSON.stringify(detail) : ""}`);
      }
    }
    if (run?.status && TERMINAL.has(run.status)) {
      console.log(`Pipeline ${run.status} · run ${runId}${run.version_after ? ` · ${run.version_after}` : ""}`);
      if (run.failed_stage) console.log(`  Failed stage: ${run.failed_stage}`);
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

  const result = await callMcpTool<{ run_id?: string; id?: string; status?: string; version_after?: string }>(
    cfg,
    apiKey,
    "run_skill_pipeline",
    {
      skill_id: skillId,
      stage: opts.stage,
      targets: opts.targets,
      changelog: null,
      version_bump: opts.bump,
      override_gate: opts.overrideGate,
    },
    ["skills.runPipeline", "pipeline.run"],
  );

  const runId = result?.run_id ?? result?.id;
  console.log(`Pipeline started · skill ${skillId} · run ${runId ?? "—"} · stage ${opts.stage}`);
  if (!opts.watch || !runId) {
    console.log(`Status: ${result?.status ?? "started"}`);
    return;
  }
  await watchRun(cfg, apiKey, runId);
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
