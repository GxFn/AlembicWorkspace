# P15 BiliDili Final Parity Rerun After Terminal Seed Projection Source Repairs - Controller Review

Date: 2026-06-28

State root: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`

Dispatch group: `p15-bilidili-final-parity-rerun-after-terminal-seed-projection-source-repairs-p1`

Target task: `p15-bilidili-final-parity-rerun-after-terminal-seed-projection-source-repairs-t1`

Controller decision: accept the Test target result. This accepts the real BiliDili final parity evidence after the paired source repairs; it does not by itself push, release, archive, or skip final P15/CG-5 closure.

## Raw Evidence Reviewed

- Target result: `target-results/tr-p15-bilidili-final-parity-rerun-after-terminal-seed-projection-source-repairs-t1.json`
- Completed summary: `Test/tmp/p15-bilidili-final-parity-rerun-after-terminal-seed-projection-source-repairs-t1/completed-summary.json`
- Host evidence: `Test/tmp/p15-bilidili-final-parity-rerun-after-terminal-seed-projection-source-repairs-t1/host-rescan-evidence.json`
- In-process evidence: `Test/tmp/p15-bilidili-final-parity-rerun-after-terminal-seed-projection-source-repairs-t1/inprocess-rescan-evidence.json`
- Parity diff: `Test/tmp/p15-bilidili-final-parity-rerun-after-terminal-seed-projection-source-repairs-t1/parity-diff.json`
- Final summary: `Test/tmp/p15-bilidili-final-parity-rerun-after-terminal-seed-projection-source-repairs-t1/final-summary.json`
- Final snapshot: `Test/tmp/p15-bilidili-final-parity-rerun-after-terminal-seed-projection-source-repairs-t1/final-after-snapshot.json`

## Controller Findings

- Real BiliDili workspace/data root only: project root `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`; data root `/Users/gaoxuefeng/.asd/workspaces/02a25032`.
- Provider pairing preserved: DeepSeek generation plus local Ollama/Qwen embedding (`qwen3-embedding:0.6b`).
- Loaded code points match accepted repairs or descendants:
  - Alembic `4dd8083ff9b171408b120903caf7821a14452ebf`
  - AlembicPlugin `68d1e39e0387246239cedd4e0dc31141504c0975`
  - AlembicCore `edd79d26d9d539fd52e17cf67299ccdba20b4e5a`
- Runtime projection issue was handled inside Test evidence: Alembic ignored `dist` was stale before local `npm run build`; Test rebuilt the runtime projection and confirmed product git statuses clean.
- Host route result is successful and terminal:
  - `coverageLedgerSeed.status=written`
  - `writtenCells=16`, `targetScopedCells=16`, `usableCells=16`
  - `measuredCells=1`, `coveredPathCount=138`
  - `aggregateOrRootModuleIds=[]`
  - SQLite seed matches route seed.
- In-process route result is successful and terminal with the same seed:
  - `coverageLedgerSeed.status=written`
  - `writtenCells=16`, `targetScopedCells=16`, `usableCells=16`
  - `measuredCells=1`, `coveredPathCount=138`
  - `aggregateOrRootModuleIds=[]`
  - SQLite seed matches route seed.
- G4 coverage gate is now satisfied by non-empty measured in-process coverage (`measuredCells=1`, `coveredPathCount=138`).
- Session/round terminal gate is satisfied: active BiliDili sessions `0`, matching project sessions `0`, open host-agent/deepMining rounds `0`.
- Normalized host-vs-in-process parity is comparable and `diffEmpty=true`, with 16 host rows and 16 in-process rows; not a 0-vs-0 pass.
- Final DB integrity is `ok`; final BiliDili coverage rows are target-scoped and include the repaired package-root target `target:Account:.` as covered, not aggregate/root pollution.

## Risks And Invalid Conclusions

- Test does not accept P15, archive, push, release, or dispatch onward; controller owns those decisions.
- This result closes the final BiliDili parity/G4 evidence gap, but final P15 closure still requires controller state reduction and any remaining freeze/CG-5 audit handling.
- Existing old failed jobs in the data root are historical log tail evidence and are not the terminal state; the current rerun's final snapshot and summaries show the terminal session/round/seed state.
