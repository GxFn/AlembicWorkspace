# Mainline Autonomous Recipe Governance Plan

本文档设计 Alembic 在插件主路径下的 Recipe 自治方案。目标不是恢复 Dashboard 人审，而是让 Recipe 在新主线中依赖证据、策略和审计自动激活、降权、进化、衰减与废弃。方案必须服从当前 mainline 架构替换方向：`tools/workflows/agent -> mainline`，运行期读取 `ContextIndex/SearchIndex`，编译期和治理期写入统一 `Recipe`。

## 结论

Alembic 应把人工审核从主路径移出，改成后台自治治理：

1. AI/agent 产物仍进入 `RecipeSubmission -> Recipe` 统一入口。
2. `RecipeSubmissionPolicy` 继续做写入前质量、相似度、staging 路由。
3. 后台新增 mainline governance 编译层，读取 `Recipe/SourceRef/RecipeEdge/Search usage/Guard evidence`，输出确定性的 `RecipeGovernanceDecision`。
4. 决策只通过 `ContextIndexWriter.upsertContextArtifacts()` 写回 Recipe payload，不直接操作旧 `KnowledgeService`。
5. `Recipe.status` 继续保持五态：`candidate/active/stale/superseded/rejected`。
6. 旧六态不回到顶层，只保存在 `recipe.knowledge.governance.lifecycle`，用于解释和迁移兼容。
7. 人不再逐条 approve，只查看自治摘要、争议队列和回滚记录。

核心原则是：Recipe 可以脱离人工审批，但不能脱离证据、审计和可回滚边界。

## 当前代码事实

### 已有主线能力

1. `lib/mainline/knowledge/Recipe.ts`
   - 顶层状态是 `candidate/active/stale/superseded/rejected`。
   - `isUsableRecipe()` 目前只消费 `active/candidate`。

2. `lib/mainline/knowledge/RecipeKnowledgePayload.ts`
   - `knowledge.governance` 已有 `lifecycle/lifecycleHistory/autoApprovable/stagingDeadline/reviewedAt/rejectionReason/publishedAt`。
   - `knowledge.usage` 已有 `views/adoptions/applications/guardHits/searchHits/authority/lastHitAt/hitsLast30d/ruleFalsePositiveRate`。

3. `lib/mainline/knowledge/RecipeSubmissionPolicy.ts`
   - 已迁入旧 `UnifiedValidator`、`ConsolidationAdvisor`、`ConfidenceRouter` 的核心策略。
   - 高置信、质量合格时设置 `governance.lifecycle = staging` 和 `stagingDeadline`。
   - 低置信或低质量仍保持 `candidate/pending` 语义。

4. `lib/mainline/compile/MainlineDecayPolicy.ts`
   - 已有报告型衰退评分：freshness、usage、quality、authority。
   - 保留 80/60/40/20 分界：healthy/watch/decay/severe/dead。
   - 当前不执行生命周期迁移。

5. `lib/mainline/compile/MainlineReverseHealthCheck.ts`
   - 已有报告型 Recipe -> Code 健康检查。
   - 复用符号缺失、zero match、match rate drop、SourceRef stale 判断。
   - 当前不提交 proposal，不写状态。

6. `lib/mainline/compile/RecipeImpactAnalyzer.ts`
   - 根据 diff、文件删除、SourceRef 路径判断 Recipe 是否受影响。
   - 输出 `update/verify/deprecate/none` 级别的 suggestedAction。
   - 明确不创建 proposal、不 patch content。

7. `lib/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanner.ts`
   - rescan 已能消费 `MainlineRecipeImpactPlan`。
   - coverage/audit 结果进入 `healthy/watch/decay/severe/dead`。
   - 仍主要服务 rescan planning，而不是统一自治写回。

8. `lib/mainline/data/ContextIndex.ts` 和 `SqliteContextIndex.ts`
   - `Recipe/SourceRef/RecipeEdge` 的完整 JSON payload 是真相源。
   - 索引表只服务查询，不承载旧 workflow/session 语义。
   - 编译期批量写入已有单事务边界。

### 不能沿用的旧路径

不要把旧 `lib/service/evolution/ProposalExecutor.ts` 原样迁回主线：

1. 它依赖旧 repository/service/event 语义，容易重新扩大旧 service 热路径。
2. 它以 proposal orchestration 为中心，而 mainline 现在以 artifact、policy、runtime bundle 为中心。
3. 它会把 signal-driven 执行直接塞进运行期，违背 Round 11 “SourceRef repair、Reverse health、decay 默认先报告”的收敛原则。

