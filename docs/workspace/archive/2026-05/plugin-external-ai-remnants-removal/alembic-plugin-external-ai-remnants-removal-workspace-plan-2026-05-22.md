# AlembicPlugin External AI Remnants Removal Workspace Plan

创建日期：2026-05-22
总控窗口：AlembicWorkspace
状态：AIP-1 总控验收通过，主线功能完成
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

- prime immediate receipt shout 计划已归档到 [archive/2026-05/prime-immediate-receipt-shout/](../prime-immediate-receipt-shout)；SHOUT-7 已通过总控验收，用户确认不新增 AlembicTest 复测。
- resident vector search release 计划已归档到 [archive/2026-05/resident-vector-search-release/](../resident-vector-search-release)；Test-2026-05-22-01 通过，Plugin cache 已刷新到包含 SHOUT-7 与 resident vector bridge 的 AlembicPlugin 提交。

## 真实代码证据

本节记录启动本主线前与 AIP-0 总控代码依赖调研核对到的真实代码事实。AIP-0 结论是：本轮不需要启动 `AlembicDashboard` 源码窗口；`AlembicPlugin` 已明确不构建、不打包、不服务 Dashboard 前端，只在本地 Alembic daemon 已提供 Dashboard 能力时做 URL handoff。因此 Dashboard 仓库里的通用 LLM 配置 UI 不是本轮必改下游，Plugin 内部带有 `DashboardOperations` 命名的兼容 API 若碰到旧 AI provider manager，则归 `AlembicPlugin` 自身清理范围。

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
- `AlembicPlugin/lib/codex/Preflight.ts:126` 对 `alembic_codex_bootstrap` / `alembic_codex_rescan` 做 internal AI provider gate，失败 nextActions 里仍在 `:160` 推荐 `alembic_codex_ai_config`；AIP-1 应移除这条 Plugin 配置推荐，优先给 Codex host-agent workflow，或指向 Alembic 主体配置入口。
- `AlembicPlugin/lib/codex/AiConfigState.ts:27` 仍通过 `WorkspaceSettingsStore.readAiConfig()` 与 `ALEMBIC_AI_PROVIDER` 等环境变量生成 Plugin 侧 masked AI config 状态；`StatusService.ts:132`、`Diagnostics.ts:75`、`EnhancementRoute.ts:125` 和 `http/routes/daemon.ts:67` 仍消费该状态。这说明旧配置不仅是一个 tool，而是进入了 status / diagnostics / daemon health 的可见能力判断。
- `AlembicPlugin/lib/external/mcp/handlers/system.ts:22` 仍通过 `readHostAiConfigInfo()` 把 Plugin AI config 写进 health issues；AIP-1 应让 Plugin health 不再把第三方 AI provider 作为自身健康项。
- `AlembicPlugin/lib/http/dashboard/DashboardOperations.ts:114` 的 `rebuildSemanticIndex()` 仍检查 `container.singletons?._aiProviderManager` 来判断 embedding provider 是否 host-managed；这不是 AlembicDashboard 源码消费方，而是 Plugin 内部兼容 API，应随 `_aiProviderManager` 删除一起调整为 resident vector / baseline 语义。
- `AlembicPlugin/test/support/codex-session/AgentSimulator.ts:120` 仍会根据用户文本调用 `alembic_codex_ai_config`；`test/support/codex-session/AgentOutputAnalyzer.ts:38` 仍读取 `inspectCodexAiConfig()`；`test/unit/CodexMcpServer.test.ts:201`、`test/unit/CodexToolPolicy.test.ts:75` 和 `test/unit/HostAiAdapter.test.ts:3` 等测试仍把旧 AI config / HostAiAdapter 当作有效边界，AIP-1 必须同步删除或改成负向测试。
- `AlembicPlugin/README.md:53`、`plugins/alembic-codex/RELEASE-PLAYBOOK.md:10` 和 `test/unit/CodexModuleBoundary.test.ts:27` 已确认 Dashboard frontend source/build/serving 属于 Alembic/AlembicDashboard，Plugin role 是 `dashboard-url-handoff-only`；这支撑本轮不派发 `AlembicDashboard`。
- `Alembic/lib/http/routes/ai.ts` 和 Alembic 主体 daemon capability 仍承接真实 AI provider / embedding / internal AI 状态；本轮不删除 Alembic 主体能力，也不把其配置迁回 Plugin。

## 当前判断

删除方向已经收紧：Plugin 侧旧 AI 配置、状态、权限和 provider 外形都默认进入删除范围。

