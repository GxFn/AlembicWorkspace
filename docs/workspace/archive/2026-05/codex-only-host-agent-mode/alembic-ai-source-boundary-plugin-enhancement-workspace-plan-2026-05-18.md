# Alembic AI Source Boundary Plugin Enhancement Workspace Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已验收；AI source boundary + Plugin first enhancement 完成
方向：先落实 AI source 边界，再继续 Plugin first 增强消费层

## 背景

上一份 `alembic-plugin-first-enhancement-wave-1-workspace-plan-2026-05-18.md` 已完成 Wave 1A：`AlembicCore` 提供 source contract，`Alembic` 提供 daemon capability identity。继续派发消费层前，需要先把 AI 来源语义明确落地，避免 `host-agent`、Alembic internal AI、AI provider 配置和领域机制 source 混用。

本计划接管上一份计划中的 Wave 1B 消费层任务，并新增一个必须先处理的方向：AI source boundary 落实。

## 核心判定

AI source 不是 AI provider 配置，也不是 route choice。所有仓库必须先按下表判断：

| 场景 | source / 字段 | 说明 |
| --- | --- | --- |
| Codex / 外部宿主 Agent 提交知识、提案、维度完成 | `host-agent` | 只属于 `AlembicPlugin` 宿主 Agent 线。 |
| Alembic internal AI runtime / AlembicAgent 通用写入 | `alembic-agent` | 只属于 `Alembic` + `AlembicAgent` 内部 AI 线。 |
| 宿主编辑事件 | `host-edit` | 替代旧 `ide-edit`。 |
| git 监控事件 | `git-head` / `git-worktree` | Alembic daemon file monitor。 |
| rescan / file-change / decay / consolidation 等领域机制 | 保持 `rescan-evolution`、`file-change`、`decay-scan`、`consolidation` 等 domain source | 优先表达真实功能机制，不为了统一命名而改成 `alembic-agent`。 |
| 旧历史来源 | `ide-agent` / `ide-edit` | 只兼容读取，不作为新写入默认值。 |
| AI provider / model / key 来源 | `provider`、`model`、`configSource`、`available` 等 capability 字段 | 这是配置状态，不是 knowledge source。 |

硬性约束：

- 不允许用 `host-agent` 表示 Alembic 自己配置的 internal AI。
- 不允许用 `alembic-agent` 表示 Codex / 外部宿主 Agent。
- 不允许把 `aiProvider`、`provider`、`model` 的 fallback 写成 `host-agent`。
- Dashboard 只展示 source contract，不重新定义路由策略。
- Plugin enhancement route 只做探测、选择和转发，不复制 Alembic daemon / JobStore / ProjectRegistry / internal AI provider。

## 执行顺序

本计划分两层推进：

1. AI source boundary 落地：`Alembic`、`AlembicPlugin`、`AlembicAgent`、`AlembicDashboard` 先清理 source / provider / route choice 混用。
2. Plugin first 增强继续：`AlembicPlugin` 在 source 边界清楚后接入本地 Alembic enhancement probe / resolver。

如果执行窗口发现上游 Core helper 不足，只回填阻塞证据，不在本仓库自造另一套 source contract。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`阻塞`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | AI provider / source / route choice 边界已验收；CLI/status 不再把 provider fallback 写成 `host-agent`；提交 `f6b7f2f429e4873a4a1184a65c81477e84ff4e38`。 |
| `AlembicPlugin`<br>已完成 | 已验收 Codex host source 归一、本地 Alembic enhancement resolver、status/diagnostics/onboarding route 展示与 portable runtime artifact 刷新；提交 `3a82f2c9e29e2cfe4e6b3fad87cfc83c29a1b223`。 |
| `AlembicAgent`<br>已完成 | 已验收 Tool V2 knowledge / evolution 默认 source 切到 `alembic-agent`；保留 domain-specific source；最终提交 `07ec864e8878fc0eaa233365dc27fddab949a228`。 |
| `AlembicDashboard`<br>已完成 | 已验收 ProposalSource 类型、source label、筛选 / 展示文案收口；提交 `26369661193fb42d9f7db0d7df6440a01cab656e`。 |
| `AlembicCore`<br>观察中 | 已完成 source contract；本波不派发，除非消费层证明缺少必要 public helper。 |
| `BiliDili`<br>无任务 | 本波是源码边界和产品路线收口，不做真实项目 smoke。 |

