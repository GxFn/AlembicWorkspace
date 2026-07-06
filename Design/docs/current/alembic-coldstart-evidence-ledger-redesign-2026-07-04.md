# Alembic 冷启动链路机制重设计——证据台账（Evidence Ledger）架构 ＋ AlembicAgent 深度升级

- 日期：2026-07-04（同日扩展 Part II）
- 状态：**设计定稿，用户直推线直接执行（2026-07-04 用户授权：不走 Wakeflow 派发）**；Part I=冷启动证据保真主线，Part II=Agent 全景审查与深度升级
- 执行约束（用户 2026-07-04 声明）：PCV 是测试辅助功能，**可抽取其能力概念，但主体功能不得直接依赖 Pcv\* 文件**
- 配套：[original-plan](alembic-coldstart-evidence-ledger-redesign-original-plan-2026-07-04.md)
- 排查证据：真机 job `bootstrap_mr5ckv5p_211536ea`（ecf32806）工件 + `logs/combined.log` 拒绝行 + 记忆 `alembic-coldstart-deepseek-low-yield-rootcause`
- 现状锚点来源：2026-07-04 三路只读代码测绘（流水线阶段机制 / 提交门禁链 / 证据存储面），本文所有 file:line 均来自该测绘

## 0. 一句话架构

**把"证据"从模型上下文里的易失文本，升级为运行时自动落盘、条目化、可寻址、全链路只读可查的 session 级台账文件；引用从模型手写的自由文本 file:line，改为台账条目 ID。** 捏造从"提示词劝阻"变为"语法层面不可能"；压缩/截断从"丢证据"变为"丢摘要、原文永远可取回"。

## 1. 问题全景（P1–P14，均有现场或代码证据）

### 保真主链（本次事故直接链）

- **P1 引用自由文本化，录入零校验**：note_finding 的 evidence 是纯字符串直存 scratchpad，无任何可解析性检查（AlembicAgent `src/tools/runtime/handlers/memory.ts:93-133` → `ActiveContext.ts:433-453` `#scratchpad.push({finding, evidence, ...})`）。捏造引用录入即成功，还得到鼓励式回显。
- **P2 阶段工具面与修正能力错配**：RECORD 相 availableTools 收窄到仅 note_finding 且禁再探索（`LLMInputAssembly.ts:301-302`）；produce 阶段无任何 code 工具（`GenerateProduce` toolset：knowledge.submit + memory.recall + meta.review）。发现错误的地方（submit 门禁）恰好是无法修正错误的地方。
- **P3 传输带重建丢弃原始证据**：多级压缩叠加——ContextWindow `#compactL1` 头尾截断 2000→500（`ContextWindow.ts:570-599`）、ActiveContext 工具特化压缩 95-99%（`ActiveContext.ts:32-96`）、producer 侧 submit 轮次折叠（`LLMInputAssembly.ts:129-176`）。后期轮次上下文里只剩摘要，模型写引用只能凭记忆（实测 analyst i30 会话史仅剩 note_finding）。
- **P4 配额与真实证据脱钩**：`N = max(3, ⌈evidenceToolCallCount/2⌉)`（`ExplorationStrategies.ts:96-98`，nudge 拼装 `NudgeGenerator.ts:437`）。本次 37 次证据调用→逼 19 条发现，但真实验证充分的只有 ~10 条——配额压力直接催生"真现象配假引用"。且该公式与 plan 的 dimensionEvidenceDensity 密度目标完全脱钩（两套目标体系并存）。
- **P5 producer 粮草＝启发式摘要+硬截断**：buildAnalysisDigest 按"标题/含路径/关键词"行级挑选、上限 2200 字符（`insightProducer.ts:425-461`），limitText 截断加 `[truncated for Producer token budget]` 标记（`:464-469`）。producer 被要求产出 verbatim coreCode，但手里只有摘要。
- **P6 质量体系分裂**：分析质量门（QualityScorer，`AlembicCore src/service/knowledge/validation/quality/QualityScorer.ts:107-134`）只评叙事结构/长度/信心，**不校验引用可解析性**——本次两维度质量门 98/100 全过、随后 93% 提交被拒，两个质量体系互相不知情。

### 提交侧（已有相当自愈，但天花板已到）

- **P7 自愈机制覆盖不到"路径从未存在"**：已落地 F4b（SNIPPET_MISMATCH 拒绝附引用范围真实代码，`knowledge.ts:212,481-491`）、F4c（自动 verbatim 对齐 `:411-424`）、F4e（graph refs 注入 `:425-452`）、F4f（裸引用从 analyst grounded ranges 补行号 `:400-404`）、H1（同题第 3 次拒绝 terminal `:384-398`）、F3（连拒 STOP `:506-525`）。但 SOURCE_REF_NOT_FOUND（本次最大拒因，8 次）没有任何自愈可能——文件不存在，无原文可附、无行号可补。**这证明提交侧修补已到天花板，必须上游治理。**
- **P8 拒绝反馈信息量不足**：INSUFFICIENT_EVIDENCE 只说"add 3 distinct files"不说已解析成功哪些（`gateRules.ts:876-885` 未把 validSourcePaths 传入拒绝文案）；去重冲突只回 "already submitted" 不指认撞了哪条。
- **P9 重试机制在错误层面循环**：rejection_gate `rejected>success && rejected>=2 → retry`、maxRetries=1（`gateEvaluators.ts:315-347`、`PipelineStrategy.ts:403-437`）——重试重回 produce 但粮草未变，无新信息注入。

### 周边机制（顺带修 or 记录为独立观察）

- **P10 模型服从性弱放大一切**：DeepSeek 本次被 nudge 20 次（叙述不调工具）；BOOTSTRAP_NUDGE_BUDGET=4/维度的常规预算被远超（`NudgeGenerator.ts:60-71`）。schema 层强制（required 字段）比提示词有效。
- **P11 scratchpad 易失**：ActiveContext#scratchpad 是单次 execute 生命周期，distill 失败即全丢（`ActiveContext.ts:260-295`）。
- **P12 recall/get_previous_evidence 无陈旧标注、采样前 8 条截断**（`memory.ts:157-201,186-194`）——跨 run 证据复用的陈旧风险（本次非主因，机制上敞口）。
- **P13 取消后无断点续跑**：DimensionCheckpoint 只记完成维度（Core `workflows/surfaces/persistence/DimensionCheckpoint.ts:10-51`，TTL 1h），无 resume-run API——本次取消后 8 维只能整跑。
- **P14 诊断字段部分断线**：bootstrap report 的 toolUsage 恒零（现场实测 total=0 与实际 112 次调用矛盾）。

## 2. 设计目标与完成定义

**目标**：冷启动链路中，任何进入知识候选的 file:line 引用都必须机械地来自真实工具采集，不经模型手写；压缩只压摘要、不丢原文；产出配额受真实证据量约束。

**完成定义**（全部满足才算达成）：

1. EXPLORE 阶段所有证据类工具返回（code.read/search/outline/structure、graph、terminal）由运行时**自动**写入 session 证据台账，条目带稳定 ID、verbatim 内容、contentHash——不依赖模型任何配合；
2. note_finding 的引用契约改为台账 ID（`evidenceRefs`），录入时即校验 ID 存在与范围合法，捏造引用**在记录时即被拒**（表征测试钉住）；
3. RECORD/produce 阶段可通过只读 `evidence` 工具查台账原文；producer 的 coreCode/sources 从台账程序化展开，不经模型转写；
4. 提交门禁语义**字节级不放松**（gateRules 谓词与拒因不动）；submit 时新增台账→fs 的 contentHash 新鲜度终检；
5. 真机同基线对比（同 workspace、同 DeepSeek）：维度接受率相对 baseline（15 产 1 过 / 8 产 2 过）显著回升，且投毒用例（捏造 ID、改文件后提交）全部被拒；
6. token 预算不恶化：台账在盘不在上下文，evidence.get 按 range 限量取回。

## 3. 核心架构

### 3.1 台账数据模型（Core domain 契约，单源）

