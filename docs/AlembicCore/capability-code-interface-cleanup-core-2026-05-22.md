# AlembicCore Capability Code Interface Cleanup

日期：2026-05-22
窗口：AlembicCore
任务包：CCIC-P1-C
状态：待总控验收
对应计划：../workspace/capability-code-interface-cleanup-workspace-plan-2026-05-22.md

## 窗口定位

当前窗口定位：`AlembicCore`。

本轮仓库职责：为 `@alembic/core` 建立 public API / deep import closeout 证据账本，输出后续 consumer replacement 和 export 收敛的安全候选。

本轮明确不承担：

- 不删除、重命名或收紧任何 public export。
- 不修改 Alembic / AlembicPlugin / AlembicAgent consumer。
- 不把 AlembicAgent runtime、AI provider、tool system、Codex host response、MCP schema、Skill/channel 或 Dashboard UI 下沉 Core。
- 不运行真实项目测试。

## 完成范围

已读取：

- workspace `AGENTS.md`
- `docs/workspace/capability-code-interface-cleanup-workspace-plan-2026-05-22.md`
- `AlembicCore/AGENTS.md`
- `AlembicCore/package.json`
- `AlembicCore/config/public-api-boundary.json`
- `AlembicCore/scripts/public-api-boundary-policy.mjs`
- `AlembicCore/scripts/report-public-api-closeout.mjs`
- `AlembicCore/scripts/check-public-api-boundary.mjs`
- `AlembicCore/scripts/lint-consumer-core-imports.mjs`
- 既有 GFBD Core 证据文档 `docs/AlembicCore/global-function-boundary-evidence-core-2026-05-22.md`

已完成：

- 运行 public API closeout report，得到 stable / provisional / transitional / wildcard export 当前状态。
- 运行 Core public API boundary 检查，确认 export 分类未增长且 policy 有效。
- 扫描 Alembic / AlembicAgent / AlembicPlugin consumer import boundary，记录真实消费方与 issue。
- 将 closeout export 分为 `consumer-replace-first`、`no-consumer-deprecate-candidate`、`must-keep` / `keep-provisional`。
- 输出下一波 consumer replacement 建议和不得删除项。

## 提交 Hash

AlembicCore 当前 HEAD：

```text
f30beacedf89abab13b91e87e4686d0db38e7d29
```

本轮未修改 AlembicCore 产品源码，未产生新的 AlembicCore 提交；仅在 workspace 文档中回填执行记录。

## Export 分类

### Public API Summary

`node scripts/check-public-api-boundary.mjs --format json` 结果摘要：

- package：`@alembic/core`
- exports：136
- exact exports：75
- wildcard exports：61
- stable-public：17
- provisional-public：21
- transitional-internal：98
- internal-only：0
- forbidden：0
- issueCount：0

stable public exports：

- `.`
- `./daemon`
- `./database`
- `./dimensions`
- `./events`
- `./evolution`
- `./guard`
- `./host-agent-workflows`
- `./io`
- `./knowledge`
- `./logging`
- `./memory`
- `./project-intelligence`
- `./repositories`
- `./search`
- `./vector`
- `./workspace`

provisional public exports：

- `./config`
- `./core/capability`
- `./core/enhancement`
- `./domain`
- `./domain/knowledge/values`
- `./infrastructure`
- `./infrastructure/config`
- `./infrastructure/event`
- `./infrastructure/io`
- `./infrastructure/logging`
- `./infrastructure/report`
- `./infrastructure/signal`
- `./service`
- `./service/bootstrap`
- `./service/candidate`
- `./service/evolution`
- `./service/knowledge`
- `./service/quality`
- `./service/recipe`
- `./shared`
- `./types`

### Closeout Categories

`node scripts/report-public-api-closeout.mjs` 结果摘要：

- closeout exports：98
- wildcard exports：61
- `promote-to-stable`：0
- `keep-provisional`：18
- `consumer-replace-first`：17
- `no-consumer-deprecate-candidate`：50
- `must-keep-transitional`：13

consumer scans：

| Consumer | Files | Imports | Closeout refs | Issues | Stable | Provisional | Transitional |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| AlembicAgent | 230 | 49 | 0 | 0 | 49 | 0 | 0 |
| Alembic | 361 | 487 | 84 | 4 | 334 | 69 | 84 |
| AlembicPlugin | 330 | 505 | 93 | 0 | 361 | 51 | 93 |

## Consumer-replace-first

这些 export 当前仍有真实 consumer 引用。下一波不能删除，必须先由对应 consumer 迁到 exact facade、adapter 或新稳定入口。

