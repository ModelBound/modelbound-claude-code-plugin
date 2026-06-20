import {
  loadConfig
} from "./chunk-WNETRTE4.js";

// scripts/mcp-verify.ts
import { promises as fs } from "node:fs";
import { join } from "node:path";
var PRIVATE_RE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/;
async function main() {
  const cfg = await loadConfig();
  const allowlist = new Set(cfg.hooks.webFetchAllowlist);
  let raw;
  try {
    raw = await fs.readFile(join(process.cwd(), ".mcp.json"), "utf8");
  } catch {
    console.log("No .mcp.json found.");
    return;
  }
  const parsed = JSON.parse(raw);
  const servers = parsed.mcpServers ?? {};
  let bad = 0;
  for (const [name, srv] of Object.entries(servers)) {
    const url = srv?.url ?? "";
    const issues = [];
    if (!url)
      issues.push("(local command, skipping URL checks)");
    else {
      if (!url.startsWith("https://"))
        issues.push("not HTTPS");
      try {
        const host = new URL(url).hostname;
        if (PRIVATE_RE.test(host))
          issues.push("private/local address");
        if (allowlist.size > 0 && !allowlist.has(host))
          issues.push("not in team allow-list");
      } catch {
        issues.push("unparseable URL");
      }
    }
    const status = issues.length ? "FAIL" : "OK";
    if (issues.length)
      bad++;
    console.log(`${status.padEnd(5)} ${name.padEnd(20)} ${url}${issues.length ? "  \u2014 " + issues.join(", ") : ""}`);
  }
  if (bad > 0)
    process.exitCode = 2;
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
