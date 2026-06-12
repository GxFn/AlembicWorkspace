# Alembic Space Structure And Naming Normalization

Status: candidate / user-requested 2026-06-12 / all four SN0 user gates adopted 2026-06-12 (codify-dominants convention, lib/codex rename in SN5, ignore-revs blame discipline, wildcard dirs frozen until post-SD-5-p2) / execution waves are the final cleanup train, Plugin wave CKG+CC gated / needs controller intake
Maintained Window: AlembicWorkspace
Date: 2026-06-12
Design Key: alembic-space-structure-naming-normalization

## Controller Judgment

The user requested a space-wide unification of folder hierarchy and file
naming, designed along responsibility/function and organizational
layering, with a real landing plan. The census shows a dominant
convention already exists (lowercase/kebab directories; PascalCase class
modules, single-lower barrels, kebab multi-word utilities) with only
~30 camelCase stragglers across the space (Agent already at 0) — so the
right route is codifying the dominants and normalizing stragglers, not
inventing a style. The hard parts are exactly what a naive rename
ignores: target trees must follow the AD2/AD3 written responsibility
contracts, Core's wildcard-exposed directories are public specifiers
(frozen until after SD-5 phase 2), a dozen path-based gate configs must
move in the same commit as their targets, blame must survive, and waves
must never collide with in-flight demands — hence the final-cleanup-
train queue position, one repo per wave, easy-to-hard (Dashboard pilot →
Agent → Alembic → Core → Plugin post-CKG+CC, where the CC-deferred
`lib/codex/` host-neutral rename finds its home).

## Entry Points

- Findings evidence base:
  [structure-naming-findings-2026-06-12.md](structure-naming-findings-2026-06-12.md)
- Requirement design:
  [alembic-space-structure-naming-normalization-requirement-design-2026-06-12.md](alembic-space-structure-naming-normalization-requirement-design-2026-06-12.md)
- Candidate demand sequence:
  [alembic-space-structure-naming-normalization-demand-sequence-2026-06-12.json](alembic-space-structure-naming-normalization-demand-sequence-2026-06-12.json)

## Candidate Demand Order

| Order | Demand | Primary Window | Purpose |
| --- | --- | --- | --- |
| 0 | `...-sn0-convention-census-target-trees-2026-06-12` | AlembicWorkspace (after AD3) | Convention spec from measured dominants; full census incl. `.tsx`; target trees from AD contracts; public-path + gate-config constraint maps; tooling spec; turn the four adopted gates into the convention artifact, SN5 rename plan, commit protocol, and frozen-path list. |
| 1 | `...-sn1-tooling-pilot-dashboard-2026-06-12` | AlembicDashboard | Build the codemod pipeline; pilot the wave pattern on the smallest consumer-free repo; pilot report. |
| 2 | `...-sn2-agent-wave-2026-06-12` | AlembicAgent | Cleanest package repo: tree per AD3 contract; boundary configs in-commit; 15-export surface byte-stable. |
| 3 | `...-sn3-alembic-wave-2026-06-12` | Alembic | Largest tree (16 areas) per AD3 contract; extraction/repo-boundary lints + RC5 manifest paths in-commit. |
| 4 | `...-sn4-core-wave-2026-06-12` | AlembicCore | Public-surface wave: exports-map-shielded moves; wildcard dirs per SN0 ruling; three-consumer proof. |
| 5 | `...-sn5-plugin-wave-2026-06-12` | AlembicPlugin — **gates: CKG paused-clean + CC landed** | Plugin wave incl. the SN0-ruled `lib/codex/` host-neutral rename; both host parity gates green. |
| 6 | `...-sn6-space-acceptance-archive-2026-06-12` | AlembicWorkspace | Naming lint green everywhere; stragglers zero; trees realized; mechanical-diff audits; archive. |

## Cross-Demand Boundaries

- Consumes AD2 charters + AD3 layer contracts as the semantic source for
  target trees (SN0 runs after AD3); consumes IC single-sourcing
  outcomes (file homes settle before renames); waves run only on repos
  with no other in-flight demand — the final cleanup train after the
  CKG/IC/AD/MT bodies land per repo.
- Absorbs the CC-deferred Plugin `lib/codex/` cosmetic rename (SN5,
  subject to the SN0 user gate).
- Public-specifier safety: wildcard-exposed Core directories frozen
  until after SD-5 phase 2 per the recommended SN0 ruling; exports-
  mapped moves are specifier-stable by map updates.
- All existing gates and ratchets are protection nets — never weakened;
  renames must update path-based gate configs in the same commit.
- Portfolio plan note (2026-06-12): per
  [the portfolio execution plan](../alembic-portfolio-execution-plan/index.md),
  SN0's census parts are pre-done in P0 (SN0 slims to target-tree work
  after AD3); SN1-SN6 run as Phase 4, the final cleanup train; SN5 after
  the P3 Plugin train.

## Validation Backbone

Per wave: the repo's full check + every path-based gate it hosts +
downstream consumer builds + the new naming lint with a demonstrated
failure + a behavior-neutrality mechanical-diff audit; SN4 adds
three-consumer import scans; SN5 adds both host parity gates; SN6 runs
the space matrix and Wakeflow verification.

## Stop Conditions

- A move would change a public specifier outside the SN0 ruling.
- A path-based gate config cannot move in the same commit as its
  targets.
- The target repo has any other in-flight demand.
- A wave diff contains semantic changes beyond moves/renames.
- Plugin wave before CKG completion and CC packaging.
- Prose-only evidence.
