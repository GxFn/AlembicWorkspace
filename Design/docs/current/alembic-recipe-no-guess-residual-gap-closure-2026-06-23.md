# Recipe No-Guess Residual Gap Closure Requirement Design

Date: 2026-06-23
Status: **confirmed by user request 2026-06-23**. Supplemental correction to the completed `alembic-recipe-plan-no-guess-correction-2026-06-22` state root.
Owner Window: Wakeflow Controller
Receiving Window: Wakeflow
Design Key: alembic-recipe-no-guess-residual-gap-closure-2026-06-23

## Authority

This document does **not** create a new interpretation of Recipe Plan semantics.
Authority remains:

1. `Design/docs/current/alembic-recipe-evolution-optimization-2026-06-21.md`
2. `Design/docs/current/alembic-recipe-plan-no-guess-correction-2026-06-22.md`
3. User decision: Plan is a complete authoritative plan; Plugin/Core must not invent recommendation/top/subset/fallback semantics; out-of-requirement fabricated code must be removed, not kept as auxiliary behavior.

The completed no-guess root recorded `demand.completed` at revision 76, but a follow-up audit plus controller raw-code verification found unfinished in-scope gaps that were not recorded as deferrals. This supplemental demand closes only those residual gaps. It does not reopen conforming groups A/C/D/E/H/I except where residual code directly contradicts the confirmed deletion/cleanup.

## Confirmed Goal

Close the remaining real gaps in the no-guess correction so the implemented system matches the already confirmed completion definition:

- Group B heart: a single canonical, domain-signal-driven dimension path; no old language/framework-only `resolveActiveDimensions` production path; foundational dimensions are a minimal explicit exception, not four always-on dimensions.
- Group F5: non-test execution must not let `dimensions`, `moduleScope`, or `scaleOverride` override, expand, or shrink the confirmed authoritative Plan.
- Group G3: retrieval consumers must not silently miss commit-driven catch-up/evolution visibility after checkpoint changes.
- Group J: green-field import boundary must be guarded by a real test.
- Residual Panorama/test-only code must be removed or updated where it remains after the confirmed Panorama deletion.

## Current Verified Evidence

These are current raw-code facts verified by the controller after the completed no-guess state root, not assumptions from the screenshot.

| Gap | Requirement Source | Current Evidence | Conclusion |
| --- | --- | --- | --- |
| B1 old dimension resolver still exported and consumed | no-guess design Group B1 / PD-2: old `resolveActiveDimensions` deleted or fully migrated; signal-aware path is unique authority | `AlembicCore/src/domain/dimension/DimensionRegistry.ts:632` still defines `resolveActiveDimensions`; `AlembicCore/src/domain/dimension/index.ts:16` and `AlembicCore/src/dimensions.ts:16` still export it; `AlembicCore/src/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts:51` imports and `:223` calls it | Missing. B3 generation path work is not enough to satisfy B1. |
| B2 domain signal remains fallback, foundational remains always-on | no-guess design Group B2: domain signal first-class gate; foundational contracts to PD-1 minimal exception | `AlembicCore/src/service/project-context/dimensionPlanning/dimensionPlanning.ts:36` defines four `FOUNDATIONAL_DIMENSIONS`; `:436` accepts them before domain signals; `decideDimension` starts at `:393`; domain signal logic remains later than language/framework/foundational decisions | Missing. This is the core requirement heart, not optional polish. |
| F5 Plan authority leak through execution overlays | no-guess design Group F5: `dimensions` / `moduleScope` / `scaleOverride` only under `testMode===true`; `moduleScope` is an execution upper bound, not a Plan expander | `AlembicPlugin/lib/recipe-generation/plan-generation-gate.ts:483` gates dimensions by testMode, but `:534` still unions `moduleScope` with planned/bound/gap modules for `moduleMining`; `:550-557` applies `scaleOverride` even outside testMode; schema text at `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:1069-1070` and `:1139-1140` describes general override after Plan confirmation | Deviates. Confirmed Plan can still be narrowed/expanded/overridden outside test mode. |
| G3 retrieval catch-up visibility missing | no-guess design Group G3: `prime` / `search` / `recipe_map` retrieval consumption must get catch-up/evolution visibility or the trigger set must be marked incomplete | Existing checkpoint/catch-up visibility appears in rescan/opportunistic host surfaces; search/prime/recipe_map handlers do not currently show a connected checkpoint/catch-up consumer path. Key search surfaces: `AlembicPlugin/lib/runtime/mcp/handlers/search.ts`, `recipe-map.ts`, `agent-public-tools.ts` | Missing. Retrieval consumers can present stale knowledge without explicit catch-up posture. |
| J import boundary guard missing | no-guess design Group J: green-field clean, add import-boundary assertion test | `AlembicPlugin/test/unit/RecipeGenerationSkeleton.test.ts` covers skeleton and migration shape but no assertion that `lib/recipe-generation` does not import `lib/service/project-knowledge-context` | Partial. Boundary is currently policy-only, not guarded. |
| Panorama residual dead/test-only paths remain | no-guess design Group I / user S4: direct Panorama delete; no fake retention | `AlembicCore/src/workflows/cold-start/ColdStartPresenters.ts:13` and `AlembicCore/src/workflows/knowledge-rescan/KnowledgeRescanPresenters.ts:7` still import `PanoramaSummaryPresenter`; `AlembicCore/src/workflows/capabilities/presentation/index.ts:4` still exports it; `AlembicPlugin/test/unit/AuditEmission-MissionBriefing.test.ts:169-180` still asserts `briefing.panorama` content | Residual. Remove dead Core presenter path and update Plugin test-only assumptions. |

