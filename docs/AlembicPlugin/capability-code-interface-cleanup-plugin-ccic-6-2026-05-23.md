# AlembicPlugin CCIC-6 Execution Record

日期：2026-05-23
窗口：AlembicPlugin
任务包：CCIC-P6-P
状态：待总控验收

## 窗口定位与职责

当前窗口定位为 `AlembicPlugin` 执行窗口。本仓库本轮职责是 Codex host agent 入口侧的消费层收敛：Codex MCP、Skill、channel / marketplace、插件 runtime、portable runtime artifact 和 Codex 宿主适配。

本轮只负责消费 CCIC-5 已验收的 Core stable / provisional facade，替换 AlembicPlugin 源码和测试中的 residual Core import，收紧 `config/core-import-boundary-allowlist.json`，并在源码进入 runtime dist 后同步 AlembicCodex runtime artifact。

明确不承担：不开发 Core 新 facade；不处理 Alembic 主仓库 `lib/external/mcp` alias 删除；不收窄 Dashboard parser；不触碰 AlembicAgent runtime / provider / tool system；不运行真实项目测试；不删除 host-managed legacy compatibility；不把 Plugin 改成 Alembic daemon 空壳 client。

## 完成范围

- 将 `CapabilityProbe` 消费从 `@alembic/core/core/capability/CapabilityProbe` 收敛到 provisional facade `@alembic/core/core/capability`，覆盖 MCP server、HTTP server、role resolver 和 ProbeResolver integration test。
- 将 `FeedbackCollector` / `QualityScorer` 消费从 service deep path 收敛到 `@alembic/core/service/quality`，覆盖 AppModule 与 ServiceMap。
- 将 `RecipeCandidateValidator` / `RecipeParser` 消费从 service deep path 收敛到 `@alembic/core/service/recipe`，覆盖 AppModule 与 ServiceMap。
- 将 `BootstrapDedup` 测试消费从 deep path 收敛到 `@alembic/core/service/bootstrap`。
- 将 `EvolutionPolicy` 测试消费从 `domain/evolution/EvolutionPolicy` 收敛到 stable facade `@alembic/core/evolution`。
- 将 `ContentImpactAnalyzer` functional helpers 从 `@alembic/core/service/evolution/ContentImpactAnalyzer` 收敛到 stable facade `@alembic/core/evolution`，覆盖 `FileChangeHandler` 和相关 tests / mock。
- 更新 `config/core-import-boundary-allowlist.json`：reference count 从 461 收敛到 457，unique specifier 从 39 收敛到 36；删除已归零旧 deep specifier，加入已验收 provisional facade。
- 保留并未触碰 `core/enhancement`、AST lang、Drizzle / migrations 等 CCIC-5 标为 keep-transitional / test-only / DB-infrastructure 的路径。
- 重建并同步 AlembicCodex runtime artifact，包含 runtime dist、runtime config、Core vendor snapshot 和 `runtime.tgz`。

## 关键代码证据

- `lib/external/mcp/McpServer.ts`、`lib/http/HttpServer.ts`、`lib/http/middleware/roleResolver.ts`：`CapabilityProbe` 改走 `@alembic/core/core/capability`。
- `lib/injection/modules/AppModule.ts`、`lib/injection/ServiceMap.ts`：quality / recipe services 改走 exact provisional facade。
- `lib/service/evolution/FileChangeHandler.ts`：`assessFileImpact` / `extractRecipeTokens` 与 evolution 类型统一从 `@alembic/core/evolution` 消费。
- `test/unit/{BootstrapDedup,ContentImpactAnalyzer,EvolutionPolicy,FileChangeHandler,production-gateway}.test.ts`、`test/integration/ProbeResolver.test.ts`：测试消费方同步到已验收 facade。
- `plugins/alembic-codex/runtime/dist/**` 与 `plugins/alembic-codex/runtime/config/core-import-boundary-allowlist.json`：runtime dist 与 source import boundary 保持一致。
- `plugins/alembic-codex/runtime/vendor/AlembicCore/.alembic-source.json`：vendor Core snapshot 指向 CCIC-5 Core 提交 `a60dde335d76e901d31fd32eb7762bee35e7c9ea`。

## 提交 Hash

