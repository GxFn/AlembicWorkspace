# alembic_plan draft Pure-Collection Redesign — Requirement Design

Date: 2026-06-23
Status: **confirmed by user request 2026-06-23**. Refines the recipe no-guess line so that `alembic_plan draft` becomes a pure material collector for the Agent.
Owner Window: Design
Receiving Window: Wakeflow Controller
Design Key: alembic-plan-draft-pure-collection-2026-06-23

## Authority

This document does **not** invent new Recipe semantics. Authority remains:

1. `Design/docs/current/alembic-recipe-evolution-optimization-2026-06-21.md` (ProjectContext → Plan → Recipe; Plan-centralized; no guessing).
2. `Design/docs/current/alembic-recipe-plan-no-guess-correction-2026-06-22.md` (Plan is complete authoritative; Plugin collects + Agent decides; no recommendation/top/subset/fallback).
3. User decisions in the 2026-06-23 Design session recorded below.

**Supersession (explicit):** This requirement **reverses Group B1/B2** of the just-accepted `alembic-recipe-no-guess-residual-gap-closure-2026-06-23` (which made `decideDimension` domain-signal relevance a first-class gate and minimized `FOUNDATIONAL_DIMENSIONS`). The user has decided that draft must **not** run signal/complexity/foundational relevance judgment at all. F5 / G3 / J / Panorama-residual from that demand are **unaffected** and stay as accepted.

## Confirmed Goal

`alembic_plan draft` exists for one reason: it is the **necessary precondition for cold-start**. It must hand the Agent the raw material to author a **valuable Plan**, then get out of the way. The Agent — not the Plugin/Core — makes the planning judgments.

A valuable Plan = the Agent decides **(1)** which dimensions are worth generating Recipes for (drop the irrelevant) and **(2)** roughly how many Recipes each dimension yields (scale estimate). draft must therefore supply, completely and faithfully, the two material pillars the Agent needs:

| Pillar | Content | Whose information |
| --- | --- | --- |
| **A. Project facts** | The real target project: modules, architecture, dependencies, file/symbol structure, complexity hotspots, languages/frameworks — the full untrimmed ProjectContext. | Target project |
| **B. Conversion knowledge** | Alembic's built-in "group project info by dimension, convert each group into Recipes" knowledge = the full dimension catalog + each dimension's SOP. | Alembic built-in |

The current implementation fails the goal in three ways the user named ("codex doesn't understand the target, just sees code, assembles mindlessly"): it **steals the Agent's judgment** (Plugin/Core pre-filter dimensions by signal/complexity), **starves both pillars** (2 of 25 dimensions, no SOP, projectContext trimmed to counts), and **adds speculative abstraction** (planningAids/summarize wrappers).

## Confirmed Decisions (2026-06-23 session)

1. **Plan meaning.** The Plan's value is the Agent's two judgments (drop irrelevant dimensions + per-dimension Recipe scale). Both belong to the Agent. draft supplies material, never makes these judgments.
2. **Filtering boundary — fact vs judgment.** draft keeps **only a factual `languageApplicable` tag** (does the project's language/framework set intersect the dimension's language/framework scope; universal dimensions are always applicable). It is **transparent**: all dimensions are still returned, tagged — nothing is silently dropped. draft **deletes all judgment-type filtering** (domain-signal relevance, complexity scoring, foundational forcing, scale estimation). Relevance and scale are the Agent's.
3. **Orphaned project-intelligence pipeline.** `ProjectIntelligenceRunner` (Phase 1–4 analysis pipeline) is orphaned dead code; `ProjectContext` is the single live project-info source for cold-start/incremental. It is in scope to delete — surgically, preserving the live shared types it is tangled with.
4. **code-entity / call-graph materialization.** `ProjectContext` covers the live project-fact need independently; the persistent `CodeEntityGraph` materialization has no live writer and no live reader. It is to be deleted completely.

## Current Verified Evidence (raw-code facts, this Design session)

### Draft judgment-filter (P0a deletion targets)

