# LLM Input Optimization Wave 1

日期：2026-05-25
状态：Wave 1 总控验收通过；已转入 Wave 2
主线目标：把 `GTODO-2026-05-24-040` 从 TODO 提升为当前主线，先关闭 Alembic internal Agent LLM 输入链路的 correctness 缺口：`[object Promise]`、`code.read({ filePaths })` 伪能力、planning / toolChoice 冲突，以及缺少固定回归 fixture 的问题。

## 目标判断

用户当前目标：开始推进 LLM 输入优化。上一条 multi-root ProjectScope 主线已经完成 P7 五文件夹补测并由总控验收通过；本轮继续聚焦 LLM 输入优化，不再把 multi-root P7 作为当前阻塞。

本主线的最终完成定义来自 [llm-input-optimization-research-2026-05-24.md](../../../current/llm-input-optimization-research-2026-05-24.md)：

- provider input / developer-visible input 不再出现 `[object Promise]`。
- `code.read({ filePaths })` 是真实可调用能力，schema、handler、prompt 示例和返回结构一致。
- SCAN / planning 与 effective `toolChoice` 一致，不再提示同轮调用不可用工具。
- Analyze / Record / Summarize / Produce 输入 profile 可区分，Producer 不继承 Analyst 探索预算。
- dynamic context 不再默认回灌 raw JSON / callId / timestamp 调试 dump。
- Timeline 摘要与完整 redacted prompt artifact 分层清楚。
- AlembicTest 用 test-mode 证明 Recipe / Skill 产出质量不回退。

本波只做 Phase 0 + Phase 1，不做全部最终目标。原因：后续 section assembly、Observation Ledger、artifact storage 和 Dashboard 展示依赖 Agent correctness 先稳定。

## 本波完成定义

本波完成后必须具备：

- `AlembicAgent` 有固定 targeted fixture / test，覆盖当前已知输入错误。
- `CodeEntityGraph.generateContextForAgent` async / sync 类型不再导致 `[object Promise]` 进入 prompt。
- `code.read` 真实支持 `path` 单文件和 `filePaths` 批量读文件，并保留只读、安全、预算、partial failure 和 delta cache 语义。
- Analyst prompt 中的 `filePaths` 示例与 registry / handler 真实 contract 一致。
- SCAN planning prompt 与 `toolChoice=none` 不再冲突。
- targeted tests、typecheck、lint、Core import boundary 和 `git diff --check` 通过。

## 阶段顺序

1. **Wave 1 / Agent correctness**：`AlembicAgent` 修复输入正确性和工具 contract，一次关闭 Phase 0 + Phase 1。
2. **Wave 2 / Agent input layering**：基于 Wave 1 结果设计 section 化 input assembly、stage profiles 和重复 prompt policy 收敛。
3. **Wave 3 / Observation ledger**：把 raw observation dump 替换为结构化 ledger，同时保留 scratchpad confirmed findings。
4. **Wave 4 / Artifact and display**：`Alembic` 持久化完整 redacted prompt artifact，`AlembicDashboard` 展示 artifact ref / 详情入口。
5. **Wave 5 / Test-mode integration**：`AlembicTest` 用固定 test-mode 复测输入、产物质量和 Dashboard 展示。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| LLMI-P1-AGENT-CORRECTNESS | `AlembicAgent` | 修复 async graph context、`code.read({ filePaths })` 真实能力、planning/toolChoice 一致性，并补固定回归测试。 | 总控验收通过 |
| LLMI-P2-AGENT-CORRECTNESS-TESTMODE | `AlembicTest` | 用最小 test-mode fixture 复测 retained input / process events、`code.read({ filePaths })`、batch partial failure 和 SCAN planning / `toolChoice=none`。 | 总控验收通过 |

### LLMI-P1-AGENT-CORRECTNESS：Agent 输入正确性闭环

窗口：`AlembicAgent`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 本轮

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 本轮，`AlembicAgent` 提交 `6cff8beac414ca55eab4af85b31dfad0d1898711`

阶段目标：

