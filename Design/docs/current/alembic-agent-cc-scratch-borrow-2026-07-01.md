# AlembicAgent 借鉴 claude-code-from-scratch 的可落地增强需求设计

Date: 2026-07-01
Design Key: alembic-agent-cc-scratch-borrow-2026-07-01
Source Window: AlembicWorkspace controller（Design 流程）
Status: CG 已决（2026-07-01）— 暂只落档，待用户决定 deliver 时机（未 intake、未 deliver）
Reference source: AlembicWorkspace/claude-code-from-scratch（用户本地下载的真实 TS 源，4318 LOC + Python 4002 LOC）
Method: 14 章逐章真读真实 TS 源 + 逐章对 AlembicAgent 真实代码 fit + scope/boundary/thin-shell 三路对抗 critique + finalize（33 agent）。3 个核心 file:line 锚点已由 controller 独立抽查真实存在。

> 状态：Design 出稿。**CG 已于 2026-07-01 拍板（见下「CG 决议」）；用户选择暂只落档、未 intake、未 deliver。** 本稿在原草案基础上折入三份对抗审查的全部有效修正，并逐条说明对错误批评的拒绝理由。所有 file:line 锚点本轮已对源码核验。

## CG 决议（2026-07-01，用户已拍板）

> 本节覆盖文末「待用户确认的关键决策」的推荐项；差异处以本节为准。

- **CG-1（A-2 阈值/措辞/source）= `>7 天` + 软提示 + 全 source**（用户选项 A，**非**推荐的 bootstrap-only）。
  - **载重影响**：A-2 改的 prompt 文本覆盖**所有**经 `MemoryRetriever.toPromptSection` 的召回路径，不止 bootstrap。故 §6 的 **production-floor parity 门必须在覆盖全部召回 source 的代表性 Recipe 语料上 capture/diff**（暴露面比 bootstrap-only 更宽，parity 基线须对应加宽，确保 floor verdict 逐字节不漂）。这是用户在知情下接受更宽暴露面、以全覆盖换更一致的陈旧标注。
- **CG-2（A-1 head/tail 比例）= 同 read 入口 80%/15%**（默认采纳），服从 `keepHead+marker+keepTail ≤ TRUNCATE_TO=500` 幂等硬约束（按 500 的比例切）。
- **CG-3（B-1 读后被改处置）= 硬拒 + 重读引导文案**（用户选项 C）。`磁盘存在 ∧ 已读 ∧ 当前指纹≠读时指纹 → fail('file changed externally since last read')` 并附明确「先重读再写」引导，不静默覆盖、不仅记日志。
- **CG-4（B-1 机制）= 复用既有 `deltaCache` 内容哈希**（用户选项 A）。不新增 mtime map；仅当 Phase 3 前置核验发现 `deltaCache` 粒度/生命周期不适配 write 门时才回退新增字段，且须先回报。
- **CG-5（A-3 处置）= defer**（默认采纳，移 §4.8，本需求不交付）。
- **CG-6（defer 项留痕）= 本需求 ledger 观察项留痕**（默认采纳，不另起需求）。

## 1. 标题 + 一句话目标

**标题**：AlembicAgent in-process Recipe 生成 agent 的靶向保真增强（上下文保真 + 记忆保真 + 写入安全）

**一句话目标**：仅借鉴 claude-code-from-scratch 教学 agent 中**真正适配 in-process 批量 Recipe 生成**、**在 AlembicAgent 中有真实消费点**、且**对应一个已陈述的正确性/保真弱点**的改进——L1 截断保留首尾、记忆陈旧度标注、写前新鲜度门——在不触碰 production floor / 提交门 / 工具内核契约 / PCV observe-only 边界、不改变进入提交门的 Recipe 内容、不新增模型往返的前提下，降低生成质量损失与并发改写风险。

**与原草案的差异（折入审查后）**：

- **A-3 召回预取由 in-scope 降级为 §4.8 defer（可选后续）**。三份审查中两份独立指出：在 `await stage.promptBuilder(...)`（`PipelineStrategy.ts:788`）这一单一阻塞步内，召回 `await`（`insightAnalyst.ts:390`）只能与 §1–§7 的**同步字符串拼装**重叠，真正昂贵的 LLM react loop 尚未启动、无法重叠（§9 的 `generateContextForAgent` 在 §8 之后，也无法被它覆盖）。其宣称的 wall-clock 收益在单文件作用域内**结构上不可达**，且其验收把 "flat（持平）" 当成功——这是一个借真实调用点伪装的 thin shell。故移出本需求 in-scope；仅在补充「跨维度预取（orchestrator 级，带可测量的 p50 下降目标）」的重设计后才可重新纳入。
- **B-1 写前新鲜度门：机制由 mtime 改为复用既有 `deltaCache` 内容哈希**，并补「先核验 Core `@alembic/core/io` WriteZone 无既有冲突/新鲜度原语」的前置。理由见 §3 B-1。
- **A-1、A-2 完成定义全面收紧为真闭环**（多周期幂等、字段大小写钉死、production-floor parity 门、确定性断言而非肉眼核验），见 §5/§6。

---

## 2. 背景与动机

`claude-code-from-scratch` 是一个**交互式 coding CLI** 教学实现；AlembicAgent 是 Alembic 运行时内**无人值守、批量生成 Recipe 的 in-process AI agent**（驱动多 provider，跑 bootstrap/scan/evolve 多维度链）。两者形态不同，绝大多数教学技巧（REPL、流式渲染、SIGINT、MCP 客户端、settings.json 配置层、文件编辑器多步流水线）对 AlembicAgent **无消费方**。

14 章 fit-findings 逐条比对后，只有 **3 条**同时满足「适配 in-process」「教学侧值得借」「AlembicAgent 当前确有缺口、有真实调用点、且对应一个已陈述的正确性/保真弱点」。每条对应一个具体运行期质量或安全弱点：

- **L1 历史压缩丢尾（A-1，正确性/保真弱点）**：`ContextWindow.ts:583` 的 `#compactL1` 对旧 tool result 做 `substring(0, TRUNCATE_TO)` 纯头部截断（`TRUNCATE_THRESHOLD=2000`、`TRUNCATE_TO=500`，本轮核验），丢弃尾部。扫描类 tool result 的尾部恰恰承载错误汇总、match 计数、结尾结构等高信号——已被 head-only 切丢。同仓 `clampReadResult`（read 入口，`code.ts:883`）早已用首+尾策略，L1 反而更糙。
- **召回记忆被当作当前事实（A-2，正确性/保真弱点）**：`MemoryRetriever.ts:194` 的 `toPromptSection` 渲染记忆行无任何时间戳或陈旧提示，尽管 `created_at/updated_at/last_accessed_at` 已在行上（`MemoryStore.deserialize` 返回 camelCase `updatedAt/lastAccessedAt`，本轮核验 `MemoryStore.ts:569-579`）。数月前的缓存 insight 会被生成 agent 当作当前代码真相，直接导致**陈旧知识幻觉进 Recipe**。
- **写前无新鲜度校验（B-1，正确性弱点）**：`code.ts:767` 的 `handleWrite` 只查 `PROTECTED_PATHS` 就无条件 `fs.writeFile`（写盘在 `:791`），无读前置、无外部改动检测；agent 可盲覆盖一个它没读过 / 已被并发 rescan/host job 改过的文件。这是与「授权」正交的 **TOCTOU 正确性风险**。

> **A-3（召回串行）不再列为本需求的弱点**：其表现是延迟而非正确性/保真；§2 的弱点清单刻意只保留「丢尾 / 陈旧幻觉 / 写不安全」三个正确性/保真项，使 in-scope 与弱点一一对应。延迟项的处置见 §4.8。

---

## 3. In-scope 借鉴项（fitsInProcessAgent=true ∧ recommend=borrow ∧ 有真实消费点 ∧ 对应已陈述弱点）

> 共 3 项，聚成两个工作组。每项均经源码核验（见第 6 节证据）。

### 工作组 A：上下文 / 记忆保真（生成质量）

#### A-1　L1 历史截断保留首+尾（ch07）
- **要建什么**：把 `#compactL1` 对旧 tool result 的 `substring(0, TRUNCATE_TO)` 改为 `slice(0, keepHead) + 独立 marker + slice(-keepTail)`，与同仓 `clampReadResult`（`code.ts:883`）的首+尾思路一致。**`limitToolResult` / `limitFileContent`（`ContextWindow.ts:1040/1185`，含 `[batch truncated]`、`[search truncated]` 等多个 `substring(0, maxChars)` 站点）的纯头截断改造拆为独立子交付物 A-1b**，不与 L1 共享「完成」判定（见 §5）。
- **真实消费点**：`src/agent/context/ContextWindow.ts:583`（`#compactL1` 截断行），在 `#compactL1`（`:570`）→ `compactIfNeeded`（`:359/:407` 调用）→ `BudgetController.runCompactionCycle` → `AgentRuntime.#prepareIteration` 的活跃 result-formatting 路径上。`limitToolResult` 是另一机制（per-call 预算格式化，`AgentRuntime` result formatting 路径），故拆分。
- **填补缺口**（status=partial）：首+尾仅在 read 入口（`clampReadResult`）存在；L1/limit 仍是 head-only，丢尾。
- **boundary**：AlembicAgent（`src/agent/context/*`，纯 Agent context-assembly，无 Core/Plugin 介入）。
- **value**：近零额外成本保住 stale result 的尾部信号，使 L1 这一有损步骤更少损。
- **risk**：极低——只改「本就要截断」的字符取舍。**幂等性是硬约束**：必须保证 `keepHead + marker + keepTail ≤ TRUNCATE_TO`，使截断结果落回阈值之下、跨多次压缩周期不被二次截断（防止吃掉刚保留的尾部）；marker 须与 read 入口 marker 文本不同。

#### A-2　召回记忆陈旧度标注（ch08）
- **要建什么**：在 `MemoryRetriever.toPromptSection` 的 line-builder 里，从**确切 camelCase 字段** `m.updatedAt`（回退 `m.lastAccessedAt ?? m.updatedAt`）计算 age，对较旧记忆加短前缀（措辞/阈值见 CG-1）。数据已在行上，仅改渲染。
- **真实消费点**：`src/agent/memory/MemoryRetriever.ts:194`（`toPromptSection` 唯一格式化点），输出经 `insightAnalyst.ts:390`（`source:'bootstrap'`）进入 §8。
- **填补缺口**（status=missing）：当前渲染无时间戳/陈旧提示，召回记忆看起来像当前 ground truth。
- **boundary**：AlembicAgent，**render-only**。**硬约束（折入边界审查）**：不得触碰 Core-owned `semantic_memories` schema（`@alembic/core/memory`），不得改动 Agent 侧 raw-SQL 同步 adapter——`MemoryStore.ts:14-26` 冻结规则「SD-4 决策落地前不做任何代码搬移」明确在场；A-2 只读既有反序列化字段、只改字符串渲染。
- **value**：直接降低生成 Recipe 中的陈旧知识幻觉——本章性价比最高的借鉴（时间戳现成，仅改渲染）。
- **risk**：低——纯格式化，仅多出受现有 per-memory 预算约束的少量 token。**关键实现陷阱（折入审查，本轮已核验）**：`retrieve()`/`getAllActive()` 的原始行用 **snake_case**（`MemoryRetriever.ts:127-129/247-248`），而 `toPromptSection` 喂给 builder 的是 `MemoryStore.deserialize(m)` 产出的 **camelCase** `DeserializedMemory`（`MemoryStore.ts:569-579`）。若实现误用 §6 证据中出现的 snake_case `updated_at`，`new Date(undefined).getTime()` → `NaN`，age 比较恒 false，**全部记忆不带标注、phase 作为静默 no-op 出货**。必须钉死 camelCase 字段并加 `Number.isNaN` 守卫。

