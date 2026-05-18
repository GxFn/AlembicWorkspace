# Requirement Design: Alembic Multi Project Control Redesign

日期：2026-05-18
状态：需求设计完成，目标阶段已确认，Wave 1 待启动
维护窗口：AlembicWorkspace

## 原始计划书

- 原始计划书：[original-plan-2026-05-18.md](original-plan-2026-05-18.md)
- 原始计划书确认状态：已确认
- 用户确认时间：2026-05-18 23:01 CST

## 用户需求

```text
Codex 插件作为入口，AlembicPlugin 从 Codex host agent 当前项目上下文开始项目，默认 Ghost 模式；Alembic 通过 Ghost 模式和全局配置管理这些从插件入口初始化的项目。多项目能力要明确如何表示、如何切换，以及切换时哪些内容要切换和重连。

AlembicPlugin 如果发现 Alembic 当前切换的不是自己的 Codex host project，就默认和 Alembic 断开连接或显示 handoff mismatch。Dashboard 切换项目时的操作可以后续决定。每个项目都应该独立，缺失 / 移动 / 不可用项目状态可以保留。BiliDili 不进入默认实现范围。
```

## 需求明确性检查

- 用户场景：用户从 Codex 插件进入某个真实项目，Plugin 默认 Ghost 初始化；随后用户可以在 Alembic 本体中看到多个已注册项目、查看状态、打开或切换项目运行环境，并保持项目隔离。
- 完整功能闭环：Plugin 注册 / 初始化项目 -> Core 记录项目身份和 Ghost dataRoot -> Alembic 列出和控制项目 -> Dashboard 展示和切换项目 -> jobs / file monitor / internal AI / caches 都落到目标项目 -> Plugin 只对当前 Codex host project 保持连接。
- 输入：Codex host project root、CLI 指定 projectRoot / projectId、Dashboard 选择的 projectId、全局 registry、各项目 daemon state。
- 输出：项目列表、项目状态、项目选择 / handoff 状态、daemon / Dashboard URL、jobs / file monitor / internal AI 状态、missing / unavailable / mismatch 诊断。
- 状态 / 数据变化：新增 registry 项目元数据、项目最近打开 / 初始化来源 / 可用性状态；每个项目独立 daemon state、JobStore、file monitor subscription、internal AI config、Ghost dataRoot 和 UI cache key。
- 生产方：`AlembicCore` 生产项目身份和 registry contract；`Alembic` 生产多项目控制 API / CLI / daemon status；`AlembicPlugin` 生产 Codex host project 初始化和 mismatch 信号；`AlembicDashboard` 消费项目控制 API 并切换显示目标。
- 消费方：CLI、Dashboard、Plugin status / dashboard handoff、internal AI jobs、file monitor 和后续真实项目 smoke。
- 验证方式：Core contract 单测；Alembic projects CLI / API smoke；Plugin current-host-project mismatch 单测；Dashboard 切换后 API target / cache reset 测试；每波最低 build / lint / smoke。
- 完成定义：用户能从 Codex 插件初始化多个 Ghost 项目，并由 Alembic 本体可靠列出、打开、切换、诊断和控制；任一项目的 daemon、jobs、file monitor、internal AI 和 Dashboard 状态不会串到其它项目；Plugin 不承担多项目切换。
- 仍不明确的问题：Dashboard 最终采用“全局 Dashboard 内切 API target”还是“跳转目标项目 daemon Dashboard URL”，可在 API contract 完成后由 Dashboard 阶段二选一实现。

## 调研范围

