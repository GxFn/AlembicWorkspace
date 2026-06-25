# P3-Core-2 — 界定 #expireOldPending 的 pending GC（整 tick 严格有界，producer 侧）

- Demand: `alembic-lifecycle-automation-followup-2026-06-25`
- Phase: **P3**（producer 追加，用户决策 Option A 后；先于 P3-Plugin）
- Window / Repo: **AlembicCore** (`AlembicCore/`)
- Role: **producer**（P3-Plugin 经 `@alembic/core` 消费已完全有界的 checkAndExecute）
- 背景: P3-Core(`439c960`) 已 cap-bound checkAndExecute 的 observing 查询并验收。但 `checkAndExecute` 内部于 :289 无条件调 `#expireOldPending`(:478)，后者 `find({status:'pending'})` **无界全扫 + 逐条 markExpired**。checkAndExecute 此前是孤儿、此扫描从未在 tick 跑过；P3-Plugin 接入 tick 会首次引入 tick 内无界扫描。**用户裁断 Option A**：一并界定它，使整个 capped checkAndExecute tick 路径严格有界。
- 前置: 读 父 `CLAUDE.md` + `AlembicCore/CLAUDE.md` + 本 state root；声明窗口/仓库身份；只认领本任务。

## 控制器已核实的 grounded 事实（file:line）

- `src/service/evolution/ProposalExecutor.ts`：`checkAndExecute(cap?)`(:266) 在 bounded observing 循环后 :289 调 `this.#expireOldPending(result)`；`#expireOldPending(result)`(:478) = `const oldPending = this.#repo.find({ status: 'pending' });`(无 limit) → 逐条 `if (EvolutionPolicy.shouldExpirePending(proposal.proposedAt, now)) this.#repo.markExpired(...)`。
- `ProposalRepository.find` 已支持可选 `limit` + `oldestFirst`（P3-Core `439c960` 落，默认 desc/无界不变）。

## 改法（范围 —— 仅让 pending GC 在 capped 模式有界；不接线 sweep/init，那是 P3-Plugin）

1. 让 `checkAndExecute(cap)` 把有界传导到 `#expireOldPending`：cap 给定时 pending GC 查询走 `find({ status: 'pending', limit: <budget>, oldestFirst: true })`（复用 P3-Core 的 oldestFirst=proposedAt 升序、最旧/最可能到期者优先）。
2. **推荐：跨 observing+pending 共享单一 remaining 预算**（与 P2-Core checkTimeouts 的 total-budget 一致）——`remaining=cap`，observing 循环按实际处理/扫描行数递减 remaining，`#expireOldPending` 收 remaining 作其查询 limit；使**整个 capped checkAndExecute 单 tick 扫描+写 ≤cap**。（窗口可选"pending 独立 ≤cap"，但须保证整 capped checkAndExecute 有界、并在 commit 说明所选语义；推荐 shared-remaining 以达成完成定义#1「每次有界」最严格解读。）
3. `cap===undefined` → observing 与 pending GC **均维持现行无界**（`find({status:'pending'})` 不变、字节一致契约）。
4. `#expireOldPending` 的签名按需扩展（如 `#expireOldPending(result, limit?)`），仅内部 private 方法。

## 硬不变量（违反 = scope 变更，停手回控制器）

- **判定门禁完全不动**：cap/limit 只限"处理多少条"，`EvolutionPolicy.shouldExpirePending` 何时判定过期、`markExpired` 写法、observing 侧 evaluateUpdate/evaluateDeprecate/§9.1/transition Guard 全保留。
- capped 时 pending 查询带 LIMIT + 最旧优先、跨 tick 排空不饿死；**cap===undefined 两条查询均无界（字节一致）**。
- 不重引 daemon/scheduler；不接线 sweep/init 驱动（P3-Plugin）；不改 observing 侧 P3-Core 既有 cap 行为。

## 验收（Node 22）

- 新单测：构造 >budget 条到期 pending → capped checkAndExecute 单 tick 仅 markExpired ≤budget 条（最旧优先）、多 tick 排空；pending 查询带 LIMIT（spy/seam）；（若 shared-remaining）observing+pending 单 tick 总处理 ≤cap；`checkAndExecute()` 无 cap 时 pending GC 仍无界（现行）；**门禁仍不被绕过**（沿用/扩充 P3-Core 的门禁保留断言）。
- `npm run build:check` 绿。
- **`npm run build`（emit dist）** 供 P3-Plugin 消费。
- 全量单测无回归（对 P3-Core 基线 131 files/1335 tests，记 failed-set）。
- **直接提交 main（不开分支）**。

## 回填要求

- `evidenceRefs` 纯仓库相对路径（`AlembicCore/src/service/evolution/ProposalExecutor.ts`、`AlembicCore/test/<测试文件>`，如改 find 亦含 ProposalRepository.ts）；描述写 summary、commit/输出写 verification。
- `verification`：node -v、build:check、`npm run build`(emit dist)、新单测、全量 failed-set、commit hash + 改动文件。

## 完成定义

capped `checkAndExecute` 的 pending GC 亦有界（带 LIMIT+最旧优先、跨 tick 排空），整个 capped checkAndExecute tick 路径严格有界（推荐 ≤cap 共享预算）；`cap===undefined` 两查询均无界字节一致；判定门禁/markExpired/shouldExpirePending 未触；未重引 daemon、未接线 P3-Plugin；Node22 build:check+新单测+全量无回归绿；已 `npm run build` 重生 dist；commit 落 main，回填 path-like evidenceRefs + 原始证据。
