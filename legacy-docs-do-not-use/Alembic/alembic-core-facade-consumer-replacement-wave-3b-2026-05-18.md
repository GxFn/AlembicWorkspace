# Alembic Core Facade Consumer Replacement Wave 3B

日期：2026-05-18
窗口：Alembic
状态：已完成

收口说明：Core 3B-Core-2 已通过提交 `9506dca8ebcd0d59a208a640c7c373d8efd26a7c` 补齐 `@alembic/core/types` workflow contract type-only facade。Alembic 已删除剩余 `@alembic/core/types/workflows` residual，并保持 workflow contract 继续使用 `import type`。

## 完成范围

- 将 Alembic 主仓库内本波目标 `@alembic/core/shared/*` imports 收敛到 exact facade：多数使用 `@alembic/core/shared`，`folder-names` 使用 `@alembic/core/workspace`，`similarity` 使用 `@alembic/core/search`。
- 将 `@alembic/core/infrastructure/config/ConfigLoader`、`Defaults`、`Paths` 收敛到 `@alembic/core/config`。
- 将 `@alembic/core/service/candidate/CandidateAggregator`、`SimilarityService` 收敛到 `@alembic/core/service/candidate`。
- 将 `@alembic/core/types/reactive-evolution` 与 `@alembic/core/types/snapshot-views` 收敛到 `@alembic/core/types`，并保持 type-only imports。
- 同步更新 static imports、dynamic import、`vi.mock` / `vi.doMock` / `vi.doUnmock`，避免测试继续锁定旧 deep specifier。
- 收紧 `config/core-import-boundary.json`：移除已替换的本波旧 deep specifier allowlist，新增 `@alembic/core/config`、`@alembic/core/shared`、`@alembic/core/types`、`@alembic/core/service/candidate`。
- 删除剩余 9 个 `@alembic/core/types/workflows` code imports，并移除 `config/core-import-boundary.json` 中的 residual allowlist。
- 未触碰 vendor、release、portable runtime、npm publish 或远程指针。

## 提交

- Alembic：`64f30f68ffce13c350ca9c328e511e087ded3246` (`chore: consume core facade imports`)
- Alembic final residual cleanup：`3c8239cc7fa7428518f8d51436e52c52bdcca5c5` (`chore: finish core types facade consumption`)

## 验证命令

```bash
npm run lint:consumer-core-imports
npm run lint:core-import-boundary
npm run build:check
npm run test:unit -- test/unit/WorkflowResultPersistence.test.ts test/unit/BootstrapTerminalToolset.test.ts test/unit/KnowledgeAPI.test.ts test/unit/TestMode.test.ts test/unit/ProjectPaths.test.ts test/unit/folder-names.test.ts test/unit/ContentImpactAnalyzer.test.ts
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
- 目标相关单测：通过；7 files / 112 tests passed。
- Core consumer JSON scan：通过；issue 0；`stable-public=417`、`provisional-public=70`、`transitional-internal=112`、`referencesScanned=599`。相比 Wave 3A 基线，transitional references 从 179 降到 112。
- 负向扫描：本波目标旧 deep specifier 0 命中，包括 `@alembic/core/types/workflows`。
- `git diff --check`：通过。
- `git status --short`：Alembic 仓库干净。
- `npm run lint`：未通过；命中既有非本轮 lint errors，包括 `lib/bootstrap.ts`、`lib/cli/AiScanService.ts`、`lib/cli/deploy/FileManifest.ts`、`scripts/verify-context-api.ts`，共 14 errors / 295 warnings / 25 infos。本轮仅替换 import specifier 并删除 allowlist residual，没有引入这些 lint 规则问题。
- `npm run test:unit`：未通过；3 files failed / 148 passed，20 tests failed / 2261 passed / 2 errors。失败集中在非本轮目标：`SandboxNetworkProxy.test.ts` 受 `listen EPERM 127.0.0.1` 影响，`TerminalAdapter.test.ts` 受 `sandbox-exec Operation not permitted` 影响，`DecayDetector.test.ts` 的 `symbol_drift` 断言仍失败。
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

本次最终清零：

```text
@alembic/core/types/workflows
```

## 遗留风险

- 本波目标 residual 已清零；`@alembic/core/types` 仍是 provisional public facade，workflow contract 必须继续保持 `import type`。
- `npm run lint` / `npm run check` 当前受既有 lint errors 阻断；本轮没有扩大这些错误。
- `npm run test:unit` 当前受宿主 sandbox 限制和既有 `DecayDetector` 断言失败影响；本轮相关 facade/mock/workflow persistence 单测已单独通过。

## 下一步建议

- Alembic 本波已完成；总控可复跑 Core closeout report，看 `types/workflows` consumer refs 是否归零。
- 既有 lint debt、sandbox-bound unit failures 和 `DecayDetector` 断言失败应另开独立清理波处理。
