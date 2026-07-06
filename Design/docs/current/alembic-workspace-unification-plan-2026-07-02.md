# Alembic 空间全局组织架构统一落地方案

- 日期:2026-07-02
- 状态:方案待用户确认(未动代码)
- 事实基础:九路 Workflow 深挖([原始供料](alembic-workspace-survey-raw-2026-07-02.md),348 tool calls,全锚点);Recipe pipeline 统一重构(S1-S4)先例与方法论
- 目标(用户原话):按职责与功能统一命名、统一设计层级关系、优化组织架构,扩展到整个 Alembic 空间;AI 能从目录树直接读出架构
- 并入:[优化 backlog](alembic-workspace-optimization-backlog-2026-07-02.md)(O-1~O-9/R-1~R-3)

---

## 一、全空间诊断总图(实锤,按仓)

### AlembicCore(引擎,~120k LOC)
- **P0**:types 反向依赖 service/workflows(ProjectSnapshot.ts:17、SnapshotViews.ts:10);service→根门面运行时反向(collect-project-context.ts:15 取 baseDimensions);core/capability 探针错位(是 infra 不是分析叶)
- **结构**:service 16 目录平铺——plan 族四目录(planFacts/planIntent/planLedger[死垫片]/recipeStatus[误名,实为 plan 投影])、验证族三微目录(candidate/quality/recipe)、host-agent 8.7k LOC 混装(packet+briefing+session+缓存+交付+critic)
- **出口三轨并存**:根 facade(~30 个)/service barrel(只含 10/16)/深路径 exports——即"接口收口"的具体形态;死 barrel recipe-context.ts、死表 auditLogs、layer-contract.md 已腐(引用已退役 project-intelligence)
- **命名**:sustain 改名只切半层(domain/types/repository/facade 仍 evolution;文件内 38 处 Evolution* 类型);目录 camelCase/kebab 混用

### Alembic 主体
- **P0 急修**:layer-contract 门禁当前 **41 违规红**——S4 四环搬迁未回写 config/layer-contract.json(recipe-pipeline/project-context 未声明、已删 resident 仍在);lint 脚本 ALIAS_TO_AREA 缺 #recipe-pipeline(整条边不可见)
- **结构**:workflows 残余归属清晰化(completion+skill-delivery 唯一消费者都是 generate 执行链→并入;project-context 被四方共用→独立事实层,与单文件 lib/project-context 合并);service 七职责杂烩(wiki 实为 generate 收尾/handler-runtime 是协议类型);daemon 13 文件三群(job 执行/job 观测/进程运行时);getServiceContainer reach-through 144 处(AD4 未完)
- **依赖**:daemon→workflows 反向 1 边、workflows→infrastructure 1 边、recipe-pipeline↔workflows 准循环(合并事实层后消解)

### AlembicAgent
- **P0**:prompts/ 错位——insightGate.ts 1328 行装着 QualityGate 评估器+工件构建+stage 构建(prompt 文本≠门禁逻辑);能力类三名跨两层(GenerateAnalyze→'code_analysis'→CodeAnalysis 别名)
- **结构**:双配置系统(presets 3 个+profiles 12 个,靠 basePreset 回指);runs/module 与 runs/module-mining 同族分居;agent/domain 空泛(EvidenceCollector/EpisodicConsolidator 归属不明)
- **死区**:signal.profile(零触发,与 SPM 删除需求 CG-1 重叠)、chat.profile 零消费、AdaptiveStrategy 不可达、types/agent.d.ts ambient 重复

### AlembicPlugin
- **P0**:runtime 87 文件大杂烩(mcp/host-agent/ide-agent/evolution/diagnostics/preflight/status 混居)+runtime/runtime 双嵌套;四目录循环(recipe-generation→workflows→service→runtime→recipe-generation);recipe-generation 反向依赖 runtime/injection
- **清算成熟**:15 个 RG9/P12/P13 shim 零 lib/bin 消费者(唯一引用是 skeleton test 白名单)——移除条件已满足
- **命名**:#codex 别名名不副实(双宿主后)、#governance 死别名、DaemonStatus 恒 null 应改 HostRuntimeStatus、plan 环文件散平铺(与主体 recipe-pipeline/plan 不对称)、god files(search.ts 2520 行/agent-public-tools.ts 2435 行)

