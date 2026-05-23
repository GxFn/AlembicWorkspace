# Alembic Repository Responsibility Function Boundary Contract

状态：已生效（GFBD-1 证据已验收）
维护窗口：AlembicWorkspace
最后更新：2026-05-22

## 定位

本文是 Alembic 系列仓库的长期职责功能划分文档。它用于回答三个问题：

1. 新功能应该进入哪个仓库。
2. 旧功能应该保留、下沉、删除、迁移还是只改命名。
3. 跨仓库调用、发布物、测试验证和总控协作应该如何交接。

本文不替代每个仓库自己的 `AGENTS.md`、package exports、测试规则或发布说明。具体实现仍以目标仓库真实代码和本 workspace 当前计划为准。

## 当前总原则

- `Plugin first, Alembic install enhances` 是长期产品路线。
- `AlembicPlugin` 是 Codex host agent 入口，负责让 Codex 在 IDE Agent 场景下可用、可理解、可交互。
- `Alembic` 是本地增强底座，负责安装后提供 daemon、HTTP/API、Dashboard server、ProjectRegistry、JobStore、file monitor、internal AI jobs、semantic/vector search 和发布/安装能力。
- `AlembicCore` 是共享、确定性、可复用、可运行的 Headless 内核。`host-agent-workflows` 在 Core 中表示宿主 Agent 可消费的确定性 workflow / session / evidence / checkpoint contract，不表示 Core 拥有 Agent runtime。
- `AlembicAgent` 承载 internal agent runtime、AI provider、tools、memory、context、prompt、task/profile/domain 和执行循环。它不是 Codex host agent。
- `AlembicDashboard` 是前端 UI 仓库，只消费 Alembic 主体 API，不通过 Plugin 承载 Dashboard 业务 API。
- `AlembicTest` 是独立测试验证窗口，不承载产品实现，不改真实测试项目的产品结构。
- `AlembicWorkspace` 是总控工作区，只做需求设计、计划、验收、归档、模板和协作规则。

## 仓库职责

| 仓库 | 应拥有 | 不应拥有 | 典型对外面 | GFBD-1 证据 |
| --- | --- | --- | --- | --- |
| `Alembic` | CLI、daemon、HTTP/API、Dashboard server/static hosting、ProjectRuntimeControl、ProjectRegistry、file monitor、JobStore、resident semantic/vector search、internal AI jobs 的宿主装配、PathGuard、DB lifecycle、release staging、本地安装与 dev link。 | Codex plugin runtime、Codex channel/cache、Dashboard 前端源码主实现、Core public API 源实现、Agent runtime 源实现、真实项目测试脚本。 | `alembic` CLI、daemon HTTP API、Dashboard server、release package。 | [Alembic GFBD-1 evidence](../Alembic/global-function-boundary-evidence-main-2026-05-22.md) |
| `AlembicCore` | 共享 deterministic headless contract / service / repository / workflow / vector / guard / project-intelligence / database / resources / public API governance。 | 宿主 CLI、daemon process lifecycle、Codex MCP、Skill/channel、Dashboard UI、AI provider、AgentRuntime、tool router、真实项目测试脚本。 | `@alembic/core` public exports、resources、public API boundary policy。 | [AlembicCore GFBD-1 evidence](../AlembicCore/global-function-boundary-evidence-core-2026-05-22.md) |
| `AlembicAgent` | Internal AI / Agent runtime、AI provider、tool system、Tool V2、terminal portable policy、prompts、memory、context、task/profile/domain、internal execution loop、agent package release staging。 | Codex host agent 入口、Codex MCP/channel/cache、Alembic daemon/API、Dashboard UI、Core deterministic implementation、真实项目测试操作。 | `@alembic/agent` exports。 | [AlembicAgent GFBD-1 evidence](../AlembicAgent/global-function-boundary-evidence-agent-2026-05-22.md) |
| `AlembicDashboard` | React/Vite UI、API client、hooks、components、i18n、theme、前端状态、可视化、Help/onboarding 文案和前端构建产物。 | Daemon/API 主实现、Codex Plugin runtime、internal AI jobs、Core / Agent runtime、真实项目测试脚本。 | Vite build output，Alembic daemon 提供的 Dashboard 页面。 | [AlembicDashboard GFBD-1 evidence](../AlembicDashboard/global-function-boundary-evidence-dashboard-2026-05-22.md) |
| `AlembicPlugin` | Codex MCP server、Codex Skills、channel/marketplace/cache、plugin runtime artifact、Codex-facing prime/search/Guard/shout、host project 对齐、portable runtime、Gateway/governance、Alembic resident service request client。 | 第三方 AI provider runtime、Alembic daemon 主实现、Dashboard 业务 API、internal Agent runtime、真实项目测试脚本。 | `alembic-codex-mcp`、Codex plugin manifest/channel/runtime artifact、MCP tools、Skill instructions。 | [AlembicPlugin GFBD-1 evidence](../AlembicPlugin/global-function-boundary-evidence-plugin-2026-05-22.md) |
| `AlembicTest` | 测试单执行、真实项目复现、冷启动监控、回归、restart/monitor/probe 脚本、测试报告和证据整理。 | 产品实现、源码迁移、发布物构建、真实项目业务改造、默认运行时清理逻辑。 | `docs/workspace/current/alembic-test-exchange.md` 测试单和 `AlembicTest/docs/` 报告。 | [AlembicTest GFBD-1 evidence](../../AlembicTest/docs/global-function-boundary-evidence-test-2026-05-22.md) |
| `AlembicWorkspace` | 跨仓库需求设计、计划分派、验收、归档、模板、TODO、规则和长期职责边界文档。 | 产品源码实现、真实项目测试执行、发布包主实现、运行时服务。 | `docs/workspace/index.md`、当前计划、模板和总控脚本。 | 已由 workspace 规则覆盖。 |

