# Alembic 空间优化 backlog(并入全空间组织架构统一重构)

- 日期:2026-07-02
- 状态:已记录,按用户决策与全空间优化一起执行(不单独做)
- 来源:Recipe pipeline 统一重构(S1-S4)完成后的 5 路深挖审计

## 来自审计的优化项(性价比序)

| # | 项 | 现状锚点 | 方案 | 收益/成本 |
|---|---|---|---|---|
| O-1 | B3 模块候选 5-fallback 双仓重复(~140 行) | AlembicAgent PlanAgentRun.ts:142-175 vs AlembicPlugin plan-tool.ts | Core 抽 ProjectContextModuleCandidateExtractor,两侧适配器 | 消重+对齐投影边界/低风险 |
| O-2 | generate-event-types 双份 payload 分叉 | 主体 recipe-pipeline/generate/runtime/ vs Plugin recipe-generation/generate/ | Core 定义基础契约,主体扩展 daemon 观测字段,Plugin re-export | 消维护重担/字段已可选零破坏 |
| O-3 | DaemonJobRunner 事件裸串+直调 pipeline 内部 | DaemonJobRunner.ts:59-65,680-801(裸串×4)+:873-901(直 import 三执行器) | 裸串接 RECIPE_PIPELINE_EVENTS;抽 RecipePipelineFacade(daemon 只知入口) | 编译期防错+解耦/2 文件 |
| O-4 | PcvObservabilityLinkage 跨层 import | lib/daemon/PcvObservabilityLinkage.ts:2 引 recipe-pipeline 内部类型 | 类型上移 Core daemon 契约 | 消跨层依赖/3 文件 |
| O-5 | 测试按四环分组 | Alembic/test/unit 平铺 | test/{unit,integration}/{plan,generate,curate,sustain}/ | 可发现性/15-20 文件纯移动 |
| O-6 | Plugin recipe-generation README 映射 | 无宿主皮→四环映射说明 | lib/recipe-generation/README.md 对照表 | AI 地图对称/纯文档 |
| O-7 | Core workflows/capabilities 可发现性 | 生成链能力无索引 | recipe-pipeline README 加 Core Capabilities 索引段 | 文档/50 行 |
| O-8 | Dashboard 托管构建滞后 | dashboard/dist 构建时间早于 i18n/组件改名 | 跑 npm run build:dashboard | 3 分钟 |
| O-9 | PlanAgentRun 5-fallback 注释澄清 | 兼容层无注释说明 | 标记「Core 投影稳定后可精简为单路」 | 审计点/纯注释 |

## 登记的边界风险(修复时机=触发时)

| # | 风险 | 锚点 |
|---|---|---|
| R-1 | 微阶段空 reply 污染 result.reply 通用消费面(record_repair 同型预存) | PipelineStrategy phaseResults 尾值语义 |
| R-2 | itemIndex ?? 0 对未来无 index 软违规错位打标 | tool-router waiver 循环 |
| R-3 | C-2 谓词 fail-open:新增第 4 stage 须显式加 MODULE_TARGET_REQUIRED_STAGES | planIntent.ts:9 |


## W3 完成登记与遗留决策项(2026-07-02)

W3 词族统一全项完成(底稿 alembic-w3-vocabulary-map 3-1~3-6 实改项全落盘,四仓 commit)。遗留决策项:

| # | 项 | 锚点 | 归属 |
|---|---|---|---|
| W3-D1 | CoverageLedgerRepository.ts 移出 repository/evolution/ → repository/coverage/(Generate 概念住错目录,纯内部移动) | AlembicCore/src/repository/evolution/CoverageLedgerRepository.ts | W4 Core 结构批 |
| W3-D2 | RecipeSimilarity.ts 迁出 domain/evolution/(相似度是通用能力,名实偏弱) | AlembicCore/src/domain/evolution/RecipeSimilarity.ts | W4 决策项 |
| W3-D3 | Plugin recipe-generation/evolution/ 9 文件归属错位(sustain 机制住 generate 域目录) | AlembicPlugin/lib/recipe-generation/evolution/ | W5(Plugin recipe-pipeline 镜像批承载) |
| W3-D4 | 载荷直通 bootstrapSession 键改名(buildProjectContextFillView/presentProjectContext*Response/bootstrapSessionId/Core SnapshotViews view 字段)须先真机实证 MCP 消费方 | Alembic/lib/workflows/project-context/ProjectContextPresenters.ts:38,99 等 | W5 |
| W3-D5 | KnowledgeEntryJSON(双胞胎)并入 Core KnowledgeEntryWire 或改名 *Wire | Alembic/lib/service/handler-runtime/types.ts:127;AlembicPlugin/lib/runtime/mcp/handlers/types.ts:96 | W5 双宿主结构批 |
| W3-D6 | Agent 类名 Capability/RuntimeCapability→Toolset/RuntimeToolset(先删 agent/capabilities 别名层再改,少一半联动;CapabilityRegistry 是运行时注册表须先安置职责) | AlembicAgent/src/tools/runtime/toolsets/{Capability,RuntimeCapability}.ts | W6 之后 |
| W3-D7 | insight 文件名族(insightAnalyst/insightGate/insightEvolver/insightProducer)随 W6 prompts 拆 evaluation 一并定;preset 'insight' 推荐保留 | AlembicAgent/src/agent/prompts/ | W6 |
| W3-D8 | Dashboard useGenerateSocket 的 interface GenerateSession→GenerateSessionView(第五重同名收敛) | AlembicDashboard/src/hooks/useGenerateSocket.ts:69 | W7 |
| W3-D9 | MCP operation 'insights' 遗留 schema(非活跃 wire,零运行时消费)删或改 'quality',同批 ZodSchemas.test+两语言文案 | Alembic/lib/shared/schemas/mcp-tools.ts:45,179,197 | W6/退役清理 |
| W3-D10 | 'evolution'→'sustain' 外层 import 迁移('@alembic/core/evolution'→'@alembic/core/sustain',34 文件),迁完 shim 评估退役 | 全空间 | 后续批(非阻塞) |

