# Progressive Chain Validation Metrics Goal Stage Confirmation

日期：2026-05-25
状态：已确认：进入 PCV source Wave 0
发送给：无
总控定位：本文件是 `GTODO-2026-05-25-003 / Progressive Chain Validation Metrics` 的当前总控入口；当前只做 Design handoff 接收、代码事实确认、最终完成定义和阶段顺序确认，不直接承载产品实现。

<!-- workspace-sync
{
  "status": "已确认：进入 PCV source Wave 0",
  "indexPlanDescription": "`GTODO-2026-05-25-003` 已提升为新主线目标确认；当前发现 PCV skill 是 Alembic / Plugin 共用 submodule，需先确认 canonical source 和同步路线，发送给无。",
  "indexStatusDescription": "PCVM 新主线目标阶段确认中；当前无可发送窗口，等待用户确认 PCV canonical source / submodule 同步路线。",
  "currentIndexType": "当前目标阶段确认",
  "currentIndexDescription": "`GTODO-2026-05-25-003 / Progressive Chain Validation Metrics` 目标、完成定义、阶段顺序和窗口覆盖确认。",
  "indexRows": [
    {
      "type": "PCVM 代码实现依赖调研",
      "doc": "docs/requirement-designs/progressive-chain-validation-metrics/code-implementation-dependency-research-2026-05-25.md",
      "status": "已完成",
      "description": "基于 PCV 独立 skill repo、Alembic / Plugin submodule、artifact / trace / metrics、AlembicAgent N9 analyze 和 AlembicTest probe 入口确认第一波 producer / consumer 顺序。"
    },
    {
      "type": "Design Handoff Inbox",
      "doc": "docs/workspace/current/design-handoff-inbox.md",
      "status": "维护中",
      "description": "总控脚本从 `workspace-ledger/AlembicDesign/workspace-handoff-board.md` 生成；`PCVM-2026-05-25` 已被接收进入目标阶段确认。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "PCVM 代码实现依赖调研",
      "doc": "docs/requirement-designs/progressive-chain-validation-metrics/code-implementation-dependency-research-2026-05-25.md",
      "description": "支撑 PCVM 目标阶段确认的本地代码事实、边界和 producer / consumer 顺序。"
    }
  ]
}
-->

## 目标判断

- 用户目标：开始推进 `GTODO-2026-05-25-003 / Progressive Chain Validation Metrics`，把 cold-start / rescan 拆成可停止、可复验的节点链，并用 baseline、artifact、trace 和 metrics 反向优化 Agent / LLM 输入输出。
- 最终完成定义：PCV 支持节点级 baseline、scorecard、before / after comparison、verdict 和可复验证据；N9 analyze quality 有真实 baseline；AlembicTest 能按 PCV 默认入口验证长链；后续 Agent 优化能基于同 fixture 做前后对比。
- 当前是否已经达到：未达到。已有 artifact / trace / metrics 和 Design handoff，但 PCV scorecard / baseline / comparison 方法、模板和测试消费链还没有闭合。
- 未达到时剩余差距：先确认 PCV canonical source / submodule 同步路线；再在独立 `progressive-chain-validation` skill source 中开发 PCV 方法和模板；再更新 `Alembic` 与 `AlembicPlugin` 的 submodule 引用和消费测试；随后由 `AlembicTest` 消费验证；最后才进入 Agent 优化。
- 已达到时验收 / 归档判断：当前不适用。
- 当前任务分区：Design 交接接收 + 代码事实分析 + 目标阶段确认。
- 不纳入本轮事项：Dashboard comparison UI、真实 Agent prompt/runtime 优化、全局 aggregate score、Core schema 下沉、简单局部测试强制 PCV。

## Design / 需求来源

- 来源类型：AlembicDesign handoff + TODO 提升。
- 来源文档：
  - [Progressive Chain Validation Metrics 原始计划](../../../../requirement-designs/progressive-chain-validation-metrics/progressive-chain-validation-metrics-original-plan-2026-05-25.md)
  - [Progressive Chain Validation Metrics 需求设计](../../../../requirement-designs/progressive-chain-validation-metrics/progressive-chain-validation-metrics-requirement-design-2026-05-25.md)
  - [Design Handoff Inbox](../../../../../codex-control-workspace/.workspace-active/workspace/current/design-handoff-inbox.md)
  - [代码实现依赖调研](../../../../requirement-designs/progressive-chain-validation-metrics/code-implementation-dependency-research-2026-05-25.md)
