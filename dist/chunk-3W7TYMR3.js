// scripts/auth-cache.ts
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
var CACHE_FILE = join(homedir(), ".modelbound", "auth-cache.json");
var CACHE_TTL_MS = 6 * 24 * 60 * 60 * 1e3;
var AUTH_CHECK_URL = "https://qwqfoyhnhszqqplsavxk.supabase.co/functions/v1/extension-auth-check";
function fingerprint(apiKey) {
  return createHash("sha256").update(apiKey).digest("hex");
}
async function loadCache() {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
async function saveCache(cache) {
  await fs.mkdir(join(homedir(), ".modelbound"), { recursive: true, mode: 448 });
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), { mode: 384 });
}
async function prepareSyncAuth(apiKey) {
  const fp = fingerprint(apiKey);
  const cache = await loadCache();
  const entry = cache[fp];
  if (entry && Date.now() - entry.validatedAt < CACHE_TTL_MS && entry.valid)
    return;
  const res = await fetch(AUTH_CHECK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({})
  });
  if (!res.ok) {
    throw new Error(`Auth check failed: HTTP ${res.status}. Run /mb:sign-in.`);
  }
  const body = await res.json();
  cache[fp] = { fingerprint: fp, validatedAt: Date.now(), valid: !!body.valid };
  await saveCache(cache);
  if (!body.valid)
    throw new Error("Invalid or expired API key. Run /mb:sign-in.");
}

export {
  prepareSyncAuth
};
