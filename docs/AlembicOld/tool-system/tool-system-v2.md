# Alembic Tool System V2 — 从头设计

> **状态**: Phase 1-7 完成 ✅ — V2 全面接管，安全/校验/并发/截断全部到位
> **目标**: 完全替代现有 60+ 工具系统，构建面向 LLM 的极简、高效、可扩展工具集
> **原则**: 从业务场景反推能力，不受旧工具结构约束

### 实现进度

| 阶段 | 状态 | 说明 |
|------|------|------|
| Phase 1: 核心模块 | ✅ 完成 | `lib/tools/v2/` 35 个文件，TypeScript 零错误 |
| Phase 2: 运行时集成 | ✅ 完成 | V2 直接接管，无兼容层，无降级 |
| Phase 3: E2E 验证 | ✅ 完成 | BiliDili 真实项目 50/50 测试通过 |
| Phase 4: 清理旧代码 | ✅ 完成 | V1 handlers(14) + ToolRouter + 重型依赖(9) + 废弃测试(7) 已删除 |
| Phase 5: V1 引用替换 | ✅ 完成 | ~40 个文件 ~218 处 V1 工具名直接替换为 V2 |
| Phase 6: 语义精炼 | ✅ 完成 | 删除 bridge.ts 死代码，增强类型精度，修复 adapter 语义 |
| Phase 7: 文档审计补齐 | ✅ 完成 | Seatbelt 沙箱 + 参数校验 + 并发控制 + 输出截断 + cwd 校验 |

### 清理结果

| 维度 | 清理前 | 清理后 |
|------|--------|--------|
| V1 文件数 | 73 | 48 (保留平台适配器 + 类型定义) |
| V2 文件数 | 36 | 35 (删除 bridge.ts 死代码) |
| 已删 V1 文件 | — | 33 个 (handlers + ToolRouter + GovernanceEngine 等) |
| V1 ToolRouter | 560 行重型路由 | LightweightRouter (140 行轻量替代) |
| V1 工具名引用 | ~218 处 | 0 (全部替换为 V2 名称) |

### 仍保留的 V1 文件 (48 个)

```
lib/tools/
├── adapters/          # 平台适配器 (Dashboard/Terminal/Skill/Mac/Workflow) — V2 未覆盖
├── catalog/           # 工具注册/清单 (非 Agent 表面仍需要)
├── core/              # 类型定义 + LightweightRouter (V2 adapter 依赖)
└── workflow/          # WorkflowRegistry
```

### V2 文件清单 (36 文件)

```
lib/tools/v2/
├── types.ts                          # 核心类型 + DI 接口
├── index.ts                          # Barrel export
├── registry.ts                       # TOOL_REGISTRY (6 工具, 17 actions)
├── router.ts                         # ToolRouterV2 (解析/校验/分发)
├── adapter/                          # 🆕 运行时集成适配层
│   ├── index.ts                      # Barrel export
│   ├── V2ToolRouterAdapter.ts        # implements ToolRouterContract
│   ├── V2CapabilityCatalog.ts        # 替代 UnifiedToolCatalog 的 schema 生成
│   └── ToolContextFactory.ts         # ToolCallRequest → ToolContext 组装
├── cache/
│   ├── DeltaCache.ts                 # 文件增量缓存 (LRU + MD5)
│   └── SearchCache.ts                # 搜索结果缓存 (LRU)
├── compressor/
│   ├── strip.ts                      # ANSI 清理 + 行折叠 + 截断
│   ├── OutputCompressor.ts           # 压缩编排器
│   └── parsers/                      # 8 个特化解析器
│       ├── GitStatusParser.ts
│       ├── GitDiffParser.ts
│       ├── GitLogParser.ts
│       ├── TestOutputParser.ts
│       ├── LintOutputParser.ts
│       ├── GrepParser.ts
│       ├── TreeParser.ts
│       └── PackageParser.ts
├── handlers/
│   ├── code.ts                       # code.{search,read,outline,structure,write}
│   ├── terminal.ts                   # terminal.exec
│   ├── knowledge.ts                  # knowledge.{search,submit,detail,manage}
│   ├── graph.ts                      # graph.{overview,query}
│   ├── memory.ts                     # memory.{save,recall}
│   └── meta.ts                       # meta.{tools,plan,review}
└── capabilities/
    ├── CapabilityV2.ts               # 🔄 extends V1 Capability (直接兼容)
    ├── index.ts                      # Barrel export
    ├── BootstrapAnalyze.ts           # code_analysis (冷启动.分析)
    ├── BootstrapProduce.ts           # knowledge_production (冷启动.生产)
    ├── ScanAnalyze.ts                # scan_analyze (增量扫描.分析)
    ├── ScanProduce.ts                # scan_production (增量扫描.生产)
    ├── Evolution.ts                  # evolution_analysis (知识进化)
    ├── ConversationV2.ts             # conversation (对话 + buildContext + onAfterStep)
    └── SystemV2.ts                   # system_interaction (系统交互)
```

### 已修改的集成文件

| 文件 | 改动 |
|------|------|
| `lib/agent/capabilities/CapabilityRegistry.ts` | V1 能力类全部替换为 V2 |
| `lib/agent/capabilities/index.ts` | 重导出 V2 能力类（保持旧别名） |
| `lib/agent/service/AgentRuntimeBuilder.ts` | 支持外部注入 `toolRouter` |
| `lib/injection/modules/AgentModule.ts` | DI: `capabilityCatalog` → V2CapabilityCatalog, `toolRouter` → V2ToolRouterAdapter |

**文档结构**:

| 部分 | 章节 | 内容 |
|------|------|------|
| **需求分析** | §1 | 项目使命、Agent 场景、核心能力 |
| **设计决策** | §2, §13 | 设计原则、ADR 记录 |
| **工具集设计** | §3 | 6 个工具的完整 API 规格 |
| **场景配置** | §4 | Capability V2 + 工具矩阵 |
| **协议与架构** | §5-§7 | LLM 交互、执行链路、注册表 |
| **旧系统映射** | §8 | 65+ → 6 的完整映射表 |
| **迁移计划** | §9 | 4 阶段, 5 周 |
| **效果预期** | §10 | token 节省量化 |
| **核心组件** | §11-§12 | OutputCompressor, DeltaCache |
| **实现细节** | §14 | 文件结构、类型、代码示例 |
| **安全与测试** | §15-§16 | 三层安全模型、测试矩阵 |
| **🆕 集成方案** | §17-§20 | 运行时适配、Capability 桥接、上下文映射 |
| **🆕 实施路线图** | §21 | 代码改动清单、验收标准 |
| **附录** | A-C | 严重问题、ripgrep 集成、submit 校验 |

---

## 1. 项目使命与 Agent 角色

### 1.1 Alembic 是什么

Alembic 是一个**代码知识蒸馏系统**（Auto Source Distill）:
- 输入: 项目源码
- 输出: 结构化的 Recipe（编码模式 / 规范 / 事实）
- 用户: 开发者 + AI Agent（通过 Cursor Rules 等消费 Recipe）

### 1.2 Agent 被调用的场景

| 场景 | 触发方 | Agent 任务 | 产出 |
|------|--------|-----------|------|
| **冷启动** (bootstrap) | 系统管线 | 分析项目源码 → 提取知识候选 | Recipe 候选集 |
| **增量扫描** (rescan) | 系统管线 | 扫描变更文件 → 更新/新增知识 | 新增/更新的 Recipe |
| **知识进化** (evolution) | 系统管线 | 验证现有 Recipe 是否仍然准确 | 进化提案 / 废弃确认 |
| **对话** (conversation) | 用户 | 回答知识库相关问题 / 手动编辑知识 | 文本回复 + 可选操作 |
| **MCP 服务** | 外部 IDE | 暴露知识查询和管理能力 | MCP 工具调用结果 |

### 1.3 核心能力需求 (从场景反推)

从所有场景中提取的**最小能力集**:

| 能力 | 冷启动 | 增量扫描 | 进化 | 对话 | 说明 |
|------|:------:|:-------:|:----:|:----:|------|
| 读代码 | ★★★ | ★★ | ★★ | ★ | 读文件、搜索、理解结构 |
| 执行命令 | ★ | ★ | ★ | — | 运行测试、获取环境信息 |
| 查询知识 | — | ★ | ★★★ | ★★★ | 搜索已有 Recipe/知识图谱 |
| 提交知识 | ★★★ | ★★★ | ★ | ★ | 创建/更新 Recipe 候选 |
| 管理知识 | — | — | ★★ | ★ | 废弃/发布/评分 |
| 记忆 | ★★ | ★ | ★ | ★ | 跨轮次记录发现 |

---

## 2. 设计原则

### 2.1 从业界学到的

| 原则 | 来源 | 实践 |
|------|------|------|
| **工具数 ≤ 10** | Claude Code (7), Cursor (8), Codex CLI (6) | 每个场景暴露 4-8 个工具 |
| **资源导向** | REST / MCP standard | 工具 = 对一类资源的操作集 |
| **输出压缩内置** | Cursor grep 输出, Codex 终端输出 | 工具返回时已是 LLM 友好的紧凑格式 |
| **Schema 极简** | Claude Code lightweight schema | 首行描述 + 最少必填参数 |
| **自适应行为** | Sweep AI smart read, Cline chunked read | 工具内部自动选择最优策略 |
| **批量支持** | 现有系统 patterns[]/filePaths[] | 减少工具调用轮次 |
| **确定性优先** | ripgrep > grep, Tree-sitter > regex | 用最可靠的底层引擎 |

