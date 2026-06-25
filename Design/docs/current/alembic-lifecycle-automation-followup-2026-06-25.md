# Alembic 产物化生命周期自动化补全 — 需求设计(strict, follow-up)

Date: 2026-06-25
Status: requirement-design (ready-for-controller-intake)
Source Window: Design
Design Key: alembic-lifecycle-automation-followup-2026-06-25
Scope: AlembicCore + AlembicPlugin；follow-up of alembic-recipe-productization-optimization-2026-06-25

## 触发与证据

`alembic-recipe-productization-optimization` 验收时,P1 用 tick-on-tool-access sweep 把 **autoApprovable staging recipe 自动晋级 active**(已 PASS、有全栈测试)。但独立复核发现 daemon-less 化只补了**三分之一**的生命周期职责,还剩三处真实残留(均 grounded):

- **F1 sweep 无计数上限**:`StagingManager.checkAndPromote` 与 `checkTimeouts` 走的 `KnowledgeRepositoryImpl.findAllByLifecycles(['staging'])`(:408)、`ProposalRepository.find`(:209)**全无 `.limit()`**;tick 的 2s 超时只挡调用方等待、**不挡后台 work**(work 在 `.finally` 后台跑完)。staging 积压大时一次冷扫长时间多写。
- **F2a `LifecycleStateMachine.checkTimeouts()` 孤儿**(`AlembicCore/src/service/evolution/LifecycleStateMachine.ts:174-223`,零调用方):驱动 `evolving→active`(7d,**卡死 evolving 恢复**)、`pending→deprecated`(30d GC)、`decaying→deprecated`(30d GC);**guard 跳过 staging**(无误promote 手动审核件的风险)。缺它 → 中途崩在 evolving 的 recipe 永久卡死、pending/decaying 永不回收。
- **F2b proposal 执行段整体孤儿**:proposal **创建**正常(`FileChangeHandler`→`EvolutionGateway.submit`→`#createProposal` EvolutionGateway.ts:189,高置信直接进 `observing`);但**执行**靠 `ProposalExecutor.subscribeToSignals()`(:85)/`checkAndExecute()`(:266)**全零调用** → proposal 永卡 `observing`,update(merge/enhance patch)与 deprecate(supersede)两条已实现的路径**全不可达**。`proposalExecutor` DI 注册了(KnowledgeModule.ts:329)但从没被 `.get()` 取用。
- **F3 vendor 快照仍含死配置**:`AlembicPlugin/vendor/AlembicCore`(快照 ef83a41,落后)仍带已删的 `ALEMBIC_EMBED_*`;运行时走 live `../AlembicCore` symlink 不受影响,但**打包/离线发布前需刷快照**(含 Core `b950785`)。

> 注:**门禁不放松**——`EvolutionPolicy.evaluateUpdate`(需 guardHits/searchHits 证明使用)、`evaluateDeprecate`(recovered 则 reject)、§9.1 active-modification guard、`LifecycleStateMachine.transition` 的 Guard 全部保留;本需求只**恢复触发器**,不改判定。

## 最终目标(完成定义)

把 PDR-3 删 daemon 后丢失的剩余生命周期/进化自动化**daemon-less 补全**:
1. tick 有**真实计数上限 + 查询 LIMIT**,大积压下每次有界、跨多次工具调用排空;
2. `checkTimeouts` 被驱动:卡死 evolving 7d 恢复、pending/decaying 30d GC;
3. proposal 执行被驱动:`observing` proposal 经信号/兜底批扫**真正执行**(merge/enhance/supersede),不再永卡;
4. vendor 快照在发布前刷新到含死配置删除的 Core commit;
5. 全程不重引 daemon、不放松进化判定门禁。

## 分阶段修复设计(代码级 + 验收)

### P1 — tick 有界化(F1)【AlembicCore + AlembicPlugin】

**改法**:
1. `AlembicCore/src/repository/knowledge/KnowledgeRepositoryImpl.ts:408 findAllByLifecycles` 增可选 `limit`(默认无限保持兼容,sweep 传入);`AlembicCore/src/repository/evolution/ProposalRepository.ts:209 find` 同增 `limit`。
2. `StagingManager.checkAndPromote`/`checkTimeouts`/`checkAndExecute` 接受 per-call cap `N`(按 deadline/age 升序取最旧 N),sweep 传入(默认如 50,env 可调)。
3. `AlembicPlugin/lib/runtime/mcp/host/staging-access-sweep.ts` 的 `runSweep` 把 cap 透传给三者;tick 仍共享 inFlight/throttle/2s-timeout 信封。

**验收**:构造 >N 条到期 staging,单次 sweep 只晋级 ≤N、多次调用排空;查询带 LIMIT(无全表 .all());单测断言每次 cap 生效。

