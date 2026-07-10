# AlembicAgent 挖掘 Agent 质量升级 — 原始计划 + 需求设计

- 日期:2026-07-10
- 状态:设计完成,**D1-D5 已决**(2026-07-10,用户按推荐确认;约束:无多余 API key,D1/D4 按现有 key 适配);待用户选择执行模式(未 intake、未派发)
- 主窗口:AlembicAgent;P2 涉及 AlembicCore(staging 复核队列注记)与读面(主体 HTTP / Plugin,可选展示)
- 依据:2026-07-10 成熟度分析(实现文档 3897 行精读 + 真实代码怀疑式审计 + 业界调研);代码锚点均为 AlembicAgent 仓库相对路径,取自当日审计

## 0. 一页摘要

**现状定位**:挖掘 Agent 的接地/反幻觉内核已是生产级(哈希证据台账 + ledger-id-only findings + 机械展开 sources + 新鲜度 re-hash + Core fs 逐字校验),部分强于已发表业界方案(能抓"行号有效但内容不符/文件已改",优于纯 interval-overlap 校验)。但作为知识生产系统,四条不成熟:**产出质量从未被度量、依赖感知检索 prompt-only、内核 175 处 DeepSeek 特化、端到端挖掘零测试**。

**北极星**:把挖掘产出质量从"不可见"变成"**可度量、可回归、可提升**"——每次挖掘改动都能用同一把尺子回答"变好还是变坏"。

**三阶段**(严格串行,P0 是 P1/P2 完成定义的度量前提):

| 阶段 | 主题 | 一句话 |
|---|---|---|
| P0 | 度量与观测 | E2E fixture 管线测试 + 离线质量评估 harness(golden set + 独立 Judge)+ degrade 一等化 |
| P1 | 确定性依赖上下文 + provider 中立内核 | 模块图谱确定性预装配(不再求 LLM 自觉调 graph)+ QuirkProfile 收编 175 处特化 + grep 边界门 |
| P2 | 产出契约收紧 + 在线 critic | ProducerDraft 窄契约(裁撤已计量的修复层)+ critic 进管线 observe-first 辅助 staging 复核 |

P3 候选(**不进本需求执行范围**,见 §8):增量挖掘 checkpoint、依赖簇分块、运行时证据道(需独立安全决策)。

## 1. 背景与代码事实锚点

### 1.1 必须保护的资产(非目标区,任何阶段不得削弱)

- **证据台账闭环**:`ToolExecutionPipeline.ts:881-894` → `EvidenceCapture.ts:235-248` 逐条记录证据(sha256 `contentHash`,`EvidenceLedgerStore.ts:50-52`);`note_finding` 只收 ledger-id、手写证据被拒(`handlers/memory.ts:104-146`);submit 强制 `EVIDENCE_REFS_REQUIRED`(`handlers/knowledge.ts:554-562`),`expandEvidenceRefsForSubmit` 机械展开 sources/sourceRefs/coreCode 并重切重哈希(`EVIDENCE_STALE`,`submitEvidenceExpansion.ts:87-104`);Core 权威门 fs 逐字校验(`SNIPPET_MISMATCH`/`SOURCE_REF_*`,`recipeAuthoringGate.ts:45-153`)。**原语均有真实单测**(EvidenceLedgerStore/SubmitEvidenceExpansion/NoteFindingEvidenceRefs/EvidenceCapture/in-process parity)。
- **架构纪律**:ONE Runtime(Capability+Strategy+Policy)、确定性外壳包 AI、冻结职责 manifest(`behaviorChangeAllowed:false`)、stateless plan gate(失败即 throw,不静默全扫)、fan-out 子错误隔离(`AgentRunCoordinator.ts:179-200`)。
- **既有生态闭环**:staging 复核期(observe-first,复核队列读面 Core/Agent/主体 HTTP 三面)、primeAlignment usage 回流、evolution 衰退决策全覆盖硬门(`EvolutionAgentRun.ts:103-108`)。

### 1.2 已证实的差距(本需求的靶)

