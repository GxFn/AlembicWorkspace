# AlembicPlugin External AI Remnants Removal Workspace Plan

创建日期：2026-05-22
总控窗口：AlembicWorkspace
状态：准备中（总控代码依赖调研中，暂不派发实现窗口）
来源 TODO：`GTODO-2026-05-21-010`

## 用户目标

用户确认上一条 resident vector search 与 prime receipt shout 主线已经完成，要求归档完成文档，并准备开始下一条 TODO 主线：长线删除 `AlembicPlugin` 里旧内置第三方 AI 能力残留。

本主线的目标不是让 `AlembicPlugin` 再实现一套 AI provider，也不是把 Codex agent 能力桥接成 Alembic tool。目标是把 `AlembicPlugin` 收回到 Codex-facing 插件职责：

- Codex 智能、总结、推理和任务继续执行交给 Codex host agent。
- prime / search 所需的项目知识与可见 receipt 仍由 `AlembicPlugin` 提供 Codex tool result / Skill / runtime instruction。
- semantic / vector 增强通过本地 `Alembic` resident service 请求真实向量能力。
- `AlembicPlugin` 不再保留旧路线里的 AI 配置 / 状态 / 权限 surfaces，也不保留可被误解为可执行 provider runtime 的 `chat()` / `embed()` 外壳；如果需要兼容旧入口，只允许短期 fail-closed 边界提示，长期配置归 `Alembic` 主体。

## 用户补充确认

2026-05-22 用户补充确认：`Alembic` 初始设计曾打算整体做成 Codex 插件，所以 `AlembicPlugin` 里留下了初始项目 AI 配置；后来确认 Codex 不允许插件使用第三方 AI 扫描项目，产品路线才调整为“Codex 插件 + Alembic 主体”。因此 Plugin 侧旧 AI 配置本身已经不需要维护，应作为历史路线残留进入删除范围。

## 当前已归档主线

- prime immediate receipt shout 计划已归档到 [archive/2026-05/prime-immediate-receipt-shout/](archive/2026-05/prime-immediate-receipt-shout/)；SHOUT-7 已通过总控验收，用户确认不新增 AlembicTest 复测。
- resident vector search release 计划已归档到 [archive/2026-05/resident-vector-search-release/](archive/2026-05/resident-vector-search-release/)；Test-2026-05-22-01 通过，Plugin cache 已刷新到包含 SHOUT-7 与 resident vector bridge 的 AlembicPlugin 提交。

## 真实代码证据

本节只记录启动本主线前总控已核对的真实代码事实。AIP-0 会继续做完整调用方扫描，扫描完成前不派发删除实现。