```
EvidenceEntry {
  id: string            // "E-<seq>"，session+dimension 内单调
  sessionId, dimensionId
  tool: 'code.read' | 'code.search' | 'code.outline' | 'code.structure'
      | 'graph.overview' | 'graph.query' | 'terminal.exec'
  callId: string        // 关联原始工具调用（对齐 PcvNodeAcceptedFindingRef.callId 既有链路）
  file?: string         // repo-relative（read/search 命中必填）
  range?: {start,end}   // 1-indexed，与门禁 SOURCE_REF_RE 语义一致
  content: string       // verbatim 原文（read=范围切片；search=命中行+context；graph=结构化结果序列化）
  contentHash: string   // 复用 DeltaCache 同型 hash（AlembicAgent src/tools/runtime/cache/DeltaCache.ts:14-84）
  capturedAt: number
}
```

- 契约（类型、ID 语法、校验谓词）落 **AlembicCore `domain/knowledge/`**（与 recipe-authoring-spec 相邻，双宿主单源）；存储实现落 Agent 运行时。
- 存储介质：**session 目录下 append-only JSONL**（`<dataRoot>/.asd/evidence-ledger/<jobId>/<dimId>.jsonl`），与 job-artifacts 并列——正是用户要的"非压缩临时文件系统"，天然可人工查看/审计；run 结束保留供审计与后续增量（CG-1）。
- 体积纪律：read 全文件时条目存**范围切片**而非整文件（整文件另存单份 hash 快照，条目引用之）；单条 content 上限与总账预算（CG-1 定数值）。

### 3.2 采集即落盘（运行时拦截，模型无感）

- 拦截点：工具 runtime 的统一 dispatch/observe 层（候选：`ActiveContext.recordToolCall()` 或 tools/runtime dispatch 出口——E1 实现时二选一定死，原则是**在压缩发生之前**）。
- code.search 返回已有结构化 `SearchMatch {file,line,content,context}`（`handlers/code.ts:47-52`）——落账取结构化源，不解析渲染文本；code.read 的 `{files:[{path,content}]}` 同理。
- 工具返回给模型的文本**追加条目 ID 标注**（如每个命中/读取块尾注 `[E-017]`），模型从第一眼就以 ID 认知证据。

### 3.3 引用＝台账 ID（note_finding 契约改造）

- schema：`evidence` 字段替换为 `evidenceRefs: string[]`（required，配 `excerpt?` 允许模型附短摘）；**schema 强制优先于提示词劝导**（P10 教训）。
- 录入校验（纯台账查询，零 fs 成本）：ID 存在、属于本 session+dimension、（带 range 时）range ⊆ 条目 range。不通过→工具返回 fail + 最近似候选 ID 提示，**不落 scratchpad**。
- findings 的持久化投影（scratchpad→SessionStore→producer artifact）全程携带 evidenceRefs——P11 的 distill 丢失面同步收窄。
- **PCV 约束落点**：台账是全新主线契约，仅借鉴 `PcvNodeAcceptedFindingRef {callId, sourceRefs}`（`PcvNodeEvidenceRecorder.ts:56-99`）的 callId↔证据链路**概念**——零 Pcv 文件 import；PCV 可作为台账的可插拔订阅者继续服务测试（见 §11 R-2）。

### 3.4 全链路只读可查（新 `evidence` 工具）

- `evidence.get(id, range?)`：按条目/子范围取 verbatim 原文（限行数预算）；`evidence.search(query)`：在台账内检索（不触 fs）。
- 加入 RECORD 与 produce 工具面（`GenerateAnalyze.ts:15-22` / GenerateProduce toolset）；RECORD 指令改为"禁探索文件系统，允许查证据台账"（`LLMInputAssembly.ts:301-302` 措辞同步）——查已采证据不是探索，相纪律不破。
- quality_gate 评估器可选消费台账做引用可解析性抽查（P6 缝合点，additive，不改评分公式）。

### 3.5 producer 粮草改革

- gateArtifact 的 findings 携带 evidenceRefs；buildProducerPromptV2（`insightPreset.ts:105-113`）注入"findings+refs+台账句柄"，叙事摘要降级为背景（可继续 2200 字截断——因为原文可随时取回，截断不再毁证据）。
- **coreCode 与 reasoning.sources 由运行时从 evidenceRefs 程序化展开**（submit handler 侧组装，`knowledge.ts` F4c/F4f 的既有规范化管线升级为"台账优先"），模型只选 ID+写叙述。SNIPPET_MISMATCH/行号漂移在构造上消失。
- 拒绝反馈增强（补 P8）：INSUFFICIENT_EVIDENCE 附"已解析成功的文件清单+台账内可用的其他 distinct 文件候选"；去重冲突附撞题条目标题。

### 3.6 门禁协同（不放松，前移+终检）

- 三阶段门禁（`gateRules.ts:595-975`）与九拒因语义不动；FsSourceRefResolver（`FsSourceRefResolver.ts:32-83`）保留为最终权威。
- 新增可选 LedgerResolver port（与 fs resolver 同型注入，Core ports 风格）：sources 带台账出处时，先做台账一致性核验，再做 **contentHash vs 当前 fs 的新鲜度终检**——run 中途文件变更会被抓住（R4）。无台账注入时行为与现行完全一致（host-agent 路径零回归）。

### 3.7 配额与证据量绑定（收 P4）

- `targetMemoryFindingCount` 改为由**台账可支撑量**推导（如 distinct-file 证据条目数），并与 plan 密度目标对齐取约束（CG-5/CG-6 定公式）；台账不足以支撑配额时，nudge 语义从"继续记录"改为"回 EXPLORE 补证据"（转相条件加台账维度）。

### 3.8 生命周期与安全

- 台账属 session 临时产物：默认保留于 dataRoot（沙箱内），纳入现有 redact 纪律（`AgentRuntime.ts:2688-2691` redactDeveloperText 同规则应用于落盘 content）；不进 git、不进知识库。
- 与既有组件关系（不重复建设）：job-artifacts（诊断视角）并存；DeltaCache（内存加速）保留并供 hash；PCV 方向修正为**PCV 订阅台账**（观察层消费主线事件），台账绝不 import Pcv 文件；DimensionCheckpoint 保留，断点续跑升级见 Part II U-5。

## 4. 分阶段实施（producer→consumer 顺序，每阶段可独立验收）

| 阶段 | 仓库 | 内容 | 验收 |
|---|---|---|---|
| **E0 基线钉** | AlembicAgent | 表征测试钉住现状可测点：note_finding 零校验、produce 无 code 工具、limitText 截断标记、配额公式；保存本次真机 run 指标为 baseline 数据 | 表征测试绿（记录现状而非改行为） |
| **E1 契约+存储** | AlembicCore（契约）+ AlembicAgent（存储） | EvidenceEntry/ID 语法/校验谓词入 Core domain；Agent 侧 JSONL append-only store + 读 API + redact | Core/Agent 单测：写读回、hash、范围切片、预算上限 |
| **E2 采集落盘** | AlembicAgent | 工具 runtime 拦截层自动落账；返回文本附 ID 标注 | 单测+录制回放：一次 analyze 探索后台账条目与工具调用一一对应、零模型参与 |
| **E3 引用改契约** | AlembicAgent | note_finding schema→evidenceRefs（required）+录入校验+近似候选提示；findings 投影全程带 refs | 表征反转：捏造 ID 录入被拒；真实 ID 通过；scratchpad→artifact 链路 refs 不丢 |
| **E4 全链可查** | AlembicAgent | evidence.get/search 工具 + RECORD/produce 工具面与指令更新 + 配额绑定台账/回 EXPLORE 转相 | 两相表征：RECORD 可查不可探；配额随台账证据量变化；quality_gate 抽查钩子（可选）通 |
| **E5 producer 改革+门禁协同** | AlembicAgent + AlembicCore | coreCode/sources 程序化展开；LedgerResolver port + contentHash 新鲜度终检；拒绝反馈增强（P8 两缺口） | 单测：展开产物逐字过 SNIPPET 谓词；投毒用例（改文件后提交）被新鲜度拦；host-agent 路径（无 port 注入）行为零回归（全量测试基线对比） |
| **E6 真机端到端** | 主体 + 真机 | 同 workspace、同 DeepSeek 冷启动 ≥2 维度，对比 baseline：接受率/拒因分布/token/nudge；投毒对照组 | 接受率显著回升+anti-fab 红线全守+token 不恶化；证据=bootstrap report+台账文件+拒绝日志 |

跨仓顺序约束：E1 Core 契约先行（Agent 消费）；E5 的 Core port 为 additive、缺省不注入=现行为；主体（Alembic 仓）预计零改或仅接线级改动（RecipePipelineFacade 传递 jobId 到台账目录已有 dataRoot 通道）。

