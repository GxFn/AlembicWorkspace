# RG-10 Test BiliDili Scenario Acceptance Retry 1 Controller Review

Date: 2026-06-22
Controller: AlembicWorkspace
Dispatch group: `rg10-test-bilidili-scenario-acceptance-retry-1-p1`
Task: `rg10-test-bilidili-scenario-acceptance-retry-1-t1`
Target: Test

## Controller Acceptance

- User goal: finish RG-10 by proving the real BiliDili Swift test-mode chain after the accepted Plan ProjectContext repairs.
- Scope reviewed: Test result `rg10-test-bilidili-scenario-acceptance-retry-1-t1-result`, Test summary, focused and unfocused fresh MCP probe JSON, rescan retry JSON, search/map JSON, bootstrap session state, dimension checkpoint, isolated BiliDili worktree commit, and targeted Plugin/Core source reads for likely owner attribution.
- Original requirement authority: RG-10 requires four real-scenario facts: planning truthfulness, scoped ProjectContext-anchored Recipe creation with immediate retrieval, real commit-driven unified evolution, and observable vector degradation. It must not bypass confirmed Plan, run a full cold-start/fullReset, or treat mock/status-only evidence as acceptance.
- Target/window: Test stayed in its assigned evidence role. It used isolated worktrees, left the original BiliDili checkout untouched, and returned a blocked TargetResultEnvelope with raw evidence refs.
- Evidence reviewed: `target-results/rg10-test-bilidili-scenario-acceptance-retry-1-t1-result.json`, `Test/tmp/rg10-test-bilidili-scenario-acceptance-retry-1-20260622/evidence/rg10-retry-target-result-summary.md`, `rg10-retry-mcp-probe.json`, `rg10-retry-mcp-probe-unfocused-v3.json`, `rg10-retry-rescan-resume-v3.json`, `rg10-retry-search-existing-v3.json`, `active-sessions.json`, `architecture.json`, `git show --name-status 1295826...`, and source refs in AlembicPlugin/AlembicCore.
- Implementation reality: Test proved the current repair is partial. A focused BiliDili `alembic_plan draft` and default strict `confirm` now succeed with real Swift/SwiftUI/UIKit/networking/concurrency/module signals, but focused `alembic_bootstrap` immediately fails the generation Plan gate with `PLAN_PROJECT_CONTEXT_STALE`.
- Positive evidence: An unfocused bounded Plan path reached `alembic_bootstrap`, submitted three source-backed Recipes, completed `architecture` with `recipesBound=3` and `isBootstrapComplete=true`, wrote a generated skill projection, and exposed vector degradation as `availabilityStatus=unavailable`, `availabilityReason=embed-provider-missing`, with entry/region sync skipped.
- Blocking evidence: After dimension completion, `alembic_rescan` fails in both same-session and fresh-session probes with `BOOTSTRAP_IN_PROGRESS` for session `bs-<redacted>`, even though the session records completed `architecture`, candidateCount=3, and dimension completion returned `isBootstrapComplete=true`.
- Blocking evidence: Immediate retrieval is not acceptable. `alembic_prime` returns degraded `knowledge-empty`, `alembic_search` returns zero direct matches for the submitted RG-10 knowledge, and only `alembic_recipe_map` exposes three mounts.
- Blocking evidence: Source-ref diagnostics are unreliable. `recipe_map` marks `FeedRepository.swift` and `HomeCategoryView.swift` stale, while controller verified both files still exist in the isolated BiliDili worktree. Only the renamed `VideoFeedViewModel.swift` source path is actually absent.
- Validation result: Test's local Plugin worktree build passed before probes. Controller independently verified the isolated commit contains exactly one rename, one logic edit, and one new Swift module, and that the original BiliDili worktree retained its pre-existing dirty state without Test changes.
- Blockers: (1) Plugin focused Plan generation gate does not reuse the focused signature scope that strict confirm now preserves. (2) Core bootstrap session lifecycle treats a completed single-dimension session as still active, blocking rescan/evolution. (3) Core source-ref reconciliation/path resolution misclassifies existing relative paths as stale, degrading retrieval and evolution evidence. (4) Plugin public retrieval/search surfaces do not provide acceptable immediate retrieval for the submitted Recipe output under vector-degraded mode.
- Missing evidence: No successful commit-driven unified evolution run after the controlled commit; no rename auto-repair/source_ref repair; no logic-change proposal; no new-module recommendation accepted through the required rescan path; no acceptable immediate prime/search retrieval.
- Residual risks: The unfocused path is useful evidence but not a substitute for the scoped Plan-driven path required by RG-10. Vector degradation itself is observable and should be preserved as a positive invariant during repair.
- TODO/backlog rollup: Do not re-dispatch Test yet. Create product rework packages for AlembicPlugin and AlembicCore; Test should retry only after those blockers have controller-accepted evidence.
- Decision: request-rework.
- Next action: reduce this Test result as rework, then dispatch cross-repo repair tasks to AlembicPlugin and AlembicCore.

