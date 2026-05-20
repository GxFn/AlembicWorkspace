# Alembic Init Convergence Contract Consumer Execution Record

更新日期：2026-05-19

窗口：`Alembic`
状态：已完成
总控计划：`docs/workspace/alembic-init-convergence-contract-workspace-plan-2026-05-19.md`

## 完成范围

- `lib/cli/SetupService.ts`
  - 普通 `setup` 不再用请求参数自行构造 Ghost / Standard resolver；现在先 attach / resolve `ProjectRegistry` 的实际 entry，再统一走 `WorkspaceResolver.fromProject(projectRoot)`。
  - 已注册项目再次普通 setup 时继承既有模式：Plugin-first Ghost 不会被普通 Alembic setup 改成 Standard；Alembic-first Standard 不会被普通 setup 改成 Ghost。
  - 显式 `ghost: true` / `ghost: false` 走 Core `ProjectRegistry.setWorkspaceMode()`，保持项目 id 稳定，并让 resolver 与 registry mode 一致。
- `bin/cli.ts`
  - `alembic ghost on` / `alembic ghost off` 改为调用 `ProjectRegistry.setWorkspaceMode(projectRoot, 'ghost' | 'standard')`，把显式模式切换与普通 attach 区分开。
  - 保留原有目录迁移流程：`ghost on` 仍把项目内 `.asd/` 与 `Alembic/` 迁到 Ghost workspace；`ghost off` 仍迁回项目内。
- `test/unit/SetupService.test.ts`
  - 新增 Alembic consumer 侧契约测试，覆盖 Plugin-first Ghost attach、ProjectRuntimeControl 看到同一 Ghost dataRoot、Alembic-first Standard attach，以及显式 Ghost / Standard 切换。

## 提交

- Alembic 提交 hash：`d051ad2cd1481a28f3d2c4bcc1fa569ec9a648f4`
- 提交信息：`fix: converge setup workspace mode attach`

## 验证命令与结果

在 `Alembic` 仓库执行：

```bash
npm run build:core
npm run test:unit -- test/unit/SetupService.test.ts test/unit/WorkspaceResolver.test.ts test/unit/WorkspaceSettingsStore.test.ts test/unit/ProjectRuntimeControl.test.ts
npm run build:check
npm run lint -- --diagnostic-level=error
npx biome check test/unit/SetupService.test.ts --diagnostic-level=error
npm run lint:core-import-boundary
npm run lint:consumer-core-imports
git diff --check
git status --short
```

结果：

- `npm run build:core` 通过，确认本地 `AlembicCore` source 产物包含 `ProjectRegistry.setWorkspaceMode()`。
- targeted unit 通过：4 个测试文件、22 个测试。
- `npm run build:check` 通过。
- `npm run lint -- --diagnostic-level=error` 通过。
- `npx biome check test/unit/SetupService.test.ts --diagnostic-level=error` 通过。
- `npm run lint:core-import-boundary` 通过，扫描 421 个文件和 559 个 `@alembic/core` imports。
- `npm run lint:consumer-core-imports` 通过，扫描 421 个文件和 559 个 `@alembic/core` imports。
- `git diff --check` 通过。
- 提交后 `git status --short` 为空，Alembic 仓库工作区干净。

## 遗留风险

- Alembic 侧只消费 Core contract，不迁移已有数据内容；数据目录迁移仍由显式 `alembic ghost on/off` 流程负责。
- `setup --ghost` 对已注册 Standard 项目现在是显式 mode switch，但不执行项目内 `.asd/` / `Alembic/` 内容迁移；需要迁移内容时应继续使用 `alembic ghost on`。
- `AlembicPlugin` 仍需完成 Codex profile 默认 Ghost 优先级与 status/init/handoff 测试；在 Plugin 完成前，跨入口最终验收不能关闭。

## 下一步建议

- 启动 `AlembicPlugin` 窗口消费同一 Core contract：已注册项目继承 registry，未注册项目默认 Ghost，冲突请求不得静默覆盖。
- Plugin 完成后由总控做最终四路径验收：Plugin-first、Alembic-first Ghost、Alembic-first Standard、Dashboard handoff。
