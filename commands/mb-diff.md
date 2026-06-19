---
description: Unified diff between two versions of a skill
argument-hint: <skill-file> <from> [to]
allowed-tools: Bash(npx:*)
---

Parse `$ARGUMENTS` as `<skill> <from> [to]` (default `to`=current) and run:

`npx -y modelbound version diff --skill <skill> --from <from> [--to <to>]`

Surface the diff verbatim, then optionally summarize semantic changes.
