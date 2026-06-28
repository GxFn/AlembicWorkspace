# P15 Controller Review - Final Parity Rerun After Terminal Cleanup Seed Consistency Repair

Reviewed at: 2026-06-29

Dispatch group: `p15-bilidili-final-parity-rerun-after-terminal-cleanup-seed-consistency-repair-p1`

Target task: Test / `p15-bilidili-final-parity-rerun-after-terminal-cleanup-seed-consistency-repair-t1`

Decision: accept blocked Test evidence; P15 final parity remains open.

## Scope Reviewed

- Target result:
  `target-results/target-result-p15-bilidili-final-parity-rerun-after-terminal-cleanup-seed-consistency-repair-t1.json`
- Raw Test summary:
  `Test/tmp/p15-bilidili-final-parity-rerun-after-terminal-cleanup-seed-consistency-repair-t1/blocked-summary.json`
- Raw reset evidence:
  `Test/tmp/p15-bilidili-final-parity-rerun-after-terminal-cleanup-seed-consistency-repair-t1/bootstrap-rebuild-evidence.json`
- Raw host rescan evidence:
  `Test/tmp/p15-bilidili-final-parity-rerun-after-terminal-cleanup-seed-consistency-repair-t1/host-rescan-evidence.json`
- Raw public cleanup evidence:
  `Test/tmp/p15-bilidili-final-parity-rerun-after-terminal-cleanup-seed-consistency-repair-t1/dimension-complete-nopadding-evidence.json`
- Raw dashboard cancel evidence:
  `Test/tmp/p15-bilidili-final-parity-rerun-after-terminal-cleanup-seed-consistency-repair-t1/bootstrap-cancel-response.json`
- Prior accepted Plugin repair:
  `evidence/p15-plugin-host-rescan-terminal-cleanup-seed-consistency-repair-controller-review.md`

## Evidence Summary

Positive evidence:

- Loaded code points were correct: Alembic `0d60018d7f6c9e2bb4a660b8ed18c303aa6af8ad`, Core `edd79d26d9d539fd52e17cf67299ccdba20b4e5a`, Plugin `773dd9563d1282ede4fc5397137e98a173186ef2`, and BiliDili `8487b82e7f3ceae7f35fcb19c6a5985022287422`.
- Provider route stayed correct: DeepSeek generation plus local Ollama/Qwen embedding.
- Scoped git status for Alembic, AlembicCore, AlembicPlugin, and BiliDili was clean in the Test baseline.
- SQLite integrity was `ok` before and after the authorized reset/rebuild path.
- Plugin repair markers were loaded in source, dist, and runtime.
- The authorized host MCP `alembic_bootstrap` call with `rebuild:true` took the expected full-reset route and returned `ok=true`, `status=ready`, `toolName=alembic_bootstrap`, `cleanupPolicy=full-reset`, with one planned `architecture` dimension.
- The authorized rebuild/reset cleared the previously dirty persisted state: coverage rows went from 17 to 0, aggregate/root coverage ids were absent, and open deep-mining rounds went from 2 to 0.
- After the failed host rescan attempt, persisted coverage was target-scoped and non-empty: 15 target-scoped rows, no aggregate/root rows, and 0 open rounds.

Blocking evidence:

- The successful `alembic_bootstrap rebuild:true` route still left one active BiliDili host-agent bootstrap session in the durable session store.
- The assigned host MCP `alembic_rescan` immediately failed with `BOOTSTRAP_IN_PROGRESS` / HTTP 409 for the same project root.
- Public `alembic_dimension_complete` using the no-padding cleanup path was listed and callable, but it failed with `DIMENSION_RECIPE_ID_NOT_BOUND`; it did not release the active session.
- Dashboard `cancel_bootstrap` reported `status=idle` / "No active bootstrap session", but the Test snapshot after that call still showed the durable host-agent session present.
- The final failing predicate is therefore session lifecycle mismatch after a successful host bootstrap rebuild, not data corruption or missing source repair.

## Ownership Judgment

