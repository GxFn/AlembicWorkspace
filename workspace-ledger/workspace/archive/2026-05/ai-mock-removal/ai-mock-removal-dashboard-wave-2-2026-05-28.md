# AI Mock Removal Dashboard Wave 2

日期：2026-05-28
状态：执行中
发送给：`AlembicDashboard`
总控定位：本文件是 ControlWorkspace 当前总控计划；只承载目标裁决、窗口分派、TODO 归口、测试交接和验收回填，不承载产品实现。

## 目标判断

- 用户目标：删除产品 runtime AI mock，优先覆盖 `AlembicAgent` 产品导出 / provider registry / factory fallback、`Alembic` runtime consumer / cleanup API、`AlembicDashboard` mock UI/API；test-local fake / fixture 可保留但必须隔离。
- 最终完成定义：产品 runtime、HTTP API、Dashboard 和 public package export 不再暴露、选择、fallback 或执行 `mock` AI provider；无真实 AI 配置时显式失败 / 不可用；测试 fake 只存在于测试边界。
- 当前是否已经达到：未达到。
- 未达到时剩余差距：Wave 1 已删除 `AlembicAgent` product mock producer 和 `Alembic` runtime consumer；`AlembicDashboard` 仍存在 mock provider filter / switch confirm / cleanup API client / i18n 文案。
- 已达到时验收 / 归档判断：本 wave 只验收 Dashboard UI/API cleanup；通过后进入真实 / 默认 AI 配置 smoke。
- 当前任务分区：分配计划 / Deletion Wave 2。
- 不纳入本轮事项：不派 `AlembicTest`，不跑 full cold-start，不推进 037 / 038 / 039，不修改 `BiliDili`。

## 总控决策记录

- 本次决策触发：VAD controller-return 收到 `ai-mock-removal-wave1-2026-05-28` 回填；总控复核后接受 Wave 1，并按已确认阶段顺序继续 Wave 2。
- 需求 / 测试结果理解：PCVM Wave 4D 已证明 mock path 不能作为真实 cold-start evidence；AI-MOCK 仍是 PCVM 恢复前置。Dashboard 残留 mock UI/API 会继续让用户选择或清理不存在的 product mock provider，必须删除。
- 已核对证据：Wave 1 两个产品仓库提交、总控复跑 check / diff-check / 残留扫描，以及 Dashboard 当前 mock UI/API 残留扫描。
  - `AlembicAgent` commit `26fe915366ea7198ffc37889752644fc5028be3c`：删除 `MockProvider` product 文件、export、registry、factory fallback；`npm run check` 通过；残留扫描无 product mock provider 命中。
  - `Alembic` commit `1ee39b1eed5ab3fbffaaea309c8a9c966cc61499`：删除 `MockBootstrapPipeline`、HTTP mock API / DI fallback；`npm run check` 通过；残留扫描只剩 Dashboard UI/API 范围。
  - `AlembicDashboard` 当前扫描仍命中 `cleanupMockData`、`/ai/mock/cleanup`、mock switch confirm、mock badge/copy 和 provider label。
- 是否需要先验证 / 重新计划 / 用户确认：不需要；Wave 2 在用户已确认完成定义与阶段顺序内，且是 Wave 1 验收后的直接阻塞点。
- 本次允许更新：当前 wave 执行计划、index / status / TODO、VAD Dashboard heartbeat。
- 本次不得更新：不得修改 `Alembic` / `AlembicAgent` / `BiliDili`；不得派 `AlembicTest`；不得把 Dashboard mock 文案换成隐藏入口或静态 fallback。

## Design / 需求来源

