# AlembicAgent 完整抽取与 Plugin Agent 删除边界计划

日期：2026-05-17
状态：初始计划、阶段记录与真实代码复核后的总控计划；当前执行入口以第 19 节为准

## 1. 目标

这份文档规划从 `Alembic` 主仓库完整抽取 Agent / AI / Tool 能力到 `AlembicAgent`，再让 `AlembicPlugin` 删除重复 Agent 实现的渐进迁移。

本计划的主线只有一条：抽取 `Alembic` 的真实代码。`AlembicPlugin` 不是第二个实现来源，不做代码融合；它只作为删除对象、Codex adapter 保留对象和验收对象。

当前目标不是“把 Plugin 变空”，也不是“把 Agent 改薄”。目标是让四个仓库边界变清楚：

- `AlembicCore`：确定性内核、数据契约、知识、Guard、Search、Vector、Project Intelligence、host-agent workflow 协议。
- `AlembicAgent`：AgentRuntime、AI provider、tool system、策略、上下文、memory、prompt、执行循环和宿主工具编排。
- `AlembicPlugin`：Codex MCP、Skill、channel/marketplace、插件 runtime、安装验证和 Codex 宿主适配。
- `Alembic`：主产品壳、CLI、daemon、Dashboard、HTTP/API、native/IDE、平台能力和本地完整体验。

核心原则：先完整复制主仓库真实实现，再建立独立构建与测试；主仓库/宿主接入 `AlembicAgent`，Plugin 只删除内置 Agent 能力并改用宿主提供的 agent，不引入 `AlembicAgent`。

## 2. 硬性规则

1. 以 `Alembic` 主仓库 Agent 实现为抽取源，先完整复制，不重写、不变薄、不先做“理想化”重构。
2. `AlembicPlugin` 只负责删除重复 Agent 逻辑和保留 Codex adapter，不作为 `AlembicAgent` 的源实现参与合并。
3. `AlembicPlugin` 不接入 `AlembicAgent` 依赖、不 import `@alembic/agent`；Plugin 的 Agent 删除必须等宿主 agent contract 明确且可验证后再执行。
4. 删除 Plugin 文件前必须有 import 扫描、宿主 agent 替代入口、build/check/smoke 证据。
5. `AlembicAgent` 不能接管 Core 的 SQLite/Drizzle migration、repository、Guard、AST/grammar、search/vector 内核能力。
6. `AlembicAgent` 可以接管 AI provider、模型路由、prompt、token/budget、tool policy、tool execution、context/memory、AgentRuntime。
7. `AlembicPlugin` 必须保留 Codex MCP tool schema、Skill 文案、channel/marketplace、插件 release/smoke/cache sync，不把这些迁到 Agent。
8. `Alembic` 必须保留主产品壳：CLI、daemon、HTTP/API、Dashboard、native/IDE、平台运行体验；Agent 只提供可复用执行能力。
9. 任何阶段都不能用空壳 facade 替代真实实现；如果要做 adapter，必须有真实调用链和测试。
10. 长期文档写到 `docs/AlembicAgent/`，不要写入个人机器绝对路径、API key、token 或本机私密路径。

## 3. 当前真实扫描基线

### 3.1 AlembicAgent 初始状态

`AlembicAgent` 目前只有 `AGENTS.md`，没有 `package.json`、源码、测试或构建脚本。

这意味着第一阶段不是删除 Plugin，而是先把 `AlembicAgent` 建成可独立构建的真实仓库。

说明：本小节保留为 2026-05-17 初始扫描基线。当前 `AlembicAgent` 已完成 Phase 5，实际总控状态见第 17-19 节。

### 3.2 Alembic 主仓库 Agent 相关实现

当前主仓库存在完整 Agent 能力：

| 区域 | 文件数 | 初步判断 |
| --- | ---: | --- |
| `lib/agent` | 98 | AgentRuntime、profiles、runs、memory、context、policies、strategies、prompts、forge、capabilities。应作为抽取主源。 |
| `lib/tools` | 79 | Tool contracts、catalog、v2 router、terminal adapters、workflow adapters、compressor。大部分属于 Agent/tool system，Mac 专属能力需要单独判断。 |
| `lib/external/ai` | 26 | AI provider、transport、model registry、LLM gateway。应迁入 AlembicAgent。 |
| `lib/service/skills` | 10 | Skill recommendation / hooks / recall / metrics。和 Agent/tool 推荐链路相关，需要逐文件判断。 |
| `lib/external/mcp` | 33 | MCP 交付与工具 handler。主仓库仍需要 MCP/CLI 入口；不整体迁入 Agent。 |
| `lib/types/agent.d.ts` | 1 | Agent 类型声明，随 Agent 迁移。 |

`lib/agent` 对 Core 的引用约 44 次，主要集中在：

- `@alembic/core/logging`
- `@alembic/core/events`
- `@alembic/core/infrastructure/io`
- `@alembic/core/shared/token-utils`
- `@alembic/core/shared/concurrency`
- `@alembic/core/shared/similarity`
- `@alembic/core/infrastructure/database/drizzle/schema`
- `@alembic/core/shared/PathGuard`

这些 import 是第一批 Agent/Core 边界检查对象。原则上 Agent 应优先使用 Core stable facade，确实缺口再反馈 Core。

### 3.3 AlembicPlugin 中的重复 Agent 实现

`AlembicPlugin` 也存在一套 Agent 能力：

| 区域 | 文件数 | 初步判断 |
| --- | ---: | --- |
| `lib/agent` | 96 | 大部分与主仓库重复，但已经发生分叉。后续应删除，改用宿主提供的 agent，不引入 `AlembicAgent`。 |
| `lib/tools` | 77 | 大部分与主仓库重复，但有 Codex/Plugin 差异。需拆成 Agent tool core 与 Codex adapter。 |
| `lib/external/ai` | 26 | 与主仓库 AI provider 目录当前完全一致。迁入 AlembicAgent 且宿主 agent contract 明确后，Plugin 可删除重复实现。 |
| `lib/service/skills` | 2 | Plugin 保留少量 Skill hook/type glue；需和 Codex Skill 交付边界一起判断。 |
| `lib/codex` | 11 | Plugin 专属 Codex runtime/status/policy/cache/session。必须保留在 Plugin。 |
| `lib/external/mcp` | 36 | Plugin 专属 MCP/Codex handler 与 tool schema。必须保留 adapter 层，但可删除重复 Agent runtime。 |

`lib/agent` 与主仓库不是完全一致。当前差异包括：

- Plugin 缺少 `remote.profile.ts` 和 `signal.profile.ts`。
- 二十多个 Agent 文件已分叉，例如 `AgentService.ts`、`AgentRouter.ts`、`AgentRunContracts.ts`、`AgentRuntimeTypes.ts`、`AgentEventBus.ts`、`MemoryConsolidator.ts`、`Conversation.ts`、`KnowledgeProduction.ts`、`ScanProduction.ts` 等。
- AI provider 目录当前一致，说明这部分适合优先完整迁到 `AlembicAgent`。
- `lib/tools` 两边也有差异，主仓库额外有 `MacSystemAdapter.ts`、`MacSystemCapabilities.ts`，Plugin 侧有 Codex 相关调用差异。

结论：不能简单把 Plugin 的 `lib/agent` 直接删除。必须先让 `AlembicAgent` 完整承载 `Alembic` 主仓库版本，并让宿主提供清晰的 agent contract，再把 Plugin 差异按 Codex adapter 需求处理。Plugin 分叉文件不并入 Agent 主实现；如果确实是 Codex 必需逻辑，应留在 Plugin adapter 或转换成调用宿主 agent contract 的适配。

## 4. 边界模型

### 4.1 进入 AlembicAgent 的能力

这些能力应成为 `AlembicAgent` 的长期职责：

- AgentRuntime、AgentState、MessageAdapter、SystemRunContext、ToolExecutionPipeline。
- Agent profiles、stage factory、profile compiler、run coordinator。
- Agent runs：scan、evolution、translation、relation 等非确定性执行链路。
- Agent policies：budget、quality gate、safety、policy engine。
- Agent context：ContextWindow、ConversationStore、ExplorationTracker、PlanTracker、SignalDetector、NudgeGenerator。
- Agent memory：PersistentMemory、SessionStore、MemoryStore、MemoryRetriever、MemoryEmbeddingStore、MemoryCoordinator、consolidator。
- Agent prompts：insight analyst / producer / gate / evolver、scan prompts。
- Agent forge：ToolForge、SandboxRunner、DynamicComposer、TemporaryToolRegistry。
- AI provider：provider manager、transport、model registry、parameter guard、LLM gateway。
- Tool system 的通用部分：tool contracts、registry、router、result envelope/presenter、capability catalog、output compressor、terminal execution abstraction。
- Agent-facing skill recommendation / recall / hooks，前提是不包含 Codex Skill 交付文案。

### 4.2 留在 AlembicPlugin 的能力

这些能力不应迁入 `AlembicAgent`：

- `bin/codex-mcp.ts`
- `lib/codex/**`
- Codex MCP server / stdio / handler envelope / zod schema projection。
- Codex Skill 文案、`skills/**`、`injectable-skills/**`、`plugins/**`、`channels/**`。
- plugin runtime packaging、cache sync、marketplace/channel release、smoke/verify 脚本。
- Codex 会话验证 fixture、Codex-specific harness 和 transcript。

Plugin 不能依赖或内置 `AlembicAgent`。Plugin 只保留 Codex 交付链路和宿主 agent adapter，实际 Agent 能力由宿主提供。

### 4.3 留在 Alembic 主仓库的能力

这些能力不应因为 Agent 抽取而消失：

- CLI、daemon、HTTP/API、Dashboard server。
- Dashboard 前端。
- native/macOS、IDE、Lark/Feishu、本地安装与发布体验。
- 主产品对 Agent 的 adapter / wiring。
- 主仓库特有 Mac system tool 能力，除非抽象成 Agent host adapter 后有明确调用方和测试。

### 4.4 留在 AlembicCore 的能力

这些能力不应复制进 `AlembicAgent`：