## 功能归属判断规则

### 进入 AlembicPlugin

满足以下条件时，优先进入 `AlembicPlugin`：

- Codex host agent 直接消费，例如 MCP tool schema、tool result payload、Skill instruction、Codex 可见 receipt shout、prime/search/Guard 交互语义。
- 无 Alembic 本地 daemon 时也需要提供最小可用路径。
- 属于 plugin runtime、channel、cache、marketplace、portable runtime packaging 或 installation verification。
- 属于 Plugin 自己的 host project resolution、permission/tier/gateway/constitution 等请求治理。
- 属于 Alembic resident service 的显式 request client，例如 `ResidentSearchClient` 或 `alembic_codex_*` daemon job handoff。

不能因为 Plugin 能请求 Alembic service，就把 Plugin 做成空壳 client。也不能把 Plugin 的 Codex-facing 能力误判为旧 Agent 残留。

### 进入 Alembic

满足以下条件时，优先进入 `Alembic`：

- 需要常驻本地服务、daemon lifecycle、HTTP/API、ProjectRegistry、JobStore、file monitor 或 Dashboard server。
- 需要管理本地数据、workspace registry、cold-start / rescan job、internal AI jobs、semantic/vector index 或 system-wide telemetry。
- 属于 release staging、npm package、本地安装、dev link 或 Dashboard dist serving。
- 属于 Codex 以外的本地增强能力，或 Plugin 通过 HTTP/service client 请求的增强能力。
- 属于 Agent runtime 的宿主装配、AI settings/env persistence、ToolContextFactory、host tool adapters、sandbox bridge、provider hot reload trigger。

### 进入 AlembicCore

满足以下条件时，才下沉 `AlembicCore`：

- 能力是确定性的、可复用的、无宿主 UI/CLI/daemon 生命周期耦合。
- 至少有两个真实仓库消费，或一个仓库生产、另一个仓库消费同一稳定 contract。
- public API、类型、错误语义、数据结构、持久化边界和 resource delivery 可以长期维护。
- 下沉后不会把 host agent presentation、Dashboard、daemon process、AI provider、AgentRuntime、Codex MCP、Skill/channel 或发布脚本耦合带入 Core。

Core 的 `host-agent-workflows` 是 workflow contract，不是 Agent runtime ownership。

### 进入 AlembicAgent

满足以下条件时，进入 `AlembicAgent`：

- 属于 internal AI provider、LLM gateway、runtime context、tool routing、memory/context/prompt、agent run、profile/task/domain。
- 由 Alembic 主体 internal AI jobs 消费，而不是由 Codex host agent 直接承担。
- 可以作为 `@alembic/agent` public export 被 Alembic 主体消费。

Codex MCP、marketplace、channel packaging 和 Codex host-agent route 仍归 `AlembicPlugin`。

### 进入 AlembicDashboard

满足以下条件时，进入 `AlembicDashboard`：

- 是页面、组件、hooks、i18n、theme、API client、前端状态或可视化。
- 只通过 Alembic daemon/API/SSE/WebSocket 获取数据。
- 需要前端 build、浏览器验证或 UI 文案维护。

Dashboard 可以展示 runtime / host-agent 字段，但不拥有这些运行时。

### 进入 AlembicTest

满足以下条件时，进入 `AlembicTest`：

- 是真实项目复测、冷启动监控、回归、复现脚本、probe 或测试报告。
- 需要操作 BiliDili 或其它真实测试项目。
- 需要跨仓库集成验证但不属于产品源码实现。

