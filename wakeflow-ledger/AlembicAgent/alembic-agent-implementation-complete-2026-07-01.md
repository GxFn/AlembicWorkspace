# AlembicAgent 完整实现文档(@alembic/agent)

> 生成日期: 2026-07-01
> 仓库: AlembicAgent(独立 npm 包 `@alembic/agent` v0.2.0)
> 规模: ~194 个 `.ts` 文件 / ~45.8k LOC
> 技术栈: TypeScript + ESM(NodeNext)+ Node >= 22 + Biome
> 本文由跨子系统并行深度测绘综合而成:14 份子系统剖析章节(S01–S14)拼装为一份完整、连贯、可长期维护的实现文档。第 1–6 节为综合总览,第 7 节收录全部原始深剖章节。

---

## 1. 项目定位与边界

`@alembic/agent` 是 Alembic 生态里独立的 **Agent 运行时(runtime)+ AI provider 适配层 + 工具系统**。它回答一个单一命题:给定一个宿主构造的运行输入,如何以统一的 ReAct(Thought → Action → Observation)循环驱动 LLM 与工具协作,产出规范化结果。

**本仓是什么:**

- **Agent 执行引擎**:唯一的 `AgentRuntime` ReAct 内核 + Strategy 编排 + Policy 约束 + Capability 组合 + 分层记忆/上下文。
- **AI provider 适配层**:统一 `AiProvider` 抽象背后收敛 OpenAI/Claude/Google/DeepSeek/Ollama 五类厂商的 transport 协议差异、可靠性控制、参数守卫、结构化输出修复。
- **工具系统**:单源 `TOOL_REGISTRY` + `ToolRouter` + kernel 契约,含 code/terminal/knowledge/graph/memory/meta 六个内建工具及其安全模型、输出压缩。

**本仓不是什么(边界对照):**

- **不含 Core 确定性内核**。项目结构分析、ProjectContext、Recipe/知识持久化、维度配置、日志等确定性能力都在 `@alembic/core`;本仓仅通过 `@alembic/core` 包入口按契约接入(runtime 内核对 Core 的耦合极薄,主要是 `@alembic/core/logging` 与 `RecipeAuthoringSpec`/维度配置等领域数据)。
- **不含 Dashboard UI**。可视化面板不属于本仓。
- **不含 Codex 插件交付壳**。Codex MCP/marketplace/channel 由 `AlembicPlugin` 承载。宿主(主体 in-process Agent 或 Plugin)只负责经 DI 装配本仓、构造 `AgentRunInput` 并调用服务层。

这条边界由冻结的职责 manifest(`AgentRuntimeResponsibility` / `AgentInterfaceContract` / `AgentRuntimeBoundary`)以可执行的方式固化:runtime 的 nonGoals 明确列出 "Core deterministic repository / Codex host route / Dashboard UI",防止 Agent 边界被空壳化或越权。

**如何接入 `@alembic/core`:** 通过包入口子路径(如 `@alembic/core/logging`、`@alembic/core/knowledge`、`@alembic/core/dimensions`)按契约消费领域数据与工具函数;Core 的确定性能力不在本仓复制。工具系统的 kernel 层甚至以 `unknown` + duck-type 断言避免对宿主/Core 的反向依赖。

## 2. 顶层架构与分层

`src/agent/index.ts` 头部注释确立的统一分层是全仓心智模型的骨架。依赖方向自上而下,每层只认下一层的最小契约:

```
┌──────────────────────────────────────────────────────────────┐
│ Surface Layer   HTTP · CLI · MCP · Workflow                    │
│                 职责: 只构造 AgentRunInput 数据对象             │
└───────────────────────────────┬──────────────────────────────┘
                                 │ AgentRunInput
                                 ▼
┌──────────────────────────────────────────────────────────────┐
│ AgentService    统一服务入口 + profile 编译                    │
│                 校验 → AgentProfileCompiler → (并发协调?) →    │
│                 AgentRuntimeBuilder → runtime.execute →         │
│                 规范化为 AgentRunResult(异常降级为结构化结果)  │
└───────────────────────────────┬──────────────────────────────┘
                                 │ CompiledAgentProfile
                                 ▼
┌──────────────────────────────────────────────────────────────┐
│ AgentRuntimeBuilder   Profile + DI(容器/工具/AI/root)→       │
│                       getPreset + CapabilityRegistry +         │
│                       resolveStrategy + PolicyEngine → Runtime │
└───────────────────────────────┬──────────────────────────────┘
                                 │ new AgentRuntime(config)
                                 ▼
┌──────────────────────────────────────────────────────────────┐
│ AgentRuntime    ReAct Loop (Thought → Action → Observation)    │
│   ├─ Capability(技能/工具白名单组合容器)                      │
│   ├─ Strategy(编排:Single/Pipeline/FanOut/Adaptive;控制反转)│
│   ├─ Policy(Budget 硬停 / Safety 硬拦 / QualityGate 软告警)   │
│   └─ 横切: 记忆/上下文/事件/诊断/PCV 证据/预算压缩            │
└───────────────────────────────┬──────────────────────────────┘
                                 │ tool call
                                 ▼
┌──────────────────────────────────────────────────────────────┐
│ Action Layer    ToolRouter → handler(code/terminal/knowledge/ │
│                 graph/memory/meta);执行动作,不选 profile     │
└──────────────────────────────────────────────────────────────┘
```

各层职责:

- **Surface Layer**:HTTP/CLI/MCP/Workflow 四类外部表面,唯一职责是把外部请求整理成一个 `AgentRunInput` 数据对象。它不知道 runtime、strategy、tool 的存在。
- **AgentService**:唯一服务入口。把 profile 声明编译成 `CompiledAgentProfile`,决定是否 fan-out 并发协调,经 Builder 装配 runtime,执行并把结果规范化成 `AgentRunResult`。**单次执行路径的异常永不外泄**——被降级成结构完整的错误结果并正则分类为五态状态(success/blocked/aborted/timeout/error)。
- **AgentRuntimeBuilder**:Builder + DI 装配器。持有跨 run 不变的宿主资源(container/tool/ai/root),每次 `build()` 只叠加 per-run 的 profile 与回调,产出一个 fresh runtime。
- **AgentRuntime**:执行心脏(2720L)。是 ReAct 循环的宿主、Capability 的组合容器、Policy 的执行者、Strategy 的被委托者。**控制反转**:runtime 驱动 strategy 的选择,strategy 反过来驱动 `runtime.reactLoop()`。
- **Action Layer**:`ToolRouter` 执行具体动作,只负责"解析 → 校验 → 鉴权 → 并发 → 分发 handler → 截断",**不选 profile、不做编排**。

**Preset 表(profile 的基线组合)**:

| Preset | Capabilities | Strategy | Policies |
|--------|-------------|----------|----------|
| `chat` | Conversation + Analysis | Single(单轮工具循环) | Budget(8 轮) |
| `bootstrap` | Analysis + Knowledge | FanOut + Pipeline | Budget + Quality |
| `scan` | Analysis + Knowledge | Pipeline | Budget + Quality |

**包 exports 子路径**:`./agent` `./service` `./runtime` `./prompts` `./domain` `./tasks` `./profiles` `./ai` `./tools/runtime` `./memory` `./context`。顶层 barrel `src/index.ts` re-export agent/context/memory/ai/tools 五个子系统桶文件,并冻结导出包元信息常量 `alembicAgentPackage`。

## 3. 一次 Agent Run 的端到端生命周期

把全仓串成一条完整叙事(以 system 扫描 `runScanAgentTask` 为例,冷启动 fan-out 场景见括注):

1. **构造输入**(Surface / runs 层,详见 S01/S10)。宿主经 DI 容器装配好 `AgentRuntimeBuilder` / `AgentProfileCompiler` / `AgentRunCoordinator` / `SystemRunContextFactory`,组成 `AgentService`(均为 `aiDependent` 单例)。领域化 run 包装函数(如 `runScanAgentTask`)先用 `SystemRunContextFactory.createSystemContext()` 造出带 `MemoryCoordinator` + `ContextWindow` + `ExplorationTracker` 的 `SystemRunContext`,再组装 `AgentRunInput`(profile/message/params/context/execution/presentation 六字段)。

2. **服务入口校验 + profile 编译**(`AgentService.run`,详见 S01)。三条硬前置(profile 存在 / message.content 非空 / context.source 存在)。`AgentProfileCompiler.compile()` 把三种 profile 输入形态(Ref / Override / 已编译)统一编译成 `CompiledAgentProfile`——带 strategy 声明、policies、`AgentConcurrencyPlan` 并发计划、`runtimeOverrides`。

3. **并发协调分支**(冷启动 fan-out,详见 S01/S10)。若 profile 声明了 `concurrency.mode !== 'none'`,进入 `AgentRunCoordinator`:partitioner 按维度/模块切分 → tiered/parallel 并发执行每个 child run → merger 合并。**关键设计**:child runner 就是 `AgentService.run` 本身(递归回同一入口),子任务复用全部校验/编译/降级语义;child 错误/取消转成结果对象(部分结果),不冒泡炸掉整批。单次(scan)路径不走此分支。

4. **runtime 构造**(`AgentRuntimeBuilder.build`,详见 S01/S05)。`normalizeProfile` 把 profile 归一成 `{ presetName, overrides }` → `getPreset` 查 `PRESETS` 表并深合并 overrides、`resolveStrategy` 把声明式 strategy 解析成实例 → `CapabilityRegistry.create` 实例化能力 → policy 工厂/实例解析 → `new AgentRuntime({ ... , policies: new PolicyEngine(...), strategy, capabilities, toolRouter, ... })`。

5. **execute() 六道关卡**(详见 S02)。重置 per-run 状态 → 解析 grounding enforcement(AP-3,默认 `off` = PCV observe-only)→ Policy 前置校验 `validateBefore`(不过直接返回,退出路径 A)→ 建超时 AbortController + timeoutPromise(默认 300s 硬超时)→ **委托 Strategy 并 race** → Policy 后置校验 `validateAfter`(只记 qualityWarning 不改回复)→ 收口发 `AGENT_COMPLETED`。

6. **ReAct 主循环**(`reactLoop`,详见 S02/S03)。Strategy 反调 `runtime.reactLoop()`,`while(true)` 骨架拆成 `#initLoop`/`#shouldExit`/`#prepareIteration`/`#callLLM`/`#processToolCalls`/`#processTextResponse`/`#finalize` 七个提取方法,全部状态由 `LoopContext` 单对象贯穿。每轮:开轮 trace → 退出判定(ExitController) → 迭代准备(nudge + L1-L3 压缩 + toolChoice + dynamicContext 组装) → **唯一 LLM 出口 `aiProvider.chatWithTools`**(背后是 LLMGateway + Transport,详见 S11/S12) → 处理工具调用或文本响应。

7. **工具执行**(详见 S03/S13/S14)。`#processToolCalls` 把每次调用交给 `ToolExecutionPipeline` 的 11 段中间件链(白名单/参数体积/阶段动作守卫/去重/观察/信号/推理链/提交登记),唯一真执行步是 `ToolRouter.execute` → handler。结果经普通输出策略(D2.3)归一化 + `limitToolResult` 按预算裁剪 + 输出压缩管线(ANSI strip → 折叠 → 专用 parser)。

8. **记忆 / 上下文更新**(详见 S07/S08)。每轮工具观察经 after-hook 分发进三层记忆(`observationRecord` → 只读缓存 / `trackerSignal` → 探索追踪 / `traceRecord` → ActiveContext);`ContextWindow` 以 5 层递进压缩在 token 预算内维护协议消息;`ExplorationTracker` 推进 phase 状态机并反馈 toolChoice/nudge/exit。

9. **退出 / 强制总结**(详见 S02)。13 条退出路径经 ExitController 合并为结构化 `ExitSignal`;所有退出汇入 `#finalize`,保证 `lastReply` 非空。`produceForcedSummary` 按 source + pipelineType 分 analyst/bootstrap/user 三模式生成总结,带 AI 失败兜底(从 toolCalls 合成报告);已降级/中止的 run 触发摘要抑制,不浪费一次 LLM 调用粉饰。

10. **结果契约**(详见 S01/S03)。runtime 结果规范化为 `AgentRunResult`(runId/profileId/reply/status/phases/toolCalls/usage/diagnostics)。fan-out 场景 merger 把各 child 结果聚合成父级结果。领域 run 包装函数再把通用结果投影成领域结果(如 `ScanKnowledgeProjection`)。

## 4. 核心横切模式

- **Profile 驱动的声明式装配**(S05):"一次运行需要哪些能力/策略/约束"被抽成可序列化的 profile 数据。两条配置来源(含函数的硬编码 `PRESETS` 三基线 vs 强制可序列化的 11 个 `AgentProfileDefinition`)经 `AgentProfileCompiler` 编译成唯一交汇契约 `CompiledAgentProfile`。三个注册表(Profile/StageFactory/Capability)解决"声明禁函数但 pipeline 需函数"的矛盾。

- **Strategy 编排 + 控制反转**(S06):抽象基类 `Strategy` 只暴露 `name`/`execute`;四个具体策略(Single/FanOut/Adaptive/Pipeline)通过窄接口 `StrategyRuntime` 反向委托回 `reactLoop`。`PipelineStrategy`(1100L)是核心:可回退索引的 for 循环编排 stage,Quality Gate 三态(pass/retry/degrade)驱动重试与显式降级,每阶段独立 capability/budget、per-stage 硬超时、阶段隔离(重置 ContextWindow/ExplorationTracker)。

- **Policy 约束引擎**(S05):`PolicyEngine` 短路编排 Budget(硬停机)/Safety(硬拦截)/QualityGate(软告警)三类 policy,分别在 `validateBefore`/`validateDuring`/`validateAfter` 三个时点生效。

- **Capability 分组**(S05/S13):`CapabilityRegistry` 把能力字符串映射成实例,决定加载哪些技能与工具白名单;`src/tools/runtime/capabilities/` 提供场景级工具集封装(Conversation/Bootstrap/Scan/Evolution/System)。

- **分层记忆 / 上下文**(S07/S08):记忆三层(ActiveContext 工作记忆 / SessionStore 会话记忆 / PersistentMemory SQLite 语义记忆)由 `MemoryCoordinator` 统一路由,完成写入→蒸馏→固化→检索→注入;上下文子系统(ContextWindow 5 层压缩 + ExplorationTracker 探索节奏)负责当轮窗口装配。分工明确:memory=存储/蒸馏,context=当轮窗口装配 + 探索节奏。

- **Provider / Transport 抽象**(S11/S12):方案①分层——协议下沉 transport、横切收敛 gateway、provider 薄壳。各厂商 Provider 退化为薄壳,经 lazy 动态 import 委托专属 `LLMGateway`,后者完成 modelRef 解析、`ParameterGuard` 参数守卫、`ReliabilityController` 重试/熔断/并发/429 冷却、响应归一化;`ModelRegistry` 是模型能力/约束的声明式单一事实来源。runtime 只持有单个注入的 `AiProvider`。

- **Tool kernel 契约 + 压缩**(S13/S14):kernel 是纯契约层(取代旧 V1/V2 双分裂后的单源词汇);catalog 单源目录 + 懒加载 schema 投影降 token;runtime 声明 6 个工具、`ToolRouter` 六阶段流水线。输出经 `OutputCompressor` 三段管线(strip → 折叠 → parser/截断)控制 token。

- **可观测性(事件 / 诊断 / PCV 证据)**(S03/S04):`HookSystem`/`AgentEventBus` 提供钩子与广播;`DiagnosticsCollector` 累积全 run 诊断;`PcvNodeEvidence` 是 observe-only 的节点级证据引擎(只采集 grounding classification 等事实、绝不据此控流,默认 `groundingEnforcement='off'`)。

- **错误分类与降级**(S01/S02/S03):`inferErrorStatus` 正则归一五态;`AgentInterfaceContract` 冻结 10 个结果分支 + D2.3 普通输出策略 + D2.5 失败分类学;每条 fallback/abort/timeout/circuit/2-strike 路径都配 `logger.warn` + 诊断事件,符合"运行时分叉必须打印明确日志"要求。

## 5. 关键设计决策与不变量

- **DeltaCache 长生命周期共享注入**(S13/S14):`ToolContextFactory` 持有单个长生命周期 `DeltaCache`,注入每个 per-call ctx,使一次 run 内的读/写调用共享同一缓存。这是 B-1 写前新鲜度门成立的承重前提——该门仅在读/写两次调用共享同一缓存时才成立。

- **写前新鲜度门 / TOCTOU 硬拒**(S13/S14):`code.write` 的四态 TOCTOU 写前新鲜度门(`checkWriteFreshness`)在写入前校验读取快照未过期,防止 read-before-write 竞态;不新鲜直接硬拒。

- **AgentInterfaceContract 普通输出策略与失败分类**(S03):`ALEMBIC_AGENT_INTERFACE_CONTRACT` 冻结 10 个结果分支;D2.3 普通输出策略统一工具结果归一化;D2.5 失败分类学统一失败语义。这是包对宿主承诺的可执行契约。

- **terminalSafety 沙箱 / 黑名单双层安全**(S14):terminal 工具两层安全模型——全局危险命令黑名单 + 只读命令 allowlist;经 Seatbelt 沙箱执行(`execInSandboxOrDirect`),沙箱不可用时降级但记审计。read-mostly + allowlist + 沙箱审计是终端工具的安全基线。

- **工具系统 V1 退役登记**(S13):kernel 是取代旧 V1(`src/tools/core`)与 V2(`src/tools/v2/types`)双契约分裂后的 canonical 单源;仓库 `CLAUDE.md` 中的"工具系统 V1 退役登记"记录了这次收敛的授权链路。

- **session budget 只压缩不终止**(S02):`BudgetController` 用 0.75/0.90 阈值三级压缩(L1-L4,L4 默认关),session 预算**只做压缩触发,不做终止决策**;终止由 maxIterations / timeout / ExitController 负责,避免职责重叠。

- **`#safeTransition` 容忍多阶段重入**(S02):Pipeline/FanOut 场景 `reactLoop` 被多次调用,状态已不在 IDLE;`#safeTransition` 用 try/catch 静默吞掉不合法转移,保证多阶段执行不中断。

- **cumulativeUsage 引用共享跨 stage 累加**(S02):`BudgetController` 的 `cumulativeUsage` 用 `AgentRuntime.tokenUsage` 引用,跨 pipeline stage 共享累加。

- **grounding observe-only 边界**(S02/S04):`PcvNodeEvidence` 只观察记录,`AnalyzeGroundingGuard` 单向只读消费其 classification;`groundingEnforcement` per-run 可覆盖但默认全关(PCV observe-only)。

- **异常永不外泄(单次路径)**(S01):`AgentService.run` 把执行异常降级成结构完整的错误结果,仅并发编排级错误例外上抛。

- **投影双形态与 scope 一致性**(S01):`projectSystemRunContext` 同时平铺 + 嵌套,兼容扁平字段与完整对象两种消费方式,并带 scope 一致性不变量校验(trace 与 activeContext 必须同 scope)。

- **note_finding 唯一事实源**(S07/S09):analyst 阶段 `note_finding` 是唯一事实源 + 硬评分依据;Producer 写作指南从 Core `RecipeAuthoringSpec` 权威渲染,保证 guidance == gate。

- **冻结职责 manifest**(S02/S03):`AgentRuntimeResponsibility`/`AgentInterfaceContract`/`AgentRuntimeBoundary` 三份冻结 manifest 用类型化对象声明架构契约,不参与运行期控制流,是"Agent 边界不被空壳化"规则的可执行落点。

## 6. 目录与文件索引

| 目录 | 职责一句话 | 章节 |
|------|-----------|------|
| `src/index.ts` | 顶层 barrel,聚合五个子系统桶 + 包元信息 | S01 |
| `src/agent/index.ts` | agent 子系统门面,命名转出服务/运行时/策略/契约 | S01 |
| `src/agent/service/` | 统一服务入口:AgentService / RuntimeBuilder / ProfileCompiler / SystemRunContextFactory / RunContracts | S01 |
| `src/agent/runtime/` | ReAct 内核:AgentRuntime + LoopContext + AgentState + ExitController + BudgetController + forcedSummary | S02 |
| `src/agent/runtime/`(外围) | 横切运行时:ToolExecutionPipeline / LLMInputAssembly / MessageAdapter / HookSystem / EventBus / Diagnostics / SystemPromptBuilder | S03 |
| `src/agent/runtime/PcvNodeEvidence*` | PCV 节点级证据引擎(observe-only)+ AnalyzeGroundingGuard | S04 |
| `src/agent/profiles/` | 声明式配置:PRESETS / definitions / Compiler / Registry / Capabilities / Policies | S05 |
| `src/agent/strategies/` | 编排策略:Strategy / Single / FanOut / Adaptive / Pipeline | S06 |
| `src/agent/memory/` + `src/agent/domain/` | 三层记忆 + 证据采集/情节固化 | S07 |
| `src/agent/context/` | 上下文窗口装配(ContextWindow 5 层压缩)+ 探索追踪(ExplorationTracker) | S08 |
| `src/agent/prompts/` | Insight 提示词体系 + 质量门控(analyze/gate/produce/evolve) | S09 |
| `src/agent/runs/` + `coordination/` + `tasks/` | 领域化 run 编排 + fan-out 协调 + 宿主 task 层直连 | S10 |
| `src/ai/`(上) | Provider 抽象 / Factory / Manager / Gateway / Registry | S11 |
| `src/ai/`(下) | 各厂商 Transport / 可靠性 / 结构化输出 / 参数守卫 | S12 |
| `src/tools/kernel` + `catalog` + `runtime`(骨架) | 工具契约 / 目录 / 路由/注册/适配/缓存/能力封装 | S13 |
| `src/tools/runtime/handlers` + `compressor` | 6 个工具 handler + 输出压缩/解析 | S14 |

---

## 7. 子系统深度剖析

以下收录 14 份原始深度剖析章节,按包出口 → 运行时内核 → 配置/编排 → 记忆/上下文/提示词 → 领域运行 → AI 栈 → 工具系统的顺序编排。

- [S01 · 包出口 · 服务层 · Run 启动](#s01--包出口--服务层--run-启动-srcindex-srcagentservice)
- [S02 · AgentRuntime · ReAct 主循环内核](#s02--agentruntime--react-主循环内核-srcagentruntime-核心)
- [S03 · Runtime I/O · 工具执行管线 · LLM 输入装配 · 消息/钩子/事件/诊断](#s03--runtime-io--工具执行管线--llm-输入装配--消息钩子事件诊断-srcagentruntime-外围)
- [S04 · PCV 节点证据](#s04--pcv-节点证据-srcagentruntimepcvnodeevidence)
- [S05 · Profiles · Presets · Capabilities · Policies](#s05--profiles--presets--capabilities--policies-声明式配置层)
- [S06 · Strategies · 编排策略](#s06--strategies--编排策略-pipelinefanoutadaptivesingle)
- [S07 · Memory 子系统 · 记忆分层与巩固](#s07--memory-子系统--记忆分层与巩固-srcagentmemory--domain)
- [S08 · Context 子系统 · 上下文窗口装配与探索追踪](#s08--context-子系统--上下文窗口装配与探索追踪-srcagentcontext)
- [S09 · Prompts · Insight 提示词体系](#s09--prompts--insight-提示词体系-srcagentprompts)
- [S10 · Runs · Coordination · Tasks · 领域化 Agent 运行](#s10--runs--coordination--tasks--领域化-agent-运行-srcagentruns-coordination-tasks)
- [S11 · AI 子系统(上)· Provider 抽象 · Factory · Manager · Gateway · Registry](#s11--ai-子系统上-provider-抽象--factory--manager--gateway--registry)
- [S12 · AI 子系统(下)· 各厂商 Transport · 可靠性 · 结构化输出 · 参数守卫](#s12--ai-子系统下-各厂商-transport--可靠性--结构化输出--参数守卫)
- [S13 · 工具系统内核 · Catalog · Runtime 路由/注册/适配/缓存/能力封装](#s13--工具系统内核--catalog--runtime-路由注册适配缓存能力封装-srctoolskernel-catalog-runtime-骨架)
- [S14 · 工具 Handlers · 输出压缩/解析](#s14--工具-handlers--输出压缩解析-srctoolsruntimehandlers-compressor)

---

## S01 · 包出口 · 服务层 · Run 启动 (src/index, src/agent/service)

本章剖析 `@alembic/agent` 包的对外门面与「一次 run 从调用到 runtime 构造」的完整进入路径。它是整个 Agent 子系统的入口层:宿主(主体 in-process Agent 或 Plugin)只负责构造一个 `AgentRunInput` 数据对象并调用 `AgentService.run()`,服务层把它编译成 `CompiledAgentProfile`、决定是否并发协调、经 `AgentRuntimeBuilder` 做依赖注入(DI)装配出一个 `AgentRuntime`,最后把执行结果规范化成 `AgentRunResult` 返回。本章覆盖包出口树、服务层五个核心文件的职责与调用链,并锚定关键契约类型。

### 分层定位

`src/agent/index.ts:6` 的头部注释画出了统一架构分层:

```
Surface Layer (HTTP│CLI│MCP│Workflow) → 只构造 AgentRunInput
        ↓
AgentService          → 统一服务入口 + profile 编译
        ↓
AgentRuntimeBuilder   → Profile + DI → Runtime
        ↓
AgentRuntime          → ReAct Loop (Thought→Action→Observe)
        ↓
Action Layer: ToolRouter → 执行动作
```

本章负责其中「Surface → AgentService → AgentRuntimeBuilder」这一段(以及为 system 场景准备运行上下文的 `SystemRunContextFactory`);`AgentRuntime` 本体、策略、能力、工具执行管线由后续章节展开。

### Package 出口树与 exports 映射

顶层 barrel `src/index.ts:1` 是整个 npm 包的公共 API 汇聚点,它 re-export 五个子系统的桶文件:

```ts
export * from './agent/context/index.js';
export * from './agent/index.js';
export * from './agent/memory/index.js';
export * from './ai/index.js';
export * from './tools/index.js';
```

并额外冻结导出一个包元信息常量 `alembicAgentPackage`(`src/index.ts:7`,`packageName: '@alembic/agent'`)及其类型 `AlembicAgentPackageInfo`(`src/index.ts:11`)。

- `package.json` 的 `exports` 字段(结合本仓库 `#ai/*`、`#tools/*`、`#shared/*` 的 `imports` 子路径别名)把这套桶文件映射为包入口。本章文件内可见两类 import 形态:普通相对 import(`../runtime/AgentRuntime.js`,带 `.js` 后缀,ESM/NodeNext 约定)与 `#` 子路径别名(如 `AgentRuntimeBuilder.ts:2` 的 `import { ToolRouterContract } from '#tools/kernel/index.js'`、`SystemRunContextFactory.ts:1` 的 `import { AiProvider } from '#ai/AiProvider.js'`)。别名把跨子系统依赖从相对路径解耦。
- **agent 子系统出口** `src/agent/index.ts` 是本章重点门面。它显式命名导出(而非 `export *`,避免符号污染)以下类别:
  - Capabilities:`Capability`、`CapabilityRegistry`、`CodeAnalysis`、`Conversation`、`KnowledgeProduction`、`SystemInteraction`(`src/agent/index.ts:47`)。
  - Policies:`BudgetPolicy`、`Policy`、`PolicyEngine`、`QualityGatePolicy`、`SafetyPolicy`(`src/agent/index.ts:56`)。
  - Presets:`getPreset`、`PRESETS`、`resolveStrategy`(`src/agent/index.ts:64`)。
  - 事件总线:`AgentEventBus`、`AgentEvents`(`src/agent/index.ts:65`)。
  - 接口契约常量族:`ALEMBIC_AGENT_INTERFACE_CONTRACT`、`validateAgentInterfaceContract`、`AGENT_INTERFACE_D23_ORDINARY_OUTPUT_POLICY`、`AGENT_INTERFACE_D25_FAILURE_TAXONOMY_POLICY` 等(`src/agent/index.ts:66`)——这是包对宿主承诺的「Agent 接口契约」冻结定义与校验器。
  - 核心运行时:`AgentRuntime`(`src/agent/index.ts:79`)、`AgentMessage`/`Channel`(`:77`)、`AgentState`/`AgentPhase`(`:86`)、运行时边界 `ALEMBIC_AGENT_RUNTIME_BOUNDARY`/`supportsAgentRuntimeRoute`(`:80`)。
  - **服务层整体转出**:`export * from './service/index.js'`(`src/agent/index.ts:87`)。这一行把本章五个文件的公共符号全部暴露到包顶层。
  - 策略:`AdaptiveStrategy`、`FanOutStrategy`、`SingleStrategy`、`Strategy`、`PipelineStrategy`(`src/agent/index.ts:89`)。

- **service 桶文件** `src/agent/service/index.ts` 定义了服务层对外面。它转出:装配三件套 `AgentRunCoordinator`(`:1`)、`AgentProfileCompiler`(`:2`)、`AgentProfileRegistry`(`:3`)、`AgentStageFactoryRegistry`(`:4`);一组高层 run 编排函数 `runPlanAgent`、`runScanAgentTask`、`runModuleMining`、`runEvolutionAudit`、`runRelationDiscovery`、`runTranslationJson`、`toScanFileCache` 及其投影函数(`:5` 从 `../runs/index.js` 转出);`export * from './AgentRunContracts.js'`(`:17`)即全部契约类型;以及三个主类 `AgentRuntimeBuilder`(`:18`)、`AgentService`(`:19`)、`SystemRunContextFactory`(`:20`)。

  > 设计要点:`runs/*` 里的编排函数与 `service/*` 的门面类被放在同一层出口。宿主既可以走底层 `AgentService.run()`(自定义 profile/input),也可以走 `runScanAgentTask` 之类的「配方级」封装(内部仍调 `agentService.run()`,见后文)。

### AgentRunContracts:输入/输出契约与类型词汇

`src/agent/service/AgentRunContracts.ts` 是整个服务层的类型基座,不含任何运行逻辑,只定义数据形状。它是「Surface 层构造什么、Service 层消费什么、Runtime 层返回什么」的单一契约来源。核心类型:

- **输入契约 `AgentRunInput`**(`AgentRunContracts.ts:190`)。一次 run 的完整输入,五个字段:
  - `profile: AgentProfileRef | AgentProfileOverride`——选哪个 Agent。`AgentProfileRef`(`:12`,`{ id?, preset?, params? }`)按名引用已注册 profile;`AgentProfileOverride`(`:18`,含 `basePreset`+`skills`/`strategy`/`policies`/`persona`/`memory`/`actionSpace`)内联覆盖一个 preset。
  - `message: AgentRunMessage`(`:109`)——`content`(必填)、`role`(`user`/`system`/`internal`)、`history`、`metadata`、`sessionId`。
  - `params?`——profile 编译参数(如 `dimId`、`concurrency`、`recipes`)。
  - `context: AgentRunContext`(`:152`)——运行上下文,是 input 里最厚的部分:`source`(必填,见 `AgentRunSource`)、`runtimeSource`、`actor`、`lang`、`promptContext`、`systemRunContext`(`SystemRunContext` 投影)、`strategyContext`、`memoryCoordinator`、`contextWindow`、`trace`、`sharedState`、`fileCache`,以及并发协调用的 `childContexts`/`childInputFactories`/`coordination`。
  - `execution?: AgentRunExecutionOptions`(`:170`)——`timeoutMs`、`abortSignal`、`shouldAbort`、`budgetOverride`、`toolChoiceOverride`(`'auto'|'required'|'none'`)、`groundingEnforcement`(`'off'|'guard'`,AP-3 per-run grounding 覆盖,默认回退 runtime 全局 observe-only `'off'`,`:176`)、`diagnostics`、`onProgress`、`onToolCall` 回调。
  - `presentation?: AgentRunPresentationOptions`(`:185`)——`stream`、`responseShape`(`'agent-result'|'chat-reply'|'system-task-result'`)。

- **枚举/联合类型**:
  - `AgentRunSource`(`:123`):`'http-chat' | 'http-stream' | 'bootstrap' | 'system-workflow' | 'mcp' | 'internal'`——外部表面来源。
  - `AgentRuntimeSource`(`:131`):`'user' | 'system' | 'analyst' | 'producer' | 'remote'`——runtime 内部语义来源,与 source 解耦(转换见 `runtimeSourceFor`)。
  - `AgentRunStatus`(`:199`):`'success' | 'blocked' | 'aborted' | 'timeout' | 'error'`——统一状态分类。
  - `AgentActionSpace`(`:84`):三态 `{ mode:'none' } | { mode:'listed'; toolIds } | { mode:'all'; reason }`——工具动作空间。
  - `AgentServiceKind`(`:30`):`conversation`/`system-analysis`/`knowledge-production`/`translation`/`background-analysis`——profile 的服务类别。

- **编译产物 `CompiledAgentProfile`**(`:89`)。带 `kind: 'compiled-agent-profile'` 判别标签,是 `AgentProfileCompiler` 的输出、`AgentRuntimeBuilder` 的输入。除保留 `basePreset`/`skills`/`strategy`/`policies`/`persona`/`memory`/`actionSpace` 外,关键补充字段:`additionalTools`(从 actionSpace 展平)、`params`(合并后)、`projection`、`concurrency: AgentConcurrencyPlan`、`runtimeOverrides`(传给 `getPreset` 的覆盖 map)。

- **并发计划 `AgentConcurrencyPlan`**(`:51`):`mode: 'none'|'tiered'|'parallel'`、`concurrency`(数字或 `{env, default}`)、`partitioner`、`childProfile`、`merge`、`abortPolicy`。这是 fan-out 协调的声明式配置。

- **输出契约 `AgentRunResult`**(`:208`):`runId`、`profileId`、`reply`、`status`、`phases?`、`toolCalls`、`usage: AgentRunUsage`(`:201`,input/output tokens + iterations + durationMs)、`diagnostics`。

- **运行时桥接类型**:`AgentRuntimeRunOptions`(`:219`,`AgentService` 传给 `runtime.execute()` 的选项)、`AgentRuntimeBuildOptions`(`:236`,`lang`/`onProgress`/`onToolCall`)、以及鸭子类型接口 `AgentRuntimeLike`(`:244`,只要求 `id`、可选 `setFileCache`、`execute(message, opts)`)——`AgentService` 依赖这个最小接口而非具体 `AgentRuntime` 类,从而解耦、可测。

### AgentService:统一服务入口与 run 主流程

`src/agent/service/AgentService.ts` 是包的核心门面类。它持有三个私有依赖(`#` 私有字段):`#runtimeBuilder`(鸭子类型 `AgentRuntimeBuilderLike`,`AgentService.ts:20`)、`#profileCompiler`、`#runCoordinator`,以及 `@alembic/core/logging` 的单例 logger(`:37`)。构造时 compiler 与 coordinator 可选,缺省时用 `createDefaultProfileCompiler()`(`:257`,内部 new 一个带 `AgentProfileRegistry` + `AgentStageFactoryRegistry` 的 compiler)和 `new AgentRunCoordinator()`(`:42`)兜底。

#### run() 控制流(一次 run 的主链路)

`AgentService.run(input)`(`AgentService.ts:45`)是本章最核心的方法,按阶段:

1. **校验**:`validateRunInput(input)`(`:148`)——三条硬前置:`input.profile` 存在、`input.message.content` 非空、`input.context.source` 存在;任一缺失 `throw new Error`。
2. **编译 profile**:`this.#profileCompiler.compile(input.profile, { params, context })`(`:47`)得到 `compiledProfile`。同一 profile 声明在这里被解析为带 strategy 实例、policies、concurrency 计划的编译产物。
3. **构造 trace + 起始日志**:`describeRun(input, compiledProfile.id)`(`:264`)从 input 多处(params.dimId、metadata、promptContext、sharedState._dimensionMeta)提取 `dimension`/`sessionId`/`phase` 拼 trace,`formatRunTrace`(`:288`)格式化,`#logger.info('[AgentService] run start ...')`。冷启动监控依赖这些日志判断「维度 child run 是否已进入 runtime」(见 `:91` 的中文注释)。
4. **并发协调分支**(`:54`):若 `this.#runCoordinator.canCoordinate(compiledProfile)`(即 `profile.concurrency` 存在且 `mode !== 'none'`)为真,则进入协调路径:调 `this.#runCoordinator.run(input, compiledProfile, childInput => this.run(childInput))`。**关键设计:child runner 就是 `this.run` 本身**——fan-out 递归回到同一个 `run()` 入口,子任务复用全部校验/编译/构造逻辑。协调成功返回则直接 return `coordinated`(`:63`),失败在 catch 里 `#logger.warn` 后 `throw`(`:72`)。若 coordinator 返回 falsy(如 mode='none' 被 `run` 内部提前返回 null),则**继续落到下方单次执行路径**。
5. **构造 runtime**(`:81`):`this.#runtimeBuilder.build(compiledProfile, { lang, onProgress, onToolCall })`。若 `input.context.fileCache !== undefined`,调用 `runtime.setFileCache?.(...)`(`:87`,可选链,鸭子类型接口允许没有该方法)。
6. **构造 AgentMessage**:`buildAgentMessage(input)`(`:160`)。合并 `message.metadata.context` 与 `context.promptContext` 成 `promptContext`,new 一个 `AgentMessage`,`channel` 由 `toChannel(source)`(`:229`)映射(mcp→`Channel.MCP`,internal/system-workflow/bootstrap→`Channel.INTERNAL`,其余→`Channel.HTTP`),`sender.type` 按 role 判 system/user,`session.id` 回退链为 `message.sessionId → actor.sessionId → randomUUID()`。metadata 经 `stripProfileSelectionMetadata`(`:224`)剥离 `mode`/`preset`/`profile` 选择字段(避免把选择元数据泄漏进消息)。
7. **执行**(`:97`):`runtime.execute(message, buildRuntimeOptions(input))`。`buildRuntimeOptions`(`:187`)把 execution/context 里的字段整理成 `AgentRuntimeRunOptions`——透传 `abortSignal`、`diagnostics`、`strategyContext`、`systemRunContext`、`budgetOverride`、`toolChoiceOverride`、`groundingEnforcement`、`contextWindow`、`trace`、`memoryCoordinator`、`sharedState`;并计算 `projectedScopeId`(优先 `systemRunContext.scopeId`,回退 `sharedState._dimensionScopeId`,`:189`),注入到 `context.dimensionScopeId`;`source` 由 `context.runtimeSource || runtimeSourceFor(context.source)` 决定。
8. **成功收口**(`:98`):`inferRunStatus(result.reply)`(`:239`,有 reply → `success`,空 → `error`);记录 complete 日志(含 iterations、toolCallCount、`getDiagnosticsCancelReason`、`getDiagnosticsAiErrorCount`);组装并返回 `AgentRunResult`——`runId: runtime.id || randomUUID()`、`profileId`、`reply`、`status`、`phases`、`toolCalls`、`usage`(从 `result.tokenUsage`/`iterations`/`durationMs` 映射)、`diagnostics`。

#### 错误/回退/降级/取消/超时/部分结果路径

这是本章最需要讲清的健壮性设计:

- **执行异常兜底**(`:123`,catch `err: unknown`):不重新抛出,而是**降级返回一个结构完整的错误 `AgentRunResult`**——`reply` 为错误信息、`status` 由 `inferErrorStatus(err)` 分类、`toolCalls: []`、`usage` 全零、`diagnostics: null`。这保证宿主永远拿到规范化结果对象,不必处理裸异常(除并发路径外)。
- **错误分类 `inferErrorStatus(err)`**(`:243`):按错误消息正则分类——`/timeout/i` → `'timeout'`、`/abort/i` → `'aborted'`、`/forbidden|blocked|denied/i` → `'blocked'`、其余 `'error'`。这把底层各种异常归一到 `AgentRunStatus` 五态,便于上游按状态决策。
- **取消/超时**:`abortSignal`、`shouldAbort`、`timeoutMs` 由 input 透传到 runtime 与 coordinator;`AgentService` 层不主动实现超时定时器,而是把取消语义交给 runtime 执行与 coordinator 的 `shouldAbort` 检查(见下)。
- **并发路径的异常**是唯一会 rethrow 的地方(`:78`)——协调失败被认为是编排级错误,需要上抛。

#### AgentRunCoordinator:fan-out 协调与部分结果

`src/agent/coordination/AgentRunCoordinator.ts` 承载 `canCoordinate`/`run` 的具体实现。它在构造时注册两组 partitioner+merger(`AgentRunCoordinator.ts:26`):`bootstrapSessionDimensions`/`bootstrapSessionResults`(按维度切分冷启动会话)与 `projectContextModules`/`moduleMiningResults`(按 ProjectContext 模块切分挖掘)。`run()`(`:46`)流程:取 `concurrency.partitioner` 切出 `childInputs` → `runChildren` 并发/分层执行 → 用 `merge` 合并或 `defaultMerge`(`:290`)。要点:

- **两种并发模式**:非 `tiered` 时用 `createLimit(concurrency)`(共享并发闸)`Promise.all` 全量并发(`:87`);`tiered` 时按 `resolveTier`(`:266`,读 params.tier/metadata.tier)分组、逐层 `Promise.all`,每层结束触发 `onTierComplete` hook(`:108`)。
- **取消传播**:每层执行前 `shouldAbort(parentInput)`(`:158`,检查 `abortSignal.aborted` 或 `shouldAbort()`)为真则把剩余层全部转成 aborted child result(`createChildAbortedResult`,`:202`,status `'aborted'`)并 break——**产出部分结果**而非丢弃已完成部分。
- **child 级容错**:`runChildWithHooks`(`:118`)对单个 child 的 `runChild` 用 try/catch 包裹,异常转 `createChildErrorResult`(`:179`,status `'error'`,phases 带 error+dimId),不让一个 child 失败炸掉整批。
- **lazy child input**:`resolveLazyChildInput`(`:237`)允许通过 `context.childInputFactories[dimId]` 延迟构造子输入(冷启动时按维度懒装配 prompt/context)。
- **默认合并 `defaultMerge`**(`:290`):status 取「有 error → error,有 aborted → aborted,否则 success」;reply 用 `\n\n` 拼接;toolCalls 与 usage 各字段累加汇总。

### AgentRuntimeBuilder:把 profile + DI 装配成 AgentRuntime

`src/agent/service/AgentRuntimeBuilder.ts` 是 DI 装配器,把「宿主注入的容器/工具/AI」+「编译后的 profile」组合成一个可执行 `AgentRuntime`。

- **构造注入**(`AgentRuntimeBuilder.ts:44`):`container`(DI 容器)、`toolRegistry`(鸭子类型 `ToolRegistryLike`,`:16`,只要求可选 `getRouter()`)、`aiProvider`(`unknown`,松耦合)、可选 `memoryCoordinator`/`projectBriefing`/`projectRoot`(默认 `process.cwd()`)/`dataRoot`(默认 = projectRoot)/`toolRouter`。共享选项收进 `#sharedOpts`(`:37`)。
- **build()**(`:66`)流程:
  1. `normalizeProfile(profileRef)`(`:116`)——三态归一:若是 `CompiledAgentProfile`(`kind` 判别),取 `basePreset` + `runtimeOverrides`;若是 `AgentProfileRef`(`isProfileRef`,`:146`),取 `preset || id || 'chat'` 且无 overrides;否则是 `AgentProfileOverride`,取 `basePreset`,把 `skills` 映射成 `capabilities`、`actionSpace.mode==='listed'` 的 `toolIds` 映射成 `additionalTools`,其余 rest 并入 overrides。得到 `{ presetName, overrides }`。
  2. `getPreset(presetName, overrides)`(`presets.ts:437`)——查 `PRESETS` 表(`presets.ts:144`)、深合并 overrides,并 `resolveStrategy(strategyConfig)` 把声明式 strategy 解析成 `strategyInstance`。未知 preset 直接 throw(`presets.ts:439`)。
  3. **能力实例化**(`:72`):`preset.capabilities` 每个名字经 `CapabilityRegistry.create(name, opts)` 造出能力实例,`#getCapabilityOpts`(`:105`)注入 container/memoryCoordinator/projectBriefing/projectRoot(system_interaction 能力额外确保 projectRoot)。
  4. **策略解析 policies**(`:75`):`preset.policies` 支持「Policy 实例」或「`(overrides)=>Policy` 工厂函数」两种形态,是函数则用 overrides 调用得到实例。preset 里 policy 多为工厂(见 `presets.ts:153` chat 的 BudgetPolicy 工厂,读 `config.maxIterations` 等覆盖)。
  5. **new AgentRuntime**(`:84`):把 `presetName`、`aiProvider`、`toolRegistry`、`toolRouter`(优先显式注入,回退 `toolRegistry.getRouter?.()`,再回退 null,`:88`)、`container`、`capabilities`、`strategy: preset.strategyInstance`、`policies: new PolicyEngine(resolvedPolicies)`、`persona`、`memory`、回调 `onProgress`/`onToolCall`、`lang`、`additionalTools: resolveActionSpaceAdditionalTools(profileRef)`(`:134`)、`projectRoot`/`dataRoot` 全部灌进构造函数。返回 `AgentRuntime` 实例(其构造与 ReAct 循环由后续章节详述,类见 `src/agent/runtime/AgentRuntime.ts:138`)。

> 设计模式:典型 **Builder + DI**。Builder 持有跨 run 不变的宿主资源(container/tool/ai/root),每次 `build()` 只叠加 per-run 的 profile 与回调,产出一个 fresh runtime。`normalizeProfile` 用 **判别联合(discriminated union)** 折叠三种 profile 形态。工具路由用**三级回退**(显式 toolRouter → registry.getRouter() → null),tool registry 用**鸭子类型**兼容 `ToolRegistry` 与 `UnifiedToolCatalog`(`:15` 注释)。

### AgentProfileCompiler:profile 声明 → CompiledAgentProfile

`src/agent/profiles/AgentProfileCompiler.ts`(经 `AgentService` 调用)负责把三种 profile 输入编译成统一的 `CompiledAgentProfile`:

- `compile()`(`AgentProfileCompiler.ts:34`)判别:已是 compiled 直接返回(幂等,`isCompiledProfile` 查 `kind`);带 `basePreset` 走 `#compileOverride`(`:61`);否则 `#compileRef`(`:47`)。
- `#compileRef` 查 `AgentProfileRegistry.get(profileId)`:命中则 `#compileDefinition`(`:108`,解析 actionSpace/strategy/policies/concurrency),未命中回退 `#compilePresetRef`(`:93`,裸 preset,`serviceKindForPreset` 映射服务类别)。
- `compileStrategy`(`:150`)把 `AgentStrategyTemplate` 声明(`preset`/`single`/`pipeline`/`fanout`)解析成运行时 strategy 配置;pipeline 类型经 `stageFactoryRegistry.build(factory, ...)` 造 stages。
- `compilePolicyDeclarations`(`:181`)把 `{type:'budget'|'safety'}` 声明实例化为 `BudgetPolicy`/`SafetyPolicy`。
- 特例编排:`resolveActionSpace`(`:207`)对 `signal-analysis` + `mode:'auto'` 硬编码工具集;`resolvePolicyDeclarations`(`:214`)对 `evolution-audit` 按 recipes 数量动态算 `maxIterations`;`resolveConcurrencyPlan`(`:233`)允许 params.concurrency 覆盖计划并发度。

### SystemRunContextFactory:系统级运行上下文构造

`src/agent/service/SystemRunContextFactory.ts` 专为 **system/非交互** 场景(冷启动、扫描、挖掘)构造一次性的运行上下文。交互(HTTP chat)场景通常不需要它。

- 构造只注入 `aiProvider`(仅取 `model` 字段,`SystemRunContextFactory.ts:23`,`Pick<AiProvider,'model'>`),用于算 token 预算。
- `createContextWindow({ isSystem })`(`:29`):用 `aiProvider.model` 经 `ContextWindow.resolveTokenBudget(model, opts)` 求 token 预算,new 一个 `ContextWindow`。
- `createSystemContext(opts)`(`:35`,本类主方法):
  1. new 一个 `MemoryCoordinator({ mode: 'bootstrap' })`(`:41`);
  2. 以 `scopeId = 'scan:' + label` 调 `memoryCoordinator.createDimensionScope(scopeId)` 得 `activeContext`(`:43`)——为该次 run 开辟隔离的维度记忆域;
  3. `createSystemRunContext({...})`(`SystemRunContext.ts:70`)组装 `SystemRunContext`:注入 memoryCoordinator、scopeId、activeContext、contextWindow、`ExplorationTracker.resolve({source:'system', strategy:trackerStrategy}, budget)`(阶段状态机/探索追踪器)、`source:'system'`、`outputType:'candidate'`、`dimId:label`、`projectLanguage`、以及初始 `sharedState`(带去重集合 `submittedTitles`/`submittedPatterns`,`:57`);
  4. **投影** `projectSystemRunContext(systemRunContext)`(`SystemRunContext.ts:118`)返回给调用方。
- `project(ctx)`(`:66`):对已有 SystemRunContext 做同样投影,供复用。

**投影(projection)是关键设计**:`createSystemRunContext`(`SystemRunContext.ts:70`)做了不变量校验——若 `activeContext` 缺失则 throw(`:73`);`trace` 默认等于 `activeContext`,若不等且未 `allowDistinctActiveContext` 则 throw「trace 和 activeContext 必须同 scope」(`:78`)。`projectSystemRunContext`(`:118`)把 SystemRunContext **既平铺展开、又把自身塞进 `systemRunContext` 字段**(`:121`),使返回对象同时满足「扁平字段访问」和「嵌套完整对象访问」两种消费习惯;`expandSystemRunContext`(`:139`)是逆操作(从 input 里的 `systemRunContext` 重新展开合并 sharedState),供 runtime 侧复原。`AgentService.buildRuntimeOptions`(`AgentService.ts:189`)读的 `systemRunContext.scopeId` 正是这里投影出来的。

### 完整调用链:从宿主到 runtime 构造

把本章串成一条线(以 system 扫描为例,内部消费方 `runScanAgentTask`,`src/agent/runs/scan/ScanAgentRun.ts:31`):

1. **宿主 DI 装配**(主体 `Alembic/lib/injection/modules/AgentModule.ts`):容器把 `toolRegistry`、`toolRouter`、`aiProvider`、`projectRoot`/`dataRoot` 装进 `new AgentRuntimeBuilder({...})`;把 `SystemRunContextFactory`、`AgentProfileCompiler`、`AgentRunCoordinator` 一并造出;最后 `new AgentService({ runtimeBuilder, profileCompiler, runCoordinator })`。这些均为 `aiDependent: true` 单例。
2. **编排函数**:`runScanAgentTask({ agentService, systemRunContextFactory, ... })` 先 `systemRunContextFactory.createSystemContext(...)`(`ScanAgentRun.ts:52`)造 system 上下文,再 `agentService.run({ profile:{id:'scan-extract'|'scan-summarize'}, params, message:{role:'internal',...}, context:{ source:'system-workflow', runtimeSource:'system', fileCache, systemRunContext, strategyContext, promptContext }, presentation:{responseShape:'system-task-result'} })`(`:59`)。
3. **AgentService.run**:校验 → `profileCompiler.compile` → (无 concurrency 计划,不走协调) → `runtimeBuilder.build(compiledProfile)` → `setFileCache` → `buildAgentMessage` → `runtime.execute(message, runtimeOptions)` → 规范化为 `AgentRunResult`。
4. **投影回业务**:`projectScanRunResult({ result, fallback, ... })`(`ScanAgentRun.ts:79`)把通用 `AgentRunResult` 投影成扫描域的 `ScanKnowledgeProjection`。

而**冷启动/维度 fan-out** 场景则在第 3 步命中 `runCoordinator.canCoordinate` 分支:`AgentService.run` 递归调用自身作为 child runner,`AgentRunCoordinator` 按 `bootstrapSessionDimensions`/`projectContextModules` partitioner 切分维度/模块,并发或分层执行每个 child run(每个 child 又走一遍完整 build+execute),最后 merge 成父级 `AgentRunResult`。

### 值得记录的设计决策

- **单一入口 + 递归 child runner**:`AgentService.run` 既是外部入口也是并发子任务入口(`AgentService.ts:60` 传 `childInput => this.run(childInput)`),避免两套执行路径,保证子任务享有相同的校验/编译/降级语义。
- **鸭子类型解耦**:`AgentRuntimeBuilderLike`(`AgentService.ts:20`)、`AgentRuntimeLike`(`AgentRunContracts.ts:244`)、`ToolRegistryLike`(`AgentRuntimeBuilder.ts:16`)——服务层依赖最小接口而非具体类,利于测试注入 mock、兼容多种 registry/runtime 实现。
- **异常永不外泄(单次路径)**:`run()` 把执行异常降级成结构完整的错误结果(`AgentService.ts:130`),错误分类正则化(`inferErrorStatus`,`:243`),让宿主统一按 `AgentRunStatus` 决策;仅并发编排级错误例外上抛。
- **source 双层语义**:`AgentRunSource`(表面来源)与 `AgentRuntimeSource`(runtime 内部语义)解耦,`runtimeSourceFor`(`:214`)做映射(http-* → user,mcp/bootstrap/system-workflow → system),使表面与执行语义可独立演化。
- **metadata 卫生**:`stripProfileSelectionMetadata`(`:224`)把 profile 选择字段从消息 metadata 剥除,防止选择元数据污染下游 prompt/记忆。
- **可观测性**:每次 run 打三段日志(start/execute start/complete 或 failed),trace 含 profile/dim/session/phase,并从 diagnostics 抽 `cancelReason`/`aiErrorCount`——`AgentService.ts:91` 中文注释明确指出冷启动监控依赖 execute-start 日志区分「排队/请求中/失败待收口」。
- **投影双形态**:`projectSystemRunContext` 同时平铺+嵌套(`SystemRunContext.ts:118`),在扁平字段与完整对象两种消费方式间保持兼容,并带 scope 一致性不变量校验(`:78`)。
- **grounding 分层默认**:`groundingEnforcement` per-run 可覆盖,不设则回退 runtime 全局默认(observe-only `'off'`,契约见 `AgentRunContracts.ts:176`),体现 PCV observe-only 边界。


## S02 · AgentRuntime · ReAct 主循环内核 (src/agent/runtime 核心)

本章剖析 `@alembic/agent` 的执行心脏 —— `AgentRuntime`（`src/agent/runtime/AgentRuntime.ts`，2720 行）及其协作组件 `LoopContext`、`AgentState`、`ExitController`、`BudgetController`、`forcedSummary`、`AgentRuntimeTypes`、`AgentRuntimeResponsibility`、`SystemRunContext`。它实现了一个统一的 ReAct（Thought → Action → Observation）循环，是全部 Agent 能力（用户对话、bootstrap 冷启动、analyst 分析、scan 扫描、producer 提交）的唯一执行引擎。

### S02.1 职责定位与"ONE Runtime"设计哲学

`AgentRuntime` 的文件头注释（`src/agent/runtime/AgentRuntime.ts:1-29`）给出核心思想：**不存在类型分野，只有 ONE Runtime**，由 `Capability + Strategy + Policy` 三要素配置驱动。它同时是：

- **ReAct 循环的宿主**：实现 Thought → Action → Observation 骨架。
- **Capability 的组合容器**：决定加载哪些技能/工具白名单。
- **Policy 的执行者**：遵守预算、超时、质量约束。
- **Strategy 的被委托者**：Strategy 反过来调用 `runtime.reactLoop()`（控制反转）。

注释还锚定了它对齐的认知架构 CoALA（`AgentRuntime.ts:13-16`）：Perception→Working Memory→Reasoning→Action→Reflection 分别映射到 AgentMessage、history+memory、LLM call、Tools、`Policy.validateAfter`。

职责边界由 `AgentRuntimeResponsibility.ts` 用类型化 manifest 冻结固化（见 S02.9）。其中 `phase-state` seam 明确规定："The orchestration loop retains phase and transition ownership"（`AgentRuntimeResponsibility.ts:105-110`）—— 编排循环保留阶段与转移的所有权，而 budget / diagnostics / llm-input-assembly / tool-execution / memory-context 等横切能力都被拆到独立 helper，`behaviorChangeAllowed: false`（拆分不得改变行为）。

### S02.2 对外 API 与 exports

`AgentRuntime` 类的公共入口很小，绝大多数复杂度封装在私有方法（`#` 前缀）里：

- `constructor(config: RuntimeConfig)`（`AgentRuntime.ts:179`）—— 装配 provider、toolRegistry、toolRouter、capabilities、strategy、policies、hookSystem 等；强制要求 `toolRouter` 存在，缺失即 `throw`（`AgentRuntime.ts:191-195`）。
- `async execute(message, opts)`（`AgentRuntime.ts:251`）—— **Agent 顶层入口**，包裹 Policy 校验 + 超时保护 + Strategy 委托。
- `async reactLoop(prompt, opts)`（`AgentRuntime.ts:415`）—— **核心 ReAct 循环**，供 Strategy 调用（不是给外部直接调）。
- `abort(reason)`（`AgentRuntime.ts:1871`）、`setFileCache(files)`（`:1887`）、getter `hookSystem`/`projectRoot`/`dataRoot`/`fileCache`（`:1893-1910`）、`emitProgress(type, data)`（`:1913`）。
- 顶部 re-export 了 `AgentRuntimeTypes` 的全部类型（`AgentResult`、`AiError`、`LLMResult`、`ReactLoopOpts`、`RuntimeConfig`、`ToolCallEntry` 等）与常量 `MAX_TOOL_CALLS_PER_ITER`（`AgentRuntime.ts:90-114`），保持向后兼容。

**上游调用链**（谁调用 `AgentRuntime`）：

1. `AgentService.ts:97`：`runtime.execute(message, buildRuntimeOptions(input))` —— 服务层入口。
2. `execute()` 内 `this.strategy.execute(this, message, {...})`（`AgentRuntime.ts:316`）—— 委托给 Strategy。
3. Strategy 反调 `runtime.reactLoop(...)`：
   - `SingleStrategy.ts:14`：单次对话直调 `runtime.reactLoop(message.content, {...})`。
   - `PipelineStrategy.ts:939`：多阶段管线在 `#runWithTimeout` 里对每个 stage 调 `runtime.reactLoop(stagePrompt, {...})`，透传 `capabilityOverride`、`budgetOverride`、`systemPromptOverride`、`tracker`、`abortSignal` 等（`PipelineStrategy.ts:939-972`）。

### S02.3 execute() —— 顶层入口的六道关卡

`execute()`（`AgentRuntime.ts:251-380`）不跑循环，而是给 Strategy 套一层执行外壳。按顺序：

1. **重置 per-run 状态**：`startTime`、`iterationCount`、`toolCallHistory`、`tokenUsage` 归零（`:252-255`）。
2. **解析 grounding enforcement**（AP-3）：`opts.groundingEnforcement === 'guard' | 'off'` 覆盖，否则回落全局默认 `#groundingEnforcementDefault`（`:259-264`）。默认 `'off'` = PCV observe-only。因为 `PipelineStrategy` 不透传任意 opts 到 reactLoop，此值通过实例字段 `#groundingEnforcement` 桥接到 `#initLoop`（`:256-258` 注释）。
3. **Policy 前置校验** `validateBefore`（`:269`）—— 不通过直接返回 `⚠️ ${reason}` 的 `AgentResult`，附带 `policy_rejected` 诊断，**不进入循环**（退出路径 A）。
4. **超时保护**：从 `policies.getBudget().timeoutMs`（默认 300000ms）建 `AbortController` + `timeoutPromise`（`:288-312`）；同时桥接父级 `opts.abortSignal`（`:291-300`），父 abort 触发本地 abort。
5. **委托 Strategy 并 race**：`Promise.race([resultPromise, timeoutPromise])`（`:316-321`）—— 谁先完成用谁；超时则 `timeoutPromise` reject 抛 `Agent timeout after ${timeoutMs}ms`。
6. **Policy 后置校验** `validateAfter`（`:328`）—— 不通过只记 `qualityWarning` + 诊断，不改变回复内容；然后 `#safeTransition('finish')`、可选 `message.reply()`、填充 `state/durationMs/diagnostics`、发 `AGENT_COMPLETED` 事件（`:340-366`）。

`catch` 分支（`:367-379`）：`cleanupExecutionGuards()` 清定时器 → `state.send('error')` → 发 `AGENT_FAILED` → **重新抛出**（超时/异常向上传播）。

### S02.4 reactLoop() 主循环骨架

`reactLoop(prompt, opts)`（`AgentRuntime.ts:415-488`）是编排骨架，本身极薄，把每一轮拆成 5 个提取方法。核心是 `while (true)` 无限循环，每轮：

```
ctx.iteration++ / this.iterationCount++
ctx.trace?.startRound(iteration)          // ActiveContext 开轮（必须在 shouldExit 前，保证 endRound 配对）
hookSystem.emitSync('agent:iteration:before')
if (#shouldExit(ctx)) break               // ① 退出判定
{ toolChoice, toolSchemas, ... } = #prepareIteration(ctx)   // ② 迭代准备
llmResult = await #callLLM(...)            // ③ LLM 调用
if (!llmResult) break                      // ④ null = 退出
if (llmResult.type === CONTINUE) continue  // ⑤ 重试信号
ctx.trace.setThought/extractAndSetPlan     // 记录推理链
if (functionCalls.length > 0) {
  exitAfterTools = await #processToolCalls(...)  // ⑥ 工具分支
  if (exitAfterTools) break; else continue
}
if (#processTextResponse(...)) break        // ⑦ 纯文本分支
```

循环退出后统一走 `return this.#finalize(ctx)`（`:487`）。整个循环由 `#initLoop` 返回的 `LoopContext ctx` 贯穿。

#### 一轮迭代的控制流（文字流程图）

```
[iteration N 开始]
  │ trace.startRound(N)
  │ hook: agent:iteration:before
  ▼
[① #shouldExit]  ── ExitController.checkBeforeIteration ──▶ exit? ─── yes ──▶ break → #finalize
  │ no（Capability.onBeforeStep 前置钩子始终执行）
  ▼
[② #prepareIteration]
  │  · tracker.getNudge → 注入 Nudge
  │  · BudgetController.runCompactionCycle（L1-L3 压缩）
  │  · BudgetController.checkBeforeLLMCall（session 预检 → 可能二次压缩/标记 L4）
  │  · 计算 toolChoice（override / tracker / forceSummary）
  │  · 组装 dynamicContext（phase/progress/memory prompt，ephemeral 注入）
  ▼
[③ #callLLM]
  │  · executeL4IfPending（>90% 时 LLM 摘要压缩，可能 cancelled/hardStop → null）
  │  · abortSignal 已 abort → null
  │  · buildLlmInputAssembly + validateLlmInputSize（超 128k → null）
  │  · aiProvider.chatWithTools（唯一 LLM 出口）
  │     └─ catch → #handleAiError（熔断/2-strike → null；否则 CONTINUE）
  │  · 记 token / PCV / TurnTelemetry
  │  · 空响应重试判定（SUMMARIZE grace 2 轮 / system 2 次 → CONTINUE 或 null）
  │  · graceful-exit / toolChoice=none 却返工具调用 → 忽略（有文本→null，无→CONTINUE）
  ▼
llmResult == null ? ──▶ break → #finalize
llmResult.type == CONTINUE ? ──▶ continue（重走本轮）
  │ 否则 = 有效结果
  ▼
[trace.setThought / extractAndSetPlan]
  ▼
functionCalls.length > 0 ?
  ├─ 是 → [⑥ #processToolCalls] ──▶ exitAfterTools? ── yes → break；no → continue
  └─ 否 → [⑦ #processTextResponse] ──▶ true → break；false → continue
```

### S02.5 LoopContext —— 单次执行的完整状态载体

`LoopContext`（`src/agent/runtime/LoopContext.ts`）把原 reactLoop 内散落的 10+ 局部变量收拢成一个对象，使所有提取方法只需接收 `ctx` 单参数（`LoopContext.ts:1-11` 注释）。它承载三类字段：

- **注入依赖**（`LoopContext.ts:92-105`）：`messages: MessageAdapter`、`tracker: ExplorationTracker | null`、`trace: ActiveContext | null`、`memoryCoordinator`、`sharedState`。
- **循环状态**（`:107-123`）：`iteration`、`lastReply`（最终回复文本，退出路径统一往这里写）、`toolCalls[]`、`tokenUsage`、`loopStartTime`。
- **错误恢复**（`:125-131`）：`consecutiveAiErrors`（2-strike）、`consecutiveEmptyResponses`。
- **只读配置**（`:133-181`）：`source`、`budget`、`capabilities`、`baseSystemPrompt`、`toolSchemas`、`allowedToolIds`、`allowedToolActions`、`prompt`、`context`、`contextWindow`、`toolChoiceOverride`、`groundingEnforcement`、`abortSignal`、`diagnostics`。
- **决策组件**（`:183-190`）：`exitController`、`budgetController`、`pcvNodeEvidence`（PCVM N9 node-local evidence）。

关键计算属性：`get isSystem()` = `source === 'system'`（`:221`）；`get maxIterations()` = `budget.maxIterations || 20`（`:227`）。

辅助方法：`addTokenUsage(usage)` 累加到循环级统计（`:236-244`）；`buildResult()` 构造循环返回值 `{ reply, toolCalls, tokenUsage, iterations, pcvNodeEvidence, diagnostics }`（`:252-261`）。

### S02.6 #initLoop —— 循环初始化（约 140 行）

`#initLoop(prompt, opts)`（`AgentRuntime.ts:493-633`）封装了循环前的全部准备：

1. 解构 `opts`（`:494-512`）并 `DiagnosticsCollector.from(diagnostics)`。
2. **解析 capabilities**：`capabilityOverride` 存在时 `#resolveCapabilities`（名称→实例，空数组=显式无工具），否则用实例 `this.capabilities`（`:516-518`）。
3. **构建 baseSystemPrompt**：`systemPromptOverride`（Bootstrap 专用）或委托 `SystemPromptBuilder.build(caps, context)`（`:521`）。
4. **收集工具契约** `#collectToolContract`（`:524`）—— 见 S02.11 工具白名单；产出 `allowedToolIds` + `toolSchemas`（经 `#getToolSchemas` 走 catalog 的 lazy-loading mixed schemas）。
5. 创建 `MessageAdapter`（`:537`），加载 history + append 用户 prompt（`:540-547`）。
6. **预算**：`budgetOverride || policies.getBudget() || { maxIterations:20, maxTokens:4096, temperature:0.7 }`（`:550-555`）；system 源额外 `SystemPromptBuilder.injectBudget` 注入轮次预算（`:558-562`）。
7. **状态转移** `#safeTransition('start')` → `#safeTransition('plan_ready')`（`:565-566`），发 `AGENT_STARTED` 事件。
8. 构造 `LoopContext`（`:578-600`），随后装配两个决策组件：
   - `ctx.exitController = createExitController(ctx, this.policies)`（`:602`）。
   - `ctx.budgetController = new BudgetController({...})`（`:604-630`）—— 注入 `cumulativeUsage: this.tokenUsage`（**引用共享**，跨 pipeline stage 累加）、`contextWindow`、`tracker`、`l4MemoryPackageProvider`（惰性生成 L4 压缩输入包）。

### S02.7 状态机 AgentState / AgentPhase

`AgentState`（`src/agent/runtime/AgentState.ts`）是类型安全的声明式状态机，借鉴 LangGraph StateGraph + XState guard（`AgentState.ts:1-16`）。设计原则：不可变更新、可溯源（保留 history）、可序列化（`toJSON`/`fromJSON`）。

**AgentPhase 枚举**（`AgentState.ts:51-61`，`Object.freeze`）：`IDLE`、`PLANNING`、`EXECUTING`、`REFLECTING`、`WAITING_INPUT`、`HANDOFF`、`COMPLETED`、`FAILED`、`ABORTED`。

**默认转移图 DEFAULT_TRANSITIONS**（`AgentState.ts:66-80`）：

| from | event | to |
|------|-------|-----|
| IDLE | start | PLANNING |
| PLANNING | plan_ready | EXECUTING |
| EXECUTING | step_done | REFLECTING |
| REFLECTING | continue | EXECUTING |
| REFLECTING / EXECUTING | finish | COMPLETED |
| EXECUTING | need_input | WAITING_INPUT |
| WAITING_INPUT | input_received | EXECUTING |
| EXECUTING | handoff | HANDOFF |
| HANDOFF | handoff_done | EXECUTING |
| `*`（任意） | abort | ABORTED |
| `*`（任意） | error | FAILED |

`send(event, payload)`（`:145-181`）：查转移（精确优先，通配符兜底，`#findTransition` 于 `:227-235`）→ 检查 guard → 更新 `#phase`/`#data` → 执行 action 副作用 → 记 history → emit `'transition'` 与 `'phase:<to>'` 事件。找不到转移返回 `false`（不抛异常）。`isTerminal` = phase ∈ {COMPLETED, FAILED, ABORTED}（`:133-137`）。

**关键设计决策 —— `#safeTransition`**（`AgentRuntime.ts:1926-1932`）：因为 Pipeline/FanOut 场景下 `reactLoop()` 被多次调用，第 2 次起状态已不在 IDLE，直接 `send('start')` 的转移会失败。`#safeTransition` 用 `try/catch` 静默吞掉不合法转移，保证多阶段执行不中断。运行期实际调用序列：`start → plan_ready`（initLoop）、`step_done → continue`（每轮工具后）、`finish`（execute 收尾）、`abort`/`error`（异常路径）。

### S02.8 退出/终止路径全表（ExitController + 主循环内联）

`ExitController`（`src/agent/runtime/ExitController.ts`）的文件头声明它把**散落在 AgentRuntime 各处的 13 条退出路径合并为单一检查点**（`ExitController.ts:1-17`）。返回结构化 `ExitSignal`（`:39-48`）：`action ∈ {continue, exit, graceful_exit, retry}` + `reason`（`ExitReason` 联合类型，`:25-37`）+ `needsSummary` + `nudge` + `detail`。

**当前生产代码里，主循环只实际调用 `checkBeforeIteration`（P0-P3）**；`checkAfterLLM/checkAfterAiError/checkAfterToolCalls/checkAfterTextResponse/checkToolChoiceViolation` 是等价镜像方法（ExitController 已提供、AgentRuntime 逐步迁移中，注释 `:14` "向后兼容：AgentRuntime 可逐步迁移"），对应路径目前仍内联在 `#callLLM`/`#handleAiError`/`#processToolCalls`/`#processTextResponse` 里。

#### 退出路径逐条枚举（按真实触发点）

**A. execute() 层（不进循环）**
- **A0 Policy 前置拒绝**：`validateBefore` 不通过 → 返回 `⚠️ reason`（`AgentRuntime.ts:270-285`）。
- **A1 超时/异常抛出**：`timeoutPromise` 赢得 race 或 Strategy 抛错 → `catch` 重抛（`:367-379`）。

**B. #shouldExit → ExitController.checkBeforeIteration（每轮开头，`AgentRuntime.ts:639-708` + `ExitController.ts:105-175`）**
- **B0 abort_signal（P0 最高优先级）**：`abortSignal.aborted` → `exit`，记 `recordCancelReason('abort_signal')`（`ExitController.ts:110-117`；runtime 侧 `AgentRuntime.ts:647-653`）。
- **B1 tracker_exit（P1）**：`tracker.tick()` 后 `tracker.shouldExit()` → `exit, needsSummary:true`（`ExitController.ts:120-130`）。
- **B2 stage_timeout（P2）**：`elapsed > effectiveTimeoutMs` → `exit`，记 `recordTimedOutStage`（`:132-141`；runtime `:654-661`）。
- **B3 token_budget_exhausted / policy_stop（P3）**：`validateDuring` 不通过。若是 token 问题 + 首次 + tracker 未终结 → **graceful**：`#tokenGraceFired=true` + `tracker.forceTerminal()` + 返回 `continue`（给一轮 SUMMARIZE 机会，`ExitController.ts:156-164`）；否则 `exit, needsSummary:true`（`:166-172`）。
- **B4 legacy fallback**（无 ExitController，正常流不会走）：内联 abort/tracker/timeout/policy 检查（`AgentRuntime.ts:673-696`）。

**C. #callLLM 返回 null → break（`AgentRuntime.ts:850-1183`）**
- **C0 L4 压缩取消**：`l4Result.cancelled || abortSignal.aborted` → null，记 `l4_compaction_cancelled`（`:865-872`）。
- **C1 L4 压缩 hardStop**：session 已过硬停阈值仍压缩失败 → `markDegraded` + 写 `lastReply="[run stopped: ...]"` → null（`:873-885`）。
- **C2 abort 已触发（LLM 调用前）**：`abortSignal.aborted` → null（`:890-898`）。
- **C3 LLM 输入超限**：`validateLlmInputSize` 超 `DEFAULT_LLM_INPUT_TOKEN_LIMIT=128000`（或 budget 覆盖）→ null；非 system 写 `lastReply` 提示过长（`:968-987`、`:2438-2472`）。
- **C4 空响应耗尽**：`!text && !functionCalls`。SUMMARIZE 阶段 grace `phaseRounds < 2` → 睡 1500ms 返 `CONTINUE`（`:1122-1133`），耗尽 → null（`:1134-1138`）；system 源 `consecutiveEmptyResponses < 2` → `rollbackTick` + `CONTINUE`（`:1139-1149`），否则 null（`:1150`）。
- **C5 toolChoice 违反 + 有文本**：graceful-exit 或 `toolChoice==='none'` 却返工具调用，若有文本 → `lastReply = cleanFinalAnswer(text)` → null（`:1161-1178`）；无文本 → `CONTINUE`（`:1179`）。

**D. #handleAiError（LLM 抛错，`AgentRuntime.ts:1189-1238`）**
- **D0 abort 中止**：`abortSignal.aborted` → null（不计入错误计数，`:1192-1203`）。
- **D1 熔断器 CIRCUIT_OPEN**：`aiErr.code==='CIRCUIT_OPEN'` → 非 system 写道歉 `lastReply` → null（`:1214-1222`）。
- **D2 2-strike**：`consecutiveAiErrors >= 2` → `messages.resetToPromptOnly()` + 道歉 → null（`:1225-1234`）。
- **D3 单次错误**：睡 2000ms → `CONTINUE`（`:1236-1237`）。

**E. #processToolCalls 返回 true → break（`AgentRuntime.ts:1246-1598`）**
- **E0 abort（工具执行前）**：循环内 `abortSignal.aborted` → return true（`:1304-1309`）。
- **E1 iteration_exhausted（非 tracker）**：`!tracker && iteration >= maxIterations` → 触发强制摘要（`:1563-1594`）。此处先查 `#getForcedSummarySuppression`（见 S02.10）：若命中抑制（abort/stage_timeout/degraded_no_findings/budget_exhausted/record_repair_incomplete）则写 `[run stopped: code]` 抑制回复并 return true（`:1564-1572`）；否则真的调 `aiProvider.chatWithTools(toolChoice:'none')` 生成摘要写 `lastReply` → return true（`:1574-1593`）。
- 其余情况 `#safeTransition('continue')` → return false（继续循环，`:1596-1597`）。

**F. #processTextResponse 返回 true → break（`AgentRuntime.ts:1605-1739`）**
- **F0 tracker 模式 · isFinalAnswer**：`tracker.onTextResponse().isFinalAnswer` → `lastReply = cleanFinalAnswer` → true（`:1678-1685`）。
- **F1 tracker 模式 · metrics 转终结阶段**：若 `endRound` 的 metrics 刚推进到 SUMMARIZE/FINALIZE 且 isFinalAnswer，analyst 管线注入 digest nudge → return false（多给一轮出完整总结，`:1656-1676`）。
- **F2 grounding gate 阻断**（仅 `groundingEnforcement==='guard'`）：`evaluateAnalyzeTextGroundingGate().block` → 注入 nudge + `rollbackTick` → return false（`:1611-1639`）。
- **F3 needsDigestNudge / shouldContinue**：注入对应 nudge → return false（`:1687-1732`）。
- **F4 非 tracker 模式**：纯文本即最终答案 → `lastReply = cleanFinalAnswer` → true（`:1735-1738`）。

**G. #finalize（循环退出后，`AgentRuntime.ts:1801-1866`）** —— 见 S02.10。所有退出路径最终都汇入这里，保证 `lastReply` 非空。

### S02.9 #callLLM 深挖 —— provider 出口、错误恢复、空响应重试

`#callLLM`（`AgentRuntime.ts:850-1183`）是循环中唯一与 LLM 交互的地方，逻辑密度最高：

1. **L4 pending 处理**（`:859-886`）：若 BudgetController 标记了 `pendingL4`，先执行 LLM-based 摘要压缩（见 S02.12），压缩取消/hardStop 直接返回 null。
2. **abort 前置检查**（`:890-898`）。
3. **provider tool-schema 策略**（`:904-935`）：`toolChoice==='none'` 时是否保留 tool schemas 取决于供应商 —— DeepSeek V4 / Gemini 会因看到 schema 而启用 thinking mode 或返回空，故对它们移除 schemas（`isToolSchemaHarmful`，`:910-911`）；其他 provider 保留以维持 prefix cache 命中。`resolveProviderToolChoice`（ProviderToolChoicePolicy）决定 DeepSeek V4 grounding 模式。
4. **输入组装 + 度量 + 校验**（`:937-987`）：`buildLlmInputAssembly` 分离静态 system prompt（最大化 prefix cache）与 ephemeral `dynamicContext`；`measureLlmInputAssembly` + `validateLlmInputSize` 超限返 null。
5. **唯一 LLM 出口**（`:1037-1045`）：`this.aiProvider.chatWithTools(...)`。注释"方案①"（`:1035-1036`）强调 provider 内部已委托 LLMGateway + Transport，runtime 不再保留 gateway/provider 双分支 —— 熔断、重试、限流等横切能力全由 provider 背后的 gateway 承担。成功后 `consecutiveAiErrors = 0`。
6. **catch → #handleAiError**（`:1047-1056`）—— 见退出路径 D。
7. **记账**（`:1058-1113`）：`budgetCtrl.recordLLMUsage` + `ctx.addTokenUsage` + PCV output + system 场景 `emitTurnTelemetry` + `llm.output` process event。
8. **空响应重试**（`:1116-1154`）—— 退出路径 C4；关键注释 B4 fix（`:1118-1120`）：SUMMARIZE 阶段也允许 2 轮 grace，与 ExplorationTracker 对齐，重试次数由 `tracker.phaseRounds` 控制而非独立计数。
9. **graceful-exit 工具调用保护**（`:1156-1180`）—— 退出路径 C5；注释指出部分 LLM（DeepSeek）在 toolChoice=none 时仍返工具调用需忽略，但 analyst RECORD 阶段的 note_finding-only 补记录窗口不能丢弃。

`#handleAiError` 的 2-strike 策略（`:1225-1234`）在第 2 次连续错误时会 `messages.resetToPromptOnly()`（清空累积上下文，避免坏上下文继续污染），再退出走摘要兜底。

### S02.10 强制摘要与 #finalize —— 保证永远有回复

**`#finalize`**（`AgentRuntime.ts:1801-1866`）是所有退出路径的汇流点，职责是确保 `lastReply` 非空：

1. **scan 管线短路**（`:1804-1809`）：`tracker.pipelineType === 'scan'` 时结果都在 `toolCalls`（knowledge.submit）里，无需文本回复，直接写 `[scan complete: N recipes collected]`，**省一次 LLM 调用**。
2. **摘要抑制检查** `#getForcedSummarySuppression`（`:1814-1820`，实现于 `:1741-1794`）：按优先级检测 abort_signal / stage_timeout / degraded_no_findings / degraded_budget_exhausted / record_repair_incomplete。命中则写 `[run stopped: code] message`（`#buildSuppressedSummaryReply`，`:1796-1798`）而**不浪费 LLM 调用**去粉饰一个已经降级/中止的运行。
3. **强制摘要** `produceForcedSummary`（`:1821-1844`）：有工具调用 / tracker / system 源时调用。
4. **兜底文案**（`:1845-1856`）：既无工具调用也无文本 → `抱歉，AI 未能生成有效回复...` + `markFallbackUsed`。

**`forcedSummary.ts`** 的 `produceForcedSummary`（`forcedSummary.ts:81-309`）根据 `source + tracker.pipelineType` 分三种模式（`forcedSummary.ts:6-11`）：

- **system + analyst**：输出 Markdown 分析报告，供 Quality Gate 评估；核心「已确认」章节只能来自 note_finding（`:118-133`）。
- **system + bootstrap**：输出 `dimensionDigest` JSON（含 summary/candidateCount/keyFindings/gaps/remainingTasks），供维度编排消费（`:134-154`）。
- **user**：输出人类可读 Markdown 结构化总结（`:155-173`）。

三种模式都用**空 messages**调 `chatWithTools`（`:176-182`，注释"避免累积上下文导致 400"），并各有 catch 兜底 —— AI 失败时从 `toolCalls` 记录合成报告（文件列表/搜索词/类名/工具名，`:195-299`），最后再保底一句非空文案（`:301-305`）。关键区分：system 非 analyst 源的 dimensionDigest JSON **不能被 `cleanFinalAnswer` 剥掉**（`:189-194`）。

### S02.11 BudgetController —— 预算模型（token/轮数/时间）

`BudgetController`（`src/agent/runtime/BudgetController.ts`）从 AgentRuntime 抽离，职责五项（`BudgetController.ts:4-10`）：session token 预检、压缩触发、token 追踪、工具预算分摊、TurnTelemetry。**生命周期**：每次 reactLoop 创建一个，`cumulativeUsage` 用 `AgentRuntime.tokenUsage` 引用 → 跨 stage 共享累加（`:11-12`、`:36-40`）。

**预算三维度**：

- **轮数**：由 `LoopContext.maxIterations`（budget.maxIterations || 20）驱动。非 tracker 模式在 `#processToolCalls` 里 `iteration >= maxIterations` 触发强制摘要（退出 E1）；tracker 模式由 ExplorationTracker 自管。`forceSummaryAt = max(2, ceil(maxIterations*0.8))`（`AgentRuntime.ts:760`）—— 到 80% 轮数后 toolChoice 强制 `'none'`。
- **时间**：`budget.timeoutMs`（stage 级）经 `ExitController.effectiveTimeoutMs` 检查（B2）；`execute()` 层另有 `policies.getBudget().timeoutMs`（默认 300000ms）的硬超时 race。
- **token（session 级）**：`maxSessionInputTokens`（0 = no-op）。`checkBeforeLLMCall`（`BudgetController.ts:189-248`）估算下一轮 input token → 计算 projected ratio → 分级动作：

| ratio | 常量 | 动作 |
|-------|------|------|
| ≤ 0.75 | `COMPRESS_THRESHOLD` | normal，不压缩 |
| > 0.75 | | 触发 `#runExtraCompaction`（L1-L3） |
| > 0.90 | `AGGRESSIVE_COMPRESS_THRESHOLD` | 额外标记 L4 pending（LLM 摘要压缩） |

**关键设计决策**（`:227-228` 注释）：session budget **只做压缩触发，不做终止决策**；终止由 maxIterations / timeout / ExitController 负责。这避免了 token 预算与其它退出条件的职责重叠。

**L4 硬停阈值**：`L4_HARD_STOP_RATIO=1.3`、`L4_REPEAT_FAILURE_HARD_STOP_RATIO=1.0`（`:111-112`）。`executeL4IfPending`（`:283-370`）在 L4 压缩失败且 session 压力 ≥ 1.3（或连续 2 次失败且 ≥ 1.0）时返回 `hardStop:true` → 主循环 C1 退出。**默认关闭**：`#enableL4Compaction` 缺省取 `process.env.ALEMBIC_AGENT_ENABLE_L4_COMPACTION === '1'`（`:158-159`），即临时止血开关（`:53` 注释"L4 仍保留实现，但默认不在运行中自动触发"）。

**工具预算分摊** `getToolBudget(parallelCount)`（`:415-438`）：并行工具共享 `roundMaxChars = baseQuota.maxChars × ceil(parallelCount/2)`，`perToolMaxChars = max(400, roundMaxChars/parallelCount)`；`recordToolCharsUsed` / `getRemainingToolBudget` 做逐工具扣减。

**TurnTelemetry** `emitTurnTelemetry`（`:459-492`，仅 system 场景）：打印每轮 in/out/reasoning/cache/compact/session 结构化日志；连续 3 轮 0 cache-hit 时警告"检查 system prompt 是否被修改"（prefix cache 失效诊断，`:482-491`）。

### S02.12 上下文压缩三级递进（L1-L4）

压缩由 BudgetController 触发但实际工作委托 `ContextWindow`（`memory-context` seam）：

- **L1-L3（确定性压缩）**：`runCompactionCycle` → `contextWindow.compactIfNeeded()`（`:258-265`），在 `#prepareIteration` 每轮调用；session 压力下 `#runExtraCompaction` 再压一次（`:531-547`）。`compactResult.level` 表示压缩层级。
- **L4（LLM 摘要压缩）**：>90% 或 `contextWindow.needsL4Compaction()` 时 `#requestL4IfReady` 标记 `pendingL4`；`#callLLM` 开头 `executeL4IfPending` 用 `aiProvider` 对历史做 LLM 摘要（`:283-370`），token 消耗回写 `cumulativeUsage`。有 cooldown（`#l4RetryCooldownChecks`）与失败计数（`#l4FailureCount`）防抖。L4 输入包由 `l4MemoryPackageProvider`（`AgentRuntime.ts:616-629`）惰性生成，含 goal/phase/stageStatus/activeContext/recentMessages/toolCalls。

### S02.13 工具调用处理 #processToolCalls

`#processToolCalls`（`AgentRuntime.ts:1246-1598`）实现 Action + Observe：

1. **数量上限** `MAX_TOOL_CALLS_PER_ITER=8`（`AgentRuntimeTypes.ts:275`）：超出部分 `truncatedCalls` 被截断，记 `recordTruncatedToolCalls` + 追加 nudge 告知 Agent 分批重试（`:1252-1260`、`:1492-1500`）。
2. 追加 assistant 消息（含 DeepSeek V4 `reasoningContent` 透传，`:1284-1288`）。
3. **逐工具执行** `this.#toolPipeline.execute(fc, {runtime, loopCtx, iteration})`（`:1352-1356`）—— 走 `ToolExecutionPipeline`（`createToolPipeline()`，`AgentRuntime.ts:217`）的 11 段中间件链：`allowlistGate → toolArgumentBoundsGate → evolutionDecisionGate → recordRepairOnlyGate → analystVerifyOnlyGate → producerSubmitOnlyGate → deterministicDuplicateGuard → observationRecord → trackerSignal → traceRecord → submitDedup`（`ToolExecutionPipeline.ts:1132-1145`）。执行前检查 abort（退出 E0）。
4. 每工具发 `tool_call`/`tool_end` 进度事件、`TOOL_CALL_START`/`END` 总线事件、`tool:execute:before/after` hook；结果经 `limitToolResult` 按 BudgetController 配额裁剪后 `appendToolResult`（`:1398-1478`）。
5. **PCV 证据记账**：`recordPcvToolResult` / `recordPcvToolRoundOutcome`（`:1387`、`:1481-1490`）。
6. **阶段转换**：`tracker.endRound({hasNewInfo, submitCount, toolNames})` 返回 transition nudge 并注入（`:1508-1535`）；`trace.setRoundSummary` + `endRound` 关闭 ActiveContext 轮次（`:1538-1547`）。
7. Capability 后置钩子 `onAfterStep` + `#safeTransition('step_done')`（`:1550-1560`）。
8. 非 tracker 且轮数耗尽 → 强制摘要（退出 E1）；否则 `#safeTransition('continue')` return false。

### S02.14 SystemRunContext —— system 场景的上下文契约

`SystemRunContext`（`src/agent/runtime/SystemRunContext.ts`）是 system 管线（bootstrap/analyst/scan/producer）向 reactLoop 传递运行上下文的结构化契约，防止散字段漂移。`SystemRunContext` 接口（`:23-39`）聚合 `scopeId`、`contextWindow`、`tracker`、`trace`/`activeContext`、`memoryCoordinator`、`sharedState`（含 `_dimensionMeta`/`_dimensionScopeId`）、`source`、`pipelineType` 等。

工厂 `createSystemRunContext`（`:70-107`）强校验：必须能拿到 `ActiveContext`（否则抛错，`:73-75`）；`trace` 与 `activeContext` 默认必须同 scope，除非 `allowDistinctActiveContext`（`:77-80`）。`projectSystemRunContext`（`:118-137`）把 context 打平投影（同时保留 `systemRunContext` 自引用），`expandSystemRunContext`（`:139-155`）做反向展开合并 —— 这对 pipeline 阶段间序列化传递很关键。这些字段最终喂给 `reactLoop` 的 `opts.context`/`opts.sharedState`，在 AgentRuntime 内被 `describeLoopCall`/`buildAgentProcessEvent` 用于 dimension/target/phase 归因（`AgentRuntime.ts:2178-2211`、`:2602-2616`）。

### S02.15 AgentRuntimeTypes —— 类型词汇表

`AgentRuntimeTypes.ts` 是 runtime、ToolExecutionPipeline 与测试共享的类型定义。要点：

- `RuntimeConfig`（`:207-229`）—— constructor 入参：`aiProvider`/`toolRegistry`/`toolRouter`/`strategy` 必填，`capabilities`/`policies`/`persona`/`memory`/`groundingEnforcement` 可选。
- `ReactLoopOpts`（`:251-272`）—— reactLoop 全部可选注入参数（history/context/capabilityOverride/budgetOverride/systemPromptOverride/tracker/trace/memoryCoordinator/sharedState/source/toolChoiceOverride/groundingEnforcement/abortSignal）。
- `LLMResult`（`:31-46`）—— provider 返回：`text`/`functionCalls`/`usage`/`reasoningContent`（DeepSeek V4 透传）/`finishReason`。
- `AgentResult`（`:238-249`）—— execute 最终返回：`reply`/`toolCalls`/`tokenUsage`/`iterations`/`durationMs`/`diagnostics`/`state`/`qualityWarning`。
- `GroundingEnforcement = 'off' | 'guard'`（`:205`）—— AP-3 开关；`'off'` = PCV observe-only（不注入 grounding 政策文本、不阻断 analyze 文本轮），`'guard'` = 恢复 CP1 注入 + CP4 阻断。
- `AgentProgressProcessEvent`（`:82-97`）—— developer-safe 过程事件，hosts 映射到 Core JobProcessEvent；带 `sourceClass`（含 `secret`/`hidden-reasoning`）/`displayPolicy`/`retention` 分级，配合 `redactDeveloperText`（`AgentRuntime.ts:2687-2696`）脱敏 API key/token。
- `MAX_TOOL_CALLS_PER_ITER = 8`（`:275`）。

### S02.16 AgentRuntimeResponsibility —— 冻结的职责边界 manifest

`AgentRuntimeResponsibility.ts` 用类型化冻结对象 `ALEMBIC_AGENT_RUNTIME_RESPONSIBILITY`（`:186-204`）声明架构契约，是本仓库"Agent 边界不被空壳化"规则的可执行落点：

- **decompositionSeams**（`:53-111`）：7 个拆分缝，每个标 `owner` + `implementationRefs` + `behaviorChangeAllowed: false`。明确 event-bus/diagnostics/budget/llm-input-assembly/memory-context 归 helper 或 boundary，仅 `phase-state` 归 `agent-runtime`（编排循环保留阶段所有权）。
- **semanticGlossary**（`:113-145`）：agent/tool/session/memory 四术语的 owner + definition + **nonGoals**（如 agent 的 nonGoals 是 "Core deterministic repository / Codex host route / Dashboard UI"）。
- **featureFlags**（`:147-184`）：`ALEMBIC_AI_PROVIDER`/`ALEMBIC_AI_MODEL`/`ALEMBIC_AI_MAX_CONCURRENCY`/`ALEMBIC_EMBED_PROVIDER`/`ALEMBIC_DEEPSEEK_REASONING_EFFORT` 的默认值与 production 相关性。
- **modelRegistryBoundary / apiResponseBoundary**（`:191-203`）：ModelRegistry 访问必须在 AI gateway/context budget 边界后；宽松 ApiResponse 类型是 transport-private，禁止泄漏进 runtime 契约。

此文件不参与运行期控制流，是**边界守护/文档化**资产 —— 与 CLAUDE.md 的仓库定位规则呼应，防止 tool-system 越权访问 ModelRegistry、或把 provider 私有类型渗入 runtime。

### S02.17 关键设计模式与配置开关小结

- **控制反转（IoC）**：Strategy 不被 runtime 调用步骤，而是 Strategy 调 `runtime.reactLoop()`（`AgentRuntime.ts:11`）。
- **策略模式**：SingleStrategy（单轮）vs PipelineStrategy（多阶段 + per-stage 硬超时）。
- **中间件管道**：工具执行走 11 段 ToolExecutionPipeline。
- **状态机**：AgentState 声明式转移 + guard + `#safeTransition` 容错。
- **可选注入退化**：reactLoop 所有引擎能力（contextWindow/tracker/trace/memoryCoordinator）均可选，不提供时退化为裸循环（`AgentRuntime.ts:395`）。
- **prefix cache 优化**：system prompt 保持静态，动态内容分离为 ephemeral user message（`:773-776`）。
- **环境变量/开关**：`ALEMBIC_MCP_MODE`（=1 时抑制 stderr nudge 打印，`:738`）、`ALEMBIC_AGENT_ENABLE_L4_COMPACTION`（=1 开 L4）、`groundingEnforcement`（off/guard）、per-stage `budgetOverride`/`systemPromptOverride`/`toolChoiceOverride`/`capabilityOverride`。
- **降级/兜底可观测**：每条 fallback/abort/timeout/circuit/2-strike 路径都配 `logger.warn` + `diagnostics.warn/recordCancelReason/markDegraded`，符合 CLAUDE.md"运行时分叉必须打印明确日志"要求。

### S02.18 跨子系统依赖

- **上游**：`AgentService`（`service/AgentService.ts:97`）→ `execute` → `strategy.execute`（`strategies/SingleStrategy.ts`、`strategies/PipelineStrategy.ts`）→ `reactLoop`。
- **下游/协作**：`SystemPromptBuilder`（prompt 装配）、`MessageAdapter`/`ContextWindow`（消息与压缩，见 memory/context 章）、`ExplorationTracker`（阶段状态机 + nudge，见 context 章）、`ActiveContext`/`MemoryCoordinator`（trace 与记忆，见 memory 章）、`ToolExecutionPipeline`/`ToolRouter`/`UnifiedToolCatalog`（工具执行，见 tools 章）、`AiProvider.chatWithTools`（唯一 LLM 出口，背后是 LLMGateway，见 ai 章）、`PolicyEngine`（预算/质量约束，见 policies 章）、`DiagnosticsCollector`/`AgentEventBus`/`HookSystem`（可观测性）、`PcvNodeEvidence`（PCVM 证据）。
- **@alembic/core 契约**：仅 `@alembic/core/logging`（`AgentRuntime.ts:32`、`forcedSummary.ts:15`）—— runtime 内核对 Core 的耦合极薄，符合"Agent 只保留 AI/tool/host adapter、orchestration"的仓库边界。


## S03 · Runtime I/O · 工具执行管线 · LLM 输入装配 · 消息/钩子/事件/诊断 (src/agent/runtime 外围)

本章剖析 `AgentRuntime` 主循环外围的一圈"横切"运行时组件。它们不是 ReAct 循环的心脏(心脏在 `AgentRuntime.ts` 的 `#runLoop` / `#callLLM` / `#processToolCalls`),而是被主循环编排调用的可替换协作者:把 LLM 产出的 tool call 归一化执行(`ToolExecutionPipeline`)、把喂给模型的输入装配并计量(`LLMInputAssembly` / `LLMInputMeasurement`)、统一消息模型与压缩(`MessageAdapter` / `AgentMessage`)、提供钩子与事件可观测面(`HookSystem` / `AgentEventBus`)、累积诊断(`DiagnosticsCollector`)、构造 system prompt(`SystemPromptBuilder`),并用两份冻结 manifest 声明对外契约(`AgentInterfaceContract` / `AgentRuntimeBoundary`)。

统一入口锚点(它们在 `AgentRuntime` 里的装配点):
- `AgentRuntime.ts:207` `this.bus = AgentEventBus.getInstance()`
- `AgentRuntime.ts:217` `this.#toolPipeline = createToolPipeline()`
- `AgentRuntime.ts:218-219` `this.#hookSystem = ... new HookSystem()` + `registerDefaultHooks(...)`
- `AgentRuntime.ts:220` `this.#promptBuilder = new SystemPromptBuilder(...)`
- `AgentRuntime.ts:537` `const messages = createMessageAdapter(contextWindow)`
- `AgentRuntime.ts:949-967` `buildLlmInputAssembly(...)` + `measureLlmInputAssembly(...)`
- `AgentRuntime.ts:1352` `await this.#toolPipeline.execute(fc, { runtime, loopCtx, iteration })`

---

### S03.1 ToolExecutionPipeline — 工具执行中间件管线

文件:`src/agent/runtime/ToolExecutionPipeline.ts`(1145 行)。

#### 职责定位

把原本散落在 reactLoop 内 ~120 行的工具执行逻辑,拆成一条 `before → execute → after` 的中间件链。每个中间件承担一个横切关注点:白名单守卫、参数体积守卫、阶段级动作守卫、确定性去重、记忆观察、探索信号、推理链记录、提交登记。核心执行只有一步——调用 `runtime.toolRouter.execute()`,即 V2 工具路由(见 S03.11 的 `tool-v2` 边界)。文件头注释(`ToolExecutionPipeline.ts:1-18`)明确列出 8 个中间件的意图。

#### 对外 API / exports

- `class ToolExecutionPipeline`(`ToolExecutionPipeline.ts:483`):`use(middleware)` 注册、`execute(call, context)` 执行单个工具调用。
- 预置中间件常量(全部 export):`allowlistGate`(:537)、`toolArgumentBoundsGate`(:574)、`evolutionDecisionGate`(:626)、`recordRepairOnlyGate`(:683)、`analystVerifyOnlyGate`(:714)、`producerSubmitOnlyGate`(:764)、`deterministicDuplicateGuard`(:817)、`observationRecord`(:864)、`trackerSignal`(:882)、`traceRecord`(:897)、`submitDedup`(:912)、`progressEmitter`(:1058,默认不装配)、`eventBusPublisher`(:1080,默认不装配)。
- 工厂 `createToolPipeline()`(`ToolExecutionPipeline.ts:1132`):按固定顺序装配默认 11 个中间件。

#### 关键类型与数据结构

- `ToolCall { name, args, id }`(:32):模型产出的工具调用描述。
- `ToolExecContext { runtime: AgentRuntime, loopCtx: LoopContext, iteration }`(:39):执行上下文。
- `ToolMetadata`(:46):贯穿一次执行的可变元数据 —— `cacheHit / blocked / isNew / durationMs / dedupMessage / isSubmit / envelope / duplicateShortCircuit / cacheEligible / cacheMiss / cacheKey`。它是中间件之间传递副作用/信号的唯一通道。
- `BeforeVerdict { blocked?, result? }`(:61):`before` 钩子返回值,用于短路。
- `ToolMiddleware { name, before?, after? }`(:103):中间件接口。`before` 可返回 `BeforeVerdict` 短路;`after` 只能观察。
- `CachedToolResult { result, envelope? }`(:118)、`ToolEfficiencySharedState`(:128,挂在 `loopCtx.sharedState` 的 `_toolEfficiencyCache` 等私有键上)、`ProducerSubmitLedger` / `ProducerSubmitLedgerEntry`(:137-151,producer 提交台账)。

#### 控制流(execute 的三段式)

`ToolExecutionPipeline.execute`(:504)的算法:
1. 初始化空 `metadata`。
2. `runBeforeMiddlewares`(:332)依次跑每个 `before`:
   - 若返回 `verdict.blocked`,置 `metadata.blocked = true`,调用 `loopCtx.diagnostics.recordBlockedTool(...)`,**短路返回** blocked 结果。
   - 若返回 `verdict.result !== undefined`(命中缓存),置 `metadata.cacheHit = true`,短路返回该结果。
   - 否则继续下一个。
3. 若 before 没短路(`hasResult === false`),调 `executeRuntimeToolCall`(:357)真执行。
4. `runAfterMiddlewares`(:469)依次跑每个 `after`(纯观察,不短路)。
5. 无条件调用 `loopCtx.diagnostics.recordEfficiencyToolCall({ cacheHit, cacheMiss, duplicateShortCircuit })`(:514)。
6. 返回 `{ result, metadata }`。

真实执行 `executeRuntimeToolCall`(:357)的要点:
- `t0 = Date.now()`,`try` 里 `await runtime.toolRouter.execute(buildRuntimeToolCallRequest(...))` 得到 `ToolResultEnvelope`,`recordExecutedEnvelope` 记录信封,再 `projectPipelineToolResult(envelope)` 投影出结果。
- `catch (err: unknown)` 归一化为 `{ error: err.message }`(错误路径:抛错→结构化 error 对象,不外泄堆栈)。
- `finally` 里 `metadata.durationMs = Date.now() - t0`(即使异常也记录耗时)。

`buildRuntimeToolCallRequest`(:376)组装 `ToolCallRequest`(来自 `#tools/kernel`):`surface: 'runtime'`、`actor: { role: 'developer', user: runtime.id }`、`abortSignal`、并把一大坨 runtime 上下文(`policyValidator`、`diagnostics`、`fileCache`、`aiProvider`、`sharedState`、`memoryCoordinator`、`submittedTitles/Patterns/Triggers`、`sessionToolCalls`、`dimensionScopeId`、`currentRound` 等)注入到 `runtime` 字段供工具处理器消费。

结果投影 `projectPipelineToolResult`(:73):优先返回 `envelope.structuredContent`,否则 `projectToolResultOrdinaryOutput(envelope)`(来自 `#tools/kernel`,即"普通输出投影",对应 D2.3 普通输出策略,剥离诊断/禁止字段)。

`recordExecutedEnvelope`(:452)从信封回填 metadata:`cacheHit = envelope.cache?.hit === true`;若 `cache.policy !== 'none'` 且未命中则 `cacheMiss = true`;若 `!envelope.ok` 且状态 ∈ `BLOCKING_ENVELOPE_STATUSES`(`blocked / needs-confirmation / aborted / timeout`,:192)则置 `blocked` 并记录 blockedTool。

#### note_finding 归一化(设计要点)

`toExecutableToolCall`(:84):裸 `note_finding` 直调会被改写成 `memory({ action: 'note_finding', params: { finding, evidence, importance } })`。即 `note_finding` 是 `memory` 工具的语法糖,`isDirectNoteFindingCall`(:80)在白名单/守卫里做等价放行判断。

#### 中间件逐个说明(阶段级动作守卫是本文件的重点)

- **allowlistGate**(:537):双层守卫。先看工具名是否在 `loopCtx.allowedToolIds`;空数组 = 严格禁用所有 capability 工具,返回中文提示 error;非空则列出前 5 个可用工具。再看动作级 `isActionAllowed`(:611,查 `allowedToolActions[tool]`)。防止 LLM hallucinate 越权工具/动作。`note_finding` 特判放行。
- **toolArgumentBoundsGate**(:574):`measureToolArgBytes`(:282,用 `stableStringify` + `TextEncoder`)。不可序列化→`TOOL_ARGS_INVALID`;超过 `MAX_TOOL_ARG_BYTES = 256_000`(:198)→`TOOL_ARGS_TOO_LARGE`。都写 `diagnostics.warn` 并短路。防御模型产出超大/环状参数。
- **evolutionDecisionGate**(:626):仅当 `sharedState._evolutionDecisionOnly === true` 生效。Evolution retry 决策补写阶段只允许 `knowledge.manage` 且 `operation ∈ {evolve, deprecate, skip_evolution}` 且带 `id`;其余全部 block。这是 allowlist 到不了的"动作+参数"级硬约束。
- **recordRepairOnlyGate**(:683):仅当 `sharedState._recordRepairOnly === true` 生效,只放行 `note_finding` 与 `memory` 的 `{note_finding, recall, get_previous_evidence}`(:653)。
- **analystVerifyOnlyGate**(:714):仅当 `tracker.pipelineType === 'analyst'` 且 `tracker.phase === 'VERIFY'`。放行 `code.{read,outline}`、`note_finding`/`memory.{recall,get_previous_evidence}`、以及带聚焦实体的 `graph.query`(类型 ∈ `class/protocol/hierarchy/callers/callees/overrides/extensions/impact`,:656);禁止泛搜索/终端/知识提交。
- **producerSubmitOnlyGate**(:764):仅当 `pipelineType === 'producer'`。`SUMMARIZE` 相位彻底禁用工具;`PRODUCE` 相位只放行 `knowledge.submit`、`code.read`、`memory.recall`、`meta.review`。注释(:761-763)记录了 Package Q 暴露的失败路径:成功提交 1 个候选后模型继续调 `knowledge.detail`/`meta.tools` 消耗轮次、触发 idle 退出、丢失剩余结构化发现——这条守卫就是为堵住它。
- **deterministicDuplicateGuard**(:817):session 级读类工具短路缓存。`isDeterministicDuplicateCandidate`(:232)只对"可安全重放"的读类动作(`READ_LIKE_ACTIONS`,:153)或只读 manifest(`isReadLikeManifest`,:218:无副作用/writeScope=none/network=none/credentialAccess=none/policyProfile 非 write/admin)开缓存;`SIDE_EFFECT_ACTIONS`(:169,submit/mutate/write 等)与 `exclusive` 并发工具永不缓存。缓存键 `buildCacheKey`(:316)= 工具名 + 动作 + args + 项目快照 id(`resolveProjectSnapshotId`,:291,可回退到 fileCache 指纹)+ 执行策略(source/pipelinePhase/pipelineType/preset)。`before` 命中则克隆返回并标 `duplicateShortCircuit`;`after` 在未 block/未命中/信封 ok 时把结果写入缓存。缓存值用 `structuredClone`(`cloneCacheValue`,:253)隔离。
- **observationRecord**(:864):`after` 把执行结果喂给 `memoryCoordinator.recordObservation(...)`。
- **trackerSignal**(:882):`after` 调 `tracker.recordToolCall(...)`,回填 `metadata.isNew`(是否带来新信息)。
- **traceRecord**(:897):`after` 把 Action+Observation 记入 `trace`(ActiveContext 推理链)。
- **submitDedup**(:912):**不做提前拦截**(注释 :906-910 明确:所有字段校验/唯一性/相似度/融合都归 `RecipeProductionGateway`)。仅在 `knowledge.submit` 且结果 `status === 'created'` 后,登记标题/trigger/pattern 指纹到 `sharedState.submitted*`,并调 `recordProducerSubmitLedger`(:971)累积 producer 提交台账(含 `hasCompleteSubmitPayload`(:1021)判 8 个必填字段是否齐全、`submitSourceCount`(:1038)数有效来源)。置 `metadata.isSubmit = true`。

#### 默认装配顺序与两个"外置"中间件

`createToolPipeline`(:1132)顺序:allowlistGate → toolArgumentBoundsGate → evolutionDecisionGate → recordRepairOnlyGate → analystVerifyOnlyGate → producerSubmitOnlyGate → deterministicDuplicateGuard → observationRecord → trackerSignal → traceRecord → submitDedup。

关键设计决策(注释 :1126-1130):`eventBusPublisher` 与 `progressEmitter` **故意不放进默认管线**,由 `AgentRuntime.#processToolCalls` 直接处理,以保持与原始 reactLoop 完全一致的事件顺序——因为 `tool_end` 进度事件需要 `resultStr.length`,而该长度在管线之外用 `BudgetController` 配额裁剪后才算出(`AgentRuntime.ts:1405-1454`)。Runtime SafetyPolicy 也已迁至 ToolRouter/GovernanceEngine 的 approve 阶段(注释 :1126)。

#### 上下游

- 上游唯一调用者:`AgentRuntime.#processToolCalls`(`AgentRuntime.ts:1352`),每个 function call 走一次 `execute`。
- 下游:`runtime.toolRouter.execute`(V2 `ToolRouter`,经 `src/tools/runtime/adapter/ToolRouterAdapter.ts` 适配)。
- 跨子系统:`#tools/kernel`(`ToolCallRequest / ToolResultEnvelope / ToolResultStatus / projectToolResultOrdinaryOutput`)、`SafetyPolicy`、`LoopContext.sharedState`(缓存/台账/守卫开关的载体)、`tracker`/`trace`/`memoryCoordinator`/`diagnostics`。

---

### S03.2 LLMInputAssembly — LLM 输入装配

文件:`src/agent/runtime/LLMInputAssembly.ts`。

#### 职责定位

把喂给模型的一次调用输入,组织成"静态身份(system prompt)+ 一条临时 runtime 输入层(user 消息)+ 投影后的历史消息"。核心思想(`formatProviderInputLayer`,:636):静态身份留在 system prompt 里可缓存,动态策略/上下文单独装进一条 ephemeral `user` 消息追加到历史末尾,减少静态内容重复、便于 provider 侧缓存。

#### 对外 API / 类型

- `buildLlmInputAssembly(options): LLMInputAssembly`(:54)——主装配函数。
- `resolveLlmInputStageProfile(ctx, requested, effective): LLMInputStageProfile`(:238)——阶段画像推断,`AgentRuntime.ts:937` 也直接复用它决定 provider input budget。
- 类型:`LLMInputSectionId`(:6,`identity/stagePolicy/toolContract/taskContext/evidenceContext/dynamicContext`)、`LLMInputStageProfile`(:14,`analyze/record/summarize/produce/generic`)、`LLMInputSection`(:16,含 `providerVisible / staticCacheable`)、`LLMInputAssembly`(:24,含 `providerMessages / inputLayerMessage / sections / metadata / stageProfile`)、`BuildLlmInputAssemblyOptions`(:42)。

#### 阶段画像状态机 `resolveLlmInputStageProfile`(:238)

按优先级从 `tracker.phase` / `tracker.pipelineType` / `ctx.context.pipelinePhase` / `sharedState._recordRepairOnly` 推断,决定后续 section 文案与预算:
1. `record`:`_recordRepairOnly` 或 `context.recordRepairOnly` 为真、或 phase=`RECORD`、或 pipelinePhase 含 `record_repair`。
2. `summarize`:phase ∈ `SUMMARIZE/FINALIZE`、或 pipelinePhase 含 `summarize`、或(`effectiveToolChoice==='none'` 且 phase=SUMMARIZE/含 summary)。
3. `produce`:phase=`PRODUCE`、或 pipelineType=`producer`、或 pipelinePhase ∈ `produce/producer`。
4. `analyze`:pipelineType ∈ `analyst/bootstrap/scan`、或 pipelinePhase=`analyze`、或 phase ∈ `SCAN/EXPLORE/VERIFY`。
5. 否则 `generic`。

#### 装配流水线(buildLlmInputAssembly,:54)

1. 推断 `stageProfile`。
2. `projectMessagesForStage`(:129):仅 `produce` 阶段对历史做压缩——`collapseProducerSubmitToolRounds`(:139)把整轮全是 `knowledge.submit` 的 assistant+tool 往返折叠成一条 `[[Producer submit history]]` 摘要 user 消息(`formatProducerSubmitHistorySummary`,:204,逐条列 status/title/trigger/requiredFieldsComplete/sourceCount),`mergeAdjacentProducerSubmitSummaries`(:178)再合并相邻摘要。摘要里显式警告(:210)"这不是合法 submit 载荷,不要拷贝压缩后的 params",防模型复制残缺参数。
3. 构造 5 个输入层 section(过滤空内容):`buildStagePolicySection`(:283)、`buildToolContractSection`(:319)、`buildTaskContextSection`(:352)、`buildEvidenceContextSection`(:405)、`buildDynamicContextSection`(:534)。
4. `compactInputLayerSections`(:547)按预算裁剪与去重(见下)。
5. 组装 `sections = [identity(=systemPrompt), ...inputLayerSections]`;`identity` 是唯一 `staticCacheable: true`。
6. `formatProviderInputLayer`(:636)把输入层 sections 拼成一条以 `# LLM input runtime layer` 开头的 markdown 文本,包成 `inputLayerMessage: { role: 'user', content }`。
7. 返回 `providerMessages = inputLayerMessage ? [...history, inputLayerMessage] : history`,以及一大坨 `metadata`(section ids、stageProfile、deterministic/starter evidence refs、grounding policy、staticSectionIds、providerVisibleSectionIds、trackerPhase、pipelineType、inputCompaction、inputProjection)供诊断/PCV 记录。

#### 各 section 内容(策略文案随阶段变化)

- **stagePolicy**(:283):`stageProfile/phase/pipelineType` 行 + 逐阶段行为约束文案(`bodyByProfile`,:298,如 analyze 要求"只总结已记录的 note_finding"、produce 要求"结构化发现是唯一候选义务,不得从最终 Markdown 挖新主题")。
- **toolContract**(:319):`requestedToolChoice / effectiveToolChoice / availableTools` + 逐阶段工具契约(`contractByProfile`,:332,如 summarize="No tool calls are valid",produce="code.read/search/graph/terminal 越界")。
- **taskContext**(:352):`modelRef/source/iteration/maxIterations/pipelinePhase/dimensionId/targetName`,加 prompt。`hasPromptInMessageHistory`(:385)判断初始 prompt 是否已在历史里:若在则只写 `promptRef: initial-user-message`(避免重复注入),否则 `limitText(prompt, 1600)`。
- **evidenceContext**(:405):`toolCallsSoFar`、`trackerMetrics`、`traceStats`、`planProgress`(都经 `safeCall` 容错)、`recordRepairEvidencePaths`、`deterministicEvidenceRefs`、`evidenceStarterRefs`、`evidenceGroundingPolicy`、`producerSubmitLedger`(`compactProducerSubmitLedger`,:460,最多 20 条)并附权威性说明(:447,"把 payloadStored/requiredFieldsComplete 当权威运行时事实,不要从压缩历史推断缺字段")。
- **dynamicContext**(:534):透传外部 dynamicContext(为空则该 section 不产生)。

#### 证据接地(grounding)与一个重大反面教训

`buildGroundingContext`(:503):汇集 `evidenceStarterRefs`(:505,截 24)与 `deterministicEvidenceRefs`(:511,截 32,合并 context/sharedState 多个来源经 `extractSourceRefsFromValue`)。关键注释(:509-510):此处**故意只保留"证据已存在"提示,不再注入 sourceRef strict policy**——之前 AI 把 sourceRef 错误扩成 canonical index/分类/强校验,导致重大资源浪费,不许在输入层复活。`policy` 仅当 `ctx.groundingEnforcement === 'guard'` 且当前是 analyze 时才由 `buildAnalyzeGroundingPolicy` 注入(:527);默认 `off`(PCV observe-only,AP-3 切默认)。注释(:526,PD5)强调 deterministic/starter refs 注入**不随此开关**,始终作为默认 analyze 上下文保留。

#### 预算裁剪与去重 `compactInputLayerSections`(:547)

- `compactRepeatedBlocks`(:590):按段落/行归一化(`normalizeCompactionBlock`,:627,长度≥48 才算 block),跨 section 用 `seenBlocks` 集合去重(`hasSeenCompactionBlock`,:615,含子串包含判断);单行段落若被判重则整段丢弃。
- `sectionBudgetFor`(:570):按阶段给每个 section 定 max chars。默认:dynamicContext=1600、evidenceContext=1400、taskContext=1400,其余 2400;`produce` 阶段更紧:dynamicContext=1000、evidenceContext=1000、taskContext=1100,其余 2400。超出用 `limitText`(:673,截断加 `\n...(truncated)`)。
- 结果记 `budgetedSectionIds` / `dedupedSectionIds` 供诊断。

#### 上下游

- 上游:`AgentRuntime.ts:949`。装配后 `measureLlmInputAssembly`(:967)计量、`validateLlmInputSize`(:968)校验、`llmInputAssembly.providerMessages` 送 `aiProvider.chatWithTools`(:1037)。`recordPcvInputAssembly`(:960)把装配记入 PCV 证据。
- 依赖:`#ai/AiProvider`(`UnifiedMessage / ToolSchema`)、`AnalyzeGroundingGuard`、`PcvNodeEvidence.extractSourceRefsFromValue`、`LoopContext`。

---

### S03.3 LLMInputMeasurement — 输入计量

文件:`src/agent/runtime/LLMInputMeasurement.ts`。

#### 职责与 API

对装配结果做 token/字符计量与重复块统计,供输入超限判定与可观测。
- `estimatePromptTokens(text)`(:49):委托 `#shared/tokenUtils.estimateTokens`。
- `measurePromptText(text, options)`(:53):单文本计量(charCount/estimatedTokens/重复块)。
- `measureLlmInputAssembly(assembly, options): LLMInputAssemblyMeasurement`(:65):对整装配计量。
- 类型:`PromptSectionMeasurement`(:5)、`DuplicatePromptBlock`(:12)、`PromptTextMeasurement`(:19)、`LLMInputAssemblyMeasurement`(:28,分别给出 `inputLayerEstimatedTokens / providerHistoryEstimatedTokens / providerMessageEstimatedTokens / systemPromptEstimatedTokens / toolSchemaEstimatedTokens / sectionMeasurements`)。

#### 计量口径

`measureLlmInputAssembly`(:65)分别把 systemPrompt、providerMessages、toolSchemas、各 section 拼成文本(`formatMessageForMeasurement`,:184;`formatToolSchemasForMeasurement`,:196)再估 token。`measuredText`(:85)是"总输入"= systemPrompt + providerMessageText + toolSchemaText + 所有 section content,`estimatedTokens` 由此得出——这就是 `validateLlmInputSize`(`AgentRuntime.ts:2441`)拿去和 `resolveLlmInputTokenLimit`(默认 `DEFAULT_LLM_INPUT_TOKEN_LIMIT`,或 budget 的 `maxProviderInputTokens/maxInputTokens/contextWindowTokens`)比较的量。超限则 `diagnostics.warn` 并让本轮 `#callLLM` 返回 null(非 system 场景给用户"输入过长"提示,`AgentRuntime.ts:983-987`)。

`measureDuplicateBlocks`(:122):按 `normalized` 聚合出现次数,`duplicateBlockRatio = duplicateEstimatedTokens / measuredBlockTokens`,排序输出最费 token 的重复块——用于诊断输入冗余。`collectPromptBlocks`(:157)同时按双换行段与单行两种粒度收集,`normalizePromptBlock`(:175)保留代码块结构但压空白。

---

### S03.4 MessageAdapter — 统一消息操作与 provider 预算压缩

文件:`src/agent/runtime/MessageAdapter.ts`。

#### 职责定位

消除 reactLoop 里 `useCtxWin` 的双模式分支:对外暴露一套统一消息 API,底层可以是 `ContextWindow`(bootstrap/system 场景,带三级压缩+动态 token 预算)或裸数组(对话场景)。

#### 类层次与 API

- `abstract class MessageAdapter`(:50):定义接口+JSDoc,方法默认 `throw`。核心方法:`appendUserMessage/appendAssistantText/appendAssistantWithToolCalls/appendToolResult/appendUserNudge`、`toMessages()`、`toProjectedMessages()`(:96,默认等同 toMessages,L3 collapse 读时投影)、`resetToPromptOnly()`(错误恢复)、`getToolResultQuota()`、`compactIfNeeded()`、`compactForProviderInputBudget(opts)`(:121,默认 no-op 投影)、`formatToolResult(toolName, raw)`(:142,统一 `limitToolResult`,识别 `ToolResultEnvelope` 取 `.text`)。
- `ContextWindowAdapter extends MessageAdapter`(:161):所有操作委托私有 `#ctxWin: ContextWindow`;暴露 `get contextWindow`(供 forcedSummary 等外部逻辑)。`compactForProviderInputBudget` 真正委托 ctxWin 实现三级压缩。
- `SimpleArrayAdapter extends MessageAdapter`(:238):纯 `ChatMessage[]`,不压缩,`getToolResultQuota` 固定 `{ maxChars: 8000, maxMatches: 20 }`,`compactIfNeeded` 恒 no-op。
- `createMessageAdapter(contextWindow)`(:301):有 ctxWin 用 ContextWindowAdapter,否则 SimpleArrayAdapter。

#### 关键数据结构

- `ProviderInputBudgetProjection`(:18):`compactForProviderInputBudget` 返回值——`before/afterMessageCount`、`before/afterProjectedTokens`、`level`、`reason`、`removed`。`AgentRuntime.ts:939-944` 在装配前按阶段(`resolveProviderInputBudget`,`AgentRuntime.ts:116`,record=40 条/14k、produce=20 条/12k、analyze/summarize=44 条/16k、其余不压)先做一次 provider 输入预算压缩,把 projection 记入 `inputProjection` 透传给装配 metadata。
- `ChatMessage`(:36)/`ToolCallRecord`(:29):裸数组模式的消息与工具调用记录。

#### 上下游

- 上游:`AgentRuntime.ts:537` 创建;`compactForProviderInputBudget`(:940)、`toProjectedMessages`(:947)、`appendToolResult`(:1478)、`appendAssistantWithToolCalls`(:1284)在主循环各处调用。
- 依赖:`../context/ContextWindow`(`limitToolResult` 也来自此)、`#tools/kernel`(`isToolResultEnvelope`)。

---

### S03.5 AgentMessage — 渠道无关消息信封

文件:`src/agent/runtime/AgentMessage.ts`。

#### 职责定位

核心抽象(注释 :1-16):Agent 永远不需要知道消息来自哪个渠道。Transport 适配器把渠道特定格式转成 `AgentMessage`,Agent 只处理 `AgentMessage`,通过 `replyFn` 回复。这里只做 Agent 内部归一化;具体 Codex MCP server / marketplace / host route 归 AlembicPlugin。

#### API / 数据结构

- `Channel`(:106,冻结):`HTTP='http' / CLI='cli' / MCP='mcp' / INTERNAL='internal'`。
- `class AgentMessage`(:113):字段 `id`(randomUUID)、`content`、`channel`、`session { id, history }`、`sender { id, name?, type }`、`metadata`、`replyFn`、`timestamp`;`get history()`(:158)、`async reply(text)`(:163,有 replyFn 才回)。
- 静态工厂:`fromHttp(req, replyFn)`(:176,取 prompt/message/content、conversationId/sessionId、userId/ip、lang/mode/context/stream)、`fromCli(input, opts)`(:204,注入 cwd)、`internal(content, opts)`(:222,Agent 间消息,带 parentAgentId/dimension/phase)、`fromMcp(mcpReq, replyFn)`(:245,宿主注入的 MCP-like 请求,取 arguments.prompt/toolName/clientId)。
- `toJSON()`(:269):序列化时只暴露 `historyLength` 不含全量历史。

这是"消息进入 Agent 的入口归一化",与 S03.4 的 `MessageAdapter`(Agent 内部消息存储/投影)是两层:`AgentMessage` 是外部请求→Agent 的信封,`MessageAdapter` 是循环内部的消息账本。

---

### S03.6 HookSystem — 统一钩子切点

文件:`src/agent/runtime/HookSystem.ts`。

#### 职责定位

替代碎片化的 4 个事件通道(AgentEventBus / EventBus / SignalBus / Pipeline Middleware),提供类型安全、可组合、可拦截、可桥接的统一 hook 机制(注释 :1-14)。

#### 钩子点与 payload(类型安全)

- `HookEvent`(:21)12 个:`agent:iteration:before/after`、`agent:exit`、`agent:finalize`、`tool:execute:before/after`、`context:compact:before/after`、`exploration:phase_transition`、`exploration:budget_warning`、`llm:call:before/after`。
- `HookPayloadMap`(:37)为每个事件定义精确 payload(如 `agent:finalize` = `{ reply, iterations, toolCallCount }`;`llm:call:after` = `{ iteration, hasToolCalls, hasText, inputTokens?, outputTokens?, processEvent? }`)。多数 payload 含可选 `processEvent`(AgentProgressProcessEvent),用于把 hook 错误挂回进度事件。

#### API 与时机

- `on(event, handler, {priority?, once?})`(:111):返回退订函数;`priority` 越小越先(默认 100),按优先级插入排序。`once(...)`(:142)一次性。
- `emit(event, payload): Promise<boolean>`(:154):异步分发。**唯一可拦截事件是 `tool:execute:before`**——任一 handler 返回 `false` 则整体返回 `false`(blocked);其余 fire-and-forget。handler 抛错被 `#recordHookError`(:250)吞掉并记诊断,不中断其他 handler。
- `emitSync(event, payload): void`(:197):同步分发,不支持拦截(恒 true)。**实际主循环全用 `emitSync`**(`AgentRuntime.ts:426/465/1014/1100/1344/1469/1859`),即钩子是同步观察点。
- `clear / hookCount / getDiagnostics / clearDiagnostics`。
- `#recordHookError`(:250):产出 `HookErrorDiagnostic { code:'HOOK_HANDLER_FAILED', event, hookId, message, mode }`,并 `attachHookDiagnosticToProcessEvent`(:270)把错误塞进 payload.processEvent.metadata.hookErrors,再 `logger.warn`。

#### 默认桥接 `registerDefaultHooks`(:298)

初始化时把 HookSystem 事件桥到 `AgentEventBus`(向后兼容):`llm:call:before→llm:call:start`、`llm:call:after→llm:call:end`、`agent:exit→step:completed`。关键注释(:345-347):`tool:execute:before/after` **故意不桥接**,因为 `AgentRuntime.#processToolCalls` 已直接 publish `TOOL_CALL_START/END`,桥接会造成重复。这与 S03.1 里"eventBusPublisher/progressEmitter 不进默认管线"是同一条防重复设计原则。

#### 上下游

- 上游:`AgentRuntime.ts:218` 构造(可从 config 注入)、:219 注册默认桥、各 `emitSync` 点、`get hookSystem()`(:1893)对外暴露供外部桥 SignalBus。

---

### S03.7 AgentEventBus — Agent 间事件总线

文件:`src/agent/runtime/AgentEventBus.ts`。

#### 职责定位

借鉴 AutoGen Event-Driven + RxJS 模式(注释 :1-11):Agent 间松耦合 publish/subscribe,支持同步/异步、事件过滤、优先级/TTL、request/reply(Agent 间 RPC)。继承 `node:events` 的 `EventEmitter`。

#### API / 事件

- `AgentEvents`(:17,冻结)分组:生命周期(`agent:created/started/completed/failed/aborted`)、执行(`tool:call:start/end`、`llm:call:start/end`、`step:completed`)、Agent 间交互(`handoff:request/accept/result`)、进度(`progress/thinking/stream:delta`)、外部触发(`user:input/scan:request`)。
- 单例:`getInstance()`(:64)/`resetInstance()`(:72,测试用)。`AgentRuntime.ts:207` 用单例。
- `publish(type, payload, {source?, target?, correlationId?})`(:91):构造 `event { type, source, target, payload, timestamp, correlationId }`,先 `emit(type)` 再 `emit('*')`(全局监听),再喂 topic 订阅者(handler 抛错只 warn 不中断,:113-119),最后若有 correlationId 命中 pendingReply 则 resolve。
- `subscribe(type, handler)`(:137):返回退订函数。
- `request(requestType, payload, {timeout=30000, source?})`(:162):用 `Promise.withResolvers` + `correlationId`(`req_时间戳_随机`)+ setTimeout 超时 reject 实现 RPC。
- `getStats()`(:186):`totalEvents / subscriptionTopics / pendingReplies`。构造时 `setMaxListeners(100)`。

#### 可观测性角色

它是 Agent 运行的"广播面":`#processToolCalls` 直接 publish `TOOL_CALL_START/END`(`AgentRuntime.ts:1333/1456`),`HookSystem` 桥接 publish `llm:call:*` / `step:completed`,`#emitProgress` publish `PROGRESS`(`AgentRuntime.ts:2090`)。Dashboard/HTTP/SSE 等外部消费者据此观察运行。

---

### S03.8 DiagnosticsCollector — 诊断累积器

文件:`src/agent/runtime/DiagnosticsCollector.ts`。

#### 职责定位

实现 `ToolDiagnosticsRecorder`(来自 `#tools/kernel`),是一次 Agent run 的诊断累加器:degraded/fallback、warnings、超时阶段、被拦工具、截断工具调用、空响应、AI 错误、gate 失败、逐工具调用信封、逐阶段 toolset、以及效率子结构(tool/cache/token/compaction/nudge 等)。

#### 数据结构与关键方法

- `AgentDiagnostics`(来自 `AgentRuntimeTypes`):`emptyDiagnostics()`(:31)给出初值;`AgentEfficiencySummary`:`emptyEfficiency()`(:10)。
- 构造:`new DiagnosticsCollector(seed?)`(:53)可用 seed 合并;`static from(value)`(:60)幂等复用已有实例或包裹普通对象。
- 采集方法(与 S03.1 管线一一对应):`markDegraded/markFallbackUsed`、`warn`、`recordTimedOutStage`、`recordBlockedTool`(管线 before 短路时调)、`recordTruncatedToolCalls`(`#processToolCalls:1257`)、`recordEmptyResponse/recordEmptyRetry`、`recordAiError`、`recordGateFailure`(:109,action=degrade/degraded_no_findings 时自动 markDegraded)、`recordStageToolset`(:116,深拷贝 capabilities/allowedToolIds/actions)、`recordToolCallEnvelope`(:137,按 callId 去重更新)、`recordEfficiencyToolCall`(:166,管线 execute 尾部调,累计 toolCalls/duplicate/cacheHits/cacheMisses)、`recordTokenUsage`、`recordCompaction`、`recordNudge`、`recordForcedSummary`、`recordCancelReason`。
- `merge(input)`(:222):把另一份诊断并进来(warnings 追加、超时/blocked 去重、efficiency 逐字段累加、maxCompactionLevel 取 max、forcedSummary 取或)。
- `isEmpty()`(:286):全字段为空判定,用于决定是否输出诊断段。
- `toJSON()`(:321):稳定序列化,数组/嵌套结构一律深拷贝,可选字段(toolCalls/stageToolsets/cancelReason)按存在性条件展开——保证输出可回放、无内部引用泄漏。

#### 上下游

- 挂在 `LoopContext.diagnostics`;管线(S03.1)与 `#processToolCalls` 大量写入;`AgentRuntime.ts:266/513` 用 `DiagnosticsCollector.from(...)` 构造/合并。诊断最终经 D2.3 普通输出策略(见 S03.10)投影成 `diagnosticSummary`(不外泄禁止字段)。

---

### S03.9 SystemPromptBuilder — 系统提示词组装

文件:`src/agent/runtime/SystemPromptBuilder.ts`。

#### 职责与 API

从 AgentRuntime 提取的 system prompt 组装逻辑。
- `class SystemPromptBuilder`(:52):持 `persona / fileCache / lang / memoryConfig`;`setFileCache(files)`(:73,bootstrap allFiles 注入后更新)。
- `build(caps, context)`(:83):按序拼 —— Persona(`# 角色`)、预加载文件清单(`## 预加载文件`,列每个文件名+行数+语言,注明"工具可通过 filePath 引用")、每个 `Capability` 的 `promptFragment` + `cap.buildContext({...context, lang, memoryMode})` 动态上下文、语言要求(en/zh)。
- `static injectBudget(prompt, {source, tracker, budget})`(:140):**仅 `source==='system'` 且有 tracker 且尚未注入过("轮次预算"字符串幂等判断)时**追加轮次预算段。

#### 轮次预算状态机(injectBudget)

先验锚定阶段节奏"60% 探索 → 80% 验证 → 最后 20% 输出总结"(注释 :132),按 tracker 分三种模板:
1. producer(pipelineType=producer 或 phase=PRODUCE):Producer 轮次预算——候选提交优先、证据补齐只读已引用文件、总结停工具;显式声明"Producer 不继承 Analyst 探索/验证预算,不启动新扫描"(:156)。
2. RECORD:结构化记录预算——只补 note_finding,不新增探索。
3. 默认:`exploreEnd = floor(maxIter*0.6)`、`verifyEnd = floor(maxIter*0.8)`,分探索/验证/总结三段并硬性要求"到第 verifyEnd 轮必须开始输出总结"。`maxIter` 缺省 24(:145)。

#### 上下游

- 上游:`AgentRuntime.ts:220` 构造、:558 `SystemPromptBuilder.injectBudget(...)`。装配好的 `effectiveSystemPrompt` 作为 `identity` section 进 S03.2。

---

### S03.10 AgentInterfaceContract — 接口契约 manifest(D2.3 / D2.5)

文件:`src/agent/runtime/AgentInterfaceContract.ts`(528 行)。

#### 职责定位

这是一份**冻结的接口契约 manifest + 自校验器**,不是运行时执行逻辑,而是把 Agent runtime/tools 对外的结果契约(必需分支、普通输出策略、失败分类)编码成可测试的数据结构。契约 id `alembic-agent-d5-runtime-tools`,与 Core 失败分类学(`@alembic/core/shared` 的 `CORE_FAILURE_TAXONOMY`)对齐。

#### 关键类型与常量

- `AgentInterfaceContractBranch`(:18)10 个必需分支:`success / failure / cancellation / timeout / permission-denial / needs-confirmation / partial-result / provider-error / host-failure / host-adapter`——`AGENT_INTERFACE_CONTRACT_REQUIRED_BRANCHES`(:101)冻结。
- `AgentInterfaceContractRowId`(:16):D1 行 `I02/I16/I17/I18`——`AGENT_INTERFACE_CONTRACT_REQUIRED_ROWS`(:114)。
- `AgentInterfaceContractErrorKind`(:30)、`AgentInterfaceContractFailureKind`(:44,= `CoreFieldFailureKind | 'none'`)。
- **D2.3 普通输出策略** `AGENT_INTERFACE_D23_ORDINARY_OUTPUT_POLICY`(:124):`forbiddenFields`(= `TOOL_RESULT_FORBIDDEN_ORDINARY_OUTPUT_FIELDS`)、允许的 `diagnosticSummaryKeys`(degraded/fallbackUsed/warningCount/blockedToolIds/... 共 15 键)、`refFields=['artifacts','resources']`。即普通输出只能带白名单诊断摘要与 artifact/resource 引用,禁止外泄原始诊断/内部字段。
- **D2.5 失败分类学策略** `AGENT_INTERFACE_D25_FAILURE_TAXONOMY_POLICY`(:147):锚定 `CORE_FAILURE_TAXONOMY_VERSION`、`requiredFailureKinds`、`ordinaryOutputField='failureTaxonomy'`,`entries` 由 `projectAgentFailureTaxonomyEntry`(:370)从 Core 分类学投影(每条含 dashboardState/detailExposureClass/httpStatus/mcpErrorCode/mcpStatus/publicMessage/toolStatus),`privateDataSafe: true`,并列出 3 个跨仓上游 commit 作证据。
- `BRANCH_FIXTURES`(:161):10 个分支的完整 fixture,每个声明 `boundaryArea / toolStatus / ok / errorKind / failureKind / failureTaxonomy / providerPublicFields / hiddenProviderFields / hostAdapterPath / evidenceKinds / observabilityKeys`。例如 success 暴露 `text/functionCalls/usage/finishReason`、隐藏 `apiKey/rawProviderResponse`;cancellation 走 `aborted` 状态、`errorKind=cancelled`、无 retry;needs-confirmation 独立于 permission-denial;partial-result 是一等结果分支(`ok:true`、status=`partial`)。
- `ALEMBIC_AGENT_INTERFACE_CONTRACT`(:329,冻结):汇总 manifest,`alembicConsumerSeams` 列出 4 个公共入口(`@alembic/agent`、`/runtime`、`/ai`、`/tools/runtime`)。

#### 校验器 `validateAgentInterfaceContract()`(:361)

返回 failure 字符串数组(空=合规),分四步:
1. `validateRequiredCoverage`(:422):10 分支 + 4 行必须全覆盖。
2. `validateBranchFixtures`(:439):每分支不得把 hidden 字段暴露为 public、不得暴露 forbidden 普通输出字段、needs-confirmation 必须用对应 toolStatus、host-failure 必须保持独立 errorKind、失败分支必须挂 `stableId === core.failure.<kind>` 且 `privateDataSafe`、必须有 observability/evidence key。
3. `validateFailureTaxonomyPolicy`(:481):版本一致、字段名对、必需 kind 齐、每条 stableId/privateDataSafe/toolStatus 合规。
4. `validateOrdinaryOutputPolicy`(:510):forbiddenFields 必须同引用、diagnosticSummaryKeys 非空、refFields 含 artifacts+resources。

辅助:`toolStatusForCoreFailure`(:403)把 Core 失败状态映射到工具状态(partial→partial、cancelled→aborted、needs-confirmation→needs-confirmation、timeout→timeout、blocked→blocked、其余→error)。

这份契约是 S03.1 管线错误归一化(`BLOCKING_ENVELOPE_STATUSES`、error 投影)与 provider 错误分类的"规范来源"——运行时行为必须与 fixture 一致,否则契约测试红。

---

### S03.11 AgentRuntimeBoundary — 运行时路由边界 manifest

文件:`src/agent/runtime/AgentRuntimeBoundary.ts`。

#### 职责定位

冻结的**运行时边界 manifest**,声明 `@alembic/agent` 包每块能力的 owner(agent/host/core)、公共子路径、agent/host 各自拥有什么、以及不支持的宿主路由。它把仓库 CLAUDE.md 里的职责边界规则固化成可查询数据。

#### 关键结构

- `AgentRuntimeBoundaryArea`(:4)7 个域:`ai-provider / tool-execution / terminal-sandbox / context-memory / prompt-runtime / tool-v2 / host-agent-route`。
- `BOUNDARY_ENTRIES`(:34)逐域给出 `owner / publicSubpath / summary / agentOwns / hostOwns / coreContracts?`。要点:
  - `ai-provider`→`@alembic/agent/ai`,agent 拥有 provider adapter/model registry/transport/provider errors,host 拥有凭证/网络许可/enablement UI。
  - `tool-execution`→`@alembic/agent`(注释 :46 说明 Train B IC3 已退役 `./tools` 聚合子路径,通用工具契约经 root facade 再导出)。
  - `terminal-sandbox`→`@alembic/agent/tools/runtime`,`coreContracts=['@alembic/core/host-agent-workflows']`,agent 拥有 terminal.exec handler 契约/沙箱诊断/审计,host 拥有真实进程执行/沙箱强制/审批 UI。
  - `context-memory`→`@alembic/agent/context`;`prompt-runtime`→`@alembic/agent/prompts`;`tool-v2`→`@alembic/agent/tools/runtime`(ToolRouter/Adapter/cache/compressor,host 拥有 `ToolContextFactory` 输入与外部执行器接线)。
  - `host-agent-route`→`owner:'host'`、`publicSubpath:null`:Codex MCP server/marketplace/channel/host-agent route 全归 Plugin,AlembicAgent 只暴露内部 runtime 契约。
- `ALEMBIC_AGENT_RUNTIME_BOUNDARY`(:103,冻结):`packageName='@alembic/agent'`、`runtimeLine='alembic-api-ai'`、`hostAgentRouteSupported:false`、`unsupportedHostRoutes=['codex-mcp','codex-marketplace','plugin-host-agent-route']`,并挂 `responsibility`(来自 `AgentRuntimeResponsibility`)。
- 查询函数:`getAgentRuntimeBoundaryEntry(area)`(:112)、`supportsAgentRuntimeRoute(route)`(:118,仅 `alembic-api-ai` 返回 true)。

`AgentInterfaceContract` 的 `boundaryArea` 字段(如 success/failure→`tool-execution`,provider-error→`ai-provider`,host-failure/host-adapter→`host-agent-route`)正是引用本 manifest 的 area 类型,两份契约互相锚定:S03.11 定"谁拥有哪块",S03.10 定"每块的结果分支必须长什么样"。

---

### S03.12 本章串联:一次迭代里这些组件如何协作

以 `AgentRuntime` 一轮迭代为轴(锚点均在 `AgentRuntime.ts`):
1. `#hookSystem.emitSync('agent:iteration:before')`(:426)。
2. 组装输入:`resolveProviderInputBudget`→`messages.compactForProviderInputBudget`(:940,MessageAdapter 压缩)→`buildLlmInputAssembly`(:949,LLMInputAssembly)→`measureLlmInputAssembly`(:967)→`validateLlmInputSize`(:968,超限则本轮返回 null)。
3. `#hookSystem.emitSync('llm:call:before')`(:1014)→桥到 `AgentEventBus` `llm:call:start`;`#emitProcessProgress`。
4. `aiProvider.chatWithTools(...)`(:1037)得 `LLMResult`;`emitSync('llm:call:after')`(:1100)。
5. 若有 tool calls 进 `#processToolCalls`(:1246):截断限额(记 `DiagnosticsCollector.recordTruncatedToolCalls`)→逐个 fc:emit `tool:execute:before`(:1344)+ bus `TOOL_CALL_START`(:1333)→`#toolPipeline.execute`(:1352,ToolExecutionPipeline 跑 11 中间件)→用 `BudgetController` 配额 `limitToolResult` 算 `resultStr`(:1405)→emit `tool:execute:after`(:1469)+ bus `TOOL_CALL_END`(:1456)→`messages.appendToolResult`(:1478)。
6. 迭代收尾 `emitSync('agent:iteration:after')`(:465/477);run 收尾 `emitSync('agent:finalize')`(:1859)。

`DiagnosticsCollector` 贯穿始终累积,最终经 D2.3 普通输出策略投影;`AgentInterfaceContract`/`AgentRuntimeBoundary` 是这条链对外结果与所有权的静态规范。


## S04 · PCV 节点证据 (src/agent/runtime/PcvNodeEvidence)

### 定位与一句话职责

`PcvNodeEvidence.ts`（`src/agent/runtime/PcvNodeEvidence.ts`，1667 行）是 Agent runtime 的 **PCV(Provider tool-Choice / analyze-grounding) 节点级证据引擎**。它是一个**纯采集/归一化/聚合**模块：在 reactLoop 单次执行（一个 `LoopContext`）期间，把「输入装配 → LLM 输出 → 工具轮次 → 工具结果 → 质量门」四五个关键节点上产生的证据材料，收敛成一条以 `chainNodeId` / `nodeId` 为主键的 `PcvNodeEvidenceSummary`，最终投影为供宿主 trace / artifact / metrics 承接的诊断数据（PCVM N9 node-local evidence）。

关键设计立场（贯穿整个文件的注释）：**observe-only（只观察，不驱动控流）**。这个模块只记录事实（tool-choice 是否被支持、classification 是何种 grounding、找到了哪些 sourceRefs），**从不据此阻断、nudge 或 rollback**。真正的强约束由姊妹模块 `AnalyzeGroundingGuard` 承担，而后者是**单向只读消费**本模块产出的 classification（见后文「observe-only 边界」小节）。所有导出函数都是纯函数或对传入的 `evidence` 对象做原地/克隆式增量，模块本身无实例状态（唯一的模块级状态是一个 `WeakMap` 缓存，见 `PCV_SOURCE_REF_INDEX`）。

### 对外 API 与 exports

模块经 `src/agent/runtime/index.ts` 的 barrel 统一 re-export（`index.ts:111-139`）。可分三组：

- **生命周期采集函数**（被 `LoopContext` 构造 + `AgentRuntime` 主循环调用）：
  - `createPcvNodeEvidence(ctx: LoopContext): PcvNodeEvidenceSummary`（`PcvNodeEvidence.ts:243`）— 从 `LoopContext` 播种一条空证据。
  - `recordPcvInputAssembly(evidence, assembly, options)`（`:344`）— 记录一次 LLM 输入装配，开一条 grounding ledger entry。
  - `recordPcvLlmOutput(evidence, options)`（`:425`）— 记录 LLM 输出文本 / functionCalls / reasoningTokens，回填并分类 ledger entry。
  - `recordPcvToolRoundOutcome(evidence, options)`（`:467`）— 累加一轮工具调用的 delta（accepted/rejected finding、tool call 数）并重分类。
  - `recordPcvToolResult(evidence, call, result, envelope, options)`（`:497`）— 逐个工具结果采集 sourceRefs，并识别 `note_finding` 的接受/拒绝。
  - `getLatestPcvBurnGrounding(evidence)`（`:491`）— 只读取最新一条 ledger entry（供 guard 消费）。
- **聚合/投影函数**（在 loop 结束或质量门处调用）：
  - `buildPcvNodeEvidenceSummary(evidence, options)`（`:577`）— 克隆、去重、归一化、封顶、补 `missingLinkReasons`，产出完整快照。
  - `buildPcvNodeEvidenceProcessMetadata(evidence)`（`:594`）— 从 summary 进一步降采样为**精简过程元数据**（引用变 ref 字符串数组、ledger 只留尾 8 条），供 process event 承接。
  - `buildPcvQualityGateEvidence({...})`（`:624`）— 质量门专用入口，从 artifact/gate 复原或新建证据。
- **可复用工具函数**（被其它 runtime 模块借用）：
  - `extractSourceRefsFromValue(value): string[]`（`:782`）— 从任意 JSON 值深度提取形如 `path/file.ts:12-34` 的文件引用；`LLMInputAssembly.ts:505` 也用它提取 evidenceStarterRefs。
  - `resolvePcvStageNodeIdentity({...})`（`:788`）— 从上游注入的 stage-node map 解析 canonical node 身份。

导出的类型（19 个 interface/type，`:8-232`）构成证据的 schema，全部经 barrel re-export 供消费方类型引用。

### 核心数据结构

顶层聚合对象是 `PcvNodeEvidenceSummary`（`:140-173`），`schemaVersion: 1` 是版本闸门与识别标记（`isPcvNodeEvidenceSummary` 用它判定，`:1024`）。其字段族：

- **身份/关联**：`nodeId` / `chainNodeId`（PCV 节点主键）；`correlation`（`dimensionId` / `dimensionScopeId` / `iteration` / `modelRef` / `runId` / `source` / `targetName`）；`stageIdentity`（`PcvNodeStageIdentity`，`:8-16`，记录 `pipelinePhase` / `pipelineType` / `stageProfile` / `trackerPhase`，`nodeKind` 恒为 `'agent-runtime-node'`）。
- **输入装配证据**：`inputAssembly: PcvNodeInputAssemblyEvidence | null`（`:32-45`）— 记录 `requestedToolChoice` vs `effectiveToolChoice`、`toolSchemaNames`、各类 sectionIds（`inputSectionIds` / `providerVisibleSectionIds` / `staticSectionIds`）、消息计数与内容哈希 `ref`。
- **grounding 台账**：`groundingLedger: PcvBurnGroundingLedgerEntry[]`（entry 定义 `:56-81`）— 这是本引擎的心脏。每条 entry 对应一次 LLM burn，携带 tool-choice 观测（`toolChoiceSent` / `toolChoiceSupported` / `toolSchemasVisible` / `deepseekV4ToolChoiceMode`）、证据 ref（`deterministicEvidenceRefs` / `evidenceStarterRefs` / `consumedEvidenceRefs` / `outputSourceRefs`）、各类 delta 计数（`toolCallDelta` / `evidenceToolCallDelta` / `acceptedFindingDelta` / `rejectedFindingDelta`）、以及最关键的 `classification: PcvBurnGroundingClassification`（7 值枚举，`:47-54`）。
- **发现（finding）引用**：`findingRefs.accepted: PcvNodeAcceptedFindingRef[]`（`:90-99`）/ `findingRefs.rejected: PcvNodeRejectedFindingRef[]`（`:101-110`）。
- **观测台账引用**：`ledgerRefs: PcvNodeLedgerRef[]`（`:83-88`，`kind: 'observation-ledger'`，来源恒为 `ActiveContext`）。
- **sourceRef 与诊断**：`sourceRefs: string[]`、`sourceRefDiagnostics: PcvSourceRefDiagnostic[]`（`:112-116`，记录 `ambiguous`/`missing` 归一化失败）。
- **质量门与修复**：`qualityGate: PcvNodeQualityGateEvidence | null`（`:118-131`）、`repair: PcvNodeRepairEvidence`（`:133-138`）。
- **观察标记**：`groundingEnforcement: 'off' | 'guard'`（`:161`，AP-4 additive 字段，见下文），`missingLinkReasons: string[]`（缺链原因清单）。

投影对象 `PcvNodeEvidenceProcessMetadata`（`:175-191`）是 summary 的降采样版本：把 finding/ledger 引用压成 ref 字符串数组，`qualityGate` 只保留 `action`/`pass`/`reason`/`status` 四字段，供 process event metadata 承接（避免把整棵证据树塞进事件）。

内部还有一套 **project-scope sourceRef 归一化索引**：`PcvCanonicalSourceIdentity`（`:211-220`，含 `qualifiedPath` / `absolutePath` / `folderId` 等 canonical 路径身份）、`PcvProjectScopeSourceRefIndex`（`:222-226`，`byQualifiedPath` / `byBasename` map + `ambiguousBasenames` set）、`PcvNormalizedProjectScopeSourceRef`（`:228-232`，归一化结果 `active`/`ambiguous`/`missing`）。

### 生命周期与运行时挂接点

本引擎的完整生命周期由 `LoopContext` 与 `AgentRuntime.ts` 主循环驱动，按时间顺序：

1. **播种（构造期）** — `LoopContext` 构造函数在最后一行 `this.pcvNodeEvidence = createPcvNodeEvidence(this)`（`LoopContext.ts:215`）。`createPcvNodeEvidence`（`:243-334`）从 ctx 拉取 `_dimensionMeta` / `context` / `tracker` / `sharedState`，用 `firstStringValue` 多路回退推导 `dimensionId` / `targetName` / `dimensionScopeId` / `runId`，再经 `resolvePcvStageNodeIdentity` 解析 canonical node 身份，缺失时回落成 `agent:{stageSlug}:{scopeSlug}` 形态的 fallback nodeId（`:272-282`）。它同时把本次运行的 `ctx.groundingEnforcement`（`'off'`/`'guard'`）原样写入 `evidence.groundingEnforcement`（`:305`）作为纯观察标记，并调 `attachPcvSourceRefIndex` 绑定 project-scope 归一化索引、初始化 `repair` 状态。

2. **记录输入装配** — `AgentRuntime.ts:960` 在构建 `llmInputAssembly` 之后调 `recordPcvInputAssembly`。它把 assembly 的 tools/metadata 摊平成 `inputAssembly`，并 `upsertGroundingLedgerEntry` 开一条**新 ledger entry**（`:396`），初始 `classification` 依 stageProfile 定为 `'summary-only'`（summarize 阶段）或 `'planning-only'`（`:398`）。tool-choice 观测里对 DeepSeek V4 有特判：`isDeepSeekV4` 时 `toolChoiceSent=false`、`toolChoiceSupported=false`、`toolSchemasVisible` 由 schema 数决定（`:417-420`）——因为 DeepSeek V4 不能依赖强制 tool_choice。`deepseekV4ToolChoiceMode` 由上游 `ProviderToolChoicePolicy.observeDeepSeekV4ToolChoiceMode` 算好传入（`:401` 注释：AP-1 消除 R4 读写往返）。

3. **记录 LLM 输出** — `AgentRuntime.ts:1064` 在 LLM 调用返回后调 `recordPcvLlmOutput`。它取**最新**一条 ledger entry（`getLatestGroundingEntry`），从输出文本提取 `outputSourceRefs`、用 `collectConsumedEvidenceRefs` 比对文本是否消费了注入的 `deterministicEvidenceRefs`/`evidenceStarterRefs`（`:439`），统计 `functionCallNames` 与「证据类」function call 数（`isEvidenceFunctionCall`），最后调 `classifyGroundingEntry` **重新分类**该 entry（`:460`）。关键注释（`:458-459`）：`outputSourceRefs` **只作审计材料，不作 grounding 成功指标**——历史上 AI 曾把 sourceRefDelta 当阶段进展，导致伪指标反复膨胀与重大资源浪费。

4. **逐工具结果采集** — `AgentRuntime.ts:1387` 在每个工具执行后调 `recordPcvToolResult`。它从 `call.args` / `result` / `envelope`（structuredContent/artifacts/resources/text）深度提取 sourceRefs 归并入 `evidence.sourceRefs`（`:506-517`）；若该 call 是 `note_finding`（或 `memory` 工具的 `note_finding` action，见 `isNoteFindingCall` `:1029`），进一步判定是否被 ActiveContext 接受（`recorded === true && target === 'activeContext'`，`:530-532`）：接受入 `findingRefs.accepted`，否则入 `findingRefs.rejected` 并记 reason。若处于 repair 场景，同步更新 `evidence.repair.status`（`finding-recorded`/`finding-rejected`）。

5. **一轮工具轮次收尾** — `AgentRuntime.ts:1481` 在一轮所有工具执行完后调 `recordPcvToolRoundOutcome`，传入本轮 finding delta（通过 `pcvBefore` 快照 accepted/rejected 计数差算得，`:1293-1296`/`:1482-1489`）与 `evidenceToolCallDelta`（`isEvidenceGroundingToolCall` 过滤）、`toolCallDelta`。它把 delta 累加进最新 entry 并**再次重分类**（`:484`）。

6. **聚合投影（两个 sink）**：
   - **loop 结果**：`LoopContext.buildResult()`（`LoopContext.ts:258`）调 `buildPcvNodeEvidenceSummary`，把完整证据快照挂在 loop 返回值 `pcvNodeEvidence` 上。
   - **过程事件**：`AgentRuntime.ts:2197`（`buildAgentProcessEvent` 内部）对每个 process event 调 `buildPcvNodeEvidenceProcessMetadata`，把精简元数据塞进事件 metadata（经 `sanitizeDeveloperData`），供 Dashboard/trace 承接。

7. **质量门旁路** — `insightGate.ts:807` 调 `buildPcvQualityGateEvidence`，把质量门 artifact + gate 结果转成证据并挂回 artifact（`insightGate.ts:815-821` 顺带写 `pcvNodeEvidenceRef`/`pcvNodeEvidenceMissingLinks`/`pcvQualityGateStatus` 到 metadata）。这是一条与主循环并行的证据装配路径（详见质量门小节）。

### grounding classification 状态机（核心算法）

`classifyGroundingEntry`（`:1361-1394`）是引擎最核心的判定逻辑，把一条 ledger entry 归入 7 类之一（`PcvBurnGroundingClassification`）。判定顺序（短路优先）：

1. `stageProfile === 'summarize'` → `'summary-only'`。
2. 有 finding delta 或 `trackerPhase === 'RECORD'`：有 delta → `'record-only'`；纯 RECORD 无 delta → `'invalid-no-evidence'`。
3. 有证据类工具调用（`evidenceToolCallDelta` / `evidenceFunctionCallCount` / `toolCallDelta` > 0）→ `'evidence-produced'`。
4. 消费了注入证据（`consumedEvidenceRefs.length > 0`）：`SCAN` 相 → `'planning-only'`；`VERIFY` 相 → `'verification-only'`；否则 → `'deterministic-evidence-consumed'`。
5. `stageProfile === 'analyze'` 兜底 → `'invalid-no-evidence'`。
6. 最后：有 function call → `'evidence-produced'`，否则 → `'summary-only'`。

同一条 entry 在生命周期中会被**多次重分类**（输入装配开 entry 时 planning/summary → LLM 输出后 → 工具轮次后），classification 反映的是「当前累积证据下」的判定。`'invalid-no-evidence'` 是 guard 唯一关心的信号（见下节）。

注释 `:458-459` 与类型注释 `:155-160`（AP-4）反复强调：observe-only 下增多的 `'invalid-no-evidence'` 是**预期**，不应误判为回归（R6）——因为 guard 默认关闭时 AI 会更常输出无证据 planning 文本。

### observe-only 边界：与 ProviderToolChoicePolicy / AnalyzeGroundingGuard 的关系

这是本子系统最重要的架构约束，代码中三方分工清晰、依赖方向单向无环：

- **`ProviderToolChoicePolicy`（provider 层，上游）**：`observeDeepSeekV4ToolChoiceMode`（`ProviderToolChoicePolicy.ts:52`）由 effective vs requested toolChoice 归一化出 DeepSeek V4 tool-choice mode；`isDeepSeekV4AnalyzeFirstBurn`（`:82`）判定是否 DeepSeek V4 analyze 首轮。注释（`ProviderToolChoicePolicy.ts:48-52`）明确：**计算源在 provider 模块，`PcvNodeEvidence` 仅记录其结果**，主循环抑制例外直接读本地结果，**不回读 PCV burn**（AP-1 消除 R4 读写往返耦合）。`AgentRuntime.ts:931` 主循环直接调 `observeDeepSeekV4ToolChoiceMode` 拿 mode，再作为参数喂给 `recordPcvInputAssembly`。

- **`PcvNodeEvidence`（证据层，本模块）**：纯记录。它接收 policy 算好的 mode、guard 关心的 classification 由它产出，但它**不消费 guard、不消费 policy 的决策**（只把 mode 当数据存）。

- **`AnalyzeGroundingGuard`（质量门层，下游）**：`evaluateAnalyzeTextGroundingGate`（`AnalyzeGroundingGuard.ts:45`）通过 `getLatestPcvBurnGrounding(ctx.pcvNodeEvidence)` **只读消费**最新 burn 的 `classification` / `deterministicEvidenceRefs`，当且仅当 DeepSeek V4 analyze 首轮 + `classification === 'invalid-no-evidence'` 时返回 `block+nudge` 决策（`AnalyzeGroundingGuard.ts:50-68`）。文件头注释（`:12-19`）明确职责边界：「输入 = PCV grounding classification（只读消费，不反写证据）；输出 = 政策文本 / block-nudge 决策」，且命名刻意**不带 `Pcv*` 前缀**以与证据记录层分离。依赖方向 guard→provider 单向下行。

- **enforcement 开关**：`ctx.groundingEnforcement`（`LoopContext.ts:175`，默认 `'off'`）是唯一的 opt-in 闸门。`AgentRuntime.ts:1611-1614` 主循环短路：默认 `'off'` 时**根本不调 guard**、不读决策、不阻断/不 nudge/不 rollback（PCV 纯 observe-only）；仅 `'guard'` 时 `evaluateAnalyzeTextGroundingGate` 才生效，若 `block` 则 append nudge + `tracker.rollbackTick()` + 发 `invalid_no_evidence_burn` 诊断（`:1615-1626`）。`groundingEnforcement` 值本身被证据层原样记入 `groundingEnforcement` 字段（AP-4 additive，纯 additive、老消费者忽略不受影响，`:155-161`）。

一句话概括三方：**policy 算 tool-choice 事实 → evidence 记 classification → guard 只读 classification 决定是否阻断，且默认全关**。

### sourceRef 归一化与安全（关键算法）

`extractSourceRefsFromValue`（`:782`）→ `collectSourceRefs`（`:1423-1471`）是深度遍历提取器：用正则 `FILE_REF_RE`（`:234-235`，覆盖 go/py/ts/swift/rs 等几十种扩展名 + 可选 `:line` 后缀）从字符串匹配文件引用；深度上限 5、总量上限 `MAX_SOURCE_REFS=80`、单字符串截断 20000 字符、用 `WeakSet` 防环。**安全护栏**：遍历时跳过 `isSecretLikeKey`（`:1665`，匹配 `api_key|token|secret|password|authorization|credential`）的 key，避免把密钥字段拖进 sourceRef 或 stats（`sanitizeStats` `:1498` 同样过滤）。

`normalizeSourceRefsForEvidence`（`:1246`）是归一化管线：若绑定了 `PcvProjectScopeSourceRefIndex`（经 `attachPcvSourceRefIndex` 用 `WeakMap` 缓存于 `PCV_SOURCE_REF_INDEX`，`:241`），则每个 ref 经 `splitSourceRefLineSuffix` 拆出 `:line` 后缀，再 `normalizePcvProjectScopeSourceRef`（`:1201`）匹配 canonical 身份：命中 `byQualifiedPath` → `qualified-path`；无斜杠 basename 命中唯一桶 → `unique-basename`；命中歧义桶 → `ambiguous`；否则 `not-found`。非 active 的 ref 不入 sourceRefs，而是记入 `sourceRefDiagnostics` 并追加 `missingLinkReasons`（`recordSourceRefDiagnostic` `:1301`）。无索引时退化为纯去重（`:1252`）。索引构建 `buildPcvProjectScopeSourceRefIndex`（`:1173`）会把 basename 映射到唯一 identity，多路径同名则标为 ambiguous。

### 质量门证据装配（并行路径）

`buildPcvQualityGateEvidence`（`:624-663`）是与主循环并行的第二条装配入口，被 `insightGate.ts` 调用。它：
1. `createQualityGateEvidenceBase`（`:665`）— 优先从 `source.pcvNodeEvidence` **克隆已有证据**（`getPcvNodeEvidence` + `isPcvNodeEvidenceSummary` 校验 `schemaVersion===1`），无则 `createFallbackQualityGateEvidence`（`:973`）新建一个 `agent:quality_gate:{dim}` 的兜底证据（`groundingEnforcement` 固定 `'off'`，标记为非 guard 运行）。
2. 绑定 sourceRef 索引、解析 quality_gate stage 身份（`resolvePcvStageNodeIdentity` with `pipelinePhase:'quality_gate'`/`stageProfile:'analyze'`）。
3. 采集 `referencedFiles`、把 artifact 的 findings 全部作为 `quality_artifact` origin 的 accepted finding（`recordQualityGateFindings` `:692`）。
4. `applyQualityGateResult`（`:717`）从 gate + qualityReport 组装 `qualityGate`（`action`/`pass`/`scores`/`totalScore`/`suggestions` 等）。
5. `updateQualityGateRepairState`（`:765`）依 gate action 映射 repair 状态：`record_repair`→`required`、`analysis_retry`→`analysis-retry-required`、`degrade`→`rejected`。
6. 以 `requireQualityGate:true` 调 `buildPcvNodeEvidenceSummary`（缺 qualityGate 会补 `missing-quality-gate-status` 缺链原因）。

### 聚合、去重、封顶与缺链诊断

`buildPcvNodeEvidenceSummary`（`:577-592`）是 loop 收尾聚合：`cloneEvidence` 深克隆（`:1531`，防止后续变更污染快照，并把 WeakMap 索引带到克隆体上 `:1568-1571`）→ `normalizePcvEvidenceSourceRefs` 归一化所有 sourceRef 面（含 finding/ledger/repair）→ 各类集合去重（`dedupeBy` 按 `ref`）+ 封顶（`MAX_SOURCE_REFS=80`、`MAX_GROUNDING_LEDGER=32` 保留尾部）→ `buildMissingLinkReasons`（`:1044`）补齐缺链清单（缺 input-assembly-ref / observation-ledger-ref / finding-refs / source-refs / quality-gate-status）。

`buildPcvNodeEvidenceProcessMetadata`（`:594-622`）在此基础上再降采样，ledger 只留尾 `MAX_EVENT_GROUNDING_LEDGER=8`、sourceRefs 只留 `MAX_EVENT_SOURCE_REFS=24`，用于高频 process event。

内容寻址 `ref` 由 `shortHash`（`:1575`，sha1 前 12 位）+ `stableStringify`（`:1579`，key 排序稳定序列化）生成，保证同内容同 ref、跨轮可去重可回放。

### stage-node 身份解析

`resolvePcvStageNodeIdentity`（`:788-841`）负责把 Agent 侧阶段对齐到**上游编排方注入的 canonical stage identity**（注释 `:813`：Agent 只消费并贯穿，缺失时保 fallback）。它先 `buildStageNodeAliases`（`:854`）把 `pipelinePhase`/`stageProfile`/`trackerPhase`/`pipelineType` 经一组别名归一函数（`normalizePipelinePhaseAlias`→`record_repair`/`quality_gate`/`produce`；`normalizeTrackerPhaseAlias` 把 scan/explore/verify/summarize 收敛为 `analyze`）+ `normalizeStageKey`（小写、下划线化、去 `stage_` 前缀）算出别名集，再在 7 个候选 map（`context.pcvStageNodeMap`/`pcvChainNodes`/`stageNodeMap` 及 sharedState 的 `_` 前缀变体）中按别名查找，`normalizePcvStageNodeMapValue`（`:933`）把命中值（字符串或 `{nodeId,chainNodeId,...}` 记录）解析为 `{chainNodeId, nodeId}`。全部落空返回 `null`，由调用方保留 fallback。

### 错误/回退/降级/部分结果路径

作为纯采集模块，本引擎的容错哲学是**永不抛错、静默降级、部分证据也可用**：

- `buildLedgerRefs`（`:957`）用 `safeCall`（`:1637`，try/catch 吞异常返 null）包裹 `ctx.trace.getStats()`，trace 缺失或 stats 抛错都只是少一条 ledgerRef。
- `getLatestGroundingEntry` 无 entry 时返 `null`，`recordPcvLlmOutput`/`recordPcvToolRoundOutcome` 遇 null 直接 early-return（`:434`/`:478`），不会因缺 entry 崩溃。
- sourceRef 归一化失败不丢弃信息而是转成诊断（active→sourceRefs，ambiguous/missing→diagnostics+missingLinkReasons），下游可据此判断证据链完整度。
- 所有集合都有封顶（80/32/24/8/12），防止大 artifact 或恶意长文本撑爆内存；`collectSourceRefs` 命中上限即刻返回。
- 类型守卫遍地（`asRecord`/`stringValue`/`numberValue`/`isPcvNodeEvidenceSummary`），对 AI 输出与宿主事件这类不可信输入先归一化再入流，契合仓库 CLAUDE.md「外部输入/AI 输出/tool result 先验证归一化」的规则。

值得注意：本模块**没有** cancel/timeout/abort 处理——那些由 `AgentRuntime` 主循环（`ctx.abortSignal`）负责；证据引擎只在被调到的节点上采集，abort 时主循环直接 return，未采集的节点自然缺链，由 `missingLinkReasons` 如实反映。

### 集成点小结

- **上游调用方**：`LoopContext`（构造播种 + buildResult 聚合）、`AgentRuntime`（4 个采集点 + 2 个投影点 + guard 短路）、`insightGate`（质量门证据）、`AnalyzeGroundingGuard`（只读 `getLatestPcvBurnGrounding`）、`LLMInputAssembly`（借 `extractSourceRefsFromValue`）。
- **下游承接**：loop 返回值 `pcvNodeEvidence`（完整 summary）、process event metadata（精简 metadata，经 Dashboard/trace）、质量门 artifact（挂回 `pcvNodeEvidence` + metadata ref）。
- **跨子系统依赖**：仅从 `#tools/kernel` type-import `ToolResultEnvelope`（`:2`），从同目录 type-import `LLMInputAssembly`/`LoopContext`。**不直接依赖 `@alembic/core`**——它消费的所有 canonical 身份/scope 索引都是通过 `LoopContext.context`/`sharedState` 由上游编排方注入的鸭子类型数据，本模块只做结构化提取，契合 Agent 仓库「只保留 AI/tool/host adapter orchestration，不复制 Core 能力」的边界。

### 值得记录的设计决策

1. **observe-only 是刻意的架构收敛（AP-1~AP-4）**：证据层与控流层严格分离，消除了历史上「把决策写进 PCV burn 再读回」的读写往返耦合；enforcement 默认关，guard 单向只读消费。
2. **sourceRef 反伪指标（`:458-459`）**：明确 outputSourceRefs 只作审计、不作成功指标，源于一次真实的 AI 把伪指标当进展导致资源浪费的教训。
3. **内容寻址 ref + 稳定序列化**：保证证据可去重、可回放、跨轮幂等。
4. **密钥安全内建**：遍历与 stats 双重 `isSecretLikeKey` 过滤，符合「不把 token/密钥写入证据/文档」的硬规则。
5. **schemaVersion + additive 演进**：`groundingEnforcement` 等新字段纯 additive，schemaVersion 不变，老消费者忽略即可，兼容平滑。


## S05 · Profiles · Presets · Capabilities · Policies (声明式配置层)

本章剖析 AlembicAgent 的**声明式配置层**——把"一次 Agent 运行需要哪些能力、用什么编排策略、受什么约束"从命令式装配代码里抽出来，变成可序列化、可注册、可编译的声明数据。核心命题写在 `src/agent/profiles/presets.ts:5`:

> 核心思想: Agent 不分"类型"，只有"配置"。Preset 是 Capability + Strategy + Policy 的命名组合。

这一层不执行任何 AI 调用，它只回答一个问题:给定一个 `profile`,应当组装出一个怎样的 `AgentRuntime`。真正的执行发生在 runtime/strategy/tools 层(见 crossRefs)。本章覆盖四个协作子系统:**Presets**(硬编码的基线组合)、**Profiles**(可注册的声明式定义 + 编译器)、**Capabilities**(能力注册表)、**Policies**(预算/安全/质量三类约束 + 编排引擎)。

---

### S05.1 · 分层与数据流总览

声明式配置层有两条并行的"配置来源",最终都收敛到 `AgentRuntimeBuilder.build`:

1. **Preset 路径(基线)**:`PRESETS`(`presets.ts:144`)是三个 `Object.freeze` 的硬编码组合(`chat`/`insight`/`evolution`),内含**函数**(policy factory、`promptBuilder`、`merge`),因此**不可序列化**,只能存在于代码里。
2. **Profile 路径(声明)**:`BUILTIN_PROFILES`(`definitions/index.ts:12`)是 11 个纯数据 `AgentProfileDefinition`,**强制可序列化**(`AgentProfileRegistry.ts:39` 用 `JSON.stringify` replacer 拒绝 function/Set/Map),每个 profile 用 `basePreset` 指向一个 Preset,再用 `defaults`/`strategy`/`concurrency` 声明覆盖项。

编译与装配的完整链路(真实调用链):

```
AgentRun 包装层 (src/agent/runs/*/*.ts)         // 每个业务入口引用一个 profile id
  └─ AgentService.run(input)                     // AgentService.ts:45
       ├─ AgentProfileCompiler.compile(profile)  // → CompiledAgentProfile  (AgentProfileCompiler.ts:34)
       │    ├─ AgentProfileRegistry.get(id)       // 取声明定义
       │    ├─ AgentStageFactoryRegistry.build()  // pipeline stages 惰性构造
       │    └─ compilePolicyDeclarations()        // {type:'budget'} → new BudgetPolicy
       ├─ AgentRunCoordinator.canCoordinate/run   // fanout profile 走并发子运行 (AgentService.ts:54)
       └─ AgentRuntimeBuilder.build(compiled)     // AgentRuntimeBuilder.ts:66
            ├─ getPreset(basePreset, runtimeOverrides)  // presets.ts:437 展开 Preset + overrides
            ├─ CapabilityRegistry.create(name)          // 能力字符串 → Capability 实例
            ├─ resolveStrategy(strategyConfig)          // 声明 → Strategy 实例 (presets.ts:393)
            └─ new PolicyEngine(resolvedPolicies)       // policy 数组 → 编排引擎
                 └─ new AgentRuntime({...})             // 组装完成,可执行
```

关键设计:`CompiledAgentProfile` 是两条路径的**交汇契约**。Profile 路径编译成它,Preset 路径也可以被 `normalizeProfile`(`AgentRuntimeBuilder.ts:116`)从三种输入形态(`AgentProfileRef` / `AgentProfileOverride` / `CompiledAgentProfile`)归一成 `{ presetName, overrides }`。因此 `AgentRuntimeBuilder` 只认 `basePreset + runtimeOverrides` 两个字段,把"声明的复杂度"完全挡在编译器里。

---

### S05.2 · Presets:三个基线组合

`PRESETS`(`presets.ts:144`)是唯一持有**可执行装配细节**的地方(prompt builder、gate evaluator、policy factory)。三个 preset:

#### chat(`presets.ts:147`)
- `capabilities: ['conversation', 'code_analysis']`
- `strategy: { type: 'single' }` → 单轮工具循环
- `policies`: 一个 `BudgetPolicy` **工厂函数**(maxIterations 8、maxTokens 4096、temperature 0.7、timeoutMs 120s)
- `persona: { role:'assistant' }`;`memory: { enabled:true, mode:'user', tiers:['working','episodic','semantic'] }` —— 唯一开启记忆的 preset。
- 用途:Dashboard / HTTP 常规对话。

#### insight(`presets.ts:183`)—— 深度分析 + 知识产出的核心 preset
这是全仓最复杂的声明。`strategy` 是一条 4-stage **PipelineStrategy**(`type:'pipeline'`, `maxRetries:1`):

1. **analyze**(`presets.ts:193`):`capabilities:['code_analysis']`,`systemPrompt=ANALYST_SYSTEM_PROMPT`,`promptBuilder=buildAnalystPrompt`(11 个位置参数,全部从 `strategyContext` 里取运行时数据:dimConfig/projectInfo/sessionStore/semanticMemory/codeEntityGraph/rescanContext/panorama/…),`retryPromptBuilder` 把上一轮 reply + 质检失败原因拼进去。budget: iter/temperature 0.4/timeout 480s + session token 上限。
2. **quality_gate**(`presets.ts:231`):`gate.evaluator=insightGateEvaluator`,`maxRetries:1` —— 三态门(pass/retry/degrade)。
3. **produce**(`presets.ts:239`):`capabilities:['knowledge_production']`,透传完整 `PRODUCER_BUDGET`(searchBudget/maxSubmits/softSubmitLimit/idleRoundsToExit,供 ExplorationTracker 精确控制 PRODUCE→SUMMARIZE),`timeoutMs=PRODUCER_TIMEOUT_MS=900s`(`presets.ts:65`)。`retryBudget` 在拒绝率高时缩预算(5 iter/300s),`retryPromptBuilder` 统计上一轮被 `knowledge` 工具拒绝的提交数并给出结构化修复要求(content.markdown≥200 字符含代码块、必填 rationale/来源标注/kebab-case trigger 等)。`skipOnDegrade:true`。
4. **rejection_gate**(`presets.ts:294`):`gate.evaluator=producerRejectionGateEvaluator`,监控 Producer 拒绝率,`skipOnDegrade:true`。

`insight.policies` 声明了**两个** policy 工厂:`BudgetPolicy`(iter 24/temp 0.3/timeout 3600s)+ `QualityGatePolicy`(minEvidenceLength 500/minFileRefs 3/minToolCalls 3)。`memory:{enabled:false}` —— 显式声明"无状态 worker"。
注释(`presets.ts:180`)点明:bootstrap-dimension profile 通过 `AgentStageFactoryRegistry` 按需覆盖这些 stage;`onToolCall` 由 orchestrator 按维度注入(闭包引用 ActiveContext)。

#### evolution(`presets.ts:333`)—— 衰退 Recipe 进化决策
`strategy` 是 2-stage pipeline:
1. **evolve**(`presets.ts:342`):`capabilities:['evolution_analysis']`,`buildEvolverPrompt`,`decisionOnlyOnRetry:true`,`retryPromptBuilder=buildEvolutionRetryPrompt`(`presets.ts:104`,强制只调用 `knowledge.manage`,禁止再探索,列出待补决策 Recipe ID)。
2. **evolution_gate**(`presets.ts:356`):`evolutionGateEvaluator`,`useCumulativeToolCalls:true`,`maxRetries:8`(远高于其他门,因为进化是逐条决策补写)。
`policies`:单个 `BudgetPolicy`(iter 16/timeout 180s)。`memory:{enabled:false}`。

**Preset 解析器**:
- `resolveStrategy(strategyConfig)`(`presets.ts:393`):声明 `{type}` → Strategy 实例。支持 `single`→`SingleStrategy`、`pipeline`→`PipelineStrategy({stages,maxRetries})`、`fan_out`→`FanOutStrategy`(递归解析 `itemStrategy`)、`adaptive`→`AdaptiveStrategy`。未知 type 抛错。`null` 回落 `SingleStrategy`。
- `getPreset(presetName, overrides={})`(`presets.ts:437`):按名取 preset(不存在则抛出含可用列表的错误),做浅合并 + persona/memory 深合并,`capabilities`/`policies` 用 `overrides.x || preset.x` 覆盖优先,最后 `merged.strategyInstance = resolveStrategy(...)`。**关键语义**:`policies` 是整体替换而非合并——一旦 override 提供了 policies,preset 自带的 `QualityGatePolicy` 就被丢掉(见 S05.6 的"质量门实际生效范围")。

---

### S05.3 · Profiles:声明式定义 + 三个注册表

#### AgentProfileDefinition 数据模型(`AgentRunContracts.ts:60`)
纯数据结构,字段:`id`、`title`、`serviceKind`(5 值枚举 `AgentRunContracts.ts:30`:conversation/system-analysis/knowledge-production/translation/background-analysis)、`lifecycle`(active/experimental/deprecated)、`basePreset`、`defaults`(skills/policies/persona/memory/actionSpace)、`strategy`(`AgentStrategyTemplate` 或裸对象)、`projection`(投影器名,决定结果如何解析,如 `scan-recipes`/`json-object`/`agent-result`)、`concurrency`(`AgentConcurrencyPlan`)。

`AgentStrategyTemplate`(`AgentRunContracts.ts:45`)四态:`{type:'preset'}`(用 basePreset 自带策略)/`{type:'single'}`/`{type:'pipeline';factory}`(命名工厂惰性建 stage)/`{type:'fanout';childProfile,partitioner,merge}`。

`AgentActionSpace`(`AgentRunContracts.ts:84`)三态:`{mode:'none'}`(禁工具)/`{mode:'listed';toolIds}`(白名单)/`{mode:'all';reason}`(全放开需给理由)。

#### AgentProfileRegistry(`AgentProfileRegistry.ts:4`)
- 构造时默认注入 `BUILTIN_PROFILES`,以 `id` 建 `Map`。
- `register` 强制 `assertSerializableProfile`(`AgentProfileRegistry.ts:39`):`JSON.stringify` + replacer,遇 function 抛 `must not contain functions`,遇 Set/Map 抛错。**这是声明式与命令式的硬边界**——profile 定义里绝不能夹带闭包,凡是需要函数的(prompt builder、gate)都必须走 Preset 或 StageFactory。
- `get`(容错返 null)/`require`(缺失抛错)/`list`。

#### AgentStageFactoryRegistry(`AgentStageFactoryRegistry.ts:20`)
解决"pipeline 需要函数,但 profile 不能存函数"的矛盾:profile 只声明 `strategy.factory` 字符串,编译时由该注册表**惰性构造**含函数的 stage 数组。构造时 `registerDefaults` 注册三个工厂:
- **`scanPipeline`**(`:52`):按 `params.task`(summarize/extract)取 `SCAN_TASK_CONFIGS`,调 `buildScanPipelineStages`,analyze 迭代数按 task 分档(summarize 12 / extract 24)。
- **`relationsPipeline`**(`:68`):直接 `buildRelationsPipelineStages()`。
- **`bootstrapDimensionPipeline`**(`:69`)—— 最复杂的工厂,是冷启动/深挖/模块挖掘共用的动态装配核心。它**复用** `PRESETS.insight.strategy.stages` 和 `PRESETS.evolution.strategy.stages`,再按 params 动态裁剪:
  - `needsCandidates===false` → 只返回 `[analyzeStage]`(纯分析,不产出候选)。
  - `hasExistingRecipes && !prescreenDone` → 前置插入 evolution 的 evolve+gate 两 stage 做预筛,再接 analyze→gate→produce→rejection 全链(6 stage)。
  - 默认 → `[analyze, quality_gate, produce, rejection_gate]`(4 stage)。
  - 每个 stage 通过 `@alembic/core/host-agent-workflows` 的 `resolveBootstrapTerminalToolset`/`getBootstrapStageTerminalTools`/`buildBootstrapTerminalPolicyHints` 注入**终端工具能力**和 `toolPolicyHints`(把 `withTerminalPromptContext` 包进 promptBuilder)。
  - `rescanContext.gap/createBudget`(从 `context.strategyContext` 取)会覆写 produce stage 的 `maxSubmits/softSubmitLimit`——增量 rescan 时只产出缺口数量的候选。
  - `memoryCoordinator.allocateBudget('producer')` 在 produce promptBuilder 内调用,把记忆预算分配延迟到真正产出阶段。
- `build(name, input)`=`resolve(name)(input)`;`resolve` 缺失抛 `Unknown agent stage factory`。

#### AgentProfileCompiler(`AgentProfileCompiler.ts:25`)—— 声明→可执行的核心编译器(294 行)
构造依赖 `profileRegistry` + `stageFactoryRegistry`。`compile`(`:34`)按输入形态三路分发:
1. `isCompiledProfile` → 已编译,原样返回(幂等)。
2. `'basePreset' in input` → `#compileOverride`(`:61`):把 `AgentProfileOverride` 直接映射成 `CompiledAgentProfile`,`serviceKind` 固定 `system-analysis`,`actionSpace` 缺省 `{mode:'listed',toolIds:[]}`,policies 走 `compilePolicyDeclarations`。
3. 否则 → `#compileRef`(`:47`):有 `id` 且注册表命中 → `#compileDefinition`;否则回落 `#compilePresetRef`(裸 preset 名 → 最小 CompiledAgentProfile,`serviceKindForPreset` 映射:chat→conversation、evolution→system-analysis、其余→knowledge-production,`AgentProfileCompiler.ts:284`)。

`#compileDefinition`(`:108`)是主路径:
- `mergeParams(defaultParamsForProfile(id), inputParams)`:`scan-summarize`/`scan-extract` 注入默认 `task`(`:254`)。
- `resolveActionSpace`(`:207`):**特例** `signal-analysis` 且 `params.mode==='auto'` → 放开 `['suggest_skills','create_skill']`;否则用 `defaults.actionSpace`。
- `compileStrategy`(`:150`):`{type:'preset'}`/`fanout` → `undefined`(交给 basePreset 或 coordinator);`{type:'pipeline'}` → `{type:'pipeline',maxRetries:1,stages: stageFactoryRegistry.build(factory)}`;`{type:'single'}` → `{type:'single'}`;裸对象原样透传。
- `compilePolicyDeclarations(resolvePolicyDeclarations(...))`:`resolvePolicyDeclarations`(`:214`)对 `evolution-audit` **动态计算**预算——`maxIterations = min(recipes.length*4+10, 120)`,maxTokens 8192,timeout 600s;其余用 `defaults.policies`。`compilePolicyDeclarations`(`:181`)把 `{type:'budget',...}` new 成 `BudgetPolicy`,`{type:'safety'}` new 成 `SafetyPolicy`(无参),其它原样。
- `resolveConcurrencyPlan`(`:233`):`params.concurrency` 为正数时覆写并 `Math.floor`。
- 产出 `CompiledAgentProfile`,含 `runtimeOverrides = stripUndefined({capabilities:skills, strategy, policies, persona, memory})`——这正是 `AgentRuntimeBuilder.normalizeProfile` 要取的 overrides。

**设计要点**:编译器把"声明里的字符串/枚举/数字"解释成"运行时对象/函数",且所有分支耦合逻辑(evolution-audit 动态预算、signal-analysis auto 模式、scan task 默认)集中在这里,而非散落在业务入口。

---

### S05.4 · 11 个内置 Profile 逐项清单

`BUILTIN_PROFILES`(`definitions/index.ts:12`)按域聚合。下表逐一列出各自声明:

| id | title / serviceKind / lifecycle | basePreset | strategy | actionSpace | policies(budget 摘要) | projection | 关键声明 |
|---|---|---|---|---|---|---|---|
| `chat-default`(`chat.profile.ts:4`) | Default Chat / conversation / active | chat | `{type:'preset'}` | listed [] | 继承 chat preset(iter8/120s) | `chat-reply` | 唯一开记忆的对话 profile |
| `scan-extract`(`scan.profile.ts:19`) | Scan Extract / knowledge-production / active | insight | pipeline `scanPipeline` | none | iter30/8192/temp0.3/3600s | `scan-recipes` | 默认 param `task=extract` |
| `scan-summarize`(`scan.profile.ts:29`) | Scan Summarize / knowledge-production / active | insight | pipeline `scanPipeline` | none | 同上(共用 `scanDefaults`) | `scan-recipes` | 默认 param `task=summarize` |
| `relation-discovery`(`relation.profile.ts:3`) | Relation Discovery / knowledge-production / active | insight | pipeline `relationsPipeline` | none | iter28/8192/temp0.3/420s | `relation-discovery` | skills=[knowledge_production, code_analysis] |
| `evolution-audit`(`evolution.profile.ts:4`) | Evolution Audit / system-analysis / active | evolution | `{type:'preset'}` | none | **动态** min(n*4+10,120)/8192/600s | `evolution-audit` | skills=[evolution_analysis] |
| `plan-selection`(`plan.profile.ts:4`) | Plan Selection / system-analysis / active | chat | `{type:'single'}` | none | iter2/temp0.1/120s | `json-object` | skills=[];长 persona(只输出纯 JSON、不访问工具、dimensions/scale/moduleBindings 硬约束) |
| `translation-json`(`translation.profile.ts:3`) | Translation JSON / translation / active | chat | `{type:'single'}` | none | iter1/temp0.2/120s | `json-object` | persona=技术翻译,输出 `{summaryEn,usageGuideEn}` |
| `signal-analysis`(`signal.profile.ts:3`) | Signal Analysis / background-analysis / active | chat | `{type:'single'}` | none(auto 模式放开) | iter8/temp0.4/120s | `agent-result` | 编译期特例:mode=auto → 放行 suggest_skills/create_skill |
| `bootstrap-session`(`bootstrap.profile.ts:4`) | Bootstrap Session / system-analysis / **experimental** | insight | **fanout**(child `bootstrap-dimension`, partitioner `bootstrapSessionDimensions`, merge `bootstrapSessionResults`) | none | 继承 insight | `agent-result` | concurrency tiered,env `ALEMBIC_BOOTSTRAP_CONCURRENCY` 默认 2,abortPolicy `finish-tier` |
| `bootstrap-dimension`(`bootstrap.profile.ts:30`) | Bootstrap Dimension / system-analysis / experimental | insight | pipeline `bootstrapDimensionPipeline` | none | 继承 insight | `agent-result` | fanout 子单元,stage 动态裁剪 |
| `module-mining-session`(`ProjectIndexModuleMiningProfile.ts:4`) | Project Index Scoped Module Mining Session / system-analysis / experimental | insight | **fanout**(child `module-mining-dimension`, partitioner `projectContextModules`, merge `moduleMiningResults`) | none | 继承 insight | `agent-result` | persona 强调 fan-out 单元只能来自 params.modules,不从 dimension 推导 |
| `module-mining-dimension`(`ProjectIndexModuleMiningProfile.ts:34`) | …Dimension / system-analysis / experimental | insight | pipeline `bootstrapDimensionPipeline` | none | 继承 insight | `agent-result` | persona:单模块 child,不得写 repository/ledger/共享状态 |

**清单笔记**:
- `plan-selection`(`plan.profile.ts:16`)的 persona 是全仓最长的声明式约束——把"计划选择 Agent"的输出契约(纯 JSON、moduleBindings 只能来自 ProjectContext facts、每个 binding.dimensions 是本次 dimensions 子集且非空、coldStart 兼容空 bindings)全部写进 persona 文本,配合 `iter:2` 的极窄预算,实现"无状态、不猜、单轮决策"。
- 两对 session/dimension profile(bootstrap、module-mining)是同一模式:**session=fanout 分区器**,**dimension=真正跑 pipeline 的子单元**,共用 `bootstrapDimensionPipeline` 工厂。分区器/合并器名字在 `AgentRunCoordinator` 注册(`AgentRunCoordinator.ts:26-29`)。
- `module.profile.ts`(4 行)只是 re-export `ProjectIndexModuleMiningProfile` 的 barrel,无独立定义。
- 消费方(真实调用链):每个业务 profile 由 `src/agent/runs/*/` 下的 AgentRun 包装器引用(如 `PlanAgentRun.ts:20` `profile:{id:'plan-selection'}`、`ScanAgentRun` 引 scan-*、`EvolutionAgentRun` 引 evolution-audit、`RelationAgentRun` 引 relation-discovery、`TranslationAgentRun` 引 translation-json、`ProjectIndexModuleMiningAgentRun` 引 module-mining-session),再交 `AgentService.run`。`bootstrap-session`/`chat-default`/`bootstrap-dimension` 通过外部宿主编排(Core host-agent-workflows)或 `childProfile` 配置字符串间接触发,故 src 内直接字面量命中为 0。

---

### S05.5 · Capabilities:能力注册表

**Capability** 是"一组工具 + 一段 prompt 片段 + 步骤钩子"的封装。基类 `Capability`(`src/tools/runtime/capabilities/Capability.ts:1`)只定义接口约定:
- `get name`(子类必实现,否则抛错)、`get promptFragment`(子类必实现)、`get tools()`(默认 `[]`)。
- `buildContext(ctx)`(默认返 null)、`onBeforeStep(stepState)` / `onAfterStep(stepResult)`(默认空)——runtime 在每次工具循环前后调用(`AgentRuntime.ts:699` 遍历 `ctx.capabilities` 调 `cap.onBeforeStep`)。

**CapabilityRegistry**(`capabilities/CapabilityRegistry.ts:12`)是一个字面量对象(非 class),内含 `_registry: Map<string, CapabilityConstructor>`,注册 7 个能力:

| 能力字符串 | 实现类(来自 `#tools/runtime/capabilities/`) |
|---|---|
| `conversation` | `Conversation` |
| `code_analysis` | `BootstrapAnalyze` |
| `knowledge_production` | `BootstrapProduce` |
| `scan_production` | `ScanProduce` |
| `scan_analyze` | `ScanAnalyze` |
| `system_interaction` | `System` |
| `evolution_analysis` | `Evolution` |

- `create(name, opts)`(`:23`):缺失抛 `Unknown capability`,否则 `new Cls(opts)`。
- `register(name, cls)`(`:31`):运行时可扩展。
- `get names`:能力字符串列表。

`capabilities/index.ts` 额外用**语义别名**再导出(`CodeAnalysis`=BootstrapAnalyze、`KnowledgeProduction`=BootstrapProduce、`SystemInteraction`=System、`EvolutionAnalysis`=Evolution、`ScanProduction`=ScanProduce),对应任务标题里的 "Conversation/CodeAnalysis/KnowledgeProduction/SystemInteraction" 四大类。

**消费点**:`AgentRuntimeBuilder.build`(`AgentRuntimeBuilder.ts:72`)把 `preset.capabilities`(字符串数组)逐个 `CapabilityRegistry.create(name, this.#getCapabilityOpts(name))`。`#getCapabilityOpts`(`:105`)注入 `container`/`memoryCoordinator`/`projectBriefing`/`projectRoot`(`system_interaction` 额外再给一次 projectRoot)。注意:profile 声明里 capabilities 来源有两条——preset 自带(`insight.capabilities`)或 `definition.defaults.skills` 经 `runtimeOverrides.capabilities` 覆盖(`normalizeProfile` 里 `skills → capabilities` 改名,`AgentRuntimeBuilder.ts:128`)。

---

### S05.6 · Policies:约束模型 + 编排引擎

Policy 是运行时**约束**,分三个生命周期钩子(命令式基类 `Policy`,`policies/Policy.ts:22`):`validateBefore(context)`(执行前)、`validateDuring(stepState)`(每轮工具循环)、`validateAfter(result)`(执行后)、`applyToConfig(config)`(把自身注入配置)。三个具体 policy:

#### BudgetPolicy(`BudgetPolicy.ts:14`)—— 预算/停机
构造字段:`maxIterations`(默 20)、`maxTokens`(4096)、`timeoutMs`(300s)、`temperature`(0.7)、`maxSessionTokens`/`maxSessionInputTokens`(会话级累计 token 上限,undefined=无限)。
- `validateDuring`(`:67`):四条停机规则,任一触发返 `{ok:false,action:'stop',reason}`:①`iteration >= maxIterations` ②`Date.now()-startTime > timeoutMs` ③`totalTokens >= maxSessionTokens` ④`totalInputTokens >= maxSessionInputTokens`。
- `applyToConfig`(`:108`):把 budget 对象合并进 config。
- getter 全套暴露给 `PolicyEngine.getBudget`(`PolicyEngine.ts:58`)。

#### SafetyPolicy(`SafetyPolicy.ts:11`)—— 命令/路径/发送者/审批
静态常量:`DANGEROUS_COMMANDS`(9 条正则:`rm -rf /`、`sudo`、`mkfs`、`dd if=`、`shutdown|reboot|halt`、`>/dev/`、`curl|bash`、`chmod 777`、`passwd`、`killall`)、`SAFE_COMMANDS`(只读命令白名单)。构造项:`fileScope`(路径根)、`allowedSenders`、`commandBlacklist`(与静态黑名单合并)、`requireApprovalFor`。
- `validateBefore`(`:71`):若配了 `allowedSenders`,校验 `context.message.sender.id` 在名单内,否则拒。
- `checkCommand`(`:81`):黑名单正则命中即 `{safe:false}`。
- `checkFilePath`(`:90`):`isWithinPathScope`(`:115`,用 `path.relative` 判断是否越界)。
- `needsApproval(toolName)`:命中 `requireApprovalFor`。
- `applyToConfig`:把自身塞进 `config.safetyPolicy`。

#### QualityGatePolicy(`QualityGatePolicy.ts:10`)—— 产出质量软门
构造项:`minEvidenceLength`(500)、`minFileRefs`(3)、`minToolCalls`(2)、可选 `customValidator`。
- `validateAfter`(`:33`):累积 `reasons`——①`reply.length < minEvidenceLength` ②若没有 `knowledge` 提交调用则按正则 `/[\w/-]+\.\w{1,6}/g` 数文件引用,不足 minFileRefs 记原因 ③`toolCalls.length < minToolCalls` ④customValidator。有原因返 `{ok:false,reason}`。
- `toGateConfig`:导出门配置。

#### PolicyEngine(`PolicyEngine.ts:5`)—— 编排引擎
持有 `Policy[]`,提供:
- `validateBefore/During/After`(`:20/:30/:40`):**短路顺序执行**——遍历所有 policy,第一个 `!ok` 立即返回;during 默认 `{ok:true,action:'continue'}`。
- `get(PolicyClass)`(`:16`):按类型取实例(`instanceof` 过滤),用于 `getBudget`(`:58`)取 BudgetPolicy、`validateToolCall`(`:72`)取 SafetyPolicy。
- `applyToConfig`(`:50`):链式让每个 policy 改写 config。
- `validateToolCall(toolName, args)`(`:72`)—— 工具级安全裁决:仅当存在 SafetyPolicy 时生效。对 `terminal`(`formatTerminalExecForSafetyPolicy` 拼 bin+args 后查黑名单)、`write_project_file`(查 filePath 越界)、`code`(抽 path/filePath/filePaths 逐个查越界)做路径/命令拦截,再查 `needsApproval`。其函数签名结构性匹配 `src/tools/kernel/context.ts:81` 的 `ToolPolicyDecision` 契约,即 PolicyEngine 可作为工具执行层的策略裁决器注入。

**Runtime 侧的真实钩子点**(`AgentRuntime.ts`):
1. 执行前 `this.policies.validateBefore(...)`(`:269`)——拒则直接返回 `⚠️ reason` + `policy_rejected` 诊断,不进 strategy。
2. 取 `getBudget().timeoutMs`(`:288`)建 `AbortController` + timeoutPromise 做**超时保护**(与 `Promise.race`)。
3. 工具循环内 `validateDuring`(`:687`)传 `iteration/startTime/totalTokens/totalInputTokens`,`!ok` 则退出循环(与 tracker/timeout 并列作为退出控制器)。
4. 执行后 `validateAfter`(`:328`)——注意这里是**软门**:失败只写 `result.qualityWarning` + `quality_warning` 诊断,**不阻断结果返回**。
5. `getBudget()`(`:551`)在缺省时提供保底 `{iter20,tokens4096,temp0.7}`,并经 `SystemPromptBuilder.injectBudget` 注入系统 prompt。

**编译期 policy 装配**:`compilePolicyDeclarations`(`AgentProfileCompiler.ts:181`)把声明 `{type:'budget'}`→`BudgetPolicy`、`{type:'safety'}`→`SafetyPolicy()`(**无参**)。因此:声明式 profile 目前只能装配到**默认空配置**的 SafetyPolicy——`fileScope`/`allowedSenders`/`requireApprovalFor` 均为空,即路径/发送者裁决在纯声明路径下休眠,只有静态 `DANGEROUS_COMMANDS` 命令黑名单始终生效。全仓 `new SafetyPolicy` 唯一站点就是 `AgentProfileCompiler.ts:194`。这是一处**值得记录的边界事实**:SafetyPolicy 的细粒度作用域能力已实现但当前声明层未喂参数。

**质量门实际生效范围**(重要语义):`QualityGatePolicy` 只在 `PRESETS.insight.policies`(`presets.ts:315`)里声明。而所有走 profile-definition 路径的 insight 派生 profile(scan-*/relation/bootstrap/module-mining)在 `#compileDefinition` 里都产出了自己的 `runtimeOverrides.policies`(通常只有 BudgetPolicy)。由于 `getPreset` 里 `policies: overrides.policies || preset.policies` 是**整体替换**,这些 profile 会用自己的 BudgetPolicy 覆盖掉 preset 的 [Budget+QualityGate],即 `QualityGatePolicy.validateAfter` 的软质检**只对裸 `{preset:'insight'}` 引用生效**;pipeline 内部的质量把关改由 stage 的 `quality_gate`/`rejection_gate`(gate evaluator)承担。这是"policy 软门"与"pipeline gate 三态门"两套质量机制的分工。

---

### S05.7 · 采用的设计模式与关键决策

- **声明式配置 + 编译器**:profile 是纯数据,`AgentProfileCompiler` 是解释器,把枚举/字符串/数字翻译成对象/函数/策略实例。所有条件耦合(evolution-audit 动态预算、signal auto 放行、scan task 默认)集中在编译器。
- **注册表模式 × 3**:`AgentProfileRegistry`(定义)/`AgentStageFactoryRegistry`(含函数的 stage 惰性工厂)/`CapabilityRegistry`(能力类)。三者都支持运行时 `register` 扩展。
- **序列化边界作为硬约束**(`AgentProfileRegistry.ts:39`):profile 禁函数/Set/Map,倒逼所有闭包下沉到 Preset 或 StageFactory,保证 profile 可跨进程/可持久化/可日志化。
- **Preset 复用 + StageFactory 动态裁剪**:`bootstrapDimensionPipeline` 直接引用 `PRESETS.insight/evolution` 的 stage 再按 params 组合(4 或 6 stage),避免重复声明,同时保留按维度覆盖 budget/prompt 的能力。
- **CompiledAgentProfile 作为唯一交汇契约**:三种输入形态经 `normalizeProfile` 归一,`AgentRuntimeBuilder` 只认 `basePreset + runtimeOverrides`。
- **策略分工**:声明 `strategy.type` → `resolveStrategy` → Strategy 实例;fanout 不产 Strategy 而交 `AgentRunCoordinator`(canCoordinate 判定 `concurrency.mode!=='none'`,partitioner/merger 按名解析,tiered 并发受 env 变量控制)。
- **软门 vs 硬门**:policy 层是"预算=硬停机 / 安全=硬拦截 / 质量=软告警",pipeline gate 层是"三态门(pass/retry/degrade)+ skipOnDegrade"。质量把关重心在 pipeline gate。

**配置/开关/环境变量**:`ALEMBIC_BOOTSTRAP_CONCURRENCY`(默 2,`bootstrap.profile.ts:21`)、`ALEMBIC_MODULE_MINING_CONCURRENCY`(默 2,`ProjectIndexModuleMiningProfile.ts:26`),经 `AgentConcurrencyPlan.concurrency={env,default}` 声明,`resolveConcurrency`(`AgentRunCoordinator.ts:246`)解析。`params.concurrency`(正数)可在编译期覆写(`AgentProfileCompiler.ts:233`)。

**错误/回退/降级路径**:注册表 `resolve`/`require`/`create` 缺失均抛含名字的 Error;`resolveStrategy` 未知 type 抛错;`getPreset` 未知 preset 抛出含可用列表的错误;policy before-check 拒绝返回 `⚠️` 占位 reply(不抛);质量 after-check 失败降级为 `qualityWarning`(不阻断);超时经 `AbortController` + `Promise.race` 触发 `Agent timeout` Error;fanout `abortPolicy:'finish-tier'` 允许当前 tier 跑完再停。

**跨子系统依赖(@alembic/core 契约)**:`AgentStageFactoryRegistry.ts:1` 从 `@alembic/core/host-agent-workflows` 导入 `resolveBootstrapTerminalToolset`/`getBootstrapStageTerminalTools`/`buildBootstrapTerminalPolicyHints`——终端工具能力与 policy hints 的**真值来自 Core**,声明层只负责把它们编织进 bootstrap pipeline 的 stage/promptContext。


## S06 · Strategies · 编排策略 (Pipeline/FanOut/Adaptive/Single)

### 职责定位

Strategies 子系统是 AlembicAgent 的"编排层"(orchestration layer):它决定一次 Agent 运行**如何被拆解成一次或多次 LLM+Tool 交互**,以及交互之间**如何串接、并行、门控、重试与降级**。它本身**不执行**任何 LLM 调用或工具调用——真正的 ReAct 循环由 `AgentRuntime.reactLoop()` 承担。策略只负责"编排骨架",把每一段实际推理委托回 runtime。

这条边界在代码注释里说得很直白:`AgentRuntime.ts:11` 注释 `Strategy 的被委托者 (Strategy 调用 runtime.reactLoop())`,`AgentRuntime.ts:385` 注释 `核心 ReAct 循环。Strategy 调用此方法执行实际的 LLM + Tool 交互`。也就是说,**runtime 驱动 strategy 的选择,strategy 反过来驱动 runtime 的 reactLoop**,形成一次"倒置委托"(inversion of delegation)。

对应文件位于 `src/agent/strategies/`:
- `Strategy.ts` — 抽象基类与共享类型契约
- `SingleStrategy.ts` — 单轮(单次 reactLoop)
- `FanOutStrategy.ts` — 并行扇出(按 tier 分组并发)
- `AdaptiveStrategy.ts` — 自适应(按内容复杂度分派到 single/pipeline/fanOut)
- `PipelineStrategy.ts` — 顺序多阶段流水线(1100L,重点,含质量门控/重试/降级)
- `index.ts` — barrel 导出

### 对外 API / exports

`src/agent/strategies/index.ts:1-17` 导出四个具体策略类 `AdaptiveStrategy` / `FanOutStrategy` / `SingleStrategy`、抽象基类 `Strategy`,以及类型 `FanOutItem` / `ItemResult` / `StrategyResult` / `StrategyRuntime`。注意 `PipelineStrategy` **不在 barrel 里**——它由 `presets.ts` 直接 `import { PipelineStrategy } from '../strategies/PipelineStrategy.js'`(`presets.ts:50`)按需引入,而其余三者从 barrel 引入(`presets.ts:44-49`)。`index.ts:17` 还有一个 default export 对象 `{ Strategy, SingleStrategy, FanOutStrategy, AdaptiveStrategy }`。

策略的实例化统一走 `resolveStrategy(strategyConfig)`(`presets.ts:393`),它把声明式配置 `{ type: 'single'|'pipeline'|'fan_out'|'adaptive', ... }` 转成真实实例(见后文"集成点")。

### 抽象契约:`Strategy` 与共享类型

`Strategy.ts:36-48` 定义抽象基类。它只有两个成员,且默认实现都抛错,强制子类覆盖:

```ts
export class Strategy {
  get name(): string { throw new Error('Subclass must implement name'); }
  async execute(_runtime, _message, _opts?): Promise<StrategyResult> {
    throw new Error('Subclass must implement execute()');
  }
}
```

- `name`(`Strategy.ts:37`):策略标识符(`'single'`/`'pipeline'`/`'fan_out'`/`'adaptive'`),用于事件发布与日志。
- `execute(runtime, message, opts)`(`Strategy.ts:41`):唯一执行入口。三个参数分别是被委托的 runtime、统一消息 `AgentMessage`、以及策略特定选项 `opts`。

**关键类型契约**(`Strategy.ts:3-34`):
- `StrategyResult`(`Strategy.ts:3-9`):`{ reply, toolCalls, tokenUsage:{input,output}, iterations, [key]:unknown }`。索引签名允许策略挂载额外字段(如 pipeline 挂 `phases`/`degraded`/`diagnostics`,fanOut 挂 `itemResults`)。
- `StrategyRuntime`(`Strategy.ts:11-14`):**strategy 对 runtime 的最小依赖面**——只需要 `id: string` 与 `reactLoop(prompt, opts?): Promise<StrategyResult>`。这刻意收窄,使策略只知道"有个能跑 reactLoop 的东西",不感知 AgentRuntime 的其余细节。
- `FanOutItem`(`Strategy.ts:16-22`):扇出单元 `{ id, label, tier?, prompt?, guide? }`——`tier` 决定并发分组,`prompt`/`guide` 决定每项提示词。
- `ItemResult`(`Strategy.ts:24-34`):扇出单项结果,含 `status: 'completed'|'failed'` 与可选 `error`。

设计要点:策略之间**通过纯数据契约耦合**(`StrategyResult`/`ItemResult`),不共享可变实例状态;runtime 通过 `StrategyRuntime` 这个窄接口被引用。

### SingleStrategy — 单轮

`SingleStrategy.ts:4-20` 是最薄的策略:`name` 返回 `'single'`,`execute()` 直接把消息内容与历史/上下文转交给 `runtime.reactLoop()`:

```ts
return runtime.reactLoop(message.content, {
  history: message.history,
  context: message.metadata.context || {},
  ...opts,
});
```

它把 `opts` 展开透传(位置在最后,可覆盖 history/context)。适用场景:`chat` preset(`presets.ts:151` `strategy: { type: 'single' }`)——多轮对话、知识检索、代码问答等**一问一答**的交互。它同时是其它策略的默认"叶子":FanOut 的默认 `itemStrategy`(`FanOutStrategy.ts:32`)、Adaptive 的默认 `single`(`AdaptiveStrategy.ts:23`)都用它。

### FanOutStrategy — 并行扇出

**职责**:把一组 `items`(每个是一个"维度"/子任务)按 `tier` 分组,**同 tier 内并发**执行,**跨 tier 顺序**推进,最后合并所有 `ItemResult`。等价于 map-reduce 式并行分析,典型用于冷启动时"所有维度并行扫描"。

**构造与配置**(`FanOutStrategy.ts:30-35`):
- `#itemStrategy`(每个 item 用哪个子策略跑,默认 `new SingleStrategy()`)
- `#tiers`(`Record<string, { concurrency }>`,默认 `{ 1: { concurrency: 3 } }`)
- `#merge`(合并函数,默认 `FanOutStrategy.#defaultMerge`)

**控制流**(`FanOutStrategy.ts:41-122`):
1. 空 items 短路(`:45-52`),返回 `'No items to process'`。
2. `#groupByTier(items)`(`:124-134`)按 `item.tier || 1` 分组。
3. 按 tier 数值升序遍历(`:57-59` `.sort(([a],[b]) => Number(a)-Number(b))`)——**tier 是串行的**。
4. 每个 tier 取并发度 `tierConfig`(`:60`,回退链 `#tiers[tier] || #tiers[1] || { concurrency: 2 }`),发布 `fan_out_tier_start` 进度事件。
5. 用 `createLimit(concurrency)`(`shared/concurrency.ts:3`,一个信号量式并发闸)包住每个 item,`Promise.all` 并发跑(`:69-110`)。
6. 每个 item 用 `AgentMessage.internal(...)` 构造子消息(`:73-83`):prompt 取 `item.prompt`,否则拼 `${message.content}\n\n## 当前维度: ${item.label}\n${item.guide}`;metadata 里带 `dimension: item`,并记录 `parentAgentId: runtime.id`(形成父子 agent 谱系)。
7. 调 `#itemStrategy.execute(runtime, itemMessage, { dimension: item, abortSignal: opts.abortSignal })`(`:92`)。**成功**→ 标 `status:'completed'` 并展开 result(`:96`);**抛错**→ `catch (err:unknown)`(`:97`)吞掉异常,产出 `status:'failed'` 的兜底 `ItemResult`(`:98-106`)——**单项失败不阻断整个扇出**,这是核心的部分结果(partial result)路径。
8. tier 完成后发 `fan_out_tier_done`(`:113`),统计 completed/failed。
9. 全部 tier 跑完 → `this.#merge(allResults)`(`:121`)。

**默认合并**(`#defaultMerge`,`:136-156`):产出中文 `## 执行总结` 报告(完成/失败计数 + 每项 label 与 reply,失败项标 `❌` 加 `error`),`toolCalls` 用 `flatMap` 汇总,`tokenUsage` 用 `reduce` 累加,`iterations` 累加,并把原始 `itemResults` 挂在结果上供下游消费。

**并发模型要点**:tier 是"波次隔离"——低 tier 先跑完再进高 tier,可用于表达"先跑基础维度,再跑依赖维度";tier 内则用 `createLimit` 控住并发上限(默认 tier 1 = 3 路)。`abortSignal` 透传给每个 item,支持整体取消。

### AdaptiveStrategy — 自适应分派

**职责**:不自己跑推理,而是**按消息复杂度选一个子策略**再转发。是一个纯路由器(dispatcher)。

**构造**(`AdaptiveStrategy.ts:20-27`):持有 `{ single, pipeline, fanOut }`,`single` 必有(默认 `new SingleStrategy()`),`pipeline`/`fanOut` 可为 `null`。

**分类算法**`#assessComplexity(message, opts)`(`AdaptiveStrategy.ts:52-68`)——基于**关键词正则 + items 数量**的启发式:
1. `opts.items.length > 1` → `'fan_out'`(`:55`,有多个维度就并行)。
2. 文本命中 `冷启动|cold-start|bootstrap|全项目|所有.*维度|all.*dimensions` → `'fan_out'`(`:59`)。
3. 文本命中 `深度分析|扫描|审计|scan|deep analy|audit|知识提取|extract` → `'pipeline'`(`:63`)。
4. 否则 → `'single'`(`:67`)。

**分派**(`AdaptiveStrategy.ts:43-49`):
- `fan_out` 且 `fanOut` 已配置 → 用 fanOut;
- (`fan_out` 或 `pipeline`)且 `pipeline` 已配置 → 用 pipeline(**注意兜底逻辑**:若判为 `fan_out` 但没配 fanOut,会退到 pipeline);
- 否则 → single。

分派前发 `adaptive_classification` 进度事件(`:37-41`)。设计上 AdaptiveStrategy 是"策略的策略",让上层无需提前决定编排形态。当前 preset 中未见直接使用 `adaptive` 类型,但 `resolveStrategy` 完整支持它(`presets.ts:419-424`),可递归解析子策略。

### PipelineStrategy — 顺序多阶段流水线(重点)

**职责定位**(`PipelineStrategy.ts:1-18` 头注释):顺序多阶段执行,每阶段可有独立 Capability 与 Budget,阶段间可插入**质量门控(Quality Gate)**。作者明确对标 Anthropic 的 *Prompt Chaining* + *Evaluator-Optimizer* 模式。v3 增强:Gate 支持三态自定义 evaluator(pass/retry/degrade)、Gate 失败可回退重跑前一阶段、Stage 支持 `promptBuilder`/`systemPrompt`/`onToolCall`、per-stage 硬超时、阶段隔离(重置 ContextWindow/ExplorationTracker)。

#### 核心数据结构

- `PipelineStage`(`:81-109`):阶段定义。承载 `name`、`gate?`、`capabilities?`、`additionalTools?`、`promptBuilder?`/`retryPromptBuilder?`/`promptTransform?`、`systemPrompt?`、`onToolCall?`、`budget?`/`retryBudget?`、`skipOnDegrade?`/`skipOnFail?`、`submitToolName?`、`decisionOnlyOnRetry?`、`recordRepairOnly?`、`disableTracker?`、`toolChoiceOverride?`、`recordRepairEvidencePaths?`、`pipelineType?`、`source?`。**gate 阶段与执行阶段共用同一 `PipelineStage` 结构**,靠有无 `gate` 字段区分(`:220`)。
- `GateConfig`(`:60-78`):门控配置。`evaluator`(自定义三态评估函数)、`maxRetries`、一批 `recordRepair*` 参数、`useCumulativeToolCalls`、以及向后兼容的阈值字段 `minEvidenceLength`/`minFileRefs`/`minToolCalls`/`custom`。
- `PipelineContext`(`:112-123`):**阶段间流转的可变状态**——`phaseResults`(各阶段结果按 name 存)、`strategyContext`、`totalToolCalls`/`totalTokenUsage`/`totalIterations`(累计器)、`gateArtifact`(gate 产出的结构化制品,喂给下游 producer)、`degraded`(降级标志)、`diagnostics`、`execStageCount`、`lastExecutedStageName`(用于判断是否需要重置 ContextWindow)。
- `GateEvalResult`(`:125-130`):`{ action, pass, reason?, artifact? }`。

#### 顶层控制流 `execute()`(`:185-260`)

1. **组装上下文**(`:190-214`):从 `opts.systemRunContext`/`opts.strategyContext` 合成 `rawStrategyContext`,经 `expandSystemRunContext`(`runtime/SystemRunContext.ts`)展开;`DiagnosticsCollector.from(...)` 建诊断收集器;把 `abortSignal`、`diagnostics` 注入 `ctx.strategyContext`。初始化累计器与 `degraded=false`。
2. **主循环遍历 stages**(`:216-244`),用 `for (let i...)` **可回退索引**的形式:
   - 若 `stage.gate` 存在 → 进入门控分支(`:220-236`)。若已 `degraded` 则 `continue` 跳过所有 gate;否则调 `#processGate(...)` 拿动作:`'break'`→退出循环、`'continue'`→跳过、返回**数字** → 赋给 `i`(`i = gateAction`)实现**回退重跑**(下轮 `i++` 后落到目标阶段)。
   - 否则是执行阶段(`:238-243`):若 `degraded` 且未显式 `skipOnDegrade===false` 则 `continue` 跳过;否则 `#executeStage(...)`。
3. **收敛最终回复**(`:246-259`):`reply` 取 `phaseResults` 中**最后一个带 `reply` 的对象**(`:247-249`),连同 `phases`、`degraded`、`diagnostics.toJSON()` 一起返回。

#### 状态机:Quality Gate 三态 + record_repair + retry

`#processGate`(`:271-378`)是流水线的状态机核心。先 `#evaluateGateResult`(`:405-437`)算出 `action`,`#storeGateResult`(`:439-466`)把结果写入 `phaseResults` 并发 `quality_gate` 事件、失败时 `diagnostics.recordGateFailure`。然后按 `action` 分支:

- **`pass`**(`:288`)→ `'continue'`,流水线继续下一阶段。
- **`degrade`**(`:292-296`)→ 置 `ctx.degraded=true`、`diagnostics.markDegraded()`、返回 `'break'`。降级是**终止性**的:后续执行阶段整体跳过(除非阶段显式 `skipOnDegrade:false`)。
- **`record_repair`**(`:298-334`)→ 进入"记录补写"子流程:计数键 `_recordRepairRetries_<stage>` 自增,若 ≤ `maxRecordRepairRetries`(默认 1),调 `#runRecordRepairStage`(`:468-505`)——它临时合成一个 `recordRepairOnly` 的阶段(`additionalTools:['memory']`、`systemPrompt` 强制"只用 note_finding 记录已验证发现、禁止探索"、`toolChoiceOverride:'auto'`、短预算 90s/2048 token),用 `buildRecordRepairPrompt` 建提示,并从 gate artifact 抽取证据路径(`#extractRecordRepairEvidencePaths`,`:532-574`)。补写后**重新评估**门控;仍不过 → 显式合成 `degraded_no_findings` 门控结果、置降级、`'break'`(`:321-333` 注释:"宁可显式降级也不能让 Producer 基于缺失证据继续提交")。
- **`analysis_retry` / `retry`**(`:336-371`)→ 回退重跑:计数键 `_retries_<stage>` 自增,若 ≤ `maxRetries`(gate 级 `maxRetries` 优先,否则实例 `#maxRetries` 默认 1),用 `#findPrevExecStageIdx`(`:1078-1085`)找到最近的**非 gate 执行阶段**索引;先做**预算抑制检查** `#getRetryBudgetSuppression`(`:380-403`,若累计 input token 已达 `maxSessionInputTokens * retryBudgetExhaustedRatio`(默认 0.9)则合成 `degraded_budget_exhausted` 并降级 `'break'`);否则把 `_retryContext = { reason, artifact }` 写入 `phaseResults`、标 `_was_retry_<name>=true`,返回 `prevIdx - 1`(循环 `i++` 后正好回到目标阶段重跑)。重试次数耗尽时按 `skipOnFail`(默认视为 true)决定 `'break'` 还是 `'continue'`。
- **未知 action 兜底**(`:373-377`)→ 同样按 `skipOnFail` 决定 break/continue。

**门控评估两条路径**(`#evaluateGateResult`,`:405-437`):若 `gate.evaluator` 是函数,先 `#ensureGateActiveContext`(`:576-608`,门控缺 `activeContext` 时把 `trace` 别名过去并告警),可选把累计 toolCalls 注入源(`#withCumulativeToolCalls`,`:1063-1075`,`useCumulativeToolCalls` 用于 evolution gate 这类要看全程工具调用的场景),再调 evaluator;evaluator 未返回 `action` 时按 `pass` 补 `'pass'`/`'analysis_retry'`。若无 evaluator,走**向后兼容阈值模式** `#evaluateGate`(`:1026-1061`,检查 `minEvidenceLength`/`minFileRefs`(正则数文件引用)/`minToolCalls`/`custom`)。评估源阶段由 `stage.source || #prevStageName(stage)` 决定(`:415`),`#prevStageName`(`:1087-1095`)向前找最近的非 gate 命名阶段。

#### 阶段执行 `#executeStage()`(`:615-768`)

1. 发 `pipeline_stage_start` 事件(`:624-630`)。
2. **构建 prompt** `#buildStagePrompt`(`:775-805`),优先级:`_retryContext` 存在且有 `retryPromptBuilder` → retryPromptBuilder(并 `delete _retryContext`) > `promptBuilder(ctx)`(注入 `message`/`phaseResults`/`gateArtifact` + `strategyContext`) > `promptTransform` > 原始 `message.content`。
3. **预算解析**(`:641-650`):判 `isRetry`(看 `_was_retry_<name>`),`decisionOnly = isRetry && decisionOnlyOnRetry`。`effectiveBudget` 优先级:retry 且有 `retryBudget` → retryBudget;否则 `stage.budget || strategyContext._computedBudget || undefined`。再经 `withProducerCoverageBudget`(`:140-153`)——若是 `produce`/`producer` 阶段且 gate artifact 里有 `findings`,把 `targetSubmits` 注入预算(用发现数驱动提交覆盖目标)。消费后 `delete _was_retry_<name>`。
4. **阶段隔离**(`:652-661`):`isNewStage = lastExecutedStageName !== stage.name`。若非首阶段且是新阶段 → `ctxWin.resetForNewStage()` 清空上下文窗口;若是**重跑同一阶段** → 保留 ContextWindow(打日志 `♻️ Retry stage ... preserving ContextWindow`)。
5. **解析 tracker** `#resolveStageTracker`(`:807-851`):`disableTracker`/`recordRepairOnly` → `null`;否则按阶段名派生 tracker 策略(`produce`/`producer`→`'producer'`,其余→`'analyst'`),用 `ExplorationTracker.resolve(...)` 结合 budget/submitToolName/pipelineType 重建。
6. 记 `lastExecutedStageName`、`execStageCount++`,打阶段日志(budget/timeout/tracker/submitTool)。
7. **执行 `#runWithTimeout`**(`:854-1023`,见下)。
8. **超时零输出快速重试**(`:699-744`):若 `timedOut && 0 toolCalls && 非 retry && 有 retryBudget`,立即用 retryBudget 短限重跑一次(重置 ContextWindow、重建 tracker、可用 `retryPromptBuilder` 建简化 prompt),**跳过 gate 往返**争取在更短时限拿到输出。
9. **累计结果**(`:746-753`):把 `stageResult` 存 `phaseResults[stage.name]`,累加 toolCalls/iterations/tokenUsage。打完成日志、发 `pipeline_stage_done`。

#### per-stage 硬超时与取消 `#runWithTimeout()`(`:854-1023`)

- 建 `AbortController`,把父 `abortSignal` 的 abort 事件转发到本级(`:867-879`)——**取消可级联**。
- 从 message/strategyContext/sharedState 多路解析 `dimensionScopeId`、`pcvStageNodeMap`、`pcvChainNodes`、`stageNodeMap`、`sourceIdentities`(`:881-918`,PCV/project-scope 相关注入),按 `decisionOnly`/`recordRepairOnly` 合成 `stageSharedState`(注入 `_evolutionDecisionOnly`/`_recordRepairOnly`/`_recordRepairEvidencePaths` 等标志,`:919-937`)。
- **调 `runtime.reactLoop(stagePrompt, {...})`**(`:939-973`):这是策略把控制权交回 runtime 的地方,透传 `capabilityOverride:stage.capabilities`、`additionalToolsOverride`、`budgetOverride`、`systemPromptOverride`、`onToolCall`、`contextWindow`、`tracker`、`trace`、`memoryCoordinator`、`sharedState`、`toolChoiceOverride`、`abortSignal`、`diagnostics`,以及 `context.pipelinePhase = stage.name` 和 `previousPhases = phaseResults`。
- **超时**(`:975-1023`):无 `timeoutMs` → 直接 await;否则 `hardLimitMs = timeoutMs + 60_000`(注释:留 60s 给 ForcedSummary AI 调用兜底)。用 `Promise.race([reactPromise, 定时器 reject('__STAGE_HARD_TIMEOUT__')])`;命中硬超时 → 先 `abortController.abort()` 中止进行中的 LLM HTTP 请求,再 catch 该特定错误、发 `pipeline_stage_timeout`、`diagnostics.recordTimedOutStage(...)`,**返回空 `StageResult` + `timedOut:true`**(`:1009-1015`)——超时不抛出,流水线继续(注释 `— continuing pipeline`)。`finally` 清 timer 与父 abort 监听。

这是本子系统最完整的**错误/回退/降级/取消/超时/部分结果**路径集合:超时→空结果续跑或快速重试;质量不足→retry 回退/record_repair 补写/degrade 降级;预算耗尽→抑制重试并降级;单阶段异常经 runtime 内部错误恢复,策略层保证不阻断整条流水线。

### 策略与 AgentRuntime 的协作(谁驱动谁)

1. **runtime 选定 strategy**:`AgentRuntime` 构造时把 `config.strategy` 存到 `this.strategy`(`AgentRuntime.ts:199`),这个实例由 `resolveStrategy` 从 preset 生成。
2. **runtime.execute() 委托 strategy**:`AgentRuntime.execute(message, opts)`(`AgentRuntime.ts:251`)做 policy 前置校验(`:269`)、建整体超时 AbortController(`:290`)、然后 `this.strategy.execute(this, message, { ...opts, abortSignal, diagnostics })`(`:316`),用 `Promise.race([resultPromise, timeoutPromise])` 包整体超时(`:321`)。**runtime 把自己(`this`)作为 `StrategyRuntime` 传给策略**。
3. **strategy 回调 runtime.reactLoop()**:策略在自己的 `execute` 里,对每个逻辑单元(single 一次、fanOut 每 item、pipeline 每 stage)调 `runtime.reactLoop(prompt, opts)`(`AgentRuntime.ts:415`)。reactLoop 是真正的 ReAct 主循环(`:419-488`):迭代调 LLM、处理 tool calls、直到 tracker/policy 判定退出,返回 `StrategyResult` 形状的结果。
4. **runtime.execute() 后置**:拿到策略结果后做 policy 后置校验(`:328`)、状态机 `finish` 迁移(`:341`)、回复原始渠道(`:344`)、补 `durationMs`/`diagnostics`、发 `AGENT_COMPLETED` 事件(`:355`)。

一句话:**AgentRuntime 是唯一 runtime,策略是它的编排大脑;runtime.execute 驱动策略,策略反过来多次驱动 runtime.reactLoop**。策略层不感知 provider、tools、context window 的实现细节,只通过 reactLoop 的 opts(capabilityOverride/budgetOverride/tracker/...)对单次交互做定制。

### 策略与 profile / stage factory 的配合

- **声明式配置**:preset 里 `strategy` 是纯 JSON 式声明(`presets.ts:188` insight = `{ type:'pipeline', maxRetries:1, stages:[...] }`),`resolveStrategy`(`:393-429`)按 `type` 分派构造;`getPreset`(`:437`)在 `merged.strategyInstance = resolveStrategy(strategyConfig)`(`:462`)处实例化。
- **内置 pipeline preset**:
  - `insight`(`:183-329`):`analyze → quality_gate → produce → rejection_gate` 四阶段。analyze 用 `ANALYST_SYSTEM_PROMPT`+`buildAnalystPrompt`、480s 预算;quality_gate 用 `insightGateEvaluator`;produce 用 `PRODUCER_SYSTEM_PROMPT`+`buildProducerPromptV2`,读上一门的 `gateArtifact`,`skipOnDegrade:true`,带 rejection retry 的 `retryBudget`/`retryPromptBuilder`;rejection_gate 用 `producerRejectionGateEvaluator`。这是深度代码分析+知识产出的主链路。
  - `evolution`(`:333-383`):`evolve → evolution_gate` 两阶段,gate 用 `evolutionGateEvaluator` + `useCumulativeToolCalls:true` + `maxRetries:8`(反复补写决策),evolve 阶段 `decisionOnlyOnRetry:true`(重试时只允许决策工具调用,见 `buildEvolutionRetryPrompt` `:104-139`)。
- **stage factory 动态覆盖**:`AgentStageFactoryRegistry`(`profiles/AgentStageFactoryRegistry.ts:20-149`)按名产出 stage 数组,供 orchestrator 在**运行时**替换 preset 静态 stages。内置三个工厂:`scanPipeline`(`:52`,扫描/摘要)、`relationsPipeline`(`:68`)、`bootstrapDimensionPipeline`(`:69-147`)。后者以 `PRESETS.insight.strategy.stages` 与 `PRESETS.evolution.strategy.stages` 为模板,按 `needsCandidates`/`hasExistingRecipes`/`prescreenDone` 拼不同 stage 序列,并给每阶段注入终端工具(`getBootstrapStageTerminalTools`)与 `toolPolicyHints`,还能用 `rescanContext.createBudget` 覆盖 producer 的 `maxSubmits`/`softSubmitLimit`(`:107-122`)。这就是 preset 注释"bootstrap-dimension profile 通过 AgentStageFactoryRegistry 按需覆盖 / onToolCall 由 orchestrator 按维度注入"(`presets.ts:180-181`)的落地。
- **`pipelineType`**:`PipelineStage.pipelineType`(`PipelineStrategy.ts:105`)取值 `'scan'|'bootstrap'|'analyst'|'producer'`(`context/exploration/ExplorationStrategies.ts:31`),传给 `ExplorationTracker.resolve` 用于统一场景判别(退出/nudge 策略)。

### 配置 / 开关 / 环境变量

策略层**无直接环境变量**;所有行为经声明式配置与运行时注入驱动:
- 实例级:`PipelineStrategy` 构造 `{ stages, maxRetries=1 }`(`:172-179`);`FanOutStrategy` 构造 `{ itemStrategy, tiers, merge }`(`:30`);`AdaptiveStrategy` 构造 `{ single, pipeline, fanOut }`(`:20`)。
- 阶段级开关:`skipOnDegrade`/`skipOnFail`/`decisionOnlyOnRetry`/`recordRepairOnly`/`disableTracker`/`toolChoiceOverride`/`submitToolName`/`useCumulativeToolCalls`/`retryBudgetExhaustedRatio`(默认 0.9)。
- 预算注入:阶段 `budget`/`retryBudget`,或回退 `strategyContext._computedBudget`(由 `BudgetController` 动态算,`presets.ts:312` 注释)。
- Logger 懒加载:`_pipelineLogger = () => Logger.getInstance()`(`:164`,注释 AD4:避免 import 期副作用,首次使用才物化 Core logger 单例)。

### 集成点(上游 / 下游 / 跨子系统依赖)

**上游调用方**:
- `AgentRuntime.execute()`(`AgentRuntime.ts:316`)是唯一直接调 `strategy.execute` 的地方。
- `resolveStrategy`/`getPreset`(`presets.ts`)由 `AgentProfileCompiler`/`AgentRuntimeBuilder`/`AgentService` 消费,把策略实例装进 runtime config。
- `AgentService.buildRuntimeOptions`(`service/AgentService.ts:187-212`)组装 `strategyContext`/`systemRunContext`/`sharedState`/`contextWindow`/`trace`/`memoryCoordinator`,这些经 execute 的 opts → PipelineStrategy 的 `ctx.strategyContext` → 每个 stage 的 reactLoop opts,是策略拿到运行时数据的通道。

**下游被调**:
- `runtime.reactLoop`(所有策略的最终落点)。
- `AgentEventBus.getInstance().publish(AgentEvents.PROGRESS, ...)`(`runtime/AgentEventBus.ts`):四种策略都发进度事件(`fan_out_tier_start/item_start/...`、`adaptive_classification`、`pipeline_stage_start/done/timeout`、`quality_gate` 等),供可观测层订阅。
- `createLimit`(`shared/concurrency.ts:3`,FanOut 并发闸)。
- `ExplorationTracker`(`context/ExplorationTracker.ts`)、`DiagnosticsCollector`(`runtime/DiagnosticsCollector.ts`)、`expandSystemRunContext`(`runtime/SystemRunContext.ts`)、`buildRecordRepairPrompt`(`prompts/insightGate.ts`)。
- gate evaluators 定义在 `prompts/insightGate.ts`(`insightGateEvaluator`、`producerRejectionGateEvaluator`)与 evolution 侧,返回三态 action(`insightGate.ts:584-648` 等)。

**跨子系统 / `@alembic/core` 契约**:
- `PipelineStrategy` 直接 `import Logger from '@alembic/core/logging'`(`:20`)——策略层对 Core 的唯一直接依赖(日志单例)。
- `AgentStageFactoryRegistry` 从 `@alembic/core/host-agent-workflows` 引 `buildBootstrapTerminalPolicyHints`/`getBootstrapStageTerminalTools`/`resolveBootstrapTerminalToolset`(`AgentStageFactoryRegistry.ts:1-5`),把 Core 侧的终端工具集契约桥进 bootstrap 流水线。

### 值得记录的设计决策与注释要点

1. **窄接口委托**:策略只依赖 `StrategyRuntime`(`id`+`reactLoop`),不知道 AgentRuntime 全貌;runtime 把 `this` 传给策略——这让策略可测(mock 一个 reactLoop 即可)、可组合(策略嵌套策略)。
2. **可回退索引的 for 循环**:PipelineStrategy 用 `i = gateAction`(数字)实现 gate→前阶段的**跳转重跑**(`:231-233`),而非递归或独立重试栈,状态全在 `phaseResults` 的 `_retries_*`/`_was_retry_*`/`_retryContext` 键上。
3. **"宁可显式降级"原则**:record_repair 补写仍不足时,不让 producer 基于缺失证据继续,而是合成 `degraded_no_findings` 并 `markDegraded`(`:321-333`)——牺牲产出换正确性。
4. **硬超时 = budget + 60s 缓冲**:`:982-983` 注释明确留 60s 给 ForcedSummary AI 兜底调用,超时先 abort HTTP 再 reject,返回空结果**续跑不抛错**——单阶段卡死不拖垮整条流水线。
5. **超时零输出快速重试**:`:695-744` 针对"LLM 完全卡住(硬超时且 0 工具调用)"这一具体病态,跳过 gate 往返直接用 retryBudget 短限重跑一次。
6. **producer 覆盖预算**:`withProducerCoverageBudget`(`:140-153`)用上游 gate artifact 的 `findings.length` 反推 producer 的 `targetSubmits`,把"分析发现数"传导为"提交覆盖目标"。
7. **FanOut 单项失败即成 failed ItemResult**:`catch` 不 rethrow(`:97-107`),保证部分结果可返回。
8. **preset 注释即架构说明**:`presets.ts:172-181` 把 insight 的 `Analyze→QualityGate→Produce→RejectionGate` 与"stage factory 覆盖 / onToolCall 注入"讲清楚,是理解策略如何与 profile 协作的入口。


## S07 · Memory 子系统 · 记忆分层与巩固 (src/agent/memory + domain)

本章剖析 AlembicAgent 的记忆子系统:一套受 CoALA / MemGPT / Generative Agents / Mem0 启发的三层记忆架构。它把 Agent 一次执行内的工作记忆(短期)、一次 bootstrap 会话内的跨维度记忆(中期)与项目级永久语义记忆(长期)统一在 `MemoryCoordinator` 之下,并配套 domain 层的证据采集(`EvidenceCollector`)与情节固化(`EpisodicConsolidator`),完成"写入 → 蒸馏 → 巩固 → 检索 → 注入 context"的完整生命周期。

### S07.1 职责定位与三层架构

记忆子系统的物理位置在两个目录:

- `src/agent/memory/`:记忆分层的实现主体(11 个源文件 + 2 个 schema/contract 文件)。
- `src/agent/domain/`:两个高阶"消费/固化"组件,把记忆内容转成证据产物或永久记忆。

统一协调器 `MemoryCoordinator` (`src/agent/memory/MemoryCoordinator.ts:172`) 把记忆划分为三层(Tier),这也是全章的主干抽象:

| Tier | 组件 | 生命周期 | 存储介质 | 核心用途 |
|------|------|----------|----------|----------|
| Tier 1 维度级 | `ActiveContext` | 单次 `execute()` / 单个 scope | 纯内存 | 工作记忆:scratchpad + 观察日志 + plan |
| Tier 2 会话级 | `SessionStore` | 一次 bootstrap 会话 | 内存 + `.asd/bootstrap-checkpoint` JSON checkpoint | 跨维度报告/证据/交叉引用 + 只读工具缓存 |
| Tier 3 持久级 | `PersistentMemory`(+ `MemoryStore`/`MemoryRetriever`/`MemoryConsolidator`/`MemoryEmbeddingStore`) | 跨会话永久 | SQLite `semantic_memories` 表 + JSON 向量 sidecar | 项目级语义记忆:fact/insight/preference |

`MemoryCoordinator` 内部对这三层各持一个字段(`MemoryCoordinator.ts:180-188`):`#persistentMemory` / `#conversationLog`(Tier 3)、`#sessionStore`(Tier 2)、`#activeContexts: Map<string, ActiveContext>`(Tier 1,支持多 scope 并行)。设计原则写在文件头注释(`MemoryCoordinator.ts:4-8`):Single Coordinator(所有记忆操作经此路由)、Budget-Aware Injection(注入受统一 token 预算管控)、Extract-Update Write Path(写入经去重/合并/冲突解决)、Graceful Degradation(任一子系统故障不影响核心执行)。

模块对外导出集中在 `src/agent/memory/index.ts` 与 `src/agent/domain/index.ts`。关键类导出:`ActiveContext` / `SessionStore` / `PersistentMemory` / `MemoryStore` / `MemoryRetriever` / `MemoryConsolidator` / `MemoryEmbeddingStore` / `MemoryCoordinator`,以及类型 `DistilledContext` / `DimensionFlushManifest`(`MemoryFlushContract.ts`)、`SessionStoreSerialized`。domain 层导出 `EvidenceCollector` / `EpisodicConsolidator` 及其结果类型。

### S07.2 生命周期总览(写入 → 蒸馏 → 巩固 → 检索 → 注入)

把子系统串起来的是一条数据流水线,分五个阶段:

1. **实例化**:bootstrap 扫描入口 `SystemRunContextFactory.createSystemContext()` (`src/agent/service/SystemRunContextFactory.ts:41-43`) `new MemoryCoordinator({ mode: 'bootstrap' })`,随即 `createDimensionScope('scan:<label>')` 建出 Tier 1 的 `ActiveContext`,并塞进 `SystemRunContext`。User Chat 模式则由 `AgentRuntime` 侧持有一个实例级 coordinator(注释 `MemoryCoordinator.ts:11-13`)。
2. **写入(每轮 ReAct)**:`ToolExecutionPipeline` 的三个 after-hook 把一次工具调用的观察分发进记忆层——`observationRecord` → `MemoryCoordinator.recordObservation()`(负责只读缓存);`trackerSignal` → `ExplorationTracker.recordToolCall()`(算 isNew,并把高质量 finding 落 scratchpad);`traceRecord` → `ActiveContext.recordToolCall()`(记 Action+Observation+滑动窗口压缩)。见 `ToolExecutionPipeline.ts:864-902`。Agent 主动记录用 `memory.note_finding` 工具 → `MemoryCoordinator.noteFinding()` → `ActiveContext.noteKeyFinding()`。
3. **注入 context(每轮 / 一次)**:静态段 `buildStaticMemoryPrompt()`(Tier 3 + Tier 2)在 execute 入口构建一次;动态段 `buildDynamicMemoryPrompt()`(Tier 1)每轮由 `AgentRuntime` 在 `ctx.isSystem` 分支调用(`AgentRuntime.ts:790-798`)。
4. **蒸馏(维度完成)**:`MemoryCoordinator.completeDimension(scopeId, report)` (`MemoryCoordinator.ts:570`) 调 `ActiveContext.distill()` 得到 `DistilledContext`,连同 report 存入 `SessionStore.storeDimensionReport()`,然后 `ActiveContext.clear()` 释放 Tier 1。
5. **巩固(会话完成)**:bootstrap 全部维度跑完后,domain 层的 `EpisodicConsolidator.consolidate(sessionStore)` (`src/agent/domain/EpisodicConsolidator.ts:155`) 把 Tier 2 的 findings/reflections/analysisText 规则化提炼成候选记忆,交给 `PersistentMemory.consolidate()`(Tier 3),经 Mem0 风格冲突解决 + Extract-Update 固化落 SQLite。至此短期→长期闭环完成。

另有一条平行支线:Analyst 阶段的工具调用序列会被 `EvidenceCollector`(`src/agent/prompts/insightGate.ts:389`)转成结构化证据地图/探索日志/负空间信号,供 Producer 阶段(质量门控 `buildAnalysisArtifact`)直接引用——这属于"证据产物"而非记忆存储,但共享同一批 toolCall 数据。

### S07.3 Tier 1 · ActiveContext(工作记忆,`ActiveContext.ts` 1378L)

`ActiveContext` (`src/agent/memory/ActiveContext.ts:259`) 是"合并 WorkingMemory + ReasoningTrace"的统一工作记忆,生命周期为单次 `execute()`,由 coordinator 管理创建/蒸馏/销毁(文件头 `ActiveContext.ts:1-21`)。内部分三个子区:

- **子区 1 · Scratchpad**(`#scratchpad: ScratchpadEntry[]`,`ActiveContext.ts:261`):Agent 通过 `note_finding` 主动标记的关键发现,**不可压缩**,是最高优先级证据。`noteKeyFinding(finding, evidence, importance, round)` (`ActiveContext.ts:433`) 有 P0 防御——AI 可能把 evidence 传成 array/object,统一强转 string;importance 夹到 1-10。
- **子区 2 · ObservationLog**(`#rounds` + 滑动窗口 `#recentObservations`/`#compressedObservations`,`ActiveContext.ts:264-269`):合并原 RT.rounds + WM.observations。核心写入方法 `recordToolCall(toolName, args, result, isNew)` (`ActiveContext.ts:349`) 同时做两件事:记 RT 的 Action/Observation 结构化元数据(`buildObservationMeta`),以及(非 lightweight 时)把原始结果压入滑动窗口——超出 `#maxRecentRounds`(默认 3)的最旧观察被 `#compressObservation()` 压缩进 ledger。
- **子区 3 · Plan**(`#plan` / `#planHistory` / `#expectingPlan`,`ActiveContext.ts:272-276`):从 ReasoningTrace 继承的规划追踪。

**关键状态机:Plan 覆盖门(TOCTOU 式防污染)**。`extractAndSetPlan(text, iteration)` (`ActiveContext.ts:470`) 从 AI 响应里正则抽取计划(`#extractPlanFromText`,`ActiveContext.ts:1157`)。有一条重要防御:**已存在计划时,仅当 `#expectingPlan === true` 才允许覆盖**(`ActiveContext.ts:478-480`)。`#expectingPlan` 由 `ExplorationTracker` 在发送 plan elicitation / replan nudge 时通过 `expectPlan()` (`ActiveContext.ts:495`) 授权置真,提取一次即复位。这防止 reflection/convergence 回复里的编号列表被误捕为 plan。`#extractPlanFromText` 还有二次防御(`ActiveContext.ts:1212-1218`):若候选列表里疑问句(以 `？?` 结尾)占比 >50%,判定为 reflection nudge 回显,拒绝捕获。

**上下文构建 `buildContext(tokenBudget)`**(`ActiveContext.ts:554`):lightweight 模式直接返回空串;否则按优先级拼接——先 Scratchpad(按 importance 降序,`⚠️/📋/💡` 徽章,永不压缩,先扣预算),再 Observation Ledger(剩余预算 >100 才拼)。Ledger 由 `#buildObservationLedgerSection()` (`ActiveContext.ts:919`) 生成,把压缩观察按五类归档:`evidence / readSet / searchSet / failureSet / nextHints`(`OBSERVATION_LEDGER_CATEGORIES`,`ActiveContext.ts:232`),每类有上限(`OBSERVATION_LEDGER_LIMITS`,`ActiveContext.ts:240`),同 key 去重、逐行扣预算。

**蒸馏 `distill()`**(`ActiveContext.ts:601`)输出 `DistilledContext`(定义于 `MemoryFlushContract.ts:15`):`keyFindings`(scratchpad 全量)+ `toolCallSummary`(压缩观察摘要)+ `stats`(轮次/thought/action/observation/reflection/耗时)+ `plan` + 计数。这是 Tier 1 → Tier 2 的唯一结构化出口。

**压缩策略**:`TOOL_COMPRESS_STRATEGIES`(`ActiveContext.ts:32`)对 `code`/`graph` 两种工具有特化压缩(搜索保匹配文件行、读取保文件计数、类查询保继承/协议/方法数),其余走 `defaultCompress`(截断 600 字符)。Ledger 文本还经 `sanitizeLedgerText`(`ActiveContext.ts:1286`)剥离 provider debug 字段(`callId`/`durationMs`/`_meta` 等,见 `PROVIDER_DEBUG_KEYS` `ActiveContext.ts:248`),避免噪声污染注入。

**序列化/续传**:`toJSON()` / `static fromJSON()`(`ActiveContext.ts:707/732`)支持断点恢复;`clear()`(`ActiveContext.ts:755`)逐字段清空以释放内存。

### S07.4 Tier 2 · SessionStore(会话级,`SessionStore.ts` 936L)

`SessionStore` (`src/agent/memory/SessionStore.ts:171`,`implements Disposable`)合并了原 `EpisodicMemory` + `ToolResultCache`,两个子系统:

**子系统 1 · DimensionReports**(跨维度分析成果)。`storeDimensionReport(dimId, report)` (`SessionStore.ts:213`) 是核心写入:findings 统一形状并强转 evidence 为 string(P0),自动把带 evidence 的 finding 派生成文件级 Evidence(`addEvidence`,`SessionStore.ts:286`,`#evidenceStore: Map<filePath, Finding[]>`),并从 `digest.crossRefs` 抽取跨维度引用 `#crossReferences`。检索侧 `searchEvidence(query, dimId)` (`SessionStore.ts:303`) 做子串匹配(文件名或 finding 命中),按 importance 降序返回——这正是 `memory.get_previous_evidence` 工具的底层(经 coordinator 桥接)。

**核心读:`buildContextForDimension(currentDimId, focusKeywords|opts)`**(`SessionStore.ts:439`)构建给 Analyst 的跨维度上下文("前序维度分析成果,避免重复探索"),分四段:前序维度关键发现(`#selectRelevantFindings` 按 focusKeywords 加权 + importance,`SessionStore.ts:881`)、已扫描文件汇总(最多列 30)、其他维度对当前维度的建议(crossRefs)、Tier Reflection。支持 tokenBudget 粗裁剪。当 report.findings 为空时会回退到 `workingMemoryDistilled.keyFindings`(B1 fix,`SessionStore.ts:474-481`)。

**子系统 2 · ReadOnlyCache**(只读工具结果缓存,from ToolResultCache)。`#searchCache` / `#fileCache` 两个 Map,只缓存 `code.search`(按 pattern)与 `code.read`(按 filePath)。关键安全边界:`NON_CACHEABLE`(`SessionStore.ts:36`)集合排除有副作用/需实时的工具(`knowledge`/`memory`/`note_finding`/`get_previous_analysis`/`get_previous_evidence`),这是 B3 fix。缓存受 TTL(默认 30 分钟,`DEFAULT_TTL_MS`)+ LRU 容量上限(file 200 / search 500)双控;读时命中且超 TTL 会即时淘汰并计 miss。后台由 `timerRegistry.setInterval`(Core `@alembic/core/events`)每 5 分钟跑 `#evictExpired()`(`SessionStore.ts:911`)。

**持久化(断点续传)**:`saveCheckpoint(projectRoot, wz?)`(`SessionStore.ts:688`)写 `.asd/bootstrap-checkpoint/session-store.json`(version 2,analysisText 截断 500),可选经 Core `WriteZone` DI。`loadCheckpoint()`(`SessionStore.ts:721`)兼容 legacy `episodic-memory.json`,拒绝 >1 小时的旧 checkpoint(`SessionStore.ts:744`)。反序列化经 `validateSessionStoreShape`(`SessionStoreSchema.ts:39`)做轻量类型校验。

注意:`SystemRunContext` 里注入 `ToolContext.sessionStore` 供 `memory.save/recall` 的**不是**本类(本类无 `.save/.recall`),而是另一套 KV 式 session store;本 Tier-2 `SessionStore` 的消费入口是 coordinator 的 `#buildSessionStoreSection`(`MemoryCoordinator.ts:804`)与 `searchEvidence`。

### S07.5 Tier 3 · PersistentMemory 家族(持久语义记忆)

Tier 3 是一个 Facade + 三子模块的组合(Phase 6 拆分),永久存于 SQLite `semantic_memories` 表。

**`PersistentMemory`**(`src/agent/memory/PersistentMemory.ts:68`,别名 `ProjectSemanticMemory`)是纯 Facade:构造时用 Core `unwrapRawDb`(`@alembic/core/search`)拿到 raw better-sqlite3,组装 `#store`/`#retriever`/`#consolidator`(`PersistentMemory.ts:88-90`),所有公开方法都委托子模块。记忆类型 fact/insight/preference,来源 bootstrap/user/system。

**`MemoryStore`**(`MemoryStore.ts:168`)是 CRUD + SQL 基础设施。重要**边界声明**(`MemoryStore.ts:19-27`):`semantic_memories` 表 schema 所有权在 Core(`@alembic/core/memory` 的 `ensureSemanticMemorySchema`),Agent 侧只消费不定义/不迁移。构造时先 `assertMemoryStoreSchemaShape`(`MemoryStore.ts:668`,校验 16 个必需列的 schema tripwire),这是防漂移门禁。`add()`(`MemoryStore.ts:194`)生成 `smem_<uuid12>` id、content 截断 500、importance 夹 1-10、失败抛类型化 `MemoryStoreWriteError`(code `MEMORY_STORE_WRITE_FAILED`,`MemoryStore.ts:142`)。维护三档策略(`compact()`,`MemoryStore.ts:405`,事务内):删过期(expires_at)、遗忘(90 天未访问且 importance<7)、归档(30 天未访问且 importance<3 则降 importance)。`enforceCapacity()`(`MemoryStore.ts:450`)硬顶 `MAX_MEMORIES=500`,按 importance/access/updated 升序删多余。相似度用 Core 的 `jaccardSimilarity` + `tokenizeForSimilarity` + 子串加成(`computeSimilarity`,`MemoryStore.ts:543`)。

**`MemoryRetriever`**(`MemoryRetriever.ts:75`)是检索与 Prompt 生成核心。**三维打分**(Generative Agents,`retrieve()` `MemoryRetriever.ts:107`):`score = 0.2·recency + 0.3·importance + 0.5·relevance`(权重常量 `MemoryRetriever.ts:22-24`)。recency 为指数衰减(半衰期 7 天,`RECENCY_HALF_LIFE_DAYS`);relevance 是**混合相关性**——若 query 与记忆都有 embedding,则 `0.6·vector(余弦) + 0.4·lexical`,否则纯 lexical(`MemoryRetriever.ts:156-160`)。embedding 不可用时 graceful degrade 到纯词汇(`MemoryRetriever.ts:122-128`)。返回 top-N 后调 `touchAccess` 更新访问计数。

**新鲜度/陈旧标注(CG-1,render-only)**:`toPromptSection()`(`MemoryRetriever.ts:199`)预算感知(每条约 30 token),对每条召回记忆调 `#stalenessPrefix()`(`MemoryRetriever.ts:380`):age 从 `m.updatedAt`(回退 `lastAccessedAt`)算,>7 天(`STALE_MEMORY_DAYS`)加软前缀 `⏳[可能陈旧] `(`STALE_MEMORY_PREFIX`),≤7 天零噪声。注释钉死一个陷阱(`MemoryRetriever.ts:376-379`):必须用 camelCase 的 `DeserializedMemory` 字段而非 raw snake_case row(否则 undefined→NaN);无效/缺失时间戳显式 return ''(不把 NaN 当"很旧"、不抛错)。这是一个纯渲染层标注,不改任何持久化字段或 Core schema。

**`MemoryConsolidator`**(`MemoryConsolidator.ts:71`)负责智能固化。`consolidate()`(`MemoryConsolidator.ts:90`)两阶段:
- Phase 1 冲突预解决(Mem0 风格,`#preResolveConflicts` `MemoryConsolidator.ts:250`):对每个候选找相似记忆,`#detectContradiction`(`MemoryConsolidator.ts:304`)检测——一方含否定/禁止词(中文 `NEGATION_PATTERNS_ZH` / 英文 `NEGATION_PATTERNS_EN`)、另一方不含,且主题词重叠 ≥2 或比例 ≥0.3,则判矛盾并用新内容**替换**旧记忆(replaced++)。
- Phase 2 Extract-Update(事务内):按相似度分档——≥0.85(`SIMILARITY_UPDATE`)→ **UPDATE**(升 importance/access);≥0.6(`SIMILARITY_MERGE`)→ **MERGE**(`旧; 新` 拼接,记 related);否则 → **ADD**;content<5 → **SKIP**(NOOP)。收尾调 `enforceCapacity`。另有 `migrateFromLegacy()`(`MemoryConsolidator.ts:178`)从旧 `.asd/memory.jsonl` 迁移并改名 `.migrated`。

**`MemoryEmbeddingStore`**(`MemoryEmbeddingStore.ts:25`)是向量嵌入的 JSON sidecar(`.asd/context/memory_embeddings.json`),对齐"结构化存 SQLite,向量存独立文件"的理念。内存 `Map<id, number[]>` 缓存 + debounced flush(2s,`FLUSH_DELAY_MS`),写失败静默不阻塞运行时。`getMissingIds` 支撑 `MemoryRetriever.embedAllMemories(batchSize=20)`(`MemoryRetriever.ts:311`)的增量 backfill,`gc(activeIds)` 清孤儿向量。崩溃丢失可靠 backfill 重建。

### S07.6 domain 层 · 证据采集与情节固化

**`EvidenceCollector`**(`src/agent/domain/EvidenceCollector.ts:142`,622L)把 Analyst 的 toolCall 序列转成类型化证据,供 Producer 直接引用(被 `insightGate.buildAnalysisArtifact` 调用,`insightGate.ts:389`)。核心 `processToolCall(toolCall, round)`(`EvidenceCollector.ts:171`)按工具特化提取:`code.read`→代码片段(`#extractFileEvidence`,批量 result.files / 单文件 result.content);`code.search`→匹配 + **负空间信号**(`#extractSearchEvidence`,搜索未命中记 `NegativeSignal` 告诉 Producer "这不存在");`graph`→类/协议结构摘要。三条预算/去重红线:单片段 ≤30 行(`MAX_SNIPPET_LINES`)、每文件 ≤3 片段(`MAX_SNIPPETS_PER_FILE`)、片段总量 ≤32KB(`DEFAULT_SNIPPET_BUDGET`,`#snippetCharsUsed` 累计,超预算即停)。所有调用都记探索日志(intent=WHY / resultSummary=WHAT / effective 是否获取新信息)。它**不保留原始工具返回值**(体积过大),只萃取关键信息。V2 工具参数嵌套在 `args.params` 下,`processToolCall` 会 flatten(`EvidenceCollector.ts:174-177`)。产出 `build()` → `{ evidenceMap, explorationLog, negativeSignals }`。

**`EpisodicConsolidator`**(`src/agent/domain/EpisodicConsolidator.ts:135`)是 Episodic→Semantic 的固化引擎:bootstrap 完成后把 Tier 2 (`SessionStore`) 的维度成果规则化(无需额外 AI 调用)提炼成 Tier 3 候选,交 `PersistentMemory.consolidate()` 去重合并。三路提取器:
- `#extractFromFindings`(`EpisodicConsolidator.ts:230`):每个维度 finding→fact,过滤 importance<4 或过短(<10 字),从 evidence 抽实体(类名/文件名)。
- `#extractFromReflections`(`EpisodicConsolidator.ts:278`):`crossDimensionPatterns`→insight(importance 7)、`suggestionsForNextTier`→insight(5)、`topFindings` 中 ≥7 分→fact。
- `#extractFromAnalysisText`(`EpisodicConsolidator.ts:346`):用 `FACT_PATTERNS` / `INSIGHT_PATTERNS`(中英双语正则,`EpisodicConsolidator.ts:99/120`)从 analysisText 抽陈述性/洞察性短句(10–120 字,置信度 importance 4,seen 去重,每 pattern 限 5/3 条)。

固化流程(`consolidate()`,`EpisodicConsolidator.ts:155`)顺序:可选 `clearBootstrapMemories`(全量重跑)→ `compact` 维护 → 三路提取 → 合并候选 → 结构化统计日志(per-dimension / 重要性分布 / 实体数)→ `semanticMemory.consolidate` → 返回含 durationMs 与直方图的详细报告。注意:在 Agent 仓库内 `EpisodicConsolidator` 仅被 `test/contract-surface.test.ts` 引用;它是通过 domain barrel 导出、由 bootstrap 宿主(Plugin/Core 侧生命周期驱动)消费的稳定契约,不由本仓库运行时直接 new。

### S07.7 MemoryCoordinator · 预算感知的统一协调

`MemoryCoordinator` 是全子系统的读写路由与预算大脑。

**预算分配(§4.1)**:`BUDGET_PROFILES`(`MemoryCoordinator.ts:118`)按角色给三层不同比例——`user`(persistent 0.6 主导)、`analyst`(activeContext 0.45 + sessionStore 0.35 主导)、`producer`(sessionStore 0.55 主导)。`configure({totalContextBudget})`(`MemoryCoordinator.ts:231`)把记忆段定为总上下文的 12.5%;`allocateBudget(mode)`(`MemoryCoordinator.ts:242`)按 profile 展开各层 token 额度。`getMessageBudget()`(`MemoryCoordinator.ts:267`)反算消息缓冲区可用预算(扣掉记忆/system/toolSchema/safety margin)。

**读路径**分静态/动态两段(对应生命周期的 context 注入):
- `buildStaticMemoryPrompt(options)`(`MemoryCoordinator.ts:295`,async):拼 Tier 3(`#buildPersistentMemorySection` → `PersistentMemory.toPromptSection`)+ Tier 2(`#buildSessionStoreSection` → `SessionStore.buildContextForDimension`)+ ConversationLog 预留位。每段用完预算把剩余累加进 `_lastSurplus`(`MemoryCoordinator.ts:339`),留给动态段。token 估算 `#estimateTokens`(`MemoryCoordinator.ts:823`)CJK 感知(中文 2 char/token、英文 4 char/token)。
- `buildDynamicMemoryPrompt(options)`(`MemoryCoordinator.ts:348`):取 activeContext 预算 + surplus,调 `ActiveContext.buildContext(acBudget)`。由 `AgentRuntime.ts:790-798` 每轮在 system 分支调用。
- `buildMemoryPrompt`(`MemoryCoordinator.ts:372`)是二者合并的便捷方法。

**写路径**:
- `recordObservation()`(`MemoryCoordinator.ts:387`):只负责把只读结果委托 `SessionStore.cacheToolResult`(排除 `NON_CACHEABLE_TOOLS`,`MemoryCoordinator.ts:143`);ActiveContext 的推理链由 `trace.recordToolCall` 单独处理,避免重复。
- `noteFinding()`(`MemoryCoordinator.ts:415`):桥接到 `ActiveContext.noteKeyFinding`,返回结构化 `MemoryNoteFindingResult`——只有 `recorded=true && target='activeContext'` 才被 QualityGate 计入 note_finding(`memory.ts:96`)。支持显式 scopeId 保证多 scope 并行安全。
- `extractFromConversation(prompt, reply, source)`(`MemoryCoordinator.ts:464`):写路由两层——层 1 规则匹配(**仅 user 源**,B4 fix,`PREFERENCE_PATTERNS`/`DECISION_PATTERNS` 命中则 append preference/fact 到 Tier 3);层 2 `[MEMORY:type]...[/MEMORY]` 标签提取(所有源)。写失败经 `#recordMemoryWriteFailure`(`MemoryCoordinator.ts:778`)归类为 `MEMORY_STORE_WRITE_FAILED`/`MEMORY_COORDINATOR_WRITE_FAILED` 诊断,不抛。

**维度/会话生命周期**:`createDimensionScope(scopeId, config)`(`MemoryCoordinator.ts:553`)new 一个 ActiveContext 入 `#activeContexts`;`completeDimension(scopeId, report)`(`MemoryCoordinator.ts:570`)distill→存 SessionStore→clear ActiveContext→加入 `#completedScopes`;`completeSession()`(`MemoryCoordinator.ts:603`)当前只清 currentScope 占位(consolidated 计数留待 domain 层驱动)。`checkpoint`/`restore`(`MemoryCoordinator.ts:725/736`)委托 SessionStore 断点续传。

**降级/诊断路径**:`searchEvidenceWithDiagnostics()`(`MemoryCoordinator.ts:638`)体现 Graceful Degradation——SessionStore 缺失返回 `degraded=true, reason='session-store-missing'` + 稳定诊断码 `MEMORY_EVIDENCE_STORE_MISSING`;搜索抛错返回 `MEMORY_EVIDENCE_SEARCH_FAILED`。所有子系统读写包在 try/catch 里,warn 记录后返回空串/空结果,绝不打断主执行循环。`dispose()`(`MemoryCoordinator.ts:752`)清空所有 ActiveContext 并断开引用。

### S07.8 层间边界、Core 契约与设计决策要点

- **层职责边界清晰**:Tier 1 纯内存、单次 execute;Tier 2 会话级 + checkpoint;Tier 3 永久 SQLite。数据只向下沉淀(distill→store→consolidate),不反向污染。coordinator 是唯一路由,任何一层都不直接跨层写。
- **Core 契约点**:Tier 3 强依赖 `@alembic/core` —— `unwrapRawDb`/`cosineSimilarity`/`jaccardSimilarity`/`tokenizeForSimilarity`(`@alembic/core/search`)、`ensureSemanticMemorySchema`(`@alembic/core/memory`,表 schema 所有权在 Core)、`WriteZone`(`@alembic/core/io`)、`timerRegistry`(`@alembic/core/events`)、`Logger`(`@alembic/core/logging`)。`MemoryStore` 注释与 `assertMemoryStoreSchemaShape` tripwire 明确 Agent 只消费不迁移该表,long-term 归属待 RC6 SD-4 决策(不搬移代码)。
- **两处防污染 / 新鲜度门**:(a) ActiveContext 的 Plan 覆盖门 `#expectingPlan`(`ActiveContext.ts:478`)+ 疑问句占比拒绝(`ActiveContext.ts:1215`),防 reflection 回显污染 plan;(b) MemoryRetriever 的 CG-1 陈旧标注 `#stalenessPrefix`(`MemoryRetriever.ts:380`),render-only 提示 >7 天召回记忆可能陈旧,零改持久化。二者都是"读/注入前"的一致性保护。
- **安全/缓存边界**:`NON_CACHEABLE`(SessionStore/Coordinator 各一份)确保副作用工具(knowledge/memory/note_finding/get_previous_*)永不被缓存,避免陈旧结果误导 Agent。
- **预算感知贯穿始终**:从 coordinator 的 profile 分配,到 ActiveContext.buildContext / SessionStore.buildContextForDimension / MemoryRetriever.toPromptSection 都接受并逐条扣 tokenBudget,且 coordinator 用 CJK 感知估算——这是把有限上下文窗口在三层记忆间理性切分的核心机制。
- **Graceful Degradation 是硬约束**:所有记忆读写路径都可失败静默(warn + 空结果/诊断码),embedding 不可用降级到纯词汇,checkpoint 写失败下次重试,向量 sidecar 写失败不阻塞——记忆是执行的辅助面,不是关键路径。


## S08 · Context 子系统 · 上下文窗口装配与探索追踪 (src/agent/context)

### 概述与职责定位

`src/agent/context` 是 AlembicAgent 主循环（reactLoop）的「当轮上下文装配 + 探索生命周期控制」层。它回答两个正交的问题：

1. **这一轮该给 LLM 看什么？** —— 由 `ContextWindow`（消息缓冲 + 5 层递进压缩）、`l4MemoryPackage`（结构化运行记忆包）、`ConversationStore`（对话持久化 + 预算裁剪）负责。
2. **该让 LLM 做什么、还要不要继续？** —— 由 `exploration/` 下的 `ExplorationTracker`（阶段状态机编排层）及其四个委托子模块（`SignalDetector` / `NudgeGenerator` / `PlanTracker` / `ExplorationStrategies`）负责。

与 memory 子系统（S07 一带的 `src/agent/memory`）的分工非常清晰，代码注释在 `ExplorationTracker.ts:16-21` 明确写出「不拥有的职责」：

- **memory = 存储 / 巩固 / 蒸馏**：`ActiveContext` / `WorkingMemory` 累积 scratchpad、observations、keyFindings，提供 `distill()`（`memory/ActiveContext.ts:601`）产出 `keyFindings` / `toolCallSummary` / `totalObservations` / `compressedCount`。
- **context = 当轮窗口装配 + 探索节奏控制**：`ContextWindow` 只管 Chat Completions 协议消息序列的压缩投影，`ExplorationTracker` 只管 phase / nudge / toolChoice。L4 压缩是二者的接缝点 —— 它把 memory 的 `distill()` 结果投影成 `L4MemoryPackage`，再交给 LLM 摘要后写回 `ContextWindow`（详见「L4 记忆包」小节）。

barrel `index.ts` 导出全部对外符号：`ContextWindow` / `limitToolResult` / `ConversationStore` / `ExplorationTracker` / `ExplorationStrategies.*` / `NudgeGenerator` / `PlanTracker` / `SignalDetector` / `isSearchAction` / `SEARCH_TOOLS` 及 L4 一组函数（`src/agent/context/index.ts:1-19`）。

上游主要消费方（`find` 扫描确认）：`src/agent/runtime/AgentRuntime.ts`、`BudgetController.ts`、`MessageAdapter.ts`、`ExitController.ts`、`forcedSummary.ts`；工厂 `src/agent/service/SystemRunContextFactory.ts:31-32,49` 构造 `ContextWindow` 与 `ExplorationTracker`；管线切换在 `src/agent/strategies/PipelineStrategy.ts:656,710,829-839`。

---

### ContextWindow —— 分层上下文与 5 层递进压缩

`ContextWindow`（`ContextWindow.ts:127`）是一个 Chat Completions 协议消息缓冲区，核心私有状态 `#messages: ContextMessage[]`（`:129`）。文件头注释（`:10-19`）给出四条**设计不变量**，是理解整个类的钥匙：

1. `messages[0]` 始终是原始 user prompt，不可删除；
2. `assistant(toolCalls)` 与其后续 tool results 是**原子单元**，压缩时不可拆分；
3. 每次 AI 调用前自动压缩到 `TOKEN_BUDGET` 以内；
4. 不通过追加 user 消息控制 AI 行为（那是 `ExplorationTracker` 的职责）—— 唯一例外是 `appendUserNudge`，它显式打上 `metadata.kind='runtime_nudge'` 便于审计。

#### 消息模型与追加 API

`ContextMessage`（`:46-59`）覆盖 `user | assistant | tool` 三种角色，携带可选 `reasoningContent`（DeepSeek V4 thinking，多轮需原样回传，`:49`）、`toolCalls`、`toolCallId`、以及 `metadata.kind`（`'l4_memory_summary' | 'runtime_nudge'`）。追加 API：

- `appendUserMessage` / `appendAssistantText` / `appendToolResult`（`:264,319,310`）—— 基础追加；`appendAssistantWithToolCalls`（`:289`）会对 knowledge submit 调用做 provider-history 压缩（`compactToolCallForProviderHistory`，`:926`），并**始终存储 `reasoningContent`（哪怕为空串）**，因为 DeepSeek V4 要求带 tool_calls 的 assistant 消息必须保留 reasoning（`:298-301`）。
- `appendUserNudge`（`:273`）—— 先过滤掉除 `messages[0]` 外所有旧的 `runtime_nudge`，再追加新 nudge，保证**同一时刻只有一条 runtime_nudge 存活**（防 nudge 堆积）。这是 `ExplorationTracker` 的 phase-transition / nudge 文本注入主循环的入口。

#### Token 预算解析（模型感知）

静态方法 `resolveTokenBudget(modelName, opts)`（`:210`）是预算来源。策略：优先查 `ModelRegistry`（声明式数据源），未命中回退 `MODEL_CONTEXT_WINDOWS` 正则表（`:152-194`，覆盖 Gemini/GPT/Claude/DeepSeek/Ollama/mock 各族的原生 context window）。拿到 `contextSize` 后按分级映射到预算（`:236-247`）：≥400k → 48k/36k（system/非 system）、≥200k → 32k/24k、≥64k → 24k/20k、≥16k → 14k/12k、<16k → `contextSize × 0.75/0.65`。构造函数默认 `tokenBudget=24000`（`:253`）。`SystemRunContextFactory.createContextWindow`（`SystemRunContextFactory.ts:29-33`）即调用它按当前 provider model 解析预算再 `new ContextWindow`。

#### 5 层递进压缩状态机

压缩由 `compactIfNeeded()`（`:347`）驱动，阈值默认 `DEFAULT_THRESHOLDS = [0.4, 0.55, 0.7, 0.82, 0.92]`（`:125`，对应 L0..L4），可经 `CompactionConfig.thresholds` 覆盖。每次调用先算**有效使用率**：`max(getTokenUsageRatio(), sessionPressure × 0.8)`（`:352`）—— 融合 session 级预算压力，即便单轮 usage 不高，session 紧张时也主动压缩（乘 0.8 避免刚进 70% 就触发 L1）。触发门槛 `usage < t1 || #messages.length <= 4` 直接返回 level 0（`:354`）。各层：

- **L0（≥0.40）Budget Reduction**：不在此函数执行，是隐式档位 —— `getToolResultQuota()` 降档（见下）。
- **L1（≥0.55）Snip**：`#compactL1()`（`:570`）截断**最后一个 tool round 之前**的旧 tool result。阈值 `TRUNCATE_THRESHOLD=2000` → 目标 `TRUNCATE_TO=500`，用 `snipHeadTail`（`:1056`）保**首 80% + 尾 15%**（A-1 改造：纯头截断改首尾保留，保住扫描类结果尾部的错误汇总 / match 计数），跨周期幂等。
- **L2（≥0.70）Merge**：`#compactL2Merge()`（`:605`）两趟 —— Pass1 合并连续同角色文本消息（非 tool、非 toolCalls）；Pass2 对旧 round 的 `knowledge` 重复 submit 去重（按 title/category/trigger 指纹，`getKnowledgeToolCallLabel` `:1009`）。
- **L3（≥0.82）Collapse**：`#compactL3Collapse()`（`:663`）**不删消息**，只设置 `#collapseThreshold`（`:139`）为「倒数第 2 个 tool round 起点」。真实消息保留（`toMessages()` 仍完整），只在读时投影 `toProjectedMessages()` 折叠。
- **L4（≥0.92）Auto-compact**：`compactIfNeeded()` **不进入 L4**（异步），仅由 `needsL4Compaction()`（`:443`）判定 `enableL4LLM && usage >= t4`，交 `BudgetController` 单独异步调 `compactL4()`。

单次 `compactIfNeeded` 可在一次调用中从 L1 递进到 L3（`:359-375`）。构造时 `#enableL4LLM` 默认 `false`（`:258`，注释：在 note_finding 证据链稳定前运行时不自动触发 L4）。

#### 读时投影与 provider-input 独立预算

`toProjectedMessages()`（`:697`）是**真正喂给 LLM 的消息**来源：`#collapseThreshold < 0` 时原样返回 `#messages`；否则把 `[1, threshold)` 折叠成一条 `[Collapsed: N tool rounds, M results]` + `[Submitted: ...]` 摘要行，再拼上 `messages[0]` 与 `[threshold:]`（`:705-719`）。`toMessages()`（`:687`）返回原始引用（用于 L4 原始转录、forcedSummary）。

`compactForProviderInputBudget(options)`（`:385`）是 PCVM Package F 的**独立于模型巨型 context window 的 stage 级压力信号**：默认 `maxProjectedMessages=44` / `maxProjectedTokens=16000`，当 projected 消息数或 token 超限时**强制**跑一遍 L1+L2+L3（`:407-409`），返回 before/after 计数与 level。设计动机（`:378-384` 注释）：DeepSeek/Gemini 的百万级 context 会推迟正常 ratio 触发的 L3，导致多轮昂贵调用后才折叠，此方法在 provider 侧封顶可见内容，同时保住最近 tool rounds 和已记录 finding refs。它在 `AgentRuntime.ts:940` 被调用，`inputStageProfile` 由 `resolveLlmInputStageProfile` 决定。

#### Token 估算与动态工具结果配额

- `estimateTokens()`（`:751`）委托 `#estimateMessagesTokens`（`:755`）：`reasoningContent` **只对最近 2 轮 tool-call assistant 消息计数**（`#findRecentToolCallIndicesIn` `:773`），因为 Transport 层发送前会剥离更早 reasoning。`estimateTokensFast` 来自 `../../shared/tokenUtils`。
- `estimateFullContextTokens(systemPromptChars, toolSchemaCount)`（`:796`）加上 system prompt（`chars/3.5`）与 tool schema（`count×100`）做更准的预算决策。
- `setSessionPressure(ratio)`（`:741`）由 `BudgetController` 每轮前依 session token 消耗更新（`BudgetController.ts:215`）。
- `getToolResultQuota()`（`:817`）取 `max(usage, sessionPressure)` 为**有效使用率**，返回 5 级阶梯 `{maxChars, maxMatches}`：<50% → 6000/15；<70% → 3000/8；<85% → 1500/5；<95% → 800/3；否则 400/2（`:821-833`）。此配额被 `limitToolResult` 消费（工具结果入口截断）。

#### 重置路径（错误恢复 / 阶段隔离）

- `resetToPromptOnly()`（`:850`）致命错误后只保留 `messages[0]`，先 `#extractCompactedSubmits(1)` 保住已提交候选标题。
- `resetForNewStage()`（`:870`）PipelineStrategy 在阶段间（analyze → produce）清空全部消息，保留 `#compactedSubmits` 以跨阶段去重。`PipelineStrategy.ts:656,710` 调用。reactLoop 会把新阶段 prompt 重新追加为 `messages[0]`，system prompt 独立经 `chatWithTools` 参数传，不受影响。

#### limitToolResult —— 工具结果入口限制器

`limitToolResult(toolName, result, quota)`（`:1093`，同为 barrel 导出）在工具结果进入 `ContextWindow` **之前**压缩。按工具分派：`knowledge` submit 短回显纯头 500 字上限（`:1097-1101`）；`code` 区分「V2 纯文本搜索（`^\d+ matches`）」→ `snipHeadTail` 保首尾（`:1106-1111`）、「V1 结构化 batch/单条搜索」→ `limitSearchResult(Obj)` 只保 topN 匹配并截 context（`:1157,1202`）、「文件内容」→ `limitFileContent` 按**整行边界**保首尾（`:1243`，保住 imports/exports 收尾结构，注释 `:1257-1258` 刻意不复用 `snipHeadTail`）；其余通用字符限制。`AgentRuntime.ts:1407-1409` 调用它，配额取自 `getToolResultQuota()`。

`snipHeadTail(text, budget, tag)`（`:1056`）是 A-1/A-1b 共用的首尾截断核心：`keepHead=0.8·budget`、`keepTail=0.15·budget`，marker 含真实省略字数入预算，**幂等硬约束** `keepHead + marker.length + safeTail ≤ budget`（对抗修正#2/FOLD：overflow 先收缩 safeTail 再收缩 keepHead，任意 budget 无条件成立，`:1044-1080`）。两层 marker 词根刻意不同（`L1_SNIP_MARKER_TAG='compaction snip'` vs `LIMIT_SNIP_MARKER_TAG='tool-result snip'`，`:1040-1042`），使两层有损截断可区分。

---

### l4MemoryPackage —— 结构化运行记忆包（memory ↔ context 接缝）

`l4MemoryPackage.ts`（548L）是 L4 压缩的数据契约。核心动机（文件头 `:1-7`）：**L4 压缩应摘要一个结构化运行记忆包，而非原始 Chat Completions 转录**；原始消息只有投影成 plain text 字段后才可用。

#### 数据结构

`L4MemoryPackage`（`:88-105`）：`kind:'l4_memory_package'` / `version:1` / `goal` / `phase` / `stageStatus` / `keyFindings: L4MemoryFinding[]` / `evidenceRefs: L4EvidenceRef[]` / `toolResultSummary` / `unresolvedQuestions` / `recentConversation` / `failureState` / `stats{totalObservations,compressedCount}` / `plan`。`L4MemoryFinding`（`:74`）含 `id/finding/evidence/importance`；`L4EvidenceRef`（`:81`）含 `path/line?/summary?/source('finding'|'evidence-map'|'tool-call')`。上限常量：`MAX_RECENT_MESSAGES=8` / `MAX_TOOL_SUMMARIES=12` / `MAX_EVIDENCE_REFS=12` / `MAX_FINDINGS=8`（`:126-129`）。

#### buildL4MemoryPackage —— 从多源汇聚

`buildL4MemoryPackage(input)`（`:384`）接受 `L4MemoryPackageInput`（`:107-119`，可传 `activeContext`（带 `distill()`）、`distilledContext`、`evidence`（EvidenceCollector 结果）、`diagnostics`、`recentMessages`、`toolCalls` 等）。流程：

1. `readDistilled`（`:163`）优先用 `distilledContext`，否则调 `activeContext.distill()`（try/catch 兜底空对象）—— **这是 memory→context 的取数点**。
2. `normalizeFindings`（`:174`）归一化 `distilled.keyFindings`（限 importance 1-10，取前 8）。
3. **evidenceRefs 三源合并去重**（`pushUniqueEvidence` 按 `path:line` 键去重，`:209`）：`evidenceFromFindings`（`:219`，从 finding.evidence 正则抽 `path:line`）+ `evidenceFromMap`（`:234`，从 EvidenceCollector 的 evidenceMap，支持 Map/Record）+ `evidenceFromToolCalls`（`:261`，从 tool call args/result 抽 path）。
4. `normalizeToolSummary`（`:291`）合并 `toolCallSummary` + explorationLog + toolCalls（取尾 12）；`normalizePlan`（`:308`）取 plan.text + 前 8 步；`serializeRecentMessages`（`:329`）把消息投影成 `[role tool_calls=...] content` 文本行（tool 消息标 `[tool-result-as-text ...]`，取尾 8）；`normalizeFailureState`（`:352`）汇聚 cancelReason/timedOutStage/gateFailure/degraded（去重取前 12）。

#### 渲染、校验、封装

- `renderL4MemoryPackage(pkg)`（`:417`）渲染成分节 Markdown（Key Findings / Evidence Refs / Tool Result Summary / Plan / Recent Conversation / Failure State + stats 行），作为 LLM 摘要输入。
- `validateL4Summary(summaryText, pkg)`（`:482`）**防幻觉护栏**：校验 LLM 摘要文本是否覆盖了 phase、非 running 的 stageStatus、至少一条 key finding（按 id + `findingTokens` `:474` 抽的 ≥4 字符 token，含 CJK）、至少一条 evidence path（含 basename）、failure state needle。缺项进 `missing[]`，`ok = missing.length===0`。`compactL4` 校验失败即放弃替换（保原始消息）。
- `formatL4MemorySummary(summaryText, pkg)`（`:533`）把校验通过的摘要包装成 `[[L4 Memory Summary]]` 块（带 source/phase/stageStatus/evidenceRefs 头 + 正文），写回 `ContextWindow` 作为新 `messages[1]`。

#### compactL4 控制流（回到 ContextWindow）

`ContextWindow.compactL4(aiProvider, opts)`（`:454`）异步：`oldLen<=1` 或 abort 已触发直接返回；用 `memoryPackage`（若 opts 未传成品则 `buildL4MemoryPackage` 现构，`:483-494`）→ `renderL4MemoryPackage` → 拼固定中文 `summaryPrompt`（`:496-503`：保留 phase/stageStatus/finding/证据路径/失败状态，不新增事实，≤500 字）→ `aiProvider.chatWithTools(..., toolChoice:'none')` → abort 复检 → `validateL4Summary`。校验/异常/cancel 各返回 `failed/cancelled/validationMissing` 标记且**不动消息**；通过则 `#messages = [messages[0], {role:'user', content: formatL4MemorySummary(...), metadata.kind:'l4_memory_summary'}]`，重置 `#collapseThreshold=-1`，返回 `removed = oldLen-2`（`:536-555`）。

L4 的**触发编排在 `BudgetController`**（非本子系统），`AgentRuntime` 通过 `l4MemoryPackageProvider` 回调（`AgentRuntime.ts:616-629`）喂 `goal/phase/stageStatus/activeContext/diagnostics/recentMessages/toolCalls`：`phase` 来自 `tracker.phase`，`stageStatus` 依 `tracker.isHardExit/isGracefulExit` 映射为 `hard_exit/graceful_exit/running`。`BudgetController.executeL4IfPending`（`BudgetController.ts:283`）执行、把 usage 回写 `cumulativeUsage`，并对失败/session 压力做冷却与 hard-stop（`L4_HARD_STOP_RATIO`，`:337-346`）。

---

### ConversationStore —— 对话持久化与预算裁剪

`ConversationStore`（`ConversationStore.ts:55`）是一条**与 reactLoop 内存窗口平行**的、面向持久化对话（Dashboard `user` / agent runtime `system` 两类）的存储。落盘布局（文件头 `:15-19`）：`.asd/conversations/{id}.jsonl`（每行一条 `{role,content,ts}`）+ `index.json`（元数据索引）。构造函数强制 `pathGuard.assertProjectWriteSafe`（`:68`），并可选注入 `WriteZone`（`@alembic/core/io`）走托管写路径，否则回落裸 `fs`（`:120-126`）—— 这是 Core 契约接入点。仓内无 `new ConversationStore` 消费方，它是导出给宿主/Dashboard 消费的能力面。

关键设计：**静默降级** —— `append`/`summarize`/索引读写全部 try/catch，失败只 `logger.warn` 不影响核心（`:140,291,428`），符合仓库「持久化失败不影响核心功能」原则。

- `create`（`:81`）新建对话，索引超 `MAX_CONVERSATIONS=100` 时淘汰旧文件（`:97-103`）。
- `append`（`:113`）追加并更新索引 `messageCount`，首条 user 消息前 60 字作标题。
- `load(id, {tokenBudget=12000})`（`:156`）读 JSONL → `#fitWithinBudget`（`:348`）：总 token ≤ 预算原样返回；否则**保留首条 `[对话摘要]` system 消息 + 从末尾往前填充**，中间丢弃部分插入 `[上下文截断] 省略了 N 条…` 提示（`:390-396`）。token 估算委托共享 `tokenUtils.estimateTokens`（CJK 感知，`:336`）。
- `summarize(id, {aiProvider})`（`:215`）消息 ≥6 时压缩：保留最近 4 条，其余喂 AI 生成 2-3 句摘要（`temperature:0.3, maxTokens:300`），重写文件为「`[对话摘要]` system 消息 + 最近 4 条」，更新 `hasSummary`。
- `list` / `delete` / `cleanup({maxAgeDays=30})`（`:191,201,303`）标准管理 API。

与 `ContextWindow` 的区别：`ContextWindow` 是**当轮易失内存窗口**（协议消息、reasoning、toolCalls、5 层压缩），`ConversationStore` 是**跨会话磁盘持久化**（纯 role/content、单档摘要 + 首尾裁剪）；二者 token 预算逻辑相似但互不依赖。

---

### exploration —— 探索生命周期控制

`exploration/` 把「AI 探索节奏」从 `ContextWindow` 中彻底剥离。`ExplorationTracker.ts:4-8` 记录它合并了三个原本各自为政的系统：PhaseRouter（阶段状态机）、探索进度追踪（信息增量）、ReasoningLayer 的行为控制（反思/规划/停滞 nudge）。拆分后 Tracker 是**编排层**，把职责委托给四个子模块。

#### ExplorationStrategies —— 策略与阶段定义

`ExplorationStrategies.ts` 定义了 `PipelineType = 'scan' | 'bootstrap' | 'analyst' | 'producer'`（`:31`，统一场景判别，替代散落的 `submitToolName==='knowledge'` / `strategy.name==='analyst'` 字符串比较）和 `ExplorationPhase = 'SCAN'|'EXPLORE'|'PRODUCE'|'VERIFY'|'RECORD'|'SUMMARIZE'`（`:60`）。三种内置策略，每个是 `{name, phases[], transitions{}, getToolChoice(), enableReflection, reflectionInterval, enablePlanning, replanInterval}`（`ExplorationStrategy` `:81`）：

- **`createBootstrapStrategy(isSkillOnly)`**（`:143`）：冷启动维度管线，输出 dimensionDigest JSON。phases = `['EXPLORE','PRODUCE','SUMMARIZE']`（skill-only 跳过 PRODUCE）。`EXPLORE→PRODUCE` 条件 `submitCount>0 || searchRoundsInPhase≥searchBudget`；`PRODUCE→SUMMARIZE` 条件含 submit 上限/idle 退出/零 submit 的连续空转（`:162-169`）。`getToolChoice`：SUMMARIZE→`none`，EXPLORE 在搜索预算耗尽前 `required` 否则 `auto`，PRODUCE→`auto`。开反思 + 规划。
- **`STRATEGY_ANALYST`**（`:200`）：纯探索无 submit，**5 阶段** `SCAN→EXPLORE→VERIFY→RECORD→SUMMARIZE`，输出 Markdown 分析报告。SCAN 是无工具的 briefing/plan seed（`getToolChoice` 返回 `none`，`:242`）；EXPLORE 必须**先有真实代码证据**（`evidenceToolCallCount>0`）才允许 40% 预算后降级 `auto`（`:208-217,245-250`）；RECORD 是 `required` note_finding-only 阶段。转换条件混合 metrics 与 text 两路（`onMetrics`/`onTextResponse`，`:203-233`）。
- **`STRATEGY_PRODUCER`**（`:266`）：消费 Analyst 结果，只格式化+提交不搜索，2 阶段 `PRODUCE→SUMMARIZE`，关反思/规划。

辅助：`targetMemoryFindingCount(m)=max(3, ceil(evidenceToolCallCount/2))`（`:96`）；`targetProducerSubmitCount(b)`（`:100`）夹在 `[1, maxSubmits]`。

#### ExplorationTracker —— 编排主类

状态：`#strategy` / `#budget`（默认 `maxIterations:24, searchBudget:18, searchBudgetGrace:10, maxSubmits:10, softSubmitLimit:8, idleRoundsToExit:3`，`:125-133`）/ `#phase`（初始 `phases[0]`）/ `#pipelineType`（显式 > 从策略名推断，`:136-142`）/ `#metrics: FullExplorationMetrics`（`:82-96`，含 `uniqueFiles/uniquePatterns/uniqueQueries` Set 与各类计数器）/ 三个子模块实例（`:148-150`）/ graceful-exit 与 transition 控制标志。

静态工厂 `resolve(opts, budget)`（`:161`）：`source!=='system'` 返回 `null`（user 模式不追踪）；否则按 `strategyName` 选 analyst/producer，或按 `dimensionMeta.outputType==='skill'` 选 bootstrap(skillOnly)。

**主循环调用点**（对应 `AgentRuntime` reactLoop 各阶段）：

1. `tick()`（`:186`）每轮开始递增 `iteration`/`phaseRounds`，置 `#ticked`；`rollbackTick()`（`:194`）在 AI 空响应时撤销，不计入迭代。
2. `shouldExit()`（`:213`）退出判定：scan 管线终结阶段直接退；终结阶段给满 3 轮 grace 退；`iteration≥maxIterations+2` 硬兜底；`iteration≥maxIterations` 但未终结 → **强制转终结阶段**并记 `#gracefulExitRound`。各退出发 `exploration/ExplorationTracker.exit` 信号（`#emitExitSignal` `:242`）。
3. `getToolChoice()`（`:307`）：graceful exit 时强制 `none`，否则委托 `strategy.getToolChoice(phase, metrics, budget)`。
4. `getNudge(trace)`（`:255`）每轮最多一条：终结阶段/RECORD 返回 null；否则委托 `NudgeGenerator.generate`，未命中且 `enablePlanning` 再委托 `PlanTracker.checkPlanning`。
5. `getPhaseContext()`（`:302`）委托 `NudgeGenerator.getPhaseContext`，注入 systemPrompt 尾部（ephemeral，不入 ContextWindow）。
6. `recordToolCall(toolName, args, result)`（`:323`）每次工具结果后更新指标：`totalToolCalls++`、`isEvidenceToolCall`（`:752`：code structure/search/read/outline、graph overview/query、terminal exec）计入 `evidenceToolCallCount`、委托 `SignalDetector.detect` 判新信息、`isSearchAction` 标记 `#currentRoundHasSearch`、knowledge 成功（非 error/rejected/duplicate）计 `submitCount`、note_finding 成功写 activeContext 计 `memoryFindingCount`（`:335-355`）。
7. `endRound({hasNewInfo, submitCount, toolNames, skipped})`（`:365`）轮末：更新 `roundsSinceNewInfo`/`roundsSinceSubmit`/`searchRoundsInPhase`/`consecutiveIdleRounds`（无工具调用=真空转），调 `#checkMetricsTransition`，若刚转换则返回 `phase_transition` nudge（scan 管线跳过 SUMMARIZE nudge）。
8. `onTextResponse(text)`（`:428`）处理无工具调用的纯文本：先 `#checkTextTransition`；终结阶段返回 `isFinalAnswer`；终结阶段刚转入则依 pipelineType 返回 digest/report nudge（`needsDigestNudge`）;非终结阶段按 phase 返回「证据不足需继续」类 nudge（EXPLORE 零证据、VERIFY 证据<2、PRODUCE 未提交、RECORD 需 note_finding，`:471-524`）。
9. `forceTerminal(reason)`（`:543`）外部（session token 将耗尽）强制转终结，让 agent 提前出结论而非被硬杀。

#### 阶段转移状态机

- `#checkMetricsTransition()`（`:625`）：取 `phases[currentIndex+1]` 与 `transitions['A→B']` 规则，`rule` 为函数或 `rule.onMetrics`，条件成立调 `#transitionTo`。
- `#checkTextTransition()`（`:645`）：同理但看 `rule.onTextResponse`（可为 bool 或函数）。
- `#transitionTo(newPhase)`（`:675`）：记录 dwellMs、重置 `phaseRounds/searchRoundsInPhase/roundsSinceNewInfo/roundsSinceSubmit/consecutiveIdleRounds`（**跨阶段停滞计数器清零**，防级联过早转换，`:683-687`），置 `#justTransitioned`，发 `exploration/ExplorationTracker.phase` 信号（终结阶段 value=1.0 否则 0.5）。

`#transitionFromPhase` / `#justTransitioned` 供 `NudgeGenerator.buildTransitionNudge` 生成方向感知的转换文本。graceful-exit 三态：`isGracefulExit`（`#gracefulExitRound!=null`）、`isHardExit`（≥ gracefulExitRound+2）。

#### SignalDetector —— 信息增量检测

`SignalDetector.detect(toolName, args, result)`（`SignalDetector.ts:53`）返回 `isNew: boolean`，按工具/action 去重累积 Set：code.search 从 args.pattern(s) + 结果文本抽文件（`extractFilesFromSearchText` 用两条正则解析 `── file ──` 分隔线与 `file:42:` 匹配行，`:197-216`）；code.read/outline/write 收 `params.path`/`filePaths`；code.structure 收 `list:${dir}`；graph.query 收 `graph:${action}:${type}:${entity}`；terminal.exec 收 `terminal:${cmd前100字}`；knowledge submit 恒返回 false；其余泛降级按参数指纹去重。导出 `SEARCH_TOOLS=Set(['code','graph'])` 与 `isSearchAction`（`:22-34`）。

#### NudgeGenerator —— 引导信号生成

`NudgeGenerator`（`NudgeGenerator.ts:73`）无状态化设计（flags 内聚在实例、state 快照从外传，`:14-17`）。`generate(state, trace)`（`:87`）按**优先级队列每轮最多一条**（`:6-12`）：

1. **force_exit**（`#generateForceExit` `:273`）—— graceful exit 后每轮重复发，确保 LLM 停止调用工具；按 pipelineType 返回 analyst 报告 / scan 总结 / bootstrap dimensionDigest JSON 三种模板。
2. **convergence**（一次性，`#convergenceNudged`）—— `roundsSinceNewInfo≥3 && iteration≥10` 且非终结，PRODUCE 与探索阶段文案不同（`:104-129`）。
3. **budget_warning**（一次性）—— `iteration≥75%·maxIterations`（`:131-145`）。
4. **reflection**（`#checkReflection` `:319`）—— 周期（`iteration%interval===0`）或停滞（`roundsSinceNewInfo≥2 && iteration≥4`）触发，从 `trace.getRecentSummary/getStats/getPlan` 拼装反思文本并 `trace.setReflection` 回写。

`#emitNudge`（`:252`）对 **bootstrap 管线**做 nudge 限流：`BOOTSTRAP_NUDGE_BUDGET=4` 条、`BOOTSTRAP_NUDGE_TTL_ROUNDS=2` 轮最小间隔，避免慢模型长跑时重复控制消息（`:68-71`）。`buildTransitionNudge`（`:159`）依 toPhase + pipelineType 生成阶段切换指令（PRODUCE 催提交、RECORD 催 note_finding、SUMMARIZE 依管线出报告/JSON/总结、VERIFY 催证据校验）。`getPhaseContext`（`:230`）返回注入 systemPrompt 尾部的「## 当前状态/进度」行（剩余≤2 轮时紧急警告）。所有 nudge 文本都带「⚠️ 严禁在回复中复制本条指令文字」防指令回显。

#### PlanTracker —— 计划引出与偏差追踪

`PlanTracker`（`PlanTracker.ts:81`）管首轮 plan elicitation、周期 replan、进度匹配、质量评分。`checkPlanning(state, trace)`（`:107`）：终结/PRODUCE/RECORD 阶段返回 null；`iteration===1` 先 `trace.expectPlan()` 并返回 plan-elicitation prompt（bootstrap 用 ≤3 步紧凑版 `#buildCompactPlanElicitationPrompt` `:366`，其余 3-6 步版 `:346`）；有 plan 后按 `periodicTrigger`（interval）或 `deviationTrigger`（`consecutiveOffPlan≥3` 或 `deviationScore>0.6`）触发 replan，受 `MAX_BOOTSTRAP_REPLANS=1` / `MAX_DEFAULT_REPLANS=2` 与 `MIN_REPLAN_GAP=3` 冷却限制（`:75-79,148-165`）。

`updatePlanProgress(trace)`（`:226`）把本轮工具调用与 plan 步骤**模糊匹配**（`#findMatchingStep` `:378`：关键词命中，或 code.structure↔概览/结构、graph↔类/继承/调用/依赖、code.read↔阅读/深入、code.search↔搜索/查找 的语义映射），命中置步骤 `done`、否则累 `unplannedActions`，据此算 `deviationScore = 1 - covered/total`。`getQualityMetrics(trace)`（`:279`）综合 thoughtRatio/reflectionRatio/actionEfficiency/observationCoverage（有 plan 时加 planScore = completion·0.6 + adherence·0.4）算 0-100 分与 breakdown，供诊断/评估消费。

---

### 探索追踪如何反馈到主循环

`AgentRuntime.reactLoop` 与本子系统的完整闭环（行号均在 `AgentRuntime.ts`）：

1. 轮初 `#prepareIteration` 调 `BudgetController.runCompactionCycle()`→`ContextWindow.compactIfNeeded()`（`BudgetController.ts:262`）与 `setSessionPressure`；`#shouldExit` 经 `ExitController` + `tracker.shouldExit()` 判退出（`:432,680`）。
2. 组装输入前 `tracker.tick()`；`tracker.getNudge(trace)` 命中则 `messages.appendUserNudge(nudge.text)`（`:726-728`）；`toolChoice = tracker.getToolChoice()`（`:766`）；`tracker.getPhaseContext()` 作 ephemeral system 尾注（`:775-780`，不存入 ContextWindow）。
3. 输入投影：`compactForProviderInputBudget`（`:940`）+ `toProjectedMessages()`（`:948`）经 `buildLlmInputAssembly` 出最终 LLM 输入。
4. 工具路径：`limitToolResult` 按 `getToolResultQuota` 截断 → `appendToolResult`（`:1407-1478`）→ `tracker.recordToolCall` → `tracker.endRound(...)`，转换 nudge 经 `appendUserNudge` 注入（`:1507-1516`）。
5. 文本路径：`tracker.endRound` + `tracker.onTextResponse`（`:1643-1652`），据 `isFinalAnswer`/`needsDigestNudge`/`shouldContinue`/`nudge` 决定收尾或继续，nudge 同样经 `appendUserNudge`（`:1665-1730`）。
6. L4：`BudgetController` 在 usage≥t4 时 `needsL4Compaction`→挂起→LLM 调用前 `executeL4IfPending`→`ContextWindow.compactL4`（`BudgetController.ts:542,302`），memory 经 `l4MemoryPackageProvider` 回调注入。

因此本子系统对主循环的反馈是**双向且分层**的：`ContextWindow` 控制「输入体积」（压缩/投影/配额），`ExplorationTracker` 控制「行为节奏」（phase→toolChoice→nudge→exit），二者经 `MessageAdapter` 统一 API 与 `BudgetController` 的预算/L4 编排在 reactLoop 中汇合，`SignalBus`（`@alembic/core/events`）承接 exit/phase 观测信号。


## S09 · Prompts · Insight 提示词体系 (src/agent/prompts)

### 概览与定位

`src/agent/prompts` 是 Alembic Agent 冷启动知识挖掘管线（cold-start bootstrap）与扫描管线（scanKnowledge）的**提示词与质量门控领域层**。它是一组**纯领域函数模块**：不含任何 Agent 类、不持有运行时状态、不直接调用 provider。真正的执行循环由 `AgentRuntime` + `PipelineStrategy`（S 系列 runtime/strategy 章节）驱动；本子系统只负责把维度配置、项目信息、记忆上下文、证据、门禁规则等**装配成 systemPrompt / userPrompt 字符串**，并提供 `PipelineStrategy` 每个 stage 的 **gate.evaluator 适配器**。

这是从旧的 `.js` Agent（`AnalystAgent.js` / `ProducerAgent.js` / `HandoffProtocol.js`）迁移下来的纯逻辑（见各文件顶部 JSDoc，如 `src/agent/prompts/insightGate.ts:1`、`insightProducer.ts:1`）。barrel `src/agent/prompts/index.ts:1` 只做 `export *` 汇总五个模块。

四件套 + 扫描 prompts 构成两条完整的 4 阶段流水线，加一条独立的 2 阶段关系发现流水线：

- **Insight（冷启动）流水线**：`analyze`(Analyst) → `quality_gate`(Gate) → `produce`(Producer) → `rejection_gate`(Producer 拒绝率门)。
- **Evolution（进化）流水线**：`evolve`(Evolver) → `evolution_gate`(Evolution Gate)。
- **Scan 流水线**：与冷启动同构，`analyze`(复用 `ANALYST_SYSTEM_PROMPT`) → `quality_gate` → `produce`(extract/summarize) → `rejection_gate`。
- **Relations 流水线**（`scanPrompts.ts` 内）：`explore` → `synthesize`，无质量门控。

关键角色分工由 prompt 硬编码钉死：**Analyst 只探索不提交、Producer 只格式化提交不探索、Evolver 只对现有 Recipe 附加提案不新建、Gate 是唯一质量裁判**。

#### 对外 exports 一览（供下游消费方引用）

| 模块 | 关键导出 | 类型 |
|------|---------|------|
| `insightAnalyst.ts` | `ANALYST_SYSTEM_PROMPT`、`ANALYST_TOOLS`、`ANALYST_BUDGET`、`computeAnalystBudget`、`buildAnalystPrompt` | const / fn |
| `insightProducer.ts` | `PRODUCER_SYSTEM_PROMPT`、`PRODUCER_TOOLS`、`PRODUCER_BUDGET`、`buildProducerPrompt`、`buildProducerPromptV2`、`buildCodeContextSection`、`producerRejectionGateEvaluator` | const / fn |
| `insightGate.ts` | `sanitizeAnalysisText`、`buildAnalysisReport`、`buildAnalysisArtifact`、`analysisQualityGate`、`buildRetryPrompt`、`buildRecordRepairPrompt`、`insightGateEvaluator`、`evolutionGateEvaluator` | fn |
| `insightEvolver.ts` | `EVOLVER_SYSTEM_PROMPT`、`EVOLVER_TOOLS`、`EVOLVER_BUDGET`、`buildEvolverPrompt`、`AuditHint`/`ExistingRecipeForEvolution`/`EvolutionContext` 类型 | const / fn / type |
| `scanPrompts.ts` | `SCAN_TASK_CONFIGS`、`buildScanPipelineStages`、`buildRelationsPipelineStages`（default = `SCAN_TASK_CONFIGS`） | const / fn |

---

### 消费链（谁调用它）

本子系统只有 3 个上游消费方，全部在 Agent 仓内（经真实 grep 确认，无外部消费）：

1. **`src/agent/profiles/presets.ts`** — 装配 `insight` 与 `evolution` 两个 profile 的 `strategy.stages`。
   - `insight` preset（`presets.ts:183`）：`analyze` stage 用 `ANALYST_SYSTEM_PROMPT` + `promptBuilder=buildAnalystPrompt`（11 个位置参数从 `ctx` 逐一取，`presets.ts:204-217`）；`quality_gate` stage 用 `insightGateEvaluator`（`presets.ts:234`）；`produce` stage 用 `PRODUCER_SYSTEM_PROMPT` + `buildProducerPromptV2`（`presets.ts:247-255`）；`rejection_gate` 用 `producerRejectionGateEvaluator`（`presets.ts:298`）；retry 分支用 `buildRetryPrompt`（`presets.ts:224`）。
   - `evolution` preset（`presets.ts:333`）：`evolve` stage 用 `EVOLVER_SYSTEM_PROMPT` + `buildEvolverPrompt`（`presets.ts:350-352`）；`evolution_gate` 用 `evolutionGateEvaluator`（`presets.ts:360`，`useCumulativeToolCalls: true`、`maxRetries: 8`）。
2. **`src/agent/profiles/AgentStageFactoryRegistry.ts`** — 注册三个 stage 工厂：`scanPipeline`（`AgentStageFactoryRegistry.ts:52`，用 `SCAN_TASK_CONFIGS` + `buildScanPipelineStages`）、`relationsPipeline`（`:68`，用 `buildRelationsPipelineStages`）、`bootstrapDimensionPipeline`（`:69`，直接引用 `PRESETS.insight.strategy.stages` / `PRESETS.evolution.strategy.stages` 并注入终端能力档位）。
3. **`src/agent/strategies/PipelineStrategy.ts`** — 只从 `insightGate.ts` 引 `buildRecordRepairPrompt`（`PipelineStrategy.ts:23`），在 gate 返回 `record_repair` 时构建 record-only 补写 stage（`PipelineStrategy.ts:497`）。

`buildProducerPrompt`（v1）目前仅由 `buildProducerPromptV2` 的兄弟路径保留，preset 走的是 v2；v1 是向后兼容的 `AnalysisReport` 路径。

#### 跨子系统 / Core 契约依赖

- `@alembic/core/dimensions` → `getDimensionSOP(dimId)`（`insightAnalyst.ts:16`）：注入每维度的结构化 SOP 步骤与 commonMistakes。
- `@alembic/core/knowledge` → `renderGuidance`、`describeSubmitToolFields`、`SUBMIT_REQUIREMENTS`（`insightProducer.ts:18-22`）：Producer 的写作指南、提交必填字段清单、提交要求全部从 Core 的 `RecipeAuthoringSpec` **权威渲染**，保证「Producer 看到的规则 == 门禁执行的规则」（详见下文 §Producer）。
- `@alembic/core/logging` → `Logger`（`insightGate.ts:18`，惰性 `getInstance()`）。
- `@alembic/core/host-agent-workflows` → 终端能力档位（在 `AgentStageFactoryRegistry.ts:1-5` 解析后经 `toolPolicyHints` 注入 prompt）。
- Agent 内部：`../domain/EvidenceCollector.js`（`insightGate.ts:22`、`insightProducer.ts:23`、`scanPrompts.ts` 类型）与 `../runtime/PcvNodeEvidence.js`（`insightGate.ts:24`）。

---

### insightAnalyst — 分析阶段（542L）

#### 职责
产出 `analyze` stage 的 systemPrompt（`ANALYST_SYSTEM_PROMPT`）、工具白名单、预算、以及 12 段式 userPrompt 构建器 `buildAnalystPrompt`。Analyst 的定位是「高级软件架构师」，**只探索、不提交**。

#### System Prompt 的硬约束（`insightAnalyst.ts:80`）
`ANALYST_SYSTEM_PROMPT` 内嵌一张**五阶段节奏表**（`:85-91`）：①全局扫描(1-3 轮 `code.structure`)②结构化探索(至 60% 轮 `graph.query`/`code.search`)③深度验证(60%-80% `code.read`)④结构化记录(`note_finding`)⑤输出总结。关键规则（`:93-100`）编码了几条不可违背的红线：
- **80% 轮次必须开始写总结**，但总结前必须已有真实代码证据。
- **未调用过 `code.structure`/`code.search`/`graph.query`/`code.read` 之前，禁止输出最终分析**——防止 LLM 凭全景数据幻觉。
- `note_finding` 是**硬性质量依据**（`:99`）：至少 3 条，覆盖多模式时不因超过 6 条而停；缺失会触发 QualityGate retry。
- **单一事实源**（`:100`）：Producer 只消费 `note_finding`，最终 Markdown 不得新增未结构化记录的候选主题。

#### 工具白名单与预算
- `ANALYST_TOOLS = ['code', 'graph', 'terminal', 'memory', 'meta']`（`:121`）——只读探索工具，无 `knowledge`（不允许提交）。
- `ANALYST_BUDGET`（`:128`）：`maxIterations:24`、`searchBudget:18`、`maxSubmits:0`、`softSubmitLimit:0`（显式禁提交），并预算 session 级 token 上限（`maxSessionTokens ≈ 466k` = `24×24000×0.6×1.35`，注释解释推导，`:135-146`）。
- `computeAnalystBudget(fileCount, contextWindowBudget)`（`:165`）：按项目文件数**自适应缩放**——≤40 文件 24 轮；41-100 线性插值到 32；101-200 到 40；>200 封顶 40（`:172-180`）。`searchBudget` 保持 75%，`timeoutMs` 以 480s/24 轮基线线性缩放（`:191-198`）。session token 上限按 `contextWindowBudget×0.6` 每轮估算（`:184-189`）。

#### 12 段式 `buildAnalystPrompt`（`:259`）
签名有 11 个位置参数（dimConfig、projectInfo、dimensionContext、episodicMemory、semanticMemory、codeEntityGraph、rescanContext、panorama、evidenceStarters、evolutionResult、toolPolicyHints）。这些参数由 preset 从 `ctx` 逐一映射（`presets.ts:204-217`）。段落（`parts[]` 拼接，`\n\n` join）按注释 `:231-246` 组织：

1. §1 任务描述（项目名/语言/文件数/维度 label，`:280`）
2. §2 维度指引（`dimConfig.guide`）
3. §3 结构化 SOP：优先 `getDimensionSOP(dimConfig.id)`（Core），逐 step 展开 phase/action/expectedOutput，并附 §3.1「常见错误」质量防护（`:290-306`）；无 SOP 时回退到 guide 的分词「重点关注」列表。
4. §4 输出要求：强制**完整相对路径+行号**（`:326-338`），含【跨维度去重】与【本地子包覆盖】两条硬约束。
5. §5【硬性要求：结构化记录发现】——再次强调 `note_finding` 是 QualityGate 依据、Markdown 不能替代、至少 3 条（`:341-348`）。
6. §6 前序维度上下文：优先 `episodicMemory.buildContextForDimension`（SessionStore），否则 `dimensionContext` 的前序维度摘要 + crossRefs 建议（`:354-384`）。
7. §7 Tier Reflection 跨维度洞察（`:363-368`）。
8. §8 历史语义记忆（Tier 3，`semanticMemory.toPromptSection`，try/catch 静默降级，`:387-401`）。
9. §9 代码实体图谱（`codeEntityGraph.generateContextForAgent`，maxEntities:20/maxEdges:40，try/catch 降级，`:404-417`）。
10. §ES 分析起点证据（Phase 1-4 evidenceStarters，按 strength 降序取前 6，`:420-445`）。
11. §M1 项目全景 Panorama（模块角色/层级/耦合 fanIn-fanOut/已知空白区，`:448-468`）。
12. §EVO Evolution 结果（避免重复覆盖已被 Evolver 处理的 Recipe，`:471-482`）；§终端边界（仅 `terminalCapability.enabled===true` 时注入 exec-only 边界与禁区，`:484-497`）；§10a/§10b Rescan 已有/衰退知识上下文（增量扫描去重，`:500-539`）。

**降级路径**：§8/§9 的记忆与图谱注入均包在 try/catch 中，失败时静默跳过（注释标 `non-critical`），不阻断 prompt 构建。

---

### insightProducer — 生产阶段（563L）

#### 职责
把 Analyst 已确认的结构化发现**格式化并提交**为知识候选（`knowledge.submit`）。定位「知识管理专家」，**只提交、不探索**。

#### System Prompt 的角色边界（`insightProducer.ts:77`）
核心原则（`:79-80`）：「分析文本已包含所有发现，你的工作是格式化、校验并提交」，**唯一候选义务来自 Analyst 的结构化发现**。关键规则（`:97-112`）钉死：不调用 `code.read`/`search`/`graph`/`terminal`（`:99,106`）；`reasoning.sources` 必须非空完整相对路径（`:100`）；不得编造模块别名/类名/路径（`:101`）；submit 前自检 title/description/markdown/rationale/kind/trigger/whenClause/doClause/reasoning.sources 非空（`:103`）；3 个模式提交 3 个候选不合并（`:105`）；跨维度去重（`:107`）。

#### 工具白名单与预算
- `PRODUCER_TOOLS = ['code', 'knowledge', 'meta']`（`:118`）——注意含 `code`，但 prompt 明令禁止用它探索；`code` 保留是为兼容 v1 早期读片段路径。
- `PRODUCER_BUDGET`（`:124`）：`maxIterations:24`、`searchBudget:4`、`maxSubmits:10`、`softSubmitLimit:10`、`idleRoundsToExit:3`。

#### spec-sourced 写作指南（关键设计决策，`:137-170`）
`STYLE_GUIDE = renderGuidance('in-process', undefined, 'cold-start').text`（`:144`）与 `PRODUCER_SUBMIT_FIELD_CONTRACT = buildProducerSubmitFieldContract()`（`:148`，内部调 `describeSubmitToolFields()`）**全部从 Core 的 `RecipeAuthoringSpec` 权威渲染**。注释（`:137-147`）记录了这条决策的动机：在 in-process gate（`validateAgainst`）上线前，Producer 从不知道 stage-1/2 真实门禁，只能反向猜测浪费提交轮次；改为渲染与门禁**同源**的 `gateRules()` 表（保证 guidance==gate），一次性给出写作要求 + 全 stage 门禁 + 45/12 祈使动词白名单 + 3-file 证据下限。按 cold-start 档位渲染以呈现完整规则上界。

#### Prompt 构建器
- `buildProducerPrompt`（v1，`:182`）：处理 `AnalysisReport`，拼分析文本 + 引用文件 + 维度约束 + STYLE_GUIDE + 字段契约 + SUBMIT_REQUIREMENTS。
- `buildProducerPromptV2`（v2，`:238`，preset 实际使用）：处理 `AnalysisArtifact`，段落含 Analyst 分析摘要(压缩)、§3 结构化发现(按 importance 降序、⚠️/📋 徽章)、§4 代码证据、§5 负空间信号(⛔ 不存在的模式)、§6 引用文件、§7 维度约束、§8 写作指南+字段契约+提交要求+§Producer 工具边界、§M1 全景、§9a Rescan 补齐约束(提交上限/禁用已占 trigger)、§9b 衰退 Recipe 可用 `supersedes` 替换(72h 观察窗口)。
- `buildAnalysisDigest`（`:378`）：把长分析文本**压缩**——只保留标题行、含路径行、含 finding 关键词行，上限 2200 字符（`:408-414`），避免在 Producer 阶段重复展开完整分析。
- `buildCodeContextSection`（`:435`，也被 scanPrompts 复用）：从 `evidenceMap` 生成 **refs-first** 证据段（`Package N` 决策，`:428-434`），不再注入大段代码正文，只列 `filePath (role) [L范围] — summary`，1600 字符预算，按 codeSnippets 数降序。

#### Prompt 去重（`:471-517`）
`compactProducerPromptParts` → `compactRepeatedPromptLines`：跨 parts 收集已见过的规范化行（`normalizePromptLineForCompaction` 只对 ≥48 字符行去重，`:511`），`hasSeenPromptLineOverlap` 用**子串包含**判定重叠（`:499-509`），压缩多段拼装时因 STYLE_GUIDE/字段契约/SUBMIT_REQUIREMENTS 重叠产生的冗余。

#### `producerRejectionGateEvaluator`（拒绝率门，`:531`）
面向 `PipelineStrategy` gate.evaluator：统计 submit 调用（默认工具名 `['knowledge']`，可经 `strategyContext.submitToolNames` 覆盖，`:541`）中被拒/出错的数量，判据 `res.status==='rejected'|'error' || res.reason==='validation_failed'`（`:553-554`）。当 **rejected > success 且 rejected >= 2** 时返回 `{action:'retry'}`（`:559`），否则 `pass`。

---

### insightGate — 质量门控内核（973L）

这是四件套里最重的模块，承担**证据构建 + 多维度评分 + 三态门控 + 重试/补写 prompt + 两个 gate.evaluator 适配器**。

#### 1. 分析文本清洗 `sanitizeAnalysisText`（`insightGate.ts:150`）
用一张约 30 条正则的黑名单（`:154-187`）剥除 Analyst 分析文本里泄漏的**系统 nudge / graceful-exit / 探索计划 / 轮次提示 / 中期反思**等内容（如「你已使用/轮次即将耗尽」「请立即停止工具调用」「探索计划」「第 N/M 轮」「dimensionDigest JSON」等），最后折叠 3+ 空行。动机：这些内容若传给 Producer 会干扰其工作流（`:146-149`）。`buildAnalysisReport` 在提取文件引用前先跑一遍它（`:340`）。

#### 2. AnalysisReport (v1) 构建 `buildAnalysisReport`（`:265`）
从 `analystResult.toolCalls` 逆向提取证据：`code.read` → referencedFiles（含 filePaths 数组）；`code.search` → searchQueries + 从结果文本用 `FILE_REF_RE`（`:139`，覆盖 40+ 扩展名）抓文件；`graph` → classesExplored + 经 `projectGraph.getClassInfo/getProtocolInfo` 补 filePath（`:279-337`）。再从清洗后文本抓文件引用。产出 `{analysisText, referencedFiles, searchQueries, classesExplored, dimensionId, metadata}`。

#### 3. AnalysisArtifact (v2) 构建 `buildAnalysisArtifact`（`:379`）
在 v1 基础上叠加三层结构（`:425-454`）：**Layer 1 Core**(analysisText/findings/referencedFiles)、**Layer 2 Detail**(evidenceMap/explorationLog/negativeSignals，来自 `EvidenceCollector.build()`)、**Layer 3 Raw**(fullToolTrace) + qualityReport + metadata(artifactVersion:2)。findings 优先取 `activeContext.distill().keyFindings`（memoryFindingCount）；为空时用 `deriveFindingsFromAnalysisText`（`:224`）从 Markdown section 标题 + 文件引用**派生**（跳过「待探索/总结/概览」等标题，`:220-222`；每 section 取前 3 文件引用，importance = min(10, 5+refs)，上限 5 条）——记为 derivedFindingCount。

#### 4. 多维度质量评分 `buildQualityScores`（`:470`）
4 维度各 0-100，加权求 totalScore（`:524-529`）：
- **depthScore (30%)** = min(100, uniqueFilesRead×15 + snippetCount×5)——文件覆盖深度。
- **breadthScore (20%)** = min(100, toolTypes×20 + effectiveRatio×40)——工具广度 + 有效比例。
- **evidenceScore (30%)** = 有 findings 时 `(evidencedFindings/findingCount)×60 + findingCount×10`；**无 findings 降级**从文本长度/文件引用/片段派生 ≤40 分（防止一份实质分析仅因未用 note_finding 就得 0，`:501-511`）。
- **coherenceScore (20%)** = 文本长度 + 标题/列表结构 + findingCount 综合（`:513-522`）。
suggestions 收集短板（depth<50 需更多 code.read；evidence<50 缺文件级证据；`memoryFindingCount===0` → `REQUIRED_MEMORY_FINDING_SUGGESTION`；`<3` → `INSUFFICIENT_MEMORY_FINDINGS_SUGGESTION`；coherence<50 太短，`:531-549`）。注释（`:539-541`）警示 memoryFindingCount 不区分 native tool_calls 与 DeepSeek 文本转译，需看 AgentRuntime 的 note_finding source 日志。

#### 5. 三态门控 `analysisQualityGate`（`:568`）
自动分流 v2/v1：有 `qualityReport.scores` 走 `applyGateThresholds`，否则 `analysisQualityGateV1`。
- **`applyGateThresholds`（`:575`）**：阈值随 outputType 变——需候选(dual/candidate)时 60，否则 45（`:579`）。若需候选且缺/不足 note_finding，返回 `record_repair`（当分析已够充分 depth≥40/breadth≥35/coherence≥50）或 `analysis_retry`（`:580-599`）。分数 ≥threshold → `pass`；≥threshold-20 → `analysis_retry`；再低 → `degrade`（`:600-614`）。
- **`analysisQualityGateV1`（`:617`）**：4 条规则——字数下限(候选 400/否则 200)、文件引用下限(3/2)、拒答模式检测(`I cannot`/`无法分析` → `degrade`)、结构检测（`:622-648`）。

**门控输出 action 五态**：`pass` / `analysis_retry` / `retry`(evolution 用) / `record_repair` / `degrade`。

#### 6. 重试 & 补写 prompt
- `buildRetryPrompt(reason)`（`:656`）：按失败原因映射具体补救指令（太短→输出 500 字；引用少→读 3 文件；缺结构→编号列表；缺/不足 note_finding→定位+验证+逐条 `note_finding` 带路径行号）。scanPrompts 与 preset 的 `retryPromptBuilder` 都调它。
- `buildRecordRepairPrompt(...)`（`:715`）：**record-only 补写 prompt**——只允许 `note_finding`，禁止 code/graph/terminal/knowledge（`:742-748`），列出已验证文件、已有发现摘要、`stringifyRecordRepairEvidenceMap` 生成的 evidenceMap 证据（`filePath:line`，`:676-702`）与只读分析正文（≤8000 字符）。由 `PipelineStrategy.#runRecordRepairStage` 调用（`PipelineStrategy.ts:497`）。

#### 7. `insightGateEvaluator`（gate 适配器，`:784`）
把 `PipelineStrategy` 的 `(source, phaseResults, strategyContext)` 三参签名适配到 `buildAnalysisArtifact + analysisQualityGate`。无 `source.reply` → 立即 `{action:'degrade'}`（`:789-791`）。有 `activeContext` 走 v2 artifact，否则降级 v1 report（`:796-798`）。outputType 由 `needsCandidates` 决定（`:800-802`）。**跨子系统集成点**：调 `buildPcvQualityGateEvidence`（`../runtime/PcvNodeEvidence.js`）产出 PCV 节点证据，挂到 `artifact.pcvNodeEvidence` 与 metadata（nodeId/missingLinks/status，`:807-821`）——供 grounding guard / PCV DAG 消费。最后打 `[QualityGate]` 结构化日志（4 维分数 + memoryFindings + suggestions，`:830-841`）。返回 `{action, reason, artifact}`。

#### 8. `evolutionGateEvaluator`（`:875`）
Evolution 流水线的门。检查 Evolver 是否对**每个现有 Recipe**都做了决策：遍历 toolCalls，识别 `knowledge.manage(operation:'evolve'|'deprecate'|'skip_evolution', id)` 与 `knowledge.submit(supersedes)`（V2），兼容 V1 独立工具名 `propose_evolution`/`confirm_deprecation`/`skip_evolution`（`:902-941`）。只统计成功调用（`isSuccessfulEvolutionToolCall` 排除 `envelope.ok===false` 与 `result.error`，`:960-968`），且 id 必须在 expectedIdSet 内（`:892-900`）。有未决策 Recipe → `{action:'retry', reason:"只处理了 X/Y…"}`（`:946-952`），否则 `pass`。preset 给它 `maxRetries:8` + `useCumulativeToolCalls:true`（`presets.ts:361-362`），允许 Evolver 分多轮补齐所有 Recipe 决策。

---

### insightEvolver — 进化阶段（324L）

#### 职责
Evolution Agent 接收当前维度的**全部**现有 Recipe（healthy + decaying，按维度过滤注入），读真实代码验证时效性，通过**附加提案（Proposal）**驱动状态变更——**不创建新 Recipe**（那是 Produce 职责，`insightEvolver.ts:1-13,68`）。三种决策：evolve / deprecate / skip_evolution。

#### System Prompt 决策树（`:62`）
`EVOLVER_SYSTEM_PROMPT` 内嵌验证流程 5 步 + 决策树表（`:83-89`）：源文件存在+匹配→**skip**；存在+变化→**evolve(附变更证据)**；不存在+已迁移→**evolve(附迁移证据)**；不存在+无替代→**deprecate**；信息不足→**skip(交时限机制)**。全部经 `knowledge({action:"manage", params:{operation, id, ...}})` 统一调用（`:91-96`）。重要约束（`:98-107`）：每个 Recipe 必须有明确决策；标识字段只有 `id` 禁用 `recipeId`；evidence 必须是真实代码不得编造；`type` 区分 enhance(迁移/扩展) vs correction(描述错误/接口变更)；auditHint 仅供参考，读代码为准（即便预检说 healthy 发现不匹配也要提案）。

#### 工具/预算
- `EVOLVER_TOOLS = ['code', 'graph', 'knowledge']`（`:113`）——可读代码可提交 manage。
- `EVOLVER_BUDGET`（`:119`）：`maxIterations:20`、`searchBudget:10`、`maxSubmits:8`。

#### `buildEvolverPrompt(_phaseInput, _phaseResults, strategyContext)`（`:138`）
签名匹配 `PipelineStrategy` gate/prompt 三参约定（前两参未用）。段落：§1 任务概述(维度 label/id + Recipe 数 + 项目概况)、§2 现有 Recipe 清单（逐条列 title/id/trigger/sourceRefs/coreCode 缩略 400 字符/rationale 缩略 200 字符/可选 auditHint 评分与检查项，`:160-217`）、§3 验证工作流(读源文件→搜索验证→决策，含可选终端验证段，`:219-246`)、§4 决策指令（含完整 `evolve`/`deprecate`/`skip_evolution` JSON 范例 + `suggestedChanges` patch 格式规范：patchVersion/changes[field,action,newValue]，可改字段 coreCode/doClause/…/content.markdown，操作 replace/replace-section/append，`:248-321`）。

`AuditHint`（`:21`）与 `ExistingRecipeForEvolution`（`:34`）、`EvolutionContext`（`:45`）是导出类型，供 preset/orchestrator 装配上下文。

---

### scanPrompts — 扫描类提示词与管线工厂（526L）

#### 职责
提供 `scanKnowledge` 的两条流水线工厂。与冷启动**完全同构**（复用 `ANALYST_SYSTEM_PROMPT` + `insightGateEvaluator` + `producerRejectionGateEvaluator` + `buildCodeContextSection`，`scanPrompts.ts:16-18`），只在 Produce 阶段换成扫描专用 producePrompt。

#### `SCAN_TASK_CONFIGS`（`:77`）
两种 task 的 Produce 阶段配置：
- **extract**（`:80`）：多文件 target 扫描→多 Recipe，工具驱动（knowledge），producePrompt 含「项目特写」写作要求（选了什么/为什么/禁止什么/怎么写）+ 容错规则（读文件失败不重试变体、直接用分析文本提交、提交优先于验证）。`fallback` 返回空 recipes。
- **summarize**（`:125`）：单文件/片段→1~2 高质量 Recipe，producePrompt 要求 content.markdown ≥200 字符含代码块、trigger `@kebab-case`、doClause 英文祈使句。

#### `buildScanPipelineStages(opts)`（`:186`）— 4 阶段工厂
1. **analyze**（`:197`）：`systemPrompt=ANALYST_SYSTEM_PROMPT`、budget(maxIter 默认 24、temp 0.3、timeout 5min)、`retryPromptBuilder` 拼前次分析 + `buildRetryPrompt(reason)`。
2. **quality_gate**（`:223`）：`evaluator=insightGateEvaluator`、maxRetries:1。注释（`:218-222`）明确：有 `strategyContext.activeContext` → `buildAnalysisArtifact`(完整)；无 → `buildAnalysisReport`(降级)。
3. **produce**（`:237`）：`submitToolName:'knowledge'`、`pipelineType:'scan'`、budget 按 summarize/extract 分档(maxIter 12/24、maxSubmits 3/10)、`promptBuilder=buildScanProducerPrompt`（artifact-aware）。工具驱动时附 `retryBudget`(缩减) + `retryPromptBuilder`(列拒绝数+改进清单) + `skipOnDegrade:true`（`:259-297`）。
4. **rejection_gate**（`:303`，仅工具驱动）：包装 `producerRejectionGateEvaluator` 并注入 `submitToolNames`。

#### `buildScanProducerPrompt`（`:346`）
与 `buildProducerPromptV2` 对齐：优先用 `gateArtifact`（analysisText + §2 findings 按 importance 降序 + §3 `buildCodeContextSection(evidenceMap)` + §4 negativeSignals + §5 referencedFiles，`:355-403`）；无 artifact 时 fallback 到 `analyze.reply` 纯文本（≥200 字符）；再不足则直接塞源文件正文（截断 1200 字符，`:406-423`）——防御性保留，注释标「不应发生」。

#### `buildRelationsPipelineStages(opts)`（`:492`）— 关系发现（独立 2 阶段）
不需源文件输入（从知识库查询），无质量门控。`explore`（`:497`，`RELATIONS_EXPLORE_PROMPT`）：查知识库→分析条目关联→读代码验证，输出结构化文本 `[id:UUID] From → [id:UUID] To (type): evidence`，8 种关系类型(requires/extends/enforces/depends_on/inherits/implements/calls/prerequisite)。`synthesize`（`:508`，`RELATIONS_SYNTHESIZE_PROMPT`）：转纯 JSON `{analyzed, relations[]}`，`promptTransform` 拼接 explore.reply（`:518-521`）。硬约束：严格对照探索发现不添加、type 白名单、有 id 优先用 UUID。

---

### 状态机总结：Insight/Scan 流水线的门控流转

`PipelineStrategy` 按 gate 返回的 `action` 驱动（`PipelineStrategy.ts:283-362`）：

1. **pass** → `continue`，进入下一 stage。
2. **degrade** → 置 `ctx.degraded=true`、`markDegraded`，`break`（后续 `skipOnDegrade` stage 被跳过）。
3. **record_repair** → 计数 `_recordRepairRetries_*`；若 ≤ `maxRecordRepairRetries`(默认 1) 则跑 `#runRecordRepairStage`（record-only stage，systemPrompt 钉死「只用 note_finding」，`promptBuilder=buildRecordRepairPrompt`，`PipelineStrategy.ts:478-502`），补写后**重新评估 gate**；仍不过 → 显式降级为 `degraded_no_findings` 并 `break`（宁可降级也不让 Producer 基于缺失证据提交，`:321-333`）。
4. **analysis_retry / retry** → 计数 `_retries_*`；若 ≤ maxRetries 则回退到前一执行 stage(`#findPrevExecStageIdx`)重跑；若预算耗尽(`budgetSuppression`)则降级为 `degraded_budget_exhausted` 并 `break`（`:336-357`）。

Evolution 流水线同理，但 `evolution_gate` 用 `retry` 且 `maxRetries:8` + 累积 toolCalls，允许 Evolver 分多轮把所有 Recipe 决策补齐。

### 值得记录的设计决策
- **guidance == gate 同源**：Producer 的写作指南/字段契约从 Core `RecipeAuthoringSpec` 渲染（`insightProducer.ts:144-148`），杜绝「Producer 猜门禁」的历史问题。
- **单一事实源 note_finding**：Analyst 的结构化发现是 Producer 唯一候选义务，Gate 把 note_finding 数量作为硬评分依据，Markdown 不得旁路（贯穿 Analyst/Producer/Gate 三处 prompt）。
- **refs-first 证据**：`buildCodeContextSection` 只传证据引用不复制代码正文（`insightProducer.ts:428-434`），压缩 live history 与 submit payload。
- **无 findings 的 evidenceScore 降级**（`insightGate.ts:501-511`）：避免实质分析因未用 note_finding 而 0 分，同时仍给 record_repair 留改进空间。
- **纯领域 + 惰性 logger**（`insightGate.ts:26-28`）：模块导入零副作用，logger 首次使用才 materialize。
- **Scan 与冷启动同构**：scanPrompts 直接复用冷启动的 gate/evaluator/证据段，保证两条链的 Recipe 字段与质量口径一致。


## S10 · Runs · Coordination · Tasks · 领域化 Agent 运行 (src/agent/runs, coordination, tasks)

本章剖析 `@alembic/agent` 中把「一次具体的 AI 分析任务」编排成一次 `AgentService.run(...)` 调用的三层薄编排代码:

- `src/agent/runs/*` —— 领域化 run（plan / scan / evolution / relation / translation / module-mining）。每个 run 是一个**无状态纯函数**，负责「构造输入契约 → 调 `AgentService.run` → 把 raw `AgentRunResult` 投影成领域结果」。
- `src/agent/coordination/AgentRunCoordinator.ts` —— fan-out 协调器。当 profile 声明了 concurrency plan 时，把一个父 run 按 partitioner 拆成多个 child run、并发/分层执行、再按 merger 合并。
- `src/agent/tasks/AgentTaskHandlers.ts` —— 预定义 task 流。给宿主 `/api/v1/ai/agent/task` HTTP 入口用的直连 ToolRouter 编排（重复检查、批量补全、质量审计、Guard 全量扫描、关系发现）。

理解本章的关键心智模型：**runs 与 coordinator 都不含 AI 循环本身**。真正的 react loop / 工具执行 / 上下文装配全部在 `AgentService → AgentRuntime`（见 runtime/service 章）。runs 只做「契约装配 + 结果投影」，coordinator 只做「拆分 + 并发 + 合并」。这一层刻意保持薄，是仓库 CLAUDE.md「Agent 侧只保留 orchestration / policy / runtime wiring」边界的直接体现。

---

### S10.1 职责定位与对外 API

#### 对外 exports

领域化 run 的 barrel 是 `src/agent/runs/index.ts`（`src/agent/runs/index.ts:1`），它导出所有 run 函数与 projection 函数；再经 `src/agent/service/index.ts:5` 汇聚，最终由 `src/agent/index.ts:87`（`export * from './service/index.js'`）与包根 `src/index.ts` 暴露到 `@alembic/core/... ` 之外的 `@alembic/agent` 包表面。因此**外部宿主（Plugin / Core workflow 层）真正消费的入口就是这些 run 函数**，而不是各 run 文件内部：

| export | 来源文件 |
| --- | --- |
| `runPlanAgent` | `runs/plan/PlanAgentRun.ts:14` |
| `runScanAgentTask`, `toScanFileCache` | `runs/scan/ScanAgentRun.ts:31` / `:88` |
| `projectScanRunResult`（+ `extractCollectedRecipes`） | `runs/scan/ScanRunProjection.ts:38` / `:86` |
| `runEvolutionAudit`, `projectEvolutionAuditResult` | `runs/evolution/EvolutionAgentRun.ts:46` / `:112` |
| `runRelationDiscovery`, `projectRelationDiscoveryResult` | `runs/relation/RelationAgentRun.ts:9` / `:34` |
| `runTranslationJson` | `runs/translation/TranslationAgentRun.ts:9` |
| `runModuleMining` = `runProjectIndexScopedModuleMining` | `runs/module-mining/ProjectIndexModuleMiningAgentRun.ts:161` / `:23` |
| `AgentRunCoordinator`（default + named） | `coordination/AgentRunCoordinator.ts:21` |

`src/agent/runs/module/ModuleMiningAgentRun.ts` 是一层纯 re-export shim（`runs/module/ModuleMiningAgentRun.ts:7`），实体在 `module-mining/ProjectIndexModuleMiningAgentRun.ts`。`runModuleMining` 只是 `runProjectIndexScopedModuleMining` 的别名（`module-mining/ProjectIndexModuleMiningAgentRun.ts:161`），历史命名保留兼容。

#### tasks 不在包表面

`src/agent/tasks/index.ts` 导出 `taskCheckAndSubmit / taskDiscoverAllRelations / taskFullEnrich / taskQualityAudit / taskGuardFullScan`，但**未**经 `agent/index.ts` 再导出（`agent/index.ts` 只 `export * from './service/index.js'`）。文件头注释点明其定位（`tasks/AgentTaskHandlers.ts:1-6`）：这些是宿主 HTTP 层 `/api/v1/ai/agent/task` 的预定义流，由宿主直接 import 装配，`src` 内无消费方（已 grep 确认）。它们与 chat runtime 逻辑无关，直连 `ToolRouter`，仅 relation 发现委托 `AgentService.run`。

---

### S10.2 领域化 run 的统一形态

所有 run 遵循同一模板（以 `runPlanAgent` 为例，`runs/plan/PlanAgentRun.ts:14-43`）：

1. **构造 `AgentRunInput`**：`profile`（只给 `{ id }` ref）、`params`、`message`（`role:'internal'` 的内部消息 + prompt content + metadata）、`context`（`source:'system-workflow'`, `runtimeSource:'system'` + 领域上下文）、可选 `execution`（budget/toolChoice override）与 `presentation`（几乎恒为 `responseShape:'system-task-result'`）。
2. **调 `agentService.run(input)`** —— 唯一的重活外包点。
3. **projection**：把 raw `AgentRunResult`（`service/AgentRunContracts.ts:208`）投影成领域结果类型。

`AgentRunInput` / `AgentRunResult` 契约定义在 `service/AgentRunContracts.ts:190` / `:208`。关键字段：`AgentRunResult.status ∈ {success, blocked, aborted, timeout, error}`（`:199`）、`reply`、`phases`（pipeline 各阶段产物）、`toolCalls`、`usage`（tokens/iterations/durationMs）、`diagnostics`。projection 层就是从这三处（reply / phases / toolCalls）里提取领域信息。

#### run 类型 → profile → strategy → prompt 对照表

profile 定义在 `src/agent/profiles/definitions/*.profile.ts`，被 `AgentProfileCompiler` 编译成 `CompiledAgentProfile`（`AgentRunContracts.ts:89`）。run 只按 `profile.id` 引用，profile 决定 basePreset、budget policy、persona、actionSpace、strategy、concurrency、projection。

| run 函数 | profile id | serviceKind / basePreset | strategy | concurrency | 输出 shape / projection | prompt 生成方式 |
| --- | --- | --- | --- | --- | --- | --- |
| `runPlanAgent` | `plan-selection` | system-analysis / chat | `single` | none | `json-object` → `PlanSelection` | `buildPlanSelectionPrompt`（内联，含模块候选引导）+ persona 硬约束 `plan.profile.ts:15` |
| `runScanAgentTask`(extract) | `scan-extract` | knowledge-production / insight | `pipeline: scanPipeline` | none | `scan-recipes` → `ScanKnowledgeProjection` | 极短内联「分析 N 个源文件」+ SCAN_TASK_CONFIGS/pipeline prompt |
| `runScanAgentTask`(summarize) | `scan-summarize` | knowledge-production / insight | `pipeline: scanPipeline` | none | `scan-recipes` | 同上 |
| `runEvolutionAudit` | `evolution-audit` | system-analysis / **evolution** | `preset` | none | `evolution-audit` → `EvolutionAuditResult` | 短内联「验证 N 条 Recipe」，真实数据经 `strategyContext.existingRecipes` 注入 |
| `runRelationDiscovery` | `relation-discovery` | knowledge-production / insight | `pipeline: relationsPipeline` | none | `relation-discovery` → `RelationDiscoveryResult` | 内联「探索知识库语义关系，每批 ~N 条」 |
| `runTranslationJson` | `translation-json` | translation / chat | `single` | none | `json-object` → `TranslationJsonResult` | 内联「翻译为英文，输出纯 JSON」+ persona `translation.profile.ts:15` |
| `runProjectIndexScopedModuleMining` | `module-mining-session` | system-analysis / insight | `fanout` | **tiered** | `agent-result`（raw `AgentRunResult`） | `buildProjectIndexScopedModulePrompt`（fan-out 引导）|
| （fan-out child） | `module-mining-dimension` | system-analysis / insight | `pipeline: bootstrapDimensionPipeline` | — | `agent-result` | partitioner 为每模块合成 `dimConfig.guide` |
| （bootstrap fan-out） | `bootstrap-session` / `bootstrap-dimension` | system-analysis / insight | `fanout` / `pipeline` | **tiered** | `agent-result` | 由外部构造 `params.dimensions` |

要点：

- **只有 `module-mining-session` 和 `bootstrap-session` 声明了 concurrency plan**（`ProjectIndexModuleMiningProfile.ts:24`、`bootstrap.profile.ts:19`），因此**只有它们会进入 AgentRunCoordinator 的 fan-out 路径**；其余 run 全是 `mode:'none'`，直落 runtime。
- `plan-selection` 与 `translation-json` 用 `strategy: single`（一步出结果）且 budget 极小（plan `maxIterations:2`，translation `maxIterations:1`，`plan.profile.ts:13` / `translation.profile.ts:13`），`actionSpace: none`——纯生成、禁工具、禁 memory、禁写状态。
- scan/relation 用 pipeline strategy（`scanPipeline` / `relationsPipeline`，注册在 `profiles/AgentStageFactoryRegistry.ts:52/:68`），budget 大（scan `maxIterations:30, timeoutMs:3.6e6`），是真正带工具的多阶段挖掘。

---

### S10.3 PlanAgentRun —— 规划前置（stateless plan gate）

`runPlanAgent`（`runs/plan/PlanAgentRun.ts:14`）是主体 AI 的**无状态规划前置**：给定 `generationStage`（`PlanStageId`，来自 `@alembic/core/plans`）与 `projectContextFacts`，产出一份 `PlanSelection`（本轮要跑哪些 dimensions、scale 预算、moduleBindings）。

#### 输入 / 输出

- 输入 `RunPlanAgentInput`（`:8`）：`agentService`（只需 `Pick<AgentService,'run'>`）、`generationStage`、`projectContextFacts:unknown`。
- 关键 execution 开关：`execution: { toolChoiceOverride: 'none' }`（`:32`）——**硬禁工具**，因为 plan 只能基于传入事实决策、不得访问文件/DB/ledger（persona 硬约束 `plan.profile.ts:22`）。
- 输出 `PlanSelection`，经 `parsePlanSelection`（`:92`）解析并用 `assertPlanSelectionStageRequirements`（`@alembic/core/plans`，`:100`）做**阶段级 schema 校验**——这是与 Core 契约的关键集成点：Agent 侧只负责让 AI 产出，Core 侧 owner `PlanSelection` 的形状校验。

#### prompt 构造：模块候选防幻觉

`buildPlanSelectionPrompt`（`:45`）的核心工作是**从 ProjectContext facts 里抽出真实模块候选**再喂给 AI，防止 `deepMining/moduleMining` 阶段编造 `moduleBindings`：

- `selectProjectContextModuleCandidates`（`:142`）按优先级从**多种事实形态**读候选并去重（保留前 20）：
  - `projectInfoTree.children`（U3 后 Core 精简投影 `buildPlanFactsProjection` 的形态，`:152`，注释 `:150-151`/`:198-199` 详解）；
  - flat 形态 `projectMapModules` / `moduleSeeds`（`:156-157`）；
  - `presenterInput.modules` / `presenterInput.map.modules`（host-agent 全量 facts 兼容形态，`:158-159`）。
- 每种读取器（`readFlatModuleCandidates :177` / `readProjectInfoTreeModuleCandidates :200` / `readPresenterModuleCandidates :224`）用一组防御式 helper（`readRecord/readArray/readString/readStringArray/readRefFilePath`）从异构 facts 提取 `{modulePath, moduleId?, moduleName?, ownedFiles?, source}`。这套「同时兼容精简投影 + 全量 facts」的多源读取是本文件最重的逻辑，体现**双宿主（in-process 主体 vs host-agent）事实形态并存**的设计现实。
- `stageGuidance`（`:65`）按阶段分叉：`deepMining/moduleMining` 要求 `moduleBindings` 非空且 modulePath 必须来自真实候选（`:66-72`）；`coldStart` 保持兼容、允许空 bindings（`:74`）。当候选为空时，prompt 明确写「不要编造 moduleBindings；输出会被阶段校验拒绝」（`:63`）——把 Core 的硬校验规则前置到 prompt 提示里，形成「提示 + 校验」双保险。

#### 错误 / 回退路径

- run 失败：`result.status !== 'success'` → 直接 `throw new Error(...)`（`:36-40`），**不静默回退到全量**（persona 也明确禁止「回退到全量作为失败掩盖」`plan.profile.ts`）。
- 解析：`parseJsonObjectFromReply`（`:107`）三级回退——先剥 ```json``` code block、再整串 `JSON.parse`、再正则抓 `{...}`；任一失败抛「invalid JSON」。空 reply 直接抛「empty reply」（`:96`）。这是**严格模式**：plan 宁可失败也不产出污染选择。

---

### S10.4 ScanAgentRun + ScanRunProjection —— 扫描提取/摘要

`runScanAgentTask`（`runs/scan/ScanAgentRun.ts:31`）是主力的**代码扫描 → Recipe 提取**入口，两种 task：`extract`（多文件 target → 多 Recipe）、`summarize`（单文件/片段 → 1~2 Recipe）。

#### 输入装配与 SystemRunContext

- `RunScanAgentTaskOptions`（`:19`）：`files`（`ScanAgentFileInput[]`）、`task`、`lang`、`comprehensive`、`source`、`onParseError` 回调。
- `toScanFileCache`（`:88`）把外部文件形态归一为 `FileCacheEntry[]`（补 `relativePath/name/content` 默认值）。
- **budget 分叉**：`analyzeMaxIter = task==='summarize' ? 12 : 24`（`:51`）——摘要迭代少、提取迭代多。
- 通过 `systemRunContextFactory.createSystemContext({ budget:{maxIterations}, trackerStrategy:'analyst', label, lang })`（`:52`）创建一次**独立系统运行上下文**。`SystemRunContextFactory.createSystemContext`（`service/SystemRunContextFactory.ts:35`）内部 new 一个 `MemoryCoordinator({mode:'bootstrap'})`、建 `scopeId = 'scan:<label>'`、装 `ExplorationTracker`（`analyst` 策略）、初始化 `sharedState.submittedTitles/submittedPatterns`（去重集合，`:57-60`）——即每次 scan 有**隔离的记忆域 + 探索追踪器 + 去重状态**。该 systemRunContext 与 `strategyContext` 一并注入 run（`ScanAgentRun.ts:71-74`），`promptContext.dimensionScopeId = scopeId`。

#### projection：工具产物优先，reply 兜底

`projectScanRunResult`（`ScanRunProjection.ts:38`）是理解「scan 结果从哪来」的关键：

1. **优先从 toolCalls 提取**：`extractCollectedRecipes`（`:86`）过滤 `tool==='knowledge'` 且 `result.status==='collected' && result.recipe` 的调用，收集 `ScanRecipe[]`。即真正的产物走**工具驱动**（AI 通过 `knowledge` 工具 collect recipe），而非 reply 文本。
2. 若有 recipe：`summarize` 取首条投影成单 Recipe 字段（title/summary/usageGuide/…，`:49-61`），`extract` 返回 `{targetName, extracted, recipes}`（`:63`）。
3. **无工具产物时才回退到 reply 解析**（`:66-72`）：优先 `phases.produce.reply`，再 `result.reply`，经 `parseJsonResponseWithDiagnostics`（`:99`，同款三级 JSON 回退）。解析失败则用 `fallback(label)`（来自 `SCAN_TASK_CONFIGS[task].fallback`，返回 `{targetName, extracted:0, recipes:[]}`）并记 `usedFallback:true` + `parseError`，同时触发 `onParseError` 回调。
4. 无论哪条路径都附 `diagnostics`（`buildScanDiagnostics :127`）：`recipesFound / usedFallback / parseError / toolCallCount / collectScanRecipeCallCount / iterations / durationMs / runtimeDiagnostics / 各 phase 的 replyLength+toolCallCount`。这份诊断是可观测性的核心——能区分「工具产出 vs reply 兜底 vs fallback 降级」三条路径（符合 CLAUDE.md「区分 native tool call / parser fallback / degraded path」的要求）。

`ScanTaskConfig`（`:8`）只需要 `fallback(label)`，实际 prompt/pipeline 阶段配置在 `prompts/scanPrompts.ts` 的 `SCAN_TASK_CONFIGS`（`extract`/`summarize` 两键），未知 task 立即抛错（`ScanAgentRun.ts:43`）。

---

### S10.5 EvolutionAgentRun —— 进化审计（决策完备性硬门）

`runEvolutionAudit`（`runs/evolution/EvolutionAgentRun.ts:46`）让 AI 逐条验证既有 Recipe 的源码真实性并提交进化决策（propose / deprecate / skip）。

#### 输入 / 数据结构

- 输入 recipes（`EvolutionAuditRecipe[]`，`:5`）带 `auditHint`（relevanceScore/verdict/evidence 如 `symbolsAlive/depsIntact/codeFilesExist`/decayReasons，`:11`）与 `impactEvidence`（diff-based 增量 rescan 证据：`reason/affectedFiles/impactScore/matchedTokens`，`:23`），以及 `projectOverview`（`:31`）。
- `recipes.length===0` 时**空短路**返回全零结果（`:62-64`）。
- 真实数据经 `strategyContext`（`:71`）注入 run：`existingRecipes / dimensionId / dimensionLabel / projectOverview / sharedState`。`proposalSource` 若给出则写进 `sharedState.evolutionProposalSource`（`:66-69`）透传给 evolution-tools。message content 只是极短提示（`:83`），**真实负载在 strategyContext 而非 prompt 文本**——这是 evolution 与 plan/translation（负载在 prompt）的显著区别。

#### 核心不变量：决策必须覆盖每条 Recipe

run 完成后做**决策完备性校验**（`:99-108`）：用 `collectEvolutionDecisionIds`（`:241`）从 toolCalls 里收集真正产生决策的 recipe id 集合；若 `decisionIds.size < recipes.length` 则算出 `pending` 并 **抛错 `Evolution audit incomplete: ...`**。这是本 run 的核心硬门——**AI 不能漏审任何一条**，宁可整轮失败。

`collectEvolutionDecisionIds`（`:241`）同时兼容 V2 与 V1 两套工具形态：
- V2：`tool==='knowledge' && action==='manage'` 且 `params.operation ∈ {evolve, deprecate, skip_evolution}`、取 `params.id||params.recipeId`（`:263-273`）；submit + `supersedes` 也算对被取代者的决策（`:275-278`）。
- V1 compat：独立工具名 `propose_evolution / confirm_deprecation / skip_evolution` 取 `args.recipeId`（`:281-289`）。
- `expectedIds` 白名单过滤（`:251`）保证只统计本批 recipe。

#### 结果投影：统计三类结局

`projectEvolutionAuditResult`（`:112`）从 toolCalls 统计 `EvolutionAuditResult`（proposed/deprecated/skipped/iterations/toolCalls/reply）：
- `isSuccessfulManageCall`（`:160`）先过滤失败调用（`envelope.ok===false` 或 `result.error` 是 string）——**只统计成功的工具调用**。
- `countProposalOutcomes`（`:171`）优先读结构化 `outcome`（`proposal-created`/`proposal-upgraded`），无 outcome 时回退读 `status`（`evolution_proposed`/`evolution_proposal_upgraded`/`deprecation_proposed`）——**新旧工具结果 schema 并存的双读**。
- `countImmediateDeprecations`（`:195`）同理（outcome `immediately-executed` / status `deprecated`）。
- `readEvolutionToolResult`（`:227`）优先读 `result.data`、回退 `result`——适配工具结果包在 `data` 里或直挂根上两种形态。

---

### S10.6 RelationAgentRun —— 知识条目关系发现

`runRelationDiscovery`（`runs/relation/RelationAgentRun.ts:9`）让 AI 探索知识库中知识条目之间的语义关系，按 `batchSize`（默认 20）分批。输入最简（只 `agentService` + `batchSize`），无额外上下文注入——**知识库读取靠 AI 走工具**（relationsPipeline，budget `maxIterations:28`）。

`projectRelationDiscoveryResult`（`:34`）从 `phases.synthesize.reply`（回退 `result.reply`）解析出 `{analyzed:number, relations:Array<{from,to,type,evidence?}>}`，附 diagnostics。`parseJsonResponse`（`:52`）同款三级 JSON 回退，**任何解析失败静默回退到 `{analyzed:0, relations:[]}`**（`:69`，catch 无参）——与 plan/evolution 的严格抛错不同，relation 采用**宽松降级**，因为关系发现是增量增强、失败不阻断主流程。

该 run 也是 `taskDiscoverAllRelations`（tasks 层）的委托目标（`tasks/AgentTaskHandlers.ts:127`）。

---

### S10.7 TranslationAgentRun —— 中→英 JSON 翻译

`runTranslationJson`（`runs/translation/TranslationAgentRun.ts:9`）把 Recipe 的 `summary`/`usageGuide` 翻成英文，输出 `{summaryEn, usageGuideEn, error?}`。

- **早退**：`!summary && !usageGuide` 时直接返回空串（`:20-22`）。
- profile budget 极小（`maxIterations:1`，`translation.profile.ts:13`），`single` strategy、`lang:'en'`、`actionSpace:none`——纯一步生成。
- **回退是原文而非报错**：run 失败（`:40`）或解析失败（`parseTranslationJson :58` catch）都**回退到原始中文文本**并带 `error` 字段（`:41-45` / `:76-79`）。`normalizeTranslation`（`:82`）逐字段校验类型，非 string 字段回退 fallback。这体现翻译是**best-effort 增强**：宁可保留原文也不丢内容。

---

### S10.8 ModuleMining —— ProjectIndex 作用域模块挖掘（fan-out 父 run）

`runProjectIndexScopedModuleMining`（`runs/module-mining/ProjectIndexModuleMiningAgentRun.ts:23`，别名 `runModuleMining`）是**唯一由领域 run 直接触发 coordinator fan-out 的入口**。它以 `module-mining-session` profile 运行，该 profile 声明了 `fanout` strategy + `tiered` concurrency（`ProjectIndexModuleMiningProfile.ts:18-31`），于是 `AgentService.run` 会把它交给 `AgentRunCoordinator`（见 S10.9）。

- 输入 `RunProjectIndexScopedModuleMiningInput`（`:14`）：`modules`（`ProjectIndexScopedModule[]`）、`projectFacts`、`budget?`、`scaleCap?`、`concurrency?`。
- **scaleCap 裁剪 + 归一**：`selectScopedIndexModulesForRun`（`:81`）按 `scaleCap` 截取模块（`Math.max(0, floor(cap))`），空输入或裁剪后为空都抛错（`:83`/`:90`——不容忍空 fan-out）。`normalizeScopedIndexModule`（`:96`）把异构字段统一成同时带 `moduleId/id/moduleName/name/ownedFiles/files` 的形态，兜底 `module-${index}`。
- prompt `buildProjectIndexScopedModulePrompt`（`:122`）明确 fan-out 契约：**父 run 只按 ProjectIndex scoped modules 拆 child；每个 child 用完整 analyst budget，不按模块数分预算；fan-out 来源必须是 params.modules / ProjectMap.modules，不得从 moduleSeeds/dimensions/ledger 推导**（`:132-133`）——防幻觉，与 plan 的模块防编造同源。
- `params.modules` 是拆分依据，同时经 `params`/`promptContext`/`execution.budgetOverride` 传入（`:34-66`）；`stripUndefined`（`:142`）清理空字段。
- 失败即抛（`:70-77`），返回 raw `AgentRunResult`（projection 交由外部/merger）。

---

### S10.9 AgentRunCoordinator —— fan-out 编排模型（666L）

`AgentRunCoordinator`（`coordination/AgentRunCoordinator.ts:21`）是本章的编排内核。它**不感知领域语义**，只按 profile 的 `concurrency` plan 做「拆分—并发/分层—合并」。它由 `AgentService` 持有并在每次 run 前用 `canCoordinate` 判定是否走 fan-out（`service/AgentService.ts:42/:54`）。

#### 注册表模型（Partitioner / Merger）

构造时注册两组内置策略（`:25-30`）：

| 名字 | 类型 | 用途 |
| --- | --- | --- |
| `bootstrapSessionDimensions` | Partitioner | 按 `params.dimensions` 拆维度 child（`:313`）|
| `bootstrapSessionResults` | Merger | 汇成 `phases.dimensionResults`（`:499`）|
| `projectContextModules` | Partitioner | 按 `params.modules` 拆模块 child（`:374`）|
| `moduleMiningResults` | Merger | 汇成 `phases.moduleResults`（`:520`）|

`registerPartitioner/registerMerger`（`:32`/`:37`）允许外部扩展。类型签名：`Partitioner = (input, profile) => AgentRunInput[]`、`Merger = (results, input, profile) => AgentRunResult`（`:13-16`）。

#### 编排主流程 `run()`（`:46`）

1. `canCoordinate`（`:42`）：`profile.concurrency && mode!=='none'`。非协调则返回 `null`，`AgentService` 回落到普通 runtime 执行（`AgentService.ts:63/:80`）。
2. 取 `partitioner`（缺失或未注册都抛错，`:52-57`）→ `partitioner(input, profile)` 得 `childInputs`。
3. `runChildren(...)`（`:75`）执行 child。
4. 取 `merger`（可选；指定了但未注册则抛错，`:66-70`）→ `merger(...)`；无 merger 用 `defaultMerge`（`:71`）。

#### 并发与分层执行 `runChildren`（`:75`）

- 并发度 `resolveConcurrency`（`:246`）：支持 `number` 或 `{env, default}`——从 `process.env[env]` 读并发数（如 `ALEMBIC_MODULE_MINING_CONCURRENCY`/`ALEMBIC_BOOTSTRAP_CONCURRENCY`，默认 2），非法回退 default。用 `createLimit(concurrency)`（`shared/concurrency.js`）做并发闸。
- **两种模式**：
  - **非 tiered（parallel）**：`Promise.all` + limit 一次性并发所有 child（`:87-90`）。
  - **tiered（分层）**：`groupByTier`（`:257`）按 `child.params.tier || message.metadata.tier || 0`（`resolveTier :266`）分组、tier 号升序（`:263`）**逐层串行**；每层内并发（`:105`）。**每层开始前检查 abort**（`shouldAbort :158`）——若已取消，把剩余各层的 child 全部标记为 aborted 结果并 break（`:95-103`）。每层完成后触发 `context.coordination?.onTierComplete?.(...)`（`:108`）钩子。
- module-mining / bootstrap 都用 `tiered` + `abortPolicy: 'finish-tier'`——即取消时不打断进行中的层，只停止后续层。

#### 单 child 执行与钩子 `runChildWithHooks`（`:118`）

- 执行前再查 abort（`:124`）→ aborted 结果。
- **懒解析** `resolveLazyChildInput`（`:237`）：若 `parentInput.context.childInputFactories[dimId]` 存在，则调工厂延迟生成真正的 child input（供外部在 child 真正开跑前才装配重上下文，如按 tier 顺序注入前一层结果）。
- `runChild(resolvedChildInput)`（就是 `AgentService.run` 的递归，`AgentService.ts:60-61`）。**child 抛错被 try/catch 转成 error 结果**（`createChildErrorResult :179`）而非冒泡——保证一个 child 失败不炸整批。
- 每个 child 完成后触发 `context.coordination?.onChildResult?.(...)`（`:138`）。

#### 三类 child 结果（状态机）

coordinator 为每个 child 产出统一 `AgentRunResult`，status 三态：
- **success/其它**：真实 runtime 结果。
- **error**：`createChildErrorResult`（`:179`）——`runId:'<dim>:error'`, `status:'error'`, `phases.error=message`, 零 usage。
- **aborted**：`createChildAbortedResult`（`:202`）——`status:'aborted'`, `reply:'child-run-aborted'`, `phases.aborted=true`。

`resolveDimensionId`（`:278`）从 `params.dimId` 或 `metadata.dimension` 提 child 标识，`profileIdForResult`（`:224`）按 `id→preset→basePreset→'unknown'` 回退填 profileId。

#### 合并 `defaultMerge`（`:290`）与领域 merger

- `defaultMerge`：status 传播规则——**任一 error → error；否则任一 aborted → aborted；否则 success**（`:291-300`）；reply 用 `\n\n` 拼接，toolCalls flat 汇总，usage 各项求和。
- `mergeBootstrapSessionResults`（`:499`）/ `mergeProjectIndexScopedModuleResults`（`:520`）在 defaultMerge 基础上，额外把 child 结果按 dimensionId / moduleId 索引到 `phases.dimensionResults` / `phases.moduleResults`——**保留 per-unit 可寻址结果**供下游按维度/模块回写覆盖。

#### Partitioner 内部：child input 的深度装配

两个 partitioner 是本文件最重的代码：

- `partitionBootstrapSessionDimensions`（`:313`）：从 `params.dimensions` 逐维度合成 child `AgentRunInput`——child profile 默认 `bootstrap-dimension`（可被 `dimension.profile` 覆盖，`toProfileRef :618`），合并 baseParams + 维度 params、注入 `promptContext.dimId/dimensionId`、message metadata 打 `phase:'bootstrap-session-child'`、从 `context.childContexts[dimId]` 取维度专属上下文，并**剥离 `childContexts/childInputFactories`**（`:364-365`）避免嵌套传递。
- `partitionProjectIndexScopedModules`（`:374`）：空 modules 抛错（`:379`）；为每模块构造 `strategyContext`（含 `projectFacts/projectInfo/dimConfig/moduleContext`，`:431`）、`promptContext`、per-module `dimConfig`（`buildScopedIndexModuleDimConfig :573`——合成 `guide`「只分析 module X」+ `focusKeywords` + `allowedKnowledgeTypes:['rule','pattern','fact']`）。`buildProjectIndexModuleInfo`（`:547`）从 projectFacts 归一 `{name, lang, fileCount}`（fileCount 兜底 ownedFiles 长度）。message metadata 打 `phase:'module-mining-child'`。

这两个 partitioner 把「父 run 的粗上下文」精细拆成「每个 child 的自足上下文」，是 fan-out 隔离性的实现处（每 child 只看自己的模块/维度，符合 profile persona 的「不从 dimension/moduleSeeds 推导模块」约束）。

#### coordinator 的取消 / 部分结果语义

- 取消源：`execution.abortSignal.aborted` 或 `execution.shouldAbort()`（`shouldAbort :158`）。
- tiered 模式下取消是**层边界生效**（finish-tier）：进行中的层跑完，后续层全 aborted。
- **永不整批抛错**：child error/abort 都转成结果对象，最终由 merger 汇总 status。因此 coordinator 天然支持**部分结果**——部分 child 成功 + 部分 error/aborted 会得到 `status:'error'`（有 error）但 `phases.*Results` 仍带成功 child 的产物，下游可按需回写。

---

### S10.10 AgentTaskHandlers —— 预定义 task 流（291L）

`AgentTaskHandlers`（`tasks/AgentTaskHandlers.ts`）是给宿主 HTTP `/api/v1/ai/agent/task` 的**直连 ToolRouter 编排**，与 chat runtime 无关（文件头 `:1-6`）。`TaskContext`（`:16`）提供 `invokeToolEnvelope(toolName, params)`（返回 `ToolResultEnvelope`）、可选 `aiProvider`、DI `container`。所有工具调用经 `invokeTaskTool`（`:278`）→ `projectTaskToolEnvelope`（`:286`，优先 `structuredContent`、回退 `projectToolResultOrdinaryOutput`，来自 `#tools/kernel`）。

五个 handler：

1. **`taskCheckAndSubmit`**（`:66`）：调 `check_duplicate` 工具（threshold 0.5）→ 取 similarity≥0.7 的高相似项 → 若有且有 aiProvider，让 AI 判 `DUPLICATE/SIMILAR/UNIQUE`（`temperature:0, maxTokens:20`，只取首词，`:97-98`）→ 综合出 `recommendation`（`safe_to_submit`/`block_duplicate`/`review_suggested`，`:108-113`）。AI 判定失败**静默忽略**（`:99` catch 空）——AI 是可选增强。
2. **`taskDiscoverAllRelations`**（`:117`）：从 `container.get('agentService')` 取服务，**先探测 mock AI**（`container.singletons._aiProviderManager.isMock`，`:121-124`）——mock 模式直接跳过关系发现返回提示；否则委托 `runRelationDiscovery`（S10.6）。这是 tasks 层唯一委托 AgentService.run 的 handler。
3. **`taskFullEnrich`**（`:130`）：从 `knowledgeService.list({lifecycle:status})` 取候选，过滤缺 `rationale/knowledgeType/complexity` 的项（`:146-149`），批量调 `enrich_candidate` 工具（截前 20，`:155-157`）。
4. **`taskQualityAudit`**（`:160`）：对 active recipes 逐条调 `quality_score` 工具，统计 grade 分布（A~F）、收集 score<threshold（默认 0.6）的 lowQuality 列表并按分升序排序（`:206`）。
5. **`taskGuardFullScan`**（`:217`）：调 `guard_check_code`（scope:'project'）；若有违规且有 aiProvider，让 AI 用**结构化输出**（`chatWithStructuredOutput`，`openChar:'['`, `closeChar:']'`）为前 5 条违规生成修复建议（`:246-263`）。AI 失败静默回退空建议。

共性设计：**deterministic 工具主导 + AI 可选增强**。所有 AI 调用都包 try/catch 静默降级（`:99`/`:264`），AI 不可用不阻断确定性结果——符合 CLAUDE.md「AI 行为必须有 deterministic shell」。相关类型（`CandidateInput/DuplicateEntry/KnowledgeItem/KnowledgeServiceLike/GuardViolation/TaskAiProvider/TaskContext`）经 `tasks/index.ts` 导出。

---

### S10.11 集成点、设计模式与横切要点

**上游调用方**（who calls in）：领域 run 全部经包表面导出，由**外部宿主**消费——in-process 主体 AI（Alembic 主仓 lifecycle workflow，如 `KnowledgeRescanWorkflow` / `DaemonJobRunner`）与 host-agent（Plugin 冷启动/rescan/evolution 管线）。`src` 内无消费方（除 barrel），印证这是**库表面**而非应用内链路。tasks 层由宿主 HTTP task 路由消费。

**下游被调**（what they call）：全部收敛到 `AgentService.run`（`service/AgentService.ts:45`）→ coordinator（fan-out 时）或 `AgentRuntime`（普通时）。scan 额外经 `SystemRunContextFactory`（`service/SystemRunContextFactory.ts`）→ `MemoryCoordinator`/`ExplorationTracker`/`ContextWindow`。

**跨子系统 / @alembic/core 契约**：
- plan：`@alembic/core/plans` 的 `PlanSelection` / `PlanStageId` / `assertPlanSelectionStageRequirements`（`PlanAgentRun.ts:1`）——Core owner plan schema，Agent 只产出+提示。
- evolution：`@alembic/core/evolution` 的 `EvolutionCandidateReason`（`EvolutionAgentRun.ts:1`）。
- tasks：`#tools/kernel` 的 `ToolResultEnvelope` / `projectToolResultOrdinaryOutput`（`AgentTaskHandlers.ts:8`）。

**设计模式**：
- **Strategy + Registry**：coordinator 的 partitioner/merger 注册表（`:32/:37`），profile 的 `strategy`（single/pipeline/preset/fanout）经 `AgentStageFactoryRegistry` 解析。
- **Template Method**：所有 run = 「装配 input → run → project」同一骨架，差异只在三处填充。
- **Projection / Anti-Corruption**：每个 `project*Result` 把 raw AgentRunResult 隔离成领域类型，吸收「工具产物 vs reply vs fallback」「V1 vs V2 工具 schema」「精简投影 vs 全量 facts」的多形态漂移。
- **Fan-out/Fan-in（scatter-gather）**：module-mining/bootstrap。

**配置 / 开关 / 环境变量**：
- `ALEMBIC_MODULE_MINING_CONCURRENCY`（默认 2，`ProjectIndexModuleMiningProfile.ts:26`）、`ALEMBIC_BOOTSTRAP_CONCURRENCY`（默认 2，`bootstrap.profile.ts:21`）——并发度，经 `resolveConcurrency`（`AgentRunCoordinator.ts:246`）读取。
- `scaleCap`（module-mining 模块数上限）、`batchSize`（relation 每批条数，默认 20）、`comprehensive`（scan 深度）、`toolChoiceOverride:'none'`（plan 禁工具）、budget policy per-profile。
- `execution.groundingEnforcement`（`AgentRunContracts.ts:176`，AP-3 per-run grounding，默认 observe-only `'off'`）——各 run 未显式设，回落 runtime 全局默认。

**错误 / 回退 / 降级 / 取消 / 超时 / 部分结果矩阵**（按 run 的严格度分层）：

| run | 失败处理 | 解析失败 | 取消/超时 | 部分结果 |
| --- | --- | --- | --- | --- |
| plan | 抛错（不掩盖） | 抛「invalid JSON」 | 经 execution（budget timeout 120s） | — |
| evolution | 决策不完备抛错 | — | — | — |
| module-mining(父) | 抛错 | — | coordinator tiered abort | 经 merger `phases.moduleResults` |
| scan | fallback 降级 + diagnostics | fallback + onParseError | budget timeout 3.6e6ms | — |
| relation | 静默回退空结果 | 静默 fallback | budget timeout 420s | — |
| translation | 回退原文 + error 字段 | 回退原文 | budget timeout 120s | — |
| coordinator child | error 结果对象（不冒泡） | — | aborted 结果对象（finish-tier） | 天然支持（merger 汇总） |

分层清晰：**plan/evolution/module-mining 严格抛错**（决策/规划错误不能污染下游）；**scan/relation/translation 宽松降级**（增强类任务失败不阻断主流程，但都留 diagnostics/error 痕迹）。coordinator child 一律**转结果对象不冒泡**以保证批量鲁棒性。

**值得记录的设计决策**：
1. runs/coordinator 刻意保持薄（无 AI 循环），把「非确定性」全塞进 AgentRuntime，符合仓库「deterministic shell 包裹 AI 行为」的边界纪律。
2. plan/module-mining 的**模块候选防幻觉**：把 Core 的阶段硬校验规则前置成 prompt 提示，并从多种事实形态（精简投影 U3 + 全量 facts）读真实候选——双宿主事实形态并存是本章最复杂的适配逻辑。
3. evolution 的**决策完备性硬门**（`decisionIds.size < recipes.length` 抛错）确保 AI 不漏审。
4. coordinator 的 `childInputFactories` 懒解析 + `coordination` 钩子（`onChildResult`/`onTierComplete`）是留给外部宿主的扩展点（`src` 内未注入），支撑「按 tier 顺序回写覆盖」这类跨 child 依赖。


## S11 · AI 子系统(上)· Provider 抽象 · Factory · Manager · Gateway · Registry

本章剖析 `@alembic/agent` 仓库 `src/ai/` 的上半部：面向 runtime 的 **Provider 抽象**（`AiProvider`）、**构造工厂**（`AiFactory`）、**热切换管理器**（`AiProviderManager`）、**统一网关**（`LLMGateway`）与 **模型能力注册中心**（`ModelRegistry` + `ModelDefs` + `ProviderConfig` + `models/*`）。这一层的核心设计是「方案①：协议下沉 transport，横切收敛 gateway」——各厂商 Provider 退化为薄壳，真正的 HTTP 协议拼装/解析下沉到 transport 层，重试/熔断/并发/用量上报等横切能力统一收敛到 gateway。本章讲清 runtime 如何经 `gateway → manager → provider → transport` 四层发起一次模型调用，transport 层的具体协议实现留待下一章。

---

### S11.1 · 子系统边界与分层总览

#### 职责定位

`src/ai/` 是 Agent 仓库的「AI provider adapter / model routing / prompt-budget / retry-ratelimit / 错误分类」承载区（见仓库 `CLAUDE.md` 职责边界）。它不实现 Core 的确定性内核，只负责非确定性的模型调用编排与厂商适配。本章覆盖的是「调用契约与路由」层，不含 transport 的厂商协议细节与 Agent runtime 的执行循环。

#### 对外导出（barrel）

`src/ai/index.ts:1` 是子系统的统一出口，re-export 了：

- `AiFactory.js`（`createProvider` / `autoDetectProvider` / `getProviderWithFallback` / `createEmbedProvider` / `getAiConfigInfo` / fallback 判定函数）
- `AiProvider.js`（抽象基类 + 全部消息/结果/用量/工具类型）
- `AiProviderManager.js`（热切换管理器 + 其接口族）
- `gateway/index.js`（`LLMGateway` / `getLLMGateway` / `resetLLMGateway` + 请求类型）
- `guard/ParameterGuard.js`
- 五个具体 Provider（`ClaudeProvider` / `DeepSeekProvider` / `GoogleGeminiProvider` / `OllamaProvider` / `OpenAiProvider`）
- `registry/ModelDefs.js` / `registry/ModelRegistry.js` / `getProviderConfig` + `PROVIDER_CONFIGS`
- `transport/index.js`

#### 四层抽象（自上而下）

一次模型调用穿越四个抽象层，各层职责严格分离：

1. **Provider 层**（`AiProvider` + 五个薄壳子类）——runtime 唯一直接持有的对象。定义 `chat / chatWithTools / chatWithStructuredOutput / embed` 语义契约，子类只做「构造期配置绑定 + 委托 `_gateway*` helper」。
2. **Gateway 层**（`LLMGateway`）——`resolve model → guard params → delegate to transport → normalize response` 职责链。承担 modelRef 解析、参数守卫、可靠性包裹、响应归一化、用量上报。
3. **Registry 层**（`ModelRegistry` + `ModelDefs` + `models/*`）——声明式模型能力/约束/容量的单一事实来源，被 gateway、`ParameterGuard`、`ContextWindow`、Host UI 共同查询。
4. **Transport 层**（`LLMTransport` 抽象 + 四个厂商实现）——纯协议转换：`TransportRequest` → 厂商 HTTP body → `TransportResponse`。本章仅描述其契约边界（`transport/LLMTransport.ts`），协议细节见下一章。

横向还有两个共享单元（`src/ai/shared/`）：`ReliabilityController`（有状态的重试/熔断/并发/429 冷却，`shared/reliability.ts`）与 `extractJSON`（无状态 JSON 提取/截断修复，`shared/structuredOutput.ts`）、`classifyLlmError`（错误分类纯函数，`shared/errorClassify.ts`），供 Provider 与 Gateway 共用、消除历史上「两套横切实现漂移」的问题。

**上游调用方**：`AgentRuntime` 通过 DI 注入的单个 `AiProvider` 实例（`src/agent/runtime/AgentRuntimeTypes.ts:210` 声明 `aiProvider: AiProvider`；`AgentRuntime.ts:182` 绑定、`:1037` 与 `:1576` 是仅有的两个 `chatWithTools` 调用点）。`AiProviderManager` 由宿主的 `AiModule.initialize()` 创建并注入 DI 容器（见 `AiProviderManager.ts:11` 集成说明），本仓库 `src/` 内不含其 DI 装配代码——装配在 Core/宿主侧。

---

### S11.2 · AiProvider — 统一 Provider 抽象基类（`src/ai/AiProvider.ts`, 712L）

#### 职责定位

`AiProvider`（`AiProvider.ts:193`）是所有具体 Provider 的抽象基类，定义 provider-agnostic 的调用契约与共享行为。方案①之后它是「薄壳 + gateway 委托层」：语义方法（`chat` 等）由子类覆盖并委托到 `_gateway*` helper，横切能力全部下沉。类头注释明确「所有具体 Provider 必须实现这3个方法」，但实际薄壳后子类仅覆盖 `chat / chatWithTools / chatWithStructuredOutput / embed` 并全部转调 gateway。

#### 核心数据结构与类型（对外契约词汇）

这些类型是整个 AI 子系统（含 runtime、transport）共享的 provider-agnostic 词汇：

- `AiProviderConfig`（`:17`）——构造配置：`model / apiKey / baseUrl / timeout / maxRetries / circuitThreshold / maxConcurrency / embedModel / responses`，允许任意扩展键（`[key: string]: unknown`）。
- `UnifiedMessage`（`:69`）——统一消息格式，`role: 'user'|'assistant'|'tool'`，含 `content` / `reasoningContent`（DeepSeek V4 thinking 内容，多轮需原样回传）/ `toolCalls[]`（`{id,name,args,thoughtSignature}`）/ `toolCallId` / `name`。这是跨厂商的消息中间表示。
- `ToolSchema`（`:85`）——`{name, description?, parameters?}` 工具声明。
- `ChatWithToolsOptions`（`:92`）/ `ChatWithToolsResult`（`:112`）——工具调用的入参与出参。结果含 `text / functionCalls / usage / reasoningContent / finishReason`。
- `FunctionCallResult`（`:104`）——`{id,name,args,thoughtSignature?}`，归一化后的函数调用。
- `TokenUsage`（`:123`）——`{inputTokens, outputTokens, totalTokens, reasoningTokens?, cacheHitTokens?}`；`reasoningTokens` 是 V4 thinking 消耗、`cacheHitTokens` 是 prompt 缓存命中。
- `StructuredOutputOptions`（`:134`）——结构化 JSON 输出选项（`schema / openChar / closeChar / temperature / maxTokens / systemPrompt`）。
- `EmbeddingCapacityHint`（`:155`）与 `EmbeddingCapacityHintSource`（`:144`）——AD5 只读容量提示，向 Core `BatchEmbedder` 暴露本实例并发闸门值，替代硬编码，不改变节流行为。
- `MissingApiKeyError`（`:32`）+ `createMissingApiKeyError`（`:39`）——host-neutral 的缺 key 错误：`code='API_KEY_MISSING'` / `provider` / `envVar` / `hostAction='configure-provider-credential'`，具体 UI 指引交宿主渲染。

#### 实例字段与横切下沉

构造器（`:221`）读取 config，设默认 `timeout=300_000`（5min）、`maxRetries=3`、`name='abstract'`、`_circuitThreshold=config.circuitThreshold||5`。关键横切字段：

- `#gateway`（`:213`, private field）——本 provider 专属的 `LLMGateway` 实例，**lazy 构造**。
- `_transportExtras`（`:219`）——provider 特有的 transport 扩展配置（`apiStyle / reasoningEffort / embedModel`），子类在 `super()` 之后设置，透传给 gateway → transport。
- `_onTokenUsage`（`:210`）——token 用量回调，由 DI 容器注入以实现全局计量。
- `_maxConcurrency`（`:235`）+ `_maxConcurrencySource`（`:240`）——并发上限及其来源溯源（`provider-config` → `environment`(`ALEMBIC_AI_MAX_CONCURRENCY`) → `conservative-default`=4）。这一「取值 + 来源并行记录」的写法是 AD5 容量提示的溯源基础。

#### 关键方法（签名 + 作用）

- `chat(prompt, context)`（`:251`）——基类抛 not-implemented；子类覆盖为委托 `_gatewayChat`。
- `chatWithTools(prompt, opts)`（`:357`）——**默认降级实现**：忽略 tools/toolChoice，把 messages 过滤成 user/assistant 历史后走纯文本 `chat()`，返回 `{text, functionCalls: null}`。这是「不支持原生函数调用」的 provider 的兜底路径，由 runtime 做文本正则解析。
- `chatWithStructuredOutput(prompt, opts)`（`:393`）——默认实现：`chat()` + `extractJSON()` 兜底（`temperature` 默认 0.3、`maxTokens` 默认 32768）。子类可覆写利用原生 JSON mode。
- `summarize(code)`（`:284`）——对代码生成结构化摘要 JSON `{title, description, language, patterns, keyAPIs}`，收敛到基类（`summarizeMaxTokens` getter `:275` 默认 4096，Gemini 覆写为 8192）。
- `embed(text)`（`:295`）/ `supportsEmbedding()`（`:309`, 默认 true）/ `probe()`（`:303`, 轻量 `chat('ping')` 探活）。
- `supportsNativeToolCalling`（getter, `:333`）——默认 `false`；`GoogleGeminiProvider` / OpenAI / Claude 覆写为 `true`。runtime 据此决定是否跳过正则解析。
- `getEmbeddingCapacityHint()`（`:321`）——返回 `Object.freeze({provider, maxInFlightEmbeddings: this._maxConcurrency, source})`，供外部批处理消费者读取真实闸门。
- `_emitTokenUsage(usage, source)`（`:259`）——从原始响应提取用量并触发 `_onTokenUsage` 回调；`total===0` 时跳过；回调异常被吞（token 计量绝不打断执行）。
- `_detectLanguageProfile(filesContent)`（`:538`）——按文件扩展名统计 + `LanguageService.detectPrimary`（Core `@alembic/core/shared`）推断主语言，返回 `LanguageProfile`（role / patternExamples / extractionExamples / categories），为 10+ 语言（Swift/TS/Python/Go/Kotlin/Rust/Vue/Ruby…）内置提示词适配参数。
- `extractJSON(text, openChar, closeChar)`（`:705`）——委派到厂商无关的 `shared/structuredOutput.extractJSON`，仅桥接实例 logger。

#### Gateway 委托机制（方案①核心）

`_getGateway()`（`:424`）**lazy 构造 provider 专属 gateway**，是打破 `AiProvider ↔ LLMGateway/transport` 模块循环依赖的关键：顶层只保留 `type import`，运行期用 `await import('./gateway/LLMGateway.js')`（`:430`）动态加载。它把本 provider 的 `{apiKey, baseUrl, timeout, ...this._transportExtras}` 以 `this.name`（即 ProviderId）为键塞进 `GatewayConfig.providers`，并把 `maxRetries / circuitThreshold / maxConcurrency / onUsage` 一并传入。`onUsage` 桥接回 `this._emitTokenUsage(usage, usage.source)`，保持原 token 计量链路不变。

- `_modelRef`（getter, `:413`）——`'name:model'`，用于 gateway 路由。
- `_gatewayChat(prompt, context)`（`:452`）——把 history + 当前 prompt 拼成 `UnifiedMessage[]`，经 `gateway.chatWithTools`（无 tools）承载历史再取 `text`。默认 `temperature=0.7 / maxTokens=4096`。
- `_gatewayChatWithTools(prompt, opts)`（`:471`）——委托 `gateway.chatWithTools`，`toolChoice` 默认 `'auto'`（DeepSeek 文本工具调用兼容解析依赖该值非空非 'none'）。
- `_gatewayChatWithStructuredOutput(prompt, opts)`（`:494`）——委托 `gateway.chatStructured`。
- `_gatewayEmbed(text)`（`:512`）——委托 `gateway.embed`；**失败不中断主流程**，返回空向量（数组入参返 `[]`，单串返 `[]`），由上层决定降级。

**设计决策要点**：薄壳化后，HTTP body 拼装与响应解析只在 transport；重试/熔断/并发闸门/用量上报由 gateway 的 `ReliabilityController` 统一提供，新增厂商不必重复实现（`:417` 注释）。

---

### S11.3 · 具体 Provider 薄壳（以 `ClaudeProvider` 为例）

以 `src/ai/providers/ClaudeProvider.ts`（63L）为范式，薄壳子类做三件事：

1. **构造期绑定**（`ClaudeProvider.ts:28`）：`super(config)` 后设 `this.name='claude'`、`model` 回落 `ALEMBIC_AI_MODEL||'claude-sonnet-4-6'`、`apiKey` 回落 `ALEMBIC_CLAUDE_API_KEY`、`baseUrl` 回落 `ALEMBIC_CLAUDE_BASE_URL||CLAUDE_BASE`，并注入 Core `Logger`。Claude 特有决策：`maxRetries=0`（上游自带退避语义，避免叠加放大；gateway 据此关闭重试）。
2. **能力声明**：`supportsNativeToolCalling` 覆写为 `true`（`:40`）。
3. **语义方法委托**：`chat/chatWithTools/chatWithStructuredOutput` 全部转调对应 `_gateway*` helper（`:44`、`:48`、`:55`）。`embed` 直接返回 `[]` 触发上层降级（Claude 无嵌入 API，`:60`）。

五个 Provider 互不继承（都直接继承 `AiProvider`），差异只在构造期配置绑定、能力覆写与个别 `_transportExtras`（如 DeepSeek 的 reasoningEffort、Gemini 的默认并发 2）。

---

### S11.4 · AiFactory — Provider 构造与自动探测（`src/ai/AiFactory.ts`）

#### 职责定位

根据配置/环境变量创建对应 Provider 实例，并提供自动探测、fallback、独立 embed provider、配置信息查询等构造期能力。它不参与运行期调用，只负责「选出并 new 出正确的 Provider」。

#### 关键函数与算法

- `PROVIDER_MAP`（`:17`）——别名 → 类映射：`google/google-gemini/gemini → GoogleGeminiProvider`，`openai`，`deepseek`，`claude/anthropic → ClaudeProvider`，`ollama`。
- `createProvider(options)`（`:39`）——`options.provider || ALEMBIC_AI_PROVIDER || 'google'`，大小写归一后查 `PROVIDER_MAP`，未知 provider `throw Error` 并列出支持列表。
- `PROVIDER_KEY_ENV`（`:58`）——**单一事实来源**：canonical provider id → 其 API-key 环境变量；下方别名映射与 fallback 枚举都从它派生，不重复列举。
- `autoDetectProvider()`（`:65`）——探测优先级：
  1. `ALEMBIC_AI_PROVIDER` 显式指定且非 `'auto'`：解析别名→key env；若需 key 但未配置则 `warn` 并降级到自动探测（否则直接 `createProvider`，可带 `ALEMBIC_AI_MODEL`）。ollama 不需 key（`keyEnvMap.ollama=null`）。
  2. 依次检查 `ALEMBIC_GOOGLE_API_KEY → OPENAI → CLAUDE → DEEPSEEK`，命中即创建。
  3. 全部未配置：`info` 日志提示未找到 key，**返回 `null`**（AI 功能跳过，是合法的降级态）。
- `getAvailableFallbacks(currentProvider)`（`:116`）——从 `PROVIDER_KEY_ENV` 枚举出「有 key 且非当前」的 provider 列表。
- `isGeoOrProviderError(err)`（`:131`）——正则判定「地理限制/不可恢复的 provider 级错误」：匹配 `user location is not supported / failed_precondition / unsupported region / geo / blocked`，或 `permission denied/forbidden` 但**排除** rate-limit/quota/429（后者不该触发 fallback）。
- `getProviderWithFallback()`（`:145`）——**带自动 fallback 的探活构造**：
  1. `autoDetectProvider()` 得 primary；null 则返回 null。
  2. `primary.probe()`；成功返回 primary。
  3. probe 失败：若非 geo/provider 错误，仍返回 primary（不 fallback）；否则 `warn`。
  4. 遍历 `getAvailableFallbacks`：创建第一个可成功构造的 fallback，打标 `_fallbackFrom=currentProvider` 后返回；全失败返回 primary。
- `createEmbedProvider()`（`:196`）——仅当 `ALEMBIC_EMBED_PROVIDER` 设置时，创建专用 embed provider（可用独立的 `ALEMBIC_EMBED_MODEL/BASE_URL/API_KEY`），使 embedding 与 LLM 生成可用不同厂商；未配置返 null。
- `getAiConfigInfo()`（`:214`）——同步返回当前 AI 配置快照（provider/model/embed*/各 key 是否存在），供 UI 展示。

**设计决策**：fallback 判定刻意区分「地理/权限限制」（切换 provider）与「限流/配额」（同 provider 冷却重试，交给 gateway 的 `ReliabilityController`），避免把限流误判成需要换厂商。

---

### S11.5 · AiProviderManager — 热切换管理器（切面层，`src/ai/AiProviderManager.ts`）

#### 职责定位

「当前 AI Provider 的唯一权威管理入口」。设计目标（类头 `:1`）：①唯一权威；②AOP 切面（token 追踪随切换自动重挂）；③热切换一次调用完成 token AOP + embedding fallback + DI 级联清理 + 事件通知；④模式查询集中（`isMock/isReady`）；⑤事件驱动。集成方式：由 `AiModule.initialize()` 创建注入 DI，`ServiceContainer.reloadAiProvider()` 委托 `switchProvider()`，消费者 `container.get('aiProviderManager')`。

#### 关键类型

- `ManagedAiProvider`（`:23`）——**最小接口**（避免引入 `AiProvider` 具体类的循环依赖）：`name / model / apiKey? / _onTokenUsage? / supportsEmbedding? / _fallbackFrom?`。Manager 只依赖这个鸭子接口。
- `TokenUsagePayload`（`:32`）/ `TokenRecorder`（`:40`, 对应 Core `TokenUsageStore.record`）。
- `ProviderInfo`（`:51`, 快照）/ `SwitchResult`（`:59`, `{previous, current, clearedSingletons}`）/ `SwitchListener`（`:66`）/ `EmbedFallbackInitializer`（`:69`）。

#### 私有状态与读取接口

私有字段（`:76`）：`#provider` / `#embedProvider` / `#tokenRecorder` / `#listeners`(Set) / `#logger` + 三个 DI 注入回调 `#clearDependents` / `#embedFallbackInit` / `#syncToDi`。读取 getter：`provider`（`:101`）、`embedProvider`（`:106`, 优先 fallback 回退主）、`rawEmbedProvider`（`:111`）、`isMock`（`:116`, `name==='mock'`）、`isReady`（`:121`, 非 mock）、`name` / `model` / `info`。`isMock` 集中管理消除了散落的 `name==='mock'` 判断。

#### 核心方法：switchProvider（原子热切换）

`switchProvider(newProvider)`（`:161`）按固定顺序执行六步（这是全局唯一切换入口）：

1. 替换核心引用 `#provider = newProvider`。
2. `#wireTokenTracking()` 重挂 token AOP。
3. 重建 embedding fallback：`#embedProvider=null`，若有 `#embedFallbackInit` 则重新初始化。
4. `#syncToDi?.(...)` 同步 singletons 中的 provider 引用（供 DI 工厂函数读取）。
5. `#clearDependents?.()` 级联清除 DI 容器中依赖 AI 的 singleton，收集 `clearedSingletons`。
6. 遍历 `#listeners` 回调通知（监听器异常被吞，不打断切换），最后 `info` 日志。

`#wireTokenTracking()`（`:230`）在当前 provider 上安装 `_onTokenUsage`：每次调用后把用量转记到 `#tokenRecorder.record({source, provider, model, inputTokens, outputTokens})`，异常吞掉。`setTokenRecorder`（`:221`）延迟绑定 recorder 并立即重挂。`onSwitch(fn)`（`:259`）注册监听器返回取消函数（供 Realtime 广播、SearchEngine 重建等消费）。

DI 绑定方法 `_bindDependentClearer` / `_bindEmbedFallbackInit` / `_bindDiSync`（`:271`–`:282`）仅供 `ServiceContainer`/`AiModule` 调用——本仓库 `src/` 内无调用点，装配在宿主/Core 侧。

**设计决策**：Manager 与具体 Provider 解耦（只依赖 `ManagedAiProvider` 鸭子接口 + DI 回调注入），使切换的所有副作用（AOP/fallback/DI 级联/事件）原子化到一个方法，消除外部散落的手动重挂逻辑。

---

### S11.6 · LLMGateway — 统一 LLM 调用网关（`src/ai/gateway/LLMGateway.ts`, 482L）

#### 职责定位与分工

Gateway 是「resolve model → guard params → delegate to transport → normalize response」的职责链（类头 `:1`）。它与 `AiProvider` 的**分工**是：Provider 是 runtime 面向的语义门面（携带 name/model/config、暴露 `chat/chatWithTools/embed` 语义），Gateway 是无状态语义、按 provider 分片持有 transport 与可靠性控制器的**调用编排核心**。Provider 经 `_getGateway()` 为自己 lazy 构造一个专属 gateway 实例（每 provider 一个 gateway，`providers` 里只有自己一个键）；runtime 从不直接持有 gateway。

#### 请求/配置类型

- `GatewayRequest`（`:46`）——工具调用请求：`modelRef`('provider:model' 或纯 model)、`messages` / `systemPrompt` / `tools` / `toolChoice` / `temperature` / `maxTokens` / `reasoningEffort` / `responseFormat` / `abortSignal` / `usageSource`。
- `GatewayChatRequest`（`:65`）——简单/结构化 chat：加 `prompt` / `schema` / `openChar` / `closeChar`。
- `GatewayConfig`（`:85`）——`providers`(按 ProviderId 分片的 `TransportConfig`)、`timeout` / `maxRetries` / `circuitThreshold` / `maxConcurrency` / `onUsage`。

#### 内部状态

`LLMGateway`（`:105`）持两张按 ProviderId 分片的 Map：`#transports`（`:106`, transport 实例池）与 `#controllers`（`:107`, 每 provider 独立的 `ReliabilityController`，熔断/并发/限流隔离）。`#config` 保存构造配置。

#### 四个公开调用入口

1. `chatWithTools(request)`（`:119`）——主路径。流程：`#resolveModel` → `ParameterGuard.guard`（过滤则 debug 日志）→ `#getTransport` → 组装 `TransportRequest`（被过滤参数置 undefined，否则用 guarded 值或原值）→ `#runWithReliability` 包裹 `transport.chatWithTools` → `#emitUsage` → `#normalizeResponse`。
2. `chat(request)`（`:168`）——单轮无工具，包成单条 user message 走 `transport.chat`。
3. `chatStructured(request)`（`:204`）——`chat({responseFormat:'json'})` + `extractJSON`（复用 shared 的去围栏/容错/截断修复，替代脆弱的 `JSON.parse`）。
4. `embed(modelRef, texts)`（`:217`）——解析 provider → `#runWithReliability(transport.embed)`。

查询/探活辅助：`getModelDef`（`:226`）、`probe(modelRef)`（`:234`, 轻量 chat，异常返 false）、`resolveWithFallback(candidates)`（`:254`, 按候选链探活返回第一个可用 modelRef——网关侧统一 fallback，与 Provider 层 `getProviderWithFallback` 思路一致）。

#### modelRef 解析算法

`#resolveModel(modelRef)`（`:265`）三级解析：

1. 含 `:` → 拆 `provider:model`，`registry.resolveOrCreate(provider, model)`。
2. 纯字符串精确命中 `registry.get(modelRef)` → 用其 provider/apiModelId。
3. 都不中 → `#guessProvider(modelRef)`（`:302`, 按前缀猜：`gpt-/o1/o3→openai`、`claude-→claude`、`deepseek-→deepseek`、`gemini-→google`，兜底 openai）→ `resolveOrCreate`。

#### 参数守卫接线

守卫结果 `guarded` 的每个参数都经 `wasFiltered(param)`（`:136`）判定：被过滤则该字段传 undefined（彻底不发给厂商），否则取 `guarded.<param> ?? request.<param>`。`maxTokens` 例外——总是 `guarded.maxTokens ?? request.maxTokens`（`#guardMaxTokens` 只做 clamp 不过滤）。这保证「模型禁止的参数绝不出现在请求里」。

#### Transport 生命周期与配置解析

- `#getTransport(providerId)`（`:377`）——池化 lazy 创建。
- `#createTransport`（`:389`）——`switch(providerId)`：openai/claude/deepseek/google 各自 transport；**ollama 复用 `OpenAiTransport`**（补 `apiKey='ollama'`、`baseUrl='http://127.0.0.1:11434/v1'`）；未知 provider `warn` 并回落 OpenAI transport。
- `#resolveTransportConfig(providerId)`（`:413`）——优先用显式 `config.providers[providerId]`（有 apiKey 时直接用）；否则按 `envMap` 从环境变量读 key/baseUrl（`ALEMBIC_<PROVIDER>_API_KEY` / `_BASE_URL`），ollama 无 key。注意它会丢弃 explicit 里的 apiKey 再用环境值兜底（`#discardedKey` 解构 `:428`）。

#### 可靠性与用量

- `#getController(providerId)`（`:329`）——每 provider 一个 `ReliabilityController`（隔离熔断/并发/限流），构造时透传 `maxRetries/circuitThreshold/maxConcurrency/label/onLog`。
- `#runWithReliability(providerId, fn, abortSignal)`（`:346`）——`controller.run(fn, undefined, undefined, {abortSignal})`。
- `#emitUsage(usage, provider, model, source)`（`:355`）——`total===0` 跳过；`onUsage` 异常吞掉。
- `#normalizeResponse(response)`（`:439`）——`TransportResponse` → `ChatWithToolsResult`：映射 functionCalls（保留 thoughtSignature）、透传 usage/reasoningContent/finishReason。

#### 单例与配置重建 bug 修复

`getLLMGateway(config?)`（`:471`）：**传 config 就重建实例**以应用最新配置，不传复用既有单例——修复了旧实现「首次 config 生效、后续被静默忽略」的历史 bug。`resetLLMGateway()`（`:480`）清单例。注意：Provider 的 `_getGateway()` 走的是 `new LLMGateway(...)`（每 provider 专属），并非这个全局单例；单例入口供不经 Provider 直接用 gateway 的场景。

---

### S11.7 · ParameterGuard — 参数约束执行器（`src/ai/guard/ParameterGuard.ts`）

#### 职责定位

在 API 调用前，依据 `ModelDef.parameterConstraints` 自动过滤/修正参数，替代各 Provider 中分散的 `if` 判断（如「Opus 4.7 不传 temperature」「DeepSeek V4 thinking 不传 tool_choice」）。

#### 关键类型与算法

- `GuardedParams`（`:12`）——`{temperature?, topP?, topK?, maxTokens?, toolChoice?, reasoningEffort?, filtered: FilteredParam[]}`。
- `FilteredParam`（`:23`）——`{param, reason, originalValue}`，供审计日志。
- `guard(model, rawParams)`（静态, `:35`）——依次调六个私有守卫函数，返回安全参数集 + 过滤审计。

每个守卫函数的语义：

- `#guardTemperature`（`:49`）——`rule.allowed=false` → 过滤并记 reason；否则 `clamp(min,max)`。
- `#guardTopP` / `#guardTopK`（`:71`/`:92`）——同上 clamp。
- `#guardToolChoice`（`:113`）——`allowed=false` → 用 `rule.reason`（如 DeepSeek V4 的详细拒因）过滤；另有 `disabledWhen==='thinking'` 且模型处于 thinking 模式的条件禁用分支。
- `#guardReasoningEffort`（`:143`）——`allowed=false` 过滤；值不在 `allowedValues` 内 → 过滤并**回落到 `model.reasoning.defaultEffort`**。
- `#guardMaxTokens`（`:174`）——不过滤，只 `Math.min(val, model.maxOutputTokens)` clamp（这就是 gateway 里 maxTokens 不走 `wasFiltered` 的原因）。

**设计决策**：所有厂商特异的参数禁用/修正被声明式地表达在 `ModelDef` 里，`ParameterGuard` 是唯一执行器，过滤原因随 `filtered` 外抛做诊断日志——满足仓库「运行时分叉/降级必须有明确诊断」的规则。

---

### S11.8 · Registry — 模型能力注册中心

#### ModelDefs — 声明式模型定义（`src/ai/registry/ModelDefs.ts`）

`ModelDef`（`:11`）是所有模型能力/约束/容量的接口描述：

- 标识：`id`(`provider:apiModelId`) / `displayName` / `provider`(`ProviderId`) / `apiModelId`(实际 API id)。
- 容量：`contextWindow` / `maxOutputTokens`。
- `capabilities`（`ModelCapabilities`, `:36`）：`toolCalling / vision / embedding / jsonMode / streaming`。
- `reasoning`（`ReasoningSpec`, `:44`）：`supported` + `mode`('thinking'|'adaptive'|'reasoning_effort') + `requiresContentPassback`(DeepSeek V4 多轮回传 reasoning_content) + `defaultEffort` / `effortLevels`。
- `parameterConstraints`（`ParameterConstraints`, `:54`）：per-param 的 `ParameterRule<T>`（`:62`, `allowed / reason / disabledWhen / defaultValue / min / max / allowedValues`）。
- `deprecated?`（`:33`）：`{retireDate, migrateToId}`。
- `ProviderId`（`:9`）：`'openai'|'deepseek'|'claude'|'google'|'ollama'`。
- `ProviderConfig`（`:75`）：`{id, displayName, defaultModelId, keyEnvVar, baseUrlEnvVar?, baseUrl}`。

#### ModelRegistry — 注册与解析（`src/ai/registry/ModelRegistry.ts`）

`ModelRegistry`（`:29`）构造时把 `ALL_BUILTIN_MODELS`（`:21`, 五个 `models/*` 数组合并）按 `def.id` 灌入 `#models` Map。方法：

- `get(modelRef)`（`:39`）——精确查 `'provider:model'`。
- `resolve(provider, apiModelId)`（`:44`）——先试直接组合键，回退遍历匹配。
- `resolveOrCreate(provider, apiModelId)`（`:64`）——`resolve ?? createDynamicDef`。
- `listByProvider` / `listActive`（`:72`/`:77`, 排除 deprecated）、`findByCapability`（`:82`）、`getContextWindow`（`:87`, 替代旧 `ContextWindow.MODEL_CONTEXT_WINDOWS`）、`register`（`:92`, 运行时注册自定义模型）、`size`。
- `createDynamicDef(provider, apiModelId)`（`:102`）——为未注册模型生成**保守默认**：`contextWindow=128_000` / `maxOutputTokens=8_192` / `toolCalling+streaming=true`，其余 false / `reasoning.supported=false` / temperature 0–2、toolChoice 允许。这是 Ollama 本地任意模型与未知模型的兜底路径。
- 全局单例 `getModelRegistry()`（`:129`）。

**消费方**：`ContextWindow`（查上下文窗）、`ParameterGuard`（查约束）、Host UI/Routes（列可用模型）、Provider（查推理能力）、Gateway `#resolveModel`。Registry 是这些查询的单一事实来源，替代了历史上散落的正则表与各 Provider 硬编码判断。

#### ProviderConfig — provider 元信息（`src/ai/registry/ProviderConfig.ts`）

`PROVIDER_CONFIGS`（`:10`）集中定义五个 provider 的 `{id, displayName, defaultModelId, keyEnvVar, baseUrlEnvVar, baseUrl}`（如 google 默认 `google:gemini-3-flash-preview`、openai 默认 `openai:gpt-5.5`、deepseek 默认 `deepseek:deepseek-v4-flash`、claude 默认 `claude:claude-sonnet-4-6`、ollama 默认 `ollama:llama3` 无 keyEnvVar）。`getProviderConfig(id)`（`:54`）线性查找。替代旧 UI/`ai.ts` 里分散的硬编码 provider 列表。

#### models/* — 各厂商模型清单（能力/上下文窗/参数）

每个文件导出 `<PROVIDER>_MODELS: ModelDef[]`，用一个 `BASE_<PROVIDER>_CAPS` 常量抽公共 capabilities，逐模型声明差异：

- **openai.ts**——GPT-5.5/5.5-pro/5.4 系列/5/mini/nano + deprecated gpt-4o。`BASE_OPENAI_CAPS`（`:3`）全能力开、jsonMode+vision 开。reasoning `mode='reasoning_effort'`，`effortLevels` 含 `none/low/medium/high/xhigh`。gpt-5.5 上下文窗 `1_100_000`、输出 `128_000`。gpt-4o `deprecated{retireDate:'2026-07-14', migrateToId:'openai:gpt-5.4-mini'}`。
- **claude.ts**——Opus 4.7/4.6/4.5/4.1 + Sonnet 4.6/4.5 + Haiku 4.5 + 两个 deprecated。`BASE_CLAUDE_CAPS`（`:3`）**jsonMode=false**（Claude 无原生 JSON mode，结构化走 extractJSON 兜底）。**Opus 4.7 breaking**：temperature/top_p/top_k 全 `allowed:false`、`reasoning.mode='adaptive'`（`:14` 注释与 `:26`–`:31`）；其余 thinking 系 temperature 0–1。上下文窗多为 `200_000`，4.6/4.7 到 `1_000_000`。
- **google.ts**——Gemini 3.1-pro/3-flash/3.1-flash-lite/3.1-flash preview + 2.5 pro/flash + legacy 2.0/1.5。`BASE_GOOGLE_CAPS` jsonMode+vision 开、`mode='thinking'` 带 `effortLevels`（`minimal/low/medium/high`）。上下文窗 `1_048_576`。
- **deepseek.ts**——V4-Flash(284B/13B)/V4-Pro(1.6T/49B) + legacy deepseek-chat/reasoner。`BASE_DEEPSEEK_CAPS` **vision=false**。关键：`V4_TOOL_CHOICE_REASON`（`:11`）——V4 thinking 兼容路由会拒 `tool_choice=required`/named tool，故 `toolChoice.allowed:false` 带详细 reason，主路径靠 `tools + reasoning_content` 回传。`requiresContentPassback:true`、`effortLevels:['high','max']`。上下文窗 `1_000_000`、输出 `384_000`。deepseek-reasoner 额外 `toolCalling:false`、temperature 禁止。
- **ollama.ts**——llama3/llama3.2/qwen2/mistral 的合理默认（本地动态模型，未注册者靠 `createDynamicDef` 兜底）。`BASE_OLLAMA_CAPS` jsonMode=false、vision=false。上下文窗 8k–128k 不等。

**设计决策**：模型元数据全部声明式集中，`deprecated{retireDate, migrateToId}` 提供迁移路径，`ParameterGuard` 的所有厂商特异行为（Opus 4.7 禁 temperature、DeepSeek V4 禁 tool_choice）都从这里的 `parameterConstraints` 驱动——改能力只改数据、不改代码分支。

---

### S11.9 · 一次模型调用的抽象层次（gateway → manager → provider → transport）

以 runtime 发起一次带工具的对话为例，串起完整调用链：

1. **runtime → provider**：`AgentRuntime` 持有 DI 注入的单个 `AiProvider`（类型见 `AgentRuntimeTypes.ts:210`，绑定于 `AgentRuntime.ts:182`）。执行循环在 `AgentRuntime.ts:1037` 调 `this.aiProvider.chatWithTools(ctx.prompt, {messages, toolSchemas, toolChoice, systemPrompt, temperature, maxTokens, abortSignal})`。方案①后 runtime 不再有 gateway/provider 双分支（`:1035` 注释），横切统一由 provider 背后的 gateway 承担。强制摘要兜底路径同样走 `chatWithTools`（`:1576`）。
   - **manager 的角色**：runtime 拿到的 provider 实例，其身份由 `AiProviderManager` 统一管理——`switchProvider` 热切换时经 DI 数据管道（`#syncToDi`）更新 singletons 中的引用、级联清理依赖 singleton，使 runtime 下次从容器取到的就是新 provider。Manager 不在调用热路径上，而是「谁是当前 provider + token AOP 挂在谁身上」的权威。
2. **provider → gateway**：具体 Provider（如 `ClaudeProvider.chatWithTools`）转调 `_gatewayChatWithTools`（`AiProvider.ts:471`），它 `await this._getGateway()` 拿到本 provider 专属 gateway（首次 lazy `new LLMGateway`，动态 import 破循环依赖），以 `_modelRef`('claude:claude-sonnet-4-6') 调 `gateway.chatWithTools({modelRef, messages, tools, toolChoice:'auto', ...})`。
3. **gateway 职责链**（`LLMGateway.chatWithTools`, `:119`）：
   - `#resolveModel(modelRef)` → 查 `ModelRegistry` 得 `ModelDef` + providerId + apiModelId。
   - `ParameterGuard.guard(modelDef, params)` → 依 `parameterConstraints` 过滤/clamp，被过滤参数不发给厂商。
   - `#getTransport(providerId)` → 池化取/建 transport。
   - `#runWithReliability(providerId, () => transport.chatWithTools(req), abortSignal)` → 经该 provider 独立的 `ReliabilityController` 做重试/熔断/并发闸门/429 冷却。
   - `#emitUsage` → 触发 `onUsage`（桥回 provider `_emitTokenUsage` → `AiProviderManager` token AOP → Core `TokenRecorder`）。
   - `#normalizeResponse` → `TransportResponse` 归一化为 `ChatWithToolsResult`。
4. **transport → 厂商 API**：`LLMTransport`（`transport/LLMTransport.ts:156`）把 `TransportRequest` 转厂商 HTTP body、经代理感知 `#fetch`（`:277`，`resolveProxyUrl` 支持 `ALEMBIC_<PROVIDER>_PROXY_*` → `ALEMBIC_AI_PROXY` → `HTTPS_PROXY` 等）+ `post`（`:227`，带 timeout AbortController + external abort 桥接）发请求，解析响应回 `TransportResponse`。缺 key 抛 `createMissingApiKeyError`。具体协议实现（四个厂商 transport）见下一章。
5. **结果回传**：`ChatWithToolsResult` 逐层回到 runtime，runtime 记账用量（`AgentRuntime.ts:1059`）、驱动执行循环。

---

### S11.10 · 错误/回退/降级/取消/超时/部分结果路径

AI 子系统上半部的失败语义分布在四层，此处统一梳理：

- **缺 API key**：transport `requireApiKey` 抛 `MissingApiKeyError`（`code='API_KEY_MISSING'`，host-neutral），或 `autoDetectProvider` 返回 `null`（AI 功能整体跳过，合法降级态）。
- **超时**：transport `post` 用 `this.timeout`（默认 120s，Provider 侧 300s）的 AbortController；到点 `controller.abort()`。
- **外部取消**：`abortSignal` 从 runtime 一路透传（`ChatWithToolsOptions.abortSignal` → gateway `GatewayRequest.abortSignal` → `#runWithReliability` → `ReliabilityController.run({abortSignal})` → transport `post(externalSignal)`）。`ReliabilityController` 里排队等待、429 冷却窗、重试退避都 abortable（`abortableDelay` / `acquireSlot` 监听 abort）。`classifyLlmError` 判 `isAbort` → 不重试直接抛。
- **重试与退避**：`ReliabilityController.run`（`reliability.ts:202`）指数退避（`baseDelay*2^attempt + jitter`，默认 baseDelay 2000ms，maxRetries 默认 3；Claude Provider 设 0 关闭重试）。仅 `isRetryable`（429/5xx/网络错误）才重试。
- **429 限流**：进入自适应冷却窗 `setRateLimitWindow`（取 `retryAfterMs` 与退避的较大值），抑制并发重试风暴；后续请求 `waitForRateLimitWindow` 等待。
- **熔断**：三态 CLOSED/OPEN/HALF_OPEN。只有 `isServerError`（网络/429/5xx/无 status 且非程序员错误）累计 `circuitFailures`，达 `circuitThreshold`(默认 5) → OPEN，冷却 30s 起指数增长至上限 300s；OPEN 期间快速失败抛 `CIRCUIT_OPEN`。**程序员错误**（TypeError/ReferenceError/SyntaxError/RangeError）明确排除，避免确定性 bug 把熔断打开伪装成「AI 服务中断」（`errorClassify.ts:73`）。runtime 感知 `CIRCUIT_OPEN` → 合成摘要兜底（`AgentRuntime.ts:23` 注释）。
- **geo/provider 级 fallback**：`getProviderWithFallback` 在 probe 阶段判 `isGeoOrProviderError` → 切换到有 key 的备选 provider（打标 `_fallbackFrom`）；限流/配额刻意排除，交熔断/冷却处理。gateway 侧另有 `resolveWithFallback` 按候选 modelRef 链探活。
- **embed 降级**：`_gatewayEmbed` 失败返回空向量不中断主流程；Claude/无 embed 能力的 provider 直接返 `[]`，由上层（Core BatchEmbedder 等）决定降级。
- **结构化输出容错/部分结果**：`extractJSON`（`shared/structuredOutput.ts`）去 markdown 围栏、定位边界、trailing-comma 修复，token 截断时对数组做「回收已完成条目」的截断修复（`repairTruncatedArray`），失败返 null 而非抛错。
- **不支持原生工具调用的 provider**：`AiProvider.chatWithTools` 默认降级为纯文本 `chat()`，`functionCalls: null`，由 runtime 文本解析——保证任意 provider 都能进工具循环。

---

### S11.11 · 设计模式与关键设计决策

- **薄壳 + 委托（方案①）**：Provider 语义门面 + gateway 承载横切，各 provider 不重复实现重试/熔断/并发/协议。lazy 动态 import 破 `AiProvider ↔ gateway/transport` 循环依赖。
- **策略/注册表**：`ModelRegistry` + `ModelDefs` 把模型能力/约束声明式化，`ParameterGuard` 单一执行器据数据驱动分支，改行为只改数据。
- **职责链**：`LLMGateway` 的 `resolve → guard → transport → normalize` 四段。
- **切面（AOP）+ 观察者**：`AiProviderManager` 的 token 追踪随切换自动重挂 + `onSwitch` 监听器广播。
- **鸭子接口解耦**：Manager 只依赖 `ManagedAiProvider` 最小接口 + DI 注入回调（`#clearDependents`/`#embedFallbackInit`/`#syncToDi`），避免与具体 Provider 耦合。
- **单例 + 分片池**：全局 `getModelRegistry` / `getLLMGateway` 单例；gateway 内 `#transports`/`#controllers` 按 ProviderId 分片，实现 provider 间熔断/并发隔离。
- **单一事实来源**：`PROVIDER_KEY_ENV`（AiFactory）、`PROVIDER_CONFIGS`（ProviderConfig）、`ModelRegistry` 分别是「key 环境变量」「provider 元信息」「模型能力」的唯一来源。
- **host-neutral 错误**：`MissingApiKeyError` 只给机器可读元数据，UI 指引交宿主；符合仓库「Agent 不承载具体交付壳」的边界。
- **可诊断降级**：所有分叉（参数过滤、429 冷却、熔断、fallback、截断修复）都打印明确日志/审计字段，满足仓库 `CLAUDE.md` 对「运行时分叉必须可观测」的硬规则。

#### 配置/开关/环境变量清单

`ALEMBIC_AI_PROVIDER`（provider 选择/auto）、`ALEMBIC_AI_MODEL`、`ALEMBIC_AI_MAX_CONCURRENCY`（并发闸门，默认 4）、`ALEMBIC_<PROVIDER>_API_KEY`（google/openai/claude/deepseek）、`ALEMBIC_<PROVIDER>_BASE_URL`、`ALEMBIC_EMBED_PROVIDER`/`_MODEL`/`_BASE_URL`/`_API_KEY`（独立 embed provider）、`ALEMBIC_GEMINI_MAX_CONCURRENCY`（Gemini 默认 2，规避配额）、`ALEMBIC_<PROVIDER>_PROXY_HTTPS`/`_HTTP` 及 `ALEMBIC_AI_PROXY`/标准 `HTTPS_PROXY` 等（代理）、`ALEMBIC_OLLAMA_BASE_URL`。


## S12 · AI 子系统(下)· 各厂商 Transport · 可靠性 · 结构化输出 · 参数守卫

本章聚焦 `@alembic/agent` 的 AI 调用底层：把统一请求真正打到各厂商 HTTP API 的 Transport 层、模型参数守卫、以及一组厂商无关的横切能力（可靠性控制、结构化输出修复、token 归一、错误分类、工具转录归一、DeepSeek 文本工具调用兼容）。它承接上一章（AI 子系统上：`AiProvider` / `LLMGateway` / `ModelRegistry` / provider 选择），是整个 AI 栈里唯一直接与网络协议打交道的部分。

### S12.0 · 分层与调用链总览

本仓库的 AI 调用采用「方案①」分层：协议下沉到 Transport，横切收敛到 Gateway，Provider 退化为薄壳。真实调用链是：

```
AgentRuntime / 各消费方
  → AiProvider 子类(薄壳)  chat/chatWithTools/chatWithStructuredOutput/embed
      → AiProvider._gateway*  (src/ai/AiProvider.ts:452-523，组装 UnifiedMessage)
          → LLMGateway  (src/ai/gateway/LLMGateway.ts:105)
              1. #resolveModel → ModelRegistry.resolveOrCreate → ModelDef
              2. ParameterGuard.guard(ModelDef, rawParams)  → 过滤/纠偏
              3. #runWithReliability → ReliabilityController.run(重试/熔断/并发/限流)
                   → LLMTransport.chatWithTools / chat / embed  (厂商 HTTP 协议)
              4. #normalizeResponse + #emitUsage
```

各层职责边界在 `LLMTransport.ts:1-13` 的文件头注释里被明确固定：Transport **只**做「TransportRequest ↔ 厂商 HTTP 请求/响应」的纯协议转换，**不**做参数校验（`ParameterGuard`）、能力查询（`ModelRegistry`）、业务逻辑（`AgentRuntime`）。可靠性也不在 Transport 里——它只被 `ReliabilityController.run` 的 `fn` 包裹（`reliability.ts:16` 注释：控制器厂商无关，协议细节仍归 Transport）。

关键设计事实：Transport 与 ReliabilityController **每个 provider 各一个实例**，由 Gateway 用 `#transports` / `#controllers` 两个 `Map<ProviderId, …>` 缓存（`LLMGateway.ts:106-107`），因此熔断/并发/限流在 provider 之间天然隔离。每个 `AiProvider` 实例又持有自己 lazy 构造的 `LLMGateway`（`AiProvider.ts:424` `_getGateway`，动态 import 打破循环依赖），gateway 里只注册该 provider 一条 `providers` 配置。

---

### S12.1 · LLMTransport 抽象基类（`src/ai/transport/LLMTransport.ts`）

#### 职责与对外 API

`LLMTransport`（`LLMTransport.ts:156`）是所有厂商 transport 的抽象基类，定义统一的请求/响应契约并提供共享 HTTP 工具。

核心类型（同文件）：
- `TransportRequest`（`LLMTransport.ts:108`）：`model` / `messages: UnifiedMessage[]` / `systemPrompt` / `tools?: ToolSchema[]` / `toolChoice?` / `temperature?` / `maxTokens?` / `reasoningEffort?` / `responseFormat?: 'text'|'json'` / `schema?`（供 Gemini responseSchema 服务端校验）/ `abortSignal?`。
- `TransportFunctionCall`（`LLMTransport.ts:128`）：`id` / `name` / `args` / `thoughtSignature?`（Gemini 专用）。
- `TransportResponse`（`LLMTransport.ts:135`）：`text: string|null` / `functionCalls: TransportFunctionCall[]|null` / `usage: TokenUsage|null` / `reasoningContent?` / `finishReason?`。
- `TransportConfig`（`LLMTransport.ts:146`）：`apiKey` / `baseUrl?` / `timeout?` + 索引签名容纳 provider 专属扩展（如 DeepSeek 的 `reasoningEffort`、OpenAI 的 `apiStyle`/`embedModel`）。

抽象方法：`chatWithTools`（`:169`）、`chat`（`:171`）必须由子类实现。基类默认实现：
- `embed`（`:174`）：默认返回 `[]`（不支持嵌入的 transport 直接触发上层降级）。
- `chatStructured`（`:179`）：默认走 `chat({responseFormat:'json'})` + 朴素 `JSON.parse`，失败返回 `null`。注意 Gateway 层不用这个，而是走自己的 `chatStructured` + `extractJSON`（更稳健，见 S12.10）。

#### 共享 HTTP 工具（这是基类真正的价值）

1. **`post()`（`:227`）— 统一 POST + 超时 + 错误归一**
   - 用 `AbortController` + `setTimeout(this.timeout)` 实现硬超时（默认 `120_000`ms，`:166`）。同时把外部 `externalSignal`（来自 `abortSignal`）挂上 `abort` 监听，二者任一触发都 abort 同一个 controller。`finally` 里 `clearTimeout` + `removeEventListener`，避免句柄泄漏。
   - 非 2xx 时尽力解析错误体：`JSON.parse(errBody).error.message`，否则截前 300 字符，包成 `Error` 并**挂 `status` 字段**（`:255-258`）——这个 `status` 正是下游 `errorClassify` / `ReliabilityController` 判断 429/5xx 的依据。

2. **`#fetch()`（`:277`）— 代理感知 fetch**
   - 始终调用全局 `fetch`（Node ≥22 全局 fetch 即 undici，原生支持 `dispatcher` 选项）。这样在检测到代理时通过 `dispatcher` 走 undici `ProxyAgent`，无代理则直连。
   - 关键注释（`:269-276`）：**必须走全局 fetch**，否则会绕过测试里 `vi.stubGlobal('fetch')` 的桩，导致「环境带 `HTTPS_PROXY` 时单测被绕过」的回归。`dispatcher` 不在标准 `RequestInit` 类型里，靠 `as RequestInit` 断言 + 运行时识别。

3. **代理 dispatcher 缓存（`:28-104`）**
   - `proxyDispatcherCache: Map<string, unknown|null>`，按 `proxyUrl` 复用 undici `ProxyAgent`。注释（`:23-27`）：长驻 daemon 里每请求 `new ProxyAgent` 会泄漏 socket / 文件句柄且无 keep-alive 复用。用 `null` 缓存「已尝试但 undici 不可用/初始化失败」的结果，避免重复 `import('undici')`。
   - LRU 语义：`getProxyDispatcher`（`:88`）命中即 delete+set 提到队尾；`setProxyDispatcherCache`（`:47`）超过 `MAX_PROXY_DISPATCHER_CACHE_SIZE=8` 时淘汰最旧并调 `closeProxyDispatcher`（`:31`，best-effort 调 `.close()`/`.destroy()`）。
   - 导出 `__testingProxyDispatcherCache`（`:65`）供测试注入/清理。

4. **`resolveProxyUrl()`（`:206`）— 代理 URL 解析优先级**
   - provider 专属变量 `ALEMBIC_<PROVIDER>_PROXY_HTTPS/HTTP` ＞ 通用 `ALEMBIC_AI_PROXY` ＞ 标准 `HTTPS_PROXY/HTTP_PROXY/ALL_PROXY`（含小写变体）。
   - 注释（`:193-205`）标注历史背景：薄壳化前代理逻辑在 `AiProvider._resolveProxyUrl/_fetch`，请求改走 Transport 后必须在此保留同等代理解析，否则依赖环境代理访问境外 API 的部署会直连失败（功能回归）。

5. **`requireApiKey(label)`（`:289`）+ `providerEnvVar()`（`:296`）**
   - 缺 key 时抛 `createMissingApiKeyError`（`AiProvider.ts:39`），错误带 host-neutral 元数据（`code:'API_KEY_MISSING'` / `provider` / `envVar` / `hostAction:'configure-provider-credential'`），由宿主 UI 渲染具体指引。`providerEnvVar` 把 `ProviderId` 映射到 `ALEMBIC_<X>_API_KEY`。

`index.ts`（`src/ai/transport/index.ts`）只 re-export 四个 transport 类 + 基类与类型。

---

### S12.2 · OpenAiTransport（`src/ai/transport/OpenAiTransport.ts`）

OpenAI transport 是最复杂的一个，因为它支持**两种 API 风格**并被 Ollama 复用。

#### apiStyle 双端点分支（特殊处理点）

`#apiStyle: 'chat' | 'responses'`（`:28`），来源优先级：`config.apiStyle` ＞ `ALEMBIC_OPENAI_API_STYLE` ＞ 默认 `'chat'`（`:33-36`）。文件头注释（`:7-11`）：`gpt-5.x` 等部分中转站/新模型只开放 `/responses`，需显式切换以避免 404。

- **`'chat'` 风格**：POST `/chat/completions`，经典 Chat Completions。
- **`'responses'` 风格**：POST `/responses`，新版 Responses API。

`chat`（`:39`）和 `chatWithTools`（`:79`）都先判 `apiStyle`，responses 分支共用 `#buildResponsesBody` + `#parseResponsesOutput`。

#### 请求映射差异（chat vs responses）

| 维度 | Chat Completions | Responses API |
|---|---|---|
| 消息 | `messages: [{role,content}]`（`#buildMessages`:146） | `input: [...]`（`#buildResponsesInput`:270） |
| system | 作为 `{role:'system'}` 消息 | 顶层 `instructions` 字段（`:234`） |
| 上限 | `max_tokens` | `max_output_tokens`（`:232`） |
| JSON | `response_format:{type:'json_object'}`（`:65`） | `text:{format:{type:'json_object'}}`（`:245`） |
| tools | `{type:'function',function:{name,description,parameters}}`（嵌套，`:106`） | `{type:'function',name,description,parameters}`（**扁平**，`:250`） |
| tool 结果 | `{role:'tool',tool_call_id,content}`（`:165`） | `{type:'function_call_output',call_id,output}`（`:289`） |
| assistant tool_calls | `message.tool_calls`（`:158`） | 拆成独立 `{type:'function_call',call_id,name,arguments}` 项（`:281`） |

Responses input 注释（`:263-269`）明确：`call_id` 在 `function_call` 与 `function_call_output` 之间**原样回传**，保证 ReAct 多轮闭合。

#### 响应解析

- **`#parseResponse`（`:179`，chat 风格）**：从 `choices[0].message` 取 `content`；`tool_calls` 过滤 `type==='function'`，`function.arguments` 用 `try/JSON.parse catch {}` 容错解析（解析失败退化为 `{}`）。usage 手写映射 `prompt_tokens/completion_tokens/total_tokens`。
- **`#parseResponsesOutput`（`:301`，responses 风格）**：文本优先用顶层便捷字段 `output_text`，否则从 `output[].type==='message'` 的 `content[].type==='output_text'` 聚合；function_call 从 `output[].type==='function_call'` 提取，id 用 `call_id||id`；usage 走 `normalizeRawUsage`（S12.9）；`finishReason` 取 `data.status`。

#### embed

`embed`（`:130`）POST `/embeddings`，输入按 `.slice(0,8000)` 截断，`#embedModel` 默认 `text-embedding-3-small`；按 `index` 排序还原顺序。

#### Ollama 复用

Ollama 没有独立 transport：Gateway 的 `#createTransport`（`LLMGateway.ts:399-404`）对 `'ollama'` 直接 `new OpenAiTransport`，补 `apiKey:'ollama'` dummy key 与本地 baseUrl `http://127.0.0.1:11434/v1`。即 Ollama 走 OpenAI 兼容协议。

---

### S12.3 · ClaudeTransport（`src/ai/transport/ClaudeTransport.ts`）

Anthropic Messages API，协议差异集中在文件头（`:4-9`）。基址 `https://api.anthropic.com/v1`，`ANTHROPIC_VERSION='2023-06-01'`（`:22`），headers 用 `x-api-key` + `anthropic-version`（`:196`）而非 Bearer。

特殊处理点：
1. **system 是顶层 `system` 字段**（`:42`），非 message。
2. **assistant content 是 block 数组**（`text` / `tool_use`），工具结果通过 **user 消息里的 `tool_result` block** 传递（`:130`、`:141`）。
3. **`max_tokens` 有默认值 4096**（`:37`、`:66`）——Anthropic API 要求 `max_tokens` 必填，故与其它 transport 不同这里必须兜底。
4. **消息必须严格交替 user/assistant** → `#convertMessages`（`:98`）里的 `pushOrMerge`（`:101`）：若上一条与当前同 role，则把两者 content 都规整为 block 数组后拼接合并；连续 `tool` 消息（`:140`）被聚合成**一个** user 消息里的多个 `tool_result`。
5. **tool_choice 语义差异**（`:8`、`:75-84`）：Anthropic 用 `{type:'auto'|'any'|'tool'}`，**无 `'none'`**——不传 tools 即等价 none。映射：入参 `'required'` → `{type:'any'}`，否则 `{type:'auto'}`；且当 `effectiveToolChoice==='none'` 或无 tools 时**根本不发 tools 字段**（`:76`）。
6. **无原生 JSON mode**（provider 头注释 `ClaudeProvider.ts:10`）：结构化输出靠 `transport.chat` + gateway `extractJSON` 兜底。
7. **无嵌入 API**：`ClaudeProvider.embed` 直接返回 `[]` 触发上层降级（`ClaudeProvider.ts:60`）；transport 未覆写 `embed`，继承基类空实现。

响应解析 `#parseResponse`（`:159`）：遍历 content block，`tool_use` → functionCall（`input` 即 args），`text` → 文本片段用 `'\n'` join；usage 映射 `input_tokens/output_tokens`，`totalTokens` 自行相加。

`ClaudeProvider` 还有一处 provider 级可靠性决策：`maxRetries=0`（`ClaudeProvider.ts:35`），注释「Claude 上游通常自带退避语义，保持 maxRetries=0 避免叠加放大」——这会一路传到 `ReliabilityController` 关闭重试。

---

### S12.4 · GoogleTransport（`src/ai/transport/GoogleTransport.ts`）

Gemini REST API，差异见头注释（`:4-11`）。基址 `https://generativelanguage.googleapis.com/v1beta`。

特殊处理点：
1. **API key 走 URL query**（`:59`、`:102`、`:119`）：`?key=${this.apiKey}`，headers 传空对象。
2. **contents 格式**：role 是 `user`/`model`（非 assistant），`parts` 数组。`#buildContents`（`:130`）同样有 `pushOrMerge` 合并同 role。
3. **工具结果聚合**：`#buildContents` 用 `pendingToolResults` 缓冲区（`:132`）——遇到 `tool` 消息先攒成 `functionResponse`，遇到下一条非 tool 消息或结尾时才 flush 成一个 `user` 消息里的多个 `functionResponse`。`functionResponse.response` 固定包成 `{result: content}`（`:150`）。
4. **工具声明**：`tools:[{functionDeclarations:[...]}]` + `toolConfig.functionCallingConfig.mode`（`:81-96`）。`#toGeminiMode`（`:192`）映射：`required`→`ANY`、`none`→`NONE`、默认→`AUTO`。
5. **JSON Schema 清理 `#sanitizeSchema`（`:248`）**（降级/兼容点）：Gemini 不支持 `default`/`examples`，递归删除；无 `type` 补 `'object'`；`array` 类型无 `items` 强制补 `{type:'string'}`。工具 parameters 与原生 `responseSchema` 都过这层清理。
6. **原生结构化输出**：`chat` 里 `responseFormat==='json'` 时设 `generationConfig.responseMimeType='application/json'`，若带 `schema` 再设 `responseSchema=#sanitizeSchema(schema)`（`:49-57`），做服务端校验。
7. **`thoughtSignature` 原样回传（Gemini 3+ 必须）**（关键兼容点，头注释 `:10`、provider 注释 `GoogleGeminiProvider.ts:9`「否则后续请求 400」）：请求侧 `#buildContents`（`:173`）把 `tc.thoughtSignature` 写回 `functionCall` 相邻的 `thoughtSignature`；响应侧 `#parseResponse`（`:234`）从 `part.thoughtSignature` 取出，经 `TransportFunctionCall.thoughtSignature` → `FunctionCallResult.thoughtSignature` → 下一轮 `UnifiedMessage.toolCalls[].thoughtSignature` 闭环。
8. **function call id 是合成的**（`:231`）：`gemini_fc_${Date.now()}_${fcIndex++}`（Gemini 响应本身不带 call id）。
9. **embed 批处理**（`:108`）：`batchEmbedContents` 端点，按 100 条一批；模型统一补 `models/` 前缀（`:30-32`），默认 `models/gemini-embedding-001`。

usage 映射 `promptTokenCount/candidatesTokenCount/totalTokenCount`（`:210`）。

Provider 侧 `GoogleGeminiProvider` 两处保守默认：`maxConcurrency` 默认 **2**（`GoogleGeminiProvider.ts:32`，规避 Google 配额）；chat 默认 `maxTokens=8192`（`:63`，高于通用 4096）；`summarizeMaxTokens=8192`（`:84`）。并发来源标签 `_maxConcurrencySource`（`:41`）按原始输入重推，保证提示溯源诚实。

---

### S12.5 · DeepSeekTransport（`src/ai/transport/DeepSeekTransport.ts`）

DeepSeek Chat Completions（OpenAI 兼容），但 **V4 thinking 模式有大量特殊处理**（头注释 `:2-9`）。基址 `https://api.deepseek.com`，`V4_PATTERN=/deepseek-v4/i`（`:23`），`VALID_EFFORTS={high,max}`（`:24`）。

V4 分支判定：`isV4 = V4_PATTERN.test(model)`；`v4Thinking = isV4 && hasTools`（`:71-72`）。特殊处理逐条：

1. **thinking 开关按场景切换**：
   - `chat`（无 tools）：V4 时 `thinking:{type:'disabled'}`（`:50`）省 token。
   - `chatWithTools`：`v4Thinking` 时 `thinking:{type:'enabled'}` + `reasoning_effort`（`:103-104`）；`isV4 && !hasTools` 时 `disabled`（`:111`）。
2. **thinking 下 temperature 失效**：`v4Thinking` 时**不发 temperature**（`:97`，仅非 thinking 才发）。
3. **max_tokens 自动提升容纳 reasoning token**（`:106-109`）：effort=`max` 下限 32768，否则 16384；若入参低于下限则抬高。
4. **tool_choice 兼容降级**（`:126-130`，最关键的降级点）：V4 主路径**不发 `tool_choice`**（`if (request.toolChoice && !isV4)`）。注释与 `deepseek.ts:11` 的 `V4_TOOL_CHOICE_REASON` 一致：V4 thinking 真实兼容路由会用 `deepseek-reasoner` 规则拒绝 `required`/named tool。这一条也被 `ParameterGuard` 在上游用 `toolChoice.allowed=false` 提前过滤（双保险，见 S12.8）。
5. **reasoning_content 强制回传**：`#buildToolMessages`（`:175`）在 `v4Thinking` 时给 assistant 补 `reasoning_content: msg.reasoningContent ?? ''`；`#projectV4Reasoning`（`:220`）再做一遍投影确保 API 约束——**带 tool_calls 的 assistant 必须有 `reasoning_content`（缺则补 `''`），不带 tool_calls 的则删除该字段**（否则 API 忽略/报错）。
6. **发送前工具转录归一**（`:79-85`）：调 `normalizeToolTranscriptForChatCompletions`（S12.11），把上下文切片后残缺的 tool round 转成纯文本，`normalizedCount>0` 时 `console.warn`。
7. **文本工具调用兼容**（`:291-307`，S12.12）：若原生 `tool_calls` 为空，再用 `parseDeepSeekTextToolCalls` 从文本解析 `<function_calls>`。触发条件是「声明了 tools 且 `toolChoice!=='none'`」，**不依赖发送出去的 tool_choice**（因为 V4 路径省略了它，`:294-297`）。命中时 `text` 置 null，`console.warn`。

响应解析 `#parseResponse`（`:240`）额外提取：`reasoningContent`、`finishReason`，usage 里带 `reasoningTokens`（`completion_tokens_details.reasoning_tokens`）与 `cacheHitTokens`（`prompt_cache_hit_tokens` 或 `prompt_tokens_details.cached_tokens`）。

`#reasoningEffort`（`:27-32`）来自 `config.reasoningEffort`，非法值兜底 `high`；由 `DeepSeekProvider._transportExtras.reasoningEffort` 透传（`DeepSeekProvider.ts:40-44`）。embed 固定用 `deepseek-embedding` 模型（`:142`）。

---

### S12.6 · providers/* 薄壳（`src/ai/providers/*.ts`）

五个 provider 类（OpenAi/Claude/GoogleGemini/DeepSeek/Ollama）都是「方案① 薄壳」：只负责 **provider 身份 + 配置**，把 `chat/chatWithTools/chatWithStructuredOutput/embed` 全部委托给基类 `AiProvider._gateway*` helper。协议拼装、响应解析、重试/熔断/并发/用量由 `LLMGateway + Transport + ReliabilityController` 统一承担。

各薄壳只做三件事：
1. 设 `name`（即 `ProviderId`）、`model`、`apiKey`、`baseUrl`（默认值 + env 覆盖链，如 `ALEMBIC_OPENAI_BASE_URL` 用于接中转站）。
2. 通过 `_transportExtras`（`AiProvider.ts:219`）透传 provider 专属配置：OpenAi/Ollama 传 `embedModel`（+OpenAi 传 `apiStyle`）、Google 传 `embedModel`、DeepSeek 传 `reasoningEffort`。这些扩展在 `_getGateway`（`AiProvider.ts:437`）里并入 `providers[name]` 配置，最终进 `TransportConfig`。
3. `get supportsNativeToolCalling()` 一律返回 `true`——供 `AgentRuntime` 决定跳过文本正则解析、直接信任原生 functionCall。

provider 级横切配置（会进 gateway/reliability）：
- `ClaudeProvider.maxRetries=0`（`ClaudeProvider.ts:35`）。
- `GoogleGeminiProvider.maxConcurrency=2`（`GoogleGeminiProvider.ts:32`）+ chat `maxTokens=8192`。
- `OllamaProvider.apiKey='ollama'` dummy（`OllamaProvider.ts:33`）、baseUrl `http://localhost:11434/v1`。

Ollama 是唯一没有专属 transport 的 provider：其 provider 类正常存在，但 Gateway 用 `OpenAiTransport` 承载（S12.2 尾）。

---

### S12.7 · ParameterGuard（`src/ai/guard/ParameterGuard.ts`）

#### 职责

在 API 调用前，根据 `ModelDef.parameterConstraints` 自动过滤/纠偏参数，替代各 provider 里分散的 `if` 判断（头注释 `:5-8` 举例：ClaudeProvider `if(isOpus47)不传temperature`、DeepSeekProvider `if(v4Thinking)不传tool_choice`）。纯静态类，唯一入口 `static guard(model, rawParams): GuardedParams`（`:35`）。

#### 输出结构

`GuardedParams`（`:12`）：纠偏后的 `temperature/topP/topK/maxTokens/toolChoice/reasoningEffort` + `filtered: FilteredParam[]`（`:23`，每项 `{param, reason, originalValue}` 作审计日志）。Gateway 用 `filtered` 决定「被过滤的参数一律传 undefined」（`LLMGateway.ts:136-152` 的 `wasFiltered`）。

#### 六个守卫（每个都遵循「缺省不处理 → 检查 allowed → clamp/纠偏 → 记 filtered」）

- **`#guardTemperature`（`:49`）**：`rule.allowed===false` → filtered；否则 `Math.max(min??0, Math.min(max??2, val))` clamp。
- **`#guardTopP`（`:71`）/ `#guardTopK`（`:92`）**：同上，clamp 到 `[min??0, max??1]` / `[min??0, max??100]`。
- **`#guardToolChoice`（`:113`）**：`allowed===false` → filtered（用 `rule.reason` 或默认文案）；还支持**条件禁用** `rule.disabledWhen==='thinking'` && 模型 `reasoning.supported && mode==='thinking'` → filtered（这就是 DeepSeek V4 thinking 禁 tool_choice 的声明式表达）。
- **`#guardReasoningEffort`（`:143`）**：`allowed===false` → filtered；若 `allowedValues` 不含入参 → filtered 且 `out.reasoningEffort=model.reasoning.defaultEffort`（**纠偏为默认值而非丢弃**）。
- **`#guardMaxTokens`（`:174`）**：无 allowed 概念，直接 `Math.min(val, model.maxOutputTokens)` 封顶（不进 filtered）。

#### 约束数据来源

`parameterConstraints` 由 `src/ai/registry/models/*.ts` 声明式定义（如 `deepseek.ts:31-35` 给 V4 设 `toolChoice.allowed=false`），未注册模型经 `ModelRegistry.createDynamicDef`（`ModelRegistry.ts:102`）得保守默认（`temperature allowed, toolChoice allowed`）。Guard 与 transport 内的 V4 处理形成**双重保险**：Guard 在 Gateway 层提前剥离，transport 内 `if(!isV4)` 再兜一次。

---

### S12.8 · Gateway 中 Guard→Transport 的参数编织

`LLMGateway.chatWithTools`（`LLMGateway.ts:119`）是 guard 与 transport 的接缝：`ParameterGuard.guard` 后，`filtered.length>0` 打 debug 日志（`:130`），再用 `wasFiltered(param)` 逐字段决定：被过滤 → `undefined`，否则取 `guarded.X ?? request.X`（`:143-152`）。`maxTokens` 例外——`guarded.maxTokens` 是封顶结果，直接用。这保证了「Guard 认为不该发的参数绝不进 TransportRequest」。

---

### S12.9 · usage —— token 用量归一（`src/ai/shared/usage.ts`）

`normalizeRawUsage(raw): TokenUsage|null`（`:51`）：把任意厂商原始 usage 归一。`RawUsage`（`:18`）是各命名风格的字段并集。

策略（头注释 `:4-12`，`:45-49`）：**多命名风格按优先级取第一个出现的字段，不累加，避免重复计数**：
- input：`prompt_tokens` ＞ `input_tokens` ＞ `promptTokenCount`。
- output：`completion_tokens` ＞ `output_tokens` ＞ `candidatesTokenCount`。
- total：`total_tokens` ＞ `totalTokenCount` ＞ `input+output`（兜底相加）。
- 扩展：`reasoningTokens`（`reasoningTokens`＞`reasoning_tokens`）、`cacheHitTokens`（`cacheHitTokens`＞`prompt_cache_hit_tokens`），仅 `>0` 才写入。
- `num()`（`:39`）非有限数字归 0。

现状：`normalizeRawUsage` 只被 `OpenAiTransport.#parseResponsesOutput` 消费（Responses 风格）；Chat/Claude/Google/DeepSeek 的 usage 目前是 transport 内手写映射（各 `#parseResponse`），与本函数并存但未收敛。usage 最终经 `TransportResponse.usage` → Gateway `#emitUsage`（`LLMGateway.ts:355`）→ `onUsage` 回调 → `AiProvider._emitTokenUsage`（`AiProvider.ts:446`）驱动全局预算/成本统计。`#emitUsage` 里 `total===0` 早退、回调异常被吞（`:371` 注释「token tracking should never break execution」）。

---

### S12.10 · structuredOutput —— JSON 提取与截断修复（`src/ai/shared/structuredOutput.ts`）

厂商无关纯函数（头注释 `:16-24`），供 Provider 与 Gateway 共用，解决「模型多输出一句解释就 `JSON.parse` 失败」。

`extractJSON(text, openChar='{', closeChar='}', onLog?)`（`:30`）流程：
1. 去 markdown 围栏（`` ```json ``/`` ``` `` 正则删除，`:40`）。
2. 定位边界：`indexOf(openChar)` ... `lastIndexOf(closeChar)`。
3. **常规路径**（`:48`）：切片 → 删尾逗号 `/,\s*([}\]])/g` → `JSON.parse`。
4. 失败且 `openChar==='['` → **截断修复** `repairTruncatedArray`（`:70`，仅数组）。对象不修复，返回 null。

`repairTruncatedArray`（`:70`）双策略：
- **策略1 `repairByCharTracking`（`:87`）**：字符级深度追踪 —— 处理 `inString`/`isEscaped`，`depth===1 && ch==='}'` 记为最后一个完整顶层对象末尾（`:116`），再 `tryRepairAt`。
- **策略2 `repairByRegexFallback`（`:132`）**：不依赖 inString 追踪（应对代码段中未转义引号），正则 `/\}[\s,]*(?=\s*[[{]|$)/g` 收集候选 `}` 位置，从后往前逐个 `tryRepairAt`。
- `tryRepairAt`（`:152`）：截断 → 去尾逗号 → 补 `]` → 再删尾逗号 → `JSON.parse`，成功且非空数组则 `onLog('warn', 'recovered N items')`。

消费方：
- Gateway `chatStructured`（`LLMGateway.ts:204`）：`chat({json})` + `extractJSON`，是 provider `chatWithStructuredOutput` 的实际实现（比基类 `LLMTransport.chatStructured` 的朴素 parse 稳健得多）。`openChar/closeChar` 可由 `StructuredOutputOptions` 定制（数组场景传 `[` `]`）。
- `AiProvider`/`ClaudeProvider` 仍 import 它（历史直用路径）。

---

### S12.11 · toolTranscript —— 工具转录归一（`src/ai/toolTranscript.ts`）

`normalizeToolTranscriptForChatCompletions(messages, {forceToolFree?})`（`:115`）解决 OpenAI 兼容 API 的硬约束（头注释 `:1-7`）：**每个 `tool` 消息必须回应前一条带匹配 `tool_calls` 的 assistant 消息**。上下文切片会破坏该不变量。

核心判定 `isCompleteImmediateToolRound`（`:87`）：assistant 的 `tool_calls[].id` 集合必须与紧随其后的连续 `tool` 消息的 `tool_call_id` **一一对应（无缺、无多、无重复、size 相等）**。

转移逻辑（`:122-155`）：
- assistant(有 tool_calls) + 紧随 tool 消息构成完整 round 且非 forceToolFree → **原样保留**。
- 否则 → assistant 的 tool_calls 转成文本 `assistantToolCallsAsText`（`:61`，args 截断 800 字符，附 `[tool calls converted to text]`），tool 结果转成 user 文本 `toolResultAsUserMessage`（`:76`，内容截断 4000 字符），`normalizedCount` 累加。
- 孤儿 `tool` 消息（前面无匹配 assistant）→ 直接转 user 文本。

`cloneWithoutToolCalls`（`:52`）转文本时同时删 `reasoning_content`。目前唯一消费方是 `DeepSeekTransport`（`:80`）。

---

### S12.12 · deepseekToolCallCompat —— DeepSeek 文本工具调用兼容（`src/ai/deepseekToolCallCompat.ts`）

`parseDeepSeekTextToolCalls(text, allowedToolNames): FunctionCallResult[]`（`:15`）。头注释（`:6-14`）明确定位：**DeepSeek V4 有时把工具调用写成 `<function_calls>` 文本而非原生 `tool_calls`，这是兼容桥，不代表 native tool call 闭环成立**；调用方必须靠 call id / 日志区分 compat 路径与 native 路径。

安全约束（关键）：
- **仅当声明了 `allowedToolNames` 才转译**（`:19`），未知工具名一律丢弃（`:27`），避免把普通分析文本误当工具执行。
- 早退条件：文本不含 `<function_calls`、无 allowed 列表 → 返回 `[]`。

解析：`INVOKE_RE`（`:3`）匹配 `<invoke name>`，`PARAM_RE`（`:4`）匹配 `<parameter name>`；生成 id `call_deepseek_compat_${n}`（`:32`，前缀标识 compat 来源）。`parseValue`（`:52`）做类型推断（true/false/null/数字/JSON 对象数组）；`unescapeXml`（`:78`）反转义。

命中后在 `DeepSeekTransport.#parseResponse`（`:298`）把 `text` 置 null、`console.warn('converted N text function call(s)')`，与 native 路径日志区分。

---

### S12.13 · reliability —— 可靠性控制器（`src/ai/shared/reliability.ts`）

`ReliabilityController`（`:73`）是有状态横切能力（头注释 `:1-16`）：把重试、熔断、并发闸门、429 冷却窗封成独立单元，Provider 与 Gateway 都可持有实例复用，行为与原 `AiProvider._withRetry/_acquireRequestSlot/_setRateLimitWindow` 对齐。**厂商无关**——协议细节归 Transport，控制器只在 Transport 调用外层包裹。

#### 构造与状态

`ReliabilityOptions`（`:30`）：`maxRetries`(默认3)、`circuitThreshold`(默认5)、`maxConcurrency`(默认 `ALEMBIC_AI_MAX_CONCURRENCY`||4，下限1)、`label`、`onLog`。状态字段：熔断三态 `circuitState: CLOSED|OPEN|HALF_OPEN`、`circuitFailures`、`circuitOpenedAt`、`circuitCooldownMs`(初始30s)；并发 `activeRequests`、`requestQueue`、`rateLimitedUntil`。

#### 并发闸门（信号量）

- `acquireSlot`（`:107`）：`activeRequests<maxConcurrency` 即 +1 放行；否则入队 `requestQueue`，等待 `resolve`。入队时挂 abort 监听（`:123`），中止则从队列剔除并 reject。
- `releaseSlot`（`:135`）：优先唤醒队首（若队首已 abort 则 reject 并递归释放，`:141`）；无等待者才 `activeRequests--`。

#### 429 冷却窗

- `setRateLimitWindow(waitMs)`（`:183`）：把 `rateLimitedUntil` 抬到 `now+wait`（取更大值），并 `warn` 日志。
- `waitForRateLimitWindow`（`:152`）+ `abortableDelay`（`:162`）：可取消的定时等待，abort 时 clearTimeout 并 reject。

#### 主流程 `run(fn, retries, baseDelay=2000, {abortSignal})`（`:202`）—— 状态机

进入前检查熔断：`OPEN` 且未过冷却 → 抛 `CIRCUIT_OPEN`（`:213`）；过了冷却 → 转 `HALF_OPEN`（`:217`）。

循环 `attempt 0..retries`：
1. `waitForRateLimitWindow` → `acquireSlot`（`:223-225`，都传 abortSignal）。
2. 执行 `fn()`。**成功** → 完全重置熔断（`circuitFailures=0`、`CLOSED`、`cooldown=30s`），return（`:229-232`）。
3. **失败** → `classifyLlmError`（S12.14）：
   - `isAbort` → 直接抛，**不重试**（`:239`）。
   - `status===429` → 自适应冷却 `max(retryAfterMs, baseDelay*2^attempt*1.5 + rand*1000)` 设窗（`:245-251`），抑制并发重试风暴。
   - 首次失败且网络错误/带 cause → warn 记 cause（`:255`）。
   - `attempt>=retries || !isRetryable` → 终态：仅 `isServerError` 累计 `circuitFailures`；达阈值且未 OPEN → 转 `OPEN` 记 `circuitOpenedAt`，**cooldown 指数翻倍封顶 300s**（`:277`）；然后抛（`:280`）。
   - 否则退避 `baseDelay*2^attempt + rand*1000`，info 日志，`abortableDelay` 后重试（`:283-288`）。
4. `finally` 释放 slot（`:290`）。

熔断隔离：Gateway 每 provider 一个 controller（`LLMGateway.ts:329` `#getController`），`OpenAiProvider.ts` 等也 import。`makeCircuitOpenError`（`:44`）带 `code:'CIRCUIT_OPEN'`，被 `AgentRuntime` 感知后走合成摘要兜底（`AgentRuntime.ts:23`）。

---

### S12.14 · errorClassify —— 错误分类（`src/ai/shared/errorClassify.ts`）

`classifyLlmError(err): ErrorClassification`（`:55`）纯函数，是重试/熔断的判定基础，行为从 `AiProvider._withRetry` 逐字迁移（头注释 `:1-9`）。

分类字段（`:23`）：
- **`isAbort`**（`:61`）：`name==='AbortError'` 或 `cause.name==='AbortError'`——绝不重试。
- **`isNetworkError`**（`:64`）：无 `status` 且（`message==='fetch failed'` 或 `code`/`causeCode` ∈ `RETRYABLE_NETWORK_CODES`）。可重试网络码集合（`:39`）：`ECONNRESET/ECONNREFUSED/ENOTFOUND/ECONNABORTED/ETIMEDOUT/UND_ERR_CONNECT_TIMEOUT/UND_ERR_SOCKET`。
- **`isRetryable`**（`:70`）：`429 || >=500 || isNetworkError`。
- **`isServerError`**（`:82`，用于熔断计数）：`isNetworkError || 429 || >=500 || (无status && 非程序员错误)`。
  - **`isProgrammerError`**（`:74`）：`TypeError/ReferenceError/SyntaxError/RangeError` 被显式排除熔断计数。注释（`:72-73`）：确定性 bug 连续抛出不应把熔断器打开、伪装成「AI 服务中断」。
- 客户端 4xx（非 429）既不 retryable 也不 serverError——是请求本身的问题（`:80-81`）。

`status` 来自 `LLMTransport.post` 挂在 Error 上的 `status` 字段（S12.1）。

---

### S12.15 · shared/index 桶（`src/ai/shared/index.ts`）

统一导出四个横切单元（头注释 `:1-8`「横切能力只实现一次」）：`classifyLlmError`+类型、`ReliabilityController`+选项类型、`extractJSON`/`repairTruncatedArray`+`StructuredLogFn`、`normalizeRawUsage`+`RawUsage`。既被生产 Provider 层复用，也供 Gateway+Transport 消费，避免两套实现漂移。

---

### S12.16 · 跨子系统集成点与设计决策小结

**上游调用方**：`AiProvider` 薄壳 → `_gateway*` → `LLMGateway` 是唯一入口；`AgentRuntime`（`src/agent/runtime/AgentRuntime.ts:1035`）经 `aiProvider.chatWithTools` 间接消费，并感知 `CIRCUIT_OPEN` 走摘要兜底；`ContextWindow`（`src/agent/context/ContextWindow.ts`）的 reasoning 管理已下沉到 `DeepSeekTransport.#projectV4Reasoning`（注释 `:567`、`:749`）。

**下游/跨仓依赖**：唯一 `@alembic/core` 依赖是 `Logger`（`@alembic/core/logging`，各 provider 与 Gateway import），用作诊断日志，不涉及 Core 确定性内核契约。

**关键设计决策（值得长期记录）**：
1. **协议/横切/身份三层分离（方案①）**：Transport 纯协议、ReliabilityController 纯横切、Provider 纯薄壳；新增厂商只需写一个 transport + 一个薄壳 + 一份 ModelDef，不再复制重试/熔断/解析逻辑。
2. **代理必须走全局 fetch**（`LLMTransport.ts:269-276`）：既让 undici `dispatcher` 生效，又不绕过测试 fetch 桩；ProxyAgent 按 url 缓存复用防 socket 泄漏。
3. **per-provider 隔离**：transport 与 reliability 实例按 `ProviderId` 缓存，熔断/并发/限流互不干扰；Claude `maxRetries=0`、Gemini `maxConcurrency=2` 等 provider 差异一路透传。
4. **DeepSeek V4 是特殊处理集中地**：thinking 开关、temperature 失效、max_tokens 提升、tool_choice 省略、reasoning_content 强制回传、文本工具调用兼容、工具转录归一——每一处都有明确日志/注释区分 native 与 compat 路径，符合仓库 CLAUDE.md「必须区分 native tool call / 兼容转译 / degraded path」的硬规则。
5. **Guard 与 transport 双保险**：声明式 `parameterConstraints`（Gateway 层剥离）+ transport 内运行时判断，避免任一层遗漏导致 400。
6. **健壮性优先于严格**：JSON 截断修复、usage 归一防重复计数、token 回调异常被吞、embed 失败返回空向量触发降级——错误路径一律不中断主流程。


## S13 · 工具系统内核 · Catalog · Runtime 路由/注册/适配/缓存/能力封装 (src/tools/kernel, catalog, runtime 骨架)

本章剖析 `@alembic/agent` 工具系统的三层骨架:`src/tools/kernel`(契约层,单一真相的类型词汇)、`src/tools/catalog`(能力清单/工具目录)、`src/tools/runtime`(注册表、路由器、宿主适配、缓存、能力封装)。这三层共同回答一个核心问题:**Agent 的一次工具调用,如何从 `runtime` 入口被解析、鉴权、并发控制、分发到具体 handler,再归一化成对外稳定的结果信封**,以及跨调用共享的 `DeltaCache` 增量缓存如何注入。

> 历史背景:`src/tools/index.ts` 与 `kernel/index.ts` 的模块注释都明确指出,当前 kernel 是"取代旧 V1(`src/tools/core`)与 V2(`src/tools/v2/types`)双契约分裂"后的 canonical 单源;仓库 `CLAUDE.md` 中的"工具系统 V1 退役登记"记录了这次收敛的授权链路。本章描述的是收敛后的形态。

---

### S13.1 · 目录结构与三层职责

```
src/tools/
├── index.ts                      # 顶层 barrel:re-export catalog + kernel + runtime + workflow
├── kernel/                       # 契约层(纯类型 + 少量纯函数,零运行时依赖)
│   ├── index.ts                  # barrel
│   ├── registry.ts               # ToolSpec/ToolAction/ToolContext/ToolResult + ok/fail/estimateTokens
│   ├── result.ts                 # ToolResultEnvelope 对外稳定信封 + projectToolResultOrdinaryOutput 脱敏投影
│   ├── context.ts                # ToolCallContext / ToolRuntimeCallContext / service-contract 缝
│   ├── handler.ts                # InternalToolHandler 契约 + contextFromToolCall 适配
│   ├── request.ts                # ToolCallRequest / ToolRouterContract(路由器对外契约)
│   ├── decision.ts               # ToolDecision(explain 阶段的 allow/deny 裁决)
│   ├── routing.ts                # ToolRouterContract 的 service-contract 包装/解析
│   └── presenter.ts              # presentToolResult / isToolResultEnvelope
├── catalog/
│   ├── CapabilityManifest.ts     # ToolCapabilityManifest 全字段声明(risk/execution/governance)
│   ├── CapabilityCatalog.ts      # manifest 注册/查询基类
│   └── UnifiedToolCatalog.ts     # 单源目录:manifest 查询 + handler 查询 + per-model/懒加载 schema 投影
├── runtime/
│   ├── registry.ts               # TOOL_REGISTRY(6 个工具的声明式定义,单一真相源)
│   ├── router.ts                 # ToolRouter:解析→校验→鉴权→并发→handler→截断
│   ├── index.ts                  # barrel
│   ├── adapter/
│   │   ├── ToolRouterAdapter.ts  # ToolRouter → ToolRouterContract 桥接 + ToolResult → Envelope
│   │   └── RuntimeCapabilityCatalog.ts  # 从 TOOL_REGISTRY 生成 schema 的轻量 catalog
│   ├── cache/
│   │   ├── DeltaCache.ts         # 文件读取增量缓存(长生命周期跨调用共享,B-1 承重件)
│   │   └── SearchCache.ts        # 搜索结果 LRU 缓存
│   └── capabilities/             # 场景级工具集封装(Conversation/Bootstrap*/Scan*/Evolution/System)
└── workflow/WorkflowRegistry.ts  # 工作流注册表
```

三层的边界纪律:
- **kernel** 是纯契约,零运行时依赖(甚至不 import handler),用 `unknown` + duck-type 断言避免反向依赖(见 `registry.ts:97-101` 的设计注释)。它是 Agent tool router 与所有宿主 tool adapter 的**共享词汇**。
- **catalog** 声明"有哪些工具、每个工具的风险/执行/治理画像、以何种 schema 投影给 LLM"。
- **runtime** 是本仓库唯一的 concrete 工具实现:`TOOL_REGISTRY` 声明 6 个内建工具,`ToolRouter` 执行它们,`ToolRouterAdapter` 把 `ToolRouter` 适配成 kernel 的 `ToolRouterContract`。Dashboard/MCP/terminal-sandbox 等宿主能力由宿主注入 context,**不在 AlembicAgent 内提供 concrete adapter**(`ToolRouterAdapter.ts:1-7` 注释)。

---

### S13.2 · kernel/registry.ts — 工具规格与 handler 契约

这是"轻量工具系统"(runtime 路径)的类型基石,与 `result.ts`/`context.ts` 那套"重量信封"(host-surface 路径)并存。

#### 核心数据结构

- **`ToolAction`**(`kernel/registry.ts:19-36`):单个 action 的完整定义。字段编码了工具的运行时策略:
  - `summary` / `description`:前者用于首轮轻量 schema,后者在 `meta.tools` 展开时返回(两级描述的懒加载设计)。
  - `params: JSONSchema4`:参数 schema(`JSONSchema4 = Record<string, unknown>`,`registry.ts:12`,刻意简化避免外部依赖)。
  - `handler: ActionHandler`:实际执行函数,签名 `(params, ctx: ToolContext) => Promise<ToolResult>`(`registry.ts:197-200`)。
  - `cache?: 'none' | 'session' | 'delta'`:缓存策略(`delta` = 文件 hash 增量)。
  - `concurrency?: 'parallel' | 'single' | 'exclusive'`:并发模式,直接驱动 `ToolRouter` 的锁选择。
  - `risk?: 'read-only' | 'write' | 'side-effect'` 与 `maxOutputTokens?`:后者是输出 token 硬上限。
- **`ToolSpec`**(`registry.ts:39-43`):一个工具 = name + description + `Record<string, ToolAction>`(多 action)。
- **`ToolRegistry = Record<string, ToolSpec>`**(`registry.ts:46`)。
- **`ParsedToolCall`**(`registry.ts:53-57`):`{ tool, action, params }` —— router 从 LLM 原始 function call 解析后的强类型三元组。
- **`ToolResult`**(`registry.ts:81-86`):`{ ok, data, error?, _meta? }` 统一返回结构。`_meta`(`ToolResultMeta`,`registry.ts:60-78`)对 LLM 不可见,携带 `cached`/`durationMs`/`tokensEstimate`,以及两个诊断标志 `degraded`(降级/部分结果,如 timeout 杀掉的命令的部分输出)与 `fallbackUsed`(回退到次路径,如 ripgrep 失败后的 regex 扫描)——这两个标志被 adapter 抬升到信封诊断。

#### `ToolContext` — 依赖注入契约(runtime 路径的 handler ctx)

`ToolContext`(`registry.ts:102-171`)是 handler 执行上下文,通过 DI 注入外部依赖。设计约束(注释 `registry.ts:92-101`)值得记录:

- 各字段**可选**,由外部的 `ToolContextFactory` 在调用前**按需组装**(不是所有 handler 需要全部依赖)。
- 重量级服务(`projectGraph` / `codeEntityGraph` / `searchEngine` / `recipeGateway` / `knowledgeRepo` / `evolutionGateway` / `astAnalyzer` / `sandboxExecutor` 等)用 `unknown` 类型是**有意为之**:真实接口(`*Like`)定义在各 handler 文件内做 duck-type cast,避免 `registry.ts` 反向依赖 handler。
- 轻量组件通过最小 DI 接口约束:`DeltaCacheLike`(`registry.ts:257-264`)、`SearchCacheLike`(`registry.ts:267-270`)、`SessionStoreLike`、`OutputCompressorLike`、`MemoryCoordinatorLike`(`registry.ts:237-254`,`memory.note_finding` 桥接 Agent 记忆)。
- 运行时参数:`tokenBudget`(本次调用 token 预算,影响截断)、`abortSignal`(取消信号)、`toolRegistry`(meta.tools 自省用,由 router 自动注入)、`runtime?: ToolRuntimeCallContext`(供 write 工具注入系统字段)。

#### 纯函数 helper

- `ok(data, meta?)` / `fail(error)`(`registry.ts:300-316`):快速构建成功/失败结果。
- `estimateTokens(text)`(`registry.ts:319-321`):`Math.ceil(len/4)` 的简易估算,被 router 的截断逻辑复用。

#### `CapabilityDef` — capability → 允许的 action 白名单

`CapabilityDef`(`registry.ts:207-213`)是**运行时权限白名单**的核心:`allowedTools: Record<string, string[]>`(tool → 允许 action 列表)+ 可选 `commandAllowlist`(`TerminalCommandAllowlist`,`registry.ts:215-221`,含 `bins` 正向命令白名单与 `intent.network:'none'`/`filesystem:'read-only'` 意图)。这是 runtime 路径的鉴权单元,由 `capabilities/*` 生成(见 S13.9)。

---

### S13.3 · kernel/result.ts — 对外稳定的 ToolResultEnvelope 与脱敏投影

这是与 `ToolResult` **并行的另一套结果契约**:更重、更稳定,是"Agent tool router 与每个 host-surface tool adapter 共享的对外信封"(`result.ts:1-7`,注释强调 shape 逐字保留以保持字节兼容)。

#### 关键类型

- **`ToolResultStatus`**(`result.ts:9-16`):7 态 —— `success | partial | error | blocked | aborted | timeout | needs-confirmation`。比 `ToolResult.ok` 布尔更细粒度,区分了取消/超时/需确认等失败路径。
- **`ToolResultEnvelope<T>`**(`result.ts:90-106`):完整信封,含 `toolId`/`callId`/`parentCallId`(父子调用链)/`startedAt`/`durationMs`/`status`/`text`/`structuredContent`/`artifacts`/`resources`/`cache`/`diagnostics`/`trust`/`nextActionHint`。
- **`ToolResultTrust`**(`result.ts:35-40`):`source`(internal/terminal/mcp/skill/macos/user)+ `sanitized`/`containsUntrustedText`/`containsSecrets` —— 提示注入/不可信文本的信任边界标记。
- **`ToolResultDiagnostics`**(`result.ts:61-88`):loop 级诊断聚合 —— `degraded`/`fallbackUsed`/`warnings`/`timedOutStages`/`blockedTools`/`truncatedToolCalls`/`emptyResponses`/`aiErrorCount`/`gateFailures`/`toolCalls[]`(含 callId/parentCallId/status/durationMs 的调用树)。

#### 脱敏投影 `projectToolResultOrdinaryOutput`

- **`TOOL_RESULT_FORBIDDEN_ORDINARY_OUTPUT_FIELDS`**(`result.ts:18-33`,`Object.freeze`):禁止出现在 ordinary-output 里的字段黑名单 —— `apiKey`/`hostCredential`/`threadId`/`rawProviderRequest`/`rawProviderResponse`/`reasoningContent`/`thoughtSignature`/`data.result` 等(混合了裸 key 名与 `data.result` 这种点分路径)。
- **`projectToolResultOrdinaryOutput(envelope, options?)`**(`result.ts:166-199`):把内部信封投影成对外 `ToolResultOrdinaryOutput`。核心是递归脱敏 `sanitizeOrdinaryNode`(`result.ts:232-266`):按 key 名或点分路径(`forbiddenKeys`/`forbiddenPaths` 两套 Set)从 `structuredContent` 中剥离禁止字段,记录 `redactedFields`;再由 `summarizeToolResultDiagnostics`(`result.ts:201-222`)把重诊断压成计数式 `diagnosticSummary`(warningCodes/blockedToolIds/gateFailureStages 都去重排序)。禁止字段名单可通过 `options.forbiddenFields` 覆盖,`failureTaxonomy` 可选注入(`ToolResultFailureTaxonomy`,`result.ts:126-136`,含 `stableId: core.failure.${string}` 与 `privateDataSafe: true`)。

`presenter.ts` 提供两个门面:`presentToolResult(envelope)`(`presenter.ts:9-11`)= 取投影后的 `.text`;`isToolResultEnvelope(value)`(`presenter.ts:13-23`)= 结构 type guard(检查 toolId/callId/status/text/trust 五键)。

---

### S13.4 · kernel/context.ts — 调用上下文与 service-contract 缝

`context.ts` 定义 host-surface 路径的**调用上下文**与 DI service-locator 缝。

- **`ToolSurface`**(`context.ts:10`):`runtime | http | mcp | dashboard | composer | system` —— 工具被调用的表面。
- **`ToolCallContext`**(`context.ts:127-141`):一次调用的完整上下文 —— `callId`/`parentCallId`/`toolId`/`surface`/`actor`/`source`/`runtime`/`abortSignal`/`projectRoot`/`dataRoot`/`services: ToolServiceLocator`/`serviceContracts`。
- **`ToolServiceLocator`**(`context.ts:23-25`):`get<T>(name): T` —— 服务定位器。
- **service-contract 缝**(`context.ts:27-69`):把重量服务分组成 6 个契约接口 —— `ToolRoutingServiceContract`(持 `toolRouter`)、`ToolKnowledgeServiceContract`、`ToolGuardServiceContract`、`ToolLifecycleServiceContract`(evolutionGateway/proposalRepository/consolidationAdvisor)、`ToolInfraServiceContract`、`ToolQualityServiceContract`。这些是 handler 通过 `serviceContracts` 拿到下游 Core 服务的接线口,全部 `unknown | null` 返回(duck-type)。
- **`ToolRuntimeCallContext`**(`context.ts:100-125`):从 `AgentRuntime` 透传的运行时元数据 —— `agentId`/`presetName`/`iteration`、`policyValidator`(策略校验)、`cache`(`ToolResultCacheProvider`)、`diagnostics`(`ToolDiagnosticsRecorder`)、`aiProvider`、`safetyPolicy`,以及冷启动/维度相关的 `dimensionMeta`/`currentRound`/`dimensionScopeId`/`submittedTitles`/`memoryCoordinator` 等。这是 write 工具注入系统字段、诊断记录、缓存查询的来源。

`ToolPolicyDecision`/`ToolPolicyValidator`(`context.ts:71-82`)是 host-surface 侧的策略缝:`validateToolCall(name, args) → { ok, reason?, resultStatus?, requiresConfirmation? }`,允许返回 `needs-confirmation`。

---

### S13.5 · kernel/handler.ts、request.ts、decision.ts、routing.ts — 剩余契约

- **`handler.ts`**:定义 `InternalToolHandler`(`handler.ts:47-50`,签名 `(params, InternalToolHandlerContext) => Promise<unknown>`)、`InternalToolHandlerEntry`(name/description/parameters/metadata/handler)、`InternalToolHandlerStore.getInternalTool(name)`(`handler.ts:60-62`,由 `UnifiedToolCatalog` 实现)。关键纯函数 **`contextFromToolCall(requestContext)`**(`handler.ts:64-101`):把 `ToolCallContext` 展平成 `InternalToolHandlerContext`,把 `runtime.*` 的可选字段用 `...(cond ? {k:v} : {})` 逐个搬进带 `_` 前缀的内部字段(`_sharedState`/`_dimensionMeta`/`_submittedTitles` 等),并用 `isLogger`/`isSharedState` type guard 守卫。`toServiceLocator`(`handler.ts:103-116`)在 container 缺失时返回一个"抛错的假 locator"(fail-fast)。
- **`request.ts`**:定义路由器对外契约。
  - **`ToolCallRequest`**(`request.ts:18-32`):`{ toolId, args, surface, actor, source, parentCallId?, abortSignal?, runtime?, governance? }` —— 一次工具调用请求。
  - **`ToolRouterContract`**(`request.ts:53-59`):路由器三方法 —— `execute(request)`、`executeChildCall(request & {parentCallId})`、`explain(request) → ToolDecision`。这是 Agent tool router 与 host-surface router **都要实现**的统一契约。
  - `ToolExecutionAdapter`(`request.ts:47-51`):按 `CapabilityKind` 分发的执行适配器契约(`preview?` + `execute`),供 host 侧多 kind 路由使用。
- **`decision.ts`**:`ToolDecision`(`decision.ts:16-27`)是 explain 阶段产出的 allow/deny 裁决,四阶段 `ToolDecisionStage = discover | plan | approve | execute`(`decision.ts:6`),失败状态 `blocked | aborted | timeout | needs-confirmation`。helper `allowToolDecision`/`denyToolDecision`(`decision.ts:29-39`)。
- **`routing.ts`**:`createToolRoutingServiceContract(router)` 与 `resolveToolRouterFromContext(context)`(`routing.ts:10-24`)—— 把 `ToolRouterContract` 塞进/取出 `context.serviceContracts.toolRouting`,取出时用 `isToolRouterContract`(检查三方法齐全)守卫,让 handler 能在上下文里递归调用工具路由。

---

### S13.6 · catalog — CapabilityManifest / CapabilityCatalog / UnifiedToolCatalog

#### CapabilityManifest.ts — 能力画像

`ToolCapabilityManifest`(`CapabilityManifest.ts:89-106`)是一个工具的**完整治理画像**,远比 `ToolSpec` 详尽:

- `kind: CapabilityKind`(`CapabilityManifest.ts:1-8`):`internal-tool | dashboard-operation | workflow | terminal-profile | skill | mcp-tool | macos-adapter`。
- `lifecycle`(experimental/active/deprecated/disabled)、`surfaces`(可暴露的表面数组)。
- **`risk: ToolRiskProfile`**(`:32-46`):`sideEffect` + `dataAccess`(none→secrets 六档)+ `writeScope` + `network` + `credentialAccess` + `requiresHumanConfirmation` + `owaspTags`(prompt-injection/excessive-agency/unbounded-consumption 等)。
- **`execution: ToolExecutionProfile`**(`:48-56`):`adapter` + `timeoutMs`/`maxOutputBytes` + `abortMode`(none/preStart/cooperative/hardTimeout)+ `cachePolicy`(none/session/scope/persistent)+ `concurrency` + `artifactMode`。
- **`governance: ToolGovernanceProfile`**(`:58-68`):`gatewayAction`/`gatewayResource` + `auditLevel` + `policyProfile`(read/analysis/write/system/admin)+ `approvalPolicy`(auto/explain-then-run/confirm-once/confirm-every-time)+ `allowInComposer`/`allowInRemoteMcp`/`allowInNonInteractive`。
- `externalTrust`(`:75-87`,MCP/skill/macos 来源的信任声明,含 registration provenance)、`evals`(是否需要 eval + case 列表)。

`ToolSchemaProjection`(`:108-113`)是最终喂给 LLM 的极简形态:`{ name, description, parameters }`。

#### CapabilityCatalog.ts — manifest 注册/查询基类

`CapabilityCatalog`(`CapabilityCatalog.ts:14-76`)是一个 `Map<id, manifest>` 封装:`register`(重复 id 抛错,`:25-27`)、`registerAll`、`unregister`、`has`、`getManifest`、`list(filter)`(`:49-63`,按 surface/lifecycle/ids 过滤,**始终排除 `lifecycle==='disabled'`**)、`toToolSchemas(ids?)`。它是 `UnifiedToolCatalog` 的父类,保证对 `ToolRouter`/`GovernanceEngine` 的向后兼容。

#### UnifiedToolCatalog.ts — 单源真相目录(312L)

`UnifiedToolCatalog extends CapabilityCatalog implements InternalToolHandlerStore`(`UnifiedToolCatalog.ts:131`)。它合并了"manifest 查询"(父类)与"handler 查询"(`ToolRegistry` 的老职责),内部存 `ToolDefinition`(`:39-57`,含 `handler`/`inputSchema`/`risk`/`governance`/`execution`/`modelOverrides`)。

关键机制:
1. **双注册**:`registerDefinition(def)`(`:152-159`)把 def 存进 `#defs`,同时用 `definitionToManifest(def)`(`:59-88`)把它转成 manifest 调 `super.register()`。manifest 的 `surfaces` 由 governance/risk 推导(`allowInRemoteMcp` → 加 `mcp`;非 `sideEffect` → 加 `http`),`evals.required` = `sideEffect || policyProfile!=='read'`。
2. **handler 访问**:`getHandler(id)`(`:169-171`)、`getInternalTool(name)`(`:179-198`,把 def 适配成 `InternalToolHandlerEntry` 兼容 `InternalToolHandlerStore`)。
3. **router 绑定**:`setRouter`/`getRouter`(`:142-148`,替代旧 `ToolRegistry.setRouter`)。
4. **per-model schema 覆盖**:`toToolSchemasForModel(ids?, model?)`(`:206-219`)对每个 manifest 查 `#defs`,若有 def+model 则走 `definitionToSchemaProjection`(`:90-97`),后者用 `matchModelOverride`(`:99-112`)按 `modelOverrides` 的 glob 模式(`matchGlob`,`:114-129`,支持单 `*` 前后缀匹配)匹配当前 model,命中则替换 description/inputSchema。这实现了**同一工具对不同模型给不同描述**。
5. **懒加载三态 schema**(降 token 的核心):
   - `#expandedToolIds: Set`(`:224`)记录"已被 Agent 用过、需展开完整 schema"的工具。`markExpanded`/`markExpandedAll`/`resetExpanded`(`:227-241`)在 round 之间/pipeline 阶段之间管理。
   - `toLightweightSchemas(ids?)`(`:247-253`):只给 `name + 单行 description(截 120 字符)+ 空 params`,用于 Agent 还没碰过的工具。
   - **`toMixedSchemas(ids?, model?, firstRound=false)`**(`:267-295`):`firstRound` 时全给完整 schema;否则**已展开工具给完整(可 model override),未用工具给轻量**。注释指出这把 30+ 工具集的 schema token 成本从 ~50-80% 降到 ~20-30%。

---

### S13.7 · runtime/registry.ts — TOOL_REGISTRY(626L,内建工具单一真相源)

`TOOL_REGISTRY`(`runtime/registry.ts:503-510`)声明式定义 6 个内建工具,每个工具是一个 `ToolSpec`,handler 委托给 `runtime/handlers/*` 里的 `handle(action, params, ctx)` 分发函数:

| 工具 | actions | handler 文件 | 风险/并发要点 |
|------|---------|-------------|--------------|
| `code` | search / read / outline / structure / write | `handlers/code.ts` | read 用 `cache:'delta'`;write 用 `concurrency:'exclusive'`+`risk:'write'` |
| `terminal` | exec | `handlers/terminal.ts` | `concurrency:'single'`,`risk:'side-effect'`,timeout 默认 30s/上限 120s |
| `knowledge` | search / submit / detail / manage | `handlers/knowledge.ts` | submit/manage `concurrency:'single'`+`risk:'write'` |
| `graph` | overview / query | `handlers/graph.ts` | 全 read-only,`cache:'session'` |
| `memory` | save / recall / note_finding / get_previous_evidence | `handlers/memory.ts` | note_finding 桥接 `MemoryCoordinator` |
| `meta` | tools / plan / review | `handlers/meta.ts` | 自省/规划工具,`meta.tools` 需要 `toolRegistry` 注入 |

每个 action 的 schema 里编码了运行时约束(如 `code.search.maxOutputTokens:3000`、`code.read.maxOutputTokens:5000`)。`code.read` 的 description(`registry.ts:52-53`)明确了自适应策略:有 range/maxLines 返回带行号切片、≤500 行返回全文、>500 行返回 AST outline、re-read 走 delta 缓存返回 `[unchanged]`。

#### schema 生成函数

- `getToolNames()` / `getActionNames(tool)`(`:513-521`):基本查询。
- **`generateLightweightSchemas(allowedTools?)`**(`:596-626`):首轮发给 LLM 的轻量 schema 生成器,也是 `ToolRouter.getSchemas()` 与 `RuntimeCapabilityCatalog` 的底座。逻辑:
  - 遍历 `TOOL_REGISTRY`,若传了 `allowedTools` 且某工具不在白名单则跳过。
  - 每个工具生成一个 schema:`parameters` 固定为 `{ action: enum(允许的 action), params: <action-scoped schema> }`。
  - `restricted`(白名单裁剪过)时,description 用 `actionScopedDescription`(`:563-574`,列 `action: summary` 摘要);params 用 `actionScopedParamsSchema`(`:576-593`):**单 action 时直接内联该 action 的完整 params schema**(克隆 + 补 description),多 action 时只给 `{type:'object', description: 各 action required 参数路径}`。
  - `nestedRequiredParamPaths`(`:523-542`)递归收集嵌套 required 字段的点分路径(如 `content.markdown`),供多 action 场景的参数提示。

这体现了核心设计:**LLM 看到的工具形态是 `tool(action, params)` 两级结构**,而非扁平的 N 个工具,借此把工具数压到 6 个、把 schema token 压到最低。

---

### S13.8 · runtime/router.ts — ToolRouter(一次调用的完整流水线)

`ToolRouter`(`router.ts:24-238`)是 runtime 路径工具调用的统一入口。构造时接收 `RouterConfig { capability? }`。

#### `execute(call: ParsedToolCall, ctx: ToolContext)` 六阶段流水线(`router.ts:39-100`)

1. **spec/action 查表**:从 `TOOL_REGISTRY[call.tool].actions[call.action]` 取;缺失 → `fail("Invalid call ... use parseToolCall() first")`。
2. **参数校验**:`validateParams(call, action)`(`router.ts:244-274`,轻量内联,不依赖 ajv):检查 `required` 字段非空、`enum` 值合法。任一失败 → `fail(...)`。
3. **capability 鉴权**:`#checkCapability(tool, action)`(`router.ts:178-195`):若配置了 `capability`,检查工具在 `allowedTools` 里且 action 在允许列表里;否则 → `fail("Permission denied ...")`。无 capability 配置则全放行。
4. **并发控制**:按 `action.concurrency`(默认 `parallel`)获取锁 —— `exclusive` → `#acquireGlobalLock()`(全局独占),`single` → `#acquireToolLock(tool)`(同工具互斥),`parallel` → 不加锁。
5. **handler 分发**:组装 `handlerCtx = { ...ctx, toolRegistry: TOOL_REGISTRY, commandAllowlist? }`(自动注入注册表引用与 capability 的命令白名单),`await action.handler(call.params, handlerCtx)`。
6. **后处理 + 释放锁**:写回 `_meta.durationMs`;若 `action.maxOutputTokens && result.ok` → `enforceOutputLimit`(见下);`finally` 里释放锁。任何异常被 `catch (err: unknown)` 兜成 `fail("Tool execution error ...")`。

#### 并发锁实现

锁是 Promise-based 的手写互斥(`router.ts:201-237`):`#toolLocks: Map<tool, Promise>` + `#globalLock`。`#acquireToolLock` 用 `while (locks.has(tool)) await locks.get(tool)` 自旋等待,再放一个新 Promise 占位并把 `_release` 挂到 Promise 上;`#releaseToolLock` 删 Map 项并调用 `_release()`。`exclusive` 全局锁同理但用单个 `#globalLock`/`#globalRelease`。这实现了:同工具的 `single` action 串行、全局 `exclusive` action(如 `code.write`)独占整个 router。

#### 其它入口

- `executeParallel(calls, ctx)`(`router.ts:105-116`):并行执行多调用,按 `tokenBudget/calls.length` 均分预算(下限 1000),`Promise.all`。
- **`parseToolCall(name, rawArguments)`**(`router.ts:126-157`):从 LLM 原始 function call 解析。输入 `{ name:"code", arguments:'{"action":"search","params":{...}}' }` → `{ tool, action, params }`。三级校验:JSON.parse → action 存在性 → 返回强类型或 `{ error }`。这是 `ToolRouterAdapter` 入口先调的验证层。
- `getSchemas()`(`router.ts:162-165`):按当前 capability 的 `allowedTools` 生成轻量 schema。
- `getToolSpec(name)`(`router.ts:170-172`):供 `meta.tools` 与 adapter 查 cache 提示。

#### 输出截断 `enforceOutputLimit`(`router.ts:280-298`)

仅对 `string` 类型的 `result.data` 生效:超过 `maxTokens` 时,保留头部 80% + 尾部 15%,中间替换为 `... [N chars truncated, exceeded X token limit] ...`(**保首尾** —— 对应记忆里 A-1 的截断保真设计),并回写 `_meta.tokensEstimate`。

---

### S13.9 · runtime/adapter — ToolRouterAdapter 与 RuntimeCapabilityCatalog

#### ToolRouterAdapter — ToolRouter → ToolRouterContract 桥接

`ToolRouterAdapter implements ToolRouterContract`(`adapter/ToolRouterAdapter.ts:62`)是 kernel 契约层与 runtime 实现层之间的**唯一 concrete 桥**。它职责单一:只处理工具系统核心 LLM 工具,不含 Dashboard/MCP/terminal-sandbox(那些由宿主注入)。

- 构造(`:66-73`):接收 `{ capability?, contextFactory: ToolContextFactoryContract, router? }`,内部持有一个 `ToolRouter` 与 `#contextFactory`。
- **`execute(request: ToolCallRequest)`**(`:75-105`):
  1. `router.parseToolCall(toolId, args)` → 解析失败返回 `#errorEnvelope`。
  2. 查 cache 提示:`getToolSpec(...).actions[action].cache ?? 'none'`,并把 `delta` 归一成 `session`(`cacheHint === 'delta' ? 'session' : cacheHint`,`:88`)——因为信封的 `cachePolicy` 枚举不含 `delta`。
  3. **`ctx = this.#contextFactory.create(request)`**(`:90`)—— 这是 ToolContext 的组装点(见 S13.10)。
  4. `router.execute(parsed, ctx)` → `#toEnvelope`。
  - 全程 `try/catch`,异常兜成 `#errorEnvelope`。
- `executeChildCall`(`:107-111`):目前直接委托 `execute`(子调用与主调用同路径)。
- `explain(request)`(`:113-132`):解析 + spec/action 存在性检查,返回 `ToolDecision`(stage `discover`/`execute`),供 preview/鉴权。
- **`#toEnvelope`**(`:134-164`):把 `ToolResult` 映射成 `ToolResultEnvelope` —— `text` = 成功时 data(字符串直用/否则 `JSON.stringify`)、失败时 error;`status` = ok?success:error;`cache.hit` = `_meta.cached`;`diagnostics` = `diagnosticsFromResult`;`trust` 失败时置 `containsUntrustedText:true`。
- **`diagnosticsFromResult`**(`:52-60`):把 handler 设的 `_meta.degraded`/`fallbackUsed`/`diagnosticWarnings` 抬升到信封诊断。**clean 调用返回共享冻结常量 `EMPTY_DIAGNOSTICS`**(`:27-37`,避免每次分配);注释(`:46-51`)说明 loop 级字段(blockedTools/gateFailures)由 pipeline 直接写进 `DiagnosticsCollector`,单个 `ToolResult` 只知道 degraded/fallbackUsed。

`ToolContextFactoryContract.create(request): ToolContext`(`:21-23`)是 adapter 依赖的**唯一注入缝**;其 concrete 实现不在本 `src/tools` 内,而由 Agent runtime / 宿主组合根提供(见 S13.10)。

#### RuntimeCapabilityCatalog — 从 TOOL_REGISTRY 直生 schema

`RuntimeCapabilityCatalog`(`adapter/RuntimeCapabilityCatalog.ts:19-77`)是一个**更轻的 catalog**,实现 `AgentRuntime.#getToolSchemas()` 期望的 duck-type 接口。它不持 manifest(`getManifest` 恒返 `null`,因为 `ToolRouter` 直接查 `TOOL_REGISTRY`),所有 schema 方法(`toToolSchemas`/`toToolSchemasForModel`/`toMixedSchemas`/`toToolSchemasForActions`/`toMixedSchemasForActions`)都归一到 `generateSchemas`(`:79-89`)→ `generateLightweightSchemas`。model/firstRound 参数对此实现无意义(schema 已足够轻),因此不做懒加载分级 —— 这是与 `UnifiedToolCatalog` 的差异点。`normalizeAllowedTools`(`:91-125`)把"id 数组"或"tool→action 白名单"都归一成 `Record<string, string[]>`,并过滤掉不存在的 tool/action。它维护自己的 `#expandedTools` Set 与 `markExpanded`/`expandedCount`,让 runtime 的懒加载调用语义不报错。

`AgentRuntime.#getToolSchemas`(`agent/runtime/AgentRuntime.ts:1995-2042`)按优先级探测 catalog 能力:`toMixedSchemasForActions` > `toToolSchemasForActions` > `toMixedSchemas` > `toToolSchemasForModel` > `toToolSchemas`,`firstRound` 判据是 `catalog.expandedCount === 0`。工具用过后 `#markToolsExpanded`(`:2044-2054`)回调 `catalog.markExpanded(name)`,推动下一轮从"轻量"升到"完整" schema。

---

### S13.10 · 完整路由链:一次工具调用从 runtime 入口到 handler

把上面各件串成端到端调用链(以 runtime surface 为例):

1. **LLM 产出 function call** → `AgentRuntime` 循环收到 `ToolCall`,交给 `#toolPipeline.execute(fc, ...)`(`AgentRuntime.ts:1352`;pipeline 由 `createToolPipeline()` 在 `:217` 创建)。
2. **ToolExecutionPipeline** 跑 before-middlewares(缓存命中/策略拦截,`ToolExecutionPipeline.ts:332-355`;命中缓存或 blocked 则短路返回),再 `buildRuntimeToolCallRequest(call, context)`(`:376+`)组装 `ToolCallRequest`(surface `'runtime'`、actor `{role:'developer', user: runtime.id}`、source name 由 pipeline 决定)。
3. **`context.runtime.toolRouter.execute(request)`**(`ToolExecutionPipeline.ts:364`)—— `toolRouter` 是注入到 `AgentRuntime` 的 `ToolRouterContract`(`AgentRuntime.ts:184-196`:取自 `config.toolRouter` 或 DI container 的 `'toolRouter'`;缺失则构造抛错,强制走统一 router 路径)。生产装配下它是 `ToolRouterAdapter`。
4. **ToolRouterAdapter.execute**:`parseToolCall` → 查 cache 提示 → **`#contextFactory.create(request)` 组装 `ToolContext`**(注入 `projectRoot`/`tokenBudget`/`abortSignal`/`deltaCache`/`searchCache`/重量服务/`runtime` 元数据)→ `router.execute(parsed, ctx)`。
5. **ToolRouter.execute** 六阶段:查表 → `validateParams` → `#checkCapability` → 并发锁 → `action.handler(params, handlerCtx)` → `enforceOutputLimit`。
6. **handler**(如 `handlers/code.ts` 的 `handle('read', ...)`)执行,消费 `ctx.deltaCache`/`ctx.searchCache` 等,返回 `ToolResult`。
7. **回程**:`ToolRouter` 写 `_meta.durationMs`/截断 → `ToolRouterAdapter.#toEnvelope` 转 `ToolResultEnvelope` → pipeline 的 `recordExecutedEnvelope` 记诊断、`projectPipelineToolResult` 投影 → 回到 `AgentRuntime` 循环,并触发 `#markToolsExpanded`。

> 双路径小结:runtime 快路径用 `ToolRouter` + `ToolContext`(`kernel/registry.ts`);host-surface 稳定路径用 `ToolRouterContract` + `ToolResultEnvelope` + `ToolCallContext`(`kernel/{request,result,context}.ts`)。`ToolRouterAdapter` 是把前者包成后者的转接点,`contextFromToolCall`(`handler.ts`)则是把后者展平给 `InternalToolHandler` 消费的转接点。

---

### S13.11 · runtime/cache — DeltaCache(共享注入承重件)与 SearchCache

#### DeltaCache(156L)— 文件读取增量缓存(长生命周期、跨调用共享)

`DeltaCache`(`cache/DeltaCache.ts:27-105`)是本子系统里**跨工具调用共享状态**的关键件。模块注释(`:1-10`)说明其价值:同会话再读已读文件,内容未变返回 `[unchanged since last read]`(省 ~99.7% token),内容变了返回逐行 diff(省 95-99%),首读写入缓存;LRU 控制内存(默认 200 文件)。

- **`check(path, currentContent): DeltaReadResult`**(`:59-83`)是核心三态判定:
  - 命中且 `hash===currentHash` → `{mode:'unchanged', content:'[unchanged since last read]'}`。
  - 命中但 hash 变 → `computeSimpleDiff(cached.content, current)` 生成 diff,更新缓存,返回 `{mode:'delta'}`。
  - 未命中 → `set(...)` 首次写入,返回 `{mode:'full', content: 全文}`。
- `get`/`set`(`:36-53`)维护 `lastAccess`;`set` 触发 `#evictLRU`(`:94-104`,按 `lastAccess` 升序排,删最旧的到 `maxEntries` 为止)。
- 指纹用 `md5`(`node:crypto createHash('md5')`,`:107-109`)。
- `computeSimpleDiff`(`:115-156`):逐行比较输出 `@@ line N @@` hunk,刻意不用 Myers diff 以减依赖("对 LLM 消费足够")。

**共享注入模型(B-1 承重路径)**:`DeltaCache` 的生命周期由 **组合根/ToolContextFactory** 持有 —— 一个 `DeltaCache` 实例被注入到**每一次 per-call `ToolContext`** 的 `deltaCache` 字段。因此同一个 run 内多次 `code.read`/`code.write` 共享同一份增量缓存与读时指纹基线。据仓库记忆(alembic-agent-cc-scratch-borrow),该长生命周期 `DeltaCache` 由主体 `Alembic/lib/tools/v2/ToolContextFactory.ts` 持有并注入每个 per-call ctx;本 `src/tools` 内只提供 `ToolContextFactoryContract` 接口缝(`ToolRouterAdapter.ts:21`),不含 concrete factory —— 与"宿主注入 context、Agent 不实现 concrete adapter"的边界一致。

**DeltaCache 支撑的 B-1 写前新鲜度门(read-before-write / TOCTOU)**:`handlers/code.ts` 的 write handler 在写盘前调 `checkWriteFreshness(absPath, relPath, ctx)`(`code.ts:799-807, 830-`),复用 `deltaCache` 的指纹做四态判定(注释 `:822-828`):
1. 磁盘存在 ∧ 缓存无指纹(本 run 未读)→ **硬拒** "must read first"(`:848-855`)。
2. 磁盘存在 ∧ 已读 ∧ 当前磁盘指纹 ≠ 读时指纹 → **硬拒** "changed externally"(`:857-859`,CG-3)。
3. 磁盘存在 ∧ 指纹一致 → 准。
4. 磁盘不存在 → 准(新文件,`:838-842` 以磁盘存在性而非缓存记录为准,堵 TOCTOU 洞)。

`deltaCache` 未注入时门**降级透传**(`:844-846`),由 `PROTECTED_PATHS` 兜底,不误拒合法写。写成功后 `ctx.deltaCache?.set(relPath, freshnessFingerprint(content), content)`(`:815`)更新读时指纹为新内容基线。`freshnessFingerprint` 与 `DeltaCache.check()` 内部一致均用 `md5`,注释(`code.ts:768-770`)强制两者算法必须同步。这个门只有在"同一 `DeltaCache` 被读与写两次调用共享"时才成立 —— 直接证明了共享注入模型的承重性。

#### SearchCache — 搜索结果 LRU 缓存

`SearchCache`(`cache/SearchCache.ts:12-57`)是标准 LRU:`Map` 靠"读时 delete+set 到尾部"维护访问顺序,超 `maxEntries`(默认 100)删首键。`makeKey(pattern, glob?, regex?)`(`:21-23`)= `pattern|glob|r/l`。`code.search` handler 用它缓存 `{matches, total}`(`code.ts:83, 100`),同样通过共享 ctx 注入,避免同 run 重复搜同 pattern。

---

### S13.12 · runtime/capabilities — 场景级工具集封装

capabilities 把 6 个内建工具按**使用场景**分组,每组是一个 `RuntimeCapability` 子类,生成 runtime 路径的 `CapabilityDef`(权限白名单 + prompt 片段)。

- **`Capability`**(`capabilities/Capability.ts:1-21`):叶子基类,`name`/`promptFragment` getter 默认抛错(强制子类实现),提供 `tools`/`buildContext`/`onBeforeStep`/`onAfterStep` 钩子。
- **`RuntimeCapability`**(`capabilities/RuntimeCapability.ts:13-39`,abstract):要求子类实现 `description` 与 **`allowedTools: Record<string, string[]>`**(tool→action 白名单)。`tools` = `Object.keys(allowedTools)`;`promptFragment` 由 `generatePromptFragment(allowedTools)`(`:41-61`)从 `TOOL_REGISTRY` 自动生成 `## Available Tools` 列表(每工具列 `action(summary)`);`toDef()`(`:29-38`)产出 `CapabilityDef`(含可选 `commandAllowlist`)。`ToolRouter` 就靠这个 `CapabilityDef.allowedTools` 做鉴权。

八个场景 capability(`capabilities/index.ts`)与其白名单:

| Capability | name | allowedTools 要点 | 特点 |
|-----------|------|-------------------|------|
| `Conversation` | `conversation` | code(读)/knowledge(search,detail,submit)/graph/memory(save,recall)/meta(tools) | 注入 `SOUL.md` + 项目 briefing + 记忆上下文(`buildContext`,`Conversation.ts:70-96`);`onAfterStep` 把工具结果回灌 `memoryCoordinator.cacheToolResult`(`:98-108`) |
| `BootstrapAnalyze` | `code_analysis` | code(读)/terminal/graph/memory(全 4 action)/meta(plan) | 冷启动分析;prompt 强调 `note_finding` 是 QualityGate 硬性步骤(`BootstrapAnalyze.ts:25-47`) |
| `BootstrapProduce` | `knowledge_production` | knowledge(submit)/memory(recall)/meta(review) | 冷启动生产;禁用终端/禁止新代码探索(`BootstrapProduce.ts:42-48`) |
| `ScanAnalyze` | `scan_analyze` | code(search,read,outline)/terminal/knowledge(search)/graph/memory | 增量扫描分析;要求 ≥3 条结构化 finding(`ScanAnalyze.ts:29-34`) |
| `ScanProduce` | `scan_production` | code(read)/knowledge(submit)/memory(recall) | 最窄白名单,无自定义 prompt |
| `Evolution` | `evolution_analysis` | code(读)/terminal/knowledge(search,detail,manage)/graph(query) | 知识进化;**唯一定义 `commandAllowlist`**(`EVOLUTION_READONLY_TERMINAL_ALLOWLIST`,`Evolution.ts:8-30`:git/npm/rg/vitest 等只读命令 + `network:'none'`/`filesystem:'read-only'`);prompt 强调优先 `skip_evolution`、不提交新知识 |
| `System` | `system_interaction` | code(含 write)/terminal/graph(overview)/meta(tools) | 全功能模式,唯一含 `code.write` |

设计要点:capability 是**声明式安全边界** —— 每个场景只暴露它需要的 action,`code.write`/`knowledge.manage`/`terminal.exec` 这类高风险 action 被精确限制在 System/Evolution 等特定场景;`commandAllowlist` 进一步把终端收窄到只读命令白名单(read-mostly + allowlist + 沙箱审计的安全姿态)。

---

### S13.13 · workflow/WorkflowRegistry — 工作流注册表

`WorkflowRegistry`(`workflow/WorkflowRegistry.ts:20-51`)是与工具注册表平行的**工作流**注册表(`Map<id, WorkflowDefinition>`)。`WorkflowDefinition`(`:13-18`)= `{ id, description, parameters?, handler }`,`WorkflowHandler`(`:8-11`)签名 `(params, WorkflowHandlerContext) => Promise<unknown>`,其 `WorkflowHandlerContext`(`:3-6`)持 `toolCallContext` 与可选 `toolRouter`(让 workflow 内部能递归调工具)。`register`/`unregister`/`get`/`has`/`list` 是标准增删查(register 重复 id 抛错,补默认 `parameters:{}`)。它把 kernel 契约(`ToolCallContext`/`ToolRouterContract`)复用到多步工作流编排,是 `CapabilityKind:'workflow'` 的运行时载体。

---

### S13.14 · 设计决策与要点汇总

1. **单契约收敛**:kernel 是取代 V1(`src/tools/core`)+V2(`src/tools/v2/types`)双分裂后的 canonical 单源,所有消费方(runtime/catalog/host adapter)共享同一套词汇(`kernel/index.ts:1-9`)。
2. **两级工具形态压 token**:LLM 看到 `tool(action, params)` 两级结构而非扁平工具;`generateLightweightSchemas` + `UnifiedToolCatalog.toMixedSchemas` 的懒加载三态(首轮完整、用过的完整、没用的轻量)把 30+ 工具集 schema 成本压到 ~20-30%。
3. **契约层零反向依赖**:重量服务在 `ToolContext` 里用 `unknown` + 各 handler 内 duck-type cast,轻量组件用 `*Like` 最小 DI 接口 —— 让 `kernel/registry.ts` 不依赖任何 handler/外部服务(`:92-101`)。
4. **对外脱敏铁律**:`ToolResultEnvelope` 逐字保留以保持字节兼容;`projectToolResultOrdinaryOutput` 用冻结黑名单递归剥离 apiKey/hostCredential/threadId/reasoningContent 等,记录 `redactedFields`,确保对外输出无秘密泄漏。
5. **共享 DeltaCache 是承重件**:一个长生命周期 `DeltaCache` 注入每个 per-call ctx,支撑增量读(省 token)与 B-1 写前新鲜度门(read-before-write / TOCTOU 硬拒),后者仅在读/写两次调用共享同一缓存时才成立。concrete `ToolContextFactory` 由宿主/主体持有,`src/tools` 只暴露接口缝。
6. **声明式安全边界**:capability 的 `allowedTools` 白名单是 runtime 鉴权单元,把 write/exec/manage 高风险 action 精确限制到特定场景;`commandAllowlist` 把终端收窄到只读命令 + `network:none`/`filesystem:read-only` 意图。
7. **并发/降级/截断可观测**:router 用 Promise 手写锁实现 single/exclusive 互斥;`_meta.degraded`/`fallbackUsed` 被 adapter 抬升到信封诊断;`enforceOutputLimit` 保首尾截断(A-1 保真),clean 调用复用冻结的 `EMPTY_DIAGNOSTICS` 常量减分配。
8. **边界纪律**:Dashboard/MCP/terminal-sandbox 由宿主注入,Agent 不提供 concrete adapter;Codex host 路由/插件交付链路属于 Plugin 仓 —— 本子系统只沉淀可被宿主消费的 tool contract 与 adapter 缝。


## S14 · 工具 Handlers · 输出压缩/解析 (src/tools/runtime/handlers, compressor)

本章剖析 AlembicAgent 运行时工具系统的两个"叶子层"：

- **handlers/** —— 6 个具体工具 handler（`code` / `terminal` / `knowledge` / `graph` / `memory` / `meta`）+ 2 个 handler 辅助模块（`terminalSafety` 安全规则、`recipeAuthoringGate` 知识提交门禁）。它们是每个工具 action 真正做事的地方。
- **compressor/** —— 终端输出压缩管线：`OutputCompressor` 主壳 + `strip` 清理工具 + 8 个命令专用 parser（Tree / TestOutput / Package / Lint / GitLog / GitStatus / Grep / GitDiff），把原始 CLI stdout/stderr 转成 LLM 友好的紧凑结构化文本。

这两层都不直接与 LLM 或宿主对话，而是被上游的 `ToolRouter` / `ToolRouterAdapter` 驱动。理解本章前先看清它们在调用链上的位置。

### S14.0 · 调用链与契约上下文（读者先看这一节）

一次工具调用从 LLM 的 function call 到 handler 的完整路径：

1. 宿主/执行循环把一次工具调用封装为 `ToolCallRequest`，交给 `ToolRouterAdapter.execute()`（`src/tools/runtime/adapter/ToolRouterAdapter.ts:75`）。
2. adapter 先用 `router.parseToolCall(toolId, args)`（`src/tools/runtime/router.ts:126`）把 `{ name, arguments }` 解析成强类型 `ParsedToolCall = { tool, action, params }`。
3. adapter 调用 `this.#contextFactory.create(request)`（`ToolRouterAdapter.ts:92`）组装 `ToolContext`。`ToolContextFactory` 由**宿主注入**（boundary manifest `hostOwns: ['ToolContextFactory inputs', 'external executor wiring']`，见 `src/agent/runtime/AgentRuntimeBoundary.ts:85`），负责把 `compressor` / `deltaCache` / `searchCache` / `sandboxExecutor` / `auditSink` / `searchEngine` / `recipeGateway` / `knowledgeRepo` / `projectGraph` / `memoryCoordinator` / `sessionStore` 等 DI 服务塞进上下文。
4. `ToolRouter.execute(call, ctx)`（`router.ts:39`）串起五步：**参数 schema 校验 → capability 权限检查 → 并发锁 → handler 分发 → 输出 token 截断**。
5. handler（本章主角）执行，返回统一的 `ToolResult`。

`ToolResult` 契约（`src/tools/kernel/registry.ts`）：

```ts
interface ToolResult { ok: boolean; data: unknown; error?: string; _meta?: ToolResultMeta; }
```

`_meta` 对 LLM 不可见，供上层消费：`tokensEstimate` / `durationMs` / `cached` / `compression` / `degraded`（降级/部分结果）/ `fallbackUsed`（走了次要路径）/ `diagnosticWarnings`。所有 handler 通过两个工厂函数返回：`ok(data, meta?)`（`registry.ts:300`）与 `fail(error)`（`registry.ts:314`）。`estimateTokens(text) = ceil(len/4)`（`registry.ts:319`）是全仓统一的粗略 token 估算（1 token ≈ 4 字符），压缩预算换算 `maxChars = tokenBudget * 4` 全依赖它。

每个 handler 文件都导出一个统一签名的入口 `handle(action, params, ctx)`，内部按 `action` switch 分发；未知 action 一律 `fail('Unknown <tool> action: ...')`。registry（`src/tools/runtime/registry.ts`）是单一真相源，把每个 action 声明式绑定到 `handle`，并挂上 `cache` / `concurrency` / `risk` / `maxOutputTokens` 元数据。

**元数据轴与 handler 行为的关系（读者需理解）**：

- `concurrency`：`parallel`（默认）/ `single`（同工具互斥）/ `exclusive`（全局独占）。锁在 router 层实现（`router.ts:201-237`），handler 本身无锁逻辑。`code.write`=`exclusive`、`terminal.exec`=`single`、`knowledge.submit/manage`=`single`。
- `risk`：`read-only` / `write` / `side-effect`，仅作声明与展示（`meta.tools` 会显示），不改变执行。
- `maxOutputTokens`：由 router 的 `enforceOutputLimit`（`router.ts:280`）在 handler 返回后**再兜底截断一次**（仅当 `result.data` 是字符串）。这是 handler 内部预算之外的第二道闸。
- `cache`：`none` / `session` / `delta`。注意 adapter 把 `delta` 降级成 `session` 缓存策略（`ToolRouterAdapter.ts:88` `cacheHint === 'delta' ? 'session' : cacheHint`）——delta 语义由 `code.read` handler 自己经 `ctx.deltaCache` 实现，不走 adapter 缓存。

---

### S14.1 · code.ts —— 代码智能工具（1005L）

`src/tools/runtime/handlers/code.ts`。这是 Agent 与项目源码交互的统一入口，暴露 5 个 action：`search` / `read` / `outline` / `structure` / `write`。引擎组合：ripgrep（搜索）、Tree-sitter via `AstAnalyzer`（骨架）、`node:fs`（读写）。入口 `handle`（`code.ts:22`）按 action 分发。

#### code.search —— ripgrep 批量搜索（`code.ts:54`）

- **参数**：`patterns[]`（或单 `pattern`；最多 10 个，超出 `fail`），`glob`、`maxResults`（默认 10，上限 50）、`contextLines`（默认 2）、`regex`（默认 false）。
- **权限/元数据**：`cache: session`、`concurrency: parallel`、`risk: read-only`、`maxOutputTokens: 3000`。
- **控制流**：逐 pattern 循环 → 先查 `ctx.searchCache`（key = `pattern|glob|r|l`，`code.ts:82`）→ 命中直接用；未命中调 `ripgrepSearch`（`code.ts:150`）并写回缓存。每轮开头检查 `ctx.abortSignal?.aborted`，命中即 break（**取消路径**）。
- **ripgrep 调用细节**（`spawnRg`，`code.ts:186`）：`spawn('rg', ...)` 而非 exec，关键是 `stdio: ['ignore', 'pipe', 'pipe']` 关闭 stdin —— 注释明确记录：ripgrep 检测到 stdin 可读会从 stdin 读取而非搜索目录导致永久挂起（GitHub issue 2056）。用 `--json` 输出，`RG_EXCLUDE_GLOBS`（`code.ts:132`）排除 `node_modules/.git/dist/DerivedData/Pods` 等噪音目录，非 regex 模式加 `--fixed-strings`。15s 超时用 `setTimeout` + `SIGTERM`，`MAX_BUFFER = 2MB` 溢出后丢弃后续 chunk。
- **退出码语义**（`code.ts:213`）：0 或 2 = 解析 JSON；1 = 无匹配（返回空）；其它 = 超时被杀或错误，**有部分输出则返回部分，否则 reject**（部分结果路径）。
- **降级路径**（`fallbackRegexSearch`，`code.ts:267`）：ripgrep spawn 失败（二进制缺失等）时，catch 里走**进程内正则扫描**，`collectFiles` 递归遍历（跳过 `IGNORED_DIRS`、`.` 开头文件、上限 5000 文件），并把 `fellBack` 置 true → 结果 `_meta.fallbackUsed = true`（`code.ts:122`）。这是本 handler 最重要的降级契约。
- **收尾**：`deduplicateMatches`（按 `file:line` 去重，`code.ts:307`）→ `slice(maxResults)` → `formatSearchOutput`（`code.ts:319`，`N matches (showing M)\n\n file:line: content`）。

#### code.read —— 自适应读取（`code.ts:330`）

- **参数**：`path`（单文件）**或** `filePaths[]`（批量，最多 5，二者互斥），`startLine` / `endLine` / `maxLines`。
- **元数据**：`cache: delta`、`concurrency: parallel`、`risk: read-only`、`maxOutputTokens: 5000`。
- **单文件读取策略**（`readSingleFile`，`code.ts:434`）是本 action 的核心状态机，按优先级选择返回 mode：
  1. **路径安全**：`resolveProjectFilePath`（`code.ts:933`）→ `isPathInsideProject`（`code.ts:948`，`path.relative` 不以 `..` 开头且非绝对），越界 `fail('Access denied: path is outside project root')`。
  2. **delta 缓存命中**（`ctx.deltaCache.check`，`code.ts:459`）：`mode: 'unchanged'` → 返回 `[unchanged since last read]`，`tokensEstimate: 5`（省 99.7% token）；`mode: 'delta'` 且无 line 参数 → 返回增量 diff。
  3. **显式范围**（有 `startLine/endLine/maxLines`，`code.ts:483`）：返回 `行号|内容` 编号切片；`maxLines` 且未到 `endLine` 时追加 `... [N lines omitted; use startLine/endLine for more]`。
  4. **小文件**（≤500 行，`code.ts:508`）：返回全文带行号，`mode: 'full'`。
  5. **大文件**（>500 行，`code.ts:520`）：`generateOutlineForRead` 生成 AST 骨架（`mode: 'outline'`）；AST 不可用则**头 30 尾 15 行预览**（`code.ts:546`）。
- **批量读取**（`handleBatchRead`，`code.ts:376`）：`maxOutputTokens = clamp(ctx.tokenBudget, 1000, 5000)`，`perFileTokenBudget = max(200, (budget-250)/N)`。逐文件读，超预算走 `clampReadResult`（`code.ts:953`，头 80% + `... [N chars truncated] ...` + 尾 15%）。返回 `{ mode:'batch', files, summary }`，`summary.partialFailure` 标记**部分成功**；全失败时 `ok:false` 但仍带 data（部分结果契约）。每文件前检查 `abortSignal` → `'Read aborted'`。

#### code.outline —— Tree-sitter 骨架（`code.ts:577`）

- **参数**：`path`（必填）、`kinds[]`、`maxDepth`（schema 声明但 handler 未消费，见下"注意点"）。`cache: session`、`maxOutputTokens: 2000`。
- 经 `buildAstOutline`（`code.ts:611`）调用 `ctx.astAnalyzer.analyzeFile`（duck-typed，真实实现来自 `lib/core/AstAnalyzer.ts`）。输出每个 definition 一行：`{indent}{signature} [startLine-endLine]`，缩进按 `def.depth`。AST 不可用或无 definition 返回 null → outline action 报 `Cannot generate outline ... AST analyzer not available`。
- **注意点**：registry 声明的 `kinds` / `maxDepth` 过滤参数在 handler 中未使用（`buildAstOutline` 直接输出全部 definition）；这是 schema 与实现之间的一处已存在缺口，读者不应假设 outline 会按 kinds 过滤。

#### code.structure —— 目录树（`code.ts:666`）

- **参数**：`directory`（默认 `.`）、`depth`（默认 3，上限 5）。`cache: session`、`maxOutputTokens: 2000`。
- `buildDirectoryTree`（`code.ts:710`）递归 `fs.readdir`，跳过 `IGNORED_DIRS`（`code.ts:686`，比搜索多了 `.idea/.vscode/Packages/.swiftpm`）与 `.` 开头（保留 `.env.example`）。目录优先、字母排序，输出缩进 ASCII 树。路径越界 `fail`。

#### code.write —— 写文件 + 写前新鲜度门（`code.ts:779`）

这是全 handler 里安全语义最重的 action。`concurrency: exclusive`（全局独占）、`risk: write`。

- **参数**：`path`、`content`（必填）、`createDirectories`（默认 false）。
- **两道防护**：
  1. `PROTECTED_PATHS = ['.git', 'node_modules', '.env']`（`code.ts:766`）—— 命中前缀直接 `Write denied: ... protected path`。
  2. **B-1 写前新鲜度门 / read-before-write TOCTOU**（`checkWriteFreshness`，`code.ts:830`）：四态机，是本仓库一个专门 landing 的硬门（memory `wakeflow-cc-scratch-borrow` P3）：
     - 态4：磁盘不存在（ENOENT）→ **准**（新文件）。关键设计：判定 key 在"写时磁盘是否存在"而非"cache 有无记录"——否则磁盘已存在但本 run 未读的文件会被当新文件放行，重开 TOCTOU 洞（注释 `code.ts:799-807`）。
     - `ctx.deltaCache` 未注入 → **透传**（门降级，不误拒合法写，由 PROTECTED_PATHS 兜底）。
     - 态1：磁盘存在 ∧ 本 run 未读（cache 无记录）→ **硬拒** `exists on disk but was not read in this run`。
     - 态2：磁盘存在 ∧ 已读 ∧ 当前磁盘指纹 ≠ 读时指纹 → **硬拒** `changed externally since last read`（CG-3，不静默覆盖、不仅记日志）。
     - 态3：指纹一致 → **准**。
  - 指纹用 `freshnessFingerprint = createHash('md5')`（`code.ts:771`），注释强调必须与 `DeltaCache` 内部算法一致（DeltaCache 亦用 md5，见 `src/tools/runtime/cache/DeltaCache.ts`），使"写时磁盘内容"与"读时缓存指纹"可比。
  - 拒绝文案统一走 `REREAD_GUIDANCE`（`code.ts:776`），注释注明"稳定可被验收 harness grep，不得随意改写"。
- 写成功后 `ctx.deltaCache?.set(relPath, fingerprint(content), content)`（`code.ts:815`），把新内容设为后续 read/write 的一致基线。

---

### S14.2 · terminal.ts + terminalSafety.ts —— 沙箱终端执行（368L + 349L）

#### terminal.exec 执行流（`src/tools/runtime/handlers/terminal.ts`）

唯一 action `exec`，`concurrency: single`、`risk: side-effect`、`maxOutputTokens: 4000`。`handleExec`（`terminal.ts:43`）的完整 pipeline：

1. **审计闭包 `finish`**（`terminal.ts:48`）：任何返回路径都经它落审计。`commandHash = sha256(command)`（`terminal.ts:347`，只记哈希不记明文），经 `recordTerminalAudit` → `ctx.auditSink.log(entry)`。审计失败被吞（`terminal.ts:340`：`Audit failures must not alter the terminal tool result`）。审计 entry（`buildTerminalAuditEntry`，`terminal.ts:312`）记 actor / action / result / duration / commandHash / surface。
2. **空命令**：`fail('terminal.exec requires command')`。
3. **cwd 校验**（`resolveTerminalCwd`，`terminal.ts:237`）：requested cwd（相对则 join projectRoot，绝对则原样 resolve）；`path.relative(root, cwd)` 以 `..` 开头或绝对 → `cwd must be within project root`。
4. **timeout**：`min(params.timeout || 30000, 120000)`。
5. **安全检查**（`checkTerminalCommandSafety`，见下）—— 不安全 `Command blocked: <reason> (<rule>)`。
6. **allowlist 检查**（仅当 `ctx.commandAllowlist` 存在）—— 不通过 `Command blocked by allowlist: ...`。
7. **执行**（`execInSandboxOrDirect`，`terminal.ts:154`）。
8. **压缩**（`compressOutput`，`terminal.ts:351`）+ **exit code 归类**。

**沙箱 vs 降级**（`execInSandboxOrDirect`，`terminal.ts:154`）：

- 优先 `ctx.sandboxExecutor.exec(cmd, { cwd, projectRoot, timeout, signal })`（Seatbelt 沙箱，macOS）。诊断 `{ sandboxed: true, fallbackUsed: false }`。
- 未注入（测试/非 macOS）→ **plain exec 降级**：`execAsync`（promisify exec），`maxBuffer: 1MB`，`env: { TERM: 'dumb', NO_COLOR: '1' }`，诊断 `{ sandboxed: false, fallbackUsed: true, degradeReason: 'missing_sandbox_executor' }`（`SANDBOX_FALLBACK_REASON`，`terminal.ts:30`）。
- 降级 catch 里：`e.killed || abortSignal.aborted` → `exitCode: 137`（SIGKILL/timeout）；否则 `e.code ?? 1`。

**exit code 语义与部分结果**（`terminal.ts:104`）：

- `137`（超时/中止）→ 输出标记 `[timeout] partial output:` + stripAnsi 的 stdout，`_meta.degraded = true`，审计 `'failure'`。**部分结果契约**。
- `0` → 压缩输出；非 0 → `[exit N]\n<compressed>`，审计 `'failure'`。
- 异常兜底（`terminal.ts:140`）→ `[exit 1]\n<msg>`。

**降级可观测性**：`withTerminalDiagnostics`（`terminal.ts:274`）在非沙箱/降级时把 `[unsandboxed:<reason>] sandboxed=.. fallbackUsed=.. degradeReason=..` 拼到输出文本尾部；`terminalMeta`（`terminal.ts:253`）在 `_meta` 挂 `diagnosticWarnings: [{ code:'terminal_sandbox_fallback', ... }]`。这满足仓库规则"每个降级/fallback 必须打印可诊断信息"。

**压缩**（`compressOutput`，`terminal.ts:351`）：有 `ctx.compressor` → `compressor.compress(raw, { command, tokenBudget: ctx.tokenBudget || 4000 })`；压缩器抛错则回退 `stripAnsi(raw)`；无压缩器直接 `stripAnsi`。`combineOutput`（`terminal.ts:226`）把 stdout / `[stderr]\n...` 拼接，空则 `[no output]`。

#### terminalSafety.ts —— 安全规则讲透（`src/tools/runtime/handlers/terminalSafety.ts`）

安全模型分两层，二者独立且都需通过。

**第一层：全局危险负载黑名单（`checkTerminalCommandSafety`，`terminalSafety.ts:89`）** —— 无论有无 allowlist 都执行。

- `detectDangerousShellPayload`（`terminalSafety.ts:45`）：6 条正则规则，命中任一即 block：
  - `shell-privilege-escalation`：`sudo` / `su`（词边界匹配）。
  - `shell-destructive-bin`：`dd|mkfs|shutdown|reboot|halt|passwd|killall`。
  - `shell-rm-recursive-force`：`rm -rf` / `rm -fr`（字符类容忍 `-Rf` 等混合标志）。
  - `shell-remote-shell-pipe`：`curl|wget ... | sh/bash/zsh/fish`（远程内容管道进 shell）。
  - `shell-eval`：`eval `。
  - `shell-fork-bomb`：`: () {` 形状。
- **子串/首词黑名单**：`DENIED_BINS`（`terminalSafety.ts:3`）= `sudo/su/shutdown/reboot/halt/mkfs/dd/passwd/killall`。取 `firstShellWord`（`terminalSafety.ts:168`，手写引号感知扫描器，遇空白/`;&|<>()` 停）→ `path.basename().toLowerCase()` 命中即 `shell-denied-bin`。

**第二层：只读 allowlist（`checkTerminalCommandAllowlist`，`terminalSafety.ts:112`）** —— 仅当宿主注入了 `commandAllowlist.bins`（经 router 从 `capability.commandAllowlist` 传入，`router.ts:71`）。这一层的目的：把 terminal 收窄为"只读取证据"用途。

1. **shell meta 禁止**（`containsShellMeta`，`terminalSafety.ts:164`）：命中 `; & | < > \` 或 `$(` → `allowlist-shell-meta`。杜绝管道/重定向/命令替换绕过。
2. **可解析性**（`parseSimpleShellWords`，`terminalSafety.ts:196`）：手写引号 + 反斜杠转义的词法分析；未闭合引号/悬空转义 → `allowlist-unparseable-command`。
3. **bin allowlist**：首词 basename 必须在 `bins` 集合内，否则 `allowlist-denied-bin`。
4. **写类参数黑名单**（`findWriteLikeArg`，`terminalSafety.ts:247`）：`WRITE_LIKE_ARGS`（`terminalSafety.ts:32`）= `--fix/--write/-i/--in-place/-u/--update/--updatesnapshot/-delete/-exec` 等，或 `--output=` / `--write=` 前缀 → `allowlist-write-like-arg`。
5. **只读子命令白名单**（`checkReadonlySubcommand`，`terminalSafety.ts:260`）按 bin 分派：
   - `git`：仅 `log/blame/diff/status/show/rev-parse/ls-files`（`READONLY_GIT_SUBCOMMANDS`，`terminalSafety.ts:20`），否则 `allowlist-git-subcommand`。
   - `npm/pnpm/yarn`：只允许 `test`、或 `run <script>` 且 script ∈ `{test,lint,build:check,typecheck}` 或 `test:*` 或 `lint:*`（且不含 `fix`）。
   - `tsc`：必须含 `--noEmit`。
   - `node`：禁 `-e/--eval/-p/--print`，仅允许 `--test`。
   - `biome`：仅 `check` / `ci`。
   - `vitest`：必须 `run` 模式（`run` 或 `--run` 或无参）。
   - 其它 bin：默认放行（已过 bin allowlist）。

设计要点：第一层是硬安全（破坏性/提权/远程执行），第二层是"read-mostly 证据采集"策略，二者叠加实现"沙箱内也只跑只读证据命令"。安全裁决全部返回 `{ safe:false, block:{ rule, reason } }`，`rule` 是稳定可 grep 的分类码，供审计与验收使用。

---

### S14.3 · knowledge.ts —— 知识提交/查询（726L）

`src/tools/runtime/handlers/knowledge.ts`。Agent 与 Alembic 知识库交互入口，4 个 action：`search` / `submit` / `detail` / `manage`。后端全部 duck-typed 经 DI 注入（`SearchEngineLike` / `RecipeGatewayLike` / `KnowledgeRepoLike` / `EvolutionGatewayLike`），真实实现在 Core / 宿主侧。

#### knowledge.search（`knowledge.ts:51`）

`cache: session`、`risk: read-only`。参数 `query`（必填）、`kind`（`recipe/candidate/all`，默认 all）、`limit`（默认 10，上限 50）、`category`。经 `ctx.searchEngine.search`（BM25 + 可选向量）返回 items，`preview` 用 `truncateText(content, 500)`（`knowledge.ts:721`）。无引擎 `fail('Search engine not available')`。

#### knowledge.submit —— 知识候选提交（`knowledge.ts:96`）

`concurrency: single`、`risk: write`。这是本 handler 里最重的路径，也是与 `@alembic/core` 契约耦合最深处。

- **必填字段（`validateSubmitParams`，`knowledge.ts:302`）** 廉价 fast-fail：`title`(3-200) / `description`(≥10) / `content.markdown`(≥200) / `content.rationale`(≥50) / `kind`∈`{rule,pattern,fact}` / `trigger`(≥3) / `whenClause`(≥10) / `doClause`(≥10) / `reasoning.sources` 非空数组。
- **归一化装配**（`knowledge.ts:110-177`）：从 `ctx.runtime.dimensionMeta` 判定是否 bootstrap（冷启动）；解析 `effectiveDimensionId` / `knowledgeType`（bootstrap 时取 dimMeta 的 `allowedKnowledgeTypes[0]`）/ `category`（默认 Utility）/ `language`（默认 markdown）；`title` 经 `stripProjectNamePrefix`（`knowledge.ts:268`，去掉"项目名 的/—/-"前缀）；`source` = bootstrap 时 `'bootstrap'` 否则 `AGENT_RUNTIME_SOURCE = 'alembic-agent'`。
- **sourceRefs 设计决策**（`knowledge.ts:121-129` 注释，读者重点）：sourceRefs 只记录最终候选显式携带的真实引用，**不做过程分类、强修复或指标拆分**。注释明确记录历史教训——此前 AI 把 sourceRef 错误设计成多轮分类/strict gate/N11 scorecard，导致 20-30 轮资源浪费；后续若想恢复必须先停下由用户确认。
- **权威门禁（CG-4 关键集成点，`knowledge.ts:186`）**：在 `gateway.create`（Core stage-3）之前，先跑 `runInProcessRecipeAuthoringGate(item, { projectRoot, dimensionId })`。命中违规 → `fail('Validation failed: ' + formatRecipeAuthoringViolations(...))`。详见 S14.6。
- **Core gateway 调用**（`gateway.create`，`knowledge.ts:194`）：传 dedup 上下文（`existingTitles/existingTriggers/existingFingerprints` 来自 `ctx.runtime.submitted*`），bootstrap 时传 `systemInjectedFields`（`getSystemInjectedFields()` from Core）和 `bootstrapDedup`。
- **结果四分支**（`knowledge.ts:208-252`）：`created` → 存 sessionStore（tag `submission`）并返回 `{ status:'created', id, title }`；`duplicates` → `duplicate_blocked` + 相似候选；`rejected` → `fail` 拼 reason/errors/warnings；`blocked`（consolidation 阻塞）→ `fail`。

#### knowledge.detail（`knowledge.ts:359`）

`risk: read-only`。参数 `id`，经 `ctx.knowledgeRepo.getById` 取全量 recipe JSON。未找到 `fail`。

#### knowledge.manage —— 生命周期操作（`knowledge.ts:455`）

`concurrency: single`、`risk: write`。`VALID_OPERATIONS`（`knowledge.ts:401`）= `approve/reject/publish/deprecate/update/score/validate/evolve/skip_evolution`。

- **进化类分支**（`evolve/deprecate/skip_evolution`，`handleEvolutionManage`，`knowledge.ts:521`）：走 `ctx.evolutionGateway.submit`。operation 映射 action：`evolve→update`、`deprecate→deprecate`、`skip_evolution→valid`（`knowledge.ts:546`）。confidence 默认 deprecate 0.7 / 其它 0.9。`source` 经 `resolveEvolutionSource`（`knowledge.ts:581`）从 `ctx.runtime.sharedState.evolutionProposalSource` 解析（校验属于 `EVOLUTION_SOURCES` 白名单，否则回落 `alembic-agent`）。证据经 `buildEvolutionEvidence` + `collectInlineEvidence`（`knowledge.ts:611/638`，抽取 `type/sourceStatus/currentCode/newLocation/suggestedChanges/confidence`）。`evolutionStatus`（`knowledge.ts:598`）把 gateway outcome 映射成人读状态（如 `immediately-executed→deprecated`、`proposal-upgraded→evolution_proposal_upgraded`）。
- **仓库类分支**（`approve/reject/publish/update/score/validate`）：直接调 `ctx.knowledgeRepo` 对应方法。`update` 缺 data 报错；`score` 取 `data.score`。

---

### S14.4 · graph.ts / memory.ts / meta.ts

#### graph.ts —— ProjectContext 代码图谱查询（`src/tools/runtime/handlers/graph.ts`）

2 个 action，均 `cache: session`、`risk: read-only`。统一了旧系统 7 个 AST 工具（注释 `graph.ts:7`）。

- `overview`（`graph.ts:38`）：`ctx.projectGraph.getOverview()` → `formatOverview`（`graph.ts:57`，languages/totalFiles/totalDefinitions/summary/modules）。空图返回 `Project graph is empty or not built yet`。
- `query`（`graph.ts:94`）：`type` ∈ `VALID_QUERY_TYPES`（`graph.ts:82`）= `class/protocol/hierarchy/callers/callees/overrides/extensions/impact/search`；大部分需 `entity`，`limit` 默认 20 上限 100。双后端回退设计（`graph.ts:103`）：优先 `ctx.projectGraph` 的专用方法，回退 `ctx.codeEntityGraph`（如 `callers` = `graph?.getCallers ?? entityGraph?.queryCallGraph`；`impact/search` 主要走 entityGraph）。两个后端都不存在 → `fail`。结果 undefined/null → `{ message:'No results found' }`。

#### memory.ts —— Agent 工作记忆（`src/tools/runtime/handlers/memory.ts`）

4 个 action，跨轮次记录与召回。

- `save`（`memory.ts:36`，`risk: write`）：`ctx.sessionStore.save(key, content, { tags, category })`。
- `recall`（`memory.ts:171`，`risk: read-only`）：`ctx.sessionStore.recall(query, { tags, limit })`，格式化 `[key] content`。
- `note_finding`（`memory.ts:69`，`risk: write`）：桥接 `ctx.memoryCoordinator.noteFinding(finding, evidence, importance, round, scopeId)`，把结构化关键发现写入 `ActiveContext.#scratchpad`，供 QualityGate 经 `distill().keyFindings` 评 evidenceScore（注释 `memory.ts:64`）。`importance` clamp 1-10。`scopeId` 取 `ctx.runtime.dimensionScopeId`。`normalizeNoteFindingResult`（`memory.ts:103`）容忍 coordinator 返回字符串（以 `⚠` 开头判 error）。只有 `recorded && target==='activeContext'` 才 `ok`，否则 `fail(result.message)`。
- `get_previous_evidence`（`memory.ts:125`，`risk: read-only`）：桥接 `ctx.memoryCoordinator.searchEvidence(query, dimId)`，检索前序维度证据避免跨维度重复搜索。无 coordinator 或无结果时**返回 `ok`（count:0 + 建议自行搜索）而非 fail**——这是刻意的"软失败"（缺失前序证据不是错误）。命中时格式化中文摘要，最多 8 条 + "还有 N 条"。

#### meta.ts —— Agent 元工具（`src/tools/runtime/handlers/meta.ts`）

3 个 action，Agent 自省/规划/自检。

- `tools`（`meta.ts:37`，`risk: read-only`）：无 `name` → 列所有工具一行摘要；有 `name` → 展开该工具全部 action 的参数 schema（含必填 `*` 标记、enum 值、risk 等级）。数据源是 `ctx.toolRegistry`（由 router 在 `handlerCtx` 注入 `TOOL_REGISTRY`，`router.ts:70`）。这是"按需 schema"策略的实现——首轮只发轻量 schema，Agent 需要细节时主动查 `meta.tools`。
- `plan`（`meta.ts:82`，`risk: write`）：纯记录，把 `{ steps, strategy }` 存 sessionStore（tag `plan`），不执行任何操作，只让 Agent 结构化思考。
- `review`（`meta.ts:101`，`risk: read-only`）：从 sessionStore 拉 tag `submission` 的提交历史，汇总统计 + 给出建议（<3 条建议多提交）。

---

### S14.5 · compressor —— 输出压缩管线

`src/tools/runtime/compressor/`。职责：把 `terminal.exec` 的原始 stdout/stderr 转成 LLM 友好的紧凑结构化文本。只被 `terminal.ts` 的 `compressOutput` 消费（经 `ctx.compressor`，宿主注入的 `OutputCompressorLike`）。

#### OutputCompressor（`compressor/OutputCompressor.ts`）

管线（注释 `OutputCompressor.ts:7`）：**ANSI strip → 重复行折叠 → 专用解析器 / 通用截断**。

- **延迟加载解析器**（`ensureParsers`，`OutputCompressor.ts:28`）：首次 `compress` 时 `Promise.allSettled` 动态 import 8 个 parser 模块（避免启动全量 import），幂等。`PARSER_PATTERNS`（`OutputCompressor.ts:45`）是命令正则 → parser 名 → 模块索引的三元组表：
  - `^git status` → git-status；`^git diff` → git-diff；`^git log` → git-log
  - `^(vitest|jest|mocha|pytest|npm test|...)` → test-output
  - `^(eslint|biome|tsc|npx tsc)` → lint-output
  - `^(rg|grep|ag|ack)` → grep；`^(ls|find|tree)` → tree
  - `^(npm|pnpm|yarn|bun) (install|add|remove|update)` → package
  - 某个 parser 模块 import 失败（`status !== 'fulfilled'`）则跳过该 parser（**降级容错**：坏一个不影响其它）。
- **compress**（`OutputCompressor.ts:76`）：`cleaned = cleanOutput(raw)`（strip+collapse）→ `maxChars = (tokenBudget||4000)*4` → 按命令匹配第一个 parser：parser 返回非 null 则用（超 maxChars 走 `truncateOutput`），返回 null 或抛错则 `break` 走通用截断。无匹配 parser 时直接对 cleaned 做 `truncateOutput`。
- **compressSync**（`OutputCompressor.ts:115`）：同逻辑同步版，假设解析器已加载（parser 抛错时 `break` 到通用截断）。

#### strip.ts —— 清理工具（`compressor/strip.ts`）

- `stripAnsi`（`strip.ts:12`）：`ANSI_RE`（`strip.ts:9`）去 ANSI 控制字符。
- `collapseRepeats`（`strip.ts:20`）：连续重复行 ≥ threshold(默认3) 折叠为 `(repeated N times)`（注释：省 10-30% token）。
- `truncateOutput`（`strip.ts:58`）：通用截断 = head 40% + `... (N lines omitted) ...` + tail 10%，按整行边界累积不切断行。
- `cleanOutput`（`strip.ts:97`）：`collapseRepeats(stripAnsi(text))`。

#### 8 个 parser（`compressor/parsers/*`）

所有 parser 统一契约：导出 `parse(raw): string | null`，**解析成功返回紧凑文本，失败/无法识别返回 null**（触发 compressor 回退通用截断），并用 try/catch 兜底吞异常返回 null。`index.ts` 以 `parse<X>Output` 别名重导出全部 8 个。

| Parser | 文件 | 识别与产出 |
|---|---|---|
| **GitStatusParser** | `GitStatusParser.ts` | 先试 porcelain（`PORCELAIN_RE` 双字符状态码 `:6`，按 index/worktree 位分 staged/modified/untracked/deleted/renamed），失败试 human-readable（按 `Changes to be committed` 等段头）。输出 `staged(N): a, b\nmodified(N): ...` |
| **GitDiffParser** | `GitDiffParser.ts` | 逐 `diff --git` 头解析每文件 +/- 行数与前 5 个 hunk 上下文（`:38`）；无内容则退回 `--stat` 汇总行。输出 `N files changed, +X/-Y lines` + 每文件 `file: +a/-b` |
| **GitLogParser** | `GitLogParser.ts` | 支持完整格式（`commit/Author:/Date:` 多行状态机 `parseFullFormat:24`）与 oneline / 自定义 `<hash> <date> <author>: <msg>` 格式；上限 `MAX_ENTRIES=20`。hash 截 7 位 |
| **TestOutputParser** | `TestOutputParser.ts` | 依次试 vitest / jest / pytest / mocha 汇总正则（`:19-31`），`extractFailures`（`:38`）用两组失败块正则去重抽取失败名 + 前 3 行详情。输出 `Tests: P passed, F failed, T total` + `[failures]` |
| **LintOutputParser** | `LintOutputParser.ts` | 试 eslint / tsc / biome（各自行正则 `:21-28`），`MAX_ISSUES=10`。输出 `E errors, W warnings` + `Top issues:` 每条 `file:line: message` |
| **GrepParser** | `GrepParser.ts` | 先试 rg `--json`（`tryJsonFormat:16`，逐行 JSON 抽 match），失败试 plain `file:line:content`（`GREP_LINE_RE:8`）。`dedup` 按 `file:line`，`MAX_MATCHES=30`。输出 `N matches in M files (showing K)` |
| **TreeParser** | `TreeParser.ts` | 三形态：`tryTreeCommand`（`│├└` 前缀缩进推深度 `:66`）、`tryLsR`（`dir:` 段头 `:131`）、`tryFindOutput`（斜杠路径 `:100`）。共用 `TreeNode` map 结构 + `IGNORED_DIRS` 过滤 + `renderTree` 缩进渲染 |
| **PackageParser** | `PackageParser.ts` | 试 npm（`added/removed/changed N packages` + audit）/ pnpm（`Packages: +N` / deprecated）/ yarn（`Done in` / `Fetched N`）。`warnings` 上限 10。输出 `added N packages, removed M, W warnings` + `Warnings:` |

parser 共性设计：均只做**有损摘要**（保计数 + top-N 关键条目），丢弃进度条/时间戳/装饰性行；上限常量（MAX_ENTRIES/MAX_ISSUES/MAX_MATCHES）硬编码防止摘要本身爆预算；识别用锚点正则而非严格语法，对多工具变体宽松匹配。

---

### S14.6 · recipeAuthoringGate.ts —— in-process 知识提交门禁（跨仓契约）

`src/tools/runtime/handlers/recipeAuthoringGate.ts`。它不是 registry 里的 action，而是 `knowledge.submit` 内部的前置权威门禁。承载 P1.4b「in-process flatten (CG-4)」：把 AlembicAgent 的 in-process 知识提交接到与 host-agent 路径**同一套** Core 权威门禁（`@alembic/core/knowledge` 的 `validateAgainst` + `renderGuidance`）。

- **两路打平语义**（注释 `recipeAuthoringGate.ts:9`）：host-agent 路径（AlembicPlugin tool-router）此前已接 `validateAgainst`；in-process 路径此前只跑 length-only 的 `validateSubmitParams` + Core stage-3，stage-1/stage-2 从不执行（CG-4 gap）。本模块补齐。
- **profile 轴**（`recipeAuthoringGate.ts:16`）：
  - `cold-start`：完整门禁，逐字节等同 host-agent 冷启动（含 **3-distinct-files 证据下限** + session-scope），是携带 bootstrap dimension 的提交所走档位。
  - `opportunistic`：运行期机会式 in-process AI 开发（无 session/无 dimension），保留全部内容门禁（verb 白名单、✅❌ 对比、markdown 下限）+ 廉价来源接地，仅关闭 3-file 下限与 session-scope，**不是对 cold-start 的放松**。
- **端口注入设计（§C.11）**：Core domain spec 保持纯（零 `node:fs`/`node:path`），把运行时耦合留给宿主注入。本模块提供 `createInProcessSourceRefResolver`（`recipeAuthoringGate.ts:45`）——用 `node:fs`/`node:path` 逐字节复刻 host 侧 `createSourceRefResolver` 的分支与文案，保证同一 `path:line` 引用在 in-process 与 host 得到**一致裁决**（同样的 `SOURCE_REF_INVALID` / `SOURCE_REF_NOT_FOUND` / `SOURCE_REF_LINE_OUT_OF_RANGE` 或同样的 `{ rangeText, sourcePath }`）。`isInsideRoot`（`recipeAuthoringGate.ts:123`）防路径逃逸。**注意**：in-process 不注入 sessionScope（决策：session-scope 留 host 侧前置）。
- **入口**（`runInProcessRecipeAuthoringGate`，`recipeAuthoringGate.ts:137`）：`resolveAuthoringProfile` 从上下文解析档位（有 dimensionId → cold-start，否则 opportunistic）→ `validateAgainst([item], { stage:'all', path:'in-process', profile, sourceRefResolver, projectRoot, dimensionId })`。`stage:'all'` 含 stage-3，与 gateway 内 Core stage-3 同源，结论一致只是更早短路。
- **格式化**（`formatRecipeAuthoringViolations`，`recipeAuthoringGate.ts:159`）：保留 `code (locator): message nextAction`，便于 in-process Producer 直接据此修复而非反猜门禁。

设计决策：门禁规则本身（谓词/阈值/文案）全在 Core 权威 spec，本仓库**不二次实现**，只承载宿主运行时端口与编排——保证"agent 看到什么门槛"变了，但门禁输出字节不变（memory `alembic-recipe-authoring-guidance-optimization`）。

---

### S14.7 · 贯穿全章的设计模式与要点

1. **统一 handler 契约**：`handle(action, params, ctx)` + `ok`/`fail` + `_meta`。所有非确定性依赖经 `ToolContext` DI 注入并用 `*Like` duck-typed 接口 cast（重量级服务 `unknown` 是刻意的，避免 registry 反依赖 handler/Core），可选注入不存在时优雅 `fail` 或降级。
2. **声明式 registry + router 编排**：cache/concurrency/risk/maxOutputTokens 元数据集中在 registry，行为（锁、schema 校验、输出截断）在 router，handler 只管业务——关注点分离。
3. **多层 token 预算防护**：handler 内部预算（clampReadResult/perFileTokenBudget）→ compressor（parser + truncateOutput）→ router `enforceOutputLimit` 兜底。三道闸都用 `estimateTokens`（4 字符/token）与 head/tail 保留策略。
4. **降级/部分结果全程可观测**：ripgrep→regex fallback、sandbox→plain exec、compressor→stripAnsi、parser→通用截断，每处都置 `_meta.fallbackUsed`/`degraded` 或在文本尾拼诊断串，符合仓库"每个分叉必须可诊断"硬规则。
5. **取消/超时一等公民**：`ctx.abortSignal` 在 search 循环、batch read、sandbox exec 处检查；terminal 137 退出码是 SIGKILL/timeout 的部分结果契约。
6. **安全纵深**：`code.write` 的 PROTECTED_PATHS + 四态 TOCTOU 新鲜度门；`terminal` 的两层安全（全局危险黑名单 + 只读 allowlist）+ cwd 越界校验 + sha256 审计。安全裁决用稳定 `rule` 码，写前门文案锁定可 grep。
7. **跨仓契约耦合点**：`knowledge.submit`/`recipeAuthoringGate` 与 `@alembic/core/knowledge` 的 `validateAgainst`/`resolveAuthoringProfile`/`getSystemInjectedFields`；`code.outline` 与 `AstAnalyzer`；`graph` 与 ProjectGraph/CodeEntityGraph；`memory.note_finding` 与 MemoryCoordinator/ActiveContext/QualityGate。这些是 Agent 侧"非确定性执行 + Core 确定性内核"边界的具体落点。
