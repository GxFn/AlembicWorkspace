# 冷启动前端过程语义补齐 - Wave 1 执行计划

状态：已完成 / 已归档（前端 polish 已提交 `c857bdf`）
维护窗口：AlembicWorkspace
创建时间：2026-05-24
状态更新时间：2026-05-24 20:03 CST
对应 TODO：`GTODO-2026-05-24-032`

## 来源与目标

本 wave 是 [scan-progress-live-output-wave-2026-05-24.md](scan-progress-live-output-wave-2026-05-24.md) 的语义补齐 follow-up。前序主线已经把 cold-start / rescan process event 管线、Jobs timeline、cold-start 卡片摘要、前端本地展示缓存和可展开内容跑通；用户现在指出：前端还没有完整承载旧终端里的格式化语义信息，尤其是中期 / 停滞反思、Nudge 原文与类型、阶段机 transition / phase 行为、关键发现。

最终目标：开发者在 Dashboard 里看到的过程展示，不只是 `llm.input` / `llm.output` / 通用 `llm.reflection` 事件，而是能读懂 Alembic 内部 Agent 正在怎么想、被怎样 nudge、阶段机如何推进、哪些关键发现被形成。旧终端里面向开发者的格式化信息应进入 developer-facing process events，并在 Jobs timeline 与 cold-start 卡片摘要里成为一等展示。

## 当前真实代码证据

- Agent 已生成旧终端格式化文本：`AlembicAgent/src/agent/context/exploration/NudgeGenerator.ts:341` / `:344` 生成 `📊 停滞反思` 与 `📊 中期反思`；`:197` / `:297` 生成要求输出 `dimensionDigest.keyFindings` 的总结 nudge。
- Agent 只把部分 nudge 发成 process event：`AlembicAgent/src/agent/runtime/AgentRuntime.ts:664` 仅当 `isDeveloperVisibleReflectionNudge()` 通过时发送 `llm.reflection`；`:1391` 的 `Transition Nudge` 和 `:1533` 的 `Digest Nudge` 仍主要只写 stderr，没有稳定发送 process event。
- Agent progress contract 目前可承载 developer-safe event，但类型偏窄：`AlembicAgent/src/agent/runtime/AgentRuntimeTypes.ts:44` 只列 `llm.input`、`llm.reflection`、`llm.output`、`tool`。
- Core job process event contract 已支持后续展示需要的基础类别：`AlembicCore/src/daemon/JobProcessEventContracts.ts:5` 包含 `workflow`、`llm.reflection`、`checkpoint`、`summary` 等；因此第一波不需要改 Core，只需让上游真实 producer 与 bridge 用好现有 contract。
- Alembic 结果投影已有通用事件，但不是旧终端语义投影：`Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts:233` 的 reflection 主要来自 quality gate / diagnostics / efficiency；`:91` tier reflection 会保存 `topFindings`，但没有形成“关键发现”一等事件。
- Alembic child dimension input 已有 `emitProcessEvents` bridge，但 child Agent run input 的 `execution` 只传 abort signal：`Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapSessionExecutionBuilder.ts:376`；这意味着 Agent runtime 的 live `agent_process_event` 不一定能完整进入 job process events。
- Dashboard 已经有过程终端和可展开内容：`AlembicDashboard/src/components/Views/JobsView.tsx:684` 读取 120 条 events，`:741` 用固定高度滚动容器，`:781` 渲染 `ProcessEventItem`；但 `:897` 把所有 `llm.*` 当成同类，尚未按 nudge / phase transition / key findings 做语义展示。
- cold-start 卡片只取最近关键事件：`AlembicDashboard/src/components/Views/BootstrapProgressView.tsx:492` + `AlembicDashboard/src/utils/jobProcessEvents.ts:179`，当前没有优先挑选 Nudge / 阶段转换 / 关键发现。

## 完成定义

- Agent runtime 对所有 developer-facing 旧终端格式化语义都能生成 process event：中期 / 停滞反思、planning / replan / convergence nudge、transition nudge、digest / continue nudge、phase / iteration / dimension metadata。
- Alembic bootstrap/rescan internal-agent bridge 能把 Agent `agent_process_event` 持久化为 job process events，并补齐 dimensionDigest / topFindings / key findings 的 developer-facing 事件，不依赖 Dashboard 解析原始 stderr。
- Dashboard Jobs timeline 能把这些语义作为可扫描的过程条目展示：Nudge、阶段转换、反思、关键发现有明确标题、摘要、图标 / tone 或 chips；大段 LLM / nudge 内容默认收起、用户可展开。
- cold-start 卡片最近关键事件会优先展示 Nudge / 阶段转换 / 关键发现这类有价值信息，而不是只显示 generic kind。
- `AlembicTest` 至少用 test mode cold-start 验证一轮，证明 API events 与前端展示都能看到新增语义，并且无需全量长跑。

不属于本 wave：逐 tool call 更细实时性（保留 `GTODO-2026-05-24-029` 观察）、多 root project skill export（保留 `GTODO-2026-05-24-030`）、L4 compaction 行为修复。

## 当前阶段判断

当前判断：`AlembicTest` P5 已通过总控验收，`GTODO-2026-05-24-032` 的语义展示和阅读体验主目标已经达到。P5 证明阶段转换 / 短 LLM 默认展示、长内容折叠、颜色可读、active card / summary 均闭合；严格“逐条终端式 live append”仍有批量落屏，但归入既有 `GTODO-2026-05-24-029` 实时性观察，不再阻塞本语义补齐主线。

用户同步的 `AlembicDashboard` 附加 UI 修改已通过总控代码验收：后台任务卡片不再内嵌过程 Timeline / LLM 输出，改为 `Drawer` 通用侧边栏；同时移除 `candidateCreatedTick` 触发的 cold-start 维度完成中途刷新。基线提交为 `5a72c6b`；前端窗口后续留下的 `scripts/dashboard-contract.test.mjs` 和 `src/components/Views/JobsView.tsx` 两个 polish diff 已通过总控验证，并由前端窗口提交 `c857bdf` 封口。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 / 推荐窗口 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `GTODO-2026-05-24-032` | 已完成 | observability semantic richness | P2 | `AlembicAgent` / `Alembic` / `AlembicDashboard` / `AlembicTest` | 冷启动前端过程展示补齐旧终端格式化语义：中期 / 停滞反思、Nudge 原文与类型、阶段机 transition / phase 行为、dimensionDigest / topFindings / 关键发现；过程终端短内容直接展示、关键语义可读。 | 否 | P5 已验收通过；Dashboard 附加侧边栏 UI 已验收，polish 已提交 `c857bdf`。 |
| `GTODO-2026-05-24-029` | 观察中 | observability latency | P3 | `Alembic` / `AlembicAgent` / `AlembicDashboard` / `AlembicTest` | live append 批量延迟 / 更细实时性观察；P5 证明无需刷新可恢复，但仍非严格逐条落屏。 | 否 | 不阻塞 `GTODO-032`；若用户后续要求严格逐条终端式输出，再提升为独立实时性专项。 |

## 阶段任务包

### SPSR-P1-Agent-Semantic-Events

- 窗口：`AlembicAgent`
- 派发时间：2026-05-24 17:48 CST
- 状态更新时间：2026-05-24 18:13 CST
- 状态：已完成 / 总控验收通过
- 阶段目标：让旧终端格式化信息在 Agent runtime 层成为 developer-safe process events。
- 主线动作：
  - 补齐 transition nudge、digest nudge、continue nudge 的 `agent_process_event` 发送，不能只写 stderr。
  - 保留中期 / 停滞反思全文，并把标题 / summary 改成开发者一眼能读懂的中文或语义化文案。
  - metadata 至少包含 `semanticKind`、`nudgeType`、`phase`、`iteration`、`dimensionId`、`pipelineType`、`source`，能区分 `reflection-nudge`、`transition-nudge`、`digest-nudge`、`continue-nudge`。
  - 评估 `AgentProgressProcessEventKind` 是否需要 additive 支持 `checkpoint` / `summary`；若使用现有 `llm.reflection`，必须通过 metadata 明确语义，不得让 Dashboard 只能靠 title 文本猜。
  - 不暴露 hidden reasoning、raw provider payload、secret 或未归类原始日志。
