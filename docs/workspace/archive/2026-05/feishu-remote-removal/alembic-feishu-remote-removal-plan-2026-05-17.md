# Alembic Feishu Remote Removal Plan

日期：2026-05-17
总控窗口：AlembicWorkspace
状态：已完成

## 1. 目标

删除 Alembic 产品线内置的飞书 / Lark 远程能力。

本次目标不是禁用，也不是保留兼容 shim，而是把核心仓库里的 Feishu/Lark remote bridge 从运行时、HTTP surface、Agent preset、数据库 schema、VSCode extension、Dashboard 文案、依赖和发布镜像中完整移除。

外部 Codex `codex-lark-remote` 插件不属于本次 Alembic workspace 仓库删除范围；除非用户单独要求，不动用户当前 Codex 环境里的 Lark Remote 插件。

## 2. 真实代码结论

当前 Feishu/Lark remote 不是一个小入口，而是一整束横跨多仓库的能力：

| 仓库 | 真实命中 | 结论 |
| --- | --- | --- |
| `Alembic` | `lib/http/routes/remote.ts` 1177 行；`lib/external/lark/LarkTransport.ts` 637 行；`IntentClassifier.ts` 383 行；`RemoteCommandRepository.ts` 294 行；`resources/vscode-ext/src/remoteCommandPoller.ts` 527 行；`LarkNotifier.ts`；`@larksuiteoapi/node-sdk` | 主删除仓库。必须先切断 HTTP route、Lark SDK、remote command queue、VSCode poller、MCP task Lark notifier 和 package dependency。 |
| `AlembicAgent` | `lark` / `remote-exec` preset、`lark-chat` / `remote-exec` profile、`Channel.LARK`、`AgentMessage.fromLark()`、`AgentRunSource: 'lark'`、`LARK_MESSAGE`、`ConversationStore` category `lark` | 第二阶段删除。它们现在只服务 Alembic 的 LarkTransport，不应作为通用 terminal/sandbox 能力保留。 |
| `AlembicCore` | `003_add_remote_commands.ts`、Drizzle `remoteCommands` / `remoteState`、`DatabaseRepository.test.ts` 和 Alembic consumer allowlist | 第二阶段删除 schema。按用户决策不处理旧数据、不新增 drop migration；旧开发库可重建，新库不再创建 remote 表。 |
| `AlembicDashboard` | Help/i18n 文案仍宣传 Lark、飞书、`remote-exec` preset | 文案/UI 清理；不接入代码执行，风险低。 |
| `AlembicPlugin` | first-party plugin 代码未命中 Lark；但 vendored `AlembicCore` 仍带 remote schema/migration，runtime vendor 可能随 Core 同步 | 第三阶段 vendor/runtime sweep。 |

不是本次删除目标的误命中：

- `StarlarkParser`：Bazel/Buck/Pants Starlark 解析，与 Lark 无关。
- 通用 WebSocket / socket.io：Dashboard realtime 使用，不是飞书长连接。
- `remote` git fixture / remote repository 文案：不是 Feishu remote。
- terminal/sandbox 能力：继续保留 `@alembic/agent/tools/terminal` portable contract 和 Alembic host-owned terminal/sandbox bridge。
- `MacSystemAdapter` 和 native screenshot helper：只删除飞书上传链路，不因 Lark 删除而误删通用 macOS adapter。

## 3. 删除边界

必须删除：

- `/api/v1/remote/*` HTTP route。
- Lark SDK long connection、webhook、tenant token、message reply、image upload。
- `ALEMBIC_LARK_*` 环境变量读取。
- remote command queue：`remote_commands`、`remote_state`、`RemoteCommandRepository`、VSCode remote poller。
- MCP task 完成后的 Lark notifier。
- Agent `lark` 和 `remote-exec` preset/profile/channel/source/event。
- Dashboard/README/Help 中把 Lark Remote 作为核心能力的文案。
- 根依赖 `@larksuiteoapi/node-sdk` 和 lock 记录。
- vendor/runtime 中随 Core/Dashboard 复制出的 remote schema 和 Lark 文案。

必须保留：

- Alembic terminal/sandbox host bridge。
- Agent terminal portable contract。
- MCP、HTTP、Dashboard、VSCode extension 的非 remote 能力。
- Guard、Knowledge、Bootstrap、Candidates、Core schema 主线。

## 4. 推荐顺序

不能所有窗口完全同时开始。推荐三波推进：

1. Wave 1：`Alembic` 先切断主运行时调用方，消灭 `/remote`、Lark SDK、副作用 timer、VSCode remote poller、MCP task notifier 和本地 remote repository。
2. Wave 2：`AlembicAgent`、`AlembicCore`、`AlembicDashboard` 并行清理已经无调用方的 contract/schema/UI 文案。
3. Wave 3：`Alembic` 和 `AlembicPlugin` 同步 vendor/runtime，跑 release readiness 和全局负向扫描。

理由：如果 `AlembicAgent` 先删除 `lark` / `remote-exec`，当前 `Alembic` 的 `LarkTransport` 和相关测试会立刻编译失败；如果 `AlembicCore` 先删 remote schema，当前 `Alembic` 的 `RemoteCommandRepository` 和 integration tests 会编译失败。

