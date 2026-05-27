# 冷启动 & 增量扫描管线架构

> **状态**: 已实施 ✅  
> **最后更新**: 2026-05-02

---

## 1. 总体架构

系统通过两条主管线完成知识库的构建和维护：

| 管线 | 触发方式 | 分析模式 | 清理策略 | 维度执行 |
|------|---------|---------|---------|---------|
| **冷启动 (Cold Start)** | `alembic bootstrap` / `POST /api/bootstrap/knowledge` | 全量 | full-reset | 全部维度 |
| **增量扫描 (Knowledge Rescan)** | `alembic rescan` / 文件变更触发 | 增量/全量 | none / force-rescan / rescan-clean | 仅 gap 维度 |

两条管线共享完全相同的 Phase 1-4 项目分析逻辑（`ProjectIntelligenceCapability`），
差异体现在清理策略、维度选择和知识保留逻辑上。

### 执行模式

每条管线都支持两种执行器：

- **Internal Agent** — Alembic 内置的 Analyst/Producer AI pipeline 自动完成知识提取
- **External Agent** — 返回 Mission Briefing，由外部 IDE Agent（Cursor/Copilot）自行分析提交

```
┌─────────────────────────────────────────────────────┐
│                  管线入口层                           │
│  ColdStartIntent / KnowledgeRescanIntent            │
│        ↓ buildWorkflowPlan()                        │
├─────────────────────────────────────────────────────┤
│               共享分析管线                            │
│  ProjectIntelligenceCapability.run()                │
│    Phase 1   → 文件收集 (DiscovererRegistry)        │
│    Phase 1.5 → AST 分析 (tree-sitter)              │
│    Phase 1.6 → Code Entity Graph                    │
│    Phase 1.7 → Call Graph                           │
│    Phase 2   → 依赖关系图                            │
│    Phase 2.1 → Module 实体                          │
│    Phase 2.2 → Panorama 全景                        │
│    Phase 3   → Guard 规则审计                        │
│    Phase 4   → 维度解析 + Enhancement Pack          │
├─────────────────────────────────────────────────────┤
│              分支执行层                              │
│  ┌─────────────┐     ┌──────────────────┐          │
│  │ Internal     │     │ External          │          │
│  │ dispatchDim  │     │ MissionBriefing   │          │
│  │ ExecutionW.  │     │ + dimension_     │          │
│  │ (async fill) │     │   complete       │          │
│  └─────────────┘     └──────────────────┘          │
├─────────────────────────────────────────────────────┤
│              完成层                                  │
│  WorkflowCompletionFinalizer                        │
│  CompletionSteps (Delivery/Wiki/Panorama/Memory)    │
└─────────────────────────────────────────────────────┘
```

---

## 2. 文件组织

### 2.1 管线入口

```
lib/workflows/
├── shared/
│   └── WorkflowTypes.ts          # 共享类型（Logger/Context/normalize工具）
├── cold-start/
│   ├── ColdStartIntent.ts        # Intent 定义 + 参数规范化
│   ├── ColdStartPlan.ts          # WorkflowPlan 构建 + 维度选择
│   ├── ColdStartPresenters.ts    # 响应格式化（Internal/External）
│   ├── internal/
│   │   └── InternalColdStartWorkflow.ts    # 内部 Agent 冷启动主流程
│   └── external/
│       └── ExternalColdStartWorkflow.ts    # 外部 Agent Mission Briefing
├── knowledge-rescan/
│   ├── KnowledgeRescanIntent.ts            # Intent 定义
│   ├── KnowledgeRescanWorkflowPlan.ts      # WorkflowPlan 构建
│   ├── KnowledgeRescanPresenters.ts        # 响应格式化
│   ├── internal/
│   │   └── InternalKnowledgeRescanWorkflow.ts  # 内部 Agent 增量扫描
│   └── external/
│       └── ExternalKnowledgeRescanWorkflow.ts  # 外部 Agent 增量扫描
└── capabilities/                   # 共享能力组件（见 §2.2）
```

### 2.2 共享能力层 (capabilities/)

