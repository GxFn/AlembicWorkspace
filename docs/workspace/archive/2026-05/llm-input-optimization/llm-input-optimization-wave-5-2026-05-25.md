# LLM Input Optimization Wave 5

日期：2026-05-25
状态：总控验收通过，已转 Wave 6
发送给：无
主线目标：在 Alembic 已生产完整 redacted prompt / output artifact、artifactRef、trace envelope 和 metrics 后，让 Dashboard 以稳定 API 消费这些证据，Timeline 继续展示开发者摘要，详情侧栏展示完整 artifact 和指标。

## 目标判断

用户当前目标仍是 LLM 输入优化主线，Wave 5 已完成；最终目标尚未完成，剩余差距已转入 Wave 6 package/runtime integration verification。

已完成：

- Wave 1 correctness：`AlembicAgent` 提交 `6cff8beac414ca55eab4af85b31dfad0d1898711`，`AlembicTest` Test-05 通过总控验收。
- Wave 2 input layering：`AlembicAgent` 提交 `bf0a2c2cb0c3d760817ac699e5f47d83e0e5b4d9`，`AlembicTest` Test-06 通过总控验收。
- Wave 3 Observation Ledger：`AlembicAgent` 提交 `8970327d73bf6c01476a1aeb5384f014483b68dd`，`AlembicTest` Test-07 通过总控验收。
- Wave 4 artifact / trace / metrics producer：`Alembic` 提交 `aa5419434d51aa4d944c3614ecebd8aff47a009f`，总控复跑 targeted tests / typecheck / lint 并验收通过。

当前剩余差距：

- `AlembicDashboard` 已回填并通过总控代码侧验收，提交 `30b376cd3b5539d3fac0db2e019c4136bb98212d`。
- `AlembicTest` Test-08 已通过总控验收，证明 UI / API / artifact / secret 边界在最小 test-mode fixture 链路里闭合。
- `AlembicAgent/dist` 未刷新仍保留为 `GTODO-2026-05-25-002`，package/runtime 或 cold-start 集成验证前必须处理；本波不处理。

## 本波完成定义

本波完成后必须具备：

- Dashboard Timeline 继续只显示开发者摘要 / 短内容，不把长 LLM 输入输出直接塞回卡片主体。
- 对带 `artifactRefs` 的 `llm.input` / `llm.output` 事件，Dashboard 能通过 `artifactRefs[].ref` 拉取完整 redacted artifact。
- 详情侧栏或等价通用详情面板能展示 artifact 内容、artifact metadata、trace envelope 和 `llmMetrics`；默认策略遵循前一轮 UI 决策：短内容可直接展示，长内容可折叠或滚动，不刷爆主 Timeline。
- 明确区分 Timeline projection 与完整 artifact：UI 不把 `content.text` 当作完整 prompt / output。
- 失败路径可读：artifact fetch 404 / 网络失败 / ref 缺失时给出清晰状态，不影响 Timeline 基础浏览。
- 不改 Alembic producer API，不改 AlembicAgent，不改 AlembicPlugin，不跑 full cold-start。

## 上游代码证据

本波消费以下已验收上游能力：

- `Alembic` 提交 `aa5419434d51aa4d944c3614ecebd8aff47a009f`。
- `lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts`：在 Timeline projection 前生成完整 `textArtifactCandidate`，metadata 带 `traceEnvelope` 和 `llmMetrics`。
- `lib/daemon/DaemonJobRunner.ts`：materialize job artifact，回写 `artifactRefs`、artifact metadata 和真实 `jobId` trace envelope。
- `lib/daemon/JobProcessEventArtifacts.ts`：artifact 存储在 dataRoot scoped `.asd/job-artifacts/<jobId>/<artifactId>`，读写路径限制在 job artifact 根目录内。
- `lib/http/routes/jobs.ts`：新增 `GET /api/v1/jobs/:jobId/artifacts/:artifactId`。
- 总控复验命令：`npm run test:unit -- BootstrapProcessEvents.test.ts DaemonJobRunner.test.ts JobsRoute.test.ts JobProcessEventRecorder.test.ts` 通过 4 files / 28 tests，`npm run typecheck` 通过，`npm run lint -- --diagnostic-level=error` 通过，`git diff --check HEAD^ HEAD` 通过。

