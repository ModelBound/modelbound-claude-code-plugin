# /mb:eval
Native eval test suite (MCP). Same as `/mb-eval` but runs compiled plugin script directly.

```bash
node "$CLAUDE_PLUGIN_ROOT/scripts/eval.js" list
node "$CLAUDE_PLUGIN_ROOT/scripts/eval.js" create --name "..." --prompt "..."
node "$CLAUDE_PLUGIN_ROOT/scripts/eval.js" run --case <id> --output "..."
node "$CLAUDE_PLUGIN_ROOT/scripts/eval.js" results --case <id>
```

Requires `agent` scope on API key.
