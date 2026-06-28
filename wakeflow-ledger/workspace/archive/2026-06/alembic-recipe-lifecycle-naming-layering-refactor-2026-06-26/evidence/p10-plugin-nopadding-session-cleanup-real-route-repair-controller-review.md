# Controller review: P10 AlembicPlugin noPadding session cleanup repair

Date: 2026-06-28
Window: AlembicWorkspace
Target: AlembicPlugin / `p10-plugin-nopadding-session-cleanup-real-route-repair-t1`

## Verdict

Accept target result as a source repair input. This does not accept P10
REAL-TEST; the real BiliDili host route still needs a Test rerun after both
AlembicPlugin and Alembic source repairs are combined.

## Evidence Reviewed

- Target result `target-results/result-p10-plugin-nopadding-session-cleanup-real-route-repair-t1.json`
- Commit `9eaf89ad99ce87779c050487d22f98e281f5e1ff`
- `AlembicPlugin/lib/recipe-generation/host-agent-workflows/dimension-completion.ts`
- `AlembicPlugin/test/unit/HostAgentDimensionCompletionWorkflow.test.ts`
- Prior Test report and controller review for the P10 rerun blocker.

## Implementation Reality

The repair keeps the terminal `alembic_dimension_complete(noPadding:true)`
candidate-count failure response, but passes the resolved data root into
terminal cleanup. The cleanup now first preserves the existing container-manager
clear path, then creates a dataRoot-scoped session manager that ignores stale
parent `bootstrapSessionManager` registrations and verifies the matching
session/project lease before mutating file-backed state.

The new regression test creates a file-backed data-root session and a stale
container manager, triggers the noPadding candidate-count failure with submitted
recipe ids, then proves:

- the response remains `DIMENSION_CANDIDATE_COUNT_INSUFFICIENT`;
- checkpoint and emitter side effects are not called;
- the stale manager is invoked for compatibility;
- the file-backed session id and project lease are both released.

This matches the Test blocker where no open `deep_mining_rounds` existed and the
remaining host blocker was the active session lease.

## Controller Validation

- `npm run test:unit -- test/unit/HostAgentDimensionCompletionWorkflow.test.ts` passed: 12 tests.
- `npx biome check lib/recipe-generation/host-agent-workflows/dimension-completion.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts` passed.
- `git diff --check 9eaf89ad99ce87779c050487d22f98e281f5e1ff^ 9eaf89ad99ce87779c050487d22f98e281f5e1ff` passed.
- `npm run build:check` passed; Core build used `../AlembicCore @ 99a7cf10d82056cd860eb0a1d9544662e3735b08`.
- `npm run lint:repo-boundary` passed.
- `npm run lint:core-import-boundary` passed.
- `npm run lint:layer-boundary` passed.

## Residual Risk

Alembic code guard failed in the target window with an internal/schema error, so
there is no usable Guard pass/fail signal. The controller reviewed raw source
and reran repository validations instead.

## Decision

Accept the AlembicPlugin source repair result for the P10 rework group. The next
valid step, after accepting the combined source repairs, is a Test rerun of the
real BiliDili P10 route to verify the active session count drops to zero and the
host `coverageLedgerSeed` gate becomes reachable.