应迁移的是纯策略和阈值，不是旧编排器。

## 目标模型

### 顶层状态

`Recipe.status` 保持五态，表示运行期消费层面的结论：

```text
candidate   可观察候选，默认可被低权重召回
active      已证明稳定，可高权重召回
stale       证据不新鲜或需要验证，默认低权重召回
superseded  被替代，默认不召回，保留回滚和历史关系
rejected    低质或错误，不召回
```

### 治理生命周期

`recipe.knowledge.governance.lifecycle` 保留细粒度阶段：

```text
pending
staging
active
evolving
decaying
superseded
rejected
```

该字段只服务解释、审计和策略，不再成为运行期查询的一等状态。顶层 `status` 与治理 lifecycle 的推荐映射：

| lifecycle | status | 语义 |
| --- | --- | --- |
| pending | candidate | 候选不足或等待更多证据 |
| staging | candidate | 可观察候选，可低权重消费 |
| active | active | 稳定可消费 |
| evolving | active | 内容正在更新，但旧知识仍可消费 |
| decaying | stale | 证据衰退，降权消费或只做提示 |
| superseded | superseded | 被替代，不主动注入 |
| rejected | rejected | 不消费 |

### Recipe 类型策略

自治强度由 `Recipe.kind` 和 `knowledge.classification.knowledgeType` 决定：

| kind | 自动激活 | 自动进化 | 自动衰减 | 备注 |
| --- | --- | --- | --- | --- |
| fact | 是 | 是 | 是 | 强依赖 SourceRef 和符号事实 |
| pattern | 是，需 staging | 是 | 是 | 主要自治对象 |
| workflow | 是，需 staging | 是 | 是 | 需要更多使用信号 |
| convention | 谨慎 | 是 | 是 | 需要冲突检查 |
| guard-rule | 否，默认只 proposal | 谨慎 | 是 | 误报成本高 |
| risk | 否，默认只 proposal | 否 | 是 | 安全/风险规则保守处理 |

## 新增主线模块

### 1. `MainlineRecipeGovernancePolicy`

路径建议：

```text
lib/mainline/knowledge/RecipeGovernancePolicy.ts
```

职责：

1. 输入单条 Recipe 的质量、衰退、健康、影响、相似度、usage 信号。
2. 输出确定性的 `RecipeGovernanceDecision`。
3. 不读写文件，不访问数据库，不调用 AI。
4. 不知道 workflow、MCP、Dashboard。

建议类型：

```ts
export type RecipeGovernanceAction =
  | 'promote'
  | 'demote'
  | 'mark-stale'
  | 'supersede'
  | 'reject'
  | 'evolve'
  | 'keep'
  | 'review';

export interface RecipeGovernanceDecision {
  recipeId: string;
  action: RecipeGovernanceAction;
  confidence: number;
  reason: string;
  fromStatus: Recipe['status'];
  toStatus: Recipe['status'];
  fromLifecycle?: string;
  toLifecycle?: string;
  evidence: RecipeGovernanceEvidence[];
  reversible: boolean;
  risk: 'low' | 'medium' | 'high';
}
```

核心规则：

1. `stagingDeadline` 到期、质量 `>= 0.7`、SourceRef fresh、无 severe/dead 信号：`candidate/staging -> active/active`。
2. decay level 为 `watch`：保持当前 status，写入 lifecycleHistory，不降权。
3. decay level 为 `decay/severe`：`active -> stale`，`lifecycle -> decaying`。
4. decay level 为 `dead` 且全部 SourceRef missing 或 source-deleted：`active/stale/candidate -> superseded`，不物理删除。
5. `guard-rule/risk` 的 promote 动作最高只能到 `review`，除非来源是 manual 或已有连续采用证据。
6. 任何 `evolve` 只改 payload 或生成新 `RecipeSubmission`，不直接改用户代码。

### 2. `MainlineRecipeGovernanceRunner`

路径建议：

```text
lib/mainline/compile/MainlineRecipeGovernanceRunner.ts
```

职责：

1. 从 `ContextIndexReader` 读取 Recipe、SourceRef、RecipeEdge。
2. 调用：
   - `RecipeQualityPolicy`
   - `MainlineDecayPolicy`
   - `MainlineReverseHealthCheck`
   - `RecipeImpactAnalyzer` 的结果
   - `RecipeSimilarityPolicy`
3. 对每条 Recipe 生成 governance decision。
4. 将决策应用为新的 Recipe payload。
5. 通过 `ContextIndexWriter.upsertContextArtifacts({ recipes })` 写回。
6. 输出 `RecipeGovernanceReport`。

