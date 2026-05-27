# Workspace Record Map

状态：精选迁移记录地图
维护窗口：codex-control-workspace / Alembic 项目 ledger
更新日期：2026-05-27

本文只索引从 `AlembicWorkspace-main` 迁入 `workspace-ledger` 后仍需要继续使用、复盘或近期可能领取的文档。旧全量历史不在本地图引用；需要冷追溯时从 `codex-control-workspace/AlembicWorkspace-main/` 源副本读取，再按需导入。

## Current Entries

| 类型 | 当前入口 | 说明 |
| --- | --- | --- |
| 当前短期工作区 | [current/](current/) | 当前状态、活跃 TODO、测试交流和后续执行计划。 |
| 当前状态 | [current/workspace-current-status.md](current/workspace-current-status.md) | 当前主线状态、发送名单和活跃观察项。 |
| 全局 TODO | [current/global-todo-board.md](current/global-todo-board.md) | 活跃 / 观察 TODO；038、039、PCV Wave 4、VAD 后续 bug 均从这里领取。 |
| 测试交流 | [current/test-exchange.md](current/test-exchange.md) | 当前测试单和回填证据入口；旧名 `alembic-test-exchange.md` 仅兼容保留。 |
| 当前短期地图 | [current/index.md](current/index.md) | 当前区文件说明和近期项目入口。 |
| Design handoff inbox | [current/design-handoff-inbox.md](current/design-handoff-inbox.md) | Design 正规需求交接候选的总控收件箱。 |

## Active And Recent Mainlines

| 主线 | 状态 | 入口 | 说明 |
| --- | --- | --- | --- |
| `GTODO-2026-05-24-037` Plugin Intent Knowledge Route | 已完成已归档 | [archive/2026-05/plugin-intent-knowledge-route/](archive/2026-05/plugin-intent-knowledge-route/) | Stage 0 代码事实基线到 Stage 6A 真实 smoke 均已验收，是后续 038 / 039 的前置事实。 |
| `GTODO-2026-05-24-038` Alembic file monitor evolution | 待排期 / 需独立确认 | [requirement design](../requirement-designs/knowledge-evolution-todos/knowledge-evolution-todos-requirement-design-2026-05-26.md) | 需要独立目标确认、代码事实基线和阶段计划；不得自动继承 037 自动化。 |
| `GTODO-2026-05-24-039` Plugin no-monitor evolution | 待排期 / 需独立确认 | [requirement design](../requirement-designs/knowledge-evolution-todos/knowledge-evolution-todos-requirement-design-2026-05-26.md) | 需要独立确认；不复制 Alembic daemon file monitor。 |
| `GTODO-2026-05-25-003` Progressive Chain Validation Metrics | Wave 3D 已验收，Wave 4 待裁决 | [current/progressive-chain-validation-metrics-wave-0-2026-05-25.md](current/progressive-chain-validation-metrics-wave-0-2026-05-25.md) | PCV canonical source、consumer cleanup、N9 observability linkage 和 Wave 4 候选入口。 |
| `GTODO-2026-05-25-005` Visible Automation Dispatch | 已完成待归档 / 后续 bug 优化 | [archive/2026-05/visible-automation-dispatch/](archive/2026-05/visible-automation-dispatch/) | VAD 自动化链路完成；后续只作为 bug / optimization 入队。 |
| codex-control-workspace extraction | 已完成待归档 | [current/codex-control-workspace-extraction-2026-05-27.md](current/codex-control-workspace-extraction-2026-05-27.md) | 通用控制仓库抽取和配置化补强记录。 |

## Requirement Designs

| 需求 | 入口 | 说明 |
| --- | --- | --- |
| 037 Intent Recognition Episode Continuity | [requirement-designs/intent-recognition-episode-continuity/](../requirement-designs/intent-recognition-episode-continuity/) | 037 第一阶段 Design 来源。 |
| 037 Plugin Intent Knowledge Route | [requirement-designs/plugin-intent-knowledge-route/](../requirement-designs/plugin-intent-knowledge-route/) | 037 第二阶段 Design 来源。 |
| 038 / 039 Knowledge Evolution TODOs | [requirement-designs/knowledge-evolution-todos/](../requirement-designs/knowledge-evolution-todos/) | 038 / 039 顺序索引和边界来源，尚未成为执行计划。 |
| PCV Metrics | [requirement-designs/progressive-chain-validation-metrics/](../requirement-designs/progressive-chain-validation-metrics/) | PCVM original plan、requirement design 和代码实现依赖调研。 |
| VAD | [requirement-designs/visible-automation-dispatch/](../requirement-designs/visible-automation-dispatch/) | VAD original plan、requirement design、unattended controller 设计和依赖调研。 |
| Artifact Drawer | [requirement-designs/timeline-artifact-recipe-drawer-optimization/](../requirement-designs/timeline-artifact-recipe-drawer-optimization/) | 最近 Dashboard artifact drawer UI 优化来源。 |

## Window Evidence

| 窗口 | 入口 | 说明 |
| --- | --- | --- |
| Alembic | [../Alembic/](../Alembic/) | PCV consumer cleanup / N9 observability / workflow cleanup 和 LLM artifact trace metrics 回填。 |
| AlembicAgent | [../AlembicAgent/](../AlembicAgent/) | PCV N9 producer 和 LLM input optimization 回填。 |
| AlembicCore | [../AlembicCore/](../AlembicCore/) | 当前只保留 multi-root ProjectScope core contract，用作后续 project-level skill visibility 背景。 |
| AlembicDashboard | [../AlembicDashboard/](../AlembicDashboard/) | LLM artifact detail 与 Artifact Drawer Dashboard 回填。 |

## Archive Topics

| 归档主题 | 目录 | 说明 |
| --- | --- | --- |
| `2026-05/global-todo` | [global-todo](archive/2026-05/global-todo/) | 已完成全局 TODO 和旧同步记录。 |
| `2026-05/plugin-intent-knowledge-route` | [plugin-intent-knowledge-route](archive/2026-05/plugin-intent-knowledge-route/) | 037 完整主线归档。 |
| `2026-05/visible-automation-dispatch` | [visible-automation-dispatch](archive/2026-05/visible-automation-dispatch/) | VAD 自动化主线归档。 |
| `2026-05/workspace-control-architecture-refresh` | [workspace-control-architecture-refresh](archive/2026-05/workspace-control-architecture-refresh/) | workspace 控制架构整理归档。 |