### 工作组 B：写入安全（正确性）

#### B-1　写前新鲜度门（read-before-write，TOCTOU；基于既有 deltaCache 内容哈希）（ch06）
- **要建什么**：复用 `ToolContext` 上既有的 `deltaCache`（`registry.ts:144`，`DeltaCacheLike`，read 侧已在 `code.ts:458-459` 消费）作为「读时内容指纹」来源，实现 read-before-write 门：`code.read` 成功后内容指纹已被 `deltaCache` 记录；`code.write`（`code.ts:791` 写盘前）对**磁盘已存在**的目标文件，要求当前磁盘内容指纹与「上次读时指纹」匹配——不匹配或无记录则按 §决策（CG-3）硬拒/警告；写成功后更新指纹。**新文件（磁盘不存在）跳过该检查**。
- **机制选择理由（折入审查，拒绝原草案的 mtime map）**：原草案新建 `readFileState: Map<absPath, mtimeMs>` 借的是参考实现的 mtime 细节，而 AlembicAgent **本仓已有更强的等价物**——`deltaCache` 内容哈希。内容指纹对 touch/clone/checkout 的 false-positive/false-negative 优于 mtime，且复用现有 DI 组件、几乎零新增写攻击面（这正是 §4.7 类「优先用本地等价物」的纪律，原草案在别处都遵守、独此处漏了）。**若 CG-2b 选 mtime，则退回新增字段方案。**
- **真实消费点**：写侧 `src/tools/runtime/handlers/code.ts:767`（`handleWrite`，`fs.writeFile` 在 `:791` 前）读 `ctx.deltaCache`；读侧 `handleRead`（`:329`）已写 `ctx.deltaCache`（`:458`）。read 与 write 须共享同一 per-run `ToolContext` 实例（见下「完成门」）。
- **前置核验（折入边界审查，Phase 4 准入项）**：实现前先 grep `@alembic/core/io` 的 `WriteZone`/`pathGuard`，确认 Core IO 层**未**提供写冲突/新鲜度原语再造。本轮核验：`WriteZone` 经 DI 注入于 `ConversationStore`/`MemoryEmbeddingStore`/`SessionStore`/`MemoryConsolidator`，管的是写路径**落点守护**（`pathGuard`），不是 read-before-write 新鲜度；故 B-1 仍属 Agent tool 层、不与 Core 重复——但实现前必须复核此结论，若 WriteZone 已含新鲜度则消费而非重造。
- **填补缺口**（status=missing）：`handleWrite` 只查 `PROTECTED_PATHS` 即无条件写；无外部改动检测；`deltaCache` 现仅做读去重，未做写新鲜度门。
- **boundary**：AlembicAgent（`src/tools/*`，Tool registry / tool execution）。
- **value**：阻止 write capability（仅 `System` 持有 `code.write`）静默覆盖被并发 host rescan/job 或 agent 自身未重读改动过的文件，把损坏改为诚实报错。
- **risk**：小——今天只有 `System` 持 `code.write`，爆炸半径小。两个真实陷阱（折入审查，作为完成门）：①新文件判定必须 key 在「写时磁盘是否存在」而非「是否在 map/cache 中」——否则一个**磁盘已存在但本 run 未读**的文件（上一轮产物或并发 host job 写的）会被「not in cache → 当作新文件放行」重新打开 TOCTOU 洞；②read 与 write 必须证明共享同一 `ToolContext` 实例，否则 cache 在 write 时恒空 → 要么全拒合法重写、要么门永不触发——这是 thin-shell，须以真 run 证明而非手传 ctx 的单测糊弄。

---

## 4. 明确 Non-goals（不借鉴清单，载重段）

> 每条给出排除理由：要么 in-process agent 无消费方，要么 AlembicAgent 已具备更强等价物，要么 finding 评级为 defer。**新增 4.0 节列出映射到本需求自身不变量的硬 Non-goal（折入审查 Attack 3/4）。**

### 4.0 映射到本需求自身不变量的硬 Non-goal（新增）
- **不改变进入提交门的 Recipe 内容、validation verdict、production floor 阈值**。本需求所有项均不得移动 `recipeAuthoringGate → Core validateAgainst` 的判定。**A-2 是此处最锋利的边**：它改的是模型实际看到的 prompt 文本，**可能**改变生成 Recipe 内容，**可能**移动 floor verdict——故 A-2 的验收**必须含 production-floor parity 证明**（固定 Recipe 语料的 verdict JSON 改前/改后逐字节相同），而不仅是「旧记忆带标注、新记忆不带」。
- **不新增任何 LLM-可调工具、不新增任何模型往返**。三个被拒的参考特性（LLM-as-retriever、substantiality gate、`<system-reminder>` oracle）都加一次模型调用，与本需求「降损耗、不加往返」的框架直接冲突。B-1 是 `ToolContext` 内部逻辑，非新 action。
- **维度内工具执行严格顺序、不引入投机/并行工具派发**。理由是 Recipe 生成链的**重放确定性（replay determinism）**——本需求多处依赖「输出逐字节一致」，该不变量须显式声明，不能隐含。（此条同时关闭了「为什么不顺手并行工具调用」的追问，并与 A-3 被降级的理由一致。）

### 4.1 交互 / CLI / REPL 形态——无消费方（全部 skip）
- **one-shot vs 交互共用 chat() 路径 / DI 注入 confirm/plan-approval / 单 readline / 自递归 REPL / 两段式 SIGINT / slash-command 派发**（ch04）：AlembicAgent 是 library，唯一入口 `AgentRuntime.reactLoop` 由 host 程序化驱动，无 stdin、无人确认、无人敲 slash。cancel-without-kill 已由 `AbortSignal` 传播实现。
- **结构化多选审批 / 审批后 re-inject 决策**（ch10）：无人在循环里给多选审批，退出由 `ExitController` 按机器信号判定。

### 4.2 流式输出 / 双后端原生消息——与多 provider 统一格式冲突（全部 skip）
- **per-provider 原生消息双数组 / token emit 单 chokepoint / 高阶+原始双订阅 / OpenAI tool-call 分片重组 / content_block_stop 提前执行工具**（ch01、ch05）：整栈非流式，`chatWithTools` 返回完整响应；改用 N 份原生消息存储会按 provider 复制整条 `ContextWindow` 压缩/投影/预算流水线，是大幅可维护性回退且无 replay 消费方。AlembicAgent 刻意选**单一 `UnifiedMessage`**。
- **流式提前启动只读工具 / 流式 retry**（ch01、ch05）：retry+jitter+断路器已在 `reliability.ts` 实现且超出教学。**「流式提前启动只读工具」的真正排除理由是：它属投机/并行工具执行，破坏 §4.0 的重放确定性不变量**——而非原草案所写的「无人观看故近零价值」（后者与延迟相关，理由不成立，已订正；见对 critique 1 Attack 3 的采纳）。

### 4.3 MCP 客户端 / 外部工具服务器——非本仓边界（全部 skip）
- **id 关联 RPC / line-delimited JSON stdio / `mcp__server__tool` 前缀 / slice-rejoin / Promise.race 初始化 / 幂等 connect / 分层 .mcp.json**（ch12）：AlembicAgent 工具是 in-process kernel registry，无 JSON-RPC、无长连外部 peer；`AgentRuntimeBoundary.ts:109` 明确把 `codex-mcp` 列入 `unsupportedHostRoutes`，MCP server 面是 **AlembicPlugin** 边界。已有更强的两级 `{tool, action}` 命名 + schema 校验。

### 4.4 文件系统配置层 / 技能 frontmatter——in-process 用 typed profile（全部 skip）
- **CLAUDE.md 上行合并 / @include 递归 / .claude/rules 投放 / settings.json 合并 / 目录名兜底 id / 容错 frontmatter / 字符串强转 / 跳过损坏条目**（ch03、ch06、ch09、ch11）：profile/tool 是编译进代码的 typed 对象（`AgentProfileDefinition`、`ToolSpec`），非磁盘发现的手写配置；未审查 markdown 目录对 in-process agent 是**注入面**而非特性。fail-fast 是 first-party 编译代码的正确行为。

### 4.5 文件编辑器专属——AlembicAgent 是整文件发射，无该失败模式（全部 skip）
- **string-replace 唯一匹配门 / 引号模糊定位 / 自愈索引目录**（ch01、ch02）：唯一 mutator 是整文件 `code.write`，无 old_string 编辑面；加这些会凭空造出有门控的写攻击面且无调用方。disk-spill+path 指针（ch01/ch07）同理：truncation+窄查询已覆盖损失。

### 4.6 教学/文档产物——不改运行期行为（全部 skip）
- **production-vs-ours parity 表 / per-axis 源符号引用 / 量化 gap**（ch13）：教学/文档产物，无运行期消费方；唯一运行相关处（V1 退役登记）已做。
- **输出 marker 作断言 oracle / setup-cleanup.sh / 始终在场记忆索引 / LLM-as-retriever / substantiality gate / `<system-reminder>` 包裹**（ch08、ch14）：要么是给人读终端的 oracle（AlembicAgent 消费者是程序化结构化字段，更强），要么 silent-fail 纪律已在位，要么会给批量管线加一次额外模型往返（违 §4.0）。

### 4.7 AlembicAgent 已具备的等价物（skip，非缺口）
- **text-only 终止 / observation-as-next-turn / 迭代非递归循环 / 廉价分层压缩 / 配对原子性边界压缩 / 正交预算守卫 / 工具错误返字符串 / 名单广告+按需取 schema / head+tail 大输出 / 同文件读去重 / 配额降级 / 最近 N round 工作集 / env-only key / provider 自动探测 / 损坏 session 容错 / 失败静默 [] / fork-return 隔离子 agent / capability 移除即只读 / 危险命令正则黑名单**（ch01、ch02、ch05–ch11）：均已在 `ExitController` / `ContextWindow` / `BudgetController` / `router` / `terminalSafety` / `AgentRunCoordinator` / `AiFactory` 中实现，常比教学版更完整。

### 4.8 评级为 defer 的「可选后续」（**不进本需求 in-scope**）
> `recommend:defer` 项 + **本轮从 in-scope 降级的 A-3**，留作后续单独决策：
- **A-3 召回预取（降级，ch08）**：在 `await stage.promptBuilder(...)`（`PipelineStrategy.ts:788`）单一阻塞步内，召回 `await`（`insightAnalyst.ts:390`）只能与 §1–§7 同步字符串拼装重叠，真正昂贵的 LLM react loop 未启动、§9 `generateContextForAgent`（`:406`）在 §8 之后——单文件作用域内 wall-clock 收益不可达。**重新纳入条件**：重设计为 orchestrator 级**跨维度预取**（当前维度 react loop 运行时预取下一维度召回），带可测量目标（p50 over N≥3 维度**必须下降**，「持平」判为失败），且配 forced-rejection 单测证明无 unhandled rejection。
- 缓存感知压缩（ch01）；server-reported token 喂 per-call ratio（ch07）；L1 lossless re-read 指针（ch07）；sentinel-skip 防重复截断（ch07）；记忆 feedback/correction 类（ch08）；已注入记忆去重 set（ch08）；并行只读工具执行（ch02/ch13）；RESET_STAGE 配对完整性审计（ch10）；子 agent capability 求交（ch10）；key-gated 真 provider smoke 测试（ch14）。

