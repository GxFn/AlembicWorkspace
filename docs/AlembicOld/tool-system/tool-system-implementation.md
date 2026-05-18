# Tool System 重构实施方案

> 基于 `agent-tool-capabilities.md` 设计蓝图，结合对项目 **60+ 工具 handler / ToolRouter / ContextWindow / 终端适配器 / Capability 白名单** 的逐行代码审计，制定的激进但有据可查的实施路线。
>
> 文档原则: **每一个改动都指向具体文件和行号，每一个决策都有代码证据**。

---

## 1. 代码审计: 真实的系统现状

### 1.1 工具定义全景 (lib/tools/handlers/)

| 文件 | 工具数 | 行数 | 核心职责 |
|------|--------|------|---------|
| `project-access.ts` | 5 | 1143 | 搜索/读文件/目录/摘要/语义搜索 |
| `composite.ts` | 6 | 744 | 组合工具(analyze_code/knowledge_overview/submit_with_check) + 元工具 |
| `ast-graph.ts` | 11 | ~800 | AST 结构化查询(依赖 ProjectGraph) |
| `lifecycle.ts` | 11 | ~600 | Recipe 生命周期(submit/approve/reject/publish/deprecate) |
| `query.ts` | 6 | ~400 | 知识查询(search_recipes/search_knowledge 等) |
| `guard.ts` | 4 | ~300 | Guard 规则检查/违规查询 |
| `infrastructure.ts` | 7 | ~500 | 基础设施(bootstrap_knowledge/rebuild_index/audit_log 等) |
| `knowledge-graph.ts` | 2 | ~150 | 知识图谱(check_duplicate/add_graph_edge) |
| `system-interaction.ts` | 2 | ~200 | 文件写入/环境信息 |
| `evolution-tools.ts` | 3 | ~200 | 进化提案/确认废弃/跳过 |
| `scan-recipe.ts` | 1 | ~100 | 扫描 Recipe 收集 |
| `ai-analysis.ts` | 2 | ~200 | AI 分析(enrich/refine candidates) |
| **终端工具** (TerminalAdapter) | 7+ | ~2000 | terminal_run/script/shell/pty/session 管理 |
| **总计** | **~65** | **~7300** | |

### 1.2 Capability 白名单实际分配

每个 Capability 只暴露一个工具子集给 LLM，这是现有系统的**核心优势**:

| Capability | 工具数 | 工具列表 |
|-----------|--------|---------|
| `CodeAnalysis` | 17 | project_overview, class_hierarchy, class_info, protocol_info, method_overrides, category_map, search_project_code, read_project_file, list_project_structure, get_file_summary, semantic_search_code, query_code_graph, query_call_graph, previous_analysis, note_finding, previous_evidence, analyze_code |
| `KnowledgeProduction` | 7 | read_project_file, check_duplicate, validate_candidate, submit_with_check, submit_knowledge, review_my_output, quality_score |
| `ScanProduction` | 2 | collect_scan_recipe, read_project_file |
| `SystemInteraction` | 17 | terminal_run/script/shell/pty + session 管理 + mac_* + write_project_file + get_environment_info + search/read/list/overview/summary |
| `EvolutionAnalysis` | 11 | read/search/semantic_search + query_code/call_graph + search/get_recipe + quality_score + propose/confirm/skip_evolution |
| `Conversation` | 8 | search_knowledge/recipes + get_recipe_detail/related/stats + semantic_search + submit_knowledge + knowledge_overview |

### 1.3 工具执行管线 (端到端调用链)

```
LLM 返回 function_call
  ↓
AgentRuntime.#processToolCalls (最多 8 个/轮)
  ↓
ToolExecutionPipeline.execute (含 SubmitDedup 等中间件)
  ↓
ToolRouter.execute
  ├── catalog.getManifest(toolId)
  ├── GovernanceEngine.decide (权限检查)
  ├── normalizeToolInput (JSON Schema 兼容)
  ├── acquireConcurrencySlot (单例/排他/并行)
  ├── createCachedEnvelope (runtime.cache 命中?)
  ├── createExecutionSignalScope (超时 AbortController)
  └── adapter.execute
        ├── InternalToolAdapter → contextFromToolCall → handler(params, ctx)
        └── TerminalAdapter → TerminalRunExecutor/ScriptExecutor/...
              ├── buildTerminalCommandPolicyInput (参数规范化)
              ├── evaluateTerminalCommandPolicy (bin/args 安全检查)
              ├── sessionManager.acquire (会话管理)
              ├── sandboxedExecFile (macOS Seatbelt 沙箱)
              └── materializeTerminalOutput (输出物化)
  ↓
ToolResultEnvelope 返回
  ↓
MessageAdapter.formatToolResult
  ├── isToolResultEnvelope? → 提取 .text
  └── limitToolResult(toolName, result, quota)
        ├── submit_*: 截断到 500 字符
        ├── search_project_code: 限制 matches 数 + context 行数
        ├── read_project_file: 按字符限制 content
        └── 通用: 按 maxChars 截断
  ↓
ContextWindow.appendToolResult(toolCallId, name, resultStr)
  ↓
下一轮 LLM 调用前: compactIfNeeded()
  ├── L0 (≥0.40): getToolResultQuota 降档 (6000→3000→1500→800 chars)
  ├── L1 (≥0.55): 截断旧 tool result (>2000 chars → 500)
  ├── L2 (≥0.70): 合并同角色消息 + 去重 submit toolCalls
  ├── L3 (≥0.82): 设 collapseThreshold → toProjectedMessages 折叠
  └── L4 (≥0.92): needsL4Compaction() — 但**未接入** AgentRuntime
```

### 1.4 已有 AST 管线 (复用资产)