## Raw Evidence

- Focused route: `rg10-retry-mcp-probe.json` step `alembic_bootstrap` returned `PLAN_PROJECT_CONTEXT_STALE`; expected `pcsig:1e83483694a496be096b15132b9260f4407381ddb5aaa3c087dcf2b479d5a158`, actual `pcsig:99efca7a33d378e74c45b8320aaf3622713c1ada010d6abe93412ffe7ee15487`.
- Unfocused route: `rg10-retry-mcp-probe-unfocused-v3.json` draft signature was `pcsig:99efca7a33d378e74c45b8320aaf3622713c1ada010d6abe93412ffe7ee15487`; dimension completion returned `status=ready`, `recipesBound=3`, `isBootstrapComplete=true`, `remainingDimensions=[]`, `skillCreated=true`.
- Submitted Recipes: `<redacted>`, `<redacted>`, `<redacted>`.
- Vector degradation: submitted Recipe freshness reported `vector.status=degraded`, `availabilityStatus=unavailable`, `availabilityReason=embed-provider-missing`, `entrySyncStatus=skipped`, `regionSyncStatus=skipped`.
- Rescan blocker: `rg10-retry-mcp-probe-unfocused-v3.json` and `rg10-retry-rescan-resume-v3.json` both return `BOOTSTRAP_IN_PROGRESS` for session `bs-<redacted>`.
- Completed session evidence: `architecture.json` records `candidateCount=3`, `referencedFiles=3`, the three Recipe ids, `skillCreated=true`, and `completedAt`; `active-sessions.json` records `completedDimensions.architecture`.
- Retrieval blocker: `alembic_prime` returns degraded `knowledge-empty` with `prime-vector-evidence-unavailable`; `alembic_search` returns zero direct matches; `alembic_recipe_map` returns three mounts but partial status and stale-ref diagnostics.
- Source-ref false stale: `find` in the isolated BiliDili worktree shows `Sources/Infrastructure/Networking/Repository/FeedRepository.swift` and `Sources/Features/Home/Views/HomeCategoryView.swift` exist; `Sources/Features/VideoFeed/RG10VideoFeedViewModel.swift` exists after the controlled rename.
- Controlled commit: `git show --name-status 1295826a17cdcb6422290e062cdd8262ff31d906` shows `R100 VideoFeedViewModel.swift -> RG10VideoFeedViewModel.swift`, modified `FeedRepository.swift`, and added `Sources/RG10AcceptanceProbe/RG10AcceptanceProbe.swift`.
- Original BiliDili checkout: `git -C BiliDili status --short --branch` still shows pre-existing user dirty files; Test did not mix changes into that checkout.
- Owner attribution: AlembicPlugin `plan-generation-gate.ts:116-183` calls `routePlanTool(get)` and blocks when signature mismatch is reported; AlembicCore `BootstrapSession.ts:247-249` defines completion but loaded complete sessions remain in active session storage; AlembicCore `SourceRefReconciler.ts:246-279` owns source path existence checks.

## Rework Boundary

AlembicPlugin should repair the focused Plan generation gate and public retrieval surface:

- A focused BiliDili-like `alembic_plan draft` followed by default strict `confirm` must allow `alembic_bootstrap` testMode to pass the Plan gate without `allowSignatureMismatch`.
- Generation-stage Plan `get` must preserve or reuse the confirmed Plan's ProjectContext signature scope, not compare a focused confirmed Plan against an unfocused current signature.
- Immediate retrieval after source-backed Recipe submission must be acceptable through `prime`, `search`, `recipe_map`, or a clearly equivalent public MCP/API surface under vector-degraded mode.
- Preserve `PLAN_REQUIRED` before confirmation and preserve observable vector degradation when embeddings are unavailable.

AlembicCore should repair session/source-ref primitives:

- A completed bootstrap session must not block `alembic_rescan`; session lifecycle/lease checks must distinguish active in-progress from complete.
- SourceRef reconciliation must resolve project-relative paths correctly in Ghost/test-mode workspaces and must not mark existing files stale.
- Commit-driven evolution evidence should remain able to classify rename, logic edit, and new module after the controlled commit.
