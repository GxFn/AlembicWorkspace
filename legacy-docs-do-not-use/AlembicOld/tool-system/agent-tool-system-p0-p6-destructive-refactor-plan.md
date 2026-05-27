# Agent 工具体系 P0-P6 破坏性重构收束计划

本文承接 `docs-dev/agent-tool-system-decoupled-implementation-plan.md` 的 P0-P6 进度，目标是把已经落地的新主路径继续收束为单一、明确、可删除旧结构的实现形态。

本阶段继续按“破坏性重构”执行：可以删除旧结构、重写调用链、调整 API 返回结构，不以兼容旧入口为主要约束。唯一需要保持的是业务语义、权限安全、可观测性和测试可验证性。

## 1. 当前结论

P0-P6 的核心主路径已经成立：

- `CapabilityCatalog` 已成为大部分 surface 的能力事实源。
- `ToolRouter` 已成为 Runtime、HTTP direct、MCP、Dashboard 命令型操作、Workflow/composer 的主要执行入口。
- `GovernanceEngine` 已集中处理 surface、role、Gateway、SafetyPolicy、schema plan 校验、abort、cache、timeout、concurrency。
- `ToolResultEnvelope` 已成为 adapter 和 surface 投影的主要结果契约。
- `WorkflowAdapter` 与 `DynamicComposer` 的 parent/child call 已进入统一 Router/Governance 路径。
- Internal tools 已开始从松散 context 迁移到 typed handler context 和命名 service contract。

但系统仍处于“新主路径已成形，旧桥接结构仍残留”的状态。下一阶段不再继续扩大兼容层，而是逐步删除旧入口、压缩 fallback、把业务依赖按服务域显式化。

## 2. P0-P6 状态汇总

### P0 架构骨架

已完成核心契约和骨架。`ToolContracts`、`ToolCallContext`、`ToolRouter`、`GovernanceEngine`、`ToolResultEnvelope`、`CapabilityCatalog` 已可支撑统一路径。

剩余问题：

- `legacyContext` 仍作为迁移桥存在。
- `ToolExecutionPipeline` 仍承担 Runtime 执行壳职责。
- `ToolRegistry.executeInternal()` 仍是无 Router fallback。

### P1 能力事实源

已完成主路径迁移。Runtime schema、HTTP capabilities、direct gate、Forge directory、`get_tool_details` 均已转向 `CapabilityCatalog`。

剩余问题：

- 目前仍是 projection-first：`ToolDefinition` 经 `CapabilityProjection` 生成 manifest。
- `CapabilityProjection.ts` 内仍有部分治理推导表。
- `tools/index.ts` 仍承担静态工具聚合职责。

### P2 结果契约

`ToolRouter` 与 adapters 已返回 `ToolResultEnvelope`，Runtime/HTTP/MCP/Dashboard 已识别 envelope。

剩余问题：

- internal handler 仍可返回裸对象或 `{ error }`。
- surface-local projector 仍存在。
- task 层有局部 envelope-to-structure 投影。

### P3 统一入口

Runtime、HTTP direct、MCP call、Dashboard 命令型操作、Workflow/composer 已经进入 `ToolRouter`。

剩余问题：

- Dashboard CRUD 类 route 仍有直接 service 调用。
- Runtime `ToolExecutionPipeline` 仍不是纯 observation 组件。

### P4 治理内核

核心治理已进入 `GovernanceEngine` 和 `ToolRouter`。

剩余问题：

- policy validator、cache、diagnostics、Gateway mapping 等治理输入仍分散在 runtime/context/service locator 中。
- 需要继续把治理依赖整理为明确 contract。

### P5 Workflow/composer

Workflow parent 与 composer child calls 已是一等调用路径。

剩余问题：

- UI/报告层尚未按 callId 合并展示 parent/child trace。
- `DynamicComposer` 仍是独立 composer，而不是统一 Workflow authoring service。

### P6 Internal tools 重分层

已完成：

- `InternalToolHandlerContext`
- `ForgedInternalToolStore`
- `ToolRoutingServiceContract`
- `ToolKnowledgeServiceContract`
- Registry metadata/schema/execute 旧 API 大幅删除

剩余问题：

- Guard、Lifecycle、Infra、Quality 等 internal tools 仍大量使用 `ctx.container.get(...)`。
- `ToolRegistry` 仍同时承担静态注册、handler store、forged projection、router 持有。
- `executeInternal()` fallback 仍保留旧执行语义。

## 3. 统一收束原则

后续改动必须满足以下规则：

- Surface 只能构造 `ToolCallRequest` 或读取 `CapabilityCatalog`，不能直接调用业务 service。
- Router 是唯一执行入口，Registry 不再具备执行语义。
- Governance 只产出 decision，不执行 handler，不格式化 HTTP/MCP/Dashboard response。
- Adapter 只执行已治理的 capability，不自行做 surface/role/Gateway 判断。
- Internal handler 只能通过 typed context 或命名 service contract 获取依赖。
- 旧测试如果只验证旧结构耦合，应删除或重写；如果验证业务语义，应迁移到新接口。

## 4. 待删除或降级结构

优先删除或降级：

- `ToolExecutionPipeline` 的执行职责：后续改为 Runtime observation/trace 组件。
- `ToolRegistry.executeInternal()`：后续只允许测试私有 fallback，最终删除。
- `legacyContext`：后续按服务域迁移完后删除。
- `ctx.container.get(...)`：按服务域替换为命名 service contract。
- `CapabilityProjection.ts` 内治理推导表：后续改为 manifest-first。
- Dashboard CRUD route 的 service 直调：后续改为 dashboard-operation/workflow capability。

## 5. 本轮实现切片：Guard Service Contract

本轮选择 Guard 域作为 P6 的下一步收束切片，原因：

- Guard 工具属于明确业务服务域，边界清晰。
- 它涉及 `guardService`、`guardCheckEngine`、`violationsStore` 三类服务，适合验证命名 contract 设计。
- `guard_check_code` 是有安全语义的工具，迁移后能继续验证权限、abort 和可观测性不回退。

本轮目标：

