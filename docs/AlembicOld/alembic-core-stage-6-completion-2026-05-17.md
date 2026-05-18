# AlembicCore 阶段 6 完成记录

日期：2026-05-17
范围：Core 仓库内的 discovery / AST / project intelligence 基础迁移
状态：Core 内部迁移完成；外层接入与删除由其他窗口按本文执行
Core 提交：`f6e1220 Migrate project intelligence core`

## 1. 本阶段目标

把源码扫描、项目发现、tree-sitter AST、语言增强包、增量 project intelligence planning 和项目分析快照基础链路迁入 `@alembic/core`。

本阶段迁移的是确定性分析内核：

- 语言和项目类型发现。
- 多语言 AST grammar 加载、可用性检查和 parser reload。
- AST summary、call graph、import/data-flow/symbol 分析。
- framework enhancement pack 和 capability probe。
- project intelligence 的文件 diff、snapshot、增量 planning、分析结果投影。
- project snapshot 类型合约。

本阶段不迁 AI provider、Alembic internal agent、tool system、MCP/HTTP/Dashboard transport，也不迁多渠道 delivery。

## 2. 已迁入 Core 的文件

Core analysis / AST / discovery：

- `src/core/AstAnalyzer.ts`
- `src/core/analysis/**`
- `src/core/ast/**`
- `src/core/discovery/**`
- `src/core/enhancement/**`
- `src/core/capability/CapabilityProbe.ts`
- `src/core/index.ts`

Project intelligence：

- `src/workflows/capabilities/project-intelligence/**`
- `src/workflows/capabilities/planning/dimensions/BaseDimensions.ts`
- `src/workflows/capabilities/presentation/LanguageExtensionBuilder.ts`
- `src/workflows/capabilities/presentation/TargetClassifier.ts`

Types：

- `src/types/ast.d.ts`
- `src/types/project-snapshot.ts`
- `src/types/project-snapshot-builder.ts`
- `src/types/workflows.ts`

Runtime assets：

- `resources/grammars/*.wasm`

Package changes：

- 新增 `web-tree-sitter`、`js-yaml` 和 `@types/js-yaml`。
- `package.json` 的 `files` 增加 `resources`，保证 grammar wasm 随 Core 包发布。
- 新增 `@alembic/core/core/**`、`@alembic/core/workflows/capabilities/project-intelligence/**` 等 package exports。

## 3. 关键边界决策

### 3.1 grammar 自动安装/检测属于 Core

Core 现在拥有 grammar resolver、WASM 可用性检查、AST plugin reload 和 packaged grammar 资源。外层仓库只需要确保发布物带上 Core 的 `resources/grammars/**`，不应重新实现 grammar 安装或检测逻辑。

本阶段没有引入运行期自动 npm install。Core 通过包内资源和 `ensureGrammars()` 保证 AST parser 可用性，失败时给出可诊断结果。

### 3.2 ConfigWatcher 进入 Core，但 shutdown hook 改为 Core TimerRegistry

`ConfigWatcher` 是确定性配置发现基础设施，已迁入 Core。它原先对外层 shutdown manager 的依赖已改为 Core 的 `timerRegistry.registerDisposable()`，避免把外层进程生命周期框架带入 Core。

### 3.3 internal agent memory 不进入 Core

`FileDiffPlanner` 原先依赖 internal agent 的 `SessionStore` 形态。Core 中改为最小 `RestoredEpisodicMemory` / snapshot wrapper，保留增量快照恢复能力，但不迁 `lib/agent/**`、agent memory、agent runtime 或 tool execution。

### 3.4 CodeEntityGraph 和 GuardCheckEngine 暂作为可选外部 hook

`ProjectIntelligenceRunner` 保留 Phase 1.6 Code Entity Graph 和 Phase 3 Guard audit 的调用点，但通过可选动态加载降级：

- `CodeEntityGraph` 仍留待后续 service/code 或 graph 阶段处理。
- `GuardCheckEngine` 留待 Guard 阶段完整迁移。
- 当前 Core 缺少这些服务时会记录 warning 并继续完成 project intelligence 其它阶段。

这样可以保持迁移前工作流形状，同时不把尚未迁移的 service/guard 闭包薄化或半迁。

### 3.5 clearOldData 中的 checkpoint 清理仍由外层拥有

`ProjectIntelligencePreparation.clearOldData` 在 Core 内只负责 PathGuard 配置和 project intelligence 准备。涉及外层 workflow checkpoint / internal agent cleanup 的动作仍由 Alembic 或 AlembicPlugin 外层执行。

### 3.6 warnings 处理原则

