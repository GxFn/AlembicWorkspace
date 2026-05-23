# Alembic CCIC-4 Main Execution Record

日期：2026-05-23
窗口：Alembic
任务包：CCIC-P4-A
状态：待总控验收

## 当前窗口定位

- 当前窗口：`Alembic` 执行窗口。
- 目标仓库：`Alembic` 主仓库。
- 本轮仓库职责：本地增强底座、CLI、daemon、HTTP/API、Dashboard server、ProjectRegistry、file monitor、JobStore、internal AI jobs、平台能力和本地安装 / dev / release。
- 本轮任务职责：只完成 Alembic 侧 high-reference Core consumer replacement，消费 Core P3 已验收 facade。
- 明确不承担：不修改 `AlembicCore` public exports，不处理 `AlembicPlugin` runtime artifact，不操作 `AlembicAgent` / `AlembicDashboard` / `AlembicTest`，不删除 `lib/external/mcp` compatibility alias，不处理本波排除的 Core deep paths。

## 完成范围

- 将 Alembic 中已由 Core P3-C 验收的 high-reference Core deep imports 迁到 facade：
  - `@alembic/core/service/knowledge/*` -> `@alembic/core/knowledge`
  - `@alembic/core/service/evolution/*` -> `@alembic/core/evolution`
  - `@alembic/core/repository/{evolution,knowledge,sourceref,sync,token}/*` -> `@alembic/core/repositories`
  - `@alembic/core/infrastructure/signal/*` -> `@alembic/core/events`
  - `@alembic/core/infrastructure/report/ReportStore` -> provisional `@alembic/core/infrastructure/report`
- 覆盖范围包括 CLI、setup/sync service、DI modules、HTTP routes、resident legacy handler consumer、knowledge rescan workflow、bootstrap runtime helpers 和相关 unit / integration tests。
- 更新 `config/core-import-boundary.json`：移除已归零 high-reference deep import allowlist / reference limits；保留 `@alembic/core/service/evolution/ContentImpactAnalyzer` 1 个受限残留，等待 CCIC-TODO-19 分类。
- 本轮未删除 Core public export、未删除 `lib/external/mcp` alias、未迁移 `core/enhancement` / CapabilityProbe / AST lang / database / migration / candidate / bootstrap / quality / recipe / domain value paths。

## 提交

- Alembic：`b3eb9ab0accf597dd046b4fc2bcb8cfc8d20ca34`
- 提交信息：`refactor: consume core facade imports`

## 验证命令与结果

- `npm run lint:consumer-core-imports`：通过，扫描 370 个文件、456 个 `@alembic/core` imports。
- `npm run build:check`：通过。
- `npm run lint:repo-boundary`：通过。
- `npm run test:unit -- test/unit/ProposalExecutor.test.ts test/unit/ConsolidatedProposal.test.ts test/unit/lifecycle-supervisor.test.ts test/unit/RedundancyAnalyzer.test.ts test/unit/EvolutionGateway.test.ts test/unit/FileChangeHandler.test.ts test/unit/ContentImpactAnalyzer.test.ts`：通过，7 files / 106 tests。
- `./node_modules/.bin/vitest run test/integration/KnowledgeCRUD.test.ts test/integration/KnowledgeGovernance.test.ts test/integration/GoSupport.test.ts`：通过，3 files / 83 tests；Go fixture 缺失的用例按测试原逻辑跳过。
- `rg -n "@alembic/core/(service/knowledge|service/evolution/(ConsolidationAdvisor|ContentPatcher|DecayDetector|EnhancementSuggester|EvolutionGateway|LifecycleStateMachine|ProposalExecutor|RecipeImpactPlanner|RedundancyAnalyzer|StagingManager)|repository/(evolution|knowledge|sourceref|sync|token)|infrastructure/signal)" bin lib test config package.json`：无命中。
- `git diff --check`：通过。
- `git status --short --branch`：`## main...origin/main [ahead 1]`，无未提交变更。

## 额外观察

- `npm run lint` 仍会命中既有 Biome 债，例如 `lib/bootstrap.ts` / `lib/cli/AiScanService.ts` 的非空断言等；这不是本轮变更引入，也不属于 CCIC-P4-A 指定验证门禁。
- 对本轮触达文件已执行 Biome safe fix；剩余 diagnostics 是既有 lint 债或测试文件中的历史 `any` / 非空断言警告。

## 负向扫描剩余命中

- `@alembic/core/infrastructure/report`：provisional exact facade，当前由 `ReportStore` consumers 使用，已在本记录标注。
- `@alembic/core/service/evolution/ContentImpactAnalyzer`：本波明确排除项，运行时代码保留 1 处受限导入；相关 test / mock 继续覆盖该 residual path。
- 本轮应替换的 high-reference `service/knowledge/*`、指定 `service/evolution/*`、repository high-reference paths 和 `infrastructure/signal/*` 已无命中。

## 遗留风险

- `ReportStore` 仍是 Core provisional exact entry，不是 stable facade；后续需要 Core / consumer 联合决定是否提升为 stable report facade。
- `ContentImpactAnalyzer`、`core/enhancement`、CapabilityProbe、AST lang、database / migration、candidate / bootstrap / quality / recipe、domain value paths 仍需 CCIC-TODO-19 分类，不应在本轮伪迁移。
- `lib/external/mcp` compatibility alias 仍按 CCIC-P3-A 证据保留，删除前需要另开 consumer scan 和总控确认。
- 本轮未触发真实项目 prime/search/cold-start、Dashboard 手动体验或 Codex plugin cache 验证，因此不创建 AlembicTest 测试单。

## 下一步建议

- 总控验收 Alembic `CCIC-P4-A` 后，可把 Alembic 窗口从待启动改为已完成 / 待下一波，继续等待 `AlembicPlugin` 的 `CCIC-P4-P` 回填。
- 等 Alembic / Plugin 两侧 consumer replacement 都通过后，再统一评估 `CCIC-TODO-17` legacy alias 删除与 `CCIC-TODO-19` residual Core path 分类。
