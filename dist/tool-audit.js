// scripts/tool-audit.ts
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { encode } from "gpt-tokenizer";
async function readJson(path) {
  try {
    return JSON.parse(await fs.readFile(path, "utf8"));
  } catch {
    return null;
  }
}
async function main() {
  const candidates = [".mcp.json", ".claude/settings.json", "claude_desktop_config.json"];
  let cfg = null;
  let from = "";
  for (const c of candidates) {
    cfg = await readJson(join(process.cwd(), c));
    if (cfg) {
      from = c;
      break;
    }
  }
  if (!cfg?.mcpServers) {
    console.log("No MCP config found (.mcp.json / .claude/settings.json).");
    return;
  }
  console.log(`MCP servers configured in ${from}:
`);
  const rows = [];
  for (const [name, srv] of Object.entries(cfg.mcpServers)) {
    const url = srv.url ?? srv.command ?? "(local)";
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
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
