# KnowledgeMetabolism 重新定位设计

> 状态：**设计中** | 创建于 2026-04-17

## 0. 背景

进化系统完成 `evolution-pipeline-architecture.md` 重构后，原 `KnowledgeMetabolism` 编排的三个子引擎与新架构组件产生严重职责重叠。同时，矛盾/冲突类问题本质上需要上下文理解和人工判断，更适合交给 Agent 在 rescan/evolve 流程中处理，而非用自动化代码逻辑硬编码规则。本文档基于当前代码实现逐一分析，给出简化方案。

---

## 1. 现状代码分析

### 1.1 KnowledgeMetabolism 当前角色

```
KnowledgeMetabolism（编排层）
├── DecayDetector.scanAll()         → deprecate proposals → Gateway.submit()
├── ContradictionDetector.detectAll() → warnings → WarningRepository
└── RedundancyAnalyzer.analyzeAll()   → warnings → WarningRepository
```

**触发方式：**
- `UiStartupTasks` Stage 5 直接调用 `runFullCycle()`（冷启动同步执行）
- `SignalBus` 订阅 `decay|quality|anomaly` 信号 → 30s debounce → `runFullCycle()`

**DI 特征（违反新架构原则 3）：**
```typescript
constructor(options: {
  contradictionDetector: ContradictionDetector;  // 必选
  redundancyAnalyzer: RedundancyAnalyzer;        // 必选
  decayDetector: DecayDetector;                  // 必选
  signalBus?: SignalBus;                         // 可选 ← 问题
  reportStore?: ReportStore;                     // 可选 ← 问题
  evolutionGateway?: EvolutionGateway;           // 可选 ← 问题
  warningRepository?: WarningRepository;         // 可选 ← 问题
})
```

4 个可选依赖 → `#signalBus ?? null` / `#gateway ?? null` 模式遍布代码。新架构原则 3 要求「所有依赖必须是 required」。

### 1.2 DecayDetector — 与 RelevanceAuditor 完全重叠

**DecayDetector 评估模型：**
```
decayScore = freshness(0.3) + usage(0.3) + quality(0.2) + authority(0.2)

等级:
  80-100 → healthy
  60-79  → watch
  40-59  → decaying → Gateway.submit({ action:'deprecate', source:'metabolism' })
  20-39  → severe   → Gateway.submit({ confidence: max(0.4, 1-score/100) })
  0-19   → dead     → Gateway.submit({ confidence: max(0.4, 1-score/100) })
```

**RelevanceAuditor 评估模型（新架构）：**
```
relevanceScore = triggerStillMatches(0.2) + symbolsAlive(0.3) + depsIntact(0.15) + codeFilesExist(0.35)

等级（由 EvolutionPolicy.classifyRelevance() 集中管理）:
  ≥80 → healthy
  ≥60 → watch
  ≥40 → decay   → Gateway.submit({ action:'deprecate', source:'relevance-audit', confidence:0.4 })
  ≥20 → severe  → Gateway.submit({ confidence:0.6 })
  <20 → dead    → Gateway.submit({ confidence:0.95 })
```

**重叠分析：**

| 维度 | DecayDetector | RelevanceAuditor |
|------|---------------|------------------|
| 数据来源 | DB stats（lastHitAt、FP rate、authority） | 代码证据（AST符号、文件存活、trigger匹配） |
| 信号策略 | 6 种 decay strategy（no_usage, high_fp, symbol_drift, source_ref_stale, superseded, contradiction） | 4 维证据加权 |
| 输出 | decayScore 0-100 → deprecate proposal | relevanceScore 0-100 → deprecate proposal |
| 目标 | 同一批 active Recipe → 同一个 Gateway | 同一批 active Recipe → 同一个 Gateway |
| 调用时机 | 每次冷启动 + 每 30s signal debounce | 每次 rescan Phase A |
| 分级 | 自定义 scoreToLevel() | EvolutionPolicy.classifyRelevance() ← 架构集中管理 |

