# PDR-0 Inventory Scan — AlembicPlugin Daemon Removal & Runtime Core Sync

- Demand: `alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18`
- Task package / target task: `pdr-0-inventory` / `PDR-0`
- Window: AlembicPlugin (read-only; no source change, no delete, no commit)
- Executed: 2026-06-19
- Repo HEAD at scan: `5e5b61d` (working tree clean)
- Method: file:line + grep evidence; decision-bearing items independently re-verified by this window.

Verdict legend: MATCH = design anchor matches current code; DIFF = mismatch/refinement noted.

## Build/Check Baseline (read-only, clean HEAD)

- `npx tsc --noEmit`: **PASS** (exit 0, 0 errors). Use as the green typecheck baseline for all later PDR phases.
- `npx biome check lib/ bin/ config/ scripts/`: **3 errors + 17 warnings, all pre-existing** at clean HEAD (no changes made this task). Composition: ~15 `noConsole` warnings in `scripts/*.mjs`; `noTemplateCurlyInString` at `lib/runtime/PluginRegistry.ts:68`; `noUnusedVariables` at `lib/runtime/runtime/ProjectRuntimeContext.ts:620`; import-sort/formatter errors. These are baseline noise; downstream phases must diff against this, not expect a clean biome.

## Section 1 — Inventory Verification (10 items)

### Item 1 — MCP tools call Core Service in-process, never via daemon — MATCH
- `lib/runtime/mcp/McpServer.ts:263-264` obtains in-process `ServiceContainer` via `getServiceContainer()`.
- Dispatch path: `_executeMcpHandler` → `_resolveHandler(name)` (~:400) → `wrapHandler(...)` (~:405) → `await wrapped(ctx, args)` (~:407); `ctx.container` is the in-process container (`get _ctx()` ~:211).
- `_resolveHandler` HANDLER_MAP (~:610-651) maps `alembic_prime`/`alembic_work`/`alembic_code_guard` (+ admin tools) straight to in-process Service handlers. No daemon hop on the four agent tools.

### Item 2 — `ensureEnhancementDaemon` is the unique daemon trigger — MATCH
- Whole-repo grep: only two occurrences of `ensureEnhancementDaemon`, both in `lib/runtime/mcp/HostMcpServer.ts` — the call at `:932` (inside `enqueueJob('bootstrap'|'rescan', ...)`) and the definition at `:1239`.
- The only daemon *start* is `this.supervisor.ensure({...})` inside `ensureEnhancementDaemon` (~:1284-1287); short-circuits (no start) when resident project-scope already ready.
- `openDashboard` (~:728) and `readJob` (~:1000) use only `supervisor.status()` (read) + local `JobStore` fallback — neither starts the daemon.

### Item 3 — daemon carrier split (Plugin deletable vs Core keep) — MATCH
- Plugin-side **deletable**: `lib/daemon/` (`DaemonSupervisor.ts`, `DaemonJobRunner.ts`); `bin/daemon-server.ts`; `lib/http/` (HttpServer.ts + 9 route files `auth,daemon,guard,health,jobs,knowledge,modules,search,skills` + 6 middleware `errorHandler,gatewayMiddleware,RateLimiter,requestLogger,sourceResolver,validate` + utils). (Design said "9 routes + middleware" — confirmed; ~21 files total in lib/http.)
- Core-side **must-keep** under `@alembic/core` (sibling `AlembicCore`, see Section 2-B; `vendor/AlembicCore/src/daemon/` mirrors): `JobStore`, `DaemonState` (+ helpers `resolveDaemonPaths`, `readDaemonState`), `ProjectRuntimeContracts`, `ResidentServiceContracts`, `RuntimeContracts`, job event/snapshot contracts.

