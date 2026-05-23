# AlembicCore Capability Code Interface Cleanup CCIC-2

日期：2026-05-23
窗口：AlembicCore
任务包：CCIC-P2-C
状态：已完成，待总控验收
对应计划：../workspace/capability-code-interface-cleanup-workspace-plan-2026-05-22.md

## 窗口定位

当前窗口定位：`AlembicCore`。

目标仓库职责：`AlembicCore` 是 `@alembic/core` 源码仓库，承载共享、确定性、可复用、可运行的 Headless 内核能力，包括 project intelligence、AST / grammar、workflow contract、repository / service、search / vector 等 Core 能力。

本轮任务职责：补充 `@alembic/core/project-intelligence` 对 `core/discovery`、`core/AstAnalyzer`、`core/ast` 的 facade readiness 证据，并清理 Core 内容易误读成具体 AI provider 或 Agent runtime ownership 的注释 / 日志标签口径。

明确不承担：

- 不删除、重命名或收紧任何 Core public export。
- 不新增无真实消费方的空 facade。
- 不迁移 Alembic / AlembicPlugin / AlembicAgent consumer。
- 不把 AI provider、Codex MCP、Codex Skill / channel、Dashboard UI、CLI 或 AlembicAgent runtime 下沉 Core。
- 不运行真实项目测试。

## 完成范围

已读取：

- workspace `AGENTS.md`
- `docs/workspace/capability-code-interface-cleanup-workspace-plan-2026-05-22.md`
- `AlembicCore/AGENTS.md`
- `src/project-intelligence.ts`
- `config/public-api-boundary.json`
- `scripts/report-public-api-closeout.mjs`
- `scripts/check-public-api-boundary.mjs`

已完成：

- 在 `config/public-api-boundary.json` 的 `closeout.facadeReadiness.specifiers` 中补充以下 readiness：
  - `@alembic/core/core/discovery` -> `./project-intelligence`，标记为 `consumer-ready-stable`。
  - `@alembic/core/core/AstAnalyzer` -> `./project-intelligence`，标记为 `consumer-ready-stable`。
  - `@alembic/core/core/ast` -> `./project-intelligence`，标记为 `consumer-ready-stable`。
  - `@alembic/core/core/enhancement` -> `./core/enhancement`，标记为 `keep-transitional`，明确当前仍被 Alembic / AlembicPlugin runtime 和 tests 消费，暂无稳定替代 facade。
- 未新增 package export，未删除 package export；`@alembic/core/project-intelligence` 现有 stable facade 已覆盖本轮所需 discovery / AST symbols。
- 更新 `test/PublicProjectIntelligenceEntrypoints.test.ts`，补充 `analyzeProject`、`isProjectAstAvailable`、`loadProjectAstPlugins`、`getDiscovererRegistry`、`resetDiscovererRegistry` 等 direct symbols 的 public facade 断言。
- 清理 `src/infrastructure/vector/BatchEmbedder.ts` 的具体 OpenAI / Gemini / OpenAiProvider 口径，改为外部注入 `EmbeddingProvider` contract；Core 只负责批量调度和 fallback，不拥有具体 provider 或密钥。
- 清理 `src/infrastructure/logging/Logger.ts` 中 `AgentRuntime` / `ToolRegistry` 日志高亮标签，改为 `CoreRuntime` / `HostWorkflow` 等 Core 运行诊断语义。

## 提交 Hash

AlembicCore 提交：

```text
4d8d1df417e5f34d5166627bcdbf28547b04736a
```

提交说明：

```text
chore: clarify project intelligence API readiness
```

提交文件：

```text
config/public-api-boundary.json
src/infrastructure/logging/Logger.ts
src/infrastructure/vector/BatchEmbedder.ts
test/PublicProjectIntelligenceEntrypoints.test.ts
```

## 验证命令与结果

已执行：

