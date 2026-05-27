# AlembicPlugin Core Facade Consumer Replacement Wave 3B

日期：2026-05-18
窗口：AlembicPlugin
状态：已完成
提交：`f185e95127411b9b6fcac6df43709be9b1ccee54`
补丁提交：`8f48fd1d2b56e0136919414d68e7da93b1707141`
最终收口提交：`e4211907c870f1c6d044c3606e94c014f927c05a`
总控文档：`docs/workspace/alembic-core-facade-readiness-wave-3b-consumer-plan-2026-05-18.md`

## 完成范围

- 已在 AlembicPlugin 内按 Wave 3B consumer map 替换可安全收敛的 Core deep imports：
  - `@alembic/core/shared/*` 收敛到 `@alembic/core/shared`。
  - `@alembic/core/shared/similarity` 收敛到 `@alembic/core/search`。
  - `@alembic/core/infrastructure/config/*` 收敛到 `@alembic/core/config`。
  - `@alembic/core/service/candidate/*` 收敛到 `@alembic/core/service/candidate`。
  - `@alembic/core/types/reactive-evolution`、`@alembic/core/types/snapshot-views`、`@alembic/core/types/workflows` 收敛到 `@alembic/core/types`，并保持 workflow contract 为 type-only import。
- 已同步 static imports、dynamic imports、`vi.mock` / `vi.doMock` 相关测试 mock。
- 已收紧 `config/core-import-boundary-allowlist.json`，`uniqueSpecifierCount` 从 79 降到 65，并移除本波已替换旧 deep specifier。
- 已保持 AlembicPlugin agent-free / artifact-only 边界；本波未刷新 portable runtime、未更新 vendor、未运行 release / marketplace / publish 链路。

## 已解除阻塞项

- 已清理总控复核追加的非阻塞 residual：`test/unit/ContentImpactAnalyzer.test.ts` 已从 `@alembic/core/shared/recipe-tokens` 收敛到 `@alembic/core/shared`；负向扫描 0 命中。
- Core 提交 `9506dca8ebcd0d59a208a640c7c373d8efd26a7c` 已补齐 `@alembic/core/types` workflow contract type-only facade；`lib/external/mcp/handlers/types.ts` 已切到 `@alembic/core/types`。
- Core 同一提交已补齐 `@alembic/core/search` individual signal runtime exports；`test/unit/SearchRanking.test.ts` 已通过 51 tests。

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `npm run lint:consumer-core-imports` | 通过；scanned 320 files / 505 `@alembic/core` imports。 |
| `npm run lint:core-import-boundary` | 通过；复用 consumer core import lint。 |
| `npm run build:check` | 通过；Core build used `../AlembicCore @ 9506dca8ebcd0d59a208a640c7c373d8efd26a7c`。 |
| `npm run lint` | 未通过；既有 Biome debt：`lib/bootstrap.ts` non-null assertion、`lib/cli/SetupService.ts` console 等，8 errors / 123 warnings / 29 infos。 |
| `npm run test:unit -- test/unit/SearchRanking.test.ts test/unit/ContentImpactAnalyzer.test.ts` | 通过；2 files / 77 tests passed。 |
| `npm run test:unit -- test/unit/KnowledgeAPI.test.ts` | 通过；49 tests passed。 |
| `npm run test:unit -- test/unit/ContentImpactAnalyzer.test.ts` | 通过；26 tests passed。 |
| `npm run test:unit` | 未通过；88 files / 1456 tests passed，5 files / 7 tests failed。失败集中不再包含 `SearchRanking`，剩余为既有非本轮失败。 |
| `npm run check` | 未通过；`typecheck` 通过，随后被既有 `npm run lint` 错误阻断。 |
| `npm run report:agent-extraction-boundary` | 通过；agent / AI / tool boundary import files 全部 0。 |
| `npm run verify:codex-plugin` | 通过；Codex plugin verification passed。 |
| `npm run smoke:codex-plugin` | 通过；install / stdio / npxRuntime passed，recovery / daemon skipped。 |
| 目标旧 specifier 负向扫描 | 通过；0 命中。 |
| `rg -n "@alembic/core/types/workflows" lib bin scripts test config` | 0 命中。 |
| `rg -n "@alembic/core/shared/recipe-tokens" lib bin scripts test config` | 0 命中。 |
| `rg -n "@alembic/agent" lib bin scripts test config package.json` | 0 命中。 |
| `git diff --check` | 通过。 |
| `git status --short` | AlembicPlugin 仓库代码提交后干净。 |

## 残留扫描结果

- 本波目标旧 deep specifier 负向扫描：已清零。
- 非阻塞 residual：`@alembic/core/shared/recipe-tokens` 已清零。
- Core 缺口 residual：`@alembic/core/types/workflows` 已清零。
- Agent-free 扫描：`@alembic/agent` 0 命中；agent / AI / tool boundary report 0 命中。

## 遗留风险

- 本波目标 residual 已清零；后续不要重新引入 `@alembic/core/types/workflows`、`@alembic/core/shared/recipe-tokens` 或其它本波旧 deep specifier。
- `@alembic/core/types` 仍是 provisional public facade，Plugin 侧 workflow contract 必须保持 type-only import。
- 完整 `npm run lint` / `npm run check` 仍受既有 lint debt 阻塞；本波未扩大范围修复 unrelated style debt。
- 完整 `npm run test:unit` 还存在既有非本轮失败：`BootstrapTerminalToolset` 缺失已删除文件、`CodexPluginCacheSync` 超时、`SemanticMemoryCompletionStep` 异常断言、`WikiGenerator` null/undefined 断言、`WorkflowCompletionFinalizer` 缺失 `readFileSync` import。
- 本波未刷新 portable runtime、未更新 vendor、未运行 release / channel / marketplace 发布链路；这符合总控禁止事项。

## 下一步建议

- 总控已把 AlembicPlugin 记为已完成：代码提交、目标扫描、构建、定向单测、agent-free report、Codex plugin verify/smoke 均已补齐；完整 lint/check/unit 的剩余失败为既有债务。
- 另开独立清理波处理 AlembicPlugin 既有 lint debt 与非本轮 unit failures，避免和 facade replacement 混在同一提交。
