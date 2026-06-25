# AI Mock Removal Stage 0 Code Fact Baseline

日期：2026-05-28
状态：暂停（Stage 0 已完成，Deletion Wave 1 待用户确认启动）
发送给：无
总控定位：本文件是 ControlWorkspace 当前总控计划；只承载目标裁决、窗口分派、TODO 归口、测试交接和验收回填，不承载产品实现。

## 目标判断

- 用户目标：删除产品 runtime AI mock，优先覆盖 `AlembicAgent` 产品导出 / provider registry / factory fallback、`Alembic` runtime consumer / cleanup API、`AlembicDashboard` mock UI/API；test-local fake / fixture 可保留但必须隔离。
- 最终完成定义：产品 runtime、HTTP API、Dashboard 和 public package export 不再暴露、选择、fallback 或执行 `mock` AI provider；无真实 AI 配置时显式失败 / 不可用；测试用 fake 只存在于测试边界。
- 当前是否已经达到：未达到。
- 未达到时剩余差距：`AlembicAgent` 仍导出并 fallback 到 `MockProvider`；`Alembic` 仍有 `MockBootstrapPipeline`、`/ai/mock/cleanup` 和 provider list mock entry；`AlembicDashboard` 仍有 mock switch / cleanup UI；PCVM runtime smoke 仍受 mock path 影响。
- 已达到时验收 / 归档判断：完成 Stage 1-3 后再由总控复核残留扫描、真实配置 smoke 和 PCVM unblock 条件。
- 当前任务分区：Design 交接接收 + 代码事实分析 + 目标阶段确认。
- 不纳入本轮事项：不改产品代码，不派发 deletion wave，不跑 full cold-start，不启动 037 / 038 / 039。

## 总控决策记录

- 本次决策触发：用户领取 `AI-MOCK-REMOVAL-2026-05-28`，并确认按 Design 推荐执行。
- 需求 / 测试结果理解：PCVM Wave 4D 暴露当前真实 runtime smoke 仍可走 `ALEMBIC_AI_PROVIDER=mock`，该路径绕过 internal-agent finalizer，不能作为 cold-start 节点证据；因此 AI mock 删除优先于继续 PCVM。
- 已核对证据：Design original plan / requirement design、`AlembicAgent` provider source、`Alembic` AI routes / bootstrap pipeline / DI、`AlembicDashboard` Header / API client / i18n、`AlembicCore` / `AlembicPlugin` 残留扫描、BiliDili 与 AlembicWorkspace Ghost DB mock source 查证。
- 是否需要先验证 / 重新计划 / 用户确认：Stage 0 已完成；Deletion Wave 1 涉及产品删除，建议用户确认后启动。
- 本次允许更新：当前目标阶段确认、Stage 0 事实基线、当前 index / status / TODO。
- 本次不得更新：不得修改产品子仓库源码；不得给 `AlembicTest` 创建测试单；不得把 Design 建议以外的范围写成已确认目标。

## Design / 需求来源

- 来源类型：DesignWindow handoff + 用户直接确认。
- 来源文档：
  - [original plan](../../../../../AlembicDesign/docs/current/ai-mock-removal-original-plan-2026-05-28.md)
  - [requirement design](../../../../../AlembicDesign/docs/current/ai-mock-removal-requirement-design-2026-05-28.md)
- 用户确认状态：已确认 Design 推荐方向；本文件记录 Stage 0 后的总控阶段判断。
- 总控接收结论：接收为 P0 当前主线，先于 037 收敛、038、039；同时阻断 PCVM 后续真实 runtime baseline。
- 是否需要目标阶段确认：需要，见 [goal stage confirmation](../../../../../codex-control-workspace/.wakeflow-active/current/ai-mock-removal-goal-stage-confirmation-2026-05-28.md)。
- 是否需要代码实现依赖调研：需要，本文件即 Stage 0 事实基线。

## 代码事实与边界