- 用户确认状态：Design 侧记录为用户已确认；用户已在总控确认 PCV 单独拉出，并要求后续修改 / 删除 `Alembic` 与 `AlembicPlugin` 内部引入。
- 总控接收结论：接收 `PCVM-2026-05-25`，并入 `GTODO-2026-05-25-003`；该 TODO 从“下一主线候选”提升为“目标阶段确认中”。
- 是否需要目标阶段确认：需要。该需求影响 `Alembic`、`AlembicAgent`、`AlembicTest` 的 producer / consumer 顺序，且会成为后续 Agent 优化主线的验证基座。
- 是否需要代码实现依赖调研：已完成，见上方代码调研文档。

## 代码事实与边界

- 相关仓库：独立 `progressive-chain-validation` skill repo、`Alembic`、`AlembicPlugin`、`AlembicAgent`、`AlembicTest`；`AlembicCore` 观察；`AlembicDashboard` 第一版无任务。
- 关键入口：
  - `progressive-chain-validation` source repo：`https://github.com/GxFn/progressive-chain-validation.git`
  - `Alembic/skills/progressive-chain-validation/progressive-chain-validation/SKILL.md`
  - `AlembicPlugin/skills/progressive-chain-validation/progressive-chain-validation/SKILL.md`
  - `Alembic/skills/progressive-chain-validation/progressive-chain-validation/references/chain-plan-generation.md`
  - `Alembic/skills/progressive-chain-validation/progressive-chain-validation/references/overlays/alembic-coldstart-rescan.md`
  - `Alembic/skills/progressive-chain-validation/progressive-chain-validation/templates/plan.md`
  - `Alembic/test/unit/progressive-chain-validation-skill.test.ts`
  - `AlembicPlugin/test/unit/progressive-chain-validation-skill.test.ts`
  - `Alembic/lib/daemon/DaemonJobRunner.ts`
  - `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts`
  - `AlembicAgent/src/agent/prompts/scan-prompts.ts`
  - `AlembicAgent/src/agent/prompts/insight-gate.ts`
  - `AlembicAgent/src/agent/runtime/AgentRuntime.ts`
  - `AlembicTest/scripts/README.md`
- submodule 事实：`Alembic/skills/progressive-chain-validation` 与 `AlembicPlugin/skills/progressive-chain-validation` 都指向 `GxFn/progressive-chain-validation.git`，当前均在 `a6c371c8b123fc79f218d362cd6bae61a0679d61`，两份 checkout 内容一致；该 commit 是 `2026-05-10 23:35:42 +0800 Create progressive chain validation skill`。
- producer / consumer 依赖：独立 `progressive-chain-validation` skill repo 先产出 PCV scorecard / baseline / comparison 方法和 N9 baseline 报告格式；`Alembic` 与 `AlembicPlugin` 只更新 submodule 引用和消费测试；`AlembicTest` 后消费并验证；`AlembicAgent` 后续优化必须等待 baseline / comparison format 稳定。
- 不可提前消费的上游：`AlembicTest` 不能在 PCV 计分契约和模板缺失时猜字段；`AlembicAgent` 不能在 baseline 未形成时先改 prompt/runtime。
- 不允许触碰的目录 / 仓库：不在 `Alembic` 或 `AlembicPlugin` 父仓库里直接制造分叉版 skill 内容；不改真实测试项目源码；第一版不改 `AlembicDashboard` UI；不在 workspace 根目录做产品实现。
- 真实测试项目是否涉及：第一波不直接涉及；第二波由 `AlembicTest` 决定 test-mode / runtime fixture 或真实项目入口。

## 阶段顺序

