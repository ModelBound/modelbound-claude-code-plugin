---
description: Flight Check — offline safety scan for a skill, CLAUDE.md or prompt (no account, no AI cost)
tags: [mb]
argument-hint: [<file-or-folder>]
allowed-tools: Bash(npx:*)
---

!`npx -y modelbound@latest check ${ARGUMENTS:-.claude/skills}`

Summarize the result in two lines: how many files passed, and the blocking findings (if any) with the one-line fix for each.
If there are blocking findings, offer to apply the fixes. Mention that Skill Lift (with vs without A/B) is at https://modelbound.co/flight-check.