---

## 5. 阶段划分（按 producer/consumer 依赖排序）

> 三项彼此独立、无强依赖；按「低风险纯渲染 → 字段/逻辑新增」排序，便于逐阶段在真 Recipe 跑上验收。**每阶段完成定义已收紧为真闭环（折入 thin-shell 审查）。**

### Phase 1 — A-1 L1 截断保留首+尾
- **goal**：`#compactL1` 由 head-only 改首+尾，**且证明跨多周期幂等**。
- **touched files**：`src/agent/context/ContextWindow.ts`（`#compactL1` :583）。
- **完成定义（收紧）**：
  - 任一 `> TRUNCATE_THRESHOLD` 的 tool result 经 `#compactL1` 后重写为 `head(keepHead) + DISTINCT_MARKER + tail(keepTail)`，其中 `keepHead + marker + keepTail ≤ TRUNCATE_TO`，**落回阈值之下** → 跨 ≥3 次连续压缩周期可证幂等（不再二次截断、不吃尾）。marker 文本与 read 入口 marker 不同。
  - 调用链：`AgentRuntime.#prepareIteration → BudgetController.runCompactionCycle → ContextWindow.compactIfNeeded → #compactL1`。
- **validation**：单测**跑两次压缩周期**于同一超长 result，断言尾部第二周期后逐字节存活（不只单次）；现有 `ContextWindow` 压缩测试全绿；真 bootstrap 跑中**至少一条 result 被 L1 处理两次**，dump 前后证明尾部留存。

### Phase 1b — A-1b limit\* 系列首+尾（独立子交付物）
- **goal**：`limitToolResult`/`limitFileContent` 的纯头截断（含 `[batch truncated]`/`[search truncated]` 路径）改首+尾。
- **touched files**：`src/agent/context/ContextWindow.ts`（`limitToolResult` :1040 起、`limitFileContent` :1185；多 `substring(0, maxChars)` 站点）。
- **完成定义**：每个改造站点的截断结果同时含 head 与 tail；**「L1 done」不得计为「limit done」**——本阶段独立断言。
- **validation**：单测覆盖 `[batch truncated]` 与通用字符串路径各自的尾部保留。

### Phase 2 — A-2 记忆陈旧度标注
- **goal**：召回记忆 line 带 age 提示，**字段大小写钉死、production-floor parity 不漂**。
- **touched files**：`src/agent/memory/MemoryRetriever.ts`（`toPromptSection` line-builder，`:194` 起）。
- **完成定义（收紧）**：
  - age 由 **camelCase** `m.updatedAt`（回退 `m.lastAccessedAt ?? m.updatedAt`）计算；显式 `Number.isNaN` 守卫——无效时间戳的处置（标 unknown-age 或跳过）须**显式决定**，不得 accidental。
  - `> 阈值`（CG-1）的记忆行带提示，新鲜记忆不加噪；输出经 `insightAnalyst.ts:390` 进入 §8。
  - **render-only**：不触 Core schema / raw-SQL adapter（SD-4 冻结）。
- **validation**：
  - 单测 fixture **必须经 `MemoryStore.deserialize` 真路径**构造（而非手搓对象字面量），使大小写漂移直接红；覆盖**NaN/缺失时间戳行**（`last_accessed_at=null`）断言确定性行为。
  - **production-floor parity 门（新增硬项）**：固定 Recipe 语料下，`recipeAuthoringGate → validateAgainst` 的 verdict JSON 改前/改后逐字节一致（A-2 改了 prompt 文本，必须证 floor 不漂——此项原草案缺失）。
  - 真 bootstrap §8 prompt dump 中，>阈值记忆带标注、新鲜记忆不带，**用确定性断言（grep marker 串）而非肉眼**；附底层 `updatedAt` 值佐证 age 计算。

### Phase 3 — B-1 写前新鲜度门
- **goal**：read-before-write + 外部改动检测，基于既有 `deltaCache` 内容哈希。
- **touched files**：`src/tools/runtime/handlers/code.ts`（`handleWrite` :767，`handleRead` :329）；如 CG-2b 选 mtime 则另涉 `src/tools/kernel/registry.ts` 新增字段。
- **前置准入**：grep `@alembic/core/io` WriteZone 确认无既有新鲜度原语（见 §3 B-1）。
- **完成定义（收紧，显式四态）**：
  - `磁盘存在 ∧ 本 run 未读（cache 无指纹）→ 拒（must read first）`；
  - `磁盘存在 ∧ 已读 ∧ 当前内容指纹 ≠ 读时指纹 → 按 CG-3 处置（默认拒：changed externally）`；
  - `磁盘存在 ∧ 已读 ∧ 指纹一致 → 准`；
  - `磁盘不存在 → 准（新文件）`。**新文件分支 key 在「写时磁盘是否存在」，不是「cache 是否有记录」**——堵住「磁盘已存在但未读」的洞。
  - read 与 write 共享同一 per-run `ToolContext`（须以真 run 证明）。
- **validation**：
  - 单测覆盖四态；并**单独**构造「磁盘已存在但本 run 未读」用例断言被拒（区别于「磁盘不存在的新文件」放行）。
  - **共享 ctx 真 run 证明（硬门）**：插桩真实运行路径，证明同一维度 run 内 `handleRead` 与 `handleWrite` 观察到同一 `deltaCache`/`ToolContext`；若运行期不共享实例，B-1 判 **blocked，非 done**。
  - 真 Recipe 生成跑中**首次写不存在于磁盘的新 Recipe 文件不被误拒**（回归重点）；构造一次「读后被外部改」证明 write 被拦并返回明确错误而非静默覆盖。

---

## 6. 验收与验证（在 AlembicAgent 真 Recipe 生成跑上证明）

每阶段除单测外，须以**真 bootstrap/scan 维度跑**为证据，且**真场景检查用确定性断言 harness（grep marker/stamp/rejection 串）而非肉眼**，使验收可重放：

- **A-1 / A-1b**：真跑后 dump 一段被 L1（A-1 须含**被处理两次**的）result，断言 head 与 tail 双侧片段同在；对比改前 dump 证明尾部信号（match 计数/错误汇总）从「丢失」变「保留」。
- **A-2**：真跑维度 prompt dump 中，旧记忆行带提示、新记忆不带（grep 断言）；附 `updatedAt` 值佐证；**外加固定语料 floor verdict 改前/改后逐字节 diff = 空**。
- **B-1**：真跑日志显示首次写新 Recipe 文件成功（无误拒）；「读后被外部改」场景 write 被拦；**共享 ctx 真路径插桩证据**。
- **统一硬门**：
  - 每阶段后 `npm test` 全绿、离线（不依赖真 key，遵 CLAUDE.md）。
  - **production-floor baseline 机制（新增）**：对固定 Recipe 语料，**改前先 capture `recipeAuthoringGate → validateAgainst` verdict JSON 为提交基线**，改后 diff——使「floor 不漂」可证伪（原草案「逐字节不变」无 baseline 步骤、不可证伪）。A-2 必过此门；A-1/A-1b 亦证（虽只改截断字符，仍须证进门 Recipe 内容不变）。
  - host 路径 vs in-process 路径 parity standing tripwire 全绿。

证据形态：commit hash、单测输出、真跑 prompt/result dump（含 grep 断言输出）、floor verdict baseline 对照 JSON、共享 ctx 插桩日志。

---

## 7. 边界与风险

**跨仓边界**：三项全部在 **AlembicAgent 仓内**（`src/agent/*`、`src/tools/*`），不改 AlembicCore（`semantic_memories` schema / `validateAgainst` / production floor 由 Core owner；A-2 只读反序列化字段、B-1 不碰 Core IO 持久化不变量）、不改 AlembicPlugin（MCP server 面 / host-agent tool-router）。提交由 AlembicAgent 窗口自行 commit（develop-on-main）。

**边界审查折入**：
- **A-2 SD-4 caveat**：`MemoryStore.ts:14-26` 冻结「SD-4 决策落地前不做任何代码搬移」+ Core schema 所有权；A-2 必须 render-only，不得「顺手优化」store。
- **B-1 WriteZone 前置**：实现前核验 `@alembic/core/io` WriteZone（经 DI 注入于 `ConversationStore`/`MemoryEmbeddingStore`/`SessionStore`/`MemoryConsolidator`，管落点守护非新鲜度）无既有冲突/新鲜度原语；若有则消费而非重造。

**不得回归**：
- **production floor / 提交门**：`recipeAuthoringGate → Core validateAgainst` verdict 逐字节不变，须有 baseline-capture/diff 证据（见 §6）。
- **工具内核契约**：`ToolResult {ok,data,error,_meta}` 信封、`{tool, action}` 命名、`ok()/fail()` 不变；B-1 仅复用既有 `deltaCache`（或，CG-2b 下，在 `ToolContext` 加字段），不改既有字段语义。
- **PCV observe-only 边界**：`AnalyzeGroundingGuard` `groundingEnforcement='off'` 默认不动。
- **V1-tool 退役登记**：不复活退役工具；不新增 LLM-可调工具。
- **压缩配对原子性**：A-1 不破坏 `assistant(toolCalls)+tool results` 原子单元与 `messages[0]` pin。
- **重放确定性**：维度内工具执行严格顺序，不引入投机/并行派发（§4.0）。

**主要风险**：
- A-1 marker/比例不当致重复截断吃尾 → 以 `keepHead+marker+keepTail ≤ TRUNCATE_TO` 的幂等约束 + ≥3 周期断言规避。
- A-2 大小写漂移致静默 no-op → 钉死 camelCase + 经真 deserialize 路径单测 + NaN 守卫。
- A-2 改 prompt 文本致 floor 漂移 → floor parity 硬门。
- B-1 误报合法新文件 / 重开 TOCTOU 洞 / ctx 不共享 → 新文件 key 在磁盘存在性 + 共享 ctx 真 run 证明（不共享则 blocked）。

---

## 8. 实现指导（代码级）+ 每阶段验收标准

> 本节按相位组织：Phase 1（A-1 `#compactL1`）→ Phase 1b（A-1b `limit*` 系列）→ Phase 2（A-2 记忆陈旧标注）→ Phase 3（B-1 写前新鲜度门）。每相位含目标 / 现状代码 / 目标代码 / 触碰点与签名 / 边界与陷阱处置 / 单测 / 真跑验收 / 验收标准八个子项。对抗核验的有效修正已折入；被拒修正在相应处注明理由。

---

### Phase 1 — A-1 `#compactL1` 截断保留首+尾

#### 目标

把 `#compactL1` 的纯头截断（`substring(0, TRUNCATE_TO)` 丢尾）改为首+尾保留，保住扫描类 result 尾部的错误汇总 / match 计数 / 结尾结构等高信号；marker 文本与 read 入口 `clampReadResult` 可区分（CG-2）；并把"今天碰巧不二次截断"升级为显式幂等不变量（`keepHead+marker+keepTail ≤ TRUNCATE_TO=500 < TRUNCATE_THRESHOLD=2000`）。

#### 现状代码（`ContextWindow.ts` :564-597，私有方法）

