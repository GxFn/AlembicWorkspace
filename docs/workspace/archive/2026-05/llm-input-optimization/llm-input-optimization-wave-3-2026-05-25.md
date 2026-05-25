# LLM Input Optimization Wave 3

日期：2026-05-25
状态：总控验收通过，已转 Wave 4
发送给：无（本波已关闭；后续见 [llm-input-optimization-wave-4-2026-05-25.md](../../../current/llm-input-optimization-wave-4-2026-05-25.md)）
主线目标：在 Wave 2 input assembly / stage profile 已闭合后，推进 Phase 3 / Observation Ledger，把 LLM 输入里的 raw `之前的探索摘要` 收敛为结构化、可读、可去重的观察账本。

## 目标判断

用户当前目标仍是 LLM 输入优化主线，最终目标尚未完成。

已完成：

- Wave 1 correctness：`AlembicAgent` 提交 `6cff8beac414ca55eab4af85b31dfad0d1898711`，`AlembicTest` Test-05 通过总控验收。
- Wave 2 input layering：`AlembicAgent` 提交 `bf0a2c2cb0c3d760817ac699e5f47d83e0e5b4d9`，`AlembicTest` Test-06 通过总控验收。
- Wave 3 Observation Ledger：`AlembicAgent` 提交 `8970327d73bf6c01476a1aeb5384f014483b68dd`，source 侧 targeted validation 通过，回填见 [../../AlembicAgent/llm-input-optimization-agent-observation-ledger-2026-05-25.md](../../../../AlembicAgent/llm-input-optimization-agent-observation-ledger-2026-05-25.md)，总控代码侧验收通过；`AlembicTest` Test-07 已回填 source test-mode 复测通过，并由总控验收通过。

剩余主要差距：

- Prompt / output artifact、trace envelope、metrics 和 Dashboard 展示仍未做；下一波需要在 ledger 稳定后处理 artifact / display / observability。
- `AlembicAgent/dist` 未刷新风险已记录为 `GTODO-2026-05-25-002`，不阻塞本轮 source 代码实现，但 package/runtime 或 cold-start 集成验证前必须处理。

## 本波完成定义

本波完成后必须具备：

- `AlembicAgent` 内形成真实消费的 Observation Ledger 或等价结构，不是只新增空类型。
- 默认 provider input / developer-visible `llm.input` 不再回灌 raw compressed dump、callId、startedAt、durationMs、timestamp 这类调试字段。
- Ledger 至少覆盖已确认证据、已读文件 / 目的、已搜索关键词 / 规模、失败类别、下一步提示或等价信息。
- 保留 scratchpad confirmed findings 的最高优先级注入，不能因为 ledger 替换而丢失 `note_finding` / QualityGate 证据链。
- raw tool result / raw observation 不被删除；它们仍可留给日志、distill、后续 artifact 或开发者诊断，只是不默认进入 provider dynamic context。
- Targeted tests 覆盖 ledger 输出、raw dump 不进入 provider input、scratchpad findings 保留、Wave 1/2 关键回归不破坏。

## 阶段顺序

1. Wave 1 / Agent correctness：已通过。
2. Wave 2 / Agent input layering：已通过。
3. Wave 3 / Observation Ledger：本波，只启动 `AlembicAgent`。
4. Wave 4 / Artifact, trace and metrics：`Alembic` 持久化完整 redacted prompt / output artifact，并产生 `artifactRef`、trace envelope 和优化 metrics。
5. Wave 5 / Timeline and artifact display：`AlembicDashboard` 保持 Timeline 开发者摘要化展示，通过详情侧栏查看完整 artifact。
6. Wave 6 / Package/runtime and integration verification：处理 `dist` / runtime 产物后，由 `AlembicTest` 做 test-mode / 小 cold-start 级验证。

## 后续闭环约束

该约束来自 2026-05-25 用户讨论，归入 `GTODO-2026-05-24-040` 后续 Wave 4-6，不新建独立 TODO；当前不打断 Test-07。

建议闭环：

