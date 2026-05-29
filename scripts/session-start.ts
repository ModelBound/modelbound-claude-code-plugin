// Hook: warn on drift; if autoSync is on AND the stored API key is still
// valid, kick off a background sync. Validating first avoids spamming
// users with "Not signed in" errors on every session start when their
// key was rotated server-side.
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureValidApiKey } from "./config.js";

async function main() {
  const { apiKey, check } = await ensureValidApiKey();
  if (!apiKey) {
    if (check?.status === "unauthorized") {
      process.stderr.write("ModelBound: stored API key was rejected; run /mb:sign-in to reconnect.\n");
    }
    return;
  }
  // Network-degraded but stored key kept — still attempt sync; it may
  // recover before the child process gets there.
  const { cfg } = await ensureValidApiKey();
  if (!cfg.hooks.autoSync) return;

  const here = dirname(fileURLToPath(import.meta.url));
  const child = spawn(process.execPath, [join(here, "sync-rules.js")], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

main().catch(() => { /* hooks must never block session start */ });
