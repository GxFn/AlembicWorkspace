# BiliDili 增量扫描链路复盘

> 复盘对象：`/Users/gaoxuefeng/Documents/github/BiliDili` 的一次增量扫描日志。
>
> 运行窗口：2026-05-03 22:05:28 - 22:20:30（Asia/Shanghai）。
>
> 证据来源：运行日志 + Ghost Mode 外置工作区报告 `/Users/gaoxuefeng/.asd/workspaces/c8d24663/.asd/bootstrap-report.json`。

---

## 结论摘要

这次扫描走的是 `Insight-v7` 的统一 `AgentRuntime` 管线，而不是旧的 Analyst/Producer wrapper。扫描以 rescan mode 启动，只激活了两个维度：`design-patterns` 和 `error-resilience`。系统先加载历史语义记忆和代码实体图，再按维度执行 `analyze -> produce` 的知识生产链路，最终创建 10 个候选知识项，保存 workflow report 和文件快照。

从业务结果看，本次扫描没有失败：两个维度都完成，`degraded=false`，最终 `Candidates: 10 created, 0 errors`。但从链路健康看，有几个明显问题：

- BiliDili 使用 Ghost Mode，项目内没有 `.asd` 是正常现象；真实运行产物在 `~/.asd/workspaces/c8d24663/`。
- `design-patterns` 首次分析因为文件级证据不足被质量门重试，重试后通过；`error-resilience` 也提示证据不足，但仍被放行。
- 上下文压缩在高压状态下多次触发 `Messages with role 'tool' must be a response to a preceding message with 'tool_calls'`，说明压缩后的消息历史存在工具消息孤儿化风险。
- `SUMMARIZE` 阶段之后仍被注入 planning nudge，阶段指令互相打架，消耗了 token，也可能诱导 Agent 继续探索。
- 运行报告里出现多个统计口径不一致：终局有 95 files、155 tool calls，但 cache stats 仍显示 `0 searches, 0 files`；produce 阶段也多次显示 files/patterns 为 0。
- 外置 `bootstrap-report.json` 里 `totals.toolCalls=155`，但同一报告的 `toolUsage.total=0`，说明报告内还有一组更明确的统计字段未被填充。
- 因为是 rescan mode，最后明确 `skipping delivery/wiki/memory`，所以本次结果主要停留在 report、snapshot 和候选层，没有走 IDE 交付、wiki 或长期记忆同步。

---

## 零、Ghost Mode 产物位置

这次一开始在 BiliDili 项目根目录下没有找到 `.asd/bootstrap-report.json`，原因是 BiliDili 使用了 Ghost Mode。全局注册表记录如下：

```json
{
  "/Users/gaoxuefeng/Documents/github/BiliDili": {
    "id": "c8d24663",
    "ghost": true,
    "createdAt": "2026-04-20T01:29:22.996Z"
  }
}
```

因此，本次扫描的真实运行时目录是：

```text
/Users/gaoxuefeng/.asd/workspaces/c8d24663/
```

关键产物：

| 类型 | 路径 |
| --- | --- |
| 最新 workflow report | `/Users/gaoxuefeng/.asd/workspaces/c8d24663/.asd/bootstrap-report.json` |
| 历史 workflow report | `/Users/gaoxuefeng/.asd/workspaces/c8d24663/.asd/bootstrap-reports/bs_1777817128293_nis4fj.json` |
| 外置运行库 | `/Users/gaoxuefeng/.asd/workspaces/c8d24663/.asd/alembic.db` |
| 外置知识库 | `/Users/gaoxuefeng/.asd/workspaces/c8d24663/Alembic/` |
| 外置 recipes | `/Users/gaoxuefeng/.asd/workspaces/c8d24663/Alembic/recipes/` |

所以，“项目内没有 `.asd`”不是保存失败，而是 Ghost Mode 的预期行为。需要注意的是，用户如果只在 BiliDili 仓库目录内找产物，会误判为扫描没有写报告。

---

## 一、启动阶段发生了什么

### 1. 使用统一 AgentRuntime 管线

日志开头：

