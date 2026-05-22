# AlembicWorkspace Current Status

更新日期：2026-05-22
总控窗口：AlembicWorkspace
状态：RFR-2B 总控验收通过；RFR-3A 待启动（Alembic）

## 状态摘要

当前新主线是 [repository-folder-boundary-restructure-workspace-plan-2026-05-22.md](repository-folder-boundary-restructure-workspace-plan-2026-05-22.md)：在不破坏功能完整性的前提下，重新调整各仓库文件夹层级关系。

总控已完成 RFR-0 和 RFR-1：

- 原始计划：[../requirement-designs/repository-folder-boundary-restructure/original-plan-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/original-plan-2026-05-22.md)。
- 需求设计：[../requirement-designs/repository-folder-boundary-restructure/requirement-design-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/requirement-design-2026-05-22.md)。
- 代码依赖调研：[../requirement-designs/repository-folder-boundary-restructure/code-implementation-dependency-research-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/code-implementation-dependency-research-2026-05-22.md)。
- RFR-1 五个产品仓库路径依赖清单均已回填并通过总控验收；五个产品仓库工作区干净，没有产品源码迁移。
- RFR-2A 已通过总控验收：`lib/codex` runtime/status/diagnostics/preflight 已迁入内部语义目录，AlembicPlugin 提交 `6abb643e62cceed4642028b4000fc5ed518dda43`，AlembicCodex runtime artifact 子仓库提交 `bded1ee21f33a7f4e68fa69ddad3e304f6fa7cab`；总控补跑 targeted unit、plugin verify、channel verify 均通过。
- RFR-2B 已通过总控验收：`CodexMcpServer.ts` 内部 helper 已抽入 `lib/external/mcp/codex/`，MCP server 入口、tool schema、Skill contract 和 runtime artifact 外部路径保持不变；AlembicPlugin 提交 `7afd689dc1654611b7f9de742aa170a3a9de7fa3`，AlembicCodex runtime artifact 子仓库提交 `b47d44a8558570cef2a2195c9b0b7eb13d020d95`，`runtime.tgz` SHA-256 `1a4d66a33511ddc7a88e20d3dae9bb30a7c2a2c20fe2db63f2a828b8c2a4281f`。总控补跑 RFR-2B targeted unit、plugin verify、channel verify 和提交 diff check 均通过。
- 当前进入 RFR-3A，只派发 `Alembic` 主仓库处理 `lib/core` 与外部 `@alembic/core` 命名混淆：先复核 constitution / gateway / permission 真实调用链，再在保持 CLI / daemon / HTTP / release / runtime 功能闭环的前提下收敛到更准确的内部目录名。

当前发送窗口：`Alembic`。

当前不发送给：`AlembicPlugin`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（观察中）、`AlembicDashboard`（观察中）、`AlembicTest`（观察中）、`BiliDili`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动 | RFR-3A：复核 `lib/core` constitution / gateway / permission 与 `#core/*` 的真实调用链，在保持功能闭环时把该 host-owned governance bounded context 收敛到更准确的内部目录名，并更新 imports、package imports、tests、执行记录和验证。 |
| `AlembicCore`<br>观察中 | RFR-1 清单已通过总控验收；当前不做源码移动，后续如需收敛先处理 public API / deep import。 |
| `AlembicAgent`<br>观察中 | RFR-1 清单已通过总控验收；当前目录结构与 Agent runtime / external AI / tools 边界一致，不做源码移动。 |
| `AlembicDashboard`<br>观察中 | RFR-1 清单已通过总控验收；Dashboard 若优化需单独开前端波次。 |
| `AlembicPlugin`<br>观察中 | RFR-2A / RFR-2B 已通过总控验收；当前不继续扩大 Plugin 侧 MCP handler 结构调整。 |
| `AlembicTest`<br>观察中 | RFR-3A 是主仓库内部目录命名和 import 收敛，当前不创建真实 Codex / BiliDili 复测单。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## 可复制提示词

发送给：`Alembic`。

```text
读取 docs/workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md，按照文档，领取并完成分配给 Alembic 的 RFR-3A 任务；先复核 `lib/core` constitution/gateway/permission 与 `#core/*` 的真实调用链，在保持功能闭环时把该 host-owned governance bounded context 收敛到更准确的内部目录名，并更新 imports、package imports、tests、执行记录和验证；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

## 回填区

