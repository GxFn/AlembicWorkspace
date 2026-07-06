# fix-main-modulemining-result-accounting-t1

Target window: Alembic
Task id: fix-main-modulemining-result-accounting-t1
Dispatch group: fix-main-modulemining-result-accounting-p1
State root: .wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26

## Scope

Repair the Alembic mainbody moduleMining result accounting blocker from direct
BiliDili verification after source-ref coverage repair. Test proved coldStart
and deepMining coverage now pass, then moduleMining job
rescan_mqwpvvg6_a00132ac failed with `moduleMining produced zero recipes` while
the same data root gained source-backed persisted output.

No Test rerun was performed. No Core, Agent, Plugin, Dashboard, or Test source
files were changed.

## Evidence Reviewed

- .wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/task-packages/fix-main-modulemining-result-accounting-p1.json
- .wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/evidence/verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-controller-review.md
- .wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1.json
- Test/tmp/verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1/evidence/source-ref-coverage-fix-realverify-summary.md
- Test/tmp/verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1/evidence/modulemining-after-source-ref-coverage-fix-job-run.json
- Test/tmp/verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1/evidence/job-modulemining-after-source-ref-coverage-fix.json
- Test/tmp/verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1/evidence/modulemining-db-delta-summary.json

SQLite read-only evidence from Test DB copy:

- `knowledge_entries where createdAt >= 1782586345`: 22
- distinct new recipe ids with source refs: 22
- source refs for those ids: 50

## Root Cause

`runModuleMiningWorkflow` called `@alembic/agent/service.runModuleMining` and
then used `extractNewRecipesThisRound(result)` as the only completion guard.
The live Agent path can persist accepted knowledge entries and recipe source
refs through tool calls while returning a result projection that contains no
recognized `newRecipes` or `recipes[]` shape. That made the daemon fail the job
as zero-output even when the current moduleMining run produced source-ref-backed
recipes.

## Repair

Commit: 47889f9 `fix: count persisted module mining recipes`

Changed files:

- Alembic/lib/daemon/DaemonJobRunner.ts
- Alembic/test/unit/DaemonJobRunnerPlanGate.test.ts

Implementation summary:

- Snapshot `knowledgeRepository` + `recipeSourceRefRepository` immediately
  before and after `runModuleMining`.
- Keep the Agent result projection count as the first accounting source.
- If the projection reports zero, count only new recipe ids that appeared after
  the call and have non-empty, non-stale source refs.
- Continue to fail `moduleMining produced zero recipes` when neither projection
  count nor source-ref-backed persisted delta is positive.
- Add moduleMining process/log metadata for reported vs persisted counts.

This does not count audit logs, token usage, lifecycle transition events, or
existing recipes. It preserves the plan hard gate, no fallback-to-full behavior,
quality/anti-fabrication boundaries, and source-ref-backed evidence requirement.

## Validation

Passed:

- `npm run test:unit -- test/unit/DaemonJobRunnerPlanGate.test.ts`
  - 1 file passed, 16 tests passed
- `npm run build:check`
  - local AlembicCore source build plus `tsc --noEmit` passed
- `./node_modules/.bin/biome check lib/daemon/DaemonJobRunner.ts test/unit/DaemonJobRunnerPlanGate.test.ts`
  - 2 files checked, no fixes applied
- `git diff --check`
  - passed
- `npm run test:unit`
  - 122 files passed, 970 tests passed, 1 skipped
- post-commit `git diff --check HEAD`
  - passed
- post-commit `npm run test:unit -- test/unit/DaemonJobRunnerPlanGate.test.ts`
  - 1 file passed, 16 tests passed

Alembic Guard:

- `alembic_code_guard` was attempted with explicit changed files.
- Result: tool internal failure, not a code finding:
  `unrecognized key "data"`.

## Residual Risk / Next Step

The final direct BiliDili chain is still not accepted by this target window.
After controller acceptance, Test should rerun the direct BiliDili verification
to prove moduleMining no longer fails at the zero-output gate and then continue
to evolution/maintenance and anti-fabrication probes according to the demand.

Local git state after commit:

- Alembic `main...origin/main [ahead 1]`
- No push performed, per task package boundary.
