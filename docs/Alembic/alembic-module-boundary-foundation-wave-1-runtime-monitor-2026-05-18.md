# Alembic Module Boundary Foundation Wave 1 Runtime Monitor

日期：2026-05-18
窗口：Alembic
状态：待验收
总控计划：[`docs/workspace/alembic-module-boundary-foundation-wave-1-workspace-plan-2026-05-18.md`](../workspace/alembic-module-boundary-foundation-wave-1-workspace-plan-2026-05-18.md)

## 完成范围

- 新增 `lib/daemon/RuntimeBoundary.ts`，集中声明 Alembic 本地主运行模型边界：
  - `route = local-alembic`
  - workspace contract 来自 `@alembic/core/workspace`
  - daemon state contract 来自 `@alembic/core/daemon`
  - Dashboard server 归 Alembic，前端产品归 `AlembicDashboard`
  - long-lived file monitor 归 `alembic-daemon`
  - daemon jobs / JobStore 归 Alembic
  - internal AI runtime 归 `alembic-internal-ai` + `AlembicAgent`
- `lib/http/routes/daemon.ts` 的 daemon health `capabilities` 增加 `runtimeBoundary`，让 Plugin / Dashboard 后续可以消费同一份本地 runtime / capability 边界。
- `lib/http/routes/file-changes.ts` 复用 `RuntimeBoundary` 中的 canonical file-change event source 常量，避免 `/file-changes` 与 daemon capability 各自维护 source 列表。
- 扩展 `test/unit/DaemonCapabilities.test.ts`，覆盖 runtime boundary、file monitor owner、JobStore owner、Dashboard handoff、internal AI owner。

## 边界判定

- `ProjectRegistry`、`WorkspaceResolver` 仍作为多项目 / dataRoot / projectId 的统一入口，由 Core public workspace contract 提供，Alembic 主仓库负责消费和运行。
- daemon state、daemon health、Dashboard server、HTTP API、JobStore、internal AI jobs 仍归 Alembic 主仓库。
- `DaemonFileChangeCollector` + `FileChangeDispatcher` + `FileChangeHandler` + HTTP `/api/v1/file-changes` 共同构成 Alembic daemon 长期 file monitor 主实现。
- Plugin 后续只应消费 `enhancement` / `capabilities.runtimeBoundary` 做 route choice 和 Dashboard URL handoff，不复制 ProjectRegistry、daemon state、JobStore、file monitor 或 internal AI runtime。

## 提交

- Alembic 提交 hash：`6b601b43a5b3a31a2f1af2687e4824500504a28a`
- 提交标题：`feat: expose runtime boundary capabilities`

## 验证命令与结果

- `npm run build:check`
  - 通过；使用本地 `../AlembicCore` 构建 Core 后完成 Alembic TypeScript no-emit 检查。
- `npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts`
  - 通过；2 个测试文件、5 个测试通过。
- `npm run lint:consumer-core-imports`
  - 通过；扫描 416 个文件、560 个 `@alembic/core` imports。
- `npx biome check --diagnostic-level=error lib/daemon/RuntimeBoundary.ts lib/http/routes/daemon.ts lib/http/routes/file-changes.ts test/unit/DaemonCapabilities.test.ts`
  - 通过。
- `git diff --check`
  - 通过。
- `git diff --check HEAD~1..HEAD`
  - 通过。

## 遗留风险

- `runtimeBoundary` 是 Alembic 本地主仓库 capability adapter，不替代 Core 后续可能补充的 canonical runtime / capability public contract；若 Core 本波补出统一类型，下一波应对齐类型名称和字段。
- 本波没有重构 `DaemonSupervisor` 生命周期实现，也没有拆 Plugin embedded runtime；只为下游 route choice 和 Dashboard 展示提供稳定边界摘要。

## 下一波模块划分建议

- `AlembicPlugin` route resolver 优先消费 daemon health 的 `enhancement.route` 与 `capabilities.runtimeBoundary`，保留 embedded runtime 作为 adapter fallback。
- `AlembicDashboard` API types 可增加 runtime boundary 兼容类型，展示 project identity、file monitor owner、internal AI config 和 Dashboard handoff，不实现后端策略。
- 若 `AlembicCore` 输出 canonical `RuntimeCapability` / `FileMonitorCapability` / `RouteKind`，Alembic 下一波将 `RuntimeBoundary` 对齐到 Core public type。
