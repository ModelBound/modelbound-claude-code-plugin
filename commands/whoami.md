# /mb:whoami

Show the currently signed-in ModelBound account and validate the stored API key against the cloud MCP server. Clears the key if the server rejects it so the next command knows to re-prompt for sign-in.

Run:
```
node ${CLAUDE_PLUGIN_ROOT}/dist/whoami.js
```
