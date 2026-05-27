# Alembic 冷启动工程上下文与工具使用规划技术调研

- 状态：技术调研已完成
- 日期：2026-05-24
- 范围：只分析 Alembic 冷启动 / prime 中“项目内工程信息如何被组织给 Agent 使用”，重点解释 `Understand Anything` 的社区划分、邻居关系和可控批次机制
- 关联参考：`Lum1104/Understand-Anything` `main@a8a115dc3664789403d4c4c0c087af8b9f72e6ee` 的本地代码事实扫描；本文已内嵌与 Alembic 的对比结论，当前不保留单独对比扫描文档入口。
- 本轮动作：新建 workspace 长期调研文档；不创建 wave、不派发窗口、不修改产品源码

## 核心判断

Alembic 冷启动已经能收集很多硬工程事实：文件、target、语言统计、AST、Code Entity Graph、Call Graph、Dependency Graph、Panorama、Guard audit、active dimensions、local package modules 和 incremental plan。问题不在“扫不到信息”，而在这些信息主要以“项目摘要 / 维度任务 / 证据 starter / 知识检索结果”的形式交给 Agent，还没有形成面向 Agent 行动的拓扑化上下文包。

`Understand Anything` 值得 Alembic 学的重点不是单一 `knowledge-graph.json`，而是它在 `/understand` Phase 1.5 中新增的这层中间组织：

```text
scan-result.json
  -> import graph
  -> Louvain community
  -> bounded batches
  -> cross-batch neighborMap
  -> batchImportData
  -> file-analyzer 按真实拓扑分析
```

这层的本质是：**先用确定性工程关系规划 Agent 的上下文投喂，而不是让 Agent 自己在大项目里随机找文件。**

Alembic 如果补这一层，应定位为 `ContextCommunity + NeighborContext + ToolUsePlan`，服务 cold-start Mission Briefing、internal dimension fill、prime、rescan 和 Dashboard guided tour；不应把 Alembic 降级为 UA 的静态图谱，也不应把 Recipe 生命周期放进 prompt-only 流程。

## 当前 Alembic 冷启动能力事实

### ProjectIntelligenceRunner 已经产出丰富工程事实

`AlembicCore/src/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts` 的 `runAllPhases()` 是冷启动和 rescan 的共享项目分析入口。它现在的真实阶段是：

1. Phase 1：文件收集，得到 `allFiles`、`allTargets`、`discoverer`、`langStats`、`truncated`。
2. Phase 1.5：AST 分析，得到 `astProjectSummary` 和可选 `astContext`。
3. Phase 1.6：Code Entity Graph materialization。
4. Phase 1.7：Call Graph analysis/materialization。
5. Phase 2：Dependency Graph，写入 module `depends_on` edges。
6. Phase 2.1：Module entities materialization。
7. Phase 2.2：Panorama 全景汇总。
8. Phase 3：Guard audit。
9. Phase 4：Dimension resolve、Enhancement Pack、language profile。

最终返回：

- `allFiles`
- `langStats`
- `primaryLang`
- `allTargets`
- `astProjectSummary`
- `astContext`
- `codeEntityResult`
- `callGraphResult`
- `depGraphData`
- `guardAudit`
- `activeDimensions`
- `targetsSummary`
- `localPackageModules`
- `incrementalPlan`
- `panoramaResult`
- `warnings`
- `report`

这说明 Alembic 的冷启动不是浅扫描。它的问题是缺少下一步：把这些信息组织成 Agent 可直接消费的“上下文社区”和“工具计划”。

### External cold start 现在输出 Mission Briefing

`AlembicPlugin/lib/external/mcp/handlers/bootstrap/ExternalColdStartWorkflow.ts` 的真实链路是：

```text
runFullResetPolicy
  -> ProjectIntelligenceCapability.run
  -> buildProjectSnapshot
  -> createExternalWorkflowSession
  -> buildExternalMissionBriefing
  -> presentExternalColdStartResponse
```

`MissionBriefingBuilder` 会把项目事实转成：

- project meta
- compressed AST
- architecture overview
- technology stack
- key abstractions
- Code Entity Graph / Call Graph 摘要
- Dependency Graph 节点和前 100 条边
- Guard findings
- targets
- dimensions
- language extension
- execution plan
- panorama summary
- must-cover local packages

