# AlembicAgent L4 Memory Package Wave 9A4

状态：已完成，待总控验收
执行窗口：AlembicAgent
执行日期：2026-05-20
关联总控计划：`docs/workspace/alembic-agent-evidence-recording-phase-chain-workspace-plan-2026-05-20.md`

## 完成范围

- 新增 `buildL4MemoryPackage()` / `renderL4MemoryPackage()` / `validateL4Summary()` / `formatL4MemorySummary()`，把 L4 输入从 raw Chat Completions transcript 改为结构化运行记忆包。
- Memory package 从 `ActiveContext.distill()`、phase / stage 状态、tool call summary、diagnostics、recent text、evidence refs 和 key findings 组装；raw messages 只以纯文本 recent conversation 形式进入，不再作为 L4 主输入。
- `ContextWindow.compactL4()` 接收 memory package 与 abort signal，L4 provider 只看到单条结构化 package prompt，不再发送 `tool` role 或 assistant `toolCalls` transcript。
- L4 summary 写回时带 `[[L4 Memory Summary]]` marker 和 metadata：`kind=l4_memory_summary`、`source=l4_memory_package/v1`，不再伪装成普通用户消息。
- 增加 summary validation，校验 phase / stage status、关键 finding、evidence refs、failure / degraded state；校验失败时记录 L4 failure，不写入成功 summary。
- `BudgetController` 增加 L4 memory package provider、abort gate、failure pressure tracking 和 runaway budget hard stop；L4 失败且 session 压力明显超限时返回明确 hard stop。
- `AgentRuntime` 注入 ActiveContext / diagnostics / recent projected messages / toolCalls 作为 L4 package 来源，并在 hard stop 或 cancellation 时停止继续主 LLM / forced summary。
- 保留 Wave 9A3 的 orphan tool normalization 和 compact failure cooldown 作为 provider 最后防线，并补充回归测试。

## 提交

- AlembicAgent 提交 hash：`c2d3b5316b28d4d750283c324a2fd2babaa221ce`

## 验证命令

```text
npm run test -- ContextWindow
npm run test -- BudgetController
npm run test -- l4-memory-package
npm run test -- AgentRuntime
npm run test -- DeepSeekTransport
npm run test -- memory
npm run test -- ContextWindow BudgetController l4-memory-package AgentRuntime DeepSeekTransport memory
npm run build:check
git diff --check
npm run check
```

## 验证结果

- `npm run test -- ContextWindow` 通过：1 个测试文件 / 4 个用例。
- `npm run test -- BudgetController` 通过：1 个测试文件 / 3 个用例。
- `npm run test -- l4-memory-package` 通过：1 个测试文件 / 2 个用例。
- `npm run test -- AgentRuntime` 通过：1 个测试文件 / 4 个用例。
- `npm run test -- DeepSeekTransport` 通过：1 个测试文件 / 2 个用例。
- `npm run test -- memory` 通过：2 个测试文件 / 6 个用例。
- `npm run test -- ContextWindow BudgetController l4-memory-package AgentRuntime DeepSeekTransport memory` 通过：6 个测试文件 / 19 个用例。
- `npm run build:check` 通过。
- `git diff --check` 通过。
- `npm run check` 通过：完整测试 17 个文件 / 71 个用例通过；Biome 仍打印 21 个既有 warning，但命令返回 0。

## 功能完整性检查

- L4 输入来源已从 raw transcript 改为结构化 runtime memory package，包含任务目标、阶段状态、key findings、evidence refs、tool summary、recent text 和 diagnostics。
- L4 provider payload 不再依赖 `this.#messages.slice(...)` 形成 Chat Completions 回合，避免 raw `tool` message 被切断后进入 provider。
- 摘要验证能阻止缺失 phase、finding、evidence 或 failure state 的摘要写成成功 memory summary。
- Budget hard stop 能在 L4 failure 与超预算叠加时终止当前运行，不继续扩大 token 浪费。
- Abort gate 覆盖调用前和 in-flight 返回后两处，取消后不会写回 L4 summary。

## 遗留风险

- 未执行真实 DeepSeek / BiliDili 单维度复测；真实项目外部 AI 数据发送仍需用户确认或改用安全替代 provider 路线。
- 当前 memory package 主要消费 `ActiveContext.distill()`、runtime `toolCalls` 和 diagnostics；如果后续 L4 执行点能稳定注入完整 `EvidenceCollector.evidenceMap`，可进一步增强 evidence refs 的来源完整性。
- `Alembic` / `AlembicDashboard` 目前未消费 L4 validation / hard stop 的细粒度计数或原因；如果 UI / job summary 需要展示这些指标，应另开下游 consumer 任务。

## 下一步建议

- 总控窗口复核提交 `c2d3b5316b28d4d750283c324a2fd2babaa221ce`、验证结果和 workspace 文档回填后，再决定是否解除 Wave 9D 的 L4 阻塞。
- 若用户确认真实项目外部 AI 数据发送或给出本地 / 测试 provider 路线，可启动 `BiliDili` 小范围真实复测。
- 若复测仍暴露 job progress stale 或效率指标未进入 summary，再派发 `Alembic` consumer / projection follow-up。
