# P10 Controller Review - Plugin coverage ledger module-axis normalization repair

Date: 2026-06-28
Controller: AlembicWorkspace

Dispatch group:
- `p10-plugin-coverage-ledger-module-axis-normalization-repair-p1`

Target task:
- AlembicPlugin / `p10-plugin-coverage-ledger-module-axis-normalization-repair-t1`

## Decision

AlembicPlugin target evidence is acceptable for the scoped P10 source repair.
This accepts only the Plugin code repair that normalizes host rescan
coverage-ledger module axes; it does not accept the P10 real BiliDili parity
gate.

The next valid action is a Test rerun of the real BiliDili host/in-process P10
scenario to prove the final coverage-ledger parity predicate.

## Raw Evidence Reviewed

- Target result:
  `target-results/target-result-p10-plugin-coverage-ledger-module-axis-normalization-repair-t1.json`
- Task package:
  `task-packages/p10-plugin-coverage-ledger-module-axis-normalization-repair-p1.json`
- Prior controller review requiring this repair:
  `evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-controller-review.md`
- Plugin commit:
  `29401435dabfdea5961655bad9130c17907cf977`
- Source files:
  `AlembicPlugin/lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
  `AlembicPlugin/test/unit/RescanCoverageModuleAxis.test.ts`

## Controller Findings

Commit `29401435dabfdea5961655bad9130c17907cf977` changes only the Plugin host
rescan workflow file and a focused unit-test file:

- `knowledge-rescan.ts` now resolves the coverage ledger module axis through
  exported `buildRescanCoverageModuleAxis`.
- The new axis resolver first builds modules from
  `HostAgentProjectContextAnalysis.presenterInput.map?.modules`, using
  ProjectMap module ids plus path-backed `ref.scope.filePath` ownership.
- Only when no path-backed ProjectMap module is available does the host path
  fall back to the legacy rescan snapshot/moduleBinding aggregation.
- `seedRescanCoverageLedgerFromSnapshot` now logs which source was used
  (`project-map` or `rescan-snapshot`) before writing the ledger.

This directly addresses the prior Test failure: host coverage ledger rows were
written on aggregate/root axes such as `BiliDili`, `Sources`, `Packages/*`,
`root`, and `module:root:*`, while the in-process Alembic route wrote ProjectMap
target axes such as `target:Account:Sources/Infrastructure/Account`.

The implementation does not touch BiliDili source/data, provider config,
frozen public strings, Core source, Alembic source, release assets, package
versions, or the previously repaired noPadding/session cleanup behavior.

## Controller Validation

I independently reviewed the diff and ran the following commands from
`AlembicPlugin/`:

- `npm run test:unit -- test/unit/RescanCoverageModuleAxis.test.ts`
  - Passed: 1 file, 2 tests.
- `npm run build:check`
  - Passed; Core build used local `../AlembicCore` at
    `99a7cf10d82056cd860eb0a1d9544662e3735b08`.
- `npm run lint:repo-boundary`
  - Passed; escape-hatch count 0 / 75.
- `git diff --check`
  - Passed with no whitespace errors.

Target-reported validation also included focused session-regression coverage,
Biome check, full lint, core-import/layer/naming/doctrine boundary checks, and
`git diff --check`. The target attempted `alembic_code_guard` twice, but the
Alembic MCP returned an internal schema error (`unrecognized key "data"`). This
does not invalidate the reviewed source evidence, but it remains a tool-surface
observation rather than product acceptance evidence.

## Remaining Gate

P10 remains unaccepted until Test reruns the real BiliDili scenario and proves:

- host noPadding cleanup remains clean;
- host rescan still reaches `coverageLedgerSeed`;
- in-process `moduleScope=["BiliDili"]` keeps nested ProjectMap targets;
- host and in-process coverage-ledger parity diff is empty;
- the result is not a 0-vs-0 comparison.

## Forbidden Conclusions

- Do not accept P10 REAL-TEST, G4, G6, P11, P12, P13, or the whole demand from
  this Plugin result alone.
- Do not treat unit tests as a substitute for the required real BiliDili rerun.
- Do not reopen the already proven noPadding/session cleanup or root-module
  alias repairs unless the next Test rerun produces contradictory raw evidence.
