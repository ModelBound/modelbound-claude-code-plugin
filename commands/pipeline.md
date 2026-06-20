---
description: Run the ModelBound Test & Optimize pipeline on a skill file
tags: [mb]
argument-hint: <skill-file> [--stage test_optimize|production|full]
---

Run the Skill Development Pipeline. Accepts a file path or slug — UUIDs are resolved internally via sync.

!`node ${CLAUDE_PLUGIN_ROOT}/dist/pipeline.js ${ARGUMENTS}`
