# AI Mock Removal Real AI Smoke Wave 3

日期：2026-05-28
状态：总控验收通过（AI-MOCK 主线完成，PCVM 可恢复）
发送给：无
总控定位：本文件是 ControlWorkspace 当前总控计划；只承载目标裁决、窗口分派、TODO 归口、测试交接和验收回填，不承载产品实现。

## 目标判断

- 用户目标：删除产品 runtime AI mock 后，用真实 / 默认 AI 配置证明最小运行时 smoke 不再依赖 mock provider。
- 最终完成定义：`AlembicAgent`、`Alembic`、`AlembicDashboard` 产品 mock producer / consumer 已删除；真实 / 默认 AI 配置 smoke 能证明无 `mock` provider 入口，且目标项目无 AI 配置时显式失败 / unavailable，而不是回落到 product mock。
- 当前是否已经达到：已达到。Wave 1 / Wave 2 代码删除已通过总控验收，Wave 3 真实 / 默认 AI smoke 由总控复核通过。
- 未达到时剩余差距：无；AI-MOCK 主线只剩后续归档。`AlembicTest` restart 脚本 PATH 健壮性缺口另入后续测试窗口维护，不阻塞本目标。
- 已达到时验收 / 归档判断：AI-MOCK 主线可进入收束；PCVM 可恢复真实 AI runtime baseline / runtime-gap 归口判断。
- 当前任务分区：测试交接 / 真实场景 smoke。
- 不纳入本轮事项：不做 full cold-start，不推进 PCVM N0-N14 全链路，不修改 `BiliDili` 源码，不修产品仓库代码，不新增 fake / mock provider。

## 总控决策记录

- 本次决策触发：用户要求重新开启自动化并继续下一步；总控已接受 `AlembicDashboard` Wave 2 回填。
- 需求 / 测试结果理解：Wave 1 / Wave 2 只能证明产品 mock producer / consumer 已删除；用户目标还要求真实 / 默认 AI 配置路径可用或明确 unavailable。该结论依赖 AlembicTest 的真实测试配置与运行时证据。
- 已核对证据：Wave 1 / Wave 2 的产品 mock 删除和 Dashboard mock UI/API 清理均已通过总控验收，具备进入真实 / 默认 AI smoke 的前置条件。
  - `AlembicAgent` commit `26fe915366ea7198ffc37889752644fc5028be3c` 已通过总控验收。
  - `Alembic` commit `1ee39b1eed5ab3fbffaaea309c8a9c966cc61499` 已通过总控验收；后续 `Alembic` HEAD 还有 `c46e09d8f0ca` 配置过滤修复，可纳入 smoke 观察。
  - `AlembicDashboard` commit `7fdb4863c61a` 已通过总控验收：`npm run check`、`git diff --check`、关键 mock UI/API 负向扫描通过。
- 是否需要先验证 / 重新计划 / 用户确认：不需要；本 wave 是已确认 AI-MOCK 阶段顺序里的真实 / 默认 AI smoke。
- 本次允许更新：当前计划、index / status、test-exchange、VAD AlembicTest heartbeat。
- 本次不得更新：不得修改 `Alembic` / `AlembicAgent` / `AlembicDashboard` / `BiliDili` 源码；不得打印或提交 secret。

## Design / 需求来源

- 来源类型：DesignWindow handoff + 用户直接确认 + Wave 1 / Wave 2 总控验收。
- 来源文档：
  - [Stage 0 baseline](../../../../../codex-control-workspace/.wakeflow-active/current/ai-mock-removal-stage-0-code-fact-baseline-2026-05-28.md)
  - [goal stage confirmation](../../../../../codex-control-workspace/.wakeflow-active/current/ai-mock-removal-goal-stage-confirmation-2026-05-28.md)
  - [Wave 1](../../../../../codex-control-workspace/.wakeflow-active/current/ai-mock-removal-deletion-wave-1-2026-05-28.md)
  - [Wave 2](../../../../../codex-control-workspace/.wakeflow-active/current/ai-mock-removal-dashboard-wave-2-2026-05-28.md)
- 用户确认状态：已确认按 Design 推荐执行，并允许 AI-MOCK 自动化推进。
- 总控接收结论：本 wave 只做真实 / 默认 AI 配置 smoke。
- 是否需要目标阶段确认：已完成。
- 是否需要代码实现依赖调研：已完成；本 wave 只做测试交接。

## 代码事实与边界