### Item 4 — intent chain = four-tool shared intake, two halves — MATCH
- `buildIntentIntake` defined at `agent-public-tools.ts:932`; consumed by workStart `:468`, workFinish `:564`, codeGuard `:668`, and prime via `buildPrimeRequirementIntake` (`:224`, returns `ReturnType<typeof buildIntentIntake>`).
- (A) old paradigm present: `HostIntentFrame` interface `HostIntentFrame.ts:119-133`, `ResidentIntentHandoff` `:135-147`, `buildResidentIntentHandoff` `:196-284`, `buildHostIntentFrame` `:286`; `PrimeSearchPipeline.ts:120` builds residentIntentHandoff. `intentKind` set at agent-public-tools.ts `:962/1011/1018`.
- **`vectorPlan` confirmed DEAD** — constructed at `agent-public-tools.ts:972,1021`, zero reads anywhere.
- (B) `IntentExtractor.ts`: hardcoded EN↔CJK `SYNONYM_GROUPS` (`:69-143`) + multi-query `extract()` (`:152-172`) producing `queries`/`keywordQueries`. Consumed only by prime intake; **`alembic_search` uses raw query** via `resolveSearchQuery(args)` (`search.ts:~1468`) straight to SearchEngine — never calls IntentExtractor.
- (d) `alembic_intent` tool already removed; obsolete-input rejection remains (`resolvePrimeBlockingReason` ~:1170-1209, anchors 1174/1190).
- Session tracking: `bindWorkSession` (agent-public-tools.ts:~1817-1845, called ~:526) seeds intent (hostIntentFrame/lifecycle/prime*); `McpServer._trackSession` (`:427-468`) tracks active intent (toolCalls/searchQueries/mentionedFiles) + `_detectDrift`. All part of the intent paradigm → cleared in PDR-1③.

### Item 5 — governance Gateway live-path DEAD; two same-named gateways LIVE (keep) — MATCH (refinement: 31 actions, not "25+")
- DELETE target `lib/governance/gateway/` (`Gateway.ts`, `GatewayActionRegistry.ts`, `NoOpGateway.ts`):
  - `NoOpGateway.ts:6` self-comment: "no route uses the gateway middleware path".
  - **`ctx.gateway` grep = zero reads** by any handler (only injection writes).
  - `McpServer.ts`: `registerGatewayActions` (~:277-283), `ctx.gateway` injection (~:396 via `_resolveMcpGatewayMapping`, method ~:653-676); health probe `handlers/system.ts:55-61`.
  - `GatewayActionRegistry.ts` registers **31** actions (`grep -c gateway.register(` = 31), all dead on live path.
- KEEP (distinct services, actively called):
  - `EvolutionGateway` `.submit()` — `handlers/consolidate.ts:99,117,147`; `handlers/host-agent/evolve.ts:96,131,157`.
  - `RecipeProductionGateway` `.create()` — `handlers/tool-router.ts:230` (instantiated ~:221-228).

### Item 6 — ghost == dataRoot, no two-stage sync — MATCH
- `vendor/AlembicCore/src/shared/WorkspaceResolver.ts:120-128`: ghost mode sets `this.dataRoot = getGhostWorkspaceDir(projectId)`; non-ghost `dataRoot = projectRoot`.
- `getGhostWorkspaceDir` (`ProjectRegistry.ts:119-126`) → `~/.asd/workspaces/<projectId>`.
- `JobStore` ctor (`daemon/JobStore.ts:91-98`) takes `dataRoot` from `resolveDaemonPaths` (`daemon/DaemonState.ts:49-62` → `WorkspaceResolver.fromProject`), writes directly. No local→ghost two-stage sync exists (grep negative).

### Item 7 — bootstrap/rescan sync, NO phase-level progress persistence — MATCH
- Cold-start `runHostAgentColdStartWorkflow` (`lib/runtime/mcp/host-agent-workflows/cold-start.ts:69-195`) and rescan (`knowledge-rescan.ts:59-266`) run fully synchronous; no AI launched during sync.
- Intent self-built: `createHostAgentColdStartIntent` (`@alembic/core .../cold-start/ColdStartIntent.ts:84-101`) / `createHostAgentKnowledgeRescanIntent` (`.../knowledge-rescan/KnowledgeRescanIntent.ts:74-96`) — no `extractIntent`/IntentExtractor use → **PDR-1 (intent) and PDR-2 (bootstrap) independent**, confirmed.
- Progress persistence: intermediate phase state lives only in daemon memory `BootstrapTaskManager` (`lib/service/bootstrap/BootstrapTaskManager.ts:163` `#currentSession`); only job-level status + one-time completion result JSON persist. This is exactly the surface PDR-2 moves to a local temp cache.

