# Alembic Plugin First Runtime Boundary Goal Stage Confirmation

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：暂停，等待用户确认
阶段：任务级最终目标与阶段计划确认

## 用户原始目标

用户当前目标不是继续机械派发已有 Wave 3B，而是先重新确认这条主线的“最终目标 + 阶段计划”，等用户确认后再开始派发任务。

近期关键口径：

- 路线采用 `Plugin first, Alembic install enhances`。
- 插件作为 Codex host agent 入口，本体作为后续安装增强和节约 token 的本地底座。
- Alembic 不应继续维护多种 IDE Agent 路线；先做好 Codex 插件一条线，同时 Alembic internal AI 作为本体增强能力。
- 前端产品归 `AlembicDashboard`，运行和服务归 `Alembic`，`AlembicPlugin` 只做 Codex 入口、状态、handoff 和必要 artifact，不做前端所有者。
- 先推进前期开发和模块划分，不急着每一小波都做大验收归档。
- 全局 Alembic 需要能处理多个项目目录，而不是只绑定当前单一项目。

## 前置需求设计

- 旧需求目录：`docs/requirement-designs/alembic-multi-project-control-plane/`，已按用户要求删除；本文件仅作为未生效历史草案保留。
- 旧原始计划书：`docs/requirement-designs/alembic-multi-project-control-plane/original-plan-2026-05-18.md`，已删除。
- 旧需求设计文档：`docs/requirement-designs/alembic-multi-project-control-plane/requirement-design-2026-05-18.md`，已删除。
- 调研结论：当前代码已有 `ProjectRegistry`、`WorkspaceResolver`、per-project `DaemonSupervisor`、per-project `JobStore`、daemon health 和 CLI `--dir` 基础，但还没有完整多项目 control plane。
- 本确认文档基于该需求设计文档，把目标从旧的 Plugin / Dashboard consumer 收敛调整为完整多项目运行模型。

## 总控理解

本次任务要完成的是一条跨仓库 runtime / source / project identity / frontend ownership 的收口主线：

- `AlembicPlugin` 先作为用户从 Codex 进入 Alembic 的入口，负责 MCP、skills、status、diagnostics、Dashboard URL handoff、portable fallback 和宿主能力适配。
- `Alembic` 作为安装后增强底座，负责 CLI、daemon、HTTP/API、Dashboard server、多项目 ProjectRegistry / 控制面、file monitor、JobStore、internal AI jobs 和本地 install / dev link。
- `AlembicCore` 提供 headless contract，避免 Alembic / Plugin / Dashboard 各自复制 project identity、runtime capability、AI source 或 workflow shape。
- `AlembicDashboard` 只做前端产品和 UI 消费，不拥有后端策略、ProjectRegistry、file monitor、JobStore 或 internal AI 决策。
- `AlembicAgent` 是 Alembic internal AI runtime，不等同于 Codex host-agent，也不承接 Plugin route。

这份文档只确认目标和阶段；确认前不派发任何执行窗口。

## 最终完成定义

本次方向完成时，需要同时满足：

- Plugin / Alembic / Dashboard / Core / Agent 的职责边界清楚，没有互相复制长期 runtime shape。
- Alembic daemon health 输出 canonical runtime project identity、capability、source、handoff 和必要 route 状态，Plugin / Dashboard 以此为主消费面。
- `runtimeBoundary`、Plugin embedded runtime、Plugin `dashboard/dist` 等过渡能力都有保留原因、删除条件和验证门槛。
- 完整多项目运行模型真实可用：Alembic 能注册、列出、选择、启动、停止和查询多个项目；每个项目有独立 project identity、dataRoot、daemon state、jobs、file monitor 和 Dashboard handoff；Plugin 能从当前 Codex 项目定位正确项目；Dashboard 能展示和切换项目。
- internal AI 与 Codex host-agent 两条线清楚：host-agent 是宿主能力来源，internal AI 是 Alembic 安装后的增强能力，由 Alembic / AlembicAgent 负责。
- 稳定面形成后，再统一做跨仓库大验收、负向扫描、真实项目 smoke、归档和必要发布链路检查。

## 当前代码事实

当前代码已经具备多项目能力的基础，但不是完整产品能力：

- `ProjectRegistry` 能在全局注册多个项目，并为每个项目生成稳定 `projectId`。
- `WorkspaceResolver` 能按项目解析 standard / ghost mode、`projectRoot`、`dataRoot`、`runtimeDir` 和 `databasePath`。
- `DaemonSupervisor` 能按 `projectRoot` 管理单个项目 daemon，并把 state / pid / lock / jobs 放到该项目对应的 `runtimeDir`。
- CLI 已有 `alembic daemon start/status/stop --dir <path>` 和 `alembic ghost list/status/on/off`。

缺口：

- 还没有完整的多项目控制面：缺少统一 list / status-all / start-stop per project 的产品化 API 和 CLI。
- Dashboard 还没有项目列表、项目切换、跨项目状态展示。
- Plugin 还没有把当前 Codex 项目与本机 Alembic 多项目 registry / 项目 daemon 做完整 handoff。
- file monitor / JobStore / internal AI jobs 需要被验证为严格按项目隔离，不串项目。