```
lib/workflows/capabilities/
├── WorkflowCleanupPolicies.ts       # 清理策略（fullReset/rescanClean/forceRescan）
├── project-intelligence/            # Phase 1-4 共享分析管线
│   ├── ProjectIntelligenceCapability.ts   # Facade 入口
│   ├── ProjectIntelligenceRunner.ts       # runAllPhases 一站式调用
│   ├── ProjectIntelligencePreparation.ts  # 分析前准备（清理旧数据）
│   ├── ProjectIntelligenceIncrementalPlanner.ts  # 增量可行性评估
│   ├── FileDiffPlanner.ts                 # 文件差异计划器
│   ├── FileDiffSnapshotStore.ts           # SQLite 快照存储
│   └── ProjectIntelligenceResultProjection.ts    # 结果投影
├── planning/
│   ├── dimensions/
│   │   ├── BaseDimensions.ts              # 7+N 维度定义
│   │   ├── TierScheduler.ts              # 维度分层调度
│   │   ├── bootstrapDimensionConfigs.ts  # 维度配置表
│   │   └── BootstrapTerminalToolset.ts   # Terminal 工具集配置
│   └── knowledge/
│       ├── KnowledgeRescanPlanner.ts     # Rescan gap 分析
│       ├── KnowledgeRescanPlanBuilder.ts # Rescan 计划构建
│       ├── RecipeAuditEvidence.ts        # Recipe 证据审计
│       ├── RescanEvidenceProjectors.ts   # Rescan 证据投影
│       └── EvolutionPrescreen.ts         # 进化预筛选
├── execution/
│   ├── WorkflowSkillCompletionCapability.ts  # Skill 生成能力
│   ├── internal-agent/               # 内部 Agent 执行链路（扁平化）
│   │   ├── InternalDimensionExecutionWorkflow.ts  # 入口：维度执行调度
│   │   ├── InternalDimensionExecutionPipeline.ts  # 执行管线
│   │   ├── InternalDimensionFillDispatch.ts       # 填充分发
│   │   ├── InternalDimensionFillPreparation.ts    # 填充准备
│   │   ├── InternalDimensionFillFinalizer.ts      # 填充完成
│   │   ├── InternalDimensionFillSessionRunner.ts  # 会话运行器
│   │   ├── InternalDimensionFillTypes.ts          # 容器/上下文类型
│   │   ├── DimensionContext.ts                    # 跨维度上下文容器
│   │   ├── BootstrapRescanState.ts                # Rescan 状态/去重
│   │   ├── BootstrapRuntimeInitializer.ts         # 运行时初始化
│   │   ├── BootstrapConsumers.ts                  # 合并: 维度/会话/Tier/关系/Skill 消费者
│   │   ├── BootstrapProjections.ts                # 合并: 维度/会话结果投影
│   │   ├── BootstrapInputBuilders.ts              # 合并: Session/Dimension 输入构建
│   │   ├── BootstrapDimensionRuntimeBuilder.ts    # 维度运行时构建
│   │   ├── BootstrapSessionExecutionBuilder.ts    # 会话执行构建
│   │   └── MockBootstrapPipeline.ts               # Mock AI 测试管线
│   └── external/                     # 外部 Agent 执行链路（扁平化）
│       ├── ExternalMissionWorkflow.ts             # Mission 工作流
│       ├── ExternalDimensionCompletionWorkflow.ts # 维度完成处理
│       ├── MissionBriefingBuilder.ts              # Briefing 主构建器
│       ├── MissionBriefingSupport.ts              # 合并: Profiles/Compression/Instructions/DimensionText/RescanProjector
│       ├── EvidenceStarterBuilder.ts              # 证据启动器
│       ├── BootstrapSession.ts                    # 会话管理
│       ├── ExternalSubmissionTracker.ts           # 外部提交追踪
│       └── SessionSupport.ts                      # 合并: SessionManager/SessionCache
├── completion/                        # 完成处理
│   ├── WorkflowCompletionFinalizer.ts # 最终化协调器
│   ├── CompletionSteps.ts            # 合并: Delivery/Verification/Panorama/Wiki/SemanticMemory
│   └── WorkflowCompletionTypes.ts    # 完成层类型定义
├── persistence/                       # 持久化（扁平化）
│   ├── WorkflowResultPersistence.ts   # 结果持久化入口
│   ├── DimensionCheckpoint.ts         # 合并: 检查点存储 + 维度恢复
│   ├── WorkflowReportWriter.ts        # 报告写入器
│   ├── WorkflowReportTypes.ts         # 报告类型定义
│   ├── WorkflowReportHistoryStore.ts  # 历史报告存储
│   └── WorkflowSnapshotStore.ts       # 快照存储
└── presentation/                      # 响应展示
    ├── LanguageExtensionBuilder.ts    # 语言扩展
    ├── TargetClassifier.ts            # Target 角色分类
    ├── TargetFileMapBuilder.ts        # Target 文件映射
    └── PanoramaSummaryPresenter.ts    # 全景摘要
```

