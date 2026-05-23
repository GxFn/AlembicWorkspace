# AlembicPlugin Global Function Boundary Evidence

日期：2026-05-22
任务包：GFBD-P1-P
窗口：AlembicPlugin
状态：待总控验收

## 完成范围

本轮只做真实代码证据采集和职责边界判断；未修改 AlembicPlugin 产品源码，未移动目录，未删除 compatibility layer，未刷新本机 Codex plugin cache，未重新打包 runtime，未运行真实项目测试。

已读取和扫描范围：

- `AlembicPlugin/AGENTS.md`、`package.json`、`bin/codex-mcp.ts`、`bin/daemon-server.ts`。
- `lib/codex/**`、`lib/external/mcp/**`、`lib/http/**`、`lib/service/{search,task,module,skills,bootstrap,vector}/**`、`lib/governance/**`、`lib/injection/**`。
- `plugins/alembic-codex/**`、`channels/codex/**`、`.agents/**`、`injectable-skills/**`、release / verify / boundary scripts。
- 相关 unit / integration / scenario tests，只做静态读取，不运行真实项目复测。

提交 hash：不适用。本轮禁止产品源码改动，AlembicPlugin 仓库保持无待提交改动。

## 关键代码证据

### 发布身份与 Codex artifact

- `package.json:2-4` 显示根包仍是 `alembic-ai@0.2.0` 且 `private: true`；`package.json:54` / `package.json:75` 通过 `prepublishOnly` 禁用 root npm publish。
- `package.json:68`、`package.json:72`、`package.json:82-83` 保留 Codex plugin runtime prepare / release / verify 链路；`package.json:100` 暴露唯一 bin `alembic-codex-mcp`。
- `package.json:128` 保留本地开发依赖 `@alembic/core: file:../AlembicCore`。
- `channels/codex/channel.json:22-31` 定义 installable plugin `alembic-codex`、runtime package `alembic-ai`、runtime mode `plugin`、runtime specifier `./runtime.tgz`、runtime bin `alembic-codex-mcp`。
- `channels/codex/channel.json:38-47` 明确 `alembic-ai` 是 `portable-artifact`，artifact 为 `plugins/alembic-codex/runtime.tgz`，usedBy 为 `alembic-codex`。
- `scripts/prepare-codex-plugin-runtime.mjs:47`、`202-236` 拷贝 embedded Core snapshot 并写入 `.alembic-source.json`；`312-318` 把 runtime 内 `@alembic/core` 归一为 `file:vendor/AlembicCore`。
- `scripts/verify-release-package-boundary.mjs:39-54` 和 `81-91` 强制检查 portable runtime 保留 `file:vendor/AlembicCore`、`.alembic-source.json` 和 `runtime.tgz`。
- `plugins/alembic-codex/bin/alembic-codex-mcp-wrapper.mjs:14` 通过 `npx --offline --package ./runtime.tgz alembic-codex-mcp` 启动 embedded runtime。

判断：根包命名仍有历史重叠风险，但当前发布路径不是 registry package，而是 Codex plugin snapshot + portable runtime artifact。

### Codex MCP 入口闭环

- `bin/codex-mcp.ts:8-9` 先写入 Codex runtime 环境；`bin/codex-mcp.ts:32-34` 启动 `CodexMcpServer`。
- `lib/external/mcp/CodexMcpServer.ts:146` 使用 stdio transport；`168-175` 注册 `ListTools` / `CallTool`；`190-221` 支持显式 `projectRoot` scope。
- `lib/external/mcp/CodexMcpServer.ts:260-280` 把 `alembic_codex_status` / diagnostics / init / dashboard / job 等本地 Codex 工具和其余 Plugin-owned tools 分流。
- `lib/external/mcp/CodexMcpServer.ts:715-754` 只有显式 `alembic_codex_bootstrap` / `alembic_codex_rescan` job 才通过 `ensureEnhancementDaemon` 和 `/api/v1/jobs/*` 请求 Alembic resident service。
- `lib/external/mcp/CodexMcpServer.ts:830-873` 对普通 Codex-facing tools 初始化 embedded `McpServer`，source 标记为 `plugin-owned-codex-facing`。
- `lib/codex/ToolPolicy.ts:81-93` 把 host-agent workflow tools 与 init-on-demand tools 分开；`208-243` 根据 knowledge state / tier 计算 Codex 可见工具。
- `lib/external/mcp/tools.ts:143-169` 为 Codex tools 提供 MCP annotations；`191-235` 只对写操作做 Gateway mapping。