| # | 差距 | 代码证据 |
|---|---|---|
| G1 | **质量分全是机械代理**:depth=`filesRead×15+snippets×5`、breadth=`toolTypes×20`、evidence=有非空字符串的 finding 占比、coherence=文本长度+标题+列表 | `evaluation/qualityGates.ts:114-196` |
| G2 | **产出正确性/有用性零度量**:无 golden set、无 P/R、无 judge、evolution 只测陈旧不测正确 | 全仓审计;`EvolutionAgentRun.ts` |
| G3 | **E2E 挖掘零测试**:mining run 测试注入 stub runtimeBuilder 直接返回 `mined:${moduleId}`,analyze→gate→produce→submit 从未被组合验证 | `test/module-mining-agent-run.test.ts:191-217` |
| G4 | **依赖感知 prompt-only**:跨文件推理靠 prompt 求 LLM 调 `graph`;`applyGraphRetryGate` 因 DeepSeek 不调 graph 被禁用成死码 | `gateEvaluators.ts:85-87`;死码 `qualityGates.ts:433-464` |
| G5 | **fan-out 单元不感知规模**:平铺 `modules[]` 切片;预算按全项目 fileCount 而非模块规模;500 文件模块与 3 文件模块同预算 | `AgentRunCoordinator.ts:374-399`;`insightAnalyst.ts:185-219` |
| G6 | **内核 provider 耦合**:src 内 175 处 DeepSeek 引用(AgentRuntime 19 处、ProviderToolChoicePolicy 16 处);in-loop 接地门只对 DeepSeek-V4 且默认 off | `AnalyzeGroundingGuard.ts:19,45-69`;`AgentRuntime.ts:224` |
| G7 | **degrade 静默归零**:弱维度 `degraded=true` 后下游全跳过,只留日志,调用方拿不到"维度被放弃"一等信号 | `PipelineStrategy.ts:261,314-315` |
| G8 | **Producer 契约松**:submit 周围 ~520 行分层自动修复(F4b/c/d/e + style 豁免/降级),修复命中率无计量 | `handlers/knowledge.ts:509-757` |
| G9 | 无跨 run 幂等/断点(仅 gateway 指纹去重);无运行时证据(terminal read-only 是安全姿态,变更需独立决策) | `knowledge.ts:827-839`;`insightAnalyst.ts:127-128` |

### 1.3 业界基线(节选,详见调研记录)

- 引用接地:机械校验、不信任模型自报——interval arithmetic 100% 拦截伪造引用(arxiv 2512.12117)。**我们已超此基线**(逐字+新鲜度)。
- 依赖感知:最相关上下文是"目标**依赖的**符号"而非"最相似片段";静态分析 KG hard-links + AST 结构分块(CodeRAG 2509.16112;Sourcegraph Cody 生产链 embeddings→代码图→rerank)。
- 质量评估:LLM-as-judge(pointwise rubric + pairwise)+ **轨迹评估**(用对工具/顺序)(2412.05579、2506.11102)。
- 反馈闭环:**纯内省自纠不可靠,须独立 critic**;多角色 perspective-diverse critique(2405.06682)。

## 2. 设计原则(全阶段共用)

1. **先度量后设门**:任何新门(judge/coverage)先 observe(只注记不拦截),校准后才可晋级为 gate。复用 staging 复核期 observe-first 先例。
2. **确定性优先于 prompt 期望**:凡能静态装配/静态校验的,不求 LLM 自觉(G4 的教训)。
3. **护城河不回退**:证据台账协议、Core 门字节语义、stateless plan gate、observe-only PCV 默认姿态,任何阶段不得更改。
4. **provider 中立内核**:runtime/evaluation/strategies 零 provider 名分支;特化只允许存在于 ai/providers、ai/transport、Registry 扩展,内核经单一 QuirkProfile 接口消费。
5. **判定与证据同源**:Judge 的输入是台账展开的**真实源码切片**,不是模型转述——声明↔证据蕴含判定因此可精确化(结构优势,业界少有)。

## 3. 总完成定义(北极星验收)

全部满足才算本需求完成:

1. CI 有一条**真实组合链路**的 fixture 挖掘测试(非 stub):analyze→quality_gate→produce→submit 全走,断言候选数/证据 refs/EVIDENCE_STALE 负例/abandoned 出口。
2. 存在**基线质量报告**:golden set 上的 precision/recall + judge 各维度分布 + 成本指标(tokens/accepted candidate),且报告可一键重跑(回归尺)。
3. Judge 与 staging 人工复核的一致率有实测数(≥30 样本),并据此做出"critic 是否进管线"的显式决策。
4. 内核 grep 边界门绿:`src/agent/{runtime,evaluation,strategies}` 零 provider 名分支(经 QuirkProfile 消费);既有 DeepSeek 行为回归测试绿;golden set 指标不回退。
5. 模块上下文确定性预装配上线:Analyst 首轮输入含静态模块图谱;golden set 覆盖度指标(邻居契约触达率/distinct files)较基线提升。
6. degrade 是一等结果:父 run 输出 `abandonedModules[]`(含原因/门分),报告面可见。
7. Producer 修复层全部有命中计数;至少一轮"计量→裁撤死修复/收紧契约"完成,repair-hit-rate 较基线下降。

## 4. P0 — 度量与观测(先看见,再动手)

### P0-1 E2E fixture 管线测试(Tier-A,CI)