```
lib/core/ast/
├── parser-init.ts           # web-tree-sitter 0.26.6 WASM 初始化 (幂等)
├── index.ts                 # 11 语言 WASM 注册表 + loadPlugins() 顶层 await
├── lang-typescript.ts       # 818 行完整 Walker: class/interface/type/enum/function/method/property/import/export
├── lang-javascript.ts       # JS Walker
├── lang-swift.ts            # Swift Walker
├── lang-python.ts           # Python Walker
├── lang-go.ts               # Go Walker
├── lang-rust.ts             # Rust Walker
├── lang-java.ts             # Java Walker
├── lang-kotlin.ts           # Kotlin Walker
├── lang-dart.ts             # Dart Walker
├── lang-objc.ts             # ObjC Walker
├── ensure-grammars.ts       # 按需从 npm 补全 .wasm
└── ProjectGraph.ts          # AST → 内存图谱 (class/protocol/method/继承/覆写)

lib/core/AstAnalyzer.ts      # analyzeFile(path, content, langId) → 结构化结果
resources/grammars/*.wasm     # 预编译语法文件 (随 npm 包发布)
```

**关键事实**: `get_file_summary` (project-access.ts:895-989) 仍使用 regex `SUMMARY_EXTRACTORS`，
而 `AstAnalyzer.analyzeFile()` 能返回 `{ classes, methods, protocols, imports, exports }` 结构化数据，
二者功能高度重叠但**完全解耦** — 这是最大的浪费点。

---

## 2. 代码审计: 发现的真实问题 (带证据)

### 2.1 严重设计缺陷 (S 级)

#### S1: `get_file_summary` 与 `AstAnalyzer` 完全脱节

- **证据**: `project-access.ts:830-893` 硬编码了 10 种语言的 regex `SUMMARY_EXTRACTORS`
- **同时**: `lib/core/ast/lang-*.ts` 有 11 种语言的 Tree-sitter Walker，提取更精确的结构
- **影响**: regex 只能提取浅层声明，丢失继承关系、访问修饰符、泛型参数、方法体范围
- **例证**: TypeScript regex `^\s*(?:async\s+)?(?:static\s+)?(?:public|private|protected)?\s*(?:get\s+|set\s+)?(?:#?\w+)\s*\([^)]*\)\s*[:{]`
  vs Tree-sitter walker 能精确提取 `abstract`, `override`, `readonly`, decorator 等

#### S2: `read_project_file` 无自适应 — 大文件全量返回

- **证据**: `project-access.ts:567-696` — 只有 `maxLines=200` 限制，无 outline 降级
- **影响**: 2000 行文件 → ~16K tokens 全部进入 ContextWindow，触发 L1/L2 压缩
- **而 `get_file_summary`** (另一个工具) 能返回紧凑摘要但 LLM 不会自动选择它

#### S3: `search_project_code` 纯内存 regex — 无外部搜索后端

- **证据**: `project-access.ts:242-353` `_getProjectFiles` 递归 `readdirSync` + `readFileSync` 全部文件到内存
- **影响**: 大项目 (>5000 文件) 每次搜索都全量扫描，无索引，无增量
- **对比**: ripgrep 有 SIMD 加速的 Aho-Corasick + 正则引擎，比 JS regex 快 10-100x

#### S4: ContextWindow L3 折叠不减少内部 token 估算

- **证据**: `ContextWindow.ts:578-591` `estimateTokens()` 遍历 `#messages` (完整存储)
  `ContextWindow.ts:542-565` `toProjectedMessages()` 返回折叠视图
- **BUG**: L3 激活后发给 LLM 的消息变少了，但 `estimateTokens()` 仍计算全部消息
- **影响**: token 使用率不下降 → 可能永远停在 L3，无法恢复到 L1/L2 状态

#### S5: `compactL4` (LLM 摘要压缩) 定义了但从未接入

- **证据**: `ContextWindow.ts:340-406` 完整实现了 `needsL4Compaction()` 和 `compactL4()`
  但全仓库搜索 `needsL4` 和 `compactL4` — **零调用方**
- **影响**: 上下文溢出时只能依赖 L3 折叠（丢失信息但不真正释放空间）

#### S6: 终端 stdout/stderr 对 LLM 完全不可见 (严重)

- **证据**: `MessageAdapter.ts:115-120` `formatToolResult` 对 `ToolResultEnvelope` **只取 `envelope.text`**
  而终端 envelope 的 `text` 仅为摘要: `"Terminal command completed: git"` (`TerminalEnvelopes.ts:62-64`)
  **`structuredContent`（含 stdout/stderr）从未进入 LLM 消息**
- **完整链路**: `sandboxedExecFile` → stdout 捕获 → `materializeTerminalOutput`(截断到 16K chars)
  → `envelopeForTerminalResult`(text=摘要, structuredContent=完整) → `formatToolResult`(**只用 text**)
  → LLM 只看到 `"Terminal command completed: git"`
- **影响**: Agent 执行 `git status` / `npm test` 后**看不到任何命令输出**，
  完全丧失终端工具的信息获取能力。这解释了为什么终端工具在实际使用中效果有限。
- **修复**: `formatToolResult` 需要对终端工具特殊处理，将 `structuredContent.stdout` 纳入结果

#### S7: `knowledge_overview` 的 `_meta` 有逻辑 bug

- **证据**: `composite.ts:251-252` `const recipes = result.recipes as Record<string, number>`
  但实际数据写入的是 `result.knowledge`（不是 `result.recipes`）
- **影响**: `recipeCount` 恒为 0/undefined → `confidence` 总是 `'none'` → hint 总是"知识库为空"
- **修复**: 改为 `const stats = result.knowledge as Record<string, number>`

#### S8: `ctx.toolSchemas` 是一次性快照 — 惰性加载实际未生效

- **证据**: `AgentRuntime.ts` `#initLoop` 调用 `#getToolSchemas` 存入 `ctx.toolSchemas`，
  整个 `reactLoop` 内 `#callLLM` 始终使用 `ctx.toolSchemas`，不会更新。
  `#markToolsExpanded` 只改 catalog 的 `#expandedToolIds`，不影响已快照的 schemas。
