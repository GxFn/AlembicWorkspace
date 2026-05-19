# Alembic Multi Project Control Redesign Goal Stage Confirmation

日期：2026-05-18
状态：等待用户确认，不派发执行窗口
维护窗口：AlembicWorkspace

## 用户原始目标

```text
Codex 插件作为入口，AlembicPlugin 从 Codex host agent 当前项目上下文开始项目，默认 Ghost 模式；Alembic 通过 Ghost 模式和全局配置管理这些从插件入口初始化的项目。

多项目能力要明确如何表示、如何切换，以及切换时哪些内容要切换和重连。AlembicPlugin 如果 Alembic 切的不是自己的项目，就默认和 Alembic 断开连接。Dashboard 切换项目时的操作可以后续决定。每个项目独立，可以保留 missing / unavailable 状态。BiliDili 不进入默认范围。
```

## 前置文档

- 原始计划书：[../requirement-designs/alembic-multi-project-control-redesign/original-plan-2026-05-18.md](../../../../requirement-designs/alembic-multi-project-control-redesign/original-plan-2026-05-18.md)
- 需求设计文档：[../requirement-designs/alembic-multi-project-control-redesign/requirement-design-2026-05-18.md](../../../../requirement-designs/alembic-multi-project-control-redesign/requirement-design-2026-05-18.md)
- 底层能力依赖调研：[../requirement-designs/alembic-multi-project-control-redesign/bottom-capability-dependency-research-2026-05-18.md](../../../../requirement-designs/alembic-multi-project-control-redesign/bottom-capability-dependency-research-2026-05-18.md)
- 代码实现依赖调研：[../requirement-designs/alembic-multi-project-control-redesign/code-implementation-dependency-research-2026-05-18.md](../../../../requirement-designs/alembic-multi-project-control-redesign/code-implementation-dependency-research-2026-05-18.md)

## 总控理解

目标不是“给现有单项目 daemon 加几个字段”，而是让 Alembic 成为 Plugin 初始化项目后的多项目控制中心：

- `AlembicPlugin` 从 Codex host agent 当前项目进入，默认 Ghost 初始化和 handoff。
- `Alembic` 读取 Core registry / Ghost resolver，管理多个项目的 summary、selected / active 状态、daemon、Dashboard、jobs、file monitor 和 internal AI 能力。
- `AlembicDashboard` 消费 Alembic 的项目控制 API，展示项目列表和切换入口。
- `AlembicPlugin` 不切换项目；当 Alembic active project 不是 Plugin host project 时，Plugin 显示 disconnected / mismatch。
- `AlembicAgent` 仍是 Alembic internal AI runtime，不是 Codex host-agent route。

本阶段采用单 active runtime 模型：可以显示多个项目 summary，但同一时刻只连接 / 操作一个 active project。切换时关闭当前 runtime，启动目标 project runtime，并重连 Dashboard/API/handoff。后续可以扩展为多项目同时显示或多 runtime 并发，但这不是本阶段目标。

## 代码事实约束

- `Alembic` 的 `ServiceContainer` 已禁止同进程切项目；因此切换不能靠重绑容器字段。
- daemon-server、DaemonSupervisor、JobStore、file monitor、ToolContextFactory、AgentRuntimeBuilder 都绑定 projectRoot / dataRoot；因此必须按完整 runtime scope 切换。
- `AlembicCore` registry 和 WorkspaceResolver 已提供 projectId、Ghost dataRoot、runtimeDir、databasePath、knowledge dirs 等事实，但 registry 条目和 runtime contract 仍是单项目 / 薄 summary。
- `AlembicPlugin` MCP server 已绑定一个 Codex host project；显式 `projectRoot` scoped call 也只是单项目处理，不是项目切换器。
- `AlembicDashboard` API client 固定同源 `/api/v1`；EventSource / scan / chat / refine stream 都需要在切换时处理 abort / reconnect。
- `AlembicAgent` runtime boundary 明确 `hostAgentRouteSupported: false`；Codex host-agent route 仍属于 Plugin。

## 最终完成定义

- 用户能从 Codex 插件在多个真实项目默认 Ghost 初始化 Alembic。
- Alembic 能列出所有已注册项目，显示每个项目的 projectRoot、dataRoot、workspace mode、missing / stale / ready / mismatch 等状态。
- Alembic 能对目标项目执行 start / stop / open Dashboard / status，并按单 active runtime 关闭旧项目、启动新项目、重连 handoff。
- Dashboard 能消费真实 projects API 展示项目列表和状态；第一版切换可以走目标 Dashboard URL handoff，不强制同页 target API 切换。
- Plugin 能识别自己的 hostProject 与 Alembic active / selected project 是否一致，不一致时不向错误项目投递 host-agent job。
- Core public contract 最终由真实 Alembic 实现反推沉淀，避免 consumer 复制临时字段。
- internal AI、jobs、file monitor、terminal sandbox、tool cache 和 Dashboard project-scoped cache 不串项目。
- missing / moved / unavailable 项目状态保留；删除 / clean / unregister 必须显式操作。

