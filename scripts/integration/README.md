# Plugin integration tests

Runs **without** installing the plugin in Claude Code.

| Command | What it covers |
|---------|----------------|
| `npm test` | Build + structure validation + guard-bash smoke |
| `npm run test:e2e` | Full offline E2E (validate, all `mb-*` docs, hooks, backup) |
| `npm run test:e2e:full` | Build then E2E; cloud phases if `MODELBOUND_API_KEY` is set |

Cloud phase uses `npx -y modelbound@0.3.5` to mirror slash commands like `/mb-health`. Override with `PLUGIN_E2E_CLI_VERSION`.

Manual Claude Code check (optional): `/plugin install ModelBound/modelbound-claude-code-plugin` or `claude --plugin-dir $(pwd)`.
