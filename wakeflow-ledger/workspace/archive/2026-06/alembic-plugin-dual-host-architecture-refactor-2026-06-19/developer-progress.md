# AlembicPlugin Dual-Host (Codex + Claude Code) Architecture Refactor And Layering 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-plugin-dual-host-architecture-refactor-2026-06-19 - AlembicPlugin Dual-Host (Codex + Claude Code) Architecture Refactor And Layering
主状态: completed
阶段: 无
当前任务包: dh-0-precheck-cc-host-feasibility(accepted), dh-0b-alembic-drift-backport(accepted), dh-1-host-abstraction-unify-delete-generic(accepted), dh-2-l3-hostadapter-interface-codex-migration(accepted), dh-3-claude-code-adapter-l2-rewire-decodex(accepted), dh-3b-l2-rewire-decodex-migration(accepted), dh-3c-decodex-rename-routing-migration(accepted), dh-3d-decodex-rename-migration-finale(accepted), dh-3e-decodex-full-rename-finale(accepted), dh-3f-decodex-bulk-complete(accepted), dh-3g-design-shared-workspace-io-structure(accepted), dh-3g-decodex-shared-workspace-cluster(accepted), dh-4a-plugin-per-host-products-cc-shell-gitlink(accepted), dh-4b-alembic-shared-asset-drift-per-host(accepted), dh-4c-plugin-cross-shell-gate-selfcheck-cc-bootstrap(accepted), dh-5-cleanup-test-parity-rc678(accepted), dh-6-cc-real-acceptance(accepted), dh-7-agenthost-default-from-pluginhost(accepted)
窗口: AlembicPlugin(accepted), Alembic(accepted), Design(accepted), Test(accepted)
阻塞项: 无
下一步: wakeflow-render-progress
评审: demand-completed
自动化: 未启用
需要用户决策: 无
最后更新: 2026-06-20 18:58 CST
来源状态: revision 74 / event evt-20260620105757-0074
<!-- unified-status:end -->

## 目标

把 AlembicPlugin（daemon-removal 后纯 MCP 非强进程，基线 HEAD afbf25e）真正做成 Codex + Claude Code 双宿主插件：5 层架构（L4 per-host shell / L3 host adapter[新建,对称 codex+claude-code] / L2 两 MCP 表面 / L1 host-agnostic 内核 / L0 Core 消费；单向依赖 L4→L3→L2→L1→L0；host-name 分支只允许在 L3）+ host 抽象统一 + 执行层去 Codex-only。性质=补能力非收拾（深挖确认现态 Codex 100% / cc ~5% 图式占位 / generic 0%）。9 项已决：① 全量 RC-1~8；② 删 generic-host-agent（AGENT_HOSTS 收敛 codex+claude-code）；③ L3 留 Plugin 不下沉 Core；④ 真双 identity（env 由 hostShape 派生、删 ALEMBIC_PLUGIN_HOST=codex 硬编码 + 加 CLAUDE_CODE_PLUGIN_HOST + per-host expectedPluginHost）；⑤ per-host 产物对等（skills/templates/constitution 分叉）；⑥ de-Codex 52 误命名 host-agnostic Codex* 去前缀归 L1/L2（RC-3b，区别于 ~40 真 host-specific 抽 L3）；⑦ 跨仓 Plugin+Alembic（共享资产漂移门禁单 path→per-host path + check-shared-asset-drift.mjs，治理权威在 Alembic 侧）；⑧ pre-existing 漂移 RED 纳入（DH-0 先同步绿）；⑨ 验收 cc 在 workspace 内由 Test、codex 由用户在 codex host 外部验收。不变量：保持纯 MCP 非强进程不回退、L3 不引入常驻进程；不改四工具对外 MCP 语义/业务行为；不下沉 L3 到 Core；CC3 文案统一不在本需求（DH-4 只做结构 per-host 分叉）。跨仓覆盖：AlembicPlugin=全部 DH（host 抽象/L3 adapter/de-Codex/per-host 产物/清理/测试）；Alembic=共享资产漂移门禁 per-host + 同步 pre-existing 漂移（治理权威）；AlembicCore=observing（连接层 host-blind、无 Core 改、仅复核消费门禁）；Test=cc 端真实验收。

## 完成定义

DH-6（claude-code 在 workspace 内真实验收）：cc 端 init/status/工具行为与 codex 真对等；保持 daemon-removal 纯 MCP 非强进程不变量（无常驻进程、不回退已删能力）；四工具对外 MCP 语义不变；共享资产漂移门禁绿（per-host 模型）；build/test 绿；de-Codex 后 `Codex*` 误命名清零、层级单向依赖（host-name 分支只在 L3）；generic-host-agent 已删（AGENT_HOSTS=codex+claude-code）。codex 路径由用户在 codex host 外部真实验收（workspace 外，不含于本需求 DH-6 实跑）。

## 阶段计划

执行序：DH-0 → 1 → 2 → 3 → 4 → 5 → 6。**DH-2→3 硬序**：先建 L3 接口 + codex 实现迁入（不改行为），再新建 cc adapter + L2 改调 L3 + de-Codex；先替代/对等、不裸断；每步门禁绿、保活路径。 | DH-0 盘点+前置（硬前置，不重构）：① 先把 pre-existing 漂移门禁 RED 同步绿（alembic-recipes/structure shared 段 + recipes-setup/README，plugin RC5 改 main 未同步——诊断精确 diff + 正确同步方向 + 哪侧 apply；跨仓）；② **cc-host hooks 可行性研究（open question）**：CC 是否暴露与 codex 等价 host hooks（transport / 项目根发现 / init profile / env / tier / diagnostics / JobStore / execution context 8 簇）——决定 cc adapter 形态；缺口大须回报用户；③ CC3 文案划界确认（DH-4 只结构分叉、CC3 文案统一另案、互不阻塞）；④ 跨仓协调点清单（Alembic 漂移门禁治理）；⑤ 基线（build/test/drift-gate 现状 + 复核 92 个 Codex* surface：~40 真 host-specific→L3 / ~52 误命名 host-agnostic→去前缀归 L1/L2）。 | DH-1 host 抽象统一 + 删 generic（RC-1/5；RuntimeContext.ts:45/62、cc manifest:32/33、cc bootstrap:100、Diagnostics.ts:542、AGENT_HOSTS 去 generic + 6 文件）。 | DH-2 建 L3 HostAdapter 接口 + codex 实现迁入（RC-2，先对齐现状不改行为）。 | DH-3 新建 claude-code adapter + L2 改调 L3 + 52 误命名 de-Codex 归 L1/L2（RC-2/3/3b，双宿主对等执行）。 | DH-4 per-host 产物对等 + 漂移门禁模型改 per-host（RC-4，跨仓 Alembic 协调 + CC3 划界）。 | DH-5 清理遗留收口 + 测试对等（RC-6/7/8）。 | DH-6 验收（cc workspace 内 Test；codex 用户外部）。 主窗口=AlembicPlugin（全部 DH）；Alembic participates（DH-0 漂移诊断/DH-4 门禁 per-host）；AlembicCore observing；Test cc 验收。基线=AlembicPlugin HEAD afbf25e（daemon-removal + MC-3p 后）。本需求 next-mainline（daemon-removal 后继）；与 Core 优化需求（独立、未 intake）的并行/先后由控制器排程。

## 任务包

## 回填摘要

## 决策和追加日志