- **场景**:CI 里每次改动挖掘链路,自动在一个 3-5 文件的合成 fixture 仓上跑通完整维度管线。
- **输入**:`test/fixtures/mining-e2e/` 合成仓(埋入:一致的错误处理约定 + 一处故意违例 + 一条命名约定 + 一条分层规则 + 一条配置事实);**脚本化 mock provider**——按阶段/迭代产出真实工具调用序列(code.structure→code.search→code.read→note_finding 引用真实 ledger-id;produce 阶段 knowledge.submit 引 evidenceRefs)。关键:mock 必须从工具结果里解析 `[evidence] E-n` 标注再引用,复现真实数据流。
- **输出/断言**:N 条候选 created 且 sources 命中 fixture 文件;中途改写 fixture 文件触发 `EVIDENCE_STALE`(负例);脚本化一条低质量轨迹→维度 abandoned 出口可见(依赖 P0-4);门动作(record_repair/analysis_retry)按脚本触发。
- **状态变化**:临时 sqlite/内存 gateway,测试后清理;不触真实 KB。
- **边界**:mock provider 走真实 ToolRouter/EvidenceLedger/gate/expansion/in-process 授权门(fs resolver 指向 fixture);符合仓规"AI 测试用 mock provider"。
- **调用链**:`runScopedModuleMining`→`AgentRunCoordinator`→child pipeline(insight 4 阶段)→`knowledge.submit`→`recipeAuthoringGate`→gateway。
- **验证**:`npm run test`(该测试并入)+ 全仓 `npm run check`。
- **完成定义**:上述断言全绿并入 CI;G3 关闭。

### P0-2 离线质量评估 harness(Tier-B,非 CI,按需/夜间)

- **场景**:开发者/控制器运行 `npm run eval:mining -- --golden <set> --provider <p>`,得到一份可对比的质量报告。
- **输入**:golden set 两层——(a)合成 fixtures(同 P0-1 仓 + 2-3 个变体,各带**期望产出标注**:kind/最小声明/必须证据文件/可接受 scope + **不应挖出的平凡事实清单**);(b)真实 pinned 快照(Alembic 系某仓固定 commit;标注初稿由现有 accepted+staging Recipe 生成,**用户复核确认**——D2 已决)。provider=**现有 DeepSeek key**(非 CI,不需要新 key)。
- **输出**:JSON+Markdown 报告:precision(judge/人工 uphold 占比)、recall(期望条目命中率,语义匹配而非字符串)、triviality rate(命中"不应挖出"清单)、grounding-semantic rate(见 P0-3)、abandonment rate、tokens/accepted candidate、工具调用分布(轨迹指标:graph 使用率、distinct files、iters/candidate)。
- **状态变化**:报告落 `test-reports/mining-eval/<date>/`;不写真实 KB(隔离数据根)。
- **边界**:harness 是**评估脚本**不是测试,不进 CI 阻断;**只手动按需运行,不设夜间自动化**(D4 已决)。成本估算:单次全量 Tier-B ≈ 6 模块挖掘 + ~30 候选×2 次 judge ≈ 1.5M tokens,按 DeepSeek 价 **< ¥10/次**,现有 key 承担,预算上限在脚本可配兜底。
- **验证**:同一 golden set 连跑两次,报告字段完整、指标波动在声明的方差带内(LLM 方差要在报告里显式给出区间,不装确定)。
- **完成定义**:基线报告 v1 产出并入 ledger;此后 P1/P2 改动必须附前后对比。

### P0-3 独立 Judge(离线评估器)

- **场景**:对每条候选(含 staging 存量样本),Judge 读取**台账展开的真实源码切片**+候选全文,输出结构化判定。
- **rubric(pointwise)**:①声明↔证据蕴含(entailed / partially—需收窄 scope / not-entailed)——这是 G1 的语义补位,靠台账切片可精确判;②非平凡性;③可操作性(是否改变决策);④scope 正确性(声明范围 vs 证据覆盖);硬判定:uphold / narrow / trivial / reject。
- **输入**:候选 + expandEvidenceRefs 的切片 + (可选)一次反证检索(同模块内搜声明反例)。
- **输出**:每候选 verdict JSON;聚合进 P0-2 报告。
- **Judge provider(D1 已决,无新 key 约束下的适配)**:业界建议 judge≠producer 异构以减自偏,但当前无多余 key。采用**同 key DeepSeek-as-judge + 三层独立性缓解**,理由:自偏文献主要发生在"偏好评审"(比较输出、偏爱自身文风),而本 judge 做**证据蕴含核验**(逐字切片 vs 声明),客观性显著更强,且校准协议本身就是实证测偏器。缓解设计:
  1. **上下文隔离**:judge 输入仅=候选全文+台账展开的逐字切片;不给挖掘轨迹、不给 producer 笔记、不透露产出者;按候选批次开独立会话。
  2. **反驳框架**:prompt 采用"仅凭这些切片,尝试反驳该声明;无法反驳且切片支撑才 entailed"——refute-first 对冲 uphold 偏置(对齐 adversarial-verify 模式)。
  3. **judge 自身受机械引用管辖**:verdict 必须引用切片行号佐证,程序用同一套区间校验查 judge 引用(引用行必须 ∈ 提供的切片)——复用护城河,零额外成本。
  - **回退与演进**:校准不达标 → 换本地 **Ollama** 模型当 judge(免费,已在栈内)或双 judge 分歧交人工;judge provider 是配置项,日后有新 key 换异构模型零设计变更。
