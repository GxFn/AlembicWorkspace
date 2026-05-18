# Alembic Core / Agent Interface Boundary Wave 2A Acceptance And Wave 2B Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已完成；后续入口为 `docs/workspace/alembic-core-agent-interface-boundary-wave-2b-acceptance-wave-2c-plan-2026-05-18.md`

本文承接 `docs/workspace/alembic-core-agent-interface-boundary-wave-1-acceptance-wave-2-plan-2026-05-18.md`，用于验收 `AlembicCore` Wave 2A，并分派 `AlembicAgent` Wave 2B。

## 1. Wave 2A 验收结论

结论：通过。

`AlembicCore` 已完成 Phase 10 narrow public facades，提交 `b904b66907e16e61f29a6dc0eeedc59231ddfb53`（`feat: add core phase 10 public facades`）。工作区复核时为 clean。

验收通过的关键点：

- `@alembic/core/search` 已暴露 `cosineSimilarity`、`jaccardSimilarity`、`textSimilarity`、`tokenizeForSimilarity`，可替代 Agent 里的 `@alembic/core/shared/similarity`。
- 新增稳定 exact export `@alembic/core/evolution`，只暴露 evolution audit / candidate plan 所需窄 contract，不稳定化整个 `service/evolution/**`。
- 新增稳定 exact export `@alembic/core/memory`，提供 semantic memory repository 类型、`MemoryRepositoryImpl`、`createSemanticMemoryRepository(...)` 和 `ensureSemanticMemorySchema(...)`。
- `@alembic/core/repositories` 已纳入 `memoryRepository` bundle 成员。
- raw Drizzle schema `@alembic/core/infrastructure/database/drizzle/schema` 未被稳定化。
- Core 明确判断不为 `@alembic/core/shared/constants` 新增 stable facade；Agent Wave 2B 应本地化 session cache defaults。