## 阶段顺序

1. Wave 1 / Agent correctness：已通过。
2. Wave 2 / Agent input layering：已通过。
3. Wave 3 / Observation Ledger：已通过。
4. Wave 4 / Alembic artifact, trace and metrics：已通过总控验收。
5. Wave 5 / Dashboard Timeline and artifact detail：`AlembicDashboard` 已通过总控代码侧验收，`AlembicTest` Test-08 已通过总控验收。
6. Wave 6 / Package/runtime and integration verification：已创建 [llm-input-optimization-wave-6-2026-05-25.md](../../../current/llm-input-optimization-wave-6-2026-05-25.md)，先发送给 `AlembicAgent` 处理 `dist` / runtime 产物。
7. 后续最高优先级 TODO：`GTODO-2026-05-25-003`，在监控可视化闭环建立后，用 progressive-chain-validation 做节点级 baseline 和优化。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| LLMI-P8-DASHBOARD-ARTIFACT-DETAIL | `AlembicDashboard` | 消费 Alembic job artifact API / artifactRef，补 Timeline 详情侧栏和 metrics / trace 展示。 | 总控代码侧验收通过 |
| Test-2026-05-25-08 / LLMI-P9-Dashboard-Artifact-Detail-TestMode | `AlembicTest` | 以 test-mode fixture + Dashboard DOM/API 验证 artifactRef、完整 redacted artifact、metrics / trace、失败状态和 secret 边界。 | 总控验收通过 |

### LLMI-P8-DASHBOARD-ARTIFACT-DETAIL：Dashboard artifact consumer

窗口：`AlembicDashboard`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 20:45 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 21:00 CST

阶段目标：

- 让 Dashboard 成为 Alembic job artifact / trace / metrics 的真实 consumer。
- 让开发者在 UI 里能一眼区分 Timeline 摘要和完整 redacted prompt / output artifact。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档、`docs/workspace/current/llm-input-optimization-wave-4-2026-05-25.md` 和 `AlembicDashboard/AGENTS.md`，并声明当前窗口定位和本轮仓库职责。
- 深挖 Dashboard 当前 Jobs / Timeline / process events / 详情侧栏或通用侧栏组件的真实代码，复用已有 UI 模式，避免再把大段 LLM 内容嵌回后台任务卡片主体。
- 在 API client 层支持读取 `artifactRefs[].ref`；若已有通用 request helper，优先复用，不新增重复 fetch 层。
- 在 Timeline 事件详情中展示 artifact 状态：可读取、读取中、读取失败、无 artifact；内容来自 artifact endpoint，而不是 `content.text`。
- 展示 `llmMetrics`、artifact retained metadata 和 `traceEnvelope` 的开发者可读摘要；字段不存在时显示“未提供”或隐藏，不制造伪指标。
- 保持短内容 / 长内容展示策略：短 LLM 内容可以直接展示，长 artifact 默认折叠或进入可滚动详情，不让主 Timeline 被刷屏。
- 补前端测试或 DOM-level / component-level 验证，证明 artifact fetch、成功展示、失败状态、无 artifact 回退和 metrics / trace 显示。
- 回填执行记录到 `docs/AlembicDashboard/llm-input-optimization-dashboard-artifact-detail-2026-05-25.md`，并从当前计划挂回。

合并 TODO：

- `GTODO-2026-05-24-040` 的 Wave 5 / Dashboard Timeline 摘要、artifact 详情和 metrics 展示。

明确不包含：

- 不改 Alembic producer API。
- 不改 AlembicAgent source 或 dist。
- 不改 AlembicPlugin。
- 不跑 full cold-start / rescan。
- 不实现 `GTODO-2026-05-25-003` 的 Agent / LLM 优化循环；本波只建立 UI 消费面。

下一处真实阻塞点：

- Dashboard 不消费 artifactRef 时，开发者无法通过前端稳定查看完整 redacted prompt / output，后续 AlembicTest 也无法验证 UI 展示闭环。

阻塞点之前还能做：

- 本包应一次完成 API client、详情 UI、metrics / trace 展示、失败状态和前端验证；不要只加类型或按钮占位。

验证命令：

