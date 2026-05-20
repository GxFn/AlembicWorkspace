# Alembic Agent Evidence Recording And Phase Chain Workspace Plan

状态：Wave 9D 阻塞，等待用户确认真实项目数据发送策略
总控窗口：AlembicWorkspace
创建日期：2026-05-20
适用范围：`AlembicAgent`、`Alembic`、`AlembicDashboard`、`BiliDili`

## 背景

本计划来自 `BiliDili` 真实 cold-start 监控暴露的问题。用户已确认两个优化方向：

- `note_finding` 不能降级成普通参考项。它的价值是把“分析报告看起来合理”变成“关键发现有结构化证据可审计”。
- 探索阶段和 `note_finding` 记录阶段应该分开设置资源与配置；探索中可以 opportunistic 提前记录，但不能依赖探索阶段一定完成结构化记录。

本计划不是放松 QualityGate，也不是减少证据要求。目标是把证据记录从“完整 analyze 末尾的脆弱阶段”调整为“独立、可控、可验证的小阶段”，并收窄阶段链路中重复或弱作用的部分，降低 token 浪费和假完成。

## 真实代码事实

已读取的关键实现：

- `AlembicAgent/src/agent/context/exploration/ExplorationStrategies.ts`
  - 当前 `STRATEGY_ANALYST` 为 `SCAN -> EXPLORE -> VERIFY -> RECORD -> SUMMARIZE`。
  - `RECORD` 阶段的 `getToolChoice()` 返回 `required`，理论上应强制 `memory.note_finding`。
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts`
  - `#getIterationToolSchemas()` 在 `RECORD` 阶段只保留 `memory` 工具，并把 schema 收窄到 `note_finding`。
  - `#processTextResponse()` 在 `RECORD` 收到文本时只追加 nudge，但没有把该阶段隔离成独立短预算修复阶段。
  - `#finalize()` 在没有最终回复时会进入 forced summary；真实运行显示取消 / timeout 后仍可能有后续 compact / summary 行为。
- `AlembicAgent/src/external/ai/providers/DeepSeekProvider.ts`
  - DeepSeek V4 有 tools 时默认启用 thinking。
  - `ParameterGuard` 会在 thinking 模式下过滤 `tool_choice`，因此 `required` 不能真正强制模型调用 `memory`。
- `AlembicAgent/src/agent/prompts/insight-gate.ts`
  - `memoryFindingCount === 0` 或 `< 3` 会触发 QualityGate retry。
  - 现有 gate action 只有 `retry` / `degrade`，缺少 `record_repair` 这类细粒度动作。
  - QualityGate 能从 Markdown 分析文本和 evidence map 派生 findings，但仍会因为缺少真实 `note_finding` 而重跑完整 analyze。
- `AlembicAgent/src/agent/strategies/PipelineStrategy.ts`
  - 当前 `retry` 会回到上一个执行阶段，即完整 analyze stage。
  - 这导致“报告质量合格但缺结构化 note_finding”时重跑整个维度。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionRuntimeBuilder.ts`
  - `Alembic` 创建 analyst scope、`ExplorationTracker` 和 `@alembic/agent` runtime，并以 `file:../AlembicAgent` 作为本地开发依赖。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts`
  - `Alembic` 消费分析报告、distilled working memory 和 findings，并持久化 dimension report。

结论：

- 缺少 `note_finding` 不是 QualityGate 过严，而是 record 阶段的运行控制、provider 约束和 retry 粒度不完整。
- `RECORD` 阶段方向正确，但现在和完整 analyze 共用同一资源上下文，太靠后且不能跨 provider 稳定强制工具调用。
- 需要把 `note_finding` 记录变成独立可控小阶段，并把 QualityGate 的 missing finding 场景从 full retry 改为 record-only repair。

## 最终目标

本计划完成后，internal AI cold-start / rescan 的分析链路应满足：

- `note_finding` 仍是 candidate 输出前的硬性证据门槛。
- 探索期允许提前记录 `note_finding`，但不把提前记录作为唯一成功路径。
- `VERIFY` 后有独立 record-only 阶段，拥有独立 max rounds、timeout、token budget、tool allowlist 和失败语义。
- QualityGate 遇到唯一失败原因是 `note_finding` 缺失或不足时，不再重跑完整 analyze，而是进入短小的 record repair。
- record repair 只能使用已有分析文本、已读取文件证据、evidence map、referenced files 和 memory recall；禁止搜索、读新代码、重新探索。
- provider 无法强制 tool call 时，可以使用受控 fallback，但 fallback 必须从已有 evidence 中校验路径 / 行号 / 引用关系后才写入 memory，并标注来源为 repair。
- 阶段链路中重复或弱作用阶段被收窄：`SCAN` 不重复 deterministic snapshot；`VERIFY` 只做证据核验；`SUMMARIZE` 只在状态允许时执行；取消 / timeout 后不能继续补 summary 或误计完成。

## 非目标

- 不降低 QualityGate 的证据要求。
- 不删除 `note_finding`。
- 不把无证据 Markdown findings 当作通过。
- 不要求 `BiliDili` 业务代码做任何修改。
- 不在 `AlembicDashboard` 里实现后端 Agent 决策。
- 不让 `AlembicCore` 承担 provider / runtime / tool-call 策略。
- 本波不启动完整 BiliDili cold-start；真实项目复测只在 L4 memory package 稳固、上游修复验收后按小范围门禁进行。

## 设计方案

### 方向 A：Evidence Recording 独立小阶段

保留探索期 opportunistic `note_finding`：

- 在 `EXPLORE` / `VERIFY` 中，如果模型发现明确且证据就在眼前，仍允许立即调用 `memory({ action: "note_finding", ... })`。
- 提前记录的 finding 进入 ActiveContext scratchpad，继续作为 QualityGate 正常证据。

新增 / 强化 record-only 阶段：

- `RECORD` 不再只依赖同一 analyze 循环末尾的 nudge。
- 对 analyst pipeline 增加 record-only budget，例如短 timeout、少轮次、小 max tokens、只允许 `memory.note_finding` 和必要 evidence recall。
- record-only 输入只包含：
  - 当前 analysis report。
  - EvidenceCollector / ActiveContext 中已有 tool evidence。
  - referenced files。
  - 已有 key findings。
  - QualityGate 失败原因和缺口数量。
- record-only 禁止：
  - `code.read` / `code.search` / `graph.query` / `terminal`。
  - 重新分析项目结构。
  - 重新启动完整 analyze。

Provider 适配：

- DeepSeek V4 thinking 模式下 `tool_choice=required` 被过滤，因此不能把 required 当作强约束。
- `AlembicAgent` 需要为 record-only 提供 provider-aware 路径：
  - 优先尝试 memory-only tools，并在该阶段关闭或绕开会过滤 `tool_choice` 的 thinking 模式，前提是 provider 支持该组合。
  - 如果 provider 仍不能稳定强制 tool call，使用受控 JSON fallback：让模型输出 findings JSON，再由 runtime 用 evidence map / referenced files 校验后写入 memory。
  - fallback 写入必须带 `source=record_repair` 或等价 metadata，不能伪装成原生探索期工具发现。

QualityGate repair：

- `analysisQualityGate()` 保持 `note_finding` 缺失 / 不足为失败。
- `insightGateEvaluator()` 或 Pipeline gate 需要把这类失败原因识别为 `record_repair` 动作。
- `PipelineStrategy` 增加可插入 repair stage；当 gate action 为 `record_repair` 时，执行 record-only stage，再重新评估 gate。
- repair 最多 1-2 轮；仍不足时标记为 `needs_evidence_repair` 或 `degraded_no_findings`，不要 full analyze retry。

### 方向 B：Phase Chain 收窄与状态门控

`SCAN`：

- 当前 deterministic snapshot 已包含 file collection、AST、call graph、dependency graph 和 target summary。
- LLM `SCAN` 如果只是重新概览项目，价值低且浪费预算。
- 计划改为轻量 “briefing / plan seed” 或并入 `EXPLORE` 开场，不再单独消耗大量工具预算。

`EXPLORE`：

- 保留，负责发现候选模式和关键路径。
- 继续允许 opportunistic `note_finding`。
- 不负责保证最终结构化 finding 数量。

`VERIFY`：

- 保留，但收窄为证据核验阶段。
- 只补读少量关键文件、确认路径 / 行号 / 调用链。
- 不应继续泛化搜索或重新做项目探索。

