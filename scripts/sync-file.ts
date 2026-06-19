// Sync a local skill file to cloud (alias for push-skill with explicit naming).
import { requireApiKey } from "./config.js";
import { ensureSkillSynced, resolveSkillFromPath, setWorkspaceContext } from "./skill.js";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: /mb:sync-file <path>");
    process.exit(1);
  }
  const { cfg, apiKey } = await requireApiKey();
  const cwd = process.cwd();
  const target = resolveSkillFromPath(cwd, filePath);
  await setWorkspaceContext(cfg, apiKey, cwd);
  const skillId = await ensureSkillSynced(cfg, apiKey, cwd, filePath);
  console.log(`Synced ${target.relativePath} → ${skillId}`);
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
