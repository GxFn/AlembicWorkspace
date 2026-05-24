# 冷启动与增量扫描前端持续输出展示 - 目标阶段确认

状态：已确认，已进入 Wave 1 执行计划
维护窗口：AlembicWorkspace
创建时间：2026-05-24
对应 TODO：`GTODO-2026-05-23-028`

## 用户原始目标

```text
我想把冷启动和增量扫描过程中的信息在前端页面有一个持续输出展示。
```

用户补充：展示入口在候选页冷启动卡片和后台任务页；第一版不做原始日志 UI；展示类似 Codex 工具调用的有价值可展开过程信息；输入提示、显式反思和 LLM 可见输出要分类清楚；LLM 输出先轻量处理；第一版可以先 cold-start；只保留最近任务；展示目的是帮助开发者看清输入给 LLM 的内容、LLM 可见输出和后续处理结果，从而持续优化冷启动。

## 总控理解

- 目标：建立 cold-start / rescan process observability，让开发者在 Dashboard 看到真实任务过程，而不是只看到 percent 和最终结果。
- 关键约束：前端展示给开发者看，machine / AI event 给机器和后续 AI 分析看，两者不能混成同一种格式。
- 不能偏离的边界：不做原始日志查看器，不展示隐藏推理，不让 Dashboard 解析 debug log，不把 Plugin 拉入 Dashboard 链路，不改真实测试项目源码。
- 用户已确认点：第一波按 `AlembicCore` contract + `Alembic` recorder/API 路线推进；第一版验收以 cold-start 为硬门禁，rescan 复用事件模型后续 polish；developer-facing 的现有日志 / workflow 文案 / LLM 输入与可见输出默认完整展示，不额外截断，也不做特殊脱敏。

## 前置需求设计

- 原始计划书：[../../requirement-designs/scan-progress-live-output/original-plan-2026-05-23.md](../../../../requirement-designs/scan-progress-live-output/original-plan-2026-05-23.md)
- 需求设计文档：[../../requirement-designs/scan-progress-live-output/requirement-design-2026-05-24.md](../../../../requirement-designs/scan-progress-live-output/requirement-design-2026-05-24.md)
- 代码实现依赖调研：[../../requirement-designs/scan-progress-live-output/code-implementation-dependency-research-2026-05-24.md](../../../../requirement-designs/scan-progress-live-output/code-implementation-dependency-research-2026-05-24.md)
- 调研结论：当前已有 job/session/socket/progress 粗链路，但缺 process event schema、持久化、Agent bridge、format artifact events、events API 和 Dashboard timeline。
- 当前已有能力：JobStore、BootstrapTaskManager、DaemonJobRunner、jobs API、AgentRunResult phases/toolCalls/diagnostics、AgentRuntime progress callback、Dashboard Jobs 页面和 BootstrapProgressView。
- 主要缺口：富信息未变成可恢复、可分类、可展示的 process event。
- 功能闭环：job 过程事件生产 -> 持久化 recent events -> API / socket -> Dashboard timeline / card summary -> AlembicTest 真实验证。
- 生产方 / 消费方：`AlembicCore` 定义 contract，`Alembic` 生产和提供 API，`AlembicAgent` 提供 / 增强 Agent runtime events，`AlembicDashboard` 消费展示，`AlembicTest` 验证。
- 本确认文档对需求设计文档的调整：第一阶段明确建议先 Core contract + Alembic recorder/API；第一版验收以 cold-start 为硬门禁，rescan 先承载模型。

## 最终完成定义

最终目标：开发者能在 Dashboard 通过候选页 cold-start 卡片和后台任务页完整 timeline，持续观察并复盘真实 cold-start 过程，清楚看到 Alembic 给 LLM 的输入、workflow 显式反思 / 自检、LLM 可见输出、工具调用、产物生成和失败 / 降级原因；这些数据必须来自真实 workflow / Agent / artifact 事件，并经过 machine process event 与 developer view model 分层，最后由 `AlembicTest` 真实项目验证闭环。