1. 目标阶段确认：确认最终完成定义、非目标、窗口覆盖、PCV canonical source 和 producer / consumer 顺序。当前阶段。
2. Wave 0 / `AlembicPlugin` window, PCV source target：在 `AlembicPlugin/skills/progressive-chain-validation` 这个独立 skill source checkout 中补 PCV skill、overlay、plan template、scorecard / baseline / comparison 输出格式；用 N9 analyze quality 建立真实 baseline 示例或显式 `blocked-by-observability-gap`。
3. Wave 1 / `Alembic` + `AlembicPlugin` consumer refs：更新两边 submodule 指针，跑各自 progressive-chain-validation skill 单测，确认 Plugin first 和 Alembic install enhances 两个入口消费同一份 skill。
4. Wave 2 / `AlembicTest` consumer：总控基于 Wave 0 / 1 回填创建 PCVM Test-01，验证 N9 baseline、artifact / trace / metrics 证据和 PCV 默认使用规则。
5. Wave 3+ / Agent 优化主线：在 baseline 和 comparison format 稳定后，逐项优化 N9 / stage profile / Observation Ledger / tool policy，并用同 fixture before / after 证明。

- 下一处真实阻塞点：PCV source Wave 0 回填 commit 和删除 / 替换 consumer submodule 建议。
- 阻塞点之前还能做：总控已经完成 Design 接收、代码事实调研、TODO 状态提升、submodule 事实复核、顶层 PCV repo 拉出和当前分派文档落账。
- 当前可派发窗口：`progressive-chain-validation`。
- 当前阻塞 / 观察窗口：`Alembic` 与 `AlembicPlugin` 等待 Wave 0 后删除 / 替换内部 submodule；`AlembicAgent`、`AlembicTest`、`AlembicCore` 观察或等待上游。

## 任务包

确认前只保留候选，不派发。

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| PCVM-P0-PCV-SOURCE-METRICS-CONTRACT | `AlembicPlugin` | 进入 `AlembicPlugin/skills/progressive-chain-validation` 独立 source checkout，补 scorecard / baseline / comparison 方法、模板和 N9 baseline 示例。 | 候选，等待用户确认 |
| PCVM-P1-SUBMODULE-CONSUMERS | `Alembic` / `AlembicPlugin` | 更新两边 PCV submodule 指针并验证两边消费同一份 skill。 | 候选，等待 Wave 0 |

### PCVM-P0-PCV-SOURCE-METRICS-CONTRACT：PCV metrics source producer

窗口：`AlembicPlugin`；目标仓库是 `AlembicPlugin/skills/progressive-chain-validation` 里的独立 `progressive-chain-validation` skill source checkout，不是 `AlembicPlugin` 父仓库业务代码。选择该 checkout 作为第一开发位置，是因为长期路线是 Plugin first，随后同步 `Alembic` submodule 指针。

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：未派发

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 18:45 CST

阶段目标：

- 让独立 progressive-chain-validation skill source 从 chain plan 生成扩展为可消费的节点级 baseline / scorecard / comparison 框架。
- 为 N9 analyze quality 定义第一版真实 baseline 证据，不要求真实 optimized-after。

主线动作：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 PCV skill source README，并声明当前窗口定位是独立 skill source，不是 `Alembic` 或 `AlembicPlugin` 父仓库实现窗口。
- 在独立 `progressive-chain-validation` source repo 中复核 PCV skill、cold-start / rescan overlay 和 plan template。
- 定义每个节点可自定义 useful unit、quality gate、stage_loss、baseline / candidate / verdict 的报告格式。
- 明确 quality gate 必须先通过，loss improvement 才能计入改进。
- 为 N9 analyze quality 写入 baseline 示例路径：input assembly、Observation Ledger、`note_finding` 质量、artifact / trace / metrics 关联。
- 若 artifact / trace 无法关联 node，必须输出 `blocked-by-observability-gap`，不得伪造 verdict。
- 更新 PCV source 中的 skill 文档、overlay、template 和必要示例；不要只改某个父仓库 checkout 成为私有分叉。
- 回填 PCV source commit hash、两边 submodule 当前 hash、建议的 `Alembic` / `AlembicPlugin` 后续消费字段，说明是否需要 `AlembicCore` 后续 contract。

