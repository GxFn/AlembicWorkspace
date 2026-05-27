# Alembic 外层仓库迁移后重复内容审计与下一步计划

日期：2026-05-17

范围：

- `AlembicCore`：作为 Core 对照仓库，只读参考。
- `Alembic`：主仓库，扫描代码、脚本、资源和 package 配置。
- `AlembicPlugin`：Codex 插件仓库，扫描代码、脚本、资源和 package 配置。

本次只做扫描和计划，不修改两个外层仓库实现。

## 1. 当前快照

### 1.1 工作区状态

扫描开始时三个仓库 `git status --short` 均为空，说明本次审计建立在干净工作树上。

### 1.2 Core 指针状态

当前 Core 源仓库：

```text
AlembicCore HEAD = 8825777 docs: update agent instructions
```

两个外层仓库的 `vendor/AlembicCore` 当前都停在：

```text
vendor/AlembicCore HEAD = be15964 Lock Codex boundary outside core
```

这意味着外层仓库尚未包含 Core 后续两个提交：

```text
6358cc7 chore: expose core stage 14 entrypoints
8825777 docs: update agent instructions
```

结论：

- 两个外层仓库必须先更新 `vendor/AlembicCore` 指针，至少更新到 `6358cc7`，建议直接更新到 `8825777`。
- 如果不更新，外层不能依赖阶段 14 新增的 root entrypoint 契约。

## 2. 扫描方法

本次使用以下维度交叉扫描：

- 目录结构计数：`AlembicCore/src` 对比 `Alembic/lib`、`AlembicPlugin/lib`。
- 同相对路径哈希：`AlembicCore/src/<rel>` 对比外层 `lib/<rel>`。
- 外层之间同相对路径哈希：`Alembic/lib/<rel>` 对比 `AlembicPlugin/lib/<rel>`。
- `@alembic/core` import 热点统计。
- `vendor/AlembicCore/src` / `vendor/AlembicCore/dist` 直连引用扫描。
- 空目录扫描。
- `resources/grammars`、`injectable-skills` 资源哈希对比。
- package `files`、插件 runtime 打包脚本和验证脚本检查。

## 3. 外层对 Core 的重复残留

### 3.1 Alembic

同相对路径对比结果：

```text
samePathIdentical = 1
samePathDifferent = 1
```

明确残留：

| 文件 | 结论 | 下一步 |
| --- | --- | --- |
| `Alembic/lib/types/workflows.ts` | 与 `AlembicCore/src/types/workflows.ts` 完全一致 | 将剩余 `#types/workflows.js` import 切到 `@alembic/core/types/workflows` 后删除 |
| `Alembic/lib/daemon/DaemonState.ts` | 与 `AlembicCore/src/daemon/DaemonState.ts` 只存在 import 来源差异 | 当前主要调用方已经使用 `@alembic/core/daemon/DaemonState`，可作为删除候选 |

当前仍引用 `Alembic/lib/types/workflows.ts` 的位置包括：

- `Alembic/lib/external/mcp/handlers/types.ts`
- `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts`
- `Alembic/lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts`
- `Alembic/lib/workflows/capabilities/execution/internal-agent/*`
- `Alembic/test/unit/WorkflowResultPersistence.test.ts`

`DaemonState` 扫描显示 Alembic 的业务调用方已经大量使用 Core 入口：

- `Alembic/bin/daemon-server.ts`
- `Alembic/lib/daemon/DaemonSupervisor.ts`
- `Alembic/lib/http/routes/daemon.ts`
- `Alembic/test/unit/DaemonSupervisor.test.ts`

风险判断：

- `lib/types/workflows.ts` 是低风险删除候选，但要先切 import。
- `lib/daemon/DaemonState.ts` 是低风险删除候选，但要先确认没有 package exports、隐式 import 或旧测试仍依赖本地路径。

### 3.2 AlembicPlugin

同相对路径对比结果：

```text
samePathIdentical = 0
samePathDifferent = 0
```

这说明 AlembicPlugin 中 Core 同路径源码文件已经基本清干净。

但 AlembicPlugin 仍保留大量空目录，这些是迁移后清理候选：

