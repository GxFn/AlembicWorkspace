# RG-7 Plugin Create/Evolve Immediate Freshness Controller Review

Date: 2026-06-22
Controller: AlembicWorkspace
Dispatch group: `rg7-plugin-create-evolve-immediate-freshness-p1`
Task: `rg7-plugin-create-evolve-immediate-freshness-t1`
Target: AlembicPlugin

## Controller Acceptance

- User goal: complete RG-7 Plugin consumer timing repair so create/evolve success paths refresh per-recipe source refs and vector state through the accepted Core freshness primitive.
- Scope reviewed: AlembicPlugin commit `d0ff86f3ab407370b2e903c79dff0397c21b5bfc` on top of accepted AlembicCore producer `a156e0d796d396e02d815ca22147c83d59bf880b`.
- Original requirement authority: RG-7 requires immediate per-recipe source_refs + vector freshness after create/evolve; forbids RG-8 commit-driven/rename/rescan/merge-base work and Plugin-local duplicate Core implementations.
- Target/window: AlembicPlugin only. AlembicCore remained at `a156e0d796d396e02d815ca22147c83d59bf880b`.
- Evidence reviewed: target result `tr-rg7-plugin-create-evolve-immediate-freshness-t1.json`; commit stat/name-status; changed files; implementation reads for `RecipeFreshnessRuntime`, `KnowledgeModule`, submit router, evolve handler, clean-output allowlist, and unit tests; controller reran validations below.
- Implementation reality: Plugin registers Core `RecipeFreshnessService` with Core `SourceRefReconciler`, `recipeSourceRefRepository`, and `vectorService`; submit refreshes only `gatewayResult.created` after save and before response; KnowledgeModule create event now delegates to Core freshness while preserving `SearchEngine.refreshIndex`; evolve refreshes verified/deprecated recipe rows and reports proposal-only/skipped outcomes as freshness skipped; public MCP outputs add bounded `freshness` and `retrievalMayBeStale`.
- Validation result: controller reruns passed for build, targeted tests, boundary gates, release boundary, diff whitespace, and Alembic Guard.
- Blockers: none.
- Missing evidence: no missing review evidence for RG-7 scope. Full repository `npm run test` / `npm run check` are still not whole-repo acceptance because unrelated pre-existing failures were reported by target and not introduced by this task.
- Residual risks: `npm run lint` exits 0 with existing warnings in unrelated host-adapter/scripts; proposal-only evolve intentionally does not refresh content/vector because `EvolutionGateway` does not mutate recipe content for those outcomes.
- TODO/backlog rollup: RG-7 Plugin consumer closes. RG-8 remains the next in-scope phase for commit-driven unified evolution; do not treat this RG-7 result as RG-8 coverage.
- Decision: accept-target-result.
- Next action: reduce and accept this review candidate, then plan the next eligible RG-8 package if the state root has no hard gate.

## Raw Evidence

- `git -C AlembicPlugin show --stat --summary --oneline d0ff86f3ab407370b2e903c79dff0397c21b5bfc`: 10 files changed, 1274 insertions, 172 deletions; added `lib/service/knowledge/RecipeFreshnessRuntime.ts`, `test/unit/EvolveFreshness.test.ts`, and `test/unit/KnowledgeModuleFreshness.test.ts`.
- `git -C AlembicPlugin diff --name-status d0ff86f3ab407370b2e903c79dff0397c21b5bfc^ d0ff86f3ab407370b2e903c79dff0397c21b5bfc`: only the 10 RG-7 Plugin files changed.
- `git -C AlembicCore rev-parse HEAD`: `a156e0d796d396e02d815ca22147c83d59bf880b`.
- `git -C AlembicPlugin rev-parse HEAD`: `d0ff86f3ab407370b2e903c79dff0397c21b5bfc`.
- RG-8 overreach scan over the commit diff for `GitDiff`, `rename`, `rescan`, `merge-base`, `commit-driven`, `module-mining`, `lease`, `rescanId`, `new-module`, `catch-up`: no matches.

## Controller Validation

- `npm run build:check`: PASS. Core build used `../AlembicCore @ a156e0d796d396e02d815ca22147c83d59bf880b`; `tsc --noEmit` passed.
- `npm run test -- EvolveFreshness KnowledgeModuleFreshness SubmitKnowledgeRouter McpCoreToolsCleanOutputContract`: PASS, 4 files / 21 tests.
- `npm run lint`: PASS exit 0; 17 existing warnings in unrelated host-adapter/scripts.
- `npm run lint:repo-boundary`: PASS.
- `npm run lint:layer-boundary`: PASS.
- `npm run lint:core-import-boundary`: PASS, 396 files and 415 `@alembic/core` imports scanned.
- `npm run verify:release-package-boundary`: PASS, `ok: true`, release boundary intact.
- `git diff --check`: PASS.
- `alembic_status(projectRoot=AlembicPlugin, aspect=knowledge)`: ready / knowledge_ready.
- `alembic_code_guard` explicit 10-file scope: PASS, guard result `guard-public-mqo8f6qe-2`, 0 violations / 0 warnings.
