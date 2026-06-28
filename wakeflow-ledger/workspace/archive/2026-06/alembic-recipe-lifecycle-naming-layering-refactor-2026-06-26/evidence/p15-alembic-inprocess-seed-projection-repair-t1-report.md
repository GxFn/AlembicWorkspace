# p15-alembic-inprocess-seed-projection-repair-t1 Report

- Window: Alembic
- Task: p15-alembic-inprocess-seed-projection-repair-t1
- Dispatch group: p15-alembic-inprocess-seed-projection-repair-p1
- Commit: `4dd8083ff9b171408b120903caf7821a14452ebf`
- Repository: `Alembic`

## Scope

This repair stays inside the Alembic daemon/in-process deepMining rescan `coverageLedgerSeed` projection path.

Changed files:

- `lib/daemon/DeepMiningRoundGate.ts`
- `test/unit/DaemonJobRunnerPlanGate.test.ts`

No BiliDili data was manually edited. No BiliDili REAL-TEST was run by this window. No public HTTP/API route names, `response.tool` values, PlanStageId/job/source/lifecycle strings, coverage table names, package versions, release assets, provider config, Core implementation, Plugin implementation, thread ids, or freeze values were changed.

## Starting Evidence

Controller/Test evidence showed the in-process job completed and persisted SQLite parity was clean, but route/event/result seed projection was stale:

- Persisted SQLite seed: `aggregateOrRootModuleIds=[]`, `coveredPathCount=138`, `measuredCells=1`, `moduleCount=16`, `targetScopedCells=16`, `usableCells=16`, `writtenCells=16`.
- Route/event/result seed: `aggregateOrRootModuleIds=["target:Account:."]`, `coveredPathCount=0`, `measuredCells=0`, `moduleCount=15`, `targetScopedCells=15`, `usableCells=15`, `writtenCells=16`.
- R-2 root routing checks in Test evidence were already true and needed to remain untouched.

## Repair

`DeepMiningRoundGate` now classifies target package-root cells with project-root context:

- `target:<project-root-name>:.` remains an aggregate/root cell, preserving the pollution guard for project-root rows such as `target:BiliDili:.`.
- `target:<other-target-name>:.` is retained as target-scoped coverage, so package targets such as `target:Account:.` contribute their source refs and measured cell to the route-visible seed.

This makes the daemon/in-process result, deepMining result, and job-process event metadata seed use the same persisted target-scoped coverage state that parity reads, instead of dropping the package-root target as aggregate/root-like stale data.

## Before/After Proof

Before repair, the P15 Test artifact `final-inprocess-rescan-evidence.json` reported:

- `aggregateOrRootModuleIds=["target:Account:."]`
- `coveredPathCount=0`
- `measuredCells=0`
- `moduleCount=15`
- `targetScopedCells=15`

The new unit regression constructs a BiliDili data root with a persisted `target:Account:.` coverage cell containing two source refs. It now expects the route seed projection to report:

- `aggregateOrRootModuleIds=[]`
- `coveredPathCount=2`
- `measuredCells=1`
- `moduleCount=1`
- `targetScopedCells=1`

The existing root-guard test still proves `target:BiliDili:.` is skipped as aggregate/root-only.

## Validation

Passed:

- `npx biome check lib/daemon/DeepMiningRoundGate.ts test/unit/DaemonJobRunnerPlanGate.test.ts`
- `npx vitest run test/unit/DaemonJobRunnerPlanGate.test.ts` — 25 tests passed
- `npm run build:check`
- `npm run lint:repo-boundary`
- `git diff --check`
- `git diff --cached --check`
- `git status --short --branch` — clean after commit, `main...origin/main [ahead 4]`

Alembic project tooling:

- `alembic_status` returned `status=ready`, with daemon removed by design.
- Alembic Guard was skipped per `alembic-guard` skill because this project status reports `knowledge.hasKnowledge=false` / `initialized_empty`; raw source reads and repository validation remained the authority.

## Result

Alembic commit `4dd8083ff9b171408b120903caf7821a14452ebf` completes this target repair. The in-process daemon seed projection now keeps real package-root target coverage such as `target:Account:.` and still rejects the actual project-root aggregate row such as `target:BiliDili:.`.

Residual risk: this window did not run the BiliDili final parity REAL-TEST. Test may rerun after controller accepts this Alembic repair and the companion AlembicPlugin host terminal seed repair.