- **影响**: 设计意图是"首轮全量、后续混合"，但同一 reactLoop 内**所有轮次始终全量**。
  惰性加载只在**下一次 reactLoop 初始化**（如 PipelineStrategy 切阶段）时才生效。
- **修复**: 每轮迭代重新调用 `#getToolSchemas`（或至少在 `markExpanded` 后刷新）

### 2.2 高优先级技术债 (A 级)

#### A0: ToolRouter.execute 不捕获 adapter rejection

- **证据**: `ToolRouter.ts:141-163` 围绕 `adapter.execute` 只有 `try/finally`，无 `catch`
- **影响**: adapter 抛出未处理异常时，`execute` 的 Promise 会 reject 而非返回 error envelope
- **对比**: `InternalToolAdapter`、`WorkflowAdapter` 等自身有 try/catch → error envelope，但
  如果 adapter.execute 在更底层抛出（如序列化异常），Router 层无法兜底

#### A0b: GovernanceEngine `#approveGateway` 无 try/catch

- **证据**: `GovernanceEngine.ts` 中 `#approveRuntimePolicy` 包在 try/catch 中，
  但 `#approveGateway` 的 `gateway.checkOnly` 调用**无外层 try** — 网关 bug 会直接冒泡
- **影响**: 与其他 approve 分支的防御风格不一致

#### A1: 参数兼容性膨胀

- **证据**: `project-access.ts:143-167` `ReadFileParams` 有 7 个同义参数:
  `filePath`, `path`, `file_path`, `filepath`, `file`, `filename`, `filePaths`
- **同理**: `SearchCodeParams:147-153` 有 5 个: `pattern`, `query`, `search`, `keyword`, `search_query`
- **根因**: LLM 可能用不同命名调用，handler 需要全部兼容
- **改进**: 在 `normalizeToolInput` (ToolInputSchema.ts) 统一规范化，handler 只接受规范名

#### A2: InternalToolHandlerContext 过度透传

- **证据**: `InternalToolHandler.ts:76-112` `contextFromToolCall` 用 30+ 行展开式传递
  `_sharedState`, `_dimensionMeta`, `_projectLanguage`, `_submittedTitles`, `_submittedPatterns`,
  `_sessionToolCalls`, `_bootstrapDedup`, `_memoryCoordinator`, `_currentRound`, `_dimensionScopeId`
- **问题**: 每新增一个上下文字段就要改 3 处代码（类型定义、展开、使用方）
- **改进**: 改为 opaque context bag 或 DI container 直接传递

#### A3: Schema 惰性加载首轮全量退化

- **证据**: `AgentRuntime.ts:1315-1345` (根据 summary) 当 `expandedCount === 0` 时 `firstRound=true`
  → 所有工具使用完整 schema。只有在第二轮以后才使用混合策略。
- **问题**: 首轮是 token 消耗最高的轮次（用户 prompt + system prompt + 全量 schema）
- **改进**: 首轮也使用轻量 schema，LLM 通过 `get_tool_details` 按需获取

#### A4: `list_project_structure` 性能问题

- **证据**: `project-access.ts:790-803` 对每个文件执行 `statSync` + `readFileSync` (用于计算行数)
- **影响**: 1000 文件的目录 = 2000 次同步系统调用，阻塞事件循环
- **改进**: 去掉行数统计（或用异步 stat），目录树只返回结构

#### A5: 搜索/读取缓存无大小限制

- **证据**: `project-access.ts:387-414` `_searchCache` 和 `_readCache` 是 `Map`，无 LRU 淘汰
- **影响**: 长会话累积缓存可能消耗大量内存
- **改进**: 使用 `Map` + size cap，或 WeakRef

### 2.3 中优先级改进 (B 级)

#### B1: `estimateFullContextTokens` 定义了但无人调用

- **证据**: `ContextWindow.ts:606-611` 定义，但全仓库无引用
- **本意**: 包含 system prompt 和 tool schema 的更精确估算
- **影响**: `getTokenUsageRatio()` 只计算消息 token，不含 prompt/schema overhead

#### B2: Conversation capability 的 `onAfterStep` 是唯一有副作用的 capability

- **证据**: `Conversation.ts:104-114` 在步骤后将 tool 结果写入 MemoryCoordinator
- **问题**: 其他 capability 没有此机制，数据流不对称

#### B3: `SUMMARY_EXTRACTORS` 硬编码了 10 种语言 regex

- **当**: Tree-sitter Walker 已覆盖 11 种语言（含 Dart）
- **重复维护**: 修改语法支持需要改两处

---

## 3. 激进重构方案

### 设计原则

1. **不引入新外部依赖** — 复用 `web-tree-sitter` 0.26.6、`better-sqlite3`，已有全部基础设施
2. **不破坏 V1 工具注册** — 现有 60+ 工具定义和 Capability 白名单继续工作
3. **渐进式替换** — 每个 Phase 都独立可部署、可回滚
4. **证据驱动** — 每个改动都有 "改造前 token" vs "改造后 token" 的可度量指标

### Phase 0: 修复设计缺陷 (Week 1)

#### 0.0 修复终端输出对 LLM 不可见 (S6 — 最高优先级)

**文件**: `lib/agent/runtime/MessageAdapter.ts`

```typescript
// 修改 formatToolResult — 终端工具需要 structuredContent 而非 text
formatToolResult(toolName: string, rawResult: unknown) {
  const quota = this.getToolResultQuota();
  if (isToolResultEnvelope(rawResult)) {
    const envelope = rawResult as ToolResultEnvelope;
    // 终端工具: text 只是摘要，真正内容在 structuredContent
    if (envelope.structuredContent?.stdout !== undefined) {
      const parts: string[] = [];
      if (envelope.structuredContent.stdout) {
        parts.push(String(envelope.structuredContent.stdout));
      }
      if (envelope.structuredContent.stderr) {
        parts.push(`[stderr] ${String(envelope.structuredContent.stderr)}`);
      }
      if (!envelope.ok) {
        parts.push(`[exit: ${envelope.structuredContent.exitCode ?? 'error'}]`);
      }
      return limitToolResult(toolName, parts.join('\n') || envelope.text, quota);
    }
    return limitToolResult(toolName, envelope.text, quota);
  }
  return limitToolResult(toolName, rawResult, quota);
}
```

