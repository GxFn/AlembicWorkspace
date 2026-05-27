# Alembic 低频 / 冗余功能拆除边界扫描

日期：2026-05-13

## 0. 范围和原则

本文只记录拆除候选、迁出边界和风险，不直接要求删除实现。

Alembic 当前不是一个单一 CLI，而是由 CLI、MCP、Codex 插件、HTTP API、Dashboard、VSCode 扩展、Lark Remote、工作流、Agent Runtime 和发布脚本共同组成。低频能力不能按“看起来复杂”直接删，必须先判断它是否仍承担以下角色：

1. 主路径：Codex/MCP prime、search、guard、submit、bootstrap/rescan。
2. 产品外壳：Dashboard、Codex 插件、VSCode 扩展、README 中承诺的用户入口。
3. 兼容桥：旧数据、旧 CLI、旧 IDE 配置、迁移/同步/修复工具。
4. 实验能力：可以默认关闭或插件化，但不能静默改成空壳。

如果后续动作涉及删减、默认关闭、插件化迁出、去掉入口或降低完整能力，需要先确认产品边界。

排除依据：

- 本文不采信 `docs-dev/mainline-*` 或 `docs-dev/rearchitecture/*` 中关于 mainline 的设想、替代关系和退场结论。
- mainline 属于此前已回滚的优化尝试，不能作为当前架构事实。
- 本文依据只来自当前源码入口、静态引用、README / package scripts / 测试暴露面，以及文件自身注释。

## 1. 扫描摘要

本次静态扫描覆盖：

- `lib/`：694 个源码文件，约 5.8 MB。
- `dashboard/src/`：78 个源码文件，约 1.3 MB。
- `resources/vscode-ext/src/`：12 个源码文件，约 113 KB。
- `scripts/`：18 个脚本。
- `bin/`：5 个入口：CLI、MCP、Codex MCP、API Server、Daemon。

主要入口：

- CLI：`bin/cli.ts`，包含 setup / codex / ai / daemon / coldstart / rescan / evolve-check / ais / search / guard / panorama / server / ui / embed / upgrade / cursor-rules / sync / ghost 等。
- MCP：`bin/mcp-server.ts`，完整 Alembic MCP 工具面。
- Codex MCP：`bin/codex-mcp.ts`，轻量 shim，主要服务 Codex 插件。
- HTTP / Dashboard：`bin/api-server.ts`、`bin/daemon-server.ts`、`lib/http/HttpServer.ts`。
- VSCode 扩展：`resources/vscode-ext/`，独立 `tsconfig`，被 `npm run check` 绑定。

高风险事实：

- `lib/http/routes/remote.ts` 有 1177 行，路由加载时注册 Lark 自动启动、健康检查和队列清理定时器。
- `WorkflowCompletionFinalizer` 默认执行 delivery、panorama，默认 schedule wiki 和 semantic memory。
- `PanoramaModule` 默认注册进 `ServiceContainer`，Dashboard 有独立 Panorama tab，HTTP route 有 10 个 endpoint。
- `GuardModule` 默认注册 ReverseGuard、ComplianceReporter、CoverageAnalyzer、RuleLearner 等高级审计服务。
- `ToolForge` 默认注册，`ToolExecutionPipeline` 中 allowlist fallback 会查询 `toolForge`。
- README 仍声明 Xcode `alembic watch` + Snippet sync，但当前 CLI 没有 `watch` 命令，`SetupService` 也标注 Snippet 初始化已移除。

## 2. 可以进入删除池的小边界

这些候选要先过一次测试和发布面确认，但从当前源码可达性看，适合优先处理。

### 2.1 `CrossEncoderReranker`

路径：

- `lib/service/search/CrossEncoderReranker.ts`
- `test/unit/SearchRanking.test.ts`

证据：

- `KnowledgeModule` 构造 `SearchEngine` 时显式传 `crossEncoderReranker: null`。
- 当前生产源码未见注册；直接引用主要来自 `test/unit/SearchRanking.test.ts`。
- docs-dev 中的 mainline / rearchitecture 历史文档不作为本条证据。

建议边界：

- 可以作为 R1 删除候选：删除实现、删除或调整 `SearchRanking` 中 CrossEncoder 分组。
- `SearchTypes.SearchCrossEncoder` 和 `SearchEngine` 的可选接口可先保留一轮，避免同时碰 SearchEngine 主体。
- 不要借此删除 `SearchEngine`、BM25、HybridRetriever、VectorService，这些仍是搜索和 README 承诺的一部分。

### 2.2 `RecipeReadinessChecker` 薄兼容层