- SQLite/Drizzle migration、repository factory、Core data schema。
- Guard/Search/Vector/Project Intelligence 的确定性内核。
- AST/grammar 资源查找和 readiness。
- Knowledge/Recipe 领域模型与稳定服务。
- Host-agent workflow 的 deterministic contract、session、briefing、checkpoint、report persistence。

## 5. 分阶段迁移计划

### Phase 0：Alembic 源代码清单与 Plugin 删除清单

目标：建立迁移前的完整清单，避免 Alembic 漏迁和 Plugin 误删。

任务：

- 扫描 `Alembic/lib/agent`、`Alembic/lib/tools`、`Alembic/lib/external/ai`、`Alembic/lib/service/skills`，作为唯一抽取源。
- 对比 `AlembicPlugin` 同名目录，只记录删除风险和 Codex adapter 保留点，不把 Plugin 分叉实现合并进 Agent。
- 生成 Alembic Agent import 图，标注 Core stable / transitional / main-only 依赖。
- 生成 Plugin 删除清单，标注哪些文件可删、哪些 import 需要删除或改到宿主 agent adapter、哪些 Codex adapter 必须保留。

验收：

- 有完整文件清单。
- 有差异清单。
- 有“从 Alembic 迁入 / 留在 Alembic / Plugin 删除 / Plugin 保留 adapter / 反馈 Core”五类表。

### Phase 1：初始化 AlembicAgent 仓库

目标：让 `AlembicAgent` 成为可构建 TypeScript 包。

任务：

- 新建 `package.json`、`tsconfig.json`、Biome 配置、`.gitignore`。
- 接入 `@alembic/core`，优先采用与其他外层仓库一致的子仓库或 file dependency 模式。
- 建立 `build`、`build:check`、`lint`、`test`、`check` 脚本。
- 新建最小 public entrypoint，但不写薄实现。
- 建立 Agent import boundary lint：禁止直接引用 Plugin/MCP/Channel/Codex delivery。

验收：

- `npm run build:check` 通过。
- `npm run lint` 通过。
- `npm run check` 通过。
- 仓库没有空壳业务能力。

### Phase 2：完整复制主仓库 Agent 实现

目标：把主仓库 `lib/agent` 完整迁入 `AlembicAgent`。

策略：

- 第一轮优先保留原目录结构和 import 语义，降低迁移风险。
- 只有为了独立构建必须改的 import 才调整。
- 不做行为优化，不合并类，不删 profile，不改 prompt。

候选迁移范围：

- `Alembic/lib/agent/**`
- `Alembic/lib/types/agent.d.ts`

需要同步处理：

- `#agent/*` alias。
- `#tools/*`、`#external/*`、`#service/*` 等跨目录依赖。
- Core import 必须尽量改为 stable facade。

验收：

- Agent 源码在 `AlembicAgent` 内能 typecheck。
- Agent barrel export 可被 smoke import。
- 与主仓库 `lib/agent` 的文件数量和关键 profile/run/runtime 类型一致。

### Phase 3：迁移 AI Provider 与模型路由

目标：把重复的 AI provider 能力收敛到 `AlembicAgent`。

候选迁移范围：

- `lib/external/ai/**`

当前证据：

- `Alembic/lib/external/ai` 与 `AlembicPlugin/lib/external/ai` 目录当前完全一致。

边界：

- AI provider、transport、model registry、parameter guard、LLM gateway 属于 Agent。
- API key 的具体来源、Codex 环境读取、CLI 配置交互属于宿主 adapter。
- Core 只保留 provider injection contract，不实现 provider。

验收：

- Mock provider 测试通过。
- 至少覆盖 provider 成功、失败、超时/取消、参数校验、错误分类。
- Plugin 不再保留重复 provider 实现，也不从 `AlembicAgent` 引入；Plugin 通过宿主 agent/config contract 使用 provider 能力。

### Phase 4：迁移通用 Tool System

目标：把通用 tool contracts、router、catalog、execution pipeline 抽到 `AlembicAgent`，同时保留宿主专属 adapter。

候选迁移范围：

- `lib/tools/core/**`
- `lib/tools/catalog/**`
- `lib/tools/v2/**`
- `lib/tools/workflow/**`
- `lib/tools/adapters/terminal-*` 中的通用 terminal execution abstraction

需要谨慎判断：

- `MacSystemAdapter.ts`、`MacSystemCapabilities.ts` 可能属于 Alembic 主仓库平台能力，不能直接迁走。
- Codex-facing tool schema 和 MCP handler 留在 Plugin。
- DashboardOperationAdapter 可能是主仓库 / Dashboard bridge，不应默认进入 Agent。

验收：

- Tool registry / router / result envelope 有单元测试。
- Tool permission、timeout、cancel、partial result、error normalization 有覆盖。
- Plugin 可以通过 adapter 把 Codex MCP tool call 转发到宿主 agent tool runtime。

### Phase 5：迁移 Agent Memory / Context 持久化

目标：让 Agent 的 context、memory、session store、embedding memory 在 `AlembicAgent` 中闭环。

候选范围：

- `lib/agent/context/**`
- `lib/agent/memory/**`

边界：

- Agent memory 和执行上下文属于 Agent。
- Core repository / SQLite schema 若已经提供稳定能力，应通过 `@alembic/core/database`、`@alembic/core/repositories`、`@alembic/core/vector` 接入。
- 不要在 Agent 内复制 Core migration。

验收：

- MemoryStore / SessionStore 的 schema、读写、恢复、损坏数据处理有测试。
- Embedding store 可使用 mock provider，不依赖真实 API key。
- Plugin 删除重复 memory 代码后仍能通过 Codex scenario smoke。

### Phase 6：AlembicPlugin 删除内置 Agent 并接入宿主 Agent

目标：Plugin 保留 Codex 交付层，删除重复 Agent runtime，并改用宿主提供的 agent。

任务：

- Plugin 不增加 `AlembicAgent` 依赖，不 import `@alembic/agent` 或 `@alembic/agent/ai`。
- Codex MCP handler 只负责 schema/envelope/session/policy，把 agent run/tool execution 委托给宿主 agent contract。
- 先用 adapter 保持现有 MCP tool 返回结构不变。
- 逐批删除 Plugin 中 `#agent/*`、AI provider、tool core 本地实现引用；必要调用改到宿主 agent adapter。
- Plugin 分叉实现不迁回 Agent；如果发现 Codex 必需差异，就在 Plugin adapter 中保留，或通过明确 adapter contract 调用宿主 agent。

验收：

- `npm run build:check`
- `npm run lint -- --diagnostic-level=error`
- `npm run lint:core-import-boundary`
- `npm run smoke:codex-plugin`
- `npm run verify:codex-plugin`
- 关键 Codex scenario 不回退。

### Phase 7：删除 AlembicPlugin 重复 Agent 实现

目标：删除 Plugin 内已经由宿主 agent 替代的重复实现。

删除候选：

- `AlembicPlugin/lib/agent/**`
- `AlembicPlugin/lib/external/ai/**`
- `AlembicPlugin/lib/tools/core/**`
- `AlembicPlugin/lib/tools/catalog/**`
- `AlembicPlugin/lib/tools/v2/**` 中已由 Agent 接管的部分

不能删除：

- `AlembicPlugin/lib/codex/**`
- `AlembicPlugin/lib/external/mcp/**`
- `plugins/**`
- `channels/**`
- `skills/**`
- `injectable-skills/**`
- Codex release / verify / sync scripts

验收：

- 删除后没有 `#agent/*` 本地实现残留引用。
- Plugin 的 MCP/Codex tool schema 与用户可见行为保持兼容。
- Plugin smoke 和 Codex session 验证通过。

### Phase 8：Alembic 主仓库接入 AlembicAgent

目标：主仓库逐步从本地 Agent 实现切到 `AlembicAgent`。

说明：

- 这个阶段排在 Plugin 删除之后，避免两个外层同时大规模切换。
- 主仓库保留 CLI/daemon/Dashboard/native/IDE/product shell。
- 主仓库可以保留 thin host adapter，但不能保留第二套 AgentRuntime。

验收：

- `npm run build:check`
- `npm run lint -- --diagnostic-level=error`
- CLI/daemon/Dashboard 相关 smoke 通过。
- 主仓库 Agent 重复目录删除前有完整替代扫描。

## 6. 当前已知风险

| 风险 | 说明 | 处理方式 |
| --- | --- | --- |
| Plugin Agent 已分叉 | Plugin 与主仓库 `lib/agent` 有二十多个文件不同。 | Phase 0 必须列出差异，不允许直接删 Plugin。 |
| Tool system 边界复杂 | Tool core、terminal、Mac system、Codex MCP、Dashboard operation 混在一起。 | Phase 4 按 adapter 类型拆分，不按目录粗暴迁移。 |
| Core transitional import 仍存在 | Agent 中仍有 `shared/token-utils`、`shared/concurrency`、Drizzle schema 等 deep import。 | 先记录，能用 stable facade 的替换，不能替换的反馈 Core Phase 10。 |
| AI provider 与宿主配置耦合 | Provider 属于 Agent，但 API key/config 来源属于宿主。 | Agent 提供 provider interface 和 manager，宿主提供 config adapter。 |
| 删除时机容易过早 | Plugin 想删除 `lib/agent`，但 Codex handler 可能仍依赖本地类型。 | 必须先明确宿主 agent contract 和 Plugin adapter，再跑 smoke/verify。 |

## 7. 分配给 AlembicAgent 窗口的任务

近期任务：

1. 完成 Phase 0 Alembic 源文件清单和 Plugin 删除风险清单。
2. 初始化 TypeScript 包和基础脚本。
3. 完整复制 `Alembic/lib/agent/**`，保持行为不变。
4. 建立 Agent import boundary lint。
5. 将无法稳定接入 Core 的 deep import 反馈到 Core 文档。

每阶段完成后必须记录：

- 从 Alembic 迁入的文件列表。
- import 调整列表。
- 和 Alembic 主仓库源文件的差异。
- build/check/lint/test 结果。
- 下一阶段需要 Alembic 或 AlembicPlugin 窗口配合的任务。

## 8. 分配给 Alembic 窗口的任务

近期任务：

1. 暂不删除主仓库 `lib/agent`。
2. 提供主仓库 Agent 源文件差异解释，尤其 `remote.profile.ts`、`signal.profile.ts`、Mac/system tool 相关能力。
3. 配合确认哪些 `lib/tools` 文件属于通用 Agent tool system，哪些属于主仓库平台能力。
4. 后续等待 `AlembicAgent` 构建通过后，再接入 `AlembicAgent`。