| Export | Refs | Consumers |
| --- | ---: | --- |
| `./service/knowledge/*` | 50 | Alembic 26, AlembicPlugin 24 |
| `./service/evolution/*` | 37 | Alembic 17, AlembicPlugin 20 |
| `./infrastructure/signal/*` | 8 | Alembic 4, AlembicPlugin 4 |
| `./service/quality/*` | 8 | Alembic 4, AlembicPlugin 4 |
| `./service/recipe/*` | 8 | Alembic 4, AlembicPlugin 4 |
| `./core/capability/*` | 7 | Alembic 3, AlembicPlugin 4 |
| `./infrastructure/report/*` | 7 | Alembic 4, AlembicPlugin 3 |
| `./repository/evolution/*` | 5 | Alembic 4, AlembicPlugin 1 |
| `./repository/token/*` | 4 | Alembic 2, AlembicPlugin 2 |
| `./domain/knowledge/*` | 3 | Alembic 3 |
| `./repository/knowledge/*` | 3 | Alembic 2, AlembicPlugin 1 |
| `./repository/memory/*` | 2 | Alembic 2 |
| `./service/bootstrap/*` | 2 | Alembic 1, AlembicPlugin 1 |
| `./core/*` | 1 | Alembic 1 |
| `./domain/evolution/*` | 1 | AlembicPlugin 1 |
| `./repository/sourceref/*` | 1 | Alembic 1 |
| `./workflows/capabilities/*` | 1 | Alembic 1 |

## Must-keep / Keep-provisional

### Must-keep transitional

这些路径当前仍代表 Core deterministic 内核或迁移期必须保留的底层 contract，本波不得删除：

- `./core/ast`、`./core/ast/*`
- `./infrastructure/database/drizzle`、`./infrastructure/database/drizzle/*`
- `./infrastructure/database/migrations/*`
- `./repository/base`、`./repository/base/*`
- `./repository/bootstrap`、`./repository/bootstrap/*`
- `./repository/code`、`./repository/code/*`
- `./repository/sync`、`./repository/sync/*`

其中 `./core/ast/*` 当前被 AlembicPlugin 引用 13 次；database migration / drizzle / sync / repository base 等仍有 Alembic 或 AlembicPlugin 引用。删除前必须有替代入口和 targeted verification。

### Keep-provisional

这些路径当前按 manual category 保持 provisional，不作为删除候选：

- `./core`
- `./core/analysis`
- `./core/discovery`
- `./domain/knowledge`
- `./infrastructure/database`
- `./repository`
- `./service/panorama`
- `./workflows`
- `./workflows/capabilities`
- `./workflows/capabilities/execution/external`
- `./workflows/capabilities/persistence`
- `./workflows/capabilities/planning/dimensions`
- `./workflows/capabilities/planning/knowledge`
- `./workflows/capabilities/presentation`
- `./workflows/capabilities/project-intelligence`
- `./workflows/cold-start`
- `./workflows/knowledge-rescan`
- `./workflows/shared`

`./core/discovery` 当前仍有 Alembic 2 次引用。其它 keep-provisional 即使当前扫描为 0，也属于模块级迁移 facade 或 Core 工作流 contract，不应在 CCIC-2 直接删除。

## No-consumer Deprecate Candidates

`report-public-api-closeout` 当前列出 50 个 `no-consumer-deprecate-candidate`。这些只是“无当前扫描 consumer”的下一波审查候选，不是本波删除项。

建议下一波优先审查以下低风险组：

- `./shared/*`
- `./types/*`
- `./infrastructure/config/*`
- `./infrastructure/event/*`
- `./infrastructure/io/*`
- `./infrastructure/logging/*`
- `./service/candidate/*`
- `./service/search`、`./service/search/*`
- `./service/vector`、`./service/vector/*`

这些组要先复核 `config/public-api-boundary.json` 中的 facade readiness map，并确认外层源码、测试、runtime artifact、release staging 没有隐性消费，再进入 deprecate / removal 设计。

不建议下一波优先删除的 no-consumer 组：

- workflow wildcard，例如 `./workflows/cold-start/*`、`./workflows/knowledge-rescan/*`、`./workflows/capabilities/*`
- discovery / enhancement / analysis wildcard
- repository exact module facades
- infrastructure vector exact / wildcard

原因是这些路径虽然当前扫描无直接 consumer，但承担 Core 内部能力边界、未来 exact facade 迁移或 host-agent workflow contract，删除风险高于收益。

## Alembic Consumer Issues

Alembic consumer boundary 当前仍失败 4 项：

```text
scripts/bench-real-projects.mts:43:4 @alembic/core/core/discovery
scripts/bench-real-projects.mts:49:15 @alembic/core/core/ast
scripts/bench-real-projects.mts:51:4 @alembic/core/core/AstAnalyzer
scripts/collect-test-project-stats.mts:45:4 @alembic/core/core/discovery
```

建议 CCIC-2 先派 Alembic consumer replacement：

