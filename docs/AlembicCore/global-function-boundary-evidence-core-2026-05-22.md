# AlembicCore Global Function Boundary Evidence

日期：2026-05-22
窗口：AlembicCore
任务包：GFBD-P1-C
状态：待总控验收
对应计划：../workspace/global-function-boundary-design-workspace-plan-2026-05-22.md

## 完成范围

本轮已按 AlembicCore 窗口身份重新执行 GFBD-P1-C。完成范围包括：

- 读取 `AlembicCore/AGENTS.md`，确认 Core 是 `@alembic/core` 的共享、确定性、可复用、可运行 Headless 内核仓库，不是 Agent、Plugin、CLI 或 Dashboard 仓库。
- 扫描 `package.json`、`config/public-api-boundary.json`、`scripts/check-public-api-boundary.mjs`、`scripts/lint-consumer-core-imports.mjs`、`scripts/smoke-public-api.mjs` 和 `scripts/check-release-readiness.mjs`。
- 扫描 `src/` 分层、根 facade、workspace / daemon / host-agent-workflows / search / vector / database / repositories 入口、AST grammar 资源和边界测试。
- 扫描 Alembic、AlembicAgent、AlembicPlugin、AlembicDashboard 对 `@alembic/core` 的消费边界。

明确未做：

- 未修改 AlembicCore 产品源码。
- 未调整 `package.json` public exports。
- 未迁移源码目录。
- 未收紧 API 或删除 wildcard / deep exports。
- 未运行真实项目测试。

## 关键代码证据

### 包身份与发布面

- `package.json` 声明 `@alembic/core@0.2.0`，`main` 为 `dist/index.js`，`types` 为 `dist/index.d.ts`。
- package `files` 包含 `dist`、`resources`、`config/public-api-boundary.json`、public API boundary 脚本、release readiness 脚本、`RELEASE-PLAYBOOK.md` 和 `README.md`。
- `scripts/check-release-readiness.mjs` 要求 npm pack dry-run 中存在 `package/config/public-api-boundary.json`、`package/dist/index.js`、`package/dist/index.d.ts`、`package/resources/grammars/tree-sitter-typescript.wasm` 和 public API boundary 脚本，说明 Core 的交付物包括确定性内核、资源和 API 治理工具，不是运行时壳。

### Public API 边界

- `package.json` 当前有 136 个 exports：75 个 exact exports，61 个 wildcard exports。
- `config/public-api-boundary.json` 将 public API 分为 `stable-public=17`、`provisional-public=21`、`transitional-internal=98`。
- stable public exports 是：`.`、`./daemon`、`./database`、`./dimensions`、`./events`、`./evolution`、`./guard`、`./host-agent-workflows`、`./io`、`./knowledge`、`./logging`、`./memory`、`./project-intelligence`、`./repositories`、`./search`、`./vector`、`./workspace`。
- policy 描述明确写明：exact stable / provisional exports 是有意保留的公共面，wildcard exports 是 migration-only。
- closeout 分类中，`./core/ast`、database drizzle / migrations、repository base / bootstrap / code / sync 等被列为 `must-keep-transitional`，说明这些 deep exports 是迁移期债务，但当前仍有消费方或兼容原因，不能直接删除。
- `scripts/check-public-api-boundary.mjs` 会拒绝未分类 exports、非 transitional wildcard、计数增长和 closeout 分类错误。
- `scripts/lint-consumer-core-imports.mjs` 用于扫描外层仓库 `@alembic/core` imports，默认允许 stable facade，阻止新增 transitional deep imports，支持现有 allowlist 和 adapter path。
- `scripts/smoke-public-api.mjs` 会 import 所有 exact public API entrypoints，并校验 root / config / daemon / search / vector / guard / shared / types 等关键导出。

### 根入口与 Facade

