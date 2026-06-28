# P10 BiliDili Project Index Workflow Unify Real Test Rerun After Module Axis Repair

Status: blocked
Window: Test
Task: p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-t1

## Scope

This Test run used the real BiliDili workspace and the current Alembic/AlembicPlugin/AlembicCore sources. It did not use a sandbox copy and did not manually edit source, provider config, versions, sessions, or the database.

## Prechecks

- Source pins matched the task package:
  - Alembic `bf328ea81a809bb8f761c0a0d81162703b1cb70d`
  - AlembicPlugin `29401435dabfdea5961655bad9130c17907cf977`
  - AlembicCore `99a7cf10d82056cd860eb0a1d9544662e3735b08`
  - BiliDili `6f1bf34cf1b6daca4e08895db211939115dac868`
- `npm run build` passed in Alembic.
- `npm run build` passed in AlembicPlugin.
- Test environment was ready through the configured BiliDili Alembic API URL.
- Provider config proof from the baseline snapshot:
  - generation provider: DeepSeek / `deepseek-v4-pro`
  - embedding provider: local Ollama / `qwen3-embedding:0.6b`
  - embed lane order: `local-first`
- R-2 source proof from the baseline snapshot:
  - `fullHostUsesDataRoot=true`
  - `fullInProcessUsesProjectRoot=true`
  - `incrementalUsesDataRoot=true`
- Source repair proof flags were all true, including `pluginRescanUsesProjectMapModuleAxis=true`, `pluginNoPaddingClearsDataRootSession=true`, and `pluginNoPaddingClosesRound=true`.
- All four source repositories were clean at final status check.

## Host Run

The host path completed cold-start planning, rebuild bootstrap, source-backed Recipe submission, and architecture dimension completion. It then ran deep-mining rescan for `moduleScope=["BiliDili"]` with reason `p10-workflow-unify-rerun-after-module-axis-repair-host`.

The rescan generated a full briefing at the Alembic data root tmp path:

- `.asd/tmp/rescan-briefing-02a250323c6c6ade.json`

The host rescan wrote a non-empty coverage ledger:

- `coverageLedger=23`
- `deepMiningRounds=2`
- `knowledgeEntries=18`
- `recipeSourceRefs=12`

No-padding cleanup required one real, source-backed AOXNetworkKit Recipe to satisfy the session evidence gate:

- Recipe: `<redacted>`
- Title: `双层重试边界`
- Sources: `NetworkClient.swift`, `MiddlewareInterceptor.swift`, `RetryPolicy.swift`

After the no-padding cleanup attempt, active sessions and open rounds were clean:

- `activeSessionCount=0`
- `matchingProjectCount=0`
- `openRounds=0`

## Blocking Evidence

The module-axis repair did not meet the Test card success gate.

The final host cleanup snapshot shows `targetScopedOnly=false`. The coverage ledger contains 23 rows: 15 target-scoped module ids and 8 aggregate/root module ids.

Target-scoped ids are present, for example:

- `target:Networking:Sources/Infrastructure/Networking`
- `target:AOXFoundationKit:Packages/AOXFoundationKit/Sources/AOXFoundationKit`
- `target:AOXNetworkKit:Packages/AOXNetworkKit/Sources/AOXNetworkKit`

But aggregate/root ids are still present:

- `BiliDili`
- `Packages/AOXFoundationKit`
- `Packages/AOXNetworkKit`
- `Packages/AOXPlayer`
- `Packages/AOXUIKit`
- `Sources`
- `module:root:BiliDili:BiliDili`
- `root`

The rescan briefing also reports a mixed `coverageAdvisory.valueSortedGaps` list. It includes target-scoped ids and aggregate/root ids in the same architecture gap set. The briefing's `coverageLedgerSeed` was reached, but it reports only:

- `status=written`
- `writtenCells=2`
- `moduleCount=2`
- `dimensionIds=["architecture"]`

The host full-reset logs also contained the relevant warning `Failed to clear knowledge_entries: database disk image is malformed` during the current rebuild window. Test did not repair the database manually.

## Stop Decision

Because the host module-axis proof failed, Test stopped before running the in-process rerun and parity artifact. Running in-process parity after the host proof failed would not remove the first blocker and could create misleading 0-vs-0 or mixed-axis parity evidence.

## Raw Artifacts

- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-t1/p10-module-axis-rerun-evidence.mjs`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-t1/before-host-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-t1/after-host-bootstrap-complete-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-t1/after-host-rescan-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-t1/after-host-nopadding-attempt-snapshot.json`
- Alembic data root tmp: `.asd/tmp/rescan-briefing-02a250323c6c6ade.json`

## Result

Blocked. Host rescan reached coverage ledger generation and cleanup succeeded, but module-axis normalization is still mixed instead of ProjectMap target-scoped only. In-process parity was intentionally not run after the host proof failed.
