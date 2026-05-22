# AlembicPlugin RFR-6C HTTP Compatibility Operations Execution

创建日期：2026-05-22
执行窗口：AlembicPlugin
对应总控计划：`docs/workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md`
状态：已完成，已通过总控验收

## 任务目标

在 `Plugin first, Alembic install enhances` 前提下，处理 AlembicPlugin 内部 HTTP `DashboardOperations` compatibility 命名歧义。目标不是删除 `dashboard.*` 外部协议，也不是接入 Dashboard 前端，而是在保持 HTTP route、operation payload、runtime artifact 路径、Codex MCP tool schema、Skill contract 和 channel/cache 行为不变的前提下，把源码路径和内部命名收敛到更准确的 compatibility / operations 边界。

## 调用链复核

- `lib/http/routes/commands.ts` 通过旧 `dashboard.update_module_map` 和 `dashboard.rebuild_semantic_index` operation id 承接 `/api/v1/commands/spm-map` 与 `/api/v1/commands/embed` 兼容路由。
- `lib/http/routes/modules.ts` 通过旧 `dashboard.scan_project`、`dashboard.update_module_map`、`dashboard.bootstrap_project`、`dashboard.cancel_bootstrap`、`dashboard.rescan_project` operation id 承接 `/api/v1/modules/*` 兼容路由。
- 原 `lib/http/utils/dashboard-operation.ts` 只是 HTTP tool envelope adapter：动态加载 operation handlers，补 actor/session/surface 上下文，然后复用既有 `sendToolEnvelopeResponse` 结构。
- 原 `lib/http/dashboard/DashboardOperations.ts` 实际执行 Plugin embedded runtime / portable compatibility 的 moduleService、indexingPipeline / vectorService、bootstrapTaskManager、DaemonJobRunner 和 JobStore 相关能力；未发现直接引用 `AlembicDashboard` 前端源码。
- 相关验证入口是新增 `test/unit/DashboardCompatibilityOperations.test.ts`、既有 `test/unit/CodexModuleBoundary.test.ts`、`test/unit/CodexMcpServer.test.ts`、`test/unit/CodexSessionScenarioRunner.test.ts`、build、runtime prepare、plugin verify 和 channel verify。

## 旧功能分类

| Cluster | 分类 | 真实消费方 | 判断 |
| --- | --- | --- | --- |
| `dashboard.*` operation id | portable HTTP compatibility | `commands` / `modules` HTTP routes、runtime artifact、兼容调用方 | 这些 id 是外部兼容协议，必须保留；不表示 Plugin 重新拥有 Dashboard 前端。 |
| operation handlers | Plugin embedded HTTP compatibility + Codex 自洽闭环的本地能力入口 | moduleService、indexingPipeline / vectorService、bootstrapTaskManager、DaemonJobRunner | 负责无 Alembic resident service 时的 portable runtime 行为，以及已有 HTTP 路由的本地执行闭环；不是可删旧残留。 |
| operation envelope adapter | portable HTTP compatibility | Express routes、`HttpToolResultEnvelope` | 只做 HTTP 兼容路由到 operation handler 的 envelope 转译，不经过 Codex MCP tool schema，也不新增 Alembic service bridge。 |

本轮没有发现应删除的旧残留，也没有发现需要改写为 Alembic resident service request client 的内容。后续如果要继续收敛 HTTP/service/injection/daemon，需要另开更窄波次。

## 完成范围

- 将 `lib/http/dashboard/DashboardOperations.ts` 迁移为 `lib/http/compatibility/operations/DashboardCompatibilityOperations.ts`。
- 将 `lib/http/utils/dashboard-operation.ts` 迁移为 `lib/http/compatibility/operations/dashboard-compatibility-operation.ts`。
- 将内部导出名收敛为 `DASHBOARD_COMPATIBILITY_OPERATION_IDS`、`DASHBOARD_COMPATIBILITY_OPERATION_MANIFESTS`、`DASHBOARD_COMPATIBILITY_OPERATION_HANDLERS`、`executeDashboardCompatibilityOperation` 和 `sendDashboardCompatibilityOperationResponse`。
- 保留所有外部 `dashboard.*` operation id、manifest payload、HTTP response payload、route path、Codex MCP tool schema、Skill contract、channel metadata 和 runtime artifact 外部路径。
- 新增 `test/unit/DashboardCompatibilityOperations.test.ts`，验证外部 operation id 稳定、handler/manifest 对齐和 HTTP tool envelope 行为不变。
- 重新生成 Codex plugin runtime artifact，runtime 中同步为 `dist/lib/http/compatibility/operations/**`。

