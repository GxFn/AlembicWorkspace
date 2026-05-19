# Alembic Multi Project Control Redesign Original Plan Confirmation

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：原始计划书已确认，需求设计已完成
阶段：等待任务级目标阶段确认

## 当前规则

用户已明确：原始计划书需要先与用户商量确认，才开始目标和阶段设计。

原始计划书已由用户确认。真实代码调研、需求设计文档和任务级目标阶段确认文档已创建；目标阶段等待用户确认，执行窗口派发仍保持暂停。旧的多项目需求目录已由用户删除，本次重新开始。

## 原始计划书

- 需求目录：[../requirement-designs/alembic-multi-project-control-redesign/](../../../../requirement-designs/alembic-multi-project-control-redesign/)
- 原始计划书：[../requirement-designs/alembic-multi-project-control-redesign/original-plan-2026-05-18.md](../../../../requirement-designs/alembic-multi-project-control-redesign/original-plan-2026-05-18.md)
- 需求设计文档：[../requirement-designs/alembic-multi-project-control-redesign/requirement-design-2026-05-18.md](../../../../requirement-designs/alembic-multi-project-control-redesign/requirement-design-2026-05-18.md)
- 目标阶段确认：[alembic-multi-project-control-redesign-goal-stage-confirmation-2026-05-18.md](alembic-multi-project-control-redesign-goal-stage-confirmation-2026-05-18.md)
- 当前状态：已确认，需求设计完成，等待目标阶段确认

## 原始口径摘要

```text
不管旧的需求了，现在重新开始设计 Alembic 多项目控制 需求
```

## 当前需求口径摘要

```text
现在需求是 Codex 插件作为入口，AlembicPlugin 从 Codex host agent 当前项目上下文开始项目，默认 Ghost 模式；然后 Alembic 需要通过 Ghost 模式和全局配置来管理这些从插件入口初始化的项目。

这个需求现在是我描述的内容，为了可用性还需要考虑，这个多项目要如何表示，如何切换，切换要对哪些内容进行切换和重连。
```

当前原始计划书只记录以下边界：

- 旧的多项目需求、旧的阶段派发和旧的候选文档不作为当前设计依据。
- 本次要按新的 `AGENTS.md` 流程重新确认原始计划书；确认后再读取真实代码和功能逻辑，设计完整的 `Alembic` 多项目控制需求。
- 本次不是只补抽象接口，也不是只做类型连接；需要按完整功能模块设计用户可用能力。
- 目标对象是 `Alembic` 多项目控制。
- 入口是 Codex 插件；`AlembicPlugin` 从 Codex host agent 当前项目上下文发起项目初始化。
- 插件入口初始化默认使用 Ghost 模式。
- `Alembic` 本体通过 Ghost 模式和全局配置管理这些从插件入口初始化的项目。
- 预期能力是让 Alembic 面对多个真实项目目录时，可以明确注册、识别、切换、查看状态、启动/停止项目 daemon，并把 Plugin / Dashboard / internal AI / file monitor / jobs / dataRoot 都绑定到正确项目。
- 需求设计必须覆盖多项目的用户可见表示、切换入口、切换目标、切换后需要切换或重连的连接和运行上下文。
- 表示需要考虑 projectId、显示名、projectRoot、Ghost dataRoot、初始化来源、当前项目、daemon / Dashboard / jobs / file monitor / internal AI 状态和不可用状态。
- 切换和重连需要考虑 current project context、daemon 连接、Dashboard URL / API base、JobStore / job stream、file monitor、internal AI job context、Ghost dataRoot、缓存和错误 / 权限状态。
- `AlembicPlugin` 不承担多项目切换控制面。若 Alembic 当前选中项目不是 Codex host agent 当前项目，Plugin 默认显示断开、不可用或 handoff mismatch，不在插件端伪切换。
- Dashboard 切换项目的具体操作方式可以在需求设计和代码调研后决定。
- 每个项目都应独立，不能共用 daemon、Ghost dataRoot、jobs、file monitor、internal AI context 或缓存状态。
- 项目删除、移动或不可访问时，可以保留 missing / unavailable / disconnected 状态，不自动删除。
- `BiliDili` 不进入本需求的默认设计 / 执行范围。

## 当前不做

- 不派发窗口，直到用户确认任务级目标阶段。
- 不启动旧的目标阶段草案。
- 不派发 `AlembicCore`、`Alembic` 或其它执行窗口。
- 不把旧的需求设计或旧派发判断作为执行依据。

## 后续顺序

原始计划书已确认，且已完成：

1. 真实代码调研。
2. 创建需求设计文档。
3. 基于需求设计文档创建任务级最终目标与阶段确认文档。

下一步是等待用户确认目标阶段；确认后再创建具体 wave 分派文档并派发窗口。

## 当前文档状态

- 需求设计文档：已创建。
- 目标阶段确认文档：已创建，等待用户确认。
- 执行 wave 分派文档：未创建。

## 窗口分派

当前是原始计划书确认，不派发执行窗口。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>暂停 | 等待用户确认目标阶段；确认后第一波候选，先做底层依赖调研与实际隔离地图。 |
| `AlembicCore`<br>暂停 | 等待 Alembic 真实边界清楚后再沉淀 contract；当前不派发。 |
| `AlembicPlugin`<br>暂停 | 等待 Alembic projects API / selectedProject contract；当前不派发。 |
| `AlembicDashboard`<br>暂停 | 等待 Alembic projects API；Dashboard 切换形态后续决定。 |
| `AlembicAgent`<br>观察中 | 当前无执行任务；只在 internal AI isolation 发现真实缺口时派发。 |
| `BiliDili`<br>无任务 | 当前不涉及真实项目 smoke。 |

## 可复制提示词

发送给：无

```text
等待用户确认 Alembic 多项目控制的任务级最终目标与阶段计划；当前不派发执行窗口。
```

不发送给：`AlembicCore`、`Alembic`、`AlembicPlugin`、`AlembicDashboard`、`AlembicAgent`、`BiliDili`。

## 回填区

### 用户确认原始计划书

- 状态：已确认
- 确认时间：2026-05-18 23:01 CST
- 用户调整：Plugin 不做多项目切换；Alembic 当前项目不是 Codex host project 时 Plugin 默认断开 / mismatch。Dashboard 切换操作后续决定。每个项目独立。项目不可用状态可保留。`BiliDili` 不进入默认范围。

### 确认后动作

- 需求设计文档：已创建
- 目标阶段确认：已创建，等待用户确认
- 第一波执行计划：待后续目标阶段确认后再判断
