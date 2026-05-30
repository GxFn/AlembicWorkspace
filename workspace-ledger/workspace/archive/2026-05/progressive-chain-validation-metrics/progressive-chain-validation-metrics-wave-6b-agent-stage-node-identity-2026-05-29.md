# Progressive Chain Validation Metrics Wave 6B - Agent Stage Node Identity

日期：2026-05-29
状态：Wave 6B 总控验收通过 / Wave 6C 已裁决
发送给：`AlembicAgent`
总控定位：本文件是 `GTODO-2026-05-25-003 / Progressive Chain Validation Metrics` 的当前总控计划。Wave 6A 已完成 cold-start chain split baseline；本轮只做第一个隔离优化点：Agent stage 到 PCV node identity 的稳定贯穿。

## 目标判断

- 用户目标：使用 PCVM 对 cold-start 链路拆小阶段并逐个隔离优化。
- 最终完成定义：cold-start analyze / quality_gate / record_repair / produce 等 Agent stage 在收到上游 PCV stage node map 后，能把 canonical `pcvNodeId` / `chainNodeId` 贯穿到每轮 `PcvNodeEvidence`、LLM input metadata 和 process event metadata；没有上游映射时保留现有 fallback，不破坏普通 Agent runtime。
- 当前是否已经达到：Wave 6B 目标已达到。`AlembicAgent` commit `c70094d0b3841c4fba56a3e155c4fecc14f38086` 已实现 stage-to-node mapping 消费，并通过 targeted tests / build check。
- 未达到时剩余差距：本轮无剩余差距；主线剩余差距转入 Wave 6C，由 `Alembic` 在 bootstrap dimension input 注入 canonical map。
- 已达到时验收 / 归档判断：本轮验收通过；不跑 full cold-start，不派 `AlembicTest`。下一轮派 `Alembic` 注入 map，并做 targeted consumer / report 验证。
- 当前任务分区：代码实现 / targeted unit。
- 不纳入本轮事项：不优化 prompt；不改变 tool policy；不跑真实 AI；不跑 full cold-start；不修改 `Alembic`、`AlembicTest` 或真实测试项目。

## 总控决策记录

- 本次决策触发：Wave 6A 回填已通过总控验收，且两个窗口共同指向同一个第一缺口：Agent evidence 需要稳定绑定 cold-start canonical node id，而不是只依赖 fallback 或事后 consumer 推断。
- 需求 / 测试结果理解：用户强调的问题是 cold-start analyze 从第一轮 LLM burn 开始就要求证据；这要求每轮 burn 有明确 node identity，否则后续 scorecard 只能事后补筛。
- 已核对证据：`AlembicAgent` `PcvNodeEvidence` 已读取 `ctx.context.pcvNodeId` / `ctx.context.chainNodeId` 并生成 fallback；`PipelineStrategy` 已按 stage 写入 `pipelinePhase`；`Alembic` bootstrap child input 已有 `promptContext` / dimension context，可在下一轮传入 canonical map。
- 是否需要先验证 / 重新计划 / 用户确认：不需要。该实现不改变用户目标、不删减能力、不涉及真实项目。
- 本次允许更新：`AlembicAgent` 源码和 targeted tests；workspace 当前计划 / VAD 本地运行态。
- 本次不得更新：`Alembic`、`AlembicTest`、`BiliDili`、Dashboard UI、PCV source。

## 代码事实与边界

- 相关仓库：`AlembicAgent`。
- 关键入口：
  - `src/agent/runtime/PcvNodeEvidence.ts`：创建 node identity、summary、process metadata。
  - `src/agent/strategies/PipelineStrategy.ts`：按 stage 构造 runtime context / `pipelinePhase`。
  - `src/agent/runtime/LLMInputAssembly.ts` 与 `src/agent/runtime/AgentRuntime.ts`：每轮 LLM input / output / tool result 证据记录。
  - `test/evidence-recording-phase-chain.test.ts`、`test/llm-input-layering.test.ts`：现有 evidence / input 层验证。
- producer / consumer 依赖：`AlembicAgent` 是 stage node mapping 的 consumer / runtime evidence producer；`Alembic` 后续是 canonical map producer。
- 不可提前消费的上游：`Alembic` 还未注入 bootstrap canonical map，因此本轮必须用 targeted fixture 验证 contract，不得声称 full cold-start 已贯穿。
- 真实测试项目是否涉及：不涉及。

## 阶段顺序

1. Wave 6B：`AlembicAgent` 实现 stage-to-node mapping 消费和 targeted tests。
2. Wave 6C：`Alembic` 在 bootstrap dimension input 注入 canonical stage node map，并验证 N9 / N11 process metadata。
3. Wave 6D：总控裁决是否需要 `AlembicTest` 做真实 / 默认 AI after-run；未到该阶段不派 Test。

