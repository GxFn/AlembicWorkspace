# Plugin 与 Alembic 统一 Resident Service 连接方案

状态：已完成，已归档
维护窗口：AlembicWorkspace
创建时间：2026-05-23 21:05 CST
确认时间：2026-05-23 21:22 CST
对应 TODO：`GTODO-2026-05-23-027`

## 用户目标

建立一套更统一、更可解释的 `AlembicPlugin -> Alembic` resident service 连接方式，让 Plugin 继续拥有 Codex-facing MCP / skill / prime / shout 语义，同时把 Alembic 本地安装提供的 daemon、HTTP/API、Dashboard、JobStore、semantic/vector search 和 internal AI jobs 作为显式增强服务消费。

Plugin 不做项目控制，不读取项目列表，不切换 / 启停项目，也不把“文件夹”当作项目单位。项目是 Alembic 主体拥有的语义单位，未来可以由多个文件夹组成；Plugin 只能基于当前 Codex 会话上下文消费自身需要的 resident capability。

## 完成定义草案

- `AlembicCore` 提供稳定 resident service contract、capability、endpoint、错误 / 降级语义和类型出口。
- `Alembic` 作为 resident service producer，在 daemon health / service status 中明确声明可用能力、owner、route、service scope identity、internal AI、jobs、dashboard 和 search 信息。
- `AlembicPlugin` 只有一个统一 service client 负责探测、鉴权、请求、超时、错误分类、能力判断和 telemetry 投影。
- Plugin Codex-facing tools 不转交给 Alembic；`alembic_task prime`、host response、shout、tool policy、skill/marketplace 仍由 Plugin 拥有。
- 不恢复 `/api/v1/mcp/call` 或 daemon MCP bridge。
- 未安装 / 未启动 Alembic 时，Plugin baseline 继续可用；Alembic resident enhancement 不可用要被明确标为 unavailable，而不是“向量失败”或“服务错误”。
- internal AI daemon jobs 与 Codex host-agent workflow jobs 必须显式区分，不再靠 tool 名或 route 隐式推断。

## 非目标

- 不做冷启动生成 skill 交付给 Codex 的设计；该事项仍由 `GTODO-2026-05-23-026` 单独跟踪。
- 不改 Dashboard 业务 API，不让 Dashboard 接入 Plugin。
- 不删除 Plugin 的 Codex MCP / skill / marketplace / runtime packaging。
- 不把 Alembic daemon、ProjectRegistry、项目控制、file monitor 或 internal AI runtime 迁入 Plugin。
- 不让 Plugin 读取项目列表、切换项目、启停项目或把文件夹路径当作项目身份。
- 不要求本阶段立刻删除 Plugin embedded runtime；是否收紧 `alembic_codex_bootstrap/rescan` 行为需要用户确认。

## 真实代码事实

### Plugin 侧当前连接点

- `AlembicPlugin` 包定位是 Codex 插件 runtime，依赖 `@alembic/core: file:../AlembicCore`，bin 只暴露 `alembic-codex-mcp`。
- Plugin manifest 通过 `"skills": "./skills/"` 和 `"mcpServers": "./.mcp.json"` 交付 Codex plugin，不是 npm 主包入口。
- `ServiceRequestBoundary` 当前固定 Codex-facing tool owner 为 `alembic-plugin`，并只把 `alembic_search` 标为会请求 resident service。
- `ResidentSearchClient` 直接读取 Core daemon state，然后用 token 请求 `/api/v1/search`。
- `alembic_search` 和 `PrimeSearchPipeline` 都直接消费 `ResidentSearchClient`；resident 不可用时回退 Plugin baseline search。
- `CodexMcpServer` 的 `alembic_codex_bootstrap/rescan/job` 直接通过 `callDaemonHttpEndpoint` 请求 `/api/v1/jobs/*`，与 search client 分散实现。
- `alembic_codex_status/dashboard` 使用 `DaemonSupervisor`、`EnhancementRoute`、`HostProjectAlignment`、`StatusService` 自行拼 runtime / capability / handoff 语义。
- Plugin `DaemonSupervisor` 会启动 Plugin 自己 packaged 的 `dist/bin/daemon-server.js`，其 health route 声明 `embedded-plugin-runtime`，Dashboard 不可用，internal AI config 已移除。

### Alembic 侧当前 producer

- `Alembic` 主仓库 daemon health 使用 Core `createAlembicRuntimeCapabilities` / `createAlembicRuntimeHealthData`，并附加 `runtimeBoundary` 与 `residentSearch` capability。
- `Alembic` `/api/v1/search` 会返回 resident search telemetry：actualMode、semantic/vector used、degradedReason、vector stats、workspace identity。
- `Alembic` `/api/v1/jobs/bootstrap|rescan` 执行的是 resident internal workflow，bootstrap 走 `resident/tool-handlers/bootstrap-internal.js`，rescan 走 `resident/tool-handlers/rescan-internal.js`。
- `Alembic` `/api/v1/projects/*` 已有 ProjectRuntimeControl，可维护 selected / active project、Dashboard handoff 和 per-project daemon；该能力属于 Alembic 主体控制面，不进入 Plugin unified client。

### Core 当前承接能力

- `@alembic/core/daemon` 已有 `DaemonState`、`JobStore`、`RuntimeContracts` 和 `ProjectRuntimeContracts`。
- Runtime contracts 已有 health path、job endpoints、runtime route kinds、capabilities、project identity 和 capability summary。
- Core 目前没有统一 resident service client contract，也没有 search / jobs / dashboard 统一请求结果 union。

## 关键问题

### 1. 连接点分散

Search、jobs、status、dashboard、host project alignment 分散在不同 client/helper/service 中，各自读取 daemon state、拼 endpoint、处理错误和投影 meta。继续扩展会导致不同工具对“daemon 不存在”“token 缺失”“local Alembic 不可用”“embedded runtime 可用但无 Dashboard”等状态解释不一致。

### 2. route 与 capability 语义还不够强

现在 `local-alembic-daemon`、`embedded-plugin-runtime`、`local-alembic-install` 已存在，但 capability 还没有一个统一的 resident service feature map。Search 能看 resident telemetry，jobs 和 dashboard 仍主要靠 tool 侧判断。

### 3. internal AI job 与 host-agent recoverable job 混在一个 job 表象下

Alembic 主仓库 daemon job 执行 internal workflow；Plugin embedded daemon job 执行 external host-agent workflow 包装。这两条路径都有恢复价值，但不能都被开发者理解成“local Alembic internal AI job”。

## 设计方向

### Core：定义 resident service contract

新增或扩展 `@alembic/core/daemon` 中的 resident service contract。推荐先放在 `src/daemon/ResidentServiceContracts.ts` 并由 `src/daemon/index.ts` 导出，避免新增 package export 时过早扩大 surface。

核心结构草案：

