---
description: Run ModelBound token optimization on a skill or file. Add --apply to save a new version.
argument-hint: <slug|path> [--apply] [--strategy balanced|aggressive|structure-only]
allowed-tools: Bash(npx:*)
---

Run: `npx -y @modelbound/cli optimize $ARGUMENTS`

If the user did not pass `--apply`, summarize the diff and ask whether to apply.
If they passed `--apply`, report the new version ID and token savings.