这是很好的“总览型 briefing”，但它不是“执行型上下文计划”。它没有告诉 Agent：

- 当前应该按哪些工程社区分批分析。
- 每个社区包含哪些文件、关键实体和边界。
- 社区的入边 / 出边邻居是谁。
- 每个社区关联哪些 Recipes / Guard / verification commands。
- 每个社区应该优先使用哪些工具读、搜、验。
- 当文件变化时，哪些邻居社区要一起复核。

### EvidenceStarter 是维度启发，不是拓扑 batch

`EvidenceStarterBuilder` 会按 dimension 从 AST、Guard、Dependency Graph、Call Graph、Panorama 中生成启发，例如：

- 命名前缀分布
- 检测到的设计模式
- 继承热点
- protocol / interface 摘要
- Guard 违规
- 调用图规模
- coupling hotspots
- cyclic dependencies

这些信息能帮助维度分析，但它们仍是“按知识维度组织”的，不是“按工程拓扑组织”的。比如架构维度知道有 coupling hotspots，不等于 Agent 拿到一个 `auth community`、其邻居 `db/users`、相关 exports 和推荐读取顺序。

### prime 现在是 Recipe / Guard 检索，不是项目工程上下文注入

`AlembicPlugin/lib/external/mcp/handlers/task.ts` 的 `prime` 会：

1. 从 `userQuery`、`activeFile`、`language` 提取 intent。
2. 通过 `PrimeSearchPipeline` 做多 query search、semantic search、resident semantic search 和 keyword search。
3. 过滤质量，返回最多 5 条 knowledge 和 3 条 guard rules。
4. 初始化 IntentState，保存 `primeRecipeIds`、`primeModule`、`primeScenario`、`searchMeta`。

这已经是知识治理型 prime，但它目前主要注入 Recipes / Guards，并不基于项目拓扑生成：

- active file 所属工程社区。
- 同社区核心文件。
- 跨社区邻居。
- 调用链 / 依赖链上下文。
- 推荐 read/search/guard/test 工具计划。

所以 prime 不是弱，它只是偏“知识库检索入口”，还不是“工程上下文入口”。

### Panorama 已有 module neighbor，但没有变成 Agent 批次计划

`PanoramaService.getModule()` 已经能返回 module detail：

- module
- layerName
- neighbors
- fileGroups
- recipes
- uncoveredFileCount
- summary

其中 neighbors 来自 `depends_on` 入边 / 出边，fileGroups 按模块内子目录分组，summary 会描述 depends on / used by。

这说明 Alembic 已经有“模块邻居查询”。但它当前是 Dashboard / MCP 查询工具的单模块详情，不是 cold-start 阶段对全项目生成的社区划分，也没有形成可控 batch、neighborMap、tool plan 或 token budget plan。

## UA 的社区划分 + 邻居关系 + 可控批次

### 它解决的真实问题

UA 的设计文档把问题写得很清楚：旧的 `/understand` Phase 2 按 20 到 30 个文件做 count-based batch，会造成两个后果：

- dense batch 的 JSON 输出超过模型 / 写文件 token budget，Agent 可能进入未定义的 minimal output mode，静默丢节点和边。
- count-based batch 会切断模块语义。彼此 import 的 auth、api、db 文件可能被分到不同批次，file analyzer 看不到跨批语义边，导致 `calls`、`related`、`inherits`、`implements` 等边丢失。

所以 UA 新增 Phase 1.5 的目标不是“为了酷炫做图算法”，而是为了让 Agent 的工作单元贴近真实代码拓扑，并让输出大小可控。

### 输入与输出

UA 的 `compute-batches.mjs` 输入：

```text
.understand-anything/intermediate/scan-result.json
```

其中关键字段是：

- `files[]`
- `fileCategory`
- `language`
- `sizeLines`
- `importMap`

输出：

```text
.understand-anything/intermediate/batches.json
```

核心 schema：

```json
{
  "schemaVersion": 1,
  "algorithm": "louvain",
  "totalFiles": 100,
  "totalBatches": 7,
  "exportsByPath": {
    "src/auth/login.ts": ["login", "LoginResult"]
  },
  "batches": [
    {
      "batchIndex": 1,
      "files": [
        {
          "path": "src/auth/login.ts",
          "language": "typescript",
          "sizeLines": 120,
          "fileCategory": "code"
        }
      ],
      "batchImportData": {
        "src/auth/login.ts": ["src/auth/session.ts", "src/db/users.ts"]
      },
      "neighborMap": {
        "src/auth/login.ts": [
          {
            "path": "src/db/users.ts",
            "batchIndex": 3,
            "symbols": ["User", "findById", "createUser"]
          }
        ]
      }
    }
  ]
}
```

