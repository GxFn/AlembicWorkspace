# P15 Controller Review - Final Parity Rerun After Plugin Host Rescan Repair

Reviewed at: 2026-06-29

Dispatch group: `p15-bilidili-final-project-index-parity-rerun-after-plugin-host-rescan-repair-p1`

Target task: Test / `p15-bilidili-final-project-index-parity-rerun-after-plugin-host-rescan-repair-t1`

Decision: accept blocked Test evidence; P15 final parity remains open.

## Scope Reviewed

- Target result:
  `target-results/target-result-p15-bilidili-final-project-index-parity-rerun-after-plugin-host-rescan-repair-t1.json`
- Task package:
  `task-packages/p15-bilidili-final-project-index-parity-rerun-after-plugin-host-rescan-repair-p1.json`
- Test card:
  `test-cards/p15-bilidili-final-project-index-parity-rerun-after-plugin-host-rescan-repair-t1.json`
- Prior Plugin repair acceptance:
  `evidence/p15-plugin-host-rescan-target-axis-round-cleanup-repair-controller-review.md`
- Raw Test evidence:
  - `Test/tmp/p15-bilidili-final-project-index-parity-rerun-after-plugin-host-rescan-repair-t1/baseline-after-restart.json`
  - `Test/tmp/p15-bilidili-final-project-index-parity-rerun-after-plugin-host-rescan-repair-t1/host-rescan-evidence.json`
  - `Test/tmp/p15-bilidili-final-project-index-parity-rerun-after-plugin-host-rescan-repair-t1/host-rescan-parsed-response.json`
  - `Test/tmp/p15-bilidili-final-project-index-parity-rerun-after-plugin-host-rescan-repair-t1/host-rescan-full-briefing.json`
  - `Test/tmp/p15-bilidili-final-project-index-parity-rerun-after-plugin-host-rescan-repair-t1/inprocess-rescan-evidence.json`
  - `Test/tmp/p15-bilidili-final-project-index-parity-rerun-after-plugin-host-rescan-repair-t1/parity-diff.json`
  - `Test/tmp/p15-bilidili-final-project-index-parity-rerun-after-plugin-host-rescan-repair-t1/final-summary.json`

## Evidence Summary

Positive evidence after AlembicPlugin commit `3be8e5182c7d8cd568a9d0b327a030a815ee82a0`:

- Loaded code points were correct: Alembic `0d60018d7f6c9e2bb4a660b8ed18c303aa6af8ad`, Core `edd79d26d9d539fd52e17cf67299ccdba20b4e5a`, Plugin `3be8e5182c7d8cd568a9d0b327a030a815ee82a0`.
- Provider route stayed correct: DeepSeek generation plus local Qwen/Ollama embedding.
- SQLite integrity was `ok`.
- Product repos Alembic, AlembicCore, AlembicPlugin, and BiliDili had clean scoped git status.
- Plugin repair markers were loaded.
- Host MCP `alembic_rescan` returned ok/ready and surfaced a target-scoped `coverageLedgerSeed`.
- Host and in-process target-scoped row counts both reached 15.
- Normalized target-scoped diff was comparable and `diffEmpty=true`.

This is real progress over the previous P15 run: host target rows are no longer 0 and host route-visible advisory is target-scoped.

## Blocking Evidence

The P15 pass predicate still fails.

Baseline after the no-preclean restart was already dirty:

- `coverage_ledger` had 3 rows: 1 target-scoped row plus aggregate/root rows `BiliDili` and `module:root:BiliDili:BiliDili`.
- There was 1 open `host-agent-rescan` round from the prior P15 failed run.
- There was 1 active BiliDili workflow session.

The current host route improved target-axis writing but did not close the lifecycle state:

- Host before route: 1 open `host-agent-rescan` round.
- Host after route: 2 open `host-agent-rescan` rounds.
- The new open round was created by the current task:
  `p15-bilidili-final-project-index-parity-rerun-after-plugin-host-rescan-repair-t1-host-1782667173308`.
- Active BiliDili workflow session count stayed 1.
- Host full briefing had `coverageAdvisory.shouldStop=true` and `stopReason="diminishing-returns"`, but no `noActionableHostAgentWork` cleanup metadata was present.

Persisted ledger and route-visible seed also disagree:

