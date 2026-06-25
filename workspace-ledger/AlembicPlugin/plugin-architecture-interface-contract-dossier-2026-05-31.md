# Plugin Architecture Interface Contract Dossier

日期：2026-05-31
任务包：`PAIR-STAGE0-PLUGIN-P0`
窗口：`AlembicPlugin`
状态：Stage 0 只读 dossier

## 执行边界

本 dossier 只记录 AlembicPlugin 当前真实代码、插件分发包、MCP surface、resident adapter、embedded runtime compatibility 和跨仓库消费者关系。未修改 AlembicPlugin 产品源码、runtime bundle、submodule 指针、Alembic / AlembicCore / AlembicDashboard / AlembicTest / BiliDili，也未启动 automation。

用户追加裁决已作为后续实施约束吸收：旧入口可以直接删除；Plugin / embedded runtime 清理到最清晰明确、职责分明；Stage 0 之后尽量合成一个 implementation wave；如果真实消费者多于预期，允许调整删除顺序和实施顺序。该裁决不改变 Stage 0 的只读性质。

## 当前 git / submodule 状态

目标仓库 `AlembicPlugin` 当前 `git status --short` 只有：

```text
 m plugins/alembic-codex
```

子仓库状态：

```text
6ba0dd2ac090b87db470c08781f6982f5ff28279 plugins/alembic-codex (v0.1.1-62-g6ba0dd2)
e8e14b1cca54d358e8d1d6de3e6cfad40c70d7ac vendor/AlembicCore (heads/main-42-ge8e14b1)
```

`plugins/alembic-codex` 内部 dirty 分类为 packaged runtime artifact 变化：`runtime.tgz`、`runtime/dist/**`、`runtime/vendor/AlembicCore/dist/**` 和新增 runtime dist 目录。Stage 0 只记录该状态，不覆盖、不还原、不提交。

## PluginRuntimeContract

Codex host 直接消费的外层契约是：

- `plugins/alembic-codex/.mcp.json`：以 `node ./bin/alembic-codex-mcp-wrapper.mjs` 启动，设置 `ALEMBIC_CHANNEL_ID=codex`、`ALEMBIC_PLUGIN_HOST=codex`、`ALEMBIC_RUNTIME_MODE=plugin`、`ALEMBIC_CODEX_MCP_MODE=1`。
- `channels/codex/channel.json`：声明 marketplace `gxfn`、plugin `alembic-codex`、runtime package `alembic-codex-plugin-runtime`、artifact `plugins/alembic-codex/runtime.tgz`、binary `alembic-codex-mcp`。
- `package.json`：root package bin `alembic-codex-mcp -> dist/bin/codex-mcp.js`，files 包含 `.agents/plugins/marketplace.json`、`channels`、`dist`、`plugins`、`injectable-skills` 和 codex release/verify/smoke scripts。
- `scripts/prepare-codex-plugin-runtime.mjs`：硬要求 `dist/bin/codex-mcp.js`、`dist/bin/daemon-server.js`、`dist/lib/external/mcp/CodexMcpServer.js` 存在，并把 runtime package 写成 `@alembic/core: file:vendor/AlembicCore`。
- `scripts/verify-codex-plugin.mjs`：验证 `.mcp.json` wrapper、`runtime.tgz`、embedded runtime package、marketplace、skills、README、release playbook 和 required runtime files。
- `scripts/smoke-codex-plugin.mjs`：打包后检查 root package 与 embedded runtime 同时包含 `dist/bin/codex-mcp.js`、`dist/bin/daemon-server.js`、`dist/lib/external/mcp/CodexMcpServer.js`、wrapper、skills、marketplace 和 runtime package，并实际导入 runtime `CodexMcpServer`。

Stage 1+ 约束：

- `codex-mcp.js`、wrapper、`.mcp.json`、channel、marketplace、runtime.tgz、skills 和 verify/smoke 是 Codex host 启动面，不允许单独删除。
- `daemon-server.js` 当前仍是 prepare / verify / smoke required artifact；若要移除或改名，必须同阶段替换 `DaemonSupervisor` recovery path、prepare/verify/smoke expected files、release playbook 和 packaged runtime layout。
- 子仓库 dirty runtime bundle 必须先由后续 implementation wave 明确归属：若是上一轮未验收 packaged artifact，先刷新/提交；若是用户或其它窗口改动，不能覆盖。

