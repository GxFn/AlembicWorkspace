# Progressive Chain Validation Metrics Wave 5A - Analyze Burn Evidence Baseline

日期：2026-05-29
状态：Wave 5C 已验收 / 待归档
发送给：无
总控定位：本文件是 `GTODO-2026-05-25-003 / Progressive Chain Validation Metrics` 的当前总控计划。Wave 4A 已证明 N11 sourceRef before / after 可度量并已归档；Wave 5A 不再补“证据贯穿地图”，只聚焦 cold-start `analyze` 阶段从起点开始、每一轮能推进结论的 LLM burn 是否被证据约束，以及工程确定性知识是否被正确消费。

## 目标判断

- 用户目标：证据已经在贯穿地图；当前没有做到的是 cold-start `analyze` 阶段没有从起点开始约束每一轮能推进结论的 LLM burn。这里的“证据参与”不是机械要求每轮新增取证，而是要求每轮明确消费已确定工程证据或产出新证据。
- 最终完成定义：Wave 5A 只确认 `analyze` 代码事实，不实现。输出 `analyze` pipeline 里首轮、非终结轮、验证 / 反思轮和记录轮分别是否有 evidence starter、deterministic evidence input、tool evidence、sourceRef / file index / AST anchor、trace / metric；标明哪些轮次是 evidence-grounded、哪些只是 post-hoc filter、哪些可能是 self-reflection-only burn。完成后再裁决 Wave 5B。
- 当前是否已经达到：已达到本计划完成定义。Wave 5A 调研完成；Wave 5B `AlembicAgent` 提交 `284b50516b20d6f90cf74bec892259354ee9bcdd` 已通过总控验收；Wave 5C `Alembic` 提交 `1fce35dceaaead89c0fd51c1ef02163b677ff20d` 已通过总控验收，把 Agent `groundingLedger` 消费到 job report / `pcvScorecard.processMetrics.analyzeGrounding`。
- 未达到时剩余差距：当前计划无剩余必做差距。后续若要继续优化，应另起 PCVM 下一阶段：真实 cold-start after-run 观察、Dashboard 展示或更深的 prompt / tool policy 微调均不属于本计划默认续派范围。
- 已达到时验收 / 归档判断：Wave 4A 已归档；Wave 5A / 5B / 5C 已形成 analyze evidence-through 的代码事实、Agent ledger producer 和 Alembic scorecard consumer 闭环。当前应进入归档，不继续派发。
- 当前任务分区：验收 / 归档。
- 不纳入本轮事项：不改 Agent prompt / tool policy；不跑 full cold-start；不重画 produce / submit / persistence 证据地图；不做 Dashboard comparison UI；不做 golden set；不修改真实测试项目；不派 `AlembicTest`。

## 总控决策记录

- 本次决策触发：用户阅读 `direction-synthesis-2026-05-29` 后确认，证据地图已经存在，当前缺口是 `analyze` 阶段从第一轮 LLM burn 起就要求证据，而不是终点再筛。
- 方向纪要关系：`direction-synthesis-2026-05-29` 的方法论用于判断“慢法 A / 慢法 B”。本轮只把这个判断应用到 `analyze` burn，不扩展成全冷启动地图。
- 需求 / 测试结果理解：Wave 4A 证明 sourceRef 终点筛子有效；本轮要确认 `analyze` 里是否仍有“模型先自由分析 / 反思 / 自洽，证据后置介入”的 burn。
- 已核对证据：已完成；关键证据包括：
  - `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionRuntimeBuilder.ts` 已把 `evidenceStarters` 放入 analyze stage 的 `strategyContext`。
  - `AlembicAgent/src/agent/prompts/insight-analyst.ts` 已把 `evidenceStarters` 写入 Analyst prompt，并要求用 `code({ action: "read" })` 验证。
  - `AlembicAgent/src/tools/v2/capabilities/BootstrapAnalyze.ts` 已要求主动 `note_finding`，且 evidence 必须包含完整相对路径和行号。
  - `AlembicAgent/src/agent/context/exploration/ExplorationStrategies.ts` 当前 Analyst 策略仍有 `SCAN` 阶段 `toolChoice=none`，注释明确 `SCAN` 是无工具 briefing / plan seed；`SCAN→EXPLORE` 在 `phaseRounds >= 1 || iteration >= 1` 或文本响应后即可推进。
  - `AlembicAgent/src/agent/context/exploration/ExplorationStrategies.ts` 的 `EXPLORE→VERIFY` 和 `VERIFY→RECORD` 使用累计 `evidenceToolCallCount` / `memoryFindingCount`，不是 per-burn 证据增量门槛；`EXPLORE` 累计 evidence 后可在 40% 预算后转 `auto`，`VERIFY` 达累计门槛后也转 `auto`。
  - `AlembicAgent/src/external/ai/registry/models/deepseek.ts` 明确 DeepSeek V4 `toolChoice.allowed=false`：V4 thinking 兼容路由会拒绝 `tool_choice=required` / named tool，主路径必须使用 `tools + reasoning_content`，不依赖强制 `tool_choice`。
  - `AlembicAgent/src/external/ai/transport/DeepSeekTransport.ts` 和 `AlembicAgent/src/external/ai/providers/DeepSeekProvider.ts` 都有注释说明 DeepSeek V4 tools 主路径不发送 / 不依赖 `tool_choice`；`ParameterGuard` 会过滤不被模型约束允许的 `toolChoice`。
  - `AlembicAgent/src/agent/runtime/AgentRuntime.ts` 对 `toolChoice='none'` 有兼容处理：DeepSeek V4 会移除 tool schemas，避免 `hasTools=true` 触发不合适的 thinking / tool schema 行为；这解释了当前 `SCAN` 首轮为什么无法新增工具证据。
  - `AlembicAgent/src/agent/context/ExplorationTracker.ts` 的文本响应路径会调用 `endRound({ toolNames: [] })`，因此纯文本也消耗并计入一轮 burn；`EXPLORE` / `VERIFY` / `RECORD` 的 nudge 是事后纠偏，不是调用前硬门禁。
  - `AlembicAgent/src/agent/runtime/LLMInputAssembly.ts` 每轮会注入 `Stage policy`、`Tool contract`、`Evidence context`，并带 `trackerMetrics`、`requestedToolChoice`、`effectiveToolChoice` 等上下文；这提供过程观测基础，但尚未形成 `evidence-in-generation` per-burn 指标。
  - `AlembicAgent/src/agent/runtime/PcvNodeEvidence.ts` 记录 `inputAssembly` 和工具结果 source refs；现有 N11 / QualityGate 能做事后 sourceRef validity，但不能证明每次 analyze burn 都被代码证据驱动。