- 必读仓库：`AlembicCore`、`Alembic`、`AlembicPlugin`、`AlembicDashboard`、`AlembicAgent`
- 观察仓库：`BiliDili`
- 暂不纳入仓库：`BiliDili` 不进入默认开发任务，仅作为后续真实项目 smoke 候选。
- 关键入口文件：
  - `AlembicCore/src/shared/ProjectRegistry.ts`
  - `AlembicCore/src/shared/WorkspaceResolver.ts`
  - `AlembicCore/src/daemon/DaemonState.ts`
  - `AlembicCore/src/daemon/JobStore.ts`
  - `AlembicCore/src/daemon/RuntimeContracts.ts`
  - `Alembic/lib/cli/SetupService.ts`
  - `Alembic/bin/cli.ts`
  - `Alembic/lib/daemon/DaemonSupervisor.ts`
  - `Alembic/bin/daemon-server.ts`
  - `Alembic/lib/http/routes/daemon.ts`
  - `Alembic/lib/http/routes/jobs.ts`
  - `Alembic/lib/daemon/RuntimeBoundary.ts`
  - `Alembic/lib/service/evolution/DaemonFileChangeCollector.ts`
  - `AlembicPlugin/lib/codex/ProjectRootResolver.ts`
  - `AlembicPlugin/lib/codex/StatusService.ts`
  - `AlembicPlugin/lib/codex/EnhancementRoute.ts`
  - `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts`
  - `AlembicPlugin/lib/cli/SetupService.ts`
  - `AlembicPlugin/lib/daemon/DaemonSupervisor.ts`
  - `AlembicDashboard/src/api.ts`
  - `AlembicDashboard/src/App.tsx`
  - `AlembicDashboard/src/types.ts`
  - `AlembicAgent/src/agent/runtime/AgentRuntimeBoundary.ts`
  - `AlembicAgent/src/agent/service/AgentRuntimeBuilder.ts`
  - `AlembicAgent/src/tools/core/ToolCallContext.ts`
- 关键测试 / 脚本：各仓库现有 `npm run build:check`、Plugin status / route 单测、Dashboard API 类型测试；具体命令在任务级确认文档中按仓库列出。
- 底层调研附件：[bottom-capability-dependency-research-2026-05-18.md](bottom-capability-dependency-research-2026-05-18.md)
- 代码实现依赖调研：[code-implementation-dependency-research-2026-05-18.md](code-implementation-dependency-research-2026-05-18.md)

## 外部调研判断

- 是否需要联网：否。
- 判断理由：本需求首先是 Alembic 本地多项目运行模型和跨仓库边界设计，当前本地代码已提供 registry、Ghost dataRoot、daemon state、JobStore、Plugin Codex host project resolver、Dashboard runtimeBoundary 等真实事实；外部资料无法替代这些已有 contract。
- 若需要，优先来源：后续若涉及 OS-level daemon manager、系统托盘、多进程服务发现或跨用户安全隔离，再查官方文档或成熟项目实现。
- 若不需要，说明原因：当前阶段只设计产品内 project control plane，不引入外部 daemon manager 或云端多租户。
- 外部结论如何约束或启发本地实现：本轮不引入外部结论；约束来自本地代码事实和用户确认边界。

## 真实代码事实

### AlembicCore

- 已有能力：
  - `ProjectRegistry` 已有全局 `~/.asd/projects.json`，按真实路径生成稳定 `projectId`，记录 `id / ghost / createdAt`，可 `register / inspect / list`。
  - `WorkspaceResolver.fromProject(projectRoot)` 已能根据 registry 判断 `standard` 或 `ghost`，并统一给出 `dataRoot`、`runtimeDir`、`databasePath`、knowledge dirs 和 `toFacts()`。
  - `resolveDaemonPaths(projectRoot)`、`DaemonState`、`JobStore` 都基于 `WorkspaceResolver`，因此天然具备 per-project runtimeDir / jobsDir / statePath。
  - `RuntimeContracts` 已有单项目 runtime identity、capability summary 和 boundary contract。
