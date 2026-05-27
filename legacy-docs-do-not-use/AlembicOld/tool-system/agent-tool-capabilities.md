# Agent 工具能力架构：冷启动 & 增量扫描

> **状态**: 规划中 🔵  
> **最后更新**: 2026-05-02  
> **关联**: [cold-start-incremental-pipeline.md](./cold-start-incremental-pipeline.md)
>
> **文档结构**:
> - **Part I** (§1-9): 当前工具全景 + 业界最佳实践研究
> - **Part II** (§10-14): 下一代工具系统架构设计（ToolSpec、CapabilityV2、OutputCompressor）
> - **Part III** (§15-25): 每个工具的最佳实现规格（含业界标杆、接口定义、Token 效率目标）
>
> **落地实施方案**: → [tool-system-implementation.md](./tool-system-implementation.md)
> （基于实际代码的分阶段改造计划，含具体改造点、新建文件、测试计划）

---

## 1. 当前工具全景

冷启动和增量扫描管线中，内部 Agent（Analyst/Producer）使用以下工具集完成知识提取。
工具按职能分为 8 大类，底层共 **50+ 个工具定义**。
通过 Capability 白名单（如 `CodeAnalysis.tools`、`KnowledgeProduction.tools`），
每个阶段实际暴露给 LLM 的工具数为 **7-17 个**。

### 1.1 项目访问工具（5 个）

| 工具 | 文件 | 功能 | Token 效率特征 |
|------|------|------|---------------|
| `search_project_code` | `handlers/project-access.ts` | 正则/关键词搜索源码 | 支持批量 `patterns[]`、结果缓存、去重提示 |
| `read_project_file` | `handlers/project-access.ts` | 读取文件内容（支持行范围） | 支持批量 `filePaths[]`、行范围截取、去重缓存 |
| `list_project_structure` | `handlers/project-access.ts` | 目录树 + 文件统计 | 深度限制 (max 5)、过滤三方库 |
| `get_file_summary` | `handlers/project-access.ts` | 文件结构摘要（签名/导入/声明） | **低 Token**：只返回签名，不含实现体 |
| `semantic_search_code` | `handlers/project-access.ts` | 向量/BM25 语义搜索 | 结果截断 500 字符、支持 SearchEngine 降级 |

### 1.2 知识查询工具（6 个）

| 工具 | 文件 | 功能 |
|------|------|------|
| `search_recipes` | `handlers/query.ts` | 搜索知识库 Recipe（BM25 + SQL 降级） |
| `search_candidates` | `handlers/query.ts` | 搜索/列出候选项 |
| `get_recipe_detail` | `handlers/query.ts` | 获取单个 Recipe 完整详情 |
| `get_project_stats` | `handlers/query.ts` | 项目统计（Recipe/候选项/图谱） |
| `search_knowledge` | `handlers/query.ts` | RAG 语义搜索（BM25 + 向量 + Ranking） |
| `get_related_recipes` | `handlers/query.ts` | 知识图谱关联查询 |

### 1.3 AST 结构化分析 + Agent Memory 工具（11 个）

| 工具 | 文件 | 功能 |
|------|------|------|
| `get_project_overview` | `handlers/ast-graph.ts` | 项目 AST 概览 |
| `get_class_hierarchy` | `handlers/ast-graph.ts` | 类继承层级 |
| `get_class_info` | `handlers/ast-graph.ts` | 类/结构体详细信息（跨语言） |
| `get_protocol_info` | `handlers/ast-graph.ts` | 协议/接口/trait 信息 |
| `get_method_overrides` | `handlers/ast-graph.ts` | 方法覆写查询 |
| `get_category_map` | `handlers/ast-graph.ts` | Category/Extension 扩展映射 |
| `get_previous_analysis` | `handlers/ast-graph.ts` | 前序维度分析结果 |
| `note_finding` | `handlers/ast-graph.ts` | 记录关键发现（Agent Memory） |
| `get_previous_evidence` | `handlers/ast-graph.ts` | 检索前序维度证据 |
| `query_code_graph` | `handlers/ast-graph.ts` | 查询代码实体图谱 |
| `query_call_graph` | `handlers/ast-graph.ts` | 查询方法调用链 |

### 1.4 生命周期工具（10 个）

| 工具 | 文件 | 功能 |
|------|------|------|
| `submit_knowledge` | `handlers/lifecycle.ts` | 提交候选项（核心提交工具） |
| `approve_candidate` | `handlers/lifecycle.ts` | 批准候选 |
| `reject_candidate` | `handlers/lifecycle.ts` | 驳回候选 |
| `publish_recipe` | `handlers/lifecycle.ts` | 发布 Recipe |
| `deprecate_recipe` | `handlers/lifecycle.ts` | 弃用 Recipe |
| `update_recipe` | `handlers/lifecycle.ts` | 更新 Recipe |
| `record_usage` | `handlers/lifecycle.ts` | 记录使用 |
| `quality_score` | `handlers/lifecycle.ts` | 质量评分 |
| `validate_candidate` | `handlers/lifecycle.ts` | 候选校验 |
| `get_feedback_stats` | `handlers/lifecycle.ts` | 反馈统计 |

### 1.5 终端执行工具（3 级递进）

| 工具 | 文件 | 模式 | 能力 |
|------|------|------|------|
| `terminal_run` | `adapters/TerminalRunExecutor.ts` | `run` | 单命令执行，stdin 不可交互 |
| `terminal_shell` | `adapters/TerminalShellExecutor.ts` | `shell` | 管道/重定向/变量替换 |
| `terminal_pty` | `adapters/TerminalPtyExecutor.ts` | `pty` | 完整 TTY（需要终端交互场景） |

**工具集配置**（`BootstrapTerminalToolset.ts`）：

```
baseline         → 无终端工具
terminal-run     → [terminal_run]
terminal-shell   → [terminal_run, terminal_shell]
terminal-pty     → [terminal_run, terminal_shell, terminal_pty]
```

终端工具仅在 `analyze` 和 `evolve` 阶段启用，受安全约束：
- 禁止安装、网络操作、项目文件写入
- 命令在 macOS Seatbelt 沙箱中执行
- 支持超时、maxBuffer、AbortSignal 取消

### 1.6 Guard 安全工具（4 个）

| 工具 | 文件 | 功能 |
|------|------|------|
| `list_guard_rules` | `handlers/guard.ts` | 列出 Guard 规则 |
| `get_recommendations` | `handlers/guard.ts` | 获取推荐 Recipe |
| `guard_check_code` | `handlers/guard.ts` | Guard 检查代码 |
| `query_violations` | `handlers/guard.ts` | 查询违规历史 |

### 1.7 组合工具 + 元工具（6 个）

| 工具 | 文件 | 功能 |
|------|------|------|
| `analyze_code` | `handlers/composite.ts` | Guard + Recipe 搜索组合（一站式分析） |
| `knowledge_overview` | `handlers/composite.ts` | 知识库全貌一次获取 |
| `submit_with_check` | `handlers/composite.ts` | 查重 + 提交组合（减少一轮调用） |
| `get_tool_details` | `handlers/composite.ts` | 元工具：查询工具 Schema |
| `plan_task` | `handlers/composite.ts` | 元工具：任务规划 |
| `review_my_output` | `handlers/composite.ts` | 元工具：自我质量审查 |

### 1.8 其他工具

| 类别 | 工具 | 文件 |
|------|------|------|
| AI 分析 | `enrich_candidate`, `refine_bootstrap_candidates` | `handlers/ai-analysis.ts` |
| 扫描专用 | `collect_scan_recipe` | `handlers/scan-recipe.ts` |
| 知识图谱 | `check_duplicate`, `add_graph_edge` | `handlers/knowledge-graph.ts` |
| 进化决策 | `propose_evolution`, `confirm_deprecation`, `skip_evolution` | `handlers/evolution-tools.ts` |
| 基础设施 | `graph_impact_analysis`, `rebuild_index`, `query_audit_log` | `handlers/infrastructure.ts` |
| Skill | `load_skill`, `create_skill`, `suggest_skills` | `handlers/infrastructure.ts` |
| 系统交互 | `write_project_file`, `get_environment_info` | `handlers/system-interaction.ts` |

---

## 2. 业界最佳实践研究

### 2.1 AST 结构化分析 — Tree-sitter 驱动

| 方案 | 核心理念 | Token 节省 | 适用场景 |
|------|---------|-----------|---------|
| **pitlane-mcp** | Tree-sitter 索引 → 签名检索、符号查找、依赖图 | 70%+ | 大型代码库导航 |
| **cocoindex-code** | Tree-sitter AST → 语义嵌入 → 向量搜索 | 70% | 语义代码搜索 |
| **skltn** | Tree-sitter → 文件骨架化（签名+类型） | 5-15x 压缩 | 代码库浏览 |
| **mcp-server-tree-sitter** | 完整 AST 查询、符号提取、依赖分析、复杂度 | 高 | 结构化代码理解 |

**核心洞察**：

> Agent 需要的是代码**结构**而非**全文**。当 Agent 要理解一个函数如何调用时，
> 它很少需要 50 行的实现体，只需要函数名、参数、返回类型和一行 docstring。

**我们已有的基础**：

- Phase 1.5 使用 Tree-sitter 做 AST 分析（`astProjectSummary`）
- Phase 1.6 构建 Code Entity Graph
- Phase 1.7 构建 Call Graph
- `get_file_summary` 提供 Regex 级签名提取

**差距**：

1. **Tree-sitter 能力未暴露为工具** — Phase 1.5 的 AST 数据仅在管线内部使用，
   Agent 在维度分析时无法直接查询 AST
2. **缺少增量索引** — Tree-sitter 的增量解析能力未被利用于 rescan
3. **`get_file_summary` 使用正则而非 AST** — 准确度和覆盖度有限

### 2.2 搜索子代理架构

| 方案 | 架构 | 性能 | 成本节省 |
|------|------|------|---------|
| **WarpGrep v2** | 独立上下文窗口 + 8 并行工具调用/轮 | <5s | 15.6% 成本降低 |
| **Cognition Fast Context** | RL 训练搜索模型 + 8 并行调用 + 2800 tok/s | 极快 | 显著 |
| **Claude Explore Agent** | 只读子代理 + Glob/Grep/Read | ~75s | 上下文隔离 |

**核心洞察**：

