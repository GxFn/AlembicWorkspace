# 移除被否决的独立 strict-test-dimension 实现 进度

## 统一状态

<!-- unified-status:start -->
需求: strict-test-split-removal-2026-08-03 - 移除被否决的独立 strict-test-dimension 实现
主状态: planned
阶段: 无
当前任务包: rollback-strict-test-main-p1(pending), rollback-strict-test-dashboard-p1(pending), rollback-strict-test-agent-p1(pending), rollback-strict-test-core-p1(pending)
窗口: Alembic(pending), AlembicDashboard(pending), AlembicAgent(pending), AlembicCore(pending)
阻塞项: 无
下一步: prepare-dispatch-from-state, add-task-package, wakeflow-render-progress
评审: 无
自动化: 未启用
需要用户决策: 无
最后更新: 2026-08-03 22:46 CST
来源状态: revision 6 / event evt-20260803144634-0006
<!-- unified-status:end -->

## 目标

从 Alembic Main、AlembicDashboard、AlembicAgent 和 AlembicCore 中完整删除被用户否决的独立 strict-test-dimension 分叉，不设计替代测试模式，不恢复 legacy bootstrap，不改 DaemonJob。

## 完成定义

四个仓库按已验证提交归因完成精确回滚并提交；独立 strict-test-dimension 路由、契约、运行时、公共导出、探针、生成操作、UI 消费者、测试/fixtures 零残留；通用 strict production/cold-start 能力保留；Dashboard 不重新触发 legacy bootstrap；所有仓库检查通过且工作树干净。

## 阶段计划

依赖顺序：先 Alembic Main；Main 经控制器验收后并行 AlembicDashboard 与 AlembicAgent；Agent 经控制器验收后 AlembicCore。每个阶段只做错误实现删除与回归验证，不做替代设计。

## 任务包

## 回填摘要

## 决策和追加日志

## Task Packages

- 2026-08-03T14:46:34.040Z rollback-strict-test-main-p1 → Alembic — 移除 Alembic Main 中被否决的独立 strict-test-dimension 私有管线和公开 API
- 2026-08-03T14:46:34.119Z rollback-strict-test-dashboard-p1 → AlembicDashboard — 移除 Dashboard 中被否决的 strict-test-dimension 消费者并保持冷启动入口 fail closed
- 2026-08-03T14:46:34.209Z rollback-strict-test-agent-p1 → AlembicAgent — 移除 Agent 中被否决的 strict-test-dimension receipt 与执行集成
- 2026-08-03T14:46:34.291Z rollback-strict-test-core-p1 → AlembicCore — 移除 Core 中被否决的 strict-test-dimension 自动选择 profile/receipt 基础

## Decisions And Append Log