- 用真实代码和测试关闭 LLM 输入 correctness 缺口，不做空壳 contract。
- 保留现有 static system prompt / dynamic context / budget / registry 单一真相源等保护点，不重写整套 Agent runtime。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档、`docs/workspace/current/llm-input-optimization-research-2026-05-24.md` 和 `AlembicAgent/AGENTS.md`，并声明当前窗口定位和本轮仓库职责。
- 复核并固定当前问题 fixture：`[object Promise]`、`filePaths` 伪能力、`Missing required param "path"`、SCAN planning 与 `toolChoice=none` 冲突。
- 修正 `CodeEntityGraphLike.generateContextForAgent` async / sync contract 和 `buildAnalystPrompt(...)` 调用，确保 prompt 中不再出现 `[object Promise]`。
- 实现 `code.read({ filePaths })` 真实批量读取能力：registry schema、handler、返回结构、partial failure、预算 / max output、delta cache、path safety、prompt 示例和 tests 必须一致；单文件 `path` 继续可用。
- 收敛 SCAN planning 文案或 `toolChoice` 决策，使 “制定计划” 与 “同轮工具调用” 不再冲突。
- 增加 targeted tests：prompt fixture、code.read 单文件 / 批量 / 部分失败 / 越界路径、planning/toolChoice 一致性。
- 在 workspace 文档回填执行记录到 `docs/AlembicAgent/llm-input-optimization-agent-correctness-2026-05-25.md`，并从当前计划挂回。

合并 TODO：

- `GTODO-2026-05-24-040` 的 Phase 0 + Phase 1。

明确不包含：

- 不做 Observation Ledger 完整替换。
- 不做完整 prompt artifact 持久化。
- 不改 Dashboard UI。
- 不改 Alembic daemon / JobStore。
- 不修改 `AlembicCore`，除非发现 Core contract 必须改；若必须改，先回填阻塞，不在 Agent 窗口跨仓库修改。
- 不启用 L4 compaction。

下一处真实阻塞点：

- 如果 `AlembicAgent` 无法先保证 prompt / tool schema / handler / toolChoice 一致，下游 Alembic artifact 和 Dashboard 展示都会基于错误输入继续放大问题。

阻塞点之前还能做：

- 本包应一次完成 fixture、async graph context、batch read、planning/toolChoice 和 targeted tests；不要只修 `[object Promise]` 或只改 prompt 文案就回填完成。

验证命令：

```text
# 由 AlembicAgent 窗口按 AlembicAgent/AGENTS.md 选择等价命令。
npm test -- insight-analyst code
npm run typecheck
npm run lint
npm run lint:agent-import-boundary
npm run lint:public-api-boundary
npm run lint:core-import-boundary
git diff --check
```

回填要求：

- 完成范围、文件 / 模块变化、提交 hash。
- 真实代码证据：列出修改的 prompt / registry / handler / strategy / test 文件。
- 验证命令和结果。
- 说明 `code.read({ filePaths })` 的边界：最大文件数、partial failure、预算、delta cache、越界路径处理。
- 说明未做事项和下一波建议：input assembly、Observation Ledger、artifact / Dashboard、AlembicTest。

执行回填：

- 回填文档：[../../AlembicAgent/llm-input-optimization-agent-correctness-2026-05-25.md](../../../../AlembicAgent/llm-input-optimization-agent-correctness-2026-05-25.md)
- 提交 hash：`6cff8beac414ca55eab4af85b31dfad0d1898711`
- 完成范围：async graph context await、Tool V2 `code.read` path / filePaths contract、batch per-file result / partial failure / budget / delta cache / path safety、SCAN planning wording、batch file signal 和 targeted fixture。
- 验证结果：`npm test -- llm-input-correctness`、`npm test -- llm-input-correctness ExplorationStrategies tool-v2-contract`、`npm run typecheck`、`npm run lint`、三项边界 lint、`git diff --check`、`npm run check` 均通过；完整结果见回填文档。
- batch read 边界：每次最多 5 个文件；`path` / `filePaths` 互斥；至少一个成功即 partial success；全部失败整体失败并保留 per-file detail；单文件和批量均限制在项目根内；batch 输出按 `min(ctx.tokenBudget, 5000)` 分配 per-file budget 并标记截断。
- 未做事项：未做 section 化 input assembly、Observation Ledger、完整 prompt artifact、Dashboard 展示、AlembicTest test-mode 复测和 L4 compaction。
- 遗留风险 / 下一步：需要总控验收后启动 Wave 2 input layering；之后再启动 Observation Ledger / artifact / Dashboard / AlembicTest。

