# strict-test-split-removal-2026-08-03 — 移除被否决的独立 strict-test-dimension 实现

> State-root index. Generated from wakeflow-state.json (revision 6, event evt-20260803144634-0006). Regenerate with wakeflow-render-progress; do not hand-edit.

## Core records

- [demand.json](demand.json) — immutable demand record
- [wakeflow-state.json](wakeflow-state.json) — authoritative state machine (state: planned, revision 6)
- [controller-events.jsonl](controller-events.jsonl) — append-only controller event log
- [projection.json](projection.json) — machine-readable projection + structured slices
- [developer-progress.md](developer-progress.md) — human progress document

## Task packages

- `rollback-strict-test-main-p1` (pending) — 移除 Alembic Main 中被否决的独立 strict-test-dimension 私有管线和公开 API
- `rollback-strict-test-dashboard-p1` (pending) — 移除 Dashboard 中被否决的 strict-test-dimension 消费者并保持冷启动入口 fail closed
- `rollback-strict-test-agent-p1` (pending) — 移除 Agent 中被否决的 strict-test-dimension receipt 与执行集成
- `rollback-strict-test-core-p1` (pending) — 移除 Core 中被否决的 strict-test-dimension 自动选择 profile/receipt 基础

## Target tasks

- `rollback-strict-test-main-t1` -> window `Alembic` (pending)
- `rollback-strict-test-dashboard-t1` -> window `AlembicDashboard` (pending)
- `rollback-strict-test-agent-t1` -> window `AlembicAgent` (pending)
- `rollback-strict-test-core-t1` -> window `AlembicCore` (pending)

## Sub-directories

- [task-packages/](task-packages/)
- `target-results/` — _(not present)_
- `transition-candidates/` — _(not present)_
- `intake/` — _(not present)_
- `test-cards/` — _(not present)_
- `evidence/` — _(not present)_
- `focus/` — _(not present)_
