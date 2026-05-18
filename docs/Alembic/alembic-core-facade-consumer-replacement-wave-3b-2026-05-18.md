# Alembic Core Facade Consumer Replacement Wave 3B

日期：2026-05-18
窗口：Alembic
状态：阻塞

阻塞说明：Alembic 已完成本波可安全替换的消费层收敛，但 `@alembic/core/types/workflows` 仍无法切到 `@alembic/core/types`，因为 Core `src/types/index.ts` 尚未 re-export `types/workflows.ts` 中的 `McpContext`、`WorkflowDatabaseLike`、`WorkflowSkillHooks`、`IncrementalPlan` 等 workflow contract 类型。按总控规则，该缺口需要回到 Core 做 3B-Core-2，消费层不硬绕路。

## 完成范围

- 将 Alembic 主仓库内本波目标 `@alembic/core/shared/*` imports 收敛到 exact facade：多数使用 `@alembic/core/shared`，`folder-names` 使用 `@alembic/core/workspace`，`similarity` 使用 `@alembic/core/search`。
- 将 `@alembic/core/infrastructure/config/ConfigLoader`、`Defaults`、`Paths` 收敛到 `@alembic/core/config`。
- 将 `@alembic/core/service/candidate/CandidateAggregator`、`SimilarityService` 收敛到 `@alembic/core/service/candidate`。
- 将 `@alembic/core/types/reactive-evolution` 与 `@alembic/core/types/snapshot-views` 收敛到 `@alembic/core/types`，并保持 type-only imports。
- 同步更新 static imports、dynamic import、`vi.mock` / `vi.doMock` / `vi.doUnmock`，避免测试继续锁定旧 deep specifier。
- 收紧 `config/core-import-boundary.json`：移除已替换的本波旧 deep specifier allowlist，新增 `@alembic/core/config`、`@alembic/core/shared`、`@alembic/core/types`、`@alembic/core/service/candidate`。
- 保留 `@alembic/core/types/workflows` 作为明确上游 facade 缺口残留；未触碰 vendor、release、portable runtime、npm publish 或远程指针。

## 提交

- Alembic：`64f30f68ffce13c350ca9c328e511e087ded3246` (`chore: consume core facade imports`)

## 验证命令

```bash
npm run lint:consumer-core-imports
npm run lint:core-import-boundary
npm run build:check
npm run test:unit -- test/unit/BootstrapTerminalToolset.test.ts test/unit/KnowledgeAPI.test.ts test/unit/TestMode.test.ts test/unit/ProjectPaths.test.ts test/unit/folder-names.test.ts test/unit/ContentImpactAnalyzer.test.ts
npm run lint
npm run test:unit
npm run test:unit -- test/unit/DecayDetector.test.ts
npm run check
node scripts/core-source-command.mjs lint-consumer-imports --format=json
rg -n "@alembic/core/(shared/|infrastructure/config/|types/(reactive-evolution|snapshot-views)|service/candidate/)" bin lib scripts test config
rg -n "@alembic/core/types/workflows" bin lib scripts test config
git diff --check
git status --short
```

## 验证结果

- `npm run lint:consumer-core-imports`：通过；扫描 455 files / 599 `@alembic/core` imports，issue 0。
- `npm run lint:core-import-boundary`：通过；扫描 455 files / 599 imports，issue 0。
- `npm run build:check`：通过。
- 目标相关单测：通过；6 files / 105 tests passed。
- Core consumer JSON scan：通过；issue 0；`stable-public=417`、`provisional-public=64`、`transitional-internal=118`、`referencesScanned=599`。相比 Wave 3A 基线，transitional references 从 179 降到 118。
- 负向扫描：除 `types/workflows` 外，本波目标旧 deep specifier 0 命中。
- `@alembic/core/types/workflows` 残留：10 命中，其中 9 个代码 type imports、1 个 `config/core-import-boundary.json` allowlist；原因是 Core facade 缺口。
- `git diff --check`：通过。
- `git status --short`：Alembic 仓库干净。
- `npm run lint`：未通过；命中既有非本轮 lint errors，包括 `lib/bootstrap.ts`、`lib/cli/AiScanService.ts`、`lib/cli/deploy/FileManifest.ts`、`scripts/verify-context-api.ts`。本轮仅在相关文件替换 import specifier，没有引入这些 lint 规则问题。
- `npm run test:unit`：未通过；本轮相关 `BootstrapTerminalToolset` 已在目标单测中修复并通过，剩余失败为非目标或环境问题：`SandboxNetworkProxy.test.ts` 受 `listen EPERM 127.0.0.1` 影响，`TerminalAdapter.test.ts` 受 `sandbox-exec Operation not permitted` 影响，`DecayDetector.test.ts` 的 `symbol_drift` 断言单独复跑仍失败。
- `npm run check`：未通过；typecheck 通过后在 `npm run lint` 阶段被上述既有 lint errors 阻断。

## 残留扫描

已清零：

```text
@alembic/core/shared/*
@alembic/core/infrastructure/config/*
@alembic/core/types/reactive-evolution
@alembic/core/types/snapshot-views
@alembic/core/service/candidate/*
```

保留并记录为 Core 3B-Core-2 缺口：

```text
@alembic/core/types/workflows
```

残留位置：

- `config/core-import-boundary.json`
- `lib/external/mcp/handlers/types.ts`
- `lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts`
- `lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts`
- `lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionAdmission.ts`
- `lib/workflows/capabilities/execution/internal-agent/BootstrapRuntimeInitializer.ts`
- `lib/workflows/capabilities/execution/internal-agent/DimensionRestoreState.ts`
- `lib/workflows/capabilities/execution/internal-agent/MockBootstrapPipeline.ts`
- `lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillPreparation.ts`
- `test/unit/WorkflowResultPersistence.test.ts`

## 遗留风险

- `@alembic/core/types/workflows` 未能按计划替换为 `@alembic/core/types`，总控下一步需要分派 Core 3B-Core-2 补齐 `types/workflows` facade export 后，再让 Alembic 删除该 residual allowlist 和 9 个代码 imports。
- `npm run lint` / `npm run check` 当前受既有 lint errors 阻断；本轮没有扩大这些错误，但单仓库完整验收不能写为通过。
- `npm run test:unit` 当前受宿主 sandbox 限制和既有 `DecayDetector` 断言失败影响；本轮相关 facade/mock 单测已单独通过。

## 下一步建议

- AlembicCore 增补 `@alembic/core/types` 对 workflow contract 类型的 re-export，并复跑 Core public API smoke/report。
- Core 补齐后，Alembic 立即将 9 个 `@alembic/core/types/workflows` imports 收敛到 `@alembic/core/types`，删除 boundary allowlist residual，再复跑本轮负向扫描和 `build:check`。
- AlembicPlugin 执行同波任务时也应先检查同一 Core facade 缺口，避免在 Plugin 侧重复遇到 `types/workflows` 无导出问题。