执行前置硬规则：

- 先读取目标仓库 `AlembicAgent/AGENTS.md`，并明确当前窗口定位 / 仓库职责。

## 总控验收结论

验收时间（北京时间）：2026-05-25 11:19 CST

结论：`LLMI-P1-AGENT-CORRECTNESS` 通过总控代码侧验收。

证据：

- `AlembicAgent` 提交 `6cff8beac414ca55eab4af85b31dfad0d1898711`，工作区 `git status --short` 为空。
- `src/agent/prompts/insight-analyst.ts` 把 `CodeEntityGraphLike.generateContextForAgent(...)` 建模为 `Promise<string | null> | string | null`，并在 prompt 装配处 `await`，目标缺口 `[object Promise]` 有真实代码修复。
- `src/tools/v2/registry.ts` 的 `code.read` schema 已移除强制 `path`，新增 `filePaths` 与 `maxLines`；`src/tools/v2/handlers/code.ts` 实现 `path` / `filePaths` 互斥、最多 5 文件、partial failure、per-file budget、delta cache、越界保护和 batch per-file 结构。
- `src/agent/context/exploration/PlanTracker.ts` 已把 SCAN 计划提示从“同轮立即执行”改为“下一轮执行 / 工具开放阶段再调用”，与 `toolChoice=none` 对齐。
- `src/agent/context/exploration/SignalDetector.ts` 识别 `params.filePaths`，batch read 的多文件读取会计入新文件信号。
- `test/llm-input-correctness.test.ts` 覆盖 async graph context、registry contract、单文件 / 批量 / partial failure / 越界路径 / delta cache / batch budget 和 SCAN planning consistency。
- 执行窗口回填验证：`npm test -- llm-input-correctness`、`npm test -- llm-input-correctness ExplorationStrategies tool-v2-contract`、`npm run typecheck`、`npm run lint`、三项边界 lint、`git diff --check`、`npm run check` 均通过。
- 总控复核 `git -C AlembicAgent diff --check HEAD^ HEAD` 通过。

仍未关闭的最终目标差距：

- 本次只关闭 Agent correctness；尚未做 section 化 input assembly、Observation Ledger、完整 redacted prompt artifact、Dashboard 展示和完整 Recipe / Skill 质量回归。
- 因用户已要求 full cold-start 避免长时间运行，下一步先创建最小 `AlembicTest` test-mode 复测单，验证真实 retained input / events 中不再出现 `[object Promise]`，并验证 `code.read({ filePaths })` 不再触发 `Missing required param "path"`。

## AlembicTest 复测回填

回填时间（北京时间）：2026-05-25 11:32 CST

结论：`Test-2026-05-25-05 / LLMI-P2-Agent-Correctness-TestMode` 通过，总控验收通过。

证据：