This Test blocker is valid and should be accepted as evidence. It is not SQLite corruption, provider drift, wrong HEAD, Test source editing, or a dirty repository problem.

First source owner: AlembicPlugin host MCP bootstrap/project-index route.

Reasoning:

- The failing public path is Plugin-owned `alembic_bootstrap` followed by Plugin-owned `alembic_rescan`.
- `alembic_bootstrap` succeeds and returns a ready briefing, but leaves a durable host-agent session that blocks the next Plugin host route.
- Dashboard cancel sees a different session surface and cannot clear the durable host-agent session, so a Plugin bridge/release decision is needed before another Test rerun.
- AlembicCore owns `BootstrapSessionManager`, but it already exposes project/session release APIs. If AlembicPlugin proves the current API is insufficient for safe terminal cleanup, it should backfill the exact AlembicCore API need instead of editing BiliDili data or inventing cleanup in Test.

Repair should stay narrow:

- After a successful authorized full-reset/bootstrap rebuild that returns only initial mission briefing state, Plugin must either release/complete the terminal host-agent session when no follow-up session-bound completion is possible in this route, or expose a safe public cleanup path that releases the exact project session without touching productive in-progress work.
- Subsequent `alembic_rescan` after authorized rebuild/reset must not fail with `BOOTSTRAP_IN_PROGRESS` from the just-returned rebuild session.
- Keep the current successful reset facts: SQLite integrity, aggregate/root cleanup, open-round cleanup, and target-scoped seed behavior.
- Do not manually clean BiliDili SQLite/session files; do not dispatch Test again until the source repair lands.

## Controller Acceptance

- User goal: finish the Recipe lifecycle naming/layering refactor through P15 hard gates.
- Scope reviewed: Test final parity rerun after accepted Plugin terminal cleanup/seed consistency repair.
- Original requirement authority: state-root P15 hard gates require real BiliDili evidence, target-scoped non-empty coverage rows, no aggregate/root success rows, closed sessions/rounds, SQLite integrity, and host-vs-in-process parity.
- Target/window: Test / `p15-bilidili-final-parity-rerun-after-terminal-cleanup-seed-consistency-repair-t1`.
- Evidence reviewed: review pack, target result, raw blocked summary, reset/rebuild evidence, host rescan evidence, no-padding dimension-complete evidence, dashboard cancel evidence, and Plugin/Core source ownership scan.
- Implementation reality: the accepted Plugin repair fixed prior terminal cleanup/seed consistency enough that a clean rebuild/reset clears old rows/rounds and host rescan writes target-scoped rows, but the successful bootstrap rebuild leaves a host-agent session that blocks the next host route.
- Validation result: Test execution is valid; P15 pass predicate is not met.
- Blockers: active durable host-agent bootstrap session remains after successful `alembic_bootstrap rebuild:true`; `alembic_rescan` fails with `BOOTSTRAP_IN_PROGRESS`; public cleanup and dashboard cancel do not release the same session.
- Missing evidence: no source repair proving post-rebuild session release; no final clean BiliDili host-vs-in-process parity rerun after that repair.
- Residual risks: releasing productive session-bound bootstrap work too broadly would break the intended host-agent bootstrap loop, so the repair must prove the terminal/rebuild cleanup predicate is specific.
- TODO/backlog rollup: create a narrow AlembicPlugin repair package; rerun Test only after that source result is accepted.
- Decision: accept-target-result as blocked evidence.
- Next action: create-next-package for AlembicPlugin host bootstrap rebuild session release / cleanup bridge repair.

## Forbidden Conclusions

- Do not complete or archive the demand.
- Do not accept P15 final parity from reset success alone.
- Do not call this SQLite corruption; SQLite integrity is ok and the reset cleaned stale DB rows.
- Do not manually edit BiliDili SQLite/session/round state.
- Do not dispatch another Test rerun until Plugin source repair lands and is reviewed.
- Do not dispatch Alembic main repair unless a later clean rerun proves an independent in-process defect.
- Do not push, version, release, or remove compatibility aliases from this evidence.
