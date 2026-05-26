# AlembicWorkspace Current Status

更新日期：2026-05-26
总控窗口：AlembicWorkspace
状态：已完成（验证通过，待归档）

## 阅读入口

面向用户的主入口只保留两类：

- 最终目标与阶段确认：说明用户目标、完成定义、阶段顺序和是否需要确认。
- 当前总控计划 / 窗口分派：说明本轮任务包、发送窗口、验收证据和下一步。

本状态页只做短快照。历史回填、归档摘要、Design inbox、测试交流和脚本格式说明属于脚本 / 证据面，默认从 [workspace index](../index.md)、[record map](../workspace-record-map.md)、[scripts README](../../../scripts/README.md) 或当前计划追溯，不在这里重复铺开。

## 状态摘要

- 当前计划：[workspace-control-architecture-refresh-2026-05-26.md](workspace-control-architecture-refresh-2026-05-26.md)。
- Workspace Control Architecture Refresh 已完成验证；总控未派产品子仓库，未派 AlembicTest；旧 037 Stage 1 后续恢复为候选主线。
- Design 来源已同步到 [design-handoff-inbox.md](design-handoff-inbox.md)：`INTENT-RECOGNITION-2026-05-26` 与 `INTENT-KNOWLEDGE-2026-05-26` 共同构成 037；`KNOWLEDGE-EVOLUTION-TODOS-2026-05-26` 只是顺序索引，不作为执行计划。
- Visible Dispatch 本地 runtime 当前 mode disabled，防睡眠 inactive；旧 Wave 9 / Wave 10 smoke 队列已裁决并清理，不会抢跑。
- `GTODO-2026-05-25-003 / PCVM` Wave 4 仍是后续候选，但当前用户指定 037 为下一主线，先不领取 PCVM。

## 当前账本

- 活跃 TODO：[global-todo-board.md](global-todo-board.md)。
- Design handoff inbox：[design-handoff-inbox.md](design-handoff-inbox.md)。
- 测试交流：[alembic-test-exchange.md](alembic-test-exchange.md)。
- 当前短期地图：[index.md](index.md)。

## 当前活跃观察 TODO

当前仍保留观察或下一主线相关事项：

- `GTODO-2026-05-24-037`：下一主线已确认；Stage 1 代码调研和执行计划待启动。
- `GTODO-2026-05-25-005`：VAD 已完成待归档；后续 VAD 问题作为 bug / optimization 入队，不再作为独立抢跑主线。
- `GTODO-2026-05-25-003`：PCVM Wave 4 仍待裁决，当前不与 037 并行领取。
- `GTODO-2026-05-24-030`：多文件夹 ProjectScope 下的 project-level skill visibility mount。
- `GTODO-2026-05-24-038` / `039`：等待 037 阶段结果，不进入本轮自动化。
- `GTODO-2026-05-23-022` / `023`：Dashboard `any` 类型化与 Mermaid async chunk 性能专项。
- 其它低优观察项以 [global-todo-board.md](global-todo-board.md) 为准；本页不重复完整列表。

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 本轮不派发；037 后续再恢复。 |
| `AlembicCore`<br>观察中 | 本轮不派发。 |
| `AlembicAgent`<br>观察中 | 本轮不派发。 |
| `AlembicDashboard`<br>观察中 | 本轮不派发。 |
| `AlembicPlugin`<br>观察中 | 本轮不派发；037 后续再恢复。 |
| `AlembicTest`<br>无任务 | 本轮不需要真实测试窗口。 |
| `BiliDili`<br>无任务 | 不触碰真实项目。 |

## 可复制提示词

发送给：无

```text
本轮不发送给子窗口。由 AlembicWorkspace 总控自执行 workspace 规则、skill、模板、脚本和自动化一致性整理。
```

## 回填区