## PluginToolSurfaceContract

当前 tool surface 分两层维护：

- Codex local tools：`lib/codex/ToolPolicy.ts` 的 `CODEX_LOCAL_TOOLS` 共 9 个，分别是 `alembic_codex_status`、`alembic_codex_diagnostics`、`alembic_codex_init`、`alembic_codex_dashboard`、`alembic_codex_bootstrap`、`alembic_codex_rescan`、`alembic_codex_job`、`alembic_codex_stop`、`alembic_codex_cleanup`。
- Embedded/core MCP tools：`lib/external/mcp/tools.ts` 的 `TOOLS` 共 20 个，分别是 `alembic_health`、`alembic_search`、`alembic_knowledge`、`alembic_structure`、`alembic_graph`、`alembic_call_context`、`alembic_guard`、`alembic_submit_knowledge`、`alembic_project_skill`、`alembic_skill`、`alembic_bootstrap`、`alembic_rescan`、`alembic_evolve`、`alembic_consolidate`、`alembic_dimension_complete`、`alembic_panorama`、`alembic_task`、`alembic_enrich_candidates`、`alembic_knowledge_lifecycle`。

当前问题：

- `tools.ts` 文件头仍写 “16 agent + 2 admin = 18 tools”，但真实 `TOOLS` 是 20 个，catalog 注释已漂移。
- `test/unit/KnowledgeAPI.test.ts` 仍有 `TOOLS.length === 19` 的旧断言口径；后续 tool catalog wave 必须同步修正或删除这种手写数量断言。
- annotations、gateway、schema、visibility gate、handler map 分散在 `tools.ts`、`ToolPolicy.ts`、`McpServer.ts` 和 tests 中。
- `alembic_project_skill` 是 Codex-facing Project Skill 新工具；`alembic_skill` 在 Plugin 中是 legacy compatibility alias，`ProjectSkillService` 也将其标为 `replacementFor: 'alembic_skill'`。

当前消费者：

- `CodexMcpServer` list tools 合并 `CODEX_LOCAL_TOOLS` 与 `TOOLS`，并受 knowledge state、ProjectScope resident availability、tier/admin gate 控制。
- `McpServer._resolveHandler()` 将 `alembic_project_skill` 路由到 `consolidatedProjectSkill`，将 `alembic_skill` 路由到 `consolidatedSkill`。
- `TOOL_GATEWAY_MAP` 对 `alembic_project_skill` 和 `alembic_skill` 写操作分别做 gateway mapping。
- `plugins/alembic-codex/skills/alembic/SKILL.md` 明确建议使用 `alembic_project_skill`，并说明 `alembic_skill` 只是 compatibility alias。
- `test/unit/CodexToolPolicy.test.ts` 当前证明 initialized-empty / resident ProjectScope empty 状态不暴露 `alembic_skill`，但 knowledge ready 状态仍暴露 `alembic_skill`。

Stage 1+ 约束：

- 建议建立单源 `PluginToolSurfaceCatalog`，统一 tool id、owner、input schema、annotation、tier/admin gate、knowledge gate、gateway、handler owner、resident route policy。
- 删除 Plugin `alembic_skill` alias 前，必须同阶段迁移 `tools.ts`、schemas、consolidated handler、ToolPolicy tests、Zod schema tests、skills、README、verify/smoke 文档检查。
- 不要把 Alembic resident 主体的 `alembic_skill` 问题混入 Plugin-only alias 删除。

## ResidentServiceConsumerContract

当前 Plugin resident client 是 `lib/service/resident/AlembicResidentServiceClient.ts` 单体 facade，公开方法包括：

- `probe()`：读取 daemon health / residentService。
- `resolveProjectScopeIdentity()`：调用或推导 ProjectScope identity。
- `search()` / `searchWithResult()`：消费 resident `/api/v1/search`。
- `startIntentEpisode()`、`latestIntentEpisode()`、`recentIntentEpisodes()`、`updateIntentEpisodeOutcome()`：消费 resident `/api/v1/intent-episodes`。
- `enqueueJob()` / `readJob()`：消费 resident `/api/v1/jobs` bootstrap / rescan / job status。
- `dashboard()`：消费 dashboard handoff。