- Judge **只注记不拦截**(P0 全程离线)。
- **校准协议**:抽 ≥30 条有人工 staging 复核结论的样本,算 judge-人工一致率;**一致率 ≥80% 是 P2 critic 进管线的晋级门**,不达标则留在离线并迭代 rubric(显式回退路径)。**校准同时兼任自偏检测**:单列"人工因过度泛化而收窄/拒绝"的子集一致率——judge 若系统性放行该子集即为自偏签名,直接走 Ollama 回退,不得晋级。
- **完成定义**:rubric+judge 实现、校准数产出、晋级/不晋级的决策记录在案。

### P0-4 degrade 一等化 + 观测指标

- **场景**:某维度质量不达标被 degrade,父 run 结果与报告面能直接看到"维度 X 被放弃,原因+门分"。
- **改动**:child 结果增加 `outcome: 'completed'|'abandoned'`(+reason/gateScores/candidatesSubmitted);merger(`AgentRunCoordinator.ts:520-545` 一带)聚合 `abandonedModules[]` 到父结果;`PipelineStrategy` degrade 分支填 outcome 而非仅 log。同时给 G8 的每个修复层(F4b/c/d/e/style-waiver/advisory)加命中计数,进 diagnostics 与 P0-2 报告。
- **边界**:结果 envelope 加性扩展,不破坏既有消费方(兼容字段保留);不改变 degrade 的触发语义本身。
- **验证**:单测(驱动一条 degrade 路径断言 outcome)+ P0-1 E2E 的 abandoned 断言。
- **完成定义**:G7 关闭;abandonment/repair-hit-rate 出现在基线报告。

**P0 验证矩阵**:`npm run build:check`、`npm run test`(含新 E2E)、`npm run lint`、`npm run eval:mining`(手动,产基线报告)。
**P0 非目标**:不动质量门阈值/权重(先测量现状),不动 prompt,不改 Core。

## 5. P1 — 确定性依赖上下文 + provider 中立内核

> 顺序说明:G4(graph-retry 死码)是 G6(DeepSeek 特化)的连带伤害——不肯调 graph 的是特定模型,惩罚被全局禁用。两者必须同阶段一起修,否则单修覆盖度门会再次被 provider 差异打回。

### P1-1 ModuleContextAssembler(确定性模块图谱预装配)

- **场景**:每个 per-module child 启动时,Analyst 首轮输入已含该模块的静态图谱,LLM 不再需要"自觉调 graph"才能拿到骨架;graph 调用退为精化手段。
- **输入**:ProjectContext facts(fan-out partitioner 已持有,`AgentRunCoordinator.ts:374-497`)。
- **装配内容(确定性,新组件,置于 coordination 或 runs 层)**:模块文件清单(path+size+lang,上限 ~40 条,余量按目录汇总)、import 邻居(入/出各 top-N + 边数)、中心文件(in-degree top-5)。作为结构化块注入 child 首条 user message(system prompt 不变,保住前缀缓存)。
- **输出/状态变化**:Analyst prompt 相应更新:"图谱是导航,引用仍必须 code.read 落台账"——台账协议保证图谱陈旧也不会污染引用(read-before-cite 不变)。
- **边界**:图谱标注 advisory 属性;不新增 Core 接口(消费既有 facts);ProjectContext 部分/陈旧时降级为文件清单-only 并在 diagnostics 留痕。
- **验证**:单测(给定 facts 断言装配输出);golden set 前后对比:邻居契约触达率、distinct files、recall 应升,P/R 不得回退。
- **完成定义**:G4 的"根基靠 LLM 自觉"关闭;死码 `applyGraphRetryGate` 删除(替代见 P1-4)。

### P1-2 预算按模块规模 + 超大模块拆分

- **改动**:`computeAnalystBudget` 基准从全项目 fileCount 改为**模块**文件数+邻居数(分段:≤10→18 iters / ≤30→26 / ≤60→34 / cap 40,数值为可调默认);模块 fileCount>60 时按顶层子目录组拆成多个 child(带 parent module id + subscope 标签),merger 按模块聚合。
- **边界**:拆分只按目录,**依赖簇分块**明确移到 P3(避免此阶段引入图算法复杂度);`scaleCap` 语义不变。
- **验证**:单测(分段/拆分/聚合);golden set 大模块场景成本与覆盖对比。
- **完成定义**:G5 关闭。

### P1-3 ProviderQuirkProfile + 内核 grep 边界门

