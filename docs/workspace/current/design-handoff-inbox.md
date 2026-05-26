# Design Handoff Inbox

更新日期：2026-05-26
维护窗口：AlembicWorkspace
来源清单：[AlembicDesign workspace handoff board](../../../AlembicDesign/docs/current/workspace-handoff-board.md)

## 定位

本文件由 `scripts/import-design-handoffs.mjs --write` 从 AlembicDesign 清单生成，用于提醒总控有哪些 Design 正规需求已准备接收。它不是全局 TODO，也不是执行计划；总控接收后仍需正式写入 `global-todo-board`、当前计划 `TODO / Backlog` 或需求目录，并按当前主线、优先级、依赖和目标阶段确认推进。

## 待总控接收

| ID | 标题 | 优先级 | 当前主线关系 | 建议 TODO | 原始计划 | 需求设计 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PCVM-2026-05-25 | Progressive Chain Validation Metrics | P0-after-current | 下一主线候选；不打断当前 LLM 输入优化 Test-08 | 建议并入 `GTODO-2026-05-25-003`，当前主线完成后由总控做代码事实调研和目标阶段确认 | [original-plan](../../../AlembicDesign/docs/current/progressive-chain-validation-metrics-original-plan-2026-05-25.md) | [requirement-design](../../../AlembicDesign/docs/current/progressive-chain-validation-metrics-requirement-design-2026-05-25.md) | 总控接收评审；正式入账后补代码事实调研，不直接派发实现窗口 |
| INTENT-RECOGNITION-2026-05-26 | Intent Recognition Episode Continuity | P1-first-in-sequence | `GTODO-2026-05-24-037` 第一阶段；与 `INTENT-KNOWLEDGE-2026-05-26` 共同构成完整 037；本轮只做 037 | 建议总控先调研 Plugin host facts、episode 存储和 Alembic resident local Qwen 限时路径 | [original-plan](../../../AlembicDesign/docs/current/intent-recognition-episode-continuity-original-plan-2026-05-26.md) | [requirement-design](../../../AlembicDesign/docs/current/intent-recognition-episode-continuity-requirement-design-2026-05-26.md) | 总控接收评审；037 可进入自动化处理；先做代码事实调研和目标阶段确认，不派 038 / 039 |
| INTENT-KNOWLEDGE-2026-05-26 | Plugin Intent Knowledge Route | P1-after-recognition | `GTODO-2026-05-24-037` 第二阶段；依赖 `INTENT-RECOGNITION-2026-05-26`；本轮只做 037 | 建议总控作为 037 同一目标的下游阶段接收，待识别产物稳定后再派发消费链路 | [original-plan](../../../AlembicDesign/docs/current/plugin-intent-knowledge-route-original-plan-2026-05-26.md) | [requirement-design](../../../AlembicDesign/docs/current/plugin-intent-knowledge-route-requirement-design-2026-05-26.md) | 总控接收评审；与 `INTENT-RECOGNITION-2026-05-26` 放入同一 037 目标阶段确认；不派 038 / 039 |

## 接收边界

- 自动生成只负责发现和校验，不自动派发实现窗口。
- `ready-for-workspace` 条目进入总控后，必须先判断是否影响当前主线。
- 不影响当前主线的完整需求默认进入正式 TODO / Backlog 或需求目录；当前主线完成后再按优先级领取。
- 影响当前主线的条目必须标为阻塞 / 待确认 / 返修候选，不得绕过总控确认门禁。

## 统计

- Ready for workspace：3
- Accepted by workspace：1
- Other statuses：1
- Validation issues：0

## 全部 Design 清单条目

| ID | 状态 | 标题 |
| --- | --- | --- |
| PCVM-2026-05-25 | ready-for-workspace | Progressive Chain Validation Metrics |
| ARTIFACT-DRAWER-2026-05-25 | accepted-by-workspace | Timeline Artifact Recipe Drawer Optimization |
| KNOWLEDGE-EVOLUTION-TODOS-2026-05-26 | draft | Knowledge Evolution TODOs Sequence Index |
| INTENT-RECOGNITION-2026-05-26 | ready-for-workspace | Intent Recognition Episode Continuity |
| INTENT-KNOWLEDGE-2026-05-26 | ready-for-workspace | Plugin Intent Knowledge Route |
