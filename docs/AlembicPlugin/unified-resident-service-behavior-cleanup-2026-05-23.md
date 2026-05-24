# AlembicPlugin Unified Resident Service Behavior Cleanup 回填

状态：已完成，总控验收通过
窗口：AlembicPlugin
任务包：`URS-P4-Behavior-Cleanup`
完成时间：2026-05-23 23:15 CST
总控验收时间：2026-05-23 23:20 CST

## 窗口定位

当前窗口定位为 `AlembicPlugin` 执行窗口。本轮仓库职责是 Plugin 行为收敛与残留清理：收紧 legacy capability / `runtimeBoundary` 兼容读取、diagnostics / onboarding / tool description 文案和 embedded host-agent recoverable job 表达。

明确不承担：不改 Alembic producer，不改 AlembicCore contract，不做 ProjectRuntimeControl，不读取项目列表，不消费 `/api/v1/projects/*`，不恢复 `/api/v1/mcp/call` 或 daemon MCP bridge，不启动 AlembicTest 真实项目验证，不操作 BiliDili。

## 完成范围

- `EnhancementRoute` 改为 `residentService` canonical capability 优先；旧 `summarizeAlembicRuntimeCapabilities` / `runtimeBoundary` 只补空缺。
- `EnhancementRoute` 增加 `compatibility.runtimeBoundary` 结构化说明，记录保留状态、真实消费方、保留理由和删除条件。
- `HostProjectAlignment` 优先使用 local Alembic `residentService.serviceScope` 做只读 handoff 对齐判断；`runtimeBoundary` 只作为旧 health payload fallback。
- `ModuleBoundary` 增加 resident service owner / route / scope 以及 runtimeBoundary compatibility consumer / deletion condition 展示，并明确 Plugin 不接 Alembic projects API。
- `StatusService` onboarding notes 将 local Alembic resident service route 与 embedded Plugin host-agent recovery route 分开表达，不再把 embedded Plugin runtime 叫 Alembic resident enhancement。
- `Diagnostics` 增加 resident service contract check 和 `residentServiceBoundary` 摘要；offline fallback 文案改为 Plugin runtime / host-agent recovery。
- `ToolPolicy` 收紧 `alembic_codex_bootstrap/rescan/job` 描述，区分 local Alembic internal AI workflow 与 embedded Plugin host-agent recovery。
- `bin/daemon-server.ts` shutdown hook label 从 `daemon-jobs` 改为 `recoverable-job-cleanup`，shutdown reason 改为 resident / embedded runtime 中性表达。
- 单测更新覆盖 `residentService` 覆盖 legacy capability / runtimeBoundary、ModuleBoundary runtime contract 展示和 MCP job 描述。
- `plugins/alembic-codex` runtime dist 与 `runtime.tgz` 已刷新。

## 提交

- AlembicPlugin commit：`139a7edfde8149aba7c6a89c00066928b0cb9a40` (`feat: converge resident service behavior boundary`)
- AlembicCodex runtime artifact commit：`e423599cba18d2f18285d23600e3fb7db981545b` (`chore: refresh resident behavior cleanup runtime`)
- `plugins/alembic-codex/runtime.tgz` sha256：`ea8a805a6fe1cac55498e47ede100debdc8883f54eecd233106c83ca7b23623f`

## 删除 / 保留项

已删除 / 改名：

- `daemon-server` shutdown hook label `daemon-jobs` 已改为 `recoverable-job-cleanup`。
- 可见文案中的 `Local Alembic enhancement route` 已改为 local resident service / embedded Plugin recovery 分支表达。
- runtime artifact 内旧 `daemon-jobs`、旧 job/tool 描述和旧 diagnostics 文案已刷新消除。

继续保留：

- `runtimeBoundary` 兼容读取继续保留，但只作为旧 daemon health producer fallback 和 diagnostics 展示。
- 真实消费方：`EnhancementRoute` capability fallback、`HostProjectAlignment` legacy project fallback、`ModuleBoundary` diagnostics。
- 保留理由：旧 bundled / external daemon health payload 可能尚未提供 `data.residentService`；删除会破坏旧 health producer 的 status / dashboard handoff 降级解释。
- 删除条件：所有支持的 Alembic daemon health producer 都稳定提供 `data.residentService`，并且 status / dashboard handoff 不再需要 `runtimeBoundary` fallback。

## 验证命令与结果

- `npm run build:check`：通过。
- `npm run test:unit -- CodexEnhancementRoute CodexModuleBoundary`：通过，`2` 个测试文件、`9` 个测试。
- `npm run test:unit -- CodexStatusService CodexToolPolicy CodexMcpServer CodexServiceRequestBoundary AlembicResidentServiceClient`：通过，`5` 个测试文件、`54` 个测试。
- `npm run test:unit -- CodexToolPolicy CodexMcpServer`：通过，`2` 个测试文件、`43` 个测试。
- `npm run check`：通过，typecheck / Biome lint / core import boundary 均通过。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过。
- `npm run verify:codex-plugin`：通过。
- `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime 均 passed；recovery / daemon / dashboardHandoff 为脚本本轮 skipped。
- `git diff --check`：通过。
- `git -C plugins/alembic-codex diff --check`：通过。
- 旧入口负向扫描：`Local Alembic enhancement route|Alembic daemon job|daemon jobs API|daemon-jobs|Alembic runtime code|/api/v1/projects|/api/v1/mcp/call|ResidentSearchClient|callDaemonHttpEndpoint` 在 `lib`、`bin`、`test`、`scripts`、`skills`、`injectable-skills`、`.agents`、`plugins/alembic-codex/runtime/dist` 下无命中。

## 总控验收

- `git -C AlembicPlugin status --short`：干净。
- `git -C AlembicPlugin/plugins/alembic-codex status --short`：干净。
- `git -C AlembicPlugin show --stat --oneline HEAD`：`139a7ed feat: converge resident service behavior boundary`，覆盖 behavior cleanup 所列 source、tests 和 runtime pointer。
- `git -C AlembicPlugin/plugins/alembic-codex show --stat --oneline HEAD`：`e423599 chore: refresh resident behavior cleanup runtime`，runtime dist 与 `runtime.tgz` 已刷新。
- `shasum -a 256 plugins/alembic-codex/runtime.tgz`：`ea8a805a6fe1cac55498e47ede100debdc8883f54eecd233106c83ca7b23623f`。
- 总控重跑 `npm run build:check`、focused unit、`npm run check`、`npm run verify:codex-plugin`、`npm run smoke:codex-plugin`、Plugin / runtime diff check 和旧入口负向扫描，均通过。
- 验收结论：达到 `URS-P4-Behavior-Cleanup` 完成定义，可进入 Phase 5 AlembicTest 真实项目集成验证。

## 遗留风险

- `runtimeBoundary` 兼容读取仍保留为旧 producer fallback；这不是当前阶段可安全删除项，删除条件已写入结构化 compatibility 和本文档。
- AlembicTest 真实项目未在本轮执行；本轮只做 Plugin 内部 build / focused unit / plugin verify / plugin smoke。
- local Alembic `/api/v1/search`、`/api/v1/jobs/*` 与真实 Dashboard handoff 仍建议由 Phase 5 AlembicTest 覆盖。

## 下一步建议

- 可以进入 Phase 4 总控验收。
- 总控验收通过后，建议创建 AlembicTest 集成验证单，覆盖 Plugin baseline、local Alembic installed enhancement、semantic/vector resident search、Dashboard handoff、internal AI job status 与 daemon unavailable fallback。
