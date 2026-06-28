# P10 BiliDili Seed Output No-Preclean Rerun After Alembic Repair

- Target window: Test
- Task id: p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1
- Dispatch group: p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-p1
- Generated: 2026-06-28T10:34:08Z
- Verdict: PASS for the assigned Test evidence package.

This report does not accept P10, G4, or G6. It records Test evidence for controller review only.

## Boundary

- Real project: BiliDili at `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`.
- Real Alembic data root: `/Users/gaoxuefeng/.asd/workspaces/02a25032`.
- No sandbox copy was used.
- No manual SQLite edits were made.
- No Alembic, AlembicCore, AlembicPlugin, BiliDili, or Test source files were edited.
- BiliDili was restarted with `--no-preclean`; the restart JSON reports `preclean.skipped=true` and `devLink.skipped=true`.
- Provider routing remained DeepSeek generation plus local Ollama/Qwen embeddings.

## Loaded Revisions

- Alembic: `ffc9ec73f2e914527e12ecd97b0edbc99a2ed47a`
- AlembicCore: `99a7cf10d82056cd860eb0a1d9544662e3735b08`
- AlembicPlugin: `aee228be0082e8ddb1d4494df07e0ffedc6ea292`
- BiliDili: `6f1bf34cf1b6daca4e08895db211939115dac868`
- Test: `5175a1ff674fdaa5fc14f0410f38a09e1f575660`

Pre-build baseline showed the seed-output repair in Alembic source but not in dist. I rebuilt Alembic with `npm run build`; dist then contained `coverageLedgerSeed`, `aggregateOrRootModuleIds`, `targetScopedCells`, `measuredCells`, `usableCells`, and the `DeepMining coverage ledger seed retained` marker. Alembic source status for this task remained clean after the build.

## Restart And Baseline

Command:

```sh
env ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture ALEMBIC_TEST_RESCAN_DIMS=architecture node Test/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --no-dev-link --no-preclean
```

Result:

- API/dashboard URL: `http://127.0.0.1:51536`
- Daemon pid: `3056`
- `verify-test-environment` returned ready for BiliDili.
- SQLite integrity was `ok`.
- Active ProjectContext sessions before the rescan: `0`.
- Open `deep_mining_rounds` before the rescan: `0`.
- Baseline coverage ledger rows: `15`, all target-scoped.
- Baseline measured rows: `2`.
- SQLite-derived seed before the rescan:

```json
{
  "aggregateOrRootModuleIds": [],
  "coveredPathCount": 32,
  "dimensionIds": ["architecture"],
  "measuredCells": 2,
  "moduleCount": 15,
  "status": "written",
  "targetScopedCells": 15,
  "usableCells": 15,
  "writtenCells": 15
}
```

## Public Rescan Route

The assigned host/public route was exercised through the daemon job API with this request body:

```json
{
  "contentMaxLines": 40,
  "dimensions": ["architecture"],
  "generationStage": "deepMining",
  "maxFiles": 4,
  "maxRounds": 1,
  "miningMode": "deepMining",
  "minNewRecipes": 1,
  "moduleScope": ["BiliDili"],
  "reason": "p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1",
  "scaleCap": 1
}
```

Result:

- Job id: `rescan_mqxndm32_10590d38`
- Job status: `completed`
- Created at: `2026-06-28T10:30:00.974Z`
- Completed at: `2026-06-28T10:30:07.807Z`
- Plan gate selected `Sources/Infrastructure/Networking` under the requested BiliDili module scope.

The job result exposed `coverageLedgerSeed` at both top level and under `deepMining.coverageLedgerSeed`. The retained event/developer-view surface also exposed the same seed. The event title was `DeepMining coverage ledger seed retained`, with summary `coverageLedgerSeed retained with 15 usable target-scoped cell(s) and 2 measured cell(s).`

The log surface also retained the seed in `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/logs/combined.log:1153`:

```json
{
  "coverageLedgerSeed": {
    "aggregateOrRootModuleIds": [],
    "coveredPathCount": 32,
    "dimensionIds": ["architecture"],
    "measuredCells": 2,
    "moduleCount": 15,
    "status": "written",
    "targetScopedCells": 15,
    "usableCells": 15,
    "writtenCells": 15
  },
  "jobId": "rescan_mqxndm32_10590d38",
  "message": "DeepMining coverage ledger seed retained",
  "stage": "deep-mining-coverage-ledger-seed"
}
```

## Seed Comparison

The following three seeds matched exactly:

- `job.result.coverageLedgerSeed`
- `job.result.deepMining.coverageLedgerSeed`
- SQLite-derived seed from `coverage_ledger`

Matched seed:

```json
{
  "aggregateOrRootModuleIds": [],
  "coveredPathCount": 32,
  "dimensionIds": ["architecture"],
  "measuredCells": 2,
  "moduleCount": 15,
  "status": "written",
  "targetScopedCells": 15,
  "usableCells": 15,
  "writtenCells": 15
}
```

Checks from the raw run JSON were all true:

- `dbIntegrityOk`
- `distSeedOutputRepairLoaded`
- `jobCompleted`
- `jobResultHasSeed`
- `eventSurfaceHasSeed`
- `resultAndDeepMiningSeedMatch`
- `seedCountsMatchSqlite`
- `seedStatusWrittenWhenMeasured`
- `targetScopedMeasuredCoverageExists`
- `beforeNoActiveBiliDiliSessions`
- `beforeNoOpenRounds`
- `noActiveBiliDiliSessions`
- `noOpenRounds`
- `providerDeepSeek`
- `providerLocalQwenEmbedding`

Seed paths found in retained host-observable surfaces:

- `$.events.developerViews[4].metadata.coverageLedgerSeed`
- `$.events.events[4].metadata.coverageLedgerSeed`
- `$.finalEventsResponse.data.data.developerViews[4].metadata.coverageLedgerSeed`
- `$.finalEventsResponse.data.data.events[4].metadata.coverageLedgerSeed`
- `$.finalJobResponse.data.data.job.result.coverageLedgerSeed`
- `$.finalJobResponse.data.data.job.result.deepMining.coverageLedgerSeed`
- `$.job.result.coverageLedgerSeed`
- `$.job.result.deepMining.coverageLedgerSeed`

## Final Cleanup Snapshot

A delayed final snapshot after the completed job still showed:

- SQLite integrity: `ok`
- Active ProjectContext sessions: `0`
- Matching BiliDili ProjectContext sessions: `0`
- Open `deep_mining_rounds`: `0`
- Coverage rows: `15`
- Target-scoped coverage rows: `15`
- Measured rows: `2`
- Aggregate/root module ids: `[]`
- Latest job `rescan_mqxndm32_10590d38`: `completed`

Provider snapshot:

- AI provider: `deepseek`
- AI model: `deepseek-v4-pro`
- Embedding provider: `local-ollama`
- Embedding model: `qwen3-embedding:0.6b`
- Embedding lane order: `local-first`

## Parity Predicate

The package's parity predicate is now eligible because the seed exists and its counts match SQLite. I did not run a broader parity pass in this Test task because this package assigned the seed-output no-preclean rerun and left P10/G4/G6 acceptance and next parity decisions to the controller.

## Residual Risks

- This completed-job route does not itself prove interrupted cancellation behavior; it preserves the prior cleanup requirement by checking sessions and open rounds before, after, and after a delay.
- This is Test evidence only. Controller review decides acceptance, redispatch, or parity follow-up.

## Raw Evidence

- `Test/tmp/p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1/baseline-pre-rebuild.json`
- `Test/tmp/p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1/post-build-pre-restart.json`
- `Test/tmp/p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1/restart-no-preclean.json`
- `Test/tmp/p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1/baseline-post-restart.json`
- `Test/tmp/p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1/host-rescan-after-seed-repair.json`
- `Test/tmp/p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1/final-after-wait.json`
- `Test/tmp/p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1/seed-output-evidence.mjs`