- 来源类型：DesignWindow handoff + 用户直接确认 + Wave 1 总控验收。
- 来源文档：
  - [original plan](../../../../../AlembicDesign/docs/current/ai-mock-removal-original-plan-2026-05-28.md)
  - [requirement design](../../../../../AlembicDesign/docs/current/ai-mock-removal-requirement-design-2026-05-28.md)
  - [Stage 0 baseline](../../../../../codex-control-workspace/.workspace-active/workspace/current/ai-mock-removal-stage-0-code-fact-baseline-2026-05-28.md)
  - [goal stage confirmation](../../../../../codex-control-workspace/.workspace-active/workspace/current/ai-mock-removal-goal-stage-confirmation-2026-05-28.md)
  - [Wave 1](../../../../../codex-control-workspace/.workspace-active/workspace/current/ai-mock-removal-deletion-wave-1-2026-05-28.md)
- 用户确认状态：已确认按 Design 推荐执行，并允许 AI-MOCK 自动化推进。
- 总控接收结论：本 wave 只处理 Stage 2 Dashboard mock UI/API cleanup。
- 是否需要目标阶段确认：已完成。
- 是否需要代码实现依赖调研：已完成；本 wave 补充 Dashboard 残留扫描作为直接证据。

## 代码事实与边界

- 相关仓库：本 wave 只发 `AlembicDashboard`。
- 关键入口：
  - `AlembicDashboard/src/components/Layout/Header.tsx`：mock switch confirm、switch-from cleanup、mock badge / hint。
  - `AlembicDashboard/src/api.ts`：`cleanupMockData()` 调用 `/ai/mock/cleanup`。
  - `AlembicDashboard/src/components/Modals/LlmConfigModal.tsx`：provider `mock` label / filter。
  - `AlembicDashboard/src/i18n/locales/en.ts`、`zh.ts`：mock mode / cleanup 文案和 provider label。
- producer / consumer 依赖：
  - `Alembic` 已删除 `/api/v1/ai/mock/cleanup` 与 mock provider API 成功路径。
  - `AlembicDashboard` 必须删除对应 UI/API consumer，避免调用已删除 API 或展示不可用 provider。
- 不可提前消费的上游：
  - `AlembicTest` 必须等 Dashboard cleanup 后再做真实 / 默认 AI 配置 smoke。
- 不允许触碰的目录 / 仓库：`Alembic`、`AlembicAgent`、`BiliDili` 源码、`AlembicTest` 测试资产。
- 真实测试项目是否涉及：否。

## 阶段顺序

1. Wave 1 / Stage 1：`AlembicAgent` + `Alembic` 删除 product mock producer / consumer。已通过总控验收。
2. Wave 2 / Stage 2：`AlembicDashboard` 删除 mock UI/API client/copy。当前执行。
3. Wave 3 / Stage 3：`AlembicTest` 用真实 / 默认 AI 配置做最小 smoke。
4. Wave 4 / Stage 4：总控验收、关闭 AI-MOCK、恢复 PCVM。

- 下一处真实阻塞点：Dashboard 仍可能展示 `mock` provider、调用 `/ai/mock/cleanup` 或提示 mock mode。
- 阻塞点之前还能做：Dashboard 一波删除 mock UI/API consumer，并用 lint/typecheck/test 或 focused scan 证明无 product mock UI。
- 当前可派发窗口：`AlembicDashboard`。
- 当前阻塞 / 观察窗口：`AlembicTest` 阻塞；`Alembic` / `AlembicAgent` 已完成；`AlembicCore` / `AlembicPlugin` 观察。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| AI-MOCK-W2-DASHBOARD-MOCK-UI-API-CLEANUP | `AlembicDashboard` | 删除 mock provider UI、mock cleanup API client、mock badge / hint / confirmation copy。 | 执行中 |

### AI-MOCK-W2-DASHBOARD-MOCK-UI-API-CLEANUP：Dashboard mock UI/API 删除

窗口：`AlembicDashboard`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-28 15:30 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-28 15:30 CST

阶段目标：

- Dashboard 不再展示、选择、切换、标记或清理 product `mock` AI provider。

主线动作：

