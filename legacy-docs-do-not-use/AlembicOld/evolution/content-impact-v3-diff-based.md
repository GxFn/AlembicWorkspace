# ContentImpactAnalyzer v3 — Diff-Based 影响评估

> 设计文档 · 2025-04-20
>
> 核心纠偏：**影响评估应分析「这次改了什么」而非「文件整体和 Recipe 有多像」**。

---

## 1. v2 方案的根本方向错误

v2 提出 BM25F 全文件匹配方案，回答的问题是：

> "这个文件和 Recipe 有多相关？"

但正确的问题是：

> "这次修改是否动到了 Recipe 描述的代码模式/API？"

**反例**：
- 文件改了 500 行注释 + 1 行空行，但 `fetchPopular` 方法签名没变 → **Recipe 无影响**
- 文件只改了 1 行，把 `fetchPopular` 改名为 `fetchTrending` → **Recipe 需要更新**

全文件匹配无法区分这两种情况。**影响评估的输入必须是 diff，不是整个文件**。

---

## 2. 业界方法论：Diff-Based Change Impact Analysis

### 2.1 Chianti（Ren et al., 2004）

Chianti 是 Java 的变更影响分析工具，其核心思路：

1. 将代码变更分解为 **atomic changes**（原子变更）：添加方法、删除字段、修改方法体…
2. 对每个 atomic change，通过调用图和依赖分析找到**受影响的测试**
3. 输出：每个测试 → 影响它的 atomic changes 列表

**启发**：我们不需要完整的调用图分析（Recipe 不是可执行测试），但「将 diff 分解为原子变更单元，
然后匹配到 Recipe 关心的标识符」这个两步流程是正确的。

### 2.2 Program Slicing（Weiser, 1979）

> "A program slice S for criterion (x, v) consists of all statements that may affect 
> the value of variable v at statement x."

**启发**：我们把 Recipe 视为一组 "slicing criteria"——Recipe 关心的是特定 API 签名、
协议定义、类结构。当 diff 中出现这些标识符时，说明 Recipe 关心的 "slice" 被修改了。

### 2.3 Regression Test Selection（RTS）

RTS 领域的经典问题：「代码改了，哪些测试需要重跑？」

三种策略：
- **Retest-all**：全跑（太贵）
- **Safe RTS**：通过代码覆盖+依赖分析精确选择（复杂）
- **Heuristic RTS**：用文件名/包名/变更内容做启发式匹配（轻量）

**Alembic 适合 Heuristic RTS**——用 diff 中的标识符变更做启发式匹配，不需要运行时覆盖信息。

### 2.4 总结：适合 Alembic 的方法

| 方法 | 精度 | 成本 | 适合 Alembic？ |
|------|------|------|---------------|
| 全文件 BM25F 匹配 (v2) | 低（不区分改没改） | 低 | ❌ |
| 完整 AST 依赖图 | 极高 | 极高（需完整编译环境） | ❌ |
| 运行时覆盖分析 | 极高 | 极高（需执行代码） | ❌ |
| **Diff token × Recipe token 交集** | 中高 | 低 | ✅ |
| **Diff + IDF 加权交集** | 高 | 低 | ✅ 推荐 |

---

## 3. 当前系统的 Diff 能力缺口

### 3.1 现状：只有文件名，没有 diff 内容

| 来源 | 当前命令 | 获取内容 |
|------|---------|---------|
| VSCode IDE 事件 | `onDidSaveTextDocument` | 仅路径 |
| Git HEAD 变化 | `git diff --name-only {A}..{B}` | 仅文件名列表 |
| Working tree 扫描 | `git diff --name-only` | 仅文件名列表 |
| `readProjectFile()` | `fs.readFileSync(path)` | **当前**完整文件（无 before） |

**核心缺口**：从未调用过 `git diff -p`（patch 格式），没有任何模块获取行级变更内容。

### 3.2 获取 Diff 的可行方案

#### 方案 A：`git diff` 获取 unified patch（推荐）

```bash
# 未 staged 的变更
git diff -- path/to/file.swift

# 已 staged 的变更
git diff --cached -- path/to/file.swift

# HEAD 变化后的变更
git diff {oldHead}..{newHead} -- path/to/file.swift
```

优点：
- 项目已有 git 调用基础设施（`FileChangeCollector` 中的 `execGit`）
- 输出标准 unified diff，解析简单
- 只获取变更部分，比读两次全文件更高效

缺点：
- 依赖 git（但项目已假设 git 存在）
- 对未 track 的新文件需要降级处理