禁止事项：

- 不因为 Agent 仓库存在就删除 CLI/daemon/Dashboard/native/IDE/product shell。
- 不在没有替代入口和测试的情况下删除本地 Agent 实现。

## 9. 分配给 AlembicPlugin 窗口的任务

近期任务：

1. 暂不删除 `lib/agent`。
2. 先列出 Plugin 中哪些 `#agent/*`、AI provider、tool core 引用需要删除或改为宿主 agent adapter。
3. 只把 Plugin 分叉文件用于删除风险分析，不把它们作为 Agent 源实现参与合并。
4. 保留 `lib/codex`、`lib/external/mcp`、skills、plugins、channels 和 Codex release/smoke 体系。
5. 等宿主 agent contract 明确后，不新增 `AlembicAgent` 依赖，直接逐批删除本地 Agent/AI/tool runtime 引用。
6. 宿主 adapter 替代路径验证通过后，再删除 Plugin 重复 Agent 实现。

禁止事项：

- 不把 Codex MCP/Skill/channel 删除掉。
- 不把 Plugin 的 Codex delivery 迁到 Agent 或 Core。
- 不在 Plugin 内维护第三套 AgentRuntime，也不通过依赖 `AlembicAgent` 把 Agent runtime 打包进 Plugin。
- 不把 Plugin 分叉 Agent 文件迁回 `AlembicAgent` 主实现；Plugin 只写必要 Codex adapter。

## 10. 分配给 Core 窗口的任务

Core 暂时不新增 facade。等待 Agent 抽取时的真实缺口反馈。

优先关注：

- `shared/token-utils`
- `shared/concurrency`
- `shared/similarity`
- `shared/PathGuard`
- `infrastructure/database/drizzle/schema`
- Agent memory 是否需要更稳定的 Core repository/vector contract

判断规则：

- 如果能力是确定性基础工具，并且多个外层都需要，可以考虑 Core stable facade。
- 如果能力属于 AgentRuntime、token budget、AI 上下文策略、provider 执行，不进 Core。
- 如果只是为了迁移方便，不允许新增薄 facade。

## 11. 历史下一步入口

Phase 0 已执行完成，见第 12 节和详细清单文档。下一步进入 Phase 1，不复制业务实现、不删除外层仓库代码。

说明：本节记录早期阶段入口，后续 Phase 1-5 已完成。当前跨仓库下一步执行以第 19 节的真实代码复核后计划为准。

Phase 0 的产物应包括：

- `Alembic` Agent 源文件清单。
- `AlembicPlugin` Agent 删除风险和 adapter 保留清单。
- `AlembicAgent` 目标模块清单。
- Plugin 删除候选清单。
- Core 缺口反馈清单。

Phase 1 已执行完成，见第 13 节和详细记录。完整复制主仓库 Agent 实现从 Phase 2 开始。

## 12. Phase 0 完成记录（2026-05-17）

状态：已完成只读扫描，未修改 `Alembic`、`AlembicPlugin`、`AlembicCore`，未删除任何代码。

详细产物见：

- `docs/AlembicAgent/alembic-agent-phase-0-inventory-2026-05-17.md`

本轮确认的关键事实：

- `Alembic/lib/agent` 为唯一抽取源，共 98 个文件。
- `AlembicPlugin/lib/agent` 共 96 个文件，其中 77 个与主仓库一致、19 个同名分叉、0 个 Plugin 专有、2 个主仓库专有 profile 未出现在 Plugin。
- `Alembic/lib/external/ai` 与 `AlembicPlugin/lib/external/ai` 均为 26 个文件且内容一致，适合作为 Phase 3 优先收敛对象。
- `Alembic/lib/tools` 与 Plugin 同名目录存在 17 个分叉文件，且主仓库额外包含 `MacSystemAdapter.ts`、`MacSystemCapabilities.ts`；Phase 4 必须按 tool core 与宿主 adapter 拆分，不能整目录迁移。

交给 `Alembic` 窗口的接入任务：

1. 暂不删除主仓库 `lib/agent/**`、`lib/external/ai/**`、`lib/tools/**` 或 `lib/service/skills/**`。
2. 等 `AlembicAgent` Phase 2-4 提供 public entrypoint 后，再把 product shell 中的 `#agent/*`、`#external/ai/*` 和通用 `#tools/*` 引用切到 `AlembicAgent`。
3. 保留 CLI、daemon、HTTP/API、Dashboard/native/IDE、Lark/Feishu runtime 和主产品 wiring。
4. 将 `MacSystemAdapter.ts`、`MacSystemCapabilities.ts` 先视为主仓库 platform adapter，除非后续有明确 host adapter contract 和测试，不迁入 Agent。
5. 删除主仓库重复 Agent 实现前，必须提供 import 扫描、替代入口、build/check/lint 和 CLI/daemon/Dashboard smoke 证据。

交给 `AlembicPlugin` 窗口的宿主适配与删除逻辑：

1. 暂不删除 `AlembicPlugin/lib/agent/**`。
2. Phase 2 后不接入 `AlembicAgent` 依赖；逐批删除 `#agent/*` 本地实现引用，必要调用改到宿主 agent adapter；Codex MCP handler 只保留 schema、envelope、session、policy 和 Codex adapter。
3. Phase 3 后删除 `lib/external/ai/**` 重复实现，不从 `AlembicAgent` import provider、transport 和 model registry；AI 能力经宿主 agent/config contract 获得。
4. Phase 4 后逐批删除 `lib/tools/core/**`、`lib/tools/catalog/**`、`lib/tools/v2/**`、`lib/tools/workflow/**` 和通用 terminal abstraction；保留 Codex-facing MCP schema projection、handler envelope、Skill/channel/plugin release/smoke 体系。
5. 对 19 个分叉 Agent 文件默认按删除处理；如果发现 Codex 必需差异，必须留在 Plugin adapter 或通过明确 adapter contract 调用宿主 agent，不能迁回 `AlembicAgent` 主实现。
6. 每批删除前运行 import 扫描；删除后至少运行 `npm run build:check`、`npm run lint -- --diagnostic-level=error`、`npm run lint:core-import-boundary`、`npm run smoke:codex-plugin`、`npm run verify:codex-plugin`。

下一轮进入 Phase 1：初始化 `AlembicAgent` 可构建 TypeScript 包，建立 `package.json`、`tsconfig.json`、Biome、基础脚本、最小 public entrypoint 和 Agent import boundary lint；不复制业务实现。

## 13. Phase 1 完成记录（2026-05-17）

状态：已完成 `AlembicAgent` TypeScript 包初始化，未修改 `Alembic`、`AlembicPlugin`、`AlembicCore`，未复制或删除业务实现。

详细产物见：

- `docs/AlembicAgent/alembic-agent-phase-1-bootstrap-2026-05-17.md`

本轮新增：

- `AlembicAgent/package.json`
- `AlembicAgent/package-lock.json`
- `AlembicAgent/tsconfig.json`
- `AlembicAgent/biome.json`
- `AlembicAgent/.gitignore`
- `AlembicAgent/vitest.config.ts`
- `AlembicAgent/src/index.ts`
- `AlembicAgent/test/index.test.ts`
- `AlembicAgent/scripts/lint-agent-import-boundary.mjs`

本轮确认：

- `@alembic/agent` 已声明为 ESM / NodeNext 包。
- `@alembic/core` 已通过 `file:../AlembicCore` 接入。
- public entrypoint 当前只导出 Phase 1 package metadata，不提供未迁移业务 facade。
- Agent import boundary lint 已禁止直接引用 Plugin、Codex、MCP、channel、marketplace、Skill delivery 目录。

验证结果：

- `npm install` 通过。
- `npm run build:check` 通过。
- `npm run lint` 通过。
- `npm run lint:agent-import-boundary` 通过。
- `npm run test` 通过。
- `npm run check` 通过。
- `npm run build` 通过。

交给 `Alembic` 窗口的任务：

1. 继续保留主仓库 `lib/agent/**`、`lib/external/ai/**`、`lib/tools/**` 和 `lib/service/skills/**`。
2. 暂不接入 `@alembic/agent` runtime；当前 Agent package 只有 Phase 1 metadata。
3. 等 Phase 2 完整复制 `lib/agent/**` 后，再开始评估 product shell 中 `#agent/*` 的接入点。

交给 `AlembicPlugin` 窗口的任务：

1. 继续保留 `AlembicPlugin/lib/agent/**` 和重复 AI/tool 实现，暂不删除。
2. 暂不把 Codex MCP handler 切到 `@alembic/agent` runtime；Plugin 后续也不引入 `AlembicAgent`，只等待宿主 agent contract。
3. 继续保留 `lib/codex/**`、`lib/external/mcp/**`、`skills/**`、`injectable-skills/**`、`plugins/**`、`channels/**` 和 release/smoke/verify 脚本。

Phase 2 已执行完成，见第 14 节和详细记录。Phase 3 已执行完成，见第 15 节和详细记录。Phase 4 已执行完成，见第 16 节和详细记录。Phase 5 已执行完成，见第 17 节和详细记录。下一阶段进入 Plugin/host contract 交接段。

## 14. Phase 2 完成记录（2026-05-17）

状态：已完成主仓库 Agent 源码迁入，未修改 `Alembic`、`AlembicPlugin`、`AlembicCore`，未删除外层仓库代码。

详细产物见：

- `docs/AlembicAgent/alembic-agent-phase-2-agent-source-2026-05-17.md`

本轮确认：

- `Alembic/lib/agent/**` 98 个文件已迁入 `AlembicAgent/src/agent/**`。
- `Alembic/lib/types/agent.d.ts` 已迁入 `AlembicAgent/src/types/agent.d.ts`。
- 根据用户确认，独立仓库正式源码统一放在 `src/`，不放在 `lib/`。
- `src/index.ts` 已导出 Agent barrel，构建后 smoke import 能加载 `AgentRuntime`。
- 为满足 Agent 源码独立 typecheck，本轮同时复制了 Agent 直接引用的真实 `src/external/ai/**`、部分 `src/tools/**` 和 `src/shared/package-assets.ts`；这些不是空壳，后续 Phase 3/4 会正式收敛并补测试。

