# 推进 Alembic 激活链主动化：安装引导、冷启动建议、四工具 prime/search/recipe_map/graph 主动消费、双宿主加载与使用测量闭环；按 Design §10.6 P0-P4 严格阶段验收。 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-proactive-activation-2026-07-03 - 推进 Alembic 激活链主动化：安装引导、冷启动建议、四工具 prime/search/recipe_map/graph 主动消费、双宿主加载与使用测量闭环；按 Design §10.6 P0-P4 严格阶段验收。
主状态: planned
阶段: 无
当前任务包: p0-plugin-cc-skill-discovery-usage-baseline-p1(accepted), p1-plugin-consumption-wording-guidance-p1(accepted)
窗口: AlembicPlugin(accepted)
阻塞项: 无
下一步: add-task-package, complete-demand, wakeflow-render-progress
评审: decision-accept
自动化: 未启用
需要用户决策: 无
最后更新: 2026-07-07 15:44 CST
来源状态: revision 10 / event evt-20260707074408-0010
<!-- unified-status:end -->

## 目标

Deliver the requirement described by the delivered docs: [plan](../../../Design/docs/current/alembic-proactive-activation-original-plan-2026-07-03.md) [design](../../../Design/docs/current/alembic-proactive-activation-2026-07-03.md)

## 完成定义

Total control confirms the completion definition from the delivered docs before dispatch.

## 阶段计划

Derive the stage plan from the delivered docs: [plan](../../../Design/docs/current/alembic-proactive-activation-original-plan-2026-07-03.md) [design](../../../Design/docs/current/alembic-proactive-activation-2026-07-03.md)

## 任务包

## 回填摘要

## 决策和追加日志

## Task Packages

- 2026-07-07T06:47:43.368Z p0-plugin-cc-skill-discovery-usage-baseline-p1 → AlembicPlugin — P0 evidence gate for proactive activation: verify Claude Code project skill discovery path, implement/expose WS-1 session per-tool usage measurement, and capture true-machine baseline for prime/search/recipe_map/graph usage before proactive wording changes. (intent: P0-A decides cc skill path before WS-2; WS-1 measurement must quantify baseline before active wording/guidance changes.)
- 2026-07-07T07:25:46.883Z p1-plugin-consumption-wording-guidance-p1 → AlembicPlugin — P1 WS-4 proactive consumption wording and guidance: update three knowledge-tool descriptions with when-to-use/user-intent keywords, add prime-to-search routing, and add guidance/stagedProtocol consumption loop while preserving four-tool output schemas and non-goal text. (intent: P1 makes existing knowledge tools more likely to be selected by hosts by adding when-to-use keywords and a prime→search/map/graph consumption loop, without changing tool semantics, schemas, output contracts, or lifecycle behavior.)
- 2026-07-07T07:44:45.435Z p1b-core-managed-block-pathguard-p1 → AlembicCore — P1b WS-5 Core foundation: add Alembic managed-block utility and PathGuard project-root writable-file allowlist hook for host context files. (intent: P1b starts with Core producer work so Plugin/host consumers can later write short host context managed blocks safely without bypassing PathGuard or duplicating marker logic.)
- 2026-07-07T08:10:44.177Z p1b-plugin-managed-block-refresh-wiring-p1 → AlembicPlugin — P1b WS-5 Plugin consumer wiring: consume Core managed-block utility and PathGuard root-file allowlist to write/remove host context guidance blocks from refreshKnowledgeSkills. (intent: P1b continues from accepted Core producer work into Plugin refreshKnowledgeSkills so standard non-ghost projects get a tiny host-visible managed guidance pointer while empty/ghost projects remain silent and user content outside the managed block is preserved.)
- 2026-07-07T08:30:39.966Z p1b-alembic-host-guidance-pathguard-config-p1 → Alembic — P1b WS-5 Alembic main consumer check/config: verify and, if needed, wire Alembic main's PathGuard/runtime configuration for host context managed guidance writes after accepted Core + Plugin WS-5 work. (intent: The requirement scope explicitly includes Alembic main for WS-5 pathGuard configure expansion. This package keeps that boundary narrow: prove whether main has a real WS-5 consumer path, and implement only the minimal PathGuard/managed-block configuration if the main source owns such a consumer.)
- 2026-07-07T08:38:51.572Z p2-plugin-host-aware-skill-export-p1 → AlembicPlugin — P2 WS-2 host-aware project skill export for AlembicPlugin: use the accepted P0 finding that Claude Code project skills load from .claude/skills while Codex remains .agents/skills, then route project-skill export and write-prefix authorization through the host adapter without changing public tool contracts. (intent: Implement the recommended architecture path: L3 HostAdapter.projectSkillRoot(projectRoot), Codex path byte-stable, Claude Code path from P0 proof, and PathGuard prefix coupling updated with the same host-aware root.)
- 2026-07-07T08:55:17.989Z p2b-plugin-cold-start-skill-auto-sync-p1 → AlembicPlugin — P2b WS-6: cold-start final completion automatically refreshes project knowledge skills and host guidance once, so accepted WS-2 host-aware skill export and WS-5 managed block become available without manual alembic_project_skill refresh. (intent: Wire the dimension-completion finalizer tail to refreshKnowledgeSkills only on final full completion, after WS-2/WS-5 are accepted.)
- 2026-07-07T09:13:15.387Z p3-plugin-source-presence-onboarding-p1 → AlembicPlugin — P3 WS-3: add source-presence probing and needs_init onboarding split so host-visible status recommends alembic_bootstrap only for uninitialized projects that actually contain source code, without auto-running cold-start. (intent: Implement SourcePresenceProbe and strengthen StatusService needs_init onboarding while preserving empty-project restraint and not touching main SetupService.)
- 2026-07-07T09:35:31.820Z p4-final-dual-host-proactive-activation-realtest-p1 → Test — P4 final real-machine dual-host acceptance gate for alembic-proactive-activation: verify the full installed activation chain across Codex and Claude Code after P0-P3 are accepted, including managed host guidance loading, project skill visibility, proactive prime/search/recipe_map/graph usage, usage-count lift, empty/ghost restraint, KB-delete cleanup, and four-tool contract non-regression. (intent: Run true Codex and Claude Code host-session validation; this is acceptance evidence only, not product implementation or repair.)