#### 方案 B：Before/After 快照 + 内存 diff

在文件保存时缓存 before 版本，修改后比较。

缺点：
- 需要维护快照缓存
- 内存开销
- 首次无 before 版本

#### 方案 C：只分析 diff 行（混合方案，推荐实现）

用 `git diff -U0`（零上下文行）获取最精简的 diff，只包含实际变更行：

```bash
git diff -U0 -- path/to/file.swift
```

输出示例：
```diff
@@ -12,3 +12,3 @@
-    func fetchPopular(page: Int, pageSize: Int) async throws -> [VideoModel]
+    func fetchTrending(page: Int, pageSize: Int) async throws -> [VideoModel]
@@ -45 +45 @@
-    // Old comment
+    // New comment
```

解析只需提取 `+` 和 `-` 开头的行。

---

## 4. v3 方案设计

### 4.1 核心思想

$$
\text{impact}(R, \Delta F) = \frac{\sum_{t \in T_R \cap T_\Delta} w(t)}{\sum_{t \in T_R} w(t)}
$$

其中：
- $T_R$ = Recipe $R$ 的特征标识符集合（从所有代码字段提取）
- $T_\Delta$ = 文件 diff 中出现的标识符集合（仅变更行）
- $w(t)$ = token $t$ 的权重（IDF 或固定权重）

**关键区别**：分子 $T_\Delta$ 来自 **diff**，不是整个文件。

### 4.2 架构概览

```
文件修改事件
    │
    ▼
┌──────────────────┐     ┌──────────────────────┐
│ ① 获取 diff 内容  │────▶│ ② 解析 diff，提取变更行 │
│ git diff -U0      │     │ parseDiffHunks()      │
└──────────────────┘     └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ ③ 从变更行提取标识符   │
                         │ tokenizeDiffLines()    │
                         └──────────┬───────────┘
                                    │
    ┌───────────────────────────────┤
    │                               │
    ▼                               ▼
┌─────────────────┐     ┌──────────────────────────┐
│ Recipe 特征标识   │     │ ④ 计算加权交集            │
│ 符 (预计算缓存)  │────▶│ weightedIntersection()    │
│ extractRecipe    │     │                          │
│ Tokens()         │     │ 分类: pattern / reference │
└─────────────────┘     │        / unrelated        │
                        └──────────────────────────┘
```

### 4.3 Step ①：获取 Diff 内容

新增工具函数，复用 FileChangeCollector 已有的 git 调用模式：

```typescript
/**
 * 获取文件的 git diff 内容（unified format，零上下文行）
 * @returns diff 文本，或 null（无 git / untracked 文件 / 无变更）
 */
export function getFileDiff(
  projectRoot: string,
  relativePath: string,
): string | null {
  try {
    const output = execFileSync('git', ['diff', 'HEAD', '-U0', '--', relativePath], {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 5000,
    }).trim();
    return output || null;
  } catch {
    return null;  // 无 git / 首次提交前 / 其它错误
  }
}
```

**无降级策略**：如果无法获取 diff（untracked 文件、no git、首次 commit 前），
返回 `null`，跳过该文件的影响评估。不做全文件降级分析。

### 4.4 Step ②：解析 Diff Hunks

```typescript
interface DiffHunk {
  /** 删除的行（- 前缀） */
  removedLines: string[];
  /** 新增的行（+ 前缀） */
  addedLines: string[];
}

/**
 * 解析 unified diff 文本，提取变更行
 * 忽略 @@ 头、文件头、上下文行（无 +/- 前缀的行）
 */
function parseDiffHunks(diffText: string): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let current: DiffHunk | null = null;
  
  for (const line of diffText.split('\n')) {
    if (line.startsWith('@@')) {
      if (current) { hunks.push(current); }
      current = { removedLines: [], addedLines: [] };
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      current?.removedLines.push(line.slice(1));
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      current?.addedLines.push(line.slice(1));
    }
  }
  if (current) { hunks.push(current); }
  return hunks;
}
```

### 4.5 Step ③：从变更行提取标识符

将所有变更行（added + removed）连接为文本，用现有的 `tokenizeIdentifiers` 提取代码标识符：

```typescript
function tokenizeDiffLines(hunks: DiffHunk[], language: string): Set<string> {
  const allLines = hunks.flatMap(h => [...h.removedLines, ...h.addedLines]);
  const text = allLines.join('\n');
  return new Set(tokenizeIdentifiers(text, language));
}
```

**为什么同时包含 removed 和 added 行？**

