# P10 BiliDili REAL-TEST rerun after source repairs

Date: 2026-06-28
Window: Test
Task: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1`
Dispatch group: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-p1`

## Result

Blocked. The P10 real-test gate does not pass after the accepted source repairs.

This was not a pin, provider, daemon-start, or R-2 identity failure. The run used
the required source pins:

- Alembic `2475fe7f72b10da02f306358febcfa00b90ea7b7`
- AlembicPlugin `2f5af00b61593075802ce2a4db893f7c96d9930f`
- AlembicCore `99a7cf10d82056cd860eb0a1d9544662e3735b08`

BiliDili test-mode daemon was restarted after rebuilding Alembic and
AlembicPlugin, and resolved to:

- Dashboard/API: `http://127.0.0.1:57778`
- projectRoot: `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`
- dataRoot: `/Users/gaoxuefeng/.asd/workspaces/02a25032`
- generation provider: `deepseek / deepseek-v4-pro`
- embedding provider: local Ollama, `qwen3-embedding:0.6b`, local-first

No product source, provider config, version, release asset, frozen name, or
unrelated data root was edited. BiliDili, Alembic, AlembicPlugin, and
AlembicCore git status checks were clean after the run.

## What Ran

1. Rebuilt Alembic and AlembicPlugin from the accepted source pins.
2. Restarted the BiliDili daemon in test mode with architecture-only bootstrap
   and rescan dimensions.
3. Captured baseline R-2/source/provider/session/DB proof.
4. Ran host MCP planning:
   - `alembic_plan draft` for coldStart architecture.
   - `alembic_plan confirm` for architecture, root module binding, budget
     `totalRecipeBudget=3`, `maxFiles=4`, `contentMaxLines=40`.
5. Attempted host `alembic_bootstrap(rebuild:true)` twice.
6. Exercised the public terminal `alembic_dimension_complete(noPadding:true)`
   cleanup path twice:
   - once without explicit submitted recipe ids;
   - once with the recovered one session-bound architecture recipe id.
7. Ran Dashboard/API in-process bootstrap and rescan using the required explicit
   rescan constraints:
   - `dimensions=["architecture"]`
   - `generationStage="deepMining"`
   - `moduleScope=["BiliDili"]`
   - `maxRounds=1`
   - `minNewRecipes=1`
   - `scaleCap=1`
8. Captured final DB/session snapshots and parity JSON.

Dashboard UI was not opened because this task's evidence question was API/DB/log
state, not visible UI rendering.

## Findings

Host bootstrap did not reach the seed visibility gate. `alembic_bootstrap`
refused with `BOOTSTRAP_IN_PROGRESS` because a pre-existing active host-agent
session for BiliDili remained. This was the prior P10 blocker shape; Test did not
manually delete the session or edit the DB.

The repaired public terminal noPadding route preserved the candidate-count
failure semantics (`DIMENSION_CANDIDATE_COUNT_INSUFFICIENT`), but it did not
release the matching active host-agent session in this real route. Post-call
snapshots still showed active session count `1`, matchingProjectCount `1`. There
were no open `deep_mining_rounds` rows to close at the time of this probe, so the
remaining blocker is the active session lease.

The in-process path also failed. Bootstrap failed on the same active-session
lease. The explicit deepMining rescan request did reach the Alembic plan gate
with `moduleScope=["BiliDili"]`, but still failed with "request constraints
removed all module×dimension targets". The new diagnostic listed
`availableModuleAliases`, but the root/BiliDili alias was still absent from the
real selected module aliases.

Because both host and in-process sides failed before producing non-empty
`coverage_ledger` rows, parity is not comparable. The parity evidence records:

- host rows: `0`
- in-process rows: `0`
- comparable: `false`
- `diffEmpty=false`

## Evidence

Raw/local evidence:

- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/restart.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/before-host-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/after-nopadding-cleanup-probe-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/after-nopadding-cleanup-with-recipe-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/host-mcp-summary.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/inprocess-rerun-evidence.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/inprocess-bootstrap-status.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/inprocess-bootstrap-events.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/inprocess-rescan-status.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/inprocess-rescan-events.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/final-blocked-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/parity-diff.json`

State-root evidence:

- `evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1-report.md`
- `evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1-summary.json`

## Classification

Blocked, source repair still required.

Recommended owner split:

- AlembicPlugin: terminal noPadding completion keeps the candidate-count failure
  response but does not release the matching active host-agent session in the
  real route, so host `alembic_bootstrap(rebuild:true)` remains blocked before
  the `coverageLedgerSeed` gate can be retested.
- Alembic: deepMining `moduleScope=["BiliDili"]` still removes all real
  module×dimension targets. The new diagnostics appear, but the real
  `availableModuleAliases` set still lacks a root/BiliDili alias.

Forbidden conclusions:

- Do not accept P10 REAL-TEST, G4, G6, P11, P12, P13, or the whole demand.
- Do not claim host `coverageLedgerSeed` visibility was repaired in the real
  route; the host rescan gate was not reached.
- Do not claim parity from `0 vs 0`; the parity file explicitly marks the
  comparison invalid.
- Do not classify this as a Test environment-only blocker.