这个 runner 是后台治理编译期，不进入 `RuntimeRetrievalPipeline`。

建议输入：

```ts
export interface RecipeGovernanceRunRequest {
  contextIndex: ContextIndexReader & ContextIndexWriter;
  recipes?: readonly Recipe[];
  changedFiles?: readonly string[];
  deletedFiles?: readonly string[];
  diffTextByPath?: Record<string, string>;
  projectFiles?: readonly { path: string; content: string }[];
  projectIntelligence?: MainlineProjectIntelligenceArtifact;
  mode: 'bootstrap' | 'rescan' | 'file-change' | 'scheduled' | 'manual';
  dryRun?: boolean;
  nowMs?: number;
}
```

### 3. `RecipeGovernanceJournal`

路径建议：

```text
lib/mainline/data/RecipeGovernanceJournal.ts
```

第一阶段可不新建表，先写入 `recipe.knowledge.governance.lifecycleHistory`。第二阶段再加 SQLite 表：

```sql
CREATE TABLE mainline_recipe_governance_events (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  action TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  from_lifecycle TEXT,
  to_lifecycle TEXT,
  confidence REAL NOT NULL,
  risk TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

为何需要 journal：

1. 支持 Dashboard 只看异常和摘要。
2. 支持 CLI/MCP 输出“为什么 Recipe 被降权”。
3. 支持回滚最近一次自治变更。
4. 避免把 lifecycleHistory 撑成不可查询的大 JSON。

### 4. `MainlineRecipeUsageRecorder`

路径建议：

```text
lib/mainline/runtime/MainlineRecipeUsageRecorder.ts
```

职责：

1. 在 prime/search/injection/guard finding 中记录 usage。
2. 更新 `knowledge.usage.searchHits/lastSearchedAt/hitsLast30d/guardHits/ruleFalsePositiveRate`。
3. 不影响当前用户请求的响应，失败只记录 warning。

这部分可以先不直接写每次命中，改成 batch flush，避免 prime 热路径频繁写 SQLite。

## 自治决策矩阵

### Promote

触发条件：

1. `governance.lifecycle === staging`。
2. `stagingDeadline <= now`。
3. `quality.overall >= 0.7`。
4. `confidence >= 0.7`。
5. SourceRef fresh ratio `>= 0.8`。
6. decay level 是 `healthy` 或 `watch`。
7. 无高风险 kind 阻断。

结果：

```text
status: candidate -> active
governance.lifecycle: staging -> active
governance.publishedAt: now
governance.publishedBy: system
lifecycleHistory += promote event
```

### Demote / Mark Stale

触发条件：

1. decay level 是 `decay` 或 `severe`。
2. reverse health recommendation 是 `investigate` 或 `decay`。
3. SourceRef stale ratio 高。
4. impact suggestedAction 是 `verify` 或 `update`，但尚无新内容。

结果：

```text
status: active -> stale
governance.lifecycle: active/evolving -> decaying
lifecycleHistory += stale event
```

### Supersede

触发条件：

1. decay level 是 `dead`。
2. 所有 SourceRef missing，或 `RecipeImpactAnalyzer` reason 是 `source-deleted`。
3. 没有 active replacement 时，先 `stale`，不直接 `superseded`。
4. 有 replacement edge 或高相似新 Recipe 时，才 `superseded`。

结果：

```text
status: stale/active/candidate -> superseded
governance.lifecycle: decaying/active/staging -> superseded
relations: add deprecated_by / superseded_by edge when known
```

### Evolve

触发条件：

1. impact reason 是 `source-modified-pattern`。
2. 新代码仍有足够 SourceRef 和 API token 交集。
3. 旧 Recipe 不 dead。
4. agent/workflow 能产生新的 `RecipeSubmission`。

结果：

```text
old Recipe: active -> active, governance.lifecycle -> evolving during write
new payload: delivery/coreCode/body/sourceRefs 更新
after write: lifecycle -> staging 或 active
```

第一阶段不做自动 content patch，只做：

1. 将旧 Recipe 标记 `stale/decaying`。
2. 把受影响 Recipe 送进 rescan 的 verify-only / produce prompt。
3. agent 生成新 `RecipeSubmission` 后再由 `RecipeSubmissionPolicy` 写入。

### Reject

触发条件：

1. candidate 长期无证据，超过 TTL。
2. quality `< 0.3`。
3. confidence `< 0.2`。
4. 与 active Recipe 高度重复且无法 merge。

结果：

```text
status: candidate -> rejected
governance.lifecycle: pending/staging -> rejected
rejectionReason: deterministic reason
```

不删除 Markdown；如果外显层需要隐藏，由查询和 Dashboard 过滤。

## 写入路径

### 提交路径

```text
Agent / Tool output
  -> RecipeSubmission
  -> RecipeSubmissionPolicy.evaluate()
  -> RecipeMarkdownStore.write()
  -> ContextIndexWriter.upsertContextArtifacts({ recipes, recipeFiles, sourceRefs, edges })
  -> SearchIndex materialize
