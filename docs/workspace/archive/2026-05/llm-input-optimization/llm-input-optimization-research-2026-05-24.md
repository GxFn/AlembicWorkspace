# LLM Input Optimization Research

日期：2026-05-24
状态：已提升为 LLM 输入优化当前主线；Wave 4 发送给 `Alembic`
关联 TODO：`GTODO-2026-05-24-040`
维护窗口：AlembicWorkspace

## 定位

本记录针对 Alembic internal Agent 在 cold-start / rescan 中发送给 LLM 的输入链路做真实代码调研和闭环设计。它不是单个 bug 修复记录，而是后续“LLM 输入装配契约”主线的候选设计底稿。

用户已确认：`filePaths` 应做成真实 batch read 能力；其余默认方案接受。2026-05-25 用户要求开始 LLM 输入优化，本记录已作为 Wave 1-4 的调研底稿；当前执行入口为 [llm-input-optimization-wave-4-2026-05-25.md](../../../current/llm-input-optimization-wave-4-2026-05-25.md)。

## 最终目标候选

让 cold-start / rescan internal Agent 的 LLM 输入具备以下闭环性质：

1. **正确**：提示词、工具示例、tool schema、toolChoice 和实际 handler 参数一致，不再出现 `[object Promise]`、伪工具调用、错误参数示例或阶段行为冲突。
2. **分层**：身份、阶段策略、工具契约、动态上下文、记忆账本、展示 artifact 各有归属，不在多个 prompt fragment 中重复注入。
3. **可控**：Analyze / Record / Summarize / Produce 使用不同输入 profile；Producer 不继承 Analyst 的探索预算。
4. **可观察**：前端 Timeline 展示开发者可读摘要；完整 redacted LLM input 作为 job artifact 保存，可用于复盘和优化。
5. **可验证**：AlembicTest 能用 test-mode 固定证明输入错误消失、上下文不再 raw dump、Recipe / Skill 产出质量不回退。

## 2026-05-25 补充：监控与优化闭环

用户要求把 LLM 输入 / 输出监控从“能看见”推进到“能优化”。该补充不新建独立 TODO，归入 `GTODO-2026-05-24-040` 的 Wave 4 / Wave 5 范围；当前 Wave 3 仍先完成 Observation Ledger 复测，不打断 `AlembicTest` Test-07。

建议闭环：

1. **Timeline 只展示开发者可读摘要**：一条一条出现，展示阶段、输入摘要、输出摘要、工具调用、Nudge、Reflection、关键发现等；它不承担完整 prompt / output 保存职责。
2. **Prompt / Output Artifact 保存完整 redacted 输入输出**：每次 `llm.input` / `llm.output` 生成一个 artifact，process event 只放 `artifactRef`、section stats、chars / tokens、truncated 标记；存储位置应在 Ghost dataRoot 的 job artifacts 下。
3. **Trace Envelope 串起冷启动全链路**：固定 `jobId`、`sessionId`、`dimensionId`、`iteration`、`correlationId`、`parentEventId` 等字段；LLM input、provider call、LLM output、tool execution、retrieval / search / read 都应能按树回放。
4. **Metrics 服务优化而不只是展示**：按 section 记录字符 / token / 占比；记录 input / output / reasoning / cacheHit tokens；记录 duration、finishReason、empty retry、duplicate tool calls、read / search 去重、producer / analyze 阶段差异。
5. **Eval / Test 做质量闭环**：`AlembicTest` 用 test-mode 验证没有 `[object Promise]`、没有 schema mismatch、Observation Ledger 不再 raw dump、Producer 不带分析预算、LLM output 不被无提示截断。

与 `GTODO-2026-05-24-029` 的边界：`GTODO-2026-05-24-029` 只观察 WebSocket / UI 是否需要更细粒度低延迟追加；本主线负责事件语义、artifact、trace、metrics 和 test-mode 质量闭环。若后续用户要求严格“每条事件零批量延迟落屏”，再把 029 提升为独立实时性专项。

阶段顺序：

1. 先验收 Wave 3：确认 Ledger 是否真的减少 raw dynamic context。
2. 再派 `Alembic`：做 full redacted prompt / output artifact 持久化、artifactRef、trace envelope、metrics producer。
3. 再派 `AlembicDashboard`：做 Timeline 开发者摘要 + artifact 详情侧栏，不把完整内容塞回 Timeline。
4. 最后派 `AlembicTest`：做 test-mode 和一轮小 cold-start 复测，验证质量闭环和无回退。

