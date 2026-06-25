# PDR-2c — Cold-start has NO clean post-knowledge region-vector build point (needs-user-decision)

- Demand: `alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18`
- Task: `pdr-2c-coldstart-region-vector` / PDR-2c · dispatchGroup `pdr2c-plugin-coldstart-region`
- Window: AlembicPlugin · Date: 2026-06-19 · Base: `7e6af98` (PDR-2b), **tree clean — no code change this turn**
- Status: **needs-user-decision** (lifecycle-assess escape clause of the task package fired). No Core change; no commit.

## Headline
PDR-2c asked to add the **bootstrap half** of PDR-2's "bootstrap/rescan 须...构建" — call PDR-2b's `buildRecipeSemanticRegionVectors` at cold-start's "knowledge created & consistent" point. **That point does not exist.** Cold-start (`runHostAgentColdStartWorkflow`) is structurally the *opposite* of a post-knowledge point: it **clears** knowledge and never repopulates it in-workflow. A build call inside cold-start is a **guaranteed no-op**. Per the task's explicit escape clause, this is reported for user/controller decision rather than forced at a wrong point.

## Structural reason (verified, file:line — first-hand + adversarial workflow, unanimous high confidence)
1. Cold-start's first (and only) knowledge-DB mutation is **destructive**: Step 1 `runFullResetPolicy` → `CleanupService.fullReset` → `clearTables(ALL_DATA_TABLES)` `DELETE`s `knowledge_entries` + `recipe_source_refs` (after archiving to trash).
   - `cold-start.ts:96` (runFullResetPolicy) · `CleanupService.ts:129` (ALL_DATA_TABLES incl. knowledge_entries) · `CleanupService.ts:248` (clearTables) · `SqliteDatabaseAccess.ts:268` (`DELETE FROM <table>`).
2. After fullReset, the entire remainder of the workflow (`cold-start.ts:110-194`) is **pure read/analysis + in-memory briefing assembly** then return — zero knowledge/recipe writes. `project-context-analysis.ts` is read-only (no DB/repository/persist usage). The only disk write is the session JSON (`.asd/bootstrap-sessions/active-sessions.json`), not the knowledge DB.
3. By the file's own contract (`cold-start.ts:1-9`, and the response message at `:188-193`: "知识库清空后…直到重建出可用知识"), recipes are authored **only later, in SEPARATE host-agent MCP turns** (`alembic_submit_knowledge` → `KnowledgeService.create`; `alembic_evolve`; `alembic_dimension_complete`) — knowledge is written **incrementally across host turns, with no single completion callback inside cold-start**.
4. `buildRecipeSemanticRegionVectors` early-returns on empty knowledge — `recipe-region-vector.ts:69` `if (entries.length === 0) return;` **before** `syncRecipeSemanticRegions`. So a build placed anywhere in cold-start (e.g. before `cold-start.ts:194`) provably builds nothing.

→ There is no point inside cold-start where `knowledge_entries` is non-empty **and** consistent. (Contrast rescan: `rescanClean` PRESERVES active/published/staging/evolving recipes; `syncKnowledgeStoreForRescan` re-upserts them into `knowledge_entries`; PDR-2b's build then runs at `knowledge-rescan.ts:140` — knowledge present + consistent. Cold-start has neither.)

## The post-cold-start gap is REAL — incremental sync does NOT cover region vectors (adversarially verified)
The decisive alternative I had to rule out: does the auto-sync-on-CRUD build region vectors as the agent submits knowledge after cold-start? **No.**
- `VectorService.autoSyncOnCrud` wires only `SyncCoordinator.bindEventBus` (`VectorService.ts:142`).
- `SyncCoordinator` binds only `knowledge:changed` / `knowledge:deleted` (`SyncCoordinator.ts:80,94`) and reconcile/processBatch operate **exclusively on `entry_*`** main-index vectors (`SyncCoordinator.ts:179-203,358,383`). There is **no `recipe_region_*` / `type=recipe-semantic-region` handling on the CRUD path.**
- `recipe-semantic-region` chunks are built **exclusively** by `VectorService.syncRecipeSemanticRegions` → `syncRecipeSemanticRegionVectors` (`RecipeRegionVectorIndex.ts`), whose only production caller is the rescan path (`knowledge-rescan.ts:140`, PDR-2b).

So a project that cold-starts then submits knowledge but **never rescans** has degraded subject-less prime (no region evidence) indefinitely. This confirms (and now rigorously verifies) PDR-2b's risk #2.

## Options for user/controller (each changes scope/behavior → needs confirmation; not a cold-start edit)
- **(A) Accept rescan-only (status quo).** Region vectors build only at `alembic_rescan`. Document that a freshly cold-started or submit-only project has region vectors only after the next rescan. Lowest risk, no code; leaves the gap as a documented behavior. (In practice the onboarding flow expects a rescan after the submit cycle.)
- **(B) Build at the dimension-complete finalizer (recommended if the gap must close in-band; Plugin-only, reuses the PDR-2b helper).** `runHostAgentDimensionCompletionWorkflow` → `runWorkflowCompletionFinalizer` (`dimension-completion.ts:362`) runs on the final dimension-complete turn, where submitted recipes ARE present + consistent (`knowledgeService.get/update` at `dimension-completion.ts:648-665,777-786`). Calling `buildRecipeSemanticRegionVectors` there (embed-gated, non-blocking, on last dimension only) closes the gap without a rescan. **Changes visible retrieval behavior (new build trigger) → needs confirmation.** No Core change.
- **(C) Incremental region-sync in SyncCoordinator.** Extend the CRUD path to build/remove `recipe_region_*` chunks on `knowledge:changed/deleted`. Largest change, touches Core `VectorService`/`SyncCoordinator` → conflicts with the demand's no-Core-change boundary; needs explicit Core-change authorization.

Recommendation: if the gap must be closed inside this demand, **Option B** is the cleanest (Plugin-only, real knowledge-present point, reuses the helper). If rescan-after-onboarding is acceptable, **Option A** (document + done). Either way it is a product/scope decision for the user/controller — I did not implement it, to avoid forcing a no-op into cold-start or unilaterally adding a behavior change.

## Method / evidence
First-hand read of `cold-start.ts` (full) + `recipe-region-vector.ts:69` + `SyncCoordinator.ts` + `dimension-completion.ts`. Corroborated by a 6-reader / 3-judge assessment workflow (diverse lenses incl. a "find-the-point" charitable lens) — all 6 findings `persistsKnowledgeDuringColdStart=no`, all 3 verdicts `cleanPointExists=no, coldStartBuildIsNoOp=true, incrementalRegionSyncCovers=no, confidence=high`. tsc/biome unchanged (no edits). Runtime full-chain (embed/HNSW) remains a Test/PDR-6 concern. `vendor/AlembicCore` drift unchanged (release/PDR-6).

## Boundaries honored
No code change (a cold-start build would be a no-op; Options B/C need confirmation). No Core change. No daemon-deletion work (PDR-3). bootstrap/rescan interaction unchanged. PDR-2b helper reused conceptually (would be the call target under Option B), not reimplemented.
