# AlembicCore 完整复制迁移执行手册

日期：2026-05-16
状态：新手册，替代此前所有 thin/stub 风格的 Core 迁移计划；2026-05-16 更新：Alembic 自身的 internal agent/tool system 不迁入 Core，但宿主 agent 知识挖掘闭环必须进入 Core；2026-05-17 更新：Core 阶段 13 Codex 边界固化已完成，下一阶段进入外层接入、边界收敛与删除。

边界依据：迁移前必须同时阅读
`docs/alembic-core-implementation-boundary-analysis-2026-05-16.md`。该文档记录了按实现调用链完成的边界判定，特别是 `ProjectIntelligence`、host-agent mining loop、persistence/checkpoint、KnowledgeService、delivery、Codex adapter、tool system 的拆分点。若本文阶段表与边界分析冲突，以边界分析中的实现证据为准，先修本文再迁代码。

## 0. 背景和硬约束

这次迁移的目标不是重新设计一个“更干净但功能更少”的 Core，也不是写一组很薄的 facade 文件。目标是：在不删减功能、不改变现有工作流的前提下，把 Alembic 与 AlembicPlugin 中稳定、可复用、确定性的能力完整迁入 `@alembic/core`，再让外层仓库按文档接入 Core。

必须遵守：

1. `AlembicCore` 不是空仓库，也不能用薄实现占位。每个阶段都必须从现有仓库完整复制真实文件与依赖。
2. 迁移优先级是“功能可用”和“行为等价”，不是边界漂亮。
3. Core 不拥有 AI Provider、Alembic internal AgentRuntime、`lib/agent/**`、`lib/tools/**` tool system、Codex host、MCP stdio、Dashboard、CLI、IDE 写入适配器等宿主能力。插件不需要 Alembic 自己的 agent 和工具路由，不能把它们迁入 Core。
4. Core 必须拥有完整的宿主 agent 知识挖掘闭环：扫描计划、证据包、任务/维度协议、宿主 agent 输入输出契约、提交校验、状态机、持久化、重试、SourceRef 回填、Recipe/Knowledge 落库。宿主负责执行，Core 负责闭环协议和结果收敛。
5. 如果某个文件看起来像 adapter，但它同时承载共享业务状态、数据结构或持久化契约，不能直接删或薄化。先判断它是否属于 host-agent 闭环内核；插件不需要的 Alembic internal agent/tool 逻辑留在外层。
6. 每个阶段结束后只留下“外层仓库删除计划”，由其他窗口执行。当前窗口专注 Core 内部迁移和文档布置。
7. 三个仓库的 `AGENTS.md` 必须保留，不能在回退、同步、子仓库接入中丢失。
8. `dist/` 是构建产物，应由 `.gitignore` 忽略；npm 发布通过 `files: ["dist", ...]` 控制产物入包，不应提交构建产物到源码仓库。

## 1. 当前基线

本手册基于回退后的三个仓库状态：

| 仓库 | 当前 HEAD | 角色 |
| --- | --- | --- |
| `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | `3e6bb52` | `@alembic/core` 包骨架，已补充外层子仓库接入规则 |
| `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | `14d082e` | 完整 Alembic 本体运行时，已通过 `vendor/AlembicCore` 接入 Core |
| `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin` | `1d12d4b` | Codex 插件与宿主集成仓库，已通过 `vendor/AlembicCore` 接入 Core |

当前观察：

- `AlembicCore` 已完成阶段 0、1、2、3、4、5、6、7、8、9、10、11、12、13 的 Core 内部迁移与边界固化；早期 `src/folder-names.ts` / `src/runtime.ts` shim 已在 `3077978` 清理，根入口直接导出 shared。阶段 8 提交为 `8a0706f Migrate knowledge service core`，阶段 9 提交为 `e65a501 Migrate host-agent mining workflow core`，阶段 10 提交为 `a1b93ec Migrate guard immune system core`，阶段 11 提交为 `031b85e Lock delivery boundary outside core`，阶段 12 提交为 `f8b5f7b Lock tool system outside core`，阶段 13 提交为 `be15964 Lock Codex boundary outside core`。
- `Alembic` 与 `AlembicPlugin` 都仍带有完整 `lib/shared`、`lib/domain`、`lib/core`、`lib/repository`、`lib/infrastructure`、`lib/service`、`lib/workflows`、`lib/tools` 层。
- `AlembicPlugin` 不是单纯 Codex 壳，它和 `Alembic` 有大量重复实现，同时新增 `lib/codex/**`、Codex channel/plugin 发布脚本和 Codex runtime 诊断。
- 本次迁移应以 `Alembic` 为主源，`AlembicPlugin` 做差异对照；两个仓库共同需要的共享内核和 host-agent 知识挖掘闭环进入 Core。Alembic 自身的 internal agent 能力、tool system、Codex 专属 adapter 均保留在外层。

## 2. Core 的能力边界

### 2.1 Core 应包含

- 目录、路径、工作区、Ghost mode、ProjectRegistry、PathGuard、配置 schema。
- 领域模型：KnowledgeEntry、Lifecycle、Dimension、Recipe、Snippet、Evolution policy、SourceRef 等。
- SQLite 数据库连接、Drizzle schema、migrations、Repository 实现、文件存储同步。
- AST、项目发现、语言识别、依赖图、项目智能分析。
- 搜索、召回、排序、向量索引、缓存、SourceRef 检索适配。
- Guard 规则、检查引擎、免疫系统、违规记录、覆盖率、反馈与学习。
- 插件和主仓库共同需要的 headless service：project intelligence、knowledge persistence、search、Guard、rescan planning、storage consistency、report/checkpoint 数据结构。
- 宿主 agent 知识挖掘闭环：MiningSession、DimensionTask、EvidencePack、Mission/Briefing 数据模型、Submission schema、结果校验、状态流转、失败重试、SourceRef/Recipe/Knowledge 回填。
- 共享排序、校验、解析等纯内核算法，但不包含 Alembic tool system、多渠道交付或 delivery pipeline。

### 2.2 Core 不应直接拥有

- Codex MCP stdio server、Codex plugin runtime env、channel/plugin release、marketplace sync。
- Alembic CLI 命令注册、Dashboard HTTP server/UI、Socket.io 宿主。
- Alembic internal AgentRuntime、`lib/agent/**`、agent runs、agent memory、agent policies、task manager、dimension execution agent。
- `lib/tools/**` tool system：Tool catalog、Tool contracts、V2 router、tool handlers、terminal/mac/dashboard/skill adapters、terminal policy、tool output compressor。
- Lark/Feishu 远程桥、macOS 原生 UI、open/browser/system adapter。
- 具体 AI Provider 配置、API key 管理、LLM 调用实现。
- IDE/宿主文件写入动作、AGENTS.md/Skills 注入、Cursor/Codex/IDE delivery pipeline。
- 多渠道交付抽象、delivery repository、交付渠道编排、插件发布/投递渠道。
- 宿主如何调度 agent、如何展示工具、如何执行 shell/terminal、如何通过 MCP/HTTP/stdin 传输请求。

### 2.3 特别说明：internal agent/tool 不进，宿主 agent 闭环进 Core

Core 不迁移 Alembic 自己的 internal agent 能力，也不迁移 agent 使用的 tool system。原因是插件侧依赖 Codex 宿主 agent，本身不需要 Alembic 内部 AgentRuntime、任务调度器、tool router 或 terminal/mac/dashboard 工具执行链。

但 Core 必须实现一套宿主无关的知识挖掘闭环。这个闭环不是“运行 AI”，而是把宿主 agent 能完成的分析工作组织成可恢复、可校验、可落库的流程。

- 进入 Core：workspace、domain、SQLite/repository、AST/discovery、search/vector、Guard、knowledge storage、SourceRef、rescan planning，以及 host-agent mining loop 的 session/task/evidence/submission/validation/persistence。
- 留在 Alembic：`lib/agent/**`、internal agent runs、agent memory/policy/profile/task、tool system、CLI/Dashboard/IDE delivery。
- 留在 AlembicPlugin：Codex MCP、Codex runtime/preflight/tool exposure、独立插件交付渠道、channel/plugin 发布、skills/marketplace 资产。
- 如果现有文件同时混有 host-agent 闭环和 Alembic internal agent/tool 逻辑，不能整文件搬进 Core；应完整抽出闭环内核，agent/tool 包装仍留外层。

## 3. 源码盘点摘要

### 3.1 Alembic 主源

入口与包：

- `bin/cli.ts`：CLI 命令总入口，绑定 setup/codex/ai/daemon/bootstrap/rescan/search/guard/server/ui 等命令。
- `bin/codex-mcp.ts`：Codex MCP shim，设置 MCP 环境后启动 `CodexMcpServer`。
- `lib/bootstrap.ts`：应用初始化，加载 workspace settings、PathGuard、WorkspaceResolver、ConfigLoader、DatabaseConnection、Constitution、PermissionManager、Audit、Gateway、SkillHooks。

核心模块：

- `lib/shared/**`：WorkspaceResolver、PathGuard、ProjectRegistry、ProjectMarkers、folder-names、WorkspaceSettingsStore、schema、token、similarity、content-hash 等。
- `lib/domain/**`：Knowledge、Dimension、Evolution、Snippet。
- `lib/infrastructure/database/**`：SQLite 连接、Drizzle schema、migrations。
- `lib/repository/**`：knowledge、search、sourceRef、bootstrap、guard、evolution、session、memory、token 等；`delivery` repository 属于外层交付，不默认迁入 Core。
- `lib/core/**`：AST、analysis、discovery、enhancement、gateway、permission、constitution、capability。
- `lib/service/search/**`、`lib/infrastructure/vector/**`：搜索、排序、向量、HNSW、索引管线。
- `lib/service/guard/**`：GuardService、GuardCheckEngine、ReverseGuard、Coverage、Feedback、RuleLearner、ViolationsStore。
- `lib/service/delivery/**`：CursorDeliveryPipeline、KnowledgeCompressor、RulesGenerator、SkillsSyncer、AgentInstructionsGenerator。该层主要是外层 delivery，不作为默认 Core 迁移对象。
- `lib/workflows/**`：cold-start、knowledge-rescan、project-intelligence、internal/external dimension execution、completion、persistence。共享 planning / project intelligence / storage consistency / host-agent mining loop 进入 Core，Alembic internal agent execution 留外层。
- `lib/agent/**`、`lib/tools/**`：Alembic 自身 agent 与 tool system，明确不迁入 Core。

### 3.2 AlembicPlugin 对照源

Plugin 与 Alembic 有大量重复共享代码，另外包含 Codex 专属边界：

- `lib/codex/**`：RuntimeContext、ProjectRootResolver、Diagnostics、StatusService、KnowledgeState、Preflight、ToolPolicy、PluginRegistry。
- `lib/external/mcp/CodexMcpServer.ts`：Codex MCP server，负责 tool list、preflight、auto init、daemon supervisor、projectRoot override。
- `channels/**`、`plugins/alembic-codex/**`、`injectable-skills/**`：Codex channel/plugin 发布和安装资产。

判断原则：

- `lib/codex/**` 中 runtime/env/channel/plugin host/tool exposure 相关全部留在 Plugin。
- Codex preflight、tool policy、MCP tool metadata 也留在 Plugin；Core 只提供它们调用的共享内核服务。

### 3.3 测试锚点

每阶段都要迁移或复用对应测试，不允许只跑 toy smoke。

Alembic 测试锚点：

- `test/unit/WorkspaceResolver.test.ts`
- `test/unit/PathGuard.test.ts`
- `test/unit/WorkspaceSettingsStore.test.ts`
- `test/unit/KnowledgeEntry.test.ts`
- `test/unit/SearchEngine.test.ts`
- `test/unit/SearchRanking.test.ts`
- `test/unit/HnswVector.test.ts`
- `test/unit/VectorPipeline.test.ts`
- `test/unit/GuardScopeFiltering.test.ts`
- `test/unit/ReverseGuard.test.ts`
- `test/unit/KnowledgeFileWriter.test.ts`
- `test/unit/BootstrapRescanState.test.ts` 中不依赖 agent/tool 的状态部分。
- `test/unit/ProjectIntelligenceIncrementalPlanner.test.ts`
- `test/integration/RealProjectBootstrap.test.ts`
- `test/integration/RealProjectDiscovery.test.ts`
- `test/integration/SearchPipeline.test.ts`
- `test/integration/GuardImmuneSystem.test.ts`
- `test/integration/KnowledgeCRUD.test.ts`

