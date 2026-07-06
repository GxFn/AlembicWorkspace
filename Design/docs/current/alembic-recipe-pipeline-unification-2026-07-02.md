# Recipe 全链路统一重构设计(plan → 生成 → 门禁 → 晋级 → 维护)

- 日期:2026-07-02
- 状态:方案待用户确认(未动代码)
- 依据:5 路并行真实代码深挖(plan 链路/冷启动执行链/deepMining+moduleMining/进化维护/门禁契约),全部 file:line 锚定
- 范围:AlembicCore、AlembicAgent、Alembic(主体)、AlembicPlugin 四仓

---

## 一、全景链路图(现状事实)

Recipe 的完整生命周期由四个环组成,两个宿主(宿主 Agent=cc/codex Plugin 路径;主体 API Agent=daemon+DeepSeek in-process 路径)在**同一 Core 内核**上各走一条执行皮:

```
                     ┌─────────────── Core 共享内核(单源) ───────────────┐
                     │ planFacts 投影│planIntent 契约│DimensionRegistry │
                     │ RecipeAuthoringSpec(validate+renderGuidance)     │
                     │ LifecycleStateMachine│DecayDetector│CoverageLedger│
                     └───────────────────────┬──────────────────────────┘
          ┌──────────────────────────────────┼───────────────────────────────────┐
          │        主体 API Agent(in-process) │            宿主 Agent(Plugin)      │
 ①Plan    │ PlanSelectionGate → runPlanAgent │ plan-tool draft/confirm(无 LLM,     │
          │ (DeepSeek+plan.profile persona)  │  由 host agent 自主决策,无状态)      │
          │        ↓ PlanSelection           │        ↓ PlanIntent                │
 ②Generate│ DaemonJobRunner 按 stage 分发:    │ alembic_bootstrap → MissionBriefing │
          │  coldStart→ProjectIndexWorkflow  │  → host agent 自主探索提交           │
          │  deepMining→DeepMiningRoundGate  │ alembic_rescan(强制 deep/module)     │
          │  moduleMining→ModuleMiningWorkflow│                                    │
          │        ↓ AiDimensionSessionRunner│        ↓                           │
          │  bootstrap-dimension pipeline    │  (host agent 即执行引擎)             │
          │  (analyze→QualityGate→produce)   │                                    │
 ③Curate  │ knowledge submit handler          │ alembic_submit_knowledge           │
          │  └── 两宿主同一 validateAgainst(RecipeAuthoringSpec gateRules) ──┘     │
          │        ↓ candidate 落库(sqlite+file-first .md)                        │
          │        ↓ Dashboard 人工审核晋级 Recipe                                 │
 ④Sustain │ DecayDetector(6 信号)→LifecycleStateMachine.transition(唯一权威)       │
          │ ProposalExecutor(SignalBus 驱动+daemon-less 有界 tick)                 │
          │ evolution profile(evolve→evolution_gate)│rescan→gap→补齐               │
          └──────────────────────────────────┴───────────────────────────────────┘
```

### 关键入口与分叉点(file:line)

| 环 | 主体 in-process | 宿主 Plugin | 分叉性质 |
|---|---|---|---|
| Plan 入口 | `Alembic/lib/daemon/PlanSelectionGate.ts:29`(runPlanSelectionGate) | `AlembicPlugin/lib/recipe-generation/plan-tool.ts:81`(routePlanTool draft/confirm) | **决策者不同**:主体用内部 LLM(plan.profile persona),宿主由 host agent 自己决策 |
| Plan 投影 | `buildPlanFactsProjection`(≤12KB 树+密度) | `buildPlanDraftContext`(projectInfoTree+candidateDimensions+coverageSeed) | 同一 Core 采集,投影组装两套 |
| Generate 分发 | `Alembic/lib/daemon/DaemonJobRunner.ts:871,895,898`(executeApiAiWorkflow 按 stage) | MCP 工具边界(bootstrap/rescan) | 主体=后台 job;宿主=同步 briefing+异步自主执行 |
| 执行引擎 | AlembicAgent bootstrap-session/bootstrap-dimension profile(fanout→pipeline) | host agent 本体(无内部 pipeline) | **最大差异**:in-process 有 QualityGate/summary_rewrite/record_repair 自我把关;宿主靠 briefing 引导+提交门禁兜底 |
| 提交门禁 | `AlembicAgent/src/tools/runtime/handlers/recipeAuthoringGate.ts:137` | `AlembicPlugin/lib/recipe-generation/host-agent-workflows/recipe-evidence-gate.ts:1-24` | **已统一**:同一 `validateAgainst`(Core gateRules.ts:316-459),仅 fs/session 端口注入不同 |
| 维护 | ProposalExecutor/DecayDetector/lifecycle(主体+Core) | alembic_rescan 转发+alembic_work | 维护主战场在主体;宿主只有 rescan 入口 |