## Required Repairs

### B1/B2 Core Dimension Canonical Repair

**Required outcome:** Core has one production dimension authority for Plan/ProjectContext facts, driven by real domain signals and confirmed Plan IDs where applicable. The old language/framework-only active resolver must not remain a public production path.

Scope:

- Remove or fully retire the old `resolveActiveDimensions` production export path from `DimensionRegistry.ts`, `domain/dimension/index.ts`, and `src/dimensions.ts`, after migrating real consumers.
- Migrate `ProjectIntelligenceRunner` away from the old resolver. It must either consume confirmed Plan dimension IDs or feed real domain/dynamic/project signals into the canonical signal-aware resolver. It must not call language/framework-only resolution.
- Rework `decideDimension` so domain signal relevance is a first-class in/out gate, not a final fallback.
- Contract `FOUNDATIONAL_DIMENSIONS` to the PD-1 minimal explicit exception. Four always-on dimensions are not acceptable unless a user/Design decision explicitly reauthorizes them.
- Keep the accepted B3 generation-stage direct Plan-ID work, but do not treat B3 as a substitute for B1/B2.

Forbidden shortcuts:

- Do not rename the old resolver to an "auxiliary" path and keep it reachable from production.
- Do not accept "B3-only additive strategy" as completion without a new user/Design decision.
- Do not over-include foundational dimensions to hide missing domain-signal quality.

Validation:

- Core tests prove domain signals can include/exclude dimensions and foundational dimensions are only the PD-1 exception.
- `rg "resolveActiveDimensions" AlembicCore/src` shows no production export/import/call path except explicitly allowed negative tests or deleted-compatibility notes with no runtime reachability.
- `ProjectIntelligenceRunner` tests prove it does not use language/framework-only active dimension selection.

### F5 Plugin Plan Gate Repair

**Required outcome:** In non-test execution, the confirmed Plan remains the authority. Input overlays cannot filter, expand, or rescale it.

Scope:

- Gate `dimensions`, `moduleScope`, and `scaleOverride` behind `testMode===true`.
- Make `moduleScope` an execution upper bound when testMode is true; it must not union with planned/bound/gap modules in a way that expands beyond the requested test slice.
- In non-test mode, `moduleScope` and `scaleOverride` must be ignored or rejected with clear diagnostics according to existing tool conventions; they must not silently affect execution.
- Update MCP schema descriptions so override language is explicitly testMode-only.

Forbidden shortcuts:

- Do not keep `moduleScope` as a "helpful" live expansion route.
- Do not add another fallback budget or scale override under a different field name.

Validation:

- `PlanDrivenGenerationGate` tests cover non-test mode with `moduleScope` and `scaleOverride` present and prove Plan scope/scale remains unchanged.
- TestMode tests prove scoped/small acceptance mode still works.

### G3 Retrieval Catch-Up Visibility

**Required outcome:** Retrieval consumers do not silently present stale Recipe knowledge after commit/checkpoint drift.

Scope:

- Connect existing durable checkpoint / catch-up posture to `alembic_search`, `alembic_prime`, and `alembic_recipe_map` retrieval output diagnostics, or provide an equivalent explicit retrieval-staleness signal on those surfaces.
- The implementation must be non-resident and must not trigger broad rescan as a hidden side effect of simple retrieval.
- If a full catch-up cannot safely run in the retrieval call, retrieval must expose an explicit "catch-up needed / retrieval may be stale" diagnostic and next action, not success-without-context.

Forbidden shortcuts:

- Do not mark G3 complete by saying rescan has catch-up; G3 is about retrieval consumers.
- Do not change the four public MCP tool semantics beyond visible diagnostics already allowed by the no-guess truthfulness decisions.

