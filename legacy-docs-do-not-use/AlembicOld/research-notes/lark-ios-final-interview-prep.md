# 飞书 iOS 终面 · Alembic 项目答辩素材

> 整理日期：2026-04
> 用途：基于 Alembic（一个 TypeScript/Node 的"AI 知识器官"项目）核心链路实现，提炼可在飞书 iOS 终面中讲清楚的工程深度问题与回答框架。
> 读法：每个问题块给出 **追问角度 → 回答骨架 → 可下钻的源码定位 → 可迁移到 iOS 的对照**。

---

## 〇、30 秒电梯陈述（开场必用）

> "Alembic 是我做的一个**本地化项目记忆引擎**：把项目源码里的代码模式、架构约定蒸馏成可检索、可演化的知识库，再通过 MCP 协议无缝接入 Cursor、Copilot、Trae 等 AI 编码工具，让 AI 生成的代码自动符合团队约定。
>
> 整体是 **TypeScript/Node + 自研 HNSW 向量检索 + 责任链 Gateway + 状态机驱动的知识生命周期**。虽然实现语言是 Node，但里面的核心设计——DI 容器、Repository、责任链、状态机、ANN 检索、Agent ReAct Loop——都是语言无关的工程模式，完全可以迁移到 Swift/iOS。"

---

## 一、项目定位与架构（必问）

**Q1. 介绍一下这个项目，它解决什么问题？**

回答骨架：
- **痛点**：通用 LLM 不知道项目内部约定（命名/分层/抽象习惯），生成的代码"能跑但不像团队风格"，CR 反复返工。
- **方案**：本地构建项目级知识库，按需注入 AI 上下文（不烧 LLM context window）。
- **形态**：一个本地常驻服务，对外暴露 MCP / HTTP / Lark WS 三种入口。
- **跨语言**：支持 11 种语言的 AST 解析（含 **Swift / Objective-C**）。

**Q2. 整体架构？**

```
Transports (CLI / MCP stdio / HTTP / Lark WS / VSCode Ext)
        ↓
Gateway (validate → guard → route → audit)   ← 责任链
        ↓
Agent Runtime (Capability + Strategy + Policy 三元组)
        ↓
Service (Knowledge / Search / Guard / Evolution / Bootstrap)
        ↓
Repository (Drizzle ORM)  +  Domain (KnowledgeEntry / Lifecycle)
        ↓
Infrastructure (better-sqlite3 WAL + 自研 HNSW + EventBus + PathGuard)
```

**iOS 对照**：这个分层和 iOS 上的 Clean Architecture（Presentation → Domain → Data）一致；Gateway 类似 URLProtocol/Combine 操作符链；DI 容器对标 Swinject/Factory。

---

## 二、检索链路：HNSW + RRF 混合检索（高权重）

**Q3. 你的检索是怎么实现的？为什么不直接 cosine？**

回答骨架：

1. **三模检索**：keyword / semantic / auto，auto 模式走完整管线。
2. **稀疏召回**：BM25 + 字段加权（title/trigger/content/code 不同权重）。
3. **稠密召回**：自研 **HNSW** 向量索引（Malkov-Yashunin 2018 论文）。
4. **融合用 RRF**（Reciprocal Rank Fusion）而非加权归一化：
   $$score = \alpha \cdot \frac{1}{k + rank_{dense}} + (1-\alpha) \cdot \frac{1}{k + rank_{sparse}}$$
   - $k=60, \alpha=0.5$
   - **优点**：不需要分数归一化、对 outlier 不敏感、ES/Weaviate/Qdrant 都用它
5. **多信号精排**：7 个信号加权（relevance / authority / recency / popularity / difficulty / contextMatch / vector），**按场景切换权重表**（lint / generate / search / learning）。

源码：[lib/service/search/HybridRetriever.ts](lib/service/search/HybridRetriever.ts)、[lib/service/search/MultiSignalRanker.ts](lib/service/search/MultiSignalRanker.ts)

**Q4. 为什么自实现 HNSW 而不用现成库（faiss / hnswlib-node）？**

- **零原生依赖**：纯 JS 实现，跨平台无编译问题（用户装 npm 包不能让他们装 Xcode CLT）
- **量级足够**：项目级知识库 < 10 万条，纯 JS 性能够用
- **可定制距离函数**：要在量化空间里算距离
- 参数：M=16, ef_construction=200, ef_search 可运行时调

