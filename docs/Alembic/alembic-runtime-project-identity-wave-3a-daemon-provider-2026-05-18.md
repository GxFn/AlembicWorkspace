# Alembic Runtime Project Identity Wave 3A Daemon Provider

日期：2026-05-18
窗口：Alembic
状态：待验收
对应总控计划：`docs/workspace/alembic-runtime-project-identity-wave-3a-core-provider-plan-2026-05-18.md`

## 完成范围

- `/api/v1/daemon/health` 新增 `buildDaemonProjectIdentity()`，通过 `@alembic/core/daemon` 的 `createAlembicRuntimeProjectIdentity()` 生成 canonical project identity。
- `createAlembicRuntimeHealthData()` 现在直接接收 Core project identity，`dataRootSource`、`runtimeDir`、`workspaceMode`、`databasePath`、`schemaMigrationVersion` 不再作为 health helper 外的手写 extension 补入。
- `runtimeBoundary` 继续作为 Alembic-owned owner attribution / Dashboard handoff 摘要保留；其 workspace 字段改为复用同一份 Core project identity，并补充 `workspaceMode` 兼容字段。
- 保留 Alembic 对 daemon、WorkspaceResolver、ProjectRegistry、JobStore、Dashboard server、file monitor 和 internal AI job 的主实现所有权；本波没有迁移或删除宿主能力。
- `test/unit/DaemonCapabilities.test.ts` 增加 Core project identity provider 覆盖，验证 ghost data root source 会由 Core contract 推导为 `workspaceMode: ghost`，并被 runtime boundary 复用。

## 提交 Hash

- `c760d710591e0a9a2e90785ad81dd78d75a571c8`：接入 Core runtime project identity provider。
- `e8a71c7948936c46815a225516e1ad46f13dbd55`：澄清 runtime boundary database path 类型，保持与 Core identity 兼容。

## 验证结果

- `npm run build:check`：通过，使用 workspace 本地 `../AlembicCore`。
- `npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts`：通过，2 个测试文件、6 个测试通过。
- `npm run lint:consumer-core-imports`：通过，扫描 416 个文件、559 个 `@alembic/core` imports。
- `npx biome check --diagnostic-level=error lib/daemon/RuntimeBoundary.ts lib/http/routes/daemon.ts test/unit/DaemonCapabilities.test.ts`：通过。
- `git -C Alembic diff --check`：通过。
- `git -C Alembic diff --check HEAD~1..HEAD`：通过。
- 总控复核：通过。总控复核了 `lib/http/routes/daemon.ts`、`lib/daemon/RuntimeBoundary.ts`、`test/unit/DaemonCapabilities.test.ts` 和最终提交 `e8a71c7948936c46815a225516e1ad46f13dbd55`；复跑 `npm run build:check`、`npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts`、`npm run lint:consumer-core-imports`、`npx biome check --diagnostic-level=error lib/daemon/RuntimeBoundary.ts lib/http/routes/daemon.ts test/unit/DaemonCapabilities.test.ts`、`git -C Alembic diff --check`、`git -C Alembic diff --check HEAD~2..HEAD` 均通过。

## 遗留风险

- 为兼容 Wave 2 consumer，Alembic health 仍同时输出 top-level `runtimeBoundary` 和 `capabilities.runtimeBoundary`；它们现在定位为 attribution / handoff 摘要，而不是 canonical project identity 唯一来源。
- `runtimeBoundary.workspace.mode` 继续保留旧字段，同时新增 `workspaceMode`；Plugin / Dashboard 完成 canonical health consumption 后，可再评估是否收敛旧字段依赖。
- Core 只定义 identity shape 与轻量推导；路径存在性和 daemon runtime 状态仍由 Alembic provider 负责。

## 下一波建议

- 启动 `AlembicPlugin` 消费 Alembic health 的 canonical project identity，优先读取 top-level `dataRootSource`、`runtimeDir`、`workspaceMode`，把 `runtimeBoundary` 限定为 owner attribution / handoff fallback。
- 启动 `AlembicDashboard` 对齐 runtime view model 到 canonical project identity，并安排 daemon health live smoke。
- 如果 Plugin / Dashboard 均确认不再需要旧 fallback，再开一波收敛 `capabilities.runtimeBoundary` 兼容输出位置。
