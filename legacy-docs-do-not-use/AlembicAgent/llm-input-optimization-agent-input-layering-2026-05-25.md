# LLM Input Optimization Agent Input Layering

日期：2026-05-25
窗口：`AlembicAgent`
任务包：`LLMI-P3-AGENT-INPUT-LAYERING`
状态：已完成，等待总控验收
提交：`bf0a2c2cb0c3d760817ac699e5f47d83e0e5b4d9`

## 窗口定位和仓库职责

- 当前窗口定位：`AlembicAgent` 执行窗口。
- 本轮目标仓库：`/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent`。
- 本轮职责：只负责 Alembic internal Agent 的 LLM 输入分层、stage profile、重复 prompt policy 收敛和 targeted tests。
- 明确不负责：不改 `AlembicCore`、`Alembic`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 或 `BiliDili` 源码；不做 Observation Ledger、prompt artifact 持久化、Dashboard UI、L4 compaction 或 full cold-start。

## 完成范围

- 新增 `src/agent/runtime/LLMInputAssembly.ts`，建立真实消费的 LLM input section assembly：
  - `identity`
  - `stagePolicy`
  - `toolContract`
  - `taskContext`
  - `evidenceContext`
  - `dynamicContext`
- `AgentRuntime` 在 provider call 前统一构建 `LLMInputAssembly`：
  - provider 实际收到追加的 ephemeral runtime input layer。
  - developer-visible `llm.input` 从同一份 assembly 投影。
  - `llm.input.metadata` 增加 `inputStageProfile`、`inputSectionIds`、`inputLayerAppended` 等可观测字段。
- `SystemPromptBuilder.injectBudget(...)` 按 tracker pipeline/stage 收敛预算注入：
  - Producer 使用 `Producer 轮次预算`，不再继承 Analyst 的探索 / 验证预算。
  - RECORD 直入场景使用结构化记录预算。
- `ExplorationStrategies` / `ExplorationTracker` / `NudgeGenerator` 补齐 `producer` pipeline type：
  - Producer tracker 默认识别为 `producer`。
  - Producer 进入 summarize 时输出候选生产总结，不再落到 bootstrap `dimensionDigest` 口径。
- 新增 `test/llm-input-layering.test.ts`，覆盖：
  - provider messages 和 `llm.input` 同时消费显式 input sections。
  - RECORD 阶段只暴露 `note_finding`，不注入 `code({ action ... })` / `graph({ action ... })` 探索要求。
  - Producer stage profile 和 Producer budget 不包含 Analyst 探索 / 结构化查询预算。
  - `SystemPromptBuilder` Producer 预算直接单测。
  - Producer tracker 默认 pipeline type。

## 真实代码证据

- Section assembly：`AlembicAgent/src/agent/runtime/LLMInputAssembly.ts`
- Runtime 消费：`AlembicAgent/src/agent/runtime/AgentRuntime.ts`
- 静态 / 动态 prompt 边界：`AlembicAgent/src/agent/runtime/SystemPromptBuilder.ts`
- Stage profile 基础类型：`AlembicAgent/src/agent/context/exploration/ExplorationStrategies.ts`
- Producer tracker / summarize 语义：`AlembicAgent/src/agent/context/ExplorationTracker.ts`、`AlembicAgent/src/agent/context/exploration/NudgeGenerator.ts`
- Public runtime export：`AlembicAgent/src/agent/runtime/index.ts`
- Targeted tests：`AlembicAgent/test/llm-input-layering.test.ts`

## 保留的保护点

- Static system prompt 仍通过 `systemPrompt` 传给 provider，runtime input layer 只作为每轮 ephemeral user message 追加，没有把每轮动态内容写回 static prompt。
- `dynamicContext` 从原先独立追加改为 assembly 的 `dynamicContext` section，仍不写入 `ContextWindow`。
- Tool schema 仍由 runtime 现有 tool registry / capability catalog 决定；RECORD 阶段只在已有 memory schema 时生成 direct `note_finding` schema。
- 未改变 ContextWindow tool result 原子性、BudgetController 预算 / L4 行为、Producer `evidenceMap` 和 existing findings 输入。

## 重复策略收敛

- Producer 的预算文案从 Analyst 探索预算中分离，避免 `探索阶段 / 结构化查询 / graph` 语义进入 Producer static prompt。
- RECORD 和 SUMMARIZE 的阶段规则进入 `stagePolicy` / `toolContract`，并通过 provider runtime layer 实际消费。
- `llm.input` 不再由 system prompt、dynamic context、messages、tools 各自散落格式化，而是从同一份 assembly 输出，重复和冲突可以通过 metadata / tests 定位。

## 验证命令和结果

| 命令 | 结果 |
| --- | --- |
| `npm test -- llm-input` | 通过，2 files / 10 tests |
| `npm test -- AgentRuntime SystemPromptBuilder` | 通过，1 file / 8 tests |
| `npm run typecheck` | 通过 |
| `npm run lint` | 通过 |
| `npm run lint:agent-import-boundary` | 通过 |
| `npm run lint:public-api-boundary` | 通过 |
| `npm run lint:core-import-boundary` | 通过 |
| `git diff --check` | 通过 |
| `npm test` | 通过，21 files / 101 tests |
| `git diff --cached --check` | 通过，提交前检查 |

## Alembic 知识状态

- Alembic prime 未返回本请求可用 Recipe / Guard 知识，本轮实现依据为 workspace 总控文档、研究文档、`AlembicAgent/AGENTS.md` 和真实代码。
- Alembic diagnostics 报告 plugin runtime pin mismatch；该问题归属 Plugin / Codex runtime 配置，不属于本轮 `AlembicAgent` 实现范围，未改。

## 未做事项

- 未做 Observation Ledger 完整替换。
- 未做 Alembic prompt artifact 持久化。
- 未改 Dashboard UI。
- 未改 Alembic daemon / JobStore / API。
- 未改 AlembicPlugin。
- 未启用或重写 L4 compaction。
- 未跑 full cold-start。

## 遗留风险

- Analyst / Producer 静态 prompt 中仍保留必要的领域指导；本轮通过 runtime input layer 和 Producer budget 先收敛真实消费边界，没有大幅重写成熟 prompt，后续若要进一步减少字面重复应基于 test-mode 证据逐段裁剪。
- Provider 实际输入新增一条 runtime layer user message，targeted tests 和全量单测已通过；仍建议由 `AlembicTest` 做最小 test-mode 复测，验证 retained `llm.input` section metadata 和真实 job process event 展示。

## 下一步建议

- 总控验收本提交后，创建 `AlembicTest` 最小 test-mode 复测单，验证真实 retained `llm.input` 是否包含 section metadata、Producer 不继承 Analyst budget、Record / Summarize tool contract 不回退。
- 下一波进入 Observation Ledger：把 raw observation dump 替换为结构化 evidence / observation ledger。
- 后续再进入 Alembic artifact / Dashboard 展示：持久化 redacted prompt artifact，并由 Dashboard 展示 artifact ref / 详情入口。
