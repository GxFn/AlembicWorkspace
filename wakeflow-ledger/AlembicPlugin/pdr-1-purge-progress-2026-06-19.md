# PDR-1 Purge — Progress, Findings & 1d Execution Plan

- Demand: `alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18`
- Task package / target task: `pdr-1-purge-deletion` / `PDR-1`
- Window: AlembicPlugin
- Date: 2026-06-19
- Base HEAD at start: `5e5b61d` (clean)
- Baseline (PDR-0): `tsc --noEmit` PASS; `biome check lib/ bin/ config/ scripts/` = 3 errors + 17 warnings (pre-existing). All steps below diff against this.

## Status: 1a/1b/1c DONE + committed + verified. 1d PLANNED (not started) — returning for controller go-decision.

## Completed & committed (tsc PASS + biome at baseline + grep-clean after each)

| Step | Commit | What | Verification |
|---|---|---|---|
| 1a HitRecorder | `5b2505f` | Deleted `HitRecorder.ts` + SignalModule DI/shutdown + `ServiceMap.hitRecorder` + HitRecorder-only DB helpers `flushHitRecorderStats`/`HitRecorderFlushEntry`. Kept `resolveSqliteDb`/`SqliteDb` (CleanupService) + the `stats` data schema. | tsc PASS; grep-clean of HitRecorder code identifiers. Note: `guardHits`/`searchHits` (plural) retained in `types.ts:293/295` as persisted recipe-stats data fields (siblings of adoptions/applications/views) — NOT HitRecorder code; out of 1a deletion scope. |
| 1b file-change monitor | `0d55ff2` | Deleted `FileChangeHandler.ts`, `GitDiffCheckpointService.ts`, `FileChangeDispatcher.ts`; removed KnowledgeModule `registerFileChangeServices`; removed the daemon checkpoint-loop wiring in `bin/daemon-server.ts` (the monitor's only live driver). Kept `PluginOpportunisticEvolution`+`GitDiffScanner`, `alembic_evolve`, `EvolutionGateway`, and shared `GitDiffCheckpointStatus`/`ProjectDiffIgnore`. | tsc PASS; biome baseline; deleted symbols grep-clean. `http/routes/daemon.ts` reads checkpoint status via Record-cast → degrades to null. |
| 1c governance Gateway | `c1239f9` | Un-injected the dead MCP middleware: `ctx.gateway` injection, `_resolveMcpGatewayMapping` (+ GatewayStaticMapping/GatewayMappingEntry/TOOL_GATEWAY_MAP import), McpServer `registerGatewayActions` call, `system.ts` gateway health check. | tsc PASS; biome baseline; `ctx.gateway` grep-clean. |

## Beyond-design findings (controller should accept before 1d lands)

### Finding 1c-A — governance Gateway is a LIVE Core-service constructor dependency (design understated)
The design framed `Gateway.ts`/`GatewayActionRegistry.ts` as deletable in PDR-1 (live middleware path dead). Reality: the `gateway` singleton is **created by `Bootstrap` + `InfraModule`** and **passed to Core `GuardService` (param[2]) and `KnowledgeService` (param[2])** constructors (`GuardModule.ts:37`, `KnowledgeModule.ts:105`), plus consumed by `HttpServer` + `gatewayMiddleware` + `daemon-server` (PDR-3 targets).
- Core `GuardService`/`KnowledgeService` store `this.gateway = gateway` (typed `unknown`) and **never read it** — vestigial. So the gateway is functionally dead (confirms the design premise) BUT its file deletion is blocked.
- **Action taken:** 1c completes the un-injection only; `Gateway.ts`/`GatewayActionRegistry.ts`/`NoOpGateway.ts` file deletion DEFERRED to PDR-3 (per the task's own fallback clause). At PDR-3, deleting `Gateway.ts` requires passing `null` to the two Core constructors (param is `unknown`, never read → no Core change). Record this for PDR-3.

### Finding 1d-A — prime trust-gate region-evidence interim (load-bearing)
Prime's trust gate (`PrimeKnowledgeMaterial.resolveAcceptedKnowledgeTrustEvidence`) admits knowledge only with `recipe-semantic-region` evidence (`matchedRegionClasses`, today produced ONLY by the resident lane via `searchMeta.primeInjectionPackage.residentRegionRetrieval`) OR a `recipe-locator` signal. The 1d rewrite replaces prime retrieval with normal vector search and removes the resident-handoff lane, so **region evidence is absent until PDR-2 wires it locally** → prime returns `degraded`/mostly-empty `acceptedKnowledge` in the PDR-1→PDR-2 interim (only `recipe-locator`-signalled items admitted).
- This is the design's explicit PDR-1↔PDR-2 split ("PDR-1 uses normal vector search; region-evidence wiring is PDR-2; leave the extension point, don't hardcode it out"). So it is the **designed interim**, not a defect.
- **Mitigation in plan:** keep the trust gate + the resident region-producer code (`residentRegionSelectedKnowledgeRecords`/`projectResidentRegionSelectedRecipe`/`matchedRegionClasses`) intact, and add an optional `regionEvidence?` input to `buildPrimeKnowledgeMaterial` as the PDR-2 seam.

### Verification gap for 1d (sandbox)
Prime/work/code_guard runtime cannot be fully validated in this sandbox (SearchEngine/AgentPublicTools/vector/DB tests fail here — established baseline). 1d will be gated on `tsc --noEmit` + `biome` (vs baseline) + grep-clean + targeted-test baseline-diff. True "prime full chain" runtime validation belongs to Test/PDR-6.

## 1d Execution Plan (ready; verified against current code)

Order keeps tsc green at each commit. No Core change (all Plugin-side).

### 1d-step-1 — prime retrieval rewrite (crux)
- `PrimeSearchPipeline.ts`: collapse to a thin adapter. Change `search(intent: ExtractedIntent, ...)` → `search(frame, options)` that calls the unified `searchEngine.search(frame.searchQuery, { mode:'auto', limit, rank:false })` (same engine alembic_search uses — both already share the `searchEngine` singleton: KnowledgeModule.ts:138; prime injected at AppModule.ts:115-118). Keep `#qualityFilter` + knowledge/rules split + `PrimeSearchResult` shape; drop multi-query/RRF (`#multiQuerySearch`), `buildResidentIntentHandoff`, and the `#residentSemanticSearch` lane from the hot path. `searchMeta` resident fields become absent (null-guarded downstream).
- `PrimeKnowledgeMaterial.ts`: change `PrimeKnowledgeMaterialInput` — drop `extracted: ExtractedIntent` + `hostIntentFrame: HostIntentFrame`; add a small structured frame (scenario/queries/language/module/userQuery + the hostDeclaredIntent-shaped gate fields read by `hasLowInformationPrimeIntent`/`hasPrimeCallerContext`) and `regionEvidence?: Record<string,unknown>[]` (PDR-2 seam). Update internal fallback reads (~276-289, 394-428, 506-517). KEEP the trust gate + `residentRegionSelectedKnowledgeRecords`/`projectResidentRegionSelectedRecipe` (union `regionEvidence` into `selectedKnowledgeRecords()`/`buildSelectedKnowledgeByItemId()` ~788-806). KEEP `buildPrimeKnowledgeMaterial` output contract.
- `agent-public-tools.ts` `runPrimeSearch` (~1224-1264): build frame via `buildStandalonePrimeRequirementFrame(args)` (already at ~1252), run unified search, feed `buildPrimeKnowledgeMaterial`. Keep `resolvePrimeSkipBeforeRetrieval`/`resolvePrimeBlockingReason` gates unchanged.

### 1d-step-2 — work/finish/code_guard intake → args
- Remove `buildIntentIntake` from `workStartHandler`(468)/`workFinishHandler`(564)/`codeGuardHandler`(668). Re-read `agentHost`(`args.agentHost ?? 'codex'`)/`inputSource`(`resolveAgentInputSource(args.inputSource, lifecycle.inputSource)`) directly. Keep `classifyTaskLifecycleInput` for `resolveWorkStartStatus` (workStart) — call it directly (decoupled from the full frame). workFinish/codeGuard need only agentHost/inputSource. Stop putting `intentKind`/`hostIntentFrame` in `WorkRecord`; simplify `bindWorkSession` (drop hostIntentFrame/extracted reads).

### 1d-step-3 — delete intake aggregation + intent paradigm
- Delete `IntentExtractor.ts`; delete `HostIntentFrame.ts` intent-paradigm exports (`HostIntentFrame`/`RecognizedIntentDraft`/`ResidentIntentHandoff`/`buildResidentIntentHandoff`/`buildHostIntentFrame`). **Relocate kept utils first**: `readHostTurnMetaFromMcpRequest` + `HostTurnMetaInput` (used by McpServer/HostMcpServer/embedded-executor/handlers-types/mcp-tools) → a kept module (e.g. `lib/runtime/mcp/host-turn-meta.ts`); decide `NormalizedHostIntentInput`/`prepareHostIntentInput` (only agent-public-tools after refactor → drop or inline).
- Delete `buildIntentIntake`/`buildPrimeRequirementIntake`/`mergeRecognizedIntent`/`buildVectorPlan` + their `ReturnType` usages.
- `TaskLifecyclePolicy.ts`: decouple from `HostIntentFrame` (drop the `hostIntentFrame?` param at :87; pass query/action/sourceRefs directly; remove `hasCuratedHostDeclaredIntent` :314-319; reads at :170/289/292/308/329/368-375). Keep internal lifecycle classification + its internal `intentKind` (not the output one).
- `McpServer._trackSession` (~427-468) + `handlers/types.ts` IntentState `hostIntentFrame?` (:71): drop HostIntentFrame refs (optional fields — non-breaking).

### 1d-step-4 — remove intentKind OUTPUT (keep as input)
- Remove from output schema/serialization: `contract.ts:184` (`AgentPublicToolResultEnvelopeSchema`), `output.ts:153` + `:284` spread, `structure.ts:234` spread; delete `mapLifecycleIntentKind` (agent-public-tools ~2241-2268) + its call sites (962/1011). KEEP intentKind INPUT fields (`mcp-tools.ts:130`, `KnowledgeContextBaseInput.ts:48`). Isolate/remove `AgentIntentKindSchema`/`AGENT_INTENT_KINDS` only if unused after.
- grep-clean target: no `extractIntent`/`buildHostIntentFrame`/`buildIntentIntake`/`ExtractedIntent`/`ResidentIntentHandoff` refs; `intentKind` only in INPUT schema sites.

### 1d completion gate
tsc PASS; biome vs baseline (no new); grep-clean; targeted-test baseline-diff (no net-new failures); kept items intact (PluginOpportunisticEvolution/EvolutionGateway/RecipeProductionGateway/trust receipt/3 LIVE dead-code items). Commit AlembicPlugin main in logical sub-steps.

## Go-decision sought from controller
1d is a flagship-tool (`alembic_prime`) rewrite with a designed interim regression (Finding 1d-A) and a sandbox runtime-verification gap, sitting atop two beyond-design findings (1c-A, 1d-A). Confirm: proceed to execute 1d-step-1..4 now (the plan above) and commit to main, with the prime interim accepted pending PDR-2 — or adjust sequencing (e.g. land PDR-2 region-vector together). Plan is ready to execute on confirmation.