1. 新增 `ToolGuardServiceContract`。
2. 在 `ToolRouter` 创建 `ToolCallContext` 时注入 `guard` contract。
3. 新增 `ToolGuardServices.ts`，提供 contract 创建、解析、类型守卫和 require helper。
4. 迁移 `lib/agent/tools/guard.ts`，不再直接读取 `ctx.container.get('guardService' | 'guardCheckEngine' | 'violationsStore')`。
5. 迁移 `analyze_code` 中的 Guard 分支，使组合工具也通过同一 contract 读取 Guard 依赖。
6. 增加测试，确保 Guard 工具优先使用 named contract；当 container lookup 被禁止时仍能工作。

本轮不做：

- 不拆 `ToolRegistry`。
- 不删除 `executeInternal()`。
- 不重写 Dashboard CRUD。
- 不改 handler 返回结构。
- 不迁移 Lifecycle/Infra/Quality 域。

### 5.1 本轮完成情况

已完成：

- 新增 `ToolGuardServiceContract`，挂载到 `ToolServiceContracts.guard`。
- 新增 `ToolGuardServices.ts`，集中提供 Guard 域 service contract 的创建、解析、类型守卫和 helper：
  - `guardService`
  - `guardCheckEngine`
  - `violationsStore`
- `ToolRouter` 在创建 `ToolCallContext` 时注入 `guard` contract。
- `guard.ts` 已迁移：
  - `list_guard_rules` 通过 named contract 读取 `guardService` / `guardCheckEngine`。
  - `guard_check_code` 通过 named contract 优先读取 `guardCheckEngine`，再降级到 `guardService`。
  - `query_violations` 通过 named contract 读取 `violationsStore`。
  - `get_recommendations` 顺手复用已存在的 `ToolKnowledgeServiceContract`，不再直接读取 `knowledgeService`。
- `analyze_code` 的 Guard 分支已迁移到同一 Guard contract，不再直接读取 `guardCheckEngine` / `guardService`。
- `AgentTools.test.ts` 新增 Guard contract-first 测试，验证 container lookup 被禁止时仍可正常执行。

本轮没有改变 handler 返回结构，也没有拆分 `ToolRegistry`；这些继续留给后续切片。

## 6. 验收标准

本轮完成后应满足：

- `guard.ts` 中 Guard 域服务依赖不再直接使用 `ctx.container.get(...)`。
- `ToolRouter` 会把 Guard 服务 contract 注入 `ToolCallContext.serviceContracts.guard`。
- `list_guard_rules`、`guard_check_code`、`query_violations` 可通过 named contract 独立测试。
- `analyze_code` 的 Guard 分支复用同一解析逻辑。
- 聚焦测试和 TypeScript 编译通过。

本轮验证：

- `npx vitest run test/unit/AgentTools.test.ts test/unit/ToolRouterGovernance.test.ts test/integration/ToolPipeline.test.ts` 通过：3 个测试文件，83 个测试。
- `npm run typecheck` 通过。

## 7. 下一轮候选切片

Guard 切片完成后，后续按风险和耦合程度继续推进：

1. Lifecycle service contract：迁移 submit/approve/reject/publish/deprecate/update/usage 等生命周期工具。
2. Infra service contract：迁移 indexing、audit、knowledge graph impact 等基础设施工具。
3. Quality service contract：迁移 quality scorer、candidate validator、feedback collector。
4. Registry 拆分：拆成 bootstrap registry、frozen handler store、forged internal store。
5. Runtime pipeline 删除执行职责：保留 observation/trace/cache adapter 边界。
6. Manifest-first 样板：选择一个工具域从 `ToolDefinition + projection` 改为 `defineInternalCapability({ manifest, handler })`。

## 8. 第二轮实现切片：Lifecycle Service Contract

第二轮选择 Lifecycle 核心服务域，继续收束 `ctx.container.get(...)` 的业务依赖。

本轮目标：

1. 新增 `ToolLifecycleServiceContract`。
2. 在 `ToolRouter` 创建 `ToolCallContext` 时注入 `lifecycle` contract。
3. 新增 `ToolLifecycleServices.ts`，提供 lifecycle 域 service contract 的创建、解析、类型守卫和 helper。
4. 迁移 `lib/agent/tools/lifecycle.ts` 的核心生命周期工具：
   - `submit_knowledge`
   - `approve_candidate`
   - `reject_candidate`
   - `publish_recipe`
   - `deprecate_recipe`
   - `update_recipe`
   - `record_usage`
5. `quality_score` 中读取 recipe 的 `knowledgeService` 依赖也迁到 lifecycle contract，但 `qualityScorer` 仍保留给后续 Quality 切片。
6. 增加 contract-first 测试，确保 container lookup 被禁止时核心生命周期操作仍可执行。

本轮不做：

- 不迁移 `qualityScorer`、`recipeCandidateValidator`、`feedbackCollector`；它们属于后续 Quality/Feedback contract。
- 不改变 `submit_knowledge` 的 Gateway 业务语义和返回结构。
- 不拆 `ToolRegistry`。
- 不删除 `executeInternal()`。

### 8.1 本轮完成情况

已完成：

- 新增 `ToolLifecycleServiceContract`，挂载到 `ToolServiceContracts.lifecycle`。
- 新增 `ToolLifecycleServices.ts`，集中提供 lifecycle 域 service contract 的创建、解析、类型守卫和 helper：
  - `knowledgeService`
  - `proposalRepository`
  - `evolutionGateway`
  - `consolidationAdvisor`
- `ToolRouter` 在创建 `ToolCallContext` 时注入 `lifecycle` contract。
- `lifecycle.ts` 的核心生命周期依赖已迁移：
  - `submit_knowledge` 通过 named contract 读取 `knowledgeService`、`proposalRepository`、`evolutionGateway`、`consolidationAdvisor`。
  - `approve_candidate`、`reject_candidate`、`publish_recipe`、`deprecate_recipe`、`update_recipe`、`record_usage` 通过 named contract 读取 `knowledgeService`。
  - `quality_score` 的 recipe 读取路径也通过 named lifecycle contract 获取 `knowledgeService`。
- `AgentTools.test.ts` 新增 Lifecycle contract-first 测试，验证 `approve_candidate`、`update_recipe`、`record_usage` 在 container lookup 被禁止时仍可正常执行。

仍保留给后续切片：

- `quality_score` 的 `qualityScorer`。
- `validate_candidate` 的 `recipeCandidateValidator`。
- `get_feedback_stats` 的 `feedbackCollector`。

### 8.2 本轮验证