- `src/index.ts` 不是薄空壳；它导出 `core`、`daemon`、`domain`、`infrastructure`、`service`、`shared`，并显式导出 `createExternalWorkflowSession`、`KnowledgeRepositoryImpl` 和 `ProjectIntelligenceCapability`。
- `src/index.ts` 的中文注释说明阶段 14 后根入口只暴露外层收敛需要的稳定契约，避免内部重复类型通过 `export *` 撞名。
- `src/workspace.ts` 稳定导出 folder names、ProjectMarkers、ProjectRegistry、WorkspaceResolver 和 project root / data root 解析能力，属于跨仓库项目身份和 workspace 定位 contract。
- `src/database.ts` 稳定导出 `DatabaseConnection`、SQLite / Drizzle handle 类型、`openAlembicDatabase()` 和 database handle assertion。
- `src/repositories.ts` 稳定导出 Knowledge、CodeEntity、Bootstrap、GuardViolation、Memory、Session、Proposal、Warning、LifecycleEvent、SourceRef repository bundle factory。
- `src/search.ts` 稳定导出 BM25、hybrid retrieval、ranker、search response meta、raw DB adapter、similarity helpers 和 `createSearchEngine()`。
- `src/vector.ts` 稳定导出 local vector store / HNSW / JSON adapter / chunking / indexing / vector service，并用注释明确 embedding provider 只是注入契约，具体模型、API key、限流和重试策略属于宿主仓库。

### AST Grammar 与 Project Intelligence

- `resources/grammars/` 包含 Dart、Go、Java、JavaScript、Kotlin、Objective-C、Python、Rust、Swift、TSX、TypeScript 的 tree-sitter wasm。
- `src/core/ast/ensure-grammars.ts` 明确迁移到 web-tree-sitter WASM 后不再运行时 npm install，所有 `.wasm` 文件随包发布在 `resources/grammars/`，旧接口保留为兼容检查。
- `src/core/discovery`、`src/core/analysis`、`src/core/enhancement`、`src/service/panorama`、`src/workflows/capabilities/project-intelligence` 和 `src/project-intelligence.ts` 共同组成确定性的项目扫描、识别、分析、全景和 project intelligence 能力。

### Host Agent Workflow Contract

- `src/host-agent-workflows.ts` 的文件注释明确：Core 稳定的是宿主 agent 领取任务、提交证据、完成维度、恢复 checkpoint 的确定性协议；Codex MCP tool、Skill 文案、AgentRuntime、tool policy、AI provider 和多渠道交付仍由外层仓库负责。
- `src/workflows/capabilities/execution/external/`、`src/workflows/capabilities/persistence/`、`src/workflows/capabilities/planning/*`、`src/workflows/cold-start/`、`src/workflows/knowledge-rescan/` 和 `src/workflows/shared/` 形成宿主 agent 可消费的 session / briefing / evidence / checkpoint / rescan plan / cleanup policy contract。
- `test/unit/HostAgentMiningWorkflow.test.ts` 覆盖 host agent mining workflow；`test/PublicHostAgentWorkflowEntrypoints.test.ts` 覆盖 public facade。

### 边界测试

- `test/CoreDeliveryBoundary.test.ts` 禁止 Core 增加 delivery、tool、agent、Codex、MCP、plugin 相关源码目录、导出、拷贝实现和 import。
- `test/CoreCodexBoundary.test.ts` 禁止 Core 增加 Codex、MCP、plugin、channel、marketplace 目录 / exports / dependencies / copied runtime files / imports，并验证 host-agent workflows 不引用 Codex runtime、preflight 或 MCP adapter 类。
- `test/CoreToolSystemBoundary.test.ts` 禁止 Core 增加 Alembic tool-system source directories、tool-system package entrypoints、tool router / handler / policy / terminal adapter 等实现文件和 imports。
- `test/PublicConsumerCoreImportBoundary.test.ts` 证明外层 consumer import lint 的语义：stable facade 默认允许，transitional deep imports 默认阻止，既有 allowlist 不允许引用增长，adapter path 可单独允许。

### 消费方证据

- `Alembic` 通过 `file:../AlembicCore` 依赖 Core。`node scripts/lint-consumer-core-imports.mjs ../Alembic --config ../Alembic/config/core-import-boundary.json --format text` 扫描 361 个文件和 487 个 `@alembic/core` imports，当前存在 4 个 scripts 中的 transitional deep import boundary violations，说明 Alembic 仍有 consumer replacement 债。
- `AlembicAgent` 通过 `file:../AlembicCore` 依赖 Core。consumer lint 扫描 230 个文件和 49 个 `@alembic/core` imports，通过；主要消费 logging、events、io、dimensions、knowledge、search、memory、workspace、project-intelligence、host-agent-workflows 等 facade。
- `AlembicPlugin` 通过 `file:../AlembicCore` 依赖 Core。consumer lint 扫描 330 个文件和 505 个 `@alembic/core` imports，通过；主要消费 workspace、daemon、database、guard、search、vector、knowledge、repositories、host-agent-workflows 和部分 allowlist deep imports。
- `AlembicDashboard` 不直接依赖 Core package；`src/types.ts` 仅在注释中说明 Dashboard DTO 的 source of truth 是 Alembic HTTP projects API backed by Core daemon project runtime contracts。