> 搜索在独立上下文窗口中进行，丢弃死胡同，只返回相关的文件/行范围。
> 主代理的上下文保持干净。Anthropic 的多代理系统比单代理 Opus 高出 90%。

**我们的机会**：

- Internal Agent 当前在**单一上下文**中完成搜索和分析，搜索废料污染分析上下文
- 可引入「搜索子代理」模式：轻量模型执行搜索，只返回精炼的代码片段给分析代理

### 2.3 终端输出压缩

| 方案 | 策略 | 压缩率 | 实现方式 |
|------|------|--------|---------|
| **RTK** | 智能过滤 + 分组 + 截断 + 去重 | 60-99% | CLI 代理（Rust） |
| **trs** | 30+ 专用解析器 + 通用压缩 | 68-99% | 单二进制（6MB） |
| **lean-ctx** | Shell Hook + MCP Server + 42 工具 | 74-99% | Rust 二进制 |
| **Hypergrep** | 三级语义压缩 + 调用图 + Token 预算 | 87% | Rust + Tree-sitter |

**压缩策略（按 RTK 分类）**：

1. **智能过滤** — 移除进度条、ANSI 码、样板文本、时间信息
2. **分组聚合** — 按目录聚合文件、按类型聚合错误
3. **截断** — 保留相关上下文，裁剪冗余
4. **去重** — 折叠重复日志行（"error X appeared 47 times"）

**我们的差距**：

- 终端工具返回**原始完整输出**，无压缩
- Agent 运行 `find`/`grep`/`git` 等命令时，大量样板文本进入上下文

### 2.4 Token 管理策略

| 策略 | 效果 | 实现复杂度 |
|------|------|-----------|
| **签名优先检索** | 减少 70%+ 文件读取 token | 中（需 AST 索引） |
| **工具按需加载** (Tool Search) | 减少 85% 工具定义 token | 低（BM25/正则匹配） |
| **结果截断 + Token 预算** | 精确控制输出大小 | 低 |
| **增量缓存** | 避免重复读取 | 已有（search/read 缓存） |
| **上下文压缩** | 减少历史消息 token | 中 |
| **分层搜索** | Glob → Grep → Read 递进 | 已有部分 |

---

## 3. 优化路线图

### 3.1 Phase A — 终端输出压缩（高 ROI，低风险）

**目标**：终端工具输出自动压缩，减少 60-90% token 消耗。

**实现方案**：在 `TerminalExecutorShared.ts` 中增加输出后处理层。

```typescript
interface OutputCompressionConfig {
  enabled: boolean;
  strategy: 'auto' | 'aggressive' | 'none';
  maxOutputTokens: number;     // 默认 2000
  deduplicateThreshold: number; // 重复行折叠阈值，默认 3
}

interface CompressedOutput {
  compressed: string;         // 压缩后的输出
  originalBytes: number;      // 原始字节数
  compressedBytes: number;    // 压缩后字节数
  compressionRatio: number;   // 压缩比
  strategy: string;           // 使用的压缩策略
  truncated: boolean;         // 是否被截断
}
```

**压缩规则矩阵**：

| 命令类别 | 压缩策略 | 示例 |
|---------|---------|------|
| `git status` | 移除提示文本、提取变更文件列表 | "M: 3, A: 1, D: 0" |
| `git log` | 保留 hash+author+message，去详情 | 每条 1 行 |
| `git diff` | 保留 hunk 头 + 变更行，去相同行 | ±行 only |
| `find`/`ls` | 按目录分组、去重、限制深度 | 树状聚合 |
| `grep`/`rg` | 去上下文空行、按文件分组、限制总匹配数 | Top N per file |
| 测试输出 | 仅保留失败项摘要 + 通过计数 | "47 passed, 2 failed: ..." |
| 构建输出 | 仅保留错误/警告 + 结果状态 | errors only |
| 通用 | ANSI 过滤 + 行去重 + 长度截断 | trim + dedup |

### 3.2 Phase B — AST 智能查询工具（高 ROI，中等复杂度）

**目标**：将 Tree-sitter AST 能力暴露为 Agent 可调用的结构化工具。

**新增工具**：

| 工具名 | 功能 | 预期 Token 节省 |
|--------|------|----------------|
| `get_file_skeleton` | 返回文件的 AST 骨架（签名+类型+导入） | 70-85%（vs `read_project_file`） |
| `get_symbol_info` | 查询符号定义（函数/类/接口） | 90%+（vs 全文搜索） |
| `get_callers` | 查询谁调用了指定函数 | 新能力（替代多次 grep） |
| `get_dependencies` | 查询文件/模块的依赖关系 | 新能力（替代 import grep） |
| `check_symbol_exists` | 快速存在性检查（布尔返回） | 99%（vs grep 全扫） |
| `get_codebase_summary` | 全项目结构化摘要（一次性加载） | 替代多次 list_project_structure |

**`get_file_skeleton` 设计**：

```typescript
interface FileSkeletonParams {
  filePath: string;
  detail: 'minimal' | 'standard' | 'full';
  // minimal: 仅 export 名 + 类型
  // standard: 签名 + 参数 + 返回类型 + JSDoc 一行摘要
  // full: standard + 类成员 + 复杂度指标
}

interface FileSkeletonResult {
  filePath: string;
  language: string;
  imports: ImportInfo[];        // { source, specifiers }
  exports: ExportInfo[];        // { name, kind, signature }
  classes: ClassSkeleton[];     // { name, extends, implements, methods[], properties[] }
  functions: FunctionSkeleton[]; // { name, params, returnType, async, exported }
  types: TypeSkeleton[];        // { name, kind: 'interface'|'type'|'enum', members }
  lineCount: number;
  estimatedTokens: number;      // 原文件的预估 token 数
  skeletonTokens: number;       // 骨架的 token 数
}
```

**实现路径**：

1. 复用 Phase 1.5 已有的 Tree-sitter 解析能力
2. 增加按需解析模式（不需要全量 Phase 跑完）
3. 缓存解析结果（文件 hash → skeleton），增量更新

### 3.3 Phase C — 搜索结果压缩（中 ROI，低复杂度）

**目标**：对 `search_project_code` 和 `read_project_file` 的输出进行智能压缩。

**优化点**：

1. **分层搜索结果**（借鉴 Hypergrep 的 Layer 设计）:
   ```
   Layer 0: 文件路径 + 符号名 + 类型           ~15 tokens/result
   Layer 1: 签名 + 调用方/被调用方              ~80-120 tokens/result
   Layer 2: 完整源码                            ~200-800 tokens/result
   ```

2. **Token 预算控制**:
   ```typescript
   interface SearchWithBudget {
     pattern: string;
     tokenBudget?: number;    // 默认 3000
     layer?: 0 | 1 | 2;       // 默认 auto（根据预算自适应）
   }
   ```

3. **增量读取策略**:
   - 首次返回 Layer 0（概览）
   - Agent 感兴趣时调用 `read_project_file` 获取 Layer 2（详情）
   - 减少无效的全文加载

### 3.4 Phase D — 工具按需加载（低复杂度，高扩展性）

**目标**：减少每次 Agent 调用时的工具定义 token 开销。

**现状**：40+ 个工具全部加载到每个 Agent 会话 → 约 15K-20K tokens 的工具 schema。

**方案**：

1. **按维度过滤工具集**:
   ```typescript
   const DIMENSION_TOOL_PROFILES: Record<string, string[]> = {
     'code-standards':     ['search_project_code', 'read_project_file', 'get_file_summary',
                            'get_class_info', 'submit_knowledge'],
     'architecture':       ['get_project_overview', 'get_class_hierarchy', 'query_code_graph',
                            'query_call_graph', 'list_project_structure', 'submit_knowledge'],
     'error-handling':     ['search_project_code', 'read_project_file', 'get_class_info',
                            'terminal_run', 'submit_knowledge'],
     // ...
   };
   ```

2. **核心工具集 + 按需扩展**:
   ```
   Core (always): search_project_code, read_project_file, get_file_summary,
                  submit_knowledge, note_finding
   Extended (on demand): terminal_*, get_class_*, query_*_graph, semantic_search_*
   ```

3. **预期效果**：每个维度只加载 8-12 个工具（vs 40+），schema token 减少 60-70%。

**现状分析**（来自代码探索）：

> 当前系统**没有 per-dimension 工具过滤**。工具可见性由 Agent Capability 白名单控制：
> - `CodeAnalysis` → 搜索/AST/图/分析类工具
> - `KnowledgeProduction` → 读文件/校验/提交类工具
> - `ScanProduction` → 仅 `collect_scan_recipe` + `read_project_file`
>
> 维度差异仅体现在知识类型和 prompt 上下文，**不在工具集**。
> 终端工具通过 `additionalTools` 按 stage（analyze/evolve）注入。
>
> 这意味着 Phase D 可以在现有 Capability 机制上叠加维度级过滤，不需要新架构。

### 3.5 Phase E — 新增终端工具能力

**目标**：增强 Agent 在 analyze/evolve 阶段通过终端获取结构化信息的能力。

| 新工具 | 能力 | 实现 |
|--------|------|------|
| `terminal_structured_grep` | 结构化 ripgrep（JSON 输出 + 自动压缩） | `rg --json` → 解析 → 压缩 |
| `terminal_git_analysis` | Git 变更分析（blame/log/diff → 结构化） | `git` → 解析 → 摘要 |
| `terminal_dependency_check` | 依赖检查（package.json/Podfile → 版本+漏洞） | 包管理器 → 解析 |
| `terminal_test_run` | 测试执行（仅返回失败摘要 + 覆盖率） | test runner → 压缩输出 |
| `terminal_lint_check` | 静态分析（仅返回错误/警告摘要） | linter → 结构化输出 |

**`terminal_structured_grep` 设计**：

```typescript
interface StructuredGrepParams {
  pattern: string;
  path?: string;           // 默认项目根
  glob?: string;           // 文件过滤
  maxResults?: number;     // 默认 20
  contextLines?: number;   // 默认 1
  groupByFile?: boolean;   // 按文件分组，默认 true
}

interface StructuredGrepResult {
  matches: Array<{
    file: string;
    hits: Array<{ line: number; content: string; context?: string }>;
  }>;
  totalMatches: number;
  filesSearched: number;
  truncated: boolean;
}
```

**优势 vs 现有 `search_project_code`**：

