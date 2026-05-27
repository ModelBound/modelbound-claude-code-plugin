// Pulls the active team's skills/rules/system-prompts into ./.claude/
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { callMcpTool, requireApiKey, saveConfig } from "./config.js";

interface SyncedItem { path: string; content: string; }
interface SyncResponse { items: SyncedItem[] }

async function main() {
  const { cfg, apiKey } = await requireApiKey();
  const cwd = process.cwd();
  const data = await callMcpTool<SyncResponse>(cfg, apiKey, "skills.syncToIde", {
    ide: "claude-code",
    target: ".claude",
  });
  const items = data?.items ?? [];
  if (items.length === 0) {
    console.log("No skills/rules to sync.");
    return;
  }
  for (const it of items) {
    const dest = join(cwd, it.path);
    await fs.mkdir(join(dest, ".."), { recursive: true });
    await fs.writeFile(dest, it.content, "utf8");
    console.log(`wrote ${it.path}`);
  }
  await saveConfig({ ...cfg, lastSyncAt: new Date().toISOString() });
  console.log(`Synced ${items.length} file(s) into .claude/.`);
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
