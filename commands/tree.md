---
description: Print the team's AI resource hierarchy (platform → folder → files) from ModelBound
---

Calls the MCP `get_resource_tree` tool and renders a compact ASCII tree so you can see every skill, rule, hook, steering file, and system prompt the team has — grouped by the platform that owns them (`.claude/skills`, `.cursor/rules`, `.kiro/steering`, …).

!`node ${CLAUDE_PLUGIN_ROOT}/scripts/tree.js`
