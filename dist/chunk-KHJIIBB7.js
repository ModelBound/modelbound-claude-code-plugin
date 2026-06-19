import {
  getCurrentBranch,
  getRepoFullName
} from "./chunk-S5DLGVNZ.js";
import {
  prepareSyncAuth
} from "./chunk-3W7TYMR3.js";
import {
  callMcpTool
} from "./chunk-Z7IDK4O3.js";

// scripts/skill.ts
import { promises as fs } from "node:fs";
import * as path from "node:path";
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var SKILL_PATTERNS = [
  { test: /^\.modelbound\/.+\.(md|json)$/i, ide: "modelbound" },
  { test: /^\.kiro\/skills\/.+\.md$/i, ide: "kiro" },
  { test: /^\.cursor\/rules\/.+\.(md|mdc)$/i, ide: "cursor" },
  { test: /^\.claude\/.+\.md$/i, ide: "claude" },
  { test: /^\.agents\/skills\/[^/]+\/SKILL\.md$/i, ide: "copilot" }
];
var SKILL_PATH_HINTS = [".modelbound", ".cursor/rules", ".kiro/skills", ".claude", ".agents/skills"];
function isUuid(value) {
  return UUID_RE.test(value);
}
function isSkillFile(relativePath) {
  const norm = relativePath.replace(/\\/g, "/");
  return SKILL_PATTERNS.some(({ test }) => test.test(norm));
}
function detectSourceIde(relativePath) {
  const norm = relativePath.replace(/\\/g, "/");
  for (const { test, ide } of SKILL_PATTERNS) {
    if (test.test(norm))
      return ide;
  }
  return "claude";
}
function slugFromPath(relativePath) {
  const norm = relativePath.replace(/\\/g, "/");
  const agents = norm.match(/^\.agents\/skills\/([^/]+)\/SKILL\.md$/i);
  if (agents)
    return agents[1];
  const base = path.basename(norm);
  return base.replace(/\.(md|mdc|json)$/i, "");
}
function resolveSkillFromPath(cwd, target) {
  if (isUuid(target)) {
    return {
      skillId: target,
      slug: target.slice(0, 8),
      relativePath: target,
      absolutePath: target,
      label: target,
      sourceIde: "modelbound"
    };
  }
  const abs = path.isAbsolute(target) ? target : path.resolve(cwd, target);
  const rel = path.relative(cwd, abs).replace(/\\/g, "/");
  const slug = slugFromPath(rel);
  return {
    slug,
    relativePath: rel,
    absolutePath: abs,
    label: rel,
    sourceIde: detectSourceIde(rel)
  };
}
async function setWorkspaceContext(cfg, apiKey, cwd, opts = {}) {
  const repo = opts.repo ?? await getRepoFullName(cwd);
  const args = {
    workspace_path: path.resolve(cwd),
    file_hints: SKILL_PATH_HINTS
  };
  if (repo)
    args.repo_full_name = repo;
  return callMcpTool(cfg, apiKey, "set_workspace_context", args);
}
async function ensureSkillSynced(cfg, apiKey, cwd, target, opts = {}) {
  await prepareSyncAuth(apiKey);
  const skill = resolveSkillFromPath(cwd, target);
  if (skill.skillId)
    return skill.skillId;
  await setWorkspaceContext(cfg, apiKey, cwd, opts);
  try {
    await fs.access(skill.absolutePath);
  } catch {
    const found = await callMcpTool(
      cfg,
      apiKey,
      "get_skill",
      { skill_id: skill.slug },
      ["skills.get"]
    );
    const id = found?.skill_id ?? found?.id;
    if (id)
      return id;
    throw new Error(`Skill not found: ${target}. Provide a local skill file path or sync first.`);
  }
  const body_md = await fs.readFile(skill.absolutePath, "utf8");
  const repo = opts.repo ?? await getRepoFullName(cwd);
  const branch = await getCurrentBranch(cwd);
  const synced = await callMcpTool(
    cfg,
    apiKey,
    "sync_skill_from_ide",
    {
      repo_url: repo ? `https://github.com/${repo}` : void 0,
      branch,
      source_ide: skill.sourceIde,
      source_path: skill.relativePath,
      body_md
    }
  );
  const skillId = synced?.skill_id ?? synced?.id;
  if (skillId)
    return skillId;
  const fallback = await callMcpTool(
    cfg,
    apiKey,
    "get_skill",
    { skill_id: skill.slug },
    ["skills.get"]
  );
  const fallbackId = fallback?.skill_id ?? fallback?.id;
  if (fallbackId)
    return fallbackId;
  throw new Error(`Could not resolve skill UUID for ${skill.label}. Run /mb:sync-file ${skill.relativePath}.`);
}
async function resolveSkillId(cfg, apiKey, cwd, target, opts = {}) {
  const skill = resolveSkillFromPath(cwd, target);
  if (skill.skillId)
    return skill.skillId;
  if (opts.sync !== false)
    return ensureSkillSynced(cfg, apiKey, cwd, target, opts);
  const found = await callMcpTool(
    cfg,
    apiKey,
    "get_skill",
    { skill_id: skill.slug },
    ["skills.get"]
  );
  const id = found?.skill_id ?? found?.id;
  if (id)
    return id;
  throw new Error(`Could not resolve skill: ${target}`);
}

export {
  SKILL_PATH_HINTS,
  isUuid,
  isSkillFile,
  detectSourceIde,
  slugFromPath,
  resolveSkillFromPath,
  setWorkspaceContext,
  ensureSkillSynced,
  resolveSkillId
};