本轮唯一 `src/agent/**` 源码差异：

- `src/agent/runtime/AgentRuntime.ts` 的 `logger` 字段增加显式 `Pick<Console, 'info' | 'warn'>` 类型，避免声明文件暴露 `@alembic/core/node_modules/winston` 内部路径；无运行行为变化。

验证结果：

- `npm install` 通过。
- `npm run build:check` 通过。
- `npm run lint` 通过；保留主仓库原始 Agent 源码的 27 个 warning，未做行为无关清理。
- `npm run lint:agent-import-boundary` 通过。
- `npm run test` 通过。
- `npm run check` 通过。
- `npm run build` 通过。
- barrel smoke import 通过，结果为 `{"hasAgentRuntime":true,"phase":"phase-2-agent-source"}`。

交给 `Alembic` 窗口的任务：

1. 继续保留 `Alembic/lib/agent/**`，不要删除本地 AgentRuntime。
2. 扫描主仓库 product shell 中 `#agent/*` 调用点，标注后续可切到 `@alembic/agent` 的位置。
3. 暂不迁移 CLI、daemon、HTTP/API、Dashboard/native/IDE、Lark/Feishu runtime。
4. 等 Phase 3 和 Phase 4 完成 AI provider 与通用 tool system 正式收敛后，再实施主仓库 runtime 接入。

交给 `AlembicPlugin` 窗口的任务：

1. 不规划 `@alembic/agent` dependency 接入；等待宿主 agent contract 后删除内置 Agent。
2. 扫描 Plugin 中 20 个 `#agent/*` 调用文件，标注哪些应删除、哪些需要改到宿主 agent adapter。
3. 暂不删除 `AlembicPlugin/lib/external/ai/**`，等待 Phase 3 正式迁移和 provider 测试。
4. 暂不删除 tool core/catalog/v2/workflow，等待 Phase 4 正式迁移和 tool 测试。
5. 继续保留 `lib/codex/**`、`lib/external/mcp/**`、skills、injectable-skills、plugins、channels 和 release/smoke/verify 脚本。

## 15. Phase 3 完成记录（2026-05-17）

状态：已完成 AI Provider 与模型路由正式迁移，未修改 `Alembic`、`AlembicPlugin`、`AlembicCore`，未删除外层仓库代码。

详细产物见：

- `docs/AlembicAgent/alembic-agent-phase-3-ai-provider-2026-05-17.md`

本轮确认：

- `src/external/ai/**` 正式成为 AlembicAgent 的 AI provider/model routing 实现。
- 新增 `src/external/ai/index.ts` 作为 public barrel。
- `package.json` 新增 `./ai` export，主仓库/宿主代码应优先从 `@alembic/agent/ai` 接入；`AlembicPlugin` 不接入该 package。
- `src/index.ts` 根入口同步导出 AI 能力，metadata 升级为 `phase-3-ai-provider`。
- 与主仓库 `Alembic/lib/external/ai/**` 的唯一区别是 AlembicAgent 自己新增的 `src/external/ai/index.ts`。

新增测试覆盖：

- Mock provider 成功路径。
- Provider 失败、超时和取消。
- 参数校验与错误分类。
- Model registry 动态模型路由。
- Provider config 与 provider manager token tracking/switch event。

验证结果：

- `npm run build:check` 通过。
- `npm run lint` 通过；保留迁入源码的 27 个 warning，未做行为无关清理。
- `npm run lint:agent-import-boundary` 通过。
- `npm run test` 通过，2 个 test file / 8 个 test 全部通过。
- `npm run check` 通过。
- `npm run build` 通过。
- root smoke import 通过：`{"hasAgentRuntime":true,"hasMockProvider":true,"hasModelRegistry":true,"phase":"phase-3-ai-provider"}`。
- AI entry smoke import 通过：`{"hasMockProvider":true,"hasParameterGuard":true,"providerConfigs":5}`。

交给 `Alembic` 窗口的任务：

1. 扫描主仓库所有 `#external/ai/*`、`lib/external/ai` 和相对 AI provider 引用。
2. 将 provider、transport、model registry、parameter guard、LLM gateway 消费点切到 `@alembic/agent/ai`。
3. 保留 API key 来源、Dashboard AI Settings、CLI/daemon 配置读取和环境变量解析作为主仓库宿主 adapter。
4. 完成替换并验证后，`Alembic/lib/external/ai/**` 可作为删除候选。
5. 删除前必须提供 import 扫描、替代入口、build/check/lint 和 CLI/daemon/Dashboard AI settings smoke 证据。

交给 `AlembicPlugin` 窗口的宿主适配与删除任务：

1. 不接入 `@alembic/agent` dependency，不使用 `file:../AlembicAgent`。
2. 扫描 Plugin 中所有 `#external/ai/*`、`lib/external/ai` 和相对 AI provider 引用。
3. 删除 provider、transport、model registry、parameter guard、LLM gateway 的内置 import；必要调用改到宿主 agent/config adapter。
4. 保留 `lib/external/mcp/**`、Codex MCP schema/envelope/session/policy、skills、injectable-skills、plugins、channels 和 release/smoke/verify 脚本。
5. 宿主 adapter 替代路径验证完成后，`AlembicPlugin/lib/external/ai/**` 可删除。
6. 删除前必须运行 import 扫描；删除后至少运行 `npm run build:check`、`npm run lint -- --diagnostic-level=error`、`npm run lint:core-import-boundary`、`npm run smoke:codex-plugin`、`npm run verify:codex-plugin`。
7. 如果发现 Plugin 专属 AI config/env 读取逻辑，保留在 Plugin adapter 中；provider 执行能力由宿主 agent 提供，不由 Plugin 直接依赖 `@alembic/agent/ai`。

Phase 4 已执行完成，见第 16 节和详细记录。下一轮进入 Phase 5：迁移 Agent Memory / Context 持久化。

## 16. Phase 4 完成记录（2026-05-17）

状态：已完成通用 Tool System 正式迁移，未修改 `Alembic`、`AlembicPlugin`、`AlembicCore`，未删除外层仓库代码。

详细产物见：

- `docs/AlembicAgent/alembic-agent-phase-4-tool-system-2026-05-17.md`

本轮确认：

- `src/tools/**` 中的通用 contracts、catalog、router、registry、result envelope、presenter、workflow registry 正式成为 AlembicAgent 的 Tool System 实现。
- 新增 `src/tools/index.ts` 作为 public barrel。
- `package.json` 新增 `./tools` export，主仓库/宿主代码应优先从 `@alembic/agent/tools` 接入；`AlembicPlugin` 不接入该 package。
- `src/index.ts` 根入口同步导出 Tool System 能力，metadata 升级为 `phase-4-tool-system`。
- `LightweightRouter` 补齐 manifest surface gate、runtime policy gate、adapter preview、timeout/cancel、异常规范化和 diagnostics recorder。
- Alembic 主仓库的平台 adapter、Dashboard operation、Mac/native system tool 能力仍属于宿主仓库。
- AlembicPlugin 的 Codex MCP schema、handler envelope、session/policy、skills/plugins/channels/release/smoke 仍属于 Plugin；Plugin 后续只通过宿主 agent contract 转发 tool call，不引入 `AlembicAgent`。

新增测试覆盖：

- `UnifiedToolCatalog` schema projection 和 internal handler access。
- `LightweightRouter` adapter execution、structuredContent、artifacts、warnings、nextActionHint 保留。
- runtime policy deny、unsupported surface、timeout、pre-abort、adapter exception normalization。

验证结果：

- `npm run build:check` 通过。
- `npm run lint` 通过；保留迁入源码的 27 个 warning，未做行为无关清理。
- `npm run lint:agent-import-boundary` 通过。
- `npm run test` 通过，3 个 test file / 15 个 test 全部通过。
- `npm run check` 通过。
- `npm run build` 通过。
- root smoke import 通过：`{"hasAgentRuntime":true,"hasMockProvider":true,"hasLightweightRouter":true,"hasUnifiedToolCatalog":true,"phase":"phase-4-tool-system"}`。
- tools entry smoke import 通过：`{"hasLightweightRouter":true,"hasCapabilityCatalog":true,"hasUnifiedToolCatalog":true,"hasPresenter":true}`。

交给 `Alembic` 窗口的任务：

1. 扫描主仓库所有 `#tools/*`、`lib/tools/core`、`lib/tools/catalog`、`lib/tools/v2`、`lib/tools/workflow` 和相对 tool 引用。
2. 将通用 tool contracts、capability catalog、unified catalog、lightweight router、result envelope/presenter、workflow registry 消费点切到 `@alembic/agent/tools`。
3. 保留 CLI、daemon、HTTP/API、Dashboard、native/macOS、IDE 和主产品 wiring 作为宿主 adapter。
4. 暂不迁移或删除 `MacSystemAdapter.ts`、`MacSystemCapabilities.ts`、Dashboard operation adapter 和平台工具执行入口，除非后续有明确 host adapter contract 和测试。
5. 完成替换并验证后，`Alembic/lib/tools/core/**`、`Alembic/lib/tools/catalog/**`、`Alembic/lib/tools/v2/**`、`Alembic/lib/tools/workflow/**` 中已由 Agent 接管的通用部分可作为删除候选。
6. 删除前必须提供 import 扫描、替代入口、build/check/lint 和 CLI/daemon/Dashboard/native tool smoke 证据。

交给 `AlembicPlugin` 窗口的宿主适配与删除任务：

