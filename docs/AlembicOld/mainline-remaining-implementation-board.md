# 新主线剩余实现任务拆分与同步看板

## 目标

这份文档用于承接 `mainline-legacy-detail-logic-inventory.md` 中尚未完成的逻辑，实现方式以新主线为准：

1. `agent / tools / workflows` 继续保留为新主线组成部分，但内部提交、召回、审计、修复逻辑要逐步接到 `lib/mainline/*`。
2. 不再新增兼容型旧抽象；需要旧逻辑时，直接抽取成新主线策略或执行器。
3. 冷启动和增量扫描的核心目标仍是“内容挖掘”和“知识注入”，中间层能力必须服务这两条主线。
4. 每完成一轮实现，必须回写本文档：状态、变更文件、验证结果、遗留问题。

## 状态说明

| 状态 | 含义 |
| --- | --- |
| todo | 尚未开始 |
| in-progress | 当前轮正在实现 |
| blocked | 需要额外决策或依赖 |
| review | 已实现，等待集成检查 |
| done | 已实现并有测试或类型检查覆盖 |
| pruned | 明确剪枝，不进入新主线 |

## 当前已完成基线

| 能力 | 当前状态 | 说明 |
| --- | --- | --- |
| 统一 Recipe 实体与旧字段保真 | done | `Recipe`、`RecipeKnowledgePayload`、Markdown codec/store 已存在 |
| Recipe 提交策略 | done | `RecipeSubmissionPolicy`、tools/MCP admission、consolidation action 已接入 |
| Recipe 相似度与质量评分 | done | `RecipeSimilarityPolicy`、`RecipeQualityPolicy` 已有 |
| Agent 扫描产物写入闸门 | done | `AgentRecipeProductionWriter` 已接 `RecipeSubmissionPolicy` |
| 文件变更影响分析 | done | `RecipeImpactAnalyzer` 与增量编译、内部 rescan 已接入 |
| 注入压缩与排序 | done | `RuntimeRecipeRanker`、`RecipeInjectionCompressor` 已接入 Agent 注入规划 |
| SourceRef 报告与修复工具 | done | repair utility 与 `alembic_knowledge source_ref_repair` 显式入口已接入 |
| Project panorama / evidence | done | 编译会话已输出全景与证据链接 |
| lifecycle / decay / reverse health | done | rescan audit、runtime 注入降权、报告型健康信号已接入 |
| mainline search confidence | done | sparse confidence、query meta、semantic degraded 信号已接入 |

## 总任务清单

| ID | 状态 | 任务 | 写入范围 | 验收标准 |
| --- | --- | --- | --- | --- |
| M1 | done | 统一 tools/MCP 的 Recipe 提交闸门 | `lib/tools/v2/handlers/knowledge.ts`、`lib/external/mcp/handlers/knowledge.ts`、必要的 mainline helper、测试 | `knowledge.submit` 与 `alembic_submit_knowledge` 在写旧库前先跑 `RecipeSubmissionPolicy`，返回一致的 reject/duplicate/merge hints |
| M2 | done | 实现 merge/reorganize 的主线执行闭环 | `lib/mainline/knowledge/*`、tools/MCP 返回结构、测试 | policy 的 `merge/reorganize` 决策不再只是提示，至少形成可持久化或可返回的 mainline consolidation action |
| M3 | done | 把 decay/reverse health 接入 rescan audit | `KnowledgeRescanPlanner.ts`、`RecipeAuditEvidence.ts`、`lib/mainline/compile/*`、测试 | audit 结果可包含 sourceRef、symbol、usage/quality 的 decay reason，且不依赖旧 ReverseGuard 自动提案 |
| M4 | done | SourceRef repair 正式入口 | `lib/workflows/knowledge-rescan/*` 或 MCP/tool handler、`RecipeMarkdownSyncService`、测试 | 默认 report-only；显式 repair 时执行 path rewrite 并同步 Markdown/ContextIndex |
| M5 | done | mainline search confidence 与降级信号 | `lib/mainline/search/*`、`lib/external/mcp/handlers/search.ts`、`lib/tools/v2/handlers/knowledge.ts`、测试 | 主线 sparse search 返回 confidence/topGap/exact/codeQuery/naturalLanguage 标记，并在 semantic 不可用时清晰报告 degraded |
| M6 | done | 冷启动 session 级跨维度去重 | `lib/workflows/capabilities/execution/internal-agent/*`、`AgentRecipeProductionWriter`、测试 | `_bootstrapDedup` 由新主线 similarity/dedup 语义统一驱动，避免并发 dimension 重复提交 |
| M7 | done | 外部 rescan 与内部 rescan 的 impact 决策对齐 | `ExternalKnowledgeRescanWorkflow.ts`、`MainlineRescanImpactDecisions.ts`、测试 | 外部 rescan 可使用同一套 deterministic impact decision，而不仅是 audit |
| M8 | done | Runtime 注入使用健康信号降权 | `RuntimeRecipeRanker.ts`、`RuntimeRetrievalPipeline.ts`、`KnowledgeInjectionRunner.ts`、测试 | stale sourceRef、reverse health warning、decay score 能降低注入排序，不直接删除知识 |
| M9 | done | Recipe evidence 驱动审计闭环 | `RecipeEvidenceLinker.ts`、`MainlineCompileSession.ts`、rescan planner、测试 | evidence 不仅输出报告，也可作为 audit/decay 的输入 |
| M10 | pruned | Wiki tool 锻造、AI mock bootstrap、默认 CrossEncoder、ReverseGuard 自动优化 | 无 | 不再进入新主线热路径 |

