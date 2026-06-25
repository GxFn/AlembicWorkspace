# AlembicPlugin 双宿主架构重构与层级建设 Workspace Signal

Date: 2026-06-19
Status: **已解锁（daemon-removal 清理已由总控完成 2026-06-19）→ 转入需求设计**；正式需求文档：
`alembic-plugin-dual-host-architecture-refactor-2026-06-19.md`（调查中）。本 signal 保留作历史/触发记录。
Source Window: Design
Receiving Window: Wakeflow
Design Key: alembic-plugin-dual-host-architecture-refactor-2026-06-19

## Signal Type

requirement-candidate（排队中，前置依赖未满足前不 intake、不启动设计）

## Summary

AlembicPlugin 作为 **Codex + Claude Code 双宿主插件**的职责整体架构重构与层级关系建设。**硬前置依赖：总控先完成
`alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18` 的清理删除**；该清理会大幅改变 Plugin 结构（删完整
daemon、intake 整层、治理 Gateway、HitRecorder/FileChangeHandler 等），故本架构重构**必须基于清理后的终态代码**测绘与设计，
现在不启动。

## User Goal Or Decision

- 在 Plugin 净化（daemon-removal）完成后，重构 AlembicPlugin 的**整体职责架构**并**建设层级关系**，使其作为
  **Codex 与 Claude Code 两个宿主**的插件，职责清晰、层级分明。
- 决策（用户 2026-06-19）：**等总控完成 Plugin 清理删除，然后开始**本重构——明确的"先清理、后重构"顺序。

## Current Mainline Relation

- Relation: `after-current`
- Should interrupt current mainline: **no**
- Reason: 硬依赖于 daemon-removal 净化完成；重构对象是清理后的 Plugin 终态。提前设计=对着即将作废的结构做，白做且误导。
  可与主体净化（`alembic-main-capability-inventory-cleanup-2026-06-19`，独立仓）并行排程，但本项的启动门槛是 Plugin 清理 done。

## Evidence

- User description: "等待总控完成 AlembicPlugin 的清理删除，然后开始 AlembicPlugin 作为 codex 和 Claude Code 插件的
  职责整体架构重构与层级关系建设。"
- 已知背景（既成事实，无需重测）：daemon-removal 后 Plugin = 纯 MCP 非强进程（McpServer/HostMcpServer 两表面、同进程调
  Core、本地阶段缓存、经 Core 接口/状态对接主体）；MTC 命名整改已落地（de-codex/Host* 等）；存在 Alembic↔Plugin 共享资产
  漂移门禁（工具契约段为有意分叉）；host 抽象现状有缺口（hostShape auto=claude-code 但 ALEMBIC_PLUGIN_HOST 硬编码 codex，
  见 memory [[alembic-cc-plugin-dev-install]]）。
- Code evidence: **pending** —— 架构层级测绘待 daemon-removal 清理完成后基于终态代码进行。
- Evidence status: pending-research（待上游清理完成）

## 预期范围骨架（待清理后真实代码测绘细化，非现定稿）

- **双宿主职责边界**：Codex 宿主 vs Claude Code 宿主在 Plugin 内的差异面与共用面（host adapter / hostShape /
  ALEMBIC_PLUGIN_HOST 抽象统一，消除硬编码 codex 缺口）。
- **层级关系建设**：MCP 表面（两表面）↔ Core 消费 ↔ host 适配层 ↔ 本地阶段缓存 ↔ 经 Core 的主体对接——各层职责与依赖方向。
- **与 daemon-removal 终态衔接**：纯 MCP 非强进程模型下的层级收口；不回退已删能力。
- **共享资产/漂移门禁**：双宿主分叉与共享段的层级归位。
（以上为方向骨架；具体模块/调用链/删改面待清理后测绘。）

## Recommended Owner

| Candidate Window | Recommendation | Reason |
| --- | --- | --- |
| Wakeflow | queue / review（暂不 intake） | 排队；待 daemon-removal 清理 done 再 intake 启动 |
| Design | continue-design（清理完成后） | 届时由 Design 基于终态代码测绘 + 出需求设计 + handoff |
| AlembicPlugin | no-task（现阶段） | 先执行 daemon-removal 清理；本重构待其完成 |
| Test | no-task（现阶段） | — |

The recommendation is not a dispatch decision.

## Suggested TODO / Backlog

| ID | Type | Priority | Owner Candidate | Item / Goal | Dependency / Trigger |
| --- | --- | --- | --- | --- | --- |
| alembic-plugin-dual-host-architecture-refactor-2026-06-19 | requirement-candidate | P2 | Design→Wakeflow | Plugin 双宿主（Codex+Claude Code）职责架构重构 + 层级建设 | **Trigger: daemon-removal 清理删除完成** |

## Open Questions

1. daemon-removal 清理的最终落地范围/终态（直接决定本重构的起点代码）。
2. 双宿主层级与职责的目标形态（待清理后测绘 + 与用户确认）。
3. 与主体净化（独立仓）是否需协调（共享资产漂移门禁的双侧时序）。

## Pre-Handoff Checklist

- Checked `docs/workspace-alignment-checklist.md`: 是（Design 边界内，无源码改动 / 派发 / 状态写）。
- This signal does not mutate workspace current status or Global TODO: 是。
- This signal does not contain copyable implementation-window prompts: 是。
- Recommended owner is advice only, not dispatch: 是。
- 受阻于上游、未启动设计、Code evidence pending 已明确标注: 是。