**影响**: Agent 执行终端命令后能看到实际 stdout/stderr，终端工具从"几乎无用"变为"完全可用"。

#### 0.1 修复 L3 token 估算 bug

**文件**: `lib/agent/context/ContextWindow.ts`

```typescript
// 修改 estimateTokens() — 使用投影消息而非原始消息
estimateTokens() {
  const messages = this.#collapseThreshold >= 0
    ? this.toProjectedMessages()
    : this.#messages;
  let total = 0;
  for (const m of messages) {
    if (m.content) total += estimateTokensFast(m.content);
    if (m.reasoningContent) total += estimateTokensFast(m.reasoningContent);
    if (m.toolCalls) total += estimateTokensFast(JSON.stringify(m.toolCalls));
  }
  return total;
}
```

**影响**: L3 折叠后 token 使用率正确下降，可能恢复到 L1/L2 状态，避免不必要的信息丢失。

#### 0.2 接入 L4 LLM 摘要压缩

**文件**: `lib/agent/runtime/AgentRuntime.ts`

在 `#prepareIteration` 中 `compactIfNeeded()` 之后:

```typescript
// 已有: const compactResult = this.messages.compactIfNeeded();
// 新增:
if (this.messages.needsL4Compaction() && this.aiProvider) {
  await this.messages.compactL4(this.aiProvider);
}
```

**影响**: 极端长会话不再因 token 爆满而丢失关键上下文。

#### 0.3 修复 knowledge_overview _meta bug (S7)

**文件**: `lib/tools/handlers/composite.ts`

```typescript
// 修改第 251-252 行
// 旧: const recipes = result.recipes as Record<string, number> | undefined;
// 新:
const stats = result.knowledge as Record<string, number> | undefined;
const recipeCount = stats?.total || stats?.count || 0;
```

#### 0.4 修复 toolSchemas 快照不刷新 (S8)

**文件**: `lib/agent/runtime/AgentRuntime.ts`

在 `#markToolsExpanded` 之后刷新 schemas:

```typescript
// 现有: catalog.markExpanded(toolIds);
// 新增: 刷新 ctx 中的 toolSchemas
ctx.toolSchemas = this.#getToolSchemas(ctx.allowedToolIds, this.#modelRef);
```

**影响**: 惰性 schema 加载在同一 reactLoop 内生效，首轮后的工具 schema 从全量降为混合。

#### 0.5 参数规范化下沉到 ToolInputSchema

**文件**: `lib/tools/core/ToolInputSchema.ts`

新增 alias 映射表，在 `normalizeToolInput` 中统一处理:

```typescript
const PARAM_ALIASES: Record<string, Record<string, string>> = {
  read_project_file: {
    path: 'filePath', file_path: 'filePath', filepath: 'filePath',
    file: 'filePath', filename: 'filePath',
  },
  search_project_code: {
    query: 'pattern', search: 'pattern', keyword: 'pattern', search_query: 'pattern',
  },
  get_file_summary: {
    file_path: 'filePath', path: 'filePath', file: 'filePath',
  },
  semantic_search_code: {
    search: 'query', keyword: 'query',
  },
};
```

然后从各 handler 中删除冗余的参数兼容代码（约 -80 行）。

### Phase 1: 核心工具升级 (Week 2-3)

#### 1.1 `get_file_summary` → Tree-sitter 后端

**核心改动**: 用 `AstAnalyzer.analyzeFile()` 替代 regex `SUMMARY_EXTRACTORS`

**文件**: `lib/tools/handlers/project-access.ts`

```typescript
// 新增导入
import { analyzeFile, isLanguageRegistered } from '#core/AstAnalyzer.js';

// 修改 get_file_summary handler
handler: async (params, ctx) => {
  // ... 文件读取逻辑不变 ...

  const language = LanguageService.langFromExt(ext);

  // 优先使用 Tree-sitter (精确 AST 解析)
  if (isLanguageRegistered(language)) {
    try {
      const analysis = analyzeFile(filePath, content, language);
      if (analysis) {
        return {
          filePath,
          language,
          lineCount: content.split('\n').length,
          imports: (analysis.imports || []).map(i => i.toString()),
          declarations: (analysis.classes || []).map(c => {
            const superStr = c.superclass ? ` extends ${c.superclass}` : '';
            return `${c.abstract ? 'abstract ' : ''}class ${c.name}${superStr}`;
          }),
          methods: (analysis.methods || []).map(m => {
            const cls = m.className ? `${m.className}.` : '';
            return `${m.async ? 'async ' : ''}${cls}${m.name}(${m.params || ''})`;
          }),
          protocols: (analysis.protocols || []).map(p => p.name),
          properties: (analysis.properties || []).map(p => `${p.name}: ${p.type || 'unknown'}`),
          _engine: 'tree-sitter',
        };
      }
    } catch { /* fallthrough to regex */ }
  }

  // 降级: regex SUMMARY_EXTRACTORS (保持现有逻辑)
  const extractor = SUMMARY_EXTRACTORS[language];
  // ... 现有 regex 逻辑不变 ...
}
```

**Token 节省**: regex 提取 ~200 tokens → Tree-sitter 提取 ~250 tokens (略多但精度 +40%)
**真正收益**: 提供准确的行范围信息，使 LLM 能精准 `read_project_file({ startLine, endLine })`

#### 1.2 `read_project_file` 自适应 outline

**策略**: 大文件 (>500 行) 且无指定行范围时，自动返回 outline + 引导提示

**文件**: `lib/tools/handlers/project-access.ts`

