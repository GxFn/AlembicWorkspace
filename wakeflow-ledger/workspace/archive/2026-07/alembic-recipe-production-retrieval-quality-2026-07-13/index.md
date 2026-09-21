# alembic-recipe-production-retrieval-quality-2026-07-13 — 统一冷启动、增量、模块扫描、知识提交四类 Recipe 生产能力，建立 evidence-grounded retrieval profile/readiness 与安全索引代际，并清理历史创建/自动发布旁路。

> State-root index. Generated from wakeflow-state.json (revision 3, event evt-20260713105115-0003). Regenerate with wakeflow-render-progress; do not hand-edit.

## Core records

- [demand.json](demand.json) — immutable demand record
- [wakeflow-state.json](wakeflow-state.json) — authoritative state machine (state: planned, revision 3)
- [controller-events.jsonl](controller-events.jsonl) — append-only controller event log
- [projection.json](projection.json) — machine-readable projection + structured slices
- [developer-progress.md](developer-progress.md) — human progress document

## Task packages

- `p1-core-recipe-retrieval-production-generation-p1` (pending) — Implement the complete AlembicCore producer foundation for the confirmed Recipe production/retrieval-quality requirement, starting from clean baseline d17db939ed49ea30bdbf380f400b783530b6d6a8 and returning one clean Core commit.

Required connected implementation:
1. Add the additive, Recipe-embedded retrieval profile contract across KnowledgeEntry/domain, Markdown serialization, SQLite/API wire and public exports. Preserve old Recipes through a versioned compatibility projector; do not add a separate retrieval database or state machine. Profile semantics must include schema version, project-primary summary, evidence-grounded technical English summary/concepts/scenarios/exclusions, field/source provenance and deterministic content hashes.
2. Implement deterministic RetrievalReadiness and connect it to the real Recipe production/persistence/publish path, not an unused facade. pending/staging may retain repairable violations; every active transition uses the same readiness result. Provider availability, vector state, query ranks and frozen acceptance queries must be absent from hard readiness inputs. Include at least one real in-test production consumer through persistence and projection.
3. Replace conflicting sparse/dense Recipe material with one RecipeRetrievalDocumentSet projector: required intent plus information-dense, non-duplicate optional guidance/implementation/rationale roles. Raw paths, evidence IDs, quality bookkeeping and bridge metadata are provenance only. Sparse and dense serialize/weight the same facts and hashes. Retire fixed nine-region active Recipe candidate generation and prevent generic entry vectors from competing as a second Recipe representation, while preserving accepted KnowledgeRetrievalPort, truth projection, refill, raw lane evidence and query-side reader-only boundaries.
4. Make lifecycle derivation identical for knowledge events, incremental maintenance and full build. Add generation manifest identity covering projection schema/provider/model/dimension/format/corpus; exact per-Recipe expected IDs; detection/repair planning for orphan, missing, partial, duplicate, hash mismatch and stale generation; provider-independent delete/deprecate cleanup; verified replacement; shadow build, atomic active switch and rollback. A failed build must leave the old generation queryable. No query-time projector persistence, reconcile, rebuild or writer construction.
5. Preserve compatibility for existing Core and outer consumers through stable package exports and explicit diagnostics. Exact TypeScript shape may adapt only within confirmed semantics.

Required RED/GREEN evidence:
- profile Markdown/domain/SQLite/API round-trip without field loss;
- ungrounded/default/whole-file code evidence produces stable readiness violations and cannot publish active;
- provider offline yields the same readiness decision;
- compatibility projection never invents English facts;
- projector emits required/distinct roles and sparse+dense share source/profile/document hashes;
- incremental and full derivation are byte-equivalent for the same Recipe;
- same-dimension model or projection-schema changes require a new generation;
- exact reconcile catches orphan/missing/partial/duplicate/stale-generation fixtures;
- update verifies full replacement before old removal; delete works without provider;
- failed shadow build preserves active generation and rollback restores it;
- public Search/Prime/Recipe retrieval call graphs remain reader-only and existing truth/refill tests pass.

Repository gates and return:
- run focused tests, npm run test, npm run build:check, npm run build, npm run lint and npm run check as applicable under repository rules, plus Core delivery/tool/Codex/package boundary tests;
- review git diff/check, public exports, migrations and compatibility;
- two-stage self-review: requirement compliance, then correctness/failure paths/performance/maintainability;
- commit only AlembicCore, return exact parent/commit, changed files/symbols, raw command summaries, compatibility notes and residual risks.

Explicit non-goals: no AlembicAgent/AlembicPlugin/Alembic/AlembicDashboard edits; no real BiliDili/AlembicWorkspace data access or mutation; no query weighting/rank tuning, hardcoded query/Recipe ID/global synonyms, model replacement, Test work, Graph/Recipe Map changes, Plugin↔Alembic coupling, Git/host/role/knowledge-status gates, query-time maintenance or empty type-only contracts.

## Target tasks

- `p1-core-recipe-retrieval-production-generation-t1` -> window `AlembicCore` (pending)

## Sub-directories

- [task-packages/](task-packages/)
- `target-results/` — _(not present)_
- `transition-candidates/` — _(not present)_
- `intake/` — _(not present)_
- `test-cards/` — _(not present)_
- `evidence/` — _(not present)_
- `focus/` — _(not present)_
