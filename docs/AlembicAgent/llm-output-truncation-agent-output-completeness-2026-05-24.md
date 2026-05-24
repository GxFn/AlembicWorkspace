# LLM Output Truncation Agent Output Completeness

更新日期：2026-05-24
窗口：`AlembicAgent`
任务包：`LOTB-P1-Agent-Output-Completeness`
状态：待验收
提交 hash：`bdd77335e1904a8bc91342a71d6348a64862eafe`

## 当前窗口定位

本窗口是 `AlembicAgent` 执行窗口。本轮只负责 Agent 生产侧：`llm.output` process event 完整性 metadata、DeepSeek `finish_reason` 透传和单测。

本轮明确不负责：Alembic bridge 存储 / API 截断字段、Dashboard Jobs Timeline UI、Core contract、Plugin、BiliDili 或真实项目验证。

## 完成范围

- `AgentRuntime` 生成 `llm.output` 时不在 Agent 层截断 developer-visible text；`content.text` 仍只包含脱敏后的 visible text 或 tool-call fallback。
- hidden reasoning 原文不进入 `content.text`；只通过 metadata 暴露字符数、是否省略和 reasoning token 用量。
- `LLMResult`、`ChatWithToolsResult`、`TransportResponse` 增加 `finishReason?: string | null`。
- `DeepSeekTransport` 与 `DeepSeekProvider` 从 Chat Completions `choice.finish_reason` 透出 `finishReason`。
- `LLMGateway` 将 transport `finishReason` 继续归一化给 runtime。
- `sanitizeDeveloperData` 保留安全的数值型 token 计数指标，例如 `inputTokens`、`outputTokens`、`totalTokens`、`reasoningTokens`、`cacheHitTokens`；真实 token / key 字段仍按 secret key 规则脱敏。
- 单测覆盖长 visible text 不被 Agent 层截断、hidden reasoning 不进 content、provider `finish_reason=length` 标记为截断、DeepSeek transport/provider 透出 `finishReason`。

## Metadata 字段

`llm.output.metadata` 新增或稳定以下字段：

| 字段 | 含义 |
| --- | --- |
| `visibleTextChars` | provider 返回的 developer-visible text 原始字符数。 |
| `textChars` | 兼容旧字段，等同于 `visibleTextChars`。 |
| `developerContentChars` | Agent 脱敏后写入 `content.text` 的字符数。 |
| `hasText` | 本轮是否有 visible text。 |
| `functionCallCount` / `functionCallNames` | 本轮 tool call 数量与前 12 个名称。 |
| `hasHiddenReasoningContent` | 是否存在被 developer view 省略的 reasoning 内容或 reasoning token 用量。 |
| `reasoningContentOmitted` | hidden reasoning 是否已按边界省略。 |
| `reasoningContentChars` | hidden reasoning 原文字符数；只暴露计数，不暴露原文。 |
| `reasoningTokens` | provider usage 中的 reasoning token 数值指标。 |
| `finishReason` | provider stop reason，例如 `length`。 |
| `providerOutputTruncated` | `finishReason` 表明 provider 输出被截断时为 `true`。 |
| `agentOutputTruncated` | Agent 层是否截断；本轮固定为 `false`。 |
| `outputCompleteness` | `visible_text_complete`、`provider_truncated`、`tool_call_only` 或 `empty`。 |
| `usage` | provider token usage；数值型 token 计数保留，secret 字段仍脱敏。 |

## Event 示例

```json
{
  "kind": "llm.output",
  "title": "LLM output received",
  "summary": "Received 7380 visible character(s); provider stopped with finishReason=length; hidden reasoning omitted",
  "content": {
    "role": "assistant",
    "text": "<脱敏后的完整 developer-visible text>"
  },
  "metadata": {
    "visibleTextChars": 7380,
    "textChars": 7380,
    "developerContentChars": 7369,
    "hasHiddenReasoningContent": true,
    "reasoningContentOmitted": true,
    "reasoningContentChars": 39,
    "reasoningTokens": 3,
    "finishReason": "length",
    "providerOutputTruncated": true,
    "agentOutputTruncated": false,
    "outputCompleteness": "provider_truncated"
  }
}
```

## 验证命令与结果

- `npm run test -- test/AgentRuntime.test.ts test/DeepSeekTransport.test.ts test/DeepSeekProvider.test.ts`：通过，3 个文件 15 个测试通过。
- `npm run build:check`：通过。
- `npm run lint`：通过。
- `git diff --check`：通过。
- `npm run check`：通过，build、lint、agent import boundary、public API boundary、Core import boundary 和 19 个测试文件 / 91 个测试全部通过。
- `alembic_guard`：未能执行；当前 `AlembicAgent` 没有可用 Alembic knowledge base，返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`。此前 `alembic_codex_diagnostics` 还报告 `PLUGIN_RUNTIME_PIN_MISMATCH` 与 `PLUGIN_METADATA_INCOMPLETE`。

## 需要 Alembic / Dashboard 消费的字段

Alembic bridge 建议保留并透传：`visibleTextChars`、`textChars`、`developerContentChars`、`reasoningContentOmitted`、`reasoningContentChars`、`reasoningTokens`、`finishReason`、`providerOutputTruncated`、`agentOutputTruncated`、`outputCompleteness`、`usage`。

Dashboard 建议直接兼容上述字段；旧事件缺字段时继续按现有展示降级。

## 遗留风险

- 本窗口未验证 Alembic bridge 是否保留新增 metadata；该项属于 `Alembic` 窗口。
- 本窗口未验证 Dashboard 是否展示新增字段；该项属于 `AlembicDashboard` 窗口。
- 本窗口未跑真实 DeepSeek API；DeepSeek 行为通过 mock Chat Completions 响应验证。
- Alembic Guard 不可用，需在 Alembic Codex knowledge 初始化或诊断问题修复后再补跑。

## 下一步建议

- `Alembic` 窗口消费并保留 Agent 新增 metadata，同时补 bridge 真实截断机器字段。
- `AlembicDashboard` 窗口展示 `outputCompleteness`、`finishReason`、`reasoningContentOmitted`、`providerOutputTruncated` 和 bridge `contentTruncated`。
- 三仓库回填后，由总控创建 `AlembicTest` 最小复测单验证 Jobs Timeline 端到端观感。
