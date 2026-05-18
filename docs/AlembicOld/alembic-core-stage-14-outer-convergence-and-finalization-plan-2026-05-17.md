# AlembicCore 阶段 14 外层接入、边界收敛与最终收尾计划

日期：2026-05-17

范围：

- `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore`

输入文档：

- `docs/alembic-core-full-copy-migration-execution-manual-2026-05-16.md`
- `docs/alembic-core-implementation-boundary-analysis-2026-05-16.md`
- `docs/alembic-core-outer-stage-1-13-acceptance-followup-2026-05-17.md`

目标：完成第 14 阶段外层接入、边界收敛、重复实现删除和最终验收。外层仓库可以变薄，但不能变空；外层必须继续保留 adapter、transport、delivery、Codex/plugin/channel、internal agent/tool system 等宿主能力。

## 0. 执行前提更新

2026-05-17 用户确认：可以把阶段 1-13 的验证修复视为已经完成或正在由 Alembic / AlembicPlugin 两个外层窗口执行中。本计划不再把阶段 1-13 的补齐工作作为本窗口阻塞项；阶段 14 的入口改为：

- 等两个外层窗口回报阶段 1-13 修复完成。
- 本窗口基于回报结果做复验、边界判断、删除门禁确认和最终收尾文档。
- Alembic / AlembicPlugin 两个窗口继续负责各自代码修改、删除和提交。
- 本窗口只在 Core 缺 export、缺兼容类型、边界测试需要补强时修改 Core。

因此，本文第 5、6 节中的 Alembic-A / Plugin-A 到 Plugin-E 是两个外层窗口已在执行或即将回报的任务清单；阶段 14 真正开始删除前，必须先拿到这些任务的扫描、测试和 build 结果。

## 1. 硬性规则

### 1.1 阶段入口规则

- 当前 Core 阶段 1-13 已完成，并通过边界测试锁住 delivery、tool system、Codex 不进入 Core。
- 阶段 14 的入口不是继续迁移 Core，而是复验 Alembic / AlembicPlugin 两个窗口的阶段 1-13 修复结果。
- 两个外层窗口必须分别回报扫描、代表测试、`npm run build:check` 和 `git status --short`，本窗口确认后才允许进入删除批次。
- 如果外层窗口只说“已修完”但没有证据，不能进入删除批次。
- 如果某阶段扫描仍有命中，必须分类为“应修残留”或“允许保留边界”；没有分类的命中视为未完成。

### 1.2 Core 边界规则

- 阶段 14 不继续向 Core 搬 Codex runtime、delivery、tool system、MCP stdio、Dashboard、CLI、IDE 写入适配器或 Alembic internal agent。
- Core 只允许做兼容性补丁：
  - 补缺失 package export。
  - 补 public index 导出。
  - 补真实外层接入需要的类型契约。
  - 补边界测试。
- 禁止为了删除外层文件而在 Core 中新增 thin facade、空壳 adapter 或没有真实实现闭包的转发层。
- 如果 Core 发生任何提交，Alembic 和 AlembicPlugin 的 `vendor/AlembicCore` 必须同步指向同一个 Core 提交，并各自重跑 `npm run build:check`。

### 1.3 外层保留规则

- Alembic 必须保留 CLI、Dashboard、HTTP server、Lark/Feishu、macOS/native UI、IDE installer、release scripts、delivery/instructions、internal agent execution、MCP/HTTP/CLI transport。
- AlembicPlugin 必须保留 Codex MCP server、Codex runtime env、plugin/channel/marketplace 发布资产、Codex preflight/tool policy/tool metadata、plugin cache sync、插件独立交付渠道。
- 两个外层仓库都必须保留：
  - `lib/agent/**`
  - `lib/tools/**`
  - ServiceContainer / module wiring
  - AI provider、AI config、API key 管理
  - transport、handler、preflight、permission、runtime adapter
- `AGENTS.md` 必须保留；回退、同步、删除、提交、子仓库指针更新时都不能丢失。
- `dist/` 是构建产物，应由 `.gitignore` 忽略；npm 发布通过 `files: ["dist", ...]` 控制产物入包，不提交构建产物到源码仓库。

### 1.4 删除授权规则

- 删除计划只列候选，不自动授权删除。
- 删除必须小批次执行；每个批次必须绑定一个阶段、一个扫描命令、一组代表测试和一次 `npm run build:check`。
- 不允许跨阶段大删除，不允许“扫描没清完先删一部分试试”。
- 不允许删除测试来降低验证压力。
- 不允许通过降低断言、跳过测试、改测试期望来掩盖行为回退。
- 删除前必须记录：
  - 删除文件清单。
  - 每个文件为何已被 Core 替代。
  - 哪些外层 adapter 明确保留。
  - 对应扫描结果。
  - 对应测试结果。
- 删除后如果 build 或测试失败，优先恢复删除批次或改正确 import；不得用薄实现补洞。

### 1.5 Import 收敛规则