- 下一处真实阻塞点：Agent runtime 没有 stage-aware canonical PCV node identity contract，Alembic 无法安全注入每轮证据节点。
- 阻塞点之前还能做：`AlembicAgent` 内部用 fixture 实现并验证 mapping 消费。
- 当前可派发窗口：`AlembicAgent`。
- 当前阻塞 / 观察窗口：`Alembic` 观察后续 consumer 注入；其它窗口无任务。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| PCVM-W6B-AGENT-STAGE-NODE-IDENTITY | `AlembicAgent` | 实现 Agent stage 到 canonical PCV node id / chain node id 的映射消费，并补 targeted tests。 | 总控验收通过 |

### PCVM-W6B-AGENT-STAGE-NODE-IDENTITY：Agent stage node identity passthrough

窗口：`AlembicAgent`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 15:15 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 16:25 CST

阶段目标：

- 让 `AlembicAgent` 在每个 stage / burn 生成 PCV evidence 时，优先使用上游传入的 stage-to-node mapping；没有 mapping 时保留现有 fallback。

主线动作：

- 读取 `AlembicAgent/AGENTS.md`、本计划和 PCV canonical skill。
- 设计最小 contract：例如 `context.pcvStageNodeMap` / `context.pcvChainNodes` 中按 `analyze`、`quality_gate`、`record_repair`、`produce` 提供 `{ pcvNodeId, chainNodeId }`；字段命名以现有 `PcvNodeEvidence` / runtime context 风格为准。
- 修改 `PcvNodeEvidence` / runtime stage context 的最小代码，让当前 stage 优先取 mapping 中的 node identity，再退回 `ctx.context.pcvNodeId` / `nodeId` / fallback。
- 确保 LLM input metadata、process event metadata 和 quality artifact evidence 使用一致 node identity。
- 补 targeted tests 覆盖 analyze、quality_gate / record_repair、produce 至少两个 stage 的 canonical node id 贯穿，以及无 mapping 时 fallback 不变。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不优化 prompt 文案。
- 不改变 DeepSeek V4 tool policy。
- 不跑真实 AI。
- 不跑 full cold-start。
- 不改 `Alembic` bootstrap input。
- 不派 `AlembicTest`。

下一处真实阻塞点：

- 没有 stage-aware canonical PCV node identity，后续每轮 burn 证据仍可能无法从起点绑定到 cold-start PCVM 节点。

阻塞点之前还能做：

- 在 `AlembicAgent` 内用 frozen runtime / pipeline fixture 验证 mapping 消费。

验证命令：

```text
cd AlembicAgent && git status --short
cd AlembicAgent && npm test -- test/evidence-recording-phase-chain.test.ts test/llm-input-layering.test.ts
cd AlembicAgent && git diff --check
```

回填要求：

- 完成范围：写清 contract 字段、消费位置和覆盖的 stage。
- 提交 hash：必须提供 `AlembicAgent` commit；若无法提交，写清 no-commit 理由。
- 验证命令和结果：列出实际运行命令、通过 / 失败摘要。
- 原始证据：列出关键 diff 文件、测试名、node id 贯穿断言。
- 遗留风险：哪些内容需要 `Alembic` Wave 6C 注入 map 后才能确认。
- 下一步建议：是否可以派 `Alembic` 注入 bootstrap dimension stage node map。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 `AlembicAgent/AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、`AlembicAgent` 仓库职责、本轮代码实现职责，以及本仓库明确不承担的职责。
- 若任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担源码事实收集或 targeted tests；最终由当前窗口统一复核和回填。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-25-003 | Wave 6C 已裁决 | agent / llm optimization loop | P0 | PCV source / `Alembic` / `AlembicAgent` / `AlembicTest` | 使用 PCVM 拆分 cold-start 链路，并从第一个隔离优化点开始补齐每轮 burn 的 canonical evidence identity。 | 是 | Wave 6B `AlembicAgent` stage node identity contract 已通过总控验收。 | `Alembic` |
| PCVM-W6C-ALEMBIC-STAGE-NODE-MAP-INJECTION | 待上游 | bootstrap orchestration evidence | P1 | `Alembic` | 在 `AlembicAgent` contract 完成后，`Alembic` bootstrap dimension input 注入 canonical stage node map。 | 是 | 依赖 Wave 6B `AlembicAgent` contract 和 tests。 | `Alembic` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 观察中 | 否 | 等待 `AlembicAgent` stage node identity contract 后再注入 bootstrap map。 |
| `AlembicCore` | 无任务 | 否 | 本轮不下沉 shared contract。 |
| `AlembicAgent` | 主线任务 | 是 | 实现 canonical stage node identity passthrough。 |
| `AlembicDashboard` | 无任务 | 否 | 不做 UI。 |
| `AlembicPlugin` | 无任务 | 否 | 不涉及 Plugin。 |
| `AlembicDesign` | 无任务 | 否 | 用户目标已确认，不需要需求设计。 |
| `AlembicTest` | 无任务 | 否 | 不跑真实项目，不做 full cold-start。 |
| `BiliDili` | 无任务 | 否 | 不触碰真实项目。 |

## 窗口分派

发送给：`AlembicAgent`

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 等待 Wave 6B 上游 contract。 |
| `AlembicCore`<br>无任务 | 本轮不下沉 shared contract。 |
| `AlembicAgent`<br>待启动 | `PCVM-W6B-AGENT-STAGE-NODE-IDENTITY`：实现 canonical stage node identity passthrough。 |
| `AlembicDashboard`<br>无任务 | 不做 UI。 |
| `AlembicPlugin`<br>无任务 | 不涉及 Plugin。 |
| `AlembicDesign`<br>无任务 | 不需要需求设计。 |
| `AlembicTest`<br>无任务 | 不跑真实项目。 |
| `BiliDili`<br>无任务 | 不触碰真实项目。 |

## 可复制提示词

发送给：`AlembicAgent`

```text
先读取 AGENTS.md、codex-control-workspace/.workspace-active/workspace/index.md、codex-control-workspace/.workspace-active/workspace/current/progressive-chain-validation-metrics-wave-6b-agent-stage-node-identity-2026-05-29.md，以及你所在窗口/目标仓库的 AGENTS.md。

