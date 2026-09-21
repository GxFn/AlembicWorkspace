# P0 Main runtime-input authority research — controller acceptance

Date: 2026-08-04

## Verdict

Accept the Alembic research target `p0-main-runtime-input-authority-research-t1` as a
read-only code-fact investigation. This acceptance closes only the research package. It does not
authorize deletion of the external strict path, implementation dispatch, Test execution, or a
claim that the supplement is implementation-ready.

## Independently verified facts

Controller inspection of the current Alembic `d5bfeb1` HEAD confirmed:

- `POST /api/v1/jobs/bootstrap` still accepts optional caller-owned `dimensions` and the nested
  `strictProduction` request object in `lib/http/routes/jobs.ts`.
- `RecipePipelineFacade.executeRecipePipelineJob()` selects the strict path only when that object
  is present. That branch skips `runGeneratePlanGate`; the no-object branch runs the plan gate and
  the ordinary workflow.
- `ColdStartWorkflow` returns to `runStrictColdStartProduction()` before the ordinary
  `CleanupService.fullReset()` path. The ordinary path cleans and selects dimensions but does not
  enter the strict private-corpus/publication tail.
- `createMainStrictFactQueryFamiliesV1()` exists, but no non-test Main runtime caller was found.
- The live provider/model can be observed through existing runtime bindings, while the loaded-model
  artifact hash, actual prompt-digest binding, ten strict resource-cap values, reviewer calibration
  authority, complete runtime-artifact/PCF lineage, and ordinary operation-root authority do not
  have verified ordinary Job producers.
- `CleanupService.fullReset()` is the existing trash/reset owner. Database DELETE errors now cause
  a fail-closed throw, but file rename plus copy failure is still warning-only and DB snapshot reads
  still swallow every exception as if the table were absent. These two failures can therefore
  precede destructive DB clearing without proven recovery evidence.
- The existing global test-mode implementation still reads configured dimension allowlists and
  returns the full input when no allowlist is configured. It does not yet implement the confirmed
  contract “enabled = exactly one deterministic applicable dimension”.

## Independent validation

Executed from the Alembic repository:

```text
npx vitest run test/unit/CleanupService.test.ts test/unit/StrictResetAndPublicCas.test.ts test/unit/StrictProductionJournal.test.ts

Test Files  3 passed (3)
Tests       25 passed (25)
```

The controller also ran focused symbol/call-chain searches for the bootstrap fork, strict
orchestrator, cleanup order, fact-family producer, model/prompt/cap/reviewer inputs, runtime
artifact manifest, and operation-root consumers. `git diff --check` passed and
`git status --porcelain` remained empty in Alembic.

## Authority consequence

The research report's minimum replacement seam is supported: keep one Main Job lifecycle, perform
read-only preflight and applicable-dimension selection before mutation, use one fail-closed
`CleanupService.fullReset()`, then reuse the existing strict semantic/private/publication tail.
However, this is not yet a complete landing plan because the missing production inputs cannot be
filled with fixture values or controller prose.

Before the first implementation package freezes `demand-authority.json`, the controller must
resolve and record:

1. which accepted runtime/config artifacts produce every required strict input;
2. whether AlembicAgent or AlembicCore must change to expose prompt/model/policy provenance, which
   would change repository coverage and phase order from the current supplement;
3. the exact new BiliDili destructive Test environment specification, replacing the obsolete
   external-authority/quiesce snapshot plan.

## Evidence reviewed

- `wakeflow-ledger/Alembic/coldstart-global-test-mainline-supplement-2026-08-04/p0-main-runtime-input-authority-research-t1/runtime-input-authority-report.md`
- `.wakeflow-active/current/coldstart-global-test-mainline-supplement-2026-08-04/target-results/tr-p0-main-runtime-input-authority-research-t1.json`
- `wakeflow-ledger/AlembicWorkspace/coldstart-global-test-mainline-supplement-2026-08-04/requirement-delta.md`
- current Alembic source and the focused validation output recorded above
