# Changelog

## 0.2.0 — 2026-06-13

### Added
- **Skill Development Pipeline** commands:
  - `/mb:pipeline <skill-id>` — run test → benchmark → optimize pipeline
  - `/mb:pipeline <skill-id> --dry-run` — preview pipeline stages and token cost
  - `/mb:test [skill-id]` — run skill tests or list recent test runs
  - `/mb:versions <skill-id>` — list saved checkpoints with scores
  - `/mb:restore <skill-id> <version-id>` — restore a skill to a checkpoint
  - `/mb:diff <skill-id> [from] [to]` — diff between versions
  - `/mb:health` — local token count + remote health scores and budgets
- **Pre-edit backup hook** — snapshots files to `.mb-backup/` before Edit/Write/MultiEdit (best-effort, silent on failure)

### Changed
- `hooks.json` now includes a `PreToolUse(Edit|Write|MultiEdit)` backup hook
