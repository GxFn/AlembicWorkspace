# AlembicCore 外层仓库阶段 1-13 验收后续报告

日期：2026-05-17

范围：逐阶段验收 `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` 与 `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin` 对 `AlembicCore` 阶段 1-13 的接入情况，并给两个外层窗口留下继续修正和删除的执行指令。

工作规则：

- 本报告窗口只做验收、文档和指挥，不修改 Alembic / AlembicPlugin 外层代码。
- 每次只完成一个阶段的验收，再进入下一阶段。
- `vendor/AlembicCore` 当前在两个外层仓库中均指向 Core 阶段 13 提交 `be15964`。
- `AGENTS.md` 必须保留。
- 删除计划只在报告中列候选；外层窗口必须在 import 收敛、代表测试和 build check 都通过后再执行删除。

## 硬性规则

本节同步自 `docs/alembic-core-full-copy-migration-execution-manual-2026-05-16.md`，作为 Alembic / AlembicPlugin 外层接入、补齐和删除时必须遵守的门禁。

### 总目标

- 这次迁移不是重新设计一个“更干净但功能更少”的 Core，也不是写一组 thin facade。目标是在不删减功能、不改变现有工作流的前提下，把稳定、可复用、确定性的能力完整接入 `@alembic/core`。
- 迁移优先级是“功能可用”和“行为等价”，不是边界漂亮。任何外层修改如果让原工作流不可用，即使编译通过，也不能算完成。
- 如果本报告、阶段手册与 `docs/alembic-core-implementation-boundary-analysis-2026-05-16.md` 冲突，以边界分析中的实现证据为准；先修正文档，再迁代码或删除文件。

### Core 边界

- Core 必须保留完整宿主 agent 知识挖掘闭环：扫描计划、证据包、任务/维度协议、宿主 agent 输入输出契约、提交校验、状态机、持久化、重试、SourceRef 回填、Recipe/Knowledge 落库。宿主负责执行，Core 负责协议、状态和结果收敛。
- Core 不拥有 AI Provider、Alembic internal AgentRuntime、`lib/agent/**`、`lib/tools/**` tool system、Codex host、MCP stdio、Dashboard、CLI、IDE 写入适配器、多渠道交付或插件发布渠道。
- Delivery、AGENTS.md/Skills 注入、Cursor/Codex/IDE 投递、Plugin channel、Codex runtime/preflight/tool metadata、terminal/mac/dashboard/skill adapter 都属于外层能力。
- 如果某个文件看起来像 adapter，但同时承载共享业务状态、数据结构或持久化契约，不能直接删或薄化。必须先判断它是否属于 host-agent 闭环内核；插件不需要的 Alembic internal agent/tool 逻辑继续留在外层。
- 如果现有文件同时混有 host-agent 闭环和 Alembic internal agent/tool 逻辑，不能整文件搬进 Core，也不能整文件删除；应让外层 wrapper 调用 Core 闭环内核，agent/tool 包装仍留外层。

### 外层接入门禁

- “编译通过”不是接入完成的充分条件。每阶段必须同时完成：import 扫描、代表测试、边界保留检查、`npm run build:check`。
- 后续阶段的外层接入不得跳过前一阶段的 import 收敛。例如阶段 2 删除前，阶段 1 纯 shared imports 必须已经全量切到 `@alembic/core/shared/*`。
- 如果某仓库只做了部分接入，可以继续编译验证，但不得执行该阶段删除计划，也不得在文档中标记为外层接入完成。
- 禁止为了编译通过而重写薄接口、删测试、降低测试断言、绕过真实依赖闭包。
- Plugin 专属测试不迁入 Core，继续留在 Plugin 验证外层行为，例如 `CodexRuntimeContext.test.ts`、`CodexProjectRootResolver.test.ts`、`CodexKnowledgeState.test.ts`、`CodexStatusService.test.ts`、`CodexToolPolicy.test.ts`、`CodexMcpServer.test.ts`、`CodexSessionScenarioRunner.test.ts`、`CodexPluginCacheSync.test.ts`。
- Delivery、agent、tool system 相关测试也不迁入 Core，继续留在外层验证外层能力没有回退，例如 `CursorDeliveryPipeline.test.ts`、`DeliveryCompletionStep.test.ts`、`V2ToolSystem.test.ts`、`ToolExecutionPipeline.test.ts`。

### 删除门禁

- 删除计划只列候选。外层窗口必须在对应阶段扫描清零、代表测试通过、`npm run build:check` 通过后，才允许按小批次删除重复文件。
- 不允许跨阶段大删除；尤其 AlembicPlugin 在阶段 2、3、6、8、9 补齐前，不得把阶段 4、5、7 的通过结论当成整体删除许可。
- 不删除外层 adapter、transport、delivery、Codex/plugin/channel、internal agent/tool system、CLI/HTTP/MCP/Dashboard/daemon wiring、ServiceContainer 装配。
- `AGENTS.md` 必须保留；回退、同步、子仓库接入、删除批次中都不能丢失。
- `dist/` 是构建产物，应由 `.gitignore` 忽略；npm 发布通过 `files: ["dist", ...]` 控制产物入包，不应提交构建产物到源码仓库。
- 遇到 AI/provider/host adapter 边界不清楚时，必须暂停并向用户确认，不得自行把边界模糊的能力迁入 Core 或删除外层文件。

## 总览

| 阶段 | 能力 | Alembic | AlembicPlugin | 结论 |
| --- | --- | --- | --- | --- |
| 1 | shared 基础工具 | 通过 | 通过 | 可进入后续统一删除评估 |
| 2 | workspace/path/config | 通过（保留外层 package adapter） | 需补齐 | AlembicPlugin 仍有本地 workspace/config/io 引用 |
| 3 | domain/types | 通过 | 需删除重复副本 | Plugin `lib/domain/**` 内部仍有本地引用 |
| 4 | SQLite/repository/storage | 通过（测试 mock 待随删除更新） | 通过但受阶段 2/3 阻塞 | Plugin 不可先执行删除计划 |
| 5 | event/signal/job/daemon state | 通过 | 通过但受阶段 2/3 阻塞 | 可接入，不可先删 Plugin 重复文件 |
| 6 | discovery/AST/project intelligence | 通过 | 需删除重复副本 | Plugin project-intelligence 仍有本地实现引用 |
| 7 | search/vector/indexing | 通过 | 通过但受阶段 2/3/6 阻塞 | Core 主链路通过，AI 增强留外层 |
| 8 | knowledge/candidate/recipe/sourceRef service | 通过 | 需补齐边界收敛 | Plugin FileChange/evolution/panorama 重复副本仍引用本地实现 |
| 9 | host-agent 知识挖掘闭环 | 需清理本地 persistence/internal-agent 引用 | 需补齐 | 两边测试通过，但扫描未清零 |
| 10 | Guard 免疫系统 | 通过 | 通过 | Guard 主链路已接 Core，Plugin HTTP API 测试需在可监听端口环境重跑 |
| 11 | delivery 留外层 | 通过 | 通过 | delivery/channel/plugin 交付边界保持外层 |
| 12 | tool system 留外层 | 通过 | 通过 | 工具系统完整留外层，Core 边界测试通过 |
| 13 | Codex 边界留 Plugin | 通过（外层 shim 保留） | 通过 | Codex runtime/channel/plugin 边界保持外层，Core 边界测试通过 |

## 阶段 1：shared 基础工具

验收时间：2026-05-17

目标：两个外层仓库把阶段 1 清单内的纯 shared 引用全量切到 `@alembic/core/shared/*`；外层 `lib/shared/**` 先保留，不在当前阶段直接删除。

阶段 1 纯 shared 清单：

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

### Alembic 验收

结论：通过。

证据：

- `vendor/AlembicCore` 指向 `be15964`。
- 手册阶段 1 原始扫描无命中：

```bash
rg -n "\\.\\./.*shared/(concurrency|constants|content-hash|developer-identity|diff-parser|errors|LanguageProfiles|LanguageService|lifecycle|markdown-utils|recipe-tokens|schemas/common|schemas/config|similarity|TimerRegistry|test-mode|token-utils|utils/common)|#shared/(concurrency|constants|content-hash|developer-identity|diff-parser|errors|LanguageProfiles|LanguageService|lifecycle|markdown-utils|recipe-tokens|schemas/common|schemas/config|similarity|TimerRegistry|test-mode|token-utils|utils/common)" lib bin test
```

- 代表测试通过：`npx vitest run test/unit/LanguageServiceDetect.test.ts test/unit/Errors.test.ts test/unit/TestMode.test.ts test/unit/folder-names.test.ts test/integration/Concurrency.test.ts test/integration/ZodSchemas.test.ts test/unit/ContentImpactAnalyzer.test.ts`，7 个测试文件、162 个测试通过。
- `npm run build:check` 通过。
- 阶段 1 Core 引用覆盖生产代码和测试，包含 `TimerRegistry`、`LanguageService`、`errors`、`test-mode`、`schema`、`concurrency`、`diff-parser`、`markdown-utils`、`recipe-tokens`、`folder-names` 等。

后续指令：

- Alembic 窗口可以把阶段 1 标记为外层接入完成。
- 现在不要单独删除全部 `lib/shared/**`；只能把纯 shared 重复文件列入后续统一删除候选。
- 不删除 `lib/shared/ide-paths.ts`、`lib/shared/shutdown.ts`、HTTP/MCP schema、workspace/path/config 相关文件。
- `constants.ts` 与 `folder-names.ts` 若仍被外层 delivery/IDE 专属文件引用，应等阶段 11 边界验收后再决定是否删除本地副本或拆 adapter。

### AlembicPlugin 验收

结论：通过。

证据：

- `vendor/AlembicCore` 指向 `be15964`。
- 手册阶段 1 原始扫描无命中：

```bash
rg -n "\\.\\./.*shared/(concurrency|constants|content-hash|developer-identity|diff-parser|errors|LanguageProfiles|LanguageService|lifecycle|markdown-utils|recipe-tokens|schemas/common|schemas/config|similarity|TimerRegistry|test-mode|token-utils|utils/common)|#shared/(concurrency|constants|content-hash|developer-identity|diff-parser|errors|LanguageProfiles|LanguageService|lifecycle|markdown-utils|recipe-tokens|schemas/common|schemas/config|similarity|TimerRegistry|test-mode|token-utils|utils/common)" lib bin test
```

