---
description: Check whether a ModelBound skill is cleared to run unattended
argument-hint: <skill-slug>
---

```bash
mb harness "$1"
```

Reports pass / warn / fail across the four harness pillars:

- **Context** — the right instructions, inside budget.
- **Permissions** — only the tools it needs, writes behind approval.
- **Guardrails** — sensitive capabilities and spend explicitly bounded.
- **Verification** — tests, evals and real-world reliability.

A failing gate means the skill is supervised only. The command lists what is
blocking and how to fix it, and exits non-zero so it can gate CI.
