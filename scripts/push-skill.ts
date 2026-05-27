// Push a single local SKILL.md (or markdown rule) to the active team.
import { promises as fs } from "node:fs";
import { basename, relative } from "node:path";
import { callMcpTool, requireApiKey } from "./config.js";

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: /mb:push-skill <path>");
    process.exit(1);
  }
  const { cfg, apiKey } = await requireApiKey();
  const content = await fs.readFile(path, "utf8");
  const rel = relative(process.cwd(), path);
  const skillId = basename(path).replace(/\.(md|json)$/i, "");
  await callMcpTool(cfg, apiKey, "skills.syncFromIde", {
    ide: "claude-code",
    relative_path: rel,
    content,
  });
  console.log(`Pushed ${skillId} (${rel}).`);
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
