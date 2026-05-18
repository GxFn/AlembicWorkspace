# Lark Remote 核心拆除计划

日期：2026-05-13

## 前提

Lark Remote 已经单独制作为插件，Alembic 核心仓库不再继续承载飞书 Bot、远程 IDE 桥接、飞书通知和远程命令队列。

补充前提：当前 Alembic 没有需要兼容的外部用户或历史生产数据，且 Lark Remote 已由其他插件承载。因此本次拆除采用“彻底清理”策略，不保留旧 API、旧 DB 表、旧配置项、旧文案、兼容 shim、迁移导出脚本或弃用缓冲期。

本文只基于当前代码扫描形成拆除计划，不修改实现；也不把历史上已回滚的 mainline / rearchitecture 文档作为证据来源。

## 结论摘要

Alembic 内部的 Lark Remote 不是一个独立小入口，而是一组横跨 HTTP、Lark SDK、Agent preset、SQLite 队列、VSCode Extension、截图、任务通知、Dashboard 文案和测试的功能束。拆除时不能只删 `lib/http/routes/remote.ts`，否则 VSCode 扩展会继续轮询不存在的端点，`alembic_task` 会继续向 `/remote/notify` 和 `/remote/screenshot` 发通知，Agent profile 也会留下 `lark` / `remote-exec` 的死分支。

建议将拆除作为一个协调 PR 完成，避免中间态继续留下旧入口：

1. 核心后端拆除：HTTP remote 路由、LarkTransport、IntentClassifier、RemoteCommandRepository、LarkNotifier、Lark SDK 依赖。
2. 客户端与展示面拆除：VSCode RemoteCommandPoller、Dashboard/README 文案、测试与 package lock / Codex runtime 生成物。

不建议再拆出“兼容保留”阶段。当前没有用户，最干净的目标态是核心内完全没有 `/api/v1/remote/*`、`ALEMBIC_LARK_*`、`remote_commands`、`remote_state`、`lark` preset 和 VSCode remote poller。

## 当前实现边界

### 1. HTTP 远程桥接入口

核心文件：

- `lib/http/routes/remote.ts`：1177 行，承载绝大部分 Lark Remote 逻辑。
- `lib/http/HttpServer.ts`：无条件挂载 `this.app.use(`${apiPrefix}/remote`, remoteRouter)`。
- `lib/shared/schemas/http-requests.ts`：`RemoteSendBody`、`RemoteNotifyBody`、`RemoteResultBody`、`RemoteHistoryQuery`。
- `lib/http/middleware/requestLogger.ts`、`lib/infrastructure/monitoring/PerformanceMonitor.ts`：对 `/api/v1/remote/wait` 做 long-poll 静默或慢请求豁免。

`remote.ts` 内部功能边界：

- 飞书 SDK 长连接：动态导入 `@larksuiteoapi/node-sdk`，创建 `Client`、`EventDispatcher`、`WSClient`。
- 环境变量配置：`ALEMBIC_LARK_APP_ID`、`ALEMBIC_LARK_APP_SECRET`、`ALEMBIC_LARK_VERIFICATION_TOKEN`、`ALEMBIC_LARK_ENCRYPT_KEY`、`ALEMBIC_LARK_ALLOWED_USERS`。
- 模块级定时器：8 秒自动启动、30 秒健康检查、30 秒队列超时清理。
- 飞书端点：`/lark/start`、`/lark/stop`、`/lark/status`、`/lark/event`。
- VSCode 队列端点：`/pending`、`/claim/:id`、`/result/:id`、`/history`、`/wait`、`/flush`、`/send`。
- 通知和截图端点：`/notify`、`/screenshot`。
- 飞书 REST 回退：tenant token、消息回复、主动消息、图片上传。
- IDE 截图：通过 `platform/ScreenCaptureService` 捕获窗口，上传飞书 Image API。

拆除含义：

