# P10 Alembic Host Cold-Start Session Completion Repair

Task: `p10-alembic-host-cold-start-session-completion-repair-t1`
Dispatch group: `p10-alembic-host-cold-start-session-completion-repair-p1`
Window: Alembic
Status: completed
Alembic commit: `01e70642260e61fca2174a87106b22ad21b6ad81`

## Diagnosis

The no-preclean BiliDili evidence showed the daemon job cancellation path did
mark the HTTP job cancelled, but the file-backed ProjectContext workflow lease
remained incomplete for the same project. The live route creates two session
layers:

- `BootstrapTaskManager` runtime session, cancelled through the jobs API.
- `ProjectContextWorkflowFacts` file-backed workflow session, released only on
  clean `bootstrap:all-completed` before this repair.

The raw Test timeline also showed LLM activity was present even though
`totalToolCalls=0`, so the narrow source defect is not a missing daemon route or
manual DB issue. The first deterministic repair target is cancellation cleanup:
cancelled/aborted bootstrap completion must release the ProjectContext workflow
lease so the next host cold-start can retry instead of being blocked by an
incomplete active session.

## Source Changes

- `lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
  - Replaced the single clean-completion predicate with an explicit release
    classifier.
  - Clean `completed` sessions still release with
    `cold-start:bootstrap-session-completed` or `rescan:bootstrap-session-completed`.
  - Cancelled/aborted/user-cancelled sessions now release with
    `cold-start:bootstrap-session-cancelled` or `rescan:bootstrap-session-cancelled`.
  - Partial failed/degraded sessions still retain the lease and log
    `bootstrap-session-not-clean-complete`, preserving evidence instead of
    silently deleting failed output.
- `test/unit/ProjectContextWorkflowFacts.test.ts`
  - Added a regression proving an aborted cold-start event clears the old
    workflow lease and allows an immediate retry session.
  - Existing tests continue to prove clean completion releases and partial
    failures retain evidence.

## Validation

- `npm test -- --run test/unit/ProjectContextWorkflowFacts.test.ts` => passed
  (14 tests).
- `npm test -- --run test/unit/DaemonJobRunner.test.ts test/unit/JobsRoute.test.ts test/unit/ProjectIndexWorkflow.test.ts`
  => passed (38 tests).
- `npx biome check lib/workflows/project-context/ProjectContextWorkflowFacts.ts test/unit/ProjectContextWorkflowFacts.test.ts`
  => passed.
- `npm run build:check` => passed.
- `npm run lint:repo-boundary` => passed.
- `git diff --check` => passed.
- `npm run lint` => exit 0 with 5 pre-existing unrelated `noExplicitAny`
  warnings outside this change set.

## Residual Risks

- `alembic_code_guard` was attempted on the changed files but failed with the
  internal MCP schema error `unrecognized key "data"`; it did not produce a
  usable guard pass/fail verdict.
- This Alembic target task did not rerun the real BiliDili no-preclean parity
  scenario. Controller/Test should rerun it after this source repair to prove
  the host route can retry cleanly and produce non-empty coverage/seed evidence.
- The fix intentionally does not speed up or change the AI pipeline itself. It
  makes cancellation deterministic and retry-safe while preserving partial
  failed-session evidence.

## Next Recommendation

Controller should review this Alembic repair and then dispatch Test for a fresh
no-preclean BiliDili parity rerun. Success still requires non-empty
target-scoped coverage, `coverageLedgerSeed`, no stale active session/open round,
and a real host-vs-in-process parity comparison.
