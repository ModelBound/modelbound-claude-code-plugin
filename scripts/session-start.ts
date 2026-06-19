// Hook: warn on drift; if autoSync is on AND the stored API key is still
// valid, set workspace context and kick off a background sync.
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureValidApiKey } from "./config.js";
import { setWorkspaceContext } from "./skill.js";

async function main() {
  const { cfg, apiKey, check } = await ensureValidApiKey();
  if (!apiKey) {
    if (check?.status === "unauthorized") {
      process.stderr.write("ModelBound: stored API key was rejected; run /mb:sign-in to reconnect.\n");
    }
    return;
  }

  try {
    await setWorkspaceContext(cfg, apiKey, process.cwd());
  } catch {
    // Non-fatal for session start
  }

  if (!cfg.hooks.autoSync) return;

  const here = dirname(fileURLToPath(import.meta.url));
  const child = spawn(process.execPath, [join(here, "sync-rules.js")], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

main().catch(() => { /* hooks must never block session start */ });