```text
npm run build:check
node scripts/public-api-boundary-policy.mjs
node scripts/check-public-api-boundary.mjs --format json
node scripts/report-public-api-closeout.mjs
npm run test -- test/PublicProjectIntelligenceEntrypoints.test.ts test/PublicApiInventory.test.ts
node scripts/lint-consumer-core-imports.mjs ../Alembic --config ../Alembic/config/core-import-boundary.json --format text
node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --config ../AlembicAgent/config/core-import-boundary.json --format text
node scripts/lint-consumer-core-imports.mjs ../AlembicPlugin --config ../AlembicPlugin/config/core-import-boundary-allowlist.json --format text
rg -n "AgentRuntime|ToolRegistry|OpenAI|Gemini|OpenAiProvider|AI Provider" src/infrastructure/vector/BatchEmbedder.ts src/infrastructure/logging/Logger.ts
npm run lint
git diff --check
git status --short
```

结果：

- `npm run build:check` 通过。
- `node scripts/public-api-boundary-policy.mjs` 通过，无输出。
- `node scripts/check-public-api-boundary.mjs --format json` 通过，`issueCount=0`，export 数量仍为 136，exact exports 75，wildcard exports 61，`stable-public=17`、`provisional-public=21`、`transitional-internal=98`。
- `node scripts/report-public-api-closeout.mjs` 通过：closeout inventory 98 exports / 61 wildcard；`consumer-replace-first=16`、`no-consumer-deprecate-candidate=51`、`must-keep-transitional=13`；Alembic / AlembicAgent / AlembicPlugin consumer scans 均为 `issues=0`。其中 Alembic issues 变为 0 是当前 workspace 中 Alembic consumer 已迁移后的扫描结果，不代表 Core 删除了任何 export。
- `npm run test -- test/PublicProjectIntelligenceEntrypoints.test.ts test/PublicApiInventory.test.ts` 通过，2 files / 6 tests。
- 三个 consumer boundary 扫描均通过：
  - Alembic：363 files / 483 `@alembic/core` imports，OK。
  - AlembicAgent：230 files / 49 `@alembic/core` imports，OK。
  - AlembicPlugin：335 files / 504 `@alembic/core` imports，OK。
- provider / agent 口径负向扫描无输出；`BatchEmbedder.ts` 与 `Logger.ts` 不再包含 `AgentRuntime`、`ToolRegistry`、`OpenAI`、`Gemini`、`OpenAiProvider` 或 `AI Provider`。
- `npm run lint` 通过，Biome checked 421 files。
- `git diff --check` 通过。
- `git status --short` 无输出，AlembicCore 工作区干净。

## 遗留风险

- Core public API 面仍然较大：136 exports、61 wildcard、98 transitional-internal；本轮只补 readiness 证据，不进入 export 删除。
- `@alembic/core/core/enhancement` 仍保留为 transitional / provisional exact entry。它当前仍被 Alembic / AlembicPlugin runtime 与 tests 消费，后续若要收敛，需要单独设计 Enhancement stable facade 或 consumer replacement。
- `service/knowledge`、`service/evolution`、`infrastructure/signal`、`infrastructure/report` 等高引用 deep import 仍是后续 consumer replacement 主线，本轮没有触碰。
- `src/host-agent-workflows.ts` 中仍有 Codex MCP / AgentRuntime 等“排除项”注释，这是用于说明 Core 只拥有 deterministic host-agent workflow contract，不表示 Core 拥有 Agent runtime；本轮未改该边界注释。

## 下一步建议

- 总控验收 Alembic / AlembicCore / AlembicPlugin 的 CCIC-2 回填时，确认 Alembic consumer replacement 是否已关闭全部 scripts deep import issue；当前 Core 侧扫描显示 Alembic 已为 OK。
- 下一波如继续 Core public API 收敛，优先处理 `service/knowledge` / `service/evolution` 等高引用路径的 exact facade readiness；删除阶段仍必须等 consumer replacement、public API boundary、consumer scans 和 release readiness 全部通过。
- 不建议下一波直接删除 `@alembic/core/core/enhancement`；应先确认 Enhancement registry 的稳定 facade 归属和 Alembic / Plugin runtime 迁移路径。