1. **Timeline**：只展示开发者可读摘要，一条一条出现；内容包括阶段、输入摘要、输出摘要、工具调用、Nudge、Reflection、关键发现。Timeline 不承担完整 prompt / output 保存职责。
2. **Prompt / Output Artifact**：每次 `llm.input` / `llm.output` 生成完整 redacted artifact；process event 只保存 `artifactRef`、section stats、chars / tokens、truncated 标记；artifact 存储在 Ghost dataRoot 的 job artifacts 下。
3. **Trace Envelope**：固定 `jobId` / `sessionId` / `dimensionId` / `iteration` / `correlationId` / `parentEventId`；LLM input、provider call、LLM output、tool execution、retrieval / search / read 都能按树回放。
4. **Metrics**：按 section 记录字符 / token / 占比；记录 input / output / reasoning / cacheHit tokens、duration、finishReason、empty retry、duplicate tool calls、read / search 去重、producer / analyze 阶段差异。
5. **Eval / Test**：`AlembicTest` 用 test-mode 验证没有 `[object Promise]`、没有 schema mismatch、Observation Ledger 不再 raw dump、Producer 不带分析预算、LLM output 不被无提示截断。

与实时性观察项的边界：`GTODO-2026-05-24-029` 继续只观察 WebSocket / UI 是否需要更细低延迟追加；本主线负责事件语义、artifact、trace、metrics 和质量验证闭环。

## 真实代码入口

本波必须以这些真实入口为主要证据：

