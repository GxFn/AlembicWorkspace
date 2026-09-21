# recipe-coldstart-production-quality-v2-2026-07-31 — Recipe 冷启动生产质量 V2：从 AlembicAgent 同 run strict-test 回执链继续

> State-root index. Generated from wakeflow-state.json (revision 3, event evt-20260731162343-0003). Regenerate with wakeflow-render-progress; do not hand-edit.

## Core records

- [demand.json](demand.json) — immutable demand record
- [wakeflow-state.json](wakeflow-state.json) — authoritative state machine (state: planned, revision 3)
- [controller-events.jsonl](controller-events.jsonl) — append-only controller event log
- [projection.json](projection.json) — machine-readable projection + structured slices
- [developer-progress.md](developer-progress.md) — human progress document

## Task packages

- `v2-agent-same-run-strict-test-receipt-p1` (pending) — 修复 AlembicAgent 真实成功管线与 canonical execution receipt 的断裂，保留现有主链，不新增第二条 Agent pipeline。

## Target tasks

- `v2-agent-same-run-strict-test-receipt-t1` -> window `AlembicAgent` (pending)

## Sub-directories

- [task-packages/](task-packages/)
- `target-results/` — _(not present)_
- `transition-candidates/` — _(not present)_
- `intake/` — _(not present)_
- `test-cards/` — _(not present)_
- `evidence/` — _(not present)_
- `focus/` — _(not present)_
