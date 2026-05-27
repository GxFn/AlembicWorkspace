# Knowledge Evolution TODOs 顺序讨论索引

Design Key：KNOWLEDGE-EVOLUTION-TODOS-2026-05-26
日期：2026-05-26
状态：draft / 顺序讨论索引
维护窗口：AlembicDesign
总控：AlembicWorkspace
原始计划：[knowledge-evolution-todos-original-plan-2026-05-26.md](knowledge-evolution-todos-original-plan-2026-05-26.md)

## 定位

本文不是一个可执行需求，也不是交给总控自动领取的任务包。它只保存用户纠偏后的推进顺序：先讨论 `GTODO-2026-05-24-037`，把 037 推进到可执行计划；再根据 037 的结论讨论 038；最后讨论 039。

## 纠偏记录

Design 先前把用户目标误读为“整理三个 TODO 的自动化领取字段”。用户已明确纠正：本轮要按顺序讨论这几个 TODO，把需求推进到可执行计划。

因此：

- `KNOWLEDGE-EVOLUTION-TODOS-2026-05-26` 仅作为顺序讨论索引。
- `INTENT-RECOGNITION-2026-05-26` 和 `INTENT-KNOWLEDGE-2026-05-26` 共同构成当前已完成的 037 需求设计输入；前者解决意图怎么得到，后者解决意图如何进入知识链路。
- 038 / 039 暂不 ready，不应被总控或自动化领取。

## 用户最终确认

2026-05-26 用户确认：

- 不对 Codex 强制要求传 `hostDeclaredIntent`；Codex 可尽力传，Plugin 仍需自行提取、合并和校验。
- 低置信度时 `prime` 可以不强行注入，应降级、减少注入或要求确认。
- 本地千问之前测试速度较快，且相对关键词搜索对长句效果更好；037 可以把本地千问作为快速 refinement 路径，但不能阻塞 deterministic fallback。
- 037 已足够进入自动化处理；本轮先只做 037，不启动 038 / 039。

## 顺序与依赖

| 顺序 | Source TODO | 推荐 Design Key | 当前状态 | 依赖判断 |
| --- | --- | --- | --- | --- |
| 1 | `GTODO-2026-05-24-037` | `INTENT-RECOGNITION-2026-05-26` + `INTENT-KNOWLEDGE-2026-05-26` | ready-for-workspace / automation-ready | 后续知识进化上游；两个 Design Key 都交给总控接收评审，但执行顺序先识别后消费。本轮只允许自动化领取 037。 |
| 2 | `GTODO-2026-05-24-038` | `FILE-MONITOR-EVOLUTION-2026-05-26` | not-started | 等 037 的 intent / evidence 语义明确后讨论。 |
| 3 | `GTODO-2026-05-24-039` | `PLUGIN-FALLBACK-EVOLUTION-2026-05-26` | not-started | 等 037 明确后讨论，且不能复制 038 的 daemon file monitor。 |

## 当前可交给总控的事项

建议作为同一个 037 目标交给总控接收：

- Design Key：`INTENT-RECOGNITION-2026-05-26`
- Design Key：`INTENT-KNOWLEDGE-2026-05-26`
- Source TODO：`GTODO-2026-05-24-037`
- 文档：
  - [intent-recognition-episode-continuity-original-plan-2026-05-26.md](intent-recognition-episode-continuity-original-plan-2026-05-26.md)
  - [intent-recognition-episode-continuity-requirement-design-2026-05-26.md](intent-recognition-episode-continuity-requirement-design-2026-05-26.md)
  - [plugin-intent-knowledge-route-original-plan-2026-05-26.md](plugin-intent-knowledge-route-original-plan-2026-05-26.md)
  - [plugin-intent-knowledge-route-requirement-design-2026-05-26.md](plugin-intent-knowledge-route-requirement-design-2026-05-26.md)

总控下一步建议：接收 037 后，先做 Plugin host facts、IntentEpisode 存储、本地千问限时 refine、以及 Alembic knowledge route 消费点的代码事实调研，再确认目标阶段；不要直接派发 038 / 039。

自动化领取建议：仅将 `GTODO-2026-05-24-037` 作为可领取对象；038 / 039 保持未 ready，不进入自动化队列。

## 037 分阶段执行建议

