# AlembicPlugin Core Facade Consumer Replacement Wave 3B

日期：2026-05-18
窗口：AlembicPlugin
状态：阻塞
提交：`f185e95127411b9b6fcac6df43709be9b1ccee54`
总控文档：`docs/workspace/alembic-core-facade-readiness-wave-3b-consumer-plan-2026-05-18.md`

## 完成范围

- 已在 AlembicPlugin 内按 Wave 3B consumer map 替换可安全收敛的 Core deep imports：
  - `@alembic/core/shared/*` 收敛到 `@alembic/core/shared`。
  - `@alembic/core/shared/similarity` 收敛到 `@alembic/core/search`。
  - `@alembic/core/infrastructure/config/*` 收敛到 `@alembic/core/config`。
  - `@alembic/core/service/candidate/*` 收敛到 `@alembic/core/service/candidate`。
  - `@alembic/core/types/reactive-evolution`、`@alembic/core/types/snapshot-views` 收敛到 `@alembic/core/types`。
- 已同步 static imports、dynamic imports、`vi.mock` / `vi.doMock` 相关测试 mock。
- 已收紧 `config/core-import-boundary-allowlist.json`，`uniqueSpecifierCount` 从 79 降到 65，并移除本波已替换旧 deep specifier。
- 已保持 AlembicPlugin agent-free / artifact-only 边界；本波未刷新 portable runtime、未更新 vendor、未运行 release / marketplace / publish 链路。

## 阻塞项

- `@alembic/core/types/workflows` 仍保留 1 个代码 residual：`lib/external/mcp/handlers/types.ts`。原因是 Core `@alembic/core/types` 当前未导出 `BootstrapFile`、`DimensionCheckpointResult`、`LoggerLike`、`SaveSnapshotParams` 等 workflow contract 类型；强行替换会使 `npm run build:check` 失败。
- `test/unit/SearchRanking.test.ts` 当前通过 `@alembic/core/search` 读取 `RelevanceSignal` 等 individual signal classes，但 Core `@alembic/core/search` runtime facade 未 re-export 这些类，导致完整 unit suite 失败。建议 Core 3B-Core-2 一并补齐 search facade signal exports，或明确调整 public contract 后由 consumer 更新测试。

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `npm run lint:consumer-core-imports` | 通过；scanned 320 files / 507 `@alembic/core` imports。 |
| `npm run lint:core-import-boundary` | 通过；复用 consumer core import lint。 |
| `npm run build:check` | 通过；使用 `../AlembicCore` 提交 `75fac5642b6da736a00667539a720172d23b85c3`。 |
| `npm run lint` | 未通过；既有 Biome debt：`lib/bootstrap.ts` non-null assertion、`lib/cli/SetupService.ts` console 等，8 errors / 123 warnings / 29 infos。 |
| `npm run test:unit -- test/unit/KnowledgeAPI.test.ts` | 通过；49 tests passed。 |
| `npm run test:unit` | 未通过；87 files / 1405 tests passed，6 files / 7 tests failed。`KnowledgeAPI` 本轮 mock 问题已修复。 |
| `npm run check` | 未通过；`typecheck` 通过，随后被既有 `npm run lint` 错误阻断。 |
| `npm run report:agent-extraction-boundary` | 通过；agent / AI / tool boundary import files 全部 0。 |
| `npm run verify:codex-plugin` | 通过；Codex plugin verification passed。 |
| `npm run smoke:codex-plugin` | 通过；install / stdio / npxRuntime passed，recovery / daemon skipped。 |
| 目标旧 specifier 负向扫描 | 除 `@alembic/core/types/workflows` 外 0 命中。 |
| `rg -n "@alembic/core/types/workflows" lib bin scripts test config` | 1 命中：`lib/external/mcp/handlers/types.ts`。 |
| `rg -n "@alembic/agent" lib bin scripts test config package.json` | 0 命中。 |
| `git diff --check` | 通过。 |

## 残留扫描结果

- 本波目标旧 deep specifier 负向扫描：0 命中。
- 例外 residual：`@alembic/core/types/workflows` 1 命中，等待 Core facade 补齐后再删除。
- Agent-free 扫描：`@alembic/agent` 0 命中；agent / AI / tool boundary report 0 命中。

## 遗留风险

- Core 3B-Core-2 未完成前，AlembicPlugin 不能把 `types/workflows` 最后一个 type import 收敛到 `@alembic/core/types`。
- Core `@alembic/core/search` 未导出 individual signal classes，会持续阻塞 `SearchRanking.test.ts`。
- 完整 `npm run lint` / `npm run check` 仍受既有 lint debt 阻塞；本波未扩大范围修复 unrelated style debt。
- 完整 `npm run test:unit` 还存在既有非本轮失败：`BootstrapTerminalToolset` 缺失已删除文件、`CodexPluginCacheSync` 超时、`SemanticMemoryCompletionStep` 异常断言、`WikiGenerator` null/undefined 断言、`WorkflowCompletionFinalizer` 缺失 `readFileSync` import。

## 下一步建议

- Core 执行 3B-Core-2：补齐 `@alembic/core/types` 对 `types/workflows.ts` 的 workflow contract re-export，并补齐或明确 `@alembic/core/search` individual signal public contract。
- Core 补齐后，AlembicPlugin 再删除 `@alembic/core/types/workflows` residual，复跑本波验证。
- 另开独立清理波处理 AlembicPlugin 既有 lint debt 与非本轮 unit failures，避免和 facade replacement 混在同一提交。
