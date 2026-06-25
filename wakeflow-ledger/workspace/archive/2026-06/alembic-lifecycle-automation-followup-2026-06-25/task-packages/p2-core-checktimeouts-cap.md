# P2-Core — checkTimeouts 接 cap + 有界查询（producer 侧）

- Demand: `alembic-lifecycle-automation-followup-2026-06-25`
- Phase: **P2**（顺序硬性 P1✅→P2→P3→P4；P2 producer 先行）
- Window / Repo: **AlembicCore** (`AlembicCore/`)
- Role: **producer**（P2-Plugin 将经 `@alembic/core` 消费本签名 + 在 sweep 接线 checkTimeouts 驱动）
- Design 权威: `Design/docs/current/alembic-lifecycle-automation-followup-2026-06-25.md` §P2
- 前置: 读 父 `CLAUDE.md` + `AlembicCore/CLAUDE.md` + 本 state root；声明窗口/仓库身份；只认领本任务。
- 前序已就绪：P1-Core(`54dd9bb`) `findAllByLifecycles(lifecycles, limit?)` 已可选 limit、最旧优先；P1 阶段已验收。

## 控制器已核实的 grounded 事实（file:line）

- `src/service/evolution/LifecycleStateMachine.ts:174 checkTimeouts(): Promise<TimeoutCheckResult>` —— **当前零调用方（孤儿）**。遍历 `Object.entries(TIMEOUT_MS)`，仅对 `TIMEOUT_TARGET` 中有条目的 state 处理：`evolving→active`(7d 恢复卡死)、`pending→deprecated`(30d GC)、`decaying→deprecated`(30d GC)。**`staging` 在 TIMEOUT_MS 有 7d 但 TIMEOUT_TARGET 无条目 → 天然不被 checkTimeouts 触碰**（务必保持）。每个 state 内 `findAllByLifecycles([state])`(现可传 limit)，逐条 `stateAge > timeoutMs` 则 `this.transition(...)`（Guard 校验 + 记 lifecycle_transition_events）。

## 改法（P2-Core 范围 —— 仅 checkTimeouts 有界化；不在此接线 sweep 驱动，那是 P2-Plugin）

1. `checkTimeouts(cap?: number)` 增可选 cap。
2. cap 给定时**走带 limit 的查询**（复用 P1 的 `findAllByLifecycles([state], limit)`）、**有界**：推荐以**跨 timeout 状态的共享 remaining 预算**实现——`remaining=cap`，按状态顺序每个 state 以 `findAllByLifecycles([state], remaining)` 查询（最旧优先=P1 的 createdAt 升序）、处理后按返回行数递减 remaining、remaining<=0 即停；使**单次 tick 扫描行数 + 迁移数 ≤ cap**、最旧/最积压优先、跨多次 tick 排空。（窗口可选 per-state cap 或 total-budget，但须满足下列不变量并在 commit 说明所选语义。）
3. cap 未给定（`undefined`）→ 维持现行无界行为（每 state 全表，字节一致契约）。
4. 迁移仍**全部经 `this.transition(...)`**（Guard + lifecycle_transition_events），不绕过。

## 硬不变量（违反 = scope 变更，停手回控制器）

- **checkTimeouts 绝不触碰 staging**（保持与 checkAndPromote 不相交；只 evolving→active / pending·decaying→deprecated）。
- cap 给定时**查询必带 LIMIT**（无全表 `.all()`）、**确定性最旧优先**、跨 tick 排空不饿死。
- cap===undefined = 无界（向后兼容契约）；cap 默认值不在 Core 设（P2-Plugin 用 P1 的 resolveStagingAccessSweepCap 共享 cap）。
- **判定/迁移门禁零改**：transition 的 Guard、TIMEOUT_MS/TIMEOUT_TARGET 阈值与目标态、evidence/trigger 语义不动。只加 cap 有界，不改"何时迁移"。
- 不重引 daemon/scheduler；不接线 sweep 驱动（P2-Plugin）；不动 proposal 执行（P3）。

## 验收（Node 22）

- 新单测：构造卡死 evolving(>7d)→ `checkTimeouts(cap)` 恢复 active 且 **记 lifecycle_transition_events**；pending/decaying(>30d)→ deprecated；**staging(>7d) 不被触碰**（断言其 lifecycle 不变）；cap 生效（>cap 到期项时单 tick 处理 ≤cap、多 tick 排空）；capped 查询带 LIMIT（spy/seam 断言无全表 .all()）；`checkTimeouts()` 无 cap 仍无界。
- `npm run build:check` 绿（tsc --noEmit）。
- **`npm run build`（emit dist）**：使 `@alembic/core` dist 含 `checkTimeouts(cap?)` 供 P2-Plugin 消费（dist 是 gitignored 本地产物、**不提交**；commit 仅含 src+test）。
- 全量单测无回归（对基线，记 failed-set）。
- **直接提交 main（不开分支）**。

## 回填要求（避免闭环 evidence-gate 摩擦）

- `evidenceRefs` **必须用纯仓库相对路径**（如 `AlembicCore/src/service/evolution/LifecycleStateMachine.ts`、`AlembicCore/test/<新测试文件>`），**不要**加描述或 commit 哈希——描述写 `summary`、commit 与命令输出写 `verification`。
- `verification` 列：node -v、build:check、`npm run build`(emit dist 已跑)、新单测结果、全量 failed-set、commit hash + 改动文件。

## 完成定义

`checkTimeouts(cap?)` 有界（cap 时查询带 LIMIT + 最旧优先 + 跨 tick 排空、≤cap/ tick）、staging 不被触碰、迁移仍经 transition 记事件、未给 cap 仍无界、门禁未触；Node22 build:check + 新单测 + 全量无回归绿；已 `npm run build` 重生 dist；commit 落 main，回填 path-like evidenceRefs + 原始证据。
