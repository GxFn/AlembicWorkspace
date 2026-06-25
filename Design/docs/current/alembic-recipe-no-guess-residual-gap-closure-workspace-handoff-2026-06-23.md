# Recipe No-Guess Residual Gap Closure Workspace Handoff

Date: 2026-06-23
Status: ready-for-workspace
Source Window: Wakeflow Controller
Receiving Window: Wakeflow
Design Key: alembic-recipe-no-guess-residual-gap-closure-2026-06-23

## Summary

Supplemental correction for the completed `alembic-recipe-plan-no-guess-correction-2026-06-22` demand. A follow-up audit and controller raw-code verification found unfinished in-scope residual gaps that were not recorded as deferrals: B1/B2 dimension canonical/domain-signal heart, F5 non-test Plan override leak, G3 retrieval catch-up visibility, J import-boundary guard, and Panorama residual code/test expectations.

This handoff does not change the original Plan semantics. Authority remains the original recipe-evolution requirement and the no-guess correction requirement. The new work is gap closure, not a new feature.

## Handoff Type

requirement-candidate, supplemental correction to a completed state root

## Confirmed User Goal

Create a supplemental demand based on the exposed problems and continue automated Wakeflow progress until completion, hard gate, no eligible work, missing evidence, or user stop.

## Final Completion Definition

See [requirement design](alembic-recipe-no-guess-residual-gap-closure-2026-06-23.md). In short:

- Core B1/B2 truly landed: old language/framework-only `resolveActiveDimensions` production path retired, `ProjectIntelligenceRunner` migrated, domain signals first-class, foundational minimized to PD-1.
- Plugin F5 truly landed: `dimensions`/`moduleScope`/`scaleOverride` are testMode-only and cannot change non-test confirmed Plan authority.
- Retrieval G3 visible: `alembic_search`, `alembic_prime`, and `alembic_recipe_map` expose checkpoint catch-up/stale posture or an explicitly accepted deferral.
- J guard exists: `lib/recipe-generation` cannot import `lib/service/project-knowledge-context`.
- Panorama residual presenter/test-only expectations are removed or updated.
- Focused final acceptance proves these residuals with raw evidence.

## Current Design Status

- Requirement design status: complete
- User confirmation status: confirmed by direct user request on 2026-06-23
- Mainline relation status: immediate follow-up to completed no-guess correction
- Code fact status: controller verified current code paths after old completion
- Needs Wakeflow code research: no before intake; product windows still must provide tests and evidence
- Detached Design mode: no

## Recommended Next Step

Controller intake this handoff, create state root `alembic-recipe-no-guess-residual-gap-closure-2026-06-23`, then dispatch R1 Core and R2 Plugin in parallel. R3 Test waits for accepted product repairs.

## Functional Loop Summary

- Input: confirmed authoritative Plan facts and existing ProjectContext/domain signals; controlled commit/checkpoint state; retrieval calls.
- Output: true domain-signal-driven dimension set, Plan-authority-preserving generation gate, visible retrieval catch-up/staleness posture, clean green-field boundary, no Panorama residual assertions.
- State change: Core/Plugin code and tests; Wakeflow state root; final Test evidence.
- Producer: AlembicCore for B1/B2 and Core Panorama residual cleanup.
- Consumer: AlembicPlugin for generation gate/retrieval/J/test cleanup; Test validates BiliDili focused scenario.
- Failure path: return blocked/needs-review with exact code path and owner; do not accept silent deferral.

## Recommended Repository Coverage

| Window | Recommended Status | Responsibility | Dependency / Blocker |
| --- | --- | --- | --- |
| AlembicCore | participates | B1/B2 canonical dimension/domain-signal repair; remove Core `PanoramaSummaryPresenter` residual path | None after intake |
| AlembicPlugin | participates | F5 gate, G3 retrieval visibility, J boundary test, Plugin Panorama test cleanup | Can run after intake; may consume Core if B changes exports |
| Test | participates | Focused final acceptance after Core/Plugin accepted | Wait for accepted product repairs |
| AlembicDashboard | no-task | No new UI work identified by this residual audit | Reopen only if product evidence finds a direct residual |
| Alembic | no-task | No main-repo residual identified here | Reopen only if route/API residual appears |
| Design | observing | Requirement authority already closed; only needed for scope decision if target proposes narrowing B/G3 | User/Design confirmation required for narrowing or deferral |

## Evidence And Links

- Requirement design: [alembic-recipe-no-guess-residual-gap-closure-2026-06-23.md](alembic-recipe-no-guess-residual-gap-closure-2026-06-23.md)
- Parent no-guess correction design: [alembic-recipe-plan-no-guess-correction-2026-06-22.md](alembic-recipe-plan-no-guess-correction-2026-06-22.md)
- Original recipe evolution design: [alembic-recipe-evolution-optimization-2026-06-21.md](alembic-recipe-evolution-optimization-2026-06-21.md)
- Completed old root: `.wakeflow-active/current/alembic-recipe-plan-no-guess-correction-2026-06-22` revision 76 `demand.completed`
- Current evidence paths are listed in the requirement design table.

## Risks

- B1/B2 is the highest-risk heart of this correction. B3-only additive generation work cannot substitute for canonical/domain-signal repair.
- F5 is subtle because testMode must remain useful for BiliDili scoped acceptance while non-test authority stays untouched.
- G3 must avoid hidden resident/rescan behavior. Retrieval may surface diagnostics and next actions, but should not silently run broad catch-up.
- Panorama residual cleanup must not delete ProjectContext graph/module dependency or domain-signal capabilities.

## Non-Goals And Forbidden Shortcuts

- No new Recipe feature scope.
- No recommendation/top/subset/fallback path under new names.
- No retention of fabricated/out-of-requirement code without named consumer, explicit user/Design authority, and cleanup condition.
- No acceptance based on target prose without raw commit/test/rg/runtime evidence.

## Phase Candidates

| Phase | Goal | Upstream / Downstream | Completion Signal |
| --- | --- | --- | --- |
| R0 | Intake and state root | User request / R1-R2 | State root created, design captured |
| R1 | Core residual repair | R0 / R3 | Core B1/B2 and Panorama residual evidence accepted |
| R2 | Plugin residual repair | R0 / R3 | Plugin F5/G3/J/residual evidence accepted |
| R3 | Test acceptance | R1+R2 / R4 | Focused BiliDili residual acceptance passed |
| R4 | Controller closeout | R3 / archive | Supplemental demand completed or blocked with evidence |

## Open Questions For Wakeflow

None. If a product target proposes deferring G3 or accepting B3-only dimension strategy, that is a new scope decision and must return to the user/Design instead of being accepted.

## Pre-Handoff Checklist

- Checked alignment checklist: yes
- This handoff does not include copyable implementation-window prompts: yes
- Phases remain candidates, not task packages: yes
- TODO / Backlog candidates are listed in Evidence And Links: yes
- Any deletion, downgrade, deferral, compatibility retention, or boundary change is marked as requiring authority: yes