## Alembic 执行要求

文档动作：新建执行记录。

保存位置：`docs/Alembic/alembic-ai-source-boundary-provider-status-2026-05-18.md`

挂载入口：本文“回填区 / Alembic”。

目标：

- 检查 `bin/cli.ts`、daemon health/capabilities、AI status、README/文档和测试中 `host-agent` 是否被用于 AI provider fallback 或 internal AI 配置来源。
- 如果字段表示 provider / model / key / config source，必须使用 provider 语义，例如 `null`、`empty`、`not-configured`、`workspace-settings`、`process-env`，不能使用 `host-agent`。
- `capabilities.internalAi` 继续只表达 Alembic internal AI 配置状态，不表达 Codex host-agent route。
- 保留上一波 daemon capability identity，不删除 daemon、HTTP/API、Dashboard server、JobStore、ProjectRegistry 或 internal AI jobs。
- 不修改 `AlembicPlugin` 的 Codex tool policy。

建议验证命令：

```text
npm run build:check
npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts
npm run lint:consumer-core-imports
git diff --check
rg -n "aiProvider.*host-agent|provider.*host-agent|host-agent|alembic-agent|ide-agent|ide-edit" bin lib config templates README.md README_CN.md test --glob '!**/dist/**' --glob '!CHANGELOG.md'
```

回填要求：修正范围、provider/source/route choice 字段边界、提交 hash、验证命令、验证结果、遗留风险、是否影响 Plugin probe。

## AlembicPlugin 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicPlugin/alembic-ai-source-boundary-plugin-enhancement-2026-05-18.md`

挂载入口：本文“回填区 / AlembicPlugin”。

目标：

- 将外部 MCP / Codex host 提交 knowledge、proposal、dimension complete 的新写入 source 切到 `host-agent`；旧 `ide-agent` 只兼容读取或历史说明。
- diagnostics/status/onboarding 中区分三件事：host-agent route、local Alembic enhancement route、internal AI provider config。
- 新增或完善本地 Alembic enhancement probe / resolver：识别 embedded plugin runtime、本地 Alembic daemon、本地 Alembic install 和不可用原因。
- `alembic_codex_dashboard`、`alembic_codex_bootstrap`、`alembic_codex_rescan` 优先使用可用本地 Alembic daemon/API；缺失时回退 embedded runtime。
- 不删除 runtime snapshot，不把 Plugin 改成 npm registry 包发布。

建议验证命令：

```text
npm run build:check
npm run verify:codex-plugin
npm run verify:codex-channel
npm run smoke:codex-plugin
npm run lint:core-import-boundary
git diff --check
rg -n "ide-agent|ide-edit|host-agent|alembic-agent|aiProvider" lib skills README.md test --glob '!**/dist/**'
```

回填要求：source 替换范围、route choice shape、capability 缺失降级策略、提交 hash、验证命令、验证结果、遗留风险。

## AlembicAgent 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicAgent/alembic-ai-source-boundary-agent-runtime-2026-05-18.md`

挂载入口：本文“回填区 / AlembicAgent”。

目标：

- 将 Tool V2 knowledge / evolution 默认 source 从 `ide-agent` 改为 `alembic-agent`。
- 旧 source 只作为兼容输入，不作为新默认写入。
- 保留 `rescan-evolution`、`file-change` 等 domain-specific source，不为了统一命名而改成 `alembic-agent`。
- terminal / sandbox 继续作为 Agent tool capability，不迁给 Plugin。

建议验证命令：

```text
npm run build:check
npm run smoke:public-imports
npm run lint:public-api-boundary
git diff --check
rg -n "ide-agent|ide-edit|host-agent|alembic-agent|rescan-evolution|file-change" src test --glob '!**/dist/**'
```

回填要求：默认 source 替换点、保留的 domain source、验证命令、验证结果、是否需要 Core 追加 helper。

## AlembicDashboard 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicDashboard/alembic-ai-source-boundary-dashboard-labels-2026-05-18.md`

挂载入口：本文“回填区 / AlembicDashboard”。

目标：