```text
# 由 AlembicDashboard 窗口按 AlembicDashboard/AGENTS.md 选择等价命令。
npm run test -- --run
npm run typecheck
npm run check
git diff --check
```

回填要求：

- 完成范围、文件 / 模块变化、提交 hash。
- 真实代码证据：artifact fetch helper、详情侧栏入口、metrics / trace rendering、失败状态处理。
- 验证命令和结果。
- 明确说明 UI 如何区分 Timeline projection 和完整 artifact。
- 明确说明短内容 / 长内容默认展示策略。
- 下一步建议：AlembicTest Test-08 最小复测范围，以及是否还需要 Alembic / AlembicAgent 返修。

执行前置硬规则：

- 先读取目标仓库 `AlembicDashboard/AGENTS.md`，并明确当前窗口定位 / 仓库职责。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 / 推荐窗口 | 事项 / 目标 | 影响复测 / 派发 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-24-040 | 已转 Wave 6 | internal agent llm input optimization | P0 | `AlembicAgent` / `AlembicTest` | LLM 输入优化闭环。Wave 1/2/3/4 已通过总控验收；Wave 5 Dashboard artifact、trace 和 metrics 消费展示已通过总控代码侧验收，Test-08 已通过总控验收。 | 是 | 已创建 [Wave 6](../../../current/llm-input-optimization-wave-6-2026-05-25.md)，先处理 package/runtime 产物门禁。 |
| GTODO-2026-05-25-002 | 后置门禁 | build artifact sync | P1 | `AlembicAgent` | `AlembicAgent/dist` 未刷新，source test-mode 通过但 package/runtime/cold-start 验证前会消费旧产物。 | 是 | Source 侧输入结构稳定后，package/runtime 或 cold-start 集成验证前必须刷新并验证 dist；本波不处理。 |
| GTODO-2026-05-25-003 | 下一主线候选 | agent / llm optimization loop | P0 | `AlembicAgent` / `Alembic` / `AlembicDashboard` / `AlembicTest` | 监控可视化闭环建立后，用 baseline、artifact、trace 和 metrics 优化 Agent / LLM 输入输出，并结合 `progressive-chain-validation` 做节点级 baseline。 | 是 | 等 `GTODO-2026-05-24-040` 完整完成并归档后，经目标确认提升为下一主线。 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 | 否 | Wave 4 producer 已由总控验收通过；如 Dashboard 发现 API contract 缺口再返修。 |
| `AlembicCore` | 观察中 | 否 | 现有 Core event contract 暂够；本波只做 Dashboard consumer。 |
| `AlembicAgent` | 观察中 | 否 | Source 侧 Wave 1/2/3 已验收；`dist` 刷新留到 package/runtime 门禁。 |
| `AlembicDashboard` | 已完成 | 否 | Dashboard artifact consumer 已通过总控代码侧验收；如 Test-08 发现 UI/API 缺口再返修。 |
| `AlembicPlugin` | 无任务 | 否 | 本主线是 Alembic internal Agent 运行链路，不改变 Codex Plugin host-agent 路由。 |
| `AlembicTest` | 已完成 | 否 | Test-08 已通过总控验收；后续 Wave 6B 等 Agent 产物回填后再创建。 |
| `BiliDili` | 无任务 | 否 | 不改真实 iOS 项目源码。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | Wave 4 producer 已验收；观察 Dashboard 消费反馈。 |
| `AlembicCore`<br>观察中 | 暂无任务。 |
| `AlembicAgent`<br>观察中 | 暂无 source 任务；`dist` 刷新后置。 |
| `AlembicDashboard`<br>已完成 | `LLMI-P8-DASHBOARD-ARTIFACT-DETAIL` 已提交 `30b376cd3b5539d3fac0db2e019c4136bb98212d` 并通过总控代码侧验收。 |
| `AlembicPlugin`<br>无任务 | 不参与本轮。 |
| `AlembicTest`<br>已完成 | [Test-2026-05-25-08 / LLMI-P9-Dashboard-Artifact-Detail-TestMode](../../../current/alembic-test-exchange.md) 已通过总控验收。 |
| `BiliDili`<br>无任务 | 不参与本轮。 |

## 可复制分派提示词

发送给：无。