- 移除 `remoteRouter` import 和挂载。
- 删除 `lib/http/routes/remote.ts`。
- 删除 remote 专属 Zod schema，并更新 `ZodSchemas` 测试。
- 移除 `/remote/wait` 在 request logger / performance monitor 中的特殊处理。
- 移除所有 `ALEMBIC_LARK_*` 在核心运行时中的读取。

### 2. Lark 语义传输层

核心文件：

- `lib/external/lark/LarkTransport.ts`：飞书消息解析、白名单、文本提取、系统操作、Bot Agent / IDE Agent 分流。
- `lib/external/lark/IntentClassifier.ts`：规则 + LLM 的飞书消息意图分类。

关键逻辑：

- `$` 前缀走 `remote-exec` preset，由服务端 AgentRuntime 执行。
- `>` 前缀强制转发 IDE 队列。
- 自然语言先做 `IntentClassifier` 分类：
  - `system`：状态、截图、帮助、队列、取消、清理、ping。
  - `bot_agent`：知识管理任务，调用 `AgentService.run({ profile: { preset: 'lark' } })`。
  - `ide_agent`：编程任务，写入 remote command 队列。
- `ConversationStore` 使用 `category: 'lark'` 持久化飞书聊天历史。

拆除含义：

- 删除 `lib/external/lark/` 目录。
- 删除 `IntentClassifier` 与 `LarkTransport` 相关测试。
- 清理 Agent 层里仅为 Lark 渠道保留的 channel / preset / event / conversation category。

### 3. Remote Command 队列与数据库

核心文件：

- `lib/repository/remote/RemoteCommandRepository.ts`。
- `lib/infrastructure/database/drizzle/schema.ts` 中 `remoteCommands`、`remoteState`。
- `lib/infrastructure/database/migrations/003_add_remote_commands.ts`。
- `lib/injection/modules/InfraModule.ts` 注册 `remoteCommandRepository`。
- `lib/injection/ServiceMap.ts` 声明 `remoteCommandRepository`。
- `lib/service/cleanup/CleanupService.ts` 在 full/reset/rescan 清理表列表中包含 `remote_commands`、`remote_state`。

队列表语义：

- `remote_commands`：Lark / manual source 的 pending/running/completed/failed/timeout/cancelled 指令。
- `remote_state`：保存 `active_chat_id` 等 Lark 通知状态。
- Repository 提供 enqueue、claim、complete、flush、history、status counts、timeout cleanup、state KV。

拆除含义：

- 删除 `RemoteCommandRepository`、DI 注册和 ServiceMap 类型。
- 从 Drizzle schema 移除 `remoteCommands`、`remoteState` 导出，并更新 schema 头部表清单。
- 从 CleanupService 表清单移除 `remote_commands`、`remote_state`。
- 删除 `test/integration/RemoteCommandRepository.test.ts`。
- 更新 `test/integration/DrizzleORM.test.ts`，不再验证 remote 表导出和 CRUD。

数据库迁移决策：

- 当前采用彻底清理路线：删除运行时使用、schema 导出和仓储代码，不保留 remote 表。
- 删除 `003_add_remote_commands.ts`，避免全新数据库继续创建 Lark Remote 表。
- 不新增 drop migration，不做历史队列导出，不迁移 `active_chat_id`，不保留只读查看端点。

因为当前没有用户，不需要保留一个版本的迁移缓冲期；旧开发库若已创建过 remote 表，直接删库或重建 DB 处理。

### 4. VSCode Extension 远程轮询桥

核心文件：

- `resources/vscode-ext/src/remoteCommandPoller.ts`：527 行，完整的飞书到 IDE 桥接客户端。
- `resources/vscode-ext/src/apiClient.ts`：`getRemotePending`、`claimRemoteCommand`、`postRemoteResult`、`getRemoteLarkStatus`、`sendLarkNotify`、`flushStaleCommands`、`waitForNewCommand`。
- `resources/vscode-ext/src/extension.ts`：创建并注册 `RemoteCommandPoller`。
- `resources/vscode-ext/package.json`：贡献远程轮询命令与 `alembic.enableRemotePoller` 设置。

