# AlembicWorkspace Current Status

更新日期：2026-05-22
总控窗口：AlembicWorkspace
状态：RFR-1 总控验收通过；RFR-2A 待启动（AlembicPlugin）

## 状态摘要

当前新主线是 [repository-folder-boundary-restructure-workspace-plan-2026-05-22.md](repository-folder-boundary-restructure-workspace-plan-2026-05-22.md)：在不破坏功能完整性的前提下，重新调整各仓库文件夹层级关系。

总控已完成 RFR-0 和 RFR-1：

- 原始计划：[../requirement-designs/repository-folder-boundary-restructure/original-plan-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/original-plan-2026-05-22.md)。
- 需求设计：[../requirement-designs/repository-folder-boundary-restructure/requirement-design-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/requirement-design-2026-05-22.md)。
- 代码依赖调研：[../requirement-designs/repository-folder-boundary-restructure/code-implementation-dependency-research-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/code-implementation-dependency-research-2026-05-22.md)。
- RFR-1 五个产品仓库路径依赖清单均已回填并通过总控验收；五个产品仓库工作区干净，没有产品源码迁移。
- 当前进入 RFR-2A，只派发 `AlembicPlugin` 做 `lib/codex` runtime/status/diagnostics/preflight 小范围目录表达优化。

当前发送窗口：`AlembicPlugin`。

当前不发送给：`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（观察中）、`AlembicDashboard`（观察中）、`AlembicTest`（观察中）、`BiliDili`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | RFR-1 清单已通过总控验收；暂不进入源码移动。主仓库目录迁移等待 Plugin 侧 RFR-2A 结果。 |
| `AlembicCore`<br>观察中 | RFR-1 清单已通过总控验收；当前不做源码移动，后续如需收敛先处理 public API / deep import。 |
| `AlembicAgent`<br>观察中 | RFR-1 清单已通过总控验收；当前目录结构与 Agent runtime / external AI / tools 边界一致，不做源码移动。 |
| `AlembicDashboard`<br>观察中 | RFR-1 清单已通过总控验收；Dashboard 若优化需单独开前端波次。 |
| `AlembicPlugin`<br>待启动 | RFR-2A：读取当前计划和 Plugin 清单，复核 `lib/codex` runtime/status/diagnostics/preflight 的真实调用链，能保持功能闭环时再做最小目录迁移并更新 imports、tests、runtime artifact 和执行记录。 |
| `AlembicTest`<br>观察中 | RFR-2A 先由 Plugin 自验证；是否创建真实 Codex / BiliDili 复测单等待代码回填。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## 可复制提示词

发送给：`AlembicPlugin`。

```text
读取 docs/workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md，按照文档，领取并完成分配给 AlembicPlugin 的 RFR-2A 任务；先复核 `lib/codex` runtime/status/diagnostics/preflight 的真实调用链，能保持功能闭环时再做最小目录迁移并更新 imports、tests、runtime artifact 和执行记录；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

## 回填区

- 2026-05-22：总控创建 RFR 主线。当前 RFR-0 完成，RFR-1 待启动；本轮只做路径依赖清单和目标层级建议，明确禁止代码移动。
- 2026-05-22：`AlembicAgent` 已完成 RFR-1 路径依赖清单并回填，文档见 `docs/AlembicAgent/repository-folder-boundary-inventory-agent-2026-05-22.md`；当前不建议给 `AlembicAgent` 继续发送 RFR-1 提示词，等待总控统一验收。
- 2026-05-22：`AlembicCore` 已完成 RFR-1 路径依赖清单并回填，文档见 `docs/AlembicCore/repository-folder-boundary-inventory-core-2026-05-22.md`；当前不建议给 `AlembicCore` 继续发送 RFR-1 提示词，等待总控统一验收。
- 2026-05-22：`AlembicPlugin` 已完成 RFR-1 路径依赖清单并回填，文档见 `docs/AlembicPlugin/repository-folder-boundary-inventory-plugin-2026-05-22.md`；当前不建议给 `AlembicPlugin` 继续发送 RFR-1 提示词，等待总控统一验收。
- 2026-05-22：`Alembic` 和 `AlembicDashboard` RFR-1 路径依赖清单已回填，文档分别见 `docs/Alembic/repository-folder-boundary-inventory-main-2026-05-22.md`、`docs/AlembicDashboard/repository-folder-boundary-inventory-dashboard-2026-05-22.md`。
- 2026-05-22：总控验收 RFR-1 通过。复核结果：五个产品仓库均已回填路径依赖清单，`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 工作区均干净；RFR-1 未产生产品源码改动。下一步只派发 `AlembicPlugin` 执行 RFR-2A，暂不创建 AlembicTest 测试单。