- 合并 TODO：`GTODO-2026-05-24-032` producer 部分。
- 明确不包含：不改 Dashboard UI；不改 Alembic recorder；不处理 L4 compaction；不把所有 stderr 原文无分类塞进事件流。
- 下一处真实阻塞点：Agent 没有稳定事件字段，Alembic / Dashboard 无法做真实消费。
- 阻塞点之前还能做：补齐 runtime 事件生产、类型 / 测试、事件样例和回填文档。
- 验证命令：`npm run build:check`、相关 Agent runtime / Nudge targeted tests、`npm run lint:core-import-boundary`、`git diff --check`；若新增 contract 或测试脚本，按 `AlembicAgent/AGENTS.md` 补跑 `npm run check`。
- 回填要求：提交 hash、修改文件、事件样例 JSON、旧终端信息与 process event 的映射表、验证命令与结果、遗留风险、给 Alembic 的消费建议。
- 执行前置硬规则：先读取 workspace `AGENTS.md`、本执行计划、`AlembicAgent/AGENTS.md`；开始前明确声明当前窗口定位和本轮仓库职责。

#### SPSR-P1-Agent-Semantic-Events 回填

- 执行记录：[../../AlembicAgent/scan-progress-semantic-richness-agent-events-2026-05-24.md](../../../../AlembicAgent/scan-progress-semantic-richness-agent-events-2026-05-24.md)。
- 提交 hash：`18af90800d1a835ccfde9bdf2c6e56289ebc5151`（`Emit semantic nudge process events`）。
- 完成范围：
  - `AgentRuntime` 对 `tracker.getNudge()` 的 reflection / planning / replan / convergence nudge 使用统一 semantic event builder。
  - `tracker.endRound()` transition nudge 会发送 developer-safe `agent_process_event`，不再只写 stderr。
  - metrics transition / text-triggered digest nudge 会发送 `digest-nudge` event。
  - text response continue nudge 会发送 `continue-nudge` event。
  - 新增 title / summary / metadata formatter，metadata 包含 `semanticKind`、`nudgeType`、`phase`、`iteration`、`dimensionId`、`pipelineType`、`source`、`targetName`。
