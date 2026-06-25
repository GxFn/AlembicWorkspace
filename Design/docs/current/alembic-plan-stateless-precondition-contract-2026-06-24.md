# alembic_plan Stateless Precondition Contract — Requirement Design (Developer Decision, Strict)

Date: 2026-06-24
Status: **confirmed by user 2026-06-24**. This document is a **DEVELOPER DECISION** — every field, interface, deletion, relocation, rewire, and acceptance bar below is binding and must be executed exactly. The implementing window has no discretion to keep persistence under a new name, keep a removed field, add a global bag, change the contract shape, or rescope. Deviations require a new user/Design decision.
Owner Window: Design
Receiving Window: Wakeflow Controller
Design Key: alembic-plan-stateless-precondition-contract-2026-06-24

## Authority

1. Follows `alembic-mcp-clean-output-contract-2026-06-08.md` — minimal base + ONE output schema + ONE projector per tool; projector is the only path from handler internals to MCP output; no global field bag; no handler-internal passthrough. `alembic_plan` never followed this; that is the cause of the 4.5MB duplication.
2. **Supersedes** `alembic-plan-draft-pure-collection-2026-06-23.md`.
3. **Reverses** the "Plan = persisted living ledger" decision in `alembic-recipe-evolution-optimization-2026-06-21.md`. Plan is now STATELESS.
4. User decisions 2026-06-24 (below).

## FINAL GOAL

`alembic_plan` is a **stateless precondition run before EACH cold-start / deep-scan / module-scan**. For that single run it hands the Agent (1) a **byte-budget-bounded project-info pyramid** (inline, with the full tree available in a transient file on demand) and (2) **all candidate dimensions with a per-dimension mining guidance**; the Agent **selects the dimensions + scale** for that one run; `confirm` validates the selection and returns a **`planSelection`** that the execution tool consumes as a hard precondition. **Nothing is persisted** (the transient tree file is transport, not plan state). Durable artifacts are the Recipes (knowledge store). Adding dimensions/scale later = running `alembic_plan` again before the next execution.

## Confirmed Decisions (2026-06-24) — binding

