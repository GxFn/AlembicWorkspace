# Repository Folder Boundary Restructure Workspace Plan

创建日期：2026-05-22
总控窗口：AlembicWorkspace
状态：RFR-1 待启动
来源 TODO：`GTODO-2026-05-22-012`
需求目录：[repository-folder-boundary-restructure](../requirement-designs/repository-folder-boundary-restructure/)
目标阶段确认：[repository-folder-boundary-restructure-goal-stage-confirmation-2026-05-22.md](repository-folder-boundary-restructure-goal-stage-confirmation-2026-05-22.md)

## 用户目标

用户希望在主线功能链路相对稳定后，重新调整各仓库文件夹层级关系；同时明确要求保证功能完整性，不能为了调整结构导致功能缺失。

## 总控判断

本主线是边界固化工程，不是普通目录清理。任何实际搬目录之前，必须先确认：

- 当前入口：CLI、MCP、daemon、HTTP/API、Dashboard server、public package exports、Codex plugin shell。
- 当前生成物：`dist/`、`.release/`、`plugins/alembic-codex/runtime`、`runtime.tgz`、`vendor/*`。
- 当前发布 / 安装 / cache 链路：publish staging、Codex channel、plugin cache sync、local-mcp refresh。
- 当前测试和验证入口：build、typecheck、lint、unit/integration/e2e、release guard、runtime verify。

## 功能完整性护栏

- 第一波只做路径依赖清单和目标层级建议，不移动文件、不改 import、不删目录。
- 后续实际迁移必须一仓一波，且每波只有一个主要源码仓库做移动。
- 任何目录移动都必须更新 package manifest、tsconfig、build/lint/test/release scripts、runtime prepare、cache sync 和文档。
- `dist/`、`.release/`、`runtime/`、`vendor/`、`plugins/alembic-codex`、`channels/codex`、`.agents` 默认按生成物 / 发布物 / 渠道资产处理，不能当普通源码整理。
- 不删除仍有真实消费方的能力，不把完整实现变成薄实现。

## 阶段计划

| 阶段 | 状态 | 主窗口 | 目标 | 输出 / 证据 | 是否可派发 |
| --- | --- | --- | --- | --- | --- |
| RFR-0 | 已完成 | `AlembicWorkspace` | 建立原始计划、需求设计、代码依赖调研和第一波分派计划。 | 需求目录和当前计划已创建。 | 否 |
| RFR-1 | 待启动 | `Alembic` / `AlembicCore` / `AlembicAgent` / `AlembicDashboard` / `AlembicPlugin` | 各仓库输出路径依赖清单、目标层级建议、禁止移动项和验证矩阵。 | `docs/<Repo>/repository-folder-boundary-inventory-*-2026-05-22.md`。 | 是 |
| RFR-2 | 阻塞 | `AlembicPlugin` | 根据 RFR-1 验收结果，优先整理 Codex-facing Plugin 目录表达。 | 后续代码提交、runtime artifact、cache verify。 | 否，等待 RFR-1 |
| RFR-3 | 阻塞 | `Alembic` | 根据 RFR-1/RFR-2 结果，整理本地增强底座目录表达。 | 后续代码提交、release staging verify。 | 否，等待 RFR-1/RFR-2 |
| RFR-4 | 观察中 | `AlembicCore` / `AlembicAgent` / `AlembicDashboard` | 只在 RFR-1 证明有必要且低风险时做内部目录收敛。 | 后续按仓库决定。 | 否 |
| RFR-5 | 阻塞 | `AlembicWorkspace` / `AlembicTest` | 跨仓库验收、cache refresh、必要时创建真实项目测试单。 | workspace 验收记录和测试单。 | 否 |

## 窗口分派

当前只发送 RFR-1。所有窗口都只做清单和方案，不做代码移动。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动 | 读取 `Alembic/AGENTS.md` 后，梳理 `lib/`、`bin/`、`config/`、`scripts/`、`dashboard/`、`resources/`、`injectable-skills/`、`templates/`、`.release/`、`vendor/` 的职责、路径依赖和禁止移动项；输出目标层级建议与验证矩阵。 |
| `AlembicCore`<br>待启动 | 读取 `AlembicCore/AGENTS.md` 后，梳理 `src/` public exports、resources、scripts、test 和 package root resolver；重点标出哪些 exports 是不可破坏 API。 |
| `AlembicAgent`<br>待启动 | 读取 `AlembicAgent/AGENTS.md` 后，梳理 `src/agent`、`src/external`、`src/tools`、`config`、release stage 和 public exports；判断是否需要实际目录调整。 |
| `AlembicDashboard`<br>待启动 | 读取 `AlembicDashboard/AGENTS.md` 后，梳理 Vite 前端目录、API client、socket hooks、i18n、theme、public assets；判断是否需要 feature-based 迁移。 |
| `AlembicPlugin`<br>待启动 | 读取 `AlembicPlugin/AGENTS.md` 后，梳理 `lib/`、`lib/codex`、`lib/external/mcp`、`plugins/alembic-codex`、`channels/codex`、`.agents`、runtime prepare、cache sync 和 release scripts；输出 Codex-facing 优先迁移方案。 |
| `AlembicTest`<br>观察中 | 当前不创建测试单；RFR-2/RFR-3 实际改代码后再判断是否需要真实 Codex / BiliDili 复测。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## RFR-1 通用执行要求

