import {
  setWorkspaceContext
} from "./chunk-GL2Y2YS7.js";
import "./chunk-S5DLGVNZ.js";
import "./chunk-3W7TYMR3.js";
import {
  ensureValidApiKey
} from "./chunk-WNETRTE4.js";

// scripts/session-start.ts
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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
  }
  if (!cfg.hooks.autoSync)
    return;
  const here = dirname(fileURLToPath(import.meta.url));
  const child = spawn(process.execPath, [join(here, "sync-rules.js")], {
    detached: true,
    stdio: "ignore"
  });
  child.unref();
}
main().catch(() => {
});
