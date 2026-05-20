# Alembic Init Convergence Contract Workspace Plan

更新日期：2026-05-19
总控窗口：AlembicWorkspace
状态：已完成

## 目标

修正 `Alembic` 与 `AlembicPlugin` 初始化顺序不对称的问题：无论用户先从本地 `Alembic` 初始化项目，还是先从 Codex 插件 `AlembicPlugin` 初始化项目，最终都必须收敛到同一个 `projectRoot`、同一个 `ProjectRegistry` 项目记录、同一个 `WorkspaceResolver` dataRoot 和同一套项目知识 / runtime 状态。

完成后的契约必须支持四条真实路径：

- Plugin first：Codex 插件先在用户项目中初始化，默认 Ghost；之后 `Alembic` 本体接入同一个 Ghost workspace，只补齐本体能力，不重建或迁移项目。
- Alembic first Ghost：`Alembic setup --ghost` 或等价 UI 初始化后，Plugin 只 attach 到已有 Ghost workspace。
- Alembic first Standard：`Alembic setup` 标准模式初始化后，Plugin 不得因为 `codex-plugin` profile 默认 Ghost 而把项目静默改成 Ghost。
- Dashboard handoff：Plugin 只有在 Codex host project 与 Alembic selected / active runtime project 对齐时，才允许返回 Dashboard URL；不对齐时 fail closed。

这不是削弱 Plugin 默认 Ghost，也不是移除标准模式。默认 Ghost 只适用于未注册项目；已注册项目默认继承既有模式。模式切换必须是显式迁移或用户明确选择，不能发生在普通 init / setup / status / handoff 流程中。

## 代码事实

已读取 `AlembicCore`、`Alembic`、`AlembicPlugin` 相关实现，当前事实如下：

- `AlembicCore/src/shared/ProjectRegistry.ts` 的 `ProjectRegistry.register(projectRoot, ghost)` 对已注册项目会直接更新 `existing.ghost = ghost`，这使普通初始化入口可能静默切换 Ghost / Standard 模式。
- `Alembic/lib/cli/SetupService.ts` 默认先读取 `ProjectRegistry.get(this.projectRoot)`，没有显式参数时继承已有 `ghost` 状态，整体接近收敛契约。
- `AlembicPlugin/lib/cli/SetupService.ts` 当前使用 `profile === 'codex-plugin' ? true : existingEntry?.ghost` 的优先级；这会让 Plugin 在已注册 standard 项目上默认改成 Ghost。
- `AlembicPlugin/lib/codex/ProjectRootResolver.ts` 已支持显式 `projectRoot`、`ALEMBIC_PROJECT_DIR`、`CODEX_WORKSPACE_DIR`、saved project root，并拒绝 Codex plugin cache 路径；这部分应保留。
- `AlembicPlugin/lib/codex/HostProjectAlignment.ts` 已有 selected / active runtime 与 Codex host project 的对齐判断；这应作为 Dashboard handoff 的保护边界继续保留。

## 完成定义

- Core 层提供明确的项目注册 / attach / 显式模式切换语义；普通注册已有项目时不静默改变 workspace mode。
- `Alembic` 与 `AlembicPlugin` 都通过同一个 Core contract 处理初始化，入口差异只体现在各自补齐的能力，不体现在项目身份或 dataRoot 分裂。
- Plugin 默认 Ghost 只影响未注册项目；已注册项目以 registry 为准。
- Alembic 本体在 Plugin-first 后运行 setup / ui / daemon / projects list / start 时能识别同一个 Ghost 项目。
- Plugin 在 Alembic-first 后运行 status / init / dashboard handoff 时能识别同一个项目；遇到 Standard 项目时不自动改 Ghost。
- 代表性测试覆盖 Plugin-first、Alembic-first Ghost、Alembic-first Standard、projectRoot mismatch、Dashboard handoff mismatch。

## 非目标

- 不删除 Standard 模式。
- 不改变 Ghost dataRoot 目录结构。
- 不把 Dashboard frontend 或 daemon ownership 迁回 Plugin。
- 不改 `BiliDili` 项目源码；它只可作为最终真实项目 smoke 对象。
- 不引入空 adapter、空 provider、只返回静态状态的薄实现。
- 不把 AI provider 配置与 Codex host-agent 路线混淆；internal AI 仍属于 Alembic 本体增强能力，Codex host-agent 路线不要求 AI Provider。

## 执行顺序

`AlembicCore` producer 已完成，已收敛 `ProjectRegistry` / `WorkspaceResolver` 初始化契约和测试证据。

