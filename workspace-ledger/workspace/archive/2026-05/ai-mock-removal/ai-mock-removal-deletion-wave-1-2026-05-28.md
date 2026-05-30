# AI Mock Removal Deletion Wave 1

日期：2026-05-28
状态：总控验收通过
发送给：`AlembicAgent`、`Alembic`
总控定位：本文件是 ControlWorkspace 当前总控计划；只承载目标裁决、窗口分派、TODO 归口、测试交接和验收回填，不承载产品实现。

## 目标判断

- 用户目标：删除产品 runtime AI mock，优先覆盖 `AlembicAgent` 产品导出 / provider registry / factory fallback、`Alembic` runtime consumer / cleanup API、`AlembicDashboard` mock UI/API；test-local fake / fixture 可保留但必须隔离。
- 最终完成定义：产品 runtime、HTTP API、Dashboard 和 public package export 不再暴露、选择、fallback 或执行 `mock` AI provider；无真实 AI 配置时显式失败 / 不可用；测试 fake 只存在于测试边界。
- 当前是否已经达到：未达到。
- 未达到时剩余差距：`AlembicAgent` 仍生产 product mock provider；`Alembic` 仍消费 mock provider / mock bootstrap / mock cleanup API；Dashboard 和 Test 等上游删除后再推进。
- 已达到时验收 / 归档判断：本 wave 只验收 Stage 1 producer / consumer 删除；通过后进入 Dashboard cleanup wave。
- 当前任务分区：分配计划 / Deletion Wave 1。
- 不纳入本轮事项：不派 `AlembicDashboard`，不派 `AlembicTest`，不跑 full cold-start，不推进 037 / 038 / 039，不修改 `BiliDili`。

## 总控决策记录

- 本次决策触发：用户在 Stage 0 完成后回复“继续吧”，确认启动 Deletion Wave 1。
- 需求 / 测试结果理解：PCVM Wave 4D 已证明 mock path 不能作为真实 cold-start evidence；AI-MOCK 是当前 P0 阻塞项。
- 已核对证据：Stage 0 code fact baseline、goal stage confirmation、Design original plan / requirement design。
  - [Stage 0 code fact baseline](../../../../../codex-control-workspace/.workspace-active/workspace/current/ai-mock-removal-stage-0-code-fact-baseline-2026-05-28.md)
  - [Goal stage confirmation](../../../../../codex-control-workspace/.workspace-active/workspace/current/ai-mock-removal-goal-stage-confirmation-2026-05-28.md)
  - Design original plan / requirement design
- 是否需要先验证 / 重新计划 / 用户确认：用户已确认继续；当前不需要再问。
- 本次允许更新：当前 wave 执行计划、index / status / TODO；允许输出给 `AlembicAgent` 与 `Alembic` 的统一提示词。
- 本次不得更新：不得由总控直接修改产品源码；不得把 `Dashboard` 或 `AlembicTest` 提前派发；不得把 test fake 当成 product provider 保留。

## Design / 需求来源

- 来源类型：DesignWindow handoff + 用户直接确认。
- 来源文档：
  - [original plan](../../../../../AlembicDesign/docs/current/ai-mock-removal-original-plan-2026-05-28.md)
  - [requirement design](../../../../../AlembicDesign/docs/current/ai-mock-removal-requirement-design-2026-05-28.md)
  - [Stage 0 baseline](../../../../../codex-control-workspace/.workspace-active/workspace/current/ai-mock-removal-stage-0-code-fact-baseline-2026-05-28.md)
  - [goal stage confirmation](../../../../../codex-control-workspace/.workspace-active/workspace/current/ai-mock-removal-goal-stage-confirmation-2026-05-28.md)
- 用户确认状态：已确认按 Design 推荐执行；2026-05-28 14:41 CST 确认继续进入 Deletion Wave 1。
- 总控接收结论：本 wave 只处理 Stage 1 product provider producer / runtime consumer 删除。
- 是否需要目标阶段确认：已完成。
- 是否需要代码实现依赖调研：已完成。