`RECORD`：

- 升级为独立资源阶段。
- 目标是把已有探索证据结构化为 `note_finding`。
- 不读取新代码，不做新搜索。

`SUMMARIZE`：

- 保留，但只在状态允许时执行：
  - 至少有足够 `note_finding`。
  - 或明确进入 `degraded_no_findings` / `needs_evidence_repair` 状态。
- 取消、timeout、abort 后不能继续 forced summary。

Full analyze retry：

- 只保留给真正分析质量不足的情况，例如分析过短、文件引用不足、拒答、结构缺失。
- 对 `note_finding` 缺失 / 不足，不再 full analyze retry，改走 record-only repair。

## 分阶段计划

### Wave 9A：AlembicAgent producer 修复

状态：总控功能验收部分通过，进入 Wave 9A2 补齐

目标：

- 在 `AlembicAgent` 中落地 record-only 阶段、QualityGate repair 动作和阶段链路收窄。

范围：

- `src/agent/context/exploration/**`
- `src/agent/runtime/**`
- `src/agent/prompts/insight-gate.ts`
- `src/agent/strategies/PipelineStrategy.ts`
- `src/external/ai/providers/DeepSeekProvider.ts` 或 provider option / model config 周边
- 相关 unit tests

任务：

- 增加 record-only / record-repair 的显式配置：max rounds、timeout、token budget、allowed tools、fallback policy。
- 保留探索期 opportunistic `note_finding`。
- 将 `RECORD` 阶段变成短小独立记录阶段；进入该阶段后不再允许探索工具。
- 在 QualityGate 中区分：
  - `analysis_retry`：分析质量不足。
  - `record_repair`：分析质量足够但 `note_finding` 缺失或不足。
  - `degrade`：无法恢复。
- 在 `PipelineStrategy` 中支持 record repair 后重新评估 gate。
- 为 DeepSeek V4 / 不支持 required tool_choice 的 provider 增加 record-only 稳定路径；必要时实现受控 JSON fallback + evidence validation。
- 修复取消 / timeout 后仍继续 forced summary / compact 的边界，至少保证 record repair 不在 abort 后继续写入。
- 增加 tests 覆盖：
  - missing `note_finding` 触发 record repair，不 full analyze retry。
  - insufficient `note_finding` 只补缺口。
  - record-only 阶段不暴露 code / graph / terminal 等探索工具。
  - provider 不能强制 tool call 时 fallback 只能写入通过 evidence validation 的 finding。
  - abort / timeout 后不写入 finding、不误计完成。

文档动作：

- 在 `docs/AlembicAgent/` 新建执行记录。
- 从本文“回填区”挂回完成范围、提交 hash、验证命令、验证结果、遗留风险。
- 不提交 AlembicWorkspace，由总控窗口统一提交。

建议验证命令：

```text
npm run build
npm run test
npm run lint
git diff --check
```

如仓库存在更精确的 targeted vitest，可优先补充：

```text
npm run test -- InsightGate
npm run test -- PipelineStrategy
npm run test -- ExplorationStrategies
npm run test -- AgentRuntime
```

### Wave 9A2：AlembicAgent 阶段链路与状态门控补齐

状态：已完成，总控验收通过

目标：

- 补齐 Wave 9A 未覆盖的第二方向：`SCAN` 弱化、`VERIFY` 收窄、`SUMMARIZE` 状态门控，以及 abort / timeout 下不继续 forced summary 的边界。

总控验收结论：

- Wave 9A 的 record-only repair 主链路通过：`record_repair` action、独立 repair stage、memory-only tool guard、validated JSON fallback 和 targeted tests 都已落地。
- 但 `src/agent/context/exploration/ExplorationStrategies.ts` 未变更，`STRATEGY_ANALYST` 仍保持 `SCAN -> EXPLORE -> VERIFY -> RECORD -> SUMMARIZE` 原链路和原 transition；`AgentRuntime.#finalize()` 也没有新增 abort / timeout / degraded 状态下的 forced summary 门控。
- 因此不能直接进入 `Alembic` consumer 接入，否则下游会消费一个只完成 record repair、未完成阶段链路优化的上游语义。
- Wave 9A2 已补齐上述缺口并通过总控验收：`SCAN` 改为 no-tool briefing / plan seed，`VERIFY` 增加 evidence-only guard，forced summary suppression 覆盖 abort、stage timeout、`degraded_no_findings` 和 record repair degraded；总控复跑 targeted tests、`build:check`、`npm run check` 和 `git diff --check` 均通过。

范围：

- `src/agent/context/exploration/ExplorationStrategies.ts`
- `src/agent/runtime/AgentRuntime.ts`
- `src/agent/strategies/PipelineStrategy.ts`（仅在需要补状态传播时改）
- `src/agent/runtime/DiagnosticsCollector.ts` 或相关诊断类型（仅在需要表达 abort / timeout / degraded 状态时改）
- 相关 unit tests

任务：

- 弱化 `SCAN`：不要让 LLM 重复 deterministic snapshot 已经完成的项目概览；可改为轻量 briefing / plan seed，或把其预算和 transition 收窄到只生成探索计划。
- 收窄 `VERIFY`：明确只核验证据路径、行号、调用关系和 referenced files，不继续泛化搜索或重新探索。
- 保持 `RECORD` 为独立记录阶段，并与 Wave 9A 的 `quality_gate_record_repair` 语义一致：不读取新代码、不搜索、不进终端。
- 增加 `SUMMARIZE` 状态门控：取消、timeout、abort、`degraded_no_findings`、record repair 未完成时，不再触发 forced summary 或把无证据总结写成正常完成。
- 确保 event / diagnostics 中能区分：`analysis_retry`、`record_repair`、`degraded_no_findings`、`aborted`、`timeout`。
- 增加 tests 覆盖：
  - analyst strategy 的 `SCAN` 不再允许高预算探索。
  - `VERIFY` transition 不会重新开放泛化探索。
  - abort / timeout 后 `#finalize()` 不调用 forced summary。
  - `degraded_no_findings` 不进入 producer / normal summary。

文档动作：

- 在 `docs/AlembicAgent/` 新建或续写执行记录，建议命名为 `alembic-agent-phase-chain-state-gating-wave-9a2-2026-05-20.md`。
- 从本文“回填区”挂回完成范围、提交 hash、验证命令、验证结果、遗留风险。
- 不提交 AlembicWorkspace，由总控窗口统一提交。

建议验证命令：

```text
npm run build:check
npm run test -- test/evidence-recording-phase-chain.test.ts
npm run test -- ExplorationStrategies
npm run test -- AgentRuntime
npm run check
git diff --check
```

### Wave 9B：Alembic consumer 接入与小范围回归

状态：已完成，总控验收通过

目标：

- 让 `Alembic` 消费新的 `@alembic/agent` record / repair 语义，并验证 bootstrap dimension report、JobStore、report payload 不误计。

范围：

- `lib/workflows/capabilities/execution/internal-agent/**`
- Job / report / efficiency / status persistence 相关代码
- `package-lock` 仅在本地 file dependency 需要刷新时更新

任务：

- 确认 `@alembic/agent` 本地依赖指向 Wave 9A2 提交。
- 接入新的 gate action / repair status / degraded status。
- 确保 dimension timeout / child-run-error / cancel 不写成正常 completed。
- 确保 `workingMemoryDistilled.keyFindings`、analysis findings、report status 与 Job summary 一致。
- 增加小范围 fixture / mock provider / dry-run 回归，先不依赖真实 DeepSeek。
- 只有用户再次确认外部 AI 数据发送后，才对 `BiliDili` 执行真实单维度复测。

文档动作：

- 在 `docs/Alembic/` 新建执行记录。
- 从本文“回填区”挂回完成范围、提交 hash、验证命令、验证结果、遗留风险。

建议验证命令：

```text
npm run build:check
npm run test -- --runInBand
npm run lint:repo-boundary
git diff --check
```

如 test 命令不支持参数，按仓库 `AGENTS.md` 和 `package.json` 改用等价 targeted 命令。

### Wave 9C：Dashboard 状态展示

状态：已完成，总控验收通过

目标：

- 如果后端新增 `record_repair`、`needs_evidence_repair`、`degraded_no_findings`、record-only efficiency 等字段，Dashboard 负责显示真实状态。

范围：

- API client / job view / reports view / bootstrap progress UI。