- 是否需要先验证 / 重新计划 / 用户确认：用户已确认方向；本轮不需要额外需求设计。Wave 5A 不派实现窗口。
- 本次允许更新：活跃 Workspace 当前计划、当前状态、TODO 挂载；总控可继续读取代码事实并补充 `analyze burn` 缺口表。
- 本次不得更新：`AlembicAgent` prompt / strategy / tracker / tests、`Alembic` runtime consumer、`AlembicTest` 测试单、PCV source、Dashboard UI、真实测试项目。Wave 5B 裁决前不得实现。

## 工程判断修正：evidence-grounded 不等于每轮新增取证

- 结论：每一轮能推进结论的 LLM burn 都必须 evidence-grounded；但不应机械要求每一轮都重新调用 code / graph / terminal 产出新证据。
- 正确使用确定性知识：`evidenceStarters`、file index、AST summary、dependency graph、call graph、panorama、Guard audit、sourceRef validation 是工程确定性证据底座，不应只作为提示词背景文本。它们应该进入可记录的 evidence input / grounding context，被每轮 burn 引用、消费或用于裁决下一步取证方向。
- 合法 burn 分类：
  - `deterministic-evidence-consumed`：本轮消费了已注入的 AST / graph / file index / evidenceStarters 等确定性证据，并只在其支撑范围内推进判断。
  - `evidence-produced`：本轮通过 code / graph / terminal / memory 工具产出新的可复核证据。
  - `verification-only`：本轮只验证已有 claim、路径、符号或调用关系，不做新探索。
  - `record-only`：本轮只把已验证发现写入 `note_finding` / ledger。
  - `planning-only`：本轮只基于已知证据生成下一步取证计划，不得推进事实结论。
  - `invalid-no-evidence`：本轮没有消费可观测确定性证据，也没有新增证据，却推进事实结论或阶段。
- DeepSeek V4 约束：DeepSeek V4 不能依赖强制 `tool_choice`，所以工程门禁必须落在 runtime 侧：工具是否可见、确定性证据是否以结构化 ID / fingerprint 进入输入、本轮输出是否可分类、本轮是否允许推进阶段。
- Wave 5B 方向修正：从“每轮必须新增 evidence delta”改为“每轮推进必须有 evidence grounding”。新增取证只在确定性证据不足以支撑当前判断时发生；RECORD / SUMMARIZE 不应重新取证，只能消费已有 ledger，缺证据则回退到 VERIFY / EXPLORE。

## Design / 需求来源

- 来源类型：用户直接确认 + 方向纪要。
- 来源文档：[anti-hallucination direction synthesis](../../../../requirement-designs/anti-hallucination-product-direction/direction-synthesis-2026-05-29.md)。
- 用户确认状态：已确认。
- 总控接收结论：接收为 PCVM Wave 5A 当前主线，目标是 `analyze` evidence-grounding-per-burn code fact baseline，不是证据地图重画，也不是立即实现。
- 是否需要目标阶段确认：不需要；属于 `GTODO-2026-05-25-003` 后续阶段内的明确推进。
- 是否需要代码实现依赖调研：需要，且由总控继续完成；本轮不派执行窗口。

## 代码事实与边界

- 相关仓库：总控读取 `AlembicAgent` / `Alembic` 中与 `analyze` 输入和运行策略直接相关的代码事实；本轮不设实现窗口。
- 初始关键入口：
  - `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionRuntimeBuilder.ts`
  - `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapInputBuilders.ts`
  - `AlembicAgent/src/agent/profiles/presets.ts`
  - `AlembicAgent/src/agent/prompts/insight-analyst.ts`
  - `AlembicAgent/src/agent/context/exploration/ExplorationStrategies.ts`
  - `AlembicAgent/src/agent/context/exploration/NudgeGenerator.ts`
  - `AlembicAgent/src/agent/context/ExplorationTracker.ts`
  - `AlembicAgent/src/tools/v2/capabilities/BootstrapAnalyze.ts`
- producer / consumer 依赖：`Alembic` 已向 Agent 输入 evidence starters；`AlembicAgent` 是 analyze turn policy / prompt / tracker 所在。Wave 5A 只确认 analyze 每轮是否 evidence-grounded，以及确定性工程证据是否被正确使用。
- 不可提前消费的上游：没有 Wave 5A analyze burn 缺口表和 DeepSeek V4 确定性证据消费边界前，不派 `AlembicAgent` 实现，不派 `Alembic` 设计 report schema，不派 `AlembicTest` 做 runtime after-run。
- 不允许触碰的目录 / 仓库：不改 `BiliDili`，不改 Dashboard UI，不改 PCV source。
- 真实测试项目是否涉及：本轮不涉及。

## Analyze Burn 缺口表

本表是 Wave 5A 的实际产物。完成前不得派发实现窗口。