## 2026-05-25 补充：progressive-chain-validation 阶段化验证

用户提醒：当前冷启动容易被当成一条长流水线，但旧的 `progressive-chain-validation` 思路本质是把长链路拆成一个个可证明的小阶段。该思路应并入 `GTODO-2026-05-25-003`，作为后续 Agent / LLM 输入输出优化前置的验证框架，而不是单独新增主线。

真实代码与文档证据：

- `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts` 当前内部冷启动仍是“同步骨架 + 异步维度填充”的流水线：先 `runFullResetPolicy()`，再 `ProjectIntelligenceCapability.run()`，随后构建 `ProjectSnapshot` / report / target map，最后 `startInternalDimensionExecutionSession()` 并 `dispatchInternalDimensionExecution()`。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/InternalDimensionExecutionPipeline.ts` 的维度填充继续串起 preparation、runtime initialization、Agent session 和 finalizer；这说明 LLM 输入优化若只看整轮 job 成败，会看不到 analyze / produce / persistence / finalizer 的单点问题。
- `AlembicCore/src/daemon/JobProcessEventContracts.ts` 已有 `workflow`、`llm.input`、`llm.output`、`tool`、`artifact`、`checkpoint`、`summary` 事件，以及 `correlationId` / `parentEventId` / `phase` / `dimensionId` 字段；这些字段可以承接节点级 trace，但目前还缺明确的 `chainNodeId` / `stageId` 语义。
- `Alembic/skills/progressive-chain-validation/progressive-chain-validation/references/overlays/alembic-coldstart-rescan.md` 已定义 N0-N14 coverage node，并明确 full run 只能作为观察证据，不能一次性把多个节点标为通过。

设计判断：

1. 产品运行时仍可以保持一条 cold-start / rescan pipeline；验证与优化层必须恢复为 progressive chain。
2. 未来优化 Agent / LLM 输入输出时，不能只比较“完整冷启动最终产出质量”，还要按节点比较：N8 stage factory / tool policy、N9 analyze quality、N11 produce、N12 persistence、N13 finalizer、N14 report/history。
3. Wave 4/5 的 artifact / trace / metrics 设计应预留 `chainNodeId`、`chainRunId`、`nodeStatus`、`nodeInputRef`、`nodeOutputRef` 和 `nodeEvidenceRef`，否则后续无法把 prompt / output / tool call / Recipe 产出回放到具体阶段。
4. `AlembicTest` 后续不应每次只跑 full cold-start；应优先使用 test-mode、小维度、stopAt / no-delivery / fixture replay 等方式验证当前节点，完整 cold-start 只作为最终确认。

后续启动 `GTODO-2026-05-25-003` 时，第一步应先形成节点级 baseline，而不是直接改 prompt：

- 基于 `progressive-chain-validation` 生成 cold-start / rescan 当前代码的 Source Chain Map。
- 选定 BiliDili 与 AlembicWorkspace 两个真实项目的最小节点 fixture。
- 建立节点级 scorecard：输入 section、工具调用、重复读搜、output contract、accepted / rejected candidates、skill receipt、persistence / report 对齐。
- 每次优化只声明自己修哪个节点的不变量，并用同一节点 fixture 做前后对比。

## 调研来源

- 测试事件：`AlembicTest/tmp/lotb-p2-events-bootstrap_mpjspdvu_23e95d13.json`
- 测试报告：`AlembicTest/docs/llm-output-completeness-test-mode-2026-05-24.md`
- 项目：BiliDili
- job：`bootstrap_mpjspdvu_23e95d13`
- session：`bs_1779628239822_8c4uxa`
- 配置：`ALEMBIC_TEST_MODE=1`，`architecture` 单维度，`maxFiles=4`，`contentMaxLines=25`，`skipGuard=true`
- 时间：2026-05-24 21:10-21:20 CST

## 真实输入链路

1. `Alembic` 创建维度执行输入，并通过 `buildBootstrapDimensionInputProcessEvents` 只投影 run input summary，不保存完整 prompt 展开；见 `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts:37`。
2. `AlembicAgent` 的 profile 使用 `ANALYST_SYSTEM_PROMPT` 和 `buildAnalystPrompt(...)` 组装静态分析输入；见 `AlembicAgent/src/agent/prompts/insight-analyst.ts:77`、`AlembicAgent/src/agent/prompts/insight-analyst.ts:254`。
3. `SystemPromptBuilder.build(...)` 会把 capability prompt fragment 和 capability dynamic context 继续拼入 system prompt；见 `AlembicAgent/src/agent/runtime/SystemPromptBuilder.ts:83`。
4. `SystemPromptBuilder.injectBudget(...)` 在 system source 下再次追加轮次预算；当前 dedupe 只检查“轮次预算”字面量，不识别 `ANALYST_SYSTEM_PROMPT` 已有“执行计划”；见 `AlembicAgent/src/agent/runtime/SystemPromptBuilder.ts:140`。
5. 每轮运行前，`AgentRuntime` 把 ExplorationTracker 的 nudge 追加为 user message，然后再计算 toolChoice 和 tool schemas；见 `AlembicAgent/src/agent/runtime/AgentRuntime.ts:655`、`AlembicAgent/src/agent/runtime/AgentRuntime.ts:690`。
6. 同一轮还会把 phase context、memory dynamic prompt、强制总结提示拼成 ephemeral dynamic context，并在 provider call 前追加到 messages；见 `AlembicAgent/src/agent/runtime/AgentRuntime.ts:704`、`AlembicAgent/src/agent/runtime/AgentRuntime.ts:844`。
7. developer-visible `llm.input` 是 `systemPrompt + dynamicContext + messages + tools` 的格式化文本；见 `AlembicAgent/src/agent/runtime/AgentRuntime.ts:853`、`AlembicAgent/src/agent/runtime/AgentRuntime.ts:2180`。
8. `Alembic` process event bridge 把该文本投影为前端事件，默认最多保留 `6000` 字并写入截断 metadata；见 `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts:13`、`Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts:629`。
9. `JobProcessEventRecorder` 当前是内存 retained recorder，通过 REST 和 WebSocket 给 Dashboard；见 `Alembic/lib/daemon/JobProcessEventRecorder.ts:55`、`Alembic/lib/http/routes/jobs.ts:102`、`AlembicDashboard/src/hooks/useJobProcessEvents.ts:153`。

结论：当前 provider 实际输入、开发者可见输入和前端展示输入不是同一个层级。后续不能只提高 Timeline 字符限制，必须明确“机器输入”和“开发者复盘 artifact”的边界。

## 已有优化点与保护点

后续执行该 TODO 时，不能把现有有效设计误删或绕开。以下机制应作为新设计的输入，而不是重做对象。

### 1. Static prompt cache 与 ephemeral dynamic context

- `AgentRuntime` 已经把 `baseSystemPrompt` 保持静态，并把 phase / memory 等动态内容作为 ephemeral user message 拼到 provider messages，目的是提升 prefix cache 命中；见 `AlembicAgent/src/agent/runtime/AgentRuntime.ts:704`、`AlembicAgent/src/agent/runtime/AgentRuntime.ts:844`。
- `BudgetController` 已经记录 cache hit telemetry，连续 0 cache hit 会提示检查 system prompt 是否被修改；见 `AlembicAgent/src/agent/runtime/BudgetController.ts:474`。
- 保护点：`LLM Input Assembly Contract` 不能把每轮变化内容重新塞回 system prompt；应保留“静态 system + 动态 context”的分层。

### 2. ContextWindow 多层压缩与投影视图

- `ContextWindow` 已有 L1/L2/L3/L4 分层压缩设计、tool call/result 原子单元保护、`toProjectedMessages()` 投影视图；见 `AlembicAgent/src/agent/context/ContextWindow.ts:10`、`AlembicAgent/src/agent/context/ContextWindow.ts:573`。
- L4 LLM compaction 当前保留实现但默认关闭，注释说明在 `note_finding` 证据链稳定前不自动触发；见 `AlembicAgent/src/agent/context/ContextWindow.ts:240`。
- 保护点：后续输入瘦身应优先改善 section / ledger / prompt 重复，不要直接开启 L4 当作主解法；也不要破坏 assistant toolCalls 与 tool result 的原子性。

### 3. Session budget 与工具结果预算

- `BudgetController` 已有 session token 预检、压缩触发、LLM usage 累计、并行工具预算分摊；见 `AlembicAgent/src/agent/runtime/BudgetController.ts:178`、`AlembicAgent/src/agent/runtime/BudgetController.ts:415`。
- `ContextWindow.getToolResultQuota()` 会按 context 使用率和 session pressure 动态降低 `maxChars/maxMatches`；见 `AlembicAgent/src/agent/context/ContextWindow.ts:710`。
- 保护点：实现 `code.read({ filePaths })` 时必须消费现有 per-round / per-tool budget，不能让 batch read 绕过输出限制。推荐返回 per-file 结果并支持 partial failure，整体输出仍受预算和 router maxOutputTokens 约束。

### 4. Tool registry 单一真相源与 capability 生成

- V2 tool registry 明确写着“单一真相源”，所有工具 metadata、action schema、handler 在 `registry.ts` 声明；见 `AlembicAgent/src/tools/v2/registry.ts:1`。
- `CapabilityV2` 已经从 registry 自动生成 `Available Tools` prompt fragment；见 `AlembicAgent/src/tools/v2/capabilities/CapabilityV2.ts:35`。
- `generateLightweightSchemas(...)` 已能按 allowedTools 生成轻量 schema；见 `AlembicAgent/src/tools/v2/registry.ts:515`。
- 保护点：`filePaths` batch read 必须先成为 registry / handler 的真实 contract，再让 prompt 示例使用；不要新增第二套手写 schema 真相源。

### 5. Stage machine、toolChoice 与阶段 nudge

- `ExplorationStrategies` 已把 pipeline type、phase、transition、toolChoice、reflection / planning 开关集中配置；Analyst 是 `SCAN → EXPLORE → VERIFY → RECORD → SUMMARIZE`，Producer 是 `PRODUCE → SUMMARIZE` 且不启用 reflection / planning；见 `AlembicAgent/src/agent/context/exploration/ExplorationStrategies.ts:174`、`AlembicAgent/src/agent/context/exploration/ExplorationStrategies.ts:237`。
- `NudgeGenerator` 已有阶段转换 nudge 和当前阶段提示，例如 RECORD 只允许 `note_finding`、SUMMARIZE 停止工具、VERIFY 只验证已定位证据；见 `AlembicAgent/src/agent/context/exploration/NudgeGenerator.ts:154`、`AlembicAgent/src/agent/context/exploration/NudgeGenerator.ts:409`。
- 保护点：修 planning/toolChoice 冲突时，应收敛 SCAN 阶段 wording 或 toolChoice 决策，不要移除阶段机本身。

### 6. Tool execution gating 与去重缓存

- `AgentRuntime.#getIterationToolSchemas` 在 RECORD / repair-only 时只暴露 direct `note_finding` schema；见 `AlembicAgent/src/agent/runtime/AgentRuntime.ts:755`。
- `ToolExecutionPipeline` 已有 `analystVerifyOnlyGate`，VERIFY 阶段只允许证据验证类动作；也有 deterministic duplicate guard，用于 session-level 读类工具短路；见 `AlembicAgent/src/agent/runtime/ToolExecutionPipeline.ts:565`、`AlembicAgent/src/agent/runtime/ToolExecutionPipeline.ts:615`。
- 保护点：`filePaths` batch read 加入后，需要更新或确认 duplicate key、VERIFY gate、policy file path 检查和缓存语义，确保 batch read 仍是 deterministic read-only 工具，不打开新的探索面。

