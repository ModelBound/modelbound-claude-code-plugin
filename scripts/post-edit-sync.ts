// Hook: auto-push edits on watched skill paths back to ModelBound.
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { isSkillFile } from "./skill.js";

const WATCH_PREFIXES = [".modelbound/", ".claude/", ".cursor/rules/", ".kiro/skills/", ".agents/skills/"];

function isWatchedSkillPath(filePath: string): boolean {
  const norm = filePath.replace(/\\/g, "/");
  if (!WATCH_PREFIXES.some((p) => norm.includes(p))) return false;
  return isSkillFile(norm) || /SKILL\.md$/i.test(norm) || /\.(md|mdc|json)$/i.test(norm);
}

async function main() {
  const cfg = await loadConfig();
  if (!cfg.apiKey || !cfg.hooks.autoSync) return;
  const path = process.env.CLAUDE_TOOL_PATH ?? process.argv[2];
  if (!path || !isWatchedSkillPath(path)) return;
  const here = dirname(fileURLToPath(import.meta.url));
  const child = spawn(process.execPath, [join(here, "push-skill.js"), path], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

main().catch(() => { /* hooks must never block tool use */ });
