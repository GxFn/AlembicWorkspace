# Alembic MCP 层完整梳理:描述 · 使用 · 实现逻辑(2026-07-10)

目的:把宿主(codex/cc)看到的 MCP 工具面、模型如何被引导使用、以及请求进来后的真实实现链路梳理成一份可核对的地图。事故驱动(2026-07-10 ReDoS 钉死事件)——同时标注事故暴露的薄弱点与已修状态。证据以 AlembicPlugin `lib/`(TS 源码权威)为准,检索引擎实现在 `../AlembicCore`。

## 0. 一句话架构

宿主 Agent(codex)通过 stdio JSON-RPC 调 `bin/host-mcp.ts` → `HostMcpServer` → 工具分发 → 大部分工具落 `EmbeddedToolExecutor`(插件自有 MCP server)或直连 Core 检索引擎。**MCP 层是"适配+编排+预算+观测",确定性内核在 Core,非确定性挖掘在 Agent。**

## 1. 工具面(宿主可见的 MCP 工具)

工具声明在 `lib/host-runtime/mcp/tools.ts`,inputSchema 由 `zodToMcpSchema(<ZodType>)` 从 `lib/shared/schemas/mcp-tools.ts` 的 Zod 契约自动生成。主要工具与语义:

| 工具 | 语义 | 输出形状 | 关键预算 |
|---|---|---|---|
| `alembic_plan` | 冷启动/深挖/模块挖掘的两段式规划(draft→confirm) | 无状态 planSelection;draft 的 nextActions 直接带 confirm 指令 | projectInfoTree 超字节走 transient ref |
| `alembic_bootstrap` | 冷启动全量扫描+首轮挖掘 | 会话+briefing | 重档(真机 2-5min) |
| `alembic_rescan` | 增量重扫+缺口计划 | rescan-briefing;20KB 内联预算超则 transient | 重档 |
| `alembic_submit_knowledge` | 提交挖掘产出进知识库 | created/duplicates/rejected/blocked | 提交时新鲜度门(见 §4) |
| `alembic_search` | 混合检索(向量+BM25)知识 | items≤500,可见 summary≤2000;contentPreview slice 2400 | limit≤100 default 10 |
| `alembic_prime` | 语义预热:按查询取相关知识+region 证据 | 知识材料+retrieval checkpoint posture | 双路检索(统一+region) |
| `alembic_recipe_map` | Recipe 挂载索引(非全文) | RecipeMountSummary(title≤400/summary≤600),**明示 no full Recipe body** | 20KB 内联预算超则 fullMapRef |
| `alembic_graph` | 纯 ProjectContext 结构图查询(无 Recipe) | nodes/relations/refs/slices | contentCharLimit 120-20000 default 1200 |
| `alembic_code_guard` | 确定性规则检查 | violations | — |
| `alembic_status` | 运行时+会话用量视图 | 诊断+usage | — |

**描述工程的两条实测教训(事故补课)**:
- 数值边界要写进 description 文本,不能只靠 JSON Schema 的 `maximum`——真机观察到模型传 `contentCharLimit>20000` 吃 VALIDATION_ERROR 后直接放弃 graph 而非纠正(已修 6d34806:边界写进描述)。
- 两段式工具(plan draft→confirm)必须在 draft 响应里带 `nextActions` 明示下一步,否则宿主不知道要再调一次。

## 2. 使用引导(模型怎么知道该调什么)

三层引导:
1. **工具 description**(tools.ts):每个工具的"何时用/非目标"。如 graph 明写 "Use before changing code when the user asks for imports/dependencies/impact…;Non-goal: no Recipe ids…"。
2. **initialize instructions**(`buildMcpInitializeInstructions`):server 启动时给宿主的总纲,列可见工具。
3. **响应内 nextActions**:结果里嵌入建议的下一步工具调用(plan confirm、rescan 后 submit 等)——把多步流程"拉"着宿主走。

**事故暴露**:引导只在"模型愿意读且读得懂 schema"时有效;弱 schema 阅读能力的模型需要 description 里的冗余文字兜底。

## 3. 请求进来后的实现链路

