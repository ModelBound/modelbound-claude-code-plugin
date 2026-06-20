---
description: Create a saved test case for a skill
argument-hint: --skill <file> --name "<name>" --prompt "<text>"
allowed-tools: Bash(npx:*)
---

Run: `npx -y modelbound test create $ARGUMENTS`

Confirm the returned test case ID. Suggest `modelbound test run --skill ...` or `modelbound test seed` for a full setup.