当前 Plugin 内部消费者：

- `CodexMcpServer`：diagnostics、dashboard、job enqueue/read、ProjectScope identity、opportunistic evolution route gating。
- `StatusService` / `Diagnostics` / `HostProjectAlignment` / `EnhancementRoute`：status、diagnostics、ProjectScope alignment 和 runtime capability summary。
- `handlers/search.ts`：`alembic_search` 在需要时调用 resident semantic/vector search。
- `handlers/task.ts` + `PrimeSearchPipeline`：prime intent handoff、resident search、IntentEpisode start/latest/recent/outcome。
- `AppModule`：注册 `residentServiceClient` 并注入 `PrimeSearchPipeline`。

当前 Alembic producer 证据：

- `Alembic/lib/http/routes/daemon.ts` 返回 canonical `residentService`，同时仍返回 `runtimeBoundary`。
- `Alembic/lib/http/routes/search.ts` 暴露 `/api/v1/search`。
- `Alembic/lib/http/routes/jobs.ts` 暴露 `/api/v1/jobs` recoverable job links。
- `Alembic/lib/http/routes/project-scope.ts` 和 `HttpServer.ts` 暴露 `/api/v1/project-scope`。
- `Alembic/lib/http/routes/intent-episodes.ts` 暴露 start/read/latest/recent/updateOutcome。
- Alembic tests 覆盖 daemon health canonical residentService、ProjectScope、search telemetry、jobs 和 intent episode routes。

Stage 1+ 约束：

- 建议拆为 `ResidentProbeClient`、`ResidentProjectScopeClient`、`ResidentSearchClient`、`ResidentIntentEpisodeClient`、`ResidentJobClient`、`ResidentDashboardClient`。
- 允许短期 assembly facade 仅作为内部组装，不作为长期兼容 public entry。
- 删除 `runtimeBoundary` fallback 前，必须证明 Plugin status/dashboard/job/search/ProjectScope 所需 capability 均可从 `residentService` 或对应 endpoint 取得，并更新 `CodexEnhancementRoute` / `CodexModuleBoundary` tests。

## EmbeddedRuntimeCompatibilityContract

当前 embedded runtime compatibility 面包括：

- `lib/daemon/DaemonSupervisor.ts`：启动 compiled `dist/bin/daemon-server.js`，轮询 `/api/v1/daemon/health`，校验 project/data/schema identity。
- `bin/daemon-server.ts`：启动 HTTP server，标记 interrupted jobs，注册 `GitDiffCheckpointService`，写 daemon state，验证 health ready，处理 shutdown。
- `lib/http/HttpServer.ts`：注册完整 REST API：health、daemon、jobs、auth、project-scope、monitoring、guard、search、extract、commands、skills、candidates、modules、violations、knowledge、panorama、evolution、intent-episodes 等。
- `lib/injection/ServiceContainer.ts` / modules：仍初始化 infra、knowledge、vector、guard、panorama、evolution、project skill、resident client、prime search pipeline 等主体式模块。
- `lib/service/evolution/git-diff-checkpoint/**` 与 `PluginOpportunisticEvolution`：分别支撑 embedded checkpoint compatibility 和 Codex task close 后的一次性 git diff opportunistic surface。

当前判断：

- `daemon-server.js`、`HttpServer` 和 ServiceContainer 不是 AlembicPlugin 长期拥有 Alembic daemon / Dashboard / file monitor / internal AI 的证明；它们是 Codex packaged runtime / recoverable host-agent job / status diagnostics / smoke 的 compatibility 面。
- 当前 prepare / verify / smoke 仍硬依赖 `daemon-server.js` 和部分 runtime dist layout，因此 Stage 0 不能直接删除。
- `HttpServer` 目前挂载了超过 Plugin host recovery 可能需要的 route。后续可以按 consumer map 裁剪，但需要先把 required routes 写成 testable contract。

Stage 1+ 约束：

