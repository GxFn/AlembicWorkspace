# AlembicPlugin Dashboard Artifact Removal Execution Record

更新日期：2026-05-19
执行窗口：AlembicPlugin
状态：已完成

## 完成范围

- 移除 AlembicPlugin 自有 Dashboard 前端 artifact 链路：删除 `build:dashboard`、`scripts/build-dashboard.mjs`、`vendor/AlembicDashboard` submodule 和 root `dashboard` 产物目录。
- 调整 Codex plugin runtime 打包：`prepare-codex-plugin-runtime`、release、verify、smoke 和 runtime package 不再要求或复制 Dashboard dist。
- 调整 embedded daemon：不再 mount Dashboard 静态资源，runtime state / health 不再声称 embedded Dashboard available。
- 调整 `alembic_codex_dashboard`：只在本机 Alembic daemon 明确提供 Dashboard URL 时成功；无本地 Dashboard daemon 时返回明确失败、缺失能力和下一步，不启动 embedded runtime，也不把 API URL 伪装成 Dashboard URL。
- 清理 README、Codex plugin README、release playbook、skill 和 CI / release workflow 中 Plugin 构建 / 内嵌 Dashboard 的口径。
- 刷新并提交 `plugins/alembic-codex` runtime artifact，runtime tarball 已移除 Dashboard frontend dist。

## 提交 Hash

- AlembicPlugin：`6ecd003023434c26c46f02f761a40294b0280812` (`chore: remove plugin dashboard artifacts`)
- AlembicCodex：`f46e3e577d4218769f6431930876a467359e14cb` (`chore: remove embedded dashboard artifact`)

## 删除列表

- `scripts/build-dashboard.mjs`
- `build:dashboard` package script
- `dashboard/dist` package / runtime / smoke / verify 必需产物
- `.gitmodules` 中的 `vendor/AlembicDashboard`
- `vendor/AlembicDashboard` gitlink
- `plugins/alembic-codex/runtime/dashboard/dist/**`
- embedded daemon Dashboard static mount path and env marker

## 保留能力

- Codex MCP server、tools、skills、channel 和 plugin metadata。
- diagnostics、status、init、host-agent bootstrap/rescan、candidate submit、Guard、release 和 portable runtime packaging。
- `@alembic/core: file:vendor/AlembicCore` 与 `.alembic-source.json` portable runtime 例外。
- Dashboard URL handoff 能力：来源限定为本机 Alembic daemon 的真实 Dashboard URL。

## 验证命令与结果

- `npm run build:check`：通过。
- `npm run lint -- --diagnostic-level=error`：通过。
- `npm run verify:codex-plugin`：通过。
- `npm run verify:codex-channel`：通过。
- `npm run smoke:codex-plugin`：通过，default smoke 中 daemon / dashboard handoff 跳过。
- `npm run smoke:codex-plugin -- --daemon --no-npx-runtime`：通过；daemon ready，`dashboardUrl: null`，`dashboardHandoff: "failed-closed"`。
- `npm run verify:release-package-boundary`：通过；root npm registry publish disabled，Codex plugin artifact release enabled，embedded runtime Core dependency 保持 `file:vendor/AlembicCore`。
- `npm run test:unit`：通过，95 files / 1475 tests。
- `npx vitest run --config vitest.unit.config.ts test/unit/CodexMcpServer.test.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexModuleBoundary.test.ts test/unit/CodexStatusService.test.ts test/unit/folder-names.test.ts`：通过，5 files / 48 tests。
- `git diff --check` 与 `git diff --cached --check`：通过。
- `git submodule status`：仅保留 `plugins/alembic-codex`、`skills/progressive-chain-validation`、`vendor/AlembicCore`；不再有 `vendor/AlembicDashboard`。
- `npm run lint:repo-boundary`：未通过，命中既有 DB boundary 债务，不属于本轮 Dashboard artifact 删除范围。

## 负向扫描结果

- `rg -n "build:dashboard|dashboard/dist|vendor/AlembicDashboard|resolveDashboardSource|mountDashboardIfAvailable|ALEMBIC_DAEMON_DASHBOARD_MOUNTED" package.json scripts lib bin plugins channels README.md README_CN.md .gitmodules .github test`：无命中。
- `rg --files | rg "dashboard/dist|build-dashboard|vendor/AlembicDashboard|runtime/dashboard"`：无命中。
- `find plugins/alembic-codex/runtime -path '*dashboard/dist*' -print`：无输出。
- `tar -tzf plugins/alembic-codex/runtime.tgz | rg "dashboard/dist|vendor/AlembicDashboard|build-dashboard"`：无命中。
- 仍存在 `lib/http/dashboard/DashboardOperations` 与 `dashboard-operation` API helper 命名；这些是 HTTP API 操作 helper，不是前端 dist、构建、内嵌或托管链路。

## 功能完整性检查

- 输入：Codex 调用 `alembic_codex_dashboard`。
- 真实数据来源：本机 Alembic daemon capability / state 中的 Dashboard URL。
- 成功路径：只有 route 选中 `local-alembic-daemon`，daemon ready，并且存在 Dashboard URL 时返回成功。
- 失败路径：没有本机 Dashboard daemon 或只有 embedded plugin runtime 时返回 `CODEX_DASHBOARD_HANDOFF_UNAVAILABLE`，不返回假 URL，不启动 embedded runtime。
- 消费方：Codex MCP tool 仍可被 plugin runtime 调用；其它 Codex tools 通过 embedded daemon / local bridge 继续工作。
- 状态变化：embedded runtime 不再写入 Dashboard mounted 状态；runtime package 不再携带 Dashboard frontend dist。

## 遗留风险

- `npm run lint:repo-boundary` 仍有 10 个既有 DB boundary 违规，位置包括 `lib/codex/KnowledgeState.ts`、`lib/http/routes/daemon.ts`、`lib/service/cleanup/CleanupService.ts`、`lib/service/signal/HitRecorder.ts`、`bin/daemon-server.ts`。本轮未扩大或修复该债务。
- 本轮验证了“无本地 Dashboard daemon 时失败关闭”；真实返回可打开 Dashboard URL 的完整 E2E 仍依赖 Alembic daemon / Dashboard server 当前实现，由 Alembic 侧既有链路提供。

## 下一步建议

- AlembicPlugin 本轮已完成，无需继续启动 Plugin 返工。
- Alembic 暂不需要下一波，除非总控验收发现本机 Dashboard URL capability contract 不稳定。
- AlembicDashboard 暂不需要下一波，除非后续产品发布需要正式 Dashboard release asset 契约。

## 总控验收

- 验收结论：通过。
- 总控复核命令：`npm run build:check`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run smoke:codex-plugin`、`npm run smoke:codex-plugin -- --daemon --no-npx-runtime`、`npm run verify:release-package-boundary`、`npm run lint:repo-boundary`、`git diff --check`、负向扫描。
- 复核结果：除 `npm run lint:repo-boundary` 命中既有 10 个 DB boundary 违规外，其余验证通过；daemon smoke 初次在沙盒内因本地端口监听权限失败，提升权限后通过，确认 `dashboardUrl: null` 与 `dashboardHandoff: "failed-closed"`。
- 功能完整性：通过。Plugin 不再构建 / 打包 / 托管 Dashboard 前端，Dashboard handoff 不返回假成功，Codex plugin 基础 smoke 和 release package boundary 仍可运行。