未移动 `lib/http/` 整体，未重构所有 routes，未修改 `ResidentSearchClient`、`PrimeSearchPipeline`、`EnhancementRoute`、`ServiceRequestBoundary`、`CodexMcpServer`、daemon supervisor、Dashboard HelpView / i18n、Core exports 或 Alembic DB boundary lint。

## 提交与产物

- AlembicPlugin 提交：`a535d16e6974fdcba2b643b64dc24c8315c9b51e`
- AlembicCodex runtime artifact 子仓库提交：`85c8fbdc2a94d86a4f721301c42a3fe618c4da76`
- `plugins/alembic-codex/runtime.tgz` SHA-256：`c151d06691c4b631d5b1d249140ca2989300a7c16c935256589e12f4f3513835`

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` | 通过；Core build 使用 `../AlembicCore @ f30beacedf89abab13b91e87e4686d0db38e7d29`，TypeScript no-emit 检查通过。 |
| `npm run test:unit -- test/unit/DashboardCompatibilityOperations.test.ts test/unit/CodexModuleBoundary.test.ts` | 通过；2 个文件、5 个测试通过。 |
| `npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts` | 通过；2 个文件、40 个测试通过。 |
| `npm run build` | 通过；重新生成 Plugin `dist`。 |
| `npm run prepare:codex-plugin-runtime` | 通过；刷新 `plugins/alembic-codex/runtime` 和 `runtime.tgz`。 |
| `npm run verify:codex-plugin` | 通过；`./runtime.tgz -> alembic-ai@0.2.0`。 |
| `npm run verify:codex-channel` | 通过；`alembic-ai@0.2.0`。 |
| `rg -n "http/dashboard\|DashboardOperations\|DASHBOARD_OPERATION\|from '../dashboard\|from '../../dashboard\|../utils/dashboard-operation\|executeDashboardOperation\|sendDashboardOperationResponse" lib test bin scripts package.json tsconfig*.json vitest*.config.* plugins/alembic-codex/runtime/dist` | 通过；无命中。 |
| `rg -n "DashboardCompatibility\|dashboard-compatibility\|DASHBOARD_COMPATIBILITY\|dashboard\\." lib test plugins/alembic-codex/runtime/dist` | 通过；命中均为新 compatibility/operations 路径、保留的外部 `dashboard.*` operation id 或既有 Dashboard URL handoff 语义。 |
| `git diff --check` | 通过。 |
| `git -C plugins/alembic-codex diff --check` | 通过。 |

## 残留风险

- `dashboard.*` 字符串仍然保留，这是外部 HTTP compatibility operation id，不是源码边界残留；后续删除必须先证明没有真实消费方并回到总控确认。
- HTTP route 注释中仍可见 Dashboard 语义，当前判断属于兼容路由 / 历史协议描述，不在本轮改文案范围内。
- 本轮没有刷新本机 Codex plugin cache；如要让本机 Codex 立即消费新 runtime artifact，需要另行运行 cache sync / local-mcp refresh。
- 本轮没有创建 AlembicTest 真实项目复测单；当前变化由 Plugin 内部 build、targeted unit、runtime prepare、plugin verify 和 channel verify 覆盖。

## 下一步建议

- 总控先验收 AlembicPlugin 提交、AlembicCodex runtime artifact、残留扫描和验证结果。
- 下一轮若继续处理拆仓残留，建议从 `lib/service` 或 `lib/injection` 中再选一个真实小 cluster 分类，不要大面积迁移 HTTP/service/injection/daemon。
- 如果后续要同步 Dashboard HelpView / i18n 对 MCP surface 的旧口径，应单独派发 `AlembicDashboard` / `AlembicPlugin` 文案契约波次，不与 runtime compatibility operation 混在一起。

## 总控验收

2026-05-22：总控复核通过。复核范围包括 AlembicPlugin 提交 `a535d16e6974fdcba2b643b64dc24c8315c9b51e`、AlembicCodex runtime artifact `85c8fbdc2a94d86a4f721301c42a3fe618c4da76`、旧 `http/dashboard` / `DashboardOperations` / `dashboard-operation` import 负向扫描、new compatibility operation 正向扫描、runtime artifact 子仓库状态和提交 diff check。

功能完整性检查：外部 `dashboard.*` operation id、HTTP route、operation payload、runtime artifact 路径、Codex MCP tool schema 和 channel/cache 行为保持不变；源码路径已收敛到 `lib/http/compatibility/operations/`。残留的 `kind: 'dashboard-operation'` 属于 fallback manifest payload 兼容语义，不是源码目录边界残留。RFR-6C 验收通过，后续进入 RFR-6D。
