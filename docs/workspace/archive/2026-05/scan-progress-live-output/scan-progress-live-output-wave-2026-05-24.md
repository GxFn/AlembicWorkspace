# 冷启动与增量扫描前端持续输出展示 - Wave 1 执行计划

状态：已完成 / 已归档
维护窗口：AlembicWorkspace
创建时间：2026-05-24
状态更新时间：2026-05-24 12:46 CST
对应 TODO：`GTODO-2026-05-23-028`

## 来源与用户确认

- 原始计划书：[../../requirement-designs/scan-progress-live-output/original-plan-2026-05-23.md](../../../../requirement-designs/scan-progress-live-output/original-plan-2026-05-23.md)
- 需求设计：[../../requirement-designs/scan-progress-live-output/requirement-design-2026-05-24.md](../../../../requirement-designs/scan-progress-live-output/requirement-design-2026-05-24.md)
- 代码实现依赖调研：[../../requirement-designs/scan-progress-live-output/code-implementation-dependency-research-2026-05-24.md](../../../../requirement-designs/scan-progress-live-output/code-implementation-dependency-research-2026-05-24.md)
- 目标阶段确认：[scan-progress-live-output-goal-stage-confirmation-2026-05-24.md](scan-progress-live-output-goal-stage-confirmation-2026-05-24.md)

用户已确认：

- 第一波按 `AlembicCore` process event contract + `Alembic` recorder/API 路线推进。
- 第一版以 cold-start 展示闭环为硬门禁；rescan 复用同一事件模型，完整 UI polish 后续再做。
- 已归类为 developer-facing 的现有日志、workflow 文案、LLM 输入和 LLM 可见输出默认完整展示，不额外截断，不做特殊脱敏。
- 展示面是为了让开发者看清 Alembic 输入给 LLM 的内容、LLM 输出的内容、后续如何解析与产出，从而优化 cold-start 提示词、阶段策略、产物格式和失败处理。

## 当前目标

建立 cold-start / rescan process observability 的第一段真实闭环：

1. `AlembicCore` 先定义稳定 process event contract、developer view contract、runtime capability endpoint 和展示源分类。
2. `Alembic` 在 Core 回填后实现 recorder、events API、socket broadcast 和最小 workflow producer。
3. `AlembicDashboard` 等 API 与事件样例完成后再做 Jobs timeline 和 cold-start 卡片摘要。
4. `AlembicTest` 等前后端实现后创建真实项目验证单。

当前下一处真实阻塞点：无。`Test-2026-05-24-03` 已通过总控验收，修复资产环境下 Dashboard 不再触发 React #31，已有 `llm.input` structured `content.text` 可读；同一打开页面最终从 19 events 追加到 38 events，包含 `tool=3`、`llm.output=3`、`llm.reflection=4`，无需刷新即可看到 rich content text。

阻塞点之前还能做什么：主线目标已完成，当前无发送窗口；下一步可以归档本 wave 或开启新主线。

## 最终目标

本主线的最终目标不是“后端有事件接口”或“前端能显示几条日志”，而是让开发者在真实 cold-start 运行过程中和运行后，都能通过 Dashboard 复盘完整过程：

- 候选页 cold-start 卡片提供当前状态、最近关键事件和进入后台任务详情的入口。
- 后台任务页提供完整、可展开、可刷新恢复的过程 timeline。
- timeline 数据来自真实 cold-start workflow、Agent runtime、LLM 调用、工具调用和 artifact / checkpoint 产出，不使用 mock timeline、不让 Dashboard 解析 debug log、不只展示最终结果。
- 开发者能清楚看到 Alembic 输入给 LLM 的内容、workflow 显式反思 / 自检 / 候选选择说明、LLM 可见输出、解析结果、产物生成、失败 / 降级 / 取消原因。
- 数据层同时产出 machine process event 与 developer view model：developer-facing 内容完整展示，不额外截断或特殊脱敏；machine-only、raw-provider、secret、隐藏推理不进入开发者前端。
- 至少一次真实项目 cold-start 由 `AlembicTest` 验证通过，证明持续更新、后半程不静默、刷新可恢复和双入口展示都形成真实闭环。

只有 Core contract、Alembic recorder/API/producer、Dashboard 双入口 UI 和 AlembicTest 真实验证全部有处理结论与证据，本主线才算完成。rescan 完整 UI polish 可以作为后续 TODO，但事件模型必须能承载 rescan，不得把 cold-start 的完整实现降级成纯接口或局部展示。

## 完成定义

- Core contract 可被 Alembic / Dashboard 消费，不是空接口。
- Contract 明确区分 machine process event 与 developer view model。
- Contract 支持 `workflow`、`llm.input`、`llm.reflection`、`llm.output`、`tool`、`artifact`、`error`、`summary` 等基础类别或可扩展等价类别。
- Contract 明确 `sourceClass` / `displayPolicy`：developer-facing 内容默认完整展示；machine-only、raw-provider、secret 不进入开发者前端。
- Runtime capability 能声明 job events endpoint，供 Alembic resident service 和 Dashboard 后续对齐。
- Contract tests / build checks 通过，并回填给 Alembic 的消费建议。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 / 推荐窗口 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `GTODO-2026-05-23-028-A` | 已完成 | contract | P0 | `AlembicCore` | 定义 `JobProcessEvent` / developer view 最小 contract、分类、sourceClass / displayPolicy、retention、typed artifact / dimension fields 和 runtime capability endpoint。 | 是 | Core 返工提交 `36429274352a5f75b2aa3eb17eacf63a0986f9f2` 已通过总控验收。 |
| `GTODO-2026-05-23-028-B` | 已完成 | producer/API | P0 | `Alembic` | 实现 process event recorder、job events API、socket broadcast、workflow / artifact 事件生产。 | 是 | Alembic 提交 `c2be849fdec50a6a5dbd2daa20ba4621b620721b` 已通过总控验收。 |
| `GTODO-2026-05-23-028-C` | 已完成 / 复测通过 | agent bridge | P0 | `Alembic` / `AlembicAgent` | 把 Agent progress、tool call、nudge / reflection、LLM 可见输入 / 输出接入 job process event；必要时增强 Agent progress payload。 | 是 | `Test-2026-05-24-02` 复测确认 events API 已产出 `llm.input=2`、`tool=1`、`llm.output=1`、`llm.reflection=1`。 |
| `GTODO-2026-05-23-028-D` | 已完成 | dashboard | P0 | `AlembicDashboard` | Jobs 页面 timeline + cold-start 卡片摘要入口，输入 / 反思 / 输出 / 工具 / 产物分组展示。 | 是 | Dashboard 返工提交 `43f45bec9c988e837cdf2c153ffd4cec11e83526` 已通过总控验收。 |
| `GTODO-2026-05-23-028-E` | 已完成 / producer gap 已验收 | test | P0 | `AlembicTest` | 真实项目 cold-start 展示验证，覆盖持续更新、刷新恢复、后半程产物事件和非展示源不进入前端。 | 是 | 测试报告 [../../../AlembicTest/docs/cold-start-process-timeline-test-2026-05-24.md](../../../../../AlembicTest/docs/cold-start-process-timeline-test-2026-05-24.md)；总控验收结论为链路通过但 producer richness 未闭合。 |
| `GTODO-2026-05-23-028-F` | 后续 | rescan polish | P2 | `Alembic` / `AlembicDashboard` / `AlembicTest` | rescan 完整 UI polish 和验收；第一版只要求 event model 可承载 rescan。 | 否 | cold-start 第一版稳定后。 |
| `GTODO-2026-05-23-028-G` | 已完成 / 复测通过 | dashboard usability | P0 | `AlembicDashboard` | 修复 Jobs 页面展开任务详情 / process timeline 长内容区域不能滚动的问题，确保开发者能阅读完整事件、诊断和 chips。 | 是 | `Test-2026-05-24-02` DOM 证据确认 `scrollHeight=13747`、`clientHeight=591`、`scrollTop 0 -> 1800`，rich events 可滚动可读。 |
| `GTODO-2026-05-23-028-H` | 已验收 / 部分通过 | test | P0 | `AlembicTest` | 真实项目复测 Phase 1E 修复：验证 rich process events kind counts、socket / REST 恢复、Jobs timeline 长内容滚动和 cold-start 卡片入口。 | 是 | 报告 [../../../AlembicTest/docs/cold-start-process-events-retest-2026-05-24.md](../../../../../AlembicTest/docs/cold-start-process-events-retest-2026-05-24.md)；API / REST / scroll / card 通过，live socket append rich content React #31 已转 `GTODO-2026-05-23-028-I`。 |
| `GTODO-2026-05-23-028-I` | 已完成 / 复测通过 | dashboard bug | P0 | `AlembicDashboard` | 修复 live socket append rich content 渲染：late `tool` / `llm.output` / `llm.reflection` event append 时不得把 structured `content` object 直接作为 React child。 | 是 | Dashboard 提交 `c1c7a1a4fcd5d724d86734be47ef6fff745b262d` 已通过总控代码证据验收；`Test-2026-05-24-03` 已确认新 Dashboard 不再 React #31。 |
| `GTODO-2026-05-23-028-J` | 已完成 / 通过 | test | P0 | `AlembicTest` | Dashboard live append 修复后做最小复测，只验证打开 Jobs 页面等待 rich events socket append 不再 React #31，并能直接看到 `tool` / `llm.output` / `llm.reflection`。 | 是 | 报告 [../../../AlembicTest/docs/live-socket-append-rich-content-retest-2026-05-24.md](../../../../../AlembicTest/docs/live-socket-append-rich-content-retest-2026-05-24.md)：新 Dashboard 未触发 React #31，同一打开页面最终追加到 38 events，包含 `tool=3`、`llm.output=3`、`llm.reflection=4` 且 rich text 可见。 |

## 阶段任务包

### SPLO-P1-Core

- 窗口：`AlembicCore`
- 派发时间：2026-05-24 00:50 CST
- 状态更新时间：2026-05-24 09:50 CST
- 完成状态：已完成，返工后总控验收通过。
- 阶段目标：定义 cold-start / rescan process event 的最小共享 contract，让 Alembic 后续能真实记录、读取和广播过程事件。
- 主线动作：新增 `JobProcessEvent`、`JobProcessDeveloperView`、event kind、sourceClass / displayPolicy、retention、runtime job endpoint capability；更新 package exports 和相关 contract tests。
- 合并 TODO：`GTODO-2026-05-23-028-A`
- 明确不包含：不实现 daemon / HTTP / Dashboard UI / Agent runtime；不创建空 provider 或无消费方 adapter；不把截断 / 脱敏作为 developer-facing 内容默认策略。
- 下一处真实阻塞点：Core contract 未完成前，Alembic / Dashboard 字段会分叉。
- 阻塞点之前还能做：先把字段、分类、endpoint capability、完整展示策略和测试样例定清楚，给 Alembic Phase 1B 消费。
- 验证命令：`npm run build:check`，并运行新增 / 受影响 contract tests。
- 回填要求：提交 hash、exports 路径、contract 字段说明、验证结果、给 Alembic / Dashboard 的消费建议、遗留风险。
- 执行前置硬规则：先读取 workspace `AGENTS.md`、本执行计划、`AlembicCore/AGENTS.md`；开始前明确声明当前窗口定位和本轮仓库职责。

#### SPLO-P1-Core 回填

- 前次提交 hash：`19b501e6525e49f5c1c33e7e75308e1f973c64de`。
- 执行记录：[../../AlembicCore/scan-progress-live-output-core-contract-2026-05-24.md](../../../../AlembicCore/scan-progress-live-output-core-contract-2026-05-24.md)。
- 导出路径：`@alembic/core/daemon`。
- 新增 contract：`JobProcessEvent`、`JobProcessDeveloperView`、`JobProcessEventEndpointCapability`、event kind、sourceClass、displayPolicy、retention、runtime job events endpoint。
- 关键策略：`developer-facing` 默认 `full` + `job-retained`；`machine-only` 默认 `hidden` + `job-retained`；`raw-provider`、`secret`、`hidden-reasoning` 默认 `hidden` + `transient`。
- 验证命令与结果：`npm run build:check`、targeted contract tests、`npm run lint`、`npm run check`、`npm run build`、`npm run smoke:public-api`、`git diff --check` 均通过。
- 遗留风险：Core 不实现 recorder / HTTP / socket / UI；`Alembic` 仍需落地事件 ID、sequence、recent retention、持久化窗口和真实 workflow producer。
- 下一步建议：总控验收 Core 回填后启动 `SPLO-P1-Alembic`，由 `Alembic` 从 `@alembic/core/daemon` 消费 contract，实现 recorder、job events API、socket broadcast 和 cold-start 最小事件样例。

