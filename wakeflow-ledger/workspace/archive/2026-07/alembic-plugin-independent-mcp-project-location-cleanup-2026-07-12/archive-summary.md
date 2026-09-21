# alembic-plugin-independent-mcp-project-location-cleanup-2026-07-12 — Archive Summary

- Title: AlembicPlugin 独立 MCP 与单一项目定位清理
- Archived: 2026-07-12T12:38:44.580Z — Archive completed AlembicPlugin independent MCP project-location cleanup after controller-owned post-restart dual-project five-tool acceptance.
- Demand goal: Make AlembicPlugin MCP fully independent from the Alembic main application and runtime selection. Every call uses exactly one request-scoped projectRoot/ghost/dataRoot/database locator; public tools are always visible and return tool-native empty/not-found results when knowledge is absent, with no host state, revision, intent, role or availability gate blocking project knowledge queries.
- Completion definition: 1) No AlembicPlugin MCP production path reads or reacts to Alembic main selected/active/runtime-control, resident/daemon availability, handoff or cross-project fallback. 2) One project-location service is the sole resolver of projectRoot/projectId/ghost/dataRoot/databasePath/databaseExists and all consumers use it. 3) All public MCP tools are always listed/callable; missing database/knowledge/match returns truthful tool-native empty/not-found/unavailable results without auto-init, visibility/prebootstrap/readiness gates or repair choreography. 4) alembic_task and old daemon-bridge residue are absent from production/public contracts. 5) Status and five knowledge tools have zero Git revision/checkpoint consumer gates or fields; Git checkpoint remains only in proven Recipe evolution maintenance consumers. 6) Prime has no intent admission or required intent frame and no host-level trust/readiness gate that suppresses queryable Recipe/Guard material. 7) Admin/tier/role visibility machinery is removed and there is one ordinary tool surface. 8) Plugin write provenance uses one canonical actual producer source without the duplicate legacy normalizer or caller spoofing. 9) Centralized project/data-root confinement and explicit write/destructive protections remain; no per-tool duplicate identity policy or cross-project fallback remains. 10) Focused tests, full unit/check/build/runtime/distribution/plugin verification pass; AlembicPlugin owns and commits the complete diff; controller reviews raw evidence, refreshes the local plugin, and directly runs real five-tool calls for explicit AlembicWorkspace and BiliDili roots after restart, with no Test window.

## Provenance

- Design key: (none recorded)
- Source documents: (none recorded)

## Conclusion

- Completed 2026-07-12T12:38:13.138Z — All AlembicPlugin tasks are accepted and the controller-owned post-restart real-project acceptance loop is complete. In the restarted Codex host, request-scoped alembic_status resolved AlembicWorkspace to projectId ecf32806/dataRoot workspace ecf32806 and BiliDili to projectId 02a25032/dataRoot workspace 02a25032, both with existing databases and no host-selection mismatch, revision gate, role gate, intent admission, transport close, or cross-project fallback. The controller directly called the five knowledge tools against both explicit roots: Prime returned project-specific knowledge; Recipe Map returned Alembic/Plugin mounts for AlembicWorkspace and Swift/iOS mounts for BiliDili; Search returned exact direct Recipe matches in both roots; Graph exact-file queries returned HostMcpServer and AppDelegate symbols with complete repo coverage; Guard checked one AlembicPlugin TypeScript file and two BiliDili Swift files with complete file coverage, applicable project Recipes, and zero violations. Honest quality limits remain visible but do not block tool usability: BiliDili reports some unresolved legacy source refs, vector-unavailable concept search has weak recall until using an exact map/title/ref, and broad free-text graph ranking can be noisy while exact file queries are ready. No knowledge data was mutated and no Test window was used.
- Evidence: AlembicPlugin commit 981d5e449af2a41a368faf82dd71636447f71ab5
- Evidence: AlembicPlugin/scratch/codex-plugin-dev-reload-probe-report.json
- Evidence: controller-direct-runtime:alembic_status:AlembicWorkspace+BiliDili:2026-07-12
- Evidence: controller-direct-five-tool:alembic_prime+alembic_recipe_map+alembic_search+alembic_graph+alembic_code_guard:AlembicWorkspace+BiliDili:2026-07-12

## Task Ledger

| Task | Window | Final | Decision | Dispatches | Reworks | Redesigns |
| --- | --- | --- | --- | --- | --- | --- |
| p1-plugin-independent-mcp-project-location-cleanup-t1 | AlembicPlugin | accepted | accept | 4 | 3 | 0 |
| p2-plugin-deferred-request-root-bootstrap-t1 | AlembicPlugin | accepted | accept | 1 | 0 | 0 |

## Test Cards

- (none)

## Where The Rest Lives

- Execution timeline: developer-progress.md (Task Packages / Backfill Summaries / Decisions And Append Log)
- Machine audit trail: controller-events.jsonl + wakeflow-state.json
- Un-redacted original: moved to .wakeflow-local/preserved/ (see archive-manifest.json originalPreservedAt)
