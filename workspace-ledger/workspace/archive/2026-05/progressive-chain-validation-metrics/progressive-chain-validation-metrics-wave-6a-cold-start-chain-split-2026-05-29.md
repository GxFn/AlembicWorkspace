# Progressive Chain Validation Metrics Wave 6A - Cold-start Chain Split Baseline

日期：2026-05-29
状态：Wave 6A 总控验收通过 / Wave 6B 已裁决
发送给：`Alembic`、`AlembicAgent`
总控定位：本文件是 `GTODO-2026-05-25-003 / Progressive Chain Validation Metrics` 的当前总控计划。Wave 5A/5B/5C 已完成 analyze evidence-through 闭环；本轮使用 PCVM 对 Alembic cold-start 链路做源码事实拆分和节点级指标基线，不做产品实现。

## 目标判断

- 用户目标：使用 PCVM 对 cold-start 链路进行阶段拆分，后续可以对各小阶段隔离优化。
- 最终完成定义：产出一张基于真实源码边界的 cold-start 节点地图，覆盖入口、配置 / intent、discovery、materialization、dimension plan、session/task、stage factory、Agent runtime、analyze、produce、consumer / persistence、finalizer、report/history；每个节点写清 useful unit、输入、上游冻结、下游切断点、证据面、可测指标、现有证据、缺口、第一优化候选和是否 `blocked-by-observability-gap`。
- 当前是否已经达到：未达到。Wave 5C 只完成 analyze grounding ledger 到 scorecard 的消费，不等于完整 cold-start 链路拆分。
- 未达到时剩余差距：需要 Alembic / AlembicAgent 分别补齐自身源码事实边界，再由总控合成统一 PCVM 节点地图。
- 已达到时验收 / 归档判断：本轮达到后不自动进入实现；先由总控裁决第一个可隔离优化点，再决定 Wave 6B 是否派发实现。
- 当前任务分区：分配计划 / 代码事实分析。
- 不纳入本轮事项：不改产品代码；不跑 full cold-start；不做 Dashboard UI；不做 golden set；不修改真实测试项目；不派 `AlembicTest`。

## 总控决策记录

- 本次决策触发：用户确认“使用 PCVM 对冷启动链路拆分，然后各小阶段隔离优化”，并要求启动自动化推进。
- 需求 / 测试结果理解：Wave 5C 证明 analyze grounding 可以进入 scorecard；下一步不是继续局部修 analyze，而是用 PCVM 方法把 cold-start 全链路拆成可隔离、可测量、可优化的节点。
- 已核对证据：当前状态显示 Wave 5C 已验收 / 待归档；PCV canonical source 在 `progressive-chain-validation/`；Workspace PCV bridge 明确 Workspace 拥有状态机，PCV 只提供拆链和节点验证方法。
- 是否需要先验证 / 重新计划 / 用户确认：用户已确认启动本轮；不需要 Design 设计，不需要真实测试。
- 本次允许更新：活跃 Workspace 当前计划、当前状态、TODO / Backlog、VAD 自动化运行态。
- 本次不得更新：`Alembic` / `AlembicAgent` 产品源码、真实测试项目、Dashboard UI、PCV source 方法包。

## Design / 需求来源

- 来源类型：用户直接需求 + PCVM 当前主线延续。
- 来源文档：当前计划承接 [Wave 5A analyze evidence-through](../../../../../codex-control-workspace/.workspace-active/workspace/current/progressive-chain-validation-metrics-wave-5a-analyze-evidence-through-2026-05-29.md)；方法参考 `progressive-chain-validation/progressive-chain-validation/SKILL.md`。
- 用户确认状态：已确认。
- 总控接收结论：接收为 PCVM Wave 6A 当前主线，范围是 cold-start chain split baseline。
- 是否需要目标阶段确认：不需要；属于 `GTODO-2026-05-25-003` 后续阶段内的明确推进。
- 是否需要代码实现依赖调研：需要，且本轮只做代码事实调研和节点拆分。