关键逻辑：

- 未开启设置时也会自动探测 `/remote/lark/status`，如果 Lark 已连接则自动启动。
- 启动时调用 `/remote/flush` 清理积压指令。
- 使用 `/remote/wait` long-poll，收到新消息后拉取 `/remote/pending`。
- 认领 `/remote/claim/:id` 后注入 Copilot Chat。
- 注入成功后开启 VSCode 全局 auto-approve：
  - `chat.tools.global.autoApprove`
  - `chat.tools.edits.autoApprove`
  - `chat.agent.terminal.autoApprove`
- 停止时向 Lark 通知自动审批关闭。

拆除含义：

- 删除 `remoteCommandPoller.ts`。
- 从 `extension.ts` 移除 import、实例化和注册。
- 从 `apiClient.ts` 移除所有 Remote Command API 方法。
- 从 `resources/vscode-ext/package.json` 移除远程轮询命令和 `alembic.enableRemotePoller`。
- 更新 `resources/vscode-ext/package-lock.json`（如 compile 依赖无变化则 lock 可能不变）。
- 运行 `npm run build:vscode-ext` 验证扩展编译。

### 5. Lark 任务通知与截图链路

核心文件：

- `lib/infrastructure/notification/LarkNotifier.ts`。
- `lib/external/mcp/handlers/task.ts`。
- `lib/platform/ScreenCaptureService.ts`。
- `resources/native-ui/screenshot.swift` 与 `resources/native-ui/screenshot`。
- `lib/tools/adapters/MacSystemAdapter.ts`。

当前链路：

- `alembic_task` 的 create/close/fail/record_decision 完成后调用 `notifyTaskProgress`。
- `notifyTaskProgress` 通过本地 HTTP 调 `/api/v1/remote/notify` 和 `/api/v1/remote/screenshot`。
- `/remote/screenshot` 使用 `ScreenCaptureService`，再上传到飞书。

拆除含义：

- 删除 `LarkNotifier.ts`。
- 从 `task.ts` 删除 `notifyTaskProgress` import 和 fire-and-forget 调用。
- 删除或保留 `ScreenCaptureService` 要看是否还有非 Lark 调用。当前扫描中，`ScreenCaptureService` 只被 `remote.ts` 调用；但 `resources/native-ui/screenshot.swift` 和二进制仍被 `MacSystemAdapter` 直接使用，不能因为移除 Lark Remote 而删除原生截图 helper。

建议：

- 第一阶段删除 `LarkNotifier` 和 `task.ts` 通知调用。
- 删除 `ScreenCaptureService.ts` 前再跑一次 `rg "ScreenCaptureService|from '#platform/ScreenCaptureService|platform/ScreenCaptureService"`；如果仍只有 remote 相关引用，可删除 TypeScript wrapper。
- 保留 `resources/native-ui/screenshot.swift`、`resources/native-ui/screenshot`、`build:screenshot`，因为系统工具适配器仍依赖它们。

### 6. Agent preset / channel 残留

核心文件：

- `lib/agent/service/AgentRouter.ts`：`PresetName.LARK`、LLM schema enum、`Channel.LARK` 默认路由到 `lark`。
- `lib/agent/service/AgentRunContracts.ts`：`BuiltinAgentPreset` 包含 `lark`、`remote-exec`，`AgentRunSource` 包含 `lark`。
- `lib/agent/service/AgentService.ts`：`source === 'lark'` 映射到 user runtime source / `Channel.LARK`。
- `lib/agent/profiles/presets.ts`：`lark` 和 `remote-exec` preset，且读取 `ALEMBIC_LARK_ALLOWED_USERS`。
- `lib/agent/profiles/definitions/chat.profile.ts`：`lark-chat`。
- `lib/agent/profiles/definitions/remote.profile.ts`：`remote-exec` profile。
- `lib/agent/profiles/AgentProfileCompiler.ts`：`remote-exec` service kind、`lark` conversation kind。
- `lib/agent/runtime/AgentMessage.ts`：`Channel.LARK`、`LarkMessage`、`fromLark()`。
- `lib/agent/runtime/AgentEventBus.ts`：`LARK_MESSAGE`。
- `lib/agent/context/ConversationStore.ts`：`category: 'lark'`。