- 相关仓库：`AlembicAgent`、`Alembic`、`AlembicDashboard`、`AlembicTest`；`AlembicCore` / `AlembicPlugin` 观察。
- 关键入口：
  - `AlembicAgent/src/external/ai/AiFactory.ts:14` 引入 `MockProvider`，`:27` 注册 `mock`，`:63-84` 允许显式 `ALEMBIC_AI_PROVIDER=mock`，`:107` 无 key fallback 到 `createProvider({ provider: 'mock' })`。
  - `AlembicAgent/src/external/ai/index.ts:9` public export `MockProvider`；`registry/model-defs.ts:9` `ProviderId` 包含 `mock`。
  - `Alembic/lib/workflows/capabilities/execution/internal-agent/InternalDimensionExecutionPipeline.ts:15` 引入 `MockBootstrapPipeline`，`:35-38` mock mode 路由到 `fillDimensionsMock`。
  - `Alembic/lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillPreparation.ts:64-73` 根据 `_aiProviderManager.isMock` 跳过真实 `agentService` / `systemRunContextFactory`，`:112-125` 已有 AI unavailable 事件路径可承接。
  - `Alembic/lib/injection/modules/AiModule.ts:55-58` 无 provider 时用 `{ name: 'mock', model: 'mock-fallback' }` 创建 manager。
  - `Alembic/lib/http/routes/ai.ts:306-315` provider list 手动追加 mock，`:332-372` `/probe` 可 `createProvider(mock)`，`:396-430` `/config` 可切换 mock，`:433-485` 暴露 `/ai/mock/cleanup`。
  - `AlembicDashboard/src/components/Layout/Header.tsx:397-426` 处理切换 to/from mock 和 cleanup，`AlembicDashboard/src/api.ts:2387-2389` 调 `/ai/mock/cleanup`。
- producer / consumer 依赖：
  - `AlembicAgent` 是 product provider producer；`Alembic` 是 runtime consumer；`AlembicDashboard` 是 HTTP API/UI consumer；`AlembicTest` 是最终真实环境 evidence consumer。
  - `AlembicDashboard` 可删除 UI，但最终验收要以 `Alembic` provider list / config API 不再暴露 mock 为准。
- 不可提前消费的上游：`AlembicTest` 不得在 `AlembicAgent` / `Alembic` 删除前继续用 mock path 验证；Dashboard 不得猜新 API 字段。
- 不允许触碰的目录 / 仓库：不改 `BiliDili` 源码；不在 `AlembicCore` / `AlembicPlugin` 做无证据清理；不在 control workspace 实现产品逻辑。
- 真实测试项目是否涉及：仅后续 Stage 3 通过 `AlembicTest` 使用 BiliDili Ghost / 默认 AI 配置做真实 smoke。

### 仓库事实

#### AlembicAgent

- 产品 provider registry 和 factory 仍把 `mock` 当作正式 provider。删除点包括 `PROVIDER_MAP.mock`、`ProviderClass` union、`keyEnvMap.mock`、无 key fallback、`MockProvider` public export、`ProviderId` mock。
- `src/external/ai/providers/MockProvider.ts` 是完整产品 provider 文件，注释明确“用于没有 API Key 体验完整工作流”，这与用户确认的新目标冲突。
- `test/ai-provider.test.ts` 依赖 `MockProvider` 与 `provider: 'mock'`；需要迁移到 test-local fake / stub，命名不能继续暴露为 product `MockProvider`。

#### Alembic

- `InternalDimensionExecutionPipeline` 在 mock mode 直接走 `MockBootstrapPipeline`，会产生 `mock-pipeline` / `mock-generated` 语义并绕过真实 internal-agent finalizer。
- `AiModule` 无 provider fallback 到 mock manager，扩大了 mock 到 runtime 默认路径。
- HTTP `/ai/providers`、`/ai/probe`、`/ai/config`、`/ai/mock/cleanup` 共同让 Dashboard 和外部调用方可以看到、切换、验证、清理 mock。
- 已存在 `emitInternalDimensionFillAiUnavailable()`，可作为删除 mock 后的真实无 AI 状态承接点。

