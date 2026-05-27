# AlembicCore 阶段 3 完成记录

日期：2026-05-16
范围：Core 仓库内的 domain 模型完整迁移
状态：Core 内部迁移完成；外层接入与删除由其他窗口按本文执行
Core 提交：`a89a597 Migrate domain model core`

## 1. 本阶段目标

把 Alembic / AlembicPlugin 共同依赖的领域模型完整迁入 `@alembic/core`，包括 KnowledgeEntry、Lifecycle、FieldSpec、StyleGuide、Dimension、Evolution、Snippet 和知识传输合约。

本阶段仍然遵守“完整复制迁移，不做删减优化”：

- 以 `Alembic/lib/domain/**` 为主源完整复制。
- 对照 `AlembicPlugin/lib/domain/**` 的宿主无关命名差异。
- 只做必要的 import 修正、包导出、兼容别名和 lint 修正。
- 不迁移 Alembic internal agent runtime。
- 不迁移 `lib/tools/**` tool system。
- 不迁移 Codex MCP / Plugin runtime / delivery pipeline。

## 2. 已迁入 Core 的文件

Domain：

- `src/domain/index.ts`
- `src/domain/knowledge/**`
- `src/domain/knowledge/values/**`
- `src/domain/dimension/**`
- `src/domain/evolution/**`
- `src/domain/snippet/Snippet.ts`

Types：

- `src/types/knowledge-wire.ts`
- `src/types/index.ts`

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

依赖：

- `uuid` 进入 `@alembic/core`，因为 `KnowledgeEntry` 原实现直接使用 `uuidv4()` 生成实体 ID。

## 3. 关键边界决策

### 3.1 采用宿主无关的 adapter 命名

`FieldSpec.ts` 和 `StyleGuide.ts` 采用 AlembicPlugin 中更通用的宿主无关命名：

- `getAgentAdapterFieldSpec()`
- 插件适配字段
- 宿主侧规则/提示/上下文摘要

为兼容 Alembic 旧调用，Core 仍导出：

```ts
export const getCursorDeliverySpec = getAgentAdapterFieldSpec;
```

这个别名只保证迁移期调用不破坏，不表示 Core 拥有 Cursor delivery。Cursor/Codex/IDE 的解释、写入和交付仍属于外层 adapter。

### 3.2 保留数据字段，不引入 AI 能力

`KnowledgeEntry` 和 `KnowledgeEntryWire` 保留原有字段名：

- `agentNotes`
- `aiInsight`

这些是历史数据合约字段。Core 只保存、序列化、校验这些字段，不实现 AI provider、agent runtime、prompt 调度或 tool 执行。

### 3.3 Dimension SOP 属于闭环协议，不是工具实现

`DimensionSop.ts` 中存在 `tools` 字段和 `code({ action: "read" })` 等文本。这些是给宿主 agent 的挖掘任务说明，属于 host-agent mining loop 的协议文本。

Core 迁入这些协议文本是必要的，因为 Core 需要组织完整知识挖掘闭环；但 Core 不执行这些工具，也不拥有 Alembic 的 `lib/tools/**`。

### 3.4 `KnowledgeEntryWire` 进入 Core

`KnowledgeEntry.toJSON()` 依赖 `KnowledgeEntryWire`。这是领域实体与 API/Dashboard/外层 adapter 之间的传输合约，不是 UI 或 delivery 实现，因此进入 Core 的 `src/types/knowledge-wire.ts`。

外层引用时应使用 type-only import：

```ts
import type { KnowledgeEntryWire } from '@alembic/core/types/knowledge-wire';
```

## 4. 已迁移测试

从 Alembic 迁入并修正 import：

- `test/KnowledgeEntry.test.ts`
- `test/Lifecycle.test.ts`
- `test/EvolutionPolicy.test.ts`
- `test/RecipeDimension.test.ts`
- `test/DomainLifecycle.test.ts`

补充包级 smoke：

- `test/core-package.test.ts` 验证 domain entrypoints 和 `getCursorDeliverySpec` 兼容别名。

测试覆盖：

- KnowledgeEntry 构造、默认值、生命周期动作、序列化。
- Lifecycle 六态状态机与兼容转换。
- Dimension 归属解析、legacy tag、agentNotes 维度回推。
- EvolutionPolicy 风险、观察窗口、过期判断、相关性分类。
- FieldSpec 兼容别名。

## 5. 验证结果

在 `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` 执行：

```bash
npm run build:check
npm run test
npm run lint
npm run build
node --input-type=module -e "const domain=await import('@alembic/core/domain'); const knowledge=await import('@alembic/core/domain/knowledge'); const dim=await import('@alembic/core/domain/dimension'); const entry=await import('@alembic/core/domain/knowledge/KnowledgeEntry'); const wire=await import('@alembic/core/types/knowledge-wire'); console.log(JSON.stringify({domain:!!domain.KnowledgeEntry, knowledge:!!knowledge.Lifecycle, dimension:!!dim.resolveRecipeDimensionId, entry:!!entry.KnowledgeEntry, wire:Object.keys(wire).length}, null, 2));"
```

结果：