- `npx vitest run test/unit/AgentTools.test.ts test/unit/ToolRouterGovernance.test.ts test/integration/ToolPipeline.test.ts` 通过：3 个测试文件，86 个测试。
- `npm run typecheck` 通过。

## 9. 第三轮实现切片：Infra Service Contract

第三轮选择 Infra 基础设施服务域，继续收束基础设施工具中的动态 service locator。

本轮目标：

1. 新增 `ToolInfraServiceContract`。
2. 在 `ToolRouter` 创建 `ToolCallContext` 时注入 `infra` contract。
3. 新增 `ToolInfraServices.ts`，提供 infra 域 service contract 的创建、解析、类型守卫和 require helper。
4. 迁移 `lib/agent/tools/infrastructure.ts` 的基础设施工具：
   - `graph_impact_analysis`
   - `rebuild_index`
   - `query_audit_log`
5. 增加 contract-first 测试，确保 container lookup 被禁止时 Infra 工具仍可执行。

本轮不做：

- 不迁移 `suggest_skills` 的 `knowledgeRepository` / `auditRepository`，它们属于 SkillAdvisor 依赖，后续和 Skill/Advisor contract 一起处理。
- 不迁移 `bootstrap_knowledge`，它仍是外部 bootstrap handler 桥接。
- 不拆 `ToolRegistry`。
- 不删除 `executeInternal()`。

### 9.1 本轮完成情况

已完成：

- 新增 `ToolInfraServiceContract`，挂载到 `ToolServiceContracts.infra`。
- 新增 `ToolInfraServices.ts`，集中提供 infra 域 service contract 的创建、解析、类型守卫和 helper：
  - `knowledgeGraphService`
  - `indexingPipeline`
  - `auditLogger`
- `ToolRouter` 在创建 `ToolCallContext` 时注入 `infra` contract。
- `infrastructure.ts` 的基础设施工具已迁移：
  - `graph_impact_analysis` 通过 named contract 读取 `knowledgeGraphService`。
  - `rebuild_index` 通过 named contract 读取 `indexingPipeline`。
  - `query_audit_log` 通过 named contract 读取 `auditLogger`。
- `AgentTools.test.ts` 新增 Infra contract-first 测试，验证 `graph_impact_analysis`、`rebuild_index`、`query_audit_log` 在 container lookup 被禁止时仍可正常执行。

仍保留给后续切片：

- `suggest_skills` 的 `knowledgeRepository` / `auditRepository`。
- `bootstrap_knowledge` 的 bootstrap handler 桥接。

### 9.2 本轮验证

- `npx vitest run test/unit/AgentTools.test.ts test/unit/ToolRouterGovernance.test.ts test/integration/ToolPipeline.test.ts` 通过：3 个测试文件，89 个测试。
- `npm run typecheck` 通过。

## 10. 第四轮实现切片：Quality / Feedback Service Contract

第四轮选择 Quality / Feedback 服务域，继续收束质量评分、候选校验和反馈统计工具中的动态 service locator。

本轮目标：

1. 新增 `ToolQualityServiceContract`。
2. 在 `ToolRouter` 创建 `ToolCallContext` 时注入 `quality` contract。
3. 新增 `ToolQualityServices.ts`，提供 quality 域 service contract 的创建、解析、类型守卫和 helper。
4. 迁移 `lib/agent/tools/lifecycle.ts` 的质量/反馈工具：
   - `quality_score`
   - `validate_candidate`
   - `get_feedback_stats`
5. 迁移 `knowledge_overview` 中的热门 Recipe 分支，使 `feedbackCollector` 也通过同一 quality contract 读取。
6. 增加 contract-first 测试，确保 container lookup 被禁止时 Quality/Feedback 工具仍可执行。

本轮不做：

- 不改变 `quality_score`、`validate_candidate`、`get_feedback_stats` 的返回结构。
- 不迁移 `knowledge_overview` 中其他历史 direct lookup；这些将随 Knowledge/Infra 组合工具收束继续处理。
- 不拆 `ToolRegistry`。
- 不删除 `executeInternal()`。

### 10.1 本轮完成情况

已完成：

- 新增 `ToolQualityServiceContract`，挂载到 `ToolServiceContracts.quality`。
- 新增 `ToolQualityServices.ts`，集中提供 quality 域 service contract 的创建、解析、类型守卫和 helper：
  - `qualityScorer`
  - `recipeCandidateValidator`
  - `feedbackCollector`
- `ToolRouter` 在创建 `ToolCallContext` 时注入 `quality` contract。
- `lifecycle.ts` 的质量/反馈工具已迁移：
  - `quality_score` 通过 named contract 读取 `qualityScorer`。
  - `validate_candidate` 通过 named contract 读取 `recipeCandidateValidator`。
  - `get_feedback_stats` 通过 named contract 读取 `feedbackCollector`。
- `knowledge_overview` 的热门 Recipe 分支已改为通过 named quality contract 读取 `feedbackCollector`。
- `AgentTools.test.ts` 新增 Quality/Feedback contract-first 测试，验证 `quality_score`、`validate_candidate`、`get_feedback_stats`、`knowledge_overview` 在 container lookup 被禁止时仍可正常执行。

仍保留给后续切片：

- `knowledge_overview` 中的知识库统计和知识图谱统计 direct lookup。
- `suggest_skills` 的 `knowledgeRepository` / `auditRepository`。
- `bootstrap_knowledge` 的 bootstrap handler 桥接。

### 10.2 本轮验证

- `npx vitest run test/unit/AgentTools.test.ts test/unit/ToolRouterGovernance.test.ts test/integration/ToolPipeline.test.ts` 通过：3 个测试文件，93 个测试。
- `npm run typecheck` 通过。

## 11. 第五轮实现切片：Composite Tools Contract Cleanup

第五轮回到组合工具层，把已经存在的 Knowledge / Infra / Lifecycle / Quality contract 应用到 `composite.ts` 的剩余直接 service locator。

本轮目标：

1. 迁移 `analyze_code` 的 Recipe 搜索分支，不再直接读取 `searchEngine`。
2. 迁移 `knowledge_overview` 的知识库统计和知识图谱统计，不再直接读取 `knowledgeService` / `knowledgeGraphService`。
3. 迁移 `submit_with_check` 的提交 Gateway 依赖，不再直接读取 `knowledgeService` / `proposalRepository` / `evolutionGateway`。
4. 增加 contract-first 测试，确保组合工具在 container lookup 被禁止时仍能读取对应命名 contract。

