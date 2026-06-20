# Known hosted-backend blockers

Last verified: 2026-06-20 against production MCP with `mb_live_*` key.

## Resolved (verified working)

| Issue | Status |
|-------|--------|
| Pipeline JWT / `_actor` forwarding | Fixed — `pipeline run --stage test_optimize` passes |
| Pipeline status `version` column | Fixed — `get_skill_pipeline_status` returns `version_before` / `version_after` |
| Benchmark / compare / suggest `Unauthorized` | Fixed — all three return results |
| `list_skill_findings` | Working — returns scores + findings array |

## Client-side fixes (this repo)

These were broken in the Claude Code plugin but did not require Lovable changes:

| Symptom | Fix |
|---------|-----|
| `Unknown tool: 'skills.syncToIde'` on `/mb:sync-rules` | Rewrote to `list_skills` + `get_skill` + workspace context |
| `Unknown tool: 'pipeline.status'` on `/mb:health` | Rewrote to `auth_whoami` + local token stats |
| `Optimizer returned no content` on `/mb:optimize` | Switched from `skills.optimize` to `optimize_content` |
| `test_case_id required` on `/mb:test` | Added `list_skill_test_cases` fallback |
| Plugin "Not signed in" with CLI token | Read `token` field from `~/.modelbound/config.json` |

## Still untested / monitor

All previously documented blockers verified working as of 2026-06-20, including `ignore_skill_finding` (tested with synthetic key).

## Deprecated MCP aliases (optional Lovable cleanup)

Hosted MCP no longer exposes some legacy dot-names used by older clients:

- `skills.syncToIde` → use `sync_skill_from_ide`
- `pipeline.status` → use `get_skill_pipeline_status`
- `skills.optimize` → alias to `optimize_content` exists in server code but clients should call `optimize_content` directly

Consider keeping aliases registered for backwards compatibility or documenting canonical snake_case names only.
