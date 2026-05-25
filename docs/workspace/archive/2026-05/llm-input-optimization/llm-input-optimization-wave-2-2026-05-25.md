# LLM Input Optimization Wave 2

日期：2026-05-25
状态：总控验收通过，已转 Wave 3
主线目标：在 Wave 1 correctness 已闭合后，推进 Phase 2 / Input Assembly Layering，把 Alembic internal Agent 的 LLM 输入从多处字符串堆叠收敛为明确的 section 化装配与 stage profile，先关闭重复策略和阶段 profile 混杂问题。

## 目标判断

用户当前目标仍是 LLM 输入优化主线。Wave 1 已完成：

- `AlembicAgent` 提交 `6cff8beac414ca55eab4af85b31dfad0d1898711` 并通过总控代码侧验收。
- `AlembicTest` `Test-2026-05-25-05 / LLMI-P2-Agent-Correctness-TestMode` 已通过总控验收，证明 retained `llm.input` 中无 `[object Promise]`，`code.read({ filePaths })` 真实可用且无 `Missing required param "path"`，SCAN planning 与 `toolChoice=none` 一致。

当前最终目标仍未全部达到。剩余主要差距：

- Analyze / Record / Summarize / Produce 输入 profile 还没有明确分层。
- prompt policy、预算、工具规则、`note_finding` 要求仍可能在 `ANALYST_SYSTEM_PROMPT`、capability fragment、`SystemPromptBuilder.injectBudget`、stage nudge / QualityGate 文案中重复堆叠。
- Producer 阶段仍需要确保不继承 Analyst 探索预算。
- Observation Ledger、完整 prompt artifact、Dashboard 展示和最终 AlembicTest 集成验证留给后续 Wave。

## 本波完成定义

本波完成后必须具备：

- `AlembicAgent` 内形成真实消费的 LLM input section assembly，而不是只增加空 type / 空 adapter。
- 至少区分 `identity`、`stagePolicy`、`toolContract`、`taskContext`、`evidenceContext`、`dynamicContext` 或等价 section，并能投影到 provider input / developer-visible `llm.input`。
- Analyze / Record / Summarize / Produce 至少有明确 profile 差异：Record 不再注入探索型 code / graph 要求；Summarize 停止工具；Produce 不继承 Analyst 探索预算。
- 重复预算、重复工具规则、重复 `note_finding` 要求有可测的收敛，不靠人工约定。
- 保留现有 static system prompt cache 与 ephemeral dynamic context 保护点，不把每轮变化内容重新塞回 system prompt。
- targeted tests、typecheck、lint、边界 lint 和 `git diff --check` 通过。

## 阶段顺序

1. **Wave 1 / Agent correctness**：已通过。
2. **Wave 2 / Agent input layering**：本波，只启动 `AlembicAgent`。
3. **Wave 3 / Observation ledger**：把 raw observation dump 替换为结构化 ledger。
4. **Wave 4 / Artifact and display**：`Alembic` 持久化完整 redacted prompt artifact，`AlembicDashboard` 展示 artifact ref / 详情入口。
5. **Wave 5 / Integration verification**：`AlembicTest` 用 test-mode 验证 Phase 1-4 和 Recipe / Skill 产出不回退。

## 真实代码入口

本波任务应以这些真实入口为主要证据：