本阶段 `npm run lint` 通过，但 Biome 仍报告一批 warning，主要来自完整复制的原实现中的 `any`、非空断言和少量未使用变量。

这些 warning 不在阶段 6 内清理，原因是当前目标是行为等价的完整复制迁移，不做优化性重构。后续可以单独开 cleanup 阶段，但不能把 warning cleanup 和迁移边界混在一起。

## 4. 已迁移测试

从 Alembic 迁入并修正 import：

- `test/MultiLanguageParsers.test.ts`
- `test/FileDiffSnapshotStore.test.ts`
- `test/ProjectIntelligenceIncrementalPlanner.test.ts`

新增 Core 级测试：

- `test/AstGrammar.test.ts`

覆盖重点：

- 多语言项目 discoverer 和配置 parser。
- FileDiffSnapshotStore 的真实 SQLite snapshot/diff 行为。
- ProjectIntelligenceIncrementalPlanner 的增量扫描决策。
- packaged grammar wasm 可用性、AST plugin reload 和 TypeScript AST analyzer smoke。

## 5. 验证结果

在 `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` 执行：

```bash
npm run lint
npm run build:check
npm run test
npm run build
node --input-type=module -e "const core=await import('@alembic/core/core'); const ast=await import('@alembic/core/core/ast'); const discovery=await import('@alembic/core/core/discovery'); const pi=await import('@alembic/core/workflows/capabilities/project-intelligence'); const grammars=await import('@alembic/core/core/ast/ensure-grammars'); console.log(JSON.stringify({astAnalyzer:!!core.analyzeFile, astLoad:!!ast.loadPlugins, discoverer:!!discovery.getDiscovererRegistry, projectIntel:!!pi.collectProjectAnalysis, grammars:!!grammars.ensureGrammars}, null, 2));"
```

结果：

- Biome lint 通过，保留 copied baseline warnings。
- TypeScript build check 通过。
- Vitest 25 个测试文件通过。
- Vitest 391 个测试通过。
- 实际构建通过。
- core / ast / discovery / project-intelligence / grammar entrypoints 的 self-reference import smoke 全部通过。
- Core 工作区提交后干净。

## 6. 外层仓库接入任务

以下任务由其他窗口执行；本窗口不直接修改 Alembic / AlembicPlugin。

### 6.1 接入前置条件

阶段 6 外层接入前必须确认：

- 阶段 1 shared imports 已收敛。
- 阶段 2 workspace/path/config/io imports 已收敛。
- 阶段 3 domain/types imports 已收敛。
- 阶段 4 database/repository/storage imports 已收敛。
- 阶段 5 event/signal/job/daemon state imports 已收敛。
- `vendor/AlembicCore` 更新到 `f6e1220` 或更新提交。
- 外层 lockfile 已刷新，能够解析 Core 新增的 `web-tree-sitter`、`js-yaml` 和 `@types/js-yaml`。

### 6.2 Alembic 接入

替换 imports：

- `#core/AstAnalyzer.js` → `@alembic/core/core/AstAnalyzer`
- `#core/analysis/*` → `@alembic/core/core/analysis/*`
- `#core/ast/*` → `@alembic/core/core/ast/*`
- `#core/discovery/*` → `@alembic/core/core/discovery/*`
- `#core/discovery/parsers/*` → `@alembic/core/core/discovery/parsers/*`
- `#core/enhancement/*` → `@alembic/core/core/enhancement/*`
- `#core/capability/CapabilityProbe.js` → `@alembic/core/core/capability/CapabilityProbe`
- `#workflows/capabilities/project-intelligence/*` → `@alembic/core/workflows/capabilities/project-intelligence/*`
- `#workflows/capabilities/planning/dimensions/BaseDimensions.js` → `@alembic/core/workflows/capabilities/planning/dimensions/BaseDimensions`
- `#workflows/capabilities/presentation/LanguageExtensionBuilder.js` → `@alembic/core/workflows/capabilities/presentation/LanguageExtensionBuilder`
- `#workflows/capabilities/presentation/TargetClassifier.js` → `@alembic/core/workflows/capabilities/presentation/TargetClassifier`
- `#types/project-snapshot.js` → `@alembic/core/types/project-snapshot`
- `#types/project-snapshot-builder.js` → `@alembic/core/types/project-snapshot-builder`

保留在 Alembic：