源码：[lib/infrastructure/vector/HnswIndex.ts](lib/infrastructure/vector/HnswIndex.ts)

**Q5. 内存占用怎么控制？**

**SQ8 标量量化**：每维度 float32 → uint8（per-dim min/max 线性映射）
- 内存 -75%，召回率 >95%
- 距离计算在量化空间近似进行

源码：[lib/infrastructure/vector/ScalarQuantizer.ts](lib/infrastructure/vector/ScalarQuantizer.ts)

**iOS 对照**：iOS 端可以用 `Accelerate.framework` 的 vDSP 重写距离计算，性能更好；Apple 自己没有现成 ANN 库，HNSW 移植到 Swift 是真实需求（很多端侧检索场景）。

---

## 三、Agent 智能层：统一 Runtime + ReAct Loop（高权重）

**Q6. Agent 框架怎么设计的？为什么不分多个 Agent 子类？**

回答骨架：
- 业内常见做法是 ChatAgent / CodeAgent / WriterAgent 各种继承 → 类爆炸
- 我的设计是**唯一 AgentRuntime**，用 **Capability + Strategy + Policy 三元组**配置驱动（参考 CoALA 认知架构论文）
  - **Capability**：Conversation / CodeAnalysis / KnowledgeProduction / SystemInteraction
  - **Strategy**：Single / Pipeline / FanOut / Adaptive
  - **Policy**：Budget / QualityGate / Safety
- 例如"冷启动" = `FanOut(items=dimensions, itemStrategy=Pipeline(analyze→gate→produce))`
- 例如"对话" = `Single + Conversation + ReAct`

源码：[lib/agent/AgentRuntime.ts](lib/agent/AgentRuntime.ts)、[lib/agent/presets.ts](lib/agent/presets.ts)

**Q7. 上下文窗口爆炸怎么办？**

**三级递进压缩**（[lib/agent/context/ContextWindow.ts](lib/agent/context/ContextWindow.ts)）：
- L1 (60-80% token)：截断旧 tool results
- L2 (80-95%)：摘要历史轮次，**保留最后 2 轮完整链**
- L3 (>95%)：仅保留 prompt + 最后 1 轮 + 已提交列表

**关键不变量**：
- `messages[0]`（原始 prompt）不可删
- `assistant(toolCalls)` + 对应的 `tool` results 是**原子单元**，不能切开

**iOS 对照**：相当于 NSCache + 滚动缓冲区 + 自定义优先级淘汰。

**Q8. ReAct Loop 怎么防死循环 / 错误恢复？**

- `consecutiveAiErrors` 2-strike → context reset → forced summary
- 空响应重试 + rollback
- 熔断器（Embed 服务连续 3 次失败 → 60s 冷却）
- `MAX_TOOL_CALLS_PER_ITER = 8` 硬上限
- Tool 参数别名归一化（file/path/filename → filePath，覆盖 Gemini/GPT/Claude 命名差异）

源码：[lib/agent/tools/ToolRegistry.ts](lib/agent/tools/ToolRegistry.ts)

---

## 四、知识入库与去重（高权重）

**Q9. 怎么保证 AI 提交的知识不是垃圾？**

**多层防线**：
1. **会话内存去重**（[BootstrapDedup](lib/service/bootstrap/BootstrapDedup.ts)）：弥补 DB 写入延迟带来的盲区
   - 4 维加权相似度：`title(0.2) + clauses(0.3) + code(0.3) + guardPattern(0.2)`
   - 标题/clause 用 **Jaccard**（CamelCase / snake_case / 中文 2-gram 拆词）
   - coreCode 用 **n-gram(n=3) Jaccard**
   - 阈值 0.65（低于 Gateway 的 0.7，提前拦截）
2. **置信度路由**（[ConfidenceRouter](lib/service/knowledge/ConfidenceRouter.ts)）：
   - ≥0.85 自动通过；可信源 ≥0.70；<0.20 驳回
   - 高置信 → staging 24h Grace；标准 → staging 72h，到期自动转 active
3. **Constitution 权限校验**（YAML 声明式 + Zod runtime check）

**Q10. 为什么不用 embedding 做相似度，要用 Jaccard？**

- 成本/延迟：bootstrap 阶段每秒数十条，embedding 批量打分太贵
- DB 未提交：会话内的新条目还没写入向量索引，embedding 查不到
- 结构化字段（title / coreCode）Jaccard 已经足够鉴别

**Q11. 持久化策略？**