- 2026-05-22：总控创建 RFR 主线。当前 RFR-0 完成，RFR-1 待启动；本轮只做路径依赖清单和目标层级建议，明确禁止代码移动。
- 2026-05-22：`AlembicAgent` 已完成 RFR-1 路径依赖清单并回填，文档见 `docs/AlembicAgent/repository-folder-boundary-inventory-agent-2026-05-22.md`；当前不建议给 `AlembicAgent` 继续发送 RFR-1 提示词，等待总控统一验收。
- 2026-05-22：`AlembicCore` 已完成 RFR-1 路径依赖清单并回填，文档见 `docs/AlembicCore/repository-folder-boundary-inventory-core-2026-05-22.md`；当前不建议给 `AlembicCore` 继续发送 RFR-1 提示词，等待总控统一验收。
- 2026-05-22：`AlembicPlugin` 已完成 RFR-1 路径依赖清单并回填，文档见 `docs/AlembicPlugin/repository-folder-boundary-inventory-plugin-2026-05-22.md`；当前不建议给 `AlembicPlugin` 继续发送 RFR-1 提示词，等待总控统一验收。
- 2026-05-22：`Alembic` 和 `AlembicDashboard` RFR-1 路径依赖清单已回填，文档分别见 `docs/Alembic/repository-folder-boundary-inventory-main-2026-05-22.md`、`docs/AlembicDashboard/repository-folder-boundary-inventory-dashboard-2026-05-22.md`。
- 2026-05-22：总控验收 RFR-1 通过。复核结果：五个产品仓库均已回填路径依赖清单，`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 工作区均干净；RFR-1 未产生产品源码改动。下一步只派发 `AlembicPlugin` 执行 RFR-2A，暂不创建 AlembicTest 测试单。
- 2026-05-22：`AlembicPlugin` 已完成 RFR-2A 并回填，执行记录见 `docs/AlembicPlugin/repository-folder-boundary-rfr-2-plugin-codex-runtime-2026-05-22.md`。完成范围：迁移 `lib/codex` runtime/status/diagnostics/preflight 四类文件到内部语义目录，更新 imports、tests、runtime artifact；未移动 MCP、plugin shell、channel、vendor 或 runtime artifact 所在路径。提交：AlembicPlugin `6abb643e62cceed4642028b4000fc5ed518dda43`，AlembicCodex runtime artifact `bded1ee21f33a7f4e68fa69ddad3e304f6fa7cab`。验证：build/typecheck、targeted unit、runtime prepare、codex plugin/channel verify、旧路径负向扫描和 `git diff --check` 均通过。
- 2026-05-22：总控验收 RFR-2A 通过，补跑 `npm run test:unit -- test/unit/CodexRuntimeContext.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexMcpServer.test.ts`、`npm run verify:codex-plugin`、`npm run verify:codex-channel` 均通过；旧 flat path 负向扫描和 diff 检查通过。下一步只派发 `AlembicPlugin` 执行 RFR-2B，暂不创建 AlembicTest 测试单，暂不刷新本机 Codex plugin cache。
- 2026-05-22：`AlembicPlugin` 已完成 RFR-2B 并回填，执行记录见 `docs/AlembicPlugin/repository-folder-boundary-rfr-2-plugin-mcp-helpers-2026-05-22.md`。完成范围：新增 `lib/external/mcp/codex/` 内部支持目录，抽取 tool visibility / result / daemon job query / host handoff / project root fallback helper；未移动 MCP server 入口、tool schema、Skill contract、plugin shell、channel、vendor 或 runtime artifact 外部路径。提交：AlembicPlugin `7afd689dc1654611b7f9de742aa170a3a9de7fa3`，AlembicCodex runtime artifact `b47d44a8558570cef2a2195c9b0b7eb13d020d95`，`runtime.tgz` SHA-256 `1a4d66a33511ddc7a88e20d3dae9bb30a7c2a2c20fe2db63f2a828b8c2a4281f`。验证：build/typecheck、targeted unit、runtime prepare、codex plugin/channel verify、helper 定义负向扫描和 `git diff --check` 均通过。
- 2026-05-22：总控验收 RFR-2B 通过，补跑 `npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts`、`npm run verify:codex-plugin`、`npm run verify:codex-channel` 和 `git -C AlembicPlugin diff --check HEAD^ HEAD` 均通过；功能完整性检查确认 MCP server 入口、tool schema、Skill contract、runtime artifact 外部路径和对外导出保持完整。下一步只派发 `Alembic` 执行 RFR-3A，暂不创建 AlembicTest 测试单，暂不刷新本机 Codex plugin cache。
