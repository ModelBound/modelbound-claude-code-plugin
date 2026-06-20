import {
  resolveSkillId
} from "./chunk-GL2Y2YS7.js";
import "./chunk-S5DLGVNZ.js";
import "./chunk-3W7TYMR3.js";
import {
  callMcpTool,
  requireApiKey
} from "./chunk-WNETRTE4.js";

// scripts/findings.ts
function renderFindings(r) {
  const scores = r.scores;
  if (scores) {
    console.log(
      `Trust score: ${scores.total ?? "\u2014"}/100 \xB7 clarity ${scores.clarity ?? "\u2014"} \xB7 safety ${scores.safety ?? "\u2014"} \xB7 fit ${scores.fit ?? "\u2014"}`
    );
    if (scores.ai_fit_reason)
      console.log(`AI fit: ${scores.ai_fit_reason}`);
  }
  const findings = r.findings ?? [];
  if (!findings.length) {
    console.log("\u2713 No findings");
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
    const target2 = targetIdx >= 0 ? process.argv[targetIdx + 1] : process.argv[3];
    if (!target2) {
      console.error("Usage: /mb:findings list --skill <file|slug>");
      process.exit(1);
    }
    const skillId2 = await resolveSkillId(cfg, apiKey, cwd, target2);
    const r2 = await callMcpTool(
      cfg,
      apiKey,
      "list_skill_findings",
      { skill_id: skillId2 },
      ["skills.listFindings", "skill.findings"]
    );
    renderFindings(r2 ?? { skill_id: skillId2, findings: [] });
    return;
  }
  if (sub === "ignore" || sub === "unignore") {
    const targetIdx = process.argv.indexOf("--skill");
    const keyIdx = process.argv.indexOf("--key");
    const target2 = targetIdx >= 0 ? process.argv[targetIdx + 1] : void 0;
    const key = keyIdx >= 0 ? process.argv[keyIdx + 1] : void 0;
    if (!target2) {
      console.error(`Usage: /mb:findings ${sub} --skill <file|slug> --key "<finding-key>"`);
      process.exit(1);
    }
    const skillId2 = await resolveSkillId(cfg, apiKey, cwd, target2);
    const tool = sub === "ignore" ? "ignore_skill_finding" : "unignore_skill_finding";
    const aliases = sub === "ignore" ? ["skills.ignoreFinding", "skill.ignoreFinding"] : ["skills.unignoreFinding", "skill.unignoreFinding"];
    const args = { skill_id: skillId2 };
    if (key)
      args.finding_key = key;
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
  const target = sub;
  if (!target || target.startsWith("--")) {
    console.error("Usage: /mb:findings list --skill <file|slug> | /mb:findings ignore|unignore --skill ... --key ...");
    process.exit(1);
  }
  const skillId = await resolveSkillId(cfg, apiKey, cwd, target);
  const r = await callMcpTool(
    cfg,
    apiKey,
    "list_skill_findings",
    { skill_id: skillId },
    ["skills.listFindings", "skill.findings"]
  );
  renderFindings(r ?? { skill_id: skillId, findings: [] });
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