- `AlembicAgent/src/agent/prompts/insight-analyst.ts`：Analyst 静态 prompt 与 `buildAnalystPrompt(...)`。
- `AlembicAgent/src/agent/runtime/SystemPromptBuilder.ts`：capability prompt fragment、dynamic context 和 budget 注入。
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts`：provider call 前的 dynamic context、toolChoice、developer-visible `llm.input`。
- `AlembicAgent/src/agent/context/exploration/ExplorationStrategies.ts`、`PlanTracker.ts`、`NudgeGenerator.ts`：阶段机、toolChoice 和阶段提示。
- `AlembicAgent/src/agent/prompts/insight-producer.ts`、`src/agent/profiles/presets.ts`、`src/agent/prompts/scan-prompts.ts`：Producer prompt / profile / stage builder。
- `AlembicAgent/src/agent/memory/ActiveContext.ts`、`MemoryCoordinator.ts`：dynamic memory / scratchpad / observation 注入边界。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| LLMI-P3-AGENT-INPUT-LAYERING | `AlembicAgent` | 建立真实消费的 section 化 input assembly，收敛重复 prompt policy，并区分 Analyze / Record / Summarize / Produce 输入 profile。 | 总控验收通过 |

### LLMI-P3-AGENT-INPUT-LAYERING：Agent 输入分层闭环

窗口：`AlembicAgent`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 11:43 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 12:05 CST

阶段目标：

- 把 Wave 1 修好的 correctness 作为基础，继续解决输入结构和重复策略问题。
- 优先在 `AlembicAgent` 内闭环；除非发现第二消费方或真实共享 contract 阻塞，不下沉 `AlembicCore`。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档、`docs/workspace/current/llm-input-optimization-research-2026-05-24.md`、`docs/workspace/current/llm-input-optimization-wave-1-2026-05-25.md` 和 `AlembicAgent/AGENTS.md`，并声明当前窗口定位和本轮仓库职责。
- 深挖当前 provider input 装配链路：`buildAnalystPrompt(...)`、`SystemPromptBuilder.build(...)`、`injectBudget(...)`、`AgentRuntime` dynamic context / `llm.input` formatter、stage nudge / toolChoice。
- 建立真实消费的 section assembly。实现方式由 `AlembicAgent` 根据代码结构决定，但必须有 provider input 或 developer-visible `llm.input` 消费，不得只写空 contract。
- 收敛重复策略：预算、工具规则、`note_finding` 要求、阶段行为不能在多个 fragment 中互相重复或冲突；允许保留必要摘要，但要能通过测试判断重复被控制。
- 区分 stage profile：Analyze / Record / Summarize / Produce 的输入内容、工具契约和阶段规则要有明确差异；尤其 Producer 不能携带 Analyst 探索预算或搜索 / graph 规则。
- 保留已有保护点：static prompt cache、ephemeral dynamic context、ContextWindow tool result 原子性、BudgetController / tool result budget、Tool registry 单一真相源、Producer existing findings / evidenceMap。
- 增加 targeted tests：section assembly、重复 policy 收敛、Record / Summarize / Produce profile 差异、developer-visible `llm.input` section / metadata 可读性。
- 回填执行记录到 `docs/AlembicAgent/llm-input-optimization-agent-input-layering-2026-05-25.md`，并从当前计划挂回。

合并 TODO：

- `GTODO-2026-05-24-040` 的 Phase 2 / Input Assembly Layering。

明确不包含：

- 不做 Observation Ledger 完整替换。
- 不做 Alembic prompt artifact 持久化。
- 不改 Dashboard UI。
- 不改 Alembic daemon / JobStore。
- 不改 `AlembicPlugin`。
- 不启用 L4 compaction。
- 不跑 full cold-start。

下一处真实阻塞点：

- 如果输入 section / profile 没有先稳定，后续 Observation Ledger、prompt artifact 和 Dashboard 展示会继续消费混杂输入，容易把展示问题误当成存储或前端问题。

阻塞点之前还能做：

- 本包应一次完成 section assembly 的真实消费、重复策略收敛、stage profile 差异和 targeted tests；不要只新增接口或只移动字符串。

验证命令：

```text
# 由 AlembicAgent 窗口按 AlembicAgent/AGENTS.md 选择等价命令。
npm test -- llm-input
npm test -- AgentRuntime SystemPromptBuilder
npm run typecheck
npm run lint
npm run lint:agent-import-boundary
npm run lint:public-api-boundary
npm run lint:core-import-boundary
git diff --check
```

回填要求：

- 完成范围、文件 / 模块变化、提交 hash。
- 真实代码证据：列出 section assembly、runtime formatter、stage profile、producer prompt / profile 和 tests 的修改点。
- 验证命令和结果。
- 说明保留了哪些已有保护点，删除 / 合并了哪些重复 prompt policy。
- 说明未做事项和下一波建议：Observation Ledger、artifact / Dashboard、AlembicTest。

执行前置硬规则：

- 先读取目标仓库 `AlembicAgent/AGENTS.md`，并明确当前窗口定位 / 仓库职责。

执行回填：

- 2026-05-25 12:05 CST：`AlembicAgent` 完成并提交 `bf0a2c2cb0c3d760817ac699e5f47d83e0e5b4d9`。回填记录见 [../../AlembicAgent/llm-input-optimization-agent-input-layering-2026-05-25.md](../../../../AlembicAgent/llm-input-optimization-agent-input-layering-2026-05-25.md)。
- 完成范围：新增真实消费的 `LLMInputAssembly`，`AgentRuntime` provider input 与 developer-visible `llm.input` 同源投影；`SystemPromptBuilder` 分离 Producer / RECORD budget；`ExplorationTracker` / `NudgeGenerator` 补齐 producer pipeline profile；新增 `llm-input-layering` targeted tests。
- 验证结果：`npm test -- llm-input`、`npm test -- AgentRuntime SystemPromptBuilder`、`npm run typecheck`、`npm run lint`、`npm run lint:agent-import-boundary`、`npm run lint:public-api-boundary`、`npm run lint:core-import-boundary`、`git diff --check` 均通过；额外 `npm test` 全量通过（21 files / 101 tests）。
- 遗留风险：静态领域 prompt 未做大幅裁剪；本轮通过 runtime input layer 和 Producer budget 收敛真实消费边界。建议总控验收后派 `AlembicTest` 做最小 test-mode 复测，再进入 Observation Ledger。

## 总控验收结论

验收时间（北京时间）：2026-05-25 12:58 CST

结论：`LLMI-P3-AGENT-INPUT-LAYERING` 通过总控代码侧验收。

证据：

- `AlembicAgent` 提交 `bf0a2c2cb0c3d760817ac699e5f47d83e0e5b4d9`，工作区 `git status --short` 为空。
- `src/agent/runtime/LLMInputAssembly.ts` 新增真实消费的 input section assembly，包含 `identity`、`stagePolicy`、`toolContract`、`taskContext`、`evidenceContext`、`dynamicContext`，并产生 `inputStageProfile` / `inputSectionIds` / `inputLayerAppended` metadata。
- `src/agent/runtime/AgentRuntime.ts` 在 provider call 前构建 `LLMInputAssembly`，把 `providerMessages` 作为真实 provider 输入，同时让 developer-visible `llm.input` 从同一 assembly 投影。
- `src/agent/runtime/SystemPromptBuilder.ts` 分离 Producer / RECORD 预算，避免 Producer 继承 Analyst 探索预算。
- `ExplorationTracker` / `NudgeGenerator` / `ExplorationStrategies` 补齐 `producer` pipeline profile，Producer summarize 不再落入 bootstrap dimensionDigest 口径。
- `test/llm-input-layering.test.ts` 覆盖 provider / `llm.input` 同源 sections、RECORD note_finding-only、Producer profile / budget、SystemPromptBuilder producer budget 和 producer tracker 默认 pipeline type。
- 总控复跑验证：`npm test -- llm-input`、`npm test -- AgentRuntime SystemPromptBuilder`、`npm run typecheck`、`npm run lint`、`npm run lint:agent-import-boundary`、`npm run lint:public-api-boundary`、`npm run lint:core-import-boundary`、`git -C AlembicAgent diff --check HEAD^ HEAD` 均通过。

未关闭的最终目标差距：

- 本波关闭 input assembly / stage profile / prompt policy 收敛的代码侧闭环；还未由 `AlembicTest` 证明真实 retained `llm.input` events 中 section metadata、Record / Produce profile 和 runtime layer 可观测。
- Observation Ledger、prompt artifact 持久化、Dashboard artifact 展示和最终 Recipe / Skill 质量回归仍留给后续 Wave。

下一步：`AlembicTest` 已回填 `Test-2026-05-25-06 / LLMI-P4-Agent-Input-Layering-TestMode` 通过，且已由总控复核通过；当前进入 [Wave 3 / Observation Ledger](../../../current/llm-input-optimization-wave-3-2026-05-25.md)。

## AlembicTest 复测回填

回填时间（北京时间）：2026-05-25

结论：通过（test-mode / source runtime 范围内通过）。

完成范围：

- 新增 AlembicTest probe `AlembicTest/scripts/probe-llm-input-layering.mjs`，使用 `ALEMBIC_TEST_MODE=1` 执行 source test-mode / minimal fixture。
- 执行 `AlembicAgent` targeted `llm-input-layering` tests，结果 `5/5` 通过。
- 执行临时 runtime capture fixture，结果 `3/3` 通过，并输出运行态 `llm.input.metadata` / provider runtime layer / RECORD / PRODUCE profile 证据。
- 复用 Test-05 correctness probe 做 Wave 1 regression，证明无 `[object Promise]`、无 `Missing required param "path"`、batch partial failure 仍为 true。
- 未启动 daemon，未跑 full cold-start，未操作 BiliDili 业务代码，未修改产品源码。

提交 hash：`6f9514cb3c586d3b3d23e2e52eb7a6ce4b17e40b`。测试完成后用户要求提交代码，`AlembicTest` 已将本轮 probe / 报告连同前序未提交测试资产封口提交。

验证命令：

```text
node --check AlembicTest/scripts/probe-llm-input-layering.mjs
node AlembicTest/scripts/probe-llm-input-layering.mjs --help
npm --prefix AlembicTest run check
npm --prefix AlembicAgent test -- llm-input-layering --reporter=verbose
ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-llm-input-layering.mjs --out AlembicTest/tmp/llm-input-layering-test-mode-2026-05-25.json --vitest-output AlembicTest/tmp/llm-input-layering-vitest-2026-05-25.json --capture-output AlembicTest/tmp/llm-input-layering-runtime-capture-2026-05-25.json --capture-vitest-output AlembicTest/tmp/llm-input-layering-runtime-capture-vitest-2026-05-25.json --wave1-output AlembicTest/tmp/llm-input-layering-wave1-regression-2026-05-25.json
```

验证结果：

- `llm-input-layering` targeted Vitest：`5/5` 通过。
- Runtime capture fixture：`3/3` 通过。
- Analyze `llm.input.metadata`：`inputLayerAppended=true`、`inputStageProfile="analyze"`、`inputSectionIds=["identity","stagePolicy","toolContract","taskContext","evidenceContext","dynamicContext"]`、`providerVisibleSectionIds` 同步。
- Developer-visible input：`Identity`、`Stage policy`、`Tool contract`、`Task context`、`Evidence context`、`Dynamic context`、`Provider runtime layer` 均可见。
- Provider messages：runtime layer 包含 `# LLM input runtime layer`。
- RECORD：`inputStageProfile="record"`，`toolSchemaNames=["note_finding"]`，无 `code({ action` / `graph({ action` 探索指令。
- PRODUCE：`inputStageProfile="produce"`，Producer budget 生效，无 Analyst `探索阶段` / `结构化查询`。
- Wave 1 regression：`noObjectPromiseInAnalystPrompt=true`、`noObjectPromiseInRetainedInput=true`、`noMissingPathRegression=true`、`batchPartialFailure=true`。