## 职责边界判断

### 应留在 Core

- 共享、确定性、可复用、可运行的 Headless 内核能力。
- Project / workspace identity primitives：folder names、ProjectMarkers、ProjectRegistry、WorkspaceResolver、project root / data root resolving。
- Daemon / job / runtime state 的共享 contract：JobStore、DaemonState、RuntimeContracts、ProjectRuntimeContracts。实际 daemon process lifecycle 仍属于 Alembic 或 Plugin runtime。
- SQLite / Drizzle schema、migrations、repository、unit-of-work、search adapters、database handle contracts。
- AST grammar wasm、parser initialization、project discovery、analysis、enhancement packs、project intelligence、panorama scanning。
- Guard、knowledge、evolution、candidate、quality、recipe、search、vector、memory 的确定性 service / repository / type contract。
- Host agent workflow 的确定性链路：mission briefing、session、external submission tracker、dimension completion、checkpoint、workflow report persistence、cold-start / rescan plan 和 presentation contract。
- Public API boundary governance scripts 和 machine-readable policy。

### 不应进入 Core

- AI provider、API key 管理、LLM gateway、OpenAI / Claude / Gemini / Ollama / DeepSeek provider、agent prompt 和模型调用策略，应属于 AlembicAgent。
- AgentRuntime、internal agent execution loop、tool system、tool catalog、tool router、terminal adapter、tool policy、dynamic tool forge，应属于 AlembicAgent 或外层 runtime。
- Codex MCP server、MCP schema、Skill 文案、Codex channel / marketplace / cache / plugin runtime artifact、preflight/status/diagnostics、Codex-visible response formatting，应属于 AlembicPlugin。
- CLI、daemon process lifecycle、HTTP/API server、Dashboard server、file monitor、resident service supervisor、platform bridge、release staging 和本地安装壳，应属于 Alembic。
- React UI、API client、routing、hooks、theme、i18n、frontend state 和 visual components，应属于 AlembicDashboard。
- 真实项目测试、冷启动监控、probe、restart、复现脚本和验证报告，应属于 AlembicTest。

## 删除 / 下沉 / 不得移动候选

### Core 本轮无直接删除候选

本轮未发现可以直接从 Core 删除的产品实现。原因：

- wildcard / deep exports 已被 policy 标为 migration-only 或 transitional-internal，但仍有 Alembic / AlembicPlugin 消费方、allowlist 和 `must-keep-transitional` 分类。
- AST grammar resources、database migrations、repository adapters、workflow contracts 都是当前跨仓库闭环的一部分。
- 删除必须先完成 consumer replacement、替代 facade、扫描证据和 targeted verification。

### 可后续下沉到 Core 的候选判断规则

只有满足以下条件的能力才可以考虑下沉 Core：

- 具备多个真实生产方 / 消费方。
- 输入输出确定性明确，不依赖宿主 Agent 具体执行循环。
- 不持有 AI provider、API key、MCP schema、CLI 参数、HTTP route、Dashboard UI 或 release packaging 语义。
- 能通过 exact facade 暴露，并有 consumer lint / smoke / public API test 证据。

### 需要外层后续迁移的债

- `Alembic` scripts 中仍有新增或未纳入 allowlist 的 transitional deep imports：`@alembic/core/core/discovery`、`@alembic/core/core/ast`、`@alembic/core/core/AstAnalyzer`。
- `Alembic` / `AlembicPlugin` 仍有大量历史 allowlist deep imports，例如 database drizzle schema / migrations、repository internals、service/knowledge internals、service/evolution internals。这些不是立即删除项，而是 consumer-replace-first 的长期债。
- Core policy 中 `./shared/*`、`./infrastructure/config/*`、`./types/*`、`./service/candidate/*` 已有 facade readiness map；后续应优先推动消费者迁到 `./shared`、`./config`、`./types`、`./service/candidate` 或更稳定 facade。

