# AlembicAgent Core Facade Consumption Wave 2B

日期：2026-05-18
执行窗口：AlembicAgent
状态：已完成，待总控复核

## 背景

本文回填 `docs/workspace/alembic-core-agent-interface-boundary-wave-2a-acceptance-wave-2b-plan-2026-05-18.md` 分派给 AlembicAgent 的 Wave 2B 任务。

上游 Core 输入提交：`b904b66907e16e61f29a6dc0eeedc59231ddfb53`

本窗口提交：`1af571674d3eb123e5aad695cb9a02fc69ce37d6`

## 完成范围

- 将 `MemoryRetriever` / `MemoryStore` similarity helper 消费入口从 Core shared internal path 切换到稳定 facade `@alembic/core/search`。
- 将 evolution audit 类型入口从 `@alembic/core/service/evolution` 切换到稳定 facade `@alembic/core/evolution`。
- 将 `MemoryStore` 从 Core raw Drizzle schema import 切换到 `@alembic/core/memory` 的 `ensureSemanticMemorySchema(...)`；Agent 保留同步 raw SQLite adapter，保持现有调用方和 memory CRUD / retrieval / stats / compact / capacity 行为。
- 将 `SessionStore` cache defaults 本地化为 Agent runtime 自有 session cache 策略，不再消费 `@alembic/core/shared/constants`。
- 收紧 `config/core-import-boundary.json`，移除 remaining non-stable allowlist，要求 AlembicAgent Core imports 全部走 stable public facade。

## 文件变化

| 文件 | 变化 |
| --- | --- |
| `config/core-import-boundary.json` | 清空 non-stable `referenceLimits`，说明改为 stable facade-only consumer boundary。 |
| `src/agent/memory/MemoryRetriever.ts` | `cosineSimilarity` 改从 `@alembic/core/search` 导入，并清理未使用类型导入。 |
| `src/agent/memory/MemoryStore.ts` | 移除 Drizzle/schema 直接导入；由 Core facade 建表，内部 CRUD 改为同步 raw SQLite prepared statements。 |
| `src/agent/memory/SessionStore.ts` | 本地化 file/search cache 上限和默认 TTL。 |
| `src/agent/runs/evolution/EvolutionAgentRun.ts` | `EvolutionCandidateReason` 改从 `@alembic/core/evolution` 导入。 |

## 验证命令

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

## 验证结果

AlembicAgent 已不再需要 Core consumer allowlist 来豁免 `shared/similarity`、`infrastructure/database/drizzle/schema`、`shared/constants` 或 `service/evolution`。无 config consumer scan 已从 Wave 2A 验收时的 `issueCount: 6` 收敛到 `issueCount: 0`。

## 遗留风险

- `npm run lint` 仍报告既有 Biome warning，但命令退出码为 0；这些 warning 不属于本轮 Core facade consumption 范围。
- `MemoryStore` 为保持现有同步 API，暂未直接改用 Core async repository implementation；它通过 `@alembic/core/memory` 获取 schema setup contract，并继续用同步 raw SQLite statements 承载 Agent 调用面。
- `drizzle-orm` 仍保留在 AlembicAgent package 依赖中，未在本轮做依赖裁剪，避免把 facade 接入和 packaging 依赖收口混成一个阶段。

## 下一步建议

1. 总控复核本文证据与提交 `1af571674d3eb123e5aad695cb9a02fc69ce37d6`。
2. 复核通过后启动 Wave 2C，分派 `Alembic` / `AlembicPlugin` 判断是否需要同步 Core vendor 或 Agent dependency，并重跑 host consumer gates。
3. 如后续要裁剪 Agent 直接 `drizzle-orm` 依赖，应单独建依赖收口任务并覆盖 package install / public import smoke / host package consumer 验证。