```ts
type AlembicResidentRouteKind =
  | 'local-alembic-daemon'
  | 'embedded-plugin-runtime'
  | 'local-alembic-install'
  | 'unavailable';

type AlembicResidentFeature =
  | 'status.health'
  | 'search.keyword'
  | 'search.semantic'
  | 'jobs.internal-ai.bootstrap'
  | 'jobs.internal-ai.rescan'
  | 'jobs.host-agent-recoverable.bootstrap'
  | 'jobs.host-agent-recoverable.rescan'
  | 'dashboard.handoff'
  | 'file-monitor.git-worktree';

interface AlembicResidentServiceStatus {
  contractVersion: 1;
  route: AlembicResidentRouteKind;
  owner: 'alembic' | 'alembic-plugin';
  apiBaseUrl: string | null;
  healthPath: string;
  serviceScope: AlembicResidentServiceScopeSummary;
  capabilities: Record<AlembicResidentFeature, AlembicResidentFeatureCapability>;
}
```

配套定义：

- `AlembicResidentServiceUnavailableReason`
- `AlembicResidentServiceResult<T>`
- `AlembicResidentSearchRequest / Response`
- `AlembicResidentJobSubmitRequest / Response`
- `AlembicResidentDashboardHandoff`
- capability normalizer / summarizer，保证 Plugin 不手写散落 parser。
- `AlembicResidentServiceScopeSummary` 必须是 Alembic 生产的当前 service scope 摘要，不等同文件夹路径，不暴露项目列表，不提供项目控制动作。

### Alembic：作为 canonical producer

推荐第一阶段不新增破坏性 route，而是在现有 `/api/v1/daemon/health` 中补 `residentService` canonical block，并继续保留当前 `runtimeBoundary` 兼容字段。后续若确实需要更清晰 route，再添加 `GET /api/v1/resident/status` 作为 health 的轻量别名。

Alembic producer 需要声明：

- route：`local-alembic-daemon`
- owner：`alembic`
- search：keyword/bm25/semantic 能力、vector stats 是否可用
- jobs：`jobs.internal-ai.bootstrap/rescan`
- dashboard：只有 daemon mounted Dashboard 时可用
- project / service scope：只输出当前 daemon 服务范围摘要，不暴露项目列表或切换控制给 Plugin
- fileMonitor：daemon git worktree collector 是否可用
- internalAi：provider/model/configSource，但这只是 config state，不是 knowledge source

### Plugin：收束为统一 consumer

新增 `AlembicResidentServiceClient`，替换分散的 `ResidentSearchClient` 和 `callDaemonHttpEndpoint` 调用点。

建议方法：

```ts
class AlembicResidentServiceClient {
  probe(): Promise<AlembicResidentServiceProbe>;
  search(request: AlembicResidentSearchRequest): Promise<AlembicResidentServiceResult<SearchResponse>>;
  enqueueJob(request: AlembicResidentJobSubmitRequest): Promise<AlembicResidentServiceResult<DaemonJobApiRecord>>;
  readJob(request: AlembicResidentJobReadRequest): Promise<AlembicResidentServiceResult<DaemonJobApiRecord | DaemonJobApiRecord[]>>;
  dashboard(): Promise<AlembicResidentServiceResult<AlembicResidentDashboardHandoff>>;
}
```

Plugin 保留：

- Codex MCP tool schema / annotations / visibility / tier policy。
- `alembic_task prime` 的 intent lifecycle、hostResponse、shoutInstruction。
- host-agent bootstrap/rescan 的 Mission Briefing 与 dimension completion。
- Plugin baseline search / Guard / knowledge access。

Plugin 调整：

- `alembic_search` 和 `PrimeSearchPipeline` 使用统一 client 的 `search()`。
- `alembic_codex_bootstrap/rescan/job` 使用统一 client 的 `enqueueJob/readJob()`。
- `alembic_codex_dashboard/status/diagnostics` 使用 `probe()/dashboard()` 产生同一份 route/capability 判断。
- `ServiceRequestBoundary` 扩展 residentServiceRequested，不只标 `alembic_search`，还标 `alembic_codex_dashboard/bootstrap/rescan/job` 等显式 resident service tools。
- 不新增 project control 方法；不消费 `/api/v1/projects/*`；不读取其它项目或项目列表；不把 folder path 当作 project identity。

## 用户确认

确认时间：2026-05-23 21:22 CST

- `alembic_codex_bootstrap/rescan` 在没有本地 Alembic 时，第一版继续保留 Plugin embedded recoverable host-agent job，但明确标为 Plugin embedded capability，不说成 Alembic resident 服务。
- 第一版只 formalize `/api/v1/daemon/health` 的 `residentService` capability discovery，暂不新增 `/api/v1/resident/status`。
- Plugin 不纳入 ProjectRuntimeControl：Plugin 只处理自身逻辑，看不到其它项目，不控制项目，不把文件夹等同项目；多个文件夹未来可以组成一个 Alembic 项目。
- Plugin embedded runtime 对 Codex 暴露时只称为 `embedded-plugin-runtime`，不再称为 Alembic enhancement。

## 阶段划分

### Phase 1：Core contract foundation

窗口：`AlembicCore`

目标：

- 增加 resident service contract 类型、feature map、result union、normalizer。
- 复用现有 `RuntimeContracts` / `ProjectRuntimeContracts`，不新增空壳 provider。
- 增加 contract tests，确保 route、capability、unavailable reason、job kind 能区分 local Alembic 与 embedded Plugin。
- contract 必须明确排除 Plugin project control：只允许当前 service scope 摘要，不提供 project list / switch / start / stop 语义。
- `serviceScope` 不得等同 folder path；如果需要暴露路径，只能作为诊断字段，不能作为项目身份。

阻塞点：

- Core contract 完成前，Alembic 和 Plugin 不应猜字段。

### Phase 2：Alembic producer 接入

窗口：`Alembic`

目标：

- 在 daemon health 中输出 canonical `residentService` block。
- 将现有 `runtimeBoundary`、`residentSearch`、jobs、dashboard、projects runtime-control 信息映射到 Core contract。
- 保持 `/api/v1/search`、`/api/v1/jobs/*`、`/api/v1/projects/*` 现有 route 不破坏。
- 单测覆盖 health、search telemetry、jobs internal AI capability、Dashboard unavailable/available。
- ProjectRuntimeControl 仍留在 Alembic 主体，不作为 Plugin resident client 可调用能力；health 只输出当前 service scope 摘要。

阻塞点：

- Alembic producer 回填提交与验证后，Plugin 才能按 contract 消费。

### Phase 3：Plugin unified client 消费

窗口：`AlembicPlugin`

目标：