### 7. MemoryCoordinator 与 ActiveContext 优先级

- `MemoryCoordinator` 已按 `user / analyst / producer` 分配不同 memory budget，且 dynamic memory 只注入 ActiveContext / WorkingMemory；见 `AlembicAgent/src/agent/memory/MemoryCoordinator.ts:91`、`AlembicAgent/src/agent/memory/MemoryCoordinator.ts:316`。
- `ActiveContext` 已有 scratchpad，用 `note_finding` 主动记录关键发现；scratchpad 在 prompt 构建中最高优先级、不可压缩；见 `AlembicAgent/src/agent/memory/ActiveContext.ts:386`、`AlembicAgent/src/agent/memory/ActiveContext.ts:522`。
- 保护点：Observation Ledger 应替换 raw compressed observation dump，但必须保留 scratchpad confirmed findings 的优先注入和 `note_finding` 作为 QualityGate 输入的地位。

### 8. Producer 已有隔离设计

- `PRODUCER_SYSTEM_PROMPT` 已明确“分析文本已经包含所有发现”，Producer 工作是格式化、校验、提交；并禁止搜索新文件、额外分析和终端工具；见 `AlembicAgent/src/agent/prompts/insight-producer.ts:76`。
- Producer v2 已注入 Analyst confirmed findings、evidenceMap 代码上下文、负空间信号、rescan 约束和 Panorama 上下文；其中代码上下文有 4000 chars budget；见 `AlembicAgent/src/agent/prompts/insight-producer.ts:212`、`AlembicAgent/src/agent/prompts/insight-producer.ts:337`。
- `BootstrapProduce` capability 也限定了 allowedTools：`code.read`、`knowledge.submit`、`memory.recall`、`meta.review`；见 `AlembicAgent/src/tools/v2/capabilities/BootstrapProduce.ts:15`。
- 保护点：Producer 输入优化不是从零建隔离，而是去掉不该进入 Producer 的 Analyst 预算 / 历史膨胀，同时保留 existing findings / evidenceMap / rescan 去重约束。

