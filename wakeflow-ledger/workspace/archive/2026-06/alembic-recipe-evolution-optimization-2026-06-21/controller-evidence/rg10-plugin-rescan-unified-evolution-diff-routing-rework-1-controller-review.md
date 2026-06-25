# RG-10 Plugin Rescan Unified Evolution Diff Routing Rework 1 Controller Review

Date: 2026-06-22
Controller: AlembicWorkspace
Dispatch group: `rg10-plugin-rescan-unified-evolution-diff-routing-rework-1-p1`
Task: `rg10-plugin-rescan-unified-evolution-diff-routing-rework-1-t1`
Target: AlembicPlugin

## Controller Acceptance

- User goal: remove the Plugin-side blocker found by RG-10 Test retry-3 so the real BiliDili acceptance chain can be rerun.
- Scope reviewed: Wakeflow review pack, target result envelope, target evidence markdown, task package, retry-3 controller review, AlembicPlugin commit diff, changed implementation files, changed tests, and controller-rerun validation.
- Original requirement authority: RG-10 still requires real BiliDili four-step Test acceptance. This Plugin repair can only close the public `alembic_rescan` commit-driven evolution blocker; it is not final demand completion.
- Target/window: AlembicPlugin stayed inside Plugin public MCP workflow/evolution projection surfaces. It did not edit AlembicCore or Test and did not run the full BiliDili Test chain, which matches the dispatch boundary.
- Evidence reviewed: target result `tr-rg10-plugin-rescan-unified-evolution-diff-routing-rework-1-t1.json`, target evidence `target-evidence/rg10-plugin-rescan-unified-evolution-diff-routing-rework-1-t1.md`, AlembicPlugin commit `df14353cc3ef5698215e0e4373d348232a114f35`, task package `rg10-plugin-rescan-unified-evolution-diff-routing-rework-1-p1`, and prior controller review `rg10-test-bilidili-scenario-acceptance-retry-3-controller-review.md`.
- Implementation reality: `attachPluginOpportunisticEvolutionSurface` now detects an already embedded `unifiedEvolution` surface and returns it unchanged. This directly addresses retry-3's inconsistency where top-level `gitDiffEvidence` had the correct rename/modified/created events but the wrapper's second scan overwrote nested `unifiedEvolution` with no-op empty diff evidence.
- Implementation reality: `FileChangeHandler` now normalizes comparable source paths by removing line ranges for matching, repairs high-confidence rename sourceRefs using the original row key, and preserves line ranges on the new path. This directly addresses retry-3's old `VideoFeedViewModel.swift:1-78` active/generated sourceRef with `repaired=0`.
- Implementation reality: committed `git-head` modified events that touch covered sourceRefs now emit `source-modified-review-needed` generationChangeLog evidence when working-tree diff content is no longer available. This directly addresses retry-3's `modified=1` with no public proposal/changeLog evidence for `FeedRepository.swift`.
- Implementation reality: new-module recommendation behavior and Plan/moduleScope preservation remain covered by the extended RG-10 fixture.
- Validation result: Controller reran `npm run test -- test/unit/FileChangeHandler.test.ts test/unit/PluginOpportunisticEvolution.test.ts test/unit/PlanDrivenGenerationGate.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts` -> 4 files / 46 tests passed. Controller reran `npm run build:check` -> passed with Core `b18754d1ff238613af8619c294787f6a4ca6d4d8`. Controller reran `git diff --check HEAD~1..HEAD` -> passed. Target also reported changed-file Biome passed, `npm run lint` exit 0 with pre-existing unrelated warnings, and Alembic Guard `guard-public-mqot35xr-1` -> 5 files, 0 violations.
- Blockers: None for this AlembicPlugin repair package.
- Missing evidence: Full real BiliDili RG-10 acceptance has not been rerun after commit `df14353cc3ef5698215e0e4373d348232a114f35`.
- Residual risks: `npm run lint` still prints pre-existing unrelated warnings while exiting 0. The final requirement still depends on Test proving the real BiliDili chain under public MCP runtime.
- TODO/backlog rollup: Accept this Plugin repair. Create a new Test retry package using AlembicPlugin commit `df14353cc3ef5698215e0e4373d348232a114f35` and AlembicCore commit `b18754d1ff238613af8619c294787f6a4ca6d4d8`; Test should rerun the real BiliDili four-step chain and stop on first blocker with raw evidence.
- Decision: accept-target-result.
- Next action: create-next-package for RG-10 Test BiliDili acceptance retry after this product repair.

## Raw Evidence Notes

- Commit: `df14353cc3ef5698215e0e4373d348232a114f35` (`df14353 fix rg10 rescan unified evolution routing`).
- Changed implementation files: `lib/recipe-generation/evolution/FileChangeHandler.ts`, `lib/runtime/mcp/host/opportunistic-evolution-presenter.ts`.
- Changed test files: `test/unit/FileChangeHandler.test.ts`, `test/unit/PluginOpportunisticEvolution.test.ts`, `test/unit/PlanDrivenGenerationGate.test.ts`.
- Controller-rerun focused tests: 46/46 passed.
- Controller-rerun build/check: `build:check` and `git diff --check HEAD~1..HEAD` passed.
- Test fixture assertions now cover: top-level and nested `gitDiffEvidence` equality; `headChanged=true`; three commit events; line-ranged sourceRef repair from old path to renamed path; committed modified path generationChangeLog evidence; new-module recommendation; moduleScope preservation across requested and planned modules.
