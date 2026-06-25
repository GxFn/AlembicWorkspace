# P3-Core — checkAndExecute 接 cap + 有界查询（producer 侧）

- Demand: `alembic-lifecycle-automation-followup-2026-06-25`
- Phase: **P3**（顺序硬性 P1✅→P2✅→P3→P4；P3 producer 先行，最后一个 Core 变更）
- Window / Repo: **AlembicCore** (`AlembicCore/`)
- Role: **producer**（P3-Plugin 经 `@alembic/core` 消费 + 在 init 一次性 subscribeToSignals + sweep 兜底 checkAndExecute）
- Design 权威: `Design/docs/current/alembic-lifecycle-automation-followup-2026-06-25.md` §P3
- 前置: 读 父 `CLAUDE.md` + `AlembicCore/CLAUDE.md` + 本 state root；声明窗口/仓库身份；只认领本任务。
- 前序已就绪：P1-Core `ProposalRepository.find` 已支持可选 `ProposalFilter.limit`（保持 desc(proposedAt) 排序）。

## 控制器已核实的 grounded 事实（file:line）

- `src/service/evolution/ProposalExecutor.ts`：
  - `subscribeToSignals(signalBus)`(:85) —— **已幂等**（`if (this.#unsubscribe) return`），订阅 'guard|search|decay|quality|usage|lifecycle' 信号驱动 observing proposal 即时评估。**本任务无需改它**（P3-Plugin 在 init 调一次）。
  - `checkAndExecute()`(:266) —— **零调用方（孤儿）**。查 `this.#repo.find({ status: 'observing' })`(:275，现走 P1 已加 limit 的 find、但默认无 limit=无界)，逐条经 `#processExpiredProposal` 评估 → update(merge/enhance)→evolving→patch→active/staging 或 deprecate→deprecated+deprecated_by 边。
- **判定门禁（务必全保留、零改）**：`EvolutionPolicy.evaluateUpdate`(需 guardHits>0||searchHits>0)、`evaluateDeprecate`(currentDecay>snapshotDecay+δ→reject)、§9.1 active-modification guard(ProposalExecutor:155-186)、`LifecycleStateMachine.transition` 的 Guard。

## 改法（P3-Core 范围 —— 仅 checkAndExecute 有界化；不在此接线 sweep/init 驱动，那是 P3-Plugin）

1. `checkAndExecute(cap?: number)` 增可选 cap。
2. cap 给定时**走带 limit 的查询**（复用 P1 `ProposalRepository.find` 的 limit）、**有界**：单 tick 处理 ≤cap 条 observing proposal、跨多次 tick 排空。
3. **最旧优先排空（防饿死）**：P1-Core 的 `find` 现为 `desc(proposedAt)`（最新优先），capped 取最新 N 会**饿死最久未处理的 observing proposal**。本任务须让 capped checkAndExecute **最旧优先**(proposedAt 升序)排空——推荐给 `ProposalRepository.find` 加**可选 order/oldestFirst 参数**（additive，默认仍 desc 不影响其他调用方），checkAndExecute 传 `{status:'observing', limit:cap, oldestFirst:true}`。若选其他等效机制，须在 commit 说明并保证最旧优先 + 不改 find 默认排序。
4. cap 未给定（`undefined`）→ 现行无界行为（字节一致契约）。

## 硬不变量（违反 = scope 变更，停手回控制器）

- **判定门禁完全不动**：cap 只限"处理多少条"，不改"是否通过"。evaluateUpdate/evaluateDeprecate/§9.1/transition Guard 全保留。须有测试证明：cap 模式下不合格 proposal（如无 usage 的 update）**仍被 reject**、未因有界而绕过。
- **proposal 执行不得绕过 transition Guard**（update→evolving→active/staging、deprecate→deprecated 仍全经 transition、记 lifecycle_transition_events / deprecated_by 边）。
- cap 给定时查询带 LIMIT、最旧优先、跨 tick 排空不饿死；cap===undefined=无界；cap 默认值不在 Core 设（P3-Plugin 用共享 cap）。
- subscribeToSignals 不改（已幂等）；不重引 daemon/scheduler；不接线 sweep/init 驱动（P3-Plugin）。

## 验收（Node 22）

- 新单测：构造 >cap 条 observing proposal → `checkAndExecute(cap)` 单 tick 处理 ≤cap（**最旧优先**）、多 tick 排空；capped 查询带 LIMIT（spy/seam）；**门禁仍拦**（无 usage 的 update→reject、recovered→reject、§9.1 source_modified+direct/pattern→拒废弃）；merge/enhance update→evolving→active/staging、deprecate→deprecated+deprecated_by 边真实流转；`checkAndExecute()` 无 cap 仍无界。
- `npm run build:check` 绿。
- **`npm run build`（emit dist）**：使 `@alembic/core` dist 含 `checkAndExecute(cap?)`（及如改了 find 签名亦同步）供 P3-Plugin 消费（dist gitignored、**不提交**）。
- 全量单测无回归（对基线，记 failed-set）。
- **直接提交 main（不开分支）**。

## 回填要求（避免闭环 evidence-gate 摩擦）

- `evidenceRefs` **纯仓库相对路径**（如 `AlembicCore/src/service/evolution/ProposalExecutor.ts`、`AlembicCore/src/repository/evolution/ProposalRepository.ts`(如改)、`AlembicCore/test/<新测试文件>`）；描述写 summary、commit/输出写 verification。
- `verification`：node -v、build:check、`npm run build`(emit dist)、新单测、全量 failed-set、commit hash + 改动文件。

## 完成定义

`checkAndExecute(cap?)` 有界（cap 时查询带 LIMIT + 最旧优先 + 跨 tick 排空、≤cap/tick）、update/deprecate 真实流转经 transition 记事件/边、**判定门禁仍拦不合格**、未给 cap 仍无界、subscribeToSignals 未改、未重引 daemon；Node22 build:check + 新单测 + 全量无回归绿；已 `npm run build` 重生 dist；commit 落 main，回填 path-like evidenceRefs + 原始证据。
