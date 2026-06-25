# P1-Plugin — runSweep 透传 cap（consumer 侧）

- Demand: `alembic-lifecycle-automation-followup-2026-06-25`
- Phase: **P1**（consumer，紧随已验收的 P1-Core）
- Window / Repo: **AlembicPlugin** (`AlembicPlugin/`)
- Role: **consumer**（消费 AlembicCore 54dd9bb 的 `checkAndPromote(cap?)` 新签名，经 `@alembic/core`=`file:../AlembicCore` live symlink）
- Design 权威: `Design/docs/current/alembic-lifecycle-automation-followup-2026-06-25.md` §P1 step 3
- 前置: 读 父 `CLAUDE.md` + `AlembicPlugin/CLAUDE.md` + 本 state root；声明窗口/仓库身份；只认领本任务。

## 前置已就绪（控制器已处理）

- **P1-Core 已验收**（AlembicCore main `54dd9bb`）：`StagingManager.checkAndPromote(cap?)`、`KnowledgeRepositoryImpl.findAllByLifecycles(lifecycles, limit?)`、`ProposalRepository.find` 的 `ProposalFilter.limit?` 均已落地，cap/limit 可选、未传=今日行为字节一致。
- **控制器已重建 Core dist**（Node22 `npm run build`，dist 是 gitignored 本地产物、无提交）：`@alembic/core` dist 现含 `checkAndPromote(cap?: number)`，本窗口 tsc 可见，可直接构建。

## 控制器已核实的 grounded 事实（file:line）

- `lib/runtime/mcp/host/staging-access-sweep.ts` `runSweep`(:92-127) 今天**仅**调 `stagingManager.checkAndPromote()`(:99)；`StagingManagerLike` 本地接口(:13-19) 只声明 `checkAndPromote()`；信封 `inFlight` 守卫(:68-70)、min-interval throttle(:71-73，默认 `ALEMBIC_STAGING_ACCESS_SWEEP_MIN_INTERVAL_MS`=15000)、2s 超时(:4 `DEFAULT_TIMEOUT_MS`，env `ALEMBIC_STAGING_ACCESS_SWEEP_TIMEOUT_MS`)。
- StagingManager 经 `container.get('stagingManager')`(:98) 取用。

## 改法（P1-Plugin 范围 —— 仅本项；不接线 checkTimeouts/checkAndExecute，那是 P2/P3）

1. `runSweep` 调用改为 `stagingManager.checkAndPromote(cap)`，cap 从 env 读取、**默认 50**。建议 env 名 `ALEMBIC_STAGING_ACCESS_SWEEP_CAP`（与既有 sweep env 家族一致）；把 cap 作为**共享 sweep 上限常量**实现，因为 P2 `checkTimeouts(cap)` 与 P3 `checkAndExecute(cap)` 将复用同一 cap。
2. 更新 `StagingManagerLike` 本地接口为 `checkAndPromote(cap?: number)`，与 Core 新签名对齐。
3. 沿用 inFlight / throttle / 2s-timeout 信封不变。

## 硬不变量（违反 = scope 变更，停手回控制器）

- cap 现在让 sweep 的 promote **有界**（大冷扫 >cap 到期项时单次只晋级 ≤cap、跨多次工具调用排空）——这是 **P1 设计意图的行为变更（有界化，完成定义#1 授权）**，不是越界。
- **不接线 checkTimeouts/checkAndExecute 的驱动**（P2/P3）；信封/throttle/超时机制不变；不改 sweep 结果结构语义。
- 不重引 daemon/scheduler；不放松任何判定门禁。
- cap 默认值落在 Plugin sweep 侧（Core 不设默认）；env 可调、需文档化。

## 验收（Node 22）

- `npm run build:check` 绿（消费 Core 新签名，tsc 通过）。
- sweep 单测（`test/unit/StagingAccessSweep.test.ts` 等）：断言 `checkAndPromote` 被以 cap 调用（默认 50；env 覆盖生效）；现有 sweep 测试无回归。
- 全量单测无回归（对基线，记录 failed-set 基线）。
- **直接提交 main（不开分支）**。

## 回填要求（重要——避免控制器闭环 evidence-gate 摩擦）

- `evidenceRefs` **必须用纯仓库相对路径**（如 `AlembicPlugin/lib/runtime/mcp/host/staging-access-sweep.ts`、`AlembicPlugin/test/unit/StagingAccessSweep.test.ts`），**不要**在 ref 串里加描述文字或 commit 哈希——描述写 `summary`、commit 哈希与命令输出写 `verification`。否则控制器 `reduce_results` 闭环会判 evidence 非 path-like、需返工修复。
- `verification` 列出：node -v、build:check 结果、sweep 测试结果、全量测试 failed-set、commit hash + 改动文件。

## 完成定义

sweep 以默认 cap=50（env 可调）调 `checkAndPromote(cap)`，promote 有界、信封不变、未接线 P2/P3、未重引 daemon、门禁未触；Node22 build:check + sweep 测试 + 全量无回归绿；commit 落 main，回填 path-like evidenceRefs + 原始证据。
