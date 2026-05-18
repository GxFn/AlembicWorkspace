# AlembicCore 阶段 2 完成记录

日期：2026-05-16
范围：Core 仓库内的 workspace/path/config/io 基础能力迁移
状态：Core 内部迁移完成；外层接入与删除由其他窗口按本文执行
Core 提交：`6d09b76 Migrate workspace path core`
后续接入推荐基线：`3077978 Remove obsolete runtime shim` 或更新提交。`3077978` 包含阶段 2 迁移之后对早期薄 runtime shim 的清理。

## 1. 本阶段目标

把项目根解析、Ghost workspace、ProjectRegistry、PathGuard、工作区设置、ConfigLoader、路径常量和 WriteZone 从现有实现完整迁入 `@alembic/core`。

本阶段仍遵守“完整复制迁移，不做删减优化”的工作流；只在以下地方做边界修正：

- 移除外层 MCP 自动审批 marker。
- 不把 delivery/IDE/env 写入目录设为 Core 默认白名单。
- 修正包名和导出，使代码可作为 `@alembic/core` 被外层仓库引用。

## 2. 已迁入 Core 的文件

Shared：

- `src/shared/WorkspaceResolver.ts`
- `src/shared/PathGuard.ts`
- `src/shared/ProjectRegistry.ts`
- `src/shared/ProjectMarkers.ts`
- `src/shared/WorkspaceSettingsStore.ts`
- `src/shared/resolveProjectRoot.ts`
- `src/shared/package-root.ts`
- `src/shared/isOwnDevRepo.ts`

Infrastructure：

- `src/infrastructure/config/ConfigLoader.ts`
- `src/infrastructure/config/Defaults.ts`
- `src/infrastructure/config/Paths.ts`
- `src/infrastructure/config/TriggerSymbol.ts`
- `src/infrastructure/io/WriteZone.ts`
- `src/infrastructure/**/index.ts`

Package exports：

- `@alembic/core/infrastructure`
- `@alembic/core/infrastructure/config`
- `@alembic/core/infrastructure/config/*`
- `@alembic/core/infrastructure/io`
- `@alembic/core/infrastructure/io/*`

## 3. 关键边界决策

### 3.1 PathGuard 默认边界

Core 默认只允许项目内这些写入：

- `.asd/`
- 当前知识库目录，例如 `Alembic/`
- 项目根 `.gitignore`

Core 默认不允许：

- `.cursor/`
- `.vscode/`
- `.github/`
- `.env`

这些目录和文件属于外层 delivery/IDE/env adapter。外层确实需要写入时，必须显式配置：

```ts
pathGuard.configure({
  projectRoot,
  packageRoot,
  knowledgeBaseDir,
  extraProjectWritePrefixes: ['.cursor', '.vscode', '.github'],
  extraProjectWritableFiles: ['.env'],
});
```

这不是功能删减，而是把交付渠道规则留在外层，避免 Core 默认携带 Cursor、VSCode、GitHub 或 env 文件写入策略。

### 3.2 不迁移 auto-approve marker

`WorkspaceResolver.autoApprovePendingPath` 没有进入 Core。调用方只在 Alembic 的 `lib/external/mcp/autoApproveInjector.ts`，属于 MCP 自动审批注入器行为，不是 workspace 内核。

外层接入时如果仍需要该 marker，应在外层 adapter 中继续使用：

```ts
path.join(resolver.runtimeDir, '.auto-approve-pending')
```

不要把这个 getter 加回 Core。

### 3.3 WorkspaceSettingsStore 的位置

`WorkspaceSettingsStore` 本阶段进入 Core，因为它承载 workspace runtime settings 与 secrets 分离的持久化契约。

它不代表 Core 拥有 AI 能力：

- Core 不实现 AI provider。
- Core 不读取外部 API。
- Core 不调度 agent。
- Core 不实现 tool system。

当前保留 `ALEMBIC_AI_*`、embedding key 等字段名，是为了迁移期间保持现有外层行为兼容。后续若要改名为更通用的 runtime override，需要单独阶段完成，不在本阶段做破坏性优化。

### 3.4 ConfigLoader 与 package root

`ConfigLoader` 和 `package-root.ts` 已支持 `@alembic/core` 包名，同时兼容原 `alembic-ai` 包名。

Core 仓库当前没有 `config/default.json`，因此测试只验证：

- 能找到 `@alembic/core` package root。
- 缺少 config 文件时仍能返回最小 `{ env }`。
- deep merge、set/get/has 行为保持可用。

### 3.5 Paths 的来源

`Paths.ts` 使用 Plugin 对照版本，不包含 VSCode snippets path helper。VSCode snippets 是外层 IDE delivery 能力，不属于 Core。

## 4. 已迁移测试

- `test/WorkspaceResolver.test.ts`
- `test/PathGuard.test.ts`
- `test/WorkspaceSettingsStore.test.ts`
- `test/resolveProjectRoot.test.ts`
- `test/ConfigLoader.test.ts`
- `test/core-package.test.ts` 中新增 infrastructure entrypoint smoke