- Host route-visible seed was target-scoped and reported `writtenCells=15`, `targetScopedCells=15`, `usableCells=15`, `measuredCells=15`, `aggregateOrRootModuleIds=[]`.
- SQLite-derived seed after host route had `writtenCells=17`, `targetScopedCells=15`, `usableCells=15`, `measuredCells=0`, and aggregate/root ids `BiliDili`, `module:root:BiliDili:BiliDili`.
- Final SQLite coverage rows remained 17 total, including the 2 aggregate/root rows.

In-process parity is not a completion proof:

- In-process route also ended with 17 total rows and the same aggregate/root rows.
- Its route-visible seed reported `aggregateOrRootModuleIds=[]`, but SQLite-derived seed still had the aggregate/root rows.
- Its deepMining advisor still ranked aggregate/root gaps first:
  `module:root:BiliDili:BiliDili`, then `BiliDili`, then target-scoped modules.
- `diffEmpty=true` only means both sides now match after sharing the same polluted persisted state; it does not satisfy the hard predicate requiring no aggregate/root rows and no open sessions/rounds.

## Ownership Judgment

This Test blocker is valid and should be accepted as evidence. It is not SQLite corruption, provider drift, wrong HEAD, or Test source editing.

Do not immediately rerun Test:

- A no-preclean rerun starts from known dirty state.
- A clean rebuild/reset rerun may remove old aggregate/root rows, but the current host route still created a new open `host-agent-rescan` round under a terminal `shouldStop=true` advisory.
- The host route also emits success-looking seed metadata that does not match persisted SQLite state.

First source owner: AlembicPlugin host MCP rescan / knowledge-rescan route.

Repair should stay narrow:

- terminal advisory/no-actionable host rescan cleanup must close or fail-close applicable host-agent rescan rounds and release the BiliDili session;
- route-visible `coverageLedgerSeed`/briefing/meta must not hide persisted aggregate/root rows or overstate measured cells relative to persisted ledger state;
- host route should not leave success-looking seed/advisory output that conflicts with SQLite-derived state;
- if removing stale aggregate/root persisted rows safely requires an AlembicCore repository API, AlembicPlugin should return blocked with the exact API need rather than hand-editing data.

The in-process advisor aggregate/root ranking may be downstream of the same polluted persisted rows. Recheck it after the Plugin host terminal cleanup/seed consistency repair and a BiliDili-only rebuild/reset Test rerun before dispatching Alembic main repair.

## Controller Acceptance

- User goal: finish the Recipe lifecycle naming/layering refactor through P15 hard gates.
- Scope reviewed: Test rerun after accepted AlembicPlugin host-rescan target-axis/round cleanup repair.
- Original requirement authority: state-root P15 test card and final parity package; P15 pass requires real BiliDili evidence, target-scoped non-empty coverage rows, no aggregate/root success rows, closed sessions/rounds, SQLite integrity, and normalized parity.
- Target/window: Test / `p15-bilidili-final-project-index-parity-rerun-after-plugin-host-rescan-repair-t1`.
- Evidence reviewed: target result, review pack, task package, test card, final summary, parity diff, host raw/full briefing, in-process raw evidence, baseline DB/session state, prior Plugin repair acceptance.
- Implementation reality: Plugin repair fixed host target-axis surfacing enough to produce 15 target-scoped rows, but host terminal cleanup and persisted-vs-public seed consistency remain broken in the real route.
- Validation result: Test execution is valid; P15 pass predicate is not met.
- Blockers: host route creates/leaves open `host-agent-rescan` rounds under terminal advisory; persisted ledger still includes aggregate/root rows; route-visible seed and SQLite-derived seed disagree; active BiliDili session remains.
- Missing evidence: no clean rebuild/reset rerun after repairing terminal cleanup; no proof that aggregate/root advisor ranking persists on a clean ledger.
- Residual risks: the current BiliDili data root has stale rows/open round from prior failed P15 run; do not use that dirty baseline as final acceptance or as sole proof of an Alembic main defect.
- TODO/backlog rollup: create a narrow AlembicPlugin repair package; after accepting it, rerun Test with an explicit BiliDili-only rebuild/reset boundary.
- Decision: accept-target-result as blocked evidence.
- Next action: create-next-package for AlembicPlugin host-rescan terminal cleanup and seed consistency repair.

## Forbidden Conclusions

- Do not complete/archive the demand.
- Do not accept P15 from `diffEmpty=true`; the diff is empty over polluted persisted state.
- Do not manually edit BiliDili SQLite/session/round rows.
- Do not dispatch Alembic main repair yet for advisor aggregate/root ranking until Plugin cleanup and a clean rerun show it is independent.
- Do not perform G6 cleanup, push, version, release, or remove compatibility aliases from this evidence.
