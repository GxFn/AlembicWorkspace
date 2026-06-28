# P15 Session-Bound Recipe Evidence Realtest Controller Review

Date: 2026-06-29
Controller: AlembicWorkspace
Dispatch group: p15-bilidili-session-bound-recipe-evidence-realtest-p1
Target task: p15-bilidili-session-bound-recipe-evidence-realtest-t1
Target window: Test

## Verdict

Accept the Test result as valid evidence for the P15 session-bound Recipe route, but do not accept P15 final parity or demand completion.

The real BiliDili session-bound Recipe route succeeded through public host tooling and `alembic_dimension_complete`, and the final persisted SQLite coverage rows compare cleanly between host and in-process reads. The remaining failure is a source behavior defect: final rescan route output and terminal runtime cleanup still diverge from the persisted database state.

## Evidence Reviewed

- `Test/tmp/p15-bilidili-session-bound-recipe-evidence-realtest-t1/completed-summary.json`
- `Test/tmp/p15-bilidili-session-bound-recipe-evidence-realtest-t1/session-bound-recipe-evidence.json`
- `Test/tmp/p15-bilidili-session-bound-recipe-evidence-realtest-t1/submit-knowledge-parsed-response.json`
- `Test/tmp/p15-bilidili-session-bound-recipe-evidence-realtest-t1/dimension-complete-parsed-response.json`
- `Test/tmp/p15-bilidili-session-bound-recipe-evidence-realtest-t1/final-host-rescan-evidence.json`
- `Test/tmp/p15-bilidili-session-bound-recipe-evidence-realtest-t1/final-inprocess-rescan-evidence.json`
- `Test/tmp/p15-bilidili-session-bound-recipe-evidence-realtest-t1/final-parity.json`
- `Test/tmp/p15-bilidili-session-bound-recipe-evidence-realtest-t1/final-helper-summary.json`
- `Test/tmp/p15-bilidili-session-bound-recipe-evidence-realtest-t1/environment-ready.json`

## Accepted Evidence

- Test ran against real BiliDili with code points: Alembic `0d60018d7f6c9e2bb4a660b8ed18c303aa6af8ad`, AlembicCore `edd79d26d9d539fd52e17cf67299ccdba20b4e5a`, AlembicPlugin `2c03793562995c88fcf74b7e12ce48073e287453`, BiliDili `8487b82e7f3ceae7f35fcb19c6a5985022287422`.
- `session-bound-recipe-evidence.json` reports `ok=true` with source facts, recipe map, graph calls, public submit, dimension completion, persisted Recipe rows/source refs, SQLite integrity, and clean repositories.
- `submit-knowledge-parsed-response.json` reports `ok=true`, `status=degraded`, `count=2`, with grounded relationship/source evidence. This response alone does not prove three newly submitted IDs.
- `dimension-complete-parsed-response.json` reports `ok=true`, `status=ready`, `recipesBound=3`, no remaining dimensions, `qualityFeedback.totalScore=89`, and `qualityFeedback.pass=true`.
- The three bound Recipe IDs used by dimension completion are `<redacted>`, `<redacted>`, and `<redacted>`.
- `final-parity.json` reports comparable host/in-process persisted rows with `diffEmpty=true`, 16 rows on each side, SQLite integrity ok, and both persisted coverage seeds at `status=written`, `coveredPathCount=138`, `measuredCells=1`, `moduleCount=16`, `targetScopedCells=16`, `usableCells=16`, `writtenCells=16`.
- `final-helper-summary.json` confirms target-scoped rows are non-empty, aggregate/root rows are absent in normalized persisted rows, SQLite integrity is ok, measured cells are non-zero, and repositories are clean.

## Blocking Findings

1. The final host MCP route is not terminal-clean. `final-host-rescan-evidence.json` has `checks.noActiveBiliDiliSessions=false` and `checks.noOpenRounds=false`; the review pack reports one active BiliDili session and one open host-agent-rescan round after the final host rescan.
2. The final host route coverage seed projection is inconsistent with SQLite. Host `seedAnalysis.sqliteSeed` is written/non-empty, but the route seed paths under `$.result.meta.coverageLedgerSeed`, `$.fullData.meta.coverageLedgerSeed`, and `$.fullData.coverageLedgerSeed` report `status=inconsistent` with persisted count mismatch reasons.
3. The in-process route coverage seed projection is stale or computed from the wrong axis. `final-inprocess-rescan-evidence.json` reports route/event seed paths with `aggregateOrRootModuleIds=["target:Account:."]`, `coveredPathCount=0`, `measuredCells=0`, `moduleCount=15`, and `targetScopedCells=15`, while SQLite reports no aggregate/root modules, `coveredPathCount=138`, `measuredCells=1`, `moduleCount=16`, and `targetScopedCells=16`.
4. Final parity cannot be accepted even though normalized persisted rows are `diffEmpty=true`, because the final route outputs and runtime lifecycle checks fail.

## Forbidden Conclusions

- Do not claim P15 final parity success from row diff alone.
- Do not mark G4/G6 complete from this result.
- Do not manually clean BiliDili SQLite/session state as acceptance evidence.
- Do not treat the degraded submit response's `count=2` as proof that exactly two bound Recipes exist; dimension completion and persisted evidence prove three bound Recipe IDs for this test.

## Next Source Work

Create source repair tasks before the next Test rerun:

- AlembicPlugin: repair host-agent rescan terminal lifecycle/session release and host route `coverageLedgerSeed` projection so clean/full route output matches persisted SQLite or reports a truthful terminal lifecycle.
- Alembic: repair in-process/daemon rescan `coverageLedgerSeed` projection so route/event/result seeds match persisted SQLite normalized target-scoped coverage and do not emit stale `target:Account:.` aggregate/root-like seed data.

After both source repairs are accepted, dispatch Test to rerun the real BiliDili final parity without manual DB/session cleanup.
