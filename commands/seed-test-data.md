---
description: Seed a skill with a test case and pipeline body snapshot (for new skills)
tags: [mb]
argument-hint: <skill-file> [--repo org/repo]
---

Creates a saved test case via MCP `create_skill_test_case`, runs `test_optimize` pipeline (body snapshot), then verifies test + compare.

!`node ${CLAUDE_PLUGIN_ROOT}/dist/seed-test-data.js ${ARGUMENTS}`
