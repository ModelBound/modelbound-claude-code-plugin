# Known hosted-backend blockers

These issues affect the CLI, MCP proxy, Claude Code plugin, and Cursor extension equally. They require fixes on the Lovable-hosted backend (`https://mcp.modelbound.co`). All clients surface these errors explicitly rather than swallowing them.

| Issue | Symptom | Root cause | Status |
|-------|---------|------------|--------|
| Pipeline JWT error | `Pipeline failed: Expected 3 parts in JWT; got 1` | `run-skill-pipeline` invoked with `actor_user_id` instead of `_actor: { user_id, team_id, source: "mcp" }` | Pending Lovable deploy |
| Pipeline status query | `column skill_pipeline_runs.version does not exist` | Status query selects `version` instead of `version_before`, `version_after` | Pending Lovable deploy |
| Ignore finding | `null value in column "team_id" of relation "skill_trust"` | `ignore_skill_finding` upsert missing `team_id` | Pending Lovable deploy |
| Benchmark / compare / suggest | `Unauthorized` | Internal edge calls missing `_actor` forwarding | Pending Lovable deploy |

## Workarounds

Until backend fixes land:

- **Pipeline**: errors include `Pipeline failed:` prefix — retry after Lovable deploys `_actor` fix.
- **Findings ignore/unignore**: may fail with team_id constraint — use `/mb:findings list` to verify; retry after deploy.
- **Benchmark, compare, suggest**: expect `Unauthorized` until internal invoke pattern is fixed.

## Test & Optimize workflow (once backend fixes land)

```bash
# 1. Set repo context + sync file to get repo-linked UUID
/mb:context-set --repo org/repo
/mb:sync-file .modelbound/prompt-pr-contributor.md

# 2. List findings
/mb:findings list --skill .modelbound/prompt-pr-contributor.md

# 3. Ignore a finding by key
node scripts/findings.js ignore --skill .modelbound/prompt-pr-contributor.md --key "escalation:critical:..."

# 4. Re-run pipeline test stage (score reflects ignores)
/mb:pipeline .modelbound/prompt-pr-contributor.md --stage test_optimize
```

Or via CLI:

```bash
modelbound context set --repo org/repo
modelbound sync --file .modelbound/prompt-pr-contributor.md
modelbound findings list --skill .modelbound/prompt-pr-contributor.md
modelbound findings ignore --skill ... --key "..."
modelbound pipeline run --skill ... --stage test_optimize
```