合并 TODO：

- `GTODO-2026-05-25-003`
- `PCVM-TODO-1`
- `PCVM-TODO-4`

明确不包含：

- 不修改 `AlembicAgent` prompt/runtime。
- 不直接修改 `Alembic` / `AlembicPlugin` 父仓库代码或 submodule pointer；这些进入下一包。
- 不创建 `AlembicTest` 测试单。
- 不做 Dashboard comparison UI。
- 不新增 Core schema，除非实现中证明已有稳定跨包 consumer。

下一处真实阻塞点：

- `Alembic` 与 `AlembicPlugin` 需要等待 PCV source commit 后才能更新 submodule pointer；`AlembicTest` 需要等待两边消费验证回填后才能创建 PCVM Test-01。

阻塞点之前还能做：

- PCV source 可以在一包内完成 skill / overlay / template、N9 baseline guidance、observability gap verdict 和 source-level 文档验证。

验证命令：

```text
git diff --check
```

父仓库消费验证留到 `PCVM-P1-SUBMODULE-CONSUMERS`：

```text
npm test -- --runInBand test/unit/progressive-chain-validation-skill.test.ts
git diff --check
```

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- N9 baseline 示例或 observability gap verdict：
- 是否需要 `AlembicCore` contract：
- `Alembic` / `AlembicPlugin` 下一波 submodule pointer 更新建议：
- `AlembicTest` 后续可消费字段：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 PCV skill source README。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-25-003 | 目标阶段确认中 | agent / llm optimization loop | P0 | PCV source / `AlembicPlugin` / `Alembic` / `AlembicAgent` / `AlembicTest` | 建立 PCV 节点级 baseline / scorecard / comparison，后续用同 fixture 反向优化 Agent / LLM 输入输出。 | 是 | 用户确认本文 canonical source 路线后启动 Wave 0。 | PCV source |
| PCVM-TODO-0 | 候选合入 Wave 0 | source-of-truth / submodule | P0 | PCV source / `AlembicPlugin` / `Alembic` | 确认 PCV canonical source 为 `GxFn/progressive-chain-validation.git`，禁止在 `Alembic` 或 `AlembicPlugin` 父仓库中制造分叉版 skill，并定义两边 submodule 更新顺序。 | 是 | 本文确认后。 | PCV source |
| PCVM-TODO-1 | 候选合入 Wave 0 | 调研 / producer | P1 | PCV source | 确认并更新 PCV skill / overlay / template 的 scorecard、baseline、comparison 输出点和同步路径。 | 是 | 本文确认后。 | PCV source |
| PCVM-TODO-2 | 观察中 | 调研 / consumer fact | P1 | `AlembicAgent` | 确认 N9 analyze quality 的 fixture、quality gate 和 loss 数据来源；第一波只读事实，不改 Agent。 | 是 | `Alembic` producer 定义 N9 格式后。 | `AlembicAgent` |
| PCVM-TODO-3 | 阻塞 | 验证 | P1 | `AlembicTest` | 设计 N9 真实 baseline 的最小 test-mode 证据；后续 Agent 优化时再补真实 optimized-after。 | 是 | 等 `Alembic` producer 回填可消费格式。 | `AlembicTest` |
| PCVM-TODO-4 | 候选合入 Wave 0 | 风险 / observability | P1 | PCV source / `Alembic` / `AlembicCore` | 若 artifact / trace 无法关联 node，先补 observability gap 或记录 gap verdict，不得伪造 score。 | 是 | Wave 0 代码事实复核。 | PCV source |
| PCVM-TODO-5 | 阻塞 | 流程 / test policy | P1 | `AlembicTest` | 定义 AlembicTest 何时默认使用 PCV、何时可 opt out 并写明理由。 | 是 | 等 PCV producer 格式稳定。 | `AlembicTest` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 等待 PCV source | 否 | 不直接开发 skill 内容；等 PCV source commit 后更新 submodule pointer 并跑消费测试。 |
| `AlembicCore` | 观察中 | 否 | 第一波不新增共享 schema；只有 PCV scorecard 出现稳定跨包 consumer 后再评估下沉。 |
| `AlembicAgent` | 观察中 | 否 | 第一波只引用 N9 analyze 事实；baseline 未形成前不改 prompt/runtime。 |
| `AlembicDashboard` | 无任务 | 否 | 第一版不做 comparison UI。 |
| `AlembicPlugin` | 待确认后 Wave 0 主线任务 | 否 | 进入 `skills/progressive-chain-validation` 独立 source checkout 开发 PCV；父仓库 pointer / 消费验证随后同窗口或下一包处理。 |
| `AlembicTest` | 阻塞 | 否 | 等 PCV source 和两边 submodule consumer 验证后再创建测试单。 |
| `BiliDili` | 无任务 | 否 | 不改真实 iOS 项目源码。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>阻塞 | 等待 PCV source commit；随后更新 submodule pointer 并验证父仓库消费。 |
| `AlembicCore`<br>观察中 | 第一波不新增共享 contract；仅在 `Alembic` 回填稳定跨包 consumer 时重新评估。 |
| `AlembicAgent`<br>观察中 | 第一波不改 Agent；只作为 N9 analyze quality 代码事实来源和后续优化目标。 |
| `AlembicDashboard`<br>无任务 | 第一版不做 comparison UI。 |
| `AlembicPlugin`<br>暂停 | 等待用户确认 PCV canonical source 路线；确认后 Wave 0 进入 `skills/progressive-chain-validation` source checkout，领取 `PCVM-P0-PCV-SOURCE-METRICS-CONTRACT`。 |
| `AlembicTest`<br>阻塞 | 等待 PCV source 和两边 submodule consumer 验证后，由总控创建 PCVM Test-01。 |
| `BiliDili`<br>无任务 | 不改真实项目源码。 |