每个产品仓库窗口都必须：

- 先读取本仓库 `AGENTS.md`。
- 不移动文件，不改源码 import，不删目录，不重命名 package exports，不重建 runtime / release artifact。
- 扫描并记录 package scripts、package exports/imports、tsconfig/vite/vitest/biome、release/runtime/cache scripts 中的路径依赖。
- 标出“可迁移目录”“应保留目录”“生成物 / 发布物目录”“禁止移动目录”“需要总控确认目录”。
- 给出建议目标层级，但只能是方案，不是执行结果。
- 给出后续实际迁移时的最小验证命令。
- 回填完成范围、文档路径、验证命令、验证结果、遗留风险和下一步建议。

## RFR-1 文档动作

| 窗口 | 保存位置 | 挂载入口 |
| --- | --- | --- |
| `Alembic` | `docs/Alembic/repository-folder-boundary-inventory-main-2026-05-22.md` | 当前计划回填区 |
| `AlembicCore` | `docs/AlembicCore/repository-folder-boundary-inventory-core-2026-05-22.md` | 当前计划回填区 |
| `AlembicAgent` | `docs/AlembicAgent/repository-folder-boundary-inventory-agent-2026-05-22.md` | 当前计划回填区 |
| `AlembicDashboard` | `docs/AlembicDashboard/repository-folder-boundary-inventory-dashboard-2026-05-22.md` | 当前计划回填区 |
| `AlembicPlugin` | `docs/AlembicPlugin/repository-folder-boundary-inventory-plugin-2026-05-22.md` | 当前计划回填区 |

执行窗口可以回填 workspace 文档，但不得提交 AlembicWorkspace 仓库。

## RFR-1 验证建议

文档清单阶段至少运行：

- `git status --short`
- `rg -n "lib/|src/|dist/|\\.release|runtime|vendor/|plugins/alembic-codex|channels/codex|injectable-skills|templates|resources|dashboard" package.json tsconfig*.json vite.config.* vitest*.config.* biome.json scripts src lib bin config test`
- `git diff --check`

如果某仓库没有某些路径，按实际存在范围调整 `rg` 参数并在回填里说明。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RFR-TODO-1 | 待启动 | 路径依赖清单 | P0 | `Alembic` | 梳理本地增强底座目录与 release/dashboard/resource 路径依赖。 | 是 | 当前 wave。 | `Alembic` |
| RFR-TODO-2 | 待启动 | 路径依赖清单 | P0 | `AlembicPlugin` | 梳理 Codex plugin runtime/channel/cache/MCP 路径依赖。 | 是 | 当前 wave。 | `AlembicPlugin` |
| RFR-TODO-3 | 待启动 | public API 清单 | P1 | `AlembicCore` | 梳理 `src/` 与 package exports，标记不可破坏 public API。 | 是 | 当前 wave。 | `AlembicCore` |
| RFR-TODO-4 | 待启动 | public API 清单 | P1 | `AlembicAgent` | 梳理 Agent runtime / AI provider / tools exports 与目录边界。 | 是 | 当前 wave。 | `AlembicAgent` |
| RFR-TODO-5 | 待启动 | 前端目录清单 | P2 | `AlembicDashboard` | 判断 Dashboard 是否需要 feature-based 迁移，列出低风险建议。 | 否 | 当前 wave。 | `AlembicDashboard` |
| RFR-TODO-6 | 阻塞 | 代码迁移 | P0 | `AlembicPlugin` / `Alembic` | 实际目录移动与 import/script 更新。 | 是 | 等 RFR-1 总控验收。 | 待定 |
| RFR-TODO-7 | 阻塞 | 真实复测 | P1 | `AlembicTest` | 如 RFR-2/RFR-3 改动影响 Codex plugin 或 resident service，创建真实复测单。 | 是 | 等实际代码迁移。 | `AlembicTest` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 待启动 | 是 | 本地增强底座路径敏感，必须先出清单。 |
| `AlembicCore` | 待启动 | 是 | public exports 范围大，需要先标不可破坏 API。 |
| `AlembicAgent` | 待启动 | 是 | Agent 结构相对稳定，但需确认是否需要迁移。 |
| `AlembicDashboard` | 待启动 | 是 | 前端结构低风险，但要覆盖“各仓库”目标。 |
| `AlembicPlugin` | 待启动 | 是 | 第一优先级后续迁移仓库，必须先出完整路径依赖清单。 |
| `AlembicTest` | 观察 | 否 | 当前无代码变更，不创建测试单。 |
| `BiliDili` | 无任务 | 否 | 不改真实项目源码。 |

## 可复制分派提示词

发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`。

```text
读取 docs/workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md，按照文档，领取并完成分配给你所在窗口的 RFR-1 路径依赖清单任务；完成后回填完成范围、文档路径、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`AlembicTest`（观察中）、`BiliDili`（无任务）。

## 总控验证

本计划创建后总控需运行：

- `node scripts/verify-workspace-docs.mjs --all-workspace`
- `node scripts/check-dispatch-coverage.mjs`
- `node scripts/check-todo-board.mjs --require`
- `git diff --check`

## 回填区

- 2026-05-22：总控创建 RFR 主线。当前 RFR-0 完成，RFR-1 只派发路径依赖清单，不允许代码移动。RFR-2 之后是否实际迁移，以各仓库清单和总控验收为准。