- `@alembic/core/core/discovery` 优先评估迁到 `@alembic/core/project-intelligence` 或 `@alembic/core/core`。
- `@alembic/core/core/ast`、`@alembic/core/core/AstAnalyzer` 优先评估是否需要新增 exact facade 或将脚本迁到已有 project-intelligence facade。
- 这些是 Alembic 脚本消费问题，不应通过扩大 Core wildcard 或降低 boundary lint 来处理。

## 可删候选

本波没有“可直接删除”的 Core public export。

下一波候选必须满足全部条件后才能进入删除设计：

1. `report-public-api-closeout` 显示无 consumer references。
2. `lint-consumer-core-imports` 在 Alembic / AlembicAgent / AlembicPlugin 均通过。
3. 不属于 `must-keep-transitional` 或 `keep-provisional`。
4. 不在 package runtime / release readiness / resource loading / smoke-public-api 中被间接需要。
5. 有替代 exact facade、deprecation note 或 release note。

## 不得删除项

- 17 个 stable public exports 全部不得删除。
- 21 个 provisional public exports 本波不得删除。
- 13 个 must-keep transitional paths 本波不得删除。
- `resources/grammars`、AST parser / grammar entry、database migrations、drizzle schema、repository base / sync、host-agent workflow contract 不得删除。
- `config/public-api-boundary.json` 和 public API scripts 不得删除。

## 下一波 Consumer Replacement 建议

建议 CCIC-2 分三组推进：

1. Alembic scripts quick fix：处理 4 个当前 boundary violations，优先让 `npm run lint:consumer-core-imports` 或等价扫描在 Alembic 通过。
2. Alembic / AlembicPlugin high-reference service replacement：优先处理 `./service/knowledge/*`、`./service/evolution/*`，必要时在 Core 新增 exact facade 后由 consumers 迁移。
3. Infrastructure / repository replacement：处理 `./infrastructure/signal/*`、`./infrastructure/report/*`、`./repository/evolution/*`、`./repository/token/*` 等 adapter / DI 入口。

删除阶段必须放在 consumer replacement 之后。

## 验证命令与结果

已执行：

```text
git -C AlembicCore status --short
git -C AlembicCore rev-parse HEAD
npm run build:check
node scripts/public-api-boundary-policy.mjs
node scripts/report-public-api-closeout.mjs
node scripts/report-public-api-closeout.mjs --format json
node scripts/check-public-api-boundary.mjs --format json
node scripts/lint-consumer-core-imports.mjs ../Alembic --config ../Alembic/config/core-import-boundary.json --format text
node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --config ../AlembicAgent/config/core-import-boundary.json --format text
node scripts/lint-consumer-core-imports.mjs ../AlembicPlugin --config ../AlembicPlugin/config/core-import-boundary-allowlist.json --format text
rg -n "@alembic/core/(core|service|repository|infrastructure|domain/knowledge|types|shared)" ../Alembic/lib ../Alembic/bin ../Alembic/scripts ../Alembic/test ../AlembicPlugin/lib ../AlembicPlugin/scripts ../AlembicPlugin/test ../AlembicAgent/src ../AlembicAgent/test
```

结果：

- `git -C AlembicCore status --short` 无输出，Core 产品仓库干净。
- `npm run build:check` 通过。
- `node scripts/public-api-boundary-policy.mjs` 通过，无输出。
- `node scripts/report-public-api-closeout.mjs` 通过，输出 closeout inventory。
- `node scripts/check-public-api-boundary.mjs --format json` 通过，`issueCount=0`。
- AlembicAgent consumer boundary 通过。
- AlembicPlugin consumer boundary 通过。
- Alembic consumer boundary 失败 4 项，均在 scripts 中引用 transitional Core internals；已记录为 CCIC-2 consumer replacement 候选。

## 遗留风险

- Core public API 面仍大：136 exports、61 wildcard、98 transitional-internal。不能继续增长。
- closeout report 的 `replacementReadiness.readyRefs=0/0`，说明当前 readiness map 没覆盖高频 consumer-replace-first 路径；下一波若要迁移 `service/knowledge` / `service/evolution`，需要先补 exact facade 或 readiness 规则。
- Alembic scripts 的 4 个 import boundary issue 会阻塞后续“全 consumer 通过后再删 export”的删除门禁。
- `no-consumer-deprecate-candidate` 只是扫描结果，不代表可以立即删；runtime artifact、release package、历史测试和动态 import 仍需二次确认。

## 下一步建议

- CCIC-2 先派 Alembic 修 4 个 scripts consumer boundary violations。
- Core 后续可单独补一轮 facade readiness map，优先覆盖 `./service/knowledge/*`、`./service/evolution/*`、`./infrastructure/signal/*`、`./infrastructure/report/*`。
- 等 Alembic / Plugin consumer replacement 完成后，再考虑把 `no-consumer-deprecate-candidate` 中低风险 wildcard 进入 deprecation / removal 计划。
- 不建议在下一波直接删除 Core export；先完成 consumer replacement 和 public API smoke / release readiness。

