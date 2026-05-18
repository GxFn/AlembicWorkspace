# Evolution Framework 统一重设计

> 文件变更 → 进化判断 → 候选提交 → Proposal 合入：全链路梳理与重新设计

**创建日期**: 2026-04-17
**状态**: 设计草案

---

## 目录

**Part I — 现状梳理**
- [1. 现有全链路拓扑](#1-现有全链路拓扑)
- [2. 五条进化触发路径](#2-五条进化触发路径)
- [3. 当前问题诊断](#3-当前问题诊断)

**Part II — 重新设计**
- [4. 设计目标与边界](#4-设计目标与边界)
- [5. 新架构：文件变更处理（路径 1）](#5-新架构文件变更处理路径-1)
- [6. 新架构：增量扫描中的进化前置（路径 2-3）](#6-新架构增量扫描中的进化前置路径-2-3)
- [7. 新架构：候选提交与融合（路径 4）](#7-新架构候选提交与融合路径-4)
- [8. 新架构：确信路径保持不变（路径 5）](#8-新架构确信路径保持不变路径-5)
- [9. 信号驱动的 Proposal 生命周期（不变）](#9-信号驱动的-proposal-生命周期不变)
- [10. MCP 尾部指令驱动的语义融合](#10-mcp-尾部指令驱动的语义融合)
- [11. 全链路数据流（新）](#11-全链路数据流新)
- [12. 涉及文件与改动清单](#12-涉及文件与改动清单)
- [13. 边界情况与链路通路验证](#13-边界情况与链路通路验证)
- [14. 实施顺序与回滚策略](#14-实施顺序与回滚策略)

---

# Part I — 现状梳理

## 1. 现有全链路拓扑

```
                    ┌──────────────────────────────────────────────────┐
                    │              进化框架当前全景                      │
                    └──────────────────────────────────────────────────┘

触发源                    处理层                          决策层                        执行层
─────                    ─────                          ─────                        ─────

IDE 文件事件 ──────→ FileChangeHandler               EvolutionGateway
  renamed             ├ renamed → ContentPatcher        ├ valid → 刷新时间戳
  deleted             ├ deleted → Gateway.submit        ├ update → Proposal
  modified            ├ modified → needs-review         └ deprecate
  created             └ created → skip                      ├ 高置信 → 立即执行 ──→ LifecycleStateMachine
                                                            └ 低置信 → Proposal ──→ 信号驱动评估

Rescan (外部 Agent) ──→ RelevanceAuditor.audit()
  alembic_rescan              └ 4 维证据评分 → classifyRelevance()
                              ├ dead → Gateway(conf=0.95)
                              ├ severe → Gateway(conf=0.6)
                              └ decay → Gateway(conf=0.4)
                          Agent → alembic_evolve
                              ├ propose_evolution → Gateway(update)
                              ├ confirm_deprecation → Gateway(deprecate)
                              └ skip → Gateway(valid)

Rescan (内部 Agent) ──→ 同上 RelevanceAuditor
  alembic_rescan              + fillDimensionsV3 pipeline
                              Evolve Stage → EvolutionGate → Analyze → Produce

新陈代谢 ─────────→ KnowledgeMetabolism.runFullCycle()
  启动 / 信号触发        DecayDetector 6策略 → Gateway(source='metabolism')
                         → 永远走观察窗口（不立即执行）

知识提交 ─────────→ RecipeProductionGateway.create()
  alembic_submit_knowledge    Step 1: UnifiedValidator
                          Step 2: SimilarityCheck（MCP 跳过）
                          Step 3: ConsolidationAdvisor.analyzeBatch()
                              ├ create → 新建 Recipe
                              ├ merge → 创建 update Proposal
                              ├ insufficient → 创建 update Proposal
                              └ reorganize → 静默丢弃（blocked）
                          Step 4: KnowledgeService.create()
                          Step 6: Supersede Proposal（可选）
```

## 2. 五条进化触发路径

### 路径 1: 文件变更事件

```
IDE → FileChangeCollector(5信号源, 3s节流) → HTTP POST → Dispatcher → FileChangeHandler
```

| 事件类型 | 当前处理 | 是否涉及 Agent |
|----------|---------|---------------|
| renamed  | ContentPatcher 自动修复路径，更新 sourceRefs/reasoning | **否** — 纯代码逻辑 |
| deleted  | 全部 sourceRef 失效时 → Gateway.submit(deprecate, conf=0.9) | **否** — 纯代码逻辑 |
| modified | 标记 needs-review，发射 quality signal | **否** — 仅标记 |
| created  | skip | — |

**核心观察**：文件变更处理完全不涉及 Agent，是纯代码路径。deleted 场景走的是"高置信自动执行"。

### 路径 2: 内部 Agent 增量扫描

```
alembic_rescan(internal) → Phase 1-4 分析 → RelevanceAuditor → fillDimensionsV3
  → Evolve Stage (Agent Runtime, EVOLVER_SYSTEM_PROMPT)
    → read_project_file / search_project_code → propose_evolution / confirm_deprecation / skip
  → EvolutionGate (completeness check)
  → Analyze Stage → QualityGate → Produce Stage (新 Recipe)
```

**核心观察**：进化判断和新增生产**在同一 pipeline 中串行**，Agent 先做 evolve，gate 通过后再做 analyze+produce。

### 路径 3: 外部 Agent 增量扫描

```
alembic_rescan(external) → Phase 1-4 分析 → RelevanceAuditor → Mission Briefing
  → 外部 Agent 按维度执行:
    Step 1: alembic_evolve (进化判断)
    Step 2: alembic_submit_knowledge (新增)
    Step 3: alembic_dimension_complete
```

**核心观察**：与内部路径结构一致，但执行者是外部 IDE Agent，工具是 MCP handler。

### 路径 4: 知识提交（候选 Recipe）

```
alembic_submit_knowledge → RecipeProductionGateway.create()
  → UnifiedValidator → ConsolidationAdvisor → KnowledgeService.create()
```

**核心观察**：提交时做融合分析（consolidation），但批内互重叠未被阻止，reorganize 被静默丢弃。

### 路径 5: 确信的自动处理

| 场景 | 置信度 | 执行方式 |
|------|--------|---------|
| RelevanceAuditor dead (score<20) | 0.95 | **立即 deprecated** |
| Agent confirm_deprecation | 0.9 | **立即 deprecated** |
| 文件全删 | 0.9 | **立即 deprecated** |
| renamed | — | **立即修复** (ContentPatcher) |
| KnowledgeMetabolism | 任何 | **永远走观察窗口** |

## 3. 当前问题诊断

### P1: modified 事件是断路的

文件被修改后，FileChangeHandler 仅标记 `needs-review` 并发射 `quality` signal，但：
- **没有消费者**会根据这个 signal 主动触发进化检查
- `needs-review` 标记**只存在于返回值中**，不持久化
- 唯一的消费路径是等用户手动触发 rescan

**后果**：文件修改后，受影响 Recipe 的过时状态可能**长期无感知**，直到下次全量 rescan。

### P2: Rescan 中进化与新增耦合

当前 rescan pipeline 的结构是：

```
[Evolve Stage] → [EvolutionGate] → [Analyze Stage] → [Produce Stage]
```

问题：
- Evolve Stage 对**所有**现有 Recipe 做进化判断（包括 healthy 的）
- Agent 需要对整个维度的 Recipe 逐条验证，即使大部分都是 healthy
- EvolutionGate 只检查"是否全部处理了"，不区分进化质量
- 如果 Evolve Stage 遗漏某条 Recipe（Agent 超时/忘记），Gate 会 retry 整个 Stage

**后果**：进化检查消耗大量 Agent token，但大部分是"确认没变化"的无效工作。

### P3: ConsolidationAdvisor 的盲区

1. **批内互重叠未阻止** — `analyzeBatch()` 计算了 `internalOverlaps[]` 但 RecipeProductionGateway **完全忽略**了它
2. **reorganize 被静默丢弃** — `#createProposalFromAdvice()` 对 reorganize 只记日志，不创建提案
3. **ConsolidationAdvisor 与 RedundancyAnalyzer 算法不统一** — 前者用 3-gram Jaccard，后者用 LCS/4-gram Jaccard，同一对 Recipe 可能得到不同的相似度分数
4. **全量加载已有 Recipe** — 当 category 内不足 20 条时做全库加载（跨域可见性），在 Recipe 数量多时性能堪忧

### P4: ConsolidationAdvisor 不利用 Agent 能力

当前融合分析完全基于**文本特征**（Jaccard 相似度、关键词比对、长度指标），不涉及语义理解：
- `#assessSubstance()` 用长度和关键词判断"实质性"
- `#computeMergeDirection()` 用字符串长度判断"新维度"
- 候选与现有 Recipe 的对比仅靠 4 维 Jaccard

**后果**：
- 两条语义相同但措辞不同的 Recipe 可能被判为"不重叠"
- 一条充实但与现有 Recipe 有不同侧重的候选可能被错误建议为 merge

### P5: 进化提案(Proposal)的信号来源单薄

当前 ProposalExecutor 订阅的 6 类信号 (`guard|search|decay|quality|usage|lifecycle`) 主要来自运行时使用：
- `guard` — Guard 匹配时
- `search` — 搜索命中时
- `usage` — HitRecorder 记录
- `quality` — FileChangeHandler 发射

但 **modified 事件不产生有价值的信号**（仅发射泛化的 `quality` signal，不包含具体影响的字段级信息），导致 observing 状态的 Proposal 无法从文件修改中获取评估证据。

### P6: 缺乏对开发者的交互式进化建议

当文件修改影响了已有 Recipe 时，开发者完全无感知：
- VSCode 扩展当前**没有进化建议弹窗**机制
- 旧的 `notifyFileChanges()` 返回 `FileChangeReport`（含 `suggestReview` 标记），但已被新的 fire-and-forget `reportFileChanges()` 取代
- Dashboard 的 EvolutionPanel 展示 Proposal 列表，但需要开发者**主动打开** Dashboard 才能看到
- 缺乏在**编码上下文中**（IDE 内）即时建议开发者审视受影响 Recipe 的途径

**后果**：进化建议只在 Dashboard 被动等待查看，开发者在编码过程中无法获得"你刚修改的文件影响了某条 Recipe，是否要审视？"这样的即时提示。

---

# Part II — 重新设计

## 4. 设计目标与边界

### 设计目标

1. **文件修改事件产生可操作的影响信息**，而非仅 needs-review 标记
2. **增量扫描中进化前置**：先做进化判断（只针对有问题的 Recipe），通过后剩余的 gap 才是新增
3. **候选提交的融合分析增强**：利用 Agent 语义理解能力或更精确的结构化比对
4. **确信路径保持不变**：高置信自动处理（delete/rename/dead）不改

### 设计边界

- **本轮不改**：确信路径（deleted 自动弃用、renamed 自动修复、dead 立即弃用）
- **本轮不改**：LifecycleStateMachine、EvolutionPolicy、ProposalExecutor 信号驱动机制
- **本轮不改**：状态机六态定义和转移表
- **聚焦**：非确信的进化/衰减路径的触发、分析、候选处理

---

## 5. 新架构：文件变更处理（路径 1）

### 5.1 现状问题与基础设施缺口

**现状问题**：`modified` 事件处理几乎无效，仅设置 `ReactiveEvolutionReport.needsReview` 计数，`#emitSignals()` 发射的 `quality` signal 只含 `{ reason: 'reactive_needs_review', needsReview, affectedRecipes }`，不含影响级别 / 文件路径 / 事件来源，下游无法做差异化处理。

**基础设施缺口**（实现前必须先解决）：

| # | 缺口 | 位置 | 本轮改动 |
|---|------|------|---------|
| I1 | HTTP 路由 `POST /api/v1/file-changes` 当前是 fire-and-forget，响应体仅 `{ success: true }`，FileChangeHandler 返回的 `ReactiveEvolutionReport` 被丢弃 | `lib/http/routes/file-changes.ts` | 改为在响应中回传 `ReactiveEvolutionReport`（Dispatcher 完成 handler 后同步返回）|
| I2 | `FileChangeEvent` payload 无 `eventSource` 字段，IDE 编辑 / Git HEAD Diff / Working Tree Diff 三类来源混同 | `lib/types/file-change.ts` + VSCode `FileChangeCollector.ts` | payload 新增 `eventSource: 'ide-edit' \| 'git-head' \| 'git-worktree'`，FileChangeHandler 透传到 report |
| I3 | `ReactiveEvolutionReport` 类型无 `eventSource` 字段 | `lib/types/reactive-evolution.ts` | 类型补齐（对应 §5.4.5 数据流）|
| I4 | `apiClient.ts` 的 `reportFileChanges()` 返回 `void` | `resources/vscode-ext/src/apiClient.ts` | 改为 `Promise<ReactiveEvolutionReport \| null>`（null = 服务端降级）|
| I5 | `FileChangeHandler` 的 `modified` 分支无 impactLevel 计算 | `lib/service/evolution/FileChangeHandler.ts` | 新增 `#analyzeModifiedImpact()`（见 §5.3）|

> **为何不走 Dashboard 轮询方案**：轮询增加 ≥10s 延迟，失去"刚编辑完"的上下文优势。FileChangeHandler 是纯代码路径（毫秒级，无 Agent 调用），且 FileChangeCollector 侧已有 3s throttle，同步 HTTP 响应的阻塞可接受。

### 5.2 设计方案：modified 事件产生结构化影响摘要

**核心思路**：modified 事件到达时，做**轻量级影响分析**，产出结构化的"影响摘要"持久化为 signal，供 Proposal 评估和 rescan 前置过滤消费。

```
FileChangeHandler.#handleModified(path, report)
  │
  ├── 现有: sourceRefRepo.findBySourcePath(path) → 有/无关联 Recipe
  │
  ├── 新增: 对每个受影响的 Recipe:
  │     1. 读取 Recipe 的 sourceRefs、coreCode、content.markdown
  │     2. 计算影响级别:
  │        - coreCode 中引用的符号/路径是否包含该文件 → impactLevel: 'direct'
  │        - 仅 reasoning.sources 包含 → impactLevel: 'reference'
  │        - 仅 trigger 匹配 → impactLevel: 'pattern'
  │     3. 发射结构化 signal:
  │        signalBus.send('quality', 'FileChangeHandler', weight, {
  │          target: recipeId,
  │          metadata: {
  │            reason: 'source_modified',
  │            modifiedPath: path,
  │            impactLevel: 'direct' | 'reference' | 'pattern',
  │          }
  │        })
  │
  └── 效果:
       - observing Proposal 可消费此 signal 做评估
       - rescan 前置过滤可读取"有哪些 Recipe 最近受到文件修改影响"
       - 不需要 Agent 参与，纯代码分析
```

### 5.3 影响级别权重与计算规则

| impactLevel | signal weight | 计算规则 |
|-------------|---------------|---------|
| `direct`    | 0.7 | 改动的文件路径 ∈ `Recipe.sourceRefs`（精确匹配）**或** `coreCode` 中显式出现（路径字符串 / 符号全名）|
| `reference` | 0.4 | 改动的文件路径 ∈ `Recipe.reasoning.sources` 但不在 sourceRefs / coreCode 中 |
| `pattern`   | 0.2 | 文件相对路径 / 文件名命中 `Recipe.trigger` 的 glob 或关键词，但无显式引用 |

**计算入口**：新增 `FileChangeHandler.#analyzeModifiedImpact(path, recipe): 'direct' | 'reference' | 'pattern'`。

**查询路径**：通过 `SourceRefRepository.findBySourcePath(path)` 拿到关联 Recipe；对这些 Recipe 按 coreCode → reasoning.sources → trigger 顺序判定，**首次命中即返回**，无需全库扫描。

**防御性兜底**：SourceRefRepository 命中但三条规则都不命中 → 降级为 `pattern`（0.2）。

### 5.4 VSCode 弹窗进化建议

当 modified 事件影响了已有 Recipe 且 `impactLevel = 'direct'` 时，通过 HTTP 响应将影响摘要返回给 VSCode 扩展，扩展展示**两按钮弹窗**引导开发者即时触发进化处理。

> **弹窗策略 C: 按影响严重度弹窗，而非数量**
>
> 弹窗频率由"关联紧密度"决定：`direct` 才弹，`reference`/`pattern` 只发 signal。
> 即使只有 1 条 Recipe 被 direct 影响也弹 —— 因为 coreCode/sourceRefs 直接引用的文件被改是强信号。

#### 5.4.1 触发条件

仅当**同时满足**以下条件时弹出：
- `impactLevel = 'direct'`（coreCode/sourceRefs 直接引用的文件被改）
- 受影响 Recipe 处于 `active` 状态（不对 staging/deprecated 弹窗）
- 距上次对同一 Recipe 弹窗 > 10 分钟（防骚扰节流）
- **事件来源为 IDE 编辑保存**（Signal 1-3），**非 git 批量事件**

**不弹窗的场景**：

| 场景 | 原因 | 处理 |
|------|------|------|
| `impactLevel = 'reference'` / `'pattern'` | 关联太松散，弹出是噪音 | 只发 signal，不弹窗 |
| Git HEAD Diff（Signal 4: commit/pull/switch） | 一次性大量文件变化，弹窗轰炸 | 只发 signal + Dashboard 汇总展示 |
| Working Tree Diff（Signal 5: 窗口聚焦/定时） | 批量扫描，非即时编辑上下文 | 只发 signal + Dashboard 汇总展示 |
| Recipe 处于 staging/deprecated | 不值得打断开发者 | 只发 signal |

#### 5.4.2 弹窗设计

**单条 Recipe 被影响**：

```
┌────────────────────────────────────────────────────────────────┐
│  ⚡ Alembic: 1 Recipe(s) auto-fixed, 1 deprecated,            │
│     2 Recipe(s) may need review. Review affected Recipes?      │
│                                                                │
│  ┌───────────────┐  ┌──────────────────────────┐               │
│  │  Ask Copilot   │  │  Run alembic evolve-check    │               │
│  └───────────────┘  └──────────────────────────┘               │
└────────────────────────────────────────────────────────────────┘
```

**多条 Recipe 被影响**（折叠）：

```
┌────────────────────────────────────────────────────────────────┐
│  ⚡ Alembic: 5 Recipe(s) may need review.                      │
│     Review affected Recipes?                                   │
│                                                                │
│  ┌───────────────┐  ┌──────────────────────────┐               │
│  │  Ask Copilot   │  │  Run alembic evolve-check    │               │
│  └───────────────┘  └──────────────────────────┘               │
└────────────────────────────────────────────────────────────────┘
```

#### 5.4.3 按钮行为

| 按钮 | 行为 | 实现 |
|------|------|------|
| **Ask Copilot** | 构建 evolve prompt → 打开 IDE Copilot Chat 并填充 prompt → 外部 Agent 通过 MCP `alembic_evolve` 执行进化 | `buildEvolvePrompt(report)` → `vscode.commands.executeCommand('workbench.action.chat.open', { query: prompt })` |
| **Run alembic evolve-check** | 打开终端执行 `alembic evolve-check --recipes <ids>` → 走内部 Agent 进化逻辑 | `vscode.window.createTerminal('Alembic Evolve')` → `terminal.sendText('alembic evolve-check --recipes r1,r2,r3')` |

**两条路径的对比**：

| 方面 | Ask Copilot（外部 Agent） | Run alembic evolve-check（内部 Agent） |
|------|--------------------------|-----------------------------------|
| **执行者** | IDE Copilot/Cursor Agent | 内置 Agent Runtime |
| **进化工具** | MCP `alembic_evolve`（propose/confirm/skip） | 内部 AgentRuntime + EVOLVER_SYSTEM_PROMPT |
| **交互性** | Agent 可以向用户确认、读代码、多轮对话 | 全自动，结果输出到终端 |
| **Token 来源** | 用户的 IDE Agent 额度 | 本地 LLM / 配置的 API key |
| **适合场景** | 想要交互式审视、理解变更影响 | 想要快速批量处理、不需要人工介入 |

#### 5.4.4 `buildEvolvePrompt(report)` 构建逻辑

```typescript
function buildEvolvePrompt(report: FileChangeReport): string {
  const recipeIds = report.details
    .filter(d => d.action === 'needs-review' || d.action === 'deprecate')
    .map(d => d.recipeId);

  const lines = [
    '以下 Recipe 可能受到文件变更影响，请逐条审视并决定进化操作：',
    '',
    ...report.details.map(d =>
      `- 「${d.recipeTitle}」(${d.recipeId}): ${d.reason}`
    ),
    '',
    '请对每条 Recipe 调用 alembic_evolve 工具：',
    '- 如果 Recipe 内容仍然准确 → skip',
    '- 如果需要更新以反映代码变化 → propose_evolution',
    '- 如果 Recipe 已完全失效 → confirm_deprecation',
  ];

  return lines.join('\n');
}
```

#### 5.4.5 数据流

```
VSCode Extension (FileChangeCollector)
  │  事件采集时标记 eventSource:
  │    workspace.onDidRename/Delete/Create → 'ide-edit'
  │    workspace.onDidSaveTextDocument     → 'ide-edit'
  │    Git HEAD diff (commit/pull/switch)  → 'git-head'
  │    Working Tree diff (focus/timer)     → 'git-worktree'
  │
  └── POST /api/v1/file-changes  { events: [{ path, type, eventSource, ... }] }
          │
          ▼
     FileChangeDispatcher → FileChangeHandler
          │
          ├── #handleModified(path, event.eventSource):
          │     ├── 对每个受影响 Recipe → #analyzeModifiedImpact() → impactLevel
          │     ├── SignalBus.send('quality', ..., weight, {
          │     │     target: recipeId,
          │     │     metadata: { reason: 'source_modified', modifiedPath, impactLevel, eventSource }
          │     │   })
          │     └── 累积到 ReactiveEvolutionReport.details[].impactLevel
          │
          └── 返回 ReactiveEvolutionReport {
                needsReview, suggestReview, deprecated, fixed, details,
                eventSource                                // ← I3 新增字段（取 events 中出现最多的来源）
              }
                │
                ▼
        HTTP 200 + body = ReactiveEvolutionReport          // ← I1 改造：不再 fire-and-forget
                │
                ▼
  apiClient.reportFileChanges() → Promise<ReactiveEvolutionReport | null>  // ← I4
                │
                ▼
  FileChangeCollector.#onReport(report)
      │
      ├── if (report.eventSource !== 'ide-edit')      → return（git 批量不弹窗）
      ├── if (!report.suggestReview || report.needsReview === 0) → return
      ├── if (details 中存在 impactLevel === 'direct')    → 通过严重度过滤
      │     else                                          → return（只有 reference/pattern 不弹窗）
      ├── 节流检查：对每个 direct Recipe 的 lastPopupTime > 10 分钟才允许弹窗
      │
      └── vscode.window.showInformationMessage(
            buildMessage(report),
            'Ask Copilot', 'Run alembic evolve-check'
          ).then(choice => { ... })
```

**降级策略**：如果 HTTP 响应体解析失败 / 返回 null → 扩展侧静默跳过弹窗（不影响事件采集主链路，signal 仍已在服务端发射）。

#### 5.4.6 防骚扰机制

- **严重度过滤**：仅 `direct` 弹窗，`reference` / `pattern` 只发 signal
- **来源过滤**：仅 IDE 编辑事件（Signal 1-3）弹窗，git 批量事件（Signal 4-5）不弹窗
- **节流**：对同一 Recipe 的弹窗间隔 ≥ 10 分钟（扩展侧维护 `lastPopupTime` Map）
- **批量折叠**：同一 flush 周期内多条 direct 影响 → 折叠为一条弹窗，两个按钮行为不变（Ask Copilot 的 prompt 包含所有受影响 Recipe，evolve-check 传入所有 recipeId）
- **不弹窗时的 fallback**：被过滤的事件仍然发射 signal → Dashboard 汇总展示 → 用户可在 Dashboard 中手动处理

### 5.5 不变的部分

- renamed → ContentPatcher 自动修复（不变）
- deleted → 全失效时 Gateway.submit(deprecate, 0.9)（不变）
- created → skip（不变）

---

## 6. 新架构：增量扫描中的进化前置（路径 2-3）

### 6.1 核心设想

> **如果增量扫描前置了进化判断，后续的处理就只是新增 Recipe。**

当前 rescan pipeline：

```
对每个维度 (有现有 Recipe):
  Evolve Stage (对所有 Recipe 逐条验证) → EvolutionGate → Analyze → Produce
```

问题：
- Agent 需要验证**所有** Recipe（包括 healthy 的），大量 token 浪费
- Evolve 和 Produce 在同一 pipeline 中串行，进化判断的结果影响 Produce 的行为

### 6.2 新设计：两阶段分离

```
Phase A: 进化前置（在 pipeline 外、维度循环前执行）
  ├── 输入: RelevanceAuditor 的 audit 结果 + 文件修改影响摘要
  ├── 过滤: 只对 decay/severe/watch+impacted 的 Recipe 做进化判断
  ├── 执行: Agent 验证（内部/外部）
  ├── 输出: 进化决策已确定（skip/propose/deprecate），gap 位明确
  └── 效果: 腾出的 gap 位 = 需要新增的位数

Phase B: 纯新增（维度 pipeline，简化版）
  ├── 输入: 明确的 gap 数量（= 目标覆盖 - 健康 Recipe 数）
  ├── 不再有 Evolve Stage / EvolutionGate
  ├── 只有: Analyze → QualityGate → Produce → RejectionGate
  └── 效果: 每个维度的 pipeline 更简单、更快
```

### 6.3 Phase A 的候选过滤策略

**当前**：Agent 验证维度内所有 Recipe（无论健康与否）。

**新设计**：只对以下 Recipe 做进化验证：

| 条件 | 来源 | 是否需要 Agent |
|------|------|---------------|
| RelevanceAuditor verdict = `decay` (score 40-59) | audit 结果 | **是** — Agent 读代码验证 |
| RelevanceAuditor verdict = `severe` (score 20-39) | audit 结果 | **是** — Agent 读代码确认 |
| 近期有 `source_modified` signal（impactLevel=direct） | 文件变更 signal | **是** — Agent 读代码验证变化 |
| RelevanceAuditor verdict = `watch` + 近期有修改 signal | 交叉信号 | **是** — Agent 验证是否仍然准确 |

**以下不需要 Agent 验证**：

| 条件 | 处理 |
|------|------|
| verdict = `healthy` 且无修改 signal | 自动 skip（刷新 lastVerifiedAt） |
| verdict = `dead` (score < 20) | 已被 RelevanceAuditor 直接 deprecated |

**预期收益**：
- 如果 80% 的 Recipe 是 healthy 无修改，Agent 只需要验证 20%
- Token 消耗大幅降低
- Evolve Stage 不再需要"遍历全部 Recipe"

### 6.4 Phase A 对内部/外部 Agent 的统一接口

> **术语澄清**：本文档前文出现的 `EvolutionGate` 并不是服务端的 `EvolutionGateway`。前者是 pipeline 内的 Stage（做完备性检查），后者是进化请求的路由器（dispatcher，不做过滤）。两者职责不同，本节以下严格使用 "pipeline EvolutionStage" 指代维度 pipeline 内的进化阶段，用 "EvolutionGateway" 指代服务端路由器。

**内部 Agent (fillDimensionsV3)**：

```
pipeline stages:
  旧: [Evolve, EvolutionGate, Analyze, QualityGate, Produce, RejectionGate]
  新: [Analyze, QualityGate, Produce, RejectionGate]  ← 所有维度统一，不再区分"有/无现有 Recipe"

进化判断已在 Phase A 完成，pipeline 启动前 gap 数已明确。
```

**外部 Agent (Mission Briefing)**：

```
旧 workflow:
  Step 1 — alembic_evolve: 对本维度 Recipe 逐条验证
  Step 2 — alembic_submit_knowledge: 补齐新模式
  Step 3 — alembic_dimension_complete

新 workflow:
  Step 0 — 预处理（框架自动执行，不需要 Agent 参与）:
    - healthy + 无修改 → 自动 skip
    - dead → 已 deprecated
  Step 1 — alembic_evolve: 只对筛选出的候选 Recipe 做验证（数量大幅减少）
  Step 2 — alembic_submit_knowledge: 补齐 gap
  Step 3 — alembic_dimension_complete
```

### 6.5 进化前置的数据结构

```typescript
interface EvolutionPrescreen {
  /** 需要 Agent 验证的 Recipe 列表 */
  needsVerification: Array<{
    recipeId: string;
    title: string;
    dimension: string;
    relevanceVerdict: 'decay' | 'severe' | 'watch';
    relevanceScore: number;
    auditHint: string;           // 来自 RelevanceAuditor
    recentModifications: Array<{ // 来自文件变更 signal
      path: string;
      impactLevel: 'direct' | 'reference' | 'pattern';
      timestamp: number;
    }>;
  }>;

  /** 已自动处理的 Recipe（不需要 Agent） */
  autoResolved: Array<{
    recipeId: string;
    resolution: 'auto-skip' | 'auto-deprecated';
    reason: string;
  }>;

  /** 各维度的明确 gap 数（扣除 healthy + 正在观察的） */
  dimensionGaps: Record<string, {
    target: number;
    healthy: number;
    observing: number;
    gap: number;
  }>;
}
```

---

## 7. 新架构：候选提交与融合（路径 4）

### 7.1 现状问题回顾

1. ConsolidationAdvisor 纯文本特征分析，无语义理解能力
2. 批内互重叠 `internalOverlaps[]` 被 RecipeProductionGateway 忽略
3. reorganize 被静默丢弃
4. ConsolidationAdvisor 与 RedundancyAnalyzer 算法不统一

### 7.2 设计思路：分层融合

候选提交的融合分析分为两层：

```
Layer 1: 结构化快速过滤（代码逻辑，无 Agent）
  ├── Fingerprint 精确去重（title/trigger/coreCode hash）
  ├── 批内互重叠检测 + 阻止（使用 internalOverlaps 结果）
  └── 结构相似度快速筛查（统一算法，替代双路径）

Layer 2: 语义融合分析（需要 Agent 或 LLM）
  ├── 候选 vs 现有 Recipe 的语义比对
  ├── merge/insufficient/reorganize 的判断
  └── 生成结构化的 merge patch（而非仅建议）
```

### 7.3 Layer 1: 结构化快速过滤（改进）

#### 7.3.1 统一相似度算法

当前 ConsolidationAdvisor 和 RedundancyAnalyzer 各自实现了相似度计算。
新设计提取为共享的 `RecipeSimilarity` 工具类：

```typescript
class RecipeSimilarity {
  /** 4 维加权相似度（统一算法） */
  static compute(a: RecipeLike, b: RecipeLike): number {
    const d1 = jaccard(extractTopicWords(a.title), extractTopicWords(b.title));
    const d2 = jaccard(tokenize(a.doClause + a.dontClause), tokenize(b.doClause + b.dontClause));
    const d3 = codeDistance(a.coreCode, b.coreCode);  // 统一用 3-gram Jaccard
    const d4 = a.trigger === b.trigger ? 1.0 : 0.0;
    return 0.2 * d1 + 0.3 * d2 + 0.3 * d3 + 0.2 * d4;
  }
}
```

ConsolidationAdvisor 和 RedundancyAnalyzer 都调用此共享实现。

#### 7.3.2 批内互重叠阻止

当前 `internalOverlaps[]` 被计算但忽略。新设计：

```typescript
// RecipeProductionGateway.create() Step 3 新逻辑
const batchResult = await consolidationAdvisor.analyzeBatch(candidates);

// 新增: 处理批内互重叠
for (const overlap of batchResult.internalOverlaps) {
  if (overlap.similarity >= 0.65) {
    // 从 submittableItems 中移除较弱的一条
    const weaker = pickWeaker(overlap.candidateA, overlap.candidateB);
    submittableItems.delete(weaker);
    result.duplicates.push({
      item: weaker,
      similarTo: [{ title: stronger.title, similarity: overlap.similarity }],
      reason: 'batch-internal-overlap',
    });
  }
}
```

#### 7.3.3 reorganize 不再静默丢弃

当前 reorganize 建议直接返回 null → 候选进入 `blocked[]`。
新设计：reorganize 转为多条 `merge` 建议：

```typescript
// #createProposalFromAdvice() — reorganize 分支
case 'reorganize':
  // 拆分为多条 merge 建议，每条对应一个目标 Recipe
  for (const targetId of advice.coveredBy) {
    await this.#evolutionGateway?.submit({
      recipeId: targetId,
      action: 'update',
      source: 'consolidation',
      confidence: 0.5,  // 较低置信，需要观察
      description: `Reorganize: 候选 "${item.title}" 的部分内容建议并入`,
      evidence: [{ candidateContent: item, targetRecipeId: targetId }],
    });
  }
  break;
```

### 7.4 Layer 2: 语义融合分析（新增）

**核心问题**：当前融合分析**完全基于文本特征**，无法捕捉语义相似性。

**关键设计决策**：Layer 2 的语义融合不在服务端内部启动新 Agent，而是**利用已有 Agent 能力** —— 内部 Agent 通过 pipeline ConsolidationGate 执行，外部 Agent 通过 **MCP 尾部指令**让调用者在提交完成后执行融合分析。

#### 7.4.1 内部 Agent 路径：ConsolidationGate（pipeline 内）

在增量扫描的 Produce Stage 之后新增 **Consolidation Gate**：

```
[Analyze] → [QualityGate] → [Produce] → [ConsolidationGate] → [RejectionGate]
                                                │
                                    Agent 读取候选 + 现有 Recipe
                                    判断: create / merge / split
                                    输出结构化 patch
```

**ConsolidationGate** 使用 Agent Runtime：
- System prompt: 融合分析专家，读取候选内容 + 相关现有 Recipe
- 工具: `merge_into_existing`（生成 patch）、`approve_create`（确认新建）、`reject_candidate`（拒绝）
- 预算: maxIterations=5（比 Evolve Stage 更轻量）

内部 Agent 的特点：
- 每条候选逐条走 `submit_knowledge` tool → 单独经过 Gateway
- Pipeline 级别 `bootstrapDedup` 做跨维度快速去重
- **不跳过**向量相似度检测（`skipSimilarityCheck: false`）
- 系统自动注入 `language`, `category`, `knowledgeType`, `source`, `tags`
- ConsolidationGate 在 pipeline 内已有 Agent Runtime，增量 token 成本低

#### 7.4.2 外部 Agent 路径：MCP 尾部指令驱动融合（详见 §10）

对于外部 Agent（IDE Agent 通过 MCP 调用 `alembic_submit_knowledge`），**不在服务端启动新 Agent**，而是：

1. Gateway 完成 Layer 1 快速过滤 + 增强型结构化分析
2. 如果发现**疑似重叠但无法确定**的情况（结构相似度 0.4-0.65，字段级分析不确定），标记为 `pendingSemanticReview`
3. MCP 响应中通过**尾部指令**（`nextAction`）让外部 Agent 执行语义融合

这样做的核心理由：
- 外部 Agent（如 Copilot/Cursor）**已经在运行**，具备完整的代码阅读和语义理解能力
- 比服务端内部启动 Agent Runtime 更高效 —— 复用已有 Agent 上下文
- 外部 Agent 可以读取项目代码做真正的语义比对，而非仅靠文本特征

#### 7.4.3 增强型结构化分析（Layer 1.5，两条路径共用）

无论内部还是外部路径，ConsolidationAdvisor 都增强为字段级分析：

```typescript
// ConsolidationAdvisor.analyze() 增强
async analyze(candidate, options): Promise<ConsolidationAdvice> {
  // Layer 1: 现有 4 维 Jaccard（快速过滤）
  const structuralOverlaps = this.#computeOverlaps(candidate, related);

  // Layer 1.5: 字段级语义比对
  if (structuralOverlaps.some(o => o.similarity >= 0.4)) {
    for (const overlap of structuralOverlaps.filter(o => o.similarity >= 0.4)) {
      overlap.fieldAnalysis = {
        triggerConflict: isTriggerConflict(candidate.trigger, overlap.recipe.trigger),
        doClauseSubset: isSubsetOf(candidate.doClause, overlap.recipe.doClause),
        coreCodeOverlap: extractSharedPatterns(candidate.coreCode, overlap.recipe.coreCode),
        categoryMatch: candidate.category === overlap.recipe.category,
      };
    }
  }

  // 基于 fieldAnalysis 做更精确的决策
  // 对于高置信的判断 (≥0.65 或 fieldAnalysis 明确)  → 直接 create/merge/reorganize
  // 对于低置信的判断 (0.4-0.65 且 fieldAnalysis 不确定) → 标记 pendingSemanticReview
}
```

字段级分析增加的维度：
- `triggerConflict` — trigger 是否语义冲突（同一 kebab 命名空间下）
- `doClauseSubset` — 候选的 doClause 是否是现有的子集（→ merge）
- `coreCodeOverlap` — 提取共享代码模式（→ 判断是否同一知识的不同表达）
- `categoryMatch` — 同 category 下的重叠更可能是 merge

### 7.5 内部 Agent vs 外部 Agent 提交路径对比

#### 7.5.1 当前差异

| 方面 | 外部 Agent (MCP) | 内部 Agent (Pipeline) |
|------|-----------------|----------------------|
| **source 标识** | `'mcp-external'` | `'agent-tool'` |
| **向量相似度检测** | 跳过 (`skipSimilarityCheck: true`) | 开启 (`false`) |
| **Consolidation** | 默认开启 | Bootstrap 时开启，单条时跳过 |
| **去重机制** | `existingTitles`（session 标题集） | `bootstrapDedup`（内存指纹快速去重）|
| **字段注入** | Agent 需自行提供所有字段 | 系统自动注入 `language`, `category` 等 |
| **限流** | 有 (`checkRecipeSave`) | 无 |
| **批量方式** | `items[]` 数组一次传入 Gateway | 逐条调用 `submit_knowledge` tool |

#### 7.5.2 新设计：四象限提交策略

| 场景 | Layer 1 | Layer 1.5 | Layer 2 | 融合执行者 |
|------|---------|-----------|---------|------------|
| **内部 Agent · 单条** (pipeline produce) | fingerprint + 向量相似度 | 字段级分析 | ConsolidationGate (Agent) | 内部 Agent Runtime |
| **内部 Agent · 批量** (pipeline batch) | 批内互重叠阻止 + 向量相似度 | 字段级分析 | ConsolidationGate (Agent) | 内部 Agent Runtime |
| **外部 Agent · 单条** (`alembic_submit_knowledge`) | fingerprint + 结构相似度 | 字段级分析 | MCP 尾部指令 → Agent 语义比对 | 外部 Agent (IDE) |
| **外部 Agent · 批量** (`alembic_submit_knowledge items[]`) | 批内互重叠阻止 + 结构相似度 | 字段级分析 | MCP 尾部指令 → Agent 语义比对 | 外部 Agent (IDE) |

#### 7.5.3 内部 Agent 路径的流程

```
Pipeline Produce Stage
  → submit_knowledge tool (lifecycle.ts)
    → RecipeProductionGateway.create({
        source: 'agent-tool',
        skipSimilarityCheck: false,
        systemInjectedFields: { language, category, ... }
      })
    → Layer 1: fingerprint + 向量相似度
    → Layer 1.5: 字段级分析
    → Recipe 创建完成
  → ConsolidationGate (pipeline stage)
    → Agent 读取新 Recipe + 相关现有 Recipe
    → 语义比对 → merge_into_existing / approve_create / reject_candidate
```

#### 7.5.4 外部 Agent 路径的流程

```
外部 Agent 调用 alembic_submit_knowledge({ items: [...] })
  → consolidated.enhancedSubmitKnowledge()
    → RecipeProductionGateway.create({
        source: 'mcp-external',
        skipSimilarityCheck: true,
      })
    → Layer 1: fingerprint + 结构相似度 + 批内互重叠阻止
    → Layer 1.5: 字段级分析
    → Recipe 创建完成
  → MCP 响应:
    {
      data: {
        created: [...],
        rejected: [...],
        pendingSemanticReview: [        // ← 新增字段
          { recipeId, title, overlaps: [{ existingId, existingTitle, similarity, fieldAnalysis }] }
        ],
      },
      // ← 尾部指令（详见 §10）
      nextAction: {
        tool: 'alembic_consolidate',        // 新 MCP tool
        args: { reviewItems: [...] },
        required: false,                // 建议执行但不强制
        reason: '发现疑似重叠 Recipe，建议你阅读代码后判断是否需要合并',
      }
    }
  → 外部 Agent 收到尾部指令 → 调用 alembic_consolidate
    → Agent 读取代码 + 比对 → 提交合并决策
```

---

## 8. 新架构：确信路径保持不变（路径 5）

本轮不改动任何高置信自动处理路径：

| 场景 | 置信度 | 处理方式 | 变更 |
|------|--------|---------|------|
| deleted 全失效 | 0.9 | Gateway → 立即 deprecated | **不变** |
| renamed | — | ContentPatcher 自动修复 | **不变** |
| RelevanceAuditor dead | 0.95 | Gateway → 立即 deprecated | **不变** |
| Agent confirm_deprecation | 0.9 | Gateway → 立即 deprecated | **不变** |
| KnowledgeMetabolism | 任何 | 永远走观察窗口 | **不变** |

EvolutionPolicy 的阈值、LifecycleStateMachine 的转移逻辑、ProposalExecutor 的信号驱动评估 —— 全部保持现状。

---

## 9. 信号驱动的 Proposal 生命周期（不变）

### 9.1 新增 signal 类型

当前 Proposal 的信号来源：

| signal | 来源 | 含义 |
|--------|------|------|
| guard | Guard 匹配 | Recipe 被使用 |
| search | 搜索命中 | Recipe 被检索 |
| decay | DecayDetector | 衰退检测 |
| quality | FileChangeHandler | 文件变更质量 |
| usage | HitRecorder | 使用统计 |
| lifecycle | LifecycleStateMachine | 状态转移 |

新设计中 `quality` signal 携带更多信息（见 §5.2），使得 ProposalExecutor 在 `#evaluateOnSignal()` 中可以做出更精确的评估：

```typescript
// ProposalExecutor.#evaluateOnSignal() 增强
if (signal.metadata?.reason === 'source_modified' && signal.metadata?.impactLevel === 'direct') {
  // 源文件被直接修改 → 增加 update proposal 的紧迫性
  // 或对 deprecate proposal 做额外验证
}
```

### 9.2 与进化前置的协同

Phase A 进化前置中 Agent 做出的决策（skip/propose/deprecate）直接通过 EvolutionGateway 提交，后续的 Proposal 生命周期由信号驱动，不变。

关键改变是：**进化前置减少了"无效 skip"的数量**。当前 Agent 需要对所有 Recipe 做验证并 skip healthy 的，新设计中 healthy 的直接自动 skip，Agent 只处理有问题的。

---

## 10. MCP 尾部指令驱动的语义融合

### 10.1 设计动机

当前系统已有多种 MCP 响应中的后续指令模式（参见现有代码）：

| 模式 | 示例位置 | 结构 |
|------|---------|------|
| `nextAction` | `task.ts` close → `alembic_guard` | `{ tool, args, required, reason }` |
| `nextActions` | `dimension-complete-external.ts` | `[{ action, tool, auto, prompt }]` |
| `nextSteps` | `bootstrap-internal.ts` | 自然语言文本数组 |
| `executionPlan.workflow` | `rescan-external.ts` | 嵌入式工作流描述 |
| `evidenceHints._note` | `dimension-complete` | 跨维度上下文提示 |

这些模式是**临时性(ad-hoc)的**，没有统一规范。新设计采用已被验证的 `nextAction` 结构化模式来实现语义融合的 Agent 委托。

### 10.2 核心思路

> 服务端完成 Layer 1 + Layer 1.5 的快速过滤和结构化分析后，如果存在**无法确定的疑似重叠**，不在服务端启动新 Agent，而是通过 MCP 尾部指令**委托外部 Agent 执行语义融合**。

外部 Agent 的优势：
1. **已在运行** — 无需额外启动成本
2. **具备项目上下文** — 可读取源代码做真正的语义比对
3. **交互能力** — 可以向用户确认不确定的合并决策
4. **资源隔离** — 服务端保持轻量，复杂分析由 Agent 侧完成

### 10.3 新 MCP 工具：`alembic_consolidate`

尾部指令将引导 Agent 调用新的 `alembic_consolidate` 工具：

```typescript
// MCP tool: alembic_consolidate
interface ConsolidateRequest {
  /** 需要语义审查的候选列表 */
  reviewItems: Array<{
    /** 新创建的 Recipe ID */
    newRecipeId: string;
    /** 疑似重叠的现有 Recipe */
    overlaps: Array<{
      existingRecipeId: string;
      similarity: number;
      fieldAnalysis: FieldAnalysis;
    }>;
  }>;
  /** Agent 的决策 */
  decisions: Array<{
    newRecipeId: string;
    action: 'keep' | 'merge' | 'reject';
    mergeTargetId?: string;       // action=merge 时必填
    mergeStrategy?: 'absorb' | 'complement';  // absorb=完全吸收, complement=补充新维度
    reasoning: string;            // Agent 解释决策原因
  }>;
}
```

**Agent 工作流（当收到尾部指令时）**：

```
Agent 收到 nextAction: { tool: 'alembic_consolidate', args: { reviewItems } }
  │
  ├── Step 1: 阅读 reviewItems 中每个新 Recipe 的内容
  ├── Step 2: 阅读每个疑似重叠的现有 Recipe 的内容
  ├── Step 3: 读取相关源文件（sourceRefs）做上下文比对
  ├── Step 4: 判断每对重叠是否真正重复/可合并/应保留
  └── Step 5: 调用 alembic_consolidate 提交决策
```

**服务端处理 `alembic_consolidate` 请求**：

```
alembic_consolidate handler
  │
  ├── action = 'keep'   → 无操作（Recipe 保留原样）
  ├── action = 'merge'  → EvolutionGateway.submit({
  │     recipeId: mergeTargetId,
  │     action: 'update',
  │     source: 'agent-consolidation',
  │     confidence: 0.8,  // Agent 明确判断，置信度较高
  │     evidence: { newRecipeContent, mergeStrategy, reasoning }
  │   }) + deprecate newRecipeId
  └── action = 'reject' → LifecycleStateMachine.transition(newRecipeId, 'deprecated')
```

### 10.4 尾部指令的触发条件

**不是所有提交都会触发尾部指令**。只在以下情况：

| 条件 | 触发尾部指令 |
|------|-------------|
| 所有候选 Layer 1 明确去重（similarity ≥ 0.65） | **否** — 已自动处理 |
| 所有候选 Layer 1.5 明确新建（similarity < 0.4 或字段分析确认不同） | **否** — 直接创建 |
| 存在 similarity 0.4-0.65 且字段分析不确定的候选 | **是** — 需要 Agent 语义判断 |
| 候选触发了 reorganize 建议 | **是** — reorganize 需要更深入的语义理解 |

### 10.5 MCP 响应结构示例

```typescript
// alembic_submit_knowledge 响应（含尾部指令）
{
  success: true,
  message: '已创建 3 条 Recipe，其中 1 条存在疑似重叠，建议执行语义融合分析',
  data: {
    created: [
      { id: 'r1', title: 'Recipe A', status: 'staging' },
      { id: 'r2', title: 'Recipe B', status: 'staging' },
      { id: 'r3', title: 'Recipe C', status: 'staging' },
    ],
    rejected: [],
    pendingSemanticReview: [
      {
        newRecipeId: 'r2',
        newRecipeTitle: 'Recipe B',
        overlaps: [{
          existingId: 'existing-42',
          existingTitle: '现有 Recipe X',
          similarity: 0.52,
          fieldAnalysis: {
            triggerConflict: false,
            doClauseSubset: true,    // ← 可能是子集
            coreCodeOverlap: 0.6,
            categoryMatch: true,
          },
          hint: 'doClause 可能是现有 Recipe 的子集，建议阅读代码确认',
        }],
      },
    ],
  },
  // 尾部指令
  nextAction: {
    tool: 'alembic_consolidate',
    args: {
      reviewItems: [
        {
          newRecipeId: 'r2',
          overlaps: [{ existingRecipeId: 'existing-42', similarity: 0.52, /* ... */ }],
        },
      ],
    },
    required: false,
    reason: '发现 Recipe B 与现有 Recipe X 存在疑似重叠（相似度 52%，doClause 可能是子集）。'
      + '建议你阅读相关源代码后，调用 alembic_consolidate 判断是否需要合并。',
  },
}
```

### 10.6 与内部 Agent 路径的对比

| 方面 | 内部 Agent (Pipeline) | 外部 Agent (MCP) |
|------|----------------------|------------------|
| **融合执行者** | ConsolidationGate（pipeline stage） | 外部 Agent + `alembic_consolidate` |
| **触发方式** | Pipeline 自动执行 | MCP 尾部指令建议 |
| **是否强制** | 是（pipeline stage 必过） | 否（`required: false`，Agent 可跳过） |
| **Agent 上下文** | Agent Runtime 内部上下文 | IDE Agent 的项目上下文 |
| **适用场景** | rescan 增量扫描 | 手动知识提交、维度补齐 |
| **批量处理** | 逐条通过 Gate | 一次 `alembic_consolidate` 批量决策 |

---

## 11. 全链路数据流（新）

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        新架构全链路                                      │
└─────────────────────────────────────────────────────────────────────────┘

                     ┌──── IDE / 编辑器 ────┐
                     │  文件 create/rename/  │
                     │  delete/modify        │
                     └──────────┬────────────┘
                                │
                    POST /api/v1/file-changes
                                │
                                ▼
              ┌──────────────────────────────┐
              │     FileChangeHandler        │
              │                              │
              │  renamed → ContentPatcher    │  ← 确信路径，不变
              │  deleted → Gateway(0.9)      │  ← 确信路径，不变
              │  modified → 影响分析         │  ← 新: 结构化 signal
              │    → impactLevel 分级         │
              │    → SignalBus.send(quality)  │
              │    → FileChangeReport 响应    │  ← 新: 含 affectedRecipes
              └──────────┬───────────────────┘
                         │
          ┌──────────────┼─────────────────────────┬────────────────────┐
          │              │                          │                    │
     Signal 沉淀    用户触发 rescan          Proposal 评估消费    VSCode 弹窗建议
          │              │                          │              (impactLevel=direct)
          ▼              ▼                          ▼                    │
   ┌─────────────┐  ┌──────────────────────┐  ProposalExecutor    ┌─────┴─────┐
   │ 影响摘要累积  │  │  Phase A: 进化前置    │  #evaluateOnSignal  │ 立即审视   │
   │ (per Recipe) │  │                      │                    │ 稍后处理   │
   └─────────────┘  │  RelevanceAuditor     │                    └───────────┘
                    │  + 文件修改 signal     │
                    │  → 过滤候选 Recipe     │
                    │    healthy+无修改 → 自动 skip
                    │    dead → 已 deprecated
                    │    decay/severe/impacted → Agent 验证
                    │  → Agent: alembic_evolve   │
                    │    propose/confirm/skip │
                    │  → 确定各维度 gap 数    │
                    └──────────┬─────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Phase B: 纯新增      │
                    │                      │
                    │  [内部 Agent]         │
                    │  Analyze → QualityGate│
                    │  → Produce → Reject  │
                    │  (无 Evolve Stage)    │
                    │                      │
                    │  [外部 Agent]         │
                    │  alembic_submit_knowledge │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────────┐
                    │ RecipeProductionGateway   │
                    │                          │
                    │ Layer 1: 结构化过滤       │
                    │   fingerprint 去重        │
                    │   批内互重叠阻止（新）     │
                    │   统一相似度算法（新）     │
                    │                          │
                    │ Layer 1.5: 字段级分析     │
                    │   triggerConflict          │
                    │   doClauseSubset           │
                    │   coreCodeOverlap          │
                    │                            │
                    │ Layer 2: 语义融合           │
                    │   [内部 Agent]             │
                    │   → ConsolidationGate      │
                    │     (pipeline stage)       │
                    │   [外部 Agent]             │
                    │   → MCP 尾部指令           │
                    │     → alembic_consolidate      │
                    └──────────┬────────────────┘
                               │
               ┌───────────────┼───────────────────┐
               │               │                   │
          create 新 Recipe  merge/update     pendingSemanticReview
               │            Proposal              │
               ▼               ▼              MCP nextAction
        ConfidenceRouter  EvolutionGateway        │
        → staging/pending → Proposal 创建         ▼
                          → 信号驱动评估     外部 Agent 执行
                          → StateMachine     alembic_consolidate
                                             → keep/merge/reject
```

---

## 12. 涉及文件与改动清单

### 改动文件

| 文件 | 改动内容 | 影响范围 |
|------|---------|---------|
| `lib/http/routes/file-changes.ts` | 响应体回传 `ReactiveEvolutionReport`（告别 fire-and-forget） | §5.1 I1 |
| `lib/types/file-change.ts` | `FileChangeEvent` 增加 `eventSource` 字段 | §5.1 I2 |
| `lib/types/reactive-evolution.ts` | `ReactiveEvolutionReport` 增加 `eventSource` + `details[].impactLevel` | §5.1 I3 / §5.2 |
| `lib/service/evolution/FileChangeHandler.ts` | modified 处理增强：`#analyzeModifiedImpact()` + 结构化 signal + 透传 eventSource | §5.2 / §5.3 |
| `lib/service/FileChangeDispatcher.ts` | 将 handler 返回的 report 透传给 HTTP 路由 | §5.1 I1 |
| `resources/vscode-ext/src/apiClient.ts` | `reportFileChanges()` 返回值从 void 改为 `Promise<ReactiveEvolutionReport \| null>` | §5.1 I4 |
| `resources/vscode-ext/src/FileChangeCollector.ts` | 采集时标记 eventSource；`#onReport()` 触发弹窗（恢复之前实现并升级为 Strategy C） | §5.4 |
| `resources/vscode-ext/src/extension.ts` | 节流 Map、`buildEvolvePrompt()`、两按钮回调 | §5.4 |
| `lib/external/mcp/handlers/rescan-external.ts` | Mission Briefing 注入 EvolutionPrescreen，workflow 调整 | §6 |
| `lib/external/mcp/handlers/rescan-internal.ts` | pipeline stages 调整（移除 EvolutionStage/EvolutionGate） | §6 |
| `lib/external/mcp/handlers/bootstrap/pipeline/orchestrator.ts` | 维度 pipeline 统一简化 | §6 |
| `lib/service/knowledge/RecipeProductionGateway.ts` | 批内互重叠阻止、reorganize 转 merge Proposal、pendingSemanticReview 收集 | §7 / §10 |
| `lib/service/evolution/ConsolidationAdvisor.ts` | 调用共享 RecipeSimilarity、字段级分析、pendingSemanticReview 标记 | §7 |
| `lib/service/evolution/RedundancyAnalyzer.ts` | 改用共享 RecipeSimilarity | §7 |
| `lib/external/mcp/handlers/consolidated.ts` | 响应含 `pendingSemanticReview` + `nextAction` 尾部指令 | §10 |
| `lib/service/evolution/ProposalExecutor.ts` | `#evaluateOnSignal` 消费 `source_modified` signal 的 impactLevel | §9 |

### 新增文件

| 文件 | 职责 |
|------|------|
| `lib/domain/evolution/RecipeSimilarity.ts` | 统一 4 维相似度算法（ConsolidationAdvisor / RedundancyAnalyzer 共享） |
| `lib/agent/domain/consolidation-gate.ts` | ConsolidationGate 的 Agent preset + system prompt（pipeline 内融合） |
| `lib/external/mcp/handlers/consolidate.ts` | `alembic_consolidate` MCP handler（外部 Agent 语义融合决策入口） |

### 新增逻辑（嵌入现有文件）

| 位置 | 内容 |
|------|------|
| rescan-external / rescan-internal | `buildEvolutionPrescreen()` — 进化前置过滤函数 |
| FileChangeHandler | `#analyzeModifiedImpact()` — 文件修改影响分析 |
| RecipeProductionGateway | 批内互重叠阻止 + `pendingSemanticReview` 收集 |
| consolidated.ts (enhancedSubmitKnowledge) | `nextAction` 尾部指令构建逻辑 |
| MCP capabilities 注册表 | 新增 `alembic_consolidate` 到 `lib/external/mcp/tools.ts` 工具列表 |

### 不变文件

| 文件 | 原因 |
|------|------|
| `lib/domain/evolution/EvolutionPolicy.ts` | 阈值和决策规则不变 |
| `lib/service/evolution/LifecycleStateMachine.ts` | 状态机不变 |
| `lib/service/evolution/EvolutionGateway.ts` | Gateway 接口不变（仅作为 dispatcher 被调用方，不改造）|
| `lib/service/evolution/ContentPatcher.ts` | Patch 引擎不变 |
| `lib/service/evolution/KnowledgeMetabolism.ts` | 新陈代谢不变 |
| `lib/service/evolution/RelevanceAuditor.ts` | 审计逻辑不变（输出被进化前置消费） |
| `lib/service/evolution/DecayDetector.ts` | 衰退检测不变 |
| `lib/infrastructure/signal/SignalBus.ts` | Signal 总线不变（metadata 可自由透传，无需改 schema）|

---

## 13. 边界情况与链路通路验证

本节针对设计文档的每一条链路枚举边界情况与降级策略，确保上线后不出现"哑路径"。

### 13.1 文件变更链路

| # | 边界情况 | 触发场景 | 期望行为 |
|---|---------|---------|---------|
| B1 | 同一 flush 周期内同文件多次 modified | 开发者连续保存 | VSCode 侧 EventBuffer 已合并为一条 modified；服务端只处理一次 |
| B2 | modified 事件对应的文件**不在任何 Recipe 的 sourceRefs 中** | 新编辑的辅助文件 | `SourceRefRepository.findBySourcePath()` 返回空 → 跳过 impact 分析 → report.suggestReview=false → 不弹窗 |
| B3 | 同一 flush 周期影响 ≥ 20 条 Recipe | Git pull / 大范围重构 | report.eventSource 通常是 `git-head` → 自动不弹窗；即便是 ide-edit（罕见），折叠为一条"N 个 Recipe 受影响" |
| B4 | 服务端返回 5xx / 响应超时 | 服务重启、LLM 超时 | `apiClient.reportFileChanges()` 捕获异常 → 返回 null → 扩展侧不弹窗，不影响下次事件采集 |
| B5 | Recipe 处于 `staging` 或 `deprecated` | Phase B 刚产出的 Recipe 恰好被修改 | FileChangeHandler 查询 Recipe 状态，非 active 的不进入 `details`，signal 不发射（避免对临时态 Recipe 打扰）|
| B6 | Recipe 已被其他 Proposal 锁定（状态 `observing`） | 并发修改 | signal 照常发射，`ProposalExecutor.#evaluateOnSignal()` 将其作为评估证据而非新建 Proposal |
| B7 | FileChangeCollector 在 HTTP 响应到达前被销毁（VSCode 关闭） | 竞态 | `apiClient` 的 Promise 被 AbortController 取消，服务端已发射的 signal 仍生效，仅弹窗丢失（无副作用）|
| B8 | impactLevel 计算对 `pattern` 级过于宽松（误报） | glob 匹配噪声 | 只有 `direct` 会触发弹窗；`pattern` 级只发 signal 给 ProposalExecutor 作为弱证据（weight=0.2）|

### 13.2 进化前置链路（Phase A）

| # | 边界情况 | 触发场景 | 期望行为 |
|---|---------|---------|---------|
| B9 | 维度内所有 Recipe 都是 `healthy` 且无修改 signal | 稳定代码库 rescan | Phase A 全部自动 skip → Phase B gap 数 = 目标覆盖 - 现有 healthy → 可能为 0，跳过该维度 pipeline |
| B10 | 维度内**所有** Recipe 被 `dead` 判定 | 模块被删除 | RelevanceAuditor 已直接 deprecated → Phase A needsVerification 为空 → Phase B gap = 全量目标 |
| B11 | Agent 在 Phase A 对某条 Recipe 既没 skip 也没 propose（遗漏） | Agent 超时 / 忘记 | Phase A 收尾时遍历 needsVerification，未处理的默认为 `skip`（等同刷新 lastVerifiedAt），不阻塞 Phase B |
| B12 | 同一 Recipe 既被 RelevanceAuditor 判 `decay` 又有 `direct` impact signal | 衰退 + 最近被修改 | 两个来源合并到 `needsVerification[i].auditHint` 和 `.recentModifications` 中，Agent 看到完整上下文 |
| B13 | Phase A 产生的 deprecate 决策影响 Phase B gap 数 | Agent 决定废弃 | Phase A 结束后**重新计算** `dimensionGaps`（deprecated 的不再计入 healthy），Phase B 据此分配新增预算 |
| B14 | dimensionGaps 为负数（healthy + observing > target） | 过度生产 | clamp 到 0，Phase B 不执行 Produce |

### 13.3 候选提交融合链路

| # | 边界情况 | 触发场景 | 期望行为 |
|---|---------|---------|---------|
| B15 | 批次 items 全部被批内互重叠阻止（只留 1 条） | Agent 产出高度重复 | Gateway 正常处理留下的 1 条，其余进入 `result.duplicates[]` with reason=`batch-internal-overlap` |
| B16 | reorganize 建议的 `coveredBy` 只有 1 个目标 Recipe | 实际是 merge | 按 merge 处理（生成 1 条 update Proposal，confidence 0.5）|
| B17 | reorganize 的 `coveredBy` 包含已废弃的 Recipe | 过期审计 | 过滤 active 后再生成 Proposal；若过滤后为空，降级为 `create`（不删除候选）|
| B18 | Layer 1.5 字段分析全部不确定（边界相似度 0.5） | 典型的语义判断场景 | 加入 `pendingSemanticReview`，MCP 响应附 nextAction 尾部指令 |
| B19 | 外部 Agent 收到 nextAction 后**不调用** `alembic_consolidate` | Agent 跳过 | `required: false` → 允许跳过；被标记的 Recipe 保持 staging，observing 期内其他信号（guard/search）可自然晋升或降级 |
| B20 | 内部 Agent pipeline 的 ConsolidationGate 返回 merge，但 mergeTarget 已被并发删除 | 竞态 | EvolutionGateway.submit 返回失败，Gate 降级为 `approve_create`，candidate 保留为独立 Recipe |
| B21 | 同一候选同时命中批内重叠 + 与现有 Recipe 重叠 | 双重冲突 | 先批内阻止（保留较强者），保留下来的再走 ConsolidationAdvisor → 可能进一步走 pendingSemanticReview |

### 13.4 信号驱动链路

| # | 边界情况 | 触发场景 | 期望行为 |
|---|---------|---------|---------|
| B22 | `source_modified` signal 对应的 Recipe 已无任何 Proposal | 普通修改 | ProposalExecutor.#evaluateOnSignal 检测到 target 无 observing Proposal → 仅累积到 `signal_log`，不创建新 Proposal |
| B23 | signal 携带的 `modifiedPath` 是临时文件 / 构建产物 | .git/ .cache/ 等 | VSCode 扩展侧的 `pathFilter` 已排除；服务端 FileChangeHandler 再做一次 ignore 检查兜底 |
| B24 | impactLevel=direct 但 Recipe 的 coreCode 实际未引用该文件（SourceRef 过期） | 重命名未同步 | 降级为 reference，触发一次 ContentPatcher 的 sourceRefs 校对 |

### 13.5 向后兼容性

| # | 兼容点 | 策略 |
|---|-------|------|
| C1 | 旧版 VSCode 扩展调用新 HTTP 路由 | 服务端保持 `{ success: true }` 顶层字段，新增字段仅对新版扩展可见；旧扩展无视响应体即可 |
| C2 | 新版扩展访问旧版服务 | `apiClient.reportFileChanges()` 解析失败时返回 null，扩展侧 null-check 后静默跳过弹窗 |
| C3 | 已有的 `nextAction` 响应模式（task close → alembic_guard） | 保持现状不变；本次只新增 `alembic_submit_knowledge` 场景的 nextAction |
| C4 | 现有 MCP 客户端不认识 `alembic_consolidate` | `required: false` + reason 用自然语言描述，即便客户端不调用也不影响主流程 |

---

## 14. 实施顺序与回滚策略

### 14.1 推荐实施顺序

按依赖关系分 4 个阶段，每阶段内独立可测试可回滚：

**阶段 1 — 基础设施改造（I1-I5，无用户可见变化）**

1. `lib/types/file-change.ts`：`FileChangeEvent` 新增 `eventSource` 字段（可选，向后兼容）
2. `lib/types/reactive-evolution.ts`：`ReactiveEvolutionReport` 新增 `eventSource` + `details[].impactLevel`
3. `lib/service/evolution/FileChangeHandler.ts`：实现 `#analyzeModifiedImpact()` + 填充 impactLevel + 增强 signal metadata
4. `lib/service/FileChangeDispatcher.ts`：透传 report
5. `lib/http/routes/file-changes.ts`：响应体回传 report（I1）
6. 单元测试：impactLevel 计算、signal metadata、HTTP 响应 schema

**验收**：`npm run test:unit` 新增 impactLevel 相关 case 通过，`npx tsc --noEmit` 0 errors。

**阶段 2 — VSCode 弹窗（§5.4）**

7. `resources/vscode-ext/src/apiClient.ts`：`reportFileChanges()` 返回类型改造
8. `resources/vscode-ext/src/FileChangeCollector.ts`：采集端标记 eventSource、处理响应
9. `resources/vscode-ext/src/extension.ts`：`buildEvolvePrompt()` + 节流 Map + 两按钮回调
10. 手动验证：改一个被 active Recipe 引用的文件 → 观察弹窗出现 → 点击两按钮验证分支

**回滚**：只需将 `FileChangeCollector.#onReport()` 中的弹窗逻辑短路为 no-op（环境变量 `ALEMBIC_DISABLE_EVOLVE_POPUP=1`）。

**阶段 3 — 候选提交融合增强（§7 + §10）**

11. 新增 `lib/domain/evolution/RecipeSimilarity.ts`，ConsolidationAdvisor / RedundancyAnalyzer 切换调用
12. RecipeProductionGateway：批内互重叠阻止 + reorganize→merge 转换
13. ConsolidationAdvisor：字段级分析 + pendingSemanticReview 标记
14. `consolidated.ts`：响应附 `pendingSemanticReview` + `nextAction`
15. 新增 `lib/external/mcp/handlers/consolidate.ts`，注册到 MCP 工具列表

**验收**：`alembic_submit_knowledge` 的单元+集成测试覆盖 pendingSemanticReview 场景；`alembic_consolidate` handler 新增测试。

**回滚**：删除 nextAction 字段（MCP 响应仍可用）、禁用批内阻止（通过 flag `gateway.blockInternalOverlaps=false`）。

**阶段 4 — 进化前置（§6）**

16. 新增 `buildEvolutionPrescreen()` 逻辑到 rescan-external / rescan-internal
17. `orchestrator.ts` 维度 pipeline 简化（去除 EvolutionStage/EvolutionGate）
18. 新增 `lib/agent/domain/consolidation-gate.ts` 作为 pipeline 新 Stage
19. Mission Briefing 附带 EvolutionPrescreen 数据

**验收**：rescan 集成测试覆盖全 healthy / 部分 decay / 含 impacted 三种场景。

**回滚**：环境变量 `ALEMBIC_EVOLUTION_PRESCREEN=off` 保留旧 pipeline（Evolve → Gate → Analyze → Produce）。

### 14.2 跨阶段不变式

- **任何阶段独立回滚后，其余阶段功能不受影响**：例如阶段 3 回滚不影响阶段 2 的弹窗（弹窗消费的是 report，与 ConsolidationAdvisor 无关）
- **Signal 系统向前兼容**：metadata 字段的新增不破坏现有订阅者（ProposalExecutor 对未知字段忽略）
- **MCP 响应顶层字段稳定**：新增字段都在 `data` / `nextAction` 下，不改变 `success` / `message` / `code`

### 14.3 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 弹窗频率过高引起反感 | 中 | 中 | Strategy C（direct + ide-edit + 10min 节流）+ 用户可通过 `ALEMBIC_DISABLE_EVOLVE_POPUP` 关闭 |
| HTTP 同步响应增加事件处理延迟 | 低 | 低 | FileChangeHandler 是纯代码路径毫秒级；3s throttle 已平滑高频事件 |
| ConsolidationAdvisor 算法切换影响现有 Recipe 判断 | 中 | 中 | RecipeSimilarity 先内部并行运行对比日志，稳定后切换 |
| Phase A 过度过滤导致实际需要进化的 Recipe 被漏掉 | 中 | 中 | `watch` 档位 + 修改 signal 交叉作为安全网；保留 `--force-full-evolve` CLI 开关 |
| 外部 Agent 忽略 nextAction 导致 pendingSemanticReview Recipe 长期滞留 | 低 | 低 | pendingSemanticReview 的 Recipe 仍在 observing 窗口，其他信号到达时照常评估晋升/降级 |