Plugin 专属测试锚点：

- `test/unit/CodexRuntimeContext.test.ts`
- `test/unit/CodexProjectRootResolver.test.ts`
- `test/unit/CodexKnowledgeState.test.ts`
- `test/unit/CodexStatusService.test.ts`
- `test/unit/CodexToolPolicy.test.ts`
- `test/unit/CodexMcpServer.test.ts`
- `test/unit/CodexSessionScenarioRunner.test.ts`
- `test/unit/CodexPluginCacheSync.test.ts`

以上 Plugin 专属测试不迁入 Core；它们用于验证 Plugin 调用 Core 后 Codex 外层行为仍然正常。

Delivery、agent、tool system 相关测试也不迁入 Core，例如 `CursorDeliveryPipeline.test.ts`、`DeliveryCompletionStep.test.ts`、`V2ToolSystem.test.ts`、`ToolExecutionPipeline.test.ts`。这些测试保留在外层，验证外层能力没有因为 Core 接入而回退。

## 4. 分阶段迁移总则

每个阶段固定流程：

1. 读源文件和测试，列出完整依赖闭包。
2. 从 `Alembic` 完整复制主实现到 `AlembicCore/src/**`，从 `AlembicPlugin` 对照差异。
3. 迁移对应测试到 `AlembicCore/test/**`，只改 import 路径和测试夹具路径。
4. 在 Core 内跑 `npm run build:check` 和阶段测试。
5. 写一份阶段完成记录，列出外层仓库接入任务与删除计划。
6. 其他窗口完成外层接入后，才允许删除外层重复文件。

阶段推进门禁：

- 后续阶段的外层接入不得跳过前一阶段的 import 收敛。比如阶段 2 接入前，Alembic 和 AlembicPlugin 的阶段 1 纯 shared imports 必须已经全量切到 `@alembic/core/shared/...`。
- “编译通过”不是接入完成的充分条件。每阶段还必须执行对应的 import 扫描、代表测试和边界文件保留检查。
- 如果某仓库只做了部分接入，可以继续编译验证，但不得执行该阶段删除计划，也不得在文档中标记为外层接入完成。

禁止事项：

- 禁止为了编译通过而重写薄接口。
- 禁止删除源测试来降低验证压力。
- 禁止把 provider、MCP、Dashboard、CLI、agent runtime、tool system 逻辑混入 Core 公共 API。
- 禁止一个阶段同时改 Core、Alembic、AlembicPlugin 大面积接入。接入任务写入文档，交给其他窗口。

## 5. 阶段 0：Core 包卫生与迁移夹具

目标：只准备迁移环境，不迁移业务代码。

执行记录：

- 2026-05-16 已完成阶段 0。
- 完成记录见 `docs/alembic-core-stage-0-completion-2026-05-16.md`。
- 本阶段只改 Core 包卫生、Vitest/Biome 配置、lockfile 和包级测试夹具；没有迁移业务能力。

Core 工作：

- 确认 `package.json` 的 `name` 为 `@alembic/core`，`type` 为 `module`，Node >= 22。
- 确认 `.gitignore` 忽略 `dist/`、coverage、node_modules。
- 增加测试框架配置时应与外层仓库一致，优先复制 Vitest/Biome/TS 配置，不重新设计。
- 保留 `AGENTS.md`。

验证：

- `npm run build:check`
- `git status --short` 确认只有阶段 0 文件变更。

外层任务：

- 无接入。
- 无删除。

## 6. 阶段 1：shared 基础工具完整迁移

目标：迁移所有上层模块共同依赖的纯基础能力。

执行记录：

- 2026-05-16 已完成阶段 1。
- 完成记录见 `docs/alembic-core-stage-1-completion-2026-05-16.md`。
- 本阶段迁入纯 shared 基础工具；`schemas/http-requests.ts`、`schemas/mcp-tools.ts`、`shutdown.ts`、delivery/IDE/channel/workspace-path 相关文件不进入阶段 1。

主源文件：

- `lib/shared/folder-names.ts`
- `lib/shared/constants.ts`
- `lib/shared/errors/**`
- `lib/shared/utils/common.ts`
- `lib/shared/markdown-utils.ts`
- `lib/shared/diff-parser.ts`
- `lib/shared/similarity.ts`
- `lib/shared/token-utils.ts`
- `lib/shared/content-hash.ts`
- `lib/shared/recipe-tokens.ts`
- `lib/shared/concurrency.ts`
- `lib/shared/lifecycle.ts`
- `lib/shared/test-mode.ts`
- `lib/shared/LanguageProfiles.ts`
- `lib/shared/LanguageService.ts`
- `lib/shared/schemas/common.ts`
- `lib/shared/schemas/config.ts`

混合或外层文件：

- `lib/shared/schemas/http-requests.ts` 留外层 HTTP adapter。
- `lib/shared/schemas/mcp-tools.ts` 留外层 MCP/tool exposure。
- `lib/shared/shutdown.ts` 留外层入口运行时。
- `lib/shared/ide-paths.ts` 留 Alembic delivery 外层。
- `AlembicPlugin/lib/shared/channel.ts` 留 Plugin channel 外层。
- `constants.ts` 中 delivery-only 常量不进入 Core。
- `folder-names.ts` 中 IDE/Cursor delivery-only section 不进入 Core。

对照文件：

- `AlembicPlugin/lib/shared/**` 同名文件。

Core 目的地：

- `src/shared/**`

规则：

- 完整复制文件。若 Alembic 与 Plugin 同名文件内容不同，先记录差异，不直接合并发挥。
- 若差异影响 Codex plugin 行为，应新增“待确认差异”小节，等外层接入窗口验证。

测试：

- 迁移 shared 相关 unit test。
- 至少覆盖 schema、token、similarity、language profile、test mode。

外层接入任务：

- Alembic/AlembicPlugin 暂不删除 `lib/shared/**`。
- 两个外层仓库都必须把阶段 1 清单内的纯 shared 生产代码引用全量切到 `@alembic/core/shared/*`，不能只切热点文件。
- 测试和 mock 必须同步改到同一 Core specifier，特别是 `test-mode`、`developer-identity`、`errors/index`。
- 阶段 1 纯 shared 清单：
  - `constants`
  - `content-hash`
  - `developer-identity`
  - `diff-parser`
  - `errors/**`
  - `folder-names`
  - `LanguageProfiles`
  - `LanguageService`
  - `lifecycle`
  - `markdown-utils`
  - `recipe-tokens`
  - `schemas/common`
  - `schemas/config`
  - `similarity`
  - `test-mode`
  - `token-utils`
  - `utils/common`
  - `TimerRegistry`
  - `concurrency`
- 验收扫描：

```bash
rg -n "\\.\\./.*shared/(concurrency|constants|content-hash|developer-identity|diff-parser|errors|LanguageProfiles|LanguageService|lifecycle|markdown-utils|recipe-tokens|schemas/common|schemas/config|similarity|TimerRegistry|test-mode|token-utils|utils/common)|#shared/(concurrency|constants|content-hash|developer-identity|diff-parser|errors|LanguageProfiles|LanguageService|lifecycle|markdown-utils|recipe-tokens|schemas/common|schemas/config|similarity|TimerRegistry|test-mode|token-utils|utils/common)" lib bin test
```

- Alembic 当前阶段 1 检查结果：`cbfee4e` 方向正确、测试通过，但仍需处理少量 `folder-names` 本地引用和对应测试拆分。
- AlembicPlugin 当前阶段 1 检查结果：`8102d92` 方向正确、测试通过，但仍有大量阶段 1 纯 shared 本地引用，只能算部分接入，必须补齐后才能进入删除计划。

删除计划：

- 阶段 1 接入完成后仍不立即删除全部 shared。只有两个外层仓库都通过阶段 1 import 扫描和代表测试后，才可删除纯 shared 重复文件。
- 不删除 workspace/path/config、HTTP/MCP schema、delivery/IDE/channel 文件。
- `constants.ts` 与 `folder-names.ts` 只有在外层 delivery/IDE 专属字段已经拆到 adapter 后才可删除外层副本。

## 7. 阶段 2：workspace/path/config 基础迁移

目标：迁移项目根、Ghost mode、数据根、路径安全和设置加载。

阶段 2 外层接入前置条件：

- Alembic 和 AlembicPlugin 必须先完成阶段 1 纯 shared import 全量切换。
- 如果阶段 1 扫描仍显示本地 `LanguageService`、`TimerRegistry`、`errors`、`test-mode`、`similarity` 等纯 shared 引用，不要开始阶段 2 删除计划。
- Core 后续接入基线建议使用 `3077978 Remove obsolete runtime shim` 或更新提交；该提交包含阶段 2 迁移和对早期薄 runtime shim 的清理。若只需要阶段 2 原始迁移记录，对应提交是 `6d09b76 Migrate workspace path core`。

执行记录：

- 2026-05-16 已完成 Core 内部迁移，阶段完成记录见 `docs/alembic-core-stage-2-completion-2026-05-16.md`。
- Core 提交：`6d09b76 Migrate workspace path core`。
- 本阶段以完整文件复制为主：workspace/path/config/io 的真实实现已进入 `AlembicCore/src/**`，不是 thin facade。
- Core 的 `PathGuard` 默认只允许 `.asd/`、知识库目录和 `.gitignore`；`.cursor/`、`.vscode/`、`.github/`、`.env` 属于外层 delivery/IDE/env adapter，必须由外层显式配置扩展。
- `WorkspaceResolver.autoApprovePendingPath` 未进入 Core。该路径只服务 Alembic MCP 自动审批注入器，属于外层 MCP/交付行为。
- `WorkspaceSettingsStore` 保留当前 AI/runtime env key 的兼容读写和 secrets 分离，但不包含 AI provider、API 调用、agent 调度或 tool system；它在本阶段只作为工作区运行时设置持久化契约迁入。
- `ConfigLoader`、`Paths`、`TriggerSymbol` 和 `WriteZone` 已迁入 `src/infrastructure/**`，并通过 `@alembic/core/infrastructure/config`、`@alembic/core/infrastructure/io` 暴露。
- 验证：`npm run check`、`npm run build`、package self-reference import smoke 通过，84 个测试通过。

主源文件：

- `lib/shared/WorkspaceResolver.ts`
- `lib/shared/PathGuard.ts`
- `lib/shared/ProjectRegistry.ts`
- `lib/shared/ProjectMarkers.ts`
- `lib/shared/WorkspaceSettingsStore.ts`
- `lib/shared/resolveProjectRoot.ts`
- `lib/shared/package-root.ts`
- `lib/shared/isOwnDevRepo.ts`
- `lib/infrastructure/config/**`
- `lib/infrastructure/io/WriteZone.ts`

对照文件：

- Plugin 同名 shared/config/io 文件。
- Codex project root 只对照 `lib/codex/ProjectRootResolver.ts`，不迁入 Codex env 行为。

Core 目的地：

- `src/shared/**`
- `src/infrastructure/config/**`
- `src/infrastructure/io/**`

测试：

- `WorkspaceResolver.test.ts`
- `PathGuard.test.ts`
- `WorkspaceSettingsStore.test.ts`
- `resolveProjectRoot.test.ts`
- `ConfigLoader.test.ts`
- 真实临时项目 fixture：standard mode、Ghost mode、registry inspection、settings/secrets 分离、PathGuard 默认与外层扩展写入边界。

外层接入任务：

- Alembic 的 `Bootstrap.configurePathGuard`、`SetupService`、daemon、HTTP route 改用 Core 的 `WorkspaceResolver`、`PathGuard`、`ProjectRegistry`、`WorkspaceSettingsStore`、`WriteZone`。
- Alembic / AlembicPlugin 的 `vendor/AlembicCore` gitlink 需要由外层接入窗口更新到 Core 提交 `3077978` 或更新提交，并和外层 import 改造一起提交。
- 外层接入阶段 2 之前，不得把阶段 1 未完成的纯 shared 本地引用留作“后续再说”；否则删除计划会误判哪些 `lib/shared` 文件可删。
- Alembic delivery/IDE/env 写入 adapter 若仍需要写 `.cursor/`、`.vscode/`、`.github/`、`.env`，只能在外层初始化时显式调用：

