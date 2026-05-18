# AlembicCore 分阶段迁移执行手册

日期：2026-05-16

## 目的

这份文档定义 Core 抽取的分阶段执行方式。它和 `core-capability-decomposition-plan-2026-05-16.md` 的关系是：

- `core-capability-decomposition-plan-2026-05-16.md` 说明 Core 应该包含什么能力。
- 本文说明每个阶段怎么迁移、怎么验收、迁移后留下什么删除计划。

协作方式固定为：

1. Codex 在当前窗口只完成 `AlembicCore` 内部迁移、Core 构建和 Core 自测。
2. Codex 不再直接改 `Alembic` 与 `AlembicPlugin`，也不再直接更新外层 submodule 指针。
3. Codex 在本文对应阶段补充“外层接入任务”和“删除计划”。
4. 用户在其他窗口按文档完成外层接入、submodule 指针更新、旧代码删除和外层验证。
5. 外层窗口完成后，再回到本窗口继续下一阶段 Core 工作。

这样可以避免“Core 能力抽取”和“外层接入/删除旧代码”混在同一个上下文里，也方便每个阶段分别回滚和验收。

历史说明：

- 阶段 0 到阶段 2 已经包含部分外层提交记录，保留作为事实记录。
- 从阶段 3 开始，当前窗口只提交 Core；外层仓库工作全部写入本文交给其他窗口执行。

## 不变原则

- 本轮迁移不做功能删减。
- 本轮迁移不借机重构业务行为。
- Core 只包含确定性知识内核和宿主 Agent 辅助扫描链路的协议、状态机、结果 intake。
- Core 不包含 AI Provider、模型调用、prompt 执行、Agent runtime、Codex MCP schema、Codex Skill。
- `Alembic` 保留本地产品壳、本地 AI/provider 编排、CLI、Dashboard、daemon supervisor。
- `AlembicPlugin` 保留 Codex MCP、Skills、plugin manifest、Codex Agent 协作策略和发布脚本。
- 当前窗口只对 Core 可构建、Core 自测和 Core API smoke 负责。
- 外层仓库是否可构建由其他窗口按本文“外层接入任务”验证并回填。

## 阶段完成包

每个阶段完成后，Codex 必须留下这些信息：

```text
阶段：
Core 提交：
Core 验证命令：
Core 验证结果：
外层接入任务：
外层建议验证：
未完成事项：
删除计划：
```

外层窗口完成后，需要在同一阶段回填：

```text
Alembic 提交：
AlembicPlugin 提交：
外层验证命令：
外层验证结果：
外层遗留问题：
```

删除计划必须具体到文件、目录、引用替换和验证命令，格式如下：

```markdown
### 删除计划

状态：待用户在其他窗口执行

删除候选：

- `Alembic/path/to/old-file.ts`
- `AlembicPlugin/path/to/old-file.ts`

替换检查：

- `rg "OldSymbol" Alembic AlembicPlugin`
- `rg "old/path" Alembic AlembicPlugin`

执行步骤：

1. 删除已被 Core 替代的旧文件。
2. 删除或改写旧 import/export。
3. 运行验证命令。

验证命令：

- `npm run build:check`
- 相关 smoke 命令

完成后回填：

- 删除提交：
- 验证结果：
- 遗留问题：
```

## 阶段总览

| 阶段 | 名称 | Core 目标 | 外层接入任务 | 删除计划类型 |
| --- | --- | --- | --- | --- |
| 0 | Repository Foundation | 建立 `@alembic/core` 包和 submodule 链路 | 两个外层仓库指向 Core | 无删除 |
| 1 | Host-Assisted Scan Contract | 建立宿主 Agent 辅助扫描 contract 和状态机 | 外层只更新 Core 指针 | 无删除或只删临时实验代码 |
| 2 | Workspace Foundation | 迁移 workspace、Ghost、路径、项目注册表 | 外层 setup/status/preflight 改用 Core | 删除重复 workspace/path 实现 |
| 3 | Domain Model | 迁移 Recipe/Knowledge/Candidate/SourceRef/readiness | 外层模型引用 Core | 删除重复 domain model |
| 4 | Candidate Intake | 迁移候选知识 intake、证据校验、去重前置 | Codex/本地 AI 产物统一入 Core contract | 删除重复 candidate schema/intake |
| 5 | Storage Foundation | 迁移 config、DB、repository、file store | 外层通过 Core 读写知识库 | 删除重复 repository/storage |
| 6 | Bootstrap/Rescan Workflow | 迁移 scan session、bootstrap/rescan 状态机 | 外层只执行宿主任务并提交结果 | 删除重复 workflow 状态机 |
| 7 | Discovery/AST | 迁移 discoverer、language、AST、project graph | 外层结构查询和冷启动共用 Core | 删除重复 discovery/AST |
| 8 | Search/Vector Storage | 迁移 search、ranking、vector storage、索引读写 | CLI/Codex 搜索共用 Core | 删除重复 search/vector |
| 9 | Guard Engine | 迁移 Guard engine、规则、报告模型 | CLI/Codex Guard 只包装参数输出 | 删除重复 guard engine |
| 10 | Jobs/Events | 迁移 job store、recover、event bus | daemon/Codex job 共用 contract | 删除重复 job store/event |
| 11 | Context Payload | 迁移知识压缩、context payload、budget 算法 | 外层转成自己的展示或注入形式 | 删除重复压缩/payload |
| 12 | Boundary Hardening | 收束 package exports、lint boundary、文档 | 外层只保留宿主壳 | 删除剩余 adapter |

## 阶段 0：Repository Foundation

状态：已完成。

Core 已有：

- `@alembic/core` package。
- `src/folder-names.ts`
- `src/runtime.ts`
- `src/index.ts`

外层已完成：

- `Alembic/vendor/AlembicCore`
- `AlembicPlugin/vendor/AlembicCore`
- 两个外层 `package.json` 都包含 `"@alembic/core": "file:vendor/AlembicCore"`。

完成提交：

- Core：`69b260b Initialize AlembicCore package`
- Alembic：`a32643b Add AlembicCore submodule`
- AlembicPlugin：`4c443f7 Add AlembicCore submodule`

删除计划：

状态：无删除。

说明：阶段 0 只建立包和 submodule 链路，没有替代外层实现。

## 阶段 1：Host-Assisted Scan Contract

状态：已完成。

Core 已有：

- `src/scan/types.ts`
- `src/scan/state-machine.ts`
- `src/scan/index.ts`
- `createScanPlan`
- `createScanSession`
- `getNextAnalysisTask`
- `markAnalysisTaskRunning`
- `submitAnalysisResult`
- `retryAnalysisTask`
- `cancelScanSession`
- `summarizeScanSession`

边界说明：

- Core 定义 scan plan、analysis task、host result schema、coverage、retry、resume。
- Core 不调用模型。
- Core 不运行 Agent loop。
- Core 不知道 Codex MCP schema。
- 外层宿主负责执行任务并按 Core contract 交回结果。

完成提交：

- Core：`8ed800b Add host-assisted scan contracts`
- Core：`f334bd9 Clarify scan host boundary comments`
- Alembic：`a0c0cd6 Update AlembicCore scan contracts`
- AlembicPlugin：`26287ad Update AlembicCore scan contracts`

验证命令：

- 在 `AlembicCore` 运行 `npm run build:check`
- 在 `AlembicCore` 运行 `npm run build`
- 通过 `node -e` 导入 `dist/index.js` smoke 测试 `createScanPlan`

删除计划：

状态：无删除。

说明：阶段 1 先建立 Core contract，还没有让外层旧 bootstrap/rescan 逻辑切换到 Core，因此不能删除外层 workflow 代码。

## 阶段 2：Workspace Foundation

目标：

让 Core 真实拥有 workspace、Ghost、dataRoot、knowledgeDir、runtimeDir、项目可信度和项目注册表能力。

迁移输入：

- `Alembic/lib/shared/WorkspaceResolver.ts`
- `Alembic/lib/shared/resolveProjectRoot.ts`
- `Alembic/lib/shared/ProjectRegistry.ts`
- `Alembic/lib/shared/ProjectMarkers.ts`
- `Alembic/lib/shared/PathGuard.ts`
- `Alembic/lib/shared/WorkspaceSettingsStore.ts`
- `AlembicPlugin/lib/codex/ProjectRootResolver.ts` 中可通用的判断结构，不迁 Codex 输入策略。

Core 输出：

- `src/workspace/index.ts`
- `src/workspace/workspace-resolver.ts`
- `src/workspace/project-registry.ts`
- `src/workspace/project-markers.ts`
- `src/workspace/path-guard.ts`
- `src/workspace/workspace-foundation.ts`
- `resolveAlembicWorkspace(projectRoot, options)`
- `inspectAlembicWorkspace(runtime)`
- `initializeAlembicWorkspace(runtime, options)` 的基础目录创建能力。

边界说明：

- `WorkspaceSettingsStore` 暂不迁入 Core，因为它主要管理 AI provider/model/key 的 workspace settings 与 secrets。
- Core 只提供无 AI 的 workspace 解析、注册、路径事实、目录骨架创建和可选 config 写入能力。
- 外层仓库继续持有 AI 设置、宿主输入策略、CLI/Codex 初始化策略。

外层接入任务（其他窗口执行）：

- `Alembic` 的 setup/ghost/status 使用 Core workspace API。
- `AlembicPlugin` 的 status/diagnostics/init/preflight 使用 Core workspace API。
- Codex 项目根来源策略仍留在 `AlembicPlugin/lib/codex/ProjectRootResolver.ts`。
- CLI 默认目录策略仍留在 `Alembic`。

阶段验收：

- `AlembicCore`: `npm run build:check`
- `AlembicCore`: workspace unit tests。
- `Alembic`: `npm run build:check`
- `AlembicPlugin`: `npm run build:check`
- `AlembicPlugin`: status/diagnostics 不启动 daemon。
- `Alembic`: setup ghost fixture smoke。

删除计划模板：

状态：阶段完成后由 Codex 回填。

预计删除候选：

- `Alembic/lib/shared/WorkspaceResolver.ts`
- `Alembic/lib/shared/ProjectRegistry.ts`
- `Alembic/lib/shared/ProjectMarkers.ts`
- `Alembic/lib/shared/PathGuard.ts`
- `AlembicPlugin/lib/shared/WorkspaceResolver.ts`
- `AlembicPlugin/lib/shared/ProjectRegistry.ts`
- `AlembicPlugin/lib/shared/ProjectMarkers.ts`
- `AlembicPlugin/lib/shared/PathGuard.ts`

预计保留候选：

- `AlembicPlugin/lib/codex/ProjectRootResolver.ts`，但它应只负责 Codex 输入来源。
- `Alembic` CLI setup command handlers。

删除前检查：

- `rg "WorkspaceResolver|ProjectRegistry|ProjectMarkers|PathGuard" Alembic/lib AlembicPlugin/lib`
- 确认所有非宿主 import 已切换到 `@alembic/core`。

### 阶段完成记录

完成日期：2026-05-16

Core commit：

- `d344c92` `Extract workspace foundation to core`
- `34a04dd` `Ship core build artifacts`
- `66fb090` `Add workspace foundation APIs`
- 构建产物策略修正：`d8a5763` `Ignore core build artifacts`

Alembic commit：`dfc01ee` `Use core workspace foundation`

AlembicPlugin commit：`647edce` `Use core workspace foundation`

备注：收尾验证时 `AlembicPlugin` 已由其他窗口继续前进到 `e73f95a`，本阶段迁移提交仍为 `647edce`；最终 `AlembicPlugin` 类型检查在当前 HEAD 通过。

已完成内容：

- Core 新增并导出 workspace/path/registry/project marker/path guard 能力。
- Core 新增 `resolveAlembicWorkspace`、`inspectAlembicWorkspace`、`initializeAlembicWorkspace`，只负责无 AI 的 workspace 基础能力。
- `dist/` 已恢复为本地构建产物，不再提交到 Core git。外层通过 `file:vendor/AlembicCore` 使用 Core 时，需要先在子模块内运行 `npm install --ignore-scripts` 与 `npm run build`。
- `Alembic` 与 `AlembicPlugin` 的 6 个 shared workspace 文件已改为薄适配层，继续保持旧 import 路径可用。
- 两个外层仓库的 `vendor/AlembicCore` 子模块指针更新到 `66fb090`。

验证：