```

不新增旧 candidate store。

### 后台治理路径

```text
trigger: bootstrap/rescan/file-change/scheduled/manual
  -> load recipes/sourceRefs/edges/search usage
  -> MainlineRecipeGovernanceRunner
  -> MainlineRecipeGovernancePolicy
  -> applyRecipeGovernanceDecision()
  -> ContextIndexWriter.upsertContextArtifacts({ recipes })
  -> SearchIndex refresh affected recipe documents
  -> RecipeGovernanceReport
```

### 运行期路径

```text
alembic_task prime / search
  -> RuntimeContextLoader
  -> RuntimeRetrievalPipeline
  -> RuntimeRecipeRanker
  -> ContextBundle
```

运行期只消费 status、quality、usage、SourceRef freshness 的结果，不现场做治理。

## Ranking 与注入影响

`RuntimeRecipeRanker` 应加入状态权重：

```text
active      1.00
candidate   0.72, staging 可略高
stale       0.35, 只作为 caution/context
superseded  0.00, 仅显式查询或解释时出现
rejected    0.00
```

同时加入 governance hints：

1. stale Recipe 注入时带 `risk` hint。
2. candidate/staging Recipe 注入时带 `candidate` hint。
3. superseded Recipe 不进入普通 bundle，但可以在 “why not used” 或 graph path 中出现。

## 与 rescan 的关系

rescan 不再只是“补空白”，还要成为自治治理的主要触发器：

1. `KnowledgeRescanPlanner.auditRecipesForRescan()` 保留 coverage/audit 分类。
2. `MainlineRecipeGovernanceRunner` 消费该分类或直接消费 `MainlineDecayPolicy` 结果。
3. `KnowledgeRescanPlanBuilder` 的 `recipe-decay` reason 继续驱动 verify-only。
4. verify-only 的结果如果产生新 RecipeSubmission，仍走 `RecipeSubmissionPolicy`。
5. dead Recipe 不立即删除，只进入 `superseded/rejected` 或 `stale`。

## 与文件变更的关系

文件变更只触发 mainline incremental：

```text
DaemonFileChangeCollector
  -> FileChangeDispatcher
  -> MainlineFileChangeCompileService
  -> MainlineCompileSession incremental
  -> RecipeImpactAnalyzer
  -> MainlineRecipeGovernanceRunner
