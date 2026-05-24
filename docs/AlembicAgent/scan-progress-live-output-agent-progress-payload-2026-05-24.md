# AlembicAgent Scan Progress Live Output Agent Progress Payload 回填

日期：2026-05-24

## 窗口定位

- 当前窗口：`AlembicAgent`
- 领取任务：`SPLO-P1-Agent-Progress-Payload`
- 本轮仓库职责：在 Agent runtime 内产出可供宿主消费的 developer-safe process progress payload，覆盖 LLM 输入、LLM 可见输出、显式反思 / 自检和 tool 调用进度。
- 明确不属于本轮：不修改 Alembic daemon recorder / HTTP / Dashboard UI；不修改 AlembicPlugin；不操作 `BiliDili`；不把隐藏推理、raw-provider payload 或 secret 暴露给前端。

## 提交

- AlembicAgent commit：`08f2102f23edbf3f920d2e7bc80a91e6c3c89661`
- 提交标题：`Add agent process progress payloads`

## 完成范围

- 在 `src/agent/runtime/AgentRuntimeTypes.ts` 新增 `AgentProgressProcessEvent` 公共 contract，并挂到 `ProgressEvent.processEvent`。
- 在 `src/agent/runtime/index.ts` 显式导出新增 progress payload 类型。
- 在 `src/agent/runtime/HookSystem.ts` 扩展 `llm:call:before`、`llm:call:after`、`tool:execute:before`、`tool:execute:after`，让 hook payload 能携带 `processEvent`，并同步到 runtime event bus。
- 在 `src/agent/runtime/AgentRuntime.ts` 增加真实生产点：
  - `llm.input`：provider 调用前，根据当前 projected messages / tool choice / model 构造 developer-visible 输入 payload。
  - `llm.output`：provider 返回后，根据可见文本或 function call 概要构造输出 payload。
  - `llm.reflection`：对 reflection / planning / replan / convergence / digest / continue 等 nudge 产出显式反思 payload。
  - `tool`：tool start / completed / failed 均产出 payload，包含 tool 名称、调用 id、状态、耗时、缓存状态和脱敏后的 args / result 摘要。
- 在 `test/AgentRuntime.test.ts` 增加 LLM input/output 与 reflection/tool payload 覆盖，验证 secret 脱敏、hidden reasoning 不外泄和 metadata 保留。

## 真实调用链结论

- Alembic 冷启动内部维度执行路径真实消费 `@alembic/agent/service` 的 `AgentService`，因此 `AlembicAgent` runtime 增强有真实上游价值。
- Alembic 当前 bootstrap child execution 在本窗口完成时还没有把 Agent `onProgress` / `processEvent` 桥到 `JobProcessEventRecorder`；本轮只完成 Agent 侧 payload 生产。当前 wave 后续已记录 `Alembic` producer bridge 回填，等待总控复核与真实复测。
- 本轮没有引入 Dashboard 推断或伪造事件；Dashboard 仍应只消费 Alembic API / socket 提供的真实 event。

## Payload 示例

`ProgressEvent` 新增字段形态：

```json
{
  "type": "agent_process_event",
  "message": "LLM input prepared",
  "processEvent": {
    "kind": "llm.input",
    "title": "LLM input prepared",
    "sourceClass": "developer-facing",
    "displayPolicy": "full",
    "retention": "job-retained",
    "severity": "info",
    "phase": "scan",
    "dimensionId": "project-structure",
    "targetName": "bootstrap",
    "iteration": 1,
    "content": {
      "role": "input",
      "text": "Model: fake-model\nTool choice: auto\nMessages:\n- user: Analyze this project..."
    }
  }
}
```

其它 kind：

- `llm.output`：只包含 LLM 可见文本或 function call 名称 / 参数概要；hidden reasoning 只以 `metadata.hasHiddenReasoningContent=true` 标记。
- `llm.reflection`：只包含 runtime 明确展示给开发者的 reflection / planning / replan 等 nudge 文本。
- `tool`：tool start / completed / failed 均通过同一 kind 表达，并用 `metadata.status`、`metadata.durationMs`、`metadata.cached` 区分状态。

## Hidden / Raw / Secret 边界

- `reasoningContent` 不进入 `processEvent.content.text`；只保留布尔 metadata 表明 provider 曾返回 hidden reasoning。
- 常见 `apiKey`、`token`、`secret`、`password`、`authorization`、`key` 等字段会在 developer payload 中脱敏。
- 常见 key/token 文本模式会被 `[REDACTED]` 替换。
- 不转发 raw provider payload；不把 provider hidden reasoning 伪装成 reflection。
- 现有兼容 progress 字段例如 `tool_call.args` 仍可能保留旧行为；Alembic producer 应优先消费本轮新增的 `event.processEvent`。

## 验证命令与结果

- `npm run build:check`：通过。
- `npm run lint`：通过。
- `npm run test -- test/AgentRuntime.test.ts`：通过，`7` tests passed。
- `npm run check`：通过，`19` files / `90` tests passed。
- `git diff --check`：通过。

## 遗留风险

- 本轮未在 live Alembic daemon / `BiliDili` 冷启动中复测，因为 Alembic 侧消费 adapter 仍未完成。
- 本地 Alembic Codex knowledge 未启用，诊断显示 runtime pin / metadata 不匹配；本轮以总控文档和真实代码证据为准。
- Alembic 侧 producer bridge 已在当前 wave 回填待验收；是否满足真实 kind counts 仍需 `AlembicTest` live cold-start 复测确认。

## 下一步建议

- 总控复核 `Alembic` producer bridge、`AlembicAgent` progress payload 和 `AlembicDashboard` scroll 三份 Phase 1E 回填。
- `AlembicTest` 在总控验收后重跑真实 cold-start，重点确认 kind counts 出现 `llm.input`、`llm.output`、`llm.reflection`、`tool`，并确认 Jobs 长详情仍可滚动。
