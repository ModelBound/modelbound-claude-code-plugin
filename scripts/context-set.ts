// Set workspace context for repo-scoped skill operations.
import { requireApiKey } from "./config.js";
import { getRepoFullName } from "./git.js";
import { setWorkspaceContext } from "./skill.js";

async function main() {
  const repoIdx = process.argv.indexOf("--repo");
  const pathIdx = process.argv.indexOf("--path");
  const repo = repoIdx >= 0 ? process.argv[repoIdx + 1] : undefined;
  const workspacePath = pathIdx >= 0 ? process.argv[pathIdx + 1] : process.cwd();
  const { cfg, apiKey } = await requireApiKey();
  const detected = repo ?? (await getRepoFullName(workspacePath));
  await setWorkspaceContext(cfg, apiKey, workspacePath, { repo: detected });
  console.log(`Workspace context set${detected ? ` · repo ${detected}` : ""} · path ${workspacePath}`);
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
