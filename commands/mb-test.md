---
description: Run the test suite for a skill.
argument-hint: <skill> [--version <id>] [--model <name>]
allowed-tools: Bash(npx:*)
---

Run: `npx -y @modelbound/cli skill test $ARGUMENTS`

Report pass rate, token usage, and cost. If any assertions failed, show which ones and propose a fix.