---

## 3. 冷启动流程 (Cold Start)

### 3.1 Internal Agent 路径

```
runInternalColdStartWorkflow(ctx, args)
  │
  ├── 1. createInternalColdStartIntent(args)     # 构建 Intent
  ├── 2. buildColdStartWorkflowPlan(intent)      # 构建 Plan
  ├── 3. runFullResetPolicy()                    # 清理 DB + 文件
  ├── 4. ProjectIntelligenceCapability.run()      # Phase 1-4 分析
  ├── 5. buildProjectSnapshot()                   # 构建不可变快照
  ├── 6. selectColdStartDimensions()              # 选择维度
  ├── 7. cacheProjectAnalysisSession()            # 缓存分析结果
  ├── 8. startInternalDimensionExecutionSession() # 创建任务清单
  ├── 9. dispatchInternalDimensionExecution()      # 异步后台填充 ⚡
  └── 10. presentInternalColdStartResponse()      # 快速返回骨架
```

### 3.2 External Agent 路径

```
runExternalColdStartWorkflow(ctx)
  │
  ├── 1. createExternalColdStartIntent()
  ├── 2. buildColdStartWorkflowPlan(intent)
  ├── 3. runFullResetPolicy()
  ├── 4. ProjectIntelligenceCapability.run()
  ├── 5. buildProjectSnapshot()
  ├── 6. createExternalWorkflowSession()
  ├── 7. buildExternalMissionBriefing()            # 构建 Mission Briefing
  └── 8. presentExternalColdStartResponse()
```

---

## 4. 增量扫描流程 (Knowledge Rescan)

### 4.1 增量决策逻辑

```
FileDiffPlanner.evaluate(currentFiles, allDimIds)
  │
  ├── 加载上次快照 (FileDiffSnapshotStore.getLatest)
  │   └── 无快照 → 全量 (mode: 'full')
  │
  ├── 计算 diff (computeDiff)
  │   ├── added: 新增文件
  │   ├── modified: 内容变更文件
  │   ├── deleted: 已删除文件
  │   └── changeRatio: 变更比例
  │
  ├── 推断受影响维度 (inferAffectedDimensions)
  │   ├── changeRatio > 50% → 全量
  │   ├── 0 变更 → 跳过所有维度
  │   └── 查维度-文件映射 + 文件类型推断 → 受影响维度列表
  │
  └── 返回 IncrementalPlan { mode, affectedDimensions, skippedDimensions, diff }
```

### 4.2 Internal Agent Rescan 流程

```
runInternalKnowledgeRescanWorkflow(ctx, args)
  │
  ├── Step 0:   清理策略 (none / force-rescan / rescan-clean)
  ├── Step 0.5: Recipe 文件 ↔ DB 一致性恢复
  ├── Step 1:   SourceRef 校验 + 反向清理
  ├── Step 2:   Phase 1-4 项目分析（含增量 diff）
  ├── Step 2.5: 进化候选构建 (RecipeImpactPlanner)
  ├── Step 3:   Evolution Agent 验证 (fire-and-forget)
  ├── Step 4:   Recipe 证据审计 + gap 分析
  ├── Step 4.5: Evolution Prescreen
  ├── Step 5:   计算 gap 维度
  ├── Step 5.5: 缓存 Phase 结果
  ├── Step 6:   构建 targetFileMap + 任务清单
  └── Step 7:   异步后台填充 gap 维度
```

---

## 5. 共享分析管线 (Phase 1-4)

### ProjectIntelligenceRunner.runAllPhases()