`Alembic` 与 `AlembicPlugin` consumer 接入已完成并通过总控复核。跨仓四路径验收确认 Plugin-first、Alembic-first Ghost、Alembic-first Standard 与 Dashboard handoff mismatch 都不再产生 registry / dataRoot 分裂。

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>已完成 | 已补项目初始化收敛 contract：普通注册已有项目不静默切换 Ghost / Standard；新增显式 `setWorkspaceMode()`；补 WorkspaceResolver / WorkspaceSettingsStore 测试。 |
| `Alembic`<br>已完成 | 已消费 Core 新语义：普通 setup attach 既有 registry mode，显式 `setup --ghost` / `ghost on/off` 走 `setWorkspaceMode()`；补 SetupService / ProjectRuntimeControl consumer 测试。 |
| `AlembicPlugin`<br>已完成 | 已修正 `codex-plugin` profile 默认 Ghost 优先级：已注册项目继承 registry，未注册项目默认 Ghost；已补 Codex status/init/handoff 测试并刷新 Codex runtime artifact。 |
| `AlembicDashboard`<br>无任务 | 初始化收敛不涉及前端 UI / API client；Dashboard 只消费 Alembic daemon 提供的项目状态。 |
| `AlembicAgent`<br>无任务 | 不涉及 Agent runtime、AI provider、tool system 或执行循环。 |
| `BiliDili`<br>观察中 | 当前不改真实测试项目；等 Core / Alembic / Plugin 收敛后，可作为最终 smoke 的真实项目。 |

### AlembicCore 执行要求

- 先读取 `AlembicCore/AGENTS.md`、本文档、`src/shared/ProjectRegistry.ts`、`src/shared/WorkspaceResolver.ts`、`src/shared/WorkspaceSettingsStore.ts`、`test/WorkspaceResolver.test.ts`、`test/WorkspaceSettingsStore.test.ts`。
- 修正 registry contract：
  - 已注册项目再次执行普通 register / ensure 时，默认返回既有 entry，不改变 `ghost`。
  - 显式模式切换必须有专门方法、显式 option 或等价可审计入口；不要把普通初始化和模式迁移混在一起。
  - `WorkspaceResolver.fromProject(projectRoot)` 必须继续以 registry inspection 为准，返回真实 dataRoot / mode。
  - 保持项目 id 稳定；不要因为 attach 或模式检查重新生成 id。
- 补测试：
  - ghost 项目再次普通注册 standard 请求时仍保持 ghost。
  - standard 项目再次普通注册 ghost 请求时仍保持 standard。
  - 显式切换入口能切换 mode，并保持 project id 稳定。
  - `WorkspaceResolver.fromProject()` 在上述场景下返回正确 dataRoot。
  - `WorkspaceSettingsStore.fromProject()` 仍指向正确 dataRoot。
- 不要在 Core 里实现 Alembic CLI、Codex MCP、Dashboard handoff 或 Plugin profile 逻辑。

建议验证命令：

```bash
npm run build:check
npm run test -- WorkspaceResolver.test.ts WorkspaceSettingsStore.test.ts
git diff --check
```

文档动作：新建执行记录。

保存位置：`docs/AlembicCore/alembic-init-convergence-contract-core-2026-05-19.md`。

挂载入口：本文“回填区”和 `docs/workspace/index.md` 当前计划。

回填要求：完成范围、提交 hash、Core contract 说明、API / 行为变化、测试命令、测试结果、是否需要 Alembic / AlembicPlugin 调整调用方式、遗留风险。

### Alembic 消费结果

已完成。Core contract 提交 `d954010fd6a22cab07692a2b707eb073cc520f52`，Alembic consumer 提交 `d051ad2cd1481a28f3d2c4bcc1fa569ec9a648f4`。

完成重点：

- `SetupService` 普通 setup 已默认 attach 已注册模式；显式 `ghost: true/false` 与 CLI `ghost on/off` 已按 Core 显式入口处理。
- Plugin-first 后，Alembic `setup` 与 `ProjectRuntimeControl` 已在测试中指向同一 Ghost dataRoot；daemon / Dashboard 仍由 Alembic 本体 owner 链路消费该 runtime scope。
- 保留本体 internal AI 配置、daemon、Dashboard server、ProjectRuntimeControl、file monitor 的 ownership。

### AlembicPlugin 消费结果

已完成。Core contract 提交 `d954010fd6a22cab07692a2b707eb073cc520f52`，AlembicPlugin consumer 提交 `2f5fd8dde85f8e83336e519b4c93da288cea41c5`，AlembicCodex runtime artifact 提交 `1a896fd714a34a1aa08b2fd53d7386227097cb57`。