```ts
pathGuard.configure({
  projectRoot,
  packageRoot,
  knowledgeBaseDir,
  extraProjectWritePrefixes: ['.cursor', '.vscode', '.github'],
  extraProjectWritableFiles: ['.env'],
});
```

- Plugin 的 Codex project root resolver 保留，但 dataRoot/knowledgeRoot 判断改用 Core workspace primitives。
- Plugin 的 Codex MCP/preflight/tool metadata、channel/plugin 发布、runtime diagnostic 继续留在 Plugin，不从 Core 反向引入。
- 外层如仍需要 VSCode snippets、auto-approve pending marker、IDE path helper，应保留各自 adapter 文件；不要把这些规则补回 Core。

删除计划：

- 其他窗口完成两个外层仓库接入并通过测试后，删除外层重复 workspace/path/config 基础文件：
  - `lib/shared/WorkspaceResolver.ts`
  - `lib/shared/PathGuard.ts`
  - `lib/shared/ProjectRegistry.ts`
  - `lib/shared/ProjectMarkers.ts`
  - `lib/shared/WorkspaceSettingsStore.ts`
  - `lib/shared/resolveProjectRoot.ts`
  - `lib/shared/package-root.ts`
  - `lib/shared/isOwnDevRepo.ts`
  - `lib/infrastructure/config/ConfigLoader.ts`
  - `lib/infrastructure/config/Defaults.ts`
  - `lib/infrastructure/config/Paths.ts`
  - `lib/infrastructure/config/TriggerSymbol.ts`
  - `lib/infrastructure/io/WriteZone.ts`
- 不删除外层 `lib/shared/ide-paths.ts`、`lib/shared/shutdown.ts`、HTTP/MCP schema、Codex project root resolver、auto approve injector、delivery/IDE/channel adapter。
- 删除前必须确认外层测试覆盖 standard/ghost workspace、PathGuard delivery 扩展、settings/secrets、daemon/bootstrap 初始化路径。

## 8. 阶段 3：domain 模型完整迁移

目标：迁移知识实体、生命周期、维度和演化策略。

执行记录：

- 2026-05-16 已完成 Core 内部迁移，阶段完成记录见 `docs/alembic-core-stage-3-completion-2026-05-16.md`。
- Core 提交：`a89a597 Migrate domain model core`。
- 本阶段以完整文件复制为主：`lib/domain/**` 和 `KnowledgeEntryWire` 传输合约已进入 `AlembicCore/src/**`，不是 thin facade。
- Core 保留宿主无关的 `getAgentAdapterFieldSpec()`，同时保留 `getCursorDeliverySpec` 兼容别名；该别名不代表 Core 拥有 Cursor delivery。
- `agentNotes`、`aiInsight` 等历史字段作为数据合约保留；Core 不实现 AI provider、agent runtime、prompt 调度或 tool 执行。
- `DimensionSop.tools` 是 host-agent mining loop 的协议文本，不是 Core 内部工具实现；`lib/tools/**` 仍明确留在外层。
- `uuid` 已作为 Core 运行时依赖加入，因为 `KnowledgeEntry` 原实现直接使用 `uuidv4()`。
- 验证：`npm run build:check`、`npm run test`、`npm run lint`、`npm run build`、package self-reference import smoke 通过，235 个测试通过。

主源文件：

- `lib/domain/index.ts`
- `lib/domain/knowledge/**`
- `lib/domain/dimension/**`
- `lib/domain/evolution/**`
- `lib/domain/snippet/**`

Core 目的地：

- `src/domain/**`
- `src/types/knowledge-wire.ts`

Package exports：

- `@alembic/core/domain`
- `@alembic/core/domain/knowledge`
- `@alembic/core/domain/knowledge/*`
- `@alembic/core/domain/knowledge/values`
- `@alembic/core/domain/knowledge/values/*`
- `@alembic/core/domain/dimension`
- `@alembic/core/domain/dimension/*`
- `@alembic/core/domain/evolution/*`
- `@alembic/core/domain/snippet/*`
- `@alembic/core/types`
- `@alembic/core/types/*`

规则：

- `KnowledgeEntry`、`Lifecycle`、`FieldSpec`、`RecipeReadinessChecker`、`UnifiedValidator` 必须完整迁移。
- 不改变 JSON schema 和落库字段名。
- 不压缩 V3 knowledge model。
- 采用宿主无关的 adapter 命名，外层历史调用名只作为兼容别名保留。
- `KnowledgeEntryWire` 属于领域传输合约，进入 Core；外层应以 type-only import 使用。

测试：

- `KnowledgeEntry.test.ts`
- `Lifecycle.test.ts`
- `EvolutionPolicy.test.ts`
- `RecipeDimension.test.ts`
- `DomainLifecycle.test.ts`
- `core-package.test.ts` 中的 domain entrypoint smoke。

阶段 3 外层接入前置条件：

- Alembic 和 AlembicPlugin 必须先完成阶段 1 纯 shared import 全量切换。
- 阶段 2 workspace/path/config/io 接入不能留下会阻断 domain import 的本地路径别名冲突。
- Alembic / AlembicPlugin 的 `vendor/AlembicCore` gitlink 需要由外层接入窗口更新到 Core 提交 `a89a597` 或更新提交，并和外层 import 改造一起提交。

外层接入任务：

- Alembic/AlembicPlugin repository、service、workflow、测试改 import Core domain。
- 本地 `#domain/knowledge/KnowledgeEntry.js` 改为 `@alembic/core/domain/knowledge/KnowledgeEntry`。
- 本地 `#domain/knowledge/Lifecycle.js` 改为 `@alembic/core/domain/knowledge/Lifecycle`。
- 本地 `#domain/knowledge/values/*` 改为 `@alembic/core/domain/knowledge/values/*`。
- 本地 `#domain/dimension/*` 改为 `@alembic/core/domain/dimension/*`。
- 本地 `#domain/evolution/*` 改为 `@alembic/core/domain/evolution/*`。
- 本地 `#domain/snippet/Snippet.js` 改为 `@alembic/core/domain/snippet/Snippet`。
- 本地 `#types/knowledge-wire.js` 改为 `@alembic/core/types/knowledge-wire`，并优先使用 type-only import。
- Alembic 若仍使用 `getCursorDeliverySpec()`，可先引用 Core 兼容别名；Cursor 交付解释仍留 Alembic delivery adapter。
- AlembicPlugin 应优先使用 `getAgentAdapterFieldSpec()`；Codex MCP/runtime/preflight/tool metadata/channel 发布仍留 Plugin。
- 外层仓库保留 adapter、CLI、MCP、Dashboard、Codex runtime、delivery/channel 层。

验收扫描：

```bash
rg -n "from ['\"](#domain|\\.\\.?/.*lib/domain)" lib bin test
rg -n "from ['\"](#types/knowledge-wire|\\.\\.?/.*types/knowledge-wire)" lib bin test
```

代表验证：

```bash
npm run build:check
npm run test -- KnowledgeEntry Lifecycle RecipeDimension EvolutionPolicy DomainLifecycle
```

实际 test 命令按各外层仓库脚本调整。重点是 domain 原测试必须指向 Core 并通过，同时 Alembic delivery 测试、Plugin Codex 专属测试不能回退。

删除计划：

- 两个外层仓库完成接入、扫描和测试后，删除外层 `lib/domain/**` 重复文件。
- 两个外层仓库完成 `KnowledgeEntryWire` import 切换后，可删除外层 `lib/types/knowledge-wire.ts`。
- 不删除 `lib/repository/**`、`lib/service/**`、`lib/workflows/**`、`lib/agent/**`、`lib/tools/**`、`lib/codex/**`、delivery、MCP、CLI、Dashboard、plugin/channel adapter。

## 9. 阶段 4：SQLite / repository / 文件存储迁移

目标：把 SQLite 运行时和知识存储链路迁入 Core。

执行记录：

- 2026-05-17 已完成 Core 内部迁移。
- 完成记录见 `docs/alembic-core-stage-4-completion-2026-05-17.md`。
- Core 提交：`4ed0fda Migrate storage repository core`。
- 本阶段迁入真实 SQLite、Drizzle schema、migrations、repository、logging 依赖闭包、知识文件写入和确定性文件到 DB 同步服务；不是薄接口。

主源文件：

- `lib/infrastructure/database/DatabaseConnection.ts`
- `lib/infrastructure/database/drizzle/**`
- `lib/infrastructure/database/migrations/**`
- `lib/infrastructure/logging/**`
- `lib/repository/base/**`
- `lib/repository/knowledge/**`
- `lib/repository/search/**`
- `lib/repository/sourceref/**`
- `lib/repository/bootstrap/**`
- `lib/repository/guard/**`
- `lib/repository/evolution/**`
- `lib/repository/session/**`
- `lib/repository/memory/**`
- `lib/repository/token/**`
- `lib/repository/sync/**`
- `lib/service/knowledge/KnowledgeFileWriter.ts`
- `lib/cli/KnowledgeSyncService.ts`
- `lib/types/evolution.ts`

特殊要求：

- SQLite 必须进入 Core。
- migrations 必须完整迁移，不能只迁 schema。
- `DatabaseConnection` 中 Ghost mode、PathGuard、安全重定向、WAL、foreign_keys、busy_timeout 行为必须保留。
- Plugin 缺少或多出的 migration 要先比对，不能静默覆盖。
- Core 保留 `003_add_remote_commands` migration 与 `remote_commands` schema 表，原因是 SQLite 历史兼容和迁移顺序需要完整闭环；但 `repository/remote/**`、Lark/Feishu remote bridge、remote command handler 不进入 Core。
- `lib/repository/delivery/**` 不迁入 Core；delivery repository 绑定交付渠道和外层文件写入，不属于 Core 存储内核。
- `lib/repository/audit/**`、`lib/repository/code/**`、`lib/repository/remote/**` 不属于阶段 4。若后续证明 audit/code 是 Guard 或 discovery 的确定性内核，再在对应阶段处理；remote 继续外层持有。
- `lib/cli/KnowledgeSyncService.ts` 迁入 Core 时目的地改为 `src/service/knowledge/KnowledgeSyncService.ts`。它是确定性的文件到 SQLite 同步服务，不是 CLI 命令注册；CLI 入口留外层。
- `SearchRepoAdapter` 只迁 DB adapter 与本地 `SearchDb` duck type，不把 `service/search`、vector、SignalBus 提前带入阶段 4。
- `KnowledgeSyncService` 只保留 `SourceRefReconciler` 最小接口类型；完整 `SourceRefReconciler` 实现仍归后续 service 阶段。

Core 目的地：

- `src/infrastructure/database/**`
- `src/infrastructure/logging/**`
- `src/repository/**`
- `src/service/knowledge/KnowledgeFileWriter.ts`
- `src/service/knowledge/KnowledgeSyncService.ts`
- `src/types/evolution.ts`

测试：

- `ProposalRepository.test.ts`
- `KnowledgeFileWriter.test.ts`
- `DatabaseRepository.test.ts`
- 用临时真实 SQLite 文件验证 migrations 顺序和 schema_migrations。
- 验证 `KnowledgeRepositoryImpl` 可对真实临时 SQLite 写入和读取 `KnowledgeEntry`。
- 阶段 4 执行结果：`npm run build:check`、`npm run test`、`npm run lint`、`npm run build`、self-reference import smoke 均通过。

外层接入任务：