- 相关仓库：`AlembicTest`、`Alembic`、`BiliDili` 或受保护 fixture。
- 关键入口：
  - `AlembicTest/config/defaults.json`：默认目标项目与 AI 配置 fallback。
  - `AlembicTest/docs/testing-operation-policy.md`：真实项目 smoke、AI 配置来源和 secret 保护规则。
  - `Alembic` CLI / daemon / API：由 AlembicTest 按现有测试脚本或最小 smoke 入口运行。
- producer / consumer 依赖：
  - `AlembicAgent` 和 `Alembic` 已删除 product mock provider producer / runtime consumer。
  - `AlembicDashboard` 已删除 product mock UI/API consumer。
  - `AlembicTest` 只消费这些上游结果做真实 / 默认 AI runtime smoke。
- 不可提前消费的上游：无；Wave 1 / Wave 2 已验收。
- 不允许触碰的目录 / 仓库：不得修改 `BiliDili` 业务代码，不得改产品源码来让测试通过，不得写入 secret 到 tracked 文档。
- 真实测试项目是否涉及：是；优先按 AlembicTest 配置选择 `BiliDili` 默认 AI 配置或受保护 fixture。

## 阶段顺序

1. Wave 1 / Stage 1：`AlembicAgent` + `Alembic` 删除 product mock producer / consumer。已通过总控验收。
2. Wave 2 / Stage 2：`AlembicDashboard` 删除 mock UI/API client/copy。已通过总控验收。
3. Wave 3 / Stage 3：`AlembicTest` 使用真实 / 默认 AI 配置做最小 smoke。总控验收通过。
4. Wave 4 / Stage 4：关闭 AI-MOCK、恢复 PCVM。

- 下一处真实阻塞点：AI-MOCK 内无剩余阻塞；PCVM 恢复后仍需处理 Wave 4D runtime-gap 归口。
- 阻塞点之前还能做：总控已完成 AlembicTest 报告、runtime/API/UI/log、空配置 fixture 和 git 状态复核。
- 当前可派发窗口：无。
- 当前阻塞 / 观察窗口：其它产品窗口观察；`BiliDili` 仅作为受保护测试目标。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| AI-MOCK-W3-ALEMBICTEST-REAL-AI-SMOKE | `AlembicTest` | 使用真实 / 默认 AI 配置做最小 smoke，确认 no product mock runtime fallback。 | 总控验收通过 |

### AI-MOCK-W3-ALEMBICTEST-REAL-AI-SMOKE：真实 / 默认 AI 配置 smoke

窗口：`AlembicTest`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-28 16:28 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-28 17:22 CST

阶段目标：

- 证明 AI-MOCK 删除后，测试目标使用真实 / 默认 AI 配置时不会走 product `mock` provider fallback。

主线动作：

- 读取本计划和 [test-exchange.md](../../../../../codex-control-workspace/.wakeflow-active/current/test-exchange.md) 中的 Test-AI-MOCK-W3。
- 使用 `AlembicTest/config/defaults.json` 的 AI 配置 fallback 规则：先读目标项目 Ghost / standard runtime AI 配置；没有可用配置时允许使用默认测试 AI 配置。
- 运行最小 smoke：可以是 Alembic daemon/API、CLI、test-mode runtime 或 AlembicTest 既有脚本，必须能观察 provider 选择、key presence、无 mock provider fallback、显式 unavailable / 成功路径和关键日志。
- 若启动或使用 Dashboard / localhost 页面，必须用 Codex in-app browser 打开最相关页面观察。

合并 TODO：

- `AI-MOCK-REMOVAL-2026-05-28`：真实 / 默认 AI 配置 smoke。
- `GTODO-2026-05-25-003`：PCVM 恢复前置验证。

明确不包含：

- 不做 full cold-start。
- 不推进 PCVM N0-N14 全链路。
- 不修改 `BiliDili`、`Alembic`、`AlembicAgent`、`AlembicDashboard` 源码。
- 不打印、复制或提交 API key / token / secret。

下一处真实阻塞点：

- 如果 smoke 失败，需要区分是 AI 配置缺失、runtime unavailable、残留 mock fallback、Dashboard/API 消费问题，还是测试环境问题。

阻塞点之前还能做：

- AlembicTest 可以完成配置来源检查、最小 runtime smoke、日志 / API / UI 观察和报告。

验证命令：