#### AlembicDashboard

- Header UI 仍识别从 mock 切出 / 切入，并调用 cleanup；provider label 和 i18n 仍包含 Mock。
- `LlmConfigModal` 已过滤 provider list 中的 `mock`，但 Dashboard 仍有旧 Header / API / contract test 残留，不能只依赖 modal filter。

#### AlembicCore / AlembicPlugin

- 未发现产品 runtime AI mock provider。`AlembicCore` 当前只涉及测试 fake / repository helper；`AlembicPlugin` 主要是历史 changelog / vendor test 残留。
- 当前不派发实现；后续如 `Alembic` 删除 cleanup route 后发现 Core helper 死代码，再作为 cleanup TODO 单独处理。

#### AlembicTest / 历史数据

- `workspace-ledger/AlembicTest/pcvm-wave4d-coldstart-scorecard-smoke-2026-05-28.md` 记录本轮曾用 `ALEMBIC_AI_PROVIDER=mock`，并明确不能证明真实 provider 路径。
- 本机 BiliDili Ghost DB 和 AlembicWorkspace Ghost DB 查询未发现 `source` / `createdBy` 中含 mock 的 knowledge entries，也未发现 semantic memories 残留；当前不需要历史数据 cleanup wave。
- 后续 Test 只能使用真实 / 默认 AI 配置，不再以 mock provider 作为测试用 AI。

## 阶段顺序

1. Stage 0：总控完成跨仓库事实基线、目标阶段确认和 TODO 入账。
2. Stage 1：`AlembicAgent` + `Alembic` 删除 product provider producer / runtime consumer。
3. Stage 2：`AlembicDashboard` 删除 mock UI/API 客户端与 copy，配合 API contract。
4. Stage 3：`AlembicTest` 真实 / 默认 AI 配置 smoke，确认不再走 mock path。
5. Stage 4：总控验收、关闭 AI-MOCK TODO、恢复 PCVM 冷启动链路优化。

- 下一处真实阻塞点：`AlembicAgent` 与 `Alembic` 的 product mock producer / consumer 仍连通。
- 阻塞点之前还能做：Stage 0 已完成；下一步只能启动 deletion wave 或等待用户确认。
- 当前可派发窗口：候选 `AlembicAgent`、`Alembic`；当前不发送。
- 当前阻塞 / 观察窗口：`AlembicDashboard` 观察 API contract；`AlembicTest` 阻塞到产品删除完成；`AlembicCore` / `AlembicPlugin` 观察。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| AI-MOCK-W1-AGENT-PROVIDER-REMOVAL | `AlembicAgent` | 删除 product `MockProvider` producer / export / registry / fallback，迁移 tests 到 test-local fake。 | 暂停 |
| AI-MOCK-W1-ALEMBIC-RUNTIME-CONSUMER-REMOVAL | `Alembic` | 删除 runtime mock bootstrap / HTTP mock API / DI mock fallback，改为 AI unavailable。 | 暂停 |
| AI-MOCK-W2-DASHBOARD-MOCK-UI-REMOVAL | `AlembicDashboard` | 删除 mock switch / cleanup UI、API client、i18n 和 contract test 残留。 | 观察中 |
| AI-MOCK-W3-TEST-REAL-AI-SMOKE | `AlembicTest` | 产品删除后用真实 / 默认 AI 配置做最小 smoke。 | 阻塞 |

### AI-MOCK-W1-AGENT-PROVIDER-REMOVAL：AlembicAgent product provider 删除

窗口：`AlembicAgent`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：待启动

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-28 14:23 CST

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

- `Alembic` 仍可能通过旧 runtime consumer / HTTP routes 接受 mock。

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

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：待启动

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-28 14:23 CST

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