- 2026-08-03T14:47:55.323Z dispatched rollback-strict-test-main-t1 → Alembic (delivery delivery-rollback-strict-test-main-p1__Alembic__rollback-strict-test-main-t1)
- 2026-08-03T15:07:32.383Z decision accept (candidate tc-20260803150710-0008) — Controller Acceptance: user goal is removal of the rejected independent strict-test split without replacement or legacy fallback. Reviewed Alembic Main task only against rollback-decision.md and rollback-strict-test-main-p1. Five consecutive revert commits restore the exact c95dccb tree; fresh controller probes confirm tree/diff equality, zero dedicated strict-test symbols, no extra legacy/DaemonJob diff, npm run build:check PASS, focused 4-file/32-test strict production/cold-start suite PASS, dashboard generated-type drift PASS, and clean worktree. No blocker or missing evidence remains. Residual work is the already-authorized dependent Dashboard, Agent, then Core removal tasks; no new TODO is added.
- 2026-08-03T15:08:31.255Z dispatched rollback-strict-test-dashboard-t1 → AlembicDashboard (delivery delivery-rollback-strict-test-dashboard-p1__AlembicDashboard__rollback-strict-test-dashboard-t1)
- 2026-08-03T15:26:25.340Z decision accept (candidate tc-20260803152551-0011) — 接受 AlembicDashboard 回滚。控制器独立确认：d965cf690568e63a85423a138867d926afe22e94 是 6562eb13e9ccc204021a8580a2045c25a9ad9697 的标准 revert，且其树与被否决提交的父树完全一致；b6df7904e668301013f4d120fb24027d1f1edd6c 仅修改 App、定向契约测试和中英文不可用提示，移除 handleColdStart/api.bootstrap 与 CandidatesView 的 onColdStart 绑定，使入口 fail closed。严格测试专用 adapter/controller/hook/panel/generated operation/test/import 符号扫描为零；保留的 /modules/test-mode 全局状态读取早于错误分叉且未接入 Candidates。控制器重跑 npm run check：lint、生成契约漂移、边界、41/41 测试、typecheck、production build 全通过；生成 API 类型与已接受 Main canonical 字节一致，git diff-check 通过且工作树干净。没有恢复 legacy bootstrap、没有引入替代测试模式、没有修改 DaemonJob 或其他仓库。
- 2026-08-03T15:27:22.220Z dispatched rollback-strict-test-agent-t1 → AlembicAgent (delivery delivery-rollback-strict-test-agent-p1__AlembicAgent__rollback-strict-test-agent-t1)
- 2026-08-03T15:50:35.337Z decision accept (candidate tc-20260803155001-0014) — 接受 AlembicAgent 回滚。控制器独立确认四个新提交分别标准 revert 8688311c3970054c68a74b0ce30d8f3db4f15be6、4a2649f0d758a43f0884af5377c8b8531eed0b41、077f4f6f08da731a40547c90f085460f434087f1、7dfb4bada72d78a5bc9e65cafa54574cb36ae698；当前相对首个产品提交父树的净 patch-id 与保留的 248d1ed 完全一致，AGENTS.md/CLAUDE.md 等于 248d1ed 后状态，工作树干净。专用 StrictTestDimension/receipt/automatic-selection authority、runtime binding、prompt/probe/fixtures/tests 在源码、测试、脚本、配置、文件名和重建 dist 中零残留，而通用 strictProduction 生产链仍存在。控制器重跑 build:check 与普通生产聚焦回归，5 files/50 tests 全通过；综合 check 的 build/lint/边界/layer/doctrine/naming/provider-neutral/public-signature 均通过，validation floor 与 retired-symbol 检查通过。全量测试独立复现 72 files pass、589 pass、20 fail；20 个失败全部来自未改动的 durable-semantic-review-runtime.test.ts 调用相邻 Core 当前未导出的 createProjectContextFileRef，失败测试文件与 package-lock 相对回滚前未变化，package.json 唯一变化为删除本次专用 probe script，因此该红灯是任务前既有外部基线，不是本次回滚回归，也不授权 Agent 修改 Core。没有替代测试模式、legacy bootstrap、DaemonJob 或相邻仓库变化。
- 2026-08-03T15:51:23.654Z dispatched rollback-strict-test-core-t1 → AlembicCore (delivery delivery-rollback-strict-test-core-p1__AlembicCore__rollback-strict-test-core-t1)
- 2026-08-03T16:11:49.705Z decision accept (candidate tc-20260803161120-0017) — Core 回滚满足三项确认锚点：六笔 revert 与指定原提交逐笔 inverse patch-id 一致、父链连续，024209d 规则文档保留且最终净树相对 f6e3f19 仅含 AGENTS.md/CLAUDE.md；专用 strict-test-dimension profile、automatic-selection receipt、公开导出及聚焦测试零残留；build:check、关键 4 文件 29 项回归、Core 全量 1905 项与公共 API/跨仓导入/层级/空间边界均通过，通用 cold-start compiler 和 26 维度 catalog 仍可运行。npm run check 唯一非零是实施前后相同且未改动的 ASTChunker.ts:32 doctrine 基线。Agent 全量仍有既存 20 项失败，原因为其测试继续从 @alembic/core/project-context-foundation 导入 createProjectContextFileRef，而 Core 的 f6e3f19 已将该函数冻结到 @alembic/core/project-context；本次六笔 Core 回滚未触及该 facade，Agent 回滚也未触及该测试，因此它是相邻既存契约迁移缺口，不是本纯回滚任务回归，也不授权在此需求内修复。
- 2026-08-03T17:35:52.668Z demand completed — 四个已授权回滚任务均经控制器独立验收；错误的独立 strict-test-dimension 分叉已删除，通用生产冷启动能力保留，Dashboard 保持无 legacy 网络回退。正确的全局测试模式属于用户新确认的独立 supplement，不续写本需求。
- 2026-08-03T17:36:46.676Z archived → wakeflow-ledger/workspace/archive/2026-08/strict-test-split-removal-2026-08-03 — 已验收并完成纯回滚需求；后续正确的全局测试模式作为独立 supplement 继续。

## Backfill Summaries

- 2026-08-03T15:02:44.043Z Alembic/rollback-strict-test-main-t1 returned completed (result tr-rollback-strict-test-main-t1)
- 2026-08-03T15:22:34.708Z AlembicDashboard/rollback-strict-test-dashboard-t1 returned completed (result tr-rollback-strict-test-dashboard-t1)
- 2026-08-03T15:38:32.117Z AlembicAgent/rollback-strict-test-agent-t1 returned needs-review (result tr-rollback-strict-test-agent-t1)
- 2026-08-03T16:03:31.355Z AlembicCore/rollback-strict-test-core-t1 returned needs-review (result tr-rollback-strict-test-core-t1)