判断：`lib/external/mcp/**` 是 Plugin 入口本体，不是可删除的旧 internal agent；`alembic_codex_*` explicit daemon jobs 是 Alembic service request client，不转移 Codex-facing tool ownership。

### Prime / Skill / host response contract

- `lib/external/mcp/handlers/task.ts:203` 通过 `PrimeSearchPipeline` 做 prime 知识搜索；`265-300` 构造 `primeKnowledgeMaterial`、knowledge、searchMeta 和可见 receipt message。
- `lib/external/mcp/handlers/task.ts:355-356` 固定 `shoutInstruction` 与 `hostResponse`；`370-381` 保留 `evidenceRefs` 结构。
- `lib/external/mcp/handlers/task.ts:427-430` 要求 Codex/first-person 可见 receipt，不默认倾倒 evidenceRefs 路径 / 行号。
- `lib/external/mcp/handlers/task.ts:454` 明确 `hostResponse` 不是 MCP tool call，避免引入 `codex_host_response`。
- `plugins/alembic-codex/skills/alembic/SKILL.md:25` 与 `test/unit/TaskPrimeKnowledgeMaterial.test.ts:178-230` 同步验证 prime 后立即可见 shout、evidenceRefs 保留在 payload、不可见默认路径倾倒。

判断：prime receipt、hostResponse、Skill instruction 是 Plugin-owned Codex-facing contract，必须留在 AlembicPlugin；证据路径只作为后续代码复核 payload，不作为默认可见输出。

### Alembic service request client

- `lib/codex/ServiceRequestBoundary.ts:23-30` 明确 Codex-facing MCP tools 归 AlembicPlugin，Alembic 只通过显式 resident service APIs 请求；`alembic_search` 标记 `residentServiceRequested: true`。
- `lib/codex/ServiceRequestBoundary.ts:47-49` 明确 semantic/vector enhancement 必须走 Alembic `/api/v1/search`，daemon MCP bridge 已删除。
- `lib/service/search/ResidentSearchClient.ts:68-113` 读取 daemon state/token 并请求 `/api/v1/search`。
- `lib/service/search/ResidentSearchClient.ts:295-310` 把 Codex-facing `auto` 翻译成 resident `semantic`，同时保留 requested mode telemetry。
- `lib/external/mcp/handlers/search.ts:83-127` 优先尝试 resident search；`179-183` 把 residentSearch / residentVector 写入 `searchMeta`。
- `lib/service/task/PrimeSearchPipeline.ts:207-218` baseline search 仍在 Plugin，semantic enhancement 可通过 resident service 注入；`298-321` resident 不可用时降级并记录原因。
- `test/unit/CodexServiceRequestBoundary.test.ts:5-42`、`test/unit/ResidentSearchClient.test.ts:38-74`、`test/unit/SearchHandlerResidentSearch.test.ts:93-150` 锁定这些边界。

判断：`ResidentSearchClient` 是应留在 Plugin 的 service request client；它不是 AI provider，也不是重复的 Alembic search service。后续若下沉，只能下沉稳定 wire contract，不能把 Codex-facing tool ownership 下沉。

### HTTP / portable compatibility surface

- `lib/http/HttpServer.ts:280-352` 当前 HTTP surface 挂载 health、daemon、jobs、auth、guard、search、extract、commands、skills、wiki、candidates、modules、violations、knowledge、panorama、evolution、signals、audit、logs；未挂载旧 `/api/v1/ai/*` 或 `/api/v1/recipes/*`。
- `test/unit/PluginHttpSurfaceBoundary.test.ts:11-45` 验证旧 Dashboard compatibility operation source、旧 AI route、旧 recipes route、旧 dashboard operation dispatch 不存在。
- `lib/http/routes/candidates.ts:28-43` `/candidates/enrich` 返回 `HOST_AI_MANAGED`；`57-72` bootstrap refine fail-closed；`255-321` preview / stream fail-closed；`372-379` 未提供 preview 时 apply fail-closed。
- `lib/service/module/ModuleService.ts:379-441` target scan 只返回文件和 `hostManaged/noAi`，不执行本地 AI 提取；`460-584` project scan 只保留文件收集和 Guard audit。
- `lib/http/routes/daemon.ts:17-70` embedded runtime health 明确 dashboard unavailable，internalAi owner 为 Alembic 且 pluginConfigRemoved。