本轮不做：

- 不改变 `analyze_code`、`knowledge_overview`、`submit_with_check` 的返回结构。
- 不重写 `submit_with_check` 为 workflow；它仍保留当前 Gateway 业务语义。
- 不拆 `ToolRegistry`。
- 不删除 `executeInternal()`。

### 11.1 本轮完成情况

已完成：

- `analyze_code` 的 Recipe 搜索分支已通过 `ToolKnowledgeServiceContract` 读取 `searchEngine`。
- `knowledge_overview` 已通过 `ToolKnowledgeServiceContract` 读取 `knowledgeService` 和 `knowledgeGraphService`。
- `knowledge_overview` 的热门 Recipe 分支继续通过 `ToolQualityServiceContract` 读取 `feedbackCollector`。
- `submit_with_check` 已通过 `ToolLifecycleServiceContract` 读取 `knowledgeService`、`proposalRepository`、`evolutionGateway`。
- `composite.ts` 中已无 `container.get(...)` 直接调用。
- `AgentTools.test.ts` 新增组合工具 contract-first 测试，覆盖：
  - `analyze_code` 的 search engine 分支。
  - `knowledge_overview` 的 knowledge stats 和 graph stats 分支。

仍保留给后续切片：

- `submit_with_check` 后续可从复合工具进一步改造成 workflow capability。
- `suggest_skills` 的 `knowledgeRepository` / `auditRepository`。
- `bootstrap_knowledge` 的 bootstrap handler 桥接。

### 11.2 本轮验证

- `npx vitest run test/unit/AgentTools.test.ts test/unit/ToolRouterGovernance.test.ts test/integration/ToolPipeline.test.ts` 通过：3 个测试文件，95 个测试。
- `npm run typecheck` 通过。

## 12. 第六轮实现切片：Knowledge Graph Tools Contract Cleanup

第六轮选择 `knowledge-graph.ts`，把它接入已经存在的 `ToolKnowledgeServiceContract`，继续压缩 internal tools 中的动态 service locator。

本轮目标：

1. 迁移 `check_duplicate` 的 candidate 读取逻辑，不再直接读取 `knowledgeService`。
2. 迁移 `add_graph_edge` 的图谱写入逻辑，不再直接读取 `knowledgeGraphService`。
3. 在 `ToolKnowledgeServices.ts` 中补充图谱写入能力的 typed helper。
4. 增加 contract-first 测试，确保 container lookup 被禁止时 Knowledge Graph 工具仍可执行。

本轮不做：

- 不改变 `check_duplicate` 的相似度算法和返回结构。
- 不改变 `add_graph_edge` 的写入语义。
- 不重写图谱写入为 workflow。
- 不拆 `ToolRegistry`。

### 12.1 本轮完成情况

已完成：

- `ToolKnowledgeServices.ts` 新增 `KnowledgeGraphMutationServiceLike` 和 `requireKnowledgeGraphMutationService()`，用于表达 `addEdge(...)` 这类图谱写入能力。
- `check_duplicate` 已通过 `ToolKnowledgeServiceContract` 读取 candidate。
- `add_graph_edge` 已通过 `ToolKnowledgeServiceContract` 读取图谱写入服务。
- `knowledge-graph.ts` 中已无 `container.get(...)` 直接调用。
- `AgentTools.test.ts` 新增 Knowledge Graph contract-first 测试，覆盖：
  - `check_duplicate` 的 candidate 读取路径。
  - `add_graph_edge` 的图谱写入路径。

仍保留给后续切片：

- `evolution-tools.ts` 的 `evolutionGateway`。
- `suggest_skills` 的 `knowledgeRepository` / `auditRepository`。
- `ast-graph.ts` 的 graph/repository 依赖。
- `project-access.ts` 的 search/vector/AI 依赖。
- `system-interaction.ts` 的 projectRoot/writeZone 依赖。

### 12.2 本轮验证

- `npx vitest run test/unit/AgentTools.test.ts test/unit/ToolRouterGovernance.test.ts test/integration/ToolPipeline.test.ts` 通过：3 个测试文件，97 个测试。
- `npm run typecheck` 通过。

## 13. 第七轮实现切片：Evolution Tools Contract Cleanup

第七轮选择 `evolution-tools.ts`，完成 P6 服务域收束的最后一个小切片，把 Evolution Agent 决策工具接入已经存在的 `ToolLifecycleServiceContract`。

本轮目标：

1. 迁移 `propose_evolution`，不再直接读取 `evolutionGateway`。
2. 迁移 `confirm_deprecation`，不再直接读取 `evolutionGateway`。
3. 迁移 `skip_evolution`，不再直接读取 `evolutionGateway`。
4. 增加 contract-first 测试，确保 container lookup 被禁止时 Evolution 工具仍可执行。

本轮不做：

- 不改变 EvolutionGateway 的 submit 语义。
- 不改变三个 Evolution 工具的返回结构。
- 不拆 `ToolRegistry`。

### 13.1 本轮完成情况

已完成：

- `evolution-tools.ts` 已通过 `ToolLifecycleServiceContract` 读取 `evolutionGateway`。
- `evolution-tools.ts` 中已无 `container.get(...)` 直接调用。
- `evolution-tools.test.ts` 新增 lifecycle contract-first 测试，验证 `propose_evolution` 在 container lookup 被禁止时仍可提交提案。

P6 当前判断：

- 核心业务服务域已经完成 contract-first 收束：Knowledge、Guard、Lifecycle、Infra、Quality/Feedback、Composite、Knowledge Graph、Evolution。
- 剩余 `container.get(...)` 主要集中在更高风险或更大边界的后续切片：SkillAdvisor、AST/Code Graph、Project Search/Vector/AI、System Interaction、CapabilityCatalog 元工具读取。
- 这些后续切片不再阻塞切换到 P7；P6 的主线目标已经达成，后续可作为增量清理继续推进。

### 13.2 本轮验证

- `npx vitest run test/unit/TerminalAdapter.test.ts test/unit/evolution-tools.test.ts test/unit/AgentTools.test.ts test/unit/ToolRouterGovernance.test.ts test/integration/ToolPipeline.test.ts` 通过：5 个测试文件，114 个测试。
- `npm run typecheck` 通过。

