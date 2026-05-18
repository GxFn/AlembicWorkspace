# Bottom Capability Dependency Research: Alembic Multi Project Control

日期：2026-05-18
状态：初始调研完成，后续实现前继续补证据
维护窗口：AlembicWorkspace

## 目的

本附件用于约束多项目控制的前置工作：先调研真实底层能力实现和依赖关系，再做实际隔离与解耦。不要把第一步做成接口抽象、空 adapter 或类型占位。

本需求里的“可切换”不是把一个运行时对象改几个字段后复用，而是确认哪些能力必须作为一组项目运行上下文独立创建、独立启动、独立停止、独立重连。

## 关键结论

- 当前 Alembic 运行时是单项目绑定模型，不支持同一进程内重绑定到另一个项目。
- `ServiceContainer.initialize()` 已有显式保护：如果同一进程已有 `_projectRoot`，再次传入不同 `projectRoot` 会抛错，提示“请为每个项目启动独立进程”。
- `PathGuard`、`WorkspaceResolver`、database、JobStore、file monitor、ToolContextFactory、AgentRuntimeBuilder、terminal sandbox、CacheCoordinator 和 Dashboard API stream 都是项目运行上下文的一部分。
- 因此多项目切换的正确基础不是“抽象一个接口后让各模块自己切”，而是：
  - 每个项目拥有独立 runtime scope。
  - 本阶段只保持一个 active runtime；切换项目时关闭当前 runtime，再启动目标项目 runtime。
  - Alembic 控制面聚合多个 project scope 的状态，但不要求多个 runtime 同时运行。
  - Dashboard / Plugin 通过 handoff / reconnect 切到目标 scope。
  - 不在一个 project-bound container 内切换到另一个 projectRoot。

## 真实依赖图

```text
ProjectRegistry
  -> WorkspaceResolver.fromProject(projectRoot)
     -> dataRoot / runtimeDir / databasePath / knowledge dirs
     -> resolveDaemonPaths(projectRoot)
        -> DaemonState / JobStore / logs / lock / pid

ALEMBIC_PROJECT_DIR / CLI -d
  -> Bootstrap.configurePathGuard(projectRoot)
  -> Bootstrap.initialize()
     -> WorkspaceSettingsStore.fromProject(projectRoot)
     -> WorkspaceResolver
     -> DatabaseConnection(resolver)
     -> ServiceContainer.initialize({ projectRoot, workspaceResolver })
        -> _projectRoot / _workspaceResolver singletons
        -> InfraModule jobStore / eventBus / bootstrapTaskManager / cacheCoordinator
        -> AgentModule ToolContextFactory / AgentRuntimeBuilder / AgentService
        -> file monitor / internal AI / Dashboard routes
```

## 代码事实

### Bootstrap / PathGuard / WorkspaceResolver

- `Alembic/lib/bootstrap.ts`
  - `Bootstrap.configurePathGuard(projectRoot)` 配置全局 `pathGuard`，且只有在未配置时按 `projectRoot` 初始化。
  - `initializeWorkspaceResolver()` 从 `pathGuard.projectRoot` 创建 `WorkspaceResolver.fromProject(projectRoot)`。
  - Ghost 模式会把 `resolver.dataRoot` 加入 PathGuard allow path。
  - DatabaseConnection 使用 `workspaceResolver`，因此 DB / migrations 已绑定到该项目 dataRoot。
- 影响：
  - 同一进程重绑另一个项目会遇到 PathGuard、resolver、database 的共享状态风险。
  - 解耦方向应是“为目标项目创建新 scope / 新 daemon / 新 container”，不是重配现有全局 guard。

### ServiceContainer

- `Alembic/lib/injection/ServiceContainer.ts`
  - `initialize()` 有多项目防护：已有 `_projectRoot` 且新 `projectRoot` 不同时直接抛错。
  - `_projectRoot`、`_workspaceResolver`、database、config、skillHooks 都写入 singleton。
  - `buildToolContext()` 每次从 container 解析 `projectRoot` / `dataRoot`。
  - `CacheCoordinator` 会订阅 panorama、guard、searchEngine，并在 daemon / API server 长驻进程轮询 DB data_version。