判断：HTTP routes 当前主要是 embedded runtime / portable compatibility 与本地工具支撑。`candidates` route 的 `HOST_AI_MANAGED` 是后续命名和消费方分类候选，不应在 GFBD-1 直接删除。

### AI / Agent runtime removal state

- `node scripts/report-agent-extraction-boundary.mjs --format json` 扫描 `lib` / `bin` / `scripts` / `test` 共 330 个 source files，`agentImportFiles`、`aiImportFiles`、`toolImportFiles` 均为 0。
- `find lib -type d -name agent -o -name tools -o -path 'lib/external/ai'` 无输出，确认 `lib/agent`、`lib/tools`、`lib/external/ai` 不存在。
- 禁止 specifier 扫描 `@alembic/agent|#agent/|#tools/|#external/ai|lib/agent|lib/tools|lib/external/ai` 仅命中 `scripts/report-agent-extraction-boundary.mjs` 自身的检测规则。
- `lib/injection/modules/KnowledgeModule.ts:103-105` 明确 Plugin 不注入第三方 AI / embedding provider，`aiProvider: null`。
- `lib/injection/modules/VectorModule.ts:36-38` 明确 Plugin 不维护可执行 embedding provider，`embedProvider: null`。
- `lib/external/mcp/handlers/system.ts:18-22` health 只表达 AI provider 边界，不做 key 探测。
- `lib/injection/modules/SkillHooksModule.ts:2-12` 明确只保留 Codex-facing SkillHooks，不注册本地 agent runtime 或 terminal execution service。

判断：本轮未发现需要删除的 agent runtime / external AI provider / tools runtime 副本；剩余 `AI provider` 文字主要是边界说明、status 展示、测试断言或 Core vector/search 行为。

### Governance / SkillHooks

- `lib/governance/gateway/Gateway.ts:66-80` 是统一 Gateway pipeline；`202-220` 提供 `checkOnly` 给 MCP gating。
- `lib/governance/permission/PermissionManager.ts:17-69` 按 actor/action/resource 做权限判断，并兼容 Gateway action 格式。
- `lib/governance/constitution/ConstitutionValidator.ts:30-35` 和 `188` 保留数据守护规则及 external_agent / chat_agent 判断。
- `lib/governance/gateway/GatewayActionRegistry.ts:2-7` 把 Gateway 与 Service 连接；`19-202` 注册 knowledge / recipe / guard / search 操作。
- `lib/external/mcp/McpServer.ts:13-15`、`337`、`615-644` 使用 Gateway gating；`lib/injection/ServiceContainer.ts:20`、`127` 注册 `SkillHooksModule`。

判断：governance 不是通用 Core 宪法副本；它是 Plugin embedded MCP / HTTP 写操作请求治理闭环的一部分。后续可统一命名和契约，但不得当成“旧 agent 残留”删除。

## 职责边界判断

### 应留在 AlembicPlugin

- Codex MCP stdio/http 入口：`bin/codex-mcp.ts`、`lib/external/mcp/**`。
- Codex runtime/status/diagnostics/preflight/tool policy：`lib/codex/**`。
- Codex-facing tool schema、Gateway gating、prime receipt、Skill contract、tool visibility、projectRoot override、admin tier policy。
- Codex plugin shell、channel、marketplace、Skill、cache sync 和 release scripts：`plugins/alembic-codex/**`、`channels/codex/**`、`.agents/**`、`injectable-skills/**`、Codex scripts。
- Plugin-owned baseline search / Guard / knowledge / module scan presentation，只要它们是 Codex-facing tool 或 embedded runtime compatibility 的实际消费路径。
- Governance / permission / constitution / SkillHooks，只要仍由 MCP / HTTP / embedded runtime 写操作消费。

