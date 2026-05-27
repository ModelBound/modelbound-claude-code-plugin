// Rank installed MCP tools by token cost of their declared schemas.
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { encode } from "gpt-tokenizer";

interface McpConfig { mcpServers?: Record<string, { url?: string; command?: string }> }

async function readJson<T>(path: string): Promise<T | null> {
  try { return JSON.parse(await fs.readFile(path, "utf8")) as T; } catch { return null; }
}

async function main() {
  const candidates = [".mcp.json", ".claude/settings.json", "claude_desktop_config.json"];
  let cfg: McpConfig | null = null;
  let from = "";
  for (const c of candidates) {
    cfg = await readJson<McpConfig>(join(process.cwd(), c));
    if (cfg) { from = c; break; }
  }
  if (!cfg?.mcpServers) {
    console.log("No MCP config found (.mcp.json / .claude/settings.json).");
    return;
  }
  console.log(`MCP servers configured in ${from}:\n`);
  const rows: Array<{ name: string; url: string; estTokens: number }> = [];
  for (const [name, srv] of Object.entries(cfg.mcpServers)) {
    const url = srv.url ?? srv.command ?? "(local)";
    // Without live introspection we estimate from the entry size; live introspection
    // requires Claude Code to be running. This still flags relatively bloated entries.
    const estTokens = encode(JSON.stringify(srv)).length;
    rows.push({ name, url, estTokens });
  }
  rows.sort((a, b) => b.estTokens - a.estTokens);
  console.log("Server".padEnd(24), "Est. config tokens".padStart(20), " URL/cmd");
  for (const r of rows) {
    console.log(r.name.padEnd(24), String(r.estTokens).padStart(20), " " + r.url);
  }
  console.log("\nTip: run `/mb:tokens` to see how skills/rules eat the rest of your budget.");
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