### 不得移动 / 不得下沉错误方向

- `resources/grammars/`、`src/core/ast/*`、`src/core/discovery/*`、`src/project-intelligence.ts`：不得移出 Core。
- `config/public-api-boundary.json` 和 public API boundary scripts：不得移出 Core。
- `src/*.ts` public facades：不得绕过或由外层复制维护。
- `src/shared/WorkspaceResolver.ts`、`src/shared/ProjectRegistry.ts`、`src/shared/folder-names.ts`：不得移动到 Alembic / Plugin 私有实现。
- `src/daemon/JobStore.ts`、`src/daemon/RuntimeContracts.ts`、`src/daemon/ProjectRuntimeContracts.ts`、`src/daemon/DaemonState.ts`：不得复制成外层分叉 contract。
- `src/workflows/capabilities/execution/external/*`、`src/workflows/cold-start/*`、`src/workflows/knowledge-rescan/*`：不得误判为 AlembicAgent；这是 host agent workflow contract，不是 Agent runtime。
- AI provider、AgentRuntime、tool router、Codex MCP、Skill/channel、Dashboard UI 不得下沉 Core。

## 验证命令与结果

已执行：

```text
git -C AlembicCore status --short
node scripts/check-public-api-boundary.mjs --format text
node scripts/lint-consumer-core-imports.mjs ../Alembic --config ../Alembic/config/core-import-boundary.json --format text
node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --config ../AlembicAgent/config/core-import-boundary.json --format text
node scripts/lint-consumer-core-imports.mjs ../AlembicPlugin --config ../AlembicPlugin/config/core-import-boundary-allowlist.json --format text
rg --files src config scripts test resources | sort
rg -n "Codex|MCP|marketplace|channels/codex|plugins/alembic-codex|Dashboard|React|vite|OpenAI|Claude|Gemini|AgentRuntime|ToolRouter|tool system|provider" src config scripts test package.json
git -C AlembicCore diff --check
```

结果：

- `git -C AlembicCore status --short` 无输出，Core 产品仓库干净。
- public API boundary 通过：136 个 package exports 全部分类，75 exact、61 wildcard，stable=17、provisional=21、transitional=98，未增长。
- AlembicAgent consumer boundary 通过：扫描 230 文件、49 个 imports。
- AlembicPlugin consumer boundary 通过：扫描 330 文件、505 个 imports。
- Alembic consumer boundary 未通过：扫描 361 文件、487 个 imports，发现 4 个 scripts 中的 transitional deep import violations；这是后续外层 consumer replacement 债，不是本轮 Core 源码问题。
- 负向扫描命中主要来自边界测试、注释、React / provider 作为项目识别词或注入契约；未发现 Core 拥有 Codex MCP / plugin channel / AgentRuntime / tool router 实现目录。
- `git -C AlembicCore diff --check` 通过。

## 遗留风险

- Core public API 面仍大，61 个 wildcard exports 和 98 个 transitional-internal exports 不能继续增长。
- Alembic 与 AlembicPlugin 对 repository / service / drizzle / migration deep imports 仍依赖 allowlist；收敛顺序必须先 consumer replacement，再收紧 exports。
- Core 持有 `WorkspaceSettingsStore` 和少量 AI provider key shape / env normalization，这是共享配置兼容 contract，不是 AI provider ownership；长期文档需要明确避免误读。
- `host-agent-workflows` 名称容易被误解为 AlembicAgent runtime；长期契约必须写清它是宿主 Agent 工作流协议和 persistence，不是 internal agent。

## 下一步建议

- GFBD-2 总控整合时，将 AlembicCore 定义为 shared deterministic headless core owner。
- 先把 Alembic scripts 的 4 个 consumer boundary violations 归为外层修正候选，避免误把问题塞回 Core。
- 后续若做 public API 收敛，优先使用 `config/public-api-boundary.json` 的 facade readiness map，按 consumer-replace-first 推进，不直接删除 wildcard exports。
- 长期职责契约中应明确：Core 可以支持宿主 Agent 完成知识挖掘闭环所需的 deterministic workflow / session / briefing / persistence / project-intelligence contract，但不实现 AI provider、AgentRuntime、tool system、Codex MCP 或多渠道交付。
