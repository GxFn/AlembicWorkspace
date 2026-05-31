# Plugin Coldstart Rescan Test Optimization Stage 0 Inventory

状态：Stage 0 只读 inventory 完成 / 待 AlembicPlugin 小范围测试整理
日期：2026-05-31
维护窗口：AlembicWorkspace
Design Key：`PLUGIN-COLDSTART-RESCAN-TEST-OPTIMIZATION-2026-05-31`
目标仓库：`AlembicPlugin`

## 总控判断

用户目标：优化 AlembicPlugin 的 Plugin 级 cold-start / rescan 测试闭环，只验证 Plugin cold-start 能产出 Recipe、已有 Recipe 后 rescan 能基于增量扫描保留 / 补充 / 演进；不纳入无关外围逻辑。

当前证据：Design handoff 已导入总控 inbox，用户确认状态为 `confirmed`；总控已读取原始计划和需求设计，并只读复核 AlembicPlugin 现有 codex-session harness、scenario、artifact analyzer、bootstrap / submit / dimension complete / rescan handler。

当前主线关系：P2 testing optimization 候选，不打断当前 WWO / PCVM 暂停主线；可以作为 AlembicPlugin 后续小范围测试整理任务。

最小闭环：

```text
fixture project
-> alembic_bootstrap
-> real Codex thread handles architecture
-> alembic_submit_knowledge
-> alembic_dimension_complete
-> Recipe persisted
-> alembic_rescan({ dimensions: ['architecture'] })
-> preserved Recipe / evidencePlan / no duplicate
```

第一阻塞点：现有 codex-session scenario 只跑到 status / init / bootstrap；没有测试驱动 `alembic_submit_knowledge`、`alembic_dimension_complete` 或 `alembic_rescan`，因此无法证明 Plugin Recipe loop。

## 只读代码事实

### 已有主链路

- `lib/external/mcp/handlers/bootstrap/ExternalColdStartWorkflow.ts`：`alembic_bootstrap` 执行 full reset、ProjectIntelligence Phase 1-4、创建 external workflow session，并返回 Mission Briefing；不启动本地 AI pipeline。
- `lib/external/mcp/handlers/consolidated.ts`：`enhancedSubmitKnowledge` 调用 `RecipeProductionGateway.create()` 创建 Recipe，并通过 `_trackSubmission` 把 created recipe id 记录进 bootstrap session tracker。
- `lib/external/mcp/handlers/dimension-complete/ExternalDimensionCompletionWorkflow.ts`：`alembic_dimension_complete` 可从 session tracker 恢复 `submittedRecipeIds`，绑定 dimension / `bootstrap:<sessionId>` tag，保存 checkpoint，并生成 dimension skill。
- `lib/external/mcp/handlers/rescan/ExternalKnowledgeRescanWorkflow.ts`：`alembic_rescan` snapshot 已有 Recipe，执行 rescan clean / sync / audit，按 requested dimensions 构建 knowledge rescan plan、prescreen、evidencePlan 和 rescan Mission Briefing。

结论：Design 判断成立，当前不是缺产品主链路，而是缺 Plugin 级测试闭环。

### 现有 codex-session harness

- `scripts/verify-codex-session-scenarios.mjs`：只运行 `test/unit/CodexSessionScenarioRunner.test.ts`；支持 `in-process` / `live-local`，但 `live-local` 要求显式 scenario、projectRoot 和 real Alembic home。
- `test/support/codex-session/ScenarioRunner.ts`：当前直接实例化 `CodexScenarioAgentSimulator`，循环执行 scenario turns，再调用 `buildScenarioFacts` / `analyzeScenarioResult`，写出 transcript、result、summary 和 run-config。
- `test/support/codex-session/AgentSimulator.ts`：当前只会基于自然语言触发 `alembic_codex_status`、`alembic_codex_init`、`alembic_bootstrap`；不会执行 `alembic_submit_knowledge`、`alembic_dimension_complete` 或 `alembic_rescan`。
- `test/support/codex-session/McpHarness.ts`：in-process harness 可直接调用 `CodexMcpServer.handleToolCall()` 并记录 tool calls；live-local harness 也只是记录 fetch / supervisor 调用。
- `test/support/codex-session/AgentOutputAnalyzer.ts`：已有可保留的机械证据能力，包括 Recipe markdown 文件数量、candidate 文件数量、`knowledge_entries` 总数 / lifecycle、tool calls、workspace state、side effects、job facts 和 transcript redaction。
- `test/support/codex-session/ScenarioTypes.ts`：scenario expectation 已支持 `minRecipeFiles`、`minKnowledgeEntries`、`minCandidateFiles`，但缺 source refs、dimension、lifecycle、preserved/evidencePlan/no-duplicate 的结构化断言。