```ts
  #compactL1() {
    const TRUNCATE_THRESHOLD = 2000;
    const TRUNCATE_TO = 500;
    let truncated = 0;

    const lastRoundStart = this.#findLastToolRoundStart();
    if (lastRoundStart < 0) {
      return { level: 1, removed: 0 };
    }

    for (let i = 1; i < lastRoundStart; i++) {
      const msg = this.#messages[i];
      if (msg.role === 'tool' && msg.content && msg.content.length > TRUNCATE_THRESHOLD) {
        msg.content = `${msg.content.substring(0, TRUNCATE_TO)}\n... [truncated from ${msg.content.length} chars]`;  // :583
        truncated++;
      }
    }

    if (truncated > 0) {
      const afterTokens = this.estimateTokens();
      const ratio = this.getTokenUsageRatio();
      this.#logger.info(
        `[ContextWindow] L1 compact: truncated ${truncated} tool results | ` +
          `tokens≈${afterTokens}/${this.#tokenBudget} (${(ratio * 100).toFixed(1)}%)`
      );
    }
    return { level: 1, removed: truncated };
  }
```

#### 目标代码

新增模块级 helper + 常量（放在 `// ─── ToolResultLimiter ──` 区块上方，约 :1030 之前，紧随 `isRecord` 之后）。A-1 与 A-1b 共用同一 `snipHeadTail`。

```ts
// ─── 首+尾截断公共逻辑（A-1 / A-1b 共用）────────────────
// 1. 与 read 入口 clampReadResult(code.ts) 首+尾思路一致，但 marker 文本必须不同
//    （compaction snip / tool-result snip ≠ batch read budget），使两层有损截断可区分。
// 2. 幂等硬约束：budget=TRUNCATE_TO(500) 时 keepHead+marker.length+safeTail ≤ budget，
//    使重写结果落回 TRUNCATE_THRESHOLD(2000) 之下，跨周期不二次截断、不吃刚保留的尾部。
// 3. 比例按 budget 切（CG-2：80%/15% of 500），不按原文长度切。

/** L1 压缩层 marker 词根 —— 与 read 入口 / limit 层均不同 */
const L1_SNIP_MARKER_TAG = 'compaction snip';
/** limit 层 marker 词根 —— 与 read 入口 / L1 层均不同 */
const LIMIT_SNIP_MARKER_TAG = 'tool-result snip';

/**
 * 把长字符串截断为 head + 独立 marker + tail，并保证幂等：
 * keepHead + marker.length + safeTail ≤ budget。
 *
 * 对抗修正#2（FOLD）：原规格注释把不变量写成"任意原文长度恒成立"，实测仅在
 * budget ≳ 340 成立——小 budget 下 keepHead(0.8·budget)+marker 已超界、safeTail
 * 夹 0 仍超。此处采用更稳实现：overflow 优先收缩 safeTail，仍超则继续收缩 keepHead，
 * 使界在任意 budget 下真正无条件成立（不依赖外部 MIN_TOOL_CHARS floor）。
 */
function snipHeadTail(text: string, budget: number, tag: string): string {
  let keepHead = Math.floor(budget * 0.8);   // CG-2：头 80%
  let keepTail = Math.floor(budget * 0.15);  // CG-2：尾 15%
  const omitted = text.length - keepHead - keepTail;
  // marker 含原文长度与省略数（便于审计），用真实 marker.length 入预算。
  const marker = `\n... [${tag}: ${omitted} of ${text.length} chars omitted] ...\n`;
  // 幂等守卫：先收缩 safeTail；若 keepHead+marker 仍超 budget，再收缩 keepHead，
  // 保证 keepHead+marker.length+safeTail ≤ budget 在任意 budget 下成立。
  let safeTail = keepTail;
  let overflow = keepHead + marker.length + safeTail - budget;
  if (overflow > 0) {
    const tailCut = Math.min(safeTail, overflow);
    safeTail -= tailCut;
    overflow -= tailCut;
  }
  if (overflow > 0) {
    keepHead = Math.max(0, keepHead - overflow);
  }
  // 若保留量已覆盖原文，不做截断（避免把短串放大）。
  if (keepHead + safeTail >= text.length) {
    return text;
  }
  const head = text.slice(0, keepHead);
  const tail = safeTail > 0 ? text.slice(-safeTail) : '';
  return `${head}${marker}${tail}`;
}
```

替换 `#compactL1` 的 :583 单行（其余逻辑/常量/循环边界/日志/返回不变）：

```ts
    for (let i = 1; i < lastRoundStart; i++) {
      const msg = this.#messages[i];
      if (msg.role === 'tool' && msg.content && msg.content.length > TRUNCATE_THRESHOLD) {
        // A-1：纯头截断 → 首+尾保留，保住扫描类 result 尾部的错误汇总 / match 计数 /
        // 结尾结构；snipHeadTail 内部保证 head+marker+tail ≤ TRUNCATE_TO，跨周期幂等。
        msg.content = snipHeadTail(msg.content, TRUNCATE_TO, L1_SNIP_MARKER_TAG);
        truncated++;
      }
    }
```

**幂等数算（budget=500，tag=`compaction snip`）**：`keepHead=400`，`keepTail=75`，`marker.length ≤ ~60`。`overflow = 400+60+75-500 = 35` → 收 `safeTail` 35 → `safeTail=40`、`overflow=0`。结果长度 ≈ `400+60+40 = 500 ≤ 500 < 2000`。第二周期 `length ≈500 > 2000` 为 false → `#compactL1` 守卫跳过 → 逐字节幂等、尾部存活。

#### 触碰点与签名

| 类别 | 标识 | 变更 |
|---|---|---|
| 新增模块常量 | `L1_SNIP_MARKER_TAG`、`LIMIT_SNIP_MARKER_TAG`（file-local `const`） | 新增 |
| 新增 helper | `snipHeadTail(text, budget, tag): string`（file-local，非导出） | 新增 |
| 私有方法 | `ContextWindow.#compactL1`（:564-597） | 改 :583 一行；签名/返回 `{level:1,removed:number}` 不变 |

公共契约确认：`ToolResult{ok,data,error,_meta}` 信封、`{tool,action}`、`ok()/fail()` **未触碰**（本相位不进 `code.ts` handler）；`ContextWindow` 公共方法集不变（`#compactL1` 私有）；无新增 import、无新类型/字段、无 `as any`、无新 `throw`、无 `catch`。

#### 边界与陷阱处置

- **陷阱 1 — 幂等吃尾**：`snipHeadTail` 运行时用真实 `marker.length` 算 `overflow`，先收 `safeTail` 再收 `keepHead`，保界。重写串 ≈500 < 2000 → `#compactL1` 第二轮守卫为 false → 不二次截断。
- **陷阱 2 — marker 不可区分（CG-2）**：L1 层 `compaction snip` ≠ read 入口 `batch read budget`（`code.ts:896`，**不改**）≠ limit 层 `tool-result snip`。
- **陷阱 3 — 短串放大**：`keepHead+safeTail >= text.length` 时原样返回。
- **陷阱 4 — 原子性 / messages[0] pin**：只改 `msg.content` 字符串、不增删消息、不动 `toolCalls`，`for` 从 `i=1` 起（跳过 messages[0]）。

#### 单测

目标文件：`/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/test/ContextWindow.test.ts`。入口经 `compactForProviderInputBudget({maxProjectedMessages,maxProjectedTokens})`（:407 内部依次调 `#compactL1`），构造"旧轮"超长 tool result。

```ts
import { ContextWindow, limitToolResult } from '../src/agent/context/index.js';

describe('A-1 #compactL1 head+tail retention', () => {
  function buildWindow(): { cw: ContextWindow; tailMark: string; headMark: string } {
    const cw = new ContextWindow(48_000);
    cw.appendUserMessage('analyze prompt');
    const headMark = 'HEAD_SIGNAL_TOKEN';
    // 对抗修正#3（FOLD）：tailMark 收到 ≤24 字，覆盖最坏 safeTail（~36），固化用例。
    const tailMark = 'TAIL_errs=3_total=42';   // 20 字
    const body = 'x'.repeat(4000);
    cw.appendAssistantWithToolCalls(null, [{ id: 'old', name: 'code', args: {} }]);
    cw.appendToolResult('old', 'code', `${headMark}\n${body}\n${tailMark}`);
    cw.appendAssistantWithToolCalls(null, [{ id: 'new', name: 'code', args: {} }]);
    cw.appendToolResult('new', 'code', 'short recent result');
    return { cw, tailMark, headMark };
  }

  it('keeps head AND tail of an old oversized tool result', () => {
    const { cw, tailMark, headMark } = buildWindow();
    cw.compactForProviderInputBudget({ maxProjectedMessages: 1, maxProjectedTokens: 1 });
    const out = cw.toMessages().find((m) => m.toolCallId === 'old')?.content ?? '';
    expect(out).toContain(headMark);
    expect(out).toContain(tailMark);   // 旧实现会丢
  });

  it('uses a marker distinct from the read-entry (clampReadResult) marker', () => {
    const { cw } = buildWindow();
    cw.compactForProviderInputBudget({ maxProjectedMessages: 1, maxProjectedTokens: 1 });
    const out = cw.toMessages().find((m) => m.toolCallId === 'old')?.content ?? '';
    expect(out).toContain('compaction snip');
    expect(out).not.toContain('batch read budget');
  });

  it('is idempotent across >=3 compaction cycles (tail survives, no re-truncation)', () => {
    const { cw, tailMark } = buildWindow();
    cw.compactForProviderInputBudget({ maxProjectedMessages: 1, maxProjectedTokens: 1 });
    const afterFirst = cw.toMessages().find((m) => m.toolCallId === 'old')?.content ?? '';
    expect(afterFirst.length).toBeLessThanOrEqual(500);
    for (let cycle = 0; cycle < 2; cycle++) {
      cw.compactForProviderInputBudget({ maxProjectedMessages: 1, maxProjectedTokens: 1 });
    }
    const afterThird = cw.toMessages().find((m) => m.toolCallId === 'old')?.content ?? '';
    expect(afterThird).toBe(afterFirst);
    expect(afterThird).toContain(tailMark.slice(-10));
  });

  it('does not add or remove messages (atomic pairing / messages[0] pin intact)', () => {
    const { cw } = buildWindow();
    const before = cw.toMessages().length;
    cw.compactForProviderInputBudget({ maxProjectedMessages: 1, maxProjectedTokens: 1 });
    expect(cw.toMessages().length).toBe(before);
    expect(cw.toMessages()[0]?.content).toBe('analyze prompt');
  });
});
```

#### 真跑验收

- 真 bootstrap 维度跑，开 `ALEMBIC_LOG_LEVEL` 落 `[ContextWindow] L1 compact` info 日志；run 后 dump 被 L1 处理过的旧 tool result。
- `grep -c 'compaction snip' <dump>` ≥ 1；同 result grep 其尾部已知信号（如 search result `matches` 计数尾行）= 命中；对比改前 dump 同 result 尾部信号缺失。
- **两次处理证据**：选一条在长 run 中被 L1 处理 ≥2 次的 result，`diff` 第 1 次 == 第 2 次（逐字节幂等）。

#### 验收标准

- [ ] `#compactL1` :583 改为 `snipHeadTail(msg.content, TRUNCATE_TO, L1_SNIP_MARKER_TAG)`；其余不变。
- [ ] `snipHeadTail` 在任意 budget 下保 `keepHead+marker.length+safeTail ≤ budget`（先收 safeTail 再收 keepHead）；`safeTail≥0`。
- [ ] 单测：head+tail 同时存活；输出含 `compaction snip` 且不含 `batch read budget`；≥3 周期逐字节不变且长度 ≤500；消息条数不变、`messages[0]` 为原 prompt。
- [ ] 真跑 dump：`grep 'compaction snip'` 命中 + 被处理 ≥2 次的 result 两周期 diff 为空。

