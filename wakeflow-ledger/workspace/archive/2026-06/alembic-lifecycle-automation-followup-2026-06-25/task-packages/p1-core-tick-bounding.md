# P1-Core — tick 有界化基础（查询 LIMIT + cap N，producer 侧）

- Demand: `alembic-lifecycle-automation-followup-2026-06-25`
- Phase: **P1**（顺序硬性 P1→P2→P3→P4；P1 先于一切驱动）
- Window / Repo: **AlembicCore** (`AlembicCore/`)
- Role: **producer**（本阶段 Core 先落可选 cap/limit 形参；AlembicPlugin 在 P1-Plugin 消费、经 `@alembic/core`=`file:../AlembicCore` live symlink 依赖本签名）
- Design 权威: `Design/docs/current/alembic-lifecycle-automation-followup-2026-06-25.md` §P1
- 前置: 读 父 `CLAUDE.md` + `AlembicCore/CLAUDE.md` + 本 state root；声明窗口/仓库身份；只认领本任务。

## 背景

PDR-3 删 daemon 后，daemon-less 化只补了 1/3（autoApprovable staging→active，由 Plugin 的 tick-on-access sweep 调 `StagingManager.checkAndPromote` 实现）。本需求补其余孤儿自动化。**P1 = 让 sweep 有界**：当前两个生命周期查询 `.all()` 无 `.limit()`，且 sweep 的 2s 超时只挡调用方等待、不挡 `.finally` 后台 work，大积压下一次冷扫长跑多写。

## 控制器已核实的 grounded 事实（file:line）

- `src/repository/knowledge/KnowledgeRepositoryImpl.ts:408 findAllByLifecycles(lifecycles)` — `.where(inArray(lifecycle, ...)).all()`，**无 `.limit()`**。
- `src/repository/evolution/ProposalRepository.ts:209 find(filter)` — `.where(condition).orderBy(desc(proposedAt)).all()`，**无 `.limit()`**。
- `src/service/evolution/StagingManager.ts:105 checkAndPromote()` — 查 `findAllByLifecycles(['staging'])`(:109)，是 Plugin sweep **今天唯一驱动**的方法。

## 改法（P1-Core 范围 —— 仅本三项；不要在此接线 checkTimeouts/checkAndExecute 的驱动，那是 P2/P3）

1. **`findAllByLifecycles`** 增可选 `limit?: number`：传入时对查询加确定性**最旧优先** ORDER BY + `.limit(limit)`（capped 读取取最积压的，跨多次 tick 排空、不饿死）；未传 → 现行无界行为**字节一致**。选一个稳定可排序列（如 createdAt/进入态时间戳）并在 commit 说明里说明所选列与"最旧优先"语义如何对应。
2. **`ProposalRepository.find`** 同增可选 `limit`（形参或挂 `ProposalFilter`）：传入时加 `.limit()`；未传 → 现行行为不变。这是 P3 `checkAndExecute` 复用的共享基础设施，按 design "P1 先于一切驱动"在此一并落。
3. **`StagingManager.checkAndPromote`** 接受可选 per-call `cap?: number`：传入时取最旧 `cap` 条到期 staging（把 limit 透传给查询）、晋级 ≤cap；**未传 → 无界（现行行为保留）**。cap 的默认值（如 50）**不在 Core 设**——由 Plugin sweep（P1-Plugin）提供；Core 视 `cap===undefined` 为无界。

## 硬不变量（违反 = scope 变更，停手回控制器，不要擅自做）

- **纯 additive / 向后兼容**：每个新形参可选；不传参时行为与今日字节一致（现有测试保持绿）。
- **capped 路径查询必带 LIMIT** —— 不在 capped 路径上 `.all()` 全表。
- **capped 时确定性最旧优先**选取（多 tick 排空积压，无饿死）。
- **判定门禁零改**：不动 `EvolutionPolicy.evaluateUpdate`/`evaluateDeprecate`、§9.1 active-modification guard、`LifecycleStateMachine.transition` 的 Guard。P1 只做有界化。
- **不重引 daemon/scheduler**；**不接线 checkTimeouts/checkAndExecute 的驱动**（P2/P3）；不改 staging 语义（仍仅 checkAndPromote 晋级）。

## 验收（Node 22；`.nvmrc=22`，Node18 假红不算）

- 新单测：(a) `checkAndPromote(N)` 在 >N 条到期 staging 下只晋级 ≤N；(b) 重复调用按最旧优先排空积压；(c) `checkAndPromote()` 无 cap 仍无界（现有行为）；(d) capped 路径查询确加 `.limit()`（用 spy/seam 断言，无全表 `.all()`）。
- `npm run build:check` 绿（Node 22）。
- 现有全量单测无回归（对基线）。
- **直接提交 main（不开分支）**。回填：commit hash + 改动文件清单 + 原始 build/test 输出（raw，非转述）。

## 完成定义

两个仓库查询具备可选 LIMIT、`checkAndPromote` 具备可选 cap 且 capped 时最旧优先有界排空；默认（不传参）行为字节不变；门禁未触；Node22 build:check + 全量单测绿；commit 落 main 并回填原始证据。