- `AlembicAgent/src/agent/memory/ActiveContext.ts`：`buildContext(...)` 中 scratchpad 与 `## 📂 之前的探索摘要` 回灌逻辑；`distill()` 中 key findings / tool summary 输出。
- `AlembicAgent/src/agent/runtime/LLMInputAssembly.ts`：`dynamicContext` section 真实进入 provider runtime layer 和 developer-visible `llm.input`。
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts`：provider call 前 input assembly 消费 dynamic context。
- `AlembicAgent/src/agent/memory/MemoryCoordinator.ts`：session store / report 对 `distill()` 的消费边界。
- `AlembicAgent/test/llm-input-layering.test.ts`、`test/ContextWindow.test.ts`、`test/evidence-recording-phase-chain.test.ts`：现有 input / memory / evidence 回归测试入口。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| LLMI-P5-AGENT-OBSERVATION-LEDGER | `AlembicAgent` | 把 raw `之前的探索摘要` 替换为真实消费的 Observation Ledger，并补 targeted 回归。 | 代码侧验收通过 |

### LLMI-P5-AGENT-OBSERVATION-LEDGER：Agent 观察账本闭环

窗口：`AlembicAgent`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 13:27 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 13:48 CST

阶段目标：

- 在 Wave 2 section assembly 已稳定的基础上，修正 dynamic context 的内容来源。
- 让 LLM 看到“我读过什么、搜过什么、确认了什么、失败过什么、下一步该避免什么”，而不是 debug dump。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档、`docs/workspace/current/llm-input-optimization-research-2026-05-24.md`、`docs/workspace/current/llm-input-optimization-wave-2-2026-05-25.md` 和 `AlembicAgent/AGENTS.md`，并声明当前窗口定位和本轮仓库职责。
- 深挖 `ActiveContext` 的 observation 收集、压缩、`buildContext(...)`、`distill()` 和 `LLMInputAssembly` 的 dynamic context 消费链路。
- 实现 Observation Ledger 或等价结构。字段可以按真实代码调整，但必须能表达 evidence / readSet / searchSet / failureSet / nextHints 中至少四类语义。
- 替换 provider 默认 dynamic context 中的 raw `之前的探索摘要`。允许保留标题或中文展示名，但内容不得再是 raw JSON / callId / timestamp dump。
- 保留 scratchpad confirmed findings 的高优先级注入，并确认 `note_finding` / evidence recording 相关测试不回退。
- 不删除 raw observation 原始数据；如已有 distill / session store / report 消费 raw summary，需说明是否保留或新增 machine-friendly 投影。
- 增加 targeted tests：ledger 输出、raw debug 字段不进入 provider input、read/search/failure 去重语义、scratchpad findings 保留、Wave 2 input assembly metadata 不回退。
- 回填执行记录到 `docs/AlembicAgent/llm-input-optimization-agent-observation-ledger-2026-05-25.md`，并从当前计划挂回。

合并 TODO：

- `GTODO-2026-05-24-040` 的 Phase 3 / Observation Ledger。

明确不包含：

- 不刷新 `AlembicAgent/dist`；该后置门禁已记录为 `GTODO-2026-05-25-002`，等 source 侧输入结构稳定后统一处理。
- 不做 Alembic prompt artifact 持久化。
- 不改 Dashboard UI。
- 不改 Alembic daemon / JobStore。
- 不改 `AlembicPlugin`。
- 不启用 L4 compaction。
- 不跑 full cold-start。

下一处真实阻塞点：

- 若 Observation Ledger 不先稳定，Wave 4 artifact / Dashboard 会继续围绕 raw dynamic context 做展示，无法证明输入优化真正闭环。

阻塞点之前还能做：

- 本包应一次完成 ledger 真实消费、raw dump 默认移除、scratchpad 保护和 targeted tests；不要只新增 ledger 类型或只改文案。

验证命令：

```text
# 由 AlembicAgent 窗口按 AlembicAgent/AGENTS.md 选择等价命令。
npm test -- llm-input
npm test -- ActiveContext ContextWindow evidence-recording
npm run typecheck
npm run lint
npm run lint:agent-import-boundary
npm run lint:public-api-boundary
npm run lint:core-import-boundary
git diff --check
```

回填要求：

- 完成范围、文件 / 模块变化、提交 hash。
- 真实代码证据：列出 ledger 数据结构、ActiveContext 消费点、LLMInputAssembly / runtime 投影、tests 的修改点。
- 验证命令和结果。
- 说明 raw observation 去向、scratchpad findings 如何保留、哪些 debug 字段不再进入 provider input。
- 说明未做事项和下一波建议：`dist` 刷新、prompt artifact / Dashboard、AlembicTest。

执行前置硬规则：

- 先读取目标仓库 `AlembicAgent/AGENTS.md`，并明确当前窗口定位 / 仓库职责。

## 执行回填

回填文档：[../../AlembicAgent/llm-input-optimization-agent-observation-ledger-2026-05-25.md](../../../../AlembicAgent/llm-input-optimization-agent-observation-ledger-2026-05-25.md)

完成范围：

- `ActiveContext` 生成并渲染真实消费的 `Observation Ledger`，默认 provider dynamic context 不再输出 raw `## 📂 之前的探索摘要`。
- Ledger 覆盖 `evidence`、`readSet`、`searchSet`、`failureSet`、`nextHints`，并对 read/search/failure/hint 做 key 级去重。
- scratchpad confirmed findings 仍作为最高优先级 section 输出在 ledger 前，`note_finding` / QualityGate 证据链未改。
- raw observation / compressed summary 保留给 `distill()`、日志和后续 artifact / 诊断路径；本轮只改变 provider 默认 dynamic context 投影。
- Targeted tests 覆盖 ActiveContext ledger、raw debug 字段过滤、scratchpad 优先级、provider runtime layer 和 Wave 2 metadata 不回退。

提交 hash：

- `AlembicAgent`：`8970327d73bf6c01476a1aeb5384f014483b68dd`

验证命令和结果：

| 命令 | 结果 |
| --- | --- |
| `npm test -- llm-input` | 通过，2 files / 11 tests |
| `npm test -- ActiveContext ContextWindow evidence-recording` | 通过，3 files / 16 tests |
| `npm run typecheck` | 通过 |
| `npm run lint` | 通过 |
| `npm run lint:agent-import-boundary` | 通过 |
| `npm run lint:public-api-boundary` | 通过 |
| `npm run lint:core-import-boundary` | 通过 |
| `git diff --check` | 通过 |

遗留风险：