任务：

- 消费 Alembic 后端已经落地的事件 / `dimensionStats` / Job payload，不私造字段。
- 显示 `record_repair_incomplete`、`degraded_no_findings`、`timeout`、`blocked`、`aborted`、`error` 等非正常状态，让用户区分“完成”“取消”“失败”“证据修复中”“证据不足降级”。
- 确认 Job 数字卡、任务列表、候选入口、报告 / progress 视图不会把上述状态归为正常完成。
- 保留 record-only / efficiency / diagnostics 的可读信息；如果当前 UI 没有合适位置，先在任务详情或报告详情中展示，不新增后端决策。
- 不在 Dashboard 实现 Agent 决策，不改 Alembic 后端。

文档动作：

- 在 `docs/AlembicDashboard/` 新建执行记录，并从本文“回填区”挂回完成范围、提交 hash、验证命令、验证结果、遗留风险。

建议验证命令：

```text
npm run build
npm run check
git diff --check
```

若 Dashboard 仓库有更精确的 targeted frontend / unit 命令，应补充覆盖 Jobs、reports 或 progress 状态显示。

调度补充：

- 用户在 Wave 9C 启动后反馈 DeepSeek L4 compact 仍存在协议错误：`Messages with role 'tool' must be a response to a preceding message with 'tool_calls'`。
- 总控判断该问题归属 `AlembicAgent` runtime / provider transcript normalization，不属于 Dashboard 或 Alembic consumer。
- `AlembicDashboard` Wave 9C 已完成并通过总控验收，下一步插入 `AlembicAgent` Wave 9A3 修复 L4 compact 协议合法性。
- Wave 9A3 已完成并通过总控验收；`BiliDili` 真实 cold-start / rescan 仍等待用户确认真实项目外部 AI 数据发送或替代安全路线。

总控验收结论：

- Dashboard 只消费后端真实 payload 中已有的 `status`、`action`、`qualityGate.action`、`diagnostics.gateFailures`、`diagnostics.timedOutStages`、`degraded` 和 `efficiency.cancelReason`，没有在前端私造 Agent 决策。
- Jobs 统计卡和状态筛选通过 `getJobBucketStatus()` 把 evidence failure 从 `completed` 桶挪到 `failed` 桶；候选入口会避开失败类非正常状态。
- Bootstrap progress 任务卡能从 task result 识别 evidence issue，session 结束态包含 `failed` / `aborted` / `cancelled`。
- Signal reports 已展示非正常 dimension 状态摘要，并保留 raw JSON 追踪 diagnostics。
- 总控复跑 `npm run build`、`git diff --check` 通过；`npm run check` 失败原因是该仓库没有配置 `check` script，不能记录为通过。

### Wave 9A3：AlembicAgent L4 compact 协议修复

状态：已完成，通过总控验收

目标：

- 修复 DeepSeek L4 compact 的 Chat Completions 协议错误，保证 compact 不再发送孤立 `tool` message，并防止 compact 失败反复触发继续放大 token 消耗。

问题事实：

- 真实运行多次出现 DeepSeek 协议错误：`Messages with role 'tool' must be a response to a preceding message with 'tool_calls'`。
- `AlembicAgent/src/agent/context/ContextWindow.ts` 的 `compactL4()` 当前直接用 `this.#messages.slice(-6)` 作为 summary LLM 的 `messages`，可能从 `tool` message 开始，或保留 tool result 但丢失对应 assistant `tool_calls`。
- 这会导致 L4 compact 调用 400，compact 失败后上下文继续膨胀，进一步放大 token 消耗。

范围：

- `AlembicAgent/src/agent/context/ContextWindow.ts`
- `AlembicAgent/src/agent/runtime/BudgetController.ts`
- `AlembicAgent/src/external/ai/transport/DeepSeekTransport.ts` 或 provider preflight / message normalization 周边
- 相关 tests

任务：

- 为 L4 compact 构造合法消息视图：最近消息切片不能以孤立 `tool` 开头，不能保留缺少前置 assistant `tool_calls` 的 tool result。
- 如果无法保留完整 assistant(tool_calls)+tool results 回合，应把 tool result 降级为普通 user summary 文本，而不是继续用 `role: "tool"`。
- 在 DeepSeek transport / provider preflight 增加防线：发送前发现孤立 tool message 时，拒绝或归一化为合法消息，并记录 diagnostics。
- compact 失败后必须进入可控降级：本轮不要反复触发 L4 compact，不继续扩大 token 浪费；后续可再按阈值和冷却策略尝试。
- 不修改 Alembic consumer、Dashboard UI、BiliDili 业务代码。

验证命令：

```text
npm run build:check
npm run test -- ContextWindow
npm run test -- BudgetController
npm run test -- DeepSeekTransport
npm run check
git diff --check
```

如测试文件名不同，按仓库现有 test 命令选择等价 targeted tests；必须覆盖：

- `compactL4()` recent slice 从 `tool` message 开始时不会发送非法 messages。
- assistant `tool_calls` 被裁掉但 tool result 保留时，会归一化为合法 summary input。
- DeepSeek preflight 能拦截或修正孤立 tool message。
- L4 compact 失败后不会在同一压力周期反复调用。

文档动作：

- 在 `docs/AlembicAgent/` 新建执行记录。
- 从本文“回填区”挂回完成范围、提交 hash、验证命令、验证结果、遗留风险。

### Wave 9A4：AlembicAgent L4 Memory Package 稳固

状态：已完成，已通过总控验收

目标：

- 把 L4 从“压缩 raw Chat Completions transcript”升级为“压缩结构化运行记忆包”，避免 raw message、tool call、tool result、阶段控制消息和普通对话消息混在一起被 `slice()` 打断。
- 保留 Wave 9A3 的 provider transcript normalization 作为最后防线，但不让它继续承担 L4 的主语义。

代码事实：

- `ContextWindow.compactL4()` 当前仍以 `this.#messages` 的最近切片为主输入；9A3 已做合法化，但输入边界仍是 raw transcript。
- `ActiveContext.distill()` 已能产出 `keyFindings`、`toolCallSummary`、`stats`、`plan`、`totalObservations`、`compressedCount`，可作为 L4 memory package 的稳定来源。
- `EvidenceCollector.build()` 已有 `evidenceMap`、`explorationLog`、`negativeSignals`，可作为 evidence refs / tool evidence 摘要来源。
- `AgentRuntime.#callLLM()` 现在只把 provider 传给 `BudgetController.executeL4IfPending()`，L4 执行点拿不到足够结构化上下文；需要重新调整 L4 输入边界或注入 memory package builder。

任务：

- 新增或等价实现 `buildL4MemoryPackage()`：从 `ActiveContext` / evidence map / key findings / recent text / phase diagnostics 组装结构化包，至少包含：
  - 任务目标。
  - 当前阶段 / phase / stage 状态。
  - 已确认发现。
  - 证据引用、文件路径、行号。
  - 工具结果摘要。
  - 未解决问题。
  - 最近关键对话。
  - 失败 / 降级状态。
- L4 不再直接压缩 raw `this.#messages.slice(...)` 作为主输入。raw transcript 只能作为补充来源，进入 L4 前必须先序列化成纯文本或结构化字段。
- provider transcript normalization 保留为最后防线；不得把它作为 L4 主逻辑，也不得让 provider 防线定义 memory package 语义。
- 增加 summary validation：至少校验 evidence refs、finding ids / finding 内容、阶段状态、失败 / 降级状态没有在摘要中丢失；无法校验时标记 L4 failed / degraded，不写入普通成功摘要。
- L4 压缩结果应写成 typed memory summary，例如 `[[L4 Memory Summary]]` 或等价内部类型 / metadata；如果底层 provider 仍需要投影成 user message，内部状态必须保留 summary 类型和来源，不要把它伪装成普通用户消息继续混在对话里。
- 保持 9A3 约束：任何情况下不得发送孤立 `tool` message；compact 失败不得在同一压力周期反复触发。
- 增加预算硬止损：当 session budget 已明显超限、L4 compact / record repair 失败或 retry 叠加导致继续运行只会扩大浪费时，必须把当前维度标记为 degraded / failed / timeout 等明确状态，跳过或中止当前维度，不继续无上限奔跑。
- 增加取消 / abort 对 L4 的门控：取消后不得继续写入 L4 summary；in-flight compaction / LLM 调用如果不能立刻取消，也必须在返回后识别 run 已取消并丢弃结果，只记录 cancelled / aborted diagnostics。
- 不修改 `Alembic` consumer、`AlembicDashboard` UI、`AlembicPlugin` 或 `BiliDili` 业务代码。

