# AlembicCore 阶段 1 完成记录

日期：2026-05-16
阶段：1 - shared 基础工具完整迁移
范围：只改 `AlembicCore` 仓库；未改 `Alembic` / `AlembicPlugin` 功能代码。
Core 提交：`f588ec4 Migrate shared core utilities`

## 1. 本阶段目标

阶段 1 迁移不依赖 workspace/path/config、SQLite、workflow、MCP、HTTP、delivery 的 shared 基础工具。原则：

- 以 `Alembic/lib/shared` 为主源完整复制真实实现。
- 对照 `AlembicPlugin/lib/shared` 差异，凡是外层 adapter 或 delivery/tool 专属内容，不进入 Core。
- 不把 `lib/shared` 下所有文件无脑搬入 Core；混合文件必须拆边界。

## 2. Core 已迁入内容

新增 `src/shared/**`：

- `LanguageProfiles.ts`
- `LanguageService.ts`
- `TimerRegistry.ts`
- `concurrency.ts`
- `constants.ts`
- `content-hash.ts`
- `developer-identity.ts`
- `diff-parser.ts`
- `errors/BaseError.ts`
- `errors/index.ts`
- `folder-names.ts`
- `lifecycle.ts`
- `markdown-utils.ts`
- `recipe-tokens.ts`
- `schemas/common.ts`
- `schemas/config.ts`
- `schemas/index.ts`
- `similarity.ts`
- `test-mode.ts`
- `token-utils.ts`
- `utils/common.ts`
- `index.ts`

包入口调整：

- `package.json` 增加 `./shared` 与 `./shared/*` exports。
- `package.json` 增加运行时依赖 `p-limit`、`zod`。
- 根 `src/index.ts` re-export `src/shared/index.ts`。

后续清理：

- 2026-05-16 提交 `3077978 Remove obsolete runtime shim` 已删除早期骨架文件 `src/folder-names.ts` 和 `src/runtime.ts`。
- 后续外层仓库不要再依赖 `createAlembicRuntime` 或 `@alembic/core/folder-names` 这类早期 shim；统一使用 `@alembic/core`、`@alembic/core/shared` 或 `@alembic/core/shared/folder-names`。

测试：

- 迁移 `Alembic/test/unit/LanguageServiceDetect.test.ts` 到 Core，并只改 import 路径。
- 新增 `test/shared-basics.test.ts`，覆盖 content hash、diff parser、markdown code block、recipe token、schema、similarity、test-mode、token utils。
- 保留阶段 0 的包级测试。

## 3. 必要拆分和未迁入内容

以下文件虽然位于外层 `lib/shared`，但本阶段未迁入 Core：

- `PathGuard.ts`、`WorkspaceResolver.ts`、`WorkspaceSettingsStore.ts`、`ProjectRegistry.ts`、`ProjectMarkers.ts`、`resolveProjectRoot.ts`、`isOwnDevRepo.ts`、`package-root.ts`
  - 进入阶段 2：workspace/path/config 基础迁移。
- `schemas/http-requests.ts`
  - 绑定 HTTP routes，属于外层 adapter schema。
- `schemas/mcp-tools.ts`
  - 绑定 MCP tool 名称和 tool input schema，属于外层 tool exposure。
- `shutdown.ts`
  - 直接安装 signal handler 并 `process.exit`，属于入口运行时协调，不适合作为 Core library 基础导出。
- `ide-paths.ts`
  - 绑定 Cursor/IDE delivery path，delivery 留外层。
- `channel.ts`
  - Plugin 专属 channel runtime，留 Plugin。

混合文件拆分：

- `constants.ts`
  - Core 保留质量、Guard、search、cache、monitoring 等基础常量。
  - 未迁入 Alembic 独有的 `DELIVERY_RANK`，因为它只被 `CursorDeliveryPipeline` 使用，delivery 留外层。
- `folder-names.ts`
  - Core 保留 package/dev/global/project folder names。
  - 未迁入 Alembic 独有的 `ide` folder names，IDE/Cursor delivery 留外层。
- `test-mode.ts`
  - 保留测试模式、维度过滤、终端档位配置语义。
  - 移除对 `#infra/logging/Logger.js` 和 `#types/project-snapshot.js` 的依赖，在 Core 内定义最小 `DimensionDef`，并用 stderr 记录过滤诊断。

## 4. Alembic / AlembicPlugin 差异记录

已记录的 shared 差异：