这个输出同时满足三件事：

- `batches[]` 决定 Agent 的任务切分。
- `batchImportData` 保证每个 batch 内的 deterministic import facts 可见。
- `neighborMap` 保证跨 batch 的 1-hop 上下游关系可见。

### Step 1：按文件类别拆 code / non-code

`compute-batches.mjs` 先把文件拆成：

- `codeFiles = files where fileCategory === "code"`
- `nonCodeFiles = files where fileCategory !== "code"`

原因是代码文件适合用 import graph 做社区发现；非代码文件如 Dockerfile、CI、SQL migration、docs 不一定有 import graph，要用工程语义规则分组。

### Step 2：用 import graph 做 Louvain 社区发现

对 code files，UA 构造一个无向图：

```text
node = file.path
edge = importMap[src] contains target
```

代码逻辑是：

```text
for each code file:
  graph.addNode(file.path)

for each src -> targets in importMap:
  if src and target are both code graph nodes:
    graph.addEdge(src, target)

communities = louvain(graph)
```

这里用无向图是合理的：batch 切分关心“分析时应该放在一起”，不只关心依赖方向。一个文件 import 另一个文件，或被另一个文件 import，都说明它们在分析上下文上有关系。

输出是：

```text
Map<filePath, communityId>
```

这一步把“文件列表”变成了“工程拓扑社区”。

### Step 3：Louvain 失败时 deterministic fallback

UA 没有让 Louvain 成为单点失败。`runLouvain()` 失败时会：

```text
algorithm = "count-fallback"
perFileCommunity = alphabetical chunking, 12 files per batch
warning: module semantic boundaries lost
```

这有两个价值：

- 扫描流程不会因为图算法异常彻底失败。
- fallback 是确定性的，重复运行结果稳定。

但它也明确承认代价：模块语义边界会丢失。

Alembic 如果做类似能力，也需要这个 fallback，但不应伪装成等价质量。应在 Mission Briefing / job event 中显式标注 `communityAlgorithm=count-fallback` 和原因。

### Step 4：社区大小上限

UA 对 Louvain 输出设置：

```text
MAX_COMMUNITY_SIZE = 35
```

如果某个 community 超过 35，会按字母序切成多个 synthetic community，并 warning：

```text
community size N > max 35
splitting via alphabetical chunking
modularity may decrease
```

这就是“可控批次”的第一层：不能让一个社区因为真实依赖太密而变成超大 prompt / 超大 JSON 输出。

注意：这不是理想的图切分算法。它用字母序拆分，是一个简单、稳定、可测试的工程折中。它的价值在于先保证 batch 上限，再通过 warning 暴露质量损耗。

### Step 5：非代码文件按工程语义分组

UA 对 non-code files 不走 Louvain，而是硬编码 Group A-E：

- Group A：每个包含 `Dockerfile` 的目录，把 `Dockerfile`、`docker-compose.*`、`.dockerignore` 放一组。
- Group B：`.github/workflows/*.yml` 或 `.yaml` 放一组。
- Group C：`.gitlab-ci.yml` 和 `.circleci/*` 放一组。
- Group D：`migrations/` 或 `migration/` 下 SQL 文件按目录放一组。
- Group E：剩余非代码文件按直接父目录分组，每组最多 20 个。

这里的关键不是规则本身多复杂，而是它承认“不同文件类型有不同拓扑来源”：

- 代码靠 import graph。
- CI 靠目录和平台约定。
- Docker 靠服务目录。
- SQL migration 靠时间序列和目录。
- docs/config 靠父目录语义。

Alembic 若实现 ContextCommunity，也不能只看 import graph。它应该让 Discoverer / language profile / target classifier 参与非代码社区构造。

### Step 6：small mergeable batch 合并

Louvain 常会产生很多 singleton 或 2-file 小社区。UA 的 `mergeSmallBatches()` 设置：

```text
MIN_BATCH_SIZE = 3
MAX_MERGE_TARGET = 25
```

逻辑：

