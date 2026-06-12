# Structural Debt Decision Gate

Demand Key: `alembic-redundancy-stale-logic-cleanup-rc6-structural-debt-decision-gate-2026-06-11`
Primary Window: AlembicWorkspace (Design window produces candidates)

## Goal

Convert the audit's structural findings into reviewable design candidates
with options, costs, and recommendations — so the controller can confirm or
reject each as a future demand sequence. **No implementation in this demand.**

## Candidates to Draft

1. **SD-1 Shared layer sinking** — `lib/governance/`, `lib/injection/`,
   `lib/shared/schemas/`, `lib/types/` are ~90-100% identical between Alembic
   and AlembicPlugin (~27.7k duplicated lines overall). Options: sink to
   `@alembic/core` (respecting Core's boundary policy), a new shared package,
   or status-quo + drift monitor. Must address the portable-runtime
   self-containment constraint (AGENTS.md: Plugin deploys standalone).
2. **SD-2 Dashboard artifact pipeline** — `Alembic/dashboard/dist` is a
   manually synced AlembicDashboard build; `Alembic/vendor/AlembicDashboard`
   is a ~307MB full working copy. Options: build-on-release script consuming
   the AlembicDashboard repo, published artifact package, or documented
   manual flow; plus the disposition of the vendor copy.
3. **SD-3 Agent V1→V2 tool convergence** — retirement plan for
   `src/tools/core/` and `V2ToolRouterAdapter`: consumer migration order,
   public-api boundary changes, target milestone (consumes the RC3 register).
4. **SD-4 MemoryStore ownership** — keep raw-SQL adapter in Agent vs move
   into `@alembic/core/memory` Drizzle wrapper; decide based on the RC0
   consumer scan and Core's deterministic-kernel scope (consumes the RC3
   boundary note).
5. **SD-5 Core Wave 3B export closeout** — plan to converge the 98
   transitional exports in `config/public-api-boundary.json` using
   `scripts/report-public-api-closeout.mjs` consumption data; sequencing with
   downstream release staging.
6. **SD-6 Daemon observability reuse** — Plugin's stripped
   `DaemonJobRunner` (299 vs 1203 lines) means future plugin observability
   has no shared substrate; decide whether job observability becomes a Core/
   Agent-hosted capability or stays main-repo-only by policy.

## Task Breakdown

1. For each candidate: one design note (problem, evidence refs back to
   [audit-findings-2026-06-11.md](audit-findings-2026-06-11.md) and RC0
   matrix, 2-3 options with cost/risk, recommendation, affected repos,
   validation outline).
2. Controller reviews and records accept / reject / defer per candidate in
   goal-stage confirmation; accepted ones become new demand sequences with
   their own keys — never RC-numbered extensions of this one.

## Completion Definition

Six design notes exist and each carries an explicit controller decision
record (accept / reject / defer with reason). Nothing was implemented.

## Validation Floor

- Each note cites current file paths and line-scale numbers (re-checked, not
  copied blindly from the audit).
- Decision record present for all six.

## Stop Conditions

- Any attempt to start implementing a candidate inside this sequence.