---

## 二、现状问题清单(重构动机,全部实锤)

### A. 概念命名混乱(五词交叠)

`bootstrap`/`coldStart`/`projectIndex`/`rescan`/`deepMining` 互相指代:
- ColdStartWorkflow **委托** ProjectIndexWorkflow(mode='full')(ColdStartWorkflow.ts:99-104)
- deepMining 的执行体是 **多轮调 ProjectIndexWorkflow(mode='incremental')**(DeepMiningRoundGate.ts)
- KnowledgeRescanWorkflow 接收 `miningMode: 'deepMining'|'moduleMining'|'per-module'`——rescan 既是维护动作又是深挖载体(KnowledgeRescanWorkflow.ts:204,641)
- Agent 侧 profile 叫 `bootstrap-dimension`,但 deepMining/moduleMining 也用它(或 module-mining profile)
- 新人无法从名字推断:「冷启动」「项目索引」「重扫」「深挖」是四个东西还是一个东西的四个皮

### B. 重复实现(两边各写一份的相同语义)

| # | 语义 | 主体侧 | 宿主/Agent 侧 | 危害 |
|---|---|---|---|---|
| B1 | PLAN_FACTS_BUDGET_BYTES=12KB | Alembic/PlanSelectionGate.ts:27 | AlembicPlugin/plan-tool.ts:82 | 改一处漏一处 |
| B2 | stage 需 moduleBindings 判断 | PlanSelectionGate.ts:170(gateStage!='coldStart') | Core planIntent.ts:9-12(MODULE_TARGET_REQUIRED_STAGES) | 同逻辑双实现,Core 已有权威没被复用 |
| B3 | 模块候选降级读法 | PlanAgentRun.ts:147-160(5 种 source fallback) | plan-tool.ts(buildProjectInfoTree 一种) | 读树口径不一 |
| B4 | 维度完成判定 | BootstrapConsumers.consumeBootstrapDimensionResult | Plugin dimension-completion.ts:38 validateDimensionCompletionEvidenceGate | **两套完成标准,无单一真值** |
| B5 | 提交去重 | Core aggregateCandidates 强制(Jaccard) | Plugin schema `skipDuplicateCheck` 可绕过(mcp-tools.ts:130) | 宿主可产重复候选 |
| B6 | Project Skill 生成 | BootstrapConsumers.generateSkill | dimension-completion.ts:44 generateWorkflowSkill | 两个入口签名可能漂移 |
| B7 | 关系词表 | Core gateRules.ts:139 | Agent insightGate.ts:1055(声明式同形副本) | 唯一声明式副本,Core 改词必须手动同步 |
| B8 | plan 阶段指导文本 | plan.profile.ts persona+PlanAgentRun.ts:65-75 | plan-tool draft 返回的引导文本 | 规模评估方法/阶段要求各写一份 |

### C. 散乱(单一语义碎在多处)

- **plan 提示三处**:persona(plan.profile.ts)+prompt builder 阶段指导(PlanAgentRun.ts)+宿主 draft 引导(plan-tool.ts)——无 render 单源
- **门禁阈值 10+ 处**(门禁全景表):Core 持 8 个(gateRules.ts:128-364)+Agent 1 个独占(depth-retry=2, insightGate.ts:47)+similarity 0.1(MemoryRepository)/0.85(CandidateAggregator)两个不同去重阈值
- **预算常量**:12KB 投影×2、345.6k session 默认(ANALYST_BUDGET)、maxSubmits=10、90s/轮、coverage cell 预算(D2_PER_ROUND_CELL_BUDGET)——散在 4 个文件
- **BootstrapEventEmitter 双路径**:`#service/bootstrap/`(主体)vs `#recipe-generation/bootstrap/`(Plugin)——是否同物未证实

### D. 半接线与死链

