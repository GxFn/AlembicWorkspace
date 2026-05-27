# AlembicPlugin CCIC-5 Execution Record

日期：2026-05-23
状态：待总控验收
窗口：AlembicPlugin

## 窗口定位

- 当前窗口定位：`AlembicPlugin` 执行窗口。
- 目标仓库职责：Codex MCP、Skill、channel/marketplace、插件 runtime、安装验证和 Codex 宿主适配。
- 本轮任务职责：领取 `CCIC-P5-P`，只做 Plugin source / tests / runtime dist / vendor snapshot 的 residual Core import 分类和 runtime artifact 影响判断。
- 明确不承担：不删除 host-managed legacy compatibility，不重新引入 AI / Agent / Tool runtime，不把 Plugin 改成 Alembic daemon 空壳 client，不消费尚未由 Core P5-C 回填并经总控验收的新 facade，不运行真实项目测试。

## 完成范围

- 已读取 workspace `AGENTS.md`、当前计划 `docs/workspace/capability-code-interface-cleanup-workspace-plan-2026-05-22.md`、`AlembicPlugin/AGENTS.md`，并按 Plugin 窗口职责执行。
- 已扫描 AlembicPlugin source production、source tests、Codex runtime dist、runtime config 和 AlembicCore vendor snapshot 中的 `@alembic/core` residual imports。
- 已确认本轮没有安全可抢跑替换的已验收新 facade；Core P5-C 尚未回填前，Plugin 不猜接口。
- 未修改 AlembicPlugin 产品源码，未修改 AlembicCodex runtime artifact，未运行 `prepare:codex-plugin-runtime`。
- AlembicPlugin 产品提交 hash 保持：`2060aed9dd0fa0eb684df52826f15dbdac820918`。
- AlembicCodex runtime artifact 子仓库 hash 保持：`add1db81adfbe1ac7d76e24e432012c35904b21a`。
- `runtime.tgz` SHA-256 保持：`5d2012d38d776ff4d3e67b4eaed211a3d6efaedd594ae1cb62c06efbd978d010`。
- Vendor Core snapshot 保持：`runtime/vendor/AlembicCore/.alembic-source.json` 指向 Core `5994a058038217635580cf68358c0e133c73f747`，dependency 为 `file:vendor/AlembicCore`。

## 关键代码证据

`npm run lint:consumer-core-imports` 通过：扫描 334 files / 461 `@alembic/core` imports，0 issue。

只读分类扫描结果：

| 区域 | unique specifiers | refs | 判断 |
| --- | ---: | ---: | --- |
| source production | 29 | 291 | 含 stable public、provisional public、keep-transitional 和 runtime-impacting residual。 |
| source tests | 31 | 177 | 含测试专用 AST lang / migration / BootstrapDedup / EvolutionPolicy / mock residual。 |
| Codex runtime dist | 29 | 220 | 镜像 production residual；本轮未改 source，因此不刷新 runtime artifact。 |
| runtime config | 0 | 0 | 未发现 runtime config 额外 Core import。 |
| vendor snapshot | 1 metadata | 1 | Core snapshot pin 为 `5994a058038217635580cf68358c0e133c73f747`。 |

分类结论：

| 类别 | 代表路径 / specifier | 证据与判断 | 本轮动作 |
| --- | --- | --- | --- |
| stable public exact | `@alembic/core/daemon`、`database`、`dimensions`、`events`、`evolution`、`guard`、`host-agent-workflows`、`io`、`knowledge`、`logging`、`memory`、`project-intelligence`、`repositories`、`search`、`vector`、`workspace` | consumer boundary lint 已接受；production 与 runtime dist 均保持 public entrypoint。 | 保留，不改。 |
| provisional / accepted public residual | `@alembic/core/config`、`shared`、`types`、`infrastructure/report`、`service/candidate` | 属于 Core policy 已允许或 provisional 的 consumer 入口；仍需 Core P5-C 给 readiness / keep 条件。 | 本轮只分类，不替换。 |
| keep-transitional runtime-impacting | `@alembic/core/core/enhancement` | production 命中 `ServiceContainer`、`KnowledgeModule`、MCP guard、HTTP guard、bench script；runtime dist 也有镜像。计划已要求 `core/enhancement` 不能被盲目删除。 | 等 Core P5-C 账本；不猜 facade。 |
| special-boundary runtime-impacting | `core/capability/CapabilityProbe`、`infrastructure/database/drizzle`、`infrastructure/database/drizzle/schema`、`service/quality/*`、`service/recipe/*`、`service/evolution/ContentImpactAnalyzer` | production/runtime dist 均有真实消费：MCP/HTTP capability、AuditStore、AppModule quality/recipe services、FileChangeHandler impact analysis。 | 保留并标入下一波候选；仅在 Core 给出已验收替代入口后迁移。 |
| test-only residual | AST lang modules、database migrations、`BootstrapDedup`、`EvolutionPolicy`、`ContentImpactAnalyzer` mock、`CapabilityProbe` integration test | 命中集中于 targeted unit / integration tests，非 runtime artifact 主链路。 | 保留测试证据，不纳入 runtime artifact 同步。 |
| runtime artifact impact | `plugins/alembic-codex/runtime/dist/**` | dist 当前仍镜像上述 residual imports；本轮没有 source/runtime-impacting code change。 | 不刷新 artifact；仅验证现有 artifact。 |