详细报告：[../../../AlembicTest/docs/llm-input-layering-test-mode-2026-05-25.md](../../../../../AlembicTest/docs/llm-input-layering-test-mode-2026-05-25.md)。

遗留风险：

- 当前 `AlembicAgent/dist/` 未刷新，`dist/agent/runtime/LLMInputAssembly.js` 不存在，`dist/agent/runtime/AgentRuntime.js` 仍为旧 dynamicContext-only 路径。归口 `AlembicAgent` 发布 / 构建产物同步；不阻塞本轮 source test-mode 复测结论，但会阻塞 package/runtime 级验证。
- 未覆盖 full cold-start、真实 provider 长任务、Dashboard 展示、Observation Ledger、完整 redacted prompt artifact 或 Recipe / Skill 质量回归。

下一步建议：

- 总控验收后关闭 Wave 2 source test-mode 复测门。
- 在进入 package/runtime 或 cold-start 集成前，安排 `AlembicAgent` 刷新并验证 `dist/`。
- 后续按阶段进入 Wave 3 Observation Ledger。

## 总控复核结论

复核时间（北京时间）：2026-05-25 13:27 CST

结论：`Test-2026-05-25-06 / LLMI-P4-Agent-Input-Layering-TestMode` 通过总控验收，关闭 Wave 2 source test-mode 复测门。