**关键矛盾：** 冷启动时 Metabolism Stage 5 先跑 DecayDetector → 创建 12 条 `source:metabolism` proposals；rescan 时 RelevanceAuditor 对同批 Recipe 再跑 → 可能再创建 `source:relevance-audit` proposals。**同一条 Recipe 可能出现两份 deprecate proposal，来自两个不同 source。**

**DecayDetector 的独有维度：**
- `no_recent_usage`（90天无使用）— RelevanceAuditor 不看使用频率
- `high_false_positive`（FP率>40%）— RelevanceAuditor 不看 guard 准确性
- `superseded`（deprecated_by 关系）— RelevanceAuditor 不看知识图谱边

这些维度有价值，但应该作为 RelevanceAuditor 的补充信号源，而不是独立产出 proposal。

### 1.3 RedundancyAnalyzer — 被 ConsolidationAdvisor 覆盖

**RedundancyAnalyzer：**
```
全量 O(n²) 两两比对 active/staging Recipe
RecipeSimilarity.computeDimensions() → weighted(0.2*title + 0.3*clause + 0.3*code + 0.2*guard)
≥ 0.65 → RedundancyResult → 转为 RecipeWarning
```

**ConsolidationAdvisor（新架构，提交时实时触发）：**
```
每次提交新 Recipe 时触发
同域候选加载（≤30条）+ 跨域兜底
RecipeSimilarity.computeDimensions() → 完全相同的算法
≥ 0.65 → merge/reorganize/insufficient 建议 → 阻止碎片化入库
Layer 1.5: 0.4-0.65 模糊区间 → FieldAnalysis 精细分析
```

**重叠分析：**

| 维度 | RedundancyAnalyzer | ConsolidationAdvisor |
|------|-------------------|---------------------|
| 算法 | RecipeSimilarity（4维 Jaccard） | RecipeSimilarity（4维 Jaccard） — **完全相同** |
| 阈值 | 0.65 | 0.65 + Layer 1.5 (0.4-0.65) |
| 触发时机 | 启动时全量扫描 + signal debounce | 每次提交时实时 |
| 动作 | 仅 warning（不走 Proposal） | merge/reorganize/insufficient **实际阻止入库** |
| 复杂度 | O(n²) 全量 | O(n) 候选 vs 同域 |

**结论：** ConsolidationAdvisor 在入口处已经阻止了冗余 Recipe 入库。RedundancyAnalyzer 的全量后置扫描只能发现「历史遗留」冗余，但这些问题在 rescan 的 Phase B evolve 阶段由 Agent 人工审查更合适。全量 O(n²) 比对随 Recipe 数增长不可持续（108 条 → 5778 次比对，500 条 → 124750 次比对）。

### 1.4 ContradictionDetector — 精度不足，应交给 Agent

**ContradictionDetector：**
```
全量 O(n²) 两两比对 active/staging/evolving Recipe
4 个检测维度:
  1. 否定模式 + 主题重叠（排除 dontClause 后）
  2. doClause vs dontClause 交叉引用
  3. guard regex 互斥
结果: hard (≥0.8) / soft (0.4-0.8) → RecipeWarning
```

**核心问题 — 规则硬编码无法替代语义理解：**

矛盾检测的本质困难在于：两条 Recipe 是否「矛盾」需要理解业务上下文。例如：
- 「使用 OSAllocatedUnfairLock」和「遵循架构层级规范」— 纯文本 negation pattern 无法判断是否冲突
- 「用 SnapKit 布局」和「禁止 Storyboard」— 表面上有 topic overlap，但实际是互补而非矛盾
- 同一个 trigger 场景下的新旧最佳实践 — 这种真正的矛盾反而难被 Jaccard 捕获

**精度验证（BiliDili 实测）：**
- 108 条 active Recipe 冷启动 → 5 条 soft contradiction
- **全部为误报**（dontClause 天然含否定词，已修 fix 但根本问题未解决）
- 修复后仍依赖粗粒度 negation pattern + topic overlap，对语义矛盾无能为力

