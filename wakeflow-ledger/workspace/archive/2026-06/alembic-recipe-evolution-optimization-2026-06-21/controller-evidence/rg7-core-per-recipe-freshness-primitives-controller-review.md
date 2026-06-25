# RG7 Core Per-Recipe Freshness Primitives Controller Review

## Controller Acceptance

- User goal: Continue the Alembic Recipe evolution optimization demand by reviewing AlembicCore backfill for RG-7 Core producer primitives.
- Scope reviewed: `rg7-core-per-recipe-freshness-primitives-p1` / `rg7-core-per-recipe-freshness-primitives-t1`.
- Original requirement authority: RG-7 timing repair requires create/evolve flows to immediately refresh per-recipe `source_refs` and vector state so Plan projected generation-state and Recipe retrieval are fresh after create/evolve. Core owns the reusable primitive; Plugin wiring remains downstream.
- Target/window: AlembicCore.
- Evidence reviewed: TargetResultEnvelope `tr-rg7-core-per-recipe-freshness-primitives-t1`; commit `AlembicCore@a156e0d796d396e02d815ca22147c83d59bf880b`; changed files listed below; controller rerun commands below.
- Implementation reality: Core added a real additive `RecipeFreshnessService` facade and a `SourceRefReconciler.reconcileRecipeSourceRefs()` per-recipe path. It refreshes only the affected recipe's `recipe_source_refs`, removes dropped refs only for that recipe, reports active/stale refs, checks `VectorService.getAvailability()` before vector writes, calls `syncEntry()` and `syncRecipeSemanticRegions()` when available, and returns structured stale/degraded status for Plugin consumption.
- Validation result: Controller reran build, targeted tests, public API smoke/boundary, lint, layer/import/output/space/doctrine gates, full unit tests, whitespace check, and Alembic Guard attempt. All repository checks passed except the existing `lint:naming` baseline in three pre-existing facade files.
- Blockers: None for this Core producer package.
- Missing evidence: The first review pack flagged target `evidenceRefs` with `changed-file:` / `public-api:` / `vector-behavior:` prefixes as missing filesystem paths. Controller independently reviewed raw local files and will repair evidence references before reducing results.
- Residual risks: Plugin still needs downstream wiring after create/evolve; `VectorService.syncEntry()` still swallows internal embed/upsert errors by existing design, so this service can only report thrown entry-sync failures and semantic-region sync status; Alembic Guard is unavailable for AlembicCore due uninitialized/mismatched project state and a Guard schema error.
- TODO/backlog rollup: Accepting this closes the Core producer primitive only. Next eligible package is Plugin RG-7 consumer wiring to call the new Core freshness service after create/evolve and remove the local `_populateSourceRefsForEntry` rule path.
- Decision: accept-target-result.
- Next action: repair target evidence refs, reduce/accept the result, then dispatch the Plugin RG-7 consumer wiring package if no new blocker appears.

## Raw Evidence

- Commit: `AlembicCore@a156e0d796d396e02d815ca22147c83d59bf880b` (`Add per-recipe freshness primitives`).
- Changed files:
  - `AlembicCore/src/service/knowledge/SourceRefReconciler.ts`
  - `AlembicCore/src/service/knowledge/RecipeFreshnessService.ts`
  - `AlembicCore/src/service/knowledge/index.ts`
  - `AlembicCore/src/knowledge.ts`
  - `AlembicCore/test/RecipeFreshnessService.test.ts`
  - `AlembicCore/scripts/smoke-public-api.mjs`
- `git -C AlembicCore status --short --branch`: clean, `main...origin/main [ahead 5]`.
- `git show --stat`: 6 files changed, 668 insertions, 9 deletions; new `RecipeFreshnessService.ts` and `RecipeFreshnessService.test.ts`.

## Code Review Findings

- `SourceRefReconciler.reconcileRecipeSourceRefs()` accepts object or string reasoning and uses the same source-path resolution/active-stale logic as full reconcile.
- The per-recipe path calls `#deleteDroppedSourceRefs(recipeId, sources, report)` before inserting/updating current refs, so it removes stale/dropped refs only for the affected recipe.
- Full `reconcile()` was refactored onto the same private helper, preserving the existing skip behavior for rows without sources while sharing logic for rows with sources.
- `RecipeFreshnessService.refreshRecipe()` performs source-ref refresh first, builds an active/partial/missing bridge, then refreshes vector entry and semantic-region vectors.
- `RecipeFreshnessService` checks `VectorService.getAvailability()` before `syncEntry()`/`syncRecipeSemanticRegions()` and returns degraded availability without silent vector success when the provider is unavailable.
- Public `@alembic/core/knowledge` exports include `RecipeFreshnessService`, `RecipeFreshness*` types, and `ReconcileRecipeSourceRefsInput`; smoke coverage asserts these exports.

## Controller Validation

- `npm run build:check`: passed.
- `npx vitest run test/RecipeFreshnessService.test.ts test/unit/SourceRefReconcilerSignal.test.ts test/RecipeSourceRefRepositoryFloor.test.ts test/VectorAvailability.test.ts test/RecipeRegionVectorIndex.test.ts`: passed, 5 files / 36 tests.
- `npm run build`: passed.
- `npm run lint:public-api-boundary`: passed, 61 exports classified, stable=24/provisional=8/transitional=29.
- `npm run smoke:public-api`: passed, 54 exact public API entrypoints imported.
- `git diff --check`: passed.
- `npm run lint`: passed, 637 files checked.
- `npm run lint:layer-contract`: passed.
- `npm run lint:consumer-core-imports`: passed, AlembicAgent/Alembic/AlembicPlugin import issues=0.
- `npm run check:output-budgets`: passed.
- `npm run test`: passed, 135 files / 1372 tests.
- `npm run check:space-edges`: passed.
- `npm run lint:doctrine`: passed.
- `npm run lint:naming`: failed only on pre-existing `src/project-context-capabilities.ts`, `src/recipe-context-capabilities.ts`, `src/test-fixtures.ts`.
- `alembic_status`: degraded/not initialized for AlembicCore, selected project mismatch points at parent workspace.
- `alembic_code_guard`: attempted for the six changed files and failed with internal output schema error; no usable Guard result was produced.

## Evidence Repair

Review pack at state revision 42 reported `controllerReviewReady=false` because several target `evidenceRefs` were descriptive strings that looked like missing state-root paths. The raw evidence is present in the AlembicCore repository and this controller review file. The target result should be re-recorded with filesystem evidence refs using repository-relative paths and this controller evidence file.
