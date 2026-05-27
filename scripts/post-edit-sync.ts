// Hook: auto-push edits under .claude/ back to ModelBound.
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";

async function main() {
  const cfg = await loadConfig();
  if (!cfg.apiKey || !cfg.hooks.autoSync) return;
  // Claude Code passes the edited path via env CLAUDE_TOOL_PATH or stdin payload.
  const path = process.env.CLAUDE_TOOL_PATH ?? process.argv[2];
  if (!path || !path.includes(".claude/")) return;
  const here = dirname(fileURLToPath(import.meta.url));
  const child = spawn(process.execPath, [join(here, "push-skill.js"), path], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

main().catch(() => { /* hooks must never block tool use */ });
