# Progressive Chain Validation Metrics 原始计划书

日期：2026-05-25
状态：用户已确认
维护窗口：AlembicDesign
总控：AlembicWorkspace

## 用户目标

补完整 `progressive-chain-validation` skill，让它不只把 cold-start / rescan 长链路拆成可逐节点验证的小阶段，还能为每个阶段建立稳定的 baseline、scorecard 和前后对比指标。后续 Alembic 内部 Agent 的优化应先声明目标节点和指标，再用同一节点 fixture 比较优化前后，证明 Agent 能力变好且质量不回退。

## 用户原话 / 关键约束

```text
你能看到LLM Input Optimization Research文档么，之前讨论到了 progressive-chain-validation，我想的是完整这个 skill，来支持一种确定指标的对比，然后优化 Alembic 内部的 agent 能力
```

相关前文：

```text
我想继续讨论关于 Agent 的各个阶段指标，我希望能在冷启动的小阶段定义一个优化指标，然后让这个数值慢慢变小或更好
```

用户确认：

```text
不做 UI；可以接受；你来选择
按照你的推荐吧
```

Design 解释：第一版不做 Dashboard comparison UI；接受 `quality gate + stage_loss` 分离；首个示例节点由 Design 选择为 N9 analyze quality。
后续用户确认采用 Design 推荐：允许每个节点使用不同 useful unit；PCV 作为 AlembicTest 对长链路 / internal Agent 能力优化的默认验证入口但不是所有测试的强制入口；N9 第一版需要真实 baseline，不强制真实 optimized after。

## 为什么现在做

`LLM Input Optimization Research` 已经把当前主线从“能看到 LLM input/output”推进到 artifact、trace、metrics 和 Dashboard 展示。该文档同时指出 `progressive-chain-validation` 应作为后续 `GTODO-2026-05-25-003` 的前置验证框架：不要只比较完整 cold-start 最终结果，而要按节点比较 N8 stage factory / tool policy、N9 analyze quality、N11 produce、N12 persistence、N13 finalizer、N14 report/history 等小阶段。

现在的缺口是：现有 `progressive-chain-validation` skill 已经能生成 source-derived node plan，并强调 one-node-at-a-time execution；Alembic cold-start/rescan overlay 也已经有 N0-N14 coverage node。但 skill 尚未明确提供一套通用的节点级指标对比能力，例如 baseline capture、scorecard schema、stage loss、质量门槛、前后对比判定和优化回归标准。

## 期望结果

需求完成后，`progressive-chain-validation` 应能支持以下工作方式：

1. 为 Alembic cold-start / rescan 生成 Source Chain Map，并映射到 N0-N14 或 source-derived split nodes。
2. 为每个节点生成 node-local scorecard，包含质量门槛、可下降的 loss 指标、可上升的 quality / acceptance 指标，以及证据来源。
3. 允许用同一 fixture 或 frozen upstream artifact 生成 baseline，再对优化后的同一节点做 before / after comparison。
4. 明确判定一次优化是 `improved`、`regressed`、`unchanged`、`inconclusive` 还是 `blocked-by-observability-gap`。
5. 让 Alembic 内部 Agent 优化必须绑定到具体节点、具体不变量和具体指标，而不是直接改 prompt 后跑一轮 full cold-start。
6. 把完整 full run 降级为最终确认证据，不能替代节点级指标比较。

## 最终完成定义草案

用草案口径看，该需求至少需要满足：

- `progressive-chain-validation` skill 的 `SKILL.md` / references / template 能指导 Agent 生成节点级 baseline 和 scorecard，而不是只生成 pass/fail plan。
- Alembic cold-start/rescan overlay 为 N8 / N9 / N11 / N12 / N13 / N14 补充 metrics guidance，包括 useful unit、质量门槛、可下降 loss、可上升 acceptance 和 recheck rules。
- `report/plan.md` 模板新增或扩展 metrics / comparison sections，能记录 baseline artifact、current artifact、delta、判定、证据 ref 和下一步优化建议。
- 至少有一个 Alembic internal Agent 节点示例能说明如何比较优化前后；第一版示例节点选 N9 analyze quality。
- N9 示例第一版必须能基于真实 baseline artifact 填出 scorecard；真实 optimized after 数据留给后续第一次 Agent 优化主线。
- 比较口径不能鼓励低质量瘦身：成本 / token / latency 下降只有在质量门槛满足且下游 acceptance 无回退时才算优化成功。
- 总控或执行窗口能据此创建 `AlembicTest` baseline / comparison 任务，而不需要重新发明指标表。