建议边界：

- `lark` preset 应随 Lark Remote 删除。
- `remote-exec` 当前语义是“通过飞书/远程终端执行本地操作”，也应随 Lark Remote 删除，除非决定把它重新定义为 Dashboard/HTTP 通用远程终端能力。当前扫描没有看到非 Lark 的正式产品入口依赖它。
- 删除 `Channel.LARK`、`fromLark()`、`AgentEvents.LARK_MESSAGE`、`ConversationStore` 的 `lark` category。
- 更新 Router LLM enum，把 `lark` / `remote-exec` 从分类候选中移除。
- 更新 profile compiler 和 profile definitions。

需要注意：

- 不要删除通用 AgentRuntime、Conversation、SystemInteraction、SafetyPolicy。这些不是 Lark Remote 专属。
- 如果保留 `remote-exec`，必须重命名或重写文案，避免继续声称它由飞书触发。

### 7. Dashboard、README 与产品文案

核心文件：

- `README.md`：`Lark Remote` 功能点和 IDE 集成表。
- `README_CN.md`：`飞书远程` 功能点和 IDE 集成表。
- `dashboard/src/i18n/locales/zh.ts`。
- `dashboard/src/i18n/locales/en.ts`。
- `dashboard/src/components/Views/HelpView.tsx`。

当前文案：

- Dashboard IDE 集成声称 “6 IDEs + Lark”。
- Agent 架构声称有 4 种 preset，其中包括 `lark`、`remote-exec`。
- Strategy 文案声称 Single 处理 chat、Lark、remote exec。
- README 声称手机发消息可以意图识别并路由到 Bot 或 IDE Agent Mode。

拆除含义：

- README/README_CN 删除 Lark 行，不继续把它列为核心能力。若需要给开发者留迁移说明，只放到 release notes 或 docs-dev，不进入核心产品能力介绍。
- Dashboard i18n 改为不展示 Lark / remote-exec preset。
- `HelpView.tsx` 删除 `agentArchPresetLark` 列表项，若同时删除 `remote-exec`，也删除对应列表项，并把 “4 种 Preset 模式” 改成实际数量。
- IDE 集成描述去掉 “+ Lark”。

### 8. 依赖、锁文件和发布生成物

核心文件：

- `package.json`：`@larksuiteoapi/node-sdk`。
- `package-lock.json`：Lark SDK lock 记录。
- `plugins/alembic-codex/runtime/package.json`：生成/打包 runtime 里也包含 `@larksuiteoapi/node-sdk`。
- `plugins/alembic-codex/runtime/dist/...`：当前有编译后的 Lark/remote 代码副本。

拆除含义：

- 从根 `package.json` 删除 `@larksuiteoapi/node-sdk`。
- 更新 `package-lock.json`。
- 不建议手工编辑 `plugins/alembic-codex/runtime/dist`；应在源码删除后通过现有 release/runtime 准备脚本重新生成。
- 重新检查 `plugins/alembic-codex/runtime/package.json` 的依赖来源，确保 Lark SDK 不再进入 Codex 插件 runtime。

## 建议执行步骤

### Phase 0：确认外部插件接管边界

目标：确认核心删除后，独立 Lark Remote 插件拥有自己的配置、队列、状态、通知和 Codex 交互路径。该确认只用于避免新插件遗漏能力，不用于保留 Alembic 核心兼容层。

