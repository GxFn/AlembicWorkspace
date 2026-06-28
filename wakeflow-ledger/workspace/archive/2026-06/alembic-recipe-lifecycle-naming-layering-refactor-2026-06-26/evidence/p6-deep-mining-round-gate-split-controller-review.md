# P6 DeepMining Round Gate Split Controller Review

Reviewed at: 2026-06-28T06:45:00+08:00
Controller window: AlembicWorkspace
Dispatch group: p6-deep-mining-round-gate-split-p1
Target result: tr-p6-deep-mining-round-gate-split-t1-controller-evidence-repair

## Verdict

Accept the Alembic code result for P6 and advance to the required Test REAL-TEST.

The target result is reviewable: the controller-return delivery is sent with readback OK, the result points to an existing evidence report, and no evidence refs are missing. Raw source review found the P6 split keeps `executeApiAiWorkflow` connected to `runBootstrapPlanGate`, `runDeepMiningRounds`, and `runModuleMiningWorkflow`; the deepMining loop remains caller-owned in Alembic; `runAsyncFillInline: true`, coverage-ledger cell seeding, round open/close accounting, advisor break checks, job kind/source, and plan-gate source labels are preserved.

## Source Evidence Reviewed

- Alembic HEAD: `80fa6a5b518847138fbe79acc4e26e551ba356a6` (`refactor: split daemon mining gates`)
- Changed files: `lib/daemon/DaemonJobRunner.ts`, `lib/daemon/DaemonJobServices.ts`, `lib/daemon/DaemonJobWorkflowHelpers.ts`, `lib/daemon/DaemonJobWorkflowTypes.ts`, `lib/daemon/DeepMiningRoundGate.ts`, `lib/daemon/ModuleMiningWorkflow.ts`, `lib/daemon/PlanSelectionGate.ts`, `test/unit/DaemonJobRunnerPlanGate.test.ts`
- Diff stat: 8 files changed, 1182 insertions, 1081 deletions
- Git status: `main...origin/main [ahead 4]`
- `PlanSelection.scale` is typed in Core, so the P6 runtime cast is not a discovered acceptance blocker.

## Controller Validation

- `npm run build:check`: pass
- `npx vitest run test/unit/DaemonJobRunnerPlanGate.test.ts test/unit/DaemonJobRunner.test.ts`: pass, 2 files / 32 tests
- `npm run lint:repo-boundary`: pass, escape hatch count 1 / 75 threshold
- `npm run build`: pass
- `npm run lint`: exit 0; 5 existing `noExplicitAny` warnings outside P6 changed files
- `npm run typecheck`: pass
- `git diff --check`: pass
- `git diff --check HEAD~1 HEAD`: pass

## Guard Note

Controller re-ran `alembic_code_guard` with the explicit P6 file scope. The tool reproduced the target-reported internal schema error: unrecognized top-level key `data`. This is a Guard tooling failure, not a P6 code finding, and does not replace the repository validation above.

## Remaining Required Gate

P6 still requires the state-root REAL-TEST on the real BiliDili workspace: in-process deepMining must show a non-empty `coverage_ledger` cell, `deep_mining_rounds` advancement/open-close evidence, and advisor `stopReason` termination. This review accepts only the Alembic code package and authorizes dispatching Test for the P6 real run.