```text
按 AlembicTest 现有脚本或目标仓库入口执行；必须回填实际命令。
建议先读取 AlembicTest/config/defaults.json 与 AlembicTest/docs/testing-operation-policy.md。
```

回填要求：

- 测试结论：
- 使用配置：只写来源、provider/model、key presence；不得写 secret。
- 目标项目 / fixture：
- 触发入口和实际命令：
- job id / session id / Dashboard URL 摘要：
- runtime 状态和关键日志：
- 是否出现 product `mock` provider / fallback：
- 无配置时是否显式 unavailable：
- 真实项目是否保持干净：
- 详细报告路径：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档、`test-exchange.md` 和 `AlembicTest` 自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、测试职责、本轮测试边界，以及本窗口不承担产品修复。
- 若需要 Dashboard / localhost 观察，必须打开 Codex in-app browser。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AI-MOCK-REMOVAL-2026-05-28 | 总控验收通过 / 待归档 | product runtime mock removal | P0 | `AlembicAgent` / `Alembic` / `AlembicDashboard` / `AlembicTest` | 删除产品 runtime AI mock provider、mock bootstrap、Dashboard mock UI/API，并用真实 / 默认 AI 配置 smoke 收束。 | 否 | Wave 1 / Wave 2 已验收；Wave 3 AlembicTest real AI smoke 已由总控复核通过。 | 总控归档 |
| GTODO-2026-05-25-003 | 可恢复 / 待 runtime-gap 归口 | PCV cold-start metrics | P0 | PCV source / `Alembic` / `AlembicTest` | PCVM Wave 4 下一步需要真实 AI runtime baseline；AI-MOCK 阻塞已解除。 | 是 | 先回到 PCVM Wave 4D runtime-gap 总控验收归口，再决定 Alembic 返修或重测。 | 总控 |
| GTODO-2026-05-24-038 | 待排期 | file monitor evolution | P1 | `Alembic` / `AlembicCore` / `AlembicDashboard` / `AlembicTest` | 037 后续知识进化路线。 | 是 | AI-MOCK 和 PCVM 主线之后。 | 待定 |
| GTODO-2026-05-24-039 | 待排期 | plugin no-monitor evolution | P1 | `AlembicPlugin` / `AlembicCore` / `AlembicTest` | Plugin 无 file monitor 的机会式知识进化。 | 是 | AI-MOCK 和 PCVM 主线之后。 | 待定 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 / 观察 | 否 | Product runtime mock consumer 已验收；本 wave 只做真实测试。 |
| `AlembicCore` | 观察 | 否 | 当前未发现产品 runtime AI mock provider。 |
| `AlembicAgent` | 已完成 / 观察 | 否 | Product MockProvider producer 已验收。 |
| `AlembicDashboard` | 已完成 / 观察 | 否 | Mock UI/API cleanup 已验收。 |
| `AlembicPlugin` | 观察 | 否 | 当前未发现 product runtime mock provider。 |
| `AlembicDesign` | 已完成 | 否 | Design handoff 已接收。 |
| `AlembicTest` | 已完成 | 否 | 真实 / 默认 AI 配置与运行时 smoke 已由总控复核通过。 |
| `BiliDili` | 受保护测试目标 | 否 | 只作为 AlembicTest 可选择的真实测试项目，不直接派发。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | Wave 1 runtime consumer removal 已验收；本 wave 不派发。 |
| `AlembicCore`<br>观察中 | 当前未发现产品 runtime AI mock provider；不派发。 |
| `AlembicAgent`<br>已完成 | Wave 1 provider producer removal 已验收；本 wave 不派发。 |
| `AlembicDashboard`<br>已完成 | Wave 2 mock UI/API cleanup 已验收；本 wave 不派发。 |
| `AlembicPlugin`<br>观察中 | 当前未发现 product runtime mock provider；不派发。 |
| `AlembicDesign`<br>已完成 | 已完成需求设计和确认输入；不派发。 |
| `AlembicTest`<br>已完成 | `AI-MOCK-W3-ALEMBICTEST-REAL-AI-SMOKE`：真实 / 默认 AI 配置最小 smoke 已通过总控验收。 |
| `BiliDili`<br>无任务 | 不触碰真实项目源码；仅可由 AlembicTest 按测试单作为受保护目标读取 / 观察。 |

## 可复制提示词

发送给：无（AI-MOCK 已完成，下一步恢复 PCVM）