- 不跑 full cold-start；不修改 Dashboard UI；不改 `AlembicAgent` provider implementation；不改真实测试项目。

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
| AI-MOCK-REMOVAL-2026-05-28 | Stage 0 完成 / Wave 1 待确认 | product runtime mock removal | P0 | `AlembicAgent` / `Alembic` / `AlembicDashboard` / `AlembicTest` | 删除产品 runtime AI mock provider、mock bootstrap、Dashboard mock UI/API；test-local fake 保留但隔离。 | 是 | 用户确认 Design 推荐；Stage 0 事实基线已完成。 | `AlembicAgent` + `Alembic` |
| GTODO-2026-05-25-003 | 暂停 / blocked-by-ai-mock-removal | PCV cold-start metrics | P0 | PCV source / `Alembic` / `AlembicTest` | PCVM Wave 4 下一步需要真实 AI runtime baseline；当前 mock path 不能证明 N8 / N11 / N12 evidence。 | 是 | 等 AI mock deletion 关闭后恢复。 | 待定 |
| GTODO-2026-05-24-038 | 待排期 | file monitor evolution | P1 | `Alembic` / `AlembicCore` / `AlembicDashboard` / `AlembicTest` | 037 后续知识进化路线。 | 是 | AI-MOCK 和 PCVM 主线之后。 | 待定 |
| GTODO-2026-05-24-039 | 待排期 | plugin no-monitor evolution | P1 | `AlembicPlugin` / `AlembicCore` / `AlembicTest` | Plugin 无 file monitor 的机会式知识进化。 | 是 | AI-MOCK 和 PCVM 主线之后。 | 待定 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 主线任务候选 | 否 | 等用户确认启动 Deletion Wave 1。 |
| `AlembicCore` | 观察 | 否 | 当前无 product AI mock provider。 |
| `AlembicAgent` | 主线任务候选 | 否 | 等用户确认启动 Deletion Wave 1。 |
| `AlembicDashboard` | 观察 | 否 | 等 Alembic API / runtime mock 删除后再清 UI/API client。 |
| `AlembicPlugin` | 观察 | 否 | 当前无 product AI mock provider。 |
| `AlembicDesign` | 已完成 | 否 | Design handoff 已接收，不派发实现。 |
| `AlembicTest` | 阻塞 | 否 | 必须等产品删除完成后再做真实配置 smoke。 |
| `BiliDili` | 无任务 | 否 | 真实项目只作为受保护测试目标，不直接派发。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>暂停 | 候选 `AI-MOCK-W1-ALEMBIC-RUNTIME-CONSUMER-REMOVAL`，等待用户确认启动 wave。 |
| `AlembicCore`<br>观察中 | 当前未发现产品 runtime mock provider；不派发。 |
| `AlembicAgent`<br>暂停 | 候选 `AI-MOCK-W1-AGENT-PROVIDER-REMOVAL`，等待用户确认启动 wave。 |
| `AlembicDashboard`<br>观察中 | 等 `Alembic` API contract 删除后派发 mock UI/API client cleanup。 |
| `AlembicPlugin`<br>观察中 | 当前未发现产品 runtime mock provider；不派发。 |
| `AlembicDesign`<br>已完成 | 已完成需求设计和确认输入；不派发。 |
| `AlembicTest`<br>阻塞 | 等产品删除完成后使用真实 / 默认 AI 配置做 smoke；当前不派发。 |
| `BiliDili`<br>无任务 | 不触碰真实项目源码。 |

## 可复制提示词

发送给：无

```text
等待用户确认是否启动 AI-MOCK Deletion Wave 1；当前不派发。确认后提示词必须要求执行窗口先读取本 workspace AGENTS.md、当前总控文档和目标仓库 AGENTS.md，并明确当前窗口定位。
```

## 测试交接