## 代码事实与边界

- 相关仓库：本 wave 只发 `AlembicAgent`、`Alembic`。
- 关键入口：
  - `AlembicAgent/src/external/ai/AiFactory.ts`：`MockProvider` import、`PROVIDER_MAP.mock`、explicit `mock` env、no-key fallback、re-export。
  - `AlembicAgent/src/external/ai/index.ts`：public `MockProvider` export。
  - `AlembicAgent/src/external/ai/registry/model-defs.ts`：`ProviderId` includes `mock`。
  - `AlembicAgent/test/ai-provider.test.ts`：test currently imports `MockProvider` and `provider: 'mock'`。
  - `Alembic/lib/workflows/capabilities/execution/internal-agent/InternalDimensionExecutionPipeline.ts`：mock mode routes to `MockBootstrapPipeline`。
  - `Alembic/lib/workflows/capabilities/execution/internal-agent/MockBootstrapPipeline.ts`：product mock bootstrap pipeline。
  - `Alembic/lib/injection/modules/AiModule.ts`：manager fallback `{ name: 'mock', model: 'mock-fallback' }`。
  - `Alembic/lib/http/routes/ai.ts`：provider list appends mock, `/probe` and `/config` accept mock, `/ai/mock/cleanup` exists.
- producer / consumer 依赖：
  - `AlembicAgent` removes product mock producer.
  - `Alembic` removes product mock consumer and must tolerate `AlembicAgent` no longer providing mock.
  - Both can proceed in parallel because both target removing the same contract, not inventing a replacement.
- 不可提前消费的上游：
  - `AlembicDashboard` must wait for `Alembic` provider/config API deletion evidence before final UI/API cleanup.
  - `AlembicTest` must wait for product deletion before real smoke.
- 不允许触碰的目录 / 仓库：`BiliDili` 源码、`AlembicDashboard` source in this wave、`AlembicCore` / `AlembicPlugin` unless implementation proves direct product mock runtime dependency and reports it.
- 真实测试项目是否涉及：否。

## 阶段顺序

1. Wave 1 / Stage 1：`AlembicAgent` + `Alembic` 删除 product mock producer / consumer。
2. Wave 2 / Stage 2：`AlembicDashboard` 删除 mock UI/API client/copy。
3. Wave 3 / Stage 3：`AlembicTest` 用真实 / 默认 AI 配置做最小 smoke。
4. Wave 4 / Stage 4：总控验收、关闭 AI-MOCK、恢复 PCVM。

- 下一处真实阻塞点：product mock provider producer / consumer 仍连通。
- 阻塞点之前还能做：本 wave 直接删除 `AlembicAgent` producer 与 `Alembic` consumer。
- 当前可派发窗口：`AlembicAgent`、`Alembic`。
- 当前阻塞 / 观察窗口：`AlembicDashboard` 观察 API contract；`AlembicTest` 阻塞；`AlembicCore` / `AlembicPlugin` 观察。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| AI-MOCK-W1-AGENT-PROVIDER-REMOVAL | `AlembicAgent` | 删除 product `MockProvider` producer / export / registry / fallback，迁移 tests 到 test-local fake。 | 执行中 |
| AI-MOCK-W1-ALEMBIC-RUNTIME-CONSUMER-REMOVAL | `Alembic` | 删除 runtime mock bootstrap / HTTP mock API / DI mock fallback，改为 AI unavailable。 | 执行中 |

### AI-MOCK-W1-AGENT-PROVIDER-REMOVAL：AlembicAgent product provider 删除

窗口：`AlembicAgent`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-28 14:41 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-28 14:41 CST

阶段目标：

- 产品 package 不再导出、注册、自动 fallback 或接受 `mock` AI provider。

主线动作：

- 删除或隔离 `MockProvider` product provider。
- 从 public `ai` export、provider registry、factory map、model defs、auto-detect fallback 中移除 `mock`。
- 将依赖 mock 的 tests 改为 test-local fake / stub，不再命名或暴露为 product provider。

合并 TODO：

