# P0 Controller Consumer Inventory And Self-Checks

Date: 2026-06-22

Demand: `alembic-recipe-plan-no-guess-correction-2026-06-22`

Status: controller P0 evidence complete; product characterization tests still belong to owning repository task packages.

## Authority

- Requirement design P0 requires consumer inventory, characterization tests, git-diff-checkpoint duplicate live-path check, performance special-case check, architectureIntelligence signature dependency check, and frontend UI scope.
- Requirement design final completion requires Plan as complete authority, no recommendation/top-N Plan authority, confirm full payload, no Plan double-write, canonical dimension migration, real evolution/source/freshness behavior, Panorama retirement, frontend pyramid, and RG-10 re-acceptance.
- Handoff states P0 completion signal as "清单+表征测试就绪，3 项自查落定". This document completes the controller inventory and self-check portion. It does not claim product tests have already been added.

## Commands Run

- `rg -n "architectureIntelligence|ArchitectureIntelligence|recommendedDimensions|selectedDimensions|resolveActiveDimensions" AlembicPlugin/lib AlembicPlugin/test AlembicCore/src AlembicCore/test Alembic/lib Alembic/test AlembicDashboard/src --glob '!**/vendor/**'`
- `rg -n "git-diff-checkpoint|GitDiffCheckpoint|PluginOpportunisticEvolution|opportunistic-evolution|FileChangeHandler|new-module-recommendation|generationStateWrites" AlembicPlugin/lib AlembicPlugin/test Alembic/lib Alembic/test AlembicCore/src AlembicCore/test --glob '!**/vendor/**'`
- `rg -n "resolveActiveDimensions" AlembicCore/src AlembicCore/test AlembicPlugin/lib AlembicPlugin/test Alembic/lib Alembic/test --glob '!**/vendor/**'`
- Targeted reads with `nl -ba` for the files and line ranges cited below.

## Self-Check 1: plan-tool Depends On architectureIntelligence In The Plan Signature

Finding: confirmed.

- `AlembicPlugin/lib/recipe-generation/plan-tool.ts:282-311` builds draft context by calling `analyzeDraftArchitecture`, `buildDynamicSignals`, `buildDraftPlanningAids`, and `buildDraftInformationPackage`.
- `AlembicPlugin/lib/recipe-generation/plan-tool.ts:326-335` calls `ProjectContextCapabilities.analyzeArchitectureIntelligence`.
- `AlembicPlugin/lib/recipe-generation/plan-tool.ts:300-304` computes `projectContextSignature` with `architectureStyle: architectureIntelligence.styles.primary`.
- `AlembicPlugin/lib/recipe-generation/plan-tool.ts:1599-1613` recomputes the current signature in confirm/get validation and again uses `architectureIntelligence.styles.primary`.
- `AlembicPlugin/lib/recipe-generation/plan-tool.ts:372-376` also exposes `architectureHints` from `architectureIntelligence.styles.primary` and `domains.projectPresentDomains` in the draft information package.

Conclusion for P5/I3: deleting hollow rich analysis from `architectureIntelligence` cannot remove or destabilize the signature source without replacing it. The implementation must either keep a stable domain/style signal needed by Plan signature, or move signature metadata to a ProjectContext/domain-signal source that survives I3. Do not silently make signature depend on removed default style fields.

## Self-Check 2: git-diff-checkpoint Has Duplicate Paths And Both Need A Decision

Finding: confirmed.

Active implementation path:

- `AlembicPlugin/lib/recipe-generation/evolution/git-diff-checkpoint/GitDiffCheckpointService.ts:35-94` is the real checkpoint service implementation.
- `AlembicPlugin/lib/recipe-generation/evolution/git-diff-checkpoint/GitDiffScanner.ts` is the scanner consumed by Plugin evolution routes.
- `AlembicPlugin/lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts:38-42` imports the scanner and unified evolution surface from `#recipe-generation/evolution/*`.
- `AlembicPlugin/lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts:380-438` runs rescan unified evolution, keeps an in-process checkpoint map, scans git diff, routes to `FileChangeHandler`, then returns the unified evolution surface.
- `AlembicPlugin/lib/runtime/mcp/host/opportunistic-evolution-presenter.ts:42-92` runs the same one-shot git scan after trigger tools and attaches `unifiedEvolution`.
- `AlembicPlugin/lib/recipe-generation/evolution/PluginOpportunisticEvolution.ts:235-246` lists the trigger tools, including `alembic_plan`, `alembic_rescan`, `alembic_submit_knowledge`, and `alembic_work`.

Compatibility duplicate path:

- `AlembicPlugin/lib/service/evolution/git-diff-checkpoint/GitDiffCheckpointService.ts:1-3` is an explicit RG9 compatibility re-export to `#recipe-generation/evolution/git-diff-checkpoint/GitDiffCheckpointService.js`.
- Sibling files under `AlembicPlugin/lib/service/evolution/git-diff-checkpoint/` carry the same compatibility note.
- `AlembicPlugin/test/unit/RecipeGenerationSkeleton.test.ts:20-47` still expects both old and new paths as part of the RG-0/RG9 migration skeleton.
- `AlembicPlugin/test/unit/GitDiffCheckpoint.test.ts:7-13` imports the real implementation from `lib/recipe-generation/evolution/git-diff-checkpoint/index.js`.

Conclusion for P3/G: the duplicate is not two independent implementations, but old-path compatibility wrappers plus the new implementation. P3/G must either remove the wrappers after a consumer sweep and test update, or keep them with a precise cleanup condition while adding durable checkpoint persistence. Changes only to the new path are insufficient if tests or legacy imports still assert the old path exists.

