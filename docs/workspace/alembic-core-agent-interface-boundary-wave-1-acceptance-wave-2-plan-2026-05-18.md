# Alembic Core / Agent Interface Boundary Wave 1 Acceptance And Wave 2 Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已完成；后续入口为 `docs/workspace/alembic-core-agent-interface-boundary-wave-2a-acceptance-wave-2b-plan-2026-05-18.md`

本文承接 `docs/workspace/alembic-core-agent-interface-boundary-workspace-plan-2026-05-18.md`。Wave 1 的四个执行窗口已回填：`AlembicCore`、`AlembicAgent`、`Alembic`、`AlembicPlugin`。

## 1. Wave 1 总控验收结论

结论：通过。

| 窗口 | 验收状态 | 证据 |
| --- | --- | --- |
| `AlembicCore` | 已完成 | 无新增源码提交；基线 `92ccd10 feat: remove reverse guard`；完成三方 consumer scan，并给出 Agent 14 个 Core transitional refs 的处理判断。 |
| `AlembicAgent` | 已完成 | 提交 `b3a57e3 Add agent interface boundary governance`；新增 public API boundary、Core consumer allowlist、public import smoke；Core import issue 从 14 收敛为 0。 |
| `Alembic` | 已完成 | 无新增代码提交；基线 `ea816fc chore: sync redundant systems cleanup vendors`；Agent/Core consumer scan 均通过，无新的 contract 缺口。 |
| `AlembicPlugin` | 已完成 | 无新增代码提交；基线 `12b7dd2 chore: sweep redundant systems from plugin runtime`；Core boundary 通过，`@alembic/agent` 0 命中，agent-free gate 通过。 |
| `AlembicDashboard` | 观察中 | Wave 1 没有实际任务；当前没有直接 `@alembic/core` / `@alembic/agent` package 消费，不进入派发名单。 |

## 2. 总控复核

总控复核命令与结论：

| 命令 | 结果 |
| --- | --- |
| `node AlembicCore/scripts/lint-consumer-core-imports.mjs AlembicAgent --config config/core-import-boundary.json` | 通过；扫描 214 个文件、52 个 `@alembic/core` imports。 |
| `node AlembicCore/scripts/lint-consumer-core-imports.mjs Alembic --config config/core-import-boundary.json` | 通过；扫描 451 个文件、601 个 `@alembic/core` imports。 |
| `node AlembicCore/scripts/lint-consumer-core-imports.mjs AlembicPlugin --config config/core-import-boundary-allowlist.json` | 通过；扫描 315 个文件、517 个 `@alembic/core` imports。 |
| `npm run lint:public-api-boundary --silent` in `AlembicAgent` | 通过；15 个 exact exports，无 wildcard exports。 |
| `npm run smoke:public-imports --silent` in `AlembicAgent` | 通过；15 个 public subpaths 均可 import。 |
| `rg -n '@alembic/agent' ...` in `AlembicPlugin` | 0 命中；`rg` 退出码 1 表示未找到匹配。 |

四个子仓库当前 `git status --short` 均为 clean。

## 3. Wave 1 关键事实

1. `AlembicAgent` 现在已经有自己的 package export policy：15 个 exact public subpath 全部 stable，无 wildcard export。
2. `AlembicAgent` 已经把 14 个未治理 Core transitional refs 收敛到 6 个受控 non-stable refs：
   - `@alembic/core/shared/similarity`：2 refs。
   - `@alembic/core/infrastructure/database/drizzle/schema`：2 refs。
   - `@alembic/core/shared/constants`：1 ref。
   - `@alembic/core/service/evolution`：1 ref，已从 deep file 收敛到 provisional facade。
3. `Alembic` 当前没有新增 Agent/Core contract 缺口，不需要立刻改。
4. `AlembicPlugin` 继续保持 agent-free，不需要也不得引入 `@alembic/agent`。
5. 真正阻塞后续收口的是 Core narrow facade / memory repository contract，而不是外层消费方。