## 非目标

- 不做 Plugin 端多项目切换 UI。
- 不做多 runtime 并发。
- 不做没有真实 producer / consumer 的空 Project API、空 adapter 或只改类型的抽象连接。
- 不把 Dashboard 前端所有权迁回 Plugin；前端产品仍归 `AlembicDashboard`，运行和服务归 `Alembic`。
- 不把 `BiliDili` 纳入默认开发派发；只在稳定后经用户确认做只读 smoke。
- 本确认阶段不做 release / npm / marketplace 发布。

## 影响窗口

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>暂停 | 第一生产方：实现 ProjectRuntimeControl foundation、ProjectRuntimeScope builder、selected / active project state、projects CLI / HTTP API、单 active runtime switch orchestration；等待用户确认后启动。 |
| `AlembicCore`<br>阻塞 | 第二阶段沉淀 contract：在 Alembic 证明字段后 public export ProjectSummary、ConnectionState、ProjectRuntimeTarget、ProjectRuntimeScope summary、handoff mismatch contract。 |
| `AlembicPlugin`<br>阻塞 | 下游消费方：等待 Alembic / Core contract 后补 hostProject 与 activeProject mismatch，不做项目切换。 |
| `AlembicDashboard`<br>阻塞 | 下游消费方：等待 Alembic projects API 后做项目列表、状态展示和 Dashboard URL handoff / reconnect。 |
| `AlembicAgent`<br>观察中 | 只观察 internal AI runtime 隔离；除非 Alembic 发现 projectRoot / dataRoot 传递缺口，否则不派发。 |
| `BiliDili`<br>无任务 | 当前不参与实现；稳定后可作为只读真实项目 smoke。 |

## Producer / Consumer 顺序

| 顺序 | 上游产出 | 生产窗口 | 消费窗口 | 派发判断 |
| --- | --- | --- | --- | --- |
| 1 | Alembic 项目 runtime control foundation | `Alembic` | `AlembicCore`、`AlembicPlugin`、`AlembicDashboard` | 第一波。真实实现 producer，不能先让下游猜字段。 |
| 2 | 已验证多项目 public contract | `AlembicCore` | `Alembic`、`AlembicPlugin`、`AlembicDashboard` | 第二波。基于 Alembic 已验证字段沉淀。 |
| 3 | Alembic projects API / CLI 使用 Core contract 收口 | `Alembic` | `AlembicPlugin`、`AlembicDashboard` | 第三波。API 稳定后下游才可消费。 |
| 4 | Plugin hostProject mismatch | `AlembicPlugin` | 用户 / Dashboard status | 第四波。等待 Alembic selected / active project contract。 |
| 5 | Dashboard project list / handoff | `AlembicDashboard` | 用户 UI | 第五波。等待 projects API 和 handoff 字段。 |
| 6 | 统一隔离验收 | 总控，必要时 `Alembic` / `AlembicAgent` | 全部窗口 | 稳定面后再做，不每小波重验收归档。 |

## 分阶段计划

### 阶段 1：Alembic Project Runtime Control Foundation

生产窗口：`Alembic`

目标：

- 新增实际可用的 `ProjectRuntimeControl` / `ProjectRuntimeScope` foundation。
- 基于 `ProjectRegistry.list()`、`WorkspaceResolver.fromProject()`、`resolveDaemonPaths(projectRoot)`、`DaemonSupervisor.status()` 聚合项目 summary。
- 新增 selected / active project state，区分 registry project、selected project、active runtime project 和 Plugin host project。
- 提供只读 projects CLI / API 起点，例如 list / status / inspect；允许 read-only status-all 先落地。
- 明确 runtime scope 中 daemon、Dashboard URL、JobStore、file monitor、internal AI、dataRoot、cache key 的绑定关系。

完成标准：

- Alembic 能列出 registry 项目并给出 ready / stopped / stale / missing / unavailable 等状态。
- 不在现有 ServiceContainer 内切项目。
- 测试或 smoke 能证明 ProjectRuntimeScope 使用真实 resolver / daemon status，而不是静态 mock。
- 回填执行文档、提交 hash、验证命令和遗留风险。

### 阶段 2：Core Contract Sedimentation

生产窗口：`AlembicCore`

目标：

- 将阶段 1 已验证字段沉淀为 Core public contract。
- 补充 `ProjectSummary`、`ProjectConnectionState`、`ProjectRuntimeTarget`、`ProjectRuntimeScopeSummary`、`ProjectHandoffMismatch` 或等价命名。
- 保持 registry v1 兼容；新增 metadata 必须 optional 或 sidecar，不能破坏旧 projects.json。
- 更新 package exports 和 focused tests。

完成标准：

- Core export map 可被 Alembic 消费。
- 旧 registry 文件仍能 inspect / list。
- 没有空 contract：每个字段都有阶段 1 Alembic 使用证据或阶段 3 消费路径。

