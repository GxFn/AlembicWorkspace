# AlembicPlugin Core interface consumer agent-free scan Wave 1

更新日期：2026-05-18

状态：`已完成；等待 workspace 总控验收`

本文件回填 `docs/workspace/alembic-core-agent-interface-boundary-workspace-plan-2026-05-18.md` 分配给 `AlembicPlugin` 的 Wave 1 任务。执行范围是复验 Plugin 作为 Core consumer 的 import boundary、agent-free gate、无 `@alembic/agent` 依赖，并给 Core 后续 stable facade / transitional allowlist 收口提供真实调用点。

## 完成范围

- 已复验 `AlembicPlugin` Core import boundary：315 个文件、517 个 `@alembic/core` imports，issue count 为 0。
- 已复验 Core import 分类：Stable 357、Provisional 8、Transitional 152。
- 已复验 agent-free gate：Agent / AI / Tool boundary summary 均为 0。
- 已复验源码、脚本、config、插件资源和测试范围内无 `@alembic/agent` import。
- 已分析 152 个 Core transitional refs 的真实调用面，并列出后续 Core stable facade / transitional adapter 建议。

## 提交

- 无新增代码提交。本轮为证据扫描和文档回填。
- `AlembicPlugin` 复验基线：`12b7dd2fdb4d8654d78e548cce8a6692c4fd96be`

## 验证命令

| 命令 | 结果 | 说明 |
| --- | --- | --- |
| `npm run report:agent-extraction-boundary` | 通过 | 扫描 315 个文件；filesWithBoundaryImports、agent/ai/tool outside implementation counts 均为 0。 |
| `npm run lint:core-import-boundary` | 通过 | 内部调用 `lint:consumer-core-imports`，315 个文件、517 个 `@alembic/core` imports，0 issue。 |
| `npm run lint:consumer-core-imports` | 通过 | 315 个文件、517 个 `@alembic/core` imports，0 issue。 |
| `node vendor/AlembicCore/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary-allowlist.json --format=json` | 通过 | Stable 357、Provisional 8、Transitional 152、issueCount 0。 |
| `npm run build:check` | 通过 | `build:core` 与 `tsc --noEmit` 通过。 |
| `npm run check` | 通过 | `typecheck`、`lint`、`lint:core-import-boundary` 均完成；Biome 仍输出既有 123 warnings / 29 infos，但命令退出码为 0。 |
| `rg -n "@alembic/agent" lib bin config scripts plugins test --glob "*.ts" --glob "*.js" --glob "*.mjs" --glob "*.json"` | 通过 | 0 命中，`rg` 退出码 1 表示未找到匹配。 |

## Core contract 缺口反馈

当前没有阻塞 `AlembicPlugin` 的 Core contract 缺口：consumer lint 已通过，现有 `config/core-import-boundary-allowlist.json` 能冻结并限制 transitional refs。

仍需 Core 后续判断的真实调用点如下：

| 类别 | 代表 specifier | refs | 生产 refs | 判断 |
| --- | --- | ---: | ---: | --- |
| Knowledge sync / startup | `@alembic/core/service/knowledge/KnowledgeSyncService` | 6 | 5 | Plugin setup、DI、UI startup 真实使用；适合 Core 后续提供 narrow stable knowledge sync facade，或继续冻结为 transitional service adapter。 |
| Evolution service | `@alembic/core/service/evolution/EvolutionGateway` | 5 | 4 | MCP consolidate/evolve、DI、file change handler 真实使用；若 Core 推 evolution stable facade，应优先覆盖 gateway / executor / patcher / staging 这组调用。 |
| Developer identity / settings | `@alembic/core/shared/developer-identity`、`@alembic/core/shared/WorkspaceSettingsStore` | 10 | 8 | MCP handler、health route、Codex status / host AI adapter 真实使用；适合收敛到 workspace/config utility facade。 |
| Capability probing | `@alembic/core/core/capability/CapabilityProbe` | 4 | 3 | MCP server、HTTP server、role resolver 真实使用；可考虑 stable capability facade，避免继续依赖 deep core path。 |
| Plugin path/config utility | `@alembic/core/infrastructure/config/Paths` | 4 | 4 | Skill、structure、workflow skill completion 使用；可进入 workspace/io/config facade 判断。 |
| Candidate/search support | `@alembic/core/service/candidate/SimilarityService` | 4 | 4 | Candidate、consolidated proposal、HTTP search、DI 使用；可由 search/knowledge stable facade 覆盖。 |
| Knowledge service internals | `ConfidenceRouter`、`SourceRefReconciler`、`CodeEntityGraph`、`KnowledgeFileWriter`、`KnowledgeGraphService` | 14 | 11 | 多为 DI 和 bootstrap wiring；短期继续 allowlist，长期需要 Core 判断是否暴露 service bundle facade。 |
| Signal/report infrastructure | `ReportStore`、`SignalTraceWriter`、`SignalAggregator`、`SignalBridge` | 7 | 7 | HTTP signals 与 SignalModule 真实使用；建议 Core 判断 report/signal 是否需要 provisional 到 stable。 |
| Database / repository adapter | `@alembic/core/infrastructure/database/drizzle`、`schema`、`RepositoryBase`、具体 repository | 9 | 4 | 生产侧 audit store/repository 仍碰 Core DB/schema/repository base；不建议直接稳定 Drizzle schema，可保留 adapter allowlist 或由 Core 提供 repository contract。 |
| Test-only internals | AST language parsers、migration schemas、knowledge value objects、repository mocks | 多个 | 0 | 主要是单元测试覆盖 Core 行为；可在测试 allowlist 中继续冻结，不应为测试专门新增 public facade。 |

## agent-free 复验结果

- `npm run report:agent-extraction-boundary`：agent / ai / tool 相关 boundary counts 全 0。
- `@alembic/agent` 指定范围扫描：0 命中。
- `AlembicPlugin` 本轮未新增 `@alembic/agent` dependency、import、vendor 或 runtime 资源。

## 遗留风险

- 152 个 Core transitional refs 仍存在，但均受 consumer allowlist 和 reference limits 约束；本轮没有发现无治理增长。
- `npm run check` 中 Biome warning/info 为既有代码风格提示，命令通过；本轮不做非目标清理。
- 若 Core Wave 2 新增 stable facade，Plugin 需要后续只同步 Core vendor 并按 facade 替换可替换 imports；不得引入 Agent。

## 下一步建议

- 等 `AlembicCore` Wave 1 给出三方 consumer 判断后，再决定 Plugin 是否进入 Wave 2 vendor sync / import replacement。
- Plugin 侧优先处理 knowledge sync、evolution service、workspace/config utility、capability probe、signal/report、repository adapter 这几类真实生产调用点。
- 即使 `AlembicAgent` 完成 full API governance，Plugin 也继续保持 `@alembic/agent` 0 依赖。