## 代码事实与边界

- 相关仓库：`Alembic`、`AlembicAgent`。
- 关键入口：
  - `Alembic`：CLI / daemon / bootstrap / rescan / internal dimension execution / report finalizer / PCV scorecard consumer。
  - `AlembicAgent`：Agent runtime、LLM input assembly、exploration tracker、tool policy、PCV grounding ledger、analyze / produce / quality gate 运行边界。
- producer / consumer 依赖：`Alembic` 是 cold-start workflow orchestrator 和 report consumer；`AlembicAgent` 是 LLM / tool / evidence producer；本轮两边只回填源码事实，不产生代码依赖变更。
- 不可提前消费的上游：未合成统一节点地图前，不派任何实现优化，不跑 full cold-start，不开 Dashboard comparison。
- 不允许触碰的目录 / 仓库：不改 `BiliDili`、不改 `AlembicTest`、不改 `AlembicDashboard`、不改 PCV source。
- 真实测试项目是否涉及：不涉及。

## 阶段顺序

1. Wave 6A-1：`Alembic` 拆分 cold-start 编排、状态、持久化和 report 边界。
2. Wave 6A-2：`AlembicAgent` 拆分 Agent runtime、analyze / produce / quality gate 和 evidence ledger 边界。
3. Wave 6A-3：总控合成统一 PCVM cold-start 节点地图，标出第一个可隔离优化候选。

- 下一处真实阻塞点：没有基于真实源码边界的统一 cold-start 节点地图，无法安全选择第一个隔离优化点。
- 阻塞点之前还能做：并行派发 `Alembic` 与 `AlembicAgent` 做只读源码事实拆链。
- 当前可派发窗口：`Alembic`、`AlembicAgent`。
- 当前阻塞 / 观察窗口：`AlembicCore`、`AlembicDashboard`、`AlembicPlugin`、`AlembicDesign`、`AlembicTest`、`BiliDili` 均无任务。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| PCVM-W6A-ALEMBIC-COLDSTART-CHAIN-SPLIT | `Alembic` | 拆分 cold-start 编排 / persistence / report 的源码节点、证据面和指标缺口。 | 总控验收通过 |
| PCVM-W6A-AGENT-RUNTIME-CHAIN-SPLIT | `AlembicAgent` | 拆分 Agent runtime / analyze / produce / quality gate 的源码节点、证据面和指标缺口。 | 总控验收通过 |

### PCVM-W6A-ALEMBIC-COLDSTART-CHAIN-SPLIT：Alembic cold-start orchestration node map

窗口：`Alembic`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 14:30 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 14:30 CST

阶段目标：

- 基于 `Alembic` 真实源码拆出 cold-start 编排链路节点，覆盖 N0 / N1 / N2 / N3 / N4 / N6 / N7 / N8 / N11 / N12 / N13 / N14 及必要 source-derived split。

主线动作：

- 读取 `Alembic/AGENTS.md`、PCV canonical `SKILL.md`、`chain-plan-generation.md`、`metrics-contract.md` 和 Alembic cold-start overlay。
- 从 CLI / daemon / bootstrap / ProjectIntelligence / internal dimension execution / finalizer / report history 真实入口追踪调用链。
- 为每个节点写清 useful unit、源码入口、输入、上游冻结、下游切断点、证据面、现有测试 / report 字段、缺失指标、第一优化候选。
- 标注哪些节点已有 `artifact / trace / metrics / sourceRef / pcvScorecard`，哪些是 `blocked-by-observability-gap`。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不修改产品代码。
- 不跑 full cold-start。
- 不改 `AlembicAgent`。
- 不派 `AlembicTest`。
- 不做 Dashboard UI。

下一处真实阻塞点：

- cold-start orchestrator 的节点切点和 report / scorecard 证据面尚未统一列出。

阻塞点之前还能做：

- 只读扫描代码和现有 tests / reports，输出节点地图和证据缺口。

验证命令：

