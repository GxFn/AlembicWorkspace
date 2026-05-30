# Progressive Chain Validation Metrics Wave 6C - Alembic Stage Node Map Injection

日期：2026-05-29
状态：Wave 6C 总控验收通过 / Wave 6D 待启动
发送给：无
总控定位：本文件是 `GTODO-2026-05-25-003 / Progressive Chain Validation Metrics` 的当前总控计划。Wave 6B 已完成 `AlembicAgent` stage-to-node mapping consumer contract；本轮只让 `Alembic` 在 bootstrap dimension input 中注入 canonical stage node map。

## 目标判断

- 用户目标：使用 PCVM 对 cold-start 链路拆小阶段并逐个隔离优化，让 cold-start analyze 从第一轮 LLM burn 起就携带可度量证据身份。
- 最终完成定义：`Alembic` 在创建 bootstrap dimension `AgentRunInput` 时，向 `AlembicAgent` contract 注入 canonical `pcvStageNodeMap` / `pcvChainNodes`，至少覆盖 analyze / quality_gate / record_repair / produce；targeted tests 证明 Agent child input、N9 / N11 process metadata 或 scorecard consumer 能看到稳定 node identity。
- 当前是否已经达到：已达到本轮完成定义。`Alembic` commit `acd273eca051c569094781f868b0271e91622458` 已生产并注入 canonical `pcvStageNodeMap` / `pcvChainNodes`，targeted tests 和总控复核均通过。
- 未达到时剩余差距：本轮代码侧差距已关闭。后续剩余差距是最小真实 / 默认 AI after-run 是否能在运行时 evidence / report 中看到 N9 / N11 canonical identity。
- 已达到时验收 / 归档判断：Wave 6C 验收通过，不扩大为 full cold-start；下一轮单独规划 Wave 6D 最小 after-run 验证。
- 当前任务分区：代码实现 / targeted unit。
- 不纳入本轮事项：不优化 Agent prompt；不改变 DeepSeek V4 tool policy；不跑 full cold-start；不修改 `AlembicAgent`、`AlembicTest`、Dashboard UI 或真实测试项目。

## 总控决策记录

- 本次决策触发：Wave 6B `AlembicAgent` commit `c70094d0b3841c4fba56a3e155c4fecc14f38086` 已证明 consumer 能优先使用 `pcvStageNodeMap` / `pcvChainNodes`，缺失时保留 fallback。
- 需求 / 测试结果理解：现在第一阻塞点不是 Agent 不能消费，而是 cold-start producer 还没有把 canonical stage node map 从 bootstrap 起点注入每个 dimension run。
- 已核对证据：`Alembic` `BootstrapDimensionRuntimeBuilder.ts` 构造 `systemRunContext` / `strategyContext` 并调用 `buildBootstrapDimensionRunInput`；`BootstrapInputBuilders.ts` 将 `strategyContext`、`sharedState` 和 `promptContext` 写入 `AgentRunInput.context`；`BootstrapPcvNodeLocalEvidence.ts` 已有 `PCV_ANALYZE_GROUNDING_NODE_ID`、`PCV_N11_NODE_ID` 等现有节点常量。
- 是否需要先验证 / 重新计划 / 用户确认：不需要。该实现沿用已验收 contract，不改变用户目标、不删减能力、不涉及真实项目。
- 本次允许更新：`Alembic` 源码和 targeted tests；workspace 当前计划。
- 本次不得更新：`AlembicAgent`、`AlembicTest`、`BiliDili`、Dashboard UI、PCV source。

## 代码事实与边界