承接插件：

- 仓库：`https://github.com/GxFn/codex-lark-remote`
- 当前远端：`main` 存在，最新可见 release tag 到 `v0.1.24`。
- 本机已安装缓存：`codex-lark-remote@0.1.24`。
- 插件包自身依赖 `@larksuiteoapi/node-sdk`，Lark SDK 应留在该插件内，而不是 Alembic core。

已核对到的独立边界：

- 插件 README 指向 `GxFn/codex-lark-remote`，安装路径为 `plugins/codex-lark-remote`。
- 插件私有配置存放在 `~/.codex-lark-remote/config.json`，数据目录默认为 `~/.codex-lark-remote`。
- 插件有自己的 `queue.json`、`bridge-state.json`、`handoff.json`、`observation.json` 和 `bridge.log`。
- 插件有自己的 MCP 工具：`codex_lark_configure`、`codex_lark_status`、`codex_lark_check_auth`、`codex_lark_diagnose`、`codex_lark_start`、`codex_lark_handoff`、`codex_lark_stop`、`codex_lark_history`、`codex_lark_send`、`codex_lark_cancel`、`codex_lark_approve`。
- 对本机已安装 `codex-lark-remote@0.1.24` 做窄扫，未发现它调用 Alembic core 的旧 `/api/v1/remote/*` 端点，也未发现依赖 `remote_commands`、`remote_state` 或 `ALEMBIC_LARK_*`。

检查点：

- 插件不再依赖 Alembic 核心的 `/api/v1/remote/*`。
- 插件不再依赖核心的 `remote_commands` / `remote_state`。
- 插件拥有自己的 Lark app 配置读取方式。
- 插件拥有自己的任务发送、历史、取消、诊断、截图或明确不支持这些能力。
- 插件不需要 Alembic 核心提供 shim、fallback route 或旧数据导出。

产出：

- 删除 PR 描述里写清楚“核心内置 Lark Remote 移除，使用独立插件”。
- 明确旧核心数据直接清理，不做迁移承诺。

### Phase 1：后端入口和副作用拆除

修改：

- 删除 `lib/http/routes/remote.ts`。
- 从 `lib/http/HttpServer.ts` 移除 `remoteRouter` import 和挂载。
- 从 `lib/shared/schemas/http-requests.ts` 移除 Remote schemas。
- 从 request logger / performance monitor 移除 `/remote/wait` 特例。
- 删除 `lib/external/lark/`。
- 删除 `lib/infrastructure/notification/LarkNotifier.ts`，并从 `task.ts` 删除通知调用。

风险：

- `remote.ts` 的模块级 timer 会随 import 移除而消失，这是期望结果。
- 删除通知后 `alembic_task` 不再主动发飞书进度，这是期望结果。
- 如果只删除后端而没删 VSCode poller，扩展会继续访问 remote 端点。

### Phase 2：队列、DB 和 DI 拆除

修改：

- 删除 `lib/repository/remote/RemoteCommandRepository.ts`。
- 从 `InfraModule`、`ServiceMap` 移除 `remoteCommandRepository`。
- 从 Drizzle schema 移除 `remoteCommands` / `remoteState`。
- 从 CleanupService 表清单移除 `remote_commands` / `remote_state`。
- 删除 `003_add_remote_commands.ts`，避免新库继续创建 remote 表。
- 不新增 drop migration，不保留只负责兼容旧表的 repository、schema 或 cleanup 分支。

测试调整：

- 删除 `RemoteCommandRepository.test.ts`。
- 更新 `DrizzleORM.test.ts`。
- 更新 `ZodSchemas.test.ts`。

### Phase 3：VSCode Extension 远程桥拆除

修改：

