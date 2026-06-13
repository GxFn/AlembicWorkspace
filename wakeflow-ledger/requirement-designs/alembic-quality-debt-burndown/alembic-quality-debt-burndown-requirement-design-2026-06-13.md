# Alembic Quality And Test-Infra Debt Burndown Requirement Design

Status: controller intake complete (reviewed 2026-06-13) / accumulated TODO rows / ready for user rulings — no wave executes until the user rules
Date: 2026-06-13
Design Key: alembic-quality-debt-burndown
Primary Windows: AlembicWorkspace (triage, coverage decision), AlembicCore, Alembic, AlembicAgent, AlembicPlugin (per-row)

## Problem

The portfolio's many waves each routed real but out-of-scope findings to
TODO rows rather than expanding any single wave. They accumulated into a
coherent quality/test-infra debt set that now needs a home: a recurring
stale-dist test-infra failure mode (surfaced four times), a schema-honesty
gap in the tool input validation, an unresolved coverage-enforcement
decision, a demonstrated first-session MCP-connect race, and several smaller
cleanups. None blocks anything; together they are the engineering-hygiene
remainder of the portfolio.

Source: [R package §4 open TODO rows](../alembic-portfolio-execution-plan/r-delivery-0.3.0-decision-package-2026-06-12.md),
[certification matrix v2](../alembic-mcp-tool-certification/certification-matrix-v2-2026-06-13.md),
[CKG resumption package P5 routed addition](../alembic-codex-cold-start-knowledge-graph-experience/ckg-resumption-package-2026-06-12.md).

## Goal

The accumulated debt is burned down or explicitly owned:

1. **TEST-INFRA-STALE-DIST-ALIAS** (four instances + the pin-`.tmp`-freshness
   and clean-build-before-pack-gate candidates) — the top test-infra debt:
   a stale `dist/` aliasing real behavior. Add a clean-build-before-pack
   gate and a `.tmp` freshness pin so the family cannot recur silently.
2. **CODE-GUARD-SCHEMA-LOOSENESS** (F-V2-1) — tool input schemas lack
   `additionalProperties: false` and accept malformed values (e.g.
   `symbol_search` accepts `limit: "ten"`). Tighten the schemas honestly
   with negative tests, per the parity-wave ruling.
3. **C4 coverage enforcement** — the configured 75/75/80/80 thresholds were
   never runnable; real coverage is measured and improving. Rule and wire:
   honest-baseline ratchet vs coverage uplift waves vs status quo.
4. **CC4 connect rows** — CC4-FIRST-SESSION-MCP-CONNECT (the demonstrated
   install-lock-wait race: 60s lock > 30s host connect timeout) and
   CC4-TIER-FLIP-CONNECT-CACHE — land the preventive fix (sub-timeout lock
   fail-fast ~20s with a structured retry-after diagnostic) and the
   docs/cache-clear step.
5. **Smaller cleanups**: C6 scratch-registry stale entry, C7 corrupted
   ghost-workspace DB in the real data root, CO4-CONSUMER-GATE-SIBLING-DRILL,
   the 3/178 empty-KB edge residuals, and the admin-tier scope note.

## Non-goals

- No behavior change to product paths beyond the honest-failure tightenings
  the user confirms (schema rejects malformed input; stale-dist gate fails
  loudly) — these are the intended hardenings, listed for confirmation.
- No coverage threshold lowering; the C4 decision is held until ruled.
- No Plugin code change before its own gate where a row touches the Plugin
  surface; dual-shell parity stays byte-stable.
- No CKG work (CC4 evidence-gate DX rows belong to the CKG resumption
  package, not here).

## Candidate Demand Sequence

### QD0 - Debt Triage And Coverage Ruling (AlembicWorkspace)

- re-freeze the debt rows from the TODO board with exact instances and
  owners; confirm the honest-failure tightenings are intended;
- USER RULING C4: coverage enforcement strategy (a honest-baseline ratchet
  at measured values / b coverage uplift waves / c status quo) with routing;