- `AlembicCore`: `npm run build:check` 通过。
- `AlembicCore`: `npm run build` 通过。
- `AlembicCore`: `initializeAlembicWorkspace` Ghost smoke 通过，确认 runtime/knowledge/config 可创建。
- `Alembic`: `npm run build:check` 通过。
- `Alembic`: `node -e "import('@alembic/core')..."` 通过，确认 Core workspace API 可运行时导入。
- `Alembic`: `npx vitest run test/unit/WorkspaceResolver.test.ts test/unit/DaemonSupervisor.test.ts` 通过。
- `Alembic`: `WorkspaceSettingsStore.test.ts` 未通过，原因是现有测试运行时无法解析 `#shared/resolveProjectRoot.js` 到 TS 源文件；该问题在 `WorkspaceSettingsStore`/`Bootstrap` 的测试解析链路上，不作为 Core 迁移阻断项。
- `AlembicPlugin`: `npm run build:check` 通过。
- `AlembicPlugin`: `node -e "import('@alembic/core')..."` 通过，确认 Core workspace API 可运行时导入。
- `AlembicPlugin`: `npx vitest run test/unit/WorkspaceResolver.test.ts test/unit/WorkspaceSettingsStore.test.ts test/unit/DaemonSupervisor.test.ts` 通过。

### 删除计划

状态：待用户在其他窗口执行。

删除目标：

- 这次 Codex 已经把以下文件替换为薄适配层，下一窗口不要马上删除它们；先改调用方 import。
- `Alembic/lib/shared/WorkspaceResolver.ts`
- `Alembic/lib/shared/ProjectRegistry.ts`
- `Alembic/lib/shared/ProjectMarkers.ts`
- `Alembic/lib/shared/PathGuard.ts`
- `Alembic/lib/shared/resolveProjectRoot.ts`
- `Alembic/lib/shared/isOwnDevRepo.ts`
- `AlembicPlugin/lib/shared/WorkspaceResolver.ts`
- `AlembicPlugin/lib/shared/ProjectRegistry.ts`
- `AlembicPlugin/lib/shared/ProjectMarkers.ts`
- `AlembicPlugin/lib/shared/PathGuard.ts`
- `AlembicPlugin/lib/shared/resolveProjectRoot.ts`
- `AlembicPlugin/lib/shared/isOwnDevRepo.ts`

删除前 import 替换：

- 将业务代码中从上述 shared 文件导入 workspace/path/registry/project marker/path guard 的位置，逐步改为从 `@alembic/core` 导入。
- 保留宿主入口自己的策略文件，例如 `AlembicPlugin/lib/codex/ProjectRootResolver.ts`。
- 保留 `Alembic/lib/shared/WorkspaceSettingsStore.ts` 与 `AlembicPlugin/lib/shared/WorkspaceSettingsStore.ts`，因为 AI/provider/settings/secrets 不进入 Core。
- 暂时保留 `folder-names.ts`，尤其 `Alembic` 中还包含 IDE 路径字段，尚未完成统一抽取。

删除步骤：

1. 在 `Alembic` 中运行 `rg "from ['\\\"]\\.\\/WorkspaceResolver|from ['\\\"]\\.\\/ProjectRegistry|from ['\\\"]\\.\\/ProjectMarkers|from ['\\\"]\\.\\/PathGuard|from ['\\\"]\\.\\/resolveProjectRoot|from ['\\\"]\\.\\/isOwnDevRepo" lib bin scripts test`。
2. 在 `AlembicPlugin` 中运行同样的 `rg`。
3. 将非宿主、非兼容层的引用改为 `@alembic/core`。
4. 确认没有业务代码依赖这些兼容层后，删除上述 12 个薄适配文件。
5. 删除后分别运行 `npm run build:check`。
6. `AlembicPlugin` 额外运行 workspace 相关单元测试：`npx vitest run test/unit/WorkspaceResolver.test.ts test/unit/WorkspaceSettingsStore.test.ts test/unit/DaemonSupervisor.test.ts`。

删除禁止项：

- 不要删除任何 `WorkspaceSettingsStore.ts`。
- 不要迁移或删除 AI provider/model/key 相关设置。
- 不要删除 `ProjectRootResolver.ts`、CLI 默认目录策略、Codex MCP/daemon/skills 相关宿主逻辑。
- 不要在删除窗口处理第 3 阶段 domain model 内容。

## 阶段 3：Domain Model

目标：

让 Recipe、KnowledgeEntry、Candidate、SourceRef、Evidence、Lifecycle、Readiness、Dimension 只在 Core 中定义和校验。

迁移输入：

- `lib/domain/knowledge/**`
- `lib/domain/dimension/**`
- `lib/domain/evolution/**`
- `lib/domain/snippet/**`
- `lib/shared/recipe-tokens.ts`
- `lib/shared/markdown-utils.ts`
- `lib/shared/similarity.ts`

Core 输出：

- `src/domain/**`
- `src/knowledge/model/**`
- `src/candidate/model/**`
- `src/shared/recipe-tokens.ts`
- `src/shared/markdown-utils.ts`
- `src/shared/similarity.ts`
- `validateKnowledgeEntry`
- `validateCandidateKnowledge`
- `checkRecipeReadiness`
- `compareRecipeSimilarity`

外层接入任务（其他窗口执行）：

- CLI、Dashboard API、Codex tools 统一使用 Core 模型和校验。
- 外层可以保留展示 DTO，但不能再定义第二套核心模型。

阶段验收：

- Core domain round-trip tests。
- Core readiness tests。
- `Alembic` guard/search/coldstart 相关类型通过。
- `AlembicPlugin` Codex tools 类型通过。

删除计划模板：

状态：阶段完成后由 Codex 回填。

预计删除候选：

- `Alembic/lib/domain/**`
- `AlembicPlugin/lib/domain/**`
- 两边重复的 `recipe-tokens`、`similarity`、纯 markdown utility。

预计保留候选：

- 外层 presentation DTO。
- Dashboard view model。
- Codex tool response formatter。

删除前检查：

- `rg "KnowledgeEntry|RecipeReadinessChecker|UnifiedValidator|DimensionRegistry" Alembic AlembicPlugin`

### 阶段完成记录

完成日期：2026-05-16

Core commit：

- `259a9b4` `Extract domain model to core`
- `d8a5763` `Ignore core build artifacts`

Core 改动：

- 新增 `src/domain/**`，包含 knowledge/entity/value objects、Lifecycle、FieldSpec、UnifiedValidator、RecipeReadinessChecker、dimension registry/copy/SOP、evolution policy/similarity、snippet contract。
- 新增 `src/knowledge/model/index.ts`，作为外层迁移到 Core knowledge model 的稳定 public API。
- 新增 `src/candidate/model/index.ts`，提供 candidate knowledge 的模型校验入口。
- 新增 `src/domain/validation.ts`，导出 `validateKnowledgeEntry`、`validateCandidateKnowledge`、`checkRecipeReadiness`、`compareRecipeSimilarity`。
- 新增 `src/shared/recipe-tokens.ts`、`src/shared/markdown-utils.ts`、`src/shared/similarity.ts`，供 domain similarity/readiness 共用。
- 新增 Core 内部最小 `src/shared/language-service.ts`，只保留确定性语言识别和语言关键字集合，不做项目文件扫描。
- `KnowledgeEntry` 与 `Snippet` 改为使用 Node `crypto.randomUUID()`，避免 Core 引入 `uuid` 运行时依赖。
- `dist/**` 只作为本地 build 输出，不提交到 git；外层接入窗口负责在子模块内生成 `dist`。

Core 验证：

- `npm run build:check` 通过。
- `npm run build` 通过。
- Core API smoke 通过：
  - `KnowledgeEntry` JSON round-trip 成功。
  - `validateKnowledgeEntry(..., { skipUniqueness: true })` 返回 `pass: true`。
  - `checkRecipeReadiness(...)` 返回 `ready: true`。
  - `compareRecipeSimilarity(entry, entry)` 可返回确定性相似度。
  - `extractRecipeTokens(...)` 可提取 token。

外层接入任务（其他窗口执行）：

1. 在 `Alembic` 和 `AlembicPlugin` 中更新 `vendor/AlembicCore` 到 `d8a5763`。
2. 在两个外层仓库分别运行 `npm --prefix vendor/AlembicCore install --ignore-scripts` 与 `npm --prefix vendor/AlembicCore run build`，生成本地 `vendor/AlembicCore/dist`。
3. 先不要删除 `lib/domain/**`，先建立兼容接入，确保旧 import 可运行。
4. 推荐第一步将 `lib/domain/index.ts`、`lib/domain/knowledge/index.ts`、`lib/domain/dimension/index.ts`、`lib/domain/evolution/RecipeSimilarity.ts`、`lib/domain/evolution/EvolutionPolicy.ts`、`lib/domain/snippet/Snippet.ts` 改为从 `@alembic/core` re-export 的薄适配层。
5. 将业务代码中的核心模型导入逐步改为 `@alembic/core`：
   - `KnowledgeEntry`
   - `KnowledgeRepository`
   - `Lifecycle`
   - `FieldSpec` / `V3_FIELD_SPEC`
   - `UnifiedValidator`
   - `checkRecipeReadiness`
   - `RecipeSimilarity` / `compareRecipeSimilarity`
   - `DIMENSION_REGISTRY` / `resolveRecipeDimensionId`
   - `Snippet`
6. `Alembic` 的 Dashboard view model、API response formatter、DB repository implementation 可以保留外层，但内部类型应引用 Core。
7. `AlembicPlugin` 的 Codex tool schema/response formatter 可以保留外层，但内部校验应引用 Core。
8. 不迁 AI provider/model/prompt/Agent runtime；这些仍属于外层。

外层建议验证：

- `Alembic`: `npm run build:check`
- `AlembicPlugin`: `npm run build:check`
- `Alembic`: guard/search/coldstart 相关类型检查或最小 smoke。
- `AlembicPlugin`: Codex tools 类型检查或最小 MCP smoke。
- `node -e "import('@alembic/core').then(m=>console.log(Boolean(m.KnowledgeEntry), Boolean(m.validateKnowledgeEntry), Boolean(m.DIMENSION_REGISTRY)))"`

### 删除计划

状态：待用户在其他窗口执行。

删除前置条件：

- 两个外层仓库均已更新 `vendor/AlembicCore` 到 `d8a5763` 或更新的 Core 提交。
- 两个外层仓库均已在 `vendor/AlembicCore` 内完成本地 build，且 `vendor/AlembicCore/dist/index.js` 存在。
- 所有业务代码已从 Core public API 导入 domain model。
- 薄适配层只剩兼容 re-export，不再包含业务逻辑。
- `npm run build:check` 在两个外层仓库均通过。

删除候选：

- `Alembic/lib/domain/knowledge/**`
- `Alembic/lib/domain/dimension/**`
- `Alembic/lib/domain/evolution/RecipeSimilarity.ts`
- `Alembic/lib/domain/evolution/EvolutionPolicy.ts`
- `Alembic/lib/domain/snippet/Snippet.ts`
- `Alembic/lib/shared/recipe-tokens.ts`
- `Alembic/lib/shared/markdown-utils.ts`
- `Alembic/lib/shared/similarity.ts`
- `AlembicPlugin/lib/domain/knowledge/**`
- `AlembicPlugin/lib/domain/dimension/**`
- `AlembicPlugin/lib/domain/evolution/RecipeSimilarity.ts`
- `AlembicPlugin/lib/domain/evolution/EvolutionPolicy.ts`
- `AlembicPlugin/lib/domain/snippet/Snippet.ts`
- `AlembicPlugin/lib/shared/recipe-tokens.ts`
- `AlembicPlugin/lib/shared/markdown-utils.ts`
- `AlembicPlugin/lib/shared/similarity.ts`

保留候选：

- `Alembic` 的 repository implementation、DB mapper、Dashboard DTO、API response formatter。
- `AlembicPlugin` 的 Codex MCP schema、tool response formatter、skill text、plugin manifest。
- 外层测试 fixtures 和 release scripts。
- `lib/types/knowledge-wire.ts` 如果仍作为 API wire contract 被外层接口使用；待阶段 4 candidate intake 再统一处理。

替换检查：

- `rg "from ['\\\"]#domain|from ['\\\"].*lib/domain|from ['\\\"].*/domain/" Alembic AlembicPlugin`
- `rg "KnowledgeEntry|RecipeReadinessChecker|UnifiedValidator|DimensionRegistry|RecipeSimilarity|FieldSpec|Snippet" Alembic/lib AlembicPlugin/lib`
- `rg "recipe-tokens|markdown-utils|similarity" Alembic/lib AlembicPlugin/lib`

执行步骤：

1. 先把直接业务 import 改成 `@alembic/core`。
2. 再把必要旧路径改成薄 re-export adapter。
3. 确认 adapter 无业务逻辑后，删除上面的候选文件。
4. 删除后运行外层建议验证。
5. 回填 `Alembic` / `AlembicPlugin` 接入提交、删除提交、验证结果和遗留问题。

删除禁止项：

- 不要删除 DB repository implementation。
- 不要删除 Dashboard/API 展示 DTO。
- 不要删除 Codex MCP schema、tool formatter、Skills、plugin manifest。
- 不要迁移或删除 AI provider/model/prompt/Agent runtime。
- 不要提前处理阶段 4 的 candidate intake service。

## 阶段 4：Candidate Intake

目标：

把宿主 Agent 或本地 AI 产出的候选知识统一交给 Core 做 schema 校验、证据校验、SourceRef 检查、去重前置和 readiness。