**产出价值有限：**
- 仅生成 warning（不走 Proposal，不触发状态转换）
- Dashboard 展示为信息性提示，开发者很少主动查看
- 真正的矛盾需要 Agent 在 evolve 流程中结合项目上下文判断

**结论：** 矛盾/冲突处理应交给 Agent，在 rescan → evolve 流程中由 Agent 阅读 Recipe 内容后做出语义级判断，而非依赖精度不足的规则引擎。

---

## 2. 设计决策

### 2.1 废除 DecayDetector 作为独立提案来源

**理由：**
- 与 RelevanceAuditor 产出完全相同类型的 deprecate proposal
- 不走 EvolutionPolicy.classifyRelevance()，分级逻辑自成一套
- source='metabolism' 的 proposal 被 `EvolutionPolicy.shouldImmediateExecute()` 明确排除（永远不会立即执行）
- 冷启动时产生大量低质量 proposal（BiliDili: 12 条 deprecate），这些 proposal 在 rescan 后与 RelevanceAuditor 的 proposal 重复

**处理方式：** 将 DecayDetector 的有价值维度（usage、FP rate、superseded）合并为 RelevanceAuditor 的 `usageSignals` 补充输入。DecayDetector 类保留但不再直接创建 proposal，仅作为信号源。

### 2.2 废除 RedundancyAnalyzer 全量扫描

**理由：**
- ConsolidationAdvisor 在提交入口已做实时冗余阻止
- O(n²) 全量扫描不可持续
- 产出仅为 warning，无实质动作
- 历史遗留冗余在 rescan Phase B 由 Agent 人工审查

**处理方式：** RedundancyAnalyzer 类保留（`analyzePair()` 仍被其他组件引用），但 `analyzeAll()` 全量扫描不再被 Metabolism 调用。

### 2.3 废除 ContradictionDetector 自动化检测 — 交给 Agent

**理由：**
- 规则引擎精度不足（BiliDili 实测 100% 误报率）
- 矛盾判断本质需要语义理解，hardcode 的 negation pattern + topic overlap 无法胜任
- 产出仅为 warning，无实质动作，开发者很少主动处理
- O(n²) 全量扫描性能不可持续
- Agent 在 rescan → evolve 流程中已经逐条审查 Recipe，天然具备矛盾判断能力

**处理方式：**
1. ContradictionDetector 类标记 `@deprecated`
2. 矛盾检测职责转移到 Agent 在 evolve 阶段的 Recipe 审查：
   - rescan 的 Mission Briefing 中已包含 `allRecipes` 完整列表
   - Agent 在 `alembic_evolve` 逐维度审查时，可以识别同维度内语义冲突的 Recipe
   - Agent 可通过 `propose_evolution` / `confirm_deprecation` 对矛盾 Recipe 做出决策
3. 未来可在 Mission Briefing 的 `evolutionGuide` 中增加 hint：「请注意检查同维度 Recipe 之间是否存在矛盾」

### 2.4 废除 KnowledgeMetabolism 编排层

**理由：**
- 3 个子引擎全部冗余或不适合自动化：Decay→Relevance（完全重叠）、Redundancy→Consolidation（大部分重叠）、Contradiction→Agent（精度不足应交由 Agent）
- 编排层的核心价值（统一触发 + 聚合报告）已被新架构的 RescanFlow + UiStartupTasks 取代
- Signal debounce 30s 循环会在 SourceRefReconciler 等组件发射 quality 信号后不必要地触发全量扫描
- 可选依赖模式违反架构原则

**结论：** `KnowledgeMetabolism` 类标记 `@deprecated`，从 `UiStartupTasks` Stage 5 和 `KnowledgeModule` DI 中移除。

---

## 3. 新架构中各职责的归属