- 更新 `ProposalSource` 类型、source label、筛选 / 展示文案，同时支持 `host-agent`、`alembic-agent` 和旧兼容来源。
- 旧 `ide-agent` / `ide-edit` 显示为兼容来源，不作为新主线。
- 不把 AI provider config 显示成 knowledge source；provider / model / configSource 属于配置状态。
- 不改 Dashboard API client 之外的后端能力归属。

建议验证命令：

```text
npm run build
git diff --check
rg -n "ide-agent|ide-edit|host-agent|alembic-agent|aiProvider|provider" src --glob '!**/dist/**'
```

回填要求：UI/API 类型变化、label 变化、兼容来源展示方式、验证命令、验证结果、需要后端补齐的字段。

## 总体验收条件

- 新写入不再使用 `ide-agent` / `ide-edit`。
- `host-agent` 只出现在 Codex / 外部宿主 Agent 语义中。
- `alembic-agent` 只出现在 AlembicAgent / internal AI runtime 语义中。
- AI provider / model / config source 不再用 source 值承载。
- Plugin 可以清楚说明当前 route：embedded runtime、本地 Alembic daemon、本地 Alembic install 或不可用原因。
- Dashboard 能同时展示 host-agent、alembic-agent、旧兼容来源，并不重写路由判断。

## 总控验收结果

验收结论：通过。本计划关闭，当前无需要发送领取提示词的执行窗口。

- 仓库状态：`Alembic`、`AlembicPlugin`、`AlembicAgent`、`AlembicDashboard`、`AlembicCore` 均为 clean。
- 提交复核：`Alembic` HEAD `f6b7f2f429e4873a4a1184a65c81477e84ff4e38`；`AlembicPlugin` HEAD `3a82f2c9e29e2cfe4e6b3fad87cfc83c29a1b223`，runtime artifact HEAD `344e7c54362df287a1378a5da1f4d8b694fdee71`；`AlembicAgent` HEAD `07ec864e8878fc0eaa233365dc27fddab949a228`；`AlembicDashboard` HEAD `26369661193fb42d9f7db0d7df6440a01cab656e`。
- 复核验证：`Alembic npm run build:check` 通过；`Alembic` 6 个 unit 文件 / 69 tests 通过；`Alembic npm run lint:consumer-core-imports` 通过。
- 复核验证：`AlembicPlugin npm run build:check` 通过；`AlembicPlugin` 9 个 unit 文件 / 152 tests 通过；`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run smoke:codex-plugin`、`npm run lint:core-import-boundary` 均通过。
- 复核验证：`AlembicAgent npm run build:check`、`npx vitest run test/tool-v2-contract.test.ts`、`npm run smoke:public-imports`、`npm run lint:public-api-boundary` 均通过。
- 复核验证：`AlembicDashboard npm run build` 通过，仅保留既有 Vite large chunk warning。
- 负向扫描：未发现 Alembic provider fallback 到 `host-agent`、Plugin 新写入旧 `ide-agent` / `ide-edit`、Dashboard provider 与 source 混用；`AlembicAgent` 仅剩测试临时路径中的 `agent-tool` 字符串，不是 source 写入。

总控复核命令：

```text
node scripts/verify-workspace-docs.mjs --all-workspace
node scripts/check-dispatch-coverage.mjs
git diff --check
```

## 可复制分派提示词

发送给：无；本计划所有执行窗口已验收完成。

```text
当前无可发送执行窗口。
```

不发送给：`Alembic`、`AlembicPlugin`、`AlembicAgent`、`AlembicDashboard`、`AlembicCore`、`BiliDili`。

## 回填区

### Alembic

- 状态：已完成
- 执行记录：[`docs/Alembic/alembic-ai-source-boundary-provider-status-2026-05-18.md`](../../../../Alembic/alembic-ai-source-boundary-provider-status-2026-05-18.md)
- 提交 hash：`f6b7f2f429e4873a4a1184a65c81477e84ff4e38`
- 完成范围：
  - `bin/cli.ts` 的 `status --json` 不再把未配置 AI provider fallback 为 `host-agent`；未配置或 `none` provider 输出 `aiProvider: null`、`aiModel: null`。
  - daemon health / capabilities 保持 `enhancement.route = local-alembic` 与 `capabilities.internalAi`；`internalAi` 只表达 `provider`、`model`、`configSource`、`available`，不承载 Codex host-agent route。
  - Alembic 消费层 proposal / evolution 单测的新写入 source 改用 Core public contract `HOST_AGENT_SOURCE`，移除旧 `ide-agent` 字面量默认写入。
  - 未修改 `AlembicPlugin` Codex tool policy，未删除 daemon、HTTP/API、Dashboard server、JobStore、ProjectRegistry 或 internal AI jobs。
