---
description: List team skills, optionally filtered by platform and ai_type
argument-hint: [platform] [ai_type]
---

Calls MCP `list_skills` with optional `source_platform` and `ai_type` filters and prints a markdown table including `repo` and `source_path`.

Examples:
- `/mb:skills` — all skills
- `/mb:skills claude-code` — only Claude Code resources
- `/mb:skills cursor rule` — only Cursor rules

!`node ${CLAUDE_PLUGIN_ROOT}/dist/skills.js ${ARGUMENTS}`