- 新增 `AlembicResidentServiceClient`。
- 替换 `ResidentSearchClient`、`callDaemonHttpEndpoint` 和状态 / dashboard 中分散的 health/capability parsing。
- 搜索、prime、jobs、dashboard、status 使用统一 unavailable/failure/telemetry 语义。
- 更新 `ServiceRequestBoundary` 与对应单测。
- 保留 Plugin-owned Codex-facing tool ownership，不恢复 daemon MCP bridge。
- 不新增任何项目控制 client 方法；不消费 `/api/v1/projects/*`；如果 status 需要显示 Alembic scope，只显示当前 scope 摘要和不可控说明。

阻塞点：

- Plugin 行为必须清楚区分 local Alembic resident enhancement 与 Plugin embedded recoverable host-agent job。

### Phase 4：行为收敛与残留删除

窗口：`AlembicPlugin` / `Alembic`

目标：

- 删除或降级旧 helper：`ResidentSearchClient`、`callDaemonHttpEndpoint`、重复 parser、重复 capability projection。
- 修正 tool description、diagnostics 和 session scenario 中“internal AI job / host-agent job”含混表达。
- 保留兼容字段时必须写清真实消费方和删除条件。

### Phase 5：集成验证

窗口：`AlembicTest`（确认后再创建测试单）

目标：

- 在真实项目验证 Plugin baseline、Alembic installed enhancement、semantic/vector resident search、Dashboard handoff、internal AI job status、daemon unavailable fallback。
- 验证 Codex 侧能清楚看到 route/capability/unavailable reason，不再误报 vector 或 job 能力。

## 窗口覆盖状态

| 窗口 / 状态 | 判断 |
| --- | --- |
| `Alembic`<br>已完成 | Phase 2 canonical producer 已由总控验收通过，commit `70917fa509aed03cbd322d1d46acb1eb50f8f0cc`，记录见 [../../Alembic/unified-resident-service-alembic-producer-2026-05-23.md](../../../../Alembic/unified-resident-service-alembic-producer-2026-05-23.md)。 |
| `AlembicCore`<br>已完成 | Phase 1 上游 contract 已由总控验收通过，commit `b5e3bd5496d8831ae167ecfa79598dd6d792b60b`。 |
| `AlembicAgent`<br>观察中 | 第一版无直接任务；internal AI runtime 只作为 Alembic capability 状态展示。 |
| `AlembicDashboard`<br>观察中 | 第一版无直接任务；只观察 Dashboard URL handoff 语义，不接入 Plugin。 |
| `AlembicPlugin`<br>已完成 | Phase 3 unified client consumer 已由总控验收通过，commit `4f58d5e1a1982c13ca307d767e5813ca8e9ea002`；Phase 4 行为收敛与残留删除已由总控验收通过，commit `139a7edfde8149aba7c6a89c00066928b0cb9a40`，记录见 [../../AlembicPlugin/unified-resident-service-behavior-cleanup-2026-05-23.md](../../../../AlembicPlugin/unified-resident-service-behavior-cleanup-2026-05-23.md)。 |
| `AlembicTest`<br>已完成 | `Test-2026-05-23-01` 已由总控验收通过；报告见 [../../../AlembicTest/docs/unified-resident-service-bilidili-integration-2026-05-23.md](../../../../../AlembicTest/docs/unified-resident-service-bilidili-integration-2026-05-23.md)。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## 推荐总控顺序

1. 第一波只派 `AlembicCore` 做 contract foundation。
2. Core 完成验收后派 `Alembic` producer。
3. Alembic 完成验收后派 `AlembicPlugin` consumer。
4. Plugin Phase 3 完成后先派 `AlembicPlugin` Phase 4 行为收敛与残留删除。
5. Phase 4 验收后再派 `AlembicTest` 集成验证。

## 当前派发判断

当前已完成用户确认。`AlembicCore` 已回填并通过总控验收，Core commit `b5e3bd5496d8831ae167ecfa79598dd6d792b60b`。`Alembic` Phase 2 producer 已回填并通过总控验收，commit `70917fa509aed03cbd322d1d46acb1eb50f8f0cc`。`AlembicPlugin` Phase 3 unified client consumer 已回填并通过总控验收，commit `4f58d5e1a1982c13ca307d767e5813ca8e9ea002`，runtime artifact commit `6a41713d464b069e2764bcdc60f77c612da7cf22`。`AlembicPlugin` Phase 4 behavior cleanup 已回填并通过总控验收，commit `139a7edfde8149aba7c6a89c00066928b0cb9a40`，runtime artifact commit `e423599cba18d2f18285d23600e3fb7db981545b`，runtime sha256 `ea8a805a6fe1cac55498e47ede100debdc8883f54eecd233106c83ca7b23623f`。Phase 5 `AlembicTest` 已回填并通过总控验收。`GTODO-2026-05-23-027` 主线完成，当前无发送窗口。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 / 推荐窗口 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `GTODO-2026-05-23-027` | 已完成 | unified resident service contract | P1 | `AlembicTest` / `AlembicPlugin` / `Alembic` / `AlembicCore` | Plugin 与 Alembic 统一 resident service contract 主线已完成；Phase 1-5 均通过总控验收。 | 否 | 已归入长期记录地图。 |

## 空闲窗口调度

| 窗口 | 调度状态 | 是否发送 | 说明 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 | 否 | Phase 2 producer 已验收通过。 |
| `AlembicCore` | 已完成 | 否 | Phase 1 contract 已验收通过。 |
| `AlembicAgent` | 观察中 | 否 | 第一版无直接任务。 |
| `AlembicDashboard` | 观察中 | 否 | 第一版无直接任务。 |
| `AlembicPlugin` | 已完成 | 否 | Phase 4 行为收敛与残留删除已验收通过。 |
| `AlembicTest` | 已完成 | 否 | `Test-2026-05-23-01` 已由总控验收通过。 |

## 任务包派发表

### URS-P1-Core-Contract

窗口：`AlembicCore`

阶段目标：建立 Core resident service contract foundation。

主线动作：新增 resident service contract、normalizer、result union、service scope、job / search / dashboard 类型与 contract tests。

合并 TODO：`GTODO-2026-05-23-027` Phase 1。

明确不包含：不改 Alembic producer、不改 AlembicPlugin consumer、不新增 `/api/v1/resident/status`。

下一处真实阻塞点：Alembic 需要 Core contract 字段后才能接入 producer。

阻塞点之前还能做：Core 已完成 contract / tests / public API smoke。

验证命令：`npm run check`、`npm run build`、`npm run smoke:public-api`、`git -C AlembicCore diff --check`。

回填要求：已回填 commit、验证和给下游建议；执行前置硬规则已要求读取 `AGENTS.md` 并声明窗口定位。

### URS-P2-Alembic-Producer

窗口：`Alembic`

阶段目标：让 Alembic 主体成为 unified resident service canonical producer，在现有 `/api/v1/daemon/health` 中生产 Core contract 定义的 `residentService` block。