#### SPLO-P1-Core 总控验收

结论：返工后总控验收通过，可以启动 `Alembic` Phase 1B。

前次未通过证据（已由返工关闭）：

- `AlembicCore/src/daemon/JobProcessEventContracts.ts:58` 的 `JobProcessEvent` 当前只有 `metadata`、`parentId`、`phase` 等通用字段，未提供回填文档声称的 `dimensionId`、`targetName`、`artifactRefs` 或 `parentEventId` typed 字段。
- `AlembicCore/src/daemon/JobProcessEventContracts.ts:78` 的 `JobProcessDeveloperView` 当前未投影 `artifactRefs` 或 `metadata`，但执行回填文档写明 Dashboard view 会保留 `artifactRefs` 和 `metadata`。
- `AlembicCore/src/daemon/JobProcessEventContracts.ts:111` 的 `JobProcessEventEndpointCapability` 当前只有 `supportedKinds`，未包含执行回填文档写明的 `supportedSourceClasses`、`supportedDisplayPolicies`、`supportedRetentionPolicies`。
- `docs/AlembicCore/scan-progress-live-output-core-contract-2026-05-24.md:58` 到 `82` 的字段说明与上述真实代码不一致。

前次返工要求：

- 补齐 `JobProcessEvent` / `CreateJobProcessEventInput` / normalizer 的 typed 字段：`dimensionId`、`targetName`、`artifactRefs`；将 `parentId` 与文档中的 `parentEventId` 统一，避免 Alembic / Dashboard 猜字段。
- 补齐 `JobProcessDeveloperView` 的产物引用投影，至少让 Dashboard 能直接读取 artifact refs，不依赖不透明 `metadata` 解析。
- 补齐 `JobProcessEventEndpointCapability` 的 `supportedSourceClasses`、`supportedDisplayPolicies`、`supportedRetentionPolicies`，并更新 creator、summary、tests 和 public smoke。
- 更新执行回填文档，让字段说明与真实代码完全一致；如果刻意不暴露某个字段，必须写清替代入口和原因。
- 重新运行 `npm run build:check`、targeted contract tests、`npm run lint`、`npm run check`、`npm run build`、`npm run smoke:public-api`、`git diff --check`，并回填结果。

返工回填：

- 返工提交：`36429274352a5f75b2aa3eb17eacf63a0986f9f2`。
- 执行记录：[../../AlembicCore/scan-progress-live-output-core-contract-2026-05-24.md](../../../../AlembicCore/scan-progress-live-output-core-contract-2026-05-24.md)。
- 完成范围：补齐 `dimensionId`、`targetName`、`artifactRefs`、`parentEventId`；developer view 投影 `artifactRefs` / `dimensionId` / `targetName` / `parentEventId` / `metadata`；endpoint capability 补齐 supported source/display/retention lists；runtime summary、tests、exports 和 public smoke 同步。
- 验证结果：`npm run build:check`、targeted contract tests、`npm run lint`、`npm run check`、`npm run build`、`npm run smoke:public-api`、`git diff --check` 均通过。
- 遗留风险：Core 仍不实现 recorder/API/socket/UI；artifact ref 第一版最小 typed shape 为 `{ kind, ref, label, mimeType }`，后续如需 URL/size/checksum 应 additive 扩展。

返工验收：

- 验收时间：2026-05-24 09:50 CST。
- 验收证据：`AlembicCore/src/daemon/JobProcessEventContracts.ts:65` 已包含 `artifactRefs`、`dimensionId`、`targetName`、`parentEventId`；`JobProcessDeveloperView` 在同文件 `:88` 投影 artifact / dimension / target / parent / metadata；`JobProcessEventEndpointCapability` 在同文件 `:129` 包含 supported source/display/retention policy lists；`RuntimeContracts.ts:179` 以后 runtime summary 暴露对应 lists；测试覆盖返工字段和 capability policy lists。
- 总控结论：`SPLO-P1-Core` 完成，`GTODO-2026-05-23-028-A` 关闭；可启动 `SPLO-P1-Alembic`。

### SPLO-P1-Alembic

- 窗口：`Alembic`
- 派发时间：2026-05-24 09:50 CST
- 状态更新时间：2026-05-24 10:07 CST
- 完成状态：已完成，总控验收通过。
- 阶段目标：建立真实 process event recorder 和 job events API，保留现有 bootstrap progress 兼容，让 Dashboard 下一阶段能消费真实 timeline 数据。
- 主线动作：从 `@alembic/core/daemon` 消费 `JobProcessEvent`、`JobProcessDeveloperView`、`JobProcessEventArtifactRef` 和 capability helpers；实现 bounded recent process event store；新增 `GET /api/v1/jobs/:jobId/events`；通过 RealtimeService / socket broadcast process event；cold-start workflow 至少记录 reset / start / phase / session / dimension start / dimension complete / artifact / error / summary 基础事件。
- 合并 TODO：`GTODO-2026-05-23-028-B`
- 明确不包含：不做 Dashboard UI；不直接展示 raw log；不强行改 Agent internals；不把所有事件塞进 `DaemonJobRecord.result`；不在 Alembic 自建同名 DTO；不把 `jobs.processEvents.available` 置 true 除非真实 endpoint 已可用。
- 下一处真实阻塞点：没有 recorder/API 和真实事件样例，Dashboard 不能开始 timeline。
- 阻塞点之前还能做：完成最小 API、socket broadcast、health capability gating 和 cold-start 事件样例；回填 API 示例和 event 样例给 Dashboard。
- 验证命令：`npm run build:check`、相关 jobs/http targeted tests、必要 smoke、`npm run lint:repo-boundary`、`git diff --check`；若改动触发 lint 或全量 check，按 Alembic AGENTS 补跑对应命令。
- 回填要求：提交 hash、API 示例、event 样例、health capability 示例、验证命令和结果、兼容说明、未覆盖 Agent 细节、下一波是否需要 `AlembicAgent`、给 `AlembicDashboard` 的消费建议。
- 执行前置硬规则：先读取 workspace `AGENTS.md`、本执行计划、`docs/AlembicCore/scan-progress-live-output-core-contract-2026-05-24.md` 和 `Alembic/AGENTS.md`；开始前明确声明当前窗口定位和本轮仓库职责。

#### SPLO-P1-Alembic 回填

- 提交 hash：`c2be849fdec50a6a5dbd2daa20ba4621b620721b`（`feat: expose job process events`）。
- 完成范围：
  - 从 `@alembic/core/daemon` 消费 `JobProcessEvent`、`JobProcessDeveloperView`、`CreateJobProcessEventInput`、`createJobProcessEvent`、`createJobProcessDeveloperView`、`normalizeJobProcessEvent` 和 endpoint capability helper，没有在 Alembic 自建同名 DTO。
  - 新增 `JobProcessEventRecorder`：按 job 维护 bounded recent event store，默认单 job 保留 240 条、全局 2400 条；自动分配 per-job sequence / event id；`raw-provider`、`secret`、`hidden-reasoning` 默认 transient，不进入 recent store。
  - 新增 `GET /api/v1/jobs/:jobId/events`，并在 bootstrap / rescan job 创建响应里回传 `eventsUrl`。
  - `RealtimeService` 新增 `job:process-event` socket broadcast，payload 只包含 Core `JobProcessDeveloperView`，不广播 hidden/raw/secret 内容。
  - daemon health capability 现在通过 Core `createAlembicRuntimeCapabilities` 暴露 `jobs.processEvents.available=true` 和 `jobs.endpoints.events=/api/v1/jobs/:jobId/events`；该状态建立在真实 endpoint 已实现的基础上。
  - `DaemonJobRunner` 接入 recorder：记录 reset / queued / running / session linked / completed / failed / cancelled / artifact / summary 事件；bootstrap cold-start 通过现有 `BootstrapTaskManager` EventBus 事件记录 session start、dimension start、dimension complete、dimension failed、session completed。
- API 示例：

```json
{
  "success": true,
  "data": {
    "jobId": "bootstrap_live",
    "count": 1,
    "retainedCount": 2,
    "nextSequence": 2,
    "hiddenCount": 0,
    "events": [
      {
        "id": "bootstrap_live_process_0002",
        "jobId": "bootstrap_live",
        "sequence": 2,
        "kind": "summary",
        "phase": "dimension",
        "displayPolicy": "full",
        "sourceClass": "developer-facing",
        "title": "Bootstrap dimension completed",
        "summary": "Architecture completed."
      }
    ],
    "developerViews": [
      {
        "eventId": "bootstrap_live_process_0002",
        "jobId": "bootstrap_live",
        "sequence": 2,
        "kind": "summary",
        "phase": "dimension",
        "title": "Bootstrap dimension completed",
        "summary": "Architecture completed."
      }
    ],
    "endpointCapability": {
      "available": true,
      "endpoint": "/api/v1/jobs/:jobId/events"
    }
  }
}
```

- Socket event 示例：

```json
{
  "eventName": "job:process-event",
  "payload": {
    "type": "job_process_event",
    "jobId": "bootstrap_live",
    "eventId": "bootstrap_live_process_0002",
    "sequence": 2,
    "event": {
      "eventId": "bootstrap_live_process_0002",
      "kind": "summary",
      "phase": "dimension",
      "title": "Bootstrap dimension completed"
    },
    "timestamp": 1779588000000
  }
}
```

- Health capability 示例：

```json
{
  "capabilities": {
    "jobs": {
      "endpoints": {
        "events": "/api/v1/jobs/:jobId/events"
      },
      "processEvents": {
        "available": true,
        "endpoint": "/api/v1/jobs/:jobId/events",
        "supportedKinds": ["workflow", "llm.input", "llm.reflection", "llm.output", "tool", "artifact", "checkpoint", "error", "summary"]
      }
    }
  }
}
```

- 最小 cold-start 真实事件样例：
  - `workflow` / `phase=reset`：job 创建后初始化 recorder。
  - `workflow` / `phase=queued|running`：daemon job 入队和开始执行。
  - `workflow` / `phase=session`：`bootstrap:started` 转为 bootstrap session start。
  - `workflow` / `phase=dimension`：`bootstrap:task-started` 转为 dimension start。
  - `summary` / `phase=dimension`：`bootstrap:task-completed` 转为 dimension completed，含 `dimensionId`、`targetName` 和 task metadata。
  - `error` / `phase=dimension|failed`：`bootstrap:task-failed` 或 job failure 转为 error event。
  - `artifact` / `phase=artifact`：job result / final bootstrap session retained，`artifactRefs` 指向 daemon job record 或 bootstrap session logical ref。
  - `summary` / `phase=session|complete|cancelled|failed`：session/job final summary。
- 验证命令与结果：
  - `npm run test:unit -- JobProcessEventRecorder JobsRoute DaemonCapabilities DaemonJobRunner`：通过，4 files / 18 tests。
  - `npm run check`：通过，包含 typecheck、Biome lint、agent extraction boundary、Core import boundary、consumer Core imports。
  - `npm run build:check`：通过，包含 local AlembicCore source build 与 `tsc --noEmit`。
  - `git diff --check`：通过。
  - `npm run test:unit`：普通 sandbox 下因本地 `listen 127.0.0.1` 和 `sandbox-exec` 权限限制失败；按沙箱规则无沙箱重跑通过，114 files / 1099 tests。
- 兼容说明：
  - 现有 `/api/v1/jobs`、`/api/v1/jobs/:jobId`、bootstrap progress 和 BootstrapTaskManager socket 事件保持不变。
  - 事件不写入 `DaemonJobRecord.result`，避免 job result 继续膨胀；endpoint 返回 bounded recent store。历史旧 job 或 daemon restart 后可能没有 process events，Dashboard 需要显示空 timeline / fallback progress。
  - public jobs events route 默认只返回 developer-visible events / views；hidden、raw-provider、secret、hidden-reasoning 不进入 Dashboard 数据源。
- 遗留风险：
  - recorder 是 daemon 进程内 bounded recent store，不是 durable event journal；如果 Dashboard 要展示 daemon restart 前的完整过程，需要后续新增持久化策略。
  - 本轮只用 Alembic 现有 callbacks 捕获 cold-start session / dimension / summary / artifact / error；精确 LLM input/output、tool call、nudge / reflection 仍未完整接入。
  - rescan 可复用同一 event model，但本轮未做 rescan-specific timeline polish。