### 9. Developer-visible process events 与前端展示

- `AgentRuntime` 已把每次 provider call 格式化为 developer-visible `llm.input`，包含 requested/effective toolChoice、tool schema names、message count 等 metadata；见 `AlembicAgent/src/agent/runtime/AgentRuntime.ts:853`。
- `Alembic` bridge 已做 secret redaction、内容投影、截断 metadata、display / retention policy；见 `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts:13`、`Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts:629`。
- Dashboard hook 已支持 REST 初始加载、WebSocket 单事件追加、重连恢复和本地展示缓存；见 `AlembicDashboard/src/hooks/useJobProcessEvents.ts:96`、`AlembicDashboard/src/hooks/useJobProcessEvents.ts:133`。
- Dashboard util 已区分 semantic category、截断 hint、短/长内容默认折叠策略；见 `AlembicDashboard/src/utils/jobProcessEvents.ts:375`、`AlembicDashboard/src/utils/jobProcessEvents.ts:524`。
- 保护点：完整 prompt artifact 应作为现有 process events 的增强，不替换 `llm.input` Timeline 摘要、metadata、redaction 和前端恢复链路。

### 10. Alembic run input summary 安全边界

- `buildBootstrapDimensionInputProcessEvents` 当前只展示 internal Agent run input summary，并明确 full prompt expansion、file contents、provider payloads、secrets omitted；见 `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts:37`。
- 保护点：后续完整 prompt artifact 必须是 redacted artifact，并通过明确 artifact ref 展示；不要把 raw provider payload 直接塞进 dimension-input event。