- 使用 ripgrep 原生搜索（比 JS 正则 + 全文扫描快 10-100x）
- 结构化 JSON 输出，无 ANSI 噪声
- 自动按文件分组，压缩重复上下文
- 沙箱内执行，安全可控

---

## 4. Token 效率对比

### 4.1 单次操作 Token 对比

| 操作 | 当前估算 | 优化后估算 | 节省 |
|------|---------|-----------|------|
| 读取 500 行文件 | 3000-5000 tok | **200-400 tok**（skeleton） | 90%+ |
| 搜索 5 个关键词 | 5×1500 = 7500 tok | **3000 tok**（批量+压缩） | 60% |
| `git status` 输出 | 120-2000 tok | **30-50 tok** | 75-97% |
| `grep` 搜索结果 | 2000-16000 tok | **400-3200 tok** | 80% |
| 测试执行输出 | 5000-25000 tok | **50-2500 tok** | 90-99% |
| 工具 schema 加载 | 15000-20000 tok | **5000-7000 tok** | 65% |
| 目录列表 | 2000-3200 tok | **400-640 tok** | 80% |

### 4.2 完整冷启动会话 Token 预估

假设 7 个维度，每维度 ~15 轮工具调用：

| 阶段 | 当前估算 | 优化后估算 | 节省 |
|------|---------|-----------|------|
| 工具 schema（×7 维度） | 7×18K = 126K | 7×6K = **42K** | 67% |
| 项目搜索（×60 调用） | 60×2K = 120K | 60×0.8K = **48K** | 60% |
| 文件读取（×40 调用） | 40×3K = 120K | 40×0.4K = **16K** | 87% |
| 终端执行（×20 调用） | 20×3K = 60K | 20×0.5K = **10K** | 83% |
| **输入总计** | **~426K** | **~116K** | **73%** |

---

## 5. 实现优先级

| 优先级 | Phase | 预期 Token 节省 | 实现复杂度 | 风险 |
|--------|-------|----------------|-----------|------|
| **P0** | A. 终端输出压缩 | 60-99% per command | 低 | 低（后处理，不影响执行） |
| **P0** | D. 工具按需加载 | 60-70% schema tokens | 低 | 低（配置驱动） |
| **P1** | B. AST 智能查询 | 70-90% file reads | 中 | 中（需复用/扩展 AST 管线） |
| **P1** | C. 搜索结果压缩 | 60-80% search results | 低 | 低（输出层改造） |
| **P2** | E. 新增终端工具 | 新能力 + 结构化输出 | 中 | 低（增量添加） |

---

## 6. 关键设计原则

### 6.1 签名优先（Signature-First）

> 默认返回签名和结构信息，仅在 Agent 显式请求时提供完整实现。
> 这是业界共识的最高 ROI 优化——减少 70%+ 的文件读取 token。

### 6.2 结构化输出（Structured Output）

> 工具返回结构化 JSON 而非原始文本。结构化数据更易于 LLM 解析，
> 且可在传输层进行精确的 Token 预算控制。

### 6.3 渐进式详情（Progressive Detail）

> 实现三级详情渐进模式：
> - Level 0: 存在性 / 文件路径 / 符号名
> - Level 1: 签名 / 参数 / 类型 / 调用关系
> - Level 2: 完整源码（仅在必要时）

### 6.4 上下文隔离（Context Isolation）

> 搜索和探索操作应尽量在独立上下文中完成，
> 只将精炼结果注入主分析上下文，保持信噪比。

### 6.5 输出即预算（Output is Budget）

> 每个工具都应有 `maxOutputTokens` 参数（或全局配置），
> 超出预算时自动截断并附加 "truncated" 标记。
> Agent 可根据标记决定是否请求更多详情。

---

## 7. 架构集成点

### 7.1 与现有管线的集成

```
ProjectIntelligenceCapability (Phase 1-4)
    │
    ├── Phase 1.5 AST 分析 ──────────→ [新] ASTQueryService
    │                                      ↓
    │                                   get_file_skeleton
    │                                   get_symbol_info
    │                                   check_symbol_exists
    │
    ├── Phase 1.6 Entity Graph ──────→ [增强] query_code_graph
    ├── Phase 1.7 Call Graph ────────→ [增强] get_callers
    │
    └── Phase 2 Dependency ──────────→ [新] get_dependencies

BootstrapTerminalToolset
    │
    ├── terminal_run ────────────────→ [增强] + 输出压缩
    ├── terminal_shell ──────────────→ [增强] + 输出压缩
    └── [新] terminal_structured_grep
         terminal_git_analysis
         terminal_test_run
         terminal_lint_check
```

### 7.2 与 UnifiedToolCatalog 的集成

```typescript
// 工具按需加载配置
const DIMENSION_TOOL_FILTER = {
  enableDimensionFiltering: true,
  coreTools: ['search_project_code', 'read_project_file', 'get_file_summary',
              'submit_knowledge', 'note_finding', 'get_previous_evidence'],
  dimensionExtensions: {
    'architecture': ['query_code_graph', 'query_call_graph', 'get_class_hierarchy'],
    'code-standards': ['get_class_info', 'get_protocol_info'],
    'error-handling': ['terminal_run'],
    // ...
  },
};
```

### 7.3 与 TerminalExecutorShared 的集成

```
[Agent 调用 terminal_run]
    ↓
TerminalRunExecutor.execute()
    ↓
sandboxedExecFile()
    ↓
[原始输出: stdout + stderr]
    ↓
[新] OutputCompressor.compress(rawOutput, commandPattern)
    ↓
envelopeForTerminalResult(request, ...)
    ↓
  structuredContent: {
    stdout: compressedStdout,       // 压缩后
    stderr: compressedStderr,
    _compression: {                  // 新增元数据
      originalBytes, compressedBytes,
      ratio, strategy, truncated
    }
  }
    ↓
ToolResultPresenter.presentToolResult(envelope) → Agent 上下文
```

**关键接入点**：

- `TerminalEnvelopes.ts` — `envelopeForTerminalResult()` 构建输出信封
- `ToolResultEnvelope.structuredContent` — 已有字段，放压缩数据
- `ToolResultEnvelope.cache` — 已有 session/scope 缓存策略
- `ToolResultEnvelope.diagnostics.truncatedToolCalls` — 已有截断计数
- `TerminalExecutorShared.sandboxedExecFile()` — 沙箱执行的输出口

### 7.4 现有 Token 节省机制（已实现）

系统已有以下 Token 优化，可作为新优化的基础：

| 机制 | 位置 | 效果 |
|------|------|------|
| **搜索缓存** | `project-access.ts` `_searchCache` | 重复 pattern 返回缓存，0 额外 token |
| **读取缓存** | `project-access.ts` `_readCache` | 重复文件/行范围返回缓存 |
| **批量接口** | `search_project_code.patterns[]` | 减少 N-1 轮工具调用开销 |
| **批量接口** | `read_project_file.filePaths[]` | 减少 N-1 轮工具调用开销 |
| **搜索调用计数提醒** | `project-access.ts` `_searchCallCount` | >12 次搜索后提示用结构化工具 |
| **组合工具** | `composite.ts` `submit_with_check` | 查重+提交合一，省一轮 |
| **组合工具** | `composite.ts` `knowledge_overview` | 一次获取全貌，省多次查询 |
| **结果截断** | `semantic_search_code` 500 字符 | 限制语义搜索返回量 |
| **三方库过滤** | `THIRD_PARTY_RE` | 自动跳过 Pods/node_modules |
| **文件大小限制** | `MAX_FILE_SIZE = 512KB` | 跳过超大文件 |
| **工具结果截断** | `ContextWindow.limitToolResult` | 按 `maxChars`/`maxMatches` 截断，`search`/`read` 有专门分支 |
| **上下文压缩** | `ContextWindow.compactIfNeeded` L1-L4 | 按使用率阈值渐进压缩消息历史 |
| **Manifest 输出限制** | `CapabilityProjection maxOutputBytes: 16000` | 执行 profile 默认上限 |
| **Schema 懒加载** | `AgentRuntime.#getToolSchemas` | `toMixedSchemas` + `markToolsExpanded` 减轻首轮 schema 体积 |
| **阶段隔离** | `PipelineStrategy` stage 切换 | 新 stage 时 `ContextWindow.resetForNewStage`，清理上下文 |
| **会话 Token 上限** | `BudgetPolicy.maxSessionTokens` | Analyst 有显式上限，**Producer 未设** |

---

## 8. 已知问题与维护风险

| # | 问题 | 位置 | 影响 | 建议 |
|---|------|------|------|------|
| 1 | **Producer 缺少 session token cap** | `insight` preset 的 produce stage | 模型单次输出极大时仅靠 `maxIterations` 兜底 | 补充 `maxSessionTokens` |
| 2 | **`ANALYST_TOOLS` 常量未参与 `#collectTools`** | `insight-analyst.ts` | 与 `CodeAnalysis.tools` 可能漂移 | 统一为单源 |
| 3 | **内部/外部工具名不一致** | 内部 `submit_knowledge` vs MCP `alembic_submit_knowledge` | 文档与实现需对齐场景 | 统一命名映射表 |
| 4 | **`terminal_script` 对 Bootstrap 禁用** | `BootstrapTerminalToolset` | `terminalScriptAllowed: false`，可能限制多命令场景 | 评估是否可安全开放 |
| 5 | **Scan 工具面极窄** | `ScanProduction` 仅 2 个工具 | 设计如此，但扩展时需注意 | 保持文档同步 |
| 6 | **`RelevanceAuditor` 不存在** | 实际实现为 `auditRecipesForRescan` in `KnowledgeRescanPlanner.ts` | 外部引用可能找不到 | 统一术语 |

---

## 9. 参考资料

### 9.1 工具项目

| 项目 | 用途 | URL |
|------|------|-----|
| **pitlane-mcp** | Tree-sitter 代码智能 MCP | fazm.ai |
| **cocoindex-code** | AST 语义搜索 MCP | github.com/cocoindex-io/cocoindex-code |
| **WarpGrep** | 搜索子代理 | morphllm.com |
| **RTK** | CLI 输出压缩 | github.com/rtk-ai/rtk |
| **trs** | 终端输出压缩 | usetrs.dev |
| **lean-ctx** | Shell Hook + MCP Server | github.com/yvgude/lean-ctx |
| **Hypergrep** | 结构化搜索 + 调用图 | github.com/marjoballabani/hypergrep |
| **skltn** | Tree-sitter 文件骨架化 | — |
| **Repomix** | 仓库打包为 AI 友好格式 | repomix.com |