```

关键边界：

1. 删除文件不删除 Recipe。
2. SourceRef stale 先进入 evidence。
3. pattern impact 可以触发 evolve candidate，但不自动改用户代码。
4. 只刷新受影响 Recipe 的 SearchIndex 文档。

## 与 AI 的关系

AI 不再是审核者，而是内容生成器和解释器：

1. 确定性 policy 决定是否 promote/demote/stale/supersede。
2. AI 只在 `evolve` 和 `produce` 需要新内容时生成 `RecipeSubmission`。
3. AI 输出必须再过 `RecipeSubmissionPolicy`。
4. AI 不能绕过 `ContextIndex` 和 governance journal。

这能避免“AI 自己批准 AI 生成的知识”的闭环失控。

## Dashboard / Plugin 交互

插件主路径下人审机会变少，所以 UI 应从审批列表改成治理摘要：

1. 今天自动 promote 了多少。
2. 今天 demote/stale/supersede 了多少。
3. 高风险 review 队列。
4. 最近 20 条自治事件。
5. 每条事件展示 evidence、confidence、affected sourceRefs、可回滚入口。

MCP/CLI 可新增只读接口：

```text
alembic_panorama governance_report
alembic_knowledge governance_events
```

写操作必须走显式命令：

```text
alembic_knowledge rollback_governance_event
alembic_knowledge pin_recipe
alembic_knowledge unpin_recipe
```

## Pin 与人工治理权

完全脱离人工主路径，不代表不能人工干预。建议增加 governance override：

```ts
interface RecipeGovernanceOverride {
  pinned?: boolean;
  pinReason?: string;
  allowAutoPromote?: boolean;
  allowAutoDemote?: boolean;
  allowAutoSupersede?: boolean;
  riskTier?: 'normal' | 'guarded' | 'locked';
}
```

存放位置：

```text
recipe.knowledge.governance.override
```

当前 `RecipeKnowledgeGovernance` 还没有该字段，需要 schema v2 或 metadata 临时扩展。第一阶段可先放在：

```text
recipe.metadata.governanceOverride
```

## 实施阶段

### Phase 1: 纯策略与文档对齐

1. 新增 `RecipeGovernancePolicy.ts`。
2. 新增单测覆盖 promote/stale/supersede/reject/review。
3. 不写 SQLite，不接 daemon。
4. 明确旧 lifecycle 到新 status 的映射。

验收：

```text
test/unit/MainlineRecipeGovernancePolicy.test.ts
```

### Phase 2: Runner dry-run

1. 新增 `MainlineRecipeGovernanceRunner.ts`。
2. 从 in-memory ContextIndex 读取 Recipes/SourceRefs。
3. 输出 `RecipeGovernanceReport`。
4. dry-run 不写回。

验收：

```text
test/unit/MainlineRecipeGovernanceRunner.test.ts
```

### Phase 3: ContextIndex 写回

1. 实现 `applyRecipeGovernanceDecision(recipe, decision)`。
2. 写回 Recipe payload。
3. lifecycleHistory 追加事件。
4. SQLite ContextIndex 单事务更新。

验收：

1. status 列和 payload_json 一致。
2. sourceRef/edge 索引不被破坏。
3. rejected/superseded 不进入普通 runtime bundle。

### Phase 4: rescan / file-change 接入

1. rescan 结束后运行 governance runner。
2. file-change incremental 后只治理受影响 Recipe。
3. dead/severe 触发 verify-only 或 produce。

验收：

1. 删除所有 sourceRefs 后 Recipe 进入 stale 或 superseded。
2. pattern 修改后 Recipe 进入 stale/evolving，不直接 patch。
3. coverage gap 仍能驱动新 RecipeSubmission。

### Phase 5: usage batch recorder

1. prime/search/guard 记录 usage event。
2. batch flush 到 Recipe payload 或独立 usage 表。
3. decay policy 消费近 30/90 天窗口。

验收：

1. 被频繁使用的 staging Recipe 能 promote。
2. 长期无人使用的 candidate 会 reject 或 stale。
3. 记录失败不影响 prime 响应。

### Phase 6: UI/CLI 治理摘要

1. Dashboard 增加治理摘要，不恢复逐条审批主路径。
2. MCP 增加 governance report。
3. 支持 pin/rollback。

## 测试矩阵

### Policy

1. staging + high confidence + fresh refs -> active。
2. active + severe decay -> stale。
3. stale + replacement edge -> superseded。
4. guard-rule + high confidence -> review，不 auto active。
5. low quality candidate -> rejected。
6. pinned Recipe 不自动 demote。

### Runner

1. dry-run 不写 ContextIndex。
2. write mode 只更新目标 Recipe。
3. lifecycleHistory 事件可追溯。
4. 多 Recipe batch 单事务。
5. SourceRef 缺失时降级而不是 throw。

### Runtime

1. active 优先排序。
2. stale 只作为 caution hint。
3. superseded/rejected 默认不注入。
4. candidate/staging 降权但仍可被召回。

### Rescan

1. source-deleted 触发 stale/superseded。
2. source-modified-pattern 触发 evolve/verify。
3. coverage gap 不被 stale Recipe 误算成健康覆盖。

## 主要风险

1. 自动 supersede 过激。
   - 缓解：没有 replacement edge 时先 stale，不直接 superseded。

2. usage 数据不可靠。
   - 缓解：usage 只能作为 promote 加分，不作为唯一 promote 条件。

3. guard-rule 自动激活导致误报。
   - 缓解：guard-rule/risk 默认只 review。

4. lifecycleHistory 膨胀。
   - 缓解：第一阶段 JSON，第二阶段迁入 governance event 表。

5. Markdown 与 SQLite 不一致。
   - 缓解：治理写回后刷新 RecipeMarkdownStore 或标记需要 sync，运行期仍以 SQLite 为准。

## 推荐下一步

优先实现最小闭环：

```text
RecipeGovernancePolicy
  -> applyRecipeGovernanceDecision
  -> MainlineRecipeGovernanceRunner dry-run
  -> ContextIndex write-back
  -> RuntimeRecipeRanker status weights
```

这条路径最符合当前 mainline 替换节奏：先把自治判断变成可测试的纯策略，再把写回接到 ContextIndex，最后再让 rescan/file-change/usage 逐步喂信号。