1. 不接入 `@alembic/agent` dependency，不使用 `file:../AlembicAgent`，不 import `@alembic/agent/tools`。
2. 扫描 Plugin 中所有 `#tools/*`、`lib/tools/core`、`lib/tools/catalog`、`lib/tools/v2`、`lib/tools/workflow` 和相对 tool 引用。
3. Codex MCP handler 只保留 schema projection、handler envelope、session、policy 和 Codex-specific adapter；agent/tool execution 改为调用宿主 agent contract。
4. 保留 `lib/external/mcp/**`、`lib/codex/**`、Codex schema/envelope/session/policy、skills、injectable-skills、plugins、channels 和 release/smoke/verify 脚本。
5. 宿主 adapter 替代路径验证完成后，`AlembicPlugin/lib/tools/core/**`、`AlembicPlugin/lib/tools/catalog/**`、`AlembicPlugin/lib/tools/v2/**`、`AlembicPlugin/lib/tools/workflow/**` 中重复的通用 runtime 可删除。
6. 删除前必须运行 import 扫描；删除后至少运行 `npm run build:check`、`npm run lint -- --diagnostic-level=error`、`npm run lint:core-import-boundary`、`npm run smoke:codex-plugin`、`npm run verify:codex-plugin`。
7. 如果发现 Plugin 专属 Codex tool schema 或 response shape 逻辑，保留在 Plugin adapter 中；tool execution 能力由宿主 agent 提供，不由 Plugin 直接依赖 `@alembic/agent/tools`。

Phase 5 已执行完成，见第 17 节和详细记录。下一阶段进入 Plugin/host contract 交接段。

## 17. Phase 5 完成记录（2026-05-17）

状态：已完成 Agent Memory / Context 持久化正式迁移，未修改 `Alembic`、`AlembicPlugin`、`AlembicCore`，未删除外层仓库代码。

详细产物见：

- `docs/AlembicAgent/alembic-agent-phase-5-memory-context-2026-05-17.md`

本轮确认：

- `src/agent/memory/**` 与 `src/agent/context/**` 中的 Agent-owned memory/context 能力正式成为 AlembicAgent public surface。
- 新增 `src/agent/context/index.ts` 作为 Context public barrel。
- `src/agent/memory/index.ts` 补充 `MemoryEmbeddingStore`、flush contract、session schema validator 导出。
- `package.json` 新增 `./memory` 与 `./context` exports，主仓库/宿主代码应优先从 `@alembic/agent/memory` 与 `@alembic/agent/context` 接入；`AlembicPlugin` 不接入这些 package exports。
- `src/index.ts` 根入口同步导出 memory/context 能力，metadata 升级为 `phase-5-memory-context`。
- Core 仍拥有 SQLite/Drizzle schema、migration、repository/vector deterministic contract；Agent 不复制 Core migration。
- Alembic 主仓库仍拥有 database connection construction、projectRoot/dataRoot/WriteZone/PathGuard 配置、CLI/daemon/Dashboard wiring。
- AlembicPlugin 仍只通过宿主 agent contract 使用 memory/context，不引入 `AlembicAgent`。

新增测试覆盖：

- `MemoryStore` SQLite add/update/get/findSimilar/compact/getStats。
- `SessionStore` checkpoint save/load、dimension report、candidate summary、cross reference、schema validation。
- `MemoryEmbeddingStore` JSON sidecar persistence、reload、gc、corrupt JSON recovery。
- `ConversationStore` conversation index、JSONL load、malformed line ignore、delete。

验证结果：

- `npm run build:check` 通过。
- `npm run lint` 通过；保留迁入源码的 27 个 warning，未做行为无关清理。
- `npm run lint:agent-import-boundary` 通过。
- `npm run test` 通过，4 个 test file / 19 个 test 全部通过。
- `npm run check` 通过。
- `npm run build` 通过。
- root smoke import 通过：`{"hasAgentRuntime":true,"hasMemoryStore":true,"hasSessionStore":true,"hasConversationStore":true,"hasContextWindow":true,"phase":"phase-5-memory-context"}`。
- memory entry smoke import 通过：`{"hasMemoryStore":true,"hasPersistentMemory":true,"hasSessionStore":true,"hasEmbeddingStore":true,"hasShapeValidator":true}`。
- context entry smoke import 通过：`{"hasContextWindow":true,"hasConversationStore":true,"hasExplorationTracker":true,"hasPlanTracker":true}`。
- self-reference memory export smoke 通过：`{"selfReference":true,"hasMemoryStore":true,"hasSessionStore":true}`。
- self-reference context export smoke 通过：`{"selfReference":true,"hasContextWindow":true,"hasConversationStore":true}`。

交给 `Alembic` 窗口的任务：

1. 扫描主仓库所有 `#agent/memory/*`、`#agent/context/*`、`lib/agent/memory`、`lib/agent/context` 和相对 memory/context 引用。
2. 将 Agent-owned `MemoryCoordinator`、`ActiveContext`、`SessionStore`、`PersistentMemory`、`MemoryStore`、`MemoryEmbeddingStore`、`ContextWindow`、`ConversationStore` 消费点切到 `@alembic/agent/memory` / `@alembic/agent/context`。
3. 保留 database connection construction、SQLite/Drizzle migrations、repository/vector construction、projectRoot/dataRoot/WriteZone/PathGuard 配置作为主仓库或 Core 职责。
4. 保留 CLI、daemon、HTTP/API、Dashboard、native/macOS、IDE 和主产品 wiring 作为宿主 adapter。
5. 完成替换并验证后，`Alembic/lib/agent/memory/**`、`Alembic/lib/agent/context/**` 中已由 Agent 接管的通用部分可作为删除候选。
6. 删除前必须提供 import 扫描、替代入口、build/check/lint 和 CLI/daemon/Dashboard memory/context smoke 证据。

交给 `AlembicPlugin` 窗口的宿主适配与删除任务：

1. 不接入 `@alembic/agent` dependency，不使用 `file:../AlembicAgent`，不 import `@alembic/agent/memory` 或 `@alembic/agent/context`。
2. 扫描 Plugin 中所有 `#agent/memory/*`、`#agent/context/*`、`lib/agent/memory`、`lib/agent/context` 和相对 memory/context 引用。
3. Codex MCP handler 只保留 schema projection、handler envelope、session、policy 和 Codex-specific adapter；memory/context 读写和 agent run state 改为调用宿主 agent contract。
4. 保留 `lib/external/mcp/**`、`lib/codex/**`、Codex schema/envelope/session/policy、skills、injectable-skills、plugins、channels 和 release/smoke/verify 脚本。
5. 宿主 adapter 替代路径验证完成后，`AlembicPlugin/lib/agent/memory/**`、`AlembicPlugin/lib/agent/context/**` 中重复的 runtime 可删除。
6. 删除前必须运行 import 扫描；删除后至少运行 `npm run build:check`、`npm run lint -- --diagnostic-level=error`、`npm run lint:core-import-boundary`、`npm run smoke:codex-plugin`、`npm run verify:codex-plugin`。
7. 如果发现 Plugin 专属 Codex session/cache/response shape 逻辑，保留在 Plugin adapter 中；memory/context runtime 由宿主 agent 提供，不由 Plugin 直接依赖 `@alembic/agent/memory` 或 `@alembic/agent/context`。

下一阶段进入 Plugin/host contract 交接段：`AlembicPlugin` 删除内置 Agent 能力必须由 Plugin 窗口执行；`AlembicAgent` 窗口只在发现 contract 缺口时补充 package public surface 或类型。

## 18. 统一总控状态快照（2026-05-17）

状态来源：用户口径更新，由 Alembic workspace 计划指挥中心记录。

当前执行进度：

| 执行窗口 | 当前状态 | 总控判断 |
| --- | --- | --- |
| `AlembicAgent` | Phase 5 已完成。 | Agent package 已覆盖 Agent runtime、AI provider、tool system、memory/context public surface；下一步不主动扩面，只响应外层接入发现的 contract 缺口。 |
| `Alembic` | 已执行完 Phase 4。 | 主仓库已推进到通用 Tool System 接入边界；进入下一步前需要回填 Phase 4 的提交、import 扫描、build/check/lint 和 CLI/daemon/Dashboard/native tool smoke 证据。 |
| `AlembicPlugin` | 已完成删除 AI provider。 | Plugin provider 删除视为 Phase 4 清理完成口径；进入 tool/agent 删除前需要回填删除提交、AI import 扫描、build/check/lint、Codex plugin smoke/verify 证据。 |
| `AlembicDashboard` | 已独立为前端源码仓库。 | Dashboard 现在是正式执行窗口，不再只是 Plugin 的构建产物；Plugin/Alembic 的 AI、Agent、candidate、bootstrap/rescan 路由调整必须同步判断前端 API contract 与 UI 降级状态。 |

当前调度顺序：

1. `Alembic` 窗口先封口 Phase 4：补齐验证证据与提交记录，确认 `@alembic/agent/tools` 接入后没有本地通用 tool runtime 回流。
2. `AlembicPlugin` 窗口先封口 AI provider 删除：确认生产代码不再 import `#external/ai`、`lib/external/ai`、`AiProvider`、`AiProviderManager`、`LLMGateway`、`ModelRegistry` 或 `_embedProvider`。
3. `AlembicDashboard` 窗口并行启动前端 contract 适配：先盘点 `/ai/*`、`/candidates/*refine*`、`/modules/*`、`/jobs/*` 的真实调用和 UI 入口，再定义 full Alembic mode 与 Plugin host-managed mode 的能力矩阵。
4. `AlembicAgent` 窗口保持待命：只有当 Alembic、AlembicPlugin 或 AlembicDashboard 明确反馈 public export、类型、事件或 host contract 缺口时，才补充 Agent package。
5. 在 `AlembicDashboard` 完成 host-managed / unavailable UI 兼容前，`AlembicPlugin` 不启动 HTTP AI/Agent 路由破坏性删除；在 `Alembic` Phase 4 和 `AlembicPlugin` AI provider 删除证据补齐前，不启动 Plugin tool system 大删除或 `lib/agent/**` 删除。

待回填证据：

- `Alembic` Phase 4 的 commit hash、验证命令与结果。
- `AlembicPlugin` AI provider 删除的 commit hash、删除路径清单、保留路径清单与验证结果。
- `AlembicDashboard` API contract 盘点、前端 host-managed mode 适配提交、`npm run build` 结果、Alembic / AlembicPlugin 消费构建结果。
- 若任一窗口存在未提交工作区改动，先不要把下一阶段标记为完成；只记录为执行中。

## 19. 真实代码复核后的下一步总控计划（2026-05-17）

状态来源：执行文档、相关阶段文档、`AGENTS.md`、真实源码与边界扫描。第 19 节覆盖第 11 节和第 18 节的下一步调度口径；历史阶段记录继续保留，不作为当前执行入口。

### 19.1 本轮复核结论