## 5. 分派表

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Alembic` | 已完成 | Wave 3：同步 `vendor/AlembicCore` 到 `0c64fd7549d58ceded8eed163dae85c6678ea679`、同步 `vendor/AlembicDashboard` 到 `32b2e01c249665e3dc33bdcffbfc39b648d0426d`，复验 Agent package/contract 消费，清理 vendored remote schema 和 Lark 文案残留。 | 已新建 | `docs/Alembic/alembic-vendor-feishu-remote-sweep-2026-05-18.md` | 本文第 5 节 | 本文第 11 节和专项文档 | `npm run check`; `npm run build`; `npm run build:vscode-ext`; `npm run lint:agent-extraction-boundary`; `npm run lint:core-import-boundary`; cross-repo negative scan | 提交 `0d109d0469d5cf978252da8217cc674ac400f14d`；Alembic Wave 3 已完成，等待 Plugin Wave 3 收口。 |
| `AlembicAgent` | 已完成 | 已删除 Lark/remote-exec contract surface：`lark` / `remote-exec` preset/profile、`Channel.LARK`、`fromLark()`、`AgentRunSource: 'lark'`、`LARK_MESSAGE`、`ConversationStore` lark category、相关 router enum/test。 | 已新建 | `docs/AlembicAgent/alembic-agent-lark-remote-preset-removal-2026-05-17.md` | 本文第 5 节 | 本文第 7.2 节和专项文档 | `npm run check`; `npm run build`; public import smoke; negative scan | 提交 `cad5f0bc986d910e6ffa92decd85065167659a0f`；Wave 2 已完成。 |
| `AlembicCore` | 已完成 | 删除 remote schema/migration：移除 `003_add_remote_commands.ts`、Drizzle `remoteCommands` / `remoteState`；不新增 drop migration；更新 Core tests 和 public API boundary。 | 已新建 | `docs/AlembicCore/alembic-core-remote-schema-removal-2026-05-17.md` | 本文第 5 节 | 本文第 7.3 节和专项文档 | `npm run check`; `npm run build`; `npm run smoke:public-api`; package dry-run; negative scan | 提交 `0c64fd7549d58ceded8eed163dae85c6678ea679`；旧开发库按用户决策重建。 |
| `AlembicDashboard` | 已完成 | 已清理 Help/i18n 中 Lark、飞书、remote-exec 的产品展示；Agent 架构说明改为 `chat` / `insight` / `evolution` 三个核心 preset。 | 已新建 | `docs/AlembicDashboard/alembic-dashboard-lark-copy-removal-2026-05-17.md` | 本文第 5 节 | 本文第 7.4 节和专项文档 | `npm run build`; i18n negative scan | 已完成；后续如 Agent 最终 preset 列表不同再二次同步。 |
| `AlembicPlugin` | 已完成 | Wave 3：已同步 `vendor/AlembicCore`、`vendor/AlembicDashboard` 和相关 runtime/package/channel 产物，确认 Codex plugin 不带 remote schema、`remote-exec` 或 Feishu/Lark 文案。 | 已新建 | `docs/AlembicPlugin/alembic-plugin-vendor-feishu-remote-sweep-2026-05-18.md` | 本文第 5 节 | 本文第 11.2 节和专项文档 | `npm run check`; `npm run build`; `npm run build:dashboard`; `npm run prepare:codex-plugin-runtime`; `npm run verify:codex-plugin`; `npm run verify:codex-channel`; `npm run smoke:codex-plugin`; negative scan | 已完成；普通 plugin smoke 不启动 live daemon。 |

## 6. Wave 1 Alembic 细节

删除范围：

- `lib/http/routes/remote.ts`。
- `lib/http/HttpServer.ts` 中 `remoteRouter` import 和 `/api/v1/remote` mount。
- `lib/external/lark/**`。
- `lib/infrastructure/notification/LarkNotifier.ts`，以及 `lib/external/mcp/handlers/task.ts` 中 `notifyTaskProgress` 调用。
- `lib/repository/remote/RemoteCommandRepository.ts`。
- `lib/injection/modules/InfraModule.ts` 中 `remoteCommandRepository` 注册。
- `lib/injection/ServiceMap.ts` 中 `RemoteCommandRepository` 类型和 service key。
- `lib/service/cleanup/CleanupService.ts` 中 `remote_commands` / `remote_state` 表清理项。
- `lib/shared/schemas/http-requests.ts` 中 Remote schemas 和 schema 头部说明。
- `lib/http/middleware/requestLogger.ts`、`lib/infrastructure/monitoring/PerformanceMonitor.ts` 中 `/remote/wait` 特例。
- `resources/vscode-ext/src/remoteCommandPoller.ts`。
- `resources/vscode-ext/src/extension.ts` 中 remote poller 注册。
- `resources/vscode-ext/src/apiClient.ts` 中 `/remote/*` 方法。
- `resources/vscode-ext/package.json` 中 remote commands 和 `alembic.enableRemotePoller`。
- `package.json` / `package-lock.json` 中 `@larksuiteoapi/node-sdk`。
- `README.md` / `README_CN.md` / `CHANGELOG.md` 中仍宣传当前核心 Lark Remote 的内容。
- `config/agent-extraction-boundary.json` 和 Alembic 仓库 `AGENTS.md` 中“Lark runtime 继续保留”的稳定边界描述。

测试调整：

- 删除 `test/unit/LarkTransportAgentService.test.ts`。
- 删除 `test/integration/IntentClassifier.test.ts`。
- 删除 `test/integration/RemoteCommandRepository.test.ts`。
- 更新 `test/integration/ZodSchemas.test.ts` 删除 Remote schema 用例。
- 更新 `test/integration/DrizzleORM.test.ts` 删除 Alembic consumer 侧 remote table CRUD 用例，或等待 Core wave 后再最终收口。
- 更新 `test/unit/AgentService.test.ts`、`test/unit/AiRouteDirectTool.test.ts` 中 `remote-exec` mode 用例，避免继续验证将被删除的 preset。

Alembic Wave 1 最低验收：

```text
npm run build:check
npm run build:vscode-ext
npm run lint:agent-extraction-boundary
npm run lint:core-import-boundary
npm run test:unit -- test/unit/AgentService.test.ts test/unit/AiRouteDirectTool.test.ts
npm run test:integration -- test/integration/ZodSchemas.test.ts test/integration/DrizzleORM.test.ts
npm run build
rg -n "@larksuiteoapi|ALEMBIC_LARK|LarkTransport|IntentClassifier|RemoteCommandPoller|RemoteCommandRepository|/api/v1/remote|/remote/wait|sendLark|notifyTaskProgress" lib resources test package.json package-lock.json README.md README_CN.md config --glob '!**/node_modules/**' --glob '!**/dist/**'
```

负向扫描允许的剩余命中：删除计划文档、历史 docs、`StarlarkParser`、非 Feishu 的 git remote / remote repository 语义。

## 7. 后续窗口细节

### 7.1 Alembic 回填

回填完成范围、删除文件列表、提交 hash、验证命令、负向扫描剩余命中分类、遗留风险。

完成状态：已完成。

提交 hash：`857f430d0524d4003e54d1bc04e4df81330f0ad8`。

专项记录：`docs/Alembic/alembic-feishu-remote-removal-2026-05-17.md`。

完成范围：

- 已删除 `/api/v1/remote` HTTP route、`lib/external/lark/**`、`LarkNotifier`、`RemoteCommandRepository`、VSCode remote poller、remote schemas、remote DI/service map/cleanup/request logger/performance monitor consumers。
- 已移除 MCP task Lark notifier 调用和 `@larksuiteoapi/node-sdk` dependency。
- 已清理 README / README_CN / CHANGELOG / AGENTS / boundary config 中当前产品层面的 Lark runtime 保留描述。
- 已删除 remote/Lark 专属测试，并更新 ZodSchemas、DrizzleORM、AgentService、AiRouteDirectTool 测试。

删除文件：

- `lib/http/routes/remote.ts`
- `lib/external/lark/IntentClassifier.ts`
- `lib/external/lark/LarkTransport.ts`
- `lib/infrastructure/notification/LarkNotifier.ts`
- `lib/repository/remote/RemoteCommandRepository.ts`
- `resources/vscode-ext/src/remoteCommandPoller.ts`
- `test/unit/LarkTransportAgentService.test.ts`
- `test/integration/IntentClassifier.test.ts`
- `test/integration/RemoteCommandRepository.test.ts`

验证结果：

- `npm run build:check`：通过。
- `npm run build:vscode-ext`：通过。
- `npm run lint:agent-extraction-boundary`：通过。
- `npm run lint:core-import-boundary`：通过。
- `npm run test:unit -- test/unit/AgentService.test.ts test/unit/AiRouteDirectTool.test.ts`：通过，2 files / 14 tests。
- `./node_modules/.bin/vitest run test/integration/ZodSchemas.test.ts test/integration/DrizzleORM.test.ts`：通过，2 files / 72 tests。
- `npm run check`：通过；Biome 仅报告既有 warnings/infos。
- `npm run build`：通过。
- `git diff --check`：通过。

负向扫描剩余命中：

- Alembic 产品根扫描仅剩 `test/unit/MultiLanguageParsers.test.ts` 中 `StarlarkParser` / `parseStarlarkBuildFile`，属于 Bazel / Buck / Pants Starlark parser 测试，非 Feishu / Lark remote。
- `remoteCommandRepository|remoteRouter|RemoteSendBody|RemoteNotifyBody|RemoteResultBody|RemoteHistoryQuery|getRemotePending|enableRemotePoller|RemotePoller` 二次扫描无命中。

遗留风险：

- `AlembicCore` remote schema/migration 源头已删除；按用户决策不提供旧开发库 drop migration，旧库需要时重建。
- `AlembicAgent` 仍需删除 `lark` / `remote-exec` preset/profile/source/channel contract；Alembic caller 已解除。
- `AlembicDashboard` 和 `AlembicPlugin` 的文案、vendor/runtime sweep 仍按后续窗口执行。

下一步建议：

- 继续推进 `AlembicAgent` Wave 2。
- Core/Dashboard 已完成；等 Agent 完成后执行 `AlembicPlugin` vendor/runtime sweep 和跨仓库负向扫描。

特别注意：

- 不要删除 terminal/sandbox host adapter。
- 不要删除 native screenshot helper，除非扫描确认它只服务 Lark。当前判断是保留 native helper，删除飞书上传链路。
- 不要只删 HTTP route 后留下 VSCode remote poller。

### 7.2 AlembicAgent

删除范围：

- `src/agent/profiles/presets.ts` 中 `lark` 和 `remote-exec` preset。
- `src/agent/profiles/definitions/chat.profile.ts` 中 `lark-chat`。
- `src/agent/profiles/definitions/remote.profile.ts` 及 `definitions/index.ts` 引用。
- `src/agent/service/AgentRouter.ts` 中 `PresetName.LARK` / `REMOTE_EXEC`、Lark channel route、LLM enum 里的 `lark` / `remote-exec`。
- `src/agent/service/AgentRunContracts.ts` 中 `BuiltinAgentPreset` 和 `AgentRunSource` 的 `lark` / `remote-exec` 相关项。
- `src/agent/service/AgentService.ts` 中 `source === 'lark'` 特判。
- `src/agent/runtime/AgentMessage.ts` 中 `Channel.LARK`、`LarkMessage`、`fromLark()`。
- `src/agent/runtime/AgentEventBus.ts` 中 `LARK_MESSAGE`。
- `src/agent/context/ConversationStore.ts` 中 `category: 'lark'`，除非它被重命名为通用 user conversation 并有真实调用方。

保留：

- `SafetyPolicy`。
- `SystemInteraction` capability。
- terminal contract 和 terminal policy 中阻断 remote shell pipe 的安全规则。

回填（2026-05-18）：

- 状态：已完成。
- 专项文档：`docs/AlembicAgent/alembic-agent-lark-remote-preset-removal-2026-05-17.md`。
- 完成范围：删除 `lark` / `remote-exec` preset；删除 `lark-chat` profile；删除 `src/agent/profiles/definitions/remote.profile.ts` 及 builtin profile 引用；删除 Agent router 中的 Lark channel route、`PresetName.LARK` / `REMOTE_EXEC`、LLM enum 中的 `lark` / `remote-exec`；删除 `AgentRunSource: 'lark'`、`BuiltinAgentPreset` 中的 `lark` / `remote-exec`；删除 `AgentService` 中 `source === 'lark'` 到 runtime source / channel 的映射；删除 `Channel.LARK`、`LarkMessage`、`AgentMessage.fromLark()`；删除 `AgentEvents.LARK_MESSAGE`；删除 `ConversationStore` 的 `lark` category；清理相关注释和文案；新增负向 contract test。
- 删除文件：`src/agent/profiles/definitions/remote.profile.ts`。
- 提交 hash：`cad5f0bc986d910e6ffa92decd85065167659a0f`。
- 验证命令与结果：
  - `npm run test -- test/feishu-remote-removal.test.ts`：通过，1 个 test file、2 个 tests。
  - `npm run check`：通过；9 个 test files、37 个 tests；lint 仍输出既有 warnings，退出码为 0。
  - `npm run build`：通过。
  - `node -e "const publicSubpaths=['@alembic/agent','@alembic/agent/agent','@alembic/agent/service','@alembic/agent/runtime','@alembic/agent/prompts','@alembic/agent/domain','@alembic/agent/forge','@alembic/agent/tasks','@alembic/agent/profiles','@alembic/agent/ai','@alembic/agent/tools','@alembic/agent/tools/v2','@alembic/agent/tools/terminal','@alembic/agent/memory','@alembic/agent/context']; Promise.all(publicSubpaths.map((p)=>import(p))).then(()=>console.log('agent public contract ok'))"`：通过，输出 `agent public contract ok`。
  - `git diff --check`：通过。
- 负向扫描剩余命中：
  - `rg -n -i "@larksuiteoapi|ALEMBIC_LARK|LarkTransport|IntentClassifier|RemoteCommandPoller|RemoteCommandRepository|remote_commands|remote_state|/api/v1/remote|/remote/wait|sendLark|notifyTaskProgress|Channel\\.LARK|LARK_MESSAGE|fromLark|remote-exec|\\blark\\b|飞书|Lark|Feishu" src test package.json --glob '!**/node_modules/**' --glob '!**/dist/**'`：0 命中。
  - `rg -n "remote.profile|REMOTE_EXEC|PresetName\\.LARK|Channel\\.LARK|fromLark|LARK_MESSAGE|ALEMBIC_LARK_ALLOWED_USERS" src test --glob '*.ts'`：0 命中。
- 遗留风险：`npm run check` 仍输出既有 lint warnings；`SafetyPolicy`、`SystemInteraction` capability 和 terminal policy 中阻断 remote shell pipe 的安全规则按计划保留；若后续 Plugin vendor/runtime sweep 或 Alembic 集成发现新的 Agent contract 缺口，再由 AlembicAgent 接收精确修复任务。
- 下一步建议：Wave 2 的 AlembicAgent / AlembicCore / AlembicDashboard 均已完成，启动 `AlembicPlugin` Wave 3 vendor/runtime sweep；随后执行跨仓库负向扫描，确认 package/channel/Codex plugin 产物不再携带 remote schema 或 Feishu/Lark 文案。

### 7.3 AlembicCore

删除范围：

- `src/infrastructure/database/migrations/003_add_remote_commands.ts`。
- `src/infrastructure/database/drizzle/schema.ts` 的 `remoteCommands` / `remoteState`。
- 更新 schema 文件头部表清单。
- 不新增 `010_drop_remote_tables.ts` 或其它 drop migration；本阶段不处理旧数据，旧开发库按用户决策重建。

测试调整：

- `test/DatabaseRepository.test.ts` 不再期待 `003_add_remote_commands` 或 `remote_commands`。
- Core 层所有 public API smoke 不再暴露 remote schema。

回填（2026-05-18）：

- 状态：已完成。
- 专项文档：`docs/AlembicCore/alembic-core-remote-schema-removal-2026-05-17.md`。
- 完成范围：删除 `src/infrastructure/database/migrations/003_add_remote_commands.ts`；删除 Drizzle `remoteCommands` / `remoteState` 表定义；更新 schema 头部表清单；更新 `test/DatabaseRepository.test.ts`，确认 active migrations 不再包含 `003_add_remote_commands`，新库不创建 `remote_commands` / `remote_state`；清理本地 stale `dist` 产物，保证 package dry-run 不再包含旧 remote migration。
- 提交 hash：`0c64fd7549d58ceded8eed163dae85c6678ea679`。
- 验证命令与结果：
  - `npm test -- DatabaseRepository`：通过，2 files / 5 tests。
  - `npm run build:check`：通过。
  - `npm run check`：通过，60 files / 926 tests；public API boundary 报告 134 个 package exports；保留既有非阻塞 stderr `error: Could not access 'HEAD'`。
  - `npm run build`：通过。
  - `npm run smoke:public-api`：通过，73 个 exact public API entrypoints 可导入。
  - `npm --cache <temporary-npm-cache> pack --dry-run`：通过，package dry-run 不再包含 `003_add_remote_commands` 或 `010_drop_remote_tables`。
- 负向扫描剩余命中：
  - 严格 remote 扫描仅剩 `test/DatabaseRepository.test.ts` 中对 `remote_commands` / `remote_state` 不存在的断言，属于验收证据。
  - 宽松 `lark|飞书|remote-exec|remote exec` 扫描仅剩 Starlark parser / test / generated dist 命中，属于 Bazel / Buck / Pants Starlark 解析误伤，非 Feishu/Lark remote。
  - `dist/infrastructure/database/migrations` 中 `003|010` 扫描无命中。
- 遗留风险：不处理旧 remote 表数据是用户明确决策；已有旧开发库如仍含 `remote_commands` / `remote_state`，需要重建数据库而不是依赖 Core migration 清理。`npm run check` 的 `error: Could not access 'HEAD'` 为既有非阻塞输出，未影响本阶段通过。Core 仍保留既有 transitional / wildcard exports，非本阶段删除范围。
- 下一步建议：等待 `AlembicAgent` 完成 Wave 2；随后启动 `AlembicPlugin` Wave 3 vendor/runtime sweep，更新 `vendor/AlembicCore` 到本提交并验证 plugin runtime/package/channel 产物不带 remote schema 或 Lark 文案。

### 7.4 AlembicDashboard

删除范围：

- `src/i18n/locales/zh.ts` / `en.ts` 中 Lark、飞书、remote-exec 的产品文案。
- `src/components/Views/HelpView.tsx` 中 Lark / remote-exec preset 列表项。
- Agent preset 数量和说明改为 Agent 实际保留的 preset。

验证：

```text
npm run build
rg -n -i "lark|飞书|remote-exec|remote exec" src --glob '!**/dist/**'
```

若仍有历史说明命中，必须改成“已移出核心”或删除。

回填（2026-05-18）：

- 状态：已完成。
- 专项文档：`docs/AlembicDashboard/alembic-dashboard-lark-copy-removal-2026-05-17.md`。
- 完成范围：清理 `src/i18n/locales/zh.ts` / `src/i18n/locales/en.ts` 中内置 Agent、IDE 集成和 Agent 架构里对 Lark、飞书、`remote-exec` 的产品展示；`src/components/Views/HelpView.tsx` 删除 Lark / remote-exec preset 列表项；Agent 架构说明改为 `chat`、`insight`、`evolution` 三个核心 preset。
- 提交 hash：`32b2e01c249665e3dc33bdcffbfc39b648d0426d`。
- 验证命令与结果：
  - `npm run build`：通过；仅保留既有 Vite large chunk warning。
  - `rg -n -i "lark|飞书|remote-exec|remote exec" src --glob '!**/dist/**'`：无命中；`rg` 退出码 1 表示未命中。
  - `git diff --check`：通过。
- 负向扫描剩余命中：Dashboard `src` 范围剩余命中 0。
- 遗留风险：Dashboard 按删除计划中的最终方向展示 `chat` / `insight` / `evolution`；如果 `AlembicAgent` Wave 2 最终 preset 列表不同，需要二次同步 Dashboard 文案。Plugin vendor/runtime sweep 仍需后续同步 Dashboard vendor 后复验。
- 下一步建议：等待 `AlembicAgent` Wave 2 完成；之后由 `AlembicPlugin` Wave 3 同步 vendor/runtime 并执行全局负向扫描。

### 7.5 AlembicPlugin

Plugin first-party 代码当前未命中 Lark runtime；Core/Dashboard/Agent 已完成，可以进入 vendor / runtime sweep：

- 同步 `vendor/AlembicCore` 删除 remote schema/migration。
- 同步 `vendor/AlembicDashboard` 删除 Lark 文案。
- 复验是否需要同步 vendored Agent package/runtime contract。
- 重新运行 Codex plugin runtime 准备/verify/smoke，确认生成物不带 `remote_commands` / `remote_state` / `remote-exec` / Lark 文案。

## 8. 总体验收标准

代码层：

```text
rg -n "@larksuiteoapi|ALEMBIC_LARK|LarkTransport|IntentClassifier|RemoteCommandPoller|RemoteCommandRepository|remote_commands|remote_state|/api/v1/remote|/remote/wait|sendLark|notifyTaskProgress|Channel\\.LARK|LARK_MESSAGE|fromLark|remote-exec" Alembic AlembicAgent AlembicCore AlembicDashboard AlembicPlugin --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!docs/**'
```

应不再命中核心实现。允许命中：

- `StarlarkParser`。
- 历史 docs / 本计划文档。
- 非 Feishu 的 git remote / remote repository 语义。
- terminal policy 里“remote shell pipe”的安全描述。

行为层：

- Alembic daemon 不再自动注册 Lark timer。
- `/api/v1/remote/*` 不存在。
- VSCode extension 不注册 remote poller，不访问 `/remote/*`，不改 VSCode auto-approve。
- `alembic_task` 不再发送 Lark 通知或截图。
- 新数据库不创建 `remote_commands` / `remote_state`；旧开发库不做迁移清理，需要时重建。
- Dashboard / README 不再把 Lark Remote 当作 Alembic 核心能力。

验证层：

- `Alembic`: `npm run check`; `npm run build`; `npm run build:vscode-ext`。
- `AlembicAgent`: `npm run check`; `npm run build`。
- `AlembicCore`: `npm run check`; `npm run build`; `npm run smoke:public-api`。
- `AlembicDashboard`: `npm run build`。
- `AlembicPlugin`: `npm run check`; `npm run build`; `npm run verify:codex-plugin`; `npm run verify:codex-channel`; `npm run smoke:codex-plugin`。

## 9. 可复制分派提示词

```text
读取 docs/workspace/alembic-feishu-remote-removal-plan-2026-05-17.md，按照文档，领取并完成分配给你所在窗口的 Wave 3 任务；完成后回填完成范围、提交 hash、验证命令、验证结果、负向扫描剩余命中、遗留风险和下一步建议。
```

Wave 3 已完成；本提示词保留为历史分派记录，当前不再发给窗口。

历史发送窗口：

- `Alembic`
- `AlembicPlugin`

未发送窗口：

- `AlembicAgent`：Wave 2 已完成，提交 `cad5f0bc986d910e6ffa92decd85065167659a0f`。
- `AlembicCore`：Wave 2 已完成，提交 `0c64fd7549d58ceded8eed163dae85c6678ea679`。
- `AlembicDashboard`：Wave 2 已完成，提交 `32b2e01c249665e3dc33bdcffbfc39b648d0426d`。

## 10. 总控验收：Wave 1 Alembic

验收状态：通过。

验收提交：`857f430d0524d4003e54d1bc04e4df81330f0ad8`，`feat: remove feishu remote runtime`。

总控复验结果：

- `git status --short`：干净。
- `npm run lint:agent-extraction-boundary`：通过。
- `npm run lint:core-import-boundary`：通过。
- `npm run build:check`：通过。
- `npm run build:vscode-ext`：通过。
- `npm run test:unit -- test/unit/AgentService.test.ts test/unit/AiRouteDirectTool.test.ts`：通过，2 files / 14 tests。
- `./node_modules/.bin/vitest run test/integration/ZodSchemas.test.ts test/integration/DrizzleORM.test.ts`：通过，2 files / 72 tests。

负向扫描：

- `@larksuiteoapi|ALEMBIC_LARK|LarkTransport|IntentClassifier|RemoteCommandPoller|RemoteCommandRepository|/api/v1/remote|/remote/wait|sendLark|notifyTaskProgress|remote_commands|remote_state|remote-exec|lark|飞书|Lark`：仅剩 `test/unit/MultiLanguageParsers.test.ts` 的 `StarlarkParser` 误伤，非 Feishu/Lark remote。
- `remoteCommandRepository|remoteRouter|RemoteSendBody|RemoteNotifyBody|RemoteResultBody|RemoteHistoryQuery|getRemotePending|enableRemotePoller|RemotePoller`：无命中。

下一步允许启动：

- `AlembicAgent`：已完成。已删除 `lark` / `remote-exec` contract surface，提交 `cad5f0bc986d910e6ffa92decd85065167659a0f`。
- `AlembicCore`：已完成。`Alembic` 已不再消费 remote schema/migration；Core 已删除 remote table 源头，且按用户决策不补 drop migration。
- `AlembicDashboard`：已完成。已清理 Lark / 飞书 / `remote-exec` 产品文案，提交 `32b2e01c249665e3dc33bdcffbfc39b648d0426d`。
- `Alembic`：是。Wave 3 需要同步 vendored Core/Dashboard 并做最终集成复扫。
- `AlembicPlugin`：是。Wave 3 需要同步 vendor/runtime/package/channel 并做 Codex plugin smoke。

## 11. 总控验收：Wave 2 Agent/Core/Dashboard

验收状态：通过。

验收提交：

- `AlembicAgent`：`cad5f0bc986d910e6ffa92decd85065167659a0f`，`Remove Feishu remote agent contracts`。
- `AlembicCore`：`0c64fd7549d58ceded8eed163dae85c6678ea679`，`feat: remove remote database schema`。
- `AlembicDashboard`：`32b2e01c249665e3dc33bdcffbfc39b648d0426d`，`docs: remove lark remote dashboard copy`。

总控复验结果：

- 三个仓库 `git status --short`：干净。
- `AlembicAgent`：`npm run test -- test/feishu-remote-removal.test.ts` 通过，1 file / 2 tests；`npm run check` 通过，9 files / 37 tests，保留既有 lint warnings；`npm run build` 通过；public subpath import smoke 通过。
- `AlembicCore`：`npm test -- DatabaseRepository` 通过，2 files / 5 tests；`npm run build:check` 通过；`npm run check` 通过，60 files / 926 tests，保留既有非阻塞 `error: Could not access 'HEAD'`；`npm run build` 通过；`npm run smoke:public-api` 通过；package dry-run 输出中不含 `003_add_remote_commands`、`010_drop_remote_tables`、`remote_commands` 或 `remote_state`。
- `AlembicDashboard`：`npm run build` 通过，仅保留既有 Vite large chunk warning；源码文案负向扫描无命中。

负向扫描：

- `AlembicAgent` 严格 Feishu/Lark/remote contract 扫描：0 命中。
- `AlembicCore` 严格 remote 扫描：仅剩 `test/DatabaseRepository.test.ts` 中 `remote_commands` / `remote_state` 不存在断言，属于验收证据；宽松 Lark 扫描仅剩 Starlark parser 误伤。
- `AlembicDashboard` `src` 范围 `lark|飞书|remote-exec|remote exec`：0 命中。
- 跨仓库扫描发现剩余真实待处理面只在 `Alembic/vendor/AlembicCore`、`Alembic/vendor/AlembicDashboard`、`AlembicPlugin/vendor/AlembicCore`、`AlembicPlugin/vendor/AlembicDashboard`。因此 Wave 3 必须同时发给 `Alembic` 和 `AlembicPlugin`，不能只发 Plugin。

Wave 3 分派：

- `Alembic`：同步 vendor Core/Dashboard，复验 Agent contract 消费，跑主仓库 build/check/vscode/ext 和跨仓库负向扫描。
- `AlembicPlugin`：同步 vendor/runtime/package/channel，跑 Codex plugin/channel verify、smoke 和产物负向扫描。

### 11.1 Wave 3 Alembic 回填

状态：已完成。

专项文档：`docs/Alembic/alembic-vendor-feishu-remote-sweep-2026-05-18.md`。

提交 hash：`0d109d0469d5cf978252da8217cc674ac400f14d`。

完成范围：

- `vendor/AlembicCore` 已从 `6b7b52a17fe214816c41344860caeb8bf35f1923` 同步到 `0c64fd7549d58ceded8eed163dae85c6678ea679`。
- `vendor/AlembicDashboard` 已从 `bea8cd4b481b27a395456cb3936073729c8a6493` 同步到 `32b2e01c249665e3dc33bdcffbfc39b648d0426d`。
- Alembic 对 `@alembic/agent` public subpaths 的消费已复验。
- build 后 `dist` 和 VSCode extension out 产物已复扫，不带 Feishu remote runtime symbols。

验证命令与结果：

- `npm run check`：通过；Biome 仅报告既有 warnings/infos。
- `npm run build`：通过。
- `npm run build:vscode-ext`：通过。
- `npm run lint:agent-extraction-boundary`：通过。
- `npm run lint:core-import-boundary`：通过。
- `node -e "const subpaths=['@alembic/agent/ai','@alembic/agent/tools','@alembic/agent/tools/v2','@alembic/agent/tools/terminal','@alembic/agent/memory','@alembic/agent/context','@alembic/agent/domain','@alembic/agent/prompts','@alembic/agent/runtime','@alembic/agent/service']; Promise.all(subpaths.map((p)=>import(p))).then(()=>console.log('agent consumer public imports ok'))"`：通过，输出 `agent consumer public imports ok`。
- `git diff --check`：通过。

负向扫描剩余命中：

- 跨仓库严格扫描仅剩 `Alembic/vendor/AlembicCore/test/DatabaseRepository.test.ts`、`AlembicPlugin/vendor/AlembicCore/test/DatabaseRepository.test.ts`、`AlembicCore/test/DatabaseRepository.test.ts` 中 `remote_commands` / `remote_state` 不存在断言，属于验收证据。
- Alembic runtime 产物扫描 `dist resources/vscode-ext/out package.json package-lock.json` 无 Feishu remote runtime symbol 命中。
- Alembic vendored Core/Dashboard `003_add_remote_commands|010_drop_remote_tables|remote_commands|remote_state` 扫描仅剩 `vendor/AlembicCore/test/DatabaseRepository.test.ts` 的不存在断言。
- 宽松 Lark 扫描额外剩余 `vendor/AlembicCore/AGENTS.md` 中“Core 不包含 ... Lark 集成”的边界说明，非产品文案和非 runtime；Starlark parser 仍按 Bazel / Buck / Pants 误伤分类。

遗留风险：

- `AlembicPlugin` Wave 3 已在第 11.2 节完成；本节风险已由最终总控复验收口。
- Core 旧开发库不做 drop migration 是 Wave 2 用户决策；旧库如仍有旧表，需要重建数据库。
- `vendor/AlembicCore/AGENTS.md` 的 Lark 边界说明不是 runtime 残留；若总控要求零关键词，可在 Core 后续文案清理中统一去掉。

下一步建议：

- 与 `AlembicPlugin` Wave 3 一起执行最终跨仓库负向扫描和总体验收。

### 11.2 Wave 3 AlembicPlugin 回填

状态：已完成。

专项文档：`docs/AlembicPlugin/alembic-plugin-vendor-feishu-remote-sweep-2026-05-18.md`。

提交 hash：

- AlembicPlugin：`106ed71716e12db5c4c00a54b23984a40b5737b1`（`chore: sweep feishu remote from plugin runtime`）。
- `plugins/alembic-codex` 子仓库：`d97fd7ac8364e26aa20513cb44ed5559a72a236f`（`build: refresh runtime after remote schema removal`）。

完成范围：

- `vendor/AlembicCore` 已从 `6b7b52a17fe214816c41344860caeb8bf35f1923` 同步到 `0c64fd7549d58ceded8eed163dae85c6678ea679`。
- `vendor/AlembicDashboard` 已从 `bea8cd4b481b27a395456cb3936073729c8a6493` 同步到 `32b2e01c249665e3dc33bdcffbfc39b648d0426d`。
- 清理 `vendor/AlembicCore` ignored stale `dist/` 后重建，避免旧 `003_add_remote_commands` 生成物进入 runtime。
- 重新构建 Plugin / Core / Dashboard，并重新生成 `plugins/alembic-codex/runtime` 与 `plugins/alembic-codex/runtime.tgz`。
- 清理 AlembicPlugin `CHANGELOG.md` 中历史 Feishu/Lark 字样。

验证命令与结果：

- `npm run check`：通过；`typecheck` 通过；Biome 仍报告既有 123 warnings / 29 infos，退出码 0；Core import boundary 扫描 315 个文件和 517 个 `@alembic/core` imports，通过。
- `npm run build`：通过。
- `npm run build:dashboard`：通过；仅保留既有 Vite large chunk warning。
- `npm run prepare:codex-plugin-runtime`：通过；重新生成 embedded runtime 和 `runtime.tgz`。
- `npm run verify:codex-plugin`：通过，`runtime.tgz` 为 `alembic-ai@0.1.2`。
- `npm run verify:codex-channel`：通过，channel 为 `alembic-ai@0.1.2`。
- `npm run smoke:codex-plugin`：通过；`install`、`stdio`、`npxRuntime` 为 `passed`，`recovery`、`daemon` 为 `skipped`。
- `git diff --check`：通过。
- `git -C plugins/alembic-codex diff --check`：通过。

负向扫描剩余命中：

- 严格 remote runtime 扫描 `@larksuiteoapi|ALEMBIC_LARK|LarkTransport|IntentClassifier|RemoteCommandPoller|RemoteCommandRepository|remote_commands|remote_state|/api/v1/remote|/remote/wait|sendLark|notifyTaskProgress|Channel\\.LARK|LARK_MESSAGE|fromLark|remote-exec`：仅剩 `vendor/AlembicCore/test/DatabaseRepository.test.ts` 中 `remote_commands` / `remote_state` 不存在断言，属于 Core Wave 2 验收证据。
- package/channel/doc-facing 扫描 `lark|飞书|feishu|remote-exec|remote exec|remote_commands|remote_state`：`package.json`、`package-lock.json`、README、CHANGELOG、channels、plugin metadata、marketplace metadata 均无命中。
- runtime 宽松扫描仅剩 `StarlarkParser` / `parseStarlarkBuildFile` / `starlark`，属于 Bazel / Buck / Pants Starlark parser，非 Feishu/Lark remote。
- `runtime.tgz` 严格 remote tarball 扫描 `003_add_remote_commands|remote_commands|remote_state|remote-exec|feishu|飞书|@larksuiteoapi|ALEMBIC_LARK`：无命中。
- `vendor/AlembicCore/dist/infrastructure/database/migrations` 已不包含 `003_add_remote_commands`。
- 其它宽松源码扫描仍可命中 `vendor/AlembicCore/AGENTS.md` 中“Core 不包含 ... Lark 集成”的边界说明，非 runtime、非 package/channel 文案。

遗留风险：

- `npm run check` 仍输出既有 Biome warnings / infos；本轮未扩大到样式债清理。
- 普通 `smoke:codex-plugin` 不启动 live daemon；如发布前需要 live daemon 证据，需额外运行 daemon smoke。
- Core 旧开发库不做 drop migration 是 Wave 2 用户决策；旧库如仍有旧表，需要重建数据库。
- `vendor/AlembicCore/AGENTS.md` 的 Lark 边界说明不是 runtime 残留；若总控要求零关键词，可在 Core 后续文案清理中统一去掉。

下一步建议：

- `Alembic` 和 `AlembicPlugin` Wave 3 均已完成；总控可执行最终跨仓库负向扫描和总体验收。
- 后续 AlembicPlugin 同步 Core vendor 时，先清理 ignored stale `vendor/AlembicCore/dist` 再构建并 prepare runtime，防止旧生成物回流。

## 12. 最终总控验收

验收状态：通过，Feishu/Lark remote 删除计划完成。

最终提交：

- `Alembic`：`0d109d0469d5cf978252da8217cc674ac400f14d`，`chore: sync feishu remote cleanup vendors`。
- `AlembicAgent`：`cad5f0bc986d910e6ffa92decd85065167659a0f`，`Remove Feishu remote agent contracts`。
- `AlembicCore`：`0c64fd7549d58ceded8eed163dae85c6678ea679`，`feat: remove remote database schema`。
- `AlembicDashboard`：`32b2e01c249665e3dc33bdcffbfc39b648d0426d`，`docs: remove lark remote dashboard copy`。
- `AlembicPlugin`：`106ed71716e12db5c4c00a54b23984a40b5737b1`，`chore: sweep feishu remote from plugin runtime`。
- `plugins/alembic-codex`：`d97fd7ac8364e26aa20513cb44ed5559a72a236f`，`build: refresh runtime after remote schema removal`。

最终复验结果：

- `Alembic`、`AlembicPlugin`、`plugins/alembic-codex` 工作树均干净。
- `Alembic`：`npm run check`、`npm run build`、`npm run build:vscode-ext`、`npm run lint:agent-extraction-boundary`、`npm run lint:core-import-boundary` 均通过；Biome 仅保留既有 warnings/infos。
- `AlembicPlugin`：`npm run check`、`npm run build`、`npm run build:dashboard`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run smoke:codex-plugin` 均通过；普通 smoke 中 `recovery` / `daemon` 按脚本为 `skipped`。

最终负向扫描：

- 跨仓库严格 remote 扫描仅剩 `AlembicCore` / vendored `AlembicCore` 的 `test/DatabaseRepository.test.ts` 中 `remote_commands` / `remote_state` 不存在断言，属于验收证据。
- `Alembic` runtime 产物扫描 `dist`、VSCode extension out、`package.json`、`package-lock.json`：无命中。
- `AlembicPlugin` package/channel/doc-facing 扫描：无命中。
- `AlembicPlugin` runtime 宽松扫描仅剩 Starlark parser 误伤，非 Feishu/Lark remote。
- `plugins/alembic-codex/runtime.tgz` 严格 remote tarball 扫描：无命中。

最终结论：

- Alembic 产品线内置 Feishu/Lark remote bridge 已从主运行时、Agent contract、Core schema、Dashboard 文案、vendored runtime、Codex plugin runtime/tarball 和 channel/package-facing 文档中移除。
- 保留的 terminal/sandbox host bridge、Agent terminal portable contract、MCP/HTTP/Dashboard/VSCode 非 remote 能力未被纳入删除范围。
- 旧开发库 remote table 不做 drop migration 是用户确认决策；需要时重建数据库。
