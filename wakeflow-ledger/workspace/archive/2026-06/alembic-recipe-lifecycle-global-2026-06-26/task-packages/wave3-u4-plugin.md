# 任务包 波3 · u4-plugin — decay 第4 sweep driver + lifecycleStateMachine 接线（U4 消费侧）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicPlugin**（消费 Core，禁改 Core）
- 前置：**U4-Core 已接受+落地**（dde34d4：DecayDetector authority /5 + ??2.5 + cold-start grace + `scanAll(cap)` + tick 直走 transition `trigger='decay-detection'`）。本卡=把 decay 检测接成 Plugin sweep 的**第4 driver**（现有 3 driver=staging promote / checkTimeouts / proposal execute，来自 lifecycle-automation-followup）。**独立任务**（不需 D2，CG-7）。
- Baseline: AlembicPlugin@**3915d8e**（u5-plugin-2 后）。消费 Core@**a96c4ee 或更新**。**落地前复核 HEAD 行号**。
- 权威依据：设计 `Design/docs/current/alembic-recipe-lifecycle-global-2026-06-26.md` **§U4 + readiness banner（断点 DecayDetector 量纲已 U4-Core 修）+ 强制串 U4-Core→U5-Core（已完成）**。先读 §U4 定位 driver 接线点。

## 身份门（先做）
确认目录=AlembicPlugin、任务属 AlembicPlugin。读 `../CLAUDE.md` + active index + state root（本包 + 设计 §U4 + lifecycle-automation-followup 归档的 sweep 3-driver 结构）+ 本仓 `CLAUDE.md`。声明身份。

## 范围（Plugin 消费侧；落地前复核 HEAD file:line）
| # | 点（复核 HEAD） | change | 怎么改 |
|---|---|---|---|
| d1 decay 第4 driver | Plugin sweep（`staging-access-sweep.ts` runSweep / KnowledgeModule sweep 编排，现 3 driver） | **add** | sweep 在现有 driver 后加第4：调 Core `DecayDetector.scanAll(cap)` → tick 直走 transition（U4-Core 已实现 `trigger='decay-detection'`）。cap 沿用 sweep 既有 cap 模式（caller-limited）。 |
| d2 lifecycleStateMachine 注入 | `KnowledgeModule`（DI 容器） | **wire** | 把 `lifecycleStateMachine` 注入到 decay driver 调用链（使 decay→transition 记 lifecycle_transition_events）。**先核现状**：lifecycle-followup 已注册哪些、不重复、不破坏。 |
| d3 stale 注释订正 | `staging-access-sweep.ts:137/251-252`（"P3 本次不接线" 等过时注释） | **fix** | P3（proposal 执行）自 lifecycle-followup 已接线，订正这些过时注释为现状（避免误导）。**复核行号+实际注释文本**。 |

## 验收（设计 §U4；真机 decay→deprecate 端到端→U7）
1. **decay driver 接通**[unit]：sweep 跑一轮 → DecayDetector.scanAll(cap) 被调、decay 命中 recipe 经 tick 直走 transition（`trigger='decay-detection'`）记 lifecycle_transition_events；cap 有界。
2. **lifecycleStateMachine 注入**[unit/grep]：decay driver 拿到 lifecycleStateMachine 实例（非 undefined）；与既有 driver 注入不冲突。
3. **注释订正**[grep]：staging-access-sweep.ts 无 "P3 本次不接线" 类过时注释（订正为现状）。
4. **零新回归 + 门禁**：Node≥22 `build:check`（记消费 Core commit）+ 全量 unit failed-set 与 baseline 3915d8e 无新增 + `lint:repo-boundary`/`lint:core-import-boundary`/`report:agent-extraction-boundary` 不新增违规。

## 跨仓与提交纪律
- 改本仓 live 源；禁改 Core/vendor；仅经 `@alembic/core` 消费 DecayDetector/lifecycleStateMachine。提交 main 不 push/tag/bump。回填记消费的 Core commit。

## 禁止
- 不改 Core/vendor；不破坏 exports/排序/状态机/持久化；decay cap 须有界（caller-limited，不无界全扫）；不重复既有 driver 注入；不引 daemon。

## 回填（TargetResultEnvelope）
完成范围、commit hash、消费的 Core commit、build:check/lint/unit 输出、decay driver 接通(scanAll(cap)+transition)、lifecycleStateMachine 注入、注释订正 grep、零新回归 diff。**evidenceRefs path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