| analyze burn / 阶段 | 当前已确认输入证据 | 当前已确认硬约束 | 当前缺口 | 初步分类 |
| --- | --- | --- | --- | --- |
| Analyze 输入构建 | `Alembic` 用 AST / Guard / dependency graph / call graph / panorama 构建 `evidenceStarters`，进入 `strategyContext` 并写入 Analyst prompt。 | prompt 要求优先使用注入信号并用 `code.read` 验证；`BootstrapAnalyze` 暴露 code / graph / memory / terminal 工具。 | 这些是确定性证据底座，但当前主要以 prompt 文本进入 LLM，缺少可追踪的 evidence input ID / fingerprint / consumed refs。 | 有确定性证据，结构化消费不足。 |
| SCAN burn | `STRATEGY_ANALYST` 注释明确 `SCAN` 是无工具 briefing / plan seed；DeepSeek V4 在 `toolChoice=none` 时还会移除 tool schemas。 | `getToolChoice(SCAN)` 返回 `none`；`SCAN→EXPLORE` 在一轮或文本响应后推进。 | SCAN 可以保留为“基于确定性证据的取证计划”概念，但不能作为无证据事实推进；当前代码无法证明它消费了哪些 evidenceStarters，也不能阻止纯文本自洽推进。 | first-burn evidence-grounding gate 必须修。 |
| EXPLORE burn（无累计 evidence 前） | 可用 code / graph / terminal / memory；`isEvidenceToolCall` 把 `code.structure/search/read/outline`、`graph.overview/query`、`terminal.exec` 计为 evidence。 | 策略层请求 `toolChoice=required`；但 DeepSeek V4 不支持强制 `tool_choice`，guard / transport 会过滤，不应把 requested required 当作 API 硬门禁。 | 对 DeepSeek V4，正确 enforcement 是工具可见 + runtime 检查本轮是否消费确定性证据或产出新 evidence；无 grounding 则 nudge / retry。 | 事中证据约束需要 runtime gate。 |
| EXPLORE burn（已有累计 evidence 后） | trackerMetrics / traceStats 会进入每轮 Evidence context；PCV input assembly 记录 requested / effective toolChoice。 | `EXPLORE→VERIFY` 只要求累计 `evidenceToolCallCount > 0`；40% 预算后 `EXPLORE` 可转 `auto`。 | 累计 evidence 不等于本轮被证据约束；后续 burn 可变成文本分析 / 自洽，缺 per-burn grounding classification、consumed evidence refs 和 sourceRef anchor gate。 | 局部 evidence-driven，非 per-burn grounding。 |
| VERIFY burn | 累计 evidence 和 note_finding 数参与转换；Evidence context 会显示 trackerMetrics。 | 累计 evidence < 2 且无 memory finding 时策略层请求 `toolChoice=required`；达标后 `VERIFY` 回到 `auto`。 | VERIFY 不应机械新增取证；它可以只消费已有证据做验证。但若自然语言 VERIFY 没有引用已知证据或焦点实体，就仍可能只是模型判断。 | 应是 verification-only / evidence-consumed，不是自由反思。 |
| RECORD burn | `BootstrapAnalyze` 和 prompt 都要求 `note_finding` evidence 含路径 / 行号。 | 策略层请求 `toolChoice=required`，runtime 只暴露 direct `note_finding` schema；文本两轮后让位给 gate / record repair。 | RECORD 不应重新取证；它只能消费已有 ledger / finding refs。若没有可记录证据，应退回 VERIFY / EXPLORE，而不是生成自然语言记录。 | record-only 合法，但需绑定已验证 refs。 |
| Analyze 输出进入后续链路 | QualityGate / record repair / N11 sourceRef validity 已能后置筛 invalid refs；Wave 4A 已证明 sourceRef validity 可度量。 | N11 / QualityGate 能用文件索引、sourceRef 和 note_finding 事实筛掉无效引用。 | 终点硬筛成立，但不证明每轮 analyze burn 都 evidence-grounded；需要过程 ledger 证明每轮结论来源。 | 事后筛成立，过程 grounding 指标缺失。 |

## 修正后的第一阻塞点与 Wave 5B 裁决输入

- 修正后的第一阻塞点：在 DeepSeek V4 主路径下，`SCAN toolChoice=none` 会移除 tool schemas；但真正问题不是“首轮没有新增工具证据”，而是当前 runtime 无法证明首轮消费了哪些确定性工程证据，却允许这一轮推动阶段。
- `SCAN` 的正确判断：它可以作为“基于确定性证据的内部规划 / evidence frontier 选择”存在；但不能作为无证据事实推进。合法 SCAN 只能产出取证计划、候选焦点或待验证假设，不能直接生成已验证结论。
- 第二层缺口：`EXPLORE` / `VERIFY` 的阶段推进和降级基于累计 evidence，而不是当前 burn 的 evidence grounding / sourceRef anchor；且 DeepSeek V4 不支持 API 级 `tool_choice=required`，所以“策略请求 required”不能被写成硬门禁已经成立。
- 现有观测基础：`LLMInputAssembly` 和 `PcvNodeEvidence` 已记录 input assembly、stageProfile、requested / effective toolChoice、toolSchemaNames、tool result source refs；Wave 5B 需要补齐 deterministic evidence refs、per-burn grounding classification、invalid no-evidence 记录和 retry / nudge 结果。
- Wave 5B 推荐裁决：先派 `AlembicAgent` 做 DeepSeek V4-first analyze evidence-grounding gate。第一轮 `analyze` 不再允许无证据 seed 被视为有效进展：必须可观测地消费 deterministic evidence refs，或暴露 evidence 工具并产出新证据；若 DeepSeek V4 返回纯文本且没有 deterministic evidence consumption / evidence tool / sourceRef / finding delta，则该轮分类为 `invalid-no-evidence`，不推进 `SCAN→EXPLORE`。
- 暂不推荐：机械要求每轮都新增工具证据、做多模型抽象、直接把 `tool_choice=required` 写成硬门禁、直接重写 full prompt、直接做 golden set 全套、直接跑 full cold-start。当前第一步应是 DeepSeek V4 下的最小 evidence-grounding gate / replay，把“每轮推进必须被证据约束”跑通。

## Wave 5B 完整实施方案（DeepSeek V4-first evidence-grounding，已启动）

### 目标与完成定义

- 目标：围绕 DeepSeek V4，让 cold-start `analyze` 从第一轮有效 LLM burn 起就必须 evidence-grounded；不能再接受没有消费确定性工程证据、也没有新增证据的纯文本理解 / 自洽作为 `SCAN→EXPLORE` 的有效进展。
- 完成定义：
  - `AlembicAgent` 对 DeepSeek V4 的 `analyze` 第一轮提供结构化 deterministic evidence refs，并在需要新增证据时保持 evidence 工具可见。
  - DeepSeek V4 若返回纯文本且本轮没有 deterministic evidence consumption、evidence tool call、sourceRef delta、accepted / rejected finding delta，则该轮被标记为 `invalid-no-evidence`，不推进阶段。
  - runtime 插入明确 nudge：若已有确定性证据足够，要求声明消费的 evidence refs；若不足，要求调用 code / graph / terminal 取证；下一轮只有 evidence-grounded 后才允许进入后续 analyze 阶段。
  - targeted replay 或单元测试能证明 DeepSeek V4 text-only but evidence-grounded planning 可以保留为 `planning-only`，DeepSeek V4 text-only conclusion without evidence 被拦截，DeepSeek V4 tool-call burn 被接受。
  - 当前阶段不改 full prompt、不跑 full cold-start、不做 Dashboard UI、不派 `AlembicTest`。允许对 DeepSeek V4 的 `SCAN` 首轮做最小 runtime / strategy override，使其不再是有效无证据 burn。