```text
AlembicPlugin/lib/domain/dimension
AlembicPlugin/lib/domain/evolution
AlembicPlugin/lib/domain/knowledge/values
AlembicPlugin/lib/domain/snippet
AlembicPlugin/lib/infrastructure/database/drizzle
AlembicPlugin/lib/infrastructure/database/migrations
AlembicPlugin/lib/infrastructure/event
AlembicPlugin/lib/infrastructure/io
AlembicPlugin/lib/infrastructure/logging
AlembicPlugin/lib/infrastructure/report
AlembicPlugin/lib/infrastructure/signal
AlembicPlugin/lib/infrastructure/vector
AlembicPlugin/lib/repository/base
AlembicPlugin/lib/repository/bootstrap
AlembicPlugin/lib/repository/code
AlembicPlugin/lib/repository/evolution
AlembicPlugin/lib/repository/guard
AlembicPlugin/lib/repository/knowledge
AlembicPlugin/lib/repository/memory
AlembicPlugin/lib/repository/search
AlembicPlugin/lib/repository/session
AlembicPlugin/lib/repository/sourceref
AlembicPlugin/lib/repository/sync
AlembicPlugin/lib/repository/token
AlembicPlugin/lib/service/guard
AlembicPlugin/lib/shared/errors
AlembicPlugin/lib/shared/utils
AlembicPlugin/lib/workflows/capabilities/planning/dimensions
AlembicPlugin/lib/workflows/cold-start/external
AlembicPlugin/lib/workflows/cold-start/internal
AlembicPlugin/lib/workflows/knowledge-rescan/external
AlembicPlugin/lib/workflows/knowledge-rescan/internal
```

风险判断：

- 空目录可以作为第一批清理，不影响 TypeScript 编译。
- 删除后跑 `npm run build:check` 和 `npx vitest run test/unit/AgentModuleBoundaries.test.ts`。

## 4. 外层之间的重复内容

Alembic 与 AlembicPlugin 同相对路径源码对比：

```text
sameRelativeIdentical = 247
sameRelativeDifferent = 104
onlyAlembic = 58
onlyPlugin = 25
```

这是当前最大的重复区域，但它不是 Core 迁移遗漏的简单删除项。大量重复处在宿主边界：

- `lib/agent/**`
- `lib/tools/**`
- `lib/external/ai/**`
- `lib/external/mcp/**`
- `lib/http/**`
- `lib/injection/**`
- `lib/workflows/capabilities/execution/internal-agent/**`

关键判断：

- 这些能力不应迁入 Core。
- AlembicPlugin 仍有真实产品代码引用 `lib/agent/**`、`lib/tools/**`、`lib/external/ai/**`，不能整体删除。
- 如果要减少两外层仓库之间的长期重复，应另起“外层宿主运行时共享”议题，而不是继续塞进 Core。

AlembicPlugin 中证明 agent/tool 仍被使用的关键引用：

- `lib/external/mcp/handlers/rescan/InternalKnowledgeRescanWorkflow.ts` 使用 `#agent/runs/evolution/EvolutionAgentRun.js` 和 `#agent/service/AgentService.js`。
- `lib/http/routes/ai.ts` 使用 `#agent/service/index.js`、agent presets、agent task handlers。
- `lib/injection/modules/AgentModule.ts` 装配 `#agent` 和 `#tools`。
- `lib/workflows/capabilities/execution/internal-agent/**` 仍依赖 agent memory、session、runtime、prompt 和 service。
- `lib/tools/**` 被 MCP、HTTP、AgentRuntime、ToolForge 和 V2 tool tests 使用。
- `lib/external/ai/**` 被 AI route、AgentRuntime、AgentRouter、WikiGenerator、Vector/ContextualEnricher 和 LLM connectivity tests 使用。

因此，外层之间的重复清理需要先决定长期架构：

1. 保持两个外层独立复制宿主能力，但用边界测试防止 Core 回流。
2. 新建独立的外层宿主 runtime 仓库或包，承载 agent/tool/AI/MCP 共享宿主能力。
3. 选定一个外层仓库作为宿主 runtime 源，另一个只消费构建产物。

当前不建议在没有架构决策前删除 AlembicPlugin 的 `lib/agent/**` 或 `lib/tools/**`。

## 5. 资源重复与交付边界

### 5.1 Grammar WASM

`resources/grammars` 在三个仓库中完全一致：

```text
AlembicCore/resources/grammars
Alembic/resources/grammars
AlembicPlugin/resources/grammars
```

11 个 `tree-sitter-*.wasm` 文件哈希全部一致。

Core 当前已经包含：

- `AlembicCore/resources/grammars/*`
- `AlembicCore/src/core/ast/ensure-grammars.ts`
- Core `package.json.files = ["dist", "resources", "README.md"]`

结论：

- Grammar 资源已经适合由 Core 统一拥有。
- Alembic / AlembicPlugin 的 grammar 资源是重复残留，但不能直接删除，因为外层 package 和插件 runtime 脚本仍显式引用它们。

当前阻塞点：

- Alembic `package.json.files` 仍包含 `resources/grammars`。
- AlembicPlugin `package.json.files` 仍包含 `resources/grammars`。
- AlembicPlugin `scripts/prepare-codex-plugin-runtime.mjs` 执行 `copyTree('resources/grammars', 'resources/grammars')`。
- AlembicPlugin `scripts/verify-codex-plugin.mjs` 和 `scripts/smoke-codex-plugin.mjs` 仍检查 runtime 中的 `resources/grammars/tree-sitter-typescript.wasm`。
- AlembicPlugin `scripts/dev-watch-codex-plugin.mjs` 仍监听 `resources/grammars`。

