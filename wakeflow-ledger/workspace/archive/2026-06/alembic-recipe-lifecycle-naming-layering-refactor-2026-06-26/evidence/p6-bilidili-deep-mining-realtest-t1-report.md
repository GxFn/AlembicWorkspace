# P6 BiliDili DeepMining Real-Test

Task: `p6-bilidili-deep-mining-realtest-t1`
State root: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`
Observed at: `2026-06-27T22:57:05Z`
Result: **BLOCKED / not green**

## Scope

This Test task ran only the P6 real-scenario verification for the accepted Alembic commit `80fa6a5b518847138fbe79acc4e26e551ba356a6`. It did not edit BiliDili source, Alembic product source, vendor pins, versions, release files, or thread registries.

The Dashboard/API used for the final run was `http://127.0.0.1:50673`, with BiliDili data root `/Users/gaoxuefeng/.asd/workspaces/02a25032` and DB `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/alembic.db`.

Dashboard UI evidence was not opened because no Browser control tool was available after tool discovery; this report uses direct API, SQLite, log, and raw JSON evidence.

## Environment

- Alembic HEAD: `80fa6a5b518847138fbe79acc4e26e551ba356a6`
- AlembicCore HEAD: `8e71bbd500992c625b1696f3b04f0f2fa8273608`
- AlembicPlugin HEAD: `384338921d16a937852216849554ae352018a565`
- AlembicAgent HEAD: `99b8b33a591b0199f47cb8fc40bc939fe4a4dee5`
- BiliDili HEAD: `6f1bf34cf1b6daca4e08895db211939115dac868`
- Test mode: enabled, `bootstrapDims=["architecture"]`, `rescanDims=["architecture"]`
- Author generation: DeepSeek `deepseek-v4-pro`
- Embedding: local Qwen `qwen3-embedding:0.6b` through `http://127.0.0.1:11434`
- BiliDili git status: clean except repository is `main...origin/main [ahead 1]`

## R-2 Safety

Before the destructive reset attempt, Test rechecked the R-2 source guard:

- `Alembic/vendor/AlembicCore/src/workflows/cold-start/ColdStartPlan.ts:77-80` keeps in-process full-reset cleanup under `projectRoot`; only `executor='host-agent'` uses `dataRoot`.
- `Alembic/vendor/AlembicCore/src/workflows/knowledge-rescan/KnowledgeRescanWorkflowPlan.ts:55-58` keeps incremental cleanup under `dataRoot`.

The reset used the documented Test bootstrap probe, targeted only the BiliDili daemon URL/dataRoot, and did not use manual SQL deletion. Filesystem stat snapshots for sibling workspace data roots `13b22158`, `ecf32806`, and `278cdc6c` had unchanged mtimes before and after the reset snapshot.

## Commands And Raw Evidence

- `node Test/scripts/verify-test-environment.mjs --url http://127.0.0.1:50673 --json`: ready, healthy, test-mode enabled.
- Initial P6 deepMining POST: raw evidence `Test/tmp/p6-bilidili-deep-mining-realtest-t1-run.json`.
- Documented bootstrap reset: `node Test/scripts/probe-cold-start-process-timeline.mjs --project BiliDili --url http://127.0.0.1:50673 --data-root /Users/gaoxuefeng/.asd/workspaces/02a25032 --max-files 8 --content-max-lines 60 --timeout-ms 600000 --poll-ms 2500 --output Test/tmp/p6-bilidili-deep-mining-realtest-t1-bootstrap-reset.json`.
- Post-reset P6 deepMining POST: raw evidence `Test/tmp/p6-bilidili-deep-mining-realtest-t1-after-bootstrap-run.json`.
- Summary evidence: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p6-bilidili-deep-mining-realtest-t1-summary.json`.

## Observations

Initial deepMining job `rescan_mqwycq52_0e7e37ac` completed, but `deepMining.rounds=[]`, `stopReason="diminishing-returns"`, and DB max `deep_mining_rounds.round_index` stayed `1`.

The documented bootstrap reset job `bootstrap_mqwydoh2_c36cfae3` passed after 293243 ms and ran real DeepSeek generation. It rebuilt recipe state (`knowledge_entries=9`, `recipe_source_refs=27`) but did **not** clear prior measured coverage cells or the prior deep mining round:

```json
{
  "coverageRows": 56,
  "coverageNonEmpty": 15,
  "roundRows": 1,
  "maxRound": 1
}
```

The post-reset deepMining job `rescan_mqwyll2m_466afc4e` also completed immediately after plan gate:

```json
{
  "stopReason": "diminishing-returns",
  "apiRoundCount": 0,
  "coverageNonEmptyCells": 15,
  "preMaxRound": 1,
  "postMaxRound": 1,
  "roundsAdvanced": false
}
```

The daemon log confirms the sequence: job enqueued, plan gate completed, then daemon job completed without a `deep-mining` checkpoint/opened round.

## Gate Result

- Coverage ledger non-empty: present, but not freshly proven by this P6 run. The 15 non-empty cells remained from prior `last_round=1` state.
- Advisor stopReason: passed. Both P6 jobs returned `diminishing-returns`.
- DeepMining round advancement/open-close: failed. No new API round was reported and no DB round was opened or closed after P6.

## Conclusion

P6 real-test is **blocked**, not accepted. The accepted P6 code path runs and returns an advisor stopReason, but the assigned Test question requires a new in-process `deep_mining_rounds` open/close advance. That did not happen, even after the documented bootstrap rebuild flow.

Recommended next step: controller should route an owning-repository repair or design decision for reset semantics/advisor precondition. Test should not force success by manual deletion of `deep_mining_rounds`.
