# P2-Plugin — sweep 接线 checkTimeouts 驱动（consumer 侧）

- Demand: `alembic-lifecycle-automation-followup-2026-06-25`
- Phase: **P2**（consumer，紧随已验收的 P2-Core）
- Window / Repo: **AlembicPlugin** (`AlembicPlugin/`)
- Role: **consumer**（消费 AlembicCore `b557b10` 的 `checkTimeouts(cap?)`，经 `@alembic/core`=`file:../AlembicCore` live symlink；Core dist 已由 P2-Core `npm run build` 重生）
- Design 权威: `Design/docs/current/alembic-lifecycle-automation-followup-2026-06-25.md` §P2 step 1
- 前置: 读 父 `CLAUDE.md` + `AlembicPlugin/CLAUDE.md` + 本 state root；声明窗口/仓库身份；只认领本任务。

## 前置已就绪

- **P2-Core 已验收**（AlembicCore main `b557b10`）：`LifecycleStateMachine.checkTimeouts(cap?)` 有界（cap 时跨状态共享 remaining 预算、最旧优先、≤cap/tick、跨 tick 排空；undefined=无界）、staging 不碰、迁移经 transition 记事件。dist 已含 `checkTimeouts(cap?)`，本窗口 tsc 可见、可直接构建。
- **P1-Plugin 已落地**（main `5f56539`）：`resolveStagingAccessSweepCap()` 已导出为共享 sweep 上限（默认50/env ALEMBIC_STAGING_ACCESS_SWEEP_CAP/守卫），runSweep 已用它调 `checkAndPromote(cap)`。

## 控制器已核实的 grounded 事实

- `lib/runtime/mcp/host/staging-access-sweep.ts` `runSweep`：现 `const cap = resolveStagingAccessSweepCap(); const result = await stagingManager.checkAndPromote(cap);`，整体在 try/catch + inFlight/throttle/2s-timeout 信封内；`StagingManagerLike` 本地接口；服务经 `container.get('...')` 取用。
- Core `checkTimeouts(cap?)` 驱动 evolving→active(7d)/pending·decaying→deprecated(30d)，guard 跳过 staging、迁移经 transition 记 lifecycle_transition_events。

## 改法（P2-Plugin 范围 —— 仅接线 checkTimeouts；不接线 checkAndExecute/subscribe，那是 P3）

1. 在 `runSweep` 内 `checkAndPromote(cap)` **之后**，加 `const lifecycle = container.get('lifecycleStateMachine') as LifecycleStateMachineLike; await lifecycle.checkTimeouts(cap);`——**复用同一 `resolveStagingAccessSweepCap()` cap**（共享上限值；各驱动各自有界 ≤cap，单 tick 总量 ≤ 驱动数×cap 仍有界）。
2. 加本地 `LifecycleStateMachineLike` 接口（ducktyping）：`checkTimeouts(cap?: number): Promise<{ timedOut?: unknown[]; checked?: number }>`。
3. 在**同一 try/catch + inFlight/throttle/2s 信封内**（checkTimeouts 抛错则整 sweep 走既有 skipped 兜底、记日志）。
4. （可选，additive）`StagingAccessSweepResult` 加可选 timeout 计数字段（如 `timedOutCount`/`checkedTimeouts`）+ 日志——**仅新增字段，不改既有字段语义**；不加也可，但建议有可观测计数。

## 硬不变量（违反 = scope 变更，停手回控制器）

- checkTimeouts 以**共享 cap**（resolveStagingAccessSweepCap）调用，保持单 tick 有界。
- **不接线 checkAndExecute / subscribeToSignals**（P3）；inFlight/throttle/2s 信封不变；不改 StagingAccessSweepResult 既有字段（如扩展仅 additive）。
- 不重引 daemon/scheduler；不放松任何判定门禁；不改 checkAndPromote 既有 cap 行为。

## 验收（Node 22）

- `npm run build:check` 绿（消费 Core checkTimeouts(cap?)，tsc 通过）。
- sweep 单测（`test/unit/StagingAccessSweep.test.ts`）：断言 sweep 在 checkAndPromote 后**以 cap 调用 lifecycleStateMachine.checkTimeouts**（spy/seam，cap 值=resolveStagingAccessSweepCap）；env 覆盖透传；现有 sweep 测试无回归。
- 全量单测无回归（对基线，记 failed-set）。
- **直接提交 main（不开分支）**。

## 回填要求

- `evidenceRefs` **纯仓库相对路径**（`AlembicPlugin/lib/runtime/mcp/host/staging-access-sweep.ts`、`AlembicPlugin/test/unit/StagingAccessSweep.test.ts`）；描述写 summary、commit/输出写 verification。
- `verification`：node -v、build:check、sweep 测试、全量 failed-set、commit hash + 改动文件。

## 完成定义

sweep 在每次 tick 于 checkAndPromote 后以共享 cap 调 `checkTimeouts(cap)`、单 tick 有界、信封不变、未接线 P3、未重引 daemon、门禁未触；Node22 build:check + sweep 测试(checkTimeouts 以 cap 调用) + 全量无回归绿；commit 落 main，回填 path-like evidenceRefs。
