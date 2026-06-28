# P10 Controller Review - BiliDili project-index workflow REAL-TEST

Date: 2026-06-28

Dispatch group: `p10-bilidili-project-index-workflow-unify-realtest-p1`
Target task: Test / `p10-bilidili-project-index-workflow-unify-realtest-t1`

## Verdict

Rework required. The Test result is a valid blocked result for the P10
REAL-TEST gate, but it is not a terminal environment blocker. The real BiliDili
runtime came up with the required DeepSeek generation and local Qwen/Qianwen
embedding providers, R-2 cleanup roots were checked, and both host-agent and
in-process entrypoints executed. The remaining failures are product/source
repair items inside the accepted P10 surface and must be fixed before rerunning
P10 REAL-TEST.

## Raw Evidence Reviewed

- Target result:
  `target-results/tr-p10-bilidili-project-index-workflow-unify-realtest-t1.json`
- Test report:
  `evidence/p10-bilidili-project-index-workflow-unify-realtest-t1-report.md`
- Test summary:
  `evidence/p10-bilidili-project-index-workflow-unify-realtest-t1-summary.json`
- Failed in-process rescan:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/failed-rescan-status.json`
- Cancelled stuck bootstrap:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/cancelled-bootstrap-status.json`
- Completed in-process recovery rescan:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/completed-inprocess-rescan-full.json`
- Host and in-process DB snapshots:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/db-after-host-rescan.json`
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-t1/db-after-inprocess-rescan.json`

## Acceptance Boundary

P10's test card requires:

- host `alembic_rescan` with `planGate.status='ready'`,
  `response.tool='alembic_rescan'`, and visible `meta.coverageLedgerSeed`;
- in-process incremental/deepMining through
  `runProjectIndexWorkflow(mode='incremental')`, with `deep_mining_rounds`
  progress/closure and advisor termination evidence;
- normalized host vs in-process incremental `coverage_ledger` parity diff
  equal to empty, except documented volatile round-driving fields.

Those are explicit P10 success conditions, not later P11-P13 scope. P10 cannot
be accepted from entrypoint connection or command completion alone.

## Controller Findings

The host-agent full path passed its assigned evidence gates:
`alembic_bootstrap` returned `planGate.status=ready`, stable tool name, full
cleanup under dataRoot, completed the architecture session, and bound 3 recipes.

The host incremental path executed and wrote coverage state, but the public
response/full briefing did not expose `meta.coverageLedgerSeed`. Source review
shows the Plugin host rescan workflow attaches `meta.coverageLedgerSeed` in
`AlembicPlugin/lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`,
while the MCP clean-output allowlist in
`AlembicPlugin/lib/runtime/mcp/core-tools/output.ts` includes
`coverageAdvisory` but not `coverageLedgerSeed`. This is an AlembicPlugin
response contract/output projection repair.

The first in-process deepMining rescan failed after opening a
`deep_mining_rounds` row because an active bootstrap session lease was still
present. Raw DB evidence shows that row remained open with `completed_at=null`.
Source review shows `Alembic/lib/daemon/DeepMiningRoundGate.ts` opens a round
before calling `runProjectIndexWorkflow(mode='incremental')`, but does not close
or mark the round if that call throws. This is an Alembic daemon round lifecycle
repair.

After Test cancelled the stuck bootstrap and reran in-process rescan, the job
completed with advisor `stopReason=diminishing-returns`, but
`deepMining.rounds=[]`. The DB still had the stale open failed row. This proves
the runtime can recover, but it does not satisfy P10's fresh round progress and
closure gate.

The parity gate failed. Host snapshot had 8 `coverage_ledger` rows after host
rescan; in-process recovery snapshot had 20 rows. The in-process job also
reported a broader `planSelectionProjection.executionDimensions` set than the
small architecture-bound evidence scenario. P10 therefore lacks a reliable
same-seed, same-module/dimension comparison and cannot claim `diff=[]`.

## Required Rework

1. AlembicPlugin: expose `coverageLedgerSeed` through the clean MCP output and
   full briefing evidence for `alembic_rescan`, without inventing the seed in
   the output projector and without changing frozen tool names.
2. Alembic: make deepMining round rows close or fail closed when an in-process
   incremental workflow throws after opening a row. A failed rescan must not
   leave an open `deep_mining_rounds` row that blocks later parity evidence.
3. Alembic: align the in-process incremental P10 evidence path so the daemon
   honors the same explicit module/dimension/scale selection used for the
   comparison, or returns enough structured evidence to prove a deliberate
   parity scope. The rerun must produce comparable normalized coverage rows.

## Forbidden Conclusions

- This does not invalidate the P10 code-phase acceptance for the existence of
  `runProjectIndexWorkflow(mode)` wrappers and consumers.
- This does not accept P10 REAL-TEST, G4, P11, P12, P13, or the whole demand.
- Test must not repair BiliDili DB manually; the stale open round is repair
  evidence.

## Next Action

Reduce the Test result, decide the P10 REAL-TEST candidate as `rework`, and
dispatch source repair packages to AlembicPlugin and Alembic. After both repair
packages are accepted and propagated as needed, rerun the P10 BiliDili
REAL-TEST.