- 关键文件：`ProjectRegistry.ts`、`WorkspaceResolver.ts`、`DaemonState.ts`、`JobStore.ts`、`RuntimeContracts.ts`
- 缺口：
  - registry 条目过薄，没有 displayName、初始化来源、lastSeen / lastOpened、missing / unavailable、plugin marker 汇总、health summary 或 active/selected 语义。
  - 没有项目列表 summary、project target resolver、selection / handoff / mismatch 的 canonical contract。
  - RuntimeContracts 是单项目 contract，没有多项目控制面用的 project list / project status / switch result 类型。

### Alembic

- 已有能力：
  - `SetupService` 支持 Ghost 初始化；Ghost 模式注册项目并把运行时、知识库、db、recipes 等写入 `~/.asd/workspaces/<projectId>`。
  - CLI `setup --ghost`、`daemon start/status/stop -d <path>`、`ui -d <path>` 都能针对一个项目运行。
  - CLI `ghost status/on/off/list/clean` 能查看和调整 registry，但仍是 Ghost 维护工具，不是完整多项目控制面。
  - `DaemonSupervisor` 一次只处理一个 `projectRoot`；健康检查会严格匹配 projectRoot、dataRoot、projectId、version、databasePath、schemaMigrationVersion 和 mode。
  - `daemon-server` 通过 `ALEMBIC_PROJECT_DIR` 启动单项目容器、单项目 file monitor、单项目 JobStore，并写入单项目 daemon state。
  - `/api/v1/daemon/health`、`RuntimeBoundary`、`/api/v1/jobs` 都是当前 daemon 所属单项目语义。
  - `DaemonFileChangeCollector` 绑定一个 `projectRoot`，只收集该项目 git worktree 变化。
- 关键文件：`SetupService.ts`、`bin/cli.ts`、`DaemonSupervisor.ts`、`daemon-server.ts`、`routes/daemon.ts`、`routes/jobs.ts`、`RuntimeBoundary.ts`、`DaemonFileChangeCollector.ts`
- 缺口：
  - 没有 `projects` CLI / HTTP API 来列出、诊断、打开、启动、停止所有 registry 项目。
  - 没有全局 selectedProject / dashboard handoff contract，也没有“Plugin host project mismatch”可读信号。
  - 没有 status-all 汇总；项目 missing / moved / stale daemon 的保留和 clean / unregister 策略未产品化。
  - `ui` 仍是单项目 Dashboard server，没有多项目入口或跳转目标项目 dashboard 的控制能力。

### AlembicPlugin

- 已有能力：
  - `ProjectRootResolver` 只解析一个 Codex 当前项目根：显式参数、`ALEMBIC_PROJECT_DIR`、`CODEX_WORKSPACE_DIR`、`CODEX_WORKSPACE_ROOT`、saved project root 等；不可信 fallback 会要求显式 `projectRoot`。
  - `CodexMcpServer` 构造时绑定一个 `projectRoot`，工具调用传入 `projectRoot` 时只是创建 scoped server 处理该单项目。
  - `alembic_codex_init` 和 on-demand init 默认 `ghost: true`，除非用户显式 `standard: true`。
  - `openDashboard`、`enqueueJob`、`readJob`、`callDaemonTool` 都调用 `ensureEnhancementDaemon(projectRoot)`，围绕当前 host project 的 daemon / HTTP / jobs 工作。
  - `StatusService` 已把 registry、workspace、daemon、enhancementRoute、projectRootResolution 和 Codex init marker 汇总到单项目 status。
  - `EnhancementRoute` 已区分 Codex host-agent route、embedded plugin runtime、local Alembic daemon / install、internal AI provider。
- 关键文件：`ProjectRootResolver.ts`、`CodexMcpServer.ts`、`StatusService.ts`、`EnhancementRoute.ts`、`SetupService.ts`、`DaemonSupervisor.ts`
- 缺口：
  - 没有读取 Alembic multi-project selectedProject / handoff 状态并判断与 Codex host project 是否 mismatch。
  - 当前 `projectRoot` 参数仍允许任意 scoped 调用，需要在多项目需求中明确：它只能作为显式 current-host-project 修正，不是插件端项目切换 UI。
  - Dashboard handoff 只返回当前项目 daemon URL，没有表达“当前 Alembic 选中其它项目，因此 Plugin disconnected / mismatch”。