### 9.2 设计参考

| 文章/概念 | 核心观点 |
|----------|---------|
| MCP Strategies for Code Intelligence | 签名优先检索 + Tree-sitter 索引 → 70%+ token 节省 |
| Agentic Search (Morph) | 并行工具调用（8+/轮）+ 子代理隔离 → 上下文干净 |
| Token Management (Developer Toolkit) | 工具限制 <15、按需加载、模型匹配任务 |
| RTK / trs 压缩策略 | 4 策略（过滤/分组/截断/去重）→ 89% 平均压缩 |
| Tool Search (Anthropic) | 动态工具发现 → 85% schema token 减少 |

---

# Part II: 下一代工具系统 — 完全重新设计

> **设计目标**：在保留 Capability 工具集过滤机制的基础上，
> 将底层 50+ 个扁平工具重构为 **8 个高阶工具**（每个 Capability 暴露 3-6 个），
> 以**每个工具做到业界最佳**为核心，从架构和实现两个层面全面升级。

---

## 10. 现有系统评估

### 10.0 已有优势（保留）

当前系统已具备以下合理设计，新架构应保留：

| 设计 | 位置 | 评价 |
|------|------|------|
| **Capability 工具集过滤** | `CodeAnalysis.tools`（17 个）、`KnowledgeProduction.tools`（7 个）等 | 每个阶段只暴露 7-17 个工具给 LLM，**非全量 50+** |
| **批量接口** | `search_project_code.patterns[]`、`read_project_file.filePaths[]` | 减少多轮调用 |
| **搜索/读取缓存** | `_searchCache`、`_readCache` in `project-access.ts` | 避免重复请求 |
| **沙箱执行** | `sandboxedExecFile` + macOS Seatbelt | 终端安全 |
| **ContextWindow 截断** | `limitToolResult`、`compactIfNeeded` L1-L4 | 上下文管理 |
| **Schema 懒加载** | `AgentRuntime.#getToolSchemas` → `toMixedSchemas` | 减轻首轮体积 |
| **组合工具** | `submit_with_check`、`analyze_code` | 减少 Agent 轮次 |

> **关键纠正**：LLM 每次看到的是 **7-17 个工具**（由 Capability 白名单控制），
> 而非全部 50+ 个。但仍有改进空间——每个工具本身应做到业界最佳水平。

### 10.1 架构层面

| 问题 | 现状 | 影响 |
|------|------|------|
| **工具爆炸** | 50+ 工具平铺在一个 `RAW_TOOLS[]` 数组中（虽然 Capability 过滤只暴露子集） | 维护复杂；V1→V2 转换开销大 |
| **V1→V2 迁移包袱** | `ToolDefinition` → `toolDefV1ToV2` → `ToolDefinitionV2` + `ToolCapabilityManifest` | 三层抽象、推断链冗长（`CapabilityProjection.ts` 415 行） |
| **元数据散落** | `HTTP_DIRECT_TOOL_NAMES`、`SIDE_EFFECT_TOOL_NAMES`、`TOOL_GATEWAY_METADATA` 等 6 个 Set/Map | 新增工具需改 6 处，遗漏即 bug |
| **Capability 裸字符串绑定** | `get tools() { return ['search_project_code', ...] }` | 与 handler 无类型关联，改名必漏 |
| **无工具组合原语** | 每个工具独立执行，无 batch/pipeline 语义 | Agent 需多轮调用完成本可一轮的工作 |

### 10.2 Token 效率层面

| 问题 | 现状 | 浪费量 |
|------|------|--------|
| **全量工具 schema** | 50+ 工具定义每次全部发送给 LLM | ~15-20K tokens/session |
| **原始文件读取** | `read_project_file` 返回完整文本 | 500 行文件 ≈ 3-5K tokens |
| **原始终端输出** | `terminal_run` 返回 stdout/stderr 全文 | git/test 输出 ≈ 2-25K tokens |
| **搜索+读取两步模式** | 先 `search_project_code` → 再 `read_project_file` | 2 轮调用 + 重复上下文 |
| **Regex 签名提取** | `get_file_summary` 用正则，覆盖率和准确度有限 | 漏提 → Agent 回退全文读取 |
| **无渐进式详情** | 工具要么全返回要么不返回，无中间态 | 大量无用细节进入上下文 |

### 10.3 维护层面

| 问题 | 影响 |
|------|------|
| `ANALYST_TOOLS` 常量与 `CodeAnalysis.tools` 可能漂移 | Prompt 与实际可用工具不一致 |
| 内部 `submit_knowledge` vs MCP `alembic_submit_knowledge` 命名分裂 | 文档和测试容易混淆 |
| `BootstrapTerminalToolset` 独立于 Capability 体系 | 终端工具注入路径特殊 |
| Handler 文件按「用途」而非「资源」组织 | `composite.ts` 混合了查重+提交+元工具 |

---

## 11. 新工具系统设计

### 11.1 核心理念：8 个高阶工具

> **规则**：Agent 看到的工具 ≤ 10 个。每个工具是一个**多动作资源**，
> 通过 `action` 参数选择子能力，而非暴露 50 个独立端点。

```
旧: 50+ 个扁平工具
    search_project_code, read_project_file, list_project_structure,
    get_file_summary, get_class_info, get_class_hierarchy, ...

新: 8 个高阶工具
    code          — 代码探索（搜索/读取/骨架/结构）
    knowledge     — 知识库交互（查询/提交/校验）
    graph         — 图谱查询（AST/调用/依赖/实体）
    terminal      — 终端执行（命令/脚本 + 自动压缩）
    memory        — Agent 工作记忆（记录/检索/跨维度）
    guard         — 安全规则（检查/查询/推荐）
    evolution     — 知识进化（提案/废弃/跳过）
    meta          — 元能力（规划/自检/环境）
```

### 11.2 工具 Schema 设计

#### `code` — 代码探索工具

```typescript
interface CodeToolParams {
  action: 'search' | 'read' | 'skeleton' | 'structure' | 'summary'
         | 'symbol' | 'exists' | 'batch_read' | 'batch_search';

  // search / batch_search
  pattern?: string;
  patterns?: string[];       // batch_search
  isRegex?: boolean;
  fileFilter?: string;

  // read / batch_read
  filePath?: string;
  filePaths?: string[];      // batch_read
  startLine?: number;
  endLine?: number;

  // skeleton
  detail?: 'minimal' | 'standard' | 'full';

  // structure
  directory?: string;
  depth?: number;

  // symbol / exists
  symbolName?: string;
  symbolKind?: 'function' | 'class' | 'interface' | 'type' | 'variable';

  // 通用
  tokenBudget?: number;      // 输出 token 预算
  maxResults?: number;
}
```

**Action 映射**（旧 → 新）:

| 旧工具 | 新 action | Token 改进 |
|--------|-----------|-----------|
| `search_project_code` | `code.search` / `code.batch_search` | 同等 |
| `read_project_file` | `code.read` / `code.batch_read` | 同等 |
| `get_file_summary` | `code.skeleton`（Tree-sitter 驱动） | **-70%**（AST vs Regex） |
| `list_project_structure` | `code.structure` | 同等 |
| `semantic_search_code` | `code.search`（`isRegex: false` 自动走语义） | 合并 |
| *(新)* `check_symbol_exists` | `code.exists` | **-99%**（布尔返回） |
| *(新)* `get_symbol_info` | `code.symbol` | **-90%**（仅签名） |

**返回值增强**：

```typescript
interface CodeToolResult {
  action: string;
  data: unknown;              // 各 action 的具体返回

  _meta: {
    tokenEstimate: number;    // 本次返回的估算 token 数
    truncated: boolean;       // 是否被截断
    cached: boolean;          // 是否命中缓存
    hint?: string;            // 给 Agent 的提示
    availableDetail?: string; // 可请求的更高详情级别
  };
}
```

#### `knowledge` — 知识库交互工具

```typescript
interface KnowledgeToolParams {
  action: 'search' | 'get' | 'list' | 'submit' | 'submit_checked'
         | 'validate' | 'stats' | 'duplicate_check';

  // search
  query?: string;
  keyword?: string;
  mode?: 'keyword' | 'semantic' | 'auto';
  topK?: number;

  // get
  id?: string;

  // list
  filters?: { category?: string; language?: string; lifecycle?: string; knowledgeType?: string };

  // submit / submit_checked
  candidate?: {
    title: string;
    content: { markdown: string; pattern?: string; rationale?: string };
    kind: 'rule' | 'pattern' | 'fact';
    reasoning?: { whyStandard: string; sources: string[]; confidence: number };
    // ... Cursor 交付字段
  };

  // validate
  candidateId?: string;

  // duplicate_check
  threshold?: number;
}
```

**Action 映射**:

| 旧工具 | 新 action |
|--------|-----------|
| `search_recipes` / `search_candidates` | `knowledge.search` |
| `get_recipe_detail` | `knowledge.get` |
| `get_project_stats` | `knowledge.stats` |
| `search_knowledge` | `knowledge.search`（`mode: 'semantic'`） |
| `get_related_recipes` | `graph.related`（移至 graph 工具） |
| `submit_knowledge` | `knowledge.submit` |
| `submit_with_check` | `knowledge.submit_checked` |
| `validate_candidate` | `knowledge.validate` |
| `check_duplicate` | `knowledge.duplicate_check` |

#### `graph` — 图谱查询工具

```typescript
interface GraphToolParams {
  action: 'overview' | 'hierarchy' | 'class' | 'protocol' | 'callers'
         | 'callees' | 'entity' | 'related' | 'impact' | 'dependencies';

  // overview — 项目全景
  // hierarchy — 类继承树（可选 rootClass）
  rootClass?: string;

  // class / protocol
  name?: string;
  includeMembers?: boolean;

  // callers / callees
  methodName?: string;
  className?: string;
  maxDepth?: number;

  // entity — 代码实体图谱查询
  entityQuery?: string;
  entityType?: 'class' | 'function' | 'module' | 'file';

  // related / impact — 知识图谱
  recipeId?: string;
  relation?: string;

  // dependencies
  filePath?: string;
  direction?: 'imports' | 'importedBy' | 'both';
}
```