- 代表测试通过：`npx vitest run test/unit/LanguageServiceDetect.test.ts test/unit/Errors.test.ts test/unit/TestMode.test.ts test/unit/folder-names.test.ts test/integration/Concurrency.test.ts test/integration/ZodSchemas.test.ts test/unit/ContentImpactAnalyzer.test.ts`，7 个测试文件、158 个测试通过。
- `npm run build:check` 通过。
- 旧手册中记录的 AlembicPlugin 阶段 1 大量本地 shared 引用已经被修正；当前验收未发现纯 shared 本地引用残留。

后续指令：

- AlembicPlugin 窗口可以把阶段 1 标记为外层接入完成。
- 现在不要删除 Plugin 的 channel、Codex runtime、MCP schema 或 delivery/plugin 发布相关 shared adapter。
- `lib/shared/channel.ts` 继续保留在 Plugin；它不是阶段 1 纯 shared 删除对象。
- 纯 shared 重复文件只能进入后续统一删除候选，等阶段 2-13 验收完成后再按文件依赖图删除。

### 阶段 1 删除候选

两个外层窗口后续可以评估删除以下纯 shared 重复文件，但必须先确认没有本地 import 和外层专属字段：

- `lib/shared/concurrency.ts`
- `lib/shared/constants.ts` 中纯共享部分
- `lib/shared/content-hash.ts`
- `lib/shared/developer-identity.ts`
- `lib/shared/diff-parser.ts`
- `lib/shared/errors/**`
- `lib/shared/LanguageProfiles.ts`
- `lib/shared/LanguageService.ts`
- `lib/shared/lifecycle.ts`
- `lib/shared/markdown-utils.ts`
- `lib/shared/recipe-tokens.ts`
- `lib/shared/schemas/common.ts`
- `lib/shared/schemas/config.ts`
- `lib/shared/similarity.ts`
- `lib/shared/TimerRegistry.ts`
- `lib/shared/test-mode.ts`
- `lib/shared/token-utils.ts`
- `lib/shared/utils/common.ts`

不得删除：

- `lib/shared/ide-paths.ts`
- `lib/shared/shutdown.ts`
- `lib/shared/schemas/http-requests.ts`
- `lib/shared/schemas/mcp-tools.ts`
- `AlembicPlugin/lib/shared/channel.ts`
- 阶段 2 才处理的 workspace/path/config/io 文件。

## 下一步

继续阶段 2：workspace/path/config 基础迁移外层验收。重点检查 `WorkspaceResolver`、`PathGuard`、`ProjectRegistry`、`WorkspaceSettingsStore`、`ConfigLoader`、`WriteZone` 是否全量切到 Core，同时确认外层 delivery/IDE/env 写入扩展仍留在外层。

## 阶段 2：workspace/path/config 基础迁移

验收时间：2026-05-17

目标：两个外层仓库把 workspace root、Ghost mode、ProjectRegistry、PathGuard、WorkspaceSettingsStore、resolveProjectRoot、ConfigLoader、Paths、Defaults、TriggerSymbol、WriteZone 的基础实现切到 Core；外层只保留 package asset、IDE/delivery/env 写入扩展、Codex project root resolver 等 adapter。

### Alembic 验收

结论：通过，但删除阶段必须保留外层 package asset adapter。

证据：

- `vendor/AlembicCore` 指向 `be15964`。
- 阶段 2 代表测试通过：`npx vitest run test/unit/WorkspaceResolver.test.ts test/unit/PathGuard.test.ts test/unit/WorkspaceSettingsStore.test.ts test/unit/resolveProjectRoot.test.ts test/unit/ConfigLoader.test.ts`，5 个测试文件、62 个测试通过。
- `npm run build:check` 已在本轮验收中通过。
- 大部分 workspace/path/config/io 引用已切到 Core，例如 `@alembic/core/shared/WorkspaceResolver`、`@alembic/core/shared/PathGuard`、`@alembic/core/shared/WorkspaceSettingsStore`、`@alembic/core/shared/resolveProjectRoot`、`@alembic/core/infrastructure/config/*`、`@alembic/core/infrastructure/io/WriteZone`。
- 扫描仍命中：
  - `bin/cli.ts` 动态导入 `../lib/infrastructure/config/AppConfigLoader.js`
  - `lib/cli/SetupService.ts` 动态导入 `../infrastructure/config/AppConfigLoader.js`
  - `test/unit/ConfigLoader.test.ts` 导入 `../../lib/infrastructure/config/AppConfigLoader.js`

判断：

- `AppConfigLoader.ts` 是 Alembic 外层 package-root adapter，不是重复 ConfigLoader 实现。它只导入 `@alembic/core/infrastructure/config/ConfigLoader`，并把 `_findPackageRoot` 绑定到 Alembic 外层 `package-assets.PACKAGE_ROOT`。
- `lib/shared/package-assets.ts` 是外层资源路径 adapter，负责 `config/`、`resources/`、`dashboard/`、`injectable-skills/` 等 Alembic 包资产路径，应保留。
- Alembic 本阶段可以视为接入完成；后续删除时不要把 `AppConfigLoader.ts` / `package-assets.ts` 当作 Core 重复实现删掉。

Alembic 窗口后续指令：

- 可以把阶段 2 标记为外层接入完成。
- 删除候选可进入后续统一删除评估：
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
- 保留：
  - `lib/infrastructure/config/AppConfigLoader.ts`
  - `lib/shared/package-assets.ts`
  - `lib/shared/ide-paths.ts`
  - `lib/shared/shutdown.ts`
  - HTTP/MCP schema
  - auto approve injector、delivery/IDE/channel adapter。
- 删除前重新跑阶段 2 扫描、阶段 2 代表测试和 `npm run build:check`。

### AlembicPlugin 验收

结论：未通过，需要补齐阶段 2 接入。

证据：

- `vendor/AlembicCore` 指向 `be15964`。
- 阶段 2 代表测试通过：`npx vitest run test/unit/WorkspaceResolver.test.ts test/unit/PathGuard.test.ts test/unit/WorkspaceSettingsStore.test.ts test/unit/resolveProjectRoot.test.ts test/unit/ConfigLoader.test.ts test/unit/CodexProjectRootResolver.test.ts`，6 个测试文件、65 个测试通过。
- `npm run build:check` 已在本轮验收中通过。
- 但阶段 2 扫描仍发现本地实现或本地引用，不能标记接入完成。

主要残留：

- `lib/bootstrap.ts` 仍导入本地 `./infrastructure/config/ConfigLoader.js` 和 `./shared/WorkspaceSettingsStore.js`。
- `lib/cli/SetupService.ts` 仍动态导入本地 `../infrastructure/config/ConfigLoader.js`。
- `test/unit/ConfigLoader.test.ts` 仍导入本地 `../../lib/infrastructure/config/ConfigLoader.js`。
- `test/unit/WorkspaceSettingsStore.test.ts` 仍导入本地 `../../lib/shared/WorkspaceSettingsStore.js`。
- `lib/http/routes/ai.ts`、`lib/external/mcp/CodexMcpServer.ts`、`lib/codex/AiConfigState.ts` 仍导入本地 `WorkspaceSettingsStore`。
- `lib/infrastructure/io/WriteZone.ts` 仍是完整本地实现，并 import `#shared/PathGuard.js` / `#shared/WorkspaceResolver.js`。
- `lib/infrastructure/config/Paths.ts`、`Defaults.ts` 仍依赖本地 `PathGuard` / `ProjectMarkers`。
- 多处 `package-root` 仍使用 `../shared/package-root.js`、`#shared/package-root.js` 或测试路径；该文件承载 Plugin 包资产路径，应改造成外层 adapter 名称，避免继续占用阶段 2 Core 文件名。

AlembicPlugin 窗口补齐指令：

1. 新增或改名为 `lib/shared/package-assets.ts`，承接 Plugin 外层包资产路径：
   - `PACKAGE_ROOT`
   - `CONFIG_DIR`
   - `INTERNAL_SKILLS_DIR`
   - `INJECTABLE_SKILLS_DIR`
   - `TEMPLATES_DIR`
   - `RESOURCES_DIR`
   - `DASHBOARD_DIR`
   - `getPackageVersion()`
2. 把所有 `../shared/package-root.js`、`#shared/package-root.js`、`../../lib/shared/package-root.js` 调用改到 `package-assets.js`。
3. 新增 `lib/infrastructure/config/AppConfigLoader.ts`，参考 Alembic：

```ts
import ConfigLoader from '@alembic/core/infrastructure/config/ConfigLoader';
import { PACKAGE_ROOT } from '../../shared/package-assets.js';

ConfigLoader._findPackageRoot = () => PACKAGE_ROOT;

export { ConfigLoader };
export default ConfigLoader;
```

4. `lib/bootstrap.ts`、`lib/cli/SetupService.ts`、`test/unit/ConfigLoader.test.ts` 改用 `AppConfigLoader.ts`；不要继续使用本地完整 `ConfigLoader.ts`。
5. `WorkspaceSettingsStore` 调用全部改到 `@alembic/core/shared/WorkspaceSettingsStore`。
6. `WriteZone` 调用全部改到 `@alembic/core/infrastructure/io/WriteZone`；确认本地 `lib/infrastructure/io/WriteZone.ts` 不再被引用后列入删除候选。
7. `Paths` / `Defaults` / `TriggerSymbol` 调用全部改到 `@alembic/core/infrastructure/config/*`；确认本地文件不再被引用后列入删除候选。
8. 保留 `lib/codex/ProjectRootResolver.ts`，但其 dataRoot/knowledgeRoot 判断必须继续使用 Core workspace primitives；不要把 Codex runtime 逻辑下沉到 Core。

AlembicPlugin 修正后必须重跑：

```bash
rg -n "#shared/(WorkspaceResolver|PathGuard|ProjectRegistry|ProjectMarkers|WorkspaceSettingsStore|resolveProjectRoot|package-root|isOwnDevRepo)|#infrastructure/config|#infrastructure/io/WriteZone|\\.\\./.*shared/(WorkspaceResolver|PathGuard|ProjectRegistry|ProjectMarkers|WorkspaceSettingsStore|resolveProjectRoot|package-root|isOwnDevRepo)|\\.\\./.*infrastructure/(config|io/WriteZone)" lib bin test
npx vitest run test/unit/WorkspaceResolver.test.ts test/unit/PathGuard.test.ts test/unit/WorkspaceSettingsStore.test.ts test/unit/resolveProjectRoot.test.ts test/unit/ConfigLoader.test.ts test/unit/CodexProjectRootResolver.test.ts
npm run build:check
```

