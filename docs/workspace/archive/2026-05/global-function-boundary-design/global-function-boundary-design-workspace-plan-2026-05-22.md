# Global Function Boundary Design Workspace Plan

日期：2026-05-22
状态：GFBD-2 已完成（六个窗口证据已验收，长期职责契约已生效，等待下一主线）
总控窗口：AlembicWorkspace

## 目标

本计划用于形成 Alembic 系列仓库的全局职责功能划分长期文档。总控先统一设计文档框架和判断规则，同时派发各窗口做真实代码挖掘；各窗口回填后，由总控统一收敛为长期维护的职责边界契约。

长期职责契约：[alembic-repository-responsibility-function-boundary-contract.md](../../../alembic-repository-responsibility-function-boundary-contract.md)。

本轮不改产品源码、不移动目录、不删除兼容层、不做真实项目复测。所有窗口只做证据采集、边界判断和后续任务候选记录。

## 总控判断

当前任务分区是“总控文档 / 规则治理 + 代码事实分析 + 分配计划”。用户已明确要求总控统一思考，同时派发各窗口进行真实代码挖掘，因此本轮不走新的原始计划书 / 需求设计确认流程，而是新建 workspace 当前计划和长期职责契约草案。

当前真实阻塞点：没有各仓库最新证据前，长期职责边界不能定稿，也不能贸然派发清理或迁移。阻塞点之前可以完成：总控草案、证据采集模板、任务包分配、TODO 账本更新和文档挂载。

2026-05-22 用户口径更新：`AlembicCore` 本轮证据采集中出现身份错误，把自身职责写成 `AlembicAgent`。该错误口径不得进入 GFBD-2 总控整合；`AlembicCore` 已按 GFBD-P1-C 返工，只回填 `@alembic/core` 的共享 Headless 内核、public exports、`src` 分层、resources 和 consumer import boundary 事实。

## 已知代码事实快照

以下只是总控启动前的横向预扫描，不替代各窗口回填。

| 仓库 | 真实入口 / 发布身份 | 当前主要目录事实 | 初始职责判断 |
| --- | --- | --- | --- |
| `Alembic` | `alembic-ai@0.2.0`，CLI bin `alembic` -> `dist/bin/cli.js` | `lib/cli`、`lib/daemon`、`lib/http`、`lib/service`、`lib/infrastructure`、`lib/repository`、`lib/workflows`、`dashboard/dist`、`.release/alembic-ai`、`vendor/AlembicCore`、`vendor/AlembicDashboard` | 本地增强底座、daemon/API/Dashboard server、ProjectRegistry、JobStore、file monitor、internal AI jobs、release staging 与本地安装能力。 |
| `AlembicCore` | `@alembic/core@0.2.0`，大量 public exports | `src/core`、`src/domain`、`src/infrastructure`、`src/repository`、`src/service`、`src/workflows`、`resources/grammars` | 共享、确定性、可复用、可运行的 Headless 内核能力；public API 迁移需极谨慎。 |
| `AlembicAgent` | `@alembic/agent@0.2.0`，exports `agent` / `service` / `runtime` / `ai` / `tools` / `memory` / `context` | `src/agent`、`src/external`、`src/tools`、`src/shared`、release staging scripts | Agent runtime、AI provider、tool system、策略、上下文、memory、prompt 和执行循环。 |
| `AlembicDashboard` | `alembic-dashboard@0.2.0`，Vite app | `src/components`、`src/hooks`、`src/i18n`、`src/lib`、`src/theme`、`public`、`dist` | 前端 UI、API client、前端状态、路由、样式、可视化和前端测试；不接入 Plugin。 |
| `AlembicPlugin` | `alembic-ai@0.2.0`，bin `alembic-codex-mcp`，Codex channel/plugin artifact | `lib/codex`、`lib/external/mcp`、`lib/governance`、`lib/service`、`plugins/alembic-codex`、`channels/codex`、`vendor/AlembicCore` | Codex host agent 入口、MCP/Skill/channel/cache、Codex-facing prime/search/Guard 交互、portable runtime 和 Alembic resident service request client。 |
| `AlembicTest` | 独立测试验证窗口 | `docs/`、`config/`、测试脚本和真实项目验证记录 | 真实项目操作、复现、冒烟、回归、冷启动监控和证据整理；不是产品实现仓库。 |

## 长期设计原则