1. **Stateless.** Delete the entire plan persistence layer (`plans` table + migration, `PlanRepository`, the `PlanLedgerService` persistence methods, the `get` operation, signature/version/supersede).
2. **draft = two blocks only:** `projectInfoTree` (budget-bounded pyramid, two-part delivery) + `candidateDimensions[]` (each with `miningGuidance`). Nothing else.
3. **Single-stage `planSelection`.** Because plan runs once per execution, a plan run targets exactly ONE stage. `confirm` and `planSelection` carry `{generationStage, dimensions[], scale, moduleBindings[]}` — NO `stages{coldStart,deepMining,moduleMining}` nesting, NO per-dimension `stage`, NO `scale.perStage`.
4. **confirm does NOT re-analyze.** `projectProfile` is carried in the confirm input (the Agent passes it from the draft's pyramid L0 root). `confirm` is pure validation; it does not re-collect ProjectContext.
5. **`confirm` returns `planSelection`** (validated, in-memory, NOT persisted); the Agent passes it to the executor.
6. **SOP + missionBriefing leave the plan** — fixed bindings derived from the selected dimensions at generation (`SOP = (dimensionId, language) → FullSop` via `getDimensionSOP`; `missionBriefing = buildProjectContextMissionBriefing(selectedDimensions,…)` at cold-start).
7. **Generation-state / coverage projection is RELOCATED, not deleted.** The pure projection engine (coverage / codeRecipeMapping / proposals pass-through) is decoupled from plan and moved to a Recipe-domain module, preserved for a future "Recipe status/coverage" query. Evolution proposals stay on Recipes.
8. **Wiring:** `alembic_bootstrap` / `alembic_rescan` take a required `planSelection` input; the gate's storage-read is deleted.
9. **draft = two-part delivery (so it always returns inline).** Inline `projectInfoTree` byte budget = **12 KB** (`12288`) → whole draft ≈ 18 KB, comfortably inside the MCP tool-result inline limit. When the full tree exceeds the inline budget, the COMPLETE tree is written to a **transient transport file** referenced by `projectInfoTree.meta.fullTreeRef`; the Agent drills it on demand. (A 56 KB BiliDili draft previously overflowed and was auto-saved by the framework — this makes the split deliberate and the inline part always usable.)
10. **git-diff checkpoint** baseline seeds from the **current git HEAD** (`source:'current-head'`), replacing the deleted active-confirmed-plan read.
11. `miningGuidance` = the dimension's static `extractionGuide`. `candidateDimensions` = all 25 registry dims, each tagged `languageApplicable` true/false (transparent; nothing hidden).

---

## SECTION 1 — Exact Contract (every field, every interface)

### 1.1 Shared base
`{ ok: bool, operation: "draft"|"confirm", status: string, summary: string, projectRoot: string, meta: {contractVersion, outputSchema, projector:"core-tools-clean-output-projector", toolName:"alembic_plan"} }`. No `planId`/`version`/`projectContextSignature`.

### 1.2 `draft` result — exactly two blocks

**① `projectInfoTree`** — **two-part delivery**: an inline budget-bounded upper pyramid plus, only when truncated, a transient full-tree file the Agent can drill. Built top-down from already-collected ProjectContext (source: `analysis.presenterInput`; module/file walk exists in `collectModuleSnapshots`, `AlembicPlugin/lib/recipe-generation/plan-tool.ts:1650-1694` — NO new query).
Levels (filled top→bottom, upper first so always present):
- **L0 root**: `{ projectType, primaryLanguage, secondaryLanguages[], frameworks[], moduleCount, fileCount }`
- **L1 modules**: `{ path, kind:"module"|"package", role, language, fileCount, keyDependencies[] }` from `ProjectMap.modules` (`ModuleSummary`, `AlembicCore/src/domain/project-context/ProjectContextMap.ts:155-164`) + `dependencySummary`/`majorFlows`
- **L2 files**: `{ path, kind:"file", language, lineCount }` per module from `ModuleContext.ownedFiles` (`FileSummary`, `ProjectContextRefs.ts:24-32`)
- **L3 symbols**: key public surfaces per file from `ModuleContext.publicSurfaces` (`SymbolSummary`)
Construction = **budget-bounded breadth-first by level** (complete L0+L1 before any L2, L2 before any L3) against the **inline byte budget = 12 KB** (§"Resolved: draft size"). Nodes carry `children: Node[]`.
- **Inline part** = the upper pyramid that fits the budget. `projectInfoTree.meta = { budgetBytes:12288, deliveredDepth:"modules"|"files"|"symbols", truncated:bool, omitted:{modules?,files?,symbols?}, fullTreeRef:{path,bytes}|null }`.
- **File part** = ONLY when the full tree exceeds the inline budget (`truncated:true`): write the COMPLETE tree (all levels, no budget) to a **transient transport file** (e.g. `<dataRoot>/.asd/tmp/plan-tree-<projectHash>.json`, overwritten each draft — transport, NOT plan state) and set `fullTreeRef`. When the full tree fits inline (small project) it is fully inline and `fullTreeRef:null`.
The Agent plans from the inline upper pyramid and reads `fullTreeRef.path` only when it needs deeper structure.

**② `candidateDimensions[]`** — all 25 registry dims, four fields each.
Item: `{ id, label, layer: "universal"|"language"|"framework", languageApplicable: bool, miningGuidance: string }`.
Build: `DIMENSION_REGISTRY` (`AlembicCore/src/domain/dimension/DimensionRegistry.ts:551`) `.map(d => ({ id: d.id, label: d.label, layer: d.layer, languageApplicable: resolveDimensionLanguageApplicability(d, facts).applicable, miningGuidance: d.extractionGuide }))`. `resolveDimensionLanguageApplicability` = `DimensionCatalogPayload.ts:138-176` (pure factual match). `extractionGuide` = `UnifiedDimension.ts:30`. **Do NOT ship `sop`/`analysisGuide`/`submissionSpec`/`matchTopics`/`weight`.** All 25 returned, tagged (nothing hidden).

Plus `agentDecisionChecklist: string[]` and `nextActions: [{ tool:"alembic_plan", operation:"confirm" }]`.

### 1.3 `confirm` — single-stage, stateless validate, return `planSelection`
Input: `{ generationStage: "coldStart"|"deepMining"|"moduleMining", projectProfile (carried from draft L0 root), selectedDimensions[]{dimensionId, priority, rationale, targetRecipes}, scale{totalRecipeBudget, depthLevels[], maxFiles, contentMaxLines}, moduleBindings[]{modulePath, dimensions[], targetRecipes, priority}, plannedNextActions[]{tool, order, reason, modulePaths[]}, rationale, evidenceRefs[] }`. (No per-dimension `stage`; no `stages{}`; no `scale.perStage`.)
Validation: an adapted single-stage `validateCompletePlanIntent` (preserved from `PlanRepository.ts:304-372`, stages/perStage checks removed) + `normalizeConfirmedDimensions` (`plan-tool.ts:1268-1302`) + `resolvePlanDimensionDefinitions(...).missingDimensionIds` (`plan-tool.ts:1206`). **In-memory: no draft read, no DB write, no ProjectContext re-collection.**
Result: base + `status:"confirmed"` + `planSelection: { generationStage, dimensions[], scale{totalRecipeBudget,maxFiles,contentMaxLines,depthLevels}, moduleBindings[] }`.

### 1.4 Output schema (allow-list — the de-facto contract)
Edit `CORE_TOOL_ALLOWED_BUSINESS_FIELD_NAMES.alembic_plan` at `AlembicPlugin/lib/runtime/mcp/core-tools/output.ts:217-232`. **Remove:** `plan`, `planState`, `planView`, `planningBrief`, `sourceReports`, `projectContextCreationGuide`, `projectContextSignature`, `currentProjectContextSignature`, `signature`. **Add:** `projectInfoTree`, `candidateDimensions`, `agentDecisionChecklist`, `planSelection`. (`fullTreeRef` lives inside `projectInfoTree.meta`, not a new top-level key.) `createCoreToolOutputSchema` (`output.ts:433-453`) is `.strict()` — unlisted keys throw; the generic projector (`output-contract.ts:64-97`) is unchanged.

### 1.5 Input schema — required single-stage `planSelection` on the executors
`AlembicPlugin/lib/shared/schemas/mcp-tools.ts`: add a required `planSelection: { generationStage, dimensions: string[], scale:{maxFiles,contentMaxLines,totalRecipeBudget}, moduleBindings[]{modulePath,dimensions[],targetRecipes,priority} }` to `BootstrapInput` (`:1047-1079`) and `RescanInput` (`:1107-1156`). These Zod schemas are advertised in `tools/list` only and NOT parsed at dispatch (`McpServer.ts:415-422` casts untyped) — so **validate `planSelection` explicitly at the gate entry** (`resolvePlanGenerationGate`), not via the schema alone.

---

## SECTION 2 — Exact Deletion Set (delete exactly these)

### Core (`AlembicCore`)
- `src/repository/plan/PlanRepository.ts` (delete the file after extracting Section 3 pure fns) + `src/repository/plan/index.ts`.
- `src/infrastructure/database/migrations/012_plans.ts` (delete file; runner is dynamic `readdirSync().sort()` + gap-tolerant, `DatabaseConnection.ts:125-193` — no static index, no reverse migration, no 013 renumber).
- `src/infrastructure/database/drizzle/schema.ts:444-474` (the `plans` block + 3 inline indexes).
- `src/repositories.ts` plan lines: `:72, :165, :176, :208, :225, :249`.
- `src/plans.ts`: `export { PlanRepositoryImpl }` (`:1`) + persistence-only type re-exports.
- `src/service/planLedger/planLedger.ts`: the `PlanLedgerService` persistence methods (`saveDraft :68`, `confirmPlan :72`, `getPlanView :76`, `getActivePlanView :88`) + the `planRepository` member/import (`:36-38, :2`).
- `src/service/planLedger/contracts.ts`: persistence-coupled types (`PlanStatus :1`, `SavePlanDraftInput :109-119`, `PlanChangeLogEntry :83-88`, persistence fields of `PlanRecord :90-107`).

### Plugin (`AlembicPlugin`)
- `lib/injection/modules/InfraModule.ts:154-156` (planRepository singleton) + `lib/injection/ServiceMap.ts:46, :102`.
- `lib/recipe-generation/plan-generation-gate.ts`: `readConfirmedPlanGateResponse` (`:116-182`) + the `routePlanTool` import (`:2`).
- `lib/recipe-generation/plan-tool.ts`: the DB calls `savePlanDraft` (`:446-460`), `saveConfirmedPlan` (`:642-661`), `createPlanLedgerService`/`resolvePlanRepositories` (`:1106-1130`), confirm draft reads + `getPlanView` (`:202, :236`), `getPlan` storage reads (`:703-705, :739, :744`); the redundant draft builders `sourceReports` block (`:397-401`), `onboardingContract`+`summarizeOnboardingContract` (`:388-390, :1581-1605`), `buildMissionBriefingForDraft`/`buildOnboardingContractForDraft` (`:347-373`), `buildProjectContextFactPackage.envelopes`+`.presenterInput` (`:1544, :1556`), full per-dim `sop`/`analysisGuide`/`submissionSpec` (`:405-420`).

---

## SECTION 3 — Exact Preserve / Relocate Set

- **Extract + preserve (pure, load-bearing)** from `PlanRepository.ts` into a new pure module before deleting the file: `validateCompletePlanIntent` (`:304-372`, **adapt to single-stage** — drop stages/perStage checks), `hasPositiveStageBudget` (`:374-380`), `unique` (`:382-384`), `normalizeConfirmedPlanIntent` (`:287-302`).
- **Relocate (decision #7)** the pure projection engine out of `planLedger.ts` into a Recipe-domain module (e.g. `src/service/recipeStatus/`), decoupled from plan, preserved for the future Recipe-status query: `projectPlanGenerationStateFromRecords` (`:172-260`), `buildCoverage` (`:303-433`) + helpers (`:435-527`), `computeProjectContextSignature` (`:262-289`), `compareProjectContextSignature` (`:291-301`), `buildPlanDraftInformationPackage` (`:114-150`), and the `PlanIntent`/`PlanView`/coverage contract types. Real Recipe-domain logic awaiting a consumer — NOT dead-code-under-a-new-name; this requirement does not wire its new consumer.
- Keep untouched: `DIMENSION_REGISTRY`, `resolveDimensionLanguageApplicability`, `UnifiedDimension.extractionGuide`, `getDimensionSOP`, `buildProjectContextMissionBriefing`, ProjectContext `space`/`map`/`module` handlers.

---

## SECTION 4 — Exact Rewire Set

### 4.1 Execution gate — `plan-generation-gate.ts`
Delete the storage-read (`readConfirmedPlanGateResponse :116-182`) + `routePlanTool` import. `buildPlanGenerationGateReady` (`:184-252`) + selectors read the passed single-stage **`planSelection`**: `selectPlanDimensions` (`:444-488`) → `planSelection.dimensions` directly (no `stages[stage]` indexing); `selectPlanModuleScope` (`:504-541`) → `planSelection.moduleBindings`; `resolvePlanScale` (`:543-571`) → `planSelection.scale.{totalRecipeBudget,maxFiles,contentMaxLines}`. `resolvePlanCleanupPolicy` (`:573-586`) unchanged. `applyPlanGateToProjectAnalysisIntent` (`:359-371`) unchanged. "No active confirmed plan" block becomes "no valid `planSelection`" (refuse with a `PLAN_REQUIRED`-style block pointing to `alembic_plan`). Validate `planSelection` at gate entry.

### 4.2 git-diff checkpoint (decision #10)
Replace the `Pick<PlanRepositoryImpl,'getActiveConfirmed'>` dependency in `GitDiffCheckpointService` (`AlembicCore/src/service/evolution/GitDiffCheckpointService.ts:7, :22, :61, :65, :72, :96`) and its Plugin wiring (`lib/recipe-generation/evolution/git-diff-checkpoint/DurableGitDiffCheckpointRouting.ts:53-65`) with a `getBaselineCommit(projectRoot): string|null` provider returning current git HEAD. The baseline `source` label becomes `'current-head'`. Do NOT silently drop it to `'empty'`.

### 4.3 Job path — `alembic_job` must forward `planSelection`
`HostMcpServer.enqueueJob` (`lib/runtime/mcp/host/HostMcpServer.ts:733-799`) currently passes almost no args (bootstrap `:766-768` none; rescan `:769-781` only `{reason,dimensions}`) — it MUST forward `planSelection`.

### 4.4 Tool text
`tools.ts:222,270,285`, `PluginToolSurfaceCatalog.ts:198-199`, `ToolPolicy.ts:93`, `OnboardingContract.ts:22` — rephrase "requires an active confirmed Plan" → "requires a `planSelection` from a just-run `alembic_plan`".

---

## SECTION 5 — Phases (tasks + acceptance pass criteria, strict)

### P0 — Delete persistence + extract/relocate the engine (AlembicCore + Plugin DI)
Tasks: extract Section-3 preserve fns to `planIntent.ts`; relocate the projection engine to the Recipe-domain module (decision #7); delete the Section-2 Core items + Plugin DI.
**PASS criteria:** (a) `rg -n "PlanRepository|planRepository|saveDraft|getActiveConfirmed|getPlanView|sqliteTable\('plans'|012_plans"` over `AlembicCore/src` + `AlembicPlugin/lib` (excl. tests) = **0** production hits; (b) `validateCompletePlanIntent` (single-stage) + the relocated projection engine are exported from their new homes and import-clean; (c) `npm run build` (Node 22) + typecheck + lint **green** in both repos; (d) no orphan import of deleted symbols.

### P1 — Stateless two-part `draft` (AlembicPlugin + Core tree accessor)
Tasks: `draftPlan`/`planDraftResponse` no longer persist; return exactly `{projectInfoTree, candidateDimensions, agentDecisionChecklist, nextActions}` + base; build `projectInfoTree` as the **two-part budget-bounded pyramid** (§1.2, inline budget 12288) — inline upper pyramid + transient full-tree file with `meta.fullTreeRef` when truncated; build `candidateDimensions` from the registry (§1.2); delete the redundant builders; edit the output allow-list (§1.4).
**PASS criteria:** (a) live `alembic_plan draft` on BiliDili returns **inline (NOT auto-saved by the framework)**, ONLY the two blocks (+ base/checklist), total ≤ ~20 KB; (b) `projectInfoTree.meta` has `budgetBytes:12288`, `deliveredDepth`, `truncated`; when truncated, `fullTreeRef:{path,bytes}` points to a **readable transient file holding the COMPLETE tree**; when not truncated (small project) the tree is full inline and `fullTreeRef:null`; (c) BiliDili (163 files) returns inline with a valid `fullTreeRef`; a small project returns full inline with `fullTreeRef:null`; (d) `candidateDimensions` = all 25, each with non-empty `miningGuidance` + a `languageApplicable` bool; (e) `rg` over the inline response shows NO `presenterInput`/`envelopes`/`sourceReports`/`missionBriefing`/`onboardingContract`/`sop`; (f) the clean-output projector test passes; (g) the full-tree file is transient transport (overwritten per draft, not a plan record).

### P2 — Stateless single-stage `confirm` → `planSelection` (AlembicPlugin)
Tasks: `confirm` reads no draft, writes no row, does not re-collect ProjectContext; `projectProfile` from input; adapted single-stage `validateCompletePlanIntent`; return `planSelection`.
**PASS criteria:** (a) an incomplete payload is rejected with explicit field errors (missing rationale / targetRecipes≤0 / no dimensions / no totalRecipeBudget / binding references unknown dimension); (b) a complete payload returns `planSelection{generationStage,dimensions,scale,moduleBindings}` and **writes nothing** (`rg` no DB call in confirm); (c) confirm performs **no** second ProjectContext collection (unit test asserts the analysis collector is not invoked); (d) build/typecheck/lint green.

### P3 — Wire executors to require `planSelection` (AlembicPlugin)
Tasks: add required `planSelection` to `BootstrapInput`/`RescanInput`; delete the gate storage-read; gate selectors read `planSelection`; validate at gate entry; forward through `alembic_job`.
**PASS criteria:** (a) `alembic_bootstrap`/`alembic_rescan` WITHOUT `planSelection` refuse with a `PLAN_REQUIRED`-style block naming `alembic_plan` (no scan runs); (b) WITH `planSelection` they run using its `dimensions`/`moduleBindings`/`scale`, and `maxFiles`/`contentMaxLines` come from `planSelection.scale` (non-test no longer hardcoded 500/120 — proven by passing a distinct value and observing it honored); (c) the `alembic_job` bootstrap/rescan path forwards `planSelection`; (d) `rg` confirms the gate no longer imports/calls `routePlanTool`.

### P4 — Checkpoint rewire + SOP/missionBriefing derivation (AlembicCore + AlembicPlugin)
Tasks: rewire `GitDiffCheckpointService` to `getBaselineCommit=HEAD` (§4.2); confirm generation derives `SOP` via `getDimensionSOP(dim,lang)` + `missionBriefing` via `buildProjectContextMissionBriefing(selectedDimensions,…)` from the selection.
**PASS criteria:** (a) checkpoint init works with no plan storage, baseline `source:'current-head'` (test asserts the label + a real HEAD sha), never `'empty'` when HEAD exists; (b) cold-start builds SOP + missionBriefing from `planSelection.dimensions` (not from any plan record); (c) the plan output carries neither SOP nor missionBriefing; (d) build green.

### P5 — Test rewrites + real-project e2e (AlembicCore/AlembicPlugin + Test)
Tasks: rewrite/edit the locked suites — Core `PlanLedgerProjection.test.ts` (keep pure-projection sub-tests against the relocated engine, drop persistence ones), `GitDiffCheckpointRepository.test.ts` (HEAD baseline), edit `DatabaseRepository.test.ts`/`MigrationsRerunIdempotency.test.ts`/`PublicDatabaseRepositoryEntrypoints.test.ts` (remove `plans`/`012_plans`/`planRepository` assertions); Plugin `AlembicPlanTool.test.ts`/`PlanDrivenGenerationGate.test.ts`/`GitDiffCheckpoint.test.ts`. Test window runs BiliDili e2e.
**PASS criteria:** (a) every named suite **green**; (b) BiliDili e2e proves `plan draft → confirm → bootstrap/rescan(planSelection)` with raw MCP payloads attached; (c) the draft inline payload ≤ ~20 KB with a working `fullTreeRef`; (d) a DB inspection after a run shows **no `plans` table**; (e) raw evidence (commit hashes, exact commands, payloads) recorded.

Sequencing: P0 → (P1 ∥ P2) → P3 → P4 → P5.

## Resolved: draft size = inline budget + full-tree file (two-part)
The `draft` inline response must fit the MCP tool-result inline limit (a 56 KB BiliDili draft overflowed and was auto-saved by the framework). So `projectInfoTree` is delivered in two parts (§1.2):
- **inline** = the budget-bounded upper pyramid. **Inline byte budget = 12 KB (`12288`)** → total draft ≈ 18 KB (tree 12 KB + `candidateDimensions`/base ≈ 6 KB) — comfortably inline (the 56 KB overflow point is ~3×).
- **file** = ONLY when truncated, the COMPLETE tree to a transient transport file referenced by `meta.fullTreeRef`.
`candidateDimensions` (fixed ~25) is always full inline. This keeps every draft inline + small while never losing detail (the Agent drills the file on demand).

## Non-Goals / Forbidden (strict)
- No plan persistence under any new name; no `plans` table; no `get` reading storage; no signature/version/supersede; no `stages{}`/`perStage` in the stateless contract.
- The transient full-tree file is **transport only** — per-draft, overwritten, NOT a plan record; must not become a persistence backdoor.
- No SOP/missionBriefing/projectContext-dump/sourceReports/onboardingContract in the plan output; no global field bag; no handler-internal passthrough; no recommendation/top-N/fallback.
- Do not delete DimensionRegistry/domain-signals/ProjectContext handlers/`getDimensionSOP`/`validateCompletePlanIntent`/the projection engine (relocate the engine, don't delete).
- Do not silently change the git-diff checkpoint baseline to `'empty'`.

## Controller Stop Conditions
- Stop if any plan output ships a removed field; if persistence (or the transient tree file) is used as a plan record; if the projection engine is deleted instead of relocated; if `bootstrap`/`rescan` still read a stored plan; if the checkpoint baseline drops to empty; if a target result lacks commit hash + exact tests + rg/import evidence + raw acceptance payload.
