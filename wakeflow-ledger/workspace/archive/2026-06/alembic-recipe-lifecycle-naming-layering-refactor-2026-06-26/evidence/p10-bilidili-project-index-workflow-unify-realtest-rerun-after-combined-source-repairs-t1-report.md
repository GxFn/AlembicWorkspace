# P10 BiliDili project-index workflow REAL-TEST rerun after combined source repairs

Date: 2026-06-28
Window: Test
Task: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1`
Dispatch group: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-p1`
Status: blocked

## Question

After the accepted AlembicPlugin noPadding session cleanup repair and Alembic root
moduleScope alias repair, does the real BiliDili P10 project-index workflow
recover end to end: noPadding terminal cleanup clears the file-backed host-agent
session, root moduleScope keeps real nested deepMining targets, coverageLedgerSeed
is reached, coverage ledger becomes non-empty, and normalized host vs in-process
diff is empty?

## Boundary

- Real project: `BiliDili`
- Local data root: `~/.asd/workspaces/02a25032`
- Dashboard/API: `http://127.0.0.1:58762`
- No source, provider, version, or database/session files were manually edited.
- Alembic, AlembicPlugin, AlembicCore, and BiliDili worktrees were clean after the run.
- This report does not claim P11, P12, P13, G4, or whole-demand completion.

## Code and runtime baseline

- Alembic HEAD matched the task pin: `bf328ea81a809bb8f761c0a0d81162703b1cb70d`.
- AlembicPlugin HEAD matched the task pin: `9eaf89ad99ce87779c050487d22f98e281f5e1ff`.
- AlembicCore HEAD matched the task pin: `99a7cf10d82056cd860eb0a1d9544662e3735b08`.
- BiliDili HEAD matched the task pin: `6f1bf34cf1b6daca4e08895db211939115dac868`.
- `npm run build` passed in Alembic and AlembicPlugin before runtime execution.
- Provider evidence preserved the required route: DeepSeek `deepseek-v4-pro` generation plus local Ollama `qwen3-embedding:0.6b` embeddings with local-first lane order.
- R-2 source proof was true before destructive/reset execution:
  - full host cleanup uses `dataRoot`;
  - full in-process cleanup uses `projectRoot`;
  - incremental cleanup uses `dataRoot`.
- Repair source proof was present:
  - Plugin briefing projects include `coverageLedgerSeed`;
  - Plugin rescan attaches `coverageLedgerSeed` under output metadata;
  - Plugin noPadding cleanup is dataRoot-scoped and closes host-agent rescan rounds;
  - Alembic plan gate accepts the root basename alias for moduleScope matching.

## Host path

The host-side stale-session blocker recovered.

- Before cleanup, the previous failed host-agent session existed for BiliDili.
- The public terminal noPadding candidate-insufficient path was exercised with a submitted recipe id.
- After that terminal path, active session count was 0 and matchingProjectCount was 0.
- No stale open host-agent-rescan round remained.
- Snapshot: `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/after-nopadding-cleanup-with-recipe-snapshot.json`

The host bootstrap/rescan gate also advanced further than prior failed runs.

- `alembic_bootstrap({ rebuild: true })` succeeded after cleanup.
- Three real architecture recipes were submitted and bound for bootstrap completion.
- Host deepMining/rescan reached `coverageLedgerSeed`; the copied full briefing contains `coverageLedgerSeed`.
- After the host rescan terminal noPadding cleanup with a submitted recipe id:
  - active session count: 0
  - matchingProjectCount: 0
  - `coverage_ledger`: 8 rows
  - `deep_mining_rounds`: 1 row
  - open rounds: 0
- Snapshot: `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/after-host-rescan-nopadding-with-recipe-snapshot.json`

## In-process path

The in-process root alias blocker also recovered far enough to run real nested
targets.

- In-process bootstrap completed.
- In-process deepMining/rescan with `moduleScope=["BiliDili"]` no longer removed all targets.
- The plan gate selected a nested BiliDili target path instead of failing the scope to zero.
- The final in-process snapshot after completion showed:
  - active session count: 0
  - matchingProjectCount: 0
  - `coverage_ledger`: 15 rows
  - `deep_mining_rounds`: 1 row
  - open rounds: 0
- The deepMining round was closed and recorded 3 new recipes from the daemon route.
- Snapshot: `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/final-snapshot.json`

## Parity

Parity is still blocked.

The comparison was not a 0-vs-0 false pass: both sides produced non-empty
coverage ledgers. However, the normalized row-level diff is non-empty:

- Host row count: 8
- In-process row count: 15
- Comparable: true
- Diff empty: false
- Host-only normalized rows: 8
- In-process-only normalized rows: 15

The remaining mismatch is a module-axis/seed-shape mismatch. The host side still
contains canonical aggregate module rows such as `BiliDili`, `Sources`, and
`Packages/AOXFoundationKit`; the in-process side contains target-scoped rows such
as `target:Account:Sources/Infrastructure/Account` and
`target:ServiceKit:Sources/Core/ServiceKit`. Because the task card requires the
normalized host vs in-process parity diff to be empty, this result must remain
blocked.

Parity artifact:
`Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/parity-diff.json`

## Classification

Blocked, with two repair areas verified as improved but the final P10 parity
predicate still failing.

Recovered:

- noPadding terminal cleanup releases the file-backed host-agent session;
- no stale host-agent-rescan round remains after the terminal cleanup path;
- host reaches `coverageLedgerSeed` and writes a non-empty ledger;
- in-process `moduleScope=["BiliDili"]` keeps nested targets and writes a non-empty ledger;
- both final snapshots have active session count 0 and open round count 0.

Still failing:

- normalized host vs in-process parity diff is non-empty for the P10 coverage
  ledger predicate.

Recommended next owner: source repair in the owning Alembic/AlembicPlugin chain
for host vs in-process coverage-ledger module-axis normalization. Do not repair
the BiliDili database manually as a Test action.

## Evidence files

- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/restart.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/environment-after-restart.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/before-host-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/after-nopadding-cleanup-with-recipe-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/after-host-bootstrap-ready-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/host-rescan-full-briefing.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/after-host-rescan-nopadding-with-recipe-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/inprocess-rerun-evidence.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/final-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/parity-diff.json`