## Decisions And Append Log

- 2026-07-07T06:54:59.743Z dispatched p0-plugin-cc-skill-discovery-usage-baseline-t1 → AlembicPlugin (delivery delivery-p0-plugin-cc-skill-discovery-usage-baseline-p1__AlembicPlugin__p0-plugin-cc-skill-discovery-usage-baseline-t1)
- 2026-07-07T07:24:58.399Z decision accept (candidate tc-20260707072436-0005) — Accept P0 AlembicPlugin result. Controller reviewed raw evidence in evidence/controller-review-p0-plugin-cc-skill-discovery-usage-baseline-2026-07-07.md: official docs confirm Claude Code project skills under .claude/skills; true-machine Claude Code 2.1.199 probe loaded /alembic-claude-probe from .claude/skills and rejected the .agents/skills control; commit 195b9b2227b7ab5fb6995bc0e361636338bc947d implements session-only usage tracking for prime/search/recipeMap/graph at both HostMcpServer and routed McpServer status paths; clean output allowlist includes usage; controller reran targeted vitest 2 files/50 tests and npm run build:check successfully. WS-2 host-aware export remains next phase, not P0 scope.
- 2026-07-07T07:28:00.550Z dispatched p1-plugin-consumption-wording-guidance-t1 → AlembicPlugin (delivery delivery-p1-plugin-consumption-wording-guidance-p1__AlembicPlugin__p1-plugin-consumption-wording-guidance-t1)
- 2026-07-07T07:44:08.575Z decision accept (candidate tc-20260707074358-0009) — Accept P1 WS-4 for AlembicPlugin. Controller reviewed commit 0bf5734, raw source lines, and tests: tool descriptions now add when-to-use wording for recipe_map/search/graph while preserving bullets and Non-goal text; prime now recommends alembic_search first; initialize guidance and onboarding stagedProtocol include the prime-to-search consumption loop. Controller reran targeted unit tests (76 passed), Zod schema integration test (19 passed), npm run build:check, npm run check, git diff --check, and alembic_code_guard guard-public-mracdaj4-1 (8 explicit files, 0 violations). No WS-2/WS-5/WS-6 or output schema semantic changes were made.
- 2026-07-07T07:45:29.068Z dispatched p1b-core-managed-block-pathguard-t1 → AlembicCore (delivery delivery-p1b-core-managed-block-pathguard-p1__AlembicCore__p1b-core-managed-block-pathguard-t1)
- 2026-07-07T08:10:24.075Z decision accept (candidate tc-20260707080952-0013) — Accepted AlembicCore P1b WS-5 producer result after controller raw-evidence review. Commit 783b9f52aaa83767f4564ac8489cdfaf445bab35 adds @alembic/core/io managed guidance block helpers and PathGuard.addProjectWritableFile without Plugin/main wiring. Controller verified Design §10.5 scope, target evidence, changed files, implementation behavior, npm run build:check, targeted vitest 3 files/61 tests, lint:public-api-boundary, and git whitespace checks. Remaining work is consumer wiring in Plugin/main, not Core rework.
- 2026-07-07T08:11:07.516Z dispatched p1b-plugin-managed-block-refresh-wiring-t1 → AlembicPlugin (delivery delivery-p1b-plugin-managed-block-refresh-wiring-p1__AlembicPlugin__p1b-plugin-managed-block-refresh-wiring-t1)
- 2026-07-07T08:29:36.993Z decision accept (candidate tc-20260707082929-0017) — Controller reviewed raw Plugin diff, task package, design section 10.5/10.6/10.7, Core producer semantics, and reran targeted unit/contract/build/check commands. Plugin P1b WS-5 managed host guidance refresh wiring satisfies the task boundary; WS-6 and true host-session validation remain later gates.
- 2026-07-07T08:31:18.373Z dispatched p1b-alembic-host-guidance-pathguard-config-t1 → Alembic (delivery delivery-p1b-alembic-host-guidance-pathguard-config-p1__Alembic__p1b-alembic-host-guidance-pathguard-config-t1)
- 2026-07-07T08:38:17.690Z decision accept (candidate tc-20260707083810-0021) — Accepted Alembic main P1b WS-5 consumer check. Controller reviewed Design §10.5/§10.6, target result, accepted Core/Plugin producer evidence, main PathGuard configuration, skill delivery code, and reran Alembic unit/build/diff checks. No Alembic commit is correct because main has no WS-5 host guidance writer; adding AGENTS.md/CLAUDE.md allowlisting without a writer would weaken root-file protection. Plugin owns the actual refreshKnowledgeSkills managed-block consumer.
- 2026-07-07T08:39:24.114Z dispatched p2-plugin-host-aware-skill-export-t1 → AlembicPlugin (delivery delivery-p2-plugin-host-aware-skill-export-p1__AlembicPlugin__p2-plugin-host-aware-skill-export-t1)
- 2026-07-07T08:53:30.509Z decision accept (candidate tc-20260707085321-0025) — Accepted P2 Plugin host-aware project skill export. Controller reviewed Design §10.2/§10.6, P0 Claude Code path proof, target result, commit dc85c94, host adapter implementation, ProjectSkillDelivery/ProjectSkillService call chain, PathGuard prefix coupling, MCP/schema wording changes, and reran unit/integration/build/check/diff validations. Evidence proves Codex stays .agents/skills, Claude Code uses .claude/skills, runtime export/refresh delegate through HostAdapter, and the non-selected skill root remains blocked. WS-3/WS-6/P4 remain later phases.
- 2026-07-07T08:55:47.266Z dispatched p2b-plugin-cold-start-skill-auto-sync-t1 → AlembicPlugin (delivery delivery-p2b-plugin-cold-start-skill-auto-sync-p1__AlembicPlugin__p2b-plugin-cold-start-skill-auto-sync-t1)
- 2026-07-07T09:12:49.085Z decision accept (candidate tc-20260707091217-0029) — Accept P2b WS-6: raw source and controller rerun tests prove cold-start final dimension completion now triggers one ProjectSkillService.refreshKnowledgeSkills path after the existing finalizer, partial completion does not trigger, repeated already-complete submissions skip refresh, Codex/Claude host-aware roots and managed guidance blocks are reused through accepted WS-2/WS-5 paths, no-KB/ghost project-root guidance remains silent, and contract/build/check gates passed. A stale target evidence ref was repaired to the existing task-package JSON before reduction; no product evidence or result conclusion changed.
- 2026-07-07T09:14:41.146Z dispatched p3-plugin-source-presence-onboarding-t1 → AlembicPlugin (delivery delivery-p3-plugin-source-presence-onboarding-p1__AlembicPlugin__p3-plugin-source-presence-onboarding-t1)
- 2026-07-07T09:34:49.254Z decision accept (candidate tc-20260707093442-0033) — Accepted P3 AlembicPlugin source-presence onboarding. Controller reviewed Design section 10.3/10.6, task package, target result, commit e7dda4f, SourcePresenceProbe and StatusService call chain, and reran targeted status/onboarding tests, Zod schema contract, build:check, npm check, and diff checks. Evidence proves sourceful uninitialized projects receive only a non-running post-init alembic_bootstrap recommendation, empty and ghost-empty projects remain without bootstrap guidance, ghost+source still returns onboarding guidance, no .asd/jobs side effects are created, needs_bootstrap remains separate, and no Alembic main SetupService or job runner code was touched. P4 real host validation remains the next gate.
- 2026-07-07T09:36:09.386Z dispatched p4-final-dual-host-proactive-activation-realtest-t1 → Test (delivery delivery-p4-final-dual-host-proactive-activation-realtest-p1__Test__p4-final-dual-host-proactive-activation-realtest-t1)
- 2026-07-09T23:11:49.459Z decision accept (candidate tc-20260709231149-0038) — Administrative closure per user decision 2026-07-09: legacy demands closed for a fresh development start. P0-P3 all accepted with evidence earlier; P4 real-test recorded as an honest blocked terminal result (never executed), accepted with --accept-blocked as the explicit override.
- 2026-07-09T23:11:49.516Z demand completed — Administrative closure 2026-07-09 (user decision): 8/9 packages individually accepted with evidence; P4 real-test closed as blocked-accepted, residual risk recorded on the terminal result.
- 2026-07-09T23:12:10.227Z archived → wakeflow-ledger/workspace/archive/2026-07/alembic-proactive-activation-2026-07-03 — Administrative legacy closure 2026-07-09; workspace resets for fresh demand development.

