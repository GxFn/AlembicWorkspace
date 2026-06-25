# RG-10 Test BiliDili Scenario Acceptance Retry 2 Controller Review

Date: 2026-06-22
Controller: AlembicWorkspace
Dispatch group: `rg10-test-bilidili-scenario-acceptance-retry-2-p1`
Task: `rg10-test-bilidili-scenario-acceptance-retry-2-t1`
Target: Test

## Controller Acceptance

- User goal: finish RG-10 by proving the real BiliDili Swift test-mode chain after accepted Core and Plugin repairs.
- Scope reviewed: Test TargetResultEnvelope, Test retry-2 summary, raw MCP probe JSON, post-reconfirm rescan JSON, isolated BiliDili worktree commit, and prior accepted Core/Plugin repair evidence.
- Original requirement authority: RG-10 requires the real four-step chain: truthful Plan, scoped ProjectContext-anchored Recipe creation with immediate retrieval, real commit-driven unified evolution, and observable vector degradation. Product repair evidence cannot replace this Test acceptance.
- Target/window: Test stayed in evidence mode, used isolated worktrees, returned a blocked TargetResultEnvelope, and did not modify the original BiliDili checkout.
- Positive evidence: Test used AlembicPlugin commit `14cd105d8296367c33471e922a3472118fe80bd9` and AlembicCore commit `b18754d1ff238613af8619c294787f6a4ca6d4d8`. Focused `alembic_plan draft` selected `architecture` from real Swift/UI/networking/concurrency/module signals, strict `confirm` succeeded without `allowSignatureMismatch`, and focused `alembic_bootstrap` succeeded with matching ProjectContext signature `pcsig:77b9582aaaa27580e4c4e0e56751694eee56093886322c7d7eb22635f3dd5fc0`.
- Positive evidence: Three architecture Recipes were submitted and `alembic_dimension_complete` succeeded. `alembic_submit_knowledge` reported vector degradation as `embed-provider-missing`; `alembic_search` returned direct matches and `alembic_recipe_map` returned three recipe mounts. This is acceptable equivalent immediate retrieval under vector-degraded mode even though `alembic_prime` still returned degraded `knowledge-empty`.
- Positive evidence: Completed bootstrap session no longer blocked follow-on rescan as `BOOTSTRAP_IN_PROGRESS`. First post-commit `alembic_rescan` blocked with `PLAN_PROJECT_CONTEXT_STALE`, which is the expected stale-Plan guard after the controlled BiliDili commit changed ProjectContext. After Plan refresh and strict reconfirm with signature `pcsig:43f69ab5883ecc5a736341334016b5161f5147f350605c3e2b1dd64cb990ceb2`, `alembic_rescan` returned `status=ready` with matching signature.
- Controlled commit evidence: Isolated BiliDili commit `65bab21a68f7c5a9fd273ce8e3e1abeb9f3a1279` performed a high-confidence rename from `Sources/Features/VideoFeed/VideoFeedViewModel.swift` to `Sources/Features/VideoFeed/RG10VideoFeedViewModel.swift`, modified `Sources/Infrastructure/Networking/Repository/FeedRepository.swift`, and added `Sources/RG10AcceptanceProbe/RG10AcceptanceProbe.swift`.
- Blocking evidence: High-confidence rename sourceRef repair did not meet acceptance. After refreshed Plan reconfirm and ready rescan, `alembic_recipe_map` and `planState.codeRecipeMapping` still reported the old missing path `Sources/Features/VideoFeed/VideoFeedViewModel.swift:1-78` as `generated` and `active`; the new `RG10VideoFeedViewModel.swift` path was not reflected as a repaired sourceRef, and no stale diagnostic explained the mismatch.
- Blocking evidence: Logic-change proposal evidence did not meet acceptance. After reconfirmed rescan, `pendingProposals=[]` and `generationChangeLog=[]`, so the controlled `FeedRepository.swift` logic edit was not surfaced as a proposal, lifecycle event, or equivalent visible evolution record.
- Blocking evidence: New-module handling is partial. Refreshed Plan detects `Sources/RG10AcceptanceProbe` as planned, and coverage reports `planned=1 generated=0 missing=1`, but no Recipe, proposal, scoped scan recommendation, or module-mining signal is generated; `alembic_graph` after reconfirmed rescan returned partial with zero nodes and zero relations.
- Blocking evidence: Reconfirmed rescan output narrowed `moduleScope` to `["Sources/Features/VideoFeed"]` even though the confirmed Plan boundary included `Sources/Features/VideoFeed`, `Sources/Infrastructure/Networking`, and `Sources/RG10AcceptanceProbe`.
- Validation result: Retry-2 removes the prior focused Plan gate, immediate retrieval, vector degradation, and completed-session blockers, but it does not satisfy RG-10 commit-driven unified evolution.
- Blockers: (1) Rename lifecycle/sourceRef repair does not update or stale-mark old generated refs after high-confidence rename. (2) Logic edits do not produce proposals or change-log evidence. (3) New module addition is planned/missing but not routed to module-mining or scoped recommendation. (4) Rescan module scope loses confirmed Plan module bindings.
- Missing evidence: No successful real BiliDili commit-driven evolution evidence for rename auto-repair, logic proposal routing, or new-module recommendation after strict Plan reconfirm.
- Residual risks: The remaining blocker is on the public Plugin rescan/evolution orchestration surface. If lower-level Core primitives are the actual owner, Plugin must return precise Core interface evidence rather than masking the gap in Test.
- TODO/backlog rollup: Do not redispatch Test again yet. Create one AlembicPlugin rework package for commit-driven evolution/sourceRef lifecycle repair. Test should retry only after controller accepts that product repair.
- Decision: request-rework.
- Next action: reduce this Test result as rework, then dispatch AlembicPlugin repair.

