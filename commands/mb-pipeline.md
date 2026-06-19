---
description: Run the Skill Development Pipeline (Test & Optimize)
argument-hint: <skill-file> [--stage test_optimize|production|full]
allowed-tools: Bash(npx:*)
---

Parse `$ARGUMENTS` as skill file path plus optional flags. Run:

`npx -y modelbound pipeline run --skill <file> [flags]`

Use `--stage test_optimize` for Trust & Safety + test stage only. Summarize stage results; if any failed, list findings and propose fixes.