Validation:

- Unit tests for search, prime, and recipe_map cover stale checkpoint posture and visible degraded/stale diagnostics.
- BiliDili final acceptance includes retrieval after a controlled commit and verifies the stale/catch-up posture is observable.

### J Green-Field Boundary Guard

**Required outcome:** The green-field `lib/recipe-generation` boundary stays protected.

Scope:

- Add an import-boundary assertion test that fails if files under `AlembicPlugin/lib/recipe-generation` import `AlembicPlugin/lib/service/project-knowledge-context`.
- Keep ProjectContext services in `lib/service`; do not move them to satisfy the test artificially.

Validation:

- Targeted unit test fails on a synthetic/import fixture or direct scan if the forbidden import appears.

### Panorama Residual Cleanup

**Required outcome:** Confirmed Panorama deletion has no dead reachable presenter path or test-only expectation left behind.

Scope:

- Remove `PanoramaSummaryPresenter` export/import path from Core cold-start and knowledge-rescan presenters, or replace with a null-free ProjectContext-compatible shape that does not depend on Panorama.
- Update Plugin `AuditEmission-MissionBriefing.test.ts` and related fixtures so they no longer assert `briefing.panorama` content from a deleted Core capability.
- Preserve ProjectContext graph/module dependency capabilities and domain-signal facts; do not delete those under the Panorama name.

Validation:

- Core import/export sweep shows no `PanoramaSummaryPresenter` production path.
- Plugin tests no longer rely on `briefing.panorama` except as a deliberately null/absent legacy field if the public contract still requires absence compatibility.

## Execution Plan

| Phase | Owner Window | Goal | Completion Signal |
| --- | --- | --- | --- |
| R0 | Wakeflow Controller | Intake this supplemental demand; create state root; carry forward raw evidence and old completed-root revision; do not edit product code in controller | State root exists with this design and handoff captured |
| R1 | AlembicCore | B1/B2 canonical/domain-signal repair plus Core Panorama residual cleanup | Core commit(s), tests, rg sweep, no old production resolver path, no Panorama presenter residual |
| R2 | AlembicPlugin | F5 Plan gate repair, G3 retrieval catch-up visibility, J import-boundary test, Plugin Panorama test cleanup | Plugin commit(s), targeted tests, schema text corrected, retrieval diagnostics visible |
| R3 | Test | Focused BiliDili/no-guess acceptance for residual gaps | Test evidence proves B domain-signal facts, F5 non-test authority, G3 retrieval visibility, J guard, Panorama residual cleanup |
| R4 | Wakeflow Controller | Review raw evidence and close only if every residual gap is independently verified | All target packages accepted and supplemental demand completed |

Parallelism:

- R1 and R2 can run in parallel after R0 because Core B/Panorama and Plugin F5/G3/J/test cleanup are mostly independent.
- R3 must wait for accepted R1 and R2.

## Acceptance Definition

The supplemental demand is complete only when all of these are true:

- B1/B2 are implemented, not deferred: no production `resolveActiveDimensions` path remains, and domain-signal relevance drives dimension inclusion/exclusion with only the PD-1 minimal foundational exception.
- F5 is implemented: non-test `moduleScope`/`scaleOverride`/dimension overlays cannot change confirmed Plan scope or scale.
- G3 is implemented or explicitly user/Design-deferred. For this demand, default is implementation: search/prime/recipe_map expose catch-up/staleness posture.
- J guard test exists and passes.
- Panorama residual code/test expectations are cleaned without deleting ProjectContext graph/domain-signal capabilities.
- BiliDili or equivalent focused acceptance proves the residual chain, not merely unit tests.
- Controller progress and final decision record any remaining issue as blocker or user-decision-needed; no silent completion by document omission.

## Non-Goals

- Do not reopen already conforming A/C/D/E/H/I work unless needed by a residual listed here.
- Do not create new Recipe generation features.
- Do not delete plans, evidence, proposals, source refs, vector structures, ProjectContext graph, or domain-signal capabilities.
- Do not alter four-tool public MCP semantics except for truthfulness diagnostics already authorized by the no-guess requirement.
- Do not preserve fabricated/out-of-requirement code as hidden auxiliary behavior.

## Controller Stop Conditions

Stop and report instead of accepting if:

- B1/B2 are narrowed to B3-only without explicit user/Design decision.
- F5 leaves live non-test override behavior.
- G3 is called complete without retrieval consumer evidence or an explicit deferral record.
- A target result lacks commit hash, exact tests, rg/import evidence, or raw acceptance artifacts.
- The implementation adds a new recommendation/top/fallback path under a different name.