```
旧 Metabolism 子引擎              新架构归属
─────────────────────────────────────────────────────────────
DecayDetector.scanAll()          → 废除独立调用
  ├─ no_recent_usage             → RelevanceAuditor 新增 usageDecay 维度（Future）
  ├─ high_false_positive         → RelevanceAuditor 新增 qualitySignals 维度（Future）
  ├─ symbol_drift                → RelevanceAuditor.symbolsAlive（已覆盖）
  ├─ source_ref_stale            → RelevanceAuditor.codeFilesExist（已覆盖）
  ├─ superseded                  → EvolutionGateway 处理 deprecated_by（已覆盖）
  └─ contradiction               → Agent 在 evolve 阶段语义判断

RedundancyAnalyzer.analyzeAll()  → 废除全量调用
  └─ 实时冗余阻止                → ConsolidationAdvisor（已覆盖）

ContradictionDetector.detectAll() → 废除自动化检测
  └─ 矛盾识别                    → Agent 在 alembic_evolve 逐维度审查时判断
  └─ 矛盾处理                    → Agent 通过 propose_evolution / confirm_deprecation 决策

Metabolism.runFullCycle()         → 废除
  ├─ UiStartupTasks Stage 5      → 移除
  ├─ SignalBus debounce 循环      → 移除
  └─ 聚合报告                    → rescan summary 替代
```

### 3.1 冷启动流程变化

**当前（Stage 5 Metabolism 存在）：**
```
Stage 1: promote staging → active
Stage 2: SourceRefReconciler → 发射 quality signal
Stage 3: Vector reconcile
Stage 4: BM25 index refresh
Stage 5: Metabolism.runFullCycle() ← O(n²) 全量扫描，创建大量 proposal
Stage 6: ProposalExecutor.checkAndExecute() ← 处理 Stage 5 产生的 proposal
Stage 7: ProposalExecutor.subscribeToSignals()
```

**简化后：**
```
Stage 1: promote staging → active
Stage 2: SourceRefReconciler
Stage 3: Vector reconcile
Stage 4: BM25 index refresh
Stage 5: ProposalExecutor.checkAndExecute()  ← 处理已有 proposal（来自上次 rescan）
Stage 6: ProposalExecutor.subscribeToSignals()
```

**冷启动不再产生新 proposal。** 衰退检测和矛盾检测统一在 rescan 时执行，rescan 是明确的用户意图行为，产出的 proposal 质量更高（有完整的 Phase 1-4 代码分析数据作为证据）。

### 3.2 Rescan 流程变化

**当前：**
```
Step 1-3: snapshot + clean + phase 1-4 分析
Step 4:   RelevanceAuditor.audit() → deprecate proposals
Step 4.5: buildEvolutionPrescreen()
Step 5:   Mission Briefing → Agent 执行 evolve/gap-fill
（Metabolism 不参与 rescan，但冷启动产物仍存留在 proposal 表中造成干扰）
```

**简化后：**
```
Step 1-3: snapshot + clean + phase 1-4 分析
Step 4:   RelevanceAuditor.audit() → deprecate proposals（不变）
Step 4.5: buildEvolutionPrescreen()（不变）
Step 5:   Mission Briefing → Agent 执行 evolve/gap-fill
            └─ Agent 在逐维度 evolve 时识别矛盾 Recipe 并处理
```

矛盾检测不再作为独立 Step，而是融入 Agent 的 evolve 审查流程。Agent 在逐维度审查时天然会阅读同维度所有 Recipe 的 doClause/dontClause/coreCode，具备识别语义矛盾的能力。Mission Briefing 的 `evolutionGuide` 可以增加 hint 提醒 Agent 关注矛盾。

---

## 4. 实现计划

### Phase 1: 移除 Metabolism 编排层

**文件变更：**

| 文件 | 动作 |
|------|------|
| `lib/service/evolution/KnowledgeMetabolism.ts` | 标记 `@deprecated`，保留类定义但清空 `runFullCycle()` 实现 |
| `lib/injection/modules/KnowledgeModule.ts` | 移除 `knowledgeMetabolism` singleton 注册 |
| `lib/service/bootstrap/UiStartupTasks.ts` | 移除 Stage 5 Metabolism 调用，重编号后续 Stage |
| `lib/injection/ServiceMap.ts` | 移除 `knowledgeMetabolism` 类型声明 |