`AlembicAgent` 当前事实：

- `package.json` 已发布 `.`、`./agent`、`./ai`、`./tools`、`./memory`、`./context` exports。
- 根入口与 `./agent` 已能导出 `AgentService`、`AgentRuntimeBuilder`、`SystemRunContextFactory`、策略、profile 和 runtime 相关能力；但没有显式 `./service`、`./runtime`、`./prompts`、`./domain` 子路径。
- `./tools` 已导出 catalog、core contracts、router、V2 capabilities、V2 registry/types、`strip` compressor 和 workflow registry。
- `src/tools/v2/adapter/**`、`src/tools/v2/cache/**`、完整 `OutputCompressor` 及 parser、terminal adapters、dashboard/mac/skill adapters 尚未进入 Agent package。这解释了外层仍有 deferred local tool imports。

`Alembic` 当前事实：

- `package.json` 已依赖 `@alembic/agent: file:../AlembicAgent`。
- `npm run lint:agent-extraction-boundary` 已通过；扫描结果为：product `#agent` call sites 21 个，`@alembic/agent/ai` consumer files 16 个，local AI provider consumers 0 个，`@alembic/agent/tools` consumer files 50 个，local common tool consumers 0 个，deferred local tool import files 4 个，classified `lib/tools` files 79 个。
- `Alembic/lib/external/ai/**` 仍存在但已是删除候选；生产消费点已切到 `@alembic/agent/ai` 或宿主 adapter。
- `Alembic/lib/tools/**` 仍存在，当前分为 host adapters、deferred V2 adapter/cache/compressor 和删除候选，不得整目录删除。
- `Alembic/lib/agent/**` 仍是主仓库运行时闭环。HTTP、Lark、ModuleService、SignalCollector、internal workflow 仍调用本地 `AgentService` / memory / runtime / prompt。

`AlembicPlugin` 当前事实：

- `package.json` 没有 `@alembic/agent` 依赖，符合 Plugin 不打包 Agent 的硬边界。
- `lib/external/ai/**` 已不存在；`report:agent-extraction-boundary` 显示 `aiImportFiles: 0`、`aiOutsideImplementationFiles: 0`。
- Plugin 已用 `lib/codex/HostAiAdapter.ts` 和 `lib/injection/modules/AiModule.ts` 表达 host-managed provider 状态；该 provider 默认不可执行，`chat*` / `embed` / `enrichCandidates` 会失败关闭。
- Plugin 仍有 20 个 production files 在 implementation 外引用 `#agent/*`，23 个 production files 在 implementation 外引用 `#tools/*`。
- `lib/daemon/DaemonJobRunner.ts` 仍通过 `bootstrap-internal.ts` / `rescan-internal.ts` 启动 internal Agent workflow。
- `lib/http/routes/ai.ts` 仍保留 `/ai/chat`、`/ai/chat/stream`、`/ai/agent/tool`、`/ai/agent/task`、`/ai/agent/capabilities` 等内部 Agent 表面。
- `lib/http/routes/candidates.ts` 仍保留 AI enrich/refine 路径；host-managed provider 删除后，这些路径不是可用功能，应转为 host-submitted workflow、不可用态或删除。
- `dashboard/src` 已删除，`dashboard/dist` 由 `vendor/AlembicDashboard` 构建复制。当前 `dashboard/dist` 和 `plugins/alembic-codex/runtime/dist` 可能仍包含旧 AI/Agent 文案或旧 runtime 产物；不得手改 dist，必须通过源仓库和构建脚本刷新。

`AlembicDashboard` 当前事实：

- `AlembicDashboard` 是独立前端源码仓库，`package.json` 版本为 `3.3.8`，技术栈为 React + Vite + TypeScript，当前脚本只有 `dev`、`build`、`preview`。
- `Alembic` 与 `AlembicPlugin` 都通过 `vendor/AlembicDashboard` 构建并复制到各自 `dashboard/dist`；前端源码变更必须先在 `AlembicDashboard` 完成，再由外层仓库更新 vendor 指针并执行 `npm run build:dashboard`。
- `src/api.ts` 当前仍调用 `/api/v1/ai/config`、`/api/v1/ai/providers`、`/api/v1/ai/probe`、`/api/v1/ai/env-config`、`/api/v1/ai/token-usage`、`/api/v1/ai/chat`、`/api/v1/ai/chat/stream`、`/api/v1/ai/summarize`、`/api/v1/ai/translate`。
- `src/api.ts` 也调用 `/api/v1/candidates/enrich`、`/api/v1/candidates/bootstrap-refine`、`/api/v1/candidates/refine-preview`、`/api/v1/candidates/refine-preview-stream`、`/api/v1/candidates/refine-apply`。
- `GlobalChatDrawer` 和 `AiChatView` 依赖 `api.chatStream()`；候选润色流程依赖 `api.refinePreviewStream()` 和 `api.refineApply()`；`LlmConfigModal` 依赖 provider 列表、probe、workspace env-config 写入。
- Dashboard 不应实现 Agent 决策、AI provider 或 tool execution；它只负责展示后端能力、调用后端 contract、在能力不可用时给出可恢复 UI 状态。
- 当前前端文案仍大量描述内置 AgentRuntime、多 provider fallback、AI 润色、AI Chat、Phase 6 AI 流程；Plugin host-managed mode 下这些文案必须变成能力感知，而不是继续暗示 Plugin 内置可执行 provider。

### 19.2 总体调度原则

1. `AlembicAgent` 先补 contract surface，不主动扩大到 Dashboard、Codex delivery、主仓库平台 adapter。
2. `AlembicDashboard` 是独立执行窗口，由总控统一分配任务；它负责前端 API contract、能力感知 UI、文案、交互和构建产物来源，不承载后端 AI/Agent/tool runtime。
3. `Alembic` 先封口 Phase 4，再进入 Phase 5 memory/context 接入；不要删除 `lib/agent/**`，也不要因为 Dashboard 前端共享就削弱主产品完整 AI/Agent 体验。
4. `AlembicPlugin` 先封口 AI provider 删除，再等待 Dashboard host-managed / unavailable UI 兼容，然后切断 internal job、HTTP AI/Agent 和 candidate AI 路由，再拆 tool router，最后删除 `lib/agent/**`。
5. Plugin 不能因为 `lib/external/ai/**` 已删除就直接删除 `lib/tools/**` 或 `lib/agent/**`；同样不能先删除 Dashboard 正在调用的 HTTP contract 再让前端 404。
6. Dashboard UI 变更不在 Plugin 或 Alembic 的 `dashboard/dist` 中手改；如需去掉旧 AI/Agent UI，先进入 `AlembicDashboard` 源码，再由 `Alembic` / `AlembicPlugin` 运行 `npm run build:dashboard` 消费。

### 19.3 AlembicAgent 窗口下一步

#### A6-1：补齐 Agent service/runtime/prompt/domain public surface

目标：让 `Alembic` 后续可以从明确 package 子路径消费 service、runtime、prompt 和 Agent domain 能力，而不是通过根入口猜测。

任务：

1. 新增或明确以下 public subpath exports：
   - `@alembic/agent/service`
   - `@alembic/agent/runtime`
   - `@alembic/agent/prompts`
   - `@alembic/agent/domain`
2. `./service` 至少导出 `AgentService`、`AgentRuntimeBuilder`、`SystemRunContextFactory`、`AgentRunContracts`、`AgentRunCoordinator`、profile compiler/registry/stage factory。
3. `./runtime` 至少导出 `AgentRuntime`、`AgentRuntimeTypes`、`SystemRunContext`、`ToolExecutionPipeline`、`AgentState`、`AgentMessage`、`BudgetController`、diagnostics 相关类型。
4. `./prompts` 至少导出 `computeAnalystBudget` 和当前 bootstrap/scan/evolution/relation 运行需要的 prompt builders。
5. `./domain` 至少导出 `EpisodicConsolidator`、EvidenceCollector 和 consolidation gate。
6. 为每个新增 export 增加 smoke import 测试，避免只在根入口隐式可用。

验证：

- `npm run build:check`
- `npm run lint`
- `npm run lint:agent-import-boundary`
- `npm run test`
- `npm run check`
- self-reference import smoke：`@alembic/agent/service`、`@alembic/agent/runtime`、`@alembic/agent/prompts`、`@alembic/agent/domain`

交付给 `Alembic` 的回填：

- 明确哪些旧 `#agent/service`、`#agent/runtime`、`#agent/prompts`、`#agent/domain` import 可切到新 subpath。
- 明确哪些仍必须留在 `Alembic` host adapter。

#### A6-2：评估并补齐 Tool V2 adapter/cache/compressor 缺口

目标：处理 `Alembic` 当前 4 个 deferred local tool import files 的根因。

本轮回填（2026-05-17）：

- A6-1 已在 `AlembicAgent` 增加 `@alembic/agent/service`、`@alembic/agent/runtime`、`@alembic/agent/prompts`、`@alembic/agent/domain` 明确 subpath exports，并增加 `test/contract-surface.test.ts`。
- A6-2 已完成边界评估，详细记录见 `docs/AlembicAgent/alembic-agent-phase-6-contract-surface-2026-05-17.md`。
- 当前结论：`DeltaCache`、`SearchCache`、`OutputCompressor`、`compressor/parsers/**`、`router.ts`、`V2CapabilityCatalog` 属于 Agent-owned generic candidate；`V2ToolRouterAdapter` 可在抽出 context-provider contract 后迁入； concrete `ToolContextFactory` 与 Dashboard/Mac/Skill/terminal/Codex MCP 具体 adapter 继续 host-owned。
- 本轮不允许 `Alembic` 删除 deferred V2 本地文件；需等下一次 AlembicAgent generic Tool V2 迁移完成并通过 import 扫描后再处理。
- 本轮验证：`npm run build:check`、`npm run check`、`npm run build`、四个新 subpath self-reference import smoke 均通过；`npm run check` 中仍有 27 个既有 Biome warning，但命令退出成功。

必须逐文件判断：

- `lib/tools/v2/adapter/ToolContextFactory.ts`
- `lib/tools/v2/adapter/V2CapabilityCatalog.ts`
- `lib/tools/v2/adapter/V2ToolRouterAdapter.ts`
- `lib/tools/v2/cache/DeltaCache.ts`
- `lib/tools/v2/cache/SearchCache.ts`
- `lib/tools/v2/compressor/OutputCompressor.ts`
- `lib/tools/v2/compressor/parsers/**`

