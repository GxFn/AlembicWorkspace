# Controller Review: fix-main-modulemining-result-accounting-t1

State root: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26`

Dispatch group: `fix-main-modulemining-result-accounting-p1`

Target task: `fix-main-modulemining-result-accounting-t1`

Target window: `Alembic`

## Controller Acceptance

- User goal: finish the mainbody lifecycle real verification follow-up by fixing
  the real BiliDili blocker chain, without weakening gates.
- Scope reviewed: Alembic mainbody moduleMining false-zero result accounting
  after direct BiliDili evidence showed persisted moduleMining output while the
  job failed with `moduleMining produced zero recipes`.
- Original requirement authority: this is a Phase VERIFY product-code blocker
  under the active realverify follow-up. It does not re-open earlier A-F work
  and does not change the demand completion definition.
- Target/window: `Alembic`, local main commit `47889f9`.
- Evidence reviewed:
  - target result
    `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-fix-main-modulemining-result-accounting-t1.json`
  - target evidence
    `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/evidence/fix-main-modulemining-result-accounting-t1.md`
  - commit diff `47889f9`
  - changed source `Alembic/lib/daemon/DaemonJobRunner.ts`
  - changed tests `Alembic/test/unit/DaemonJobRunnerPlanGate.test.ts`
  - prior Test evidence
    `Test/tmp/verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1/evidence/modulemining-db-delta-summary.json`
    and
    `Test/tmp/verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1/evidence/source-ref-coverage-fix-realverify-summary.md`
- Implementation reality: `runModuleMiningWorkflow` still runs the plan gate
  and module selection first. It keeps the Agent result projection count as the
  primary accounting source, then if that projection is zero it snapshots
  `knowledgeRepository` and `recipeSourceRefRepository` around the synchronous
  `runModuleMining` call and counts only new recipe ids that have non-empty,
  non-stale source refs. Audit logs, token usage, lifecycle transition events,
  and existing recipes are not counted as success.
- Validation result:
  - target reported `npm run test:unit`, `npm run build:check`, biome check,
    `git diff --check`, and post-commit targeted test pass.
  - controller independently ran
    `npm run test:unit -- test/unit/DaemonJobRunnerPlanGate.test.ts`: PASS
    (16 tests).
  - controller independently ran `npm run build:check`: PASS.
  - controller independently checked `git diff --check HEAD`: PASS.
- Blockers: none for accepting this Alembic repair.
- Missing evidence: final direct BiliDili e2e has not been rerun after this
  commit. That is the next Test package, not a blocker for accepting the source
  repair.
- Residual risks: the persisted-output fallback attributes output by the
  synchronous `runModuleMining` call window plus new recipe id/source-ref delta,
  not by a separate durable job id column. This is acceptable for the observed
  current runtime path and must be proven by the next direct BiliDili Test run.
- TODO/backlog rollup: no new out-of-scope TODO is created. Continue existing
  Phase VERIFY by rerunning direct BiliDili moduleMining, evolution/maintenance,
  and anti-fabrication probes.
- Decision: `accept-target-result`.
- Next action: create and dispatch a Test package for direct BiliDili
  verification after `47889f9`.

## Raw Review Notes

Accepted code facts:

- `DaemonJobRunner.ts:1227-1244` snapshots persisted output before/after
  `runModuleMining`, computes `reportedNewRecipes`, computes persisted source
  ref-backed delta, and fails only when both are zero.
- `DaemonJobRunner.ts:1246-1280` emits diagnostic process metadata and returns
  `moduleMining.newRecipes`, `persistedNewRecipes`,
  `persistedSourceRefCount`, and `reportedNewRecipes`.
- `DaemonJobRunner.ts:2022-2118` reads repository snapshots through optional
  repository services, falls back safely if unavailable, and filters source refs
  with missing paths or `status === 'stale'`.
- `DaemonJobRunnerPlanGate.test.ts:1049-1120` reproduces the original false-zero
  shape: Agent projection reports zero while accepted source-ref-backed recipes
  are synchronously persisted; the job now completes with `newRecipes=2`.
- `DaemonJobRunnerPlanGate.test.ts:1122-1174` proves true zero-output
  moduleMining still fails with `moduleMining produced zero recipes`.

Non-blocking note:

- `alembic_code_guard` failed internally for the target with
  `unrecognized key "data"`. The controller did not treat that as a code
  finding, and covered acceptance with raw diff review plus independent build
  and unit verification.