```text
[Insight-v7] Using unified AgentRuntime pipeline (no legacy Analyst/Producer wrappers)
```

这说明本次增量扫描使用的是新统一运行时：分析、反思、工具调用、上下文压缩、质量门、生产候选都由同一套 `AgentRuntime` 机制承载。旧的 Analyst/Producer wrapper 没有介入。

### 2. 恢复历史上下文和代码图谱

启动后加载了两类基础上下文：

```text
Loaded 7 semantic memories from previous bootstrap (fact: 5, insight: 2, preference: 0)
CodeEntityGraph: 818 entities, 2270 edges
```

含义是：

- 系统带入了之前 bootstrap 的 7 条语义记忆，其中事实 5 条、洞察 2 条、偏好 0 条。
- BiliDili 项目被解析成 818 个代码实体和 2270 条实体关系边。
- 后续维度分析不是纯文本扫描，而是在已有代码实体图和记忆基础上进行增量补全。

### 3. 进入 rescan mode 并预热去重集合

```text
Active dimensions: [design-patterns, error-resilience], concurrency=3, terminalToolset=baseline
Rescan mode: seeded 33 titles + 35 triggers into dedup set
```

本次只处理两个维度：

- `design-patterns`：设计模式
- `error-resilience`：错误与健壮性

同时，rescan mode 预先把 33 个标题和 35 个触发词放入去重集合。这一步的目的不是发现新代码，而是避免本轮重复生产已有知识。

这里已经埋下一个后续现象：produce 阶段确实多次出现 duplicate trigger / duplicate blocked，说明去重集合生效了，但 Producer 仍然会尝试生成重复候选。

### 4. report 中确认的项目快照

Ghost Mode 下的 `bootstrap-report.json` 进一步确认了项目和图谱信息：

```json
{
  "project": {
    "name": "BiliDili",
    "files": 127,
    "lang": "swift"
  },
  "codeEntityGraph": {
    "totalEntities": 818,
    "totalEdges": 2270
  }
}
```

代码实体图细分为：

| 实体类型 | 数量 |
| --- | ---: |
| category | 46 |
| class | 234 |
| method | 488 |
| module | 20 |
| pattern | 9 |
| protocol | 21 |

边关系里最多的是 `data_flow=1087`、`calls=547`、`conforms=312`，这说明本次扫描依赖的不是单纯文件枚举，而是已经构建过跨文件实体和关系网络。

---

## 二、总体执行结果

本次扫描最终完成：

```text
Session bs_1777817128293_nis4fj finished: 2 completed, 0 failed (902.3s)
All tiers complete: 2 dimensions in 902254ms
Candidates: 10 created, 0 errors
Skills: 0 created, 0 failed
Tool calls: 155
Tokens: input=1282828, output=58356
Workflow report saved to .asd/bootstrap-report.json
Snapshot saved: snap_713a59381977
```

Ghost Mode 报告中的同一组 totals 与日志一致：

```json
{
  "totals": {
    "candidates": 10,
    "skills": 0,
    "toolCalls": 155,
    "tokenUsage": {
      "input": 1282828,
      "output": 58356
    },
    "errors": 0
  }
}
```

结果可拆成三层：

| 层级 | 结果 | 说明 |
| --- | --- | --- |
| 维度层 | 2 completed, 0 failed | 两个维度都跑完，没有标记失败 |
| 候选层 | 10 created, 0 errors | Producer 总共接受 10 个候选 |
| report 层 | saved | 写入 Ghost workspace 的 `.asd/bootstrap-report.json` |
| recipe 层 | 7 个相关 recipe 可见 | 外置 recipes 中当前可见 4 个 design-patterns + 3 个 error-resilience |
| 交付层 | skipped | rescan mode 下跳过 delivery/wiki/memory |

因此，本次不是“扫描失败”，而是“扫描完成但存在质量门、压缩和交付隔离方面的问题”。

---

## 三、`design-patterns` 维度链路

### 1. 首轮 analyze：探索完成，但质量不足

`design-patterns` 从 22:05:28 开始，先进入规划，再经历 `SCAN -> EXPLORE -> VERIFY -> SUMMARIZE`：

