# Wakeflow 总控「围棋大师」化 — 实时漂移感知 + 分支预演 + 证据接地裁判 — 需求设计(strict · 初稿)

> # ⛔ 已放弃 / SUPERSEDED(2026-06-26)
> **本需求已被用户主动放弃**,由聚焦需求 [`wakeflow-parallel-dev-intent-drift-2026-06-26.md`](wakeflow-parallel-dev-intent-drift-2026-06-26.md) 取代(只保留:意图漂移 observe-only + 验收即产出 + 并行开发 stream=独立窗口;放弃 rubric 引擎 / 裁判 / MCTS 分支搜索 / value-net / 多信号漂移合成体)。以下内容仅作**思考留痕**,不再作为权威或施工依据;其曾标「已拍/锁」的 PD 一并作废。
>
> 状态(历史):**PD 已拍 + 源码核验完成(2026-06-26)**。**锁 A(漂移 M0)+ B(裁判 M1)与各 PD;分支读棋 M2-M3 缓建。** 核验结论见「源码核验结果」:**裁判 + rubric 低摩擦可落;3 漂移信号里只有 `costNoProgress` 可从既有数据算,`gateTrajectory`/`scopeDrift` 需新管线 → M0 改为按就绪度三小步(M0-a/b/c)**。**未 intake、未派发、未碰既有状态机。**

## 触发与定位

- **用户构想(2026-06-26 本对话)**:把总控升级为一位会"读棋"的围棋大师——
  1. **锚点(用户固化)**:在 **回调总控时(controller-return)做实时漂移检查**——离最终目标的偏差,以 controller-return 为节拍连续感知。
  2. 在**真岔路口**用 worktree 多窗口**预演**多条实现分支,按"最接近最终目标"取舍;坏方向**廉价认输、丢弃**。
  3. Design 当前隔离、只面对需求 = 持目标"定尺子的眼";需**另造第二只眼**(对着真实证据"数目数"的裁判)。
- **本质**:把总控从"派发—验收的状态机"升级为"**读 → 判 → 决**的大师循环",其中 controller-return 是天然的 *move boundary*(落子边界)。
- **归属**:这是 **Wakeflow 能力仓**(`CodexPlugin/Wakeflow`,`GxFn/Wakeflow`)需求,**非 Alembic 产品**需求。能力落 `core/`(双宿主共享),host 词仅在 L3。设计/计划文档留本工作区 ledger,不进 Wakeflow 仓(其只收可复用能力资产)。

## 业界现状定位(2026-06 实证,见「证据与链接」)

| 层 | 现状 | 结论 |
|---|---|---|
| 手(并行 worktree 多窗口) | ✅ 已量产(claude-squad / vibe-kanban / conductor 等),**选择几乎全人工,无 best-of-N / 自动按目标评分** | 借现成隔离机制,**眼自己造** |
| 眼(MCTS + PRM / verifier) | 🔬 研究级,评估**接地于测试执行 / 验证器**(PG-TD、VerMCTS、ReST-MCTS*、RPM-MCTS),但仅"带测试用例的单函数",非真实仓库,未接进 worktree 工具 | 算法可借,**搬到真实仓库 + 本域 rubric** 是新工作 |
| 漂移传感(实时) | 🔬 2026 刚起(Trajectory Guard:32ms,比 LLM-Judge 快 17–27×;TrajAD;Asymmetric Goal Drift in Coding Agents),且**是异常检测,非校准 %**;PRM 是训练期、明确**不充当运行时监控** | 廉价 monitor 范式可借,**接进编码 agent + 锚 controller-return** 无人做 |
| **四者合一 · 真实仓库 · 证据接地** | ❌ **无人拼出** | **本需求的开口;Wakeflow evidence-first 是差异化** |

**共性铁律(所有做成者):评估接地在"执行/测试/证据"上,从不靠 LLM 感觉。** 这恰是 Wakeflow 的本命,设为本需求地板。

## 最终目标(完成定义)

让总控在**真实仓库**上,以 **controller-return** 为节拍:

1. **连续感知漂移**:每个 controller-return 计算一组**廉价、grounded**的漂移信号(非 LLM-judge、非校准 %),沉淀为 state-root 内的漂移轨迹 + 阈值告警态(green/watch/trip)。
2. **撞崖才召贵眼**:仅当廉价信号 **trip** 时,召唤独立**裁判**裁定"真漂移 vs 必要绕路";**不靠廉价信号自动杀线**。
3. **真岔路口才预演**:在「方向不确定 ⨉ 走错代价高」的 fork(人工标 / 漂移发现 / Design 标),开 worktree **分层预演**(scout 浅推多条 → 只 deep 深推赢家),**按 Design 出的 rubric + 真实证据**择优。
4. **坏方向廉价认输(认输=停投入,非立即删)**:确认漂移/落败分支**停止投入**——其 worktree **保留待开发者回来查**(留痕:看真实代码,不只看结论),之后**有界 GC**(开发者 ack 或超期回收)。代价仅其算力,无物依赖它(无纠缠),故仍轻。
5. **比较理由沉淀**:为何赢、从落败者嫁接什么、赢家漏掉什么风险、"哪种手掉了率"——写入 decision log,作为日后训练**本域 value-net** 的语料。
6. **机器本身保持轻**:只在该读时读(fork-only);目标不够利(无法生成可判定 rubric)则**拒绝开分支/拒绝漂移评分**(fail-closed);看的人与被看的人分离(防 Goodhart)。

**可证伪完成定义**:存在一个真实仓库 e2e——能在 controller-return 轨迹上**看到漂移在某 return 点掉崖**、裁判**裁定真漂移并触发分支搜索**、多分支**按 rubric+证据产出可复核排序**、赢家深推+落败 worktree 被丢、decision log **含可复核的比较理由**;且全程**无校准 %、无廉价信号自动杀线、目标不利时正确拒绝**。

## §0 跨块统一前提(固化决策 + 红线)

> 这些是贯穿全设计的硬前提,违反即停。

1. **锚点 = drift-check @ controller-return**(用户固化)。漂移感知挂在既有 controller-return 评审流上,**不**新增 per-line / 常驻轮询。
2. **两眼分离**:**Design = 定尺子的眼**(隔离、只面对需求,在 fork 输出 rubric);**Referee = 数目数的眼**(对着证据、独立排序)。**严禁把建好的分支塞回 Design 让它加冕赢家**(污染 + 自批改)。**Referee ≠ 执行窗口**(防 Goodhart)。
3. **不印校准 %**:漂移输出是**趋势 + 阈值穿越**,不是"73% 接近目标"。假精确比没有更危险。
4. **廉价信号只报警,不自动杀线**:必要绕路会造假崖;真漂移由贵眼裁定。
5. **Fork-only**:仅「不确定 ⨉ 走错代价高」才进分支模式;方向明确就一条线走到底——**别让机器自己变成承重墙**。
6. **Sharp-goal-or-refuse(fail-closed)**:完成定义尖锐不到能派生可判定 rubric,就**拒绝**开分支 / 拒绝漂移评分,退回"周期性贵眼 check-in"。无利目标 → 大师退化成烧钱乱猜。
7. **接地于执行/证据,从不靠 vibes**(铁律)。
8. **不重引常驻重机器**:沿用 tick-on-access / at-return 的廉价节拍,不回 daemon/scheduler。
9. **双宿主**:能力落 `core/`(Codex + Claude Code 共享,`npm run sync:core` 字节一致);host 名词仅在 L3。skills/entrypoints/references **per-edition**。
10. **复用既有件,不另起炉灶**:controller-return、review_pack、reduce_results、decide_review、code_guard/边界、worktree 隔离、dispatch group、Design handoff、cap/预算机理——本需求是**重组 + 补两只器官**,非重写。

## 算法与模板引入(研究 → Wakeflow 适配)

> 引入既有算法范式,但都做了"真实仓库 + 贵 rollout + 证据接地"的适配,不照搬。

### T1 漂移传感器(廉价、连续) — 借 Trajectory Guard 范式
- **不**每 return 跑 LLM-judge(太贵太抖);改为**复合 grounded 信号向量**,每 controller-return 计算一次:
  - `rubricCoverageΔ` — Design rubric 中**可机械判定**项的满足/违反变化;
  - `gateTrajectory` — 测试通过数 / 新增失败 / type / lint(最接近"掉崖"的真信号);
  - `scopeDrift` — diff 是否触碰 task-package 声明 scope / 仓库边界外(借 code_guard/边界);
  - `planDivergence` — 实际步骤 vs Design 预测步骤计划的偏离;
  - `churn` — 同一处反复重写 / 自我推翻(编辑/commit 史,免费);
  - `costNoProgress` — 花的 token/步/时 vs 新满足的 rubric 项(**最佳单一代理**)。