## 超高复核结论

复核日期：2026-05-23

复核定位：

- 当前窗口：`AlembicCore`。
- 当前任务包：`CCIC-P1-C`。
- 本轮职责：只复核 Core public API / deep import closeout 证据、真实 consumer 扫描和后续 consumer replacement 候选。
- 明确不承担：不删除 Core export，不修改 Alembic / AlembicPlugin / AlembicAgent consumer，不把 Agent runtime、AI provider 管理、Codex MCP / Skill / channel、Dashboard UI 或发布壳下沉 Core。

复核结论：

| 检查项 | 结论 | 证据 |
| --- | --- | --- |
| 是否误删真实消费方 | 未发现误删 | `git -C AlembicCore status --short` 和 `git -C AlembicCore diff --name-status` 均无输出；本轮没有产品源码 diff，也没有删除 package export。consumer 扫描仍能看到 Alembic / AlembicPlugin / AlembicAgent 的真实引用，且已把高引用 deep import 标为 `consumer-replace-first`。 |
| 是否改变职责边界 | 未发现本轮改变 | 复读 workspace `AGENTS.md`、当前计划和 `AlembicCore/AGENTS.md` 后确认：Core 只保留 Headless deterministic kernel、workflow/session/briefing/persistence/contract、search/vector、repository/service 等共享能力；本轮未新增 Codex MCP、Skill、channel、Dashboard UI、CLI 或 Agent runtime 实现。 |
| 兼容字段保留 / 删除是否有证据 | Core 本轮不涉及兼容字段删除 | `rg -n "HOST_AI_MANAGED|hostManaged|hostAiManaged|hostAgentManaged|LOCAL_AI_UNAVAILABLE|canonicalCode|boundaryCode|localAiUnavailable" src package.json config scripts test` 无输出；这些字段属于 Plugin / Dashboard producer-consumer 兼容线，不是 Core 本轮职责。Core public exports 全部保留，删除条件仍是 consumer replacement 后再次验证。 |
| 负向扫描是否完成 | 已完成 | `rg -n "CodexMcpServer|@modelcontextprotocol|plugins/alembic-codex|channels/codex|AgentRuntime|ToolRouter|OpenAiProvider|ClaudeProvider|GoogleGeminiProvider|DashboardOperations|ReactDOM" src package.json config scripts` 仅命中既有日志标签、host-agent workflow 边界注释和 vector embedder 注释；`test` 目录命中主要来自边界测试和 Vitest import。未发现 Core 拥有 Codex MCP / channel / Dashboard UI / React / provider key 管理实现。 |
| 验证命令是否完成 | 已完成 | `npm run build:check` 通过；`node scripts/public-api-boundary-policy.mjs` 通过；`node scripts/check-public-api-boundary.mjs --format json` 显示 `issueCount=0`；`node scripts/report-public-api-closeout.mjs` 通过；AlembicAgent / AlembicPlugin consumer boundary 通过；Alembic consumer boundary 仍有 4 个已记录 issue。 |

补充扫描结果：

- `node scripts/report-public-api-closeout.mjs`：closeout inventory 仍为 98 exports / 61 wildcard；`consumer-replace-first=17`、`no-consumer-deprecate-candidate=50`、`must-keep-transitional=13`；AlembicPlugin 当前扫描为 504 个 `@alembic/core` imports，较原回填少 1 个，不影响分类结论。
- Alembic consumer boundary 仍失败 4 项，均在 scripts 中引用 `@alembic/core/core/discovery`、`@alembic/core/core/ast`、`@alembic/core/core/AstAnalyzer`；这是 CCIC-2 consumer replacement 阻塞项，不应通过删除 Core export、扩大 wildcard 或降低 lint 规则处理。
- `BatchEmbedder` 中的外部 `embed` provider 注入属于 Core vector batch utility 的确定性封装，不包含 API key 管理或具体 provider owner；但文件注释仍有 `OpenAI/Gemini` / `OpenAiProvider` 历史口径，建议后续 Core 语义清洁时改为“外部注入 embedding provider”。
- `Logger.ts` 中既有 `AgentRuntime` / `ToolRegistry` 日志标签只影响日志高亮分类；它不是本轮引入，也不表示 Core 拥有 AlembicAgent runtime。后续若继续做 Core 口径清洁，可单独收敛为更中性的 runtime tag。

复核判定：

- `CCIC-P1-C` 可继续保持 `待总控验收`。
- 不需要 AlembicCore 返工。
- 不建议现在删除任何 Core public export。
- 下一步仍建议先处理 Alembic scripts 4 个 consumer boundary issues，再补 Core facade readiness map，最后才评估低风险 no-consumer wildcard 的 deprecation / removal。