| # | 缺口 | 证据 | 等级 |
|---|---|---|---|
| D1 | **candidate→Recipe 晋级 API 半接线**:自动晋级(ConsolidationAdvisor 对标→update proposal)设计在,人工晋级依赖 Dashboard,但子代理未找到完整晋级 API 落点 | 挖掘#4;⚠️ 此结论需亲验(Dashboard 有"待审"页在用,可能只是子代理没找到端点) | 待亲验 |
| D2 | module-mining profile 无日志/无真实运行证据 | ProjectIndexModuleMiningProfile.ts:3-54 仅类型定义级接线 | 实 |
| D3 | in-process 生成完成后 candidate 流入 Knowledge repo 的路径,与宿主 submit_knowledge 是否同一落库函数未证实 | 挖掘#2 死链清单 | 待亲验 |
| D4 | deepMining 多轮进度无 UI 可见性(轮数/收敛预估) | 挖掘#3 | 实 |
| D5 | 宿主侧无 deepMining/moduleMining 独立工具,只有 rescan 强制 stage | PlanSelectionGateStateless.test.ts:18 | 实(可能是有意设计) |

---

## 三、统一重构设计

### 3.1 统一概念模型:四环命名(重命名方案)

用**生命周期四环**替代现在的五词交叠,所有代码/文档/日志统一改用:

| 新名 | 涵盖 | 收编的旧名 |
|---|---|---|
| **Plan(规划)** | 项目情报采集→投影→维度与规模决策 | plan gate/plan draft/plan selection |
| **Generate(生成)** | 三 stage:`coldStart`(全量首扫)/`deepMining`(多轮增量)/`moduleMining`(模块定向) | bootstrap、projectIndex(full/incremental)、rescan-as-mining |
| **Curate(甄选)** | 提交门禁→candidate 落库→人工/自动晋级 Recipe | submit/gateway/review |
| **Sustain(维护)** | decay 检测→proposal→evolution→rescan 补齐 | lifecycle/evolution/rescan-as-maintenance |

命名落地规则:
- `rescan` 一词只保留给 Sustain 环的「差距重扫」;Generate 环的增量执行改叫 deepMining round(现 DeepMiningRoundGate 名已对)
- `bootstrap` 一词退役为历史别名:Agent profile `bootstrap-dimension` → `generate-dimension`;`ColdStartWorkflow` 并入 `GenerateWorkflow`(stage='coldStart')——ProjectIndexWorkflow 是它的实现体,合并为一个 workflow 按 stage 分支
- 文件层级目标(主体仓):
  ```
  lib/workflows/recipe-pipeline/
  ├── plan/        (现 daemon/PlanSelectionGate + ai-execution 的 plan 消费)
  ├── generate/    (现 cold-start/ + project-index/ + daemon/DeepMiningRoundGate + daemon/ModuleMiningWorkflow)
  ├── curate/      (现 BootstrapConsumers 落库段 + 晋级接口)
  └── sustain/     (现 knowledge-rescan/ + evolution 编排)
  ```
  AlembicAgent 对应:`profiles/definitions/recipe-pipeline/{plan,generate,evolution}.profile.ts`

### 3.2 统一契约(Core 单源,新增 `@alembic/core/recipe-pipeline` 聚合入口)

现状已单源的**保持不动**:PlanSelection/PlanIntent(planIntent contracts)、RecipeAuthoringSpec(validate+renderGuidance)、LifecycleStateMachine(transition 唯一权威)、DimensionRegistry(UnifiedDimension)。

需要**补单源**的契约(全部 additive):

| 契约 | 内容 | 消灭的重复 |
|---|---|---|
| C-1 `PlanBudgetSpec` | PLAN_FACTS_BUDGET_BYTES、dimensionLowerBound 规则、tier 上限 | B1、散乱预算 |
| C-2 `planSelectionRequiresModuleTargets(stage)` 导出复用 | Core planIntent.ts:88 已有,两宿主改 import | B2 |
| C-3 `DimensionCompletionSpec` | 维度完成的单一判定:最少候选数/证据密度/深度接地要求;`consumeBootstrapDimensionResult` 与 Plugin `validateDimensionCompletionEvidenceGate` 都 render 自它 | B4 |
| C-4 `SubmissionDedupPolicy` | 去重阈值+豁免语义单点:`skipDuplicateCheck` 改为「豁免必须落 reason 进 candidate 元数据」(与 styleWaiver 同一模式) | B5 |
| C-5 `RecipePipelineEvents` | 统一进度事件契约(阶段/维度/轮次),两个 BootstrapEventEmitter 收敛到一个 Core 定义的事件类型 | C 散乱、D4 |
| C-6 软硬违规分级下沉 | Agent 刚加的 `isSoftAuthoringViolation`+`applyStyleWaiver` 从 handler 下沉到 Core recipe-authoring-spec(gateRules 旁),Plugin 宿主同享申辩语义 | 申辩两宿主 parity |
| C-7 关系词表单点 | Agent insightGate 的同形副本改为 import Core 导出 | B7 |