```text
cd Alembic && git status --short
cd Alembic && rg -n "bootstrap|cold-start|ProjectIntelligence|dimension|pcvScorecard|finalizer|report" lib bin test -S
cd Alembic && git diff --check
```

回填要求：

- 完成范围：只读代码事实拆链。
- 提交 hash：无；若发生代码修改必须说明原因并停止等待总控裁决。
- 验证命令和结果：列出实际运行命令。
- 节点地图：按 PCV node id / source boundary / evidence surface / metric gap / first optimization candidate 回填。
- 遗留风险：哪些节点需要 `AlembicAgent` 回填后才能定稿，哪些节点需要真实 cold-start after-run 才能验证。
- 下一步建议：推荐第一个可隔离优化点。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 `Alembic/AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、`Alembic` 仓库职责、本轮只读拆链职责，以及本仓库明确不承担的职责。
- 若任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担源码事实收集；最终由当前窗口统一复核和回填。

### PCVM-W6A-AGENT-RUNTIME-CHAIN-SPLIT：AlembicAgent runtime node map

窗口：`AlembicAgent`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 14:30 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 14:30 CST

阶段目标：

- 基于 `AlembicAgent` 真实源码拆出 Agent runtime 内部节点，覆盖 LLM input assembly、tool policy、exploration tracker、analyze、quality gate、produce / submit、PCV evidence ledger 和 DeepSeek V4 grounding gate。

主线动作：

- 读取 `AlembicAgent/AGENTS.md`、PCV canonical `SKILL.md`、`chain-plan-generation.md`、`metrics-contract.md` 和 Alembic cold-start overlay。
- 从 `AgentRuntime`、`LoopContext`、`LLMInputAssembly`、`PcvNodeEvidence`、Explorer / Tracker、BootstrapAnalyze / producer tools 追踪运行边界。
- 为每个 Agent-side 节点写清 useful unit、源码入口、输入、上游冻结、下游切断点、证据面、现有 tests、缺失指标、第一优化候选。
- 标注哪些节点已由 Wave 5B / Wave 5C 覆盖，哪些仍需要后续 PCVM 指标。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不修改产品代码。
- 不改 prompt / tool policy。
- 不跑真实 AI / full cold-start。
- 不改 `Alembic` report consumer。
- 不派 `AlembicTest`。

下一处真实阻塞点：

- Agent runtime 内部节点与 Alembic orchestrator 节点的 producer / consumer 切点尚未统一。

阻塞点之前还能做：

- 只读扫描代码和现有 tests，输出 Agent-side 节点地图和证据缺口。

验证命令：

```text
cd AlembicAgent && git status --short
cd AlembicAgent && rg -n "AgentRuntime|LLMInputAssembly|PcvNodeEvidence|ExplorationTracker|BootstrapAnalyze|produce|quality" src test -S
cd AlembicAgent && git diff --check
```

回填要求：

- 完成范围：只读代码事实拆链。
- 提交 hash：无；若发生代码修改必须说明原因并停止等待总控裁决。
- 验证命令和结果：列出实际运行命令。
- 节点地图：按 PCV node id / source boundary / evidence surface / metric gap / first optimization candidate 回填。
- 遗留风险：哪些节点需要 Alembic orchestrator 回填后才能定稿，哪些节点需要 targeted replay 或真实 AI after-run 才能验证。
- 下一步建议：推荐第一个可隔离优化点。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 `AlembicAgent/AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、`AlembicAgent` 仓库职责、本轮只读拆链职责，以及本仓库明确不承担的职责。
- 若任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担源码事实收集；最终由当前窗口统一复核和回填。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-25-003 | Wave 6A 已启动 | agent / llm optimization loop | P0 | PCV source / `Alembic` / `AlembicAgent` / `AlembicTest` | 使用 PCVM 拆分 cold-start 链路，形成节点级 useful unit / evidence surface / metric gap / first optimization candidate。 | 是 | Wave 5A/5B/5C 已完成 analyze evidence-through 闭环。 | `Alembic`、`AlembicAgent` |
| PCVM-W6A-FIRST-OPTIMIZATION-CANDIDATE | 待裁决 | optimization planning | P1 | `AlembicWorkspace` | Wave 6A 回填后，总控选择第一个可隔离优化点；未回填前不得派实现。 | 是 | 依赖 Wave 6A 两个只读拆链回填。 | `AlembicWorkspace` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 主线任务 | 是 | 拆分 cold-start 编排 / persistence / report 节点。 |
| `AlembicCore` | 无任务 | 否 | 本轮不下沉 shared contract。 |
| `AlembicAgent` | 主线任务 | 是 | 拆分 Agent runtime / analyze / produce / quality gate 节点。 |
| `AlembicDashboard` | 无任务 | 否 | 不做 UI / comparison 展示。 |
| `AlembicPlugin` | 无任务 | 否 | 不涉及 Codex host plugin。 |
| `AlembicDesign` | 无任务 | 否 | 用户目标已确认，不需要需求设计。 |
| `AlembicTest` | 无任务 | 否 | 不跑真实项目，不做 full cold-start。 |
| `BiliDili` | 无任务 | 否 | 真实项目只作为受保护测试目标，不直接派发。 |