结论：`CodexScenarioAgentSimulator` 是本需求的退场对象；`ScenarioRunner` / `McpHarness` / `AgentOutputAnalyzer` 中的机械工具调用、artifact 统计和报告能力可以保留或迁移。

### 现有 scenarios

当前 cold-start scenarios 只有：

- `test/codex-scenarios/cold-start/explicit-init.json`
- `test/codex-scenarios/cold-start/init-then-bootstrap-ai-ready.json`
- `test/codex-scenarios/cold-start/bootstrap-missing-ai.json`

它们覆盖：

- 显式 projectRoot 初始化。
- 无 AI Provider 时默认走 host-agent `alembic_bootstrap`。
- 初始化后启动 bootstrap 返回 Mission Briefing。

它们不覆盖：

- cold-start 后提交 Recipe。
- `dimension_complete` 绑定 Recipe / session。
- `alembic_rescan({ dimensions: ['architecture'] })`。
- preserved Recipe、evidencePlan、unchanged no duplicate。

## 验证证据

已运行：

```bash
npm run verify:codex-session
```

结果：

- `test/unit/CodexSessionScenarioRunner.test.ts` 通过。
- `5` tests passed，`1` test file passed。
- 该验证只能证明现有 status / init / bootstrap scenario harness 可用，不能证明 Recipe loop。

## Stage 0 结论

1. `CodexScenarioAgentSimulator` 可以按 Design 裁决退场；不建议继续扩展自然语言正则或伪 Agent action DSL。
2. `ScenarioRunner` 不应再伪装 Agent 行为；可以保留为机械工具调用 / fixture / artifact report runner，或拆出纯 runner。
3. `AgentOutputAnalyzer` 的 Recipe 文件和 `knowledge_entries` 统计可作为第一版断言起点。
4. 第一版需要补的不是产品逻辑，而是 Codex thread acceptance pack 与机械 evidence checker。
5. 若后续真实单维验收发现产品链路断裂，再按断点归口修复；不得把测试缺口扩大成 cold-start / rescan 重构。

## 建议后续任务包

任务包 ID：`PLUGIN-COLDSTART-RESCAN-TEST-OPTIMIZATION-STAGE-1-2`
窗口：`AlembicPlugin`
阶段目标：退场伪 Agent simulator，并补真实 Codex thread architecture Recipe loop 验收包。

主线动作：

- 删除或退场 `CodexScenarioAgentSimulator`，同步调整 `ScenarioRunner` / `verify-codex-session` 对它的依赖。
- 保留或迁移 `AgentOutputAnalyzer` 的机械 artifact 统计能力。
- 新增 Codex thread acceptance pack：固定 `architecture` 单维，写清 `alembic_bootstrap`、`alembic_submit_knowledge`、`alembic_dimension_complete`、`alembic_rescan({ dimensions: ['architecture'] })` 的工具顺序、输入边界、回填证据和停止条件。
- 第一版 evidence checker 至少断言 Recipe persisted、`knowledge_entries`、dimension/lifecycle/source refs 基础字段、rescan evidencePlan、unchanged no duplicate。

明确不包含：

- 不改 cold-start / rescan 产品行为。
- 不引入 AI provider / 外部 API key。
- 不测试 resident daemon job、packaged runtime parity、Dashboard 或真实项目。
- 不启动自动化。

验证建议：

- `npm run verify:codex-session`
- 针对新增 checker 的 focused unit / script。
- 若新增 Codex thread acceptance pack，只生成验收包和机械 checker；真实 Codex thread 执行由总控后续裁决，不由 AlembicPlugin 伪造。

回填要求：

- 提交 hash 或 no-commit 理由。
- 删除 / 保留文件清单。
- 验证命令和结果。
- 新增 acceptance pack 路径。
- evidence checker 输出样例或报告路径。
- 若发现产品链路断点，必须按断点单独回填，不得顺手重构。