- `fetchPopular` → `fetchTrending`：`fetchPopular` 在 removed 行，
  `fetchTrending` 在 added 行。Recipe 描述了 `fetchPopular`，它出现在 diff 中 → 影响。
- 只看 added 会漏掉「删除了 Recipe 描述的 API」的情况。
- 只看 removed 会漏掉「新增了与 Recipe 冲突的 API」的情况。

### 4.6 Step ④：Recipe 特征标识符提取（v2 的改进保留）

v2 中「从 Recipe 全字段提取 token」的思路是正确的，这里保留并简化：

```typescript
interface RecipeTokens {
  /** 所有去重后的特征标识符 */
  tokens: Set<string>;
  /** 来源映射（用于调试） */
  sources: Map<string, 'coreCode' | 'markdown' | 'pattern' | 'steps'>;
}

function extractRecipeTokens(entry: KnowledgeEntry): RecipeTokens {
  const tokens = new Set<string>();
  const sources = new Map<string, string>();
  const lang = entry.language ?? '';
  
  // 1. coreCode（教学模板）
  for (const t of tokenizeIdentifiers(entry.coreCode, lang)) {
    tokens.add(t);
    sources.set(t, 'coreCode');
  }
  
  // 2. content.markdown 中的代码块（真实代码，最高价值）
  const codeBlocks = extractCodeBlocksFromMarkdown(entry.content.markdown);
  for (const block of codeBlocks) {
    for (const t of tokenizeIdentifiers(block.code, block.language || lang)) {
      tokens.add(t);
      sources.set(t, 'markdown');  // 会覆盖 coreCode 来源，OK
    }
  }
  
  // 3. content.pattern
  if (entry.content.pattern) {
    for (const t of tokenizeIdentifiers(entry.content.pattern, lang)) {
      tokens.add(t);
      sources.set(t, 'pattern');
    }
  }
  
  // 4. content.steps[].code
  for (const step of entry.content.steps) {
    if (step.code) {
      for (const t of tokenizeIdentifiers(step.code, lang)) {
        tokens.add(t);
        sources.set(t, 'steps');
      }
    }
  }
  
  return { tokens, sources };
}
```

### 4.7 Step ⑤：计算加权交集并分级

```typescript
type ImpactLevel = 'pattern' | 'reference' | 'unrelated';

function assessDiffImpact(
  diffTokens: Set<string>,
  recipeTokens: RecipeTokens,
): { level: ImpactLevel; score: number; matchedTokens: string[] } {
  
  const matched: string[] = [];
  let matchedWeight = 0;
  let totalWeight = 0;
  
  for (const token of recipeTokens.tokens) {
    const w = 1;  // Phase 1: 等权。Phase 2 可引入 IDF
    totalWeight += w;
    if (diffTokens.has(token)) {
      matchedWeight += w;
      matched.push(token);
    }
  }
  
  if (totalWeight === 0) {
    return { level: 'unrelated', score: 0, matchedTokens: [] };
  }
  
  const score = matchedWeight / totalWeight;
  
  // 分级
  let level: ImpactLevel;
  if (score >= 0.3) {
    level = 'pattern';     // diff 动到了 30%+ 的 Recipe 关键标识符
  } else if (score > 0) {
    level = 'reference';   // diff 动到了部分 Recipe 标识符
  } else {
    level = 'unrelated';   // diff 完全没碰到 Recipe 的标识符
  }
  
  return { level, score, matchedTokens: matched };
}
```

**阈值说明**：

为什么 `pattern` 阈值从 v1 的 0.4 降到 0.3？

- v1 用**全文件** token 匹配，大量无关 token 也命中，所以需要高阈值过滤噪声
- v3 用 **diff** token 匹配，只有实际变更的行参与，噪声极低
- diff 中只要有 1-2 个 Recipe 核心标识符被修改，就足以说明 Recipe 受影响
- 30% 意味着：Recipe 有 10 个关键 API，diff 改了其中 3 个 → `pattern`

**`reference` 与 `unrelated` 的分界**：

- `score > 0`：diff 中至少出现了 1 个 Recipe 标识符 → 有关联
- `score === 0`：diff 完全没碰到 → 无关

这比 v1 的全文件匹配精确得多——在全文件匹配中，只要文件里有一个通用词如 `client` 就会命中，
但在 diff 匹配中，只有 diff 行中出现 `client` 才算。

---

## 5. 完整流程（实际实现的 FileChangeHandler.#handleModified）