- 接入前必须确认阶段 1、2、3 的 import 收敛已经完成；否则 repository/domain/shared 会混用两套实体。
- 两个外层仓库先把 `vendor/AlembicCore` 更新到 `4ed0fda` 或之后提交。
- 外层 lockfile 需要按各仓库包管理方式刷新，因为 Core 新增 `better-sqlite3`、`drizzle-orm`、`winston` 和 `@types/better-sqlite3`。
- Alembic `Bootstrap.initializeDatabase`、setup/bootstrap/rescan 中的 DB 初始化改用 `@alembic/core/infrastructure/database`。
- Plugin daemon/MCP 初始化改用 Core DB 和 repository，但 daemon supervisor、MCP stdio、preflight、Codex runtime 继续留在 Plugin。
- `lib/infrastructure/database/**` imports 改为 `@alembic/core/infrastructure/database` 或 `@alembic/core/infrastructure/database/drizzle`。
- `lib/infrastructure/logging/**` imports 改为 `@alembic/core/infrastructure/logging`。
- `lib/repository/{base,knowledge,search,sourceref,bootstrap,guard,evolution,session,memory,token,sync}/**` imports 改为 `@alembic/core/repository/...`。
- `lib/service/knowledge/KnowledgeFileWriter.ts` imports 改为 `@alembic/core/service/knowledge/KnowledgeFileWriter` 或 `@alembic/core/service/knowledge`。
- `lib/cli/KnowledgeSyncService.ts` imports 改为 `@alembic/core/service/knowledge/KnowledgeSyncService`；外层 CLI 命令文件只保留命令注册、参数解析、输出呈现。
- `lib/types/evolution.ts` imports 改为 `@alembic/core/types/evolution`。
- 外层继续保留 CLI command、SetupService wrapper、daemon/MCP/HTTP route、Dashboard、Lark/Feishu bridge、Codex runtime/plugin/channel、ServiceContainer wiring、delivery pipeline。
- Alembic 若仍需要 remote command repository/handlers，保留 `lib/repository/remote/**` 与外层 remote 文件；Core 只提供 DB migration/schema 兼容。
- AlembicPlugin 的 Codex MCP/daemon/preflight/tool exposure/channel 发布全部留在 Plugin。

建议扫描：

```bash
rg -n "from ['\"](#infrastructure/database|#repository|#types/evolution|\\.\\.?/.*lib/infrastructure/database|\\.\\.?/.*lib/repository/(base|knowledge|search|sourceref|bootstrap|guard|evolution|session|memory|token|sync)|\\.\\.?/.*lib/types/evolution|\\.\\.?/.*lib/service/knowledge/KnowledgeFileWriter|\\.\\.?/.*lib/cli/KnowledgeSyncService)" lib bin test
```

接入窗口还要确认没有误删或误切：

```bash
rg -n "lib/repository/(delivery|remote|audit|code)|#repository/(delivery|remote|audit|code)" lib bin test
```

建议验证：

```bash
npm run build:check
npm run test -- DatabaseRepository KnowledgeFileWriter ProposalRepository
```

Alembic 还应补跑 bootstrap/setup/daemon 初始化相关测试；AlembicPlugin 还应补跑 Codex MCP/plugin 初始化相关测试。

删除计划：

- 两个外层仓库完成接入、扫描为零、代表测试通过后，才删除重复实现。
- 可删除候选：`lib/infrastructure/database/**`、`lib/repository/base/**`、`lib/repository/knowledge/**`、`lib/repository/search/**`、`lib/repository/sourceref/**`、`lib/repository/bootstrap/**`、`lib/repository/guard/**`、`lib/repository/evolution/**`、`lib/repository/session/**`、`lib/repository/memory/**`、`lib/repository/token/**`、`lib/repository/sync/**`、`lib/service/knowledge/KnowledgeFileWriter.ts`、`lib/cli/KnowledgeSyncService.ts`、`lib/types/evolution.ts`。
- `lib/infrastructure/logging/**` 只有在外层所有日志消费者都能直接使用 Core Logger 时才删除；若外层需要宿主专属日志路径或 transport，应保留一个很薄的外层 adapter。
- 不删除：`lib/repository/delivery/**`、`lib/repository/remote/**`、`lib/repository/audit/**`、`lib/repository/code/**`、CLI 命令文件、daemon supervisor、MCP/HTTP routes、Dashboard、Lark/Feishu remote bridge、Codex runtime/plugin/channel、ServiceContainer wiring。

## 10. 阶段 5：event / signal / job / daemon 状态基础迁移

目标：迁移任务、事件、信号、运行状态的确定性数据层。

执行记录：

- 2026-05-17 已完成 Core 内部迁移。
- 完成记录见 `docs/alembic-core-stage-5-completion-2026-05-17.md`。
- Core 提交：`c89e368 Migrate event job state core`。
- 本阶段迁入 EventBus、SignalBus、SignalTraceWriter、SignalBridge、SignalAggregator、ReportStore、DaemonState、JobStore；没有迁入 RealtimeService、DaemonSupervisor、DaemonJobRunner 的工作流执行部分。

主源文件：

- `lib/infrastructure/event/**`
- `lib/infrastructure/signal/**`
- `lib/infrastructure/report/ReportStore.ts`
- `lib/daemon/DaemonState.ts`
- `lib/daemon/JobStore.ts`

不迁移：

- `DaemonSupervisor` 中启动进程、端口、打开 Dashboard、宿主进程管理行为先留外层。
- `RealtimeService` 绑定 Socket.io、HTTP server 和 Dashboard 实时通知，整体留外层。
- `DaemonJobRunner` 当前绑定 `ServiceContainer`、MCP internal handlers、bootstrap task manager 和 event completion hook，整体留外层。Core 已迁入它依赖的确定性 `JobStore`；外层 runner 后续只需要改 import。
- `SignalModule` 属于外层 DI wiring，留外层；它后续只改为从 Core 创建 SignalBus/SignalTraceWriter/SignalAggregator。

边界说明：

- `ReportStore` 是 `SignalAggregator` 的确定性 JSONL 持久化依赖，因此随阶段 5 进入 Core。
- `JobStore` 采用 AlembicPlugin 的 host metadata superset，保留 `actor`、`channelId`、`client`、`createdByTool`、`sessionId` 等字段，避免 Plugin 接入后丢失 Codex job 上下文。
- Core 只保存和查询 daemon/job 状态，不启动 daemon，不调 MCP handler，不取消宿主 task manager。
- Core 的 signal/event 能力是进程内确定性分发和 JSONL 留痕；WebSocket、HTTP routes、Dashboard 广播继续在外层完成。

测试：

- `EventBus.test.ts`
- `SignalBus.test.ts`
- `JobStore.test.ts`
- `DaemonState.test.ts`
- `SignalPersistence.test.ts`
- 阶段 5 执行结果：`npm run build:check`、`npm run test`、`npm run lint`、`npm run build`、self-reference import smoke 均通过。

外层接入任务：

- 接入前必须确认阶段 1-4 import 收敛已经完成，尤其是 workspace path、database、repository 已统一到 Core。
- 两个外层仓库先把 `vendor/AlembicCore` 更新到 `c89e368` 或之后提交。
- `lib/infrastructure/event/**` imports 改为 `@alembic/core/infrastructure/event` 或对应子路径。
- `lib/infrastructure/signal/**` imports 改为 `@alembic/core/infrastructure/signal` 或对应子路径。
- `lib/infrastructure/report/ReportStore.ts` imports 改为 `@alembic/core/infrastructure/report/ReportStore` 或 `@alembic/core/infrastructure/report`。
- `lib/daemon/DaemonState.ts` imports 改为 `@alembic/core/daemon/DaemonState` 或 `@alembic/core/daemon`。
- `lib/daemon/JobStore.ts` imports 改为 `@alembic/core/daemon/JobStore` 或 `@alembic/core/daemon`。
- 外层 `SignalModule`、`InfraModule`、HTTP jobs/routes、Codex MCP job-status 继续保留，但内部引用 Core 的 EventBus/SignalBus/ReportStore/JobStore/DaemonState。
- AlembicPlugin 的 job create context 可继续写入 `actor`、`channelId`、`client`、`createdByTool`、`sessionId`，Core `JobStore` 已保留这些字段。
- 外层继续保留 `RealtimeService`、`DaemonSupervisor`、`DaemonJobRunner`、HTTP routes、Codex MCP server、Dashboard 广播和 ServiceContainer wiring。

建议扫描：

```bash
rg -n "from ['\"](#infrastructure/(event|signal)|#infrastructure/report/ReportStore|#daemon/(DaemonState|JobStore)|\\.\\.?/.*lib/infrastructure/(event|signal|report/ReportStore)|\\.\\.?/.*lib/daemon/(DaemonState|JobStore))" lib bin test
```

边界保留检查：

```bash
rg -n "RealtimeService|DaemonSupervisor|DaemonJobRunner|SignalModule|socket\\.io|external/mcp/handlers" lib bin test
```

删除计划：

- 两个外层仓库完成接入、扫描无遗留、代表测试通过后，才删除重复实现。
- 可删除候选：`lib/infrastructure/event/**`、`lib/infrastructure/signal/**`、`lib/infrastructure/report/ReportStore.ts`、`lib/daemon/DaemonState.ts`、`lib/daemon/JobStore.ts`。
- 不删除：`lib/infrastructure/realtime/RealtimeService.ts`、`lib/daemon/DaemonSupervisor.ts`、`lib/daemon/DaemonJobRunner.ts`、`lib/injection/modules/SignalModule.ts`、`lib/injection/modules/InfraModule.ts`、HTTP jobs/daemon/signals/routes、Codex MCP server、Dashboard/WebSocket adapter、ServiceContainer wiring。

## 11. 阶段 6：discovery / AST / project intelligence 基础迁移

目标：迁移源码扫描、项目发现、语言解析和依赖图能力。

执行记录：

- 2026-05-17 已完成 Core 内部迁移。
- 完成记录见 `docs/alembic-core-stage-6-completion-2026-05-17.md`。
- Core 提交：`f6e1220 Migrate project intelligence core`。
- 本阶段迁入真实 discovery、AST、analysis、enhancement、project intelligence diff/snapshot/planning 和 grammar 资源；不是 thin facade。

主源文件：

- `lib/core/ast/**`
- `lib/core/analysis/**`
- `lib/core/AstAnalyzer.ts`
- `lib/core/discovery/**`
- `lib/core/enhancement/**`
- `lib/core/capability/CapabilityProbe.ts`
- `lib/workflows/capabilities/project-intelligence/**`
- `lib/workflows/capabilities/planning/dimensions/BaseDimensions.ts`
- `lib/workflows/capabilities/presentation/LanguageExtensionBuilder.ts`
- `lib/workflows/capabilities/presentation/TargetClassifier.ts`
- `lib/types/project-snapshot*`
- `lib/types/ast.d.ts`

边界：

- 只迁移项目扫描、diff planning、snapshot/materialize、语言/依赖分析等 deterministic 部分。
- Core 拥有 grammar resolver、WASM 可用性检查、AST plugin reload 和 packaged grammar 资源。外层只负责各自发布物是否把 Core 资源正确打包，不负责重新实现 grammar 检查或自动安装逻辑。
- `ConfigWatcher` 进入 Core，但使用 Core `TimerRegistry` 生命周期注册，不引入外层 shutdown manager。
- `FileDiffPlanner` 不迁 internal agent `SessionStore`；Core 使用最小 snapshot wrapper 恢复 episodic summary，保留增量扫描能力。
- `ProjectIntelligenceRunner` 保留 Code Entity Graph 和 Guard audit 调用点，但 `CodeEntityGraph` 与 `GuardCheckEngine` 在阶段 6 暂作为可选 hook 降级，等后续 service/code graph 与 Guard 阶段完整迁移。
- `ProjectIntelligencePreparation.clearOldData` 中 workflow checkpoint / internal agent cleanup 仍由外层拥有。
- 不迁入 AI provider、MCP/HTTP/Dashboard transport、Alembic internal agent、`lib/tools/**`、delivery/plugin/channel。

依赖：

- `web-tree-sitter`
- `js-yaml`
- `@types/js-yaml`
- `resources/grammars/**`

warnings 处理：

- 阶段 6 的 `npm run lint` 通过，但保留原实现复制带来的 Biome warnings，主要是 `any`、非空断言和少量未使用变量。
- 当前阶段不做 warning cleanup，避免把行为等价迁移和优化性重构混在一起。

测试：