- 进入 Core 的能力，外层 import 必须使用 `@alembic/core/...`，不能继续通过 `#shared`、`#domain`、`#core`、`#service`、`#repo`、`#types` 指向本地重复实现。
- 外层 wrapper 可以保留本地文件名，但 wrapper 内部必须调用 Core 内核；不能复制 Core session、briefing、persistence、repository、service 主逻辑。
- 如果扫描命中 MCP/HTTP/CLI handler、Codex wrapper、delivery wrapper、internal-agent wrapper，需要在报告中列入 allowlist，并说明它只做 transport/adapter/wiring。
- `package.json` 的 `imports` alias 不先删。必须等所有本地引用清零、文件删除完成、build 通过后，再评估 alias 是否还需要。
- `package-assets.ts` / `AppConfigLoader.ts` 这类外层 package-root adapter 是允许保留的，不应作为 Core 重复实现删除。

### 1.6 连通性规则

- 删除任何 repository/service/workflow 文件前，必须检查 ServiceContainer、MCP handlers、CLI routes、HTTP routes、daemon runner、Codex server 是否仍能连到 Core 实现。
- Knowledge 链路必须保持闭环：
  - bootstrap/rescan 生成 project intelligence。
  - host agent mission briefing 可生成。
  - submit/complete 可校验。
  - SourceRef/Knowledge/Recipe 可落库。
  - search/vector/guard 可读取更新后的知识。
- Alembic 的 `afterPublish -> cursorDeliveryPipeline.deliver()` 是外层 delivery 行为，必须保留。
- AlembicPlugin 的 Codex channel/plugin 发布和 `verify-codex-plugin` 是外层交付行为，必须保留。
- Provider 不可用时，Core keyword/weighted search、storage、Guard、host-agent briefing 不能被 AI provider 阻断。

### 1.7 验收证据规则

- “编译通过”不是完成。每个批次都需要：
  - import 扫描。
  - 代表测试。
  - 边界保留检查。
  - `npm run build:check`。
  - `git status --short`。
- 终端执行或端口监听测试如果因沙盒限制失败，必须在可执行子进程或可监听端口环境单独重跑，并在报告中标注是环境问题还是代码问题。
- Plugin 发布链路最终必须至少验证：
  - `node scripts/verify-codex-channel.mjs`
  - `node scripts/verify-codex-plugin.mjs`
- 三仓库最终状态必须可解释；不能留下未说明的修改、未提交删除、未同步 Core 指针或未解释的 generated assets。

### 1.8 提交与同步规则

- 三个仓库独立提交，不能把 Alembic、AlembicPlugin、AlembicCore 的修改混在一个不可追踪状态里。
- Core 如有改动，先提交 Core，再让两个外层仓库更新 `vendor/AlembicCore` 指针。
- Alembic / AlembicPlugin 删除批次建议按阶段提交，提交信息必须能看出删除属于哪个阶段。
- Plugin runtime/package/channel 资产如因验证脚本生成变化，必须由 Plugin 窗口说明来源；没有来源说明不得提交。
- 任一仓库若 `git status --short` 非空，最终报告必须列出每个路径的处理决定。

## 2. 当前真实代码连通性

### 2.1 三仓库依赖关系

- Alembic 和 AlembicPlugin 都通过 `@alembic/core: file:vendor/AlembicCore` 接入 Core。
- 两个外层仓库的 `build:check` 都先执行 `npm run build:core`，即先编译 `vendor/AlembicCore/tsconfig.json`，再 typecheck 外层。
- Core `package.json` 已导出 shared、domain、daemon、core、infrastructure、repository、service、types、workflows 等入口，包含阶段 14 所需的：
  - `@alembic/core/infrastructure/config/*`
  - `@alembic/core/infrastructure/io/*`
  - `@alembic/core/domain/*`
  - `@alembic/core/core/{analysis,ast,discovery,enhancement}/*`
  - `@alembic/core/service/{knowledge,evolution,panorama,guard,search,vector}/*`
  - `@alembic/core/types/*`
  - `@alembic/core/workflows/{cold-start,knowledge-rescan,capabilities/*}`

### 2.2 DI 和运行时连接点

Alembic 和 AlembicPlugin 的 `ServiceContainer` 结构高度一致：

- `InfraModule` 已大量使用 Core repository、EventBus、JobStore、ReportStore、Logger、WriteZone、KnowledgeFileWriter、KnowledgeSyncService。
- `KnowledgeModule` 已大量使用 Core knowledge/search/vector/evolution/panorama/domain service。
- `GuardModule` 已使用 Core Guard。
- `AgentModule` 仍然保留外层 `#agent/**`、`#tools/**`，这是正确边界。
- `AiModule`、AI provider、embedding provider、model/key/runtime 配置仍留外层，这是正确边界。

重要差异：

- Alembic `KnowledgeService` 注册了 `afterPublish`，会触发外层 `cursorDeliveryPipeline.deliver()`；这是 Alembic delivery 边界，不能迁入 Core。
- AlembicPlugin `KnowledgeService` 没有 `afterPublish` delivery hook；插件交付由 Codex channel/plugin 独立链路承担。
- Alembic `AgentModule` 额外注册 `MacSystemAdapter`、MCP tool discovery/adapter；Plugin 的 `AgentModule` 更窄，只保留 Codex 插件需要的 terminal/skill/workflow/dashboard 工具边界。
- Alembic `InfraModule` 保留 `RemoteCommandRepository`；Plugin 不保留 remote repository。这是 Alembic 主仓库外层能力，不归 Core 删除。