只有以上扫描清零、测试和 build check 通过后，AlembicPlugin 才能把阶段 2 标记为接入完成。

### 阶段 2 删除候选

Alembic：可在后续统一删除阶段评估删除 Core 重复实现，但保留 `AppConfigLoader.ts` / `package-assets.ts`。

AlembicPlugin：暂不执行删除。先完成上述 import 收敛，再删除：

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

不得删除：

- Plugin 的 `lib/codex/ProjectRootResolver.ts`
- Plugin channel / plugin 发布资产
- Codex runtime / preflight / tool metadata
- delivery / IDE / channel adapter。

## 继续顺序

阶段 3 可以先做只读验收，但阶段 2 在 AlembicPlugin 未补齐前，不允许 AlembicPlugin 执行阶段 2 删除计划。

## 阶段 3：domain/types 模型

验收时间：2026-05-17

目标：两个外层仓库的 repository、service、workflow、测试全部改用 Core domain 和 `KnowledgeEntryWire`；外层保留 adapter、CLI、MCP、Dashboard、Codex runtime、delivery/channel 层。

### Alembic 验收

结论：通过。

证据：

- 阶段 3 原始扫描无命中：

```bash
rg -n "from ['\"](#domain|\\.\\.?/.*lib/domain)" lib bin test
rg -n "from ['\"](#types/knowledge-wire|\\.\\.?/.*types/knowledge-wire)" lib bin test
```

- 代表测试通过：`npx vitest run test/unit/KnowledgeEntry.test.ts test/unit/Lifecycle.test.ts test/unit/EvolutionPolicy.test.ts test/unit/RecipeDimension.test.ts test/integration/DomainLifecycle.test.ts`，5 个测试文件、151 个测试通过。
- `npm run build:check` 已在本轮验收中通过。

Alembic 窗口后续指令：

- 可以把阶段 3 标记为外层接入完成。
- 后续统一删除阶段可评估删除：
  - `lib/domain/**`
  - `lib/types/knowledge-wire.ts`
- 删除前必须再次确认没有外层 import 回流，并重跑 domain 代表测试和 `npm run build:check`。
- 不删除 repository、service、workflow、agent、tool、MCP、CLI、Dashboard、delivery 层。

### AlembicPlugin 验收

结论：部分通过，仍需删除或修正重复 domain 副本。

证据：

- 外层业务和测试主体已经大量使用 `@alembic/core/domain/**` 与 `@alembic/core/types/knowledge-wire`。
- 代表测试通过：`npx vitest run test/unit/KnowledgeEntry.test.ts test/unit/Lifecycle.test.ts test/unit/EvolutionPolicy.test.ts test/unit/RecipeDimension.test.ts test/integration/DomainLifecycle.test.ts`，5 个测试文件、151 个测试通过。
- `npm run build:check` 已在本轮验收中通过。
- 但阶段 3 手册扫描仍命中待删除重复文件内部引用：
  - `lib/domain/dimension/RecipeDimension.ts` 仍 import `#domain/dimension/DimensionRegistry.js`
  - `lib/domain/knowledge/KnowledgeEntry.ts` 仍 import `#types/knowledge-wire.js`
  - `lib/domain/dimension/DimensionCopy.ts` 注释中仍出现 `#domain/dimension/DimensionCopy.js`

判断：

- 这些命中主要来自 Plugin 本地域模型重复副本内部，不代表 Codex runtime 必须使用本地域模型。
- 但只要 `lib/domain/**` 和 `lib/types/knowledge-wire.ts` 留在仓库且内部还有本地 import，阶段 3 的手册扫描就不能清零，因此不能标记阶段 3 收尾完成。

AlembicPlugin 窗口补齐指令：

1. 确认没有生产代码、测试、Codex MCP handler 继续 import 本地 `#domain/**` 或 `#types/knowledge-wire`。
2. 若确认本地 `lib/domain/**` 已无外部引用，删除 Plugin 重复副本：
   - `lib/domain/**`
   - `lib/types/knowledge-wire.ts`
3. 若暂时不能删除某个文件，必须把其内部 import 改为 Core specifier：
   - `#domain/knowledge/KnowledgeEntry.js` → `@alembic/core/domain/knowledge/KnowledgeEntry`
   - `#domain/knowledge/Lifecycle.js` → `@alembic/core/domain/knowledge/Lifecycle`
   - `#domain/knowledge/values/*` → `@alembic/core/domain/knowledge/values/*`
   - `#domain/dimension/*` → `@alembic/core/domain/dimension/*`
   - `#domain/evolution/*` → `@alembic/core/domain/evolution/*`
   - `#domain/snippet/Snippet.js` → `@alembic/core/domain/snippet/Snippet`
   - `#types/knowledge-wire.js` → `@alembic/core/types/knowledge-wire`
4. 更新或删除注释中的旧 `#domain` 示例，避免扫描误报。

AlembicPlugin 修正后必须重跑：

```bash
rg -n "from ['\"](#domain|\\.\\.?/.*lib/domain)" lib bin test
rg -n "from ['\"](#types/knowledge-wire|\\.\\.?/.*types/knowledge-wire)" lib bin test
npx vitest run test/unit/KnowledgeEntry.test.ts test/unit/Lifecycle.test.ts test/unit/EvolutionPolicy.test.ts test/unit/RecipeDimension.test.ts test/integration/DomainLifecycle.test.ts
npm run build:check
```

只有扫描清零、测试和 build check 通过后，AlembicPlugin 才能把阶段 3 标记为接入完成。

### 阶段 3 删除候选

Alembic：可进入后续统一删除评估。

AlembicPlugin：先完成上述修正，再删除重复副本。

不得删除：

- `lib/repository/**`
- `lib/service/**`
- `lib/workflows/**`
- `lib/agent/**`
- `lib/tools/**`
- `lib/codex/**`
- delivery、MCP、CLI、Dashboard、plugin/channel adapter。

## 继续顺序：阶段 4

下一步验收 SQLite / repository / 文件存储。重点检查两个外层仓库是否都用 Core 的 `DatabaseConnection`、Drizzle schema/migrations、repository、`KnowledgeFileWriter`、`KnowledgeSyncService`，同时确认 remote/delivery/audit/code 等外层或后续边界没有被误删。

## 阶段 4：SQLite / repository / 文件存储

验收时间：2026-05-17

目标：两个外层仓库使用 Core 的 SQLite、Drizzle schema/migrations、repository、logging、`KnowledgeFileWriter`、`KnowledgeSyncService` 和 `types/evolution`；delivery/remote/audit/code repository 继续留外层。

### Alembic 验收

结论：通过，但删除本地 logging 前需要同步更新 3 个测试 mock。

证据：

- 阶段 4 生产链路扫描未发现本地 `#infrastructure/database`、`#repository/{base,knowledge,search,sourceref,bootstrap,guard,evolution,session,memory,token,sync}`、`#types/evolution`、本地 `KnowledgeFileWriter` 或本地 `KnowledgeSyncService` 生产引用。
- 扫描仅发现 3 个测试 mock 指向本地 Logger：
  - `test/unit/MemorySystem.test.ts`
  - `test/unit/ReasoningLayer.test.ts`
  - `test/unit/KnowledgeAPI.test.ts`
- 边界保留扫描确认 `lib/repository/remote/**` 仍在外层：`test/integration/RemoteCommandRepository.test.ts` 继续覆盖外层 remote repository。
- 代表测试通过：`npx vitest run test/unit/ProposalRepository.test.ts test/unit/KnowledgeFileWriter.test.ts test/integration/RemoteCommandRepository.test.ts`，3 个测试文件、91 个测试通过。
- `npm run build:check` 已在本轮验收中通过。

Alembic 窗口后续指令：

- 可以把阶段 4 标记为外层接入完成。
- 后续删除 `lib/infrastructure/logging/**` 前，先把 3 个测试 mock 改到 Core Logger，或明确保留一个外层 Logger adapter。
- 删除候选进入统一删除评估：
  - `lib/infrastructure/database/**`
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
- 不删除：
  - `lib/repository/delivery/**`
  - `lib/repository/remote/**`
  - `lib/repository/audit/**`
  - `lib/repository/code/**`
  - CLI command、daemon supervisor、MCP/HTTP routes、Dashboard、Lark/Feishu bridge、ServiceContainer wiring、delivery pipeline。

### AlembicPlugin 验收

结论：阶段 4 本身通过，但不能执行删除计划，因为阶段 2 和阶段 3 仍未收敛。

证据：

- 阶段 4 扫描无命中：未发现本地 database/logging/repository/storage 主链路 import。
- 边界保留扫描无 `delivery|remote|audit|code` repository 命中；Plugin 当前不依赖这些外层 repository 边界。
- 代表测试通过：`npx vitest run test/unit/ProposalRepository.test.ts test/unit/KnowledgeFileWriter.test.ts`，2 个测试文件、61 个测试通过。
- `npm run build:check` 已在本轮验收中通过。

AlembicPlugin 窗口后续指令：

- 可以记录“阶段 4 接入扫描和代表测试通过”。
- 不要执行阶段 4 删除计划，直到阶段 2 的 workspace/path/config 和阶段 3 的 domain/types 补齐。
- 等阶段 2/3 扫描清零后，再统一评估删除：
  - `lib/infrastructure/database/**`
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

Plugin 删除前必须重跑：

```bash
rg -n "from ['\"](#infrastructure/database|#repository|#types/evolution|\\.\\.?/.*lib/infrastructure/database|\\.\\.?/.*lib/repository/(base|knowledge|search|sourceref|bootstrap|guard|evolution|session|memory|token|sync)|\\.\\.?/.*lib/types/evolution|\\.\\.?/.*lib/service/knowledge/KnowledgeFileWriter|\\.\\.?/.*lib/cli/KnowledgeSyncService)" lib bin test
npx vitest run test/unit/ProposalRepository.test.ts test/unit/KnowledgeFileWriter.test.ts
npm run build:check
```

### 阶段 4 边界确认

- SQLite、Drizzle schema/migrations、repository 主链路属于 Core。
- remote command repository/handler 不属于 Core 实现边界；Alembic 保留外层 remote 测试是正确的。
- delivery repository 不进入 Core。
- audit/code repository 本阶段不删除；若后续证明是 Guard 或 discovery 确定性内核，再按对应阶段处理。

## 继续顺序：阶段 5

下一步验收 event / signal / job / daemon 状态基础迁移。重点检查 `EventBus`、`SignalBus`、`JobStore`、`DaemonState`、`ReportStore` 等是否接入 Core，同时保留外层 daemon supervisor、job runner、HTTP/MCP route 和 Dashboard/WebSocket adapter。

