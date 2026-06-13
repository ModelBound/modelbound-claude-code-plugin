---
description: Head-to-head benchmark of two skill versions (tokens, cost, pass rate, latency).
argument-hint: <skill> <versionA> <versionB>
allowed-tools: Bash(npx:*)
---

Parse the three positional arguments from `$ARGUMENTS` as `<skill> <a> <b>` and run:
`npx -y @modelbound/cli skill benchmark <skill> --a <a> --b <b>`

Summarize the winner and the trade-off (e.g. "B saves 18% tokens for 1% lower pass rate").
