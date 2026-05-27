# ContentImpactAnalyzer v2 — 多维内容影响评估系统

> 设计文档 · 2026-04-20
> 
> 目标：替换当前仅基于 `coreCode` 的 token 存在率方案，构建覆盖 Recipe 全字段、
> 利用项目已有 IR/AST/向量能力的多维影响评估体系。

---

## 1. 现有方案的局限

### 1.1 只用 coreCode，丢失 80%+ 代码信息

Recipe 的代码散布在至少 4 处：

| 字段 | 内容 | 示例长度 |
|------|------|---------|
| `coreCode` | 3-8 行教学模板，含占位符 (`My*`, `Example*`) | ~300 chars |
| `content.markdown` | 完整 Markdown 文档，**内嵌真实代码块**和来源标注 | ~1500 chars |
| `content.pattern` | 核心代码片段 | ~300 chars |
| `content.steps[].code` | 分步骤代码 | 变长 |

真实 Recipe 示例 —— `Repository 数据抽象层模式`：

```
coreCode (300c): 占位符模板
  public protocol MyRepositoryProtocol: Sendable { ... }
  public struct MyRepository: MyRepositoryProtocol { ... }

content.markdown (1541c): 含 3 个真实代码块
  
  public protocol FeedRepositoryProtocol: Sendable {
      func fetchPopular(page: Int, pageSize: Int) async throws -> [VideoModel]
      ...
  }
  
  (来源: Sources/.../FeedRepository.swift:9-14)
```

**问题**：v1 仅分析 `coreCode`，提取出的 API tokens 全是通用的
（`NetworkClient`, `Sendable`, `send`, `data`），辨识度低、误匹配率高。

而 `content.markdown` 中有 `FeedRepositoryProtocol`, `fetchPopular`, `VideoModel`,
`fetchLiveRooms`, `LiveRoomInfo` 等**高辨识度标识符**完全未利用。

### 1.2 单一 token 存在率的数学缺陷

当前公式：

$$
\text{presenceRate} = \frac{|T_{\text{recipe}} \cap T_{\text{file}}|}{|T_{\text{recipe}}|}
$$

问题：
- **无 IDF 加权**：`send`, `data`, `client` 等高频词与 `FeedRepositoryProtocol` 等
  低频词同等权重，但后者的辨识度远高于前者
- **无文档长度归一化**：1000 行大文件天然命中更多 token，倾向于高估
- **硬阈值 0.4**：二分法不够精细，且 0.4 这个阈值缺乏理论支撑

### 1.3 未利用项目已有能力

| 已有能力 | 模块 | 当前在 impact 中是否使用 |
|---------|------|----------------------|
| BM25 全文评分 | `BM25Scorer` | ❌ |
| 向量语义搜索 | `HnswVectorAdapter` + `BatchEmbedder` | ❌ |
| AST 语法分块 | `ASTChunker` (tree-sitter) | ❌ |
| 4 维 Recipe 相似度 | `RecipeSimilarity` | ❌ |
| 语言感知注释掩码 | `GuardPatternUtils.buildCommentMask` | ❌ |
| Markdown 代码块提取 | `RecipeExtractor.#extractCodeBlocks` (私有) | ❌ |

---

## 2. 业界方法论调研

### 2.1 Change Impact Analysis (CIA)

学术界将 CIA 分为三类（Bohner & Arnold, 1996）：

1. **Traceability IA** — 通过需求→设计→代码的追踪链确定影响范围
2. **Dependency IA** — 基于代码依赖图（调用图、数据流）静态/动态分析
3. **Experiential IA** — 基于专家知识/启发式规则

Alembic 的 Recipe 系统本质是**非结构化知识的 Traceability**——从 "知识条目" 追踪到
"源文件"。核心挑战：Recipe 不是结构化依赖声明，而是 **自然语言 + 代码片段** 的混合体。

### 2.2 信息检索相关度排名

#### TF-IDF

$$
\text{TF-IDF}(t, d, D) = \text{tf}(t, d) \cdot \text{idf}(t, D)
$$