验证命令：

```text
npm run build:check
npm run test -- ContextWindow
npm run test -- BudgetController
npm run test -- DeepSeekTransport
npm run test -- memory
npm run check
git diff --check
```

如测试名不同，按仓库现有命令选择等价 targeted tests；必须覆盖：

- L4 package builder 能从 ActiveContext findings、toolCallSummary、plan / phase 状态组装结构化包。
- L4 provider 输入不依赖 raw tool transcript；raw transcript 只能以纯文本 / 结构化字段进入。
- summary validation 能发现关键 evidence refs / finding / phase status 丢失，并阻止写入成功 summary。
- 写回的 L4 summary 带 typed marker / metadata，不被当成普通用户消息。
- session budget 超限、compact 失败、retry 叠加时会进入明确 degraded / failed / timeout 路径，不继续跑完整维度。
- 取消 / abort 后 L4 compact 结果不会写回上下文或 job summary。
- Wave 9A3 的 orphan tool normalization 与 cooldown 测试仍通过。

文档动作：

- 在 `docs/AlembicAgent/` 新建 `alembic-agent-l4-memory-package-wave-9a4-2026-05-20.md`。
- 从本文“回填区”挂回完成范围、提交 hash、验证命令、验证结果、遗留风险。

总控验收结论：

- 通过。`AlembicAgent` 提交 `c2d3b5316b28d4d750283c324a2fd2babaa221ce` 已把 L4 主输入从 raw transcript 切片改为结构化 memory package，raw transcript 只作为纯文本补充来源。
- L4 package builder、summary validation、typed `[[L4 Memory Summary]]` 写回、budget hard stop、abort 前门控和 in-flight result 丢弃均有 targeted tests 覆盖。
- 总控复跑 `npm run test -- ContextWindow BudgetController l4-memory-package AgentRuntime DeepSeekTransport memory`、`npm run build:check`、`git diff --check`、`npm run check` 均通过；`npm run check` 中 Biome 仍打印 21 个既有 warning，但命令返回 0。
- 功能完整性检查通过：L4 不再依赖 provider transcript normalization 作为主语义，provider 防线仅作为最后保护；取消后不写回 compaction 结果，超预算叠加 L4 failure 时能明确 hard stop，不继续无限消耗。

### Wave 9E：Alembic Job Progress 与 Efficiency Summary 收口

状态：已完成，已通过总控验收

目标：

- 把 Agent / bootstrap 真实运行状态稳定投影到 Alembic Job、Progress、summary 和 Dashboard 可消费 payload，避免页面误判“卡住”或把 cancel / timeout / child-run-error 当作正常完成。
- 把运行效率信号进入 job summary：tool calls、cache hit、forced summary、nudge / retry、record repair、L4 compaction / validation / hard stop、cancel reason、token / budget pressure。
- 为下一次 `BiliDili` 小范围真实复测提供可信观察面；在这之前不重新启动完整 cold-start。

范围：

- `Alembic` job / progress / bootstrap execution / JobStore / summary projection / Dashboard API payload。
- 需要读取 `AlembicAgent` Wave 9A4 回填和当前本地 `@alembic/agent` 版本，确认新的 L4 hard stop、abort、summary validation、diagnostics 能被 Alembic 观察或转换。
- 不修改 `AlembicDashboard` UI；若发现 payload 字段不足，先在 Alembic 后端稳定输出，Dashboard 继续观察，等 payload 稳定后再派前端消费。

任务：

- 修复 job progress stale：`activeTask`、`updatedAt`、stage heartbeat、retry / record repair / timeout / forced summary / L4 hard stop / cancel / abort 状态变化必须能反映在 job progress projection。
- 收紧 cancel / fail / timeout 分类：`cancelled`、`aborted`、`child-run-error`、hard timeout、`l4_compaction_failed_budget_exhausted` 不得进入普通 completed bucket，也不得只写 `Task completed`。
- 补齐效率 summary：把 tool calls、cache hit、forced summary、nudge、retry、record repair、L4 compaction / validation / hard stop、cancel reason、budget pressure 等稳定写入 job summary 或等价 diagnostics payload。
- 保持 Wave 9B / 9C 已有语义：`degraded_no_findings`、`record_repair_incomplete`、`timeout`、`blocked`、`aborted`、`error` 仍作为非正常完成或失败类状态向下游可见。
- 增加 targeted tests 或 fixtures，覆盖 stale progress、cancelled not completed、timeout / child-run-error not completed、efficiency metrics summary 非 0。

禁止事项：

- 不启动 `BiliDili` 完整 cold-start。
- 不修改 `BiliDili` 业务代码。
- 不把 Dashboard UI 当作状态修复入口；Dashboard 只消费 Alembic 稳定 payload。
- 不为了快速展示而新增静态 mock、空字段或无法从真实运行产生的数据。

验证命令：

```text
npm run build
npm run build:check
npm run test:unit -- test/unit/BootstrapDimensionConsumer.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts
git diff --check
```

如 Alembic 中已有更精确的 JobStore / progress / summary 测试文件，执行窗口应补充或替换为对应 targeted tests，并在回填中写明原因。

文档动作：

- 在 `docs/Alembic/` 新建 `alembic-agent-job-progress-efficiency-wave-9e-2026-05-20.md`。
- 从本文“回填区”挂回完成范围、提交 hash、验证命令、验证结果、遗留风险和是否需要后续 Dashboard 消费任务。

总控验收结论：

- 通过。`Alembic` 提交 `633ed228d1c0ba9cd04ef431dc4aadac18c3ac06` 已把非正常 dimension payload 路由到 failed task，保留 result payload，并把 progress freshness 和 diagnostics summary 暴露给 Jobs API。
- 总控复跑 `npm run build`、`npm run build:check`、`npm run test:unit -- test/unit/BootstrapEventEmitter.test.ts test/unit/BootstrapTaskManager.test.ts test/unit/JobsRoute.test.ts test/unit/BootstrapDimensionConsumer.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts`、`npm run lint -- --diagnostic-level=error`、`git diff --check` 均通过。
- `npm run lint:repo-boundary` 仍失败在 18 个既有 DB boundary 命中，且本轮改动文件不在失败列表内；该问题继续作为独立历史债务，不阻塞 Wave 9E 验收。
- 功能完整性检查通过：后端 payload 已有 `progress.updatedAt`、`activeTaskUpdatedAt`、`activeTaskEventCount`、`activeTaskStatus` 和 summary diagnostics；但 `AlembicDashboard` 当前 Jobs 视图尚未消费这些新增 progress freshness 字段，因此需要进入 Wave 9F 前端消费补齐。

### Wave 9F：AlembicDashboard Progress Freshness 消费补齐

状态：已完成，已通过总控验收

目标：

- 让 Dashboard Jobs 页面真实消费 Alembic Wave 9E 新增的 progress freshness / active task payload，避免用户仍然只看到 job 自身 `updatedAt` 而误判后台卡住。
- 保持前端只消费后端稳定 payload，不在 Dashboard 中重新推断 Agent 决策或伪造运行状态。

范围：

- `AlembicDashboard` Jobs API type、Jobs view、evidence status / efficiency 展示周边。
- 只围绕 Alembic Wave 9E 新增字段和已有 summary diagnostics 展示补齐；不修改 Alembic 后端、不修改 BiliDili。

任务：

- 扩展 `DaemonJobRecord.progress` 类型，显式支持 `updatedAt`、`activeTaskStartedAt`、`activeTaskUpdatedAt`、`activeTaskEventCount`、`activeTaskStatus`。
- Jobs 页面运行状态优先使用 `progress.updatedAt` / `activeTaskUpdatedAt` 作为运行事件时间；保留 job `updatedAt` 作为 fallback。
- `ProgressBlock` 展示 active task status、event count、active task recent update 或等价紧凑信息，帮助判断 slow provider / long-running stage 是仍在更新还是已经 stale。
- 确认 `summary.diagnostics` 中的 `forcedSummary`、`cancelReason`、`timedOutStages`、`gateFailures`、status 计数能通过既有 issue / efficiency 展示被用户看见；若已有展示足够，不重复做复杂 UI。
- 增加前端 targeted tests 或 build check，避免类型漂移。