### Item 8 — evolution dual-path (delete file-change monitor, keep git-commit opportunistic) — MATCH
- DELETE (needs resident loop): `lib/service/evolution/FileChangeHandler.ts` registered in `lib/injection/modules/KnowledgeModule.ts:383-407` (`registerFileChangeServices`), driven by `FileChangeDispatcher` (`lib/service/FileChangeDispatcher.ts:101-146`) whose only driver is `GitDiffCheckpointService.dispatch` (`.../git-diff-checkpoint/GitDiffCheckpointService.ts`). Not invoked from any MCP handler.
- KEEP (git-commit opportunistic, dormant orphan): `lib/runtime/evolution/PluginOpportunisticEvolution.ts` builds its OWN `GitDiffScanner.scanOnce()` (~:81-83), not shared with FileChangeHandler; original trigger `shouldAttach...` = `alembic_task` op `close` (~:181) which is retired → currently dormant but to be kept.
- KEEP always: `alembic_evolve` handler `handlers/host-agent/evolve.ts:43` (tool `tools.ts:272`), independent.
- KEEP `EvolutionGateway` (singleton `KnowledgeModule.ts:334-339`); FileChangeHandler is only one consumer (`FileChangeHandler.ts:279-286`) — removing it does not remove EvolutionGateway.

### Item 10 — EnhancementRoute still falls back to embedded-plugin-runtime — MATCH
- `lib/runtime/EnhancementRoute.ts` `selectEnhancementRoute` (~:289-311): unconditional final `return 'embedded-plugin-runtime'` (~:310), plus `if (input.daemon.ready) return 'embedded-plugin-runtime'` (~:305). Route values: `local-alembic-daemon`, `local-alembic-install`, `embedded-plugin-runtime`. Post-daemon-removal this points at nothing → PDR-5 must rewrite the selection logic (subject → Core resident; no subject → pure-local first-class).

## Section 2 — Two Implementation-Period Review Conclusions

### Conclusion A — CacheCoordinator: **DELETE, paired with PDR-3** (not PDR-1)
- `lib/infrastructure/cache/CacheCoordinator.ts:1-12` header: it is a **cross-process** cache-invalidation coordinator using SQLite `PRAGMA data_version`, which by SQLite contract changes **only on writes from other connections/processes**, never same-connection writes.
- Construction `lib/injection/ServiceContainer.ts:173` (`#initCacheCoordinator`); only two subscribers — `guardCheckEngine.clearCache()` and `searchEngine.buildIndex()`; polling started only when `ALEMBIC_MCP_MODE==='1'` or `ALEMBIC_API_SERVER==='1'` (`:189-190`) — the latter is set by `bin/daemon-server.ts` / `DaemonSupervisor` spawn.
- Single-process consistency is handled by a **separate** mechanism: `KnowledgeModule.ts:426` `eventBus.on('knowledge:changed', () => searchEngine.refreshIndex())` (+ SearchEngine idempotent ensure/refresh). So with no second process, CacheCoordinator can never fire and guards nothing.
- **Recommendation:** DELETE — but only once the daemon spawn path is actually gone. While `HostMcpServer` → `supervisor.ensure()` can still spawn `bin/daemon-server.ts` (its own DB connection → real cross-process writes), CacheCoordinator still does real work. **Gate deletion to PDR-3** (after daemon spawn removed); deleting in PDR-1 would be premature. Surface to remove together: class file, `#initCacheCoordinator` block, ServiceMap entries (`:62,157`), and `test/unit/CacheCoordinator.test.ts`.

### Conclusion B — Local Recipe semantic-region vector: **MODE-1 (pure Plugin wiring, no Core source change)** → hard-stop does NOT fire
- **Consumed Core is the sibling repo, not the vendor submodule.** `package.json:129` `"@alembic/core": "file:../AlembicCore"`; `node_modules/@alembic/core` → symlink to sibling `AlembicCore`. The sibling **has** the capability; `vendor/AlembicCore/src` is **stale** (zero `region` hits, no `RecipeRegionVectorIndex`). This window verified both directly.
- Sibling Core public APIs (built in `dist/`, exported from `@alembic/core` vector / recipe-context entrypoints):
  - Build: `VectorService.syncRecipeSemanticRegions(entries)` (`src/service/vector/VectorService.ts:551`) / free fn `syncRecipeSemanticRegionVectors`; index `RecipeRegionVectorIndex.ts` (`RECIPE_SEMANTIC_REGION_CLASSES`, `buildRecipeSemanticRegionChunks`).
  - Query: `VectorService.hybridSearch(query,{topK,filter})` (`:358`) + `vectorPortFromService(...).searchRegions(...)` (pins `filter.type='recipe-semantic-region'`, returns `{recipeId, regionClass, score, content}`); `prime` request kind handler emits `RecipeSemanticRegionBlock`.
  - Wiring helper: `createRecipeContextServiceFromCore({knowledge, sourceRefRepository, vectorService?})` auto-wires the vector port when `vectorService` is passed.
