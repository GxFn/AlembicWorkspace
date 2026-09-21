# alembic-plugin-mcp-identity-recipe-gate-cleanup-2026-07-12 — Archive Summary

- Title: AlembicPlugin MCP 项目身份解耦与 Recipe Git 门禁删除
- Archived: 2026-07-12T09:48:02.803Z — Cancelled before execution because the user replaced the incomplete scope with a broader authoritative AlembicPlugin independence architecture.
- Demand goal: Make every AlembicPlugin MCP method depend only on its request-scoped projectRoot/current Codex workspace identity, with no influence from Alembic main selected/active project state; remove every MCP-consumer Git commit/checkpoint freshness gate so Recipe usability is decided only by Recipe-owned lifecycle, schema, sourceRefs and matching logic rather than repository HEAD alignment.
- Completion definition: 1) No AlembicPlugin MCP entrypoint, status, diagnostics, onboarding, projectRuntime, bootstrap/rescan response, Dashboard handoff, Prime/Search/Graph/Recipe Map/Guard path reads or reacts to Alembic selectedProject/activeProject state; explicit request projectRoot is the sole MCP project identity. 2) Public MCP outputs contain no host project mismatch/project_handoff_mismatch/handoffAllowed action caused by main-app selection. 3) Search, Graph, Recipe Map, Prime, Guard and Status do not read Git HEAD/checkpoint posture, emit sourceRevisionManifest/gitDiffCheckpoint freshness gates, downgrade otherwise valid results, block conclusions, or require rescan because commits differ. 4) Recipe-owned lifecycle/schema/sourceRefs/content rules remain authoritative; internal bootstrap/rescan producer-side incremental scanning may retain checkpoint storage but it is not a consumer validity gate. 5) Old assertions enforcing mismatch and revision degradation are removed/replaced with regression tests proving foreign selected/active state and advanced HEAD do not change MCP results. 6) Focused tests, exact full unit suite, check, build, runtime package, distribution and Codex plugin verification pass; local plugin is refreshed and controller real MCP readback after restart shows no mismatch or commit-freshness degradation.

## Provenance

- Design key: (none recorded)
- Source documents: (none recorded)

## Conclusion

- (no completion event found)

## Task Ledger

| Task | Window | Final | Decision | Dispatches | Reworks | Redesigns |
| --- | --- | --- | --- | --- | --- | --- |
| p1-plugin-remove-main-selection-and-git-consumer-gates-t1 | AlembicPlugin | pending | - | 0 | 0 | 0 |

## Test Cards

- (none)

## Where The Rest Lives

- Execution timeline: developer-progress.md (Task Packages / Backfill Summaries / Decisions And Append Log)
- Machine audit trail: controller-events.jsonl + wakeflow-state.json
- Un-redacted original: not needed (archive copy is complete)