## 实测画像

最近一次可用事件中共有 `72` 条 developer views，其中：

| 类型 | 数量 |
| --- | ---: |
| `llm.input` | 27 |
| `llm.output` | 25 |
| `llm.reflection` | 11 |
| `workflow` | 6 |
| `checkpoint` | 1 |
| `summary` | 2 |

最大输入样本：

| seq | phase | message count | 原始字符 | 事件保留 | 现象 |
| --- | --- | ---: | ---: | ---: | --- |
| 44 | analyze | 63 | 97463 | 6000 | Analyze 中后段输入膨胀到 9.7 万字符 |
| 41 | analyze | 60 | 95098 | 6000 | 历史消息 + memory 摘要持续累积 |
| 39 | analyze | 56 | 93559 | 6000 | 同上 |
| 37 | analyze | 50 | 84160 | 6000 | 同上 |
| 35 | analyze | 45 | 71886 | 6000 | 同上 |
| 56 | analyze | 79 | 68718 | 6000 | Summarize 前仍有 79 条 message |
| 69 | produce | 21 | 66132 | 6000 | Produce 仍带较大上下文 |

关键 needle 统计：

- `[object Promise]` 出现在 `seq 9/12/15/17/20/23` 的 retained input 中。
- `filePaths` 作为提示词中的重要使用方式出现在 `seq 9-56` 的所有 analyze retained input 中；当前问题不是“提示词不该鼓励批量读取”，而是提示词宣称了真实 handler 尚未支持的能力。
- `Missing required param "path"` 出现在 `seq 20/23/25/27`。
- `之前的探索摘要` 出现在 `seq 20-56`，说明 raw / compressed observation 在中后段反复回灌。
- `## Dynamic context` 出现在除最早 dimension input 之外的大部分 provider input 中。
- retained text 中未看到 `## Available tools`，主要原因是 DeepSeek V4 在 `toolChoice=none` 时会移除 tools，且长输入被 `6000` 字投影截断。

## 真实问题归因

### A. correctness