- 小于 3 且 `mergeable=true` 的 batch 进入 pool。
- pool 后按 path 排序，切成最多 25 个文件的 misc batches。
- `mergeable=false` 的语义 batch 不合并，即使很小也保留。

这点很重要。它不是盲目合并所有小 batch，而是区分：

- 可以合并：Louvain singleton、孤儿 code file、普通 parent-dir catch-all。
- 不该合并：Dockerfile cluster、CI、SQL migration 等有语义边界的非代码组。

这就是“可控批次”的第二层：既避免过多微型 Agent 任务，又保护有业务语义的原子组。

### Step 7：构造 batchOf map

在第二轮 enrich 前，UA 构造：

```text
batchOf: Map<filePath, batchIndex>
```

这张表用于判断某个 import 邻居是在同 batch 还是跨 batch。它是 `neighborMap` 的基础。

### Step 8：构造 reverse import map

UA 不只看当前文件 import 谁，还看谁 import 当前文件：

```text
reverseImportMap[target] = [sources that import target]
```

这意味着一个文件的 1-hop neighbor 包含：

- outNeighbors：它依赖的文件。
- inNeighbors：依赖它的文件。

这比单向 imports 更适合 Agent 上下文，因为修改一个文件时，真正需要看的通常包括“它用谁”和“谁用它”。

### Step 9：构造 neighborMap

对每个 batch 内文件 `f`：

```text
batchImportData[f.path] = importMap[f.path]

allNeighbors = importMap[f.path] ∪ reverseImportMap[f.path]
filtered = allNeighbors where:
  neighbor exists in batchOf
  neighbor not in current batch

neighborMap[f.path] = filtered.map(path => {
  path,
  batchIndex: batchOf[path],
  symbols: exportsByPath[path] || []
})
```

关键点：

- 同 batch 文件不进入 neighborMap，因为 Agent 已经能看到。
- 只保留跨 batch 邻居，帮助 Agent 知道“当前分析还有哪些外部上下游”。
- 每个 neighbor 带 `batchIndex`，可追踪它属于哪个分析任务。
- 每个 neighbor 带 exported symbols，让 Agent 不用打开外部文件也能知道边界接口大概是什么。

这就是 UA 对 Agent 最有价值的部分：**它没有把跨 batch 上下文完全丢给 Agent 自己搜，而是以结构化邻居提示保留了边界。**

### Step 10：高阶邻居软上限

UA 设置：

```text
MAX_NEIGHBORS = 50
```

当一个文件的原始 1-hop degree 超过 50：

- 按 neighbor degree 从高到低排序。
- 只保留 top 50 cross-batch entries。
- 输出 warning，说明 dropped 数量。

这解决高扇入 hub 文件的问题，例如 logger、config、types、utils。否则一个 hub 的 neighborMap 会膨胀到影响 batch token budget。

注意 warning 使用的是 raw degree，而不是 filtered kept 数量。这能暴露“这个文件本身是高连接度 hub”，即使最后跨 batch kept 没有超过 50，也提醒下游分析要谨慎。

### Step 11：changed-files 模式保持 full graph assignment

UA 支持：

```text
--changed-files=<path>
```

逻辑是：

- 仍然构建全项目 import graph。
- 仍然跑 full graph Louvain。
- 只输出包含 changed files 的 batches。
- 保留原 batchIndex，不重新编号。
- neighborMap 可以引用未变更文件及其 full-graph batchIndex。

这对增量特别关键。否则 changed-only 模式会把一个文件放到完全不同的临时 batch 编号，历史图谱和邻居关系难以对齐。

Alembic 的 rescan 已有 FileDiffPlanner 和 RecipeImpactPlanner，但如果补 ContextCommunity，也应该采用类似原则：**增量只执行受影响社区，但社区编号和邻居归属应来自全项目稳定拓扑。**

## Alembic 现状与 UA 机制的差距

