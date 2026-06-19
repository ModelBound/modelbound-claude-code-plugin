# /mb-eval
Eval test suite. Usage: `/mb-eval list|create|run|results` with flags.

Runs `$CLAUDE_PLUGIN_ROOT/scripts/eval.js` (compiled from `scripts/eval.ts`).

Examples:
- `/mb-eval list`
- `/mb-eval create --name "Case" --prompt "User asks…"`
- `/mb-eval run --case <id> --output "<actual output>"`
- `/mb-eval results --case <id>`

Or via CLI:
```bash
npx -y @modelbound/cli eval list
```
