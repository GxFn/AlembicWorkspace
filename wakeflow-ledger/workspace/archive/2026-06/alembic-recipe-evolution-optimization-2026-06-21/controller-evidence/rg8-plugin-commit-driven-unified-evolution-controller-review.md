# RG-8 Plugin Commit-Driven Unified Evolution Controller Review

Date: 2026-06-22
Controller: AlembicWorkspace
Dispatch group: `rg8-plugin-commit-driven-unified-evolution-p1`
Task: `rg8-plugin-commit-driven-unified-evolution-t1`
Target: AlembicPlugin

## Controller Acceptance

- User goal: complete RG-8 Plugin commit-driven unified evolution so ordinary Plugin-owned Alembic tool calls compare previous HEAD/signature to current git state and route changed code through one evolution path for rename repair, logic-change proposals, deleted-source deprecation proposals, and new-module scoped scan recommendations.
- Scope reviewed: AlembicPlugin commit `4af4f1fc7ac3c161b59319abe32dbf96a9983a63` on top of accepted AlembicCore producer `a156e0d796d396e02d815ca22147c83d59bf880b`.
- Original requirement authority: RG-8 requires replacing the retired `alembic_task` close-only opportunistic path with commit-driven HEAD comparison on relevant Plugin-owned host-agent tools; requires deterministic rename/copy diff evidence with default 90% threshold, merge-base catch-up fallback, scale guard, Core-backed source_ref/evolution/freshness routing, bounded clean output, and Plan/no-double-write boundary. RG-9 cleanup, RG-10 BiliDili/Test validation, daemon/watch/git-hook behavior, and broad Recipe quality evaluation are out of scope.
- Target/window: AlembicPlugin only. AlembicCore remained at `a156e0d796d396e02d815ca22147c83d59bf880b`.
- Evidence reviewed: target result `tr-rg8-plugin-commit-driven-unified-evolution-t1.json`; commit stat/name-only; implementation reads for presenter attachment, Plugin opportunistic surface, GitDiffScanner, GitDiffCheckpointService, FileChangeDispatcher, FileChangeHandler, and focused tests; controller reran validations below.
- Implementation reality: `HostMcpServer.callPluginOwnedTool` attaches `attachPluginOpportunisticEvolutionSurface` after embedded Plugin-owned tool execution; retired `alembic_task` still returns `CODEX_TOOL_RETIRED` before Guard/evolution. `COMMIT_DRIVEN_TRIGGER_TOOLS` now covers relevant host-agent tools including `alembic_bootstrap`, `alembic_code_guard`, `alembic_plan`, `alembic_rescan`, `alembic_submit_knowledge`, `alembic_work`, and `alembic_evolve`, while `alembic_search` and retired `alembic_task` do not attach.
- Routing reality: presenter keeps a container-scoped checkpoint keyed by projectRoot + ProjectScope identity, scans git state, routes non-truncated ancestor HEAD-range events through `FileChangeHandler`, and returns bounded `unifiedEvolution` output. If resident ProjectScope can handle the folder and HEAD did not change, Plugin fallback defers; no daemon/watch/git-hook route was added.
- Diff reality: `GitDiffScanner` runs `git diff --name-status -M90% -C90% previous..current` after merge-base confirms `previousHead` is an ancestor; non-ancestor or unavailable merge-base returns observable fallback instead of dispatching a misclassified range; oversized event batches set `scale-guard:*` and truncate before routing.
- Core-backed classification reality: high-confidence rename uses `recipeSourceRefRepository.replaceSourcePath` plus `RecipeFreshnessService.refreshRecipes`; low-confidence rename also submits an `EvolutionGateway` update proposal; modified covered code emits quality signal and submits update proposals for pattern/direct impact; deleted covered code submits low-confidence deprecation proposals instead of deleting Recipes; created path in a covered module is no-op/coverage; created path in a new module emits a module-mining/scoped-scan recommendation and quality signal without Plan writes.
- Plan boundary: `UnifiedEvolutionReport.planBoundary` explicitly records `generationStateWrites: 0`, `planIntentWrites: 0`, and `projectedFromExistingDbSources: true`; no Plugin-local Plan generation-state mirror or codeRecipeMapping persistence was added.
- Validation result: controller reruns passed for targeted RG-8 tests, build, touched-file Biome, boundary gates, release boundary, diff whitespace, and Alembic Guard.
- Blockers: none for RG-8 Plugin slice.
- Missing evidence: no missing controller evidence for this package. RG-10 still owns the real BiliDili scenario chain and vector-degraded observation; this RG-8 review does not claim that final scenario coverage.
- Residual risks: Alembic status still reports selected-project/host-project mismatch, but explicit AlembicPlugin `projectRoot` Guard passed. Container-scoped checkpoints are process-local; a fresh Plugin process starts with no previous HEAD and establishes the first checkpoint on the next relevant tool call. Full `test:unit` remains red from unrelated pre-existing search/prime/HostMcpServer tests, not RG-8 touched files.
- TODO/backlog rollup: RG-8 Plugin closes. RG-9 cleanup/rebaseline is next eligible if state reduction has no hard gate; RG-10 Test remains later final scenario validation.
- Decision: accept-target-result.
- Next action: reduce and accept this review candidate, then continue to the next eligible phase.

