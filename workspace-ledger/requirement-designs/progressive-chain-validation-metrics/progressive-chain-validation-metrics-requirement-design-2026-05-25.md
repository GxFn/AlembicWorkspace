# Progressive Chain Validation Metrics 需求设计

日期：2026-05-25
状态：准备交给 AlembicWorkspace 评审
维护窗口：AlembicDesign
总控：AlembicWorkspace
原始计划：[progressive-chain-validation-metrics-original-plan-2026-05-25.md](progressive-chain-validation-metrics-original-plan-2026-05-25.md)

## 原始计划书

- 原始计划书：[progressive-chain-validation-metrics-original-plan-2026-05-25.md](progressive-chain-validation-metrics-original-plan-2026-05-25.md)
- 原始计划书确认状态：用户已确认
- 用户确认时间：2026-05-25

## 已确认目标

补完整 `progressive-chain-validation` skill 的指标对比能力，让 Alembic cold-start / rescan 的长链路可以被拆成节点级 baseline、scorecard 和 before / after comparison。后续 Alembic 内部 Agent 优化必须绑定到具体 PCV 节点、节点 fixture、质量门槛和可对比指标，证明能力变好且质量不回退。

已确认第一版约束：

- 第一版不做 Dashboard comparison UI。
- 接受 `quality gate + stage_loss` 分离：质量先达标，再比较损耗下降。
- 首个 Alembic internal Agent 示例节点选择 N9 analyze quality。
- 允许每个节点定义自己的 useful unit，但统一 scorecard 结构和 verdict 规则；第一版不做全局总分。
- PCV 作为 AlembicTest 在 cold-start / rescan 长链路、internal Agent 能力优化和节点级 baseline / comparison 场景下的默认验证入口；不是所有测试的强制入口。
- N9 示例第一版要求真实 baseline；真实 optimized after / before-after 对比留给后续第一次 Agent 优化主线。

## 当前主线关系

下一主线候选。

理由：当前 AlembicWorkspace 主线仍是 `LLM 输入优化 Wave 5`，需要先完成 Timeline artifact detail、metrics / trace 展示和后续 integration verification。本需求承接 `GTODO-2026-05-25-003` 的 progressive-chain-validation 阶段化验证方向，适合作为当前监控闭环完成后的下一主线候选，不应打断当前 Wave 5。

## 用户场景

开发者想优化 Alembic internal Agent 时，不再直接改 prompt 然后跑一次 full cold-start 看整体感觉，而是：

1. 选择一个 PCV 节点，例如 N9 analyze quality。
2. 固定同一个 project、dimension、input artifact、fixture 或 frozen upstream artifact。
3. 生成 baseline scorecard，记录质量门槛、stage loss、证据和产物。
4. 修改 Agent 能力后，用同一节点 fixture 重新跑 comparison。
5. 得到 `improved`、`regressed`、`unchanged`、`inconclusive` 或 `blocked-by-observability-gap` 的判定。
6. 只有节点级质量门槛满足、stage loss 下降且下游 acceptance 不回退时，才认为这次优化成立。

## 功能闭环

- 输入：Source Chain Map、PCV node id、node fixture 或 frozen upstream artifact、baseline artifacts、current artifacts、metrics / trace / evidence refs、节点质量门槛。
- 输出：节点级 scorecard、baseline / current 对比表、delta、verdict、证据 refs、observability gap、下一步优化建议。
- 状态变化：PCV run report 从 pass/fail 计划扩展为可承载 baseline 和 comparison 的评估记录；AlembicTest 可根据该记录创建或回填节点级验证证据。
- 生产方：`progressive-chain-validation` skill、Alembic cold-start/rescan overlay、PCV report template、Alembic job artifact / trace / metrics producer、AlembicTest baseline run。
- 消费方：AlembicWorkspace 总控、AlembicTest 验证窗口、后续 Alembic / AlembicAgent 执行窗口、需要评审 Agent 优化是否有效的开发者。
- 失败路径：缺少节点级 artifact / trace 时判定为 `blocked-by-observability-gap`；质量门槛未过时不允许用成本下降声明优化；fixture 不一致时判定为 `inconclusive`；下游 acceptance 回退时判定为 `regressed`。