- `MultiLanguageParsers.test.ts`
- `FileDiffSnapshotStore.test.ts`
- `ProjectIntelligenceIncrementalPlanner.test.ts`
- `AstGrammar.test.ts`
- 阶段 6 执行结果：`npm run lint`、`npm run build:check`、`npm run test`、`npm run build`、self-reference import smoke 均通过；Vitest 25 个测试文件、391 个测试通过。

外层接入任务：

- 接入前必须确认阶段 1-5 import 已收敛，尤其是 shared、workspace、domain、database/repository、event/signal/job state 已统一到 Core。
- 两个外层仓库先把 `vendor/AlembicCore` 更新到 `f6e1220` 或之后提交。
- 外层 lockfile 需要刷新，因为 Core 新增 `web-tree-sitter`、`js-yaml` 和 `@types/js-yaml`。
- `lib/core/AstAnalyzer.ts` imports 改为 `@alembic/core/core/AstAnalyzer`。
- `lib/core/analysis/**` imports 改为 `@alembic/core/core/analysis/**`。
- `lib/core/ast/**` imports 改为 `@alembic/core/core/ast/**`。
- `lib/core/discovery/**` imports 改为 `@alembic/core/core/discovery/**`。
- `lib/core/discovery/parsers/**` imports 改为 `@alembic/core/core/discovery/parsers/**`。
- `lib/core/enhancement/**` imports 改为 `@alembic/core/core/enhancement/**`。
- `lib/core/capability/CapabilityProbe.ts` imports 改为 `@alembic/core/core/capability/CapabilityProbe`。
- `lib/workflows/capabilities/project-intelligence/**` imports 改为 `@alembic/core/workflows/capabilities/project-intelligence/**`。
- `lib/workflows/capabilities/planning/dimensions/BaseDimensions.ts` imports 改为 `@alembic/core/workflows/capabilities/planning/dimensions/BaseDimensions`。
- `lib/workflows/capabilities/presentation/LanguageExtensionBuilder.ts` imports 改为 `@alembic/core/workflows/capabilities/presentation/LanguageExtensionBuilder`。
- `lib/workflows/capabilities/presentation/TargetClassifier.ts` imports 改为 `@alembic/core/workflows/capabilities/presentation/TargetClassifier`。
- `lib/types/project-snapshot.ts`、`lib/types/project-snapshot-builder.ts`、`lib/types/ast.d.ts` 改为 Core types。
- Alembic coldstart/rescan 调用 Core project intelligence，但 CLI/MCP/HTTP/Dashboard、ServiceContainer wiring 继续留在 Alembic。
- Plugin MCP structure/panorama/bootstrap/rescan handler 调用 Core project intelligence，但 Codex runtime、preflight、tool policy、plugin/channel 发布继续留在 Plugin。
- 外层发布验证必须确认 Core `resources/grammars/**` 可访问；如果失败，修外层 package/plugin 打包规则，不把 grammar 检查逻辑复制回外层。

建议扫描：

```bash
rg -n "from ['\"](#core/(AstAnalyzer|analysis|ast|discovery|enhancement|capability)|#workflows/capabilities/(project-intelligence|planning/dimensions/BaseDimensions|presentation/(LanguageExtensionBuilder|TargetClassifier))|#types/project-snapshot|#types/project-snapshot-builder|\\.\\.?/.*lib/core/(AstAnalyzer|analysis|ast|discovery|enhancement|capability)|\\.\\.?/.*lib/workflows/capabilities/(project-intelligence|planning/dimensions/BaseDimensions|presentation/(LanguageExtensionBuilder|TargetClassifier))|\\.\\.?/.*lib/types/project-snapshot)" lib bin test
```

删除计划：

- 两个外层仓库完成接入、扫描无遗留、代表测试通过后，才删除重复实现。
- 可删除候选：`lib/core/AstAnalyzer.ts`、`lib/core/analysis/**`、`lib/core/ast/**`、`lib/core/discovery/**`、`lib/core/enhancement/**`、`lib/core/capability/CapabilityProbe.ts`、`lib/workflows/capabilities/project-intelligence/**`、`lib/workflows/capabilities/planning/dimensions/BaseDimensions.ts`、`lib/workflows/capabilities/presentation/LanguageExtensionBuilder.ts`、`lib/workflows/capabilities/presentation/TargetClassifier.ts`、`lib/types/ast.d.ts`、`lib/types/project-snapshot.ts`、`lib/types/project-snapshot-builder.ts`。
- 不删除：`lib/core/gateway/**`、`lib/core/permission/**`、`lib/core/constitution/**`、`lib/service/guard/**`、`lib/service/knowledge/CodeEntityGraph.ts` 或相关 code graph 服务、`lib/agent/**`、`lib/tools/**`、MCP/HTTP/Codex handlers、CLI、Dashboard、RealtimeService、DaemonSupervisor、DaemonJobRunner、ServiceContainer wiring、delivery/plugin/channel 资产。

## 12. 阶段 7：search / vector / indexing 迁移

目标：迁移完整检索链路。

执行记录：

- 2026-05-17 已完成 Core 内部迁移。
- 完成记录见 `docs/alembic-core-stage-7-completion-2026-05-17.md`。
- Core 提交：`fcb46ae Migrate search vector core`。
- 本阶段迁入真实 search/vector/indexing 内核和测试；具体 AI provider、CrossEncoder AI prompt、ContextualEnricher AI prompt、DI module 和外层 handler 不进入 Core。

主源文件：

- `lib/service/search/**`
- `lib/infrastructure/vector/**`
- `lib/service/vector/**`

规则：

- `SearchEngine` 的 keyword、weighted、auto、semantic gate、cache、SignalBus 行为保留。
- `BatchEmbedder`、VectorPipeline、HNSW 代码完整迁移。
- 向量索引能力归 Core：本地 vector store、HNSW、JSON fallback、binary persistence、chunking、indexing pipeline、search ranking、hybrid retrieval 都必须完整迁移。
- AI embedding provider 不归 Core 拥有；Core 只定义 `EmbeddingProvider` / `EmbedProvider` interface，并接收外层 adapter 注入。若当前实现耦合 provider，先完整迁移 search/vector 内核，再把 provider adapter 留在外层。
- `ContextualEnricher` 当前依赖 `aiProvider.chat()`，具体实现不进入 Core；Core 已保留可选 `VectorChunkEnricher` interface 和失败不阻断 indexing 的调用点。
- cross-encoder reranker 的模型实现不进入 Core；Core 已保留 `SearchCrossEncoder` interface 和无实现时自动跳过的排序管线。
- `SyncCoordinator` 归 Core，因为它维护 knowledge CRUD 与 vector index 的最终一致性；但 MCP/HTTP/CLI 触发入口和 DI module 留外层。
- `VectorModule` 留外层，因为它绑定 ServiceContainer、AI provider、配置中心和初始化时机。
- `lib/tools/v2/cache/**` 属于 Alembic tool system，默认不迁入 Core；只有确认其中某个 cache 是 search service 直接共享依赖时，才以 search/cache 内核重新归档迁移。
- `lib/service/search/CrossEncoderReranker.ts` 留外层。外层实现后续应适配 Core `SearchCrossEncoder`。
- `lib/service/vector/ContextualEnricher.ts` 留外层。外层实现后续应适配 Core `VectorChunkEnricher`。

边界验收：

- 无 provider 时，Core 的 keyword/weighted 搜索必须可用，semantic/vector 状态只能 warning 或 disabled，不能阻断知识链路。
- provider 调用失败时，保留 circuit breaker、weighted fallback、sparse-only hybrid fallback。
- batch embedding 不支持时，保留 serial fallback；部分 chunk 失败时跳过失败项并记录 warning。
- HNSW/binary index 损坏时可从 JSON 或 DB 重建，并保持可诊断 warning。
- vector index 写入目录继续走 WriteZone/PathGuard。
- outer Alembic / Plugin 注入 provider 后，语义检索、hybrid 检索、CRUD 自动同步行为和迁移前一致。

测试：

- `SearchEngine.test.ts`
- `SearchRanking.test.ts`
- `SearchPipeline.test.ts`
- `HnswVector.test.ts`
- `VectorPipeline.test.ts`
- `VectorService.test.ts`
- 阶段 7 实际迁移测试：`SearchEngine.test.ts`、`SearchRanking.test.ts`、`HnswVector.test.ts`、`VectorService.test.ts`、`SyncCoordinator.test.ts`、`SearchPipeline.test.ts`。
- 阶段 7 执行结果：`npm run lint`、`npm run build:check`、`npm run test`、`npm run build`、self-reference import smoke 均通过；Vitest 31 个测试文件、637 个测试通过。

外层接入任务：

- 接入前必须确认阶段 1-6 import 已收敛。
- 两个外层仓库先把 `vendor/AlembicCore` 更新到 `fcb46ae` 或之后提交。
- `lib/infrastructure/vector/**` imports 改为 `@alembic/core/infrastructure/vector/**`。
- `lib/service/search/BM25Scorer.ts`、`CoarseRanker.ts`、`FieldWeightedScorer.ts`、`HybridRetriever.ts`、`MultiSignalRanker.ts`、`SearchEngine.ts`、`SearchTypes.ts`、`contextBoost.ts`、`tokenizer.ts` imports 改为 `@alembic/core/service/search/**`。
- `lib/service/vector/VectorService.ts`、`SyncCoordinator.ts` imports 改为 `@alembic/core/service/vector/**`。
- Alembic/Plugin MCP search handler 改用 Core search/vector。
- 外层 provider 配置、API key、模型选择、provider adapter 仍由宿主仓库注入。
- 外层保留 CLI/MCP/HTTP search/embed 入口，只调用 Core search/vector service。
- 外层保留 `CrossEncoderReranker`，但改为适配 Core `SearchCrossEncoder`。
- 外层保留 `ContextualEnricher`，但改为适配 Core `VectorChunkEnricher`。
- 外层保留 `VectorModule`、ServiceContainer wiring、Codex runtime/preflight/tool policy/plugin channel。

建议扫描：

```bash
rg -n "from ['\"](#infra/vector|#service/search/(BM25Scorer|CoarseRanker|FieldWeightedScorer|HybridRetriever|MultiSignalRanker|SearchEngine|SearchTypes|contextBoost|tokenizer)|#service/vector/(VectorService|SyncCoordinator)|\\.\\.?/.*lib/infrastructure/vector|\\.\\.?/.*lib/service/search/(BM25Scorer|CoarseRanker|FieldWeightedScorer|HybridRetriever|MultiSignalRanker|SearchEngine|SearchTypes|contextBoost|tokenizer)|\\.\\.?/.*lib/service/vector/(VectorService|SyncCoordinator))" lib bin test
```

边界保留检查：

```bash
rg -n "CrossEncoderReranker|ContextualEnricher|VectorModule|OpenAI|Gemini|Claude|apiKey|chatWithStructuredOutput|aiProvider" lib bin test
```

删除计划：

- 两个外层仓库完成接入、扫描无遗留、代表测试通过后，才删除重复实现。
- 可删除候选：`lib/infrastructure/vector/**`、`lib/service/search/BM25Scorer.ts`、`lib/service/search/CoarseRanker.ts`、`lib/service/search/FieldWeightedScorer.ts`、`lib/service/search/HybridRetriever.ts`、`lib/service/search/MultiSignalRanker.ts`、`lib/service/search/SearchEngine.ts`、`lib/service/search/SearchTypes.ts`、`lib/service/search/contextBoost.ts`、`lib/service/search/tokenizer.ts`、`lib/service/vector/SyncCoordinator.ts`、`lib/service/vector/VectorService.ts`。
- 不删除：`lib/service/search/CrossEncoderReranker.ts`、`lib/service/vector/ContextualEnricher.ts`、provider / AI config / API key / model selection、`VectorModule`、ServiceContainer wiring、CLI/MCP/HTTP search/embed handlers、Codex runtime/preflight/tool policy/plugin channel、Dashboard/daemon/transport/delivery 层。

## 13. 阶段 8：knowledge / candidate / recipe / sourceRef 服务迁移

状态：Core 已完成，提交 `8a0706f Migrate knowledge service core`。

目标：迁移知识生产、校验、SourceRef、确定性 evolution、panorama 和 Recipe 生命周期服务闭包。

已迁入 Core：