## Raw Evidence

- Test result: `.wakeflow-active/current/alembic-recipe-evolution-optimization-2026-06-21/target-results/tr-rg10-test-bilidili-scenario-acceptance-retry-2-t1.json`.
- Test summary: `Test/tmp/rg10-test-bilidili-scenario-acceptance-retry-2-20260622/evidence/rg10-retry2-target-result-summary.md`.
- Primary probe: `Test/tmp/rg10-test-bilidili-scenario-acceptance-retry-2-20260622/evidence/rg10-retry2-mcp-probe.json`.
- Reconfirm/rescan probe: `Test/tmp/rg10-test-bilidili-scenario-acceptance-retry-2-20260622/evidence/rg10-retry2-rescan-after-reconfirm.json`.
- Positive retrieval evidence: `alembic_search:afterSubmit` returned ready direct matches and `alembic_recipe_map:afterSubmit` returned ready with three mounts under observable vector degradation.
- Expected stale guard evidence: first post-commit rescan returned `PLAN_PROJECT_CONTEXT_STALE`; reconfirmed rescan returned `status=ready` with signature `pcsig:43f69ab5883ecc5a736341334016b5161f5147f350605c3e2b1dd64cb990ceb2`.
- Failing rename evidence: post-rescan `planState.codeRecipeMapping` keeps old `Sources/Features/VideoFeed/VideoFeedViewModel.swift:1-78` as generated/active while the controlled commit renamed it to `Sources/Features/VideoFeed/RG10VideoFeedViewModel.swift`.
- Failing proposal evidence: post-rescan `pendingProposals=[]` and `generationChangeLog=[]`.
- Failing new-module evidence: refreshed Plan detects `Sources/RG10AcceptanceProbe`, coverage reports it as missing, and no recipe/proposal/recommendation closes the gap.

## Rework Boundary

AlembicPlugin should repair the commit-driven unified evolution path exposed through public MCP workflows:

- After a confirmed Plan is refreshed/reconfirmed and `alembic_rescan` returns ready, high-confidence rename should automatically repair Recipe sourceRefs from old path to new path, or explicitly stale-mark the old ref with a diagnostic and lifecycle/change-log record that makes the gap visible.
- Logic edits should produce an evolution proposal, change-log entry, or equivalent public evidence that the unified evolution router classified and recorded the change.
- New modules inside the confirmed Plan boundary should produce a module-mining/scoped-scan recommendation, proposal, or generated Recipe signal; a planned/missing row alone is not enough.
- Rescan should preserve the confirmed Plan module boundary across all changed/planned modules, not narrow to only the rename folder when the commit also touches logic and new-module paths.
- Preserve strict Plan confirmation, `PLAN_PROJECT_CONTEXT_STALE`, vector-degradation observability, and the existing four-tool public MCP semantics.
- Do not edit Test. If the root cause is AlembicCore-owned, return a blocker with the exact Core API/primitive, failing inputs, and raw evidence needed for a Core package.
