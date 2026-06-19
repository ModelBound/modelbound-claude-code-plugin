---
description: Restore a skill to a previous version (non-destructive)
argument-hint: <skill-file> <version>
allowed-tools: Bash(npx:*)
---

Parse `$ARGUMENTS` as `<skill> <version>` and run:

`npx -y modelbound version restore --skill <skill> --version <version>`

Confirm the new version ID and remind the user no history was destroyed.