- 2026-05-25 22:36 CST：用户补充测试节奏规则：测试相关可以交给 `AlembicTest`，但总控已看到具体源码缺口且不需要特殊测试环境时，应先派源仓库修复，再由 Test 做复测 / 环境验证。当前 PCVM Wave 3C / 3D 按此执行：`Alembic` 已先返修并通过总控验收，现在发送 `AlembicTest` 重跑 Test-11。
- 2026-05-25 22:26 CST：总控验收 Test-11 证据有效、结果未通过；失败归口 `Alembic` consumer extraction。当前已创建 Wave 3C 并发送给 `Alembic` 修 `PcvObservabilityLinkage` 对 nested `metadata.pcvNodeEvidence.sourceRefs` 的消费。
- 2026-05-25 21:55 CST：总控验收 `AlembicAgent` 与 `Alembic` Wave 3A 代码侧通过；已创建并发送 `AlembicTest` Test-11，重点验证 Agent nested `metadata.pcvNodeEvidence` 是否被 Alembic job-level carry / artifact API 真实消费。
- 2026-05-25 21:40 CST：`AlembicAgent` 回填 `PCVM-P3A-AGENT-N9-EVIDENCE-LINKAGE` 完成，记录见 [../../AlembicAgent/progressive-chain-validation-n9-observability-linkage-2026-05-25.md](../../AlembicAgent/progressive-chain-validation-n9-observability-linkage-2026-05-25.md)，提交 `7ab94575ed9b475dc57253c88738e1f061a3c547`，验证 `npm run check` 和 targeted tests 均通过。当前 Wave 3A 两侧均已回填，等待总控验收后创建 `AlembicTest` Wave 3B 最小 test-mode 验证单。
- 2026-05-25 21:10 CST：用户确认 Wave 3A 范围，总控已更新当前计划并发送给 `AlembicAgent` 与 `Alembic`；`AlembicCore` 观察，`AlembicTest` 等上游回填后再创建最小 test-mode 验证单。
- 2026-05-25 21:00 CST：总控验收 `AlembicTest` Test-10 重测通过；consumer cleanup 阻塞关闭。N9 `blocked-by-observability-gap` 保留为 Wave 3 producer linkage 缺口。
- 2026-05-25 20:48 CST：`AlembicTest` 重跑 Test-10 最小 consumer cleanup probe 通过；`Alembic` / `AlembicPlugin` 均无 `skills/progressive-chain-validation` path ref / gitlink，PCV source / N9 scorecard fixture 可用，N9 仍保持 `blocked-by-observability-gap`。详细报告见 [../../../AlembicTest/docs/pcv-consumer-cleanup-rerun-2026-05-25.md](../../../AlembicTest/docs/pcv-consumer-cleanup-rerun-2026-05-25.md)。
- 2026-05-25 20:37 CST：总控验收 `Alembic` P1A workflow residual cleanup 通过；独立复核 `git diff --check HEAD^ HEAD`、`git grep -n -- skills/progressive-chain-validation`、submodule status 和残留文本扫描，确认旧内部 PCV workflow path 已清理。
- 2026-05-25 19:57 CST：`Alembic` 与 `AlembicPlugin` consumer cleanup 已通过总控验收；已创建 `Test-2026-05-25-10 / PCVM-P2-Canonical-Source-Baseline` 并发送给 `AlembicTest`。
- 2026-05-25 19:49 CST：`Alembic` 回填 `PCVM-P1-ALEMBIC-SUBMODULE-REMOVAL` 完成，提交 `d99d66d0af14fe6e8a51e683d963028ec9d0679a`；记录见 [../../Alembic/progressive-chain-validation-consumer-cleanup-2026-05-25.md](../../Alembic/progressive-chain-validation-consumer-cleanup-2026-05-25.md)。
- 2026-05-25 18:45 CST：总控复核 PCV 两份引入方式，确认 `Alembic` 与 `AlembicPlugin` 均通过同一 `GxFn/progressive-chain-validation.git` submodule 引入 skill，当前 hash 均为 `a6c371c8b123fc79f218d362cd6bae61a0679d61`。当前路线调整为先在独立 PCV source 开发，再由 `AlembicPlugin` / `Alembic` 更新 submodule pointer。
- 2026-05-25 18:30 CST：按用户要求开始推进 `GTODO-2026-05-25-003 / Progressive Chain Validation Metrics`；总控接收 Design handoff，完成代码实现依赖调研，创建当前目标阶段确认文档。当前发送给无，等待用户确认阶段路线。
- 2026-05-25：按用户要求完成冗余文档收敛。人读主面明确为“最终目标与阶段确认”和“当前总控计划 / 窗口分派”；独立自动化格式契约文档已取消，脚本可读格式收回到 `scripts/README.md` 与模板；本状态页压缩为短快照。