下一步：

1. 先修改外层打包脚本，让 grammar 来源改为 Core：
   - 源码开发态可用 `vendor/AlembicCore/resources/grammars`。
   - 安装态可用 `node_modules/@alembic/core/resources/grammars`。
2. 修改 AlembicPlugin runtime prepare / verify / smoke 脚本，仍保证 runtime 包内最终带有 grammar 文件，但来源不再是插件仓库自己的 `resources/grammars`。
3. 修改 Alembic `package.json.files`，移除 `resources/grammars`，保留 `resources/native-ui/*` 和 `resources/openChrome.applescript`。
4. 修改 AlembicPlugin `package.json.files`，移除 `resources/grammars` 或改为由 prepare 脚本从 Core 注入 runtime。
5. 验证通过后删除外层重复 grammar 文件。

### 5.2 Injectable Skills

`injectable-skills` 在 Alembic 与 AlembicPlugin 中完全一致：

```text
alembic-create/SKILL.md
alembic-devdocs/SKILL.md
alembic-guard/SKILL.md
alembic-recipes/SKILL.md
alembic-structure/SKILL.md
```

判断：

- 这是交付资源重复，不属于 Core。
- Alembic 需要它用于 IDE/Cursor/本地注入。
- AlembicPlugin 需要它用于插件/runtime/channel 交付。
- 当前可以先保留，后续若要减少重复，应放入独立 delivery resource 方案，而不是迁入 Core。

### 5.3 插件交付资源

Alembic 主仓库已经没有：

```text
plugins/
channels/
.agents/
```

AlembicPlugin 仍拥有：

```text
.agents/plugins/marketplace.json
channels/codex/channel.json
plugins/alembic-codex/**
```

判断：

- 这是正确边界。
- 不应回迁到 Alembic。
- 不应迁入 Core。

### 5.4 主仓库 native / IDE 资源

Alembic 仍拥有：

```text
resources/native-ui/screenshot.swift
resources/openChrome.applescript
resources/vscode-ext/**
```

判断：

- 这些属于主仓库本地宿主能力。
- 不属于 Core。
- 不属于 AlembicPlugin。

## 6. Import 与边界扫描结论

### 6.1 Core import 热点

Alembic 热点：

```text
@alembic/core/infrastructure/logging/Logger          105
@alembic/core/shared/resolveProjectRoot             38
@alembic/core/infrastructure/io                     35
@alembic/core/infrastructure/signal/SignalBus        31
@alembic/core/service/guard/GuardCheckEngine         26
```

AlembicPlugin 热点：

```text
@alembic/core/infrastructure/logging/Logger          91
@alembic/core/shared/resolveProjectRoot             35
@alembic/core/infrastructure/signal/SignalBus        29
@alembic/core/infrastructure/io/WriteZone            25
@alembic/core/service/guard/GuardCheckEngine         24
```

结论：

- 两个外层已经大量使用 Core。
- 剩余工作重点不是“大规模迁移到 Core”，而是清理残留本地文件、资源来源和子仓库指针。

### 6.2 vendor/src 直连扫描

非 vendor 代码中仍出现 `vendor/AlembicCore/src` 的文件：

```text
Alembic/test/unit/AgentModuleBoundaries.test.ts
AlembicPlugin/test/unit/AgentModuleBoundaries.test.ts
```

这两个测试是边界测试，用于确认 Core 内 file-diff 文件存在、外层旧文件不存在。

判断：

- 作为测试断言可以临时接受。
- 长期更好改成检查 `@alembic/core` package exports，避免测试依赖 vendor 源码路径。

## 7. 已有边界保护

两个外层仓库都有：

```text
test/unit/AgentModuleBoundaries.test.ts
scripts/lint-repo-boundary.mjs
```

`AgentModuleBoundaries.test.ts` 已覆盖：

- 旧 agent compatibility entry 文件不得恢复。
- 旧 bootstrap pipeline/shared 模块不得恢复。
- workflow 层不得 import handler internals。
- file-diff 实现必须留在 Core workflow naming 下。
- `lib/workflows/capabilities/project-intelligence/FileDiffPlanner.ts` 和 `FileDiffSnapshotStore.ts` 不得回到外层。

`lint-repo-boundary.mjs` 在两个外层仓库内容一致，当前检查：

- `db.prepare()` / `getDb()` 只能在 `lib/repository/**`、`lib/infrastructure/database/**`、`test/**`。
- escape-hatch 必须标注 permanent / temporary。

建议：