- 输出:漂移**向量 + 轨迹点**(append 进 state-root)+ 三态 `green/watch/trip`。**非概率**。
- 可选增强(M4+):一个轻量序列模型(autoencoder/对比学习)学"本任务正常轨迹 vs 跑偏",像 Trajectory Guard 那样毫秒级、远快于 LLM-judge。

### T2 证据接地裁判(第二只眼) — 借 PG-TD / VerMCTS / Bernstein-Janitor
- 评估**组合**:硬闸过滤(绿/可判定 rubric 项命中,机械)→ 裁判对幸存者**按 rubric + 引证排序** → 简单度(diff/blast-radius)平手裁决。
- **接地**:裁判信号来自测试执行 / gate 证据,引用具体证据,**不许凭感觉**。
- **对抗**:可选 N 个独立裁判投票(多数);裁判 prompt 默认"先尝试反驳赢家",防过度自信。

### T3 分支搜索(读棋) — 借 MCTS/beam(ReST-MCTS*),但认 rollout 昂贵
- 围棋读棋免费、代码 rollout 真烧钱 → **分层**,非全 MCTS:
  - **Scout 档(浅推)**:每方向单 scout 窗口 → `{spike + 预测步骤计划 + 烟雾信号}`,廉价、可 2–4 条;
  - **Deep 档(深推)**:仅赢家(+ 至多 1 条对冲)上全队(controller+product+Test);
  - 多轮 scout→prune 形成 beam;同方向可多采样(LLM 非确定)。
- 预算:width/depth 上限;升级只给赢家。

### T4 策略学习(养棋感,长线) — 借 ReST-MCTS* 自训练思路
- decision log + drift 事件(哪种手掉率、最后真错还是绕路)= **本域语料**;先 record-only,vN 训练一块**廉价 value-net**(代码界一直缺、买不到的那只眼),反哺 fork 识别与剪枝。

## 组件设计(对 Wakeflow 结构的映射)

> 每件:hook 点 / 输入(grounded)/ 输出 artifact / state-root 扩展 / MCP / skill / 复用。file:line 标「待核验」。

### A. Drift Sensor @ controller-return 【用户锚点 · 阶段 M0】
- **Hook**:controller-return 落地评审流(record_target_result → review_pack/reduce_results 之间)。〔待核验:host helper readback + review_pack 入口 file:line〕
- **输入**:本 return 的 TargetResultEnvelope 证据 + Design rubric + 历史漂移轨迹 + 成本计数。
- **输出**:漂移向量 + 轨迹点 + `green/watch/trip` + (trip 时)escalation 标记。
- **state-root 扩展**:`driftTrajectory[]`、`driftAlert`、阈值配置。
- **MCP**:新增 `wakeflow_drift_check`(或并入 review_pack 输出一个 `drift` 块,倾向后者以减面)。
- **复用**:review_pack、reduce_results、code_guard/边界、成本计数。

### B. Evidence-grounded Referee(第二只眼)【keystone · 阶段 M1】
- **Hook**:fork 的分支证据齐备后(或"比较两次尝试"场景),由总控调起。
- **输入**:各分支 grounded 证据 + Design rubric。
- **输出**:带引证的排序 + 赢家 + 落败者可嫁接点 + 赢家漏掉的风险。
- **MCP**:新增 `wakeflow_referee`(独立角色;或一个专用 referee 窗口 profile,见 PD-2)。
- **复用**:decide_review 的评审/证据规范;**独立于** Design 与执行窗口。
- **注**:此件**不依赖分支**——单独就能"比较同一任务的两次尝试",故 M1 即可独立交付价值。

### C. Branch dimension + Scout/Deep tier(读棋手)【阶段 M2】
- **机制**:worktree-per-branch + **state-root 加 `branchId` 维度** + 窗口绑定/锁/预算加分支维度;dispatch group 携带 branchId。〔待核验:state-root 命名空间 + 窗口锁 file:line〕
- **窗口分层**:新增 **scout 档窗口 profile**(浅推、单窗口、轻预算);deep 档复用既有全队。
- **复用**:既有 worktree 隔离能力 + dispatch group + cap/预算。

### D. Fork detector + Master loop(合一)【阶段 M3】
- **Fork detector**:判「不确定 ⨉ 代价高」。M3-v0 人工标;M3-v1 由 A 的 drift-trip(裁定为"方向错")自动发现 + Design 标。
- **Master loop**:`drift-trip → 裁定真漂移 → fork → scout 浅推 N 条 → Referee 排序 → deep 深推赢家(+≤1 对冲)→ 丢弃落败 worktree → 写比较理由`。
- **复用**:wakeflow-controller / wakeflow-target skill 的循环骨架。