### AlembicDashboard

- 已有能力：
  - `api.fetchData()` 通过 `/knowledge`、`/ai/config`、`/modules/project-info`、`/daemon/health` 组合单项目 `ProjectData`。
  - `normalizeRuntimeBoundary()` 已能从 daemon health / project-info 中抽取 projectRoot、dataRoot、projectId、workspaceMode、daemon、dashboard、fileMonitor、jobs、internalAi 和 hostAgentRoute。
  - `App.tsx` 已把 SPM scan results、selected target、guard audit、自定义目录等缓存 key 绑定 `data.projectRoot`，说明 UI 已有项目切换后重载缓存的局部基础。
  - Jobs、scan、chat、candidates refine 等 API 目前全部默认调用同源 `/api/v1`，语义是当前 daemon 项目。
- 关键文件：`api.ts`、`types.ts`、`App.tsx`、`components/Layout/Header.tsx`、`components/Views/JobsView.tsx`
- 缺口：
  - 没有 project list / switch API 消费模型，也没有全局项目选择器。
  - API client `baseURL` 固定为 `/api/v1`，若采用全局 Dashboard 内切 API target，需要引入可切换 target；若采用跳转目标项目 Dashboard URL，则需要明确 URL handoff 和状态刷新。
  - 部分 localStorage key 是全局的，例如语言、主题、auth、chat topics；需要区分哪些保持全局，哪些必须 project-scoped。
  - EventSource / long-running stream 在切换项目时必须 abort / close / reconnect，目前没有统一项目切换清理层。

### AlembicAgent

- 已有能力：
  - `AgentRuntimeBoundary` 明确 `runtimeLine: 'alembic-internal-ai'`，`hostAgentRouteSupported: false`；Codex MCP / marketplace / host-agent route 保持 Plugin-owned。
  - `AgentRuntimeBuilder` 和 `AgentRuntime` 都接受 `projectRoot` / `dataRoot`，ToolExecutionPipeline 将二者传入 `ToolCallContext.runtime`。
  - `ToolCallContext` 明确含 `projectRoot` 和可选 `dataRoot`；Tool V2 terminal handler 将 cwd 限制在 `projectRoot` 内，sandbox executor 由宿主注入。
  - terminal / code / knowledge 等工具都以 `ctx.projectRoot` 或 `ctx.dataRoot` 为边界。
- 关键文件：`AgentRuntimeBoundary.ts`、`AgentRuntimeBuilder.ts`、`AgentRuntime.ts`、`ToolExecutionPipeline.ts`、`ToolCallContext.ts`、`tools/v2/handlers/terminal.ts`
- 缺口：
  - Agent 不应参与 Codex host-agent route；本需求只需保证 Alembic 在启动 internal AI jobs 时传入正确 projectRoot / dataRoot。
  - 需要在 Alembic 侧验证多项目切换不会复用 Agent runtime、memory、terminal session 或 sandbox context。

### BiliDili

- 是否纳入：不纳入默认执行。
- 理由：用户已确认 `BiliDili` 不进入本需求默认设计 / 执行范围；后续只在稳定面之后作为真实项目 smoke 候选，且默认只读验证。

## 目标能力设计

