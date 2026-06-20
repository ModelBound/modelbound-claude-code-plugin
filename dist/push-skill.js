import {
  ensureSkillSynced,
  setWorkspaceContext
} from "./chunk-GL2Y2YS7.js";
import "./chunk-S5DLGVNZ.js";
import "./chunk-3W7TYMR3.js";
import {
  requireApiKey
} from "./chunk-WNETRTE4.js";

// scripts/push-skill.ts
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
  console.log(`Synced ${path} \u2192 ${skillId}`);
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