## 5. 非目标与硬护栏

- 提交门禁字节级不放松：gateRules 谓词、拒因码、EVIDENCE_FLOOR、SNIPPET 匹配算法（`gateRules.ts:227-260`）全部不动；
- host-agent（MCP/codex/cc）路径本期不改——契约放 Core 已为其预留，接入是后续独立需求；
- 不重引 daemon/常驻进程；不改四工具对外 MCP 语义；不动 freeze 清单（job kind/lifecycle/coverage_ledger 列等）；
- 不做跨 run 证据复用与陈旧治理（P12）、不做断点续跑（P13）——记独立观察项，防 scope 膨胀；
- F4*/H1/H2/F3 既有自愈机制全保留（台账使其输入更可靠，不替代）。

## 6. 风险与缓解

- **R1 台账体积**：范围切片+单条上限+总账预算+JSONL 分片；read 全文件走 hash 快照引用。
- **R2 evidence.get 滥用膨胀上下文**：按 range 限行+调用预算，超限返回摘要+提示缩范围。
- **R3 模型不服从新契约**（DeepSeek 服从性弱）：schema required 硬约束（不满足=工具调用直接失败）+录入拒收闭环，不依赖提示词自觉；E6 用 DeepSeek 原模型验收。
- **R4 run 中途文件变更**：submit 时 contentHash 终检，变更→拒并提示重读（新拒因走现有 violation DTO，additive）。
- **R5 双宿主漂移**：契约única 在 Core；gate port 缺省关闭=host 路径字节不变；E5 验收含 host 路径零回归项。
- **R6 改造期间生成质量波动**：E0 baseline+E6 对照，任何阶段真机指标回退→按门禁不放松原则回滚该阶段接线（台账层保留）。

## 7. 开放决策（需用户/后续 Design 拍板）

- **CG-1 台账介质与预算数值**：推荐 session JSONL（临时文件系统直觉、免 migration、审计友好）；单条 content 上限、总账上限数值待定。
- **CG-2 note_finding 兼容策略**：推荐硬切 evidenceRefs（in-process 无外部调用方，提示词同源同改）；备选双轨过渡一版本。
- **CG-3 契约归属**：推荐 Core domain/knowledge（双宿主单源）；备选 Agent 内部（更快但埋漂移）。
- **CG-4 RECORD 是否保留少量 code.read 自证配额**：推荐否（台账已 verbatim，保持相纪律）；备选给 2 次/维度兜底。
- **CG-5/6 配额公式**：台账 distinct-file 量与 plan dimensionEvidenceDensity 的合成方式（min/分层）待定；含"不足回 EXPLORE"的转相阈值。
- **CG-7 E6 验收模型面**：DeepSeek 必选（复现原问题模型）；是否加第二 provider 对照。

## 8. 用户四点意见的吸收位置

- ①（note_finding 就地校验）→ E3，且从"fs 存在性校验"升级为"台账 ID 校验"（更强：不仅存在，还必须真采集过）；
- ②（拒绝附真实路径）→ 已部分存在（F4b），E5 补齐 INSUFFICIENT_EVIDENCE/去重两个缺口；
- ③（截断保 verbatim）→ E5 粮草改革根治：verbatim 不再走截断通道，由台账程序化展开；
- ④（提示词强化逐字引用）→ E2 的 ID 标注 + E3 的 schema 硬约束替代纯提示词（提示词同步更新但不作为唯一防线）。

---

# Part II：AlembicAgent 全景审查与深度升级（2026-07-04 扩展）

依据：全仓只读测绘（运行时/记忆/工具/Provider/评估/并行/安全/可观测全子系统）+ PCV 专项清点 + 主流 Agent 设计研究（Anthropic 官方 context engineering、50+ 开源编码 Agent 源码分类学 arXiv:2604.03515、Manus 生产级上下文工程经验）。

## 9. 全景能力地图（现状，带锚点）

| 子系统 | 现状 | 关键锚点 |
|---|---|---|
| 主循环 | 单层 while-true ReAct（迭代上限缺省 20，ExitController+abortSignal 终止）；事件流经 AgentEventBus，无原生 LLM 流式 | `AgentRuntime.ts:416-489` |
| Profile 体系 | 9 个内置 profile（plan/evolution/generate/scan/signal/translate/relation/module-mining），Registry+Compiler 编译制；每次 compile 无缓存 | `AgentProfileRegistry.ts` / `AgentProfileCompiler` |
| 记忆分层 | ActiveContext（工作记忆，1378 行）→ SessionStore（维度级）→ PersistentMemory（跨会话）+ L4MemoryPackage；MemoryCoordinator（834 行）协调；**enableL4Compaction 缺省关闭** | `MemoryCoordinator.ts` / `ContextWindow.ts:16-19`（三级压缩：截断→摘要→仅留 prompt+末轮） |
| 工具系统 | 统一 catalog 注册、AllowList+Capability 双通道权限、轮内并行工具调用共享预算、结构化 ToolResultEnvelope | `ToolExecutionPipeline`（1145 行） |
| Provider 层 | 5 provider（Claude/DeepSeek/Google/OpenAI/Ollama）+LLMTransport 协议适配；DeepSeek transport 有 prompt-cache 支持；结构化输出各 provider 自行实现无统一协议 | `src/ai/providers/` / DeepSeek transport `:253` |
| 评估 | analysisQualityGate+insight/evolution gate 评估器+depthRetryGate；PlanTracker 周期 replan（上限硬编码 MAX_BOOTSTRAP_REPLANS=1）；无 reflection/LLM-as-judge | `gateEvaluators.ts:28` / `PlanTracker.ts` |
| 并行 | FanOutStrategy 维度间并发（tier 并发 3），子运行=递归 AgentService.run()，无隔离 subagent 容器 | `FanOutStrategy.ts:32-60` |
| 安全 | Seatbelt 沙箱终端（未注入时降级 plain exec）、allowlist、诊断层 redaction | `handlers/terminal.ts:4-7` |
| 可观测 | DiagnosticsCollector（371 行）+ActiveContext observation ledger；llm 工件 dump 写入方在 Agent 仓未找到（推断在主体事件链，锚点待 E0 钉） | `DiagnosticsCollector.ts` |
| 错误降级 | AI 错误 2-strike→resetToPromptOnly、熔断→兜底摘要、空响应计数 break；全部硬编码在 #callLLM | `AgentRuntime.ts:1206-1239` |

## 10. 主流对照矩阵（差距定位）

对照基准：Anthropic 官方 agent 工程指导（compaction/记忆/子代理/JIT 检索/工具设计）、编码 Agent 源码分类学（ReAct 六相环：pre-check→thinking→**self-critique**→action→execution→post-processing）、Manus 生产经验（KV-cache/append-only/文件系统即记忆/todo 复述）。

| 主流实践 | AlembicAgent 现状 | 判定 |
|---|---|---|
| 文件系统即外置记忆（无界、非压缩、随取） | 全内存分层记忆+落盘仅 checkpoint/诊断 | **缺失** → Part I 台账正是此项（外部验证了方向） |
| KV-cache 友好：稳定前缀+append-only+确定性序列化（成本差可达 10×） | 系统提示稳定✓、动态层在尾部✓；但 `collapseProducerSubmitToolRounds`（`LLMInputAssembly.ts:129-176`）与传输带重建**改写历史消息**=缓存破坏；本次真机 cache 命中 64%（input 98 万 token） | **部分** → U-2 |
| 压缩三层次：工具结果清理（最低风险）→摘要 compaction→子代理隔离 | 有三级压缩但为改写型；工具结果清理与摘要混在同一机制 | **部分** → U-2 与台账协同（原文外置后，上下文可放心只留摘要） |
| loop 内 self-critique 相 + 独立 verifier | analyst 策略已有 VERIFY 相（`ExplorationStrategies.ts:202`）但只是"仅许证据校验类工具"的松约束、无强制校验产出契约；quality_gate 评叙事不评引用（P6） | **部分** → U-3（强化既有 VERIFY 相） |
| 子代理：干净窗口、工具过滤、回传 1-2k token 摘要 | 递归 run 实现 fan-out，无隔离容器/无工具过滤/无摘要回传契约 | **部分** → U-4 |
| todo/plan 复述对抗 lost-in-the-middle | PlanTracker 有 steps+deviationScore，但不向上下文尾部复述 | **部分** → U-10 |
| checkpoint/断点续跑 | DimensionCheckpoint 只记完成维度；MemoryCoordinator 有 checkpoint() 无恢复入口；取消=整跑 | **缺失** → U-5 |
| hooks/扩展点（工具前后/记忆写/阶段转换） | HookSystem 框架在但仅 4 个 hook 点 | **缺失** → U-7 |
| 统一降级状态机 | 降级决策散落硬编码 | **缺失** → U-8 |
| LLM-as-judge 二审 | 全启发式规则门 | **缺失（可选）** → U-9 |
| JIT 检索（轻标识符+按需加载） | briefing 预载为主 | **部分** → 台账 evidence.get 即 JIT 化的一步，其余观察 |