### 2.2 设计红线

1. **不为 LLM 的不稳定输入做过度兼容** — 参数规范化在 schema 层统一处理，handler 只接受规范名
2. **不在工具层做业务逻辑** — 工具是纯粹的能力原语，编排在 prompt/capability 层
3. **不返回未压缩的原始文本** — 每个工具的返回值都有 token budget 约束
4. **不硬编码工具名** — 所有工具 metadata 声明式定义，运行时动态注册

---

## 3. V2 工具集设计

### 3.1 总览: 6 个工具

```
┌──────────────────────────────────────────────────────────────┐
│                   Alembic Tool System V2                      │
├────────────┬────────────┬──────────┬──────────┬──────────────┤
│   code     │  terminal  │ knowledge│  graph   │   memory     │
│            │            │          │          │              │
│ .search    │ .exec      │ .search  │ .query   │ .save        │
│ .read      │            │ .submit  │ .overview│ .recall      │
│ .outline   │            │ .detail  │          │              │
│ .structure │            │ .manage  │          │              │
│ .write     │            │          │          │              │
├────────────┴────────────┴──────────┴──────────┴──────────────┤
│                        meta                                   │
│                                                               │
│ .tools     (查询可用工具和参数 schema)                          │
│ .plan      (记录执行计划)                                      │
│ .review    (自检已提交的候选质量)                                │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 工具详细设计

---

#### Tool 1: `code` — 代码智能

> Agent 与项目源码交互的统一入口。内置自适应策略和输出压缩。

**Actions:**

| Action | 功能 | 关键参数 | 输出特征 |
|--------|------|---------|---------|
| `search` | 搜索源码 | `patterns[]`, `glob?`, `maxResults?` | 结构化匹配列表 |
| `read` | 读取文件 | `path`, `startLine?`, `endLine?` | 自适应: 小文件全文/大文件outline |
| `outline` | 文件骨架 | `path`, `kinds?` | Tree-sitter AST 签名列表 |
| `structure` | 目录结构 | `directory?`, `depth?` | 紧凑目录树 |
| `write` | 写入文件 | `path`, `content` | 确认信息 |

**`code.search` 实现规格:**

```typescript
{
  tool: 'code',
  action: 'search',
  params: {
    patterns: string[];          // 搜索模式列表 (批量, 最多 10)
    glob?: string;               // 文件 glob 过滤 (如 "*.ts")
    maxResults?: number;         // 默认 10, 最大 50
    contextLines?: number;       // 默认 2
    regex?: boolean;             // 默认 false (literal match)
  }
}
```

引擎优先级: **ripgrep** (rg --json) → 内存 regex (降级)

输出格式:
```json
{
  "total": 23,
  "shown": 10,
  "matches": [
    {
      "file": "lib/auth/service.ts",
      "line": 42,
      "content": "export async function authenticate(creds: Credentials): Promise<User> {",
      "context": ["  const db = this.getDB();", "MATCH", "  const user = await db.findUser(creds.email);"]
    }
  ]
}
```

**`code.read` 实现规格:**

```typescript
{
  tool: 'code',
  action: 'read',
  params: {
    path: string;                // 相对于项目根的文件路径
    startLine?: number;          // 1-based, inclusive
    endLine?: number;            // 1-based, inclusive
  }
}
```

自适应策略 (对 LLM 透明):

```
收到 read(path) 请求
  │
  ├─ delta 缓存命中 && 内容未变 → 返回 "[unchanged since last read]"
  │
  ├─ 文件 ≤ 500 行 → 返回全文 + 行号
  │
  ├─ 文件 > 500 行 && 无行范围 → 返回 Tree-sitter outline + 提示
  │  "File has {N} lines. Showing outline. Use startLine/endLine to read sections."
  │
  └─ 有 startLine/endLine → 返回指定范围 + 行号
```

引擎: **Tree-sitter** (复用 `lib/core/ast/` 现有 11 语言 Walker) → regex 降级

**`code.outline` 实现规格:**

```typescript
{
  tool: 'code',
  action: 'outline',
  params: {
    path: string;
    kinds?: ('class' | 'function' | 'interface' | 'type' | 'method' | 'enum')[];
    maxDepth?: number;           // 默认不限, 大文件自动收缩
  }
}
```

输出格式 (紧凑文本):
```
// 245 lines, TypeScript, Tree-sitter AST

class AuthService extends BaseService [1-245]
  config: AuthConfig
  db: Database
  async authenticate(creds: Credentials): Promise<User> [12-45]
  private hashPassword(pwd: string): string [47-62]
  validateToken(token: string): TokenPayload [64-120]

interface AuthConfig [247-260]
  jwtSecret: string
  tokenExpiry: number

type UserRole = 'admin' | 'user' | 'guest' [262]
```

引擎: `AstAnalyzer.analyzeFile()` → 格式化输出

**`code.structure` 实现规格:**

```typescript
{
  tool: 'code',
  action: 'structure',
  params: {
    directory?: string;          // 默认项目根
    depth?: number;              // 默认 3, 最大 5
  }
}
```

输出: 紧凑 ASCII 目录树 (不含文件大小和行数统计)

**`code.write` 实现规格:**

```typescript
{
  tool: 'code',
  action: 'write',
  params: {
    path: string;
    content: string;
    createDirectories?: boolean;  // 默认 false
  }
}
```

安全: SafetyPolicy 检查, 危险路径拦截, 沙箱内执行

---

#### Tool 2: `terminal` — 终端执行

> 在沙箱中执行命令，返回结构化的压缩输出。

**Actions:**

| Action | 功能 | 关键参数 |
|--------|------|---------|
| `exec` | 执行命令 | `command`, `cwd?`, `timeout?` |

```typescript
{
  tool: 'terminal',
  action: 'exec',
  params: {
    command: string;             // 完整命令字符串 (如 "git status")
    cwd?: string;                // 工作目录, 默认项目根
    timeout?: number;            // ms, 默认 30000
  }
}
```

执行流程:
```
command 输入
  ├─ 安全策略检查 (危险命令拦截: sudo/rm -rf/shutdown 等)
  ├─ macOS Seatbelt 沙箱执行 (sandbox-exec -f profile)
  ├─ stdout/stderr 捕获 (maxBuffer 1MB)
  ├─ OutputCompressor 结构化压缩:
  │   ├─ git status → { staged:[], modified:[], untracked:[] }
  │   ├─ git diff   → { files:[], hunks:N, +lines/-lines summary }
  │   ├─ test run   → { passed:N, failed:N, errors:[{test,msg}] }
  │   ├─ lint       → { errors:N, warnings:N, top5:[] }
  │   └─ generic    → head + tail + "N lines omitted"
  ├─ ANSI strip
  └─ token budget 截断
```

输出示例 (`git status`):
```json
{
  "exitCode": 0,
  "output": "staged(2): lib/auth.ts, test/auth.test.ts\nmodified(3): README.md, package.json, lib/config.ts\nuntracked(1): lib/new-feature.ts",
  "_compression": { "parser": "git-status", "ratio": 0.05 }
}
```

输出示例 (`npm test`):
```json
{
  "exitCode": 1,
  "output": "[test summary]\nTests: 198 passed, 2 failed\n\n[failures]\nFAIL src/auth.test.ts > authenticate > should reject expired tokens\n  Expected: 401\n  Received: 200",
  "_compression": { "parser": "test-output", "ratio": 0.03 }
}
```

---

#### Tool 3: `knowledge` — 知识管理

> Agent 与 Alembic 知识库交互的统一入口。

**Actions:**

| Action | 功能 | 关键参数 |
|--------|------|---------|
| `search` | 搜索知识库 | `query`, `kind?`, `limit?` |
| `submit` | 提交知识候选 | `title`, `content`, `kind`, ... |
| `detail` | 获取 Recipe 详情 | `id` |
| `manage` | 生命周期操作 | `operation`, `id`, ... |

**`knowledge.search` 实现规格:**

```typescript
{
  tool: 'knowledge',
  action: 'search',
  params: {
    query: string;               // 自然语言查询
    kind?: 'recipe' | 'candidate' | 'all';  // 默认 'all'
    limit?: number;              // 默认 10
    category?: string;           // 按分类过滤
  }
}
```

引擎: SearchEngine (BM25 + 可选向量) → 结果截断 500 字符/条

**`knowledge.submit` 实现规格:**

```typescript
{
  tool: 'knowledge',
  action: 'submit',
  params: {
    title: string;
    description: string;
    content: {
      markdown: string;          // 项目特写 Markdown (≥200 字符)
      rationale: string;         // 设计原理说明
      pattern?: string;          // 核心代码骨架
    };
    kind: 'rule' | 'pattern' | 'fact';
    trigger: string;             // @前缀 kebab-case 标识符
    whenClause: string;          // 触发场景
    doClause: string;            // 正向指令
    dontClause?: string;         // 反向约束
    tags?: string[];
    reasoning?: {
      whyStandard?: string;
      sources?: string[];
      confidence?: number;
    };
  }
}
```

内部流程:
1. 字段校验 (JSON Schema / ajv)
2. 相似度查重 (findSimilarRecipes, 阈值 0.7)
3. RecipeProductionGateway.create
4. 返回结果 (created / duplicate_blocked / validation_failed)

**`knowledge.detail` 实现规格:**

```typescript
{
  tool: 'knowledge',
  action: 'detail',
  params: {
    id: string;                  // Recipe 或候选 ID
  }
}
```

**`knowledge.manage` 实现规格:**

```typescript
{
  tool: 'knowledge',
  action: 'manage',
  params: {
    operation: 'approve' | 'reject' | 'publish' | 'deprecate' | 'update'
              | 'score' | 'validate' | 'evolve' | 'skip_evolution';
    id: string;
    reason?: string;
    data?: Record<string, unknown>;  // operation-specific 数据
  }
}
```

合并了现有 10+ 个生命周期工具和 3 个进化工具为统一接口。

---

#### Tool 4: `graph` — 代码图谱查询

> 查询项目的 AST 结构图谱和代码实体关系。

**Actions:**

| Action | 功能 | 关键参数 |
|--------|------|---------|
| `overview` | 项目 AST 概览 | — |
| `query` | 实体/关系查询 | `action`, `entity?`, ... |

**`graph.overview` 实现规格:**

```typescript
{
  tool: 'graph',
  action: 'overview',
  params: {}                     // 无参数
}
```

返回: 项目类/接口/协议/函数统计, 按语言/模块分组的紧凑概览。
引擎: ProjectGraph.getOverview()

**`graph.query` 实现规格:**

```typescript
{
  tool: 'graph',
  action: 'query',
  params: {
    type: 'class' | 'protocol' | 'hierarchy' | 'callers' | 'callees'
          | 'overrides' | 'extensions' | 'impact' | 'search';
    entity?: string;             // 实体名 (class/method/function)
    limit?: number;              // 默认 20
  }
}
```

统一了现有 `get_class_info`, `get_class_hierarchy`, `get_protocol_info`,
`get_method_overrides`, `get_category_map`, `query_code_graph`, `query_call_graph` 7 个工具。

引擎: ProjectGraph (内存 AST) + CodeEntityGraph (SQLite 持久化)

---

#### Tool 5: `memory` — Agent 工作记忆

> 跨轮次的发现记录和召回。

**Actions:**

| Action | 功能 | 关键参数 |
|--------|------|---------|
| `save` | 记录发现 | `key`, `content`, `tags?` |
| `recall` | 召回记录 | `query?`, `tags?` |

```typescript
// memory.save
{
  tool: 'memory',
  action: 'save',
  params: {
    key: string;                 // 发现标识
    content: string;             // 发现内容
    tags?: string[];             // 标签 (用于过滤)
    category?: string;           // 维度 ID (bootstrap 场景)
  }
}

