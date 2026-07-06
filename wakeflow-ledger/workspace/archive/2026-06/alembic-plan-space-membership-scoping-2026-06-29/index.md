# alembic-plan-space-membership-scoping-2026-06-29 — 删除所有 Alembic 中 workspace.config.json 代码逻辑、把原生 ProjectScope（~/.asd/project-scopes.json）提升为前置（chokepoint=新增 fromProjectScopeRegistry，迁移 19 个 fromProject 站点）、插件在成员子仓调用时能拿整空间 Recipe、修复全 5 仓项目空间使用逻辑；§11 权威设计 + §12 代码级分阶段实现指南（P0-P4 + 每阶段可运行验收 + 真机 ecf32806）。最危险纪律：写侧 /tmp 碰撞 + 删除硬门。

> State-root index. Generated from wakeflow-state.json (revision 2, event evt-20260629030636-0002). Regenerate with wakeflow-render-progress; do not hand-edit.

## Core records

- [demand.json](demand.json) — immutable demand record
- [wakeflow-state.json](wakeflow-state.json) — authoritative state machine (state: intake, revision 2)
- [controller-events.jsonl](controller-events.jsonl) — append-only controller event log
- [projection.json](projection.json) — machine-readable projection + structured slices
- [developer-progress.md](developer-progress.md) — human progress document

## Task packages

_None yet._

## Target tasks

_None yet._

## Sub-directories

- [task-packages/](task-packages/) — _(not present)_
- [target-results/](target-results/) — _(not present)_
- [transition-candidates/](transition-candidates/) — _(not present)_
- [intake/](intake/) — _(not present)_
- [test-cards/](test-cards/) — _(not present)_
- [evidence/](evidence/) — _(not present)_
- [focus/](focus/) — _(not present)_