判断规则：

- 若文件只表达通用 Agent tool runtime、缓存、压缩和 context contract，则迁入 `AlembicAgent` 并通过 `@alembic/agent/tools` 或新的明确子路径导出。
- 若文件绑定 Alembic DI container、repository、projectRoot/dataRoot 或平台权限，则只抽 contract，把具体 adapter 留给 `Alembic`。
- 不迁 `DashboardOperationAdapter`、`MacSystemAdapter`、`MacSystemCapabilities`、`SkillAdapter`、`SkillCapabilities`、Codex MCP schema/handler。

验证：

- 增加 adapter/cache/compressor 单元测试。
- 覆盖成功、缺依赖、权限拒绝、缓存命中/失效、压缩 parser fallback。
- `npm run check`

交付给 `Alembic` 的回填：

- 更新 deferred local tool import list：哪些可切、哪些继续 host-owned、哪些不再删除。

### 19.4 Alembic 窗口下一步

#### M4-close：封口 Phase 4 Tool System 接入

当前 `lint:agent-extraction-boundary` 已通过，可作为 Phase 4 边界扫描证据之一；还不能单独作为完整完成证据。

必须补齐：

1. 记录当前提交 hash。
2. 回填 `npm run lint:agent-extraction-boundary` 结果：
   - product `#agent` call sites: 21
   - `@alembic/agent/ai` consumer files: 16
   - local AI provider consumers: 0
   - `@alembic/agent/tools` consumer files: 50
   - local common tool consumers: 0
   - deferred local tool import files: 4
   - classified `lib/tools` files: 79
3. 运行并回填：
   - `npm run build:check`
   - `npm run lint`
   - `npm run check` 或等价代表测试组合
4. 明确 4 个 deferred local tool import files 不属于可删除范围，直到 `AlembicAgent` 完成 A6-2。

不得做：

- 不删除 `lib/tools/**` 整目录。
- 不删除 Dashboard/Mac/Skill/Terminal host adapters。
- 不把主仓库 CLI/daemon/HTTP/Dashboard/native/IDE wiring 迁入 Agent。

#### M5：开始 Memory / Context 接入准备

目标：只切 Agent-owned memory/context surface，不切运行时闭环。

优先切换候选：

- `lib/workflows/capabilities/completion/CompletionSteps.ts`
- `lib/workflows/capabilities/completion/WorkflowCompletionTypes.ts`
- internal-agent workflow 中仅引用 `MemoryCoordinator`、`MemoryEmbeddingStore`、`PersistentMemory`、`SessionStore` 的类型或构造点。

保留本地直到 A6-1 后再判断：

- `#agent/service/index.js`
- `#agent/runtime/SystemRunContext.js`
- `#agent/prompts/insight-analyst.js`
- `#agent/domain/EpisodicConsolidator.js`，除非 A6-1 已提供明确 `@alembic/agent/domain`。

验证：

- import 扫描：`#agent/memory` 和 `#agent/context` 的生产消费点应减少，剩余项必须分类。
- `npm run build:check`
- internal bootstrap/rescan 代表测试或 smoke。

#### M6：外部 AI provider 删除候选封口

目标：删除 `Alembic/lib/external/ai/**` 前先完成产品 smoke，不只依赖 import 扫描。

前置条件：

- CLI `getAiConfigInfo` 路径确认使用 `@alembic/agent/ai`。
- HTTP AI settings/provider route 确认使用 `@alembic/agent/ai`。
- `AiModule` provider manager 生命周期、token usage、embed fallback smoke 通过。
- Dashboard AI settings smoke 通过。

删除前必须回填：

- 删除路径清单。
- 保留路径清单：`AiModule`、CLI/daemon/Dashboard settings、Workspace settings/secrets、host adapter。
- `npm run build:check`
- `npm run lint:agent-extraction-boundary`
- CLI/daemon/Dashboard AI settings smoke。

### 19.5 AlembicDashboard 窗口下一步

#### D1：建立前端 API contract 与后端能力矩阵

目标：让 Dashboard 同时适配 `Alembic` full mode 与 `AlembicPlugin` host-managed mode，避免 Plugin 清理后前端出现 404、错误弹窗或继续暗示本地 AI provider 可用。

任务：

1. 盘点 `src/api.ts` 中所有 `/api/v1/ai/*`、`/api/v1/candidates/*refine*`、`/api/v1/modules/*`、`/api/v1/jobs/*`、`/api/v1/skills/*` 调用，按以下类别标注：
   - full Alembic mode 必须可用。
   - Plugin host-managed mode 只显示状态或 host handoff。
   - deterministic-only fallback 可用。
   - deprecated / delete candidate。
2. 建立前端能力模型，例如 `BackendCapabilities` / `DashboardRuntimeMode`：
   - `aiConfig: editable | host-managed | unavailable`
   - `chat: stream | host-handoff | unavailable`
   - `candidateRefine: local-ai | host-handoff | preview-apply-only | unavailable`
   - `bootstrap: internal | external-mission | unavailable`
   - `rescan: internal | external-mission | unavailable`
   - `skillsSuggest: available | unavailable`
3. 能力模型来源优先使用真实后端返回：`/daemon/health`、`/ai/config`、`/ai/providers`、`/jobs/*`、后续 Plugin/Alembic 可新增的轻量 capability endpoint；不得在前端硬编码“当前一定是 Plugin”。
4. 对 404、501、503、`HOST_MANAGED_UNAVAILABLE`、`AI_PROVIDER_UNAVAILABLE` 等状态做统一归一化，进入 UI 状态而不是散落 catch。

验证：

- `rg -n "/ai/|/candidates/.*refine|/candidates/enrich|/modules/bootstrap|/modules/rescan|/jobs/" src`
- `npm run build`

交付给 `Alembic` / `AlembicPlugin`：

- 前端需要的 capability 字段清单。
- 哪些后端路由必须保留兼容响应，哪些可以在 UI 适配后删除。
- 哪些旧文案需要后端状态驱动。

#### D2：适配 LLM 配置与 provider 状态 UI

目标：让 `LlmConfigModal` 在主仓库 full mode 中继续支持真实配置，在 Plugin host-managed mode 中显示宿主托管状态，不要求用户在插件内配置不可执行 provider。

任务：

1. `LlmConfigModal` 保留 full Alembic mode 的 provider/model/API key/proxy/embed 配置能力。
2. Plugin host-managed mode 下：
   - provider list 可展示为宿主托管、只读或有限可选。
   - `probeProvider()` 返回 `host-managed` / `canProbe: false` 时显示正常说明，不显示连接失败。
   - API key 输入、保存按钮和 token usage 入口根据 capability 隐藏或转为只读。
3. 更新 `src/i18n/locales/zh.ts` 与 `src/i18n/locales/en.ts`，不要再把 Plugin 模式描述成本地 provider/API key 配置。
4. `Header` 中 provider 状态点、命令面板入口和设置按钮跟随 capability。

验证：

- `npm run build`
- 手动或浏览器验证 full mode 与 host-managed mode 两种状态下的 LLM 配置弹窗。

后端配合：

- `AlembicPlugin` 保留 `/ai/providers`、`/ai/config`、`/ai/probe` 的 host-managed 兼容响应。
- `Alembic` 保留 full mode 的可执行 provider/config/probe/env-config/token-usage 行为。

#### D3：适配 AI Chat、全局润色与候选补齐 UI

目标：让 Dashboard 不再假设 `/ai/chat/stream` 与 candidate refine/enrich 总是本地可执行。

任务：

1. `GlobalChatDrawer`、`AiChatView`、`useChatStream` 在 `chat: unavailable` 时禁用输入并展示 host handoff / unavailable 状态；在 `chat: host-handoff` 时提示通过 Codex/IDE/Lark 宿主继续，而不是发起 `/ai/chat/stream`。
2. Candidate refine 流程：
   - `refinePreviewStream()` 只有 `candidateRefine: local-ai` 时调用。
   - `refineApply()` 带 `preview` 的确认写入可以保留。
   - 无 `preview` 且需要后端重新调用 AI 的 apply 必须根据 capability 禁止或转 host handoff。
3. `enrichCandidates()`、`bootstrapRefine()`、`summarizeCode()`、`translate()` 标注为 capability-gated；Plugin 模式下隐藏或改为 host-submitted workflow。
4. `CandidatesView`、`GlobalChatDrawer`、`AiChatView`、`ScanResultCard` 和相关 toast/error 文案统一使用可恢复状态，不把后端不可用呈现为崩溃。

验证：

- `npm run build`
- 代表性 UI smoke：候选列表、候选润色入口、全局 Chat、独立 AI Chat view、错误/不可用状态。

阻塞关系：

- D3 完成前，`AlembicPlugin` 不得删除 `/ai/chat`、`/ai/chat/stream`、`/candidates/refine-preview-stream`、`/candidates/enrich` 等 Dashboard 仍会直接调用的路由；最多先返回结构化 unavailable 响应。

#### D4：更新 Help / 架构 / i18n 文案，去除 Plugin 内置 Agent 错觉

目标：保留 Alembic full mode 的完整能力说明，同时让 Plugin 模式不再暴露旧的“本地 provider/API key/AgentRuntime”语义。

任务：

1. 更新 `HelpView`、`zh.ts`、`en.ts` 中关于内置 AgentRuntime、多 provider fallback、Phase 6 AI 润色、AI Chat、Skills 推荐、Bootstrap 双路径的描述，使其跟随 capability 或明确区分：
   - Alembic full mode：本地 CLI/daemon/HTTP/Dashboard 内置完整体验。
   - Plugin host-managed mode：Codex/IDE 宿主执行，Dashboard 展示状态、候选、任务和可恢复入口。
2. 不删除 Help、Wiki、Skills、Signal、Guard、Bootstrap、Project Intelligence 等完整前端页面；只做能力感知。
3. 旧文案扫描必须覆盖 `src/i18n/**`、`src/components/**`、`src/App.tsx`。

验证：