## 非目标

当前不做：

- 不马上删除 Plugin 内嵌 `dashboard/dist`。
- 不马上删除 `runtimeBoundary` 兼容输出。
- 不把 Dashboard 前端源码迁回 Plugin。
- 不把 Alembic daemon / ProjectRegistry / file monitor / JobStore / internal AI jobs 迁给 Plugin。
- 不把 AlembicAgent 改成 Codex host-agent route。
- 不在本确认文档中派发代码任务。
- 不把 `BiliDili` 纳入日常开发；只有真实项目 smoke 明确需要时才加入。
- 不强制把所有项目塞进一个单进程 daemon；完整多项目能力优先按全局控制面 + 每项目隔离 daemon 设计。若后续要改成单 daemon 多租户，必须另开架构确认。

## 影响范围

最终覆盖窗口：

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>暂停 | 需要在多项目阶段补 public contract：project registry summary、project runtime summary、project daemon status / capability types。 |
| `Alembic`<br>暂停 | 需要实现多项目控制面：project list/status/start/stop、daemon handoff、per-project job/file-monitor/internal-AI 隔离验证。 |
| `AlembicPlugin`<br>观察中 | 等待上游多项目 API 稳定后，消费当前 Codex 项目 identity，handoff 到正确 Alembic project daemon / Dashboard。 |
| `AlembicDashboard`<br>观察中 | 等待上游多项目 API 稳定后，增加项目列表、项目切换、项目 runtime status 展示，不实现后端策略。 |
| `AlembicAgent`<br>观察中 | 当前不派发；只在 internal AI runtime / tool / terminal / sandbox contract 需要变化时介入。 |
| `BiliDili`<br>无任务 | 当前不派发；真实项目 smoke 阶段才考虑只读验证。 |

## 依赖链判断

| 上游产出 | 生产窗口 | 消费窗口 | 派发判断 |
| --- | --- | --- | --- |
| canonical runtime project identity contract | `AlembicCore` | `Alembic`、`AlembicPlugin`、`AlembicDashboard` | 单项目 identity 已完成；多项目 summary contract 仍需 Core 先补。 |
| 多项目 ProjectRegistry / daemon control API | `AlembicCore`、`Alembic` | `AlembicPlugin`、`AlembicDashboard` | 必须先由 Core / Alembic 生产，消费层等待。 |
| daemon health provider identity / capability | `Alembic` | `AlembicPlugin`、`AlembicDashboard` | 单项目 provider 已完成；多项目聚合 / handoff API 仍需补。 |
| Dashboard product UI | `AlembicDashboard` | `Alembic` server、`AlembicPlugin` handoff / artifact | 先让 Dashboard 消费 canonical identity，再评估 artifact release asset。 |
| internal AI runtime capability | `Alembic`、`AlembicAgent` | `AlembicPlugin` 状态展示、Dashboard UI | 本阶段不改；后续只做边界展示和 route choice。 |
| real project smoke evidence | `BiliDili` | 全链路验收 | 当前无任务，等 live smoke 阶段再决定。 |

## 阶段计划

| 阶段 | 目标 | 前置条件 | 完成标准 | 当前可派发窗口 | 不派发窗口 |
| --- | --- | --- | --- | --- | --- |
| 1：职责与来源边界 | 明确 Plugin first、Alembic enhancement、Dashboard frontend owner、Agent internal AI、Core contract | 用户确认产品路线 | 长期契约已写入，host-agent / internal AI / source 语义不混用 | 已完成 | 全部不派发 |
| 2：Core / Alembic 单项目 provider contract | Core 提供 canonical contract，Alembic daemon health 输出单项目 provider 数据 | 阶段 1 完成 | Core / Alembic 已回填并通过轻量验收 | 已完成 | Plugin / Dashboard 等待消费层 |
| 3：多项目 contract 与控制面设计 | 明确 project registry summary、project runtime summary、daemon control API、handoff URL 和状态枚举 | 用户确认本文件 | Core 输出类型 / helpers，Alembic 输出 API / CLI 计划和最小实现 | `AlembicCore`、`Alembic` | Plugin / Dashboard / Agent / BiliDili |
| 4：Alembic 多项目控制面实现 | 实现项目注册 / 列表 / status-all / start-stop per project / health 聚合，保持每项目 daemon / dataRoot / job 隔离 | 阶段 3 contract 完成 | 两个以上项目可被注册、查询、启动/停止或识别 daemon 状态；state / jobs / file monitor 不串线 | `Alembic`，必要时 `AlembicCore` | Plugin / Dashboard 等待 API 稳定 |
| 5：Plugin / Dashboard 多项目消费 | Plugin 从当前 Codex 项目定位正确 Alembic project；Dashboard 展示项目列表、项目切换、runtime status | 阶段 4 API 稳定 | Plugin handoff 正确项目 daemon / Dashboard；Dashboard 不实现后端策略，只消费 API | `AlembicPlugin`、`AlembicDashboard` | Core / Alembic 只处理反馈缺口 |
| 6：live smoke 与真实项目验证 | 验证 Plugin -> Alembic control plane -> project daemon -> Dashboard -> ghost data root 的真实链路 | 阶段 5 完成 | 至少两个项目 smoke；必要时 BiliDili 只读 smoke；bootstrap / rescan / file change job 均按项目隔离 | 待阶段 5 后判断 | 未确认前不派发 |
| 7：Dashboard artifact / release asset | 明确 Dashboard dist 来源和 Plugin artifact 关系 | 阶段 6 证据 | Plugin 不拥有前端逻辑；dist 保留或替换有明确门槛 | 待阶段 6 后判断 | 未确认前不派发 |
| 8：兼容层与残留删除 | 收缩 `runtimeBoundary` 兼容位置、embedded fallback、重复 artifact 责任 | 阶段 5-7 证据齐全 | 每项删除都有扫描、替代入口和验证 | 待稳定面后判断 | 未确认前不派发 |
| 9：统一验收归档发布检查 | 跨仓库大验收、负向扫描、归档和发布链路检查 | 模块划分稳定 | 五仓库证据齐全，workspace docs 归档，必要 release check 通过 | 待稳定面后判断 | 未确认前不派发 |