## 需求明确性检查

- 完整功能闭环：已形成，核心闭环是 `node fixture -> baseline scorecard -> optimized scorecard -> delta verdict -> 下一步优化判断`。
- 验证方式：第一版用 PCV report template 和 N9 analyze quality 真实 baseline 证明 scorecard 口径可执行；真实 optimized after 留给后续 Agent 优化主线。
- 完成定义：第一版完成 PCV skill / overlay / report template 的指标对比说明，提供 N9 真实 baseline 示例，不做 UI，不做全局总分。
- 仍不明确的问题：现有 metrics / trace 字段是否足以承载 chain node refs；PCV skill 更新后需要同步到哪些 runtime / skill 安装位置。

## 仓库边界

| 仓库 / 窗口 | 职责 | 包含范围 | 不包含范围 |
| --- | --- | --- | --- |
| Alembic | PCV skill 所在仓库和 artifact / trace / metrics producer | 更新 skill / overlay / template 的候选归口；确认 job artifacts 是否支持节点级 refs | 不直接优化 Agent prompt；不做 UI |
| AlembicCore | 共享 contract 观察方 | 只有 scorecard / evidenceRef 成为跨仓库稳定 contract 时再评估 | 第一版不下沉 metric schema |
| AlembicAgent | 被优化对象和 N9 示例事实来源 | N9 analyze quality 的 stage policy、tool calls、Observation Ledger、QualityGate、output contract | 第一版不直接改 prompt / runtime |
| AlembicDashboard | 后续观察方 | 可未来消费 comparison summary | 第一版不做 comparison UI |
| AlembicPlugin | 无直接任务 | 保持 Codex host-agent 路由边界 | 不纳入 internal Agent PCV metrics 第一版 |
| AlembicTest | baseline / comparison 验证方 | 对 cold-start / rescan 长链路、internal Agent 能力优化和节点级 comparison 默认使用 PCV；维护可重复 fixture、真实 baseline、后续 before / after evidence 和节点级报告 | Design 阶段不直接创建测试单；简单局部测试不强制 PCV |

## 外部调研判断

- 是否需要联网：暂不需要。
- 判断理由：本需求首先是补齐本地已有 PCV skill、Alembic overlay 和 LLM input optimization research 的内部方法论，主要事实来自本地代码和文档。
- 若需要，优先来源：若后续把 metric model 做成正式 eval framework，再调研 OpenAI Evals、OpenTelemetry semantic conventions 或主流 regression scorecard 实践。
- 若不需要，说明原因：当前第一版不做通用评估平台，只让本地 PCV skill 支持节点级对比。
- 外部结论如何约束或启发本地方案：暂不适用。

## 代码事实与调研缺口

按仓库记录，不写猜测。

### AlembicCore

- 已有能力：`JobProcessEventContracts` 已存在 `workflow`、`llm.input`、`llm.output`、`tool`、`artifact`、`checkpoint`、`summary` 事件，以及 `correlationId` / `parentEventId` / `phase` / `dimensionId` 字段。
- 关键文件：父级 research 记录引用 `AlembicCore/src/daemon/JobProcessEventContracts.ts`。
- 缺口：是否需要新增共享 `chainNodeId` / `chainRunId` / scorecard schema，需代码调研后决定。

### Alembic