- Embedding/storage are in-process today: Plugin instantiates a Core `VectorService` (`lib/injection/modules/VectorModule.ts:38`) with local-first Ollama (qwen3-embedding) + HNSW/JSON over dataRoot — no daemon needed.
- Current evidence source: `matchedRegionClasses` / `recipe-semantic-region` trust evidence today comes **only from the resident path** (`AlembicResidentServiceClient.ts:~2307` `residentRegionRetrieval`; gated `route==='resident-vector-recipe-semantic-region'`). **No local producer exists yet** — confirmed negative.
- **The exact wiring seam:** `lib/runtime/mcp/handlers/recipe-map.ts:190-195` calls `createRecipeContextServiceFromCore({ knowledge, sourceRefRepository })` **without** `vectorService` → vector port null → region search degrades. Wiring in the existing `ctx.container.get('vectorService')` + populating the index via `syncRecipeSemanticRegions` (at rescan/build, per PDR-2) turns on local full-quality region evidence.
- **Conclusion:** every needed method/type/adapter already exists and is exported by the consumed Core. No new/modified Core source is required. **Hard-stop condition ("needs supplementary indexing AND touches Core source") is NOT met.** PDR-2 region-vector build is pure Plugin wiring.
- **Recorded risk (not a blocker):** vendor-submodule vs sibling skew. Dev/runtime resolves to sibling `AlembicCore` (Mode-1 holds), but `vendor/AlembicCore` is stale. Per root CLAUDE.md, vendor/submodule pointers matter for release/plugin-runtime/npm/offline-install. Before PDR-2 lands and at release, confirm the shipping artifact resolves Core via `file:../AlembicCore` (or bump the `vendor/AlembicCore` submodule pointer) so region capability is present in the packaged Core.

## Section 3 — Dead-Code Checklist (item 9) — CORRECTED against reality

PDR-0 re-verification found the design's dead-code list partly inaccurate. **3 of 7 are LIVE — do NOT delete.**

| Design-listed item | PDR-0 verdict | Action |
|---|---|---|
| `HitRecorder` (`lib/service/signal/HitRecorder.ts`) | DEAD-CONFIRMED — registered/started by SignalModule but zero `.record()` calls, stats unread | Direct-delete in PDR-1① (+ SignalModule reg/shutdown + ServiceMap type) |
| `lib/repository/skills` | **LIVE — design WRONG** | KEEP. `countProjectSkillKnowledgeEntries` used by `KnowledgeState.ts:208`, `ProjectSkillService.ts:390` |
| `lib/types` generic stubs | DEAD (no imports found for `graph-shared.ts`/`search-wire.ts`/ambient `.d.ts`) | Deletable, but re-confirm ambient `.d.ts` impact at delete time |
| `WorkflowCompletionFinalizer.refreshPanorama` | DEAD — no-op stub (`CompletionSteps.ts:20-29`, logs skip only) | Deletable |
| `WorkflowCompletionFinalizer.consolidateSemanticMemory` | **LIVE — design WRONG** (real impl `CompletionSteps.ts:52`, called `WorkflowCompletionFinalizer.ts:79,84`) | KEEP |
| `http/routes/auth` (410 tombstone) | LIVE but mounted under `lib/http/` | Not an independent delete — subsumed by PDR-3 `lib/http/` removal |
| `KnowledgeSyncService` | **LIVE — design WRONG** (Plugin wires Core service: `InfraModule.ts:147`, `SetupService.ts:659`, `knowledge-rescan.ts:119`) | KEEP |
| `CrossEncoderReranker` | ALREADY-GONE — no source in lib/bin/vendor (only `.tmp` build artifacts) | No action |

Net genuinely direct-deletable dead code in PDR-1: **HitRecorder**, **lib/types stubs**, **refreshPanorama stub** only.

