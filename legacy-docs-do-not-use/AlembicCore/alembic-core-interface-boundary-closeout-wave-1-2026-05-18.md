# AlembicCore Interface Boundary Closeout Wave 1

日期：2026-05-18
窗口：AlembicCore
状态：已完成

本文记录 `AlembicCore` 在 Core / Agent 接口边界总控 Wave 1 中的执行结果。本文只写边界判断和后续分派，不在本阶段新增空 facade，也不把 raw Drizzle schema 包装成稳定 API。

## 1. 完成范围

- 已把 `AlembicAgent` 纳入 Core consumer 扫描口径，并与 `Alembic`、`AlembicPlugin` 一起复验。
- 已复核 Core 当前 public API 状态：15 个 Stable exact exports、21 个 Provisional exact exports、98 个 Transitional exports。
- 已逐项核对 `AlembicAgent` 14 个 Core transitional refs 的真实使用点。
- 已判断每类引用应该进入 stable replacement、Core narrow facade、Agent adapter allowlist 或 Agent 本地化。
- 已形成 Phase 10 closeout patch 清单，供 `AlembicCore` 和 `AlembicAgent` 下一波执行。

## 2. 三方 Consumer 扫描

执行目录：`AlembicCore`

| Consumer | filesScanned | referencesScanned | Stable | Provisional | Transitional | issueCount | 结论 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `Alembic` | 451 | 601 | 401 | 7 | 193 | 0 | 通过现有 consumer config；仍有较多 transitional refs，但已受 allowlist 治理。 |
| `AlembicPlugin` | 315 | 517 | 357 | 8 | 152 | 0 | 通过现有 consumer allowlist；保持 agent-free，不引入 `@alembic/agent`。 |
| `AlembicAgent` | 211 | 56 | 42 | 0 | 14 | 14 | 新纳入 consumer 后暴露 14 个未治理 transitional refs，需要 Wave 2 收口。 |

`AlembicAgent` 扫描失败是预期发现，不代表 Core 本轮静态检查失败；它表示 Agent 还没有建立 Core consumer allowlist / stable replacement 策略。

## 3. Agent 14 个 Transitional Refs 处理判断

| Specifier | refs | 代表文件 | 判断 | Phase 10 动作 |
| --- | ---: | --- | --- | --- |
| `@alembic/core/domain/dimension/DimensionSop` | 1 | `src/agent/prompts/insight-analyst.ts` | 已有 stable replacement。`@alembic/core/dimensions` 已导出 `getDimensionSOP`。 | `AlembicAgent` 直接替换为 `@alembic/core/dimensions`，无需 Core 改代码。 |
| `@alembic/core/domain/dimension/RecipeDimension` | 1 | `src/tools/v2/handlers/knowledge.ts` | 已有 stable replacement。`@alembic/core/dimensions` 已导出 `dimensionTags` 等维度工具。 | `AlembicAgent` 直接替换为 `@alembic/core/dimensions`。 |
| `@alembic/core/domain/knowledge/FieldSpec` | 1 | `src/tools/v2/handlers/knowledge.ts` | 已有 stable replacement。`@alembic/core/knowledge` 已导出 `getSystemInjectedFields`。 | `AlembicAgent` 直接替换为 `@alembic/core/knowledge`。 |
| `@alembic/core/shared/folder-names` | 1 | `src/shared/package-assets.ts` | 已有 stable replacement。`@alembic/core/workspace` 已导出 `DEFAULT_FOLDER_NAMES`。 | `AlembicAgent` 直接替换为 `@alembic/core/workspace`。 |
| `@alembic/core/shared/token-utils` | 2 | `ContextWindow.ts`, `ConversationStore.ts` | 真实需要 deterministic token budget helper；当前没有 stable facade。 | `AlembicCore` Wave 2 评估新增窄 utility facade；`AlembicAgent` 暂放 allowlist，不复制实现。 |
| `@alembic/core/shared/concurrency` | 2 | `AgentRunCoordinator.ts`, `FanOutStrategy.ts` | `createLimit` 是通用确定性并发工具，不属于 Agent AI 能力本体。 | `AlembicCore` Wave 2 评估作为 shared utility stable/provisional facade 暴露；`AlembicAgent` 暂放 allowlist。 |
| `@alembic/core/shared/similarity` | 2 | `MemoryRetriever.ts`, `MemoryStore.ts` | 真实用于 memory retrieval / lexical similarity；当前 `@alembic/core/search` 未导出这些低层函数。 | `AlembicCore` Wave 2 评估并入 `@alembic/core/search` 或新增 shared utility facade；`AlembicAgent` 暂放 allowlist。 |
| `@alembic/core/infrastructure/database/drizzle/schema` | 2 | `MemoryStore.ts` | 不应把 raw Drizzle schema 直接稳定化。Core 内已有 `repository/memory/MemoryRepository.ts`，但未纳入 `@alembic/core/repositories` bundle。 | `AlembicCore` Wave 2 评估语义记忆 repository contract；`AlembicAgent` 暂以 adapter allowlist 限定到 `src/agent/memory/**`，不得扩大 raw schema 依赖。 |
| `@alembic/core/shared/constants` | 1 | `SessionStore.ts` | 当前只为 Agent session read-only cache 默认值服务，不一定应该变成 Core stable 常量。 | 优先由 `AlembicAgent` 本地化 cache defaults；若后续出现多 consumer，再由 Core 增加窄 config facade。 |
| `@alembic/core/service/evolution/RecipeImpactPlanner` | 1 | `EvolutionAgentRun.ts` | Agent 只消费 `EvolutionCandidateReason` 类型，但该类型来自 Core evolution 真实链路。 | `AlembicCore` Wave 2 评估新增 `@alembic/core/evolution` narrow contract，至少暴露审计所需类型；`AlembicAgent` 暂放 allowlist。 |

