# Alembic Prime Output Quality Optimization Workspace Handoff

Date: 2026-06-16

Status: ready-for-workspace

Source Window: Design

Receiving Window: Wakeflow

Design Key: `alembic-prime-output-quality-optimization-2026-06-16`

## Summary

Wakeflow should review a confirmed new demand to rebuild `alembic_prime` as an
independent code-development-only Recipe priming tool. Prime should no longer
depend on `alembic_intent`; old intent coupling should be disconnected and
deleted. Prime should accept a direct coding requirement frame, retrieve
relevant design-pattern and architecture-convention Recipes, and use generated
semantic-region vector chunks without modifying Recipe source files.

## Handoff Type

requirement-candidate

## Confirmed User Goal

- Optimize `alembic_prime` output quality for code development tasks.
- Return useful project design patterns and architecture norms for the current
  coding requirement.
- Make `alembic_prime` independent from `alembic_intent`.
- Build semantic-region vector chunks from existing Recipe content and save
  them as derived vector index items.
- Keep Recipe source files and Recipe schema unchanged in this demand.

## Final Completion Definition

The demand is complete only when a fresh MCP validation proves:

- `alembic_prime` can be called directly with a standalone coding requirement
  frame.
- `alembic_intent`, `intentRef`, `recognizedIntent`, `HostIntentFrame`, and
  intent persistence are not required or supported prime routes.
- Prime enforces `taskAction + requirementGoal + at least one locator facet`.
- Semantic-region chunks are generated and persisted through rebuild / refresh
  / knowledge sync flows, not normal prime query handling.
- Trusted prime material requires direct requirement evidence plus Recipe
  locator / region evidence.
- Non-code turns skip cleanly.
- Resident-unavailable cases degrade honestly.

## Current Design Status

- Requirement design status: confirmed and ready for controller intake.
- User confirmation status: confirmed across all remaining decision points.
- Mainline relation status: after-current.
- Original plan confirmation status: requirement design itself is confirmed;
  no separate original-plan artifact was created.
- Code fact status: enough for controller intake; APQ0 must perform read-only
  implementation inventory before code changes.
- Needs Wakeflow code research: yes, APQ0.
- Detached Design mode: no.
- Relation to Wakeflow current mainline: new independent demand. It should not
  interrupt active ASQ unless the controller decides prime separation is a
  blocker for current ASQ work.

## Recommended Next Step

Create controller intake for a new independent demand, then create APQ0 as the
first read-only package.

This recommendation is for Wakeflow review only. It is not an implementation
window prompt.

## Functional Loop Summary

- User scenario: a host agent is about to implement, fix, refactor, or write
  tests and needs project-specific design/architecture guidance.
- Input: direct `alembic_prime` coding requirement frame with `taskAction`,
  `requirementGoal`, and at least one locator facet.
- Output: compact Recipe guidance with id, title, trigger, matched region
  classes, useful slices, trust layer, and refs.
- State change: derived semantic-region vector index may be rebuilt/refreshed;
  Recipe source files are not changed.
- Producer: AlembicCore/Alembic resident vector index generation; Plugin prime
  schema/handler/output projection.
- Consumer: host agent through `alembic_prime`.
- Failure path: skipped for non-code tasks; degraded for missing locator input,
  missing resident semantic-region index, or weak Recipe evidence.

## Recommended Repository Coverage

| Window | Recommended Status | Recommended Responsibility | Dependency / Blocker |
| --- | --- | --- | --- |
| AlembicPlugin | participates | Public MCP schema, prime handler, intent-route deletion, code-development gate, output projection, MCP tests. | Needs APQ0 inventory before implementation. |
| AlembicCore | participates | Recipe row reading, semantic-region chunk builder, VectorStore item contract, region index reconciliation, tests. | Depends on APQ2 readiness evidence. |
| Alembic | participates | Resident embedding/vector route, semantic-region retrieval, prime injection package metadata. | Depends on APQ3 generated index contract. |
| Design | design-complete | Requirement design, requirement group, and handoff. | No further Design work expected unless controller finds a scope gap. |
| Test | observing / conditional | Fresh MCP validation only after product self-validation and local plugin refresh. | Controller decides whether APQ6 needs a Test window. |

## Evidence And Links

- Requirement design:
  `Design/docs/current/alembic-prime-output-quality-optimization-requirement-design-2026-06-16.md`
- Requirement group:
  `Design/docs/current/alembic-prime-output-quality-optimization-requirement-group-2026-06-16.md`