### 代码事实约束

- `AlembicAgent/src/agent/runtime/AgentRuntime.ts` 已在每轮 LLM 前构建 `LLMInputAssembly`，并向 process event 写入 `requestedToolChoice`、`effectiveToolChoice`、`toolSchemaNames`。
- `AlembicAgent/src/agent/runtime/PcvNodeEvidence.ts` 已记录 input assembly、tool result source refs、accepted / rejected finding refs，但当前 summary 更偏“节点最终证据”，缺少 deterministic evidence input refs 和 per-burn grounding ledger。
- `AlembicAgent/src/agent/context/ExplorationTracker.ts` 已能统计累计 `evidenceToolCallCount` / `memoryFindingCount`，但没有把每轮 delta 独立沉淀。
- `AlembicAgent/src/external/ai/registry/models/deepseek.ts`、`DeepSeekTransport.ts`、`DeepSeekProvider.ts` 和 `ParameterGuard.ts` 证明 DeepSeek V4 不能依赖强制 `tool_choice`；因此实现不能靠 API `required`，必须靠“结构化确定性证据输入 + 工具可见 + runtime grounding gate + nudge / retry”。
- 当前 `AlembicAgent` 仓库已有未提交改动，后续执行窗口必须先保护现有改动，不得覆盖或重排不相关文件。

### 实施顺序

1. **PCVM-W5B-A：DeepSeek V4 analyze first-burn evidence-grounding gate**
   - 窗口：`AlembicAgent`。
   - 目标：当 `modelRef` 是 DeepSeek V4 且 stageProfile 为 `analyze`、tracker phase 为首轮 `SCAN` / 无证据 `EXPLORE` 时，强制走 evidence-grounded turn：要么消费结构化 deterministic evidence refs，要么保持工具可见并产出新证据。
   - 具体做法：`toolChoice` 对 DeepSeek V4 不能设 `required`；第一有效 burn 必须把 deterministic evidence refs 写入 runtime input，并在需要新增取证时保留 evidence tool schemas；runtime 记录 `deepseekV4ToolChoiceMode: tools-visible-no-forced-tool-choice`。
   - 拦截规则：LLM 返回后，如果本轮没有 deterministic evidence consumption、`functionCalls.length === 0` 且 sourceRef / finding / evidence tool delta 都为 0，则不调用会推进阶段的 `endRound`，把该轮记录为 `invalid-no-evidence`。如果只是基于确定性证据提出取证计划，则记录为 `planning-only`，不允许推进已验证事实结论。
   - 验证：新增 / 扩展 AgentRuntime 单元测试，覆盖 DeepSeek V4 首轮 text-only without evidence 被拦截、text-only evidence-grounded planning 不推进事实结论、DeepSeek V4 首轮 tool-call 被接受、非首轮 summary / record 不受影响。

2. **PCVM-W5B-B：Pcv per-burn grounding ledger**
   - 窗口：`AlembicAgent`。
   - 目标：在 `PcvNodeEvidence` 增加 compact per-burn grounding ledger，主要服务 DeepSeek V4 first-burn grounding gate；不存 raw prompt / raw result，只存可度量字段。
   - 输出字段建议：
     - `ref`、`iteration`、`stageProfile`、`trackerPhase`、`pipelineType`
     - `requestedToolChoice`、`effectiveToolChoice`、`toolSchemaNames`
     - DeepSeek V4 mode 字段：`toolChoiceSupported=false`、`toolChoiceSent=false`、`toolSchemasVisible=true/false`
     - `deterministicEvidenceRefs`、`consumedEvidenceRefs`、`evidenceStarterRefs`
     - `textOutputChars`、`reasoningTokens`、`functionCallNames`
     - `toolCallDelta`、`evidenceToolCallDelta`、`sourceRefDelta`、`acceptedFindingDelta`、`rejectedFindingDelta`
     - `classification`：`deterministic-evidence-consumed` / `evidence-produced` / `verification-only` / `record-only` / `planning-only` / `invalid-no-evidence` / `summary-only`
   - 插入点：`recordPcvInputAssembly` 创建 / 更新 burn 起点；`#processToolCalls` 和 `#processTextResponse` 完成本轮结果分类。
   - 验证：扩展 `AgentRuntime.test.ts` / `llm-input-layering.test.ts`，确认 process metadata 与 final `pcvNodeEvidence` 都不泄漏 raw content，并包含 burn ledger / summary。

3. **PCVM-W5B-C：Analyze targeted replay / fixture**
   - 窗口：`AlembicAgent`。
   - 目标：用 fake DeepSeek V4 provider 或 targeted runtime test 模拟 analyze 的 text-only、tool-call、note_finding 场景，不跑真实 cold-start。
   - 成功判定：
     - 首轮 `SCAN` text-only without evidence 被标为 `invalid-no-evidence`，并触发 grounding / 取证 nudge。
     - 首轮基于 deterministic evidence refs 的 planning-only 不被当作已验证事实推进。
     - 首轮 DeepSeek V4 不发送 `tool_choice=required`，但 evidence tools 可见。
     - 有 code / graph / terminal evidence 工具调用的 burn 标为 `evidence-produced`，并有 sourceRef / evidence delta。
     - 只有累计 evidence、当前轮无新证据但明确消费已有 refs 的 burn 标为 `deterministic-evidence-consumed` 或 `verification-only`。

4. **PCVM-W5B-D：总控验收与下一阶段裁决**
   - 窗口：`AlembicWorkspace`。
   - 目标：读取 `AlembicAgent` 提交、diff、测试结果和 replay 输出，裁决是否需要 Wave 5C。
   - Wave 5C 候选只在指标证明必要时启动：
     - runtime grounding gate 扩展到后续非终结 analyze burn。
     - prompt / tool policy 微调：只针对 DeepSeek V4 replay 证明仍空转的类别，不做大 prompt 重写。
     - `Alembic` consumer 汇总：只有需要把 grounding ledger 汇入 job report / scorecard 时再派。

### 窗口覆盖与非目标