主线动作：从 `@alembic/core/daemon` 导入 resident service contract/helper；新增 `data.residentService`；映射 search、jobs、Dashboard、file monitor 和 service scope；保留兼容字段。

合并 TODO：`GTODO-2026-05-23-027` Phase 2。

明确不包含：不新增 `/api/v1/resident/status`；不改 AlembicPlugin unified client；不恢复 daemon MCP bridge；不开放 ProjectRuntimeControl 给 Plugin。

下一处真实阻塞点：AlembicPlugin 需要完成 unified client consumer，才能进入 Phase 4 删除旧 helper / parser / 兼容投影。

阻塞点之前还能做：Alembic 已完成 producer mapping、health response tests、兼容字段保留说明、验证命令和给 Plugin 的消费说明。

验证命令：`npm run test:unit -- DaemonCapabilities DaemonHealthRoute`、`npm run build:check`、`npm run check`、`npm run test:unit:codex`、`git diff --check`。

回填要求：已回填完成范围、commit、验证、兼容字段、遗留风险和 AlembicPlugin 接入建议；执行前置硬规则已要求读取 `AGENTS.md` 并声明窗口定位。

总控验收证据：

- `git -C Alembic status --short`：干净。
- `git -C Alembic show --stat --oneline HEAD`：`70917fa feat: expose resident service health contract`，只改 `lib/http/routes/daemon.ts`、`test/unit/DaemonCapabilities.test.ts`、`test/unit/DaemonHealthRoute.test.ts`。
- `lib/http/routes/daemon.ts` 在 `/api/v1/daemon/health` 的 `data` 中新增 `residentService`，使用 `createAlembicResidentServiceStatus`，route / owner 固定为 `local-alembic-daemon` / `alembic`。
- `serviceScope.projectIdentity` 只含 `dataRootSource`、`projectId`、`schemaMigrationVersion`、`workspaceMode`；`projectRoot` 只在 `diagnosticPaths` 中出现。
- `jobs.host-agent-recoverable.*` 在 Alembic producer 中保持不可用且 owner 为 `alembic-plugin`；Alembic 只声明 `jobs.internal-ai.*`。
- `runtimeBoundary` 与 `capabilities.residentSearch` 仍保留为兼容字段，等待 Plugin 迁移后 Phase 4 再判断删除 / 降级。
- 总控复跑 `npm run test:unit -- DaemonCapabilities DaemonHealthRoute`：通过，`2` 个测试文件、`4` 个测试通过。
- `git -C Alembic diff --check HEAD`：通过。

验收结论：Phase 2 达到当前阶段完成定义，可释放 `AlembicPlugin` Phase 3 unified client consumer。

## Phase 3 任务包

任务包 ID：`URS-P3-Plugin-Unified-Client`

窗口：`AlembicPlugin`

派发时间（北京时间）：2026-05-23 22:02 CST

状态：已完成，总控验收通过（2026-05-23 22:41 CST）

阶段目标：让 Plugin 侧只有一个 unified resident service client 负责探测、鉴权、请求、超时、错误分类、能力判断和 telemetry 投影；Codex-facing tools 继续由 Plugin 拥有，不转交给 Alembic。

主线动作：

- 读取 `AlembicPlugin/AGENTS.md`、本计划文档、Core 回填文档和 Alembic producer 回填文档，确认当前窗口定位是 `AlembicPlugin`，本轮职责是 Codex host agent plugin consumer。
- 新增或改造 `AlembicResidentServiceClient`，从 `/api/v1/daemon/health` 读取 `data.residentService`，并使用 `@alembic/core/daemon` 的 normalizer / result union；不得猜字段，不从 Alembic 主仓库源码复制类型。
- `route === 'local-alembic-daemon' && owner === 'alembic'` 时，才把服务显示为 Alembic resident enhancement；未安装 / 未启动 / token 缺失 / capability unavailable 必须用 Core unavailable reason 表达。
- `alembic_search`、prime search pipeline、`alembic_codex_bootstrap/rescan/job`、dashboard/status/diagnostics 统一通过 resident service client 的 probe/search/job/dashboard 能力判断和结果投影。
- 更新 `ServiceRequestBoundary`：显式标记会请求 resident service 的 tools，不只 `alembic_search`，还包括 dashboard / bootstrap / rescan / job 等真实 resident consumer。
- embedded fallback 只能称为 `embedded-plugin-runtime`，job capability 只能是 `jobs.host-agent-recoverable.*`；不得说成 Alembic internal AI job。
- 不新增 project list / switch / start / stop，不消费 `/api/v1/projects/*`；如 status / diagnostics 展示 scope，只展示 `serviceScope` 摘要与 `diagnosticPaths`，不得把 `projectRoot` 当项目身份。
- 如果 Phase 3 能安全删除 `ResidentSearchClient`、`callDaemonHttpEndpoint` 或重复 parser，就直接删除并补扫描 / 测试；如果需要保留兼容字段，必须写清真实消费方、保留理由和 Phase 4 删除条件。

合并 TODO：无。本包只推进 `GTODO-2026-05-23-027` 主线 Phase 3。

明确不包含：

- 不改 Alembic producer。
- 不新增 `/api/v1/resident/status`。
- 不恢复 `/api/v1/mcp/call` 或 daemon MCP bridge。
- 不让 Dashboard 接入 Plugin。
- 不做冷启动 skill delivery 设计。

下一处真实阻塞点：Plugin unified client 完成前，无法判断旧 helper / parser / compatibility projection 是否可删除；Phase 4 行为收敛必须等本包回填。

阻塞点之前还能做：Plugin 可以完成 unified client、consumer wiring、tool boundary、诊断文案、focused tests、遗留删除候选和给 Phase 4 的收口建议。

验证命令：按 `AlembicPlugin/AGENTS.md` 选择最小相关验证，至少覆盖 typecheck / focused unit tests / MCP tool boundary 或等价 check；如命令不可用，回填具体失败原因和替代验证。必须额外执行 `git -C AlembicPlugin diff --check`；若涉及 packaged plugin runtime，同步说明是否需要重打 runtime。

回填要求：完成范围、提交 hash、变更文件、统一 client API、替换的旧调用点、保留兼容字段及真实消费方、删除候选与 Phase 4 条件、验证命令与结果、给总控是否可进入 Phase 4 / AlembicTest 的判断。

执行前置硬规则：先读取 workspace `AGENTS.md`、`docs/workspace/index.md`、本计划文档、`AlembicPlugin/AGENTS.md`；开始前明确声明当前窗口定位是 `AlembicPlugin`，本轮职责是 Codex host agent plugin consumer，不是 Alembic producer、ProjectRuntimeControl、Dashboard 接入或 internal AI runtime。

## Phase 3 AlembicPlugin 回填

回填文档：[../../AlembicPlugin/unified-resident-service-plugin-client-2026-05-23.md](../../../../AlembicPlugin/unified-resident-service-plugin-client-2026-05-23.md)

