# P10 Alembic Host Cold-Start Session Completion Repair Controller Review

Date: 2026-06-28
Controller: AlembicWorkspace
Dispatch group: `p10-alembic-host-cold-start-session-completion-repair-p1`
Task: `p10-alembic-host-cold-start-session-completion-repair-t1`
Target: Alembic
Decision: accept narrow source repair; dispatch Test rerun

## Reviewed Evidence

- Target result envelope:
  `target-results/p10-alembic-host-cold-start-session-completion-repair-t1-01e7064.json`
- Target report:
  `evidence/p10-alembic-host-cold-start-session-completion-repair-t1-report.md`
- Alembic commit:
  `01e70642260e61fca2174a87106b22ad21b6ad81`
- Source diff:
  `lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
  `test/unit/ProjectContextWorkflowFacts.test.ts`
- Prior Test blocker evidence:
  `evidence/p10-bilidili-no-preclean-parity-rerun-controller-review.md`
  `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/cancel-host-probe-job.json`
  `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/host-cold-start-process-timeline.json`

## Controller Verification

- `git -C Alembic rev-parse HEAD` => `01e70642260e61fca2174a87106b22ad21b6ad81`
- `git -C Alembic status --short` => clean
- `git -C Alembic show --stat --oneline --decorate --name-status 01e70642260e61fca2174a87106b22ad21b6ad81`
  => only `ProjectContextWorkflowFacts.ts` and its unit test changed
- `npm test -- --run test/unit/ProjectContextWorkflowFacts.test.ts`
  => passed, 14 tests
- `npm run build:check`
  => passed

## Controller Judgment

The Alembic repair is accepted for the narrow blocker it claimed: host
cold-start cancellation no longer leaves the file-backed ProjectContext workflow
session lease stranded in a way that prevents retry. The source diff introduces
an explicit release classifier:

- clean completed bootstrap events still release with the existing completion
  reasons;
- cancelled/aborted/user-cancelled bootstrap completion events release with a
  cancellation reason;
- failed/degraded partial events retain the workflow lease and preserve evidence
  via `bootstrap-session-not-clean-complete`.

This matches the prior Test evidence: the daemon job cancellation path had
cancelled the HTTP job, but the ProjectContext workflow active session remained
incomplete and blocked a no-preclean retry. The repair does not alter provider
selection, BiliDili data, SQLite state, or project-index parity semantics.

## What This Does Not Prove

This decision does not accept P10, G4, G6, or the final lifecycle refactor. It
does not prove that a fresh real BiliDili no-preclean host run now completes,
produces non-empty target-scoped coverage, emits `coverageLedgerSeed`, or matches
the in-process parity predicate. Those conclusions require a Test rerun against
the real BiliDili workspace.

`alembic_code_guard` still has no usable verdict for this task because the target
reported an internal MCP schema failure: `unrecognized key "data"`. That is a
tool-surface limitation, not acceptance evidence.

## Next Action

Dispatch Test for a fresh BiliDili no-preclean parity rerun after the Alembic
session-cancellation repair. The rerun must not pre-clean the BiliDili data root
or manually edit active-session files. If cancellation or timeout is needed, Test
must prove whether the repaired cancellation path releases the ProjectContext
workflow lease and leaves the next host retry unblocked.