### 阶段 3：Alembic Projects Control Plane

生产窗口：`Alembic`

目标：

- Alembic 改用 Core public contract 收口阶段 1 本地类型。
- 完整暴露 projects CLI / HTTP API：list / status / select / start / stop / open-dashboard 或等价命令。
- 实现单 active runtime 切换：关闭当前 active runtime，启动目标 runtime，更新 selected / active state，返回 Dashboard/API handoff。
- 对 stale / missing / unavailable 项目保留状态，不自动删除。

完成标准：

- `/api/v1/projects` 或等价 API 可返回多项目 summary。
- `projects start/stop/open` 或等价 CLI / API 能控制目标项目 daemon。
- 切换不复用旧项目 ServiceContainer、JobStore、file monitor、internal AI runtime 或 tool context。

### 阶段 4：Plugin Host Project Mismatch

生产窗口：`AlembicPlugin`

目标：

- Plugin 继续只绑定 Codex host project，默认 Ghost 初始化不变。
- 读取 Alembic selected / active project summary 或 daemon handoff 信息。
- 输出 `hostProject`、`activeProject`、`connectionState`、`handoffMismatch`。
- 当 mismatch 时，Plugin 不对非 host project 投递 bootstrap / rescan / daemon tool。

完成标准：

- Plugin status / dashboard handoff 能清楚显示 connected、disconnected、mismatch。
- 没有新增 Plugin 多项目切换 UI。
- 现有 Codex host-agent route 行为不回退。

### 阶段 5：Dashboard Project List And Handoff

生产窗口：`AlembicDashboard`

目标：

- 消费 Alembic projects API，展示项目列表、状态、mode、dataRoot、daemon / Dashboard / jobs / file monitor / internal AI summary。
- 第一版切换优先使用 Dashboard URL handoff 或显式重连目标项目 daemon；不强制同页 API target 切换。
- 若实现同页切换，必须统一 abort EventSource / fetch，刷新 runtimeBoundary，按 projectRoot 载入 project-scoped cache。

完成标准：

- UI 使用真实 API，不使用静态项目列表。
- 切换或 handoff 不让旧项目 scan / chat / refine stream 继续写入新项目状态。
- Dashboard 仍不实现 backend project discovery。

### 阶段 6：统一隔离验收与可选真实项目 Smoke

主控窗口：`AlembicWorkspace`

目标：

- 等阶段 1-5 推到稳定面后统一验收，不每一小波都做大归档。
- 验证 daemon、jobs、file monitor、internal AI、terminal sandbox、Dashboard cache、Plugin mismatch 不串项目。
- 必要时只给 `AlembicAgent` 派发真实 internal AI context 修复。
- 用户确认后可用 `BiliDili` 做只读真实项目 smoke。

完成标准：

- 跨仓库 build / smoke / focused tests 通过。
- 负向扫描确认没有 Plugin 端项目切换伪实现、没有 Dashboard 静态假数据、没有 Core 空 contract。
- workspace 统一归档。

## 当前确认状态

- 当前阶段：等待用户确认目标和阶段。
- 当前可派发窗口：`Alembic`。
- 发送给：`Alembic`。
- 第一波执行文档：[alembic-multi-project-control-wave-1-runtime-control-foundation-plan-2026-05-18.md](alembic-multi-project-control-wave-1-runtime-control-foundation-plan-2026-05-18.md)
- 第一波只发送 `Alembic`，因为它是真实 producer；其它窗口等待上游 evidence。

## 窗口分派

确认前必须保持不派发。确认后再创建或激活阶段 1 执行文档。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>暂停 | 等待用户确认；确认后第一波领取 Project Runtime Control Foundation。 |
| `AlembicCore`<br>阻塞 | 等待 Alembic 阶段 1 证明字段和 scope 模型后再沉淀 contract。 |
| `AlembicPlugin`<br>阻塞 | 等待 Alembic projects API / Core contract 后处理 hostProject mismatch。 |
| `AlembicDashboard`<br>阻塞 | 等待 Alembic projects API / handoff 字段后处理项目列表和切换。 |
| `AlembicAgent`<br>观察中 | 当前无执行任务；只在 internal AI isolation 发现真实缺口时派发。 |
| `BiliDili`<br>无任务 | 当前不做真实项目 smoke。 |

## 可复制提示词

发送给：无

```text
等待用户确认 Alembic 多项目控制最终目标与分阶段计划；当前不派发执行窗口。
```

不发送给：`AlembicCore`、`Alembic`、`AlembicPlugin`、`AlembicDashboard`、`AlembicAgent`、`BiliDili`。

## 回填区

### 用户确认

- 状态：已确认
- 确认时间：2026-05-18
- 用户调整：确认可以进行下一步。
- 确认后第一波执行文档：[alembic-multi-project-control-wave-1-runtime-control-foundation-plan-2026-05-18.md](alembic-multi-project-control-wave-1-runtime-control-foundation-plan-2026-05-18.md)
- 第一波发送窗口：`Alembic`