迁移输入：

- `lib/service/candidate/**`
- `lib/service/bootstrap/BootstrapDedup.ts`
- `lib/service/bootstrap/BootstrapEventEmitter.ts` 中不依赖 UI 的事件结构。
- `lib/types/knowledge-wire.ts`
- `lib/types/workflows.ts` 中 candidate result 相关类型。

Core 输出：

- `src/candidate/intake/**`
- `submitKnowledgeCandidate(runtime, candidate, options)`
- `validateCandidateEvidence`
- `dedupeCandidateBatch`
- `prepareCandidateForReview`

外层接入任务（其他窗口执行）：

- `AlembicPlugin` Codex Agent 结果通过 Core candidate intake。
- `Alembic` 本地 AI 结果通过同一 Core candidate intake。
- Dashboard 审核仍留在 `Alembic`。

阶段验收：

- Core candidate fixture tests。
- 同一 batch 在两个外层得到一致校验结果。
- 失败结果有结构化 diagnostics。

删除计划模板：

预计删除候选：

- 两边重复的 candidate schema。
- 两边重复的 candidate dedupe/intake 逻辑。

预计保留候选：

- Codex tool result formatter。
- Dashboard candidate review UI/API。
- 本地 AI 生成 candidate 的 prompt/provider 逻辑。

### 阶段完成记录

完成日期：2026-05-16

Core commit：

- `9e98595` `Add candidate intake core APIs`

Core 改动：

- 新增 `src/candidate/intake/**`，包含 candidate intake 类型、结构化 diagnostics、证据校验、SourceRef 规范化、批内/已有候选去重、review 前预处理。
- 新增 `submitKnowledgeCandidate(runtime, candidate, options)`，表示候选进入 Core 的确定性 intake 管线；它不写 DB、不调用 AI、不触发 Dashboard 审核。
- 新增 `prepareCandidateForReview`，统一执行 candidate 规范化、`validateCandidateKnowledge`、`checkRecipeReadiness`、`validateCandidateEvidence`，并返回 `ready` / `needs-review` / `rejected`。
- 新增 `validateCandidateEvidence`，检查 `sourceRefs`、`evidence`、行号范围、绝对路径、项目根越界和 confidence 范围。
- 新增 `dedupeCandidateBatch`、`aggregateCandidates`、`BootstrapDedup`、`createCandidateSummary`、`computeCandidateSummarySimilarity`，把 bootstrap/session 级候选去重前置到 Core。
- 新增 `src/knowledge/wire.ts`，迁入 `KnowledgeEntryWire` 及其子对象 wire 类型。
- `KnowledgeEntry.toJSON()` 改为使用 Core wire 类型，避免外层继续维护第二套 knowledge wire contract。

Core 验证：

- `npm run build:check` 通过。
- `npm run build` 通过。
- Core API smoke 通过：
  - `submitKnowledgeCandidate(...)` 可返回 `ok: true` 与 `needs-review` 状态。
  - `dedupeCandidateBatch(...)` 可把重复候选压成 1 条并返回 duplicate 记录。
  - 顶层 `@alembic/core` 可导出 `KnowledgeEntry`、`submitKnowledgeCandidate`、`validateCandidateEvidence`、`dedupeCandidateBatch`。

未完成事项 / 延后边界：

- `BootstrapEventEmitter` class 不迁入本阶段，因为它绑定外层 `EventBus` 与 `BootstrapTaskManager`；事件 payload 的最终归属放到阶段 6/10。
- `SimilarityService.findSimilarRecipes(projectRoot, candidate)` 暂不完整迁入 Core，因为它直接读取磁盘 recipe 目录并依赖外层 `Paths`；若外层能改成注入已有候选摘要，可先改用 `dedupeCandidateBatch`，否则保留到阶段 8 Search/Vector。
- Dashboard 审核 UI/API、Codex MCP schema/formatter、本地 AI prompt/provider 仍留在外层。

外层接入任务（其他窗口执行）：

1. 在 `Alembic` 和 `AlembicPlugin` 中更新 `vendor/AlembicCore` 到 `9e98595` 或更新的 Core 提交。
2. 在两个外层仓库分别运行 `npm --prefix vendor/AlembicCore install --ignore-scripts` 与 `npm --prefix vendor/AlembicCore run build`，生成本地 ignored 的 `vendor/AlembicCore/dist`。
3. 将两边的 `lib/types/knowledge-wire.ts` 改为从 `@alembic/core` re-export：
   - `KnowledgeEntryWire`
   - `KnowledgeContentWire`
   - `KnowledgeReasoningWire`
   - `KnowledgeQualityWire`
   - `KnowledgeStatsWire`
   - `KnowledgeConstraintsWire`
   - `KnowledgeRelationsWire`
   - `KnowledgeLifecycle`
   - `KnowledgeKind`
4. 将两边的 `lib/service/candidate/CandidateAggregator.ts` 改为薄适配层，优先 re-export Core 的 `aggregateCandidates` / `dedupeCandidateBatch`。
5. 将两边的 `lib/service/bootstrap/BootstrapDedup.ts` 改为薄适配层，re-export Core 的 `BootstrapDedup`、`CandidateSummary`、`DedupMatch`。
6. 在候选提交入口加入 Core intake：
   - `Alembic` 本地 AI 或 CLI 产出的候选先进入 `prepareCandidateForReview` / `submitKnowledgeCandidate`。
   - `AlembicPlugin` Codex Agent 产出的候选先进入同一 Core intake。
   - 外层根据 `status` 和 `diagnostics` 决定展示、拒绝或进入 Dashboard review queue。
7. 现有 `SimilarityService.findSimilarRecipes` 如果仍依赖磁盘 recipe 扫描，先保留；如果调用方能提供已有候选摘要，则改用 Core `dedupeCandidateBatch` 后再删除旧文件。
8. 不迁 AI provider/model/prompt/Agent runtime，不迁 Codex MCP schema/tool formatter，不迁 Dashboard review UI/API。

外层建议验证：

- `Alembic`: `npm run build:check`
- `AlembicPlugin`: `npm run build:check`
- `Alembic`: candidate submit / knowledge batch 的最小 smoke。
- `AlembicPlugin`: Codex knowledge submit tool 的最小 MCP smoke。
- `node -e "import('@alembic/core').then(m=>console.log(Boolean(m.submitKnowledgeCandidate), Boolean(m.validateCandidateEvidence), Boolean(m.dedupeCandidateBatch), Boolean(m.KnowledgeEntry)))"`

### 删除计划

状态：待用户在其他窗口执行。

删除前置条件：

- 两个外层仓库均已更新 `vendor/AlembicCore` 到 `9e98595` 或更新的 Core 提交。
- 两个外层仓库均已在 `vendor/AlembicCore` 内完成本地 build，且 `vendor/AlembicCore/dist/index.js` 存在。
- 候选提交入口已经调用 Core `prepareCandidateForReview` 或 `submitKnowledgeCandidate`。
- 旧 candidate aggregator / bootstrap dedup 文件已经变成只 re-export Core 的薄适配层。
- 两个外层仓库 `npm run build:check` 均通过。

删除候选：

- `Alembic/lib/service/candidate/CandidateAggregator.ts`
- `Alembic/lib/service/bootstrap/BootstrapDedup.ts`
- `Alembic/lib/types/knowledge-wire.ts`
- `AlembicPlugin/lib/service/candidate/CandidateAggregator.ts`
- `AlembicPlugin/lib/service/bootstrap/BootstrapDedup.ts`
- `AlembicPlugin/lib/types/knowledge-wire.ts`

条件删除候选：

- `Alembic/lib/service/candidate/SimilarityService.ts`
- `AlembicPlugin/lib/service/candidate/SimilarityService.ts`

说明：只有当外层调用方已经不再依赖 `findSimilarRecipes(projectRoot, candidate)` 的磁盘扫描行为，或已改为向 Core 注入 `existingCandidates` 摘要后，才能删除 `SimilarityService.ts`。否则保留到阶段 8。

保留候选：

- `Alembic` Dashboard candidate review route/UI/API。
- `AlembicPlugin` Codex MCP schema、tool response formatter、Skills、plugin manifest。
- 本地 AI 生成 candidate 的 prompt/provider/enrich 逻辑。
- `BootstrapEventEmitter.ts` 与 `bootstrap-event-types.ts`，待阶段 6/10 再处理事件/job 边界。

替换检查：

- `rg "CandidateAggregator|aggregateCandidates|dedupeCandidateBatch" Alembic/lib AlembicPlugin/lib`
- `rg "BootstrapDedup|CandidateSummary|DedupMatch" Alembic/lib AlembicPlugin/lib`
- `rg "KnowledgeEntryWire|KnowledgeContentWire|KnowledgeReasoningWire|KnowledgeQualityWire|KnowledgeStatsWire|KnowledgeConstraintsWire|KnowledgeRelationsWire" Alembic/lib AlembicPlugin/lib`
- `rg "prepareCandidateForReview|submitKnowledgeCandidate|validateCandidateEvidence" Alembic/lib AlembicPlugin/lib`
- `rg "findSimilarRecipes|SimilarityService" Alembic/lib AlembicPlugin/lib`

执行步骤：

1. 先把旧路径改为 re-export adapter，保持旧 import 不立刻失效。
2. 在候选提交入口接入 Core intake，并把 `diagnostics` 映射到外层现有错误/审核提示结构。
3. 将业务代码中可直接依赖 Core 的 import 改为 `@alembic/core`。
4. 确认 adapter 无业务逻辑后，删除上面的删除候选。
5. 对 `SimilarityService.ts` 只做条件删除；若仍有磁盘 recipe 相似度查询，保留到阶段 8。
6. 删除后运行外层建议验证。
7. 回填 `Alembic` / `AlembicPlugin` 接入提交、删除提交、验证结果和遗留问题。

删除禁止项：

- 不要删除 Dashboard candidate review UI/API。
- 不要删除 Codex MCP schema、tool formatter、Skills、plugin manifest。
- 不要删除本地 AI provider/prompt/enrich 逻辑。
- 不要删除 `BootstrapEventEmitter.ts` 与 `bootstrap-event-types.ts`。
- 不要提前处理阶段 5 storage/repository 或阶段 8 search/vector。

## 阶段 5：Storage Foundation

目标：

把知识库文件存储、SQLite/Drizzle、Repository、SourceRef、GuardViolation、Token/metadata 里非 AI 的确定性读写能力迁入 Core。

迁移输入：

- `lib/infrastructure/config/**`
- `lib/infrastructure/database/**`
- `lib/repository/base/**`
- `lib/repository/knowledge/**`
- `lib/repository/sourceref/**`
- `lib/repository/search/**`
- `lib/repository/guard/**`
- `lib/repository/bootstrap/**`
- `lib/repository/token/**` 中不涉及模型计费策略的元数据存储部分。

Core 输出：

- `src/config/**`
- `src/storage/**`
- `src/repository/**`
- `createDatabaseConnection`
- `createKnowledgeRepository`
- `createSourceRefRepository`
- `createGuardViolationRepository`

外层接入任务（其他窗口执行）：

- `Alembic` 和 `AlembicPlugin` 不直接访问旧 repository。
- 外层通过 Core repository/service 访问知识数据。

阶段验收：

- Core DB/repository tests。
- Ghost workspace 读写测试。
- `Alembic` 本地知识库读写 smoke。
- `AlembicPlugin` Ghost 数据目录读写 smoke。

删除计划模板：

预计删除候选：

- `Alembic/lib/repository/**`
- `AlembicPlugin/lib/repository/**`
- `Alembic/lib/infrastructure/database/**`
- `AlembicPlugin/lib/infrastructure/database/**`

预计保留候选：

- Dashboard route adapter。
- CLI command adapter。
- Codex MCP handler adapter。

### 阶段完成记录

完成日期：2026-05-16

Core commit：

- `93b2ac0` `Add core sqlite storage foundation`
- `675baae` `Use better sqlite driver in core`

用户确认：

- SQLite 肯定要进入 Core；外层不能继续各自拥有数据库连接、schema migration 和核心 repository 实现。

Core 改动：

- 新增 `src/storage/sqlite/**`：
  - `createDatabaseConnection`
  - `AlembicDatabaseConnection`
  - `resolveDatabasePath`
  - `runAlembicSqliteMigrations`
  - `ALEMBIC_SQLITE_MIGRATIONS`
- Core 现在直接拥有 Alembic SQLite schema 初始化和 migration：
  - `knowledge_entries`
  - `knowledge_edges`
  - `guard_violations`
  - `audit_logs`
  - `sessions`
  - `token_usage`
  - `semantic_memories`
  - `bootstrap_snapshots`
  - `bootstrap_dim_files`
  - `code_entities`
  - `remote_commands`
  - `evolution_proposals`
  - `recipe_source_refs`
  - `lifecycle_transition_events`
  - `recipe_warnings`
  - `schema_migrations`