### Alembic service request client

- `DaemonSupervisor`、`alembic_codex_dashboard` handoff、`alembic_codex_bootstrap/rescan/job` 的 daemon job 请求。
- `ResidentSearchClient` 对 `/api/v1/search` 的显式请求和 telemetry 保留。
- Dashboard URL handoff / host project alignment 的只读展示；Plugin 不切换 Alembic selected project，也不托管 Dashboard frontend。

### Portable compatibility

- `plugins/alembic-codex/runtime.tgz`、`plugins/alembic-codex/runtime/**`、`runtime/vendor/AlembicCore`、`.alembic-source.json`。
- `bin/daemon-server.ts` 与 `lib/http/**` 中为了 embedded runtime health/search/jobs/guard/knowledge/module compatibility 保留的 server surface。
- `file:vendor/AlembicCore` 是 portable runtime 例外，不得按普通 vendor 重复误删。

### AlembicCore / AlembicAgent / AlembicDashboard 边界

- Core：只承载共享、确定性、headless API。Plugin 当前消费 Core public/deep exports 仍需后续由 Core 证据统一判断，不在 Plugin GFBD-1 改。
- Agent：internal AI provider、agent runtime、tool runtime、memory/context/prompt/execution loop 均不属于 Plugin。Plugin 不得重新引入 `@alembic/agent`、`#agent/*`、`#tools/*` 或 `#external/ai/*`。
- Dashboard：frontend UI、API client、路由、样式、i18n、前端状态均不属于 Plugin。Plugin 只做 local daemon Dashboard URL handoff。

## 删除 / 下沉 / 不得移动候选

### 当前不建议直接删除

- `lib/external/mcp/**`：名称里有 `external`，但真实职责是 Codex MCP entrance + embedded MCP handler tree。
- `lib/codex/**`：Codex plugin runtime strategy / status / diagnostics / tool policy，自洽闭环必需。
- `lib/governance/**`：MCP / HTTP write gating 仍有真实消费方。
- `lib/http/routes/candidates.ts`：存在 `HOST_AI_MANAGED` 命名债，但仍是 fail-closed host-managed compatibility surface。
- `lib/service/module/ModuleService.ts`：注释仍有旧“AI scan”口径，但真实实现已 `hostManaged/noAi`，是后续文案 / 命名修正候选，不是本轮删除项。

### 后续删除或收敛候选

- `candidates` route `HOST_AI_MANAGED` surface：需要总控在 GFBD-2 归类为 host-managed compatibility、Alembic service request client 或删除候选；当前不具备直接删除条件。
- HTTP route 注释中“AI 扫描”旧文案：可在后续窄任务中收敛为 host-managed / noAi 语义。
- `SetupService.stepVectorIndex` 中 embedding provider 提示口径：与 `VectorModule` 的 `embedProvider: null` 边界存在表达不一致风险，后续可作为文案 / status 收敛项。
- 根包 `alembic-ai@0.2.0` 与 Alembic 主包身份重叠：当前是 artifact-only 历史身份，后续如要改名需另开发布 / cache / runtime artifact 计划。

### 可能下沉到 Core 的候选

- 仅当 Core / Alembic / Dashboard 也需要稳定消费时，`searchMeta` / resident search telemetry / runtime capability DTO 可考虑下沉为 public contract。
- `HOST_AI_MANAGED` / host-managed preview payload 若被 Dashboard 或 Alembic service 共同消费，可由总控另开 contract 收敛；当前 Plugin 不应自行下沉。

### 不得移动 / 不得删除

