# RFR-6D Batch Cleanup Analysis

创建日期：2026-05-22
状态：待用户确认
关联计划：[repository-folder-boundary-restructure-workspace-plan-2026-05-22.md](repository-folder-boundary-restructure-workspace-plan-2026-05-22.md)

## 用户修正

用户指出：Dashboard 已不再接入 `AlembicPlugin`，因此 Plugin 内部继续保留 Dashboard HTTP operation 兼容层没有长期价值；同时 AlembicPlugin 每次小改都需要重建 runtime artifact 和验证插件链路，后续应把多个低风险、同边界的清理任务合并成一波执行。

总控修正判断：RFR-6C 只能算“证明并收紧了旧兼容层的真实位置”，不能算长期收口。既然 Dashboard 的真实 HTTP 消费方已经回到 `Alembic` 主仓库，Plugin 中的 `dashboard.*` operation layer 应进入删除候选，而不是继续作为 portable compatibility 保留。

## 真实代码证据

### Dashboard 真实消费方在 Alembic 主仓库

跨仓扫描命中：

- `AlembicDashboard/src/api.ts` 仍调用 `/modules/scan-project`、`/modules/bootstrap`、`/modules/bootstrap/status`、`/modules/bootstrap/cancel`、`/modules/rescan`、`/modules/update-map` 和 `/commands/spm-map`。
- `Alembic/lib/http/routes/modules.ts` 与 `Alembic/lib/http/routes/commands.ts` 提供这些 Dashboard API。
- `Alembic/lib/tools/adapters/DashboardOperations.ts` 仍定义 `dashboard.update_module_map`、`dashboard.rebuild_semantic_index`、`dashboard.scan_project`、`dashboard.bootstrap_project`、`dashboard.cancel_bootstrap`、`dashboard.rescan_project`。

这说明 Dashboard API 的真实闭环应由 `AlembicDashboard` 消费 `Alembic` daemon/API，不应由 `AlembicPlugin` 继续维持旧 Dashboard operation 兼容层。

### Plugin 中的旧兼容层只剩自引用

当前 `AlembicPlugin` 命中：

- `lib/http/compatibility/operations/DashboardCompatibilityOperations.ts` 定义旧 `dashboard.*` operation ids 和 handlers。
- `lib/http/compatibility/operations/dashboard-compatibility-operation.ts` 将旧 operation 包装成 HTTP tool envelope。
- `lib/http/routes/commands.ts` 的 `/commands/spm-map`、`/commands/embed` 通过该 compatibility operation 分派。
- `lib/http/routes/modules.ts` 的 `/modules/scan-project`、`/modules/update-map`、`/modules/bootstrap`、`/modules/bootstrap/cancel`、`/modules/rescan` 通过该 compatibility operation 分派。
- `test/unit/DashboardCompatibilityOperations.test.ts` 只是在证明旧兼容 operation id 稳定。

除 Plugin 自身 route adapter 和测试外，未发现 Plugin 内部 Codex MCP、Skill、channel 或 runtime cache 链路需要消费 `dashboard.*` operation id。

### 需要保留的 Dashboard 语义不同

以下不是 Dashboard 接入 Plugin，也不属于本波删除对象：

- `alembic_codex_dashboard` MCP tool：这是 Codex host agent 请求本地 `Alembic` daemon 返回 Dashboard URL 的 handoff。
- `lib/codex/EnhancementRoute.ts`、`lib/codex/ModuleBoundary.ts` 中的 dashboard capability / handoff 文案：它们表达的是 Plugin 不打包 Dashboard 前端，只在本地 Alembic daemon 可用时交出 URL。
- `dashboardUrl`、`dashboardAvailable`、`dashboard-url-handoff-only` 等状态字段：属于本地增强底座可见性，不是 Dashboard 前端反向接入 Plugin。

## RFR-6D 合并批处理建议

为减少 AlembicPlugin 每次小改都重建 runtime artifact 的成本，下一波不再只做 `AgentModule.ts` 两三行命名修正，而是合并为一个 Plugin 边界清理批次：

1. 删除 Plugin 旧 Dashboard HTTP compatibility operation layer。
2. 分类并清理受影响 route：没有真实 Plugin 消费方的 Dashboard 兼容端点应删除；若执行窗口发现某端点仍有 Plugin 自有消费方，必须改成非 Dashboard 命名的直接实现并写明消费方。
3. 删除只服务旧兼容层的 `DashboardCompatibilityOperations` 单测，并补充或调整 route / boundary 测试，证明 Plugin 不再暴露 `dashboard.*` operation id。
4. 将 `lib/injection/modules/AgentModule.ts` 收敛为 `SkillHooksModule.ts` 或等价 SkillHooks 语义模块，保留 `skillHooks` service key 和 Skill lifecycle 行为。
5. 一次性重建 Codex runtime artifact、校验 plugin/channel，避免重复打包。

## 删除候选

- `AlembicPlugin/lib/http/compatibility/operations/DashboardCompatibilityOperations.ts`
- `AlembicPlugin/lib/http/compatibility/operations/dashboard-compatibility-operation.ts`
- `AlembicPlugin/test/unit/DashboardCompatibilityOperations.test.ts`
- `AlembicPlugin` runtime artifact 中对应 `dist/lib/http/compatibility/operations/*`
- `AlembicPlugin/lib/http/routes/commands.ts` 中仅服务旧 Dashboard 兼容的 `/spm-map`、`/embed` 分派。
- `AlembicPlugin/lib/http/routes/modules.ts` 中仅通过 `dashboard.*` operation 分派的兼容端点。

删除条件：执行窗口必须先做 import / string / route consumer 扫描，确认没有 Codex MCP、Skill、channel、plugin verify、smoke 或 runtime cache 真实消费方；若发现真实消费方，不能删除，只能改名为 Plugin 自有语义并回填证据。

## 保留对象

- `alembic_codex_dashboard` MCP tool 和相关 policy / tests。
- `CodexEnhancementRoute` / `CodexModuleBoundary` 中表达 Dashboard URL handoff 的状态字段。
- `Alembic` 主仓库 Dashboard API、`AlembicDashboard` 前端 API client 和二者之间的真实 Dashboard 闭环。
- Plugin 的 Codex MCP、Skill、prime/search/Guard、resident service request、runtime/channel/cache 交付链路。

## 待用户确认

如果用户确认，RFR-6D 将从“只改 AgentModule 命名”改为“Plugin 旧 Dashboard compatibility 删除 + SkillHooks module 命名收敛”的合并批处理，并只在该批处理完成后进行一次 runtime artifact 重建与插件验证。

确认后发送窗口：`AlembicPlugin`。