## 14. P7 起步切片：TerminalAdapter v1 Skeleton

按主落地方案，后续重心切到 P7 TerminalAdapter。当前已落第一个最小切片：新增结构化 terminal execution adapter，但暂不替换生产入口。

已完成：

- 新增 `TerminalAdapter`，作为 `kind='terminal-profile'` 的 execution adapter。
- `TerminalAdapter` 接收结构化参数：
  - `bin`
  - `args`
  - `env`
  - `cwd`
  - `timeoutMs`
  - `network`
  - `filesystem`
  - `interactive`
  - `session`
- adapter 使用 `execFile` 执行，不接受自由 shell 字符串。
- adapter 将结果包装为 `ToolResultEnvelope`，`trust.source='terminal'`，stdout/stderr 标记为 untrusted text。
- adapter 限制 `cwd` 必须在 `projectRoot` 下。
- 新增 `TerminalAdapter.test.ts`，覆盖：
  - 结构化命令成功执行。
  - 非零退出返回 error envelope。
  - `cwd` 越界被拒绝。
- 新增 `TerminalCapabilities.ts`，注册 `terminal_run` capability manifest：
  - `kind='terminal-profile'`
  - `execution.adapter='terminal'`
  - `policyProfile='system'`
  - `auditLevel='full'`
  - `approvalPolicy='explain-then-run'`
- `AgentModule` 已将 `TERMINAL_CAPABILITY_MANIFESTS` 合入生产 `CapabilityCatalog`。
- `AgentModule` 已将 `TerminalAdapter` 注入生产 `ToolRouter` adapter 集合。
- `ToolRouterGovernance.test.ts` 已覆盖 `terminal_run` 从 Router 到 `TerminalAdapter` 的真实执行路径。
- 新增 `TerminalCommandPolicy`，把结构化 terminal command 的执行前决策从 adapter 主流程中抽离出来：
  - 拒绝 shell 可执行文件（`bash` / `sh` / `zsh` 等），避免绕回自由 shell。
  - 拒绝高危 bin（如 `sudo` / `dd` / `mkfs` / `shutdown` 等）。
  - 拒绝 `rm -rf`。
  - 第一版拒绝 `network='open'` 和 `filesystem='workspace-write'`。
  - 默认 `interactive='never'`，显式 `interactive='allowed'` 会被拒绝为 `interactive-command`。
  - 校验 `env` 为受限 string map，保护非交互 env key，并禁止把敏感命名 env key 持久化。
  - 产生结构化 preview，后续可直接接 approval preview。
- `TerminalAdapter` 在 `execFile` 前执行 `TerminalCommandPolicy`，被拒绝时返回 `status='blocked'` 的 `ToolResultEnvelope`，并记录 `terminal_policy_blocked` diagnostics。
- `PolicyEngine.validateToolCall()` 已识别 `terminal_run` 的 `{ bin, args }`，让运行时 `SafetyPolicy` 在治理 approve 阶段也能拦截结构化 terminal command。
- 新增 `TerminalSession` 抽象，作为 P7 session v1：
  - `terminal_run` manifest schema 新增 `session` 描述。
  - `TerminalCommandPolicy` 解析 `session` 为稳定的 `TerminalSessionPlan`。
  - 默认 session 是无状态 `ephemeral`，不保留 cwd/env/process。
  - `persistent` session 要求显式 `session.id`，进入 schema / preview / envelope，并以 high risk 进入治理。
  - `TerminalAdapter` 在 success/error envelope 的 `structuredContent.session` 中返回 session plan。
- 新增 `InMemoryTerminalSessionManager`，作为 session manager 基础层：
  - 提供 `acquire/release/snapshot/close/cleanup`。
  - 对 persistent session metadata 执行 exclusive busy guard。
  - 对 idle persistent session 执行 TTL cleanup。
  - `AgentModule` 注册 `terminalSessionManager` 单例。
  - `TerminalAdapter` 在执行前申请 session lease，执行后 release，并在 envelope 的 `structuredContent.sessionRecord` 中返回运行期 session record。
  - 结构化 persistent execFile session 已开放：同一 `session.id` 的后续命令可复用 session manager 记录的 cwd metadata；当前仍不开放 persistent shell/PTY 执行。
  - explicit env persistence 已开放为 metadata 级能力：`session.envPersistence='explicit'` 时，同一 persistent session 的后续命令可复用显式 `env`；`sessionRecord` 只暴露 `envKeys`，不暴露 env value。
- 新增 terminal session lifecycle capability：
  - `terminal_session_close` 关闭 idle persistent session metadata。
  - `terminal_session_cleanup` 删除 closed / expired session metadata。
  - `SystemInteraction` Runtime 暴露面已包含两个生命周期工具。
  - `TerminalAdapter` 对 lifecycle capability 单独分支执行，不走 terminal command policy / execFile 路径。
- 新增 Terminal audit event 基础层：
  - `TerminalAdapter` 为 `terminal_run`、`terminal_session_close`、`terminal_session_cleanup` 记录精简审计事件。
  - 优先使用 `terminalAuditSink`，回退到已有 `auditLogger.log()`。
  - 审计失败不影响工具执行结果。
  - audit data 只记录 command 摘要、policy、session/sessionRecord、lifecycle 结果和 artifact 数量，不记录 stdout/stderr 正文或完整 args。
- 新增 terminal 非交互策略基础层：
  - `terminal_run` manifest schema 新增 `interactive` 描述，默认 `never`。
  - `TerminalCommandPolicy` 会把 `interactive` 纳入 preview / risk / audit 语义，显式 `allowed` 在执行前阻断。
  - `TerminalAdapter` 在 `execFile` 环境中强制注入 `CI=1`、`GIT_TERMINAL_PROMPT=0`、`PAGER=cat`、`GIT_PAGER=cat`、`LESS=-FRX`。
- 新增 terminal env 持久化策略基础层：
  - `terminal_run` manifest schema 新增 `env` 和 `session.envPersistence` 描述。
  - 默认 env 只对单次命令生效，不进入 session metadata。
  - 只有 persistent session 显式声明 `envPersistence='explicit'` 时才持久化显式 env；policy preview、session record、audit 均只展示 env keys，不记录 env values。