- Ledger 当前只覆盖 ActiveContext 已压缩的旧 observation；最近滑动窗口内尚未压缩的 raw observation 仍按既有 tool result / message context 边界保留。
- `distill().toolCallSummary` 仍保留原压缩摘要，后续 prompt artifact 如果展示 distill，需要 artifact-specific redaction。
- `AlembicAgent/dist` 未刷新，仍作为 package/runtime 或 cold-start 集成验证前的后置门禁。

下一步建议：

- 总控先做代码侧验收；通过后创建 `AlembicTest` 最小 test-mode 复测单，验证真实 retained `llm.input` / provider message 中 ledger 与 debug 字段收敛。
- 后续 Wave 4 再派发 `Alembic` 做 prompt / output artifact、process event bridge、trace envelope 和 metrics；Wave 5 再派 `AlembicDashboard` 做 Timeline 摘要和 artifact 详情侧栏。

## 总控验收

复核时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 13:56 CST

复核结论：`AlembicAgent` Wave 3 代码侧验收通过，进入 `AlembicTest` 最小 test-mode 复测。

代码事实：

- `ActiveContext` 新增 `ObservationLedgerItem` / category / limit / debug key 收敛，并在 `buildContext(...)` 中保持 scratchpad 先输出，再输出 `## Observation Ledger`。
- 默认 provider dynamic context 不再输出 raw `## 📂 之前的探索摘要`；raw compressed summary 仍保留在 `distill().toolCallSummary`，用于日志、后续 artifact 或开发者诊断。
- Ledger 从 compressed observations 中提取 `evidence`、`readSet`、`searchSet`、`failureSet`、`nextHints`，并对 key 做去重。
- `llm-input-layering` 回归证明 provider runtime layer 实际包含 `## Observation Ledger`，且不包含 `callId`、`startedAt`、`durationMs` 等 raw debug 字段。

总控复跑验证：

| 命令 | 结果 |
| --- | --- |
| `npm test -- llm-input` | 通过，2 files / 11 tests |
| `npm test -- ActiveContext ContextWindow evidence-recording` | 通过，3 files / 16 tests |
| `npm run typecheck` | 通过 |
| `npm run lint` | 通过，234 files |
| `npm run lint:agent-import-boundary` | 通过 |
| `npm run lint:public-api-boundary` | 通过 |
| `npm run lint:core-import-boundary` | 通过，234 files / 48 `@alembic/core` imports |
| `git diff --check HEAD^ HEAD` | 通过 |

工作区状态：

- `AlembicAgent` 工作区干净。
- 提交 hash 与回填一致：`8970327d73bf6c01476a1aeb5384f014483b68dd`。

遗留与下一步：

- `AlembicAgent/dist` 未刷新继续保留为 `GTODO-2026-05-25-002`，package/runtime 或 cold-start 集成验证前必须处理。
- 已创建 `Test-2026-05-25-07 / LLMI-P6-Agent-Observation-Ledger-TestMode`，当前发送给 `AlembicTest`。
- `Alembic` / `AlembicDashboard` 的 prompt / output artifact、trace、metrics、Timeline 摘要和 artifact 详情侧栏等后续 Wave 等 `AlembicTest` 复测通过后再启动。

## AlembicTest 回填

回填时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 14:15 CST

回填结论：`Test-2026-05-25-07 / LLMI-P6-Agent-Observation-Ledger-TestMode` source test-mode 复测通过；随后总控验收通过。

报告路径：[../../../AlembicTest/docs/llm-input-observation-ledger-test-mode-2026-05-25.md](../../../../../AlembicTest/docs/llm-input-observation-ledger-test-mode-2026-05-25.md)

执行范围：

- 只使用 AlembicAgent source test-mode / minimal fixture。
- 未跑 full cold-start / rescan，未启动新的 daemon job。
- 未操作 BiliDili 业务代码，未修改任何产品源码。

使用配置：

- `ALEMBIC_TEST_MODE=1`
- AlembicAgent package version：`0.2.0`
- AlembicAgent commit：`8970327d73bf6c01476a1aeb5384f014483b68dd`
- Probe 脚本：`AlembicTest/scripts/probe-llm-observation-ledger.mjs`