- `CodeEntityGraphLike.generateContextForAgent` 在 Agent 侧声明为同步 `string | null`，但 Core 实现是 async `Promise<string>`；`buildAnalystPrompt` 未 `await`，导致 `[object Promise]` 进入 prompt。证据：`AlembicAgent/src/agent/prompts/insight-analyst.ts:68`、`AlembicAgent/src/agent/prompts/insight-analyst.ts:400`、`AlembicCore/src/service/knowledge/CodeEntityGraph.ts:731`。
- `ANALYST_SYSTEM_PROMPT` 示例要求 `code.read` 使用 `filePaths` 批量读取，但真实 registry / handler 只接受 `path`。用户已确认该能力对 LLM 分析重要，后续应补齐真实 batch read，而不是删除使用方向。证据：`AlembicAgent/src/agent/prompts/insight-analyst.ts:98`、`AlembicAgent/src/tools/v2/registry.ts:50`、`AlembicAgent/src/tools/v2/handlers/code.ts:316`。
- Planning prompt 要求“制定计划后立即执行第 1 步”，但 Analyst 的 `SCAN` 阶段 `getToolChoice` 返回 `none`；DeepSeek V4 在 `toolChoice=none` 时会移除 tool schemas。证据：`AlembicAgent/src/agent/context/exploration/PlanTracker.ts:346`、`AlembicAgent/src/agent/context/exploration/ExplorationStrategies.ts:206`、`AlembicAgent/src/agent/runtime/AgentRuntime.ts:830`。

### B. policy duplication

- 阶段计划、预算、`note_finding` 要求、工具使用策略同时出现在 `ANALYST_SYSTEM_PROMPT`、`BootstrapAnalyze.promptFragment`、`SystemPromptBuilder.injectBudget`、`PlanTracker` / `NudgeGenerator` 和 QualityGate retry 文案里。
- 这些重复不是单纯“字数多”，而是会制造冲突：有的段落要求探索，有的段落禁止工具，有的段落要求记录，有的段落又要求直接总结。

### C. context hygiene

- `ActiveContext` 会把工具结果放进 recent observations；超出窗口后用 `TOOL_COMPRESS_STRATEGIES` 或 `defaultCompress` 压缩。未命中专用策略时，`defaultCompress` 会 JSON.stringify 原始结果再截断，导致 callId、timestamp、status、错误信息等调试字段进入 `之前的探索摘要`。证据：`AlembicAgent/src/agent/memory/ActiveContext.ts:32`、`AlembicAgent/src/agent/memory/ActiveContext.ts:129`、`AlembicAgent/src/agent/memory/ActiveContext.ts:310`、`AlembicAgent/src/agent/memory/ActiveContext.ts:542`。
- scratchpad 的 confirmed findings 适合回灌；raw tool observation 更适合日志 / artifact，不应默认作为推理材料反复注入。

### D. artifact boundary

- `llm.input` 事件当前同时服务三件事：provider call 复盘、Dashboard Timeline 展示、开发者调试。它被 `MAX_TEXT_CHARS=6000` 截断，适合作为 Timeline 摘要，不适合作完整 prompt 证据。
- `JobProcessEventRecorder` 当前以内存 retained 为主，无法承担长期完整 prompt artifact 的可靠保存。

### E. producer isolation

- Producer 阶段本应基于 Analyst 已记录的 findings / digest 生产 Recipe / Skill 交付物，但实测 `produce` 阶段仍出现 6 万字符级输入。后续需要区分 Producer input profile：只保留生产所需的 verified findings、target schema、existing knowledge conflict context 和 submission contract。

## 闭环设计方案

### 1. LLM Input Assembly Contract

新增一个显式装配契约，先在 `AlembicAgent` 内落地，后续若出现跨仓库共享需求再下沉 Core：

| Section | 生产方 | 消费方 | 内容 |
| --- | --- | --- | --- |
| `identity` | profile | provider | 角色、真实性、禁止伪造 |
| `stagePolicy` | exploration strategy | provider / tracker | 当前阶段能做什么、不能做什么、toolChoice |
| `toolContract` | registry | provider / tests | 当前可用工具和参数 schema；自然语言示例必须从 schema 派生 |
| `taskContext` | bootstrap/rescan input | provider | 维度、目标、projectInfo、必要 static context |
| `evidenceContext` | Core / AlembicAgent | provider | Panorama / graph / evidence starters 的短摘要 |
| `observationLedger` | ActiveContext | provider | 结构化成功证据、已读文件、失败类别、下一步建议 |
| `developerArtifact` | Agent / Alembic | Dashboard / logs | 完整 redacted input、section stats、token estimate、artifact refs |

关键点：prompt 不再由多个字符串随意拼接，而是先形成 section model，再投影为 provider input 和 developer artifact。

### 2. Tool Schema Truth

