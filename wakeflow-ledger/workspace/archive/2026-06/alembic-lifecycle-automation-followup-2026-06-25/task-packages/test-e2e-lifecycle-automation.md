# Test e2e — daemon-less 生命周期/proposal 自动化真实场景验收

- Demand: `alembic-lifecycle-automation-followup-2026-06-25`
- Phase: **Test e2e**（最终验收，全部代码阶段 P1/P2/P3 已接受后）
- Window: **Test**（真实场景验证，控制器无法单独安全复现）
- Design 权威: `Design/docs/current/alembic-lifecycle-automation-followup-2026-06-25.md` §顺序、跨仓、验收门
- 前置: 读 父 `CLAUDE.md` + `Test/CLAUDE.md` + 本 state root；声明窗口身份；只认领本任务。

## ⟳ RE-RUN（rework round 2，2026-06-26）—— 先读本节

首轮 Test e2e 已 5/6 PASS、④ proposal 执行 FAIL（F-A：dual-track re-entrancy 把 UPDATE 误标 rejected）。**F-A 已修复并验收**（AlembicCore main `d49fc05`：ProposalExecutor `#inFlight` 守卫，proposal 自身执行触发的信号不再 re-enter 二次执行；判定门禁/transition/cap/幂等零改；**dist 已重生**，Plugin 经 live `../AlembicCore` symlink 消费）。本次**重跑重验**：
- **核心重验 ④（update 活起来）**：构造 observing UPDATE proposal（含合格=有 usage 的），经真实工具访问 sweep / 信号 → **合格 UPDATE 真正到达 `executed`**（不再误标 rejected 'evolving→evolving'）、单 tick 有界、跨 tick 排空；evolution_proposals 状态 observing→executed/rejected 正确。
- **回归确认 ①②③⑤⑥ 仍 PASS**（F-A 修复仅 re-entrancy 守卫、不应影响 staging promote / timeout 恢复 / GC / cap 有界 / 门禁；确认无回归）。
- **F-B / deprecate 执行 = 本次明确 OUT-OF-SCOPE（用户裁断 A，转 Design）**：deprecate proposal 因 decayScore 数据流被门禁正确拒=可接受，**不要因 deprecated_by 边未生成而判 FAIL**；只需确认 deprecate 仍被门禁正确处理（不崩、不绕门禁）。
- 复用首轮方法（真 cc bootstrap→stdio MCP、ALEMBIC_HOME sandbox、raw DB backdated 播种、共享 cap 小值观察有界）。证据置 Test 可引用位置、`evidenceRefs` 用纯路径。

下方为首轮完整 card（精确问题/边界/检查/成功失败定义），重跑沿用，仅完成定义调整为：**④(update→executed) + ①②③⑤⑥ 无回归 PASS 即重验通过**（deprecate 执行可达性 = Design 另议、非本验收门）。

---

## 精确问题（Test 要回答的唯一问题）

在**真实 Alembic 运行时**上，由**真实工具访问 sweep（tick-on-access）**驱动的 daemon-less 生命周期/proposal 自动化，是否在真实播种数据上产生**有界、正确**的生命周期流转 + proposal 执行，**同时判定门禁不被绕过**？

## 对象边界

- AlembicPlugin 运行时（build:core 用 live `../AlembicCore` @ `62f0b4b`，即已验收的 P3-Core-2）在 **ALEMBIC_HOME sandbox**（保护真实 `~/.asd`，参 runtime acceptance recipe）。
- 链路：真实工具调用（STAGING_ACCESS_SWEEP_TOOL_NAMES：alembic_submit_knowledge/alembic_dimension_complete/alembic_status/alembic_rescan）→ `staging-access-sweep.runSweep` → Core `StagingManager.checkAndPromote(cap)` + `LifecycleStateMachine.checkTimeouts(cap)` + `ProposalExecutor.checkAndExecute(cap)`（共享 cap，默认 50，可经 `ALEMBIC_STAGING_ACCESS_SWEEP_CAP` 调小以便观察有界）。

## 控制器已自验（**勿重复**为交付物）

全部 unit 已绿（P1-P3：cap 有界/最旧优先/跨 tick 排空/门禁保留/init subscribe 恰一次）、build:check 绿、git diff 合范围+纯 additive、gates 未触、no daemon。**Test 不要把"重跑 unit/tsc"当交付**——Test 的价值是**真实运行时端到端**：真实 DB 播种 + 真实工具访问触发 sweep + 跨多次 tick 观察真实 DB lifecycle 流转，证明接线真连通（非 mock）。

## 为何需要真实场景

unit 测试 mock 了 sweep 信封/容器；只有真实运行时能证明"真实工具访问 → sweep → Core lifecycle/proposal 链"端到端连通、在真实播种数据上跨多次 tick 行为有界。

## 验收检查（构造到期 staging/卡死 evolving>7d/pending·decaying>30d + observing proposal，经若干次工具调用）

① **staging 仅由 checkAndPromote 晋级、cap 有界**：构造 >cap 条到期 autoApprovable staging → 单次 sweep 仅晋级 ≤cap、最旧优先、多次工具调用排空；checkTimeouts 不触碰 staging（staging 不被它迁移）。
② **卡死 evolving 恢复**：evolving 且 updatedAt>7d → 工具调用后 → active，且写 `lifecycle_transition_events`（trigger=timeout-recovery）。
③ **pending/decaying GC**：updatedAt>30d → deprecated。
④ **observing proposal 真正执行**：构造 observing proposal → 经信号（轨①，如 source_modified/quality 信号）或 sweep 兜底（轨②）→ update（merge/enhance→evolving→active/staging）或 deprecate（→deprecated + deprecated_by 边）；evolution_proposals 状态从 observing 流转到 executed/rejected。
⑤ **每次 sweep 受 cap 限**：单 tick 处理条数 ≤cap（promote/timeouts/proposal 各有界）；大积压跨多次工具调用排空、不一次冷扫全量。
⑥ **判定门禁仍拦不合格**：无 usage（guardHits=0&&searchHits=0）的 update proposal → 被 reject、未流转；recovered 的 deprecate → reject；未到期 pending 不被 markExpired。

## 成功/失败/无效结论/停止条件

- **成功**：①–⑥ 全部在真实数据上成立，附原始证据（DB 查询/工具输出/lifecycle_transition_events 行/sweep 计数日志）。
- **失败**：任一不成立——尤其 staging 单 tick 晋级 >cap、evolving 未恢复、门禁被绕过（无 usage update 流转）、或 tick 内出现无界全表扫描征兆。失败=保留证据、精确定位、回报控制器（产品缺陷回 owning 仓）。
- **无效结论**：'unit 绿'≠真实运行时验证；不得以 mock/unit 代替。
- **停止条件**：运行时无法在 sandbox 起来（缺依赖/构建失败）→ 保留 blocker 证据、回报，不强行下结论。

## 回填要求

- `TargetResultEnvelope`：`evidenceRefs` 用真实证据路径（sandbox 下的 DB dump / 工具输出 json / 日志摘要文件，置于 Test 可引用位置）；`verification` 列每项检查的原始观察（前后 lifecycle、事件行、计数）。
- 不需 AI 模型凭证（本验收是 lifecycle/proposal 自动化、非 AI 生成）。

## 完成定义

真实运行时上 ①–⑥ 全部成立、附可复核原始证据；或精确 blocker/失败定位回报。Test 通过即达本需求最终验收（P4 vendor 为发布期独立步、用户门，不在本 Test 范围）。