先明确声明当前窗口定位和本轮仓库职责。

再按照文档领取并完成分配给你所在窗口的任务。本轮只做 AlembicAgent canonical stage node identity passthrough，不优化 prompt，不跑真实 AI，不跑 full cold-start，不派 AlembicTest。

如果任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担源码事实收集或 targeted tests；最终由当前窗口统一复核和回填。

完成后回填：完成范围、提交 hash、验证命令、验证结果、关键 diff / 测试断言、遗留风险和下一步建议。
```

## 测试交接

- 是否需要 `AlembicTest`：否。
- 总控自测结论：本轮是 `AlembicAgent` targeted unit / fixture，可由源码仓库完成。
- 需要真实场景的理由：暂无；`Alembic` 注入 map 和 targeted consumer 验证通过后，再判断是否需要真实 / 默认 AI after-run。
- 测试前边界与多条件判断：
  - 测试要回答的问题：stage-to-node mapping 是否在 Agent runtime 内被一致消费。
  - 成功能推出的结论：Agent side contract 可用，可派 `Alembic` 注入 canonical map。
  - 失败能推出的结论：Agent side contract 不成立，需要源码返工；不能推出 cold-start 全链路失败。
  - 不能推出的结论：不能推出 full cold-start、真实 AI 或 report scorecard 已经通过。
  - 停止条件：若需要真实 AI / full cold-start / `Alembic` 修改，停止并回总控。
- 测试单：无。

## 回填区

- 2026-05-29 15:15 CST：总控基于 Wave 6A 回填裁决 Wave 6B：先派 `AlembicAgent` 实现 stage-aware canonical PCV node identity contract。此轮不派 `Alembic`，避免在 consumer contract 未定前提前注入 map。
- 2026-05-29 16:15 CST：`AlembicAgent` 完成 `PCVM-W6B-AGENT-STAGE-NODE-IDENTITY`。
  - 完成范围：新增 Agent-side stage node identity contract，支持 `context.pcvStageNodeMap` / `context.pcvChainNodes` / `context.stageNodeMap` 以及 `sharedState._pcvStageNodeMap` / `_pcvChainNodes` / `pcvStageNodeMap` / `pcvChainNodes` 中按 `analyze`、`quality_gate`、`record_repair`、`produce` 等 stage key 提供 `{ pcvNodeId, chainNodeId }` 或字符串 node id；`createPcvNodeEvidence` 优先消费 canonical node identity，缺失时保留既有 `context.pcvNodeId` / `nodeId` / `stageNodeId` / fallback；`PipelineStrategy` 将上游 map 传入每个 stage 的 runtime context；`insightGateEvaluator` / `buildPcvQualityGateEvidence` 在 quality gate evidence clone 后应用 `quality_gate` canonical identity；runtime public export 暴露 `PcvStageNodeIdentity` / `PcvStageNodeMap` / `ResolvedPcvStageNodeIdentity` / `resolvePcvStageNodeIdentity`。
  - 提交 hash：`AlembicAgent` `c70094d0b3841c4fba56a3e155c4fecc14f38086`。
  - 验证命令：`cd AlembicAgent && git status --short`；结果：提交后 clean。
  - 验证命令：`cd AlembicAgent && npm test -- test/evidence-recording-phase-chain.test.ts test/llm-input-layering.test.ts`；结果：通过，2 files / 19 tests passed。
  - 验证命令：`cd AlembicAgent && npm run build:check`；结果：通过，`tsc -p tsconfig.json --noEmit` 无错误。
  - 验证命令：`cd AlembicAgent && git diff --check`；结果：通过，无 whitespace error。
  - 额外验证命令：`cd AlembicAgent && ./node_modules/.bin/biome check src/agent/runtime/PcvNodeEvidence.ts src/agent/strategies/PipelineStrategy.ts src/agent/prompts/insight-gate.ts src/agent/runtime/index.ts test/evidence-recording-phase-chain.test.ts test/llm-input-layering.test.ts`；结果：通过，6 files checked。
  - 关键 diff / 测试断言：`src/agent/runtime/PcvNodeEvidence.ts` 新增 map resolver 并让 `PcvNodeEvidence` / quality gate evidence 优先使用 canonical `nodeId` / `chainNodeId`；`src/agent/strategies/PipelineStrategy.ts` 验证每个 stage context 保留同一 `pcvStageNodeMap`；`test/llm-input-layering.test.ts` 断言 analyze `llm.input.metadata.pcvNodeEvidence.nodeId === pcvm:n9:analyze`、`chainNodeId === pcvm:cold-start:n9`，producer 断言 `pcvm:n11:produce` / `pcvm:cold-start:n11`；`test/evidence-recording-phase-chain.test.ts` 断言 quality gate evidence / artifact metadata 使用 `pcvm:n9:quality_gate` / `pcvm:cold-start:n9:quality`，record repair / produce stage context 不丢 map。
  - 遗留风险：本轮只验证 AlembicAgent frozen runtime / pipeline fixture；未跑真实 AI、未跑 full cold-start、未派 `AlembicTest`。真实 cold-start N9 / N11 process metadata 仍需 `Alembic` Wave 6C 在 bootstrap dimension input 注入 canonical stage node map 后复核。
  - 下一步建议：可以派 `Alembic` 承接 `PCVM-W6C-ALEMBIC-STAGE-NODE-MAP-INJECTION`，在 bootstrap orchestration 中生成并注入 `pcvStageNodeMap` / `pcvChainNodes`，再用最小 cold-start fixture 验证 N9 / N11 process metadata。
- 2026-05-29 16:25 CST：总控验收 Wave 6B 通过。
  - 原始证据复核：`AlembicAgent` HEAD 为 `c70094d0b3841c4fba56a3e155c4fecc14f38086`，提交文件范围为 `PcvNodeEvidence.ts`、`PipelineStrategy.ts`、`insight-gate.ts`、runtime export 和两份 targeted tests；工作树 clean。
  - 总控复跑：`npm test -- test/evidence-recording-phase-chain.test.ts test/llm-input-layering.test.ts` 通过，2 files / 19 tests passed；`npm run build:check` 通过；`git diff --check` 通过；目标文件 `biome check` 通过。
  - 总控裁决：Wave 6B 只证明 Agent side consumer contract 可用；不能推出 full cold-start 已贯穿。下一步进入 Wave 6C，派 `Alembic` 注入 bootstrap dimension stage node map。

<!-- workspace-sync
{
  "status": "Wave 6B 总控验收通过 / Wave 6C 已裁决",
  "indexPlanDescription": "PCVM Wave 6B 已验收：AlembicAgent 已完成 Agent stage 到 canonical PCV node identity 的稳定贯穿；下一步派 Alembic 注入 bootstrap map。",
  "indexStatusDescription": "当前状态：PCVM Wave 6B 已验收，Wave 6C 已裁决，下一步发送给 Alembic。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "PCVM Wave 6B：Agent stage node identity passthrough，先补每轮 burn 的 canonical evidence identity。",
  "currentStatusSummary": "PCVM Wave 6B 已启动；当前只发送给 AlembicAgent，实现 stage-to-node mapping 消费和 targeted tests；暂不派 AlembicTest，不跑 full cold-start。",
  "indexRows": [
    {
      "type": "PCVM Wave 6B Agent stage node identity",
      "doc": ".workspace-active/workspace/current/progressive-chain-validation-metrics-wave-6b-agent-stage-node-identity-2026-05-29.md",
      "status": "Wave 6B 总控验收通过 / Wave 6C 已裁决",
      "description": "AlembicAgent 已支持 canonical stage node identity passthrough；下一步派 Alembic 注入 bootstrap map。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "PCVM Wave 6B Agent stage node identity",
      "doc": ".workspace-active/workspace/current/progressive-chain-validation-metrics-wave-6b-agent-stage-node-identity-2026-05-29.md",
      "description": "Agent stage node identity passthrough，补齐每轮 burn 的 canonical evidence identity。"
    }
  ]
}
-->
