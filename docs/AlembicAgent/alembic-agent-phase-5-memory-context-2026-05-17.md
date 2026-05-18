# AlembicAgent Phase 5 Memory / Context Migration

日期：2026-05-17
阶段：Phase 5 - 迁移 Agent Memory / Context 持久化
范围：只修改 `AlembicAgent` 仓库；只读参考 `Alembic` 主仓库；未修改 `Alembic`、`AlembicPlugin`、`AlembicCore`。

## 完成内容

Phase 5 已完成。`src/agent/memory/**` 与 `src/agent/context/**` 在 Phase 2 已从 `Alembic/lib/agent/**` 迁入，本轮将 Agent-owned memory/context 能力正式作为 AlembicAgent 的 public surface 暴露，并补齐持久化行为测试。

新增/调整：

- `src/agent/context/index.ts`：新增 Context public barrel。
- `src/agent/memory/index.ts`：补充 `MemoryEmbeddingStore`、flush contract、session schema validator 公开导出。
- `package.json`：新增 `./memory` 和 `./context` package exports。
- `src/index.ts`：根入口导出 memory/context，package metadata 升级为 `phase-5-memory-context`。
- `test/memory-context.test.ts`：新增 SQLite memory、Session checkpoint、embedding sidecar、Conversation JSONL 测试。
- `test/index.test.ts`：更新 package metadata 断言。

## 公开入口

Phase 5 后，主仓库/宿主代码应优先从以下入口消费 Agent memory/context 能力：

```ts
import {
  MemoryCoordinator,
  MemoryStore,
  PersistentMemory,
  SessionStore,
  MemoryEmbeddingStore,
} from '@alembic/agent/memory';
```

```ts
import {
  ContextWindow,
  ConversationStore,
  ExplorationTracker,
  PlanTracker,
} from '@alembic/agent/context';
```

根入口 `@alembic/agent` 也会导出同一组能力，便于主仓库/宿主渐进迁移；需要直接接入 Agent package 的宿主代码建议使用 `@alembic/agent/memory` 和 `@alembic/agent/context`，让边界更清晰。

`AlembicPlugin` 不属于这个接入方。Plugin 不新增 `@alembic/agent` dependency，不 import `@alembic/agent/memory` 或 `@alembic/agent/context`；它后续只通过宿主 agent contract/adapter 使用宿主提供的 memory/context 能力。

## Agent-owned 子集

本轮正式归入 AlembicAgent public surface 的子集：

- `MemoryCoordinator`：Agent memory 统一协调器，管理 ActiveContext、SessionStore、PersistentMemory 注入。
- `ActiveContext`：单次 execute / dimension scope 的工作记忆与推理 trace。
- `SessionStore`：bootstrap 会话级维度报告、只读工具缓存、checkpoint 断点续传。
- `PersistentMemory` / `MemoryStore` / `MemoryRetriever` / `MemoryConsolidator`：Agent 语义记忆 facade、SQLite CRUD、检索、固化。
- `MemoryEmbeddingStore`：memory embedding JSON sidecar。
- `ContextWindow`：Agent 上下文窗口预算和压缩。
- `ConversationStore`：会话 JSONL/index 持久化。
- `ExplorationTracker` 与 exploration helpers：Agent 探索阶段、信号、计划、nudge 管理。

继续留给 Core 或宿主处理的能力：

- Core 继续拥有 SQLite/Drizzle schema、migration、repository/vector deterministic contract。
- Alembic 主仓库继续拥有 database connection construction、projectRoot/dataRoot/WriteZone/PathGuard 配置、CLI/daemon/Dashboard wiring。
- AlembicPlugin 继续拥有 Codex MCP schema、handler envelope、session/policy、skills/plugins/channels 和 release/smoke/verify 脚本。

## 测试覆盖

新增测试覆盖 Phase 5 验收项：

- `MemoryStore` 使用 in-memory SQLite 创建 semantic memory table，验证 add/update/get/findSimilar/compact/getStats。
- `SessionStore` 保存并恢复 bootstrap checkpoint，验证维度报告、候选摘要、cross references、schema validation。
- `MemoryEmbeddingStore` 持久化 JSON sidecar，验证 reload、gc、corrupt JSON 容错。
- `ConversationStore` 持久化 conversation index 和 JSONL messages，验证 malformed JSONL 行被忽略、delete 后读为空。

## 验证结果

已通过：

- `npm run build:check`
- `npm run lint`
- `npm run lint:agent-import-boundary`
- `npm run test`
- `npm run check`
- `npm run build`
- `node -e "import('./dist/index.js')..."`
- `node -e "import('./dist/agent/memory/index.js')..."`
- `node -e "import('./dist/agent/context/index.js')..."`
- `node -e "import('@alembic/agent/memory')..."`
- `node -e "import('@alembic/agent/context')..."`