- 已有能力：`progressive-chain-validation` skill 当前位于 `Alembic/skills/progressive-chain-validation/progressive-chain-validation/`；Alembic cold-start/rescan overlay 已定义 N0-N14 coverage nodes；Wave 4 已生产 job artifact、artifactRef、trace envelope 和 metrics。
- 关键文件：
  - `Alembic/skills/progressive-chain-validation/progressive-chain-validation/SKILL.md`
  - `Alembic/skills/progressive-chain-validation/progressive-chain-validation/references/overlays/alembic-coldstart-rescan.md`
  - `Alembic/skills/progressive-chain-validation/progressive-chain-validation/templates/plan.md`
- 缺口：PCV skill 当前没有统一 baseline / scorecard / comparison section；N11 有局部 recheck metrics，但尚未推广到 N8 / N9 / N12 / N13 / N14。

### AlembicPlugin

- 已有能力：本需求暂无直接 plugin 能力依赖。
- 关键文件：无。
- 缺口：无；保持观察。

### AlembicDashboard

- 已有能力：当前 Wave 5 正在消费 artifact API / artifactRef、metrics 和 trace 展示。
- 关键文件：待总控从 Wave 5 回填确认。
- 缺口：第一版不做 UI；后续若要展示 trend / comparison，再调研 Dashboard 现有 job detail 和 artifact side panel。

### AlembicAgent

- 已有能力：N9 analyze quality 涉及 stage policy、tool choice、tool calls、Observation Ledger、QualityGate 和 analyzed findings。父级 research 已记录 Analyze / Produce 输入 profile、Observation Ledger 和 test-mode 证据。
- 关键文件：待总控后续代码调研确认具体入口。
- 缺口：需要确认 N9 可冻结的 upstream artifact、可重复 fixture、质量门槛和可收集 metrics。

### AlembicTest / 真实项目验证

- 是否纳入：后续纳入。
- 理由：该需求核心是可重复 baseline 和 before / after comparison，必须由 AlembicTest 或总控授权测试单提供证据。PCV 应成为 AlembicTest 对长链路 / internal Agent 优化类任务的默认验证入口；简单局部 bug、lint、类型和小 UI polish 不强制使用 PCV。
- 目标项目（如有）：候选为 BiliDili 与 AlembicWorkspace，但 Design 阶段只记录候选，不直接操作真实项目。

### AlembicDesign / 总控交接

- 本设计窗口已完成：用户目标、原始计划确认、第一版范围、指标口径、N9 示例选择。
- 仍需总控复核：当前主线完成状态、是否并入 `GTODO-2026-05-25-003`、是否需要代码实现依赖调研。
- 是否处于 detached-design-mode：否，可读取父级 workspace 文档。

## 代码实现依赖调研

- 是否需要单独调研附件：需要，建议由 AlembicWorkspace 或后续执行窗口补。
- 建议调研入口：
  - PCV skill / overlay / template 的当前结构。
  - Alembic Wave 4 / Wave 5 的 artifact / trace / metrics 字段。
  - AlembicAgent N9 analyze path 的 stage policy、tool call、Observation Ledger、QualityGate 和 output contract。
  - AlembicTest 是否已有可冻结 fixture / replay harness。
- 关键生命周期：PCV plan generation -> node fixture baseline -> optimized run -> scorecard comparison -> verdict -> handoff to Agent optimization.
- 共享状态 / 持久化位置：PCV `scratch/chain-runs/<run-id>/report/plan.md`；Alembic Ghost dataRoot job artifacts；AlembicTest reports.
- producer / consumer 硬依赖：metrics comparison 依赖 artifact / trace 可回放到节点；Agent 优化消费 comparison verdict；AlembicTest 生产验证证据。
- 不能切换 / 不能删除 / 不能提前消费的边界：不能用 full run 替代节点 pass；不能把 cost 降低当作质量提高；不能在无 node evidence 时伪造 verdict。
- 待总控补证的问题：现有 fields 是否足以表达 chain node refs；是否需要先补 observability；PCV skill 更新需要同步到哪些安装位置；N9 真实 baseline 的 fixture 和 artifact 来源。

## 设计选项

### 选项 A：PCV report-first comparison