- 相关仓库：`Alembic`。
- 关键入口：
  - `lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionRuntimeBuilder.ts`：构造 dimension runtime context / `strategyContext`。
  - `lib/workflows/capabilities/execution/internal-agent/BootstrapInputBuilders.ts`：构造 bootstrap dimension `AgentRunInput`。
  - `lib/workflows/capabilities/execution/internal-agent/BootstrapSessionExecutionBuilder.ts`：存在 lazy / fallback dimension input 构造路径，必须避免只覆盖一条路径。
  - `lib/workflows/capabilities/execution/internal-agent/BootstrapPcvNodeLocalEvidence.ts`：已有 PCV cold-start node-local constants 和 report / scorecard evidence。
  - `test/unit/BootstrapDimensionRuntimeBuilder.test.ts`、`test/unit/BootstrapInputBuilder.test.ts`、`test/unit/BootstrapProcessEvents.test.ts`、`test/unit/InternalDimensionFillFinalizer.test.ts`：现有 targeted coverage 候选。
- producer / consumer 依赖：`Alembic` 是 canonical map producer；`AlembicAgent` 是 map consumer / runtime evidence producer。
- 不可提前消费的下游：本轮不要求 `AlembicTest` 真实 AI after-run；targeted unit 证明注入点和 metadata 消费即可。
- 真实测试项目是否涉及：不涉及。

## 阶段顺序

1. Wave 6C：`Alembic` 注入 bootstrap stage node map，并补 targeted tests。
2. Wave 6D：总控基于 Alembic 回填决定是否做最小 default-AI after-run、或继续下一个 PCVM 隔离优化点。

- 下一处真实阻塞点：bootstrap dimension input 没有 canonical stage node map，Agent evidence 仍只能 fallback 或靠事后 consumer 推断。
- 阻塞点之前还能做：`Alembic` 内用 frozen child input / process event fixture 验证 map 注入和 N9 / N11 metadata 链路。
- 当前可派发窗口：`Alembic`。
- 当前阻塞 / 观察窗口：`AlembicAgent` 观察 consumer contract 已完成；其它窗口无任务。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| PCVM-W6C-ALEMBIC-STAGE-NODE-MAP-INJECTION | `Alembic` | 在 bootstrap dimension input 注入 canonical `pcvStageNodeMap` / `pcvChainNodes`，并验证 N9 / N11 metadata 贯穿。 | 总控验收通过 |

### PCVM-W6C-ALEMBIC-STAGE-NODE-MAP-INJECTION：Bootstrap stage node map injection

窗口：`Alembic`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 16:25 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 17:03 CST

阶段目标：

- 让 `Alembic` 在每个 bootstrap dimension run 启动时，生产并传递 canonical PCV stage node map，使 Agent analyze / quality_gate / record_repair / produce evidence 从生成时就绑定到 cold-start PCVM 节点。

主线动作：

- 读取 `Alembic/AGENTS.md`、本计划和 Wave 6B `AlembicAgent` contract。
- 在 `Alembic` bootstrap orchestration 中设计最小 map producer：优先复用现有 `BootstrapPcvNodeLocalEvidence.ts` 中的 PCV node constants；如果必须新增 quality_gate / record_repair 子阶段 id，必须保证下游 consumer / scorecard 能解释。
- 将 map 注入 `AgentRunInput.context.strategyContext`、`promptContext`、`sharedState` 或当前桥接实际消费的等价位置，确保最终进入 `AlembicAgent` `reactLoop` 的 runtime context。
- 覆盖直接 dimension input 和 session / lazy child input 路径，避免只有一条执行路径带 map。
- 补 targeted tests 证明：
  - child dimension input 中存在 `pcvStageNodeMap` / `pcvChainNodes`；
  - analyze / quality_gate / record_repair / produce 至少 N9 / N11 两类 stage 能映射到稳定 node identity；
  - 现有 N8 / N11 / N12 node-local scorecard 或 process metadata 消费不回退为旧 fallback。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不优化 prompt 文案。
- 不改变 DeepSeek V4 tool policy。
- 不跑真实 AI。
- 不跑 full cold-start。
- 不改 `AlembicAgent` consumer contract。
- 不派 `AlembicTest`。

下一处真实阻塞点：

- 没有 bootstrap map producer，Wave 6B 的 Agent-side contract 无法在真实 cold-start path 中生效。

阻塞点之前还能做：

- 在 `Alembic` 内用 targeted unit / fixture 验证 `AgentRunInput`、process event 和 scorecard consumer。