| 能力点 | Alembic 当前 | UA 当前 | 差距 |
| --- | --- | --- | --- |
| 工程事实采集 | 强：AST、EntityGraph、CallGraph、DepGraph、Panorama、Guard | 中强：scan-result、importMap、tree-sitter exports | Alembic 原料更多 |
| 社区划分 | 没有 cold-start 级 ContextCommunity | Louvain import community | Alembic 缺 Agent 执行分组 |
| 邻居关系 | Panorama module detail 有 neighbors；Graph 查询可查边 | batch 级 neighborMap | Alembic 邻居没有进入 cold-start / prime 投喂计划 |
| 可控批次 | ModuleService 旧扫描有 count batch；dimension fill 按维度 | MAX_COMMUNITY_SIZE、MIN_BATCH_SIZE、MAX_NEIGHBORS、changed-files | Alembic 缺拓扑 + token budget batch |
| Agent tool plan | Mission Briefing 给执行计划和维度；prime 给 Recipe/Guard | file-analyzer 按 batch 读结构化上下文 | Alembic 缺每社区 read/search/guard/test 建议 |
| 增量上下文 | FileDiffPlanner、rescan evidence、RecipeImpactPlanner | changed-files batch with full graph assignment | Alembic 缺 changed files -> affected communities -> neighbor communities |
| 长期治理 | 强：Recipe、Guard、evolve、consolidate、source refs | 弱：graph snapshot | Alembic 不应照搬 UA 的静态主存储 |

## Alembic 应补的中间层

### 建议概念：ContextCommunity

Alembic 可以在 `ProjectIntelligenceRunner` 后增加一个派生 planner，输入现有工程事实，输出 Agent 可消费的社区计划：

```ts
interface ContextCommunity {
  id: string;
  algorithm: 'module-dependency' | 'import-louvain' | 'target' | 'fallback-count';
  label: string;
  role?: string;
  layer?: string;
  files: Array<{
    relativePath: string;
    language?: string;
    targetName?: string;
    totalLines?: number;
    priority?: string;
  }>;
  keyEntities: Array<{
    name: string;
    kind: 'class' | 'function' | 'protocol' | 'module' | 'endpoint' | 'config';
    file?: string;
  }>;
  inboundNeighbors: NeighborCommunity[];
  outboundNeighbors: NeighborCommunity[];
  relatedRecipes: Array<{ id: string; title: string; trigger?: string }>;
  relatedGuards: Array<{ id: string; title: string; trigger?: string }>;
  evidenceStarters: Record<string, unknown>;
  toolUsePlan: ToolUsePlan;
  budgets: {
    maxFiles: number;
    maxNeighbors: number;
    estimatedTokens?: number;
    truncated?: boolean;
  };
}
```

### 建议概念：NeighborCommunity

```ts
interface NeighborCommunity {
  communityId: string;
  label: string;
  direction: 'in' | 'out' | 'both';
  relationTypes: Array<'imports' | 'depends_on' | 'calls' | 'data_flow' | 'recipe_ref'>;
  weight: number;
  files: string[];
  exportedSymbols?: string[];
  reason: string;
}
```

这里不要只做 file neighbor。Alembic 比 UA 多了 module、call graph、recipes 和 Guard，因此 neighbor 可以来自多种边：

- file import / dependency edge
- module `depends_on`
- call graph
- Panorama fan-in / fan-out
- Recipe source refs
- Guard cross-file violations

### 建议概念：ToolUsePlan

```ts
interface ToolUsePlan {
  readFirst: string[];
  searchHints: string[];
  graphQueries: Array<{
    tool: 'alembic_graph' | 'alembic_call_context' | 'alembic_panorama';
    args: Record<string, unknown>;
    reason: string;
  }>;
  guardChecks: Array<{
    files: string[];
    reason: string;
  }>;
  verificationHints: Array<{
    command?: string;
    source: 'package-script' | 'project-discovery' | 'recipe' | 'manual';
    confidence: 'high' | 'medium' | 'low';
  }>;
}
```

`ToolUsePlan` 是 Alembic 应该超越 UA 的地方。UA 主要告诉 file-analyzer “这些文件和邻居是什么”；Alembic 可以进一步告诉 Codex “下一步用哪些 Alembic 工具、读哪些文件、查哪些调用链、跑哪些 Guard 或验证命令”。

## 推荐实现逻辑

### Phase A：先做 deterministic ContextCommunity planner

落点建议：`AlembicCore`。

原因：

- 输入来自 `ProjectIntelligenceRunner`。
- external host-agent route 和 internal AI route 都要消费。
- 不应放到 `AlembicPlugin`，否则 internal route / Dashboard / daemon 复用困难。
- 不应放到 `AlembicAgent`，否则 Codex host agent 路线拿不到统一结果。

输入：