---

### Phase 1b — A-1b `limit*` 系列首+尾保留（独立 done）

#### 目标

把 `limitToolResult` 4 个非-knowledge `substring` 站点与 `limitFileContent` 两分支由纯头改为首+尾保留，marker tag = `tool-result snip`（与 L1 / read 入口可区分）；`knowledge` 分支刻意保留纯头并加注释；`limitSearchResult`/`limitSearchResultObj` 不改。A-1b 单测/验收独立于 A-1。

#### 现状代码（`ContextWindow.ts` :1040-1091 导出函数 + :1184-1209 file-local）

```ts
export function limitToolResult(toolName: string, result: unknown, quota: ToolResultQuota) {
  const { maxChars = 4000, maxMatches = 10 } = quota;
  if (toolName === 'knowledge') {
    const raw = typeof result === 'string' ? result : JSON.stringify(result);
    return raw.length > 500 ? raw.substring(0, 500) : raw;            // :1046
  }
  if (toolName === 'code') {
    if (typeof result === 'string' && /^\d+ matches/.test(result)) {
      return result.length > maxChars
        ? `${result.substring(0, maxChars)}\n... [search truncated]`  // :1054
        : result;
    }
    if (typeof result === 'object' && result !== null &&
      ((result as SearchResultLike).matches || (result as SearchResultLike).batchResults)) {
      if ((result as SearchResultLike).batchResults) {
        const limited: SearchResultLike = { ...(result as SearchResultLike) };
        const batchResults = limited.batchResults ?? {};
        const perKeyChars = Math.floor(maxChars / Object.keys(batchResults).length);
        for (const [key, sub] of Object.entries(batchResults)) {
          batchResults[key] = limitSearchResultObj(sub, Math.min(maxMatches, 3), perKeyChars);
        }
        const raw = JSON.stringify(limited);
        return raw.length > maxChars ? `${raw.substring(0, maxChars)}\n... [batch truncated]` : raw;  // :1072
      }
      return limitSearchResult(result, maxMatches, maxChars);
    }
    if (typeof result === 'object' && result !== null && (result as FileResultLike).batchResults) {
      const raw = JSON.stringify(result);
      return raw.length > maxChars ? `${raw.substring(0, maxChars)}\n... [batch truncated]` : raw;  // :1080
    }
    return limitFileContent(result, maxChars);
  }
  const raw = typeof result === 'string' ? result : JSON.stringify(result);
  if (raw.length > maxChars) {
    return `${raw.substring(0, maxChars)}\n... [truncated, ${raw.length} total chars]`;  // :1088
  }
  return raw;
}
```

```ts
function limitFileContent(result: unknown, maxChars: number) {
  if (typeof result === 'string') {
    return result.length > maxChars ? `${result.substring(0, maxChars)}\n... [truncated]` : result;  // :1187
  }
  if (!result || typeof result !== 'object') {
    return JSON.stringify(result || {});
  }
  const src = result as FileResultLike;
  const limited: FileResultLike = { ...src };
  if (limited.content && limited.content.length > maxChars) {
    const lines = limited.content.split('\n');
    let truncated = '';
    for (const line of lines) {
      if (truncated.length + line.length + 1 > maxChars) {
        break;
      }
      truncated += `${line}\n`;
    }
    limited.content = `${truncated}... [truncated at ${maxChars} chars, total ${src.content?.length}]`;
  }
  return JSON.stringify(limited);
}
```

#### 目标代码

`limitToolResult` 4 站点改 `snipHeadTail(x, maxChars, LIMIT_SNIP_MARKER_TAG)`（marker 自带说明，去掉外层 `\n... [..]` 后缀）；`knowledge` 加注释保留纯头：

```ts
  if (toolName === 'knowledge') {
    const raw = typeof result === 'string' ? result : JSON.stringify(result);
    // 刻意保持纯头：knowledge.submit 回显短、尾部无高信号，500 字硬上限只为防超长回显（A-1b 不改此处）。
    return raw.length > 500 ? raw.substring(0, 500) : raw;
  }
```

```ts
    // :1054  V2 纯文本搜索结果（尾部常含 "showing M of N" 汇总）
    if (typeof result === 'string' && /^\d+ matches/.test(result)) {
      return result.length > maxChars ? snipHeadTail(result, maxChars, LIMIT_SNIP_MARKER_TAG) : result;
    }
    // :1072  V1 batch 搜索
        const raw = JSON.stringify(limited);
        return raw.length > maxChars ? snipHeadTail(raw, maxChars, LIMIT_SNIP_MARKER_TAG) : raw;
    // :1080  文件内容 batch
    if (typeof result === 'object' && result !== null && (result as FileResultLike).batchResults) {
      const raw = JSON.stringify(result);
      return raw.length > maxChars ? snipHeadTail(raw, maxChars, LIMIT_SNIP_MARKER_TAG) : raw;
    }
    return limitFileContent(result, maxChars);
  }
  // :1088  通用字符串
  const raw = typeof result === 'string' ? result : JSON.stringify(result);
  if (raw.length > maxChars) {
    return snipHeadTail(raw, maxChars, LIMIT_SNIP_MARKER_TAG);
  }
  return raw;
```

`limitFileContent` 字符串分支 + 行级 content 分支改首+尾（整行边界，marker tag 用 `LIMIT_SNIP_MARKER_TAG`）：

```ts
function limitFileContent(result: unknown, maxChars: number) {
  if (typeof result === 'string') {
    return result.length > maxChars ? snipHeadTail(result, maxChars, LIMIT_SNIP_MARKER_TAG) : result;
  }
  if (!result || typeof result !== 'object') {
    return JSON.stringify(result || {});
  }
  const src = result as FileResultLike;
  const limited: FileResultLike = { ...src };
  if (limited.content && limited.content.length > maxChars) {
    // A-1b：文件内容保留尾部整行（尾部常是 imports/exports/收尾结构），头 80% / 尾 15% 字符预算。
    const headBudget = Math.floor(maxChars * 0.8);
    const tailBudget = Math.floor(maxChars * 0.15);
    const lines = limited.content.split('\n');
    let head = '';
    for (const line of lines) {
      if (head.length + line.length + 1 > headBudget) {
        break;
      }
      head += `${line}\n`;
    }
    let tail = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (tail.length + line.length + 1 > tailBudget) {
        break;
      }
      tail = `${line}\n${tail}`;
    }
    const omitted = src.content?.length ?? 0;
    limited.content =
      `${head}... [${LIMIT_SNIP_MARKER_TAG}: file content truncated, total ${omitted} chars] ...\n${tail}`;
  }
  return JSON.stringify(limited);
}
```

#### 触碰点与签名

| 类别 | 标识 | 变更 |
|---|---|---|
| 导出函数 | `limitToolResult(toolName,result,quota)`（:1040） | 改 4 个 substring 站点；签名/返回 `string` 不变 |
| file-local 函数 | `limitFileContent(result,maxChars)`（:1184） | 改 2 处；签名/返回不变 |
| 不变 | `limitSearchResult`/`limitSearchResultObj`（:1099/:1144） | **不改**（topN+per-match context 截断，非丢尾问题） |

公共契约：`limitToolResult` 已导出符号（`index.ts:1` + `AgentRuntime.ts`/`MessageAdapter.ts` 消费），**签名与返回类型不变**，消费方零改动；不进 `code.ts` handler、不碰内核信封。

#### 边界与陷阱处置

- **marker 可区分**：limit 层 `tool-result snip` ≠ `compaction snip` ≠ `batch read budget`。
- **`knowledge` 刻意不改**：加注释说明 500 字硬上限是另一语义（防超长 submit 回显），避免后续误判漏改。
- **`limitFileContent` 整行边界**：不直接复用 `snipHeadTail`（在整行边界切以保 JSON-内嵌源码可读性），但 marker tag 一致。调用方 `limitToolResult`（:1080 路径）对其返回值不二次截断，与现状一致、无回归。
- **不改 `limitSearchResult*`**：改它们会动 match 排序/结构，违重放确定性。

#### 单测

目标文件同上，直接对导出符号 `limitToolResult` 单测。

```ts
describe('A-1b limitToolResult/limitFileContent head+tail', () => {
  it('keeps tail of a generic oversized string result', () => {
    const big = `START_HEAD${'y'.repeat(5000)}END_TAIL_match_count=17`;
    const out = limitToolResult('shell', big, { maxChars: 500 });
    expect(out).toContain('START_HEAD');
    expect(out).toContain('END_TAIL_match_count=17');
    expect(out).toContain('tool-result snip');
    expect(out).not.toContain('compaction snip');
    expect(out).not.toContain('batch read budget');
  });

  it('keeps tail of a code batch-truncated result', () => {
    // 对抗修正#1（FOLD）：原规格断言 toContain('k49') 为假阳——尾窗只剩值片段，键 token
    // 落在省略区。改断尾部值片段（c49）+ marker，不断键名。
    const padded = { batchResults: Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [`k${i}`, { content: `c${i}`.repeat(40) }]),
    ) };
    const out = limitToolResult('code', padded, { maxChars: 400, maxMatches: 3 });
    expect(out.length).toBeLessThanOrEqual(500);
    expect(out).toContain('tool-result snip');
    expect(out).toContain('c49');   // 尾部值片段存活（旧纯头实现会丢）
  });

  it('keeps tail of file content (last lines survive)', () => {
    const content = ['IMPORTS_HEADER', ...Array.from({ length: 400 }, (_, i) => `line${i}`), 'EXPORTS_FOOTER'].join('\n');
    const out = limitToolResult('code', { content }, { maxChars: 600 });
    expect(out).toContain('IMPORTS_HEADER');
    expect(out).toContain('EXPORTS_FOOTER');   // 尾整行存活
    expect(out).toContain('tool-result snip');
  });
});
```

> 对抗修正#1 已折入（断 `c49` 值片段而非键名 `k49`）。修正#2/#3 属 A-1 公共 helper / A-1 用例，已在 Phase 1 落实。

#### 真跑验收

- 构造返回超大 result 的真工具调用（如 `code` 大目录 batch read），run 后 dump `limitToolResult` 产物，`grep 'tool-result snip'` 命中且尾片段在；对该 limit 产物 `grep -c 'batch read budget'` = 0（证两层不混淆）。

#### 验收标准

- [ ] `limitToolResult` 4 个非-knowledge 站点（:1054/:1072/:1080/:1088）改 `snipHeadTail(..., LIMIT_SNIP_MARKER_TAG)`；`knowledge`（:1046）刻意保留并加注释。
- [ ] `limitFileContent` 字符串分支（:1187）与行级 content 分支改首+尾，tag=`tool-result snip`。
- [ ] `limitSearchResult`/`limitSearchResultObj` 未改动。
- [ ] 单测：通用字符串 / code batch（断尾部值片段 `c49`）/ file content 三路尾部存活，marker=`tool-result snip` 且 ≠ 另两层；A-1b 单测组独立绿。
- [ ] 真跑 dump：`grep 'tool-result snip'` 命中、`grep -c 'batch read budget'`=0。

---

### Phase 2 — A-2 召回记忆陈旧度标注（render-only）

#### 目标

