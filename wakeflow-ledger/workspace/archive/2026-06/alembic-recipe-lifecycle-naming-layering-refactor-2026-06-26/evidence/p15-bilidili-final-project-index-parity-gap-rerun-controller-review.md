# P15 Controller Review - Final Project-Index Parity Gap Rerun

Date: 2026-06-29
Controller: AlembicWorkspace

Dispatch group:
- `p15-bilidili-final-project-index-parity-gap-rerun-p1`

Target task:
- Test / `p15-bilidili-final-project-index-parity-gap-rerun-t1`

## Decision

Decision: `accept-blocked-evidence`.

The Test result is a valid blocker for final P15 completion. It does not prove
whole-demand completion, G4 final acceptance, G6 cleanup eligibility, or archive
readiness.

The blocker is not current SQLite corruption: Test proved SQLite integrity is
`ok`. The failing gate is semantic parity and cleanup. Host rescan still writes
aggregate/root coverage rows and leaves a host-agent rescan round open; the
following in-process route adds one target-scoped row but the database remains
polluted by the host aggregate/root rows, so normalized parity is not comparable
and `diffEmpty=false`.

## Raw Evidence Reviewed

- Target result:
  `target-results/tr-p15-bilidili-final-project-index-parity-gap-rerun-t1.json`
- Task package:
  `task-packages/p15-bilidili-final-project-index-parity-gap-rerun-p1.json`
- Review pack:
  Wakeflow review pack for `p15-bilidili-final-project-index-parity-gap-rerun-p1`
- Raw Test evidence:
  - `Test/tmp/p15-bilidili-final-project-index-parity-gap-rerun-t1/final-summary.json`
  - `Test/tmp/p15-bilidili-final-project-index-parity-gap-rerun-t1/parity-diff.json`
  - `Test/tmp/p15-bilidili-final-project-index-parity-gap-rerun-t1/host-rescan-evidence.json`
  - `Test/tmp/p15-bilidili-final-project-index-parity-gap-rerun-t1/host-rescan-raw-mcp-result.json`
  - `Test/tmp/p15-bilidili-final-project-index-parity-gap-rerun-t1/inprocess-rescan-evidence.json`
  - `Test/tmp/p15-bilidili-final-project-index-parity-gap-rerun-t1/inprocess-rescan-status.json`
  - `Test/tmp/p15-bilidili-final-project-index-parity-gap-rerun-t1/restart-no-preclean.json`

## Controller Findings

Final summary checks:

- `hostRouteOk=false`
- `inprocessRouteOk=false`
- `parityOk=false`
- `hostSeedPresent=false`
- `inprocessSeedPresent=true`
- `targetScopedRowsNonEmpty=false`
- `aggregateOrRootAbsent=false`
- `sessionsAndRoundsClosed=false`
- `sqliteIntegrityOk=true`
- `normalizedDiffEmpty=false`
- repository status clean for the scoped repos

Host route facts:

- Route: `mcp-host-agent-alembic_rescan`.
- The public MCP result had `structuredContent.ok=true` and
  `structuredContent.toolName="alembic_rescan"`, but its coverage advisory still
  surfaced only aggregate/root module ids.
- SQLite after host rescan had 2 `coverage_ledger` rows, both aggregate/root:
  `BiliDili` and `module:root:BiliDili:BiliDili`.
- Host target-scoped rows: 0.
- Host measured rows: 0.
- Host SQLite-derived seed:
  `status="skipped"`, `reason="aggregate-or-root-only"`,
  `targetScopedCells=0`, `usableCells=0`, `writtenCells=2`.
- Host left 1 `deep_mining_rounds` row open.
- Host active session summary remained non-empty for the BiliDili project.

In-process route facts:

- Route: `daemon-api-inprocess-rescan`.
- The daemon rescan completed terminally and surfaced `coverageLedgerSeed`.
- The result/event seed was target-scoped:
  `aggregateOrRootModuleIds=[]`, `dimensionIds=["architecture"]`,
  `moduleCount=1`, `targetScopedCells=1`, `usableCells=1`,
  `writtenCells=3`, `measuredCells=0`.
- SQLite after in-process rescan had 3 coverage rows total: the 2 host
  aggregate/root rows plus 1 target-scoped row.
- SQLite-derived seed did not match the result seed because the database still
  contained aggregate/root rows.
- The same host-created open round remained open, so cleanup was still not
  closed.

Parity facts:

- `comparable=false`
- `diffEmpty=false`
- Invalid reason: target-scoped coverage rows must be non-empty on both host and
  in-process sides before parity can be claimed.
- Host target-scoped rows: 0.
- In-process target-scoped rows: 1.
- Host all-row count: 2.
- In-process all-row count: 3.
- Both sides had aggregate/root module ids in SQLite-derived evidence.
- The only target-scoped row present on the in-process side was
  `target:Networking:Sources/Infrastructure/Networking / architecture`.

## Ownership Judgment

The first product-code blocker is Plugin host-route behavior, not another Test
rerun:

- The host MCP route is the first route to pollute the ledger with aggregate/root
  rows after a clean coverage/round baseline.
- The host route leaves a `host-agent-rescan` round open.
- The host public output still advertises successful-looking rescan output even
  though the persisted ledger is aggregate/root-only and not parity-eligible.
- Test also captured repair-proof signals showing the seed-output repair was not
  present in the loaded source/dist evidence for this run, so the next repair
  must prove source and built runtime both contain the fix before rerun.

The in-process route has a secondary symptom: its result seed is target-scoped,
but SQLite-derived parity remains polluted by the host rows. That should be
rechecked after the host route no longer writes aggregate/root rows and closes
round/session state. Do not dispatch a broad Alembic repair until the Plugin
host-route first blocker is removed or fresh evidence isolates an independent
Alembic daemon defect.

## Next Action

Create and dispatch a narrow AlembicPlugin repair package for the P15 host
rescan parity blocker:

- make `alembic_rescan` host-route persisted coverage ledger target-scoped for
  the BiliDili ProjectMap target axis;
- reject or avoid aggregate/root module ids such as `BiliDili` and
  `module:root:*` in host rescan seed/advisory output for this parity path;
- close or fail-close the host-agent rescan round/session for terminal rescan
  outcomes, including no-recipe / advisory-only paths;
- prove source and built runtime contain the seed-output/target-axis repair
  before backfill;
- preserve frozen public tool/job/stage/lifecycle/schema values and R-2 dataRoot
  behavior.

After AlembicPlugin repair is accepted, rerun the same P15 real BiliDili parity
package through Test. The rerun must be no-sandbox, provider-preserving, and
must prove SQLite integrity ok, target-scoped non-empty rows on both sides, no
aggregate/root module ids, closed sessions/rounds, and normalized
`diffEmpty=true`.

## Forbidden Conclusions

- Do not complete or archive the demand from this Test result.
- Do not manually delete BiliDili SQLite rows or session files to manufacture a
  target-only parity result.
- Do not classify the current failure as SQLite corruption; integrity is ok.
- Do not keep rerunning Test against the same host-route defect without a source
  repair.
- Do not remove compatibility aliases or perform G6 cleanup from this evidence.
