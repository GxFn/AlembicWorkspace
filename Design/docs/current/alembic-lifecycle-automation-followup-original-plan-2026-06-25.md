# Alembic 产物化生命周期自动化补全 — Original Plan

Date: 2026-06-25
Design Key: alembic-lifecycle-automation-followup-2026-06-25
Source Window: Design
Status: ready-for-intake

## 背景

`alembic-recipe-productization-optimization` 验收通过,但独立复核发现 PDR-3 删 daemon 后的 daemon-less 化只补了三分之一(autoApprovable staging→active)。还剩三处真实残留:tick 无计数上限(查询无 LIMIT、2s 超时不挡后台 work)、`checkTimeouts` 孤儿(卡死 evolving 不恢复 / pending·decaying 不 GC)、proposal 执行段整体孤儿(proposal 创建活但永卡 observing、merge/supersede 不可达)、vendor 快照仍含死配置。

## 用户目标

把丢失的剩余生命周期/进化自动化 daemon-less 补全:tick 有界、卡死状态自动恢复/GC、proposal 真正执行(让 evolution/consolidation 链路活起来)、发布前刷 vendor 快照。不重引 daemon、不放松判定门禁。

## 范围

- AlembicCore:查询 limit、cap、checkTimeouts、ProposalExecutor 执行。
- AlembicPlugin:tick 扩展、init 一次性信号订阅、vendor 刷新。
- Test:到期 staging/evolving/pending/decaying + observing proposal 的有界流转 e2e。
- 不含:重引 daemon;放松进化判定门禁;checkTimeouts 触碰 staging。

## 完成定义

1. tick 有真实计数上限 + 查询 LIMIT,大积压有界排空;
2. checkTimeouts 被驱动(evolving 7d 恢复 + pending/decaying 30d GC);
3. proposal 经信号/兜底真正执行(merge/enhance/supersede),不卡 observing;
4. vendor 快照发布前刷到含死配置删除的 Core commit;
5. 不重引 daemon、判定门禁完好;e2e 跑通。

## 阶段候选

P1 tick 有界化 → P2 驱动 checkTimeouts → P3 驱动 proposal 执行 → P4 vendor 快照(发布期)→ Test e2e。

## 待决策(intake confirm)

- P3 proposal 执行驱动 = 双轨(init 一次性 subscribeToSignals 即时 + tick 内有界 checkAndExecute 兜底)推荐 vs 仅其一。

## 非目标

不重引 daemon;不放松进化/生命周期判定;checkTimeouts 不触 staging;tick 不做无界全表扫描。

## 详细设计

见 [requirement design](alembic-lifecycle-automation-followup-2026-06-25.md)。前置 [alembic-recipe-productization-optimization-2026-06-25](alembic-recipe-productization-optimization-2026-06-25.md)。