### 2.3 关键真实残留

以下残留来自 2026-05-17 当前代码扫描，阶段 14 必须按这些真实连接拆任务。

AlembicPlugin 阶段 2 残留：

- `lib/bootstrap.ts` 仍从本地导入：
  - `./infrastructure/config/ConfigLoader.js`
  - `./shared/WorkspaceSettingsStore.js`
  - `./shared/package-root.js`
- `lib/cli/SetupService.ts` 动态导入本地 `../infrastructure/config/ConfigLoader.js`。
- `test/unit/ConfigLoader.test.ts` 仍导入本地 `../../lib/infrastructure/config/ConfigLoader.js`。
- `test/unit/WorkspaceSettingsStore.test.ts` 仍导入本地 `../../lib/shared/WorkspaceSettingsStore.js`。
- `lib/codex/AiConfigState.ts`、`lib/external/mcp/CodexMcpServer.ts`、`lib/http/routes/ai.ts` 仍使用本地 `WorkspaceSettingsStore`。
- `lib/infrastructure/io/WriteZone.ts` 仍依赖本地 `#shared/PathGuard` / `#shared/WorkspaceResolver`。
- `lib/infrastructure/config/Paths.ts`、`Defaults.ts` 仍依赖本地 `PathGuard` / `ProjectMarkers`。

AlembicPlugin 阶段 3 残留：

- `lib/domain/dimension/RecipeDimension.ts` 仍 import 本地 `#domain/dimension/DimensionRegistry.js`。
- `lib/domain/knowledge/KnowledgeEntry.ts` 仍 import 本地 `#types/knowledge-wire.js`。
- `lib/agent/prompts/domain/EvidenceCollector.ts` 被 agent prompt 相对引用，属于 agent prompt 子域，不能误当 Core domain 删除。

AlembicPlugin 阶段 6 残留：

- `lib/workflows/capabilities/project-intelligence/**` 仍有本地重复实现引用。
- `ProjectIntelligenceRunner.ts` 仍 import 本地 `#core/analysis/CallGraphAnalyzer.js`。
- `FileDiffPlanner.ts`、`ProjectIntelligenceIncrementalPlanner.ts` 等仍互相引用本地 project-intelligence 文件。

AlembicPlugin 阶段 8 残留：

- `lib/service/evolution/FileChangeHandler.ts` 仍 import 本地 `./ContentImpactAnalyzer.js`。
- `lib/service/evolution/RecipeImpactPlanner.ts` 仍 import 本地 `./ContentImpactAnalyzer.js`。
- `lib/service/knowledge/RecipeProductionGateway.ts` 仍 import 本地 `../bootstrap/BootstrapDedup.js` 类型。
- `lib/service/panorama/**` 仍是本地 panorama service 内部闭环。
- `bin/daemon-server.ts` 和 `test/unit/GitDiffCheckpoint.test.ts` 使用 `git-diff-checkpoint/**`，这是 Plugin-only 外层能力，应保留。

阶段 9 两仓库残留：

- Alembic 的 external cold-start wrapper 已调用 Core session/briefing/project intelligence，但仍保留本地 workflow persistence 文件与 internal-agent 引用。
- Alembic `ExternalDimensionCompletionWorkflow.ts` 已从 Core 导入 `saveDimensionCheckpoint`，但仍保留本地 completion、skill generation、BootstrapEventEmitter，这是正确边界。
- AlembicPlugin `ExternalDimensionCompletionWorkflow.ts` 仍从本地 `#workflows/capabilities/persistence/DimensionCheckpoint.js` 导入 `saveDimensionCheckpoint`，必须改 Core。
- AlembicPlugin 仍保留本地 `types/snapshot-views.ts`、cold-start/knowledge-rescan intent/presenter/planning/persistence/external session/briefing 等重复副本。
- 两仓库 MCP handler 继续 re-export 外层 workflow wrapper，这是正确边界；wrapper 内部才需要收敛。

## 3. 阶段 14 总体顺序

阶段 14 分成八个批次执行。用户已确认 1-13 修复由外层窗口推进，因此 14.1-14.5 在本窗口中主要作为回报验收门禁；真正的删除从 14.6 开始。不要跳批，不要跨批大删。

1. 14.0 基线冻结和扫描脚本固定。
2. 14.1 验收 AlembicPlugin 阶段 2 workspace/path/config/io 收敛回报。
3. 14.2 验收 AlembicPlugin 阶段 3 domain/types 收敛回报。
4. 14.3 验收 AlembicPlugin 阶段 6 project intelligence / AST / grammar 收敛回报。
5. 14.4 验收 AlembicPlugin 阶段 8 knowledge/evolution/panorama 收敛回报。
6. 14.5 验收两仓库阶段 9 host-agent workflow persistence 收敛回报。
7. 14.6 两仓库重复实现删除与 package/alias 清理。
8. 14.7 最终连通性、发布链路、仓库状态收尾。

