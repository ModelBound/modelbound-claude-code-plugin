// scripts/git.ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
var exec = promisify(execFile);
async function getRepoFullName(cwd) {
  try {
    const { stdout } = await exec("git", ["remote", "get-url", "origin"], { cwd });
    const url = stdout.trim();
    const ssh = url.match(/git@[^:]+:([^/]+\/[^/.]+?)(?:\.git)?$/);
    if (ssh)
      return ssh[1];
    const https = url.match(/https?:\/\/[^/]+\/([^/]+\/[^/.]+?)(?:\.git)?$/);
    if (https)
      return https[1];
    return void 0;
  } catch {
    return void 0;
  }
}
async function getCurrentBranch(cwd) {
  try {
    const { stdout } = await exec("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd });
    return stdout.trim() || "main";
  } catch {
    return "main";
  }
}

export {
  getRepoFullName,
  getCurrentBranch
};