## 2. 总控复核命令

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` in `AlembicCore` | 通过。 |
| `npm run lint:public-api-boundary` in `AlembicCore` | 通过；136 exports classified，75 exact、61 wildcard，stable 17、provisional 21、transitional 98。 |
| `npm run test -- PublicCoreFacadesPhase10 PublicDatabaseRepositoryEntrypoints PublicApiInventory` in `AlembicCore` | 通过；3 files / 9 tests。 |
| `npm run build` in `AlembicCore` | 通过。 |
| `npm run smoke:public-api` in `AlembicCore` | 通过；75 exact public API entrypoints imported。 |
| `node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --config ../AlembicAgent/config/core-import-boundary.json --format=json` in `AlembicCore` | 通过；214 files / 52 refs / issueCount 0。 |
| `node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --format=json` in `AlembicCore` | 预期失败；215 files / 52 refs / issueCount 6，正好对应 Agent Wave 2B 待替换项。 |
| `npm run check` in `AlembicCore` | 通过；60 files / 919 tests，Biome checked 415 files；仍有既有 `Could not access 'HEAD'` 输出杂音。 |

## 3. AlembicAgent 剩余待清理项

无 allowlist 扫描剩余 6 个 non-stable issues：

| 文件 | 当前 import | Wave 2B 替换 |
| --- | --- | --- |
| `src/agent/memory/MemoryRetriever.ts` | `@alembic/core/shared/similarity` | `@alembic/core/search` |
| `src/agent/memory/MemoryStore.ts` | `@alembic/core/shared/similarity` | `@alembic/core/search` |
| `src/agent/memory/MemoryStore.ts` | `@alembic/core/infrastructure/database/drizzle/schema` | `@alembic/core/memory` 或 `@alembic/core/repositories` 的 memory repository contract / factory |
| `src/agent/memory/MemoryStore.ts` | `@alembic/core/infrastructure/database/drizzle/schema` | 同上；不得继续引用 raw schema |
| `src/agent/memory/SessionStore.ts` | `@alembic/core/shared/constants` | Agent 本地 session cache defaults / Agent 自有配置 |
| `src/agent/runs/evolution/EvolutionAgentRun.ts` | `@alembic/core/service/evolution` | `@alembic/core/evolution` |

Wave 2B 目标不是扩大 allowlist，而是让 `node ../AlembicCore/scripts/lint-consumer-core-imports.mjs . --format=json` 在 `AlembicAgent` 内直接通过。

## 4. Wave 2B 分派表

当前只发送给 `AlembicAgent`。其它窗口保持观察或无任务，避免空转。

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AlembicAgent` | 待验收 | 已消费 Core commit `b904b66907e16e61f29a6dc0eeedc59231ddfb53` 新增的 stable facade；已清理 similarity / evolution / raw schema / constants 四类 non-stable Core imports；已将 allowlist 收紧为空。 | 已新建 | `docs/AlembicAgent/alembic-agent-core-facade-consumption-wave-2b-2026-05-18.md` | 本文第 4 节；`docs/workspace/index.md` 当前总控入口 | 本文第 6.2 节 | `npm run build:check`; `npm run lint:public-api-boundary`; `npm run smoke:public-imports`; `npm run check`; `node ../AlembicCore/scripts/lint-consumer-core-imports.mjs . --format=json`; 负向扫描旧 imports | 已提交 `1af571674d3eb123e5aad695cb9a02fc69ce37d6`，等待总控复核后进入 Wave 2C。 |
| `AlembicCore` | 已完成 | Wave 2A 已验收通过。 | 已新建 | `docs/AlembicCore/alembic-core-interface-boundary-phase-10-facades-wave-2-2026-05-18.md` | 本文第 1-2 节 | 本文第 6.1 节 | 已复核 | 当前不发送提示词。 |
| `Alembic` | 观察中 | 等 Agent Wave 2B 完成后再进入 Wave 2C，同步 Core vendor / Agent dependency 并重跑 host consumer gates。 | 暂不新建 | `docs/Alembic/alembic-core-agent-interface-sync-wave-2c-2026-05-18.md` | 后续 Wave 2C 文档 | 后续 Wave 2C 文档 | 暂不运行 | 等 Agent Wave 2B。当前不发送提示词。 |
| `AlembicPlugin` | 观察中 | 等 Agent Wave 2B 完成后判断是否同步 Core vendor；继续保持 `@alembic/agent` 0 依赖。 | 暂不新建 | `docs/AlembicPlugin/alembic-core-interface-vendor-sync-wave-2c-2026-05-18.md` | 后续 Wave 2C 文档 | 后续 Wave 2C 文档 | 暂不运行 | 等 Agent Wave 2B。当前不发送提示词。 |
| `AlembicDashboard` | 观察中 | 无实际任务；仅在 Alembic HTTP/API shape 变化时触发 UI/API smoke。 | 无需新建 | 无 | 本文第 4 节 | 本文第 6.5 节 | 暂不运行 | 当前不发送提示词。 |
| `BiliDili` | 无任务 | 本轮是 Core / Agent npm package 边界收口，BiliDili 作为 iOS/Swift 真实测试项目不消费这些 JS package，不进入派发。 | 无需新建 | 无 | 本文第 4 节 | 本文第 6.6 节 | 暂不运行 | 当前不发送提示词。 |

## 5. AlembicAgent Wave 2B 具体要求

1. 读取本文和 `docs/AlembicCore/alembic-core-interface-boundary-phase-10-facades-wave-2-2026-05-18.md`，确认 Core commit `b904b66907e16e61f29a6dc0eeedc59231ddfb53` 已可消费。
2. 将 `MemoryRetriever.ts` 和 `MemoryStore.ts` 的 similarity imports 切到 `@alembic/core/search`。
3. 将 `EvolutionAgentRun.ts` 的 evolution import 切到 `@alembic/core/evolution`。
4. 将 `MemoryStore.ts` 从 raw Drizzle schema import 切到 `@alembic/core/memory` 或 `@alembic/core/repositories` 提供的 semantic memory repository contract / factory；保持现有 Agent MemoryStore 对外行为，不复制 Core schema。
5. 将 `SessionStore.ts` 使用的 `CACHE.MAX_FILE_ENTRIES`、`CACHE.MAX_SEARCH_ENTRIES`、`CACHE.DEFAULT_TTL_MS` 本地化到 Agent session cache defaults 或 Agent 自有配置。
6. 清理 `config/core-import-boundary.json` 中已经不需要的 non-stable allowlist，目标是无 config consumer scan issueCount 0。
7. 新建执行记录 `docs/AlembicAgent/alembic-agent-core-facade-consumption-wave-2b-2026-05-18.md`，回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。

禁止事项：

- 不得把 `@alembic/core/infrastructure/database/drizzle/schema` 加入新的 stable 依赖或继续扩大 allowlist。
- 不得把 Core 的 `shared/constants` 继续作为 Agent session cache 策略来源。
- 不得为了通过扫描删除 Agent memory 行为；必须保持 memory retrieval、store、stats、capacity、compact 等现有语义。
- 不要修改 `Alembic`、`AlembicPlugin` 或 `AlembicDashboard`，它们等 Wave 2B 完成后再进入 Wave 2C。