## 4. 本窗口任务

本窗口只负责 Core 侧文档、边界判断、验收设计和必要的 Core 兼容修复，不直接修改 Alembic / AlembicPlugin 外层代码。

### 4.1 文档任务

- 维护本阶段计划文档。
- 根据 Alembic / AlembicPlugin 两个窗口的执行结果，持续补充：
  - 批次验收结论
  - 新发现的边界问题
  - 删除候选变更
  - 需要 Core 补 export 或兼容 API 的事项
- 将最终收尾报告追加到 `docs/alembic-core-outer-stage-1-13-acceptance-followup-2026-05-17.md` 或新建最终验收报告。

### 4.2 Core 任务

仅在外层接入遇到以下问题时改 Core：

- Core 已有实现但缺 package export。
- Core 已有实现但 public index 漏导出，导致外层只能深路径绕过。
- Core 类型契约与真实外层 adapter 差异导致不必要的类型断言。
- Core 边界测试漏掉新发现的误迁风险。

禁止本窗口做：

- 不把 delivery、tool system、Codex runtime、MCP stdio、internal agent 搬入 Core。
- 不替两个外层窗口执行删除。
- 不为了外层接入方便新增薄 facade。

### 4.3 本窗口验收输入

每个外层窗口完成一批后，本窗口要求它们回传：

- 本批改动摘要。
- 扫描命令和结果。
- 代表测试结果。
- `npm run build:check` 结果。
- 删除了哪些文件、保留了哪些 adapter。
- `git status --short`。

本窗口收到回报后的动作：

1. 对照本计划中的扫描命令重新抽样验证。
2. 判断是否满足删除门禁。
3. 如果不满足，写清楚需要外层窗口补的最小修复项。
4. 如果满足，批准进入对应删除批次，并把批准条件写入最终收尾报告。

## 5. Alembic 窗口任务

Alembic 当前主要剩阶段 9 局部收敛和后续删除治理。阶段 1-8、10-13 已通过。

### 5.1 Alembic-A：阶段 9 persistence 收敛

目标：让 host-agent workflow 的宿主无关 persistence/checkpoint/report/snapshot 使用 Core；internal-agent execution 和 completion/delivery wrapper 留外层。

必须改造：

- `lib/workflows/capabilities/persistence/DimensionCheckpoint.ts`
- `WorkflowReportHistoryStore.ts`
- `WorkflowReportTypes.ts`
- `WorkflowReportWriter.ts`
- `WorkflowResultPersistence.ts`
- `WorkflowSnapshotStore.ts`

处理方式：

- internal-agent 如果需要 checkpoint/report/snapshot 类型或函数，改 import 到：
  - `@alembic/core/workflows/capabilities/persistence/DimensionCheckpoint`
  - `@alembic/core/workflows/capabilities/persistence/WorkflowReportTypes`
  - `@alembic/core/workflows/capabilities/persistence/WorkflowResultPersistence`
  - `@alembic/core/workflows/capabilities/persistence/WorkflowSnapshotStore`
- 如果某个外层文件只是 Core 重复副本，列入删除。
- 如果某个文件承载 internal-agent 恢复 helper，拆成明确外层 helper，不再占用 Core 同名实现。

必须保留：

- `lib/workflows/capabilities/execution/internal-agent/**`
- `WorkflowSkillCompletionCapability.ts`
- `WorkflowCompletionFinalizer.ts`
- `CompletionSteps.ts`
- `BootstrapEventEmitter`
- MCP/HTTP/CLI wrapper
- Cursor/Wiki/Delivery nextActions

代表验证：

```bash
rg -n "from ['\"](#workflows/(cold-start|knowledge-rescan|shared)|#workflows/capabilities/(execution/external|planning/knowledge|persistence|presentation)|#types/snapshot-views|\\.\\.?/.*lib/workflows/(cold-start|knowledge-rescan|shared)|\\.\\.?/.*lib/workflows/capabilities/(execution/external|planning/knowledge|persistence|presentation)|\\.\\.?/.*lib/types/snapshot-views)" lib bin test
npx vitest run test/unit/ExternalDimensionCompletionWorkflow.test.ts test/unit/MissionBriefingProfile.test.ts test/unit/KnowledgeRescanIntent.test.ts test/unit/KnowledgeRescanPlan.test.ts test/unit/AuditEmission-MissionBriefing.test.ts test/unit/FileDiffSnapshotStore.test.ts test/unit/BootstrapRescanState.test.ts test/unit/DimensionRestoreState.test.ts
npm run build:check
```

说明：

- 扫描中 MCP handler re-export wrapper 可以保留，但 wrapper 内不能复制 Core session/briefing/persistence 内核。
- `BootstrapRescanState.test.ts` 如果覆盖 internal-agent state，可以保留外层，但 import 应使用 Core persistence 类型。

### 5.2 Alembic-B：删除候选批次

只有 Alembic-A 完成后才进入删除。

优先删除候选：