- `src/repository/code/**`
- `src/service/bootstrap/BootstrapDedup.ts`
- `src/service/candidate/**`
- `src/service/recipe/**`
- `src/service/quality/**`
- `src/service/knowledge/CodeEntityGraph.ts`
- `src/service/knowledge/ConfidenceRouter.ts`
- `src/service/knowledge/KnowledgeGraphService.ts`
- `src/service/knowledge/KnowledgeService.ts`
- `src/service/knowledge/RecipeExtractor.ts`
- `src/service/knowledge/RecipePathRewriter.ts`
- `src/service/knowledge/RecipeProductionGateway.ts`
- `src/service/knowledge/SourceRefReconciler.ts`
- `src/service/evolution/ConsolidationAdvisor.ts`
- `src/service/evolution/ContentImpactAnalyzer.ts`
- `src/service/evolution/ContentPatcher.ts`
- `src/service/evolution/DecayDetector.ts`
- `src/service/evolution/EnhancementSuggester.ts`
- `src/service/evolution/EvolutionGateway.ts`
- `src/service/evolution/LifecycleStateMachine.ts`
- `src/service/evolution/ProposalExecutor.ts`
- `src/service/evolution/RecipeImpactPlanner.ts`
- `src/service/evolution/RedundancyAnalyzer.ts`
- `src/service/evolution/StagingManager.ts`
- `src/service/panorama/**`
- `src/types/reactive-evolution.ts`
- 对应 `index.ts` 和 `package.json` exports。

规则：

- CandidateAggregator、KnowledgeService、RecipeParser/Validator、SourceRefReconciler 必须完整迁移。
- `KnowledgeFileWriter` 与确定性的 `KnowledgeSyncService` 已在阶段 4 迁入 Core；本阶段只迁它们尚未覆盖的 knowledge/candidate/recipe/sourceRef 服务闭包，不能重复复制回另一套实现。
- 涉及 AI 生成、agent 调度、tool 调用的 service 留在外层；Core 只迁移校验、解析、持久化、一致性修复、SourceRef 等插件也需要的确定性服务。
- `KnowledgeService.publish()` 不允许直接 import 外层 `ServiceContainer` 或 CursorDelivery；Core 通过 `afterPublish` hook 交给外层处理交付/刷新。
- `RecipeImpactPlanner` 不依赖 `agent/runs/evolution/EvolutionAgentRun`，Core 内保留最小 `EvolutionAuditRecipe` 数据契约。
- `PanoramaScanner` 只允许动态 import Core 已迁入的 `workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.js`。
- `lib/service/module/ModuleService.ts` 留在外层，因为它依赖 `#agent`、AI provider 和 Dashboard AI settings。
- `FileChangeDispatcher`、`FileChangeHandler`、`DaemonFileChangeCollector`、`FileChangeSourceTracker` 留在外层，因为它们属于 HTTP/MCP/daemon/IDE 实时触发层。

测试：

- `KnowledgeService.test.ts`
- `BootstrapDedup.test.ts`
- `production-gateway.test.ts`
- `SourceRefReconciler-signal.test.ts`
- `RecipeImpactPlanner.test.ts`
- `ConsolidationAdvisor.test.ts`
- `DecayDetector.test.ts`
- `content-patcher.test.ts`
- `PanoramaService.test.ts`
- `PanoramaAggregator.test.ts`
- `PanoramaScanner.test.ts`
- `LayerInferrer.test.ts`
- `Phase2-PanoramaIntegration.test.ts`

Core 验证：

- `npm run build:check` 通过。
- `npm run test` 通过：44 个测试文件、843 个测试。
- `npm run lint` 通过，保留 baseline warnings。
- `npm run build` 通过。
- package self-reference smoke 通过：
  - `@alembic/core/service/knowledge`
  - `@alembic/core/service/candidate`
  - `@alembic/core/service/recipe`
  - `@alembic/core/service/evolution`
  - `@alembic/core/service/panorama`
  - `@alembic/core/service/quality`
  - `@alembic/core/service/bootstrap`
  - `@alembic/core/repository/code`

外层接入任务：

- 两个外层仓库先把 `vendor/AlembicCore` 或模块依赖更新到 `8a0706f` 或之后提交。
- Alembic HTTP routes、CLI、Dashboard service wiring 和 Plugin MCP handlers 改为调用 Core service。
- `KnowledgeService` 继续由外层注入 `auditLogger`、`gateway`、`knowledgeGraphService`、`fileWriter`、`skillHooks`、`confidenceRouter`、`qualityScorer`、`eventBus`、`edgeRepo`、`proposalRepo`。
- Alembic 外层如需发布后交付，注入 `afterPublish` hook，并在 hook 内触发 CursorDelivery / Dashboard refresh；Plugin 可保持空 hook。
- `RecipeProductionGateway`、`EvolutionGateway`、`ProposalExecutor`、`PanoramaService`、`PanoramaScanner` 改用 Core class，外层只保留 handler/DI/transport。
- `ModuleService`、`FileChangeDispatcher`、实时 file change handler、daemon collector、delivery、provider、agent/tool runtime 继续留在外层。

建议扫描：

```bash
rg -n "from ['\"](#service/(knowledge|candidate|recipe|quality|evolution|panorama)|#repository/code|#types/reactive-evolution|#service/bootstrap/BootstrapDedup|\\.\\.?/.*lib/service/(knowledge|candidate|recipe|quality|evolution|panorama)|\\.\\.?/.*lib/repository/code)" lib bin test
```

边界保留检查：

```bash
rg -n "ModuleService|FileChangeDispatcher|FileChangeHandler|DaemonFileChangeCollector|FileChangeSourceTracker|ServiceContainer|CursorDelivery|Dashboard|chatWithStructuredOutput|aiProvider|OpenAI|Gemini|Claude|lib/agent|lib/tools" lib bin test
```

删除计划：

- 两个外层仓库完成接入、扫描无遗留、代表测试通过后，才删除重复实现。
- 可删除候选：`lib/repository/code/CodeEntityRepository.ts`、`lib/service/bootstrap/BootstrapDedup.ts`、`lib/service/candidate/**`、`lib/service/recipe/**`、`lib/service/quality/**`、`lib/service/knowledge/CodeEntityGraph.ts`、`ConfidenceRouter.ts`、`KnowledgeGraphService.ts`、`KnowledgeService.ts`、`RecipeExtractor.ts`、`RecipePathRewriter.ts`、`RecipeProductionGateway.ts`、`SourceRefReconciler.ts`、`lib/service/evolution/ConsolidationAdvisor.ts`、`ContentImpactAnalyzer.ts`、`ContentPatcher.ts`、`DecayDetector.ts`、`EnhancementSuggester.ts`、`EvolutionGateway.ts`、`LifecycleStateMachine.ts`、`ProposalExecutor.ts`、`RecipeImpactPlanner.ts`、`RedundancyAnalyzer.ts`、`StagingManager.ts`、`lib/service/panorama/**`、`lib/types/reactive-evolution.ts`。
- 不删除：`ModuleService.ts`、`FileChangeDispatcher.ts`、`FileChangeHandler.ts`、`DaemonFileChangeCollector.ts`、`FileChangeSourceTracker.ts`、Plugin-only `git-diff-checkpoint/**`、`lib/agent/**`、`lib/tools/**`、`lib/injection/**`、`lib/service/delivery/**`、CLI/MCP/HTTP/Dashboard/daemon/transport/provider wiring。
- 阶段 4 已迁的 `KnowledgeFileWriter` / `KnowledgeSyncService` 按阶段 4 的接入和删除计划处理，不归阶段 8 重复删除。

阶段完成记录：

- `docs/alembic-core-stage-8-completion-2026-05-17.md`

## 14. 阶段 9：host-agent 知识挖掘闭环迁移

状态：Core 已完成，提交 `e65a501 Migrate host-agent mining workflow core`。

目标：迁移 bootstrap/rescan 中插件和主仓库共同需要的完整 host-agent 知识挖掘闭环。Core 负责生成任务、证据、briefing、提交协议、校验、状态、持久化和回填；宿主 agent 负责实际分析与执行。Alembic internal AgentRuntime 和 tool system 仍不迁入 Core。

已迁入 Core：

- `src/types/snapshot-views.ts`
- `src/workflows/shared/**`
- `src/workflows/cold-start/ColdStartIntent.ts`
- `src/workflows/cold-start/ColdStartPlan.ts`
- `src/workflows/cold-start/ColdStartPresenters.ts`
- `src/workflows/knowledge-rescan/KnowledgeRescanIntent.ts`
- `src/workflows/knowledge-rescan/KnowledgeRescanWorkflowPlan.ts`
- `src/workflows/knowledge-rescan/KnowledgeRescanPresenters.ts`
- `src/workflows/capabilities/RecipeSnapshotTypes.ts`
- `src/workflows/capabilities/WorkflowCleanupPolicies.ts`
- `src/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts`
- `src/workflows/capabilities/planning/dimensions/TierScheduler.ts`
- `src/workflows/capabilities/planning/dimensions/bootstrapDimensionConfigs.ts`
- `src/workflows/capabilities/planning/knowledge/**`
- `src/workflows/capabilities/presentation/PanoramaSummaryPresenter.ts`
- `src/workflows/capabilities/presentation/TargetFileMapBuilder.ts`
- `src/workflows/capabilities/execution/external/ExternalSubmissionTracker.ts`
- `src/workflows/capabilities/execution/external/MiningSessionStore.ts`
- `src/workflows/capabilities/execution/external/BootstrapSession.ts`
- `src/workflows/capabilities/execution/external/SessionSupport.ts`
- `src/workflows/capabilities/execution/external/ExternalMissionWorkflow.ts`
- `src/workflows/capabilities/execution/external/MissionBriefingSupport.ts`
- `src/workflows/capabilities/execution/external/MissionBriefingBuilder.ts`
- `src/workflows/capabilities/execution/external/EvidenceStarterBuilder.ts`
- `src/workflows/capabilities/execution/external/ExternalDimensionCompletionWorkflow.ts`
- `src/workflows/capabilities/persistence/DimensionCheckpoint.ts`
- `src/workflows/capabilities/persistence/WorkflowReportHistoryStore.ts`
- `src/workflows/capabilities/persistence/WorkflowReportTypes.ts`
- `src/workflows/capabilities/persistence/WorkflowReportWriter.ts`
- `src/workflows/capabilities/persistence/WorkflowResultPersistence.ts`
- `src/workflows/capabilities/persistence/WorkflowSnapshotStore.ts`
- 对应 `index.ts` 和 `package.json` exports。

实现边界补充：

- `ExternalSubmissionTracker` 可以作为 Core 内核完整复制。
- `BootstrapSession` 已替换 `#agent/memory/SessionStore.js` 依赖，Core 使用 `MiningSessionStore` 承接维度报告、证据、跨维度上下文、候选摘要和 checkpoint。
- `ExternalDimensionCompletionWorkflow` 已按 Core 版重建：只保留 input normalization、session lookup、dimension validation、submittedRecipeIds/referencedFiles 恢复、Recipe 绑定、checkpoint、key findings、quality feedback、evidence hints。Skill 生成、`BootstrapEventEmitter`、completion finalizer、delivery verification、nextActions 留外层。
- `MissionBriefingSupport` 已迁 submission schema、response budget、profile、rescan evidence、压缩策略和现有 host-agent submission protocol 文案；`BOOTSTRAP_COMPLETE_ACTIONS` / Cursor/Wiki delivery nextActions 不进入 Core。
- `WorkflowCompletionFinalizer` 与 `CompletionSteps` 当前会执行 Cursor Delivery、Wiki、Panorama、Semantic Memory，不进入 Core。
- `WorkflowResultPersistence` / `DimensionCheckpoint` / `WorkflowSnapshotStore` 已迁宿主无关持久化内核，所有 internal-agent `SessionStore` / `DimensionContext` / `BootstrapEventEmitter` 恢复 helper 留外层。

主源文件：

