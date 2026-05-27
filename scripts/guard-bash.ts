// PreToolUse(Bash) hook. Block denylisted bash patterns; log attempts.
// Reads the tool-call payload from stdin per Claude Code hook protocol.
import { loadConfig } from "./config.js";

async function main() {
  const cfg = await loadConfig();
  if (!cfg.hooks.bashGuard) return;
  const stdin = await new Promise<string>((resolve) => {
    let buf = ""; process.stdin.on("data", (c) => (buf += c)); process.stdin.on("end", () => resolve(buf));
    if (process.stdin.isTTY) resolve("");
  });
  let payload: any = {};
  try { payload = JSON.parse(stdin || "{}"); } catch { /* */ }
  const cmd: string = payload?.tool_input?.command ?? "";
  for (const pattern of cfg.hooks.bashDenylist) {
    if (new RegExp(pattern).test(cmd)) {
      process.stdout.write(JSON.stringify({
        decision: "block",
        reason: `ModelBound: bash pattern blocked by team policy (${pattern}).`,
      }));
      process.exit(2);
    }
  }
}

main().catch(() => { /* fail-open */ });