- 是否需要 `AlembicTest`：后续需要，但当前不需要。
- 总控自测结论：Stage 0 已用代码扫描和本机 Ghost DB 只读查证定位 product mock 入口与历史数据状态。
- 需要真实场景的理由：产品删除完成后，必须确认真实 / 默认 AI 配置下 cold-start smoke 不再走 mock provider，且能给 PCVM 后续 baseline 提供可信 runtime evidence。
- 测试前边界与多条件判断：
  - 测试要回答的问题：产品删除后，BiliDili 真实项目 smoke 是否能在真实 / 默认 AI 配置下启动，并且不出现 mock provider / mock-pipeline。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：`AlembicTest` + BiliDili Ghost / 默认 AI config；不改 BiliDili 源码。
  - 成功能推出的结论：AI-MOCK 删除没有继续暴露 mock path，真实配置 smoke 可作为 PCVM 后续前置。
  - 失败能推出的结论：失败归因需要区分真实 AI config、Alembic runtime、Dashboard/API 或测试环境，不能直接归咎 PCVM。
  - 不能推出的结论：不能证明 N0-N14 全部 PCV 节点已经可度量。
  - 停止或不开始条件：Stage 1/2 未完成、测试配置仍要求 `ALEMBIC_AI_PROVIDER=mock`、或真实 project config 不可用。
- 测试单：待 Stage 1/2 通过后创建。
- 测试交流入口：[test-exchange.md](../../../../../codex-control-workspace/.wakeflow-active/current/test-exchange.md)
- 真实项目保护说明：BiliDili 只作为受保护测试目标，不改业务源码。

## 回填区

- 2026-05-28 14:23 CST：总控完成 Stage 0 跨仓库代码事实基线。结论：AI-MOCK-REMOVAL 接收为 P0 当前主线；PCVM 暂停到 product runtime mock deletion 后恢复；当前不派发，等待用户确认是否启动 Deletion Wave 1。

<!-- workspace-sync
{
  "status": "暂停（AI-MOCK Stage 0 已完成，Deletion Wave 1 待用户确认启动）",
  "indexPlanDescription": "AI-MOCK-REMOVAL-2026-05-28 已完成 Stage 0 跨仓库代码事实基线；Deletion Wave 1 候选为 AlembicAgent + Alembic 删除 product mock provider producer / runtime consumer。",
  "indexStatusDescription": "当前状态切到 AI-MOCK Stage 0 完成：产品 runtime AI mock 删除为 P0 插队项，PCVM 暂停到 mock runtime 删除后恢复。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "AI-MOCK Stage 0 code fact baseline：确认 AlembicAgent / Alembic / Dashboard product mock 入口、历史数据状态和 deletion wave 候选。",
  "currentStatusSummary": "AI-MOCK-REMOVAL-2026-05-28 已接收为当前 P0：Stage 0 代码事实基线完成，下一步建议启动 Deletion Wave 1（AlembicAgent + Alembic），PCVM 暂停等待真实 AI runtime。",
  "indexRows": [
    {
      "type": "AI-MOCK 目标阶段确认",
      "doc": ".wakeflow-active/current/ai-mock-removal-goal-stage-confirmation-2026-05-28.md",
      "status": "Stage 0 已完成 / Wave 1 待确认",
      "description": "用户已确认 Design 推荐方向；总控记录删除产品 runtime AI mock 的完成定义、阶段顺序和第一波候选。"
    },
    {
      "type": "PCVM Wave 4A cold-start baseline",
      "doc": ".wakeflow-active/current/progressive-chain-validation-metrics-wave-4a-cold-start-baseline-2026-05-28.md",
      "status": "暂停",
      "description": "PCVM 暂停到 AI-MOCK 删除产品 mock runtime 后恢复；Wave 4D 已证明 mock path 不能代表真实 N8 / N11 / N12 evidence。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "AI-MOCK 目标阶段确认",
      "doc": ".wakeflow-active/current/ai-mock-removal-goal-stage-confirmation-2026-05-28.md",
      "description": "产品 runtime AI mock 删除的完成定义、阶段顺序和 Deletion Wave 1 候选。"
    },
    {
      "type": "PCVM Wave 4A cold-start baseline",
      "doc": ".wakeflow-active/current/progressive-chain-validation-metrics-wave-4a-cold-start-baseline-2026-05-28.md",
      "description": "暂停到 AI-MOCK 删除后恢复；保留 PCVM 当前事实和后续入口。"
    }
  ]
}
-->
