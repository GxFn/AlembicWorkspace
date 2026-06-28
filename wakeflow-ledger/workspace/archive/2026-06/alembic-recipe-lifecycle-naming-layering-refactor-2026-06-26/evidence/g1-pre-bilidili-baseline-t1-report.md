# G1 PRE BiliDili Baseline

Task: `g1-pre-bilidili-baseline-t1`
State root: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`
Observed at: `2026-06-27T20:46:17Z`

## Identity And Scope

- Current window: `Test`
- Responsibility root: `Test`
- Assigned package: `g1-pre-bilidili-baseline-p1`
- Target project: `BiliDili`
- Project root: `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`
- Data root: `/Users/gaoxuefeng/.asd/workspaces/02a25032`
- DB: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/alembic.db`
- Dashboard/API: `http://127.0.0.1:62093`

This task did not edit product source, start a new bootstrap/rescan, reset any workspace, push, tag, release, bump versions, or touch vendor gitlinks. It performed read-only local config, git, API, log, and SQLite checks, then wrote this evidence under the assigned state root.

## Runtime Baseline

- Node: `v22.22.1`
- Alembic HEAD: `47889f9`
- AlembicCore HEAD: `934d043`
- AlembicPlugin HEAD: `9931596`
- AlembicAgent HEAD: `99b8b33`
- BiliDili HEAD: `6f1bf34`
- BiliDili git status: clean (`git status --short` produced no output)

`projects.json` maps `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili` to workspace id `02a25032`. The daemon record maps the same project to data root `/Users/gaoxuefeng/.asd/workspaces/02a25032`, URL `http://127.0.0.1:62093`, and pid `36889`.

## Provider Mapping

- Author generation: `deepseek`, model `deepseek-v4-pro`, from `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/settings.json`
- Embedding/vector: local Qwen via `http://127.0.0.1:11434`, model `qwen3-embedding:0.6b`, lane `local-first`, from `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/config.json`
- Secret audit: inspected only top-level keys in `secrets.json` (`ai`, `updatedAt`, `version`); no secret values were printed or copied.

## Environment

`node Test/scripts/verify-test-environment.mjs --project BiliDili --json` returned `ok=true`, `verdict=ready`, daemon alive, health `healthy`, test mode enabled with `bootstrapDims=["architecture"]` and `rescanDims=["architecture"]`.

Direct API snapshots also returned healthy status and test-mode enabled. Latest compact job refs were BiliDili-only, with `projectRoot` and `dataRoot` under `/Users/gaoxuefeng/.asd/workspaces/02a25032`.

## PRE Baseline SQL

The §12.3.0 baseline SQL against the BiliDili DB returned:

```json
[
  {"k":"cov","n":19,"nonempty":15},
  {"k":"rounds","n":1,"nonempty":1},
  {"k":"recipes","n":12,"nonempty":0},
  {"k":"refs","n":15,"nonempty":0},
  {"k":"props","n":0,"nonempty":0},
  {"k":"ckpt","n":0,"nonempty":0}
]
```

Additional breakdown:

- `coverage_ledger`: 4 `empty` cells, 15 `thin` cells, all `deferred=0`; 15 cells have `last_round=1`.
- `deep_mining_rounds`: one completed row, `round_index=1`, `trigger_actor=daemon-job-runner`, `new_recipes_this_round=2`.
- `knowledge_entries`: 12 rows, all `lifecycle=staging`.
- `recipe_source_refs`: 15 rows, all `status=active`.
- `semantic_memories`: 0 rows.
- `sessions`: 0 rows.
- `evolution_proposals`: 0 rows.
- `git_diff_checkpoints`: 0 rows.

## Chain Coverage

- Chain 1 plan: no new plan chain driven; DB baseline has no deferred coverage rows introduced by this task.
- Chain 2 fullIndex/coldStart: latest available BiliDili bootstrap snapshot captured as reference: `bootstrap_mqwrmf92_fa42d774`, status completed, snapshot `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/job-display-snapshots/bootstrap_mqwrmf92_fa42d774/snapshot.json`, checksum `9aa091a19c485bad5b95556021efdd2961bdce0dccf834288a146991ffd39620`.
- Chain 3 incrementalIndex/deepMining: existing DB baseline captured; latest available rescan snapshot captured as reference: `rescan_mqwrwdb1_0e96972d`, status completed, stage `deepMining`, snapshot `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/job-display-snapshots/rescan_mqwrwdb1_0e96972d/snapshot.json`, checksum `84c28bce9283dcac9e9cee29692dd58239be43e04b35d5e6a89eb1cf456ca7a5`.
- Chain 4 scopedIndex/moduleMining: no moduleMining job driven during this G1 task; current source-ref baseline is 15 active refs.
- Chain 5 dimensionComplete: coverage cell shape and zero active sessions captured; no dimensionComplete tool driven.
- Chain 6 evolution: proposals and checkpoints are zero. Latest sampled log signal was `[EvolutionMaintenanceSweep] periodic sweep completed` with `executedCount=0`, `promotedCount=0`, `decayScannedCount=0`, and no driver errors.

## Boundaries

This evidence is a PRE characterization baseline only. It does not accept P1-P15, does not prove post-refactor parity, does not prove G4 after-refactor coverage, and does not conclude realverify beyond the baseline rows captured here.