- `allFiles`
- `targetsSummary`
- `localPackageModules`
- `depGraphData`
- `astProjectSummary`
- `callGraphResult`
- `panoramaResult`
- `guardAudit`
- 可选 existing Recipes / source refs，由上层注入

第一版可以不引入 Louvain 依赖，先用 Alembic 已有 module / dependency / Panorama 做社区：

```text
target/local package/module
  -> module depends_on graph
  -> fan-in/fan-out neighbors
  -> files + key AST entities
  -> related Guard findings
  -> related Recipes by sourceRefs
```

等这个链路闭合后，再评估是否引入 Louvain 或自研轻量 community detection。

### Phase B：补稳定 batch 约束

ContextCommunity 需要有明确预算：

- `MAX_COMMUNITY_FILES`：例如 35 或按语言 / token 估算动态调整。
- `MIN_COMMUNITY_FILES`：小社区是否合并。
- `MAX_NEIGHBORS`：例如 50。
- `MAX_KEY_ENTITIES`：避免 AST key entities 撑爆 briefing。
- `MAX_RELATED_RECIPES` / `MAX_RELATED_GUARDS`：避免 prime 噪音。

拆分策略应遵循：

1. 先保留语义边界：target、local package、module、Docker/CI/migration 这类边界优先。
2. 超大社区才拆，拆分时必须记录 `splitReason`。
3. 小社区合并必须区分 `mergeable`，不能把 CI、migration、config hub 和普通孤儿代码混成一团。
4. fallback 必须机器可读，不能只写日志。

### Phase C：生成 NeighborContext

NeighborContext 的生成顺序建议：

1. 先从 module `depends_on` 生成 community-level inbound / outbound。
2. 再从 file import / AST imports 补 file-level cross-community neighbors。
3. 再从 call graph 补 method-level call neighbors。
4. 再从 Recipes source refs 补 knowledge neighbors。
5. 最后从 Guard cross-file violations 补 risk neighbors。

每条 neighbor 应记录：

- 来源关系：`depends_on`、`imports`、`calls`、`guard_violation`、`recipe_source_ref`
- 方向：in / out / both
- 权重
- 代表文件
- 代表 symbols
- 截断状态

### Phase D：把 ContextCommunity 注入 Mission Briefing

`MissionBriefingBuilder` 可以新增压缩字段，例如：

```ts
contextCommunities: {
  total: number;
  algorithm: string;
  warnings: string[];
  top: Array<{
    id: string;
    label: string;
    role?: string;
    layer?: string;
    fileCount: number;
    keyFiles: string[];
    keyEntities: string[];
    inbound: string[];
    outbound: string[];
    toolUsePlan: {
      readFirst: string[];
      searchHints: string[];
      graphQueries: string[];
      guardFiles: string[];
    };
  }>;
}
```

注意 Mission Briefing 不应该塞完整社区图。它应该塞：

- top communities
- active / risky communities
- must-cover communities
- changed communities
- 每个社区的压缩 tool plan

完整数据可以留在 session cache / ProjectSnapshot 派生字段，供 MCP 查询或 Dashboard 使用。

### Phase E：prime 使用 active file 命中社区

`alembic_task(operation=prime)` 可增加一层：

```text
activeFile / userQuery / language
  -> IntentExtractor
  -> Recipe / Guard search
  -> ContextCommunity lookup
  -> community + neighbor + toolUsePlan
  -> primeKnowledgeMaterial
```

这样 prime 的输出可以从：

```text
Found 3 recipe(s), 1 guard rule(s)
```

升级为：

```text
Found 3 recipe(s), 1 guard rule(s).
Active file belongs to community: Dashboard Jobs Timeline.
Read first: JobsView.tsx, jobProcessEvents.ts, api.ts.
Neighbors: Alembic jobs route, Agent process event producer.
Recommended checks: guard on touched files, dashboard npm run check.
```

这才是“工程上下文 prime”。

### Phase F：rescan 使用 changed files 命中社区和邻居

Alembic rescan 现在已经能按 diff 和 Recipe impact 做计划。ContextCommunity 可以补一层：

```text
changed files
  -> changed communities
  -> affected neighbor communities
  -> related recipes / guards
  -> rescan evidence plan
```

这能让 rescan 不只是“哪些维度受影响”，还能知道“哪些工程区域和邻居需要复核”。

## 与 UA 的关键差异

Alembic 可以借鉴 UA 的拓扑组织，但实现时应该保留自己的强项：