## Self-Check 3: Old `resolveActiveDimensions` Consumer Inventory

Finding: confirmed. Non-vendor consumers still exist.

Core public/export surface:

- `AlembicCore/src/domain/dimension/DimensionRegistry.ts:627` defines `resolveActiveDimensions`.
- `AlembicCore/src/domain/dimension/index.ts:15` exports it.
- `AlembicCore/src/dimensions.ts:15` exports it.
- `AlembicCore/src/workflows/capabilities/planning/dimensions/BaseDimensions.ts:11,72` wraps/delegates it.

Core runtime consumers:

- `AlembicCore/src/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts:49-53,223-224` imports and calls it to compute phase active dimensions from language/frameworks.
- `AlembicCore/src/service/panorama/DimensionAnalyzer.ts:18-22,141-156` imports and calls it. This is a Panorama consumer and is expected to disappear with P5/I1, not survive as a hidden dependency.

Plugin runtime consumers:

- `AlembicPlugin/lib/recipe-generation/plan-tool.ts:4-9,838-842` imports and calls it while collecting Plan ProjectContext analysis.
- `AlembicPlugin/lib/recipe-generation/host-agent-workflows/project-context-analysis.ts:2-8,313-315` imports and calls it for host-agent ProjectContext dimensions.

Alembic main runtime consumer:

- `Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts:2-11,215-219` imports and calls it when building ProjectContext workflow facts.

Tests that currently encode the old route:

- `AlembicCore/test/DimensionPlanningDynamicSignals.test.ts:405` compares signal-aware Swift dimensions against legacy `resolveActiveDimensions('swift')`.
- `AlembicCore/test/unit/DimensionAnalyzer.test.ts:16,62,73` uses it for Panorama dimension analyzer expectations.

Conclusion for P2/B/PD-2: deleting old `resolveActiveDimensions` requires a named-export sweep across Core, Plugin, Alembic main, tests, and vendor/release snapshot sync after source commits. A naive migration to signal-aware selection without feeding real domain signals will reduce dimension coverage; the requirement already calls this R6. Generation stages must consume confirmed Plan IDs instead of recalculating dimension scope through this old function.

## Plan Authority Consumer Inventory

Current drift is real and is code-backed:

- `AlembicCore/src/service/planLedger/planLedger.ts:113-151` builds `PlanIntent.dimensions` directly from `planningAids.recommendedDimensions`.
- `AlembicCore/src/service/planLedger/planLedger.ts:127-130` derives `selectedDimensionIds` from those recommended dimensions.
- `AlembicPlugin/lib/recipe-generation/plan-tool.ts:1651-1683` confirm builds a patch from `args.selectedDimensions`; stages are also derived from that selected subset.
- `AlembicPlugin/test/unit/AlembicPlanTool.test.ts:136-180` asserts planning aids contain recommended Swift dimensions, then confirms a plan with `selectedDimensionsFromDraft`.
- `AlembicPlugin/test/unit/AlembicPlanTool.test.ts:613-630` defines `selectedDimensionsFromDraft` by reading `sourceReports.planningAids.recommendedDimensions` and slicing to `count`.
- `AlembicPlugin/lib/runtime/mcp/tools.ts:222-229` describes `alembic_plan confirm` as confirming with `selectedDimensions`, and `alembic_bootstrap` output as "Confirmed Plan-selected dimension task list" at `:270-276`.
- `AlembicPlugin/lib/recipe-generation/plan-generation-gate.ts:223-235` presents `planGate.selectedDimensions`, module scope, scale, and coverage gaps to downstream generation tools.

Conclusion for P1/P2: `recommendedDimensions`, `dimensionOrder`, `subsetHints`, and selected/test dimensions may remain as source reports or execution overlays only. They cannot be the authoritative Plan intent source or shrink confirmed Plan. P1 must change Core Plan draft/ledger contracts and tests; P2 must change Plugin confirm/get/output and generation-gate consumption.

## Characterization Tests To Be Owned By Target Windows

These are required before or inside the first relevant product package. They are not completed by this controller document.

- Plugin P1/P2 tests: draft returns factual package/sourceReports without authoritative recommended/top intent; confirm requires full Agent-authored complete Plan payload; confirm does not shrink Plan to `selectedDimensions`; `testMode` and selected dimensions remain execution overlay only.
- Core P1/P2 tests: `buildPlanDraftInformationPackage` no longer maps recommended dimensions into Plan intent; PlanLedger persists full intent and projects generation-state read-time only; signal-aware dimension path is canonical and no-signal shrinkage is either prevented by real domain signals or not used for generation scope.
- Plugin/Core P3 tests: durable git diff checkpoint persistence, merge-base catch-up, no advance on skipped/failed routing, duplicate old path either removed after consumer sweep or explicitly covered.
- Plugin/Core P4 tests: source ref parse-error/missing does not clear refs; generated source refs are not fabricated from `sourceFile`; coverage matrix includes module x dimension; bad plan rows do not silently become empty draft.
- Dashboard/Alembic/Core P5 tests: Panorama code/routes/tests are deleted or retired without active consumers; DepGraphView pyramid is the primary ProjectContext module-dependency surface; knowledge coverage/Panorama UI is removed while other tabs remain.

## Forbidden Conclusions

- This P0 does not accept any implementation.
- This P0 does not prove product tests are already in place.
- This P0 does not authorize retaining recommendation/top-N as "auxiliary Plan" behavior.
- This P0 does not authorize deleting `architectureIntelligence` domain signals needed by Plan no-guess dimension relevance.