### 3.3 统一 plan 提示(PlanAuthoringSpec,与 RecipeAuthoringSpec 同模式)

现状:plan 的「规模评估方法/阶段要求/输出 schema/示例」在 persona、prompt builder、宿主 draft 文本三处各写。

方案:Core 新增 `plan-authoring-spec/`(复刻 RecipeAuthoringSpec 的成功模式——单源数据+renderGuidance):
- **数据**:规模评估规则(strength 阈值→预算映射)、阶段要求(coldStart 免 bindings/deep+module 必须 bindings)、输出 JSON schema、自洽示例、硬约束(total≥dims×3)
- **render 两皮**:
  - `renderPlanPersona()` → AlembicAgent plan.profile.ts 的 persona 由它生成(构建时或运行时)
  - `renderPlanDraftGuidance()` → Plugin plan-tool draft 返回给 host agent 的决策指引由它生成
- 效果:改一处规模规则,两宿主 plan 决策口径同步;消灭 B8

### 3.4 统一门禁(现状好,补三点)

门禁主体**已经单源**(validateAgainst 两宿主字节一致)——这是本系统做得最对的部分,重构不动它。补:
1. C-6 waiver 下沉(宿主 Agent 也能申辩,理由同样落库人审)
2. 阈值聚拢:gateRules 内 8 个阈值已集中;把 Agent depth-retry=2、similarity 两阈值挂到同一 spec 的 `thresholds` 导出,形成**一张可打印的门禁参数表**(renderGuidance 可输出给人看)
3. QualityGate(analyze 质量门+summary_rewrite/record_repair)明确标注为 **in-process 专属层**——宿主 agent 无 pipeline 可插,等价物是 MissionBriefing 引导+提交门禁兜底;这是**合理分叉**,写进差异表而非强行统一

### 3.5 宿主差异明细(保留的合理分叉)

| 差异点 | 主体 in-process | 宿主 Plugin | 为什么不统一 |
|---|---|---|---|
| plan 决策者 | 内部 LLM(persona 驱动) | host agent 自主(无状态 draft/confirm) | 宿主的 LLM 就是 host agent 本体,不该再套一层内部 LLM |
| 执行引擎 | Agent pipeline(analyze/gate/produce) | host agent 自主探索 | 同上;宿主的自我把关靠 briefing+提交门禁 |
| 分析质量门 | QualityGate+summary_rewrite+record_repair | 无(等价物=briefing 完成度标准) | pipeline 内部机制,宿主不可见 |
| 进度推送 | Socket.io(Dashboard 实时) | MCP 同步返回+briefing 分页 | 传输形态不同,事件契约统一(C-5)即可 |
| session 作用域门 | 无(daemon 单进程自管) | recipe-evidence-gate session scope | 宿主多会话并发需要 |
| 维护环 | 全量(decay/proposal/evolution) | 仅 rescan 入口 | 维护是常驻侧职责,宿主是访客 |

### 3.6 半接线补全(需要你逐项决策是否纳入)

| # | 补全 | 规模 |
|---|---|---|
| F-1 | candidate→Recipe 晋级链亲验+若确缺则补统一晋级 API(Dashboard 按钮→daemon HTTP→Core gateway 单入口) | 先验证再定 |
| F-2 | module-mining profile 补日志/诊断事件(与 C-5 事件契约一起做) | 小 |
| F-3 | deepMining 轮次进度可见性(coverage-ledger advisor 结果暴露给 Dashboard) | 中 |
| F-4 | BootstrapEventEmitter 双路径收敛(C-5 的实施面) | 中 |
| F-5 | in-process 落库路径与宿主 submit 落库路径亲验统一(D3) | 先验证再定 |

---

## 四、分阶段执行计划(每阶段独立可验证、可停)