**file-first**：
1. 先写 Markdown 文件（真相源 / Source of Truth）
2. 再写 DB（索引）
3. fileWriter 设置 `entry.sourceFile`，repository 一次性持久化，避免回写

**为什么这么设计？**
- git diff 友好，知识演化可审阅
- 可回滚（删 DB 重建即可）
- DB schema 变更不影响内容

**iOS 对照**：类似 Notes.app 的 CKAsset + CKRecord 双层存储。

---

## 五、Guard：正向 + 反向双向免疫（独特亮点）

**Q12. 怎么保证生成的代码符合规则？**

**正向 Guard**（[GuardCheckEngine](lib/service/guard/GuardCheckEngine.ts)）4 层检测：
1. regex（最快）
2. code-level 多行匹配
3. tree-sitter AST（精准）
4. cross-file（架构层级）

支持 8 语言内置规则，3 态结果（pass / violation / uncertain），可配置 skipComments / skipTestBlocks / excludePrevLinePatterns。

**Q13. Recipe 本身会过期吗？怎么发现？**

**ReverseGuard**（[lib/service/guard/ReverseGuard.ts](lib/service/guard/ReverseGuard.ts)）—— **反向验证规则是否仍符合代码**：

5 类 drift 检测：
- `symbol_missing`：规则引用的类/方法已删
- `match_rate_drop`：规则在代码库中匹配率显著下降
- `api_deprecated`：API 已标记 deprecated
- `zero_match`：从未匹配过
- `source_ref_stale`：源文件已变

阈值：≥1 high → investigate；≥2 high → 触发 decay 状态转移。

**这是项目最有亮点的设计**：传统静态分析只做正向（代码符合规则吗？），Alembic 反过来问（规则还描述真实代码吗？）。

**iOS 对照**：相当于 SwiftLint 的规则配置自己也能"过期"，主动告诉你哪些规则该删。

---

## 六、知识生命周期：状态机 + 衰退检测

**Q14. 知识怎么"活"起来？**

**LifecycleStateMachine**（[lib/service/evolution/LifecycleStateMachine.ts](lib/service/evolution/LifecycleStateMachine.ts)）：

```
pending → staging → active → evolving / decaying → deprecated
```

7 步 transition：
`getState → Guard.isValidTransition → ExitAction → DB → EntryAction → TransitionEvent → SignalBus`

中间态超时：evolving 7d / decaying 30d / staging 7d / pending 30d。卡死告警阈值（半超时触发）。

**Q15. 怎么判断一条知识该衰退？**

**DecayDetector** 6 策略：
- `no_recent_usage`（>90d 未用）
- `high_false_positive`（误报率 >0.4 且触发数 >10）
- `symbol_drift`（来自 ReverseGuard）
- `source_ref_stale`
- `superseded`（被新知识取代）
- `contradiction`（与其他知识冲突）

衰退评分 = $0.3 \cdot freshness + 0.3 \cdot usage + 0.2 \cdot quality + 0.2 \cdot authority$

5 等级：healthy / watch / decaying / severe / dead

**iOS 对照**：相当于 Swift enum + associated values + `@Observable` + 一个跑在后台的 Timer，整个状态机模型在 iOS 上写起来更自然（值类型 + actor 隔离）。

---

## 七、Gateway 责任链与权限

**Q16. 请求是怎么走完整条链路的？**

[Gateway](lib/core/gateway/Gateway.ts) 4 步：

```
validate → guard → route → audit
```

- 全程带 `requestId + duration` 审计日志
- Routes 注册到 Map，`GatewayActionRegistry` 集中绑定
- 错误结构化：`{code, statusCode, message}`

**Q17. 权限模型？**

**PermissionManager** 3-tuple `(actor, action, resource)`：
- 通配符：`*`（管理员）/ `action:*` / `*:resource`
- 兼容两种命名：`read:recipes` ↔ `recipes:read`
- 角色定义在 [config/constitution.yaml](config/constitution.yaml)（external_agent / chat_agent / developer / admin）+ Zod 校验 + 热 reload

**iOS 对照**：声明式权限可以类比 App Capabilities .plist，或自实现一个类似 Casbin 的策略引擎。

---

## 八、依赖注入与启动

**Q18. 为什么自实现 DI 而不用 InversifyJS / tsyringe？**