- **场景**:runtime 里所有"这是不是 DeepSeek"分支改为询问单一 QuirkProfile 接口;新增 provider 只需填 profile,内核零改动。
- **设计**:扩展**既有** `ai/registry`(模型能力注册中心,勿新造平行体系),quirk 轴取自审计实测:forcedToolChoice 支持、text tool-call 兼容、thinking-mode schema 可见性、空响应重试策略、grounding-guard 适格、并行工具调用、schema 预算。LLMGateway/provider 在 run 起点解析出 `providerBehavior` 单对象供内核消费。
- **收编策略**:175 处逐一分类——transport 级合法特化(如 DeepSeek 文本工具调用解析)**留在** `ai/transport/DeepSeekTransport.ts`;内核分支(AgentRuntime 19 处、ProviderToolChoicePolicy 16 处等)迁移到 profile 查询。
- **执行门(可执行完成定义)**:新增 boundary lint——`src/agent/{runtime,evaluation,strategies}` 内 provider 名字符串出现次数为 0(白名单仅 QuirkProfile 类型定义),入 `npm run check`。
- **in-loop 接地统一**:AnalyzeGroundingGuard 从"仅 DeepSeek-V4"改为 classification 驱动、全 provider 一致的轻量 nudge(默认仍 observe/off,真正硬门保持在 submit——不改变 observe-only PCV 姿态)。
- **验证**:grep 门绿;既有 DeepSeek 行为测试绿;golden set 上 DeepSeek 前后 parity(P/R 不回退);非 DeepSeek smoke 用**本地 Ollama**(免费、已在 provider 栈内,不需要新 key)。
- **完成定义**:G6 关闭。

### P1-4 provider 中立覆盖度门(替代 graph-retry)

- **设计**:确定性检查取代"求模型调 graph":模块文件数>N 而 analyst 实读 distinct files<M、或邻居契约文件零触达 → gate action=`analysis_retry` 带定向 nudge(告诉它缺哪块)。判据来自台账(实读了什么是确定事实),与 provider 无关。
- **边界**:observe-first 一轮(只注记)→ 校准阈值后启用 retry;maxRetries 沿用 1。
- **完成定义**:覆盖度门上线且在 E2E 有触发用例;G4 完全关闭。

## 6. P2 — 产出契约收紧 + 在线 critic(observe-first)

### P2-1 ProducerDraft 窄契约

- **依据**:P0-4 的 repair 命中计量(哪些修复层真实在扛、哪些是死枝)。
- **设计**:Producer 面向的 schema 收窄为语义字段(title/kind/markdown/rationale/doClause/contrast/evidenceRefs 选择);file:line/sources/coreCode 全部由确定性装配产生(evidence expansion 已做大半);装配产物与 Core 门输入 shape **字节不变**(不触 Core)。有条件时用 provider 结构化输出(json_schema strict)承接 draft。
- **裁撤规则**:命中率≈0 的修复层删除;仍在扛的保留并保留计数。style 豁免/advisory 语义不变(有意设计)。
- **验证**:repair-hit-rate 前后对比下降;golden set P/R 不回退;submit 相关单测全绿。
- **完成定义**:G8 关闭(契约收紧+计量证据在案)。

### P2-2 in-pipeline critic + staging 复核 auto-triage

- **前置门**:P0-3 校准一致率 ≥80%,否则本项不启动(留离线,迭代 rubric)。
- **设计**:produce 后追加 critic 注记 pass(独立 provider,rubric 同 P0-3),verdict 写入候选注记;staging 复核队列展示 verdict 做 auto-triage(高置信 uphold 排后、低置信/reject 置顶给人工)——**只排序与标注,绝不自动删除**(对齐 G-C"确定性标记+概率性消解"哲学与 staging observe-first 语义)。
- **跨仓边界**:复核队列注记字段属 Core(队列读面 Core/Agent/主体 HTTP 三面),主体/Plugin 读面展示为可选小改——此为本需求唯一 Core 触点(开放决策 D3)。
- **验证**:E2E 注记断言;staging 队列读面单测;成本纳入报告(critic 每候选 1-2 次调用)。
- **完成定义**:critic 注记在 staging 队列可见;triage 排序生效;人工复核语义未变。

## 7. 各阶段生产者/消费者依赖

```
P0-1/P0-4 ──产 CI 尺+观测──▶ P1 全部(完成定义引用其指标)
P0-2/P0-3 ──产 基线报告+校准数──▶ P1 对比验证;P2-2 晋级门
P1-3(QuirkProfile) ──解锁──▶ P1-4(中立覆盖门)
P0-4(repair 计量) ──产 裁撤依据──▶ P2-1
```

单窗口(AlembicAgent)内自序;P2-2 触 Core 时按产消序:Core 注记字段先行,Agent/读面后接。

## 8. P3 候选(本需求非目标,仅登记方向)

- **增量挖掘 checkpoint**:per-project(module×dimension×commit)断点,rescan 驱动只挖变更模块。消费方=coldstart/rescan 流(Core 协同),独立需求。
- **依赖簇分块**:超大模块按调用图聚簇拆 child(P1-2 只做目录拆分)。
- **运行时证据道**:测试执行/运行时行为作为证据来源——**触碰 terminal read-only 安全姿态,必须独立安全决策**,不得随本需求夹带。

## 9. 非目标与保护清单

- 不重构 ONE Runtime/ReAct 内核、fan-out 骨架、证据台账协议、stateless plan gate。
- 不改 Core 权威授权门的语义与字节(P2-1 装配产物 shape 不变;唯一 Core 触点是 P2-2 队列注记,单列决策)。
- 不改变 observe-only PCV 默认姿态(in-loop 统一后仍 observe/off 默认)。
- 不承诺 recall 完备性(golden set recall 是方向性指标,标注集小而准)。
- 不动 staging 复核期人工权威(critic 只 triage 不裁决)。
- L4 compaction 默认开关、SafetyPolicy 细粒度 scope 激活、ExitController 迁移收尾:已知残留但与产出质量无关,不并入(避免范围蔓延)。

