# Controller Review: fix-main-bootstrap-session-lifecycle-after-coldstart

## Conclusion

Decision: accept Alembic target result for the narrow session-lifecycle repair. Commit `e88cc82f9f35b952db89aa4d04ebf84cdb2afb95` adds live-source handling so completed ProjectContext workflow sessions are released after clean coldStart/internal rescan completion, while partial or failed sessions remain blocking evidence.

This does not complete the demand. The next required step is a direct BiliDili Test rerun to prove coldStart -> deepMining no longer fails with the previous `Bootstrap already in progress` lease blocker, then continue the real verification chain.

## Reviewed Evidence

- `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-fix-main-bootstrap-session-lifecycle-after-coldstart-t1.json`
- `Alembic` commit `e88cc82f9f35b952db89aa4d04ebf84cdb2afb95`
- `Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
- `Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts`
- `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
- `Alembic/test/unit/ProjectContextWorkflowFacts.test.ts`

## Controller Checks

- `git -C Alembic show --stat --oneline --decorate --no-renames e88cc82f9f35b952db89aa4d04ebf84cdb2afb95` showed the expected four-file live-source patch.
- `git -C Alembic status --short` returned clean.
- `node -v` returned `v22.22.1`.
- `npm run test:unit -- test/unit/ProjectContextWorkflowFacts.test.ts` passed with 9 tests.
- `npm run build:check` passed.
- `./node_modules/.bin/biome check --no-errors-on-unmatched lib/workflows/project-context/ProjectContextWorkflowFacts.ts lib/workflows/cold-start/ColdStartWorkflow.ts lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts test/unit/ProjectContextWorkflowFacts.test.ts` passed.
- `git diff --check` passed.

## Implementation Facts

- `ProjectContextWorkflowFacts.ts` now exposes release helpers around the Core `BootstrapSessionManager` public `getAnySession` and `clearSession` primitives.
- The release path matches the exact workflow session id and project root, clears only that session, and verifies it is gone after clear.
- The event hook listens for `bootstrap:all-completed`, filters by matching `sessionId`, and releases only when the completion event is clean.
- Partial, degraded, skipped, failed, timeout, blocked, aborted, or repair-incomplete completion records do not release the lease.
- `ColdStartWorkflow.ts` registers the release hook for non-skip async fill coldStart sessions.
- `KnowledgeRescanWorkflow.ts` registers the release hook for internal rescan async fill sessions, and releases synchronous moduleMining/no-fill completion sessions.
- The patch leaves controller-produce sessions intact and does not loosen quality gates, anti-fabrication, plan-selection validation, coverage-ledger writeback, or no-fallback-to-full behavior.

## Residual Risk

- The Alembic target did not rerun the live BiliDili chain. The accepted evidence proves the code repair and targeted tests, not end-to-end completion.
- `alembic_code_guard` was attempted by the target but the plugin returned an internal schema error: `unrecognized key "data"`. Guard evidence is unavailable; controller did not treat that as product acceptance.

## Required Next Step

Dispatch Test to rerun direct BiliDili realverify after the Alembic session lifecycle fix. Test must show whether a fresh coldStart can be followed by deepMining without the previous active-session lease failure, then continue to moduleMining, evolution/maintenance, and anti-fabrication rejection if the chain proceeds.

## Forbidden Conclusion

Do not mark the overall mainbody lifecycle follow-up complete from this repair alone. It closes the immediate session lifecycle code blocker only.