- `AI-MOCK-REMOVAL-2026-05-28`：product runtime AI mock removal。

明确不包含：

- 不删真实 provider；不新增 empty provider；不修改 `Alembic` runtime consumer；不改变 PCVM 节点逻辑。

下一处真实阻塞点：

- `Alembic` runtime consumer 仍可能接受 mock，需要本 wave 并行删除。

阻塞点之前还能做：

- Agent 侧可以一波删除 producer / tests / type contract。

验证命令：

```text
npm run check
rg -n "MockProvider|provider: 'mock'|provider: \"mock\"|ALEMBIC_AI_PROVIDER=mock|mock-smart|mock-l3" src test package.json
git diff --check
```

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- product mock export / registry / fallback 删除证据：
- test-local fake / fixture 保留证据：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 若任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担工作；最终由当前窗口统一复核和回填。

### AI-MOCK-W1-ALEMBIC-RUNTIME-CONSUMER-REMOVAL：Alembic runtime mock 删除

窗口：`Alembic`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-28 14:41 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-28 14:41 CST

阶段目标：

- Alembic daemon / HTTP / bootstrap runtime 不再进入 mock provider 或 mock pipeline；无 AI 配置走明确 AI unavailable / config required。

主线动作：

- 删除 `MockBootstrapPipeline` routing 和 product mock-generated path。
- 删除 `/ai/providers` 中 mock append、`/ai/probe` / `/ai/config` 对 mock 的成功路径、`/ai/mock/cleanup`。
- 删除 DI `{ name: 'mock', model: 'mock-fallback' }` fallback，改为明确 unavailable。
- 检查 `requireAiReady`、routes、service 文案是否从 Mock mode 转为 AI unavailable / unconfigured。

合并 TODO：

- `AI-MOCK-REMOVAL-2026-05-28`：PCVM runtime-gap unblock 前置。

明确不包含：

- 不跑 full cold-start；不修改 Dashboard source；不改 `AlembicAgent` provider implementation；不改真实测试项目。

下一处真实阻塞点：

- Dashboard 仍可能展示 mock cleanup / switch UI，需要 Stage 2 删除。

阻塞点之前还能做：

- Alembic runtime / HTTP / DI mock consumer 可以一波删除，并补 targeted route / bootstrap tests。

验证命令：

```text
npm run check
rg -n "MockBootstrapPipeline|mock-pipeline|mock-generated|ai/mock/cleanup|Mock \\(测试\\)|provider: 'mock'|provider: \"mock\"|mock-fallback" lib test vendor
git diff --check
```

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- 无 AI provider 行为证据：
- HTTP provider / config / probe mock 拒绝证据：
- vendor Dashboard 是否同步处理：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 若任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担工作；最终由当前窗口统一复核和回填。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AI-MOCK-REMOVAL-2026-05-28 | Wave 1 待启动 | product runtime mock removal | P0 | `AlembicAgent` / `Alembic` / `AlembicDashboard` / `AlembicTest` | 删除产品 runtime AI mock provider、mock bootstrap、Dashboard mock UI/API；test-local fake / fixture 可保留但必须隔离。 | 是 | 用户确认继续；本 wave 派 `AlembicAgent` + `Alembic`。 | `AlembicAgent` + `Alembic` |
| GTODO-2026-05-25-003 | 暂停 / blocked-by-ai-mock-removal | PCV cold-start metrics | P0 | PCV source / `Alembic` / `AlembicTest` | PCVM Wave 4 下一步需要真实 AI runtime baseline；当前 mock path 不能证明 N8 / N11 / N12 evidence。 | 是 | 等 AI mock deletion 关闭后恢复。 | 待定 |
| GTODO-2026-05-24-038 | 待排期 | file monitor evolution | P1 | `Alembic` / `AlembicCore` / `AlembicDashboard` / `AlembicTest` | 037 后续知识进化路线。 | 是 | AI-MOCK 和 PCVM 主线之后。 | 待定 |
| GTODO-2026-05-24-039 | 待排期 | plugin no-monitor evolution | P1 | `AlembicPlugin` / `AlembicCore` / `AlembicTest` | Plugin 无 file monitor 的机会式知识进化。 | 是 | AI-MOCK 和 PCVM 主线之后。 | 待定 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 主线任务 | 是 | 已创建并登记 heartbeat，负责删除 runtime mock consumer / HTTP mock API / DI fallback。 |
| `AlembicCore` | 观察 | 否 | 当前未发现产品 runtime AI mock provider。 |
| `AlembicAgent` | 主线任务 | 是 | 已创建并登记 heartbeat，负责删除 product mock provider producer / export / registry / fallback。 |
| `AlembicDashboard` | 观察 | 否 | 等 Alembic API / runtime mock 删除后再清 UI/API client。 |
| `AlembicPlugin` | 观察 | 否 | 当前未发现 product runtime mock provider。 |
| `AlembicDesign` | 已完成 | 否 | Design handoff 已接收，不派发实现。 |
| `AlembicTest` | 阻塞 | 否 | 必须等产品删除完成后再做真实配置 smoke。 |
| `BiliDili` | 无任务 | 否 | 真实项目只作为受保护测试目标，不直接派发。 |