- 影响：
  - 这是强信号：项目隔离的实现边界已经在容器层存在。
  - 多项目控制面不能尝试在同一个 `ServiceContainer` 上切项目。
  - 如果需要全局控制面，它应是 daemon-less / registry-driven 聚合器，或与项目 daemon 分离。

### Daemon / JobStore / Jobs

- `Alembic/lib/daemon/DaemonSupervisor.ts`
  - `start()` 通过 `resolveDaemonPaths(projectRoot)` 计算 state / pid / log / jobs / lock。
  - 启动 `daemon-server.js` 时写入 `ALEMBIC_PROJECT_DIR=projectRoot`，并以 projectRoot 为 cwd。
- `Alembic/bin/daemon-server.ts`
  - 单项目启动：读取 `ALEMBIC_PROJECT_DIR`，初始化 Bootstrap 和 ServiceContainer。
  - 启动单项目 `DaemonFileChangeCollector`。
  - 写入的 daemon state 包含 projectRoot / dataRoot / projectId / databasePath / dashboardUrl。
- `Alembic/lib/daemon/DaemonJobRunner.ts`
  - `getJobStore(container)` 优先取 container 的 `jobStore`，fallback 用 `resolveProjectRoot(container)` 创建。
  - bootstrap / rescan job 直接使用当前 container 执行内部 workflow。
- `Alembic/lib/injection/modules/InfraModule.ts`
  - `jobStore` singleton 用 `new JobStore({ projectRoot: resolveProjectRoot(ct) })`。
  - `bootstrapTaskManager`、`eventBus`、`cacheCoordinator` 都是当前进程 / 当前项目容器内的长生命周期资源。
- 影响：
  - jobs 不是“可改 projectId 的队列”，而是依赖当前 container、taskManager、eventBus、JobStore 的项目实例。
  - 切项目时应切到目标项目 daemon / JobStore，不应迁移或复用旧项目 job runtime。

### File Monitor

- `Alembic/lib/service/evolution/DaemonFileChangeCollector.ts`
  - 构造时固定 `projectRoot` 和 dispatcher。
  - 使用定时器扫描该项目 `.git` worktree。
  - `stop()` 只停止当前 collector 的 timer。
- 影响：
  - file monitor 是 per-project long-lived resource。
  - 切项目必须停止 / 忽略旧项目 collector 的 UI 连接，并连接目标项目 collector 状态；不应把 collector 改绑到新 projectRoot。

### Agent / Tool / Terminal / Sandbox

- `Alembic/lib/injection/modules/AgentModule.ts`
  - `v2ToolContextFactory` singleton 构造时固定 `projectRoot: resolveProjectRoot(ct)`。
  - `toolRegistry` 的 `LightweightRouter` 构造时固定 `projectRoot` 和 `dataRoot`。
  - `agentRuntimeBuilder` 构造时固定 `projectRoot` 和 `dataRoot`。
- `Alembic/lib/tools/v2/adapter/ToolContextFactory.ts`
  - Factory 内部长生命周期持有 `DeltaCache`、`SearchCache`、`OutputCompressor`、`SimpleSessionStore`、`SandboxExecutorBridge`。
  - `create()` 产出的 ToolContext 使用构造时的 `projectRoot`。
  - terminal sandbox profile 使用 `cwd` 和 `projectRoot`。
- `AlembicAgent/src/agent/service/AgentRuntimeBuilder.ts`
  - build runtime 时把 shared `projectRoot` / `dataRoot` 写入 AgentRuntime。
- 影响：
  - internal AI / tools / terminal sandbox 都是项目 scope 的一部分。
  - 多项目隔离不能只在 API 层传 projectRoot；必须确保每个项目使用自己的 ToolContextFactory、router、runtimeBuilder 和 container。

### Dashboard Client / Streams / Cache

- `AlembicDashboard/src/api.ts`
  - `http = axios.create({ baseURL: '/api/v1' })` 是单 API target。
  - 多处 EventSource 直接使用 `/api/v1/.../events/...`。
