# P12 FileChangeHandler Rename Controller Review

## Controller Acceptance

- User goal: review the Alembic and AlembicPlugin P12 backfills for the N-9 dual `FileChangeHandler` rename.
- Scope reviewed: source-package results for `p12-alembic-inprocess-file-change-handler-rename-t1` and `p12-plugin-hostagent-file-change-handler-rename-t1`.
- Original requirement authority: `Design/docs/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26.md` P12 lines 863-867 plus `wakeflow-ledger/AlembicWorkspace/recipe-lifecycle-freeze-register-2026-06-28.md`.
- Target/window: Alembic commit `91a254901ab5a7367d9965d9ab5be9fdbd4595e1`; AlembicPlugin commit `a1bbabd997c06dda469b043047690a4b6e91e19b`.
- Evidence reviewed: Wakeflow review pack at state revision 190/191; target result envelopes; Plugin task package; `git show --stat --oneline` and `git show --name-only --format=fuller` for both commits; source grep for old/new handler names and freeze literals.
- Implementation reality: Alembic moved the in-process daemon-reactive implementation to `InProcessFileChangeHandler` and kept `FileChangeHandler` as an R1 alias. AlembicPlugin moved the host-agent commit-driven implementation to `HostAgentFileChangeHandler` and kept `FileChangeHandler` as an R1 alias/service adapter. Real consumers now import the new names; remaining old-name references are shim, adapter, skeleton path pin, or alias tests.
- Validation result: Alembic target evidence reported focused tests, `build:check`, `lint:repo-boundary`, and diff checks green; controller previously verified Alembic grep/diff/status. For AlembicPlugin, controller re-ran `npm run test:unit -- test/unit/HostAgentFileChangeHandler.test.ts test/unit/RecipeGenerationSkeleton.test.ts test/unit/PluginOpportunisticEvolution.test.ts` (43 tests), `npm run build:check`, `npm run lint:repo-boundary`, `npm run lint:core-import-boundary`, `git diff HEAD^ HEAD --check`, and `git status --short`; all passed/clean.
- Blockers: none for the two P12 source packages.
- Missing evidence: P12 real BiliDili dual-host evolution parity is not covered by these source packages and remains required.
- Residual risks: Alembic Guard MCP returned the known internal `unrecognized key "data"` error in target windows, so repository validation and raw source review are the acceptance evidence. This review does not accept G4, G6, P13, or whole-demand completion.
- TODO/backlog rollup: no new follow-up scope from this review. Continue with the already-authorized P12 REAL-TEST package.
- Decision: accept-target-result.
- Next action: after `wakeflow_decide_review`, dispatch/await the P12 Test real-run package for dual-host evolution parity.
