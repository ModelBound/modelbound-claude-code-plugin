---
description: Count tokens across .claude/ and flag over-budget files
---

Tallies tokens per file and per bucket (system, skills, rules), comparing against your team's configured thresholds.

!`node ${CLAUDE_PLUGIN_ROOT}/dist/tokens.js`
