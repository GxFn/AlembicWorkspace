# verify-test-bilidili-mainbody-realverify-p1 Controller Review

## Conclusion

Status: blocked.

The Test backfill is valid blocker evidence, not acceptance evidence. The assigned BiliDili seven-step realverify chain did not start because the confirmed CG-1 sandbox precondition could not be satisfied: `better-sqlite3 .backup()` from the true BiliDili workspace DB stalls and produces no usable sandbox DB.

## Reviewed Inputs

- Target result: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-verify-test-bilidili-mainbody-realverify-t1.json`
- Test evidence: `/Users/gaoxuefeng/Documents/AlembicWorkspace/Test/tmp/verify-test-bilidili-mainbody-realverify-t1/evidence/blocked-backup-precondition.md`
- Harness: `/Users/gaoxuefeng/Documents/AlembicWorkspace/Test/tmp/verify-test-bilidili-mainbody-realverify-t1/run-mainbody-realverify.mjs`
- Requirement design: `Design/docs/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26.md`

## Raw Evidence Summary

- Test confirmed the correct project and data root: BiliDili current main, Alembic/Core/Plugin heads matching the accepted FIX wave, local Ollama reachable, and true DB readable.
- True DB read-only baseline was healthy: `PRAGMA integrity_check` returned `ok`; table counts were readable; `knowledge_entries`, `coverage_ledger`, `deep_mining_rounds`, and `recipe_source_refs` existed.
- The required `better-sqlite3 .backup()` sandbox precondition failed three ways:
  - readonly backup timed out after 30 seconds and left a 0-byte destination;
  - readwrite backup timed out after 30 seconds and left a 0-byte destination;
  - progress-handler backup advanced from 259 to 59 remaining pages, then stayed at 59 remaining pages for more than 123,000 progress callbacks over 30 seconds, still leaving a 0-byte destination.
- The harness-created sandbox DB was not usable; it lacked `knowledge_entries`, so Test correctly refused to use it as validation evidence.
- No coldStart, deepMining, moduleMining, evolution, or anti-fabrication rejection run happened in this Test task.

## Controller Judgment

This cannot be accepted because the demand's completion definition requires true DB evidence from the realverify chain. It also should not be redispatched as a normal product rework without a new decision, because Test already exhausted the allowed `.backup()` route and explicitly identified `cp` / `VACUUM INTO` as possible execution workarounds that do not satisfy the confirmed CG-1 boundary.

Forbidden conclusions:

- Do not treat baseline true DB rows as proof that the accepted FIX wave works.
- Do not treat a faithful read-only replica, direct `cp`, or `VACUUM INTO` as equivalent to the confirmed `.backup()` sandbox unless the user changes the boundary.
- Do not archive the demand while the seven-step true-run evidence is absent.

## Next Required Decision

User or Design must decide whether to keep CG-1 strictly as `better-sqlite3 .backup()` and repair the local DB/runtime backup blocker outside this package, or authorize a revised sandbox construction method for Phase VERIFY.