CG-1：召回记忆 `updatedAt`（回退 `lastAccessedAt`）> 7 天加软前缀 `⏳[可能陈旧] `，提示 host-agent 对照当前源码核实；新鲜记忆零噪声；render-only（不写 DB、不改 `MemoryStore`/Core schema）；覆盖**全 source**（`bootstrap` + `user` 两路经同一 builder）；camelCase + `Number.isNaN` 守卫显式处置无效时间戳（unknown-age 不标注、不抛错）。

#### 现状代码（`MemoryRetriever.ts` :226-236，builder :230-233）

```ts
    if (memories.length === 0) {
      return '';
    }
    const lines = memories.map((m) => {
      const badge = m.importance >= 8 ? '⚠️' : m.importance >= 5 ? '📌' : '💡';
      return `- ${badge} [${m.type}] ${m.content}`;
    });
    return `\n## 项目记忆 (${memories.length} 条最相关)\n${lines.join('\n')}\n`;
  }
```

契约佐证（不改）：`DeserializedMemory` camelCase `lastAccessedAt`/`updatedAt`（`MemoryStore.ts:98-116`，`deserialize` :569-588，`updatedAt: row.updated_at` :579）；陷阱锚点—`retrieve()` :127-129、`load()` :247-248 对 raw row 用 snake_case；builder 入参为已 deserialize 的 camelCase。

#### 目标代码

新增常量（紧接 `SIMILARITY_UPDATE` 之后，约 :31）：

```ts
/** 召回记忆陈旧度阈值（天）。CG-1：>7 天加软前缀；≤7 天不加任何前缀（零噪声）。 */
const STALE_MEMORY_DAYS = 7;
/** 陈旧软提示前缀（render-only，不改任何持久化字段/Core schema），作确定性验收 grep marker。 */
const STALE_MEMORY_PREFIX = '⏳[可能陈旧] ';
```

新增 private 静态 helper（类内，紧接 `static #computeRelevance`，:366 附近）：

```ts
  /**
   * 单条召回记忆陈旧软前缀（render-only，CG-1）。
   * 陷阱钉死：age 从 camelCase m.updatedAt（回退 m.lastAccessedAt）算 —— builder 喂入的是
   * DeserializedMemory，绝不能用 raw row snake_case（那会 undefined → NaN）。
   * 无效/缺失时间戳 → 显式 return ''（unknown-age 不标注，不把 NaN 当"很旧"，不抛错）。
   */
  static #stalenessPrefix(m: DeserializedMemory, now: number): string {
    const stamp = m.updatedAt || m.lastAccessedAt || m.updatedAt;  // 优先 updatedAt，空才看 lastAccessedAt
    const ts = stamp ? new Date(stamp).getTime() : Number.NaN;
    if (Number.isNaN(ts)) {
      return '';   // unknown-age：不标注
    }
    const ageDays = (now - ts) / 86400_000;
    return ageDays > STALE_MEMORY_DAYS ? STALE_MEMORY_PREFIX : '';
  }
```

builder 插前缀（:230-233）：

```ts
    const now = Date.now();
    const lines = memories.map((m) => {
      const badge = m.importance >= 8 ? '⚠️' : m.importance >= 5 ? '📌' : '💡';
      // CG-1：>7 天召回记忆加软前缀，提示对照当前源码核实；新鲜记忆不加噪。
      const stale = MemoryRetriever.#stalenessPrefix(m, now);
      return `- ${badge} ${stale}[${m.type}] ${m.content}`;
    });
    return `\n## 项目记忆 (${memories.length} 条最相关)\n${lines.join('\n')}\n`;
```

前缀插在 badge 与 `[type]` 之间；新鲜记忆 `stale=''`，行与改前逐字符相同。

#### 触碰点与签名

| 类型 | 符号 | 改动 |
|---|---|---|
| 新增常量 | `STALE_MEMORY_DAYS`、`STALE_MEMORY_PREFIX`（~:31） | 新增 |
| 新增静态方法 | `MemoryRetriever.#stalenessPrefix(m, now)` | private，不导出 |
| 改方法体 | `MemoryRetriever.toPromptSection`（:194-236） | builder 插前缀；签名/返回 `Promise<string>` 不变 |

公共契约：无新增 import（`DeserializedMemory` 已 type-import :16，`Date.now` 全局）；`PersistentMemory.toPromptSection`/`MemoryCoordinator` 接口不变；无新增 `DeserializedMemory` 字段；Core/`semantic_memories`/raw-SQL adapter（SD-4 :13-26 冻结）零改动；不碰工具内核信封。

#### 边界与陷阱处置

- **camelCase 钉死**：`#stalenessPrefix` 只读 `m.updatedAt`/`m.lastAccessedAt`；builder 入参 `DeserializedMemory` 无 snake_case 键 → 误用 `m.updated_at` 编译失败（类型门拦死）。单测经真 `deserialize` 路径兜底。
- **NaN/缺失显式处置**：`Number.isNaN(ts)` 守卫显式 `return ''`，注释钉死 unknown-age 不标注、不抛错。
- **render-only / SD-4**：只新增渲染层常量 + 纯 static 函数 + 字符串插值；无 DB 写、无 `MemoryStore`/Core schema 改动。
- **新鲜零噪声**：`ageDays > 7` 才返回前缀，否则空串。
- **全 source（CG-1）**：改 builder 本体，覆盖 `bootstrap`（`insightAnalyst.ts:390`）+ `user`（`MemoryCoordinator.ts:798`）。

#### 单测

目标文件：`/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/test/memory-context.test.ts`。**fixture 硬约束**：经真 `store.add` → `getAllActive`/`get` → `deserialize` 路径，**不得手搓 camelCase 字面量**（否则大小写漂移 bug 不变红）；用 `db.prepare("UPDATE semantic_memories SET updated_at=?, last_accessed_at=? WHERE id=?")` 改时间戳造"旧"记忆（测试夹具操作 raw row，非产品代码搬移）。

> 执行注意（对抗 caveat，FOLD）：`MemoryRetriever` **未从 `src/index.ts` 导出**——import 必须走 `'../src/agent/memory/MemoryRetriever.js'` 直接路径（先 `grep "MemoryRetriever" src/index.ts` 确认；index barrel 路径会编译失败）。

```ts
import { MemoryStore } from '../src/agent/memory/MemoryStore.js';
import { MemoryRetriever } from '../src/agent/memory/MemoryRetriever.js';
import Database from 'better-sqlite3';

describe('MemoryRetriever staleness annotation (A-2)', () => {
  function makeRetrieverWith(rows: Array<{ content: string; ageDays: number | null }>) {
    const db = new Database(':memory:');
    const store = new MemoryStore(db);
    for (const r of rows) {
      const { id } = store.add({ content: r.content, source: 'bootstrap', importance: 6 });
      if (r.ageDays === null) {
        db.prepare('UPDATE semantic_memories SET updated_at = ?, last_accessed_at = ? WHERE id = ?').run('', null, id);
      } else {
        const stamp = new Date(Date.now() - r.ageDays * 86400_000).toISOString();
        db.prepare('UPDATE semantic_memories SET updated_at = ?, last_accessed_at = ? WHERE id = ?').run(stamp, null, id);
      }
    }
    return { store, db, retriever: new MemoryRetriever(store) };
  }

  it('annotates memories older than 7 days with the stale prefix', async () => {
    const { db, retriever } = makeRetrieverWith([{ content: 'STALE_ITEM', ageDays: 30 }]);
    try {
      const out = await retriever.toPromptSection({ source: 'bootstrap' });
      expect(out).toContain('STALE_ITEM');
      expect(out).toMatch(/⏳\[可能陈旧\] \[.*\] STALE_ITEM/);
    } finally { db.close(); }
  });

  it('does NOT annotate fresh memories (<=7 days)', async () => {
    const { db, retriever } = makeRetrieverWith([{ content: 'FRESH_ITEM', ageDays: 1 }]);
    try {
      const out = await retriever.toPromptSection({ source: 'bootstrap' });
      expect(out).toContain('FRESH_ITEM');
      expect(out).not.toContain('⏳[可能陈旧]');
    } finally { db.close(); }
  });

  it('treats missing/invalid timestamp as unknown-age (NaN guard, no annotation)', async () => {
    const { db, retriever } = makeRetrieverWith([{ content: 'NAN_ITEM', ageDays: null }]);
    try {
      const out = await retriever.toPromptSection({ source: 'bootstrap' });
      expect(out).toContain('NAN_ITEM');
      expect(out).not.toContain('⏳[可能陈旧]');
    } finally { db.close(); }
  });

  it('falls back to lastAccessedAt when updatedAt empty, via real deserialize', async () => {
    const db = new Database(':memory:');
    const store = new MemoryStore(db);
    try {
      const { id } = store.add({ content: 'FALLBACK_ITEM', source: 'bootstrap', importance: 6 });
      const oldStamp = new Date(Date.now() - 30 * 86400_000).toISOString();
      db.prepare('UPDATE semantic_memories SET updated_at = ?, last_accessed_at = ? WHERE id = ?').run('', oldStamp, id);
      const out = await new MemoryRetriever(store).toPromptSection({ source: 'bootstrap' });
      expect(out).toMatch(/⏳\[可能陈旧\] \[.*\] FALLBACK_ITEM/);
    } finally { db.close(); }
  });
});
```

> query-less 分支（:215-223 `getAllActive`→`deserialize`）无需 embedding/provider，离线满足 CLAUDE.md。

#### 真跑验收

1. **§8 prompt dump（grep，非肉眼）**：真 bootstrap 跑 dump `insightAnalyst` §8 section（`source:'bootstrap'` 经 :390），语料含已知 >7 天与 ≤7 天各 ≥1 条：`grep -F '⏳[可能陈旧]'` 命中 ≥ 旧记忆条数；每条新鲜记忆行不含 marker；附 `updatedAt` 值佐证 age 计算一致。
2. **全 source 覆盖（CG-1 载重）**：另触发 `MemoryCoordinator` `source:'user'` 召回（:798），同样 grep marker，证 builder 改动覆盖**所有** source 非仅 bootstrap。
3. **production-floor parity（硬门，全 source 语料）**：固定覆盖**全部召回 source** 的代表性 Recipe 语料，改前 capture `runInProcessRecipeAuthoringGate → Core validateAgainst`（`test/recipe-authoring-inprocess-parity.test.ts`）verdict JSON 为基线，改后 `diff`；PASS = 逐字节空 diff。
4. host vs in-process parity standing tripwire 全绿。

#### 验收标准

- [ ] 仅新增 `STALE_MEMORY_DAYS`/`STALE_MEMORY_PREFIX`/`#stalenessPrefix` + builder 插前缀；`git diff --stat` 仅 `MemoryRetriever.ts` + `test/memory-context.test.ts`。
- [ ] `MemoryStore.ts`/`insightAnalyst.ts`/Core schema/raw-SQL adapter 零改动。
- [ ] age 取 camelCase `m.updatedAt`（回退 `lastAccessedAt`）；含 `Number.isNaN` 守卫，无效时间戳不标注、不抛错。
- [ ] `npm run build:check`（tsc）通过（误用 snake_case 则编译失败）。
- [ ] 4 单测全绿、离线，经真 `deserialize` 路径，确定性 grep marker 断言。
- [ ] 真跑 §8 dump：>7 天带 `⏳[可能陈旧]`、≤7 天不带（grep + `updatedAt` 佐证）。
- [ ] 全 source 验证：`bootstrap`（:390）与 `user`（:798）两路均观察到改动生效。
- [ ] production-floor parity：全 source 语料 verdict JSON 改前/改后逐字节空 diff（有 baseline-capture，可证伪）。