- 新增 `src/repository/**`：
  - `createKnowledgeRepository`
  - `createSourceRefRepository`
  - `createGuardViolationRepository`
  - `createBootstrapRepository`
  - `createTokenUsageStore`
  - `KnowledgeFileStore` / `KnowledgeFileScanner` contract
- 新增 `src/config/**`：
  - Core 默认路径/存储常量。
  - `ConfigLoader` / `loadAlembicConfig` / `deepMerge`。
  - project knowledge path、recipes path、context path、cache/snippet path helpers。
- 新增 `src/shared/json.ts`，收口 `safeJsonParse`、`safeJsonStringify`、`unixNow`。
- 顶层 `@alembic/core` 已导出 config、storage、repository API。

实现边界：

- Core 默认 SQLite driver 已切换为稳定的 `better-sqlite3`，不使用 `node:sqlite` 作为默认生产路径。
- 不通过 `--no-warnings`、`NODE_NO_WARNINGS=1`、`process.on('warning')` 压制 warning；warning 根因通过 driver 切换解决。
- `node:sqlite` 不再被 Core storage 代码引用。如后续需要实验分支，可以作为可选 adapter，但 SQLite 所有权仍属于 Core。
- Drizzle typed schema 没有继续复制进 Core；外层现有 Drizzle repository 应逐步改成 Core repository 适配层，再删除。不要因为 Drizzle 尚未进入 Core 就把 SQLite 留在外层。
- Token 用量表和 `TokenUsageStore` 已进入 Core，但 AI provider/model 调用仍然不进入 Core；Core 只记录外层传入的确定性用量数据。
- `KnowledgeFileStore` 先迁入 contract，通用 Markdown serializer/scanner 可在后续阶段继续迁，不影响 SQLite 所有权。

Core 验证：

- `npm run build:check` 通过。
- `npm run build` 通过。
- Core SQLite smoke 通过：
  - driver 为 `better-sqlite3`。
  - `createDatabaseConnection({ path: ':memory:' })` 成功。
  - 创建 17 张 SQLite 表。
  - 8 个 migration 版本成功写入 `schema_migrations`。
  - `createKnowledgeRepository` 可写入并读回 `KnowledgeEntry`。
  - `createSourceRefRepository` 可 upsert/count。
  - `createGuardViolationRepository` 可 create/stats。
  - `createBootstrapRepository` 可 create/getLatest。
  - `createTokenUsageStore` 可 record/report。
- smoke 输出不再出现 `ExperimentalWarning: SQLite is an experimental feature`。
- `git ls-files dist | wc -l` 为 `0`，构建产物仍不提交。

外层接入任务（其他窗口执行）：

1. 在 `Alembic` 和 `AlembicPlugin` 中更新 `vendor/AlembicCore` 到 `675baae` 或更新的 Core 提交。
2. 在两个外层仓库分别运行 `npm --prefix vendor/AlembicCore install --ignore-scripts` 与 `npm --prefix vendor/AlembicCore run build`，生成本地 ignored 的 `vendor/AlembicCore/dist`。
3. 将两边的 DB 初始化入口改为从 `@alembic/core` 使用：
   - `createDatabaseConnection`
   - `runAlembicSqliteMigrations`
   - `createKnowledgeRepository`
   - `createSourceRefRepository`
   - `createGuardViolationRepository`
   - `createBootstrapRepository`
   - `createTokenUsageStore`
4. 将 `Alembic/lib/infrastructure/database/DatabaseConnection.ts` 与 `AlembicPlugin/lib/infrastructure/database/DatabaseConnection.ts` 先改成薄适配层：
   - 构造参数和旧 `connect()` / `close()` / `getDb()` API 保持兼容。
   - 内部委托 `@alembic/core` 的 `AlembicDatabaseConnection`。
   - 如果调用方仍需要旧 `getDrizzle()`，暂时保留旧 Drizzle 初始化，但只作为过渡，不再拥有 schema migration。
5. 将两边 repository 按模块逐步改为 Core factory：
   - `KnowledgeRepository.impl.ts` → `createKnowledgeRepository`
   - `RecipeSourceRefRepository.ts` → `createSourceRefRepository`
   - `GuardViolationRepository.ts` → `createGuardViolationRepository`
   - `BootstrapRepository.ts` → `createBootstrapRepository`
   - `TokenUsageStore.ts` → `createTokenUsageStore`
6. `KnowledgeFileStore.ts` 可以先改为从 Core re-export contract；实际 file writer/Markdown serializer 如仍在外层服务里，可暂时保留。
7. `Paths.ts` / `Defaults.ts` / `ConfigLoader.ts` 先改成从 Core re-export 或薄适配，保留外层特殊 CLI/Dashboard 默认值。
8. Dashboard route、CLI command、Codex MCP handler 只做参数解析、权限/展示适配和错误映射，不再直接拥有 SQLite schema 和核心 repository。

外层建议验证：

- `Alembic`: `npm run build:check`
- `AlembicPlugin`: `npm run build:check`
- `Alembic`: setup Ghost workspace 后创建 DB，并验证 `knowledge_entries` / `schema_migrations` 存在。
- `AlembicPlugin`: Codex status/diagnostics 不启动 daemon 的 smoke。
- 两边各跑一个 runtime import smoke：
  - `node -e "import('@alembic/core').then(async m=>{ const c=m.createDatabaseConnection({path:':memory:'}); await c.connect(); console.log(Boolean(m.createKnowledgeRepository(c)), c.appliedMigrations.length); c.close(); })"`

### 删除计划

状态：待用户在其他窗口执行。

删除前置条件：

- 两个外层仓库均已更新 `vendor/AlembicCore` 到 `675baae` 或更新的 Core 提交。
- 两个外层仓库均已在 `vendor/AlembicCore` 内完成本地 build，且 `vendor/AlembicCore/dist/index.js` 存在。
- 外层 DB 初始化入口已经委托 Core `createDatabaseConnection`。
- 外层 migration 不再直接执行本地 `lib/infrastructure/database/migrations/**`。
- 外层 repository 业务调用已经改为 Core factory 或薄 adapter。
- 两个外层仓库 `npm run build:check` 均通过。

第一批删除候选：

- `Alembic/lib/infrastructure/config/Defaults.ts`
- `Alembic/lib/infrastructure/config/Paths.ts`
- `Alembic/lib/infrastructure/config/ConfigLoader.ts`
- `Alembic/lib/repository/knowledge/KnowledgeFileStore.ts`
- `Alembic/lib/repository/sourceref/RecipeSourceRefRepository.ts`
- `Alembic/lib/repository/guard/GuardViolationRepository.ts`
- `Alembic/lib/repository/bootstrap/BootstrapRepository.ts`
- `Alembic/lib/repository/token/TokenUsageStore.ts`
- `AlembicPlugin/lib/infrastructure/config/Defaults.ts`
- `AlembicPlugin/lib/infrastructure/config/Paths.ts`
- `AlembicPlugin/lib/infrastructure/config/ConfigLoader.ts`
- `AlembicPlugin/lib/repository/knowledge/KnowledgeFileStore.ts`
- `AlembicPlugin/lib/repository/sourceref/RecipeSourceRefRepository.ts`
- `AlembicPlugin/lib/repository/guard/GuardViolationRepository.ts`
- `AlembicPlugin/lib/repository/bootstrap/BootstrapRepository.ts`
- `AlembicPlugin/lib/repository/token/TokenUsageStore.ts`

第二批删除候选：

- `Alembic/lib/infrastructure/database/migrations/**`
- `AlembicPlugin/lib/infrastructure/database/migrations/**`
- `Alembic/lib/infrastructure/database/DatabaseConnection.ts`
- `AlembicPlugin/lib/infrastructure/database/DatabaseConnection.ts`
- `Alembic/lib/infrastructure/database/drizzle/index.ts`
- `AlembicPlugin/lib/infrastructure/database/drizzle/index.ts`
- `Alembic/lib/infrastructure/database/drizzle/schema.ts`
- `AlembicPlugin/lib/infrastructure/database/drizzle/schema.ts`
- `Alembic/lib/repository/base/RepositoryBase.ts`
- `AlembicPlugin/lib/repository/base/RepositoryBase.ts`

第二批删除条件：

- 所有旧 Drizzle repository 调用都已经替换为 Core repository。
- 没有调用方继续依赖 `getDrizzle()`、`initDrizzle()`、Drizzle table schema 类型。
- Dashboard/API/CLI/Codex handler 的查询都通过 Core repository 或明确的外层 adapter。

暂缓删除候选：

- `Alembic/lib/repository/knowledge/KnowledgeRepository.impl.ts`
- `AlembicPlugin/lib/repository/knowledge/KnowledgeRepository.impl.ts`
- `Alembic/lib/repository/search/**`
- `AlembicPlugin/lib/repository/search/**`

说明：`KnowledgeRepository.impl.ts` 方法很多，外层可以先改成 adapter，再分批替换调用；search repository 与阶段 8 Search/Vector 强相关，不在 Phase 5 一次性删除。

保留候选：

- Dashboard route adapter。
- CLI command adapter。
- Codex MCP handler adapter。
- 本地 AI provider/model/prompt 逻辑。
- Codex MCP schema、tool formatter、Skills、plugin manifest。

替换检查：

- `rg "DatabaseConnection|createDatabaseConnection|getDb\\(|getDrizzle|initDrizzle" Alembic/lib AlembicPlugin/lib`
- `rg "drizzle-orm|better-sqlite3|schema_migrations|runMigrations" Alembic/lib AlembicPlugin/lib`
- `rg "KnowledgeRepositoryImpl|RecipeSourceRefRepositoryImpl|GuardViolationRepositoryImpl|BootstrapRepositoryImpl|TokenUsageStore" Alembic/lib AlembicPlugin/lib`
- `rg "lib/infrastructure/database|#infra/database|#repo/" Alembic/lib AlembicPlugin/lib`

执行步骤：

1. 先建立外层薄 adapter，不直接大删。
2. 把 DB 初始化和 migration 统一切到 Core。
3. 把 repository 调用逐步切到 Core factory。
4. 第一批删除候选确认无业务逻辑后删除。
5. 第二批删除候选等 Drizzle 调用清零后删除。
6. 删除后运行外层建议验证。
7. 回填 `Alembic` / `AlembicPlugin` 接入提交、删除提交、验证结果和遗留问题。

删除禁止项：

- 不要删除 Dashboard route/CLI command/Codex MCP handler。
- 不要删除 AI provider/model/prompt/Agent runtime。
- 不要删除阶段 6 bootstrap/rescan workflow 逻辑。
- 不要删除阶段 8 search/vector 逻辑。
- 不要为了消除 Drizzle 而改写业务行为；先 adapter，再删除。

## 阶段 6：Bootstrap/Rescan Workflow

目标：

把 bootstrap/rescan 的核心状态机、scan session、task retry、candidate result intake、checkpoint/recover 迁入 Core。

迁移输入：

- `lib/workflows/cold-start/**`
- `lib/workflows/knowledge-rescan/**`
- `lib/workflows/shared/**`
- `lib/service/bootstrap/**`
- `lib/repository/bootstrap/**`
- 当前 Core `src/scan/**`

Core 输出：

- `src/workflows/bootstrap/**`
- `src/workflows/rescan/**`
- `src/workflows/shared/**`
- `runBootstrap(runtime, options)`
- `runRescan(runtime, options)`
- `submitBootstrapAnalysisResult(runtime, workflow, result, options)`
- `submitRescanAnalysisResult(runtime, workflow, result, options)`
- `submitWorkflowAnalysisResult(runtime, workflow, result, options)`
- `saveDimensionCheckpoint(dataRoot, sessionId, dimId, result, digest, options)`
- `loadDimensionCheckpoints(dataRoot, options)`
- `clearDimensionCheckpoints(dataRoot, options)`
- `summarizeWorkflowState(workflow)`
- `getNextAnalysisTask(session)`
- `submitAnalysisResult(session, result)`

### 阶段完成记录

完成日期：2026-05-16

Core commit：

- `ff636fe` `Add bootstrap rescan core workflows`

Core 改动：

- 新增 `src/workflows/bootstrap/**`：
  - `runBootstrap(runtime, options)`
  - `submitBootstrapAnalysisResult(runtime, workflow, result, options)`
  - `summarizeBootstrapWorkflow(workflow)`
- 新增 `src/workflows/rescan/**`：
  - `runRescan(runtime, options)`
  - `submitRescanAnalysisResult(runtime, workflow, result, options)`
  - `summarizeRescanWorkflow(workflow)`
- 新增 `src/workflows/shared/state.ts`：
  - 通用 `WorkflowState`
  - workflow id/session 创建
  - 宿主分析结果 intake
  - 候选知识准备、去重、diagnostics 汇总
  - workflow summary
- 新增 `src/workflows/shared/checkpoint.ts`：
  - 兼容旧 `.asd/bootstrap-checkpoint` 路径。
  - 支持保存、加载、清理维度 checkpoint。
  - 支持 TTL 过滤和损坏 checkpoint 跳过。
