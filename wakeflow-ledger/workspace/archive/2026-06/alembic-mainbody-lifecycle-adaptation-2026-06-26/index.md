# alembic-mainbody-lifecycle-adaptation-2026-06-26 — plan 作主体 AI Agent 正交前置组件(新 AgentProfile+runPlanAgent，方案 A)；coldStart 接线/deepMining 单 job 多轮/moduleMining per-cell fan-out/evolution 宿主接线(Core 零改)；PD-5 plan 硬 gate(失败 abort 不回退全量)；Core 补共享 applyPlanSelection 投影收敛 Plugin 双写；全 10 PD 闭合；A-F 全阶段代码级(§4b)。

> State-root index. Generated from wakeflow-state.json (revision 4, event evt-20260627015240-0004). Regenerate with wakeflow-render-progress; do not hand-edit.

## Core records

- [demand.json](demand.json) — immutable demand record
- [wakeflow-state.json](wakeflow-state.json) — authoritative state machine (state: planned, revision 4)
- [controller-events.jsonl](controller-events.jsonl) — append-only controller event log
- [projection.json](projection.json) — machine-readable projection + structured slices
- [developer-progress.md](developer-progress.md) — human progress document

## Task packages

- `w1-core-planselection-foundation-p1` (pending) — W1 Core foundation for alembic-mainbody-lifecycle-adaptation-2026-06-26. User confirmed A4: PlanSelection shape validation belongs in Core as shared assertPlanSelectionShape, not local Agent validation. Implement §4b B1-B3 plus A4 shape assertion in AlembicCore only: add pure applyPlanSelection(selection, options?) near service/planIntent/planIntent.ts, add assertPlanSelectionShape for thin PlanSelection shape only (generationStage valid, dimensions non-empty string[], scale.totalRecipeBudget>0; length===1 valid, length===0 invalid), export both through @alembic/core/plans. Preserve PD-1 no I/O/no planLedger/no DB/no await, PD-8 do not touch analyst/token budget semantics, keep unknown dimension reporting non-throwing for projection. Do not modify AlembicPlugin/Alembic/AlembicAgent/vendor. Run Node>=22 build:check and focused tests/exports proof; commit on main and return commit hash, changed files, validation output, downstream consumption notes, residual risks.
- `w1-main-evolution-host-wiring-p1` (pending) — W1 Alembic main F evolution host wiring for alembic-mainbody-lifecycle-adaptation-2026-06-26. Implement §4b F only in Alembic main repo: keep F1/F2/F5/F6 as reuse evidence, add EvolutionMaintenanceSweep in Alembic/lib/service/evolution mirroring Plugin tick-on-access/sweep shape but as daemon timerRegistry setInterval driver, and fix KnowledgeModule DecayDetector options to inject lifecycleStateMachine so scanAll can transition active->decaying. Preserve boundary: AlembicCore/src zero changes, no Plugin/Agent edits, no schema changes, no guard relaxation. Sweep must be bounded, idempotent, reentry guarded, timerRegistry-cleaned, and drive checkAndPromote/checkTimeouts/checkAndExecute/scanAll without changing Core judgments. Validate with Node>=22 build:check and focused tests/probes proving lifecycleStateMachine non-null/active->decaying transition, sweep non-zero on seeded due items, empty DB no fake status, timer cleanup, reactive rename/update path not broken. Commit on main and return commit hash, changed files, validation output, raw evidence paths, residual risks.

## Target tasks

- `w1-core-planselection-foundation-t1` -> window `AlembicCore` (pending)
- `w1-main-evolution-host-wiring-t1` -> window `Alembic` (pending)

## Sub-directories

- [task-packages/](task-packages/)
- [target-results/](target-results/) — _(not present)_
- [transition-candidates/](transition-candidates/) — _(not present)_
- [intake/](intake/) — _(not present)_
- [test-cards/](test-cards/) — _(not present)_
- [evidence/](evidence/) — _(not present)_
- [focus/](focus/) — _(not present)_
