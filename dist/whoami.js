import {
  ensureValidApiKey
} from "./chunk-WNETRTE4.js";

// scripts/whoami.ts
async function main() {
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
    process.stdout.write(`Signed in as ${who} \xB7 team ${team}
`);
    process.exit(0);
  }
  process.stdout.write(`Couldn't reach ModelBound to validate your API key (${check?.detail ?? "network"}). Stored key kept.
`);
  process.exit(0);
}
main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}
`);
  process.exit(1);
});