- `AlembicAgent`：Wave 5B 唯一首派窗口，负责 DeepSeek V4 first-burn evidence-grounding gate、grounding ledger 和 targeted replay。
- `Alembic`：观察。只有 `AlembicAgent` 已产出稳定 grounding ledger 且需要 job report / scorecard 消费时再派。
- `AlembicCore`：无任务。当前不需要共享 contract 下沉。
- `AlembicDashboard`：无任务。不做 comparison UI。
- `AlembicPlugin`：无任务。不涉及 Codex host plugin。
- `AlembicDesign`：无任务。用户目标已明确。
- `AlembicTest`：无任务。Wave 5B 不需要真实项目 / full cold-start。
- `BiliDili`：无任务。真实项目不触碰。

### 验证建议

```text
cd AlembicAgent && npm run typecheck
cd AlembicAgent && npm test -- AgentRuntime llm-input-layering
cd AlembicAgent && git diff --check
cd codex-control-workspace && node scripts/verify-control-center.mjs --require-todo --require-task-packages
```

### 启动门禁

- 用户已确认启动 Wave 5B。
- 启动后只派 `AlembicAgent`；不自动派 `AlembicTest`，不启动 full cold-start。
- 若 `AlembicAgent` 发现 DeepSeek V4 first-burn grounding gate 无法在现有 transport / guard 约束下闭环，先回填阻塞，不得直接改变 DeepSeek provider 行为。

## 阶段顺序

1. Wave 4A：归档已验收的 N11 sourceRef baseline。状态：已完成。
2. Wave 5A-TC：总控只做 `analyze` 代码事实基线，不实现；确认首轮和每轮 LLM burn 是否 evidence-grounded。状态：已完成。
3. Wave 5A-TC：产出 `Analyze Burn 缺口表`，并修正 DeepSeek V4 兼容边界与确定性证据消费口径。状态：已完成。
4. Wave 5B 方案：已收敛为 DeepSeek V4-first analyze evidence-grounding gate + per-burn grounding ledger / targeted replay。状态：`AlembicAgent` 提交 `284b50516b20d6f90cf74bec892259354ee9bcdd` 已通过总控验收。
5. Wave 5C：`Alembic` consumer 已验收，把 Agent `groundingLedger` 汇入 cold-start job report / `pcvScorecard` 的可度量 process metric；不改 prompt / tool policy，不跑 full cold-start。

- 下一处真实阻塞点：当前计划内无阻塞。若后续要继续推进 PCVM，应先由总控另起下一阶段裁决，明确是否做真实 cold-start after-run、Dashboard 展示或 prompt / tool policy 微调。
- 阻塞点之前还能做：归档 Wave 5A/5B/5C，更新 TODO / index / current status。
- 当前可派发窗口：无。
- 当前阻塞 / 观察窗口：无；`AlembicTest` 本轮无任务。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| PCVM-W5A-TC-ANALYZE-BURN-EVIDENCE-BASELINE | `AlembicWorkspace` | 总控只做 `analyze` 代码事实基线，查清首轮和每轮 LLM burn 的 evidence-grounding 要求。 | 已完成 / 待裁决 |
| PCVM-W5B-AGENT-DEEPSEEK-V4-FIRST-BURN-EVIDENCE-GROUNDING | `AlembicAgent` | 增加 DeepSeek V4 analyze first-burn evidence-grounding gate、per-burn grounding ledger 和 targeted replay。 | 已验收 |
| PCVM-W5C-ALEMBIC-GROUNDING-LEDGER-SCORECARD-CONSUMER | `Alembic` | 消费 Agent `groundingLedger`，汇总到 cold-start job report / `pcvScorecard` 的 process metric。 | 已验收 |

### PCVM-W5A-TC-ANALYZE-BURN-EVIDENCE-BASELINE：Analyze burn evidence baseline

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 09:18 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 10:18 CST

阶段目标：

- 查清 cold-start `analyze` 生成链路里哪些 burn 已经 evidence-grounded，哪些只是事后筛，哪些可能只是模型自洽。已完成。

主线动作：

- 读取方向纪要、Wave 4A 归档和 `analyze` 相关代码入口。
- 对 Analyze 输入构建 / SCAN / EXPLORE / VERIFY / RECORD / 输出进入后续链路形成缺口表。
- 判断修正后的第一阻塞点，作为 Wave 5B 的裁决输入。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不实现产品代码。
- 不派 `AlembicAgent`。
- 不派 `AlembicTest`。
- 不重画 produce / submit / persistence 证据地图。

下一处真实阻塞点：

- 已修正第一阻塞点：DeepSeek V4 主路径下 `SCAN toolChoice=none` 会移除 tool schemas，第一轮不可能新增工具证据；正确修复不是强制 API `tool_choice=required`，也不是机械每轮取证，而是让第一轮有效 analyze burn 可观测地消费确定性工程证据或产出新证据，并用 runtime grounding gate 拦截无证据纯文本推进。

阻塞点之前还能做：

- 总控可同步当前计划并等待 Wave 5B 裁决；不需要派 `AlembicTest`。

验证命令：

```text
cd codex-control-workspace && node scripts/sync-current-plan.mjs --plan .wakeflow-active/current/progressive-chain-validation-metrics-wave-5a-analyze-evidence-through-2026-05-29.md --check
cd codex-control-workspace && node scripts/verify-control-center.mjs --require-todo --require-task-packages
```

回填要求：

- 完成范围：只做 `cold-start analyze` 代码事实基线；未改产品代码，未派子窗口。
- 代码事实：见“已核对证据”和“Analyze Burn 缺口表”。
- Analyze Burn 缺口表：已完成。
- 第一阻塞点：DeepSeek V4 first valid analyze burn 缺少 evidence-grounding gate；`SCAN` 不能再作为有效无证据 burn 推进事实结论。
- Wave 5B 推荐裁决：先做 DeepSeek V4 first-burn evidence-grounding gate、per-burn grounding ledger 和 targeted replay，再裁决是否扩展到后续非终结 burn。
- 验证命令和结果：待运行 sync / verify。

执行前置硬规则：

- 开始前先明确声明当前窗口定位：`AlembicWorkspace` 总控；当前仓库职责是跨仓库目标接收、计划分派、阶段验收、边界记录、TODO 归口、模板和协作规则，不直接做产品实现。
- 本包由总控执行，不派子窗口；仍需按 `AGENTS.md` 停止卡判断用户目标、证据、最小闭环和第一阻塞点。