- 是否需要 `AlembicAgent`：
  - `SPLO-P1-Alembic` 最小闭环不需要立即派发 `AlembicAgent`；现有 Alembic callbacks 足够产生 Dashboard 可消费的真实 cold-start 基础 timeline。
  - 若下一波要求完整展示 LLM 输入、LLM 可见输出、tool call、nudge / reflection 和 Agent 策略自检，建议再派发 `AlembicAgent` 补充 runtime progress payload 或 process event emitter。
- 给 `AlembicDashboard` 的消费建议：
  - 先以 daemon health 的 `capabilities.jobs.processEvents.available` 和 `capabilities.jobs.endpoints.events` 做功能门禁；未 available 时保留现有 progress UI。
  - bootstrap / rescan 创建响应优先使用 `eventsUrl`；刷新后用 `/api/v1/jobs/:jobId/events?afterSequence=<last>` 增量拉取。
  - 同时订阅 socket `job:process-event`，以 `payload.event`（Core `JobProcessDeveloperView`）更新 timeline；断线或刷新后用 REST endpoint 补齐。
  - UI 只渲染 `developerViews` / socket `event`；不要解析 machine `metadata` 来猜产物路径，产物入口使用 `artifactRefs`。
  - 按 `kind`、`phase`、`dimensionId`、`targetName`、`severity` 分组展示；旧 job / 空 event store 应显示“暂无过程事件”并 fallback 到 existing job progress / summary。

#### SPLO-P1-Alembic 总控验收

结论：通过。`SPLO-P1-Alembic` 完成，`GTODO-2026-05-23-028-B` 关闭，可以启动 `SPLO-P1-Dashboard`。

真实代码证据：

- `Alembic/lib/daemon/JobProcessEventRecorder.ts:1` 从 `@alembic/core/daemon` 消费 Core contract；`:55` 定义 bounded recorder；`:72` 记录事件并生成 developer view；`:111` 返回 `events` / `developerViews` / capability。
- `Alembic/lib/http/routes/jobs.ts:102` 暴露 `GET /api/v1/jobs/:jobId/events`；`:140` 和 `:164` 的 bootstrap / rescan job 创建响应已回传 `eventsUrl`。
- `Alembic/lib/infrastructure/realtime/RealtimeService.ts:138` 新增 `job:process-event` socket broadcast，payload 承载 Core developer view。
- `Alembic/lib/http/routes/daemon.ts:138` 通过 Core runtime capabilities 暴露 `jobs.processEvents.available=true` 和 `/api/v1/jobs/:jobId/events`。
- `Alembic/lib/daemon/DaemonJobRunner.ts:56` 在 job 入队时 reset / queued；`:101` 运行时挂 bootstrap bridge；`:386`、`:405`、`:428`、`:467`、`:496` 分别把 bootstrap session / dimension start / dimension complete / dimension fail / session complete 转成 process events；`:629` 以后记录终态 artifact / summary。
- `Alembic/lib/injection/modules/InfraModule.ts:94` 通过 DI 注册 recorder，并在 realtime service 存在时广播 developer-visible event。
- `Alembic/test/unit/JobProcessEventRecorder.test.ts:5` 覆盖记录、developer view broadcast、hidden event 过滤和 bounded list；`Alembic/test/unit/JobsRoute.test.ts:33` 覆盖 process event response；`Alembic/test/unit/DaemonCapabilities.test.ts:76` 覆盖 health capability。

验收说明：

- 本阶段形成了真实后端事件闭环：Core contract -> Alembic recorder -> jobs events API -> socket broadcast -> cold-start 基础事件 producer。
- 本阶段没有完成最终用户目标；Dashboard 仍未展示 timeline，LLM input/output、tool call、nudge / reflection 仍只做基础承载和后续观察，不作为本阶段失败项。
- `GTODO-2026-05-23-028-C` 保持观察中；如果 Dashboard 消费后发现基础事件不足以呈现用户强调的 LLM 输入 / 输出 / 反思，再派 `AlembicAgent` 或 Alembic producer 增强。

## 当前任务包

### SPLO-P1-Dashboard

- 窗口：`AlembicDashboard`
- 派发时间：2026-05-24 10:11 CST
- 状态更新时间：2026-05-24 10:51 CST
- 完成状态：返工后总控验收通过。
- 阶段目标：消费 Alembic 真实 process event API / socket，在 Dashboard 形成开发者可见的 cold-start 后台任务过程 timeline 和 cold-start 卡片摘要入口。
- 主线动作：补齐前端 `JobProcessDeveloperView` / job process events API contract；新增 `api.getJobProcessEvents(jobId, { afterSequence, limit })` 或等价 client；Jobs 页面按 job 拉取最近 events、订阅 `job:process-event` 并断线/刷新后用 REST 补齐；渲染可展开 timeline，按 `kind` / `phase` / `dimensionId` / `targetName` / `severity` 分类展示摘要、content、artifactRefs、错误和空状态；cold-start 卡片显示最近关键事件与进入后台任务详情的入口。
- 合并 TODO：`GTODO-2026-05-23-028-D`
- 明确不包含：不改 Alembic 后端；不 mock timeline；不解析 raw debug log；不从 machine `metadata` 猜产物路径；不直接实现 Agent/AI/tool 逻辑；不把缺失 LLM 细粒度事件伪装成已展示。
- 下一处真实阻塞点：没有 Dashboard UI 消费，开发者无法在前端观察/复盘真实 process events，AlembicTest 也无法做真实 UI 验证。
- 阻塞点之前还能做：完成 Jobs timeline、socket append、REST refresh recovery、cold-start 卡片摘要和 UI empty/error/loading 状态。
- 验证命令：`npm run check`；若当前仓库没有足够 UI 测试，至少补充 API/view-model 单元测试并运行 `npm run build`。复杂 UI 改动需要浏览器或截图验证，若缺少真实后端则回填阻塞和所需后端启动方式。
- 回填要求：提交 hash、API contract / view model 示例、Jobs timeline 截图或文字证据、cold-start 卡片摘要证据、socket/REST 恢复说明、验证命令与结果、遗留风险、是否需要 `AlembicAgent` 或 Alembic producer 继续增强 LLM / tool / nudge 事件。
- 执行前置硬规则：先读取 workspace `AGENTS.md`、本执行计划、`AlembicDashboard/AGENTS.md`；开始前明确声明当前窗口定位和本轮仓库职责。

#### SPLO-P1-Dashboard 回填

- 提交 hash：`fae63c56d3b7e47189c49ee047f4e79a9b060ff2`（`feat: show job process timeline`）。
- 完成范围：
  - `src/api.ts` 新增前端 `JobProcessDeveloperView`、`JobProcessEventsResponse`、`JobProcessArtifactRef`、endpoint capability view-model，并新增 `api.getJobProcessEvents(jobId, { afterSequence, limit })` 消费 `GET /api/v1/jobs/:jobId/events`。
  - `src/hooks/useJobProcessEvents.ts` 统一实现初始 REST 拉取、`afterSequence` REST 恢复刷新、active job 定时补齐、socket `job:process-event` append 和 reconnect recovery。
  - `src/utils/jobProcessEvents.ts` 提供 process event 去重合并、last sequence 和 cold-start 最近关键事件挑选；不解析 raw log，不从 machine metadata 猜产物。
  - `src/components/Views/JobsView.tsx` 在 Jobs 页面为 active / query focused job 展开 process timeline，展示 count / retained / hidden、loading / error / empty、kind / phase / title / summary / content / artifactRefs / dimension / target / severity。
  - `src/components/Views/BootstrapProgressView.tsx` 在 cold-start 卡片显示最近关键事件摘要，并通过任务详情按钮进入 `Jobs` 页对应 `?job=<jobId>` timeline。
- API / view-model 示例：

```ts
const response = await api.getJobProcessEvents(jobId, {
  afterSequence: lastSequence,
  limit: 120,
});

response.developerViews.forEach((event) => {
  // event.kind / phase / title / summary / content / artifactRefs
  // 直接来自 Alembic developer view，不解析 raw log。
});
```

```json
{
  "jobId": "bootstrap_live",
  "hiddenCount": 0,
  "retainedCount": 2,
  "developerViews": [
    {
      "eventId": "bootstrap_live_process_0002",
      "jobId": "bootstrap_live",
      "sequence": 2,
      "kind": "summary",
      "phase": "dimension",
      "title": "Bootstrap dimension completed",
      "summary": "Architecture completed.",
      "dimensionId": "architecture",
      "artifactRefs": [
        {
          "kind": "bootstrap-session",
          "ref": "bs_123",
          "label": "Bootstrap session"
        }
      ]
    }
  ]
}
```

- Socket / REST 恢复说明：
  - socket 只消费 `payload.event`，事件名为 `job:process-event`；append 前按 `eventId` 或 `jobId:sequence:kind` 去重并按 sequence 排序。
  - 首次打开 timeline 用 REST 全量 recent view；手动刷新、active polling、socket connect / reconnect 用 `afterSequence` 增量恢复。
  - 历史旧 job 或 daemon restart 后没有 retained events 时显示空 timeline，不 mock 数据、不回退解析 debug log。
- UI 证据：
  - Jobs 页面 timeline：`JobProcessTimeline` 有展开 / 收起入口，active job 自动展开，`?job=<jobId>` 可直接展开对应任务；timeline header 显示事件数、retained、hidden 和 endpoint unavailable；事件行按 kind 用图标 / tone 区分，展示 summary、content、artifactRefs 和 meta chips。
  - cold-start 卡片：`BootstrapProcessSummary` 展示最近 3 条关键事件（优先 LLM / tool / artifact / checkpoint / error / summary），并提供“任务详情 / Job details”入口跳转 Jobs timeline。
  - 本执行窗口没有启动真实 Alembic daemon 做截图；复杂 UI 的真实浏览器截图和持续 socket 验证应由下一步 `AlembicTest` 在真实 cold-start 测试单中完成。
- 验证命令与结果：
  - `npm run test`：通过，6 个 dashboard contract tests，其中新增 `jobs process timeline consumes typed events contract` 覆盖 API client、socket event、REST recovery 和 UI 入口。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过，85 source files checked。
  - `npm run check`：通过，包含 lint、test、typecheck、`tsc && vite build`。
  - `git diff --check`：通过。
- 遗留风险：
  - 前端已消费真实 contract，但本窗口未连接 live Alembic daemon 截图；需要 `AlembicTest` 用真实项目 cold-start 验证持续更新、刷新恢复、后半程产物事件和 hidden/raw/secret 不进入 UI。
  - Alembic producer 当前基础事件能驱动 timeline；完整 LLM input/output、tool call、nudge / reflection 的丰富度仍取决于 Alembic / AlembicAgent 后续 producer。
  - recorder 仍是 Alembic 进程内 bounded recent store；daemon restart 前的历史 timeline 不在本轮前端可恢复范围内。
- 是否需要 `AlembicAgent` 或 Alembic producer 继续增强 LLM / tool / nudge：
  - Dashboard 已支持并能展示 `llm.input`、`llm.reflection`、`llm.output`、`tool`、`artifact`、`checkpoint`、`error`、`summary` 等 kind；前端不再是这类事件展示的阻塞点。
  - 若总控验收或 `AlembicTest` 真实运行确认 LLM 输入 / 输出、tool call、nudge / reflection 仍缺失，应继续派发 `Alembic` producer 或 `AlembicAgent` runtime 增强事件生产；建议优先从真实事件源归口决定，避免 Dashboard 伪造或推断。
- 下一步建议：
  - 总控复核 Dashboard 提交与文档回填；通过后创建 `AlembicTest` 真实 cold-start 展示验证单。
  - `GTODO-2026-05-23-028-C` 保持观察中，等 AlembicTest 证据决定是否升级为下一任务包。

#### SPLO-P1-Dashboard 总控验收

结论：未通过。功能代码已经具备 Dashboard 消费闭环，但验证证据不闭合，需要 `AlembicDashboard` 返工后重新回填。

通过的代码事实：