## 第一轮执行拆分

第一轮目标是先补“入口一致性”和“审计可用性”，不碰 AgentRuntime 主循环，不改 tools/workflows 目录结构。

| 子 agent | 状态 | 任务 | 写入范围 | 注意事项 |
| --- | --- | --- | --- | --- |
| Agent A | done | M1: tools/MCP submit 统一接入 `RecipeSubmissionPolicy` | `lib/tools/v2/handlers/knowledge.ts`、`lib/external/mcp/handlers/knowledge.ts`、可新增 `lib/mainline/knowledge/RecipeSubmissionAdmission.ts`、相关测试 | 新增注释使用中文；不要绕过旧持久化，但要在写入前先得到主线 admission 结果 |
| Agent B | done | M3: rescan audit 接入 `MainlineDecayPolicy` 与 `MainlineReverseHealthCheck` | `KnowledgeRescanPlanner.ts`、`RecipeAuditEvidence.ts`、`lib/mainline/compile/*`、相关测试 | 只做报告与 audit reason，不自动 proposal，不恢复旧 ReverseGuard |
| Agent C | done | M5: mainline search confidence | `lib/mainline/search/*`、`lib/external/mcp/handlers/search.ts`、`lib/tools/v2/handlers/knowledge.ts`、相关测试 | 保持轻量；不要引入 CrossEncoder 或强制 vector |
| 主 agent | done | 集成、冲突处理、文档同步、类型检查 | 全局协调 | 每轮结束后更新本文档状态 |

## 第一轮验收命令

优先执行：

```bash
npm run typecheck
```

按变更范围补跑：

```bash
npm run test:unit -- MainlineRecipeSubmissionPolicy
npm run test:unit -- MainlineRecipeHealth
npm run test:unit -- MainlineSearch
```

如果 vitest 参数不匹配本项目配置，则改为直接运行相关测试文件。

## 第二轮候选拆分

第二轮应在第一轮入口统一后推进，目标是把“判断结果”变成“可执行闭环”。

| 子 agent | 任务 | 写入范围 | 验收标准 |
| --- | --- | --- | --- |
| Agent D | done | M2: merge/reorganize 主线执行闭环 | `lib/mainline/knowledge/*`、tools/MCP 返回结构、测试 | 相似度策略返回 merge/reorganize 后，有统一 action 结构；调用方可以选择执行或交给 review |
| Agent E | done | M4: SourceRef repair 正式入口 | `lib/workflows/knowledge-rescan/*`、`lib/external/mcp/handlers/mainline-recipe-markdown.ts`、`RecipeMarkdownSyncService`、测试 | repair 默认不自动执行；显式触发时修 Markdown 与 ContextIndex，同步 report |
| Agent F | done | M6: 冷启动跨维度去重 | `BootstrapRescanState.ts`、`BootstrapDimensionRuntimeBuilder.ts`、`AgentRecipeProductionWriter.ts`、测试 | sharedState 里的 `_bootstrapDedup` 与 `RecipeSubmissionPolicy` 统一相似度语义 |
| 主 agent | done | M7/M8/M9 边界确认 | rescan/workflow/runtime | 外部 rescan impact、runtime source health 降权、evidence audit 已补齐 |