- Handoff:
  `Design/docs/current/alembic-prime-output-quality-optimization-workspace-handoff-2026-06-16.md`
- User decisions: current Design conversation on 2026-06-16.
- Related current mainline:
  `.wakeflow-active/current/alembic-search-output-quality-optimization`

## Risks

- Keeping an ignored intent compatibility path would recreate the coupling the
  user rejected.
- Query-time region generation would make prime slow and blur indexing versus
  retrieval responsibilities.
- Whole-entry vector similarity can look plausible but still select the wrong
  Recipe without region evidence.
- Plugin-only fallback can be mistaken for strong semantic matching unless
  degraded diagnostics are explicit.
- Recipe authoring gaps may remain after infrastructure work and should become
  a later Recipe quality demand, not hidden inside this implementation route.

## Non-Goals And Forbidden Shortcuts

- No `alembic_intent` producer path.
- No `intentRef` / `recognizedIntent` compatibility route.
- No Recipe source or schema migration in this demand.
- No query-time vector chunk generation.
- No general knowledge search, project map, source graph, or ProjectContext
  behavior inside prime.
- No Test dispatch before product self-validation.

## Phase Candidates

| Phase | Goal | Upstream / Downstream | Completion Signal |
| --- | --- | --- | --- |
| APQ0 | Prime input baseline and intent-coupling deletion inventory | First controller package | Current schema/handler/tests and deletion targets recorded. |
| APQ1 | Standalone prime code-development gate | After APQ0 | Non-code and obsolete intent routes blocked before retrieval. |
| APQ2 | Recipe locator field audit and region readiness | After APQ0 | Existing Recipe fields measured without modifying Recipe files. |
| APQ3 | Semantic-region chunk builder and persisted index | After APQ2 | `recipe_region_*` items generated, saved, filtered, and reconciled. |
| APQ4 | Resident requirement-to-Recipe retrieval | After APQ3 | Region-class vector matches return evidence and degrade honestly. |
| APQ5 | Prime selection, trust gating, and lean projection | After APQ1/APQ4 | Plugin output is compact, region-evidence gated, and obsolete intent routes are gone. |
| APQ6 | End-to-end host-agent SQ proof | After APQ5 | Fresh MCP probes prove useful behavior and clean skips/degrades. |

Phase candidates are for controller review only and are not task packages.

## Open Questions For Wakeflow

1. Should this demand wait until active ASQ reaches a stable checkpoint, or can
   APQ0 run in parallel as read-only evidence?
2. Should APQ6 use a Test window, or is AlembicPlugin self-validation plus a
   fresh temporary MCP window enough?

## Design Handoff

- Source: confirmed Design requirement and current user decisions on
  `alembic_prime`.
- Goal: standalone, high-quality, code-development Recipe priming.
- Confirmed decisions: disconnect/delete `alembic_intent`; require minimum
  direct prime input; save derived semantic-region vectors; no Recipe mutation;
  honest resident fallback; no query-time generation; APQ0-APQ6 order.
- Design recommendations: controller intake as an independent demand, then
  APQ0 read-only inventory first.
- Open questions: scheduling relative to ASQ; Test need at APQ6.
- Non-goals: intent compatibility, Recipe schema migration, ProjectContext or
  search/graph behavior, query-time indexing.
- Risks: intent coupling drift, weak Recipe locator quality, misleading
  whole-entry vector matches, resident degradation ambiguity.
- Required controller judgment: state root creation, scheduling, APQ0 package,
  repository ownership, and APQ6 validation route.
- Suggested next action: controller intake and APQ0 package creation.
- Suggested skills: wakeflow-governance, wakeflow-controller,
  requirement-design, design-handoff.
- Source artifacts: requirement design, requirement group, this handoff.
- Redaction notes: no secrets, tokens, or real thread ids included.
- Intake status: ready-for-controller-intake.

## Pre-Handoff Checklist

- Checked `docs/workspace-alignment-checklist.md`: yes.
- This handoff does not include copyable implementation-window prompts: yes.
- Phases remain candidates, not task packages: yes.
- TODO / Backlog candidates are listed in Evidence And Links: no direct TODO
  candidate; controller should decide whether to create a new demand state root.
- Any deletion, downgrade, deferral, compatibility retention, or boundary
  change is marked as pending confirmation: user confirmed direct deletion of
  intent coupling; no compatibility retention is requested.
