---
name: alembic-workspace-control
description: Use when working inside AlembicWorkspace on TODO / Backlog intake, Design handoff intake, idle-window scheduling, window coverage, task-package dispatch, producer/consumer sequencing, or unified dispatch prompts. This skill supplements AGENTS.md and must not override its hard boundaries.
---

# Alembic Workspace Control

This skill holds detailed AlembicWorkspace control-center procedures that are too bulky to keep fully resident in `AGENTS.md`.

## Scope

Use this skill after reading:

1. `AGENTS.md`
2. `docs/workspace/index.md`
3. `docs/workspace/current/workspace-current-status.md`
4. the current workspace control document

This skill may guide workspace documentation, TODO intake, dispatch planning, and validation. It must not authorize product implementation in AlembicWorkspace, direct real-project testing, or bypass the current mainline.

## References

- Read [references/todo-backlog.md](references/todo-backlog.md) when creating, adjusting, rolling, accepting, canceling, prioritizing, or dispatching TODO / Backlog items.
- Read [references/window-dispatch.md](references/window-dispatch.md) when preparing a wave, task package, window coverage table, producer / consumer sequence, unified dispatch prompt, or send/no-send decision.
- Read [references/script-pipeline.md](references/script-pipeline.md) when auditing workspace scripts, choosing validation commands, syncing repeated control-plan surfaces, refreshing Design handoff intake, or maintaining script tests / documentation.

## Non-Negotiables

- `AGENTS.md` remains the hard boundary source. If this skill and `AGENTS.md` differ, follow the stricter rule.
- `AlembicDesign` signal / handoff is input to total control, not an execution plan.
- `AlembicTest` owns real project verification, cold-start, repro, smoke, regression, and test evidence.
- A TODO or task package must serve the user goal and current completion definition; it must not become a reason to create empty work.
- Dispatch prompts must keep the `AGENTS.md` read requirement and current-window / target-repository positioning declaration.

## Minimal Workflow

1. Classify whether the task is TODO intake, TODO rolling, wave dispatch, task-package planning, or prompt generation.
2. Load only the matching reference file.
3. Update the current workspace plan, `global-todo-board`, `alembic-test-exchange`, or Design inbox only when that is the correct ledger.
4. Run the workspace validation commands required by `AGENTS.md` and the current plan.
