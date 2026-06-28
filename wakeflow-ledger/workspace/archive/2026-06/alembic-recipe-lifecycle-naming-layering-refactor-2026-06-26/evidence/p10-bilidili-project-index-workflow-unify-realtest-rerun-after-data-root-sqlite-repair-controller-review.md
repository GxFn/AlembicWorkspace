# P10 Test Backfill Controller Review: Data-Root SQLite Repair Rerun

Reviewed at: 2026-06-28T08:13:55Z

Dispatch group: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-data-root-sqlite-repair-p1`
Target task: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-data-root-sqlite-repair-t1`
Target: Test
Controller decision: accept Test blocked evidence; do not accept P10 parity, G4, G6, or demand completion.

## Raw Evidence Reviewed

- TargetResultEnvelope: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/target-results/tr-p10-bilidili-project-index-workflow-unify-realtest-rerun-after-data-root-sqlite-repair-t1.json`
- Test report: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-data-root-sqlite-repair-t1-report.md`
- Test summary: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-data-root-sqlite-repair-t1-summary.json`
- Test boundary card: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/test-cards/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-data-root-sqlite-repair-t1.json`
- Task package: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/task-packages/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-data-root-sqlite-repair-p1.json`
- Wakeflow review pack for the dispatch group returned `groupStatus=blocked`, no missing evidence refs, and a sent/readback-ok controller-return delivery.

## Findings

1. Test correctly did not claim P10 parity. It stopped before `alembic_bootstrap({rebuild:true})`, host rescan/noPadding, in-process moduleScope, or host-vs-in-process parity.
2. Test preconditions were partially verified: source pins met the lower-bound commits, provider config was unchanged, BiliDili DB integrity was `ok`, and BiliDili workspace state was clean.
3. Test's current Codex Alembic MCP surface returned `Transport closed`. That prevents using Test's current host-MCP route as the P10 official rebuild proof.
4. Test attempted a daemon restart because no Dashboard URL was resolved. The restart command started the BiliDili daemon and the daemon is healthy, but default preclean also cleaned log paths under non-BiliDili Ghost roots. This violated the test card boundary and invalidates this run as P10 evidence.
5. The current BiliDili daemon is now healthy at the reported local URL, test mode is enabled, and `verify-test-environment --url` is ready. Controller independently confirmed the daemon listener, health endpoint, test-mode endpoint, and BiliDili DB schema/integrity.
6. The Test report/summary did not include a task-local `Test/tmp/<taskId>/` raw JSON directory as evidence refs. That is acceptable only for accepting the blocked classification; the next rerun must capture raw restart/environment/probe JSON under a task-local path.

## Judgment

This Test result is valid blocked evidence, not failed product behavior. The blocker is in the Test execution route:

- current Test thread cannot use its Alembic MCP surface;
- the fallback restart used default preclean and crossed the BiliDili-only boundary;
- no official rebuild/parity evidence was generated.

No Alembic, AlembicPlugin, AlembicCore, or BiliDili source repair is authorized from this result. The next smallest valid action is a Test rerun with an explicit no-preclean/no-cross-root route.

## Next Action

Create a new Test task package that:

- uses the existing healthy BiliDili daemon only after fresh `verify-test-environment --url` evidence, or restarts with `restart-alembic.mjs --no-preclean --no-dev-link` and proves `preclean.skipped=true`;
- does not use Test's current Alembic MCP surface if it returns `Transport closed`;
- uses the Dashboard/daemon route from `skills/alembic-real-routes/SKILL.md`, including `probe-cold-start-process-timeline.mjs`, unless the state root explicitly requests host-MCP repair;
- writes task-local raw JSON evidence under `Test/tmp/<taskId>/`;
- keeps the forbidden boundary: no touching `~/.asd` outside the BiliDili data root, no manual DB row/session/provider/source edits, and no product code changes in Test;
- passes only with non-empty target-scoped coverage, coverageLedgerSeed, no aggregate/root module ids, and host-vs-in-process diff empty.

Forbidden conclusion: this review accepts only the execution-boundary blocked result. It does not accept P10 parity, G4, G6, or demand completion.
