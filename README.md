# ModelBound — Claude Code plugin

The official [ModelBound](https://modelbound.co) plugin for Claude Code — keep your team's skills, rules, and system prompts in sync; audit token cost; harden MCP/bash tool use; and run the Skill Development Pipeline without leaving the terminal.

## Why ModelBound?

Your skills, rules, and system prompts live in one place — ModelBound — and follow you wherever you work. Write a skill in Cursor, refine it in Claude Code, use it in VS Code with Copilot. No re-writing, no copy-paste between tools. When you switch editors or try a new AI assistant, your context is already there.

This means you get more out of every AI subscription you pay for. Instead of rebuilding your setup from scratch each time you move between tools, ModelBound keeps your library portable. One investment in good context pays off across every platform you touch.

For teams, it's the same story at scale: curate once, distribute everywhere. Everyone stays on the same page regardless of which editor or AI tool they prefer.

## Install

```bash
# In Claude Code
/plugin install ModelBound/modelbound-claude-code-plugin
mb-login    # one-time device-code auth
```

Requires Node ≥ 20 and either `MODELBOUND_API_KEY` or a one-time `/mb login`.

## Slash commands

### Skill Development Pipeline (Test & Optimize)
| Command | What it does |
|---|---|
| `/mb:pipeline <skill-id>` | Run test → benchmark → optimize pipeline on a skill |
| `/mb:pipeline <skill-id> --dry-run` | Preview pipeline stages and estimated token cost |
| `/mb:test [skill-id]` | Run skill tests; omit `skill-id` to list recent test runs |
| `/mb:versions <skill-id>` | List saved checkpoints with scores and labels |
| `/mb:restore <skill-id> <version-id>` | Restore a skill to a specific checkpoint |
| `/mb:diff <skill-id> [from] [to]` | Diff between two versions (defaults: latest vs current) |
| `/mb:health` | Local `.claude/` token count + remote health scores and budgets |

### Security
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

- **`SessionStart`** — runs `/mb:sync-rules` if you opted in; warns on drift
- **`PostToolUse(Edit)`** on `.claude/**` — auto-pushes edits to ModelBound
- **`PreToolUse(Edit|Write|MultiEdit)`** — snapshots files to `.mb-backup/` before editing (best-effort)
- **`PreToolUse(Bash)`** — blocks a configurable denylist (`rm -rf`, `curl | sh`)
- **`PreToolUse(WebFetch)`** — blocks private IP ranges and non-allow-listed domains

Disable any hook in `~/.modelbound/config.json`:

```json
{ "hooks": { "autoSync": false, "bashGuard": true, "webFetchGuard": true } }
```

## Subagents

- **`mb-reviewer`** — reviews diffs using your team's ReviewPanel rubric
- **`mb-context-doctor`** — diagnoses CLAUDE.md bloat, suggests Smart Split

## Config

Config lives at `~/.modelbound/config.json` (created on sign-in):

```json
{
  "apiKey": "mb_live_...",
  "activeTeamId": "uuid",
  "mcpUrl": "https://mcp.modelbound.co/mcp",
  "authUrl": "https://modelbound.co/api/extension-device-auth"
}
```

## Updating

```bash
claude plugin update modelbound
```

Disable per-session with `MODELBOUND_DISABLE_BACKUP=1`.

## License

MIT
