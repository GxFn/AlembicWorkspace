# Alembic Final Goal And Stage Roadmap

状态：长期路线图
维护窗口：AlembicWorkspace
适用范围：`AlembicCore`、`Alembic`、`AlembicPlugin`、`AlembicDashboard`、`AlembicAgent`、`AlembicTest`

本文件只记录长期产品方向。用户发布较大任务目标时，必须另建任务级“最终目标 + 阶段计划确认”文档，等待用户确认后再派发；流程见 [../goal-stage-confirmation/process.md](../goal-stage-confirmation/process.md)。

## 最终目标

Alembic 的最终形态是 `Plugin first, Alembic install enhances`：

- `AlembicPlugin` 是 Codex host agent 的第一入口，负责 Codex MCP、skills、marketplace/channel、host-agent route、Dashboard URL handoff、portable runtime packaging 和安装验证。
- `Alembic` 是本地增强底座，负责 CLI、daemon、HTTP/API、Dashboard server、ProjectRegistry、多项目控制面、每项目 daemon / dataRoot 隔离、file monitor、JobStore、internal AI jobs、本地安装、dev link 和 release 主线。
- `AlembicCore` 提供 headless canonical contract 和确定性共享能力，避免 Alembic / Plugin / Dashboard 各自复制 runtime shape、project identity、capability 或 source contract。
- `AlembicDashboard` 是前端产品所有者，只消费 API / capability / runtime identity 并展示状态，不实现 daemon policy、ProjectRegistry、file monitor、JobStore 或 internal AI 决策。
- `AlembicAgent` 是 Alembic internal AI runtime，负责 AI provider、tool execution、terminal / sandbox、context / memory / prompt、Tool V2；不承接 Plugin 的 Codex host-agent route。
- `AlembicTest` 是真实项目 smoke、扫描、接入验证、冷启动监控和复现报告的执行窗口；总控只分派和验收，不直接执行测试。

终局体验：

- 未安装 `Alembic` 时，Plugin 能通过 Codex host agent 完成基础 cold-start、rescan、Guard、search、submit 和 Dashboard handoff。
- 安装 `Alembic` 后，Plugin 优先复用本机 Alembic daemon / CLI / API / Dashboard server，获得后台任务、多项目 registry / 控制面、每项目运行隔离、文件监控和 internal AI 增强。
- 两条线写入同一个 project identity / ghost data root / Recipe 数据模型，不形成两套割裂数据。

## 完成定义

整个方向只有同时满足以下条件，才算完成：

- 入口清楚：Plugin 是 Codex 入口；Alembic 是本地增强底座；Dashboard 是前端产品；Agent 是 internal AI runtime；Core 是 headless contract。
- contract 清楚：project identity、runtime capability、source、workflow、file monitor、job、Dashboard handoff 等共享字段有 Core 或明确 owner，不在消费层重复造长期 shape。
- 运行清楚：Alembic daemon health、local install、embedded plugin runtime fallback、Dashboard URL handoff、internal AI jobs 的 route choice 能被 Plugin / Dashboard 正确消费和展示。
- 多项目清楚：Alembic 能注册、列出、选择、启动、停止和查询多个项目；每个项目独立 dataRoot / daemon state / jobs / file monitor / Dashboard handoff；Dashboard 能切换项目，Plugin 能从当前 Codex 项目 handoff 到正确项目。
- 前端清楚：Dashboard 源码只归 `AlembicDashboard`；Alembic 负责服务或代理 Dashboard；Plugin 只打包或跳转，不拥有前端逻辑。
- fallback 清楚：Plugin embedded runtime、`runtimeBoundary` 兼容位置、`dashboard/dist` 内嵌 artifact 等都标明保留原因、删除条件和验证门槛。
- 验证清楚：每个阶段有 build / smoke / targeted tests；稳定面完成后有跨仓库大验收、负向扫描、真实项目 smoke、归档和必要发布链路检查。

## 阶段路线

### 阶段 1：职责与来源边界

目标：

- 明确 `host-agent`、`alembic-agent`、domain source、AI provider config 的区别。
- 明确 Plugin first 路线、Alembic 本地增强路线、Dashboard 前端所有权和 Agent internal AI runtime 归属。

完成标准：

- 长期契约写入 [alembic-plugin-first-enhancement-contract.md](alembic-plugin-first-enhancement-contract.md)。
- Plugin 不再被要求拥有 internal AI runtime 或 Dashboard 前端源码。
- Agent 不承接 Codex host-agent route。

当前状态：已完成，继续作为所有后续 wave 的判断底线。

### 阶段 2：Core / Alembic provider contract

目标：

- 把 runtime capability、project identity、file monitor、job、Dashboard handoff 等可共享 contract 收敛到 Core 或 Alembic provider。
- Alembic daemon health 成为 Plugin / Dashboard 的主要消费面。

完成标准：

- `AlembicCore` 提供 headless runtime capability 和 project identity contract。
- `Alembic` daemon health 使用 Core contract 输出 canonical identity / capabilities。
- `runtimeBoundary` 只作为 Alembic-owned attribution / handoff 摘要，不再作为 canonical identity 唯一来源。

当前状态：Wave 3A 已完成 provider 链路，待消费层验证。

### 阶段 3：多项目 contract 与控制面设计

目标：

- 明确完整多项目运行模型的 public contract：project registry summary、project runtime summary、daemon status、handoff URL、capability 和错误状态。
- `AlembicCore` 提供 headless types / helpers，`Alembic` 提供对应 API / CLI 设计与最小实现入口。