验证命令：

```text
cd Alembic && git status --short
cd Alembic && npm test -- test/unit/BootstrapDimensionRuntimeBuilder.test.ts test/unit/BootstrapInputBuilder.test.ts test/unit/BootstrapProcessEvents.test.ts test/unit/InternalDimensionFillFinalizer.test.ts
cd Alembic && npm run build:check
cd Alembic && git diff --check
```

回填要求：

- 完成范围：写清 map producer 位置、字段名、覆盖的 stage 和注入路径。
- 提交 hash：必须提供 `Alembic` commit；若无法提交，写清 no-commit 理由。
- 验证命令和结果：列出实际运行命令、通过 / 失败摘要。
- 原始证据：列出关键 diff 文件、测试名、N9 / N11 node identity 断言。
- 遗留风险：哪些内容需要真实 / 默认 AI after-run 或 full cold-start 才能确认。
- 下一步建议：是否需要 Wave 6D 派 `AlembicTest`，或继续下一个 PCVM 隔离优化点。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 `Alembic/AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、`Alembic` 仓库职责、本轮代码实现职责，以及本仓库明确不承担的职责。
- 若任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担源码事实收集或 targeted tests；最终由当前窗口统一复核和回填。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-25-003 | Wave 6C 总控验收通过 / Wave 6D 待启动 | agent / llm optimization loop | P0 | PCV source / `Alembic` / `AlembicAgent` / `AlembicTest` | 使用 PCVM 拆分 cold-start 链路，并从第一个隔离优化点开始补齐每轮 burn 的 canonical evidence identity。 | 是 | Wave 6B `AlembicAgent` stage node identity contract 与 Wave 6C `Alembic` bootstrap map producer 均已通过；下一步需要最小真实 / 默认 AI after-run 验证运行时 evidence。 | `AlembicTest` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 | 否 | `acd273e` 已通过总控验收。 |
| `AlembicCore` | 无任务 | 否 | 本轮不下沉 shared contract。 |
| `AlembicAgent` | 观察中 | 否 | Consumer contract 已完成，等待 `Alembic` 注入后复核。 |
| `AlembicDashboard` | 无任务 | 否 | 不做 UI。 |
| `AlembicPlugin` | 无任务 | 否 | 不涉及 Plugin。 |
| `AlembicDesign` | 无任务 | 否 | 用户目标已确认，不需要需求设计。 |
| `AlembicTest` | 下一轮候选 | 否 | Wave 6D 单独创建最小 after-run 验证，不在本文件继续派发。 |
| `BiliDili` | 无任务 | 否 | 不触碰真实项目。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>总控验收通过 | `PCVM-W6C-ALEMBIC-STAGE-NODE-MAP-INJECTION`：注入 bootstrap stage node map。 |
| `AlembicCore`<br>无任务 | 本轮不下沉 shared contract。 |
| `AlembicAgent`<br>观察中 | 等待 `Alembic` 注入后复核 consumer contract。 |
| `AlembicDashboard`<br>无任务 | 不做 UI。 |
| `AlembicPlugin`<br>无任务 | 不涉及 Plugin。 |
| `AlembicDesign`<br>无任务 | 不需要需求设计。 |
| `AlembicTest`<br>下一轮候选 | Wave 6D 单独派发最小 after-run。 |
| `BiliDili`<br>无任务 | 不触碰真实项目。 |

## 可复制提示词

发送给：无

```text
先读取 AGENTS.md、codex-control-workspace/.workspace-active/workspace/index.md、codex-control-workspace/.workspace-active/workspace/current/progressive-chain-validation-metrics-wave-6c-alembic-stage-node-map-injection-2026-05-29.md，以及你所在窗口/目标仓库的 AGENTS.md。

先明确声明当前窗口定位和本轮仓库职责。

再按照文档领取并完成分配给你所在窗口的任务。本轮只做 Alembic bootstrap canonical stage node map injection，不优化 Agent prompt，不跑真实 AI，不跑 full cold-start，不派 AlembicTest。

