# Workspace Current Docs

状态：短期工作区入口
更新日期：2026-05-26

## 定位

本目录只保存当前工作面和短期协作文档。人读主入口是当前总控计划；其它文件是 TODO、Design handoff、测试交流或脚本同步面。

已完成的历史 wave、调研和旧目标确认不继续堆在当前区，统一从 [workspace record map](../workspace-record-map.md) 或 [archive](../archive/) 追溯。

## 当前地图

| 类型 | 文档 | 说明 |
| --- | --- | --- |
| 当前状态 | [workspace-current-status.md](workspace-current-status.md) | 短状态快照、发送名单和当前账本入口。 |
| 当前计划 | [visible-automation-dispatch-unattended-controller-wave-0-2026-05-26.md](visible-automation-dispatch-unattended-controller-wave-0-2026-05-26.md) | Visible Automation Dispatch unattended controller Wave 0：workspace 脚本 / skill / 文档治理。 |
| GTODO 037 Intent Recognition Design | [../../../AlembicDesign/docs/current/intent-recognition-episode-continuity-requirement-design-2026-05-26.md](../../../AlembicDesign/docs/current/intent-recognition-episode-continuity-requirement-design-2026-05-26.md) | 037 第一阶段 Design handoff，已由总控接收进入 Wave 0 代码事实基线。 |
| GTODO 037 Intent Knowledge Design | [../../../AlembicDesign/docs/current/plugin-intent-knowledge-route-requirement-design-2026-05-26.md](../../../AlembicDesign/docs/current/plugin-intent-knowledge-route-requirement-design-2026-05-26.md) | 037 第二阶段 Design handoff，等待识别与 episode 基线稳定后推进。 |
| VAD 目标阶段确认 | [visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md](visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md) | Visible Automation Dispatch 目标、完成定义、阶段顺序和确认记录。 |
| VAD 原始计划书 | [../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md](../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md) | Visible Automation Dispatch 原始目标和约束。 |
| VAD 需求设计 | [../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md](../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md) | Visible Automation Dispatch 需求设计和阶段候选。 |
| VAD Unattended Controller 需求设计 | [../../requirement-designs/visible-automation-dispatch/unattended-controller-requirement-design-2026-05-26.md](../../requirement-designs/visible-automation-dispatch/unattended-controller-requirement-design-2026-05-26.md) | 已确认进入实现的 VAD 无人值守总控增强需求设计。 |
| VAD 代码实现依赖调研 | [../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md](../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md) | Visible Automation Dispatch 本地脚本、运行态和 automation 工具边界调研。 |
| PCVM Alembic nested evidence consumer extraction 回填 | [../../Alembic/progressive-chain-validation-n9-observability-linkage-2026-05-25.md](../../Alembic/progressive-chain-validation-n9-observability-linkage-2026-05-25.md) | `Alembic` commit ae9531ac3315a4491e22e3df156cb05e13fc0879 已通过总控验收，nested evidence consumer extraction 缺口关闭。 |
| VAD Test-12 | [alembic-test-exchange.md](alembic-test-exchange.md) | Single-window visible heartbeat 验证已回填；结论已收窄为目标 heartbeat 后续专项证据。 |
| PCVM AlembicAgent N9 evidence producer 回填 | [../../AlembicAgent/progressive-chain-validation-n9-observability-linkage-2026-05-25.md](../../AlembicAgent/progressive-chain-validation-n9-observability-linkage-2026-05-25.md) | `AlembicAgent` node-local N9 evidence producer 已通过总控代码侧验收；Test-11 已证明 nested evidence 可读。 |
| PCVM Alembic N9 observability carry 回填 | [../../Alembic/progressive-chain-validation-n9-observability-linkage-2026-05-25.md](../../Alembic/progressive-chain-validation-n9-observability-linkage-2026-05-25.md) | `Alembic` job-level N9 observability carry 已通过总控代码侧验收；Test-11 证明还需消费 nested `metadata.pcvNodeEvidence.sourceRefs`。 |
| PCVM Alembic workflow cleanup | [../../Alembic/progressive-chain-validation-workflow-cleanup-2026-05-25.md](../../Alembic/progressive-chain-validation-workflow-cleanup-2026-05-25.md) | `Alembic` workflow 残留 path ref 清理已通过总控验收。 |
| PCVM Test-01 | [alembic-test-exchange.md](alembic-test-exchange.md) | `AlembicTest` 重测证据已通过总控验收；`Alembic` workflow 残留已关闭，consumer cleanup probe 通过。 |
| PCVM AlembicPlugin consumer cleanup 回填 | [progressive-chain-validation-metrics-wave-0-2026-05-25.md](progressive-chain-validation-metrics-wave-0-2026-05-25.md) | `AlembicPlugin` 内部 PCV submodule 删除已通过总控验收。 |
| PCVM Alembic consumer cleanup 回填 | [../../Alembic/progressive-chain-validation-consumer-cleanup-2026-05-25.md](../../Alembic/progressive-chain-validation-consumer-cleanup-2026-05-25.md) | `Alembic` 内部 PCV submodule gitlink 已删除；CI / release workflow 旧 path ref 已由 P1A 独立回填。 |
| PCVM Wave 0 source 验收 | [progressive-chain-validation-metrics-wave-0-2026-05-25.md](progressive-chain-validation-metrics-wave-0-2026-05-25.md) | PCV source commit badbf0aa23bbaaff2cf185491a6785a61b74c1d8 已通过总控验收；Alembic workflow cleanup 也已通过总控验收，Test-01 最小重测已通过总控验收。 |
| PCVM 目标阶段确认 | [progressive-chain-validation-metrics-goal-stage-confirmation-2026-05-25.md](progressive-chain-validation-metrics-goal-stage-confirmation-2026-05-25.md) | 已确认 PCV canonical source 独立拉出和 Wave 0 / Wave 1 阶段路线。 |
| 当前目标阶段确认 | [progressive-chain-validation-metrics-goal-stage-confirmation-2026-05-25.md](progressive-chain-validation-metrics-goal-stage-confirmation-2026-05-25.md) | `GTODO-2026-05-25-003 / Progressive Chain Validation Metrics` 目标、完成定义、阶段顺序和窗口覆盖确认。 |
| PCVM 代码实现依赖调研 | [../../requirement-designs/progressive-chain-validation-metrics/code-implementation-dependency-research-2026-05-25.md](../../requirement-designs/progressive-chain-validation-metrics/code-implementation-dependency-research-2026-05-25.md) | 支撑 PCVM 当前分派的本地代码事实、边界和 producer / consumer 顺序。 |
| 当前并行分派 | [artifact-drawer-parallel-dispatch-2026-05-25.md](artifact-drawer-parallel-dispatch-2026-05-25.md) | LLM Wave 6 已验收，Artifact Drawer 已由 `AlembicDashboard` 回填并通过总控验收，当前无可发送窗口。 |
| Artifact Drawer Dashboard 回填 | [../../AlembicDashboard/timeline-artifact-drawer-optimization-dashboard-2026-05-25.md](../../AlembicDashboard/timeline-artifact-drawer-optimization-dashboard-2026-05-25.md) | `ARTIFACT-DRAWER-P1-DASHBOARD-DRAWER-STACK` 回填与总控验收结论。 |
| Design Handoff Inbox | [design-handoff-inbox.md](design-handoff-inbox.md) | 脚本从 AlembicDesign handoff board 导入的接收候选；037 两个 ready handoff 已由当前计划接收，PCVM 仍保留为后续候选。 |
| 全局 TODO | [global-todo-board.md](global-todo-board.md) | 活跃 / 观察 TODO；已完成项从长期记录地图或归档查询。 |
| 测试交流 | [alembic-test-exchange.md](alembic-test-exchange.md) | 当前 AlembicTest 任务和回填证据入口。 |
| LLM 输入优化归档 | [../archive/2026-05/llm-input-optimization/](../archive/2026-05/llm-input-optimization/) | 已完成调研与 Wave 1-6 历史正文。 |
| Multi-root ProjectScope 归档 | [../archive/2026-05/multi-root-project-scope/](../archive/2026-05/multi-root-project-scope/) | 已完成目标确认与 Wave 1-5 历史正文。 |

长期入口：[workspace index](../index.md)；历史入口：[workspace record map](../workspace-record-map.md)。