禁止事项：

- 不修改 `Alembic`、`AlembicAgent`、`AlembicPlugin`、`AlembicCore` 或 `BiliDili`。
- 不启动 BiliDili cold-start。
- 不把 Dashboard 做成 Agent 决策层；只展示后端 payload。

验证命令：

```text
npm run build
npm run check
git diff --check
```

若 `npm run check` 在 Dashboard 仓库仍不存在，执行窗口应记录 missing script，并至少保证 `npm run build` 和 `git diff --check` 通过；如有现成 test 命令，补充 targeted tests。

文档动作：

- 在 `docs/AlembicDashboard/` 新建 `alembic-dashboard-job-progress-freshness-wave-9f-2026-05-20.md`。
- 从本文“回填区”挂回完成范围、提交 hash、验证命令、验证结果、遗留风险和是否可以进入 BiliDili 小范围复测。

总控验收结论：

- 通过。`AlembicDashboard` 提交 `c1aa2c09e6f171192ccfc81a89f392fb5b5c0848` 已让 Jobs 页面消费 Alembic Wave 9E 新增 progress freshness 字段。
- `DaemonJobRecord.progress` 类型已支持 `updatedAt`、`activeTaskStartedAt`、`activeTaskUpdatedAt`、`activeTaskEventCount`、`activeTaskStatus`；Jobs 页面“最后事件”优先使用 active task 更新时间，其次用 progress 更新时间，最后回退 job `updatedAt`。
- `ProgressBlock` 已显示 active task status、event count、active task 最近更新时间和 progress 最近更新时间；summary diagnostics 已展示 status counts、issues、gate failures、timed out stages、forced summary 和 cancel reason。
- 总控复跑 `npm run build` 通过，`git diff --check` 通过；`npm run check` 仍失败在 Dashboard 仓库未配置 `check` script，与执行窗口回填一致。
- 功能完整性检查通过：Dashboard 只消费 Alembic 后端稳定 payload，不实现 Agent 决策；前端观察面已覆盖 Wave 9E 后端新增字段，可以进入 BiliDili 小范围复测前的用户数据策略确认。

### Wave 9D：BiliDili 小范围真实验证

状态：阻塞，等待用户确认外部 AI 数据发送或改用本地 / 测试 provider

目标：

- 用真实项目验证新链路不会误计完成、不全量重跑、不会修改业务代码。

任务：