- 产品路线遵循 `Plugin first, Alembic install enhances`：`AlembicPlugin` 是 Codex host agent 入口，`Alembic` 是本地增强底座。
- `host agent` 默认指 Codex host agent；不要与 `AlembicAgent` internal agent runtime 混用。
- `AlembicPlugin` 不是空壳 client：它必须保留 Codex / IDE Agent 自洽闭环，包括 MCP 工具入口、Skill、Codex 可见响应、权限 / tier、host project 对齐、baseline knowledge search、Guard 调用入口、runtime packaging、channel/cache 和无 Alembic 时最小可用路径。
- `Alembic` 不是 Codex plugin 的复制品：它作为常驻本地服务提供 daemon、HTTP/API、Dashboard server、ProjectRegistry、JobStore、file monitor、internal AI jobs、semantic/vector search 和安装 / 发布能力。
- `AlembicCore` 只承载共享确定性能力；只有出现多个真实生产方 / 消费方，并且 API 稳定，才下沉。
- `AlembicAgent` 承载 internal AI / agent runtime；Plugin 不能重新引入第三方 AI provider 或本地 Agent runtime。
- `AlembicDashboard` 只消费 Alembic 主体 API，不通过 Plugin 做 Dashboard 业务 API。
- `AlembicTest` 只负责验证和证据，不承载产品功能。

## 阶段计划

| 阶段 | 状态 | 目标 | 发送窗口 |
| --- | --- | --- | --- |
| GFBD-0 | 已完成 | 总控创建当前计划、长期草案和证据采集任务包。 | 无 |
| GFBD-1 | 已完成 | 各窗口并行挖掘真实代码，回填职责边界证据，不改产品源码。 | 无 |
| GFBD-2 | 已完成 | 总控整合回填，修订长期职责契约，归类进入 / 留在 / 删除候选 / 不得删除 / 反馈给其他窗口。 | 无 |
| GFBD-3 | 观察中 | 基于 TODO 和阻塞点，决定是否派发下一轮真实修正或清理任务包。 | 等用户指定下一主线 |

## 任务包

下一处真实阻塞点：总控没有各仓库真实代码证据，长期职责边界不能定稿。

阻塞点之前还能做：各窗口并行采集证据、写清职责判断、列出删除 / 下沉 / 不得移动候选，并回填验证结果。

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| GFBD-P1-A | `Alembic` | 本地增强底座职责证据。 | 已完成 |
| GFBD-P1-C | `AlembicCore` | 共享 Headless 内核职责证据返工。 | 已完成 |
| GFBD-P1-G | `AlembicAgent` | internal agent runtime 职责证据。 | 已完成 |
| GFBD-P1-D | `AlembicDashboard` | 前端 UI / API client 职责证据。 | 已完成 |
| GFBD-P1-P | `AlembicPlugin` | Codex host agent 入口职责证据。 | 已完成 |
| GFBD-P1-T | `AlembicTest` | 测试验证窗口职责证据。 | 已完成 |

执行前置硬规则：任何后续返工或新增派发，都必须先读取本 workspace `AGENTS.md`、本计划和目标仓库自己的 `AGENTS.md`，并先明确声明当前窗口定位、目标仓库职责、本轮任务职责和明确不承担的职责；无法确认定位时必须停下回填阻塞。

### GFBD-P1-A：Alembic 本地增强底座证据

窗口：`Alembic`

当前阶段目标：挖掘本地增强底座职责边界。

主线动作：

- 读取 `Alembic/AGENTS.md`、package imports、CLI、daemon、HTTP、Dashboard server、service、workflows 和 release staging 入口。
- 列出功能归属、外部消费方、Core / Agent / Dashboard / Plugin 交界、删除 / 下沉候选和不得移动项。

合并 TODO：`GFBD-TODO-3`、`GFBD-TODO-7`。

明确不包含：不改源码，不修 lint，不移动目录，不更新 vendor。

下一处真实阻塞点：总控没有 Alembic 主体边界证据无法定稿。

阻塞点之前还能做：回填代码证据、路径、入口、验证命令和风险。

阻塞 / 依赖：无上游代码依赖，只依赖本仓库真实扫描。

验证命令：

```text
git -C Alembic status --short
目标 rg / find 扫描
git -C Alembic diff --check
```

回填要求：新建 `docs/Alembic/global-function-boundary-evidence-main-2026-05-22.md`，并在本计划回填摘要。

### GFBD-P1-C：AlembicCore 共享内核证据

窗口：`AlembicCore`

当前阶段目标：挖掘共享 Headless 内核职责边界。

主线动作：

