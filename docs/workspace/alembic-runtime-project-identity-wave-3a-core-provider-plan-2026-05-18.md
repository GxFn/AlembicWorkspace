# Alembic Runtime Project Identity Wave 3A Core Provider Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已验收；Core 与 Alembic provider 均完成，下一波进入 Plugin / Dashboard consumer
阶段：前期开发 / 模块划分

## 背景

Wave 2 已让 `Alembic`、`AlembicPlugin`、`AlembicDashboard` 开始消费 Core runtime / capability contract。轻量验收发现消费方向正确，但两个消费层都稳定需要同一组 project identity 字段：`dataRootSource`、`runtimeDir`、`workspaceMode`、`databasePath`、Dashboard handoff / owner attribution 等。

这些字段现在由 Alembic health extension 或 Alembic-owned `runtimeBoundary` 提供。下一步应先把最小稳定字段上提到 `AlembicCore` canonical contract，再让 `Alembic` 作为 provider 输出。暂不派发 Plugin / Dashboard，避免它们围绕尚未稳定的上游字段再次做兼容层。

## 本波目标

- `AlembicCore` 补齐 runtime project identity 的最小 canonical contract，不引入 daemon、HTTP、Dashboard 或 Codex 依赖。
- `Alembic` 明确依赖 Core 新 contract；只有 `AlembicCore` 完成并回填提交后，才启动 Alembic 消费 Core contract 生成 `/api/v1/daemon/health`。
- `runtimeBoundary` 保留为 Alembic-owned attribution / handoff 摘要，不再承担 canonical project identity 的唯一来源。
- `AlembicPlugin`、`AlembicDashboard` 本波观察，等 Core + Alembic provider 稳定后再做消费层替换和 live smoke。

## 真实代码依据

- `AlembicCore/src/daemon/RuntimeContracts.ts` 已有 `AlembicRuntimeProjectIdentity`、`AlembicRuntimeHealthData`、`createAlembicRuntimeHealthData()`，但缺少 `dataRootSource`、`runtimeDir`、`workspaceMode` 等消费者正在使用的 project identity 字段。
- `Alembic/lib/http/routes/daemon.ts` 当前在 `createAlembicRuntimeHealthData()` 外额外扩展 `dataRootSource`、`runtimeDir`，并同时输出 top-level `runtimeBoundary` 与 `capabilities.runtimeBoundary`。
- `AlembicPlugin/lib/codex/EnhancementRoute.ts` 已兼容读取 `runtimeBoundary.workspace.dataRootSource` / `runtimeDir`。
- `AlembicDashboard/src/api.ts` 已兼容读取 canonical health 与 `runtimeBoundary` fallback。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>已完成 | 已扩展 runtime project identity canonical contract，提交 `2e87b056f200b9ecb5291c05e6c94a7e514543c4`；保持 headless。 |
| `Alembic`<br>已完成 | 已消费 Core 新 runtime project identity contract，更新 daemon health provider，移除 canonical identity 的手写 extension 职责；执行记录见 `docs/Alembic/alembic-runtime-project-identity-wave-3a-daemon-provider-2026-05-18.md`。 |
| `AlembicPlugin`<br>观察中 | 本波不主动改 Plugin；等待 Core + Alembic provider 稳定后再替换消费层 fallback。 |
| `AlembicDashboard`<br>观察中 | 本波不主动改 Dashboard；等待 Core + Alembic provider 稳定后再替换 view model fallback，并安排 live smoke。 |
| `AlembicAgent`<br>观察中 | 本波不涉及 internal AI runtime。 |
| `BiliDili`<br>无任务 | 本波不做真实项目 smoke。 |

## AlembicCore 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicCore/alembic-runtime-project-identity-wave-3a-core-contract-2026-05-18.md`

挂载入口：本文“回填区 / AlembicCore”。

目标：