## 当前阶段判断

如果用户确认本文，下一步进入阶段 3：`AlembicCore` / `Alembic` 多项目 contract 与控制面设计。

确认前不发送任何提示词。确认后，应新建多项目 contract / control plane 执行文档；旧候选计划 [alembic-runtime-project-identity-wave-3b-consumer-plan-2026-05-18.md](alembic-runtime-project-identity-wave-3b-consumer-plan-2026-05-18.md) 只能作为历史候选，不应直接启用。

## 验证策略

- 阶段 3 最低验证：Core public type / helper tests；Alembic control API / CLI targeted tests；workspace docs verification；dispatch coverage；diff check。
- 阶段 4 多项目控制面验证：两个临时项目的 registry、status-all、start/stop/status、daemon state path、jobs path、dataRoot、file monitor owner 均可区分。
- 阶段 5 消费层验证：Plugin targeted unit / smoke；Dashboard build；确认 UI / route / handoff 消费 API，不复制后端策略。
- 阶段 6 live smoke：Alembic daemon health、Plugin status / dashboard handoff、Dashboard runtime identity / project switch 展示；必要时 BiliDili 只读 smoke。
- 阶段 7 artifact：Dashboard build artifact source、Alembic server handoff、Plugin artifact ownership scan。
- 阶段 8 删除：import scan、negative scan、替代入口验证、代表性 build/check/smoke。
- 阶段 9 大验收：五仓库状态、必要 release / portable / local dev link、真实项目 smoke、归档和索引缩减。

## 风险与确认问题

需要用户确认：

- 是否认可本次最终目标：`Plugin first, Alembic install enhances`，并把本次任务聚焦为 runtime / project identity / frontend ownership / AI source 边界收口。
- 是否认可阶段 3 先派 `AlembicCore` 和 `Alembic` 做完整多项目 contract / control plane，而不是直接派消费层。
- 是否暂缓删除 `runtimeBoundary`、Plugin embedded runtime 和 Plugin `dashboard/dist`，等 live smoke / artifact 证据后再删。

## 窗口分派

当前为确认文档，不是执行派发文档。`暂停` 表示等待用户确认，不代表该窗口永远不参与。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>暂停 | 候选下一波执行窗口；等待用户确认后补多项目 public contract / summary types。 |
| `Alembic`<br>暂停 | 候选下一波执行窗口；等待用户确认后实现多项目控制面与 per-project daemon 管理。 |
| `AlembicPlugin`<br>观察中 | 等待 Core / Alembic 多项目 API 稳定后再消费，不提前派发。 |
| `AlembicDashboard`<br>观察中 | 等待 Core / Alembic 多项目 API 稳定后再消费，不提前派发。 |
| `AlembicAgent`<br>观察中 | 本阶段不涉及 internal AI runtime，该窗口不参与本阶段执行。 |
| `BiliDili`<br>无任务 | 本阶段不做真实项目 smoke，该窗口不参与本阶段执行。 |

## 可复制提示词

发送给：无

```text
等待用户确认 docs/workspace/alembic-plugin-first-runtime-boundary-goal-stage-confirmation-2026-05-18.md 的最终目标与阶段计划；当前不派发执行窗口。
```

不发送给：`AlembicCore`（暂停）、`Alembic`（暂停）、`AlembicPlugin`（观察中）、`AlembicDashboard`（观察中）、`AlembicAgent`（观察中）、`BiliDili`（无任务）。

## 回填区

### 用户确认

- 状态：未确认
- 确认时间：
- 用户调整：

### 确认后第一波

- 候选启动文档：待新建 `docs/workspace/alembic-multi-project-control-plane-wave-1-workspace-plan-2026-05-18.md`
- 候选发送窗口：`AlembicCore`、`Alembic`
- 候选观察窗口：`AlembicPlugin`、`AlembicDashboard`、`AlembicAgent`
- 候选无任务窗口：`BiliDili`
