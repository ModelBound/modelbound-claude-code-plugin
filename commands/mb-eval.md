---
description: Eval test suite — list, create, run, and view results for skill eval cases.
argument-hint: list|create|run|results [flags]
allowed-tools: Bash(npx:*), Bash(node:*)
---

Eval cases for skills. Prefer the plugin helper when running inside Claude Code:

```bash
node "$CLAUDE_PLUGIN_ROOT/dist/eval.js" $ARGUMENTS
```

Or via the same CLI as other `/mb-*` commands:

```bash
npx -y modelbound eval list
```

Examples:
- `/mb-eval list`
- `/mb-eval create --name "Case" --prompt "User asks…"`
- `/mb-eval run --case <id> --output "<actual output>"`
- `/mb-eval results --case <id>`