## W4 完成登记(2026-07-03)

W4 Core 结构批全项完成(底稿 alembic-w4-core-structure-map;Core 7 commits 53422b2..6a791ee)。执行判定:4-5 project-index 无动作(底稿证据接受);core/capability 缓议(layer-contract.md 注记);T1 按推荐案 1(domain 契约家下沉);双 shim 退役。`npm run check` 全链自 W2 后首次全绿(清偿预存欠账:naming 10 红/closeout gate 失配/narrowness 192>190)。

| # | 遗留 | 归属 |
|---|---|---|
| W4-D1 | matrixBlessings workflows→core 边现存 0 live 运行时边:删边(契约收窄)或长期保留——**用户决策** | 用户门 |
| W4-D2 | ⚠️ 方法论修正:public-api-boundary.json 的 closeout.*(keep-provisional/reviewBy.dates/maxCounts)是 lint 消费的**活跃 gate**,exports 键改名必须同步;removedAt 块才是历史。后续批(W5+)改 Core exports 时同批核对 | 各批随行 |

## W5 完成登记(2026-07-03)

W5 宿主结构批全项完成(两份底稿 alembic-w5-{main,plugin}-structure-map;主体 B0-B6+Plugin W5-a~f+twin 批,~20 commits)。O-3(RecipePipelineFacade)/O-4(判不动,W2 已决)闭环;W3-D3(evolution→sustain 归位)闭环;W3-D4 载荷键消费链已摸底登记(真机实证仍归后续)。

| # | W5 follow-up | 锚点 | 归属 |
|---|---|---|---|
| W5-F1 | Plugin god files 拆分:search.ts 2520 行(检索编排/投影/resident 桥三段)+agent-public-tools.ts 2435 行(按工具族分文件,先决=契约测试 5 文件锚点重排) | AlembicPlugin/lib/host-runtime/mcp/handlers/ | 独立批 |
| W5-F2 | 2 host-facts 构建器 DI 化(buildLocalSelectionMismatch/buildColdStartOnboardingContract 经 mcp handler 层注入)+HostRuntimeStatus 类型下沉(解 layer-boundary 白名单 3 行) | lint-layer-boundary.mjs ALLOWLIST | 独立微批 |
| W5-F3 | W3-D5 终解:Core 增读侧容错投影(KnowledgeEntryWireLoose/Partial 变体+string\|number 时间戳归一),两宿主 KnowledgeEntryJSON 双胞胎同批切换(判定:不可直并,时间戳型硬冲突) | Core src/types/KnowledgeWire.ts | Core 微批(走 Core 窗口) |
| W5-F4 | ide-agent shim G6 候删(老插件缓存钉旧版本包,存在理由已弱化) | AlembicPlugin/lib/host-runtime/ide-agent/ | W1 型死区批 |
| W5-F5 | Plugin preflight/Preflight+JobContext 疑似弱死区(仅 barrel 消费) | 已迁 diagnostics//context/ | 登记观察 |
| W5-F6 | 主体 M6-3 四个零消费 adapter(WorkflowAdapter/MacSystemCapabilities/DashboardOperationAdapter/SkillAdapter)+RecipeRegionFixtureGeneration——停止卡保护,删除需用户门 | Alembic/lib/tools/adapters/ | **用户门** |
| W5-F7 | cc 外壳 .runtime 预装暂存件:W5 后下一次发版须经 0c 链重新 stage | plugins/alembic-claude-code | 发版 playbook |

## W6 完成登记(2026-07-03)