**Action 映射**:

| 旧工具 | 新 action |
|--------|-----------|
| `get_project_overview` | `graph.overview` |
| `get_class_hierarchy` | `graph.hierarchy` |
| `get_class_info` | `graph.class` |
| `get_protocol_info` | `graph.protocol` |
| `get_method_overrides` | `graph.class`（`includeMembers: true`） |
| `get_category_map` | `graph.class`（ObjC Extension 查询） |
| `query_code_graph` | `graph.entity` |
| `query_call_graph` | `graph.callers` / `graph.callees` |
| `get_related_recipes` | `graph.related` |
| `graph_impact_analysis` | `graph.impact` |
| *(新)* `get_dependencies` | `graph.dependencies` |

#### `terminal` — 终端执行工具

```typescript
interface TerminalToolParams {
  action: 'run' | 'shell' | 'grep' | 'git' | 'test' | 'lint';

  // run — 结构化命令
  command?: string;
  args?: string[];

  // shell — shell 表达式
  script?: string;

  // grep — 结构化 ripgrep
  pattern?: string;
  path?: string;
  glob?: string;
  contextLines?: number;

  // git — 结构化 git 操作
  gitAction?: 'status' | 'log' | 'diff' | 'blame';
  gitArgs?: Record<string, unknown>;

  // test — 测试执行
  testCommand?: string;

  // lint — 静态分析
  lintCommand?: string;

  // 通用
  cwd?: string;
  timeout?: number;
  compression?: 'auto' | 'aggressive' | 'none';
  maxOutputTokens?: number;
}
```

**关键改进**：

- **所有输出自动压缩**：内置 OutputCompressor，默认 `compression: 'auto'`
- **结构化子命令**：`grep`/`git`/`test`/`lint` 有专用解析器，返回结构化 JSON
- **Token 预算**：`maxOutputTokens` 精确控制输出大小
- **沙箱继承**：复用现有 `sandboxedExecFile`，安全策略不变

#### `memory` — Agent 工作记忆

```typescript
interface MemoryToolParams {
  action: 'note' | 'recall' | 'previous_analysis' | 'cross_dimension';

  // note — 记录发现
  finding?: string;
  evidence?: string;
  importance?: number;

  // recall — 检索记忆
  query?: string;
  dimId?: string;

  // previous_analysis — 前序维度结果
  // cross_dimension — 跨维度关联
}
```

#### `guard` — 安全规则工具

```typescript
interface GuardToolParams {
  action: 'check' | 'rules' | 'violations' | 'recommendations';
  code?: string;
  language?: string;
  limit?: number;
}
```

#### `evolution` — 知识进化工具

```typescript
interface EvolutionToolParams {
  action: 'propose' | 'deprecate' | 'skip';
  recipeId: string;
  reason?: string;
  evidence?: Record<string, unknown>;
  confidence?: number;
}
```

#### `meta` — 元能力工具

```typescript
interface MetaToolParams {
  action: 'plan' | 'review' | 'environment' | 'tools';
  // plan — 任务规划
  task?: string;
  // review — 自检
  output?: string;
  // environment — 环境探测
  sections?: string[];
  // tools — 查询可用工具
  toolQuery?: string;
}
```

---

## 12. 新架构设计

### 12.1 工具注册（替代 RAW_TOOLS + CapabilityProjection）

```typescript
// 新: 单文件声明，声明即配置
const TOOL_REGISTRY: ToolSpec[] = [
  {
    id: 'code',
    title: 'Code Explorer',
    description: '搜索、读取、分析项目源码。支持关键词搜索、文件读取、'
               + 'AST 骨架提取、目录结构浏览。',
    actions: {
      search:       { risk: 'read',  cache: 'session' },
      batch_search: { risk: 'read',  cache: 'session' },
      read:         { risk: 'read',  cache: 'session' },
      batch_read:   { risk: 'read',  cache: 'session' },
      skeleton:     { risk: 'read',  cache: 'persistent' },
      structure:    { risk: 'read',  cache: 'session' },
      summary:      { risk: 'read',  cache: 'persistent' },
      symbol:       { risk: 'read',  cache: 'persistent' },
      exists:       { risk: 'read',  cache: 'persistent' },
    },
    outputBudget: { default: 3000, max: 8000 },
    compression: 'auto',
  },
  {
    id: 'terminal',
    title: 'Terminal',
    description: '在沙箱中执行命令。输出自动压缩，支持结构化 grep/git/test。',
    actions: {
      run:   { risk: 'system', cache: 'none', sandbox: true },
      shell: { risk: 'system', cache: 'none', sandbox: true },
      grep:  { risk: 'read',   cache: 'session', sandbox: true },
      git:   { risk: 'read',   cache: 'session', sandbox: true },
      test:  { risk: 'system', cache: 'none', sandbox: true },
      lint:  { risk: 'read',   cache: 'session', sandbox: true },
    },
    outputBudget: { default: 2000, max: 5000 },
    compression: 'auto',
    constraints: [
      '禁止安装、网络操作、项目写入',
      'grep 优先于 shell grep',
    ],
  },
  // ... knowledge, graph, memory, guard, evolution, meta
];
```

**对比现有系统**：

| 维度 | 现有 | 新设计 |
|------|------|--------|
| 工具定义数 | 50+ ToolDefinition | **8 个 ToolSpec** |
| Schema 声明 | 分散在 14 个 handler 文件 | **单文件 `TOOL_REGISTRY`** |
| 元数据配置 | 6 个独立 Set/Map 推断 | **声明式 `actions` 属性** |
| 输出控制 | 无 | **`outputBudget` + `compression`** |
| 缓存策略 | 各 handler 自行实现 | **声明式 `cache` per action** |
| 风险评级 | `CapabilityProjection` 400 行推断 | **声明式 `risk` per action** |

### 12.2 Capability 重设计

```typescript
// 旧: 裸字符串列表 + 手写 prompt
class CodeAnalysis extends Capability {
  get tools() {
    return ['search_project_code', 'read_project_file', ...]; // 17 个字符串
  }
}

// 新: 类型安全的 Action 白名单 + 自动生成 prompt
interface CapabilityV2 {
  name: string;
  allowedActions: Record<string, string[]>; // toolId → action[]
  outputBudgetOverride?: Record<string, number>;
  promptTemplate: string;
}

const ANALYZE_CAPABILITY: CapabilityV2 = {
  name: 'analyze',
  allowedActions: {
    code:     ['search', 'batch_search', 'read', 'batch_read', 'skeleton', 'structure', 'symbol', 'exists'],
    graph:    ['overview', 'hierarchy', 'class', 'protocol', 'callers', 'callees', 'entity', 'dependencies'],
    memory:   ['note', 'recall', 'previous_analysis', 'cross_dimension'],
    terminal: ['grep', 'git', 'run'],  // 按 toolset 动态追加
    guard:    ['check'],
  },
  promptTemplate: `...`,  // 从 actions 自动生成工具说明
};

const PRODUCE_CAPABILITY: CapabilityV2 = {
  name: 'produce',
  allowedActions: {
    code:      ['read', 'batch_read'],
    knowledge: ['submit', 'submit_checked', 'validate', 'duplicate_check'],
    meta:      ['review'],
  },
  outputBudgetOverride: { knowledge: 1000 },
  promptTemplate: `...`,
};

const EVOLVE_CAPABILITY: CapabilityV2 = {
  name: 'evolve',
  allowedActions: {
    code:      ['search', 'read', 'skeleton'],
    knowledge: ['search', 'get'],
    graph:     ['callers', 'entity'],
    evolution: ['propose', 'deprecate', 'skip'],
  },
  promptTemplate: `...`,
};
```

**优势**：

- **类型安全**：`allowedActions` 的 key 必须匹配 `TOOL_REGISTRY` 的 id
- **细粒度控制**：可以只开放 `code.read` 而不开放 `code.search`
- **自动 prompt 生成**：从 `ToolSpec.description` + `action` 列表自动构建工具说明
- **终端工具统一管理**：不再需要 `BootstrapTerminalToolset` 的特殊注入路径

### 12.3 输出压缩中间层

```typescript
interface OutputCompressor {
  compress(raw: string, context: CompressionContext): CompressedOutput;
}

interface CompressionContext {
  toolId: string;
  action: string;
  command?: string;         // 终端命令标识
  tokenBudget: number;      // 剩余 token 预算
  strategy: 'auto' | 'aggressive' | 'none';
}

interface CompressedOutput {
  text: string;             // 压缩后的文本
  structured?: unknown;     // 可选的结构化数据
  meta: {
    originalTokens: number;
    compressedTokens: number;
    ratio: number;
    strategy: string;
    truncated: boolean;
  };
}
```

**压缩策略管线**：

```
[原始输出]
    ↓
1. ANSI Strip — 移除控制字符
    ↓
2. Pattern Match — 识别命令类型（git/test/grep/ls/...）
    ↓
3. Structured Parse — 专用解析器提取结构化数据
    ↓
4. Dedup — 折叠重复行（"appeared N times"）
    ↓
5. Budget Fit — 按 tokenBudget 截断
    ↓
6. Meta Attach — 附加压缩元数据
    ↓
[CompressedOutput]
```

**内置解析器**:

| 命令模式 | 解析器 | 输出格式 |
|---------|--------|---------|
| `git status` | GitStatusParser | `{ staged: [], modified: [], untracked: [] }` |
| `git log` | GitLogParser | `[{ hash, author, date, message }]` |
| `git diff` | GitDiffParser | `[{ file, hunks: [{ header, changes }] }]` |
| `rg` / `grep` | GrepParser | `[{ file, matches: [{ line, content }] }]` |
| `*test*` | TestParser | `{ passed, failed, errors: [{ test, message }] }` |
| `*lint*` | LintParser | `{ errors: N, warnings: N, items: [...] }` |
| `ls` / `find` | TreeParser | 按目录分组的树结构 |
| `*` | GenericParser | 行去重 + ANSI 清理 + 截断 |

### 12.4 Token 预算系统

```typescript
interface TokenBudgetManager {
  /** 当前会话剩余预算 */
  remaining(): number;

  /** 为单次工具调用分配预算 */
  allocate(toolId: string, action: string): number;

  /** 记录实际消耗 */
  record(toolId: string, action: string, actual: number): void;

  /** 按历史使用量优化分配 */
  optimize(): void;
}
```

