# R1 Final Non-empty ProjectMap Parity Real Test Report

## Scope

- Window: Test
- Task id: `r1-final-nonempty-projectmap-parity-realtest-t1`
- Dispatch group: `r1-final-nonempty-projectmap-parity-realtest-p1`
- State root: `.wakeflow-active/current/alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28`

This Test run covered the final R-1 gate assigned to Test: non-empty
ProjectMap host-vs-in-process canonical coverage module-id parity, plus a
BiliDili no-regression smoke. It did not edit product source, push, release,
bump versions, relax gates, or reset real BiliDili data.

## Repository Coordinates

- Alembic: `6db9b0274f79cb4a73f4e4cc6e55baaa648f6ba0`
- AlembicCore: `cf5317efbef3f9e80cd3bd4c516272acdcf9923a`
- AlembicPlugin: `4a47538229bef7d93bac31256ae7ce32bc5b5b77`
- BiliDili: `8487b82e7f3ceae7f35fcb19c6a5985022287422`

`npm run build` passed in AlembicCore, Alembic, and AlembicPlugin before the
runtime probes. Alembic `dev:link` also rebuilt AlembicCore, AlembicAgent,
Alembic, and Dashboard assets successfully during the BiliDili restart.

## Non-empty ProjectMap Parity

Evidence:

- `Test/tmp/r1-final-nonempty-projectmap-parity-realtest-t1/evidence/nonempty-projectmap-parity.json`
- `Test/tmp/r1-final-nonempty-projectmap-parity-realtest-t1/evidence/nonempty-projectmap-parity-summary.md`
- Script: `Test/tmp/r1-final-nonempty-projectmap-parity-realtest-t1/scripts/nonempty-projectmap-parity.mjs`
- Fixture: `Test/tmp/r1-final-nonempty-projectmap-parity-realtest-t1/nonempty-projectmap-fixture`

The fixture used a non-empty ProjectMap with two real TypeScript source modules
(`Auth` and `Billing`) plus an aggregate root module. The probe used dist entry
points, not source-only helpers:

- In-process: `Alembic/dist/lib/workflows/project-context/ProjectMapModules.js`
- Host rescan: `AlembicPlugin/dist/lib/recipe-generation/host-agent-workflows/knowledge-rescan.js`
- Host dimension-completion writer path:
  `AlembicPlugin/dist/lib/recipe-generation/host-agent-workflows/dimension-completion.js`

Observed module-id sets:

- Expected: `["target:Auth:src/auth","target:Billing:src/billing"]`
- In-process: `["target:Auth:src/auth","target:Billing:src/billing"]`
- Host rescan: `["target:Auth:src/auth","target:Billing:src/billing"]`
- Host dimension-completion upserts:
  `["target:Auth:src/auth","target:Billing:src/billing"]`

Result: PASS. All observed diffs were empty:

- expected vs in-process: `diff=[]`
- expected vs host rescan: `diff=[]`
- in-process vs host rescan: `diff=[]`
- in-process vs dimension-completion: `diff=[]`

The aggregate/root module did not appear in any final coverage module-id set.

## BiliDili No-regression Smoke

Evidence:

- Restart with rebuilt runtime but missing Test-mode:
  `Test/tmp/r1-final-nonempty-projectmap-parity-realtest-t1/logs/restart-alembic-bilidili.json`
- Environment check showing Test-mode disabled:
  `Test/tmp/r1-final-nonempty-projectmap-parity-realtest-t1/evidence/environment-verify-bilidili-after-restart.json`
- Restart with explicit Test-mode:
  `Test/tmp/r1-final-nonempty-projectmap-parity-realtest-t1/logs/restart-alembic-bilidili-test-mode.json`
- Ready check:
  `Test/tmp/r1-final-nonempty-projectmap-parity-realtest-t1/evidence/environment-verify-bilidili-test-mode.json`
- Provider split:
  `Test/tmp/r1-final-nonempty-projectmap-parity-realtest-t1/evidence/provider-split-redacted-bilidili-r1-final.json`
- Job:
  `Test/tmp/r1-final-nonempty-projectmap-parity-realtest-t1/evidence/deepmining-bilidili-r1-final-job-run.json`
- DB before/after and delta:
  `before-deepmining-bilidili-r1-final-db-snapshot.json`
  `after-deepmining-bilidili-r1-final-db-snapshot.json`
  `deepmining-bilidili-r1-final-delta.json`
- Coverage before/after:
  `before-deepmining-bilidili-r1-final-coverage.json`
  `after-deepmining-bilidili-r1-final-coverage.json`
- Retained job files/logs:
  `deepmining-bilidili-r1-final-files-manifest.json`

Runtime identity:

- Dashboard/API: `http://127.0.0.1:50907`
- Data root: `/Users/gaoxuefeng/.asd/workspaces/02a25032`
- Test-mode: enabled
- Test dimensions: bootstrap `architecture`, rescan `architecture`
- Provider split: DeepSeek generation settings present
  (`deepseek-v4-pro`, key present and redacted) and Ollama
  `qwen3-embedding:0.6b` local-first embedding.

Smoke command:

```bash
POST /api/v1/jobs/rescan
{
  "reason": "r1-final-nonempty-projectmap-parity-realtest-t1",
  "generationStage": "deepMining",
  "miningMode": "deepMining",
  "dimensions": ["architecture"],
  "maxFiles": 8,
  "contentMaxLines": 60,
  "maxRounds": 3,
  "minNewRecipes": 1,
  "scaleCap": 10
}
```

Job `rescan_mqyd7mpa_0e00e94b` completed. Result highlights:

- `coverageLedgerSeed.status=written`
- `coverageLedgerSeed.targetScopedCells=20`
- `coverageLedgerSeed.usableCells=20`
- `coverageLedgerSeed.aggregateOrRootModuleIds=[]`
- `coverageLedgerSeed.measuredCells=1`
- Job stop reason: `diminishing-returns`
- SQLite delta: `coverage_ledger +4`, `token_usage +1`, `sessions +0`
- Final coverage summary: 1 covered row, 15 thin rows, 4 empty rows,
  positive coverage rows = 1, non-empty ref rows = 1.

This is a no-destructive-reset BiliDili no-regression smoke on existing state.
The terminal job did not retain LLM IO events; the display snapshot records
`evidence.llm_io_missing` as a warning. That warning does not change the
coverage-seed smoke result, but it means this run should not be cited as a fresh
full DeepSeek generation loop.

## Boundary And Cleanliness

- No destructive reset was run. The R-2 destructive characterization path was
  therefore not needed.
- No source repository was edited by Test.
- Product repo status after run:
  `Test/tmp/r1-final-nonempty-projectmap-parity-realtest-t1/evidence/repo-status-after-run.txt`
  shows Alembic, AlembicCore, AlembicPlugin, and BiliDili clean. The workspace
  still contains unrelated pre-existing untracked Design/ledger files.

## Verdict

PASS for the assigned Test gate:

- Non-empty ProjectMap in-process vs host rescan canonical coverage module-id
  parity is true set equality with `diff=[]`.
- The host dimension-completion writer path also produced the same target-scoped
  module-id set on the non-empty fixture.
- BiliDili no-regression smoke completed on rebuilt runtime with Test-mode
  enabled and preserved provider split; coverage ledger seed remained
  target-scoped and aggregate/root-free.

Residual risk for controller review: the BiliDili smoke was not a full fresh
generation rerun because existing state stopped at diminishing returns and no
LLM IO was retained for the terminal job.