## 4. Wave 2 策略

Wave 2 不并行派所有窗口。先派 `AlembicCore`，完成后再派 `AlembicAgent` 消费；`Alembic` / `AlembicPlugin` 等上游提交后再做同步或替换。

顺序：

1. Wave 2A：`AlembicCore` 实现必要的窄 public facades / repository contract。
2. Wave 2B：`AlembicAgent` 消费 Core 新 facade，并清理剩余 allowlist。
3. Wave 2C：`Alembic` / `AlembicPlugin` 按需同步 Core vendor 或 Agent dependency，重跑边界。
4. `AlembicDashboard` 继续观察，除非后端 HTTP/API shape 变化。

## 5. Wave 2A 分派表

Wave 2A 已由 `AlembicCore` 完成；当前只发送给 `AlembicAgent` 领取 Wave 2B。

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AlembicCore` | 已完成 | Interface boundary Phase 10 facades 已完成：实现真实调用方需要的窄 public API，覆盖 similarity helper、evolution audit 类型和 semantic memory repository contract / factory；未稳定 raw Drizzle schema；已更新 package exports、public API policy、smoke 和测试。 | 已新建 | `docs/AlembicCore/alembic-core-interface-boundary-phase-10-facades-wave-2-2026-05-18.md` | 本文第 5 节 | 本文第 7.1 节 | `npm run check`; `npm run smoke:public-api`; `npm run build`; consumer scan for `../AlembicAgent`; public API boundary tests | 已完成；提交 `b904b66907e16e61f29a6dc0eeedc59231ddfb53`。 |
| `AlembicAgent` | 待启动 | 消费 `@alembic/core/search` similarity、`@alembic/core/evolution` narrow contract 和 `@alembic/core/memory` / `@alembic/core/repositories` memory repository contract；本地化或移除 `@alembic/core/shared/constants` 依赖。 | 新建 | `docs/AlembicAgent/alembic-agent-core-facade-consumption-wave-2b-2026-05-18.md` | 本文第 5 节 | 本文第 7.2 节 | `npm run build:check`; `npm run lint:public-api-boundary`; `npm run smoke:public-imports`; `npm run check`; `node ../AlembicCore/scripts/lint-consumer-core-imports.mjs . --format=json` | 已解除阻塞；依赖 Core commit `b904b66907e16e61f29a6dc0eeedc59231ddfb53`。 |
| `Alembic` | 观察中 | 等 Core / Agent 上游提交后，再同步 `vendor/AlembicCore` 和 `@alembic/agent` file dependency 并重跑 host consumer gates。 | 暂不新建 | `docs/Alembic/alembic-core-agent-interface-sync-wave-2c-2026-05-18.md` | 后续 Wave 2C 文档 | 后续 Wave 2C 文档 | 暂不运行 | 等 Core / Agent 上游提交。当前不发送提示词。 |
| `AlembicPlugin` | 观察中 | 等 Agent Wave 2B 完成后，再判断是否需要同步 Core vendor 并替换可用 stable facade；继续保持 `@alembic/agent` 0 依赖。 | 暂不新建 | `docs/AlembicPlugin/alembic-core-interface-vendor-sync-wave-2c-2026-05-18.md` | 后续 Wave 2C 文档 | 后续 Wave 2C 文档 | 暂不运行 | 等 Agent Wave 2B 回填；继续 agent-free。当前不发送提示词。 |
| `AlembicDashboard` | 观察中 | 无实际任务；仅在 Alembic HTTP/API shape 变化时触发 UI/API smoke。 | 无需新建 | 无 | 本文第 5 节 | 本文第 7.5 节 | 暂不运行 | 当前不发送提示词。 |

## 6. AlembicCore Wave 2A 具体要求

### 6.1 Similarity facade

目标：让 `AlembicAgent` 不再从 `@alembic/core/shared/similarity` import。

要求：

- 优先通过现有 stable export `@alembic/core/search` 暴露 `cosineSimilarity`、`jaccardSimilarity`、`tokenizeForSimilarity`。
- 增加 public entrypoint test 和 smoke coverage。
- 更新 public API policy / package export evidence，不新增 wildcard。

### 6.2 Evolution narrow contract

目标：让 `AlembicAgent` 不再依赖 `@alembic/core/service/evolution` provisional facade 获取审计类型。

要求：

- 新增窄入口 `@alembic/core/evolution`，只暴露 evolution audit / candidate plan 所需类型和真实共享 helper。
- 不把整个 `service/evolution/**` 全量稳定化。
- 至少覆盖 `EvolutionCandidateReason`；可连带导出 `EvolutionCandidate`、`EvolutionCandidatePlan`、`EvolutionAuditRecipe` 等真实共享类型。
- 更新 `package.json exports`、`config/public-api-boundary.json`、public API smoke 和测试。

### 6.3 Semantic memory repository contract

目标：给 `AlembicAgent` 移除 `@alembic/core/infrastructure/database/drizzle/schema` 提供真实替代，不把 raw schema 直接稳定化。

要求：

- 基于 Core 已有 `src/repository/memory/MemoryRepository.ts` 做稳定 contract，而不是新增第二套 memory persistence。
- 评估并实现以下任一方案：
  - 将 `MemoryRepositoryImpl`、`SemanticMemoryEntity`、`SemanticMemoryInsert`、`SemanticMemoryUpdate`、`MemoryStats` 纳入 `@alembic/core/repositories`。
  - 或新增窄入口 `@alembic/core/memory`，提供 semantic memory repository / factory。
- 如 Agent 只有 raw sqlite handle 而没有 Core database handle，Core 可以提供不泄露 Drizzle schema 的 factory，例如 `createSemanticMemoryRepository(...)`，具体签名由 Core 窗口根据真实实现决定。
- 禁止把 `@alembic/core/infrastructure/database/drizzle/schema` 升为 stable public。
- 需要测试 `:memory:` 或临时 DB 下 semantic memory CRUD / active query / stats 的 public contract。

### 6.4 Constants 判断

目标：处理 `@alembic/core/shared/constants` 的单个 Agent import。

要求：

- Core 不为了一个 Agent session cache 默认值直接稳定全部 shared constants。
- Core 文档中给出判断：由 `AlembicAgent` 本地化 cache defaults，还是 Core 提供更窄的 runtime/cache constants facade。
- 如果 Core 不实现 facade，需要明确写入 Wave 2A 回填，供 Agent Wave 2B 执行本地化。

## 7. 回填区

### 7.1 AlembicCore Wave 2A 回填

- 状态：已完成
- 完成范围：已实现 Phase 10 narrow public facades：`@alembic/core/search` 暴露 similarity helper；新增稳定 exact export `@alembic/core/evolution`；新增稳定 exact export `@alembic/core/memory`；`@alembic/core/repositories` 新增 `memoryRepository` bundle 成员；未稳定化 raw Drizzle schema；已新增 public API smoke coverage 和测试。执行记录见 `docs/AlembicCore/alembic-core-interface-boundary-phase-10-facades-wave-2-2026-05-18.md`。
- 提交 hash：`b904b66907e16e61f29a6dc0eeedc59231ddfb53`
- 新增 / 调整 public exports：`package.json exports` 新增 `./evolution`、`./memory`；`config/public-api-boundary.json` 更新为 stable 17、provisional 21、transitional 98；`@alembic/core/search` 新增 `cosineSimilarity`、`jaccardSimilarity`、`textSimilarity`、`tokenizeForSimilarity`；`@alembic/core/memory` 暴露 `MemoryRepositoryImpl`、semantic memory types、`createSemanticMemoryRepository(...)`、`ensureSemanticMemorySchema(...)`；`@alembic/core/repositories` 新增 `memoryRepository`、`MemoryRepository` type 和 semantic memory types。
- 验证命令与结果：`npm run build:check` 通过；`npm run lint:public-api-boundary` 通过，136 exports classified、75 exact、61 wildcard、stable 17、provisional 21、transitional 98；`npm run test -- PublicCoreFacadesPhase10 PublicDatabaseRepositoryEntrypoints PublicApiInventory` 通过，3 files / 9 tests；`npm run check` 通过，60 files / 919 tests，仍有既有 `Could not access 'HEAD'` 输出杂音；`npm run build` 通过；`npm run smoke:public-api` 通过，75 exact public API entrypoints import 成功；`node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --config ../AlembicAgent/config/core-import-boundary.json --format=json` 通过，214 files / 52 refs / issueCount 0；无 config 的 Agent scan 预期失败 6 issues，等待 Agent Wave 2B 消费新 facade。
- AlembicAgent remaining non-stable refs 预期替换路径：`@alembic/core/shared/similarity` -> `@alembic/core/search`；`@alembic/core/service/evolution` -> `@alembic/core/evolution`；`@alembic/core/infrastructure/database/drizzle/schema` -> `@alembic/core/memory` 的 `createSemanticMemoryRepository(...)` / `MemoryRepositoryImpl` 或 `@alembic/core/repositories` 的 `memoryRepository`；`@alembic/core/shared/constants` 不由 Core 提供 facade，Agent 应本地化 session cache defaults。
- 遗留风险：Agent 尚未消费新 facade，无 config consumer scan 仍会失败 6 issues；Core memory repository contract 与 Agent 现有 `MemoryStore` API 不完全同名，Wave 2B 需要 adapter 级迁移；`dist/` 已构建但保持 ignored；`Could not access 'HEAD'` 测试输出杂音未处理。
- 下一步建议：立即派 `AlembicAgent` Wave 2B，基于 Core commit `b904b66907e16e61f29a6dc0eeedc59231ddfb53` 消费新 facade、清理 allowlist 并本地化 constants；Agent 完成后再派 `Alembic` / `AlembicPlugin` Wave 2C 同步 vendor/dependency。

### 7.2 AlembicAgent Wave 2B 回填

待启动。请读取本文，领取 Wave 2B，并新建 `docs/AlembicAgent/alembic-agent-core-facade-consumption-wave-2b-2026-05-18.md`。

### 7.3 Alembic Wave 2C 回填

暂不启动。

### 7.4 AlembicPlugin Wave 2C 回填

暂不启动。

### 7.5 AlembicDashboard 回填

当前无实际任务。

## 8. 当前可复制分派提示词

```text
读取 docs/workspace/alembic-core-agent-interface-boundary-wave-1-acceptance-wave-2-plan-2026-05-18.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

本提示词当前只发送给：

- `AlembicAgent`

本轮不发送给：

- `AlembicCore`：Wave 2A 已完成并提交 `b904b66907e16e61f29a6dc0eeedc59231ddfb53`。
- `Alembic`：观察中，等待 Core / Agent 上游提交。
- `AlembicPlugin`：观察中，等待 Core / Agent 上游提交；继续 agent-free。
- `AlembicDashboard`：观察中，无实际任务。

## 9. 下一步总控动作

1. 派 `AlembicAgent` Wave 2B 消费 Core commit `b904b66907e16e61f29a6dc0eeedc59231ddfb53`。
2. Agent Wave 2B 必须清理 similarity / evolution / raw schema / constants 四类剩余 non-stable refs。
3. Agent 完成后再派 `Alembic` / `AlembicPlugin` Wave 2C 同步 Core vendor 或 Agent dependency，避免空转。
4. `AlembicDashboard` 继续观察，只有后端 HTTP/API shape 变化才触发 UI/API smoke。