- 阶段 1 纯 shared 重复文件，前提是扫描无本地 import。
- 阶段 2 workspace/path/config/io 重复文件，但保留 `AppConfigLoader.ts`、`package-assets.ts`、IDE/delivery adapter。
- 阶段 3 domain/types 重复文件。
- 阶段 4 repository/storage 重复文件，但保留 audit/remote/delivery 外层 repository。
- 阶段 5 event/signal/job/report 重复文件，但保留 daemon supervisor/runner/realtime/DI/wiring。
- 阶段 6 project-intelligence/discovery/AST 重复文件，但保留 gateway/permission/constitution、agent/tool、transport。
- 阶段 8 knowledge/evolution/panorama 重复文件，但保留 FileChangeDispatcher/FileChangeHandler wrapper/daemon collector/source tracker。
- 阶段 10 Guard 重复文件，但保留 CLI/HTTP/MCP handler、Codex tool schema、ServiceContainer wiring。

不得删除：

- `lib/agent/**`
- `lib/tools/**`
- `lib/service/delivery/**`
- `lib/repository/delivery/**`
- `lib/repository/remote/**`
- `lib/infrastructure/realtime/RealtimeService.ts`
- `lib/daemon/**`
- `lib/external/mcp/**`
- CLI/Dashboard/HTTP server/Lark/macOS/native UI/IDE installer/release scripts。

## 6. AlembicPlugin 窗口任务

AlembicPlugin 是阶段 14 的主工作量。必须先补齐 2、3、6、8、9，再删除。

### 6.1 Plugin-A：阶段 2 workspace/path/config/io 收敛

目标：Plugin 使用 Core workspace primitives；只保留 Plugin package asset adapter 和 Codex ProjectRootResolver。

必须执行：

1. 新增 `lib/shared/package-assets.ts`，承接：
   - `PACKAGE_ROOT`
   - `CONFIG_DIR`
   - `INTERNAL_SKILLS_DIR`
   - `INJECTABLE_SKILLS_DIR`
   - `TEMPLATES_DIR`
   - `RESOURCES_DIR`
   - `DASHBOARD_DIR`
   - `getPackageVersion()`
2. 将所有 `package-root.js` 调用改为 `package-assets.js`。
3. 新增 `lib/infrastructure/config/AppConfigLoader.ts`，参考 Alembic：

```ts
import ConfigLoader from '@alembic/core/infrastructure/config/ConfigLoader';
import { PACKAGE_ROOT } from '../../shared/package-assets.js';

ConfigLoader._findPackageRoot = () => PACKAGE_ROOT;

export { ConfigLoader };
export default ConfigLoader;
```

4. `lib/bootstrap.ts` 改为：
   - `WorkspaceSettingsStore` 从 `@alembic/core/shared/WorkspaceSettingsStore` 导入。
   - `ConfigLoader` 从 `./infrastructure/config/AppConfigLoader.js` 导入。
   - `CONFIG_DIR` / `PACKAGE_ROOT` 从 `./shared/package-assets.js` 导入。
5. `lib/cli/SetupService.ts` 和 `test/unit/ConfigLoader.test.ts` 改用 `AppConfigLoader.ts`。
6. `lib/codex/AiConfigState.ts`、`lib/external/mcp/CodexMcpServer.ts`、`lib/http/routes/ai.ts` 改用 Core `WorkspaceSettingsStore`。
7. `WriteZone` 调用全部改到 `@alembic/core/infrastructure/io/WriteZone`。
8. `Paths` / `Defaults` / `TriggerSymbol` 调用全部改到 `@alembic/core/infrastructure/config/*`。

保留：

- `lib/codex/ProjectRootResolver.ts`
- `lib/shared/channel.ts`
- Codex runtime/channel/plugin/env/preflight。

验证：

```bash
rg -n "#shared/(WorkspaceResolver|PathGuard|ProjectRegistry|ProjectMarkers|WorkspaceSettingsStore|resolveProjectRoot|package-root|isOwnDevRepo)|#infrastructure/config|#infrastructure/io/WriteZone|\\.\\./.*shared/(WorkspaceResolver|PathGuard|ProjectRegistry|ProjectMarkers|WorkspaceSettingsStore|resolveProjectRoot|package-root|isOwnDevRepo)|\\.\\./.*infrastructure/(config|io/WriteZone)" lib bin test
npx vitest run test/unit/WorkspaceResolver.test.ts test/unit/PathGuard.test.ts test/unit/WorkspaceSettingsStore.test.ts test/unit/resolveProjectRoot.test.ts test/unit/ConfigLoader.test.ts test/unit/CodexProjectRootResolver.test.ts test/unit/CodexRuntimeContext.test.ts
npm run build:check
```

### 6.2 Plugin-B：阶段 3 domain/types 收敛

目标：Plugin domain/types 使用 Core，避免维护两套 KnowledgeEntry/Dimension/knowledge-wire。

必须执行：

- `lib/domain/dimension/RecipeDimension.ts` 改用 `@alembic/core/domain/dimension/DimensionRegistry` 或对应 Core barrel。
- `lib/domain/knowledge/KnowledgeEntry.ts` 改用 `@alembic/core/types/knowledge-wire`。
- 生产代码和测试中引用 domain/knowledge/dimension/snippet/evolution 的位置统一改 Core。