### E. Comparative decision log + policy corpus(记忆)【阶段 M4】
- **输出**:比较理由结构化沉淀;drift 事件结构化沉淀。
- **长线**:语料 → 训练廉价 value-net(record-only → train,PD-8)。

## 分阶段(对"造这台机器"本身也用「轻」)

> 每阶段独立可交付价值;前阶段不依赖后阶段;keystone 先立。

- **M0 — Drift sensing @ return**(用户锚点)。**无分支即可用**。**按信号就绪度分三小步(核验后定,见「源码核验结果」):**
  - **M0-a(零新管线,先上)**:`costNoProgress` 用既有 `counts.reworkCount/redesignCount`——"一个任务反复打回 = 在漂移";driftTrajectory 落新 sibling JSONL。
  - **M0-b(目标侧小改)**:`gateTrajectory`——target 在 target-result 上多吐结构化 gate 计数(schema 开放),review_pack 解析。
  - **M0-c(最重)**:`scopeDrift`——task-package 加结构化 scope 声明 + 把总控 review 时本就拉的 VCS diff 接进来比对。
  完成定义:真机一次执行中,漂移轨迹能在掉崖点显著下沉,且**不印 %**(M0-a 即达成最小版)。
- **M1 — Referee(第二只眼)**【keystone】。**无分支即可用**:对"同一任务两次尝试"按 rubric+证据排序并引证。完成定义:给定两份 grounded 证据,产出可复核排序 + 理由;裁判与 Design/执行隔离。
> **M2–M3(分支读棋)= 缓建(待真实使用验证)**:先把 M0+M1 跑起来(自洽、可独立交付);**真实使用证明"顺序 bail-retry 太贵、确需并行预探"之前,不建**。以下保留为设计储备。把"轻"用在路线图本身——不为未证明需要的昂贵能力提前付钱。

- **M2 — Branch dimension + scout tier**(读棋手)【缓建】。完成定义:同一 demand 下能开 ≥2 个 branchId 的隔离 worktree+scout 窗口,各出 `{spike+步骤+烟雾}`,互不串。
- **M3 — Fork detect + full master loop**【缓建】。完成定义:drift-trip → 裁定 → fork → scout → Referee → deep 赢家 → 落败 worktree 留痕+GC → 记理由,真机走通一遍。
- **M4 — Policy corpus → value-net**(语料从 A+B 即开始累积,**不依赖分支**:漂移事件 + 裁判对"顺序两次尝试"的比较理由)。完成定义:decision log + drift 事件结构化可导出为训练语料(先 record-only);value-net 训练为独立后续(PD-8)。

**producer/consumer**:M0 产漂移信号 → M3 消费触发 fork;M1 产裁判 → M3 消费排序;M2 产分支隔离 → M3 消费;Design rubric 契约是 M0/M1/M3 共同上游(见 PD-1)。

## 源码核验结果(2026-06-26 · M0+M1 grounding)

> 独立 agent 通读 Wakeflow 真实源码(`core/`),逐项 file:line。结论:**hook 点 + 裁判 + rubric 低摩擦;3 漂移信号就绪度参差、2 个需新管线**——据此把 PD-10「从既有证据算」订正为 M0-a/b/c 三小步。

**controller-return 链路(grounded)**:`record`(`wakeflow-state.mjs:932` commandImportTargetResult)→ `review_pack`(`wakeflow-delivery.mjs:945` → `wakeflow-review-pack.mjs` buildControllerReviewPack)→ `reduce`(`wakeflow-state.mjs:1080`)→ `decide`(`wakeflow-state.mjs:1309`)。**TargetResultEnvelope = 纯散文 + 引用**(`evidenceRefs/verification/risks` 都是 free-text `string[]`;target-result schema `additionalProperties:true` → 加字段免改契约)。

**M0/M1 可行性:**

