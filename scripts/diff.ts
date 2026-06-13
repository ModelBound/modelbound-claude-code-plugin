// Show diff between two skill versions.
import { callMcpTool, requireApiKey } from "./config.js";

async function main() {
  const skillId = process.argv[2];
  const fromVersion = process.argv[3];
  const toVersion = process.argv[4];
  if (!skillId) {
    console.error("Usage: /mb:diff <skill-id> [from-version] [to-version]");
    process.exit(1);
  }
  const { cfg, apiKey } = await requireApiKey();

  const result = await callMcpTool<{
    diff: string;
    fromVersion: string;
    toVersion: string;
    additions: number;
    deletions: number;
  }>(cfg, apiKey, "skill.diff", {
    skillId,
    versionA: fromVersion ?? "latest",
    versionB: toVersion ?? "current",
    source: "claude-code-plugin",
  });

  if (!result?.diff) {
    console.log("No diff available.");
    return;
  }

  console.log(`Diff: ${result.fromVersion} → ${result.toVersion} (+${result.additions}/-${result.deletions})`);
  console.log("---");
  console.log(result.diff);
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