```
codex stdio → bin/host-mcp.ts → HostMcpServer.start()
  → registerHandlers(): server.setRequestHandler(CallToolRequestSchema)
    → [MCP] <name> start 日志(事故补:统一观测)
    → #withToolCallDeadline(name, handleToolCall(...))   ← 每调用软超时(async 挂死兜底)
      → handleToolCall: preflight(ToolPolicy) → init-on-demand? → staging sweep?
        → callPluginOwnedTool → EmbeddedToolExecutor.execute
          → McpServer._executeMcpHandler → wrapHandler(Zod 校验) → HANDLER_MAP[name]
            → 具体 handler(search/prime/graph/plan/...)
              → Core SearchEngine / VectorService / ProjectContext / RecipeMapProvider
    → [MCP] <name> done{durationMs,ok} 日志
```

**并发模型**:SDK 对每个 JSON-RPC 请求 `Promise.resolve().then(handler)` 独立起链,**不 await 前一个**——即事件循环层面并发交错。但凡链路里有同步段(better-sqlite3 同步查询、execFileSync git、向量库 initSync、正则回溯),就占住事件循环让所有请求短暂串行。**这正是 ReDoS 能钉死"全部"工具的机制:一个工具的同步回溯 = 整个 server 停摆。**

**两类挂死与两道防线(事故根修)**:
- **async 挂死**(无超时的 await/外部 IO):`#withToolCallDeadline` 软超时 → TOOL_TIMEOUT(轻档 120s/重档 600s)。
- **同步钉死**(正则回溯/无界 sync IO):软超时救不了(计时器不触发)→ `EventLoopWatchdog` worker 线程旁路,SharedArrayBuffer 心跳,停摆 ≥30s 报警、≥180s exit(99) 让宿主重生。

## 4. 提交侧新鲜度门(现状,G-C 的起点)

`alembic_submit_knowledge`(Agent 侧 knowledge.ts)在入库前:
- `expandEvidenceRefsForSubmit`:按候选 reasoning.sources 从真实文件重切区间、重哈希,与台账登记的哈希比对 → 不一致即 `EVIDENCE_STALE` 拒收。
- 多层确定性修复(evidence sanitized/coreCode backfill/snippet normalize/...),命中计数经 sessionCounterBox 投影(本会话已修假零)。

**关键局限(G-C 缺口本体)**:这个新鲜度检查是**提交时一次性**的——入库那一刻证据成立即放行。此后代码演进,已入库知识的 sourceRefs 指向的区间内容变了/行号漂移了/文件删了,**没有任何机制发现它过期**。检索时(search/prime)纯向量+BM25 命中就返回,不校验 sourceRefs 是否仍成立。这是"生成后维护"的结构性空洞,详见配套设计文档。

## 5. 事故暴露的薄弱点清单(已修/待办)

| 问题 | 状态 |
|---|---|
| fileFlow 正则 ReDoS(无行长护栏) | ✅ Core 581be5e(三层防线) |
| 扫描枚举未排除 .build/Pods/DerivedData | ✅ Core 581be5e |
| MCP 无 per-call 超时 | ✅ Plugin 6d34806(软超时) |
| 无事件循环看门狗(同步钉死不可见) | ✅ Plugin 6d34806(worker 旁路) |
| 无统一调用出入/耗时日志 | ✅ Plugin 6d34806([MCP] start/done) |
| readCurrentGitHead execFileSync 无超时 | ✅ Plugin 6d34806(5s) |
| graph budget 上限未写进描述 | ✅ Plugin 6d34806 |
| rescan 缺口计划被终局 advisory 静默丢弃 | ✅ Plugin 6d34806(升 warn;重开靠 force) |
| 知识入库后无源头漂移失效(G-C) | 📋 独立设计(配套文档) |
| BiliDili KB 仅 16 条全 architecture(供给侧) | 📋 需补挖(与 G-C 的失效重挖同源) |

## 6. 与 G-C 设计的接口

G-C"知识失效传播"复用本层已有物件:知识条目的 file:line sourceRefs(§4)、提交侧的重切重哈希机制(§4,现成的失效判定内核)、现在已可靠的 readCurrentGitHead(§3)、以及检索链路(§3,失效标记的展示面)。设计详见 `alembic-knowledge-lifecycle-postgen-design-2026-07-10.md`。