- 读取 `AlembicCore/AGENTS.md`、public exports、`src` 分层、resources 和 consumer import boundary。
- 列出哪些能力应留 Core、哪些 deep export 是历史债、哪些 API 可作为跨仓库 contract。
- 返工时必须使用 `AlembicCore` / `@alembic/core` 身份；不得把 `AlembicAgent` 的 Agent runtime、AI provider、tool system、memory、prompt 或 execution loop 写成 Core 职责。
- 若看到 `host-agent-workflows` 等 Core exports，只能按共享 workflow contract / 类型 / 确定性内核能力分析，不得据此把 Core 解释成 host agent 或 internal agent runtime。

合并 TODO：`GFBD-TODO-2`、`GFBD-TODO-9`。

明确不包含：不改 public exports，不迁移源码，不收紧 API。

下一处真实阻塞点：总控没有 Core public API / deep export 风险证据无法定稿。

阻塞点之前还能做：回填 exports 事实、消费者风险、下沉 / 禁止下沉判断。

阻塞 / 依赖：无上游代码依赖，只依赖本仓库真实扫描。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、本计划和 `AlembicCore/AGENTS.md`。
- 先明确声明当前窗口定位是 `AlembicCore`，本轮职责是共享、确定性、可复用、可运行的 Headless 内核证据采集，不是 `AlembicAgent` internal agent runtime 证据采集。
- 如果无法确认 Core / Agent 边界，先停下回填阻塞，不继续写证据文档。

验证命令：

```text
git -C AlembicCore status --short
public exports 扫描
git -C AlembicCore diff --check
```

回填要求：新建 `docs/AlembicCore/global-function-boundary-evidence-core-2026-05-22.md`，并在本计划回填摘要。

### GFBD-P1-G：AlembicAgent 内部 Agent Runtime 证据

窗口：`AlembicAgent`

当前阶段目标：挖掘 internal agent runtime 职责边界。

主线动作：

- 读取 `AlembicAgent/AGENTS.md`、exports、AI provider、runtime、tools、memory、context、prompt 和 task 入口。
- 列出 Alembic 主仓库消费方式、Plugin 禁止复制边界和文档口径债。

合并 TODO：`GFBD-TODO-6`。

明确不包含：不改 agent runtime，不改 provider，不更新 release staging。

下一处真实阻塞点：总控没有 Agent runtime 与 host agent 语义区分证据无法定稿。

阻塞点之前还能做：回填 internal agent 能力边界、public API、消费者、禁止进入 Plugin 的能力。

阻塞 / 依赖：无上游代码依赖，只依赖本仓库真实扫描。

验证命令：

```text
git -C AlembicAgent status --short
exports/imports 扫描
git -C AlembicAgent diff --check
```

回填要求：新建 `docs/AlembicAgent/global-function-boundary-evidence-agent-2026-05-22.md`，并在本计划回填摘要。

### GFBD-P1-D：AlembicDashboard 前端职责证据

窗口：`AlembicDashboard`

当前阶段目标：挖掘前端 UI 职责边界。

主线动作：

- 读取 `AlembicDashboard/AGENTS.md`、Vite entry、API client、hooks、components 和 i18n。
- 列出 Dashboard 只消费 Alembic API 的证据、HelpView / MCP 文案债和不接入 Plugin 的边界。

合并 TODO：`GFBD-TODO-5`。

明确不包含：不改 UI，不改文案，不跑真实 Dashboard 手动验证。

下一处真实阻塞点：总控没有 Dashboard API 消费和文案债证据无法定稿。

阻塞点之前还能做：回填 API client 路径、功能页面、前端状态、文案风险和后续修正候选。

阻塞 / 依赖：无上游代码依赖，只依赖本仓库真实扫描。

验证命令：

```text
git -C AlembicDashboard status --short
API/i18n/component 扫描
git -C AlembicDashboard diff --check
```

回填要求：新建 `docs/AlembicDashboard/global-function-boundary-evidence-dashboard-2026-05-22.md`，并在本计划回填摘要。

### GFBD-P1-P：AlembicPlugin Codex 入口证据

窗口：`AlembicPlugin`

当前阶段目标：挖掘 Codex host agent 入口职责边界。

主线动作：

- 读取 `AlembicPlugin/AGENTS.md`、MCP、Skill、channel、cache、runtime、codex、service、search、guard 和 governance 入口。
- 列出 Plugin 自洽闭环、Alembic service request client、portable compatibility、Core vendor 边界和剩余 HTTP 语义候选。

合并 TODO：`GFBD-TODO-4`、`GFBD-TODO-8`。

明确不包含：不改源码，不刷新 plugin cache，不打包 runtime，不删除 candidates route。

