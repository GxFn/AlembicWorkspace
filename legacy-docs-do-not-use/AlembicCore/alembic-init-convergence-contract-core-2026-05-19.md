# Alembic Init Convergence Contract Core Execution Record

日期：2026-05-19
归属窗口：AlembicCore
状态：已完成
总控计划：`../workspace/alembic-init-convergence-contract-workspace-plan-2026-05-19.md`

## 完成范围

- 修正 `ProjectRegistry.register(projectRoot, ghost)` 语义：普通 register / attach 已注册项目时返回既有 entry，不再静默改变 `ghost`，因此不会在 Plugin-first、Alembic-first Ghost、Alembic-first Standard 之间悄悄切换 dataRoot。
- 新增显式模式切换入口 `ProjectRegistry.setWorkspaceMode(projectRoot, mode, writeZone?)`，作为唯一会改变已注册项目 Ghost / Standard 状态的受控入口；切换时保持 `id` 和 `createdAt` 稳定。
- 保持 `WorkspaceResolver.fromProject(projectRoot)` 继续以 `ProjectRegistry.inspect()` 为准：已注册 Ghost 解析到 registry ghost dataRoot；已注册 Standard 解析到项目根；项目 id 保持稳定。
- 补充 `WorkspaceSettingsStore.fromProject(projectRoot)` 测试，确认普通 register 不改变 settings dataRoot，显式切换后才迁到 Ghost dataRoot。

## Core Contract 说明

- 普通初始化 / attach：调用 `ProjectRegistry.register(projectRoot, desiredGhost)`。如果项目未注册，用 `desiredGhost` 创建新 entry；如果项目已注册，忽略本次 `desiredGhost`，继承 registry 中既有模式。
- 显式模式切换：调用 `ProjectRegistry.setWorkspaceMode(projectRoot, 'ghost' | 'standard')`。该入口会改变已注册项目的 `ghost` 状态，但不生成新 project id。
- resolver 行为：`WorkspaceResolver.fromProject()` 不做模式猜测，始终读取 registry inspection；这保证 Alembic 与 Plugin 使用同一个 `projectRoot` 时落到同一套 `dataRoot`。
- settings 行为：`WorkspaceSettingsStore.fromProject()` 继续由 resolver 决定 settings / secrets 路径，不自行推断 Ghost / Standard。

## API / 行为变化

- `ProjectRegistry.register()` 行为变化：已注册项目不再更新 `existing.ghost`。
- 新增 `ProjectRegistry.setWorkspaceMode()`：用于用户显式迁移或明确设置 workspace mode。
- `ProjectRegistry.inspect()`、`WorkspaceResolver.fromProject()`、`WorkspaceSettingsStore.fromProject()` 的公开形状不变。
- Registry v1 schema 不变；没有新增强制字段，不破坏旧 `projects.json`。

## 关键文件

- `src/shared/ProjectRegistry.ts`
- `test/WorkspaceResolver.test.ts`
- `test/WorkspaceSettingsStore.test.ts`

## 提交

- `AlembicCore` 提交：`d954010fd6a22cab07692a2b707eb073cc520f52`
- 提交信息：`Converge project registry init semantics`

## 验证命令与结果

```text
npm run build:check
```

结果：通过。

```text
npm run test -- WorkspaceResolver.test.ts WorkspaceSettingsStore.test.ts
```

结果：通过，2 个测试文件、13 个测试通过。

```text
npm run lint
```

结果：通过，Biome 检查 421 个文件。

```text
git diff --check
```

结果：通过。

```text
npm run check
```

结果：通过；包含 `build:check`、`lint:public-api-boundary`、全量 `test`、`lint`。全量 Vitest 63 个测试文件、937 个测试通过；测试环境输出一行既有 `error: Could not access 'HEAD'`，但命令退出码为 0。

## 是否需要 Alembic / AlembicPlugin 调整调用方式

- `Alembic` 需要确认普通 `setup` / `ui` / daemon / projects control plane 使用 `ProjectRegistry.register()` 时是 attach 语义；如果用户显式请求模式迁移或明确设置 Ghost / Standard，应改用 `ProjectRegistry.setWorkspaceMode()` 或等价显式迁移流程。
- `AlembicPlugin` 需要修正 `codex-plugin` profile 默认 Ghost 优先级：未注册项目默认 Ghost 可继续调用 `register(projectRoot, true)`；已注册项目必须继承 registry，不得通过普通 init / status 把 Standard 改成 Ghost。
- 两个外层仓库都不应直接改 `projects.json` 或自行重算 dataRoot；统一通过 Core registry / resolver。

## 遗留风险

- Core 已提供受控语义，但外层仓库仍可能有旧逻辑把 `codex-plugin` profile 默认 Ghost 当作无条件覆盖；必须在后续 Alembic / AlembicPlugin 消费波次中修正。
- 显式模式切换只改变 registry mode，不负责搬迁旧 dataRoot 内容；如果未来要做 Ghost / Standard 数据迁移，需要单独的迁移计划和用户确认。
- `BiliDili` 尚未作为真实项目 smoke；应等 Alembic 与 AlembicPlugin 消费完成后再做只读验证。

## 下一步建议

- 启动 `Alembic`：验证 Plugin-first 后本体 setup / projects / daemon 能 attach 同一 Ghost workspace，并把显式模式切换与普通 attach 区分清楚。
- 启动 `AlembicPlugin`：修正 `codex-plugin` profile 默认 Ghost 只作用于未注册项目，并补 status / init / handoff mismatch 测试。
- `AlembicDashboard`、`AlembicAgent` 仍无任务；`BiliDili` 继续观察，等 Core / Alembic / Plugin 收敛后作为最终 smoke 对象。