---

### Phase 3 — B-1 写前新鲜度门（read-before-write, TOCTOU）

#### 目标

CG-3 硬拒 + 重读引导；CG-4 复用既有 `deltaCache` 内容哈希（不新增 `registry.ts` 字段）；**新文件判定以"写时磁盘存在性"为准**（非 cache 成员性，堵 TOCTOU 洞）；read 与 write 共享 per-run `deltaCache` 实例由真 run 插桩证明，**不共享 → 判 blocked 非 done**（HARD GATE）。

> 前置准入（已核验）：`AlembicCore/src/infrastructure/io/WriteZone.ts` 是落点守护三区（`pathGuard.assertProjectWriteSafe` :203），grep `lastRead|mtime|hash|freshness|external` 零命中 → Core 无可消费的 read-before-write 原语 → B-1 留 Agent 层成立，不越界 Core。

#### 现状代码（`code.ts` :765-796 `handleWrite`；:433-480 `readSingleFile` deltaCache :459；`registry.ts` :143-264）

```ts
const PROTECTED_PATHS = ['.git', 'node_modules', '.env'];     // code.ts:765

async function handleWrite(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {  // :767
  const filePath = params.path as string;
  const content = params.content as string;
  const createDirs = (params.createDirectories as boolean) ?? false;
  if (!filePath || content === undefined) {
    return fail('code.write requires path and content');
  }
  const resolved = resolveProjectFilePath(filePath, ctx.projectRoot);
  if (!resolved.ok) {
    return fail(resolved.error);
  }
  for (const p of PROTECTED_PATHS) {                          // :781
    if (resolved.relPath === p || resolved.relPath.startsWith(`${p}/`)) {
      return fail(`Write denied: ${p} is a protected path`);
    }
  }
  try {
    if (createDirs) {
      await fs.mkdir(path.dirname(resolved.absPath), { recursive: true });
    }
    await fs.writeFile(resolved.absPath, content, 'utf-8');   // :791
    return ok({ written: filePath, bytes: Buffer.byteLength(content) });
  } catch (err: unknown) {
    return fail(`Write failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