**验证：** 冷启动后 proposal 表不再有 `source:metabolism` 记录。

### Phase 2: ContradictionDetector 标记废弃

**文件变更：**

| 文件 | 动作 |
|------|------|
| `lib/service/evolution/ContradictionDetector.ts` | 标记 `@deprecated`，保留类定义供测试引用 |
| `lib/injection/modules/KnowledgeModule.ts` | 移除 `contradictionDetector` singleton 注册（如有单独注册） |

**验证：** 冷启动和 rescan 均不再自动执行矛盾检测。

### Phase 3: Agent evolve 流程增强（可选）

在 Mission Briefing 的 `evolutionGuide` 中增加矛盾检测 hint，引导 Agent 在逐维度 evolve 时关注同维度 Recipe 间的语义冲突。

**文件变更：**

| 文件 | 动作 |
|------|------|
| `lib/external/mcp/handlers/bootstrap/MissionBriefingBuilder.ts` | `evolutionGuide` 增加矛盾检测 hint |

### Phase 4: DecayDetector 信号融合（Future）

将 DecayDetector 的 `no_recent_usage` 和 `high_false_positive` 维度作为 RelevanceAuditor 的扩展输入。这需要 RelevanceAuditor 接收 DB stats 数据，是一个较大的接口变更，可以在后续迭代中完成。

**暂不实现，记录为 Future Enhancement。**

---

## 5. 影响评估

### 5.1 受影响的消费者

| 消费者 | 当前依赖 | 影响 |
|--------|---------|------|
| UiStartupTasks | `metabolism.runFullCycle()` | 移除调用，Stage 重编号 |
| Dashboard (RecipesView) | `GET /warnings` → 展示 contradiction/redundancy | 历史 warnings 保留可查，不再有新的自动 warnings 写入 |
| Dashboard (EvolutionView) | proposal 列表 | 减少低质量 `source:metabolism` proposal |
| SignalBus 订阅 | decay/quality/anomaly → 触发 metabolism | 不再有消费者，信号仍正常发射 |
| KnowledgeModule DI | `knowledgeMetabolism` singleton | 移除注册 |
| Agent (evolve 流程) | 无直接依赖 | 新增职责：在 evolve 审查时识别矛盾 Recipe |

### 5.2 保留的组件

| 组件 | 保留理由 |
|------|---------|
| `DecayDetector` | `evaluate()` 方法仍可被 Dashboard API 单独调用展示 Recipe 健康度 |
| `RedundancyAnalyzer` | `analyzePair()` 方法被 ConsolidationAdvisor 间接使用（通过 RecipeSimilarity） |
| `WarningRepository` | Dashboard 历史 warnings 查看 + HTTP API |
| `RecipeWarning` 类型 | WarningRepository schema 依赖 |

### 5.3 可删除的代码

| 代码 | 理由 |
|------|------|
| `KnowledgeMetabolism` 类 | 编排层不再需要 |
| `MetabolismReport` 类型 | 仅被 Metabolism 使用 |
| `EvolutionProposal` 类型（Metabolism 内部） | 不再产出 proposal |
| `ContradictionDetector` 自动调用 | 矛盾检测交给 Agent 语义判断 |
| `UiStartupTasks` Stage 5 代码块 | 不再调用 |
| `KnowledgeModule` 中 Metabolism + ContradictionDetector 的 DI 注册 | 不再注册 |
| `migration 008_recipe_warnings.ts` | 保留（历史 warnings 仍可查看） |

---

## 6. 设计哲学：规则引擎 vs Agent 语义判断

本次简化的核心洞察是区分「确定性问题」和「需要理解力的问题」：