- 验证命令与结果：
  - `npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts test/unit/ProposalRepository.test.ts test/unit/ConsolidatedProposal.test.ts test/unit/EvolutionGateway.test.ts test/unit/ProposalExecutor.test.ts`：通过，6 个测试文件、69 个测试通过。
  - `npm run build:check`：通过，使用本地 `../AlembicCore`。
  - `npm run lint:consumer-core-imports`：通过，扫描 415 个文件、560 个 `@alembic/core` imports。
  - `npx biome check --diagnostic-level=error bin/cli.ts test/unit/ProposalRepository.test.ts test/unit/ConsolidatedProposal.test.ts test/unit/EvolutionGateway.test.ts test/unit/ProposalExecutor.test.ts`：通过。
  - `git diff --check`：通过。
  - `git diff --check HEAD~1..HEAD`：通过。
  - `rg -n "aiProvider.*host-agent|provider.*host-agent|'ide-agent'|\"ide-agent\"|'ide-edit'|\"ide-edit\"" bin lib config templates README.md README_CN.md test --glob '!**/dist/**' --glob '!CHANGELOG.md'`：无命中。
  - `rg -n "aiProvider.*host-agent|provider.*host-agent|host-agent|alembic-agent|ide-agent|ide-edit" bin lib config templates README.md README_CN.md test --glob '!**/dist/**' --glob '!CHANGELOG.md'`：仍有允许命中；均为 README Plugin 归属说明、`config/agent-extraction-boundary.json` 历史计划 / 状态记录、`@alembic/core/host-agent-workflows` public import path。
- 遗留风险：总控验收需接受 `@alembic/core/host-agent-workflows` 作为 Core public subpath 残留；它不是 AI provider fallback，也不是新 source 默认值。
- 是否影响 Plugin probe：不破坏；Plugin probe 继续消费 daemon health 的 `enhancement` / `capabilities` 字段，`internalAi` provider 状态语义更清楚。
- 下一步建议：继续派发 `AlembicPlugin`；`Alembic` 进入待验收，不再重复发送领取提示词。

### AlembicPlugin

- 状态：已完成
- 执行记录：[`docs/AlembicPlugin/alembic-ai-source-boundary-plugin-enhancement-2026-05-18.md`](../../../../AlembicPlugin/alembic-ai-source-boundary-plugin-enhancement-2026-05-18.md)
- 提交 hash：
  - AlembicPlugin：`3a82f2c9e29e2cfe4e6b3fad87cfc83c29a1b223`
  - Codex plugin runtime artifact：`344e7c54362df287a1378a5da1f4d8b694fdee71`
- 完成范围：
  - 外部 MCP / Codex host 的 knowledge、proposal/evolution、dimension complete 新写入 source 统一为 `host-agent`；旧 `ide-agent` / `ide-edit` 不再作为 Plugin 新写入值出现。
  - 新增 `SourceBoundary` 消费 Core source contract，将旧外部宿主默认值 `mcp`、`mcp-external`、`cursor-scan`、`ide-agent` 归一到 `host-agent`。
  - 新增 `EnhancementRoute` resolver，区分 host-agent route、local Alembic daemon/install route、embedded plugin runtime 与 internal AI provider config。
  - `alembic_codex_status`、`alembic_codex_diagnostics`、onboarding、dashboard/job/daemon bridge 返回 `enhancementRoute`。
  - Plugin embedded daemon health 增加 `enhancement.route = embedded-plugin-runtime` 与 `capabilities.api/dashboard/jobs/internalAi`。
  - 已刷新 `plugins/alembic-codex/runtime` 与 `runtime.tgz`，保留 portable runtime 的 `vendor/AlembicCore` 和 `.alembic-source.json`；未引入 `@alembic/agent`，未恢复 npm registry publish。
