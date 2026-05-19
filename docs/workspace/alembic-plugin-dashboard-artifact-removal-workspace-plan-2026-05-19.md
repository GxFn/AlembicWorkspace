# AlembicPlugin Dashboard Artifact Removal Workspace Plan

更新日期：2026-05-19
总控窗口：AlembicWorkspace
状态：已完成

## 目标

移除 `AlembicPlugin` 对 Dashboard 前端产物的构建、复制、内嵌打包和托管职责，让插件只保留 Codex 入口、MCP、skills、runtime、状态判断和 Dashboard URL handoff。

完成后的边界必须是：

- `AlembicDashboard`：Dashboard 前端源码和前端构建产物的唯一产品 owner。
- `Alembic`：本地 daemon / HTTP / Dashboard server 的运行 owner，负责提供用户可打开的 Dashboard URL。
- `AlembicPlugin`：Codex 插件入口和 handoff owner，不再保存 `dashboard/dist`、不再依赖 `vendor/AlembicDashboard`、不再把 Dashboard dist 放进 plugin runtime。

这不是删除 Dashboard 功能。`alembic_codex_dashboard` 仍应能在本机 Alembic 可用时返回真实 Dashboard URL；本机 Alembic 不可用时，返回明确缺失能力和下一步，而不是启动插件内嵌前端或伪造静态页面。

## 代码事实

已读取 `AlembicPlugin`、`Alembic`、`AlembicDashboard` 的 `AGENTS.md` 和相关代码，当前事实如下：

- `AlembicPlugin/package.json` 仍有 `build:dashboard`，`files` 仍包含 `dashboard/dist`。
- `AlembicPlugin/scripts/build-dashboard.mjs` 从 `../AlembicDashboard` 或 `vendor/AlembicDashboard` 构建并复制到 `dashboard/dist`。
- `AlembicPlugin/scripts/prepare-codex-plugin-runtime.mjs` 要求 `dashboard/dist/index.html` 存在，并复制到 `plugins/alembic-codex/runtime/dashboard/dist`。
- `AlembicPlugin/bin/daemon-server.ts` 通过 `mountDashboardIfAvailable()` 托管 `DASHBOARD_DIR/dist`。
- `AlembicPlugin/.gitmodules` 仍包含 `vendor/AlembicDashboard`。
- `AlembicPlugin/lib/codex/EnhancementRoute.ts` 当前在 dashboard requirement 下仍可能选择 embedded plugin runtime。
- `Alembic` 已有 `build:dashboard`、`dashboard/dist`、`alembic ui`、daemon dashboard mount 和 runtime boundary；它是接管 Dashboard 运行与服务的正确位置。
- `AlembicDashboard` 目前提供 `npm run build`，但没有单独 release asset 契约；本波先不要求 Dashboard 发布 artifact，只让 Plugin 停止内嵌。

## 非目标

- 不删除 `AlembicDashboard` 前端源码、页面、API client 或构建能力。
- 不删除 `Alembic` 的 `dashboard/dist`、`build:dashboard`、`alembic ui`、daemon Dashboard server。
- 不删除 `AlembicPlugin` 的 Codex MCP、skills、host-agent bootstrap/rescan、internal AI job handoff、plugin release/channel/smoke 能力。
- 不把 Dashboard 前端迁回 Plugin。
- 不为了让测试通过创建空 dashboard route、空静态页或 mock URL。

## 执行顺序

本波只发送给 `AlembicPlugin`。