- `AlembicDashboard/src/api.ts:179` 归一化 Core developer view，保留 `kind`、`phase`、`content`、`artifactRefs`、`dimensionId`、`targetName` 等字段；`:1717` 新增 `getJobProcessEvents(jobId, { afterSequence, limit })`，真实消费 `/jobs/:jobId/events`。
- `AlembicDashboard/src/hooks/useJobProcessEvents.ts:46` 到 `:157` 实现初始 REST 拉取、`afterSequence` 增量恢复、socket `job:process-event` append、reconnect recovery 和 active job polling。
- `AlembicDashboard/src/utils/jobProcessEvents.ts:14` 到 `:63` 实现事件去重合并、last sequence、关键事件挑选和搜索文本，不解析 raw log。
- `AlembicDashboard/src/components/Views/JobsView.tsx:581` 到 `:787` 实现 `JobProcessTimeline` 和 `ProcessEventItem`，展示 loading / error / empty、count / retained / hidden、summary / content / artifactRefs / meta chips，并按 LLM / tool / artifact / error kind 给出不同视觉状态。
- `AlembicDashboard/src/components/Views/BootstrapProgressView.tsx:361` 和 `:621` 在 cold-start 卡片展示最近关键事件，并通过 App 层 `AlembicDashboard/src/App.tsx:1216` 跳转 `Jobs?job=<jobId>`。
- `AlembicDashboard/scripts/dashboard-contract.test.mjs:78` 覆盖 API client、socket event、REST recovery、timeline 入口和 cold-start 摘要入口。

未通过证据：

- 总控执行 `git -C AlembicDashboard diff --check fae63c56d3b7e47189c49ee047f4e79a9b060ff2^ fae63c56d3b7e47189c49ee047f4e79a9b060ff2`，返回：
  - `src/hooks/useJobProcessEvents.ts:157: new blank line at EOF.`
  - `src/utils/jobProcessEvents.ts:64: new blank line at EOF.`
- 这与回填区“`git diff --check` 通过”的证据冲突。按总控规则，真实验证缺口必须封口，不能带着证据不一致进入 `AlembicTest`。

返工要求：

- 只删除 `src/hooks/useJobProcessEvents.ts` 和 `src/utils/jobProcessEvents.ts` 的新增末尾空白行；不扩大功能范围，不改 Alembic / Core / Agent / Plugin。
- 重新运行 `npm run check`、`git diff --check HEAD^ HEAD` 或等价提交区间检查；若提交前执行，也要回填提交前 `git diff --check` 和提交后区间检查结果。
- 回填新提交 hash、验证命令和结果、确认没有功能范围变化；总控验收通过后再启动 `AlembicTest`。

#### SPLO-P1-Dashboard 返工回填

- 返工提交 hash：`43f45bec9c988e837cdf2c153ffd4cec11e83526`（`chore: trim job process event file endings`）。
- 完成范围：
  - 删除 `src/hooks/useJobProcessEvents.ts` 的新增 EOF 空白行。
  - 删除 `src/utils/jobProcessEvents.ts` 的新增 EOF 空白行。
  - 没有修改 API client、hook 逻辑、socket 订阅、REST recovery、Jobs timeline、cold-start 卡片摘要或测试断言。
- 验证命令与结果：
  - `npm run check`：通过，包含 lint、test、typecheck、`tsc && vite build`。
  - `git diff --check`：提交前工作区检查通过。
  - `git diff --check HEAD^ HEAD`：提交后区间检查通过。
- 无功能范围变化确认：本次提交只有 2 行 EOF 空白删除；`git show --stat --oneline --no-renames HEAD` 显示仅 `src/hooks/useJobProcessEvents.ts` 与 `src/utils/jobProcessEvents.ts` 各删除 1 行，未改动运行逻辑或 UI。
- 下一步建议：总控复核 `43f45bec9c988e837cdf2c153ffd4cec11e83526` 后再启动 `AlembicTest` 真实 cold-start 展示验证单。

#### SPLO-P1-Dashboard 返工总控验收

结论：通过。`SPLO-P1-Dashboard` 完成，`GTODO-2026-05-23-028-D` 关闭，可以启动 `AlembicTest` 真实项目验证。

验收证据：

- `git -C AlembicDashboard show --stat --oneline --summary 43f45bec9c988e837cdf2c153ffd4cec11e83526` 显示本次返工仅修改 `src/hooks/useJobProcessEvents.ts` 和 `src/utils/jobProcessEvents.ts`，共删除 2 行。
- `git -C AlembicDashboard diff --name-status 43f45bec9c988e837cdf2c153ffd4cec11e83526^ 43f45bec9c988e837cdf2c153ffd4cec11e83526` 只包含上述 2 个文件。
- `git -C AlembicDashboard diff --check 43f45bec9c988e837cdf2c153ffd4cec11e83526^ 43f45bec9c988e837cdf2c153ffd4cec11e83526` 通过，无输出。
- `git -C AlembicDashboard diff --check fae63c56d3b7e47189c49ee047f4e79a9b060ff2^ 43f45bec9c988e837cdf2c153ffd4cec11e83526` 通过，无输出，说明原始功能提交加返工后的完整区间已关闭 whitespace 问题。
- `AlembicDashboard/src/hooks/useJobProcessEvents.ts` 与 `AlembicDashboard/src/utils/jobProcessEvents.ts` 尾部现在只有函数结束行，不再存在新增 EOF 空白行。

验收说明：

- Dashboard 前端能力已形成真实消费闭环：API client -> REST / socket hook -> Jobs timeline -> cold-start card summary / job details 入口。
- 本阶段仍不是最终完成；真实 live daemon 浏览器截图、持续 socket 更新、刷新恢复、hidden/raw/secret 不进入 UI、以及 LLM / tool / reflection 事件是否真实产生，必须由 `AlembicTest` 验证。

### SPLO-P1-Test

- 窗口：`AlembicTest`
- 派发时间：2026-05-24 10:51 CST
- 状态更新时间：2026-05-24 11:10 CST
- 完成状态：已完成并通过总控证据验收；真实验证结论为 `producer-gap`。
- 阶段目标：在真实测试项目中验证 cold-start process observability 的用户可见闭环，判断当前 producer 是否足够满足 LLM 输入 / 输出 / 反思 / 工具调用展示目标。
- 主线动作：启动当前 Alembic / Dashboard 环境，触发真实 cold-start；通过 API、socket / refresh 行为、Dashboard Jobs timeline、候选页 cold-start 卡片和截图 / 日志证据验证持续输出展示。
- 合并 TODO：`GTODO-2026-05-23-028-E`
- 明确不包含：不修改真实测试项目源码；不修 Alembic / Dashboard / Agent 代码；不把缺失的 producer 事件用测试脚本伪造；不把静态 mock 或旧日志解析当作通过证据。
- 下一处真实阻塞点：需要总控验收 AlembicTest 报告；若验收通过，按证据判断是否启动 `Alembic` / `AlembicAgent` producer 增强。
- 阻塞点之前还能做：测试证据已回填；当前不再发送 AlembicTest。
- 验证命令：`npm --prefix AlembicTest run restart -- --monitor-once --json`、`npm --prefix AlembicTest run probe:cold-start-timeline -- --max-files 24 --content-max-lines 80 --timeout-ms 180000 --poll-ms 2500`、direct `curl` health/job/events、Browser Dashboard 验证。
- 回填结果：报告 [../../../AlembicTest/docs/cold-start-process-timeline-test-2026-05-24.md](../../../../../AlembicTest/docs/cold-start-process-timeline-test-2026-05-24.md)；job `bootstrap_mpj6xz8i_00c334e0`，session `bs_1779591689418_ap83sc`，Dashboard `http://127.0.0.1:55367`；UI/API/socket/REST/card/details 均连通，`llm.input` / `llm.output` / `llm.reflection` / `tool` 未产生。
- 执行前置硬规则：先读取 workspace `AGENTS.md`、本执行计划、[alembic-test-exchange.md](../../../current/alembic-test-exchange.md) 和 `AlembicTest/AGENTS.md`；开始前明确声明当前窗口定位和本轮仓库职责。

#### SPLO-P1-Test 总控验收

结论：测试单完成并通过证据验收，但本主线未完成。`AlembicTest` 证明 Dashboard 可见链路已经接通，同时把 `llm.input` / `llm.output` / `llm.reflection` / `tool` producer 缺口从观察项升级为当前主线必须修复的真实问题。

验收证据：

- `AlembicTest/docs/cold-start-process-timeline-test-2026-05-24.md` 记录真实 `BiliDili` cold-start job `bootstrap_mpj6xz8i_00c334e0` 和 session `bs_1779591689418_ap83sc`。
- daemon health 声明 `jobs.processEvents.available=true`，enqueue response 包含 `eventsUrl`，events API 返回 `developerViews` / `hiddenCount` / `retainedCount` / `endpointCapability`。
- Dashboard Jobs timeline、socket append、REST 刷新恢复、Candidates cold-start 卡片和任务详情入口均有截图证据。
- 取消后 events API 的 kind counts 为 `workflow=7`、`checkpoint=1`、`summary=2`；未出现 `llm.input`、`llm.output`、`llm.reflection`、`tool`。
- 用户 2026-05-24 反馈 Jobs 展开详情区域长内容不能滚动，属于 Dashboard 可用性缺口，不能等到最终归档再处理。

验收判断：

- `GTODO-2026-05-23-028-E` 关闭，测试报告作为当前 producer-gap 证据保存。
- `GTODO-2026-05-23-028-C` 升级为下一波 `Alembic` / `AlembicAgent` producer 增强。
- 新增 `GTODO-2026-05-23-028-G`，由 `AlembicDashboard` 修复 Jobs 长详情区域滚动。
- `AlembicTest` 暂时转观察；修复完成后再创建复测单，重点覆盖真实 LLM / tool / reflection 事件和长 timeline 可滚动。

## 下一波任务包

### SPLO-P1-Agent-Progress-Payload

- 窗口：`AlembicAgent`
- 派发时间：2026-05-24 11:15 CST
- 状态更新时间：2026-05-24 12:05 CST
- 完成状态：总控验收通过，真实 kind counts 已由 `Test-2026-05-24-02` 复测确认。
- 阶段目标：让 Agent runtime 在真实 scan / cold-start AI 执行链路中产出 developer-safe 的 LLM 输入、LLM 可见输出、显式反思 / 自检和 tool 调用进度事件，供 Alembic daemon 转为 `JobProcessEvent`。
- 主线动作：从 `AgentEventBus`、`HookSystem`、`PipelineStrategy`、`AgentRuntime` 和 scan run 真实路径追溯现有事件；在不泄露 secret、raw-provider payload、hidden reasoning 的前提下，补齐可被宿主消费的 progress payload 或 hook event；至少覆盖 `llm.input`、`llm.output`、`llm.reflection` 或等价自检、`tool` 的真实生产点和测试。
- 合并 TODO：`GTODO-2026-05-23-028-C`
- 明确不包含：不改 Alembic daemon recorder / HTTP / Dashboard UI；不把隐藏推理伪装成 reflection；不为了满足 UI 伪造事件；不把 Codex host agent 能力迁入 Agent。
- 真实代码线索：`AlembicAgent/src/agent/runtime/AgentEventBus.ts` 已有 `LLM_CALL_START` / `LLM_CALL_END` / `TOOL_CALL_START` / `TOOL_CALL_END` / `THINKING` / `STREAM_DELTA`；`AlembicAgent/src/agent/runtime/HookSystem.ts` 已把 `llm:call:before/after` 桥到 bus，但 payload 只有 iteration、toolChoice、usage 等元信息；`AlembicAgent/src/agent/strategies/PipelineStrategy.ts` 已构建 `stagePrompt` 并发布 stage progress，但没有把 prompt / visible output / reflection 作为 developer event payload 暴露。
- 下一处真实阻塞点：如果 Agent 不产出可消费 payload，Alembic 只能继续记录 session / dimension / summary，无法满足用户强调的“输入了什么、LLM 输出了什么、反思了什么、调用了什么工具”。
- 阻塞点之前还能做：先确认真实 cold-start 是否使用本仓库 runtime；如果使用，直接补事件与测试；如果未使用，必须回填真实入口和 Alembic 应该补 producer 的位置，不得空做无消费方事件。
- 验证命令：按 `AlembicAgent/AGENTS.md` 运行受影响单元测试、`npm run typecheck` / `npm run lint` / `npm run build` 或仓库等价 check、`npm run lint:core-import-boundary`（若涉及 Core contract）、`git diff --check`。
- 回填要求：提交 hash、真实调用链结论、事件 payload 示例、测试覆盖、验证命令和结果、是否仍需要 Alembic 侧消费适配、未覆盖的隐藏推理 / raw-provider 边界说明。
- 执行前置硬规则：先读取 workspace `AGENTS.md`、本执行计划、`AlembicAgent/AGENTS.md`；开始前明确声明当前窗口定位和本轮仓库职责。

#### SPLO-P1-Agent-Progress-Payload 回填

