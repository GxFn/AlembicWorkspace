# Alembic Core / Agent interface consumer scan Wave 1

日期：2026-05-18

状态：`已完成`

总控计划：`docs/workspace/alembic-core-agent-interface-boundary-workspace-plan-2026-05-18.md`

提交 hash：无新增代码提交；Alembic 基线为 `ea816fcba9934dcf2bad942cb8424459c0e46455`

## 完成范围

- 复验 Alembic 作为宿主消费方仍只通过 `@alembic/agent` public subpath 消费 Agent 能力。
- 复验没有恢复 `lib/agent/**`、generic Tool V2 duplicate、terminal duplicate、memory/context duplicate、service/runtime/prompts/domain duplicate。
- 复验 Core consumer boundary：Alembic 当前 601 个 `@alembic/core` refs 全部被现有边界配置治理，issue 为 0。
- 复验 `@alembic/agent` 当前 15 个 public subpath 均可从 Alembic 消费环境 import。
- 列出 Agent/Core contract 缺口反馈：本轮 Alembic 无阻塞性新 public subpath 或 Core stable facade 诉求；后续等待 Core/Agent Wave 1 对 transitional imports 的治理结论。

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run lint:agent-extraction-boundary` | 通过；product `#agent` call sites 0；local Agent relative imports 0；duplicate generic Tool V2 / terminal / memory-context / service-runtime-prompts-domain 0。 |
| `npm run lint:core-import-boundary` | 通过；scanned 451 files / 601 `@alembic/core` imports。 |
| `npm run lint:consumer-core-imports` | 通过；scanned 451 files / 601 `@alembic/core` imports。 |
| `npm run build:check` | 通过。 |
| `npm run check` | 通过；Biome 仍报告既有 warnings/infos，但命令退出码为 0。 |
| `node vendor/AlembicCore/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary.json --format=json` | 通过；stable-public 401、provisional-public 7、transitional-internal 193、issueCount 0。 |
| `node -e "<15 个 @alembic/agent public subpath import smoke>"` | 通过；输出 `agent public imports ok 15`。 |

补充扫描：

- `find lib -path '*/agent/*' -o -path 'lib/agent' -o -path 'lib/tools/v2/*'` 仅显示 `lib/tools/v2/adapter/ToolContextFactory.ts`，这是保留的 host-owned bridge。
- 本地相对 / alias duplicate 扫描仅命中：
  - `lib/injection/modules/AgentModule.ts` 对 `#tools/v2/adapter/ToolContextFactory.js` 的 host bridge import。
  - `test/unit/V2ToolSystem.test.ts` 中对同一 host bridge 的测试 import。
  - `test/unit/WorkflowResultPersistence.test.ts` 中 workflow consumer 测试 import。

## Agent 消费面

Alembic 当前源码/测试中的 `@alembic/agent` public subpath import 计数：

| Subpath | Refs |
| --- | ---: |
| `@alembic/agent/agent` | 5 |
| `@alembic/agent/ai` | 12 |
| `@alembic/agent/context` | 4 |
| `@alembic/agent/domain` | 1 |
| `@alembic/agent/forge` | 6 |
| `@alembic/agent/memory` | 29 |
| `@alembic/agent/profiles` | 1 |
| `@alembic/agent/prompts` | 6 |
| `@alembic/agent/runtime` | 14 |
| `@alembic/agent/service` | 27 |
| `@alembic/agent/tasks` | 2 |
| `@alembic/agent/tools` | 35 |
| `@alembic/agent/tools/terminal` | 10 |
| `@alembic/agent/tools/v2` | 5 |

`@alembic/agent` root aggregate 当前没有直接源码 import；public subpath smoke 仍覆盖 root 入口，防止 package export 断裂。

## Core 消费面

Core consumer scanner 结果：

- stable-public：401
- provisional-public：7
- transitional-internal：193
- issueCount：0

判断：

- Alembic 当前没有未治理的 Core import。
- 193 个 transitional refs 仍由 `config/core-import-boundary.json` 管控，不是本轮 Alembic 侧新增缺口。
- Alembic 侧不需要在 Wave 1 主动要求 Core 新增 stable facade；等 AlembicCore / AlembicAgent 对 Agent 的 14 个 transitional refs 给出 Wave 1 处理结论后，再决定是否跟随替换。

## Agent/Core contract 缺口反馈

- 新 Agent public subpath：暂无 Alembic 阻塞性诉求。当前已使用 subpath 均可 import，且边界 lint 通过。
- Core stable facade：暂无 Alembic 阻塞性诉求。Alembic 的 Core transitional refs 已在现有 allowlist 下治理，issue 为 0。
- 保留 host-owned adapter：`ToolContextFactory` 仍是 Alembic 本地 DI / repository / search / gateway / project-root / data-root / sandbox bridge，不应迁回 Agent。
- 后续同步：等 Core / Agent Wave 1 或 Wave 2 有新提交后，Alembic 再同步 `@alembic/agent` file dependency / `vendor/AlembicCore` 指针并复验。

## 遗留风险

- `npm run check` 仍有既有 Biome warnings/infos；本轮没有扩大。
- Alembic 仍有 193 个 Core transitional refs，虽然 issue 为 0，但长期要等 Core stable facade / consumer allowlist 收口策略推进。
- 当前使用 `@alembic/agent` file dependency 指向相邻 `AlembicAgent`；Agent 后续 public API governance 可能要求 Alembic 跟随更新 import 或锁定 smoke。

## 下一步建议

- 等 `AlembicCore` 与 `AlembicAgent` Wave 1 回填后，由总控判断是否进入 Wave 2 facade / allowlist 实现。
- 若 Agent 新增 package export policy 或 public subpath smoke，Alembic 后续同步后应重跑 `npm run lint:agent-extraction-boundary`、Core consumer lint、`npm run build:check`、`npm run check` 和 15 subpath import smoke。
- 继续禁止恢复本地 `lib/agent/**`、generic Tool V2 duplicate、terminal duplicate；真实宿主桥接只保留在已分类的 host-owned adapter。