- Plugin 多 `channel.ts`，Core 不迁。
- Alembic 多 `ide-paths.ts`，Core 不迁。
- `constants.ts`：Alembic 多 `DELIVERY_RANK`，Core 不迁。
- `folder-names.ts`：Alembic 多 `ide` folder names，Core 不迁。
- `schemas/http-requests.ts`：Alembic 多 task/remote/wiki HTTP schema，Core 不迁 HTTP schema。
- `schemas/mcp-tools.ts`：Alembic 多 reverse audit、skill suggest、wiki tool schema 等 tool exposure 字段，Core 不迁 MCP tool schema。
- `shutdown.ts`：仅注释差异，但文件整体属于入口运行时，Core 不迁。
- `test-mode.ts`：Alembic 带 sandbox status，Plugin 不带；Core 保留 Alembic 的 sandbox status 数据，但去除外层 Logger/type imports。
- workspace/path 文件差异留阶段 2 处理。

## 5. 验证结果

在 `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` 执行：

- `npm run check`：通过。
  - `npm run build:check`：通过。
  - `npm run test`：通过，3 个测试文件、24 个测试。
  - `npm run lint`：通过，Biome 检查 31 个文件。
- `npm run build`：通过，验证可正常生成 `dist/`；`dist/` 仍为 ignored 构建产物。

## 6. 外层仓库接入任务

本阶段不要求立即删除外层 `lib/shared/**`，但要求两个外层仓库把“纯 shared 基础能力”的所有运行时引用切到 Core。不能只做到 `build:check` 通过，也不能只切一部分热点文件。

### 6.1 共同接入规则

其他窗口后续接入时按以下顺序执行：

1. 在 `Alembic` / `AlembicPlugin` 中确认 `vendor/AlembicCore` 指向包含阶段 1 的 Core commit。
2. 只把下列纯 shared imports 改为 Core：
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
3. 不要把外层 HTTP/MCP schema imports 改到 Core；`schemas/http-requests.ts`、`schemas/mcp-tools.ts` 仍留外层。
4. 不要把 delivery 相关常量改到 Core；`CursorDeliveryPipeline` 需要的 `DELIVERY_RANK` 留在 Alembic 外层。
5. 不要把 workspace/path/config 相关文件改到 Core；等阶段 2 完成。
6. 需要同步修改测试和 mock 路径：如果生产代码从 `@alembic/core/shared/test-mode`、`@alembic/core/shared/developer-identity`、`@alembic/core/shared/errors/index` 读取，测试里的 `vi.mock` / `vi.doMock` 也必须改到同一 Core specifier。
7. 接入完成后运行：
   - `npm run build:check`
   - 阶段 1 代表测试：LanguageService、Errors、PermissionManager、TestMode、ContentImpactAnalyzer、Concurrency、ZodSchemas。
   - Plugin 还要补跑 Codex 外层代表测试：CodexToolPolicy、CodexKnowledgeState、BootstrapTerminalToolset。

验收扫描命令：

```bash
rg -n "\\.\\./.*shared/(concurrency|constants|content-hash|developer-identity|diff-parser|errors|LanguageProfiles|LanguageService|lifecycle|markdown-utils|recipe-tokens|schemas/common|schemas/config|similarity|TimerRegistry|test-mode|token-utils|utils/common)|#shared/(concurrency|constants|content-hash|developer-identity|diff-parser|errors|LanguageProfiles|LanguageService|lifecycle|markdown-utils|recipe-tokens|schemas/common|schemas/config|similarity|TimerRegistry|test-mode|token-utils|utils/common)" lib bin test
```

该命令不应再出现生产代码对阶段 1 纯 shared 文件的本地引用。若出现测试引用，应判断是 legacy 外层行为测试还是应改为 Core 路径的 shared 测试。

### 6.2 Alembic 当前整改项

2026-05-16 检查 Alembic 提交 `cbfee4e Wire core shared utilities`：

- `vendor/AlembicCore` 指向 `f588ec4`，正确。
- `npm run build:check` 通过。
- 代表测试 7 个文件、177 个用例通过。
- 未发现把阶段 2 或外层边界文件误切到 Core。

仍需补齐的小项：

- 将剩余的阶段 1 纯 shared 引用切到 Core，特别是 `folder-names` 在 CLI、CodexMcpServer、ide-paths/folder-names 相关测试中的使用。
- `lib/infrastructure/config/Paths.ts` 可在阶段 2 接入时一起处理，但如果只引用 `DEFAULT_FOLDER_NAMES`，也可以先切到 `@alembic/core/shared/folder-names`。
- `test/unit/folder-names.test.ts` 需要拆分判断：Core 已覆盖的 folder-name 基础行为应改测 `@alembic/core/shared/folder-names`；Alembic 外层 IDE/Cursor 专属字段只留在外层 adapter 测试里。