- 描述：第一版只补 PCV skill、Alembic overlay 和 plan template，让 `report/plan.md` 能承载 baseline、scorecard、comparison 和 verdict。N9 analyze quality 作为示例节点。
- 优点：范围小、符合用户“不做 UI”；可以最快让总控 / AlembicTest 有统一指标尺子。
- 风险：短期不提供可视化 trend，阅读和比较主要靠报告。

### 选项 B：平台级 metrics schema

- 描述：直接设计共享 scorecard schema、JobProcessEvent contract、Dashboard trend 和 AlembicTest harness。
- 优点：长期更系统。
- 风险：第一版过重，容易在 Core / Dashboard / Test 多窗口展开，打断当前主线收束。

## 推荐方案

推荐选项 A：PCV report-first comparison。

它最适合当前 Alembic 架构和用户确认：不做 UI，先让 `progressive-chain-validation` 成为确定指标和前后对比的可复用方法。第一版重点放在 skill / overlay / report template 和 N9 analyze quality 示例。只有当真实代码调研证明现有 artifact / trace 字段不足时，才把 observability gap 交回总控，而不是提前设计平台级 schema。

## 指标模型草案

每个节点的 scorecard 分三层：

1. `quality_gate`：必须先通过，不通过时禁止声明优化成功。
2. `stage_loss`：质量通过后可下降的损耗指标。
3. `acceptance_signal`：下游或消费者是否仍接受该节点产物。

节点可以拥有不同 useful unit。第一版不做全局总分，只做统一 scorecard 结构和 per-node verdict 汇总，例如 `N9 improved`、`N11 unchanged`、`N12 blocked-by-observability-gap`。这样避免把不同阶段的语义硬压成一个看似精确但不可解释的总分。

默认 verdict：

| Verdict | 条件 |
| --- | --- |
| `improved` | baseline 和 current 使用同一 fixture；quality gate 均通过；acceptance 无回退；stage loss 下降或 quality signal 上升。 |
| `regressed` | current quality gate 失败、acceptance 回退，或关键 failure penalty 上升。 |
| `unchanged` | quality / acceptance 无变化，stage loss 无显著变化。 |
| `inconclusive` | fixture、artifact 或测量口径不一致。 |
| `blocked-by-observability-gap` | 缺少必要 nodeInputRef / nodeOutputRef / nodeEvidenceRef 或 metrics，无法判断。 |

PCV 作为 AlembicTest 默认入口的适用范围：

| 场景 | 默认使用 PCV | 理由 |
| --- | --- | --- |
| cold-start / rescan 长链路 | 是 | full run 容易掩盖节点问题。 |
| internal Agent prompt / tool policy / Observation Ledger / Producer 优化 | 是 | 必须证明具体节点变好且质量不退。 |
| baseline / optimized comparison | 是 | PCV 提供 fixture、scorecard、delta 和 verdict 结构。 |
| 单文件单元测试 / lint / 类型修复 | 否 | 直接 targeted test 更高效。 |
| 小 UI polish | 否 | 不应为局部 UI 调整强制长链路计划。 |

若 AlembicTest 在默认适用场景不使用 PCV，需在回填中说明原因。

### N9 analyze quality 示例方向

N9 选择理由：它最接近 Alembic internal Agent 能力本体，能直接观察分析阶段是否用对工具、是否产出文件级证据、是否减少无效读搜、是否避免 raw context 回灌，并能为后续 N11 Produce 提供上游质量输入。

N9 useful unit 候选：

- 带真实 sourceRef 的 confirmed finding。
- 被 QualityGate 接受的 evidence-backed observation。
- 后续 Producer 可消费的 analysis artifact section。

N9 quality gate 候选：

- findings 包含文件级 evidence。
- `note_finding` 或等价记录满足 QualityGate 要求。
- `toolChoice` 与 stage policy 一致。
- Observation Ledger 不泄露 raw debug dump。
- 没有 `[object Promise]`、schema mismatch 或 missing required param。