- `AlembicPlugin/lib/codex/HostAiAdapter.ts:5` 定义的 `HostAiProvider` 仍是可执行 provider 形状，包含 `chat()`、`chatWithTools()`、`chatWithStructuredOutput()`、`enrichCandidates()`、`embed()`、`probe()` 和 `supportsEmbedding()`。
- `AlembicPlugin/lib/codex/HostAiAdapter.ts:97` 仍维护 Google / OpenAI / DeepSeek / Claude / Ollama provider config、默认模型、key env var 和 baseUrl；按用户最新确认，这部分属于 Plugin 旧 AI 配置路线残留，AIP-0 只需要扫描真实消费方以安排删除 / 迁移 / fail-closed。
- `AlembicPlugin/lib/codex/HostAiAdapter.ts:135` 的 `HostAiProviderManager` 仍有 `runtimeProvider`、`embedProvider`、`switchProvider()`、`setEmbedProvider()` 和 DI 同步能力；这些是本轮要确认是否需要收缩或拆分的核心残留。
- `AlembicPlugin/lib/codex/HostAiAdapter.ts:281` 的 `createHostManagedProvider()` 已将 `__hostAiExecutable=false` 与 `__hostEmbedExecutable=false` 写入 host-managed provider，但仍通过 `unavailableProviderMethods()` 填入不可执行的 `chat()` / `embed()` 方法。
- `AlembicPlugin/lib/codex/HostAiAdapter.ts:354` 的 `normalizeHostProvider()` 仍会补齐 unavailable provider 方法并计算 `__hostAiExecutable` / `__hostEmbedExecutable`；虽然 resident vector 主线已修掉 placeholder embed 误判，但 provider runtime 外形仍在。
- `AlembicPlugin/lib/codex/HostAiAdapter.ts:430` 的 `providerSupportsExecutableEmbedding()` 已收紧为只承认 `__hostEmbedExecutable === true`；这说明当前误判风险被局部压住，但不等于旧 provider runtime 外形已经清理。
- `AlembicPlugin/lib/codex/HostAiAdapter.ts:492` 的 `unavailableProviderMethods()` 仍以抛错方式实现 `chat()` / `embed()` 等方法，错误文案说明 AI execution 不在 AlembicPlugin 内置。
- `AlembicPlugin/lib/injection/modules/AiModule.ts:9` 初始化 `HostAiProviderManager`，并在 `:19` 把 `aiProvider` 与 `_embedProvider` 同步进 DI；这条链路会影响 `KnowledgeModule` 的 search / indexing provider 注入，必须先查真实消费方再删。
- `AlembicPlugin/lib/injection/modules/KnowledgeModule.ts:98` 创建 `searchEngine` 时仍用 `ct.singletons._embedProvider || aiProvider` 作为 Core `SearchEngine` 的 `aiProvider`；`:175` 创建 `indexingPipeline` 时同样把 `_embedProvider || aiProvider` 传给 Core `IndexingPipeline`。
- `AlembicPlugin/lib/http/routes/ai.ts:1` 已声明 Plugin 不再拥有 local AI execution，`:64` 的执行类接口会返回 501 `HOST_AI_MANAGED`；但 `:151` / `:200` / `:385` 仍提供 providers、config、workspace-config 与 embed provider/env 写入 surfaces，这些现在应按旧 Plugin AI 配置残留处理。
- `AlembicPlugin/lib/codex/ToolPolicy.ts:138` 仍暴露 `alembic_codex_ai_config` tool，描述为 Alembic internal bootstrap/rescan daemon jobs 使用；按最新产品口径，Plugin 不再承接 AI 配置，AIP-0 需确认删除该 tool 或改为指向 Alembic 主体配置入口的 fail-closed 提示。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:376` 的 `configureAi()` 仍能读写 `ALEMBIC_AI_PROVIDER` / `ALEMBIC_AI_MODEL` / key env 等 workspace config；这条链路现在属于重点删除候选，除非发现短期兼容测试必须保留 fail-closed 响应。

## 当前判断

删除方向已经收紧：Plugin 侧旧 AI 配置、状态、权限和 provider 外形都默认进入删除范围。

- 删除候选：`AlembicPlugin` 内部可执行 provider 外形、unavailable `chat()` / `embed()` 方法占位、DI `_embedProvider` 误用入口、把 Plugin 搜索 / 索引伪装成可本地执行 embedding provider 的残留。
- 删除候选：Plugin 侧 AI 配置 / 状态 / 权限 surfaces，包括 `alembic_codex_ai_config`、HTTP `/ai/*` config routes、provider list、workspace-config 写入、masked key status 和相关 Dashboard/API 兼容层。
- 允许短期保留的只有迁移性 fail-closed 边界提示：例如旧入口被调用时明确说明 Plugin 不再配置第三方 AI，并指向 `Alembic` 主体配置入口；这不是长期配置层，也不得继续写入 Plugin workspace AI config。
- 不删除 `Alembic` 主体自己的 internal AI / embedding 配置能力；如发现 Plugin 旧配置曾被用于 Alembic 主体任务，必须改成让调用方进入 Alembic 主体入口，而不是在 Plugin 继续维护配置。

因此本轮先做 AIP-0 代码依赖调研，再决定是否派发 `AlembicPlugin` 实现窗口。主闭环是“删除 Plugin 旧 AI 配置与 provider runtime 后，Codex prime/search 可继续工作、resident vector 增强仍可用、需要 AI 的 Alembic 主体能力回到 Alembic 主体配置入口”。

## 完成功能闭环

输入：

- Codex 用户在 `AlembicPlugin` 中使用 prime / search / init / diagnostics / dashboard 等 MCP tool；旧 `ai_config` 若仍存在，只能作为删除前扫描对象或短期 fail-closed 兼容入口。
- 已安装 Alembic resident service 时，Plugin 可请求 `/api/v1/search` 等本地增强服务。
- 未安装或未启动 Alembic 时，Plugin baseline knowledge search 仍可用，且不会谎称 embedding provider 可执行。

处理：

- Plugin 不直接执行第三方 AI `chat()` / `embed()` / `probe()`。
- Plugin 侧 AI config 不再作为能力保留；实现应删除旧配置入口，或在短期兼容入口中明确 fail-closed 并指向 Alembic 主体。
- Plugin 的 DI、SearchEngine、IndexingPipeline 和 HTTP / MCP surfaces 不再把 host-managed config 当成可执行 provider 注入。

输出：

- Codex 可见行为仍是 tool result + Skill 指令 + Codex 自己继续任务。
- search / prime metadata 能清楚区分 baseline search、resident vector enhancement unavailable、resident request failure 和 resident vector used。
- Plugin 不再提供会被理解为第三方 AI 配置中心的 API / tool；旧入口若被调用，应清楚返回已移除和下一步去 Alembic 主体配置。

完成定义：

- 真实调用方扫描证明旧 provider runtime 外形的删除不会断开 prime/search/init/diagnostics。
- `AlembicPlugin` 代码中不再存在会被消费方误认为可执行 `chat()` / `embed()` provider 的 host-managed placeholder。
- `AlembicPlugin` 内部 `SearchEngine` / `IndexingPipeline` provider 注入路径完成收敛，必要时显式走 resident service 或 baseline。
- `alembic_codex_ai_config` 与 HTTP `/ai/*` 配置 surfaces 被删除，或只剩短期 fail-closed 兼容提示；Plugin 不再写入第三方 AI provider / key / embed provider 配置。
- 代表性 unit / build / boundary / plugin runtime 校验通过；若用户要在 BiliDili 新窗口真实验证，再由总控创建 AlembicTest 测试单。

## 非目标

- 不恢复 `AlembicPlugin` 内置第三方 AI provider 网络调用。
- 不把 `AlembicPlugin` 变成 `AlembicAgent` 或 Alembic internal AI runtime。
- 不删除 Codex MCP、Skill、channel、marketplace、runtime artifact、prime/search/init/diagnostics 等 Plugin 核心能力。
- 不删除 `Alembic` resident service 的内部 AI / embedding 配置能力，除非先有替代入口和消费方迁移证据。
- 不修改 `BiliDili` 产品源码。
- 不在总控窗口直接运行真实项目测试、冷启动或 BiliDili 验证。

## 阶段计划

| 阶段 | 状态 | 主窗口 | 目标 | 输出 / 证据 | 是否可派发 |
| --- | --- | --- | --- | --- | --- |
| AIP-0 | 执行中 | `AlembicWorkspace` | 完成真实调用方扫描和删除边界设计，列出删除 / fail-closed / 转交 Alembic 主体候选。 | 更新本计划的代码调研、窗口状态和下一阶段派发条件。 | 否，总控内执行 |
| AIP-1 | 暂停 | `AlembicPlugin` | 按 AIP-0 结论删除 provider runtime 外形、旧 AI 配置 surfaces、DI provider 注入和相关文案。 | AlembicPlugin commit、执行记录、targeted tests。 | 待 AIP-0 |
| AIP-2 | 暂停 | `Alembic` / `AlembicDashboard` | 只有当旧 Plugin AI 配置删除需要 Alembic 主体入口补文案、Dashboard 删除消费方或跳转时启动。 | 对应仓库提交和消费方验证；无必要则明确无任务。 | 待 AIP-1 设计 |
| AIP-3 | 暂停 | `AlembicTest` | 用户需要真实 Codex / BiliDili 验证时，创建测试单验证 prime/search 仍可用且旧 ai_config 不再作为 Plugin 配置入口。 | `alembic-test-exchange.md` 测试单与回填证据。 | 待产品变更 |
| AIP-4 | 暂停 | `AlembicWorkspace` | 总控验收、归档、刷新全局 TODO 和索引。 | workspace 文档验证、归档和 commit。 | 待前序完成 |

## 窗口分派

当前阶段只由 `AlembicWorkspace` 做代码依赖调研和文档准备，不向其它窗口发送提示词。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | Alembic 主体保留自己的 internal AI / embedding 配置能力；AIP-0 前不派发，只有需要补主体入口文案或迁移提示才启动。 |
| `AlembicCore`<br>观察中 | 当前无共享 contract 变更；只有 AIP-0 证明需要共享配置 / search metadata contract 时再派发。 |
| `AlembicAgent`<br>无任务 | 本主线删除 Plugin 旧第三方 AI 残留，不修改 AlembicAgent runtime；除非扫描发现 Plugin 仍错误引用 Agent provider。 |
| `AlembicDashboard`<br>观察中 | 可能消费 HTTP `/ai/*` config surfaces；AIP-0 确认是否需要删除消费方、跳转或 UI 文案同步前不派发。 |
| `AlembicPlugin`<br>观察中 | 最终实现主窗口，但当前等待总控 AIP-0 调研，不提前删除代码。 |
| `AlembicTest`<br>观察中 | 当前没有测试单；只有产品变更完成且需要真实 Codex / BiliDili 验证时再创建测试单。 |
| `BiliDili`<br>无任务 | 本主线不改真实 iOS 项目源码；只可能作为 AlembicTest 的验证对象。 |

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AIP-TODO-1 | 执行中 | 代码调研 | P0 | `AlembicWorkspace` | 扫描 `HostAiAdapter`、`AiModule`、`KnowledgeModule`、HTTP `/ai/*` routes、MCP `alembic_codex_ai_config`、tests 和 release boundary，确认删除 / fail-closed / 转交 Alembic 主体候选。 | 是 | 当前文档创建后立即执行；完成前不派发实现窗口。 | `AlembicWorkspace` |
| AIP-TODO-2 | 待启动 | 删除实现 | P0 | `AlembicPlugin` | 删除可执行 provider runtime 外形、旧 AI 配置 surfaces 和 `_embedProvider` 注入，让 Plugin 不再暴露第三方 AI 配置或执行残留。 | 是 | 等 AIP-TODO-1 产出明确删除边界和验证命令。 | `AlembicPlugin` |
| AIP-TODO-3 | 观察中 | 主体入口 | P1 | `Alembic` / `AlembicPlugin` | 如果旧 Plugin AI config 被用户或文档引用，需要改为 fail-closed 并指向 Alembic 主体配置入口；不在 Plugin 继续保存配置。 | 可能 | AIP-TODO-1 发现真实消费方或迁移提示需求后启动。 | 待定 |
| AIP-TODO-4 | 观察中 | UI/API 同步 | P2 | `AlembicDashboard` | 若 Dashboard 消费 HTTP `/ai/*` config surfaces，确认应删除、隐藏或改成指向 Alembic 主体状态。 | 可能 | AIP-TODO-2 触发 API 可见变化时启动。 | `AlembicDashboard` |
| AIP-TODO-5 | 暂停 | 真实项目验证 | P1 | `AlembicTest` | 在产品变更完成后验证 Codex prime/search 仍可用、receipt shout 仍由 Codex 发声、旧 ai_config 不再作为 Plugin 配置入口。 | 是 | 等产品仓库提交和总控创建测试单；当前不启动。 | `AlembicTest` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 观察 | 否 | Alembic 主体配置入口可能需要提示对齐，但上游调研未完成。 |
| `AlembicCore` | 观察 | 否 | 暂无共享 contract 变更证据。 |
| `AlembicAgent` | 无任务 | 否 | 本主线不改 Agent runtime。 |
| `AlembicDashboard` | 观察 | 否 | 等旧 `/ai/*` API 删除影响明确后再判断。 |
| `AlembicPlugin` | 观察 | 否 | 最终主实现窗口，等待 AIP-0 删除边界。 |
| `AlembicTest` | 观察 | 否 | 当前无测试单。 |
| `BiliDili` | 无任务 | 否 | 不改真实项目源码。 |

## 可复制分派提示词

发送给：无。

当前不向任何执行窗口发送提示词。AIP-0 完成前，`AlembicPlugin` 不应提前删除 `HostAiAdapter` 或 AI config surfaces；AIP-0 完成后，默认方向是删除 Plugin 侧旧 AI 配置，而不是维护它。

不发送给：`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（无任务）、`AlembicDashboard`（观察中）、`AlembicPlugin`（观察中）、`AlembicTest`（观察中）、`BiliDili`（无任务）。

## 验证策略

AIP-0 当前只做文档和代码依赖调研，需运行 workspace 文档校验：

- `node scripts/verify-workspace-docs.mjs --all-workspace`
- `node scripts/check-dispatch-coverage.mjs`
- `node scripts/check-todo-board.mjs --require`
- `git diff --check`

进入 AIP-1 后，`AlembicPlugin` 至少需要补充：

- 针对 `HostAiAdapter` / DI provider / resident search fallback 的 targeted unit tests。
- `npm run build:check`
- `npm run verify:codex-plugin`
- `npm run verify:release-package-boundary`
- 与删除候选相关的 `rg` 负向扫描。

是否创建 AlembicTest 测试单，由 AIP-1 变更范围和用户是否需要真实 Codex / BiliDili 验证决定。

## 回填区

- 2026-05-22：总控创建本计划，归档 prime immediate receipt shout 与 resident vector search release 两条完成主线，启动 `GTODO-2026-05-21-010` 的 AIP-0 调研准备。当前发送给无，所有执行窗口保持观察或无任务。
- 2026-05-22：用户补充确认旧 AI 配置来自“整体做成 Codex 插件”的早期路线；由于 Codex 插件不能使用第三方 AI 扫描项目，产品已改成 Codex 插件 + Alembic 主体模式。因此 Plugin 侧 AI 配置 / 状态 / 权限 surfaces 默认进入删除范围，长期配置归 Alembic 主体。