## 10. Test 决策

- P0/P1/P2 全部可控制器自验(AlembicAgent 仓内:单测 + fixture E2E + 手动 eval 脚本;Tier-B 用真实 key 但非 CI,符合"CI 用 mock provider"仓规)。
- **不需要** Test 窗口介入本需求完成定义;真实 pinned 快照评估若日后要在隔离真机做,再按 Test 卡流程单列(环境规格届时确认)。

## 11. 风险与回退

| 风险 | 缓解/回退 |
|---|---|
| Judge 校准不达标(<80%) | 显式回退:critic 留离线,P2-2 不启动;rubric 迭代不阻塞 P1 |
| **同源 judge 自偏**(DeepSeek 评 DeepSeek) | 三层缓解(上下文隔离/反驳框架/judge 引用受机械校验)+ 校准单列"过度泛化子集"一致率作自偏签名检测;命中→Ollama 回退,不得晋级 |
| golden set 太玩具 | 双层设计(合成+真实快照);真实快照标注经用户复核 |
| provider 收编回归 | grep 门 + 既有 DeepSeek 测试 + golden parity 前后对比;transport 级特化不动 |
| 图谱陈旧误导 | advisory 属性 + read-before-cite 台账协议兜底(引用必经真实读取) |
| eval 成本失控 | 手动按需运行(无夜间自动化)+ 单次 <¥10 估算 + 脚本预算上限兜底 |
| LLM 方差让指标不可比 | 报告显式方差带;同 set 双跑;结论看区间不看单点 |

## 12. 决策记录(2026-07-10 用户按推荐确认;约束:无多余 API key)

- **D1(已决,适配无新 key)**:Judge = **同 key DeepSeek + 三层独立性缓解**(上下文隔离/反驳框架/judge 引用受机械校验),校准兼自偏检测;回退=本地 Ollama;日后有新 key 换异构模型是纯配置变更。详见 §P0-3。
- **D2(已决)**:真实快照=Alembic 系一仓固定 commit;标注初稿自动生成(源自该快照上 accepted+staging Recipe),用户复核确认。具体选仓在 P0-2 启动时定(倾向 AlembicAgent 或 Core 自身,dogfood)。
- **D2+(2026-07-10 用户补充)**:Tier-B 的 ground truth **优先复用进化环里既有的人工标记**——staging 复核结论(uphold/reject/narrow)与 evolution 决策(evolve/deprecate/skip)是现成的人工判定语料,作为校准集与 golden 标注的第一来源;Judge 的评估重心放在**空白新增候选**(尚无人工标记的净新产出)上,judge 先判→人工复核确认→标记语料持续增长,形成"人工标记→校准 judge→judge 预筛空白新增→人工确认"的循环。
- **D3(已决)**:授权 P2-2 的 Core 复核队列注记字段跨仓触点(Core 先行、Agent/读面后接;critic 仍只 triage 不裁决)。
- **D4(已决)**:Tier-B 只**手动按需**运行,不设夜间自动化;单次全量 <¥10(现有 DeepSeek key),脚本预算上限兜底。
- **D5(已决)**:P3 三项(增量 checkpoint/依赖簇分块/运行时证据道)进 backlog **仅登记不排期**;运行时证据道启动前必须单独过安全决策。

## 13. TODO 建议(intake 用,未写入全局板)

- 一个 demand:`alembic-agent-mining-quality-upgrade`,三个 phase 包(P0/P1/P2,串行),窗口=AlembicAgent(P2-2 已授权 Core 注记触点→届时加 Core+读面小包)。
- Auto Claim 建议:P0 可 yes(纯增量、无跨仓、完成定义可机验);P1 建议 no(需 P0 基线报告在手才能写对比验证);P2 建议 no(P2-2 有校准晋级门的实证依赖)。
- P3 三项按 D5 进 backlog 登记(仅登记不排期)。

## 14. 修订记录 R1(2026-07-10)：P0 完成 + 实施发现驱动的 P1 重构

### 14.1 P0 完成状态(直推执行,commit 2ba1944 + 65be28f,全仓 check exit0/62 文件 466 测试)

- P0-1 ✅ 全真链 E2E 入 CI(`test/mining-e2e-pipeline.test.ts` 三案例:healthy created / EVIDENCE_STALE 负例 / weak→abandoned)。
- P0-2 ✅ `npm run eval:mining` harness + golden set v1(隔离:临时 fixture/dataRoot/内存 gateway)。
- P0-3 ✅ Judge(隔离+refute-first+judge 引用区间机械校验)+ `computeJudgeCalibration` 晋级门 + `eval:judge-calibration` CLI。
- P0-4 ✅ `phases._pipelineOutcome` + `abandonedModules/abandonedDimensions` + submit 9 修复层命中计数。
- ⏳ 门 0(用户):Tier-B 基线报告 v1(需 key,<¥10)——`npm run build && ALEMBIC_DEEPSEEK_API_KEY=… npm run eval:mining -- --judge`;校准跑需 staging 人工标记导出。