当前没有本 Wave 可发送窗口；下一步已转入 [Wave 6](../../../current/llm-input-optimization-wave-6-2026-05-25.md)。

## 回填区

- 2026-05-25 20:45 CST：总控验收 `Alembic` Wave 4 通过，创建本 Wave 5；当前发送给 `AlembicDashboard`，等待前端消费完整 artifact、trace 和 metrics 后回填。
- 2026-05-25 20:55 CST：`AlembicDashboard` 回填 `LLMI-P8-DASHBOARD-ARTIFACT-DETAIL` 完成，提交 `30b376cd3b5539d3fac0db2e019c4136bb98212d`，记录见 [../../AlembicDashboard/llm-input-optimization-dashboard-artifact-detail-2026-05-25.md](../../../../AlembicDashboard/llm-input-optimization-dashboard-artifact-detail-2026-05-25.md)。完成 API client artifact fetch、Timeline 详情侧栏、完整 redacted artifact 展示、`llmMetrics` / `traceEnvelope` / artifact metadata 展示和失败状态；验证 `npm run test`、`npm run typecheck`、`npm run check`、`git diff --check`、`git diff --check HEAD^ HEAD` 均通过。当前等待总控验收后创建 `AlembicTest` Test-08。
- 2026-05-25 21:00 CST：总控验收 `AlembicDashboard` Wave 5 代码侧通过。复核提交 `30b376cd3b5539d3fac0db2e019c4136bb98212d`，确认 `src/api.ts` 支持 `artifactRefs[].ref` 归一化与 artifact text fetch，`JobsView.tsx` 详情面板按需读取完整 redacted artifact，并展示 Timeline projection、artifact metadata、`llmMetrics`、`traceEnvelope`、loading / empty / error / success 状态；Dashboard 工作区干净。总控复跑 `npm run test`、`npm run typecheck`、`npm run check`、`git diff --check`、`git diff --check HEAD^ HEAD` 均通过，`npm run check` 仅保留既有 Vite large chunk warning。已创建 [Test-2026-05-25-08 / LLMI-P9-Dashboard-Artifact-Detail-TestMode](../../../current/alembic-test-exchange.md)，当前发送给 `AlembicTest`。
- 2026-05-25 16:09 CST：`AlembicTest` 回填 Test-08 通过，报告见 [../../../AlembicTest/docs/llm-input-dashboard-artifact-detail-test-mode-2026-05-25.md](../../../../../AlembicTest/docs/llm-input-dashboard-artifact-detail-test-mode-2026-05-25.md)。使用 `ALEMBIC_TEST_MODE=1`、fixture API、临时 Dashboard Vite server 和 headless Chrome DOM 自动化；验证 `llm.input` / `llm.output` artifactRef 可读完整 redacted artifact，Timeline 不展示完整 artifact，详情面板展示 `llmMetrics` / `traceEnvelope` / artifact metadata，loading / success / 404 / no artifactRef 状态可读，fixture secret 和 provider-only marker 未出现在 UI / API 可见内容中。验证命令 `node --check AlembicTest/scripts/probe-dashboard-artifact-detail.mjs`、`node AlembicTest/scripts/probe-dashboard-artifact-detail.mjs --help`、`npm --prefix AlembicTest run check`、`ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-dashboard-artifact-detail.mjs` 均通过；probe 内部 Dashboard `npm run test` 通过 `12/12`。当前待总控验收。
- 2026-05-25 16:21 CST：总控验收 Test-08 通过，关闭 Wave 5 Dashboard artifact detail test-mode 门。复核 AlembicTest 报告，确认 fixture / test-mode 覆盖 artifactRef 解析、完整 redacted artifact API、Timeline projection 与完整 artifact 区分、`llmMetrics` / `traceEnvelope` / artifact metadata 展示、loading / success / 404 / no artifactRef 状态、fixture secret 和 provider-only marker 不出现在 UI / API 可见内容中；未发现需要 `Alembic`、`AlembicDashboard`、`AlembicAgent` 或 AlembicTest harness 返工的问题。遗留 `AlembicAgent/dist` / package runtime 产物门禁已转入 [Wave 6](../../../current/llm-input-optimization-wave-6-2026-05-25.md)。