## 阶段 5：event / signal / job / daemon state

验收时间：2026-05-17

目标：两个外层仓库使用 Core 的 EventBus、SignalBus、SignalTraceWriter、SignalBridge、SignalAggregator、ReportStore、DaemonState、JobStore；外层继续保留 RealtimeService、DaemonSupervisor、DaemonJobRunner、SignalModule、HTTP/MCP routes、Dashboard/WebSocket adapter 和 ServiceContainer wiring。

### Alembic 验收

结论：通过。

证据：

- 阶段 5 扫描无命中：

```bash
rg -n "#infrastructure/(events|signals|report)|#daemon/(JobStore|DaemonState)|#repository/report|\\.\\.?/.*lib/infrastructure/(events|signals|report)|\\.\\.?/.*lib/daemon/(JobStore|DaemonState)|\\.\\.?/.*lib/repository/report" lib bin test
```

- 代表测试通过：`npx vitest run test/integration/EventBus.test.ts test/unit/SignalBus.test.ts test/unit/JobStore.test.ts test/integration/SignalIntegration.test.ts test/integration/cross-module/SignalBusWiring.test.ts`，5 个测试文件、41 个测试通过。
- `npm run build:check` 已在本轮验收中通过。
- 测试输出确认外层初始化仍会绑定 EventBus / SignalBus，Dashboard/WebSocket/ServiceContainer 外层 wiring 未被误删。

Alembic 窗口后续指令：

- 可以把阶段 5 标记为外层接入完成。
- 后续统一删除阶段可评估删除：
  - `lib/infrastructure/event/**`
  - `lib/infrastructure/signal/**`
  - `lib/infrastructure/report/ReportStore.ts`
  - `lib/daemon/DaemonState.ts`
  - `lib/daemon/JobStore.ts`
- 不删除：
  - `lib/infrastructure/realtime/RealtimeService.ts`
  - `lib/daemon/DaemonSupervisor.ts`
  - `lib/daemon/DaemonJobRunner.ts`
  - `lib/injection/modules/SignalModule.ts`
  - `lib/injection/modules/InfraModule.ts`
  - HTTP jobs/daemon/signals/routes、Dashboard/WebSocket adapter、ServiceContainer wiring。

### AlembicPlugin 验收

结论：阶段 5 本身通过，但仍受阶段 2/3 未收敛阻塞，不允许先执行删除。

证据：

- 阶段 5 扫描无命中。
- 代表测试通过：`npx vitest run test/integration/EventBus.test.ts test/unit/SignalBus.test.ts test/unit/JobStore.test.ts test/integration/SignalIntegration.test.ts test/integration/cross-module/SignalBusWiring.test.ts test/unit/CodexStatusService.test.ts`，6 个测试文件、43 个测试通过。
- `CodexStatusService.test.ts` 通过，说明 Plugin 读取 Core JobStore/DaemonState 的 Codex 状态投影没有明显回退。
- `npm run build:check` 已在本轮验收中通过。

AlembicPlugin 窗口后续指令：

- 可以记录“阶段 5 接入扫描和代表测试通过”。
- 不要执行阶段 5 删除计划，直到阶段 2/3 补齐。
- 后续删除候选同 Alembic，但必须保留：
  - Codex MCP server
  - daemon supervisor
  - daemon job runner
  - Plugin runtime/preflight/tool metadata
  - Dashboard/WebSocket/ServiceContainer wiring。

Plugin 修正阶段 2/3 后，阶段 5 删除前重跑：

```bash
rg -n "#infrastructure/(events|signals|report)|#daemon/(JobStore|DaemonState)|#repository/report|\\.\\.?/.*lib/infrastructure/(events|signals|report)|\\.\\.?/.*lib/daemon/(JobStore|DaemonState)|\\.\\.?/.*lib/repository/report" lib bin test
npx vitest run test/integration/EventBus.test.ts test/unit/SignalBus.test.ts test/unit/JobStore.test.ts test/integration/SignalIntegration.test.ts test/integration/cross-module/SignalBusWiring.test.ts test/unit/CodexStatusService.test.ts
npm run build:check
```

### 阶段 5 边界确认

- Core 只保存/查询 job 和 daemon 状态，不启动 daemon。
- WebSocket、HTTP route、MCP handler、Dashboard 广播继续在外层。
- Plugin 的 `actor`、`channelId`、`client`、`createdByTool`、`sessionId` 等 Codex job metadata 可以继续写入 Core `JobStore`。

## 继续顺序：阶段 6

下一步验收 discovery / AST / project intelligence。重点确认 AST、语言发现、依赖图、ProjectIntelligence deterministic pipeline 已接 Core，同时保留 HTTP/MCP/CLI handler、ServiceContainer wiring、Codex preflight 和外层 transport。

## 阶段 6：discovery / AST / project intelligence

验收时间：2026-05-17

目标：两个外层仓库使用 Core 的 AST、analysis、discovery、enhancement、CapabilityProbe、ProjectIntelligence deterministic pipeline、project snapshot types 和 grammar 资源；外层继续保留 HTTP/MCP/CLI/Dashboard、ServiceContainer wiring、Codex preflight、transport、delivery/plugin/channel。

### Alembic 验收

结论：通过。

证据：

- 阶段 6 扫描无命中：

```bash
rg -n "#core/(ast|discovery|analysis|enhancement)|#service/project|#workflows/capabilities/project-intelligence|\\.\\.?/.*lib/core/(ast|discovery|analysis|enhancement)|\\.\\.?/.*lib/service/project|\\.\\.?/.*lib/workflows/capabilities/project-intelligence" lib bin test
```

- 代表测试通过：`npx vitest run test/unit/MultiLanguageParsers.test.ts test/unit/ProjectIntelligenceIncrementalPlanner.test.ts test/unit/CallGraphAnalyzer.test.ts test/integration/RealProjectAst.test.ts test/integration/RealProjectDiscovery.test.ts test/integration/RealProjectLanguage.test.ts`，6 个测试文件、346 个测试通过。
- `npm run build:check` 已在本轮验收中通过。
- 测试包含 AST graceful degradation、语言识别、多语言 parser、CallGraphAnalyzer、真实项目 discovery fixture。

Alembic 窗口后续指令：

- 可以把阶段 6 标记为外层接入完成。
- 后续统一删除阶段可评估删除：
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
- 删除前必须确认 Core `resources/grammars/**` 在 Alembic 发布物中可访问；如果失败，修外层打包规则，不复制 grammar 检查逻辑回外层。

### AlembicPlugin 验收

结论：部分通过，仍需删除或修正 project-intelligence 重复副本。

证据：

- 代表测试通过：`npx vitest run test/unit/MultiLanguageParsers.test.ts test/unit/ProjectIntelligenceIncrementalPlanner.test.ts test/unit/CallGraphAnalyzer.test.ts test/integration/RealProjectAst.test.ts test/integration/RealProjectDiscovery.test.ts test/integration/RealProjectLanguage.test.ts`，6 个测试文件、346 个测试通过。
- `npm run build:check` 已在本轮验收中通过。
- 但阶段 6 扫描仍命中 Plugin 本地 project-intelligence 重复实现：
  - `lib/workflows/capabilities/project-intelligence/ProjectIntelligenceCapability.ts`
  - `lib/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts`
  - `lib/workflows/capabilities/project-intelligence/FileDiffPlanner.ts`
  - `lib/workflows/capabilities/project-intelligence/ProjectIntelligenceIncrementalPlanner.ts`
- 这些文件继续引用本地：
  - `#core/analysis/CallGraphAnalyzer.js`
  - `#core/discovery/index.js`
  - `#core/ast/ensure-grammars.js`
  - `#core/ast/index.js`
  - `#core/enhancement/index.js`
  - `#workflows/capabilities/project-intelligence/*`

判断：

- Plugin 的外层 handler 已经有很多 Core import，但 project-intelligence 重复副本还存在并互相引用。
- 只要这些重复文件存在并使用本地 `#core` / `#workflows`，阶段 6 不能标记为收尾完成。

AlembicPlugin 窗口补齐指令：

1. 确认 Plugin MCP structure/panorama/bootstrap/rescan handler 已调用 Core project intelligence entrypoints。
2. 若 `lib/workflows/capabilities/project-intelligence/**` 已无外部引用，删除整个重复目录。
3. 若暂时不能删除，必须把内部 import 改到 Core：
   - `#core/analysis/**` → `@alembic/core/core/analysis/**`
   - `#core/ast/**` → `@alembic/core/core/ast/**`
   - `#core/discovery/**` → `@alembic/core/core/discovery/**`
   - `#core/enhancement/**` → `@alembic/core/core/enhancement/**`
   - `#workflows/capabilities/project-intelligence/**` → `@alembic/core/workflows/capabilities/project-intelligence/**`
4. 删除或切换 project snapshot types：
   - `lib/types/ast.d.ts`
   - `lib/types/project-snapshot.ts`
   - `lib/types/project-snapshot-builder.ts`
5. 确认 Plugin package/channel 发布物能访问 Core `resources/grammars/**`；若失败，修打包规则，不把 grammar 自动安装/检查逻辑复制回 Plugin。

AlembicPlugin 修正后必须重跑：

```bash
rg -n "#core/(ast|discovery|analysis|enhancement)|#service/project|#workflows/capabilities/project-intelligence|\\.\\.?/.*lib/core/(ast|discovery|analysis|enhancement)|\\.\\.?/.*lib/service/project|\\.\\.?/.*lib/workflows/capabilities/project-intelligence" lib bin test
npx vitest run test/unit/MultiLanguageParsers.test.ts test/unit/ProjectIntelligenceIncrementalPlanner.test.ts test/unit/CallGraphAnalyzer.test.ts test/integration/RealProjectAst.test.ts test/integration/RealProjectDiscovery.test.ts test/integration/RealProjectLanguage.test.ts
npm run build:check
```

### 阶段 6 边界确认

- Core 拥有 grammar resolver、WASM 可用性检查、AST plugin reload、packaged grammar 资源。
- 外层只负责发布物是否包含 Core 资源。
- Codex runtime、preflight、tool policy、plugin/channel 发布继续留在 Plugin。
- AI provider、MCP/HTTP/Dashboard transport、internal agent、tool system、delivery 不进入 Core。

## 继续顺序：阶段 7

