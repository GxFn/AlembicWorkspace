# alembic-lifecycle-automation-followup-2026-06-25 — 补全 PDR-3 删 daemon 后剩余的 daemon-less 自动化:tick 有界化(计数上限+查询LIMIT)、驱动孤儿 checkTimeouts(evolving恢复/pending·decaying GC)、驱动孤儿 proposal 执行(信号订阅+兜底,让 merge/supersede 活起来)、发布期刷 vendor 快照。前置 productization 需求已补 staging→active

> State-root index. Generated from wakeflow-state.json (revision 40, event evt-20260625191032-0040). Regenerate with wakeflow-render-progress; do not hand-edit.

## Core records

- [demand.json](demand.json) — immutable demand record
- [wakeflow-state.json](wakeflow-state.json) — authoritative state machine (state: dispatched, revision 40)
- [controller-events.jsonl](controller-events.jsonl) — append-only controller event log
- [projection.json](projection.json) — machine-readable projection + structured slices
- [developer-progress.md](developer-progress.md) — human progress document

## Task packages

- `p1-core-tick-bounding` (accepted) — P1-Core tick 有界化基础（producer）：findAllByLifecycles + ProposalRepository.find 增可选 limit；StagingManager.checkAndPromote 增可选 cap N（capped 时最旧优先 + 查询带 LIMIT，未传参=今日行为字节一致）。判定门禁零改、不重引 daemon、不接线 checkTimeouts/checkAndExecute 驱动（P2/P3）。验收 Node22 build:check+新单测(cap 生效/多 tick 排空/无 cap 仍无界/capped 带 limit)+全量无回归，提交 main 回填原始证据。
- `p1-plugin-sweep-cap` (accepted) — P1-Plugin runSweep 透传 cap（consumer）：staging-access-sweep.ts 的 runSweep 改调 checkAndPromote(cap)，cap 从 env(建议 ALEMBIC_STAGING_ACCESS_SWEEP_CAP)读、默认 50、实现为 P2/P3 复用的共享 sweep 上限；StagingManagerLike 接口对齐 checkAndPromote(cap?)；信封(inFlight/throttle/2s)不变；不接线 checkTimeouts/checkAndExecute(P2/P3)、不重引 daemon、门禁未触。前置 P1-Core 54dd9bb 已验收+控制器已重建 Core dist(新签名可见)。验收 Node22 build:check+sweep 单测(cap 默认50/env 覆盖)+全量无回归，提交 main，回填 path-like evidenceRefs。
- `p2-core-checktimeouts-cap` (accepted) — P2-Core checkTimeouts 有界化（producer）：LifecycleStateMachine.checkTimeouts(cap?) 加可选 cap，cap 时走带 limit 查询(复用 P1 findAllByLifecycles limit)、推荐跨状态共享 remaining 预算使单 tick 扫描+迁移 ≤cap、最旧优先、跨 tick 排空；未给 cap 仍无界。硬不变量：checkTimeouts 绝不碰 staging(仅 evolving→active/pending·decaying→deprecated)、迁移仍经 transition(Guard+lifecycle_transition_events)、阈值/目标态/判定零改、不重引 daemon、不接线 sweep 驱动(P2-Plugin)/不动 proposal(P3)。验收 Node22 build:check+新单测(evolving 恢复记事件/pending·decaying GC/staging 不碰/cap 生效带 LIMIT/无 cap 无界)+npm run build emit dist+全量无回归，提交 main，path-like evidenceRefs。
- `p2-plugin-sweep-checktimeouts` (accepted) — P2-Plugin sweep 接线 checkTimeouts（consumer）：runSweep 在 checkAndPromote(cap) 后加 container.get('lifecycleStateMachine').checkTimeouts(cap)（ducktyping LifecycleStateMachineLike），复用 P1 的 resolveStagingAccessSweepCap 共享 cap、同一 try/catch+inFlight/throttle/2s 信封内；可选 additive timeout 计数。不接线 checkAndExecute/subscribe(P3)、不改既有结果字段、不重引 daemon、门禁未触。前置 P2-Core b557b10 已验收+dist 含 checkTimeouts(cap?)。验收 Node22 build:check+sweep 单测(checkTimeouts 以 cap 调用)+全量无回归，提交 main，path-like evidenceRefs。
- `p3-core-checkandexecute-cap` (accepted) — P3-Core checkAndExecute 有界化（producer，最后 Core 变更）：ProposalExecutor.checkAndExecute(cap?) 加可选 cap，cap 时走带 limit 查询(复用 P1 ProposalRepository.find limit)+最旧优先(防饿死，推荐给 find 加 additive oldestFirst/order 选项、默认仍 desc)、单 tick≤cap、跨 tick 排空；未给 cap 无界。subscribeToSignals(:85)已幂等无需改。硬不变量：判定门禁完全不动(evaluateUpdate 需 usage/evaluateDeprecate recovered→reject/§9.1/transition Guard 全保留，cap 只限处理多少不改是否通过，须测试证不合格仍 reject)、proposal 执行不绕 transition Guard、不重引 daemon、不接线 sweep/init 驱动(P3-Plugin)。验收 Node22 build:check+新单测(≤cap 最旧优先排空/带 LIMIT/门禁仍拦/update·deprecate 真实流转记事件边/无 cap 无界)+npm run build emit dist+全量无回归，提交 main，path-like evidenceRefs。
- `p3-core-expire-pending-bound` (accepted) — P3-Core-2 界定 #expireOldPending（用户裁断 Option A，producer，P3-Plugin 前置）：让 capped checkAndExecute 把有界传导到 #expireOldPending 的 pending GC 查询(find({status:'pending'})→limit+oldestFirst:true 复用 P3-Core)。推荐跨 observing+pending 共享单一 remaining 预算(同 P2-Core checkTimeouts total-budget)使整个 capped checkAndExecute 单 tick ≤cap；cap===undefined 两查询均维持无界字节一致。硬不变量：判定门禁完全不动(shouldExpirePending/markExpired/evaluateUpdate/evaluateDeprecate/§9.1/transition 全保留，cap 只限处理多少)、不重引 daemon、不接线 sweep/init(P3-Plugin)。验收 Node22 build:check+新单测(pending ≤budget 最旧优先排空/带 LIMIT/总≤cap/无 cap 无界/门禁仍拦)+npm run build emit dist+全量无回归，提交 main，path-like evidenceRefs。
- `p3-plugin-proposal-driver` (accepted) — P3-Plugin 双轨驱动 proposal 执行（consumer，最后代码变更）：轨①KnowledgeModule.initializeKnowledgeServices best-effort 取 proposalExecutor+signalBus 调 subscribeToSignals(signalBus) 幂等只订阅一次(Core 已 if(#unsubscribe)return)；轨②runSweep 在 checkTimeouts(cap) 后加 checkAndExecute(cap) 复用共享 cap、同信封、抛错走 skipped 兜底。可选 additive 执行计数。硬不变量：subscribeToSignals 幂等一次、checkAndExecute 共享 cap 有界、判定门禁完全不动(在 Core 侧)、proposal 不绕 transition Guard、不重引 daemon、不改既有字段。前置 P3-Core+P3-Core-2 已验收(checkAndExecute 整 tick 有界、dist 重生)。验收 Node22 build:check+双轨单测(init subscribe 恰一次/sweep checkAndExecute 以共享 cap)+全量无回归，提交 main，path-like evidenceRefs。完成即 P3 闭环(proposal 执行链活)。
- `test-e2e-lifecycle-automation` (accepted) — Test e2e 最终验收：真实 Alembic 运行时(ALEMBIC_HOME sandbox，build:core @62f0b4b live symlink)上由真实工具访问 sweep 驱动 daemon-less 生命周期/proposal 自动化。构造到期 staging(>cap)/卡死 evolving(>7d)/pending·decaying(>30d)+observing proposal，经若干工具调用验 6 项：①staging 仅 checkAndPromote 晋级 cap 有界 ②evolving→active 记事件 ③pending/decaying→deprecated ④observing proposal 经信号/兜底执行(update/deprecate+deprecated_by 边) ⑤每 sweep 受 cap 限 ⑥门禁仍拦(无 usage update→reject)。控制器已自验全部 unit/build——Test 勿重跑 unit、做真实运行时端到端(真 DB 播种+真工具触发+跨 tick 观察真实流转)。不需 AI 凭证。失败保留证据精确定位回报。P4 vendor 不在本 Test 范围。
- `p3-core-proposal-reentrancy-fix` (accepted) — P3-Core-Fix（F-A，用户裁断 Option A）：修 ProposalExecutor dual-track re-entrancy——#executeUpdate 的 active→evolving transition 发信号被 init subscribeToSignals 订阅者 re-enter 同一 still-observing proposal→二次 active→evolving→'evolving→evolving' invalid→误标 rejected（Test 真实运行时 + 控制器源码确认 + 单 proposal 隔离复现）。改法=re-entrancy 安全(推荐 #inFlight Set 守卫：执行前加 id、finally 移除，#onSignal/#evaluateOnSignal/checkAndExecute 跳过 in-flight)。不变量：合法信号驱动仍生效(只挡已在执行中的二次进入)、首次执行照常跑门禁+transition 到正确终态、判定门禁/transition Guard/cap 有界/subscribeToSignals 幂等零改、不重引 daemon。验收 Node22 build:check+re-entrancy 回归(UPDATE 终态 executed 非误标 rejected/只执行一次/合法信号仍驱动)+门禁保留回归+全量无回归+npm run build emit dist，提交 main，path-like evidenceRefs。完成后控制器重跑 Test e2e 重验 ④。
- `test-e2e-reverify-fa-fix` (sent) — Test e2e 重验（rework round 2，F-A 修复后）：F-A 已修复验收（AlembicCore d49fc05 ProposalExecutor #inFlight 守卫，dist 已重生，Plugin 经 live symlink 消费）。在真实运行时 sandbox 重跑（沿用首轮方法：真 cc bootstrap→stdio MCP/ALEMBIC_HOME sandbox/raw DB backdated 播种/共享 cap 小值），重验：核心 ④ 合格 UPDATE proposal 真正到达 executed（不再误标 rejected 'evolving→evolving'）、单 tick 有界、跨 tick 排空、状态 observing→executed 正确；确认 ①②③⑤⑥ 仍 PASS 无回归。**F-B/deprecate 执行可达性 = OUT-OF-SCOPE（用户裁断 A 转 Design）**：deprecate 被门禁正确拒=可接受，不因 deprecated_by 边未生成判 FAIL。完成定义：④(update→executed)+①②③⑤⑥ 无回归即重验通过。附原始证据(DB 前后/事件行/计数)或精确失败定位。card 见 sourceRef 顶部 RE-RUN 节。

## Target tasks

- `p1-core-bounding` -> window `AlembicCore` (accepted)
- `p1-plugin-sweep-cap` -> window `AlembicPlugin` (accepted)
- `p2-core-checktimeouts` -> window `AlembicCore` (accepted)
- `p2-plugin-sweep-checktimeouts` -> window `AlembicPlugin` (accepted)
- `p3-core-checkandexecute` -> window `AlembicCore` (accepted)
- `p3-core-expire-pending-bound` -> window `AlembicCore` (accepted)
- `p3-plugin-proposal-driver` -> window `AlembicPlugin` (accepted)
- `test-e2e-lifecycle-automation` -> window `Test` (accepted)
- `p3-core-proposal-reentrancy-fix` -> window `AlembicCore` (accepted)
- `test-e2e-reverify-fa-fix` -> window `Test` (sent)

## Sub-directories

- [task-packages/](task-packages/)
- [target-results/](target-results/)
- [transition-candidates/](transition-candidates/)
- [intake/](intake/) — _(not present)_
- [test-cards/](test-cards/) — _(not present)_
- [evidence/](evidence/) — _(not present)_
- [focus/](focus/) — _(not present)_
