# Alembic Multi Project Control Code Implementation Dependency Research

日期：2026-05-18
状态：深度代码挖掘完成，支撑目标阶段确认
维护窗口：AlembicWorkspace

## 调研结论

本轮没有联网。原因是当前问题不是通用多租户架构选型，而是 Alembic 已有 Ghost、daemon、JobStore、Dashboard、Plugin host-agent 入口和 internal AI runtime 的真实边界重组；本地代码事实已经足够决定第一轮实现顺序。

关键结论：

- 多项目控制不能在同一个 Alembic `ServiceContainer` 进程内重绑 `projectRoot`。Alembic 代码已经显式禁止同进程切项目，正确方向是 per-project daemon / container / runtime scope，再由全局 control plane 聚合和切换。
- `AlembicCore` 已有 registry、Ghost dataRoot、workspace facts、daemon state、JobStore 和单项目 runtime contract，适合沉淀经过 Alembic 实现验证后的 public contract；不适合先做空的多项目抽象。
- `Alembic` 是第一生产方：它已经拥有 CLI、daemon、HTTP、Dashboard server、DaemonSupervisor、JobStore、file monitor、internal AI job runner 和本地安装能力，应该先实现 `ProjectRuntimeControl` / `ProjectRuntimeScope`。
- `AlembicPlugin` 已经按 Codex host project 绑定单项目，默认 Ghost 初始化；它不需要项目切换，只需要在 Alembic 暴露 selected / active project 后显示 `connected / mismatch / disconnected`。
- `AlembicDashboard` 当前是同源 `/api/v1` 单项目客户端。第一版项目切换应优先走目标项目 Dashboard URL handoff 或显式重连流程，不要一上来做复杂的同页多 target API / EventSource。
- `AlembicAgent` 只属于 Alembic internal AI 线，不属于 Codex host-agent route；本需求中它默认观察，只在 Alembic internal AI job 发现 projectRoot / dataRoot 隔离缺口时参与。

## 代码证据

### AlembicCore: registry 和 workspace facts 已存在，但条目过薄

- `AlembicCore/src/shared/ProjectRegistry.ts:1-11` 写明全局项目注册表位置是 `~/.asd/projects.json`，条目只有 `id`、`ghost`、`createdAt`。
- `AlembicCore/src/shared/ProjectRegistry.ts:28-32` 的 `ProjectEntry` 只包含 `id / ghost / createdAt`；没有 displayName、initializedBy、lastSeen、lastOpened、missing、selected 或 health。
- `AlembicCore/src/shared/ProjectRegistry.ts:80-87` 使用 normalized realpath 的 sha256 短 hash 生成稳定 `projectId`。
- `AlembicCore/src/shared/ProjectRegistry.ts:143-178` 的 `inspect(projectRoot)` 已能返回 registered、mode、ghost、projectId、expectedProjectId、dataRoot、workspaceExists 和 ghostMarker。
- `AlembicCore/src/shared/ProjectRegistry.ts:243-249` 的 `list()` 只返回 `projectRoot + entry`，还不是可直接给 Dashboard / Plugin 消费的 `ProjectSummary`。
- `AlembicCore/src/shared/WorkspaceResolver.ts:1-12` 明确 `projectRoot` 是真实源码目录，`dataRoot` 是运行时 / 知识库写入根；Ghost 模式写入 `~/.asd/workspaces/<id>`。
- `AlembicCore/src/shared/WorkspaceResolver.ts:119-143` 的 `toFacts()` 已能生成 runtimeDir、databasePath、knowledgeDir、recipesDir、skillsDir、candidatesDir、wikiDir 等 project facts。

设计含义：Core 已有可靠的项目身份和路径事实来源。下一步不能让每个消费仓库自己拼 registry，而是由 Alembic 先基于这些事实实现真实 control plane，再把被证明需要的 summary / selection / connection contract 下沉到 Core。

### Alembic: 同进程切项目被禁止，daemon 是天然 per-project runtime

- `Alembic/lib/injection/ServiceContainer.ts:77-88` 明确禁止同一进程中切换项目：如果已有 `_projectRoot`，新 root 不一致会抛错，并提示“请为每个项目启动独立进程”。
- `Alembic/bin/daemon-server.ts:43-64` 从 `ALEMBIC_PROJECT_DIR` 或 cwd 解析一个 `projectRoot`，然后 chdir、配置 PathGuard。
- `Alembic/bin/daemon-server.ts:66-78` 用该 `projectRoot` 初始化 Bootstrap 和 ServiceContainer。
- `Alembic/bin/daemon-server.ts:95-104` 启动 HTTP server、项目 file collector、Dashboard mount。
- `Alembic/bin/daemon-server.ts:199-228` 写入 daemon state，包含 projectRoot、dataRoot、projectId、dashboardUrl、databasePath 和 schemaMigrationVersion。
- `Alembic/lib/daemon/DaemonSupervisor.ts:56-100` status 只检查一个 `projectRoot` 对应的 daemon state。
- `Alembic/lib/daemon/DaemonSupervisor.ts:102-178` start 会按 projectRoot 解析 paths、持有该项目 lock、以 `cwd: projectRoot` 和 `ALEMBIC_PROJECT_DIR` 启动 daemon-server。
- `Alembic/lib/daemon/DaemonSupervisor.ts:181-191` stop 只停止该 projectRoot 对应 daemon state。
- `Alembic/lib/daemon/DaemonSupervisor.ts:336-347` health 必须匹配 projectRoot、dataRoot、projectId、version、databasePath、schemaMigrationVersion 和 mode。
- `Alembic/lib/http/HttpServer.ts:252-335` 已挂载 `/api/v1/daemon`、`/api/v1/jobs`、`/api/v1/ai`、`/api/v1/modules` 等单项目路由，但没有 `/api/v1/projects`。

