# P0 Controller Audit: Plan Authority Drift

Date: 2026-06-22
Controller: AlembicWorkspace
Demand: `alembic-plan-authoritative-complete-plan-repair-2026-06-22`

## User Correction

The prior demand `alembic-recipe-evolution-optimization-2026-06-21` exposed a validation defect after completion: `Plan` was accepted while behaving like recommendation / top / selected-subset logic. The confirmed design says Plan is the complete authoritative plan used by later cold-start, deep mining, module mining, and evolution maintenance.

This repair demand supersedes the prior completion conclusion for this specific semantic gap. The old completed state root was archived with redaction only to clear the Wakeflow single-active-root gate; archive is not acceptance and does not erase the defect.

## Original Requirement Authority

From `Design/docs/current/alembic-recipe-evolution-optimization-2026-06-21.md`:

- Plan is the living ledger and heart of the system, not a one-shot analysis note.
- Plan intent is the Agent-made complete layer: dimension ordering, scale/budget, module bindings, per-stage goals, and planned MCP/tool execution.
- Generation state is projected from DB and must not be double-written.
- Confirmed Plan is the hard precondition for cold-start, rescan/deep-mining, and module-mining.
- Test mode may run a scoped subset, but it must not turn the Plan itself into a scoped subset.

## 2026-06-22 Re-Audit After User Challenge

The user's correction is authoritative: **Plan means the full authoritative plan** used later by cold-start, deep mining, module mining, and evolution. It is not a "top" or "recommended" shortlist.

The original design also contains wording that can be misimplemented: it reuses older `selectedDimensions` vocabulary in the `alembic_plan` interaction detail and describes the BiliDili test mode as scoped subset execution. That text must be resolved against the stronger Plan authority lines above, not silently used to narrow persisted `Plan.intent`.

Controller conclusion: the prior implementation failed this interpretation by treating `recommendedDimensions`, `selectedDimensions`, and test-mode `dimensions` as if they could define or replace the Plan. That is a P0 semantic defect, not a UI/output wording issue.

## Controller Interpretation Boundary

This section is not quoted requirement text. It is the controller repair boundary derived from the original Plan authority plus the user's 2026-06-22 correction:

- Recommendation/top-ranked data is not forbidden as an input signal, planning aid, or user-facing suggestion.
- Recommendation/top-ranked data must not be promoted to the sole authoritative `Plan.intent` unless the confirmed Agent plan explicitly contains the full intended scope.
- Test-mode selected dimensions/modules are execution scope controls. They must not mutate or replace persisted `Plan.intent`.
- Any implementation or test that proves only a recommended/top/test subset is insufficient to prove the complete Plan requirement.

## Current Drift Evidence

- `AlembicCore/src/service/planLedger/planLedger.ts` builds draft intent from `planningAids.recommendedDimensions`; if recommendations are absent, it falls back to `dimensionOrder`. This makes recommendation/top ordering the source of the Plan intent instead of treating it as supporting evidence for a complete plan.
- `AlembicPlugin/lib/recipe-generation/plan-tool.ts` `buildConfirmIntentPatch` normalizes `args.selectedDimensions` and writes them back as `dimensions`, then recomputes `stages` from that selected set. This lets an execution subset erase non-selected dimensions/stage targets from the authoritative Plan.
- `AlembicPlugin/lib/recipe-generation/plan-generation-gate.ts` exposes `selectedDimensions` as the generation gate output and applies test-mode dimensions/scale/moduleScope at the same layer as Plan consumption. The missing boundary is: complete Plan intent first, execution overlay second.
- `AlembicCore/src/service/project-context/dimensionPlanning/dimensionPlanning.ts` names the ranked planning result `recommendedDimensions` and applies `maxRecommendedDimensions`. That is valid only for planning aids / briefing. If any downstream Plan builder consumes this slice as `intent.dimensions`, the Plan is structurally capped by a recommendation threshold.
- `AlembicPlugin/lib/recipe-generation/plan-generation-gate.ts` may compute a bounded `dimensionIds` selection for a run, but that selection is not allowed to become the Plan, the active Plan view, or the `alembic_plan get` representation.

## How The Wrong Semantics Was Introduced

1. RG-2 introduced useful planning aids and ranked dimensions. The ranking is fine as evidence for Agent decision-making, but it was consumed as the Plan source.
2. RG-3 created Plan persistence around `PlanIntent`, but the draft builder filled that intent from `recommendedDimensions` rather than from a full Agent-authored plan payload.
3. Plugin confirm reused `selectedDimensions` as an intent patch. That collapsed two separate concepts: the full confirmed Plan and the execution/test subset.
4. RG-4 generation gate correctly needed a stage/test selection, but it named and surfaced that as `selectedDimensions` inside the same plan gate object without a hard `completePlan` vs `executionSelection` boundary.
5. Tests could pass by checking the scoped/test path, while failing to assert that non-executed dimensions/modules/stage targets survived in the persisted Plan.

