# 冷启动与增量扫描前端持续输出展示 - 需求设计

状态：需求设计已确认，已进入 Wave 1 执行计划
维护窗口：AlembicWorkspace
创建时间：2026-05-24
对应 TODO：`GTODO-2026-05-23-028`

## 原始计划书

- 原始计划书：[original-plan-2026-05-23.md](original-plan-2026-05-23.md)
- 原始计划书确认状态：已确认
- 用户确认时间：2026-05-24 00:28 CST

## 用户需求

用户希望 cold-start / rescan 过程中，前端页面能持续输出展示有价值的信息。第一版重点：

- 入口放在候选页面 cold-start 卡片和后台任务页面。
- 不做原始日志 UI，不把中文 debug log 原样搬到前端。
- 展示类似 Codex 工具调用的可展开过程块。
- 明确区分 Alembic 输入给 LLM 的提示、workflow 显式反思 / 自检 / 候选选择说明，以及 LLM 可见输出。
- LLM 输出先轻量处理，后续再根据真实内容优化。
- 展示目的是帮助开发者复盘冷启动：看清输入给 LLM 的内容、LLM 输出的内容、后续如何解析和产出，从而优化提示词、阶段策略和产物格式。
- 已归类为 developer-facing 的现有日志 / workflow 文案 / LLM 可见输出默认完整展示，不额外截断，也不做特殊脱敏；数据层通过来源分类避免把密钥、token、内部配置或原始 provider payload 投到前端。
- 数据处理层要把机器 / AI 可消费日志和开发者前端展示格式分离。
- 第一版可以先打通 cold-start；rescan 后续复用同一模型。
- 前端只保留最近任务；长期分析依靠日志和 AI 总结。

## 需求明确性检查

- 用户场景：开发者在 Dashboard 看到 cold-start 正在做什么、哪些 LLM 输入 / 输出发生了、哪里慢、哪里失败、产生了什么候选 / 产物。
- 完整功能闭环：启动 cold-start job -> 后端记录 process event -> API / socket 输出 developer view -> Jobs 页面完整展示 -> cold-start 卡片摘要展示 -> 刷新后仍可恢复最近过程。
- 输入：cold-start / rescan workflow 信号、Agent runtime progress、LLM call metadata、nudge / reflection、tool call、dimension projection、artifact / checkpoint / error。
- 输出：machine process event、developer view model、Dashboard timeline、cold-start card summary、job events API。
- 状态 / 数据变化：JobStore 或附属 event store 增加最近 process events；job response 增加摘要；Dashboard 增加 timeline state。
- 生产方：`Alembic` workflow / daemon / Agent runtime integration；必要 contract 由 `AlembicCore` 定义。
- 消费方：`AlembicDashboard` Jobs 页面和 BootstrapProgressView；`AlembicTest` 后续验证。
- 验证方式：类型 / 构建 / API smoke / Dashboard 构建 / AlembicTest 真实 cold-start 展示验证。
- 完成定义：第一版 cold-start 能持续展示真实事件，不静默进入后半程；输入输出分类清楚；刷新可恢复最近事件；失败 / 取消 / 降级可见；真实项目验证通过。
- 仍不明确的问题：是否同轮把 rescan UI 验收作为硬门禁。总控建议不作为第一版硬门禁，只确保 backend event kind 可覆盖。

## 调研范围