- `ToolDecision` 新增 `preview` 字段，作为治理决策中可选的执行预览承载点。
- `ToolExecutionAdapter` 新增可选 `preview()` 契约，Router 不直接依赖 terminal 细节，只消费 adapter 提供的通用 `ToolExecutionPreview`。
- `TerminalAdapter.preview()` 已复用 `TerminalCommandPolicy` 的输入构建和 preview 逻辑，确保 `explain()` 与实际执行前 policy 使用同一套结构化参数。
- `ToolRouter.explain()` 已返回 terminal execution preview；需要确认的 Router envelope 也会在 `structuredContent.preview` 中携带同一份预览，供后续 approval UI 消费。
- `TerminalAdapter` 已支持 stdout/stderr 大输出 artifact 化：
  - 小输出继续 inline 返回。
  - 超过 `manifest.execution.maxOutputBytes` 的 stdout/stderr 会保留截断预览，并把完整内容写入 artifact。
  - 优先使用 `WriteZone.runtime('artifacts/tools/<callId>/<stdout|stderr>.txt')`。
  - 无 `WriteZone` 时回退写入项目内 `.asd/artifacts/tools/<callId>/`。
  - envelope 通过 `artifacts: ToolArtifactRef[]` 返回 `stdout` / `stderr` 文件引用。
- `SystemInteraction` capability 已把主终端入口从 `run_safe_command` 切换为 `terminal_run`：
  - Runtime 收集该 capability 的工具白名单时，会暴露 `terminal_run` schema。
  - 系统提示词已改为结构化 `{ bin, args, env, cwd, timeoutMs, network, filesystem, interactive, session }` 说明。
  - 不再建议通过 `sh -c` 使用自由 shell / 管道 / 重定向。
  - `run_safe_command` 不再由 `SystemInteraction` 主动暴露。
- `run_safe_command` 已从 internal tool 注册/导出路径中移除：
  - `tools/index.ts` 不再导入、barrel export 或加入 `RAW_TOOLS`。
  - `TOOL_CAPABILITY_CATALOG.getManifest('run_safe_command')` 已返回 `null`。
  - `CapabilityProjection` 中移除了 `run_safe_command` 的 side-effect / policy / abort / artifact 特判。
  - `PolicyEngine.validateToolCall()` 移除了 `run_safe_command` 字符串命令分支，只保留 `terminal_run` 的结构化 `{ bin, args }` 校验。
- 已删除 `system-interaction.ts` 中未注册的旧 `runSafeCommand` handler、旧字符串命令解析/黑白名单兜底代码，以及只覆盖旧 handler 的直接单测；`SystemInteractionTools.test.ts` 改为覆盖仍保留的 `write_project_file` 路径边界。

仍保留给 P7 后续：

- shell/PTY 能力仍不开放；如继续推进，需要先设计 `terminal_script` 的更细粒度治理、脚本 artifact、pty 输出观察和 approval UI。

本轮验证：