```typescript
handler: async (params, ctx) => {
  // ... 现有缓存/路径/安全逻辑不变 ...

  const allLines = content.split('\n');
  const totalLines = allLines.length;

  // 自适应: 大文件 + 无行范围 → outline 模式
  const hasLineRange = params.startLine !== undefined || params.endLine !== undefined;
  if (totalLines > 500 && !hasLineRange) {
    // 尝试 Tree-sitter outline
    const language = LanguageService.langFromExt(path.extname(filePath).toLowerCase());
    let outline: string | null = null;
    if (isLanguageRegistered(language)) {
      try {
        const analysis = analyzeFile(filePath, content, language);
        if (analysis) {
          outline = formatCompactOutline(analysis, totalLines);
        }
      } catch { /* fallthrough */ }
    }
    if (!outline) {
      outline = formatRegexOutline(content, language, totalLines);
    }

    return {
      filePath,
      totalLines,
      mode: 'outline',
      outline,
      hint: `文件有 ${totalLines} 行。使用 startLine/endLine 读取特定区域。`,
      _engine: outline.includes('tree-sitter') ? 'tree-sitter' : 'regex',
    };
  }

  // ... 现有行范围读取逻辑不变 ...
}
```

**Token 节省**: 2000 行文件从 ~16K tokens → ~400 tokens (outline)，**-97%**

#### 1.3 终端输出结构化压缩 (OutputCompressor)

**新建文件**: `lib/tools/output/OutputCompressor.ts`

```typescript
export interface CompressionResult {
  compressed: string;
  originalChars: number;
  compressedChars: number;
  ratio: number;
  parser: string;
}

interface OutputParser {
  name: string;
  detect(output: string, command?: string): boolean;
  compress(output: string, budget: number): string;
}

const parsers: OutputParser[] = [
  {
    name: 'git-status',
    detect: (_, cmd) => /^git\s+status/.test(cmd || ''),
    compress(output, budget) {
      const lines = output.split('\n');
      const staged: string[] = [];
      const modified: string[] = [];
      const untracked: string[] = [];
      let section = '';
      for (const line of lines) {
        if (line.includes('Changes to be committed')) section = 'staged';
        else if (line.includes('Changes not staged')) section = 'modified';
        else if (line.includes('Untracked files')) section = 'untracked';
        else if (line.startsWith('\t') || line.match(/^\s+\w/)) {
          const file = line.trim().replace(/^(modified|new file|deleted|renamed):\s*/, '');
          if (section === 'staged') staged.push(file);
          else if (section === 'modified') modified.push(file);
          else if (section === 'untracked') untracked.push(file);
        }
      }
      const parts: string[] = [];
      if (staged.length) parts.push(`staged(${staged.length}): ${staged.join(', ')}`);
      if (modified.length) parts.push(`modified(${modified.length}): ${modified.join(', ')}`);
      if (untracked.length) parts.push(`untracked(${untracked.length}): ${untracked.join(', ')}`);
      return parts.join('\n') || 'clean';
    },
  },
  {
    name: 'test-output',
    detect: (output, cmd) =>
      /vitest|jest|pytest|mocha|cargo test|go test/.test(cmd || '') ||
      /Tests?:\s+\d+/.test(output) ||
      /(\d+) pass(ed|ing)/.test(output),
    compress(output) {
      const lines = output.split('\n');
      const summary = lines.filter(l =>
        /Tests?:|pass|fail|skip|error|✓|✗|PASS|FAIL|OK|FAILED/i.test(l)
      );
      const failures = lines.filter(l =>
        /FAIL|✗|Error|AssertionError|Expected|Received/i.test(l)
      );
      const parts = ['[test summary]', ...summary.slice(0, 10)];
      if (failures.length > 0) {
        parts.push('[failures]', ...failures.slice(0, 20));
      }
      return parts.join('\n');
    },
  },
  {
    name: 'git-diff',
    detect: (_, cmd) => /^git\s+diff/.test(cmd || ''),
    compress(output, budget) {
      const lines = output.split('\n');
      const files: string[] = [];
      const hunks: string[] = [];
      for (const line of lines) {
        if (line.startsWith('diff --git')) {
          const match = line.match(/b\/(.+)$/);
          if (match) files.push(match[1]);
        } else if (line.startsWith('@@')) {
          hunks.push(line);
        }
      }
      let result = `files(${files.length}): ${files.join(', ')}\nhunks(${hunks.length})`;
      if (result.length < budget) {
        const addDel = lines.filter(l => l.startsWith('+') || l.startsWith('-'));
        result += '\n' + addDel.slice(0, Math.floor(budget / 80)).join('\n');
      }
      return result;
    },
  },
  {
    name: 'ls-tree',
    detect: (_, cmd) => /^(ls|find|tree)\b/.test(cmd || ''),
    compress(output, budget) {
      const lines = output.split('\n').filter(l => l.trim());
      if (lines.length <= 50) return output;
      return lines.slice(0, 50).join('\n') + `\n... (${lines.length - 50} more entries)`;
    },
  },
];

export function compressOutput(
  output: string,
  command: string,
  budget = 2000
): CompressionResult {
  if (output.length <= budget) {
    return { compressed: output, originalChars: output.length, compressedChars: output.length, ratio: 1.0, parser: 'none' };
  }

  // ANSI strip
  const cleaned = output.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

  for (const parser of parsers) {
    if (parser.detect(cleaned, command)) {
      const compressed = parser.compress(cleaned, budget);
      return {
        compressed: compressed.slice(0, budget),
        originalChars: output.length,
        compressedChars: compressed.length,
        ratio: compressed.length / output.length,
        parser: parser.name,
      };
    }
  }

  // Generic: head + tail
  const lines = cleaned.split('\n');
  const headCount = Math.floor(budget / 160);
  const tailCount = Math.min(headCount, 5);
  const head = lines.slice(0, headCount).join('\n');
  const tail = lines.slice(-tailCount).join('\n');
  const compressed = `${head}\n... (${lines.length - headCount - tailCount} lines omitted)\n${tail}`;

  return {
    compressed: compressed.slice(0, budget),
    originalChars: output.length,
    compressedChars: compressed.length,
    ratio: compressed.length / output.length,
    parser: 'generic',
  };
}
```