| Phase | 名称 | 输入 | 输出 | 可选 |
|-------|------|------|------|------|
| 1 | 文件收集 | projectRoot, maxFiles | allFiles, allTargets, langStats | - |
| Inc. | 增量评估 | allFiles + 上次快照 | IncrementalPlan | incremental=true |
| 1.5 | AST 分析 | allFiles, langStats | astProjectSummary, astContext | - |
| 1.6 | Entity Graph | astProjectSummary | codeEntityResult | materialize.codeEntityGraph |
| 1.7 | Call Graph | astProjectSummary | callGraphResult | materialize.callGraph |
| 2 | 依赖图 | discoverer | depGraphData, depEdgesWritten | materialize.dependencyEdges |
| 2.1 | Module 实体 | depGraphData | (写入 Entity Graph) | materialize.moduleEntities |
| 2.2 | Panorama | (DB 中已有数据) | panoramaResult | materialize.panorama |
| 3 | Guard 审计 | allFiles | guardAudit, guardEngine | skipGuard |
| 4 | 维度解析 | 所有前序结果 | activeDimensions, langProfile | - |

### Materialization 控制

每个物化步骤可通过 `materialize` 选项独立开关：

```typescript
const materialize: ProjectAnalysisMaterializationOptions = {
  codeEntityGraph: true,   // Phase 1.6: Entity Graph 写入 DB
  callGraph: true,          // Phase 1.7: Call Graph 写入 DB
  dependencyEdges: true,    // Phase 2: 依赖边写入 knowledge_edges
  moduleEntities: true,     // Phase 2.1: Module 实体写入 Entity Graph
  guardViolations: true,    // Phase 3: Guard 违规写入 ViolationsStore
  panorama: true,           // Phase 2.2: 全景汇总计算
};
```

---

## 6. 增量快照存储

### FileDiffSnapshotStore

**存储**: SQLite `bootstrap_snapshots` + `bootstrap_dim_files` 表

```
bootstrap_snapshots
  ├── id (snap_xxxx)
  ├── projectRoot
  ├── fileHashes (JSON: { relativePath → contentHash })
  ├── dimensionMeta (JSON: { dimId → { candidateCount, referencedFiles, ... } })
  ├── episodicData (JSON: SessionStore 序列化)
  ├── isIncremental, parentId
  ├── changedFiles, affectedDims (JSON arrays)
  └── status ('complete')

bootstrap_dim_files
  ├── snapshotId → bootstrap_snapshots.id
  ├── dimId
  ├── filePath (relative)
  └── role ('referenced')
```

**容量控制**: 最多保留 5 个历史快照，自动清理旧快照。

**增量阈值**: 文件变更比例 > 50% → 自动回退全量。

---

## 7. 清理策略

| 策略 | 触发场景 | 行为 |
|------|---------|------|
| `full-reset` | 冷启动 | 清除 DB 全部表 + 文件系统缓存 |
| `rescan-clean` | 增量扫描（默认） | 快照 recipes → 清除衍生缓存 → 恢复 recipes |
| `force-rescan` | 强制增量扫描 | 快照 recipes → 清除会话缓存但保留增量证据 |
| `none` | 增量扫描（无清理） | 仅快照 recipes，不清理任何数据 |

---

## 8. 进度推送 (Socket.io Events)

| 事件 | 触发时机 | 携带数据 |
|------|---------|---------|
| `bootstrap:started` | 骨架创建完成 | 任务清单 |
| `bootstrap:task-started` | 维度开始填充 | dimId, dimName |
| `bootstrap:task-completed` | 维度填充完成 | dimId, candidateCount |
| `bootstrap:task-failed` | 维度填充失败 | dimId, error |
| `bootstrap:all-completed` | 全部维度完成 | 总览统计 |

---

## 9. 设计决策

### 9.1 同步骨架 + 异步填充

冷启动采用"先返回骨架，后台逐维度填充"模式，前端通过 Socket.io 实时更新卡片状态。
这使得 HTTP 响应在 1-3 秒内返回，而维度分析在后台持续数分钟。

### 9.2 Intent → Plan → Execute 三层架构

每个管线遵循统一的三层模式：
- **Intent**: 捕获用户意图，规范化参数
- **Plan**: 根据 Intent 构建执行计划（分析选项、清理策略、物化选项）
- **Execute**: 按 Plan 顺序执行各步骤

### 9.3 ProjectIntelligenceCapability 作为共享 Facade

冷启动和增量扫描共享完全相同的 Phase 1-4 分析管线，
通过 `ProjectIntelligenceCapability.run()` 统一调用。
差异通过 `scan.incremental`、`materialize` 等选项参数控制。

### 9.4 文件指纹增量

`FileDiffSnapshotStore` 使用文件内容 hash 进行精确的变更检测，
结合维度-文件映射关系，精准判定哪些维度需要重新分析。
变更比例超过 50% 时自动回退全量，避免增量分析不完整。