## 窗口分派

发送给：`Alembic`、`AlembicAgent`

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动 | `PCVM-W6A-ALEMBIC-COLDSTART-CHAIN-SPLIT`：只读拆分 cold-start 编排 / persistence / report 节点。 |
| `AlembicCore`<br>无任务 | 本轮不下沉 shared contract。 |
| `AlembicAgent`<br>待启动 | `PCVM-W6A-AGENT-RUNTIME-CHAIN-SPLIT`：只读拆分 Agent runtime / analyze / produce / quality gate 节点。 |
| `AlembicDashboard`<br>无任务 | 不做 UI。 |
| `AlembicPlugin`<br>无任务 | 不涉及 Plugin。 |
| `AlembicDesign`<br>无任务 | 不需要需求设计。 |
| `AlembicTest`<br>无任务 | 不跑真实项目。 |
| `BiliDili`<br>无任务 | 不触碰真实项目。 |

## 可复制提示词

发送给：`Alembic`、`AlembicAgent`

```text
先读取 AGENTS.md、codex-control-workspace/.workspace-active/workspace/index.md、codex-control-workspace/.workspace-active/workspace/current/progressive-chain-validation-metrics-wave-6a-cold-start-chain-split-2026-05-29.md，以及你所在窗口/目标仓库的 AGENTS.md。

先明确声明当前窗口定位和本轮仓库职责。

再按照文档领取并完成分配给你所在窗口的任务。本轮只做 PCVM cold-start 源码事实拆链，不改产品代码，不跑 full cold-start，不派 AlembicTest。

如果任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担源码事实收集；最终由当前窗口统一复核和回填。

完成后回填：完成范围、提交 hash 或 no-commit 理由、验证命令、节点地图、遗留风险和下一步建议。
```

## 测试交接

- 是否需要 `AlembicTest`：否。
- 总控自测结论：本轮是只读源码事实拆链和指标基线，不依赖真实项目环境。
- 需要真实场景的理由：暂无；只有后续 Wave 6B 选定具体优化点且需要真实 cold-start after-run 时，再判断是否创建测试单。
- 测试前边界与多条件判断：
  - 测试要回答的问题：本轮不启动测试；只回答 cold-start 源码链路如何拆节点、哪些节点已有证据、哪些节点缺观测。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：`Alembic` / `AlembicAgent` 源码事实，非真实项目。
  - 成功能推出的结论：可以形成统一 PCVM 节点地图并选择第一个隔离优化候选。
  - 失败能推出的结论：源码事实不足或节点边界不清，需要补调研 / 补证，不代表产品功能失败。
  - 不能推出的结论：不能推出 full cold-start 已优化、真实项目通过、Dashboard 可视化完成或 N0-N14 全部可测。
  - 停止或不开始条件：若需要修改产品代码、跑真实项目、执行 full cold-start 或改变用户目标，必须停止并回到总控裁决。