```typescript
async #handleModified(modifiedPath: string, report: ReactiveEvolutionReport): Promise<void> {
  const affected = this.#sourceRefRepo.findBySourcePath(modifiedPath);
  if (affected.length === 0) { report.skipped++; return; }

  for (const ref of affected) {
    let title = ref.recipeId;
    let entry = await this.#knowledgeRepo.findById(ref.recipeId);

    // 非 active 的 Recipe 不进入 details
    if (entry && entry.lifecycle !== 'active') { report.skipped++; continue; }
    if (entry) { title = entry.title || ref.recipeId; }

    // 提取 Recipe 全字段 token
    const recipeTokens = extractRecipeTokens(entry ?? {});

    // diff-based 影响评估（封装了 getFileDiff + parseDiffHunks + assessDiffImpact）
    const result = assessFileImpact(this.#projectRoot, modifiedPath, recipeTokens);

    // 无法获取 diff（无 git / untracked / 无变更）→ 跳过，不降级
    if (!result) { report.skipped++; continue; }

    const { level: impactLevel, score, matchedTokens } = result;

    // pattern 级别：diff 动到了 30%+ 的 Recipe 关键标识符 → 弹窗
    if (impactLevel === 'pattern') {
      report.needsReview++;
      report.details.push({
        recipeId: ref.recipeId, recipeTitle: title,
        action: 'needs-review',
        reason: `Recipe 描述的 API/模式被修改 (score=${score.toFixed(2)}, tokens: ${matchedTokens.join(', ')})`,
        impactLevel, modifiedPath,
      });
    }
    // reference 级别：仅发射信号，不进 details

    // 所有级别都发射 quality signal（ProposalExecutor 消费）
    this.#emitSourceModifiedSignal(ref.recipeId, modifiedPath, impactLevel);
  }
}
```

### 5.1 suggestReview 策略

Strategy C：`'direct'`（删除）或 `'pattern'`（30%+ token 命中）→ `suggestReview = true`。
`'reference'` 级别不触发 suggestReview。

```typescript
const hasHighImpact = report.details.some(
  (d) => d.action === 'needs-review' &&
         (d.impactLevel === 'direct' || d.impactLevel === 'pattern')
);
report.suggestReview = hasHighImpact || report.deprecated > 0;
```

### 5.2 IMPACT_WEIGHTS（quality signal 权重）

```typescript
const IMPACT_WEIGHTS: Record<ImpactLevel, number> = {
  direct: 0.8,   // 文件删除且无其他引用
  pattern: 0.6,  // 30%+ Recipe token 被 diff 修改
  reference: 0.3, // 少量 Recipe token 命中
};
```

---

## 6. 真实场景对比：v1 / v2 / v3

### 场景 A：改了 500 行注释，关键 API 没变

```diff
@@ -1,500 +1,500 @@
-// Old comment block about architecture...
+// New comment block about architecture...
+// Added documentation for repository pattern
```

| 版本 | 分析对象 | 结果 | 正确？ |
|------|---------|------|--------|
| v1 | 整个文件（1000 行） | 命中 7/9 token = 0.78 → `pattern` | ❌ 误报 |
| v2 | 整个文件 BM25F | 高分 → `pattern` | ❌ 误报 |
| **v3** | **仅 diff 行（注释文本）** | 命中 0 个 API token → `unrelated` | **✅** |

### 场景 B：改了 1 行，把 fetchPopular 改名为 fetchTrending

```diff
@@ -12 +12 @@
-    func fetchPopular(page: Int, pageSize: Int) async throws -> [VideoModel]
+    func fetchTrending(page: Int, pageSize: Int) async throws -> [VideoModel]
```

| 版本 | 分析对象 | 结果 | 正确？ |
|------|---------|------|--------|
| v1 | 整个文件 | 命中 6/9 token = 0.67 → `pattern` | ✅ 但理由错 |
| v2 | 整个文件 BM25F | 高分 → `pattern` | ✅ 但理由错 |
| **v3** | **diff: `fetchPopular`, `fetchTrending`** | `fetchPopular` ∈ Recipe tokens → `pattern` | **✅ 精确** |

v3 还能告诉你**具体是 `fetchPopular` 被改了**，v1/v2 只能说"文件和 Recipe 很像"。

### 场景 C：文件加了一个与 Recipe 无关的新方法

```diff
@@ -100,0 +101,5 @@
+    func fetchUserProfile(userId: String) async throws -> UserProfile {
+        let response = try await client.send(.userProfile(id: userId))
+        return response.data ?? UserProfile.empty
+    }
```

