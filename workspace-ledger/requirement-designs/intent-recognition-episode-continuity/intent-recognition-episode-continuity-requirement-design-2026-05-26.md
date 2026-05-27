# Intent Recognition Episode Continuity 需求设计

Design Key：INTENT-RECOGNITION-2026-05-26
日期：2026-05-26
状态：准备交给 AlembicWorkspace 评审
维护窗口：AlembicDesign
总控：AlembicWorkspace
原始计划：[intent-recognition-episode-continuity-original-plan-2026-05-26.md](intent-recognition-episode-continuity-original-plan-2026-05-26.md)
Source TODO：`GTODO-2026-05-24-037`
配套下游：`INTENT-KNOWLEDGE-2026-05-26`

## 最终目标

重建 Alembic 的第一阶段意图能力：在 `prime` 的快速路径中，不依赖联网 AI，稳定产出可解释的 `RecognizedIntentDraft`，并把每一次 prime 记录为可跨会话续接的 `IntentEpisode`。

这个目标解决的是“意图怎么得到”和“用户多会话开发时意图怎么连续”。它不是替代 `INTENT-KNOWLEDGE-2026-05-26`；后者仍然需要做，用来消费这里产出的 `RecognizedIntentDraft` / `IntentEpisode`。

用户于 2026-05-26 进一步收束：本需求重点是 **意图提取准确、可管理，并能给搜索与向量 cosine 提供参考和增强，最终保证 prime 注入有价值**。因此第一阶段产物不能只是分类标签，而必须是可评分、可追踪、可被检索链路消费的结构化意图。

## 用户确认后的硬约束

1. 现有轻量意图逻辑不做升级，按新目标删除重建。
2. 第一阶段只设计意图识别与产出；消费链路作为配套下游由 `INTENT-KNOWLEDGE-2026-05-26` 承接。
3. `prime` 必须快，不能等待 Alembic 与联网 AI 交互。
4. 可用 AI 上限是本地千问，且只能作为可选 refinement。
5. 用户会持续开启新会话、新窗口、新任务和纠偏，因此意图记录必须跨会话。
6. 必须明确 Plugin 与 Alembic 主体的 AI 能力边界。

## 用户最终确认

2026-05-26 用户确认以下执行默认值：

- 不对 Codex 进行强要求：`hostDeclaredIntent` 是可选强信号，Codex 能判断时建议传，但 Plugin 不能依赖它作为唯一来源。
- 低置信度时 `prime` 可以不强行注入，应该降级、减少注入或要求确认。
- 本地千问此前测试速度较快，且在长句场景相对关键词搜索效果更好；因此可作为长句与复杂意图的优先 refinement 路径，但仍必须有 timeout 与 deterministic fallback。
- 先只推进 `GTODO-2026-05-24-037`，038 / 039 暂不进入自动化执行。

## 现有能力与缺口

### 现有能力

- `alembic_task prime` 已有快速入口。
- Plugin 能从参数拿到 `userQuery`、`activeFile`、`language`。
- Codex MCP 工具调用会自动携带 thread / turn / workspace metadata，可作为 episode continuity 的窗口事实。
- Codex 可以在调用工具时按 schema 显式构造结构化 payload；但现有 `prime` schema 没有接收结构化 intent 的字段。
- `IntentExtractor` 已有确定性 query 扩展、文件上下文、语言推断和粗 scenario。
- `PrimeSearchPipeline` 已能搜索 Recipe / Guard 并生成 prime knowledge material。
- `IntentState` 已能记录 prime query、active file、recipe ids、decisions、drift events。

### 核心缺口

- 现有 scenario 过粗，不能表达用户真实任务类型、阶段、约束、非目标和第一阻塞点。
- 意图只在 session 内存里稳定存在，跨会话连续性不足。
- `close / fail` 才持久化，用户换会话或中断时会丢 episode。
- 没有 `new / continue / correction / supersede / fork / background` 关系判断。
- 没有 evidence spans 解释“为什么识别成这个意图”。
- resident / 本地千问 refinement 没有明确 latency 与 fallback 规则。
- Plugin 的 MCP request handler 当前只把 `request.params.arguments` 传给 handler，尚未把 request metadata 注入 `McpContext`。
- 现有 schema 无法让 Codex 把 `hostDeclaredIntent` 作为一等输入交给 `prime`。

## Host-Agent 边界实验

2026-05-26 通过 Codex 工具边界做了小型 probe，结论如下：

