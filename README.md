# ModelBound — Claude Code plugin

Run ModelBound's token optimization and Skill Development Pipeline from inside Claude Code, no browser round-trip required. Wraps the `@modelbound/cli` so every command works exactly the same as in your terminal and CI.

## Install

```bash
# In Claude Code
/plugin install ModelBound/modelbound-claude-code-plugin
mb-login    # one-time device-code auth
```

Requires Node ≥ 20 and either `MODELBOUND_API_KEY` or a one-time `/mb login`.

## Slash commands

| Command | What it does |
|---|---|
| `/mb-optimize <file\|skill>` | Run token optimization. Add `--apply` to save a new version. |
| `/mb-pipeline <skill>` | Full Skill Development Pipeline (lint → trust → test → benchmark → optimize). |
| `/mb-test <skill>` | Run the test suite (optional `--model`). |
| `/mb-benchmark <skill> <verA> <verB>` | Head-to-head benchmark. |
| `/mb-versions <skill>` | List versions, newest first. |
| `/mb-restore <skill> <versionId>` | Restore (non-destructive — creates a new version). |
| `/mb-diff <skill> <from> [to]` | Unified diff between versions. |
| `/mb-health` | Check API connectivity + auth. |
| `/mb-login` / `/mb-logout` / `/mb-whoami` | Auth shortcuts. |

## Pre-edit backup hook

A `PreToolUse` hook on `Edit` / `MultiEdit` / `Write` snapshots any skill file (`**/skills/**`, `**/.claude/skills/**`, `**/SKILL.md`, `**/.agents/skills/**`) to `.modelbound/backups/<timestamp>-<basename>` **before** Claude rewrites it. If an edit blanks out frontmatter or replaces a file with a placeholder, the backup is one `cp` away. The hook is silent on success and never blocks the edit.

Disable per-session with `MODELBOUND_DISABLE_BACKUP=1`.

## License

MIT
