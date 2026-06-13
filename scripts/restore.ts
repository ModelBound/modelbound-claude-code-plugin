// Restore a skill to a previous checkpoint version.
import { callMcpTool, requireApiKey } from "./config.js";
import { promises as fs } from "node:fs";
import { basename } from "node:path";

async function main() {
  const skillId = process.argv[2];
  const versionId = process.argv[3];
  if (!skillId || !versionId) {
    console.error("Usage: /mb:restore <skill-id> <version-id> [--write <path>]");
    process.exit(1);
  }
  const writePath = process.argv.includes("--write") ? process.argv[process.argv.indexOf("--write") + 1] : undefined;
  const { cfg, apiKey } = await requireApiKey();

  const result = await callMcpTool<{
    content: string;
    versionId: string;
    createdAt: string;
  }>(cfg, apiKey, "skill.diff", {
    skillId,
    versionA: versionId,
    action: "restore",
    source: "claude-code-plugin",
  });

  if (!result?.content) {
    console.error("Restore returned no content.");
    process.exit(1);
  }

  if (writePath) {
    await fs.writeFile(writePath, result.content, "utf8");
    console.log(`Restored ${skillId}@${versionId} → ${writePath}`);
  } else {
    const name = basename(skillId);
    const out = `${name}.restored.md`;
    await fs.writeFile(out, result.content, "utf8");
    console.log(`Restored ${skillId}@${versionId} → ${out}`);
  }
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