- 删除候选：`AlembicPlugin` 内部可执行 provider 外形、unavailable `chat()` / `embed()` 方法占位、DI `_embedProvider` 误用入口、把 Plugin 搜索 / 索引伪装成可本地执行 embedding provider 的残留。
- 删除候选：Plugin 侧 AI 配置 / 状态 / 权限 surfaces，包括 `alembic_codex_ai_config`、HTTP `/ai/*` config routes、provider list、workspace-config 写入、masked key status 和相关 Dashboard/API 兼容层。
- 允许短期保留的只有迁移性 fail-closed 边界提示：例如旧入口被调用时明确说明 Plugin 不再配置第三方 AI，并指向 `Alembic` 主体配置入口；这不是长期配置层，也不得继续写入 Plugin workspace AI config。
- 不删除 `Alembic` 主体自己的 internal AI / embedding 配置能力；如发现 Plugin 旧配置曾被用于 Alembic 主体任务，必须改成让调用方进入 Alembic 主体入口，而不是在 Plugin 继续维护配置。

因此 AIP-0 已经可以收口：当前只派发 `AlembicPlugin` 执行 AIP-1。主闭环是“删除 Plugin 旧 AI 配置与 provider runtime 后，Codex prime/search 可继续工作、resident vector 增强仍可用、需要 AI 的 Alembic 主体能力回到 Alembic 主体配置入口”。

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
| AIP-0 | 已完成 | `AlembicWorkspace` | 完成真实调用方扫描和删除边界设计，列出删除 / fail-closed / 转交 Alembic 主体候选。 | 当前计划已更新代码证据、窗口状态和 AIP-1 派发条件。 | 否，总控内完成 |
| AIP-1 | 已完成 | `AlembicPlugin` | 按 AIP-0 结论删除 provider runtime 外形、旧 AI 配置 surfaces、DI provider 注入和相关文案。 | AlembicPlugin `747b40f2abb2b9d8cb2714656fab164267d1d105`；AlembicCodex runtime `01fb042afe87264ad213dfc13444dc9dc48b77ca`；执行记录见 [../AlembicPlugin/alembic-plugin-external-ai-remnants-removal-2026-05-22.md](../../../../AlembicPlugin/alembic-plugin-external-ai-remnants-removal-2026-05-22.md)；总控复核通过。 | 否，已完成 |
| AIP-2 | 无任务 | `Alembic` | 只有当 Plugin fail-closed 文案必须引用 Alembic 主体新增入口、CLI 文案或能力字段时启动。 | 总控验收判断：现有 Plugin fail-closed 与 Alembic 主体边界足够，不需要 Alembic 代码 / 文案补丁。 | 否 |
| AIP-3 | 暂停 | `AlembicTest` | 用户需要真实 Codex / BiliDili 验证时，创建测试单验证 prime/search 仍可用且旧 ai_config 不再作为 Plugin 配置入口。 | 本轮暂不创建测试单；删除旧 Plugin AI 配置 surface 已由 Plugin unit / codex-session / boundary / runtime 校验覆盖。 | 待用户需要真实验证时再启动 |
| AIP-4 | 已完成 | `AlembicWorkspace` | 总控验收、刷新全局 TODO、索引和本机 Codex plugin cache。 | workspace 文档验证通过；本机 Codex plugin cache 已刷新到 AlembicPlugin `747b40f2abb2b9d8cb2714656fab164267d1d105`，mode=`local-mcp`。 | 否，已完成 |

## 窗口分派

