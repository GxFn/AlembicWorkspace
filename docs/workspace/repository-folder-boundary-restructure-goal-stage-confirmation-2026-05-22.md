# Repository Folder Boundary Restructure Goal Stage Confirmation

创建日期：2026-05-22
状态：用户已确认，RFR-1 已进入待启动
对应需求设计：[../requirement-designs/repository-folder-boundary-restructure/requirement-design-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/requirement-design-2026-05-22.md)
当前执行计划：[repository-folder-boundary-restructure-workspace-plan-2026-05-22.md](repository-folder-boundary-restructure-workspace-plan-2026-05-22.md)

## 用户原始目标

在 Alembic 主线功能链路相对稳定后，重新调整各个仓库的文件夹层级关系。

用户补充约束：可以按照总控建议修改，但必须保证功能完整性，不能为了调整导致功能缺失。

## 总控理解

本任务目标不是“让目录看起来整齐”，而是让目录结构真实表达当前系统边界：

- `AlembicPlugin`：Codex host agent 入口、MCP、Skill、channel/marketplace、插件 runtime、cache refresh。
- `Alembic`：本地常驻服务、本地增强底座、CLI、daemon、HTTP/API、Dashboard server、ProjectRegistry、JobStore、internal AI jobs、release staging。
- `AlembicCore`：共享确定性 headless 内核和 public API。
- `AlembicAgent`：agent runtime、AI provider、tool system、prompt、memory、执行循环。
- `AlembicDashboard`：前端 UI 与前端状态。
- `AlembicWorkspace`：总控文档、分派、验收、模板和协作规则。

## 最终完成定义

- 所有实际迁移后的目录结构都有真实职责说明。
- 用户可见入口不缺失：CLI、Codex MCP、prime/search、daemon、HTTP/API、Dashboard server、release staging、Codex plugin runtime/cache 均可验证。
- package exports/imports、tsconfig、lint/format/test/release scripts、runtime prepare、cache sync 均与新路径一致。
- 每个仓库回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
- 总控验收每波功能完整性，不把“能编译”当作唯一完成标准。

## 非目标

- 不合并仓库，不把 workspace 根目录变成产品 monorepo。
- 不削减功能，不删除仍有真实消费方的能力。
- 不在 RFR-1 移动目录、改 import、删文件或重建 runtime/release。
- 不改真实测试项目源码。

## 影响窗口

| 窗口 | 影响判断 |
| --- | --- |
| `Alembic` | 高影响，后续可能整理本地增强底座目录。 |
| `AlembicPlugin` | 高影响，后续优先整理 Codex-facing 目录。 |
| `AlembicCore` | 中高影响，public exports 风险大，先清单后判断是否迁移。 |
| `AlembicAgent` | 中影响，结构较稳定，先清单后判断是否迁移。 |
| `AlembicDashboard` | 低到中影响，先确认是否需要 feature-based 整理。 |
| `AlembicTest` | 观察中，只有实际代码迁移影响运行态时再创建测试单。 |
| `BiliDili` | 无任务，不改真实项目源码。 |

## Producer / Consumer 依赖链

- `AlembicCore` public API 是 `Alembic`、`AlembicPlugin`、`AlembicAgent` 的上游依赖，不能先做破坏性目录移动。
- `AlembicPlugin` runtime artifact 消费自身 `dist`、`channels`、`.agents`、`plugins/alembic-codex`、embedded Core，必须在 Plugin 迁移后重建验证。
- `Alembic` publish staging 消费自身 package `files`、`dist`、Dashboard 静态资源和相邻仓库 package metadata，必须在 Alembic 迁移后重建验证。
- `AlembicDashboard` build artifact 被 `Alembic` release/dashboard server 消费，因此 Dashboard 迁移若影响 `dist` 产物位置，必须反馈给 `Alembic`。

## 阶段确认

| 阶段 | 是否确认 | 说明 |
| --- | --- | --- |
| RFR-0 | 已确认并完成 | 总控建立需求、真实路径依赖调研和当前 wave。 |
| RFR-1 | 已确认，当前待启动 | 各仓库只做路径依赖清单，不改代码。 |
| RFR-2 | 候选 | 预计优先整理 `AlembicPlugin`，但必须等 RFR-1 验收后确定具体移动。 |
| RFR-3 | 候选 | 预计整理 `Alembic`，但必须等 RFR-1/RFR-2 结果。 |
| RFR-4 | 候选 | Core/Agent/Dashboard 是否实际迁移由 RFR-1 证明。 |
| RFR-5 | 候选 | 跨仓库验证和必要测试单。 |

## 当前允许启动

允许启动 RFR-1。

发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`。

不发送给：`AlembicTest`、`BiliDili`。