完成范围：

- 新增 `AlembicResidentServiceClient`，统一 `probe/search/enqueueJob/readJob/dashboard`。
- 删除旧 `ResidentSearchClient` 与旧 `callDaemonHttpEndpoint` helper。
- `alembic_search`、prime search、`alembic_codex_bootstrap/rescan/job`、dashboard/status/diagnostics 改用统一 resident service contract 和结果投影。
- `ServiceRequestBoundary` 扩展 resident service request 标记到 search / dashboard / bootstrap / rescan / job。
- runtime artifact 已同步刷新到 `plugins/alembic-codex`。

Plugin commit：`4f58d5e1a1982c13ca307d767e5813ca8e9ea002`

AlembicCodex runtime artifact commit：`6a41713d464b069e2764bcdc60f77c612da7cf22`

runtime artifact sha256：`cd8c5f099a784d8327ce170732761d0a9477ce47c891ff30fa60b6cdb6ed7ea3`

验证结果：

- `npm run build:check`：通过。
- focused unit：通过，`7` 个测试文件、`58` 个测试。
- `npm run check`：通过。
- `npm run test:unit`：通过，`104` 个测试文件、`1494` 个测试。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过。
- `npm run verify:codex-plugin`：通过。
- `npm run smoke:codex-plugin`：通过。
- `git diff --check`：通过。
- `git -C plugins/alembic-codex diff --check`：通过。
- 旧 search client / old daemon job helper 精确负向扫描：无命中。

遗留风险：

- `runtimeBoundary` 与 legacy capability summary 仍作为兼容输入保留，Phase 4 再判断删除 / 降级。
- AlembicTest 真实项目未在本轮执行；建议 Phase 4 后启动。
- `daemon-server` shutdown hook label 中仍有 `daemon-jobs` 字符串，但它不是被删除的 HTTP helper / MCP bridge。

下一步建议：可以进入 Phase 4 行为收敛与残留删除；AlembicTest 建议等 Phase 4 结束后再派发真实项目集成验证。

总控验收证据：

- `git -C AlembicPlugin status --short`：干净。
- `git -C AlembicPlugin/plugins/alembic-codex status --short`：干净。
- `git -C AlembicPlugin show --stat --oneline HEAD`：`4f58d5e feat: unify plugin resident service client`，新增 `lib/service/resident/AlembicResidentServiceClient.ts`，删除旧 `ResidentSearchClient` 与 `lib/external/mcp/codex/daemon-jobs.ts`，并更新 search / prime / jobs / dashboard / status / diagnostics / boundary tests。
- `git -C AlembicPlugin/plugins/alembic-codex show --stat --oneline HEAD`：`6a41713 chore: refresh unified resident runtime artifact`，runtime dist 与 `runtime.tgz` 已刷新。
- `plugins/alembic-codex/runtime.tgz` sha256：`cd8c5f099a784d8327ce170732761d0a9477ce47c891ff30fa60b6cdb6ed7ea3`。
- 总控复跑 `npm run build:check`：通过。
- 总控复跑 focused unit：通过，`7` 个测试文件、`58` 个测试通过。
- `git diff --check HEAD` 与 `git -C plugins/alembic-codex diff --check HEAD`：通过。
- 旧 `ResidentSearchClient` / `callDaemonHttpEndpoint` / daemon MCP bridge / `/api/v1/mcp/call` / `/api/v1/projects` 精确负向扫描：无命中。

验收结论：Phase 3 达到当前阶段完成定义，可释放 Phase 4 行为收敛与残留删除；`AlembicTest` 仍等 Phase 4 后启动。

## Phase 4 任务包

任务包 ID：`URS-P4-Behavior-Cleanup`

窗口：`AlembicPlugin`

派发时间（北京时间）：2026-05-23 22:41 CST

状态：已完成，总控验收通过（2026-05-23 23:20 CST）

阶段目标：在 Phase 3 unified client 已验收的基础上，收敛 Plugin 侧残留的旧 capability / 旧文案 / 旧标签，让 Codex 看到的 route、job、Dashboard、search 行为都只围绕 unified resident service 表达。

主线动作：

- 读取 workspace `AGENTS.md`、本计划文档、`AlembicPlugin/AGENTS.md`，先声明当前窗口定位是 `AlembicPlugin`，本轮职责是 Plugin 行为收敛与残留清理。
- 复核 `EnhancementRoute`、`StatusService`、`Diagnostics`、`ModuleBoundary`、`HostProjectAlignment` 中对 `runtimeBoundary` / legacy capability summary / `capabilities.residentSearch` 的读取；能改为 `residentService` canonical input 的直接收敛，必须保留的兼容读取要写清真实消费方、保留理由和删除条件。
- 收紧 diagnostics / onboarding / tool description / session scenario 中 “internal AI job” 与 “embedded host-agent recoverable job” 的表达，确保 embedded Plugin runtime 不被称为 Alembic resident enhancement。
- 检查 `daemon-server` shutdown hook label 中的 `daemon-jobs` 等旧命名；如果只是内部 label 且安全可改，改成中性名称；如果不改，回填不改理由和后续删除条件。
- 继续保持 Plugin 不消费 `/api/v1/projects/*`、不做 project list / switch / start / stop、不恢复 `/api/v1/mcp/call` 或 daemon MCP bridge。
- 若本轮 runtime dist 变化，必须刷新 `plugins/alembic-codex` runtime artifact 并回填 sha256。

合并 TODO：`GTODO-2026-05-23-027` Phase 4。

明确不包含：不改 Alembic producer；不改 AlembicCore contract；不启动 AlembicTest 真实项目验证；不设计冷启动 skill delivery。

下一处真实阻塞点：真实项目验证必须等行为文案和兼容残留收口后再启动，否则验收口径会变化。

阻塞点之前还能做：Plugin 可以完成 legacy 读取收敛、文案收紧、旧 label 清理、负向扫描、focused tests 和 runtime artifact 刷新判断。

验证命令：至少执行 `npm run build:check`、相关 focused unit tests、`git diff --check`；若 runtime dist 变化，执行 `npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run smoke:codex-plugin` 与 `git -C plugins/alembic-codex diff --check`。必须额外做旧入口负向扫描。

回填要求：完成范围、提交 hash、是否刷新 runtime artifact、删除 / 保留项清单、保留兼容字段真实消费方与删除条件、验证命令与结果、是否可以进入 AlembicTest 集成验证。

执行前置硬规则：先读取 workspace `AGENTS.md`、`docs/workspace/index.md`、本计划文档、`AlembicPlugin/AGENTS.md`；开始前明确声明当前窗口定位是 `AlembicPlugin`，本轮职责是 Plugin 行为收敛与残留清理，不是 Alembic producer、Core contract、ProjectRuntimeControl、Dashboard 接入或真实项目测试。

## Phase 4 AlembicPlugin 回填

