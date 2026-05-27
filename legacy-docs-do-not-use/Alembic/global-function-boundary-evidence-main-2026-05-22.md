# Alembic GFBD-1 Main Repository Function Boundary Evidence

日期：2026-05-22
窗口：Alembic
来源计划：`docs/workspace/global-function-boundary-design-workspace-plan-2026-05-22.md`
任务包：GFBD-P1-A
状态：已回填，待总控整合

## 完成范围

本轮只做真实代码挖掘和职责边界判断，未修改 Alembic 产品源码，未移动目录，未删除兼容层，未运行真实项目测试。

已完成的证据采集范围：

- 读取 `Alembic/AGENTS.md`，确认主仓库定位、文档保存位置、Core / Agent 接入规则和不得移动能力。
- 扫描 `package.json` 的发布身份、bin、imports、scripts、依赖和 npm files。
- 扫描 `lib/`、`bin/`、`scripts/`、`config/`、`.github/workflows`、`test/` 中的 Core / Agent / Dashboard / Plugin 交界。
- 复核 CLI、daemon、HTTP server、Dashboard 托管、ProjectRuntimeControl、release staging、Core source resolver、AgentModule、ToolContextFactory、resident search 和 MCP handler/tool 定义。
- 回填职责边界、删除 / 下沉 / 不得移动候选、验证命令和遗留风险。

## 关键代码证据

### 发布身份和本地增强底座

- `package.json:2-6`：Alembic 主仓库发布身份是 `alembic-ai@0.2.0`，`main` 指向 `dist/lib/bootstrap.js`。
- `package.json:60-96`：主仓库拥有 build、Core build bridge、Dashboard build、daemon start、dev link、release staging、repo boundary lint 等本地增强底座脚本。
- `package.json:100-101`：用户 CLI bin 是 `alembic -> dist/bin/cli.js`。
- `package.json:125-127`：开发态依赖 `@alembic/agent: file:../AlembicAgent` 和 `@alembic/core: file:../AlembicCore`，说明主仓库是 consumer / host，不是 Core 或 Agent 内部实现仓库。
- `package.json:151-160`：npm files 包含 `dist`、`config`、`injectable-skills`、`templates`、`dashboard/dist`、`resources/openChrome.applescript`，这些是 Alembic install enhances 的本地交付面。

### Bootstrap / governance / 数据和 PathGuard

- `lib/bootstrap.ts:1-16`：Bootstrap 消费 `@alembic/core/database`、`@alembic/core/io`、`@alembic/core/search`、`@alembic/core/workspace`，同时拥有本地 `governance`、audit、config、skill hooks 和 package assets。
- `lib/bootstrap.ts:51-69`：主仓库负责配置 PathGuard，包含 projectRoot、packageRoot、knowledgeBaseDir 和 `.env` 写入例外，这属于本地宿主写入边界，不应下沉到 Dashboard 或 Plugin。
- `lib/bootstrap.ts:71-122`：初始化顺序是 runtime settings、WorkspaceResolver、配置、日志、数据库、constitution、核心组件、gateway；这是 daemon / CLI / HTTP 的共享启动闭环。
- `lib/bootstrap.ts:160-169`：数据库连接和迁移由主仓库 Bootstrap 驱动，底层 DatabaseConnection 来自 Core，但运行时生命周期属于 Alembic。

### Daemon / HTTP / Dashboard server

- `bin/daemon-server.ts:3-4`：daemon 进程设置 `ALEMBIC_API_SERVER` 和 `ALEMBIC_DAEMON_MODE`，是本地常驻服务入口。
- `bin/daemon-server.ts:11-18`：daemon 状态 schema、daemon paths 和 package version 来自 `@alembic/core/daemon`，事件和日志来自 Core；主仓库负责启动和写入本地运行状态。
- `bin/daemon-server.ts:64-78`：daemon 配置 PathGuard、初始化 Bootstrap，再初始化 ServiceContainer。
- `bin/daemon-server.ts:95-119`：daemon 启动 HTTP server、file change collector、Dashboard mount、readiness verification，然后写 daemon state。
- `bin/daemon-server.ts:250-260`：Dashboard 托管只消费 `dashboard/dist`，不存在时降级为 API-only；Dashboard 源码不在主仓库内重新实现。
- `lib/http/HttpServer.ts:1-25`：HTTP server 使用 Express、Helmet、CORS、监控、缓存、Realtime、Gateway middleware 和 role resolver，是 Alembic 主仓库平台能力。
- `lib/http/HttpServer.ts:26-52`、`lib/http/HttpServer.ts:263-359`：主仓库注册 27 个 HTTP route 文件，覆盖 health、daemon、jobs、projects、guard、search、ai、commands、skills、knowledge、wiki、panorama、evolution、file changes、signals、audit、logs 等 Dashboard / CLI / external host 可消费 API。
- `lib/http/HttpServer.ts:500-560`：HTTP server 生命周期和 realtime shutdown 也在主仓库内维护。