### PCVM-W5B-AGENT-DEEPSEEK-V4-FIRST-BURN-EVIDENCE-GROUNDING：DeepSeek V4 first-burn evidence-grounding gate

窗口：`AlembicAgent`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 12:40 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 14:00 CST

阶段目标：

- 在不改变 DeepSeek V4 provider transport 行为、不发送强制 `tool_choice` 的前提下，补齐 first valid analyze burn evidence-grounding gate、per-burn grounding ledger 和 targeted replay。

主线动作：

- 对 DeepSeek V4 `analyze` 首轮保留 evidence tool schemas，记录 `deepseekV4ToolChoiceMode: tools-visible-no-forced-tool-choice`。
- 在 `PcvNodeEvidence` 增加 compact per-burn grounding ledger / summary，记录 requested / effective / schemas-visible / deterministic refs / consumed refs / grounding classification / evidence delta。
- 在 `AgentRuntime` 的 LLM 调用、工具调用处理和文本响应处理路径补记录点。
- 增加 targeted tests / replay fixture，覆盖 DeepSeek V4 首轮 text-only without evidence invalid、text-only evidence-grounded planning、DeepSeek V4 首轮 tool-call accepted、deterministic-evidence-consumed、evidence-produced、verification-only、record-only / summary-only。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不重写完整 `SCAN` 策略；只允许 DeepSeek V4 analyze 首轮最小 override / gate。
- 不改 full prompt。
- 不跑 full cold-start。
- 不做 golden set。
- 不派 `AlembicTest`。
- 不修改 `Alembic` report / scorecard consumer；除非本包完成后总控裁决需要 Wave 5C。

下一处真实阻塞点：

- DeepSeek V4 首轮工具可见与 runtime gate 是否能在不改 provider transport 的情况下闭环；若不能，需要先回填阻塞，而不是直接改变 DeepSeek provider。

阻塞点之前还能做：

- 读取并保护 `AlembicAgent` 当前未提交改动。
- 先补纯函数 helper 和单元测试。
- 再接入 runtime / PCV evidence ledger。

验证命令：

```text
cd AlembicAgent && npm run typecheck
cd AlembicAgent && npm test -- AgentRuntime llm-input-layering
cd AlembicAgent && git diff --check
```

回填要求：

- 完成范围。
- 提交 hash 或 no-commit 理由。
- 修改文件和新增字段概要。
- DeepSeek V4 first-burn evidence-grounding gate 测试结果。
- targeted replay / runtime 测试结果。
- burn classification 样例 JSON。
- 遗留风险：是否还需要把 runtime gate 扩展到后续非终结 burn、是否需要 prompt 微调或 `Alembic` consumer。

执行前置硬规则：

- 先读取 `AGENTS.md`、当前总控计划和 `AlembicAgent/AGENTS.md`，明确当前窗口定位和仓库职责。
- 先检查 `AlembicAgent` 当前未提交改动，不能覆盖用户或其它窗口已有改动。
- 若需要开启 Codex 子 agent，只能在 `AlembicAgent` 本仓库职责内分担调研 / 测试，最终由 `AlembicAgent` 窗口统一复核和回填。

总控验收（2026-05-29 13:21 CST）：

- 回填证据：`AlembicAgent` 提交 `284b50516b20d6f90cf74bec892259354ee9bcdd`。
- 独立复核：提交修改集中在 `AgentRuntime.ts`、`LLMInputAssembly.ts`、`PcvNodeEvidence.ts`、`PipelineStrategy.ts`、runtime public export 和 `AgentRuntime.test.ts`；未触碰其它仓库。
- 代码事实：DeepSeek V4 analyze 首轮 / 无证据 `EXPLORE` 保持 evidence tools 可见但不强制 `tool_choice=required`；纯文本无 deterministic evidence consumption / evidence tool / sourceRef / finding delta 时记录 `invalid-no-evidence`，rollback tracker tick，并注入 grounding nudge。
- 验证命令和结果：`npm test -- AgentRuntime llm-input-layering` 通过（2 files / 18 tests）；`npm run typecheck` 通过；`npm run lint` 通过；`npm run check` 通过（28 files / 154 tests）；`git diff --check HEAD^ HEAD` 通过；`AlembicAgent` 工作区 clean。
- 总控裁决：接受 Wave 5B。当前剩余差距不是 Agent gate，而是 `Alembic` job report / `pcvScorecard` 尚未消费 `groundingLedger`，无法形成用户可见的 process metric。

### PCVM-W5C-ALEMBIC-GROUNDING-LEDGER-SCORECARD-CONSUMER：Grounding ledger report consumer

窗口：`Alembic`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 13:21 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 13:21 CST

阶段目标：

- 在不跑 full cold-start、不改 `AlembicAgent`、不新增 Dashboard UI 的前提下，让 `Alembic` cold-start workflow 消费 Agent `pcvNodeEvidence.groundingLedger`，并汇总为 job report / `pcvScorecard` 中可度量的 analyze evidence-through process metric。

主线动作：

- 查清 `projectBootstrapDimensionAgentOutput` / dimension result / final report 当前如何携带 Agent phase result 与 `pcvNodeEvidence`。
- 在 `BootstrapPcvNodeLocalEvidence` / `InternalDimensionFillFinalizer` 或同等 report 汇总层增加最小 analyze grounding summary，字段只保留统计和分类，不保存 raw prompt / raw output。
- 指标建议：`burnCount`、`invalidNoEvidenceCount`、`planningOnlyCount`、`evidenceProducedCount`、`deterministicEvidenceConsumedCount`、`verificationOnlyCount`、`recordOnlyCount`、`summaryOnlyCount`、`toolSchemasVisibleCount`、`deepseekV4NoForcedToolChoiceCount`。
- 将 summary 挂入 `pcvScorecard` / `dimensions[dimId].pcvNodeEvidence`，并补 targeted unit 证明 `groundingLedger` 不会被 `normalizePcvNodeEvidenceSet` 丢弃。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不修改 `AlembicAgent`。
- 不改 Agent prompt / tool policy。
- 不跑 full cold-start。
- 不做 Dashboard comparison UI。
- 不派 `AlembicTest`。
- 不改真实测试项目。

下一处真实阻塞点：