回填文档：[../../AlembicPlugin/unified-resident-service-behavior-cleanup-2026-05-23.md](../../../../AlembicPlugin/unified-resident-service-behavior-cleanup-2026-05-23.md)

完成范围：

- `residentService` 现在是 `EnhancementRoute` capability canonical 输入；legacy capability / `runtimeBoundary` 只补空缺。
- `runtimeBoundary` 保留为结构化 compatibility fallback，并写明真实消费方、保留理由和删除条件。
- `HostProjectAlignment` 优先使用 local Alembic `residentService.serviceScope` 做只读 handoff 对齐判断；不消费 `/api/v1/projects/*`。
- `ModuleBoundary`、`StatusService`、`Diagnostics`、`ToolPolicy` 文案和结构化输出已区分 local Alembic resident service、Alembic internal AI workflow 与 embedded Plugin host-agent recovery。
- `daemon-server` shutdown hook label `daemon-jobs` 已改为 `recoverable-job-cleanup`。
- `plugins/alembic-codex` runtime artifact 已同步刷新。

Plugin commit：`139a7edfde8149aba7c6a89c00066928b0cb9a40`

AlembicCodex runtime artifact commit：`e423599cba18d2f18285d23600e3fb7db981545b`

runtime artifact sha256：`ea8a805a6fe1cac55498e47ede100debdc8883f54eecd233106c83ca7b23623f`

验证结果：

- `npm run build:check`：通过。
- `npm run test:unit -- CodexEnhancementRoute CodexModuleBoundary`：通过。
- `npm run test:unit -- CodexStatusService CodexToolPolicy CodexMcpServer CodexServiceRequestBoundary AlembicResidentServiceClient`：通过。
- `npm run test:unit -- CodexToolPolicy CodexMcpServer`：通过。
- `npm run check`：通过。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过。
- `npm run verify:codex-plugin`：通过。
- `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime passed；recovery / daemon / dashboardHandoff skipped。
- `git diff --check`：通过。
- `git -C plugins/alembic-codex diff --check`：通过。
- 旧入口负向扫描：`Local Alembic enhancement route|Alembic daemon job|daemon jobs API|daemon-jobs|Alembic runtime code|/api/v1/projects|/api/v1/mcp/call|ResidentSearchClient|callDaemonHttpEndpoint` 无命中。

遗留风险：

- `runtimeBoundary` compatibility fallback 仍保留，真实消费方是 `EnhancementRoute` capability fallback、`HostProjectAlignment` legacy project fallback 和 `ModuleBoundary` diagnostics；删除条件是所有支持的 daemon health producer 稳定提供 `data.residentService`。
- AlembicTest 真实项目未在本轮执行；建议 Phase 4 总控验收后再启动 Phase 5。

总控验收证据：

- `git -C AlembicPlugin status --short`：干净。
- `git -C AlembicPlugin/plugins/alembic-codex status --short`：干净。
- `git -C AlembicPlugin show --stat --oneline HEAD`：`139a7ed feat: converge resident service behavior boundary`，覆盖 `EnhancementRoute`、`HostProjectAlignment`、`ModuleBoundary`、`ToolPolicy`、`Diagnostics`、`StatusService`、`bin/daemon-server.ts`、focused tests 和 runtime artifact pointer。
- `git -C AlembicPlugin/plugins/alembic-codex show --stat --oneline HEAD`：`e423599 chore: refresh resident behavior cleanup runtime`，runtime dist 与 `runtime.tgz` 已刷新。
- `shasum -a 256 plugins/alembic-codex/runtime.tgz`：`ea8a805a6fe1cac55498e47ede100debdc8883f54eecd233106c83ca7b23623f`。
- `npm run build:check`：通过。
- `npm run test:unit -- CodexEnhancementRoute CodexModuleBoundary CodexStatusService CodexToolPolicy CodexMcpServer CodexServiceRequestBoundary AlembicResidentServiceClient`：通过，`7` 个测试文件、`63` 个测试。
- `npm run check`：通过。
- `npm run verify:codex-plugin`：通过。
- `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime passed；recovery / daemon / dashboardHandoff skipped。
- `git diff --check HEAD`：通过。
- `git -C plugins/alembic-codex diff --check HEAD`：通过。
- 旧入口负向扫描：`Local Alembic enhancement route|Alembic daemon job|daemon jobs API|daemon-jobs|Alembic runtime code|/api/v1/projects|/api/v1/mcp/call|ResidentSearchClient|callDaemonHttpEndpoint` 在 Plugin source 和 runtime dist 下无命中。

验收结论：Phase 4 达到当前阶段完成定义，可释放 Phase 5 AlembicTest 真实项目集成验证。

下一步建议：执行 `Test-2026-05-23-01`，用 BiliDili 真实项目验证 Plugin baseline、local Alembic resident enhancement、resident search、Dashboard handoff、job 边界和旧桥接负向扫描。

## Phase 5 AlembicTest 集成验证

测试单：`Test-2026-05-23-01`

窗口：`AlembicTest`

状态：已完成，总控验收通过（2026-05-23 23:45 CST）

交接文档：[alembic-test-exchange.md](../../../current/alembic-test-exchange.md)

阶段目标：在 BiliDili 真实项目中验证 unified resident service 的实际可见行为，确认 Plugin baseline 与 local Alembic resident enhancement 能正确区分，search / dashboard / jobs / prime shout 不回到旧桥接语义。

明确不包含：不改 BiliDili 产品源码；不新增产品功能；不处理冷启动 skill delivery `GTODO-2026-05-23-026`；不执行与本链路无关的完整冷启动长跑。

回填要求：测试结论、执行范围、使用配置、job/session id、Dashboard URL 摘要、状态变化、关键日志、BiliDili git 状态、详细报告路径、遗留风险和下一步建议。

AlembicTest 回填摘要（2026-05-23）：

- 测试结论：通过，已由总控验收。
- 报告路径：`AlembicTest/docs/unified-resident-service-bilidili-integration-2026-05-23.md`
- 关键证据：baseline classification=`pass-with-clear-fallback`，resident classification=`pass`；Dashboard/API `http://127.0.0.1:61828`；latest bootstrap job `bootstrap_mpf6tn10_c572b8a1`，session `bs_1779349624495_scvvf0`；resident route `local-alembic-daemon` owner `alembic`；direct `/api/v1/search` 与 `alembic_search(auto/semantic)` 均返回 resident/vector telemetry；negative scan 未发现 `/api/v1/mcp/call`、`/api/v1/projects/*`、`daemon-mcp-compat-bridge`。
- BiliDili git 状态：测试前后均为 `## main...origin/main`，无未提交变更。
- 遗留风险：resident probe 在 sandbox 内会因 pid 探活受限误判 daemon stale；最终有效 resident evidence 使用 elevated AlembicTest probe 采集。本轮未新建 internal AI job，只读验证现有 job route。

