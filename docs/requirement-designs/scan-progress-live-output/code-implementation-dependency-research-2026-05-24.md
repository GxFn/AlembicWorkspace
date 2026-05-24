# 冷启动与增量扫描前端持续输出展示 - 代码实现依赖调研

状态：已完成初版调研，供目标阶段确认使用
维护窗口：AlembicWorkspace
创建时间：2026-05-24
对应 TODO：`GTODO-2026-05-23-028`

## 调研结论

当前系统已经有“冷启动 / 重扫任务正在跑”的粗粒度链路：`Alembic` 后端创建 job，`BootstrapTaskManager` 管理 session 和 task，Socket.io 推送 `bootstrap:*` 事件，Dashboard 通过 `useBootstrapSocket` 和 Jobs 页面展示进度。

但用户要的“像 Codex 工具调用一样持续展开有价值信息”尚未形成闭环。真实富信息已经存在于 internal workflow 和 Agent runtime 中，例如 AgentRunInput、nudge / reflection、LLM call start / complete、tool calls、analysisText、producer reply、dimensionDigest、qualityGate 和 checkpoint；这些信息现在主要被日志打印或在函数局部投影消费，没有统一记录为可持久、可恢复、可供前端展示的 process event。这个展示面的核心价值是让开发者看清 Alembic 给 LLM 输入了什么、LLM 可见输出了什么、后续如何解析与产出，进而优化 cold-start 的提示词、阶段策略和产物格式。

因此第一版不能让 Dashboard 自己拼日志，也不能只扩展前端文案。必须先在后端建立 “raw/runtime signal -> machine process event -> developer view model” 的轻量处理层，再让 Dashboard 消费明确 contract。

## 外部调研判断

- 是否联网：否。
- 理由：本轮核心是 Alembic 自有 cold-start / rescan / internal Agent / Dashboard 真实代码链路的实现依赖，不涉及外部平台规范或第三方协议选择。本地代码证据已经足以判断 producer、consumer、持久化和 UI 缺口。
- 后续可联网点：如果后续要设计通用 tracing / telemetry 标准、长日志检索 UI 或跨工具可观测协议，再单独调研 OpenTelemetry、SSE / WebSocket 最佳实践或成熟 Agent trace UI。

## 当前能力链路

### Job 与 session

- `AlembicCore/src/daemon/JobStore.ts:23` 定义 `DaemonJobRecord`，只保存 job 的 kind/status/request/result/error/sessionId/bootstrapSessionId/timestamps。
- `AlembicCore/src/daemon/JobStore.ts:100` 创建 job JSON；`AlembicCore/src/daemon/JobStore.ts:171` 完成 job；`AlembicCore/src/daemon/JobStore.ts:222` 更新 job，但终态后不再允许写入。
- `Alembic/lib/daemon/DaemonJobRunner.ts:43` 通过 microtask 启动后台 job；`Alembic/lib/daemon/DaemonJobRunner.ts:63` 标记 running 并执行 internal workflow。
- `Alembic/lib/daemon/DaemonJobRunner.ts:189` bootstrap 调用 `bootstrapKnowledge`；`Alembic/lib/daemon/DaemonJobRunner.ts:205` rescan 调用 `rescanInternal`。
- `Alembic/lib/daemon/DaemonJobRunner.ts:80` 会把 running bootstrap job 关联到 `bootstrapSessionId`，然后等待 session 完成再 finalize。

结论：JobStore 是最近任务和刷新恢复的自然入口，但现有 record 没有 process events，也不适合把大量过程事件直接塞进 result。需要新增 bounded event storage 或附属 event log，并把 job response 只投影最近摘要。

### Bootstrap task event

- `Alembic/lib/service/bootstrap/BootstrapTaskManager.ts:1` 注释明确当前职责是 task lifecycle、EventBus、RealtimeService、session status。
- `Alembic/lib/service/bootstrap/BootstrapTaskManager.ts:34` 的 `TaskInfo` 只有 `eventCount`、status、meta、timestamps、result、error，没有事件列表。
- `Alembic/lib/service/bootstrap/BootstrapTaskManager.ts:166` 的 `toJSON()` 返回 session summary 与 tasks，不返回过程 timeline。
- `Alembic/lib/service/bootstrap/BootstrapTaskManager.ts:259` `startSession()` 创建 session 并发出 `bootstrap:started`。
- `Alembic/lib/service/bootstrap/BootstrapTaskManager.ts:430` `markTaskFilling()` 是维度进入 child run 的关键心跳。
- `Alembic/lib/service/bootstrap/BootstrapTaskManager.ts:472` `markTaskCompleted()` 只把最终 result 塞给 task。
- `Alembic/lib/service/bootstrap/BootstrapTaskManager.ts:597` `emitProgress()` 能发任意进度事件，但没有持久化和统一 schema。
- `Alembic/lib/service/bootstrap/BootstrapTaskManager.ts:662` `#emit()` 同时发送 EventBus 与 RealtimeService，是后续 live event 的现成出口。

