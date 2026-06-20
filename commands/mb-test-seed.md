---
description: Seed test case + pipeline body snapshot for a new skill
argument-hint: --skill <file>
allowed-tools: Bash(npx:*)
---

Run: `npx -y modelbound test seed --skill $ARGUMENTS`

Creates a test case, runs test_optimize pipeline (body snapshot), and reports skill UUID + test case ID.