```text
Stage "analyze" — budget: 24 iters, timeout: 480s, tracker: ExplorationTracker
SCAN → EXPLORE
EXPLORE → VERIFY
VERIFY → SUMMARIZE
final answer — 10466 chars, 10 iters, 23 tool calls
```

探索器要求 Agent 先规划，再按设计模式关键字扫描：

- 单例模式：`shared`、`default`、`standard`、`instance`、`static let`
- 工厂模式：`Factory`、`create`、`make`、`build`
- 委托/代理模式：`delegate`、`dataSource`、`protocol` + `weak`
- 观察者模式：`Notification`、`publisher`、`subscribe`
- 仓储/存储模式：`Repository`、`Store`、`DAO`、`Cache`
- 基类继承与多态：`BaseViewController`、`Sendable`

首轮分析产出后被 QualityGate 判为需要重试：

```text
QualityGate dim="design-patterns" action=retry total=53 depth=60 breadth=37.39 evidence=40 coherence=80 suggestions=[Findings lack file-level evidence]
```

这里的关键不是分析没有内容，而是“证据不足”。也就是说，分析可能覆盖了一些模式名称，但缺少足够的文件路径、类名、方法名或代码行为证据，不能作为可靠知识进入候选生产。

### 2. retry analyze：补足证据后通过

重试阶段重新执行 analyze：

```text
Retry stage "analyze" — preserving ContextWindow (0 tokens)
Stage "analyze" (retry) — budget: 24 iters, timeout: 480s
final answer — 9140 chars, 19 iters, 47 tool calls
QualityGate dim="design-patterns" action=pass total=91 depth=100 breadth=89.79 evidence=80 coherence=94
```

第二次质量明显提升：

- `total`: 53 -> 91
- `depth`: 60 -> 100
- `breadth`: 37.39 -> 89.79
- `evidence`: 40 -> 80
- `coherence`: 80 -> 94

这说明重试策略对 `design-patterns` 是有效的：它把第一次“有发现但证据薄”的分析，修正成“有足够文件级证据”的分析报告。

### 3. produce：候选生产、重复拦截和最终沉淀

通过 analyze 后进入 produce：

```text
Stage "produce" — budget: 24 iters, timeout: 360s
duplicate trigger: "@design-module-dispatcher"
duplicate blocked: "ModuleDispatcher: 同步事件总线替代 NotificationCenter"
duplicate trigger: "@pattern-param-encoding"
duplicate blocked: "ParameterEncoding 请求编码策略"
Producer "design-patterns": submitted=8, accepted=4, rejected=4
SessionStore Stored report for "design-patterns": 2 findings, 41 files
Dimension "design-patterns": analysis=9090 chars, files=41, findings=2, toolCalls=91, degraded=false
```

Ghost Mode 报告中的维度统计为：

```json
{
  "candidatesSubmitted": 4,
  "candidatesRejected": 4,
  "analysisChars": 9090,
  "referencedFiles": 41,
  "durationMs": 518898,
  "toolCallCount": 91,
  "qualityGate": {
    "totalScore": 91,
    "action": "pass"
  }
}
```

本阶段发生了三件事：

1. Producer 根据分析报告生成结构化候选。
2. 去重管线拦截了已存在或重复的主题，例如 `ModuleDispatcher` 和 `ParameterEncoding`。
3. 最终 8 个提交里接受 4 个，拒绝 4 个。

需要注意：accepted candidates 是 4，但 SessionStore 里 `findings=2`。这说明“候选知识项”和“报告 findings”不是同一个统计口径。最终 reflection 里也显示：

```text
Tier 1 reflection: 2 top findings, 1 patterns
```

所以 `design-patterns` 有产出，但实际进入 top finding 的只有 2 条。

### 4. 外置 recipes 中可见的设计模式产物

在 Ghost workspace 的外置知识库中，`design-patterns` 当前可见 4 个 recipe，正好对应报告里的 `candidatesSubmitted=4`：