**分配策略**：

```
Session Budget (e.g. 100K tokens)
    ├── Schema Budget (固定): 8 工具 × ~300 tok = ~2.4K    (vs 现有 15-20K)
    ├── System Prompt (固定): ~2K
    └── Working Budget: ~95K
        ├── Per-turn: min(8K, remaining / estimatedTurns)
        └── Per-tool-call: min(toolSpec.outputBudget.default, turnBudget * 0.6)
```

---

## 13. 迁移策略

### 13.1 兼容层（Phase 0）

```typescript
// 旧 handler 包装为新 action
function wrapLegacyHandler(toolId: string, action: string, legacyHandler: Function) {
  return async (params: Record<string, unknown>, ctx: ToolContext) => {
    const raw = await legacyHandler(params, ctx);
    return compressor.compress(JSON.stringify(raw), {
      toolId, action,
      tokenBudget: budgetManager.allocate(toolId, action),
      strategy: 'auto',
    });
  };
}

// 旧工具自动映射
const LEGACY_MAPPING = {
  'search_project_code': { tool: 'code', action: 'search' },
  'read_project_file':   { tool: 'code', action: 'read' },
  'get_file_summary':    { tool: 'code', action: 'skeleton' },
  'terminal_run':        { tool: 'terminal', action: 'run' },
  // ...
};
```

### 13.2 分阶段实施

| Phase | 内容 | 风险 | 预计工作量 |
|-------|------|------|-----------|
| **0. 兼容层** | 新旧工具并行，旧工具通过映射表路由到新 action | 零风险 | 2-3 天 |
| **1. code 工具** | 实现 `code` 高阶工具 + `skeleton`（Tree-sitter） | 低 | 3-5 天 |
| **2. terminal 工具** | 实现 OutputCompressor + 结构化解析器 | 低 | 2-3 天 |
| **3. knowledge + graph** | 合并知识查询和图谱工具 | 中 | 3-4 天 |
| **4. 其余工具** | memory, guard, evolution, meta | 低 | 2-3 天 |
| **5. Capability V2** | 切换到 Action 白名单 + 自动 prompt | 中 | 2-3 天 |
| **6. 清理** | 移除旧 handler、V1 定义、CapabilityProjection | 低 | 1-2 天 |
| **总计** | | | **15-23 天** |

### 13.3 验证标准

| 指标 | 目标 |
|------|------|
| 工具 Schema token | < 3K（现有 15-20K） |
| 平均工具调用 token | 减少 60%+ |
| 终端输出 token | 减少 80%+ |
| 文件读取 token（skeleton） | 减少 70%+ |
| 冷启动总 token | < 150K（现有 ~426K） |
| Agent 完成率 | ≥ 现有水平 |
| 维度分析质量 | ≥ 现有水平 |

---

## 14. 新旧系统对比总览

### 14.1 Token 对比

| 操作 | 旧系统 | 新系统 | 改进 |
|------|--------|--------|------|
| 工具 Schema 加载 | 15-20K | **2-3K** | -85% |
| 读 500 行文件 | 3-5K | **200-400**（skeleton） | -90% |
| 搜索 5 个关键词 | 7.5K | **3K**（batch + 压缩） | -60% |
| `git status` | 120-2K | **30-50** | -97% |
| `grep` 结果 | 2-16K | **400-3.2K** | -80% |
| 测试执行输出 | 5-25K | **50-500** | -98% |
| 完整冷启动 | ~426K | **~100K** | **-76%** |

### 14.2 架构对比

| 维度 | 旧系统 | 新系统 |
|------|--------|--------|
| LLM 可见工具数 | 7-17 (Capability 过滤后) | **3-6** (CapabilityV2 + Action 白名单) |
| 工具定义文件数 | 14 handler + catalog + projection | **1 registry + 8 handler** |
| 元数据配置 | 6 个散落的 Set/Map | **声明式 ToolSpec** |
| Capability 绑定 | 裸字符串列表 | **类型安全 Action 白名单** |
| 输出控制 | 无 | **OutputCompressor + TokenBudget** |
| 缓存策略 | handler 自行实现 | **声明式 per-action cache** |
| 终端工具管理 | `BootstrapTerminalToolset` 特殊路径 | **统一 Capability V2** |
| AST 能力 | 仅 Phase 1.5 内部 | **暴露为 `code.skeleton` / `code.symbol`** |

### 14.3 开发者体验对比

```typescript
// 旧: 新增一个工具需要改 6+ 处
// 1. handlers/xxx.ts — handler 实现
// 2. handlers/index.ts — import + RAW_TOOLS 数组
// 3. CapabilityProjection.ts — HTTP_DIRECT/SIDE_EFFECT/GATEWAY 三个 Set
// 4. capabilities/Xxx.ts — Capability.tools 字符串列表
// 5. prompts/insight-analyst.ts — prompt 描述
// 6. (可选) BootstrapTerminalToolset.ts — 终端特殊路径

// 新: 新增一个 action 只改 2 处
// 1. TOOL_REGISTRY — 在对应 ToolSpec.actions 中加一行
// 2. handler/code.ts — 在 switch(action) 中加一个 case
// Capability 白名单自动继承，prompt 自动生成，元数据声明式完成
```

---

# Part III: 每个工具的最佳实现规格

> **设计哲学**：不只是减少工具数量，而是确保每个工具的每个 action
> 都达到业界最佳水平。以下为每个工具的详细最佳实现规格，包含
> 业界参考、核心算法、输出格式和 token 效率目标。

## 15. `code` — 代码智能工具

### 15.1 `code.search` — 代码搜索

**业界标杆**：ripgrep（rg）— 所有主流 AI Agent 的标准搜索引擎

| Agent | 搜索工具 | 来源 |
|-------|---------|------|
| Claude Code | ripgrep (Grep tool) | GitHub issue #735 |
| GitHub Copilot CLI | ripgrep | GitHub Blog 2025 |
| OpenAI Codex | ripgrep (主), grep (fallback) | Codex CLI repo |
| Aider | grep-ast (tree-sitter + rg) | Aider repo |
| Cursor | ripgrep | 内部 codebase indexing |

**最佳实现规格**：

```typescript
interface CodeSearchAction {
  action: 'search';
  params: {
    /** 搜索模式，支持正则 */
    patterns: string[];
    /** 文件 glob 过滤（映射到 rg --glob） */
    glob?: string;
    /** rg --type 过滤 (js, py, rust...) */
    fileType?: string;
    /** 上下文行数（映射到 rg -C） */
    contextLines?: number;           // 默认 2
    /** 最大返回结果数 */
    maxResults?: number;             // 默认 20
    /** 输出模式 */
    outputMode?: 'content' | 'files' | 'count';
    /** 是否大小写不敏感 */
    caseInsensitive?: boolean;
  };
}
```

**核心实现要点**：

1. **引擎**：`rg --json` 模式获取结构化输出，不经 shell 管道
2. **批量处理**：`patterns[]` 数组内部并行执行，结果合并去重
3. **自动 .gitignore**：ripgrep 原生尊重 `.gitignore`，无需额外配置
4. **结构化输出压缩**：
   ```json
   {
     "total": 23,
     "shown": 20,
     "matches": [
       { "file": "src/auth.ts", "line": 42, "content": "export function authenticate(...)", "context": ["...", "..."] }
     ]
   }
   ```
5. **三层搜索架构**（参考 ast-grep 博客）：
   - L1: ripgrep — 精确文本匹配（< 100ms）
   - L2: ast-grep — 结构化 AST 模式匹配（当 `pattern` 以 `$` 开头时自动切换）
   - L3: 语义搜索 — 向量嵌入（当 `pattern` 为自然语言时 fallback）

**Token 效率**：
- 旧系统：原始 rg 文本输出 → 2-16K tokens/搜索
- 新系统：结构化 JSON + 去重 + budget 截断 → **400-3.2K tokens/搜索**（-80%）

### 15.2 `code.read` — 文件读取

**业界标杆**：Sweep AI "Smart Read" + Cline chunked reading + LeanCTX auto-delta

| 技术 | 来源 | 核心思想 |
|------|------|---------|
| 自适应 outline | Sweep AI Blog | 大文件自动返回 outline 而非全文 |
| line-range chunking | Cline `read_file` (start_line/end_line) | 1000 行默认上限 + 分页提示 |
| Auto-delta encoding | LeanCTX v1.8 | 再次读取时只返回 diff（98.9% 节省） |
| 符号级检索 | "Symbols Not Chunks" (DEV Community) | AST 符号级读取 vs 固定分块，3.9x 少 token |

**最佳实现规格**：

```typescript
interface CodeReadAction {
  action: 'read';
  params: {
    path: string;
    /** 可选：行范围（1-based, inclusive） */
    startLine?: number;
    endLine?: number;
    /** 可选：强制模式覆盖自适应逻辑 */
    mode?: 'full' | 'outline' | 'delta';
  };
}
```

**自适应读取策略**（对 LLM 透明，无需 LLM 判断）：

```
[read(path)]
    ↓
if 缓存命中 && mode != 'full':
    → Auto-Delta: Myers diff, 只返回变更 hunks (98.9% 节省)
    ↓
if lines < 300:
    → 返回全文 (符合 token 预算)
    ↓
if lines < 1000:
    → 返回全文 + 行号标注 (供后续 line-range 读取)
    ↓
if lines >= 1000 && 无 startLine/endLine:
    → 返回 AST outline (class/func/method 骨架 + 行号)
    → 附加提示: "File has N lines. Showing outline. Use startLine/endLine to read specific sections."
    ↓
if startLine/endLine 已指定:
    → 返回指定范围 + 行号标注
```

**关键实现细节**：

1. **outline 生成**：Tree-sitter AST 解析（非 regex），18 种语言支持
2. **outline 自适应深度**（参考 Sweep AI）：
   - 全深度 outline < 10K tokens → 直接返回
   - 否则逐级收缩深度（depth 10 → 9 → ... → 1），加 `(N children)` 折叠标记
3. **Delta 缓存**：基于 MD5 hash 检测文件变更，Myers diff (similar crate / js 实现)
4. **行号格式**：`LINE_NUMBER|CONTENT`（与 Cursor 一致，便于后续 line-range 引用）