### Agent / Core 交界

- 生产代码 / 脚本 / config 中 `@alembic/core` 命中文件数：123；`@alembic/agent` 命中文件数：49。主仓库是高密度 consumer 和 host adapter。
- `scripts/core-source-command.mjs:15-22` 和 `scripts/workspace-source.mjs:6-23`：本地开发优先解析 `../AlembicCore`，fallback 到 `vendor/AlembicCore`，用于 build 和 consumer import lint；这是 source resolver，不是 Core 实现复制。
- `config/core-import-boundary.json`：记录 Core import allowlist 和 frozen occurrences，说明 Core public / deep import 仍需边界治理，不应在本轮顺手收紧。
- `lib/injection/modules/AgentModule.ts:8-27`：主仓库消费 `@alembic/agent/forge`、`service`、`tools`、`tools/terminal`、`tools/v2`，同时消费 `@alembic/core/events`、`@alembic/core/workspace`。
- `lib/injection/modules/AgentModule.ts:77-107`：`toolRegistry` 注册 Dashboard / Terminal / Skill / Mac host adapters，这是 Alembic host-owned tool adapter，不属于 Agent portable runtime。
- `lib/injection/modules/AgentModule.ts:151-173`：AgentRuntimeBuilder / AgentService 来自 `@alembic/agent/service`，但 projectRoot、dataRoot、AI provider、toolRegistry 和 toolRouter 由 Alembic DI 提供。
- `lib/tools/v2/adapter/ToolContextFactory.ts:1-16`：ToolContextFactory 复用 Agent V2 的 DeltaCache / SearchCache / OutputCompressor / ToolContext 类型。
- `lib/tools/v2/adapter/ToolContextFactory.ts:54-97`：SandboxExecutorBridge 延迟加载 Alembic 本地 sandbox；sandbox 执行边界应留在主仓库。
- `lib/tools/v2/adapter/ToolContextFactory.ts:127-152`：每次工具调用把 Alembic DI 中的 projectGraph、searchEngine、recipeGateway、knowledgeRepo、evolutionGateway、astAnalyzer、sandboxExecutor 注入 Agent ToolContext，主仓库是 host context producer。

### Resident service / search / vector telemetry

- `lib/http/routes/search.ts:1-19`：`/api/v1/search` 是 Alembic resident service HTTP route，消费 Core `SearchResponse` / workspace identity，并由主仓库 Express 暴露。
- `lib/http/routes/search.ts:111-143`：搜索优先调用 DI 中的 `searchEngine.search()`，然后构造 resident service `searchMeta` 返回给 HTTP consumer。
- `lib/http/routes/search.ts:150-180`：SearchEngine 不可用时使用 knowledgeService / guardService legacy fallback，属于本地服务降级，不应下沉到 Dashboard 或 Plugin。
- `lib/http/routes/search.ts:223-274`：resident search telemetry 明确把 Core `SearchResponse.searchMeta` 作为 semantic/vector 使用事实源，Alembic 只补 HTTP/workspace/vector-index 观测信息。

### MCP handler / Plugin 边界

- `lib/external/mcp` 当前有 22 个文件；其中 `lib/external/mcp/tools.ts:1-18` 仍保存 Alembic tool definition / schema / annotations / gateway map。
- `lib/external/mcp/tools.ts:151-169` 和 `lib/external/mcp/tools.ts:252-497` 定义 `alembic_health`、`alembic_search`、`alembic_submit_knowledge`、`alembic_bootstrap`、`alembic_rescan`、`alembic_task` 等 Alembic tool surface。
- 但当前主仓库没有 `alembic-codex-mcp` bin，也没有 Codex channel / marketplace artifact；`bin/cli.ts`、`lib/daemon/DaemonJobRunner.ts`、`lib/http/routes/task.ts`、`lib/http/routes/candidates.ts` 复用这些 handler 执行本地 bootstrap/rescan/task/candidate 路径。
- 边界判断：`lib/external/mcp` 在 Alembic 主仓库中应暂时归类为 “Alembic service handler / schema legacy name”，不是 Codex plugin 发布入口。可后续重命名或下沉一部分 schema，但不得在没有替代 HTTP / daemon / CLI 调用链前删除。

