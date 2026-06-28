# P10 BiliDili Project-Index Workflow Unify REAL-TEST

Task: `p10-bilidili-project-index-workflow-unify-realtest-t1`
Window: `Test`
Date: 2026-06-28

## Result

Blocked. P10 did verify the new `runProjectIndexWorkflow(mode)` entrypoints
and several required real BiliDili behaviors, but the strict success predicate
did not pass.

Passed evidence:

- Alembic and AlembicPlugin builds succeeded after refreshing ignored `dist/`.
- Code points matched the dispatch card:
  - Alembic `aa7aeb9605f7b3f9a5a0584d1a40b06d095c1813`
  - AlembicPlugin `95bf4578ec3e2b9d19db8c548b8bfd6a98814b8e`
  - AlembicCore `99a7cf10d82056cd860eb0a1d9544662e3735b08`
- R-2 source guard checked:
  - host-agent full cleanup root is `input.dataRoot`
  - in-process full cleanup root is `input.projectRoot`
  - incremental cleanup root is `input.dataRoot`
- Host `alembic_bootstrap` returned `planGate.status=ready`,
  `toolName=alembic_bootstrap`, `cleanupPolicy=full-reset`, completed the
  `architecture` session, and bound 3 grounded recipes.
- Host `alembic_rescan` returned `planGate.status=ready`,
  `toolName=alembic_rescan`, and `cleanupPolicy=rescan-clean`.
- In-process daemon bootstrap job `bootstrap_mqx5jfor_86020719` completed.
- After cancelling this Test window's stuck bootstrap job, a fresh in-process
  daemon rescan `rescan_mqx66280_bc324a79` completed and returned advisor
  stopReason `diminishing-returns`.

Failed gates:

- Host incremental output/full briefing did not expose
  `meta.coverageLedgerSeed`; only `coverageAdvisory` and DB state were visible.
- Fresh in-process rescan completed with `deepMining.rounds=[]`; the SQLite
  `deep_mining_rounds` table still had the earlier failed P10 row with
  `completed_at=null`.
- Normalized host/in-process incremental parity could not be claimed:
  `coverage_ledger` had 8 rows after host rescan and 20 rows after the
  in-process rerun.

## Runtime And Providers

The real BiliDili Alembic daemon was restarted in test mode:

- URL: `http://127.0.0.1:54853`
- PID: `61505`
- Data root: `/Users/gaoxuefeng/.asd/workspaces/02a25032`
- Test mode dimensions: `architecture`
- Generation provider preserved: `deepseek`, model `deepseek-v4-pro`
- Embedding provider preserved:
  `ALEMBIC_EMBED_PROVIDER=ollama`,
  `ALEMBIC_EMBED_MODEL=qwen3-embedding:0.6b`,
  `ALEMBIC_EMBED_BASE_URL=http://127.0.0.1:11434/v1`

`verify-test-environment.mjs` returned `ok=true`, `verdict=ready`, and
`processAlive=true`.

All four working trees were clean after the run:

- BiliDili
- Alembic
- AlembicPlugin
- AlembicCore

## Entry Point Evidence

Alembic in-process:

- `Alembic/lib/workflows/project-index/ProjectIndexWorkflow.ts`
- `runProjectIndexWorkflow(ctx, args, { mode })` dispatches `full` to
  `ColdStartWorkflow` and `incremental` to `KnowledgeRescanWorkflow`.
- Logs include `[ProjectIndexWorkflow] Dispatching project-index workflow` with
  `mode=incremental` for the daemon rescan path.

AlembicPlugin host-agent:

- `AlembicPlugin/lib/recipe-generation/host-agent-workflows/project-index.ts`
- `runProjectIndexWorkflow(ctx, args, { mode: "full" })` calls the host
  cold-start workflow.
- `runProjectIndexWorkflow(ctx, args, { mode: "incremental" })` calls the host
  knowledge-rescan workflow.

## Host Full Path

Sequence:

1. `alembic_plan draft` for `coldStart` returned BiliDili as a Swift package
   with 163 files and 10 modules.
2. `alembic_plan confirm` selected `architecture`, module binding `BiliDili`,
   budget 1, maxFiles 4, contentMaxLines 40.