- `npx vitest run test/unit/TerminalAdapter.test.ts test/unit/ToolRouterGovernance.test.ts` 通过：2 个测试文件，24 个测试。
- `npm run typecheck` 通过。
- `npx biome check lib/agent/adapters/TerminalAdapter.ts lib/agent/adapters/TerminalCapabilities.ts lib/injection/modules/AgentModule.ts test/unit/TerminalAdapter.test.ts test/unit/ToolRouterGovernance.test.ts` 通过。
- `npx vitest run test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalAdapter.test.ts test/unit/ToolRouterGovernance.test.ts` 通过：3 个测试文件，30 个测试。
- `npx biome check lib/agent/adapters/TerminalAdapter.ts lib/agent/adapters/TerminalCommandPolicy.ts lib/agent/policies.ts test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalAdapter.test.ts test/unit/ToolRouterGovernance.test.ts` 通过。
- `npx vitest run test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalAdapter.test.ts test/unit/ToolRouterGovernance.test.ts` 通过：3 个测试文件，32 个测试。
- `npx biome check lib/agent/core/ToolDecision.ts lib/agent/core/ToolContracts.ts lib/agent/core/ToolRouter.ts lib/agent/adapters/TerminalAdapter.ts lib/agent/adapters/TerminalCommandPolicy.ts test/unit/ToolRouterGovernance.test.ts test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalAdapter.test.ts` 通过。
- `npx vitest run test/unit/TerminalAdapter.test.ts test/unit/TerminalCommandPolicy.test.ts test/unit/ToolRouterGovernance.test.ts` 通过：3 个测试文件，33 个测试。
- `npx biome check lib/agent/adapters/TerminalAdapter.ts test/unit/TerminalAdapter.test.ts test/unit/TerminalCommandPolicy.test.ts test/unit/ToolRouterGovernance.test.ts` 通过。
- `npx vitest run test/unit/CapabilityCatalog.test.ts test/unit/TerminalAdapter.test.ts test/unit/TerminalCommandPolicy.test.ts test/unit/ToolRouterGovernance.test.ts` 通过：4 个测试文件，45 个测试。
- `npx biome check lib/agent/capabilities.ts test/unit/CapabilityCatalog.test.ts lib/agent/adapters/TerminalAdapter.ts test/unit/TerminalAdapter.test.ts test/unit/TerminalCommandPolicy.test.ts test/unit/ToolRouterGovernance.test.ts` 通过。
- `npx vitest run test/unit/CapabilityCatalog.test.ts test/integration/ToolPipeline.test.ts test/unit/ToolRouterGovernance.test.ts test/unit/TerminalAdapter.test.ts test/unit/TerminalCommandPolicy.test.ts test/unit/SystemInteractionTools.test.ts` 通过：6 个测试文件，74 个测试。
- `npx biome check lib/agent/tools/index.ts lib/agent/tools/CapabilityProjection.ts lib/agent/policies.ts lib/agent/capabilities.ts test/unit/CapabilityCatalog.test.ts test/integration/ToolPipeline.test.ts test/unit/ToolRouterGovernance.test.ts` 通过。
- `npx vitest run test/unit/SystemInteractionTools.test.ts test/unit/CapabilityCatalog.test.ts test/integration/ToolPipeline.test.ts test/unit/ToolRouterGovernance.test.ts test/unit/TerminalAdapter.test.ts test/unit/TerminalCommandPolicy.test.ts` 通过：6 个测试文件，73 个测试。
- `npx biome check lib/agent/tools/system-interaction.ts test/unit/SystemInteractionTools.test.ts lib/agent/tools/index.ts lib/agent/tools/CapabilityProjection.ts lib/agent/policies.ts test/unit/CapabilityCatalog.test.ts test/integration/ToolPipeline.test.ts test/unit/ToolRouterGovernance.test.ts` 通过。
- `npx vitest run test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalAdapter.test.ts test/unit/ToolRouterGovernance.test.ts test/unit/CapabilityCatalog.test.ts` 通过：4 个测试文件，48 个测试。
- `npx biome check lib/agent/adapters/TerminalSession.ts lib/agent/adapters/TerminalCommandPolicy.ts lib/agent/adapters/TerminalAdapter.ts lib/agent/adapters/TerminalCapabilities.ts test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalAdapter.test.ts` 通过。
- `npx vitest run test/unit/TerminalSessionManager.test.ts test/unit/TerminalAdapter.test.ts test/unit/TerminalCommandPolicy.test.ts test/unit/ToolRouterGovernance.test.ts test/unit/CapabilityCatalog.test.ts` 通过：5 个测试文件，52 个测试。
- `npx biome check lib/agent/adapters/TerminalSessionManager.ts lib/agent/adapters/TerminalSession.ts lib/agent/adapters/TerminalAdapter.ts lib/agent/adapters/TerminalCommandPolicy.ts lib/agent/adapters/TerminalCapabilities.ts lib/injection/modules/AgentModule.ts lib/injection/ServiceMap.ts test/unit/TerminalSessionManager.test.ts test/unit/TerminalAdapter.test.ts test/unit/TerminalCommandPolicy.test.ts` 通过。
- `npx vitest run test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalAdapter.test.ts test/unit/TerminalSessionManager.test.ts test/unit/ToolRouterGovernance.test.ts test/unit/CapabilityCatalog.test.ts` 通过：5 个测试文件，53 个测试。
- `npx biome check lib/agent/adapters/TerminalSession.ts lib/agent/adapters/TerminalCommandPolicy.ts lib/agent/adapters/TerminalAdapter.ts lib/agent/adapters/TerminalCapabilities.ts lib/agent/adapters/TerminalSessionManager.ts test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalAdapter.test.ts test/unit/TerminalSessionManager.test.ts` 通过。
- `npx vitest run test/unit/TerminalAdapter.test.ts test/unit/TerminalSessionManager.test.ts test/unit/TerminalCommandPolicy.test.ts test/unit/CapabilityCatalog.test.ts test/unit/ToolRouterGovernance.test.ts` 通过：5 个测试文件，54 个测试。
- `npx biome check lib/agent/adapters/TerminalAdapter.ts lib/agent/adapters/TerminalCapabilities.ts lib/agent/capabilities.ts test/unit/TerminalAdapter.test.ts test/unit/CapabilityCatalog.test.ts` 通过。
- `npx vitest run test/unit/TerminalAdapter.test.ts test/unit/TerminalSessionManager.test.ts test/unit/TerminalCommandPolicy.test.ts test/unit/CapabilityCatalog.test.ts test/unit/ToolRouterGovernance.test.ts` 通过：5 个测试文件，55 个测试。
- `npx biome check lib/agent/adapters/TerminalAdapter.ts test/unit/TerminalAdapter.test.ts` 通过。
- `npx vitest run test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalAdapter.test.ts test/unit/CapabilityCatalog.test.ts` 通过：3 个测试文件，32 个测试。
- `npx biome check lib/agent/adapters/TerminalCommandPolicy.ts lib/agent/adapters/TerminalAdapter.ts lib/agent/adapters/TerminalCapabilities.ts lib/agent/capabilities.ts test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalAdapter.test.ts test/unit/CapabilityCatalog.test.ts` 通过。
- `npx vitest run test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalAdapter.test.ts test/unit/TerminalSessionManager.test.ts test/unit/CapabilityCatalog.test.ts` 通过：4 个测试文件，42 个测试。
- `npx biome check lib/agent/adapters/TerminalSession.ts lib/agent/adapters/TerminalSessionManager.ts lib/agent/adapters/TerminalCommandPolicy.ts lib/agent/adapters/TerminalAdapter.ts lib/agent/adapters/TerminalCapabilities.ts lib/agent/capabilities.ts test/unit/TerminalSessionManager.test.ts test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalAdapter.test.ts test/unit/CapabilityCatalog.test.ts` 通过。

## 15. P8 起步切片：MCP Trust Decision

按 P8 目标，外部能力需要按统一 adapter 模型接入，并且 MCP server/tool 必须有明确 trust decision。当前已先落 MCP trust 最小切片。

已完成：

- `ToolCapabilityManifest` 新增 `externalTrust` 字段，用于描述外部能力来源、server id、信任判定、判定原因和输出信任语义。
- `McpCapabilityProjection` 为每个 MCP virtual capability 写入 `externalTrust`：
  - `source='mcp-server'`
  - `serverId`
  - `trusted`
  - `reason`
  - `outputContainsUntrustedText`
- Bundled Alembic MCP tools 默认 `trusted=true`，但输出仍标记为 untrusted text。
- `McpToolAdapter` 在 handler 执行前检查 trust decision：
  - 缺失 `externalTrust` 会返回 `status='blocked'`。
  - `trusted=false` 会返回 `status='blocked'`。
  - blocked envelope 会记录 `mcp_trust_blocked` warning、`blockedTools` 和 execute 阶段 gate failure。
  - handler 不会执行。
- MCP 成功/错误 envelope 的 `trust.containsUntrustedText` 由 manifest trust decision 驱动，不在 adapter 内硬编码。

本轮之后继续推进了 MCP provenance / allowlist 切片，已完成：

- `ToolExternalTrustProfile` 增加 `allowlisted` 与 `registration` 字段，用于记录外部 MCP server 是否命中 allowlist、注册来源、配置路径和声明方。
- `McpCapabilityProjection` 支持传入 server registry 和 `trustedServerIds`：
  - bundled `alembic-local` 默认 `trusted=true`、`allowlisted=true`。
  - 未登记的外部 server 默认为 `registration.source='unknown'`、`allowlisted=false`、`trusted=false`。
  - workspace/user/runtime registration 可以记录 `configPath` 与 `declaredBy`。
  - 命中 `trustedServerIds` 或 registration 显式 `trusted=true` 后，manifest 才投影为可执行。