用户于 2026-05-26 补充：037 链路较长，必须拆解为合理的多个阶段慢慢执行，最后使用 `AlembicTest` 做真实验证。Design 建议总控不要把 037 合并成单个大 wave，而应按以下阶段逐步验收：

| 阶段 | 名称 | 主要目标 | 主要仓库 / 窗口 | 阶段验收 |
| --- | --- | --- | --- | --- |
| 0 | 代码事实与基线 probe | 确认 `prime` schema、MCP request metadata、session、search、resident、vector、source refs 当前真实链路。 | 总控主导，必要时 Plugin / Alembic 协助 | 输出代码事实和最小验证，不改功能。 |
| 1 | 意图提取入口 | 新增 `hostDeclaredIntent` / `hostTurnMeta` 输入边界，构建 `IntentExtractionFrame`，不先接搜索。 | AlembicPlugin | deterministic unit 覆盖槽位、置信度、冲突。 |
| 2 | Episode 管理 | `IntentEpisode` 持久化、跨会话续接、correction / supersede / background 管理。 | AlembicPlugin，必要时 Alembic 存储协助 | 两次 prime 可识别 continue / correction，并保留 evidence。 |
| 3 | 检索计划 | 由 intent 生成 `IntentSearchPlan`，接入 keyword / BM25 query plan，保留 source path。 | AlembicPlugin / Alembic | 同 raw query 不同 intent 能产生不同 query plan 和 whySelected。 |
| 4 | 向量与关联增强 | intent semantic anchors 参与 vector cosine，relation expansion 参与 score breakdown。 | Alembic / AlembicCore 视代码事实决定 | 输出 raw cosine、intent cosine、relation boost，且可解释。 |
| 5 | Prime 交付包 | `PrimeInjectionPackage` 汇总 intent、search、vector、relations、selectedKnowledge、omitted、source refs 和 injection summary。 | AlembicPlugin + Alembic | prime 返回统一交付包，能复核为什么注入 / 未注入。 |
| 6 | 真实验证 | 使用真实项目和真实多会话流程验证 prime 注入价值。 | AlembicTest | 真实项目证据：跨会话、纠偏、搜索增强、向量增强、源路径保留、注入摘要可用。 |

阶段原则：

- 每阶段只验收本阶段新增能力，不把后续阶段缺口包装成当前失败。
- Stage 1 / 2 必须先保证意图准确与可管理，再进入搜索增强。
- Stage 3 先完成关键词 / BM25 可解释增强；Stage 4 再引入向量 cosine 与关联扩展。
- Stage 6 才交给 `AlembicTest` 做真实项目验证；此前的 schema、unit、probe、targeted integration 默认由总控 / 实现窗口完成。
- 038 / 039 仍等待 037 至少完成 Stage 1-3 的边界确认后再继续讨论。

## 038 的后续讨论入口

037 被总控接收并完成代码事实调研后，再讨论 `GTODO-2026-05-24-038`：

- Alembic daemon file monitor 的真实生产方和消费方。
- file change 如何触发 evolution candidate，而不是旧 VSCode 插件模式。
- file event 与 037 intent / evidence 的关系。
- 何时需要 Core contract。
- 验证是否需要 AlembicTest 真实项目、cold-start / rescan 或运行时监控证据。

## 039 的后续讨论入口

038 或至少 037 语义明确后，再讨论 `GTODO-2026-05-24-039`：

- Plugin 无 Alembic file monitor 时能使用哪些 host-agent 信号。
- diff、Guard、search、submit 结果如何形成机会式 evolution proposal。
- fallback 是否只做建议 / shout，还是允许 submit knowledge。
- 如何保证不复制 Alembic daemon file monitor，也不绕过 ProjectScope。

## 禁止事项

- 不把本索引交给总控当作执行计划。
- 不把 038 / 039 标为 ready-for-workspace。
- 不让自动化并行领取 037 / 038 / 039。
- 不在 037 语义明确前为 038 / 039 自定义 intent。
- 不修改 workspace 当前状态或全局 TODO。

## 建议总控下一步

接收并评审 `INTENT-RECOGNITION-2026-05-26` 与 `INTENT-KNOWLEDGE-2026-05-26`。若总控认可 037 设计，再由总控决定是否将 037 转入目标阶段确认、代码事实调研或后续 wave 准备。038 / 039 暂保持待讨论。