- `rg -n "AgentRuntime|API Key|AI Chat|AI 润色|AI 补齐|provider|fallback|chat/stream|refine-preview" src`
- `npm run build`

#### D5：前端产物消费与跨仓库同步

目标：确保 Dashboard 源码改动被 `Alembic` 与 `AlembicPlugin` 正确消费，而不是停留在独立仓库。

任务：

1. `AlembicDashboard` 完成 D1-D4 后提交源码变更。
2. `Alembic` 更新 `vendor/AlembicDashboard` 指针，运行：
   - `npm run build:dashboard`
   - `npm run build:check`
   - Dashboard full mode smoke：LLM config、Chat、candidate refine、bootstrap/rescan、Jobs。
3. `AlembicPlugin` 更新 `vendor/AlembicDashboard` 指针，运行：
   - `npm run build:dashboard`
   - `npm run prepare:codex-plugin-runtime`
   - `npm run smoke:codex-plugin -- --daemon`
   - `npm run verify:codex-plugin`
4. 不手改 `Alembic/dashboard/dist`、`AlembicPlugin/dashboard/dist`、`plugins/alembic-codex/runtime/dashboard/dist`；所有产物必须由 `build:dashboard` 与 runtime prepare 生成。

回填要求：

- `AlembicDashboard` commit hash。
- `Alembic` vendor 指针 hash、构建命令和 smoke 结果。
- `AlembicPlugin` vendor 指针 hash、构建命令、daemon dashboard smoke 和 verify 结果。
- 若某个后端 endpoint 需要新增 capability 字段，回填到对应仓库窗口任务中。

### 19.6 AlembicPlugin 窗口下一步

#### P4-close：封口 AI provider 删除

当前事实可记录为：

- `lib/external/ai/**` 已删除。
- `report:agent-extraction-boundary` 显示 `aiImportFiles: 0`、`aiOutsideImplementationFiles: 0`。
- `package.json` 没有 `@alembic/agent` dependency。
- `HostAiAdapter` 提供 host-managed provider 状态，但不执行 LLM。

必须补齐：

1. 提交 hash。
2. 删除路径清单与保留路径清单。
3. `npm run build:check`
4. `npm run lint -- --diagnostic-level=error`
5. `npm run lint:core-import-boundary`
6. `npm run report:agent-extraction-boundary`
7. `npm run build:dashboard`
8. `npm run prepare:codex-plugin-runtime`
9. `npm run smoke:codex-plugin`
10. `npm run verify:codex-plugin`

特别检查：

- `dashboard/dist` 和 `plugins/alembic-codex/runtime/dist` 不能继续暴露旧的 Plugin 本地 provider/API key/AgentRuntime 语义。若仍存在，先修 `vendor/AlembicDashboard` 源码或 runtime 构建链路，不手改 dist。

#### P4.5：切断 internal bootstrap/rescan daemon job

目标：停止 daemon job 后台启动 internal AgentRuntime。

任务：

1. 改写 `lib/daemon/DaemonJobRunner.ts`：
   - `bootstrap` 不再 import `bootstrap-internal.ts`。
   - `rescan` 不再 import `rescan-internal.ts`。
   - recoverable job 改为创建/恢复 host-driven briefing 状态，或直接调用 external workflow planner。
2. 从生产入口断开：
   - `lib/external/mcp/handlers/bootstrap-internal.ts`
   - `lib/external/mcp/handlers/rescan-internal.ts`
   - `lib/external/mcp/handlers/bootstrap/InternalColdStartWorkflow.ts`
   - `lib/external/mcp/handlers/rescan/InternalKnowledgeRescanWorkflow.ts`
   - `lib/workflows/capabilities/execution/internal-agent/**`
3. `alembic_bootstrap` / `alembic_rescan` 继续保留 MCP schema 和 host-driven mission briefing 行为。

验收扫描：

```bash
rg -n "bootstrap-internal|rescan-internal|InternalColdStartWorkflow|InternalKnowledgeRescanWorkflow|internal-agent|runEvolutionAudit|EvolutionAgentRun" lib test
```

允许项只能是迁移文档、deprecated test 或明确 dead-code 删除候选；生产入口不得再调用。

#### P4.6：清理 HTTP AI/Agent 与 candidate AI 路由

目标：删除或 host-managed 化所有会调用不可执行 `HostAiProvider.chat*` 的后端入口。

前置条件：

- `AlembicDashboard` 至少完成 D1-D3，前端不再无条件调用 `/ai/chat`、`/ai/chat/stream`、`/candidates/enrich`、`/candidates/bootstrap-refine`、`/candidates/refine-preview`、`/candidates/refine-preview-stream`。
- 若 D1-D3 尚未进入外层构建产物，Plugin 只能把相关路由改为结构化 unavailable，不能删除路由导致 Dashboard 404。

必须处理：

- `lib/http/routes/ai.ts`
  - 保留：`/lang`，以及必要的 host-managed `/providers`、`/config` 兼容状态。
  - 删除或返回明确 host-managed unavailable：`/summarize`、`/translate`、`/chat`、`/chat/stream`、`/agent/tool`、`/agent/task`、`/agent/capabilities`。
  - `/mock/cleanup` 若仍需要，应改名或归到非 AI 路由；不要继续作为本地 AI provider 功能呈现。
- `lib/http/routes/candidates.ts`
  - `/enrich`、`/bootstrap-refine`、`/refine-preview`、`/refine-preview-stream`、无 preview 的 `/refine-apply` 不得调用 Plugin provider。
  - Candidate 内容补齐改为 host-submitted：Codex/IDE 通过 MCP `submit_knowledge`、`dimension_complete` 或后续 host task 提交结构化结果。
- `lib/http/routes/extract.ts`、`lib/http/routes/recipes.ts`、`lib/service/module/ModuleService.ts`
  - 移除 `runScanAgentTask`、`runRelationDiscovery` 和本地 `AgentService` 依赖，或转成 host-driven briefing。
- `lib/service/wiki/WikiGenerator.ts`、`lib/service/vector/ContextualEnricher.ts`、`lib/service/search/CrossEncoderReranker.ts`
  - Plugin 不再通过本地 provider 执行 AI compose/enrich/rerank；保留 deterministic fallback 或等待 host/Core 可选端口。

验收扫描：

```bash
rg -n "runScanAgentTask|runTranslationJson|runRelationDiscovery|AgentTaskHandlers|bootstrapRefine|chatWithStructuredOutput|container.get\\('aiProvider'\\)|singletons\\?\\.aiProvider" lib/http lib/service lib/external/mcp
```

生产代码不得再通过 Plugin host-managed provider 执行 LLM。

#### P5：拆掉 Plugin 内部 tool router，保留 MCP schema/handler

前置条件：P4.5 和 P4.6 完成。

目标：让 MCP tool call 走直接 handler dispatch + Gateway/role policy，不再通过 Plugin 内部 Agent tool router。

任务：

1. `lib/external/mcp/McpServer.ts` 不再构造 `CapabilityCatalog`、`LightweightRouter`、`McpToolAdapter`。
2. `lib/external/mcp/tools.ts`、zod schema、tool annotations、tier/policy 继续保留。
3. `McpServer._handleToolCall()` 保持 response envelope 兼容，但内部直接执行 resolved handler。
4. HTTP `commands/modules/dashboard-operation` 若仍需要 operation ids，迁出一个小型常量模块，不依赖 `#tools`。
5. `AgentModule.ts` 中只服务内部 Agent loop 的 `toolRouter`、`toolRegistry`、`toolForge`、V2 adapter/cache/compressor 注册全部删除或推迟到 P6 随 agent 删除。

验收扫描：

```bash
rg -n "#tools/|lib/tools|ToolRouter|ToolRegistry|ToolForge|CapabilityCatalog|LightweightRouter|McpToolAdapter|TerminalAdapter|terminalSessionManager" lib test package.json
```

允许项只能是保留的 MCP schema metadata 或已迁出的轻量常量；不得再存在内部 Agent tool execution system。

#### P6：删除 Plugin `lib/agent/**` 与 internal-agent workflow

前置条件：P4.5、P4.6、P5 完成，且 production `#agent/*` 扫描为零。

删除候选：

- `lib/agent/**`
- `lib/workflows/capabilities/execution/internal-agent/**`
- agent prompt/profile/strategy/task/forge 专项测试
- `package.json` imports 中的 `#agent/*`

不得删除：

- `lib/codex/**`
- `lib/external/mcp/**`
- `plugins/**`
- `channels/**`
- `injectable-skills/**`
- Codex release/smoke/verify/cache sync scripts
- Dashboard 构建消费链路

验收：

```bash
test ! -d lib/agent
test ! -d lib/workflows/capabilities/execution/internal-agent
rg -n "#agent/|lib/agent|internal-agent|AgentRuntime|AgentService|agentService|systemRunContextFactory" lib test package.json
npm run build:check
npm run smoke:codex-plugin
npm run verify:codex-plugin
```

### 19.7 当前禁止启动的工作

- 不允许 `AlembicPlugin` 直接删除 `lib/agent/**`。
- 不允许 `AlembicPlugin` 直接删除 `lib/tools/**`。
- 不允许 `Alembic` 删除 `lib/agent/**`。
- 不允许 `Alembic` 删除 `lib/tools/**` 整目录。
- 不允许在 `dashboard/dist` 或 `plugins/alembic-codex/runtime/dist` 中手工修文案或 API 调用。
- 不允许在 `AlembicDashboard` 还会直接调用某个 Plugin 路由时，先从 Plugin 删除该路由并制造前端 404。
- 不允许为了适配 Plugin host-managed mode 删除 Dashboard 的完整页面、完整主仓库 full mode 能力或真实用户工作流；只能做 capability-gated UI。
- 不允许让 Plugin 新增 `@alembic/agent` 依赖。
- 不允许把 Codex MCP schema、Skill、channel、plugin release/smoke 或 Dashboard 交付链路迁入 `AlembicAgent`。

### 19.8 回填模板

各窗口完成每个阶段后必须在本文件或对应详细记录中回填：

```text
窗口：
阶段：
提交：
完成范围：
新增/修改/删除路径：
保留路径：
import 扫描命令与结果：
build/check/lint/test/smoke 命令与结果：
仍需其他窗口配合：
下一阶段是否允许启动：是/否，原因：
```
