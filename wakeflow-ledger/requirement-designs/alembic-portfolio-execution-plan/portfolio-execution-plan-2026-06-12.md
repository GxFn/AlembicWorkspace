# Alembic Demand Portfolio Execution Plan

Status: user-authorized for controller intake 2026-06-12 (four structural mergers confirmed; unattended advancement authorized per the user's dispatch prompt; releases stay user-triggered)
Date: 2026-06-12
Design Key: alembic-portfolio-execution-plan
Scope: re-packages dispatch across the six live sequences (CKG in flight;
IC, AD, CC, MT, SN candidates; MPB residue). Demand definitions remain the
completion-definition source; this plan changes grouping, order, and
packaging — plus four explicit structural mergers listed in §4.

## 1. Portfolio State (verified 2026-06-12)

| Sequence | State | Remaining |
| --- | --- | --- |
| CKG (PAUSED by user 2026-06-12) | CKG1 onboarding contract (`838da9e`), CKG2 source-graph lifecycle (Core `68f7ad5`), CKG3 evidence gates (`ef90c9b`) landed; paused at this stable point | CKG4-CKG7 (incl. the real host-agent cold-start acceptance) deferred to a user-decided resumption; resumption package collects Train H findings, the duality-resolved surface, the SOP host-variable signal, MT certification state |
| IC interface cleansing | rulings recorded | IC0-IC6 |
| AD architecture deepening | four gates adopted | AD0-AD7 |
| CC Claude Code plugin | three gates adopted | CC0-CC4 |
| MT MCP tool certification | three gates adopted | MT0-MT4 |
| SN structure/naming | four gates adopted | SN0-SN6 |
| MPB marketplace bootstrap | candidate; packaging partially superseded during CKG (thin runtime package, no tarballs in committed state) | remaining scope to re-freeze |

Standing constraints: Plugin code edits gated on CKG completion;
write-strict/read-tolerant posture; releases user-directed; all existing
gates/ratchets are protection nets.

## 2. The Inefficiency Being Fixed

- Five controller fact-freeze demands (IC0/AD0/CC0/MT0/SN0) whose user
  gates are ALL already adopted — five dispatch cycles for what is now
  one consolidated baseline pass.
- The post-CKG Plugin work is fragmented across four queues (IC5, CC1-4,
  MT plugin fixes, SN5) — four intake/validation cycles serially hitting
  one window with overlapping parity/smoke gates.
- The Core window receives many small demands (IC1, IC4, MT2, ratchet
  wiring) that share one validation floor — mergeable into one wave.
- The Alembic window likewise (IC2, IC3, MT3).
- Five sequence-final acceptances where the post-CKG ones (IC6, CC4)
  belong to the same evidence set.

## 3. The Plan — Five Phases Plus The Release Wave

### P0 — Unified Fact Freeze And Planning Baseline (AlembicWorkspace; immediate; parallel with CKG)

One controller demand merging IC0 + AD0 + CC0 + MT0's census/evidence
half (all rulings already recorded; remaining work is baseline
production):

- all census re-freezes (seams, architecture, naming incl. `.tsx`,
  tool inventory, Plugin consumption, MPB packaging state);
- artifacts: side-effect doctrine standing rule + blessed-singleton
  whitelist draft; five charter drafts; CC packaging facts + Claude Code
  official-spec reconciliation; MT expectation sheets + real-misuse
  harvest; DCR-residue consumer scans with per-surface verdicts;
  coverage ratchet values fixed; `./tools` migration list frozen;
  Dashboard type-artifact spec; 0.3.0 release-wave ledger opened;
- relay the CKG SOP host-variable signal to the Codex side (time-
  critical);
- output: one planning baseline the controller dispatches everything
  else from.

### P1 — Mainline Trains (parallel per window, while CKG4-CKG7 finish)

- **Train H (first)**: MT harness build + MT1 full sweep on both
  runtimes (AlembicWorkspace + Test) — produces the certification
  matrix v1 and feeds fix lists into Trains A/B; source-graph-tool
  findings hand to CKG4 immediately.
- **Train A (AlembicCore, one wave)**: IC1 wire-type single-sourcing +
  IC4 error-registry unification + MT2 output-budget mechanism +
  coverage-ratchet wiring + IC4's panorama-inversion repair and
  taxonomy-facade staging. One window, one validation cycle, shared
  floor.
- **Train B (Alembic primary; Agent + Dashboard coordinated commits,
  one wave)**: IC2 Dashboard-contract gate + DCR-residue execution +
  IC3 `./tools` downstream migration and retirement + MT3 usage-error
  hardening (descriptions, schemas, misuse-case closure). Dashboard
  lands its generated-types + gate commits; Agent lands the `./tools`
  retirement under its boundary gates.

P1 exit: every non-Plugin seam from IC/MT is closed; Core mechanisms
live; certification matrix populated for non-Plugin tools.

### P2 — Architecture Deepening (AD1→AD6, then AD7)

Runs after P1 trains (consumes their outputs: types/registry/budgets are
in place before contracts and doctrine are enforced):

- AD1 DAG codification → AD2 charters + placement decision register
  (absorbs SD-1 phase 2, SD-6, R-1, SD-4 end-state questions) →
  AD3 layer contracts (Alembic/Agent/Dashboard) → AD4 decoupling +
  side-effect doctrine enforcement → AD5 foundational upgrades →
  AD6 independence + pure-boundary proof → AD7 acceptance.
- Window-interleaving with P3 at controller discretion (AD is
  non-Plugin; serialize only the Core window between AD4/AD5 and P3's
  Core parts).

### P3 — Plugin Unified Train (gate: CKG paused-clean, user-directed 2026-06-12; merges four queues)

Gate redefinition: with CKG paused by the user, P3 no longer waits for
CKG completion. It opens once the controller verifies the pause is
clean: CKG dispatch stopped, the Codex window quiesced, the Plugin tree
clean and pushed, the CKG pause record + resumption package opened.
Plugin hands-off lifts at that verification. Step 7's tool-duality
resolution proceeds on the CURRENT committed surface (no CKG4
dependency); the CKG resumption inherits the cleaned surface. CC3/CC4
run against the landed CKG1-CKG3 contract (P0 re-freezes what those
commits actually delivered).

One coherent train on AlembicPlugin (+ Core for SD-5), in this internal
order:

1. vendor submodule refresh onto current Core; keep-alive review;
2. IC5 migrations: 37 keep-alive + 19 allowlisted specifiers onto stable
   facades; allowlist fold; scanner blind-spot fix;
3. CC1 host parameterization (claude-code end-to-end; Codex parity gate
   from here on every step);
4. MT Plugin fixes: budgets + descriptions/schemas per the P1
   certification matrix;
5. distribution sub-wave: CC2 Claude Code packaging + the MPB remaining
   Codex-shell scope (one pinned npm runtime, two thin host shells) —
   MPB stops being a standalone sequence;
6. CC3 cold start + skill delivery on Claude Code;
7. tool-surface duality resolution per the CKG4 outcome; Plugin error
   taxonomy into the registry;
8. SD-5 phase 2 staged (67 deletions, 98→31) into the 0.3.0 wave;
9. acceptance: CC4 dual-host real-agent acceptance + IC6 space gate
   matrix merged as the train's exit review.

### P4 — Final Cleanup Train (SN)

- SN0 (slim: census parts pre-done in P0; needs AD3 target-tree input)
  → SN1 Dashboard pilot → SN2 Agent → SN3 Alembic → SN4 Core → SN5
  Plugin (incl. `lib/codex/` rename) → SN6 terminal space acceptance.
- Each wave only on an idle repo; SN6 doubles as the portfolio's final
  census review.

### R — 0.3.0 Release Wave (user-triggered, assembled by P3)

SD-5 phase-2 deletion + taxonomy facade promotion + pinned runtime
publication needs (per distribution sub-wave) — the package list is
delivered to the user; execution only on the user's release decision.

### CKG Path (PAUSED by user 2026-06-12)

CKG paused at the CKG1/CKG2/CKG3 landed point; CKG4-CKG7 (including the
real host-agent cold-start acceptance) deferred to a user-decided
resumption. The controller executes the pause (stop dispatch, verify
Codex-window quiesce + Plugin tree clean/pushed, write the pause record,
open the resumption package). The resumption package accumulates: Train
H source-graph-tool findings, the P3-resolved tool surface, the SOP
host-variable signal, MT certification state for Plugin tools. CKG6's
Dashboard/Alembic observability ideas stay inside the deferred scope.

## 4. Explicit Structural Mergers (the re-grouping deltas)

1. IC0 + AD0 + CC0 + MT0(census/evidence) → **P0** single controller
   demand; MT0's harness build moves to Train H.
2. IC1 + IC4 + MT2 + ratchet wiring → **Train A** single Core wave.
3. IC2 + IC3 + MT3 → **Train B** single coordinated wave.
4. IC5 + CC1-CC4 + MT Plugin fixes + MPB remaining scope + SD-5 p2
   staging → **P3 Plugin train**; IC6's space matrix merges into the
   P3 acceptance; **MPB is dissolved as a standalone sequence**.

Everything else keeps its demand definition; AD and SN keep their
internal order; per-demand completion definitions and stop conditions
remain authoritative for the merged packages (a merged package must
satisfy ALL constituent definitions).

## 5. Dependency Spine (what truly orders what)

```text
P0 ──────────────────────────────┐
CKG pause-clean verification ────┤ (controller; opens P3 + lifts
Train H ──→ Train A / Train B ───┤  Plugin hands-off)
                                 ├──→ P3 Plugin train ──→ R (user release)
P2 AD1..AD7 (after P1; window-  ─┤
   interleaved with P3)          │
AD3 ──→ SN0 ──→ P4 SN waves ─────┘ (final train; SN5 after P3)

CKG4..CKG7: deferred; resume on user decision, consuming the
resumption package (post-P3 surface is the better starting point).
```

## 6. Controller Intake Notes

- This plan is dispatch packaging, not scope change, except §4's four
  mergers — confirm them at intake (the constituent demands' evidence
  requirements stack inside the merged packages).
- Per-window serialization is the only hard rule the plan adds; all
  parallelism is per-window-free.
- Recommended immediate actions: execute the CKG pause (stop dispatch,
  verify quiesce, write the pause record, open the resumption package);
  intake P0 now (everything in it is ruling-executed baseline work);
  start Train H right after. The SOP host-variable signal moves into the
  resumption package (no longer time-critical with CKG paused).