| 信号 / 挂点 | 结论 | 关键 file:line | 含义 |
|---|---|---|---|
| `gateTrajectory` | **MISSING(结构化)** | `wakeflow-review-commands.mjs:102`(仅 presence 布尔) | 只有 free-text `verification[]` + "有没有证据"布尔;全仓零数值 pass/fail 模型。需 target 多吐结构化 gate 计数(schema 开放)+ review_pack 解析。 |
| `scopeDrift` | **MISSING(两半都缺)** | `wakeflow-review-commands.mjs:93`(`changedRepos` 仅仓库级) | envelope 只有仓库名 + commit hash,**无文件级 diff**;task-package 无机器可读 scope(`scope` 是 dispatch packet 上的死字符串、未读)。diff 现由总控 review 时**带外手动拉**(`skills/wakeflow-controller/SKILL.md:50`)。**三者中工作量最大、但也是最强信号**。 |
| `costNoProgress` | **PARTIAL → 可先上** | `wakeflow-state.mjs:1371`(`counts.reworkCount`) | dispatch/rework/redesign 轮次计数**已持久化、零新管线**;token/时间/步数 + 验收基线缺。"cost = 打回轮次"可即刻上。 |
| rubric 挂载 | **PARTIAL(有钩无结构)** | `wakeflow-state.mjs:673`(`sourceRef`)+ `task-package.schema.json:17`(开放) | 今仅不透明 `sourceRef` 指针 + 散文 `completionDefinition`。结构化 `rubric` 落 task-package(schema 已开放),一个 `add_task` 参,review 时在 `wakeflow-review-commands.mjs:78` 读。 |
| 裁判插入 | **READY(additive)** | `wakeflow-review-pack.mjs:71`(`gates` 旁) | review_pack 输出是无 schema 对象字面量;`drift` 块 + 顾问式排序紧贴 `gates`/`nextAction` 插入,零语义改动。若排序须落 candidate 则改 `transition-candidate.schema.json:26`。 |

**M0 据此分三小步(替代"一次上 3 信号")**:**M0-a** costNoProgress(零新管线,先上)→ **M0-b** gateTrajectory(target 侧小改)→ **M0-c** scopeDrift(scope 声明 + 接入 diff,最重)。

**schema 摩擦面(设计须知)**:开放(免改)= `target-result`、`task-package`;封闭(需改)= `wakeflow-state.json:89` 及 review/automation/projection 子对象(:66/76/86)、`transition-candidate:26`;**review_pack 输出无 schema = M0 漂移输出最低摩擦面**。`driftTrajectory[]` 落**新 sibling JSONL/目录**(仿 `target-results/`)或新 `controller-events.jsonl` 事件型,避开封闭 schema。

**已有可复用**:**决策日志已存在** = `controller-events.jsonl`(append-only,`review.reduced`/`review.decided` 事件,`wakeflow-state.mjs:1274,1446`)→ M4 语料**扩它,别重造**。

## Non-Goals / 红线

- ❌ 校准概率"% 接近目标"(只趋势+阈值)。
- ❌ 廉价漂移信号自动杀线(贵眼裁定假崖)。
- ❌ 把结果排名塞回 Design(破隔离、自批改)。
- ❌ 执行窗口能看见/优化漂移指标(Goodhart)。
- ❌ 方向明确时也开分支(机器变重);❌ 目标不利时硬开(fail-closed 拒绝)。
- ❌ 重引 daemon/常驻轮询(沿用 at-return / tick-on-access)。
- ❌ 改既有 demand 状态机保留字段/对外语义、动既有 controller-return 评审语义(只**加** drift/referee/branch 维度,additive)。
- ❌ 把设计/计划文档写进 Wakeflow 能力仓。

## 决策记录(Confirmation Gate · 2026-06-26 已拍)

> **总范围决策**:**先建 A(M0 漂移)+ B(M1 裁判)**——自洽、可独立交付价值;**分支读棋(M2-M3)缓建**,待真实使用证明"顺序 bail-retry 太贵、确需并行预探"后再决。B 裁判对"顺序两次尝试"同样有效,缓建分支不落空。