- `registry` 是工具参数事实源。自然语言工具示例要么从 registry 生成，要么由测试验证与 schema 一致。
- 用户已确认 `filePaths` 需要做成真实能力。第一版应让 `code.read` 同时支持单文件 `path` 和多文件 `filePaths`，并在 registry / handler / policy / prompt / tests 中保持一致。
- `filePaths` 能力必须有真实边界：只读、每次最多 3-5 个文件、每个文件沿用现有 maxLines / range / adaptive outline 规则、返回结构化 per-file result，并明确 partial failure 不导致整批失败。
- 若实现中发现 batch read 会与现有 delta cache / concurrency / token budget 冲突，应在 `AlembicAgent` 回填阻塞，而不是把提示词改回单文件模式。
- 增加静态测试：扫描 prompt 源码中的工具示例，至少覆盖 `code.read`、`code.search`、`graph.query`、`note_finding`。

### 3. Stage-Specific Profiles

- `Analyze`：允许探索、验证、记录；重点是产生真实 evidence 和 note_finding。
- `Scan/Planning`：若 `toolChoice=none`，只要求输出计划；不得提示同轮调用工具。
- `Record`：只允许补 `note_finding`，不再重复要求 code / graph。
- `Summarize`：停止工具，输出分析文本，不再要求继续探索。
- `Produce`：只消费 verified findings / digest / existing knowledge / schema；不带 Analyst 探索预算。

### 4. Observation Ledger

把 `之前的探索摘要` 从 raw compressed dump 改成机器可读、LLM 友好的 ledger：

- `evidence`: 已确认路径、行号、发现摘要。
- `readSet`: 已读文件和读取目的，帮助去重。
- `searchSet`: 已搜索关键词和结果规模，帮助避免重复搜索。
- `failureSet`: 失败类别，例如 `schema_mismatch: code.read.path_required`，不回灌 callId / timestamp。
- `nextHints`: 下一步建议，最多 3 条。

raw observation 仍保存在日志 / artifact 里，供开发者诊断，不默认进入 provider input。

### 5. Prompt Artifact

- Timeline `llm.input` 保持摘要化和可读，不追求无限长。
- 每次 provider call 生成完整 redacted prompt artifact，至少包含 section breakdown、original chars、retained chars、token estimate、requested/effective toolChoice、tool schema names、truncation metadata。
- artifact 存储应归 `Alembic` job artifact / Ghost dataRoot，而不是 Dashboard localStorage 或内存 recorder。
- Dashboard 展示“查看完整输入”入口即可，不把完整 prompt 塞进 Timeline 卡片。

## 推荐阶段

### Phase 0：证据锁定

目标：把当前问题变成固定 fixture，不再依赖自然复现。

- 保存或生成 test-mode 最小事件 fixture。
- 固定断言：`[object Promise]`、`filePaths` batch read 真实可用、`Missing required param "path"` 不再由 batch read 触发、SCAN `toolChoice=none` 与 planning prompt 冲突、raw observation dump、Produce 大输入。

### Phase 1：Correctness Closeout

主责：`AlembicAgent`

- 修正 `CodeEntityGraph.generateContextForAgent` async 类型和 `await`。
- 实现 `code.read({ filePaths })` 真实 batch read：registry schema、handler、policy / validation、prompt 示例和返回结构统一闭合，同时保留单文件 `path` 兼容。
- 对 `toolChoice=none` 下的 planning nudge 做一致性收敛。
- 增加 targeted tests，证明错误输入不再出现。

### Phase 2：Input Assembly Layering

主责：`AlembicAgent`，必要时 `AlembicCore` 观察 contract 是否需要共享

- 建立 section 化 input assembly。
- 收敛重复预算、重复 `note_finding`、重复工具规则。
- 将 stage policy 从自然语言堆叠转为 strategy / runtime 统一生成。
- 明确 Analyze / Record / Summarize / Produce 四套 profile。

### Phase 3：Observation Ledger

主责：`AlembicAgent`

- 用结构化 ledger 替换 raw `之前的探索摘要` 回灌。
- 保留 scratchpad confirmed findings 的高优先注入。
- raw tool result 进入日志 / artifact，不默认进入 LLM dynamic context。

### Phase 4：Prompt Artifact And Display

主责：`Alembic` / `AlembicDashboard`

