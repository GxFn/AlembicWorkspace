# AlembicWorkspace Current Status

更新日期：2026-05-18
总控窗口：AlembicWorkspace
状态：Wave 1 待启动，发送给 Alembic

## 状态摘要

`Alembic` 多项目控制目标阶段已由用户确认。当前进入 Wave 1：只发送给 `Alembic`，实现 Project Runtime Control Foundation；其它窗口保持阻塞 / 观察，等待 Alembic 产出真实字段和 scope 模型。

- 当前确认文档：[alembic-multi-project-control-redesign-goal-stage-confirmation-2026-05-18.md](alembic-multi-project-control-redesign-goal-stage-confirmation-2026-05-18.md)
- 当前执行计划：[alembic-multi-project-control-wave-1-runtime-control-foundation-plan-2026-05-18.md](alembic-multi-project-control-wave-1-runtime-control-foundation-plan-2026-05-18.md)
- 原始计划书确认：[alembic-multi-project-control-redesign-original-plan-confirmation-2026-05-18.md](alembic-multi-project-control-redesign-original-plan-confirmation-2026-05-18.md)
- 当前需求目录：[../requirement-designs/alembic-multi-project-control-redesign/](../requirement-designs/alembic-multi-project-control-redesign/)
- 原始计划书：[../requirement-designs/alembic-multi-project-control-redesign/original-plan-2026-05-18.md](../requirement-designs/alembic-multi-project-control-redesign/original-plan-2026-05-18.md)
- 需求设计文档：[../requirement-designs/alembic-multi-project-control-redesign/requirement-design-2026-05-18.md](../requirement-designs/alembic-multi-project-control-redesign/requirement-design-2026-05-18.md)
- 代码实现依赖调研：[../requirement-designs/alembic-multi-project-control-redesign/code-implementation-dependency-research-2026-05-18.md](../requirement-designs/alembic-multi-project-control-redesign/code-implementation-dependency-research-2026-05-18.md)
- 当前需求口径：Codex 插件作为入口，`AlembicPlugin` 从 Codex host agent 当前项目上下文初始化项目，默认 Ghost 模式；`Alembic` 通过 Ghost 模式和全局配置管理这些项目。
- 可用性补充：需求设计必须覆盖多项目如何表示、如何切换，以及切换时需要切换 / 重连 project context、daemon、Dashboard/API、jobs、file monitor、internal AI、Ghost dataRoot 和缓存 / 错误状态；切换应通过真实调研后的完整 `ProjectBinding` / `ProjectRuntimeScope`，本阶段采用单 active runtime 的关闭 / 重启 / 重连模型，不能散着改字段，也不能先做空接口抽象。
- 已确认补充：Plugin 不做多项目切换；Alembic 当前项目不是 Codex host project 时 Plugin 默认断开 / mismatch。Dashboard 切换操作后续决定。每个项目独立。项目不可用状态可保留。`BiliDili` 不进入默认范围。
- 需求设计文档：已创建，并补充底层能力依赖调研和代码实现依赖调研附件。
- 目标阶段确认文档：用户已确认。
- 当前动作：启动 Wave 1；当前发送给 `Alembic`。
- 上一波验收：[alembic-runtime-project-identity-wave-3a-core-provider-plan-2026-05-18.md](alembic-runtime-project-identity-wave-3a-core-provider-plan-2026-05-18.md)
- 需求目标与分阶段确认流程：[../goal-stage-confirmation/process.md](../goal-stage-confirmation/process.md)
- 需求目标与分阶段确认模板：[../goal-stage-confirmation/template.md](../goal-stage-confirmation/template.md)
- 最终目标与阶段路线图：[alembic-final-goal-stage-roadmap.md](alembic-final-goal-stage-roadmap.md)
- 待启动窗口：`Alembic`
- 已完成窗口：无，本需求尚未派发执行。
- 暂停窗口：无
- 阻塞窗口：`AlembicCore`、`AlembicPlugin`、`AlembicDashboard`
- 观察中窗口：`AlembicAgent`
- 无任务窗口：`BiliDili`
- 发送判断：发送给 `Alembic`；不发送阻塞 / 观察 / 无任务窗口。
- 长期路线：[alembic-plugin-first-enhancement-contract.md](alembic-plugin-first-enhancement-contract.md)

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动 | 读取 Wave 1 执行计划，完成 Project Runtime Control Foundation，并回填执行文档。 |
| `AlembicCore`<br>阻塞 | 等待 Alembic 阶段 1 证明字段和 scope 模型后再沉淀 contract。 |
| `AlembicPlugin`<br>阻塞 | 等待 Alembic projects API / Core contract 后处理 hostProject mismatch。 |
| `AlembicDashboard`<br>阻塞 | 等待 Alembic projects API / handoff 字段后处理项目列表和切换。 |
| `AlembicAgent`<br>观察中 | 当前无执行任务；只在 internal AI isolation 发现真实缺口时派发。 |
| `BiliDili`<br>无任务 | 当前不做真实项目 smoke；稳定后才按只读验证考虑。 |

## 可复制提示词

发送给：`Alembic`

```text
读取 docs/workspace/alembic-multi-project-control-wave-1-runtime-control-foundation-plan-2026-05-18.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`AlembicCore`（阻塞）、`AlembicPlugin`（阻塞）、`AlembicDashboard`（阻塞）、`AlembicAgent`（观察中）、`BiliDili`（无任务）。

## 回填区

- 当前确认回填入口：`docs/workspace/alembic-multi-project-control-redesign-goal-stage-confirmation-2026-05-18.md` 的“回填区”。