- `bin/codex-mcp.ts`、`lib/external/mcp/CodexMcpServer.ts`、`lib/external/mcp/tools.ts`、`lib/external/mcp/handlers/task.ts`。
- `lib/codex/runtime/RuntimeContext.ts`、`lib/codex/status/StatusService.ts`、`lib/codex/diagnostics/Diagnostics.ts`、`lib/codex/preflight/Preflight.ts`、`lib/codex/ToolPolicy.ts`、`lib/codex/ServiceRequestBoundary.ts`。
- `plugins/alembic-codex/**`、`channels/codex/**`、`.agents/plugins/marketplace.json`、Codex Skill files、wrapper、runtime artifact。
- `scripts/prepare-codex-plugin-runtime.mjs`、`scripts/verify-codex-plugin.mjs`、`scripts/verify-codex-channel.mjs`、`scripts/release-codex-plugin.mjs`、`scripts/verify-release-package-boundary.mjs`。
- Embedded runtime `vendor/AlembicCore` 和 `.alembic-source.json` portable exception。

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `git -C AlembicPlugin status --short` | 通过，无输出，产品仓库无未提交改动。 |
| `find lib -maxdepth 2 -type d` | 通过，确认当前主要目录为 `codex`、`external/mcp`、`governance`、`http`、`service`、`injection`、`daemon` 等；未出现 `lib/agent` / `lib/tools` / `lib/external/ai`。 |
| `find lib -type d -name agent -o -name tools -o -path 'lib/external/ai'` | 通过，无输出。 |
| `node scripts/report-agent-extraction-boundary.mjs --format json` | 通过，扫描 330 个 source files，agent / ai / tools boundary imports 均为 0。 |
| `rg -n "@alembic/agent\|#agent/\|#tools/\|#external/ai\|lib/agent\|lib/tools\|lib/external/ai" ...` | 通过；仅命中 `scripts/report-agent-extraction-boundary.mjs` 自身检测规则。 |
| `rg -n "api/v1/ai\|routes/ai\|discover-relations\|routes/recipes\|DashboardCompatibility\|dashboard\\.scan_project" ...` | 通过；仅命中 boundary test / compatibility 说明，旧源码 surface 未恢复。 |
| `rg -n "HOST_AI_MANAGED\|hostManaged\|refine-preview\|bootstrap-refine\|enrich" ...` | 通过；剩余命中集中在 `lib/http/routes/candidates.ts` 和 MCP candidate diagnostic tool，已列为后续分类候选。 |
| `rg -n "resolveCodexServiceRequestBoundary\|residentServiceRequested\|/api/v1/search\|normalizeResidentRequestMode" ...` | 通过，确认 service request client / resident search telemetry 路径。 |
| `rg -n "runtime.tgz\|file:vendor/AlembicCore\|\\.alembic-source\\.json\|portable-artifact" ...` | 通过，确认 portable runtime 例外仍有 release / verify / playbook 约束。 |

未运行 `npm test`、`npm run build`、`npm run prepare:codex-plugin-runtime`、plugin cache refresh 或真实项目测试；GFBD-P1-P 明确本轮只做证据采集和边界判断。

## 遗留风险

- `candidates` HTTP route 的 `HOST_AI_MANAGED` 语义仍需 GFBD-2 统一分类；目前不能证明可删。
- `ModuleService` / HTTP route 注释仍存在“AI scan”旧口径，真实实现已 noAi/hostManaged，但文案可能误导后续窗口。
- 根包 `alembic-ai@0.2.0` 与 Alembic 主包身份重叠仍是发布身份债；当前 guard 能阻止 root npm publish，但长期命名需总控另开发布线。
- Core deep imports 面广，本轮只记录 Plugin 消费事实，不能替 Core 下沉或 public API 收敛做结论。
- AlembicPlugin 既有 Biome lint 债未处理，按 GFBD 计划保留为独立质量线。
- Embedded runtime 中 `dist/**`、`vendor/AlembicCore/**` 看起来像重复代码，但属于 portable runtime artifact；后续清理必须避开这个例外。

## 下一步建议

- GFBD-2 总控整合时，将 AlembicPlugin 定义为 Codex host agent 入口和 Plugin-owned Codex-facing contract owner。
- 单独评估 `candidates` route：真实消费方、是否还需要 HTTP compatibility、是否迁为 Alembic service request 或删除。
- 单独收敛 HTTP/module/vector init 的 AI 旧文案，避免和 AlembicAgent / Alembic internal AI provider 混淆。
- 等 AlembicCore 回填后，再统一判断哪些 wire DTO / telemetry 能进入 Core public contract。
- 不创建 AlembicTest 复测单；本轮没有产品源码变化，也未触发真实项目验证。