## 6. 回填区

### 6.1 AlembicCore Wave 2A 回填

已完成并通过总控验收。提交：`b904b66907e16e61f29a6dc0eeedc59231ddfb53`。

### 6.2 AlembicAgent Wave 2B 回填

状态：待验收。

执行记录：`docs/AlembicAgent/alembic-agent-core-facade-consumption-wave-2b-2026-05-18.md`

提交：`1af571674d3eb123e5aad695cb9a02fc69ce37d6`（`Consume core public facades`）

完成范围：

- `MemoryRetriever.ts` / `MemoryStore.ts` 的 similarity helper 已切到 `@alembic/core/search`。
- `EvolutionAgentRun.ts` 的 evolution 类型已切到 `@alembic/core/evolution`。
- `MemoryStore.ts` 已移除 `@alembic/core/infrastructure/database/drizzle/schema` import，改由 `@alembic/core/memory` 的 `ensureSemanticMemorySchema(...)` 提供 schema setup contract；Agent 同步 raw SQLite adapter 行为保持。
- `SessionStore.ts` 已本地化 session cache defaults，不再消费 `@alembic/core/shared/constants`。
- `config/core-import-boundary.json` 已清空 non-stable allowlist。

验证命令与结果：

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` | 通过。 |
| `npm run lint` | 通过；仍输出 23 条既有 Biome warning，未阻断。 |
| `npm run lint:public-api-boundary` | 通过；15 exact exports，无 wildcard exports。 |
| `npm run lint:core-import-boundary` | 通过；214 files / 48 Core imports，config allowlist 为空。 |
| `node ../AlembicCore/scripts/lint-consumer-core-imports.mjs . --format=json` | 通过；215 files / 48 refs / `issueCount: 0`，stable-public 48、provisional-public 0、transitional-internal 0。 |
| `rg -n "@alembic/core/(shared/similarity\|infrastructure/database/drizzle/schema\|shared/constants\|service/evolution)" src config scripts test --glob '!**/dist/**'` | 通过；0 命中。 |
| `npm run check` | 通过；9 test files / 37 tests。 |
| `npm run smoke:public-imports` | 通过；15 public subpaths imported。 |
| `git diff --check` | 通过。 |

遗留风险：

- `MemoryStore` 为保持 Agent 现有同步调用面，暂未改为直接消费 Core async repository implementation；本轮只把 schema setup contract 上移到 Core facade。
- `drizzle-orm` 仍保留在 Agent package 依赖中，未在本轮混入依赖裁剪。
- `npm run lint` 输出既有 warning，但命令通过；不影响本轮 Core import boundary 收口。

下一步建议：总控复核 Wave 2B 证据后，创建 Wave 2C 文档，分派 `Alembic` / `AlembicPlugin` 判断是否需要同步 Core vendor 或 Agent dependency，并重跑 host consumer gates。

### 6.3 Alembic Wave 2C 回填

暂不启动。

### 6.4 AlembicPlugin Wave 2C 回填

暂不启动。

### 6.5 AlembicDashboard 回填

当前无实际任务。

### 6.6 BiliDili 回填

当前无任务；不发送提示词。

## 7. 当前可复制分派提示词

```text
读取 docs/workspace/alembic-core-agent-interface-boundary-wave-2a-acceptance-wave-2b-plan-2026-05-18.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

本提示词已发送并由 `AlembicAgent` 执行完成，当前不再重复发送给：

- `AlembicAgent`

本轮不发送给：

- `AlembicCore`：Wave 2A 已完成并通过总控验收。
- `Alembic`：观察中，等待 Agent Wave 2B。
- `AlembicPlugin`：观察中，等待 Agent Wave 2B；继续 agent-free。
- `AlembicDashboard`：观察中，无实际任务。
- `BiliDili`：无任务；本轮不涉及 iOS/Swift 真实测试项目。

## 8. 下一步总控动作

1. 总控复核 AlembicAgent Wave 2B 提交 `1af571674d3eb123e5aad695cb9a02fc69ce37d6` 与无 config Core consumer scan `issueCount: 0`。
2. Agent Wave 2B 通过后，再创建 Wave 2C 文档，判断是否派 `Alembic` / `AlembicPlugin` 同步 Core vendor 或 Agent dependency。
3. `AlembicDashboard` 和 `BiliDili` 继续不发送，除非后续文档出现实际任务。