完成重点：

- `codex-plugin` profile 默认 Ghost 只在未注册项目生效。
- 已注册项目上 `alembic_codex_status` / `alembic_codex_init` 应 attach 到 registry 模式，不静默迁移。
- 用户显式请求与现有 mode 冲突的初始化返回 `CODEX_WORKSPACE_MODE_CONFLICT`，不自动覆盖。
- 保留 projectRoot fail-closed、plugin cache reject、saved projectRoot、host project alignment、Dashboard URL handoff 边界。

## 验收重点

总控验收必须做功能完整性检查：

- 不能只看类型通过；必须验证真实 ProjectRegistry 数据在不同初始化顺序下不会分裂。
- 不能只新增接口；必须有真实调用方或明确下一波 consumer 接入方式。
- 不能把模式冲突静默吞掉；用户需要能知道当前项目是 Ghost 还是 Standard。
- 不能让 Plugin 在 Alembic-first Standard 场景下把项目自动改成 Ghost。
- 不能让 Alembic 在 Plugin-first Ghost 场景下误认为未初始化或另建 Standard dataRoot。

## 总控验收

总控于 2026-05-19 完成复核，结论：通过。

复核范围：

- `AlembicCore` 提交 `d954010fd6a22cab07692a2b707eb073cc520f52`：`ProjectRegistry.register()` 已变为幂等 attach；新增 `ProjectRegistry.setWorkspaceMode()`；resolver / settings 测试覆盖 mode 稳定性。
- `Alembic` 提交 `d051ad2cd1481a28f3d2c4bcc1fa569ec9a648f4`：普通 `SetupService` attach 既有 registry mode；显式 `setup --ghost` / `ghost on/off` 走 Core 显式切换入口；ProjectRuntimeControl 能看到同一 Ghost dataRoot。
- `AlembicPlugin` 提交 `2f5fd8dde85f8e83336e519b4c93da288cea41c5` 与 AlembicCodex runtime artifact 提交 `1a896fd714a34a1aa08b2fd53d7386227097cb57`：未注册项目默认 Ghost，已注册项目继承 registry mode；显式冲突返回 `CODEX_WORKSPACE_MODE_CONFLICT`；Dashboard handoff mismatch fail closed。

总控复跑验证：

```text
Alembic: npm run test:unit -- test/unit/SetupService.test.ts test/unit/WorkspaceResolver.test.ts test/unit/WorkspaceSettingsStore.test.ts test/unit/ProjectRuntimeControl.test.ts
Alembic: npm run build:check
AlembicPlugin: npx vitest run --config vitest.unit.config.ts test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexToolPolicy.test.ts test/unit/WorkspaceResolver.test.ts test/unit/WorkspaceSettingsStore.test.ts
AlembicPlugin: npm run build:check
workspace: node scripts/verify-workspace-docs.mjs --all-workspace
workspace: node scripts/check-dispatch-coverage.mjs
workspace: git diff --check
```

复核结果：全部通过。

功能完整性判断：

- Plugin-first：未注册项目仍由 Plugin 默认 Ghost 初始化；Alembic 后续普通 setup attach 同一 registry entry / Ghost dataRoot。
- Alembic-first Ghost：Plugin status / init attach 既有 Ghost，不重建。
- Alembic-first Standard：Plugin status / init attach Standard，不因 Codex profile 默认 Ghost 改写 registry。
- 显式 mode 冲突：Plugin 返回 `CODEX_WORKSPACE_MODE_CONFLICT`，Alembic 显式切换走 `setWorkspaceMode()`。
- Dashboard handoff：继续由 host project alignment 保护，mismatch fail closed。

遗留风险：本轮不做 Ghost / Standard 之间的数据内容迁移；如需迁移内容，仍应走显式迁移流程。`AlembicPlugin` 的 `npm run lint:repo-boundary` 仍有 10 个既有 DB boundary 命中，不是本阶段引入。

## 可复制提示词

发送给：无。