- `Alembic` 持久化完整 redacted LLM input / output artifact，存储在 Ghost dataRoot 的 job artifacts 下。
- process event 只保留 Timeline 摘要、`artifactRef`、section stats、chars / tokens、truncated 标记。
- 引入 trace envelope，把 `jobId`、`sessionId`、`dimensionId`、`iteration`、`correlationId`、`parentEventId` 固定下来，让 LLM input、provider call、LLM output、tool execution、retrieval / search / read 能按树回放。
- 记录优化用 metrics：section token / char 占比、input / output / reasoning / cacheHit tokens、duration、finishReason、empty retry、duplicate tool calls、read / search 去重、producer / analyze 阶段差异。
- Dashboard Timeline 只展示开发者可读摘要，并通过侧边栏或详情入口展示完整 artifact；不要把 Timeline 变成长日志。

### Phase 5：Integration Verification

主责：`AlembicTest`

- 用 test mode 验证 Phase 1-4 闭环。
- 验证 cold-start Recipe / Skill 产出数量和质量没有回退。
- 验证前端可以看到摘要、metadata、artifact ref 和完整输入 / 输出 artifact。
- 验证 trace envelope 能串起 LLM input、provider call、LLM output 和 tool execution。
- 验证没有 `[object Promise]`、没有 schema mismatch、Observation Ledger 不再 raw dump、Producer 不带分析预算、LLM output 不被无提示截断。

## 完成定义候选

该主线只有在以下条件全部满足时才算完成：

- 最新 test-mode cold-start 的 `llm.input` retained / artifact 中不再出现 `[object Promise]`。
- `code.read({ filePaths })` 是真实可调用能力：schema 支持、handler 支持、返回结构清晰、partial failure 可读，且事件中不再出现由 batch read 示例诱发的 `Missing required param "path"`。
- 第一轮 planning 与 effective `toolChoice` 一致，不再诱导不可用工具调用。
- Analyze / Produce 输入 profile 可区分，Producer 不再携带 Analyst 探索预算。
- dynamic context 中不再默认注入 raw JSON / callId / timestamp 调试 dump。
- Dashboard Timeline 仍可读，完整 redacted input / output 可从 artifact 查看。
- LLM input / output、provider call、tool execution、retrieval / search / read 都带 trace envelope，可按 job / session / dimension / iteration / correlation 关联回放。
- artifact 与 metrics 能支持后续优化判断：能看出哪个 section 膨胀、哪里重复工具调用、哪里发生 empty retry、producer 是否误带 analyze 预算。
- AlembicTest 证明 Recipe / Skill 产出不回退，并回填事件、截图或报告证据。

## 窗口归属

| 窗口 | 归属判断 |
| --- | --- |
| `AlembicAgent` | 主责。负责 prompt assembly、stage policy、tool schema coherence、ActiveContext ledger、provider input 和单元测试。 |
| `Alembic` | 负责 process event bridge、完整 prompt artifact、job storage / Ghost dataRoot、HTTP/API 暴露。 |
| `AlembicDashboard` | 只负责展示，不参与输入逻辑；消费 Timeline 摘要和 artifact refs。 |
| `AlembicCore` | 暂时观察。只有 section contract / tool schema projection 出现第二消费方时再下沉共享。 |
| `AlembicPlugin` | 暂无直接任务。该主线是 internal Agent 输入，不改变 Plugin 通过 Codex host agent 工作的边界。 |
| `AlembicTest` | 验证窗口，负责 test-mode fixture、真实复测和回填证据。 |

## 与当前主线关系

- `GTODO-2026-05-24-040` 已提升为当前主线。
- `GTODO-2026-05-25-003` 已登记为当前主线完成后的最高优先级 TODO：等 Timeline / Artifact / Trace / Metrics / Eval 闭环真实建立并通过复测后，再基于 baseline 反向优化 Agent / LLM 输入输出。该项不打断当前 Wave 3 / Test-07，也不能在监控可视化闭环建立前提前实现。
- `GTODO-2026-05-24-036` multi-root ProjectScope 的 P7 五文件夹补测保留为未关闭 TODO，后续再补测；不得因此把 multi-root 归档为完全完成。
- 本主线 Wave 1 先发送 `AlembicAgent`，不启动 `Alembic` / `AlembicDashboard` / `AlembicTest`，直到 Agent correctness 回填。

## 后续派发建议

当前已按该建议启动 [Wave 1](../../../current/llm-input-optimization-wave-1-2026-05-25.md)：`AlembicAgent` 做 Phase 0 + Phase 1 任务包，fixture 锁定、async graph context、`code.read({ filePaths })` 真实 batch read、planning/toolChoice 一致性和 targeted tests 一起完成。不要先派 `AlembicDashboard`，因为前端展示依赖完整 artifact contract。
