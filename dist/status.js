import {
  ensureValidApiKey
} from "./chunk-WNETRTE4.js";

// scripts/status.ts
async function main() {
  const { apiKey, check, cfg } = await ensureValidApiKey();
  if (!apiKey) {
    console.log("Not signed in. Run /mb:sign-in.");
    return;
  }
  const email = check?.status === "valid" ? check.email ?? cfg.email : cfg.email;
  const team = check?.status === "valid" ? check.teamId ?? cfg.activeTeamId : cfg.activeTeamId;
  console.log(`Signed in: ${email ?? "(unknown email)"}`);
  console.log(`Active team: ${team ?? "(none)"}`);
  console.log(`MCP: ${cfg.mcpUrl}`);
  console.log(`Last sync: ${cfg.lastSyncAt ?? "never"}`);
  console.log(`Hooks: autoSync=${cfg.hooks.autoSync} bashGuard=${cfg.hooks.bashGuard} webFetchGuard=${cfg.hooks.webFetchGuard}`);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
