---
description: Report the run you just finished to ModelBound, tied to the skill you used
argument-hint: <skill-slug>
---

Summarise the task you just completed as a list of steps and call the
ModelBound MCP tool `report_run` with:

- `skill_id`: "$1"
- `name`: a short name for the task
- `steps`: for each step, `name`, `kind` (model / tool / retrieval),
  approximate `duration_ms` if known, `status` (ok / error) and an
  `error_category` for failed steps.

Do **not** include prompts, file contents, command output or arguments. Step
names and outcomes only. Then tell the user it was recorded and that it will
appear under **Live runs** on the skill.
