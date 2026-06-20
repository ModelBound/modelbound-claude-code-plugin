import {
  setWorkspaceContext
} from "./chunk-GL2Y2YS7.js";
import {
  getRepoFullName
} from "./chunk-S5DLGVNZ.js";
import "./chunk-3W7TYMR3.js";
import {
  requireApiKey
} from "./chunk-WNETRTE4.js";

// scripts/context-set.ts
async function main() {
  const repoIdx = process.argv.indexOf("--repo");
  const pathIdx = process.argv.indexOf("--path");
  const repo = repoIdx >= 0 ? process.argv[repoIdx + 1] : void 0;
  const workspacePath = pathIdx >= 0 ? process.argv[pathIdx + 1] : process.cwd();
  const { cfg, apiKey } = await requireApiKey();
  const detected = repo ?? await getRepoFullName(workspacePath);
  await setWorkspaceContext(cfg, apiKey, workspacePath, { repo: detected });
  console.log(`Workspace context set${detected ? ` \xB7 repo ${detected}` : ""} \xB7 path ${workspacePath}`);
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