总控验收证据：

- 读取 AlembicTest 回填报告和 `docs/workspace/current/alembic-test-exchange.md` 回填摘要，测试目标、非目标、前置版本、状态变化、关键 payload、验证命令、遗留风险齐全。
- `git -C BiliDili status --short --branch`：`## main...origin/main`，真实项目无未提交变更。
- `git -C AlembicTest status --short --branch`：AlembicTest 有本轮新增 probe 脚本、报告和 README / check 更新，属于测试窗口待提交资产，不影响产品仓库。
- 验收结论：Phase 5 达到完成定义，`GTODO-2026-05-23-027` 主线完成。

## Phase 1 任务包

任务包 ID：`URS-P1-Core-Contract`

窗口：`AlembicCore`

派发时间（北京时间）：2026-05-23 21:22 CST

状态：已完成，总控验收通过（2026-05-23 21:45 CST）

阶段目标：建立 Plugin 与 Alembic 统一 resident service 的 Core contract foundation，让后续 Alembic producer 和 Plugin consumer 不再猜字段。

主线动作：

- 新增或扩展 `@alembic/core/daemon` resident service contract，覆盖 route kind、owner、feature capability、unavailable reason、result union、service scope summary、search/job/dashboard request/response 类型。
- 复用现有 RuntimeContracts / DaemonState / JobStore / ProjectRuntimeContracts 类型，不创建无真实消费方的 provider 或 runtime。
- 明确 job 语义：`jobs.internal-ai.*` 属于 Alembic resident internal workflow；`jobs.host-agent-recoverable.*` 属于 Plugin embedded recoverable host-agent workflow。
- 明确 Plugin project boundary：contract 不提供 Plugin project list / switch / start / stop 能力；`serviceScope` 不等同 folder path，只能表示当前 Alembic service scope 摘要。
- 增加 contract / normalizer 单测，覆盖 local Alembic、embedded Plugin、unavailable、capability summary、service scope 非文件夹身份、job kind 区分。

明确不包含：

- 不改 `Alembic` daemon health producer。
- 不改 `AlembicPlugin` unified client。
- 不新增 `/api/v1/resident/status`。
- 不设计冷启动 skill 交付。

下一处真实阻塞点：Alembic 和 Plugin 需要 Core contract 字段后才能接入；Core 未完成前下游不得实现。

验证命令：已由 `AlembicCore` 执行 `npm run check`、`npm run build`、`npm run smoke:public-api`、`git -C AlembicCore diff --check`，结果通过。

回填要求：已回填到 [../../AlembicCore/unified-resident-service-core-contract-2026-05-23.md](../../../../AlembicCore/unified-resident-service-core-contract-2026-05-23.md)。

执行前置硬规则：先读取 workspace `AGENTS.md`、本计划文档、`AlembicCore/AGENTS.md`；开始前明确声明当前窗口定位是 `AlembicCore`，本轮职责是 resident service contract producer，不是 Alembic producer、Plugin consumer、项目控制实现或 Dashboard 接入。

总控验收证据：

- `git -C AlembicCore status --short`：干净。
- `git -C AlembicCore show --stat --oneline HEAD`：`b5e3bd5 Add resident service contracts`，新增 `src/daemon/ResidentServiceContracts.ts`、`test/ResidentServiceContracts.test.ts`，并更新 daemon export 与 public API smoke。
- `ResidentServiceContracts.ts` 覆盖 route kind、owner、feature capability、unavailable reason、result union、service scope summary、search / job / dashboard request-response 类型。
- `ResidentServiceContracts.test.ts` 覆盖 local Alembic producer、embedded Plugin recoverable host-agent route、unavailable normalizer、job family 区分和无 `projects.*` capability。
- `git -C AlembicCore diff --check HEAD`：通过。

验收结论：Phase 1 达到当前阶段完成定义，可释放 `Alembic` Phase 2 producer；`AlembicPlugin` 仍不得提前消费或猜字段。

## Phase 2 任务包

任务包 ID：`URS-P2-Alembic-Producer`

窗口：`Alembic`

派发时间（北京时间）：2026-05-23 21:45 CST

状态：已完成，总控验收通过（2026-05-23 22:02 CST）

阶段目标：让 Alembic 主体成为 unified resident service canonical producer，在现有 `/api/v1/daemon/health` 中生产 Core contract 定义的 `residentService` block。

主线动作：

- 读取 `Alembic/AGENTS.md`、本计划文档和 Core 回填文档，确认当前窗口定位是 `Alembic`，本轮职责是 resident service producer。
- 从 `@alembic/core/daemon` 导入 resident service contract / helper，不从 Core 深层路径或 Plugin 源码复制类型。
- 在现有 `/api/v1/daemon/health` 返回中新增 canonical `residentService` block，优先使用 `createAlembicResidentServiceStatus` 或等价结构。
- route 固定为 `local-alembic-daemon`，owner 固定为 `alembic`。
- 将现有 `runtimeBoundary`、`residentSearch`、jobs、Dashboard handoff、file monitor / git worktree collector 等可用状态映射到 resident capabilities。
- jobs 必须只声明 `jobs.internal-ai.bootstrap` / `jobs.internal-ai.rescan` 为 Alembic producer 能力；不得把 Plugin embedded recoverable host-agent job 说成 Alembic internal AI job。
- `serviceScope.projectIdentity` 只放非路径身份摘要；路径只进入 `diagnosticPaths`。不得把 folder path 当成 project identity，不暴露 project list / switch / start / stop 给 Plugin。
- 保持 `/api/v1/search`、`/api/v1/jobs/*`、`/api/v1/projects/*` 现有 route 不破坏；`/api/v1/projects/*` 仍属于 Alembic 主体控制面，不进入 Plugin resident client contract。
- 增加或更新单测 / contract tests，覆盖 health 中的 `residentService` block、capability available/unavailable、internal AI jobs、Dashboard available/unavailable、serviceScope 非路径身份。

合并 TODO：无。本包只推进 `GTODO-2026-05-23-027` 主线 Phase 2。

明确不包含：

- 不新增 `/api/v1/resident/status`。
- 不改 AlembicPlugin unified client。
- 不恢复 `/api/v1/mcp/call` 或 daemon MCP bridge。
- 不让 Dashboard 接入 Plugin。
- 不做冷启动 skill delivery 设计。

下一处真实阻塞点：已解除。Alembic producer 已生产 canonical `residentService` 并通过总控验收，当前阻塞转到 AlembicPlugin Phase 3 unified client。

阻塞点之前还能做：Alembic 可以完成 producer mapping、health response tests、兼容字段保留说明、验证命令和给 Plugin 的消费说明。

验证命令：按 `Alembic/AGENTS.md` 选择最小相关验证，至少覆盖 daemon health contract 单测 / typecheck / lint 或等价 check；如命令不可用，回填具体失败原因和替代验证。必须额外执行 `git -C Alembic diff --check`。