## Raw Evidence

- `git -C AlembicPlugin show --stat --summary --oneline 4af4f1fc7ac3c161b59319abe32dbf96a9983a63`: 10 files changed, 1306 insertions, 36 deletions; added `lib/service/FileChangeDispatcher.ts`, `lib/service/evolution/FileChangeHandler.ts`, and `lib/service/evolution/git-diff-checkpoint/GitDiffCheckpointService.ts`.
- Changed source/test files: `lib/runtime/evolution/PluginOpportunisticEvolution.ts`, `lib/runtime/mcp/host/opportunistic-evolution-presenter.ts`, `lib/service/FileChangeDispatcher.ts`, `lib/service/evolution/FileChangeHandler.ts`, `lib/service/evolution/git-diff-checkpoint/GitDiffCheckpointService.ts`, `lib/service/evolution/git-diff-checkpoint/GitDiffScanner.ts`, `lib/service/evolution/git-diff-checkpoint/index.ts`, `test/unit/FileChangeHandler.test.ts`, `test/unit/GitDiffCheckpoint.test.ts`, `test/unit/PluginOpportunisticEvolution.test.ts`.
- `git -C AlembicCore rev-parse HEAD`: `a156e0d796d396e02d815ca22147c83d59bf880b`.
- Presenter read: `opportunistic-evolution-presenter.ts` lines 31-88 scans git, routes `FileChangeHandler`, stores checkpoint, and attaches `data.unifiedEvolution`; lines 123-158 resolve Core-backed repositories/services from the Plugin container.
- Surface read: `PluginOpportunisticEvolution.ts` lines 225-244 make trigger attachment commit-driven and exclude retired `alembic_task`; lines 187-193 return routed output when unified evolution handled events; lines 196-211 keep fallback as non-auto-submitting proposal only.
- Diff scanner read: `GitDiffScanner.ts` lines 14-16 set default 90% rename threshold and max event guard; lines 200-243 perform merge-base check and `-M90%/-C90%` HEAD range diff; lines 126-131 enforce scale guard.
- Handler read: `FileChangeHandler.ts` lines 176-197 repair rename pointers and low-confidence proposals; lines 200-241 classify modified covered code; lines 245-275 create deprecation proposals for deleted covered sources; lines 278-330 emit new-module recommendation/signal; lines 426-448 refresh affected Recipes.

## Controller Validation

- `npm run test -- test/unit/PluginOpportunisticEvolution.test.ts test/unit/FileChangeHandler.test.ts test/unit/GitDiffCheckpoint.test.ts`: PASS, 3 files / 41 tests.
- `npm run build:check`: PASS. Core build used `../AlembicCore @ a156e0d796d396e02d815ca22147c83d59bf880b`; `tsc --noEmit` passed.
- `./node_modules/.bin/biome check` over the 10 RG-8 touched source/test files: PASS.
- `npm run lint`: PASS exit 0 with 17 existing warnings in unrelated host-adapter/scripts; no RG-8 touched files failed.
- `npm run lint:core-import-boundary`: PASS, 399 files and 421 `@alembic/core` imports scanned.
- `npm run lint:layer-boundary`: PASS.
- `npm run lint:repo-boundary`: PASS, escape-hatch count 0 / 75.
- `npm run verify:release-package-boundary`: PASS, `ok: true`, release boundary intact.
- `git diff --check`: PASS.
- `alembic_status(projectRoot=AlembicPlugin)`: ready/knowledge_ready, daemon removed/stopped as expected, selected-project mismatch noted.
- `alembic_code_guard` explicit 7-source-file scope: PASS, guard result `guard-public-mqo9hm7p-1`, 0 violations / 0 warnings.
- `npm run test:unit`: FAIL existing unrelated unit suite. JSON reporter showed failed assertions in `HostMcpServer.test.ts` (7), `RecipeRelationChainProvider.test.ts` (1), `SearchEngine.test.ts` (10), `SearchPrimeIsolationBoundary.test.ts` (1), `SearchRanking.test.ts` (10), plus import-level failure in `HitRecorder.test.ts`. None are RG-8 touched files; the targeted RG-8 tests above pass.