- 只做单维度或 fixture 等价验证，不启动完整 cold-start。
- 验证 BiliDili 业务仓库前后干净。
- 验证缺 `note_finding` 时进入 record repair，不重跑完整 analyze。
- 验证取消后 job status、progress status、summary status 均为 `cancelled`。
- 验证 timeout / child-run-error 不计为 completed。

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicDashboard`<br>已完成 | Wave 9F 已通过总控验收：消费 Alembic Wave 9E 新增 progress freshness 字段，Jobs 页面显示 active task status、event count 和最近 active task update，避免前端仍用旧 job `updatedAt` 误判卡住；提交 `c1aa2c09e6f171192ccfc81a89f392fb5b5c0848`。 |
| `Alembic`<br>已完成 | Wave 9E 已通过总控验收：已修复 job progress stale、cancel / timeout / child-run-error 分类和 efficiency summary payload；提交 `633ed228d1c0ba9cd04ef431dc4aadac18c3ac06`。 |
| `AlembicAgent`<br>已完成 | Wave 9A4 已通过总控验收：提交 `c2d3b5316b28d4d750283c324a2fd2babaa221ce`，L4 已从 raw transcript 压缩升级为结构化 memory package 压缩，并补 package builder、summary validation、typed memory summary、budget hard stop 与 abort 后 in-flight result 丢弃。 |
| `BiliDili`<br>阻塞 | Wave 9D：等待用户确认真实项目外部 AI 数据发送或替代安全路线后，才能启动小范围真实复测。 |
| `AlembicCore`<br>无任务 | 当前优化属于 Agent runtime / Alembic consumer 状态，不需要 Core contract。若后续 repair status 下沉为共享 contract，再重新判断。 |
| `AlembicPlugin`<br>无任务 | 当前不涉及 Codex plugin marketplace、MCP skill 或 embedded runtime packaging。 |

## TODO / Backlog

| ID | 状态 | 类型 | 严重度 / 优先级 | 归属 | 事项 / TODO | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TODO-1 | 已完成 | 修复 | P0 | `AlembicAgent` | DeepSeek L4 compact 可能发送孤立 `tool` message，导致协议错误并放大 token 消耗。 | 是 | 总控验收通过：提交 `44dfe1360286e0c6d8074e07cea148ef679b13b2`；targeted tests、`build:check`、`check`、`git diff --check` 通过。 | `AlembicAgent` |
| TODO-2 | 阻塞 | 验证 | P0 | `BiliDili` | BiliDili 小范围真实复测。 | 是 | 技术前置 wave 已验收通过；等待用户确认真实项目外部 AI 数据发送或替代安全路线。 | `BiliDili` |
| TODO-3 | 已完成 | 设计 | P1 | `Alembic` | Agent 暴露新的 compact diagnostics / failure status 后，需要判断 Alembic consumer / summary payload 如何接入。 | 否 | Wave 9E 已通过总控验收：Alembic 已稳定 job summary / diagnostics payload。 | `Alembic` |
| TODO-4 | 已完成 | 修复 | P1 | `AlembicDashboard` | Jobs / Progress / Reports 显示 evidence repair、degraded、timeout、cancel 等非正常状态。 | 否 | 已通过总控验收，提交 `b2c62b5e01fad4a256f6815da63b0ef7f34bfe86`。 | `AlembicDashboard` |
| TODO-5 | 已完成 | 设计 / 修复 | P0 | `AlembicAgent` | L4 仍以 raw transcript 切片为主输入，设计边界不适合长跑 cold-start；需要升级为结构化 memory package 压缩。 | 是 | Wave 9A4 已通过总控验收：提交 `c2d3b5316b28d4d750283c324a2fd2babaa221ce`；targeted tests、`build:check`、`check`、`git diff --check` 通过。 | `AlembicAgent` |
| TODO-6 | 已完成 | 修复 / 可观测 | P1 | `Alembic` | Job 进度状态失真：API 长时间显示 `activeTask=architecture`、`updatedAt` 不变，但日志已进入 retry / timeout / forced summary，Dashboard 会误判卡住。 | 是 | Wave 9E 已通过总控验收：Jobs progress 新增 `updatedAt`、active task 时间戳、event count 和 status；前端消费进入 Wave 9F。 | `Alembic` |
| TODO-7 | 观察中 | 验证 | P1 | `Alembic` / `AlembicDashboard` / `BiliDili` | 取消 / 失败 / timeout 维度归类要收紧：`child-run-error`、hard timeout、cancelled 不能被当成正常完成或日志写成 `Task completed`。 | 是 | Wave 9B / 9C / 9E / 9F 已完成；等待用户数据策略确认后由 BiliDili 小范围复测验证。 | `BiliDili` |
| TODO-8 | 已完成 | 修复 | P0 | `AlembicAgent` | QualityGate retry 太浪费：报告质量合格但缺少 `note_finding` 时不应整段重跑，应进入 record repair / fallback finding。 | 是 | Wave 9A / 9A2 已通过总控验收，record repair 和 phase gating 已落地。 | `AlembicAgent` |
| TODO-9 | 已完成 | 修复 / 运行控制 | P0 | `AlembicAgent` | Token 预算没有硬止损：session budget 超 130% 仍继续跑，compact 失败和 retry 叠加时应降级、跳过维度或中止当前维度。 | 是 | Wave 9A4 已通过总控验收，runaway budget hard stop 已落地并有 `BudgetController` / `AgentRuntime` tests 覆盖。 | `AlembicAgent` |
| TODO-10 | 已完成 | 修复 | P0 | `AlembicAgent` | DeepSeek L4 compact 协议错误：孤立 `tool` message 导致 compact 失败并放大 token 消耗。 | 是 | Wave 9A3 已通过总控验收；Wave 9A4 继续修正 L4 输入边界。 | `AlembicAgent` |
| TODO-11 | 已完成 | 可观测 / UI | P1 | `Alembic` / `AlembicDashboard` | 效率指标没有进入 UI / job summary，且 progress freshness 字段尚未被 Jobs 页面消费。 | 否 | Wave 9F 已通过总控验收：Jobs 页面已消费 progress freshness 并展示 diagnostics。 | `AlembicDashboard` |
| TODO-12 | 已完成 | 修复 / 取消控制 | P0 | `AlembicAgent` | 取消后仍出现一次 L4 compact 日志：需要确认取消信号能及时打断或在返回后丢弃 in-flight LLM / compaction 结果，不只更新 job 状态。 | 是 | Wave 9A4 已通过总控验收，abort 前门控和 in-flight result 返回后丢弃已落地并有 tests 覆盖。 | `AlembicAgent` |

## 空闲窗口调度

| 窗口 | 当前调度 | 理由 | 是否发送 |
| --- | --- | --- | --- |
| `AlembicDashboard` | 已完成 | Wave 9F 已通过总控验收；当前不再派发，避免空转。 | 否 |
| `Alembic` | 已完成 | Wave 9E 已通过总控验收；当前不再派发，避免空转。 | 否 |
| `AlembicAgent` | 已完成 | Wave 9A4 已通过总控验收；当前不再派发，避免空转。 | 否 |
| `BiliDili` | 阻塞 | 等待用户确认外部 AI 数据发送或替代安全路线。 | 否 |
| `AlembicCore` | 无任务 | 当前问题属于 Agent runtime / provider transcript，不需要 Core contract。 | 否 |
| `AlembicPlugin` | 无任务 | 当前问题不涉及 Codex plugin、MCP skill、channel 或 runtime packaging。 | 否 |

## 当前执行顺序

只发送给：无

暂不发送给：

- `AlembicAgent`：Wave 9A4 已通过总控验收。
- `Alembic`：Wave 9E 已通过总控验收。
- `AlembicDashboard`：Wave 9F 已通过总控验收。
- `BiliDili`：等待用户确认真实项目外部 AI 数据发送或替代安全路线。
- `AlembicCore`：无任务。
- `AlembicPlugin`：无任务。

## 可复制分派提示词

发送给：无

当前不发送给：`AlembicDashboard`（已完成）、`Alembic`（已完成）、`AlembicAgent`（已完成）、`BiliDili`（阻塞，等待用户确认数据策略）、`AlembicCore`（无任务）、`AlembicPlugin`（无任务）。

```text
当前没有可发送给执行窗口的提示词；等待用户确认 BiliDili 真实项目外部 AI 数据发送策略或替代安全路线。
```

## 回填区

- `AlembicAgent`：
  - 状态：Wave 9A 已完成；Wave 9A2 已完成并通过总控验收；Wave 9A3 已完成并通过总控验收；Wave 9A4 已完成并通过总控验收。
  - 执行记录：`docs/AlembicAgent/alembic-agent-evidence-recording-phase-chain-wave-9a-2026-05-20.md`；`docs/AlembicAgent/alembic-agent-phase-chain-state-gating-wave-9a2-2026-05-20.md`；`docs/AlembicAgent/alembic-agent-l4-compact-transcript-wave-9a3-2026-05-20.md`；`docs/AlembicAgent/alembic-agent-l4-memory-package-wave-9a4-2026-05-20.md`。
  - 完成范围：QualityGate 已区分 `analysis_retry` / `record_repair` / `degraded_no_findings`；`PipelineStrategy` 已新增短 record repair stage、独立 budget、memory-only toolset、repair 后复验 gate；record repair prompt 已包含 DeepSeek / required tool_choice 不稳定时的 JSON fallback；fallback 仅写入通过既有 evidence path validation 的 finding，且只补缺口；timeout / abort 不写入 finding、不进入 producer；Runtime schema 和 ToolExecutionPipeline 已收窄 record repair 工具边界。
  - 提交 hash：`cce89937b972d6ce17a4b1ed6499ee76e5827001`。
  - 验证命令：`npm run build:check`；`npm run test -- test/evidence-recording-phase-chain.test.ts`；`npm run lint`；`npm run test`；`npm run build`；`npm run lint:agent-import-boundary`；`npm run lint:public-api-boundary`；`npm run lint:core-import-boundary`；`git diff --check`；`npm run check`。
  - 验证结果：总控复跑 `npm run build:check`、`npm run test -- test/evidence-recording-phase-chain.test.ts`、`git diff --check`、`npm run check` 均通过；`npm run lint` 仍打印 21 个既有 warning，但命令返回 0。
  - 总控验收结论：record repair 主链路通过；阶段链路收窄未完整完成，因为 `ExplorationStrategies.ts` 未变更，`SCAN / VERIFY / SUMMARIZE` 仍保留原阶段语义，`AgentRuntime.#finalize()` 也未新增 abort / timeout / degraded 下的 forced summary 门控。
  - 遗留风险：Alembic consumer 尚未接入 `record_repair` / `degraded_no_findings` 状态；fallback evidence validation 当前以既有路径匹配为主；尚未做真实 DeepSeek / BiliDili 单维度外部 AI 复测。
  - 下一步建议：先执行 Wave 9A2，再启动 `Alembic` Wave 9B。
  - Wave 9A2 完成范围：analyst `SCAN` 已改为 no-tool briefing / plan seed，并首轮转入 `EXPLORE`；`VERIFY` 新增 evidence-only tool guard，只允许聚焦 `code.read` / `code.outline`、聚焦实体 `graph.query` 和 memory evidence actions；`SUMMARIZE` / forced summary 增加 abort、stage timeout、`degraded_no_findings`、record repair degraded suppression；diagnostics 区分 `stage_timeout` cancel reason、timed-out stage 和 `degraded_no_findings` degraded 状态；补充 `ExplorationStrategies`、`AgentRuntime` 和 phase-chain tests。
  - Wave 9A2 提交 hash：`99f0a9f38a79b3cd1504dc2511d06f0a56e9e5c3`。
  - Wave 9A2 验证命令：`npm run build:check`；`npm run test -- test/evidence-recording-phase-chain.test.ts`；`npm run test -- ExplorationStrategies`；`npm run test -- AgentRuntime`；`npm run check`；`git diff --check`。
  - Wave 9A2 验证结果：执行窗口回填通过；总控复跑 `npm run build:check`、`npm run test -- test/evidence-recording-phase-chain.test.ts`、`npm run test -- ExplorationStrategies`、`npm run test -- AgentRuntime`、`npm run check`、`git diff --check` 均通过。Biome 仍打印 21 个既有 warning，但命令返回 0。
  - Wave 9A2 总控验收结论：通过。阶段链路和状态门控已经形成真实可用闭环，可以启动 `Alembic` consumer 接入。
  - Wave 9A2 遗留风险：`Alembic` consumer 尚未接入新的 abort / timeout / degraded semantics；真实 DeepSeek / BiliDili 单维度外部 AI 复测仍等待下游接入和用户确认；`VERIFY` graph guard 若遇到 adapter 非标准实体字段，需要在 consumer / adapter 测试中补充映射。
  - Wave 9A2 下一步建议：总控验收后启动 `Alembic` Wave 9B，消费 `99f0a9f38a79b3cd1504dc2511d06f0a56e9e5c3`。
  - Wave 9A3 完成范围：新增 Chat Completions tool transcript normalization，完整 assistant `tool_calls` + tool result 回合继续保留，孤立 `tool` message、缺结果的 assistant tool call 和被切片打断的 tool transcript 会转为普通文本；`ContextWindow.compactL4()` 构造合法 summary input 并写回合法近期上下文；`DeepSeekTransport` / `DeepSeekProvider` 发包前增加 preflight normalization；`BudgetController` 在 L4 compact failure 后冷却一次 preflight，避免同一压力周期反复 compact。
  - Wave 9A3 提交 hash：`44dfe1360286e0c6d8074e07cea148ef679b13b2`。
  - Wave 9A3 验证命令：`npm run test -- ContextWindow`；`npm run test -- BudgetController`；`npm run test -- DeepSeekTransport`；`npm run build:check`；`npm run check`；`git diff --check`。
  - Wave 9A3 验证结果：执行窗口回填通过。`npm run test -- ContextWindow` 通过，1 个测试文件 / 2 个用例；`npm run test -- BudgetController` 通过，1 个测试文件 / 1 个用例；`npm run test -- DeepSeekTransport` 通过，1 个测试文件 / 2 个用例；`npm run build:check` 通过；`npm run check` 通过，完整测试 16 个文件 / 64 个用例通过，Biome 仍打印 21 个既有 warning 但命令返回 0；`git diff --check` 通过。
  - Wave 9A3 总控复跑：`npm run test -- ContextWindow`、`npm run test -- BudgetController`、`npm run test -- DeepSeekTransport`、`npm run build:check`、`npm run check`、`git diff --check` 均通过；`npm run check` 中 Biome 仍打印 21 个既有 warning，但命令返回 0。
  - Wave 9A3 总控验收结论：通过。`ContextWindow.compactL4()`、`DeepSeekTransport`、`DeepSeekProvider` 均有发包前 transcript normalization，孤立 `tool` message 和缺失结果的 assistant tool call 不再进入 Chat Completions payload；compact failure 后有 preflight cooldown，能避免同一压力周期反复触发 L4 compact。
  - Wave 9A3 遗留风险：preflight normalization 当前只在 AlembicAgent 内记录 warning；如果下游需要展示 compact normalization 次数或失败原因，需要再定义 Alembic / Dashboard 可消费 diagnostics；尚未执行真实 DeepSeek / BiliDili 单维度复测。
  - Wave 9A3 下一步建议：当前无需立即追加 Alembic / Dashboard diagnostics 消费；解除 BiliDili Wave 9D 的 compact 阻塞，但真实复测仍必须等待用户确认数据策略。
  - Wave 9A4 完成范围：新增 `buildL4MemoryPackage()` / `renderL4MemoryPackage()` / `validateL4Summary()` / `formatL4MemorySummary()`，L4 输入从 ActiveContext / evidence refs / key findings / tool call summary / phase diagnostics / recent text 组装结构化 memory package；raw transcript 只以纯文本字段作为补充，不再直接作为 provider 主输入；`ContextWindow.compactL4()` 写回 typed `[[L4 Memory Summary]]` marker 和 metadata；summary validation 阻止缺失 phase、finding、evidence 或 failure state 的摘要写成成功 summary；`BudgetController` 增加 package provider、abort gate、failure pressure tracking 和 runaway budget hard stop；`AgentRuntime` 注入 package 来源，并在 cancellation / hard stop 时停止主 LLM 或 forced summary。
  - Wave 9A4 提交 hash：`c2d3b5316b28d4d750283c324a2fd2babaa221ce`。
  - Wave 9A4 验证命令：`npm run test -- ContextWindow`；`npm run test -- BudgetController`；`npm run test -- l4-memory-package`；`npm run test -- AgentRuntime`；`npm run test -- DeepSeekTransport`；`npm run test -- memory`；`npm run test -- ContextWindow BudgetController l4-memory-package AgentRuntime DeepSeekTransport memory`；`npm run build:check`；`git diff --check`；`npm run check`。
  - Wave 9A4 验证结果：执行窗口回填通过。`ContextWindow` 1 个测试文件 / 4 个用例通过；`BudgetController` 1 个测试文件 / 3 个用例通过；`l4-memory-package` 1 个测试文件 / 2 个用例通过；`AgentRuntime` 1 个测试文件 / 4 个用例通过；`DeepSeekTransport` 1 个测试文件 / 2 个用例通过；`memory` 2 个测试文件 / 6 个用例通过；combined targeted tests 6 个文件 / 19 个用例通过；`npm run build:check`、`git diff --check`、`npm run check` 通过，完整测试 17 个文件 / 71 个用例通过，Biome 仍打印 21 个既有 warning 但命令返回 0。
  - Wave 9A4 总控复跑：`npm run test -- ContextWindow BudgetController l4-memory-package AgentRuntime DeepSeekTransport memory` 通过，6 个测试文件 / 19 个用例；`npm run build:check` 通过；`git diff --check` 通过；`npm run check` 通过，17 个测试文件 / 71 个用例，Biome 仍打印 21 个既有 warning 但命令返回 0。
  - Wave 9A4 总控验收结论：通过。L4 主输入已从 raw transcript 切片升级为结构化 memory package；summary validation、typed memory summary、provider 防线降级、runaway budget hard stop 和 cancel / abort 后 in-flight result 丢弃已经形成真实可用闭环。
  - Wave 9A4 遗留风险：未执行真实 DeepSeek / BiliDili 单维度复测，仍等待用户确认真实项目外部 AI 数据发送或替代安全路线；memory package 当前主要依赖 `ActiveContext.distill()`、runtime `toolCalls` 和 diagnostics，后续若 L4 执行点可稳定注入完整 `EvidenceCollector.evidenceMap`，可增强 evidence refs 来源；Alembic / Dashboard 尚未消费 L4 validation / hard stop 的细粒度计数或原因。
  - Wave 9A4 下一步建议：不要直接重跑 BiliDili；先执行 Alembic Wave 9E，修复 job progress stale、非正常状态分类和 efficiency summary payload，再进入小范围真实复测。
