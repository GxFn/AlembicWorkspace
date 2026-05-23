# AlembicCore Small Fix / Cleanup Repair 回填

日期：2026-05-23
目标仓库：`AlembicCore`
总控计划：`docs/workspace/current/small-fix-cleanup-repair-wave-2026-05-23.md`
修复包：`SFC-R1-CORE`

## 当前窗口定位

当前窗口定位为 `AlembicCore`。本轮仓库职责是维护 `@alembic/core` 的共享、确定性、可复用、可运行 Headless 内核能力，包括稳定 public facade、领域 contract、repository / service / workflow 内核与可验证的包入口。

本轮明确不承担：不处理 Codex MCP / Skill / marketplace / channel，不处理 CLI / Dashboard UI / Agent runtime / AI provider / tool system，不操作 `BiliDili`，不处理总控文档列为 `待确认`、`待授权` 或 `观察` 的事项。

## 完成范围

- `SFC-CORE-001`：修正 `AlembicCore/AGENTS.md` 外层接入规则，明确日常 workspace 本地开发优先 `@alembic/core: file:../AlembicCore`；`vendor/AlembicCore` 仅用于 release、portable runtime、vendor snapshot 或当前总控明确要求的封版场景。
- `SFC-CORE-002`：将 `normalizeLifecycle` additive 导出到 `src/domain/knowledge/index.ts` 与 stable facade `src/knowledge.ts`。
- `SFC-CORE-002`：补 `test/PublicKnowledgeEntrypoints.test.ts` targeted 断言，并把 `normalizeLifecycle` 加入 `scripts/smoke-public-api.mjs` 的 `@alembic/core/knowledge` smoke 检查。
- `SFC-CORE-003`：修正 `src/shared/concurrency.ts` 注释示例，改为 `@alembic/core/shared`，不再示范外层 `#shared/*` alias。

## 提交 Hash

- `69bda3ff6ac413ac1fc318253a840986660a4386` (`fix: tighten core facade cleanup`)

## 验证命令与结果

- `npm run check`：通过。`build:check`、public API boundary、Vitest `65 passed / 949 tests passed`、Biome lint 均通过。过程中仍出现一次非致命 `Could not access 'HEAD'` 输出，属于 `SFC-CORE-005` 观察项，本轮未处理。
- `npm run build`：通过。
- `npm run smoke:public-api`：通过，`Imported 75 exact public API entrypoints.`，覆盖新增 `@alembic/core/knowledge.normalizeLifecycle`。
- `npm run report:public-api-closeout`：通过。closeout inventory 保持 `98 exports (61 wildcard)`；consumer scans 均 `issues=0`。
- `node scripts/lint-consumer-core-imports.mjs ../Alembic --config ../Alembic/config/core-import-boundary.json --format=json`：通过，`issueCount=0`，`referencesScanned=447`。
- `node scripts/lint-consumer-core-imports.mjs ../AlembicPlugin --config ../AlembicPlugin/config/core-import-boundary-allowlist.json --format=json`：通过，`issueCount=0`，`referencesScanned=457`。
- `node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --config ../AlembicAgent/config/core-import-boundary.json --format=json`：通过，`issueCount=0`，`referencesScanned=49`。
- `git diff --check`：通过。
- `rg -n "#shared/concurrency|file:vendor/AlembicCore" AGENTS.md src/domain/knowledge/index.ts src/knowledge.ts src/shared/concurrency.ts scripts/smoke-public-api.mjs test/PublicKnowledgeEntrypoints.test.ts`：无旧示例命中。

## 未处理项理由

- `SFC-CORE-004`：`release:check` dirty tree 语义为观察项，总控明确本波不强化门禁，避免影响开发态验证。
- `SFC-CORE-005`：git HEAD 输出噪声为观察项；本轮验证中仍可复现为非致命输出，但 `npm run check` 通过，按计划不处理。
- 未删除 deep export / allowlist；总控文档明确本波不包含删除或 consumer 替换。

## 遗留风险

- Core 已提供 `normalizeLifecycle` stable facade，但 Alembic / AlembicPlugin 是否替换既有 deep import 仍需由对应 consumer 窗口在后续任务中按计划执行。
- `release:check` dirty tree 语义和 git HEAD 噪声仍保持观察状态；若后续 CI 或 release 封版受影响，应开 release / CI 专项处理。

## 下一步建议

- 总控可将 `SFC-CORE-001`、`SFC-CORE-002`、`SFC-CORE-003` 标为待验收。
- 若下一波要收敛 consumer deep import，可基于 commit `69bda3ff6ac413ac1fc318253a840986660a4386` 派发 Alembic / AlembicPlugin consumer 替换任务；替换前不要求 Core 再改。
