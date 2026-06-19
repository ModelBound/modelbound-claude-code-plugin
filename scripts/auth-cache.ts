import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CACHE_FILE = join(homedir(), ".modelbound", "auth-cache.json");
const CACHE_TTL_MS = 6 * 24 * 60 * 60 * 1000;
const AUTH_CHECK_URL = "https://qwqfoyhnhszqqplsavxk.supabase.co/functions/v1/extension-auth-check";

interface CacheEntry {
  fingerprint: string;
  validatedAt: number;
  valid: boolean;
}

function fingerprint(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

async function loadCache(): Promise<Record<string, CacheEntry>> {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf8");
    return JSON.parse(raw) as Record<string, CacheEntry>;
  } catch {
    return {};
  }
}

async function saveCache(cache: Record<string, CacheEntry>): Promise<void> {
  await fs.mkdir(join(homedir(), ".modelbound"), { recursive: true, mode: 0o700 });
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), { mode: 0o600 });
}

/** Validate API key with 6-day cache (matches extension auth-validate.ts). */
export async function prepareSyncAuth(apiKey: string): Promise<void> {
  const fp = fingerprint(apiKey);
  const cache = await loadCache();
  const entry = cache[fp];
  if (entry && Date.now() - entry.validatedAt < CACHE_TTL_MS && entry.valid) return;

  const res = await fetch(AUTH_CHECK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    throw new Error(`Auth check failed: HTTP ${res.status}. Run /mb:sign-in.`);
  }
  const body = (await res.json()) as { valid?: boolean };
  cache[fp] = { fingerprint: fp, validatedAt: Date.now(), valid: !!body.valid };
  await saveCache(cache);
  if (!body.valid) throw new Error("Invalid or expired API key. Run /mb:sign-in.");
}
