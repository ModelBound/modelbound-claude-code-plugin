// Check project health: local context size + MCP connectivity.
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { callMcpTool, requireApiKey } from "./config.js";
import { setWorkspaceContext } from "./skill.js";
import { encode } from "gpt-tokenizer";

async function main() {
  const { cfg, apiKey } = await requireApiKey();
  const cwd = process.cwd();

  // Local file analysis
  const claudeDir = join(cwd, ".claude");
  let localTokens = 0;
  let fileCount = 0;
  try {
    const files = await fs.readdir(claudeDir, { recursive: true });
    for (const f of files) {
      const p = join(claudeDir, String(f));
      try {
        const stat = await fs.stat(p);
        if (!stat.isFile()) continue;
        const content = await fs.readFile(p, "utf8");
        localTokens += encode(content).length;
        fileCount++;
      } catch { /* ignore */ }
    }
  } catch { /* .claude/ may not exist */ }

  let mcpOk = false;
  let who: { user_email?: string; team_id?: string } | null = null;
  try {
    await setWorkspaceContext(cfg, apiKey, cwd);
    who = await callMcpTool<{ user_email?: string; team_id?: string }>(cfg, apiKey, "auth_whoami", {});
    mcpOk = true;
  } catch {
    mcpOk = false;
  }

  console.log("Project Health");
  console.log("==============");
  console.log(`Local .claude/ context: ${fileCount} files · ${localTokens.toLocaleString()} tokens`);
  console.log(`MCP: ${mcpOk ? "reachable" : "unavailable"}${who?.user_email ? ` · ${who.user_email}` : ""}`);
  if (!mcpOk) {
    console.log("\n(Remote health unavailable — check sign-in or server status.)");
  }
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