注意边界：

- `lib/agent/prompts/domain/EvidenceCollector.ts` 属于 agent prompt 子域，不是 Core domain 副本；不要误删。

验证：

```bash
rg -n "from ['\"](#domain|#types/knowledge-wire|\\.\\.?/.*lib/domain|\\.\\.?/.*domain/|\\.\\.?/.*types/knowledge-wire)" lib bin test
npx vitest run test/unit/KnowledgeEntry.test.ts test/unit/Lifecycle.test.ts test/unit/EvolutionPolicy.test.ts test/unit/RecipeDimension.test.ts test/integration/DomainLifecycle.test.ts
npm run build:check
```

### 6.3 Plugin-C：阶段 6 project intelligence / AST 收敛

目标：Plugin project-intelligence workflow 使用 Core 的 AST/discovery/analysis/project-intelligence 实现；Plugin 只保留 Codex/MCP/transport wrapper。

必须执行：

- `ProjectIntelligenceRunner.ts` 中 `#core/analysis/CallGraphAnalyzer.js` 改 Core。
- `ProjectIntelligenceCapability.ts`、`FileDiffPlanner.ts`、`ProjectIntelligenceIncrementalPlanner.ts` 等改用 Core workflow/project-intelligence。
- 确认 grammar WASM 资源由 Core package/runtime resources 提供；如果打包失败，修 Plugin packaging，不复制 grammar 逻辑回外层。

验证：

```bash
rg -n "from ['\"](#core/(analysis|ast|discovery|enhancement)|#workflows/capabilities/project-intelligence|\\.\\.?/.*lib/core/(analysis|ast|discovery|enhancement)|\\.\\.?/.*lib/workflows/capabilities/project-intelligence)" lib bin test
npx vitest run test/unit/MultiLanguageParsers.test.ts test/unit/ProjectIntelligenceIncrementalPlanner.test.ts test/unit/CallGraphAnalyzer.test.ts test/integration/RealProjectAst.test.ts test/integration/RealProjectDiscovery.test.ts test/integration/RealProjectLanguage.test.ts
npm run build:check
```

### 6.4 Plugin-D：阶段 8 knowledge/evolution/panorama 收敛

目标：Plugin deterministic knowledge/evolution/panorama service 使用 Core；Plugin 只保留触发器、handler、Codex/MCP/daemon wrapper 和 Plugin-only git diff checkpoint。

必须执行：

- `FileChangeHandler.ts` 保留为外层 wrapper，但内部改用 Core：
  - `@alembic/core/service/evolution/ContentImpactAnalyzer`
  - `@alembic/core/service/evolution/ContentPatcher`
  - `@alembic/core/service/evolution/EvolutionGateway`
  - `@alembic/core/service/knowledge/RecipePathRewriter`
  - `@alembic/core/types/reactive-evolution`
- `RecipeImpactPlanner` 改 Core 或删除重复副本。
- `RecipeProductionGateway` 改 Core 或删除重复副本。
- `BootstrapDedup`、`CandidateAggregator`、`KnowledgeService`、`SourceRefReconciler`、`RecipeParser`、`RecipePathRewriter`、`PanoramaService`、`PanoramaScanner`、`PanoramaTypes` 等重复副本改 Core 或删除。

保留：

- `lib/service/evolution/git-diff-checkpoint/**`
- `FileChangeDispatcher`
- `FileChangeHandler` wrapper
- Codex MCP/handler/transport/preflight/channel。

验证：

```bash
rg -n "from ['\"](#service/(knowledge|candidate|recipe|quality|evolution|panorama)|#repository/code|#types/reactive-evolution|#service/bootstrap/BootstrapDedup|\\.\\.?/.*lib/service/(knowledge|candidate|recipe|quality|evolution|panorama)|\\.\\.?/.*lib/repository/code)|from ['\"](\\./|\\.\\./).*ContentImpactAnalyzer|from ['\"](\\./|\\.\\./).*BootstrapDedup|from ['\"](\\./|\\.\\./).*Panorama|from ['\"](\\./|\\.\\./).*KnowledgeService|from ['\"](\\./|\\.\\./).*SourceRefReconciler" lib bin test
npx vitest run test/unit/KnowledgeService.test.ts test/unit/BootstrapDedup.test.ts test/unit/production-gateway.test.ts test/unit/SourceRefReconciler-signal.test.ts test/unit/RecipeImpactPlanner.test.ts test/unit/ConsolidationAdvisor.test.ts test/unit/DecayDetector.test.ts test/unit/content-patcher.test.ts test/unit/PanoramaService.test.ts test/unit/PanoramaAggregator.test.ts test/unit/PanoramaScanner.test.ts test/unit/LayerInferrer.test.ts test/unit/Phase2-PanoramaIntegration.test.ts test/unit/ContentImpactAnalyzer.test.ts test/unit/FileChangeHandler.test.ts test/unit/GitDiffCheckpoint.test.ts
npm run build:check
```

### 6.5 Plugin-E：阶段 9 host-agent workflow 收敛

