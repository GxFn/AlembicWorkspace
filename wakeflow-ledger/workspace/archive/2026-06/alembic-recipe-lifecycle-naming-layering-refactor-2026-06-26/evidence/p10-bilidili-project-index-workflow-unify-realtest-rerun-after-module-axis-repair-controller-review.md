# P10 Controller Review - BiliDili module-axis repair rerun

Date: 2026-06-28
Controller: AlembicWorkspace

Dispatch group:
- `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-p1`

Target task:
- Test / `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-t1`

## Decision

Test's blocked result is accepted as valid raw evidence. P10 remains blocked.

This is a product-code rework, first owner AlembicPlugin. The previous Plugin
module-axis repair fixed only the host rescan seed path. The real BiliDili run
shows other Plugin coverage-ledger write/read paths still reintroduce
aggregate/root module ids into the ledger, so the host module-axis proof fails
before in-process parity can be meaningful.

## Raw Evidence Reviewed

- Target result:
  `target-results/tr-p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-t1.json`
- Test report:
  `evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-t1-report.md`
- Test summary:
  `evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-t1-summary.json`
- Task package:
  `task-packages/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-p1.json`
- Raw Test snapshots:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-t1/before-host-snapshot.json`
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-t1/after-host-bootstrap-complete-snapshot.json`
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-t1/after-host-rescan-snapshot.json`
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-t1/after-host-nopadding-attempt-snapshot.json`
- Host briefing:
  `.asd/tmp/rescan-briefing-02a250323c6c6ade.json`
- Source areas inspected:
  `AlembicPlugin/lib/recipe-generation/host-agent-workflows/dimension-completion.ts`
  `AlembicPlugin/lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
  `AlembicPlugin/lib/service/module/ModuleService.ts`
  `AlembicCore/src/workflows/capabilities/coverage/CoverageLedgerBuilder.ts`

## Controller Findings

The Test run is valid for this gate:

- Pins matched the task package:
  - Alembic `bf328ea81a809bb8f761c0a0d81162703b1cb70d`
  - AlembicPlugin `29401435dabfdea5961655bad9130c17907cf977`
  - AlembicCore `99a7cf10d82056cd860eb0a1d9544662e3735b08`
  - BiliDili `6f1bf34cf1b6daca4e08895db211939115dac868`
- Alembic and AlembicPlugin builds passed.
- R-2 root/dataRoot proof held.
- Providers remained DeepSeek `deepseek-v4-pro` plus local Ollama
  `qwen3-embedding:0.6b`.
- Test did not edit source repositories, provider config, versions, session
  files, or DB files manually.

The previous blockers did improve:

- Host rescan reached `coverageLedgerSeed`.
- Host coverage ledger was non-empty.
- noPadding cleanup left `activeSessionCount=0`, `matchingProjectCount=0`, and
  `openRounds=0`.

The remaining hard failure is module-axis purity:

- `before-host-snapshot.json` had 15 coverage ledger rows, all target-scoped,
  with `targetScopedOnly=true`.
- `after-host-bootstrap-complete-snapshot.json` had 21 rows: the original 15
  target-scoped rows plus 6 aggregate ids:
  `BiliDili`, `Packages/AOXFoundationKit`, `Packages/AOXNetworkKit`,
  `Packages/AOXPlayer`, `Packages/AOXUIKit`, and `Sources`.
- `after-host-rescan-snapshot.json` had 23 rows: the same mixed set plus
  `module:root:BiliDili:BiliDili` and `root`.
- The briefing `coverageLedgerSeed` reports `status=written`, `writtenCells=2`,
  `moduleCount=2`, but final DB state contains 23 rows, so the already reviewed
  rescan seed fix is not the only write/read path affecting the gate.
- The briefing `coverageAdvisory.valueSortedGaps` also mixes target-scoped ids
  with aggregate/root ids in the same architecture gap set.

Source inspection supports Plugin ownership:

- `dimension-completion.ts` still writes coverage ledger cells through
  `writeDimensionCompletionCoverageLedger`, using
  `ModuleService.listCanonicalModules()` as its module axis. The BiliDili raw
  snapshots show aggregate rows appear immediately after the host bootstrap /
  dimension-completion phase, before the rescan proof is evaluated.
- `knowledge-rescan.ts` now prefers ProjectMap modules for seed writing, but its
  ProjectMap helper does not reject plan-scope/root modules; the real briefing
  after rescan still surfaces `root` and `module:root:*`.
- `attachCoverageAdvisory` reads all ledger cells by projectRoot and returns
  mixed-axis gaps; it currently has no target-axis filter/normalization before
  surfacing gaps.

The database warning (`knowledge_entries` clear reported malformed DB image)
does not explain the axis failure by itself: the before-host snapshot was
target-scoped only, then aggregate rows were introduced during the current host
workflow. It remains a risk to keep in evidence, but it is not a reason to
accept P10 or manually repair BiliDili state.

## Controller Decision

Decision: `request-rework`.

First owner: AlembicPlugin.

Required repair direction:

- Normalize Plugin coverage-ledger module axes across host dimension-completion,
  host rescan seed, and coverage advisory surfaces so P10 host route cannot
  write or surface aggregate/root module ids when ProjectMap target-scoped
  modules are available.
- Preserve recovered noPadding cleanup behavior.
- Preserve `coverageLedgerSeed` output metadata and provider handling.
- Do not manually edit BiliDili DB/source/provider config, freeze values,
  package versions, or release assets.

## Remaining Gate

After the Plugin repair is accepted, Test must rerun the real BiliDili P10
scenario. Success still requires:

- host ledger non-empty and target-scoped only;
- in-process `moduleScope=["BiliDili"]` keeps nested ProjectMap targets and
  writes a non-empty ledger;
- normalized host vs in-process parity diff empty;
- not a 0-vs-0 comparison.

## Forbidden Conclusions

- Do not accept P10, G4, G6, P11, P12, P13, or the whole demand from this Test
  result.
- Do not treat non-empty mixed-axis coverage ledger as success.
- Do not rerun Test again before source repair; it would reproduce the same
  first blocker.
- Do not manually repair or prune the real BiliDili DB to manufacture target-only
  parity.