- `Alembic` 当前 `normalizePcvNodeEvidenceSet` 只保留 N8 / N11 / N12；需要确认 Agent analyze result 里的 `pcvNodeEvidence.groundingLedger` 到达 report 汇总层后是否会被丢弃，以及最小 schema 应归入现有 `pcvScorecard` 哪个节点 / summary。

阻塞点之前还能做：

- 读取 `BootstrapProjections.ts`、`BootstrapConsumers.ts`、`BootstrapPcvNodeLocalEvidence.ts`、`InternalDimensionFillFinalizer.ts` 和相关单元测试。
- 先补 targeted unit，再接最小 summary。

验证命令：

```text
cd Alembic && npm run typecheck
cd Alembic && npm test -- InternalDimensionFillFinalizer BootstrapPcvNodeLocalEvidence
cd Alembic && git diff --check
```

回填要求：

- 完成范围。
- 提交 hash 或 no-commit 理由。
- 说明 `groundingLedger` 从 Agent run result 到 job report / `pcvScorecard` 的数据路径。
- 给出新增 summary 字段样例，并说明不包含 raw prompt / raw output。
- 验证命令和结果。
- 遗留风险：是否还需要真实 cold-start after-run 或 Dashboard 展示，必须交回总控裁决。

执行前置硬规则：

- 先读取 `AGENTS.md`、当前总控计划和 `Alembic/AGENTS.md`，明确当前窗口定位和仓库职责。
- 先检查 `Alembic` 当前未提交改动，不能覆盖用户或其它窗口已有改动。
- 本包只做 report / scorecard consumer；若发现需要改 `AlembicAgent` 或真实测试项目，停止并回填阻塞。

总控验收（2026-05-29 14:00 CST）：

- 回填证据：`Alembic` 提交 `1fce35dceaaead89c0fd51c1ef02163b677ff20d`。
- 独立复核：提交修改集中在 `BootstrapConsumers.ts`、`BootstrapPcvNodeLocalEvidence.ts`、`InternalDimensionFillFinalizer.ts` 和对应 unit tests；`Alembic` 工作区 clean。
- 代码事实：`buildPcvAnalyzeGroundingLedgerSummary` 从 Agent run result / analyze phase `pcvNodeEvidence.groundingLedger` 汇总 compact statistics；`consumeBootstrapDimensionResult` 合并到 dimension `pcvNodeEvidence.groundingLedger`；`InternalDimensionFillFinalizer` 将其汇入 `report.dimensions[dimId].pcvNodeEvidence` 与 `report.pcvScorecard.processMetrics.analyzeGrounding`，并同步 totals / comparison hints。
- 隐私边界：summary 只保留 `burnCount`、`invalidNoEvidenceCount`、`planningOnlyCount`、`evidenceProducedCount`、`deterministicEvidenceConsumedCount`、`verificationOnlyCount`、`recordOnlyCount`、`summaryOnlyCount`、`toolSchemasVisibleCount`、`deepseekV4NoForcedToolChoiceCount` 等统计 / 分类，不保存 raw prompt / raw output。
- 验证命令和结果：`npm test -- InternalDimensionFillFinalizer BootstrapPcvNodeLocalEvidence BootstrapDimensionConsumer` 通过（2 files / 9 tests）；`npm run check` 通过；`git diff --check HEAD^ HEAD` 通过。初次 `npm run typecheck` 因本地 `AlembicAgent` dist 缺失无法解析 `@alembic/agent/ai`，总控执行 `AlembicAgent npm run build` 后复测 `Alembic npm run typecheck` / `npm run check` 均通过；该问题为本地 package build 环境 gap，不是本次 Alembic 提交缺陷。
- 总控裁决：接受 Wave 5C。当前计划已达到完成定义，进入归档 / 下一阶段裁决，不继续自动派发。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-25-003 | Wave 5C 已验收 / 待归档 | agent / llm optimization loop | P0 | PCV source / `Alembic` / `AlembicAgent` / `AlembicTest` | Wave 5A/5B/5C 已形成 analyze evidence-through 闭环：代码事实基线、Agent grounding ledger producer 和 Alembic report / scorecard consumer。 | 是 | Wave 5B `AlembicAgent` 提交 `284b50516b20d6f90cf74bec892259354ee9bcdd` 和 Wave 5C `Alembic` 提交 `1fce35dceaaead89c0fd51c1ef02163b677ff20d` 均已通过总控验收。 | `AlembicWorkspace` |
| PCVM-OBS-2026-05-28-EVENT-JOB-SCORECARD-SUMMARY | 观察中 | observability follow-up | P2 | `Alembic` | events API / job JSON 当前不携带完整 final `pcvScorecard`；若后续 Dashboard / automation 需要无需 report API 的 scorecard summary，再增强。 | 否 | 不阻塞 Wave 5A。 | `Alembic` |
| PCVM-OBS-2026-05-28-PROBE-TIMEOUT | 观察中 | test harness follow-up | P2 | `AlembicTest` | real AI scorecard smoke 中 480s probe 先返回 producer-gap，但 job 693s completed；后续同类真实 AI smoke 建议 timeout 提高到 12 分钟。 | 否 | 不阻塞 Wave 5A。 | `AlembicTest` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 | 否 | Wave 5C 已通过总控验收。 |
| `AlembicCore` | 无任务 | 否 | 暂无共享 contract 下沉需求。 |
| `AlembicAgent` | 已完成 | 否 | Wave 5B 已通过总控验收。 |
| `AlembicDashboard` | 无任务 | 否 | 不做 comparison UI。 |
| `AlembicPlugin` | 无任务 | 否 | 不涉及 Codex Plugin。 |
| `AlembicDesign` | 无任务 | 否 | 用户已确认方向，无需需求设计。 |
| `AlembicTest` | 无任务 | 否 | 本轮不跑真实项目。 |
| `BiliDili` | 无任务 | 否 | 真实项目只作为受保护测试目标，不直接派发。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | Wave 5C 已通过总控验收。 |
| `AlembicCore`<br>无任务 | 暂无共享 contract 下沉需求。 |
| `AlembicAgent`<br>已完成 | Wave 5B 已通过总控验收。 |
| `AlembicDashboard`<br>无任务 | 不做 comparison UI。 |
| `AlembicPlugin`<br>无任务 | 不涉及 Plugin。 |
| `AlembicDesign`<br>无任务 | 不需要需求设计。 |
| `AlembicTest`<br>无任务 | 不跑真实项目。 |
| `BiliDili`<br>无任务 | 不触碰真实项目。 |