回答骨架：
1. **AI Provider 热切换**：切换 Provider 时需要级联清空 N 个依赖该 Provider 的单例（用 `aiDependent: true` 标记），第三方 DI 难以表达
2. **多项目防护**：禁止同进程切换 projectRoot
3. **类型安全的 ServiceMap**：`container.get<K>(name): ServiceMap[K]` —— 编译期约束服务名↔类型
4. **轻量**：只有 ~200 行，不引入第三方依赖

源码：[lib/injection/ServiceContainer.ts](lib/injection/ServiceContainer.ts)

**iOS 对照**：ServiceMap 的类型映射技巧可以用 Swift `KeyPath` + `associatedtype` 实现：

```swift
protocol ServiceKey {
    associatedtype Value
}
final class Container {
    func resolve<K: ServiceKey>(_ key: K.Type) -> K.Value { ... }
}
```

**Q19. 启动流程？**

[lib/bootstrap.ts](lib/bootstrap.ts) 8 步：
1. loadDotEnv → 2. PathGuard → 3. WorkspaceResolver → 4. ConfigLoader → 5. Logger → 6. Database+migrations → 7. Constitution → 8. Gateway+核心组件

CLI 入口 [bin/cli.ts](bin/cli.ts) 用 commander 命令树 + `uncaughtException`/`unhandledRejection` 兜底 + `shutdown.install()` 优雅关闭。

---

## 九、数据库与并发

**Q20. 用什么数据库？怎么处理并发？**

- **better-sqlite3**（同步 API → 简化代码）
- **Drizzle ORM** 类型安全
- Pragma 关键设置：
  - `journal_mode = WAL`（多读单写）
  - `foreign_keys = ON`
  - `busy_timeout = 3000`（多进程并发写保护）
- 迁移：filesystem-based（8 个版本），事务包裹 + `schema_migrations` 表追踪
- 跨进程缓存一致：用 SQLite `PRAGMA data_version` 检测写入

源码：[lib/infrastructure/database/DatabaseConnection.ts](lib/infrastructure/database/DatabaseConnection.ts)

**iOS 对照**：直接对应 **GRDB**（同步 closure API、值类型 Codable Records、WAL 模式）。

**Q21. 怎么防止误污染用户项目？**

[lib/shared/isOwnDevRepo.ts](lib/shared/isOwnDevRepo.ts) + [PathGuard](lib/shared/PathGuard.ts)：
- `isAlembicDevRepo` 三条件 AND：`package.json name=alembic-ai` + `lib/bootstrap.ts` + `SOUL.md`
- 命中后：DB 重定向到 `$TMPDIR/alembic-dev/`，PathGuard 拦截 `.asd/` 写入
- 多路径缓存避免重复 IO

**iOS 对照**：类似 App Sandbox + Bookmark Data 的访问控制思路。

---

## 十、对外接口

**Q22. 为什么选 MCP 协议？**

- MCP（Model Context Protocol）是 Anthropic 推出的"AI 工具调用通用适配层"
- Cursor / Copilot / Trae / Claude Desktop 都原生支持 → 一次实现，多端可用
- stdio transport 简单可靠，无需端口管理
- Tool Schema 用 JSON Schema 自描述

实现：[lib/external/mcp/McpServer.ts](lib/external/mcp/McpServer.ts) + [tools.ts](lib/external/mcp/tools.ts)（14 agent tools + 2 admin）

**Q23. 飞书集成有什么特别的？**

[LarkTransport](lib/external/lark/LarkTransport.ts) + [IntentClassifier](lib/agent/IntentClassifier.ts)：

3 类意图分流：
- `BOT_AGENT` → 服务端 Runtime（知识管理）
- `IDE_AGENT` → **转发到 VSCode Copilot 执行**（手机发指令、电脑跑代码）
- `SYSTEM` → 本地（状态/截图/帮助）

**三层级联分类器**：规则匹配（0ms）→ embedding（50ms 可选）→ LLM（500ms）—— 越简单的意图越早 short-circuit，控制延迟和成本。

---

## 十一、工程化与品味

**Q24. 测试策略？**

- 单元：`npm run test:unit` → `test/unit/`（Vitest）
- 集成：`npm run test:integration` → `test/integration/`
- E2E：`test/e2e/`
- CI：GitHub Actions `build → lint → dashboard build → unit → integration`

**Q25. 你做了哪些"工程品味"的取舍？**

