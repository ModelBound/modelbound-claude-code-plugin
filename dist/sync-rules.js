import {
  setWorkspaceContext
} from "./chunk-GL2Y2YS7.js";
import "./chunk-S5DLGVNZ.js";
import "./chunk-3W7TYMR3.js";
import {
  callMcpTool,
  requireApiKey,
  saveConfig
} from "./chunk-WNETRTE4.js";

// scripts/sync-rules.ts
import { promises as fs } from "node:fs";
import { join } from "node:path";
var PULL_PREFIXES = [".claude/", ".modelbound/", ".cursor/rules/", ".kiro/skills/"];
function shouldPull(sourcePath) {
  const norm = sourcePath.replace(/\\/g, "/");
  return PULL_PREFIXES.some((p) => norm.startsWith(p));
}
async function main() {
  const { cfg, apiKey } = await requireApiKey();
  const cwd = process.cwd();
  await setWorkspaceContext(cfg, apiKey, cwd);
  const data = await callMcpTool(
    cfg,
    apiKey,
    "list_skills",
    {}
  );
  const rows = data?.skills ?? data?.items ?? [];
  const targets = rows.filter((r) => r.source_path && shouldPull(r.source_path));
  if (targets.length === 0) {
    console.log("No workspace skills to pull (list_skills returned nothing with local source_path).");
    return;
  }
  let written = 0;
  for (const row of targets) {
    const id = row.skill_id ?? row.id;
    const rel = row.source_path.replace(/\\/g, "/");
    if (!id)
      continue;
    const fetched = await callMcpTool(
      cfg,
      apiKey,
      "get_skill",
      { skill_id: id },
      ["skills.get"]
    );
    const content = fetched?.body_md ?? fetched?.content;
    if (!content)
      continue;
    const dest = join(cwd, rel);
    await fs.mkdir(join(dest, ".."), { recursive: true });
    await fs.writeFile(dest, content, "utf8");
    console.log(`wrote ${rel}`);
    written++;
  }
  await saveConfig({ ...cfg, lastSyncAt: new Date().toISOString() });
  console.log(`Synced ${written} file(s) from cloud.`);
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
