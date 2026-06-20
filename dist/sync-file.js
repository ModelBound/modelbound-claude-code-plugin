import {
  ensureSkillSynced,
  resolveSkillFromPath,
  setWorkspaceContext
} from "./chunk-GL2Y2YS7.js";
import "./chunk-S5DLGVNZ.js";
import "./chunk-3W7TYMR3.js";
import {
  requireApiKey
} from "./chunk-WNETRTE4.js";

// scripts/sync-file.ts
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
  console.log(`Synced ${target.relativePath} \u2192 ${skillId}`);
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