W6 Agent 结构批全项完成(底稿 alembic-w6-agent-structure-map;W6-0~e 六 commit ca75e22..57956b2)。W3-D6(别名层删+CapabilityRegistry 安置)/W3-D7(evaluation 拆出,文件名族改名列 W6-F4)闭环。

| # | W6 follow-up | 锚点 | 归属 |
|---|---|---|---|
| W6-F1 | 'scan_analyze' 死键+ScanAnalyze 类零实例化(公共面删名需快照 regen) | toolsets/CapabilityRegistry.ts | W1 型死区批 |
| W6-F2 | 类名 Capability/RuntimeCapability→Toolset/RuntimeToolset 词族(30+ 处联动+三面快照+主体 RuntimeCapabilityCatalog 词根) | tools/runtime/toolsets/ | 词族批(W8 后) |
| W6-F3 | A2 方案乙:preset 函数体 factory 注册表化(policyFactory/evaluator 名字符串+registry 解析)→Compiler 4 处 id 特判可声明化 | AgentProfileCompiler.ts:208-292 | 独立立项 |
| W6-F4 | insight* 文件名族微批:insightAnalyst→analystPrompt/insightProducer→producerPrompt/insightEvolver→evolverPrompt/insightGate 拆余→repairPrompts(纯内部面,Agent 内 4 src+8 test 相对 import) | src/agent/prompts/ | 独立微批 |
| W6-F5 | tokenUtils W2 供料口径修正:Agent shared 与 Core **同权重**(非分叉);真分叉=Agent kernel /4 版且在公共 wire;正解=Core 增 tokenUtils facade→Agent shared 换源+kernel 版改名 estimateToolResultTokens | kernel/registry.ts:319 | W2 尾单(Core 前置) |
| W6-F6 | ./tasks 并入 runs(exports 键牵连)+generate-session/dimension 包装器缺口(跨仓行为迁移) | src/agent/tasks/ | 缓议(用户门) |
| W6-F7 | Agent CLAUDE.md「工具系统 V1 退役登记」节 stale(引已亡 src/tools/v2/) | CLAUDE.md | 仓库文档维护 |

## W7 完成登记(2026-07-03)

W7 Dashboard 批全项完成(底稿 alembic-w7-dashboard-structure-map;9ba3125+1c99fff..c2837c6 共 7 commit;check 33/33+主体 build:dashboard 总验收绿)。W3-D8 闭环;方案 §五-3 CG-1 排期问题随用户废弃 SPM 删除需求消解(SPM 整链纯冻结零交集)。

| # | W7 follow-up | 归属 |
|---|---|---|
| W7-F1 | 浏览器真机全页冒烟(候选页维度标签/审查轮中文恢复+九 tab 切换)——W7-0 修复的用户可见回归建议真机确认 | **用户/Test 门** |
| W7-F2 | App 深拆(generate 环编排/extract/recipe 编辑)前置=契约测试 App pin 解除+SPM 共享扫描状态收拢设计 | 独立立项 |
| W7-F3 | generated 契约表瘦身=改主体生成器输出面(零消费 9 导出) | 主体窗口 |
| W7-F4 | components/Views→src/views 目录搬迁(测试 12+ pin+contract 矩阵重写,收益纯路径语义) | 登记缓议 |
| W7-F5 | problem.ts 三零调用函数+insertAtSearchMark stub 债+/auth/login /auth/me 幻影端点观察+Bootstrap* 词根尾单(测试 pin) | 死区/词族尾单 |
| W7-F6 | SPM 冻结面死键 88+键控族白名单(guardRuleMessages 37 需后端 ruleId 值域扫描) | 冻结随 SPM |

## W2 执行中降级项(2026-07-02,亲验后从"Core 化"降级)

| 项 | 降级原因 | 处置 |
|---|---|---|
| AppConfigLoader | 依赖宿主 PACKAGE_ROOT(包根路径),字节同是因各宿主各自解析 | drift manifest 纳管(W2 收尾)或参数化(W5) |
| SkillHooks | 依赖宿主 PACKAGE_SKILLS_DIR;代码零差异注释措辞差 | 同上;参数化构造注入后可 Core 化 |
| AuditLogger | 依赖 64% 分叉的 AuditStore | 随 AuditStore 判定(per-host 授权或抽骨架) |
| tokenUtils/concurrency(Agent↔Core) | **语义分叉非双份**:token 权重不同(0.5/0.25 vs Core 版),切换=预算行为变化;kernel 简易版(len/4)是故意粗估 | 独立验证批:真机预算回归后统一 |
| inferTargetModulePathsFromSourcePath(Plugin) | 细读为「输入补全启发」非影子(audit 结论修正);Core 无等价能力 | W5:启发下沉 Core 或双宿主对齐输入源 |