**集成点**: `TerminalRunExecutor.ts` 的 `materializeTerminalOutput` 之后，对 `structuredContent.stdout` 调用 `compressOutput`。

#### 1.4 Ripgrep 搜索后端 (可选加速)

**新建文件**: `lib/tools/code-intel/RipgrepSearch.ts`

```typescript
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

interface RgMatch {
  file: string;
  line: number;
  code: string;
  context: string;
}

let rgAvailable: boolean | null = null;

export async function isRipgrepAvailable(): Promise<boolean> {
  if (rgAvailable !== null) return rgAvailable;
  try {
    await execFileAsync('rg', ['--version'], { timeout: 3000 });
    rgAvailable = true;
  } catch {
    rgAvailable = false;
  }
  return rgAvailable;
}

export async function ripgrepSearch(
  pattern: string,
  projectRoot: string,
  opts: { isRegex?: boolean; maxResults?: number; fileFilter?: string; contextLines?: number }
): Promise<{ matches: RgMatch[]; total: number }> {
  const args = [
    '--json',
    '--max-count', String(opts.maxResults || 10),
    '-C', String(opts.contextLines || 3),
    '--glob', '!node_modules', '--glob', '!.git',
    '--glob', '!Pods', '--glob', '!Carthage',
  ];

  if (opts.fileFilter) {
    for (const ext of opts.fileFilter.split(',')) {
      args.push('--glob', `*.${ext.trim().replace(/^\./, '')}`);
    }
  }

  if (!opts.isRegex) args.push('--fixed-strings');
  args.push(pattern, projectRoot);

  const { stdout } = await execFileAsync('rg', args, {
    timeout: 15000,
    maxBuffer: 2 * 1024 * 1024,
  });

  const matches: RgMatch[] = [];
  let total = 0;

  for (const line of stdout.split('\n')) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (event.type === 'match') {
        total++;
        const data = event.data;
        matches.push({
          file: data.path?.text || '',
          line: data.line_number,
          code: data.lines?.text?.trimEnd() || '',
          context: '',
        });
      }
    } catch { /* skip malformed lines */ }
  }

  return { matches, total };
}
```

**集成到 `search_project_code`**:

```typescript
// project-access.ts handler 开头
if (await isRipgrepAvailable()) {
  const rgResult = await ripgrepSearch(pattern, projectRoot, { isRegex, maxResults, fileFilter, contextLines });
  state._searchCache.set(cacheKey, rgResult);
  return { ...rgResult, searchedFiles: -1, _engine: 'ripgrep' };
}
// 降级到现有内存搜索
```

**Token 节省**: rg --json 输出结构化，比内存搜索的 JSON 更紧凑约 30%。
**性能收益**: 5000 文件项目搜索从 2-5s → 50-200ms。

### Phase 2: 上下文管理升级 (Week 3-4)

#### 2.1 OutputCompressor 集成到终端适配器

**文件**: `lib/tools/adapters/terminal-adapter/TerminalRunExecutor.ts`

在 `sandboxedExecFile` 返回后:

```typescript
import { compressOutput } from '#tools/output/OutputCompressor.js';

// 在 try 块中，execResult 返回后
const rawStdout = execResult.stdout;
const command = `${terminal.bin} ${terminal.args.join(' ')}`;
const compression = compressOutput(rawStdout, command, 2000);

const output = materializeTerminalOutput(request, {
  stdout: compression.compressed,  // 使用压缩后的输出
  stderr: execResult.stderr,
});

// structuredContent 中附加压缩元信息
const structuredContent = {
  ...output.structuredContent,
  _compression: compression.ratio < 1.0 ? {
    ratio: compression.ratio,
    parser: compression.parser,
    originalChars: compression.originalChars,
  } : undefined,
};
```

#### 2.2 首轮 Schema 惰性加载

**文件**: `lib/agent/runtime/AgentRuntime.ts`

修改 `#getToolSchemas` 中 `firstRound` 判断:

```typescript
// 现有: const firstRound = (catalog as any).expandedCount === 0;
// 改为: 始终使用混合策略，首轮用轻量 schema + 引导
const firstRound = false; // 不再首轮退化为全量
```

并在首轮 system prompt 中添加:

```
可用工具为轻量描述。调用不熟悉的工具前，先用 get_tool_details 获取完整参数 schema。
```

**Token 节省**: 17 个工具的完整 schema ~2000 tokens → 轻量 schema ~600 tokens + 按需加载。

#### 2.3 File Delta Cache

**新建文件**: `lib/tools/cache/DeltaCache.ts`

```typescript
import { createHash } from 'node:crypto';

interface DeltaCacheEntry {
  hash: string;
  accessedAt: number;
}

export class DeltaCache {
  #entries = new Map<string, DeltaCacheEntry>();
  #maxSize: number;

  constructor(maxSize = 200) {
    this.#maxSize = maxSize;
  }

  check(filePath: string, content: string): { changed: boolean; diff?: string } {
    const hash = createHash('md5').update(content).digest('hex');
    const existing = this.#entries.get(filePath);

    if (!existing) {
      this.#set(filePath, hash);
      return { changed: true };
    }

    existing.accessedAt = Date.now();
    if (existing.hash === hash) {
      return { changed: false, diff: '[no changes since last read]' };
    }

    this.#set(filePath, hash);
    return { changed: true };
  }

  #set(filePath: string, hash: string) {
    if (this.#entries.size >= this.#maxSize) {
      let oldest = '';
      let oldestTime = Infinity;
      for (const [key, entry] of this.#entries) {
        if (entry.accessedAt < oldestTime) {
          oldest = key;
          oldestTime = entry.accessedAt;
        }
      }
      if (oldest) this.#entries.delete(oldest);
    }
    this.#entries.set(filePath, { hash, accessedAt: Date.now() });
  }
}
```