- **PD-1(rubric 契约)✅ 锁**:rubric 是 **Design 阶段(a priori,执行前,随 Design handoff)** 输出的结构化产物 = `criteria[]`(每条:id / 描述 / **判定方式**(测试·grep·证据类型)/ 权重 / `hard|soft`)+ `priorities`(取舍优先序)+ `evidenceKinds`(每条认什么算证据)。M0 数命中、M1 打分共用一份。新增点:Design 在散文需求设计之外**多吐这份结构化 rubric**。
- **PD-2(Referee 形态)✅ 锁**:排序判断走 **fresh subagent**(独立上下文,防污染/自批改);**机械硬闸**(绿 / `hard` 项命中)inline。**worktree 留痕精化**:认输=停止投入 + **保留 worktree 待开发者回来查** + **有界 GC**(ack / 超期回收)。
- **PD-3(漂移信号 + 阈值)✅ 锁(核验后订正排序)**:阈值 **observe-only 起步**(只算+记轨迹不触发),真机轨迹标定后再开 trip。**核验订正**:3 信号就绪度不同→不"一次上 3 个",改 **M0-a `costNoProgress`(零新管线)→ M0-b `gateTrajectory`→ M0-c `scopeDrift`**(见「源码核验结果」)。其余 3 信号(rubric 覆盖 / 计划背离 / churn)待 rubric 与计划成熟再加。
- **PD-4(撞崖默认动作)✅ 锁**:默认 **暂停 + 上交总控判断**;不自动认输、不自动分支;标定+建立信任后再升级"高置信 trip 自动转分支"。
- **PD-5(scout 深度)⏸ 随分支缓建**:拟定 = spike + 预测步骤计划 + 烟雾信号,**不做局部实现**;待 M2 启动时生效。
- **PD-6(分支预算)⏸ 随分支缓建**:拟定 = width ≤ 3 scout、深推 1(+ top-2 接近时条件对冲 1)、单轮非 beam;待 M2 启动时生效。
- **PD-7(运行位置)✅ 锁**:**漂移 inline @ controller-return**(便宜、证据现成);**裁判走独立 subagent 上下文**。按"是否需要独立性"切分。
- **PD-8(value-net)✅ 锁**:本需求 **record-only**(攒 decision log + 漂移事件语料);训练管线 = **独立后续需求**。
- **PD-9(MCP 面)✅ 锁**:**最少新增**——漂移并入 `review_pack` 输出的 `drift` 块(不新增工具);裁判 = **一个**新工具 `wakeflow_referee`(或 `decide_review` 的一个 mode);分支用既有 dispatch/prepare_delivery 加 `branchId` 参数(随分支缓建)。
- **PD-10(M0 锚点精度)✅ 锁(核验已结)**:**M0 只用 controller-return**(hook 正确,已 grounded)。**核验结论**:envelope 是纯散文证据——`costNoProgress` 可从既有 `counts` 算(零新管线),`gateTrajectory` 需 target 多吐结构化 gate,`scopeDrift` 需 scope 声明 + 接入总控 review 时本就拉的 diff(带外)。详见「源码核验结果」。target 侧在途细信号仍 = 后续增强。

## 风险

- **假崖**:必要绕路(先重构再加 feature)被误报漂移 → 缓解:贵眼裁定、不自动杀(§0-4)。
- **Goodhart**:执行被指标污染 → 看/被看分离(§0-2/PD-7)。
- **成本爆炸**:分支×多窗口×深推 → fork-only + 分层 scout + 预算 cap(§0-5、T3、PD-6)。
- **目标不利退化**:无利 rubric 时强行评分=精选垃圾 → fail-closed 拒绝(§0-6)。
- **rollout 昂贵 ≠ 围棋**:照搬 MCTS 会烧死 → 分层而非全树(T3)。
- **与既有评审流耦合**:drift/referee additive 挂载,**不得**改既有 controller-return / decide_review 语义(Non-Goals)。
- **双宿主漂移**:能力须落 core/ 并 check:core 字节一致;否则 Codex/Claude 两版分叉。
- **grounding 债**:本稿多处 file:line「待核验」,实现前须一轮 Wakeflow 源码核验落实,严禁占位。

## 证据与链接

- **研究**:ReST-MCTS*(THUDM,NeurIPS 2024)、RPM-MCTS(arXiv 2511.19895)、Tree-Search & Reward 综述(arXiv 2510.09988)、Trajectory Guard(arXiv 2601.00516)、TrajAD(arXiv 2602.06443)、Asymmetric Goal Drift in Coding Agents(arXiv 2603.03456)、PG-TD/VerMCTS(综述内)。
- **业界**:Augment「9 Open-Source Agent Orchestrators」、claude-squad / vibe-kanban / conductor 等(隔离已量产、选择全人工)。
- **既有 Wakeflow 件(复用面)**:controller-return + host readback、`wakeflow_review_pack` / `reduce_results` / `decide_review`、`alembic_code_guard`/边界、worktree 隔离、dispatch group、Design handoff、cap/预算机理。〔具体 file:line 待源码核验〕
- **缘起**:本对话(2026-06-26,围棋"轻盈选择→实时胜率→大师循环"系列)。