- 建议把 embedded runtime contract 收敛为：runtime start、health/status、recoverable bootstrap/rescan job、project-scope identity、search/intent episode support needed by prime/session flows、Project Skill/runtime skill refresh、packaged smoke。
- 可删除候选：Dashboard/frontend-like host routes、monitoring/auth/guard/report/extract/commands/modules/panorama/evolution 等未被 Codex packaged recovery 或 smoke 直接消费的主体式外观。但每项删除前必须有 route consumer scan、focused test、verify/smoke 更新。
- 不要把 long-lived file monitor 放回 Plugin；Plugin 只保留 embedded checkpoint compatibility 和 one-shot git diff opportunistic surface。

## CrossRepoConsumerMap

| Producer | Consumer | Current contract | Stage 1+ impact |
| --- | --- | --- | --- |
| AlembicPlugin plugin shell | Codex host | `.mcp.json` -> wrapper -> `runtime.tgz` -> `alembic-codex-mcp` -> `dist/bin/codex-mcp.js` | 外部启动契约必须稳定；改名必须同步 channel/marketplace/verify/smoke/docs。 |
| AlembicPlugin root package | Plugin release/smoke | `prepare-codex-plugin-runtime`、`verify-codex-plugin`、`smoke-codex-plugin` | runtime required file list 是删除 `daemon-server.js` / `CodexMcpServer` 的前置门。 |
| AlembicCore | AlembicPlugin | `@alembic/core` public contracts：daemon/resident service, ProjectScope, host-agent workflows, RecipeProductionGateway, SourceRefs | Plugin 只能消费 public contracts；不能复制 Core 实现或绕过 package entry。 |
| Alembic resident daemon | AlembicPlugin | `/api/v1/daemon/health` `residentService`、`/search`、`/jobs`、`/project-scope`、`/intent-episodes` | resident clients 可拆分；runtimeBoundary fallback 可作为删除候选。 |
| Alembic daemon | AlembicDashboard | Dashboard 直接请求 `/api/v1/*`，读取 daemon health/runtimeBoundary/project-scope | Plugin 重构不应派 Dashboard；除非 Alembic daemon contract 变化。 |
| AlembicPlugin skills | Codex user / Codex host | `plugins/alembic-codex/skills/*/SKILL.md`，特别是 `alembic` skill 对 `alembic_project_skill` 的推荐 | 删除 `alembic_skill` alias 必须同步 skill 文案和 installed runtime artifact。 |
| AlembicPlugin acceptance tests | 总控 / release | `verify:codex-plugin`、`smoke:codex-plugin`、`verify:codex-session`、focused unit tests | 后续合并 wave 必须把 test set 与每个删除动作绑定。 |

## Import / Responsibility Graph 摘要

- `bin/codex-mcp.ts` 是 shim，动态导入 `CodexMcpServer` 并设置 MCP mode / timer shutdown。
- `CodexMcpServer` 是 Codex-facing outer router：list/call、projectRoot scoped server、preflight/auto-init、local tools、resident jobs/dashboard、embedded `McpServer` executor、opportunistic evolution attachment。
- `McpServer` 是 embedded V3 handler executor：`TOOLS` list/call、handler registry、gateway mapping、session/intent tracking、response envelope。
- `ToolPolicy` 是 Codex visibility / knowledge gate / tier gate 输入，但不是完整 catalog 单源。
- `ServiceRequestBoundary` 声明所有 Codex-facing MCP tools 仍由 Plugin owned，resident service 只通过显式 API 被请求；当前 resident-request tools 为 `alembic_search`、`alembic_codex_dashboard`、`alembic_codex_bootstrap`、`alembic_codex_rescan`、`alembic_codex_job`。
- `ProjectSkillService` + `ProjectSkillDelivery` 是当前最清晰的目标结构样板：service、receipt、authorization、runtime export、managed marker 分层明确。
- `PluginOpportunisticEvolution` 是 Plugin-only task close fallback surface；`GitDiffCheckpointService` 是 embedded daemon checkpoint compatibility，二者命名和目录应继续分清。

## Focused Test Set

后续 implementation wave 至少绑定以下测试面：

