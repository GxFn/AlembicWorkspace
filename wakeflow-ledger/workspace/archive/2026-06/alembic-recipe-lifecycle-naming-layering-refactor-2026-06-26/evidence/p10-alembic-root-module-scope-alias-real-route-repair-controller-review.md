# Controller review: P10 Alembic root module-scope alias repair

Date: 2026-06-28
Window: AlembicWorkspace
Target: Alembic / `p10-alembic-root-module-scope-alias-real-route-repair-t1`

## Verdict

Accept target result as a source repair input after evidence-ref repair. This
does not accept P10 REAL-TEST; the real BiliDili route still needs a Test rerun
after both source repairs are combined.

## Evidence Reviewed

- Target result `target-results/p10-alembic-root-module-scope-alias-real-route-repair-t1-bf328ea.json`
- Commit `bf328ea81a809bb8f761c0a0d81162703b1cb70d`
- `Alembic/lib/daemon/PlanSelectionGate.ts`
- `Alembic/test/unit/DaemonJobRunnerPlanGate.test.ts`
- Prior Test report and controller review for the P10 rerun blocker.

## Implementation Reality

The repair treats `moduleScope` values matching the project root aliases,
including the root basename `BiliDili` and `.`, as whole-project root scope.
For that root-scope case it preserves the Plan Agent's nested module bindings
instead of filtering them all out. True nonmatching module scopes still fail
before opening a deepMining round, and diagnostics now include project-root
aliases in `availableModuleAliases`.

The new focused regression reproduces the Test shape: project root basename
`BiliDili`, Plan Agent returns nested modules such as
`Sources/Infrastructure/Account`, request uses `moduleScope=["BiliDili"]`, and
the plan gate keeps executable nested module targets instead of throwing the
all-targets-removed error.

## Controller Validation

- `npm test -- --run test/unit/DaemonJobRunnerPlanGate.test.ts -t "keeps real nested deepMining module targets"` passed: 1 test, 20 skipped.
- `npx biome check lib/daemon/PlanSelectionGate.ts test/unit/DaemonJobRunnerPlanGate.test.ts` passed.
- `npm run build:check` passed.
- `npm run lint:repo-boundary` passed.
- `git diff --check bf328ea81a809bb8f761c0a0d81162703b1cb70d^ bf328ea81a809bb8f761c0a0d81162703b1cb70d` passed.
- `git show --check --oneline bf328ea81a809bb8f761c0a0d81162703b1cb70d` passed.

## Evidence Repair

The original target result used `Alembic:lib/daemon/PlanSelectionGate.ts` and
`Alembic:test/unit/DaemonJobRunnerPlanGate.test.ts`; Wakeflow path summaries
treat those as missing refs. Controller verified the real workspace paths above
and records an evidence-repair target result with the canonical paths.

## Residual Risk

Alembic code guard failed in the target window with an internal/schema error, so
there is no usable Guard pass/fail signal. Full real BiliDili host/in-process
parity was intentionally left to Test after both source repairs.

## Decision

Accept the Alembic source repair result for the P10 rework group, after
recording corrected evidence refs.