- 执行记录：[../../AlembicAgent/scan-progress-live-output-agent-progress-payload-2026-05-24.md](../../../../AlembicAgent/scan-progress-live-output-agent-progress-payload-2026-05-24.md)。
- 提交 hash：`08f2102f23edbf3f920d2e7bc80a91e6c3c89661`（`Add agent process progress payloads`）。
- 真实调用链结论：Alembic 冷启动内部维度执行真实消费 `@alembic/agent/service` / `AgentService`，因此 Agent runtime payload 有真实上游价值；Alembic child execution 把 Agent progress / bootstrap process drafts 桥到 `JobProcessEventRecorder` 的提交 `0176a816cccfd4b89234569cd0f174b45d5bf6b9` 已通过总控验收。
- 完成范围：`ProgressEvent.processEvent` 新增 `AgentProgressProcessEvent` contract；`HookSystem` LLM / tool hooks 携带 `processEvent`；`AgentRuntime` 在 LLM input、LLM visible output、reflection / planning nudge、tool start / completed / failed 生产 developer-safe payload；runtime 子路径显式导出新增类型；补充 `AgentRuntime` 单测。
- 事件 payload 示例：`agent_process_event.processEvent.kind` 可为 `llm.input`、`llm.output`、`llm.reflection`、`tool`；默认 `sourceClass=developer-facing`、`displayPolicy=full`、`retention=job-retained`，并携带 `phase`、`dimensionId`、`targetName`、`iteration`、`correlationId` 等宿主可映射字段。
- Hidden / raw-provider 边界：`reasoningContent` 不进入 `content.text`，只保留 `metadata.hasHiddenReasoningContent`；常见 key / token / password / authorization 字段与文本模式脱敏；不转发 raw provider payload；现有兼容 progress 字段仍可能保留旧形态，Alembic 应优先消费 `event.processEvent`。
- 验证命令与结果：
  - `npm run build:check`：通过。
  - `npm run lint`：通过。
  - `npm run test -- test/AgentRuntime.test.ts`：通过，`7` tests passed。
  - `npm run check`：通过，`19` files / `90` tests passed。
  - `git diff --check`：通过。
- 遗留风险：本轮未在 live Alembic daemon / `BiliDili` 冷启动中复测；本地 Alembic Codex knowledge 诊断存在 runtime pin / metadata mismatch，本轮以总控文档和真实代码证据为准。
- 下一步建议：`Test-2026-05-24-02` 已确认真实 kind counts；当前只剩 live socket append 最小复测。

#### SPLO-P1-Agent-Progress-Payload 总控验收

结论：通过。`AlembicAgent` 已具备 developer-safe progress payload 生产能力，但真实 Dashboard 可见闭环仍以 `AlembicTest` live cold-start kind counts 为最终证据。

验收证据：

- `AlembicAgent/src/agent/runtime/AgentRuntimeTypes.ts` 定义 `AgentProgressProcessEvent`，覆盖 `llm.input`、`llm.output`、`llm.reflection`、`tool`，并作为 `ProgressEvent.processEvent` 暴露给宿主消费。
- `AlembicAgent/src/agent/runtime/HookSystem.ts` 的 LLM / tool before-after hook payload 已携带 `processEvent`，保留旧 progress 字段兼容。
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts` 在真实 LLM request 构造后发出 `llm.input`，在 LLM response 后发出 `llm.output`，在 tool 调用 start / completed / failed 处发出 `tool`，并把 planning nudge / reflection 类事件映射为 `llm.reflection`；hidden reasoning 不进入 `content.text`，只保留 `metadata.hasHiddenReasoningContent`。
- `AlembicAgent/test/AgentRuntime.test.ts` 覆盖 LLM input/output、tool 和 hidden reasoning 边界；回填验证 `npm run build:check`、`npm run lint`、`npm run test -- test/AgentRuntime.test.ts`、`npm run check`、`git diff --check` 均通过。
- 总控复核 `git status --short` 为空，`git diff --check HEAD^ HEAD` 对提交区间无输出。

遗留风险：

- `AlembicAgent` 只负责生产 host-consumable payload；是否在当前 cold-start 路径被 `Alembic` 完整消费，必须结合 `Alembic` bridge 和 `AlembicTest` 复测判断。
- 当前实现只展示 developer-visible 输入 / 输出 / 工具 / 显式反思；不展示 hidden reasoning、raw provider payload 或 secret。

### SPLO-P1-Alembic-Producer-Richness

- 窗口：`Alembic`
- 派发时间：2026-05-24 11:15 CST
- 状态更新时间：2026-05-24 11:35 CST
- 完成状态：总控验收通过，真实 kind counts 已由 `Test-2026-05-24-02` 复测确认。
- 阶段目标：把真实 cold-start / internal AI execution path 中的 LLM 输入、LLM 可见输出、显式反思 / 自检和 tool 调用转成 `JobProcessEventRecorder` 事件，通过现有 jobs events API 和 socket 提供给 Dashboard。
- 主线动作：从 `DaemonJobRunner`、`bootstrap-internal`、internal AI / Agent bridge、现有 `BootstrapTaskManager` EventBus 订阅点追溯真实 producer；消费 `AlembicAgent` 已有或新增的 progress payload，或在 Alembic host-owned internal AI 调用处补最小 producer；为 `llm.input`、`llm.output`、`llm.reflection`、`tool` 记录 developer-visible event，保留 hidden/raw/secret 过滤；更新 API / recorder / runner tests。
- 合并 TODO：`GTODO-2026-05-23-028-C`
- 明确不包含：不改 Dashboard UI；不复制 Agent runtime；不在 API 层伪造 `llm.*` / `tool`；不把 raw debug log 解析成 timeline；不把 hidden reasoning 暴露给前端。
- 真实代码线索：`Alembic/lib/daemon/DaemonJobRunner.ts` 当前只把 `bootstrap:started`、`bootstrap:task-started`、`bootstrap:task-completed`、`bootstrap:task-failed`、`bootstrap:all-completed` 映射为 workflow / summary / error；`Alembic/lib/daemon/JobProcessEventRecorder.ts` 已能记录任意 Core event kind 并广播 developer view；AlembicTest 实测 kind counts 只有 `workflow` / `checkpoint` / `summary`。
- 下一处真实阻塞点：如果 Alembic 不把 Agent / internal AI 进度桥进 recorder，Dashboard 即使支持 `llm.*` / `tool` 也只能显示基础 workflow。
- 阻塞点之前还能做：先补真实 producer 映射和 targeted tests；若发现真实 AI 执行完全不经过 AlembicAgent，必须在 Alembic 本仓库定位并补 host-owned producer，而不是等待不存在的下游 payload。
- 验证命令：`npm run build:check`、相关 daemon / jobs / bootstrap targeted tests、`npm run lint:repo-boundary`、`git diff --check`；如果改动触发全量 check，按 `Alembic/AGENTS.md` 补跑。
- 回填要求：提交 hash、真实 producer 入口、事件样例、events API kind counts 预期、验证命令和结果、给 Dashboard / AlembicTest 的复测建议、与 `AlembicAgent` 之间是否还有未闭合 contract。
- 执行前置硬规则：先读取 workspace `AGENTS.md`、本执行计划、`Alembic/AGENTS.md`；开始前明确声明当前窗口定位和本轮仓库职责。

#### SPLO-P1-Alembic-Producer-Richness 回填

- 提交 hash：`0176a816cccfd4b89234569cd0f174b45d5bf6b9`（`feat: emit rich bootstrap process events`）。
- 完成范围：`Alembic` 主仓库新增 developer-safe bootstrap process event draft 层，把 `llm.input`、`llm.output`、`llm.reflection`、`tool` 草稿从真实 internal AI / cold-start 路径送入现有 `JobProcessEventRecorder`；保留现有 jobs events API、socket broadcast 和 Dashboard 消费契约不变。
- 真实 producer 入口：
  - `BootstrapSessionExecutionBuilder` 在维度 child run lazy input 创建后产出 `llm.input`，内容为安全 Agent run input 投影，明确不包含完整 prompt expansion、文件内容、provider payload 或 secret。
  - `InternalDimensionFillSessionRunner` 在收到真实 `AgentRunResult` 后，从 projection / phases / toolCalls / diagnostics / efficiency 产出 `tool`、`llm.output`、`llm.reflection`；tier reflection 继续作为规则化 `llm.reflection` 事件。
  - `BootstrapEventEmitter.emitProcessEvents` 通过 TaskManager 单通道转发，避免 EventBus 重复投递；`DaemonJobRunner` 监听 `bootstrap:process-events` 和 task result `processEvents`，绑定当前 `jobId` 后写入 recorder。
- API / event / capability 示例：事件经原 `GET /api/v1/jobs/:jobId/events` 返回；预期 completed dimension 至少出现 `llm.input`，有可见 reply 时出现 `llm.output`，有 toolCalls 时出现 `tool`，有 quality gate / diagnostics / efficiency 或 tier reflection 时出现 `llm.reflection`；developer view 示例 kind 为 `llm.input`，phase 为 `dimension-input`，metadata 包含 `sessionId`、`taskId`、`dimensionId`，content 为 `application/json` 安全投影。
- 验证命令与结果：
  - `npm run test:unit -- BootstrapProcessEvents BootstrapEventEmitter DaemonJobRunner`：通过，3 files / 10 tests。
  - `npm run build:check`：通过，包含 local `AlembicCore` build contract 与 `tsc --noEmit`。
  - `npm run lint:repo-boundary`：通过，repository boundary check passed。
  - `npm run check`：通过，包含 typecheck、Biome lint、agent extraction boundary、Core import boundary。
  - `git diff --check`：通过，无输出。
- 遗留风险：
  - 本轮提交时未启动真实 daemon / Dashboard / BiliDili cold-start 复测；后续 `Test-2026-05-24-02` 已确认实际 kind counts。
  - 当前 `llm.input` 是 Alembic 可安全观察到的 Agent run input 投影，不是 raw provider prompt；若 `AlembicAgent` 后续暴露更细的 developer-safe stage prompt / stream / visible output payload，Alembic 还可以继续消费增强。
  - hidden reasoning、raw provider payload 和 secrets 仍不进入 developer-facing event；工具结果只保留摘要和安全截断。
- 下一步建议：派 `AlembicTest` 做真实 cold-start 复测，重点确认 `llm.input` / `llm.output` / `llm.reflection` / `tool` kind counts、socket append 和 Jobs timeline 长内容阅读。

#### SPLO-P1-Alembic-Producer-Richness 总控验收

结论：通过。`Alembic` 已把 cold-start 真实 child run input、dimension result、tool calls、diagnostics / efficiency 和 tier reflection 桥入 `JobProcessEventRecorder`；下一步必须由 `AlembicTest` 验证 live daemon 中实际 kind counts。

验收证据：

- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts` 新增 bootstrap process event draft 层，构造 `llm.input`、`llm.output`、`llm.reflection`、`tool`，并对 secret / raw provider / hidden reasoning 做边界控制。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapSessionExecutionBuilder.ts` 在 dimension child `lazyInputFactory` 创建真实 `AgentRunInput` 后调用 `buildBootstrapDimensionInputProcessEvents`，因此 input event 不是 API 层伪造。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillSessionRunner.ts` 在真实 `AgentRunResult` 回来后构造 result process events，并在 tier reflection 处追加 `llm.reflection`。
- `Alembic/lib/service/bootstrap/BootstrapEventEmitter.ts` 提供 `emitProcessEvents`，优先走 `BootstrapTaskManager` 单通道，避免 EventBus 与 task result 重复投递。
- `Alembic/lib/daemon/DaemonJobRunner.ts` 监听 `bootstrap:process-events`，并在 `bootstrap:task-completed` 里读取 `result.processEvents`，再绑定 `jobId` 写入 recorder；`recordBootstrapProcessEventDrafts` 会补齐 `dimensionId`、`sessionId`、`taskId` 和 `targetName`。
- `Alembic/test/unit/BootstrapProcessEvents.test.ts`、`BootstrapEventEmitter.test.ts`、`DaemonJobRunner.test.ts` 覆盖 input projection、result events、tier reflection 和 recorder bridge；回填验证命令均通过。总控复核 `git status --short` 为空，`git diff --check HEAD^ HEAD` 对提交区间无输出。

验收说明：

- 本阶段是 producer bridge 验收，不等同于最终产品验收；真实 `BiliDili` cold-start 是否能产生 `llm.output`、`tool` 和 `llm.reflection`，取决于该次 run 是否走到 completed dimension、是否有 toolCalls / diagnostics / tier reflection，必须由 `AlembicTest` 记录实际 counts。
- 当前 `llm.input` 是 Alembic 安全投影，不是 raw provider prompt。若复测显示开发者可读性不足，后续再优化 input projection，而不是阻塞当前第一版闭环复测。

