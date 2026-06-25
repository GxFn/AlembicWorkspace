# Alembic 两仓接口与功能职责清理(RIC)——MCP 归一 Plugin / 检索下沉 RecipeContext / Alembic 回归项目管理+Agent+知识库 daemon 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-plugin-core-responsibility-interface-cleanup-2026-06-17 - Alembic 两仓接口与功能职责清理(RIC)——MCP 归一 Plugin / 检索下沉 RecipeContext / Alembic 回归项目管理+Agent+知识库 daemon
主状态: completed
阶段: 无
当前任务包: ric-2a-core-context-facade-completion(accepted), ric-2b-plugin-interface-migration(accepted), ric-3-alembic-delete-resident(accepted), ric-2a2-core-guard-framework-agnostic-option(accepted), ric-4-alembic-http-boundary-cleanup(accepted), ric-2d-plugin-guard820-framework-agnostic(accepted), ric-7-plugin-residue-daemon-slim(accepted), ric-8-daemon-audit-governance-decouple(accepted), ric-4b-core-multifile-ast-test-ownership(accepted), ric-4c-alembic-delete-projintel-shim(accepted)
窗口: AlembicCore(accepted), AlembicPlugin(accepted), Alembic(accepted)
阻塞项: 无
下一步: wakeflow-render-progress
评审: demand-completed
自动化: 未启用
需要用户决策: 无
最后更新: 2026-06-18 02:27 CST
来源状态: revision 37 / event evt-20260617182741-0037
<!-- unified-status:end -->

## 目标

四工具 + ProjectContext/RecipeContext 拆分(GMAP)完成后,梳理 Alembic/AlembicPlugin 两仓接口与功能职责:MCP 能力归一 AlembicPlugin、知识检索逻辑收敛进 Core RecipeContext、Alembic 回归"项目管理 + API-AI Agent + 知识库本地 daemon"、删中间重复与越界面。三仓 charter:Plugin=MCP 唯一承载(四工具 + 生命周期 + 宿主 agent 路线编排)、Alembic=项目管理+API-AI Agent+知识库 daemon(持有本地 DB + AI provider 路线编排)、Core=ProjectContext+RecipeContext+共享骨架(guard/evolution/host-agent-workflows)+基础设施。用户裁决 D1-D4 已定。本需求依赖 GMAP(已 completed,RecipeContext 已落 Core main)。

## 完成定义

