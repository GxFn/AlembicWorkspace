# AlembicCore Comprehensive Optimization

Status: COMPLETED 2026-06-12 / CO0-CO5 all accepted and closed (CO0 rev 5, CO1 rev 10 [p1 Core 4f7abf6 + p2 Alembic d58e4a3, p3 dissolved on evidence], CO2 rev 6 [215e7a4], CO3 rev 6 [f8c45d0, delivery-loss incident recovered per RC3 playbook], CO4 rev 6 [c73d5c4, real totalCount defect repaired], CO5 final gate matrix all green incl. release:check on clean tree) / final acceptance archive: [final-acceptance-archive-2026-06-12.md](final-acceptance-archive-2026-06-12.md) / open decisions registered, none blocking: coverage enforcement PENDING USER, scanner multi-line blind spot + Plugin migrations post-CKG, facade promotion + panorama inversion as user-confirmed future waves
Maintained Window: AlembicWorkspace
Date: 2026-06-12
Design Key: alembic-core-comprehensive-optimization

## Controller Judgment

The user requested a deep, real-code scan of AlembicCore and a new
comprehensive optimization demand covering: problem discovery, clear
interface responsibilities, edge-case behavior, and unambiguous semantics.
A five-agent Design-window audit at Core `ed42960` (clean tree) found the
repository structurally healthy but drifting in four ways: a sprawling
public surface (140 export keys, 98 transitional, 61 wildcard with 45
unmapped migration groups, 14 zero-consumer curated exports, four parallel
source-graph facades), an unwritten and unenforced layer contract with a few
specific upward imports, inconsistent failure semantics (43 silent-swallow
catch sites in the service layer, file-first writes that can diverge from
the DB without alarm, a search index that silently returns empty), and a
test floor with holes at the highest-risk spots (zero migration re-run
tests, near-zero coverage in repository/code|sync|sourceref and
service/candidate|panorama, consumer-import lint and smoke not in the main
pipeline).

This is a hardening and clarification sequence: no new features, no
capability removal beyond proven zero-consumer surface, and every
user-visible semantics change (silent failures becoming loud) is confirmed
at CO0 before implementation.

User scope decisions (2026-06-12): CO proceeds now, in parallel with the
Codex host executing CKG in AlembicPlugin — CO never modifies AlembicPlugin
and leaves the converged surface as the ready interface for the Plugin/CKG
side; CO3 follows a write-strict / read-tolerant posture; `core/` is
blessed as an importable analysis leaf (only ModuleDiscoverer→
TargetClassifier gets repaired); CO1 runs as one wave covering removals,
source-graph facade unification, mapped migrations, RC6 SD-5 phase-1
deprecate-marks, and Alembic/AlembicAgent import updates.

## Entry Points

- Audit evidence base:
  [core-audit-findings-2026-06-12.md](core-audit-findings-2026-06-12.md)
- Requirement design:
  [alembic-core-comprehensive-optimization-requirement-design-2026-06-12.md](alembic-core-comprehensive-optimization-requirement-design-2026-06-12.md)
- Candidate demand sequence:
  [alembic-core-comprehensive-optimization-demand-sequence-2026-06-12.json](alembic-core-comprehensive-optimization-demand-sequence-2026-06-12.json)

## Final Goal

AlembicCore reaches: an intentional public API surface (every export has a
consumer or an owned deprecation path; one canonical facade per capability;
prescriptive boundary gate), a written and lint-enforced layer contract,
honest critical-path failure semantics with typed errors and diagnostics, a
published semantic glossary reflected in types, and a closed test/gate floor
(migration re-run tests, suites for the weak areas, blocking pipeline
wiring) — with all existing gates and downstream consumer builds green.

## Candidate Demand Order

