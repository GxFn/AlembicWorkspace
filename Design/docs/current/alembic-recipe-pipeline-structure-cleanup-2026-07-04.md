# Recipe Pipeline 结构清洗——plan/冷启动/增量/模块扫描/进化 语义职责重整设计（2026-07-04）

- 执行线：用户直推；流程=规划方案（本文 Part I-II）→ 分波实施（Part III）→ 验证调校（Part IV）。
- 事实基础：五路并行代码测绘（plan 环/generate 环/rescan/进化/模块扫描+facade），全部带 file:line 锚点；总盘子=主仓 recipe-pipeline 19,798 行 + Core plan 服务 ~2,600 行 + Core sustain 6,020 行 + project-facts。

## Part I 现状判定（语义职责矩阵）

### 达标保持（本次不动）

| 区域 | 判定依据 |
|---|---|
| **plan 环**（主仓 PlanSelectionGate 479 + Core facts/intent/status 三分） | 前期"双宿主 plan 统一"成果良好：约束逻辑零重复、无死导出、无跨环违规、authoring spec 单源防漂移；projectInfoTree 1,149 行但金字塔操作强耦合属内聚 |
| **模块扫描** | 单一权威 `buildProjectContextWorkflowFacts`（project-facts/ProjectContextWorkflowFacts.ts:239），双路径（ProjectMap/targets 推断）汇入同一 dedupe，三环共用零重叠 |
| **facade** | `executeRecipePipelineJob` 单入口、唯一调用方 DaemonJobRunner、旁路为零（sustain→generate/execution 属工作流内接线） |
| **Core sustain 服务链** | StagingManager/LifecycleStateMachine/ProposalExecutor/DecayDetector 全部活线（sweep 60s 四驱动+启动任务+信号订阅）；EvolutionPolicy 纯函数域规则单源 |

### 问题清单（本次清洗对象）