下一处真实阻塞点：总控没有 Plugin first 边界证据无法定稿。

阻塞点之前还能做：回填 Codex-facing 入口、tool result / Skill contract、resident service 调用、fallback 和删除候选。

阻塞 / 依赖：无上游代码依赖，只依赖本仓库真实扫描。

验证命令：

```text
git -C AlembicPlugin status --short
MCP/runtime/channel/search 扫描
git -C AlembicPlugin diff --check
```

回填要求：新建 `docs/AlembicPlugin/global-function-boundary-evidence-plugin-2026-05-22.md`，并在本计划回填摘要。

### GFBD-P1-T：AlembicTest 测试窗口证据

窗口：`AlembicTest`

当前阶段目标：挖掘测试验证窗口职责边界。

主线动作：

- 读取 `AlembicTest` 自身规则、docs、config 和 scripts。
- 不运行真实项目，列出测试单、复现、冷启动、真实项目保护、证据回填和总控交接边界。

合并 TODO：无。

明确不包含：不操作 BiliDili，不跑测试，不改真实项目。

下一处真实阻塞点：总控没有测试窗口边界证据时，长期职责文档对验证链路不完整。

阻塞点之前还能做：回填测试职责、禁止事项、证据格式和与 `alembic-test-exchange.md` 的关系。

阻塞 / 依赖：无上游代码依赖，只依赖测试仓库文档和脚本扫描。

验证命令：

```text
git -C AlembicTest status --short
docs/config/scripts 扫描
git -C AlembicTest diff --check
```

回填要求：新建 `AlembicTest/docs/global-function-boundary-evidence-test-2026-05-22.md`，并在本计划回填摘要。

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | GFBD-P1-A 已验收，本地增强底座职责证据进入长期契约。 |
| `AlembicCore`<br>已完成 | GFBD-P1-C 已按 Core 身份返工并验收，共享 Headless 内核职责证据进入长期契约。 |
| `AlembicAgent`<br>已完成 | GFBD-P1-G 已验收，internal agent runtime 职责证据进入长期契约。 |
| `AlembicDashboard`<br>已完成 | GFBD-P1-D 已验收，前端 UI / API client 职责证据进入长期契约。 |
| `AlembicPlugin`<br>已完成 | GFBD-P1-P 已验收，Codex host agent 入口职责证据进入长期契约。 |
| `AlembicTest`<br>已完成 | GFBD-P1-T 已验收，测试窗口自身边界证据进入长期契约。 |
| `BiliDili`<br>无任务 | 真实 iOS 项目不参与本轮职责文档代码挖掘。 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 | 否 | GFBD-P1-A 已验收。 |
| `AlembicCore` | 已完成 | 否 | GFBD-P1-C 已按 Core 身份返工并验收。 |
| `AlembicAgent` | 已完成 | 否 | GFBD-P1-G 已验收。 |
| `AlembicDashboard` | 已完成 | 否 | GFBD-P1-D 已验收。 |
| `AlembicPlugin` | 已完成 | 否 | GFBD-P1-P 已验收。 |
| `AlembicTest` | 已完成 | 否 | GFBD-P1-T 已验收。 |
| `BiliDili` | 无任务 | 否 | 真实 iOS 项目不参与本轮职责边界证据采集。 |

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GFBD-TODO-1 | 已完成 | 长期契约 | P0 | `AlembicWorkspace` | 建立全局职责功能划分长期文档，明确每个仓库的拥有能力、禁止能力、交界 contract、真实消费方和后续清理触发点。 | 是，影响后续所有目录 / 删除 / 下沉 / 迁移派发。 | 长期契约已生效。 | `AlembicWorkspace` |
| GFBD-TODO-2 | 观察中 | public API 债 | P1 | `AlembicCore` | Core `src/core` / wildcard deep exports 是否需要长期收敛，需要先确认消费者和迁移风险。 | 否，当前不改 API。 | GFBD-P1-C 已归并到长期契约；后续按 consumer-replace-first 单独处理。 | `AlembicCore` |
| GFBD-TODO-3 | 观察中 | repo-boundary 债 | P1 | `Alembic` | Alembic 既有 DB boundary lint 债需要独立判断，不混入职责文档证据采集。 | 否，当前不修 lint。 | GFBD-P1-A 已归并；后续可另开质量线。 | `Alembic` |
| GFBD-TODO-4 | 观察中 | 清理候选 | P1 | `AlembicPlugin` | `candidates` route 的 `HOST_AI_MANAGED` fail-closed 语义需要单独分类真实消费方和命名边界。 | 否，当前不改 Plugin。 | GFBD-P1-P 已回填到 `docs/AlembicPlugin/global-function-boundary-evidence-plugin-2026-05-22.md`，等待 GFBD-2 总控归并。 | `AlembicPlugin` |
| GFBD-TODO-5 | 观察中 | UI / 文案口径 | P1 | `AlembicDashboard` / `AlembicPlugin` / `Alembic` | Dashboard HelpView / i18n 中 MCP tool surface 旧口径与实际 Alembic / Plugin 工具分叉可能不一致。 | 否，当前不改 UI。 | GFBD-P1-D 和 GFBD-P1-P 回填。 | `AlembicDashboard` |
| GFBD-TODO-6 | 观察中 | 文档口径 | P2 | `AlembicAgent` | AlembicAgent 文档路径和 `host agent` / internal agent runtime 语义需避免混淆。 | 否。 | 长期契约已固定语义；若要改仓库文档，另开窄任务。 | `AlembicAgent` |
| GFBD-TODO-7 | 观察中 | 发布身份 | P1 | `Alembic` / `AlembicPlugin` | `Alembic` 与 `AlembicPlugin` root package 都使用 `alembic-ai@0.2.0` 的身份重叠，需要区分 npm 发布物、Codex runtime artifact 和本地开发入口。 | 否，当前不改版本或发布。 | GFBD-P1-A 和 GFBD-P1-P 回填。 | `AlembicWorkspace` |
| GFBD-TODO-8 | 观察中 | 质量债 | P2 | `AlembicPlugin` | AlembicPlugin 既有 Biome lint 债仍在，不塞进职责文档证据采集；后续可作为质量线。 | 否。 | GFBD-P1-P 已记录为既有质量债，本轮不修。 | `AlembicPlugin` |
| GFBD-TODO-9 | 已完成 | 证据质量 | P0 | `AlembicCore` | `AlembicCore` GFBD-P1-C 回填必须纠正身份错误：只分析 Core 共享 Headless 内核，不把自身写成 `AlembicAgent`。 | 是，阻塞 GFBD-2 长期契约定稿。 | Core 返工已验收，长期契约已写清 `host-agent-workflows` 是 workflow contract。 | `AlembicCore` |

