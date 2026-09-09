---
description: Report how a ModelBound skill performed, so it can be improved
argument-hint: <skill-slug> <worked|partial|failed> [note]
---

Record the outcome of using a skill. Run this once the task that used the skill
is finished — it is how skills get corrected.

```bash
mb report "$1" --verdict "$2" ${3:+--note "$3"}
```

Verdicts: worked | partial | failed.
Failure categories (pass with `--category`): ignored_rule, out_of_scope, wrong_tool, hallucinated, wrong_format, too_vague, other.

If the agent produced a bad output that is worth keeping as evidence, pipe it in:

```bash
cat bad-output.txt | mb report "$1" --verdict failed --paste
```

After reporting, repeat failures are grouped and diagnosed at
https://modelbound.co/skills/attention, where a minimal suggested edit and a
regression test wait for your approval.