### Dashboard 交界

- `bin/cli.ts:2329-2389`：`alembic start --dev` 优先查找 workspace Dashboard 源仓库，或 fallback 到 `dashboard/dist` 静态产物；如果两者都不存在，提示运行 `npm run build:dashboard`。
- `bin/daemon-server.ts:250-260`：daemon 运行态只托管 `dashboard/dist`，不存在时 API-only，说明 Dashboard UI 实现属于 AlembicDashboard，Alembic 只负责托管和 handoff。
- `.github/workflows/ci.yml` 与 `.github/workflows/release.yml` 会 checkout / build AlembicDashboard，并把 Dashboard 作为 Alembic 发布链路的一部分，属于主仓库 release/install integration。

### Release staging / 发布边界

- `scripts/prepare-publish-staging.mjs:7-24`：主仓库发布 staging 目录是 `.release/alembic-ai`，并读取 sibling AlembicCore / AlembicAgent / AlembicDashboard package versions。
- `scripts/prepare-publish-staging.mjs:59-73`：开发 manifest 必须保留 `file:../` workspace dependency；staging 时替换为 registry version。
- `scripts/prepare-publish-staging.mjs:76-83`：staging 只允许写在仓库内部。
- `scripts/prepare-publish-staging.mjs:86-111`：staging package 会复制 package files，并加入 `alembic-release-source.json`。

## 职责边界判断

### Alembic 主仓库应拥有

- CLI 用户入口、daemon 进程、HTTP/API server、Dashboard server / static hosting、Realtime、ProjectRuntimeControl、daemon state handoff。
- 本地 ProjectRegistry / workspace resolver / dataRoot / runtime-control 状态消费和运行时切换。
- Bootstrap、PathGuard 配置、数据库连接生命周期、config / env / settings 加载、日志、审计、监控、cache、file monitor 和 shutdown。
- Host-owned governance：constitution、permission、gateway action registry。
- Alembic resident service API，包括 search telemetry、jobs、projects、guard、AI settings、knowledge lifecycle、panorama、signals、logs、skills。
- Internal AI / Agent 的宿主装配：AI config、provider injection、AgentModule DI、ToolContextFactory、host tool adapters、sandbox bridge。
- Release staging / npm package guard / Dashboard dist integration / dev link / local install enhancement。

### 应留在 AlembicCore

- 共享 deterministic/headless 能力：database primitive、workspace/path helpers、daemon state schema、search core、guard engine、knowledge domain/repository/service primitives、project intelligence、events/logging/io。
- 当前 Alembic 主仓库大量消费 Core public and transitional deep subpaths；新的下沉必须先由 Core export policy 和 consumer import lint 放行。

### 应留在 AlembicAgent

- AI provider execution、model registry、LLM gateway、Agent runtime、Agent service、prompts、memory/context/domain、portable tool contracts、ToolForge、Tool V2 generic catalog/router/cache/compressor。
- Alembic 主仓库只保留 AI config persistence、DI、runtime handoff、host tool adapters、sandbox、Dashboard/Mac/Skill/Terminal/Workflow bridge。

### 应留在 AlembicDashboard

- React/Vite UI、API client、hooks、front-end state、routing、visualization、i18n 和前端测试。
- Alembic 主仓库只保留 Dashboard dev source resolver、static dist hosting、release build/staging integration。

### 应留在 AlembicPlugin

- Codex MCP server、Codex skill/channel/cache/runtime artifact、Plugin first host agent entry、Codex-facing response shaping、portable no-Alembic minimum path、resident service request client。
- Alembic 主仓库不应重新引入 Codex marketplace/channel/plugin shell。

## 删除 / 下沉 / 不得移动候选

### 删除候选（仅候选，需后续单独验证）

- `lib/external/mcp` 命名可能已不准确：如果所有 Codex-facing MCP server 已稳定归属 AlembicPlugin，主仓库可后续考虑把仍被 HTTP / daemon / CLI 复用的 handler/schema 改名为 `lib/service/agent-tools` 或 `lib/service/host-tools`。本轮不得删除。
- 历史 MCP tool schema 中的 admin / agent 分层口径可由总控和 Plugin 共同判断是否拆出 shared schema 或转为 HTTP-native schema。需要先扫描所有 `lib/external/mcp/*` consumer。
- `config/core-import-boundary.json` 中 deep Core subpath allowlist 是技术债；不是删除对象，后续可作为 Core public API 收敛任务候选。