证据判断：

- 测试报告覆盖了本测试单的硬目标：Analyze `llm.input.metadata.inputLayerAppended=true`，`inputStageProfile="analyze"`，`inputSectionIds` / `providerVisibleSectionIds` 覆盖 `identity/stagePolicy/toolContract/taskContext/evidenceContext/dynamicContext`。
- Developer-visible input 与 provider message 均包含 runtime layer，证明不是只改展示文本。
- RECORD profile 为 `note_finding` only，无 code / graph 探索指令；PRODUCE profile 使用 Producer budget，无 Analyst `探索阶段` / `结构化查询`。
- Wave 1 regression 仍通过：无 `[object Promise]`，无 `Missing required param "path"`，batch partial failure 为 true。
- 本轮未覆盖 full cold-start、真实 provider 长任务、Dashboard 展示、Observation Ledger、完整 redacted prompt artifact 或 Recipe / Skill 质量回归，这些仍属于后续 Wave。

遗留风险归口：

- `AlembicAgent/dist` 未刷新已单独登记为 `GTODO-2026-05-25-002`。它不阻塞本轮 source test-mode 结论，但在 package/runtime 或 cold-start 集成验证前必须处理。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 / 推荐窗口 | 事项 / 目标 | 影响复测 / 派发 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-24-040 | 当前主线转 Wave 3 | internal agent llm input optimization | P0 | `AlembicAgent` / `AlembicTest` | LLM 输入分层：section assembly、stage profile、重复 prompt policy 收敛。 | 是 | Wave 2 source test-mode 已通过总控验收；进入 [Wave 3 / Observation Ledger](../../../current/llm-input-optimization-wave-3-2026-05-25.md)。 |
| GTODO-2026-05-25-002 | 后置门禁 | build artifact sync | P1 | `AlembicAgent` | `AlembicAgent/dist` 未刷新，source test-mode 通过但 package/runtime/cold-start 验证前会消费旧产物。 | 是 | Source 侧输入结构稳定后，package/runtime 或 cold-start 集成验证前必须刷新并验证 dist。 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `AlembicAgent` | 已完成 | 否 | `LLMI-P3-AGENT-INPUT-LAYERING` 代码侧与 test-mode 复测均已通过；下一波由 [Wave 3](../../../current/llm-input-optimization-wave-3-2026-05-25.md) 另行派发。 |
| `Alembic` | 观察中 | 否 | Artifact / process event bridge 等 Wave 2 输出稳定后再接入。 |
| `AlembicCore` | 观察中 | 否 | 暂不下沉 contract；只有出现第二消费方或 Agent 回填真实阻塞时启动。 |
| `AlembicDashboard` | 观察中 | 否 | Dashboard 只消费 artifact / summary；本波不稳定 artifact contract。 |
| `AlembicPlugin` | 无任务 | 否 | 本主线是 Alembic internal Agent 输入，不改变 Codex Plugin host-agent 路由。 |
| `AlembicTest` | 已完成 | 否 | `Test-2026-05-25-06` 已通过总控复核；等待 Wave 3 Agent 回填后再创建下一张测试单。 |
| `BiliDili` | 无任务 | 否 | 不改真实 iOS 项目源码。 |

