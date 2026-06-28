# P5 Controller Review Evidence - ProjectIndex Alias Shims

Reviewed at: 2026-06-28
Dispatch group: `p5-core-project-index-aliases-p1`
Target task: `AlembicCore / p5-core-project-index-aliases-t1`

## Scope Authority

P5 is an additive Core-touch phase: add zero-behavior `ProjectIndex*` aliases for existing cold-start and knowledge-rescan planning entrypoints, keep all old names and frozen literals stable, do not migrate call sites, do not collapse folders, then re-pin `Alembic/vendor/AlembicCore` and `AlembicPlugin/vendor/AlembicCore`.

No REAL-TEST is required for P5 by the design because it is alias-only and behavior-neutral. REAL-TEST resumes at P6/P9/P10/P11/P12/P13.

## Commits Reviewed

- AlembicCore: `8e71bbd500992c625b1696f3b04f0f2fa8273608` (`Add project index public aliases`)
- Alembic: `f9af5f8eaefe27189a3af742d2457ccb4bd04c58` (`Re-pin AlembicCore vendor for project index aliases`)
- AlembicPlugin: `384338921d16a937852216849554ae352018a565` (`Re-pin AlembicCore vendor for project index aliases`)

## Raw Code Evidence

- Core changed files only:
  - `AlembicCore/src/host-agent-workflows.ts`
  - `AlembicCore/src/plans.ts`
  - `AlembicCore/test/PublicHostAgentWorkflowEntrypoints.test.ts`
- `src/host-agent-workflows.ts` and `src/plans.ts` add re-export aliases:
  - `buildProjectIndexFullPlan = buildColdStartWorkflowPlan`
  - `buildProjectIndexIncrementalPlan = buildKnowledgeRescanWorkflowPlan`
  - `buildProjectIndexGapPlan = buildKnowledgeRescanPlan`
  - `createProjectIndexIntentFullHostAgent = createHostAgentColdStartIntent`
  - `createProjectIndexIntentFullInternal = createInternalColdStartIntent`
  - `createProjectIndexIntentIncrementalHostAgent = createHostAgentKnowledgeRescanIntent`
  - `createProjectIndexIntentIncrementalInternal = createInternalKnowledgeRescanIntent`
  - `ProjectIndexFullWorkflowIntent` and `ProjectIndexIncrementalWorkflowIntent` are type aliases only.
- `PublicHostAgentWorkflowEntrypoints.test.ts` proves each new alias is the same function object as the old name from both `host-agent-workflows` and `plans`.
- Existing frozen `response.tool` proof remains in the same test: `coldStartPlan.response.tool === 'alembic_bootstrap'`.

## Fresh Controller Validation

All commands were run from this controller review after the target result arrived.

- `AlembicCore`: `npm run build:check` passed.
- `AlembicCore`: `npm run lint` passed (`Checked 643 files`).
- `AlembicCore`: `npm run test -- test/PublicHostAgentWorkflowEntrypoints.test.ts` passed (`1 file / 5 tests`).
- `AlembicCore`: `npm run build` passed.
- `AlembicCore`: package subpath import proof passed for `@alembic/core/host-agent-workflows` and `@alembic/core/plans`; all old/new alias identity checks returned `true`.
- `AlembicCore`: `rg` over `dist/host-agent-workflows.{js,d.ts}` and `dist/plans.{js,d.ts}` found the ProjectIndex aliases and type aliases.
- `AlembicCore`: `git diff --check HEAD^ HEAD` passed.
- `Alembic`: `npm run build:check` passed and used local Core source `../AlembicCore`.
- `AlembicPlugin`: `npm run build:check` passed and reported Core source `../AlembicCore @ 8e71bbd500992c625b1696f3b04f0f2fa8273608`.
- `Alembic`: `git ls-files -s vendor/AlembicCore` reports `160000 8e71bbd500992c625b1696f3b04f0f2fa8273608`.
- `AlembicPlugin`: `git ls-files -s vendor/AlembicCore` reports `160000 8e71bbd500992c625b1696f3b04f0f2fa8273608`.
- `Alembic` and `AlembicPlugin`: `git diff --check HEAD^ HEAD` passed.

## Controller Judgment

P5 meets the assigned scope. The implementation is additive alias-only, preserves old public names and frozen literals, has package-level import proof, and propagates the Core commit to both consumer vendor pins. No product-code blocker or missing evidence remains.