目标：Codex MCP bootstrap/rescan/dimension-complete handler 继续留 Plugin，但 host-agent workflow 的 session、briefing、submission、checkpoint、report/snapshot persistence 使用 Core。

必须执行：

- `ExternalDimensionCompletionWorkflow.ts` 的 `saveDimensionCheckpoint` 改为 `@alembic/core/workflows/capabilities/persistence/DimensionCheckpoint`。
- `lib/types/snapshot-views.ts` 改 Core 或删除重复副本。
- `lib/workflows/cold-start/*` 中 intent/plan/presenter 宿主无关部分改 Core。
- `lib/workflows/knowledge-rescan/*` 中 intent/plan/presenter/planner 宿主无关部分改 Core。
- `lib/workflows/capabilities/execution/external/**` 中 session/briefing/submission/checkpoint 逻辑改 Core。
- `lib/workflows/capabilities/planning/knowledge/**`、`persistence/**`、`presentation/**` 改 Core 或删除重复副本。

保留：

- Codex preflight
- Codex transport
- MCP tool exposure/schema
- permissions
- plugin/channel 发布
- any Codex-specific wrapper
- internal-agent/tool/skill/completion 外层能力

验证：

```bash
rg -n "from ['\"](#workflows/(cold-start|knowledge-rescan|shared)|#workflows/capabilities/(execution/external|planning/knowledge|persistence|presentation)|#types/snapshot-views|\\.\\.?/.*lib/workflows/(cold-start|knowledge-rescan|shared)|\\.\\.?/.*lib/workflows/capabilities/(execution/external|planning/knowledge|persistence|presentation)|\\.\\.?/.*lib/types/snapshot-views)" lib bin test
npx vitest run test/unit/ExternalDimensionCompletionWorkflow.test.ts test/unit/MissionBriefingProfile.test.ts test/unit/KnowledgeRescanIntent.test.ts test/unit/KnowledgeRescanPlan.test.ts test/unit/AuditEmission-MissionBriefing.test.ts test/unit/FileDiffSnapshotStore.test.ts test/unit/BootstrapRescanState.test.ts test/unit/CodexSessionScenarioRunner.test.ts
npm run build:check
```

### 6.6 Plugin-F：Codex/plugin 发布链路复验

在 Plugin-A 到 Plugin-E 完成后，必须复验 Codex 外层行为。

```bash
npx vitest run test/unit/CodexKnowledgeState.test.ts test/unit/CodexToolPolicy.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexRuntimeContext.test.ts test/unit/CodexProjectRootResolver.test.ts test/unit/CodexPluginCacheSync.test.ts test/unit/CodexSessionScenarioRunner.test.ts test/unit/CodexMcpServer.test.ts
node scripts/verify-codex-channel.mjs
node scripts/verify-codex-plugin.mjs
npm run build:check
```

如果 runtime packaging 发生文件布局变化，还需要执行：

```bash
npm run prepare:codex-plugin-runtime
npm run verify:codex-plugin
```

## 7. 删除策略

### 7.1 删除前检查

每个删除批次必须先执行：

```bash
git status --short
npm run build:check
```

删除后必须执行：

```bash
npm run build:check
```

并运行对应阶段代表测试。

### 7.2 删除候选规则

可以删除：

- 完全被 Core 替代且扫描无本地 import 的重复实现文件。
- 只剩测试引用且测试已切 Core 的旧文件。
- 与 Core 同名、同职责、无外层 adapter 行为的重复目录。

不能删除：

- CLI/HTTP/MCP handler。
- ServiceContainer / module wiring。
- AI provider、AI config、API key 管理。
- Codex runtime/preflight/tool policy/tool metadata/channel/plugin assets。
- delivery/instructions/AGENTS.md/Skills 注入。
- `lib/agent/**` 和 `lib/tools/**`。
- daemon supervisor/runner/realtime/dashboard/socket。
- Alembic remote/Lark/macOS/native UI/IDE installer。
- Plugin `git-diff-checkpoint/**`。

### 7.3 package imports 清理

不要第一时间删除 `package.json` 的 `imports` alias。先删除文件并确认没有代码引用，再评估清理：

- Alembic 可保留 `#agent/*`、`#tools/*`、`#external/*`、`#http/*`、`#inject/*`、`#platform/*`、`#sandbox/*` 等外层 alias。
- AlembicPlugin 必须保留 `#codex/*`、`#tools/*`、`#agent/*`、`#external/*`、`#http/*`、`#inject/*` 等外层 alias。
- 对 `#shared/*`、`#domain/*`、`#core/*`、`#service/*`、`#repo/*`、`#types/*` 的清理必须等所有对应迁移阶段扫描清零后再做。

## 8. 最终验收矩阵

### 8.1 Core

```bash
npm run build:check
npm run test
npm run build
```

边界测试必须包含：

- `test/CoreDeliveryBoundary.test.ts`
- `test/CoreToolSystemBoundary.test.ts`
- `test/CoreCodexBoundary.test.ts`

#### 8.1.1 2026-05-17 Core 内执行记录

本窗口已完成 Core 内阶段 14 兼容修复：