- 用户场景完成：开发者能在后台任务页看到 cold-start 的完整可展开过程，在候选页 / cold-start 卡片看到摘要和入口。
- 功能 / 边界完成：真实 workflow / Agent / artifact 事件进入 process event；Dashboard 不读 raw log；Plugin 不参与 Dashboard。
- 输入输出和状态变化完成：machine process event 与 developer view model 分离；events 有 retention、sourceClass / displayPolicy；刷新可恢复最近任务；developer-facing 内容完整展示，非展示源不误投前端。
- 跨仓库消费完成：Core contract 被 Alembic 和 Dashboard 对齐；Alembic API 被 Dashboard 真实消费。
- 删除 / 保留完成：不删除现有 bootstrap task progress；旧 progress 作为兼容摘要保留，新增 process events 不替代现有 task lifecycle。
- 文档和证据完成：各窗口回填实现范围、提交 hash、验证命令、风险；总控更新 TODO / 状态 / 测试交流。
- 验证完成：Core / Alembic / Agent / Dashboard 对应 check 通过；AlembicTest 至少完成一次真实 cold-start 展示闭环验证。
- 完成判定：Core contract、Alembic recorder/API/producer、Dashboard 双入口 UI 和 AlembicTest 真实验证缺一不可；不得用纯接口、mock timeline、局部日志展示或未验证 UI 代替完整实现。

## 非目标

- 不做原始日志查看器。
- 不把 rescan 完整 UI polish 作为第一版硬门禁。
- 不展示隐藏模型推理、密钥、token、完整敏感配置或原始 provider payload；已归类为 developer-facing 的 prompt / workflow 文案 / LLM 可见输出不额外截断或特殊脱敏。
- 不把 Dashboard 接入 Plugin。
- 不把 `DaemonJobRecord.result` 做成长期 timeline 仓库。
- 不改变 cold-start / rescan 核心业务逻辑和候选产出语义。
- 不修改真实测试项目源码。

## 影响范围

最终覆盖窗口：

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>阻塞 | 等待 Core contract 回填后启动 process event recorder、job events API、workflow / Agent producer 接入、socket broadcast。 |
| `AlembicCore`<br>待启动 | `JobProcessEvent` / developer view contract、runtime capability endpoint 类型、sourceClass / displayPolicy / retention 基础 contract。 |
| `AlembicAgent`<br>观察中 | 若 Alembic 无法通过现有 `onProgress` / `onToolCall` 捕获 LLM 输入、nudge、输出，需要增强 Agent progress payload。 |
| `AlembicDashboard`<br>等待上游 | 消费 events API，完成 Jobs timeline 和 cold-start card 摘要入口。 |
| `AlembicPlugin`<br>无任务 | 第一版不接入 Dashboard；只观察后续 Codex handoff 是否要展示 job URL。 |
| `AlembicTest`<br>等待实现 | 后续通过测试交流文档执行真实 cold-start UI 验证。 |

补充说明：

- 新发现的关联仓库 / vendor / artifact：暂无。日常本地源码模式不触碰 vendor。
- 当前不纳入原因：`AlembicPlugin` 与 Dashboard 展示链路无直接消费方；真实测试项目只由 `AlembicTest` 验证。

## 依赖链判断

| 上游产出 | 生产窗口 | 消费窗口 | 派发判断 |
| --- | --- | --- | --- |
| Process event contract | `AlembicCore` | `Alembic` / `AlembicDashboard` | 第一波可启动；没有 contract 下游容易私造字段。 |
| Event recorder + API | `Alembic` | `AlembicDashboard` / `AlembicTest` | 依赖 contract；可与 Core 同波协同，但 Dashboard 等待 API。 |
| Agent runtime richer progress | `AlembicAgent` 或 `Alembic` adapter | `Alembic` producer | 先由 Alembic 尝试用现有 callbacks；不足再派 Agent。 |
| Dashboard timeline / card | `AlembicDashboard` | 开发者 / `AlembicTest` | 等 API contract 和至少一个真实 producer 事件完成后派发。 |
| 真实项目 UI 验证 | `AlembicTest` | 总控验收 | 等 Dashboard + Alembic 实现后创建测试单。 |

原则：

- 上游 contract / API / artifact / schema / evidence 未完成前，下游只能是 `阻塞` 或 `观察中`。
- 不允许 Dashboard 先猜字段或用 mock timeline 伪装完成。

## 阶段计划

