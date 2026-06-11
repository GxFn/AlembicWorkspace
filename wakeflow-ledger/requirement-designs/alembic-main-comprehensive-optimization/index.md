# Alembic Main Repository Comprehensive Optimization

Status: completed / controller-accepted 2026-06-12 / repo-internal scope
Maintained Window: AlembicWorkspace
Date: 2026-06-12
Design Key: alembic-main-comprehensive-optimization

## Controller Judgment

Same-logic sibling of the AlembicCore optimization (CO), scoped strictly to
the Alembic main repository. A three-agent Design-window audit at `1bd60af`
(clean tree) found a structurally clean repo (acyclic layers, accurate HTTP
route registry) with four drift classes: unevenly hardened owned surfaces
(14/31 raw HTTP routes, registry-外 mounts, unregistered tool handlers,
closure-based gateway mappings), inconsistent failure semantics (40% silent
catch blocks, problem taxonomy used by ~6/46 route files, a
permission-manager fallback that silently grants full access, daemon jobs
that can look alive after async death), overloaded vocabulary
(session/job/search, presence-switched HostIntentContext modes), and a
mis-shaped validation floor (tests not in `npm run check`, no auth/cancel
negatives, build-dashboard unwired — RC6 SD-2 pending, escape-hatch count
invisible).

User decisions inherited from the CO demand (same-logic request):
write-strict/read-tolerant failure posture, single-wave packaging,
AlembicPlugin hands-off globally (Codex is executing CKG there), version
bumps user-directed.

## Entry Points

- Audit evidence base:
  [main-audit-findings-2026-06-12.md](main-audit-findings-2026-06-12.md)
- Requirement design:
  [alembic-main-comprehensive-optimization-requirement-design-2026-06-12.md](alembic-main-comprehensive-optimization-requirement-design-2026-06-12.md)
- Candidate demand sequence:
  [alembic-main-comprehensive-optimization-demand-sequence-2026-06-12.json](alembic-main-comprehensive-optimization-demand-sequence-2026-06-12.json)
- Final acceptance archive:
  [final-acceptance-archive-2026-06-12.md](final-acceptance-archive-2026-06-12.md)

## Candidate Demand Order

| Order | Demand | Primary Window | Purpose |
| --- | --- | --- | --- |
| 0 | `...-ao0-fact-freeze-decision-matrix-2026-06-12` | AlembicWorkspace | Re-verify audit, freeze counts, user-confirm visible changes (permission fail-closed, status-code honesty, silent→loud list, SD-2 absorption). |
| 1 | `...-ao1-owned-surface-convergence-2026-06-12` | Alembic | 31/31 route validation, complete registry, problem-taxonomy boundaries, handler registry, auditable gateway. |
| 2 | `...-ao2-responsibility-semantics-2026-06-12` | Alembic | Repository vestige, glossary, explicit HostIntentContext modes, flag taxonomy, deprecated-cause representation. |
| 3 | `...-ao3-failure-semantics-edge-hardening-2026-06-12` | Alembic | Fail-closed permission fallback, truthful job state, serialized monitor, bounded locks, visible degradations. |
| 4 | `...-ao4-test-gate-floor-closure-2026-06-12` | Alembic | Tests into main check, missing negative suites, SD-2 dashboard wiring, escape-hatch ratchet. |
| 5 | `...-ao5-final-acceptance-archive-2026-06-12` | AlembicWorkspace | Full gate matrix, census-delta review, acceptance, archive. |

## Cross-Demand Boundaries

- Repo-internal only: no `@alembic/core` import-path changes (CO1 owns
  those), no shared-asset drift-gate changes (RC5/RC7), no resident tool
  schema changes without AO0 confirmation, no Plugin/Dashboard edits.
- RC6 SD-2 (Dashboard artifact pipeline, accepted small Alembic demand) is
  proposed for absorption into AO4.
- Planned follow-up (user-directed 2026-06-12): a cross-repo
  interface-alignment demand will be created only after CO + AO + AG + CKG
  all complete; until then every cross-repo surface stays as-is.

## Validation Backbone

typecheck, biome lint, lint:agent-extraction-boundary,
lint:core-import-boundary, lint:consumer-core-imports,
check:shared-asset-drift, test:unit (~926) + test:integration (~252) +
coverage (75/75/80/80) — plus each new gate with a demonstrated failure;
AO5 ends with Wakeflow verification.

## Stop Conditions

- Visible behavior change beyond the AO0-confirmed list (including any
  resident tool schema change).
- A raw route turns out to have a consumer depending on permissive parsing.
- Coverage drops, escape-hatch count grows, or a gate must be weakened.
- Any step requires editing another repository.
- Prose-only evidence.