验证命令和结果：

| 命令 | 结果 |
| --- | --- |
| `node --check AlembicTest/scripts/probe-llm-observation-ledger.mjs` | 通过 |
| `node AlembicTest/scripts/probe-llm-observation-ledger.mjs --help` | 通过 |
| `npm --prefix AlembicTest run check` | 通过 |
| `ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-llm-observation-ledger.mjs --out AlembicTest/tmp/llm-input-observation-ledger-test-mode-2026-05-25.json --vitest-output AlembicTest/tmp/llm-input-observation-ledger-vitest-2026-05-25.json --capture-output AlembicTest/tmp/llm-input-observation-ledger-runtime-capture-2026-05-25.json --capture-vitest-output AlembicTest/tmp/llm-input-observation-ledger-runtime-capture-vitest-2026-05-25.json` | 通过，内部 AlembicAgent targeted Vitest `13/13`，runtime capture Vitest `1/1` |

关键证据：

- retained `llm.input`：`containsRuntimeLayer=true`、`containsObservationLedger=true`、`containsRawPreviousSummary=false`、`categoryPresence.evidence/readSet/searchSet/failureSet/nextHints=true`、`scratchpadBeforeLedger=true`。
- provider message：`containsRuntimeLayer=true`、`containsDynamicContext=true`、`containsObservationLedger=true`、`containsRawPreviousSummary=false`、五类 category 均出现。
- debug 字段收敛：provider-facing ledger 与 retained input ledger 中 `callId`、`parentCallId`、`startedAt`、`durationMs`、`timestamp`、`diagnostics`、`structuredContent`、`_meta` 均未出现。
- Wave 1 / Wave 2 回归：`containsObjectPromise=false`、`containsMissingRequiredPath=false`、`inputLayerAppended=true`、`inputStageProfile="analyze"`；targeted Vitest `13/13` 覆盖 `llm-input-correctness`、`llm-input-layering` 和 `ActiveContext observation ledger`。

工作区状态：

- `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicPlugin`、`AlembicDashboard`、`BiliDili` 收口时 `git status --short` 均为空。
- `AlembicTest` 新增本轮 probe / 报告并更新脚本索引。
- `AlembicWorkspace` 本轮回填当前文档，待总控统一提交。

提交 hash：

- 无。本轮为 `AlembicTest` 复测和文档回填，未提交仓库。

遗留风险：

- 未覆盖 full cold-start / rescan、真实 provider 长任务、Dashboard 展示、完整 redacted prompt artifact、trace envelope、metrics 或 Recipe / Skill 质量回归。
- Runtime capture 使用 source transform，不代表当前 package `dist` 产物；`AlembicAgent/dist` 未刷新继续保留为 `GTODO-2026-05-25-002`。

下一步建议：

- 总控已验收 Test-07 并关闭 Wave 3 source test-mode 复测门。
- 后续已启动 [Wave 4](../../../current/llm-input-optimization-wave-4-2026-05-25.md)，发送给 `Alembic` 做 prompt / output artifact、trace envelope 和 metrics；进入 package/runtime 或 cold-start 集成前仍需安排 `AlembicAgent` 刷新并验证 `dist/`。

## 总控最终验收

复核时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 14:32 CST

复核结论：Wave 3 通过，关闭 Observation Ledger source test-mode 复测门，主线转入 Wave 4。

证据判断：

- `AlembicTest` Test-07 证明 retained `llm.input` 与 provider message 均包含 `## Observation Ledger`，`evidence/readSet/searchSet/failureSet/nextHints` 五类语义均出现。
- raw `之前的探索摘要` 不再进入 retained input / provider message；provider-facing ledger 与 retained input ledger 中 `callId`、`parentCallId`、`startedAt`、`durationMs`、`timestamp`、`diagnostics`、`structuredContent`、`_meta` 均未出现。
- scratchpad confirmed findings 保持在 ledger 前，Wave 1 / Wave 2 regression 继续证明无 `[object Promise]`、无 `Missing required param "path"`、`inputLayerAppended=true`、`inputStageProfile="analyze"`。