- 删除 `cleanupMockData()` 与 `/ai/mock/cleanup` 调用方。
- 删除 Header 中 mock switch confirm、switch-from cleanup、mock badge / hint。
- 删除或调整 provider label / i18n 中 product mock mode / cleanup 文案；保留泛化“mock strategies”业务分类文案可以不作为 AI provider 入口。
- 确认真实 provider 列表来自后端，不再需要前端特殊 mock 过滤或 mock UI 分支。

合并 TODO：

- `AI-MOCK-REMOVAL-2026-05-28`：Dashboard product AI mock UI/API cleanup。

明确不包含：

- 不修改 `Alembic` / `AlembicAgent`；不跑真实项目 smoke；不新增 fake provider；不把 mock 改名隐藏为其它 provider。

下一处真实阻塞点：

- Dashboard cleanup 后需要 `AlembicTest` 使用真实 / 默认 AI 配置做最小 smoke。

阻塞点之前还能做：

- Dashboard 侧可以独立删除 UI/API consumer 并跑本仓库验证。

验证命令：

```text
npm run check
rg -n "cleanupMockData|ai/mock/cleanup|mockSwitch|Mock \\(Test\\)|Mock \\(测试\\)|provider === 'mock'|provider === \"mock\"|providers.mock|mockModeHint" src package.json
git diff --check
```

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- Dashboard mock UI/API 删除证据：
- 允许保留的非 provider mock 文案证据：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 若任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担工作；最终由当前窗口统一复核和回填。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AI-MOCK-REMOVAL-2026-05-28 | Wave 2 执行中 | product runtime mock removal | P0 | `AlembicAgent` / `Alembic` / `AlembicDashboard` / `AlembicTest` | 删除产品 runtime AI mock provider、mock bootstrap、Dashboard mock UI/API；test-local fake / fixture 可保留但必须隔离。 | 是 | Wave 1 已验收；本 wave 派 `AlembicDashboard`。 | `AlembicDashboard` |
| GTODO-2026-05-25-003 | 暂停 / blocked-by-ai-mock-removal | PCV cold-start metrics | P0 | PCV source / `Alembic` / `AlembicTest` | PCVM Wave 4 下一步需要真实 AI runtime baseline；当前 mock path 不能证明 N8 / N11 / N12 evidence。 | 是 | 等 AI mock deletion 关闭后恢复。 | 待定 |
| GTODO-2026-05-24-038 | 待排期 | file monitor evolution | P1 | `Alembic` / `AlembicCore` / `AlembicDashboard` / `AlembicTest` | 037 后续知识进化路线。 | 是 | AI-MOCK 和 PCVM 主线之后。 | 待定 |
| GTODO-2026-05-24-039 | 待排期 | plugin no-monitor evolution | P1 | `AlembicPlugin` / `AlembicCore` / `AlembicTest` | Plugin 无 file monitor 的机会式知识进化。 | 是 | AI-MOCK 和 PCVM 主线之后。 | 待定 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 | 否 | Wave 1 commit `1ee39b1eed5ab3fbffaaea309c8a9c966cc61499` 已通过总控验收。 |
| `AlembicCore` | 观察 | 否 | 当前未发现产品 runtime AI mock provider。 |
| `AlembicAgent` | 已完成 | 否 | Wave 1 commit `26fe915366ea7198ffc37889752644fc5028be3c` 已通过总控验收。 |
| `AlembicDashboard` | 主线任务 | 是 | 删除 Dashboard mock UI/API consumer 是当前唯一直接阻塞点。 |
| `AlembicPlugin` | 观察 | 否 | 当前未发现 product runtime mock provider。 |
| `AlembicDesign` | 已完成 | 否 | Design handoff 已接收，不派发实现。 |
| `AlembicTest` | 阻塞 | 否 | 必须等 Dashboard cleanup 后再做真实 / 默认 AI 配置 smoke。 |
| `BiliDili` | 无任务 | 否 | 真实项目只作为受保护测试目标，不直接派发。 |