- `Alembic`：
  - 状态：Wave 9B 已完成并通过总控验收；Wave 9E 已完成并通过总控验收。
  - 执行记录：`docs/Alembic/alembic-agent-evidence-recording-phase-chain-wave-9b-consumer-2026-05-20.md`；`docs/Alembic/alembic-agent-job-progress-efficiency-wave-9e-2026-05-20.md`。
  - 完成范围：确认 `@alembic/agent` symlink 指向 `../AlembicAgent`，Agent HEAD 为 `99f0a9f38a79b3cd1504dc2511d06f0a56e9e5c3`；新增 bootstrap dimension run issue 归一化，覆盖 `timeout`、`blocked`、`aborted`、`error`、`degraded_no_findings`、`record_repair_incomplete`；session child result 不再只拦截 `error` / `aborted`；dimension consumer 对 degraded evidence run 不增加 candidate created、不挂 submitted candidate，并把非正常状态写入事件和 dimensionStats。
  - 提交 hash：`fd992047d7e998883284143b90c8321b2de25287`。
  - 验证命令：`git -C ../AlembicAgent rev-parse HEAD`；`npm run build`；`npm run build:check`；`npm run test:unit -- test/unit/BootstrapDimensionConsumer.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts`；`npm run lint:repo-boundary`；`git diff --check`。
  - 验证结果：Agent HEAD 确认为 `99f0a9f38a79b3cd1504dc2511d06f0a56e9e5c3`；`npm run build` 通过；`npm run build:check` 通过；targeted unit tests 2 个测试文件 / 8 个用例通过；`git diff --check` 通过；`npm run lint:repo-boundary` 失败在 18 个既有 DB boundary 命中，本轮改动文件不在命中范围。
  - 总控验收复跑：`git -C ../AlembicAgent rev-parse HEAD` 输出 `99f0a9f38a79b3cd1504dc2511d06f0a56e9e5c3`；`npm run build`、`npm run build:check`、`npm run test:unit -- test/unit/BootstrapDimensionConsumer.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts`、`git diff --check` 均通过；`npm run lint:repo-boundary` 仍失败在同一批 18 个既有 DB boundary 命中。
  - 总控验收结论：通过。`timeout`、`blocked`、`aborted`、`error` 会进入 error consumer；`degraded_no_findings` / `record_repair_incomplete` 会在 dimension consumer 中写入非正常 `status`、`reason`、`diagnostics`，并把 `candidateCount` / `created` 归零、禁止挂 submitted candidate，已形成下游 Dashboard 可消费的稳定 payload。
  - 遗留风险：`lint:repo-boundary` 既有失败项仍需独立清理；未执行真实 DeepSeek / BiliDili 单维度复测，仍等待用户确认外部 AI 数据发送或替代安全路线；Dashboard 若需要稳定枚举，应在 Wave 9C 消费 Alembic 后端 payload 后再判断是否下沉共享 contract。
  - 下一步建议：历史建议已执行；Wave 9E 已通过总控验收，进入 `AlembicDashboard` Wave 9F 消费 progress freshness 字段。
  - Wave 9E 完成范围：`BootstrapEventEmitter` 将 `timeout`、`blocked`、`aborted`、`error`、`degraded_no_findings`、`record_repair_incomplete`、`l4_compaction_failed_budget_exhausted` 等非正常 dimension payload 路由到 failed task；`BootstrapTaskManager` 为 session / task 增加 `updatedAt` 和 task `eventCount`，并在 failed task 保留 result payload；Jobs API progress 新增 `updatedAt`、`activeTaskStartedAt`、`activeTaskUpdatedAt`、`activeTaskEventCount`、`activeTaskStatus`；Jobs API summary 聚合 task diagnostics，包括 status 计数、issues、gateFailures、timedOutStages、degraded、forcedSummary、cancelReason。
  - Wave 9E 提交 hash：`633ed228d1c0ba9cd04ef431dc4aadac18c3ac06`。
  - Wave 9E 验证命令：`npm run build`；`npm run build:check`；`npm run test:unit -- test/unit/BootstrapEventEmitter.test.ts test/unit/BootstrapTaskManager.test.ts test/unit/JobsRoute.test.ts test/unit/BootstrapDimensionConsumer.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts`；`npm run test:unit -- test/unit/BootstrapEventEmitter.test.ts test/unit/BootstrapTaskManager.test.ts test/unit/JobsRoute.test.ts`；`npm run lint -- --diagnostic-level=error`；`npm run lint:repo-boundary`；`git diff --check`。
  - Wave 9E 验证结果：`npm run build` 通过；`npm run build:check` 通过；targeted unit tests 5 个测试文件 / 21 个用例通过；focused unit tests 3 个测试文件 / 13 个用例通过；`npm run lint -- --diagnostic-level=error` 通过；`git diff --check` 通过；`npm run lint:repo-boundary` 仍失败在 18 个既有 DB boundary 命中，本轮改动文件不在命中范围。
  - Wave 9E 总控复跑：`npm run build`、`npm run build:check`、`npm run test:unit -- test/unit/BootstrapEventEmitter.test.ts test/unit/BootstrapTaskManager.test.ts test/unit/JobsRoute.test.ts test/unit/BootstrapDimensionConsumer.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts`、`npm run lint -- --diagnostic-level=error`、`git diff --check` 均通过；`npm run lint:repo-boundary` 仍失败在同一批 18 个既有 DB boundary 命中。
  - Wave 9E 总控验收结论：通过。非正常 dimension payload 进入 failed task，failed task result 被保留，Jobs API 已暴露 progress freshness 和 summary diagnostics，后端观察面可作为 Dashboard 消费输入。
  - Wave 9E 遗留风险：`lint:repo-boundary` 既有 18 个 DB boundary 命中仍需独立清理；未启动 BiliDili 完整 cold-start，也未修改 BiliDili 业务代码；Dashboard 是否需要更细粒度展示 L4 validation / hard stop 字段，需要等总控验收 payload 稳定后判断。
  - Wave 9E 下一步建议：启动 `AlembicDashboard` Wave 9F，消费 `progress.updatedAt`、`activeTaskUpdatedAt`、`activeTaskEventCount`、`activeTaskStatus`；BiliDili 小范围真实复测继续等待用户确认数据策略。