- Route choice shape：
  - `selected`：`local-alembic-daemon` / `embedded-plugin-runtime` / `local-alembic-install` / `unavailable`。
  - `hostAgentRoute.source` 固定为 `host-agent`，`requiresAiProvider: false`。
  - `internalAiProvider` 只表达 provider / model / configSource / available。
  - `missingCapabilities` 记录 dashboard / jobs / mcp 缺失，不把 provider fallback 写成 source。
- 验证命令与结果：
  - `npm run build:check`：通过。
  - `npm run test:unit -- test/unit/CodexEnhancementRoute.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexMcpServer.test.ts test/unit/KnowledgeAPI.test.ts test/unit/ExternalDimensionCompletionWorkflow.test.ts test/unit/ProposalRepository.test.ts test/unit/EvolutionGateway.test.ts test/unit/ConsolidatedProposal.test.ts test/unit/ProposalExecutor.test.ts`：通过，9 个测试文件、152 个测试通过。
  - `npm run lint:core-import-boundary`：通过。
  - `npm run build`：通过。
  - `npm run prepare:codex-plugin-runtime`：通过。
  - `npm run verify:codex-plugin`：通过。
  - `npm run verify:codex-channel`：通过。
  - `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime passed。
  - `git diff --check`：通过。
  - `git diff --check HEAD~1..HEAD`：通过。
  - `git -C plugins/alembic-codex diff --check HEAD~1..HEAD`：通过。
  - `rg -n "ide-agent|ide-edit" lib skills README.md test --glob '!**/dist/**'`：无命中。
  - `rg -n "ide-agent|ide-edit|host-agent|alembic-agent|aiProvider" lib skills README.md test --glob '!**/dist/**'`：通过；剩余命中为允许的 host-agent route 文案、Core `host-agent-workflows` public import、internal AI provider 配置字段和测试断言。
- 额外验证：
  - `npm run lint`：未通过；失败点为既有 `lib/bootstrap.ts` 非空断言与 `lib/cli/SetupService.ts` console 规则，非本轮改动文件。
- 遗留风险：
  - `aiProvider` 仍作为 Plugin 内部 provider manager / embedding / HTTP AI route 的配置字段残留；本轮未删除仍被 runtime 引用的配置层。
  - `@alembic/core/host-agent-workflows` public import path 仍会在扫描中出现；它不是本地 Agent runtime 或 provider fallback。
  - 本地 Alembic CLI install probe 依赖 `alembic daemon --help` 识别产品 CLI；未来 CLI 命令变化时需同步 resolver。
- 下一步建议：总控复核 Plugin `enhancementRoute` 是否满足 Dashboard / Codex 展示需要；如 Alembic daemon 后续新增 MCP bridge capability 字段，Plugin 只消费字段，不复制 daemon / JobStore / ProjectRegistry。

### AlembicAgent

- 状态：已完成
- 执行记录：[`docs/AlembicAgent/alembic-ai-source-boundary-agent-runtime-2026-05-18.md`](../../../../AlembicAgent/alembic-ai-source-boundary-agent-runtime-2026-05-18.md)
- 提交 hash：
  - `7dbf724f2f2ac1dea526c671da67d73122b3dc23` - `Align agent source defaults`
  - `07ec864e8878fc0eaa233365dc27fddab949a228` - `Align agent gateway source identity`
- 完成范围：
  - `knowledge.submit` 非 bootstrap 新写入默认 source 改为 `alembic-agent`。
  - `knowledge.submit` gateway 批次级 `source` 与 `options.userId` 改为 `alembic-agent`。
  - `knowledge.manage` evolution 默认 fallback 从 `ide-agent` 改为 `alembic-agent`。
  - `ide-agent` 仅保留为兼容输入。
  - `file-change`、`rescan-evolution`、`metabolism`、`decay-scan`、`consolidation`、`relevance-audit` 等 domain-specific source 保留。
  - terminal / sandbox 继续归属 Agent tool capability，本轮未迁给 Plugin。
- 验证命令与结果：
  - `npx biome format --write src/tools/v2/handlers/knowledge.ts test/tool-v2-contract.test.ts`：通过。
  - `npx vitest run test/tool-v2-contract.test.ts`：通过，1 个测试文件、6 个测试通过。
  - `npm run build:check`：通过。
  - `npm run smoke:public-imports`：通过，15 个 public subpath 可导入，5 个 forbidden subpath 被拒绝。
  - `npm run lint:public-api-boundary`：通过。
  - `git diff --check`：通过。
  - `rg -n "ide-agent|ide-edit|host-agent|alembic-agent|agent-tool|rescan-evolution|file-change" src test --glob '!**/dist/**'`：通过；剩余命中均为兼容、保留 domain source、测试断言或 Core public import 路径；`agent-tool` 无命中。
  - `npm run check`：通过，9 个测试文件、39 个测试通过；Biome 仍报告 23 个既有 warning，本轮未新增相关 warning。
- 残留扫描：
  - `ide-edit`：无命中。
  - `ide-agent`：仅 legacy compatibility 常量和测试断言。
  - `agent-tool`：无命中。
  - `host-agent`：仅 `@alembic/core/host-agent-workflows` public import path，不是 knowledge source 写入值或 AI provider fallback。
  - `file-change` / `rescan-evolution`：保留为 evolution domain source。
- 遗留风险：不需要 Core 追加 helper；总控验收需接受 `host-agent-workflows` 作为 Core import path 残留解释。
- 下一步建议：`Alembic`、`AlembicAgent`、`AlembicDashboard` 已进入待验收；继续派发 `AlembicPlugin` 完成 host-agent 写入和 enhancement resolver。

### AlembicDashboard

- 状态：已完成
- 执行记录：[`docs/AlembicDashboard/alembic-ai-source-boundary-dashboard-labels-2026-05-18.md`](../../../../AlembicDashboard/alembic-ai-source-boundary-dashboard-labels-2026-05-18.md)
- 提交 hash：`26369661193fb42d9f7db0d7df6440a01cab656e`
- 完成范围：
  - 新增 `src/utils/sourceLabels.ts` 作为 Dashboard 共享 source label helper，统一 `host-agent`、`alembic-agent`、`host-edit`、旧 `ide-agent` / `ide-edit` 兼容来源和现有 domain source。
  - `ProposalSource` 类型补齐 `host-agent`、`alembic-agent`、`host-edit`，旧 `ide-agent` / `ide-edit` 仅作为兼容显示。
  - Candidates、Knowledge、Recipes、EvolutionPanel、ScanResultCard、SignalReport、SignalMonitor、TokenUsageChart 和 DrawerContent Reasoning source 展示改为共享 label。
  - AI provider / model / key / configSource 保持在 AI config UI/API 语义中，没有被纳入 knowledge source label helper。
- 验证命令与结果：
  - `npm run build`：通过；Vite 仍提示既有 large chunk warning。
  - `npm run`：通过；确认当前脚本只有 `dev`、`build`、`preview`，无额外 `check` script。
  - `git diff --check`：通过。
  - `git diff --check HEAD~1..HEAD`：通过。
  - `rg -n "ide-agent|ide-edit|host-agent|alembic-agent|aiProvider|provider" src --glob '!**/dist/**'`：通过；剩余命中为 source contract 类型 / label / i18n 兼容文案、Help host-agent 说明和 AI provider config UI/API。
  - `rg -n "provider.*host-agent|aiProvider.*host-agent|model.*host-agent|configSource.*host-agent|host-agent.*provider|host-agent.*model|provider.*alembic-agent|aiProvider.*alembic-agent|model.*alembic-agent|configSource.*alembic-agent|alembic-agent.*provider|alembic-agent.*model" src --glob '!**/dist/**'`：无命中。
  - `node scripts/verify-workspace-docs.mjs --all-workspace`：通过。
  - `node scripts/check-dispatch-coverage.mjs`：通过；当前只发送给 `AlembicPlugin`。
- 遗留风险：Dashboard 只能展示 source contract；新写入是否彻底停止旧 `ide-agent` / `ide-edit` 仍需后端写入侧和总控验收确认。未知未来 source 会回退原始字符串展示。
- 下一步建议：继续派发 `AlembicPlugin`；总控验收时将 AI provider config 命中与 knowledge source 命中分开判断。

### AlembicCore

- 状态：观察中；除非消费层证明 Core helper 缺失，否则不派发。

### BiliDili

- 状态：无任务
