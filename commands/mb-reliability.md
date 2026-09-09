---
description: Show which ModelBound skills work in real use and which need attention
argument-hint: [days]
---

```bash
mb reliability --days "${1:-30}"
```

Shows per-skill reliability (worked ÷ reported) over the window, with failure
and partial counts. Skills with fewer than three reports are shown as "too few
to score" rather than a misleading percentage.

Use it before picking a skill for an important task, and after applying a
suggested fix to confirm the fix held.