- 深读 `src/daemon/RuntimeContracts.ts`、`src/shared/WorkspaceResolver.ts`、`src/shared/ProjectRegistry.ts`、`src/daemon/DaemonState.ts`，确认 project identity 字段来源。
- 扩展 `AlembicRuntimeProjectIdentity` / `CreateAlembicRuntimeHealthDataOptions` / `createAlembicRuntimeHealthData()`，覆盖最小字段：`dataRootSource`、`runtimeDir`、可选 `workspaceMode`，以及当前已有 `databasePath`、`schemaMigrationVersion`。
- 如需要，新增轻量 normalizer / helper，但不要引入 Express、daemon HTTP、Dashboard、Plugin 或 Codex 依赖。
- 更新 public API tests 和 boundary matrix，确保 `@alembic/core/daemon` exact public entrypoint 可消费。

建议验证命令：

```text
npm run build:check
npm run test -- test/RuntimeContracts.test.ts test/PublicFoundationEntrypoints.test.ts
npm run smoke:public-api
npm run lint:public-api-boundary
git diff --check
```

## Alembic 执行要求

文档动作：新建执行记录。

保存位置：`docs/Alembic/alembic-runtime-project-identity-wave-3a-daemon-provider-2026-05-18.md`

挂载入口：本文“回填区 / Alembic”。

目标：

- 消费 Core 新 project identity contract，让 `/api/v1/daemon/health` 的 `dataRootSource`、`runtimeDir`、`workspaceMode` 等字段由 `createAlembicRuntimeHealthData()` 或 Core helper 统一生成。
- 保留 top-level `runtimeBoundary` 和 `capabilities.runtimeBoundary` 的兼容输出，但把它定位为 owner attribution / handoff 摘要，不再作为 canonical project identity 唯一来源。
- 确认 Alembic 仍拥有 daemon、WorkspaceResolver、ProjectRegistry、JobStore、Dashboard server、file monitor 和 internal AI job 主实现；不要迁给 Plugin。
- 若 Core contract 仍不足，回填最小缺口，不在 Alembic 继续扩大长期本地 contract。

建议验证命令：

```text
npm run build:check
npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts
npm run lint:consumer-core-imports
git diff --check
```

## 轻量完成条件

- `AlembicCore` 与 `Alembic` 均有执行记录、提交 hash、完成范围、验证结果和下一波建议。
- Core canonical runtime project identity 覆盖消费层稳定字段。
- Alembic daemon health 不再依赖额外手写 extension 承载 canonical project identity。
- Plugin / Dashboard 本波不派发，避免重复 fallback 兼容层。

总控复核命令：

```text
node scripts/verify-workspace-docs.mjs --all-workspace
node scripts/check-dispatch-coverage.mjs
git diff --check
```

## 可复制分派提示词

发送给：无

```text
读取 docs/workspace/alembic-runtime-project-identity-wave-3a-core-provider-plan-2026-05-18.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证结果和下一波建议。
```

不发送给：`Alembic`（已完成）、`AlembicCore`（已完成）、`AlembicPlugin`（观察中）、`AlembicDashboard`（观察中）、`AlembicAgent`（观察中）、`BiliDili`（无任务）。

## 回填区

### AlembicCore

- 状态：已完成
- 执行记录：`docs/AlembicCore/alembic-runtime-project-identity-wave-3a-core-contract-2026-05-18.md`
- 提交 hash：`2e87b056f200b9ecb5291c05e6c94a7e514543c4`
- 完成范围：扩展 `AlembicRuntimeProjectIdentity` / `CreateAlembicRuntimeHealthDataOptions` / `createAlembicRuntimeHealthData()`，新增 `dataRootSource`、`runtimeDir`、可选 `workspaceMode`；新增 project identity helper、summary、normalizer；更新 runtime contract test 与 public API smoke 清单。
- 验证命令与结果：
  - `npm run build:check`：通过。
  - `npm run test -- test/RuntimeContracts.test.ts test/PublicFoundationEntrypoints.test.ts`：通过，2 个测试文件、11 个测试通过。
  - `npm run lint`：通过。
  - `npm run build` + `npm run smoke:public-api`：通过，75 个 exact public API entrypoints 成功导入。
  - `npm run lint:public-api-boundary`：通过，136 个 package exports 已分类。
  - `git diff --check`：通过。