// memory.recall
{
  tool: 'memory',
  action: 'recall',
  params: {
    query?: string;              // 关键词查询
    tags?: string[];             // 按标签过滤
    limit?: number;              // 默认 10
  }
}
```

引擎: SessionStore (内存, 随会话生命周期) + MemoryCoordinator (可选持久化)

---

#### Tool 6: `meta` — 元工具

> Agent 的自省和规划能力。

**Actions:**

| Action | 功能 | 关键参数 |
|--------|------|---------|
| `tools` | 查询工具详情 | `name?` |
| `plan` | 记录执行计划 | `steps`, `strategy` |
| `review` | 自检提交质量 | — |

```typescript
// meta.tools — 按需加载完整 schema
{
  tool: 'meta',
  action: 'tools',
  params: {
    name?: string;               // 查询特定工具的完整 schema
  }
}

// meta.plan — 结构化任务规划
{
  tool: 'meta',
  action: 'plan',
  params: {
    steps: Array<{ id: number; action: string; tool?: string }>;
    strategy: string;
  }
}

// meta.review — 自检已提交候选
{
  tool: 'meta',
  action: 'review',
  params: {}
}
```

---

## 4. Capability V2: 场景级工具集

每个业务场景只暴露需要的工具和 action:

### 4.1 Capability 定义

```typescript
interface CapabilityV2 {
  name: string;
  promptFragment: string;        // 系统 prompt 注入
  allowedTools: {
    [toolName: string]: string[];  // tool → allowed actions
  };
}
```

### 4.2 场景工具矩阵

| 场景 | code | terminal | knowledge | graph | memory | meta | 总工具数 |
|------|:----:|:--------:|:---------:|:-----:|:------:|:----:|:--------:|
| **冷启动.分析** | search,read,outline,structure | exec | — | overview,query | save,recall | plan | **5** |
| **冷启动.生产** | read | — | submit | — | recall | review | **3** |
| **增量扫描.分析** | search,read,outline | exec | search | query | save | — | **5** |
| **增量扫描.生产** | read | — | submit | — | recall | — | **3** |
| **知识进化** | search,read | — | search,detail,manage | query | — | — | **4** |
| **对话** | search,read,outline,structure | — | search,detail,submit | overview,query | save,recall | tools | **5** |
| **系统交互** | search,read,outline,structure,write | exec | — | overview | — | tools | **4** |

### 4.3 旧 Capability → V2 Capability 映射

| 旧 Capability | 旧工具数 | V2 Capability | V2 工具数 | 说明 |
|--------------|:-------:|--------------|:--------:|------|
| `CodeAnalysis` | 17 | **冷启动.分析** | 5 | AST 11 工具 → graph 1 工具; 5 项目访问 → code 1 工具 |
| `KnowledgeProduction` | 7 | **冷启动.生产** | 3 | check_duplicate/validate 内置于 submit |
| `ScanProduction` | 2 | **增量扫描.生产** | 3 | collect_scan_recipe → knowledge.submit(mode=scan) |
| `EvolutionAnalysis` | 11 | **知识进化** | 4 | 3 进化工具 → knowledge.manage |
| `Conversation` | 8 | **对话** | 5 | 扩展为全功能: code + knowledge + graph + memory + meta |
| `SystemInteraction` | 17 | **系统交互** | 4 | 7 终端工具 → terminal 1; 4 Mac 工具 → terminal.exec |

关键变化:
- 每个场景暴露 **3-5 个工具** (旧系统 2-17)
- 通过 action 白名单精确控制 (如冷启动生产阶段只能 `knowledge.submit`, 不能 `knowledge.manage`)
- prompt fragment 自动生成，不再手写
- Mac 系统工具通过 `terminal.exec` 间接调用，不暴露专用工具

### 4.4 Prompt 自动生成

```typescript
function generatePromptFragment(capability: CapabilityV2): string {
  const lines: string[] = [];
  for (const [tool, actions] of Object.entries(capability.allowedTools)) {
    const toolSpec = TOOL_REGISTRY[tool];
    lines.push(`- **${tool}**: ${actions.map(a => `${a}(${toolSpec.actions[a].summary})`).join(', ')}`);
  }
  return `## 可用工具\n${lines.join('\n')}`;
}
```

---

## 5. LLM 交互协议

### 5.1 工具调用格式

LLM 发出的工具调用遵循 OpenAI / Anthropic function calling 标准:

```json
{
  "type": "function",
  "function": {
    "name": "code",
    "arguments": "{\"action\":\"search\",\"params\":{\"patterns\":[\"authenticate\",\"login\"],\"glob\":\"*.ts\"}}"
  }
}
```

V2 Router 解析 `arguments` 后提取 `action` + `params`，分发给对应 handler。

### 5.2 并行工具调用

LLM 可以在同一轮次发出多个工具调用（parallel tool calls）:

```json
[
  { "name": "code", "arguments": "{\"action\":\"search\",\"params\":{\"patterns\":[\"AuthService\"]}}" },
  { "name": "graph", "arguments": "{\"action\":\"overview\",\"params\":{}}" }
]
```

V2 Router 对并行请求:
1. **并发执行** — 不同工具之间无状态依赖
2. **总 token 预算分配** — 每个工具按权重分配 budget
3. **统一返回** — 所有结果收齐后批量写入 ContextWindow

### 5.3 工具返回格式

所有工具返回统一结构:

```json
{
  "ok": true,
  "data": { ... },
  "_meta": {
    "cached": false,
    "compression": { "parser": "ripgrep", "ratio": 0.25 },
    "tokensEstimate": 450,
    "durationMs": 120
  }
}
```

其中 `_meta` 对 LLM 不可见（由 ContextWindow 消费），`data` 直接序列化为 tool result message。

---

## 6. 执行架构

### 6.1 调用链路

```
LLM 返回 { tool: "code", action: "search", params: {...} }
  │
  ▼
ToolRouter V2
  ├─ Schema 校验 (轻量内联: required 字段 + enum 值校验)
  ├─ Capability 检查 (当前场景是否允许 tool.action)
  ├─ 并发控制 (single=同工具互斥 / exclusive=全局独占 / parallel=并行)
  ├─ 缓存查询 (delta cache / search cache, 在 handler 层集成)
  ├─ Handler 分发
  └─ 输出截断 (maxOutputTokens 强制执行, head+tail 保留策略)
       │
       ├─ code handler → RipgrepSearch / AstAnalyzer / fs
       ├─ terminal handler → SandboxExecutor → OutputCompressor
       ├─ knowledge handler → RecipeProductionGateway / SearchEngine
       ├─ graph handler → ProjectGraph / CodeEntityGraph
       ├─ memory handler → SessionStore
       └─ meta handler → ToolRegistry
  │
  ▼
结果压缩 (内置于每个 handler)
  │
  ▼
Token Budget 截断 (ContextWindow.getToolResultQuota)
  │
  ▼