## 可复制提示词

发送给：无

本计划已达到完成定义；不再输出子窗口领取提示词。后续若继续 PCVM，应先由总控另起下一阶段计划。

## 测试交接

- 是否需要 `AlembicTest`：否。
- 总控自测结论：本轮只做代码事实基线，不依赖真实项目。
- 需要真实场景的理由：暂无；只有 Wave 5B 裁决进入 runtime after-run 时，才判断是否需要真实 / 默认 AI。
- 测试前边界与多条件判断：
  - 测试要回答的问题：Wave 5A 不启动测试；本轮只回答 `analyze` 代码事实链路里哪里缺 evidence-per-burn。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：`AlembicWorkspace` 总控代码事实基线。
  - 成功能推出的结论：可以裁决 Wave 5B 第一实施点。
  - 失败能推出的结论：总控代码事实基线不足，需要继续调研，而不是转交真实测试。
  - 不能推出的结论：不能推出 full cold-start、所有 N0-N14、Dashboard UI 或 golden set 完成。
  - 停止或不开始条件：若需要改变产品代码、跑真实项目或修改 prompt / tool policy，必须进入 Wave 5B 裁决。
- 测试单：无。
- 测试交流入口：[test-exchange.md](../../../../../codex-control-workspace/.wakeflow-active/current/test-exchange.md)
- 真实项目保护说明：本轮不触碰真实项目。

## 回填区

- 2026-05-29 09:18 CST：总控接收用户确认：证据贯穿地图已存在，当前缺口是 cold-start analyze 没有从起点开始要求每轮能推进结论的 LLM burn 被证据约束。
- 2026-05-29 09:36 CST：总控复核发现 Wave 5A 初版计划过早派 `AlembicAgent` 实现；已修正为总控自执行代码事实基线，不派产品窗口，Wave 5B 再裁决实现方向。
- 2026-05-29 09:46 CST：总控再次纠偏：Wave 5A 不做 produce / submit / persistence 证据地图，只聚焦 `analyze` 首轮和每轮 LLM burn 的 evidence-grounding 要求。
- 2026-05-29 10:18 CST：总控完成 analyze-only 代码事实调研初版：曾把 `SCAN toolChoice=none` 判为第一阻塞点，并指出 `EXPLORE` / `VERIFY` 基于累计 evidence，不保证 per-burn evidence delta。
- 2026-05-29 10:43 CST：用户指出 DeepSeek V4 不支持强制 `tool_choice`；总控复核 DeepSeek registry / transport / runtime 注释后修正归因：`toolChoice=none/required` 不能当作 DeepSeek V4 API 硬门禁，Wave 5B 应先做 DeepSeek V4 first-burn evidence-grounding gate / per-burn grounding ledger / targeted replay。
- 2026-05-29 11:05 CST：总控基于代码事实制定 Wave 5B 完整实施方案：首派 `AlembicAgent`，先做 DeepSeek V4 first-burn evidence-grounding gate、per-burn evidence grounding ledger 和 targeted replay；不改 prompt / SCAN / full cold-start。
- 2026-05-29 11:28 CST：用户确认当前主用和测试 AI 都是 DeepSeek V4；总控将 Wave 5B 从多模型泛化收敛为 DeepSeek V4-first，不再考虑其它 LLM。
- 2026-05-29 11:45 CST：总控修正“每轮取证”口径：每轮推进必须 evidence-grounded，但不机械要求每轮新增工具证据；确定性工程知识必须作为可记录 evidence input 被消费。
- 2026-05-29 12:40 CST：用户确认开启自动化并进入下一步；总控启动 Wave 5B，首派 `AlembicAgent`，不派 `AlembicTest`，不跑 full cold-start。
- 2026-05-29 13:21 CST：总控验收 `AlembicAgent` Wave 5B 通过：提交 `284b50516b20d6f90cf74bec892259354ee9bcdd`，`npm run check` / targeted tests / typecheck / lint / `git diff --check` 均通过。下一步进入 Wave 5C，派 `Alembic` 消费 `groundingLedger` 到 job report / `pcvScorecard`。
- 2026-05-29 13:31 CST：总控创建 `Alembic` Wave 5C heartbeat automation `alembic`，当前等待目标窗口领取 / 回填。
- 2026-05-29 14:00 CST：总控验收 `Alembic` Wave 5C 通过：提交 `1fce35dceaaead89c0fd51c1ef02163b677ff20d`，`groundingLedger` 已进入 `report.dimensions[dimId].pcvNodeEvidence` 与 `pcvScorecard.processMetrics.analyzeGrounding`；`npm test -- InternalDimensionFillFinalizer BootstrapPcvNodeLocalEvidence BootstrapDimensionConsumer`、`npm run check`、`git diff --check HEAD^ HEAD` 均通过。当前计划达到完成定义，进入归档 / 下一阶段裁决。

<!-- workspace-sync
{
  "status": "Wave 5C 已验收 / 待归档",
  "indexPlanDescription": "PCVM Wave 5A/5B/5C 已形成 analyze evidence-through 闭环，当前待归档 / 下一阶段裁决。",
  "indexStatusDescription": "当前状态：PCVM Wave 5C 已验收；Agent grounding ledger producer 与 Alembic report / pcvScorecard consumer 均通过总控验收。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "PCVM Wave 5A/5B/5C：analyze evidence-through 调研、Agent grounding gate 验收与 Alembic scorecard consumer。",
  "currentStatusSummary": "PCVM Wave 5C 已验收；当前计划达到完成定义，待归档 / 下一阶段裁决。",
  "indexRows": [
    {
      "type": "PCVM Wave 5A analyze burn evidence baseline",
      "doc": ".wakeflow-active/current/progressive-chain-validation-metrics-wave-5a-analyze-evidence-through-2026-05-29.md",
      "status": "Wave 5C 已验收 / 待归档",
      "description": "AlembicAgent grounding gate 与 Alembic groundingLedger report / pcvScorecard consumer 均已验收。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "PCVM Wave 5A analyze burn evidence baseline",
      "doc": ".wakeflow-active/current/progressive-chain-validation-metrics-wave-5a-analyze-evidence-through-2026-05-29.md",
      "description": "Analyze burn 缺口表、Wave 5B 总控验收和 Wave 5C Alembic consumer 任务包。"
    }
  ]
}
-->