### 6.3 AlembicPlugin 当前整改项

2026-05-16 检查 AlembicPlugin 提交 `8102d92 Use Core shared utilities`：

- `vendor/AlembicCore` 指向 `f588ec4`，正确。
- `npm run build:check` 通过。
- 代表测试 11 个文件、240 个用例通过。
- 未发现把阶段 2 或 Codex 外层边界文件误切到 Core。

但该提交只算“部分接入”，不能作为阶段 1 外层接入完成状态。检查时仍有大量阶段 1 纯 shared 本地引用，例如：

- `bin/daemon-server.ts` / `bin/codex-mcp.ts` 仍引用本地 `TimerRegistry`。
- AST、Guard、Recipe、Wiki、Vector、Repository、HTTP routes 中仍有大量本地 `LanguageService`、`LanguageProfiles`、`errors`、`lifecycle`、`similarity`、`token-utils`、`recipe-tokens`、`content-hash`、`utils/common` 引用。
- `test/integration/ZodSchemas.test.ts`、`test/unit/ContentImpactAnalyzer.test.ts`、`test/unit/LanguageServiceDetect.test.ts`、`test/unit/Errors.test.ts`、`test/unit/PermissionManager.test.ts`、`test/unit/TestMode.test.ts` 仍测本地 shared 文件。

Plugin 需要做一次机械补齐：

- 把阶段 1 清单中的纯 shared 生产代码引用全量改到 `@alembic/core/shared/...`。
- 把对应测试 import 与 `vi.mock` / `vi.doMock` 同步改到 Core specifier。
- 保留 Codex 外层文件：`lib/codex/**`、Codex MCP/preflight/tool policy、channel/plugin 发布、Plugin `channel.ts`。
- 保留阶段 2 文件：`PathGuard`、`WorkspaceResolver`、`ProjectRegistry`、`ProjectMarkers`、`WorkspaceSettingsStore`、`resolveProjectRoot`、`package-root`、`isOwnDevRepo`、`infrastructure/config/**`、`WriteZone`，等阶段 2 接入。

## 7. 外层删除计划

阶段 1 完成后不立即删除外层 shared。

只有当 Alembic 和 AlembicPlugin 都通过第 6 节的验收扫描和测试后，才可删除外层重复的纯 shared 文件：

- `LanguageProfiles.ts`
- `LanguageService.ts`
- `TimerRegistry.ts`
- `concurrency.ts`
- `content-hash.ts`
- `developer-identity.ts`
- `diff-parser.ts`
- `errors/**`
- `lifecycle.ts`
- `markdown-utils.ts`
- `recipe-tokens.ts`
- `schemas/common.ts`
- `schemas/config.ts`
- `similarity.ts`
- `test-mode.ts`
- `token-utils.ts`
- `utils/common.ts`

暂不删除：

- workspace/path/config 文件，等阶段 2。
- HTTP/MCP schemas，留外层。
- delivery/IDE/channel 文件，留外层。
- `constants.ts` 与 `folder-names.ts` 的外层副本需等外层把 delivery/IDE 专属字段拆到外层 adapter 后再删。

## 8. 下一阶段入口

下一阶段是阶段 2：workspace/path/config 基础迁移。

进入阶段 2 外层接入前，必须先确认阶段 1 在两个外层仓库完成：

- `vendor/AlembicCore` 至少指向 `f588ec4`。
- 阶段 1 纯 shared 生产代码引用不再走本地 `lib/shared`。
- Alembic 与 AlembicPlugin 均通过 `npm run build:check` 和阶段 1 代表测试。
- 未删除 HTTP/MCP schema、delivery/IDE/channel、workspace/path/config 文件。

阶段 2 必须完整处理：

- `WorkspaceResolver`
- `PathGuard`
- `ProjectRegistry`
- `ProjectMarkers`
- `WorkspaceSettingsStore`
- `resolveProjectRoot`
- `package-root`
- `isOwnDevRepo`
- `infrastructure/config/**`
- `infrastructure/io/WriteZone.ts`

阶段 2 需要单独处理 Alembic 与 AlembicPlugin 在 Ghost mode、Codex 初始化提示、auto-approve path 等差异。
