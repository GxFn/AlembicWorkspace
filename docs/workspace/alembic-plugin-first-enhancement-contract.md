# Alembic Plugin First Enhancement Contract

状态：长期契约
维护窗口：AlembicWorkspace
适用范围：`Alembic`、`AlembicPlugin`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、真实测试项目

## 核心路线

Alembic 产品路线采用 `Plugin first, Alembic install enhances`：

- `AlembicPlugin` 是 Codex host agent 的第一入口，负责让用户在 Codex 环境里直接获得可用能力。
- `Alembic` 是本地增强底座，负责安装后提供更强的 daemon、HTTP/API、Dashboard server、文件监控、JobStore、ProjectRegistry 和 internal AI job 能力。
- 两条线共享同一个项目目录判断、同一个 ghost data root、同一套 Core contract 和 Recipe 数据，不形成两套割裂体验。
- 没有安装 `Alembic` 时，Plugin 必须能依赖宿主 Agent 能力完成 cold-start、rescan、Guard、检索、知识提交和 Dashboard handoff 的基础路径。
- 安装 `Alembic` 后，Plugin 应优先复用本地 daemon / CLI / API / Dashboard server 来增强体验、节约 token、提高增量扫描和后台任务稳定性。

## 模块归属

### AlembicPlugin

职责：

- Codex MCP tools、skills、channel / marketplace metadata、plugin runtime artifact、安装验证和 Codex 宿主适配。
- 面向 Codex host agent 的 status、init、bootstrap、rescan、guard、search、submit、Dashboard handoff。
- 检测本地 `alembic` 可用性，并在可用时切换到或增强为本地 Alembic 能力。
- 携带必要的 runtime snapshot 和 Dashboard release artifact，但不拥有 Dashboard 前端源码。

不得承担：

- 不复制 Alembic daemon、ProjectRegistry、WorkspaceResolver、JobStore、file monitor 或 internal AI runtime 的长期实现。
- 不重新维护 Cursor / VSCode / Claude Code / Qoder / Trae 等多 IDE Agent delivery 模板。
- 不把 Plugin artifact 当成 npm 包发布主线；Plugin 产物服务 Codex plugin / marketplace。

### Alembic

职责：

- 本地增强底座：CLI、daemon、HTTP/API、Dashboard server、ProjectRegistry、WorkspaceResolver、JobStore、文件监控、internal AI jobs、安装 / dev / release 链路。
- 对 Plugin 暴露稳定的本地 API / CLI / daemon 入口。
- 在多个项目目录间维护明确的 project registry、data root 和 job 状态，避免只依赖某一个 IDE 窗口上下文。
- 提供可独立运行的 internal AI cold-start / rescan 能力，产物写入同一 ghost data root。

不得承担：

- 不再作为多 IDE Agent delivery 聚合器维护各 IDE 模板、安装器、镜像器和专用 agent 冷启动入口。
- 不复制 Plugin 的 Codex MCP / skill / channel onboarding 逻辑。
- 不把 Dashboard 前端源码移入主包；主包只负责服务 Dashboard build artifact 或代理 Dashboard server。

### AlembicCore

职责：

- 共享、确定性、可复用的 headless contract、类型、schema、索引、存储和可测试核心逻辑。
- 不引入 Codex、daemon、HTTP、Dashboard、AI provider 或宿主 Agent 专属依赖。

### AlembicAgent

职责：

- AI provider、tool system、terminal / sandbox tool contracts、context、memory、prompt、策略和执行循环。
- 为 Alembic internal AI jobs 提供 runtime 能力，但不承接 Plugin 的 Codex MCP / marketplace 入口。

### AlembicDashboard

职责：

- 前端 UI、API client、路由、状态、样式、可视化和前端测试。
- 产物由 `Alembic` server 或 `AlembicPlugin` runtime artifact 消费；源码仍归 Dashboard 仓库维护。

## 前端边界契约

前端产品归 `AlembicDashboard`，运行和服务归 `Alembic`，`AlembicPlugin` 只做 Codex 入口和 Dashboard URL handoff，不做前端所有者。

执行顺序：

1. `AlembicPlugin` 不再拥有前端源码和前端逻辑，只保留 Dashboard URL handoff、Codex tool 返回链接和必要 artifact 指向。
2. 评估 Plugin artifact 内的 `dashboard/dist` 是否应改成来自 `Alembic` / `AlembicDashboard` release asset，而不是 Plugin 自己构建或维护。
3. 只有确认 Codex 插件可以依赖本机 Alembic 的 Dashboard server / release asset 后，才允许删除 Plugin 内嵌 Dashboard dist。

