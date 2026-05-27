import { loadConfig } from "./config.js";

async function main() {
  const cfg = await loadConfig();
  if (!cfg.apiKey) {
    console.log("Not signed in. Run /mb:sign-in.");
    return;
  }
  console.log(`Signed in: ${cfg.email ?? "(unknown email)"}`);
  console.log(`Active team: ${cfg.activeTeamId ?? "(none)"}`);
  console.log(`MCP: ${cfg.mcpUrl}`);
  console.log(`Last sync: ${cfg.lastSyncAt ?? "never"}`);
  console.log(`Hooks: autoSync=${cfg.hooks.autoSync} bashGuard=${cfg.hooks.bashGuard} webFetchGuard=${cfg.hooks.webFetchGuard}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