Agent / AI / Tool runtime 负向扫描结果：

- `npm run report:agent-extraction-boundary` 通过：`filesWithBoundaryImports=0`，`agentImportFiles=0`，`aiImportFiles=0`，`toolImportFiles=0`。
- `rg "@alembic/agent|#agent/|#tools/|#external/ai|lib/agent|lib/tools|lib/external/ai" lib test scripts bin plugins/alembic-codex/runtime/dist` 只命中 `scripts/report-agent-extraction-boundary.mjs` 自检规则字符串，没有 production/runtime 重新引入。

## Runtime Artifact 判断

本轮只读扫描和文档回填，没有修改 AlembicPlugin source，也没有修改 Codex runtime dist。由于 `plugins/alembic-codex/runtime/dist/**` 未被本轮生成或改动，`runtime.tgz` 和 runtime 子仓库无需同步。`npm run verify:codex-plugin` 与 `npm run verify:codex-channel` 均验证当前 artifact 仍为 `alembic-ai@0.2.0` 且可发布/安装口径有效。

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run lint:consumer-core-imports` | 通过，334 files / 461 imports / 0 issue。 |
| `npm run lint:repo-boundary` | 通过，escape hatch 0 / 75。 |
| `npm run build:check` | 通过，Core build 使用 `../AlembicCore @ 5994a058038217635580cf68358c0e133c73f747`，`tsc --noEmit` 通过。 |
| `npm run report:agent-extraction-boundary` | 通过，Agent / AI / Tool boundary imports 全为 0。 |
| `npm run verify:codex-plugin` | 通过，`./runtime.tgz -> alembic-ai@0.2.0`。 |
| `npm run verify:codex-channel` | 通过，Codex channel verification passed。 |
| residual Core import runtime scan | 通过并完成分类；命中均归入 stable / provisional / keep-transitional / special-boundary / test-only。 |
| Agent / AI / Tool runtime negative scan | 通过；只命中自检脚本规则字符串。 |
| `git diff --check`（AlembicPlugin） | 通过，无输出。 |
| `git diff --check`（AlembicCodex runtime 子仓库） | 通过，无输出。 |

## 遗留风险

- `core/enhancement`、`CapabilityProbe`、Drizzle、quality / recipe services、`service/candidate`、`ContentImpactAnalyzer` 等仍有 production/runtime dist residual imports；它们不是本轮可删项，必须等待 Core P5-C readiness / keep-transitional 账本和总控验收。
- `runtime/dist` 中的 residual imports 会随下一次 source 迁移和 runtime prepare 更新；本轮未刷新 artifact，因此不应把 dist residual 清零作为验收条件。
- 本轮不刷新本机 Codex plugin cache，不创建 AlembicTest 复测单，原因是没有产品源码或 artifact 变更，也没有改变 prime/search/cold-start、Dashboard 手动体验或真实项目路径。

## 下一步建议

- 等 `AlembicCore` 完成 CCIC-P5-C 后，由总控判断哪些 residual path 进入 CCIC-6 consumer replacement，哪些降级为长期 public / provisional / keep-transitional contract。
- 若 CCIC-6 涉及 AlembicPlugin source import 迁移，必须同步 `plugins/alembic-codex` runtime artifact 并回填 runtime 子仓库 hash 与 `runtime.tgz` SHA-256。
- 若 Core P5-C 把 `service/candidate`、quality / recipe、`CapabilityProbe` 或 `ContentImpactAnalyzer` 暂列 keep-transitional，Plugin 侧应关闭对应“清零”期待，只保留边界账本和 consumer lint guard。