- 新增 `src/workflows/shared/types.ts`：
  - `WorkflowKind`
  - `WorkflowExecutor`
  - `WorkflowAnalysisMode`
  - `WorkflowStatus`
  - `WorkflowDiagnostic`
  - `WorkflowResultIntakeReport`
- 顶层 `@alembic/core` 已通过 `src/index.ts` 导出 workflows API。

实现边界：

- Core 只创建可恢复任务图、维护 workflow/scan 状态、接收宿主结果并进入 deterministic candidate intake。
- Core 不执行 Codex Agent、不运行本地 AI、不拼 prompt、不调用模型、不做 tool calling。
- Bootstrap/rescan 的“代码理解与候选生成”仍由 `AlembicPlugin` 的 Codex 主 Agent 或 `Alembic` 的本地宿主流程执行。
- Core 的 `WorkflowExecutor` 只是记录执行来源，如 `host-agent`、`external-agent`、`local-runtime`、`manual`；不是 Agent runtime。
- checkpoint 只保存维度级恢复数据；外层的 `SessionStore`、event emitter、Dashboard realtime 仍然留在外层。

Core 验证：

- `npm run build:check` 通过。
- `npm run build` 通过。
- Phase 6 smoke 通过：
  - `runBootstrap` 创建 bootstrap workflow。
  - `getNextAnalysisTask` 返回宿主任务。
  - `submitBootstrapAnalysisResult` 接收宿主候选并产生 1 个 accepted candidate。
  - `runRescan` 创建 rescan workflow。
  - `submitRescanAnalysisResult` 推进 rescan workflow 到 `succeeded`。
  - `saveDimensionCheckpoint` / `loadDimensionCheckpoints` 可保存并读回 `architecture` checkpoint。
- `git ls-files dist` 无输出，构建产物仍不提交。

外层接入任务（其他窗口执行）：

1. 在 `Alembic` 和 `AlembicPlugin` 中更新 `vendor/AlembicCore` 到 `ff636fe` 或更新的 Core 提交。
2. 在两个外层仓库分别运行 `npm --prefix vendor/AlembicCore install --ignore-scripts` 与 `npm --prefix vendor/AlembicCore run build`，生成本地 ignored 的 `vendor/AlembicCore/dist`。
3. 将 cold-start/bootstrap 入口改为先调用 `runBootstrap(runtime, options)` 创建 Core workflow。
4. 将 rescan 入口改为先调用 `runRescan(runtime, options)` 创建 Core workflow。
5. 外层执行循环只做三件事：
   - 从 Core `scanSession` 取 `getNextAnalysisTask(session)`。
   - 把 task 交给 Codex Agent、本地 Agent 或本地 AI 流程执行。
   - 将结构化结果交回 `submitBootstrapAnalysisResult` 或 `submitRescanAnalysisResult`。
6. 外层已有的 `markAnalysisTaskRunning`、`retryAnalysisTask`、`failAnalysisTask`、`cancelScanSession` 可继续直接从 Core 使用。
7. 外层维度完成后调用 Core `saveDimensionCheckpoint`；恢复时调用 `loadDimensionCheckpoints`，清理全量重建状态时调用 `clearDimensionCheckpoints`。
8. Dashboard/API/Codex MCP handler 只展示或包装 Core workflow summary，不再直接维护一套重复 task 状态。
9. `AlembicPlugin` 仍保留 Codex prompt/mission/briefing/tool schema；只把产物整理成 Core `HostAnalysisResult`。
10. `Alembic` 仍保留本地 AI/provider/model 调用和授权策略；只把产物整理成 Core `HostAnalysisResult`。

阶段验收：

- Core dry-run workflow tests 已完成 smoke，建议后续补正式 fixture tests。
- 中断恢复测试：用 `loadDimensionCheckpoints` 恢复已完成维度。
- failed task retry 测试：外层使用 Core `retryAnalysisTask` 后重新提交结果。
- `Alembic` coldstart/rescan smoke。
- `AlembicPlugin` bootstrap/rescan job wrapper smoke。

外层建议验证：

- `Alembic`: `npm run build:check`
- `AlembicPlugin`: `npm run build:check`
- `Alembic`: coldstart dry-run 或最小项目 smoke，确认 Core workflow 创建、任务执行、结果提交、checkpoint 写入全链路可用。
- `Alembic`: rescan smoke，确认 changed files / affected dimensions 可进入 Core `runRescan`。
- `AlembicPlugin`: bootstrap/rescan Codex wrapper smoke，确认 Codex Agent 只执行 Core task 并提交 `HostAnalysisResult`。
- 两边各跑一个 workflow import smoke：
  - `node -e "import('@alembic/core').then(m=>{ const r=m.createAlembicRuntime({projectRoot:process.cwd()}); const w=m.runBootstrap(r,{targets:[{path:'package.json'}]}); console.log(Boolean(m.getNextAnalysisTask(w.scanSession)), w.status); })"`

### 删除计划

状态：待用户在其他窗口执行。

删除前置条件：

- 两个外层仓库均已更新 `vendor/AlembicCore` 到 `ff636fe` 或更新的 Core 提交。
- 两个外层仓库均已在 `vendor/AlembicCore` 内完成本地 build，且 `vendor/AlembicCore/dist/index.js` 存在。
- cold-start/bootstrap 入口已经通过 Core `runBootstrap` 创建 workflow。
- rescan 入口已经通过 Core `runRescan` 创建 workflow。
- 宿主分析结果已经统一整理为 Core `HostAnalysisResult`。
- 维度 checkpoint 已切换到 Core `saveDimensionCheckpoint` / `loadDimensionCheckpoints` / `clearDimensionCheckpoints`。
- Dashboard/API/Codex wrapper 的进度展示已改为读取 Core workflow/scan summary 或外层 adapter。
- 两个外层仓库 `npm run build:check` 均通过。

第一批删除候选：

