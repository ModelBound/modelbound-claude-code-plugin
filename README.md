# ModelBound for Claude Code

The official [ModelBound](https://modelbound.co) plugin for Claude Code — keep your team's skills, rules, and system prompts in sync; audit token cost; harden MCP/bash tool use; and run the Skill Development Pipeline without leaving the terminal.

## Why ModelBound?

Your skills, rules, and system prompts live in one place — ModelBound — and follow you wherever you work. Write a skill in Cursor, refine it in Claude Code, use it in VS Code with Copilot. No re-writing, no copy-paste between tools. When you switch editors or try a new AI assistant, your context is already there.

This means you get more out of every AI subscription you pay for. Instead of rebuilding your setup from scratch each time you move between tools, ModelBound keeps your library portable. One investment in good context pays off across every platform you touch.

For teams, it's the same story at scale: curate once, distribute everywhere. Everyone stays on the same page regardless of which editor or AI tool they prefer.

## Install

```bash
claude plugin marketplace add ModelBound/modelbound-claude-code-plugin
claude plugin install mb
```

Then sign in:

```
/mb:sign-in
```

## Commands

### Sync & governance
| Command | What it does |
|---|---|
| `/mb:sign-in` | Browser device-code auth against modelbound.co |
| `/mb:status` | Show signed-in user, active team, last sync |
| `/mb:sync-rules` | Pull team's rules/skills/system prompts into `./.claude/` |
| `/mb:push-skill <path>` | Push a local `SKILL.md` to your team library |
| `/mb:tree` | Print the team's AI resource hierarchy (platform → folder → files) |
| `/mb:skills [platform] [ai_type]` | List team skills, optionally filtered by `source_platform` and `ai_type` |

### Token economy
| Command | What it does |
|---|---|
| `/mb:tokens` | Count tokens in every file under `./.claude/`, flag over-budget vs team thresholds |
| `/mb:cost-estimate` | Per-session cost estimate across Sonnet / Opus / Haiku for current context size |
| `/mb:optimize <file>` | AI-compact a file via ModelBound; writes `<file>.optimized.md` for diff review |
| `/mb:tool-audit` | Rank installed MCP tools by token cost; recommend disables |

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
| `/mb:audit` | Scan `.claude/` + `.mcp.json` for leaked secrets, prompt-injection patterns, untrusted MCP URLs |
| `/mb:trust` | Score every local skill 0–100 via `@modelbound/skill-trust` heuristics |
| `/mb:mcp-verify` | HTTPS-only, allow-list, and SSRF-guard checks on configured MCP servers |

## Hooks (opt-in, ON by default)

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

## Links

- [Guide](https://modelbound.co/guides/claude-code-plugin)
- [ModelBound.co](https://modelbound.co)
- [Cursor / VS Code extension](https://github.com/ModelBound/modelbound-cursor-extension)

MIT licensed.