- `AlembicDashboard/src/App.tsx`
  - 已有部分 project-scoped cache：`asd:spm:*:${projectRoot}`、`asd:custom-folder-targets:${projectRoot}`。
  - `AbortController` 分散在 scan / guard / rescan / chat 等操作中。
- `AlembicDashboard/src/components/Shared/GlobalChatDrawer.tsx`、`AiChatView.tsx`、`SearchModal.tsx`
  - 也有独立 AbortController / localStorage 状态。
- 影响：
  - Dashboard 如果同页切换项目，需要先做 API target / stream / abort / cache 清理层。
  - 更稳的第一版可以是项目列表 + 目标项目 Dashboard URL handoff；同页切 API target 需要明确哪些状态全局保留、哪些 project-scoped。

## 实际隔离与解耦方向

### 项目绑定整体

同一个项目的以下能力必须作为一个绑定整体处理：

- Codex host project / Plugin init marker。
- 真实项目目录 `projectRoot` / `realpath`。
- Ghost `dataRoot`。
- `runtimeDir`、daemon state、pid、log、lock、jobsDir。
- `JobStore`。
- knowledge / recipes / candidates / skills / wiki 文件位置。
- file monitor collector。
- internal AI AgentRuntime / ToolContextFactory / terminal sandbox context。
- Dashboard/API handoff 和 project-scoped UI cache key。

本阶段切换项目时，先关闭当前 runtime 与连接，再启动目标项目 runtime；不能只替换其中某几个路径。

### 必须先完成的调研项

1. 列出所有从 `resolveProjectRoot()` / `resolveDataRoot()` / `_workspaceResolver` 读取项目上下文的服务。
2. 列出所有长生命周期 singleton、timer、EventSource、AbortController、cache 和 session store。
3. 标记每项能力是 per-project、global-control-plane 还是 UI-global。
4. 明确哪些能力只能通过新 daemon / 新 container 隔离，哪些可以通过轻量 status probe 聚合。
5. 找出仍从 `process.cwd()`、`ALEMBIC_PROJECT_DIR` 或全局 `pathGuard` 隐式取项目的路径。

### 解耦原则

- 先做依赖地图和运行时边界，不先做接口抽象。
- `ProjectRuntimeScope` 必须来自真实实现聚合：resolver facts、daemon paths/state、JobStore location、Dashboard URL、file monitor、internal AI、tool runtime、cache key。
- 单项目 daemon / container 不重绑项目。
- 本阶段不做多项目 runtime 同时运行；只做单 active runtime 的关闭 / 重启 / 重连流程。
- 后续若要同时显示多个项目，可以复用 registry + ProjectBinding / ProjectRuntimeScope summary；若要同时操作多个项目，再把多个 runtime 并发启动作为增量能力。
- 多项目控制面只聚合和 handoff，不把多个项目塞进一个已有 project-bound container。
- Dashboard 切换必须先完成 stream abort / API target / project-scoped cache 边界，再做同页切换。

## 阶段调整建议

- 阶段 1：底层能力依赖调研与隔离地图。
  - 产出不是接口，而是 dependency map、per-project/global 分类、真实解耦点和测试目标。
- 阶段 2：Core 只沉淀调研后确认的 contract，避免提前抽象。
- 阶段 3：Alembic 实作 ProjectRuntimeScope builder / projects control plane，基于真实服务边界隔离。
- 阶段 4 以后：Plugin / Dashboard 消费已经落地的控制面。

## 当前必须写入后续派发的禁止项

- 不允许把 `ProjectRuntimeScope` 做成只有类型没有运行时消费的空 contract。
- 不允许把同一 `ServiceContainer` 重绑到另一个项目。
- 不允许复用旧项目 `ToolContextFactory`、AgentRuntimeBuilder、JobStore、file monitor timer 或 Dashboard stream。
- 不允许 Plugin 用 `projectRoot` 参数模拟项目切换。
- 不允许 Dashboard 在没有 stream / cache / API target 清理层前做同页切换。