Smoke import 结果：

```json
{"hasAgentRuntime":true,"hasMemoryStore":true,"hasSessionStore":true,"hasConversationStore":true,"hasContextWindow":true,"phase":"phase-5-memory-context"}
```

```json
{"hasMemoryStore":true,"hasPersistentMemory":true,"hasSessionStore":true,"hasEmbeddingStore":true,"hasShapeValidator":true}
```

```json
{"hasContextWindow":true,"hasConversationStore":true,"hasExplorationTracker":true,"hasPlanTracker":true}
```

Self-reference package export smoke：

```json
{"selfReference":true,"hasMemoryStore":true,"hasSessionStore":true}
```

```json
{"selfReference":true,"hasContextWindow":true,"hasConversationStore":true}
```

测试结果：

```text
Test Files  4 passed (4)
Tests       19 passed (19)
```

说明：`npm run lint` 返回成功，但 Biome 对迁入的原始 Agent/AI/Tool/Memory/Context 源码仍报告 27 个 warning，主要是 non-null assertion、unused import/private member 和 optional-chain 风格建议。本阶段为保持行为不变未做批量清理。

## 交给 Alembic 窗口的接入任务

`Alembic` 主仓库仍不要立即删除 `lib/agent/context/**`、`lib/agent/memory/**` 或调用方。Phase 5 后可以开始做接入准备：

1. 扫描主仓库所有 `#agent/memory/*`、`#agent/context/*`、`lib/agent/memory`、`lib/agent/context` 和相对 memory/context 引用。
2. 将 Agent-owned `MemoryCoordinator`、`ActiveContext`、`SessionStore`、`PersistentMemory`、`MemoryStore`、`MemoryEmbeddingStore`、`ContextWindow`、`ConversationStore` 消费点切到 `@alembic/agent/memory` / `@alembic/agent/context`。
3. 保留 database connection construction、SQLite/Drizzle migrations、repository/vector construction、projectRoot/dataRoot/WriteZone/PathGuard 配置作为主仓库或 Core 职责。
4. 保留 CLI、daemon、HTTP/API、Dashboard、native/macOS、IDE 和主产品 wiring 作为宿主 adapter。
5. 完成替换并验证后，`Alembic/lib/agent/memory/**`、`Alembic/lib/agent/context/**` 中已由 Agent 接管的通用部分可作为删除候选。
6. 删除前必须提供 import 扫描结果、build/check/lint 结果，以及 CLI/daemon/Dashboard memory/context smoke 证据。

## 交给 AlembicPlugin 窗口的宿主适配与删除逻辑

`AlembicPlugin` 不能新增 `@alembic/agent` dependency，也不能 import `@alembic/agent/memory` 或 `@alembic/agent/context`。Plugin 的任务是删除内置 Agent memory/context runtime，并通过宿主 agent contract/adapter 使用宿主提供的 memory/context。

任务：

1. 不为 Plugin 接入 `@alembic/agent` dependency，开发期也不要使用 `file:../AlembicAgent`。
2. 扫描 `AlembicPlugin/lib/**` 中所有 `#agent/memory/*`、`#agent/context/*`、`lib/agent/memory`、`lib/agent/context` 和相对 memory/context 引用。
3. Codex MCP handler 只保留 schema projection、handler envelope、session、policy、Codex-specific adapter；memory/context 读写和 agent run state 改为调用宿主 agent contract。
4. 保留 `lib/external/mcp/**`、`lib/codex/**`、Codex schema/envelope/session/policy、skills、injectable-skills、plugins、channels 和 release/smoke/verify 脚本。
5. 删除候选：宿主 adapter 替代路径验证完成后，删除 `AlembicPlugin/lib/agent/memory/**`、`AlembicPlugin/lib/agent/context/**` 中重复的 runtime。
6. 删除前必须运行 import 扫描；删除后至少运行 `npm run build:check`、`npm run lint -- --diagnostic-level=error`、`npm run lint:core-import-boundary`、`npm run smoke:codex-plugin`、`npm run verify:codex-plugin`。
7. 如果发现 Plugin 专属 Codex session/cache/response shape 逻辑，保留在 Plugin adapter 中；memory/context runtime 由宿主 agent 提供，不由 Plugin 直接依赖 `@alembic/agent/memory` 或 `@alembic/agent/context`。

## 下一阶段

下一阶段进入 Plugin/host contract 交接段：`AlembicPlugin` 删除内置 Agent 能力必须由 Plugin 窗口执行；`AlembicAgent` 窗口只在发现 contract 缺口时补充 package public surface 或类型。

在本窗口继续推进前，应先由 Alembic 和 AlembicPlugin 窗口完成 import 扫描，并反馈是否还缺少宿主 agent contract 类型。