```text
读取 docs/workspace/alembic-init-convergence-contract-workspace-plan-2026-05-19.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`AlembicCore`（已完成）、`Alembic`（已完成）、`AlembicPlugin`（已完成）、`AlembicDashboard`（无任务）、`AlembicAgent`（无任务）、`BiliDili`（观察中）。

## 回填区

- `AlembicCore`：已完成。执行记录：[../AlembicCore/alembic-init-convergence-contract-core-2026-05-19.md](../../../../AlembicCore/alembic-init-convergence-contract-core-2026-05-19.md)。提交 hash：`d954010fd6a22cab07692a2b707eb073cc520f52`。完成范围：`ProjectRegistry.register()` 改为幂等 attach，已注册项目不静默改变 `ghost`；新增 `ProjectRegistry.setWorkspaceMode()` 显式切换入口；补 `WorkspaceResolver` / `WorkspaceSettingsStore` 测试。验证：`npm run build:check` 通过；`npm run test -- WorkspaceResolver.test.ts WorkspaceSettingsStore.test.ts` 通过，2 个测试文件、13 个测试；`npm run lint` 通过；`git diff --check` 通过；`npm run check` 通过，全量 63 个测试文件、937 个测试。遗留风险：Core 只改变 registry 语义，不迁移 dataRoot 内容；外层必须消费新语义，避免继续用 profile 默认值覆盖已注册项目。
- `Alembic`：已完成。执行记录：[../Alembic/alembic-init-convergence-contract-consumer-2026-05-19.md](../../../../Alembic/alembic-init-convergence-contract-consumer-2026-05-19.md)。提交 hash：`d051ad2cd1481a28f3d2c4bcc1fa569ec9a648f4`。完成范围：`SetupService` 普通 setup attach 已注册模式并统一从 `WorkspaceResolver.fromProject()` 取 dataRoot；显式 `ghost: true/false` 与 CLI `ghost on/off` 使用 Core `ProjectRegistry.setWorkspaceMode()`；新增 Alembic consumer 测试覆盖 Plugin-first Ghost、ProjectRuntimeControl 看到同一 Ghost dataRoot、Alembic-first Standard、显式 Ghost / Standard 切换。验证：`npm run build:core` 通过；targeted unit 通过，4 个测试文件、22 个测试；`npm run build:check` 通过；`npm run lint -- --diagnostic-level=error` 通过；`npx biome check test/unit/SetupService.test.ts --diagnostic-level=error` 通过；`npm run lint:core-import-boundary` 通过；`npm run lint:consumer-core-imports` 通过；`git diff --check` 通过；提交后 Alembic 仓库工作区干净。遗留风险：Alembic 侧不迁移已有数据内容；内容迁移仍由显式 `alembic ghost on/off` 流程负责；最终四路径验收等待 `AlembicPlugin` 消费同一 contract 后关闭。
- `AlembicPlugin`：已完成。执行记录：[../AlembicPlugin/alembic-init-convergence-contract-plugin-2026-05-19.md](../../../../AlembicPlugin/alembic-init-convergence-contract-plugin-2026-05-19.md)。提交 hash：`2f5fd8dde85f8e83336e519b4c93da288cea41c5`；AlembicCodex runtime artifact 提交 hash：`1a896fd714a34a1aa08b2fd53d7386227097cb57`。完成范围：已消费 Core `ProjectRegistry.register()` 幂等 attach 语义；`codex-plugin` profile 只在未注册项目默认 Ghost；已注册 Ghost / Standard 项目由 `alembic_codex_status` / `alembic_codex_init` attach 既有 registry mode；显式 mode 冲突返回 `CODEX_WORKSPACE_MODE_CONFLICT`；保留 projectRoot fail-closed、plugin cache reject、saved projectRoot、host project alignment 和 Dashboard handoff fail-closed；刷新 Codex portable runtime artifact，embedded Core snapshot 指向 `d954010fd6a22cab07692a2b707eb073cc520f52`。验证：`npm run build:core` 通过；targeted unit 通过，5 个测试文件、55 个测试；`npm run lint -- --diagnostic-level=error` 通过；`npm run build` 通过；`npm run build:check` 通过；`npm run test:unit` 通过，95 个测试文件、1478 个测试；`npm run prepare:codex-plugin-runtime` 通过；`npm run verify:codex-plugin` 通过；`npm run verify:codex-channel` 通过；`npm run smoke:codex-plugin` 通过；`npm run smoke:codex-plugin -- --daemon --no-npx-runtime` 通过，daemon ready 且 handoff mismatch fail closed；`npm run verify:release-package-boundary` 通过；`git diff --check` 通过；提交后 AlembicPlugin 与 AlembicCodex 工作区干净。总控复核已通过；负向扫描：`npm run lint:repo-boundary` 仍命中 10 个既有 DB boundary 违规，不是本阶段引入。遗留风险：本阶段未迁移已有 dataRoot 内容。
- `AlembicDashboard`：无任务。
- `AlembicAgent`：无任务。
- `BiliDili`：观察中，暂不修改。