## 窗口分派

发送给：`AlembicDashboard`

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | Wave 1 `AI-MOCK-W1-ALEMBIC-RUNTIME-CONSUMER-REMOVAL` 已验收。 |
| `AlembicCore`<br>观察中 | 当前未发现产品 runtime AI mock provider；不派发。 |
| `AlembicAgent`<br>已完成 | Wave 1 `AI-MOCK-W1-AGENT-PROVIDER-REMOVAL` 已验收。 |
| `AlembicDashboard`<br>执行中 | `AI-MOCK-W2-DASHBOARD-MOCK-UI-API-CLEANUP`：heartbeat 已投递；删除 mock provider UI、mock cleanup API client、mock badge / hint / confirmation copy。 |
| `AlembicPlugin`<br>观察中 | 当前未发现 product runtime AI mock provider；不派发。 |
| `AlembicDesign`<br>已完成 | 已完成需求设计和确认输入；不派发。 |
| `AlembicTest`<br>阻塞 | 等 Dashboard cleanup 后使用真实 / 默认 AI 配置做 smoke；当前不派发。 |
| `BiliDili`<br>无任务 | 不触碰真实项目源码。 |

## 可复制提示词

发送给：`AlembicDashboard`

```text
先读取 AGENTS.md、../AGENTS.md、../codex-control-workspace/.workspace-active/workspace/index.md、../codex-control-workspace/.workspace-active/workspace/current/ai-mock-removal-dashboard-wave-2-2026-05-28.md，以及你所在窗口/目标仓库的 AGENTS.md。

先明确声明当前窗口定位和本轮仓库职责。

领取并完成当前计划中分配给你所在窗口的 AI-MOCK Wave 2 任务包。

如果任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担工作；最终由当前窗口统一复核和回填。

完成后回填：完成范围、提交 hash、验证命令、验证结果、Dashboard mock UI/API 删除证据、允许保留的非 provider mock 文案证据、遗留风险和下一步建议。
```

