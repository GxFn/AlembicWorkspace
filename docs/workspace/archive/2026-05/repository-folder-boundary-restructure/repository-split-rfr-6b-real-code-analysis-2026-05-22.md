# Repository Split RFR-6B Real Code Analysis

创建日期：2026-05-22
总控窗口：AlembicWorkspace
状态：已完成，建议启动 RFR-6C
上游计划：[repository-folder-boundary-restructure-workspace-plan-2026-05-22.md](repository-folder-boundary-restructure-workspace-plan-2026-05-22.md)

## 结论

RFR-6A 可以通过总控验收。`AlembicPlugin` 本轮没有把 Plugin 做成空壳 client，也没有误删 portable compatibility，而是将仍属于 Codex host agent 自洽闭环的 governance 能力从旧 `lib/core` / `#core/*` 命名中收敛出来。

下一轮不建议直接做 package 身份拆分、Dashboard 文案修正或大面积 `http/service/injection/daemon` 搬迁。基于当前真实代码，最适合继续小步真实修正的是 `AlembicPlugin` 的 HTTP `DashboardOperations` 命名歧义：它当前提供的是 Plugin 内嵌 HTTP compatibility operation，而不是 Dashboard 前端实现或直接 Dashboard 依赖。应优先把这个边界命名收紧，同时保留外部 `dashboard.*` operation id 的兼容语义。

## RFR-6A 验收证据

- `AlembicPlugin` 提交：`cef5e419440064c056d6b3408cd961fac5047b7a`。
- Codex runtime artifact 子仓库提交：`c6e194d9941d0b5ce7f85b03cfe7fa2adc6c9ed9`。
- `runtime.tgz` SHA-256：`dc40f72a9d581b0d913104d4b150c3b54d191a2c5067bd71ab5cac1e36db9c76`。
- 执行记录：[../AlembicPlugin/repository-folder-boundary-rfr-6-plugin-governance-2026-05-22.md](../../../../AlembicPlugin/repository-folder-boundary-rfr-6-plugin-governance-2026-05-22.md)。
- 提交 diff 只将 `lib/core/{constitution,gateway,permission}` 迁入 `lib/governance/{constitution,gateway,permission}`，同步 `#governance/*` alias、bootstrap、HTTP、MCP embedded server、DI、targeted tests、Vitest alias、AGENTS 和 runtime artifact。
- `rg -n "#core|lib/core|\\.\\./core|\\.\\./\\.\\./core" AlembicPlugin/lib AlembicPlugin/test AlembicPlugin/bin AlembicPlugin/scripts AlembicPlugin/package.json AlembicPlugin/tsconfig.json AlembicPlugin/vitest.config.ts AlembicPlugin/vitest.unit.config.ts AlembicPlugin/AGENTS.md` 无命中。
- `git -C AlembicPlugin diff --check HEAD^ HEAD` 通过。
- `git -C AlembicPlugin/plugins/alembic-codex status --short --branch` 显示 runtime artifact 子仓库干净。

功能完整性判断：RFR-6A 覆盖了真实入口、真实消费方、package import map、runtime artifact 和 targeted tests；未触碰 HTTP/service/injection/daemon/external MCP/codex/plugin shell/channel/vendor/runtime artifact 所在路径，因此满足本轮完成定义。

## RFR-6B 扫描证据

RFR-6A 之后，`Alembic` 与 `AlembicPlugin` 的 `lib` 相同相对路径对比仍显示大量兼容层和旧拆仓相似结构：

| 顶层目录 | common | same | diff | 判断 |
| --- | ---: | ---: | ---: | --- |
| `governance` | 5 | 4 | 1 | RFR-6A 已收敛命名，剩余差异是 Plugin / Alembic 语境差异。 |
| `http` | 38 | 22 | 16 | Plugin 内嵌 HTTP compatibility 与 Alembic daemon HTTP 仍共享很多命名，需要逐块分类。 |
| `service` | 19 | 4 | 15 | 同时包含 Plugin baseline search / resident search client / task enrichment，不能整体搬迁。 |
| `injection` | 10 | 0 | 10 | Plugin DI 仍是真实 runtime wiring，需按消费方分类。 |
| `daemon` | 2 | 0 | 2 | Plugin 侧 daemon supervisor 是 embedded runtime 管理，不能等同 Alembic daemon 主实现。 |
| `external` | 19 | 10 | 9 | MCP surface 已分叉，继续按 Codex-facing ownership 判断。 |

真实代码显示 Alembic service request 能力已经存在明确路径，而不是缺一层“桥”：

- `lib/codex/ServiceRequestBoundary.ts`：声明 Codex-facing MCP tools 是 Plugin-owned，Alembic 增强通过显式 resident API 请求，不恢复旧 daemon MCP bridge。
- `lib/service/search/ResidentSearchClient.ts`：请求 Alembic resident `/api/v1/search`，承载真实 vector / semantic enhancement。
- `lib/service/task/PrimeSearchPipeline.ts`：baseline search 与 resident semantic search 组合，resident 不可用时回到 Plugin baseline。
- `lib/codex/EnhancementRoute.ts`、`lib/codex/status/StatusService.ts`、`lib/codex/diagnostics/Diagnostics.ts`：表达当前使用 local runtime、external daemon、unavailable 等增强路径。
- `lib/external/mcp/CodexMcpServer.ts` 和 `lib/external/mcp/handlers/search.ts`：Codex MCP 入口消费 service request / resident search metadata。

因此下一轮不应新造抽象桥，也不应把 Plugin 变成只会请求 Alembic 的 thin client。

## 下一轮建议

RFR-6C 建议只派发 `AlembicPlugin`，目标是处理 HTTP `DashboardOperations` compatibility 命名歧义：

- 当前证据：
  - `lib/http/dashboard/DashboardOperations.ts` 定义 `dashboard.update_module_map`、`dashboard.rebuild_semantic_index`、`dashboard.scan_project`、`dashboard.bootstrap_project`、`dashboard.cancel_bootstrap`、`dashboard.rescan_project` 等 operation id。
  - `lib/http/routes/commands.ts` 和 `lib/http/routes/modules.ts` 消费这些 operation id。
  - `lib/http/utils/dashboard-operation.ts` 动态加载 `../dashboard/DashboardOperations.js`，并用 `kind: 'dashboard-operation'` 作为 compatibility manifest。
  - 这些文件不等于 Dashboard 前端，也不意味着 Plugin 直接打包 `AlembicDashboard`；它们更像保留给 embedded runtime / HTTP compatibility 的 operation dispatcher。
- 修正目标：
  - 先分类该 cluster 是 Plugin portable HTTP compatibility、Alembic service request client、Plugin Codex 自洽闭环，还是旧残留。
  - 在不改变 HTTP routes、external `dashboard.*` operation id、runtime artifact、channel/cache 和 Codex MCP 行为的前提下，将文件路径 / 内部命名收敛为更准确的 compatibility / operations 边界。
  - 如果执行窗口发现 `dashboard.*` operation id 仍有外部消费方，必须保留 operation id，只修正源码目录和内部命名歧义。
- 不做内容：
  - 不移动 `lib/http` 整体。
  - 不重写 resident search / PrimeSearchPipeline。
  - 不处理 `alembic-ai` package 身份。
  - 不更新 Dashboard HelpView / i18n 文案。
  - 不创建 Alembic service bridge。

RFR-6C 完成后，再收集真实 diff，继续判断 `service` / `injection` / `daemon` 哪一块适合下一轮小修。