- 详细报告：[../../../AlembicTest/docs/llm-input-agent-correctness-test-mode-2026-05-25.md](../../../../../AlembicTest/docs/llm-input-agent-correctness-test-mode-2026-05-25.md)
- Probe 脚本：`AlembicTest/scripts/probe-llm-input-agent-correctness.mjs`
- Probe JSON：`AlembicTest/tmp/llm-input-agent-correctness-test-mode-2026-05-25.json`
- Vitest JSON：`AlembicTest/tmp/llm-input-agent-correctness-vitest-2026-05-25.json`
- Targeted Vitest：`13` tests passed，覆盖 `llm-input-correctness` 和 `AgentRuntime` process event fixture。
- Test-mode retained process events：`llm.input` / `llm.output` 均产生，`llm.input.retention=job-retained`，`sourceClass=developer-facing`，`requestedToolChoice=none`，`effectiveToolChoice=none`。
- 四个目标缺口：`[object Promise]` 通过；`filePaths` missing path 通过；batch partial failure 通过；SCAN planning / `toolChoice=none` 通过。
- 真实项目 git 状态：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicPlugin`、`AlembicDashboard`、`BiliDili` 均 clean；`AlembicTest` 和 `AlembicWorkspace` 保留测试 / 文档回填变更。

总控复核：

- 复核时间：2026-05-25 11:43 CST
- 复核结论：通过，关闭 Wave 1 correctness test-mode 复测门。
- 证据判断：Test-05 覆盖了 retained input、batch read、partial failure 和 SCAN planning / `toolChoice=none` 四个硬目标；没有发现需要 `AlembicAgent` / `Alembic` / `AlembicTest` 返工的问题。

下一步：已创建 [LLM 输入优化 Wave 2](../../../current/llm-input-optimization-wave-2-2026-05-25.md)，当前发送 `AlembicAgent` 执行 input layering。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 / 推荐窗口 | 事项 / 目标 | 影响复测 / 派发 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-24-040 | Wave 1 已验收，已转 Wave 2 | internal agent llm input optimization | P0 | `AlembicAgent` / `AlembicTest` | LLM 输入 correctness：async graph context、真实 batch read、planning/toolChoice 一致性和固定 fixture。 | 是 | Wave 1 correctness 和 Test-05 均总控验收通过；当前进入 [Wave 2](../../../current/llm-input-optimization-wave-2-2026-05-25.md)。 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `AlembicAgent` | 已完成 | 否 | `LLMI-P1-AGENT-CORRECTNESS` 代码侧验收通过，后续只在 test-mode 复测失败时返工。 |
| `Alembic` | 观察中 | 否 | Artifact / process event bridge 等 Wave 2 / artifact contract 再接入。 |
| `AlembicCore` | 观察中 | 否 | 暂不下沉 contract；若 Agent 发现 Core 必改，先回填阻塞。 |
| `AlembicDashboard` | 观察中 | 否 | Dashboard 只消费 artifact / summary；本波没有稳定 artifact contract。 |
| `AlembicPlugin` | 无任务 | 否 | 本主线是 Alembic internal Agent 输入，不改变 Codex Plugin host-agent 路由。 |
| `AlembicTest` | 已完成 | 否 | `Test-2026-05-25-05 / LLMI-P2-Agent-Correctness-TestMode` 已总控验收通过。 |
| `BiliDili` | 无任务 | 否 | 不改真实 iOS 项目源码。 |

## 窗口分派

发送给：无

说明：Wave 1 correctness 与 Test-05 已通过总控验收；后续已转入 [Wave 2](../../../current/llm-input-optimization-wave-2-2026-05-25.md)。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicAgent`<br>已完成 | 已提交 `6cff8beac414ca55eab4af85b31dfad0d1898711`，总控验收通过；若 test-mode 复测发现真实运行缺口，再返工。 |
| `Alembic`<br>观察中 | 等总控验收 Test-05 后，再按 Wave 2 / artifact 阶段评估 prompt artifact / process event bridge。 |
| `AlembicCore`<br>观察中 | 暂不下沉；仅在 Agent 回填真实 contract 阻塞时启动。 |
| `AlembicDashboard`<br>观察中 | 等 Alembic artifact API 稳定后再接入展示。 |
| `AlembicPlugin`<br>无任务 | 不参与本轮。 |
| `AlembicTest`<br>已完成 | `Test-2026-05-25-05 / LLMI-P2-Agent-Correctness-TestMode` 已总控验收通过。 |
| `BiliDili`<br>无任务 | 不参与本轮。 |

## 可复制分派提示词

发送给：无。

说明：当前 Wave 1 已完成；新的可复制分派提示词见 [Wave 2](../../../current/llm-input-optimization-wave-2-2026-05-25.md)。

```text
无
```
