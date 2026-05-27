# AlembicCore Scan Progress Live Output Contract 回填

状态：SPLO-P1-Core 返工后总控验收通过
执行窗口：AlembicCore
任务包：SPLO-P1-Core
更新时间：2026-05-24 09:44 CST
提交 hash：`36429274352a5f75b2aa3eb17eacf63a0986f9f2`
前次提交：`19b501e6525e49f5c1c33e7e75308e1f973c64de`

## 窗口定位

本窗口定位为 `AlembicCore`。本轮只承担共享、确定性、可复用、可运行的 headless contract 能力：定义 cold-start / rescan process event、developer view、事件分类、sourceClass / displayPolicy / retention 和 runtime job event endpoint capability。

本轮明确不承担 `Alembic` daemon / HTTP / recorder / socket broadcast，不承担 `AlembicDashboard` UI，不承担 `AlembicAgent` runtime / AI provider / tool system，也不新增空 provider、空 adapter 或无真实消费方的 glue code。

## 完成范围

- 新增 `JobProcessEventContracts`，定义 `JobProcessEvent`、`JobProcessDeveloperView`、`CreateJobProcessEventInput` 和 `JobProcessEventEndpointCapability`。
- 新增事件类别：`workflow`、`llm.input`、`llm.reflection`、`llm.output`、`tool`、`artifact`、`checkpoint`、`error`、`summary`。
- 新增展示来源分类：`developer-facing`、`machine-only`、`raw-provider`、`secret`、`hidden-reasoning`。
- 新增展示策略：`full`、`summary-only`、`hidden`；新增 retention：`transient`、`job-retained`、`artifact-retained`。
- 明确默认策略：`developer-facing` 默认 `full` + `job-retained`；`machine-only` 默认 `hidden` + `job-retained`；`raw-provider`、`secret`、`hidden-reasoning` 默认 `hidden` + `transient`。
- `createJobProcessDeveloperView` 只允许 `developer-facing` 且非 `hidden` 的事件进入开发者视图；`summary-only` 只暴露摘要，`full` 保留完整 content。
- Runtime capability 增加 `jobs.processEvents` 和 `jobs.endpoints.events`，endpoint path 为 `/api/v1/jobs/:jobId/events`。
- 更新 `@alembic/core/daemon` public exports 和 public API smoke，避免下游走 deep import。
- 新增 / 更新 contract tests 覆盖 developer-facing 完整展示、非展示源隐藏、非法 kind 拒绝、endpoint capability 和 runtime summary。
- 返工补齐 `dimensionId`、`targetName`、`artifactRefs`、`parentEventId` typed 字段；`parentId` 仅作为 normalizer 兼容输入，输出统一为 `parentEventId`。
- 返工补齐 `JobProcessDeveloperView` 的 `artifactRefs`、`dimensionId`、`targetName`、`parentEventId` 和 `metadata` 投影，Dashboard 不需要解析不透明 metadata 才能拿到产物引用。
- 返工补齐 endpoint capability 的 `supportedSourceClasses`、`supportedDisplayPolicies`、`supportedRetentionPolicies`，并同步 runtime summary、tests、exports 与 public smoke。

## 关键文件

- `src/daemon/JobProcessEventContracts.ts`
- `src/daemon/RuntimeContracts.ts`
- `src/daemon/index.ts`
- `test/JobProcessEventContracts.test.ts`
- `test/RuntimeContracts.test.ts`
- `scripts/smoke-public-api.mjs`

## 公开消费入口

下游应从 `@alembic/core/daemon` 消费本轮 contract：

- `ALEMBIC_JOB_PROCESS_EVENTS_PATH`
- `JOB_PROCESS_EVENT_KINDS`
- `JOB_PROCESS_EVENT_SOURCE_CLASSES`
- `JOB_PROCESS_EVENT_DISPLAY_POLICIES`
- `JOB_PROCESS_EVENT_RETENTION_POLICIES`
- `createJobProcessEvent`
- `normalizeJobProcessEvent`
- `createJobProcessDeveloperView`
- `createJobProcessEventEndpointCapability`
- `isJobProcessEventDeveloperVisible`
- `JobProcessEventArtifactRef`
- `JobProcessEventDisplayPolicy`
- `JobProcessEventRetentionPolicy`
- `JobProcessEvent`
- `JobProcessDeveloperView`
- `JobProcessEventEndpointCapability`
- `JobProcessEventKind`
- `JobProcessEventSourceClass`

## Contract 字段说明

`JobProcessEvent` 用于机器层记录：

- `id`、`jobId`、`sequence`、`createdAt`
- `kind`、`sourceClass`、`displayPolicy`、`retention`、`severity`
- `phase`、`dimensionId`、`targetName`、`title`
- `content`、`summary`
- `correlationId`、`parentEventId`、`artifactRefs`、`metadata`