## 当前主线关系

下一主线候选。

该需求应等待当前 `LLM 输入优化` 的 Timeline / Artifact / Trace / Metrics / Dashboard / TestMode 闭环完成后再提升。它可以合并或承接 `GTODO-2026-05-25-003` 的 progressive-chain-validation 阶段化验证方向，不应打断当前 Wave 5。

## 初始范围

包含：

- 补全 `progressive-chain-validation` skill 的指标对比语义。
- 为 Alembic cold-start / rescan overlay 增加节点级 scorecard / comparison guidance。
- 定义节点级 metric 结构：quality gate、stage loss、useful unit、acceptance / rejection、cost / latency / redundancy、observability gap。
- 允许每个节点定义自己的 useful unit，但统一 scorecard 结构和 verdict 规则；第一版不做全局总分。
- 定义 baseline 和 optimized run 的对比判定。
- 明确 Alembic 内部 Agent 优化必须绑定节点、fixture、不变量和前后证据。
- 定义 PCV 作为 AlembicTest 在长链路 / internal Agent 能力优化 / baseline comparison 场景下的默认入口；简单局部测试可说明理由后不使用 PCV。

不包含：

- 立即修改 Alembic internal Agent prompt 或 runtime。
- 立即跑 full cold-start 证明优化。
- 把 Dashboard 做成完整性能分析产品；第一版明确不做 UI。
- 把所有 metric schema 过早下沉到 `AlembicCore`。
- 改变 `AlembicPlugin` / Codex host-agent 路由。

## 初步仓库影响

| 仓库 / 窗口 | 初步判断 | 理由 |
| --- | --- | --- |
| Alembic | 参与 / 待调研 | `progressive-chain-validation` skill 目前位于 `Alembic/skills/`；Alembic 也生产 job artifacts、trace envelope 和 metrics。 |
| AlembicCore | 观察 / 待调研 | 若 scorecard / chainNodeId / evidenceRef 成为跨仓库 contract，再考虑下沉；初期不应先做共享 schema。 |
| AlembicAgent | 参与 | 内部 Agent 的 stage policy、analyze / produce 质量、tool calls、Observation Ledger 和 candidate synthesis 是优化对象。 |
| AlembicDashboard | 观察 / 后续参与 | 后续可能展示 baseline / delta / trend；第一版可以先落在 PCV report，不强制 UI。 |
| AlembicPlugin | 无任务 / 观察 | 当前目标是 Alembic internal Agent，不改变 Codex host-agent 入口。 |
| AlembicTest | 参与 | 需要维护可重复 baseline、fixture replay、节点级 comparison 和回归证据。 |
| AlembicDesign | 草案 / 继续设计 | 需要继续把指标语义和 skill 完成定义梳理成 requirement design。 |

## 已知事实

- `docs/workspace/current/llm-input-optimization-research-2026-05-24.md` 已把 `progressive-chain-validation` 写入后续 `GTODO-2026-05-25-003`，作为 Agent / LLM 输入输出优化前置验证框架。
- 同一 research 文档要求后续先形成节点级 baseline，而不是直接改 prompt；并提出 Source Chain Map、BiliDili / AlembicWorkspace 最小节点 fixture、节点级 scorecard 和同一节点 fixture 前后对比。
- `Alembic/skills/progressive-chain-validation/progressive-chain-validation/SKILL.md` 当前强调 source-first plan、one-node-at-a-time execution、node contract、bounded command 和 full run 只能做最终确认。
- `Alembic/skills/progressive-chain-validation/progressive-chain-validation/references/overlays/alembic-coldstart-rescan.md` 已定义 N0-N14 coverage nodes，并明确 full run 不能一次性把多个节点标为通过。
- 该 overlay 的 N11 Produce Guidance Floor 已经有局部 `Recheck metrics`，但还没有把 metric comparison 泛化为所有关键节点的 baseline / scorecard / delta 机制。