下一步验收 search / vector / indexing。重点确认 SearchEngine、VectorStore、IndexingPipeline、HNSW/JSON vector adapters、SourceRef retrieval 已接 Core，同时保留 AI provider、embedding provider、reranker/model selection、ServiceContainer wiring 和 CLI/MCP/HTTP handler。

## 阶段 7：search / vector / indexing

验收时间：2026-05-17

目标：两个外层仓库使用 Core 的 SearchEngine、keyword/weighted/auto ranking、vector store、HNSW/JSON fallback、binary persistence、chunking、IndexingPipeline、VectorService、SyncCoordinator；外层保留 AI provider、embedding provider、CrossEncoderReranker、ContextualEnricher、VectorModule、ServiceContainer wiring 和 CLI/MCP/HTTP handler。

### Alembic 验收

结论：通过。

证据：

- Core search/vector 主链路扫描未发现本地残留。
- 扫描只命中允许留外层的 AI 增强测试：
  - `test/unit/SearchRanking.test.ts` 仍测试外层 `CrossEncoderReranker`
  - `test/unit/ContextualEnricher.test.ts` 仍测试外层 `ContextualEnricher`
- 代表测试通过：`npx vitest run test/unit/SearchEngine.test.ts test/unit/SearchRanking.test.ts test/unit/HnswVector.test.ts test/unit/VectorPipeline.test.ts test/unit/VectorService.test.ts test/integration/SearchPipeline.test.ts test/integration/IndexingPipeline.test.ts test/unit/ContextualEnricher.test.ts`，8 个测试文件、270 个测试通过。
- `npm run build:check` 已在本轮验收中通过。

Alembic 窗口后续指令：

- 可以把阶段 7 标记为外层接入完成。
- 后续统一删除阶段可评估删除：
  - `lib/infrastructure/vector/**`
  - `lib/service/search/BM25Scorer.ts`
  - `lib/service/search/CoarseRanker.ts`
  - `lib/service/search/FieldWeightedScorer.ts`
  - `lib/service/search/HybridRetriever.ts`
  - `lib/service/search/MultiSignalRanker.ts`
  - `lib/service/search/SearchEngine.ts`
  - `lib/service/search/SearchTypes.ts`
  - `lib/service/search/contextBoost.ts`
  - `lib/service/search/tokenizer.ts`
  - `lib/service/vector/SyncCoordinator.ts`
  - `lib/service/vector/VectorService.ts`
- 保留：
  - `lib/service/search/CrossEncoderReranker.ts`
  - `lib/service/vector/ContextualEnricher.ts`
  - provider / AI config / API key / model selection
  - `VectorModule`
  - ServiceContainer wiring
  - CLI/MCP/HTTP search/embed handlers。

### AlembicPlugin 验收

结论：阶段 7 本身通过，但仍受阶段 2/3/6 未收敛阻塞，不允许先执行删除。

证据：

- Core search/vector 主链路扫描未发现本地残留。
- 扫描只命中允许留外层的 `CrossEncoderReranker` / `ContextualEnricher` 测试。
- 代表测试通过：同 Alembic，8 个测试文件、270 个测试通过。
- `npm run build:check` 已在本轮验收中通过。

AlembicPlugin 窗口后续指令：

- 可以记录“阶段 7 接入扫描和代表测试通过”。
- 不要执行阶段 7 删除计划，直到阶段 2/3/6 补齐。
- 保留 Codex runtime/preflight/tool policy/plugin channel、AI provider、embedding provider、VectorModule、ServiceContainer wiring。
- 若 Plugin 使用 Codex MCP search handler，handler 只调用 Core search/vector service，不复制 search/vector 实现。

Plugin 修正前置阶段后，阶段 7 删除前重跑：

```bash
rg -n "#service/(search|vector)|#infrastructure/vector|#repository/search|\\.\\.?/.*lib/service/(search|vector)|\\.\\.?/.*lib/infrastructure/vector|\\.\\.?/.*lib/repository/search" lib bin test
npx vitest run test/unit/SearchEngine.test.ts test/unit/SearchRanking.test.ts test/unit/HnswVector.test.ts test/unit/VectorPipeline.test.ts test/unit/VectorService.test.ts test/integration/SearchPipeline.test.ts test/integration/IndexingPipeline.test.ts test/unit/ContextualEnricher.test.ts
npm run build:check
```

### 阶段 7 边界确认

- 无 provider 时，Core keyword/weighted 搜索可用。
- semantic/vector 失败时降级或 warning，不阻断知识链路。
- HNSW/binary index 损坏时应可从 JSON 或 DB 重建。
- `CrossEncoderReranker`、`ContextualEnricher` 和 AI provider 继续留外层。

## 继续顺序：阶段 8

下一步验收 knowledge / candidate / recipe / sourceRef service。重点确认 KnowledgeService、RecipeExtractor、RecipeParser、CandidateAggregator、SourceRefReconciler 等 deterministic service 已接 Core，同时保留 AI extraction/provider、external handlers、delivery/wiki/panorama adapter。

## 阶段 8：knowledge / candidate / recipe / sourceRef service

验收时间：2026-05-17

目标：两个外层仓库使用 Core 的 KnowledgeService、CandidateAggregator、RecipeParser/Validator、SourceRefReconciler、RecipeProductionGateway、Evolution deterministic service、Panorama service/quality/bootstrap deterministic service；AI extraction/provider、agent/tool runtime、ModuleService、FileChangeDispatcher、daemon/file watcher、delivery/wiki/handler/DI/transport 继续留外层。

### Alembic 验收

结论：通过。

证据：

- 阶段 8 核心 service 扫描未发现本地 `#service/{knowledge,candidate,recipe,quality,evolution,panorama}` 或 `#repository/code` 主链路引用。
- 扫描仍命中外层边界文件：
  - `DaemonFileChangeCollector`
  - `FileChangeHandler`
  - `FileChangeSourceTracker`
  这些按手册明确留在外层。
- 代表测试通过：`npx vitest run test/unit/KnowledgeService.test.ts test/unit/BootstrapDedup.test.ts test/unit/production-gateway.test.ts test/unit/SourceRefReconciler-signal.test.ts test/unit/RecipeImpactPlanner.test.ts test/unit/ConsolidationAdvisor.test.ts test/unit/DecayDetector.test.ts test/unit/content-patcher.test.ts test/unit/PanoramaService.test.ts test/unit/PanoramaAggregator.test.ts test/unit/PanoramaScanner.test.ts test/unit/LayerInferrer.test.ts test/unit/Phase2-PanoramaIntegration.test.ts test/unit/ContentImpactAnalyzer.test.ts`，14 个测试文件、232 个测试通过。
- `npm run build:check` 已在本轮验收中通过。
- `FileChangeHandler` 已正确从 Core 导入 `ContentImpactAnalyzer`、`ContentPatcher`、`EvolutionGateway`、`RecipePathRewriter` 和 `types/reactive-evolution`，说明外层触发器没有把确定性 evolution 内核留成本地实现。

Alembic 窗口后续指令：

- 可以把阶段 8 标记为外层接入完成。
- 后续统一删除阶段可评估删除阶段 8 候选文件。
- 保留：
  - `ModuleService.ts`
  - `FileChangeDispatcher.ts`
  - `FileChangeHandler.ts`
  - `DaemonFileChangeCollector.ts`
  - `FileChangeSourceTracker.ts`
  - `lib/agent/**`
  - `lib/tools/**`
  - `lib/injection/**`
  - `lib/service/delivery/**`
  - CLI/MCP/HTTP/Dashboard/daemon/transport/provider wiring。

### AlembicPlugin 验收

结论：功能测试通过，但阶段 8 实现边界未收敛，需要补齐。

证据：

- 代表测试通过：同 Alembic，14 个测试文件、231 个测试通过。
- `npm run build:check` 已在本轮验收中通过。
- 但扫描发现 Plugin 仍保留并使用本地 deterministic service 副本：
  - `lib/service/evolution/FileChangeHandler.ts` 从本地 `./ContentImpactAnalyzer.js` 导入 `assessFileImpact` / `extractRecipeTokens`
  - `lib/service/evolution/FileChangeHandler.ts` 从本地 `../knowledge/RecipePathRewriter.js` 导入 `rewriteRecipePaths`
  - `lib/service/evolution/FileChangeHandler.ts` 从本地 `../../types/reactive-evolution.js` 导入类型
  - `lib/service/evolution/RecipeImpactPlanner.ts` 从本地 `./ContentImpactAnalyzer.js` 导入
  - `lib/service/knowledge/RecipeProductionGateway.ts` 从本地 `../bootstrap/BootstrapDedup.js` 导入类型
  - `lib/service/panorama/**` 内部仍大量引用本地 `./PanoramaTypes.js` 等重复副本

判断：

- Plugin 外层触发器和 handler 可以保留，但它们必须调用 Core deterministic service。
- 当前 Plugin 功能可跑，说明没有明显行为回退；但仍维护两套 ContentImpact / RecipePath / BootstrapDedup / Panorama 实现，阶段 8 不能标记收尾完成。

AlembicPlugin 窗口补齐指令：

1. `FileChangeHandler` 保留在 Plugin 外层，但内部 import 改为 Core：
   - `@alembic/core/service/evolution/ContentImpactAnalyzer`
   - `@alembic/core/service/evolution/ContentPatcher`
   - `@alembic/core/service/evolution/EvolutionGateway`
   - `@alembic/core/service/knowledge/RecipePathRewriter`
   - `@alembic/core/types/reactive-evolution`
2. `RecipeImpactPlanner` 若仍被外层使用，应改为 `@alembic/core/service/evolution/RecipeImpactPlanner`；若只是重复副本，删除。
3. `RecipeProductionGateway` 若仍被外层使用，应改为 `@alembic/core/service/knowledge/RecipeProductionGateway`；若只是重复副本，删除。
4. `BootstrapDedup`、`CandidateAggregator`、`KnowledgeService`、`SourceRefReconciler`、`RecipeParser`、`RecipePathRewriter`、`PanoramaService`、`PanoramaScanner`、`PanoramaTypes` 等重复副本全部改 Core 或删除。
5. 保留 Plugin-only：
   - `git-diff-checkpoint/**`
   - `FileChangeDispatcher`
   - `FileChangeHandler` wrapper
   - `DaemonFileChangeCollector` 如果 Plugin 仍需要
   - Codex MCP/handler/transport/preflight/channel。

AlembicPlugin 修正后必须重跑：