不发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicPlugin`、`AlembicDesign`、`AlembicTest`、`BiliDili`。

## 测试交接

- 是否需要 `AlembicTest`：本 wave 不需要。
- 总控自测结论：Wave 1 已删除 product provider producer / runtime consumer；Dashboard 当前残留可由源码仓库直接删除并验证。
- 需要真实场景的理由：Dashboard cleanup 后才需要真实 / 默认 AI 配置 smoke；当前仍在 UI/API cleanup 阶段。
- 测试前边界与多条件判断：
  - 测试要回答的问题：暂不测试；后续回答“产品删除后是否不再走 mock provider，且无 AI 配置时是否显式 unavailable”。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：后续 `AlembicTest` + BiliDili Ghost / 默认 AI config。
  - 成功能推出的结论：后续 smoke 成功才能恢复 PCVM 真实 runtime baseline。
  - 失败能推出的结论：后续失败需区分真实 AI config、runtime、Dashboard/API 或测试环境。
  - 不能推出的结论：Dashboard cleanup 通过不等于 full cold-start 已通过。
  - 停止或不开始条件：Dashboard mock UI/API 仍残留，或仍需 `ALEMBIC_AI_PROVIDER=mock`。
- 测试单：不创建。
- 测试交流入口：[test-exchange.md](../../../../../codex-control-workspace/.workspace-active/workspace/current/test-exchange.md)
- 真实项目保护说明：不改 BiliDili 源码。

## 回填区

- 2026-05-28 15:30 CST：Wave 1 通过总控验收；创建 Dashboard Wave 2，只发送给 `AlembicDashboard`，不派 `AlembicTest`。
- 2026-05-28 15:34 CST：VAD 已创建并登记 `visible-dispatch-alembicdashboard` heartbeat，任务 `AI-MOCK-W2-DASHBOARD-MOCK-UI-API-CLEANUP` 进入执行中。

<!-- workspace-sync
{
  "status": "执行中（AI-MOCK Dashboard Wave 2）",
  "indexPlanDescription": "AI-MOCK Dashboard Wave 2 执行中：Wave 1 AlembicAgent / Alembic product mock 删除已通过总控验收；当前发送给 AlembicDashboard 删除 mock UI/API consumer。",
  "indexStatusDescription": "当前状态切到 AI-MOCK Dashboard Wave 2 执行中：AlembicDashboard heartbeat 已投递并 claim；PCVM 继续暂停等待真实 AI runtime smoke。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "AI-MOCK Dashboard Wave 2：删除 Dashboard mock provider UI、cleanup API client 和 mock mode 文案。",
  "currentStatusSummary": "AI-MOCK-REMOVAL-2026-05-28 Dashboard Wave 2 执行中：Wave 1 AlembicAgent / Alembic 已验收；AlembicDashboard 已 claim mock UI/API consumer cleanup，AlembicTest 等 Dashboard cleanup 后再做真实配置 smoke。",
  "indexRows": [
    {
      "type": "AI-MOCK Wave 1",
      "doc": ".workspace-active/workspace/current/ai-mock-removal-deletion-wave-1-2026-05-28.md",
      "status": "总控验收通过",
      "description": "`AlembicAgent` commit 26fe915366ea7198ffc37889752644fc5028be3c 与 `Alembic` commit 1ee39b1eed5ab3fbffaaea309c8a9c966cc61499 已删除 product mock producer / consumer。"
    },
    {
      "type": "AI-MOCK 目标阶段确认",
      "doc": ".workspace-active/workspace/current/ai-mock-removal-goal-stage-confirmation-2026-05-28.md",
      "status": "已确认 / Wave 2 已启动",
      "description": "用户已确认 Design 推荐方向；当前按阶段顺序推进 Dashboard cleanup。"
    },
    {
      "type": "AI-MOCK Stage 0 code fact baseline",
      "doc": ".workspace-active/workspace/current/ai-mock-removal-stage-0-code-fact-baseline-2026-05-28.md",
      "status": "已完成",
      "description": "跨仓库 mock 入口和历史数据状态已查清；Wave 2 基于 Dashboard 残留事实执行。"
    },
    {
      "type": "PCVM Wave 4A cold-start baseline",
      "doc": ".workspace-active/workspace/current/progressive-chain-validation-metrics-wave-4a-cold-start-baseline-2026-05-28.md",
      "status": "暂停",
      "description": "PCVM 暂停到 AI-MOCK 删除产品 mock runtime 并完成真实 / 默认 AI smoke 后恢复。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "AI-MOCK Wave 1",
      "doc": ".workspace-active/workspace/current/ai-mock-removal-deletion-wave-1-2026-05-28.md",
      "description": "AlembicAgent / Alembic product mock producer / consumer 删除验收记录。"
    },
    {
      "type": "AI-MOCK 目标阶段确认",
      "doc": ".workspace-active/workspace/current/ai-mock-removal-goal-stage-confirmation-2026-05-28.md",
      "description": "产品 runtime AI mock 删除的完成定义、阶段顺序和 Deletion Wave 确认。"
    },
    {
      "type": "AI-MOCK Stage 0 code fact baseline",
      "doc": ".workspace-active/workspace/current/ai-mock-removal-stage-0-code-fact-baseline-2026-05-28.md",
      "description": "跨仓库 mock 入口、历史数据状态和 wave 边界事实基线。"
    },
    {
      "type": "PCVM Wave 4A cold-start baseline",
      "doc": ".workspace-active/workspace/current/progressive-chain-validation-metrics-wave-4a-cold-start-baseline-2026-05-28.md",
      "description": "暂停到 AI-MOCK 删除后恢复；保留 PCVM 当前事实和后续入口。"
    }
  ]
}
-->
