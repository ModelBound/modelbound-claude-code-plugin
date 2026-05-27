// PreToolUse(WebFetch) hook. Block private IPs and non-allow-listed hosts.
import { loadConfig } from "./config.js";

const PRIVATE_RE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.)/;

async function main() {
  const cfg = await loadConfig();
  if (!cfg.hooks.webFetchGuard) return;
  const stdin = await new Promise<string>((resolve) => {
    let buf = ""; process.stdin.on("data", (c) => (buf += c)); process.stdin.on("end", () => resolve(buf));
    if (process.stdin.isTTY) resolve("");
  });
  let payload: any = {};
  try { payload = JSON.parse(stdin || "{}"); } catch { /* */ }
  const url: string = payload?.tool_input?.url ?? "";
  try {
    const host = new URL(url).hostname;
    const allow = new Set(cfg.hooks.webFetchAllowlist);
    if (PRIVATE_RE.test(host)) {
      process.stdout.write(JSON.stringify({ decision: "block", reason: `ModelBound: WebFetch to private address ${host} blocked.` }));
      process.exit(2);
    }
    if (allow.size > 0 && !allow.has(host)) {
      process.stdout.write(JSON.stringify({ decision: "block", reason: `ModelBound: ${host} not in team allow-list.` }));
      process.exit(2);
    }
  } catch { /* unparseable URL — let Claude Code handle */ }
}

main().catch(() => { /* fail-open */ });