```bash
rg -n "from ['\"](#service/(knowledge|candidate|recipe|quality|evolution|panorama)|#repository/code|#types/reactive-evolution|#service/bootstrap/BootstrapDedup|\\.\\.?/.*lib/service/(knowledge|candidate|recipe|quality|evolution|panorama)|\\.\\.?/.*lib/repository/code)" lib bin test
rg -n "from ['\"](\\./|\\.\\./).*ContentImpactAnalyzer|from ['\"](\\./|\\.\\./).*BootstrapDedup|from ['\"](\\./|\\.\\./).*Panorama|from ['\"](\\./|\\.\\./).*KnowledgeService|from ['\"](\\./|\\.\\./).*SourceRefReconciler" lib/service lib/repository lib/workflows test
npx vitest run test/unit/KnowledgeService.test.ts test/unit/BootstrapDedup.test.ts test/unit/production-gateway.test.ts test/unit/SourceRefReconciler-signal.test.ts test/unit/RecipeImpactPlanner.test.ts test/unit/ConsolidationAdvisor.test.ts test/unit/DecayDetector.test.ts test/unit/content-patcher.test.ts test/unit/PanoramaService.test.ts test/unit/PanoramaAggregator.test.ts test/unit/PanoramaScanner.test.ts test/unit/LayerInferrer.test.ts test/unit/Phase2-PanoramaIntegration.test.ts test/unit/ContentImpactAnalyzer.test.ts
npm run build:check
```

### 阶段 8 边界确认

- `KnowledgeFileWriter` / `KnowledgeSyncService` 按阶段 4 删除计划处理。
- AI extraction/provider、agent runtime、tool runtime、ModuleService、FileChangeDispatcher、daemon/file watcher、delivery/wiki/handler/transport 继续留外层。
- `KnowledgeService.publish()` 的交付动作通过外层 `afterPublish` hook 完成，Core 不直接依赖 CursorDelivery 或 ServiceContainer。

## 继续顺序：阶段 9

下一步验收 host-agent 知识挖掘闭环。重点确认 cold-start/rescan intent、plan、mission briefing、external submission、completion/checkpoint/persistence 等宿主无关闭环能力已接 Core，同时 internal-agent execution、BootstrapEventEmitter、CompletionSteps、delivery nextActions、MCP/HTTP/Codex transport 继续留外层。

## 阶段 9：host-agent 知识挖掘闭环

验收时间：2026-05-17

目标：两个外层仓库使用 Core 的 cold-start/rescan intent、plan、presenter、mission briefing、external submission tracker、mining session、external completion、dimension checkpoint、workflow report/snapshot persistence、knowledge rescan planning；外层保留 internal-agent execution、BootstrapEventEmitter、WorkflowSkillCompletionCapability、WorkflowCompletionFinalizer、CompletionSteps、delivery nextActions、MCP/HTTP/Codex transport。

### Alembic 验收

结论：功能测试通过，但扫描未清零，需要清理本地 persistence/internal-agent 交叉引用。

证据：

- 代表测试通过：`npx vitest run test/unit/ExternalDimensionCompletionWorkflow.test.ts test/unit/MissionBriefingProfile.test.ts test/unit/KnowledgeRescanIntent.test.ts test/unit/KnowledgeRescanPlan.test.ts test/unit/AuditEmission-MissionBriefing.test.ts test/unit/FileDiffSnapshotStore.test.ts test/unit/BootstrapRescanState.test.ts`，7 个测试文件、31 个测试通过。
- `npm run build:check` 已在本轮验收中通过。
- `ExternalColdStartWorkflow.ts` 已正确调用 Core 的 `createExternalWorkflowSession`、`buildExternalMissionBriefing`、Core `ColdStartIntent/Plan/Presenters` 和 Core `ProjectIntelligenceCapability`。
- `ExternalDimensionCompletionWorkflow.ts` 已使用 Core `saveDimensionCheckpoint`，但仍保留外层 skill generation、BootstrapEventEmitter、completion finalizer，这是允许的外层行为。
- 扫描仍命中：
  - `lib/workflows/capabilities/persistence/**` 内部仍使用本地 `#workflows/capabilities/persistence/*`
  - `lib/workflows/capabilities/execution/internal-agent/**` 仍引用本地 persistence 类型/函数
  - MCP bootstrap/rescan handler 仍 re-export 本地 external/internal workflow wrapper
  - `test/unit/DimensionRestoreState.test.ts` 和 `AgentModuleBoundaries.test.ts` 仍列本地 persistence specifier

判断：

- Alembic 的外部 host-agent 主链路已经接 Core；internal-agent 和 completion/delivery 留外层是正确边界。
- 但本地 `persistence/**` 的宿主无关部分已进入 Core，若这些本地文件只是重复实现，应删除；若 internal-agent 仍需要恢复 helper，应拆成明确外层 helper，内部 import 改 Core。

Alembic 窗口补齐指令：

1. 保留：
   - `lib/workflows/capabilities/execution/internal-agent/**`
   - `WorkflowSkillCompletionCapability.ts`
   - `BootstrapEventEmitter`
   - `WorkflowCompletionFinalizer.ts`
   - `CompletionSteps.ts`
   - MCP/HTTP/CLI transport wrappers
   - Cursor/Wiki/Delivery nextActions。
2. 清理或改造：
   - `lib/workflows/capabilities/persistence/DimensionCheckpoint.ts`
   - `WorkflowReportHistoryStore.ts`
   - `WorkflowReportTypes.ts`
   - `WorkflowReportWriter.ts`
   - `WorkflowResultPersistence.ts`
   - `WorkflowSnapshotStore.ts`
3. internal-agent 若需要 checkpoint/report/snapshot，统一 import Core：
   - `@alembic/core/workflows/capabilities/persistence/DimensionCheckpoint`
   - `@alembic/core/workflows/capabilities/persistence/WorkflowReportTypes`
   - `@alembic/core/workflows/capabilities/persistence/WorkflowResultPersistence`
   - `@alembic/core/workflows/capabilities/persistence/WorkflowSnapshotStore`
4. MCP external bootstrap/rescan wrapper 可以保留，但 wrapper 内部必须只调用 Core host-agent workflow 能力和外层 transport/DI，不复制 Core session/briefing/persistence 实现。

### AlembicPlugin 验收

结论：功能测试通过，但阶段 9 接入未完成，需要补齐。

证据：

- 代表测试通过：`npx vitest run test/unit/ExternalDimensionCompletionWorkflow.test.ts test/unit/MissionBriefingProfile.test.ts test/unit/KnowledgeRescanIntent.test.ts test/unit/KnowledgeRescanPlan.test.ts test/unit/AuditEmission-MissionBriefing.test.ts test/unit/FileDiffSnapshotStore.test.ts test/unit/BootstrapRescanState.test.ts test/unit/CodexSessionScenarioRunner.test.ts`，8 个测试文件、37 个测试通过。
- `npm run build:check` 已在本轮验收中通过。
- `CodexSessionScenarioRunner.test.ts` 通过，说明 Codex session smoke 没有明显回退。
- 但扫描显示 Plugin 仍保留并使用大量本地 host-agent workflow 重复副本：
  - `lib/types/snapshot-views.ts`
  - `lib/workflows/cold-start/ColdStartIntent.ts`
  - `ColdStartPresenters.ts`
  - `lib/workflows/knowledge-rescan/KnowledgeRescanIntent.ts`
  - `KnowledgeRescanPresenters.ts`
  - `lib/workflows/capabilities/execution/external/**`
  - `lib/workflows/capabilities/planning/knowledge/**`
  - `lib/workflows/capabilities/persistence/**`
  - `lib/workflows/capabilities/presentation/**`
- `ExternalDimensionCompletionWorkflow.ts` 仍从本地 `#workflows/capabilities/persistence/DimensionCheckpoint.js` 导入 `saveDimensionCheckpoint`，这是阶段 9 明确应使用 Core 的部分。

AlembicPlugin 窗口补齐指令：

1. Codex MCP bootstrap/rescan/dimension-complete handler 保留在 Plugin，但 handler 内部调用 Core：
   - `@alembic/core/workflows/cold-start`
   - `@alembic/core/workflows/knowledge-rescan`
   - `@alembic/core/workflows/capabilities/execution/external`
   - `@alembic/core/workflows/capabilities/planning/knowledge`
   - `@alembic/core/workflows/capabilities/persistence`
   - `@alembic/core/types/snapshot-views`
2. 删除或切换本地重复：
   - `lib/types/snapshot-views.ts`
   - `lib/workflows/shared/**`
   - `lib/workflows/cold-start/ColdStartIntent.ts`
   - `ColdStartPlan.ts`
   - `ColdStartPresenters.ts` 中宿主无关部分
   - `lib/workflows/knowledge-rescan/KnowledgeRescanIntent.ts`
   - `KnowledgeRescanWorkflowPlan.ts`
   - `KnowledgeRescanPresenters.ts`
   - `lib/workflows/capabilities/execution/external/**` 中 session/briefing/submission/checkpoint 部分
   - `lib/workflows/capabilities/planning/knowledge/**`
   - `lib/workflows/capabilities/persistence/**`
   - `lib/workflows/capabilities/presentation/PanoramaSummaryPresenter.ts`
   - `TargetFileMapBuilder.ts`
3. Plugin 保留：
   - Codex preflight
   - Codex transport
   - MCP tool exposure/schema
   - permissions
   - plugin/channel 发布
   - any Codex-specific wrapper。

两个外层窗口修正后必须重跑：

```bash
rg -n "from ['\"](#workflows/(cold-start|knowledge-rescan|shared)|#workflows/capabilities/(execution/external|planning/knowledge|persistence|presentation)|#types/snapshot-views|\\.\\.?/.*lib/workflows/(cold-start|knowledge-rescan|shared)|\\.\\.?/.*lib/workflows/capabilities/(execution/external|planning/knowledge|persistence|presentation)|\\.\\.?/.*lib/types/snapshot-views)" lib bin test
npx vitest run test/unit/ExternalDimensionCompletionWorkflow.test.ts test/unit/MissionBriefingProfile.test.ts test/unit/KnowledgeRescanIntent.test.ts test/unit/KnowledgeRescanPlan.test.ts test/unit/AuditEmission-MissionBriefing.test.ts test/unit/FileDiffSnapshotStore.test.ts test/unit/BootstrapRescanState.test.ts
npm run build:check
```

Plugin 额外重跑：

```bash
npx vitest run test/unit/CodexSessionScenarioRunner.test.ts
```

### 阶段 9 边界确认