- UA 的 `neighborMap` 是 file-level 1-hop import neighbor；Alembic 的 NeighborContext 应该支持 module、file、call、recipe、guard 多源关系。
- UA 的 batch 是为了 file-analyzer 写 graph JSON；Alembic 的 ContextCommunity 是为了 host-agent / internal-agent 行动、Recipe 生产、Guard 检查和 Dashboard 理解。
- UA 的 `batches.json` 是项目内 artifact；Alembic 的完整社区计划应是 ProjectSnapshot 派生数据或 session cache，不应成为主存储。
- UA 的 changed-files 模式保留 full graph assignment；Alembic 也应该保留稳定 community id，避免每次 rescan 重新洗牌导致 Recipe/sourceRef 难追踪。
- UA 的工具链是 skill prompt + local scripts；Alembic 应让 `AlembicCore` 产生确定性 planner，`AlembicPlugin` / `Alembic` / `AlembicAgent` 分别消费。

## 第一阶段最小闭环建议

如果后续用户决定推进实现，最小闭环不应一上来做完整 Louvain。建议先做：

1. 在 `AlembicCore` 新增 deterministic `ContextCommunityPlanner`。
2. 输入使用现有 `targetsSummary`、`depGraphData`、`panoramaResult`、`astProjectSummary`、`guardAudit`。
3. 输出 3 到 8 个压缩 community summary，每个包含 files、keyEntities、in/out neighbors、readFirst、searchHints、guardFiles。
4. `ExternalColdStartWorkflow` 把压缩结果注入 Mission Briefing。
5. `alembic_task prime` 在有 `activeFile` 时查所属 community，并把社区摘要放进 `primeKnowledgeMaterial`。
6. Dashboard 暂不改或只在 Panorama module detail 中显示相关字段。

这个闭环的完成定义：

- 冷启动 Mission Briefing 能看到 context communities。
- prime 能基于 active file 返回社区 + 邻居 + readFirst。
- 不影响现有 Recipe / Guard / dimension flow。
- 有单测覆盖 oversized community、neighbor cap、active file lookup、fallback。

## 后续增强候选

后续可以再考虑：

- 引入 Louvain 或其它 community detection，对 file import graph 做更细社区。
- 基于 call graph 构造 method-level hot path。
- 从 package scripts / test config / recipes 中提取 verification command confidence。
- Dashboard 增加 community map / guided tour。
- rescan changed files -> affected communities -> neighbor communities 的增量计划。
- `alembic_call_context` 和 `alembic_panorama` 自动生成 tool-use plan。

这些都应作为后续需求进入标准流程。本轮只是技术调研，不自动派发。

## 风险与边界

- 不能把 ContextCommunity 做成新一套平行知识库；它应是 Project Intelligence 的派生上下文，不替代 Recipes。
- 不能让社区算法成为 cold-start 硬失败点；必须有 deterministic fallback。
- 不能把所有邻居塞进 Mission Briefing；必须有 token budget 和 truncation metadata。
- 不能只按文件数拆分；否则会重现 UA 曾经遇到的 count-based batch 问题。
- 不能忽略非代码文件；CI、Docker、migration、config 对真实项目工具使用和验证路径很关键。
- 不能把工具使用计划写成“未来可能工具”；每条 tool suggestion 必须有真实入口，例如 `alembic_graph`、`alembic_call_context`、`alembic_panorama`、`alembic_guard` 或项目脚本。

## 本轮结论

Alembic 当前冷启动的工程信息采集已经强于 UA，但上下文组织方式还偏“摘要 + 维度 + 知识检索”。UA 的社区划分、邻居关系和可控批次展示了一个更适合 Agent 消费的中间层：先用 deterministic topology 规划分析单元，再把跨单元关系以 `neighborMap` 保留下来，并用 size / neighbor cap 控制输出。

Alembic 下一阶段真正值得学习的是这个模式：

```text
工程事实
  -> 稳定上下文社区
  -> 跨社区邻居
  -> 可控 token / 文件预算
  -> Agent 工具使用计划
  -> prime / bootstrap / rescan / Dashboard 共同消费
```

如果这层做成，Alembic 的第一体验会更清楚：Codex 不只是“知道一些 Recipes”，而是能在进入项目时立刻知道自己站在哪个工程区域、上下游是谁、该先读什么、该用什么 Alembic 工具验证。
