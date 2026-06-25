# alembic_plan Stateless Precondition Contract — Workspace Handoff

Date: 2026-06-24
Status: ready-for-workspace
Source Window: Design
Receiving Window: Wakeflow Controller
Design Key: alembic-plan-stateless-precondition-contract-2026-06-24

## Summary

Make `alembic_plan` a **stateless precondition run before EACH cold-start / deep-scan / module-scan**. For that single run, `draft` returns two clean blocks — a **byte-budget-bounded project-info pyramid** (`projectInfoTree`) + **all candidate dimensions with a per-dimension mining guidance** (`candidateDimensions`) — so the Agent **selects dimensions + scale** for that one stage; `confirm` validates and returns a single-stage **`planSelection`** the executor consumes. **Nothing is persisted.** The entire plan persistence layer is deleted; the pure coverage-projection engine is **relocated** (decoupled from plan) for a future Recipe-status query; SOP + missionBriefing leave the plan (fixed bindings derived from the selected dimensions at generation); evolution proposals stay on Recipes.

This fixes the live 4.5MB BiliDili draft (self-duplication of ProjectContext ×3, sourceReports ×2, dimensionCatalog ×3 w/ SOP ×2) by giving `alembic_plan` the per-operation projector the `alembic-mcp-clean-output-contract` always required and it never had.

The requirement design is a **Developer Decision (strict)** — every field, interface, deletion, relocation, rewire, and phase pass-criterion is binding.

## Handoff Type

requirement-candidate — supersedes the pure-collection demand; **reverses** the recipe-evolution "Plan = persisted living ledger" decision.

## Confirmed User Goal

`alembic_plan` only determines one execution's dimensions + scale, stateless. Pyramid project facts + candidate dimensions (with mining guidance) come in; the Agent selects; the single-stage selection feeds the execution. No local storage; durability lives in the Recipes.

## Final Completion Definition

See [requirement design](alembic-plan-stateless-precondition-contract-2026-06-24.md). In short:
- Plan persistence layer DELETED (plans table + migration 012, PlanRepository, PlanLedgerService persistence methods, `get`, signature/version/supersede); the pure projection engine RELOCATED to a Recipe-domain module (not deleted); `validateCompletePlanIntent` preserved (adapted to single-stage).
- `draft` returns **inline** ONLY `projectInfoTree` (two-part: budget-bounded upper pyramid, inline budget **12 KB**, total draft ≈18 KB; + a **transient full-tree file** via `meta.fullTreeRef` only when truncated, so detail is never lost and the inline part always fits the MCP limit) + `candidateDimensions[]` (all 25, each `{id,label,layer,languageApplicable,miningGuidance=extractionGuide}`) + base/checklist. No projectContext dump / SOP / missionBriefing / sourceReports / duplication.
- `confirm` is stateless single-stage: validates the Agent payload (no draft read, no DB write, no ProjectContext re-collection), returns `planSelection{generationStage,dimensions,scale,moduleBindings}`.
- `bootstrap`/`rescan` require `planSelection` (hard precondition) and run from it (incl. `scale.maxFiles/contentMaxLines`); the storage-reading gate is deleted; the `alembic_job` path forwards `planSelection`.
- git-diff checkpoint baseline seeds from current git HEAD (`source:'current-head'`), never `'empty'`.
- SOP + missionBriefing derive from the selected dimensions at generation, not the plan.
- Real-project e2e proves the stateless `draft → confirm → execute` chain; a DB inspection after a run shows no `plans` table.

## Current Design Status

- Requirement design: complete; field-level + interface-level + deletion/relocation/rewire-level spec with file:line; per-phase pass criteria.
- User confirmation: confirmed by direct decisions on 2026-06-24 (stateless/delete-persistence + living-ledger reversal; confirm→planSelection; no signature; no scaleOptions; two-block draft; budget-bounded pyramid stop-point @64KB; single-stage planSelection; confirm does not re-analyze; relocate projection engine; SOP/missionBriefing as fixed bindings; proposals/coverage out of plan; git-diff checkpoint→HEAD; miningGuidance=extractionGuide; all-25-dims-tagged).
- Code fact status: Design verified the 4.5MB root cause, the persistence layer + every production consumer, the gate/executor wiring, and the git-diff checkpoint coupling via raw grep + file reads (file:line in the design).
- Detached Design mode: no.

## Recommended Next Step

Controller intake; create state root; run **P0 (delete persistence + relocate engine) first**, then P1/P2 (draft/confirm contract), P3 (executor wiring), P4 (checkpoint + SOP/briefing derivation), P5 (test rewrites + BiliDili e2e). Confirm the supersede of pure-collection and the living-ledger reversal during intake.

## Functional Loop Summary

- Input: one generation run (cold-start/deep/module) needs its dimensions+scale.
- Output: `draft` (pyramid + candidate dimensions w/ guidance) → Agent selects → `confirm` (single-stage planSelection) → executor consumes planSelection.
- State change: NONE in the plan. Recipes persist in the knowledge store.
- Producer: AlembicCore (delete persistence; relocate projection engine; keep registry/signals/handlers/getDimensionSOP/validation); AlembicPlugin (stateless draft/confirm projectors, executor wiring, checkpoint rewire).
- Consumer: the host Agent (selects) + the executor tools (consume planSelection).
- Failure path: incomplete confirm → reject; executor without planSelection → refuse pointing to `alembic_plan`.