- `AlembicCore/src/index.ts` 根入口只显式导出外层收敛需要的稳定契约：
  - `KnowledgeRepositoryImpl`
  - `ProjectIntelligenceCapability`
  - `createExternalWorkflowSession`
  - external mission briefing/session 相关类型
- 不在根入口使用 `export * from './repository/index.js'`、`export * from './types/index.js'`、`export * from './workflows/index.js'`，避免 `SearchDb`、`CallGraphResult`、`PanoramaResult`、`DimensionDef`、`ProjectAnalysisResult`、`CandidateSummary`、`PhaseReport` 等内部重复命名在 root package entrypoint 冲突。
- `AlembicCore/test/core-package.test.ts` 已补充根入口契约测试，确保外层统一接入需要的 repository、project intelligence、external workflow 能从 `../src/index.js` 取到。

已执行并通过：

```bash
npm run build:check
npx vitest run test/core-package.test.ts test/CoreDeliveryBoundary.test.ts test/CoreToolSystemBoundary.test.ts test/CoreCodexBoundary.test.ts
npm run test
npm run build
```

观察项：

- `npm run test` 期间出现一行 `error: Could not access 'HEAD'` 日志，但 Vitest 最终结果为 `52 passed` / `896 passed`。该日志当前不阻断 Core 阶段 14 内部完成状态，后续若外层 Git 依赖测试要求零 stderr，再单独定位对应测试夹具。
- `npm run build` 生成的 `dist/` 未进入 `git status --short`，当前 `.gitignore` 行为符合预期。

### 8.2 Alembic

```bash
npm run build:check
npx vitest run test/unit/LanguageServiceDetect.test.ts test/unit/WorkspaceResolver.test.ts test/unit/KnowledgeEntry.test.ts test/unit/ProposalRepository.test.ts test/integration/EventBus.test.ts test/unit/MultiLanguageParsers.test.ts test/unit/SearchEngine.test.ts test/unit/KnowledgeService.test.ts test/unit/ExternalDimensionCompletionWorkflow.test.ts test/unit/GuardScopeFiltering.test.ts test/unit/CursorDeliveryPipeline.test.ts test/unit/V2ToolSystem.test.ts test/unit/CodexMcpServer.test.ts
```

如果终端执行类测试因沙盒 `sandbox-exec` EPERM 失败，单独在可执行子进程的环境重跑：

```bash
npx vitest run test/unit/TerminalAdapter.test.ts
```

### 8.3 AlembicPlugin

```bash
npm run build:check
npx vitest run test/unit/WorkspaceResolver.test.ts test/unit/KnowledgeEntry.test.ts test/unit/MultiLanguageParsers.test.ts test/unit/SearchEngine.test.ts test/unit/KnowledgeService.test.ts test/unit/ExternalDimensionCompletionWorkflow.test.ts test/unit/GuardScopeFiltering.test.ts test/unit/V2ToolSystem.test.ts test/unit/CodexKnowledgeState.test.ts test/unit/CodexToolPolicy.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexRuntimeContext.test.ts test/unit/CodexProjectRootResolver.test.ts test/unit/CodexPluginCacheSync.test.ts test/unit/CodexSessionScenarioRunner.test.ts test/unit/CodexMcpServer.test.ts
node scripts/verify-codex-channel.mjs
node scripts/verify-codex-plugin.mjs
```

`test/integration/GuardApi.test.ts` 如果因端口监听 EPERM 失败，必须在可监听端口环境单独重跑。

### 8.4 三仓库状态

最终必须确认：

```bash
git -C /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore status --short
git -C /Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic status --short
git -C /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin status --short
```

每个仓库的状态都必须可解释：

- Core 若只有文档或边界测试补丁，说明原因。
- Alembic 若有删除批次，说明每批对应阶段、扫描和测试。
- AlembicPlugin 若有 runtime/package/plugin assets 变更，必须说明是否由 `prepare:codex-plugin-runtime` 或 release 验证产生。

## 9. 最终收尾报告

阶段 14 完成后，本窗口新建或更新最终报告，至少包含：

- 三仓库最终提交或工作树状态。
- 外层删除文件清单。
- 外层保留边界清单。
- Core 兼容修复清单。
- 每个阶段最终扫描结果。
- 完整测试矩阵结果。
- 已知残留和明确延期事项。
- 发布/打包注意事项。

建议文件名：

`docs/alembic-core-stage-14-final-acceptance-report-2026-05-17.md`

## 10. 立即下一步

执行顺序：

1. 本窗口等待 Alembic / AlembicPlugin 两个窗口回报阶段 1-13 修复完成结果。
2. 对 AlembicPlugin 回报按 Plugin-A 到 Plugin-E 的门禁逐项复验；对 Alembic 回报按 Alembic-A 门禁复验。
3. 若复验通过，进入 14.6 删除批次设计和执行授权；若复验不通过，只给最小补齐指令，不扩大任务。
4. 两个外层窗口按本计划执行删除和提交；本窗口继续负责门禁、Core 兼容补丁和最终报告。
5. 删除完成后执行 14.7 最终连通性、发布链路和仓库状态收尾。

不要先做删除；当前首要目标是等待并复验 1-13 修复结果，确认 import 收敛和连通性稳定。
