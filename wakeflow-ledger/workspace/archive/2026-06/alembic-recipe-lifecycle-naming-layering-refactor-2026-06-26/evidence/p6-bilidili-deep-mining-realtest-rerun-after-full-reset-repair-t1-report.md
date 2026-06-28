# P6 BiliDili DeepMining Rerun After Full Reset Repair

## Conclusion

Status: **completed for Test evidence**.

The assigned P6 repair rerun passed its main real-scenario gate. Against Alembic commit `9d703a3fa8a6f7cbabb1d02ec5d968e2c399a3d1`, the qwen-fixed full reset cleared the stale measured-state tables for the real BiliDili workspace, and the following in-process deepMining job opened/closed fresh rounds from reset baseline 0 to max round 2. Advisor termination was `diminishing-returns`, which is acceptable for P6 because it happened after fresh round advancement.

This result does **not** accept host-agent parity, P7+, coldStart measured coverage, or whole-demand completion.

## Identity And Stack

- Window/task: Test / `p6-bilidili-deep-mining-realtest-rerun-after-full-reset-repair-t1`.
- State root: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`.
- BiliDili project root: `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`.
- BiliDili data root: `/Users/gaoxuefeng/.asd/workspaces/02a25032`.
- DB: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/alembic.db`.
- Daemon: `http://127.0.0.1:51737`, pid `40047`, started `2026-06-27T23:37:45.285Z`.
- Generation: DeepSeek `deepseek-v4-pro`.
- Embedding: local Ollama/Qwen `qwen3-embedding:0.6b`, base `http://127.0.0.1:11434/v1`.
- Log provider check: DeepSeekProvider + dedicated ollama provider at `2026-06-27T23:37:45.206Z`; `0` ollama 404 warnings after the corrected restart. The 13 404 warnings were from the earlier root-base diagnostic run before this final rerun.

## Repository Heads

- Alembic: `9d703a3fa8a6f7cbabb1d02ec5d968e2c399a3d1`.
- AlembicCore: `8e71bbd500992c625b1696f3b04f0f2fa8273608`.
- AlembicPlugin: `384338921d16a937852216849554ae352018a565`.
- AlembicAgent: `99b8b33a591b0199f47cb8fc40bc939fe4a4dee5`.
- BiliDili: `6f1bf34cf1b6daca4e08895db211939115dac868`.

BiliDili remained source-clean for this Test task: `## main...origin/main [ahead 1]`. No product code, vendor pins, versions, release files, or DB manual mutations were made.

## R-2 / Root Guard

- `Alembic/vendor/AlembicCore/src/workflows/cold-start/ColdStartPlan.ts:77`: full-reset cleanup uses `dataRoot` only for `host-agent`, otherwise `projectRoot`, with `dataRoot` still carried separately.
- `Alembic/vendor/AlembicCore/src/workflows/knowledge-rescan/KnowledgeRescanWorkflowPlan.ts:55`: rescan cleanup uses `dataRoot`.
- `Alembic/lib/service/cleanup/CleanupService.ts:146`: `coverage_ledger` and `deep_mining_rounds` are in `ALL_DATA_TABLES` at the accepted repair commit.
- Sibling data root stat output stayed unchanged before/after final reset: `13b22158 1781285169 160`, `ecf32806 1781184437 160`, `278cdc6c 1781187151 160`.

## DB Evidence

Before the final qwen-fixed reset, the previous diagnostic run had measurable state to clear: `coverage_ledger=30`, `deep_mining_rounds=2`, max round `2`.

After qwen-fixed full reset and before deepMining:

- `coverage_ledger=0`.
- `deep_mining_rounds=0`.
- `knowledge_entries=6`, `recipe_source_refs=8`, `semantic_memories=11`.

After qwen-fixed in-process deepMining:

- `coverage_ledger=50`; `15` rows have fresh `last_round` evidence after reset.
- `deep_mining_rounds=2`, max round `2`.
- Round rows: round 1 produced `3` new recipes; round 2 produced `0` and stopped at `diminishing-returns`.
- `knowledge_entries=9`, `recipe_source_refs=13`, `semantic_memories=0`.

## Jobs And Raw Evidence

- Bootstrap/full reset: `bootstrap_mqx0682k_15fb7edc`, classification `pass`, duration `188567` ms, raw `Test/tmp/p6-bilidili-deep-mining-realtest-rerun-after-full-reset-repair-t1-qwen-fixed-bootstrap-reset.json`.
- DeepMining: `rescan_mqx0clkl_7f1b2743`, status `completed`, stopReason `diminishing-returns`, raw `Test/tmp/p6-bilidili-deep-mining-realtest-rerun-after-full-reset-repair-t1-qwen-fixed-deepmining.json`.
- DeepMining event summary: workflow `3`, checkpoint `4`, artifact `1`, summary `1`.

## Parity Diff Report

No host-agent execution was run in this Test dispatch. The observed executor is the in-process daemon route (round rows show `daemon-job-runner`). The parity diff is therefore explicitly attributed as unexercised host execution vs observed in-process multi-round execution.

This is non-blocking for this assigned repair rerun because the task card permits precisely attributed, non-blocking parity diffs, and the boundary question is whether the post-repair full reset lets the following in-process deepMining open/close fresh rounds. Controller should dispatch a separate host-agent parity package only if it wants fresh host-run evidence before accepting P6 globally.

## Final Recommendation

Controller review can treat this as fresh P6 in-process real-test evidence: reset cleanup is repaired for the real BiliDili data root, stale measured state is cleared, and the next in-process deepMining run advances fresh rounds and coverage. Do not infer host parity or later phase completion from this result.