路径：

- `lib/domain/knowledge/RecipeReadinessChecker.ts`
- `test/unit/KnowledgeAPI.test.ts` mock 引用

证据：

- 文件注释明确说它已重构为 `UnifiedValidator` 的薄封装。
- 静态引用主要来自测试 mock；生产路径未见直接调用。

建议边界：

- 可以作为 R1 删除候选，但要先确认外部 API / 老测试是否仍按这个模块 mock。
- 删除前把测试 mock 改到 `UnifiedValidator` 或对应 HTTP handler 的真实依赖。

### 2.3 已废弃的 CLI `task list`

路径：

- `bin/cli.ts` 的 `task` 命令段

证据：

- 命令描述已写“已迁移到 MCP”。
- 子命令只输出迁移提示，没有实际功能。

建议边界：

- 可以保留一个 release 周期的 deprecation notice，然后移除 CLI `task` 命令。
- 迁出后文档统一指向 `alembic_task({ operation: "prime" })`。

### 2.4 `OpenBrowser` / AppleScript 浏览器复用

路径：

- `lib/platform/OpenBrowser.ts`
- `resources/openChrome.applescript`

证据：

- 当前静态引用几乎只有文件自身；Codex dashboard 工具返回 URL，不再自动打开浏览器。
- `resources/openChrome.applescript` 仍被打进 runtime。

建议边界：

- 如果没有仍在用的“复用 Chrome tab”产品入口，可以进入 R1 删除候选。
- 若保留，只应归入 optional platform helper，不应默认打进核心 runtime。

## 3. 应先默认关闭 / 移到 Advanced 的边界

这些不是删除候选。它们有实际功能和测试，但不应默认压在主路径上。

### 3.1 Workflow completion 尾部副作用

路径：

- `lib/workflows/capabilities/completion/WorkflowCompletionFinalizer.ts`
- `lib/workflows/capabilities/completion/CompletionSteps.ts`

当前默认：

- `semanticMemory.mode ?? 'scheduled'`
- `steps.delivery ?? 'run'`
- `steps.panorama ?? 'run'`
- `steps.wiki ?? 'schedule'`

建议边界：

- 第一阶段只加配置开关，不改默认。
- 第二阶段把默认改为：delivery skip、panorama skip、wiki skip/manual、semanticMemory skip/manual。
- `runCursorDelivery`、`refreshPanorama`、`generateWiki`、`consolidateSemanticMemory` 保留为显式 Advanced/manual 能力。

受影响测试：

- `test/unit/WorkflowCompletionFinalizer.test.ts`
- `test/unit/WorkflowResultPersistence.test.ts`
- `test/unit/SemanticMemoryCompletionStep.test.ts`

### 3.2 Panorama

路径：

- `lib/service/panorama/*`
- `lib/injection/modules/PanoramaModule.ts`
- `lib/http/routes/panorama.ts`
- `dashboard/src/components/Views/PanoramaView.tsx`

证据：

- Panorama 服务层约 10 个文件，HTTP route 有 10 个 endpoint。
- Dashboard 有独立 tab。
- `ProjectIntelligenceRunner.DEFAULT_PROJECT_ANALYSIS_MATERIALIZATION.panorama` 为 `true`。
- `ColdStartPlan` 和 `KnowledgeRescanWorkflowPlan` 都默认 `panorama: true`。

建议边界：

- 不删 Panorama。
- 先把默认 materialization 改成可配置。
- 主链路只消费已有结构事实；全量 Panorama refresh 作为 Dashboard / CLI / MCP 的手动入口。

### 3.3 Guard 高级审计面

路径：

- `lib/service/guard/ReverseGuard.ts`
- `lib/service/guard/ComplianceReporter.ts`
- `lib/service/guard/CoverageAnalyzer.ts`
- `lib/service/guard/RuleLearner.ts`
- `lib/http/routes/guardReport.ts`
- `lib/external/mcp/handlers/guard.ts`

证据：

- `GuardModule` 默认注册这些服务。
- MCP `alembic_guard` 支持 `reverse_audit`、`coverage_matrix`、`compliance_report`。
- HTTP 有 `/guard/report`、`/guard/report/reverse`、`/guard/report/coverage`。

建议边界：

- 不删类级实现和测试。
- 默认 Guard 主路径只保留 forward check。
- ReverseGuard / Coverage / Compliance 作为 Advanced/manual audit。
- `RuleLearner` 只保留候选/信号，不自动调规则。

### 3.4 ToolForge 动态工具

路径：

