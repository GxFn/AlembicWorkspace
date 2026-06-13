# Alembic Quality And Test-Infra Debt Burndown

Status: candidate / user-requested 2026-06-13 / member 3 of the post-portfolio follow-through group / accumulated TODO rows / needs controller intake
Maintained Window: AlembicWorkspace
Date: 2026-06-13
Design Key: alembic-quality-debt-burndown

## Controller Judgment

The portfolio's waves routed real but out-of-scope findings to TODO rows
rather than expanding any single wave; they accumulated into a coherent
quality/test-infra debt set. The standout is the stale-`dist/` family — a
test-infra failure mode that aliased real behavior and surfaced four
separate times — which needs a clean-build-before-pack gate so it cannot
recur silently. Alongside: a tool-schema honesty gap (inputs accept
malformed values like `limit: "ten"`), the unresolved coverage-enforcement
decision (thresholds were never runnable; real coverage is measured and
improving), the demonstrated CC4 first-session install-lock race, and
several small cleanups. None blocks anything; together they are the
engineering-hygiene remainder. Member of the
[post-portfolio follow-through group](../alembic-post-portfolio-followthrough/index.md).

## Entry Points

- Requirement design:
  [alembic-quality-debt-burndown-requirement-design-2026-06-13.md](alembic-quality-debt-burndown-requirement-design-2026-06-13.md)
- Candidate demand sequence:
  [alembic-quality-debt-burndown-demand-sequence-2026-06-13.json](alembic-quality-debt-burndown-demand-sequence-2026-06-13.json)
- Source: [R package §4 open TODO rows](../alembic-portfolio-execution-plan/r-delivery-0.3.0-decision-package-2026-06-12.md)

## Candidate Demand Order

| Order | Demand | Primary Window | Purpose |
| --- | --- | --- | --- |
| 0 | `...-qd0-triage-coverage-ruling-2026-06-13` | AlembicWorkspace | Re-freeze rows; rule C4 coverage strategy + CC4 lock-fail-fast parity wave; route. |
| 1 | `...-qd1-stale-dist-family-closure-2026-06-13` | AlembicWorkspace (+ repos) | Clean-build-before-pack gate + `.tmp` freshness pin; close the four instances. |
| 2 | `...-qd2-tool-schema-honesty-2026-06-13` | AlembicPlugin (+ Alembic) | `additionalProperties:false` + type-correct validation; reject malformed input. |
| 3 | `...-qd3-coverage-enforcement-wiring-2026-06-13` | AlembicWorkspace (+ Core) | Wire the C4 ruling; thresholds never lowered. |
| 4 | `...-qd4-cc4-connect-hardening-2026-06-13` | AlembicPlugin | Sub-timeout lock fail-fast + retry-after diagnostic + cache-clear docs. |
| 5 | `...-qd5-smaller-cleanups-2026-06-13` | AlembicWorkspace (+ Core, Alembic) | Scratch entry, ghost DB, consumer-gate drill, empty-KB-edge/admin-tier residuals. |
| 6 | `...-qd6-burndown-acceptance-2026-06-13` | AlembicWorkspace | Confirm every row closed/owned; reconcile TODO board; accept, archive. |

## Cross-Demand Boundaries

- Honest-failure tightenings (schema rejects, stale-dist gate) are intended
  hardenings, confirmed at QD0; no behavior change beyond that set.
- No coverage threshold lowering; C4 held until ruled.
- Plugin-touching rows keep dual-shell parity byte-stable.
- CC4 evidence-gate DX items belong to the CKG resumption package, not here.

## Validation Backbone

Each row's fix carries a demonstrated failure (gate fails on the bad
input/state) and a regression test; Plugin-touching rows add dual-shell
parity gates; QD6 reconciles the TODO board and runs Wakeflow verification.

## Stop Conditions

- A tightening would change behavior beyond the confirmed honest-failure set.
- A coverage ratchet would require lowering a threshold to pass.
- A Plugin fix would break dual-shell parity.
- A CC4 evidence-gate DX item is pulled in (belongs to CKG).
- Prose-only evidence.
