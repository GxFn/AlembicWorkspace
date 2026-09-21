# alembic-retrieval-vector-projectcontext-architecture-mainline1-2026-07-13 — Archive Summary

- Title: 检索、向量与实时 ProjectContext 架构主线实现
- Archived: 2026-07-13T10:09:37.150Z — Demand completed at revision 32 after 5/5 task acceptance and independent controller verification. Archive now so later Recipe producer ranking optimization is handled separately and is not conflated with this closed Graph/Map and retrieval-architecture demand.
- Demand goal: 按已确认架构修复 BiliDili 宽泛英文查询召回，建立 Core 统一且可隔离的向量读写、混合检索与生命周期能力，并在 Plugin 实现 Graph/Recipe Map 共用、可取消、可续取、临时且只读的实时 ProjectContext build session。
- Completion definition: Core 先于 Plugin 验收：八条固定 BiliDili 英文查询稳定召回权威 Recipe <redacted>，且不硬编码同义词、不修改 Recipe；Core 提供 EmbeddingPort、VectorIndexReader/Writer、统一 KnowledgeRetrievalPort/候选/投影/refill 与 provider-independent VectorLifecycleCoordinator，查询链不持有写端口；Plugin 的 Search/Prime 使用同一检索语义，Graph 与 Recipe Map 共用按 canonical root/scope/source facts 指纹化的临时 ProjectContextBuildSession，支持 AbortSignal、120 秒 deadline、opaque continuation cursor、OS temp chunk 与终止/取消/错误/TTL 清理；不增加 Git/revision/checkpoint、host selection、role/Admin、intent、knowledge status 或可见性门禁；Controller 最后只读验证现有 AlembicWorkspace 与 BiliDili，DB/WAL/SHM/config/vector 指纹不变；不创建 Test 窗口。

## Provenance

- Design key: (none recorded)
- Source documents: (none recorded)

## Conclusion

- Completed 2026-07-13T10:09:13.347Z — All five target tasks are accepted. Core and Plugin architecture/integration are landed; controller dual-project public Graph/Recipe Map probes passed with deterministic pagination, shared fact sessions, complete repository coverage, zero duplicate/missing stable facts, bounded page sizes, clean terminal continuation, and unchanged DB/WAL/SHM/config/vector fingerprints. P5 restored the full Plugin unit suite with test-fixture-only schema compatibility. This completion explicitly does not claim the withdrawn eight-query Top-3 ranking gate: the user directed that ranking be deferred to later Recipe producer optimization and that current Graph/Map work be closed and archived first.
- Evidence: task-ledger revision 31: 5/5 target tasks accepted
- Evidence: AlembicCore commits 7ccddf2372ddaeac2dbcfc1f651157d753709cd7 and d17db939ed49ea30bdbf380f400b783530b6d6a8
- Evidence: AlembicPlugin commits cbcda68722daf14fd35ef688a98c40db9f4ba420, d26fe67b3b25c653fddcca517b27de04a90ed7af, and 79f46cda0a1325b5e5a32a8e629fbb822ca65fdc
- Evidence: .wakeflow-active/current/alembic-retrieval-vector-projectcontext-architecture-mainline1-2026-07-13/developer-progress.md
- Evidence: .wakeflow-active/current/alembic-retrieval-vector-projectcontext-architecture-mainline1-2026-07-13/target-results/tr-p4-plugin-graph-recipemap-real-acceptance-defects-t1.json
- Evidence: .wakeflow-active/current/alembic-retrieval-vector-projectcontext-architecture-mainline1-2026-07-13/target-results/tr-p5-plugin-search-fixture-schema-closure-t1.json
- Evidence: controller P5 rerun: focused 2 files/4 tests passed; full test:unit exit 0; build:check exit 0; post-test worktree clean

## Task Ledger

| Task | Window | Final | Decision | Dispatches | Reworks | Redesigns |
| --- | --- | --- | --- | --- | --- | --- |
| p1-core-retrieval-vector-projectcontext-architecture-t1 | AlembicCore | accepted | accept | 1 | 0 | 0 |
| p2-plugin-retrieval-vector-projectcontext-integration-t1 | AlembicPlugin | accepted | accept | 3 | 2 | 0 |
| p3-core-qwen-query-format-retrieval-quality-t1 | AlembicCore | accepted | accept | 2 | 1 | 0 |
| p4-plugin-graph-recipemap-real-acceptance-defects-t1 | AlembicPlugin | accepted | accept | 1 | 0 | 0 |
| p5-plugin-search-fixture-schema-closure-t1 | AlembicPlugin | accepted | accept | 1 | 0 | 0 |

## Test Cards

- (none)

## Where The Rest Lives

- Execution timeline: developer-progress.md (Task Packages / Backfill Summaries / Decisions And Append Log)
- Machine audit trail: controller-events.jsonl + wakeflow-state.json
- Un-redacted original: moved to .wakeflow-local/preserved/ (see archive-manifest.json originalPreservedAt)
