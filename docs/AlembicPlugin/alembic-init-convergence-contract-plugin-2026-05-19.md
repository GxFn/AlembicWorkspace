# AlembicPlugin Init Convergence Contract Execution Record

更新日期：2026-05-19
执行窗口：AlembicPlugin
状态：已完成

## 完成范围

- 消费 `AlembicCore` 初始化收敛 contract，Core producer 提交为 `d954010fd6a22cab07692a2b707eb073cc520f52`。
- 修正 `codex-plugin` profile 默认 Ghost 优先级：未注册项目仍默认 Ghost；已注册项目继承 `ProjectRegistry` 既有 mode，不在普通 init / status / on-demand setup 路径静默切换 Ghost / Standard。
- `alembic_codex_init` 已区分 `standard` 参数缺省与显式请求：缺省表示 attach / default；显式与既有 mode 冲突时返回 `CODEX_WORKSPACE_MODE_CONFLICT`，不覆盖 registry。
- `alembic_codex_status` 已把已注册 Standard 项目报告为 attach target，onboarding 主动作改为 `Attach Standard workspace`，避免误导为初始化 Ghost。
- 保留 projectRoot fail-closed、Codex plugin cache reject、saved projectRoot、host project alignment 和 Dashboard URL handoff fail-closed 边界。
- 刷新 Codex 插件 portable runtime artifact；embedded runtime 保留 `@alembic/core: file:vendor/AlembicCore` 和 `.alembic-source.json`，并同步 Core snapshot 到 `d954010fd6a22cab07692a2b707eb073cc520f52`。

## 提交 Hash

- `AlembicPlugin`：`2f5fd8dde85f8e83336e519b4c93da288cea41c5`
- `AlembicCodex` runtime artifact：`1a896fd714a34a1aa08b2fd53d7386227097cb57`
- 已消费 Core producer：`d954010fd6a22cab07692a2b707eb073cc520f52`

## 行为闭环

- Plugin first：未注册项目通过 Codex plugin init 仍默认 Ghost。
- Alembic first Ghost：Plugin init / status attach 既有 Ghost registry mode。
- Alembic first Standard：Plugin init / status attach Standard，不因 `codex-plugin` profile 默认 Ghost 改写 registry。
- 显式冲突：例如已注册 Ghost 时显式请求 Standard，返回 `CODEX_WORKSPACE_MODE_CONFLICT`，包含 existing / requested mode 和下一步状态入口。
- Dashboard handoff：继续依赖 host project alignment；daemon smoke 中 mismatch 场景 fail closed。

## 验证命令与结果

- `npm run build:core`：通过，使用本地 `AlembicCore` 提交 `d954010fd6a22cab07692a2b707eb073cc520f52`。
- `npx vitest run --config vitest.unit.config.ts test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexToolPolicy.test.ts test/unit/WorkspaceResolver.test.ts test/unit/WorkspaceSettingsStore.test.ts`：通过，5 个测试文件、55 个测试。
- `npm run lint -- --diagnostic-level=error`：通过。
- `npm run build`：通过。
- `npm run build:check`：通过。
- `npm run test:unit`：通过，95 个测试文件、1478 个测试。
- `npm run prepare:codex-plugin-runtime`：通过，已刷新 `plugins/alembic-codex/runtime` 与 `runtime.tgz`。
- `npm run verify:codex-plugin`：通过。
- `npm run verify:codex-channel`：通过。
- `npm run smoke:codex-plugin`：通过。
- `npm run smoke:codex-plugin -- --daemon --no-npx-runtime`：通过；daemon ready，Dashboard handoff 在未对齐场景 fail closed。
- `npm run verify:release-package-boundary`：通过；root registry publish 仍禁用，Codex artifact release 启用，embedded runtime Core dependency 保持 `file:vendor/AlembicCore`。
- `git diff --check`：通过。
- `git diff --cached --check`：提交前通过。

## 负向扫描与遗留风险

- `npm run lint:repo-boundary` 仍命中 10 个既有 DB boundary 违规：
  - `lib/codex/KnowledgeState.ts:499`
  - `lib/codex/KnowledgeState.ts:573`
  - `lib/codex/KnowledgeState.ts:576`
  - `lib/codex/KnowledgeState.ts:761`
  - `lib/http/routes/daemon.ts:102`
  - `lib/service/cleanup/CleanupService.ts:503`
  - `lib/service/cleanup/CleanupService.ts:508`
  - `lib/service/cleanup/CleanupService.ts:869`
  - `lib/service/signal/HitRecorder.ts:185`
  - `bin/daemon-server.ts:291`
- 这些命中不是本阶段引入；本阶段未扩大 DB boundary 触面。
- `AlembicPlugin` 已完成 consumer 和 runtime artifact 侧闭环；最终跨仓四路径 smoke 已由总控结合 `Alembic` 侧入口统一验收通过。
- root `vendor/AlembicCore` 未作为普通源码目录改动；本阶段只刷新 Codex portable runtime 内的 Core snapshot。

## 下一步建议

- `AlembicPlugin` 已通过总控验收；本窗口暂无继续开发任务。
- 总控已基于 `AlembicCore`、`Alembic`、`AlembicPlugin` 三个提交执行最终四路径验收：Plugin-first、Alembic-first Ghost、Alembic-first Standard、Dashboard handoff mismatch。
- `BiliDili` 仍保持观察中；仅在总控需要真实项目 smoke 时作为验证对象，不修改其产品源码。