`Alembic` 和 `AlembicDashboard` 先观察，不发送执行提示词。只有当 `AlembicPlugin` 实作中发现本机 Alembic Dashboard URL / daemon capability contract 不足，或 Dashboard 需要补 release artifact 元数据时，才由总控开下一波定向任务。

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>已完成 | 已移除 Plugin 内嵌 Dashboard artifact 链路：删除 `dashboard/dist` 交付、移除 `vendor/AlembicDashboard` 依赖、调整 build / release / verify / smoke / runtime packaging，并让 `alembic_codex_dashboard` 只 handoff 到本机 Alembic Dashboard。 |
| `Alembic`<br>观察中 | 当前已具备 Dashboard 运行与服务链路；仅当 Plugin 回填证明缺少稳定 handoff contract 时再启动。 |
| `AlembicDashboard`<br>观察中 | 当前不修改前端源码；仅当后续需要正式 Dashboard release asset 契约时再启动。 |
| `AlembicCore`<br>无任务 | Dashboard artifact ownership removal 不涉及 Core API 或共享内核。 |
| `AlembicAgent`<br>无任务 | 不涉及 Agent runtime / AI provider / tool system。 |
| `BiliDili`<br>无任务 | 不涉及真实 iOS 测试项目。 |

### AlembicPlugin 执行要求

- 先读取 `AlembicPlugin/AGENTS.md`、本文档、`package.json`、`.gitmodules`、`scripts/build-dashboard.mjs`、`scripts/prepare-codex-plugin-runtime.mjs`、`scripts/release-codex-plugin.mjs`、`scripts/verify-codex-plugin.mjs`、`scripts/smoke-codex-plugin.mjs`、`bin/daemon-server.ts`、`lib/codex/EnhancementRoute.ts`、`lib/codex/ModuleBoundary.ts`。
- 删除 Plugin-owned Dashboard artifact 链路：
  - 移除 `build:dashboard` 脚本和 `scripts/build-dashboard.mjs`。
  - 移除 `dashboard/dist` 作为 package / runtime / smoke / verify 必需产物。
  - 移除 `vendor/AlembicDashboard` submodule 及 `.gitmodules` 配置。
  - 移除 `scripts/local-source-paths.mjs` 中 Dashboard source resolver，保留 Core resolver。
  - 清理 `dev-watch`、`dev-verify`、release、README、playbook、ModuleBoundary 中“Plugin 构建 Dashboard”的口径。
- 调整 embedded runtime：
  - `prepare-codex-plugin-runtime` 不再要求或复制 `dashboard/dist`。
  - runtime package `files` 不再包含 `dashboard/dist`。
  - `bin/daemon-server.ts` 不再 mount Dashboard 静态资源；embedded plugin runtime 的 health / capability 不得声称 Dashboard available。
- 调整 dashboard handoff：
  - `alembic_codex_dashboard` 在本机 Alembic daemon Dashboard 可用时返回真实 URL。
  - 如果只有 embedded plugin runtime 可用，不得把 `/api-spec` 或 embedded API URL 包装成 Dashboard URL。
  - 如果本机 Alembic 未安装或未提供 Dashboard，返回明确失败状态、缺失能力和下一步建议；其它 non-dashboard Codex tools 不因此失效。
- 保留 Codex plugin 基础能力：diagnostics、status、init、host-agent bootstrap/rescan、candidate submit、Guard、plugin metadata、channel、skills、runtime packaging。
- 如果执行中发现必须修改 `Alembic` 才能提供真实 Dashboard handoff，不要在 `AlembicPlugin` 内临时补 fallback；回填阻塞原因，由总控开启 Alembic 任务。

建议验证命令：

```bash
npm run build:check
npm run lint -- --diagnostic-level=error
npm run lint:repo-boundary
npm run verify:codex-plugin
npm run verify:codex-channel
npm run smoke:codex-plugin
git submodule status
git diff --check
```

建议负向扫描：

```bash
rg -n "build:dashboard|dashboard/dist|vendor/AlembicDashboard|resolveDashboardSource|mountDashboardIfAvailable|ALEMBIC_DAEMON_DASHBOARD_MOUNTED" package.json scripts lib bin plugins channels README.md README_CN.md .gitmodules
```

允许保留的 Dashboard 文案只应指向 URL handoff、Dashboard product owner 或用户可视化工作流；不得保留 Plugin 构建 / 内嵌 / 托管前端产物的代码路径。

文档动作：新建执行记录。

保存位置：`docs/AlembicPlugin/alembic-plugin-dashboard-artifact-removal-2026-05-19.md`。

挂载入口：本文“回填区”和 `docs/workspace/index.md` 当前计划。

