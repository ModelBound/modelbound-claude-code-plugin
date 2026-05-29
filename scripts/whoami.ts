// Reports the currently signed-in ModelBound user, validating the stored
// API key against the cloud MCP server. Used both by users (/mb:whoami)
// and internally to decide whether to skip sign-in re-prompts.
import { ensureValidApiKey } from "./config.js";

async function main(): Promise<void> {
  const { apiKey, check, cfg } = await ensureValidApiKey();

  if (!apiKey) {
    if (check?.status === "unauthorized") {
      process.stdout.write("Stored API key was rejected by ModelBound and has been cleared. Run /mb:sign-in to reconnect.\n");
      process.exit(2);
    }
    process.stdout.write("Not signed in. Run /mb:sign-in to connect ModelBound.\n");
    process.exit(2);
  }

  if (check?.status === "valid") {
    const who = check.email ?? cfg.email ?? "(unknown email)";
    const team = check.teamId ?? cfg.activeTeamId ?? "(no team)";
    process.stdout.write(`Signed in as ${who} · team ${team}\n`);
    process.exit(0);
  }

  // Network failure — don't lie about validity, but don't force re-auth either.
  process.stdout.write(`Couldn't reach ModelBound to validate your API key (${check?.detail ?? "network"}). Stored key kept.\n`);
  process.exit(0);
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