## Section 4 — PDR-1→6 Deletion / Change Confirmation Checklist

- **PDR-1①** delete `HitRecorder` (+ SignalModule registration/shutdown hook + `ServiceMap.hitRecorder`). Grep-clean `hitRecorder`/`guardHit`/`searchHit`.
- **PDR-1②** delete `FileChangeHandler` + `GitDiffCheckpointService` + KnowledgeModule registration (`:383-407`) + FileChangeDispatcher subscriber wiring. KEEP `PluginOpportunisticEvolution` + `GitDiffScanner` + `alembic_evolve` + `EvolutionGateway`.
- **PDR-1③** delete intent intake whole layer: `IntentExtractor.ts`; `HostIntentFrame.ts` (frame/draft/handoff); `buildIntentIntake`/`buildPrimeRequirementIntake`/`mergeRecognizedIntent`/`buildVectorPlan`; `PrimeSearchPipeline` ExtractedIntent orchestration; clear `bindWorkSession`/`_trackSession` intent session. prime → structured-args → normal vector semantics (route-agnostic, via unified search). work/code_guard → use structured args. **Remove `intentKind` output.** KEEP `buildPrimeKnowledgeMaterial` trust/receipt.
- **PDR-1④** governance Gateway: remove `_resolveMcpGatewayMapping` + `ctx.gateway` injection (`:396`) + `registerGatewayActions` (`:277-283`) + `system.ts` gateway health (`:55-61`); delete `Gateway.ts`/`GatewayActionRegistry.ts` (31 actions). `NoOpGateway.ts` deletion pairs with PDR-3.
- **PDR-1 dead-code** direct-delete: HitRecorder (above) + lib/types stubs + refreshPanorama stub ONLY (NOT skills/KnowledgeSyncService/consolidateSemanticMemory/auth).
- **PDR-2** (must precede PDR-3): bootstrap/rescan data backend → in-process local temp cache (drop `DaemonJobRunner` async route), land at resolved dataRoot/ghost atomically; build local Recipe semantic-region vector via Conclusion-B Mode-1 wiring (pass `vectorService` into `recipe-map.ts:190` + populate via `syncRecipeSemanticRegions`). Interaction unchanged.
- **PDR-3** delete full daemon: `lib/daemon/`, `bin/daemon-server.ts`, `lib/http/` (incl. auth tombstone), `HostMcpServer.ensureEnhancementDaemon` + daemon-start in enqueueJob; fix `StatusService` daemon usage; drop `NoOpGateway` + `NoOpAuditLogger` (keep AuditLogger/AuditStore); trim `EmbeddedRuntimeContract` daemon entries; **delete CacheCoordinator here (Conclusion A)**. MCP surface: `alembic_dashboard` removed; `alembic_runtime` drops daemon control, keeps local cleanup; `alembic_status` drops daemon fields.
- **PDR-5** (after PDR-3) rewrite `selectEnhancementRoute`: subject → Core resident; no subject → pure-local first-class; drop `embedded-plugin-runtime` branch.
- **PDR-4** (after PDR-1 + PDR-3) slim `AlembicResidentServiceClient`: drop `/intent-episodes`, `/decision-register`, dashboard; keep probe/projectScope/search/job; consume Core existing `ProjectRuntimeControlSnapshot.projects[]` (multi-to-one) + `AlembicResidentService*`. No new Core.
- **PDR-6** acceptance (claude-code shell only).

## Section 5 — Design-vs-Reality Discrepancies (summary)

1. Dead-code list (item 9): `lib/repository/skills`, `KnowledgeSyncService`, `consolidateSemanticMemory` are **LIVE** (design said dead) → keep; `CrossEncoderReranker` already gone; `auth` subsumed by PDR-3. **Narrows PDR-1 dead-code deletion scope.**
2. Item 5: gateway actions = **31** (design "25+"); direction consistent.
3. Conclusion B: capability lives in **sibling `AlembicCore`** (consumed), not `vendor/AlembicCore` (stale) — Mode-1 holds against consumed Core; vendor-pointer skew recorded as release risk.
4. All other anchors (items 1-4,6-8,10) match design with only minor line-number drift.

No code defect found; no Core source change required; **hard-stop not triggered**. Recommended status: completed; ready for controller review + PDR-1 planning.
