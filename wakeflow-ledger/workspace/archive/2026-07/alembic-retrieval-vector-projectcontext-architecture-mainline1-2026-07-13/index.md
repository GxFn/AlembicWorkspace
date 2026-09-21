# alembic-retrieval-vector-projectcontext-architecture-mainline1-2026-07-13 — 检索、向量与实时 ProjectContext 架构主线实现

> State-root index. Generated from wakeflow-state.json (revision 3, event evt-20260713033056-0003). Regenerate with wakeflow-render-progress; do not hand-edit.

## Core records

- [demand.json](demand.json) — immutable demand record
- [wakeflow-state.json](wakeflow-state.json) — authoritative state machine (state: planned, revision 3)
- [controller-events.jsonl](controller-events.jsonl) — append-only controller event log
- [projection.json](projection.json) — machine-readable projection + structured slices
- [developer-progress.md](developer-progress.md) — human progress document

## Task packages

- `p1-core-retrieval-vector-projectcontext-architecture-p1` (pending) — Implement one combined AlembicCore producer package for the confirmed retrieval/vector/ProjectContext architecture.

Required implementation:
- Add an EmbeddingPort with embedQuery/embedDocuments and an explicit provider/model/dimension descriptor; adapt existing providers without exposing provider details to callers.
- Split VectorIndexReader from VectorIndexWriter. Query/search/Prime/RecipeContext construction may depend only on the reader. Indexing, reconcile and lifecycle maintenance own the writer.
- Introduce canonical KnowledgeRetrievalCandidate, HybridCandidateRetriever, KnowledgeTruthProjector and bounded refill. Make Search, Prime and RecipeContext use the same KnowledgeRetrievalPort semantics.
- Preserve raw dense, sparse and RRF contribution evidence; remove per-page max normalization that makes broad English ranking unstable.
- Evolve SyncCoordinator into provider-independent VectorLifecycleCoordinator while retaining a compatibility facade for existing consumers. Removal/cleanup must not require embedding availability; live replacement remains safe.
- Extend ProjectContext execution with an optional non-serialized AbortSignal request option so Plugin can enforce real cancellation without changing persisted/public schemas.
- Add deterministic tests for the fixed eight-query BiliDili-style matrix and authoritative Recipe id <redacted> using fixtures at Core seams; do not hardcode query synonyms or edit Recipe content.

Compatibility and non-goals:
- Preserve current public consumers and existing source-truth/refill/filter behavior.
- No Plugin, Alembic main, Test, vendor, release, real knowledge data, Git/revision/checkpoint, host-project, role/Admin, intent, knowledge-state or tool-visibility changes.
- No query-time writes and no provider-specific policy leaking into retrieval contracts.

Required evidence:
- Commit only AlembicCore.
- Focused RED/GREEN tests for reader/writer isolation, shared Search/Prime retrieval parity, refill/truth projection, raw score contribution stability, provider-independent lifecycle removal, cancellation, and eight-query ranking.
- Full Core unit suite, typecheck/check, build, exact changed files/symbols and compatibility review.
- Two-stage self-review: requirement compliance, then code quality/failure paths/performance.
- Return the exact commit for Plugin consumption.

## Target tasks

- `p1-core-retrieval-vector-projectcontext-architecture-t1` -> window `AlembicCore` (pending)

## Sub-directories

- [task-packages/](task-packages/)
- `target-results/` — _(not present)_
- `transition-candidates/` — _(not present)_
- `intake/` — _(not present)_
- `test-cards/` — _(not present)_
- `evidence/` — _(not present)_
- `focus/` — _(not present)_