N9 stage loss 候选：

- input tokens / chars per accepted finding。
- duplicate read / search count。
- failed tool call / retry count。
- raw dynamic context ratio。
- irrelevant section ratio。
- latency per accepted finding。

N9 第一版数据要求：

- 必须提供真实 baseline artifact 或真实可复核 baseline evidence，证明 scorecard 能被当前 Alembic artifact / trace / metrics 填写。
- 不强制提供真实 optimized after；真实 before / after comparison 留给后续第一次 AlembicAgent 优化主线。
- 如果无法从现有数据填出 baseline，应明确给出 `blocked-by-observability-gap`，并列出缺失的 nodeInputRef / nodeOutputRef / nodeEvidenceRef / metrics。

## 用户确认记录

| 时间 | 决策 / 偏好 | 影响 |
| --- | --- | --- |
| 2026-05-25 | 第一版不做 UI | Dashboard comparison UI 不进第一版范围。 |
| 2026-05-25 | 接受 `quality gate + stage_loss` 分离 | 指标模型以质量门槛优先，成本下降不能抵消质量回退。 |
| 2026-05-25 | Design 选择首个示例节点 | 首个示例节点定为 N9 analyze quality。 |
| 2026-05-25 | 采用 Design 推荐的三项细化 | 每个节点允许独立 useful unit；PCV 成为 AlembicTest 长链路 / Agent 优化默认入口；N9 第一版要求真实 baseline、不强制 optimized after。 |

## 禁止的伪实现

- 只新增一个 `score` 字段但没有 baseline artifact、current artifact 和 comparison verdict。
- 只统计 token / latency，然后把下降直接解释为 Agent 能力提升。
- 只跑 full cold-start，把最终成功当作 N9 / N11 / N12 都通过。
- 在无 node evidence 时伪造 `improved`。
- 为未来 UI 先搭空接口或空 adapter。

## 差距分析

| 能力 | 当前状态 | 缺口 | 归属窗口 | 风险 |
| --- | --- | --- | --- | --- |
| PCV node plan | 已存在 | 需要扩展为 baseline / comparison | Alembic | 只停留在 pass/fail |
| Alembic overlay | N0-N14 已存在 | N9 等关键节点缺 metrics guidance | Alembic | 指标无法复用 |
| N9 fixture | 待调研 | 需冻结 upstream artifact 和下游 cut，并生成真实 baseline | AlembicAgent / AlembicTest | baseline 不真实会让 skill 只停留在纸面 |
| Metrics refs | Wave 4/5 已生产部分能力 | 需确认是否可关联 chain node | Alembic / AlembicCore | observability gap |
| Verification | TestMode 已用于 LLM input 主线 | 需节点级 baseline / delta 报告；长链路 / Agent 优化默认使用 PCV | AlembicTest | 仍依赖 full run |

## TODO / Backlog

| ID | 状态 | 类型 | 严重度 / 优先级 | 归属 | 事项 / TODO | 影响目标 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PCVM-TODO-1 | 观察 | 调研 | P1 | `Alembic` | 确认 PCV skill / overlay / template 更新点和同步路径。 | 是 | 当前主线完成后 | `Alembic` |
| PCVM-TODO-2 | 观察 | 调研 | P1 | `AlembicAgent` | 确认 N9 analyze quality 的 fixture、quality gate 和 loss 数据来源。 | 是 | 总控代码调研 | `AlembicAgent` |
| PCVM-TODO-3 | 观察 | 验证 | P1 | `AlembicTest` | 设计 N9 真实 baseline 的最小 test-mode 证据；后续 Agent 优化时再补真实 optimized after。 | 是 | 总控创建测试单后 | `AlembicTest` |
| PCVM-TODO-4 | 观察 | 风险 | P1 | `Alembic` / `AlembicCore` | 若 artifact / trace 无法关联 node，先补 observability gap，不得伪造 verdict。 | 是 | 代码调研发现字段缺口 | `Alembic` |
| PCVM-TODO-5 | 观察 | 流程 | P1 | `AlembicTest` | 定义 AlembicTest 何时默认使用 PCV、何时可 opt out 并写明理由。 | 是 | 总控接收需求后 | `AlembicTest` |