| 取舍 | 选择 | 理由 |
|---|---|---|
| Prettier + ESLint vs **Biome** | Biome 单工具 | 一个工具搞定 lint+format，速度 10x，配置极简 |
| CommonJS vs **ESM** | 纯 ESM + import 别名 | 现代 Node 22 一等公民，tree-shaking 友好 |
| 第三方 DI vs **自研容器** | 自研 ~200 行 | AI 热重载级联清除是定制需求 |
| Prisma vs **Drizzle** | Drizzle | 更轻、更接近 SQL、类型推断优秀 |
| 异步 sqlite vs **同步 better-sqlite3** | 同步 | 简化代码、Node 主线程 SQLite 操作 < 1ms |
| 多 Agent 子类 vs **统一 Runtime** | Capability + Strategy + Policy | 消除类爆炸 |
| 加权归一化 vs **RRF** | RRF | 不需要分数归一化、工业标准 |

---

## 十二、面试官追问预案（高难度）

### Q26. 这是 Node 项目，你来面 iOS，你的契合点是什么？

**关键回答模板**：

> "Alembic 的语言是 TypeScript，但我做的是**架构与底层算法**——HNSW 检索、状态机、责任链、DI 容器、AST 解析、ReAct Loop——**这些都是语言无关的工程模式**。换到 Swift/iOS，我会直接用 GRDB 替 better-sqlite3、用 actor 隔离 AgentRuntime、用 Combine 做 EventBus、用 SwiftTreeSitter 做 AST。
>
> 而且项目本身就支持 **Swift / Objective-C 的 AST 解析**，我对 iOS 的代码模式（MVC / MVVM / TCA / SwiftUI Lifecycle）做了内置规则，不算门外汉。"

### Q27. 用 Swift 重写你会怎么做？

| 模块 | Node 实现 | Swift/iOS 对应 |
|---|---|---|
| DB | better-sqlite3 + Drizzle | **GRDB**（同步、值类型 Records） |
| 向量 | 纯 JS HNSW | Swift Generics + `UnsafeMutableBufferPointer`，距离计算用 **Accelerate vDSP** |
| Agent | TypeScript class + async/await | **actor** 隔离 ContextWindow，AsyncSequence 串 ReAct loop |
| EventBus | 自实现 emitter | Combine `PassthroughSubject` / **AsyncStream** |
| 状态机 | TS class + 字符串状态 | Swift enum + associated values + `@Observable` |
| IPC | MCP stdio | **XPC** 或 URL Scheme（Xcode 插件） |
| 配置 | Constitution YAML + Zod | Swift `Codable` + `@propertyWrapper` 校验 |
| 责任链 | TS function chain | Combine 操作符链 / async middleware |
| 蹈火服务 | EventBus + p-limit | TaskGroup + 自定义信号量 |

### Q28. 印象最深的工程取舍？

**4 个王牌答案**（按场景挑 1-2 个）：

1. **file-first 持久化** —— DB 是索引，Markdown 是真相
   - 知识演化能 git diff、能 CR、能回滚
   - DB schema 变更不影响内容

2. **正向 + 反向 Guard 双向免疫** —— 规则会主动告诉你它过期了
   - 传统静态分析只做正向
   - ReverseGuard 5 类 drift 检测让规则不会变成"代码考古"

3. **统一 AgentRuntime + 三元组配置** —— 消除 N 个 Agent 子类
   - Capability + Strategy + Policy 组合表达任意场景
   - "冷启动 = FanOut(Pipeline)"、"对话 = Single(Conversation)"

4. **RRF 混合检索** —— 避开分数归一化的工程难题
   - 稠密/稀疏分数尺度完全不同，归一化很容易翻车
   - RRF 只看排名，工业级方案（ES/Weaviate/Qdrant 默认）

### Q29. 项目有什么坑或者后悔的设计？

诚实但有亮点（**关键：不要说"完美"**）：

1. **早期把 Agent 做成多个子类**，Capability 抽象是后来重构的，重构期间出过几次回归 → **教训**：抽象要等模式重复 3 次再提
2. **MCP stdio 调试很痛**：没法 attach debugger，只能日志打印 → 自己做了一个 stdio sniffer 脚本
3. **better-sqlite3 同步 API 在 LSP/MCP 长连接下偶尔阻塞** → 用 `setImmediate` 拆批 + `busy_timeout` 缓解
4. **HNSW 删除是软删除**，长期会膨胀 → 留了一个 `compact()` 接口但还没自动化触发

### Q30. iOS 端可学到什么经验？