### AlembicDashboard
- **P0(S4 遗漏)**:GenerateProgressView.tsx 文件改名但**默认导出仍叫 BootstrapProgressView**(:528,705)——文件名/导出名/import 名三方不一致
- **god**:api.ts 4278 行(client+40 normalize+60 类型+120 方法单对象,与后端 24 路由文件零结构对应);App.tsx 1315 行(四环业务全在壳里 prop-drill)
- **死区**:KnowledgeGraphView 1003 行零消费、Panels/AuditLogPanel 重复实现、api 7 个死方法、generated 契约表 2402 行大半零运行时消费;SPM 整链与 CG-1 删除需求重叠(标记待删区,不重命名)
- **双通道**:useAuth/usePermission 绕过共享 http 实例直用 axios;api.ts 内混用 fetch/axios

### 跨仓(横切)
- **词族待治理**(bootstrap 先例之后):进化族五词(sustain/evolution/proposal/enhancement/consolidation)、session 七义(GenerateSession 三处异物同名+MCP/SSE/维度执行/Produce/Mining/RecipeScope)、dimension 类型三层链+DimensionDef 双定义+ModuleDimensionTarget 三重定义、capability 五处四义、insight([Insight-v3] 日志 43 处)、实体后缀 Wire/JSON/Like/Lite 四选一、Unified 前缀退役、PcvNodeEvidence 同名不同物(main 812 行 vs Agent 1667 行)
- **词族判定为分工成立(写词汇表即可)**:scan/rescan/sweep/mining/analysis 五分工、job/task/run 三层、Gateway 作"统一入口"正词
- **Core 化清单**:字节全同 5 文件(CacheService/UnifiedCacheAdapter/AppConfigLoader/graph-shared/search-wire)+近同 4(AuditLogger/GraphCache/shutdown/SkillHooks 1.4%)+estimateTokens 三份+createLimit 双份+schemas 共享子集(mcp-tools 12 导出/http-requests 23 导出)+generate-event-types 基础 payload+B3 module-axis(R-1 闭环)
- **危险影子实现**:Plugin isTargetScopedCoverageModuleId 语义弱于 Core 版;getProjectRuntimeControlStatePath 跨宿主状态文件路径双实现(drift 即互不可见)
- **Core 宿主痕迹**:JobStore DaemonJobSource 含 'codex'、'codex-host-plan' 硬编码等——host-neutral 化
- **drift 门禁零覆盖 lib 代码**:27 个 main↔Plugin 同路径文件不在任何 manifest

---

## 二、统一设计(目标态)

### 2.1 全空间统一词汇表(新增 wire-contract 姊妹篇:`AlembicCore/docs/vocabulary.md`)

| 词 | 唯一含义 | 处置 |
|---|---|---|
| plan / generate / curate / sustain | Recipe 生命周期四环(全空间目录与日志前缀统一) | Plugin 侧镜像改名;[Insight-v3]→[generate] |
| KnowledgeEntry + lifecycle | 唯一知识实体;candidate/recipe 是 lifecycle 视图词 | 写入词汇表;HTTP /candidates 等 wire 保留 |
| session | 仅指"一次 generate 运行的可恢复会话"(Core GenerateSession 正解) | McpSession→McpConnection、SSE→SseConnection、DimensionExecutionSession→DimensionRun、主体私有 GenerateSession 重名消歧 |
| proposal / decay / consolidation | sustain 环内的机制词(保留) | evolution 词根全空间退役→sustain(domain/types/repository/facade/38 处 Evolution* 类型);enhancement 并归 sustain 机制词 |
| UnifiedDimension | 维度唯一实体 | DimensionDef 收敛单处投影、删 testMode.ts 副本、ModuleDimensionTarget 三定义→Core 单源 |
| capability | 仅指能力探针(CapabilityProbe) | Core workflows/capabilities→surfaces?(评估 wire subpath 冻结面后定);Agent tools/runtime/capabilities→groups;Agent agent/capabilities 别名层删除 |
| ToolSpec | 工具契约单源(Agent kernel) | Plugin ToolPolicy 的 ToolDefinition→ToolPolicyEntry;ToolAction 双定义收敛 |
| job / task / run | daemon 排程 / generate 内维度任务 / Agent 一次执行 | 词汇表固化;agent/tasks 并入 runs;GenerateTaskManager 内嵌 session 词消歧 |
| *Wire | 跨进程投影类型唯一后缀 | JSON/Like/Lite 后缀收敛 |
| scan/rescan/sweep/mining/analysis | 五分工(冷启动扫/增量重扫/维护清扫/深挖/静态 AST) | 词汇表固化;RescanContext(generate 环内)→IncrementalContext |