写入 ContextWindow → 发送给 LLM
```

### 6.2 Schema 策略

**首轮 (轻量模式):**

每个工具只暴露名称 + 一行描述 + 最少参数:

```json
[
  { "name": "code", "description": "Code intelligence: search, read, outline, structure, write", "parameters": { "type": "object", "properties": { "action": { "type": "string", "enum": ["search","read","outline","structure","write"] }, "params": { "type": "object" } }, "required": ["action","params"] } },
  { "name": "terminal", "description": "Execute commands in sandbox", "parameters": { "type": "object", "properties": { "action": { "type": "string", "enum": ["exec"] }, "params": { "type": "object" } }, "required": ["action","params"] } },
  ...
]
```

**Schema 总 token**: ~600-800 (旧系统 2-3K, 减少 70%)

**按需展开:** LLM 调用 `meta.tools({ name: "code" })` 获取完整的 action 参数 schema。

### 6.3 ContextWindow 改进

保留现有 5 层压缩策略 (L0-L4)，修复已知 bug:

1. **`estimateTokens()` 使用投影消息** — 修复 L3 折叠后 token 不下降的 bug
2. **接入 L4 LLM 摘要** — 极端长会话不再 token 爆满
3. **终端输出进入 LLM 消息** — 修复 stdout/stderr 不可见的致命 bug

---

## 7. 工具注册表: 单一真相源

```typescript
// lib/tools/v2/registry.ts

interface ToolAction {
  summary: string;                // 一行描述 (用于轻量 schema)
  description: string;            // 完整描述
  params: JSONSchema;             // 参数 schema
  handler: (params: any, ctx: ToolContext) => Promise<ToolResult>;
  cache?: 'none' | 'session' | 'delta';
  concurrency?: 'parallel' | 'single' | 'exclusive';
  risk?: 'read-only' | 'write' | 'side-effect';
  maxOutputTokens?: number;       // 输出 token 上限
}

interface ToolSpec {
  name: string;
  description: string;            // 工具描述
  actions: Record<string, ToolAction>;
}

const TOOL_REGISTRY: Record<string, ToolSpec> = {
  code: {
    name: 'code',
    description: 'Code intelligence: search, read, outline, structure, write',
    actions: {
      search: { summary: 'Search source code', ... },
      read:   { summary: 'Read file content', ... },
      outline:{ summary: 'File AST skeleton', ... },
      structure: { summary: 'Directory tree', ... },
      write:  { summary: 'Write file', ... },
    },
  },
  terminal: { ... },
  knowledge: { ... },
  graph: { ... },
  memory: { ... },
  meta: { ... },
};
```

**新增工具/action 只需在注册表中加一行** — 无需修改 6+ 文件。

---

## 8. 与旧系统的映射

### 8.1 工具映射表

| 旧工具 (60+) | V2 工具.action | 说明 |
|-------------|---------------|------|
| `search_project_code` | `code.search` | ripgrep 后端 + 批量 |
| `read_project_file` | `code.read` | 自适应 + delta cache |
| `get_file_summary` | `code.outline` | Tree-sitter 替代 regex |
| `list_project_structure` | `code.structure` | 异步化, 不计行数 |
| `write_project_file` | `code.write` | SafetyPolicy |
| `semantic_search_code` | `code.search` (mode=semantic) | 统一为搜索 action |
| `terminal_run/shell/pty` | `terminal.exec` | 统一入口 + OutputCompressor |
| `get_environment_info` | `terminal.exec` (内置) | 环境信息由 exec 命令获取 |
| `search_recipes/candidates/knowledge` | `knowledge.search` | 统一搜索 |
| `submit_knowledge/submit_with_check` | `knowledge.submit` | 统一提交 (内含查重) |
| `get_recipe_detail` | `knowledge.detail` | — |
| `approve/reject/publish/deprecate/update/score/validate_candidate` | `knowledge.manage` | 统一生命周期 |
| `propose_evolution/confirm_deprecation/skip_evolution` | `knowledge.manage` (operation=evolve/deprecate/skip_evolution) | 统一 |
| `get_project_overview` | `graph.overview` | — |
| `get_class_*/query_code_graph/query_call_graph` | `graph.query` | 统一查询 |
| `note_finding/get_previous_evidence` | `memory.save/recall` | — |
| `get_tool_details` | `meta.tools` | — |
| `plan_task` | `meta.plan` | — |
| `review_my_output` | `meta.review` | — |
| `analyze_code` | 移除 — prompt 编排 | 由 code.search + knowledge.search 组合替代 |
| `knowledge_overview` | 移除 — prompt 编排 | 由 knowledge.search + graph.overview 组合替代 |
| `check_duplicate` | 内置于 `knowledge.submit` | 提交时自动查重 |
| `add_graph_edge` | 移除 — 系统内部 | 不暴露给 Agent |
| `get_feedback_stats` | 移除 — 低使用率 | 可通过 knowledge.search 替代 |
| `get_related_recipes` | 内置于 `knowledge.detail` | 详情自动包含关联 |
| `record_usage` | 移除 — 系统内部 | 由管线自动记录 |
| `bootstrap_knowledge` | 移除 — 工作流层 | 不暴露给 Agent |
| `rebuild_index` | 移除 — 运维操作 | 管理 API 独立提供 |
| `query_audit_log` | 移除 — 运维操作 | 管理 API 独立提供 |
| `load_skill/create_skill/suggest_skills` | 移除 — SkillAdapter 独立路径 | 保持现有 adapter |
| `guard_check_code/list_guard_rules/query_violations/get_recommendations` | 内置于分析 prompt | Guard 检查由 Agent prompt 驱动 |
| `enrich_candidate/refine_bootstrap_candidates` | 移除 — 管线内部 | MCP handler 直接调用 |
| `collect_scan_recipe` | `knowledge.submit` (mode=scan) | 统一入口 |

### 8.2 数量对比

| 维度 | 旧系统 | V2 |
|------|--------|-----|
| 工具总数 (定义) | 65+ | **6** |
| Handler 文件数 | 14 | **6** |
| LLM 可见工具数 (每场景) | 7-17 | **3-5** |
| Schema 总 token | 2-3K | **600-800** |
| 新增工具需改文件数 | 6+ | **1** (registry) |

---

## 9. 迁移策略

### Phase 0: 并行运行 (Week 1)

1. 新建 `lib/tools/v2/` 目录
2. 实现 `registry.ts` + 6 个 handler stub
3. V2 ToolRouter 与 V1 ToolRouter 并行注册
4. 旧工具名自动路由到 V2 handler (兼容层)

### Phase 1: 核心工具 (Week 2-3)

1. `code` handler: ripgrep 后端, Tree-sitter outline, 自适应 read, delta cache
2. `terminal` handler: OutputCompressor + 沙箱执行
3. 单元测试 + token 节省基准测试

### Phase 2: 知识工具 (Week 3-4)

1. `knowledge` handler: 统一搜索/提交/管理
2. `graph` handler: 统一 AST 查询
3. `memory` handler
4. Capability V2 定义

### Phase 3: 切换 + 清理 (Week 5)

1. 所有管线切换到 V2 Capability
2. 移除旧 handler、V1 定义、CapabilityProjection
3. 端到端回归测试

---

## 10. 预期效果

| 指标 | 旧系统 | V2 | 改进 |
|------|--------|-----|------|
| 工具 Schema token | 2-3K | 600-800 | **-70%** |
| 大文件读取 (2000 行) | ~16K tokens | ~400 (outline) | **-97%** |
| `git status` 输出 | 1-3K tokens | 30-100 | **-96%** |
| `npm test` 输出 (200 tests) | 5-25K tokens | 50-500 | **-98%** |
| 终端输出对 LLM 可见性 | 0% (只看到摘要) | 100% | **修复致命 bug** |
| 代码搜索延迟 (5000 文件) | 2-5s | 50-200ms (rg) | **-96%** |
| 二次文件读取 | 3-5K tokens | ~30 tokens (delta) | **-99%** |
| 文件骨架准确率 | ~85% (regex) | ~99% (Tree-sitter) | **+14pp** |
| 新增工具改文件数 | 6+ | 1 | **-83%** |
| 完整冷启动 token | ~426K | ~100-150K | **-65~76%** |

---

## 11. OutputCompressor 详细设计

### 11.1 架构

```
handler 原始输出
  │
  ▼
OutputCompressor.compress(raw, opts)
  ├─ opts = { toolId, action, tokenBudget, commandPattern? }
  │
  ├─ Step 1: 格式清理
  │   ├─ stripAnsi(raw)           — 去除 ANSI 控制字符 (节省 10-30%)
  │   └─ collapseRepeats(raw)     — 连续相同行折叠 "(repeated N times)"
  │
  ├─ Step 2: 专用解析器 (命令感知)
  │   ├─ GitStatusParser    → { staged:[], modified:[], untracked:[] }
  │   ├─ GitDiffParser      → { files:N, hunks:[], summary:"+X/-Y" }
  │   ├─ GitLogParser       → [{ hash7, author, date, message }]
  │   ├─ TestOutputParser   → { passed:N, failed:N, errors:[], duration }
  │   ├─ LintOutputParser   → { errors:N, warnings:N, topIssues:[] }
  │   ├─ GrepParser         → [{ file, line, content }]  (deduplicated)
  │   ├─ TreeParser         → nested directory structure
  │   └─ PackageParser      → { added:N, removed:N, warnings:[] }
  │
  ├─ Step 3: 通用截断 (fallback)
  │   ├─ 输出 ≤ tokenBudget → 原样返回
  │   ├─ 输出 > tokenBudget → head(40%) + "... {N} lines omitted ..." + tail(10%)
  │   └─ 始终保留 stderr 完整输出 (通常是错误关键信息)
  │
  └─ Step 4: 结构化包装
      → { exitCode, output, _compression: { parser, ratio, original_lines } }