- Core 负责 host-agent mining loop 的任务、证据、briefing、submission、session 状态、校验、checkpoint、report/snapshot persistence。
- 宿主 agent 执行、internal-agent、tool system、skill generation、CompletionSteps、delivery nextActions、MCP/HTTP/Codex transport 全部留外层。

## 继续顺序：阶段 10

下一步验收 Guard 免疫系统。重点确认 GuardService、GuardCheckEngine、ReverseGuard、ComplianceReporter、RuleLearner、ViolationsStore、repository/guard 已接 Core，同时 CLI/HTTP/MCP handler、Codex tool schema、preflight、transport、权限策略继续留外层。

## 阶段 10：Guard 免疫系统

验收时间：2026-05-17

目标：两个外层仓库使用 Core 的 GuardService、GuardCheckEngine、ReverseGuard、ComplianceReporter、RuleLearner、ViolationsStore、GuardViolationRepository 等确定性 Guard 能力；CLI/HTTP/MCP handler、Codex tool schema、preflight、transport、权限策略、Dashboard/daemon wiring 继续留外层。

### Alembic 验收

结论：通过。

证据：

- 阶段 10 扫描只发现 `@alembic/core/service/guard/*`、`@alembic/core/repository/guard/*` 等 Core import，未发现本地 Guard 主链路引用。
- 代表测试通过：`npx vitest run test/unit/GuardScopeFiltering.test.ts test/unit/ReverseGuard.test.ts test/integration/GuardServiceFlow.test.ts test/integration/GuardCheck.test.ts test/integration/GuardImmuneSystem.test.ts test/integration/cross-module/GuardImmuneWiring.test.ts`，6 个测试文件、84 个测试通过。
- `npm run build:check` 已在本轮验收中通过。

Alembic 窗口后续指令：

- 可以把阶段 10 标记为外层接入完成。
- 后续统一删除阶段可评估删除 `lib/service/guard/**` 与 `lib/repository/guard/**` 重复实现。
- 保留 CLI guard、HTTP guard routes、MCP handler、ServiceContainer 装配、Dashboard/daemon wiring、权限和 preflight。

### AlembicPlugin 验收

结论：通过，但 HTTP API 测试需要在允许监听端口的环境运行。

证据：

- 阶段 10 扫描只发现 `@alembic/core/service/guard/*`、`@alembic/core/repository/guard/*` 等 Core import，未发现本地 Guard 主链路引用。
- Core Guard 代表测试通过：`npx vitest run test/unit/GuardScopeFiltering.test.ts test/integration/GuardServiceFlow.test.ts test/integration/GuardCheck.test.ts test/integration/GuardImmuneSystem.test.ts test/integration/cross-module/GuardImmuneWiring.test.ts test/integration/GuardApi.test.ts` 中，前 5 个测试文件、71 个测试先通过；`GuardApi.test.ts` 首次在沙盒内因 `listen EPERM: operation not permitted ::1:3550` 失败。
- 按沙盒规则提权单独重跑 `npx vitest run test/integration/GuardApi.test.ts` 后通过，1 个测试文件、2 个测试通过。该失败属于当前 Codex 沙盒端口监听限制，不是代码失败。
- `npm run build:check` 已在本轮验收中通过。

AlembicPlugin 窗口后续指令：

- 可以把阶段 10 标记为外层接入完成。
- Guard MCP handler 可以保留在 Plugin，但 handler 内部必须继续调用 Core Guard service/repository。
- 后续统一删除阶段可评估删除 `lib/service/guard/**` 与 `lib/repository/guard/**` 重复实现。
- 不删除 Codex MCP tool schema、preflight、transport、权限策略、channel/plugin 发布、Codex runtime。
- 因阶段 2/3/6/8/9 仍有 Plugin 重复实现残留，不要执行跨目录大删除；Guard 自身可以在扫描清零、测试和 build check 通过后作为独立删除批次处理。

两个外层窗口修正或删除前后必须重跑：

```bash
rg -n "lib/service/guard|#service/guard|service/guard/(Guard|ReverseGuard|ComplianceReporter|RuleLearner)|lib/repository/guard|#repository/guard|repository/guard/GuardViolationRepository" lib bin test
npx vitest run test/unit/GuardScopeFiltering.test.ts test/unit/ReverseGuard.test.ts test/integration/GuardServiceFlow.test.ts test/integration/GuardCheck.test.ts test/integration/GuardImmuneSystem.test.ts test/integration/cross-module/GuardImmuneWiring.test.ts
npm run build:check
```

Plugin 额外重跑：

```bash
npx vitest run test/integration/GuardApi.test.ts
```

### 阶段 10 边界确认

- Core 负责 Guard check、scope filtering、coverage analysis、RuleLearner、ReverseGuard、ComplianceReporter、violations persistence。
- CLI/HTTP/MCP/Codex tool exposure、权限、preflight、transport、Dashboard/daemon wiring 都继续留外层。

## 继续顺序：阶段 11

下一步验收交付渠道边界。重点确认 delivery、context injection、AGENTS.md/Skills 生成、IDE/Codex 注入、插件独立交付渠道都没有进入 Core，同时两个外层仓库的 delivery/plugin/channel 行为继续保留。

## 阶段 11：交付渠道留外层

验收时间：2026-05-17

目标：确认 delivery、context injection、AGENTS.md/Skills 生成、IDE/Codex 注入和插件独立交付渠道都留在外层；Core 不实现多渠道交付，不提供 Cursor/Codex/IDE/Plugin delivery abstraction。

### Alembic 验收

结论：通过。

证据：

- 外层 delivery 文件仍保留：
  - `lib/service/delivery/CursorDeliveryPipeline.ts`
  - `KnowledgeCompressor.ts`
  - `TokenBudget.ts`
  - `TopicClassifier.ts`
  - `RulesGenerator.ts`
  - `AgentInstructionsGenerator.ts`
  - `FileProtection.ts`
  - `SkillsSyncer.ts`
  - `lib/repository/delivery/DeliveryRepoAdapter.ts`
- 扫描未发现 `@alembic/core/.../delivery`、`@alembic/core/.../CursorDeliveryPipeline` 或 `#service/delivery` 这类错误迁移/错误接入。
- 代表测试通过：`npx vitest run test/unit/CursorDeliveryPipeline.test.ts test/unit/DeliveryCompletionStep.test.ts test/unit/FileProtection.mergeSection.test.ts`，3 个测试文件、52 个测试通过。
- `npm run build:check` 已在本轮验收中通过。

Alembic 窗口后续指令：

- 可以把阶段 11 标记为外层边界验收完成。
- 不删除 `lib/service/delivery/**`、`lib/repository/delivery/**`、`lib/service/skills/**`、`lib/injection/**` 中的交付装配。
- 不把 `TokenBudget` / `KnowledgeCompressor` 顺手迁入 Core；若以后要抽纯算法 utility，必须新开阶段并完整复制、完整测试。

### AlembicPlugin 验收

结论：通过。

证据：

- Plugin 外层保留了 Codex channel、plugin submodule、runtime packaging、injectable skills：
  - `channels/codex/channel.json`
  - `plugins/alembic-codex/**`
  - `injectable-skills/**`
  - `lib/shared/channel.ts`
  - `lib/service/skills/**`
- 扫描未发现 `@alembic/core/.../delivery`、`@alembic/core/.../CursorDeliveryPipeline` 或 `#service/delivery` 这类错误迁移/错误接入。
- 代表测试通过：`npx vitest run test/unit/CodexPluginCacheSync.test.ts test/unit/progressive-chain-validation-skill.test.ts test/unit/folder-names.test.ts test/unit/CodexRuntimeContext.test.ts`，4 个测试文件、18 个测试通过。
- Channel 验证通过：`node scripts/verify-codex-channel.mjs`，输出 `Codex channel verification passed (alembic-ai@0.1.2).`
- `npm run build:check` 已在本轮验收中通过。

AlembicPlugin 窗口后续指令：

- 可以把阶段 11 标记为外层边界验收完成。
- 不删除：
  - `channels/**`
  - `plugins/alembic-codex/**`
  - `injectable-skills/**`
  - `lib/shared/channel.ts`
  - `lib/service/skills/**`
  - `scripts/prepare-codex-plugin-runtime.mjs`
  - `scripts/release-codex-plugin.mjs`
  - `scripts/smoke-codex-plugin.mjs`
  - `scripts/verify-codex-plugin.mjs`
  - `scripts/sync-codex-plugin-cache.mjs`
- 插件交付渠道继续独立维护；Core 只提供可查询、可校验、可持久化的知识与 Guard/搜索/项目智能结果。

### 阶段 11 边界确认

- `AGENTS.md` / Skills / Cursor rules / plugin channel / Codex runtime packaging 都留外层。
- Core 不新增 delivery exports、不新增 plugin channel exports、不新增 Codex/IDE 交付抽象。
- 本阶段没有 Core 删除计划；外层交付文件不是重复实现，不能按迁移清理删除。

## 继续顺序：阶段 12

下一步验收 tool system 边界。重点确认 Alembic tool catalog/router/handler、terminal/mac/dashboard/skill adapter、tool output compressor、Codex MCP tool exposure 都留外层，Core host-agent workflow 没有依赖外层 tool router。

## 阶段 12：Tool system 不迁移

验收时间：2026-05-17

目标：确认 Alembic tool catalog/router/handler、terminal/mac/dashboard/skill adapter、tool output compressor、tool forge、Codex MCP tool exposure 都留外层；Core 不包含 `lib/tools/**`，Core host-agent workflow 不依赖 Alembic tool router。

### Core 边界验证

结论：通过。

证据：

- `AlembicCore` 中没有 `src/**/tools` 实现目录。
- 扫描 `ToolRouter`、`ToolRegistry`、`ToolContextFactory`、`ToolResultEnvelope`、`#tools`、`lib/tools`、`tools/v2`、`tools/core`、`tools/catalog` 时，只命中 `test/CoreToolSystemBoundary.test.ts`、`test/CoreDeliveryBoundary.test.ts` 的边界断言和 `Logger.ts` 的字符串列表。
- Core 边界测试通过：`npx vitest run test/CoreToolSystemBoundary.test.ts`，1 个测试文件、5 个测试通过。

### Alembic 验收

结论：通过。

证据：

- `lib/tools/**` 完整保留，包含：
  - `lib/tools/core/**`
  - `lib/tools/catalog/**`
  - `lib/tools/v2/**`
  - `lib/tools/adapters/**`
  - `lib/tools/workflow/**`