| Symbol | Location | Role | Action |
| --- | --- | --- | --- |
| `resolvePlanningAidActiveDimensions()` | `AlembicPlugin/lib/recipe-generation/plan-tool.ts:305-309` | filters draft dimensions to active-only | delete |
| draft filter overwrite | `plan-tool.ts:250` (`buildDraftPlanningAids` call) + `:253` (`dimensions:` overwrite) | applies the selection | delete the filter |
| `summarizePlanningAids()` | `plan-tool.ts:1397-1431` | emits `activeDimensionIds`/`skippedDimensionIds` split | delete the split |
| `summarizeProjectContext()` | `plan-tool.ts:1376-1395` | trims ProjectContext to ~10 summary fields, drops `presenterInput` | replace with full passthrough (P1) |
| `summarizeMissionBriefing()` | `plan-tool.ts:1455-1465` | trims full briefing to 5 counts | replace with full passthrough (P1) |
| `decideDimension()` + helpers | `AlembicCore/src/service/project-context/dimensionPlanning/dimensionPlanning.ts:388-525` (+ `evaluateLanguageCondition:527-543`, `evaluateFrameworkCondition:545-587`, `buildDecision:589-607`, `hasComplexitySignal:817-826`, `complexityConfidence:828-839`) | scores dimension relevance by language/framework/domain-signal/complexity | delete the **judgment** (domain-signal/complexity/foundational); the factual language/framework match may be repurposed as the P2 `languageApplicable` tagger |
| `resolveSignalAwareActiveDimensions()` | `dimensionPlanning.ts:74-111` | applies the relevance gate | delete |
| `MINIMAL_FOUNDATIONAL_DIMENSIONS` + gate | `dimensionPlanning.ts:36` + `:431` | force-activates `architecture` | delete |
| old `resolveActiveDimensions` (language/framework-only) | `AlembicCore/src/domain/dimension/DimensionRegistry.ts:632` + exports `domain/dimension/index.ts:16`, `src/dimensions.ts:16` | legacy resolver | delete if still residual |

### Orphaned project-intelligence pipeline (P0b)

- `runAllPhases` has **zero live runtime callers**: the only `ProjectIntelligenceCapability.run(` call is the module's own self-call at `AlembicCore/src/workflows/capabilities/project-intelligence/ProjectIntelligenceCapability.ts:70`, which carries the comment "4-repo + Core-internal scan found zero consumers (2026-06-12)".
- Live cold-start (`AlembicPlugin/lib/recipe-generation/host-agent-workflows/cold-start.ts:127-183`) gets project info **only** from `buildHostAgentProjectContextAnalysis` (`:154`) → `ProjectContextCapabilities.execute` (ProjectContext). It never calls `runAllPhases`. File header: "项目信息由 ProjectContext 直接提供，不再经过旧 snapshot 兼容载体." Incremental/rescan is parallel (`knowledge-rescan.ts:165`).
- Empirical proof ProjectContext is self-sufficient without the runner: the user's live draft output returned `projectContext.contextStatus=complete`, `fileCount=127`, real language/type — produced today with the runner already not running.
- Materializers `populateFromAst` / `populateCallGraph` / `populateFromSpm` (`AlembicCore/src/service/project-intelligence/AnalysisPhaseRunners.ts`) are called **only** by the dead runner (sweep [Q] found no other production caller).

### ProjectContext covers code-entity/call-graph (P0b — CodeEntityGraph delete)

- ProjectContext handlers (`AlembicCore/src/service/project-context/{fileSymbols,fileFlow,map,module,moduleLayers}`) do **not** reference `CodeEntityGraph` / `knowledge_edges` (grep over `domain/project-context` + `service/project-context` returned empty) — they compute structure facts on-demand from source.
- `CodeEntityGraph` (`AlembicCore/src/service/knowledge/CodeEntityGraph.ts`) DI singleton is registered (`AlembicPlugin/lib/injection/modules/KnowledgeModule.ts:133`) but **never resolved** from the container (all `codeEntityGraph` references are the `.codeEntityGraph` snapshot/report **field**, not the service).
- Its only query reader is `WorkflowReportWriter.attachCodeEntityGraphTopology` → `ceg.getTopology()` (`AlembicCore/src/workflows/capabilities/persistence/WorkflowReportWriter.ts:371`), on the dead `runAllPhases → report-persistence` path. Impact queries (`getImpactRadius`/`getCallers`/`getCallees`/`getInheritanceChain`) have **zero** live consumers.
- **Verdict: ProjectContext covers it; CodeEntityGraph materialization is deletable completely.**

