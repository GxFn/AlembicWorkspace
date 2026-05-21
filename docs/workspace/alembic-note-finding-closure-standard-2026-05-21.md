# Alembic note_finding 闭环判定记录

日期：2026-05-21
状态：当前判定标准已固定；后续总控验收必须按本文口径判断。

## 结论

`note_finding` 的单维度结构化证据写入闭环已经走通，但完整 cold-start 产候选闭环不能据此判定为完成。

这两件事必须分开：

- `note_finding` 单维度写入闭环：模型通过 native tool call 或 runtime 可识别的 DeepSeek text compat 路径写入 `note_finding`，运行时写入 ActiveContext / memory，QualityGate 读到 `memoryFindings >= 3` 并让该维度通过。
- native tool call 闭环：必须额外证明 provider 响应里是原生 `tool_calls`，不是 `<function_calls>` 文本兼容转译。
- 完整 cold-start 产候选闭环：所有必要维度完成，producer 生成候选，job 正常完成，Dashboard / API 能看到候选和可追踪状态。

当前真实运行证据只能证明前者已经可工作，不能证明后者已完成，因为最新 job 在用户取消后结束。

## 固定判定标准

以后不再用“页面候选数”“job 总状态”“工具调用总数”单独判断 `note_finding` 是否走通。

### `note_finding` 写入闭环通过

必须同时满足：

1. Agent runtime 日志显示该维度有真实工具调用，不是纯自然语言空转。
2. QualityGate 日志显示该维度 `memoryFindings >= 3`。
3. QualityGate 对该维度给出 `action=pass`，或后续 producer 明确消费了这些 structured findings。

### native tool call 闭环通过

必须在上述条件之外，再看到 AgentRuntime `note_finding` source 日志为 `native_or_provider_tool_call`，且没有 DeepSeek compat 转译日志参与该次 `note_finding`。

### `note_finding` 写入闭环未通过

满足任一情况即视为未通过：

1. QualityGate 显示 `memoryFindings=0` 或低于门槛。
2. 日志显示模型只输出类似工具调用的文本，但 runtime `toolCalls=0`。
3. `note_finding` handler、memory 写入、ActiveContext 或 QualityGate 任一环节没有消费证据。
4. 只能通过自然语言 parser 兜底生成 findings，且没有经过 evidence validation 和 memory 写入。

### 完整 cold-start 闭环通过

必须另行满足：

1. bootstrap / rescan job 正常完成，不是 cancel / timeout / degraded / aborted。
2. 必要维度都通过 QualityGate。
3. producer 生成候选，Dashboard / API 可见候选。
4. job summary 能追踪维度、finding、候选、耗时和异常状态。

## 为什么之前口径反复

这次总控口径反复的根因是把三种不同层级混在了一起：

1. 代码连通性：`note_finding` schema、tool pipeline、memory handler、ActiveContext 和 QualityGate 是否接上。
2. 单维度运行闭环：某个维度是否真的通过 tool call 写入 `memoryFindings`。
3. 完整 job 闭环：整个 cold-start 是否完成并产生候选。

此前看到 job summary 中 `candidates=0`、job 被取消、页面无候选时，把它误判成 `note_finding` 没产出；随后读取 QualityGate 维度日志，又看到 `memoryFindings=3`，才改口说已经产出。这个判断过程没有先固定标准，也没有先写实体记录，更没有区分 native tool call 和 DeepSeek text compat 转译，导致总控口径不稳定。

以后按本文标准处理：先看单维度 QualityGate 的 `memoryFindings` 和 `action`，再看 AgentRuntime `note_finding` source 日志确认产出方式，最后看完整 job 是否产候选；三者不互相替代。

## 当前运行证据

最新 BiliDili cold-start 取消前，日志已经证明至少两个维度走通了 `note_finding` 单维度写入闭环：

- `architecture`：Agent runtime 有真实 tool calls，QualityGate `action=pass`，`memoryFindings=3`。
- `swift-objc-idiom`：QualityGate `action=pass`，`memoryFindings=3`。

同一 job 后续由用户取消，因此完整 cold-start 产候选闭环未完成，页面候选数为 0 不能反推 `note_finding` 没有产出。

这份旧日志不能证明这些 `note_finding` 一定来自 native provider `tool_calls`；后续已在 `AgentRuntime` 补充 `note_finding call received/completed` 日志，下一次运行必须用 source 字段确认 native 或 DeepSeek text compat 路径。

## 当前仍未解决的问题

当前主问题不是 `note_finding` handler 没连通，而是 DeepSeek V4 在某些轮次会输出“像工具调用的文本”，但 provider / runtime 没收到 native `tool_calls`，导致 `toolCalls=0` 空转。

因此下一步修复重点必须是：

- DeepSeek V4 工具调用兼容层：识别并处理伪工具调用文本，或立即失败并给出明确诊断，不能继续空转。
- 监控脚本和 Dashboard：直接显示维度级 `memoryFindings`、QualityGate action、tool call 计数和取消状态，避免用 job 总状态误判。
- `tool_choice=required` 对 DeepSeek V4 禁用，并记录原因：当前 DeepSeek V4 / reasoner 线路不支持该参数，使用会触发 400。

## 总控规则补充

以后讨论 `note_finding` 时，必须明确说的是哪一层：

- 代码连通性；
- 单维度 `note_finding` 写入闭环；
- native tool call 闭环；
- 完整 cold-start 产候选闭环。

没有说明层级时，不允许直接说“通了”或“没通”。