### SPLO-P1-Dashboard-Scroll

- 窗口：`AlembicDashboard`
- 派发时间：2026-05-24 11:15 CST
- 状态更新时间：2026-05-24 11:31 CST
- 完成状态：总控验收通过，真实滚动已由 `Test-2026-05-24-02` 复测确认。
- 阶段目标：修复 Jobs 页面展开任务详情 / process timeline 长内容无法滚动的问题，让开发者能完整阅读长 timeline、诊断块、效率块和 summary chips。
- 主线动作：调整 Jobs 页面和内容容器的高度 / overflow / `min-h-0` / flex 布局；确保页面级滚动或列表级滚动有明确滚动容器；长 job card 不被 `overflow-hidden` 截断；保留现有视觉层级、active job 展开、REST / socket timeline 展示逻辑。
- 合并 TODO：`GTODO-2026-05-23-028-G`
- 明确不包含：不改 Alembic 后端；不重写 timeline 功能；不删除诊断 / 效率 / summary 信息来规避滚动；不把真实长内容截断成短内容；不引入与现有 Dashboard 设计不一致的大改版。
- 真实代码线索：`AlembicDashboard/src/App.tsx:1131` 根容器 `h-screen overflow-hidden`，`:1162` 只有 active tab 外层 `overflow-y-auto`，`:1169` tab motion 容器为 `h-full`；`AlembicDashboard/src/components/Views/JobsView.tsx:301` Jobs 根为 `h-full flex flex-col`，`:376` jobs panel 为 `overflow-hidden`。这些组合在长 job 详情下容易让内容高度被固定并截断。
- 下一处真实阻塞点：滚动不可用会让已经产生的 timeline / 诊断内容无法被开发者完整阅读，直接影响本主线“持续输出展示”的真实可用性。
- 阻塞点之前还能做：独立修布局和前端验证，不依赖 producer 增强完成。
- 验证命令：`npm run check`；复杂布局改动必须补浏览器或截图 / DOM scroll evidence，至少证明 Jobs 长详情区域 `scrollHeight > clientHeight` 时可以滚动，且桌面视口和较窄视口不遮挡内容。
- 回填要求：提交 hash、改动文件、滚动容器说明、截图或 DOM scroll 证据、验证命令和结果、是否仍需要 `AlembicTest` 在真实 cold-start 中复测滚动。
- 执行前置硬规则：先读取 workspace `AGENTS.md`、本执行计划、`AlembicDashboard/AGENTS.md`；开始前明确声明当前窗口定位和本轮仓库职责。

#### SPLO-P1-Dashboard-Scroll 回填

- 提交 hash：`06253df5ccb342225b23d47931b04e605b3bd22c`（`fix: keep job timelines scrollable`）。
- 改动文件：
  - `src/App.tsx`：active tab 容器补 `min-h-0`，tab motion 容器从 `h-full` 调整为 `h-full min-h-0`。
  - `src/components/Views/JobsView.tsx`：Jobs 根容器补 `min-h-0`；jobs list panel 从 `overflow-hidden` 改为 `min-h-0 flex-1 overflow-y-auto overscroll-contain`，作为明确列表级滚动容器；长 request / summary / artifact / meta chips 改为 `max-w-full break-words`，避免长内容撑破容器。
  - `scripts/dashboard-contract.test.mjs`：新增 `jobs view keeps long process details scrollable` 静态契约测试，锁住 Jobs 页面滚动容器和长 chips 换行规则。
- 滚动容器说明：本轮保留现有 Jobs 页面视觉层级和 timeline 功能，不删除诊断 / 效率 / summary 信息；滚动行为由 jobs list panel 承担，header / stats / filters 保持固定在 Jobs 页面上方，展开的长 job card / process timeline 在列表区域内滚动阅读。
- DOM scroll 证据：使用 `npm run check` 产出的 build CSS 和临时 HTML，通过 headless Chrome 验证模拟 Jobs 视口 `760x520` 下长 timeline 区域可滚动；结果为 `clientHeight=350`、`scrollHeight=1918`、`before=0`、`after=240`、`canScroll=true`。
- 验证命令与结果：
  - `npm run check`：通过，包含 lint、7 个 dashboard contract tests、typecheck、`tsc && vite build`。
  - `git diff --check`：提交前通过，无输出。
  - headless Chrome DOM scroll probe：通过，`scrollHeight > clientHeight` 且设置 `scrollTop=240` 生效。
  - `git diff --check HEAD^ HEAD`：提交后区间检查通过，无输出。
- 遗留风险：
  - 本窗口未连接 live Alembic daemon，也未修改当前用户环境；滚动 DOM 证据使用本仓 build CSS 和模拟长 timeline 内容。
  - `Alembic` / `AlembicAgent` producer richness 已通过总控验收；真实 cold-start 里的 `llm.input` / `llm.output` / `llm.reflection` / `tool` kind counts 已由 `Test-2026-05-24-02` 复测确认。
- 下一步建议：总控复核 Dashboard 提交 `06253df5ccb342225b23d47931b04e605b3bd22c`；等待 `Alembic` / `AlembicAgent` producer richness 回填后，再创建 `AlembicTest` 复测单，覆盖真实 LLM / tool / reflection 事件和长 timeline 可滚动。

#### SPLO-P1-Dashboard-Scroll 总控验收

结论：通过。Dashboard 已修复 Jobs 长详情区域滚动容器和长 chips 换行；后续 `Test-2026-05-24-02` 已在真实页面用 DOM 证据确认长 timeline 可滚动。

验收证据：

- `AlembicDashboard/src/App.tsx` 给 active tab 容器和 motion tab 容器补 `min-h-0`，避免 `h-screen overflow-hidden` 组合压死子视图滚动。
- `AlembicDashboard/src/components/Views/JobsView.tsx` 给 Jobs 根和 jobs list panel 补 `min-h-0` / `flex-1` / `overflow-y-auto` / `overscroll-contain`，把滚动职责明确放在列表区域；长 chips 使用 `max-w-full break-words`。
- `AlembicDashboard/scripts/dashboard-contract.test.mjs` 新增 `jobs view keeps long process details scrollable`，锁住滚动容器和长内容换行规则。
- 回填验证 `npm run check`、`git diff --check`、headless Chrome DOM scroll probe、`git diff --check HEAD^ HEAD` 均通过。总控复核 `git status --short` 为空，`git diff --check HEAD^ HEAD` 对提交区间无输出。

遗留风险：

- 这次验收当时只证明代码与模拟 DOM scroll 证据成立；用户截图所处的真实 Dashboard 卡片滚动已由 `Test-2026-05-24-02` 补充验证。

### SPLO-P1-Test-02

- 窗口：`AlembicTest`
- 派发时间：2026-05-24 12:18 CST
- 状态更新时间：2026-05-24 12:23 CST
- 完成状态：已验收 / 部分通过。API / REST / scroll / card 通过；live socket append rich content 失败并已转 Dashboard 修复。
- 阶段目标：复测 Phase 1E 修复后的真实 cold-start observability 闭环，确认 producer richness 和 Dashboard 滚动修复在 live daemon / Dashboard 中同时成立。
- 主线动作：在真实测试项目中触发当前 Alembic / Agent / Dashboard 组合的 cold-start；通过 jobs events API、socket / REST refresh、Dashboard Jobs timeline、Candidates cold-start card 和 DOM / 截图证据验证 `llm.input` / `llm.output` / `llm.reflection` / `tool` kind counts 与长内容可滚动。
- 合并 TODO：`GTODO-2026-05-23-028-H`
- 明确不包含：不修改真实测试项目源码；不 mock process events；不把 API 层静态样例当作通过证据；不修产品代码。
- 下一处真实阻塞点：没有 live 复测证据，本主线不能判断最终目标是否完成。
- 阻塞点之前还能做：产品仓库不再继续派发；先让 `AlembicTest` 提供真实证据。
- 验证命令：按 `AlembicTest` 规则使用当前 `restart` / `probe:cold-start-timeline` / health / jobs events API / Dashboard 浏览器验证；若 daemon 或 Dashboard 启动方式变化，先回填阻塞而不是改产品仓库。
- 回填要求：测试报告路径、jobId、sessionId、Dashboard URL、events API kind counts、socket append / REST recovery 证据、Jobs timeline 可滚动截图或 DOM 证据、cold-start 卡片入口证据、hidden/raw/secret 边界观察、失败原因和下一步建议。
- 执行前置硬规则：先读取 workspace `AGENTS.md`、本执行计划、[alembic-test-exchange.md](../../../current/alembic-test-exchange.md) 和 `AlembicTest/AGENTS.md`；开始前明确声明当前窗口定位和本轮测试职责。

#### SPLO-P1-Test-02 回填

- 测试报告：[../../../AlembicTest/docs/cold-start-process-events-retest-2026-05-24.md](../../../../../AlembicTest/docs/cold-start-process-events-retest-2026-05-24.md)。
- 证据目录：`AlembicTest/tmp/cold-start-process-timeline-test-02-2026-05-24/`。
- jobId：`bootstrap_mpj8tcyc_b1080061`。
- sessionId：`bs_1779594833012_jqx3fn`。
- Dashboard URL：`http://127.0.0.1:57136/jobs?job=bootstrap_mpj8tcyc_b1080061`。
- events API kind counts：`workflow=6`、`checkpoint=1`、`llm.input=2`、`tool=1`、`llm.output=1`、`llm.reflection=1`、`summary=1`、`artifact=0`、`error=0`。
- socket append / REST recovery：probe 证明确有 matching `job:process-event` socket；late rich event append 时 Dashboard 出现 React #31（`jobs-timeline-socket-append-test-02.png`）；刷新同一 job URL 后 REST recovery 恢复 13 events（`jobs-timeline-rest-rich-recovery-test-02.png`）。
- Jobs timeline 滚动：`jobs-timeline-rich-content-scroll-metrics-test-02.json` 显示 `scrollHeight=13747`、`clientHeight=591`、`scrollTop 0 -> 1800`；`jobs-timeline-rich-events-visible-test-02.png` 可见 `tool` / `llm.output` / `llm.reflection`。
- cold-start 卡片入口：`candidates-cold-start-card-test-02.png` 显示最近关键事件和 `任务详情`；点击后进入 job details，证据 `job-details-entry-test-02.png`。
- hidden/raw/secret 边界：`hiddenCount=0`；`llm.input.metadata.rawProviderPayload=false`；`sk-*`、`sk-proj-*`、`AIza*`、`Bearer ...`、`Authorization:` 扫描命中数均为 0。
- 失败原因：Dashboard live socket append path 对 structured `content` object 的 normalize / render 与 REST recovery 不一致，导致 object 被作为 React child。
- 下一步建议：总控分派 `AlembicDashboard` 做最小修复；修复后 `AlembicTest` 只复测 live append rich events，不扩大测试范围。

#### SPLO-P1-Test-02 总控验收

结论：部分通过，测试单本身验收完成；主线不完成，转入 `SPLO-P1-Dashboard-Live-Append` 最小修复。

通过项：

- `Alembic` / `AlembicAgent` producer richness 在真实 events API 已闭合，kind counts 包含 `llm.input=2`、`tool=1`、`llm.output=1`、`llm.reflection=1`。
- REST recovery 可以恢复同一 job 的 13 条 rich timeline。
- Jobs timeline 长内容滚动在真实页面通过，DOM 证据显示 `scrollHeight=13747`、`clientHeight=591`、`scrollTop 0 -> 1800`。
- Candidates cold-start 卡片入口和 job details 跳转通过。
- hidden/raw/secret 边界未发现泄露。

未通过项：

- live socket append late rich event 时触发 React #31，错误指向 `{language,mimeType,role,text}` structured `content` object 被直接渲染为 React child。
- 代码事实对应：`AlembicDashboard/src/api.ts` 的 REST path 会经过 `normalizeProcessDeveloperView`，而 `AlembicDashboard/src/hooks/useJobProcessEvents.ts` 的 `normalizeSocketEvent` 直接展开 `payload.event`；`AlembicDashboard/src/components/Views/JobsView.tsx` 直接在 `<pre>` 中渲染 `event.content`。因此 socket append path 与 REST recovery path 的 rich content normalize / render 不一致。

处理结论：

- 关闭 `GTODO-2026-05-23-028-H`，新增并启动 `GTODO-2026-05-23-028-I`。
- 当前只分派 `AlembicDashboard`，修复 socket append rich content normalize / render；修复完成后再创建 `AlembicTest` 最小复测，不扩大后端和真实项目范围。

### SPLO-P1-Dashboard-Live-Append