- 最终能力：
  - Alembic 拥有一个清晰的多项目控制面，能从全局 registry 识别所有 Ghost / standard 项目，显示每个项目的状态，并对指定项目启动、停止、打开、诊断 daemon / Dashboard / jobs。
  - 本阶段只实现单 active runtime 切换模型：同一时间只有一个项目 runtime 处于当前连接 / 操作状态；切换项目时先关闭当前 runtime，再启动目标项目 runtime。后续可在不推翻绑定模型的前提下扩展为多项目同时显示或多 runtime 并发。
  - Plugin 仍只是 Codex host agent 当前项目入口：初始化当前项目、展示当前项目状态、打开当前项目 handoff；如果 Alembic 当前 selectedProject 不是 hostProject，Plugin 显示 disconnected / handoff mismatch。
  - Dashboard 作为 AlembicDashboard 产品 UI，消费 Alembic 的项目控制 API，提供项目列表和切换入口；切换时必须重连目标项目 API 或跳转目标项目 Dashboard。
- 用户体验：
  - 在 Codex 当前项目中调用 Plugin 初始化，默认 Ghost，不污染项目仓库。
  - 打开 Alembic / Dashboard 后能看到项目列表：名称、路径、Ghost dataRoot、初始化来源、最近使用、daemon 状态、jobs、file monitor、internal AI、missing / stale / mismatch。
  - 切换项目必须显式选择项目，不靠隐式 cwd 猜测；切换时展示“正在连接目标项目 / daemon stopped / missing / mismatch”等状态。
- 功能闭环：
  - `ProjectRegistry` 记录项目 -> `WorkspaceResolver` 解析 dataRoot -> `Alembic` 汇总 status-all -> CLI / HTTP 提供项目控制 -> Dashboard 选择 / 打开项目 -> Plugin 只检查 hostProject 与 selectedProject 是否一致。
- 前置基础建设：
  - 需要先把“可切换项目运行上下文”抽取成稳定整体，而不是在 Dashboard、jobs、file monitor、internal AI、daemon、Plugin handoff 中各自散着传 `projectRoot`。
  - 第一阶段必须先调研真实底层实现和依赖关系，产出 dependency map、per-project/global 分类和真实解耦点；不把接口抽象、空 adapter 或类型占位作为第一步产物。
  - 同项目的 Plugin 入口、Codex host project、真实项目目录、Ghost dataRoot、runtimeDir、daemon state、JobStore、file monitor、internal AI context、Dashboard/API handoff 和知识库文件位置必须绑定为一个项目整体。
  - 建议建立两层概念：`ProjectRuntimeTarget` 表示要切换到的目标项目，`ProjectRuntimeScope` 表示该项目绑定的一整组运行能力，包括 `WorkspaceResolver` facts、daemon paths/state、JobStore、Dashboard/API handoff、file monitor subscription、internal AI config/context、runtimeBoundary 和缓存隔离 key。
  - 切换动作只允许从一个完整 `ProjectRuntimeScope` 切到另一个完整 `ProjectRuntimeScope`；本阶段切换顺序是关闭当前 runtime、断开 Dashboard/API stream、停止或忽略当前项目运行状态，然后启动目标项目 runtime 并重连 handoff。不能只改 selectedProject，却继续复用旧项目的 daemon、stream、job store、internal AI runtime 或 UI cache。
  - 已发现的硬边界：`ServiceContainer.initialize()` 明确禁止同一进程内切换项目；`PathGuard`、database、JobStore、ToolContextFactory、AgentRuntimeBuilder 和 file monitor timer 都是项目绑定能力，因此实际解耦方向应是 per-project daemon/container/scope + global control-plane 聚合，不是在一个项目容器里重绑 projectRoot。
- 模块边界：
  - `AlembicCore`：project registry metadata、project summary / status / target / handoff / mismatch contract、resolver helpers。
  - `Alembic`：multi-project service、`ProjectRuntimeScope` builder、CLI `projects`、HTTP `/api/v1/projects`、daemon control、selectedProject / handoff state、status aggregation。
  - `AlembicPlugin`：Codex host project init/status/dashboard/job tools、mismatch awareness；不做项目切换器。
  - `AlembicDashboard`：项目列表、项目状态、切换 UI、target API / URL reconnect；不实现 backend project discovery。
  - `AlembicAgent`：internal AI runtime contract 观察窗口，确保每个 job 使用 Alembic 传入的 projectRoot / dataRoot。