| 问题类型 | 确定性 | 适合的处理方式 | 当前实现 |
|---------|-------|------------|---------|
| 代码证据消失（文件删除、符号移除） | **高** — 文件存不存在是二元事实 | 自动化代码逻辑 | RelevanceAuditor ✅ |
| 冗余 Recipe（高相似度） | **高** — 4 维 Jaccard 算法阈值明确 | 提交时自动阻止 | ConsolidationAdvisor ✅ |
| 语义矛盾（两条 Recipe 互相冲突） | **低** — 需要理解业务上下文 | Agent 语义判断 | ContradictionDetector ✗ 精度不足 |
| 内容过时（最佳实践已演变） | **低** — 需要理解技术趋势 | Agent 在 evolve 中判断 | DecayDetector ✗ 只看时间/频率 |

**原则：确定性高的自动化，需要理解力的交给 Agent。**

ContradictionDetector 试图用 negation pattern + topic overlap 规则来判断语义矛盾，这是「用确定性工具解决不确定性问题」的典型反模式。Agent 在 `alembic_evolve` 逐维度审查时天然具备：
1. **上下文理解** — 读取同维度所有 Recipe 的完整内容
2. **项目知识** — 通过 Mission Briefing 了解项目架构
3. **推理能力** — 判断两条 Recipe 是「互补」还是「冲突」
4. **决策能力** — 直接通过 `propose_evolution` / `confirm_deprecation` 处理

## 7. DecayDetector 独有维度保留价值分析

作为 Future Enhancement 的参考，记录 DecayDetector 各维度在新架构中的归属：

| DecayDetector 维度 | 保留价值 | 新架构归属建议 |
|-------------------|---------|-------------|
| `no_recent_usage`（90天无使用） | **高** — 使用频率是独立于代码证据的健康信号 | RelevanceAuditor 新增 `usageDecay` 证据维度，权重 0.1（从其他维度分出） |
| `high_false_positive`（FP率>40%） | **高** — guard 准确性直接影响 Recipe 实用性 | RelevanceAuditor 新增 `guardAccuracy` 证据维度，权重 0.1 |
| `symbol_drift`（ReverseGuard 检测） | **低** — RelevanceAuditor.symbolsAlive 已覆盖 | 不需要 |
| `source_ref_stale`（来源文件失效） | **低** — RelevanceAuditor.codeFilesExist 已覆盖 | 不需要 |
| `superseded`（deprecated_by 关系） | **中** — 知识图谱信息有价值 | EvolutionGateway 处理 deprecated_by 时已设置 | 
| `contradiction`（硬矛盾） | **低** — 规则引擎精度不足，语义矛盾需要理解力 | Agent 在 evolve 流程中语义判断 |

---

## 8. 总结

```
KnowledgeMetabolism 现状:
  ✗ DecayDetector           → 与 RelevanceAuditor 完全重叠，冷启动制造噪声
  ✗ RedundancyAnalyzer      → 与 ConsolidationAdvisor 大部分重叠，O(n²) 不可持续
  ✗ ContradictionDetector   → 精度不足（100% 误报），矛盾判断需要语义理解

决策:
  ✗ 废除 KnowledgeMetabolism 编排层
  ✗ 废除 UiStartupTasks Stage 5
  ✗ 废除 Metabolism SignalBus 订阅循环
  ✗ 废除 ContradictionDetector 自动化检测
  ○ 矛盾处理交给 Agent — evolve 审查时识别 + propose_evolution/confirm_deprecation 决策
  ○ 保留 DecayDetector 类（Dashboard API 可选调用）
  ○ Future: 将 usage/FP 维度融入 RelevanceAuditor

设计哲学转变:
  旧: 用规则引擎自动检测矛盾/冗余/衰退 → 生成 proposal/warning → 等待人确认
  新: 衰退由 RelevanceAuditor 基于代码证据自动处理（确定性高）
       冗余由 ConsolidationAdvisor 在提交入口实时阻止（确定性高）
       矛盾交给 Agent 在 evolve 流程中语义判断（需要理解力，不适合规则硬编码）
```