- `McpToolAdapter` 继续只消费 manifest-level trust decision；未信任外部 server 在 handler 执行前被阻断。

本轮之后继续推进了 Skill adapter 只读/校验切片，已完成：

- 新增 `SkillAdapter`，作为 `kind='skill'` 的 execution adapter。
- 新增 `SKILL_CAPABILITY_MANIFESTS`：
  - `skill_search`
  - `skill_load`
  - `skill_load_resource`
  - `skill_validate`
- 生产 `CapabilityCatalog` 已注册这些 Skill capability，生产 `ToolRouter` 已注入 `SkillAdapter`。
- `SkillAdapter` 只读取本地内置 skills 和项目级 `Alembic/skills/`：
  - `skill_search` 返回 Skill 摘要、source、description、triggers、requiresTools、permissions。
  - `skill_load` 返回 `SKILL.md` 内容或指定 markdown section。
  - `skill_load_resource` 只允许加载 Skill 目录下非执行资源，显式阻断 `hooks.js`。
  - `skill_validate` 校验 frontmatter/manifest 字段，不执行 hooks 或脚本。
- Skill 输出统一包装为 `ToolResultEnvelope`，`trust.source='skill'`，`containsUntrustedText=true`。

本轮之后继续推进了 macOS adapter 首版切片，已完成：

- 新增 `MacSystemAdapter`，作为 `kind='macos-adapter'` 的 execution adapter。
- 新增 `MAC_SYSTEM_CAPABILITY_MANIFESTS`：
  - `mac_system_info`
  - `mac_permission_status`
  - `mac_window_list`
  - `mac_screenshot`
- 生产 `CapabilityCatalog` 已注册这些 macOS capability，生产 `ToolRouter` 已注入 `MacSystemAdapter`；`SystemInteraction` runtime 工具集已暴露四个 macOS 能力。
- `mac_system_info` 只返回当前进程可读的平台信息。
- `mac_permission_status` 只报告 TCC 相关权限的 `unknown` / `unavailable` 状态，不触发系统授权 prompt，也不尝试绕过 TCC。
- `mac_window_list` / `mac_screenshot` 复用已有 ScreenCaptureKit helper；窗口标题写入 JSON resource artifact，截图写入 image artifact，敏感输出不内联为正文。
- macOS 输出统一包装为 `ToolResultEnvelope`，`trust.source='macos'`；窗口标题内容标记 `containsUntrustedText=true`，窗口列表/截图 artifact 标记 `containsSecrets=true`。

本轮之后继续推进了 no-legacy runtime / Forge 收口，已完成：

- `AgentRuntime` 构造阶段强制要求 `ToolRouter`，不再允许 runtime 在缺失 router 时启动工具执行。
- `ToolExecutionPipeline` 删除 no-router fallback，只调用 `ToolRouter.execute()`；旧的 pipeline 级 `SafetyGate` / `cacheCheck` 已移除，安全策略与缓存语义统一交给 `GovernanceEngine` / `ToolRouter`。
- `ToolRegistry` 删除 `executeInternal()`，只保留 `InternalToolHandlerStore` / `ForgedInternalToolStore` 职责，不再暴露跨入口执行 API。
- generate 型 forged tool 现在必须具备 `CapabilityCatalog`：生成成功时同步注册 `internal-tool` manifest，TTL/dispose revoke 时同步注销 handler 与 manifest。
- `ToolPipeline` / `AgentRuntime` / `ToolForge` / `ToolRouterGovernance` 测试已改为断言 Router-only 执行契约。

仍保留给 P8 后续：

- 外部 MCP server 真实配置发现/刷新仍需继续实现：从 workspace/user MCP 配置读取 server registry、注册生命周期刷新、配置变更失效和 manifest provenance 落库/审计。

本轮验证：

- `npx vitest run test/unit/McpToolRouter.test.ts` 通过：1 个测试文件，7 个测试。
- `npm run typecheck` 通过。
- `npx biome check lib/agent/tools/CapabilityManifest.ts lib/external/mcp/McpCapabilityProjection.ts lib/external/mcp/McpToolAdapter.ts test/unit/McpToolRouter.test.ts` 通过。
- `npx vitest run test/unit/McpToolRouter.test.ts` 通过：1 个测试文件，9 个测试。
- `npx biome check lib/agent/tools/CapabilityManifest.ts lib/external/mcp/McpCapabilityProjection.ts test/unit/McpToolRouter.test.ts` 通过。
- `npx vitest run test/unit/SkillAdapter.test.ts test/unit/CapabilityCatalog.test.ts` 通过：2 个测试文件，17 个测试。
- `npx biome check lib/agent/adapters/SkillAdapter.ts lib/agent/adapters/SkillCapabilities.ts lib/injection/modules/AgentModule.ts test/unit/SkillAdapter.test.ts test/unit/CapabilityCatalog.test.ts` 通过。
- `npx vitest run test/unit/MacSystemAdapter.test.ts test/unit/CapabilityCatalog.test.ts` 通过：2 个测试文件，19 个测试。
- `npx biome check lib/agent/adapters/MacSystemAdapter.ts lib/agent/adapters/MacSystemCapabilities.ts lib/injection/modules/AgentModule.ts lib/agent/capabilities.ts test/unit/MacSystemAdapter.test.ts test/unit/CapabilityCatalog.test.ts` 通过。
- `npx vitest run test/unit/AgentRuntime.test.ts test/unit/ToolForge.test.ts test/unit/ToolForgeIntegration.test.ts test/unit/ToolRouterGovernance.test.ts test/integration/ToolPipeline.test.ts` 通过：5 个测试文件，91 个测试。
- `npx biome check lib/agent/AgentRuntime.ts lib/agent/AgentRuntimeTypes.ts lib/agent/core/ToolExecutionPipeline.ts lib/agent/tools/ToolRegistry.ts lib/agent/forge/ToolForge.ts test/unit/AgentRuntime.test.ts test/unit/ToolForge.test.ts test/unit/ToolForgeIntegration.test.ts test/unit/ToolRouterGovernance.test.ts test/integration/ToolPipeline.test.ts` 通过。
