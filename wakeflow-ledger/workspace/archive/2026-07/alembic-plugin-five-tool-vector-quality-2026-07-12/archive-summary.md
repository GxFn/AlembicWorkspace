# alembic-plugin-five-tool-vector-quality-2026-07-12 — Archive Summary

- Title: AlembicPlugin 五工具向量默认能力与检索质量修复
- Archived: 2026-07-13T03:29:55.958Z — Archive the previously completed five-tool vector quality demand so the confirmed retrieval/vector/projectcontext architecture work can continue sequentially on the main fleet.
- Demand goal: Make the five AlembicPlugin knowledge tools genuinely high-quality on each explicit request project: local vector retrieval is a default local-first Plugin capability, public Search actually uses the real SearchEngine and honors retrieval modes, Prime reports the real retrieval lane, Graph ranks multi-term intent rather than common-token noise, Recipe Map reports stale references without duplicate noise, and Guard/precise structure behavior remains correct.
- Completion definition: 1) `vector.localEmbedding` defaults to local-first auto-detection enabled for new and config-absent Plugin projects; an explicit config/env opt-out still forces keyword-only, and absent Ollama/model degrades quickly and honestly without downloads, external cloud APIs, Alembic main, resident, daemon, or request blocking. 2) Public `alembic_search` routes search operations through the request-scoped read-only SearchEngine/vector snapshot, honors auto/keyword/semantic, preserves get/expand, returns bounded clean output with real route/diagnostic truth, and never writes the live DB/WAL/index. 3) On BiliDili, the conceptual SwiftPM module-isolation query returns the known Feature-isolation and layered-dependency Recipes through the public MCP tool; on AlembicWorkspace with no explicit localEmbedding config but available local Ollama/model, default auto-detection uses the vector lane. 4) Prime derives vector-used/keyword-fallback diagnostics from actual SearchEngine evidence; it must not emit `prime-vector-evidence-unavailable` merely because `regionEvidence` is empty. 5) Graph multi-term ranking rewards term coverage/specific identifiers so HostMcpServer/ProjectLocationService-intent results outrank generic `request` nodes while exact file-symbol queries remain correct. 6) Recipe Map deduplicates equivalent unresolved source-ref diagnostics and returns a bounded actionable reconciliation/rescan hint without mutating knowledge. 7) Guard continues to use project Recipes with complete explicit-file coverage. 8) AlembicPlugin owns one committed diff; focused tests, full unit/check/build/runtime-package/distribution/plugin verification, local plugin reload, restart, and controller direct dual-project five-tool validation pass. No Test window and no mutation/rescan of the real knowledge bases during acceptance.

## Provenance

- Design key: (none recorded)
- Source documents: (none recorded)

## Conclusion

- Completed 2026-07-13T02:45:07.217Z — All accepted P1-P10 implementation packages and the controller's post-restart dual-project live five-tool acceptance now satisfy the confirmed completion definition without mutating either real knowledge base.
- Evidence: AlembicPlugin commit be7bc058fcd188f38b48ee551f912377c2d19f1d
- Evidence: AlembicCore commit 6b7de17494bac4236822d8a0baaa61cc3b01b670
- Evidence: Plugin full test suite: 1553/1553 passed; focused five-tool suite: 38/38 passed
- Evidence: Controller live status/prime/search: explicit AlembicWorkspace and BiliDili roots resolved independently; vector route used with stale orphan candidates filtered
- Evidence: Controller live graph: exact HostMcpServer, ProjectLocationService, and BiliDili NetworkModule file-symbol truth; full repository coverage
- Evidence: Controller live recipe-map: Workspace bounded space/file mounts and BiliDili diagnostics/conservation returned with actionable next steps
- Evidence: Controller live guard: Workspace 2/2 complete and passed; BiliDili 2/2 complete with two honest IUO findings
- Evidence: Controller read-only proof: 10 database/WAL/SHM/config/vector-index fingerprints unchanged before and after five-tool calls

## Task Ledger

| Task | Window | Final | Decision | Dispatches | Reworks | Redesigns |
| --- | --- | --- | --- | --- | --- | --- |
| p1-plugin-five-tool-vector-quality-t1 | AlembicPlugin | accepted | accept | 2 | 1 | 0 |
| p2-core-filter-orphan-vector-search-t1 | AlembicCore | accepted | accept | 1 | 0 | 0 |
| p3-plugin-five-tool-truth-graph-drift-quality-t1 | AlembicPlugin | accepted | accept | 2 | 2 | 0 |
| p4-core-swiftpm-target-path-truth-t1 | AlembicCore | accepted | accept | 1 | 0 | 0 |
| p5-plugin-core-swiftpm-truth-integration-t1 | AlembicPlugin | accepted | accept | 2 | 1 | 0 |
| p6-plugin-public-guard-readonly-quality-t1 | AlembicPlugin | accepted | accept | 1 | 0 | 0 |
| p7-core-recipe-vector-lifecycle-consistency-t1 | AlembicCore | accepted | accept | 1 | 0 | 0 |
| p8-plugin-recipe-vector-maintenance-integration-t1 | AlembicPlugin | accepted | accept | 1 | 2 | 0 |
| p9-core-provider-independent-vector-removal-t1 | AlembicCore | accepted | accept | 1 | 1 | 0 |
| p10-plugin-provider-independent-authoritative-maintenance-t1 | AlembicPlugin | accepted | accept | 1 | 0 | 0 |

## Test Cards

- (none)

## Where The Rest Lives

- Execution timeline: developer-progress.md (Task Packages / Backfill Summaries / Decisions And Append Log)
- Machine audit trail: controller-events.jsonl + wakeflow-state.json
- Un-redacted original: moved to .wakeflow-local/preserved/ (see archive-manifest.json originalPreservedAt)