3. `alembic_bootstrap({ rebuild: true })` succeeded:
   - `planGate.status=ready`
   - `toolName=alembic_bootstrap`
   - `cleanupPolicy=full-reset`
   - trash archive under dataRoot:
     `.asd/.trash/2026-06-28T02-22-02-844Z/`
   - session `bs-<redacted>`
4. Three grounded `architecture` recipes were submitted after evidence-gate
   correction:
   - `<redacted>`
   - `<redacted>`
   - `<redacted>`
5. `alembic_dimension_complete` succeeded:
   - `isBootstrapComplete=true`
   - `recipesBound=3`
   - quality score `90`

## Host Incremental Path

Sequence:

1. `alembic_plan draft` for `deepMining` returned the same BiliDili project
   profile.
2. `alembic_plan confirm` selected `architecture`, module binding `BiliDili`,
   budget 1, maxFiles 4, contentMaxLines 40.
3. `alembic_rescan` succeeded:
   - `planGate.status=ready`
   - `toolName=alembic_rescan`
   - `cleanupPolicy=rescan-clean`
   - full briefing:
     `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/tmp/rescan-briefing-02a250323c6c6ade.json`

Blocker: `coverageLedgerSeed` was not present in the clean output or searchable
in the full briefing. This fails the P10 host incremental success condition that
`meta.coverageLedgerSeed` be present.

## In-Process Path

Initial P10 daemon run:

- Completed bootstrap: `bootstrap_mqx5jfor_86020719`
- Failed rescan: `rescan_mqx5pnr4_658ab696`
- Failure:
  `Bootstrap already in progress for project "/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili" with session "bs-<redacted>".`

Cleanup performed by this Test window:

- Cancelled stuck bootstrap `bootstrap_mqx5khm6_39598191`
- Cancellation reason:
  `p10 harness rescan lease cleanup after timeout`
- No running Alembic jobs remained afterward.

Recovery run:

- Fresh daemon rescan `rescan_mqx66280_bc324a79`
- Status: `completed`
- Request:
  `generationStage=deepMining`, `dimensions=["architecture"]`,
  `maxFiles=4`, `contentMaxLines=40`, `maxRounds=1`
- Result:
  - `deepMining.advisor.shouldStop=true`
  - `deepMining.stopReason=diminishing-returns`
  - `deepMining.rounds=[]`

This proves the session blocker was recoverable, but it does not satisfy the
strict P10 requirement for fresh `deep_mining_rounds` progress and closure.

## Database Evidence

After host rescan:

- `coverage_ledger`: 8 rows
- `deep_mining_rounds`: 1 row
- open rounds: 1
- raw evidence:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/db-after-host-rescan.json`

After in-process rescan recovery:

- `coverage_ledger`: 20 rows
- `deep_mining_rounds`: 1 row
- open rounds: 1
- the only round row remained:
  - `rescan_id=rescan_mqx5pnr4_658ab696:deepMining:1`
  - `completed_at=null`
- raw evidence:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/db-after-inprocess-rescan.json`

The row-count change from 8 to 20 means the P10 normalized incremental parity
predicate is not met. Since the host response also omitted a visible
`coverageLedgerSeed`, there is no reliable same-seed host/in-process comparison
set for this P10 run.

## Raw Evidence

- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/completed-inprocess-bootstrap-status.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/failed-rescan-status.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/cancelled-bootstrap-status.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/completed-inprocess-rescan-full.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/completed-inprocess-rescan-events.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/db-after-host-rescan.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/db-after-inprocess-rescan.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/inprocess-rescan-after-host-release.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/run-inprocess-workflow-evidence.mjs`

## Recommendation

Return to controller as blocked for source repair. Candidate repair areas:

- Ensure host `alembic_rescan` exposes `meta.coverageLedgerSeed` in the public
  response/full briefing when the workflow writes or derives coverage seed data.
- Ensure no-action or diminishing-returns deepMining paths open and close
  `deep_mining_rounds` consistently, or explicitly document why no DB round is
  expected and update the P10 predicate.
- Restore a comparable normalized parity seed between host and in-process
  incremental workflows before claiming `diff=[]`.
