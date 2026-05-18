# AlembicDashboard Module Boundary Foundation Wave 1 Frontend Contract

日期：2026-05-18
执行窗口：AlembicDashboard
状态：待验收
来源计划：`docs/workspace/alembic-module-boundary-foundation-wave-1-workspace-plan-2026-05-18.md`

## 完成范围

- 在 `src/types.ts` 新增前端消费的 `RuntimeBoundary` view model，覆盖 project identity、runtime route、daemon capability、file monitor、jobs、internal AI provider config 和可选 host-agent route。
- 在 `src/api.ts` 兼容读取 `/daemon/health` 与 `/modules/project-info`，把后端返回归一化为 `ProjectData.runtimeBoundary`；缺失 `/daemon/health` 时保留 fallback，不阻塞 Dashboard 主数据加载。
- `ProjectData.watcherStatus` 改为来自 `runtimeBoundary.capabilities.fileMonitor.available` 的派生状态，避免前端硬写 file monitor active。
- 在 `Header` 增加运行边界状态胶囊和 tooltip，展示 runtime route、mode、projectId、dataRootSource、file monitor 与 internal AI 可用性；只展示后端能力摘要，不实现 daemon route policy。
- 更新中英文 i18n 文案；`App` 将 `runtimeBoundary` 透传给 Header。
- 本轮未迁移 Dashboard 源码到 Plugin，未接管 ProjectRegistry、WorkspaceResolver、daemon state、file monitor、JobStore 或 internal AI 决策。

## 提交

- AlembicDashboard：`d537a6cdddc3b34b869bd3b7b355d15003b20588` (`Add runtime boundary display`)

## 验证命令与结果

- `npm run build`：通过；Vite 仍提示既有 large chunk warning。
- `git diff --check`：通过。
- `rg -n "runtimeBoundary|RuntimeBoundary|daemon/health|ProjectRegistry|FileChange|WorkspaceResolver|internal AI decision|route policy" src --glob '!**/dist/**'`：通过；命中仅为新增前端 view model、API normalizer、Header 展示和 i18n 文案，未引入后端策略实现或 Registry / WorkspaceResolver 依赖。

## 遗留风险

- `/daemon/health` 当前由 Alembic 提供；如果 Plugin embedded runtime 或旧后端没有该接口，Dashboard 会显示 `unknown` 路线和能力状态，需要下一波由后端补齐 canonical runtime capability contract。
- `hostAgentRoute` 只作为可选字段展示；当前 Alembic daemon health 未提供该字段，需要 AlembicPlugin 或 Core 后续确认是否暴露给 Dashboard。
- 本轮未做浏览器截图或跨仓库大验收，符合 Wave 1 前期开发范围。

## 下一波模块划分建议

- `AlembicCore` 如果补出 canonical runtime / route kind / capability summary 类型，Dashboard 下一波应将 `RuntimeBoundary` 对齐该 public contract。
- `Alembic` 可在 `/daemon/health` 或独立 endpoint 中稳定输出 `dataRootSource`、file monitor status、jobs capability 和 internal AI provider config。
- `AlembicPlugin` 可补充 Dashboard handoff 所需的 `hostAgentRoute` / `enhancementRoute` 字段；Dashboard 继续只展示，不决定 route。
- 前端 artifact 归属建议下一波明确 release asset / build artifact 交付方式，Plugin 只消费 URL 或产物，不维护 Dashboard 源码逻辑。
