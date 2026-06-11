# AlembicAgent Comprehensive Optimization

Status: candidate / user-requested 2026-06-12 / repo-internal scope / needs controller intake
Maintained Window: AlembicWorkspace
Date: 2026-06-12
Design Key: alembic-agent-comprehensive-optimization

## Controller Judgment

Same-logic sibling of the AlembicCore optimization (CO), scoped strictly to
the AlembicAgent repository. A three-agent Design-window audit at `dc6d6f7`
(clean tree) found the strongest gate discipline in the workspace (15 exact
public exports, import ratchets, blocking 6-stage check) coexisting with
the workspace's largest untested mass (29 test files vs 214 source files;
forge/tasks/policies/profiles/coordination at zero) and its clearest
interface debt: the V1/V2 dual tool system that RC6 SD-3 already accepted a
two-phase convergence route for. Sharp edges verified in code: a
concurrency-slot check-then-increment race that can breach the cap, an
uncaught `MemoryStore.add()` crash path, evidence-retrieval failure
masquerading as "no evidence", no abort recovery, unbounded tool args and
prompts.

The sequence absorbs RC6 SD-3 (as AG1) and SD-4 (MemoryStore tripwire, in
AG2) — they ARE this repo's interface-responsibility debt. User decisions
inherited from the CO demand (same-logic request): write-strict/
read-tolerant posture, single-wave packaging, AlembicPlugin hands-off
globally, version bumps user-directed.

## Entry Points

- Audit evidence base:
  [agent-audit-findings-2026-06-12.md](agent-audit-findings-2026-06-12.md)
- Requirement design:
  [alembic-agent-comprehensive-optimization-requirement-design-2026-06-12.md](alembic-agent-comprehensive-optimization-requirement-design-2026-06-12.md)
- Candidate demand sequence:
  [alembic-agent-comprehensive-optimization-demand-sequence-2026-06-12.json](alembic-agent-comprehensive-optimization-demand-sequence-2026-06-12.json)
- Final acceptance archive:
  [final-acceptance-archive-2026-06-12.md](final-acceptance-archive-2026-06-12.md)

## Candidate Demand Order

| Order | Demand | Primary Window | Purpose |
| --- | --- | --- | --- |
| 0 | `...-ag0-fact-freeze-decision-matrix-2026-06-12` | AlembicWorkspace | Re-verify audit, freeze counts, confirm SD-3/SD-4 absorption, silent→loud list, abort-recovery scope. |
| 1 | `...-ag1-v1-v2-tool-system-convergence-2026-06-12` | AlembicAgent (+ one Alembic import-update commit) | Execute SD-3 two-phase: contracts to neutral home + 16 importers re-pointed, then V1 deletion, adapter collapse, ./tools retirement under the G5 lint. |
| 2 | `...-ag2-responsibility-semantics-2026-06-12` | AlembicAgent | AgentRuntime decomposition, SD-4 tripwire, glossary, flag registry, boundary-routed ModelRegistry access. |
| 3 | `...-ag3-failure-semantics-edge-hardening-2026-06-12` | AlembicAgent | Atomic slot accounting, typed memory-write errors, visible degraded reads, bounded inputs, abort recovery per ruling. |
| 4 | `...-ag4-test-gate-floor-closure-2026-06-12` | AlembicAgent | Suites for zero-coverage areas, V2 wiring + terminal execution tests, provider failure fixtures, signature smoke, floor snapshot. |
| 5 | `...-ag5-final-acceptance-archive-2026-06-12` | AlembicWorkspace | Full gate matrix, downstream Alembic build, census-delta review, acceptance, archive. |

## Cross-Demand Boundaries

- Repo-internal except one coordinated Alembic import-update commit when
  `./tools` retires (AG1); AlembicPlugin consumes nothing from this package
  and is never touched.
- Absorbs RC6 SD-3 (V1→V2 convergence) and SD-4 (MemoryStore tripwire;
  adapter stays in Agent, Option-C end state stays a recorded trigger).
- No `@alembic/core` import-path changes (CO1 owns the wave); the 51-ref
  core-import baseline may only shrink; RC3 boundary gates are never
  weakened.
- Planned follow-up (user-directed 2026-06-12): a cross-repo
  interface-alignment demand will be created only after CO + AO + AG + CKG
  all complete.

## Validation Backbone

`npm run check` (build:check, biome, lint:agent-import-boundary,
lint:public-api-boundary, lint:core-import-boundary, 197+ tests) per
demand, plus each new gate with a demonstrated failure; AG1 adds per-phase
green proof and the Alembic downstream build; AG5 adds smoke public
imports, release guards, and Wakeflow verification. Baseline: 197 tests,
15 exports, 51 core refs, 431 pack entries.

## Stop Conditions

- Any RC3 boundary config or demonstrated-failure gate would be weakened.
- A V1 contract consumer appears outside the 16 frozen sites.
- Public surface changes beyond the SD-3-planned retirement, or visible
  behavior beyond the AG0-confirmed list.
- Core-import references would grow above the 51 baseline.
- Any step would require editing AlembicPlugin — defer with owner +
  post-CKG trigger.
- Prose-only evidence.