### Round 2

状态：done

目标：

1. M2: 把 merge/reorganize 判断转成主线 consolidation action。
2. M4: 暴露 SourceRef repair 显式入口，默认 report-only。
3. M6: 冷启动 session 级去重与 `RecipeSubmissionPolicy` 相似度语义对齐。

变更文件：

- `lib/mainline/knowledge/RecipeSubmissionPolicy.ts`
- `lib/mainline/knowledge/RecipeSubmissionAdmission.ts`
- `lib/mainline/knowledge/SourceRefRepairService.ts`
- `lib/mainline/knowledge/index.ts`
- `lib/service/bootstrap/BootstrapDedup.ts`
- `lib/service/knowledge/RecipeProductionGateway.ts`
- `lib/workflows/capabilities/execution/internal-agent/BootstrapRescanState.ts`
- `lib/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanner.ts`
- `lib/workflows/knowledge-rescan/external/ExternalKnowledgeRescanWorkflow.ts`
- `lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts`
- `lib/mainline/runtime/RuntimeRecipeRanker.ts`
- `lib/external/mcp/handlers/consolidated.ts`
- `lib/external/mcp/handlers/types.ts`
- `lib/external/mcp/tools.ts`
- `lib/shared/schemas/mcp-tools.ts`
- `test/unit/MainlineRecipeSubmissionPolicy.test.ts`
- `test/unit/MainlineSourceRefRepair.test.ts`
- `test/unit/BootstrapDedup.test.ts`
- `test/unit/KnowledgeRescanPlan.test.ts`
- `test/unit/MainlineRuntimeInjectionCompression.test.ts`

验证：

- `npm run typecheck` 通过。
- `npx vitest run test/integration/ZodSchemas.test.ts` 通过。
- `npx vitest run test/unit/MainlineRecipeSubmissionPolicy.test.ts test/unit/KnowledgeRescanPlan.test.ts test/unit/MainlineRuntimeInjectionCompression.test.ts test/unit/MainlineRecipeHealth.test.ts` 通过。
- `npx vitest run test/unit/MainlineSourceRefRepair.test.ts test/unit/BootstrapDedup.test.ts test/unit/production-gateway.test.ts` 通过。
- `npx vitest run test/unit/BootstrapRescanState.test.ts test/unit/BootstrapDimensionRuntimeBuilder.test.ts test/unit/MainlineAgentRecipeProductionWriter.test.ts` 通过。

遗留问题：

- 本看板定义的 M1-M9 均已完成；M10 为明确剪枝项。
- MCP markdown sync 单测在 sandbox 下仍会打印 best-effort EPERM 日志，不影响通过结果。

## 同步记录

### Round 1

状态：done

目标：

1. 建立任务看板。
2. 并行推进 M1、M3、M5。
3. 集成后更新本节为 implemented / verified / remaining。

变更文件：

- `lib/mainline/knowledge/RecipeSubmissionAdmission.ts`
- `lib/tools/v2/handlers/knowledge.ts`
- `lib/external/mcp/handlers/knowledge.ts`
- `lib/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanner.ts`
- `lib/mainline/search/SearchIndex.ts`
- `lib/mainline/search/HybridSearch.ts`
- `lib/mainline/runtime/RuntimeRetrievalPipeline.ts`
- `lib/external/mcp/handlers/search.ts`
- `lib/service/search/SearchTypes.ts`
- `test/unit/KnowledgeAPI.test.ts`
- `test/unit/V2ToolSystem.test.ts`
- `test/unit/KnowledgeRescanPlan.test.ts`
- `test/unit/MainlineSearch.test.ts`

验证：

- `npm run typecheck` 通过。
- `npx vitest run test/unit/KnowledgeAPI.test.ts test/unit/V2ToolSystem.test.ts` 通过。
- `npx vitest run test/unit/KnowledgeRescanPlan.test.ts test/unit/MainlineRecipeHealth.test.ts test/unit/MainlineSearch.test.ts` 通过。

遗留问题：

- MCP markdown sync 单测在 sandbox 下会打印 `~/.asd` 写入被跳过的 EPERM 日志；这是 best-effort 路径，测试通过。
- M2/M4/M6/M7/M8/M9 进入第二轮。