包含 stop/clean/restart 能力的脚本只能在授权测试任务中运行。

## 跨仓库交界

| 交界 | 正确方向 | 说明 |
| --- | --- | --- |
| Plugin -> Alembic | Plugin 按需请求 Alembic resident service。 | semantic/vector search、daemon status、dashboard handoff、explicit bootstrap/rescan jobs 通过 service/API 请求，不通过 MCP ownership bridge。 |
| Alembic -> Core | Alembic 消费 Core public API 或受控 transitional deep export。 | Core 是内核，不反向依赖 Alembic。Alembic scripts 的 Core transitional deep import 违规是外层 consumer replacement 债。 |
| Plugin -> Core | Plugin 消费 Core public API / portable runtime vendor。 | `vendor/AlembicCore` 是 portable runtime 例外，不等同于 Plugin 复制 Core 源实现。 |
| Alembic -> Agent | Alembic internal AI jobs 消费 Agent runtime。 | Alembic 保留 DI、HTTP、daemon、settings、ToolContextFactory 和 concrete adapters。 |
| Dashboard -> Alembic | Dashboard 消费 Alembic daemon/API/SSE/WebSocket。 | Dashboard 不接入 Plugin，不通过 Plugin compatibility route 获取业务 API。 |
| Test -> Workspace / 产品仓库 | Test 回填证据，问题回到源仓库。 | Test 不在真实项目或产品仓库中做实现修复。 |
| Workspace -> 所有窗口 | Workspace 分派、验收和记录。 | Workspace 不实现产品功能。 |

## 后续候选与 TODO

| ID | 事项 | 当前判断 | 推荐后续窗口 |
| --- | --- | --- | --- |
| GFBD-OQ-1 | `Alembic` 与 `AlembicPlugin` 都使用 `alembic-ai@0.2.0` 的发布身份重叠。 | 当前不阻塞职责契约；Alembic 是 npm/local install 主包，Plugin 是 private artifact-only runtime。长期需要发布命名澄清。 | `AlembicWorkspace` / `Alembic` / `AlembicPlugin` |
| GFBD-OQ-2 | Core deep exports / wildcard exports 收敛。 | Core 当前 136 exports，61 wildcard、98 transitional；必须 consumer-replace-first，不能直接删除。 | `AlembicCore` + 消费仓库 |
| GFBD-OQ-3 | Plugin `candidates` route 的 `HOST_AI_MANAGED` 语义。 | 仍有 fail-closed compatibility surface 和 MCP/test 消费，需单独分类真实消费方。 | `AlembicPlugin` |
| GFBD-OQ-4 | Dashboard HelpView / i18n 旧 MCP / Skill / Agent Runtime 文案。 | 文案债，不是 Dashboard 运行时边界问题；需要以 AlembicPlugin / Alembic 当前事实校准。 | `AlembicDashboard` |
| GFBD-OQ-5 | Alembic DB boundary lint 债。 | 不阻塞职责契约；后续可作为质量线。 | `Alembic` |
| GFBD-OQ-6 | AlembicAgent 文档中 `host agent` 与 internal agent runtime 的表达。 | 本契约已固定：Codex host agent 归 Plugin，Agent 归 internal AI runtime；后续可做文档修正。 | `AlembicAgent` |
| GFBD-OQ-7 | Alembic 主仓库 `lib/external/mcp` 命名。 | 当前仍被 CLI / daemon jobs / HTTP routes / tests 消费，不得直接删除；可后续按 Alembic service handler / schema legacy name 重命名。 | `Alembic` |
| GFBD-OQ-8 | AlembicTest restart / clean 脚本授权边界。 | 应保留在测试窗口，继续依赖总控或用户授权，不迁入产品 runtime。 | `AlembicTest` |

## 维护规则

- 新功能进入某仓库前，先按本文“功能归属判断规则”判断归属。
- 需要跨仓库修改时，先明确 producer / consumer：上游 contract 未回填前，下游不得猜字段或做空 adapter。
- 派发给执行窗口时，必须要求读取 workspace `AGENTS.md`、当前总控文档和目标仓库 `AGENTS.md`，并先声明当前窗口定位。
- 清理兼容代码时，必须记录真实消费方、保留理由、移除条件和触发点；没有消费方且已有替代入口时，进入删除候选。
- 不得为了目录好看把完整能力改成薄实现或空壳接口。
- 不得把 Core workflow contract 误读成 Agent runtime，不得把 Codex host agent 误读成 AlembicAgent。
- 长期职责边界每次被真实代码改变后，应回填本文，并在 `docs/workspace/index.md` 保持入口。