## 阶段候选

1. 代码事实调研：确认 PCV skill、Alembic overlay、template、Wave 4/5 metrics / trace、N9 Agent path 和 AlembicTest fixture 能力。
2. PCV skill 设计补齐：新增 baseline / scorecard / comparison workflow，更新 plan template。
3. Alembic overlay 补齐：为 N8 / N9 / N11 / N12 / N13 / N14 增加 metrics guidance，N9 作为第一版完整示例。
4. 验证样例：用 N9 analyze quality 写出真实 baseline scorecard 示例；不强制真实 optimized after。
5. 总控评审：决定是否进入目标阶段确认，以及是否分派 Alembic / AlembicAgent / AlembicTest。

阶段候选不等于执行派发。最终阶段顺序必须由 `AlembicWorkspace` 基于代码实现依赖调研和目标阶段确认确定。

## 验证策略

- 最小验证：检查 PCV generated plan 是否包含 scorecard / comparison sections，N9 示例是否能明确 quality gate、stage loss、fixture、真实 baseline ref 和 verdict；若缺字段，必须产出 `blocked-by-observability-gap`。
- 集成验证：后续由 AlembicTest 用固定 fixture 生成一次真实 baseline；第一次 AlembicAgent 优化主线再生成真实 optimized comparison，证明 report 可支持 `improved/regressed/inconclusive` 判定。
- 测试窗口交接：Design 不创建测试单；建议总控在当前主线完成后通过 `alembic-test-exchange.md` 创建节点级 baseline / comparison 测试单。

## 非目标与禁止捷径

- 第一版不做 Dashboard comparison UI。
- 不直接改 Alembic internal Agent prompt / runtime。
- 不用 full cold-start 成功替代节点级 comparison。
- 不把 token / latency 降低等同于能力提高。
- 不把不同节点强行汇总为一个全局总分。
- 不要求简单局部测试强制走 PCV。
- 不在 N9 第一版伪造 optimized after；没有真实优化就只交付 baseline 和 comparison 模板。
- 不提前把 scorecard schema 下沉到 Core，除非代码调研证明存在稳定跨仓库消费方。

## 开放问题

1. 现有 Wave 4 / Wave 5 artifact / trace / metrics 是否足以生成 N9 真实 baseline。
2. PCV skill 更新后需要同步到哪些 skill/runtime 安装位置。
3. AlembicTest 默认 PCV 触发规则应写入测试执行规则，还是先写在本需求的后续 handoff 中。

## Workspace 交接准备状态

准备交给 AlembicWorkspace 评审。

## 进入总控流程建议

- 建议下一步：交给 AlembicWorkspace 评审是否并入 `GTODO-2026-05-25-003`，并安排代码事实调研；当前仍不应打断 `LLM 输入优化 Wave 5`。
- 是否需要补充代码调研：需要。
- 是否需要进入 `AlembicWorkspace` 目标阶段确认：当前主线完成后需要。
- 明确不应派发的窗口：当前不要派发 AlembicDashboard；不要派发实现窗口直接改 Agent prompt。

## 交接前自检

- 已对照 `docs/workspace-alignment-checklist.md`：是。
- 原始计划已确认：是。
- 完整功能闭环已写清：是。
- 代码事实 / 调研缺口已分开：是。
- 阶段仍是候选，没有写成 wave：是。
- TODO / Backlog 已记录：是。
- 仍需用户确认的问题已列出：当前无用户侧阻塞问题；剩余为总控 / 代码事实调研问题。