边界判断：

- 本波只关闭 `AlembicAgent` source test-mode / minimal fixture 口径。
- prompt / output artifact、trace envelope、metrics、Dashboard artifact 详情、小 cold-start / package runtime 验证仍未完成，不得把 LLM 输入优化主线归档。
- `AlembicAgent/dist` 未刷新继续保留为 `GTODO-2026-05-25-002`，进入 package/runtime 或 cold-start 集成验证前必须处理。

下一步：

- 启动 [LLM 输入优化 Wave 4](../../../current/llm-input-optimization-wave-4-2026-05-25.md)，发送给 `Alembic` 做完整 redacted prompt / output artifact、trace envelope、metrics 和 process event bridge。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 / 推荐窗口 | 事项 / 目标 | 影响复测 / 派发 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-24-040 | 当前主线 Wave 3 验收通过，已转 Wave 4 | internal agent llm input optimization | P0 | `AlembicAgent` / `Alembic` / `AlembicDashboard` / `AlembicTest` | LLM 输入优化闭环。Observation Ledger source 侧和 `AlembicTest` Test-07 均已通过总控验收；后续继续做 prompt / output artifact、trace envelope、metrics、Timeline 摘要展示、artifact 详情和 integration。 | 是 | 进入 `Alembic` artifact / trace / metrics 波次，见 [llm-input-optimization-wave-4-2026-05-25.md](../../../current/llm-input-optimization-wave-4-2026-05-25.md)。 |
| GTODO-2026-05-25-002 | 后置门禁 | build artifact sync | P1 | `AlembicAgent` | `AlembicAgent/dist` 未刷新，source test-mode 通过但 package/runtime/cold-start 验证前会消费旧产物。 | 是 | Source 侧输入结构稳定后，package/runtime 或 cold-start 集成验证前必须刷新并验证 dist。 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `AlembicAgent` | 已完成 | 否 | Observation Ledger source 侧已通过总控代码验收。 |
| `Alembic` | 观察中 | 否 | 等 Ledger 输出稳定后再接 prompt / output artifact、process event bridge、trace envelope 和 metrics。 |
| `AlembicCore` | 观察中 | 否 | 暂不下沉；只有出现第二消费方或 Agent 回填阻塞时启动。 |
| `AlembicDashboard` | 观察中 | 否 | Dashboard 等 Alembic artifact / trace API 稳定后再接 Timeline 摘要和 artifact 详情侧栏。 |
| `AlembicPlugin` | 无任务 | 否 | 本主线是 Alembic internal Agent 输入，不改变 Codex Plugin host-agent 路由。 |
| `AlembicTest` | 已完成 | 否 | Test-2026-05-25-07 已由总控验收通过。 |
| `BiliDili` | 无任务 | 否 | 不改真实 iOS 项目源码。 |

## 窗口分派

发送给：无（本波已关闭；后续见 [llm-input-optimization-wave-4-2026-05-25.md](../../../current/llm-input-optimization-wave-4-2026-05-25.md)）

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicAgent`<br>已完成 | `LLMI-P5-AGENT-OBSERVATION-LEDGER` 代码侧验收通过。 |
| `Alembic`<br>观察中 | 等 ledger 稳定后，再做 prompt / output artifact、process event bridge、trace envelope 和 metrics。 |
| `AlembicCore`<br>观察中 | 暂不下沉。 |
| `AlembicDashboard`<br>观察中 | 等 artifact / trace API。 |
| `AlembicPlugin`<br>无任务 | 不参与本轮。 |
| `AlembicTest`<br>已完成 | `Test-2026-05-25-07 / LLMI-P6-Agent-Observation-Ledger-TestMode` 已由总控验收通过。 |
| `BiliDili`<br>无任务 | 不参与本轮。 |

## 可复制分派提示词

发送给：无。

```text
当前无可复制分派提示词；Wave 3 已关闭，后续提示词见 llm-input-optimization-wave-4-2026-05-25.md。
```