| 版本 | 分析对象 | 结果 | 正确？ |
|------|---------|------|--------|
| v1 | 整个文件 | `client`, `send`, `data` 命中 → 0.33 → `reference` | ⚠️ 有噪声 |
| v2 | 整个文件 | BM25F 包含大量无关 token → 仍然偏高 | ⚠️ |
| **v3** | **diff: `fetchUserProfile`, `UserProfile`, `client`, `send`** | `client`, `send` ∈ Recipe tokens → score 低 → `reference` | **✅** |

v3 仍然报 `reference`（因为 diff 中有 `client`、`send` 等通用词），
但分数比 v1 更准确（只有 2/20 而非 3/9）。

### 场景 D：改了 README.md（非源文件）

```diff
@@ -10 +10 @@
-## Installation
+## Quick Start
```

| 版本 | 分析对象 | 结果 | 正确？ |
|------|---------|------|--------|
| v1 | 整个文件 | 可能误命中某些通用词 | ⚠️ |
| **v3** | diff: `Installation`, `Quick`, `Start` | 0 个 Recipe API token → `unrelated` | **✅** |

---

## 7. Phase 2 增强：IDF 加权（可选）

Phase 1 使用等权（所有 token 权重为 1）。如果实践中发现通用词（`client`, `send`）
仍造成噪声，可引入 IDF：

$$
\text{impact}_{v3+IDF}(R, \Delta F) = \frac{\sum_{t \in T_R \cap T_\Delta} \text{IDF}(t)}{\sum_{t \in T_R} \text{IDF}(t)}
$$

$$
\text{IDF}(t) = \log\frac{N + 1}{n_t + 0.5}
$$

此时 `fetchPopular`（IDF=3.71，仅 1 条 Recipe 有）被修改时的贡献，
是 `client`（IDF=0.29，15 条 Recipe 有）被修改时的 **12.8 倍**。

这是 v2 设计中 IDF 的正确应用场景——不是用来评估"文件和 Recipe 多相关"，
而是用来评估"diff 中被改的标识符对这条 Recipe 有多重要"。

---

## 8. 实施计划

### Phase 1（核心功能，3 个新文件 + 2 个修改）

| 文件 | 操作 | 内容 |
|------|------|------|
| `lib/shared/diff-parser.ts` | **新建** | `getFileDiff()`, `parseDiffHunks()`, `tokenizeDiffLines()` |
| `lib/shared/markdown-utils.ts` | **新建** | `extractCodeBlocksFromMarkdown()` — 从 `RecipeExtractor.#extractCodeBlocks` 提取 |
| `lib/service/evolution/ContentImpactAnalyzer.ts` | **重写** | `extractRecipeTokens()`, `assessDiffImpact()`, `assessFileImpact()`（入口），旧 `assessContentImpact()` 已移除 |
| `lib/service/evolution/FileChangeHandler.ts` | **修改** | `#handleModified()` 改用 diff-based 流程 |
| `test/unit/ContentImpactAnalyzer.test.ts` | **更新** | 新增 diff-based 测试用例 |

### Phase 2（增强，可选）

| 文件 | 操作 | 内容 |
|------|------|------|
| `lib/service/evolution/RecipeIDFIndex.ts` | 新建 | IDF 索引，消除通用词噪声 |
| `ContentImpactAnalyzer.ts` | 增强 | `assessDiffImpact` 支持 IDF 加权 |

### Phase 3（远期，可选）

| 功能 | 说明 |
|------|------|
| AST-level diff | 用 tree-sitter 做函数级 diff，不再依赖行级文本 diff |
| 向量语义补充 | 对 `reference` 级别的 case 做语义验证 |

---

## 9. Diff 获取的边界情况

| 场景 | 处理方式 |
|------|---------|
| 文件未 tracked（新创建） | `getFileDiff` 返回 `null` → 跳过，不分析 |
| 无 git 环境 | `getFileDiff` 返回 `null` → 跳过，不分析 |
| diff 为空（保存但无实际变更） | 跳过，返回 `unrelated` |
| 二进制文件 | 跳过（`LanguageService.isSourceExt` 预先过滤） |
| 文件极大（>100KB） | `git diff -U0` 仍然只输出变更行，不受影响 |
| git staged vs unstaged | 默认用 `git diff HEAD` 包含两者 |

---

## 10. 性能分析