| Order | Demand | Primary Window | Purpose |
| --- | --- | --- | --- |
| 0 | `...-co0-fact-freeze-decision-matrix-2026-06-12` | AlembicWorkspace | Re-verify the audit, build the keep/fix/route/defer matrix, confirm visible-behavior changes and export removals with the user, reconcile RC6 outputs. |
| 1 | `...-co1-public-api-surface-convergence-2026-06-12` | AlembicCore (+ Alembic, AlembicAgent; Plugin hands-off) | Remove zero-consumer exports, unify the source-graph facade, own every wildcard group, execute RC6 SD-5 phase-1 deprecate-marks, make the boundary gate prescriptive, wire consumer/smoke gates into the pipeline. |
| 2 | `...-co2-layer-contract-responsibility-repair-2026-06-12` | AlembicCore | Write + lint-enforce the layer contract, repair/bless upward imports, unify validator entry, settle straddlers, close deprecation debris, publish the glossary. |
| 3 | `...-co3-failure-semantics-edge-hardening-2026-06-12` | AlembicCore | Eliminate confirmed silent failures, surface file/DB divergence, guard lifecycle transitions, explicit concurrency/path-safety policies. |
| 4 | `...-co4-test-gate-floor-closure-2026-06-12` | AlembicCore | Migration re-run tests, suites for near-zero-coverage areas, skip/only cleanup, threshold hold, blocking gate wiring. |
| 5 | `...-co5-final-acceptance-archive-2026-06-12` | AlembicWorkspace | Full gate matrix + downstream builds, census-delta review against the CO0 matrix, acceptance and archive. |

## Cross-Demand Boundaries

- RC2 (completed) headless/deterministic work is not redone here.
- RC0-RC7 completed 2026-06-12; the RC6 decision register
  (`../alembic-redundancy-stale-logic-cleanup/rc6-structural-debt-decisions-2026-06-12.md`)
  is the routing source: SD-5 (Core Wave 3B export closeout, accepted
  two-phase 98→31) merges into CO1 — phase 1 inside the CO1 wave, phase 2
  release-aligned after the post-CKG Plugin vendor refresh; SD-1 phase 2
  (Core sinking) stays outside CO and sequenced after SD-5 closeout; SD-3 /
  SD-4 / SD-2 are independent non-Plugin demands that may run alongside CO
  at controller discretion.
- AlembicPlugin is hands-off for this sequence (user-directed 2026-06-12):
  the Codex host is actively executing CKG there. Any CO item that would
  require editing AlembicPlugin is deferred with owner = AlembicPlugin
  window and trigger = post-CKG.
- CKG boundaries: CKG1 owns MissionBriefing/staged-SOP restructuring and
  guidance-text dedup; CKG2 owns source-graph lifecycle wiring; CKG3 owns
  submit/dimension evidence-gate enforcement (including the
  computed-but-not-enforced quality gate); CKG4 owns the Codex tool surface.
  CO1's source-graph facade unification must be sequenced with CKG2/CKG4 as
  their first real consumer.
- Version bumps and releases remain user-directed; CO never publishes.

## Validation Backbone

Per demand: typecheck, build:check, lint:public-api-boundary, vitest (1048+
tests, thresholds held), biome — plus each newly introduced gate with a
demonstrated failure. CO1/CO5 add fresh cross-repo import scans and
downstream builds (Alembic, AlembicAgent, AlembicPlugin; Dashboard `npm run
check` participation). CO5 ends with Wakeflow verification.

## Stop Conditions

- A removal candidate has any consumer (code, script, test, or published
  surface).
- A change would alter user-visible behavior beyond the CO0-confirmed list.
- Transitional/wildcard counts grow, a coverage threshold drops, or a gate
  must be weakened to pass.
- A conflict with CKG slices or an RC6 decision emerges — reconcile at
  controller level before continuing.
- Any step would require editing AlembicPlugin code or its vendored copy —
  stop that item and defer it with owner + post-CKG trigger.
- Any target returns prose-only evidence without diffs, scans, and gate
  logs.