- 测试单：无。
- 测试交流入口：[test-exchange.md](../../../../../codex-control-workspace/.workspace-active/workspace/current/test-exchange.md)
- 真实项目保护说明：本轮不触碰真实项目。

## 回填区

- 2026-05-29 14:30 CST：用户确认启动 PCVM cold-start chain split 自动化；总控新建 Wave 6A，只派 `Alembic` 与 `AlembicAgent` 做只读源码事实拆链，不派 `AlembicTest`，不跑 full cold-start。
- 2026-05-29 15:13 CST：总控验收 Wave 6A 通过。`Alembic` 回填为 no source commit，HEAD `1fce35dceaaead89c0fd51c1ef02163b677ff20d`，`rg` / `git diff --check` 复核支持 N0 reset/dataRoot、N1 job entry、N2 intent/config、N3 discovery、N4 materialization/target map、N6 dimension admission、N7 session/dispatch、N8 stage factory/tool policy、N9 Agent analyze consumer、N11 produce consumer、N12 persistence、N13 finalizer、N14 report/history 的 orchestrator / report 节点拆分；不代表 full cold-start 通过。
- 2026-05-29 15:13 CST：`AlembicAgent` 回填为 no source commit，HEAD `284b50516b20d6f90cf74bec892259354ee9bcdd`，`rg` / `git diff --check` 复核支持 A0 runtime-stage-entry、A1 stage-tool-policy、A2 LLM input assembly、A3 analyze evidence burn、A4 quality gate、A5 record repair、A6 produce submit、A7 runtime evidence export、A8 abort / timeout budget 的 Agent-side 节点拆分；不代表真实 AI / full cold-start 通过。
- 2026-05-29 15:13 CST：总控裁决第一个隔离优化点为 `Agent stage -> PCV node identity passthrough`：先让 `AlembicAgent` 支持从 context 读取 stage-to-node 映射并按 analyze / quality_gate / record_repair / produce 阶段写入每轮 `PcvNodeEvidence`、LLM input metadata 和 process event metadata，避免 cold-start 有 canonical N9 / N11 语义时仍退回 `agent:<stage>:<dimension>` 泛化节点。后续再派 `Alembic` 在 bootstrap dimension input 注入该映射；本裁决不改 prompt、不跑 full cold-start、不派 `AlembicTest`。

<!-- workspace-sync
{
  "status": "Wave 6A 已启动 / 发送给 Alembic、AlembicAgent",
  "indexPlanDescription": "PCVM Wave 6A 已启动：使用 PCVM 对 cold-start 链路做源码事实节点拆分，发送给 Alembic 与 AlembicAgent。",
  "indexStatusDescription": "当前状态：PCVM Wave 6A 已启动，等待 Alembic / AlembicAgent 回填 cold-start 节点地图。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "PCVM Wave 6A：cold-start chain split baseline，拆分节点、证据面、指标缺口和第一优化候选。",
  "currentStatusSummary": "PCVM Wave 6A 已启动；当前发送给 Alembic / AlembicAgent 做只读源码事实拆链，暂不实现、不跑 full cold-start、不派 AlembicTest。",
  "indexRows": [
    {
      "type": "PCVM Wave 6A cold-start chain split baseline",
      "doc": ".workspace-active/workspace/current/progressive-chain-validation-metrics-wave-6a-cold-start-chain-split-2026-05-29.md",
      "status": "Wave 6A 已启动 / 发送给 Alembic、AlembicAgent",
      "description": "使用 PCVM 对 cold-start 链路做源码事实节点拆分，等待 Alembic / AlembicAgent 回填。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "PCVM Wave 6A cold-start chain split baseline",
      "doc": ".workspace-active/workspace/current/progressive-chain-validation-metrics-wave-6a-cold-start-chain-split-2026-05-29.md",
      "description": "Cold-start 节点地图、证据面、指标缺口和第一优化候选。"
    }
  ]
}
-->
