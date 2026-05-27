# Alembic Runtime Project Identity Wave 3A Core Contract Execution Record

日期：2026-05-18
执行窗口：AlembicCore
状态：已完成
来源计划：`docs/workspace/alembic-runtime-project-identity-wave-3a-core-provider-plan-2026-05-18.md`

## 完成范围

- 深读 `src/daemon/RuntimeContracts.ts`、`src/shared/WorkspaceResolver.ts`、`src/shared/ProjectRegistry.ts`、`src/daemon/DaemonState.ts`，确认 runtime project identity 字段在 Core 内可稳定建模，具体值仍由 Alembic provider 侧采集。
- 扩展 `AlembicRuntimeProjectIdentity`，新增 `dataRootSource`、`runtimeDir`、可选 `workspaceMode`，保留既有 `dataRoot`、`databasePath`、`projectId`、`projectRoot`、`schemaMigrationVersion`。
- 新增 `AlembicRuntimeDataRootSource`、`createAlembicRuntimeProjectIdentity()`、`summarizeAlembicRuntimeProjectIdentity()`、`normalizeAlembicRuntimeDataRootSource()`、`normalizeAlembicWorkspaceMode()`，供 daemon health provider 和消费层共享同一份 headless contract。
- 调整 `createAlembicRuntimeHealthData()`，由 Core helper 统一生成 canonical project identity 字段。
- 更新 runtime contract 单测和 public API smoke 清单，确保 `@alembic/core/daemon` exact entrypoint 可直接消费新 helper。

## 字段边界

| 字段 | Core contract 处理 | Provider 来源建议 |
| --- | --- | --- |
| `dataRoot` | 保留必填字段 | `WorkspaceResolver.toFacts()` / Alembic daemon paths |
| `dataRootSource` | 新增必填枚举：`project-root` / `ghost-registry` | `WorkspaceResolver.toFacts()` 或 `ProjectRegistry.inspect()` |
| `runtimeDir` | 新增必填字段 | `WorkspaceResolver.runtimeDir` 或 `resolveDaemonPaths()` |
| `workspaceMode` | 可选字段；缺省时由 `dataRootSource` 推导 | `ProjectRegistry.WorkspaceMode` |
| `databasePath` | 保留可选字段 | Alembic daemon database path |
| `schemaMigrationVersion` | 保留可空字段 | schema migration metadata |

Core 只提供确定性 contract、helper、summary 和 normalizer；不引入 Express、daemon HTTP、Dashboard、Plugin、Codex MCP、Agent runtime 或 AI provider 依赖。

## 提交

- `AlembicCore` 提交：`2e87b056f200b9ecb5291c05e6c94a7e514543c4`
- 提交信息：`Extend runtime project identity contract`

## 验证命令与结果

```text
npm run build:check
```

结果：通过，TypeScript noEmit 检查无错误。

```text
npm run test -- test/RuntimeContracts.test.ts test/PublicFoundationEntrypoints.test.ts
```

结果：通过，2 个测试文件、11 个测试全部通过。

```text
npm run lint
```

结果：通过，Biome 检查 419 个文件。

```text
npm run build
npm run smoke:public-api
```

结果：通过，public API smoke 成功导入 75 个 exact public API entrypoints。

```text
npm run lint:public-api-boundary
```

结果：通过，136 个 package exports 已分类；stable=17、provisional=21、transitional=98。

```text
git diff --check
```

结果：通过，无 whitespace error。

## 遗留风险

- `CreateAlembicRuntimeHealthDataOptions` 现在要求 provider 传入 `dataRootSource` 和 `runtimeDir`；`Alembic` 需要在下一步接入 Core 新 contract，否则外层编译会暴露缺参。
- Core helper 只规范字段结构和轻量推导，不验证 runtime path 是否真实存在；路径真实性仍属于 Alembic daemon / WorkspaceResolver 侧职责。
- Plugin / Dashboard 当前仍依赖 Alembic health provider 输出，必须等 Alembic 完成接入后再做消费层 fallback 收敛。

## 下一波建议

- 启动 `Alembic` 窗口：消费 `@alembic/core/daemon` 新 project identity contract，让 `/api/v1/daemon/health` 的 `dataRootSource`、`runtimeDir`、`workspaceMode` 由 Core helper 统一生成。
- `Alembic` 保留 `runtimeBoundary` / `capabilities.runtimeBoundary` 作为 owner attribution 与 handoff 摘要，但不要继续把它作为 canonical project identity 的唯一来源。
- `AlembicPlugin`、`AlembicDashboard` 暂时保持观察；等 Alembic provider 完成并通过 build / smoke 后，再安排它们替换 fallback 或做 live smoke。
- `AlembicAgent`、`BiliDili` 本波仍无直接执行任务。