- Tool surface：`test/unit/CodexToolPolicy.test.ts`、`test/unit/CodexMcpServer.test.ts`、`test/integration/ZodSchemas.test.ts`、`test/integration/ZodToMcpSchema.test.ts`。
- Boundary：`test/unit/CodexServiceRequestBoundary.test.ts`、`test/unit/CodexModuleBoundary.test.ts`、`test/unit/PluginHttpSurfaceBoundary.test.ts`。
- Resident service：`test/unit/AlembicResidentServiceClient.test.ts`、`test/unit/SearchHandlerResidentSearch.test.ts`、`test/unit/PrimeSearchPipelineResidentSearch.test.ts`、`test/unit/CodexStatusService.test.ts`、`test/unit/CodexEnhancementRoute.test.ts`。
- Prime / intent / source refs：`test/unit/TaskPrimeKnowledgeMaterial.test.ts`、`test/unit/PrimeSearchPipelineResidentSearch.test.ts`、真实 session pack checker。
- Project Skill：`test/unit/ProjectSkillService.test.ts`、`test/unit/ProjectSkillDelivery.test.ts`。
- Opportunistic evolution：`test/unit/PluginOpportunisticEvolution.test.ts`。
- Runtime package：`npm run build:check`、`npm run lint:repo-boundary`、`npm run verify:codex-plugin`、`npm run smoke:codex-plugin` when runtime package changes、`npm run verify:codex-session` when tool/session behavior changes。

## Stage 1+ 合并 implementation wave 建议

建议尽量合成一个 implementation wave，但内部按以下顺序提交或至少按以下顺序验证：

1. Tool surface catalog + `alembic_skill` alias deletion
   - 建立单源 catalog，覆盖 Codex local tools + embedded/core tools + annotations + gateway + handler owner。
   - 删除 Plugin `alembic_skill` alias，迁移 schemas、handler、policy tests、skills、README、verify/smoke。
   - 前置验证：tool list snapshots、Zod schemas、CodexToolPolicy initialized/ready 场景。

2. Codex execution router decomposition
   - 从 `CodexMcpServer` 拆出 projectRoot scope、preflight/auto-init、local tool dispatcher、resident job/dashboard router、embedded executor、evolution surface presenter。
   - 不改变保留工具的 external names / input / output。
   - 前置验证：CodexMcpServer focused tests、ServiceRequestBoundary、verify codex plugin。

3. Resident adapter capability clients + runtimeBoundary fallback deletion
   - 拆 resident probe/project-scope/search/intent/jobs/dashboard clients。
   - 删除 Plugin `runtimeBoundary` fallback，以 `residentService` canonical capability 为准。
   - 前置验证：Alembic residentService producer tests 已存在；Plugin resident/search/status/diagnostics tests 更新。

4. Prime / intent package presenter cleanup
   - 拆 intake、search orchestration、injection package builder、visible receipt presenter、IntentEpisode handoff client。
   - 保留 sourceRefs / evidenceRefs / relation / vector / telemetry。
   - 前置验证：prime material、resident search、session scenario evidence checker。

5. Embedded runtime compatibility pruning
   - 基于本 dossier 定义 required route contract，裁剪不被 Plugin packaged recovery / smoke 消费的主体式 HTTP / ServiceContainer 外观。
   - `daemon-server.js` 若保留，应命名和文档明确为 plugin embedded compatibility；若删除，必须先替换 `DaemonSupervisor` recovery path 和 runtime smoke contract。
   - 前置验证：prepare runtime、verify codex plugin、smoke codex plugin、release playbook checks。

## 直接删除清单与前置条件