### Live shared types tangled in the dead neighborhood (must preserve / rehome — do NOT blind-delete)

- `AlembicCore/src/types/ProjectSnapshot.ts` exports **`DimensionDef`, `ProjectSnapshot`, `GuardAudit`** consumed by ~10 **live** host-agent files (`MissionBriefingBuilder`, `SessionSupport`, `BootstrapSession`, `EvidenceStarterBuilder`, `HostAgentDimensionCompletionWorkflow`, `host-agent-workflows.ts` barrel, etc.). Deleting this module would break the live briefing path. The still-needed types must be **rehomed to a clean module**; only the dead-only types (e.g. `CodeEntityGraphResult`) drop.
- `incrementalPlan` threads into live `MissionBriefingBuilder:1090-1113` + persistence (`WorkflowReportWriter`, `WorkflowSnapshotStore`) + evolution `RecipeImpactPlanner` — verify dead/always-null on the live path before removal.

## Phase Plan (independently isolated, each with a hard quality gate)

Each phase is independently verifiable and **gated**: the next phase does not start until the gate passes by raw-evidence inspection. This directly prevents "draft returns substandard info but work proceeds anyway."

### P0a — Delete the draft judgment filter (clean slate, part 1)

- **Outcome:** No relevance/complexity/foundational/scale judgment remains in the draft path. After P0a draft returns all dimensions unfiltered (structuring/SOP come in P1/P2).
- **Code:** Delete the P0a symbols in the evidence table (Plugin `plan-tool.ts` planningAids filter + active/skip split; Core `dimensionPlanning.ts` `decideDimension` judgment + `resolveSignalAwareActiveDimensions` + `MINIMAL_FOUNDATIONAL_DIMENSIONS`; residual `resolveActiveDimensions`). Sever/migrate the in-repo callers (`project-context-capabilities.ts:83,117-118`) so build stays green; `ProjectIntelligenceRunner.runPhase4` usage dies with the runner in P0b.
- **Forbidden:** do not rename the judgment into an "auxiliary" path; do not keep a threshold/scoring field under a new name.
- **Gate:** `rg` shows **zero production residue** of the deleted judgment symbols (one surviving production call = fail); `build`/`typecheck`/`lint` green; `alembic_plan draft` still callable.

### P0b — Delete the orphaned project-intelligence pipeline + CodeEntityGraph (clean slate, part 2)

- **Outcome:** The dead `runAllPhases` analysis pipeline and the `CodeEntityGraph` materialization are gone; live shared types are preserved/rehomed; ProjectContext remains the single project-info source.
- **Code (delete, after per-file import-sweep confirms dead):** `src/workflows/capabilities/project-intelligence/` dead execution (`ProjectIntelligenceRunner`, `ProjectIntelligenceCapability`, `ProjectIntelligenceIncrementalPlanner`, `ProjectIntelligencePreparation`, `ProjectIntelligenceResultProjection`, `FileDiffPlanner`, `FileDiffSnapshotStore`, `IDEAgentAnalysisPacketBuilder`, `index.ts`); `src/service/project-intelligence/AnalysisPhaseRunners.ts`; `src/service/knowledge/CodeEntityGraph.ts` + `service/knowledge/index.ts` export + `repository/code/CodeEntityRepository.ts` (if exclusive); Plugin DI `KnowledgeModule.ts:133` + `ServiceMap.ts:126`; `WorkflowReportWriter.attachCodeEntityGraphTopology` (+ `report.codeEntityGraph`); the `codeEntityResult`/`summarizeEntityGraph` field path in `MissionBriefingBuilder`.
- **Code (preserve / rehome):** the live types `DimensionDef`/`ProjectSnapshot`/`GuardAudit` from `types/ProjectSnapshot.ts` to a clean types module; fix all live imports.
- **Mandatory sweep gates (the workspace deletion protocol — done by the implementing window with build verification):** confirm dead before delete for `ColdStartPresenters` / `KnowledgeRescanPresenters` (ProjectSnapshot presenters — verify cold-start.ts/knowledge-rescan.ts do not call them), `incrementalPlan` (always-null on live path?), `WorkflowResultPersistence`/`writeWorkflowReport` (any live caller? — if it persists other live report content, remove only the entity-topology attach), and that ProjectContext does not silently depend on a populated SourceGraph index that only the dead runner filled.
- **Forbidden:** do not delete `DimensionDef`/`ProjectSnapshot`/`GuardAudit` as if residual; do not delete ProjectContext graph/module/domain-signal capabilities.
- **Gate:** `rg` zero production residue of the dead set; **every live consumer of the rehomed types compiles**; `build`/`typecheck`/`lint` green; no live capability silently dropped (any capability question — e.g. entity-graph — recorded as retired, not silently removed).

