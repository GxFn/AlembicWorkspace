# Alembic Main Capability Inventory And Cleanup 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-main-capability-inventory-cleanup-2026-06-19 - Alembic Main Capability Inventory And Cleanup
主状态: completed
阶段: 无
当前任务包: mc-0-inventory-precheck(accepted), mc-1-safe-direct-deletes(accepted), mc-2-monitoring-delete(accepted), mc-3p-plugin-prime-task-lane-clean(accepted), mc-3-intent-paradigm-delete(accepted), mc-4-claude-code-acceptance(accepted), mc-5a-dashboard-search-context-aware(accepted), mc-5b-alembic-retire-handler-contracts-regen(accepted), mc-5c-dashboard-apitypes-resync(accepted)
窗口: Alembic(accepted), AlembicPlugin(accepted), Test(accepted), AlembicDashboard(accepted)
阻塞项: 无
下一步: wakeflow-render-progress
评审: demand-completed
自动化: 未启用
需要用户决策: 无
最后更新: 2026-06-19 18:04 CST
来源状态: revision 37 / event evt-20260619100422-0037
<!-- unified-status:end -->

## 目标

Alembic 主体（alembic-ai 主仓）保留能力边界内净化：删非职责/死/空壳/退役/确认死代码，保留 daemon/HTTP/Dashboard/Gateway(活)/CLI/file-monitor/cache(无 Redis 实现)/sandbox/platform/injection/AI 执行/KnowledgeSyncService 等本职能力（与 Plugin 净化性质相反，主体保留 daemon/HTTP/Dashboard）。删：task/intent 意图链 + alembic_task + /task + /intent-episodes（意图/prime MCP 能力退役，主体保留 CLI/HTTP/Dashboard）、HitRecorder（与意图链联动）、monitoring(ErrorTracker/PerformanceMonitor + /monitoring，dev 能力删除)、退役路由(auth 410 / search-context-aware)、空壳(refreshPanorama/PanoramaModule/AppConfigLoader/agent-project-context 空目录/delivery-retired 死分支/regenerateEditorIndex)、确认死项(CrossEncoderReranker null 接线/ReactiveEvolutionService 别名/BUILD_SYSTEM_MARKERS 别名)。耦合项先解耦再删（PrimeSearchPipeline 不被 /search 复用，可直删）。Core/Agent 不改（边界已清）。产品改动提交 Alembic 仓 main、不开分支。主窗口=Alembic；AlembicDashboard observing；AlembicCore/AlembicAgent no-task。

## 完成定义

MC-4（claude-code 版本验收）：保留能力（daemon/HTTP/Dashboard/CLI/file-monitor/Gateway 活/sandbox/AI 执行）全功能；意图/prime MCP 能力已退役无残留（全仓无 alembic_task/IntentExtractor/IntentEpisode/PrimeSearchPipeline/HitRecorder 残留引用）；monitoring 已移除（ErrorTracker/PerformanceMonitor + /monitoring）；退役/空壳/确认死项 grep 无残留；边界 lint（agent-extraction-boundary / core-import-boundary / repo-boundary）仍绿；build:check + test:unit（+ 必要 integration）绿；dashboard stats（guardHits/searchHits/searchHitsLast30d）处置生效；Core/Agent 无改动且门禁绿。验收仅 claude-code 版本（不要求 codex 双壳 parity）。

## 阶段计划

执行序：MC-0 →（MC-1 ‖ MC-2 ‖ MC-3）→ MC-4。原则：耦合项先解耦拆分、验证活路径不断、再删；孤立死代码直删；保留能力边界（AGENTS Stop Card）不碰。 | MC-0 盘点+前置核验（不改码）：CCR-ALMB 在途清理终态复核（硬前置，避免重叠/冲突）；/task·/intent-episodes 运行时消费核（Dashboard/host，代码审计未见）；dashboard stats 处置决策（HitRecorder→guardHits/searchHits/searchHitsLast30d，移除+regen+前端 vs 置 0）；边界 lint 绿基线；确认死项 grep 复核。 | MC-1 安全直删（孤立，可并行）：退役路由(auth 410/search-context-aware)+空壳(refreshPanorama/PanoramaModule/AppConfigLoader/agent-project-context 空目录/delivery-retired 死分支/regenerateEditorIndex)+确认死(CrossEncoderReranker[+KnowledgeModule null 配置]/ReactiveEvolutionService 别名/BUILD_SYSTEM_MARKERS 别名)；grep 无残留 + build:check 绿。 | MC-2 monitoring 删（dev 能力，先撤注入再删）：HttpServer 撤 initErrorTracker/initPerformanceMonitor+errorTracker 字段+中间件 perf timer 段+删 /monitoring 路由+getErrorTracker/getPerformanceMonitor 调用点；删 lib/infrastructure/monitoring/；HttpServer+其余路由正常 + build:check 绿。 | MC-3 意图范式整删（最大耦合簇，先解耦再删）：解耦 mcp-tools.ts(去 TaskInput/alembic_task)+HttpServer(去 /task·/intent-episodes 挂载)+DI(ServiceMap/InfraModule/AppModule 去 intentEpisodeStore/primeSearchPipeline)+handler-runtime/types(去 IntentState/IntentChainRecord/McpContext.intent)+SignalModule(去 hitRecorder 注册+subscribe('intent'))+dashboard stats(按 MC-0)；删 lib/service/task/ 全部+HitRecorder.ts+routes/task.ts+routes/intent-episodes.ts；/search 不受影响、build:check+test:unit 绿、全仓无 alembic_task/IntentExtractor/IntentEpisode 残留。 | MC-4 验收（claude-code）末。 主窗口=Alembic 全部 MC；AlembicDashboard observing（前端 stats/路由可能配套，MC-0 核）；AlembicCore/AlembicAgent no-task（仅复核门禁绿）；Test claude-code 验收（controller 启动）。

## 任务包

## 回填摘要

## 决策和追加日志
