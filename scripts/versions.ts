// List skill versions and checkpoints.
import { callMcpTool, requireApiKey } from "./config.js";

async function main() {
  const skillId = process.argv[2];
  if (!skillId) {
    console.error("Usage: /mb:versions <skill-id>");
    process.exit(1);
  }
  const { cfg, apiKey } = await requireApiKey();
  const result = await callMcpTool<{
    versions: Array<{ id: string; createdAt: string; score?: number; label?: string; sizeBytes: number }>;
  }>(cfg, apiKey, "skill.versions", { skillId, source: "claude-code-plugin" });

  if (!result?.versions?.length) {
    console.log("No versions found.");
    return;
  }

  console.log(`Versions for ${skillId}:`);
  for (const v of result.versions) {
    const score = v.score != null ? ` · score ${v.score}` : "";
    const label = v.label ? ` · ${v.label}` : "";
    console.log(`  ${v.id} · ${v.createdAt}${score}${label} · ${v.sizeBytes} bytes`);
  }
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