- `lib/agent/forge/*`
- `lib/injection/modules/AgentModule.ts`
- `lib/agent/runtime/ToolExecutionPipeline.ts`

证据：

- `AgentModule` 默认注册 `toolForge`。
- `allowlistGate` 对不在白名单的工具会查 `toolForge.temporaryRegistry`，确认是临时工具就放行。
- 生产引用很窄，主要是注册点、fallback 点和测试。

建议边界：

- 不删 `ToolForge`。
- 加 `tools.dynamicToolFallback` / `tools.toolForge` feature flag。
- 默认关闭 fallback；实验模式显式开启。
- `container.get('toolForge')` 应安全查询，避免关闭注册后未知工具路径 throw。

### 3.5 Wiki 生成

路径：

- `lib/service/wiki/WikiGenerator.ts`
- `lib/service/wiki/WikiRenderers.ts`
- `lib/service/wiki/WikiUtils.ts`
- `lib/http/routes/wiki.ts`
- `dashboard/src/components/Views/WikiView.tsx`

证据：

- Wiki 约 4.3K 行服务代码。
- Completion 默认 schedule wiki。
- HTTP 和 Dashboard 都有手动入口。

建议边界：

- 默认主链路不 schedule。
- 保留 Dashboard / MCP / HTTP 手动导出。
- 不把 Wiki 作为 bootstrap/rescan 完成阶段的必跑副作用。

## 4. 适合插件化 / 可选包化的产品边界

这些能力不是“垃圾代码”，但它们把核心包的范围拉得很宽。建议拆成可选产品包或安装项。

### 4.1 Lark Remote + VSCode Remote Poller + 截图链路

路径：

- `lib/http/routes/remote.ts`
- `lib/external/lark/LarkTransport.ts`
- `lib/external/lark/IntentClassifier.ts`
- `lib/repository/remote/RemoteCommandRepository.ts`
- `lib/infrastructure/database/migrations/003_add_remote_commands.ts`
- `lib/infrastructure/notification/LarkNotifier.ts`
- `resources/vscode-ext/src/remoteCommandPoller.ts`
- `lib/platform/ScreenCaptureService.ts`
- `resources/native-ui/screenshot.swift`

证据：

- `remote.ts` 1177 行，包含 Lark WS、Webhook、远程队列、截图上传、主动通知、自动重连。
- `@larksuiteoapi/node-sdk` 是主包 dependencies。
- 路由被 `HttpServer` 无条件挂载。
- 路由模块加载时注册自动启动 / 健康检查 / 队列清理定时器；没有 Lark 凭证时会跳过连接，但代码仍进入核心 API surface。
- VSCode remote poller 是 Lark → IDE 编程桥的一半，默认配置项是 false，但代码会自动探测 Lark 连接后启动。

建议边界：

- 不直接删。README 已把 Lark 作为产品能力宣传。
- 先增加总开关：`remote.lark.enabled`，默认关闭或仅凭证存在时 lazy-load route。
- 中期把 Lark Remote 抽成插件包：route、transport、repository、migration、notifier、VSCode poller 协议一起迁。
- 截图链路只服务 Lark 和 macOS tool adapter，适合随 Lark/macOS optional capability 迁出。

### 4.2 VSCode 扩展

路径：

- `resources/vscode-ext/*`
- `scripts/install-vscode-copilot.ts`
- `scripts/install-cursor-skill.ts`
- `package.json` 的 `build:vscode-ext`、`package:vscode-ext`、`check`

证据：

- VSCode 扩展有独立 package、12 个源码文件。
- 根 `npm run check` 会强制 `npm run build:vscode-ext`。
- 扩展包含 search、create candidate、audit、Guard diagnostics、CodeLens、file change collector、remote poller、Copilot language model tool。
- 它和 daemon 里的 `DaemonFileChangeCollector` 有重叠职责：文件变更捕获与心跳协调。

建议边界：

- 如果 Alembic 核心目标收束到 Codex MCP / CLI / Dashboard，VSCode 扩展应迁为独立发布包。
- 核心仓库可以保留协议和 API，扩展源码/构建/packaging 迁出。
- 如果继续保留，至少不要让根 `check` 被 VSCode 扩展发布链路阻塞；改为独立 CI job。

### 4.3 macOS ScreenCapture / MacSystemAdapter

路径：

- `lib/tools/adapters/MacSystemAdapter.ts`
- `lib/tools/adapters/MacSystemCapabilities.ts`
- `lib/platform/ScreenCaptureService.ts`
- `resources/native-ui/screenshot.swift`

证据：

