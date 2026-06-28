# P10 BiliDili project-index workflow REAL-TEST rerun after repairs

Date: 2026-06-28
Window: Test
Task: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1`
Dispatch group: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-p1`
Status: blocked

## Question

Does the repaired P10 `runProjectIndexWorkflow(mode)` implementation now pass the real BiliDili dual-host gate: host `coverageLedgerSeed` visibility, no stale open deep-mining rounds after failure/retry, explicit seed constraints, and normalized host vs in-process `coverage_ledger` parity?

## Boundary

- Real project: `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`
- Data root: `/Users/gaoxuefeng/.asd/workspaces/02a25032`
- Daemon after restart: `http://127.0.0.1:56380`
- No product source, provider config, versions, release assets, frozen strings, or BiliDili business code were edited.
- BiliDili, Alembic, AlembicPlugin, and AlembicCore worktrees were clean after the run.

## Code and runtime baseline

- Alembic HEAD matched task pin: `1a07b0f89044855913ac4cb4fb5d9172915990b4`.
- AlembicPlugin HEAD matched task pin: `f7fe95e422eb155f04a38ff5602318be71ffef8a`.
- AlembicCore HEAD matched task pin: `99a7cf10d82056cd860eb0a1d9544662e3735b08`.
- `npm run build` passed in both Alembic and AlembicPlugin before runtime execution.
- R-2 source proof remained true:
  - full host cleanup uses dataRoot;
  - full in-process cleanup uses projectRoot;
  - incremental cleanup uses dataRoot.
- Repair source proof was present:
  - Plugin clean output source includes `coverageLedgerSeed`;
  - Plugin host rescan source attaches top-level and `data.meta` seed metadata;
  - Alembic deep-mining round gate has fail-close logic;
  - Alembic plan gate reads explicit module/dimension/scale constraints.

Provider evidence:

- Restart evidence showed generation provider `deepseek` / `deepseek-v4-pro` from the target project settings.
- The public settings summary did not expose an embedding provider/model, but recipe submission freshness output reported vector sync available with `embed-provider-ready`.

## Host-agent path

Host `alembic_bootstrap(rebuild:true)` passed the full path gate:

- `toolName=alembic_bootstrap`
- `planGate.status=ready`
- `cleanupPolicy=full-reset`
- cleanup archive under dataRoot: `.asd/.trash/2026-06-28T03-02-02-434Z/`
- 3 architecture recipes were submitted and `alembic_dimension_complete` succeeded with `recipesBound=3`, quality score 92.

Host `alembic_rescan` did not pass the repaired incremental gate:

- `toolName=alembic_rescan`
- `planGate.status=ready`
- `cleanupPolicy=rescan-clean`
- `moduleScope=["BiliDili"]`
- full briefing copied to `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/host-rescan-full-briefing.json`
- `coverageLedgerSeed` was absent from the full briefing (`rg coverageLedgerSeed` produced 0 bytes).
- Briefing summary showed `data.meta=null` and `coverageLedgerSeed=null`.
- DB snapshot after host rescan had 27 `coverage_ledger` rows, 3 `deep_mining_rounds` rows, and one open host-agent rescan round.
- Host rescan opened an active production session. A normal one-recipe gap-fill was submitted, but `alembic_dimension_complete` failed with `DIMENSION_CANDIDATE_COUNT_INSUFFICIENT`; retry with `noPadding=true` failed with the same reason. This means the one-budget P10 rescan seed could not be closed through the public workflow contract.

## In-process path

After the host rescan session remained active, in-process rerun could not establish the required full/incremental chain:

- In-process bootstrap job `bootstrap_mqx7molg_48f81c14` failed with a bootstrap-session lease error caused by the active host session.
- In-process rescan job `rescan_mqx7ruie_4e3b1ff6` used explicit constraints:
  - `dimensions=["architecture"]`
  - `moduleScope=["BiliDili"]`
  - `maxFiles=4`
  - `contentMaxLines=40`
  - `maxRounds=1`
  - `minNewRecipes=1`
  - `scaleCap=1`
- That rescan failed before round execution: `DeepMining request constraints removed all module×dimension targets.`
- Final DB snapshot after the failed attempts had 0 `coverage_ledger` rows, 0 `deep_mining_rounds` rows, and no open rounds.

This proves the stale-open-round repair did not regress in the final failed state, but the P10 in-process success gates were not reached.

## Parity

Parity is failed / not comparable:

- Host snapshot after rescan: 27 `coverage_ledger` rows.
- Final snapshot after in-process failures: 0 `coverage_ledger` rows.
- `parity-diff.json` reports `diffEmpty=false`.

Because host seed output was absent and in-process bootstrap/rescan did not complete, no valid normalized parity success can be claimed.

## Classification

Blocked, not accepted.

Primary failing stages:

1. Host incremental output contract: `coverageLedgerSeed` still absent from clean/full briefing evidence.
2. Host rescan session/close contract: one-budget rescan session could not be completed even with `noPadding`, leaving a workflow session that blocked in-process bootstrap.
3. In-process explicit constraint path: scoped `moduleScope=["BiliDili"]` removed all module×dimension targets before deep-mining round execution.
4. Parity: no comparable host/in-process `coverage_ledger` snapshots; observed row counts were 27 vs 0.

Recommended next action: route rework to the owning source windows. Do not manually repair the BiliDili DB as a Test action.

## Evidence files

- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/restart.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/environment-after-restart.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/host-bootstrap-full-briefing.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/host-rescan-full-briefing.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/host-rescan-briefing-summary.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/host-rescan-coverage-ledger-seed-rg.txt`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/host-after-rescan-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/inprocess-failed-bootstrap-status.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/inprocess-failed-rescan-status.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/after-inprocess-failures-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/final-after-blocked-rerun-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/parity-diff.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/provider-settings-summary.json`
