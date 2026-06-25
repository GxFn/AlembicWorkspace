# P3-Core-Fix — ProposalExecutor dual-track re-entrancy 修复（F-A，producer 侧）

- Demand: `alembic-lifecycle-automation-followup-2026-06-25`
- Phase: **P3 修复**（Test e2e 发现 F-A、用户裁断 Option A 授权；先于 Test 重验）
- Window / Repo: **AlembicCore** (`AlembicCore/`)
- Role: **producer**（修复后 dist 重生，Plugin 不改、Test e2e 重跑重验 ④）
- 前置: 读 父 `CLAUDE.md` + `AlembicCore/CLAUDE.md` + 本 state root；声明窗口/仓库身份；只认领本任务。

## 背景（Test e2e 真实运行时实证 + 控制器源码核实的缺陷 F-A）

P3 双轨（init subscribeToSignals + sweep checkAndExecute）接入后，Test e2e 在真实运行时发现：**每个 UPDATE proposal 被误标 executed→rejected**（'Invalid transition: evolving → evolving'），单 proposal 隔离即复现。完成定义#3「update 活起来」因此未达。

**根因（控制器对照源码确认）**：`src/service/evolution/ProposalExecutor.ts`
- `#executeUpdate`：先 `transition({targetState:'evolving', trigger:'proposal-attach'})`（该 transition **发 lifecycle 信号**），`markExecuted` 在方法**最末**（patch + evolving→active/staging 之后）。故执行进行中 proposal **仍 `status==='observing'`**。
- `subscribeToSignals`→`#onSignal`(:~118 `proposals.filter(p => p.status==='observing')`)→`#evaluateOnSignal`→`#executeUpdate`：上面那条 active→evolving 信号被 init 注册的订阅者**re-enter**，对**同一 still-observing proposal** 再执行 → 第二次 active→evolving（entry 已 evolving）→ transition guard 报 'evolving→evolving' invalid → `markRejected`。
- 净效果：entry 状态一致（active→evolving→active 完成一次），但 proposal **终态误标 rejected 而非 executed**。unit 分别 mock 两轨故未暴露；真实运行时双轨同活才触发。

## 改法（范围 = ProposalExecutor re-entrancy 安全；**不改判定门禁/transition Guard/proposal 状态语义**）

让 proposal 执行**re-entrancy 安全**，使同一 proposal 不被自身执行触发的信号二次执行。推荐**in-flight 守卫**（最小、无 schema 变更）：
1. ProposalExecutor 持一个 `#inFlight: Set<string>`（proposalId）。
2. 真正执行某 proposal 前（`#executeUpdate`/`#executeDeprecate` 入口，或更上层 `#evaluateOnSignal`/checkAndExecute 处理单条前）将其 id 加入 `#inFlight`；`finally` 移除。
3. `#onSignal`/`#evaluateOnSignal` 与 `checkAndExecute` 的处理循环**跳过 `#inFlight` 中的 proposal**（与既有 `status==='observing'` 过滤并列）。
（窗口可选等效方案：执行前把 proposal 标记为非 'observing' 的瞬态进行中态再 markExecuted/markRejected——但须保证失败路径状态正确、不破坏 schema；若选此须 commit 说明。）

**关键不变量**：
- 合法的**信号驱动执行仍生效**（守卫只挡"已在执行中的同一 proposal 的二次进入"，不挡 not-in-flight proposal 的首次信号驱动）。
- **首次/合法执行照常跑完判定门禁 + transition**，到达正确终态：合格 update→`executed`、不合格→门禁 reject、deprecate→按门禁（F-B 另议，本次不改 deprecate 数据流）。
- **判定门禁零改**（evaluateUpdate/evaluateDeprecate/§9.1/transition Guard 全保留）；proposal 不绕 transition Guard；不重引 daemon。
- 不改 checkAndExecute 的 cap 有界语义（P3-Core/P3-Core-2 已验收）、不改 subscribeToSignals 幂等。

## 验收（Node 22）

- 新回归单测**复现 re-entrancy**：用真实 SignalBus + `subscribeToSignals` + 触发一次会发 lifecycle 信号的 UPDATE 执行（checkAndExecute 或信号驱动），断言：(a) 该 UPDATE proposal 终态 **`executed`**（非 'evolving→evolving' rejected）；(b) 同一 proposal **只执行一次**（无二次 transition 尝试 / in-flight 跳过）；(c) 合法信号仍能驱动 not-in-flight proposal。
- 门禁保留回归仍绿（无 usage update 仍 reject 等，沿用 P3-Core 的断言）。
- `npm run build:check` 绿；`npm run test` 全量无回归（对 P3-Core-2 基线 131 files/1340 tests）。
- **`npm run build`（emit dist）** 供 Plugin 消费、Test e2e 重跑。
- **直接提交 main（不开分支）**。

## 回填要求

- `evidenceRefs` 纯仓库相对路径（`AlembicCore/src/service/evolution/ProposalExecutor.ts`、`AlembicCore/test/<回归测试文件>`）；描述写 summary、commit/输出写 verification。
- `verification`：node -v、build:check、`npm run build`(emit dist)、re-entrancy 回归测试结果（executed 不再误标 rejected）、全量 failed-set、commit hash + 改动文件。

## 完成定义

dual-track 下 UPDATE proposal 不再被自身信号 re-entrancy 误标 rejected、合格 update 真正到达 `executed`、合法信号驱动仍生效、判定门禁/transition Guard/cap 有界/subscribeToSignals 幂等全不变；Node22 build:check + re-entrancy 回归 + 全量无回归绿；已 `npm run build` 重生 dist；commit 落 main，回填 path-like evidenceRefs。完成+dist 重生后由控制器重跑 Test e2e 重验 ④。
