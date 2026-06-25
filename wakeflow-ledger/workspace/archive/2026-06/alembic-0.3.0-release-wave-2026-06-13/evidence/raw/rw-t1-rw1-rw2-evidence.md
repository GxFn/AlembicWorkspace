# RW1+RW2 evidence — alembic-0.3.0-release-wave rw-t1 (2026-06-13)

## Commits (origin/main 2823939..fd940f2)
- RW1 re-point: 7777dcb
- RW2 deletion: fd940f2

## RW0 fresh re-scan verdicts (rw0-rescan-2026-06-13.json)
{"repoReferenceTotals":{"Alembic":544,"AlembicAgent":54,"AlembicPlugin":550,"AlembicDashboard":0},"candidate67StillZeroConsumer":true,"candidateLiveOrMissing":[],"unresolved":0,"keepAliveLive":[{"key":"./infrastructure/database/drizzle","served":5,"present":true}]}

## RW1 root-facade resolves the re-pointed symbols (post-build)
{"applyOutputBudget":"function","CORE_TOOL_OUTPUT_BUDGETS":"object","PersistenceError":"function","DivergenceError":"function"}

## RW2 boundary gate (new truth)
Public API boundary OK (prescriptive): 59 package exports classified.
Exact exports: 52; wildcard exports: 7.
Status summary: stable=18, provisional=10, transitional=31.
Closeout no-growth: transitional<=31 (31); wildcard<=7 (7).

## Closeout report categories (candidates 0)
Categories: promote-to-stable=0, keep-provisional=18, consumer-replace-first=0, no-consumer-deprecate-candidate=0, must-keep-transitional=13.

## expectedCounts + maxCounts after deletion
{"expectedCounts":{"stable-public":18,"provisional-public":10,"transitional-internal":31,"internal-only":0,"forbidden":0},"maxCounts":{"transitional-internal":31,"wildcardExports":7},"tieLen":24,"removedExports":81}

## Downstream builds (against new Core HEAD)
AlembicAgent tsc --noEmit: exit 0 | Alembic build:check: exit 0 | AlembicPlugin build:check: exit 0 (worktree clean, hands-off)

## Mechanical-diff audit (RW2 = export-map deletion + policy sync + contract-data drift only)
    Alembic/Agent/Plugin builds all green at true baselines (1193 tests).

 config/public-api-boundary.json | 775 ++++++++++++++++++++++------------------
 package.json                    | 268 --------------
 src/shared/CoreContractSpine.ts |  12 +-
 3 files changed, 422 insertions(+), 633 deletions(-)
version unchanged: 0.2.0 (no bump; publish held)