测试覆盖：

- standard workspace path
- ghost workspace registry
- symlink project inspection
- `WorkspaceResolver.toFacts()`
- custom folder names
- PathGuard layer 1 boundary
- PathGuard layer 2 project write scope
- delivery/IDE/env 默认禁止与显式扩展允许
- workspace settings/secrets 分离
- workspace settings 不读取项目 `.env`
- config package root 和最小加载行为

## 5. 验证结果

在 `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` 执行：

```bash
npm run check
npm run build
node --input-type=module -e "const config = await import('@alembic/core/infrastructure/config'); const io = await import('@alembic/core/infrastructure/io'); console.log(JSON.stringify({config: Boolean(config.ConfigLoader), io: Boolean(io.WriteZone)}));"
```

结果：

- TypeScript build check 通过。
- Vitest 8 个测试文件通过。
- Vitest 84 个测试通过。
- Biome lint 通过。
- 实际构建通过。
- `@alembic/core/infrastructure/config` 和 `@alembic/core/infrastructure/io` self-reference import 通过。

## 6. 外层仓库接入任务

以下任务由其他窗口执行；本窗口不直接修改 Alembic / AlembicPlugin。

阶段 2 外层接入前，必须先完成阶段 1 外层接入整改：

- Alembic 和 AlembicPlugin 的阶段 1 纯 shared 生产代码引用应全量切到 `@alembic/core/shared/...`。
- 如果仍有本地 `LanguageService`、`TimerRegistry`、`errors`、`test-mode`、`similarity`、`recipe-tokens`、`token-utils` 等纯 shared 引用，不要执行阶段 2 删除计划。
- `schemas/http-requests.ts`、`schemas/mcp-tools.ts`、`shutdown.ts`、`ide-paths.ts`、Plugin `channel.ts` 仍保留外层。

### 6.1 Alembic 接入

先把 `vendor/AlembicCore` gitlink 更新到 Core 提交 `3077978` 或更新提交，并和本节 import 改造一起提交。

把以下 import 从本地 `lib/**` 切到 Core：

- `WorkspaceResolver`、`PathGuard`、`ProjectRegistry`、`ProjectMarkers`、`WorkspaceSettingsStore`、`resolveProjectRoot`、`package-root`、`isOwnDevRepo` → `@alembic/core/shared` 或 `@alembic/core/shared/<file>`
- `ConfigLoader`、`Defaults`、`Paths`、`TriggerSymbol` → `@alembic/core/infrastructure/config`
- `WriteZone` → `@alembic/core/infrastructure/io`

Alembic 外层仍保留：

- `lib/shared/ide-paths.ts`
- `lib/shared/shutdown.ts`
- `lib/shared/schemas/http-requests.ts`
- `lib/shared/schemas/mcp-tools.ts`
- `lib/external/mcp/autoApproveInjector.ts`
- delivery/IDE/channel/CLI/Dashboard/daemon adapter

Alembic delivery 初始化若写 `.cursor/`、`.vscode/`、`.github/`、`.env`，必须在外层配置 PathGuard 扩展，不能依赖 Core 默认放行。

### 6.2 AlembicPlugin 接入

先把 `vendor/AlembicCore` gitlink 更新到 Core 提交 `3077978` 或更新提交，并和本节 import 改造一起提交。

Plugin 的 Codex project root resolver、Codex runtime/preflight/tool policy、MCP tool metadata、channel/plugin 发布逻辑仍留在 Plugin。

Plugin 可以把 workspace/dataRoot/knowledgeRoot 判断切到 Core primitives：

- `@alembic/core/shared`
- `@alembic/core/infrastructure/config`
- `@alembic/core/infrastructure/io`

Plugin 默认不应为 `.cursor/`、`.vscode/`、`.github/`、`.env` 配置写入扩展，除非某个 Plugin adapter 明确拥有这些文件。

## 7. 外层删除计划

只有在两个外层仓库完成接入并通过测试后，才删除重复文件。

可删除候选：

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

明确不删除：

- `lib/shared/ide-paths.ts`
- `lib/shared/shutdown.ts`
- HTTP/MCP schemas
- Codex `ProjectRootResolver`
- Codex preflight/tool policy/MCP server
- Alembic MCP `autoApproveInjector`
- delivery/IDE/channel adapter

删除前必须验证：

- standard mode 初始化
- ghost mode 初始化
- bootstrap / setup / daemon 初始化路径
- delivery 写入 PathGuard 扩展
- workspace settings/secrets 读取与写入
- 外层没有反向 import Core 不应拥有的 Codex/MCP/agent/tool 文件

## 8. 下一阶段

下一阶段进入 domain 模型完整迁移：`lib/domain/**`，优先迁移 KnowledgeEntry、Lifecycle、Dimension、Evolution、Snippet 以及对应测试。