### 2.2 五仓目标层级(骨架)

**Core**(subpath wire 冻结,内部重组+出口新增聚合):
```
src/domain/          ← 不动(唯一干净层,分层基准)
src/service/
├── plan/            ← planFacts+planIntent+recipeStatus 三合一(planLedger 删)
├── knowledge/
│   └── validation/  ← candidate+quality+recipe 三微目录并入
├── sustain/         ← 全词统一(含 domain/evolution 改名、repository/evolution 归环)
├── project-context/ ← 9 级保持;architectureIntelligence+dimensionPlanning 移 capabilities 分组
├── recipe-context/ search/ vector/ guard/ source-graph/ ← 保持
src/workflows/
├── project-index/{cold-start,knowledge-rescan,shared-plan}/ ← 内部三分(shim 目录冻结面保持)
├── capabilities/host-agent → 按功能拆:briefing/ session/ delivery/ (packet 与 completion 判归属)
src/types/           ← 瘦身:反向依赖修复(SourceGraphLifecycleResult 等下沉)
出口政策:每环一聚合 facade(plan.ts/generate?.ts/curate?/sustain=evolution.ts 改名冻结评估);旧深路径 exports 冻结保留;service barrel 补全或废弃(二选一)
```

**主体**:
```
lib/recipe-pipeline/ ← 四环已建;并入 workflows/completion+skill-delivery(generate 收尾)、service/wiki
lib/project-facts/   ← workflows/project-context+lib/project-context 合并(独立共用事实层,消 准循环)
lib/daemon/{jobs,observability,runtime}/ ← 三群分组;DaemonJobRunner 经 RecipePipelineFacade 调环(O-3)
lib/service/         ← 只剩真横切(cleanup/module/skills/vector);handler-runtime→shared/schemas
lib/tools/           ← v2 目录收平
governance 空目录删;layer-contract.json 回写+别名补全(W0)
```

**Plugin**(与主体镜像):
```
lib/recipe-pipeline/ ← recipe-generation 改名+四环化:{plan/(plan-tool+confirm+gate+anchoring),generate/,curate/(README 指针),sustain/(evolution 改名)}
lib/host-runtime/    ← runtime 拆:mcp/(协议+handlers 按工具族分)、host-adapter/、status/、diagnostics/;runtime/runtime 嵌套消除;#codex 别名→#host-runtime
15 个 RG9 shim 删除(+skeleton test 白名单同步);#governance 死别名删;DaemonStatus→HostRuntimeStatus
```

**Agent**:
```
src/agent/
├── runs/            ← 每 profile 一包装器统一;module 双目录合一
├── profiles/        ← presets 降级为 profile 默认块(单一 profile 词汇)
├── evaluation/      ← 从 prompts 拆出:gate evaluator+artifact 构建+stage builder
├── prompts/         ← 只剩 persona/prompt 文本
├── evidence/ memory/ ← agent/domain 拆归
tools/kernel 单源保持;capabilities 别名层删
```

**Dashboard**(与 SPM 删除需求 CG-1 协同):
```
src/api/{client.ts,plan.ts,generate.ts,curate.ts,sustain.ts,…按后端路由族}  ← api.ts 拆
src/views/ 与 tab 名对齐;Panels 目录删(死);App.tsx 业务下放 hooks
GenerateProgressView 导出名修正(W0);死区清算(KnowledgeGraphView/死方法/死 i18n)
useAuth/usePermission 接共享 http 实例
```

### 2.3 跨仓机制

