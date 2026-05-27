// Browser device-code sign-in. Mirrors modelbound-cursor-extension/src/device-auth.ts.
import { loadConfig, saveConfig } from "./config.js";

const POLL_INTERVAL_MS = 2500;
const TIMEOUT_MS = 5 * 60 * 1000;

async function openBrowser(url: string): Promise<void> {
  const { exec } = await import("node:child_process");
  const cmd =
    process.platform === "darwin" ? `open "${url}"`
    : process.platform === "win32" ? `start "" "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, () => { /* best-effort */ });
}

async function main(): Promise<void> {
  const cfg = await loadConfig();
  const startRes = await fetch(cfg.authUrl + "/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client: "claude-code-plugin" }),
  });
  if (!startRes.ok) throw new Error(`start failed: HTTP ${startRes.status}`);
  const { device_code, verification_uri, user_code } = await startRes.json();

  console.log(`\n  Open this URL to approve:\n    ${verification_uri}\n  Code: ${user_code}\n`);
  await openBrowser(verification_uri);

  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const pollRes = await fetch(cfg.authUrl + "/poll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_code }),
    });
    if (pollRes.status === 202) continue;
    if (pollRes.status === 410) throw new Error("Sign-in code expired — run /mb:sign-in again.");
    if (!pollRes.ok) throw new Error(`poll failed: HTTP ${pollRes.status}`);
    const { api_key, email, team_id } = await pollRes.json();
    await saveConfig({ ...cfg, apiKey: api_key, email, activeTeamId: team_id });
    console.log(`Signed in${email ? ` as ${email}` : ""}.`);
    return;
  }
  throw new Error("Sign-in timed out.");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