设计含义：多项目切换的底层单元不是“修改当前容器字段”，而是“关闭当前 project daemon / runtime scope，启动目标 project daemon / runtime scope，并重连 API / Dashboard”。Alembic 需要新增独立 control plane，复用 per-project daemon，而不是把现有单项目 daemon 改成多项目容器。

### Alembic: file monitor、job、internal AI 和 tool context 都是项目绑定

- `Alembic/lib/service/evolution/DaemonFileChangeCollector.ts:48-53` 构造时固定 `#projectRoot`。
- `Alembic/lib/service/evolution/DaemonFileChangeCollector.ts:55-78` 只在该项目 git worktree 下启动定时扫描。
- `Alembic/lib/service/evolution/DaemonFileChangeCollector.ts:134-139` 在该 `#projectRoot` 下运行 `git diff` / `git ls-files`。
- `Alembic/lib/injection/modules/AgentModule.ts:58-66` 长生命周期 `ToolContextFactory` 绑定 `resolveProjectRoot(ct)`。
- `Alembic/lib/injection/modules/AgentModule.ts:77-108` `toolRegistry` / `LightweightRouter` 绑定 projectRoot 和 dataRoot。
- `Alembic/lib/injection/modules/AgentModule.ts:151-163` `agentRuntimeBuilder` 绑定 projectRoot 和 dataRoot。
- `Alembic/lib/tools/v2/adapter/ToolContextFactory.ts:114-121` 持有 DeltaCache、SearchCache、Compressor、SessionStore 和 SandboxBridge。
- `Alembic/lib/tools/v2/adapter/ToolContextFactory.ts:127-153` 每次 create 都返回构造时的 `projectRoot` 和长生命周期 cache / sandbox executor。

设计含义：切换项目时必须重建 runtime scope，不能复用旧 scope 中的 ToolContextFactory、router、agentRuntimeBuilder、file collector 或 JobStore。否则 internal AI、terminal sandbox、搜索缓存和 file monitor 可能串项目。

### AlembicPlugin: 入口已经是 Codex host project 单项目绑定

- `AlembicPlugin/lib/codex/ProjectRootResolver.ts:75-124` 只解析一个 Codex project root；来源包括显式参数、环境变量、saved project root 和 fallback。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:86-109` 一个 MCP server 构造时绑定一个 `projectRoot`。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:157-186` 如果 tool call 传入 `projectRoot`，只是新建 scoped server 处理该绝对路径项目；这不是插件端项目切换 UI。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:287-328` `initializeWorkspace` 默认 `standard: args.standard === true`，因此未显式 standard 时返回 `ghost` 模式。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:581-638` `openDashboard()` 为当前 host project ensure daemon，并返回当前项目 dashboardUrl。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:640-691` stop / cleanup 都围绕 `this.projectRoot`。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:693-848` bootstrap / rescan / job / daemon tool proxy 都围绕 `ensureEnhancementDaemon(this.projectRoot)`。

设计含义：Plugin 的职责不应扩展成多项目控制中心。它只需要知道 Alembic 当前 selected / active project 是否等于自己的 host project；不一致时显示 mismatch / disconnected，避免对错误项目投递 host-agent job。

### AlembicDashboard: 当前是单项目同源 API 客户端

- `AlembicDashboard/src/api.ts:35` axios baseURL 固定为 `/api/v1`。
- `AlembicDashboard/src/api.ts:867-920` `fetchData()` 并发读取 knowledge、ai config、project-info、daemon health，组合单个 `ProjectData`。
- `AlembicDashboard/src/api.ts:947-1027` scan target stream 使用固定 `/api/v1/modules/scan/stream` 和同源 EventSource。
- `AlembicDashboard/src/App.tsx:160-196` 已有 projectRoot-scoped sessionStorage key。
- `AlembicDashboard/src/App.tsx:224-253` 项目 root 变化时会加载自定义目录、扫描结果、selected target 和 guard audit 的 project-scoped cache。
- `AlembicDashboard/src/App.tsx:215` 已有 abort controller，但当前没有统一“项目切换时关闭所有 stream / 重连 target API”的抽象。

设计含义：Dashboard 有局部 project-scoped cache 基础，但 API / EventSource 仍绑定当前 daemon 同源。第一版多项目 UI 应优先消费 Alembic projects API 展示项目列表，并通过打开目标项目 Dashboard URL 或显式 handoff 完成切换；若做同页切 target，需要先完成可切换 API client、stream abort 和 cache reset。

