// Trust & Safety findings — list, ignore, unignore (cloud MCP).
import { callMcpTool, requireApiKey } from "./config.js";
import { resolveSkillId } from "./skill.js";

interface Finding {
  class: string;
  message: string;
  severity: string;
  source?: string;
  key: string;
  ignored?: boolean;
}

interface FindingsResponse {
  skill_id: string;
  scores?: {
    total?: number;
    clarity?: number;
    safety?: number;
    fit?: number;
    ai_fit_score?: number;
    ai_fit_reason?: string;
  };
  findings?: Finding[];
  ignored_keys?: string[];
  scanner_version?: string;
  updated_at?: string;
}

function renderFindings(r: FindingsResponse): void {
  const scores = r.scores;
  if (scores) {
    console.log(
      `Trust score: ${scores.total ?? "—"}/100 · clarity ${scores.clarity ?? "—"} · safety ${scores.safety ?? "—"} · fit ${scores.fit ?? "—"}`,
    );
    if (scores.ai_fit_reason) console.log(`AI fit: ${scores.ai_fit_reason}`);
  }
  const findings = r.findings ?? [];
  if (!findings.length) {
    console.log("✓ No findings");
    return;
  }
  for (const f of findings) {
    const ignored = f.ignored ? " [ignored]" : "";
    console.log(`  ${f.severity} ${f.class}: ${f.message}${ignored}`);
    console.log(`    key: ${f.key}`);
  }
}

async function main() {
  const sub = process.argv[2];
  const { cfg, apiKey } = await requireApiKey();
  const cwd = process.cwd();

  if (sub === "list") {
    const targetIdx = process.argv.indexOf("--skill");
    const target = targetIdx >= 0 ? process.argv[targetIdx + 1] : process.argv[3];
    if (!target) {
      console.error("Usage: /mb:findings list --skill <file|slug>");
      process.exit(1);
    }
    const skillId = await resolveSkillId(cfg, apiKey, cwd, target);
    const r = await callMcpTool<FindingsResponse>(
      cfg,
      apiKey,
      "list_skill_findings",
      { skill_id: skillId },
      ["skills.listFindings", "skill.findings"],
    );
    renderFindings(r ?? { skill_id: skillId, findings: [] });
    return;
  }

  if (sub === "ignore" || sub === "unignore") {
    const targetIdx = process.argv.indexOf("--skill");
    const keyIdx = process.argv.indexOf("--key");
    const target = targetIdx >= 0 ? process.argv[targetIdx + 1] : undefined;
    const key = keyIdx >= 0 ? process.argv[keyIdx + 1] : undefined;
    if (!target) {
      console.error(`Usage: /mb:findings ${sub} --skill <file|slug> --key "<finding-key>"`);
      process.exit(1);
    }
    const skillId = await resolveSkillId(cfg, apiKey, cwd, target);
    const tool = sub === "ignore" ? "ignore_skill_finding" : "unignore_skill_finding";
    const aliases = sub === "ignore" ? ["skills.ignoreFinding", "skill.ignoreFinding"] : ["skills.unignoreFinding", "skill.unignoreFinding"];
    const args: Record<string, string> = { skill_id: skillId };
    if (key) args.finding_key = key;
    else {
      const classIdx = process.argv.indexOf("--class");
      const sevIdx = process.argv.indexOf("--severity");
      const msgIdx = process.argv.indexOf("--message");
      if (classIdx < 0 || sevIdx < 0 || msgIdx < 0) {
        console.error("Provide --key or all of --class, --severity, and --message.");
        process.exit(1);
      }
      args.class = process.argv[classIdx + 1];
      args.severity = process.argv[sevIdx + 1];
      args.message = process.argv[msgIdx + 1];
    }
    await callMcpTool(cfg, apiKey, tool, args, aliases);
    console.log(sub === "ignore" ? "Finding ignored" : "Finding un-ignored");
    return;
  }

  // Default: list for first arg as skill target (shorthand)
  const target = sub;
  if (!target || target.startsWith("--")) {
    console.error("Usage: /mb:findings list --skill <file|slug> | /mb:findings ignore|unignore --skill ... --key ...");
    process.exit(1);
  }
  const skillId = await resolveSkillId(cfg, apiKey, cwd, target);
  const r = await callMcpTool<FindingsResponse>(
    cfg,
    apiKey,
    "list_skill_findings",
    { skill_id: skillId },
    ["skills.listFindings", "skill.findings"],
  );
  renderFindings(r ?? { skill_id: skillId, findings: [] });
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
