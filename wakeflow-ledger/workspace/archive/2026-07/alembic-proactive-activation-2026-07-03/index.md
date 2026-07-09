# alembic-proactive-activation-2026-07-03 — 推进 Alembic 激活链主动化：安装引导、冷启动建议、四工具 prime/search/recipe_map/graph 主动消费、双宿主加载与使用测量闭环；按 Design §10.6 P0-P4 严格阶段验收。

> State-root index. Generated from wakeflow-state.json (revision 10, event evt-20260707074408-0010). Regenerate with wakeflow-render-progress; do not hand-edit.

## Core records

- [demand.json](demand.json) — immutable demand record
- [wakeflow-state.json](wakeflow-state.json) — authoritative state machine (state: planned, revision 10)
- [controller-events.jsonl](controller-events.jsonl) — append-only controller event log
- [projection.json](projection.json) — machine-readable projection + structured slices
- [developer-progress.md](developer-progress.md) — human progress document

## Task packages

- `p0-plugin-cc-skill-discovery-usage-baseline-p1` (accepted) — P0 evidence gate for proactive activation: verify Claude Code project skill discovery path, implement/expose WS-1 session per-tool usage measurement, and capture true-machine baseline for prime/search/recipe_map/graph usage before proactive wording changes.
- `p1-plugin-consumption-wording-guidance-p1` (accepted) — P1 WS-4 proactive consumption wording and guidance: update three knowledge-tool descriptions with when-to-use/user-intent keywords, add prime-to-search routing, and add guidance/stagedProtocol consumption loop while preserving four-tool output schemas and non-goal text.

## Target tasks

- `p0-plugin-cc-skill-discovery-usage-baseline-t1` -> window `AlembicPlugin` (accepted)
- `p1-plugin-consumption-wording-guidance-t1` -> window `AlembicPlugin` (accepted)

## Sub-directories

- [task-packages/](task-packages/)
- [target-results/](target-results/)
- [transition-candidates/](transition-candidates/)
- [intake/](intake/)
- [test-cards/](test-cards/)
- [evidence/](evidence/)
- [focus/](focus/)