当前阶段为 AIP-1 总控验收通过，当前不再发送领取任务提示词。其它窗口不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>无任务 | Alembic 主体保留自己的 internal AI / embedding 配置能力；AIP-1 不需要 Alembic 主体补文案或能力字段。 |
| `AlembicCore`<br>无任务 | 当前无共享 contract 变更；Plugin 侧删除 `_embedProvider` / `aiProvider` 注入应在 Plugin adapter 层完成，不下沉 Core。 |
| `AlembicAgent`<br>无任务 | 本主线删除 Plugin 旧第三方 AI 残留，不修改 AlembicAgent runtime；除非扫描发现 Plugin 仍错误引用 Agent provider。 |
| `AlembicDashboard`<br>无任务 | 用户确认 Plugin 不再直接引用 Dashboard；代码证据也显示 Plugin 只做 Dashboard URL handoff，不构建、不打包、不服务 Dashboard 前端。本轮不派发 Dashboard 源码窗口。 |
| `AlembicPlugin`<br>已完成 | AIP-1 已完成并通过总控验收：删除旧 AI provider runtime / config surfaces / status permission surfaces，更新 tests、Skill、runtime artifact，回填执行记录。 |
| `AlembicTest`<br>观察中 | 当前不创建测试单；只有用户需要真实 Codex / BiliDili 验证时再启动。 |
| `BiliDili`<br>无任务 | 本主线不改真实 iOS 项目源码；只可能作为 AlembicTest 的验证对象。 |

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AIP-TODO-1 | 已完成 | 代码调研 | P0 | `AlembicWorkspace` | 扫描 `HostAiAdapter`、`AiModule`、`KnowledgeModule`、HTTP `/ai/*` routes、MCP `alembic_codex_ai_config`、tests 和 release boundary，确认删除 / fail-closed / 转交 Alembic 主体候选。 | 是 | AIP-0 已完成；结论是当前只派发 `AlembicPlugin`。 | `AlembicWorkspace` |
| AIP-TODO-2 | 已完成 | 删除实现 | P0 | `AlembicPlugin` | 删除可执行 provider runtime 外形、旧 AI 配置 surfaces 和 `_embedProvider` 注入，让 Plugin 不再暴露第三方 AI 配置或执行残留。 | 是 | AlembicPlugin `747b40f2abb2b9d8cb2714656fab164267d1d105`；runtime artifact `01fb042afe87264ad213dfc13444dc9dc48b77ca`；总控复核和 targeted unit 通过。 | `AlembicPlugin` |
| AIP-TODO-3 | 已完成 | 主体入口 | P1 | `Alembic` / `AlembicPlugin` | 如果旧 Plugin AI config 被用户或文档引用，需要改为 fail-closed 并指向 Alembic 主体配置入口；不在 Plugin 继续保存配置。 | 否 | 总控验收判断：Plugin 当前 fail-closed 文案和 Alembic 主体 owner 标识足够，Alembic 主体无需变更。 | 无 |
| AIP-TODO-4 | 无任务 | UI/API 同步 | P2 | `AlembicDashboard` | 本轮不改 Dashboard 源码；Plugin 已不直接引用 Dashboard，Dashboard 前端 source/build/serving 属于 Alembic/AlembicDashboard，旧 AI 配置删除在 Plugin 内部完成。 | 否 | 若未来 Alembic 主体 Dashboard 自身需要 UX 优化，再另开任务。 | 无 |
| AIP-TODO-5 | 暂停 | 真实项目验证 | P1 | `AlembicTest` | 在产品变更完成后验证 Codex prime/search 仍可用、receipt shout 仍由 Codex 发声、旧 ai_config 不再作为 Plugin 配置入口。 | 可选 | 当前不创建测试单；如用户要在真实 Codex / BiliDili 环境复测，再由总控创建 AlembicTest 测试单。 | `AlembicTest` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 无任务 | 否 | Alembic 主体配置入口保持现状；AIP-1 不需要主体文案或能力字段。 |
| `AlembicCore` | 无任务 | 否 | 暂无共享 contract 变更证据。 |
| `AlembicAgent` | 无任务 | 否 | 本主线不改 Agent runtime。 |
| `AlembicDashboard` | 无任务 | 否 | Plugin 不再直接引用 Dashboard；本轮不改 Dashboard 源码。 |
| `AlembicPlugin` | 已完成 | 否 | AIP-1 已通过总控验收。 |
| `AlembicTest` | 观察 | 否 | 当前不创建测试单；用户需要真实验证时再启动。 |
| `BiliDili` | 无任务 | 否 | 不改真实项目源码。 |

## 可复制分派提示词

发送给：无。

当前无可复制领取任务提示词；AIP-1 已完成并通过总控验收。

不发送给：`Alembic`（无任务）、`AlembicCore`（无任务）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）、`AlembicTest`（观察中）、`BiliDili`（无任务）。

## 验证策略

总控 AIP-0 文档更新需运行 workspace 文档校验：

- `node scripts/verify-workspace-docs.mjs --all-workspace`
- `node scripts/check-dispatch-coverage.mjs`
- `node scripts/check-todo-board.mjs --require`
- `git diff --check`

进入 AIP-1 后，`AlembicPlugin` 至少需要补充：

- `rg -n "alembic_codex_ai_config|inspectCodexAiConfig|HostAiAdapter|HostAiProvider|_aiProviderManager|_embedProvider|reloadAiProvider|AiConfigBody|AiWorkspaceConfigBody|readHostAiConfigInfo|listHostAiProviders|createHostManagedProvider|ALEMBIC_AI_PROVIDER|ALEMBIC_EMBED_PROVIDER" lib test plugins/alembic-codex/runtime` 负向扫描或逐项解释保留原因。
- 针对 MCP tool visibility、preflight nextActions、status/diagnostics、HTTP `/ai` fail-closed、DI provider 注入、resident search fallback 的 targeted unit tests。
- `npm run build:check`
- `npm run verify:codex-plugin`
- `npm run verify:codex-channel`
- `npm run verify:release-package-boundary`
- `npm run verify:codex-session`
- `npm run prepare:codex-plugin-runtime`
- `npm run report:agent-extraction-boundary`
- 与删除候选相关的 `rg` 负向扫描。

是否创建 AlembicTest 测试单，由 AIP-1 变更范围和用户是否需要真实 Codex / BiliDili 验证决定。

## 回填区