- TypeScript build check 通过。
- Vitest 13 个测试文件通过。
- Vitest 235 个测试通过。
- Biome lint 通过。
- 实际构建通过。
- `@alembic/core/domain`、`@alembic/core/domain/knowledge`、`@alembic/core/domain/dimension`、`@alembic/core/domain/knowledge/KnowledgeEntry` self-reference import 通过。
- `@alembic/core/types/knowledge-wire` 是 type-only 合约，运行时 import 为空对象属于预期。

## 6. 外层仓库接入任务

以下任务由其他窗口执行；本窗口不直接修改 Alembic / AlembicPlugin。

### 6.1 接入前置条件

阶段 3 外层接入前必须确认：

- 阶段 1 纯 shared import 已全量收敛到 `@alembic/core/shared/...`。
- 阶段 2 workspace/path/config/io 已按文档接入，或至少不会阻塞本阶段 import 扫描。
- `vendor/AlembicCore` 更新到 `a89a597` 或更新提交。

### 6.2 Alembic 接入

把本地 domain import 切到 Core：

- `#domain/knowledge/KnowledgeEntry.js` → `@alembic/core/domain/knowledge/KnowledgeEntry`
- `#domain/knowledge/Lifecycle.js` → `@alembic/core/domain/knowledge/Lifecycle`
- `#domain/knowledge/values/*` → `@alembic/core/domain/knowledge/values/*`
- `#domain/dimension/*` → `@alembic/core/domain/dimension/*`
- `#domain/evolution/*` → `@alembic/core/domain/evolution/*`
- `#domain/snippet/Snippet.js` → `@alembic/core/domain/snippet/Snippet`
- `#types/knowledge-wire.js` → `@alembic/core/types/knowledge-wire`

如果 Alembic 仍调用 `getCursorDeliverySpec()`，可以先直接从 Core 引用该兼容别名。后续 delivery 阶段再把 Cursor 交付语义留在 Alembic adapter 中解释，不要把 Cursor delivery 加回 Core。

建议扫描：

```bash
rg -n "from ['\"](#domain|\\.\\.?/.*lib/domain)" lib bin test
rg -n "from ['\"](#types/knowledge-wire|\\.\\.?/.*types/knowledge-wire)" lib bin test
```

建议验证：

```bash
npm run build:check
npm run test -- KnowledgeEntry Lifecycle RecipeDimension EvolutionPolicy DomainLifecycle
```

实际 test 命令按 Alembic 仓库脚本调整；重点是必须覆盖 domain 原测试。

### 6.3 AlembicPlugin 接入

Plugin 同样把本地 domain import 切到 Core：

- `lib/domain/knowledge/**` → `@alembic/core/domain/knowledge/**`
- `lib/domain/dimension/**` → `@alembic/core/domain/dimension/**`
- `lib/domain/evolution/**` → `@alembic/core/domain/evolution/**`
- `lib/domain/snippet/**` → `@alembic/core/domain/snippet/**`
- `lib/types/knowledge-wire.ts` → `@alembic/core/types/knowledge-wire`

Plugin 应优先使用宿主无关命名 `getAgentAdapterFieldSpec()`。Codex MCP、Codex runtime、tool metadata、preflight、plugin/channel 发布逻辑继续留在 Plugin。

建议扫描：

```bash
rg -n "from ['\"](#domain|\\.\\.?/.*lib/domain)" lib bin test
rg -n "from ['\"](#types/knowledge-wire|\\.\\.?/.*types/knowledge-wire)" lib bin test
```

建议验证：

```bash
npm run build:check
npm run test -- KnowledgeEntry Lifecycle RecipeDimension EvolutionPolicy DomainLifecycle
```

实际 test 命令按 Plugin 仓库脚本调整；同时保留 Codex 专属测试，确认 Plugin 外层行为未被 Core 迁移破坏。

## 7. 外层删除计划

只有在两个外层仓库完成接入并通过测试后，才删除重复文件。

可删除候选：

- `lib/domain/**`
- `lib/types/knowledge-wire.ts`

删除前必须确认：

- `rg` 扫描没有本地 `#domain`、`../../lib/domain`、`#types/knowledge-wire` 引用。
- domain 原测试已经指向 Core 并通过。
- repository/service/workflow 仍能正常构造 `KnowledgeEntry`、解析 `Lifecycle`、读取 `Dimension` 和 `EvolutionPolicy`。
- Alembic 的 Cursor delivery 测试仍通过。
- Plugin 的 Codex MCP / runtime / preflight / tool policy 测试仍通过。

明确不删除：

- `lib/repository/**`
- `lib/service/**`
- `lib/workflows/**`
- `lib/agent/**`
- `lib/tools/**`
- `lib/codex/**`
- delivery、MCP、CLI、Dashboard、plugin/channel adapter

这些属于后续阶段或外层能力，不要因为 domain 接入一起删除。

## 8. 下一阶段

下一阶段进入 SQLite / repository / 文件存储迁移。

阶段 4 必须迁移 SQLite、Drizzle schema、migrations、knowledge/search/sourceRef/bootstrap/guard/evolution/session/memory/token/sync repositories，并保留 Ghost mode、PathGuard、WAL、foreign_keys、busy_timeout 和 migration 顺序验证。
