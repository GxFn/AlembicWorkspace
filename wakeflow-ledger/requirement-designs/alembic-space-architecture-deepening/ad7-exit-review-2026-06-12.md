# AD7 — Space Architecture Acceptance Exit Review (2026-06-12)

Controller exit review for the P2 architecture-deepening demand
(alembic-portfolio-execution-plan-p2-architecture-deepening-2026-06-12,
19 task packages ta1-ta19, all controller-accepted, final state rev 62).

## Stage closure summary

| Stage | Closure | Key landings |
| --- | --- | --- |
| AD1 | CLOSED (ta1-ta5) | canonical space-allowed-edges config (Core e1b496b) + four consumer gates, all blocking-demoed; packageName metadata fix (3111780) |
| AD2 | CLOSED (ta6) | five charters confirmed vs real code; placement decision register delivered (A1-A4/B1-B4/C1-C8) |
| AD3 | CLOSED (ta7-ta9) | layer contracts + direction lints in Alembic (18 areas, 3 cycles → exceptions w/ triggers), Agent (6 areas, 1 cycle → B5), Dashboard (clean DAG) |
| AD4 | CLOSED (ta10-ta12) | side-effect doctrine implemented: Alembic matrix at ZERO blessed exceptions, lifecycles managed, auth lazy; Core 12-entry blessed list; Agent doctrine config; coverage ROSE to 82.55/79.27/82.05/82.43 |
| AD5 | CLOSED (ta13-ta14) | measured upgrades: LRU +17.1%, embedder hint 2.0x, ring cap + new diagnostic code, realtime contract both halves, AST conditionally closed per design |
| AD6 | CLOSED (ta15-ta19) | isolation proofs all five repos; inflow/outflow audits with NO undeclared effects anywhere; charter completeness ZERO orphans; doctrine lints live in all five repos; modules.ts stream defect fixed |

## Exit-bullet status vs design §AD7

- Per-repo isolation proof: DONE (five repos, evidence per repo).
- No-undeclared-effects: DONE (snapshot tests pinned per entrypoint family).
- Charter completeness: DONE as findings — zero orphan capabilities; five
  wording/coverage rows await one charter-touch ruling (B7 + W1-core +
  W1-dashboard + W1-plugin; register section "W-wording").
- Doctrine compliance census target: DEFERRED BY DESIGN GAP — the AD0 floor
  number was never set (B6). Current state: Core 0 locator sites, Agent 0,
  Alembic 139 (131 http) with the constructed-injection pattern proven twice;
  doctrine lints now block new module-state regressions in all repos.

## Debts routed at exit (all have owners and homes)

- B6 locator floor ruling (USER) → then the http-class wave if (a)/(b).
- W2 Dashboard stray-transport consolidation (USER option row).
- Charter-touch wording batch (one Core config edit after ruling).
- Three Alembic legacy module-state bindings + 17 Plugin session-state
  exemptions: blessed with cleanup triggers (B6 wave / future AD wave).
- Test-infra register: 10s-timeout load flakes (two recurrences) + stale-dist
  #alias shadowing + dynamic-import-in-body pattern.
- AST 10k-fixture full-pipeline measurement: Test-window backlog candidate.
- ClaudeProvider capability-honesty (supportsEmbedding true / embed []) —
  future ruling row.

## Verdict

P2 completion definition met: AD1-AD7 closed per the design with
controller-accepted evidence per stage; every gate green in its owning repo at
TRUE baselines; no consumer repo red; the facade-preference note (B3) and all
placement moves are explicitly registered user decisions. P2 exit debts are
named and routed above. The demand completes with this review.
