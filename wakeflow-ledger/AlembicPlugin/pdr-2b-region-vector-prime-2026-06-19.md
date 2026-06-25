# PDR-2b — Local Recipe semantic-region vector build + prime wiring (consumer of CORE-SEARCHREGIONS-FIX)

- Demand: `alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18`
- Task: `pdr-2b-region-vector-prime` / PDR-2b · dispatchGroup `pdr2b-plugin-region-vector`
- Window: AlembicPlugin · Date: 2026-06-19 · Base: `289fd0d` (PDR-2a)
- Status: **completed** · commits `45092bf` → `40558be` → `7e6af98` (main, no branch)
- Consumes: AlembicCore `f0bf896` (CORE-SEARCHREGIONS-FIX) via `@alembic/core` → sibling symlink. No Plugin-side Core change (Core tree clean at f0bf896).

## Precondition verified (producer landed)
Independently confirmed the Core fix is in the **consumed** sibling before relying on it:
- src `service/recipe-context/adapters/vectorPort.ts:112` `const dataItem = asRecord(asRecord(hit.data)?.item);` (+ probes `dataItem`/`dataItem.metadata`).
- dist `dist/service/recipe-context/adapters/vectorPort.js:73` carries the same dataItem probing.
→ `searchRegions` now returns non-empty `recipeId`/`regionClass` for the Plugin's hybridRetriever-active config (the PDR-2 defect was the missing `hit.data.item.metadata` probe after `HybridRetriever.fuse`). The PDR-1d route-around is therefore unnecessary; this package uses the design-specified `searchRegions` path.

## What shipped (3 steps)

### 1 — BUILD (`45092bf`)
- New `lib/runtime/mcp/host-agent-workflows/recipe-region-vector.ts`: `buildRecipeSemanticRegionVectors(ctx)`.
  - Gets `vectorService`/`knowledgeService` from the workflow container (graceful skip if unavailable).
  - **Embed gate, probe-first**: `vectorService.getStats().embedProviderAvailable` → skip entirely if false. Rationale: `syncRecipeSemanticRegions` runs `removeStale` *before* its embed step, so probing first avoids stripping changed-recipe chunks when the local Ollama provider is down.
  - Entries: `(await knowledgeService.list({}, {pageSize: 100000})).data.map(e => e.toJSON())`; empty → no-op (also avoids removeStale on empty).
  - Calls `vectorService.syncRecipeSemanticRegions(entries)`; logs `{status, scanned, generated, upserted, removed}`. Any failure logged + swallowed (non-blocking).
- Wired in `host-agent-workflows/knowledge-rescan.ts` right after `syncKnowledgeStoreForRescan` (step 2.5b), with a NOTE clarifying region chunks (`type=recipe-semantic-region`) are a separate vector type not maintained by the SyncCoordinator, hence the explicit rebuild.
- **Call site = rescan only.** Cold-start has no knowledge-consistency point (knowledge is populated by the agent *after* onboarding; empty/transitional at cold-start) and is latency-sensitive; region vectors rebuild at the first rescan. Documented as a runtime-lifecycle gap below (not an arbitrary omission).

### 2 — WIRE (`40558be`)
- `handlers/recipe-map.ts` `buildRecipeContextService`: pass `vectorService: safeGet(ctx,'vectorService') ?? null` into `createRecipeContextServiceFromCore` (factory already accepts the optional 4th part) → enables the RecipeContext region lane via the Core-fixed `searchRegions`; absent it, degrades to no region retrieval (unchanged behavior).

### 3 — FEED prime (`7e6af98`)
- `handlers/agent-public-tools.ts`:
  - `runPrimeSearch` return gains `regionEvidence: Record<string,unknown>[]`. After the unified `pipeline.search`, it calls `queryPrimeRegionEvidence(ctx, frame)`.
  - `queryPrimeRegionEvidence`: `vectorPortFromService(ctx.container.get('vectorService')).searchRegions(query, {limit:10})`; if `vectorUsed===false` (embed lane down) → `[]` (documented lexical-only degrade); else maps hits.
  - `buildPrimeRegionQuery`: uses `frame.searchQuery`, else falls back to `requirementGoal/scenario/keywords/labels` joined — so **subject-less** prime still drives region retrieval.
  - `mapRegionHitsToPrimeEvidence`: groups hits by `recipeId` into records mirroring `PrimeKnowledgeMaterial.projectResidentRegionSelectedRecipe` output (`itemId`, `recipeId`, non-empty `matchedRegionClasses`, `matchedRegions`, `description`, `evidenceRefs`, `injectionStatus:'selected'`, `whySelected`). Drops empty `recipeId`/`regionClass`.
  - `buildPrimeMaterialProjection` threads `primeSearch.regionEvidence` into `buildPrimeKnowledgeMaterial({…, regionEvidence})` (the PDR-1d seam).

## PDR-1d interim un-defer — proof of connection
`PrimeKnowledgeMaterial.resolveAcceptedKnowledgeTrustEvidence` credits any record with non-empty `matchedRegionClasses` as `recipe-semantic-region` evidence (full quality). New `test/unit/PrimeRegionEvidence.test.ts` (6/6 pass) proves the full path: searchRegions hit → `mapRegionHitsToPrimeEvidence` record → `buildPrimeKnowledgeMaterial` → `acceptedKnowledge[].trustEvidence.kind === 'recipe-semantic-region'`; and the contrast (same subject-less, non-degraded input) with no regionEvidence → `acceptedKnowledge` empty (the interim lexical shape). Also covers the subject-less query fallback and empty-identity hit drop.

## Gate evidence
- `npx tsc --noEmit` → exit 0 (committed HEAD `7e6af98`).
- `npx biome check lib/ bin/ config/ scripts/` → 2 errors / 17 warnings = **baseline** (all pre-existing, in untouched files); the 4 changed source files + the new test are biome-clean.
- New test: 6/6 pass.
- **No net-new test failures** (git-stash baseline-diff vs clean `289fd0d`, identical at both states):
  - AgentPublicToolsActive + SearchPrimeIsolationBoundary: 4 failed / 24 passed (both states).
  - RecipeMapTool + HostMcpServer: 3 failed / 51 passed (both states).
  - (Pre-existing failures are stale source-token assertions, part of the ~59 sandbox baseline; DB/vector/native/embed deps absent.)
- Diffstat `45092bf^..HEAD`: 5 files, +355/-6.

## Runtime verification gaps (deferred to Test/PDR-6, per task)
- Real embed (Ollama) + vector store + on-disk region landing: the full BUILD→QUERY→regionEvidence→prime chain cannot run in this sandbox (no Ollama/DB/native). Verified here by tsc + static wiring (file:line/call graph) + targeted trust-gate test only.
- Region-vector freshness lifecycle: vectors (re)build at **rescan**. A cold-start-then-onboard-without-rescan session would not have region vectors until the next rescan. Whether cold-start should also build region vectors (knowledge is empty/transitional there + latency-sensitive) is flagged for controller/Design decision, not assumed.
- `vendor/AlembicCore` drift unchanged (stale; the consumed path is the sibling symlink) — a release/PDR-6 concern, untouched here.

## Boundaries honored
No Core change (Core stays `f0bf896`, tree clean). Trust gate, evolution/EvolutionGateway, and bootstrap/rescan tool interaction unchanged. Committed to main in 3 steps, no branch.