- Codex 可以在工具调用参数中生成结构化意图草案，例如 `kind / action / target / relationToEpisode / summary / constraints / confidence / evidence`。
- 这种结构化内容必须有工具 schema 接收；如果 `prime` schema 不声明对应字段，当前链路无法把它作为稳定参数交给 Plugin。
- Codex 自动附带的 request metadata 主要是运行事实，不是语义意图。已观察到字段包括 `threadId`、`session_id`、`thread_id`、`turn_id`、`turn_started_at_unix_ms`、`model`、`reasoning_effort`、`sandbox`、`thread_source`、workspace remote、dirty 状态和 latest commit。
- 这些 metadata 对跨会话 episode 很有价值，可用于关联 thread、turn、workspace 和 git 状态；但不能替代 `hostDeclaredIntent`。
- 当前 `AlembicPlugin/lib/external/mcp/McpServer.ts` 与 `CodexMcpServer.ts` 的 `CallToolRequest` handler 都只读取 `name` 和 `arguments`，没有把 request metadata 下传给 task handler。

设计结论：

- 037 应新增显式 `hostDeclaredIntent`，由 Codex 在调用 `prime` 时传入自己对当前用户输入的结构化判断。
- 037 应新增或下传 `hostTurnMeta`，由 Plugin 从 MCP request metadata 读取 thread / turn / workspace 事实。
- Plugin 仍必须运行自己的 deterministic recognizer，最终输出不是盲信 Codex，而是合并 `hostDeclaredIntent + hostTurnMeta + pluginRecognizedIntent`。
- `hostDeclaredIntent` 不作为 required 字段；缺失时不得降低 prime 基本可用性。

## Plugin / Alembic 主体关系

| 边界 | AlembicPlugin | Alembic 主体 |
| --- | --- | --- |
| 位置 | Codex host-agent 入口 | 本地增强底座 / resident / daemon |
| 必须负责 | 可选 `hostDeclaredIntent` 接收；`hostTurnMeta` 收集；确定性 fast recognizer；episode quick read/write；prime 快速返回 | 提供本地 resident 服务；本地千问 refinement；长期存储 / 查询能力候选 |
| AI 能力 | 不自建联网 AI provider；不冷启动模型；只可调用已可用的 resident local refine | 可使用本地千问；联网 AI 不进入 prime 同步路径 |
| 失败策略 | 本地识别必须可用；refinement 超时或不可用时返回 draft | refinement 不可用时返回明确 unavailable，不阻塞 Plugin |

## 识别与产出流程

```text
Codex user input / tool args
-> Plugin collect hostTurnMeta
-> read hostDeclaredIntent if provided
-> read recent IntentEpisode index
-> IntentSignalCollector extracts raw signals
-> IntentExtractionEngine builds manageable IntentExtractionFrame
-> optional local Qwen refinement with strict timeout
-> RecognizedIntentDraft
-> write IntentEpisode(opened/active)
-> prime returns draft + continuity summary
```

## IntentExtractionFrame

`RecognizedIntentDraft` 面向外部消费；其内部应先生成一个可管理的 `IntentExtractionFrame`，用于准确性评分、冲突处理和后续搜索增强。

```ts
type IntentExtractionFrame = {
  extractionId: string;
  observedAt: number;
  rawSignals: {
    userQuery: string;
    activeFile?: string;
    language?: string;
    hostDeclaredIntent?: RecognizedIntentDraft["hostDeclaredIntent"];
    hostTurnMeta?: RecognizedIntentDraft["hostTurnMeta"];
    recentEpisodes: Array<{
      intentId: string;
      continuity: IntentEpisode["continuity"];
      userGoal: string;
      targetRefs: RecognizedIntentDraft["targetRefs"];
    }>;
  };
  slots: {
    requestType: RecognizedIntentDraft["requestType"];
    phase: RecognizedIntentDraft["phase"];
    targetRefs: RecognizedIntentDraft["targetRefs"];
    userGoal: string;
    taskObject: string;
    desiredOutcome: string;
    firstBlocker: string | null;
    constraints: string[];
    nonGoals: string[];
  };
  confidence: {
    overall: number;
    slotScores: Record<string, number>;
    conflictLevel: "none" | "low" | "medium" | "high";
    needsConfirmation: boolean;
  };
  management: {
    lifecycle: "open" | "updated" | "corrected" | "superseded" | "background";
    continuity: IntentEpisode["continuity"];
    parentIntentId?: string;
    supersedesIntentId?: string;
  };
  evidenceSpans: RecognizedIntentDraft["evidenceSpans"];
};
```