```

```ts
// readSingleFile :458-459 —— 读时写入指纹（副作用）
  if (ctx.deltaCache) {
    const delta = ctx.deltaCache.check(resolved.relPath, content);   // :459  key=relPath
```

```ts
// registry.ts
  deltaCache?: DeltaCacheLike;          // :144
export interface DeltaCacheLike {       // :257
  get(path: string): { hash: string; content: string } | undefined;   // :258
  set(path: string, hash: string, content: string): void;
  check(path: string, currentContent: string): { mode: 'unchanged' | 'delta' | 'full'; content: string; lineCount: number };
}
```

per-run 实例锚：`ToolRouterAdapter.execute` :90 `ctx = this.#contextFactory.create(request)`；`src/` 内 `new DeltaCache(` 零命中（仅测试）→ 共享性取决于宿主注入工厂（`AgentRuntimeBoundary.ts:85` `'ToolContextFactory inputs'` ∈ `hostOwns`）→ 须真 run 证明。

#### 目标代码

仅改 `code.ts`，**不改 `registry.ts`**（CG-4）。顶部新增 import + 常量 + helper（`PROTECTED_PATHS` 之后、`handleWrite` 之前）：

```ts
import { createHash } from 'node:crypto';   // 顶部 import 区新增
```

```ts
const PROTECTED_PATHS = ['.git', 'node_modules', '.env'];

// 写前新鲜度门：与 deltaCache.check() 内部一致的内容指纹（node:crypto md5），
// 使"写时磁盘内容"与"读时缓存指纹"可比。DeltaCache 算法将来变更须同步本 helper。
function freshnessFingerprint(content: string): string {
  return createHash('md5').update(content).digest('hex');
}

// CG-3 硬拒 + 重读引导文案，稳定可被验收 harness grep，不得随意改写。
const REREAD_GUIDANCE =
  'Re-read the file with code.read before writing, then retry code.write with content based on the current version.';
```

`handleWrite` 在 `PROTECTED_PATHS` 循环之后、写盘之前插四态门，写成功后更新基线：

```ts
  for (const p of PROTECTED_PATHS) {
    if (resolved.relPath === p || resolved.relPath.startsWith(`${p}/`)) {
      return fail(`Write denied: ${p} is a protected path`);
    }
  }

  // ── B-1 写前新鲜度门（read-before-write, TOCTOU）──────────────────────
  // 新文件判定 key 在"写时磁盘是否存在"，非"cache 是否有记录"：磁盘已存在但本 run 未读的
  // 文件（上一轮产物或并发 host rescan/job 写的）必须走"已存在"分支，否则被当新文件放行
  // → 重开 TOCTOU 洞。deltaCache 未注入时门降级透传，由 PROTECTED_PATHS 兜底。
  const freshness = await checkWriteFreshness(resolved.absPath, resolved.relPath, ctx);
  if (!freshness.ok) {
    return fail(freshness.error);
  }
  // ────────────────────────────────────────────────────────────────────

  try {
    if (createDirs) {
      await fs.mkdir(path.dirname(resolved.absPath), { recursive: true });
    }
    await fs.writeFile(resolved.absPath, content, 'utf-8');
    // 写成功后更新读时指纹，使后续 read/write 以新内容为基线（指纹一致态）。
    ctx.deltaCache?.set(resolved.relPath, freshnessFingerprint(content), content);
    return ok({ written: filePath, bytes: Buffer.byteLength(content) });
  } catch (err: unknown) {
    return fail(`Write failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * 写前新鲜度判定（四态，CG-3 硬拒 + CG-4 复用 deltaCache 哈希）：
 *   1. 磁盘存在 ∧ 无指纹（本 run 未读）        → 拒：must read first
 *   2. 磁盘存在 ∧ 已读 ∧ 当前磁盘指纹 ≠ 读时指纹 → 拒：changed externally
 *   3. 磁盘存在 ∧ 已读 ∧ 指纹一致              → 准
 *   4. 磁盘不存在                              → 准（新文件）
 * deltaCache 未注入：透传（不误拒合法写，安全退回 PROTECTED_PATHS）。key 用 relPath（与 :459 一致）。
 */
async function checkWriteFreshness(
  absPath: string,
  relPath: string,
  ctx: ToolContext
): Promise<{ ok: true } | { ok: false; error: string }> {
  // 态 4：以磁盘存在性为准 —— 堵 TOCTOU 洞的关键。
  let diskContent: string;
  try {
    diskContent = await fs.readFile(absPath, 'utf-8');
  } catch (err: unknown) {
    // ENOENT → 新文件放行；其它读错误（权限等）不在新鲜度门职责内，透传给写盘报错。
    return { ok: true };
  }

  if (!ctx.deltaCache) {
    return { ok: true };   // 门不可用：透传，避免误拒合法写。
  }

  const cached = ctx.deltaCache.get(relPath);
  if (!cached) {
    // 态 1：磁盘已存在但本 run 未读 → 硬拒，要求先读。
    return {
      ok: false,
      error: `code.write rejected: ${relPath} exists on disk but was not read in this run. ${REREAD_GUIDANCE}`,
    };
  }

  const diskFingerprint = freshnessFingerprint(diskContent);
  if (cached.hash !== diskFingerprint) {
    // 态 2 / CG-3：硬拒 + 重读引导，不静默覆盖、不仅记日志。
    return {
      ok: false,
      error: `code.write rejected: ${relPath} changed externally since last read. ${REREAD_GUIDANCE}`,
    };
  }
  return { ok: true };   // 态 3：一致 → 准。
}
```

> 对抗修正（FOLD，cosmetic）：原规格 ENOENT catch 含两条 `return {ok:true}`（ENOENT 分支 + 非-ENOENT fallthrough），值相同冗余。此处合并为单一 `return {ok:true}`（非-ENOENT 读错误同样透传给写盘暴露 OS 错误），语义不变、去掉评审会标的冗余分支。

#### 触碰点与签名

| 类别 | 项 | 性质 |
|---|---|---|
| 改 函数 | `handleWrite(params,ctx):Promise<ToolResult>`（:767） | 签名不变；体内插门 + 写后 `set` |
| 新 函数 | `checkWriteFreshness(absPath,relPath,ctx)` | 文件内私有 |
| 新 函数 | `freshnessFingerprint(content):string` | 文件内私有 |
| 新 常量 | `REREAD_GUIDANCE` | 文件内私有，稳定文案 |
| 新 import | `import { createHash } from 'node:crypto'` | 顶部 |
| 复用（零改动） | `ctx.deltaCache?.get(relPath).hash` / `.set(...)`（`DeltaCacheLike`） | 现有接口 |

公共契约：`ToolResult{ok,data,error,_meta}` 信封不变（门失败走既有 `fail`，态 3/4 走既有 `ok`）；`{tool,action}`/`code.write` spec（`registry.ts:120-136` `concurrency:'exclusive'`/`risk:'write'`）不动；`ToolContext`/`DeltaCacheLike` 不新增字段（CG-4）；无新 LLM 工具、无新模型往返。

#### 边界与陷阱处置

- **陷阱① 磁盘存在性优先于 cache 成员性**：`checkWriteFreshness` 先 `fs.readFile(absPath)`，ENOENT 才放行（态 4）；磁盘存在 ∧ `cached===undefined` 走态 1 硬拒，而非"not in cache → 当新文件放行"。
- **陷阱② read/write 共享 per-run `deltaCache`**：本仓 `src/` 无 `new DeltaCache`，工厂宿主注入；目标码依赖共享（读侧 :459 `check` 写指纹，写侧 `get` 读同 key）。**不能用单测手传 ctx 替代共享证明**，须 §真跑 instanceId 插桩；不共享 → **判 blocked**（HARD GATE）。
- **陷阱③ CG-3 硬拒 + 引导**：态 1/2 返回 `fail` 含 `REREAD_GUIDANCE` + `exists on disk but was not read` / `changed externally since last read` 稳定 grep 串，不静默覆盖、不仅记日志。

#### 单测

目标文件：`/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/test/tool-v2-contract.test.ts`。复用 `llm-input-correctness.test.ts:49` 的 `toolContext(root, deltaCache?)` 模式构造**共享同一 `deltaCache` 实例**的 ctx；驱动用 `router.execute({tool:'code',action:'read'|'write',params}, ctx)`（真路由路径，非直调 `handleWrite`）；fixture 用 `mkdtemp` 临时目录（离线）。新增确定性用例：

1. **态 4 新文件放行**：磁盘不存在的 `src/new.ts` 直接 `code.write` → `ok===true`；断言文件已落盘内容相等。
2. **态 1 磁盘已存在但本 run 未读 → 拒**（与态 4 独立区分）：先 `fs.writeFile` 预置（不经 `code.read`），同 ctx `code.write` → `ok===false` 且 `error` 含 `'exists on disk but was not read'` + `'Re-read the file with code.read'`。
3. **态 3 读后一致 → 准**：`code.read('src/a.ts')` → 同 ctx `code.write` → `ok===true`。
4. **态 2 读后被外部改 → 拒**：`code.read` → 带外 `fs.writeFile` 改盘 → 同 ctx `code.write` → `ok===false`，`error` 含 `'changed externally since last read'` + `REREAD_GUIDANCE`。
5. **写后基线更新**：态 3 写成功后立即同 ctx 再 `code.write`（无带外改）→ `ok===true`（证 `set` 更新指纹，不因"写后内容≠旧读指纹"误拒）。
6. **deltaCache 未注入透传**：`toolContext(root)`（无 deltaCache）对磁盘已存在文件 `code.write` → `ok===true`。
7. **共享实例契约（单测级守卫）**：同一 `deltaCache` 两次传入 → read 后 write 命中态 3；换**不同** `new DeltaCache()` 传给 write → 命中态 1 被拒。显式注释：只证逻辑，**不替代** §真跑 HARD GATE。

#### 真跑验收

1. **共享 ctx 插桩证据（HARD GATE）**：真 bootstrap/scan 维度跑前，在工厂注入的 `DeltaCache` 上加一次性 `#instanceId = randomUUID()`（仅插桩期），`handleRead`（:459 `check` 后）与 `checkWriteFreshness`（`get` 后）各打带该 id 的诊断行；dump 该维度 run 日志，`grep` 两条 instanceId 相等。**不等 → 工厂每 `create()` 新建 deltaCache，B-1 判 blocked**，回报"宿主工厂未在 run 级共享 deltaCache"附日志。
2. **首写新 Recipe 文件不被误拒（回归重点）**：对抗修正（FOLD，§6.2 强化）—— 不用 run-wide 负向 grep（缺席可因写未执行/日志被抑制假过），改**正向 call-scoped 断言**：定位该次写的 `ToolResultEnvelope`，断言 `ok===true` ∧ `data.written === <path>` ∧ 磁盘内容等于所写。
3. **读后被外部改被拦**：构造一次 `code.read` 后带外 `fs.writeFile` 改同文件再 `code.write` → dump 该次 `ToolResultEnvelope.text`，`grep 'changed externally since last read'`，且确认磁盘内容未被覆盖（带外内容仍在）。
4. **production-floor parity**（统一硬门）：全 source 代表性 Recipe 语料，改前 capture `runInProcessRecipeAuthoringGate → Core validateAgainst` verdict JSON 基线，改后 `diff` = 空（B-1 不改 prompt 文本，预期天然空，但须出具 diff 证据使其可证伪 —— 此门仅作回归 tripwire，B-1 真实行为信号在证据 1-3）。
5. 离线 `npm test`（含 build/typecheck/lint:core-import-boundary）全绿，不依赖真 key。

#### 验收标准

- [ ] 前置：已出具 `WriteZone`/`pathGuard` grep 证据，确认 Core 无 read-before-write 原语，B-1 留 Agent 层。
- [ ] `handleWrite` 在 `PROTECTED_PATHS` 之后、`fs.writeFile` 之前调 `checkWriteFreshness`；门失败走 `fail`。
- [ ] 四态齐全且**磁盘存在性优先于 cache 成员性**（态 4 ENOENT 放行；态 1 磁盘存在+无缓存硬拒）。
- [ ] CG-3：态 1/2 返回硬拒 `fail`，含稳定 `REREAD_GUIDANCE` + `changed externally since last read` / `exists on disk but was not read` 串；无静默覆盖。
- [ ] CG-4：复用 `ctx.deltaCache.get(relPath).hash`，`registry.ts` 零新增字段；指纹与 `DeltaCache` md5 对齐；key 用 `relPath`。
- [ ] 写成功后 `ctx.deltaCache?.set(relPath, fingerprint, content)` 更新基线；`deltaCache` 未注入门透传。
- [ ] 公共契约不变：`ToolResult` 信封 / `{tool,action}` / `code.write` spec / `ok()`/`fail()`；无新 LLM 工具、无新模型往返。
- [ ] 单测 1-7 全绿确定（含态 1/态 4 独立区分、共享实例守卫）。
- [ ] **HARD GATE**：真 run 共享 ctx 插桩 instanceId 相等。**不等 → 回填 blocked 非 done**。
- [ ] 真跑：首写新 Recipe 文件正向 call-scoped 断言（`ok` ∧ `data.written` ∧ 磁盘内容）；读后被外部改被拦 envelope 已 dump；floor verdict baseline diff = 空。

---

### 跨阶段统一硬门

每相位完成均须通过下列统一硬门，缺一不可：

- **离线 `npm test` 全绿（mock provider，无真 key）**：`vitest run` 离线执行，所有新增/既有用例绿；不依赖任何真实模型 key（遵 CLAUDE.md）。Phase 3 另含 build/typecheck/`lint:core-import-boundary` 绿。
- **production-floor verdict baseline capture-then-diff**：每相位改前对**全 source 代表性 Recipe 语料**（CG-1 决定的全 source 范围）capture `runInProcessRecipeAuthoringGate → Core validateAgainst`（`test/recipe-authoring-inprocess-parity.test.ts`）verdict JSON 为提交基线，改后同语料重跑 `diff`；**PASS = 逐字节空 diff**。A-1/A-1b/B-1 不碰 prompt 文本预期天然空（作回归 tripwire），A-2 改模型可见 prompt 文本但要求新鲜记忆零噪声故陈旧-free 语料亦应空 —— 含陈旧记忆的语料 prompt-text 有差异时须确认 verdict 不漂。
- **host 路径 vs in-process 路径 parity standing tripwire**：`recipe-authoring-inprocess-parity.test.ts` 全绿，证两宿主路径行为一致。
- **commit-hash + dump 证据（每相位）**：AlembicAgent 本仓 commit（develop-on-main），回填含 commit hash、`vitest run` 输出、真跑 prompt/result dump（含 grep 断言输出）、相位特定证据（Phase 1 两周期 diff；Phase 2 §8 + user-path dump + `updatedAt` 佐证 + floor verdict 对照 JSON；Phase 3 共享 ctx instanceId 两行相等日志 + 首写正向断言 + `changed externally` 拒写 envelope dump + floor diff JSON）、遗留风险、下一步。

---

## 拒绝的批评（briefly，附理由）

- **critique 1 主张「B-1 整体降级 defer，或仅 A-1+A-2 两项」**：**部分采纳、部分拒绝**。采纳「re-spec B-1 在既有 deltaCache 内容哈希」与「A-3 降级」。**拒绝把 B-1 整体降级**：写前无新鲜度校验是 §2 已陈述的正确性弱点（盲覆盖未读/被外部改的文件），与 A-3 的「纯延迟、无正确性弱点」不同质；critique 1 自己也承认「若能举出并发写者消费者则可原样重纳」——而 host rescan/job 与 agent 自身多轮重写构成的并发写场景在无人值守批量跑下是真实的，且 B-1 把损坏改为诚实报错的价值不依赖高频率。故保留 B-1，但收紧机制与完成门。
- **critique 1 主张「CG-3/CG-4 须在确认前定、不可 defer」**：**采纳 CG-3 上移**（reject vs warn 是行为决定，进 CG 让用户拍）。**CG-4（作用域）实质消解**——改用 deltaCache 后，write 面唯一（仅 `System` 持 `code.write`），无「仅 System vs 全部」之分，CG-4 自然合并进 CG-3 的处置语义，不再单列。
- **critique 2 主张「B-1 可能重复 Core WriteZone，须前置核验」**：**采纳为前置准入项**，但**拒绝「移到 Core」**——本轮核验 WriteZone 管落点守护非 read-before-write 新鲜度，B-1 属 Agent tool 层 per-run 生命周期，边界正确。
- **critique 3 主张「A-3 drop 或重设计为跨维度预取」**：**采纳 drop（移 §4.8），保留重设计为重纳条件**。其 `PipelineStrategy.ts:788` 单一阻塞步 + §1–§7 同步拼装的论证本轮已核验属实。

---

## 待用户确认的关键决策 (CG)

1. **A-2 陈旧阈值、措辞与 source 范围**
   - 选项 A：`> 7 天` + 软提示（如「N 天前记录，请对照当前源码核实」）+ 全 source。
   - 选项 B：`> 7 天` + 软提示 + **仅 `bootstrap` source**（缩小 production-floor parity 暴露面）。
   - 选项 C：`> 1 天` + 强提示 + 全 source。
   - **建议：选项 B**。措辞软、阈值 7 天减少噪声；限 `bootstrap` source 把 prompt 文本变更面收窄，使 floor parity 风险最小。此项必须在确认时定（它决定 A-2 改 prompt 的广度，非事后旋钮）。

2. **A-1 head/tail 比例**
   - 选项 A：沿用 read 入口 `clampReadResult` 的 80%/15%，减少认知分叉。
   - 选项 B：L1 因是「旧 round」用更激进的 70%/15% 多省 token。
   - **建议：选项 A**（与 read 入口一致），但须服从 `keepHead+marker+keepTail ≤ TRUNCATE_TO=500` 的幂等硬约束（即按 500 的比例切，不是按原文长度）。

3. **B-1「读后被外部改」处置语义**（CG-4 作用域已并入此项）
   - 选项 A：**硬拒**（返回 `fail('file changed externally since last read')`，要求 agent 重读）。
   - 选项 B：**警告后允许覆盖**（记 diagnostic event，不阻断）。
   - 选项 C：硬拒 + 提供一个 agent 可显式调用的「force re-read then write」恢复链文案。
   - **建议：选项 C**。无人值守下硬拒更安全（避免静默覆盖），但纯硬拒可能卡住 agent 自身合法重写链；故硬拒 + 明确引导重读的 fail 文案。此项必须在确认时定（它决定 B-1 是安全门还是诊断日志，非事后旋钮）。

4. **B-1 新鲜度机制**
   - 选项 A：复用既有 `deltaCache` 内容哈希（本设计推荐路径，零新增写攻击面、优于 mtime 的 false-pos/neg 行为）。
   - 选项 B：新增 `readFileState: Map<absPath, mtimeMs>`（原草案路径，借参考实现 mtime 细节）。
   - **建议：选项 A**。仅当前置核验发现 `deltaCache` 的指纹粒度/生命周期不适配 write 门（如不覆盖某些读路径）时回退选项 B。

5. **A-3 处置确认**
   - 选项 A：移入 §4.8 defer，本需求不交付（本设计已采纳）。
   - 选项 B：保留 in-scope 但重设计为 orchestrator 级跨维度预取，带 p50 可测下降目标（扩大作用域、引入 orchestrator 改动）。
   - **建议：选项 A**。在拿到「§8 await 占维度 wall-clock 可测份额」的 profile 之前不投入；重纳走单独需求。

6. **§4.8 defer 项留痕方式**
   - 选项 A：仅作「观察项」在本需求 ledger 留痕，不进 in-scope。
   - 选项 B：完全另起需求逐项决策。
   - **建议：选项 A**（留痕不扩范围）；A-3 的重纳条件已写明，无需现在另起。

---

相关已核验文件（绝对路径）：
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/src/agent/context/ContextWindow.ts`（`#compactL1` :570/:583；`limitToolResult` :1040；`limitFileContent` :1185）
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/src/agent/memory/MemoryRetriever.ts`（`toPromptSection` :194；snake_case 原始行 :127-129/:247-248）
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/src/agent/memory/MemoryStore.ts`（`deserialize` camelCase :569-579；SD-4 冻结 :14-26）
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/src/agent/prompts/insightAnalyst.ts`（`toPromptSection` await :390 `source:'bootstrap'`；§9 `generateContextForAgent` :406）
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/src/agent/strategies/PipelineStrategy.ts`（`await stage.promptBuilder` :788）
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/src/tools/runtime/handlers/code.ts`（`handleWrite` :767，`fs.writeFile` :791，`handleRead` :329，`deltaCache` 消费 :458-459）
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/src/tools/kernel/registry.ts`（`ToolContext`/`deltaCache` :102/:144）