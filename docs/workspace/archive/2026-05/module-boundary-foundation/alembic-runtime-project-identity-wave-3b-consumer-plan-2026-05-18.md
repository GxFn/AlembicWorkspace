# Alembic Runtime Project Identity Wave 3B Consumer Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：暂停，等待用户确认任务级最终目标与阶段计划
阶段：前期开发 / 模块划分

## 背景

Wave 3A 已完成 provider 链路：`AlembicCore` 把 `dataRootSource`、`runtimeDir`、`workspaceMode` 等字段上提为 canonical runtime project identity contract；`Alembic` daemon health 已消费 Core contract 输出同一份 canonical identity，并把 `runtimeBoundary` 限定为 Alembic-owned attribution / Dashboard handoff 摘要。

本波对应长期路线图的阶段 3：Plugin / Dashboard consumer 收敛。最终目标和阶段完成定义必须先以任务级确认文档为准：[alembic-plugin-first-runtime-boundary-goal-stage-confirmation-2026-05-18.md](../plugin-first-enhancement/alembic-plugin-first-runtime-boundary-goal-stage-confirmation-2026-05-18.md)。

本文暂时保留为确认后可启用的候选计划。用户确认任务级最终目标与阶段计划前，不派发 `AlembicPlugin` 或 `AlembicDashboard`。

## 本波目标

- `AlembicPlugin`：route/status/diagnostics 优先消费 Alembic daemon health top-level canonical project identity，减少对 `runtimeBoundary.workspace` 的字段依赖。
- `AlembicDashboard`：runtime view model 优先消费 top-level canonical project identity；`runtimeBoundary` 继续作为 attribution / handoff fallback。
- 两个消费层都不得把 project identity contract 复制成新的长期本地 shape；若缺字段，回填给 Core / Alembic，而不是本地造字段。
- 本波不删除 `runtimeBoundary` 兼容输出、不删除 Plugin `dashboard/dist`，也不做发布链路大验收。

## 真实代码依据

- `Alembic/lib/http/routes/daemon.ts` 现在通过 `buildDaemonProjectIdentity()` / `createAlembicRuntimeProjectIdentity()` 生成 canonical identity，并把同一份 identity 传入 `createAlembicRuntimeHealthData()`。
- `AlembicPlugin/lib/codex/EnhancementRoute.ts` 当前可读取 `data.capabilities.runtimeBoundary` / `data.runtimeBoundary` 的 workspace 字段，下一步应优先读取 `data.dataRootSource`、`data.runtimeDir`、`data.workspaceMode` 等 canonical top-level 字段。
- `AlembicDashboard/src/api.ts` 当前 normalizer 已兼容 canonical health 与 `runtimeBoundary` fallback，下一步应收窄优先级，明确 top-level identity 是主来源。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>已完成 | Wave 3A 已完成 canonical contract；确认前不派发。 |
| `Alembic`<br>已完成 | Wave 3A 已完成 daemon health provider；确认前不派发。 |
| `AlembicPlugin`<br>暂停 | 候选下一波执行窗口；等待用户确认后再启动 consumer 收敛任务。 |
| `AlembicDashboard`<br>暂停 | 候选下一波执行窗口；等待用户确认后再启动 consumer 收敛任务。 |
| `AlembicAgent`<br>观察中 | 本波不涉及 internal AI runtime。 |
| `BiliDili`<br>无任务 | 本波不做真实项目 smoke。 |

## AlembicPlugin 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicPlugin/alembic-runtime-project-identity-wave-3b-plugin-consumer-2026-05-18.md`

挂载入口：本文“回填区 / AlembicPlugin”。

目标：

- 更新 `EnhancementRoute` / status / diagnostics 相关消费逻辑：优先读取 Alembic daemon health top-level `projectRoot`、`dataRoot`、`projectId`、`dataRootSource`、`runtimeDir`、`workspaceMode`、`databasePath`、`schemaMigrationVersion`。
- `runtimeBoundary` 继续可读，但只作为 owner attribution、Dashboard handoff、file monitor owner、jobs owner、internal AI owner 的摘要或缺字段 fallback。
- 不扩张 Plugin-local runtime policy，不引入新的长期 project identity contract，不把 internal AI provider 当作 host-agent 来源。
- 如果 portable runtime artifact 需要刷新，按 Plugin 仓库既有脚本执行并记录 embedded runtime 子仓库提交；不要删除 `dashboard/dist`。

建议验证命令：

```text
npm run build:check
npm run test:unit -- test/unit/CodexModuleBoundary.test.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts
npm run smoke:codex-plugin
git diff --check
git -C plugins/alembic-codex diff --check
```

## AlembicDashboard 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicDashboard/alembic-runtime-project-identity-wave-3b-dashboard-consumer-2026-05-18.md`

挂载入口：本文“回填区 / AlembicDashboard”。

目标：

- 更新 `src/api.ts` / runtime normalizer / types：优先使用 Alembic daemon health top-level canonical project identity。
- 保留 `runtimeBoundary` fallback，但在代码和执行记录中明确它是 attribution / handoff 兼容层，不是 canonical identity 主来源。
- 前端只展示 runtime identity、route、capability、Dashboard handoff，不引入 ProjectRegistry、WorkspaceResolver、file monitor、JobStore、internal AI 决策或 Node / fs / env 依赖。
- 记录是否需要后续 live smoke；若仅前端 build 可证明类型消费，则不要强行启动 daemon。

建议验证命令：

```text
npm run build
git diff --check
```

## 轻量完成条件

- `AlembicPlugin` 与 `AlembicDashboard` 均有执行记录、提交 hash、完成范围、验证结果和下一波建议。
- 两个消费层都优先读取 top-level canonical project identity。
- `runtimeBoundary` 不再承担 canonical identity 的唯一来源，只作为 attribution / handoff / fallback。
- 本波不做大验收归档；完成后总控再判断是否需要 live smoke 或兼容字段收敛。

总控复核命令：

```text
node scripts/verify-workspace-docs.mjs --all-workspace
node scripts/check-dispatch-coverage.mjs
git diff --check
```

## 可复制分派提示词

发送给：无

```text
等待用户确认 docs/workspace/alembic-plugin-first-runtime-boundary-goal-stage-confirmation-2026-05-18.md 的最终目标与阶段计划；当前不派发执行窗口。
```

不发送给：`AlembicCore`（已完成）、`Alembic`（已完成）、`AlembicPlugin`（暂停）、`AlembicDashboard`（暂停）、`AlembicAgent`（观察中）、`BiliDili`（无任务）。

## 回填区

### AlembicPlugin

- 状态：暂停，等待用户确认后再启动
- 执行记录：
- 提交 hash：
- 完成范围：
- 验证命令与结果：
- 遗留风险：
- 下一波建议：

### AlembicDashboard

- 状态：暂停，等待用户确认后再启动
- 执行记录：
- 提交 hash：
- 完成范围：
- 验证命令与结果：
- 遗留风险：
- 下一波建议：

### AlembicCore

- 状态：已完成
- 说明：Wave 3A 已完成 canonical runtime project identity contract。

### Alembic

- 状态：已完成
- 说明：Wave 3A 已完成 daemon health provider 接入。

### AlembicAgent

- 状态：观察中
- 观察原因：本波不涉及 internal AI runtime。

### BiliDili

- 状态：无任务
- 原因：本波不做真实项目 smoke。
