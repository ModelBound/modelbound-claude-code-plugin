import {
  setWorkspaceContext
} from "./chunk-GL2Y2YS7.js";
import "./chunk-S5DLGVNZ.js";
import "./chunk-3W7TYMR3.js";
import {
  callMcpTool,
  requireApiKey
} from "./chunk-WNETRTE4.js";

// scripts/health.ts
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { encode } from "gpt-tokenizer";
async function main() {
  const { cfg, apiKey } = await requireApiKey();
  const cwd = process.cwd();
  const claudeDir = join(cwd, ".claude");
  let localTokens = 0;
  let fileCount = 0;
  try {
    const files = await fs.readdir(claudeDir, { recursive: true });
    for (const f of files) {
      const p = join(claudeDir, String(f));
      try {
        const stat = await fs.stat(p);
        if (!stat.isFile())
          continue;
        const content = await fs.readFile(p, "utf8");
        localTokens += encode(content).length;
        fileCount++;
      } catch {
      }
    }
  } catch {
  }
  let mcpOk = false;
  let who = null;
  try {
    await setWorkspaceContext(cfg, apiKey, cwd);
    who = await callMcpTool(cfg, apiKey, "auth_whoami", {});
    mcpOk = true;
  } catch {
    mcpOk = false;
  }
  console.log("Project Health");
  console.log("==============");
  console.log(`Local .claude/ context: ${fileCount} files \xB7 ${localTokens.toLocaleString()} tokens`);
  console.log(`MCP: ${mcpOk ? "reachable" : "unavailable"}${who?.user_email ? ` \xB7 ${who.user_email}` : ""}`);
  if (!mcpOk) {
    console.log("\n(Remote health unavailable \u2014 check sign-in or server status.)");
  }
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