| 操作 | 时间复杂度 | 说明 |
|------|-----------|------|
| `git diff -U0 -- file` | O(D) | D = diff 大小，通常 << 文件大小 |
| 解析 diff hunks | O(D) | 单遍扫描 |
| diff token 提取 | O(D) | 只处理变更行 |
| Recipe token 提取 | O(R) | R = Recipe 代码总量。可缓存 |
| 交集计算 | O(min(Td, Tr)) | Set.has 是 O(1) |
| **总计** | **O(D + R)** | 远小于 v1/v2 的 O(F)（F = 整个文件大小） |

**关键优势**：v3 的计算量与 **diff 大小** 成正比，而非与 **文件大小** 成正比。
改 1 行只分析 1 行，不管文件有 10 行还是 10000 行。

---

## 11. 与 v2 的关系

v2 设计文档中的以下内容**仍然有效**，在 v3 中保留使用：

| v2 概念 | v3 中的状态 | 说明 |
|---------|-----------|------|
| 全字段 token 提取 | ✅ 保留 | `extractRecipeTokens()` 从 coreCode + markdown + pattern + steps 提取 |
| Markdown 代码块提取 | ✅ 保留 | `extractCodeBlocksFromMarkdown()` 公共函数 |
| IDF 加权 | ⏳ Phase 2 | 方向正确，但应用于 diff×Recipe 交集而非全文件 |
| 结构加分（sourceRef match） | ❌ 移除 | sourceRef 已经是前置过滤器（只对有 ref 的 Recipe 做分析），不需要加分 |
| BM25F 全文件评分 | ❌ 移除 | 根本方向错误 |
| Sigmoid 归一化 | ❌ 移除 | 不需要归一化——分数就是 "Recipe 关键标识符中被 diff 修改的比例"，天然 [0,1] |
| Tversky Index | ❌ 移除 | 不需要非对称度量——一个简单的加权覆盖率就够了 |

---

## 12. 开放问题

1. ~~**`git diff` 的调用时机**~~：**已决定**——在 `assessFileImpact()` 中同步调用
   `execFileSync('git', ['diff', 'HEAD', '-U0', '--', path])`，简单直接。

2. **Recipe token 缓存策略**：`extractRecipeTokens` 结果是否缓存？
   - 当前：每次 impact 分析都重新提取 → 简单但冗余
   - 在 Recipe CRUD 时缓存 → 高效但需要维护
   - Phase 2 可优化

3. **diff 为空但文件确实变了的情况**：某些自动格式化工具会改变缩进但 git 认为没变
   （取决于 `.gitattributes` 和 `core.autocrlf` 配置），如何处理？

4. ~~**created 事件是否也该做 impact 分析**~~：当前 created 直接跳过，
   这是正确行为——新文件没有 sourceRef，不会关联到任何 Recipe。

---

## 13. 实施状态（Phase 1 已完成）

| 文件 | 状态 | 说明 |
|------|------|------|
| `lib/shared/diff-parser.ts` | ✅ 已完成 | `getFileDiff()`（sync）, `parseDiffHunks()`, `tokenizeDiffLines()` |
| `lib/shared/markdown-utils.ts` | ✅ 已完成 | `extractCodeBlocksFromMarkdown()` |
| `lib/service/evolution/ContentImpactAnalyzer.ts` | ✅ 已完成 | 完全重写：`assessFileImpact()`, `assessDiffImpact()`, `extractRecipeTokens()`, `extractApiTokens()`, `tokenizeIdentifiers()` |
| `lib/service/evolution/FileChangeHandler.ts` | ✅ 已完成 | `#handleModified()` 使用 diff-based 流程；`suggestReview` 检查 `direct` 或 `pattern`；IMPACT_WEIGHTS 调整为 `direct:0.8, pattern:0.6, reference:0.3` |
| `test/unit/ContentImpactAnalyzer.test.ts` | ✅ 已完成 | 26 个测试覆盖所有公共函数 |
| `test/unit/FileChangeHandler.test.ts` | ✅ 已完成 | 19 个测试覆盖 modified/deleted/renamed/suggestReview 场景 |

### 与设计文档的差异
- `getFileDiff` 是**同步**函数（`execFileSync`），非 async
- 无降级策略：不支持 git 的场景直接跳过，不回退到全文件分析
- `assessContentImpact()` 已完全移除（非保留作为降级）
- `assessFileImpact()` 是对外入口，封装了 `getFileDiff → parseDiffHunks → tokenizeDiffLines → assessDiffImpact` 全流程
- `ImpactLevel` 类型只有 `'direct' | 'reference' | 'pattern'`（无 `'unrelated'`），无 diff 时返回 `null`