准确性原则：

- 先抽槽位，再生成摘要；摘要不能覆盖槽位事实。
- 用户显式话语、Design Key / GTODO / 文件路径、hostDeclaredIntent、recent episode 分开计分，避免混成不可解释判断。
- 当 hostDeclaredIntent 与 Plugin deterministic 结果冲突时，保留冲突并降低对应 slot score。
- 当 `userGoal / desiredOutcome / firstBlocker` 任一关键槽位低置信度时，不应生成强 prime 注入，应返回 `needsConfirmation` 或降级注入。
- 可管理性来自 `IntentEpisode` lifecycle，而不是只把一次提取结果写进内存。

## RecognizedIntentDraft 草案

```ts
type RecognizedIntentDraft = {
  source:
    | "host-declared+plugin-deterministic"
    | "plugin-deterministic"
    | "host-declared+plugin-deterministic+local-qwen";
  latencyMs: number;
  hostDeclaredIntent?: {
    kind?: string;
    action?: string;
    target?: string;
    relationToEpisode?: "new" | "continue" | "correction" | "supersede" | "fork" | "background";
    summary?: string;
    constraints?: string[];
    confidence?: number;
    evidence?: string[];
  };
  hostTurnMeta?: {
    threadId?: string;
    sessionId?: string;
    turnId?: string;
    turnStartedAtUnixMs?: number;
    model?: string;
    workspaceRoot?: string;
    latestGitCommitHash?: string;
    hasWorkspaceChanges?: boolean;
  };
  requestType:
    | "new-requirement"
    | "bug"
    | "todo"
    | "research"
    | "decision"
    | "current-mainline-risk"
    | "requirement-candidate"
    | "background"
    | "code-fact-analysis"
    | "implementation"
    | "verification";
  phase:
    | "discuss"
    | "design"
    | "code-fact-analysis"
    | "implementation"
    | "verification"
    | "handoff"
    | "acceptance";
  targetRefs: {
    workspace?: string;
    repo?: string;
    file?: string;
    designKey?: string;
    gtodo?: string;
  };
  userGoal: string;
  explicitConstraints: string[];
  nonGoals: string[];
  firstBlocker: string | null;
  suggestedNextAction:
    | "answer"
    | "ask-confirmation"
    | "read-code"
    | "write-design"
    | "handoff-workspace"
    | "implement"
    | "verify";
  confidence: number;
  evidenceSpans: Array<{
    source: "user" | "code" | "doc" | "episode";
    text: string;
    supports: string;
  }>;
  refinement: {
    attempted: boolean;
    used: boolean;
    provider?: "local-qwen";
    latencyMs?: number;
    reason?: string;
  };
};
```

## IntentEpisode 草案

```ts
type IntentEpisode = {
  intentId: string;
  sessionId: string;
  projectScopeId: string;
  openedAt: number;
  updatedAt: number;
  status: "opened" | "active" | "closed" | "abandoned" | "superseded";
  continuity: "new" | "continue" | "correction" | "supersede" | "fork" | "background";
  parentIntentId?: string;
  supersedesIntentId?: string;
  recognizedIntent: RecognizedIntentDraft;
  sourceRefs: {
    threadId?: string;
    turnId?: string;
    designKey?: string;
    gtodo?: string;
    repo?: string;
    file?: string;
  };
  evidenceSpans: RecognizedIntentDraft["evidenceSpans"];
};
```

## Fast recognizer 设计原则

- 先硬事实，后判断。
- 明确用户目标和第一阻塞点优先于功能列表或限制说明。
- 显式用户约束优先于历史 episode。
- 用户纠偏优先于旧识别结果。
- 低置信度时输出 `ask-confirmation`，不要假装确定。
- 本地千问 refinement 只能增强 draft，不能成为 prime 可用性的前提。
- `hostDeclaredIntent` 是强证据，不是最终事实；Plugin 必须保留冲突检测和降置信度路径。
- `hostTurnMeta` 只提供窗口事实，不参与语义判断的单点裁决。

## continuity 判断

新会话 prime 时，Plugin 应读取同 ProjectScope 下最近 episodes，并基于以下信号判断关系：