- 2026-05-22：总控创建本计划，归档 prime immediate receipt shout 与 resident vector search release 两条完成主线，启动 `GTODO-2026-05-21-010` 的 AIP-0 调研准备。当前发送给无，所有执行窗口保持观察或无任务。
- 2026-05-22：用户补充确认旧 AI 配置来自“整体做成 Codex 插件”的早期路线；由于 Codex 插件不能使用第三方 AI 扫描项目，产品已改成 Codex 插件 + Alembic 主体模式。因此 Plugin 侧 AI 配置 / 状态 / 权限 surfaces 默认进入删除范围，长期配置归 Alembic 主体。
- 2026-05-22：AIP-0 总控代码依赖调研完成。确认旧残留真实链路覆盖 `HostAiAdapter`、`AiModule`、`KnowledgeModule`、`VectorModule`、MCP `alembic_codex_ai_config`、Preflight、`AiConfigState`、status/diagnostics/daemon health/system health、HTTP `/ai` config routes、Plugin 内部 `DashboardOperations` 兼容 API、codex-session simulator/analyzer、unit tests 和 runtime dist。用户确认 Plugin 已不直接引用 Dashboard；代码证据显示 Plugin 只做 Dashboard URL handoff，因此本轮不派发 `AlembicDashboard`，当前只派发 `AlembicPlugin` 执行 AIP-1。
- 2026-05-22：`AlembicPlugin` AIP-1 已完成并推送。完成范围：删除 `HostAiAdapter` / `AiConfigState` / `AiModule`，移除 MCP `alembic_codex_ai_config`，取消 Preflight 对该 tool 的推荐，移除 status / diagnostics / daemon health / system health 中的 Plugin AI config 状态，HTTP `/ai` provider/config/env/workspace-config/chat/agent 旧入口统一 fail-closed，`SearchEngine` / `IndexingPipeline` / `VectorService` 不再注入 Plugin AI / embedding provider，Skill 与 runtime artifact 已同步。提交：AlembicPlugin `747b40f2abb2b9d8cb2714656fab164267d1d105`，AlembicCodex runtime `01fb042afe87264ad213dfc13444dc9dc48b77ca`。验证：targeted unit、`npm run build:check`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run verify:release-package-boundary`、`npm run verify:codex-session`、`npm run report:agent-extraction-boundary`、`git diff --check` 均通过。负向扫描 `lib test plugins/alembic-codex/skills README.md` 无命中；`plugins/alembic-codex/runtime` 仅剩 `vendor/AlembicCore/dist/shared/WorkspaceSettingsStore.{js,d.ts}` 中 Core-owned `ALEMBIC_AI_PROVIDER` / `ALEMBIC_EMBED_PROVIDER`，属于 portable runtime Core 快照保留项。执行记录：[../AlembicPlugin/alembic-plugin-external-ai-remnants-removal-2026-05-22.md](../../../../AlembicPlugin/alembic-plugin-external-ai-remnants-removal-2026-05-22.md)。
- 2026-05-22：总控验收 AIP-1 通过。复核证据：`AlembicPlugin` 与 AlembicCodex runtime 工作区均干净；`ToolPolicy` 不再暴露 `alembic_codex_ai_config`；`Preflight` 不再读取 Plugin AI config；`CodexMcpServer` 已移除 configure AI 分支；HTTP `/api/v1/ai` provider/config/env/workspace/chat/agent 旧入口统一 410 `PLUGIN_AI_CONFIG_REMOVED`；`ServiceContainer` 不再注册 `AiModule`；`KnowledgeModule` / `VectorModule` 显式传入 `aiProvider: null` / `embedProvider: null`；`EnhancementRoute` 只从 daemon health 读取 `capabilities.internalAi`；embedded plugin daemon health 标记 `pluginConfigRemoved=true`。总控重跑 `npm run test:unit -- --run test/unit/CodexToolPolicy.test.ts test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexEnhancementRoute.test.ts` 通过，4 files / 52 tests；负向扫描确认 Plugin-owned `lib` / `test` / skills / README 无旧 AI config 命中，runtime 仅剩 Core vendor 常量。AIP-2 Alembic 无任务，AIP-3 暂不创建 AlembicTest 测试单。
- 2026-05-22：总控按用户要求刷新本机 Codex plugin cache。命令 `npm run dev:codex-plugin:local-mcp -- --clean --all-installed` 成功，目标 cache 为 `~/.codex/plugins/cache/gxfn/alembic-codex/0.1.2`；`.alembic-dev-refresh.json` 记录 `mode=local-mcp`、`gitHead=747b40f2abb2b9d8cb2714656fab164267d1d105`、`localMcpEntry=/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/dist/bin/codex-mcp.js`。`runtime/package.json` 为 `alembic-ai@0.1.2`，`.codex-plugin/plugin.json` 为 `alembic-codex@0.1.2`。