### 14.2 实施发现(F1-F4,真跑才暴露;全部转化为 P1-A)

- **F1 证据通道压力瓦解**:`ContextWindow.getToolResultQuota()` 压力阶梯(≥0.95 档 maxChars=400)+ head+tail 截断会把 `[evidence]` 尾注整段吞掉→模型引用不到台账→findings unverified→产出坍缩。E2E 里的窄 evidence.search 解法仍是 prompt-only。**确定性修法**:`limitToolResult`(或 AgentRuntime 格式化点)标注感知——截断后把 `[evidence]` 尾注(~200 字)重挂回尾部。
- **F2 第三静默归零形态**:analysis_retry 耗尽→break→`completed + 0 候选`,不在 degrade 族、无原因留痕(PipelineStrategy `#processGate` 重试耗尽分支)。修法:同点写 `_pipelineOutcome`(action='retry_exhausted')。
- **F3 单读无 file 条目**:`EvidenceCapture.normalizeDrafts` 只认批量 read 的 `structuredContent.files[]`;单 path read 落无 file 条目→unverified 折价。修法:fallback 分支从 `call.args.params.path` 补 file。
- **F4 装配契约隐式**:`container.get('capabilityCatalog')` 缺席→toolSchemaCount=0→toolChoice=none,工具面静默死亡零诊断。修法:reactLoop 初始化对"capabilities 非空但 schemas=0"打 warn 诊断事件(不改行为)。

### 14.3 P1 重构:拆 P1-A / P1-B(取代原 §5 的单一 P1)

**P1-A 证据通道与观测补全**(新增;确定性小修、全 provider 生效、harness 可量前后差):
- 范围:F1 标注感知截断、F2 retry_exhausted 一等化、F3 单读 file 归属、F4 装配诊断。
- 验证:各项单测 + E2E 扩展(F1 加"压力档下标注存活"用例;F2 弱案例变体断言 retry_exhausted);完成定义 = 全仓 check 绿 + harness 复跑 findings-verified 率/候选 yield 对基线不降、F1 场景可证改善。
- 顺序约束:**门 0 基线先跑**(改动前对照),P1-A 后复跑出 delta。

**P1-B 确定性依赖上下文 + provider 中立内核**(原 §5 P1-1~P1-4 全保留,内容不变):ModuleContextAssembler / 预算按模块规模+目录拆分 / ProviderQuirkProfile+grep 边界门 / 中立覆盖度门(删 graph-retry 死码)。P1-A 是其地基(图谱注入的输出同样受益于抗截断通道)。

**P2/P3 不变**;P3 候选池追加:真实快照评估(D2 pinned commit)排在校准语料积累后。

### 14.4 P1-B-3 迁移清单(2026-07-10 subagent 盘点,真分支远少于 175 处字面量)

**真控制流分支只有 10 处,收敛为 5 个 quirk 轴**;其余是注释(24)/命名(≈10)/manifest 记录:

| 分支 | 位置 | quirk 轴 |
|---|---|---|
| #1 根谓词 isDeepSeekV4AnalyzeFirstBurn(regex+phase 门) | ProviderToolChoicePolicy.ts:83 | analyzeGroundingGuardEligible(phase 部分留内核,provider 部分查表) |
| #2/#3/#5/#6/#9 keepToolSchemasVisible/observe-mode/抑制例外/PCV 证据形状 | PTCP:35,57;AgentRuntime:966-983,1214-1217;PcvNodeEvidenceRecorder:395-420 | forcedToolChoiceUnsupported(**已可从 registry 导出**:`parameterConstraints.toolChoice.allowed===false`,deepseek.ts:33,54 已有) |
| #4 isToolSchemaHarmful(deepseek-v4∥gemini) | AgentRuntime:964-965 | dropToolSchemasWhenToolChoiceNone(双 provider,显式字段) |
| #7 接地策略文案附加句 | AnalyzeGroundingGuard:34-37 | groundingPolicyProviderNote(string∥null,字面量移进 src/ai) |
| #8 invalid-no-evidence 拦截门 | AnalyzeGroundingGuard:50 | analyzeGroundingGuardEligible |
| #10 call_deepseek_compat_ 前缀分类 | AgentRuntime:2650 | usesTextToolCallCompat(前缀常量+matcher 移到 src/ai 与 deepseekToolCallCompat.ts 同宿) |

**设计**:ModelDef 加 `quirks?: QuirkProfile`(5 字段),`getModelRegistry().get(modelRef)?.quirks` 单点消费;reasoning-content passback 已有 `reasoning.requiresContentPassback` 覆盖,无需内核分支。**注意的爆炸半径**:①三个 provider 名导出函数(observeDeepSeekV4ToolChoiceMode/allowsDeepSeekV4ToolCalls/isDeepSeekV4AnalyzeFirstBurn)有跨文件消费方,改名需同步;②PCV 证据字段 `deepseekV4ToolChoiceMode` 是**记录形状**(下游投影可能消费),改名前须扫 Core/Plugin 读面——或保留字段名仅换判定来源(观测面兼容优先);③三个 mode 字符串常量移进 src/ai。grep 边界门按"分支模式"设计,注释/历史命名走白名单或随迁移逐步清零。

