// Pre-edit backup: snapshot files before Claude edits them.
import { promises as fs } from "node:fs";
import { join, relative, dirname } from "node:path";

const BACKUP_DIR = join(process.cwd(), ".mb-backup");

async function backup(path: string): Promise<void> {
  try {
    await fs.access(path);
  } catch {
    return; // file doesn't exist yet, nothing to backup
  }
  const rel = relative(process.cwd(), path);
  const safe = rel.replace(/[\\/]/g, "__");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const out = join(BACKUP_DIR, `${safe}.${ts}.bak`);
  await fs.mkdir(dirname(out), { recursive: true });
  await fs.copyFile(path, out);
}

async function main() {
  const raw = process.argv[2];
  if (!raw) return;
  let paths: string[] = [];
  try {
    const parsed = JSON.parse(raw);
    paths = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    paths = [raw];
  }
  for (const p of paths) {
    if (typeof p === "string") await backup(p);
  }
}

main().catch(() => { /* silent fail — backup is best-effort */ });
