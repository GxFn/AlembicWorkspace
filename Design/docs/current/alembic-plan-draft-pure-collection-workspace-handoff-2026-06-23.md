# alembic_plan draft Pure-Collection Redesign — Workspace Handoff

Date: 2026-06-23
Status: ready-for-workspace
Source Window: Design
Receiving Window: Wakeflow Controller
Design Key: alembic-plan-draft-pure-collection-2026-06-23

## Summary

`alembic_plan draft` must become a **pure material collector** that hands the Agent two complete pillars — **(A) the target project's facts** (full ProjectContext) and **(B) Alembic's built-in conversion knowledge** (the full dimension catalog + each dimension's SOP) — so the Agent can author a **valuable cold-start Plan**. The Plan is the necessary precondition for cold-start; its value is the Agent's two judgments: drop irrelevant dimensions, and estimate per-dimension Recipe scale.

The current draft fails on all three counts the user named ("codex doesn't understand the target, just sees code, assembles mindlessly"): it steals the Agent's judgment (Plugin/Core pre-filter dimensions by signal/complexity), starves both pillars (2 of 25 dimensions, no SOP, projectContext trimmed to counts), and adds speculative abstraction. The fix is delete-first, then rebuild the two pillars under quality gates.

## Handoff Type

requirement-candidate — refinement of the recipe no-guess line; reverses Group B1/B2 of the just-accepted `alembic-recipe-no-guess-residual-gap-closure-2026-06-23`.

## Confirmed User Goal

Make `alembic_plan draft` supply complete two-pillar material (project facts + all dimensions/SOP, factual language tag only, no judgment) so the Agent authors a valuable Plan for cold-start. Front-load a clean pre-deletion of all judgment filtering and the orphaned project-intelligence pipeline; build the new payload in independently-gated phases that block progress when draft output is substandard.

## Final Completion Definition

See [requirement design](alembic-plan-draft-pure-collection-2026-06-23.md). In short:

- Draft path has **no** judgment-type filtering (no domain-signal/complexity/foundational/scale decision); only a transparent factual `languageApplicable` tag.
- Orphaned `ProjectIntelligenceRunner` (`runAllPhases`) pipeline and `CodeEntityGraph` materialization deleted; live shared types `DimensionDef`/`ProjectSnapshot`/`GuardAudit` preserved/rehomed; build green.
- Draft returns full untrimmed projectContext + full mission-briefing facts + all 25 dimensions each with complete SOP + factual language tag + raw signals as facts.
- `confirm` accepts any dimension from the full 25-catalog; `get` round-trips; cold-start consumes the Plan.
- Test proves draft → valuable Plan → cold-start on a real project (BiliDili) with raw evidence.

## Current Design Status

- Requirement design status: complete
- User confirmation status: confirmed by direct user request on 2026-06-23 (plan meaning, fact-vs-judgment filter boundary, project-intelligence deletion, CodeEntityGraph deletion all explicitly approved)
- Mainline relation status: refines/reverses B1/B2 of residual-gap closure; F5/G3/J/Panorama-residual unaffected
- Code fact status: Design verified draft assembly, dimension-selection, the dead runner (zero live callers), and ProjectContext coverage of code-entity/call-graph via raw grep + file reads
- Needs Wakeflow code research: no before intake; implementing windows must run the mandatory import-sweep gates listed in the design before each deletion, with build verification
- Detached Design mode: no

## Recommended Next Step

Controller intake this handoff, create state root `alembic-plan-draft-pure-collection-2026-06-23`, then run **P0a + P0b pre-deletion first** (zero-residue gate) before any payload build. After P0 is green, P1 (project facts) and P2 (dimensions+SOP) can run in parallel; P3 (confirm + chain) after P2; P4 (Test BiliDili end-to-end) after P1+P2+P3 accepted.

## Functional Loop Summary

- Input: real ProjectContext facts; the built-in dimension catalog + SOPs; the Agent's planning judgment.
- Output: a draft fact-package (two pillars + factual language tag) → Agent-authored valuable Plan → cold-start precondition.
- State change: Core/Plugin code + tests; deleted orphaned pipeline; rehomed types; Wakeflow state root; final Test evidence.
- Producer: AlembicCore (delete dimension judgment + orphaned pipeline + CodeEntityGraph; expose registry/SOP; rehome types); AlembicPlugin (draft assembly, confirm, DI cleanup).
- Consumer: the host Agent (authors Plan); cold-start (consumes Plan); Test (validates end-to-end).
- Failure path: return blocked/needs-review with exact code path + owner; never accept a substandard draft payload or a deletion that breaks a live consumer.

## Recommended Repository Coverage

| Window | Recommended Status | Responsibility | Dependency / Blocker |
| --- | --- | --- | --- |
| AlembicCore | participates | P0a dimension-judgment delete; P0b orphaned pipeline + CodeEntityGraph delete + type rehome; P2 registry/SOP exposure | None after intake; heavy/highest-risk window |
| AlembicPlugin | participates | P0a planningAids/trim delete; P0b DI cleanup; P1 full projectContext; P2 draft assembly + languageApplicable tag; P3 confirm full-catalog | Coordinates with Core per coupled phase |
| Test | participates | P4 BiliDili (+ ideally one non-Swift) end-to-end valuable-Plan acceptance | Wait for accepted P1+P2+P3 |
| AlembicDashboard | no-task | No UI work identified | Reopen only on direct residual evidence |
| Alembic | no-task | No main-repo work identified | Reopen only on direct residual evidence |
| Design | observing | Authority closed; re-engage only if a target proposes keeping a "thin" filter, compressing the payload, or narrowing scope | User/Design confirmation required for any such change |

## Evidence And Links

- Requirement design: [alembic-plan-draft-pure-collection-2026-06-23.md](alembic-plan-draft-pure-collection-2026-06-23.md)
- Parent no-guess correction design: [alembic-recipe-plan-no-guess-correction-2026-06-22.md](alembic-recipe-plan-no-guess-correction-2026-06-22.md)
- Residual-gap closure (this reverses its B1/B2): [alembic-recipe-no-guess-residual-gap-closure-2026-06-23.md](alembic-recipe-no-guess-residual-gap-closure-2026-06-23.md)
- Original recipe evolution design: [alembic-recipe-evolution-optimization-2026-06-21.md](alembic-recipe-evolution-optimization-2026-06-21.md)
- Key grounded evidence (file:line) is in the requirement design "Current Verified Evidence" section.

## Risks

- **Live-type entanglement (highest):** `DimensionDef`/`ProjectSnapshot`/`GuardAudit` live in `types/ProjectSnapshot.ts` inside the dead neighborhood and are used by ~10 live host-agent files. A blind directory delete breaks the live briefing path. P0b must rehome these, not delete them.
- **CodeEntityGraph residual sweep:** delete is safe per current evidence (no live writer/reader), but the implementing window must still confirm `WorkflowResultPersistence`/presenters/incrementalPlan liveness before removal; if a live reader surfaces, re-scope rather than force-delete.
- **Payload size:** full projectContext + all SOPs + full briefing is a large response by design. This is an accepted consequence of "supply complete material"; do not compress it away without a user/Design decision.
- **B1/B2 reversal churn:** this reverses logic accepted hours earlier in the residual-gap demand; the controller should note the supersession so the two are not treated as conflicting in-flight work.

## Non-Goals And Forbidden Shortcuts

- No judgment-type filtering, hidden silent dimension drop, draft-side scale estimation, or recommendation/top/subset/fallback.
- No deletion of dimension catalog, SOPs, ProjectContext capabilities, domain-signal facts, plan persistence, or the live shared types.
- No "thin" filter or payload compression "for size" without authority.
- No acceptance on target prose without raw commit/test/rg/runtime evidence.

## Phase Candidates

| Phase | Goal | Upstream / Downstream | Completion Signal |
| --- | --- | --- | --- |
| Pre | Intake + state root | User request / P0 | State root created, design captured |
| P0a | Delete draft judgment filter | Pre / P1,P2 | rg zero residue + green build |
| P0b | Delete orphaned pipeline + CodeEntityGraph; rehome types | Pre / P1,P2 | rg zero residue + live-type compile + green + no capability loss |
| P1 | Pillar A: project facts | P0 / P3,P4 | Raw payload reconstructs the project |
| P2 | Pillar B: dimensions + SOP + factual tag | P0 / P3,P4 | All dims + complete SOP + factual tag |
| P3 | confirm full-catalog + cold-start chain | P2 / P4 | select-any → confirm → get → cold-start |
| P4 | Test end-to-end valuable Plan | P1+P2+P3 / closeout | e2e valuable, raw evidence |

## Open Questions For Wakeflow

None blocking. If a product target proposes keeping any "basic" relevance filter beyond the factual `languageApplicable` tag, compressing the draft payload, or narrowing the deletion to leave residue, that is a scope change and must return to the user/Design instead of being accepted.

## Pre-Handoff Checklist

- Checked alignment checklist: yes
- This handoff does not include copyable implementation-window prompts: yes
- Phases remain candidates, not task packages: yes
- TODO / Backlog candidates are listed in Evidence And Links: yes
- Any deletion, downgrade, deferral, compatibility retention, or boundary change is marked as requiring authority: yes