回填要求：完成范围、提交 hash、变更文件、`residentService` 字段样例或 schema 摘要、验证命令与结果、保留兼容字段及真实消费方、未覆盖 capability 及理由、给 AlembicPlugin Phase 3 的接入说明。

执行前置硬规则：先读取 workspace `AGENTS.md`、`docs/workspace/index.md`、本计划文档、`Alembic/AGENTS.md`；开始前明确声明当前窗口定位是 `Alembic`，本轮职责是 local resident service producer，不是 AlembicPlugin consumer、Codex host-agent workflow、Dashboard 接入或 ProjectRuntimeControl 对外开放。

## 可复制分派提示词

发送给：`无`

说明：Phase 5 AlembicTest 已由总控验收通过，当前无可发送窗口。

```text
无。
```

不发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`BiliDili`。

## Phase 1 AlembicCore 回填

回填文档：[../../AlembicCore/unified-resident-service-core-contract-2026-05-23.md](../../../../AlembicCore/unified-resident-service-core-contract-2026-05-23.md)

完成范围：

- `@alembic/core/daemon` 新增 resident service contract foundation。
- 覆盖 route kind、owner、feature capability、unavailable reason、result union、service scope summary、probe summary、search / job / dashboard request-response 类型。
- 明确 `jobs.internal-ai.*` 归 Alembic resident internal workflow，`jobs.host-agent-recoverable.*` 归 AlembicPlugin embedded recoverable host-agent workflow。
- 明确 `serviceScope` 不等同 folder path；路径只作为 `diagnosticPaths`，不得作为 Plugin 项目控制身份。

Core commit：`b5e3bd5496d8831ae167ecfa79598dd6d792b60b`

验证结果：

- `npm run check`：通过，`66` 个测试文件、`955` 个测试通过。
- `npm run build`：通过。
- `npm run smoke:public-api`：通过，成功导入 `75` 个 exact public API entrypoints。
- `git -C AlembicCore diff --check`：通过。

遗留风险：

- `Alembic` 尚未生产 `/api/v1/daemon/health.residentService` canonical block。
- `AlembicPlugin` 尚未统一 resident client；必须等 Alembic producer 回填后再消费。
- `serviceScope.scopeId` 生产规则仍需由 Alembic Phase 2 固定。

给 Alembic 的下一步接入建议：

- 在 daemon health 中新增 `residentService` block，优先使用 `createAlembicResidentServiceStatus` 结构。
- route 固定为 `local-alembic-daemon`，owner 固定为 `alembic`。
- 将现有 `runtimeBoundary`、`residentSearch`、jobs、dashboard、file monitor 映射到 resident capabilities。
- 保留兼容字段，不破坏现有 `/api/v1/search`、`/api/v1/jobs/*`、`/api/v1/projects/*`。
- `serviceScope.projectIdentity` 只放非路径身份摘要；路径只进入 `diagnosticPaths`。

给 AlembicPlugin 的下一步接入建议：

- 等 Alembic producer 完成后再实现 unified client，不提前猜字段。
- 统一从 `@alembic/core/daemon` 导入 resident contracts。
- `alembic_search`、prime search、jobs、dashboard、status 后续统一投影 `AlembicResidentServiceResult<T>` / unavailable reason。
- embedded fallback 只称为 `embedded-plugin-runtime` 和 `jobs.host-agent-recoverable.*`。
- 不新增 project list / switch / start / stop，不消费 `/api/v1/projects/*`。

## Phase 2 Alembic 回填

回填文档：[../../Alembic/unified-resident-service-alembic-producer-2026-05-23.md](../../../../Alembic/unified-resident-service-alembic-producer-2026-05-23.md)

完成范围：

- `Alembic` 在 `/api/v1/daemon/health` 返回中新增 canonical `data.residentService` block。
- 从 `@alembic/core/daemon` 导入 `createAlembicResidentServiceStatus` 与 resident capability 类型，不从 Core 深层路径或 Plugin 源码复制类型。
- route / owner 固定为 `local-alembic-daemon` / `alembic`。
- 将 `status.health`、`search.keyword`、`search.semantic`、`jobs.internal-ai.bootstrap`、`jobs.internal-ai.rescan`、`dashboard.handoff`、`file-monitor.git-worktree` 映射到 resident capabilities。
- `jobs.host-agent-recoverable.bootstrap` / `jobs.host-agent-recoverable.rescan` 在 Alembic producer 中显式不可用，owner 为 `alembic-plugin`。
- `serviceScope.projectIdentity` 只输出非路径身份摘要；路径只进入 `diagnosticPaths`，不暴露 project list / switch / start / stop。
- 保留 `runtimeBoundary` 与 `capabilities.residentSearch` 兼容字段，不破坏 `/api/v1/search`、`/api/v1/jobs/*`、`/api/v1/projects/*`。

Alembic commit：`70917fa509aed03cbd322d1d46acb1eb50f8f0cc`

验证结果：

- `npm run test:unit -- DaemonCapabilities DaemonHealthRoute`：通过，`2` 个测试文件、`4` 个测试通过。
- `./node_modules/.bin/biome check lib/http/routes/daemon.ts test/unit/DaemonCapabilities.test.ts test/unit/DaemonHealthRoute.test.ts`：通过。
- `npm run build:check`：通过。
- `npm run check`：通过。
- `npm run test:unit:codex`：通过，`111` 个测试文件、`1069` 个测试通过。
- `git diff --check`：通过。

遗留风险：

- `AlembicPlugin` 仍未实现统一 `AlembicResidentServiceClient`；当前只是 Alembic producer 完成上游 contract 生产。
- 兼容字段 `runtimeBoundary` 与 `capabilities.residentSearch` 等待 Plugin Phase 3 消费迁移后，再在 Phase 4 判断删除 / 降级。
- internal AI job capability 表示 Alembic daemon 提供 internal workflow job route；provider/model 是否可用仍通过 capability message 与现有 `internalAi` 状态表达，Plugin 不应把它等同 host-agent recoverable job。

给 AlembicPlugin 的下一步接入建议：

- 从 `/api/v1/daemon/health` 读取 `data.residentService`，并使用 `@alembic/core/daemon` 的 resident contracts normalizer / result union；不要猜字段。
- `route === 'local-alembic-daemon' && owner === 'alembic'` 时，才把服务显示为 Alembic resident enhancement。
- search、jobs、dashboard、status 的可用性统一从 `residentService.capabilities` 读取。
- embedded fallback 仍只能称为 `embedded-plugin-runtime`，并只声明 `jobs.host-agent-recoverable.*`；不得说成 Alembic internal AI job。
- 不新增 project list / switch / start / stop，不消费 `/api/v1/projects/*`；如果 diagnostics 需要展示服务范围，只展示 `serviceScope` 摘要与 `diagnosticPaths`。