- `Alembic/lib/workflows/capabilities/persistence/DimensionCheckpoint.ts`
- `AlembicPlugin/lib/workflows/capabilities/persistence/DimensionCheckpoint.ts`
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapRescanState.ts`
- `AlembicPlugin/lib/workflows/capabilities/execution/internal-agent/BootstrapRescanState.ts`
- `Alembic/lib/workflows/capabilities/execution/external/ExternalSubmissionTracker.ts`
- `AlembicPlugin/lib/workflows/capabilities/execution/external/ExternalSubmissionTracker.ts`

第二批删除候选：

- `Alembic/lib/service/bootstrap/BootstrapTaskManager.ts`
- `AlembicPlugin/lib/service/bootstrap/BootstrapTaskManager.ts`
- `Alembic/lib/workflows/capabilities/execution/external/BootstrapSession.ts`
- `AlembicPlugin/lib/workflows/capabilities/execution/external/BootstrapSession.ts`
- `Alembic/lib/workflows/capabilities/execution/external/SessionSupport.ts`
- `AlembicPlugin/lib/workflows/capabilities/execution/external/SessionSupport.ts`
- `Alembic/lib/workflows/cold-start/ColdStartPlan.ts`
- `AlembicPlugin/lib/workflows/cold-start/ColdStartPlan.ts`
- `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflowPlan.ts`
- `AlembicPlugin/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflowPlan.ts`

删除条件说明：

- 第一批只在 checkpoint、dedup/intake、submission tracking 已完全转为 Core 后删除。
- 第二批只在外层 adapter 已不再维护重复 session/task/progress 状态后删除。
- `ColdStartPlan.ts` 与 `KnowledgeRescanWorkflowPlan.ts` 若仍包含外层参数解析或用户文案，先改成薄 adapter，再删除重复状态机部分。

暂缓删除候选：

- `Alembic/lib/workflows/capabilities/persistence/WorkflowSnapshotStore.ts`
- `AlembicPlugin/lib/workflows/capabilities/persistence/WorkflowSnapshotStore.ts`
- `Alembic/lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillTypes.ts`
- `AlembicPlugin/lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillTypes.ts`

说明：`WorkflowSnapshotStore` 仍绑定外层 `SessionStore`、项目 snapshot 与 file diff；可在 Phase 7 Discovery/AST 和 Phase 10 Jobs/Events 后再收束。`InternalDimensionFillTypes` 包含 AI provider、AgentService、prompt/consumer 容器，不进入 Core。

保留候选：

- Codex MCP tool schema、Codex Skills、plugin manifest。
- Codex Agent mission/briefing/prompt/adapter。
- 本地 AI provider/model/prompt/Agent runtime。
- Dashboard job UI、realtime event adapter、API route adapter。
- CLI command adapter、用户确认/授权提示。

替换检查：

- `rg "DimensionCheckpoint|saveDimensionCheckpoint|loadDimensionCheckpoints|clearDimensionCheckpoints" Alembic/lib AlembicPlugin/lib`
- `rg "BootstrapTaskManager|BootstrapSession|ExternalSubmissionTracker|SessionSupport" Alembic/lib AlembicPlugin/lib`
- `rg "ColdStartWorkflowPlan|KnowledgeRescanWorkflowPlan|buildColdStartWorkflowPlan|buildKnowledgeRescanWorkflowPlan" Alembic/lib AlembicPlugin/lib`
- `rg "runBootstrap|runRescan|submitBootstrapAnalysisResult|submitRescanAnalysisResult|submitWorkflowAnalysisResult" Alembic/lib AlembicPlugin/lib`
- `rg "HostAnalysisResult|getNextAnalysisTask|markAnalysisTaskRunning|retryAnalysisTask" Alembic/lib AlembicPlugin/lib`

执行步骤：

1. 先建立外层 workflow adapter，保持旧 command/API/Codex handler 调用面兼容。
2. bootstrap adapter 内部调用 Core `runBootstrap` 创建 workflow。
3. rescan adapter 内部调用 Core `runRescan` 创建 workflow。
4. 外层执行器只负责执行 Core task 并提交 `HostAnalysisResult`。
5. checkpoint 切到 Core 后删除重复 checkpoint 文件。
6. task/session/progress 切到 Core 后删除重复 workflow 状态机。
7. 删除后运行外层建议验证。
8. 回填 `Alembic` / `AlembicPlugin` 接入提交、删除提交、验证结果和遗留问题。

删除禁止项：

- 不要删除 Codex Agent prompt、mission briefing、MCP tool schema 或 Skills。
- 不要删除本地 AI provider/model/prompt/Agent runtime。
- 不要删除 Dashboard UI、API route 或 CLI command adapter。
- 不要删除 Discovery/AST、search/vector、Guard、Job/Event 相关逻辑；它们分别属于后续阶段。
- 不要为了统一 workflow 改写候选生成质量策略；Core 只接收结构化结果，不决定宿主如何生成结果。

## 阶段 7：Discovery/AST

目标：

把项目发现、语言识别、tree-sitter、ProjectGraph、CallGraph、SymbolTable、ImportResolver 迁入 Core。

迁移输入：

- `lib/core/discovery/**`
- `lib/core/ast/**`
- `lib/core/analysis/**`
- `lib/core/AstAnalyzer.ts`
- `lib/shared/LanguageProfiles.ts`
- `lib/shared/LanguageService.ts`
- `lib/types/ast.d.ts`
- `lib/types/project-snapshot*.ts`
- grammar 使用契约。

Core 输出：

- `src/discovery/**`
- `src/analysis/**`
- `discoverProject`
- `buildProjectGraph`
- `analyzeSymbols`
- `detectProject`
- `buildSymbolTable`
- `buildCallGraph`
- `createSyntaxParserRegistry`

### 阶段完成记录

完成日期：2026-05-16

Core commit：

- `a4e7669` `Add project discovery and analysis core`

Core 改动：

- 扩展 `src/shared/language-service.ts`：
  - 统一扩展名到语言 ID 映射。
  - 语言 alias 归一化。
  - source ext 集合。
  - scan skip dirs。
  - build-system marker 映射。
  - `detectProfile` / `detectProjectLanguages` / `isTestFile`。
- 新增 `src/discovery/**`：
  - `discoverProject(runtimeOrProjectRoot, options)`
  - `detectProject(projectRoot)`
  - `collectSourceFiles`
  - Node/SPM/Xcode/Python/JVM/Go/Rust/Dart/.NET/Ruby/Generic marker 检测。
  - target 拆分、source file 收集、语言画像、dependency graph 初始结构。
- 新增 `src/analysis/**`：
  - `analyzeFileSymbols`
  - `analyzeSymbols`
  - `buildSymbolTable`
  - `buildCallGraph`
  - `buildProjectGraph`
  - `findProjectSymbols`
  - `getFileSymbols`
  - `buildProjectSnapshot`
- 新增 `createSyntaxParserRegistry`：
  - Core 定义 parser/grammar adapter contract。
  - grammar 二进制、tree-sitter 初始化和宿主加载路径由外层注入或保留外层打包脚本。
- 顶层 `@alembic/core` 已导出 discovery/analysis API。

实现边界：

- Core 现在拥有确定性项目发现、语言画像、target/file 收集、基础符号表、调用图和项目图 API。
- Core 不调用 AI，不请求宿主 Agent 分析代码；这一阶段仍然是纯本地确定性扫描。
- Core 不把 grammar 二进制打包进仓库，也不打开 GUI 或启动 daemon。
- `createSyntaxParserRegistry` 是 grammar/tree-sitter 的接入契约；外层可以先继续使用现有 tree-sitter 实现，并逐步改为 Core adapter。
- 当前 `analyzeSymbols` 提供跨语言 deterministic 语法规则提取，覆盖 TS/JS、Swift、Python、Java/Kotlin、Go、Rust、Dart、ObjC 的基础 class/function/import/call site；外层 tree-sitter walker 在接入完成前不得删除。

Core 验证：

- `npm run build:check` 通过。
- `npm run build` 通过。
- Phase 7 smoke 通过，以 `AlembicCore` 自身为目标：
  - `discoverProject` 识别为 `node`。
  - 主语言识别为 `typescript`。
  - 发现 1 个 target。
  - 限制 `maxFiles=80` 时收集 80 个源码文件。
  - `analyzeSymbols` 抽取 485 个 symbols、86 个 classes、282 个 methods。
  - `buildProjectGraph` 生成 80 个 graph files、451 条 call edges。
  - `findProjectSymbols(graph, "LanguageService")` 返回 1 个符号。
- `git ls-files dist` 无输出，构建产物仍不提交。

外层接入任务（其他窗口执行）：

1. 在 `Alembic` 和 `AlembicPlugin` 中更新 `vendor/AlembicCore` 到 `a4e7669` 或更新的 Core 提交。
2. 在两个外层仓库分别运行 `npm --prefix vendor/AlembicCore install --ignore-scripts` 与 `npm --prefix vendor/AlembicCore run build`，生成本地 ignored 的 `vendor/AlembicCore/dist`。
3. 将冷启动 Phase 1 项目发现改为调用 Core：
   - `discoverProject(runtime, { includeContent, maxFiles, maxFileSizeBytes })`
   - `detectProject(projectRoot)`
4. 将 Codex structure tool、status/diagnostics 中需要项目结构的地方改为 Core discovery API。
5. 将 AST summary / symbol table / call graph 的通用路径改为 Core：
   - `analyzeSymbols(runtime, { discovery })`
   - `buildSymbolTable(astSummary)`
   - `buildCallGraph(astSummary, symbolTable)`
   - `buildProjectGraph(runtime, { discovery })`
6. 外层已有 tree-sitter walker 可以先作为 adapter 接入 `createSyntaxParserRegistry`，或先保留旧实现直到 adapter 完成。
7. grammar binary copy、release packaging、资源路径探测仍由外层仓库维护；不要放进 Core。
8. Dashboard graph visualization 只读取 Core `ProjectGraph` / `DependencyGraph` / `CallGraphResult`，不再自行维护 discovery/AST 数据模型。

阶段验收：

- TypeScript/Python/Swift/Rust fixture discovery tests。
- `Alembic` coldstart 项目识别 smoke。
- `AlembicPlugin` structure tool smoke。
- tree-sitter adapter smoke：外层旧 walker 作为 adapter 输出仍能被 Core contract 接收。

外层建议验证：

- `Alembic`: `npm run build:check`
- `AlembicPlugin`: `npm run build:check`
- `Alembic`: coldstart 最小项目 smoke，确认 Phase 1 使用 Core `discoverProject`。
- `AlembicPlugin`: structure tool smoke，确认返回 target/files/language/dependency graph。
- 两边各跑一个 import smoke：
  - `node -e "import('@alembic/core').then(m=>{ const r=m.createAlembicRuntime({projectRoot:process.cwd()}); const d=m.discoverProject(r,{maxFiles:20}); const g=m.buildProjectGraph(r,{discovery:d}); console.log(d.discoverer.id, d.files.length, g.ast.projectMetrics.totalSymbols); })"`

### 删除计划

状态：待用户在其他窗口执行。

删除前置条件：

- 两个外层仓库均已更新 `vendor/AlembicCore` 到 `a4e7669` 或更新的 Core 提交。
- 两个外层仓库均已在 `vendor/AlembicCore` 内完成本地 build，且 `vendor/AlembicCore/dist/index.js` 存在。
- 冷启动 Phase 1 已改为 Core `discoverProject`。
- Codex structure tool 已改为 Core discovery/analysis API 或薄 adapter。
- 外层 AST/tree-sitter walker 已接入 `createSyntaxParserRegistry`，或者保留为 adapter 且不再暴露重复公共模型。
- 两个外层仓库 `npm run build:check` 均通过。

第一批删除候选：

- `Alembic/lib/shared/LanguageProfiles.ts`
- `Alembic/lib/shared/LanguageService.ts`
- `AlembicPlugin/lib/shared/LanguageProfiles.ts`
- `AlembicPlugin/lib/shared/LanguageService.ts`
- `Alembic/lib/core/discovery/ProjectDiscoverer.ts`
- `Alembic/lib/core/discovery/DiscovererRegistry.ts`
- `Alembic/lib/core/discovery/GenericDiscoverer.ts`
- `Alembic/lib/core/discovery/NodeDiscoverer.ts`
- `Alembic/lib/core/discovery/SpmDiscoverer.ts`
- `Alembic/lib/core/discovery/PythonDiscoverer.ts`
- `Alembic/lib/core/discovery/JvmDiscoverer.ts`
- `Alembic/lib/core/discovery/GoDiscoverer.ts`
- `Alembic/lib/core/discovery/RustDiscoverer.ts`
- `Alembic/lib/core/discovery/DartDiscoverer.ts`
- `AlembicPlugin/lib/core/discovery/ProjectDiscoverer.ts`
- `AlembicPlugin/lib/core/discovery/DiscovererRegistry.ts`
- `AlembicPlugin/lib/core/discovery/GenericDiscoverer.ts`
- `AlembicPlugin/lib/core/discovery/NodeDiscoverer.ts`
- `AlembicPlugin/lib/core/discovery/SpmDiscoverer.ts`
- `AlembicPlugin/lib/core/discovery/PythonDiscoverer.ts`
- `AlembicPlugin/lib/core/discovery/JvmDiscoverer.ts`
- `AlembicPlugin/lib/core/discovery/GoDiscoverer.ts`
- `AlembicPlugin/lib/core/discovery/RustDiscoverer.ts`
- `AlembicPlugin/lib/core/discovery/DartDiscoverer.ts`

第二批删除候选：

- `Alembic/lib/core/analysis/SymbolTableBuilder.ts`
- `Alembic/lib/core/analysis/CallGraphAnalyzer.ts`
- `Alembic/lib/core/analysis/ImportRecord.ts`
- `Alembic/lib/core/analysis/ImportPathResolver.ts`
- `Alembic/lib/core/analysis/CallSiteExtractor.ts`
- `Alembic/lib/core/analysis/CallEdgeResolver.ts`
- `Alembic/lib/core/analysis/DataFlowInferrer.ts`
- `AlembicPlugin/lib/core/analysis/SymbolTableBuilder.ts`
- `AlembicPlugin/lib/core/analysis/CallGraphAnalyzer.ts`
- `AlembicPlugin/lib/core/analysis/ImportRecord.ts`
- `AlembicPlugin/lib/core/analysis/ImportPathResolver.ts`
- `AlembicPlugin/lib/core/analysis/CallSiteExtractor.ts`
- `AlembicPlugin/lib/core/analysis/CallEdgeResolver.ts`
- `AlembicPlugin/lib/core/analysis/DataFlowInferrer.ts`

第三批删除候选：

- `Alembic/lib/types/project-snapshot.ts`
- `Alembic/lib/types/project-snapshot-builder.ts`
- `Alembic/lib/types/snapshot-views.ts`
- `AlembicPlugin/lib/types/project-snapshot.ts`
- `AlembicPlugin/lib/types/project-snapshot-builder.ts`
- `AlembicPlugin/lib/types/snapshot-views.ts`

第三批删除条件：

- 外层所有 `ProjectSnapshot` 消费方已切到 Core `ProjectDiscovery` / `ProjectAstSummary` / `ProjectGraph` 或明确的外层 view adapter。
- `snapshot-views.ts` 中依赖 workflow planning 的外层特有 view 已迁成 adapter，不再复制基础 snapshot 类型。

暂缓删除候选：

- `Alembic/lib/core/AstAnalyzer.ts`
- `AlembicPlugin/lib/core/AstAnalyzer.ts`
- `Alembic/lib/core/ast/**`
- `AlembicPlugin/lib/core/ast/**`
- `Alembic/lib/core/discovery/CustomConfigDiscoverer.ts`
- `AlembicPlugin/lib/core/discovery/CustomConfigDiscoverer.ts`
- `Alembic/lib/core/discovery/parsers/**`
- `AlembicPlugin/lib/core/discovery/parsers/**`

说明：

- `AstAnalyzer.ts` 和 `lib/core/ast/**` 绑定 tree-sitter grammar、walker 插件和资源加载。在 `createSyntaxParserRegistry` adapter 完成前不要删除。
- `CustomConfigDiscoverer.ts` 与 `parsers/**` 解析多种构建 DSL，可在 Core 后续小阶段继续迁；当前 Core 已提供 marker/target/file discovery 主路径。

保留候选：

- 外层 grammar copy/release 脚本。
- grammar 二进制资源与 postbuild 复制逻辑。
- Dashboard graph visualization。
- CLI/Codex handler 的输出格式、权限检查、错误文案。

替换检查：

- `rg "LanguageService|LanguageProfiles" Alembic/lib AlembicPlugin/lib`
- `rg "ProjectDiscoverer|DiscovererRegistry|GenericDiscoverer|NodeDiscoverer|SpmDiscoverer|PythonDiscoverer|JvmDiscoverer|GoDiscoverer|RustDiscoverer|DartDiscoverer" Alembic/lib AlembicPlugin/lib`
- `rg "SymbolTableBuilder|CallGraphAnalyzer|ImportPathResolver|CallEdgeResolver|DataFlowInferrer" Alembic/lib AlembicPlugin/lib`
- `rg "discoverProject|analyzeSymbols|buildProjectGraph|createSyntaxParserRegistry" Alembic/lib AlembicPlugin/lib`
- `rg "project-snapshot|ProjectSnapshot|buildProjectSnapshot|toSessionCache|toResponseData" Alembic/lib AlembicPlugin/lib`

执行步骤：

1. 先建立外层 discovery/analysis adapter，保持旧 command/API/Codex handler 调用面兼容。
2. 将项目检测、target/file 收集、语言画像切到 Core `discoverProject`。
3. 将基础符号表、调用图和项目图切到 Core `analyzeSymbols` / `buildProjectGraph`。
4. tree-sitter 旧实现接入 `createSyntaxParserRegistry`，或作为临时 adapter 保留。
5. 第一批删除 discovery/language 重复实现。
6. 第二批删除 analysis 重复实现。
7. 第三批等 snapshot consumers 切换后删除类型副本。
8. 删除后运行外层建议验证。
9. 回填 `Alembic` / `AlembicPlugin` 接入提交、删除提交、验证结果和遗留问题。

删除禁止项：

- 不要删除 grammar 二进制、grammar copy/release/postbuild 脚本。
- 不要删除 Dashboard 可视化和 handler 输出格式。
- 不要删除 AI/provider/Agent/prompt 逻辑。
- 不要删除 Search/Vector 和 Guard 逻辑；它们属于 Phase 8/9。

## 阶段 8：Search/Vector Storage

目标：

把 search ranking、knowledge graph 查询、vector record storage、index read/write、无 embedding 降级策略迁入 Core。

迁移输入：

- `lib/service/search/**`
- `lib/service/vector/**`
- `lib/infrastructure/vector/**`
- `lib/repository/search/**`
- `lib/types/search-wire.ts`

Core 输出：

- `src/search/**`
- `src/vector/**`
- `searchKnowledge(query, options)`
- `rebuildSearchIndex(options)`
- `FieldWeightedScorer`、`BM25Scorer`、`CoarseRanker`、`MultiSignalRanker`
- `HybridRetriever`
- `queryKnowledgeGraph`
- `JsonVectorStore`
- `SqliteVectorStore`
- `chunkText` / `estimateTokens`
- SQLite migration `010_vector_index_records`

当前执行记录：

- Core commit：`0fa0e7c Add search and vector core`
- 已迁入确定性能力：
  - 中英文/CJK mixed tokenizer。
  - field weighted sparse scorer。
  - BM25 scorer。
  - reciprocal-rank-fusion hybrid retriever。
  - coarse ranker 和 multi-signal ranker。
  - search result normalize/slim/groupByKind。
  - knowledge graph 只读查询（entries/edges 或 SQLite `knowledge_edges`）。
  - vector JSON store。
  - vector SQLite store。
  - vector chunker 和 token 估算。
  - no-query-vector fallback：传入 vector store 但没有 query vector 时，Core 自动走 sparse search 并返回 `fallback: "no-query-vector"`。
- 明确未迁入：
  - embedding 生成。
  - CrossEncoder reranker。
  - AI provider/model 调用。
  - SignalBus realtime boost。
  - Codex MCP schema / CLI table output / Dashboard search UI。

外层接入任务（其他窗口执行）：

1. 更新两个外层仓库的 `vendor/AlembicCore` submodule 指针到 `0fa0e7c`，执行 `npm install` 或对应 lockfile 刷新。
2. 将 CLI search 和 Codex search 的底层实现切到：
   - `searchKnowledge(query, { database })`
   - 或 `searchKnowledge(query, { repository })`
   - 或测试场景下 `searchKnowledge(query, { entries })`
3. 外层仍负责：
   - CLI 参数解析。
   - Codex tool schema。
   - 输出格式、table rendering、MCP response formatter。
   - Dashboard search page。
4. embedding 生成继续留在外层：
   - 外层生成 `queryVector` 后传入 `searchKnowledge(query, { queryVector, vectorStore })`。
   - 外层生成 document embedding 后传入 `rebuildSearchIndex({ vectorRecords, writableVectorStore })`。
   - Core 不读取 provider 配置，不调用模型，不保存模型 API key。
5. 若外层已有 HNSW/native index，可以先保留为外层 adapter；只要暴露 `searchVector(queryVector, options)` 就能接入 Core hybrid retriever。
6. `SearchRepoAdapter` 先改为薄 adapter，委托 Core 的 repository/database 输入；确认 CLI/Codex 都能跑通后再删除旧 adapter。

阶段验收：

- Core 已完成：
  - `npm run build:check`
  - `npm run build`
  - smoke：sparse search top result 为 `swift-net`。
  - smoke：hybrid search top result 为 `swift-net`。
  - smoke：`JsonVectorStore` upsert/search 可用。
  - smoke：`SqliteVectorStore` upsert/search/stats 可用。
  - smoke：`rebuildSearchIndex` 能写入预生成 vector record。
  - smoke：`queryKnowledgeGraph` 能返回 2 个节点和 1 条 `supports` 边。
  - smoke：no-query-vector fallback 返回 `mode: "sparse"`、`fallback: "no-query-vector"`。
- 外层待完成：
  - `Alembic` CLI search 使用同一 fixture 排序一致。
  - `AlembicPlugin` Codex search 使用同一 fixture 排序一致。
  - 两边无 embedding 数据时仍可完成 sparse search。

删除计划模板：

第一批删除候选（完成外层接入后删除，两边都检查）：

- `lib/service/search/tokenizer.ts`
- `lib/service/search/FieldWeightedScorer.ts`
- `lib/service/search/BM25Scorer.ts`
- `lib/service/search/CoarseRanker.ts`
- `lib/service/search/HybridRetriever.ts`
- `lib/service/search/SearchTypes.ts`
- `lib/service/search/contextBoost.ts`
- `lib/repository/search/SearchRepoAdapter.ts`
- `lib/types/search-wire.ts`

第二批删除候选（vector store 接入完成后删除，两边都检查）：

- `lib/infrastructure/vector/VectorStore.ts`
- `lib/infrastructure/vector/JsonVectorAdapter.ts`
- `lib/infrastructure/vector/Chunker.ts`
- `lib/service/vector/VectorService.ts` 中只做 deterministic record/index orchestration 的部分。
- `lib/service/vector/SyncCoordinator.ts` 中只做 deterministic sync state 的部分。

暂时保留候选：

- `lib/service/search/CrossEncoderReranker.ts`：AI rerank，不进入 Core。
- `lib/infrastructure/vector/BatchEmbedder.ts`：embedding 生成，不进入 Core。
- `lib/infrastructure/vector/HnswIndex.ts`
- `lib/infrastructure/vector/HnswVectorAdapter.ts`
- `lib/infrastructure/vector/BinaryPersistence.ts`
- `lib/infrastructure/vector/ScalarQuantizer.ts`
- `lib/infrastructure/vector/AsyncPersistence.ts`
- `lib/infrastructure/vector/VectorMigration.ts`
- `lib/infrastructure/vector/ASTChunker.ts`：parser adapter/AST chunk 策略尚未收口。
- CLI table output、Codex response formatter、Dashboard search page。

删除前检查命令：

- `rg "FieldWeightedScorer|BM25Scorer|CoarseRanker|HybridRetriever|SearchTypes|search-wire" lib`
- `rg "VectorStore|JsonVectorAdapter|Chunker|VectorService|SyncCoordinator" lib`
- `rg "CrossEncoderReranker|BatchEmbedder|HnswVectorAdapter" lib`

删除约束：

- 先改 import 到 `@alembic/core`，再删旧文件。
- 删除时不要碰 embedding provider、CrossEncoder、Codex MCP schema、CLI formatter。
- 若 HNSW 仍作为性能索引使用，只改成 Core `SearchVectorStore` adapter，不要在 Phase 8 强删。

## 阶段 9：Guard Engine

目标：

把 Guard 检查引擎、规则模型、SourceFileCollector、报告模型、违规存储迁入 Core。

迁移输入：

- `lib/service/guard/**`
- `lib/repository/guard/**`
- `lib/types/guard.d.ts`
- `lib/shared/diff-parser.ts`
- `lib/shared/content-hash.ts`

Core 输出：

- `src/guard/**`
- `checkGuard(runtime, target, options)`
- `createGuardReport`
- `GuardCheckEngine`
- `BUILT_IN_GUARD_RULES`
- `collectGuardSourceFiles` / `collectGuardSourceFilesWithContent`
- `runCodeLevelChecks`
- `runCrossFileChecks`
- `computeContentHash`
- `parseDiffHunks` / `tokenizeDiffLines`

当前执行记录：

- Core commit：`63ecf4f Add guard engine core`
- 已迁入确定性能力：
  - 多语言 built-in Guard regex rules。
  - `GuardCheckEngine.checkCode` / `auditFile` / `auditFiles`。
  - knowledge entry guard rule intake：从 `knowledgeEntries` 或 `database` 中读取 `constraints.guards[]`。
  - SourceFileCollector：项目内源文件收集和测试文件标记。
  - Code-level checks：ObjC、JS/TS、Go、Python、Swift、Java、Kotlin、Rust、Dart。
  - Cross-file checks：ObjC category、JS/TS circular import、Java/Kotlin duplicate class、Go multiple init、Swift extension conflict。
  - Compliance report 数据模型、quality gate、top violations、file hotspots。
  - Guard violation SQLite 持久化：复用 `createGuardViolationRepository`。
  - `content-hash` 和 `diff-parser`。
- 明确未迁入：
  - Codex MCP schema / tool policy。
  - CLI exit code 和终端格式化输出。
  - Dashboard report UI。
  - SignalBus realtime metrics。
  - RuleLearner/feedback loop 的交互式学习策略。
  - AST tree-sitter runtime；Core 保留 AST rule contract，外层 adapter 接好前 AST rule 会作为 uncertain result 记录。

外层接入任务（其他窗口执行）：

1. 更新两个外层仓库的 `vendor/AlembicCore` submodule 指针到 `63ecf4f`，执行 `npm install` 或对应 lockfile 刷新。
2. `Alembic` CLI guard 改为调用：
   - `checkGuard(runtime, { type: "file", filePath }, { database, persistViolations })`
   - 或项目扫描：`checkGuard(runtime, { type: "project", maxFiles }, { database, persistViolations })`
3. `AlembicPlugin` Codex guard tool 改为调用同一 Core API；MCP schema、权限策略、返回字段裁剪仍留插件仓库。
4. 外层如果已有 Enhancement Pack guard rules，把它们转换成 `GuardRule[]` 后通过 `checkGuard(..., { rules })` 注入。
5. 外层 AST/tree-sitter 检查暂时保留，直到提供 Core AST rule adapter；接入完成前不要删除 `AstAnalyzer`/AST guard 相关实现。
6. 外层保留 report formatter：
   - CLI text/markdown/json 输出。
   - Codex tool response formatter。
   - Dashboard report UI。

阶段验收：

- Core 已完成：
  - `npm run build:check`
  - `npm run build`
  - smoke：inline TypeScript guard 返回 1 error + 2 warnings。
  - smoke：JS/TS cross-file circular import 返回 1 条跨文件违规。
  - smoke：Swift guard violation 可写入 SQLite `guard_violations`。
  - smoke：`computeContentHash` 返回 16 位 SHA256 前缀。
  - smoke：`parseDiffHunks` + `tokenizeDiffLines` 可提取 diff tokens。
  - smoke：`collectGuardSourceFilesWithContent` 可收集 Core 源文件。
- 外层待完成：
  - `Alembic` `alembic guard` smoke。
  - `AlembicPlugin` Codex `alembic_guard` smoke。
  - 同一 fixture 在 CLI/Codex 下 violation ruleId/line/severity 一致。

删除计划模板：

第一批删除候选（完成外层接入后，两边都检查）：

- `lib/service/guard/GuardPatternUtils.ts`
- `lib/service/guard/GuardCodeChecks.ts`
- `lib/service/guard/GuardCrossFileChecks.ts`
- `lib/service/guard/SourceFileCollector.ts`
- `lib/service/guard/GuardCheckEngine.ts` 中 regex/code/cross-file 的 deterministic 部分。
- `lib/service/guard/ComplianceReporter.ts` 中 summary/top violations/file hotspots/quality gate 的数据层部分。
- `lib/shared/content-hash.ts`
- `lib/shared/diff-parser.ts`
- `lib/types/guard.d.ts`

第二批删除候选（确认 repository 接入后）：

- `lib/repository/guard/GuardViolationRepository.ts`
- `lib/service/guard/ViolationsStore.ts` 中仅保存 guard run history 的部分。

暂时保留候选：

- `lib/service/guard/GuardService.ts` 中规则生命周期管理、audit log、用户动作上下文。
- `lib/service/guard/ComplianceReporter.ts` 中 CLI/markdown/text formatter。
- `lib/service/guard/RuleLearner.ts`
- `lib/service/guard/GuardFeedbackLoop.ts`
- `lib/service/guard/UncertaintyCollector.ts` 中 SignalBus/学习闭环部分。
- `lib/service/guard/CoverageAnalyzer.ts`
- `lib/service/guard/ExclusionManager.ts`，直到排除项配置契约进入 Core 或改为 options 注入。
- `lib/service/guard/ReverseGuard.ts`
- AST/tree-sitter 相关实现和外层 `AstAnalyzer`。
- Codex MCP schema、tool policy、Dashboard report UI、CLI exit code strategy。

删除前检查命令：

- `rg "GuardCheckEngine|GuardPatternUtils|GuardCodeChecks|GuardCrossFileChecks|SourceFileCollector" lib`
- `rg "ComplianceReporter|ViolationsStore|GuardViolationRepository" lib`
- `rg "content-hash|diff-parser|guard\\.d" lib`
- `rg "AstAnalyzer|tree-sitter|RuleLearner|GuardFeedbackLoop|ExclusionManager|CoverageAnalyzer" lib`

删除约束：

- 先切 import 到 `@alembic/core`，再删旧文件。
- 不要删除 Codex MCP schema、CLI formatter、Dashboard UI。
- 不要在 AST adapter 未接入 Core 前删除外层 AST 检查链路。

## 阶段 10：Jobs/Events

目标：

把 job store、recoverable task state、event bus、signal trace 的确定性部分迁入 Core。

迁移输入：

- `lib/daemon/JobStore.ts`
- `lib/daemon/DaemonJobRunner.ts` 中不涉及进程 supervisor 的部分。
- `lib/infrastructure/event/EventBus.ts`
- `lib/infrastructure/signal/**`
- `lib/service/task/**`

Core 输出：

- `src/jobs/**`
- `src/events/**`
- `createJobStore`
- `recoverJob`
- `appendJobEvent`
- `EventBus`
- `SignalBus`
- `SignalBridge`
- `SignalTraceStore`
- SQLite migration `011_jobs_events_signals`

当前执行记录：

- Core commit：`3bf551c Add jobs and events core`
- 已迁入确定性能力：
  - SQLite-first `JobStore`。
  - job status transition guard：queued/running/completed/failed/cancelled。
  - job event append/list，带 per-job sequence。
  - `recoverJob`：返回 job、events、`canResume`、`nextAction` 和 reason。
  - active job interruption：daemon 重启时可批量把 queued/running 标记为 failed。
  - `EventBus`：进程内 emit/emitAsync、history、stats。
  - `SignalBus`：同步信号分发、pattern subscription、通配符订阅。
  - `SignalBridge`：SignalBus 到 EventBus 的确定性桥接。
  - `SignalTraceStore`：SQLite 信号留痕、query、stats、aggregate。
  - SQLite `core_jobs`、`core_job_events`、`signal_trace` schema。
- 明确未迁入：
  - DaemonSupervisor、PID、端口、Dashboard URL。
  - daemon workflow 执行器中的实际 bootstrap/rescan handler 调度。
  - Codex job MCP wrapper、tool schema、返回文案。
  - timerRegistry 驱动的周期 SignalAggregator；Core 先提供 trace/aggregate 的同步查询能力。

外层接入任务（其他窗口执行）：

1. 更新两个外层仓库的 `vendor/AlembicCore` submodule 指针到 `3bf551c`，执行 `npm install` 或对应 lockfile 刷新。
2. 把外层 `JobStore` 调用替换为：
   - `createJobStore(database, { projectRoot, dataRoot, projectId })`
   - `store.create(...)`
   - `store.markRunning(id)`
   - `store.complete(id, result)`
   - `store.fail(id, error)`
   - `store.cancel(id, reason)`
   - `recoverJob(store, id)`
3. `Alembic` daemon supervisor 继续留外层：
   - 进程启动/停止。
   - PID 文件。
   - 端口选择。
   - Dashboard URL 管理。
   - queueMicrotask/后台执行策略。
4. `AlembicPlugin` job MCP wrapper 继续留外层：
   - tool schema。
   - 权限策略。
   - Codex response formatter。
   - job 查询/取消命令包装。
5. `DaemonJobRunner` 中不涉及 workflow import/handler 调度的状态更新，改用 Core `JobStore`；实际 `bootstrapKnowledge` / `rescanInternal` 调用继续留外层。
6. `EventBus` / `SignalBus` / `SignalBridge` 可以直接从 `@alembic/core` 导入。
7. `SignalTraceWriter` 先改为薄 adapter 或直接替换为 `SignalTraceStore`；若外层仍需要 JSONL 文件留痕，可保留文件 writer，但不要再复制 SignalBus 逻辑。

阶段验收：

- Core 已完成：
  - `npm run build:check`
  - `npm run build`
  - smoke：job create/markRunning/complete。
  - smoke：job event append/list。
  - smoke：`recoverJob` 对 running job 返回 `nextAction: "resume"`。
  - smoke：terminal job 返回 `nextAction: "inspect"`。
  - smoke：active job interrupted。
  - smoke：EventBus emit/emitAsync/history/stats。
  - smoke：SignalBus + SignalBridge。
  - smoke：SignalTraceStore append/query/aggregate。
- 外层待完成：
  - `Alembic` daemon job 恢复 smoke。
  - `AlembicPlugin` Codex job 查询/恢复 smoke。
  - daemon 重启后 queued/running job 状态行为一致。

删除计划模板：

第一批删除候选（完成外层接入后，两边都检查）：

- `lib/daemon/JobStore.ts`
- `lib/infrastructure/event/EventBus.ts`
- `lib/infrastructure/signal/SignalBus.ts`
- `lib/infrastructure/signal/SignalBridge.ts`
- `lib/infrastructure/signal/SignalTraceWriter.ts` 中 SignalBus 订阅与 query/stats 的重复逻辑。

第二批删除候选（确认 workflow runner 接入后）：

- `lib/daemon/DaemonJobRunner.ts` 中 job 状态转换、cancel/interrupted/recovery 的重复逻辑。
- `lib/service/task/**` 中只做可恢复任务状态记录、事件 append、状态查询的部分。
- `lib/workflows/**` 中仅负责 job/event contract 的重复类型。

暂时保留候选：

- `lib/daemon/DaemonSupervisor.ts`
- `lib/daemon/DaemonState.ts`
- PID/port/dashboard URL 管理。
- queue/后台执行策略。
- Codex job MCP handler/tool schema/response formatter。
- `DaemonJobRunner.ts` 中实际调用外层 workflow handler 的部分。
- `SignalAggregator.ts` 中依赖 timerRegistry/report store 的周期任务；可后续改为调用 Core aggregate 查询。
- JSONL signal writer（如果外层仍需要文件审计格式）。

删除前检查命令：

- `rg "JobStore|DaemonJobRecord|DaemonJobStatus|recoverJob|appendJobEvent" lib`
- `rg "EventBus|SignalBus|SignalBridge|SignalTraceWriter|SignalAggregator" lib`
- `rg "core_jobs|core_job_events|signal_trace|job_events" lib`
- `rg "DaemonSupervisor|DaemonState|dashboardUrl|pid|port" lib`

删除约束：

- 先切 import 到 `@alembic/core`，再删旧文件。
- 不要删除 DaemonSupervisor、PID/port/dashboard URL 管理。
- 不要删除 Codex job tool handler。
- 不要把外层 workflow handler import 搬进 Core。

## 阶段 11：Context Payload

状态：已完成。

Core commit：

- `389e8b8 Add context payload core`

目标：

把知识压缩、context payload、topic classify、budget/crop 算法中不依赖具体模型的部分迁入 Core。

迁移输入：

- `lib/service/delivery/KnowledgeCompressor.ts`
- `lib/service/delivery/TokenBudget.ts` 中不绑定 provider 的部分。
- `lib/service/delivery/TopicClassifier.ts`
- `lib/injection/**` 中不依赖宿主配置写入的部分。

Core 输出：

- `src/context/**`
- `buildContextPayload`
- `compressKnowledgeForContext`
- `estimateContextBudget`

已落地内容：

- `src/context/types.ts`：宿主无关的 context entry、compressed pattern、fact line、budget、payload summary contract。
- `src/context/entry-utils.ts`：知识条目归一化、生命周期过滤、mock 过滤、kind 推断、确定性排序。
- `src/context/knowledge-compressor.ts`：rule line、When/Do/Don't pattern、fact line 压缩和 markdown block 格式化。
- `src/context/topic-classifier.ts`：按 `topicHint` 分组，保留 networking/ui/data/architecture/conventions/general 的 deterministic topic 描述。
- `src/context/token-budget.ts`：`DEFAULT_CONTEXT_BUDGET`、`estimateContextBudget`、`estimateContextTokens`、`truncateToTokenBudget`。
- `src/context/payload.ts`：`buildContextPayload`、`renderContextPayloadMarkdown`，支持 Channel A/B 预算、可选 total budget 裁剪。
- `src/index.ts` 已导出 `src/context/index.ts`。

边界确认：

- Core 只生成 host-neutral payload，不写入 AGENTS.md、Codex Skill、Cursor rules、VS Code 配置或 Dashboard/CLI 展示文件。
- Core 不包含 AI provider、prompt 执行、embedding 生成、Codex MCP schema 或 Agent runtime。
- 中文注释仅用于标明 Core/adapter 边界，不把外层策略写入 Core。

外层接入任务（其他窗口执行）：

- `Alembic`：
  - 将 `lib/service/delivery/KnowledgeCompressor.ts`、`TokenBudget.ts`、`TopicClassifier.ts` 的通用调用切到 `@alembic/core`。
  - `CursorDeliveryPipeline` 继续负责外层 delivery/write zone，只消费 `buildContextPayload` 或 `compressKnowledgeForContext` 的结果。
  - CLI/Dashboard context preview 继续在外层做展示格式，不反向依赖 Core 内部路径。
- `AlembicPlugin`：
  - Codex Skill 文案、MCP tool schema 和 Codex-specific injection 仍在插件。
  - 需要 context 注入时通过 `@alembic/core` public API 获取 payload，再由插件转成 Codex Skill/工具返回形态。
- 两个外层仓库：
  - 只能从 `@alembic/core` 根导入：`buildContextPayload`、`compressKnowledgeForContext`、`estimateContextBudget`、`TopicClassifier`、`KnowledgeCompressor`。
  - 不从 `@alembic/core/dist/context/*` 或 `src/context/*` 私有路径导入。

阶段验收：

- `AlembicCore`: `npm run build:check` 已通过。
- `AlembicCore`: `npm run build` 已通过。
- `AlembicCore`: dist smoke 已通过，覆盖 rule 压缩、重复 trigger 后缀、topic 分组、fact 输出、budget 估算。
- 外层待其他窗口完成：Codex context 注入 smoke。
- 外层待其他窗口完成：CLI/Dashboard context preview smoke。

删除计划模板：

预计删除候选：

- `Alembic/lib/service/delivery/KnowledgeCompressor.ts` 中已被 Core 覆盖的 rule/pattern/fact 压缩逻辑。
- `Alembic/lib/service/delivery/TokenBudget.ts` 中已被 Core 覆盖的 token 估算和 line budget 裁剪逻辑。
- `Alembic/lib/service/delivery/TopicClassifier.ts` 中已被 Core 覆盖的 deterministic topic 分组和 description 生成逻辑。
- `AlembicPlugin` 中若存在重复 compressor/budget/topic classify helper，也按 public API 切换后删除。

预计保留候选：

- Codex Skill generator。
- IDE 文件投递。
- CLI output formatter。
- CursorDeliveryPipeline、WriteZone、Cursor/VS Code rule 文件写入。
- Dashboard/CLI 的 context preview UI formatter。

## 阶段 12：Boundary Hardening

状态：已完成。

Core commit：

- `40424f2 Harden core public boundaries`

目标：

收束 Core exports、外层 adapter、lint boundary 和文档，确保三仓库边界稳定。

Core 输出：

- 明确 public exports。
- 禁止从外层反向依赖 Core 内部私有路径。
- README 更新。
- migration checklist 更新。

已落地内容：

- `README.md` 已更新为当前真实 Core 范围、root-only public API、Core/host adapter 依赖方向和验证命令。
- `MIGRATION_CHECKLIST.md` 已新增，明确迁移前判断、Core 实现规则、外层接入规则和删除窗口规则。
- `scripts/check-boundaries.mjs` 已新增，检查：
  - `package.json` 只暴露 `@alembic/core` 根入口。
  - `src/index.ts` 只从批准的 public aggregator 边界导出。
  - `dist/` 保持 ignored 且未被 git 跟踪。
- `package.json` 已新增：
  - `npm run boundary:check`
  - `npm run test:unit`
  - 发布文件包含 `MIGRATION_CHECKLIST.md`。

外层接入任务（其他窗口执行）：

- `Alembic` 与 `AlembicPlugin` 只通过 `@alembic/core` 根入口导入，不使用：
  - `@alembic/core/dist/*`
  - `@alembic/core/src/*`
  - 指向 submodule 内部文件的相对路径。
- 外层保留宿主 adapter：CLI、Dashboard、Codex MCP tool、Codex Skill、IDE delivery、product-specific formatter。
- 外层完成前 12 个阶段接入后，统一跑 build/smoke 并回填提交信息。
- 外层如需要新增 Core API，先在 Core 通过 domain `index.ts` 与根 `src/index.ts` 明确导出，再更新 `scripts/check-boundaries.mjs` 允许列表。

阶段验收：

- `AlembicCore`: `npm run build:check` 已通过。
- `AlembicCore`: `npm run build` 已通过。
- `AlembicCore`: `npm run boundary:check` 已通过。
- `AlembicCore`: `npm run test:unit` 已通过。
- `AlembicCore`: 根入口 smoke 已通过，确认 `buildContextPayload`、`checkGuard`、`searchKnowledge`、`createAlembicRuntime` 可从 `./dist/index.js` 导入。
- `dist/` 仍为 ignored，`git ls-files dist` 为空。
- 外层待其他窗口完成：`Alembic` build + CLI smoke。
- 外层待其他窗口完成：`AlembicPlugin` build + Codex plugin smoke。
- 外层待其他窗口完成：跨边界旧引用扫描。

删除计划模板：

预计删除候选：

- 外层迁移期间临时 compatibility re-export。
- 外层已经不再引用的重复核心实现。
- 指向 Core 内部路径的临时 import shim。
- 已被 `MIGRATION_CHECKLIST.md` 和 phase 文档替代的零散迁移备忘。

预计保留候选：

- 明确需要的宿主 adapter。
- test fixtures。
- release scripts。
- CLI/Dashboard/Codex/IDE 的宿主展示与投递逻辑。
- 外层 smoke 和 fixture，因为它们验证 adapter 消费 Core public API。

## 删除窗口执行规则

用户在其他窗口执行删除计划时建议遵守：

1. 先完成“外层接入任务”，再执行删除计划。
2. 只删除当前阶段列出的候选，不顺手删下一阶段内容。
3. 删除前先跑 `rg` 确认引用已经切到 Core。
4. 如果发现外层仍有业务逻辑依赖旧文件，先改 adapter，不直接删。
5. 删除后必须运行该阶段列出的外层验证命令。
6. 删除完成后回填外层接入提交、删除提交、验证结果和遗留问题。

## Codex 每阶段回填规则

Codex 迁移完每个阶段后，需要在本文对应阶段追加：

```markdown
### 阶段完成记录

完成日期：
Core commit：
Core 改动：
Core 验证：
外层接入任务：
外层建议验证：
删除计划状态：待用户执行
```

外层窗口完成后，在同一阶段追加：

```markdown
### 外层执行回填

执行日期：
Alembic commit：
AlembicPlugin commit：
外层验证：
删除提交：
遗留问题：
```

如果阶段只建立 contract、还未替代外层旧实现，删除计划必须明确写“无删除”，不能让其他窗口误删功能。