## 窗口分派

发送给：`AlembicAgent`、`Alembic`

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>执行中 | `AI-MOCK-W1-ALEMBIC-RUNTIME-CONSUMER-REMOVAL`：heartbeat 已投递；删除 runtime mock bootstrap / HTTP mock API / DI mock fallback，改为 AI unavailable。 |
| `AlembicCore`<br>观察中 | 当前未发现产品 runtime AI mock provider；不派发。 |
| `AlembicAgent`<br>执行中 | `AI-MOCK-W1-AGENT-PROVIDER-REMOVAL`：heartbeat 已投递；删除 product `MockProvider` producer / export / registry / fallback，迁移 tests 到 test-local fake。 |
| `AlembicDashboard`<br>观察中 | 等 `Alembic` API contract 删除后派发 mock UI/API client cleanup。 |
| `AlembicPlugin`<br>观察中 | 当前未发现产品 runtime AI mock provider；不派发。 |
| `AlembicDesign`<br>已完成 | 已完成需求设计和确认输入；不派发。 |
| `AlembicTest`<br>阻塞 | 等产品删除完成后使用真实 / 默认 AI 配置做 smoke；当前不派发。 |
| `BiliDili`<br>无任务 | 不触碰真实项目源码。 |

## 可复制提示词

发送给：`AlembicAgent`、`Alembic`

```text
先读取 AGENTS.md、../AGENTS.md、../codex-control-workspace/.workspace-active/workspace/index.md、../codex-control-workspace/.workspace-active/workspace/current/ai-mock-removal-deletion-wave-1-2026-05-28.md，以及你所在窗口/目标仓库的 AGENTS.md。

先明确声明当前窗口定位和本轮仓库职责。

领取并完成当前计划中分配给你所在窗口的 AI-MOCK Wave 1 任务包。

如果任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担工作；最终由当前窗口统一复核和回填。

完成后回填：完成范围、提交 hash、验证命令、验证结果、product mock 删除证据、test-local fake / fixture 保留证据（如适用）、遗留风险和下一步建议。
```

不发送给：`AlembicCore`、`AlembicDashboard`、`AlembicPlugin`、`AlembicDesign`、`AlembicTest`、`BiliDili`。

## 测试交接

- 是否需要 `AlembicTest`：本 wave 不需要。
- 总控自测结论：Stage 0 已定位 product mock producer / consumer；本 wave 先由源仓库删除和自测。
- 需要真实场景的理由：Stage 1/2 后才需要真实 / 默认 AI 配置 smoke；当前还没有可测产品状态。
- 测试前边界与多条件判断：
  - 测试要回答的问题：暂不测试；后续回答“产品删除后是否不再走 mock provider”。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：后续 `AlembicTest` + BiliDili Ghost / 默认 AI config。
  - 成功能推出的结论：后续 smoke 成功才能恢复 PCVM 真实 runtime baseline。
  - 失败能推出的结论：后续失败需区分真实 AI config、runtime、Dashboard/API 或测试环境。
  - 不能推出的结论：本 wave 代码删除通过不等于 full cold-start 已通过。
  - 停止或不开始条件：Stage 1 / Stage 2 未完成，或仍需 `ALEMBIC_AI_PROVIDER=mock`。