| 阶段 | 目标 | 前置条件 | 完成标准 | 当前可派发窗口 | 不派发窗口 |
| --- | --- | --- | --- | --- | --- |
| 1 | Contract + recorder/API 基础 | 用户确认本目标阶段计划 | Core contract 存在；Alembic 能 append / read recent process events；job API 返回 developer view；现有 progress 不破坏。 | `AlembicCore`、`Alembic` | `AlembicDashboard`、`AlembicAgent`、`AlembicTest`、`AlembicPlugin` |
| 2 | Cold-start / Agent producer 接入 | 阶段 1 回填 contract 和 API | cold-start workflow、Agent progress、LLM visible output、tool、artifact、digest、checkpoint 产生真实事件。 | `Alembic`，必要时 `AlembicAgent` | `AlembicDashboard` 等 API 稳定 |
| 3 | Dashboard 双入口展示 | 阶段 1/2 API 与事件样例完成 | Jobs 页面 timeline；cold-start card 摘要入口；输入 / 反思 / 输出分组清楚。 | `AlembicDashboard` | `AlembicTest` 等 UI 完成 |
| 4 | 真实项目验证与收口 | 阶段 3 完成 | AlembicTest 验证 cold-start 持续展示、刷新恢复、后半程不静默、敏感信息不展示；总控归档。 | `AlembicTest` | `BiliDili` 只作测试目标，不派发 |

## 当前阶段判断

- 当前阶段：Wave 1 Phase 1A，先启动 `AlembicCore` process event contract。
- 为什么先做这一阶段：需求已确认，真实代码调研发现必须先确定 process event contract 与持久化 / API，否则 Dashboard 会猜字段。
- 为什么不先做其它阶段：Dashboard 没有真实事件数据源；AlembicTest 没有可验证 UI；Agent 是否需要改动取决于 Alembic adapter 能否利用现有 callbacks。
- 本阶段形成的功能闭环：确认后第一波将形成最小“事件可写、可读、可恢复、可广播”的后端闭环。
- 下一处真实阻塞点：Core/Alembic contract 与 recorder/API 未完成前，Dashboard 不能做真实 timeline。
- 阻塞点之前还能一波完成的主线动作：Core contract 先定字段、分类、capability 和测试样例；Alembic 在 Core 回填后进入同一 Wave 的 Phase 1B recorder/API。
- 当前可启动窗口：`AlembicCore`。
- 等待窗口：`Alembic`、`AlembicDashboard`、`AlembicAgent`、`AlembicTest`。
- Wave 执行计划：[scan-progress-live-output-wave-2026-05-24.md](scan-progress-live-output-wave-2026-05-24.md)。

## 第一波任务包候选

本节已由用户确认并迁移到 Wave 执行计划。当前只发送 `AlembicCore`；`Alembic` 等 Core contract 回填后再启动，避免下游猜字段。

- 下一处真实阻塞点：无统一 process event contract 和 recorder/API。
- 阻塞点之前还能做：Core contract、Alembic event store/API、最小 workflow stage event、现有 progress 兼容检查。

| 任务包 ID | 窗口 | 阶段目标 | 主线动作 | 可合并 TODO | 明确不包含 | 阻塞 / 依赖 | 验证命令 | 回填要求 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SPLO-P1-Core | `AlembicCore` | 定义最小 process event contract | 新增 `JobProcessEvent`、developer view、event kind、runtime job endpoint capability、sourceClass / displayPolicy / retention contract；更新 exports 和测试。 | `GTODO-028-A` | 不实现 daemon / UI / Agent runtime。 | Wave 1 Phase 1A 启动。 | `npm run build:check`、相关 contract tests。 | 提交 hash、exports、测试结果、字段说明、给 Alembic/Dashboard 的消费说明。 |
| SPLO-P1-Alembic | `Alembic` | 建立 recorder/API 基础 | 接入 Core contract；实现 bounded recent event store；新增 job events endpoint；广播 process event；cold-start workflow 至少记录 reset / phase / session / dimension start / complete / artifact 基础事件；保留现有 progress。 | `GTODO-028-B` | 不做 Dashboard UI；不强行改 Agent internals；不把 raw log 搬到 API。 | 需要 Core contract；可同波但必须等 Core 回填字段后对齐。 | `npm run build:check`、相关 jobs/http tests、必要 smoke。 | 提交 hash、API 示例、event 样例、兼容说明、未覆盖 Agent 细节。 |

## 验证策略