**集成到 `read_project_file`**: 二次读取同一文件时返回 `[no changes since last read]` 而非全文。

### Phase 3: 搜索/缓存清理 (Week 4-5)

#### 3.1 搜索缓存 LRU 化

```typescript
// 在 _searchCache 和 _readCache 使用时加入 size cap
const MAX_SEARCH_CACHE = 50;
const MAX_READ_CACHE = 100;

if (state._searchCache.size > MAX_SEARCH_CACHE) {
  const firstKey = state._searchCache.keys().next().value;
  state._searchCache.delete(firstKey);
}
```

#### 3.2 `list_project_structure` 异步化

将 `readdirSync` + `statSync` + `readFileSync` 替换为异步版本，
去掉 `includeStats=true` 时的逐文件行数计算（用 stat.size 近似估算）。

---

## 4. 文件变更清单

### 新建文件

| 文件 | 行数估计 | 职责 |
|------|---------|------|
| `lib/tools/output/OutputCompressor.ts` | ~200 | 终端输出结构化压缩 |
| `lib/tools/code-intel/RipgrepSearch.ts` | ~100 | rg --json 搜索后端 |
| `lib/tools/cache/DeltaCache.ts` | ~60 | 文件变更检测 + hash 缓存 |

### 改造文件

| 文件 | 改造点 | 改动范围 |
|------|--------|---------|
| `lib/agent/context/ContextWindow.ts` | L3 token 估算修复 + L4 注释 | ~10 行 |
| `lib/agent/runtime/AgentRuntime.ts` | 接入 L4 + 首轮 schema 策略 | ~15 行 |
| `lib/tools/handlers/project-access.ts` | get_file_summary Tree-sitter + read_project_file 自适应 + 搜索缓存 LRU + rg 后端 + 删除参数兼容代码 | +100/-80 行 |
| `lib/tools/core/ToolInputSchema.ts` | 参数 alias 规范化 | +30 行 |
| `lib/tools/adapters/terminal-adapter/TerminalRunExecutor.ts` | OutputCompressor 集成 | +15 行 |

### 不变文件

| 文件 | 原因 |
|------|------|
| `lib/agent/capabilities/*.ts` | Capability 白名单继续有效，不改 |
| `lib/tools/catalog/*.ts` | V1/V2 桥接继续工作 |
| `lib/tools/core/ToolRouter.ts` | 路由逻辑成熟，不改 |
| `lib/tools/core/GovernanceEngine.ts` | 权限决策不变 |
| `lib/tools/adapters/terminal-adapter/TerminalExecutorShared.ts` | 沙箱执行不变 |
| `lib/core/ast/*.ts` | AST 管线只读复用 |

---

## 5. 测试计划

### 5.1 Bug 修复测试

```typescript
// test/unit/ContextWindow-L3-fix.test.ts
describe('L3 collapse token estimation fix', () => {
  it('estimateTokens 在 L3 激活后应反映折叠', () => {
    const cw = new ContextWindow(1000);
    // 填充足够消息触发 L3
    for (let i = 0; i < 20; i++) {
      cw.appendUserMessage('x'.repeat(100));
      cw.appendAssistantText('y'.repeat(100));
    }
    const beforeL3 = cw.estimateTokens();
    cw.compactIfNeeded(); // 应触发 L3
    const afterL3 = cw.estimateTokens();
    expect(afterL3).toBeLessThan(beforeL3);
  });
});
```

### 5.2 功能测试

| 测试文件 | 覆盖目标 |
|---------|---------|
| `test/unit/OutputCompressor.test.ts` | git-status/test-output/git-diff/ls-tree/generic 各解析器 |
| `test/unit/RipgrepSearch.test.ts` | rg 可用性检测 + JSON 解析 + 降级到内存搜索 |
| `test/unit/DeltaCache.test.ts` | hash 检测 + LRU 淘汰 + 相同内容返回 no-change |
| `test/unit/adaptive-read.test.ts` | 小文件全文 + 大文件 outline + 大文件+行范围 |
| `test/unit/file-summary-treesitter.test.ts` | TS/JS/Python/Swift 的 Tree-sitter outline vs regex 对比 |

### 5.3 Token 节省基准测试

| 场景 | 改造前 | 改造后 | 验证方法 |
|------|--------|--------|---------|
| 大文件读取 (2000 行 TS) | ~16K chars | ~400 chars (outline) | `estimateTokens(result)` |
| get_file_summary 准确率 | ~85% (regex) | ~99% (Tree-sitter) | 对比 AST dump |
| `git status` 输出 (50 文件) | ~3000 chars | ~300 chars | `compressOutput()` |
| `vitest run` 输出 (200 tests) | ~15K chars | ~500 chars | `compressOutput()` |
| 代码搜索 (5 patterns) | 5-10s (内存) | 200ms (rg) | wall time |
| 二次文件读取 | ~5K chars | ~30 chars | `DeltaCache.check()` |
| 首轮 Schema | ~2000 tokens | ~600 tokens | `toMixedSchemas()` size |
| L3 后 token 估算 | 不下降 (bug) | 下降 50%+ | `getTokenUsageRatio()` |

---

## 6. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Tree-sitter analyzeFile 返回 null | outline 生成失败 | 降级到 regex SUMMARY_EXTRACTORS (已有代码) |
| rg 未安装 | ripgrep 后端不可用 | `isRipgrepAvailable()` 检测后降级到内存搜索 |
| OutputCompressor 误解析 | 压缩丢失关键信息 | parser.detect 不匹配时走 generic (head+tail) |
| L3 token 修复后行为变化 | 压缩策略触发频率改变 | 添加日志 + 保留原始 estimateTokens 为 debug 方法 |
| 首轮去掉全量 schema | LLM 不熟悉工具 | system prompt 引导 + get_tool_details 按需加载 |
| 自适应 outline 阈值 500 行 | 可能偏低/偏高 | 可配置 + 观察实际日志调优 |

