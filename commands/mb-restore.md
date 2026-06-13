---
description: Restore a skill to a previous version (non-destructive — creates a new version on top of history).
argument-hint: <skill> <versionId>
allowed-tools: Bash(npx:*)
---

Run: `npx -y @modelbound/cli skill restore $ARGUMENTS`

Confirm the new version ID and remind the user no history was destroyed.