- 扫描未发现 `@alembic/core/tools` 或 `@alembic/core/.../ToolRouter` 这类错误接入。
- 扫描发现的 `#tools/**` 都是 Alembic 外层 tool system、agent runtime、MCP/HTTP/DI 对外层 tool system 的合法引用。
- 代表测试批量运行中，除 `TerminalAdapter.test.ts` 因当前 Codex 沙盒 `sandbox-exec: sandbox_apply: Operation not permitted` 失败外，其余 13 个测试文件、162 个测试通过。
- 按沙盒规则单独提权重跑 `npx vitest run test/unit/TerminalAdapter.test.ts` 后通过，1 个测试文件、20 个测试通过。
- 因此阶段 12 Alembic 工具系统代表测试等价通过 14 个测试文件、174 个测试。
- `npm run build:check` 已在本轮验收中通过。

Alembic 窗口后续指令：

- 可以把阶段 12 标记为外层边界验收完成。
- 不删除 `lib/tools/**`、`lib/agent/**` 中依赖 tool contracts/runtime 的外层代码。
- 不把 `ToolContracts`、`ToolResultEnvelope`、`ToolContextFactory`、`OutputCompressor`、terminal policy/capability、ToolForge、TemporaryToolRegistry 抽入 Core。
- 终端执行类测试在受限环境可能需要非沙盒或真实终端权限；失败日志若是 `sandbox-exec` EPERM，应按环境问题处理，再单独重跑确认。

### AlembicPlugin 验收

结论：通过。

证据：

- `lib/tools/**` 完整保留，包含 tool core/catalog/v2/adapters/workflow。
- 扫描未发现 `@alembic/core/tools` 或 `@alembic/core/.../ToolRouter` 这类错误接入。
- 扫描发现的 `#tools/**` 都是 Plugin 外层 tool system、Codex agent runtime、MCP/HTTP/DI、runtime dist 对外层 tool system 的合法引用。
- 代表测试通过：`npx vitest run test/unit/V2ToolSystem.test.ts test/unit/v2/ToolRegistryV2.test.ts test/unit/ToolForgeIntegration.test.ts test/unit/TemporaryToolRegistry.test.ts test/unit/ToolExecutionPipeline.test.ts test/unit/ToolRequirementAnalyzer.test.ts test/unit/TerminalAdapter.test.ts test/unit/TerminalSessionManager.test.ts test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalArtifacts.test.ts test/unit/SkillAdapter.test.ts test/unit/AiRouteDirectTool.test.ts test/unit/knowledge-manage-evolution.test.ts`，13 个测试文件、170 个测试通过。
- `npm run build:check` 已在本轮验收中通过。

AlembicPlugin 窗口后续指令：

- 可以把阶段 12 标记为外层边界验收完成。
- 不删除 `lib/tools/**`、`lib/agent/**`、Codex MCP tool exposure、tool policy、tool preflight、runtime dist 中的 tool system。
- 不把 Codex MCP tool schema/router/handler/terminal adapter 下沉到 Core。

### 阶段 12 边界确认

- Core 不拥有 Alembic tool catalog、router、handler、tool output compressor、terminal/mac/dashboard/skill adapter、ToolForge。
- 外层工具系统可以调用 Core 的知识、搜索、Guard、项目智能能力，但 Core 不反向依赖外层 tool router。
- 本阶段没有 Core 删除计划；外层 `lib/tools/**` 不是迁移重复文件，不能删除。

## 继续顺序：阶段 13

下一步验收 Codex 边界。重点确认 Codex runtime、Codex MCP server、plugin diagnostics、channel/env、preflight、权限、plugin packaging 继续留在 AlembicPlugin 外层；Alembic/Core 不承接 Codex 专属运行时。

## 阶段 13：Codex 边界留在 Plugin

验收时间：2026-05-17

目标：确认 Codex runtime、preflight、tool policy、MCP tool metadata、runtime diagnostics、plugin registry、channel/env、plugin packaging 全部留在 AlembicPlugin；Core 不承载 Codex host 边界，也不承载 Codex tool exposure。Alembic 本体如保留 Codex MCP shim，也只能作为外层 shim，不从 Core 引入 Codex 契约。

### Core 边界验证

结论：通过。

证据：

- `AlembicCore` 中没有 `src/codex`、`src/external/mcp`、`src/plugins`、`src/channels`、`src/marketplace` 等 Codex/plugin/channel 实现目录。
- 扫描 `Codex`、`codex`、`external/mcp`、`channels`、`plugins`、`marketplace`、`ALEMBIC_CODEX`、`ALEMBIC_CHANNEL`、`#codex` 时，除 `test/CoreCodexBoundary.test.ts`、`test/CoreDeliveryBoundary.test.ts` 边界断言外，只出现通用项目发现语境中的 `plugins` 字段、`JobStore` 的 `source: 'codex'` 字符串和 snippet 示例。这些不是 Codex runtime。
- Core 边界测试通过：`npx vitest run test/CoreCodexBoundary.test.ts`，1 个测试文件、6 个测试通过。

### Alembic 验收

结论：通过，保留外层 Codex MCP shim。

证据：

- Alembic 本体仍保留 `lib/external/mcp/CodexMcpServer.ts`、`bin/codex-mcp.ts`、`plugins/alembic-codex/**`、`scripts/*codex*` 等外层 shim / 发布辅助文件。
- 扫描未发现 `@alembic/core/codex`、`@alembic/core/external/mcp`、`@alembic/core/.../Codex` 这类错误接入。
- 扫描命中的 Codex 内容都在 Alembic 外层 MCP shim、CLI、release/smoke scripts、plugin assets 和测试内。
- 代表测试通过：`npx vitest run test/unit/CodexMcpServer.test.ts`，1 个测试文件、18 个测试通过。
- `npm run build:check` 已在本轮验收中通过。

Alembic 窗口后续指令：

- 可以把阶段 13 标记为外层边界验收完成。
- 保留 Alembic 外层 Codex MCP shim、CLI entry、plugin release/smoke/verify scripts、plugin assets。
- 不从 Core 引入 Codex runtime/preflight/tool policy/tool metadata。
- 如果后续 Alembic 本体不再承担 Codex 发布辅助，可以由产品发布策略单独决定删除；不要把它归入 AlembicCore 迁移删除计划。

### AlembicPlugin 验收

结论：通过。

证据：

- Plugin Codex 边界文件完整保留：
  - `lib/codex/KnowledgeState.ts`
  - `Preflight.ts`
  - `ToolPolicy.ts`
  - `StatusService.ts`
  - `RuntimeContext.ts`
  - `Diagnostics.ts`
  - `ProjectRootResolver.ts`
  - `PluginRegistry.ts`
  - `lib/external/mcp/CodexMcpServer.ts`
  - `lib/external/mcp/tools.ts`
  - `channels/**`
  - `plugins/alembic-codex/**`
  - `scripts/*codex*`
- 扫描未发现 `@alembic/core/codex`、`@alembic/core/external/mcp`、`@alembic/core/.../Codex` 这类错误接入。
- 代表测试通过：`npx vitest run test/unit/CodexKnowledgeState.test.ts test/unit/CodexToolPolicy.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexRuntimeContext.test.ts test/unit/CodexProjectRootResolver.test.ts test/unit/CodexPluginCacheSync.test.ts test/unit/CodexSessionScenarioRunner.test.ts test/unit/CodexMcpServer.test.ts`，8 个测试文件、63 个测试通过。
- 插件验证通过：`node scripts/verify-codex-plugin.mjs`，输出 `Codex plugin verification passed (./runtime.tgz -> alembic-ai@0.1.2).`
- 阶段 11 已额外验证 `node scripts/verify-codex-channel.mjs` 通过。
- `npm run build:check` 已在本轮验收中通过。

AlembicPlugin 窗口后续指令：

- 可以把阶段 13 标记为外层边界验收完成。
- 不删除：
  - `lib/codex/**`
  - `lib/external/mcp/CodexMcpServer.ts`
  - `lib/external/mcp/tools.ts`
  - Codex MCP handlers/schema/preflight/policy/permission/metadata
  - `channels/**`
  - `plugins/alembic-codex/**`
  - `scripts/*codex*`
  - runtime dist / runtime.tgz / plugin marketplace assets。
- `KnowledgeState` 若发现与 Core repository/storage 完全重复的读取逻辑，应改为调用 Core service；不要把 Codex state 文件迁到 Core。
- Codex MCP server 可以调用 Core workspace/domain/storage/search/guard/host-agent mining loop，但 Codex 如何展示工具、如何 preflight、如何判断 admin visibility、如何发布 plugin 都继续由 Plugin 负责。

### 阶段 13 边界确认

- Core 不拥有 Codex runtime、Codex MCP server、Codex preflight、Codex tool policy、MCP tool metadata、plugin registry、channel、marketplace。
- 外层可继续变薄，但 Codex/plugin/channel 是 Plugin 交付边界，不是 Core 迁移对象。
- 本阶段没有 Core 删除计划；Codex 相关测试继续留在 Plugin，不迁移到 Core。

## 1-13 阶段验收后续总指令

当前 1-13 阶段验收结论：

- Alembic：阶段 1-8、10-13 通过；阶段 9 功能测试通过但需要清理本地 host-agent persistence/internal-agent 交叉引用。
- AlembicPlugin：阶段 1、4、5、7、10-13 通过；阶段 2、3、6、8、9 仍有本地重复实现或本地引用，需要继续补齐。
- 两个仓库都不应执行跨目录大删除；删除必须按阶段、按扫描清零、按代表测试和 `npm run build:check` 通过后执行。

两个外层窗口下一轮优先级：

1. AlembicPlugin 先补阶段 2：workspace/path/config/io 全部改 Core，只保留 `package-assets` adapter 和 Codex ProjectRootResolver。
2. AlembicPlugin 补阶段 3：`lib/domain/**`、`lib/types/knowledge-wire.ts` 重复副本改 Core 或删除。
3. AlembicPlugin 补阶段 6：project-intelligence / AST / grammar resource 调用改 Core，删除本地 duplicate。
4. AlembicPlugin 补阶段 8：FileChange/evolution/panorama/BootstrapDedup/RecipeProductionGateway 重复副本改 Core 或删除。
5. Alembic 与 AlembicPlugin 同步补阶段 9：host-agent workflow persistence、external session/briefing/submission/checkpoint/report/snapshot 统一用 Core；internal-agent/tool/skill/completion/delivery/transport 留外层。
6. 完成以上补齐后，再回到阶段 1-13 删除候选清单，分批删除重复文件并每批重跑对应阶段扫描、代表测试和 `npm run build:check`。