- AlembicPlugin：`e5295ab57221e9ccbb7abb3a3099a7a83d3b1e3b`
- AlembicCodex runtime artifact：`fda5b97a3ed1d9f015f8cdec0afcffd5ec716010`
- `runtime.tgz` SHA-256：`238b29a55df42dca256971449805713dbebe42d05552d68b1d113bc4ddf3db15`

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run lint:consumer-core-imports` | 通过；334 files / 457 `@alembic/core` imports，issue count 0。 |
| `npm run lint:repo-boundary` | 通过；`@escape-hatch` count 0 / 75。 |
| `npm run build:check` | 通过；Core build 使用 `../AlembicCore @ a60dde335d76e901d31fd32eb7762bee35e7c9ea`。 |
| `npm run test:unit -- test/unit/FileChangeHandler.test.ts test/unit/ContentImpactAnalyzer.test.ts test/unit/BootstrapDedup.test.ts test/unit/EvolutionPolicy.test.ts test/unit/production-gateway.test.ts` | 通过；5 files / 115 tests。 |
| `./node_modules/.bin/vitest run test/integration/ProbeResolver.test.ts` | 通过；1 file / 18 tests。 |
| `npm run build` | 通过。 |
| `npm run prepare:codex-plugin-runtime` | 通过；生成 `plugins/alembic-codex/runtime.tgz`。 |
| `npm run verify:codex-plugin` | 通过；`runtime.tgz -> alembic-ai@0.2.0`。 |
| `npm run verify:codex-channel` | 通过；`alembic-ai@0.2.0`。 |
| `npm run report:agent-extraction-boundary` | 通过；agent / ai / tool outside implementation 全为 0。 |
| `rg -n "@alembic/core/(core/capability/CapabilityProbe\|service/bootstrap/BootstrapDedup\|domain/evolution/EvolutionPolicy\|service/quality/(FeedbackCollector\|QualityScorer)\|service/recipe/(RecipeCandidateValidator\|RecipeParser)\|service/evolution/ContentImpactAnalyzer)" lib test scripts bin config plugins/alembic-codex/runtime/dist` | 无命中，旧 deep import 已清空。 |
| `rg -n "@alembic/agent\|#agent/\|#tools/\|#external/ai\|lib/agent\|lib/tools\|lib/external/ai" lib test scripts bin plugins/alembic-codex/runtime/dist plugins/alembic-codex/runtime.tgz` | 仅命中 `scripts/report-agent-extraction-boundary.mjs` 自检规则；无产品源码 / runtime dist 禁止项。 |
| `git diff --check` | 通过。 |
| `git -C plugins/alembic-codex diff --check` | 通过。 |

补充记录：`npm run test:integration -- test/integration/ProbeResolver.test.ts` 因 package script 固定先执行完整 `vitest run test/integration`，在 sandbox 内触发非本轮相关的 HTTP server `listen EPERM ::1:3150` / `::1:3250`；目标 `ProbeResolver.test.ts` 在该次输出中已通过，随后使用 `./node_modules/.bin/vitest run test/integration/ProbeResolver.test.ts` 取得干净通过证据。

## 残留风险

- 本轮未处理 `core/enhancement`、AST lang、Drizzle / migrations；这些仍按 CCIC-5 分类保留为 keep-transitional / test-only / DB-infrastructure，不得伪迁移。
- 本轮不删除 Plugin host-managed legacy compatibility，不改变 Dashboard consumer contract。
- Runtime artifact 已同步，但未刷新本机 Codex plugin cache；若总控需要用本机 Codex cache 验证最新 artifact，需要另行安排 cache refresh。
- 未创建 AlembicTest 真实项目复测单；本轮只改变 import boundary / runtime artifact，不改变 prime/search/cold-start 用户路径。

## 下一步建议

- 总控验收本执行记录后，将 `CCIC-P6-P` 标为已完成或待总控复核通过；`CCIC-TODO-20` 中 Plugin 部分可关闭。
- 等 Alembic `CCIC-P6-A` 回填后，再统一判断是否进入 CCIC-7 host-managed legacy / release identity / Core public export deletion confirmation。
- 若后续发现 Core facade symbol gap，回到 AlembicCore additive readiness；本轮 Plugin 侧未发现 symbol gap。
