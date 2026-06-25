# PDR-2 Finding — Core region-query defect + Mode-1 route-around (decision needed)

- Demand: `alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18`
- Task: `pdr-2-bootstrap-localcache-regionvector` / PDR-2
- Window: AlembicPlugin · Date: 2026-06-19 · Base HEAD: `b3425a6` (clean)
- Status: **needs-user-decision on 2b mechanism** (no code committed this turn). 2a plan ready + Core-clean.

## Headline
PDR-2 step **2b** intended region-query mechanism (`vectorPortFromService(...).searchRegions` / the `RecipeContextService` `prime` kind — the path PDR-0 Conclusion B verified at the export level) is **functionally broken in sibling Core** for the Plugin's real runtime config. The region-vector capability is still achievable **Mode-1 (no Core change)** via a different existing Core method, but that **deviates from the design's specified mechanism**. Decision needed before committing 2b.

## The Core defect (verified in sibling AlembicCore source)
Chain for `vectorPortFromService(vectorService).searchRegions(query, …)`:
1. `searchRegions` → `VectorService.hybridSearch(query,{filter:{type:'recipe-semantic-region'}})` (`adapters/vectorPort.ts:42`).
2. `hybridSearch` (HybridRetriever path, the Plugin's config — embedProvider+hybridRetriever both injected) returns `fused.map(r => ({id, score, ...r, …}))` (`VectorService.ts:436-443`).
3. `HybridRetriever.fuse` builds each item as `{id, denseRank, sparseRank, rrfScore, data: <searchVector result>, score}` — region identity ends up at **`hit.data.item.metadata.{recipeId,regionClass}`** (`HybridRetriever.ts:79-80,98-99`).
4. `readHitString(hit,key)` only probes `hit[key]` / `hit.metadata[key]` / `hit.item[key]` — **never `hit.data…`** (`vectorPort.ts:99-113`).
→ Every region hit returns `recipeId=''`, `regionClass=''`. The trust gate (`PrimeKnowledgeMaterial.resolveAcceptedKnowledgeTrustEvidence`, credits only records with non-empty `matchedRegionClasses`) credits nothing. No Core test covers the populated-hit path (only the degraded `embedProvider:null` case). Fixing requires a Core source change (e.g. `readHitString` also probes `hit.data?.item?.metadata`, or `hybridSearch` flattens `item`/`metadata` to the hit top) + dist rebuild.

This is why PDR-0 Conclusion B (Mode-1 via the exported APIs) was right about exports but the **runtime query path** is broken.

## Why it's NOT a hard blocker — the Mode-1 route-around (verified, no Core change)
`VectorService.search(query,{filter})` (pure vector, NOT hybridSearch) returns `Array<{item, score}>` **directly** from `searchVector` (`VectorService.ts: async search`), and `HnswVectorAdapter.searchVector` builds each item as `{id, content, metadata: <chunk metadata>}` (`HnswVectorAdapter.ts:30-41`); region chunks store `recipeId`/`regionClass` in `metadata` (`RecipeRegionVectorIndex.ts buildRecipeSemanticRegionChunks` → `metadata.recipeId/regionClass`). So the Plugin can:
- QUERY: `vectorService.search(query, { filter: { type: 'recipe-semantic-region', regionClass? }, topK })`.
- MAP (Plugin-side): for each `{item, score}` → read `item.metadata.recipeId` / `item.metadata.regionClass` / `item.content` → build resident-shaped regionEvidence record `{ itemId, recipeId, matchedRegionClasses:[regionClass], matchedRegions:[{regionClass,score,snippet}], sourceRefs, score, kind, evidenceRefs, whySelected }` (group by recipeId) → pass into `buildPrimeKnowledgeMaterial(input.regionEvidence)` (the PDR-1d seam).
This avoids `readHitString`/`searchRegions` entirely → no Core change. `search` needs the local Ollama embed lane (same availability constraint as the intended path); degrades to no-region (recipe-locator only) when embed is unavailable.

## Decision requested (2b mechanism)
- **Option R (route-around, Mode-1, recommended for "no Core change"):** prime queries `vectorService.search` + Plugin-side metadata mapping → regionEvidence. No Core change. Deviates from the specified `searchRegions`/RecipeContextService mechanism; leaves the Core `searchRegions` bug in place (so `alembic_recipe_map` region search + any resident prime kind stay broken); the task's `recipe-map.ts:190` vectorService wiring would be ineffective (defers).
- **Option C (fix Core):** one-line-ish fix in sibling `AlembicCore/src` (`readHitString` probe `hit.data?.item?.metadata`, or `hybridSearch` hit flattening) + dist rebuild + a populated-hit test. Enables the design's intended `searchRegions` path + `recipe-map:190` wiring + resident prime kind. BUT touches Core — conflicts with the demand's "暂不新增 Core / 不改 Core"; needs the user's explicit Core-change exception.

## 2a (independent, Core-clean, ready — unblocks PDR-3)
Convert `HostMcpServer.enqueueJob` (`:932`) from the daemon async route (`ensureEnhancementDaemon`→supervisor.ensure spawn→HTTP→DaemonJobRunner) to **in-process synchronous + local JobStore** (reuse Core `JobStore` as pure file I/O — `readJob` already does `new JobStore({projectRoot})`): create→markRunning→run `bootstrapForHostAgent`/`rescanForHostAgent` synchronously→complete, atomic publish at dataRoot/ghost. Removes the only `ensureEnhancementDaemon` job-trigger → **daemon no longer triggered by job** (paves PDR-3). DaemonJobRunner/bin/daemon-server/lib/http stay dormant → PDR-3. No Core change. Tool interaction unchanged. Can be implemented + committed immediately on confirmation (or independently of the 2b decision, since it's the "必先于 PDR-3" piece).

## Guardrails (unchanged)
No Core change without decision; don't delete daemon carrier (PDR-3); keep tsc green + biome no-new; bootstrap/rescan interaction unchanged. Sandbox can't runtime-validate the full prime/vector chain (Ollama/DB/native) → real validation Test/PDR-6.