## 待补代码事实

- 当前 Wave 4 / Wave 5 产出的 `llmMetrics`、`traceEnvelope`、`artifactRefs` 是否已有足够字段支持 `chainNodeId` / `chainRunId` / `nodeInputRef` / `nodeOutputRef` / `nodeEvidenceRef`。
- `AlembicTest` 当前 test-mode 是否能冻结上游 artifact，单独重放 N9 / N11 / N12 这类节点。
- `progressive-chain-validation` skill 当前是否已有安装 / 发布 / runtime 消费路径，更新 skill 后需要同步到哪里。
- Dashboard 是否已有 job detail / artifact side panel，可后续挂载 comparison 结果，还是第一版只写入 PCV report。

## 外部调研初判

- 是否需要联网：暂不需要。
- 理由：当前需求主要是补齐本地已有 skill 与 Alembic internal Agent 的验证方法，真实约束来自本地 `LLM Input Optimization Research`、PCV skill、Alembic cold-start/rescan overlay 和 Alembic job artifact / trace / metrics 链路。
- 若需要，建议来源：如果后续要把指标模型泛化为正式 eval framework，可再调研 OpenAI Evals / OpenTelemetry / 软件性能 regression scorecard 等权威资料。

## 风险 / 设计分叉

- **单一变小指标风险**：如果只追求 token / latency 下降，Agent 可能减少必要证据，导致质量退化。应先判断 quality gate，再看 loss 是否下降。
- **指标过重风险**：若第一版就要求 Dashboard trend、DB schema、Core contract 和完整 UI，会拖慢真正的 Agent 优化。建议第一版先让 skill / report / AlembicTest baseline 可用。
- **节点过粗风险**：如果 N9 analyze quality 仍包含 tool planning、tool result、ledger、QualityGate 多个边界，可能需要 source-derived split node。
- **证据缺口风险**：如果现有 artifact / trace 不能回放到节点，只能先补 observability，不能伪造 comparison。
- **skill 与产品实现边界风险**：PCV skill 应提供方法和模板，不应把 Alembic 内部实现规则硬编码到核心 workflow；Alembic-specific rules 应留在 adapter / overlay。

## 开放问题

1. 已确认：第一版不做 Dashboard comparison UI，只补 PCV skill / overlay / plan template 和一个 Alembic 节点示例。
2. 已确认：采用 `quality gate + stage_loss` 组合，其中 `stage_loss` 只有在质量门槛满足后下降才表示更好。
3. Design 决定：首个示例节点选 N9 analyze quality。
4. 已确认：允许每个节点有自己的 useful unit，统一 scorecard 结构，第一版不做全局总分。
5. 已确认：PCV 作为 AlembicTest 对 cold-start / rescan 长链路、internal Agent 能力优化和节点级 baseline/comparison 的默认验证入口；不是所有测试的强制入口。
6. 已确认：N9 第一版要求真实 baseline，不强制真实 optimized after；真实 before / after 留给后续第一次 Agent 优化主线。

## 需要确认

本原始计划书不是实现计划。用户已确认以下事项，可进入需求设计草案：

- 第一版以 PCV skill / overlay / report template + 一个 Alembic 节点示例为完成范围。
- 第一版不做 Dashboard comparison UI。
- 接受 `quality gate` 与 `stage_loss` 分离：质量先达标，再优化损耗下降。
- 首个示例节点由 Design 选择 N9 analyze quality。
- 允许每个节点有自己的 useful unit，第一版不做全局总分。
- PCV 成为 AlembicTest 长链路 / Agent 优化类验证的默认入口，但不是所有测试的强制入口。
- N9 示例第一版需要真实 baseline，不强制真实 before / after。

确认前禁止：

- 写执行 wave。
- 建议发送实现窗口。
- 把阶段候选写成派发顺序。