### AlembicAgent: internal AI runtime，不是 Codex host-agent route

- `AlembicAgent/src/agent/runtime/AgentRuntimeBoundary.ts:22-28` runtimeLine 是 `alembic-internal-ai`，`hostAgentRouteSupported: false`。
- `AlembicAgent/src/agent/runtime/AgentRuntimeBoundary.ts:48-56` terminal / sandbox 的 policy、manifest、session plan 属于 Agent，真实 process / PTY / sandbox enforcement 属于宿主。
- `AlembicAgent/src/agent/runtime/AgentRuntimeBoundary.ts:83-89` Codex MCP、marketplace、channel packaging 和 host-agent route 明确保持 Plugin-owned。
- `AlembicAgent/src/agent/service/AgentRuntimeBuilder.ts:20-29` builder 接收 projectRoot / dataRoot。
- `AlembicAgent/src/agent/service/AgentRuntimeBuilder.ts:83-102` build runtime 时把 projectRoot / dataRoot 传入 AgentRuntime。
- `AlembicAgent/src/agent/service/AgentRuntimeBuilder.ts:105-113` capability opts 继续携带 projectRoot。

设计含义：本需求不应该让 AlembicAgent 接管 Codex host agent。Agent 只需要保证 Alembic internal AI runtime 在每个项目 scope 内使用正确 projectRoot / dataRoot；如果 Alembic 已正确重建 runtime scope，Agent 默认观察即可。

## 生命周期与依赖地图

### 全局能力

- Project registry：`AlembicCore` 的 `ProjectRegistry` 管理全局 `projects.json`。
- 需求中的 selected / active project：当前不存在，需要 Alembic control plane 新增；存储应与 per-project dataRoot 区分，避免把某个项目的选择状态写进另一个项目。
- Project list summary：当前不存在，需要 Alembic 读取 Core registry、WorkspaceResolver、DaemonSupervisor status 和 plugin marker 汇总。

### 项目绑定能力

- projectRoot / projectRealpath：由 Core registry / resolver 解析。
- dataRoot / runtimeDir / databasePath / knowledge dirs：由 `WorkspaceResolver` 统一提供。
- daemon state / pid / lock / log / jobsDir：由 `resolveDaemonPaths(projectRoot)` 和 DaemonSupervisor 管理。
- JobStore / DaemonJobRunner：跟随 projectRoot / dataRoot。
- file monitor：跟随 daemon 的 projectRoot。
- internal AI / ToolContextFactory / terminal sandbox / caches：跟随 ServiceContainer 的 projectRoot / dataRoot。
- Dashboard server / `/api/v1`：跟随当前 daemon。

### Host 入口能力

- Codex host project：由 AlembicPlugin 在当前 Codex 环境解析。
- Plugin job / dashboard / daemon proxy：只对 host project 生效。
- Plugin mismatch：需要消费 Alembic selected / active project summary 后才能判断。

### Dashboard UI 能力

- 当前 API client：同源单项目。
- project-scoped UI cache：已有部分基础。
- 切换时必须处理：EventSource / fetch abort、runtimeBoundary reload、project-scoped cache load、目标 Dashboard URL handoff 或 API target reconnect。

## 真实设计约束

- 不能同进程切项目：ServiceContainer 直接禁止。
- 不先做 Core 空 contract：Core 应沉淀已验证 contract，避免 consumer 猜字段。
- 不让 Plugin 做项目切换：Plugin 只绑定 Codex host project。
- 不让 Dashboard 自己发现项目：Dashboard 消费 Alembic API。
- 不复用旧项目 runtime scope：tool caches、sandbox、JobStore、file monitor、agent runtime 都绑定项目。
- 不自动删除 missing 项目：项目不可用状态需要保留，clean / unregister 必须显式。
- 本阶段不做多 runtime 并发：实现单 active runtime 的关闭 / 重启 / 重连模型，同时保留未来多项目同时显示的 summary 扩展空间。

## 仓库任务影响

| 仓库 | 结论 |
| --- | --- |
| `Alembic` | 第一生产方。实现 project runtime control foundation、selected / active project state、projects CLI / API、switch orchestration。 |
| `AlembicCore` | 第二阶段沉淀 contract。等 Alembic 证明 ProjectSummary / ProjectRuntimeScope / ConnectionState 字段后再 public export。 |
| `AlembicPlugin` | 下游消费方。等待 Alembic API / Core contract 后补 hostProject mismatch，不做切换器。 |
| `AlembicDashboard` | 下游消费方。等待 projects API 后做 project list / handoff；第一版避免复杂同页 target 切换。 |
| `AlembicAgent` | 观察窗口。只在 internal AI runtime context 隔离缺口被 Alembic 验证出来后参与。 |
| `BiliDili` | 无任务。稳定后可作为只读真实项目 smoke，不进入开发派发。 |

## 下一步

基于本代码调研重写 `docs/workspace/alembic-multi-project-control-redesign-goal-stage-confirmation-2026-05-18.md`，状态改为“等待用户确认”。用户确认前不派发任何执行窗口。