如果任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担源码事实收集或 targeted tests；最终由当前窗口统一复核和回填。

完成后回填：完成范围、提交 hash、验证命令、验证结果、关键 diff / 测试断言、遗留风险和下一步建议。
```

## 测试交接

- 是否需要 `AlembicTest`：否。
- 总控自测结论：本轮是 `Alembic` targeted unit / fixture，可由源码仓库完成。
- 需要真实场景的理由：暂无；targeted consumer 验证通过后，再判断是否需要真实 / 默认 AI after-run。
- 测试前边界与多条件判断：
  - 测试要回答的问题：Alembic bootstrap input 是否把 canonical stage node map 注入到 Agent side contract 可消费的位置。
  - 成功能推出的结论：cold-start producer path 已具备 canonical node identity 注入能力，可裁决是否进入 after-run 或下一优化点。
  - 失败能推出的结论：Alembic bootstrap map producer 不成立，需要源码返工；不能推出 Agent consumer contract 失败。
  - 不能推出的结论：不能推出 full cold-start、真实 AI 或最终 scorecard 已通过。
  - 停止条件：若需要真实 AI / full cold-start / `AlembicTest`，停止并回总控。
- 测试单：无。

## 回填区

- 2026-05-29 16:25 CST：总控基于 Wave 6B 回填裁决 Wave 6C：派 `Alembic` 注入 bootstrap stage node map。此轮不派 `AlembicAgent`，避免 consumer contract 已完成后重复返工。
- 2026-05-29 17:03 CST：`Alembic` 窗口完成 `PCVM-W6C-ALEMBIC-STAGE-NODE-MAP-INJECTION`，提交 `acd273eca051c569094781f868b0271e91622458`（`feat: inject bootstrap pcv stage node map`）。
  - 完成范围：在 `BootstrapPcvNodeLocalEvidence.ts` 新增 `PCVBootstrapStageNodeMap` producer，覆盖 `analyze` -> `pcvm:n9:analyze` / `pcvm:cold-start:n9`、`quality_gate` -> `pcvm:n9:quality_gate` / `pcvm:cold-start:n9:quality`、`record_repair` -> `pcvm:n9:record_repair` / `pcvm:cold-start:n9:repair`、`produce` -> `pcvm:n11:produce` / `pcvm:cold-start:n11`。注入路径覆盖 `AgentRunInput.message.metadata.context`、`context.pcvStageNodeMap` / `context.pcvChainNodes`、`context.strategyContext`、`context.promptContext`、`context.sharedState`、`sharedState._pcvStageNodeMap` / `_pcvChainNodes`，并覆盖 session planned child input 与 lazy runtime child input。
  - 关键 diff：`BootstrapDimensionRuntimeBuilder.ts` 在 system run context sharedState / extraFields 注入 canonical map；`BootstrapInputBuilders.ts` 在直接 dimension run input 注入 map；`BootstrapSessionExecutionBuilder.ts` 在 planned child 与 lazy child runtime path 注入 map；`BootstrapProcessEvents.ts` 在 dimension input process event text / metadata 投影 `pcvStageNodeMap` / `pcvChainNodes`；单测补充 `BootstrapDimensionRuntimeBuilder.test.ts`、`BootstrapInputBuilder.test.ts`、`BootstrapProcessEvents.test.ts`、`BootstrapSessionExecutionBuilder.test.ts`。
  - 关键测试断言：direct dimension input、session child planned input、lazy runtime input、process event metadata 均断言 N9/N11 canonical identity；`quality_gate` 和 `record_repair` 断言稳定 N9 子阶段 chainNodeId；`InternalDimensionFillFinalizer.test.ts` 保持通过，说明现有 node-local scorecard/finalizer 基线未被破坏。
  - 验证命令与结果：
    - `cd Alembic && npm run build`：通过，用于同步本地构建产物供 package imports 测试读取。
    - `cd Alembic && npm test -- test/unit/BootstrapDimensionRuntimeBuilder.test.ts test/unit/BootstrapInputBuilder.test.ts test/unit/BootstrapProcessEvents.test.ts test/unit/InternalDimensionFillFinalizer.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts`：通过，5 files / 25 tests。
    - `cd Alembic && npm run build:check`：通过。
    - `cd Alembic && git diff --check`：通过。
    - `cd Alembic && git status --short --branch`：`## main...origin/main [ahead 1]`，提交后工作区干净。
  - 遗留风险：本轮未跑真实 AI、未跑 full cold-start、未派 `AlembicTest`，因此只能证明 Alembic bootstrap producer/input/event contract 成立；不能推出真实 provider after-run 或完整 cold-start scorecard 终态已通过。
  - 下一步建议：总控可先复核 commit `acd273e` 的 targeted evidence；若需要验证 Agent consumer 在真实 runtime event 中产出 N9/N11 canonical evidence，再单独规划 after-run / `AlembicTest`，不要把本轮源码 producer 验收扩大成 full cold-start 验收。