**Token 效率**：
- 旧系统：500 行文件 → 3-5K tokens
- 新系统：outline 模式 → **200-400 tokens**（-90%）；delta 模式 → **30-50 tokens**（-99%）

### 15.3 `code.skeleton` — 文件骨架提取

**业界标杆**：LeanCTX Tree-sitter engine + swift-skeleton MCP + Roo-Code tree-sitter service

| 特性 | Regex (旧) | Tree-sitter (新, LeanCTX 标准) |
|------|-----------|------------------------------|
| 多行签名 | ❌ 遗漏 | ✅ 完整解析 |
| 箭头函数 | ❌ 遗漏 | ✅ 完整解析 |
| 嵌套类/方法 | 缩进启发式 | ✅ AST 作用域追踪 |
| 装饰器 | ❌ 忽略 | ✅ 关联到定义 |
| 语言支持 | 4 | **18** |
| 准确率 | ~85% | **~99%** |

**最佳实现规格**：

```typescript
interface CodeSkeletonAction {
  action: 'skeleton';
  params: {
    path: string;
    /** 过滤定义类型 */
    kinds?: ('function' | 'class' | 'interface' | 'type' | 'method' | 'enum')[];
    /** 最大深度（默认不限，大文件自动收缩） */
    maxDepth?: number;
    /** 是否包含参数签名（默认 true） */
    includeParams?: boolean;
  };
}
```

**核心实现**（参考 LeanCTX + swift-skeleton）：

1. **语法加载**：`createTreeSitterLoader().init(language)` — 语法按需加载、缓存
2. **AST 解析**：`parser.parse(sourceCode)` — 单次全文解析
3. **SCM Query**：每种语言预编译的 tree-sitter query（capture `@definition`）
4. **Signature 提取**：`{ name, kind, line, params, returnType, visibility, async }`
5. **确定性排序**：按 `path → line → name` 排序（保证结果稳定）
6. **紧凑输出格式**（参考 swift-skeleton）：
   ```
   class AuthService [src/auth/service.ts:1-245]
     props: config:AuthConfig, db:Database
     methods:
       async authenticate(credentials:Credentials) → Promise<User> [12-45]
       private hashPassword(pwd:string) → string [47-62]
       validateToken(token:string) → TokenPayload [64-120]
   ```

**与现有系统对比**：
- 当前 `get_file_summary`：regex 提取 → ~85% 准确率，不支持多行签名
- 新 `code.skeleton`：Tree-sitter AST → **~99% 准确率**，完整参数类型

### 15.4 `code.symbol` — 符号查找

**业界标杆**：AST 符号级检索 vs RAG 分块 → 3.9x 更少 token

**最佳实现规格**：

```typescript
interface CodeSymbolAction {
  action: 'symbol';
  params: {
    /** 符号名称（精确或模糊） */
    name: string;
    /** 符号类型过滤 */
    kind?: 'function' | 'class' | 'interface' | 'type' | 'variable';
    /** 返回完整实现还是仅签名 */
    detail?: 'signature' | 'full';   // 默认 'signature'
    /** 最大结果数 */
    limit?: number;                  // 默认 10
  };
}
```

**核心实现**：

1. **索引构建**：cold start Phase 1.5 已有 AST 索引，复用
2. **两阶段查询**（参考 "Symbols Not Chunks" 论文）：
   - Stage 1: BM25 over symbol metadata → 返回 `{ name, kind, file, lineRange }` (~370 tokens/5 结果)
   - Stage 2: LLM 选择后按需 `code.read(file, startLine, endLine)` → 加载完整实现
3. **对比优势**：RAG 分块 ~1800-2900 tokens/5 结果；符号级 ~370 tokens/5 结果

## 16. `terminal` — 终端执行工具

### 16.1 `terminal.exec` — 命令执行

**业界标杆**：macOS Seatbelt 沙箱 + 结构化输出压缩

**最佳实现规格**：

```typescript
interface TerminalExecAction {
  action: 'exec';
  params: {
    command: string;
    /** 工作目录（默认项目根） */
    cwd?: string;
    /** 超时（ms，默认 30000） */
    timeout?: number;
    /** 期望的输出处理模式 */
    outputMode?: 'raw' | 'structured' | 'silent';
  };
}
```

**核心实现要点**：

1. **沙箱执行**：保留 macOS Seatbelt 沙箱（`sandbox-exec -f profile`）
2. **命令级输出压缩**（OutputCompressor 内置 8 个专用解析器）：

| 命令模式 | 解析器 | 结构化输出 | 压缩率 |
|---------|--------|-----------|--------|
| `git status` | GitStatusParser | `{ staged:[], modified:[], untracked:[] }` | **97%** |
| `git log` | GitLogParser | `[{ hash7, author, date, message }]` | 80% |
| `git diff` | GitDiffParser | `[{ file, +lines, -lines, hunks }]` | 70% |
| `rg` / `grep` | GrepParser | `[{ file, line, content }]` | 75% |
| `vitest`/`jest` | TestParser | `{ passed:N, failed:N, errors:[ {test, msg} ] }` | **98%** |
| `eslint`/`biome` | LintParser | `{ errors:N, warnings:N, top5:[] }` | 90% |
| `ls` / `find` | TreeParser | 目录树结构 | 60% |
| `npm` / `pnpm` | PackageParser | `{ added:N, removed:N, warnings:[] }` | 85% |

3. **ANSI 清理**：移除所有 ANSI 控制字符（`\x1b[...m`）—— 节省 10-30% 无用 token
4. **重复行折叠**：连续相同行折叠为 `"(repeated N times)"`
5. **流式超时**：支持 PTY 模式，超时后返回已收集的部分输出

### 16.2 `terminal.grep` — 集成 ripgrep

**设计决策**：`terminal.grep` 不是独立工具，而是 `code.search` 的底层实现。
当 `code.search` 执行时，内部调用 `rg --json` 并通过 GrepParser 返回结构化结果。
Agent 不直接使用 `terminal.grep`，而是通过 `code.search` 获得增强体验。

### 16.3 `terminal.test` — 测试执行

**最佳实现规格**：

```typescript
interface TerminalTestAction {
  action: 'test';
  params: {
    /** 测试文件/目录/pattern */
    target?: string;
    /** 是否只运行失败的测试 */
    failedOnly?: boolean;
    /** 超时 */
    timeout?: number;            // 默认 60000
  };
}
```

**输出压缩策略**（TestParser）：

```
输入（vitest 原始输出, 5-25K tokens）:
  ✓ auth.test.ts > login > should authenticate (12ms)
  ✓ auth.test.ts > login > should reject invalid (3ms)
  ... 200 more passing tests ...
  ✗ auth.test.ts > session > should expire
    Error: expected 'expired' but got 'active'
    at Object.<anonymous> (auth.test.ts:142:5)

压缩输出（50-500 tokens）:
  { "passed": 202, "failed": 1, "duration": "4.2s",
    "failures": [{
      "test": "auth > session > should expire",
      "file": "auth.test.ts:142",
      "error": "expected 'expired' but got 'active'"
    }]
  }
```

## 17. `knowledge` — 知识管理工具

### 17.1 `knowledge.submit` — 知识提交

**业界标杆**：swarm-orchestrator 的 evidence-based 质量门 + Schema 验证

**最佳实现规格**：

```typescript
interface KnowledgeSubmitAction {
  action: 'submit';
  params: {
    /** 知识类型（对应维度） */
    dimension: string;
    /** 结构化知识内容 — 必须符合维度 JSON Schema */
    content: Record<string, unknown>;
    /** 置信度 (0.0-1.0) */
    confidence?: number;
    /** 证据来源 */
    evidence?: {
      files?: string[];          // 来源文件
      commands?: string[];       // 来源命令
      reasoning?: string;        // 推理过程
    };
  };
}
```

**核心实现要点**：

1. **Schema 验证**：每个 dimension 预定义 JSON Schema（ajv 验证），拒绝不合格提交
2. **去重检查**：新提交与已有 recipe 的 Levenshtein 相似度检测，> 0.85 标记为重复
3. **证据追踪**：`evidence` 字段关联到具体文件和行号，支持后续验证
4. **批量提交**：支持 `content: []` 数组一次提交多条知识
5. **自动分类**：根据 `dimension` 路由到对应的 Dimension Consumer

### 17.2 `knowledge.search` / `knowledge.get` — 知识检索

**最佳实现规格**：

```typescript
interface KnowledgeSearchAction {
  action: 'search';
  params: {
    query: string;
    dimension?: string;          // 限定维度
    limit?: number;              // 默认 5
  };
}

interface KnowledgeGetAction {
  action: 'get';
  params: {
    dimension: string;
    /** 是否返回完整内容还是摘要 */
    detail?: 'summary' | 'full'; // 默认 'summary'
  };
}
```

## 18. `graph` — 代码图谱工具

### 18.1 业界标杆

**GitNexus**（14K+ Stars, 2026 最佳开源方案）：

- MCP-native 知识图谱引擎
- 多阶段索引管线：跨文件解析 → 聚类 → BM25 + 语义向量 + RRF 混合搜索
- Leiden 社区检测识别功能模块
- 置信度评分的一次性查询（替代 Agent 链式 10 次查询）

**我们的实现方向**：
- 复用 cold start Phase 1.5 的 AST 图谱（已有 call graph + import graph）
- 暴露为 `graph.callers` / `graph.dependents` / `graph.entity` 等 action
- 长期可集成 GitNexus MCP 作为增强

**最佳实现规格**：

```typescript
interface GraphCallersAction {
  action: 'callers';
  params: {
    symbol: string;
    /** 递归深度（默认 1，即直接调用者） */
    depth?: number;              // 最大 3
    /** 返回格式 */
    format?: 'list' | 'tree';
  };
}

interface GraphDependentsAction {
  action: 'dependents';
  params: {
    file: string;
    /** 包含间接依赖 */
    transitive?: boolean;        // 默认 false
  };
}

interface GraphEntityAction {
  action: 'entity';
  params: {
    /** 实体名称 */
    name: string;
    /** 返回哪些关系类型 */
    relations?: ('imports' | 'exports' | 'calls' | 'inherits' | 'implements')[];
  };
}
```

## 19. `memory` — 工作记忆工具

### 19.1 业界标杆