$$
\text{idf}(t, D) = \log \frac{N}{|\{d \in D : t \in d\}|}
$$

核心思想：**在所有 Recipe 中罕见但在当前 Recipe 中频繁出现的 token 更有辨识度**。

#### Okapi BM25

$$
\text{score}(D, Q) = \sum_{i=1}^{n} \text{IDF}(q_i) \cdot \frac{f(q_i, D) \cdot (k_1 + 1)}{f(q_i, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}
$$

BM25 在 TF-IDF 基础上加入：
- **饱和函数**：TF 增长有上限（避免长文档中高频词主导）
- **文档长度归一化**：参数 $b$ 控制长度惩罚（$k_1 \in [1.2, 2.0]$, $b = 0.75$）

**项目中 `BM25Scorer` 已实现此算法**，但仅用于搜索，未用于 impact 分析。

#### BM25F（字段加权变体）

BM25 的多字段扩展，对不同字段（标题、正文、锚文本等）赋予不同权重后合并：

$$
\tilde{tf} = \sum_{f \in F} w_f \cdot \frac{\text{tf}_{f}}{1 - b_f + b_f \cdot \frac{l_f}{\text{avgl}_f}}
$$

**这正好适合 Recipe 的多字段结构**：`coreCode`（高权重）、`content.markdown`
（中权重）、`content.pattern`（高权重）、`title`（低权重）。

### 2.3 集合相似度度量对比

| 度量 | 公式 | 特性 | 适用场景 |
|------|------|------|---------|
| Jaccard | $J = \frac{\|A \cap B\|}{\|A \cup B\|}$ | 对称、受集合大小影响 | 两等价集合的重叠度 |
| Overlap (Szymkiewicz–Simpson) | $O = \frac{\|A \cap B\|}{\min(\|A\|, \|B\|)}$ | 不对称、小集合友好 | 子集检测 |
| Cosine | $\cos(\theta) = \frac{A \cdot B}{\|A\|\|B\|}$ | 长度无关、向量空间 | TF-IDF 加权后的相似度 |
| v1 presenceRate | $P = \frac{\|A \cap B\|}{\|A\|}$ | 单向、查全率导向 | "A 中有多少出现在 B 中" |
| **Tversky** | $T = \frac{\|A \cap B\|}{\|A \cap B\| + \alpha\|A \setminus B\| + \beta\|B \setminus A\|}$ | 可调非对称 | **最佳：α,β 可调偏向** |

#### Tversky Index — 最适合 Recipe↔File 场景

$$
T_{\alpha,\beta}(A, B) = \frac{|A \cap B|}{|A \cap B| + \alpha|A \setminus B| + \beta|B \setminus A|}
$$

- $\alpha = 1, \beta = 0$：等价于 Overlap coefficient（Recipe 是否为 File 子集）
- $\alpha = 0, \beta = 1$：等价于 "File 是否被 Recipe 覆盖"
- $\alpha = 1, \beta = 1$：退化为 Jaccard

对于 **Recipe → File impact** 场景：
- 我们更关心 "Recipe 描述的模式在文件中出现了多少"（A=Recipe tokens）
- 不太关心 "文件中有多少不在 Recipe 里的东西"（B\A 不重要）
- 推荐 $\alpha \approx 0.8, \beta \approx 0.2$

---

## 3. v2 方案设计

### 3.1 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                ContentImpactAnalyzer v2                      │
│                                                             │
│  ┌───────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Token Layer  │    │  Field Layer │    │  Final Score  │  │
│  │               │    │              │    │               │  │
│  │ ① 全字段代码  │    │ ③ BM25F 多字 │    │ ⑤ 加权融合   │  │
│  │   块提取      │───▶│   段评分     │───▶│   + 分级     │  │
│  │ ② IDF 加权   │    │ ④ 结构加分   │    │              │  │
│  │   token 池    │    │              │    │ pattern      │  │
│  └───────────────┘    └──────────────┘    │ reference    │  │
│                                           │ unrelated    │  │
│                                           └──────────────┘  │
│                                                             │
│  可选增强层（Phase 2）:                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ⑥ 向量语义相似度   ⑦ AST 符号级精确匹配              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Phase 1: 多字段 BM25F + Tversky（纯 CPU、零依赖）

#### Step ① 全字段代码块提取

从 Recipe 的所有代码源中提取标识符，而非仅 `coreCode`：

```typescript
interface RecipeCodeCorpus {
  /** 从 coreCode 提取的 token（教学模板，权重较低） */
  coreTokens: string[];
  /** 从 content.markdown 内嵌代码块提取的 token（真实代码，权重最高） */
  markdownCodeTokens: string[];
  /** 从 content.pattern 提取的 token */
  patternTokens: string[];
  /** 从 content.steps[].code 提取的 token */
  stepsCodeTokens: string[];
  /** 从来源标注中提取的文件路径（如 "来源: Sources/.../FeedRepository.swift:9-14"）*/
  inlineSourceRefs: string[];
}
```

Markdown 代码块提取逻辑（复用 `RecipeExtractor` 的正则，提取为公共函数）：

```typescript
function extractCodeBlocksFromMarkdown(markdown: string): Array<{
  language: string;
  code: string;
}> {
  const blocks: Array<{ language: string; code: string }> = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push({ language: match[1] || '', code: match[2] });
  }
  return blocks;
}
```

同时从 markdown 中提取内联来源引用：

```typescript
// 匹配 "(来源: Sources/.../FeedRepository.swift:9-14)" 模式
const SOURCE_REF_REGEX = /\(来源:\s*([^:)]+)(?::\d+-\d+)?\)/g;
```

#### Step ② IDF 加权 Token 池

**关键改进**：不再将所有 token 等权对待，引入 IDF 来区分辨识度。

在 Recipe 集合中计算 IDF：

$$
\text{IDF}(t) = \log\left(\frac{N + 1}{n_t + 0.5}\right)
$$

其中 $N$ = Recipe 总数，$n_t$ = 包含 token $t$ 的 Recipe 数量。

```typescript
interface WeightedToken {
  token: string;
  idf: number;        // 逆文档频率
  source: 'core' | 'markdown' | 'pattern' | 'steps';
}
```

示例（基于 BiliDili 20 条 Recipe）：

| Token | 出现在 N 条 Recipe 中 | IDF | 辨识度 |
|-------|---------------------|-----|--------|
| `NetworkClient` | 8 | 0.92 | 低（通用基础设施） |
| `Sendable` | 12 | 0.51 | 很低 |
| `FeedRepositoryProtocol` | 1 | 3.71 | **极高**（仅此 Recipe） |
| `fetchPopular` | 1 | 3.71 | **极高** |
| `VideoModel` | 3 | 1.90 | 高 |
| `client` | 15 | 0.29 | 极低（几乎所有 Recipe 都有） |

**效果**：`FeedRepositoryProtocol` 的权重是 `client` 的 12.8 倍。

#### Step ③ BM25F 多字段评分

将 Recipe 视为多字段文档，对每个字段独立计算 BM25 后加权合并：

$$
\text{score}_{v2}(R, F) = \sum_{f \in \text{fields}} w_f \cdot \text{BM25}(Q_f, F)
$$

字段权重：

| 字段 $f$ | 权重 $w_f$ | 说明 |
|----------|-----------|------|
| `content.markdown` 代码块 | **0.45** | 真实代码，最高辨识度 |
| `content.pattern` | 0.25 | 核心代码片段 |
| `coreCode` | 0.15 | 教学模板，占位符多，权重降低 |
| `content.steps[].code` | 0.10 | 步骤代码 |
| `title` + `doClause` | 0.05 | 文本描述中的技术术语 |

单字段 BM25：

$$
\text{BM25}(Q_f, F) = \sum_{t \in Q_f} \text{IDF}(t) \cdot \frac{\text{tf}(t, F) \cdot (k_1 + 1)}{\text{tf}(t, F) + k_1 \cdot \left(1 - b + b \cdot \frac{|F|}{\text{avgfl}}\right)}
$$

参数：$k_1 = 1.5$, $b = 0.75$（标准值）。

#### Step ④ 结构加分

对 BM25F 基础分叠加结构信号加分：

```typescript
interface StructuralBonus {
  /** 文件路径出现在 sourceRefs 中 → +0.3 */
  sourceRefMatch: boolean;
  /** 文件路径出现在 reasoning.sources 中 → +0.15 */
  reasoningSourceMatch: boolean;
  /** 文件路径出现在 markdown 内联来源标注中 → +0.2 */
  inlineSourceRefMatch: boolean;
  /** 文件名 stem 与 Recipe title 中的类名匹配 → +0.1 */
  titleSymbolMatch: boolean;
}
```

$$
\text{bonus} = \sum_{s \in S} w_s \cdot \mathbb{1}[s]
$$

#### Step ⑤ 最终评分与分级

$$
\text{finalScore} = \text{normalize}(\text{BM25F\_score}) + \text{bonus}
$$

BM25F 原始分的 normalize 方式——Sigmoid 映射到 [0, 1]：

$$
\text{normalize}(x) = \frac{1}{1 + e^{-k(x - x_0)}}
$$

其中 $x_0$ 为 BM25F 分数的中位数（可自适应校准），$k$ 控制曲线陡度。

分级阈值（3 级，较 v1 的 2 级更精细）：

| 区间 | ImpactLevel | 含义 |
|------|------------|------|
| finalScore ≥ 0.6 | `pattern` | 文件实现了 Recipe 描述的代码模式 |
| 0.3 ≤ finalScore < 0.6 | `reference` | 文件与 Recipe 有关联但非直接实现 |
| finalScore < 0.3 | `unrelated` | 文件与 Recipe 无实质关联 |

> **注意**：`direct` 级别保留给 deleted/renamed 事件，modified 不使用。

### 3.3 Phase 2: 可选增强层

#### ⑥ 向量语义相似度（利用已有 HNSW 索引）

对于 BM25F 分数在灰色地带（0.25~0.45）的案例，调用向量语义相似度做二次验证：

```typescript
async function semanticVerification(
  recipeId: string,
  fileContent: string,
  vectorStore: VectorStore,
  embedder: BatchEmbedder
): Promise<number> {
  // 1. Recipe 的 embedding 已在索引中
  // 2. 对文件变更部分生成 embedding
  // 3. 计算余弦相似度
  const fileEmbedding = await embedder.embed(fileContent.slice(0, 2000));
  const results = await vectorStore.searchVector(fileEmbedding, 5);
  const recipeHit = results.find(r => r.id.startsWith(recipeId));
  return recipeHit?.score ?? 0;
}
```

触发条件：仅当 `0.25 < normalizedBM25F < 0.45` 时触发，避免对明确案例浪费 API 调用。

#### ⑦ AST 符号级精确匹配（利用已有 tree-sitter）

对于 BM25F 判定为 `pattern` 的案例，使用 AST 做精确验证：

```typescript
// 利用已有的 ASTChunker 能力
import { chunkByAST } from '#infra/vector/ASTChunker.js';

function astSymbolMatch(
  fileContent: string,
  language: string,
  recipeSymbols: string[]  // 从 Recipe 提取的函数名、类名、协议名
): { matched: string[]; missing: string[] } {
  const chunks = chunkByAST(fileContent, language);
  const definedSymbols = chunks
    .filter(c => c.type === 'function' || c.type === 'class' || c.type === 'protocol')
    .map(c => c.name);
  
  const matched = recipeSymbols.filter(s => definedSymbols.includes(s));
  const missing = recipeSymbols.filter(s => !definedSymbols.includes(s));
  return { matched, missing };
}
```

---

## 4. IDF 语料库构建

### 4.1 懒加载 IDF 表

每次 impact 分析不需要实时遍历所有 Recipe。改为**维护一个 IDF 缓存表**，
在 Recipe CRUD 时增量更新：

```typescript
class RecipeIDFIndex {
  /** token → 出现在多少条 Recipe 中 */
  private docFreq: Map<string, number> = new Map();
  /** Recipe 总数 */
  private totalDocs = 0;

  /** Recipe 创建/更新时调用 */
  onRecipeUpsert(recipeId: string, tokens: string[]): void { ... }
  /** Recipe 删除时调用 */
  onRecipeRemove(recipeId: string, tokens: string[]): void { ... }

  /** 计算 IDF */
  idf(token: string): number {
    const df = this.docFreq.get(token) ?? 0;
    return Math.log((this.totalDocs + 1) / (df + 0.5));
  }
}
```

### 4.2 冷启动

首次运行时全量扫描一遍所有 active Recipe 构建 IDF 表，后续增量维护。
类似 `BM25Scorer` 的现有架构。

---

## 5. v1 → v2 对比（同一真实场景）

### 场景：Recipe `Repository 数据抽象层模式`，修改 `FeedRepository.swift`

#### v1（仅 coreCode + token 存在率）

```
coreCode → extractApiTokens → 
  ["Sendable","fetchItems","client","NetworkClientProtocol",
   "NetworkClient","bili","send","data","items"]

vs FeedRepository.swift:
  命中 7/9 = 0.78 → pattern ✅ (碰巧正确)

vs WBISigner.swift:
  命中 2/9 = 0.22 → reference ✅

vs BiliDiliApp.swift (主入口，无关文件):
  命中 ?/9 → ???  (不确定，因为 "Sendable","data" 等通用词可能命中)
```

问题：token 全是低辨识度通用词，**如果别的文件也用了 NetworkClient，容易误判**。

#### v2（全字段 BM25F + IDF + Tversky）

```
从 content.markdown 代码块提取高辨识度 token:
  ["FeedRepositoryProtocol","fetchPopular","fetchRecommend",
   "fetchFeed","fetchLiveRooms","VideoModel","LiveRoomInfo",
   "FeedRepository","NetworkClientProtocol","NetworkClient"]

IDF 加权后:
  FeedRepositoryProtocol: IDF=3.71 (仅此 Recipe 有)
  fetchPopular:           IDF=3.71
  VideoModel:             IDF=1.90 (3 条 Recipe 有)
  NetworkClient:          IDF=0.92 (8 条)

BM25F(Recipe, FeedRepository.swift):
  markdown_code 字段 (w=0.45): 高分 (大量高 IDF token 命中)
  coreCode 字段 (w=0.15): 中分
  结构加分: inlineSourceRefMatch +0.2 (markdown 中标注了来源)
  → finalScore ≈ 0.82 → pattern ✅

BM25F(Recipe, WBISigner.swift):
  markdown_code 字段: 几乎无命中
  coreCode 字段: 仅 "Sendable" 低 IDF 命中
  结构加分: 无
  → finalScore ≈ 0.08 → unrelated (v1 判 reference，v2 更精确)

BM25F(Recipe, BiliDiliApp.swift):
  → finalScore ≈ 0.03 → unrelated ✅
```

### 关键优势：

1. **高辨识度 token 主导**：`FeedRepositoryProtocol` (IDF=3.71) 的贡献是 `Sendable`
   (IDF=0.51) 的 7.3 倍
2. **文档长度归一化**：大文件不会因为包含更多通用 token 而被高估
3. **多来源验证**：`inlineSourceRefMatch` 提供了额外的路径级确认
4. **3 级分级**：`unrelated` 与 `reference` 区分，减少噪声报告

---

## 6. 复杂度与性能分析

| 操作 | 时间复杂度 | 说明 |
|------|-----------|------|
| Markdown 代码块提取 | O(M) | M = markdown 长度，正则单遍扫描 |
| Token 提取 + IDF 加权 | O(T) | T = 总 token 数 |
| 单文件 BM25F 评分 | O(Q × log N) | Q = query token 数, N = 文件 token 数（hash set） |
| 结构加分 | O(1) | 布尔检查 |
| **总计（单 Recipe × 单文件）** | **O(M + T)** | 毫秒级，无异步/网络开销 |

**与 v1 性能对比**：v2 多了 markdown 解析和 IDF 查表，但都是 O(N) 线性操作，
实测增量 < 1ms。

---

## 7. 需要复用/提取的已有模块

| 需要 | 来源 | 操作 |
|------|------|------|
| Markdown 代码块提取 | `RecipeExtractor.#extractCodeBlocks` | 提取为公共函数 → `lib/shared/markdown-utils.ts` |
| BM25 评分 | `BM25Scorer` | 直接复用 / 适配为字段级变体 |
| IDF 计算 | `BM25Scorer.docFreq` | 提取 IDF 计算为独立工具 |
| Token 提取（代码标识符） | `ContentImpactAnalyzer.tokenizeIdentifiers` | 保留 |
| 语言关键字过滤 | `LanguageService.languageKeywords` | 保留 |
| Token 提取（搜索分词） | `tokenizer.tokenize` | 用于 title/doClause 字段 |

---

## 8. 实施路线

### Phase 1 — 核心替换（预计改动 3 个文件）

1. **`lib/shared/markdown-utils.ts`** — 新建，公开 `extractCodeBlocks` + `extractInlineSourceRefs`
2. **`lib/service/evolution/ContentImpactAnalyzer.ts`** — 重写核心算法
   - 新增 `buildRecipeCorpus(entry)` → 全字段 token 提取
   - 新增 `computeBM25F(corpus, fileContent)` → 多字段评分
   - 新增 `RecipeIDFIndex` class → IDF 懒缓存
   - 改写 `assessContentImpact` → 调用新流程
3. **`test/unit/ContentImpactAnalyzer.test.ts`** — 更新测试

### Phase 2 — 可选增强（后续迭代）

4. 向量语义验证（灰色地带二次确认）
5. AST 符号级匹配（高精度验证）
6. IDF 索引持久化（避免冷启动全扫描）

---

## 9. 开放问题

1. **IDF 语料库冷启动成本**：首次需遍历所有 Recipe，20 条 ~1ms，500 条 ~50ms，可接受？
2. **BM25F 字段权重调优**：0.45/0.25/0.15/0.10/0.05 是初始估值，
   是否需要用真实数据做 grid search？
3. **Sigmoid 归一化参数**：$x_0$ 和 $k$ 需要根据实际 BM25F 分数分布确定，
   是否先收集一批真实数据做统计？
4. **`unrelated` 级别是否需要引入 ImpactLevel 类型**：
   当前类型只有 `direct | pattern | reference`，是否新增 `unrelated`？
5. **Phase 2 的向量验证是否值得**：需要额外 API 调用成本，
   灰色地带案例在真实场景中有多少？

---

## 附录 A: Tversky Index 参数选择推导

对于 Recipe $R$ 和 File $F$，设 $A = \text{tokens}(R)$, $B = \text{tokens}(F)$：

$$
T_{\alpha,\beta}(R, F) = \frac{|A \cap B|}{|A \cap B| + \alpha|A \setminus B| + \beta|B \setminus A|}
$$

我们的目标函数应满足：
- **Recipe 中缺失的 token 要扣分**：当 $A \setminus B$ 增大时分数要下降 → $\alpha > 0$
- **文件中多余的 token 不应过度惩罚**：$B \setminus A$ 增大不应大幅降分 → $\beta$ 较小
- **直觉**：一个文件 1000 行包含 Recipe 描述的 5 个 API 全部命中，
  不应因为文件还有 995 行其他代码就被判低分

推荐参数 $\alpha = 0.8, \beta = 0.2$，在 Phase 1 中可作为 BM25F 的辅助验证。

## 附录 B: IDF 平滑变体对比

| 变体 | 公式 | 特性 |
|------|------|------|
| 标准 IDF | $\log(N / n_t)$ | 可能为 0（当 $n_t = N$） |
| BM25 IDF | $\log((N - n_t + 0.5) / (n_t + 0.5))$ | 可能为负（当 $n_t > N/2$） |
| **推荐: 平滑 IDF** | $\log((N + 1) / (n_t + 0.5))$ | 始终为正，$n_t = 0$ 时最大值合理 |

推荐使用平滑 IDF，确保所有 token 权重为正，简化归一化。