```

### 11.2 命令模式匹配

```typescript
const PARSER_PATTERNS: Array<[RegExp, Parser]> = [
  [/^git\s+status/,                GitStatusParser],
  [/^git\s+diff/,                  GitDiffParser],
  [/^git\s+log/,                   GitLogParser],
  [/^(vitest|jest|mocha|pytest)/,  TestOutputParser],
  [/^(eslint|biome|tsc)\b/,       LintOutputParser],
  [/^(rg|grep|ag|ack)\b/,         GrepParser],
  [/^(ls|find|tree)\b/,           TreeParser],
  [/^(npm|pnpm|yarn|bun)\b/,      PackageParser],
];
```

### 11.3 预期压缩效果

| 命令 | 原始输出 tokens | 压缩后 tokens | 压缩率 |
|------|:-------------:|:------------:|:------:|
| `git status` (中型项目) | 500-2000 | 30-100 | **95-97%** |
| `git diff` (10 文件) | 3000-8000 | 500-1500 | **75-85%** |
| `npm test` (200 tests, 3 fail) | 5000-25000 | 100-500 | **96-99%** |
| `eslint .` (50 errors) | 3000-10000 | 200-500 | **92-96%** |
| `rg "pattern"` (50 matches) | 2000-8000 | 400-1200 | **75-85%** |
| `ls -R` (大项目) | 5000-20000 | 500-2000 | **85-95%** |

---

## 12. DeltaCache 详细设计

### 12.1 架构

文件读取缓存: 同一会话中再次读取已读文件时只返回 diff。

```typescript
class DeltaCache {
  private cache = new Map<string, { hash: string; content: string; outline: string }>();
  private maxEntries = 200;

  async read(path: string, opts: ReadOpts): Promise<ReadResult> {
    const current = await fs.readFile(path, 'utf-8');
    const hash = md5(current);
    const cached = this.cache.get(path);

    if (cached && cached.hash === hash && !opts.forceRefresh) {
      return { mode: 'unchanged', output: '[unchanged since last read]' };
    }

    if (cached && cached.hash !== hash) {
      const diff = computeSimpleDiff(cached.content, current);  // 逐行对比，无外部依赖
      this.cache.set(path, { hash, content: current, outline: '' });
      return { mode: 'delta', output: formatDiffHunks(diff) };
    }

    this.cache.set(path, { hash, content: current, outline: '' });
    this.evictLRU();
    return { mode: 'full', output: current };
  }
}
```

### 12.2 效果

| 场景 | 无缓存 | DeltaCache | 节省 |
|------|:------:|:---------:|:----:|
| 再次读取未变文件 | 3-5K tokens | ~15 tokens | **99.7%** |
| 再次读取有修改文件 | 3-5K tokens | ~50-200 tokens (diff) | **95-99%** |
| 首次读取 | 正常 | 正常 (写入缓存) | 0% |

---

## 13. 关键设计决策记录 (ADR)

### ADR-1: 工具粒度 — 资源导向 + action 子命令

**决策**: 6 个资源导向工具，每个工具通过 `action` 参数分发子命令
**原因**: 减少 Schema token (6 schema vs 65 schema); 符合 MCP 标准趋势; LLM 对 6 个工具的选择准确率远高于 17 个
**风险**: action 参数错误时定位成本略高 → ajv 校验自动修正

### ADR-2: 输出压缩 — handler 内置而非后处理

**决策**: 每个 handler 返回时已是压缩格式，不依赖统一后处理
**原因**: handler 了解数据语义 (如 git status 结构)，压缩质量远高于通用截断
**风险**: handler 实现复杂度增加 → OutputCompressor 作为可复用组件

### ADR-3: Schema 加载 — 首轮轻量 + 按需展开

**决策**: LLM 首轮只看 action enum，调用 `meta.tools` 获取完整参数
**原因**: 首轮 schema 从 2-3K tokens 降到 600-800; Claude/Cursor 已验证此模式有效
**风险**: LLM 首次调用可能参数不全 → ajv 宽松模式 + 缺失参数返回 hint

### ADR-4: 终端工具 — 统一 exec 入口 + 自动模式选择

**决策**: 合并 terminal_run/shell/pty 为 `terminal.exec`，内部根据 command 自动选择执行模式
**原因**: LLM 不需要关心执行模式差异; 减少 3 个工具到 1 个
**风险**: 某些场景需要 PTY → 保留 `mode` 可选参数

### ADR-5: 复用现有 AST 管线

**决策**: 直接复用 `lib/core/ast/` 的 11 语言 Tree-sitter Walker，不引入新依赖
**原因**: web-tree-sitter 0.26.6 + 11 个 lang-*.ts Walker + resources/grammars/*.wasm 已完整可用
**风险**: AstAnalyzer 接口与新工具需求不完全匹配 → 薄桥接层

---

---

## 14. V2 文件结构

### 14.1 新建文件清单

```
lib/tools/v2/
├── registry.ts                   # 工具注册表 (单一真相源)
├── types.ts                      # ToolSpec, ToolAction, ToolResult, ToolContext
├── router.ts                     # V2 ToolRouter (schema 校验 + 分发 + 缓存)
├── compressor/
│   ├── OutputCompressor.ts       # 输出压缩主入口
│   ├── parsers/
│   │   ├── GitStatusParser.ts
│   │   ├── GitDiffParser.ts
│   │   ├── GitLogParser.ts
│   │   ├── TestOutputParser.ts
│   │   ├── LintOutputParser.ts
│   │   ├── GrepParser.ts
│   │   ├── TreeParser.ts
│   │   └── PackageParser.ts
│   └── strip.ts                  # ANSI strip + 重复行折叠
├── cache/
│   ├── DeltaCache.ts             # 文件 delta 缓存
│   └── SearchCache.ts            # 搜索结果缓存 (LRU)
├── handlers/
│   ├── code.ts                   # code 工具 handler
│   ├── terminal.ts               # terminal 工具 handler
│   ├── knowledge.ts              # knowledge 工具 handler
│   ├── graph.ts                  # graph 工具 handler
│   ├── memory.ts                 # memory 工具 handler
│   └── meta.ts                   # meta 工具 handler
├── capabilities/
│   ├── CapabilityV2.ts           # CapabilityV2 基类
│   ├── BootstrapAnalyze.ts       # 冷启动.分析
│   ├── BootstrapProduce.ts       # 冷启动.生产
│   ├── ScanAnalyze.ts            # 增量扫描.分析
│   ├── ScanProduce.ts            # 增量扫描.生产
│   ├── Evolution.ts              # 知识进化
│   ├── ConversationV2.ts         # 对话
│   └── SystemV2.ts               # 系统交互

新建文件总数: ~30 个 (bridge.ts 已在 Phase 6 删除)
删除旧文件数 (Phase 3-4): ~33 个 (handlers/ 14 + ToolRouter + 重型依赖 9 + 废弃测试 7)
```

### 14.2 核心类型定义

```typescript
// lib/tools/v2/types.ts

/** 工具调用参数 */
interface ToolCall {
  tool: string;
  action: string;
  params: Record<string, unknown>;
}

/** 工具调用结果 */
interface ToolResult {
  ok: boolean;
  data: unknown;
  error?: string;
  _meta?: {
    cached: boolean;
    compression?: { parser: string; ratio: number };
    tokensEstimate: number;
    durationMs: number;
  };
}

/** handler 上下文 (DI 注入) */
interface ToolContext {
  projectRoot: string;
  projectGraph: ProjectGraph;         // AST 图谱
  searchEngine: SearchEngine;         // 知识搜索
  recipeGateway: RecipeProductionGateway;  // 知识提交
  deltaCache: DeltaCache;             // 文件缓存
  searchCache: SearchCache;           // 搜索缓存
  sessionStore: SessionStore;         // 会话记忆
  compressor: OutputCompressor;       // 输出压缩
  tokenBudget: number;                // 本次调用 token 预算
  abortSignal?: AbortSignal;
}
```

### 14.3 Handler 实现示例 (code.ts)

```typescript
// lib/tools/v2/handlers/code.ts

import { ripgrepSearch } from './engines/ripgrep.js';
import type { ToolContext, ToolResult } from '../types.js';

