# AlembicPlugin MCP 项目身份解耦与 Recipe Git 门禁删除 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-plugin-mcp-identity-recipe-gate-cleanup-2026-07-12 - AlembicPlugin MCP 项目身份解耦与 Recipe Git 门禁删除
主状态: planned
阶段: 无
当前任务包: p1-plugin-remove-main-selection-and-git-consumer-gates-p1(pending)
窗口: AlembicPlugin(pending)
阻塞项: 无
下一步: prepare-dispatch-from-state, add-task-package, wakeflow-render-progress
评审: 无
自动化: 未启用
需要用户决策: 无
最后更新: 2026-07-12 17:12 CST
来源状态: revision 3 / event evt-20260712091215-0003
<!-- unified-status:end -->

## 目标

Make every AlembicPlugin MCP method depend only on its request-scoped projectRoot/current Codex workspace identity, with no influence from Alembic main selected/active project state; remove every MCP-consumer Git commit/checkpoint freshness gate so Recipe usability is decided only by Recipe-owned lifecycle, schema, sourceRefs and matching logic rather than repository HEAD alignment.

## 完成定义

1) No AlembicPlugin MCP entrypoint, status, diagnostics, onboarding, projectRuntime, bootstrap/rescan response, Dashboard handoff, Prime/Search/Graph/Recipe Map/Guard path reads or reacts to Alembic selectedProject/activeProject state; explicit request projectRoot is the sole MCP project identity. 2) Public MCP outputs contain no host project mismatch/project_handoff_mismatch/handoffAllowed action caused by main-app selection. 3) Search, Graph, Recipe Map, Prime, Guard and Status do not read Git HEAD/checkpoint posture, emit sourceRevisionManifest/gitDiffCheckpoint freshness gates, downgrade otherwise valid results, block conclusions, or require rescan because commits differ. 4) Recipe-owned lifecycle/schema/sourceRefs/content rules remain authoritative; internal bootstrap/rescan producer-side incremental scanning may retain checkpoint storage but it is not a consumer validity gate. 5) Old assertions enforcing mismatch and revision degradation are removed/replaced with regression tests proving foreign selected/active state and advanced HEAD do not change MCP results. 6) Focused tests, exact full unit suite, check, build, runtime package, distribution and Codex plugin verification pass; local plugin is refreshed and controller real MCP readback after restart shows no mismatch or commit-freshness degradation.

## 阶段计划

P1 AlembicPlugin performs a single combined removal/refactor and all repository validation. P2 controller reviews the complete diff and raw tests, refreshes local plugin, then performs direct real MCP status and five-tool regression against explicit AlembicWorkspace/BiliDili roots after Codex restart. No Test window or synthetic environment.

## 任务包

## 回填摘要

## 决策和追加日志

## Task Packages

- 2026-07-12T09:12:15.390Z p1-plugin-remove-main-selection-and-git-consumer-gates-p1 → AlembicPlugin — Remove all Alembic main selected/active project influence from every AlembicPlugin MCP method and response. MCP identity must come only from explicit projectRoot or Codex current workspace, resolving that request's projectId/dataRoot. Delete/disconnect HostProjectAlignment/buildLocalSelectionMismatch from HostMcpServer diagnostics/status/onboarding/ProjectRuntimeContext/ModuleBoundary/Dashboard/bootstrap/rescan and remove public mismatch/handoff fields/actions whose source is global main-app selection. Dashboard MCP must target the request project and report actual service capability without comparing global selection. Remove all MCP-consumer Git commit/checkpoint gates: Status must not require a revision vector for ok/ready; Search/Graph/Recipe Map/Prime/Guard must not build retrieval checkpoint posture, attach gitDiffCheckpoint/sourceRevisionManifest, downgrade results, clear accepted Recipe/Guard material, remember revision manifests for Guard downgrades, or inject rescan actions because HEAD differs. Remove associated schemas/output/docs/tests that exist only for these gates. Recipe validity remains exclusively under Recipe-owned lifecycle/schema/sourceRefs/content/matching rules; do not weaken those rules. Bootstrap/rescan may retain internal commit-driven incremental scanning/checkpoint persistence only as producer mechanics, never as a consumer prerequisite. Replace old assertions with regressions proving foreign selected/active state and advanced HEAD do not change request-scoped MCP identity/results, while request-root/data-root isolation remains intact. Modify and commit AlembicPlugin only. Run focused tests, exact npm run test:unit, npm run check, npm run build, verify:codex-runtime-package, verify:plugin-distribution, verify:codex-plugin, and return root-cause/deleted-chain inventory, diff, commit, raw summaries and self-review. (intent: Delete both external coupling axes from the MCP consumer surface: main selected/active state never participates in request identity, and Git revision checkpoints never decide Recipe usability or downgrade public tool truth.)

## Decisions And Append Log

- 2026-07-12T09:47:51.721Z demand cancelled — Superseded before execution by the user's explicit 2026-07-12 architecture decision: AlembicPlugin MCP must be fully independent from Alembic main/runtime selection, use one request-scoped project-location service, expose query tools without knowledge-state visibility gates, remove revision/checkpoint consumer gates, Prime intent gates, admin tiers, retired alembic_task residue, and obsolete daemon-bridge residue. The pending package was narrower and was never successfully delivered.
- 2026-07-12T09:48:02.803Z archived → wakeflow-ledger/workspace/archive/2026-07/alembic-plugin-mcp-identity-recipe-gate-cleanup-2026-07-12 — Cancelled before execution because the user replaced the incomplete scope with a broader authoritative AlembicPlugin independence architecture.