结论：这里适合继续承担 live broadcast，但不应让它成为唯一事实源；它需要接入可恢复的 process event recorder。

### Bootstrap / rescan workflow

- `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts:13` 注释列出 Phase 1-4 同步、Phase 5 / 5.5 异步维度填充。
- `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts:101` 执行 full reset；`Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts:125` 运行 Project Intelligence Phase 1-4；`Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts:150` 生成 report；`Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts:159` 生成 targetFileMap。
- `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts:201` 创建异步任务清单；`Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts:212` dispatch internal dimension execution。
- `Alembic/lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts:7` 注释列出 rescan 的 snapshot、clean、sourceRef reconcile、Phase 1-4、coverage、gap、async fill。
- `Alembic/lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts:174` 处理 cleanup policy；`Alembic/lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts:245` sourceRef reconcile；`Alembic/lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts:265` Project Intelligence；`Alembic/lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts:488` gap analysis；`Alembic/lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts:553` dispatch rescan dimension execution。

结论：数据挖掘阶段已有大量日志点，但格式产出、candidate submit、dimensionDigest、checkpoint 和 skill hook 没有被统一映射到前端过程事件。这解释了用户观察到的“数据挖掘阶段信息有，格式产出阶段静默”。

### Agent / LLM 富信息

- `AlembicAgent/src/agent/service/AgentRunContracts.ts:170` `AgentRunExecutionOptions` 已有 `onProgress` 和 `onToolCall` 回调。
- `AlembicAgent/src/agent/service/AgentRunContracts.ts:206` `AgentRunResult` 返回 `reply`、`phases`、`toolCalls`、`usage`、`diagnostics`。
- `AlembicAgent/src/agent/service/AgentService.ts:45` 是 AgentService run 入口；`AlembicAgent/src/agent/service/AgentService.ts:91` 明确冷启动监控依赖 runtime execute start 日志；`AlembicAgent/src/agent/service/AgentService.ts:97` 调用 runtime.execute。
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts:640` 每轮迭代准备阶段会 emit `thinking` progress。
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts:648` 注入 nudge；`AlembicAgent/src/agent/runtime/AgentRuntime.ts:655` 只打印日志。
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts:841` 构建 LLM 输入消息；`AlembicAgent/src/agent/runtime/AgentRuntime.ts:853` 打印 LLM call start；`AlembicAgent/src/agent/runtime/AgentRuntime.ts:925` 打印 LLM call complete。
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts:1125` 工具调用前 emit `tool_call` progress；`AlembicAgent/src/agent/runtime/AgentRuntime.ts:1232` 后续会 emit `tool_end`。
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts:1270` 注入 transition nudge；`AlembicAgent/src/agent/runtime/AgentRuntime.ts:1402` 收到 final answer。
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts:1739` `#emitProgress()` 已能把 runtime progress 交给 `onProgress`，但当前 bootstrap 维度输入没有把它桥接到 job process events。
- `AlembicAgent/src/agent/context/exploration/NudgeGenerator.ts:160` 生成阶段转换提示；`AlembicAgent/src/agent/context/exploration/NudgeGenerator.ts:307` 生成显式反思 nudge，且 `NudgeGenerator.ts:380` 会把 reflection 写入 trace。

结论：Agent 侧已经具备可展示的“输入 / 显式反思 / 可见输出 / 工具调用”原材料。第一版应通过 `AgentRunExecutionOptions.onProgress/onToolCall` 和 bootstrap 维度 result projection 捕获，而不是读取 stderr 或隐藏推理。

### Dimension 投影与格式产物

- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapInputBuilders.ts:44` 构建维度 `AgentRunInput`，包含 message、metadata、fileCache、systemRunContext、strategyContext、trace、promptContext。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionRuntimeBuilder.ts:209` 创建 `SystemRunContext`，并在 `BootstrapDimensionRuntimeBuilder.ts:234` 放入 computedBudget、dimension config、projectInfo、evidenceStarters、existingRecipes、projectOverview 等输入上下文。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapSessionExecutionBuilder.ts:95` 构建 parent session input；`BootstrapSessionExecutionBuilder.ts:108` 在 child result 回调里消费维度结果。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapSessionExecutionBuilder.ts:279` lazyInputFactory 开始维度执行；`BootstrapSessionExecutionBuilder.ts:374` 打印 dimension start。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProjections.ts:119` 把 `AgentRunResult` 投影为 reply/toolCalls/tokenUsage/phases/diagnostics。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProjections.ts:294` 从 phases 中取 `analyze`、`quality_gate`、`produce`。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProjections.ts:306` 取 analysisText；`BootstrapProjections.ts:356` 找出 knowledge submit tool calls；`BootstrapProjections.ts:393` 组装 producerResult 和 reply。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts:113` 消费 projection；`BootstrapConsumers.ts:197` 保存 dimension report；`BootstrapConsumers.ts:216` 打印分析摘要；`BootstrapConsumers.ts:274` 对过短分析文本补强。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts:306` 解析 / 保存 dimensionDigest；`BootstrapConsumers.ts:322` 保存 submitted candidate summary；`BootstrapConsumers.ts:343` 只 emit 粗粒度 dimension complete；`BootstrapConsumers.ts:360` 组装 dimResult，包含 stages、analysisText、referencedFiles、qualityGate；`BootstrapConsumers.ts:388` 保存 checkpoint。

结论：格式产出阶段不是没有数据，而是没有进入前端事件流。最小真实修复应在 `BootstrapConsumers` 附近把 analyze / gate / produce / submit / digest / checkpoint 转成 process events，并保留 task complete 兼容事件。

### API 与 Dashboard

- `Alembic/lib/http/routes/jobs.ts:32` `DaemonJobApiProgress` 只有 activeTask、counts、percent、sessionId、totalToolCalls。
- `Alembic/lib/http/routes/jobs.ts:71` `GET /jobs` 返回 decorated jobs；`jobs.ts:92` `GET /jobs/:jobId` 返回单个 job；`jobs.ts:107` 和 `jobs.ts:130` 创建 bootstrap / rescan job。
- `Alembic/lib/http/routes/jobs.ts:188` `decorateJobForResponse()` 合并 live session / embedded session；`jobs.ts:261` `buildJobProgress()` 生成 progress；`jobs.ts:545` `extractSessionDiagnostics()` 聚合诊断。
- `Alembic/lib/http/routes/modules.ts:605` `GET /modules/bootstrap/status` 返回 taskManager session 和 active job，用作 socket fallback。
- `AlembicCore/src/daemon/RuntimeContracts.ts:29` 当前 job endpoints 只有 bootstrap/list/rescan，没有 events。
- `AlembicDashboard/src/api.ts:1501` `bootstrap()` 走旧 `/modules/bootstrap`；`api.ts:1523` `getBootstrapStatus()` 轮询 `/modules/bootstrap/status`；`api.ts:1534` `listJobs()`；`api.ts:1538` `getJob()`；`api.ts:1553` `enqueueBootstrapJob()`；`api.ts:1561` `enqueueRescanJob()`。
- `AlembicDashboard/src/hooks/useBootstrapSocket.ts:161` 处理 `bootstrap:started`；`useBootstrapSocket.ts:203` 处理 task completed；`useBootstrapSocket.ts:250` 处理 all completed；`useBootstrapSocket.ts:318` 注册 `bootstrap:*` 事件。
- `AlembicDashboard/src/components/Views/JobsView.tsx:157` 任务页加载 `api.listJobs({ compact: true })`；`JobsView.tsx:178` active job 每 2.5 秒轮询；`JobsView.tsx:420` 展示 RuntimeStateBlock；`JobsView.tsx:422` 展示 ProgressBlock；`JobsView.tsx:426` 展示 EfficiencyBlock。
- `AlembicDashboard/src/components/Views/BootstrapProgressView.tsx:68` task card 展示单维度状态；`BootstrapProgressView.tsx:153` 完成后只显示候选 / feature 计数；`BootstrapProgressView.tsx:418` 渲染冷启动卡片；`BootstrapProgressView.tsx:512` 只渲染 task cards 网格。

结论：Dashboard 已有两个合适入口。Jobs 页面适合完整可展开 timeline；BootstrapProgressView 适合用户要求的候选页 / 冷启动卡片轻量摘要和跳转入口。前端不应直接读取 raw logs，而应通过新增 API / socket event 获取 developer view model。

## 关键缺口

1. 缺少 process event schema：没有区分 `workflow`、`llm.input`、`llm.reflection`、`llm.output`、`tool`、`artifact`、`error`。
2. 缺少持久化：JobStore 只保存 job 终态与 result，不保存 bounded timeline，刷新后无法恢复 LLM 过程信息。
3. 缺少 Agent 到 job 的桥接：AgentRuntime 有 `onProgress` / `onToolCall`，但 bootstrap 维度 input 没把这些事件转换成 job process event。
4. 缺少 format / artifact 阶段事件：analysisText、producerResult、dimensionDigest、checkpoint、skill hook 都在 workflow 内被消费，没有出现在前端。
5. API 缺少 `GET /jobs/:jobId/events` 或等价 process endpoint；RuntimeContracts 也没有 capability 宣告。
6. Dashboard 只消费 compact job progress 和 bootstrap task 状态，没有完整 timeline、分类折叠、输入 / 输出分离和最近任务恢复。
7. AlembicTest 需要后续真实项目验证，但当前还没有测试单；需等前后端实现形成可验证 UI 后再通过测试交流文档创建测试单。

## 推荐实现依赖顺序

1. 先定义最小 contract：`JobProcessEvent`、`JobProcessDeveloperView`、分类、`sourceClass` / `displayPolicy`、retention 上限、API 响应 shape。若 Dashboard 和 Alembic 都要消费，contract 优先放 AlembicCore。已归类为 developer-facing 的既有日志、workflow 文案、LLM 输入和 LLM 可见输出默认完整展示，不额外截断或特殊脱敏；密钥、token、内部配置、原始 provider payload 和隐藏推理应在数据源分类阶段排除出开发者视图。
2. Alembic 实现 recorder：绑定 jobId / bootstrapSessionId，支持 append、recent list、terminal snapshot，并广播 live event。
3. Alembic 接入 producer：cold-start / rescan workflow 粗阶段、Agent runtime progress、LLM call metadata、nudge / reflection、visible output、tool call、dimension projection、digest、checkpoint、error。
4. Alembic API 暴露：新增 job process events / process view endpoint，job list 可带最近摘要但不塞完整 timeline。
5. Dashboard 消费：Jobs 页面完整 timeline，BootstrapProgressView 只展示摘要 / 最新关键事件 / 跳转入口。
6. AlembicTest 验证：在 BiliDili 或真实测试项目跑 cold-start，验证后台任务页持续更新、刷新恢复、输入输出分离、格式产出不静默、developer-facing 内容完整呈现，且密钥、token、内部配置、原始 provider payload 和隐藏推理不进入前端。

## 不建议的路线

- 不建议只把现有中文日志搬到前端，因为这会把临时开发文案变成 contract。
- 不建议只做前端 mock timeline，因为无法验证真实 LLM / workflow 过程。
- 不建议第一版直接做长期日志浏览器，因为用户明确只保留最近任务，长期分析靠日志与 AI 总结。
- 不建议让 `AlembicPlugin` 参与第一版实现；该需求是 Alembic resident daemon + Dashboard UI 的可观察能力，Plugin 只观察。
- 不建议把 process event 全部塞进 `DaemonJobRecord.result`，因为 job result 可能很大、终态冻结，并且列表接口需要 compact。

## 待目标阶段确认的问题

- 第一阶段 contract 是否由 AlembicCore 先定义，还是 Alembic 内部先落地后再抽 Core。总控建议：因为 Dashboard、Alembic、AlembicTest 都会引用事件 shape，先由 AlembicCore 定义最小稳定 contract，避免前后端私造字段。
- 第一版 live 通道用现有 Socket.io 还是先轮询。总控建议：事件生产时同时写入持久化和通过现有 RealtimeService broadcast；Dashboard 先用 polling 恢复 + 可选 socket append，避免刷新丢事件。
- Rescan 第一版是否完整 UI。总控建议：后端事件模型覆盖 bootstrap/rescan kind，但 UI 验收先以 cold-start 为主；rescan 不做完整验收门禁。