## 窗口分派

发送给：无

说明：本 Wave 已完成并转入 [Wave 3 / Observation Ledger](../../../current/llm-input-optimization-wave-3-2026-05-25.md)；新的发送名单以 Wave 3 文档为准。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicAgent`<br>已完成 | 已提交 `bf0a2c2cb0c3d760817ac699e5f47d83e0e5b4d9`，代码侧与 Test-06 source test-mode 复测均通过总控验收；下一步由 Wave 3 另行派发。 |
| `Alembic`<br>观察中 | 等 Agent input contract 稳定后，再评估 prompt artifact / process event bridge。 |
| `AlembicCore`<br>观察中 | 暂不下沉；仅在 Agent 回填真实 contract 阻塞时启动。 |
| `AlembicDashboard`<br>观察中 | 等 Alembic artifact API 稳定后再接入展示。 |
| `AlembicPlugin`<br>无任务 | 不参与本轮。 |
| `AlembicTest`<br>已完成 | 已回填 `Test-2026-05-25-06 / LLMI-P4-Agent-Input-Layering-TestMode`，并通过总控复核。 |
| `BiliDili`<br>无任务 | 不参与本轮。 |

## 可复制分派提示词

发送给：无。

```text
无。本 Wave 已完成，当前发送名单见 llm-input-optimization-wave-3-2026-05-25.md。
```