- 2026-05-29 17:13 CST：总控验收 `Alembic` Wave 6C 通过。
  - 复核提交：`acd273eca051c569094781f868b0271e91622458`，`git status --short --branch` 为 `## main...origin/main [ahead 1]`，工作区干净。
  - 复核代码事实：`BootstrapPcvNodeLocalEvidence.ts` 新增 canonical `PCVBootstrapStageNodeMap`，覆盖 `analyze` / `quality_gate` / `record_repair` / `produce`；`BootstrapInputBuilders.ts`、`BootstrapSessionExecutionBuilder.ts` 覆盖 direct dimension input、planned child input 与 lazy runtime child input；`BootstrapProcessEvents.ts` 可把 `pcvStageNodeMap` / `pcvChainNodes` 投影到 dimension input process event content / metadata。
  - 复核验证：`npm test -- test/unit/BootstrapDimensionRuntimeBuilder.test.ts test/unit/BootstrapInputBuilder.test.ts test/unit/BootstrapProcessEvents.test.ts test/unit/InternalDimensionFillFinalizer.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts` 通过，5 files / 25 tests；`npm run build:check` 通过；`git diff --check` 通过。
  - 总控裁决：Wave 6C 接受。该结论证明 bootstrap producer/input/event contract 成立；不证明真实 / 默认 AI after-run 已经在 report 中产出 canonical N9 / N11 runtime evidence。
  - 下一步：创建 Wave 6D 最小真实 / 默认 AI after-run 验证，交 `AlembicTest` 回答运行时 evidence 是否消费 Wave 6B + Wave 6C 的 canonical node identity。

<!-- workspace-sync
{
  "status": "Wave 6C 总控验收通过 / Wave 6D 待启动",
  "indexPlanDescription": "PCVM Wave 6C 总控验收通过：Alembic 已在 bootstrap dimension input 注入 canonical stage node map。",
  "indexStatusDescription": "当前状态：PCVM Wave 6C 已验收；下一步准备 Wave 6D 最小真实 / 默认 AI after-run 验证。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "PCVM Wave 6C：Alembic bootstrap stage node map injection。",
  "currentStatusSummary": "PCVM Wave 6C Alembic canonical pcvStageNodeMap / pcvChainNodes 注入已通过总控验收；下一步只做最小 after-run 验证，不跑 full cold-start。",
  "indexRows": [
    {
      "type": "PCVM Wave 6C Alembic stage node map injection",
      "doc": ".workspace-active/workspace/current/progressive-chain-validation-metrics-wave-6c-alembic-stage-node-map-injection-2026-05-29.md",
      "status": "Wave 6C 总控验收通过",
      "description": "Alembic commit acd273e 已在 bootstrap dimension input 注入 canonical stage node map，并通过 targeted tests 与总控复核。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "PCVM Wave 6C Alembic stage node map injection",
      "doc": ".workspace-active/workspace/current/progressive-chain-validation-metrics-wave-6c-alembic-stage-node-map-injection-2026-05-29.md",
      "description": "Bootstrap stage node map injection，补齐真实 cold-start producer 入口。"
    }
  ]
}
-->