- 事件样例：`processEvent.kind=llm.reflection`，`metadata.semanticKind=transition-nudge`，`metadata.nudgeType=transition`，`title=Agent 阶段转换 Nudge: EXPLORE`，`content.role=developer`，`displayPolicy=full`，`retention=job-retained`。
- 旧终端映射：中期 / 停滞反思 -> `reflection-nudge`；planning / replan -> `planning-nudge`；convergence -> `convergence-nudge`；Transition Nudge -> `transition-nudge`；Digest Nudge -> `digest-nudge`；Continue Nudge -> `continue-nudge`。
- 验证命令与结果：
  - `npm run test -- test/AgentRuntime.test.ts`：通过，`8` tests passed。
  - `npm run build:check`：通过。
  - `npm run lint`：通过。
  - `npm run lint:core-import-boundary`：通过。
  - `git diff --check`：通过。
  - `npm run check`：通过，`19` files / `91` tests passed。
  - `alembic_guard`：未运行成功；本项目无可用 Alembic knowledge，工具返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`。
- 遗留风险：未在 Alembic daemon / Dashboard / test-mode cold-start 中验证 live API events；`dimensionDigest` / `topFindings` 的关键发现一等事件仍属于 Alembic bridge/projection 任务。
- 给 Alembic 的消费建议：优先读取 `event.processEvent.metadata.semanticKind` / `nudgeType` / `pipelineType` / `phase`，保留 `content.text` 的 developer-facing 全文；Agent 不提供 jobId / sequence / storage，这些仍由 Alembic recorder 负责。

#### SPSR-P1-Agent-Semantic-Events 总控验收

- 验收时间：2026-05-24 18:13 CST。
- 代码证据：`AlembicAgent/src/agent/runtime/AgentRuntime.ts:665` 已将普通 reflection nudge 改为 `buildSemanticNudgeProcessEvent`；`:1378` 对 transition nudge 发送 `semanticKind=transition-nudge`；`:1502` / `:1527` / `:1551` 覆盖 digest / continue nudge；`:1974` 起的 builder 统一 title、summary、metadata、dimension / phase / pipeline 信息。
- 测试证据：`AlembicAgent/test/AgentRuntime.test.ts:214` / `:241` 覆盖 transition、digest 和 continue semantic process events。
- 总控结论：通过。`SPSR-P1-Agent-Semantic-Events` 关闭；剩余端到端展示风险转入 Dashboard / AlembicTest 阶段。

### SPSR-P1-Alembic-Bridge-Projection

- 窗口：`Alembic`
- 派发时间：2026-05-24 17:48 CST
- 状态更新时间：2026-05-24 18:13 CST
- 状态：已完成 / 总控验收通过
- 阶段目标：让 Alembic internal-agent cold-start / rescan 链路接住 Agent semantic progress，并把 key findings 作为 developer-facing process events 投影给 Dashboard。
- 主线动作：
  - 在 bootstrap child dimension run input 中接入 `execution.onProgress`，只接收 developer-safe `agent_process_event`，映射为 `BootstrapProcessEventDraft` 并通过现有 `emitProcessEvents` 持久化；不得记录 raw provider / hidden reasoning / secret。
  - 保留 jobId / sequence / storage 仍由 Alembic recorder 负责，Agent 只提供语义 payload。
  - 对现有 `BootstrapProcessEvents.ts` 做结果投影补强：从 dimensionDigest、analysisReport、tier reflection `topFindings` 中生成“关键发现 / Findings digest”类 developer-facing event；不要要求 Dashboard 去解析大段 JSON 才能知道关键发现。
  - 保持 Core contract 一致，优先使用现有 `llm.reflection`、`checkpoint`、`summary` 和 metadata；若发现必须改 Core，回填为阻塞，不在 Alembic 私造新公共 contract。
  - 新增 / 更新单元测试覆盖 progress event normalization、hidden source 丢弃、key findings projection 和 rescan 复用路径。
- 合并 TODO：`GTODO-2026-05-24-032` bridge/projection 部分。
- 明确不包含：不改 Dashboard UI；不直接解析 stderr；不为实时逐 token / 逐 tool call 优化吞吐；不把原始日志作为前端主数据源。
- 下一处真实阻塞点：Alembic 不持久化 Agent semantic events，Dashboard 就拿不到真实数据。
- 阻塞点之前还能做：先完成 onProgress bridge、结果投影、API 样例和测试，再把稳定事件样例交给 Dashboard。
- 验证命令：`npm run build:check`、targeted unit tests（BootstrapProcessEvents / InternalDimensionFillSessionRunner / DaemonJobRunner 或实际改动对应测试）、`npm run lint:repo-boundary`、`git diff --check`；若触发全量 check，按 `Alembic/AGENTS.md` 补跑。
- 回填要求：提交 hash、API event 样例、Agent progress mapping 说明、key findings event 样例、验证命令与结果、Dashboard 消费建议、是否需要 Core 返工。
- 执行前置硬规则：先读取 workspace `AGENTS.md`、本执行计划、`Alembic/AGENTS.md`；开始前明确声明当前窗口定位和本轮仓库职责。

#### SPSR-P1-Alembic-Bridge-Projection 回填

- 完成范围：
  - 在 `BootstrapSessionExecutionBuilder` 的 shared child dimension lazy input path 上接入 `execution.onProgress` bridge；bootstrap 与 rescan 共用该路径，因此 rescan 复用同一映射逻辑。
  - 新增 `buildBootstrapAgentProgressProcessEvents`，只接受 `event.type === "agent_process_event"` 且 `sourceClass === "developer-facing"`、`displayPolicy !== "hidden"` 的 Agent progress payload；`raw-provider`、`secret`、`hidden-reasoning`、`machine-only` 或 hidden display policy 均丢弃。
  - 保留 Alembic recorder 对 `jobId` / `sequence` / storage / realtime broadcast 的所有权；Agent 仅提供 semantic payload，Alembic 只产出 `BootstrapProcessEventDraft`。
  - 在 `BootstrapProcessEvents` 中从 `dimensionDigest.keyFindings`、`analysisReport.findings` 和 tier reflection `topFindings` 投影 `summary` / `dimension-findings` / `tier-findings` 事件，避免 Dashboard 解析大段 JSON 才能拿关键发现。
  - 更新 `BootstrapProcessEvents` 与 `BootstrapSessionExecutionBuilder` 单元测试，覆盖 progress normalization、hidden source 丢弃、key findings projection 和 shared bootstrap/rescan child input bridge。
- 提交 hash：`b504a3e8ad101cf673b0221d1dc06e6ac286709c`（`feat: bridge semantic bootstrap progress events`）。
- Agent progress mapping 说明：
  - 输入：`ProgressEvent`，仅消费 `type: "agent_process_event"` 的 `processEvent`。
  - 透传字段：`kind`（`llm.input` / `llm.reflection` / `llm.output` / `tool`）、`title`、`summary`、`phase`、`targetName`、`dimensionId`、`content`、`metadata`、`severity`、`retention`、`createdAt`。
  - Alembic 补充字段：`metadata.agentId`、`metadata.preset`、`metadata.progressType`、`metadata.sessionId`；`source` 固定为 `bootstrap-agent-progress`。
  - 安全边界：metadata/content 继续做 secret redaction；不接受非 developer-facing sourceClass，不接受 hidden display policy；不接收或生成 `jobId` / `sequence`。
- API event 样例：

```json
{
  "kind": "llm.reflection",
  "phase": "VERIFY",
  "title": "Agent 阶段转换 Nudge: VERIFY",
  "targetName": "Architecture",
  "dimensionId": "architecture",
  "sourceClass": "developer-facing",
  "metadata": {
    "semanticKind": "transition-nudge",
    "nudgeType": "transition",
    "progressType": "agent_process_event",
    "sessionId": "bs_1"
  },
  "content": {
    "role": "developer",
    "text": "阶段转换到 VERIFY，要求继续验证关键文件与调用链。"
  }
}
```

- Key findings event 样例：

```json
{
  "kind": "summary",
  "phase": "dimension-findings",
  "title": "Bootstrap Architecture findings digest",
  "targetName": "Architecture",
  "metadata": {
    "projection": "dimension-findings-digest",
    "findingSources": ["dimension-digest", "analysis-report"],
    "findingCount": 2,
    "candidateCount": 1
  },
  "content": {
    "role": "developer",
    "mimeType": "text/markdown",
    "text": "## 关键发现 / Findings digest\n\n1. Dashboard can consume a findings digest event.\n2. Bootstrap bridge owns event persistence. [9/10] - lib/main.ts:42"
  }
}
```

- 验证命令与结果：
  - `./node_modules/.bin/vitest run --config vitest.unit.config.ts test/unit/BootstrapProcessEvents.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts`：通过，2 files / 13 tests passed。
  - `npm run build:check`：通过。
  - `npm run lint`：通过。
  - `npm run check`：通过。
  - `npm run lint:repo-boundary`：通过，`@escape-hatch` 1 / 75。
  - `git diff --check`：通过。
- Dashboard 消费建议：
  - Nudge / 阶段转换 / 反思优先读取 `metadata.semanticKind`、`metadata.nudgeType`、`phase`、`title` 和 `content.text`。
  - 关键发现优先读取 `kind: "summary"` 且 `phase: "dimension-findings"` / `"tier-findings"` 的事件；展示 `metadata.findingCount`、`metadata.findingSources` 和 markdown content，不要再解析 `llm.reflection` 的大 JSON。
  - `sourceClass !== "developer-facing"` 或 `displayPolicy === "hidden"` 的事件不会从 Alembic bridge 进入 developer-facing API。
- 是否需要 Core 返工：不需要。本轮完全使用现有 Core process event kind / sourceClass / metadata contract。
- 遗留风险：尚未在 Alembic daemon live job、Dashboard UI 和 AlembicTest test-mode cold-start 中验证端到端展示；需要总控验收 Agent 与 Alembic 两个待验收提交后再启动 Dashboard / AlembicTest。

#### SPSR-P1-Alembic-Bridge-Projection 总控验收

- 验收时间：2026-05-24 18:13 CST。
- 代码证据：`Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapSessionExecutionBuilder.ts:340` 起在 child input 上接入 `execution.onProgress`，并通过 `emitProcessEvents` 写回 `bootstrap-agent-progress`；`Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts:118` 起只接受 developer-facing / non-hidden `agent_process_event`；`:180` 起生成 tier findings digest，`:236` 起生成 dimension findings digest。
- 测试证据：`Alembic/test/unit/BootstrapProcessEvents.test.ts:60` 覆盖 developer-safe Agent progress 映射，`:254` 覆盖 dimension findings；`BootstrapSessionExecutionBuilder.test.ts:116` 起覆盖 shared child input progress bridge。
- 总控结论：通过。`SPSR-P1-Alembic-Bridge-Projection` 关闭；不需要 Core 返工。可启动 Dashboard 语义 UI 阶段。

### SPSR-P2-Dashboard-Semantic-Timeline

- 窗口：`AlembicDashboard`
- 状态：已完成 / 总控验收通过
- 派发时间：2026-05-24 18:13 CST
- 状态更新时间：2026-05-24 18:38 CST
- 阶段目标：在 Jobs timeline 与 cold-start 卡片中把 Nudge、阶段转换、反思、关键发现作为语义化展示条目。
- 主线动作：基于上游真实事件样例，新增 / 调整 Dashboard process event view model、tone / icon / chips、关键事件选择策略和默认折叠行为；冷启动卡片优先展示 Nudge / 阶段转换 / 关键发现。
- 合并 TODO：`GTODO-2026-05-24-032` Dashboard 展示部分。
- 明确不包含：不解析原始 stderr；不私造后端没有的字段；不处理 `GTODO-2026-05-24-029` 的实时粒度优化。
- 下一处真实阻塞点：Dashboard UI 未消费 `metadata.semanticKind`、`phase=dimension-findings|tier-findings` 和 findings metadata 前，开发者仍只能看到通用事件。
- 阻塞点之前还能做：基于已验收的事件样例，实现语义分类、优先选择和可读展示；完成后回填截图 / DOM 证据给 AlembicTest。
- 验证命令：待上游完成后由 Dashboard 窗口运行 `npm run build` / 类型检查 / targeted tests，并按 UI 变更做浏览器截图或 DOM 证据。
- 回填要求：提交 hash、事件样例截图或 DOM 证据、API 字段映射、验证命令与结果、遗留风险、给 AlembicTest 的验证建议。
- 执行前置硬规则：后续启动时先读取 workspace `AGENTS.md`、本执行计划、`AlembicDashboard/AGENTS.md`；开始前明确声明当前窗口定位和本轮仓库职责。

#### SPSR-P2-Dashboard-Semantic-Timeline 回填

- 提交 hash：`a5a9c1a`（`feat: show semantic process events`）。
- 完成范围：
  - `src/utils/jobProcessEvents.ts` 新增 Dashboard 侧语义分类：识别 `metadata.semanticKind`、`metadata.nudgeType`、`phase=dimension-findings|tier-findings`、`metadata.projection=dimension-findings-digest|tier-findings-digest`、`findingCount`、`findingSources`，输出 `transition` / `nudge` / `reflection` / `findings` 等语义 category。
  - `pickKeyProcessEvents` 改为按语义优先级挑选冷启动卡片关键事件：`error` > `findings` > `transition-nudge` > 其它 nudge > reflection > generic LLM / artifact / checkpoint / tool，并保持展示顺序按 sequence 回排。
  - `src/components/Views/JobsView.tsx` 的 Timeline 事件 badge / icon / tone 改为消费语义 category；metadata chips 增加 `semanticKind`、`nudgeType`、`findingCount`、`findingSources`，同时保留 raw `kind` / `phase` / `dimensionId` / `targetName`。
  - `src/components/Views/BootstrapProgressView.tsx` 的 cold-start 最近关键事件卡片消费同一语义工具：显示语义 label、phase / semantic / nudge / findings chips、短 preview，并对 findings / transition / nudge / reflection 使用不同 tone。
  - `scripts/dashboard-contract.test.mjs` 补 contract 检查，锁住 semantic category、findings phase、transition nudge、Dashboard Timeline 映射、cold-start summary 映射和 preview 入口。
- API 字段映射：
  - Nudge / 阶段转换：读取 `event.metadata.semanticKind`、`event.metadata.nudgeType`、`event.phase`、`event.dimensionId`、`event.targetName`、`event.content`；`semanticKind=transition-nudge` 展示为阶段转换，其它 `*-nudge` 展示为 Nudge。
  - 关键发现：读取 `event.kind === "summary"` 且 `event.phase === "dimension-findings" | "tier-findings"`，或 `metadata.projection === "dimension-findings-digest" | "tier-findings-digest"`；展示 `findingCount`、`findingSources` 和 summary/content preview。
  - 反思 / LLM：仍兼容 `kind=llm.reflection|llm.input|llm.output`，但优先使用 metadata semantic 信息，不靠 title 文本猜语义。
- DOM / UI 证据：
  - Jobs Timeline DOM 构造中使用 `formatProcessEventSemanticLabel(event, text.lang)` 作为主 badge 文案，使用 `getProcessEventSemanticCategory(event)` 决定 icon / tone，并渲染 `semanticKind` / `nudgeType` / `findingCount` / `findingSources` chips。
  - Cold-start 卡片 DOM 构造中使用 `formatProcessEventSemanticLabel(event, lang)`、`getBootstrapProcessEventTone(event)` 和 `getProcessEventPreviewText(event, 180)`，确保最近关键事件优先展示语义摘要而不是 raw kind。
  - 本环境无可用 Playwright/browser 依赖，未产出真实截图；上述 DOM 证据由 `dashboard-contract.test.mjs` 静态 contract 锁定，真实浏览器截图建议交给 `AlembicTest` test mode 验证。
- 验证命令与结果：
  - `npm run check`：通过，包含 Dashboard lint、`node --test scripts/dashboard-contract.test.mjs` 8/8、`tsc --noEmit` 和 `vite build`。
  - `git diff --check`：通过。
  - `git diff --check HEAD^ HEAD`：通过。
- 遗留风险：
  - 本轮只完成 Dashboard 语义消费和展示，不改变 AlembicAgent producer、Alembic bridge / recorder / API 或 Core contract。
  - 未连接真实 daemon 做 live browser 截图；端到端事件可见性、实际 DOM 与 cold-start 卡片展示仍需 `AlembicTest` 使用 test mode cold-start 验证。
  - 若后续上游新增更细的 typed metadata，Dashboard 可继续扩展同一 `jobProcessEvents.ts` 语义分类层，不应让 Jobs / cold-start 卡片各自解析 raw payload。
- 下一步建议：
  - 总控验收 `a5a9c1a` 后，启动 `SPSR-P3-TestMode-Validation`，用 `ALEMBIC_TEST_MODE=1` 小维度 cold-start 验证 `/api/v1/jobs/:jobId/events` 中 `semanticKind` / `dimension-findings` / `tier-findings` 事件计数，以及 Dashboard Jobs Timeline / cold-start 卡片 DOM 证据。
  - AlembicTest 复测时重点确认至少出现一条 `transition-nudge`、一条其它 nudge 或 reflection、一条 findings digest，并确认卡片优先展示这些语义事件。

#### SPSR-P2-Dashboard-Semantic-Timeline 总控验收

- 验收时间：2026-05-24 18:38 CST。
- 代码证据：`AlembicDashboard/src/utils/jobProcessEvents.ts` 已新增 semantic category / label / priority / preview 工具，识别 `metadata.semanticKind`、`metadata.nudgeType`、`phase=dimension-findings|tier-findings` 和 findings metadata；`AlembicDashboard/src/components/Views/JobsView.tsx` 的 Timeline 主 badge、icon、tone 和 chips 已消费这些语义；`AlembicDashboard/src/components/Views/BootstrapProgressView.tsx` 的 cold-start 最近关键事件复用同一语义工具。
- 测试证据：`AlembicDashboard/scripts/dashboard-contract.test.mjs` 锁定 semantic category、findings phase、transition nudge、Timeline 映射、cold-start summary 映射和 preview 入口；总控复跑 `npm run check` 通过，包含 Dashboard lint、`dashboard-contract.test.mjs` 8/8、`tsc --noEmit` 和 `vite build`；`git diff --check HEAD^ HEAD` 通过。Vite 仅输出 chunk size warning，不影响本轮语义展示功能。
- 总控结论：通过。`SPSR-P2-Dashboard-Semantic-Timeline` 关闭；当前实现窗口已完成，进入 `SPSR-P3-TestMode-Validation`。

### SPSR-P3-TestMode-Validation

- 窗口：`AlembicTest`
- 状态：已完成
- 派发时间：2026-05-24 18:38 CST
- 状态更新时间：2026-05-24 19:10 CST
- 阶段目标：用 test mode cold-start 验证旧终端格式化语义已进入 API events 与前端展示。
- 主线动作：使用小维度 / 小文件数 test mode，验证至少包含 Nudge / 阶段转换 / 关键发现事件，检查 Jobs timeline 与 cold-start 卡片可读。
- 合并 TODO：`GTODO-2026-05-24-032` 真实验证部分。
- 明确不包含：不做全量冷启动长跑；不改 BiliDili 项目源码；不把测试窗口当产品实现仓库。
- 下一处真实阻塞点：需要真实 test mode job 证明 producer -> bridge -> API -> Dashboard UI 全链路可见。
- 阻塞点之前还能做：当前可以启动测试；不要做全量冷启动长跑，不改真实项目源码。
- 验证命令：以 `ALEMBIC_TEST_MODE=1` 小维度 cold-start / Dashboard API / 前端 DOM 证据为主，具体测试单见 [alembic-test-exchange.md](../../../current/alembic-test-exchange.md)。
- 回填要求：测试报告路径、job id、events API kind / semantic metadata counts、前端截图或 DOM 证据、失败日志、真实项目 git 状态。
- 执行前置硬规则：后续启动时先读取 workspace `AGENTS.md`、本执行计划、`AlembicTest/AGENTS.md` 和测试执行规则；开始前明确声明当前窗口定位和本轮职责。

#### SPSR-P3-TestMode-Validation 总控验收

- 验收时间：2026-05-24 19:10 CST。
- 测试报告：[../../../AlembicTest/docs/scan-progress-semantic-richness-test-mode-2026-05-24.md](../../../../../AlembicTest/docs/scan-progress-semantic-richness-test-mode-2026-05-24.md)。
- 主链路结论：通过。job/session 为 `bootstrap_mpjnppg3_6e71a895` / `bs_1779619856790_6kosny`；API events 共 `64` 条、`hiddenCount=0`，包含 `planning-nudge=2`、`continue-nudge=2`、`reflection-nudge=1`、`transition-nudge=4`、`dimension-findings-digest=1`；Jobs Timeline DOM / 截图可见 `Nudge`、`阶段转换`、`反思`、`关键发现` 和 semantic chips；`BiliDili` 前后 git clean。
- 不作为最终完成的原因：用户验收截图指出 Dashboard 过程终端还有 UI 体验缺口，属于当前目标范围内真实问题：阶段转换内容不应自动折叠；短 LLM 内容不应折叠；主要文本颜色对比度不足；live append 需要像终端一样一条一条出现，不能靠轮询攒几条刷新；active cold-start 卡片仍缺少运行中截图证据。
- 当前结论：`SPSR-P3-TestMode-Validation` 验收主链路通过，但 `GTODO-2026-05-24-032` 主线继续，转入 `SPSR-P4-Dashboard-Terminal-Readability`。

### SPSR-P4-Dashboard-Terminal-Readability

- 窗口：`AlembicDashboard`
- 状态：已完成 / 总控验收通过
- 派发时间：2026-05-24 19:15 CST
- 状态更新时间：2026-05-24 19:29 CST
- 派发说明：用户已暂停 19:10 的前端窗口执行；旧提示词作废，以本 19:15 版重新派发为准。
- 阶段目标：把 Jobs Timeline / process terminal 的语义展示从“能看到”收口到“开发者愿意读”：短内容直接展示、阶段转换不折叠、文字对比度清晰、live socket append 呈现为终端式逐条出现。
- 主线动作：
  - 阶段转换事件（`metadata.semanticKind=transition-nudge` 或语义 category 为 `transition`）内容默认直接展示，不进入“内容已收起”状态；如果文本很短，去掉多余折叠框或默认展开。
  - LLM 相关内容（`llm.input` / `llm.output` / `llm.reflection`）在内容不超过 `10` 行时默认展开并完整显示；超过 `10` 行才默认折叠，用户可展开。
  - 调整 Timeline 主标题、summary、content、expanded content、chips 的颜色层级，主要内容不得使用接近背景的 muted 色；元数据可以低优先级但仍要可读。
  - 明确 Jobs Timeline 刷新链路：当前真实代码是 Socket.io WebSocket `job:process-event` 实时 append + REST 初始加载 / 重连恢复 / active job 兜底轮询，不是 SSE。活跃展示主路径必须是一条 WebSocket event 追加一条 UI row；轮询只能做恢复兜底，不能造成用户看到“攒几条一起刷新”的主体验。
  - 不预设在高频事件 hook 中增加队列。先核查现有 socket / process event hook 的真实消费方；如果存在暂未真实使用、只会增加高频状态复杂度的 hook 或事件层封装，优先删除 / 收敛。
  - 若 React 批处理或后端同 tick 连续广播导致观感上批量出现，优先在真实消费组件或轻量 view-model 层处理逐条呈现，让 live events 按 sequence 逐条落到 Timeline，并保留底部自动滚动；不得新增无真实消费方的 hook。
  - 处理或解释 `AlembicDashboard` 当前 dirty working tree（`scripts/dashboard-contract.test.mjs`、`src/components/Layout/Header.tsx`），不得把 unrelated dirty state 带入发布验证。
- 合并 TODO：`GTODO-2026-05-24-032` Dashboard UI 验收缺口；`GTODO-2026-05-24-029` 仅在“活跃 WebSocket append 不应攒几条刷新”的当前主线范围内收口，不做更大实时架构专项。
- 明确不包含：不改 Alembic producer / recorder，除非 Dashboard 证明后端没有逐事件广播；不改 SSE chat / scan / refine 链路；不做全量视觉重设计；不处理 L4 compaction。
- 下一处真实阻塞点：Dashboard UI 不完成，AlembicTest 无法复测用户指出的真实体验问题。
- 阻塞点之前还能做：Dashboard 可独立修复显示策略、颜色、append 呈现和 contract / DOM 测试。
- 验证命令：`npm run check`、`git diff --check`、`git diff --check HEAD^ HEAD`；新增 / 更新 Dashboard contract test，至少覆盖 transition 默认展开、短 LLM 默认展开、长 LLM 默认折叠、semantic text 可读 class、socket append 单事件追加逻辑。若具备浏览器验证，补 Jobs Timeline 截图或 DOM 证据。
- 回填要求：提交 hash、涉及文件、折叠规则说明、WebSocket/REST 刷新链路说明、逐条 append 证据、颜色对比修复说明、截图或 DOM 证据、验证命令与结果、dirty working tree 处理结果、遗留风险、给 AlembicTest 的复测建议。
- 执行前置硬规则：先读取 workspace `AGENTS.md`、本执行计划、`AlembicDashboard/AGENTS.md`；开始前明确声明当前窗口定位和本轮仓库职责。

#### SPSR-P4-Dashboard-Terminal-Readability 回填

- 提交 hash：`37b6f79`（`Improve process timeline readability`）。
- 涉及文件：`src/utils/jobProcessEvents.ts`、`src/components/Views/JobsView.tsx`、`src/components/Layout/Header.tsx`、`scripts/dashboard-contract.test.mjs`。
- 折叠规则：
  - 新增 `JOB_PROCESS_EVENT_CONTENT_COLLAPSE_LINE_LIMIT = 10`。
  - `metadata.semanticKind=transition-nudge` 或语义 category 为 `transition` 的事件默认直接展示内容，不显示“内容已收起”。
  - 任意事件内容不超过 `10` 行时默认直接展示；超过 `10` 行才默认折叠，并保留用户手动展开 / 收起。
- WebSocket/REST 刷新链路：
  - 未新增 hook 内队列、timer 或事件层封装；暂停前临时加入的 queue 已收敛删除。
  - `useJobProcessEvents` 当前真实链路仍是 REST 初始加载 / 手动刷新 / active job 5s 兜底增量拉取 / socket reconnect 恢复，活跃事件主路径是 Socket.io `job:process-event`。
  - 每条 socket payload 先走 `normalizeProcessDeveloperView(eventRecord, payload.jobId)`，再在同一个 handler 中通过 `mergeProcessEvents(prev, [event])` 追加单条事件并写入本地展示缓存。
- 逐条 append 证据：
  - `scripts/dashboard-contract.test.mjs` 断言 `socket.on('job:process-event', onProcessEvent)`、`mergeProcessEvents(prev, [event])`、`writeJobProcessEventsDisplayCache(jobId, merged)`。
  - 同一测试负向断言源码中不存在 `socketAppendQueue`、`SOCKET_APPEND`、`appendNextQueued`、`ensureSocketAppend`，证明未在高频 hook 中保留无真实消费方队列。
- 颜色对比修复：
  - Timeline 标题使用 `text-slate-50`，summary 使用 `text-slate-200`，时间戳 / metadata label 提升到 `text-slate-300`，content 容器改为 `border-slate-700 bg-slate-900 p-3 text-slate-100`。
  - artifact、metadata chip 和展开内容使用更高亮度文本，避免主文本接近深色背景。
- 截图或 DOM 证据：
  - 本窗口没有启动真实 daemon/browser 截图；DOM 证据由 `dashboard-contract.test.mjs` 锁定：`data-process-event-sequence`、`contentShouldCollapse && (`、`effectiveContentExpanded`、`text-slate-50` / `text-slate-200` / `text-slate-300`、以及 `border-slate-700 bg-slate-900 p-3 text-slate-100`。
  - Header dirty 封口也有 DOM contract：终端能力和沙箱信息收进 `本地 Alembic` tooltip，只保留 `测试模式` 顶层 chip。
- 验证命令与结果：
  - `npm run test`：通过，`10/10` tests passed。
  - `npm run check`：通过，包含 lint、contract test、`tsc --noEmit` 和 Vite production build；Vite 仅保留既有 chunk size warning。
  - `git diff --check`：通过。
  - `git diff --check HEAD^ HEAD`：通过。
  - 负向扫描 `rg -n "socketAppendQueue|SOCKET_APPEND|appendNextQueued|ensureSocketAppend|alreadyQueued" src/hooks src/components src/utils`：无命中。
- Dirty working tree 处理结果：
  - 19:10 前暂停遗留的 Header / contract test 改动是用户要求“终端能力和沙箱移动到本地 Alembic”产生的真实 UI 收敛，已纳入同一提交。
  - 暂停前临时加入 `useJobProcessEvents` 的 socket append queue 已删除；最终提交不修改 `src/hooks/useJobProcessEvents.ts`。
  - P4 提交 `37b6f79` 覆盖本轮主改动；总控后续发现 `AlembicDashboard` 仍有 `scripts/dashboard-contract.test.mjs` 和 `src/components/Views/JobsView.tsx` 的小 UI 色值 / contract 调整未提交，复跑 `npm run check` 通过，用户确认该小改动不影响主线推进。
- 遗留风险：
  - 本轮未做真实浏览器截图和 live daemon 观察；需要 `AlembicTest` P5 小复测确认真实 UI 里阶段转换 / 短 LLM 默认展开、长内容折叠、颜色可读、live socket append 观感和 active card 摘要。
  - 当前未改 Alembic producer / recorder；如果 P5 仍观察到批量出现，需要 AlembicTest 判断是后端同 tick 连续广播、浏览器渲染批处理，还是 Dashboard 展示层问题，再决定是否进入 `GTODO-2026-05-24-029` 的更大实时性专项。
- 给 AlembicTest 的复测建议：
  - 复用小维度 test mode cold-start，观察 Jobs Timeline DOM：至少一条 `transition-nudge` 内容直接显示；一条 `llm.*` 短内容直接显示；构造或等待一条超过 `10` 行的事件验证仍可折叠展开。
  - 截图重点覆盖深色 / 浅色模式可读性和顶部 `本地 Alembic` tooltip 中的终端能力 / 沙箱信息。

#### SPSR-P4-Dashboard-Terminal-Readability 总控验收

- 验收时间：2026-05-24 19:29 CST。
- 代码证据：`AlembicDashboard/src/utils/jobProcessEvents.ts` 新增 `JOB_PROCESS_EVENT_CONTENT_COLLAPSE_LINE_LIMIT = 10` 和 `shouldCollapseProcessEventContentByDefault()`，transition 不折叠，超过 10 行才默认折叠；`AlembicDashboard/src/components/Views/JobsView.tsx` 用 `effectiveContentExpanded` 控制真实 DOM，短内容默认直接展示，主要文本颜色提升到 `text-slate-50` / `text-slate-200` / `text-slate-300`；`AlembicDashboard/src/hooks/useJobProcessEvents.ts` 未引入 hook 队列，socket 仍按单条 `job:process-event` normalize 后 `mergeProcessEvents(prev, [event])`。
- 测试证据：`AlembicDashboard/scripts/dashboard-contract.test.mjs` 覆盖 transition / 短内容 / 长内容折叠、DOM 可读色阶、socket 单事件追加和 hook 队列负向扫描。总控复跑 `npm run check` 通过，包含 lint、10/10 contract tests、`tsc --noEmit` 和 Vite production build；`git diff --check HEAD^ HEAD` 通过。Vite 仅有既有 chunk size warning。
- 工作区证据：提交 `37b6f7948333a4e97c043ffba1823866660ec5d2` 已覆盖 P4 主改动；总控后续发现 `AlembicDashboard` 仍有 `scripts/dashboard-contract.test.mjs` 和 `src/components/Views/JobsView.tsx` 的小 UI 色值 / contract 调整未提交，复跑 `npm run check` 通过，用户确认该小改动不影响主线推进。
- 总控结论：通过。`SPSR-P4-Dashboard-Terminal-Readability` 关闭；进入 `SPSR-P5-TestMode-Readability-Retest`。

### SPSR-P5-TestMode-Readability-Retest

- 窗口：`AlembicTest`
- 状态：待验收
- 派发时间：2026-05-24 19:29 CST
- 状态更新时间：2026-05-24 19:53 CST
- 阶段目标：Dashboard 修复后，用 test mode 或前端 fixture 验证用户指出的 UI 体验问题已闭合。
- 主线动作：基于已验收的 Dashboard P4，验证阶段转换直接展示、短 LLM 内容直接展示、长内容仍可折叠、颜色可读、WebSocket live append 一条一条出现、active cold-start 卡片或等价关键事件摘要可见；若测试环境使用当前本地 Dashboard dirty tree，需要在报告中记录 dirty 文件和是否影响截图判断。
- 合并 TODO：`GTODO-2026-05-24-032` 最终复测部分。
- 明确不包含：不做全量冷启动长跑；不改真实项目源码。
- 下一处真实阻塞点：需要真实运行中的 Dashboard UI 证据证明 P4 的阅读体验修复生效。
- 阻塞点之前还能做：当前可启动测试；不要做全量冷启动长跑。
- 验证命令：见 [alembic-test-exchange.md](../../../current/alembic-test-exchange.md)，以 `ALEMBIC_TEST_MODE=1` 小维度 cold-start、Jobs Timeline DOM / 截图和 socket append 观察为主。
- 回填要求：测试报告路径、job/session id、实时 append 证据、短内容展开证据、颜色可读截图、active card / summary 证据、真实项目 git 状态、Dashboard 是否使用 dirty tree 以及影响判断。
- 执行前置硬规则：后续启动时先读取 workspace `AGENTS.md`、本执行计划、`AlembicTest/AGENTS.md` 和测试执行规则；开始前明确声明当前窗口定位和本轮职责。

#### SPSR-P5-TestMode-Readability-Retest 回填

- 测试报告：[../../../AlembicTest/docs/scan-progress-semantic-readability-retest-2026-05-24.md](../../../../../AlembicTest/docs/scan-progress-semantic-readability-retest-2026-05-24.md)。
- job/session id：`bootstrap_mpjpm6yq_f5da9bdb` / `bs_1779623052105_eqfmi1`。
- 使用配置：`ALEMBIC_TEST_MODE=1`，`ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture`，`ALEMBIC_TEST_RESCAN_DIMS=architecture`；request `maxFiles=8`、`contentMaxLines=40`、`skipGuard=true`；Dashboard/API `http://127.0.0.1:55797`。
- 结论：阅读体验主项通过，live append 严格逐条仍部分失败。阶段转换和短 LLM 内容默认展示、长内容折叠、颜色可读、active card / completed summary 均有截图 / DOM 证据；Jobs 页面无需刷新可从 running 追加到 completed，但观测到 `33->35`、`42->44`、`44->46`、`58->61`、`69->78` 等批量落屏。
- 事件统计：`78` developer-facing events，`hidden/raw/secret=0`；`llm.input=27`、`llm.output=27`、`llm.reflection=12`、`summary=4`、`artifact=1`；`transition-nudge=4`、`planning-nudge=3`、`continue-nudge=2`、`reflection-nudge=1`、`convergence-nudge=1`、`dimension-findings-digest=1`。
- 阶段转换默认展示证据：sequence `22` `Agent 阶段转换 Nudge: VERIFY` 正文默认可见；截图 `AlembicTest/tmp/spsr-p5-transition-default-bootstrap_mpjpm6yq_f5da9bdb.png`。
- 短 LLM 默认展示证据：sequence `21` 短 `llm.output` 默认可见；同截图 `AlembicTest/tmp/spsr-p5-transition-default-bootstrap_mpjpm6yq_f5da9bdb.png`。
- 长内容折叠证据：sequence `7` 长 `llm.input` 默认显示 `展开内容` / `内容已收起`；截图 `AlembicTest/tmp/spsr-p5-long-folded-bootstrap_mpjpm6yq_f5da9bdb.png`。
- active card / summary 证据：运行中 `Candidates` cold-start 卡片显示 Nudge 摘要、job id、`任务详情` 入口和当前维度；截图 `AlembicTest/tmp/spsr-p5-active-card-bootstrap_mpjpm6yq_f5da9bdb.png`。完成态 Jobs summary 显示 `78` events、session 和效率摘要；截图 `AlembicTest/tmp/spsr-p5-final-jobs-bootstrap_mpjpm6yq_f5da9bdb.png`。
- Dashboard dirty tree：本轮 `dev:link` 构建的是 `AlembicDashboard` commit `37b6f7948333a4e97c043ffba1823866660ec5d2` 加当前 dirty 文件 `scripts/dashboard-contract.test.mjs`、`src/components/Views/JobsView.tsx`。截图证据有效，但发布封口仍建议 Dashboard 后续提交或解释 dirty tree。
- 真实项目 git 状态：`BiliDili` 测试前后 `git status --short` 均为空；未改 BiliDili。
- 验证命令：restart/test-mode/health/job enqueue/events API 均通过；第一次 restart preclean 停旧 PID 后脚本退出，确认无进程后重跑成功；第一次 curl payload quoting 错误后重跑成功；Browser console error 为空，未触发 React #31。
- 遗留风险：如果总控坚持“严格逐条终端式输出”是完成定义的一部分，应提升 `GTODO-2026-05-24-029` 为实时性专项；否则可验收 P5 阅读体验主项。

#### SPSR-P5-TestMode-Readability-Retest 总控验收

- 验收时间：2026-05-24 20:03 CST。
- 验收结论：通过。`SPSR-P5` 证明 `GTODO-2026-05-24-032` 的前端语义展示和阅读体验主项已经闭合：阶段转换和短 LLM 内容默认展示、长内容默认折叠且可展开、颜色可读、active cold-start card / completed summary 可见。
- 代码 / 运行证据：测试 job `bootstrap_mpjpm6yq_f5da9bdb` / session `bs_1779623052105_eqfmi1`，`78` 条 developer-facing events，`hidden/raw/secret=0`，包含 `transition-nudge=4`、`planning-nudge=3`、`continue-nudge=2`、`convergence-nudge=1`、`dimension-findings-digest=1`。
- UI 证据：`AlembicTest/tmp/spsr-p5-transition-default-bootstrap_mpjpm6yq_f5da9bdb.png` 证明 transition / 短 LLM 默认展示；`spsr-p5-long-folded-*.png` 证明长内容折叠；`spsr-p5-active-card-*.png` 证明运行中 cold-start 卡片摘要；`spsr-p5-final-jobs-*.png` 证明完成态 summary。
- 遗留判断：P5 仍观察到 live append 成批落屏，但页面无需刷新可恢复并完成；该问题归入既有 `GTODO-2026-05-24-029` 实时性观察 / 后续专项，不再阻塞 `GTODO-2026-05-24-032`。

#### AlembicDashboard 附加侧边栏修改总控验收

- 验收时间：2026-05-24 20:03 CST。
- 验收对象：用户同步的前端窗口 staged 修改，涉及 `scripts/dashboard-contract.test.mjs`、`src/App.tsx`、`src/components/Views/JobsView.tsx`、`src/hooks/useBootstrapSocket.ts`。
- 代码证据：
  - `JobsView` 移除卡片内 `expandedJobIds` / inline `JobProcessTimeline`，改为 `selectedTimelineJobId` + `Drawer`；`查看过程` 按钮打开侧边栏，`useJobProcessEvents(job.id, { enabled: open, active: isActive, limit: 120 })` 只在侧边栏打开时读取事件。
  - `JobProcessTimeline` 使用 `Drawer.Header` / `Drawer.Body` / `Drawer.CloseButton`，保留刷新、Esc 关闭、底部滚动和内容折叠逻辑；过程终端使用显式 light/dark 色值，避免任务卡片内堆叠长 LLM 内容。
  - `App.tsx` / `useBootstrapSocket.ts` 移除 `candidateCreatedTick` 和维度完成后 `setTimeout(() => fetchData(), 2000)`，避免 cold-start 中途因候选创建刷新内容区，把开发者注意力从后台任务侧边栏拉回主页面。
  - `dashboard-contract.test.mjs` 新增 `bootstrap dimension completion does not refresh content mid-run`，并锁定 Drawer 侧边栏、light/dark 可读色阶和 socket/REST 内容 normalization contract。
- 已提交基线：`AlembicDashboard` 已提交 `5a72c6b`（`Refine jobs timeline drawer`），总控补跑 `git diff --check HEAD^ HEAD` 通过。
- 追加 polish：前端窗口后续在 `JobsView` 中把事件数量 / retained / hidden / refreshing 信息合入 Drawer subtitle，并去掉 Timeline 外层卡片式描边；`dashboard-contract.test.mjs` 已同步锁定这些结构。提交 `c857bdf`（`Streamline jobs timeline drawer content`）已封口。
- 验证命令：
  - `npm run check`：通过，包含 Dashboard lint、11/11 contract tests、`tsc --noEmit` 和 Vite production build；Vite 仅保留既有 chunk size warning。
  - `git diff --check`：通过。
  - `git diff --check HEAD^ HEAD`：通过。
- 封口结果：代码验收通过；前端 polish 已由前端窗口提交 `c857bdf`，`AlembicDashboard` 工作区 clean。

## 窗口覆盖状态

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | `SPSR-P1-Alembic-Bridge-Projection` 总控验收通过。 |
| `AlembicCore`<br>观察中 | 当前 contract 已支持 `checkpoint` / `summary` / `llm.reflection` 和 metadata；第一波不改 Core。若 Alembic 证明需要新增公共 kind / typed metadata，再回填阻塞。 |
| `AlembicAgent`<br>已完成 | `SPSR-P1-Agent-Semantic-Events` 总控验收通过。 |
| `AlembicDashboard`<br>已完成 | 附加侧边栏 UI 修改已通过总控验收；polish 已提交 `c857bdf`，不再由 workspace 派发。 |
| `AlembicPlugin`<br>无任务 | 本问题属于 Alembic internal-agent cold-start / Dashboard 展示链路，不涉及 Codex plugin runtime。 |
| `AlembicTest`<br>已完成 | `SPSR-P5-TestMode-Readability-Retest` 总控验收通过。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码；后续只由 `AlembicTest` 在测试单中读取验证。 |

## 空闲窗口调度

| 窗口 | 调度状态 | 是否发送 | 说明 |
| --- | --- | --- | --- |
| `AlembicAgent` | 已完成 | 否 | `SPSR-P1-Agent-Semantic-Events` 总控验收通过。 |
| `Alembic` | 已完成 | 否 | `SPSR-P1-Alembic-Bridge-Projection` 总控验收通过。 |
| `AlembicDashboard` | 已完成 | 否 | 附加侧边栏 UI 修改已通过总控验收；polish 已提交 `c857bdf`，不再由 workspace 派发。 |
| `AlembicTest` | 已完成 | 否 | `SPSR-P5-TestMode-Readability-Retest` 总控验收通过。 |
| `AlembicCore` | 观察中 | 否 | 第一波不改。 |
| `AlembicPlugin` | 无任务 | 否 | 不在本链路。 |
| `BiliDili` | 无任务 | 否 | 只作为后续测试项目。 |

## 窗口分派

当前发送给：无。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicAgent`<br>已完成 | `SPSR-P1-Agent-Semantic-Events` 总控验收通过。 |
| `Alembic`<br>已完成 | `SPSR-P1-Alembic-Bridge-Projection` 总控验收通过。 |
| `AlembicCore`<br>观察中 | 当前 contract 已支持本轮需要的基础 kind；第一波不改。 |
| `AlembicDashboard`<br>已完成 | 附加侧边栏 UI 修改已通过总控验收；polish 已提交 `c857bdf`，不再由 workspace 派发。 |
| `AlembicPlugin`<br>无任务 | 本问题不涉及 Codex plugin runtime。 |
| `AlembicTest`<br>已完成 | `SPSR-P5-TestMode-Readability-Retest` 总控验收通过。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码；后续只由 `AlembicTest` 在测试单中读取验证。 |

## 可复制提示词

发送给：无。

```text
当前无可发送提示词；`GTODO-2026-05-24-032` 已完成，前端 polish 已提交 `c857bdf`，workspace 已归档。
```

不发送给：`AlembicAgent`、`Alembic`、`AlembicCore`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`、`BiliDili`。

## 回填区

- 2026-05-24 17:48 CST：总控将 `GTODO-2026-05-24-032` 从待排期提升为当前主线。第一波发送 `AlembicAgent` 和 `Alembic`；`AlembicDashboard` / `AlembicTest` 等待上游稳定事件样例。
- 2026-05-24 18:05 CST：`AlembicAgent` 完成 `SPSR-P1-Agent-Semantic-Events` 并回填，提交 `18af90800d1a835ccfde9bdf2c6e56289ebc5151`；transition / digest / continue / reflection nudge 均已产出 developer-safe semantic process event，验证通过。当前 `AlembicAgent` 待总控验收；发送名单收敛为 `Alembic`。
- 2026-05-24 18:09 CST：`Alembic` 完成 `SPSR-P1-Alembic-Bridge-Projection` 并回填，提交 `b504a3e8ad101cf673b0221d1dc06e6ac286709c`；Agent semantic progress bridge、dimension / tier findings digest projection 和 targeted tests 均已完成。当前 `AlembicAgent` / `Alembic` 均待总控验收；Dashboard / AlembicTest 仍等待总控复核后再启动。
- 2026-05-24 18:13 CST：总控复核 `AlembicAgent` / `Alembic` 真实代码与回填证据，两个任务包均验收通过；解除 Dashboard 阻塞，当前发送 `AlembicDashboard` 执行 `SPSR-P2-Dashboard-Semantic-Timeline`。
- 2026-05-24 18:24 CST：`AlembicDashboard` 完成 `SPSR-P2-Dashboard-Semantic-Timeline` 并提交 `a5a9c1a`；Jobs Timeline 消费 `semanticKind` / `nudgeType` / findings metadata，cold-start 卡片通过语义优先级选择 Nudge / 阶段转换 / 关键发现。验证：`npm run check`、`git diff --check`、`git diff --check HEAD^ HEAD` 均通过。当前等待总控验收，不发送新窗口。
- 2026-05-24 18:38 CST：总控复核 `AlembicDashboard` 真实代码与回填证据，`SPSR-P2-Dashboard-Semantic-Timeline` 验收通过；当前发送 `AlembicTest` 执行 `SPSR-P3-TestMode-Validation`，使用 test mode 小维度 cold-start 验证 API events 与 Dashboard 展示。
- 2026-05-24 19:07 CST：`AlembicTest` 完成 `Test-2026-05-24-06 / SPSR-P3-TestMode-Validation` 并回填。报告：[../../../AlembicTest/docs/scan-progress-semantic-richness-test-mode-2026-05-24.md](../../../../../AlembicTest/docs/scan-progress-semantic-richness-test-mode-2026-05-24.md)。job/session：`bootstrap_mpjnppg3_6e71a895` / `bs_1779619856790_6kosny`；`ALEMBIC_TEST_MODE=1`、`architecture` 小维度、`maxFiles=8`、`skipGuard=true`。API events `64` 条、`hiddenCount=0`；`planning-nudge=2`、`continue-nudge=2`、`reflection-nudge=1`、`transition-nudge=4`、`dimension-findings-digest=1`。Jobs Timeline DOM / 截图看到 `Nudge`、`阶段转换`、`反思`、`关键发现` 和 semantic chips；`BiliDili` 前后 git clean。遗留风险：completed-state `Candidates` 页面未保留 active cold-start 进度卡，因此 active card 语义优先级未被本轮截图证明；另 `AlembicDashboard` 验证时存在未提交 Header / contract test 改动，等待总控验收是否要求 Dashboard 封口或补测。
- 2026-05-24 19:10 CST：总控接受 `AlembicTest` 对 API / Jobs Timeline 语义主链路的验收证据，但用户验收截图指出 Dashboard UI 体验仍未达标：阶段转换和短 LLM 内容不应默认折叠、颜色对比不足、WebSocket live append 不应表现为攒几条刷新。当前发送 `AlembicDashboard` 执行 `SPSR-P4-Dashboard-Terminal-Readability`；`AlembicTest` 等修复后再复测。
- 2026-05-24 19:15 CST：用户暂停前端窗口，要求重新派发计划。总控作废 19:10 旧提示词，重新派发 `SPSR-P4-Dashboard-Terminal-Readability`：不在高频事件 hook 中新增无真实消费方队列，先删除 / 收敛暂未真实使用的 hook 或事件层封装；逐条展示如需处理，放在真实消费组件或轻量 view-model 层。
- 2026-05-24 19:25 CST：`AlembicDashboard` 完成 `SPSR-P4-Dashboard-Terminal-Readability` 并提交 `37b6f79`；折叠规则改为 transition 和不超过 `10` 行内容默认展示、长内容才折叠；未在 `useJobProcessEvents` 保留 queue / timer / 事件层封装，socket `job:process-event` 仍按单条 event normalize + merge；颜色对比和 DOM contract 已补强。验证：`npm run test`、`npm run check`、`git diff --check`、`git diff --check HEAD^ HEAD` 和队列负向扫描均通过。当前无发送窗口，等待总控验收后再启动 `AlembicTest` P5。
- 2026-05-24 19:29 CST：总控复核 `AlembicDashboard` P4 提交 `37b6f79`，源码、contract test、`npm run check` 和 `git diff --check HEAD^ HEAD` 通过；`SPSR-P4-Dashboard-Terminal-Readability` 验收通过。随后发现 `AlembicDashboard` 仍有 2 个小 UI 色值 / contract 调整未提交，复跑 `npm run check` 通过，用户确认不影响主线。当前发送 `AlembicTest` 执行 `SPSR-P5-TestMode-Readability-Retest`。
- 2026-05-24 19:53 CST：`AlembicTest` 完成 `SPSR-P5-TestMode-Readability-Retest` 并回填。报告：[../../../AlembicTest/docs/scan-progress-semantic-readability-retest-2026-05-24.md](../../../../../AlembicTest/docs/scan-progress-semantic-readability-retest-2026-05-24.md)。job/session：`bootstrap_mpjpm6yq_f5da9bdb` / `bs_1779623052105_eqfmi1`；阶段转换 / 短 LLM 默认展示、长内容折叠、颜色可读、active card / summary 均有截图证据；live append 无需刷新可完成恢复，但仍观察到成批落屏，严格逐条是否进入 `GTODO-2026-05-24-029` 待总控验收判断。
- 2026-05-24 20:03 CST：总控验收 `SPSR-P5-TestMode-Readability-Retest` 通过，`GTODO-2026-05-24-032` 的语义展示和阅读体验主目标达到；live append 严格逐条问题转入 `GTODO-2026-05-24-029` 观察 / 后续专项。同步验收用户补充的 `AlembicDashboard` 附加 UI 修改：后台任务卡片内嵌 Timeline / LLM 输出已改为 Drawer 侧边栏，`candidateCreatedTick` 中途刷新已移除；已提交基线为 `5a72c6b`，追加 polish diff 通过 `npm run check` 和 `git diff --check`，并由前端窗口提交 `c857bdf` 封口。当前无发送窗口。