## 可复制分派提示词

发送给：无，等待用户确认 PCV canonical source 路线；当前不发送实现窗口提示词。

```text
等待用户确认任务级最终目标与阶段计划；当前不派发。确认后提示词必须要求执行窗口先读取 AGENTS.md、docs/workspace/index.md、当前总控文档和目标仓库 AGENTS.md，并明确当前窗口定位。
```

## 测试交接

- 是否需要 `AlembicTest`：需要，但不是当前第一波；等 `Alembic` producer 回填 PCV scorecard / baseline / comparison 格式后创建测试单。
- 测试单：暂未创建。
- 测试交流入口：[test-exchange.md](../../../../../codex-control-workspace/.workspace-active/workspace/current/test-exchange.md)。
- 真实项目保护说明：当前不改真实测试项目；后续若用真实项目做 cold-start / rescan 验证，必须通过 `AlembicTest` 测试单执行。

## 回填区

- 2026-05-25 18:30 CST：总控接收用户“开始推进 `GTODO-2026-05-25-003 / Progressive Chain Validation Metrics`”指令；读取 Design handoff、全局 TODO、PCV skill / artifact / trace / metrics / N9 analyze / AlembicTest probe 代码事实，判定当前应停在目标阶段确认，发送给无。
- 2026-05-25 18:45 CST：用户指出 PCV 已较久未更新，且 `Alembic` / `AlembicPlugin` 都引入同一 skill。总控复核发现两边均为 `skills/progressive-chain-validation` submodule，远程为 `https://github.com/GxFn/progressive-chain-validation.git`，当前 hash 均为 `a6c371c8b123fc79f218d362cd6bae61a0679d61` 且目录内容一致。结论：不应直接在 `Alembic` 父仓库开发 PCV；应先确认独立 PCV source 作为 canonical producer，再由 `Alembic` 和 `AlembicPlugin` 更新 submodule pointer。
- 2026-05-25 19:05 CST：用户确认 PCV 单独拉出，并要求后续修改 / 删除 `Alembic` 与 `AlembicPlugin` 内部引入。总控已创建当前 Wave 0 分派文档 [progressive-chain-validation-metrics-wave-0-2026-05-25.md](../../../../../codex-control-workspace/.workspace-active/workspace/current/progressive-chain-validation-metrics-wave-0-2026-05-25.md)，当前发送给 `progressive-chain-validation`。
