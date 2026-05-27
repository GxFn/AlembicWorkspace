# Alembic Feishu Remote Removal

日期：2026-05-17

窗口：`Alembic`

状态：已完成

提交：`857f430d0524d4003e54d1bc04e4df81330f0ad8`

总控计划：`docs/workspace/alembic-feishu-remote-removal-plan-2026-05-17.md`

## 完成范围

- 删除 Alembic 内置 Feishu / Lark remote HTTP 入口：`lib/http/routes/remote.ts`，并移除 `HttpServer` 的 `/api/v1/remote` mount。
- 删除 Feishu / Lark transport、intent classifier、task notifier、副作用通知链路和 remote command repository。
- 删除 DI/service map、cleanup table list、request logger、performance monitor、shared HTTP schemas 中的 remote consumers。
- 删除 VSCode extension remote poller、`/remote/*` API client 方法、remote commands 和 `alembic.enableRemotePoller` 配置。
- 删除 `@larksuiteoapi/node-sdk` runtime dependency，并更新 lockfile。
- 删除或改写 Alembic README、README_CN、CHANGELOG、AGENTS、boundary config 中把 Lark runtime 作为当前核心能力保留的描述。
- 删除 remote/Lark 专属测试，更新仍需保留的 AgentService、AiRouteDirectTool、ZodSchemas、DrizzleORM 测试。

## 删除文件列表

- `lib/http/routes/remote.ts`
- `lib/external/lark/IntentClassifier.ts`
- `lib/external/lark/LarkTransport.ts`
- `lib/infrastructure/notification/LarkNotifier.ts`
- `lib/repository/remote/RemoteCommandRepository.ts`
- `resources/vscode-ext/src/remoteCommandPoller.ts`
- `test/unit/LarkTransportAgentService.test.ts`
- `test/integration/IntentClassifier.test.ts`
- `test/integration/RemoteCommandRepository.test.ts`

本地空目录 `lib/external/lark`、`lib/repository/remote`、`lib/infrastructure/notification` 已清理。

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` | 通过 |
| `npm run build:vscode-ext` | 通过 |
| `npm run lint:agent-extraction-boundary` | 通过 |
| `npm run lint:core-import-boundary` | 通过 |
| `npm run test:unit -- test/unit/AgentService.test.ts test/unit/AiRouteDirectTool.test.ts` | 通过，2 files / 14 tests |
| `./node_modules/.bin/vitest run test/integration/ZodSchemas.test.ts test/integration/DrizzleORM.test.ts` | 通过，2 files / 72 tests |
| `npm run check` | 通过；Biome 仅报告既有 warnings/infos |
| `npm run build` | 通过 |
| `git diff --check` | 通过 |

说明：`npm run test:integration -- test/integration/ZodSchemas.test.ts test/integration/DrizzleORM.test.ts` 在当前 package script 下会附加到 `vitest run test/integration`，因此误触发整套 integration；目标两个文件已通过，额外失败来自当前宿主沙箱限制的 HTTP bind `EPERM ::1` 和 macOS sandbox stdout 用例，不作为本轮 targeted 验收失败。

## 负向扫描

产品根扫描命令：

```text
rg -n "@larksuiteoapi|ALEMBIC_LARK|LarkTransport|IntentClassifier|RemoteCommandPoller|RemoteCommandRepository|/api/v1/remote|/remote/wait|sendLark|notifyTaskProgress|remote_commands|remote_state|remote-exec|lark|飞书|Lark" lib resources test package.json package-lock.json README.md README_CN.md CHANGELOG.md config AGENTS.md --glob '!**/node_modules/**' --glob '!**/dist/**'
```

剩余命中：

- `test/unit/MultiLanguageParsers.test.ts` 中 `StarlarkParser` / `parseStarlarkBuildFile`，属于 Bazel / Buck / Pants Starlark parser 测试，非 Feishu / Lark remote。

Remote symbol 二次扫描：

```text
rg -n "remoteCommandRepository|remoteRouter|RemoteSendBody|RemoteNotifyBody|RemoteResultBody|RemoteHistoryQuery|getRemotePending|enableRemotePoller|RemotePoller" lib resources test config --glob '!**/node_modules/**' --glob '!**/dist/**'
```

结果：无命中。

## 遗留风险

- `AlembicCore` 仍拥有 remote schema / migration 的源头删除任务；Alembic consumer 已不再 import 或使用这些表，Core 可进入 Wave 2。
- `AlembicAgent` 仍有 `lark` / `remote-exec` preset/profile/source/channel contract；Alembic caller 已删除，Agent 可进入 Wave 2。
- `AlembicDashboard` 的产品文案和 `AlembicPlugin` 的 vendor/runtime sweep 仍需按总控计划后续完成。
- 历史 docs 和当前计划文档仍会包含 Feishu / Lark 关键词，应在全局负向扫描中按计划归为文档证据类命中。

## 下一步建议

- 启动 `AlembicAgent` 和 `AlembicCore` Wave 2，删除已经失去 Alembic 调用方的 remote contract/schema。
- 同步推进 `AlembicDashboard` 文案清理。
- 等 Core/Dashboard 完成后，执行 `AlembicPlugin` vendor/runtime sweep，并做跨仓库负向扫描。