- `lib/workflows/cold-start/ColdStartIntent.ts`
- `lib/workflows/cold-start/ColdStartPlan.ts`
- `lib/workflows/cold-start/ColdStartPresenters.ts` 中不依赖 MCP/agent/tool 的数据投影部分。
- `lib/workflows/knowledge-rescan/KnowledgeRescanIntent.ts`
- `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflowPlan.ts`
- `lib/workflows/knowledge-rescan/KnowledgeRescanPresenters.ts` 中不依赖 MCP/agent/tool 的数据投影部分。
- `lib/workflows/shared/**`
- `lib/workflows/capabilities/planning/**`
- `lib/workflows/capabilities/project-intelligence/**` 已在阶段 6 处理；本阶段只补 rescan/cleanup 依赖。
- `lib/workflows/capabilities/execution/external/MissionBriefingSupport.ts`
- `lib/workflows/capabilities/execution/external/MissionBriefingBuilder.ts`
- `lib/workflows/capabilities/execution/external/EvidenceStarterBuilder.ts`
- `lib/workflows/capabilities/execution/external/ExternalSubmissionTracker.ts`
- `lib/workflows/capabilities/execution/external/SessionSupport.ts`
- `lib/workflows/capabilities/execution/external/BootstrapSession.ts`
- `lib/workflows/capabilities/completion/**` 中只处理 submission validation / completion state / result finalization 的宿主无关部分。
- `lib/workflows/capabilities/persistence/**` 中只处理 report/checkpoint/snapshot 持久化的宿主无关部分。
- `lib/workflows/capabilities/WorkflowCleanupPolicies.ts` 中不依赖 agent/tool 的清理策略。

关键判断：

- `lib/workflows/capabilities/execution/internal-agent/**` 明确不进入 Core。它属于 Alembic 自己的 agent 能力。
- `lib/workflows/capabilities/execution/external/**` 需要拆分：host-agent mining loop 的任务、证据、briefing、submission、session 状态进入 Core；MCP handler、tool exposure、terminal/tool 调用留外层。
- `lib/workflows/capabilities/completion/**`、`persistence/**` 如果是 submission/result/checkpoint 的闭环状态，进入 Core；如果依赖 agent session 执行器或 tool result transport，留外层。
- `lib/agent/**`、`lib/tools/**` 不作为本阶段依赖被带入 Core。
- Core 输出的是宿主无关协议，不假设 Codex、Claude、Cursor 或 Alembic internal agent。

测试：

- `test/unit/HostAgentMiningWorkflow.test.ts`
- 覆盖：KnowledgeRescan intent、KnowledgeRescan plan/evidence projection、MissionBriefing rescan profile、ExternalDimensionCompletion session/recovery/binding/checkpoint。
- `BootstrapRescanState.test.ts` 仍保留外层，因为它属于 internal-agent bootstrap state。
- `RealProjectBootstrap.test.ts` 中依赖 internal agent/tool 的部分仍保留外层；Core 已通过 project-intelligence 和 host-agent workflow 单测覆盖宿主无关切片。
- internal agent execution 和 tool execution 相关测试保留在外层，不迁入 Core。

Core 验证：

- `npm run build:check` 通过。
- `npm run test` 通过：45 个测试文件、847 个测试。
- `npm run build` 通过。
- 阶段 9 变更文件 Biome 检查通过：
  - `npx biome check package.json src/types/index.ts src/types/snapshot-views.ts src/workflows/capabilities/RecipeSnapshotTypes.ts src/workflows/capabilities/WorkflowCleanupPolicies.ts src/workflows/capabilities/execution src/workflows/capabilities/index.ts src/workflows/capabilities/persistence src/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts src/workflows/capabilities/planning/dimensions/TierScheduler.ts src/workflows/capabilities/planning/dimensions/bootstrapDimensionConfigs.ts src/workflows/capabilities/planning/dimensions/index.ts src/workflows/capabilities/planning/knowledge src/workflows/capabilities/presentation/PanoramaSummaryPresenter.ts src/workflows/capabilities/presentation/TargetFileMapBuilder.ts src/workflows/capabilities/presentation/index.ts src/workflows/cold-start src/workflows/index.ts src/workflows/knowledge-rescan src/workflows/shared test/unit/HostAgentMiningWorkflow.test.ts`
- `npm run lint` 全仓仍被既有 baseline 诊断阻断，首批来自 `src/core/AstAnalyzer.ts`、`src/core/ast/ProjectGraph.ts`、`src/core/ast/ensure-grammars.ts` 等阶段 9 未改文件；阶段 9 新增/修改文件未新增 lint 问题。
- package self-reference smoke 通过：
  - `@alembic/core/workflows`
  - `@alembic/core/workflows/cold-start`
  - `@alembic/core/workflows/knowledge-rescan`
  - `@alembic/core/workflows/capabilities/execution/external`
  - `@alembic/core/workflows/capabilities/planning/knowledge`
  - `@alembic/core/workflows/capabilities/persistence`
  - `@alembic/core/types/snapshot-views`

外层接入任务：

- 两个外层仓库先把 `vendor/AlembicCore` 或模块依赖更新到 `e65a501` 或之后提交。
- Alembic CLI/MCP/HTTP bootstrap/rescan handlers 调用 Core 的 `createExternalWorkflowSession`、`buildExternalMissionBriefing`、`runExternalDimensionCompletionWorkflow` 生成 host-agent mining session，再由 Alembic 外层选择 internal agent 或外部宿主执行。
- Plugin Codex MCP bootstrap/rescan handlers 调用 Core 的同一组 workflow 能力，由 Codex 宿主 agent 执行，并把 knowledge submission / dimension completion 回传给 Core 校验、绑定、checkpoint 和落库。
- 外层 import 建议：
  - `@alembic/core/workflows/cold-start`
  - `@alembic/core/workflows/knowledge-rescan`
  - `@alembic/core/workflows/capabilities/execution/external`
  - `@alembic/core/workflows/capabilities/planning/knowledge`
  - `@alembic/core/workflows/capabilities/persistence`
  - `@alembic/core/types/snapshot-views`
- 外层需要注入或包装：
  - `knowledgeService`
  - `knowledgeGraphService`
  - `cleanupService` 或 `createCleanupService`
  - `database`
  - `writeZone`
  - progress/event emitter
  - skill generation
  - completion finalizer
  - Cursor/Wiki/Plugin delivery nextActions
- Alembic 外层保留 internal-agent 执行路径；internal-agent 可复用 Core planning/session/report 类型，但 `lib/workflows/capabilities/execution/internal-agent/**` 不迁移。
- Codex preflight、transport、MCP tool exposure、tool 参数 schema、权限检查继续在 Plugin。

建议扫描：

```bash
rg -n "from ['\"](#workflows/(cold-start|knowledge-rescan|shared)|#workflows/capabilities/(execution/external|planning/knowledge|persistence|presentation)|#types/snapshot-views|\\.\\.?/.*lib/workflows/(cold-start|knowledge-rescan|shared)|\\.\\.?/.*lib/workflows/capabilities/(execution/external|planning/knowledge|persistence|presentation)|\\.\\.?/.*lib/types/snapshot-views)" lib bin test
```

边界保留检查：

```bash
rg -n "internal-agent|WorkflowSkillCompletionCapability|BootstrapEventEmitter|WorkflowCompletionFinalizer|CompletionSteps|CursorDelivery|WikiGenerator|PersistentMemory|MemoryEmbeddingStore|lib/tools|tool router|ServiceContainer|MCP|HTTP|Codex preflight|transport" lib bin test
```

删除计划：

- 两个外层仓库完成接入、扫描无遗留、代表测试通过后，才删除重复实现。
- 可删除候选：`lib/types/snapshot-views.ts`、`lib/workflows/shared/**`、`lib/workflows/cold-start/ColdStartIntent.ts`、`ColdStartPlan.ts`、`ColdStartPresenters.ts` 中已由 Core 接管的 projection/intent/plan 部分、`lib/workflows/knowledge-rescan/KnowledgeRescanIntent.ts`、`KnowledgeRescanWorkflowPlan.ts`、`KnowledgeRescanPresenters.ts` 中已由 Core 接管的 projection/intent/plan 部分、`lib/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts`、`TierScheduler.ts`、`bootstrapDimensionConfigs.ts`、`lib/workflows/capabilities/planning/knowledge/**`、`lib/workflows/capabilities/presentation/PanoramaSummaryPresenter.ts`、`TargetFileMapBuilder.ts`、`lib/workflows/capabilities/execution/external/ExternalSubmissionTracker.ts`、`MissionBriefingSupport.ts`、`MissionBriefingBuilder.ts`、`EvidenceStarterBuilder.ts`、`SessionSupport.ts`、`BootstrapSession.ts` 中 Core 已接管的 host-agent session 部分、`lib/workflows/capabilities/persistence/DimensionCheckpoint.ts`、`WorkflowReportHistoryStore.ts`、`WorkflowReportTypes.ts`、`WorkflowReportWriter.ts`、`WorkflowResultPersistence.ts`、`WorkflowSnapshotStore.ts` 中 Core 已接管的宿主无关持久化部分。
- 不删除：`lib/workflows/capabilities/execution/internal-agent/**`、`WorkflowSkillCompletionCapability.ts`、`BootstrapEventEmitter`、`WorkflowCompletionFinalizer.ts`、`CompletionSteps.ts`、Alembic internal agent execution、`lib/tools/**`、MCP/HTTP/Codex handler、transport、preflight、permission policy、Cursor/Wiki/Plugin delivery nextActions、Dashboard/daemon wiring。

阶段完成记录：

- `docs/alembic-core-stage-9-completion-2026-05-17.md`

## 15. 阶段 10：Guard 免疫系统迁移

目标：完整迁移 Guard，不只迁一个 checker。

执行记录：

- 2026-05-17 已完成阶段 10。
- 完成记录见 `docs/alembic-core-stage-10-completion-2026-05-17.md`。
- 本阶段完整迁入 Guard service 目录、Guard violation repository、Core service exports、package exports 和 Guard 闭环测试；HTTP/MCP/CLI handler 仍留外层。

主源文件：

- `lib/service/guard/**`
- `lib/repository/guard/**`
- `lib/service/guard/ReverseGuard.ts`
- Guard 依赖的 AST、SourceFileCollector、CoverageAnalyzer、RuleLearner、FeedbackLoop、ViolationsStore。

规则：

- `GuardService` 生命周期、audit、knowledgeRepository 集成必须保留。
- `GuardCheckEngine`、cross-file checks、scope filtering、uncertainty collector 不可拆薄。
- HTTP/MCP handler 留外层，但 handler 调 Core Guard。

测试：

- `GuardScopeFiltering.test.ts`
- `ReverseGuard.test.ts`
- `GuardServiceFlow.test.ts`
- `GuardCheck.test.ts`
- `GuardImmuneSystem.test.ts`
- `cross-module/GuardImmuneWiring.test.ts`

外层接入任务：

- 两个外层仓库先把 `vendor/AlembicCore` 或模块依赖更新到阶段 10 提交或之后。
- Alembic HTTP guard routes、CLI guard、ProjectIntelligence 中的 guard audit 调用点改用 Core Guard service。
- Alembic ServiceContainer 中 guardService / guardCheckEngine / complianceReporter / ruleLearner / violationsStore 的实例化改为 Core class。
- AlembicPlugin Codex MCP guard handler 改用 Core Guard service；MCP tool schema、preflight、transport、权限策略继续留在 Plugin。
- 推荐 import：
  - `@alembic/core/service/guard`
  - `@alembic/core/service/guard/GuardService`
  - `@alembic/core/service/guard/GuardCheckEngine`
  - `@alembic/core/service/guard/ComplianceReporter`
  - `@alembic/core/service/guard/ReverseGuard`
  - `@alembic/core/repository/guard`

接入扫描：

```bash
rg -n "lib/service/guard|service/guard/Guard|service/guard/ReverseGuard|service/guard/ComplianceReporter|service/guard/RuleLearner|repository/guard/GuardViolationRepository" lib bin test
```

删除计划：

- 接入完成、扫描无遗留、代表测试通过后，才删除外层 `lib/service/guard/**` 与 `lib/repository/guard/**` 重复实现。
- 不删除 CLI/HTTP/MCP handler、Codex tool schema、transport、preflight、权限策略、Dashboard/daemon wiring、外层 ServiceContainer 装配代码、Alembic internal agent/tool system。