- **本地知识库 + 端侧检索**是 iOS App 现实场景：Notes.app 智能搜索、Spotlight、Mail 智能回复
- 自研 ANN（HNSW + SQ8）的思路在端侧很实用 —— Apple 没现成 ANN 库
- Agent ReAct Loop 在 Apple Intelligence / Siri 工具调用场景直接适用
- Constitution YAML + Zod 的"声明式约束"思想可以做 App 内的 feature flag / A/B 引擎

---

## 十三、源码速查表（被追问时直接展开）

| 追问方向 | 切入文件 |
|---|---|
| 向量检索怎么做？ | [HnswIndex](lib/infrastructure/vector/HnswIndex.ts) · [HybridRetriever](lib/service/search/HybridRetriever.ts) · [ScalarQuantizer](lib/infrastructure/vector/ScalarQuantizer.ts) |
| 排序为什么不用 cosine？ | [MultiSignalRanker](lib/service/search/MultiSignalRanker.ts) |
| 怎么防垃圾知识？ | [ConfidenceRouter](lib/service/knowledge/ConfidenceRouter.ts) · [BootstrapDedup](lib/service/bootstrap/BootstrapDedup.ts) |
| 权限设计？ | [Gateway](lib/core/gateway/Gateway.ts) · [PermissionManager](lib/core/permission/PermissionManager.ts) · [config/constitution.yaml](config/constitution.yaml) |
| 上下文爆炸？ | [ContextWindow](lib/agent/context/ContextWindow.ts) |
| 知识怎么活？ | [LifecycleStateMachine](lib/service/evolution/LifecycleStateMachine.ts) · [DecayDetector](lib/service/evolution/DecayDetector.ts) · [ReverseGuard](lib/service/guard/ReverseGuard.ts) |
| DI 热重载？ | [ServiceContainer](lib/injection/ServiceContainer.ts) · [AiProviderManager](lib/external/ai/AiProviderManager.ts) |
| 不污染用户项目？ | [PathGuard](lib/shared/PathGuard.ts) · [isOwnDevRepo](lib/shared/isOwnDevRepo.ts) |
| MCP 对接 IDE？ | [McpServer](lib/external/mcp/McpServer.ts) · [tools.ts](lib/external/mcp/tools.ts) |
| 飞书消息路由？ | [LarkTransport](lib/external/lark/LarkTransport.ts) · [IntentClassifier](lib/agent/IntentClassifier.ts) |
| 多进程并发安全？ | [DatabaseConnection](lib/infrastructure/database/DatabaseConnection.ts)（WAL + busy_timeout） |
| Agent 统一架构？ | [AgentRuntime](lib/agent/AgentRuntime.ts) · [presets](lib/agent/presets.ts) · [policies](lib/agent/policies.ts) |

---

## 十四、临场技巧

1. **永远先讲架构再讲代码**：面试官关心你的"系统观"
2. **每个回答带一个数字**（"<10 万条"、"-75% 内存"、"7 步 transition"、"3 层级联"）
3. **诚实承认坑**（Q29），但每个坑后面跟一个改进措施
4. **主动牵到 iOS**：每讲一个模块，主动说"在 iOS 上等价是 X"
5. **不要说"很简单"**：所有看起来简单的设计都是权衡的结果，讲权衡
6. **白板代码题**：HNSW 插入主流程 / RRF 公式 / 状态机 transition / DI 容器骨架，**这 4 个一定要能在白板写出来**

---

## 附：必背公式

**RRF**：
$$score(d) = \sum_{r \in R} \frac{1}{k + rank_r(d)}, \quad k=60$$

**衰退评分**：
$$decay = 0.3 f_{fresh} + 0.3 f_{usage} + 0.2 f_{quality} + 0.2 f_{authority}$$

**HNSW 复杂度**：
- 插入 / 查询：$O(\log N)$
- 内存：$O(N \cdot M)$，M=邻居数 (16 默认)

**SQ8 量化**：
$$q_i = \mathrm{round}\left(\frac{x_i - \min_i}{\max_i - \min_i} \cdot 255\right)$$

**Jaccard**：
$$J(A, B) = \frac{|A \cap B|}{|A \cup B|}$$

---

> **最后一句话兜底**：
> "我做 Alembic 不是为了写 Node，是为了把'AI 写代码'这件事做得不像玩具。里面所有的设计——状态机、责任链、向量检索、Agent Loop——换成 Swift 也能落地，而且我对 iOS 的工程模式（MVC/MVVM/SwiftUI/Combine/actor）很熟，迁移成本不是阻碍。"