### 14.5 产消依赖(修订后)

```
门0 基线(用户) ──对照──▶ P1-A(F1-F4) ──复跑 delta──▶ P1-B ──▶ P2(critic 晋级仍以校准为门)
```

## 15. 调研与证据引用

- 业界:arxiv 2512.12117(citation-grounded code comprehension)、2509.16112(CodeRAG)、2412.05579(LLM-as-judge 综述)、2506.11102(agent 评估综述)、2405.06682(自反思局限)、2511.13646(Live-SWE)、2601.08773(AST vs LLM KG)、Sourcegraph Cody 文档。
- 内部:`wakeflow-ledger/AlembicAgent/alembic-agent-implementation-complete-2026-07-01.md`(设计权威);2026-07-10 真实代码审计(本文件 §1 锚点);既有闭环:staging 复核期、primeAlignment 回流、evolution 硬门。

## 16. 执行记录(2026-07-10,用户授权直推)

P0 与 P1 全部落地,AlembicAgent main 六个 commit(均在 commit 时全仓 check exit0;终态 64 测试文件/487 测试):

| 阶段 | commit | 内容 |
|---|---|---|
| P0(度量) | 2ba1944 | `phases._pipelineOutcome` 一等 abandoned 结局 + submit 9 修复层命中计数 + 全真链 mining E2E 进 CI |
| P0(评估) | 65be28f | `eval:mining` harness + golden set v1 + 独立 judge(refute-first+引用机械校验)+ `computeJudgeCalibration` 晋级门 |
| P1-A | d66a7e7 | F1 标注感知截断(EVIDENCE_TAIL_RE 摘挂回,cap 800)/ F2 retry_exhausted 一等化 / F3 单读 file 归属 / F4 装配空 schema 诊断 |
| P1-B-1/2/4 | f8ce4ce | ModuleContextAssembler(模块图谱进 guide)/ computeModuleAnalystBudget(18/26/34/40)/ splitOversizedModule(>60 目录装箱)/ applyModuleCoverageGate 取代已删 applyGraphRetryGate;`./prompts` 公共签名重生成 |
| P1-B-3 切片1 | eeb893f | `src/ai/registry/ModelQuirks.ts` 单一查询面(5 字段档案)+ PTCP/AnalyzeGroundingGuard/PcvNodeEvidenceRecorder 改为查表 |
| P1-B-3 切片2 | e960eea | AgentRuntime 消费 quirks(schema 隐藏/文本兼容 call 来源分类)+ 导出改名同步消费方 + `scripts/lint-provider-neutral-kernel.mjs` 中立门进 `npm run check` |

### 16.1 相对 §14.4 设计的三处有意偏差(实现时决策,均已在源码头注声明)

1. **解析器而非 ModelDef 新字段**:未加 `quirks?:` 声明字段,改为 `resolveModelQuirks()` 从既有注册表数据导出(`parameterConstraints.toolChoice.allowed===false` 即 forced 轴单源),未注册 ref 回退旧内核逐字同款名字正则——避免第二数据源漂移,语义保真。
2. **deepseek-reasoner 声明修正**:注册表已声明 toolChoice.allowed=false 而旧 V4 正则漏判;现按声明数据判 forcedToolChoiceUnsupported=true(数据先于名字)。这是唯一一处行为差异,方向是修正而非回归。
3. **PCV 记录字段保名**:`deepseekV4ToolChoiceMode` 按 §14.4 爆炸半径注意②保留字段名仅换判定来源(下游投影兼容),源码处加 `provider-name-ok` 标记走门禁白名单。

### 16.2 门 0 完成 + 当前阻塞门

**门 0 已完成(2026-07-10 用户提供临时 key 真跑)**:基线报告 v1 = `alembic-agent-mining-quality-gate0-baseline-report-2026-07-10.md`。权威对照(同尺):基线 0 候选/degraded 弃置 vs HEAD 5 候选/recall 100%/15 迭代一次过门/terminal 17→2。过程发现并已修 harness 覆盖缺陷(直呼 profile 绕过生产入口,AlembicAgent 2c4a582);两项待修观察(judge 引用校验过严致全裁决 void、submitRepairs 零样本需证伪假零)登记在报告 §5。

- ~~门 0 基线~~ ✅ 完成(见上);P2-1 裁撤依据仍不足——修复计数零样本,先证伪假零(报告 §5-2)再积累量。
- **校准语料**:staging 复核队列人工标记导出 JSON → `npm run eval:judge-calibration -- --input <export.json>`——P2-2 晋级门(≥80% 一致 ∧ ≥30 样本 ∧ 无自偏签名,不达标 critic 留离线)。
- 六个 commit 未 push(用户 push 门)。