## 16. 阶段 11：交付渠道留外层

目标：明确 delivery、context injection、AGENTS.md/Skills 生成、IDE/Codex 注入和插件交付渠道都属于外层能力。Core 不实现多渠道交付，不提供通用 delivery repository，不抽象 Cursor/Codex/IDE/Plugin 的投递渠道。

执行记录：

- 2026-05-17 已完成阶段 11。
- 完成记录见 `docs/alembic-core-stage-11-completion-2026-05-17.md`。
- 本阶段不迁移 delivery 实现，只新增 Core 边界测试 `test/CoreDeliveryBoundary.test.ts`，防止误引入 delivery/tool/agent/Codex/MCP/plugin 目录、exports、典型实现文件或外层 import。

默认不迁移的文件：

- `lib/service/delivery/KnowledgeCompressor.ts`
- `lib/service/delivery/TokenBudget.ts`
- `lib/service/delivery/TopicClassifier.ts`
- `lib/service/delivery/RulesGenerator.ts`
- `lib/service/delivery/AgentInstructionsGenerator.ts`
- `lib/service/delivery/FileProtection.ts`
- `lib/service/delivery/SkillsSyncer.ts`
- `lib/service/delivery/CursorDeliveryPipeline.ts`
- `lib/repository/delivery/DeliveryRepoAdapter.ts`

规则：

- `CursorDeliveryPipeline`、`RulesGenerator`、`SkillsSyncer`、`AgentInstructionsGenerator`、`DeliveryRepoAdapter` 都留在 Alembic/AlembicPlugin 外层。
- 插件交付会有独立渠道，留在 AlembicPlugin；Core 不实现插件交付，也不关心插件交付格式。
- Core 只负责产出可查询、可校验、可持久化的知识结果；外层决定如何把这些结果投递到 Cursor、Codex、IDE、plugin channel 或其它渠道。
- 如果后续确有两个仓库共同需要的纯压缩/预算算法，必须单独作为 utility 阶段提出，经用户确认后再完整复制，不顺手迁整条 delivery pipeline，也不引入多渠道交付抽象。
- `AGENTS.md` 生成逻辑不进入 Core。

测试：

- `CursorDeliveryPipeline.test.ts`
- `DeliveryCompletionStep.test.ts`
- TokenBudget、KnowledgeCompressor、AgentInstructionsGenerator 的现有或补迁测试。

以上测试保留在外层，用于验证外层 delivery 行为不因 Core 接入而回退。

外层接入任务：

- Alembic CLI `cursor-rules`/`upgrade` 继续使用外层 delivery。
- Plugin injectable skills 同步、channel/plugin 发布、独立交付渠道继续留在 Plugin。

删除计划：

- 无 Core 删除计划。
- 不删除外层 delivery service 或 Plugin 独立交付渠道。

## 17. 阶段 12：Tool system 不迁移

目标：明确 Alembic 的 tool system 不进入 Core。插件不需要 Core 内置 Alembic tool catalog/router/handler；插件通过 Codex MCP 暴露工具，工具编排属于 Plugin 外层。

执行记录：

- 2026-05-17 已完成阶段 12。
- 完成记录见 `docs/alembic-core-stage-12-completion-2026-05-17.md`。
- 本阶段不迁移 `lib/tools/**`，只新增 Core 边界测试 `test/CoreToolSystemBoundary.test.ts`，防止误引入 tool-system 目录、exports、典型实现文件、外层 import，且确认 host-agent workflow 不引用 Alembic tool router 类。

不迁移的文件：

- `lib/tools/core/**`
- `lib/tools/catalog/**`
- `lib/tools/v2/types.ts`
- `lib/tools/v2/registry.ts`
- `lib/tools/v2/router.ts`
- `lib/tools/v2/capabilities/**`
- `lib/tools/v2/adapter/**`
- `lib/tools/v2/compressor/**`
- `lib/tools/v2/cache/**`
- `lib/tools/adapters/terminal-policy/**`
- `lib/tools/adapters/terminal-capabilities/**`

规则：

- Tool catalog、Tool contracts、V2 router、tool handlers、terminal/mac/dashboard/skill adapters、terminal policy、tool output compressor 全部留在外层。
- 不以“headless contract”为理由迁入 Core；这仍然属于 Alembic 工具系统的一部分。
- 如果某个 parser/cache 被 search、guard、repository 直接共享，需要在对应服务阶段重新归档为该服务的内核文件，而不是从 `lib/tools/**` 整体迁入。

验收要求：

- Core 源码中不得出现 `#tools/` import。
- Core 的 host-agent mining loop 不通过 Alembic tool router 执行，它只定义 submission contract 和状态收敛逻辑。

测试：

- `V2ToolSystem.test.ts`
- `ToolExecutionPipeline.test.ts`
- `ToolForgeIntegration.test.ts`
- `ToolRequirementAnalyzer.test.ts`
- `TemporaryToolRegistry.test.ts`
- `v2/ToolRegistryV2.test.ts`

以上测试保留在 Alembic/AlembicPlugin 外层，不迁入 Core。

外层接入任务：

- Alembic MCP/tool handlers 继续使用外层 tool system。
- Plugin Codex MCP tools 继续由 Plugin 暴露和治理。

删除计划：

- 无 Core 删除计划。
- 不删除外层 `lib/tools/**`。

## 18. 阶段 13：Codex 边界留在 Plugin

目标：明确 Codex runtime、preflight、tool policy、MCP tool metadata 都留在 AlembicPlugin。Core 不承载 Codex host 边界，也不承载 Codex tool exposure。

默认不迁移的文件：

- `AlembicPlugin/lib/codex/KnowledgeState.ts`
- `AlembicPlugin/lib/codex/Preflight.ts`
- `AlembicPlugin/lib/codex/ToolPolicy.ts`
- `AlembicPlugin/lib/codex/StatusService.ts` 中纯状态计算部分。
- `AlembicPlugin/lib/external/mcp/tools.ts` 中可复用 tool metadata。

明确留在 Plugin：

- `lib/codex/RuntimeContext.ts`
- `lib/codex/Diagnostics.ts`
- `lib/codex/ProjectRootResolver.ts`
- `lib/codex/PluginRegistry.ts`
- `lib/external/mcp/CodexMcpServer.ts`
- `channels/**`
- `plugins/alembic-codex/**`
- `scripts/*codex*`

规则：

- Plugin 可以调用 Core workspace/domain/storage/search/guard/host-agent mining loop 等服务，但 Codex 如何判断可见工具、如何 preflight、如何列 tool metadata，仍由 Plugin 自己负责。
- 不把 `ToolPolicy` 或 Codex MCP tool metadata 提取到 Core。
- 如果 `KnowledgeState` 里存在与 Core repository/storage 完全重复的纯读取逻辑，优先让 Plugin 直接调用 Core service，不把 Codex 状态文件迁到 Core。

测试：

- `CodexKnowledgeState.test.ts`
- `CodexToolPolicy.test.ts`
- `CodexStatusService.test.ts` 中纯计算部分。
- `CodexMcpServer.test.ts` 仍在 Plugin，用于验证接入后行为。

以上测试全部留在 Plugin，不迁入 Core。

执行记录：

- Core 新增 `test/CoreCodexBoundary.test.ts`，锁定 Codex/MCP/plugin/channel/marketplace 目录、exports、dependencies、典型实现文件、import pattern 和 host-agent workflow 引用边界。
- 本阶段提交：`be15964 Lock Codex boundary outside core`。
- 验证通过：`npx vitest run test/CoreCodexBoundary.test.ts`、`npx biome check test/CoreCodexBoundary.test.ts`、`npm run build:check`、`npm run test`、`npm run build`。
- 阶段记录：`docs/alembic-core-stage-13-completion-2026-05-17.md`。

外层接入任务：

- AlembicPlugin Codex MCP server 调用 Core 基础服务和 host-agent mining loop，但 preflight/policy/tool metadata、runtime diagnostics、plugin registry、channel/plugin 发布继续在 Plugin。
- `KnowledgeState` 若只是在读取 Core 已拥有的数据，外层改为调用 Core service；不要把 Codex 状态文件迁到 Core。
- Alembic 本体如果仍保留 Codex CLI 辅助命令或 MCP shim，不从 Core 引入 Codex 边界契约。

删除计划：

- 无 Core 删除计划。
- 不删除 Codex MCP/server/runtime/channel/plugin 发布链路。
- 不迁移 `CodexKnowledgeState.test.ts`、`CodexToolPolicy.test.ts`、`CodexStatusService.test.ts`、`CodexMcpServer.test.ts` 到 Core。

## 19. 阶段 14：外层接入、边界收敛与删除

目标：在 Core 完整迁移和边界固化后，让两个外层仓库通过 import 替换接入 Core。外层仓库可以变薄，但不是变空；adapter、transport、delivery、Codex/plugin/channel、internal agent/tool system 等宿主能力必须继续留在外层。

Alembic 应保留：

- CLI、Dashboard、HTTP server、Lark、macOS/native UI、IDE installer、release scripts。
- 对 Core 的组合、启动、展示、发布、配置管理。
- `lib/agent/**`、`lib/tools/**`、delivery/instructions、internal agent execution、MCP/HTTP/CLI transport。

AlembicPlugin 应保留：

- Codex MCP server、Codex runtime env、plugin/channel/marketplace 发布资产。
- Codex host preflight 包装、daemon supervisor 接入、plugin cache sync。
- Codex tool exposure、tool policy、MCP tool metadata、plugin skills/marketplace 资产。
- 调用 Core host-agent mining loop 的 Codex adapter。
- 插件独立交付渠道和发布/投递编排。

外层接入顺序：

1. 先加 `@alembic/core` dependency 或 workspace reference。
2. 先替换已在 Core 中完成的稳定层：shared/workspace、domain、database/repository、event/job/report、project intelligence、search/vector、knowledge service、host-agent mining loop、guard。
3. 一层一层替换 imports，不做大爆炸替换；每替换一层，跑对应外层测试。
4. 保留外层 adapter：CLI、Dashboard、HTTP/MCP transport、Codex preflight/tool metadata、delivery/instructions、plugin/channel 发布、Alembic internal agent/tool system。
5. 删除计划必须和 import 替换同 PR/commit 文档绑定；没有测试覆盖前只标记候选，不直接删除。

Core 当前窗口职责：

- 不继续向 Core 搬 Codex runtime、delivery、tool system 或 internal agent。
- 只维护 Core 边界测试、公共 API、兼容导出和接入问题修复。
- 由文档给 Alembic / AlembicPlugin 其他窗口布置接入和删除任务。

完整验收：

- Core：`npm run build:check`，阶段测试全绿。
- Alembic：`npm run build:check`，关键 unit/integration，CLI smoke。
- AlembicPlugin：`npm run build:check`，Codex MCP/unit/session/plugin smoke。
- 三仓库 `git status --short` 可解释。
- `AGENTS.md` 均保留。

## 20. 每阶段完成清单

阶段完成前必须逐项确认：

- 源文件已完整复制，或有用户确认的例外。
- 依赖闭包没有被薄实现替代。
- 对应测试已迁移或外层测试已保留并记录。
- Core build/typecheck 通过。
- 外层接入任务已经写入阶段记录。
- 删除计划只列候选，不在当前窗口直接删外层代码。
- 如果遇到 AI/provider/host adapter 边界不清楚，已经暂停并向用户确认。
- host-agent 知识挖掘闭环在 Core 内是完整的：plan → evidence/briefing → host submission → validation → persistence → SourceRef/Knowledge/Recipe 回填 → retry/report。
- 没有把 `lib/agent/**`、`lib/tools/**`、Codex tool/preflight、delivery/instructions、多渠道交付或插件独立交付渠道带入 Core。

## 21. 第一批实际执行建议

下一步只做阶段 0 和阶段 1：

1. 在 `AlembicCore` 配好测试/构建/ignore 基础，不动业务代码。
2. 完整复制 shared 基础工具，迁移 shared 测试。
3. 提交 Core 阶段 1。
4. 生成阶段 1 外层接入与删除计划，交给其他窗口执行。

阶段 1 未通过前，不进入 workspace、SQLite、workflow、Guard 等大模块。