- 后续清理每批完成后都运行这两个边界检查。
- 可以增加一条资源边界检查：外层不再直接维护 `resources/grammars`，只能从 Core 拷贝或通过 Core package 读取。

## 8. 下一步执行计划

### Phase A：同步 Core 指针

目标：两个外层仓库使用同一 Core 最新提交。

任务：

1. 在 Alembic 更新 `vendor/AlembicCore` 到 `8825777`。
2. 在 AlembicPlugin 更新 `vendor/AlembicCore` 到 `8825777`。
3. 两边执行：

```bash
npm run build:check
npx vitest run test/unit/AgentModuleBoundaries.test.ts
```

验收：

- 两边 `vendor/AlembicCore` 指针一致。
- 两边能看到 Core root entrypoint 阶段 14 修复。

### Phase B：清理 Alembic 中低风险 Core 残留

任务：

1. 将 Alembic 中剩余 `#types/workflows.js` import 切到 `@alembic/core/types/workflows`。
2. 删除 `Alembic/lib/types/workflows.ts`。
3. 确认 `Alembic/lib/daemon/DaemonState.ts` 没有本地调用方后删除。

建议验证：

```bash
npm run build:check
npx vitest run test/unit/DaemonSupervisor.test.ts test/unit/WorkflowResultPersistence.test.ts test/unit/AgentModuleBoundaries.test.ts
```

注意：

- 不要清理整个 `lib/types/**`，只处理 `workflows.ts`。
- 不要动 `lib/daemon/DaemonSupervisor.ts`，它是外层 daemon supervisor。

### Phase C：清理 AlembicPlugin 空目录

任务：

- 删除第 3.2 节列出的空目录。

建议验证：

```bash
npm run build:check
npx vitest run test/unit/AgentModuleBoundaries.test.ts
```

注意：

- 只删空目录。
- 不要删除 `lib/repository/audit/AuditRepository.ts`。
- 不要删除 `lib/service/evolution/git-diff-checkpoint/**`。
- 不要删除 `lib/codex/**`、`lib/agent/**`、`lib/tools/**`。

### Phase D：Grammar 资源归一到 Core

任务：

1. 修改 AlembicPlugin `scripts/prepare-codex-plugin-runtime.mjs`，从 Core 资源目录复制 grammar。
2. 修改 AlembicPlugin verify / smoke / watch 脚本，让它们验证 runtime 最终产物，而不是要求插件源码根目录自己持有 grammar。
3. 修改 Alembic 和 AlembicPlugin `package.json.files`，移除外层 `resources/grammars`。
4. 删除 Alembic 和 AlembicPlugin 中重复的 `resources/grammars/*`。

建议验证：

Alembic：

```bash
npm run build:check
npm run build
```

AlembicPlugin：

```bash
npm run build:check
npm run build
node scripts/verify-codex-plugin.mjs
node scripts/smoke-codex-plugin.mjs
```

注意：

- Alembic 的 `resources/native-ui/*`、`resources/openChrome.applescript`、`resources/vscode-ext/**` 必须保留。
- AlembicPlugin runtime 包内最终仍必须带 grammar，否则离线 AST 能力会断。

### Phase E：外层之间重复宿主能力治理

目标：处理 247 个 Alembic / AlembicPlugin 完全相同源码文件的长期维护问题。

不立即删除，先做架构决策：

1. 若两个外层都需要完整宿主能力：保留重复，但增加同步检查和边界文档。
2. 若希望减少维护成本：新建独立宿主 runtime 包，承载 `agent`、`tools`、`external/ai`、部分 `external/mcp`、internal-agent workflow。
3. 若插件最终只依赖 Codex 宿主 Agent：为 AlembicPlugin 制定单独瘦身计划，逐步删除 internal agent / AI provider / HTTP AI route，而不是一次性删。

建议先输出一份“外层宿主能力归属决策文档”，再开始动代码。

必须保留原则：

- agent/tool/AI/provider/MCP/Codex delivery 不进入 Core。
- 插件交付资源不进入 Core。
- 主仓库 native/IDE 资源不进入 Core。

## 9. 建议批次顺序

推荐按以下顺序推进：

1. Phase A：同步 Core 指针。
2. Phase B：清理 Alembic 的 `types/workflows.ts` 和本地 `DaemonState.ts`。
3. Phase C：清理 AlembicPlugin 空目录。
4. Phase D：Grammar 资源归一到 Core。
5. Phase E：外层宿主能力重复治理决策。

不要先做 Phase E。当前最大重复虽然在外层宿主层，但它也是最容易误删功能的区域。

## 10. 本次未执行项

本次没有运行构建或测试，因为任务目标是深度扫描并生成计划文档。

下一窗口执行具体清理时，必须在对应阶段运行文中列出的验证命令，并把结果补充到后续报告。
