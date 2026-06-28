# Controller Review: P10 BiliDili No-Preclean Parity Rerun

Reviewed at: 2026-06-28T08:38:57Z

## Scope

- Demand: `alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`
- Dispatch group: `p10-bilidili-no-preclean-parity-rerun-p1`
- Target result: `Test / p10-bilidili-no-preclean-parity-rerun-t1`
- Target status reviewed: `blocked`

## Evidence Reviewed

- TargetResultEnvelope: `target-results/tr-p10-bilidili-no-preclean-parity-rerun-t1.json`
- Test report: `evidence/p10-bilidili-no-preclean-parity-rerun-t1-report.md`
- Test summary: `evidence/p10-bilidili-no-preclean-parity-rerun-t1-summary.json`
- Raw evidence:
  - `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/baseline.json`
  - `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/host-cold-start-command.json`
  - `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/host-cold-start-process-timeline.json`
  - `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/after-host-probe-readback.json`
  - `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/host-probe-monitor-1.json`
  - `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/host-probe-monitor-2.json`
  - `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/cancel-host-probe-job.json`

## Controller Findings

- Test stayed inside the corrected execution boundary. It reused the already-running BiliDili daemon, did not invoke restart, did not invoke default preclean, and did not clean non-BiliDili data roots.
- The BiliDili daemon route was healthy and pointed to the expected BiliDili project/data root. Test mode was enabled for `architecture`.
- The SQLite data root is not corrupt now. Test evidence and controller read-only verification both show `PRAGMA integrity_check=ok`.
- The host cold-start job entered the project-index workflow but did not produce usable completion evidence within the bounded window. It remained `running` with `architecture` filling and `totalToolCalls=0`.
- Test cancelled only the timed-out host probe job. Cancel evidence shows `status=cancelled`; daemon health remained healthy and DB integrity remained `ok`.
- Coverage did not materialize: `coverage_ledger=0`, target-scoped coverage rows `0`, no `coverageLedgerSeed`, no deep-mining rounds, and no open rounds.
- Test correctly did not run in-process parity after host coverage stayed empty, avoiding a false 0-vs-0 parity pass.
- Controller read-only verification after Test agreed with the blocked state: DB integrity `ok`, `coverage_ledger=0`, `deep_mining_rounds=0`, `knowledge_entries=9`, and no source worktree dirt in Alembic, AlembicPlugin, AlembicCore, or BiliDili.
- The active bootstrap-session file still contains one incomplete BiliDili session record, while the SQLite `sessions` table has no rows. This points to a host workflow/session cleanup or background fill completion bug, not to Test evidence failure.

## Decision

Decision: `accept-target-result` as blocked evidence only.

This result does not prove P10 parity, G4 coverage, G6 cleanup, or whole-demand completion. It does prove that the data-root SQLite corruption repair held and that the next blocker is the host cold-start workflow/session completion path.

## Next Action

Create a narrow Alembic repair package for the host Dashboard/daemon cold-start route:

- diagnose why the job reaches `ProjectIndexWorkflow` and then stalls in `architecture` filling with zero tool calls;
- ensure cancellation or timeout clears the active bootstrap-session record for the same project;
- preserve the existing fail-closed corrupt-DB behavior and no-cross-root data boundary;
- produce targeted source tests/build evidence and a small runtime probe showing the job either completes with non-empty coverage seed output or fails/cleans up deterministically.

After the repair lands, return to Test with a fresh no-preclean BiliDili parity rerun.

## Forbidden Conclusions

- Do not accept P10 parity from this result.
- Do not accept G4, G6, or final demand completion.
- Do not treat daemon health, DB integrity, or job cancellation as coverage success.
- Do not redispatch Test before the host route/session blocker is repaired or a controller-authorized cleanup strategy exists.