- 窗口：`AlembicDashboard`
- 派发时间：2026-05-24 12:24 CST
- 状态更新时间：2026-05-24 12:32 CST
- 完成状态：总控验收通过，`Test-2026-05-24-03` 已复测通过。
- 阶段目标：修复 Jobs timeline live socket append rich content React #31，让打开中的 Jobs 页面能实时追加 `tool` / `llm.output` / `llm.reflection` rich events，并与 REST recovery 使用一致的 view-model normalize / render 行为。
- 主线动作：统一 `job:process-event` socket append 与 `GET /api/v1/jobs/:jobId/events` REST recovery 的 `JobProcessDeveloperView` normalize；对 structured `content` object（如 `{ language, mimeType, role, text }`）转换成可渲染文本或可控 UI，不得直接作为 React child；补充 socket rich content regression test。
- 合并 TODO：`GTODO-2026-05-23-028-I`
- 明确不包含：不改 Alembic / AlembicAgent / Core producer；不改真实测试项目；不 mock rich events；不删除 content 来规避报错；不重做 Jobs 页面布局或 timeline 视觉。
- 真实代码线索：`AlembicDashboard/src/hooks/useJobProcessEvents.ts` 的 `normalizeSocketEvent` 当前直接展开 `payload.event`；`AlembicDashboard/src/api.ts` 的 REST path 已有 `normalizeProcessDeveloperView`；`AlembicDashboard/src/components/Views/JobsView.tsx` 在 `<pre>` 中直接渲染 `event.content`。优先让 socket path 复用 REST normalizer 或抽出共享 normalizer，同时让 `content` object 的 `text` 字段可展示。
- 下一处真实阻塞点：如果 live append 仍崩溃，cold-start 过程不能算“持续输出展示”闭环完成。
- 阻塞点之前还能做：只修 Dashboard normalize / render 和针对性测试；不等待其它产品仓库。
- 验证命令：`npm run check`、新增/更新 dashboard contract test、`git diff --check`；如能用本地 mock socket/contract 覆盖，必须证明 socket payload with structured `content` 不再触发 React object child。
- 回填要求：提交 hash、改动文件、root cause、socket 与 REST normalize 统一方式、structured content 展示策略、验证命令和结果、是否需要 `AlembicTest` 最小复测 live append。
- 执行前置硬规则：先读取 workspace `AGENTS.md`、本执行计划、`AlembicDashboard/AGENTS.md`；开始前明确声明当前窗口定位和本轮仓库职责。

#### SPLO-P1-Dashboard-Live-Append 回填

- 提交 hash：`c1c7a1a4fcd5d724d86734be47ef6fff745b262d`（`fix: normalize live job process events`）。
- 改动文件：
  - `src/api.ts`：导出 `normalizeProcessDeveloperView`，新增 `contentTextOrUndefined`，让 REST developer view normalize 能处理 structured `content`。
  - `src/hooks/useJobProcessEvents.ts`：socket `job:process-event` append path 改为复用 `normalizeProcessDeveloperView`，并用 socket 顶层 `eventId` / `jobId` / `sequence` / `timestamp` 补齐 event 缺失字段。
  - `scripts/dashboard-contract.test.mjs`：新增 socket rich content regression contract，要求 socket append 与 REST path 共用 normalizer，并锁定 structured content 文本化策略。
- root cause：`Test-2026-05-24-02` 的 late rich socket event 携带 structured `content` object（如 `{ language, mimeType, role, text }`）；REST recovery 会经过 `normalizeProcessDeveloperView`，而 socket append 旧路径直接展开 `payload.event` 并进入 UI，导致 `JobsView` 的 `<pre>{event.content}</pre>` 收到 object，触发 React #31。
- socket 与 REST normalize 统一方式：`normalizeProcessDeveloperView(value, fallbackJobId)` 从 `src/api.ts` 导出为唯一 developer view normalizer；REST `getJobProcessEvents` 和 socket `normalizeSocketEvent` 都调用该函数，socket 顶层字段只作为 event 缺失字段的 fallback。
- structured content 展示策略：`content` 为 string 时原样展示；为 number / boolean 时转字符串；为 object 且包含 `text` 字段时展示 `text`；为其它 object / array 时用 pretty JSON 作为可读 fallback；不再把 object 直接作为 React child，也不删除 rich content。
- 验证命令与结果：
  - `npm run check`：通过，包含 lint、8 个 dashboard contract tests、typecheck、`tsc && vite build`。
  - `git diff --check`：提交前通过，无输出。
  - `git diff --check HEAD^ HEAD`：提交后区间检查通过，无输出。
- 是否需要 `AlembicTest` 最小复测 live append：需要。建议总控验收 Dashboard 提交后，只创建最小复测单，打开 Jobs 页面等待 late `tool` / `llm.output` / `llm.reflection` rich events socket append，确认不再 React #31，且无需刷新即可看到 structured content 的 `text`。

#### SPLO-P1-Dashboard-Live-Append 总控验收

结论：通过。Dashboard 已把 live socket append path 收束到 REST developer view normalizer，并补齐 structured `content` 文本化策略；后续 `Test-2026-05-24-03` 已在 live 页面完成最小复测。

验收证据：

- `AlembicDashboard/src/api.ts` 导出 `normalizeProcessDeveloperView(value, fallbackJobId)`，并在 developer view 中通过 `contentTextOrUndefined(record.content)` 生成可渲染 `content`。
- `contentTextOrUndefined` 对 string 原样展示，对 number / boolean 转字符串，对 object 的 `text` 字段优先展示，对其它 object / array 使用 pretty JSON fallback；不再把 object 直接传给 React child。
- `AlembicDashboard/src/hooks/useJobProcessEvents.ts` 的 `normalizeSocketEvent` 改为调用 `normalizeProcessDeveloperView(eventRecord, payload.jobId)`，socket 顶层 `eventId` / `jobId` / `sequence` / `timestamp` 只作为缺失字段 fallback。
- `AlembicDashboard/scripts/dashboard-contract.test.mjs` 新增 `socket process events share REST content normalization`，锁住 socket rich content 与 REST path 共用 normalizer、structured content 文本化和旧 direct spread 路径删除。
- 总控复核 `AlembicDashboard` 工作区干净；`git diff --check HEAD^ HEAD` 对提交 `c1c7a1a4fcd5d724d86734be47ef6fff745b262d` 区间无输出。

遗留风险：

- 总控代码验收时没有直接操作 live Dashboard；真实 socket append 已由后续 `Test-2026-05-24-03` 确认不再触发 React #31。

### SPLO-P1-Test-03

- 窗口：`AlembicTest`
- 派发时间：2026-05-24 12:32 CST
- 状态更新时间：2026-05-24 12:46 CST
- 完成状态：总控验收通过。
- 阶段目标：最小复测 Dashboard live socket append rich content 修复，证明打开中的 Jobs 页面可实时追加 rich process events，不再依赖刷新恢复。
- 主线动作：在真实测试项目触发或复用一次会产生 late `tool` / `llm.output` / `llm.reflection` 的 cold-start / bootstrap job；打开 Jobs 页面并保持页面运行，等待 `job:process-event` socket append；确认不再出现 React #31，且 structured `content` 的 `text` 无需刷新即可直接可见。必要时再刷新同一 job URL确认 REST recovery 仍正常。
- 合并 TODO：`GTODO-2026-05-23-028-J`
- 明确不包含：不修改真实测试项目源码；不 mock process events；不重新验收 Core / Alembic / Agent producer；不扩大为完整 cold-start 产品回归，除非最小复测无法触发 late rich events 并需要回填阻塞。
- 下一处真实阻塞点：如果 live append 仍崩溃或必须刷新才能看到 rich content，本主线持续输出展示仍未完成。
- 阻塞点之前还能做：只做 live append 最小复测、截图 / DOM / console error 证据和报告回填。
- 验证命令：按 `AlembicTest` 规则使用当前 daemon / Dashboard / browser probe；优先复用 Test-02 的 cold-start probe 思路，最小化到 live append rich content、console React error、visible text 和 REST recovery fallback。
- 回填要求：测试报告路径、jobId、Dashboard URL、kind counts、socket append 截图或 DOM 证据、structured content `text` 可见证据、是否出现 React #31 / console error、验证命令 / 日志路径、遗留风险和是否可判定主线完成。
- 执行前置硬规则：先读取 workspace `AGENTS.md`、本执行计划、[alembic-test-exchange.md](../../../current/alembic-test-exchange.md) 和 `AlembicTest/AGENTS.md`；开始前明确声明当前窗口定位和本轮测试职责。

#### SPLO-P1-Test-03 回填

- 报告路径：[../../../AlembicTest/docs/live-socket-append-rich-content-retest-2026-05-24.md](../../../../../AlembicTest/docs/live-socket-append-rich-content-retest-2026-05-24.md)。
- jobId：`bootstrap_mpja71u9_a069c7d4`。
- sessionId：`bs_1779597151668_9hrcy2`。
- Dashboard URL：`http://127.0.0.1:58264/jobs?job=bootstrap_mpja71u9_a069c7d4`。
- kind counts：最终 `count=38`、`workflow=10`、`checkpoint=1`、`summary=11`、`llm.input=6`、`tool=3`、`llm.output=3`、`llm.reflection=4`、`hiddenCount=0`、`retainedCount=38`、`nextSequence=38`。
- socket append / DOM 证据：`AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/success-late-append.png`、`success-late-append.dom.txt`、`success-late-append.page.json`。同一打开页面未刷新即显示 `过程 Timeline 38 事件`，可见 `kindtool`、`kindllm.output`、`kindllm.reflection` 和 rich text。
- React 错误：旧 `57136` 页面复测前已显示 React #31，判为旧资产 / 旧失败态；重启并 dev-link 当前 Dashboard 修复提交后，新 `58264` 页面未触发 React #31，console errors 为空，页面无 `[object Object]`。
- 延迟观察：12:35-12:39 CST 页面和 events API 曾停在 19 events；最终迟到检查推进到 38 events，并在未刷新页面 DOM 中可见。说明 rich events 以较粗粒度 / 批量方式追加，非逐 tool call 即时追加。
- BiliDili git 状态：`## main...origin/main`，无源码改动。
- 结论：可判定 Test-03 通过。Dashboard renderer 修复在新资产环境下未复现 React #31，late rich append 成功样本已取得。
- 遗留风险：当前新 job 仍 running，未取消 / 停 daemon，因为测试单未授权关闭服务；late event 批量延迟可作为后续观察。
- 下一步建议：总控可验收 `Test-2026-05-24-03` 通过并关闭 live socket append React #31 缺口；如需更细实时性，另开延迟观察 TODO。

#### SPLO-P1-Test-03 总控验收

结论：通过。`Test-2026-05-24-03` 满足本轮最小复测通过标准，live socket append rich content React #31 缺口关闭；`GTODO-2026-05-23-028` 第一版 cold-start process observability 主线完成。

验收证据：

- 测试报告 [../../../AlembicTest/docs/live-socket-append-rich-content-retest-2026-05-24.md](../../../../../AlembicTest/docs/live-socket-append-rich-content-retest-2026-05-24.md) 明确当前有效环境为重启并 dev-link 当前 Dashboard 修复提交后的 `http://127.0.0.1:58264`，避免旧 `57136` stale asset 假失败。
- 真实 BiliDili job `bootstrap_mpja71u9_a069c7d4` 在同一打开的 Jobs 页面从 19 events 推进到 38 events，无需刷新即可显示 late rich events。
- 最终 kind counts 包含 `llm.input=6`、`tool=3`、`llm.output=3`、`llm.reflection=4`，覆盖用户要求的 LLM 输入、工具调用、LLM 可见输出和显式反思 / 自检。
- DOM 证据显示 `includesReact31=false`、`includesObjectObject=false`，并且 `includesToolKind`、`includesLlmOutputKind`、`includesLlmReflectionKind`、`includesToolText`、`includesOutputText`、`includesReflectionText` 均为 true。
- BiliDili git 状态保持 `## main...origin/main`，未改真实测试项目源码。

处理结论：

- `GTODO-2026-05-23-028-I` 与 `GTODO-2026-05-23-028-J` 均关闭。
- 本主线最终目标已达到：Core contract、Alembic recorder/API/producer、Agent payload、Dashboard 双入口 UI、Jobs 滚动和 AlembicTest 真实验证均有处理结论与证据。
- `Test-2026-05-24-03` 观察到的 live append 批量延迟不阻塞本轮 renderer / observability 第一版闭环；作为 `GTODO-2026-05-24-029` 后续观察项进入全局 TODO，只有用户要求更细实时性或后续测试再次证明“长时间无开发者可见更新”时再提升为主线。