## 可复制分派提示词

发送给：无。

GFBD-1 / GFBD-2 已完成，当前无可发送窗口；等待用户指定下一主线。

不要发送给：`Alembic`（已回填待验收）、`AlembicCore`（已回填待验收）、`AlembicAgent`（已回填待验收）、`AlembicDashboard`（已回填待验收）、`AlembicPlugin`（已回填待验收）、`AlembicTest`（已回填待验收）或 `BiliDili`。

## 回填区

- 2026-05-22：总控创建 GFBD 当前计划和长期职责契约草案。当前只派 GFBD-1 真实代码挖掘任务；长期文档保持草案状态，等待各窗口证据回填后再定稿。
- 2026-05-22：用户指出 `AlembicCore` 证据采集存在身份错误，把自己当成了 `AlembicAgent`。总控暂停 GFBD-2 整合，不使用该口径补写长期契约；随后已按 `AlembicCore` / `@alembic/core` 身份返工 GFBD-P1-C，只分析共享 Headless 内核职责。
- 2026-05-22：`Alembic` 完成 GFBD-P1-A 真实代码挖掘并回填，执行记录见 `docs/Alembic/global-function-boundary-evidence-main-2026-05-22.md`。完成范围：读取 Alembic 主仓库规则、package identity、CLI/daemon/http/dashboard server/service/workflows/release staging 入口，扫描 Core / Agent / Dashboard / Plugin 交界，复核 Bootstrap、PathGuard、ServiceContainer、AgentModule、ToolContextFactory、ProjectRuntimeControl、resident search、MCP handler/tool 定义和 release source resolver；未改产品源码、未移动目录、未删除兼容层、未运行真实项目测试。关键代码证据：`alembic-ai@0.2.0` 的 CLI bin 为 `dist/bin/cli.js`，package files 包含 `dashboard/dist`、`injectable-skills`、`templates`、`resources/openChrome.applescript`；生产代码 / 脚本 / config 中 `@alembic/core` 命中文件数 123、`@alembic/agent` 命中文件数 49；HTTP routes 27 个，`lib/external/mcp` 文件 22 个且仍被 CLI / daemon jobs / HTTP routes / tests 复用。职责判断：Alembic 是本地增强底座和 resident service owner，拥有 CLI、daemon、HTTP/API、Dashboard 托管、ProjectRuntimeControl、Bootstrap、PathGuard、DB lifecycle、governance、host tool adapters、sandbox bridge、release staging；Core / Agent / Dashboard / Plugin 分别保留 shared headless core、internal agent runtime、frontend UI、Codex host agent 入口。删除/下沉/不得移动候选：`lib/external/mcp` 命名可后续单独评估但不得直接删除；Core deep import allowlist 是 API 债；`bin/`、`lib/daemon`、`lib/http`、`lib/injection`、`lib/service`、`lib/tools/adapters`、`lib/governance`、`dashboard/dist`、release/source resolver 等不得移动。验证命令：`git -C Alembic status --short`、`sed` 读取计划 / AGENTS / package、`find lib -maxdepth 2 -type d | sort`、Core/Agent import `rg` 统计、HTTP route / MCP 文件计数、交界 `rg` 扫描、`git -C Alembic diff --check`。验证结果：通过；Alembic 产品仓库无未提交改动。遗留风险：`lib/external/mcp` legacy name 与 Plugin-first 边界存在口径风险、Core deep import 面仍大、`alembic-ai` package 身份与 Plugin runtime 历史重叠、既有 DB boundary lint 债需另开质量线。下一步建议：GFBD-2 总控整合时将 Alembic 定义为本地增强底座 / resident service owner，并单独开窄任务处理 `lib/external/mcp` 命名和 Core public API 收敛。
- 2026-05-22：根据用户反馈，任务包展示从横向宽表调整为“窄索引 + 单包详情卡”。后续任务包模板和校验脚本也按卡片格式维护，避免开发者横向滚动阅读。
- 2026-05-22：`AlembicTest` 完成 GFBD-P1-T 证据采集并回填，详细报告见 [../../AlembicTest/docs/global-function-boundary-evidence-test-2026-05-22.md](../../../../../AlembicTest/docs/global-function-boundary-evidence-test-2026-05-22.md)。
  - 完成范围：只读取 `AlembicTest` 自身规则、`README`、`docs/testing-operation-policy.md`、`config/defaults.json`、`scripts/README.md`、restart / monitor / probe 脚本和 `alembic-test-exchange.md` 关系；未操作 BiliDili，未运行真实项目测试，未改产品源码。
  - 关键代码证据：`AGENTS.md` 明确 AlembicTest 不是产品源码仓库，只保留验证脚本、复现说明、测试证据和报告；`testing-operation-policy.md` 将真实项目测试脚本归 `AlembicTest/scripts/`、长期测试报告归 `AlembicTest/docs/`、workspace 根脚本限定为总控治理；`config/defaults.json` 只保存测试默认目标、restart/monitor 等待时间和日志信号配置；`probe-*` 脚本通过 workspace AlembicPlugin MCP 做只读 prime/search 证据采集，`restart-alembic.mjs` 通过 Alembic CLI 编排测试 runtime，`monitor-alembic-bootstrap.mjs` 只读观察 Jobs API / logs。
  - 职责边界判断：AlembicTest 应保留真实项目测试编排、冷启动监控、只读 probe、测试配置、长期验证报告和总控测试单回填；不得承载 Alembic daemon/API/Dashboard server、Core headless 能力、Agent runtime、Dashboard UI、Plugin MCP/Skill/channel 实现或 BiliDili 产品功能。
  - 删除 / 下沉 / 不得移动候选：未发现需立即删除的产品实现副本；没有应下沉为产品 API 的稳定能力；`probe-codex-prime.mjs`、`probe-resident-vector-search.mjs`、`restart-alembic.mjs`、`monitor-alembic-bootstrap.mjs`、`config/defaults.json` 和 `docs/*.md` 测试报告均应留在 AlembicTest，不应迁入产品仓库或 workspace 根脚本。
  - 验证命令：`git -C AlembicTest status --short --branch`、`rg --files AlembicTest`、定向 `rg` 扫描 docs/config/scripts/test exchange、`git -C AlembicTest diff --check`。
  - 验证结果：扫描通过；`git -C AlembicTest diff --check` 通过；未运行 `npm --prefix AlembicTest run check`、restart、monitor、probe 或 BiliDili 命令，因为 GFBD-P1-T 明确禁止本轮运行真实项目测试。
  - 遗留风险：`restart-alembic.mjs` 包含 stop/clean/restart 能力，必须继续依赖总控或用户授权；历史报告可能含 localhost 端口、pid、projectId 等运行态摘要，后续仍需避免写入 token/key/登录态；全局职责契约仍需等待其它窗口回填后统一收敛。
  - 下一步建议：总控在 GFBD-2 将 AlembicTest 定义为独立测试验证窗口；真实项目测试脚本继续留在 `AlembicTest/scripts/`，总控治理脚本留在 workspace 根 `scripts/`，产品能力不得因测试便利复制到 AlembicTest。
