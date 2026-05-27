# AlembicPlugin CCIC-4 Core Consumer Replacement

日期：2026-05-23
状态：待验收
窗口：AlembicPlugin

## 窗口定位

当前窗口定位：`AlembicPlugin` 执行窗口。

目标仓库职责：`AlembicPlugin` 负责 Codex MCP、Skill、channel / marketplace、Codex plugin runtime、安装验证和 Codex 宿主适配。

本轮任务职责：领取 `CCIC-P4-P`，只消费 `AlembicCore` CCIC-P3 已验收 facade，将 Plugin 内高引用 Core deep imports 迁到 `@alembic/core/knowledge`、`@alembic/core/evolution`、`@alembic/core/repositories`、`@alembic/core/events` 和 provisional `@alembic/core/infrastructure/report`，收紧 core import boundary config，并同步 AlembicCodex runtime artifact。

明确不承担：不修改 `Alembic` 主仓库，不新增 Core facade，不删除 Core public export，不重新打开 Plugin audit contract，不删除 host-managed legacy compatibility，不把 Plugin 改成 Alembic daemon 空壳 client，不启动真实项目 / AlembicTest 复测。

## 完成范围

- 将 `@alembic/core/service/knowledge/*` 消费迁移到 `@alembic/core/knowledge`，覆盖 CLI setup/sync、KnowledgeModule、bootstrap startup、相关 unit / integration tests。
- 将 `@alembic/core/service/evolution/*` 消费迁移到 `@alembic/core/evolution`，覆盖 MCP consolidate/evolve handler、HTTP evolution route、DI、evolution tests。
- 将 repository high-reference paths 迁移到 `@alembic/core/repositories`，覆盖 `SyncRepoAdapter`、`TokenUsageStore`、`ProposalRepository`、`BootstrapRepository`、`CodeEntityRepository`、`KnowledgeEdgeRepository` 等消费。
- 将 `@alembic/core/infrastructure/signal/*` 迁移到 `@alembic/core/events`，将 `ReportStore` 迁移到 provisional `@alembic/core/infrastructure/report`。
- 更新 `config/core-import-boundary-allowlist.json`：删除本轮归零的 high-reference deep import allowlist / reference limits，`referenceCount` 收敛到 `461`，`uniqueSpecifierCount` 保持 `39`。
- 同步 `plugins/alembic-codex/runtime`、`runtime/config/core-import-boundary-allowlist.json`、`runtime/vendor/AlembicCore` snapshot 和 `runtime.tgz`。

## 保留边界

本轮按计划保留以下路径，不做伪迁移：

- `@alembic/core/core/enhancement`
- `@alembic/core/core/capability/CapabilityProbe`
- `@alembic/core/core/ast/lang-*`
- `@alembic/core/infrastructure/database/*` 与 migration deep imports
- `@alembic/core/service/candidate`
- `@alembic/core/service/bootstrap/BootstrapDedup`
- `@alembic/core/service/quality/*`
- `@alembic/core/service/recipe/*`
- `@alembic/core/service/evolution/ContentImpactAnalyzer`

## 提交

- AlembicPlugin：`2060aed9dd0fa0eb684df52826f15dbdac820918`
- AlembicCodex runtime artifact：`add1db81adfbe1ac7d76e24e432012c35904b21a`
- `plugins/alembic-codex/runtime.tgz` SHA-256：`5d2012d38d776ff4d3e67b4eaed211a3d6efaedd594ae1cb62c06efbd978d010`
- vendored Core snapshot：`5994a058038217635580cf68358c0e133c73f747`

## 验证

通过：

- `npm run lint:consumer-core-imports`：334 files / 461 `@alembic/core` imports，0 issue。
- `npm run lint:repo-boundary`：通过，escape hatch 0 / 75。
- `npm run build:check`：通过。
- `npm run test:unit -- test/unit/KnowledgeFileWriter.test.ts test/unit/KnowledgeService.test.ts test/unit/EvolutionGateway.test.ts test/unit/ProposalExecutor.test.ts test/unit/DecayDetector.test.ts test/unit/RedundancyAnalyzer.test.ts test/unit/ConsolidationAdvisor.test.ts test/unit/content-patcher.test.ts test/unit/RecipeImpactPlanner.test.ts test/unit/SourceRefReconciler-signal.test.ts test/unit/lifecycle-supervisor.test.ts`：11 files / 193 tests 通过。
- `node_modules/.bin/vitest run --config vitest.config.ts test/integration/ServiceContainer.test.ts test/integration/KnowledgeGovernance.test.ts test/integration/GoSupport.test.ts`：3 files / 68 tests 通过；`GoSupport` 中 gin 真实项目缺失用例按既有逻辑跳过。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过，刷新 `plugins/alembic-codex/runtime.tgz`。
- `npm run verify:codex-plugin`：通过，`runtime.tgz -> alembic-ai@0.2.0`。
- `npm run verify:codex-channel`：通过，`alembic-ai@0.2.0`。
- `npm run report:agent-extraction-boundary`：source files 334，agent / AI / tool outside implementation 均为 0。
- replacement 负向扫描：源码与 runtime 对 `service/knowledge`、本轮排除 `ContentImpactAnalyzer` 以外的 `service/evolution`、repository high-reference、`infrastructure/signal`、`infrastructure/report/*` 均无命中。
- Agent / AI / tool 禁止项扫描：仅命中 `scripts/report-agent-extraction-boundary.mjs` 自检规则字符串。
- `git diff --check`：通过。
- `git -C plugins/alembic-codex diff --check`：通过。

## 遗留风险

- `@alembic/core/core/enhancement`、CapabilityProbe、AST lang、database / migration、candidate / bootstrap / quality / recipe、`ContentImpactAnalyzer` 等路径仍按本轮计划保留；是否继续下沉为 stable facade 需要下一波基于真实消费方分类。
- `@alembic/core/infrastructure/report` 仍是 provisional exact entry，本轮只做 consumer replacement，不改变 Core public API 状态。
- 未刷新本机 Codex plugin cache；本轮只刷新仓库内 runtime artifact。若总控需要让本机 Codex 立刻消费新 artifact，需要另行派发 cache refresh。
- 未创建 AlembicTest 复测单；本轮不改变真实项目 prime/search/cold-start 用户路径。

## 下一步建议

- 总控验收 `CCIC-P4-A` / `CCIC-P4-P` 后关闭 `CCIC-TODO-16`。
- 将本轮保留 deep paths 继续留在 `CCIC-TODO-19` 做后续分类，不要把它们混入本轮验收。
- 若后续准备删除 Core public export 或 Alembic `lib/external/mcp` legacy alias，需要先做新的 consumer scan 和独立确认门禁。
