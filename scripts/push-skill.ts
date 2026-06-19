// Push a local skill file to cloud via sync_skill_from_ide (repo-linked UUID).
import { requireApiKey } from "./config.js";
import { ensureSkillSynced, setWorkspaceContext } from "./skill.js";

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: /mb:push-skill <path>");
    process.exit(1);
  }
  const { cfg, apiKey } = await requireApiKey();
  const cwd = process.cwd();
  await setWorkspaceContext(cfg, apiKey, cwd);
  const skillId = await ensureSkillSynced(cfg, apiKey, cwd, path);
  console.log(`Synced ${path} → ${skillId}`);
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
