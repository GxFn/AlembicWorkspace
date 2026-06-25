# RG-10 Cross-Repo Test Blocker Repair Controller Review

Date: 2026-06-22
Controller: AlembicWorkspace
Dispatch group: `rg10-cross-repo-test-blocker-repair-p1`
Targets: AlembicCore, AlembicPlugin

## Controller Acceptance

- User goal: continue RG-10 after Test retry proved the real BiliDili chain was blocked by Core/Plugin defects, then return to real Test acceptance once product blockers are repaired.
- Scope reviewed: Core task `rg10-core-bootstrap-session-source-ref-repair-t1`, Plugin task `rg10-plugin-focused-plan-gate-retrieval-repair-t1`, prior Test retry controller review, target result JSONs, task packages, commits, changed files, focused tests, and controller-rerun validation.
- Original requirement authority: RG-10 final acceptance still requires the real BiliDili four-step test-mode chain. Product repair evidence can remove blockers, but it is not a substitute for Test's real-scenario acceptance.
- Target/window: AlembicCore stayed in Core primitives and did not edit Plugin/Test. AlembicPlugin stayed in Plugin Plan gate/retrieval surfaces and did not edit Core/Test.
- Evidence reviewed: `tr-rg10-core-bootstrap-session-source-ref-repair-t1-evidence-repair-1.json`, `tr-rg10-plugin-focused-plan-gate-retrieval-repair-t1-evidence-repair-1.json`, Core commit `b18754d1ff238613af8619c294787f6a4ca6d4d8`, Plugin commit `14cd105d8296367c33471e922a3472118fe80bd9`, and `git show` diffs for all changed files named by the target results.
- Implementation reality: Core now treats completed bootstrap sessions as non-blocking leases, exposes `complete` status, resolves single-folder project-relative source refs, and strips line/fragment suffixes before filesystem existence checks. Plugin now reuses the confirmed Plan record's ProjectContext signature scope during `alembic_plan get`/generation gate, keeps stale protection, and adds source-ref anchored keyword retrieval when vector evidence is unavailable.
- Validation result: Controller reran Core `npx vitest run test/BootstrapSessionManager.test.ts test/RecipeFreshnessService.test.ts test/ProjectScopeContracts.test.ts` -> 3 files / 20 tests passed. Controller reran Plugin `npm run test -- test/unit/PlanDrivenGenerationGate.test.ts test/unit/SearchHandlerResidentSearch.test.ts` -> 2 files / 36 tests passed. Both repositories had clean worktrees after their commits.
- Blockers: None for this Core/Plugin repair group.
- Missing evidence: The full RG-10 BiliDili real Test chain has not yet been rerun after these repairs, so final demand completion is not established.
- Residual risks: Core `npm run check` remains blocked by pre-existing naming-gate files unrelated to this repair; Core Alembic Guard did not produce usable findings because the MCP returned an internal schema error. These do not block this repair acceptance because repository build/lint/full tests and controller-rerun focused tests cover the changed surfaces.
- TODO/backlog rollup: Accept the two product repair tasks. Create a new Test retry package using accepted Core commit `b18754d1ff238613af8619c294787f6a4ca6d4d8` and accepted Plugin commit `14cd105d8296367c33471e922a3472118fe80bd9`; it must rerun the real BiliDili four-step chain and stop on first blocker with owner attribution.
- Decision: accept-target-result.
- Next action: create-next-package for RG-10 Test retry after product blocker repair.

## Raw Evidence Notes

- Core session blocker coverage: `BootstrapSession.isBlockingLease` is false for complete sessions, `getSessionStatus` can return `state=complete`, and same-project session creation after completed restart is covered by `BootstrapSessionManager.test.ts`.
- Core source-ref coverage: `ProjectScope` permits relative refs only when the ProjectScope index has one source folder, and `RecipeFreshnessService.test.ts` keeps existing `FeedRepository.swift` and `HomeCategoryView.swift` refs active while marking the renamed old `VideoFeedViewModel.swift` ref stale.
- Plugin Plan gate coverage: `PlanDrivenGenerationGate.test.ts` proves focused Swift confirmed Plan drives bootstrap testMode with scoped signature reuse, and a focused source change after confirmation still returns `PLAN_PROJECT_CONTEXT_STALE`.
- Plugin retrieval coverage: `SearchHandlerResidentSearch.test.ts` proves keyword mode admits source-ref path matches when vector evidence is unavailable while the public clean output still omits `sourceRefs`.