### 下沉候选（必须有多消费者和稳定 API）

- HTTP request schemas 中若与 Plugin / Dashboard 共同消费，可评估下沉到 Core 或专门 shared contract 包；当前没有本轮证据支持直接下沉。
- Resident search telemetry 类型中 Core searchMeta 已是事实源；Alembic 补充的 HTTP/workspace/vector 观测不应下沉，除非 Dashboard / Plugin 共同要求统一 contract。
- ToolContext 中 portable fields 已来自 Agent；Alembic-only DI/sandbox/projectRoot bridge 不下沉。

### 不得移动 / 不得删除

- `bin/cli.ts`、`bin/daemon-server.ts`、`lib/daemon/**`、`lib/http/**`、`lib/injection/**`、`lib/platform/**`、`lib/sandbox/**`、`lib/service/**`、`lib/tools/adapters/**`、`lib/governance/**`。
- `dashboard/dist`、`injectable-skills/`、`templates/`、`resources/`、`.release/`、`vendor/AlembicCore`、release staging scripts 和 workspace source resolver。
- `scripts/core-source-command.mjs`、`scripts/workspace-source.mjs`、`scripts/prepare-publish-staging.mjs`，因为它们承载 local source / vendor fallback / publish staging 交付闭环。
- `lib/external/mcp/**` 在没有替代调用链前不得删除；当前仍被 CLI、daemon jobs、HTTP routes 和 tests 消费。

## 验证命令与结果

- `git -C Alembic status --short`：通过；Alembic 产品仓库无未提交改动。
- `sed -n '1,260p' docs/workspace/global-function-boundary-design-workspace-plan-2026-05-22.md`：通过；确认 GFBD-P1-A 范围和禁止事项。
- `sed -n '1,220p' Alembic/AGENTS.md`：通过；确认主仓库规则。
- `sed -n '1,260p' package.json`：通过；确认 package identity、scripts、dependencies、files。
- `find lib -maxdepth 2 -type d | sort`：通过；确认主源码目录层级。
- `rg -l "@alembic/core" lib bin scripts config | wc -l`：输出 `123`。
- `rg -l "@alembic/agent" lib bin scripts config | wc -l`：输出 `49`。
- `find lib/http/routes -maxdepth 1 -type f | wc -l`：输出 `27`。
- `find lib/external/mcp -type f | wc -l`：输出 `22`。
- `rg -n "@alembic/core|@alembic/agent|AlembicDashboard|vendor/AlembicCore|dashboard/dist|\\.release|ProjectRegistry|JobStore|Daemon|HttpServer" lib bin scripts package.json config test .github/workflows`：通过；用于交界证据采集。
- `rg -n "lib/external/mcp|external/mcp|alembic_" lib bin scripts test package.json`：通过；用于 MCP handler 真实消费方扫描。
- `git -C Alembic diff --check`：通过；本轮未改 Alembic 产品源码。

## 遗留风险

- 本轮只做证据采集，没有运行 build / unit / lint / real project smoke；符合 GFBD-1 禁止事项，但不能作为功能行为验收。
- `lib/external/mcp` 命名与当前 Plugin-first 边界存在口径风险；它不是 Codex plugin shell，但仍有本地调用方，后续需要单独清理命名或 schema ownership。
- `@alembic/core` deep import 面仍大，Core public API 收敛需单独 wave；不能由 Alembic 主仓库单边修改。
- `@alembic/agent` consumer 面也大，但当前代码已经通过 public subpaths 消费；后续应避免把 Agent runtime 复制回 Alembic 主仓库。
- Alembic 与 AlembicPlugin 都使用 `alembic-ai@0.2.0` 作为 package 身份的历史重叠，需要总控在长期职责契约中明确 npm 发布物、Codex runtime artifact 和开发入口的命名边界。

## 下一步建议

- 总控 GFBD-2 整合时，将 Alembic 主仓库定义为本地增强底座和 resident service owner，而不是 Codex plugin owner 或 Core/Agent 实现仓库。
- 针对 `lib/external/mcp` 另开窄任务：先列出所有调用方，再决定是保留 legacy name、重命名为 service handler，还是拆出 shared schemas；不得直接删除。
- 针对 `config/core-import-boundary.json` 和 Core deep imports 另开 Core public API 收敛任务，避免在职责文档阶段制造破坏性 import churn。
- 针对既有 `lint:repo-boundary` DB boundary 债另开质量线，不混入 GFBD 职责边界设计。
