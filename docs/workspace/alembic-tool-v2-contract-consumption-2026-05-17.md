# Alembic Tool V2 Contract Consumption

日期：2026-05-17
窗口：Alembic
状态：已完成

本文承接 `alembic-agent-extraction-boundary-wave-2-acceptance-next-plan-2026-05-17.md` 第 5.1 节，记录 Alembic 窗口消费 `@alembic/agent/tools/v2` 的执行结果。

## 1. 完成范围

- Alembic 生产侧 Tool V2 组合入口已消费 `@alembic/agent/tools/v2`：
  - `V2CapabilityCatalog`
  - `V2ToolRouterAdapter`
  - `DeltaCache`
  - `SearchCache`
  - `OutputCompressor`
  - `ToolContext`
  - `TOOL_REGISTRY`
  - `ToolRouterV2`
  - V2 public types
- 本地 `ToolContextFactory` 保留为 host-owned bridge，继续负责：
  - DI container service lookup
  - repository / search / gateway 注入
  - projectRoot / dataRoot 上下文
  - sandbox bridge
  - abortSignal / memoryCoordinator / runtime 透传
- 代表性 Tool V2 tests 已改为通过 `@alembic/agent/tools/v2` 覆盖 generic registry / router / cache / compressor / handler 行为。
- `config/agent-extraction-boundary.json` 已新增本阶段证据、保留路径、风险和下一步建议。
- `scripts/lint-agent-extraction-boundary.mjs` 已新增 `@alembic/agent/tools/v2` consumer 计数。

## 2. 提交

- Alembic：`14faa15 chore: consume agent tool v2 contracts`

## 3. 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run lint:agent-extraction-boundary` | 通过；`@alembic/agent/tools/v2 consumer files: 4`，`deferred local tool import files: 2`，`local common tool consumers: 0`，`alembic-main-tool-v2-context-factory: 1`。 |
| `npm run build:check` | 通过。 |
| `npm run lint -- --diagnostic-level=error` | 通过。 |
| `npm run test:unit -- test/unit/V2ToolSystem.test.ts test/unit/v2/ToolRegistryV2.test.ts test/unit/knowledge-manage-evolution.test.ts` | 通过；3 个 test files、75 个 tests。 |
| `npm run check` | 通过；现有 Biome warnings 未阻断。 |
| `npm run build` | 通过。 |
| `node dist/bin/cli.js status --json` | 通过；workspace detected，当前测试环境 database not found。 |

## 4. 遗留风险

- 本地 `lib/tools/v2/**` generic implementation 文件仍存在，当前只完成消费切换和边界收缩，尚未删除重复实现。
- `ToolContextFactory` 仍需保留在 Alembic，因为它绑定 host DI、repository/search/gateway、project root、sandbox bridge 等宿主上下文。
- `@alembic/agent/tools/v2` 未导出 handler 深层子路径；Alembic 测试通过公共 `TOOL_REGISTRY` 覆盖 handler 行为，而不是直接 import handler 文件。

## 5. 下一步建议

- 下一波在 Alembic 内做一次 unused local Tool V2 implementation 删除 / quarantine 计划，只删除已由 `@alembic/agent/tools/v2` 覆盖的 generic 文件。
- 删除前保留 `ToolContextFactory` 和 host adapters，并再次跑边界扫描、Tool V2 tests、full build/check。
- 若删除阶段发现 `@alembic/agent/tools/v2` 缺少必要 public contract，由 AlembicAgent 补 export / type，而不是让 Alembic 继续维护第二套 generic implementation。