- rule the CC4 lock-fail-fast fix as a parity-budgeted wave; route each row
  to its owning repo.

### QD1 - Test-Infra Stale-Dist Family Closure (AlembicWorkspace + per repo)

- add the clean-build-before-pack gate and the `.tmp` freshness pin so a
  stale `dist/` can no longer alias real behavior or float a pack floor;
- demonstrate the gate fails on a deliberately stale dist and passes on a
  clean build; wire it into the affected repos' check/pack paths;
- annotate the four prior instances as closed against the family row.

### QD2 - Tool Schema Honesty (AlembicPlugin + Alembic)

- tighten the tool input schemas: add `additionalProperties: false` and
  type-correct field validation so malformed input is rejected with a
  taxonomy problem and a next action (F-V2-1 `limit: "ten"` class);
- negative tests per tightened tool; both shells' parity gates byte-stable;
  resident and plugin surfaces consistent.

### QD3 - Coverage Enforcement Wiring (per the C4 ruling)

- enact the C4 ruling: wire the chosen enforcement (ratchet floors at
  measured values, or scheduled uplift, or record status-quo with the
  provider installed-but-unwired note);
- demonstrated gate failure if a ratchet is chosen; thresholds never
  lowered.

### QD4 - CC4 Connect Hardening (AlembicPlugin)

- land the sub-timeout lock fail-fast (~20s) with a structured retry-after
  diagnostic so the install-lock wait can no longer exceed the host connect
  timeout; add the negative-cache clear step to the install docs;
- regression test for the lock-race window; CC4-TIER-FLIP-CONNECT-CACHE doc
  fix; dual-shell parity byte-stable.

### QD5 - Smaller Cleanups (per repo)

- C6 scratch-registry stale entry removed (user already OK'd); C7 corrupted
  ghost-workspace DB in the real data root cleaned or quarantined with a
  user-visible note; CO4-CONSUMER-GATE-SIBLING-DRILL implemented; the 3/178
  empty-KB edge residuals and admin-tier scope either fixed or recorded as
  accepted limitations with evidence.

### QD6 - Burndown Acceptance (AlembicWorkspace)

- every debt row closed-with-evidence or explicitly owned with a trigger;
  the stale-dist family and schema-honesty gates demonstrated; coverage
  enforcement at the ruled state;
- controller acceptance from raw evidence; TODO board reconciled; archive;
  Wakeflow verification.

## Producer/Consumer Order

QD0 → QD1 / QD2 / QD4 / QD5 (parallel per repo) ∥ QD3 (after the C4 ruling)
→ QD6. Rows are largely independent; only the coverage wiring waits on its
ruling.

## Completion Definition

- Stale-dist family cannot recur silently (gate + pin demonstrated); tool
  schemas reject malformed input with negative tests; coverage enforcement
  at the ruled state with thresholds never lowered; CC4 connect race
  prevented with a regression test; smaller cleanups done or owned.
- Every TODO row reconciled; all repos green; archived.

## Validation Requirements

Each row's fix carries a demonstrated failure (the gate fails on the bad
input/state) and a regression test; Plugin-touching rows add dual-shell
parity gates; QD6 reconciles the TODO board and runs Wakeflow verification.

## Stop Conditions

- A tightening would change behavior beyond the confirmed honest-failure
  set.
- A coverage ratchet would require lowering a threshold to pass.
- A Plugin fix would break dual-shell parity.
- A CC4 evidence-gate DX item is pulled in (it belongs to CKG).
- Prose-only evidence.

## Decisions And Open Items

For QD0: C4 coverage strategy; confirm the honest-failure tightenings
(schema rejects, stale-dist gate) are intended; CC4 lock-fail-fast parity
budget. For intake: QD2/QD4 Plugin-side rows may ride a single Plugin
hardening packet; the empty-KB-edge residuals may be accepted limitations
rather than fixes.