| recipe | trigger | 主题 |
| --- | --- | --- |
| `pattern-basevc-template-method.md` | `@pattern-basevc-template-method` | `BaseViewController` 通过 `setupUI()` / `bindViewModel()` 钩子实现模板方法 |
| `pattern-middleware-chain-pipeline.md` | `@pattern-middleware-chain-pipeline` | 网络层 Middleware Chain，`adapt` / `didReceive` / `recover` 三阶段拦截 |
| `pattern-mvvm-input-output.md` | `@pattern-mvvm-input-output` | RxSwift 驱动的 MVVM 输入输出变换 |
| `pattern-repository-data-layer.md` | `@pattern-repository-data-layer` | 协议 + struct 的 Repository 数据抽象层 |

其中示例证据包括：

- `BaseViewController` recipe 指向 `Packages/AOXUIKit/Sources/AOXUIKit/Base/BaseViewController.swift` 和 `Sources/Features/VideoFeed/VideoFeedViewController.swift`。
- Middleware Chain recipe 指向 `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Middleware/Middleware.swift`、`Sources/Infrastructure/Networking/Middleware/BiliMiddlewareChain.swift` 等。

这能进一步确认：`design-patterns` 不只是生成了报告，它确实在外置知识库中沉淀了可消费的 recipe。

---

## 四、`error-resilience` 维度链路

### 1. analyze：一次通过，但证据分仍偏低

`error-resilience` 从 22:14:07 开始：

```text
Task "error-resilience" filling started
Stage "analyze" — budget: 24 iters, timeout: 480s
SCAN → EXPLORE
EXPLORE → VERIFY
VERIFY → SUMMARIZE
final answer — 12598 chars, 16 iters, 40 tool calls
```

探索计划聚焦：

- 错误类型定义：Error 枚举、错误码、自定义错误类型
- 错误处理关键模式：`try/catch`、`Result`、`throws`、`guard/if-let`、重试、降级
- 典型错误传播链路：网络请求 -> 解析 -> 展示
- WebSocket 重连、HomeViewModel 降级链、ViewModel 层错误处理

质量门结果：

```text
QualityGate dim="error-resilience" action=pass total=68 depth=100 breadth=52 evidence=40 coherence=80 suggestions=[Findings lack file-level evidence]
```

这个结果比较微妙：它和 `design-patterns` 首轮一样提示 `Findings lack file-level evidence`，证据分也是 40，但 action 是 `pass`，没有触发 retry。

从日志看，`error-resilience` 的分析深度达到 100，但广度 52、证据 40，说明它可能深入读了关键文件，但文件级证据覆盖不足，或者最终 findings 的证据没有被结构化提取出来。

### 2. produce：接受 6 个候选，但报告 findings 为 0

produce 阶段：

```text
Producer "error-resilience": submitted=9, accepted=6, rejected=3
SessionStore Stored report for "error-resilience": 0 findings, 65 files
Dimension "error-resilience": analysis=12553 chars, files=65, findings=0, toolCalls=64, degraded=false
```

Ghost Mode 报告中的维度统计为：

```json
{
  "candidatesSubmitted": 6,
  "candidatesRejected": 3,
  "analysisChars": 12553,
  "referencedFiles": 65,
  "durationMs": 383348,
  "toolCallCount": 64,
  "qualityGate": {
    "totalScore": 68,
    "action": "pass"
  }
}
```

这里最值得注意的是：Producer 接受了 6 个候选，但 SessionStore 的 findings 是 0。随后 tier reflection 也没有沉淀 top finding：

```text
Tier 2 reflection: 0 top findings, 0 patterns
```

这说明 `error-resilience` 的知识候选和维度报告之间出现了“产出不空，但 finding 为空”的断层。可能原因包括：

- Producer 生成的是 candidates，但没有映射成 report findings。
- QualityGate 放行了 evidence=40 的报告，导致后续 finding 抽取置信不足。
- `error-resilience` 维度的 finding schema 或提取规则与候选 schema 不一致。
- rescan mode 的隔离策略只保留候选，不做进一步交付或长期记忆同步。

### 3. 外置 recipes 中可见的错误韧性产物

在 Ghost workspace 的外置知识库中，`error-resilience` 当前可见 3 个 recipe：