### P2 — 驱动 checkTimeouts(F2a)【AlembicPlugin 接线 + AlembicCore 有界】

**改法**:
1. 扩展 `staging-access-sweep.ts:runSweep`:在 `checkAndPromote` 之后,`get('lifecycleStateMachine').checkTimeouts(cap)`(按 ducktyping `LifecycleStateMachineLike`)。共享同一有界 tick 信封。
2. `LifecycleStateMachine.checkTimeouts`(:174)接 cap + 走带 limit 的查询;迁移仍经 `transition`(Guard 校验,记 lifecycle_transition_events)。

**验收**:构造卡死 evolving(>7d)→ 工具调用后恢复 active 且记事件;pending/decaying(>30d)→ deprecated;**staging 不被 checkTimeouts 触碰**(仍只由 checkAndPromote 管);tick 有界。

### P3 — 驱动 proposal 执行(F2b)【AlembicPlugin 接线 + AlembicCore】

**决策(需 confirm)**:推荐 **双轨**——① 在 `AlembicPlugin/lib/injection/modules/KnowledgeModule.ts:396 initializeKnowledgeServices` **一次性** `get('proposalExecutor').subscribeToSignals(signalBus)`,让真实信号(FileChangeHandler 的 quality/source_modified 等)驱动 `observing` proposal 即时执行;② tick 内加**有界兜底** `get('proposalExecutor').checkAndExecute(cap)`,处理信号错过的到期 proposal。

**改法**:
1. KnowledgeModule init 取用 proposalExecutor 并 subscribeToSignals(幂等,只订阅一次)。
2. sweep runSweep 加有界 `checkAndExecute(cap)`(同 tick 信封)。
3. 判定门禁不动(evaluateUpdate/evaluateDeprecate/§9.1/transition Guard 全保留)。

**验收**:FileChangeHandler 产 `observing` proposal 后,触发对应信号 → proposal 执行(update→evolving→patch→active/staging,或 deprecate→deprecated + deprecated_by 边);或 tick 兜底执行到期 proposal;evolution_proposals 状态从 observing 流转到 executed/rejected;判定门禁仍拦不合格(无 usage 的 update 被 reject 等)。

### P4 — vendor 快照刷新(F3)【AlembicPlugin,发布期】

**改法**:按 `AlembicPlugin/CLAUDE.md` 的 vendor 刷新流程,在发布准备步骤把 `vendor/AlembicCore` 固定点 checkout 到含 `b950785`(删死配置)的已发布 Core commit,`git add vendor/AlembicCore` 随发布提交;记录滞后数。**仅发布场景**,不影响日常 live symlink 开发。

**验收**:`grep ALEMBIC_EMBED_ vendor/AlembicCore/src` 无残留;vendor 滞后数记入发布说明;日常开发路径不变。

## 顺序、跨仓、验收门

- **顺序**:P1(有界化,先于一切驱动)→ P2(checkTimeouts)→ P3(proposal 执行)→ P4(vendor,发布期独立)。
- **跨仓**:AlembicCore = 查询 limit / cap / checkTimeouts / ProposalExecutor;AlembicPlugin = tick 扩展 / init 订阅 / vendor。
- **Test e2e**:构造到期 staging/evolving/pending/decaying + observing proposal,经若干次工具调用 → 各按预期有界流转,门禁仍拦不合格。

## Non-Goals / 禁止

- 不重引 daemon/scheduler(沿用 tick-on-access + 一次性信号订阅)。
- 不放松进化/生命周期判定门禁(只恢复触发器)。
- checkTimeouts 不得触碰 staging(保持与 checkAndPromote 不相交);proposal 执行不得绕过 transition Guard。
- 不在 tick 内做无界全表扫描(必须 cap + LIMIT)。

## 风险

- tick 现在驱动三件事(promote/timeouts/proposals),**必须共享有界 cap**,否则后台 work(2s 超时不挡)在大库下长跑多写。
- subscribeToSignals 必须**幂等只订阅一次**(init 处),避免重复订阅放大信号。
- proposal 执行涉及内容 patch(ContentPatcher),崩溃中断要能被 P2 的 checkTimeouts evolving→active 兜底恢复(两者配套)。

## 证据与链接

- grounding:checkTimeouts/ProposalExecutor 零调用方;proposal 创建活、执行死(卡 observing);查询无 LIMIT;tick 2s 超时不挡后台 work;门禁判定完好。
- 前置:[alembic-recipe-productization-optimization-2026-06-25](alembic-recipe-productization-optimization-2026-06-25.md)(P1 已补 autoApprovable staging→active;本需求补其余 lifecycle/evolution 自动化)。
