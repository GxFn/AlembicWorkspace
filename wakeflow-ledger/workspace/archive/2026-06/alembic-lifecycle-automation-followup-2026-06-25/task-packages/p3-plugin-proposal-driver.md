# P3-Plugin — 驱动 proposal 执行（双轨：init 订阅 + sweep 兜底，consumer 侧）

- Demand: `alembic-lifecycle-automation-followup-2026-06-25`
- Phase: **P3**（consumer，最后一个代码变更；紧随已验收的 P3-Core + P3-Core-2）
- Window / Repo: **AlembicPlugin** (`AlembicPlugin/`)
- Role: **consumer**（消费 AlembicCore 已完全有界的 `checkAndExecute(cap?)`；subscribeToSignals 已幂等）
- Design 权威: `Design/docs/current/alembic-lifecycle-automation-followup-2026-06-25.md` §P3（**双轨决策已 confirm**）
- 前置: 读 父 `CLAUDE.md` + `AlembicPlugin/CLAUDE.md` + 本 state root；声明窗口/仓库身份；只认领本任务。

## 前置已就绪

- **P3-Core + P3-Core-2 已验收**（AlembicCore main `439c960`→`62f0b4b`）：`ProposalExecutor.checkAndExecute(cap?)` 整 tick 路径严格有界（observing+pending 共享 remaining≤cap、最旧优先、跨 tick 排空）、判定门禁全保留；`subscribeToSignals(signalBus)` 已幂等（`if(#unsubscribe)return`）。dist 已重生、本窗口 tsc 可见。
- **P1/P2-Plugin 已落地**：sweep `runSweep` 已用共享 `resolveStagingAccessSweepCap()` 调 `checkAndPromote(cap)` + `checkTimeouts(cap)`，在 try/catch+inFlight/throttle/2s 信封内。

## 控制器已核实的 grounded 事实（file:line）

- `lib/injection/modules/KnowledgeModule.ts`：:329 `proposalExecutor` 单例已注册但 `initializeKnowledgeServices`(:396) **从未 `.get('proposalExecutor')`**（孤儿）；`signalBus` 在容器可取（如 :324 `ct.get('signalBus')`，类型 `@alembic/core/events` SignalBus）。
- `lib/runtime/mcp/host/staging-access-sweep.ts` `runSweep`：现 checkAndPromote(cap)+checkTimeouts(cap)；服务经 `container.get('...')`。

## 改法（P3-Plugin 范围 —— 双轨接线 proposal 执行驱动）

1. **轨①（init 一次性订阅）**：`KnowledgeModule.initializeKnowledgeServices` 内 best-effort 取 `proposalExecutor` + `signalBus` 并 `proposalExecutor.subscribeToSignals(signalBus)`——**幂等只订阅一次**（Core 的 subscribeToSignals 已 `if(#unsubscribe)return`；init 侧也不重复 wiring）；signalBus/proposalExecutor 不可取时 best-effort 跳过（同既有 eventBus 绑定风格、try/catch 非致命）。让真实信号（FileChangeHandler 的 quality/source_modified 等）即时驱动 observing proposal 执行。
2. **轨②（sweep 有界兜底）**：`runSweep` 在 checkTimeouts(cap) **之后**加 `container.get('proposalExecutor').checkAndExecute(cap)`（ProposalExecutorLike ducktype），**复用同一共享 cap**、同一 try/catch+信封内（抛错→整 sweep 走既有 skipped 兜底）；处理信号错过的到期 observing proposal。
3. （可选 additive）`StagingAccessSweepResult` 加可选 proposal 执行计数（如 executedCount/rejectedCount/expiredCount）+ 日志；仅新增字段、不改既有字段语义。

## 硬不变量（违反 = scope 变更，停手回控制器）

- subscribeToSignals **幂等只订阅一次**（init 处，避免重复订阅放大信号）。
- checkAndExecute 以**共享 cap** 调用、单 tick 有界；同一信封；抛错走既有 skipped 兜底。
- **判定门禁完全不动**（evaluateUpdate/evaluateDeprecate/§9.1/transition/shouldExpirePending 在 Core 侧，P3-Plugin 仅接线驱动，不碰判定）；proposal 执行不绕 transition Guard。
- 不重引 daemon/scheduler；不改 checkAndPromote/checkTimeouts 既有行为与 StagingAccessSweepResult 既有字段。

## 验收（Node 22）

- `npm run build:check` 绿（消费 checkAndExecute(cap?)，tsc 通过）。
- 单测：(a) init **以 signalBus 调 subscribeToSignals 恰一次**（spy；重复 init 不二次订阅/或 Core 幂等已保证）；(b) sweep 在 checkTimeouts 后**以共享 cap 调 checkAndExecute**（spy/seam）；现有 sweep/KnowledgeModule 测试无回归。
- 全量单测无回归（对基线，记 failed-set）。
- **直接提交 main（不开分支）**。

## 回填要求

- `evidenceRefs` **纯仓库相对路径**（`AlembicPlugin/lib/injection/modules/KnowledgeModule.ts`、`AlembicPlugin/lib/runtime/mcp/host/staging-access-sweep.ts`、相关测试文件）；描述写 summary、commit/输出写 verification。
- `verification`：node -v、build:check、相关单测、全量 failed-set、commit hash + 改动文件。

## 完成定义

init 一次性幂等 `subscribeToSignals(signalBus)` 接通信号即时驱动 + sweep 在每 tick 以共享 cap 兜底 `checkAndExecute(cap)`，proposal（observing→update/deprecate、到期 pending GC）真正被驱动执行、单 tick 有界、判定门禁完好、未重引 daemon；Node22 build:check + 双轨单测 + 全量无回归绿；commit 落 main，回填 path-like evidenceRefs。完成后 **P3 阶段闭环**（proposal 执行链活）。
