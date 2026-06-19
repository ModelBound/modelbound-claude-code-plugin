// Eval test suite — create, list, run, results (cloud MCP).
import { callMcpTool, requireApiKey } from "./config.js";

async function main() {
  const sub = process.argv[2];
  const { cfg, apiKey } = await requireApiKey();

  if (sub === "list") {
    const r = await callMcpTool(cfg, apiKey, "list_eval_cases", {}, ["evals.listCases", "eval.listCases"]);
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  if (sub === "create") {
    const nameIdx = process.argv.indexOf("--name");
    const promptIdx = process.argv.indexOf("--prompt");
    const name = nameIdx >= 0 ? process.argv[nameIdx + 1] : undefined;
    const prompt = promptIdx >= 0 ? process.argv[promptIdx + 1] : undefined;
    if (!name || !prompt) {
      console.error("Usage: eval create --name <name> --prompt <text>");
      process.exit(1);
    }
    const r = await callMcpTool(
      cfg,
      apiKey,
      "create_eval_case",
      { name, input_prompt: prompt },
      ["evals.createCase", "eval.createCase"],
    );
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  if (sub === "run") {
    const caseIdx = process.argv.indexOf("--case");
    const outIdx = process.argv.indexOf("--output");
    const evalCaseId = caseIdx >= 0 ? process.argv[caseIdx + 1] : undefined;
    const actual = outIdx >= 0 ? process.argv[outIdx + 1] : undefined;
    if (!evalCaseId || !actual) {
      console.error("Usage: eval run --case <id> --output <text>");
      process.exit(1);
    }
    const r = await callMcpTool(
      cfg,
      apiKey,
      "run_eval",
      { eval_case_id: evalCaseId, actual_output: actual, judge_type: "manual" },
      ["evals.run", "eval.run"],
    );
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  if (sub === "results") {
    const caseIdx = process.argv.indexOf("--case");
    const args: Record<string, unknown> = { limit: 50 };
    if (caseIdx >= 0) args.eval_case_id = process.argv[caseIdx + 1];
    const r = await callMcpTool(cfg, apiKey, "list_eval_results", args, ["evals.listResults", "eval.listResults"]);
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  console.error("Usage: eval list | create | run | results");
  process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
