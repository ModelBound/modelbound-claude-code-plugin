import {
  loadConfig
} from "./chunk-WNETRTE4.js";

// scripts/guard-bash.ts
async function main() {
  const cfg = await loadConfig();
  if (!cfg.hooks.bashGuard)
    return;
  const stdin = await new Promise((resolve) => {
    let buf = "";
    process.stdin.on("data", (c) => buf += c);
    process.stdin.on("end", () => resolve(buf));
    if (process.stdin.isTTY)
      resolve("");
  });
  let payload = {};
  try {
    payload = JSON.parse(stdin || "{}");
  } catch {
  }
  const cmd = payload?.tool_input?.command ?? "";
  for (const pattern of cfg.hooks.bashDenylist) {
    if (new RegExp(pattern).test(cmd)) {
      process.stdout.write(JSON.stringify({
        decision: "block",
        reason: `ModelBound: bash pattern blocked by team policy (${pattern}).`
      }));
      process.exit(2);
    }
  }
}
main().catch(() => {
});