- 遗留风险：Alembic provider 必须补传 `dataRootSource` 与 `runtimeDir`；Core 只负责字段结构和轻量推导，不负责验证 runtime path 是否存在。
- 下一波建议：启动 Alembic 窗口消费 Core 新 contract；Plugin / Dashboard 等 Alembic health provider 稳定后再收敛 fallback。
- 总控复核：通过。总控已复核 `src/daemon/RuntimeContracts.ts`、`test/RuntimeContracts.test.ts`、public API smoke 清单和提交 `2e87b056f200b9ecb5291c05e6c94a7e514543c4`；复跑 `npm run build:check`、`npm run test -- test/RuntimeContracts.test.ts test/PublicFoundationEntrypoints.test.ts`、`npm run smoke:public-api`、`npm run lint:public-api-boundary`、`git diff --check` 均通过。确认 AlembicCore 已解除 Alembic 的上游阻塞。

### Alembic

- 状态：已完成
- 前置条件：Core contract 已完成，提交 `2e87b056f200b9ecb5291c05e6c94a7e514543c4` 可用。
- 执行记录：`docs/Alembic/alembic-runtime-project-identity-wave-3a-daemon-provider-2026-05-18.md`
- 提交 hash：`e8a71c7948936c46815a225516e1ad46f13dbd55`（包含 provider 接入提交 `c760d710591e0a9a2e90785ad81dd78d75a571c8`）
- 完成范围：`/api/v1/daemon/health` 通过 `createAlembicRuntimeProjectIdentity()` 构造 Core canonical project identity，并把同一份 identity 传入 `createAlembicRuntimeHealthData()`；`dataRootSource`、`runtimeDir`、`workspaceMode`、`databasePath`、`schemaMigrationVersion` 不再作为 helper 外的手写 extension 补入；`runtimeBoundary` 继续作为 Alembic-owned attribution / Dashboard handoff 摘要，并复用 Core identity 字段。
- 验证命令与结果：
  - `npm run build:check`：通过，使用 workspace 本地 `../AlembicCore`。
  - `npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts`：通过，2 个测试文件、6 个测试通过。
  - `npm run lint:consumer-core-imports`：通过，扫描 416 个文件、559 个 `@alembic/core` imports。
  - `npx biome check --diagnostic-level=error lib/daemon/RuntimeBoundary.ts lib/http/routes/daemon.ts test/unit/DaemonCapabilities.test.ts`：通过。
  - `git -C Alembic diff --check`：通过。
  - `git -C Alembic diff --check HEAD~1..HEAD`：通过。
- 总控复核：通过。总控复核 `lib/http/routes/daemon.ts`、`lib/daemon/RuntimeBoundary.ts`、`test/unit/DaemonCapabilities.test.ts` 和最终提交 `e8a71c7948936c46815a225516e1ad46f13dbd55`；复跑 `npm run build:check`、`npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts`、`npm run lint:consumer-core-imports`、`npx biome check --diagnostic-level=error lib/daemon/RuntimeBoundary.ts lib/http/routes/daemon.ts test/unit/DaemonCapabilities.test.ts`、`git -C Alembic diff --check`、`git -C Alembic diff --check HEAD~2..HEAD` 均通过。
- 遗留风险：为兼容 Wave 2 consumer，Alembic health 仍同时输出 top-level `runtimeBoundary` 和 `capabilities.runtimeBoundary`；`runtimeBoundary.workspace.mode` 继续保留旧字段，同时新增 `workspaceMode`。Plugin / Dashboard 完成 canonical consumption 后可再评估收敛旧 fallback。
- 下一波建议：启动 `AlembicPlugin` 和 `AlembicDashboard` 消费 top-level canonical project identity；若两边确认不再依赖旧 fallback，再开一波收敛 `capabilities.runtimeBoundary` 兼容输出位置。

### AlembicPlugin

- 状态：观察中
- 观察原因：等待 Core + Alembic provider 稳定后再替换消费层 fallback。

### AlembicDashboard

- 状态：观察中
- 观察原因：等待 Core + Alembic provider 稳定后再替换 view model fallback 和安排 live smoke。

### AlembicAgent

- 状态：观察中
- 观察原因：本波不涉及 internal AI runtime。

### BiliDili

- 状态：无任务
- 原因：本波不做真实项目 smoke。