| 系统 | 亮点 | LoCoMo 得分 |
|------|------|------------|
| **MemoryLake** | #1 on LoCoMo; 时序推理 91.28% | **94.03%** |
| **BMAM** | 脑启发 5 Agent 架构; 混合检索 | 78.45% |
| **REMem** | 两阶段情景记忆; 混合记忆图 | +13.4% 推理提升 |
| **lean-ctx** | ctx_context 跨会话; delta 编码 | N/A (工具级) |
| **agentmako** | Reef Engine 持久 findings + freshness | N/A (工具级) |

**我们的实现方向**：

借鉴 agentmako 的 **Reef Engine** 理念 + lean-ctx 的 **freshness 模型**：

```typescript
interface MemoryStoreAction {
  action: 'store';
  params: {
    /** 记忆类型 */
    type: 'finding' | 'decision' | 'context' | 'pattern';
    /** 内容 */
    content: string;
    /** 关联文件 */
    files?: string[];
    /** 重要度 (0-1) */
    salience?: number;
    /** 过期策略 */
    ttl?: 'session' | 'persistent';
  };
}

interface MemoryRecallAction {
  action: 'recall';
  params: {
    query: string;
    type?: string;
    /** 新鲜度过滤 */
    freshness?: 'live' | 'fresh' | 'stale' | 'any';
    limit?: number;
  };
}
```

**Freshness 模型**（参考 agentmako）：

| 状态 | 含义 | 何时标记 |
|------|------|---------|
| `live` | 当前会话中刚验证 | store 或 verify 后 |
| `fresh` | 最近索引，大概率有效 | 上次扫描后未检测到变更 |
| `stale` | 源文件已变更，可能过时 | 增量扫描检测到 diff |
| `contradicted` | 被新证据推翻 | 新 finding 与之冲突 |

## 20. `guard` — 质量守卫工具

### 20.1 `guard.lint` — Lint 检查

**最佳实现规格**：

```typescript
interface GuardLintAction {
  action: 'lint';
  params: {
    /** 检查目标 */
    paths: string[];
    /** 是否自动修复 */
    autoFix?: boolean;           // 默认 false
    /** 输出限制 */
    maxIssues?: number;          // 默认 20
  };
}
```

**输出格式**（LintParser 压缩）：

```json
{
  "tool": "biome",
  "errors": 3,
  "warnings": 7,
  "autoFixed": 2,
  "issues": [
    { "file": "src/auth.ts", "line": 42, "severity": "error", "rule": "lint/style/useBlockStatements", "message": "..." }
  ]
}
```

### 20.2 `guard.typecheck` — TypeScript 类型检查

```typescript
interface GuardTypecheckAction {
  action: 'typecheck';
  params: {
    /** 增量检查的文件列表（默认全量） */
    files?: string[];
  };
}
```

**输出**：`{ errors: N, items: [{ file, line, code, message }] }`

### 20.3 `guard.validate` — Schema 验证

验证工具输出是否符合预期的 JSON Schema。内部使用 ajv。

## 21. `evolution` — 知识演进工具

### 21.1 设计目的

专为 Incremental Scan 管线的 evolution 阶段设计：

```typescript
interface EvolutionProposeAction {
  action: 'propose';
  params: {
    /** 目标维度 */
    dimension: string;
    /** 变更类型 */
    changeType: 'add' | 'update' | 'deprecate';
    /** 变更内容 */
    content: Record<string, unknown>;
    /** 变更理由 */
    rationale: string;
    /** 影响的文件 */
    affectedFiles: string[];
  };
}

interface EvolutionDeprecateAction {
  action: 'deprecate';
  params: {
    dimension: string;
    /** 要废弃的知识条目 ID */
    entryId: string;
    reason: string;
  };
}

interface EvolutionSkipAction {
  action: 'skip';
  params: {
    dimension: string;
    reason: string;
  };
}
```

## 22. `meta` — 元工具

### 22.1 `meta.budget` — Token 预算查询

```typescript
interface MetaBudgetAction {
  action: 'budget';
  params: {};                    // 无参数
}
// 返回: { total, used, remaining, perToolUsage: {...} }
```

### 22.2 `meta.tools` — 可用工具查询

```typescript
interface MetaToolsAction {
  action: 'tools';
  params: {
    /** 过滤特定工具的 actions */
    toolId?: string;
  };
}
// 返回: 当前 Capability 允许的工具和 action 列表
```

---

## 23. 跨工具集成模式

### 23.1 Smart Read 流程（对 LLM 透明）

```
Agent: code.read("src/large-service.ts")
    ↓ (内部检测: 2000 行)
系统: 自动返回 outline (Tree-sitter skeleton)
    ↓
Agent: 看到 "async processPayment() [lines 142-210]"
    ↓
Agent: code.read("src/large-service.ts", startLine=142, endLine=210)
    ↓
系统: 返回 69 行代码 (而非 2000 行)
```

**Token 节省**：2000 行全文 ~16K tokens → outline 400 tokens + 69 行 550 tokens = **950 tokens (94% 节省)**

### 23.2 Search-Then-Read 模式

```
Agent: code.search(patterns=["authenticate"])
    ↓
系统: 返回 15 个匹配 (结构化, ~1.5K tokens)
    ↓
Agent: code.symbol("AuthService", detail="signature")
    ↓
系统: 返回签名 (~100 tokens)
    ↓
Agent: code.read("src/auth.ts", startLine=12, endLine=45)
    ↓
系统: 返回 34 行代码 (~280 tokens)
```

**总计**：~1.9K tokens（旧系统可能直接读全文 8K+ tokens）

### 23.3 Test-Fix-Verify 循环

```
Agent: terminal.test(target="auth.test.ts")
    ↓
系统: { passed: 8, failed: 1, failures: [{ test: "should expire", file: "auth.test.ts:142", error: "..." }] }
    ↓ (Agent 修复代码)
Agent: terminal.test(target="auth.test.ts", failedOnly=true)
    ↓
系统: { passed: 1, failed: 0 }
```

**Token 节省**：第一次 200 test 输出 ~25K → 压缩后 500 tokens；第二次仅跑失败项 → 50 tokens

### 23.4 Capability 工具集配置示例

```typescript
// KnowledgeProduction Capability: 只暴露分析和提交相关的 actions
const KNOWLEDGE_PRODUCTION: CapabilityV2 = {
  name: 'knowledge-production',
  allowedActions: {
    code:      ['search', 'read', 'skeleton', 'symbol'],
    terminal:  ['exec', 'test'],
    knowledge: ['submit', 'search', 'get'],
    graph:     ['callers', 'dependents', 'entity'],
    guard:     ['lint', 'typecheck'],
    memory:    ['store', 'recall'],
  },
  // 该 Capability 下 LLM 可见 6 个工具、~22 个 action
  // Schema 约 2-3K tokens（旧系统同等能力需 50+ 工具 Schema ~15K tokens）
};

// CodeAnalysis Capability: 精简版，仅代码理解
const CODE_ANALYSIS: CapabilityV2 = {
  name: 'code-analysis',
  allowedActions: {
    code:      ['search', 'read', 'skeleton'],
    graph:     ['callers', 'entity'],
    memory:    ['recall'],
  },
  // 该 Capability 下 LLM 可见 3 个工具、~6 个 action
  // Schema 约 800-1K tokens
};

// Evolution Capability: 增量扫描专用
const EVOLUTION: CapabilityV2 = {
  name: 'evolution',
  allowedActions: {
    code:      ['search', 'read', 'skeleton'],
    knowledge: ['search', 'get'],
    graph:     ['callers', 'entity'],
    evolution: ['propose', 'deprecate', 'skip'],
    memory:    ['store', 'recall'],
  },
};
```

---

## 24. 实施优先级

| 优先级 | 工具/Action | 理由 | 预估工作量 |
|--------|-----------|------|-----------|
| **P0** | `code.read` 自适应 + outline | 单工具最大 token 节省（-90%） | 3-5 天 |
| **P0** | `code.skeleton` Tree-sitter | 替代 regex，准确率 85% → 99% | 3-5 天 |
| **P0** | `OutputCompressor` 框架 + TestParser | 终端输出压缩基础设施 | 2-3 天 |
| **P1** | `code.search` 结构化输出 | rg --json 替代原始文本 | 2 天 |
| **P1** | `code.symbol` 两阶段查询 | 利用已有 AST 索引 | 2-3 天 |
| **P1** | GitStatusParser + GitDiffParser | 高频命令压缩 | 2 天 |
| **P2** | `knowledge.submit` Schema 验证 | 提升知识质量 | 1-2 天 |
| **P2** | `memory` Freshness 模型 | 增量扫描状态管理 | 2-3 天 |
| **P2** | `graph` action 暴露 | 复用已有图谱 | 1-2 天 |
| **P3** | `meta.budget` Token 预算系统 | 动态分配优化 | 2-3 天 |
| **P3** | Auto-Delta 缓存 | 二次读取 98.9% 节省 | 2-3 天 |
| **P3** | CapabilityV2 迁移 | 整体架构切换 | 5-7 天 |

---

## 25. 总结

### 25.1 设计原则

1. **每个工具做到最佳**：Tree-sitter (非 regex)、ripgrep --json (非原始文本)、Myers diff (非全文重传)
2. **保留工具集概念**：Capability 白名单继续控制 LLM 可见范围，从字符串列表升级为类型安全 Action 白名单
3. **对 LLM 透明的优化**：自适应读取、输出压缩、delta 缓存 —— LLM 无需学习新策略
4. **结构化输出优先**：所有终端输出经过专用解析器，返回 JSON 而非原始文本
5. **渐进式迁移**：优先实现 P0（code.read、skeleton、OutputCompressor），逐步替换旧实现

### 25.2 预期整体效果

| 指标 | 当前 | 目标 | 改进 |
|------|------|------|------|
| 单次冷启动 token | ~426K | **~100K** | **-76%** |
| 工具 Schema token | 2-3K (已有 Capability 过滤) | **0.8-1.5K** | -50% |
| 大文件读取 token | 3-16K | **200-400** (outline) | **-90%** |
| 测试输出 token | 5-25K | **50-500** | **-98%** |
| git 命令输出 token | 120-2K | **30-50** | **-97%** |
| 骨架提取准确率 | ~85% (regex) | **~99%** (Tree-sitter) | +14pp |
| delta 二次读取 token | 3-5K (全文) | **30-50** (diff) | **-99%** |