- **Core 化批**(见诊断清单):字节同/近同/三份工具/schemas 共享子集/event-types 基础 payload/module-axis;影子实现(coverage 判定、runtime-control 路径)删宿主副本
- **drift 门禁扩容**:结构性分叉件(injection 9 同名、SetupService、CleanupService、GenerateTaskManager、ModuleService)进 shared-asset-manifest 新 mode(exact 或 per-host 授权声明)
- **Core host-neutral**:'codex' 字符串参数化(DaemonJobSource 等)
- **lint 体系**:retired-symbols 词表随各批扩充;layer-contract 补 recipe-pipeline;新增环间方向 lint(主体+Plugin 四环;Core service 分组)

---

## 三、执行批次(每批可停可回退,方法论沿用 S4)

| 批 | 内容 | 规模 | 前置 |
|---|---|---|---|
| **W0 急修** | 主体 layer-contract 回写+lint 别名盲区(41 红→0);Dashboard GenerateProgressView 导出名;S4 注释残留(GenerateRepository 头注等) | 小 | 无 |
| **W1 死区清算** | Core planLedger/死 barrel/死表 auditLogs;Plugin 15 RG9 shim+死别名;Agent 死 profile×2+AdaptiveStrategy+ambient 重复;Dashboard 死 View/死方法/死 i18n(SPM 链除外,标记待 CG-1);主体 governance 空目录 | 中(全删除,每项按删除三件套:扫描/替代/测试) | 无 |
| **W2 跨仓 Core 化** | 字节同 5+近同 4+SkillHooks+estimateTokens/createLimit+schemas 共享子集+event-types 基础 payload+module-axis(R-1 闭)+影子实现删除;drift 门禁扩容 | 中大 | W1 |
| **W3 词族统一 II** | 进化族(evolution 全空间→sustain,含 38 处类型+repository/facade)+session 七义+dimension 三重定义+capability/insight/[Insight-v3]→[generate]+Wire 后缀+PcvNodeEvidence 消歧;词汇表 vocabulary.md 落盘 | 大(S4 批 3 方法论:底稿 agent→脚本→四类风险分层) | W1 |
| **W4 Core 结构** | plan 三合一+validation 并入+types 反向修复+host-agent 拆分+project-index 内部三分+出口收口(聚合 facade+政策统一)+layer-contract.md 修复 | 大 | W2,W3 |
| **W5 宿主结构** | Plugin:recipe-pipeline 镜像+host-runtime 拆解+循环拆除+#codex 改名;主体:workflows 消亡+project-facts 合并+daemon 三群+service 收敛+RecipePipelineFacade(O-3) | 大 | W3 |
| **W6 Agent 结构** | evaluation 拆出+presets 降级+runs 统一+domain 拆归+能力三名合一 | 中 | W3 |
| **W7 Dashboard 结构** | api 按路由族拆+App 减负+views 对齐+双通道收敛(与 CG-1 SPM 删除协同排期) | 中大 | W0;CG-1 决策 |
| **W8 门禁与地图** | 环间方向 lint(三仓)+retired-symbols 扩词表+各仓根 README AI 地图+vocabulary/wire-contract 定稿 | 中 | 各批随行+收尾 |

## 四、wire 冻结增量(在 wire-contract.md 现有基础上)

- Core 全部既有 package.json exports 路径(重组=内部搬+旧路径壳,新增聚合入口)
- HTTP /api/v1/candidates/*、/evolution/*(词汇表注明视图词/旧环名)
- Dashboard tab id('spm'/'project-pyramid' 等,localStorage/链接引用)——W7 改内不改 wire
- 待实证项进 W3 底稿:i18n key 是否被外部引用、SSE 事件名全集

## 五、需要用户先决的三个点

1. **capability→surfaces/groups 改名**是否值得:Core workflows/capabilities 是 46 处 import 的 facade 名(host-agent-workflows 出口),改名波及大;备选=只改 Agent 侧两处+词汇表声明 Core 侧含义
2. **Plugin recipe-generation→recipe-pipeline**:目录名进过 wire?(#recipe-generation 是仓内别名可改;无包发布面)——默认做,确认无插件缓存硬路径
3. **W7 Dashboard 与 CG-1(SPM 页+信号删除)的排期关系**:建议 CG-1 先行(删完再重构剩余),或 W7 内合并执行
