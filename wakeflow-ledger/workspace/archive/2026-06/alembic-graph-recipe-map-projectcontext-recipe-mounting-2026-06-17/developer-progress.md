# Alembic Four-Tool MCP Final Optimization — graph ProjectContext rebuild · recipe_map replaces project_matrix · Core RecipeContext · local Ollama embedding 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-graph-recipe-map-projectcontext-recipe-mounting-2026-06-17 - Alembic Four-Tool MCP Final Optimization — graph ProjectContext rebuild · recipe_map replaces project_matrix · Core RecipeContext · local Ollama embedding
主状态: completed
阶段: 无
当前任务包: gmap-1-graph-projectcontext(accepted), gmap-2-core-recipe-context(accepted), gmap-3-shared-region-builder(accepted), gmap-l-core-ollama-embed(accepted), core-branch-integrate-main(accepted), gmap-4-7-recipe-map(accepted), gmap-8-four-tool-consolidation(accepted), gmap-8b-search-detach-knowledge-retire(accepted), gmap-8c-delete-middle-layer(accepted), gmap-l2-l3-plugin-ollama-wiring(accepted), gmap-9a-resident-mirror-parity(accepted)
窗口: AlembicPlugin(accepted), AlembicCore(accepted), Alembic(accepted)
阻塞项: 无
下一步: wakeflow-render-progress
评审: demand-completed
自动化: 未启用
需要用户决策: 无
最后更新: 2026-06-17 21:39 CST
来源状态: revision 41 / event evt-20260617133913-0041
<!-- unified-status:end -->

## 目标

把 Alembic 四个 Agent 面向信息工具收敛为最终形态并落到两层架构。Plugin 层 = 四工具 + 薄支撑层(向上/agent 面):alembic_graph 纯 ProjectContext;alembic_recipe_map 替换 alembic_project_matrix(ProjectContext 区域 + Recipe 挂载/汇总);alembic_search 含 operation=get 单 Recipe 详情;alembic_prime 语义定位、解耦 intent。Core 层 = ProjectContext(已存在)+ 新建 RecipeContext(向下/数据面)。删除中间抽象层(ProjectKnowledgeContextLayer / KnowledgeContextOutputProjector / KnowledgeContextInputNormalizer / RetrievalPlanner / ContextIndexSnapshot / KnowledgeContextToolOutput 统一信封),不换名重建;需求按方向分派:上进 Plugin、下进 Core,绝不落中间层。project_matrix 硬删、不留别名。recipe_map 挂载只用 recipe_source_refs + 显式 metadata,绝不用语义/关键词。补充(GMAP-L):本地 Qwen via Ollama 语义向量,local-first、插件只检测、缺失降级关键词、维度切换走 migrateDimension。验证用真实 MCP 双壳(codex + Claude Code),resident mirror(Alembic main)同名 schema/描述同步。本需求与 CKG(已暂停、非阻塞)互不依赖。

## 完成定义

1) 新 MCP discovery 只见四工具 graph/recipe_map/search/prime,不见 project_matrix(且非别名);2) 四 handler 不互调,只共享 Core ProjectContext / RecipeContext + 纯 helper;3) graph 纯 ProjectContext 输出,queryKind 覆盖 space/repo/map/module/module-layers/file-flow/file-symbols/source-slice/anchor-range,无 Recipe 内容,脱离 KnowledgeContextToolOutput;4) recipe_map 返回有界 ProjectContext 区域 + 挂载/汇总,挂载仅 source_refs+metadata、确定性、陈旧/未解析/跨仓出诊断;5) search operation=get 单 Recipe 详情,取代旧单查工具;旧 alembic_knowledge operation=get 对 Agent 不再可见/不再推荐;6) prime 语义定位,不需 intent/search/graph/recipe_map 预调用;7) Core 有 RecipeContext 下层模块(读模型 / id-ref-detail / metadata 过滤 / keyword+vector/语义块 / 批量 source-ref),lifecycle/create 留 KnowledgeService;8) 中间层与统一信封从四工具公共输出路径移除,不换名重建;9) 本地 Ollama lane:local-first、检测到即用、缺失降级关键词且诚实诊断、维度切换 migrateDimension;10) AlembicPlugin MCP 与 Alembic resident mirror 暴露相同名/schema/描述;11) 真实 MCP 双壳运行证据:graph 各 queryKind、recipe_map top-level/module/anchor、stale-ref 诊断、search get、prime 任务定位;关停 resident daemon + 启 Ollama 后本地 lane 返回真实语义结果,停 Ollama 干净降级关键词。

