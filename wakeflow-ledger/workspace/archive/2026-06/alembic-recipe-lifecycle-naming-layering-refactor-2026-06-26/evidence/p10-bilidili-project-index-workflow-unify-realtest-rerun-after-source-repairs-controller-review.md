# Controller review: P10 BiliDili rerun after source repairs

Date: 2026-06-28
Window: AlembicWorkspace
Dispatch group: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-p1`
Target task: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1`

## Verdict

Rework required. The Test blocked result is accepted as a valid failure report,
but P10 REAL-TEST is not accepted.

The controller independently reviewed the target result, report, summary JSON,
host MCP summary, session/DB snapshots, in-process job status files, and parity
diff. The failure is not a pin, provider, daemon-start, or R-2 identity issue.
The required source pins were used:

- Alembic `2475fe7f72b10da02f306358febcfa00b90ea7b7`
- AlembicPlugin `2f5af00b61593075802ce2a4db893f7c96d9930f`
- AlembicCore `99a7cf10d82056cd860eb0a1d9544662e3735b08`
- BiliDili `6f1bf34cf1b6daca4e08895db211939115dac868`

## Raw Evidence Reviewed

- `target-results/tr-p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1.json`
- `evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1-report.md`
- `evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1-summary.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/host-mcp-summary.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/before-host-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/after-nopadding-cleanup-probe-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/after-nopadding-cleanup-with-recipe-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/inprocess-bootstrap-status.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/inprocess-rescan-status.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/inprocess-rerun-evidence.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/parity-diff.json`

## Findings

1. Host bootstrap is still blocked before the `coverageLedgerSeed` visibility
   gate. `alembic_bootstrap(rebuild:true)` failed twice with
   `BOOTSTRAP_IN_PROGRESS`.
2. The public terminal noPadding completion route preserved
   `DIMENSION_CANDIDATE_COUNT_INSUFFICIENT`, but it did not release the matching
   active host-agent session. The controller verified the active session stayed
   `count=1` and `matchingProjectCount=1` before the probe, after the no-recipe
   probe, and after the submitted-recipe probe. The session file mtime also did
   not change.
3. There were no open `deep_mining_rounds` rows during the noPadding probes, so
   the remaining host blocker is the active session lease, not an open round.
4. The in-process bootstrap path also failed on the same active-session lease.
5. The explicit in-process deepMining rescan used `moduleScope=["BiliDili"]`,
   but failed at the plan gate with `request constraints removed all
   module×dimension targets`. The diagnostic alias list included nested modules
   such as `Account`, `AOXFoundationKit`, and `Sources/Features/Home`, but did
   not include a root/BiliDili alias.
6. `coverage_ledger` stayed empty on both sides. The parity file marks the
   comparison invalid: `comparable=false`, `hostRowCount=0`,
   `inprocessRowCount=0`, and `diffEmpty=false`.

## Owner Split

- AlembicPlugin: repair the real public terminal noPadding cleanup path so a
  terminal candidate-count failure releases the matching active host-agent
  session for the project while preserving the failure response semantics.
- Alembic: repair the real in-process deepMining module-scope alias selection so
  `moduleScope=["BiliDili"]` matches the root project module and does not remove
  all module x dimension targets.

## Forbidden Conclusions

- Do not accept P10 REAL-TEST, G4, G6, P11, P12, P13, or the demand.
- Do not treat `0 vs 0` coverage as parity.
- Do not claim host `coverageLedgerSeed` visibility in the real route; the host
  bootstrap/rescan gate was not reached.
- Do not classify this as Test-only environment drift.
- Do not manually edit BiliDili DB/session files as the repair.