- 数据 / 状态模型：
  - `hostProject`：Codex host agent 当前项目，只由 Plugin 解析。
  - `selectedProject`：Alembic / Dashboard 当前选中的控制目标，不代表 Codex host project。
  - `daemonProject`：某个 daemon state 所属项目，由 `resolveDaemonPaths(projectRoot)` 和 health identity 校验。
  - `activeProjectRuntime`：当前正在连接 / 操作的唯一项目 runtime；本阶段多项目列表可以展示多个项目 summary，但 active runtime 只允许一个。
  - `ProjectBinding`：同项目绑定整体，包含 Codex host project identity、projectRoot / realpath、Ghost dataRoot、runtimeDir、knowledge / recipes / candidates / skills / wiki 路径、daemon state、JobStore 路径和 Plugin init marker。
  - `ProjectRuntimeTarget`：切换入口接收的目标，可以来自 `projectId`、`projectRoot` 或 registry entry；必须 resolve 成唯一项目，不能模糊匹配。
  - `ProjectRuntimeScope`：已解析且可执行的项目运行上下文，聚合 `ProjectSummary`、workspace facts、daemon status、jobs summary、Dashboard URL、file monitor status、internal AI availability 和隔离缓存 key。
  - `ProjectSummary` 建议字段：`projectId`、`displayName`、`projectRoot`、`projectRealpath`、`mode`、`ghost`、`dataRoot`、`dataRootSource`、`workspaceExists`、`registered`、`initializedBy`、`createdAt`、`lastSeenAt`、`lastOpenedAt`、`status`、`daemon`、`dashboardUrl`、`jobs`、`fileMonitor`、`internalAi`、`flags`。
  - `ProjectConnectionState` 建议枚举：`ready`、`stopped`、`starting`、`stale`、`missing`、`unavailable`、`mismatch`、`disconnected`。
- API / contract：
  - 先由 Alembic 基于真实依赖实现内部 `ProjectRuntimeScope` builder / resolver，确认能聚合真实 daemon、JobStore、file monitor、internal AI 和 Dashboard/API handoff。
  - Core 只沉淀已经被真实实现验证过的多项目 contract 和 metadata helper，不做先行空抽象。
  - Alembic 再基于真实 scope 暴露 `/api/v1/projects`、`/api/v1/projects/:projectId`、`/api/v1/projects/:projectId/daemon/start`、`/daemon/stop`、`/open-dashboard` 或等价 handoff API。
  - CLI 增加 `alembic projects list/status/open/start/stop/clean` 或等价命令，避免继续把 `ghost list` 当产品入口。
  - Plugin status 增加 `hostProject`、`selectedProject`、`connectionState`、`handoffMismatch`。
- UI / handoff：
  - Dashboard 阶段一可先实现项目列表和目标 Dashboard URL handoff；本阶段切换项目按“关闭当前 runtime -> 启动目标 runtime -> 重连 Dashboard/API”的单 active runtime 流程实现。
  - 若同页切 target，必须统一 abort EventSource / fetch、清理 in-flight job / scan / chat 状态、重载 project-scoped cache、更新 runtimeBoundary。
  - 若跳转目标项目 Dashboard URL，当前 Dashboard 仍显示目标 URL / daemon 状态 / missing 诊断。
- 安装 / 发布 / artifact：
  - Plugin artifact 仍不拥有 Dashboard 前端源码和多项目控制面。
  - Alembic 本体作为 local install / daemon / Dashboard server / internal AI 增强底座承载多项目控制。
  - Core contract 需要先发布或本地源码联动，消费层不得复制临时类型。

## 禁止的伪实现