| recipe | trigger | 主题 |
| --- | --- | --- |
| `err-circuit-breaker-dedup.md` | `@err-circuit-breaker-dedup` | `CircuitBreaker` 三状态熔断 + `RequestDeduplicator` 并发去重 |
| `err-network-error-dual-retry.md` | `@err-network-error-dual-retry` | `NetworkError` 统一错误枚举 + Session / Pipeline 两层重试 |
| `err-user-facing-degradation.md` | `@err-user-facing-degradation` | `UserFacingError` 用户友好错误 + `HomeViewModel` 三级降级链 |

其中 `err-network-error-dual-retry.md` 指向：

- `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Core/NetworkError.swift`
- `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Client/NetworkClient.swift`
- `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Session/RetryPolicy.swift`

`err-user-facing-degradation.md` 指向：

- `Packages/AOXFoundationKit/Sources/AOXFoundationKit/Protocols/UserFacingError.swift`
- `Sources/Infrastructure/Networking/Client/NetworkError+Bili.swift`
- `Sources/Features/Home/HomeViewModel.swift`

这里出现了一个新的计数差异：报告中 `error-resilience.candidatesSubmitted=6`，但当前目录下只看到 3 个 `error-resilience` recipe。结合日志里的 `Store report: findings=0`，可以判断这条链路至少存在三种不同对象：Producer accepted candidates、SessionStore findings、最终外置 recipes。它们之间不是一一对应关系，终局报告应该把这三个数量分别打印清楚。

---

## 五、上下文预算与压缩链路

### 1. 设计模式重试阶段出现严重预算压力

`design-patterns` retry analyze 在 22:07:37 后开始频繁压缩：

```text
session 预检: 247720 used + ~31484 est = 279204/345600 (80.8%) → 压缩
L1 compact: truncated 11 tool results
session budget pressure → extra compact L1
```

之后预算继续升高：

```text
292384/345600 (84.6%)
316636/345600 (91.6%)
344217/345600 (99.6%)
352295/345600 (101.9%)
390373/345600 (113.0%)
398113/345600 (115.2%)
```

虽然 L4 auto-compact 在 22:08:03 和 22:09:17 成功执行过，但预算仍持续超过上限，说明压缩没有完全抵消长上下文带来的压力。

### 2. L4 压缩多次失败

多次出现：

```text
L4 auto-compact failed: DeepSeek API error: 400 — Messages with role 'tool' must be a response to a preceding message with 'tool_calls'
```

这个错误非常关键。它说明发送给模型的消息列表里存在不合法的 tool 消息结构：某条 `role=tool` 的消息，在压缩或裁剪后，已经找不到对应的上一条 `tool_calls` assistant 消息。

这通常不是业务项目问题，而是 Alembic 上下文压缩层的问题。高概率发生在：

- L1/L4 压缩移除了 assistant tool_calls，但保留了 tool result。
- 截断 tool results 时没有按 tool call/result 成对处理。
- 多阶段 retry 复用 ContextWindow 时，旧工具消息被重新排序或部分保留。

这类错误会让压缩层在预算最紧张的时候失效，进而导致预算继续膨胀。

---

## 六、Nudge 和阶段机行为

### 1. 正常的阶段推动

本次日志里 `ExplorationTracker` 正常推动了几个阶段：

```text
SCAN → EXPLORE
EXPLORE → VERIFY
VERIFY → SUMMARIZE
PRODUCE → SUMMARIZE
```

这些阶段 nudge 的目的明确：

- planning nudge：要求 Agent 先列探索计划。
- reflection nudge：在低效或停滞时要求中期反思。
- phase transition nudge：提示从扫描进入探索、验证或总结。
- budget warning nudge：预算使用到 75% 时提醒收敛。
- convergence nudge：produce 阶段没有新信息时要求总结 digest。

### 2. 异常：SUMMARIZE 后仍注入 planning

`design-patterns` 在 22:08:44 已经进入 SUMMARIZE：

```text
VERIFY → SUMMARIZE
Transition Nudge ... 请停止调用工具，直接输出完整分析报告
```

但紧接着又出现：

```text
planning triggered at iteration 19
计划偏差检查 ...
```

