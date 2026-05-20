# AlembicAgent Evidence Recording Phase Chain Wave 9A

状态：已完成
执行窗口：AlembicAgent
日期：2026-05-20
对应总控文档：`docs/workspace/alembic-agent-evidence-recording-phase-chain-workspace-plan-2026-05-20.md`
提交：`cce89937b972d6ce17a4b1ed6499ee76e5827001`

## 完成范围

- 在 QualityGate 中把分析质量不足和结构化发现缺失拆成独立动作：
  - `analysis_retry`：分析文本、文件引用、结构或总体质量不足时仍回到 analyze。
  - `record_repair`：分析质量足够但 `memory.note_finding` 缺失或不足时进入短 repair。
  - `degraded_no_findings`：record repair 超时、abort 或补写仍不足时显式降级，不继续 producer。
- 在 `PipelineStrategy` 中实现 `record_repair` 执行链：
  - 生成 `quality_gate_record_repair` 短阶段。
  - 使用独立 budget：`maxIterations=3`、`timeoutMs=90000`、`maxTokens=2048`、独立 session token 上限。
  - 强制 `capabilities=[]`、`additionalTools=['memory']`、`disableTracker=true`、`toolChoiceOverride='auto'`。
  - repair 后重新评估同一个 gate，只有通过后才进入 producer。
- 增加 provider-aware fallback：
  - record repair prompt 明确 DeepSeek / required tool_choice 不稳定时可输出严格 JSON fallback。
  - PipelineStrategy 只把能匹配既有 `referencedFiles` / `evidenceMap` / finding evidence 的 fallback finding 写入 memory。
  - fallback 只补缺口数量，已满足时跳过，timeout / abort 不写入。
- 在 Runtime 工具 schema 和 ToolExecutionPipeline 增加 record-only 保护：
  - `AgentRuntime` 在 record repair 上下文也只暴露 memory 的 `note_finding` schema。
  - `recordRepairOnlyGate` 禁止 code / graph / terminal / knowledge / `memory.save`，只允许 `memory.note_finding`、`memory.recall`、`memory.get_previous_evidence`。
- 新增测试 `test/evidence-recording-phase-chain.test.ts`，覆盖：
  - missing `note_finding` 触发 `record_repair`。
  - 分析质量差时仍走 `analysis_retry`。
  - insufficient finding 只补缺口并复验 gate。
  - record repair 阶段只开放 memory，不开放探索工具。
  - timeout 后不写 finding、不进入 producer、不误计完成。

## 变更文件

- `src/agent/prompts/insight-gate.ts`
- `src/agent/strategies/PipelineStrategy.ts`
- `src/agent/runtime/AgentRuntime.ts`
- `src/agent/runtime/ToolExecutionPipeline.ts`
- `src/agent/runtime/index.ts`
- `test/evidence-recording-phase-chain.test.ts`

## 验证命令

```text
npm run build:check
npm run test -- test/evidence-recording-phase-chain.test.ts
npm run lint
npm run test
npm run build
npm run lint:agent-import-boundary
npm run lint:public-api-boundary
npm run lint:core-import-boundary
git diff --check
npm run check
```

## 验证结果

- `npm run build:check`：通过。
- `npm run test -- test/evidence-recording-phase-chain.test.ts`：通过，1 个文件 / 5 个测试。
- `npm run lint`：命令返回 0；输出中仍有 21 个既有 lint warning，本轮新增文件和改动文件已单独通过 Biome check。
- `npm run test`：通过，11 个文件 / 50 个测试。
- `npm run build`：通过。
- `lint:agent-import-boundary` / `lint:public-api-boundary` / `lint:core-import-boundary`：均通过。
- `git diff --check`：通过。
- `npm run check`：通过；包含 build:check、lint、边界脚本和全量测试。

## 遗留风险

- 本轮只在 AlembicAgent 内完成 producer 修复；`Alembic` 还未消费新的 `record_repair` / `degraded_no_findings` 语义。
- JSON fallback 的 evidence validation 当前以既有路径匹配为主，后续 Alembic consumer 接入时可继续把状态和来源写入 report payload。
- `npm run lint` 仍打印仓库既有 warning，但命令返回 0；本轮没有扩大 warning 集合。
- 尚未用真实 DeepSeek / BiliDili 单维度跑外部 AI 复测，需等 Wave 9B consumer 接入和用户确认数据发送策略。

## 下一步建议

- `Alembic` Wave 9B 接入 `@alembic/agent` 提交 `cce89937b972d6ce17a4b1ed6499ee76e5827001`，消费 repair / degraded 状态并做 mock 或 fixture 小范围回归。
- Alembic consumer 需要确认 JobStore、dimension report、working memory distilled 和 progress summary 不把 `degraded_no_findings`、timeout、cancel 误计为 completed。
- 后端 payload 稳定后，再让 Dashboard 观察 / 显示 record repair 与 degraded 状态。