- Design Key / GTODO 是否相同。
- repo / file / module 是否相同。
- 用户是否出现“继续、不是这个意思、纠偏、换一个、现在开始”等显式转向词。
- 当前 userGoal 与最近 episode userGoal 是否相同或冲突。
- 当前约束是否覆盖旧约束。

输出关系：

- `new`：新任务。
- `continue`：继续旧任务。
- `correction`：纠偏旧意图，但目标仍相关。
- `supersede`：替换旧任务。
- `fork`：从旧任务分出新方向。
- `background`：只是背景信息，不应推进任务。

## 第一阶段完成定义

- `prime` 在无联网 AI、无本地千问时仍能快速产出 `RecognizedIntentDraft`。
- 每次提取先形成 `IntentExtractionFrame`，并能解释关键槽位、置信度和冲突来源。
- 每次 `prime` 立即写入 `IntentEpisode`，并可被下一会话读取。
- 同一 Design Key / GTODO 在新会话中能被识别为 `continue`。
- 用户说“不是这个意思”时能识别为 `correction`，并保留新旧 evidence。
- 本地千问可用时能在严格超时内 refinement；不可用时不阻塞。
- 产物包含 evidence spans、latency、source、confidence 和 refinement metadata。
- Codex 显式传入 `hostDeclaredIntent` 时，产物能保留该输入并标明采用、修正或冲突。
- Plugin 能从 request metadata 保留 `threadId / turnId / workspace / git` 等 continuity 事实；metadata 缺失时不影响 deterministic draft。

## 分阶段执行建议

本 Design Key 不应一次性要求完成整个 037 链路。建议作为 037 的 Stage 1-2 执行：

| 阶段 | 名称 | 目标 | 验收 |
| --- | --- | --- | --- |
| Stage 0 | 代码事实基线 | 总控先确认现有 MCP metadata、`prime` schema、session、`IntentState`、SignalBus / JSONL 和 ProjectScope storage。 | 只产出代码事实，不改功能。 |
| Stage 1 | IntentExtractionFrame | 接收 `hostDeclaredIntent` / `hostTurnMeta`，生成 `IntentExtractionFrame` 和 `RecognizedIntentDraft`。 | 槽位、置信度、冲突、evidence 可 unit 验证。 |
| Stage 2 | IntentEpisode 管理 | 持久化 episode，支持跨会话 `continue / correction / supersede / background`。 | targeted integration 能在新会话读回旧 episode 并正确关联。 |

Stage 1-2 完成前，不应派发搜索、向量或 prime 交付包实现；这些属于 `INTENT-KNOWLEDGE-2026-05-26` 的后续阶段。

## 验证建议

- deterministic unit：输入含 Design Key / GTODO / 文件路径 / “不要实现”等约束，检查 requestType、phase、targetRefs、nonGoals。
- extraction accuracy unit：同一输入检查 `userGoal / desiredOutcome / firstBlocker / constraints / nonGoals` 槽位，不只检查粗分类。
- conflict unit：hostDeclaredIntent 与用户最新纠偏冲突时，最新用户话语优先并降低冲突槽位置信度。
- continuity unit：同 ProjectScope 两次 prime，第二次含“继续”，识别为 `continue`。
- correction unit：第二次输入“不是这个意思”，识别为 `correction` 并 supersede 或关联旧 episode。
- latency probe：无 local Qwen 时 prime 仍快速返回。
- local Qwen timeout probe：refinement 超时不影响 draft。
- real validation later：本阶段只准备真实验证前提；最终真实项目验证由 037 Stage 6 交给 `AlembicTest`。

## 交给总控的下一步

建议 `AlembicWorkspace` 接收本 Design Key，并先做代码事实调研：

- Plugin 当前 host facts 能拿到哪些。
- Codex MCP request metadata 应如何进入 `McpContext`，以及是否需要同时支持显式 `hostTurnMeta`。
- `hostDeclaredIntent` schema 是否作为 `alembic_task prime` 的可选字段加入，并如何在工具说明中要求 Codex 调用时尽量填写。
- `IntentState` / SignalBus / JSONL 是否适合作为 episode 基础。
- `IntentEpisode` 应放在 Plugin dataRoot、Alembic dataRoot 还是 ProjectScope scoped storage。
- Alembic resident 是否已有本地千问可用且可限时调用。
- Stage 6 最终 `AlembicTest` 真实验证需要哪些跨会话场景与证据。
- 同时接收 `INTENT-KNOWLEDGE-2026-05-26` 作为 037 第二阶段候选，但不要早于本阶段派发。
