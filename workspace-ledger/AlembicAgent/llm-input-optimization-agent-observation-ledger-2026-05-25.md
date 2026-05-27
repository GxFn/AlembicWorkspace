# LLM Input Optimization Agent Observation Ledger

日期：2026-05-25
窗口：`AlembicAgent`
任务包：`LLMI-P5-AGENT-OBSERVATION-LEDGER`
状态：已完成，等待总控验收
提交：`8970327d73bf6c01476a1aeb5384f014483b68dd`

## 窗口定位和仓库职责

- 当前窗口定位：`AlembicAgent` 执行窗口。
- 本轮目标仓库：`AlembicAgent`。
- 本轮职责：只负责 Alembic internal Agent 的 `ActiveContext` observation ledger、provider dynamic context 默认输入收敛和 targeted tests。
- 明确不负责：不改 `AlembicCore`、`Alembic`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 或 `BiliDili` 源码；不刷新 `dist`，不做 Alembic prompt artifact 持久化、Dashboard UI、L4 compaction 或 cold-start 集成验证。

## 完成范围

- `ActiveContext` 在压缩旧 observation 时同步生成 provider-facing `Observation Ledger` 投影。
- `ActiveContext.buildContext(...)` 不再默认渲染 raw `## 📂 之前的探索摘要`，改为结构化 `## Observation Ledger`。
- Ledger 覆盖并去重以下语义：
  - `evidence`
  - `readSet`
  - `searchSet`
  - `failureSet`
  - `nextHints`
- 保留 scratchpad confirmed findings 的最高优先级注入，`## 📌 已确认的关键发现` 仍在 ledger 前输出。
- raw observation / compressed summary 未删除，仍保留给 `distill()`、日志、后续 artifact 或开发者诊断；只是默认 provider dynamic context 不再消费 raw dump。
- provider input 侧增加 targeted 回归，证明 `LLMInputAssembly` 的 dynamic context section 实际收到 ledger，并且不含 `callId`、`startedAt`、`durationMs` 等 raw envelope 字段。

## 真实代码证据

- Ledger 数据结构与渲染：`AlembicAgent/src/agent/memory/ActiveContext.ts`
- 动态记忆入口：`AlembicAgent/src/agent/memory/MemoryCoordinator.ts`
- Provider input 消费链：`AlembicAgent/src/agent/runtime/AgentRuntime.ts`、`AlembicAgent/src/agent/runtime/LLMInputAssembly.ts`
- ActiveContext 单测：`AlembicAgent/test/ActiveContext.test.ts`
- Provider layer 回归：`AlembicAgent/test/llm-input-layering.test.ts`

## Ledger 边界

- Ledger 是 `ActiveContext.buildContext(...)` 的默认 LLM 输入投影，不是替代 raw tool result 的存储格式。
- `recordToolCall(...)` 记录 tool args，用于从 `code.read`、`code.search`、`graph`、`terminal` 等 observation 提取可读语义。
- `readSet` 以文件路径去重，兼容 `path` 和 batch `filePaths` / structured `files[]`。
- `searchSet` 以 pattern / glob / match 摘要去重，避免重复搜索词堆叠。
- `failureSet` 只暴露失败语义和简短原因，不暴露 raw envelope。
- `nextHints` 使用 tool envelope 的 `nextActionHint`，失败且无 hint 时生成窄口重试提示。
- JSON-like 失败文本会转成简洁 key/value 语义文本，并过滤 provider debug keys。

## Debug 字段收敛

默认 provider dynamic context 不再包含：

- `callId`
- `parentCallId`
- `startedAt`
- `durationMs`
- `timestamp`
- `diagnostics`
- `structuredContent`
- `_meta`

说明：这些字段仍可存在于 raw envelope、distill summary 或诊断路径；本轮只从 provider 默认 dynamic context 移除。

## Scratchpad / Evidence 保留

- `note_finding` 写入的 scratchpad 仍由 `noteKeyFinding(...)` 保存，不参与 observation ledger 压缩。
- `buildContext(...)` 仍先按 importance 输出 `## 📌 已确认的关键发现`，再输出 `## Observation Ledger`。
- `memory-note-finding` / `evidence-recording-phase-chain` 链路未改，验证中 `ActiveContext ContextWindow evidence-recording` 组合测试通过。

## 验证命令和结果

| 命令 | 结果 |
| --- | --- |
| `npm test -- llm-input` | 通过，2 files / 11 tests |
| `npm test -- ActiveContext ContextWindow evidence-recording` | 通过，3 files / 16 tests |
| `npm run typecheck` | 通过 |
| `npm run lint` | 通过 |
| `npm run lint:agent-import-boundary` | 通过 |
| `npm run lint:public-api-boundary` | 通过 |
| `npm run lint:core-import-boundary` | 通过 |
| `git diff --check` | 通过 |

## Alembic 知识状态

- Alembic prime 未返回本请求可用 Recipe / Guard 知识，本轮实现依据为 workspace 总控文档、研究文档、`AlembicAgent/AGENTS.md` 和真实代码。
- Alembic diagnostics 仍报告 plugin runtime pin mismatch；该问题归属 Plugin / Codex runtime 配置，不属于本轮 `AlembicAgent` 实现范围，未改。

## 未做事项

- 未刷新 `AlembicAgent/dist`；该项仍归入 `GTODO-2026-05-25-002`。
- 未做 Alembic prompt artifact 持久化。
- 未改 Dashboard UI。
- 未改 Alembic daemon / JobStore / API。
- 未改 AlembicPlugin。
- 未启用或重写 L4 compaction。
- 未跑 full cold-start 或 package/runtime 集成验证。

## 遗留风险

- Ledger 当前只覆盖 ActiveContext 已压缩的旧 observation；最近滑动窗口内尚未压缩的 raw observation 仍按既有链路留在消息 / tool result context 中，本轮未改变该边界。
- `distill().toolCallSummary` 仍保留原压缩摘要，后续 prompt artifact 或开发者诊断若直接展示 distill，需要再做 artifact-specific redaction。
- `MemoryCoordinator.createDimensionScope(...)` 对 `maxRecentRounds=0` 仍会按既有 `|| 3` 逻辑回退，本轮没有扩展该 API；测试中 provider 链路通过实际压缩触发 ledger。

## 下一步建议

- 总控代码侧验收本提交后，派发 `AlembicTest` 做最小 test-mode 复测，验证 retained `llm.input` / provider message 中 ledger 和 debug 字段收敛。
- 后续 Wave 4 由 `Alembic` / `AlembicDashboard` 承接 prompt artifact / process event bridge / 展示入口。
- package/runtime 或 cold-start 集成验证前，先处理 `AlembicAgent/dist` 刷新门禁。