## Recommended Repository Coverage

| Window | Status | Responsibility | Dependency |
| --- | --- | --- | --- |
| AlembicCore | participates | Delete plans table/migration/PlanRepository/PlanLedgerService-persistence; RELOCATE the projection engine to a Recipe-domain module; preserve `validateCompletePlanIntent` (single-stage); rewire `GitDiffCheckpointService`→HEAD; expose a budget-bounded project-info-tree accessor | Heavy/highest-risk (deletion + relocation) |
| AlembicPlugin | participates | Stateless `draft` budget-bounded two-block projector + `confirm` validate→planSelection; require `planSelection` on bootstrap/rescan + forward via `alembic_job`; delete the storage gate; output allow-list edit | Coordinates with Core per phase |
| Test | participates | BiliDili e2e of the stateless chain + DB-has-no-plans-table check | After P1-P4 accepted |
| AlembicDashboard | no-task | No UI work | Reopen only on direct residual |
| Alembic | no-task | No main-repo work | Reopen only on direct residual |
| Design | observing | Authority closed; re-engage only if a target proposes keeping persistence, deleting the projection engine, dropping the checkpoint to empty, a thin/global-bag output, or a multi-stage planSelection | User/Design confirmation for any such change |

## Evidence And Links

- Requirement design (strict): [alembic-plan-stateless-precondition-contract-2026-06-24.md](alembic-plan-stateless-precondition-contract-2026-06-24.md)
- Contract baseline (per-tool projector): [alembic-mcp-clean-output-contract-requirement-design-2026-06-08.md](alembic-mcp-clean-output-contract-requirement-design-2026-06-08.md)
- Superseded: [alembic-plan-draft-pure-collection-2026-06-23.md](alembic-plan-draft-pure-collection-2026-06-23.md)
- Reversed decision: [alembic-recipe-evolution-optimization-2026-06-21.md](alembic-recipe-evolution-optimization-2026-06-21.md)
- Live 4.5MB evidence + file:line root cause are in the design's Section 1/2.

## Risks

- **Deletion + relocation blast radius (highest):** removing PlanRepository/PlanLedgerService-persistence touches Core public surface (`src/plans.ts`) + the Plugin gate; relocating the projection engine must keep its pure read-deps intact. Run the cross-repo import sweep + build before/after deleting.
- **git-diff checkpoint coupling:** the one real behavioral rewire — `getActiveConfirmed().lastUpdatedFromCommit` → current HEAD. Must not silently degrade to `'empty'` (would change checkpoint init behavior).
- **`alembic_job` arg-drop:** the job path forwards almost nothing today; it must forward the new required `planSelection` or job-driven runs fail.
- **Single-stage simplification:** drop `stages{}`/`perStage`/per-dim `stage`; the gate selectors must read the flat single-stage `planSelection`.

## Non-Goals And Forbidden Shortcuts

- No plan persistence under a new name; no global field bag; no handler-internal passthrough; no multi-stage `planSelection`.
- No recommendation/top-N/fallback; the Agent decides dimensions+scale.
- Do not delete DimensionRegistry/domain-signals/ProjectContext handlers/getDimensionSOP/validation/the projection engine (relocate the engine).
- No acceptance on target prose without raw commit/test/rg/runtime evidence.

## Phase Candidates

| Phase | Goal | Up/Down | Pass Signal |
| --- | --- | --- | --- |
| P0 | Delete persistence + extract/relocate engine | intake / P1-P3 | rg 0 residue + relocated engine import-clean + build green |
| P1 | Stateless budget-bounded two-block `draft` | P0 / P3,P5 | two blocks only, ≤ ceiling by construction w/ pyramid marker, no dump/dup |
| P2 | Stateless single-stage `confirm` → planSelection | P0 / P3,P5 | validates, returns planSelection, no DB, no re-analysis |
| P3 | Wire bootstrap/rescan to required planSelection | P2 / P5 | refuse without it; run from it incl. maxFiles/contentMaxLines; job path forwards |
| P4 | Checkpoint→HEAD + SOP/missionBriefing derivation | P2 / P5 | checkpoint `current-head`; generation derives both from selection |
| P5 | Test rewrites + BiliDili e2e | P1+P2+P3+P4 / closeout | suites green; stateless chain proven; DB has no plans table |

## Open Questions For Wakeflow

None. Any proposal to keep plan persistence, delete the projection engine, drop the checkpoint to empty, add a global bag, or use a multi-stage planSelection is a scope change and returns to user/Design.

## Pre-Handoff Checklist

- Checked alignment checklist: yes
- This handoff does not include copyable implementation-window prompts: yes
- Phases remain candidates, not task packages: yes
- TODO / Backlog candidates are listed in Evidence And Links: yes
- Any deletion, downgrade, deferral, relocation, compatibility retention, or boundary change is marked as requiring authority: yes