- `AlembicDashboard`：
  - 状态：Wave 9C 已完成并通过总控验收；Wave 9F 已完成并通过总控验收。
  - 执行记录：`docs/AlembicDashboard/alembic-agent-evidence-recording-phase-chain-wave-9c-dashboard-2026-05-20.md`；`docs/AlembicDashboard/alembic-dashboard-job-progress-freshness-wave-9f-2026-05-20.md`。
  - 完成范围：新增 `src/utils/evidenceStatus.ts` 统一消费后端 payload 中的 `status`、`action`、`qualityGate.action`、`diagnostics.gateFailures`、`diagnostics.timedOutStages`、`degraded`、`efficiency.cancelReason` 等字段；扩展 API 类型以兼容 Jobs summary 和 bootstrap report dimension 的 `status` / `reason` / `diagnostics` / `qualityGate` / `efficiency` / `error`；Jobs 页面新增证据/任务状态徽标和详情，统计卡与状态筛选不再把失败类非正常完成计入普通完成，候选入口避开失败类非正常状态；Bootstrap progress 从 `task.result` 识别非正常状态并显示对应卡片、徽标和原因，同时把 session `failed` / `aborted` / `cancelled` 视为结束态；Signal reports 的 bootstrap detail 展示非正常 dimension 状态摘要，并保留 raw JSON diagnostics。
  - 提交 hash：`b2c62b5e01fad4a256f6815da63b0ef7f34bfe86`。
  - 验证命令：`npm run build`；`npm run check`；`git diff --check`。
  - 验证结果：`npm run build` 通过，完成 `tsc && vite build`，Vite 仍提示 vendor chunk 超过 1500 kB 的既有体积 warning；`npm run check` 未通过，原因是 Dashboard `package.json` 未配置 `check` script；`git diff --check` 通过。
  - 总控验收复跑：`npm run build` 和 `git diff --check` 通过；`npm run check` 仍失败在 missing script。
  - 总控验收结论：通过。Jobs 统计、筛选和候选入口已经区分 evidence failure；Progress / Reports 能显示非正常状态和 diagnostics，不在前端实现 Agent 决策。
  - 遗留风险：未执行真实 DeepSeek / BiliDili 单维度复测；DeepSeek L4 compact transcript 协议错误仍归属 `AlembicAgent` provider transcript normalization；如果运行时 report 仍未下发 dimension `status` / `diagnostics` 字段，Dashboard 只能展示已有 raw payload，本轮已兼容 Alembic Wave 9B 的 `dimensionStats` 结构。
  - 下一步建议：历史建议已执行；等待总控验收 Wave 9F 后，再决定是否进入 BiliDili 小范围真实复测。
  - Wave 9F 完成范围：扩展 Jobs API type，支持 `progress.updatedAt`、`activeTaskStartedAt`、`activeTaskUpdatedAt`、`activeTaskEventCount`、`activeTaskStatus`；Jobs 页面“最后事件”优先使用 active task 更新时间，其次使用 progress 更新时间，最后回退 job `updatedAt`；`ProgressBlock` 展示 active task status、event count、active task 最近更新时间和 progress 最近更新时间；新增 summary diagnostics 区块，展示 `statuses`、`issues`、`gateFailures`、`timedOutStages`、`forcedSummary`、`cancelReason`。
  - Wave 9F 提交 hash：`c1aa2c09e6f171192ccfc81a89f392fb5b5c0848`。
  - Wave 9F 验证命令：`npm run build`；`npm run check`；`git diff --check`。
  - Wave 9F 验证结果：`npm run build` 通过，完成 `tsc && vite build`，Vite 仍提示 vendor chunk 超过 1500 kB 的既有体积 warning；`npm run check` 未通过，原因是 Dashboard `package.json` 未配置 `check` script；`git diff --check` 通过。
  - Wave 9F 总控复跑：`npm run build` 通过，`git diff --check` 通过；`npm run check` 仍失败在 missing script，与执行窗口回填一致。
  - Wave 9F 总控验收结论：通过。Jobs 页面最后事件已优先使用 active task freshness；progress 区块展示 active task status / event count / active task update / progress update；summary diagnostics 展示 status counts、issues、gate failures、timed out stages、forced summary 和 cancel reason。Dashboard 只消费后端 payload，不承接 Agent 决策。
  - Wave 9F 遗留风险：未执行真实 DeepSeek / BiliDili 单维度复测；进入 BiliDili 小范围真实复测前仍需用户确认真实项目外部 AI 数据发送或替代安全路线；如后续 Alembic 下沉更细粒度 L4 validation / hard stop metrics，可再按稳定 contract 增加专门可视化。
  - Wave 9F 下一步建议：不直接启动完整 BiliDili cold-start；等待用户确认真实数据发送策略，再做小范围复测。
- `BiliDili`：
  - 状态：阻塞，等待用户确认真实项目外部 AI 数据发送或替代安全路线。
- `AlembicCore`：
  - 状态：无任务。
- `AlembicPlugin`：
  - 状态：无任务。

## 总控验收要求

Wave 9A 回填后，总控必须检查：

- `note_finding` 缺失 / 不足不再触发完整 analyze retry。
- record repair 只使用已有 evidence，不重新读取项目代码。
- record repair 有独立 budget / timeout / allowed tools。
- DeepSeek V4 或不支持 required tool_choice 的 provider 有明确 fallback 或降级路径。
- QualityGate 仍然拒绝无证据 findings。
- 取消 / timeout / abort 后没有继续写入 finding 或 forced summary。

Wave 9B 回填后，总控必须检查：

- Alembic Job / progress / summary 状态不把 `cancelled`、`timeout`、`child-run-error` 归为 completed。
- Reports / JobStore / working memory distilled 的 findings 数量和来源一致。
- mock / fixture 小范围回归通过后，才讨论 BiliDili 真实复测。
