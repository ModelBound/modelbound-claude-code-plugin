---
description: Profile every skill and rule in this repo — token footprint, loop risk, unsafe commands (offline, no account, no AI cost)
tags: [mb]
argument-hint: [<folder>]
allowed-tools: Bash(npx:*)
---

!`npx -y modelbound@latest scan ${ARGUMENTS:-.}`

Summarize in three lines: total tokens loaded, the heaviest skill and its share, and each blocking finding with its one-line fix.
Offer to slim the heaviest skill or fix blocking findings. To profile real runs (loops, failures, token burn), point to https://modelbound.co/connect.
