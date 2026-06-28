# P10 Controller Review - REAL-TEST rerun after repairs

Date: 2026-06-28
Controller: AlembicWorkspace

Dispatch group:
- `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-p1`

Target task:
- Test / `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1`

## Decision

Request product/source rework. The Test result is a valid blocked result and
the P10 REAL-TEST gate remains open.

The blocker is not a missing Test environment: the real BiliDili daemon started,
the accepted source pins matched, Alembic and AlembicPlugin were built before
runtime execution, R-2 source proof held, and host bootstrap completed. The
remaining failures are product/workflow defects inside the P10 surface.

## Raw Evidence Reviewed

- Target result:
  `target-results/tr-p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1.json`
- Test report:
  `evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1-report.md`
- Test summary:
  `evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1-summary.json`
- Host rescan briefing summary:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/host-rescan-briefing-summary.json`
- Host coverageLedgerSeed search:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/host-rescan-coverage-ledger-seed-rg.txt`
- Host post-rescan DB/log snapshot:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/host-after-rescan-snapshot.json`
- In-process failed bootstrap:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/inprocess-failed-bootstrap-status.json`
- In-process failed rescan:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/inprocess-failed-rescan-status.json`
- Final blocked snapshot:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/final-after-blocked-rerun-snapshot.json`
- Parity diff:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/parity-diff.json`

## Controller Findings

The repaired source pins matched the package:

- Alembic `1a07b0f89044855913ac4cb4fb5d9172915990b4`
- AlembicPlugin `f7fe95e422eb155f04a38ff5602318be71ffef8a`
- AlembicCore `99a7cf10d82056cd860eb0a1d9544662e3735b08`

Host bootstrap passed its full-path gates: `alembic_bootstrap` returned
`planGate.status=ready`, used full-reset cleanup under dataRoot, submitted three
architecture recipes, and completed the architecture dimension.

Host rescan still failed the repaired incremental gate. Raw briefing evidence
showed `toolName=alembic_rescan`, `planGate.status=ready`, and
`generationStage=deepMining`, but `coverageLedgerSeed` was absent: the focused
search file was 0 bytes, briefing `dataMeta` was null, and
`coverageLedgerSeed` was null. Source review shows Plugin attaches
`coverageLedgerSeed` before response data budgeting; the real briefing proves the
runtime path still drops it before clean/full evidence.

Host rescan also left an open `deep_mining_rounds` row with
`trigger_actor='host-agent-rescan'`, `completed_at=null`, and
`new_recipes_this_round=0`. Test attempted to close the one-budget rescan session
through public `alembic_dimension_complete`, including a `noPadding` retry, but
both attempts failed with `DIMENSION_CANDIDATE_COUNT_INSUFFICIENT`. The result
was an active host session that blocked in-process bootstrap with a
`BootstrapSessionLeaseError`.

The in-process deepMining rescan used the explicit P10 seed constraints, but
Alembic failed before round execution with
`DeepMining request constraints removed all module×dimension targets.` Source
review shows `PlanSelectionGate` currently matches request `moduleScope` only by
exact `modulePath` or `moduleId`; the real BiliDili scope `["BiliDili"]` is not
accepted as an alias for the selected root/canonical module target.

Parity is not comparable. The host snapshot had 27 `coverage_ledger` rows, the
final in-process snapshot had 0, and `parity-diff.json` reported
`diffEmpty=false`.

## Required Rework

AlembicPlugin:

1. Preserve and expose host `alembic_rescan` `coverageLedgerSeed` through the
   real clean output and full briefing path after response budgeting, not only in
   a direct unit-level workflow response.
2. Repair the host deepMining rescan session/round close contract for the P10
   one-budget path. A public completion attempt that cannot satisfy candidate
   count must not leave an active host session and an open host-agent round that
   blocks the next workflow; the fix must not relax unrelated completion gates.
3. Add regression coverage that exercises the budgeted/full-briefing MCP path and
   the host round/session close behavior seen in this real BiliDili run.

Alembic:

1. Repair deepMining request constraint matching so explicit real-project
   `moduleScope` aliases such as `BiliDili` match the selected root/canonical
   module target instead of removing all module×dimension targets.
2. Keep true-miss failures intact and add diagnostics/tests for the real alias
   shape.
3. Preserve the prior fail-close behavior for thrown incremental workflow calls.

## Forbidden Conclusions

- Do not accept P10 REAL-TEST, G4, G6, P11, P12, P13, or the whole demand.
- Do not classify this as an environment-only blocker.
- Do not ask Test to manually repair the BiliDili DB.
- Do not broaden into P11 moduleMining behavior or frozen-name changes.

## Next Action

Reduce the Test result and decide the candidate as `rework`, then dispatch source
repair packages to AlembicPlugin and Alembic. After those repairs are accepted,
rerun the P10 BiliDili REAL-TEST.