```text
先读取 AGENTS.md、../AGENTS.md、../codex-control-workspace/.wakeflow-active/index.md、../codex-control-workspace/.wakeflow-active/current/ai-mock-removal-real-ai-smoke-wave-3-2026-05-28.md、../codex-control-workspace/.wakeflow-active/current/test-exchange.md，以及你所在窗口/目标仓库的 AGENTS.md。

先明确声明当前窗口定位和本轮测试职责。

领取并完成当前计划中分配给 AlembicTest 的 AI-MOCK Wave 3 真实 / 默认 AI 配置 smoke。

完成后回填：测试结论、配置来源/provider/model/key presence、目标项目或 fixture、触发入口和实际命令、job id/session id/Dashboard URL 摘要、runtime 状态、是否出现 product mock provider/fallback、真实项目是否干净、详细报告路径、遗留风险和下一步建议。
```

不发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicDesign`、`AlembicTest`、`BiliDili`。

## 测试交接

- 是否需要 `AlembicTest`：需要。
- 总控自测结论：总控已验收 Wave 1 / Wave 2 代码删除和 Dashboard 负向扫描；无法直接证明真实 / 默认 AI 配置下的 runtime 行为。
- 需要真实场景的理由：需要 AlembicTest 读取 Ghost / standard runtime AI 配置、保护真实项目、启动 / 观察运行时、记录日志 / API / UI 证据。
- 测试前边界与多条件判断：
  - 测试要回答的问题：AI-MOCK 删除后，最小 runtime smoke 是否不再走 product `mock` provider，并在无真实配置时显式 unavailable。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：`AlembicTest`；目标项目优先按 `AlembicTest/config/defaults.json` 选择 `BiliDili` 默认 AI 配置或受保护 fixture。
  - 成功能推出的结论：AI-MOCK product runtime mock deletion 可收束，PCVM 可恢复真实 AI baseline。
  - 失败能推出的结论：需要区分配置缺失、runtime 问题、残留 fallback、Dashboard/API 消费问题或测试环境问题。
  - 不能推出的结论：不能推出 full cold-start 通过，不能推出 PCV N0-N14 全链路可度量，不能推出 Dashboard comparison UI 可用。
  - 停止或不开始条件：需要修改真实项目业务代码、需要打印 secret、找不到可保护测试目标或命令会破坏用户数据。
- 测试单：[test-exchange.md](../../../../../codex-control-workspace/.wakeflow-active/current/test-exchange.md#test-ai-mock-w3-real-ai-smoke)
- 测试交流入口：[test-exchange.md](../../../../../codex-control-workspace/.wakeflow-active/current/test-exchange.md)
- 真实项目保护说明：`BiliDili` 只作为受保护测试目标，不直接派发，不改源码。

## 回填区

- 2026-05-28 16:28 CST：总控接受 Dashboard Wave 2 回填，创建 Wave 3 AlembicTest 真实 / 默认 AI 配置 smoke。
- 2026-05-28 16:37 CST：总控验证当前计划、测试边界、AlembicTest thread id 和 VAD mode，入队 group `ai-mock-removal-wave3-real-ai-smoke-2026-05-28`，创建并记录 heartbeat `visible-dispatch-alembictest`。
- 2026-05-28 16:57 CST：AlembicTest 回填真实 / 默认 AI smoke：BiliDili Ghost workspace 使用 `deepseek / deepseek-v4-pro`，key presence true；daemon/API ready，`/api/v1/ai/probe` connected；`mockSignals.*` 全 false；Codex browser 已打开 Jobs 页面并保存 DOM / 截图；BiliDili、Alembic、AlembicAgent、AlembicDashboard 均 clean。详细报告：`workspace-ledger/AlembicTest/ai-mock-w3-real-ai-smoke-2026-05-28.md`。遗留风险：本轮是最小 runtime smoke，不覆盖 full cold-start / PCVM N0-N14；AlembicTest restart 脚本在 PATH 缺 npm 时有 `.trim()` 健壮性缺口。
- 2026-05-28 17:22 CST：总控验收通过。复核 `workspace-ledger/AlembicTest/ai-mock-w3-real-ai-smoke-2026-05-28.md`、runtime API 摘要、空配置 fixture、daemon log、Codex browser DOM / 截图和 git 状态：`/api/v1/ai/probe` 返回 `connected`，active provider 为 `deepseek / deepseek-v4-pro`，providers 不含 `mock`，`mockSignals.*` 全 false；空配置 fixture 返回 `ok=false`、`source=empty`、`provider=null`；`BiliDili` / `Alembic` / `AlembicAgent` / `AlembicDashboard` clean。裁决：AI-MOCK 主线已达到完成定义，PCVM 可恢复。

<!-- workspace-sync
{
  "status": "总控验收通过（AI-MOCK 主线完成，PCVM 可恢复）",
  "indexPlanDescription": "AI-MOCK Wave 3 已通过总控验收：真实 / 默认 AI 配置最小 runtime smoke 证明无 product mock provider fallback。",
  "indexStatusDescription": "AI-MOCK-REMOVAL-2026-05-28 已达到完成定义；PCVM 可恢复到 Wave 4D runtime-gap 归口。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "AI-MOCK Wave 3：AlembicTest 真实 / 默认 AI 配置 smoke 已通过总控验收。",
  "currentStatusSummary": "AI-MOCK-REMOVAL-2026-05-28 已完成：Wave 1 AlembicAgent / Alembic、Wave 2 Dashboard、Wave 3 AlembicTest real AI smoke 均通过总控验收。",
  "indexRows": [
    {
      "type": "AI-MOCK Wave 2",
      "doc": ".wakeflow-active/current/ai-mock-removal-dashboard-wave-2-2026-05-28.md",
      "status": "总控验收通过",
      "description": "`AlembicDashboard` commit 7fdb4863c61a 已删除 product AI mock UI/API consumer，`npm run check` 与负向扫描通过。"
    },
    {
      "type": "AI-MOCK Wave 1",
      "doc": ".wakeflow-active/current/ai-mock-removal-deletion-wave-1-2026-05-28.md",
      "status": "总控验收通过",
      "description": "`AlembicAgent` commit 26fe915366ea7198ffc37889752644fc5028be3c 与 `Alembic` commit 1ee39b1eed5ab3fbffaaea309c8a9c966cc61499 已删除 product mock producer / consumer。"
    },
    {
      "type": "AI-MOCK 目标阶段确认",
      "doc": ".wakeflow-active/current/ai-mock-removal-goal-stage-confirmation-2026-05-28.md",
      "status": "已确认 / 主线完成",
      "description": "用户已确认 Design 推荐方向；Wave 1 / Wave 2 / Wave 3 均已通过总控验收。"
    },
    {
      "type": "AI-MOCK Stage 0 code fact baseline",
      "doc": ".wakeflow-active/current/ai-mock-removal-stage-0-code-fact-baseline-2026-05-28.md",
      "status": "已完成",
      "description": "跨仓库 mock 入口和历史数据状态已查清；Wave 3 基于上游删除验收执行真实 smoke。"
    },
    {
      "type": "PCVM Wave 4A cold-start baseline",
      "doc": ".wakeflow-active/current/progressive-chain-validation-metrics-wave-4a-cold-start-baseline-2026-05-28.md",
      "status": "可恢复",
      "description": "AI-MOCK 阻塞已解除；下一步回到 PCVM Wave 4D runtime-gap 归口。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "AI-MOCK Wave 2",
      "doc": ".wakeflow-active/current/ai-mock-removal-dashboard-wave-2-2026-05-28.md",
      "description": "AlembicDashboard product mock UI/API consumer 删除验收记录。"
    },
    {
      "type": "AI-MOCK Wave 1",
      "doc": ".wakeflow-active/current/ai-mock-removal-deletion-wave-1-2026-05-28.md",
      "description": "AlembicAgent / Alembic product mock producer / consumer 删除验收记录。"
    },
    {
      "type": "AI-MOCK 目标阶段确认",
      "doc": ".wakeflow-active/current/ai-mock-removal-goal-stage-confirmation-2026-05-28.md",
      "description": "产品 runtime AI mock 删除的完成定义、阶段顺序和 Deletion Wave 确认。"
    },
    {
      "type": "AI-MOCK Stage 0 code fact baseline",
      "doc": ".wakeflow-active/current/ai-mock-removal-stage-0-code-fact-baseline-2026-05-28.md",
      "description": "跨仓库 mock 入口、历史数据状态和 wave 边界事实基线。"
    },
    {
      "type": "PCVM Wave 4A cold-start baseline",
      "doc": ".wakeflow-active/current/progressive-chain-validation-metrics-wave-4a-cold-start-baseline-2026-05-28.md",
      "description": "AI-MOCK 删除已完成；保留 PCVM 当前 runtime-gap 事实和后续入口。"
    }
  ]
}
-->