| # | 问题 | 锚点 | 性质 |
|---|---|---|---|
| P1 | **GenerateConsumers.ts 1,403 行背 5 职责**：维度结果消费/候选记账/tier 反思/技能提取生成/会话合并，函数交错无分区 | generate/execution/GenerateConsumers.ts | 巨石拆分 |
| P2 | **KnowledgeRescanWorkflow.ts 1,209 行 + 环归属错位**：7 相编排+coverage ledger 写入器+300 行尾部校验器堆一文件；放在 sustain/ 但本质是 `GenerateWorkflow mode='incremental'` 的实现（吃的全是 generate 机器）；公共导出 `runKnowledgeRescanWorkflow` 是单行壳、真身不导出 | sustain/KnowledgeRescanWorkflow.ts | 巨石拆分+环归位+名实修正 |
| P3 | **查重播种三入口分散**：rescan 播种（RescanContext.ts:44-87）/bootstrap KB 播种（AiDimensionSessionRunner.ts:83-138，M1b 内联块）/per-dim titles 投影（DimensionRuntimeBuilder.ts:236）——同一"查重视野"职责跨三文件，且 RescanContext.ts 一文两职（rescan 上下文+通用 GenerateDedupState） | 三处 | 职责整合 |
| P4 | **AiDimensionFinalizer 769 行七步**：终态编排+四个报告增强器（efficiency/PCV/skill receipts/history）同文件 | execution/AiDimensionFinalizer.ts | 内聚拆分 |
| P5 | **AgentRunProcessEvents 1,189 行**：四类事件构建器+四个规范化器+脱敏常量同文件 | execution/AgentRunProcessEvents.ts | 内聚拆分（低优先） |
| P6 | **curate/ 空环**：仅 README（逻辑单源在 Core 的 validateAgainst/create/publish/aggregateCandidates）——环存在但无实体，读者困惑 | curate/ | 文档强化 |
| P7 | **命名与孤儿小项**：`ProduceSessionRoute.ts` 名为 Route 实为投影/计划构建器；`FileChangeHandler.ts` 10 行纯接口单独成文件；孤儿=StagingManager.rollback（等 Guard 接线，有注记）、WarningRepository（0 调用方）、`LifecycleHealthSummary/TimeoutCheckResult` 类型无消费；`evolution.ts` 冻结 shim（闭环审计已裁定保留） | 各处 | 小项清理 |
| P8 | **wiki/ 4,200 行挂在 generate/**：wiki 生成是 completion 副产物非生成主链；WikiRenderers 1,916 行（按文章类型内聚，可留） | generate/wiki/ | 归位评估（低优先） |

## Part II 目标结构（整合/拆分/命名/层级）

### 目标目录树（recipe-pipeline，变更处标注）

```text
recipe-pipeline/
├── RecipePipelineFacade.ts                 [不动]
├── plan/                                   [不动]
├── generate/
│   ├── ColdStartWorkflow.ts                [不动——冷启动全量编排]
│   ├── GenerateWorkflow.ts                 [不动——full/incremental 分发器]
│   ├── DeepMiningRoundGate.ts / ModuleMining*.ts   [不动]
│   ├── incremental/                        ★新——增量扫描归位（自 sustain/ 迁入）
│   │   ├── IncrementalRescanWorkflow.ts    ★P2：7 相编排主体（~550 行，自 KnowledgeRescanWorkflow 196-867）
│   │   ├── RescanCoverageLedgerWriter.ts   ★P2：coverage ledger 写入器（自 :903-1029）
│   │   └── RescanMiningPlanArgs.ts         ★P2：mining 选项构建+校验/规范化器（自 :1031-1195）
│   ├── dedup/                              ★新——查重视野单源（P3）
│   │   ├── GenerateDedupSeeder.ts          ★rescan 播种+bootstrap KB 播种+per-dim titles 投影三合一
│   │   └── GenerateDedupState.ts           ★自 RescanContext.ts 迁出的通用去重状态类型
│   ├── execution/
│   │   ├── RescanContext.ts                [瘦身后保留——只剩 rescan 上下文投影]
│   │   ├── AiDimensionSessionRunner.ts     [M1b 内联块移除→调 GenerateDedupSeeder]
│   │   ├── consumers/                      ★P1：GenerateConsumers 五拆
│   │   │   ├── DimensionResultConsumer.ts  ★checkpoint/统计/事件/hook（含错误路径）
│   │   │   ├── CandidateAccounting.ts      ★候选记账+unique 双口径
│   │   │   ├── TierReflectionConsumer.ts   ★跨维 tier 反思
│   │   │   ├── SessionResultConsumer.ts    ★会话合并
│   │   │   └── index.ts                    ★兼容 re-export（旧导入零断裂）
│   │   ├── AiDimensionFinalizer.ts         [瘦身——只留步骤编排]
│   │   ├── ReportAugmenters.ts             ★P4：四增强器迁出
│   │   ├── AgentRunProcessEvents.ts        [P5 暂缓——分区注释先行]
│   │   └── （其余不动）
│   ├── skill-delivery/                     [SkillConsumer 从 GenerateConsumers 并入此处]
│   └── wiki/                               [P8 本波不迁——completion 已解耦，注记归属]
├── curate/
│   └── README.md                           [P6 强化——指明 Core 四个单源锚点+何时该在此落码的判据]
└── sustain/                                ★收窄为真"存续"语义
    ├── evolution/                          [不动——sweep/file-change 三件套]
    │   └── FileChangeHandler.ts            [P7 并入 InProcessFileChangeHandler 顶部导出]
    └── ProduceSessionPlan.ts               [P7 更名自 ProduceSessionRoute.ts]
```

### 关键设计决策

1. **增量扫描环归位（P2 核心）**：`KnowledgeRescanWorkflow` 是 `registerGenerateWorkflowImplementation('incremental', …)` 的实现——它就是 generate 环的增量模式，搬进 `generate/incremental/`。sustain/ 收窄为真存续语义（进化 sweep、文件监听、gap-fill 计划）。名实修正：真身改名 `runIncrementalRescanWorkflow` 并导出；单行壳 `runKnowledgeRescanWorkflow` 保留为兼容 re-export 一个波次后评估退役。
2. **查重视野单源（P3）**：`GenerateDedupSeeder` 统一三入口——`seedFromRescanContext(existingRecipes)`（原 RescanContext:44-87 播种段）+`seedFromKnowledgeBase(container)`（原 Runner M1b 块，含 undefined/空/成功三态留痕）+`projectDimensionTitles(dimId)`（原 dedupSeedByDim 投影）。Runner 调用点缩到 3 行；行为字节等价（同日志文案、同优先序：rescan 在场即不查库）。
3. **拆分全部走"纯移动+兼容 re-export"**：consumers/index.ts 原样重导出旧符号名，全部既有 import 不断裂；一个波次后跑消费扫描再决定是否收编 re-export。
4. **不动的巨石明确记录理由**：WikiRenderers（按文章类型内聚）、projectInfoTree（金字塔操作强耦合）、PcvStageNodeMap（观测契约单源）、DaemonFileChangeCollector（watcher 状态机整体）——拆了只会把耦合变跨文件。
5. **孤儿处置（P7）**：StagingManager.rollback 保留（P1 Guard 接线在册）；WarningRepository 保留+注记"future consumer: proposal warning surfacing"；两个无消费类型删除（跑跨仓 named-export 扫描后）；`evolution.ts` shim 不动（闭环审计裁定）。

## Part III 分波实施（每波独立验收可回滚，表征先行）

| 波 | 内容 | 改动仓 | 验收 |
|---|---|---|---|
| **W1 查重单源** | dedup/ 模块三合一；RescanContext 瘦身；Runner M1b 块外迁 | 主仓 | 行为等价钉（播种日志文案逐字同、三态留痕同）；build:check+996 单测+真机 bootstrap 探针（seed 日志比对） |
| **W2 消费者五拆** | GenerateConsumers→consumers/ 四文件+SkillConsumer 并入 skill-delivery；index 兼容 re-export | 主仓 | 纯移动零逻辑改；`git diff` 只见移动；全量单测+lint+repo-boundary |
| **W3 增量归位** | KnowledgeRescanWorkflow 三拆迁 generate/incremental/；导出名实修正+兼容壳；sustain 收窄；ProduceSessionRoute 更名 | 主仓 | 全量单测+真机 rescan 探针（七相日志序不变、coverage ledger 写入等价）；`registerGenerateWorkflowImplementation` 注册链验证 |
| **W4 终态与增强器** | Finalizer 拆 ReportAugmenters；ProcessEvents 分区注释 | 主仓 | 报告 JSON 结构字节对比（同输入同输出）；全量单测 |
| **W5 小项清理** | FileChangeHandler 并入；curate README 强化；孤儿类型删除（先跨仓 named-export 扫描 [[cross-repo-deletion-named-export-sweep]]）；wiki 归属注记 | 主仓+Core（类型删除） | 双仓门禁全绿；`find -exec grep` 消费扫描零残留 |

依赖序：W1 独立先行（也消化 M1b 技术债）；W2 与 W3 有共同触点（consumers 被 rescan 导入）故 W2 先；W4/W5 收尾。全程禁与功能改动混波。

## Part IV 验证调校

- **每波门禁**：主仓 `build:check`+全量 vitest（996+ 基线）+lint+`lint:repo-boundary`；涉 Core 波加 Core 1563 基线。
- **真机探针**：W1/W3 后各跑一次两维 bootstrap + 一次 rescan（daemon 重启后），比对：播种/七相/coverage ledger 日志序与文案、[Producer] 双口径数字、报告 JSON 关键投影（dimensions/totals）字节等价。
- **回滚**：每波单 commit；任何真机漂移即整波 revert 后重做。
- **完成定义**：五问题全闭（P1-P4、P6-P7 落地；P5/P8 注记后移交后续）；目录树与本文档一致；无任何行为/API/持久化语义变化；所有旧导入经兼容层零断裂。