- 2026-05-22：`AlembicDashboard` GFBD-1 已完成，证据文档见 `docs/AlembicDashboard/global-function-boundary-evidence-dashboard-2026-05-22.md`。完成范围：读取 Dashboard 仓库规则，扫描 Vite/React 入口、`src/App.tsx` 页面组合、`src/api.ts` HTTP/SSE client、`src/lib/socket.ts` realtime client、hooks/components/i18n/help 文案和 runtime boundary DTO；未改产品源码、未移动目录、未删除兼容层、未运行真实项目测试。关键代码证据：`src/api.ts` 统一使用 `/api/v1`，scan/chat/refine 流走 `fetch('/api/v1/.../stream')` + `EventSource('/api/v1/.../events')`；`src/lib/socket.ts` 只连 `/socket.io`；`src/types.ts` 注释明确 Dashboard DTO 只是 transport/view types，编排归 Alembic；`src/App.tsx` 和 `validTabs` 持有页面组合；`HelpView` / zh/en i18n 存在 Codex host agent、MCP tools、Skills、Codex Plugin、Agent Runtime 等文案口径。职责边界判断：Dashboard 是 Alembic HTTP/SSE/WebSocket 的前端消费方和 UI state owner，不拥有 Core 内核、Agent runtime、Plugin MCP/channel/cache、Alembic daemon/server/release。删除/下沉/不得移动候选：无产品源码删除候选；Help/i18n MCP/Plugin/`asd` 口径是后续文案修正候选；runtime boundary normalization 若未来多消费方可考虑生成 contract；Views/Layout/Shared/ui/API client/socket/public/Vite 入口不得迁到 Core/Agent/Plugin。验证命令：`git -C AlembicDashboard status --short`、Help/i18n/MCP `rg` 扫描、API/socket `rg` 扫描、route/state `rg` 扫描、`git -C AlembicDashboard diff --check`。验证结果：Dashboard 仓库干净，扫描证据已归档，diff 检查通过。遗留风险：Help/i18n 文案长期漂移风险高，尤其 MCP tool/Skill 数量和 CLI 命令；Dashboard 仍展示 AI provider/internal AI 状态，长期文档需区分展示状态和拥有 runtime。下一步建议：GFBD-2 总控整合时固化 Dashboard 为前端消费方；后续另开 Dashboard 文案修正任务，以 AlembicPlugin / Alembic 当前 capability 事实为准。
- 2026-05-22：`AlembicPlugin` 完成 GFBD-P1-P 真实代码挖掘并回填，执行记录见 `docs/AlembicPlugin/global-function-boundary-evidence-plugin-2026-05-22.md`。完成范围：读取 Plugin 规则、package identity、Codex MCP stdio entry、tool schema、task/search/guard/system handlers、Skill、channel、runtime artifact、Codex runtime/status/diagnostics/preflight、resident service request client、candidate fail-closed route、governance 和 SkillHooks 入口；未改产品源码、未移动目录、未删除兼容层、未运行真实项目测试。关键代码证据：root `package.json` 仍为 private `alembic-ai@0.2.0`，bin `alembic-codex-mcp`；`bin/codex-mcp.ts` 启动 `CodexMcpServer`；`CodexMcpServer.ts` 持有 MCP tool dispatch、daemon job query、plugin-owned tool fallback 和 Alembic enhancement daemon handoff；prime handler 继续保留 `hostResponse` 与 `primeKnowledgeMaterial.evidenceRefs`；resident search client 调 `/api/v1/search` 并把 Codex `auto` 转为 resident `semantic`；`lib/agent`、`lib/tools`、`lib/external/ai` 不存在。职责判断：Plugin 是 Codex host agent 入口，拥有 Codex MCP / Skill / channel / runtime artifact / host-visible response / request governance / baseline search / portable runtime；Alembic service 能力只通过 resident service client 增强，不在 Plugin 内复刻 Alembic daemon、Dashboard UI、Core headless 或 Agent runtime。删除/下沉/不得移动候选：`HOST_AI_MANAGED` candidates fail-closed route、旧 AI 术语注释和 package 身份重叠进入 GFBD-2 候选；`lib/codex`、`lib/external/mcp`、`plugins/alembic-codex`、`channels/codex`、portable runtime、`vendor/AlembicCore` 例外、governance / SkillHooks 不得移走或当作 agent 残留删除。验证命令：`git -C AlembicPlugin status --short`、agent extraction boundary report、forbidden import/path `rg` 扫描、old HTTP surface `rg` 扫描、`HOST_AI_MANAGED` 扫描、`git -C AlembicPlugin diff --check`。验证结果：Plugin 产品仓库保持无未提交改动；边界报告 330 个源文件、0 个 agent/ai/tools forbidden import；旧 HTTP surface 仅剩测试/报告/注释语境；`HOST_AI_MANAGED` 只剩 candidates route 及其 MCP/test 消费。遗留风险：`candidates` route 命名仍需 GFBD-2 分类；root `alembic-ai@0.2.0` 与 Alembic package 身份重叠需发布语义澄清；既有 Biome lint 债本轮不修。下一步建议：GFBD-2 总控把 Plugin 固化为 Codex host agent 入口，并另开窄任务处理 candidates 命名 / fail-closed 口径与发布身份文档化。
- 2026-05-22：`AlembicCore` 完成 GFBD-P1-C 返工并回填，执行记录见 `docs/AlembicCore/global-function-boundary-evidence-core-2026-05-22.md`。完成范围：读取 Core 规则、package/public API boundary、`src` 分层、resources/grammars、public API scripts、边界测试和外层 consumer imports；未改产品源码、未调整 public exports、未迁移源码、未收紧 API、未运行真实项目测试。关键代码证据：`@alembic/core@0.2.0` 当前 136 个 exports，75 exact、61 wildcard；policy 分类为 stable=17、provisional=21、transitional=98，wildcard 为 migration-only；`src/host-agent-workflows.ts` 明确 Core 稳定宿主 agent 领取任务、提交证据、完成维度、恢复 checkpoint 的确定性协议，Codex MCP tool、Skill、AgentRuntime、tool policy、AI provider 和多渠道交付均留外层；`resources/grammars/*.wasm` 随包发布，`ensure-grammars` 不再运行时 npm install；Core 边界测试禁止 delivery/tool/agent/Codex/MCP/plugin/channel/marketplace 目录、exports、dependencies 和 copied implementation 进入 Core。职责判断：Core 拥有共享 deterministic headless contract / service / repository / workflow / resource / public API governance；不拥有 AI provider、AgentRuntime、tool system、Codex MCP、Skill/channel、CLI/daemon process、HTTP server、Dashboard UI 或真实项目测试。删除/下沉/不得移动候选：Core 本轮无直接删除候选；wildcard/deep exports 是 consumer-replace-first 的 API 债；AST grammar、public API policy/scripts、workspace/project identity、daemon/job/runtime contracts、host-agent workflow contracts、database/repository/search/vector/guard/knowledge deterministic core 不得移出 Core；AI provider/AgentRuntime/tool router/Codex MCP/Skill/channel/Dashboard UI 不得下沉 Core。验证命令：`git -C AlembicCore status --short`、`node scripts/check-public-api-boundary.mjs --format text`、consumer import boundary lint for Alembic/AlembicAgent/AlembicPlugin、targeted `rg` 扫描、`git -C AlembicCore diff --check`。验证结果：Core 产品仓库干净；public API boundary 通过；AlembicAgent consumer boundary 通过（230 files / 49 imports）；AlembicPlugin consumer boundary 通过（330 files / 505 imports）；Alembic consumer boundary 发现 4 个 scripts transitional deep import violations，归外层 consumer replacement 债，不是本轮 Core 源码问题。遗留风险：Core public API 面仍大，外层对 repository/service/drizzle/migration deep imports 仍有 allowlist 依赖；`WorkspaceSettingsStore` 的 provider key shape 是共享配置兼容 contract，不能误读为 Core 拥有 AI provider；`host-agent-workflows` 名称需在长期契约中持续区分为 workflow contract 而非 Agent runtime。下一步建议：GFBD-2 总控整合时将 Core 固化为 shared deterministic headless core owner，并把 Alembic scripts 的 4 个 consumer boundary violations 转入外层修正候选。
- 2026-05-22：总控重新以 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 六个窗口均完成为基线进行 GFBD-1 验收。结论：六份证据均满足本轮只读证据采集要求，没有产品源码改动或真实项目测试；Core 返工后身份口径正确。总控已完成 GFBD-2 整合，长期职责契约 [alembic-repository-responsibility-function-boundary-contract.md](../../../alembic-repository-responsibility-function-boundary-contract.md) 状态改为已生效。当前无发送窗口，等待用户指定下一主线。