- `lib/core/gateway/**`
- `lib/core/permission/**`
- `lib/core/constitution/**`
- `lib/service/guard/**` 和 `GuardCheckEngine`，直到 Guard 阶段完整迁移。
- `lib/service/knowledge/CodeEntityGraph.ts` 或相关 code graph 服务，直到后续 service/code graph 阶段处理。
- `lib/agent/**`
- `lib/tools/**`
- CLI、HTTP routes、Dashboard、RealtimeService、DaemonSupervisor、DaemonJobRunner、ServiceContainer wiring、delivery pipeline。

建议扫描：

```bash
rg -n "from ['\"](#core/(AstAnalyzer|analysis|ast|discovery|enhancement|capability)|#workflows/capabilities/(project-intelligence|planning/dimensions/BaseDimensions|presentation/(LanguageExtensionBuilder|TargetClassifier))|#types/project-snapshot|#types/project-snapshot-builder|\\.\\.?/.*lib/core/(AstAnalyzer|analysis|ast|discovery|enhancement|capability)|\\.\\.?/.*lib/workflows/capabilities/(project-intelligence|planning/dimensions/BaseDimensions|presentation/(LanguageExtensionBuilder|TargetClassifier))|\\.\\.?/.*lib/types/project-snapshot)" lib bin test
```

建议验证：

```bash
npm run build:check
npm run test -- MultiLanguageParsers FileDiffSnapshotStore ProjectIntelligenceIncrementalPlanner RealProjectDiscovery
```

实际测试命令按 Alembic 仓库脚本调整；重点是 coldstart/rescan/project-intelligence 的真实项目扫描路径不能回退。

### 6.3 AlembicPlugin 接入

替换 imports 同 Alembic，同时注意：

- Plugin MCP structure/panorama/bootstrap/rescan handlers 改为调用 Core project intelligence。
- Codex runtime、MCP tool metadata、preflight、tool policy、plugin/channel 发布仍留 Plugin。
- Plugin 发布物需要确认 `@alembic/core` 包内 `resources/grammars/**` 被安装或随插件发布路径可访问。

保留在 Plugin：

- Codex MCP server。
- `lib/codex/**` runtime/preflight/status/diagnostics/tool policy。
- plugin/channel/marketplace 发布脚本和 assets。
- Codex host adapter、tool exposure、ServiceContainer wiring。

建议扫描：

```bash
rg -n "from ['\"](#core/(AstAnalyzer|analysis|ast|discovery|enhancement|capability)|#workflows/capabilities/(project-intelligence|planning/dimensions/BaseDimensions|presentation/(LanguageExtensionBuilder|TargetClassifier))|#types/project-snapshot|#types/project-snapshot-builder|\\.\\.?/.*lib/core/(AstAnalyzer|analysis|ast|discovery|enhancement|capability)|\\.\\.?/.*lib/workflows/capabilities/(project-intelligence|planning/dimensions/BaseDimensions|presentation/(LanguageExtensionBuilder|TargetClassifier))|\\.\\.?/.*lib/types/project-snapshot)" lib bin test
```

建议验证：

```bash
npm run build:check
npm run test -- MultiLanguageParsers FileDiffSnapshotStore ProjectIntelligenceIncrementalPlanner CodexMcpServer CodexStatusService
```

## 7. 删除计划

两个外层仓库完成接入、扫描无遗留、代表测试通过后，才删除重复实现。

可删除候选：

- `lib/core/AstAnalyzer.ts`
- `lib/core/analysis/**`
- `lib/core/ast/**`
- `lib/core/discovery/**`
- `lib/core/enhancement/**`
- `lib/core/capability/CapabilityProbe.ts`
- `lib/workflows/capabilities/project-intelligence/**`
- `lib/workflows/capabilities/planning/dimensions/BaseDimensions.ts`
- `lib/workflows/capabilities/presentation/LanguageExtensionBuilder.ts`
- `lib/workflows/capabilities/presentation/TargetClassifier.ts`
- `lib/types/ast.d.ts`
- `lib/types/project-snapshot.ts`
- `lib/types/project-snapshot-builder.ts`

不删除：

- `lib/core/gateway/**`
- `lib/core/permission/**`
- `lib/core/constitution/**`
- `lib/service/guard/**`
- `lib/service/knowledge/CodeEntityGraph.ts` 或相关 code graph 服务
- `lib/agent/**`
- `lib/tools/**`
- MCP/HTTP/Codex handlers、CLI、Dashboard、RealtimeService、DaemonSupervisor、DaemonJobRunner、ServiceContainer wiring、delivery/plugin/channel 资产

删除前还必须确认外层发布流程不会遗漏 Core `resources/grammars/**`。如果发布验证失败，应修外层 package/plugin 打包规则，而不是把 grammar 检查逻辑复制回外层。