1) 两仓 Core 检索类消费零直连(knowledge读/search/vector/candidate/recipe/quality/dimensions 改调 @alembic/core/recipe-context 高阶 API),Plugin retrieval/* 下沉;2) MCP 协议端点仅 AlembicPlugin(lint 通过)、Alembic lib/resident/ 删除(B1)、删前 routes/task|skills|candidates 三处委托改调 Service/RecipeContext;3) Alembic 知识检索 HTTP 保留作 daemon/Dashboard 入口、内部改调 RecipeContext(D1);治理 HTTP 留 Alembic 暴露、实现下沉 Core 子模块(D3);4) guard/evolution/host-agent-workflows 确定性骨架为 Core 导出子模块(已在),宿主 agent 路线编排留 Plugin、AI provider 路线编排留 Alembic,两仓不重复实现(D4);5) §B ProjectIntelligenceCompatibility 删除(迁旧测试用公共导出后);§E 删 Alembic+Plugin 两处 lib/cli/KnowledgeSyncService 死副本、留 Core 版;CrossEncoderReranker 删;6) Plugin 复制残留瘦身:嵌入式 daemon 契约不破前提下,realtime/audit/monitoring/governance gateway/UiStartupTasks 经双闭包验证后砍、与 Alembic 重复的 daemon/HTTP/infra 收敛 Core;7) 全仓 check 绿 + Wakeflow 验证;嵌入式 daemon + MCP 双壳 parity 不破。

## 阶段计划

基线:文档锚点(Alembic fca6e6a/Plugin 1256b1d/Core 2823939)已由总控 RIC-0 重锚到当前 HEAD(Alembic de4ad64 +22 / Plugin ddf5922 +41 / Core 60aafbb +27,均 post-GMAP)。证据见 evidence/ric-0-baseline-inventory-2026-06-17.md。

RIC-0 控制器只读盘点 = PASS(独立复核)。关键重锚结论:
- §A 门面缺口不存在:enhancement/discovery/ast/report 已是 Core 公共导出(@alembic/core/core/* + /infrastructure/report)。用户级默认(选项 b):接受现有导出为公共面、不叠新门面;§A 收缩为删 §B ProjectIntelligenceCompatibility(先迁其 15 个旧测试 importer 改用公共导出)。
- RIC-5 骨架已导出:host-agent-workflows/guard/evolution/memory 均公共导出 → RIC-5 缩为"两条执行路线分置(宿主留 Plugin、AI 留 Alembic)+ 不重复实现"的核实+对齐。
- §E 已决:Alembic+Plugin 两处 lib/cli/KnowledgeSyncService 均 0 非自身引用=死副本 → 删;Core @alembic/core/knowledge 版留(真实调用者 SetupService/InfraModule/UiStartupTasks 全用 Core 版)。CrossEncoderReranker 0 引用 → 删。
- RIC-2 前置就绪:@alembic/core/recipe-context(GMAP-2)read API 覆盖 ~90%(detail/list/search/prime/source-refs/relations + metadata 含 candidate/recipe/quality/dimensions 读);quality 计算/recipe 写仍在 Core service(非检索,不下沉)。
- RIC-3 前置确认:Alembic/lib/resident/(14 handler)是 HTTP 镜像非 MCP(无 @modelcontextprotocol/sdk);删前必改调 routes/task.ts:14、skills.ts:14、candidates.ts:46;核心 routes(search:199/knowledge:43/guard:219)独立调 Core、删 resident 不断。吸收已 drop 的 GMAP-9a(resident 即"休眠遗留层")。
- RIC-7 瘦身边界:realtime/audit/monitoring/governance gateway/UiStartupTasks 均有 daemon 闭包消费者(2/3/1/5 引用)→ 砍它们是真重构(先从 daemon HttpServer 接线移除 + Core 去重),非纯死代码删。

相位 + owner(序:RIC-1 → RIC-2 枢纽 → {RIC-3/4/7 并行} → RIC-5 核实 → RIC-6):
RIC-1 三仓 charter 声明 + "MCP 协议端点仅 Plugin" lint(轻;charter 控制器起草 + 各仓声明)。
RIC-2 检索下沉 RecipeContext(枢纽;owner Plugin 为主,Alembic 其 HTTP 内部调用并入 RIC-4):Plugin retrieval/* 下沉 + Plugin 直连 knowledge/search/vector/candidate/recipe/quality/dimensions 改调 RecipeContext;RecipeContext 缺口(如 quality 计算)回报控制器派 Core 扩展、不自行重实现。
RIC-3 删 Alembic resident/(B1;owner Alembic):前置改调三委托路由 → 消费者扫描 → 删 14 handler+schema;并删 §B ProjectIntelligenceCompatibility(迁 15 测试)+ §E Alembic lib/cli/KnowledgeSyncService。双闭包 reachable 验证。
RIC-4 Alembic 知识/治理 HTTP 边界(D1/D3;owner Alembic):知识检索 HTTP 内部改调 RecipeContext;治理 HTTP 实现下沉 Core 子模块、保留 HTTP 暴露。
RIC-5 共享骨架两路线分置核实(D4;控制器+三仓):核实宿主路线留 Plugin、AI 路线留 Alembic、两仓不重复实现骨架(导出已在,主要核实+对齐)。
RIC-7 Plugin 复制残留 + 嵌入式 daemon 瘦身(owner Plugin;RIC-2 后):删 CrossEncoderReranker + lib/cli/KnowledgeSyncService;双闭包(MCP 入口 + DaemonSupervisor spawn daemon-server)逐项验证后砍 realtime/audit/monitoring/governance/UiStartupTasks + 与 Alembic 重复 daemon/HTTP/infra 收敛 Core;嵌入式 daemon 独立运行不破。
RIC-6 验收(控制器):消费清单达标 + MCP 仅 Plugin + charter 落地 + resident 删 + HTTP 边界 + 全仓 check 绿。

硬决策(不回头):D1-D4 已定;§A=b(不叠新门面);删代码须双闭包 reachable 验证;嵌入式 daemon 契约 + MCP 双壳 parity(codex+claude-code 宿主支持)不破;产品码由对应窗口在各仓 main 提交(只在 main 开发、不开分支);不引入新功能、只做职责清理。边界:与 GMAP(已完成)四工具公共契约不冲突——本需求只动职责归属与接口消费。

## 任务包

## 回填摘要

## 决策和追加日志