- 删除 `resources/vscode-ext/src/remoteCommandPoller.ts`。
- 从 `resources/vscode-ext/src/extension.ts` 删除 `RemoteCommandPoller` 注册。
- 从 `resources/vscode-ext/src/apiClient.ts` 删除 remote API 方法。
- 从 `resources/vscode-ext/package.json` 删除远程命令与 `alembic.enableRemotePoller` 配置。

验证：

- `npm run build:vscode-ext`。
- 如果 extension package lock 变化，更新 `resources/vscode-ext/package-lock.json`。

### Phase 4：Agent preset 和渠道残留拆除

修改：

- 删除 `lark` preset、`lark-chat` profile。
- 删除或重新定义 `remote-exec` preset/profile。推荐删除，除非另有非 Lark 产品入口需要它。
- 从 `AgentRouter` 删除 `PresetName.LARK`、`REMOTE_EXEC` 的 Lark 说明、`Channel.LARK` 路由和 LLM enum。
- 从 `AgentRunContracts` 删除 `lark` / `remote-exec` 类型项。
- 从 `AgentService` 删除 `source === 'lark'` 特判。
- 从 `AgentMessage` 删除 `Channel.LARK`、`LarkMessage`、`fromLark()`。
- 从 `AgentEventBus` 删除 `LARK_MESSAGE`。
- 从 `ConversationStore` 删除 `category: 'lark'` 类型。

验证：

- 运行 Agent 相关单测。
- 全局 `rg "lark|Lark|remote-exec|fromLark|Channel.LARK|LARK_MESSAGE|ALEMBIC_LARK"`，确认只剩插件迁移说明或无关词。

### Phase 5：文案、依赖和生成物

修改：

- README / README_CN 移除核心 Lark Remote 宣称。
- Dashboard i18n / HelpView 移除 Lark / remote-exec preset 展示。
- 删除根依赖 `@larksuiteoapi/node-sdk` 并更新 lock。
- 重新生成 Codex runtime/package，避免 `plugins/alembic-codex/runtime` 继续带 Lark SDK 和 dist 副本。

验证：

- `npm run build`。
- `npm run lint`。
- `npm run build:dashboard`。
- `npm run build:vscode-ext`。
- `npm run test:unit`。
- `npm run test:integration` 或至少运行改动相关 integration tests。

## 需要避免误删

这些名字容易被搜索命中，但不是 Lark Remote：

- `StarlarkParser`、Bazel/Buck/Pants Starlark 解析：与 Lark 无关，不删。
- README 里的 `Remote Repository`：Recipe 远程仓库能力，不是 Lark Remote，不删。
- `test/fixtures/factory.ts` 里的 git remote helper：测试 git remote，不删。
- `MacSystemAdapter` 和 `resources/native-ui/screenshot.swift`：系统工具截图能力仍在，不因 Lark Remote 删除。
- 通用 `AgentRuntime`、`SafetyPolicy`、`SystemInteraction`、`Conversation` 能力：不是 Lark 专属，不删。

## 验收标准

代码层：

- `rg "@larksuiteoapi|ALEMBIC_LARK|LarkTransport|IntentClassifier|RemoteCommandPoller|RemoteCommandRepository|remote_commands|remote_state|/remote/wait|sendLark|notifyTaskProgress" lib resources dashboard README.md README_CN.md package.json` 不再命中核心实现。允许在删除计划文档或迁移说明中命中。
- `lib/http/HttpServer.ts` 不再挂载 `/api/v1/remote`。
- VSCode 扩展不会注册 remote poller，也不会访问 `/remote/*`。
- `alembic_task` 不再调用 LarkNotifier。
- 根依赖中无 `@larksuiteoapi/node-sdk`。

产品层：

- Dashboard / README 不再把 Lark Remote 作为 Alembic 核心能力宣传。
- 核心产品文案不再出现 Lark Remote；插件文档由独立插件维护。

测试层：

