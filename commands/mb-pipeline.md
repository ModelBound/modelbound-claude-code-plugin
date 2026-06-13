---
description: Run the full Skill Development Pipeline (lint → trust → test → benchmark → optimize).
argument-hint: <skill> [--phases lint,trust,test,benchmark,optimize] [--wait]
allowed-tools: Bash(npx:*)
---

Run: `npx -y @modelbound/cli pipeline run $ARGUMENTS --wait`

Then summarize each phase's status. If any phase failed, list the findings and propose concrete next steps (edit a frontmatter field, rewrite a vague instruction, add a missing test, etc.).
