// Lists team skills, optionally filtered by source_platform and ai_type.
import { callMcpTool, requireApiKey } from "./config.js";
import { setWorkspaceContext } from "./skill.js";

interface SkillRow {
  id?: string;
  name?: string;
  slug?: string;
  ai_type?: string;
  source_platform?: string;
  source_path?: string;
  repo?: string;
}
interface ListResponse { skills?: SkillRow[]; items?: SkillRow[] }

function pad(s: string, n: number) { return (s + " ".repeat(n)).slice(0, n); }

async function main() {
  const [platform, aiType] = process.argv.slice(2);
  const { cfg, apiKey } = await requireApiKey();
  await setWorkspaceContext(cfg, apiKey, process.cwd());
  const args: Record<string, string> = {};
  if (platform) args.source_platform = platform;
  if (aiType) args.ai_type = aiType;
  const data = await callMcpTool<ListResponse>(cfg, apiKey, "list_skills", args);
  const rows = data?.skills ?? data?.items ?? [];
  if (rows.length === 0) {
    console.log("No skills found for the given filters.");
    return;
  }
  console.log(`| Name | ai_type | source_platform | repo | source_path |`);
  console.log(`| --- | --- | --- | --- | --- |`);
  for (const r of rows) {
    const name = r.name || r.slug || r.id || "(unnamed)";
    console.log(
      `| ${name} | ${r.ai_type ?? "—"} | ${r.source_platform ?? "—"} | ${r.repo ?? "—"} | ${r.source_path ?? "—"} |`,
    );
  }
  console.log(`\n${rows.length} skill(s).`);
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