在第三步确认前，不把删除 Plugin 内嵌 Dashboard dist 作为常规清理任务。

### BiliDili

职责：

- 真实项目验证目标。默认不进入日常 Alembic 开发流程。
- 不直接承接 Alembic 测试执行任务；需要真实项目接入、扫描、验证或复现时，由 `AlembicTest` 使用 BiliDili 执行并回填证据。

### AlembicTest

职责：

- 真实项目测试、smoke 验证、冷启动监控、复现和验证报告。
- 只承接测试验证和证据整理，不承接产品源码实现。

## 能力放置规则

- 面向 Codex 工具调用、宿主 Agent 协作、marketplace 安装和 skill 使用的能力，优先放在 `AlembicPlugin`。
- 后台服务、长期进程、跨项目 registry、文件监控、任务队列、HTTP API、本地 Dashboard server 和 internal AI job，优先放在 `Alembic`。
- 可被 Plugin 和 Alembic 同时消费、且不依赖宿主环境的确定性逻辑，优先放在 `AlembicCore`。
- 涉及 AI provider、terminal、sandbox、tool execution、context / memory / prompt 的通用 agent runtime，优先放在 `AlembicAgent`。
- 涉及用户界面、API client、可视化和交互状态，优先放在 `AlembicDashboard`。

## AI 来源契约

所有仓库写入、展示或路由 AI / knowledge source 时必须先按本节判断，不允许把 provider 配置、执行 runtime 和业务机制混成同一个 source。

| 场景 | source / 字段 | 归属 |
| --- | --- | --- |
| Codex / 外部宿主 Agent 提交知识、提案或维度完成 | `host-agent` | `AlembicPlugin` 宿主 Agent 线 |
| Alembic internal AI runtime / AlembicAgent 通用写入 | `alembic-agent` | `Alembic` + `AlembicAgent` 内部 AI 线 |
| 宿主编辑事件推送 | `host-edit` | file-change / reactive evolution |
| git 监控事件 | `git-head` / `git-worktree` | Alembic daemon file monitor |
| rescan、file-change、decay、consolidation 等领域机制 | 保持 `rescan-evolution`、`file-change`、`decay-scan`、`consolidation` 等 domain source | 对应领域服务 |
| 旧历史来源 | `ide-agent` / `ide-edit` | 仅兼容读取，不作为新写入默认值 |
| AI provider / model / key 来源 | `provider`、`model`、`configSource` 等 capability 字段 | 配置状态，不是 knowledge source |

执行约束：

- `host-agent` 不表示 Alembic 自己配置的 internal AI，也不表示 AlembicAgent。
- `alembic-agent` 不表示 Codex / 外部宿主 Agent。
- domain source 优先表达真实功能机制；只有无法用具体机制描述、且确实由 AlembicAgent 通用 runtime 产生的写入，才使用 `alembic-agent`。
- Dashboard 只能展示 source contract，不重新解释路由归属。

## 增强路径

未安装 `Alembic`：

- Plugin 使用 Codex host agent 执行 cold-start、rescan、Guard 和知识提交。
- Plugin 通过 runtime snapshot、Core contract 和 host-agent tools 提供基础体验。
- 输出仍写入约定 ghost data root，避免后续安装 Alembic 后重复迁移数据。

已安装 `Alembic`：

- Plugin 检测本地 Alembic CLI / daemon / HTTP API 可用性。
- Plugin 将重任务交给 Alembic daemon / JobStore / file monitor / internal AI jobs。
- Alembic 提供 Dashboard server 和多项目 registry；Plugin 继续作为 Codex 入口和任务触发器。

## 反模式

- 不再把 `Alembic` 做成另一个和 Plugin 竞争的 IDE 入口。
- 不在 `AlembicPlugin` 内复制 daemon、watcher、JobStore、ProjectRegistry 或 internal AI runtime。
- 不在 `Alembic` 内恢复多 IDE Agent 模板、安装命令或专属 delivery pipeline。
- 不为了边界好看删除仍在被真实调用的能力；删除必须有替代入口、扫描结果和验证证据。

## 总控执行要求

后续涉及 Alembic / Plugin 分工的计划，必须先按本文判断能力归属，再分配窗口任务。若真实代码证明本文边界需要调整，总控应新建计划记录证据、替代方案、消费方影响和验收命令，不能只在单个窗口内隐式改变长期路线。