`error-resilience` 也出现类似情况：已经进入 SUMMARIZE 后又注入 planning nudge。

这属于阶段指令冲突。SUMMARIZE 的意图是“停止探索并输出报告”，planning nudge 的意图是“更新计划并继续行动”。两者同时出现，会造成：

- Agent 行为摇摆，可能继续探索。
- 额外消耗 token。
- 质量门和预算控制的判断变得不稳定。
- 日志可读性下降。

这个问题优先级较高，应该在阶段机或 NudgeGenerator 层面修正：进入 `SUMMARIZE` 后应屏蔽 planning/reflection 类 nudge，只允许 summary/digest 指令。

---

## 七、去重与候选生产情况

### 1. 去重集合有效

启动时已经 seeded：

```text
33 titles + 35 triggers into dedup set
```

produce 阶段也确实拦截了重复项：

```text
duplicate trigger: "@design-module-dispatcher"
duplicate blocked: "ModuleDispatcher: 同步事件总线替代 NotificationCenter"
duplicate trigger: "@pattern-param-encoding"
duplicate blocked: "ParameterEncoding 请求编码策略"
duplicate trigger: "@network-error-unified-enum"
duplicate blocked: "NetworkError 统一网络错误枚举"
duplicate blocked: "SafeDecodable 容错解码包装器"
```

这说明 rescan 的去重逻辑在工作。

### 2. 但 Producer 仍浪费了较多提交

两个维度的生产效率：

| 维度 | submitted | accepted | rejected | 接受率 |
| --- | ---: | ---: | ---: | ---: |
| design-patterns | 8 | 4 | 4 | 50.0% |
| error-resilience | 9 | 6 | 3 | 66.7% |
| 合计 | 17 | 10 | 7 | 58.8% |

对于增量扫描来说，接近 41% 的 rejected 说明 Producer 对已有知识的感知还不够前置。现在是“生成后再拦截”，更理想的是“生成前就把已知主题从 prompt 和候选方向中排除”。

---

## 八、统计口径不一致

日志结尾：

```text
Memory stats: 2 dims, 2 findings, 95 files, 3 cross-refs, 2 reflections
Cache stats: 0% hit rate, 0 searches, 0 files
```

但前文又有：

```text
Dimension "design-patterns": files=41, toolCalls=91
Dimension "error-resilience": files=65, toolCalls=64
Tool calls: 155
```

Ghost Mode 报告进一步确认了这个问题。同一个 `bootstrap-report.json` 里有：

```json
{
  "totals": {
    "toolCalls": 155
  },
  "toolUsage": {
    "total": 0,
    "byTool": {},
    "byStage": {}
  },
  "terminal": {
    "enabled": false,
    "commands": [],
    "successRate": 0
  }
}
```

这说明至少存在两套统计：

- 维度/session 统计：记录了 files、findings、toolCalls。
- cache stats：记录的是内部缓存命中，而不是本次实际搜索/读取数量。
- report 的 `toolUsage` 统计：字段存在，但本次没有被真实填充。

问题不一定是数据错误，但日志表达容易误导。尤其是 `Cache stats: 0 searches, 0 files` 会让人误以为本次没有搜索和读文件，而事实上两个维度累计报告了 95 个文件和 155 次工具调用。

produce 阶段还有类似现象：

```text
Exploration saturated ... files=0, patterns=0
Search completed: mode=keyword total=4
```

这说明 ExplorationTracker 对 produce 阶段的工具或结构化查询计数没有完整纳入，或者只统计某一类工具。

---

## 九、当前主要问题清单

### P0：上下文压缩破坏 tool call/message 配对

证据：

```text
L4 auto-compact failed: DeepSeek API error: 400 — Messages with role 'tool' must be a response to a preceding message with 'tool_calls'
```

影响：

- 压缩在预算高压时反复失败。
- 可能导致模型请求直接失败。
- retry/long-running scan 越长，越容易触发。

建议：

- 压缩时以 assistant tool_call 和 tool result 为原子单元成对保留或成对删除。
- 在发起 LLM 请求前增加 message invariant 校验。
- 对 orphan tool message 做自动修复：删除孤儿 tool result，或保留对应 assistant tool_calls 摘要。