## 11. 不合理设计重建（R 系列）

- **R-1 AgentRuntime 巨石拆分**：2721 行单类混杂 loop 编排/LLM 调用/工具轮/诊断/PCV 记录。拆为 LoopOrchestrator / LlmCallGateway / ToolRoundRunner / DiagnosticsBinding 四模块，行为字节不变（表征测试先行）。风险最高，独立 Wave 执行。
- **R-2 PCV 解耦（用户约束直接落点）**：主线 14 触点（`AgentRuntime.ts:77-82,961,1065,1388,1482,2198`、`LoopContext.ts:25-28,215`、`AnalyzeGroundingGuard.ts:2`、`gateEvaluators.ts`、`LLMInputAssembly.ts:3`）收敛为 **ObservationPublisher 端口**（主线只 publish 事件）；PCV 降级为可插拔订阅者。`extractSourceRefsFromValue` 迁出为独立 utility（主线不得从 Pcv 文件 import 通用函数）；`buildAnalyzeGroundingPolicy` 迁 GroundingPolicyBuilder。控流唯一点（`AgentRuntime.ts:1613` guard CP4）经 IGroundingClassifier 接口隔离。PD1-7/AP 系列决策与 observe-only 语义全部不变。
- **R-3 LoopContext 生命周期收敛**：6 个注入项散落，统一构造/销毁边界与只读视图。
- **R-4 阈值配置化**：maxIterations=20、MAX_TOOL_CALLS_PER_ITER=8、forceSummaryAt、replan 上限等散落硬编码→profile 可配+缺省表单源。
- **R-5 权限双通道融合**：AllowList 与 Capability 两套检查分散（ToolKernel/Runtime/Capability）→单一 PermissionResolver，判定语义不变。
- **R-6 ProfileCompiler 缓存**：同 id+params 的 CompiledProfile 记忆化。
- **R-7 记忆三层缓冲重复**：MemoryCoordinator 内三份缓冲逻辑合一，对模型暴露统一 memory.query（并入 U-6）。
- **R-8 结构化输出协议统一**：provider 各自实现 structuredOutput→transport 层统一 schema 约束协议（DeepSeek reasoningContent 回传约束保留，`ContextWindow.ts:288`）。

## 12. 深度升级（U 系列，补缺）