- 不允许只新增 `ProjectSummary` 类型而没有 registry / Alembic service / API 消费。
- 不允许 Plugin 新增“项目切换”参数或 UI 来冒充多项目控制。
- 不允许 Dashboard 只画项目列表静态数据，不连接真实 `/api/v1/projects`。
- 不允许跨项目复用 daemon、JobStore、file monitor collector、internal AI runtime、terminal sandbox context 或 Dashboard stream。
- 不允许自动删除 missing / moved 项目；必须由用户显式 clean / unregister。
- 不允许下游窗口猜 Core contract；Core contract 完成前下游只能观察或基于确认后的 public export 开发。

## 差距分析

| 能力 | 当前状态 | 缺口 | 归属窗口 | 风险 |
| --- | --- | --- | --- | --- |
| 项目 registry metadata | 只有 `id / ghost / createdAt` | 缺 displayName、来源、lastSeen、missing、summary contract | `AlembicCore` | 过度扩 schema 会影响旧 registry 兼容 |
| 多项目 status contract | 只有单项目 runtime identity | 缺 ProjectSummary、ConnectionState、handoff mismatch | `AlembicCore` | 下游如果提前实现会复制临时字段 |
| 底层能力依赖图 | 已发现 container 禁止进程内切项目，ToolContextFactory / AgentRuntimeBuilder / JobStore 等项目绑定 | 需要系统列全 per-project/global/UI-global 能力和真实解耦点 | `Alembic` 主责，总控复核 | 若跳过调研，会把接口抽象误当成解耦 |
| 单 active runtime 切换 | 单项目 daemon / ui 已存在，container 禁止进程内重绑 | 缺关闭当前 runtime、启动目标 runtime、重连 Dashboard/API 的切换编排 | `Alembic` | 如果直接做并发多 runtime，复杂度会提前放大 |
| 可切换项目运行上下文 | 单项目 resolver / daemon paths / JobStore 各自存在 | 缺基于真实依赖的 `ProjectBinding` / `ProjectRuntimeScope` builder 和切换边界 | `Alembic` | 若不先做，Dashboard / jobs / file monitor / internal AI 容易各自切换并串线 |
| 多项目控制 API / CLI | `ghost list` 和单项目 daemon commands | 缺 `projects` 产品入口、status-all、start/stop/open | `Alembic` | 错误顺序会让 Dashboard 无真实数据 |
| Plugin host project mismatch | Plugin 只看当前 projectRoot daemon | 缺 selectedProject 对比和 disconnected / mismatch 输出 | `AlembicPlugin` | 不能把 mismatch 做成项目切换 |
| Dashboard 项目列表 / 切换 | 单项目 `/api/v1` + projectRoot scoped cache | 缺项目列表、切换、stream abort / reconnect | `AlembicDashboard` | 同页切 target 复杂，需先等 API 稳定 |
| Internal AI project isolation | Agent 支持 projectRoot / dataRoot | Alembic 需要确保每个 job 新 runtime / context | `Alembic` + `AlembicAgent` 观察 | 复用 runtime 会造成上下文串线 |
| 真实项目 smoke | BiliDili 可作为真实项目 | 本需求默认不纳入 | `BiliDili` 观察 | 过早纳入会拖慢设计闭环 |

## 后续拆分候选方向

本节只记录需求设计阶段形成的候选方向，不等于最终阶段拆分，也不作为执行派发依据。下一步必须继续深度挖掘真实代码实现、依赖关系、生命周期、共享状态和实际解耦点，再重新拆分目标阶段。