### P1 — Pillar A: faithful project facts

- **Outcome:** draft returns the complete, untrimmed `presenterInput` (project/repo/map/modules/file-flow/file-symbols/warnings) plus the real project-side facts from the Core mission briefing (ast/architectureOverview/callGraph/dependencyGraph/guardFindings/mustCoverModules); raw domain/complexity/dynamic signals included **as facts** (no relevance verdict).
- **Code:** replace `summarizeProjectContext`/`summarizeMissionBriefing` (deleted in P0a's trim removal) with full passthrough; keep `buildProjectContextMissionBriefing` (Core capability) and surface its facts.
- **Gate:** on BiliDili, the raw draft payload contains real modules, real file structure, real dependency/architecture facts — no field reduced to a count. **Bar: an Agent reading only Pillar A can describe what the project is.** Substandard → fix before P2.

### P2 — Pillar B: all dimensions + SOP + factual language tag

- **Outcome:** draft returns the full dimension catalog (`DIMENSION_REGISTRY`, all 25: 13 universal + 7 language + 5 framework), each with its full SOP (`getDimensionSOP` — focusKeywords/steps[phase,action,expectedOutput,tools,qualityChecklist]/timeEstimate/commonMistakes) + analysisGuide/submissionSpec, and a **factual** `languageApplicable` tag (project languages/frameworks ∩ dimension scope; universal always applicable). No active/skip, no ranking, no scale.
- **Code:** return `DIMENSION_REGISTRY` (from `AlembicCore/src/domain/dimension/DimensionRegistry.ts:551-582`); per dimension attach `getDimensionSOP()` (`DimensionSop.ts:1749`); compute `languageApplicable` with a thin factual matcher (may reuse the factual language/framework match extracted from the old `decideDimension`, stripped of all scoring/threshold/foundational/complexity).
- **Gate:** raw payload has **every** dimension, each with non-empty SOP steps, each tagged `languageApplicable` purely by language/framework fact. **Bar: an Agent reading Pillar B knows every dimension Alembic can produce and how.** Any dimension missing SOP, or a tag driven by anything but language/framework fact → fix before P3.

### P3 — Plan closed loop: confirm + cold-start precondition

- **Outcome:** the Agent can select any dimension from the full catalog; the confirmed Plan is a valid cold-start input.
- **Code:** fix `confirm` validation (`plan-tool.ts buildConfirmedPlanIntent:1036-1103`) so `selectedDimensions` validates against the **full 25-dimension catalog**, not the `baseDimensions` (~13 universal) subset — otherwise an Agent selecting a language/framework dimension (e.g. `swift-objc-idiom`) is rejected. Verify `confirm → get → cold-start reads the Plan` chain (cold-start already consumes Agent-confirmed `intent.dimensionIds` via `selectProjectContextDimensions`, consistent with no-guess).
- **Gate:** select-any-dimension → `confirm` persists → `get` reads back consistent → cold-start consumes the Plan. Any broken link → fix before P4.

### P4 — Real-project end-to-end acceptance (Test)

- **Outcome:** prove the chain "new draft → Agent authors a valuable Plan → cold-start consumes it" on a real project.
- **Code:** Test runs BiliDili (and ideally one non-Swift project) — the Agent uses only the draft raw payload to author a Plan with sensible dimension/scale/module choices; cold-start starts from it.
- **Gate:** end-to-end produces a **valuable** Plan (non-empty, project-fit), with raw MCP payload + cold-start evidence retained.

## Execution Plan

| Phase | Owner Window | Goal | Completion Signal |
| --- | --- | --- | --- |
| Pre | Wakeflow Controller | Intake; state root; carry this design + evidence | State root exists with this design captured |
| P0a | AlembicCore + AlembicPlugin | Delete draft judgment filter | rg zero residue + green build |
| P0b | AlembicCore (heavy) + AlembicPlugin (DI) | Delete orphaned project-intelligence + CodeEntityGraph; rehome live types | rg zero residue + live-type consumers compile + green build + no silent capability loss |
| P1 | AlembicPlugin (+ AlembicCore facts) | Pillar A: full project facts | Raw payload reconstructs the project |
| P2 | AlembicCore (registry/SOP) + AlembicPlugin (assembly) | Pillar B: all dimensions + SOP + factual language tag | All dims + complete SOP + factual tag |
| P3 | AlembicPlugin (+ Core catalog) | confirm full-catalog + cold-start chain | select-any → confirm → get → cold-start |
| P4 | Test | BiliDili end-to-end valuable Plan | e2e valuable, raw evidence |

**Sequencing:** P0a + P0b are the pre-deletion gate and must fully pass before P1+. P0a/P0b deletions are cross-repo coupled (Plugin stops calling a Core symbol; Core deletes it) — the controller groups Core/Plugin into coordinated waves so build never breaks. P1 and P2 are independent (different blocks) and can run in parallel once P0 is green. P3 needs P2. P4 needs P1+P2+P3 accepted.

## Acceptance Definition

- No judgment-type filtering remains in the draft path (`rg` clean for `decideDimension`/`resolveSignalAwareActiveDimensions`/foundational gating in production).
- The orphaned `runAllPhases` pipeline and `CodeEntityGraph` materialization are fully removed; live shared types preserved/rehomed; build/typecheck/lint green.
- `alembic_plan draft` on a real project returns: full untrimmed projectContext + full mission-briefing facts + all 25 dimensions each with complete SOP + factual `languageApplicable` tag + raw signals as facts — no active/skip split, no counts-only fields.
- `confirm` accepts any dimension from the full 25-catalog; `get` round-trips; cold-start consumes the Plan.
- No recommendation/top/subset/fallback/scale semantics introduced.
- Test proves draft → valuable Plan → cold-start with raw evidence, not unit tests alone.

## Non-Goals

- Do not delete the dimension catalog, SOPs, ProjectContext capabilities, domain-signal facts, or plan persistence.
- Do not delete the live shared types (`DimensionDef`/`ProjectSnapshot`/`GuardAudit`) — preserve/rehome.
- Do not change four-tool public MCP semantics beyond the draft payload.
- Do not introduce recommendation/top/subset/fallback, hidden silent dimension drop, or draft-side scale estimation.
- Do not reopen F5/G3/J/Panorama-residual from the residual-gap demand.

## Controller Stop Conditions

Stop and report instead of accepting if:

- Any production path still makes a relevance/complexity/foundational/scale judgment in draft.
- A deletion left dead residue, or broke a live consumer of the rehomed types.
- The CodeEntityGraph deletion turns out to have a live reader after the mandatory sweep (then re-scope, do not force-delete).
- A target proposes keeping a "thin" filter or compressing the payload "for size" without a user/Design decision — draft is meant to be full material; size is an accepted consequence.
- A target result lacks commit hash, exact tests, rg/import evidence, or raw acceptance payload.