回填要求：完成范围、提交 hash、删除列表、保留能力、验证命令、验证结果、负向扫描结果、功能完整性检查、本机 Alembic 不可用时的 dashboard handoff 行为、遗留风险、是否需要 Alembic / AlembicDashboard 下一波。

## 验收重点

总控验收必须检查功能完整性，不能只看 import 或类型通过：

- `AlembicPlugin` package / embedded runtime tarball 不再包含 `dashboard/dist` 和 `vendor/AlembicDashboard`。
- `alembic_codex_dashboard` 不再通过 embedded plugin runtime 托管前端；本机 Alembic 可用时能返回真实 Alembic Dashboard URL。
- 本机 Alembic 不可用时，dashboard handoff 返回可理解的缺失能力和下一步，不能返回假成功。
- Codex plugin 的 diagnostics/status/init/host-agent bootstrap/rescan/Guard/skills/channel/smoke 仍可运行。
- `.gitmodules` 和 gitlink 不再引用 `vendor/AlembicDashboard`。
- release / verify / smoke 不再要求 Plugin 构建 Dashboard。

## 可复制提示词

发送给：无，当前已完成验收。

不发送给：`AlembicPlugin`（已完成）、`Alembic`（观察中）、`AlembicDashboard`（观察中）、`AlembicCore`（无任务）、`AlembicAgent`（无任务）、`BiliDili`（无任务）。

## 回填区

- `AlembicPlugin`：已完成。执行记录见 [../AlembicPlugin/alembic-plugin-dashboard-artifact-removal-2026-05-19.md](../AlembicPlugin/alembic-plugin-dashboard-artifact-removal-2026-05-19.md)。
  - 完成范围：移除 `build:dashboard`、`scripts/build-dashboard.mjs`、`vendor/AlembicDashboard`、Plugin package / runtime / smoke / verify 对 Dashboard dist 的依赖；embedded daemon 不再 mount Dashboard 静态资源；`alembic_codex_dashboard` 无本机 Dashboard daemon 时失败关闭。
  - 提交 hash：AlembicPlugin `6ecd003023434c26c46f02f761a40294b0280812`；AlembicCodex `f46e3e577d4218769f6431930876a467359e14cb`。
  - 验证命令：`npm run build:check`、`npm run lint -- --diagnostic-level=error`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run smoke:codex-plugin`、`npm run smoke:codex-plugin -- --daemon --no-npx-runtime`、`npm run verify:release-package-boundary`、`npm run test:unit`、targeted vitest、`git submodule status`、`git diff --check`、负向扫描。
  - 总控复核命令：`npm run build:check`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run smoke:codex-plugin`、`npm run smoke:codex-plugin -- --daemon --no-npx-runtime`、`npm run verify:release-package-boundary`、`npm run lint:repo-boundary`、`git diff --check`、负向扫描。
  - 总控复核结果：除 `npm run lint:repo-boundary` 命中既有 10 个 DB boundary 违规外，其余验证通过；daemon smoke 初次在沙盒内因 `listen EPERM: operation not permitted 127.0.0.1` 失败，提升权限后通过，显示 `dashboardUrl: null` 且 `dashboardHandoff: "failed-closed"`。
  - 负向扫描剩余命中：禁止项无命中；仅保留 `DashboardOperations` / `dashboard-operation` API helper 命名，不属于前端 dist / 构建 / 内嵌 / 托管链路。
  - 遗留风险：真实 Dashboard URL 成功路径仍依赖 Alembic daemon / Dashboard server 既有能力；本轮未处理既有 DB boundary 债务。
  - 下一步建议：AlembicPlugin 无需继续返工；Alembic / AlembicDashboard 继续观察，仅当后续真实使用证明 handoff contract 或 release asset 契约不足时再开下一波。
- `Alembic`：观察中。本轮未证明缺少本机 Dashboard handoff contract。
- `AlembicDashboard`：观察中。本轮无需 release asset 契约任务。
- `AlembicCore`：无任务。
- `AlembicAgent`：无任务。
- `BiliDili`：无任务。