## Backfill Summaries

- 2026-07-07T07:17:07.329Z AlembicPlugin/p0-plugin-cc-skill-discovery-usage-baseline-t1 returned completed (result tr-p0-plugin-cc-skill-discovery-usage-baseline-t1)
- 2026-07-07T07:38:50.410Z AlembicPlugin/p1-plugin-consumption-wording-guidance-t1 returned completed (result tr-p1-plugin-consumption-wording-guidance-t1)
- 2026-07-07T08:07:25.943Z AlembicCore/p1b-core-managed-block-pathguard-t1 returned completed (result tr-p1b-core-managed-block-pathguard-t1)
- 2026-07-07T08:22:54.268Z AlembicPlugin/p1b-plugin-managed-block-refresh-wiring-t1 returned completed (result tr-p1b-plugin-managed-block-refresh-wiring-t1)
- 2026-07-07T08:34:21.669Z Alembic/p1b-alembic-host-guidance-pathguard-config-t1 returned completed (result tr-p1b-alembic-host-guidance-pathguard-config-t1)
- 2026-07-07T08:48:55.591Z AlembicPlugin/p2-plugin-host-aware-skill-export-t1 returned completed (result tr-p2-plugin-host-aware-skill-export-t1)
- 2026-07-07T09:08:11.165Z AlembicPlugin/p2b-plugin-cold-start-skill-auto-sync-t1 returned completed (result tr-p2b-plugin-cold-start-skill-auto-sync-t1)
- 2026-07-07T09:28:54.112Z AlembicPlugin/p3-plugin-source-presence-onboarding-t1 returned completed (result tr-p3-plugin-source-presence-onboarding-t1)
- 2026-07-09T23:11:09.376Z Test/p4-final-dual-host-proactive-activation-realtest-t1 returned blocked (result tr-p4-final-dual-host-proactive-activation-realtest-t1)
