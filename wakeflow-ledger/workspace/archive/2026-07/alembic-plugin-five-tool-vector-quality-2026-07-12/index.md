# alembic-plugin-five-tool-vector-quality-2026-07-12 — AlembicPlugin 五工具向量默认能力与检索质量修复

> State-root index. Generated from wakeflow-state.json (revision 3, event evt-20260712125102-0003). Regenerate with wakeflow-render-progress; do not hand-edit.

## Core records

- [demand.json](demand.json) — immutable demand record
- [wakeflow-state.json](wakeflow-state.json) — authoritative state machine (state: planned, revision 3)
- [controller-events.jsonl](controller-events.jsonl) — append-only controller event log
- [projection.json](projection.json) — machine-readable projection + structured slices
- [developer-progress.md](developer-progress.md) — human progress document

## Task packages

- `p1-plugin-five-tool-vector-quality-p1` (pending) — Implement and commit one AlembicPlugin quality closure for the five knowledge tools.

Required fixes:
- Change local embedding from explicit opt-in to default local-first auto-detection. `resolveLocalEmbeddingConfig` and newly generated Plugin config must default enabled; explicit `ALEMBIC_LOCAL_EMBEDDING_ENABLED=0`, config `enabled:false`, or `laneOrder:keyword-only` remains authoritative. Do not package/download a model or call cloud providers. Probe the existing default local Ollama endpoint/model with a bounded timeout; unavailable service/model must immediately and honestly fall back to keyword.
- Replace public `alembic_search` search-operation table-list/all-token filtering with the already-created request-scoped read-only SearchEngine. Honor `mode=auto|keyword|semantic`, query, filters and budget/limit; keep get/expand bounded through the read-only repository. Project identity and read-only snapshot confinement stay intact. Output must distinguish real semantic/vector use, keyword fallback, zero match, and unavailable vector lane without leaking internal/raw provider data.
- Carry actual SearchEngine route evidence through PrimeSearchPipeline and build Prime diagnostics from it. Delete the false rule that equates empty regionEvidence with unavailable vector; retain semantic-region evidence as a separate signal if useful.
- Improve Plugin ProjectGraphProvider ranking: normalize CamelCase/specific identifiers, reward multi-term coverage/rare or specific term matches, and prevent one common term such as `request` from filling the top results ahead of HostMcpServer/ProjectLocationService matches. Do not turn Graph into semantic knowledge search or claim source-of-truth.
- Deduplicate Recipe Map diagnostics for equivalent path anchors such as `:330` and `:330-330`; add a bounded nextAction explaining source-ref reconciliation/rescan when unresolved/stale refs exist. Query remains read-only and must not repair live knowledge.
- Preserve Guard semantics, exact graph/file queries, Recipe Map conservation counts, all public schema/output projection gates, request-scoped roots, no-KB truthful results, no revision/host/admin/intent gates, and no main/resident/daemon coupling.

Required evidence and validation:
- RED/GREEN tests proving current public semantic Search zero-result bug despite underlying vector success, then public success through SearchEngine.
- Tests for config absent => auto-detect enabled; explicit disable => no probe/keyword; Ollama absent/model absent => bounded keyword degrade; Ollama available => vector.
- Prime vector-used and keyword-fallback diagnostic tests based on real route evidence.
- Graph ranking fixture with HostMcpServer/ProjectLocationService/request terms and Recipe Map duplicate diagnostic fixture.
- Read-only snapshot/WAL/index hash or fingerprint proof before/after.
- Focused tests, full `npm run test:unit`, `npm run check`, `npm run build`, `npm run verify:codex-runtime-package`, `npm run verify:plugin-distribution`, `npm run verify:codex-plugin`, and canonical local reload on exact final commit.
- Return final commit, touched files/symbols, representative public JSON for both roots/modes, route diagnostics, no-write proof, two-stage self-review, and any honest residual limits. No Test dispatch.

## Target tasks

- `p1-plugin-five-tool-vector-quality-t1` -> window `AlembicPlugin` (pending)

## Sub-directories

- [task-packages/](task-packages/)
- `target-results/` — _(not present)_
- `transition-candidates/` — _(not present)_
- `intake/` — _(not present)_
- `test-cards/` — _(not present)_
- `evidence/` — _(not present)_
- `focus/` — _(not present)_