### P0：SUMMARIZE 阶段仍注入 planning nudge

证据：

```text
VERIFY → SUMMARIZE
planning triggered at iteration 19
```

影响：

- 阶段意图冲突。
- 增加 token 和轮次浪费。
- 可能导致 Agent 不按“停止工具调用”执行。

建议：

- `ExplorationTracker` 进入 `SUMMARIZE` 后冻结 plan/reflection nudge。
- `NudgeGenerator` 根据 phase 做硬过滤。
- `PlanTracker` 不应把“总结分析”提前标记为已完成后继续触发计划偏差检查。

### P1：QualityGate 对 evidence=40 的处理不一致

证据：

```text
design-patterns: action=retry evidence=40 suggestions=[Findings lack file-level evidence]
error-resilience: action=pass evidence=40 suggestions=[Findings lack file-level evidence]
```

影响：

- 同样的证据不足，在不同维度得到不同处理。
- `error-resilience` 最终 `findings=0`，可能就是证据不足但被放行的后果。

建议：

- 明确 evidence 低于阈值时的强制 retry 规则。
- 如果不同维度阈值不同，应在日志里打印原因。
- 对 `suggestions=[Findings lack file-level evidence]` 增加 hard gate 选项。

### P1：候选不空但 findings 为空

证据：

```text
Producer "error-resilience": submitted=9, accepted=6, rejected=3
SessionStore Stored report for "error-resilience": 0 findings, 65 files
Tier 2 reflection: 0 top findings, 0 patterns
```

影响：

- 用户看到的是“创建了 6 个候选”，但维度 reflection 为空。
- 如果 dashboard 或报告依赖 findings，会误判该维度没有有效发现。

建议：

- 明确 candidates、findings、patterns 的转换关系。
- Producer accepted 后至少生成对应 summary finding，或在日志中说明为什么 candidate 不进入 finding。
- 对 `accepted > 0 && findings == 0` 增加 warning。

### P1：report candidates 与最终 recipes 数量没有直接解释

证据：

```text
totals.candidates = 10
design-patterns.candidatesSubmitted = 4
error-resilience.candidatesSubmitted = 6
外置 recipes 当前可见: design-patterns 4 个, error-resilience 3 个
```

影响：

- 用户会把 `Candidates: 10 created` 理解为 10 个最终可消费 recipe。
- 实际外置知识库中本次相关维度可见 7 个 recipe，另外 3 个候选去了哪里不清晰。
- `error-resilience` 同时存在 `accepted=6`、`recipes=3`、`findings=0` 三种计数，排查体验很拧巴。

建议：

- 终局报告拆分 `acceptedCandidates`、`promotedRecipes`、`storedFindings`。
- 如果 candidate 因生命周期、去重、staging、promotion gate 未落盘 recipe，应记录原因。
- 在 `bootstrap-report.json` 中增加每个 accepted candidate 的 id、title、target path、status。

### P1：增量扫描的交付隔离容易造成预期落差

证据：

```text
InternalDimensionFill rescan mode — skipping delivery/wiki/memory (pipeline isolation)
```

影响：

- 本次结果保存了 report 和 snapshot，但不会自动同步到 IDE 规则、wiki 或长期 memory。
- 如果用户期待“扫描后立即可用”，会觉得扫描没有生效。

建议：

- 在终局报告中明确展示 rescan mode 的落点：report、snapshot、candidate staging。
- 提供单独命令或开关，让用户选择是否把 rescan 结果 promotion 到 delivery/wiki/memory。

### P2：Producer 去重前置不足

证据：

```text
design-patterns: submitted=8, accepted=4, rejected=4
error-resilience: submitted=9, accepted=6, rejected=3
```

影响：

- rejected 比例偏高。
- 重复主题仍进入 LLM 生产过程，浪费 token 和工具轮次。

建议：

- 在 produce prompt 构造时注入已有 title/trigger 的负向约束。
- 对 duplicate trigger 命中的主题直接跳过，不进入完整候选生成。
- 记录 duplicate blocked 的主题用于下一轮 prompt 收敛。

