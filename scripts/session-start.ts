// Hook: warn on drift; if autoSync is on, kick off a background sync.
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";

async function main() {
  const cfg = await loadConfig();
  if (!cfg.apiKey || !cfg.hooks.autoSync) return;
  const here = dirname(fileURLToPath(import.meta.url));
  const child = spawn(process.execPath, [join(here, "sync-rules.js")], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

main().catch(() => { /* hooks must never block session start */ });