export async function handle(
  action: string,
  params: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolResult> {
  switch (action) {
    case 'search':
      return handleSearch(params, ctx);
    case 'read':
      return handleRead(params, ctx);
    case 'outline':
      return handleOutline(params, ctx);
    case 'structure':
      return handleStructure(params, ctx);
    case 'write':
      return handleWrite(params, ctx);
    default:
      return { ok: false, data: null, error: `Unknown action: ${action}` };
  }
}

async function handleSearch(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const patterns = params.patterns as string[];
  const glob = params.glob as string | undefined;
  const maxResults = (params.maxResults as number) || 10;
  const contextLines = (params.contextLines as number) || 2;

  const results = await ripgrepSearch({
    patterns,
    cwd: ctx.projectRoot,
    glob,
    maxResults,
    contextLines,
    json: true,
  });

  const deduplicated = deduplicateMatches(results);
  return {
    ok: true,
    data: {
      total: results.totalMatches,
      shown: deduplicated.length,
      matches: deduplicated,
    },
    _meta: { cached: false, tokensEstimate: estimateTokens(deduplicated), durationMs: results.durationMs },
  };
}

async function handleRead(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const path = params.path as string;
  const startLine = params.startLine as number | undefined;
  const endLine = params.endLine as number | undefined;

  // DeltaCache 自适应
  const cached = ctx.deltaCache.read(path, { startLine, endLine });
  if (cached) return cached;

  const content = await readFile(path, ctx.projectRoot);
  const lines = content.split('\n').length;

  // 自适应策略
  if (startLine || endLine) {
    const slice = extractLines(content, startLine, endLine);
    return formatResult(slice, 'range');
  }
  if (lines <= 500) {
    return formatResult(content, 'full');
  }
  // 大文件自动返回 outline
  const outline = await generateOutline(path, ctx);
  return {
    ok: true,
    data: outline,
    _meta: {
      cached: false,
      tokensEstimate: estimateTokens(outline),
      durationMs: 0,
      hint: `File has ${lines} lines. Showing outline. Use startLine/endLine to read sections.`,
    },
  };
}
```

---

## 15. 安全模型

### 15.1 三层安全策略

```
Layer 1: Schema 校验 (轻量内联, 无 ajv 依赖)
  ├─ 必填检查: required 字段缺失 → 立即返回错误
  ├─ 枚举检查: enum 声明的字段值不在合法范围内 → 立即返回错误
  └─ 范围限制: maxResults/depth 等由 handler 内部约束 (默认值 + Math.min)

Layer 2: Capability 权限
  ├─ 工具级: 当前场景是否允许该工具
  ├─ Action 级: 当前场景是否允许该 action
  └─ 拒绝直接返回错误, 不执行 handler

Layer 3: Handler 内安全
  ├─ 路径沙箱: 所有文件操作限制在 projectRoot 内
  ├─ 命令拦截: 危险命令 blocklist (sudo/rm -rf/shutdown 等)
  ├─ 终端沙箱: macOS Seatbelt sandbox-exec
  ├─ 写入保护: .git/, node_modules/, .env 不可写
  └─ Token 预算: 输出超限时自动截断
```

### 15.2 风险等级标注

每个 action 在注册表中声明 risk 等级:

| 等级 | 说明 | 示例 |
|------|------|------|
| `read-only` | 只读操作, 无副作用 | code.search, code.read, graph.query |
| `write` | 可修改状态 | code.write, knowledge.submit, memory.save |
| `side-effect` | 外部副作用 | terminal.exec, knowledge.manage(publish) |

高风险操作 (side-effect) 可配置 GovernanceEngine 审批流。

### 15.3 终端安全详细设计

沿用现有 Seatbelt 沙箱 + 增强:

```
终端请求 → 命令解析
  ├─ Blocklist 检查: 危险可执行文件 (BLOCKED_BINS) + 危险命令模式 (BLOCKED_COMMANDS)
  ├─ cwd 校验: path.resolve(projectRoot, cwd).startsWith(projectRoot) — 防止目录逃逸
  ├─ Seatbelt 集成 (通过 DI 注入 SandboxExecutorBridge):
  │   ├─ buildSandboxProfile({ network:'none', filesystem:'project-write' })
  │   ├─ deny file-write* (项目外)
  │   ├─ deny network* (默认)
  │   ├─ deny process-exec (非 allowlist)
  │   ├─ allow file-read* (项目内 + /usr/bin + homebrew)
  │   └─ 自动降级: sandbox-exec 不可用时 fallback 到 plain exec + 警告
  └─ 执行 → stdout/stderr 捕获 → OutputCompressor
```

---

## 16. 测试策略

### 16.1 单元测试矩阵

| 模块 | 测试文件 | 关键用例 |
|------|---------|---------|
| `registry.ts` | `registry.test.ts` | 工具注册、schema 导出、action 枚举 |
| `router.ts` | `router.test.ts` | 分发、capability 权限拦截、未知工具 |
| `code handler` | `code.test.ts` | search 批量/regex/glob; read 自适应; outline Tree-sitter |
| `terminal handler` | `terminal.test.ts` | 沙箱执行、超时、OutputCompressor 集成 |
| `knowledge handler` | `knowledge.test.ts` | submit 查重; manage 各 operation |
| `graph handler` | `graph.test.ts` | overview; query 各 type |
| `memory handler` | `memory.test.ts` | save/recall; 会话隔离 |
| `OutputCompressor` | `compressor.test.ts` | 各 parser; ANSI strip; fallback 截断 |
| `DeltaCache` | `delta-cache.test.ts` | unchanged/delta/full; LRU 驱逐 |
| `CapabilityV2` | `capability-v2.test.ts` | action 白名单; prompt 生成 |

### 16.2 集成测试

| 场景 | 验证目标 |
|------|---------|
| 冷启动 E2E | Agent 使用 V2 工具完成完整冷启动, token 数 < 150K |
| 增量扫描 E2E | Agent 检测变更并生成正确 Recipe |
| 进化 E2E | Agent 正确标记过期 Recipe |
| 对话 E2E | 用户问答正常, 知识搜索返回 |
| Token 基准 | 各操作 token 消耗对比 V1 基线 |

### 16.3 回归测试标准

```
✅ 冷启动 token < 150K (旧 ~426K, 降 65%+)
✅ 工具 Schema token < 1K (旧 2-3K)
✅ 终端输出对 LLM 可见 (旧系统不可见)
✅ 文件骨架准确率 ≥ 98% (旧 ~85%)
✅ 搜索延迟 < 500ms (5000 文件)
✅ 所有旧 Capability 场景在 V2 下功能等价
```

---

## 17. 运行时集成方案

> V2 工具系统 (`lib/tools/v2/`) 已独立实现。本章设计如何将其接入 AgentRuntime 执行链路。

### 17.1 当前架构概览 (V1)

```
AgentRuntime.reactLoop()
  │
  ├─ #getToolSchemas()
  │    └─ container.get('capabilityCatalog') → CapabilityCatalog.toToolSchemas()
  │         └─ 返回 ToolSchemaProjection[] (65+ 工具的 JSON Schema)
  │
  ├─ #callLLM() → LLM.chatWithTools(toolSchemas)
  │    └─ LLM 返回 { functionCalls: [{ name, args, id }] }
  │
  └─ #processToolCalls()
       └─ ToolExecutionPipeline.execute(fc, context)
            ├─ before: AllowlistGate → ObservationRecord
            ├─ execute: runtime.toolRouter.execute(request)  ← ToolRouter V1
            │    └─ ToolRouter → GovernanceEngine → Adapter.execute()
            │         └─ InternalToolHandler(params, handlerContext)
            └─ after: TrackerSignal → TraceRecord → SubmitDedup
```

关键接口:
- `ToolRouterContract.execute(ToolCallRequest) → ToolResultEnvelope`
- `Capability.tools → string[]` (返回允许的工具名列表)
- `CapabilityCatalog.toToolSchemas(ids) → ToolSchemaProjection[]`

### 17.2 目标架构 (V2 集成后)

```
AgentRuntime.reactLoop()
  │
  ├─ #getToolSchemas()
  │    ├─ [V2 模式] ToolRouterV2.getSchemas() → 6 个轻量 schema
  │    └─ [V1 模式] CapabilityCatalog.toToolSchemas() (保留兼容)
  │
  ├─ #callLLM() → LLM.chatWithTools(toolSchemas)
  │    └─ LLM 返回 { functionCalls: [{ name: "code", args: '{"action":"search",...}' }] }
  │
  └─ #processToolCalls()
       └─ ToolExecutionPipeline.execute(fc, context)
            ├─ before: AllowlistGate (识别 V2 工具名)
            ├─ execute:
            │    ├─ [V2 模式] V2ToolAdapter.execute(request)
            │    │    └─ router.parseToolCall() → router.execute() → ToolResult
            │    │         └─ V2 handler(params, ToolContext)
            │    └─ [V1 降级] ToolRouter.execute() (旧路径)
            └─ after: TrackerSignal → TraceRecord → SubmitDedup
```

### 17.3 集成策略: 适配器模式

**核心思路**: 不修改 AgentRuntime 内部逻辑，通过在 ToolRouter 层注入适配器实现透明切换。

```
                        ToolRouterContract
                              │
                    ┌─────────┼─────────┐
                    │                     │
              ToolRouter (V1)      V2ToolRouterAdapter
                    │                     │
            CapabilityCatalog      ToolRouterV2
            GovernanceEngine       TOOL_REGISTRY
            65+ Adapters           6 handlers
```

AgentRuntime 通过 `this.toolRouter` 调用 `execute(ToolCallRequest)`。
V2 只需提供一个实现 `ToolRouterContract` 的适配器，将 `ToolCallRequest` 转译为 `ToolCallV2`。

---

## 18. V2ToolAdapter 适配器设计

### 18.1 核心接口

```typescript
// lib/tools/v2/adapter/V2ToolRouterAdapter.ts

import type { ToolCallRequest, ToolRouterContract } from '#tools/core/ToolContracts.js';
import type { ToolResultEnvelope } from '#tools/core/ToolResultEnvelope.js';
import type { ToolDecision } from '#tools/core/ToolDecision.js';
import { ToolRouterV2 } from '../router.js';
import type { ToolContext, ToolResult, CapabilityV2Def } from '../types.js';

export class V2ToolRouterAdapter implements ToolRouterContract {
  #router: ToolRouterV2;
  #contextFactory: ToolContextFactory;

  constructor(opts: {
    capability: CapabilityV2Def;
    contextFactory: ToolContextFactory;
  }) {
    this.#router = new ToolRouterV2({ capability: opts.capability });
    this.#contextFactory = opts.contextFactory;
  }

  async execute(request: ToolCallRequest): Promise<ToolResultEnvelope> {
    // 1. 解析 V2 tool call
    const parsed = this.#router.parseToolCall(request.toolId, request.args);
    if ('error' in parsed) {
      return errorEnvelope(parsed.error);
    }

    // 2. 组装 ToolContext
    const ctx = this.#contextFactory.create(request);

    // 3. 执行 V2 handler
    const result = await this.#router.execute(parsed, ctx);

    // 4. 转换为 ToolResultEnvelope
    return toEnvelope(result, request);
  }

  async executeChildCall(request: ToolCallRequest & { parentCallId: string }) {
    return this.execute(request);
  }

  async explain(request: ToolCallRequest): Promise<ToolDecision> {
    return {
      allowed: true,
      requiresConfirmation: false,
      riskLevel: 'low',
    } as ToolDecision;
  }
}
```

### 18.2 ToolResult → ToolResultEnvelope 转换

V2 的 `ToolResult` 需要转换为 V1 的 `ToolResultEnvelope` 以兼容现有 Pipeline:

```typescript
function toEnvelope(result: ToolResult, request: ToolCallRequest): ToolResultEnvelope {
  return {
    ok: result.ok,
    status: result.ok ? 'success' : 'error',
    text: result.ok
      ? (typeof result.data === 'string' ? result.data : JSON.stringify(result.data))
      : (result.error || 'Unknown error'),
    structuredContent: result.data,
    cache: {
      hit: result._meta?.cached ?? false,
    },
    // V1 兼容字段
    toolId: request.toolId,
    callId: crypto.randomUUID(),
    durationMs: result._meta?.durationMs ?? 0,
  };
}
```

### 18.3 混合路由策略

在过渡期同时支持 V1 和 V2 工具。ToolExecutionPipeline 的 execute 阶段判断:

```typescript
// 在 ToolExecutionPipeline 的 execute 阶段
const isV2Tool = V2_TOOL_NAMES.has(call.name);  // 'code' | 'terminal' | 'knowledge' | 'graph' | 'memory' | 'meta'

if (isV2Tool && runtime.v2Adapter) {
  envelope = await runtime.v2Adapter.execute(request);
} else {
  envelope = await runtime.toolRouter.execute(request);  // V1 fallback
}
```

或更优雅的方式: 将 V2Adapter 作为 V1 ToolRouter 的 fallback:

```typescript
// V1 ToolRouter 增加 fallback 链
class CompositeToolRouter implements ToolRouterContract {
  #primary: ToolRouterContract;   // V1
  #fallback: ToolRouterContract;  // V2 Adapter

  async execute(request: ToolCallRequest) {
    const manifest = this.#primary.catalog?.getManifest(request.toolId);
    if (manifest) {
      return this.#primary.execute(request);  // V1 有此工具，走 V1
    }
    return this.#fallback.execute(request);   // V1 没有，走 V2
  }
}
```

---

## 19. Capability V1→V2 桥接设计

### 19.1 问题分析

V1 Capability 返回 `string[]` (工具名列表如 `['search_project_code', 'read_project_file', ...]`)。
V2 Capability 返回 `Record<string, string[]>` (如 `{ code: ['search', 'read'] }`)。

这两套体系需要在过渡期共存:

| 组件 | V1 | V2 | 需要桥接 |
|------|----|----|---------|
| `Capability.tools` | `string[]` (65+ 名) | `Record<string,string[]>` (6 tool × N actions) | ✅ |
| `#collectTools()` | 合并多个 Capability 的 tools 数组 | 合并 allowedTools 字典 | ✅ |
| `#getToolSchemas()` | `CapabilityCatalog.toToolSchemas(ids)` | `ToolRouterV2.getSchemas()` | ✅ |
| `AllowlistGate` | `allowedToolIds.has(fc.name)` | `V2_TOOL_NAMES.has(fc.name)` | ✅ |

### 19.2 CapabilityV2Wrapper — 包装器

让 V2 Capability 能被现有 AgentRuntime 消费:

```typescript
// lib/tools/v2/adapter/CapabilityV2Wrapper.ts

import { Capability } from '#agent/capabilities/Capability.js';
import type { CapabilityV2 } from '../capabilities/CapabilityV2.js';

export class CapabilityV2Wrapper extends Capability {
  #v2: CapabilityV2;

  constructor(v2Cap: CapabilityV2) {
    super();
    this.#v2 = v2Cap;
  }

  get name() { return this.#v2.name; }

  get promptFragment() { return this.#v2.promptFragment; }

  /**
   * 返回 V2 工具名 (6 个) 而非 V1 工具名 (65+)。
   * AgentRuntime.#collectTools() 合并时得到的是 ['code', 'terminal', ...]
   * AllowlistGate 据此放行 V2 工具名。
   */
  get tools(): string[] {
    return Object.keys(this.#v2.allowedTools);
  }

  /** 暴露 V2 定义供 adapter 使用 */
  get v2Def() { return this.#v2.toDef(); }
}
```

### 19.3 Schema 注入

当检测到 V2 模式时，`#getToolSchemas()` 应返回 V2 的轻量 schema:

```typescript
// AgentRuntime.#getToolSchemas() 增加 V2 分支
#getToolSchemas(allowedTools: unknown[], model?: string): ToolSchemaProjection[] {
  // V2 检测: 如果 allowedTools 中包含 V2 工具名
  const v2Adapter = this.#getV2Adapter();
  if (v2Adapter) {
    const v2Schemas = v2Adapter.router.getSchemas();
    return v2Schemas.map(s => ({
      name: s.name,
      description: s.description,
      parameters: s.parameters,
    }));
  }

  // V1 fallback
  // ... 现有逻辑 ...
}
```

### 19.4 渐进替换路径

```
Week 1: V2Wrapper + CompositeRouter 就位
         ↓ 选择一个场景开启 V2 (如 BootstrapAnalyze)
         ↓ 其余场景保持 V1

Week 2: 扩展到 ScanAnalyze, Evolution
         ↓ 验证 token 下降和功能等价

Week 3: 全场景切换 V2
         ↓ Bridge 模块处理残余 V1 调用

Week 4: 移除 V1 工具定义
         ↓ 清理 CapabilityCatalog → V2 Registry 独占
```

---

## 20. ToolContext 组装方案

### 20.1 问题: 上下文映射

V1 的 `ToolCallRequest.runtime` 包含大量运行时信息:

```typescript
runtime: {
  agentId, presetName, iteration, policyValidator,
  cache, diagnostics, safetyPolicy, fileCache,
  dataRoot, lang, logger, aiProvider, sharedState,
  dimensionMeta, projectLanguage, submittedTitles,
  submittedPatterns, sessionToolCalls, bootstrapDedup,
  memoryCoordinator, dimensionScopeId, currentRound,
  terminalTest, terminalToolset, allowedTerminalModes,
}
```

V2 的 `ToolContext` 更精简:

```typescript
{
  projectRoot, projectGraph?, codeEntityGraph?,
  searchEngine?, recipeGateway?, knowledgeRepo?,
  deltaCache?, searchCache?, sessionStore?,
  compressor?, tokenBudget, abortSignal?,
  astAnalyzer?, toolRegistry?, safetyPolicy?,
}
```

### 20.2 ToolContextFactory

从 DI 容器和运行时上下文组装 `ToolContext`:

```typescript
// lib/tools/v2/adapter/ToolContextFactory.ts

import type { ToolCallRequest } from '#tools/core/ToolContracts.js';
import type { ToolContext } from '../types.js';
import { DeltaCache } from '../cache/DeltaCache.js';
import { SearchCache } from '../cache/SearchCache.js';
import { OutputCompressor } from '../compressor/OutputCompressor.js';

export interface ToolContextFactoryDeps {
  container: {
    get(name: string): unknown;
    has?(name: string): boolean;
  };
  projectRoot: string;
  dataRoot: string;
}

export class ToolContextFactory {
  #deps: ToolContextFactoryDeps;
  #deltaCache: DeltaCache;
  #searchCache: SearchCache;
  #compressor: OutputCompressor;
  #sessionStore: SimpleSessionStore;

  constructor(deps: ToolContextFactoryDeps) {
    this.#deps = deps;
    this.#deltaCache = new DeltaCache({ maxEntries: 200 });
    this.#searchCache = new SearchCache({ maxEntries: 100 });
    this.#compressor = new OutputCompressor();
    this.#sessionStore = new SimpleSessionStore();
  }

  create(request: ToolCallRequest): ToolContext {
    const rt = request.runtime;
    const container = this.#deps.container;

    return {
      projectRoot: this.#deps.projectRoot,

      // 从 DI 容器获取重量级服务
      projectGraph: tryGet(container, 'projectGraph'),
      codeEntityGraph: tryGet(container, 'codeEntityGraph'),
      searchEngine: tryGet(container, 'searchEngine'),
      recipeGateway: tryGet(container, 'recipeProductionGateway'),
      knowledgeRepo: tryGet(container, 'knowledgeRepository'),
      astAnalyzer: tryGet(container, 'astAnalyzer'),
      safetyPolicy: rt?.safetyPolicy ?? null,

      // V2 自管理的缓存/压缩器
      deltaCache: this.#deltaCache,
      searchCache: this.#searchCache,
      compressor: this.#compressor,
      sessionStore: this.#sessionStore,

      tokenBudget: 8000,
      abortSignal: request.abortSignal ?? undefined,
    };
  }
}

function tryGet(container: { get(n: string): unknown }, name: string) {
  try { return container.get(name); }
  catch { return undefined; }
}
```

### 20.3 V1 上下文字段映射表

| V1 字段 (`ToolCallRequest.runtime`) | V2 字段 (`ToolContext`) | 映射方式 |
|------|------|------|
| `runtime.safetyPolicy` | `safetyPolicy` | 直接传递 |
| `runtime.fileCache` | `deltaCache` | V2 自带 DeltaCache 替代 |
| `runtime.sharedState._searchCache` | `searchCache` | V2 自带 SearchCache 替代 |
| `runtime.memoryCoordinator` | `sessionStore` | V2 sessionStore 做轻量记忆 |
| `runtime.aiProvider` | — | V2 handler 不直接调用 LLM |
| `runtime.logger` | — | V2 handler 用 `console` |
| `runtime.diagnostics` | — | 通过 ToolResultMeta 透传 |
| `runtime.submittedTitles` | — | knowledge handler 内部去重 |
| `runtime.sharedState` | — | V2 无需全局共享状态 |
| container → `projectGraph` | `projectGraph` | DI 注入 |
| container → `searchEngine` | `searchEngine` | DI 注入 |
| container → `recipeProductionGateway` | `recipeGateway` | DI 注入 |
| container → `knowledgeRepository` | `knowledgeRepo` | DI 注入 |

---

## 21. 实施路线图

### 21.1 Step 1: V2ToolRouterAdapter (预计 1 天)

**新建文件**:
- `lib/tools/v2/adapter/V2ToolRouterAdapter.ts`
- `lib/tools/v2/adapter/ToolContextFactory.ts`
- `lib/tools/v2/adapter/CapabilityV2Wrapper.ts`
- `lib/tools/v2/adapter/index.ts`

**修改文件**:
- 无 (纯新增)

**验收标准**:
```
✅ V2ToolRouterAdapter implements ToolRouterContract
✅ ToolContextFactory 能从 ServiceContainer 组装 ToolContext
✅ CapabilityV2Wrapper extends Capability 且返回 V2 工具名
✅ TypeScript 零错误
✅ 单元测试: adapter 正确转换 ToolCallRequest ↔ ToolCallV2
```

### 21.2 Step 2: AgentRuntime V2 支持 (预计 1-2 天)

**修改文件**:
- `lib/agent/runtime/AgentRuntime.ts` — 增加 V2 模式检测
- `lib/agent/runtime/ToolExecutionPipeline.ts` — AllowlistGate 识别 V2 工具名
- `lib/agent/service/AgentRuntimeBuilder.ts` — 注入 V2 Adapter
- `lib/agent/runtime/AgentRuntimeTypes.ts` — 新增 `v2Mode` 配置

**改动规模**: ~100 行修改，不删除任何现有代码

**验收标准**:
```
✅ AgentRuntimeBuilder.build() 可选启用 V2 模式
✅ AllowlistGate 正确放行 V2 工具名 (code/terminal/knowledge/graph/memory/meta)
✅ ToolExecutionPipeline 可路由到 V2 Adapter
✅ V1 模式完全不受影响 (零回归)
✅ 集成测试: V2 模式下 Agent 能完成完整 tool call 链路
```

### 21.3 Step 3: 首个场景验证 — BootstrapAnalyze (预计 2-3 天)

**目标**: 冷启动分析阶段使用 V2 工具完成全流程。

**修改文件**:
- `lib/agent/capabilities/CapabilityRegistry.ts` — 注册 V2 Capability
- `lib/agent/profiles/presets.ts` — 新增 `analyst-v2` preset
- `lib/workflows/capabilities/planning/dimensions/bootstrapDimensionConfigs.ts` — 可选 V2 模式

**验证指标**:
```
✅ 功能等价: V2 冷启动分析产出与 V1 一致
✅ Token 下降: tool schema 从 ~2K token 降至 ~600 token
✅ 终端输出可见: terminal.exec 返回压缩后的 stdout
✅ 搜索更快: code.search (ripgrep) < 500ms
```

### 21.4 Step 4: 全场景铺开 + 清理 (预计 1-2 周)

**场景扩展顺序**:
1. BootstrapAnalyze → BootstrapProduce (冷启动)
2. ScanAnalyze → ScanProduce (增量扫描)
3. Evolution (知识进化)
4. Conversation (对话)
5. System (系统交互)

**清理**:
- 标记 V1 工具为 `@deprecated`
- 移除 V1 Capability 类
- 移除旧 handler 文件
- 更新所有 preset 到 V2

### 21.5 风险缓解

| 风险 | 概率 | 缓解 |
|------|------|------|
| LLM 不适应 V2 schema 格式 | 中 | Bridge 自动回退到 V1 schema |
| V2 handler 遗漏某些场景 | 中 | CompositeRouter 自动降级到 V1 |
| token 反而增加 (V2 格式冗余) | 低 | A/B 对比监控, 可回滚 |
| 现有测试大面积失败 | 低 | V1/V2 并行运行，不删除 V1 代码 |

---

## 附录 B: ripgrep 集成详细设计

### B.1 为什么用 ripgrep

| 维度 | 内存 regex (现有) | ripgrep (V2) |
|------|:----------------:|:------------:|
| 5000 文件搜索延迟 | 2-5s | **50-200ms** |
| 大文件处理 | 全文加载到内存 | 流式扫描 |
| .gitignore 支持 | 手动过滤 | 原生尊重 |
| 二进制文件 | 需手动跳过 | 自动跳过 |
| Unicode | 依赖 Node regex | 原生支持 |
| 安装 | 无需 | 系统依赖 (Homebrew/cargo) |

### B.2 调用方式

```typescript
import { execFile } from 'node:child_process';

async function ripgrepSearch(opts: {
  patterns: string[];
  cwd: string;
  glob?: string;
  maxResults: number;
  contextLines: number;
}): Promise<RipgrepResult> {
  const args = [
    '--json',                          // 结构化 JSON 输出
    '--max-count', String(opts.maxResults),
    '--context', String(opts.contextLines),
    '--no-heading',
  ];
  if (opts.glob) args.push('--glob', opts.glob);

  for (const pattern of opts.patterns) {
    args.push('-e', pattern);
  }

  const { stdout } = await execFile('rg', args, {
    cwd: opts.cwd,
    maxBuffer: 1024 * 1024,  // 1MB
    timeout: 10000,
  });

  return parseRipgrepJsonOutput(stdout);
}
```

### B.3 降级策略

```
ripgrep 可用? → 使用 rg --json
  └─ 否 → Node.js 内存 regex (现有逻辑迁移)
```

通过 `which rg` 检测可用性，启动时缓存结果。

---

## 附录 C: knowledge.submit 校验规则

提交知识候选时的完整字段校验:

| 字段 | 必填 | 类型 | 约束 |
|------|:----:|------|------|
| `title` | Y | string | 3-200 字符, 不以项目名开头 |
| `description` | Y | string | 10-500 字符 |
| `content.markdown` | Y | string | ≥200 字符, 项目特写风格 |
| `content.rationale` | Y | string | ≥50 字符 |
| `content.pattern` | N | string | 代码骨架 (如有) |
| `kind` | Y | enum | `rule` / `pattern` / `fact` |
| `trigger` | Y | string | `@` 前缀, kebab-case, 3-60 字符 |
| `whenClause` | Y | string | 10-300 字符 |
| `doClause` | Y | string | 10-500 字符 |
| `dontClause` | N | string | 10-500 字符 |
| `tags` | N | string[] | 最多 10 个 |
| `reasoning.sources` | N | string[] | 文件路径列表 |
| `reasoning.confidence` | N | number | 0.0-1.0 |

校验失败时返回详细错误:

```json
{
  "ok": false,
  "data": null,
  "error": "Validation failed: title must be 3-200 characters (got 2); content.markdown must be ≥200 characters (got 150)"
}
```

---

## 附录 A: 现有代码审计发现的严重问题

以下问题在 V2 设计中被根本性解决:

| 编号 | 问题 | 严重度 | V2 解决方式 |
|------|------|--------|-----------|
| S4 | L3 折叠后 estimateTokens 不下降 | 高 | ContextWindow 使用投影消息 |
| S5 | compactL4 (LLM 摘要) 未接入 | 高 | 接入 AgentRuntime |
| S6 | 终端 stdout/stderr 对 LLM 不可见 | **致命** | terminal handler 直接返回压缩 stdout |
| S7 | knowledge_overview _meta 逻辑 bug | 中 | 工具移除, 功能由 knowledge.search 替代 |
| S8 | toolSchemas 快照不刷新 | 高 | 每轮迭代重新生成 schemas |
| A0 | ToolRouter 不 catch adapter rejection | 高 | V2 Router 统一 try/catch |
| A1 | 参数兼容性膨胀 (7 个同义参数) | 中 | 统一 schema, handler 只接受规范名 |
| A2 | InternalToolHandlerContext 过度透传 | 中 | V2 用 DI container 直接传递 |
| A3 | 搜索/读取缓存无 LRU | 低 | DeltaCache + LRU Map |
