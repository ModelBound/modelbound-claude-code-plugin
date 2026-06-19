import { promises as fs } from "node:fs";
import * as path from "node:path";
import { callMcpTool, type ModelBoundConfig } from "./config.js";
import { prepareSyncAuth } from "./auth-cache.js";
import { getCurrentBranch, getRepoFullName } from "./git.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SourceIde = "cursor" | "kiro" | "claude" | "vscode" | "copilot" | "windsurf" | "modelbound";

export interface SkillTarget {
  skillId?: string;
  slug: string;
  relativePath: string;
  absolutePath: string;
  label: string;
  sourceIde: SourceIde;
}

const SKILL_PATTERNS: Array<{ test: RegExp; ide: SourceIde }> = [
  { test: /^\.modelbound\/.+\.(md|json)$/i, ide: "modelbound" },
  { test: /^\.kiro\/skills\/.+\.md$/i, ide: "kiro" },
  { test: /^\.cursor\/rules\/.+\.(md|mdc)$/i, ide: "cursor" },
  { test: /^\.claude\/.+\.md$/i, ide: "claude" },
  { test: /^\.agents\/skills\/[^/]+\/SKILL\.md$/i, ide: "copilot" },
];

export const SKILL_PATH_HINTS = [".modelbound", ".cursor/rules", ".kiro/skills", ".claude", ".agents/skills"];

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function isSkillFile(relativePath: string): boolean {
  const norm = relativePath.replace(/\\/g, "/");
  return SKILL_PATTERNS.some(({ test }) => test.test(norm));
}

export function detectSourceIde(relativePath: string): SourceIde {
  const norm = relativePath.replace(/\\/g, "/");
  for (const { test, ide } of SKILL_PATTERNS) {
    if (test.test(norm)) return ide;
  }
  return "claude";
}

export function slugFromPath(relativePath: string): string {
  const norm = relativePath.replace(/\\/g, "/");
  const agents = norm.match(/^\.agents\/skills\/([^/]+)\/SKILL\.md$/i);
  if (agents) return agents[1];
  const base = path.basename(norm);
  return base.replace(/\.(md|mdc|json)$/i, "");
}

/** Resolve a file path, slug, or UUID into a SkillTarget (no cloud calls). */
export function resolveSkillFromPath(cwd: string, target: string): SkillTarget {
  if (isUuid(target)) {
    return {
      skillId: target,
      slug: target.slice(0, 8),
      relativePath: target,
      absolutePath: target,
      label: target,
      sourceIde: "modelbound",
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
    sourceIde: detectSourceIde(rel),
  };
}

export async function setWorkspaceContext(
  cfg: ModelBoundConfig,
  apiKey: string,
  cwd: string,
  opts: { repo?: string } = {},
): Promise<unknown> {
  const repo = opts.repo ?? (await getRepoFullName(cwd));
  const args: Record<string, unknown> = {
    workspace_path: path.resolve(cwd),
    file_hints: SKILL_PATH_HINTS,
  };
  if (repo) args.repo_full_name = repo;
  return callMcpTool(cfg, apiKey, "set_workspace_context", args);
}

export async function ensureSkillSynced(
  cfg: ModelBoundConfig,
  apiKey: string,
  cwd: string,
  target: string,
  opts: { repo?: string } = {},
): Promise<string> {
  await prepareSyncAuth(apiKey);

  const skill = resolveSkillFromPath(cwd, target);
  if (skill.skillId) return skill.skillId;

  await setWorkspaceContext(cfg, apiKey, cwd, opts);

  try {
    await fs.access(skill.absolutePath);
  } catch {
    const found = await callMcpTool<{ skill_id?: string; id?: string }>(
      cfg,
      apiKey,
      "get_skill",
      { skill_id: skill.slug },
      ["skills.get"],
    );
    const id = found?.skill_id ?? found?.id;
    if (id) return id;
    throw new Error(`Skill not found: ${target}. Provide a local skill file path or sync first.`);
  }

  const body_md = await fs.readFile(skill.absolutePath, "utf8");
  const repo = opts.repo ?? (await getRepoFullName(cwd));
  const branch = await getCurrentBranch(cwd);

  const synced = await callMcpTool<{ skill_id?: string; id?: string }>(
    cfg,
    apiKey,
    "sync_skill_from_ide",
    {
      repo_url: repo ? `https://github.com/${repo}` : undefined,
      branch,
      source_ide: skill.sourceIde,
      source_path: skill.relativePath,
      body_md,
    },
  );

  const skillId = synced?.skill_id ?? synced?.id;
  if (skillId) return skillId;

  const fallback = await callMcpTool<{ skill_id?: string; id?: string }>(
    cfg,
    apiKey,
    "get_skill",
    { skill_id: skill.slug },
    ["skills.get"],
  );
  const fallbackId = fallback?.skill_id ?? fallback?.id;
  if (fallbackId) return fallbackId;

  throw new Error(`Could not resolve skill UUID for ${skill.label}. Run /mb:sync-file ${skill.relativePath}.`);
}

/** Resolve target to a repo-linked UUID (syncs local files first). */
export async function resolveSkillId(
  cfg: ModelBoundConfig,
  apiKey: string,
  cwd: string,
  target: string,
  opts: { repo?: string; sync?: boolean } = {},
): Promise<string> {
  const skill = resolveSkillFromPath(cwd, target);
  if (skill.skillId) return skill.skillId;
  if (opts.sync !== false) return ensureSkillSynced(cfg, apiKey, cwd, target, opts);
  const found = await callMcpTool<{ skill_id?: string; id?: string }>(
    cfg,
    apiKey,
    "get_skill",
    { skill_id: skill.slug },
    ["skills.get"],
  );
  const id = found?.skill_id ?? found?.id;
  if (id) return id;
  throw new Error(`Could not resolve skill: ${target}`);
}