- 必读仓库：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicTest`。
- 观察仓库：`AlembicPlugin`。
- 暂不纳入仓库：真实测试项目源码不修改。
- 关键入口文件：
  - `Alembic/lib/daemon/DaemonJobRunner.ts`
  - `Alembic/lib/http/routes/jobs.ts`
  - `Alembic/lib/service/bootstrap/BootstrapTaskManager.ts`
  - `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts`
  - `Alembic/lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts`
  - `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts`
  - `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProjections.ts`
  - `AlembicAgent/src/agent/runtime/AgentRuntime.ts`
  - `AlembicDashboard/src/api.ts`
  - `AlembicDashboard/src/hooks/useBootstrapSocket.ts`
  - `AlembicDashboard/src/components/Views/JobsView.tsx`
  - `AlembicDashboard/src/components/Views/BootstrapProgressView.tsx`
- 关键测试 / 脚本：后续按窗口 AGENTS 决定；本阶段不执行产品构建。

## 外部调研判断

- 是否需要联网：否。
- 判断理由：当前问题是 Alembic 内部任务可观察链路设计，本地代码已经展示真实 producer / consumer / persistence / UI 缺口。外部调研不能替代本地链路证据。
- 若后续需要：通用 tracing 标准、长日志检索、跨工具 timeline 协议可另行调研。

## 真实代码事实

### AlembicCore

- 已有能力：`JobStore` 保存 daemon job；`RuntimeContracts` 定义 job capability endpoints。
- 关键文件：`AlembicCore/src/daemon/JobStore.ts:23`、`AlembicCore/src/daemon/RuntimeContracts.ts:29`。
- 缺口：没有 process event schema、bounded event persistence、developer view model 或 `/jobs/:id/events` contract。

### Alembic

- 已有能力：daemon job runner、jobs API、bootstrap task manager、workflow 日志、Socket.io broadcast、cold-start / rescan internal workflow。
- 关键文件：见代码实现依赖调研。
- 缺口：富事件没有统一记录；Agent progress 没桥接到 job；format / artifact 阶段没有前端事件；job API 只返回 compact progress。

### AlembicPlugin

- 已有能力：当前需求第一版无直接实现任务。
- 关键文件：不需要进入实现链路。
- 缺口：无。Plugin 只观察未来 Codex handoff 是否需要展示 job URL / job summary。

### AlembicDashboard

- 已有能力：Jobs 页面、bootstrap socket hook、BootstrapProgressView、job API client、active job polling。
- 关键文件：`AlembicDashboard/src/api.ts:1501`、`AlembicDashboard/src/hooks/useBootstrapSocket.ts:161`、`AlembicDashboard/src/components/Views/JobsView.tsx:157`、`AlembicDashboard/src/components/Views/BootstrapProgressView.tsx:418`。
- 缺口：没有完整 timeline、输入 / 输出分组、LLM 输出折叠、format artifact 事件、最近事件恢复。

### AlembicAgent

- 已有能力：AgentRunResult 包含 phases/toolCalls/usage/diagnostics；runtime 支持 `onProgress` / `onToolCall`；nudge / reflection 是显式文本；LLM call start/complete 有结构化日志。
- 关键文件：`AlembicAgent/src/agent/service/AgentRunContracts.ts:170`、`AlembicAgent/src/agent/runtime/AgentRuntime.ts:853`、`AlembicAgent/src/agent/context/exploration/NudgeGenerator.ts:307`。
- 缺口：这些事件没有作为 process events 输出到 Alembic job；需要 Alembic 接入时传入回调或由 Agent 增强 progress payload。

### AlembicTest / 真实项目验证

- 是否纳入：目标阶段确认后纳入。
- 理由：第一版完成必须有真实 cold-start UI 验证，但总控不能直接执行真实项目测试。
- 目标项目：由 `AlembicTest` 按总控测试单选择 BiliDili 或当前指定真实项目。

## 代码实现依赖调研

- 单独调研附件：[code-implementation-dependency-research-2026-05-24.md](code-implementation-dependency-research-2026-05-24.md)
- 关键生命周期：job enqueue -> workflow sync phases -> bootstrap session start -> dimension child run -> Agent LLM/tool loops -> dimension projection -> candidate / digest / checkpoint -> session finalize -> job complete。
- 共享状态 / 持久化位置：`JobStore` 现有 job JSON + 建议新增 bounded process event store。
- producer / consumer 硬依赖：Core contract -> Alembic producer/API -> Dashboard consumer -> AlembicTest validation。
- 不能切换 / 不能删除 / 不能提前消费的边界：Dashboard 不解析 raw log；Plugin 不接入 Dashboard；rescan 不阻塞第一版 cold-start；前端不展示隐藏推理。

## 目标能力设计

### 最终能力

建立 cold-start / rescan process observability：

1. 后端把 workflow / Agent / artifact 过程统一记录为 canonical process event。
2. 数据处理层为机器 / AI 保留结构化 event，为 Dashboard 生成 developer view model。
3. Jobs 页面展示完整可展开过程。
4. cold-start 卡片展示摘要、最新关键事件和跳转入口。
5. 刷新后可恢复最近任务过程，不依赖当前 socket 内存。

### 数据模型

建议最小 contract：

```text
JobProcessEvent
- id
- jobId
- sessionId
- taskId / dimensionId
- kind: workflow | llm.input | llm.reflection | llm.output | tool | artifact | error | summary
- stage
- title
- summary
- detail
- payload
- evidenceRefs
- createdAt
- severity
- visibility: developer | machine | both
- sourceClass: developer-display | machine-event | raw-provider | secret
- displayPolicy: full | machine-only | excluded
```

```text
JobProcessDeveloperView
- jobId
- updatedAt
- summary
- latestImportantEvents
- groups: stage -> event cards
- counts: llmInputs / llmOutputs / toolCalls / artifacts / errors
- retention
```

第一版字段可以更少，但必须保留分类、stage、summary/detail、sourceClass/displayPolicy、jobId/sessionId/dimensionId 这些骨架。开发者展示源默认 `displayPolicy=full`，不把截断 / 脱敏作为第一版默认展示策略。

### API / contract

建议：

- `GET /api/v1/jobs/:jobId/events?limit=...`：返回最近 process events 和 developer view。
- `GET /api/v1/jobs/:jobId`：保留 compact progress，可附带 latest process summary，不返回完整 timeline。
- Socket.io 新增 `job:process-event` 或 `bootstrap:process-event`：实时 append；刷新恢复仍靠 HTTP。
- `RuntimeContracts` 增加可选 job events endpoint capability。

### UI / handoff

- Jobs 页面：完整 timeline 主视图，按阶段可折叠；LLM 输入 / 显式反思 / LLM 输出颜色和标签区分；工具调用可展开；artifact 事件显示产物摘要与引用。
- BootstrapProgressView：保留现有任务卡片网格；新增轻量“最近关键事件 / LLM 输出 / 查看完整过程”区域。
- 候选页面冷启动卡片：只显示摘要入口，不承载完整控制台。

## 禁止的伪实现

- 不把 `console.log` 或中文日志文本直接作为 UI contract。
- 不只给 Dashboard 加 mock timeline。
- 不把所有事件塞进 job result 大对象。
- 不让 Dashboard 自己猜 LLM 输入 / 输出类别。
- 不展示隐藏推理、密钥、token、完整敏感配置或原始 provider payload；已分类为开发者展示源的 prompt / workflow 文案 / LLM 可见输出不额外截断或特殊脱敏。
- 不把 Plugin 拉进 Dashboard 展示链路。

## 差距分析

| 能力 | 当前状态 | 缺口 | 归属窗口 | 风险 |
| --- | --- | --- | --- | --- |
| Process event contract | 无稳定 contract | 需要 schema、分类、sourceClass / displayPolicy 和 retention | `AlembicCore` | 下游私造字段 |
| Event recorder / persistence | JobStore 只存 job record | 需要 bounded recent event store | `Alembic` / `AlembicCore` | 刷新丢事件，job JSON 过大 |
| Workflow producer | 有日志和粗事件 | 缺 stage / artifact / format event | `Alembic` | 后半程继续静默 |
| Agent bridge | Agent 有 progress/hook | 未接入 job process event | `Alembic` / `AlembicAgent` | 看不到 LLM 输入 / 输出 |
| Job API | 有 list/get/progress | 缺 events endpoint / developer view | `Alembic` / `AlembicCore` | Dashboard 无真实数据源 |
| Jobs UI | 有 progress / efficiency | 缺 timeline / LLM 分组 | `AlembicDashboard` | 用户仍看不懂过程 |
| Cold-start card | 有 task card | 缺轻量过程摘要与跳转 | `AlembicDashboard` | 入口不满足用户场景 |
| 真实验证 | 待创建测试单 | 需要 cold-start 展示证据 | `AlembicTest` | 不能证明闭环 |

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / TODO | 影响目标 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-23-028-A | 主线 | contract | P0 | `AlembicCore` | 定义 `JobProcessEvent` / developer view 最小 contract、分类、sourceClass / displayPolicy、retention 和 runtime capability endpoint。 | 是 | 目标阶段确认后第一波。 | `AlembicCore` |
| GTODO-2026-05-23-028-B | 主线 | producer | P0 | `Alembic` | 实现 process event recorder、job events API、socket broadcast、workflow / artifact 事件生产。 | 是 | 依赖 Core contract 或 Alembic 内部临时 contract 被确认。 | `Alembic` |
| GTODO-2026-05-23-028-C | 主线 | agent bridge | P0 | `Alembic` / `AlembicAgent` | 把 Agent progress、tool call、nudge / reflection、LLM 可见输出接入 job process event；必要时增强 Agent progress payload。 | 是 | 依赖 recorder。 | `Alembic` / `AlembicAgent` |
| GTODO-2026-05-23-028-D | 主线 | dashboard | P0 | `AlembicDashboard` | Jobs 页面 timeline + cold-start card 摘要入口，输入 / 反思 / 输出 / 工具 / 产物分组展示。 | 是 | 依赖 API contract。 | `AlembicDashboard` |
| GTODO-2026-05-23-028-E | 主线 | test | P0 | `AlembicTest` | 真实项目 cold-start 展示验证，覆盖持续更新、刷新恢复、后半程产物事件、敏感信息不展示。 | 是 | 依赖前后端实现完成。 | `AlembicTest` |
| GTODO-2026-05-23-028-F | 后续 | rescan polish | P2 | `Alembic` / `AlembicDashboard` / `AlembicTest` | rescan 完整 UI polish 和验收；第一版只要求 event model 可承载 rescan。 | 否 | cold-start 第一版稳定后。 | 待定 |

## 后续拆分候选方向

| 阶段 | 目标 | 生产窗口 | 消费窗口 | 完成判断 |
| --- | --- | --- | --- | --- |
| 1 | Contract 与 recorder 基础 | `AlembicCore` / `Alembic` | `Alembic` / `AlembicDashboard` | 有 schema、event store、events API、live broadcast，能记录 workflow stage。 |
| 2 | Cold-start / Agent producer 接入 | `Alembic` / `AlembicAgent` | `AlembicDashboard` | LLM 输入、显式反思、可见输出、tool、artifact、digest、checkpoint 有真实事件。 |
| 3 | Dashboard 双入口展示 | `AlembicDashboard` | 开发者 | Jobs 页面完整 timeline；cold-start 卡片摘要入口。 |
| 4 | 真实项目验证与收口 | `AlembicTest` | 总控验收 | cold-start 展示闭环有真实证据；rescan 后续项入 TODO 或通过。 |

## 待确认问题

- 总控建议第一波先让 `AlembicCore` 定义最小 contract，`Alembic` 同波或下一波实现 recorder / API。是否确认？
- 总控建议第一版以 cold-start 验收为硬门禁，rescan 只保证事件模型和 API 可复用，不强制完整 UI 验收。是否确认？
- 用户已确认：developer-facing 的输入、显式反思和 LLM 可见输出第一版完整展示，不额外截断，也不做特殊脱敏；数据层仍需通过来源分类排除密钥、token、内部配置、原始 provider payload 和隐藏推理。

## 进入目标阶段确认

- 建议创建的确认文档：`docs/workspace/current/scan-progress-live-output-goal-stage-confirmation-2026-05-24.md`
- 是否已经完成代码实现依赖调研：已完成初版。
- 建议第一波候选窗口：`AlembicCore`、`Alembic`。
- 明确不派发窗口：Wave 1 Phase 1A 只发送 `AlembicCore`；`Alembic` 等 Core contract 回填；`AlembicPlugin` 第一版无任务；`AlembicTest` 等实现后创建测试单。