- **U-1 证据台账**＝Part I E0-E6（主线，先行）。
- **U-2 KV-cache 友好上下文布局**：①历史消息不可变——摘要以**追加块**表达（"[已压缩 R5-R12：…]"追加于带尾），废除改写型 collapse；②确定性序列化（key 排序/无时间戳注入前缀）；③cacheable 段位标注传递到 provider（DeepSeek transport 已支持缓存，上层补 hint）。验收：同维度 run 的 cache 命中率相对 baseline（64%）显著提升+行为零回归。
- **U-3 验证相（强化既有 VERIFY）**：analyst 已有 SCAN→EXPLORE→VERIFY→RECORD→SUMMARIZE 五相（`ExplorationStrategies.ts:190-202`，VERIFY 现状＝仅许证据校验类工具的松约束相）。升级：①VERIFY 相带**台账审计契约**——对已积累 findings 的 evidenceRefs 做逐条可解析抽验，不过则该 finding 降级/退回；②produce 后 verify 步抽验 coreCode 逐字性（复用台账零 fs 成本）——把 P6 的两个质量体系缝合。
- **U-4 子代理容器**：SubagentHandle（隔离 ContextWindow/工具过滤/独立预算/**摘要回传契约 ≤2k token**），现有递归 fan-out 迁移其上；维度内深探（如大模块）可选二级 fan-out。
- **U-5 断点续跑**：run 级 resume 入口——已完成维度读 DimensionCheckpoint 跳过、进行中维度从台账+scratchpad 快照重建（P13 收编；最小实现=维度粒度）。
- **U-6 统一记忆查询**：模型面单一 memory.query（后端路由三层），录入统一走 coordinator（R-7 合并实施）。
- **U-7 扩展点补全**：工具执行前后/记忆写入/阶段转换/压缩前后 hook + ObservationPublisher（R-2 的承载）。
- **U-8 降级状态机**：显式 DegradationMode 枚举（ai-error/circuit-open/empty-response/budget-exhausted…），每次转移带诊断日志（对齐仓规"运行时分叉必须可观测"）。
- **U-9 LLM-as-judge（可选，后期）**：质量门旁路二审（小模型），只标注不阻断，成本门槛待 CG-10。
- **U-10 计划复述**：PlanTracker steps+进度以尾部注入方式每 N 轮复述（对抗 lost-in-the-middle；与 RECORD 配额指令同层）。

## 13. 总体实施路线（直接执行模式）

| Wave | 内容 | 依赖 | 验收锚 |
|---|---|---|---|
| **A（止血主线）** | E0→E6（台账全链）+ R-2 最小面（台账/新代码不 import Pcv；ObservationPublisher 骨架） | 无 | Part I §4 各阶段验收 + 真机对照 |
| **B（上下文经济）** | U-2 + U-10 | A（台账使原文外置成立） | cache 命中率提升 + 行为零回归 |
| **C（质量环）** | U-3（+U-9 可选） | A | 验证相表征 + 拒绝率进一步下降 |
| **D（结构重建）** | R-1/R-3/R-4/R-5/R-6 + U-6/U-7/U-8（R-2 收尾：存量 14 触点全部迁 publisher） | 可与 B/C 并行规划、与 A 不混 | 全量测试零回归 + 行为表征字节不变 |
| **E（规模化）** | U-4 + U-5 | D（容器依赖收敛后） | fan-out 表征 + 取消续跑真机验 |

原则：每 Wave 独立可验收、独立可回滚；A 先行（本事故直接止血）；R-1 巨石拆分绝不与功能 Wave 混行。

**新增开放决策**：CG-8 R-1 拆分粒度（四模块 vs 更细）与时机；CG-9 U-4 并发与预算参数；CG-10 U-9 是否引入及成本上限。CG-1~7 维持 Part I 推荐值，直接执行模式下按推荐值锁定，用户可随时改判。

**外部参照（设计依据）**：Anthropic《Effective context engineering for AI agents》；arXiv:2604.03515《Inside the Scaffold》（编码 Agent 源码分类学）；Manus《Context Engineering for AI Agents: Lessons from Building Manus》；arXiv:2603.05344（终端编码 Agent 工程经验）。

---

# Part III：代码级实施手册（权威执行指导，2026-07-04）

本部分把 Wave A 落到文件/接口/接线点级；Wave B–E 每项给出目标文件、改动要点与验收标准（其详细展开在各自 Wave 启动时按同格式补写并追加到本文档）。**通用纪律**：每阶段先写表征/单测再动实现；改动前后跑该仓全量测试对比 failed-set 零增长；任何新主线文件出现 `Pcv` import 即为违规（见 §15.E1 边界测试）。

## 14. 总完成定义与阶段门

**总完成定义**（Part I §2 的 6 条 + 以下 3 条）：

7. 主线新代码零 Pcv 依赖，且存量 14 个 PCV 触点收敛计划落地（Wave A 完成骨架、Wave D 完成迁移）；
8. Wave B 后同维度冷启动 prompt-cache 命中率相对 baseline 64% 提升（E6/B 验收采同一测量法：bootstrap report `efficiency.tokenUsage.cacheHit/input`）；
9. 每个 Wave 收口时：AlembicAgent `npx tsc --noEmit` + 全量 `npx vitest run` + 仓门禁（lint 链）全绿，Core/主体同各自 `npm run build:check`+全量测试零回归。

**阶段门**：E0→E1→E2→E3→E4→E5→E6 严格串行（每阶段验收绿才进下一阶段）；Wave B/C 依赖 Wave A 收口；Wave D 独立分支执行（与功能 Wave 不混）；Wave E 依赖 D。

**验证命令基线**（Node ≥22，`nvm use 22`）：
- AlembicAgent：`npx tsc --noEmit`；`npx vitest run <targeted>`；`npx vitest run`（全量）；现有 lint/门禁链。
- AlembicCore：`npm run build:check`；`npm run lint`；`npx vitest run`（基线 165 files/1557 passed）。
- 主体 Alembic：`npm run build:check`；`npm run test:unit`（基线 996 passed）。
- 真机（E6/B）：重建三仓 dist → 重启 daemon → Dashboard/HTTP 触发 bootstrap（维度限定）→ 读 `bootstrap-reports/bs_*.json` 与 `logs/combined.log`。

## 15. Wave A 逐阶段代码级指导

### E0 基线表征（AlembicAgent，零 src 改动）

新文件 `test/evidence-ledger-baseline.characterization.test.ts`，钉住四个现状事实（升级后逐条反转）：

1. **note_finding 零校验**：构造 MemoryCoordinator（或直接 ActiveContext），以捏造引用调 `noteKeyFinding('x','Fake/path.ts:1-5',5)`（`ActiveContext.ts:433-453`）→ 断言 scratchpad 收录成功；
2. **produce 工具面无 code/evidence**：`new GenerateProduce().allowedTools` 断言 keys 恰为 `{knowledge,memory,meta}`（`toolsets/GenerateProduce.ts`）；
3. **配额公式**：`targetMemoryFindingCount({evidenceToolCallCount:37})===19`（`ExplorationStrategies.ts:96-98`）；
4. **RECORD 指令面**：analyst 策略 phases 含 VERIFY/RECORD 且 RECORD 相 stage 指令为 note_finding-only（对 `LLMInputAssembly.ts:300-304` 的可导出 seam 断言；若非导出则以策略对象断言 `STRATEGY_ANALYST.phases`）。

另存 baseline 数据 fixture（`test/fixtures/coldstart-baseline-2026-07-04.json`）：{tsJsModule:{submitted:15,accepted:1}, architecture:{submitted:8,accepted:2}, cacheHitRatio:0.64}。
**验收**：`npx vitest run test/evidence-ledger-baseline.characterization.test.ts` 全绿；`git diff --stat` 仅 test/。

### E1 契约（Core）+ 存储（Agent）

**AlembicCore 新文件** `src/domain/knowledge/evidence-ledger/EvidenceLedgerContract.ts`（+ 同目录 index.ts，并入 knowledge 子路径 barrel——遵守 Package 入口规则：exports 与 `src/**/index.ts` 同步更新，`test/CorePackage.test.ts` 相应钉子）：

```ts
export interface EvidenceEntry {
  id: string;                    // ^E-\d+$，session+dimension 内单调
  sessionId: string; dimensionId: string;
  tool: EvidenceToolId;          // 'code.read'|'code.search'|'code.outline'|'code.structure'|'graph.overview'|'graph.query'|'terminal.exec'
  callId: string;
  file?: string;                 // repo-relative；与 gateRules SOURCE_REF_RE 语义一致
  range?: { start: number; end: number };   // 1-indexed 闭区间
  content: string;               // verbatim；单条上限 EVIDENCE_ENTRY_MAX_CHARS
  contentHash: string;
  capturedAt: number;
}
export function parseEvidenceRef(raw: string): { id: string; range?: {start:number;end:number} } | null;
export function isEvidenceToolId(v: string): v is EvidenceToolId;
export const EVIDENCE_ENTRY_MAX_CHARS: number;   // CG-1 数值，初值 8_000
```

**AlembicAgent 新文件** `src/agent/evidence/EvidenceLedgerStore.ts`：
- 构造 `{dataRoot, jobId, sessionId, dimensionId, redactor:(s:string)=>string}`；文件 `<dataRoot>/.asd/evidence-ledger/<jobId>/<dimId>.jsonl`，append-only，确定性序列化（key 排序）。
- API：`append(draft: Omit<EvidenceEntry,'id'|'capturedAt'|'contentHash'>): EvidenceEntry`；`get(id, range?): EvidenceEntry | null`（range 为条目内子区间切片）；`searchByFile(pathFragment): EvidenceEntry[]`；`stats(): {entries, distinctFiles}`；内存索引 + 惰性重读。
- redactor 注入自 `src/agent/utils/Redaction.ts`（**新文件**：把 `AgentRuntime.ts:2688-2691` 的 `redactDeveloperText` 迁出为导出函数，AgentRuntime 改 import——行为字节不变，配套 2 条正则钉测）。

**边界测试**（新）`test/EvidenceLedgerBoundary.test.ts`：读取 `src/agent/evidence/**` 源文本断言不含 `Pcv`/`from '../runtime/PcvNodeEvidenceRecorder`（仓内 boundary-test 惯例，同 CoreDeliveryBoundary 风格）。
**验收**：Core `npm run build:check`+新契约单测+`CorePackage` 钉子更新绿+全量 1557 基线零回归；Agent `tsc --noEmit`+store 单测（写读回/切片/hash/预算上限/redact/确定性序列化字节可重放）+全量零回归。

### E2 采集即落盘（AlembicAgent）

- **接线点**：`src/agent/runtime/ToolExecutionPipeline.ts:900` seam——在 `ctx.loopCtx.trace?.recordToolCall(call.name, call.args, meta.envelope || result, meta.isNew)` **之前**插入：
  ```ts
  const captured = ctx.loopCtx.evidenceLedger?.captureToolResult(call, meta.envelope ?? result);
  // captured: {entryIds:string[], annotatedEnvelope} — 注入 [E-x] 标注后再走 trace 记录与消息投影
  ```
  使模型可见文本与留痕一致（projection 经 `projectPipelineToolResult`，`:73`）。
- **新文件** `src/agent/evidence/EvidenceCapture.ts`：按工具归一化——`code.read`：每文件一条（请求 range 或整文快照切片）；`code.search`：按文件分组每组一条（命中行+context，源自结构化 `SearchMatch`，`handlers/code.ts:47-52`——**取结构化源，不解析渲染文本**）；graph/terminal：单条序列化。非证据类工具（memory/meta/knowledge）不捕获。
- **持有点**：LoopContext 增 `evidenceLedger?: EvidenceLedgerStore`（初始化点与今日 `pcvNodeEvidence` 同位，`LoopContext.ts:215` 邻座；由 profile/session 参数带入 jobId，无 jobId 时（非 bootstrap 场景）不创建=零影响面）。
- **验收**：pipeline 单测（stub handler 走真 dispatch）断言：条目与调用一一对应、标注出现在模型可见文本、非证据工具零捕获、ledger 关闭时（undefined）行为字节不变；全量零回归。

### E3 引用改契约（AlembicAgent，CG-2=硬切）

- **schema**：memory 工具 note_finding 参数定义处（`src/tools/runtime/registry.ts` 与 `src/tools/kernel/registry.ts` 中 note_finding 条目）：`evidence:string` → `evidenceRefs:{type:'array',items:{type:'string'},minItems:1}` + 可选 `excerpt:string`；深度槽参数不动。
- **handler**（`handlers/memory.ts:93-133`）：`handleNoteFinding` 逐 ref 调 `ctx.evidenceLedger.get(parseEvidenceRef(ref))`——任一无效 → `fail()` 并附同文件近似候选（`searchByFile` 前 3 条 id）；全有效 → `memoryCoordinator.noteFinding(finding, refs, ...)`。
- **存储投影**：`ActiveContext.noteKeyFinding` 签名扩展为携带 `evidenceRefs:string[]`（`ActiveContext.ts:433-453`）；`distill()`→SessionStore 的 Finding 结构、quality_gate 的 `AnalysisArtifact.findings`、`buildProducerPromptV2` 的"关键发现"渲染（`insightProducer.ts:256-276`）全链带 refs——渲染时由台账机械展开为 `file:start-end`（模型不再手写）。
- **提示词同步**：`NudgeGenerator.ts:437` RECORD 配额句、`LLMInputAssembly.ts:300-304` record 指令改为 evidenceRefs 语义。
- **验收**：E0 表征第 1 条**反转**（捏造 ref 被拒 + 真 ref 通过 + 近似候选出现在 fail 文本）；refs 全链不丢（scratchpad→artifact→producer prompt 三点断言）；全量零回归。

### E4 全链可查 + 配额绑定（AlembicAgent）

- **新工具** `evidence`：`handlers/evidence.ts`（actions：`get {id,range?}`、`search {query}`，只读，行数预算上限每次 ≤120 行）；registry 注册；`GenerateAnalyze.allowedTools` 增 `evidence:['get','search']`（`toolsets/GenerateAnalyze.ts:15-22`）、`GenerateProduce.allowedTools` 同增（`toolsets/GenerateProduce.ts`）。
- **RECORD 相放行**：stage 指令（`LLMInputAssembly.ts:300-304`）与 record 相工具面改为 `note_finding + evidence.get/search`；toolChoice 仍 required。
- **配额**：`targetMemoryFindingCount` 增二参 `ledgerStats?: {distinctFiles:number}` → `min(原式, max(3, distinctFiles*2))`（CG-5 初值）；NudgeGenerator 经 metrics 注入 stats；证据不足文案改"回 EXPLORE 补证据"。可选（CG-5 后半）：`STRATEGY_ANALYST.transitions` 增 `'RECORD→EXPLORE'` 条目——首版**不做**，仅配额钳制。
- **验收**：RECORD 相表征（可 get 不可 code.read）；配额随 stats 变化单测；nudge 文案钉子更新；全量零回归。

### E5 producer 粮草改革 + 提交协同（AlembicAgent；Core 零改动）

- **submit 展开**：`handlers/knowledge.ts` `handleSubmit`（`:282-595`）在 `normalizeBareSourceRefs`（`:400`）前插入 ledger 展开步：params 允许 `reasoning.evidenceRefs`；存在时→由台账展开生成 `reasoning.sources`（`file:start-end`）并对 coreCode 做台账 verbatim 对齐（升级 F4c `tryNormalizeSnippetEvidence :411-424` 与 F4f `:400-404` 为**台账优先、fs 兜底**）。
- **新鲜度终检**：展开后对每个引用文件比对 `entry.contentHash` vs 当前 fs 哈希（复用 Redaction 同层新 util `hashFileRange`）；不一致 → 该 ref 判 stale，fail 文案给出"文件已变更，请 evidence.search 重采"——**发生在 runInProcessRecipeAuthoringGate 之前的 Agent 层**，Core gateRules/九拒因字节不动（host-agent 路径自动零回归）。
- **拒绝反馈增强**：`:500-526` fail 拼装处，INSUFFICIENT_EVIDENCE 追加"已解析成功文件 + 台账内其余 distinct 文件候选（≤5）"；`STAGE3_CODE_DUPLICATE` 追加撞题候选 title。
- **验收**：展开单测（展开产物逐字过 `snippetMatchesSourceRange` fixture，`gateRules.ts:227-260` 语义引用）；投毒双用例（捏造 ref→录入即拒[E3 已钉]；改文件后提交→stale 拒）；Core 仓 `git diff` 为空的守卫断言；Agent 全量+主体 `build:check` 零回归。

### E6 真机端到端（主体 + 真机，产品代码零改动）

- 步骤：三仓重建（AlembicAgent `npm run build` → 主体 `npm run build`）→ 重启 daemon → 限定 `architecture,ts-js-module` 两维度触发 bootstrap → 收集 `bootstrap-reports/bs_*.json`、`logs/combined.log` 拒绝行、`evidence-ledger/` 台账文件。
- **通过判据**（对 E0 fixture baseline）：两维度 `candidatesSubmitted/(submitted+rejected)` 接受率 ≥60%（baseline 6.7%/25%）；拒因分布中 SOURCE_REF_NOT_FOUND=0；SNIPPET_MISMATCH ≤1；台账条目数>0 且逐条可在真机文件系统解析；`~/.asd` 真实数据根之外零写入（沙箱纪律沿用 [[alembic-runtime-acceptance-recipe]]）。
- 失败路由：按拒因/阶段回溯到对应 E 阶段修复后重跑本阶段，不跳门。

**E6 执行实录（2026-07-04，真机 ecf32806/DeepSeek，各限定 architecture+ts-js-module）**：
- 首跑 `bootstrap_mr5j005w_51685fb4`：57%/29%（baseline 25%/6.7%）；NOT_FOUND=13 集中于 4 个 producer 手写 sources 候选（多仓前缀陷阱）；evidence 工具被真实使用 17 次、analyst 零假引用、EVIDENCE_STALE 零误伤 → 按失败路由落 F1-F3（`633b20b`：NOT_FOUND 拒绝附台账候选+producer 提示词硬化+waiver 指引）。
- 二跑 `bootstrap_mr5jv861_3a6de7ab`：**architecture 5/6=83% ✓**；ts-js-module 6/16=38%；**NOT_FOUND 13→3（-77%）**；note_finding 录入拒收 2 次（前移检测真机实拦）；拒因大头迁移为风格/精度类（CONTRAST 2/DO_CLAUSE 1/SNIPPET 1/LINE 1/GRAPH 1/INSUFFICIENT 2）；waiver 采用率 0；两跑知识库净增 19 条 accepted（事故 run 为 3）。
- **收口判定（用户已确认 2026-07-04）**：保真机制链全链真机验证通过（主目标达成）。
- **E7 系列（用户目标=接受率 100%，同日追加）**：三跑 `1d2a813`（手写路径 basename 自动矫正+证据驱动 scope 收窄+逐违规修复模板）→ 证据类拒因清零（NOT_FOUND/INSUFFICIENT=0），ts-js 首过线 62%；四跑暴露修复子调用 this 绑定缺陷（零触发零留痕双违规）→ `818360a` bind 修复+降级三处留痕（真 provider 直测通过）；五跑修复链带电（1 例 violations 1→0 真机成功）→ `263b22f` E7-D SNIPPET 确定性替换（程序用引用区间真实内容覆盖 coreCode）+修复预算 2 次+未改善留痕。五跑绝对入库 8/11/17/10/10 稳定，per-dim 峰值 architecture 83%/ts-js 62%。
- **100% 认证的环境前提（真实阻塞记录）**：唯一已初始化环境经五跑累计入库后重复饱和压低接受率天花板；无饱和测量需新鲜 KB，而 virgin 数据根 bootstrap 需 init 链前置（三个产品观察：①fresh 环境 plan gate `null.name` 报错不指真因 ②CLI ai configure 不通知运行中 daemon 热载 ③virgin-env bootstrap 缺 init 前置指引）。忠实副本+清知识表的沙箱方案因 DaemonSupervisor 发现机制与 ALEMBIC_HOME 隔离纠缠两次波及真实 daemon（均已恢复）后按停止卡终止。**待办**：Dashboard 初始化一个新鲜测试项目后跑认证测量（用户一次点击+一次 20 分钟 run）。
- 观察项：主体传真实 jobId 待接线（台账目录现用回退 id）；gateway accepted 计数与 knowledge_entries 行数关系（候选 staging 存储面）待核。

## 16. Wave B–E 代码级落地要点与验收

| 项 | 目标文件（锚点） | 改动要点 | 验收标准 |
|---|---|---|---|
| **U-2 KV-cache 布局** | `LLMInputAssembly.ts:129-176`（collapse）、ContextWindow 三级压缩（`ContextWindow.ts:16-19,570-599`）、MessageAdapter | ①废除改写型 collapse：submit 历史摘要改为**追加**用户块，原消息不动；②压缩改"截断标记追加+台账 ID 指针"（原文经 evidence.get 可回取）；③序列化确定性（key 排序、去时间戳前缀）；④cacheable 前缀 hint 传 DeepSeek transport（`:253` 已支持） | 表征：同一会话前 N 轮消息字节级不变（快照对比）；真机同维度 cacheHit/input ≥75%（baseline 64%）；行为零回归 |
| **U-10 计划复述** | `PlanTracker.ts`、`LLMInputAssembly` 动态尾层 | 每 K 轮（初值 5）把 plan steps+covered/deviation 以固定格式追加动态尾（尾部注入不破缓存前缀） | 单测：注入节律与格式；真机 planProgress.deviationScore 不升高 |
| **U-3 验证相强化** | `ExplorationStrategies.ts:190-211`（VERIFY 语义）、NudgeGenerator VERIFY case（`:433,453`）、新 `evidence.audit` action | VERIFY 相注入台账审计指令：逐 finding 调 evidence.get 抽验；不可解析 finding 由 handler 标记 `unverified`，RECORD 配额只计 verified | 表征：带坏 ref 的 finding 在 VERIFY 被标记且不计配额；E6 同法真机复验 |
| **U-8 降级状态机** | `AgentRuntime.ts:1206-1239` #callLLM 散落分支 | 抽 `DegradationController`（枚举 ai-error/circuit-open/empty-response/budget-exhausted + 转移日志），行为映射不变 | 表征：各触发条件下外部行为与现行完全一致（先钉后抽）；日志出现转移事件 |
| **R-2 收尾（PCV 全触点迁移）** | 14 触点清单（§11 R-2） | `ObservationPublisher`（publish(event)）替换 5 个 recordPcv\* 调用；`extractSourceRefsFromValue`→`utils/SourceRefExtraction.ts`；`buildAnalyzeGroundingPolicy`→`GroundingPolicyBuilder.ts`；`AnalyzeGroundingGuard` 依赖 `IGroundingClassifier` 接口；PCV 成为订阅者实现 | AP-0/AP-3/AP-5 既有表征全绿（observe-only 语义不变）；`grep -rn "PcvNodeEvidenceRecorder" src/agent/runtime/AgentRuntime.ts`=0；guard 模式 CP1/CP4 行为钉子不变 |
| **R-1 AgentRuntime 拆分** | `AgentRuntime.ts`（2721 行） | 先全面表征（loop 分支/终止/降级/事件序），后拆 LoopOrchestrator/LlmCallGateway/ToolRoundRunner/DiagnosticsBinding；导出面不变 | 表征字节级不变；全量零回归；单文件 ≤800 行 |
| **R-3/R-4/R-5/R-6** | LoopContext / 散落常量 / ToolKernel+Capability / AgentProfileCompiler | 构造收敛；常量表单源+profile 可配；PermissionResolver 单点判定（语义不变钉子先行）；compile 记忆化（key=id+paramsHash） | 各自表征+全量零回归；权限判定真值表测试迁移后逐行相等 |
| **U-6/R-7 统一记忆查询** | `MemoryCoordinator.ts`（834 行）、`handlers/memory.ts` | 模型面新增 `memory.query`（路由三层）；三份缓冲逻辑合一；旧 actions 保留 passthrough 一个 Wave 后再收 | recall/save/note_finding 行为钉子不变；query 融合结果单测 |
| **U-7 hooks 补全** | HookSystem（现 4 hook 点） | 增 tool-pre/post、memory-write、phase-transition、compaction-pre/post 六点；ObservationPublisher 挂其上 | hook 触发顺序表征；零 hook 注册时行为字节不变 |
| **U-4 子代理容器** | `FanOutStrategy.ts:32-60`、AgentService.run 递归点 | `SubagentHandle`{隔离 ContextWindow、工具过滤白名单、独立预算、`digest ≤2k token` 回传契约}；现有维度 fan-out 迁移其上 | fan-out 行为表征不变；digest 契约单测；并发预算钉子（CG-9 参数） |
| **U-5 断点续跑** | `DimensionCheckpoint.ts:10-51`（Core）、bootstrap 编排（主体 `RecipePipelineFacade.ts:27-46`） | resume 入口：completed 维度按 checkpoint 跳过；in-progress 维度从台账+scratchpad 快照重建（最小=维度粒度重跑但证据免重采） | 真机：取消后 resume 只跑剩余维度；已完成维度零重复提交 |
| **U-9 LLM-as-judge（可选）** | quality_gate 旁路 | 小模型二审 evaluator（只标注不阻断） | CG-10 拍板后展开 |
| **R-8 结构化输出统一** | `src/ai/providers/*` transport | schema 约束协议上提 transport 层；DeepSeek reasoningContent 回传不变（`ContextWindow.ts:288`） | 各 provider 结构化输出契约测试同套跑通 |

## 17. 执行注记

- **表征先行**：R-1/R-5/U-8 等"行为不变"类改动，一律先落表征测试再动手（AP-0 先例：断言落可观察 seam，抽取后仍成立）。
- **禁混行**：Wave D 结构重建独立分支推进，绝不与 A/B/C 功能改动同 commit。
- **基线冻结**：E0 fixture 是唯一对照基准；E6/B 的真机比较必须引用同一 fixture。
- **每阶段回填**：完成范围、commit hash、验证命令与结果、遗留风险——沿用仓库回填纪律；本任务用户直推线，本地 commit、push 逐次授权。

## 18. 门禁分层 v2 与修复机制全景（2026-07-04 用户裁定落地，Agent `a513ba2`）

用户裁定四点：①note_finding 严格保证——必须通过关键证据产出 Recipe；②前期提示引导/plan/项目信息要全面、清晰、主次分明，严格指出必须内容；③打回修复的各种方式全面设计，保证无 bug、严谨明确；④门禁全新分层设计——要的是**有证据、有价值、有深度**的 Recipe，不强制格式。

### 18.1 note_finding 严格保证（五道闸，全部带电）

| 闸 | 位置 | 保证 |
|---|---|---|
| 采集即落盘 | ToolExecutionPipeline evidenceCapture 中间件 | code/graph/terminal 结果先入台账（E-n + contentHash），模型可见文本带 `[evidence] E-x=file:range` 标签——证据只能来自真实工具调用 |
| 录入存在性校验 | `handlers/memory.ts` handleNoteFinding | evidenceRefs 必填；逐 ref 过 `parseEvidenceRef` + `store.get` 存在性校验；不存在→拒收并附 `listRecent(3)` 真实候选；旧 `evidence` 手写参数直接拒 |
| 广告面=校验面 | tools/runtime schema + `AgentRuntime.buildDirectNoteFindingSchema` 双处同步（E4 补齐的漏网教训） | 模型看到的 schema 与实际校验一致，无声明/执行裂缝 |
| 配额钳制 | `targetMemoryFindingCount = min(max(3,⌈evidenceCalls/2⌉), max(3, ledgerDistinctFiles×2))` | 发现数上限绑台账实采规模——无证据就没有配额，杜绝"编够数量" |
| 提交终闸 EVIDENCE_REFS_REQUIRED | `handlers/knowledge.ts` handleSubmit（本次新增） | 维度运行（台账在场）且 evidenceRefs 展开结果为空→硬拒；**手写 sources 绕行通道正式封死**，Recipe 的事实面只能由台账机械展开生成 |

无台账场景（非维度运行）降级为 `unverified` 标注不拒收——保持主体 in-process 通用会话可用。

### 18.2 前期上下文审计（主次分明改造）

- **producer 提示词三层重排**（`GenerateProduce.ts` promptFragment，本次）：【必须——硬性，缺失即拒】（evidenceRefs 必填/事实只来自证据/必填字段）→【价值与深度——评分项】（为什么这样设计/越界后果/取舍，断言挂引用）→【建议——不阻断，advisory 记录】（祈使 doClause/对比块/标题具体化）。与门禁分级严格一致：提示词说"必须"的就是硬门，说"建议"的就是 advisory。
- **analyst 侧已带**：SCAN→EXPLORE→VERIFY→RECORD→SUMMARIZE 相位指令含台账标签说明与 evidenceRefs 要求（E3/E4 落地）；关键发现渲染（buildProducerPromptV2）自动携带台账标签；DistilledContext 全链带 refs。
- **残余 follow-up**：analyst 各相位提示与 plan 投影的"必须内容"逐项清单化审计（哪些字段是维度执行的最低必需信息）——记 §18.5 残余项。

### 18.3 打回修复机制全景（七层，逐层触发条件+保证+已修 bug）

| # | 机制 | 位置 | 触发 | 保证 |
|---|---|---|---|---|
| 1 | 台账机械展开 | expandEvidenceRefsForSubmit | 每次 submit | sources/coreCode 由 refs 程序化生成；无效 ref→拒+真实候选提示 |
| 2 | 新鲜度终检 | EVIDENCE_STALE（store.checkFreshness） | 展开时逐 ref | 与采集同一把 redact+cap+slice 尺重算 hash；文件已变→拒+提示重采 |
| 3 | 路径自动矫正 | sanitizeSubmissionEvidence | 手写 source 解析失败 | basename 全项目唯一匹配→自动改写；台账背书的同路径保留 |
| 4 | scope 自动收窄 | 同上 | rule/pattern 证据 <3 distinct 文件 | 强制 scope='narrow'，防以偏概全 |
| 5 | 逐违规修复模板 | buildViolationRepairTemplates | 门禁拒绝 | 每个违规码附 🔧 可照抄修复模板（拒绝信息即修复手册） |
| 6 | LLM 修复子调用 | repairStyleViolations | 风格违规且 provider 在场 | temperature 0、窄 JSON 输出、只许改措辞面；预算 2 次；`providerLike.chat.bind` 修 this 丢失（`818360a`）；零触发/无改善/异常三处降级留痕 |
| 7 | SNIPPET 确定性替换 | replaceCoreCodeFromSources | SNIPPET_MISMATCH | 程序直接用引用区间真实内容覆盖 coreCode——不让模型"猜对"原文（`263b22f`） |

**不变量（修复不越权）**：任何修复机制不得修改事实面——sources/coreCode 只能来自台账或文件系统真值；LLM 子调用只动措辞面（doClause/dontClause/标题/对比块），改动后仍整体重过门禁。已修 bug 实录：this 绑定丢失（四跑零触发根因）、无改善分支静默、多仓 basename 前缀陷阱（`633b20b`）。

### 18.4 门禁分层 v2（本次核心变更）

- **分级单源**：Core `styleWaiver.ts` `isSoftAuthoringViolation`（两宿主共用）。**硬门=事实与接地**：伪造/失配锚点（SOURCE_REF/SNIPPET/LINE）、graph 背书、证据密度、查重、必填结构缺失（如 DONT_CLAUSE_REQUIRED）——放行即污染知识库；**软门=写作风格**：`_NON_ENGLISH`/`_NON_IMPERATIVE` 后缀、CONTENT_CONTRAST_MISSING、长度、标题泛化、coreCode 完整性。
- **新流程**：修复子调用后仍有违规 → 若**全部为软违规**→ 降级为 `reasoning.styleAdvisories`（codes+messages）随候选落库放行，日志 `style advisories attached (non-blocking)`；任一硬违规→照常全力度拒（模板+候选提示+申辩指引）。
- **价值与深度评判权**归 C4 depthReview + C8 QualityScorer（评分面）与 Dashboard 人工复核（advisory 展示），**不再由提交门禁用格式强制背书**——格式好≠有价值，格式差≠无价值。
- waiver 一次申辩通道保留（硬门语义不变）；软违规 advisory 化后 waiver 主要服务于"软违规也想修干净"的场景，预期使用率趋零。
- **验收**：3 新用例（软违规 advisory 入库携带码/EVIDENCE_REFS_REQUIRED 硬拒/捏造引用全力度拒）+全量 434/434+tsc 0+boundary 零违规；run-6 真机决胜测量（分层后剩余拒因应只剩硬门类，接受率应逼近 100%）。

### 18.5 run-6 实录与误杀修复（2026-07-04，Agent `2194d76`）

- **run-6**（`bootstrap_mr5p0uzq_9fdf5e50`，daemon 58281 新 dist）：architecture 8/12=67%、ts-js 4/16=25%。**风格类拒因清零**（分层生效——CONTRAST/DO_CLAUSE 等在窗口内零出现），但拒因被单一新码占满：`EVIDENCE_REFS_REQUIRED` ×11（6 个候选，重试三连拒到止损）。
- **根因（非模型错）**：11 次全部是模型**忠实引用了 search/structure/terminal 类台账条目**——采集时这类条目无 `file` 字段（run-6 台账 56 条中 23 条无 file），展开器`submitEvidenceExpansion.ts` 对它们"合法引用但不产出 source 标签"，闸按 `expandedSources===0` 判定即把"引了真证据但全为无标签条目"误判为"没给证据"。录入侧 note_finding 全部 ok=true 佐证 findings 携带的是通过校验的真实 refs。
- **修复**：①展开器返回 `resolvedRefs`（成功解析引用数）与 expandedSources 分离；②闸条件改 `resolvedRefs===0`（refs 缺席仍硬拒；有效无标签引用放行+info 留痕，source 下限仍由下游 INSUFFICIENT_EVIDENCE 把守、手写 sources 照常 fs 校验+自动矫正——捏造通道不重开）；③hint 升级为可照抄的带区间条目 `E-x=file:start-end` 列表+指引 memory.recall；④提示词三处：producer 优先引带区间条目、仅 search 类须补真实 sources；analyst RECORD 优先引 read 类条目（search 命中后先 read 再记录）；⑤kernel 端口 listRecent 增可选 range；⑥2 个回归钉（436/436）。
- **教训入库**：新增硬闸必须对台账全部条目形态（read/search/structure/terminal）逐形态过一遍判定矩阵——run-6 的闸只按 read 形态设计。§18.3 修复不变量新增一条：**闸的判定输入必须区分"证据缺席"与"证据形态不可展开"**。
- **run-7 实录（`bootstrap_mr5qw92r_35e06696`，daemon 59068）**：architecture 3/7=43%、ts-js 5/13=38%。新通路全部带电：机械展开 ×8、无标签放行 ×4、**style advisory 真机首触发 ×1**（DO_CLAUSE_NON_IMPERATIVE 随候选入库非阻断）、风格阻断保持零。拒因迁移为两类：①`SOURCE_REF_LINE_MISSING` ×6——无标签放行后手写 source 缺 `:line`（而被引用的 search 条目内容里有 `path:NN:` 真实行号可回填）；②`EVIDENCE_REFS_REQUIRED` ×6——producer 在 findings 之外自行综合的断言（无 E-x 可抄），有一例照拒绝提示用 evidence.search 自救成功（02:48 拒→02:49 带 refs 重提），barrel 类则改标题重提规避止损、反复烧回合。
- **run-7 修复（Agent `0f74219`）**：M2 行号机械回填——sanitize 阶段对缺 `:line` 的手写 source，从被引用条目回填真实行号（ranged 条目同文件用其区间；search 条目 content 首个命中行），只用采集真值；M1 综合断言指引——拒绝信息+producer 提示词明确"先 evidence.search 找支撑并引用，找不到直接放弃，**改标题重提同一断言无效**"（refs 缺席的综合断言是该闸的正当拦截对象，不是 bug）。三形态回填回归钉，437/437。

- **run-8 实录（`bootstrap_mr5ryi6f_205af16e`，daemon 59641，Agent `0f74219` dist）**：architecture 3/5=60%、ts-js 8/13=62%（按尝试计）；**按唯一候选计 ≈75%/73%**（3 次 EVIDENCE_REFS_REQUIRED 首拒全部在下一次尝试自救成功：补 refs→展开→过门入库）。机制全景带电确认：行号回填 `package.json→package.json:1-6` 等 11 处矫正、修复子调用真机修好违规（2→1、1→0 两例）、E7-D 确定性替换多次 remaining=0、advisory 兜底 1 例、**SOURCE_REF_LINE_MISSING 清零**（run-7 ×6→0）、风格类阻断连续三跑为零。剩余拒因：①EVIDENCE_REFS_REQUIRED 首拒（3 次，producer 综合断言先斩后奏——按设计属诚实闸，自救链一回合闭合）；②gateway 层查重暗拒（约 4 次无日志——8 跑饱和 KB 的正确拒绝；已补 gateway duplicate/rejected/blocked 三类留痕，Agent 下一 commit）。
- **三跑迁移曲线（门禁分层哲学下）**：run-6 67%/25%（误杀 bug）→ run-7 43%/38%（LINE_MISSING 顶格）→ run-8 60%/62%（唯一候选 ≈75%/73%）；风格阻断三跑全零、证据类捏造拒因三跑全零；每一跑的主导拒因都被下一跑消灭（REFS 误杀→LINE 缺失→查重饱和），拒因池已收敛到"诚实硬闸首拒（自救可过）+饱和查重（需新鲜 KB）"两类。

### 18.6 残余项

- **100% 认证**：饱和 KB 上查重暗拒不可避免（正确行为）；无饱和测量待 Dashboard 初始化新鲜项目后跑认证 run（既有阻塞记录见 §15 E6）。
- 采集侧 follow-up：code.search 结果按命中文件拆分为带 file 的分组条目（让 search 证据也能机械展开）——现以提示词引导 read 后记录规避。
- analyst 相位/plan 投影"必须内容"清单化审计。
- 主体传真实 jobId 接线（台账目录现用回退 id）。
- Dashboard styleAdvisories 展示面（人工复核入口）——产品观察，非本期承诺。
