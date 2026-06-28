# P10 Controller Review - Alembic deepMining scope alias repair

Date: 2026-06-28
Controller: AlembicWorkspace

Dispatch group:
- `p10-alembic-deep-mining-scope-alias-repair-p1`

Target task:
- Alembic / `p10-alembic-deep-mining-scope-alias-repair-t1`

## Decision

Alembic target evidence is acceptable for the scoped source repair. This is not
acceptance of the P10 BiliDili REAL-TEST gate because the paired
AlembicPlugin repair is still missing from the current review group.

## Raw Evidence Reviewed

- Target result:
  `target-results/tr-p10-alembic-deep-mining-scope-alias-repair-t1.json`
- Task package:
  `task-packages/p10-alembic-deep-mining-scope-alias-repair-p1.json`
- Prior controller review requiring this repair:
  `evidence/p10-rerun-after-repairs-controller-review.md`
- Failing Test raw status:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/inprocess-failed-rescan-status.json`
- Alembic commit:
  `2475fe7f72b10da02f306358febcfa00b90ea7b7`
- Source files:
  `Alembic/lib/daemon/PlanSelectionGate.ts`
  `Alembic/test/unit/DaemonJobRunnerPlanGate.test.ts`

## Controller Findings

Commit `2475fe7` changes only `lib/daemon/PlanSelectionGate.ts` and
`test/unit/DaemonJobRunnerPlanGate.test.ts`.

The implementation keeps the scope inside the deepMining plan gate. Non
deepMining stages still bypass request-constraint rewriting. For deepMining,
`moduleScope` matching now compares normalized aliases from `modulePath`,
`moduleId`, optional `moduleName`, and the selected project root basename. This
covers the failing real shape where Test supplied `moduleScope=["BiliDili"]`
and the selected root binding represented the root module as `.` /
`target:BiliDili:.`.

The repair preserves true-miss failure behavior: when a non-empty `moduleScope`
removes every module binding, the gate throws before calling
`runProjectIndexWorkflow` or opening/upserting a round, now with
`availableModuleAliases` diagnostics. Existing explicit constraint forwarding
continues to send `moduleDimensionTargets` and `perDimensionTargets`.

No P11 moduleMining selector behavior, frozen public names, cleanup roots,
provider config, BiliDili workspace files, AlembicPlugin, AlembicCore, release
assets, or versions were changed.

## Controller Validation

All commands below were run from `Alembic/` after reviewing the target result and
commit:

- `npm test -- --run test/unit/DaemonJobRunnerPlanGate.test.ts`
  - Passed: 1 file, 20 tests.
- `npm test -- --run test/unit/DaemonJobRunnerPlanGate.test.ts test/unit/DaemonJobRunner.test.ts test/unit/ProjectIndexWorkflow.test.ts`
  - Passed: 3 files, 39 tests.
- `npx biome check lib/daemon/PlanSelectionGate.ts test/unit/DaemonJobRunnerPlanGate.test.ts`
  - Passed: 2 files checked, no fixes applied.
- `npm run build:check`
  - Passed, using local AlembicCore source.
- `npm run lint:repo-boundary`
  - Passed, escape-hatch count unchanged at 1 / 75 threshold.
- `git diff --check HEAD~1 HEAD`
  - Passed with no whitespace errors.
- `git status --porcelain`
  - Clean output.

## Remaining Gate

Do not rerun or accept P10 REAL-TEST from this Alembic result alone. The review
pack still reports AlembicPlugin /
`p10-plugin-host-rescan-seed-session-repair-t1` as missing, so the correct next
action is to wait for the paired Plugin repair and then rerun the real BiliDili
P10 parity test only after both source-side repairs are accepted.

## Forbidden Conclusions

- Do not accept P10 REAL-TEST, G4, G6, P11, P12, P13, or the whole demand.
- Do not treat the controller-return callback as controller acceptance.
- Do not dispatch Test rerun until AlembicPlugin repair evidence is available
  and accepted.
