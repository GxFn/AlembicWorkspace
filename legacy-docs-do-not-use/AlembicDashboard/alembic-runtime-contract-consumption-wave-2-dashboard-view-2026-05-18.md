# AlembicDashboard Runtime Contract Consumption Wave 2 Dashboard View

日期：2026-05-18
窗口：AlembicDashboard
状态：待验收
对应总控计划：`docs/workspace/alembic-runtime-contract-consumption-wave-2-workspace-plan-2026-05-18.md`

## 完成范围

- `RuntimeBoundary` 前端 view model 已对齐 Alembic daemon health 的 project identity、route、capability、file monitor、jobs、internal AI 与 Dashboard handoff 字段。
- `src/api.ts` 的 runtime normalizer 现在优先消费 `/daemon/health` 的 canonical `enhancement` / `capabilities` 字段，并兼容读取 `data.runtimeBoundary`、`capabilities.runtimeBoundary`、`projectInfo.runtimeBoundary` 和 `projectInfo.capabilities.runtimeBoundary`。
- project identity 兼容归一化 `projectRoot`、`dataRoot`、`projectId`、`dataRootSource`、`runtimeDir`、`databasePath`、`schemaMigrationVersion`、workspace mode 与 workspace contract。
- capability 兼容归一化 API、Dashboard、file monitor、jobs、internal AI；Dashboard handoff、file monitor owner、jobs store、internal AI owner 等只进入展示型 view model，不在前端参与策略决策。
- Header runtime chip 支持 `local-alembic-daemon`、`embedded-plugin-runtime`、`local-alembic-install` 等 route alias，并在 tooltip 中补充 workspace mode 与 Dashboard handoff。

## 代码变更

- `src/types.ts`：扩展 runtime view model 字段，保留前端展示层类型，不引入 Core 内核实现。
- `src/api.ts`：增强 runtime boundary normalizer，优先使用 daemon health canonical 字段，并保留旧 project-info fallback。
- `src/components/Layout/Header.tsx`：更新 route label/tone alias 和 runtime tooltip 展示。
- `src/i18n/locales/zh.ts`、`src/i18n/locales/en.ts`：补充 workspace mode 与 Dashboard handoff 文案。

## 提交 Hash

- `77d48fd5753f90c0f7af24d50c256451c4f30037`

## 验证结果

- `npm run build`：通过。执行了 `tsc && vite build`；Vite 仍提示既有大 chunk warning，未阻塞构建。
- `git diff --check`：通过。
- `rg -n "@alembic/core|ProjectRegistry|WorkspaceResolver|FileChangeDispatcher|JobStore|ALEMBIC_DAEMON|process\\.env|node:fs|from 'fs'|from \"fs\"" src --glob '!**/dist/**'`：仅命中既有 `src/hooks/useBootstrapSocket.ts` 中 “daemon JobStore record” 类型注释；本轮未新增 Core/daemon 实现引用、文件系统访问或环境变量策略。
- `git status --short`：Dashboard 仓库提交后干净。
- `node scripts/verify-workspace-docs.mjs --all-workspace`：通过。
- `node scripts/check-dispatch-coverage.mjs`：通过；当前只发送给 `AlembicPlugin`。
- `git diff --check -- docs/workspace/alembic-runtime-contract-consumption-wave-2-workspace-plan-2026-05-18.md docs/workspace/index.md docs/workspace/workspace-current-status.md docs/AlembicDashboard/alembic-runtime-contract-consumption-wave-2-dashboard-view-2026-05-18.md`：通过。
- `rg -n "/Users/|sk-|AIza|token|API key|api key" docs/workspace/alembic-runtime-contract-consumption-wave-2-workspace-plan-2026-05-18.md docs/workspace/index.md docs/workspace/workspace-current-status.md docs/AlembicDashboard/alembic-runtime-contract-consumption-wave-2-dashboard-view-2026-05-18.md`：仅命中 `index.md` 既有文档规则文字；本轮文档未写入本机绝对路径或密钥。

## 边界确认

- 本轮没有在 Dashboard 中实现 daemon route policy、ProjectRegistry、WorkspaceResolver、file monitor、JobStore 或 internal AI 决策。
- Dashboard 仍只承担 API client、view-model normalizer、前端状态和 UI 展示。
- 与 Alembic health 的缺字段兼容只做 fallback，不把 Dashboard-local shape 升级为长期跨仓库 contract。

## Dashboard Artifact 最小契约

- 前端源码所有权继续归 `AlembicDashboard`。
- 对外 artifact 最小内容应包含：production build output、Dashboard package version、源码提交 hash、构建来源说明、可消费入口，以及与 Alembic daemon Dashboard URL handoff 的兼容说明。
- `AlembicPlugin` 可以继续保留必要 `dashboard/dist` artifact 或 URL handoff，但不拥有 Dashboard 源码、前端 route、状态管理或 UI 逻辑。
- 后续切换到 release asset 或 local source handoff 前，需要明确 artifact 元数据、版本匹配规则、失败 fallback 和 smoke 命令。

## 遗留风险

- `dataRootSource`、`runtimeDir` 等字段目前由 Alembic health extension 稳定输出；如 Plugin / Dashboard 都依赖这些字段，下一波应考虑上提到 `AlembicCore` canonical project identity 类型。
- 本轮只做前端 build 与静态边界扫描，没有运行真实 Alembic daemon + Dashboard live smoke。
- `RuntimeBoundary` 仍是前端 view model；若后续要强 typed contract，应由后端生成或通过稳定包入口提供，而不是前端继续扩张本地长期契约。

## 下一波建议

- `AlembicPlugin` 完成 daemon health 消费后，总控安排一次 Alembic daemon + Dashboard route chip 的轻量 live smoke。
- 若 Plugin / Dashboard 均继续使用 `runtimeDir`、`dataRootSource`、Dashboard handoff owner 字段，建议由 `AlembicCore` 补充 canonical project identity / runtime handoff typing。
- Dashboard artifact 下一波可以增加 build metadata 文件或 release asset 清单，但仍保持源码唯一维护点在 `AlembicDashboard`。