## Repair Boundary

The fix must restore these semantics:

- Complete Plan intent is project-wide and stage-aware; it is not a top-N recommendation list.
- Recommendations, ranked dimensions, subset hints, and testMode selections are advisory or execution overlays, never Plan authority.
- `alembic_plan confirm` persists the full Agent-authored plan payload. It may also record an execution selection, but it must not truncate `intent.dimensions`, `intent.moduleBindings`, `intent.stages`, or `intent.plannedNextActions`.
- `alembic_plan get` must clearly show the complete Plan and projected state. If it also reports an execution overlay, the fields must be named so a caller cannot mistake them for the Plan.
- Bootstrap/rescan/moduleMining gates read the complete confirmed Plan and derive only the current run's execution selection from stage + testMode overlay.
- Existing invariants remain: Plan intent only in `plans`; generation-state from DB projection; no four-tool semantic break; no daemon/watch; no deletion of evidence/proposals/vector structures.

## Required Old-Logic Cleanup

- Core Plan builder must stop assigning `PlanIntent.dimensions` from `planningAids.recommendedDimensions` or any `maxRecommendedDimensions`-limited slice. `recommendedDimensions`, `dimensionOrder`, `subsetHints`, and ranking scores may remain in `planningBrief` / `sourceReports` only.
- Core must expose or accept a full project plan candidate: complete active dimensions from real project/domain signals, per-stage targets, project/module scope, module bindings, scale/budget, planned MCP/tool actions, rationale, and evidence refs. A draft may be incomplete only if it is explicitly marked as needing Agent completion before confirm.
- Core tests must include a fixture where the complete project plan has more dimensions/modules than the recommended/test subset. Persisted `PlanIntent` and projected state must retain the complete set.
- Plugin `confirm` must not treat `args.selectedDimensions` as the Plan authority for normal confirmation. It must require/accept a full plan payload or merge only complete-plan fields; if a scoped/test selection is supplied, it must be stored or returned as `executionSelection`/`testSelection` outside `Plan.intent`.
- Plugin `get` must not present a narrowed selected list as the Plan. It must return the complete active Plan plus projected state, and separately label any current execution overlay.
- Generation gates may compute `executionSelection` from confirmed Plan stage + requested testMode dimensions + moduleScope + scaleOverride. The overlay must be ephemeral for the current run and must never mutate `plans.intent`.
- Any field named `selectedDimensions` in user-facing output must either be renamed to execution/test selection or accompanied by `completePlan`/`plan.intent.dimensions` that is visibly authoritative. Ambiguous output is a failure.

## Initial Owner Split

- P1 AlembicCore: repair Plan intent/package semantics and tests so complete Plan is expressible, persisted, projected, and not recommendation-derived authority.
- P2 AlembicPlugin: repair `alembic_plan` confirm/get/output contract so full Plan payload and execution overlay are separated.
- P3 AlembicPlugin: repair Plan generation gate consumption so testMode overlays do not mutate or replace Plan intent.
- P4 Test: rerun BiliDili to prove complete Plan plus scoped execution overlay and existing evolution/vector behavior.

## Acceptance Tests Required By This Repair

- Core unit/integration: `recommendedDimensions` limited to 2 or 3 while full real-signal dimensions include more domains; draft/confirm persists the full Plan, not the recommendation slice.
- Plugin unit/integration: `alembic_plan confirm` with an execution/test subset preserves non-selected Plan dimensions, module bindings, stages, planned actions, and scale.
- Gate unit: bootstrap/rescan/moduleMining read complete Plan stage targets; testMode produces a separate `executionSelection` and does not alter `alembic_plan get`.
- BiliDili real scenario: `alembic_plan get` before and after scoped test-mode generation shows the same complete Plan intent; execution output shows the bounded overlay separately; commit-driven evolution and vector degradation behavior remain green from the prior RG-10 scope.

## Stop Conditions

- Stop if a proposed fix keeps `selectedDimensions` as the only persisted Plan dimensions.
- Stop if a proposed fix renames fields without changing Plan authority.
- Stop if testMode remains able to shrink the active Plan.
- Stop if the repair weakens Plan hard-precondition gates or reintroduces Plugin-local generation-state double writes.
- Stop if any task claims BiliDili success while only proving a top/recommended/test subset.