## 阶段计划

基线:设计 Per-Phase 锚点(2026-06-13 @ Core 2823939 / Plugin 1256b1d)已由总控重锚到当前 HEAD(Core deefba2 +25 / Plugin 0738b17 +34;Alembic de4ad64)。GMAP-0 控制器只读盘点 = PASS。相位序(用户确认):GMAP-1→2→3→(4-7 共享契约稳定后并行)→8→9;GMAP-L0-L5 与 GMAP-2 并行、GMAP-9 前落地。owner:AlembicPlugin(四工具/recipe-map/删 project_matrix/公共面/Ollama 检测+注入);AlembicCore(RecipeContext/EmbedProvider 选择器/OllamaEmbedProvider/region helper)。

GMAP-0 基线盘点(控制器,PASS;证据见 evidence/gmap-0-baseline-inventory)。
GMAP-1 graph→ProjectContext(Plugin)。重锚:graph 已 ProjectContext 化(ProjectGraphProvider.ts:17/208/337-504)且仍挂中间层(structure.ts:425 resolveMcpResult);真实剩余=input operation(query/impact/path/neighborhood/stats,structure.ts:406-534)→queryKind + 自有 Recipe-free 输出 schema 脱离中间层信封 + 确保 9 kind 覆盖(核实 file-symbols/source-slice/anchor-range)。
GMAP-2 Core RecipeContext 新公共门面 @alembic/core/recipe-context(Core),下沉 Plugin retrieval/* providers;复用 KnowledgeService 读路径(注:KnowledgeService 已是公开门面 knowledge.ts:99,GMAP-2 定复用 @alembic/core/knowledge 还是内部 service);lifecycle 留 KnowledgeService;向量经注入 EmbedProvider。
GMAP-3 共享 ProjectContext region 投影(Plugin),graph 与 recipe_map 共用,ProjectContextRef 往返。
GMAP-4-7 recipe_map 契约 + source-ref 适配 + 挂载引擎 + 输出投影(Plugin);删 project_matrix(handler/provider/catalog PluginToolSurfaceCatalog.ts:224-234 + route);挂载仅 source_refs+metadata、LCA 用 parentRef。
GMAP-8 四工具合并 + 移除中间层 + prime 解耦(Plugin)。风险:prime 今天 0738b17『route public prime through resident task』刚重构(仍调 matrix provider agent-public-tools.ts:667、graph 桩 null :677-682、走 resolvePrimeContext :635),与本相位及独立 APQ『later architecture adjustment』牵动 → GMAP-8 落地时再核对当时代码(用户确认:记录风险、GMAP-8 再核对)。
GMAP-9 测试 + 双壳真跑(Plugin + resident mirror Alembic;注:resident graph 已直接 ProjectContext.execute,Alembic structure.ts:153,parity 主要在 names/schema/描述;resident 不镜像 project_matrix,只需新增 recipe_map)。
GMAP-L0-L5 本地 Ollama embedding:Core OllamaEmbedProvider + 选择器 + migrateDimension(Core),Plugin 检测 + config(enable/endpoint/model/laneOrder)+ VectorModule 注入 + 双壳 wiring(Plugin);注入 VectorService.embedProvider,RecipeContext 透明消费。

测试项目:AlembicWorkspace 路径 = ghost ecf32806(.asd/alembic.db 存在);149-Recipe/向量基线需有 Alembic MCP 连接的壳用真实 MCP 调用核实(SQLite 直读不权威),延后 GMAP-9/L5 或专项探针,非阻塞。
硬决策(不回头):两层 + 方向路由、无中间层重建;project_matrix 硬删无别名;recipe_map 仅 source_refs+metadata 挂载;local-first Ollama 插件只检测、缺失降级;真实 MCP 双壳证据;不留旧工具兼容层(有真实消费者则修消费者)。边界:与 CKG 互不依赖;产品代码只由实现窗口提交;版本/发布由用户触发。

## 任务包

## 回填摘要

## 决策和追加日志
