# 任务包 波1 · U4-Core — evolution 衰减触发器恢复（DecayDetector，Core 侧）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicCore**（`@alembic/core` 内核源仓，改 live、`dist/` 不提交）
- Wave: 波1（与 AlembicPlugin 的 UM 并行）；**强制串：本任务必须先于 U5-Core 落地（同窗口下一任务，两次 Core commit、U4 先）**
- Baseline: AlembicCore@**d49fc05**（clean）。行号取自 U0 重基线实测，落地前对当前 HEAD 复核。

## 身份门（先做）
确认当前目录=AlembicCore 仓、任务分配给 AlembicCore。读 `../CLAUDE.md` + `../.wakeflow-active/index.md` + `../.wakeflow-active/current/alembic-recipe-lifecycle-global-2026-06-26/`（含本任务包 + `evidence/u0-rebaseline-2026-06-26.md`）+ 本仓 `CLAUDE.md`。

## 范围（只改 DecayDetector + 其单测；不碰 ProposalExecutor=U5、不碰 staging、不碰 Plugin）
全在 `src/service/evolution/DecayDetector.ts` + `test/unit/DecayDetector.test.ts`。

| # | file:line（当前 HEAD） | change | 怎么改 |
|---|---|---|---|
| 1 | `DecayDetector.ts:326` `Math.min(1, authorityRaw/100)` | **fix** | 改 `Math.min(1, Math.max(0, authorityRaw/5))`。真相：authority 是 0-5 域（`KnowledgeService.ts:768 Math.round(score*5)`，仅证据不改）。补中文注释说明域来源。 |
| 2 | `DecayDetector.ts:325` `?? 50` | **fix（与 #1 同 commit，CG-4/B3 硬性）** | 改 `?? 2.5`（0-5 中性默认）。否则缺 stats.authority 的 recipe 得满 authority 掩盖衰减。 |
| 3 | `DecayDetector.ts:311` freshness（`lastHit>0?…:365`→freshness≈0，无 grace；`NO_USAGE_DAYS=90`@:85；镜像 created_at 回落 :178-188） | **fix（与 #1 同 commit，CG-4）** | 加 cold-start grace：freshness 在 lastHitAt 缺失时**回落 createdAt**（镜像 :178-188 的 created_at 路径），或 `age<NO_USAGE_DAYS(90)` 豁免。目标：健康新 recipe（lastHitAt=null/createdAt=now）首 tick **不被判 severe/dead、不被 transition**。 |
| 4 | `DecayDetector.ts:127` `scanAll()`（无界）+ `#loadActiveRecipes`:250-252 | **extend（additive）** | `scanAll(cap?)`：`undefined` 保持无界（字节兼容）；数值经 `#loadActiveRecipes` 透传 `findAllByLifecycles(['active'], cap)`（:415-437 已支持 cap/最旧优先）。**Core 不设默认**（由 Plugin sweep 定）。 |
| 5 | `DecayDetector.ts` 构造器 + scanAll 主体 | **extend（additive）** | 注入**可选** `lifecycleStateMachine`；scanAll 对 `level∈{decaying,severe,dead}` 调 `transition({targetState:'decaying',trigger:'decay',evidence,recipeId})`（`Lifecycle.ts:79` active→decaying 合法、:94 isValidTransition guard 幂等）。**保留** `signalBus.send('decay')` 作可观测。**B1：不依赖 ProposalExecutor 信号订阅**（onSignal 需预存 observing proposal、decay 无预建→落空）。`decaying→deprecated` 仍由现役 `checkTimeouts` 30d 接管，不在本任务。 |
| 6 | `DecayDetector.test.ts`（doc :53/69/94/109/122/142/155 锚点） | **fix** | 测试域从 0-100（80/100=掩盖 bug 元凶）改 **0-5 真实域**（healthy 用 4-5、severe/dead 用 0-1）。**新增断言**：authority=4 其它维度健康的 active 不被误判 dead/severe（锚 BiliDili）。 |

## 验收（B 节 U4 可证伪口径；真机用只读读 BiliDili DB 比对）
1. **[authority 单测]** authority=4 + 其它维度健康 → `dimensions.authority===0.8`（非 0.04）；authority=0→0；5→1；**无 key→0.5**（`?? 2.5`）。
2. **[cold-start 不误判，修前必红/修后绿]** 构造 BiliDili 同形（lastHitAt=null/createdAt=now/quality=0.85/authority=4）跑 scanAll → level **非** severe/dead **且不** transition。（修前该形真机 level=severe 会被错误 transition。）
3. **[真机三态对照]** 用 BiliDili DB（3 条 active authority=4/lastHitAt=null）只读核：修前 decayScore≈18(dead) / 仅修 authority≈33(severe，仍坏) / 全修（含 grace）→ 不 transition。给出三态数值。
4. **[有界]** `scanAll(cap)` 单 tick ≤cap（最旧优先，经 #loadActiveRecipes→SQL LIMIT）；`cap=undefined` 全表（字节兼容，无 cap 调用方不变）。
5. **[迁移·非信号·幂等]** 注入 mock lifecycleStateMachine：scanAll 对 decaying/severe/dead 真调 transition（active→decaying）；decaying→decaying no-op 幂等；不依赖信号订阅。
6. **[兼容/门禁]** 5 策略/4 维评分/level 阈值/grace 语义不变（authority 归一 + cap/transition 为 additive）；Node≥22 下 `npm run build:check` + `npm run test`（至少 DecayDetector + evolution）+ `npm run lint` 绿；**`npm run build` 重生 `dist/`**（供 U4-Plugin 经 `file:../AlembicCore` 消费）。

## 跨仓与提交纪律
- 只改本仓 live 源；不碰 vendor。Core 跨能力变更分阶段提交：**#1+#2+#3(freshness) + 0-5 测试必须同一 commit（CG-4/B3）**；#4 scanAll cap + #5 transition 注入可同 commit 或紧随第二 commit，但**全部须在本窗口开始 U5-Core 之前 landed + green**。
- 提交到 main（无分支）。**不 push/tag/bump**（等用户逐次授权）。

## 禁止
- 不放松衰减判定门禁（仅恢复触发器 + 修 authority 量纲 + 加 cold-start grace）；不碰 staging；不改 ProposalExecutor（U5）；不重引 daemon/scheduler；不改 `KnowledgeService.ts:768`（仅证据）。

## 回填（TargetResultEnvelope）
完成范围、**commit hash**、`build:check`/`test`/`lint`/`build` 命令与输出摘要、三态 decayScore 数值、grep 证据。**evidenceRefs 用 path-like 裸仓库相对路径**（如 `AlembicCore/src/service/evolution/DecayDetector.ts`），勿用描述串/commit-hash 作 ref。完整性自检：覆盖行为端到端、边界、与原始目标对照。证不完整→返回 blocked/needs-review。
