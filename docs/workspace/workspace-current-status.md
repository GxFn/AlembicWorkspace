# AlembicWorkspace Current Status

更新日期：2026-05-22
总控窗口：AlembicWorkspace
状态：RFR-1 待启动

## 状态摘要

当前新主线是 [repository-folder-boundary-restructure-workspace-plan-2026-05-22.md](repository-folder-boundary-restructure-workspace-plan-2026-05-22.md)：在不破坏功能完整性的前提下，重新调整各仓库文件夹层级关系。

总控已完成 RFR-0：

- 原始计划：[../requirement-designs/repository-folder-boundary-restructure/original-plan-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/original-plan-2026-05-22.md)。
- 需求设计：[../requirement-designs/repository-folder-boundary-restructure/requirement-design-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/requirement-design-2026-05-22.md)。
- 代码依赖调研：[../requirement-designs/repository-folder-boundary-restructure/code-implementation-dependency-research-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/code-implementation-dependency-research-2026-05-22.md)。
- 当前 wave 只派发 RFR-1 路径依赖清单，不允许代码移动、import 改写、目录删除或 release/runtime 重建。

当前发送窗口：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`。

当前不发送给：`AlembicTest`（观察中）、`BiliDili`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动 | RFR-1：梳理 `lib/`、`bin/`、`config/`、`scripts/`、`dashboard/`、`resources/`、`injectable-skills/`、`templates/`、`.release/`、`vendor/` 的职责、路径依赖和禁止移动项；输出目标层级建议与验证矩阵。 |
| `AlembicCore`<br>待启动 | RFR-1：梳理 `src/` public exports、resources、scripts、test 和 package root resolver；重点标出哪些 exports 是不可破坏 API。 |
| `AlembicAgent`<br>待启动 | RFR-1：梳理 `src/agent`、`src/external`、`src/tools`、`config`、release stage 和 public exports；判断是否需要实际目录调整。 |
| `AlembicDashboard`<br>待启动 | RFR-1：梳理 Vite 前端目录、API client、socket hooks、i18n、theme、public assets；判断是否需要 feature-based 迁移。 |
| `AlembicPlugin`<br>待启动 | RFR-1：梳理 `lib/`、`lib/codex`、`lib/external/mcp`、`plugins/alembic-codex`、`channels/codex`、`.agents`、runtime prepare、cache sync 和 release scripts；输出 Codex-facing 优先迁移方案。 |
| `AlembicTest`<br>观察中 | 当前不创建测试单；RFR-2/RFR-3 实际改代码后再判断是否需要真实 Codex / BiliDili 复测。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## 可复制提示词

发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`。

```text
读取 docs/workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md，按照文档，领取并完成分配给你所在窗口的 RFR-1 路径依赖清单任务；完成后回填完成范围、文档路径、验证命令、验证结果、遗留风险和下一步建议。
```

## 回填区

- 2026-05-22：总控创建 RFR 主线。当前 RFR-0 完成，RFR-1 待启动；本轮只做路径依赖清单和目标层级建议，明确禁止代码移动。