- 测试单：不创建。
- 测试交流入口：[test-exchange.md](../../../../../codex-control-workspace/.workspace-active/workspace/current/test-exchange.md)
- 真实项目保护说明：不改 BiliDili 源码。

## 回填区

- 2026-05-28 14:41 CST：用户确认继续；总控创建 Deletion Wave 1，发送给 `AlembicAgent` 与 `Alembic`，不派发 `Dashboard` / `Test`。
- 2026-05-28 14:50 CST：VAD mode 已开启，防睡眠 active；已创建并登记 `visible-dispatch-alembic` 与 `visible-dispatch-alembicagent` 两条 heartbeat，按 20 秒间隔投递。
- 2026-05-28 15:27 CST：总控验收通过 Wave 1。`AlembicAgent` commit `26fe915366ea7198ffc37889752644fc5028be3c` 通过 `npm run check`、diff-check、负向残留扫描；`Alembic` commit `1ee39b1eed5ab3fbffaaea309c8a9c966cc61499` 通过 `npm run check`、diff-check，残留扫描只剩 Dashboard UI/API 范围。下一步进入 Dashboard Wave 2。

<!-- workspace-sync
{
  "status": "执行中（AI-MOCK Deletion Wave 1）",
  "indexPlanDescription": "AI-MOCK Deletion Wave 1 执行中：已用 VAD heartbeat 发送给 AlembicAgent 与 Alembic，删除 product mock provider producer / runtime consumer；Dashboard / Test 等上游回填后再推进。",
  "indexStatusDescription": "当前状态切到 AI-MOCK Deletion Wave 1 执行中：AlembicAgent + Alembic heartbeat 已投递，PCVM 继续暂停等待真实 AI runtime。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "AI-MOCK Deletion Wave 1：VAD 已投递 AlembicAgent + Alembic，删除产品 mock provider producer / runtime consumer。",
  "currentStatusSummary": "AI-MOCK-REMOVAL-2026-05-28 Deletion Wave 1 执行中：VAD 已投递 AlembicAgent 与 Alembic；AlembicDashboard 观察 API contract，AlembicTest 等产品删除完成后再做真实配置 smoke。",
  "indexRows": [
    {
      "type": "AI-MOCK 目标阶段确认",
      "doc": ".workspace-active/workspace/current/ai-mock-removal-goal-stage-confirmation-2026-05-28.md",
      "status": "已确认 / Wave 1 已启动",
      "description": "用户已确认 Design 推荐方向，并确认继续启动 Deletion Wave 1。"
    },
    {
      "type": "AI-MOCK Stage 0 code fact baseline",
      "doc": ".workspace-active/workspace/current/ai-mock-removal-stage-0-code-fact-baseline-2026-05-28.md",
      "status": "已完成",
      "description": "跨仓库 mock 入口和历史数据状态已查清；Deletion Wave 1 基于该事实执行。"
    },
    {
      "type": "PCVM Wave 4A cold-start baseline",
      "doc": ".workspace-active/workspace/current/progressive-chain-validation-metrics-wave-4a-cold-start-baseline-2026-05-28.md",
      "status": "暂停",
      "description": "PCVM 暂停到 AI-MOCK 删除产品 mock runtime 后恢复；Wave 4D 已证明 mock path 不能代表真实 N8 / N11 / N12 evidence。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "AI-MOCK 目标阶段确认",
      "doc": ".workspace-active/workspace/current/ai-mock-removal-goal-stage-confirmation-2026-05-28.md",
      "description": "产品 runtime AI mock 删除的完成定义、阶段顺序和 Deletion Wave 1 确认。"
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