- `npm run build` 通过。
- `npm run lint` 通过。
- `npm run build:dashboard` 通过。
- `npm run build:vscode-ext` 通过。
- `npm run test:unit` 通过。
- `npm run test:integration` 通过，或在 PR 中明确跳过原因和剩余风险。

## 风险与处理

1. 旧数据库数据

`remote_commands` 和 `remote_state` 可能包含开发期历史指令与 active chat。当前没有外部用户，不保留、不导出、不通过迁移兼容清理；旧库直接删库或重建。

2. VSCode auto-approve 副作用

当前 remote poller 会修改 VSCode 全局 auto-approve 设置。删除时要确保没有残留启动路径；否则无法保证停止时恢复配置。

3. 插件与核心的职责重叠

如果独立插件仍调用 Alembic 核心 `/api/v1/remote/*`，核心删除会破坏插件。Phase 0 必须确认插件已经完全自洽。

4. `remote-exec` 是否还有未来用途

当前代码语义强绑定飞书远程执行。若想把它保留为通用安全终端 Agent，需要先重新设计产品入口、权限和文案；不应在 Lark Remote 删除 PR 里半保留一个名字相同但语义模糊的 preset。

5. 生成物漂移

`plugins/alembic-codex/runtime/dist` 是生成物/打包物，手工删容易漏。应通过构建和 release runtime 脚本刷新。

## 建议最终提交拆分

推荐一个 PR 完成，commit 可分为：

1. `remove core lark remote server surface`
2. `remove vscode lark remote poller`
3. `remove lark agent presets and tests`
4. `update docs dashboard and package locks`

如果担心回归面过大，也只拆成两个连续 PR，不引入兼容期：

- PR A：后端 + VSCode 访问路径同时切断，并删除运行时引用。
- PR B：Agent preset / DB schema / docs / dependency / runtime 彻底清理。

不要只提交“删除 route”的中间态。

## 2026-05-13 执行结果

本轮已按“彻底清理”路线执行，不保留兼容 shim。

已完成：

- 删除核心 Lark Remote 后端 surface：`/api/v1/remote` 路由、Lark transport、intent classifier、Lark notifier、remote command repository。
- 删除新库创建旧表的 `003_add_remote_commands`，不新增旧表兼容/清理迁移。
- 删除 VSCode `RemoteCommandPoller`、remote API client 方法、remote commands 和 `alembic.enableRemotePoller` 配置项。
- 删除 Agent 层 `lark` / `remote-exec` preset、profile、router enum、`Channel.LARK`、`fromLark()`、`LARK_MESSAGE` 和 `lark` conversation category。
- README、README_CN、Dashboard Help/i18n 不再把 Lark Remote 作为 Alembic 核心能力展示。
- 根依赖和 lockfile 移除 `@larksuiteoapi/node-sdk`。
- 重新构建并刷新 `plugins/alembic-codex/runtime` 与 `runtime.tgz`，删除嵌入 runtime 中的旧 Lark/remote dist 文件。

验证结果：

- `npm run build` 通过。
- `npm run build:vscode-ext` 通过。
- `npm run build:dashboard` 通过。
- `npm run test:unit` 沙盒外通过：160 files / 2393 tests。
- `npm run test:integration` 沙盒外通过：40 files / 884 tests，3 个条件套件跳过。
- `npm run verify:codex-plugin` 通过。
- 改动相关定向测试通过：`AgentService.test.ts`、`AiRouteDirectTool.test.ts`、`DrizzleORM.test.ts`、`ZodSchemas.test.ts`。
- 核心 + 插件 runtime 残留搜索只剩 Starlark、历史 CHANGELOG 和计划文档中的说明性命中。

注意：

- `npm run lint` 当前仍因既有 lint 债失败，首批命中位于 `ContextWindow.ts`、`EvidenceCollector.ts`、`scripts/setup-mcp-config.ts` 等非本次拆除文件；本次改动文件的定向 Biome 检查无 error，只剩既有 non-null assertion warning。