| 候选顺序 | 目标 | 生产窗口 | 消费窗口 | 完成判断 |
| --- | --- | --- | --- | --- |
| 1 | 底层能力实现依赖调研与隔离地图 | `Alembic` | `AlembicCore`、`AlembicPlugin`、`AlembicDashboard`、`AlembicAgent` | 列清 resolver/container/daemon/jobs/file monitor/internal AI/tool/Dashboard stream 的真实依赖、生命周期、共享状态和解耦点；不产出空接口 |
| 2 | Alembic 实际 `ProjectBinding` / `ProjectRuntimeScope` builder 与单 active runtime 切换编排 | `Alembic` | `AlembicCore`、`AlembicPlugin`、`AlembicDashboard` | 基于真实依赖聚合同项目 Plugin/project 文件位置、resolver、daemon paths/state、JobStore、file monitor、internal AI、Dashboard/API handoff；切换时关闭当前 runtime 再启动目标 runtime，不在同一 container 内重绑项目 |
| 3 | Core 沉淀已验证的多项目 contract 和 registry metadata | `AlembicCore` | `Alembic`、`AlembicPlugin`、`AlembicDashboard` | 只把阶段 1-2 验证过的 ProjectSummary / ConnectionState / target/scope summary 下沉到 public export，旧 registry 兼容 |
| 4 | Alembic 多项目控制 service + CLI + HTTP API | `Alembic` | `AlembicDashboard`、`AlembicPlugin` | `projects list/status/start/stop/open` 或等价 API 可 smoke；每项目 daemon/jobs/file monitor 独立 |
| 5 | Plugin hostProject mismatch 与默认 Ghost 入口收口 | `AlembicPlugin` | `Alembic` | Plugin status 能显示 hostProject / selectedProject / mismatch；不做项目切换 |
| 6 | Dashboard 项目列表与切换 / handoff | `AlembicDashboard` | `Alembic` | UI 消费真实项目 API；切换时关闭 stream、刷新 runtimeBoundary、按项目隔离缓存 |
| 7 | Internal AI / file monitor / jobs 隔离验证 | `Alembic`，`AlembicAgent` 观察 | `AlembicDashboard`、`AlembicPlugin` | bootstrap/rescan/file monitor/job list 均按目标项目隔离；Agent 无 Codex host-agent route 侵入 |
| 8 | 统一验收与可选真实项目 smoke | `AlembicWorkspace` 总控 | 全窗口 | 跨仓库 build / smoke / negative scan；需要时再把 `BiliDili` 作为只读真实项目验证 |

## 待确认问题

- 需要用户确认：
  - 是否接受第一阶段先由 Alembic 做底层实现依赖调研与隔离地图，第二阶段做真实 `ProjectRuntimeScope` builder，之后再由 Core 沉淀已验证 contract，避免空抽象。
  - Dashboard 第一版是否优先采用“项目列表 + 打开目标项目 Dashboard URL”的保守 handoff，再评估同页切 API target。
- 需要后续代码验证：
  - registry schema 兼容策略和旧 `projects.json` 自动补字段方式。
  - selectedProject 状态保存位置：全局配置、daemon-less state，或 Dashboard local preference。
  - `ProjectRuntimeScope` 中哪些字段由 Core contract 表达，哪些字段由 Alembic runtime service 实时补充。
  - 同页切 target 时哪些 UI 状态必须 project-scoped，哪些全局保留。
- 不应提前派发：
  - `AlembicCore` 不应在 Alembic 真实依赖调研和 runtime scope builder 之前先做空 contract。
  - `AlembicPlugin`、`AlembicDashboard` 在 Alembic 项目 API 未定前不应开始消费实现。
  - `AlembicAgent` 默认不派发，只在 Alembic internal AI isolation 发现真实缺口时参与。

## 进入深度代码挖掘

- 现有确认文档：`docs/workspace/alembic-multi-project-control-redesign-goal-stage-confirmation-2026-05-18.md`
- 当前状态：该确认文档只保留为候选草案，等待总控继续深度代码挖掘后重写。
- 第一波候选窗口：未定；必须等真实实现依赖地图和解耦点明确后再判断。
- 明确不派发窗口：`Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard`、`AlembicAgent`、`BiliDili` 当前全部暂停；后续也应先按 producer / consumer 依赖链派发，不空转。