- Mac system capabilities 标记为 `experimental`，但由 `AgentModule` 默认注册进 runtime tool catalog。
- 截图 helper 需要 macOS ScreenCaptureKit 和 TCC 权限。
- 非 macOS 会返回 blocked/unavailable，但仍是核心能力清单的一部分。

建议边界：

- 默认 runtime catalog 不注册 macOS sensitive capability。
- 将 macOS helper 和 Swift 编译脚本迁到 optional platform package。
- Lark screenshot 若保留，应依赖该 optional package。

### 4.4 Xcode / Snippet 宣传边界

路径：

- `README.md` / `README_CN.md`
- `lib/domain/snippet/Snippet.ts`
- `lib/infrastructure/config/Paths.ts`
- `lib/cli/SetupService.ts`

证据：

- README 声明 Xcode 使用 `alembic watch` + file directives + Snippet sync。
- 当前 CLI 没有 `watch` 命令。
- `SetupService` 注释写 “Snippet 初始化（已移除 — AI-first 迁移）”。
- `Snippet` 实体和 snippet path helper 仍存在。

建议边界：

- 先修正文档或补齐真实入口，二者择一。
- 如果 AI-first 后不再支持 snippet sync，删除 README 中 Xcode watch/snippet 承诺，并将 Snippet 实体列入兼容层删除候选。
- 不要只保留文档承诺而让实现缺口继续扩大。

## 5. 不应误删的静态扫描误报

以下文件看起来低可达，但其实是动态加载或迁移边界，不能按静态 inbound 为 0 删除。

### 5.1 `lib/core/ast/lang-*`

证据：

- `lib/core/ast/index.ts` 的 `LANG_REGISTRY` 用动态 `import(entry.module)` 加载语言插件。
- 静态 import graph 会误报这些文件没有入口。

结论：

- 不删。
- 如要裁剪语言支持，必须先确认产品支持矩阵和 grammar 资源包。

### 5.2 数据库 migrations

证据：

- migration 文件由迁移系统按编号加载，静态 inbound 不代表不用。

结论：

- 不删历史 migration。
- 可以考虑 squash，但那是数据库兼容策略，不属于低频功能拆除。

### 5.3 `*.d.ts` 和 wire 类型

证据：

- 类型声明经常只被编译器消费。

结论：

- 不能按 runtime reachability 删除。

## 6. 推荐执行顺序

### Phase A：零行为变更的边界整理

1. 在 `docs-dev/` 持续维护拆除清单。
2. 给候选加 owner / surface / status 标记。
3. 修正文档与代码不一致：`CrossEncoderReranker` “已删除”但源码仍在；Xcode `alembic watch` 文档存在但 CLI 不存在。

### Phase B：先加开关，不改默认

1. completion：delivery、panorama、wiki、semanticMemory。
2. guard advanced：reverseGuard、coverage、compliance、ruleLearner。
3. tools：ToolForge fallback。
4. remote：Lark route/timers。
5. platform：macOS sensitive tools。

### Phase C：默认关闭低频副作用

1. completion 默认 skip/manual。
2. Panorama materialization 默认 false，仅手动 refresh。
3. ReverseGuard / Coverage / Compliance 只在显式 operation 时构造。
4. ToolForge 不进入默认 DI。
5. Lark Remote 不因 HTTP route import 自动启动定时器。

### Phase D：删除小候选

1. `CrossEncoderReranker`。
2. `RecipeReadinessChecker`。
3. CLI `task list` no-op。
4. `OpenBrowser` / `openChrome.applescript`，前提是确认没有用户入口。

### Phase E：插件化大边界

1. Lark Remote。
2. VSCode Extension。
3. macOS ScreenCapture/MacSystemAdapter。
4. Xcode/Snippet，如果决定恢复支持，则补实现；如果决定退出，则清文档和兼容实体。

## 7. 建议保留的核心热路径

当前不建议动：

- Codex MCP shim：`lib/external/mcp/CodexMcpServer.ts`、`bin/codex-mcp.ts`。
- 完整 MCP 工具面：`lib/external/mcp/tools.ts`、`McpServer.ts`。
- Bootstrap/rescan workflow 主路径。
- SearchEngine / VectorService / HNSW：虽然重，但 README 明确承诺 hybrid/vector search。
- Guard forward check：`GuardCheckEngine`、`GuardService`。
- AST 多语言扫描和 grammars。
- Dashboard 基础 recipes / candidates / knowledge / guard / jobs 视图。

一句话结论：先剪“默认副作用”和“无生产入口的小残留”，再把 Lark、VSCode、macOS 这类宿主集成插件化；不要把 bootstrap/search/guard/recipe 这条主链路削薄。