## 4. Phase 10 Closeout Patch 清单

### 4.1 `AlembicAgent` 可立即替换

`AlembicAgent` 下一波应先做 4 个无需 Core 改动的替换：

- `@alembic/core/domain/dimension/DimensionSop` -> `@alembic/core/dimensions`
- `@alembic/core/domain/dimension/RecipeDimension` -> `@alembic/core/dimensions`
- `@alembic/core/domain/knowledge/FieldSpec` -> `@alembic/core/knowledge`
- `@alembic/core/shared/folder-names` -> `@alembic/core/workspace`

替换后重跑 `node ../AlembicCore/scripts/lint-consumer-core-imports.mjs . --format=json`，预期 issue 从 14 降到 10。

### 4.2 `AlembicCore` 需要评估的 narrow facades

Core Wave 2 只允许围绕真实调用方新增窄出口：

- `token-utils`：为 context budget / conversation budget 提供 deterministic helper facade。
- `concurrency`：为 `createLimit` 提供可复用并发限制 helper facade。
- `similarity`：为 `cosineSimilarity` / `jaccardSimilarity` / `tokenizeForSimilarity` 提供 search/vector 相关稳定入口。
- `evolution`：为 Agent evolution audit 暴露最小 evolution candidate/audit 类型 contract。
- `memory repository`：评估把 Core 已有 `MemoryRepositoryImpl` 纳入公开 repository contract，或新增只覆盖 semantic memory CRUD / candidate retrieval 的窄 facade。

这些 facade 必须满足：真实调用方、真实实现、public API policy 更新、smoke import、代表性测试和 consumer 替换计划齐全。

### 4.3 不应做的事

- 不把 `@alembic/core/infrastructure/database/drizzle/schema` 直接列为 stable export。
- 不把所有 `shared/*` 一次性变成公开 API。
- 不为了清零 scanner issue 复制 token / similarity / concurrency / memory schema 实现到 Agent。
- 不把 Agent AI provider、tool runtime、prompt、执行循环放回 Core。
- 不删除 transitional wildcard exports，除非所有 consumer 扫描和外层接入证据齐全。

## 5. 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run check` | 通过。包含 `build:check`、public API boundary、916 个测试、Biome；测试输出中仍有既有 `Could not access 'HEAD'` 杂音，但退出码为 0。 |
| `npm run smoke:public-api` | 通过，成功 import 73 个 exact public API entrypoints。 |
| `node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --format=json` | 预期失败；filesScanned 211、referencesScanned 56、stable 42、transitional 14、issueCount 14。 |
| `node scripts/lint-consumer-core-imports.mjs ../Alembic --config ../Alembic/config/core-import-boundary.json --format=json` | 通过；filesScanned 451、referencesScanned 601、issueCount 0。 |
| `node scripts/lint-consumer-core-imports.mjs ../AlembicPlugin --config ../AlembicPlugin/config/core-import-boundary-allowlist.json --format=json` | 通过；filesScanned 315、referencesScanned 517、issueCount 0。 |

## 6. 提交 Hash

本阶段没有修改 `AlembicCore` 源码，因此没有新增 Core 代码提交。

验证基线：`92ccd10baad1eac5fcfe3b4d4c8191a02042da04`

workspace 总控文档不在子仓库 git 内，本文和总控回填不产生子仓库 commit。

## 7. 遗留风险

- `AlembicAgent` 仍有 14 个 Core transitional refs；其中 4 个可立即替换，10 个需要 allowlist 或 Core Wave 2 narrow facade。
- Core 已有 semantic memory repository 实现尚未纳入公开 repository bundle；Agent 仍直接触碰 raw Drizzle schema，必须在下一波收口。
- utility facade 命名尚未最终决定，下一波实现前需要在 Core public API policy 中明确 stable/provisional 状态。
- `npm run check` 中的 `Could not access 'HEAD'` 是既有测试输出杂音，当前不阻塞，但后续可单独清理。

## 8. 下一步建议

- 派 `AlembicAgent` 先完成 4 个 stable replacement，并建立 Core consumer allowlist / reference limit。
- 派 `AlembicCore` Wave 2 只实现被 Agent 或外层真实调用方证明需要的 narrow facades。
- 派 `Alembic` 和 `AlembicPlugin` 等 Core Wave 2 有代码提交后再同步 vendor 指针，不提前改外层。
- `AlembicDashboard` 继续观察；除非 Alembic HTTP/API shape 变化，否则不进入 UI smoke。