完成标准：

- Core contract 足以让 Alembic / Plugin / Dashboard 共享同一套多项目 status shape。
- Alembic API / CLI 明确支持项目列表、status-all、per-project start / stop / health / handoff。
- Plugin / Dashboard 消费层被标为等待上游，不提前复制临时 shape。

当前状态：等待任务级确认；确认后应先派 `AlembicCore` 和 `Alembic`。

### 阶段 4：多项目控制面与运行隔离

目标：

- 让 Alembic 形成真实可用的多项目控制面：注册、列表、选择、status-all、start/stop per project、health 聚合和 Dashboard handoff。
- 验证 ProjectRegistry、ghost data root、file monitor、jobs 和 Dashboard handoff 在每项目真实运行中一致。

完成标准：

- 至少两个项目可以注册、查询、启动 / 停止 daemon、查看独立 health。
- 每个项目的 state / pid / jobs / dataRoot / Dashboard handoff 可区分且不串线。
- 有 CLI / HTTP API / Core contract 的 targeted tests。

当前状态：未启动；应在任务级确认后先补 Core / Alembic contract 与控制面，再派消费层。

### 阶段 5：Plugin / Dashboard 多项目消费

目标：

- `AlembicPlugin` 从当前 Codex 项目定位正确 Alembic project identity，handoff 到正确项目 daemon / Dashboard。
- `AlembicDashboard` 展示项目列表、项目切换、项目 runtime status，不实现后端策略。

完成标准：

- Plugin status / diagnostics / dashboard handoff 与当前项目匹配。
- Dashboard 能展示多个项目摘要，切换后请求正确项目 API / handoff。
- 消费层不复制 ProjectRegistry 或 daemon control policy。

当前状态：未启动；等待 Core / Alembic 多项目 API 稳定。

### 阶段 6：运行链路 live smoke

目标：

- 证明 Plugin -> Alembic control plane -> project daemon -> Dashboard -> data root 的真实运行链路可用。

完成标准：

- 完成 Alembic daemon health live smoke。
- 完成 Plugin `alembic_codex_status` / `alembic_codex_dashboard` 轻量 live smoke。
- 完成 Dashboard project switch / runtime chip / project identity 展示 smoke。
- 必要时由 `AlembicTest` 使用目标真实项目做只读 smoke，不修改真实项目业务代码。

当前状态：未启动。

### 阶段 7：Dashboard artifact 与发布边界

目标：

- 明确 Dashboard build artifact / release asset 的所有权和交付路径。
- Plugin 不维护 Dashboard 源码；只消费 URL、release asset 或必要 artifact。

完成标准：

- `AlembicDashboard` 产出可识别来源版本的 build artifact 或 release asset。
- `Alembic` 能服务或代理 Dashboard artifact。
- `AlembicPlugin` 的 `dashboard/dist` 保留或删除有明确条件；未满足条件前不删除。

当前状态：已完成边界声明，未完成 release asset 替换。

### 阶段 8：兼容层收敛与冗余删除

目标：

- 在真实消费和 live smoke 通过后，收缩过渡兼容层。

候选：

- `capabilities.runtimeBoundary` 兼容位置。
- Plugin embedded runtime 中被 Alembic daemon API 覆盖的 JobStore / file monitor / checkpoint fallback。
- Plugin 内嵌 Dashboard dist 的构建职责。

完成标准：

- 每个删除都有 import scan、替代入口、代表性 build/check/smoke。
- 不删除 CLI、daemon、HTTP/API、Dashboard server、Codex MCP、Skill、channel、release 或本地增强底座仍在使用的能力。

当前状态：未启动；必须等阶段 5、6、7 证据齐全后再做。

### 阶段 9：总体验收、归档与发布链路

目标：

- 对稳定面做跨仓库最终验收，而不是每个小 wave 都做大归档。

完成标准：

- 五个 Alembic 仓库状态干净，必要的 vendor / runtime snapshot / release asset 指针明确。
- Core / Alembic / Plugin / Dashboard / Agent 的 build、targeted tests、public API / consumer import scans、Plugin smoke、Dashboard build 通过。
- 真实项目 smoke 按需完成。
- workspace 文档归档，`docs/workspace/index.md` 缩减到当前入口和长期文档。

当前状态：未启动；等模块划分和核心开发稳定后统一执行。

## 当前定位

当前任务派发已暂停；历史任务级目标阶段文档从 [workspace-record-map.md](workspace-record-map.md#archive-topics) 的 `plugin-first-enhancement` 归档主题查询。

确认前当前计划发送给：

- 无

不应发送给：

- `AlembicCore`：候选下一波执行窗口，但需用户先确认目标和阶段。
- `Alembic`：候选下一波执行窗口，但需用户先确认目标和阶段。
- `AlembicPlugin`：等待 Core / Alembic 多项目 API 稳定。
- `AlembicDashboard`：等待 Core / Alembic 多项目 API 稳定。
- `AlembicAgent`：本阶段不涉及 internal AI runtime。
- `AlembicTest`：本阶段不做真实项目 smoke。

## 调度要求

- 每个新 wave 必须在背景中说明它服务于哪个阶段、完成后推进哪个阶段。
- 如果某个 wave 只解决局部字段或兼容层，必须写明它与最终目标的关系，避免局部优化偏离路线。
- 如果发现阶段顺序有 producer / consumer 依赖，必须先派 producer，consumer 标为 `阻塞` 或 `观察中`，不得提前并行。
- 如果总控判断需要跳阶段，必须说明原因、风险和回退条件。
