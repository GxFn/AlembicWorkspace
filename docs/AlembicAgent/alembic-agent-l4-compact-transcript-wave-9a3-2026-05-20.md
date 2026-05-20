# AlembicAgent L4 Compact Transcript Wave 9A3 Execution Record

状态：已完成，待总控验收
执行窗口：AlembicAgent
日期：2026-05-20
关联计划：`docs/workspace/alembic-agent-evidence-recording-phase-chain-workspace-plan-2026-05-20.md`

## 完成范围

- 新增 `src/external/ai/tool-transcript.ts`，统一归一化 Chat Completions tool transcript：完整的 assistant `tool_calls` + tool result 回合继续保留；孤立 `tool` message、缺失结果的 assistant tool call、被 context slice 打断的 tool transcript 会转换为普通文本消息。
- 修复 `ContextWindow.compactL4()` 的 summary input 构造：最近消息切片不再从 system / prompt 前裁切，summary prompt 作为最后一条 user message 发送；L4 compact 后写回的近期上下文也会保持协议合法。
- 修复 L4 compact failure 语义：compact provider 抛错时返回 `failed: true`，由 `BudgetController` 进入一次 preflight cooldown，避免同一压力周期反复触发 L4 compact。
- 在 `DeepSeekTransport` 和 `DeepSeekProvider` 发包前增加 transcript preflight normalization，并记录 warning，避免 DeepSeek 收到孤立 `role: "tool"` 或缺失匹配关系的 tool messages。
- 补充 targeted tests 覆盖：L4 recent slice 以 orphan tool 开头、assistant tool_calls 被裁掉、DeepSeek transport 发包前归一化、L4 compact 失败后同一压力周期不重复请求。

## 提交

- AlembicAgent commit：`44dfe1360286e0c6d8074e07cea148ef679b13b2`

## 验证命令

```text
npm run test -- ContextWindow
npm run test -- BudgetController
npm run test -- DeepSeekTransport
npm run build:check
npm run check
git diff --check
```

## 验证结果

- `npm run test -- ContextWindow`：通过，1 个测试文件 / 2 个用例。
- `npm run test -- BudgetController`：通过，1 个测试文件 / 1 个用例。
- `npm run test -- DeepSeekTransport`：通过，1 个测试文件 / 2 个用例。
- `npm run build:check`：通过。
- `npm run check`：通过，完整测试 16 个文件 / 64 个用例通过；Biome 仍打印 21 个既有 warning，但命令返回 0。
- `git diff --check`：通过。

## 遗留风险

- 本轮只在 AlembicAgent 内记录 preflight warning；如果后续希望 Alembic / Dashboard 展示 compact transcript normalization 次数或失败原因，需要再定义下游可消费 diagnostics 字段。
- 尚未执行真实 DeepSeek / BiliDili 单维度复测；该复测仍需要用户确认外部 AI 数据发送策略，或由总控选择本地 / 测试 provider 替代路线。

## 下一步建议

- 总控复核 AlembicAgent commit `44dfe1360286e0c6d8074e07cea148ef679b13b2` 和上述验证结果。
- 若总控判断无需下游消费 compact diagnostics，可解除 BiliDili Wave 9D 的 compact 阻塞，并在用户确认数据策略后启动小范围真实验证。
- 若总控需要持久化 compact diagnostics，再追加 Alembic consumer / Dashboard 观察任务，避免 BiliDili 真实复测时丢失运行证据。