## 空闲窗口调度

| 窗口 | 调度状态 | 是否发送 | 说明 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 | 否 | 当前主线任务完成；live append 批量延迟作为后续全局 TODO 观察。 |
| `AlembicCore` | 已完成 | 否 | `SPLO-P1-Core` 返工后已通过总控验收。 |
| `AlembicAgent` | 已完成 | 否 | 当前主线任务完成；live append 批量延迟作为后续全局 TODO 观察。 |
| `AlembicDashboard` | 已完成 | 否 | 新修复资产环境未触发 React #31，late `tool` / `llm.output` / `llm.reflection` rich append 可读。 |
| `AlembicPlugin` | 无任务 | 否 | 第一版不接入 Dashboard；只观察后续 Codex handoff 是否需要展示 job URL。 |
| `AlembicTest` | 已完成 | 否 | `Test-2026-05-24-03` 已通过总控验收。 |
| `BiliDili` | 无任务 | 否 | 不改真实 iOS 项目源码，只可能由 `AlembicTest` 作为验证目标使用。 |

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | 当前主线任务完成；live append 批量延迟作为后续全局 TODO 观察。 |
| `AlembicCore`<br>已完成 | `SPLO-P1-Core` 返工后已通过总控验收。 |
| `AlembicAgent`<br>已完成 | 当前主线任务完成；live append 批量延迟作为后续全局 TODO 观察。 |
| `AlembicDashboard`<br>已完成 | 新修复资产环境未触发 React #31，late `tool` / `llm.output` / `llm.reflection` rich append 可读。 |
| `AlembicPlugin`<br>无任务 | 第一版不接入 Dashboard；只观察后续 Codex handoff 是否需要展示 job URL。 |
| `AlembicTest`<br>已完成 | `Test-2026-05-24-03` 已通过总控验收。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码，只可能由 `AlembicTest` 作为验证目标使用。 |

## 可复制提示词

发送给：无。

说明：`GTODO-2026-05-23-028` 主线已完成，当前不发送新窗口。

不发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`、`BiliDili`。

## 回填区

- 2026-05-24 00:39 CST：用户确认阶段路线和展示策略；总控创建 Wave 1 执行计划，当前只发送 `AlembicCore`。
- 2026-05-24 00:50 CST：用户要求再做一次分派计划；总控复核 producer / consumer 依赖后确认 Core contract 仍是第一阻塞点，继续只发送 `AlembicCore`，提示词明确只领取 `SPLO-P1-Core`。
- 2026-05-24 09:24 CST：`AlembicCore` 完成 `SPLO-P1-Core` 并回填，提交 `19b501e6525e49f5c1c33e7e75308e1f973c64de`；新增 process event / developer view / runtime events capability contract，验证通过。当前等待总控验收，暂不发送下游窗口。
- 2026-05-24 09:40 CST：总控验收未通过。真实代码缺少回填文档声称的 `dimensionId`、`targetName`、`artifactRefs`、`parentEventId`、developer view artifact refs 和 endpoint capability policy lists；继续只发送 `AlembicCore` 返工，`Alembic` 仍阻塞。
- 2026-05-24 09:44 CST：`AlembicCore` 完成返工并回填，提交 `36429274352a5f75b2aa3eb17eacf63a0986f9f2`；typed fields、developer view artifact refs 和 capability policy lists 已补齐，验证通过。当前等待总控验收，暂不发送下游窗口。
- 2026-05-24 09:50 CST：总控验收通过 Core 返工，关闭 `GTODO-2026-05-23-028-A`；启动 `SPLO-P1-Alembic`，发送给 `Alembic`，其余窗口继续阻塞或观察。
- 2026-05-24 10:07 CST：`Alembic` 完成 `SPLO-P1-Alembic` 并回填，提交 `c2be849fdec50a6a5dbd2daa20ba4621b620721b`；bounded recent recorder、`GET /api/v1/jobs/:jobId/events`、`job:process-event` socket broadcast、health capability gating 和 cold-start 最小真实事件样例已落地，验证通过。当前等待总控验收，暂不发送下游窗口。
- 2026-05-24 10:11 CST：总控验收 `Alembic` 提交 `c2be849fdec50a6a5dbd2daa20ba4621b620721b` 通过，关闭 `GTODO-2026-05-23-028-B`；当前启动 `SPLO-P1-Dashboard`，只发送 `AlembicDashboard`。
- 2026-05-24 10:29 CST：`AlembicDashboard` 完成 `SPLO-P1-Dashboard` 并回填，提交 `fae63c56d3b7e47189c49ee047f4e79a9b060ff2`；Jobs process timeline、REST 刷新恢复、socket append、cold-start 最近关键事件摘要和任务详情入口已落地，`npm run check` 与 `git diff --check` 通过。当前等待总控验收，暂不发送下游窗口。
- 2026-05-24 10:37 CST：总控验收 `AlembicDashboard` 提交 `fae63c56d3b7e47189c49ee047f4e79a9b060ff2` 未通过。功能链路复核具备 Dashboard 消费闭环，但提交区间 `git diff --check fae63c56d3b7e47189c49ee047f4e79a9b060ff2^ fae63c56d3b7e47189c49ee047f4e79a9b060ff2` 报告 `src/hooks/useJobProcessEvents.ts:157` 和 `src/utils/jobProcessEvents.ts:64` 新增末尾空白行，与回填证据不一致；当前只发送 `AlembicDashboard` 返工，`AlembicTest` 继续阻塞。
- 2026-05-24 10:44 CST：`AlembicDashboard` 完成 `SPLO-P1-Dashboard` 返工并回填，提交 `43f45bec9c988e837cdf2c153ffd4cec11e83526`；仅删除 2 个新增文件 EOF 空白行，`npm run check`、提交前 `git diff --check`、提交后 `git diff --check HEAD^ HEAD` 均通过，确认无功能范围变化。当前等待总控验收，暂不发送下游窗口。
- 2026-05-24 10:51 CST：总控验收 `AlembicDashboard` 返工提交 `43f45bec9c988e837cdf2c153ffd4cec11e83526` 通过，关闭 `GTODO-2026-05-23-028-D`；创建 `Test-2026-05-24-01`，当前只发送 `AlembicTest` 做真实 cold-start Dashboard 展示验证。
- 2026-05-24 11:10 CST：`AlembicTest` 完成 `Test-2026-05-24-01` 并回填，报告 [../../../AlembicTest/docs/cold-start-process-timeline-test-2026-05-24.md](../../../../../AlembicTest/docs/cold-start-process-timeline-test-2026-05-24.md)。真实 `BiliDili` cold-start 验证显示 health / eventsUrl / jobs events API / Dashboard Jobs timeline / socket append / REST 刷新恢复 / Candidates cold-start 卡片 / 任务详情入口均连通；`llm.input`、`llm.output`、`llm.reflection`、`tool` 未真实产生，结论为 `producer-gap`。当前等待总控验收，暂不发送新窗口。
- 2026-05-24 11:15 CST：总控验收 `Test-2026-05-24-01` 为链路通过但 producer richness 未闭合；用户截图反馈 Jobs 展开详情区域不能滚动。当前启动 `SPLO-P1-Agent-Progress-Payload`、`SPLO-P1-Alembic-Producer-Richness` 和 `SPLO-P1-Dashboard-Scroll`，发送给 `Alembic`、`AlembicAgent`、`AlembicDashboard`。
- 2026-05-24 11:31 CST：`AlembicDashboard` 完成 `SPLO-P1-Dashboard-Scroll` 并回填，提交 `06253df5ccb342225b23d47931b04e605b3bd22c`；Jobs 页面新增明确列表级滚动容器，长 chips 可换行，`npm run check`、`git diff --check`、headless Chrome DOM scroll probe 和 `git diff --check HEAD^ HEAD` 均通过。当前 Dashboard 待总控验收；发送名单收敛为 `Alembic`、`AlembicAgent`。
- 2026-05-24 12:05 CST：`AlembicAgent` 完成 `SPLO-P1-Agent-Progress-Payload` 并回填，提交 `08f2102f23edbf3f920d2e7bc80a91e6c3c89661`；新增 developer-safe `AgentProgressProcessEvent` payload、LLM input/output、reflection nudge、tool start/end 生产点和测试，验证通过。当前等待总控验收；`Alembic` 已在提交 `0176a816cccfd4b89234569cd0f174b45d5bf6b9` 回填 producer 消费适配。
- 2026-05-24 12:06 CST：`Alembic` 完成 `SPLO-P1-Alembic-Producer-Richness` 并回填，提交 `0176a816cccfd4b89234569cd0f174b45d5bf6b9`；新增 bootstrap process event draft 层，从真实 internal AI / cold-start child run 输入、`AgentRunResult`、toolCalls、quality gate / diagnostics / efficiency 和 tier reflection 产出 `llm.input` / `llm.output` / `llm.reflection` / `tool`，由 `DaemonJobRunner` 绑定 job 后写入 `JobProcessEventRecorder`；`npm run test:unit -- BootstrapProcessEvents BootstrapEventEmitter DaemonJobRunner`、`npm run build:check`、`npm run lint:repo-boundary`、`npm run check`、`git diff --check` 均通过。当前 `Alembic` 待总控验收；所有执行窗口均待验收或观察，暂无新提示词。
- 2026-05-24 12:18 CST：总控验收 `AlembicAgent` 提交 `08f2102f23edbf3f920d2e7bc80a91e6c3c89661`、`Alembic` 提交 `0176a816cccfd4b89234569cd0f174b45d5bf6b9` 和 `AlembicDashboard` 提交 `06253df5ccb342225b23d47931b04e605b3bd22c` 通过；创建 `Test-2026-05-24-02`，当前只发送 `AlembicTest` 复测真实 cold-start rich process events、socket / REST 恢复、Jobs timeline 长内容滚动和 cold-start 卡片入口。
- 2026-05-24 12:23 CST：`AlembicTest` 完成 `Test-2026-05-24-02` 并回填，报告 [../../../AlembicTest/docs/cold-start-process-events-retest-2026-05-24.md](../../../../../AlembicTest/docs/cold-start-process-events-retest-2026-05-24.md)。真实 events API 已产出 `llm.input=2`、`tool=1`、`llm.output=1`、`llm.reflection=1`；REST recovery、Jobs timeline 滚动和 Candidates 卡片入口有截图/DOM 证据；live socket append rich event 触发 React #31，等待总控验收并判断是否分派 `AlembicDashboard` 最小修复。
- 2026-05-24 12:24 CST：总控验收 `Test-2026-05-24-02` 为部分通过，确认 producer richness / REST recovery / Jobs scroll / Candidates card 已闭合；live socket append rich content React #31 属于当前主线真实缺口。当前启动 `SPLO-P1-Dashboard-Live-Append`，只发送 `AlembicDashboard` 最小修复。
- 2026-05-24 12:31 CST：`AlembicDashboard` 完成 `SPLO-P1-Dashboard-Live-Append` 并回填，提交 `c1c7a1a4fcd5d724d86734be47ef6fff745b262d`；socket append 复用 REST developer view normalizer，structured `content` object 优先展示 `text`，`npm run check`、`git diff --check`、`git diff --check HEAD^ HEAD` 均通过。当前 Dashboard 待总控验收，暂无发送窗口。
- 2026-05-24 12:32 CST：总控验收 `AlembicDashboard` 提交 `c1c7a1a4fcd5d724d86734be47ef6fff745b262d` 通过；创建 `Test-2026-05-24-03`，当前只发送 `AlembicTest` 做 live socket append rich content 最小复测。
- 2026-05-24 12:45 CST：`AlembicTest` 完成 `Test-2026-05-24-03` 并回填，报告 [../../../AlembicTest/docs/live-socket-append-rich-content-retest-2026-05-24.md](../../../../../AlembicTest/docs/live-socket-append-rich-content-retest-2026-05-24.md)。修复资产环境下新 Dashboard 未触发 React #31，`llm.input` structured text 可见；同一打开页面最终从 19 events 追加到 38 events，包含 `tool=3`、`llm.output=3`、`llm.reflection=4` 且 rich text 可见。当前等待总控验收，暂无发送窗口。
- 2026-05-24 12:46 CST：总控验收 `Test-2026-05-24-03` 通过，关闭 live socket append React #31 缺口；`GTODO-2026-05-23-028` 第一版 cold-start process observability 主线完成。live append 批量延迟登记为 `GTODO-2026-05-24-029` 后续观察，不阻塞本轮完成。