- 每波最低验证：对应仓库 typecheck / build / targeted tests；workspace 文档校验由总控执行。
- 阶段完成验证：Core contract tests；Alembic jobs API targeted tests；Dashboard build；AlembicTest 真实项目 smoke。
- 功能完整性验收：
  - 真实入口：Dashboard `/jobs` 与 cold-start card。
  - 真实数据来源：Alembic daemon job / bootstrap session / Agent runtime callbacks / workflow projections。
  - 状态 / 数据变化：event store 持久化 recent events，API 可恢复，socket 可实时 append。
  - 真实消费方：Dashboard JobsView 和 BootstrapProgressView。
  - 错误 / 边界路径：失败、取消、timeout、degraded、刷新恢复、developer-facing 内容完整展示、非展示源不进入前端。
  - 用户可执行验证：启动 cold-start，打开后台任务页观察 timeline，刷新页面后查看最近事件。
  - 若发现最小实现：补齐真实 producer、API 或 UI，不能把 mock / 静态事件标为完成。
- 稳定面统一验收：总控验收所有回填、TODO、测试交流和归档。
- 真实项目 smoke 触发条件：Dashboard 能消费事件后创建 `AlembicTest` 测试单。

## 风险与确认问题

- 风险：事件数量过大，必须 bounded retention；但单条 developer-facing 内容第一版不额外截断。
- 风险：prompt / LLM output 可能混入非展示源，必须在数据源分类阶段区分 developer-facing、machine-only、raw-provider、secret；不要靠前端默认截断 / 脱敏掩盖边界。
- 风险：Agent runtime 中 DeepSeek reasoningContent 存在，但用户要求不是隐藏推理；第一版不得展示 reasoningContent。
- 风险：Dashboard 先做 UI 会导致 mock 化；必须等 API 样例。
- 需要用户确认：
  - 是否确认第一波按 `AlembicCore` contract + `Alembic` recorder/API 先行？
  - 是否确认第一版验收以 cold-start 为硬门禁，rescan 完整 UI 放后续？
  - LLM 输入 / 反思 / 输出展示策略：已确认 developer-facing 内容完整展示，不额外截断或特殊脱敏；非展示源不进入前端。
- 当前派发状态：进入 Wave 1 Phase 1A，只发送 `AlembicCore`。

## 窗口分派

确认已完成；具体发送名单以 Wave 执行计划为准。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>阻塞 | 等待 `AlembicCore` contract 回填后参与 Phase 1B recorder/API。 |
| `AlembicCore`<br>待启动 | Wave 1 Phase 1A：定义 process event contract。 |
| `AlembicAgent`<br>观察中 | 第一波先观察；只有 Alembic 无法利用现有 callbacks 时再派发。 |
| `AlembicDashboard`<br>阻塞 | 等待 Core/Alembic API 与事件样例。 |
| `AlembicPlugin`<br>无任务 | 第一版无直接任务。 |
| `AlembicTest`<br>阻塞 | 等待实现完成后创建测试单。 |
| `BiliDili`<br>无任务 | 只作为 AlembicTest 可选真实项目目标，不改源码。 |

## 可复制提示词

发送给：`AlembicCore`

```text
先读取 AGENTS.md、docs/workspace/index.md、docs/workspace/current/scan-progress-live-output-wave-2026-05-24.md，以及 AlembicCore/AGENTS.md；先明确声明当前窗口定位和本轮仓库职责，只领取并完成 SPLO-P1-Core；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`Alembic`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`、`BiliDili`。

## 回填区

### 用户确认

- 状态：已确认
- 确认时间：2026-05-24 00:39 CST
- 用户调整：确认第一波按 Core contract + Alembic recorder/API 路线推进，确认第一版以 cold-start 为硬门禁；补充 developer-facing 现有日志 / workflow 文案 / LLM 输入与可见输出安全且完整，第一版最好不要额外截断，也不需要特别脱敏；展示用于帮助开发者优化 cold-start。

### 确认后第一波

- 启动文档：[scan-progress-live-output-wave-2026-05-24.md](scan-progress-live-output-wave-2026-05-24.md)
- 发送窗口：`AlembicCore`
- 阻塞窗口：`Alembic`、`AlembicDashboard`、`AlembicTest`
- 观察窗口：`AlembicAgent`
- index 当前计划是否已切到 wave 执行计划：是