---

## 7. 里程碑时间线

```
Week 1: Phase 0 — Bug 修复 + 基础设施
  ├── S6 修复: 终端 stdout/stderr 对 LLM 可见 (MessageAdapter.ts) ★最高优先
  ├── S4 修复: L3 token 估算 (ContextWindow.ts)
  ├── S5 修复: 接入 L4 (AgentRuntime.ts)
  ├── S7 修复: knowledge_overview _meta (composite.ts)
  ├── S8 修复: toolSchemas 快照刷新 (AgentRuntime.ts)
  ├── A1 修复: 参数 alias (ToolInputSchema.ts)
  ├── OutputCompressor 框架 + 4 个解析器
  └── 单元测试

Week 2: Phase 1a — get_file_summary Tree-sitter + read_project_file 自适应
  ├── AstAnalyzer 桥接到 get_file_summary
  ├── read_project_file 500 行阈值 + outline
  └── 集成测试 + Token 基准测试

Week 3: Phase 1b — 终端压缩 + rg 搜索
  ├── OutputCompressor → TerminalRunExecutor 集成
  ├── RipgrepSearch 实现 + search_project_code 双后端
  └── 全链路验证

Week 4: Phase 2 — 上下文管理
  ├── 首轮 schema 惰性化
  ├── DeltaCache 实现 + read_project_file 集成
  ├── 搜索/读取缓存 LRU 化
  └── 回归测试

Week 5: 稳定化 + 性能调优
  ├── Token 节省基准测试全部通过
  ├── 冷启动管线端到端验证
  ├── 增量扫描管线端到端验证
  └── 文档更新
```

---

## 8. 预期效果量化

| 指标 | 改造前 | 改造后 | 改进 |
|------|--------|--------|------|
| 大文件读取 (2000 行) | ~16K tokens | ~400 tokens (outline) | **-97%** |
| 文件骨架准确率 | ~85% (regex) | ~99% (Tree-sitter) | **+14pp** |
| 终端输出对 LLM 可见性 | 0% (只看到摘要) | 100% (stdout 进入消息) | **修复致命 bug** |
| `git status` 输出 (压缩后) | 1-3K tokens | 30-100 tokens | **-96%** |
| `vitest run` 输出 (200 tests) | 5-25K tokens | 50-500 tokens | **-98%** |
| 代码搜索延迟 (5000 文件) | 2-5s | 50-200ms (rg) | **-96%** |
| 二次文件读取 | 3-5K tokens | ~30 tokens (delta) | **-99%** |
| 首轮 Schema | ~2K tokens | ~600 tokens | **-70%** |
| L3 后 token 利用率 | 虚高 (bug) | 真实反映 | 修复 bug |
| 极端长会话生存能力 | L3 后无法恢复 | L4 LLM 摘要接入 | 新能力 |

---

## 附录 A: 设计文档对应表

| `agent-tool-capabilities.md` 概念 | 本文方案 | 代码位置 |
|----------------------------------|---------|---------|
| `code.search` rg 后端 | Phase 1: RipgrepSearch | `lib/tools/code-intel/RipgrepSearch.ts` |
| `code.read` 自适应 | Phase 1: read_project_file 改造 | `lib/tools/handlers/project-access.ts` |
| `code.skeleton` Tree-sitter | Phase 1: get_file_summary AstAnalyzer 桥接 | `lib/tools/handlers/project-access.ts` (复用 `lib/core/ast/`) |
| `code.symbol` | 延后 — 复用 `ast-graph.ts` `query_code_graph` | 现有 `ast-graph.ts` |
| `terminal.exec` + OutputCompressor | Phase 0+2: OutputCompressor | `lib/tools/output/OutputCompressor.ts` |
| `terminal.test` | Phase 0: TestOutputParser | OutputCompressor 内置 parser |
| `knowledge.submit` Schema 验证 | 现有 SchemaValidator.ts 已满足 | `lib/tools/core/SchemaValidator.ts` |
| `memory.store/recall` Freshness | Phase 4 (延后): 结合 MemoryCoordinator | `lib/agent/context/ExplorationTracker.ts` |
| CapabilityV2 allowedActions | 延后 — 现有 Capability 白名单可用 | `lib/agent/capabilities/*.ts` |
| Token Budget Manager | Phase 0: L3 修复 + L4 接入 | `lib/agent/context/ContextWindow.ts` |

## 附录 B: 审计数据来源

| 文件 | 行数 | 审计范围 |
|------|------|---------|
| `lib/tools/handlers/project-access.ts` | 1143 | 全文逐行 |
| `lib/tools/handlers/composite.ts` | 744 | 全文逐行 |
| `lib/tools/core/ToolRouter.ts` | 560 | 全文逐行 |
| `lib/tools/core/InternalToolHandler.ts` | 143 | 全文逐行 |
| `lib/agent/context/ContextWindow.ts` | 893 | 全文逐行 |
| `lib/agent/capabilities/*.ts` | 6 文件 | 全文逐行 |
| `lib/core/ast/index.ts` | 168 | 全文逐行 |
| `lib/core/ast/parser-init.ts` | 80 | 全文逐行 |
| `lib/core/ast/lang-typescript.ts` | 818 | 前 80 行 + 结构 |
| `lib/tools/adapters/terminal-adapter/TerminalRunExecutor.ts` | ~170 | 前 100 行 + 关键路径 |
| `lib/tools/adapters/terminal-adapter/TerminalEnvelopes.ts` | ~170 | 前 80 行 |
| `lib/tools/adapters/terminal-adapter/TerminalExecutorShared.ts` | ~350 | 前 120 行 |
| `lib/tools/handlers/index.ts` | 251 | 全文逐行 |