### P2：统计日志需要统一口径

证据：

```text
Memory stats: 2 dims, 2 findings, 95 files
Cache stats: 0% hit rate, 0 searches, 0 files
Tool calls: 155
```

影响：

- “0 searches, 0 files” 和维度 files/toolCalls 容易被误读为矛盾。
- 排查性能和缓存命中时不容易定位真实瓶颈。

建议：

- 将 cache stats 改名为 `RetrievalCache stats` 或 `SearchCache stats`。
- 终局同时打印 actual tool usage、code reads、knowledge queries、cache reads。
- ExplorationTracker 在 produce 阶段也应统计结构化查询和 meta/memory 工具。

---

## 十、本次扫描产物应该如何理解

本次扫描完成后，日志确认了以下产物：

```text
Workflow report saved to .asd/bootstrap-report.json
Snapshot saved: snap_713a59381977 (127 files, 2 dims)
```

在 Ghost Mode 下，实际路径是：

```text
/Users/gaoxuefeng/.asd/workspaces/c8d24663/.asd/bootstrap-report.json
/Users/gaoxuefeng/.asd/workspaces/c8d24663/.asd/bootstrap-reports/bs_1777817128293_nis4fj.json
/Users/gaoxuefeng/.asd/workspaces/c8d24663/Alembic/recipes/
```

但它也确认了隔离：

```text
rescan mode — skipping delivery/wiki/memory
```

因此，本次结果的实际状态应理解为：

1. 已完成两个维度的内部分析。
2. 已创建 10 个候选知识项。
3. 已保存 workflow report 到 Ghost workspace。
4. 外置 recipes 中可见 7 个相关 recipe：4 个设计模式，3 个错误韧性。
5. 没有创建 skill。
6. 没有执行 IDE 交付、wiki 更新或长期 memory 同步。

如果下一步要验证扫描结果，应优先找：

- `/Users/gaoxuefeng/.asd/workspaces/c8d24663/.asd/bootstrap-report.json`
- `/Users/gaoxuefeng/.asd/workspaces/c8d24663/Alembic/recipes/design-patterns/`
- `/Users/gaoxuefeng/.asd/workspaces/c8d24663/Alembic/recipes/error-resilience/`
- snapshot id: `snap_713a59381977`
- dimension reports: `design-patterns`、`error-resilience`
- producer accepted/rejected candidates

如果这些文件在 BiliDili 项目内不存在，不代表扫描没生效；Ghost Mode 的设计就是把 `.asd/` 和 `Alembic/` 外置到 `~/.asd/workspaces/c8d24663/`。

---

## 十一、建议的后续修复顺序

### 第一优先级

1. 修复 L4 compact 的 tool message 配对问题。
2. 修复 SUMMARIZE 后仍触发 planning/reflection nudge 的阶段机问题。
3. 给 `accepted > 0 && findings == 0`、`acceptedCandidates != promotedRecipes` 增加显式 warning 或失败条件。

### 第二优先级

1. 统一 QualityGate 对 evidence 低分的行为。
2. 把 duplicate 信息前置到 Producer prompt，减少生成后拒绝。
3. 明确 rescan mode 终局落点，减少“扫描完成但没有交付”的误解。

### 第三优先级

1. 重命名或拆分 cache stats，避免和实际搜索/文件读取混淆。
2. 改善 stage 名称日志。当前 `analyze`、`evolve`、`produce` 的嵌套关系在日志里不够直观。
3. 在最终报告中展示每个维度的 accepted candidates、stored findings、files、toolCalls、quality score。
4. 在 Ghost Mode 项目中，终局输出应直接打印外置 workspace 路径，避免用户去项目内找 `.asd`。

---

## 十二、一句话判断

这次 BiliDili 增量扫描“业务上跑完了，候选也产出了”，但“运行时链路暴露出上下文压缩、阶段 nudge、质量门一致性和产物统计口径的问题”。其中最需要立刻修的是 L4 压缩的 tool 消息配对，以及 SUMMARIZE 阶段仍注入 planning 的指令冲突；这两处都会直接影响后续长链路扫描的稳定性和成本。