| 阶段 | 内容 | 行为变化 | 验证门 |
|---|---|---|---|
| **S1 契约单源** | C-1/C-2/C-4/C-7 常量与判断收口 Core;两宿主改 import | 零(字节等价重构) | 四仓 build+test 全绿+门禁字节 diff 为空 |
| **S2 plan 提示单源** | PlanAuthoringSpec+两 render;persona/plan-tool 改由 render 生成 | plan prompt 文本等价(先钉字节快照再切) | 快照对比+一轮真机 plan 数字不回归 |
| **S3 门禁补齐** | C-6 waiver 下沉+C-3 完成判定单源+阈值表 | 宿主获得申辩能力(新);完成判定统一(需对齐差异) | Agent+Plugin 测试+沙箱一轮 |
| **S4 命名与层级迁移** | 3.1 四环命名+文件搬迁+profile 改名 | 零行为(纯移动);对外 API/DB 不改名 | 全量门禁+真机冒烟 |
| **S5 半接线补全** | F-1~F-5(逐项你批) | 新功能 | 各自验证 |

顺序理由:S1-S3 是「不搬家先归物」,每步小且可回退;S4 大搬迁放在语义统一之后,避免边搬边改;S5 涉及新功能,单独立项。

## 五、待亲验清单(子代理结论不直接采信)

1. Dashboard 晋级 API 是否真缺(D1)——你日常在用「待审→晋级」,大概率端点存在,子代理没搜到
2. in-process 与宿主 submit 是否同一落库函数(D3)
3. BootstrapEventEmitter 两路径是否同物(F-4 前置)

---

## 六、重命名落地方案(定稿,基于 4 路影响面地毯扫描+3 项亲验)

### 6.0 亲验结论修正(推翻此前三个疑点)

1. **晋级链存在**:Dashboard `promoteCandidateToRecipe`(api.ts:3714)→`PATCH /api/v1/knowledge/:id/publish`(Alembic/lib/http/routes/knowledge.ts:230)→`KnowledgeService.publish`(Core:517)→lifecycle pending→active。**F-1 撤销**。
2. **两宿主落库同源**:in-process gateway.create 与宿主 MCP handler 终点都是 `KnowledgeService.create()`,同表同 repository。**F-5 撤销**。前置门禁差异(in-process validateAgainst vs MCP handler UnifiedValidator)在 S3 核实统一。
3. **双 emitter 是过期复制**:Plugin 版 BootstrapEventEmitter 缺主版的 `emitProcessEvents()`(主版 :162-182)与 `isNonNormalDimensionPayload` 容错——真实共享资产漂移,S1 先对齐。

### 6.1 影响面总量与分层(实测)

| 词族 | 出现文件数(五仓) | 持久化硬墙 |
|---|---|---|
| bootstrap/coldStart/projectIndex | 943 | bootstrap_snapshots、bootstrap_dim_files 表;job kind='bootstrap';.asd/bootstrap-sessions/;bs_ 前缀 |
| deepMining/moduleMining/generationStage/rescan | 581 | deep_mining_rounds、coverage_ledger 表;generationStage/miningMode 值存 JobStore.request 快照 |
| decay/evolve/proposal/lifecycle/supersede | 2368 | lifecycle 6 状态值、proposal.status 5 值、SignalType 值、lifecycle_transition_events 表 |

### 6.2 核心取舍:概念层彻底改,wire 层冻结兼容

混乱的根源是**概念词重载**(bootstrap 指代生成环一切、evolution 5 重重载、projectIndex 与 coldStart 交叠),而非机器读的 wire 值。定稿:

- **概念层(文件名/类名/导出符号/目录/日志前缀/注释/文档)→ 彻底重命名**,消灭 95% 混乱,可自由改零破坏
- **wire 层(DB 表名与状态值/MCP 工具名/HTTP 路由/CLI 命令/Socket 事件名/stage 字符串值/JSON 字段)→ 冻结保留**,集中登记为「wire 契约冻结表」,每项注明所属概念——机器不在乎名字,人查表即懂
- 论证:wire 层也改的收益是纯美观,代价是现场 SQLite 迁移+LLM 工具名硬编码更新+历史 job 兼容+用户脚本断路。不做。

### 6.3 重命名映射总表

**Generate 环(消灭 bootstrap/projectIndex 两词)**:

| 旧名 | 新名 | 层 |
|---|---|---|
| ColdStartWorkflow + ProjectIndexWorkflow | **GenerateWorkflow**(按 stage 分支,合并) | 文件+类 |
| DeepMiningRoundGate | GenerateRoundGate(或保名,deepMining 名实相符——批内定) | 文件 |
| BootstrapConsumers / BootstrapRepository / BootstrapDedup / BootstrapEventEmitter / BootstrapSession* | Generate* 对应名(类名与 bootstrap_snapshots 表名解耦,注释标 wire 表名) | 文件+类 |
| runBootstrapPlanGate / buildColdStartWorkflowPlan / consumeBootstrapDimensionResult 等 30+ 符号 | runGeneratePlanGate / buildGenerateWorkflowPlan / consumeGenerateDimensionResult… | 符号 |
| profile id 'bootstrap-session' / 'bootstrap-dimension' | 'generate-session' / 'generate-dimension' + registry 旧 id alias 一个版本 | 半 wire |
| [Bootstrap] 日志前缀 | [Generate] | 文案 |
| **stage 值 'coldStart'/'deepMining'/'moduleMining'** | **保留**(名实相符+wire;plan LLM 输出 schema 一部分) | wire 冻结 |
| MCP alembic_bootstrap、CLI alembic coldstart、HTTP /modules/bootstrap、事件 bootstrap:*、表名、bs_ 前缀、.asd/bootstrap-sessions/ | **保留** | wire 冻结 |

**Sustain 环(消灭 evolution 重载,decay/proposal/lifecycle 名实相符保留)**:

| 旧名 | 新名 | 层 |
|---|---|---|
| EvolutionGateway | **ProposalGateway**(它实际是提案分发) | 类 |
| service/evolution/ 目录 | service/sustain/(HTTP /api/v1/evolution/* 冻结) | 目录 |
| KnowledgeRescanWorkflow | 保名(Sustain gap 重扫名实相符);DaemonRescanWorkflowArgs 中 mining 混装参数在 S4 拆注释澄清 | — |
| DecayDetector / ProposalExecutor / LifecycleStateMachine / evolution preset | **保留**(名实相符) | — |
| lifecycle 6 状态值 / proposal.status 5 值 / SignalType / evolution_proposals 表 / /api/v1/evolution/* | **保留** | wire 冻结 |

**Curate 环(新概念词,收编 submit/gateway/review/publish 的散装)**:目录层新增 curate/,KnowledgeService.publish 等 wire 保留。

### 6.4 完整性保障(用户要求「不要遗漏」的机制化)

1. **逐词族脚本化改名**:每个映射对先 grep 全仓计数→批量替换→再 grep 验证 0 残留(排除 wire 冻结白名单文件)→四仓全量门禁→commit。一词族一批。
2. **旧词 lint 禁令**:自定义 lint(仿 lint:repo-boundary)——src 内禁止新增 bootstrap/projectIndex 等退役词,白名单=wire 契约冻结表文件+migration 文件。防回流。
3. **wire 契约冻结表落地**:Core 新增 `src/types/wire-contract.md`(或 .ts 常量+注释)集中登记全部冻结名(表名/状态值/MCP/HTTP/CLI/事件/stage 值/前缀/目录),每项注明概念层新名。新人查表即懂。

### 6.5 修订后阶段计划

| 阶段 | 内容 | 变化 |
|---|---|---|
| S1 | 零行为契约收口:C-1 预算常量单点、C-2 stage 判断复用 Core、C-7 关系词表单点、Plugin emitter 对齐主版(修漂移) | 零行为 |
| S2 | PlanAuthoringSpec:plan 规模规则/阶段要求/示例单源,render 主体 persona+宿主 draft 指引两皮 | prompt 字节等价起步 |
| S3 | 门禁补齐:C-6 waiver 下沉 Core、C-3 维度完成判定单源、核实 MCP handler UnifiedValidator vs validateAgainst 差异、C-4 去重豁免落 reason、C-5 事件契约 Core 化 | 行为对齐 |
| S4 | 概念层大重命名(6.3 映射表,一词族一批)+文件层级 recipe-pipeline/{plan,generate,curate,sustain}+旧词 lint 禁令+wire 冻结表 | 零行为(纯改名) |
| S5 | 半接线补全:F-2 module-mining 日志、F-3 deepMining 轮次 Dashboard 可见性(F-1/F-5 已撤销) | 新功能,逐项批 |