`JobProcessDeveloperView` 用于 Dashboard 开发者展示：

- 只由 developer-facing 事件投影生成。
- 保留 `eventId`、`jobId`、`sequence`、`createdAt`、`kind`、`severity`、`phase`、`dimensionId`、`targetName`、`parentEventId`、`title`、`summary`、`content`、`artifactRefs` 和 `metadata`。
- 当 `displayPolicy` 为 `summary-only` 时，`content` 投影为 `null`。

`JobProcessEventEndpointCapability` 用于 resident runtime capability：

- `available`
- `contractVersion`
- `endpoint`
- `supportedKinds`
- `supportedSourceClasses`
- `supportedDisplayPolicies`
- `supportedRetentionPolicies`
- `developerDefaultDisplayPolicy`
- `defaultRetention`

## 验证命令与结果

- `npm run build:check`：通过。
- `npm run test -- test/JobProcessEventContracts.test.ts test/RuntimeContracts.test.ts test/ResidentServiceContracts.test.ts`：通过，3 个文件，14 个测试。
- `npm run lint`：通过，检查 427 个文件。
- `npm run check`：通过，67 个测试文件，960 个测试。
- `npm run build`：通过。
- `npm run smoke:public-api`：通过，导入 75 个 exact public API entrypoints。
- `git diff --check`：通过。
- `alembic_guard`：未运行成功；该 Core 仓库当前没有可用 Alembic knowledge base，工具返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`。

## 遗留风险

- Core 只定义 contract，不提供 recorder、HTTP endpoint、socket broadcast 或 Dashboard UI；这些仍需 `Alembic` 和 `AlembicDashboard` 后续接入。
- `JobProcessEvent` 的 `id`、`sequence` 排序、recent retention 容量和持久化窗口需要 `Alembic` recorder/API 实现时定下真实运行策略。
- Agent progress、tool call、nudge / reflection、LLM 可见输出能否完全从现有 Alembic callbacks 捕获，需要 `Alembic` Phase 1B 实作后再判断是否派发 `AlembicAgent`。
- Dashboard 应等待 Alembic API 和真实事件样例后再做 timeline，不应提前 mock 字段或解析 debug log 作为主数据源。

## 下一步建议

- `Alembic` Phase 1B：从 `@alembic/core/daemon` 消费 contract，实现 process event recorder、`/api/v1/jobs/:jobId/events`、socket broadcast 和 cold-start workflow 最小 producer；先覆盖 reset / start / phase / dimension / artifact / error / summary。
- `Alembic` Phase 1B：`jobs.processEvents.available` 应由真实 API 能力驱动，不能只声明 capability 而没有 endpoint。
- `AlembicDashboard` 后续：消费 `JobProcessDeveloperView`，按 `kind` 分组展示；hidden / machine-only / raw-provider / secret / hidden-reasoning 不进入开发者 timeline。
- `AlembicTest` 后续：等 Core + Alembic + Dashboard 闭合后，再创建真实项目 cold-start 持续输出验证单。

## 总控验收

状态：前次未通过；已返工并由总控复核通过，允许启动 `Alembic`。
验收时间：2026-05-24 09:40 CST

真实代码证据：

- `AlembicCore/src/daemon/JobProcessEventContracts.ts:58` 的 `JobProcessEvent` 当前只有 `metadata`、`parentId`、`phase` 等通用字段，未提供本文件字段说明声称的 `dimensionId`、`targetName`、`artifactRefs` 或 `parentEventId` typed 字段。
- `AlembicCore/src/daemon/JobProcessEventContracts.ts:78` 的 `JobProcessDeveloperView` 当前未投影 `artifactRefs` 或 `metadata`，但本文件字段说明写明 Dashboard view 会保留 `artifactRefs` 和 `metadata`。
- `AlembicCore/src/daemon/JobProcessEventContracts.ts:111` 的 `JobProcessEventEndpointCapability` 当前只有 `supportedKinds`，未包含本文件字段说明写明的 `supportedSourceClasses`、`supportedDisplayPolicies`、`supportedRetentionPolicies`。

返工要求：

- 补齐 `JobProcessEvent` / `CreateJobProcessEventInput` / normalizer 的 typed 字段：`dimensionId`、`targetName`、`artifactRefs`；将 `parentId` 与文档中的 `parentEventId` 统一，避免 Alembic / Dashboard 猜字段。
- 补齐 `JobProcessDeveloperView` 的产物引用投影，至少让 Dashboard 能直接读取 artifact refs，不依赖不透明 `metadata` 解析。
- 补齐 `JobProcessEventEndpointCapability` 的 `supportedSourceClasses`、`supportedDisplayPolicies`、`supportedRetentionPolicies`，并更新 creator、summary、tests 和 public smoke。
- 更新本执行回填文档，让字段说明与真实代码完全一致；如果刻意不暴露某个字段，必须写清替代入口和原因。
- 重新运行 `npm run build:check`、targeted contract tests、`npm run lint`、`npm run check`、`npm run build`、`npm run smoke:public-api`、`git diff --check`，并回填结果。

## 返工回填

状态：返工完成，已通过总控验收。
返工提交：`36429274352a5f75b2aa3eb17eacf63a0986f9f2`
返工时间：2026-05-24 09:44 CST

完成范围：

- `JobProcessEvent` / `CreateJobProcessEventInput` 已补齐 `dimensionId`、`targetName`、`artifactRefs` 和 `parentEventId`。
- `normalizeJobProcessEvent` 输出统一为 `parentEventId`；为避免前次事件样本立刻失效，normalizer 仅兼容读取旧 `parentId` 输入。
- `JobProcessDeveloperView` 已投影 `artifactRefs`、`dimensionId`、`targetName`、`parentEventId` 和 `metadata`，满足 Dashboard timeline 直接渲染产物引用和维度 / target 上下文。
- `JobProcessEventEndpointCapability` 已补齐 `supportedSourceClasses`、`supportedDisplayPolicies`、`supportedRetentionPolicies`，runtime capability summary 同步增加 `jobEventSourceClasses`、`jobEventDisplayPolicies`、`jobEventRetentionPolicies`。
- `src/daemon/index.ts` 和 `scripts/smoke-public-api.mjs` 已同步新增类型 / 常量导出检查。
- `test/JobProcessEventContracts.test.ts` 和 `test/RuntimeContracts.test.ts` 已覆盖返工字段、legacy `parentId` 输入兼容、developer view artifact refs 投影和 capability policy lists。

给 `Alembic` 的消费建议：

- 从 `@alembic/core/daemon` 消费 `JobProcessEvent`、`JobProcessEventArtifactRef`、`JobProcessDeveloperView` 和 `createJobProcessEventEndpointCapability`，不要自建同名 DTO。
- recorder 写入时统一写 `parentEventId`；如读取旧样本存在 `parentId`，可以先交给 Core normalizer 兼容。
- dimension 维度事件直接写 `dimensionId`，模块 / target 事件直接写 `targetName`，产物事件写 `artifactRefs: [{ kind, ref, label, mimeType }]`。
- health / capability 中的 `jobs.processEvents.available` 只能在真实 job events API 可用后置为 `true`；同时透出 Core capability 的 supported lists，方便 Dashboard 判断展示策略。
- Dashboard 使用 `JobProcessDeveloperView.artifactRefs` 渲染产物引用，不要从 `metadata` 解析产物路径。

遗留风险：

- Core 仍只定义 contract，不提供 recorder、HTTP endpoint、socket broadcast 或 Dashboard UI。
- artifact ref 的 `kind/ref/label/mimeType` 是第一版最小 typed shape；如果 Alembic 后续需要 clickable URL、artifact size 或 checksum，应在 Core contract 继续 additive 扩展。

## 返工总控验收

状态：通过。
验收时间：2026-05-24 09:50 CST

验收证据：

- `AlembicCore/src/daemon/JobProcessEventContracts.ts:65` 已包含 `artifactRefs`、`dimensionId`、`targetName`、`parentEventId`。
- `AlembicCore/src/daemon/JobProcessEventContracts.ts:88` 的 `JobProcessDeveloperView` 已投影 artifact refs、dimension、target、parent 和 metadata。
- `AlembicCore/src/daemon/JobProcessEventContracts.ts:129` 的 `JobProcessEventEndpointCapability` 已包含 `supportedSourceClasses`、`supportedDisplayPolicies`、`supportedRetentionPolicies`。
- `AlembicCore/src/daemon/RuntimeContracts.ts:179` 以后 runtime summary 已暴露 `jobEventSourceClasses`、`jobEventDisplayPolicies`、`jobEventRetentionPolicies`。
- `test/JobProcessEventContracts.test.ts` 覆盖 developer-facing 完整展示、typed artifact refs、legacy `parentId` 输入兼容和 capability policy lists；`test/RuntimeContracts.test.ts` 覆盖 runtime capability summary。

总控结论：

- `SPLO-P1-Core` 完成。
- `GTODO-2026-05-23-028-A` 关闭。
- 下游可以启动 `SPLO-P1-Alembic`，从 `@alembic/core/daemon` 消费 contract，不得自建同名 DTO。