| 删除候选 | 可以直接删除的含义 | 前置迁移 / 验证条件 |
| --- | --- | --- |
| Plugin `alembic_skill` alias | 从 Plugin Codex-facing tool surface 移除 legacy alias | 迁移 `tools.ts`、schema、handler map、gateway、skills、README、CodexToolPolicy/Zod/CodexMcpServer tests；确认 Alembic resident `alembic_skill` 不在本波误删。 |
| `runtimeBoundary` fallback | Plugin 不再用旧 health payload fallback 作为 capability source | Alembic `residentService` 覆盖 status/search/jobs/dashboard/project-scope；更新 `EnhancementRoute`、`HostProjectAlignment`、`ModuleBoundary` tests。 |
| `ALEMBIC_CHANNEL` fallback | 只保留 `ALEMBIC_CHANNEL_ID` | 同步 `.mcp.json`、RuntimeContext、docs、tests、verify scripts。 |
| 分散 tool catalog 注释 /重复 map | 删除漂移注释和重复事实源 | 新 catalog 成为单源，mechanical tests 覆盖 count/name/annotations/gateway/handler。 |
| Resident facade public usage | 调用方改用 capability clients | facade 仅短期内部 assembly；search/task/status/dashboard/job 调用方迁移并有 focused tests。 |
| Embedded HTTP 主体式多余 routes | 从 packaged runtime 中裁掉非 Plugin recovery/smoke 必需 route | route consumer scan + Plugin runtime contract tests + prepare/verify/smoke 同步通过。 |

## 遗留风险

- `plugins/alembic-codex` 子仓库 dirty runtime artifact 可能来自上一轮 packaged cache 刷新或其它窗口，后续 implementation wave 前必须确认是否提交、刷新或忽略；Stage 0 未处理。
- `rg` 证明 Dashboard 不消费 Plugin API，但 Dashboard 仍直接消费 daemon `runtimeBoundary`；删除 Plugin fallback 不等于删除 Alembic daemon / Dashboard runtimeBoundary。
- Tool surface 删除 alias 会影响用户可见 MCP tool list，必须在 implementation wave 中同步 skills/docs/tests，不能只改 TS handler。
- Embedded HTTP / ServiceContainer 裁剪风险最大；现有 prepare/verify/smoke 把 `daemon-server.js` 视为 required artifact，必须先改 runtime contract。

## 实际命令摘要

```text
sed -n '1,320p' AGENTS.md
sed -n '1,260p' AlembicPlugin/AGENTS.md
sed -n '1,260p' codex-control-workspace/.wakeflow-active/index.md
sed -n '1,320p' codex-control-workspace/.wakeflow-active/current/plugin-architecture-interface-refactor-workspace-plan-2026-05-31.md
sed -n '1,260p' codex-control-workspace/.wakeflow-active/current/workspace-current-status.md
sed -n '1,420p' AlembicDesign/docs/current/plugin-architecture-interface-refactor-*.md
git status --short
git submodule status
git -C plugins/alembic-codex status --short
rg -n "alembic_skill|alembic_project_skill|CODEX_LOCAL_TOOLS|TOOLS|runtimeBoundary|residentService|daemon-server|prepare-codex-plugin-runtime|smoke-codex-plugin|verify-codex-plugin" .
git diff --check
rg -n "name: 'alembic_|name: \"alembic_" lib/external/mcp/tools.ts lib/codex/ToolPolicy.ts
rg -n "search\\(|resolveProjectScopeIdentity|startIntentEpisode|latestIntentEpisode|recentIntentEpisodes|updateIntentEpisodeOutcome|enqueueJob|readJob|dashboard\\(" lib/service/resident/AlembicResidentServiceClient.ts lib/external/mcp/handlers/search.ts lib/external/mcp/handlers/task.ts lib/codex/status/StatusService.ts lib/codex/diagnostics/Diagnostics.ts
rg --files test | rg "(Codex|Resident|ProjectSkill|Prime|Plugin|ServiceRequest|ModuleBoundary|HttpSurface|Session|Zod|RecipeLoop|Acceptance|Opportunistic|ToolPolicy)"
rg -n "residentService|runtimeBoundary|project-scope|intent-episodes|/api/v1/search|/api/v1/jobs|/api/v1/daemon/health" ../Alembic/lib ../Alembic/test
rg -n "runtimeBoundary|residentService|project-scope|/api/v1|AlembicPlugin|alembic-codex" ../AlembicDashboard/src
rg -n "Core Codex boundary|residentService|ProjectScope|RecipeProductionGateway|SourceRef|host-agent" ../AlembicCore/src ../AlembicCore/test
```

`git diff --check` 在 AlembicPlugin 产品仓库内无输出，表示当前产品仓库 diff whitespace check 未发现问题。
