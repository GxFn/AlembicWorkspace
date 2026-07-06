# Wakeflow 并行开发 + 意图漂移 + 验收即产出 需求设计(strict · 修订稿)

> 状态:**修订稿待拍(PD-1..PD-6 未决)**。本需求 **取代并放弃**(SUPERSEDES / ABANDONS)前一份「围棋大师 master-loop」需求 `wakeflow-controller-master-loop-2026-06-26.md` 及其可读伴档 `wakeflow-controller-master-loop-readable-2026-06-26.md`。**尚未 intake、未进状态根、未派发。** 用户已主动大幅剪裁:本需求只保留三件事,不重引被放弃的 rubric 引擎 / 裁判 / MCTS 分支搜索 / value-net / 多信号漂移合成体。**本修订稿据对抗式复核进一步收窄并行机制(stream = 独立窗口,删除复合锁键)、补齐缺失场景(分支命名 / stream 间生产消费 / 池耗尽 / designIntent 缺省 / 漂移假阳性)、消除过度工程(C4 移出范围、LLM-judge 切出可弃 slice、sameTargetDescriptor 无需改),并把 PD-3 接地落定。**

---

## 触发与定位

### 触发
2026-06-26 关于「把总控做成围棋大师(读多分支 → 裁判打分 → 选最优)」的讨论收束:用户判定那套 read-variations / referee / value-net 超构过重,**主动收窄**为三件真正想要的能力。其中并行开发是**刚需**:用户的真实痛点是「Codex 那边能把一个任务并行化,Claude Code 这边连一个需求都并不了」。用户明确要**更少**,不接受任何范围扩张。

### 定位
- 仓库:**Wakeflow 能力仓**(可复用控制器运行时),`/Users/gaoxuefeng/Documents/CodexPlugin/Wakeflow/`。
- 单一真源 = `core/`(host-neutral),由 `tools/sync-core.mjs` 字节同步进两个 edition(`plugins/codex-wakeflow`、`plugins/claude-code-wakeflow`);`check:core` 以字节相等校验漂移(`tools/sync-core.mjs:63-82`、`:102-121`)。
- 运行时改动在 `core/` 写一次;操作者面向散文(skills / references / `AGENTS.md` vs `CLAUDE.md` / templates / commands)按 edition 写两次,host 词("codex"/"claude-code")只许出现在 host/skill 层(L3),不进 `core/`。

### 三件事(精确范围,只此三件)
1. **意图漂移检测(intent-drift,派发缝)**:Design 为每个任务给一句「大致怎么实现」;总控派发时写一句「我安排子窗口去做什么」;两句之间偏差当作弱信号。先廉价(本地词法相似度);**先 observe-only**,结果作为 **advisory** 进 review pack(总控决定),**不**做硬门。**低相似度本身不等于漂移**(见组件 A 假阳性处理);LLM-judge 是单独可弃 slice,不属本需求必达。
2. **总控对子窗口任务的验收 = 既有的、基于证据的验收,它就是产出检查(outcome check)**。**不**另起一套并行的产出引擎;明确写清:验收覆盖「产出对不对」(code+evidence vs goal),意图漂移只覆盖**上游(派发缝)**。
3. **并行开发(刚需):每条并行流 = 一个独立 Wakeflow 窗口 `<repo>__<streamId>`,绑定自己的 git worktree cwd**,支持在一个需求内同时跑多条**独立**开发流。**复用既有按 windowName 键的锁/绑定/启动/group fan-out —— 独立窗口名自动得独立锁,无复合锁键、无 streamId 穿线进锁推导。**

---

## 最终目标(完成定义)

> 一句话目标:让 Claude Code 侧的 Wakeflow 能**真正并行开发一个需求**,做法是把每条并行流建成一个独立窗口(`<repo>__<streamId>`)+ 独立 git worktree;并在派发缝廉价感知意图漂移、在既有验收处显式把「派发意图」摆到「交付结果」旁边,而**不**新增任何重机器或对外语义改动。

逐特性可证伪完成定义:

- **F1 意图漂移(observe-only)**:存在一个真实派发(`record-delivery-run status=sent`),其 `taskPackage.designIntent`(Design 一句,**可缺省**)与 controller objective(总控一句)被同时取到;**当 designIntent 缺省时 `intentDrift=null`(skip,不算空串相似度)**,否则算出本地词法相似度,结果以 `intentDrift={designIntent,controllerObjective,similarity,verdict}` 落到**开放 schema 的派发包字段**或状态根新 sibling JSONL,并在 review pack 中**对总控可见**;**不**改变任何 target-visible prompt、**不**进入 `controllerReviewReady`/`totalControlVerdictRequired`、**不**打印「距目标 X%」式假分数。可证伪:跑一次真实派发(designIntent 在场)→在 review pack 看到该任务的 drift 块且验收门未被它翻动;跑一次 designIntent 缺省的派发 → drift 块为 null/缺省、无空串相似度。
- **F2 验收即产出检查**:review pack 的每个 `targetResults[]` 条目**带上**该任务的 `objective`(派发意图,数据已在 packet 上),使总控在 `decide_review` 前能「派发意图 vs 交付结果」并排判读;`decide_review` 的四裁决(accept/rework/blocked/redesign)与门禁语义**零改动**。可证伪:review pack 输出里每个可评审任务条目含 `objective` 字段且与 `wakeflow-dispatch-commands.mjs:415` 的来源一致;`redesign` 仍是产出不匹配(非 bug)的既有路由。
- **F3 并行开发(stream = 独立窗口)**:在一个未归档需求内,同一 repo 可同时存在 ≥2 条 stream,**每条 stream 是一个独立注册的窗口 `<repo>__<streamId>`,绑定自己的 git worktree cwd、自己的 tmux `claude` 窗口、各在一条独立分支 `<demandKey>/<streamId>` 上**。因为锁/绑定/启动/group fan-out 全按 windowName 键,独立窗口名**自动**得独立窗口锁与独立 targetTaskId,无需任何复合键或 id 方案改造。可证伪:对同一 repo 起两条 stream 各派一个任务,两个 worktree 目录存在(各在不同分支)、两个窗口并行执行、两把窗口锁文件键不同(`slug(<repo>__streamA)` vs `slug(<repo>__streamB)`)、`state.targetTasks[]` 两条不互相覆盖(`${taskPackageId}__${slug(targetWindow)}` 因 targetWindow 不同而天然不同),且任一 stream 的结果回收只释放自己的锁(释放谓词按 deliveryId 匹配,已天然 stream-safe)。

---

## §0 跨块统一前提(固化 premises + red lines)

以下为本需求所有组件共享的硬前提,任何实现不得违反:

- **§0-1 单一真源 / 双 host**:运行时与 schema 改动只进 `core/`(写一次),经 `sync:core`/`check:core` 字节同步两 edition;操作者散文按 edition 写两次。host 词不进 `core/`(`tools/sync-core.mjs:42-61` 的 HOST_CONTRACT_FILES / HOST_LOCAL_CORE_FILES)。
- **§0-2 local-first / 无遥测 / MCP server 依赖洁净**:`core/mcp/server.cjs` 只依赖 `node:fs/path/url`(server.cjs:5-7),两 edition `package.json` 无 `dependencies`。本需求**不**给 MCP server 加 npm 依赖、**不**加网络调用、**不**上传任何指标。
- **§0-3 无 work-daemon**:沿用 tick-on-access / at-return 廉价节拍。漂移传感器**只挂在派发命令(at-dispatch)与 controller-return 链路上**,**不**起任何后台轮询。`wakeflow-keep-live.mjs` 的 `setInterval` 是受准许的 keep-alive(unattended 支持),**不是**先例,不得据此加调度器。
- **§0-4 additive-only(红线)**:只新增可选字段(开放 schema)/新 sibling 文件/新 MCP 工具或参数/新 `repositories[]` 窗口条目;**不得**改既有 demand 状态机保留字段或对外语义、**不得**动既有 controller-return 评审语义(reduce/decide/review)、**不得**改既有锁键/targetTaskId 方案。
- **§0-5 schema 选型纪律**:优先开放 schema —— `target-result.schema.json:24`、`task-package.schema.json:17`、`automation-dispatch.schema.json:31`(均 `additionalProperties:true`)、**`wakeflow-state.schema.json:55` 的 `targetTasks[]` items 是开放对象(`{type:object}`,无 `additionalProperties:false`)**、与**无 schema 校验的 review-pack 对象字面量**(`wakeflow-review-pack.mjs:57`)。**避免**碰封闭 schema:`wakeflow-state.schema.json:89`(root)及其 `review:66`/`automation:76`/`projection:86` 子对象、`transition-candidate.schema.json:26`、`controller-event.schema.json:33`、`projection.schema.json:26`(均 `additionalProperties:false`,加字段须显式改 schema + 双 edition 字节对齐)。
- **§0-6 意图漂移 observe-only / 无假分数 / 低相似 ≠ 漂移**:漂移是**诊断性 advisory**,绝不喂 `controllerReviewReady`/`totalControlVerdictRequired`,绝不机械翻动 demand 状态(违反操作者 stop-card「诊断元数据不得当成功/生产门」)。**Design 的「how」是「大致怎么做」(抽象),总控的「what」是具体安排,故低相似度是预期常态、非漂移**;信号仅在「how」足够具体时才有意义,未经 calibrate 前近乎无用,**只当弱提示、不当门**。漂移须保持**接地**(当前唯一基质是 free-text 两句话),**不得**退化成 LLM 体感分或假的「距目标 X%」;**designIntent 缺省时一律 skip(null),不得对空串算相似度产生垃圾分**。
- **§0-7 验收是产出检查**:`decide_review`(accept/rework/blocked/redesign)就是 code+evidence vs goal 的唯一裁决,`redesign` 专为「实现有效但非 bug 地没达标(产出不匹配)」而设。本需求**不**另起产出/裁判引擎;漂移结果只是**喂进**既有 pack 的一个面,不是新子系统。
- **§0-8 并行 = 独立窗口隔离而非读多分支**:F3 把每条 stream 实现为一个**独立窗口 + 独立 worktree + 独立分支**,**只为并行开发**(并排跑**独立**真实工作流),**不是**被放弃的 MCTS scout→prune→deep best-of-N 读多变体搜索。同一个「branch/stream」词下不得重新引入搜索语义。**有依赖关系的 stream(B 需 A 的 commit / 分支须合并回主线)不在本需求范围(见 Non-Goals)。**

---

## 组件设计

### 组件 A —— 意图漂移检测(派发缝,observe-only)

**已存在(复用,勿重建)**
- 总控意图句已有结构槽:`packet.objective = getValue("--objective", targetTask.summary || taskPackage.summary || \`Complete ${targetTaskId}.\`)`(`wakeflow-dispatch-commands.mjs:415`)。但今天**只自动兜底、从不被作者主动写**,且 MCP `wakeflow_prepare_delivery` 不转发 `--objective`(`wakeflow-mcp-tools.mjs:694-713`)。objective 已进 idempotency content hash(`wakeflow-idempotency.mjs:60`)。
- 单一缝点同时读到「任务包」与「objective」:`commandPrepareDispatchFromState`(`wakeflow-dispatch-commands.mjs:361`,读 state/包于 `:363,:378`)。
- 追加型 JSONL helper:`appendJsonLine`(`wakeflow-state.mjs:339`,`O_APPEND`)。
- 传输 prompt 是薄唤醒信封 `formatTargetPrompt`(`wakeflow-window-runtime.mjs:79-104`),**不含** objective;记录漂移**不改变** target-visible 行为(observe-only 正解)。

**新增(genuinely new)**
- **(a) Design 一句「how」字段(可选、可缺省)**:`taskPackage.designIntent`(任意命名,落开放 `task-package.schema.json:17`,零 schema 改动)。CLI `--design-intent` 加在 `wakeflow-state.mjs:673` 的 `--source-ref` 旁;MCP arg 加在 `wakeflow-mcp-tools.mjs:663` 区。Design-authored handoff 经 `claimItem`(`wakeflow-demand-sequence.mjs:419-460`)流入 `add-task-package`,沿用 `sourceRefsFor/developerDocRef`(`:205-211`)的 per-item 模式。**这是新增可选字段,绝大多数既有/历史任务包不会带它**;故组件须显式处理 ABSENT 情形(见 (c))。(注:`completionDefinition` 是 demand 级 `wakeflow-state.mjs:473`,非 per-task;per-task「how」确为新物,应落任务包。)
- **(b) 把总控 objective 打通为「可作者」**:`wakeflow_prepare_delivery` 转发一个 authored `--objective`(或别名 `--dispatch-intent`),覆盖 summary 兜底(`wakeflow-mcp-tools.mjs:700-712`)。**这是漂移有意义的前置**:不作者化时两句几乎退化为同一 summary,相似度无信号。
- **(c) 比较引擎(本需求体量大头,但只到词法基线)**:`commandPrepareDispatchFromState` 内算 `similarity(designIntent, objective)` —— **只做廉价本地词法相似度基线**(满足 §0-2 网络无关),core 现无相似度设施,这是真新代码。**缺省守卫(必达)**:若 `designIntent` 缺省 / 空,直接 `intentDrift=null`(skip),**不得**对空串算相似度。**低相似度本身不标 verdict 为「drift」**:verdict 永远是 `"observe"`,similarity 仅作弱数值提示,真假阳性由总控人读(§0-6)。
- **(c′) LLM-judge(单独 slice,明确可弃,非本需求必达)**:低相似时的 LLM-judge 是**唯一可能让被放弃的「裁判」野心回潮的地方**,故**切出为清晰独立的后续 slice**(opt-in、observe-only、默认关、仅交互会话)。P2 主交付**不含**它;它可被整体砍掉而不影响 F1 完成定义。详见 PD-6。
- **(d) 漂移记录**:`packet.intentDrift = {designIntent, controllerObjective, similarity, verdict:"observe"}` 落**开放派发包**(`wakeflow-dispatch-commands.mjs:147` 的 ad-hoc 字面量,无 schema 门);**和/或**经 `appendJsonLine` 写状态根新 sibling `intent-drift.jsonl`。**不得**复用 `controller-events.jsonl` 既有事件形(`controller-event.schema.json:33` 封闭、固定 required);新事件 TYPE 虽允许,但 prepare-dispatch 今天对状态根**只读、零事件追加**,走 controller-events 即新写行为 —— 故首选**开放包字段**或**新 sibling JSONL**。

**输入**:`taskPackage.designIntent`(可缺省)、authored controller `objective`。
**输出**:`packet.intentDrift`(或 null)+ 可选 `intent-drift.jsonl` 行 + review pack 中 advisory 块(见组件 B)。
**状态根扩展**:可选新 sibling `intent-drift.jsonl`(append-only,不碰封闭 state schema)。
**MCP 面**:`wakeflow_prepare_delivery` 加转发 `--objective`/`--dispatch-intent`;`wakeflow_add_task`(add-task-package)加 `designIntent` arg。均 additive。
**skills**:`wakeflow-controller`/`wakeflow-target`/`wakeflow-governance` 散文按 edition 各加一小节(写两次,host 词只在 L3)。

### 组件 B —— 验收即产出检查 + 漂移 advisory 落点

**已存在(复用,勿重建)**
- 四裁决硬白名单 `commandDecideReview`:`accept/rework/blocked/redesign`(`wakeflow-state.mjs:1314`,非成员 fail `:1315`);candidate 同集广告(`:1188`);`reworkLike=rework||redesign`(`:1343`),`redesign` 入 needs-rework 但路由 Design 不再派(`:1365-1369`);事件 `review.reduced`(`:1237-1265`)与唯一 `review.decided`(`:1422-1448`)。
- per-task review pack:`buildStateRootReviewPack` 把 `reviewableTargetTasks` 1:1 映到 `targetResults[]`(`wakeflow-review-commands.mjs:388-422`),每条带 `evidenceRefs/evidenceRefSummaries/missingEvidenceRefs/verificationSummary/riskSummary/resultStatus/hasControllerReviewEvidence`;`rawEvidenceRequired`(`:524-534`);门禁对象 `controllerReviewReady/missingEvidenceRefsPresent/blockedResultsPresent/rawEvidencePullRequired/totalControlVerdictRequired`(`:536-551`);pack **明确非验收**(`forbiddenConclusions: review-pack-is-controller-acceptance`)。
- 无 schema 校验的 pack 字面量:`wakeflow-review-pack.mjs:57-76`(delivery/group pack)与 `wakeflow-review-commands.mjs:501-587`(state-root acceptance pack)。

**新增(小、additive)**
- **(B1) 把派发意图摆到结果旁(F2 核心,闭合「验收即产出检查」唯一缺口)**:在每个 `targetResults[]` 条目(`wakeflow-review-commands.mjs:400`)、`rawEvidenceRequired[]`(`:524`)、以及 delivery-pack 条目构造器(`:87-105`)线程上 per-task `objective`(数据已在 packet/state,纯 additive)。可选并带 demand `completionDefinition`。**这同时是组件 A 漂移结果的天然载体槽。**
- **(B2) 漂移 advisory(observe-only,§0-6)**:在 `gates` 对象旁加 `intentDriftPresent`/`intentDriftAdvisory:true`(`wakeflow-review-pack.mjs:29-41` / `wakeflow-review-commands.mjs:536-551`),**绝不**喂 `controllerReviewReady`/`totalControlVerdictRequired`;在 `targetResults[]` 条目或顶层 `intentDrift[]`(`wakeflow-review-pack.mjs:57`/`:69-71`,紧挨 `rawEvidenceRequired`/`missingEvidenceRefs`)附 per-task 漂移详情(designIntent 缺省者此处为 null);可选把 `nextAction` 措辞偏向「pull-raw-evidence-and-weigh-drift」而**不**阻断。

**输入**:既有 review 证据 + 组件 A 的 `intentDrift`(或 null) + packet `objective`。
**输出**:review pack 中 per-task `objective` + `intentDrift[]` + `gates.intentDriftAdvisory`。
**状态根扩展**:无(pack 是字面量输出)。
**MCP 面**:`wakeflow_review_pack` 输出 additive 扩展,无新工具;`decide_review` 白名单与门禁**零改**。
**两 builder 必须同步**:delivery/group pack(`wakeflow-review-pack.mjs`)与 state-root acceptance pack(`wakeflow-review-commands.mjs`)都要加,只加一边会留盲点(验收读 state-root 变体)。
**skills**:`wakeflow-controller` 散文说明「漂移是 advisory、验收仍是唯一裁决」。

### 组件 C —— 并行开发(stream = 独立窗口 + worktree + 池,F3,刚需、最重)

**已存在(复用,勿重建)—— 且这正是「无需复合键」的根因**
- **窗口锁按 `slug(windowName)`**:`lockFileFor`(`wakeflow-delivery-store.mjs:152-153`),契约「one in-flight delivery per window」(`:171-184`)。锁获取点:`writeWindowLock(envelope.targetWindow,...)`(`wakeflow-dispatch-commands.mjs:294-296` build-delivery、`:475-477` prepare-from-state);fail-closed 读 `readWindowLock(packet.targetWindow)`(`wakeflow-dispatch-commands.mjs:215-218`)。**全部键于裸 windowName** —— 独立窗口名 → 独立锁文件,**自动成立**。
- **锁释放按 deliveryId,已天然 stream-safe**:`wakeflow-state.mjs:1024-1031` 释放谓词 `(lock) => !lock.deliveryId || lock.deliveryId === taskDeliveryId`,匹配 deliveryId 而非窗口构造 —— **跨 stream 不会误释**,无需改。
- **targetTaskId 已按 windowName 区分**:`${taskPackageId}__${slug(targetWindow)}`(`wakeflow-state.mjs:675`)。独立窗口名 → 不同 targetTaskId,**state.targetTasks[] 自动不互相覆盖**,无需新 id 方案。
- **dispatch group 已并发 fan-out 到不同窗口**:`expectedTargets[]` push 不同 descriptor(`wakeflow-delivery.mjs:354-361`);`sameTargetDescriptor` 键于 `targetWindow && taskId`(`wakeflow-delivery.mjs:306-308`)—— stream 即独立窗口后,两 target 的 descriptor **天然可区分,无需任何改动**;group review 有 `partially-ready`(`wakeflow-dispatch-group-review.mjs:82-131`);return policy `group-ready`/`per-target`(`wakeflow-controller SKILL.md:202-208`)。
- **窗口名 → cwd 已由 config 驱动**:`readRepositoryForWindow(windowName)` 在 `workspace.config.json` `repositories[]` 里按 windowName 查 `path` 得 cwd(`wakeflow-claude-host.mjs:1165-1180`);`normalizedRepositories` 接受任意 `{windowName,path}` 条目(`wakeflow-setup.mjs:254-263`)。**注册一个 `<repo>__<streamId>` 窗口、其 `path` 指 worktree 目录,就自动得独立 cwd**,复用既有 `launch-window`/`replace-all`(`wakeflow-claude-host.mjs:565-631`,`-c <cwd>` 启动)。
- tmux 传输真并行:每窗口独立 `claude` 进程于一个专用 tmux server session(`wakeflow-claude-host.mjs:141-152`);activity monitor 纯可视化、从不串行化(`:452-548`)。**传输层不是瓶颈。**

**今天的真实阻塞(测绘结论 —— 缩小到只有三件)**
- **零 git worktree 支持**:全仓仅 Codex 「do not create a worktree」策略串(`wakeflow-host-profile.mjs:122`)+ README 散文,无 worktree 工具。这是唯一真正缺的运行时能力。
- **无「池化 stream 窗口」注册**:`workspace.config.json` 每 repo 一条 `{windowName,path}`(`wakeflow-setup.mjs:255-261`),无「一 repo N 条 stream-window」的登记位与 `maxStreams` 上界。
- **无 worktree GC**:`prune-runtime` 只覆盖传输文件,**不覆盖 worktree**。

> **关键澄清(对抗式复核纠正)**:此前草稿误以为需要复合锁键 `slug(windowName)__slug(streamId)` 并把 streamId 穿线进锁推导。**这是错的,会把同 repo 多 stream 串行化** —— 因为真正的 per-window 锁键于**裸 windowName**(上列获取点 `:294-296`/`:475-477`、读 `:215-218`、`lockFileFor:152`),草稿遗漏了这些获取点。正解:**每条 stream 用一个独立 windowName `<repo>__<streamId>`** —— 锁、cwd 绑定、launch-window、group fan-out 全部按 windowName 键,独立窗口名**自动**获得独立锁与独立 targetTaskId。**删除全部复合键机器、删除 streamId 穿线进锁推导、不改 `sameTargetDescriptor`、不改 targetTaskId 方案。**

**新增(最小集,解锁真并行;次序见分阶段)**
- **(C1) git worktree per stream + 独立分支**:新 host-helper 能力 `git worktree add <workspaceRoot>/.wakeflow-local/worktrees/<repo>__<streamId> -b <demandKey>/<streamId> <base-branch>`。**每条 stream 的 worktree 必须 check out 一条独立分支 `<demandKey>/<streamId>`** —— `git worktree add` 拒绝在两个 worktree 检出同一分支,故分支命名是硬约束、不是风险注记。teardown:`git worktree remove`(+ 可选删分支),今天无此 GC,须新增。
- **(C2) 注册池化 stream 窗口 + `maxStreams` 上界**:为每条 stream 在窗口注册处登记一个 `{windowName:<repo>__<streamId>, path:<worktree-dir>}` 条目(`workspace.config.json` `repositories[]`,或运行时窗口注册表 —— 落点见 PD-2),使 `readRepositoryForWindow` 解析到 worktree cwd;复用既有 `launch-window`/`replace-all` 起一个 tmux `claude` 窗口。`repositories[]`(或 stream pool 配置)声明 per-repo `maxStreams`。**窗口池 = 每 (repo,stream) 一个已注册窗口 + 一个 worktree + 一个 tmux 进程。**
- **(C3) 池耗尽行为(必达,守 unattended 安全)**:当某 repo 在飞 stream 数已达 `maxStreams`,**新 stream 请求一律 block/排队,绝不无界开窗**。无人值守模式下:不 spawn 第 N+1 个窗口,回一个明确「pool exhausted,等某 stream 回收后再起」的信号(沿用既有锁/就绪信号风格),由总控择机重试或顺序化。这是 fleet 资源与无人值守红线的硬兜底。

> **C1-C3 之间无复合锁键依赖**:C1 产 worktree+分支,C2 注册窗口并起进程(独立 windowName 自动得独立锁/独立 targetTaskId),C3 是池上界与耗尽兜底。三者均**不**改 `wakeflow-delivery-store.mjs` 锁键、`wakeflow-state.mjs:675` id 方案、`sameTargetDescriptor`。

**输入**:per-repo `maxStreams`;创建 stream 请求(repo + streamId + base-branch)。
**输出**:per-stream worktree 目录(各在独立分支 `<demandKey>/<streamId>`)+ 注册的 stream-window + tmux 进程 + 含独立 windowName 的 targetTask(targetTaskId 天然不撞)。
**状态根扩展**:**无 schema 改动**。targetTask 若需带 `streamId` 标记,落 `wakeflow-state.schema.json:55` 的 `targetTasks[]` items —— 该项是开放对象(`{type:object}`,无 `additionalProperties:false`),**加 `streamId` 无需任何 schema 编辑**(PD-3 已接地解决,见下)。
**MCP 面**:host-helper 新增 worktree 建/拆/launch 路径(non-MCP host 能力);stream-window 注册(config 或运行时注册表);`workspace.config.json` 加 per-repo `maxStreams`。均 additive。
**skills**:`wakeflow-governance`/`wakeflow-controller` 散文新增 stream/worktree 调度、分支命名与池耗尽 UX(写两次)。

---

## 分阶段

并行开发(F3)是刚需且最重,作为优先级与主体;意图漂移与验收承载件小、低风险,可在 F3 主体之外并/后行。**因 stream=独立窗口的重设计,F3 的真新代码大幅收缩为「worktree 建/拆 + stream-window 注册 + maxStreams 池」三件 —— 不再含任何锁键/id 方案改造。**

- **P1 —— F3 同 repo 并行(主交付,~SMALL-MEDIUM,priority)**
  内容:C1(worktree per stream + 独立分支 `<demandKey>/<streamId>`)→ C2(注册池化 stream 窗口 + launch)→ C3(`maxStreams` 上界 + 池耗尽 block/排队)。
  完成定义:同一未归档 demand、同一 repo 起两条 stream,两 worktree(各在独立分支)+ 两已注册 stream-window + 两 tmux 进程,两窗口锁文件键天然不同、两 targetTaskId 天然不撞、两 targetTask 不互覆盖,各自结果回收只释放自己的锁(deliveryId 谓词,既有);达到 `maxStreams` 时第三条 stream 被 block/排队、无新窗口。
  producer/consumer:C1 产 worktree+分支,C2 消费它注册窗口并起进程,C3 约束并发上界。
  真机验收:在一个真实 repo(如沙箱 clone)起两条 stream 各派一任务,观察两 worktree 目录(各在 `<demandKey>/<streamA|B>` 分支)、两 tmux 窗口并行、`state.targetTasks[]` 两条、锁文件两个不同键、teardown 清掉 worktree;再起第三条触 `maxStreams` 见 block/排队。
  依赖:无(不触 demand 状态机、不触锁键/id 方案)。**满足用户「并行化一个需求」的逐字诉求。**

- **P2 —— F1+F2 意图漂移 seam + 验收并排(~1 wave seams,low-risk)**
  内容:组件 A(a)(b)(d) seam/flag/observe-only 记录 + 缺省守卫(c 词法基线)+ 组件 B(B1)(B2)。**只落词法相似度基线;LLM-judge(c′)是单独可弃 slice,不在 P2。**
  完成定义:F1、F2 的可证伪完成定义达成(见上),漂移 advisory 不翻动门禁,designIntent 缺省时 skip 为 null。
  producer/consumer:组件 A 产出 `intentDrift`(或 null)+ authored objective,组件 B 消费并并排呈现。
  真机验收:真实派发一次(designIntent 在场)→review pack 见 per-task `objective` + drift 块,门禁未被 drift 改动;authored objective 与 designIntent 不同则相似度有信号;再派一次 designIntent 缺省 → drift 为 null、无空串相似度。
  依赖:可与 P1 并行(不同文件域);若先于 P1 亦可独立交付。

---

## Non-Goals / 红线

本需求**明确放弃**前一份 master-loop 文档(`wakeflow-controller-master-loop-2026-06-26.md` 及可读伴档 `...-readable-2026-06-26.md`)的下列超构,并**作废/重开**其曾标「已拍/锁」的相关 PD,任何评审不得引这些「locked」决定为仍约束:

- ❌ **rubric-evaluation 引擎**(原 T2 hard-gate→rank→tiebreak;`criteria[]/priorities/evidenceKinds` 作运行时打分引擎)—— 放弃。
- ❌ **evidence-grounded referee / 第二只眼**(原组件 B / M1 keystone / `wakeflow_referee` 工具或 referee 窗口 profile / fresh-subagent 排名)—— 放弃,验收即替代。
- ❌ **MCTS / scout-tier / branch-search**(原组件 C+D / T3:scout 浅推→prune→beam→deep winner→discard losers,read best-of-N variations)—— 放弃**搜索语义**;worktree/stream 隔离**仅**为并行开发(§0-8)。
- ❌ **value-net / policy corpus**(原组件 E / M4 / T4:decision-log 当训练语料 → 廉价 value-net;PD-8 record-then-train)—— 放弃。
- ❌ **多信号漂移合成体**(原 6 信号向量:rubricCoverageΔ/gateTrajectory/scopeDrift/planDivergence/churn/costNoProgress 及 green/watch/trip 三态阈值引擎、M0-a/b/c rollout)—— 放弃合成/轨迹/阈值机器,**只**保留单一「派发意图 vs 实现」偏差。
- ❌ **PD-1 rubric 契约作近期产物**(Design 在散文外发结构化 `criteria[]/priorities/evidenceKinds`)—— 放弃为近期交付。

本需求自身的范围红线(显式收窄,守「更少」):

- ❌ **复合锁键 `slug(windowName)__slug(streamId)` / streamId 穿线进锁推导**(草稿原 C1)—— **删除**。stream=独立窗口后裸 windowName 锁自动隔离,改锁键反而是错的、会串行化。
- ❌ **新 targetTaskId 方案 / 改 `sameTargetDescriptor`**(草稿原 C3)—— **删除**。`${taskPackageId}__${slug(targetWindow)}` 因 windowName 不同已天然不撞;`sameTargetDescriptor` 键于 targetWindow+taskId 已天然可区分。
- ❌ **有界放松「单活跃 demand」(原 C4)** —— **移出本需求范围**。用户逐字诉求是「并行化**一个**需求」,P1 的同 repo 多 stream 已满足;放松单活跃 demand 是爆炸半径最大、风险最高的改动(acceptance/archive/`index.md`/next-work/TODO-rollup 全假定单一 current demand:`wakeflow-active-demands.mjs:46-50`、`wakeflow-next-work.mjs:267-270`、`wakeflow-demand-sequence.mjs:96-102`)。**作为单独的未来需求**,不在本轮交付,不进本需求分阶段。
- ❌ **stream 间生产消费 / 分支合并回主线** —— **不在本需求范围**。本需求只并行**独立**stream(无依赖);有依赖的 stream(B 需 A 的 commit、或分支须 merge/integrate 回 main)显式排除;若用户确需 stream 依赖门,作为 PD/独立需求另定(见 PD-7)。不得默认「一个 demand 内同 repo 的所有任务都互相独立」。
- ❌ **LLM-judge 作 P2 必达**(组件 A c′)—— 切出为可弃后续 slice,不属本需求完成定义;它是「裁判」野心唯一可能回潮处,默认整体可砍。

其它红线(与 §0 同源,重申):

- ❌ 重引 daemon/常驻轮询作为 work 调度;keep-live 不得当先例。
- ❌ 给 MCP server 加 npm 依赖 / 网络调用 / 遥测。
- ❌ 改既有 demand 状态机保留字段、`decide_review` 白名单、controller-return 评审语义、既有锁键 / targetTaskId 方案。
- ❌ 让 intent-drift 喂 `controllerReviewReady`/`totalControlVerdictRequired` 或机械翻动 demand 状态;❌ 打印「距目标 X%」假分数 / LLM 体感分;❌ 把低相似度直接当漂移;❌ 对缺省 designIntent 算空串相似度。
- ❌ 把 worktree/branch 隔离重新解读为 read-multiple-variations 搜索。
- ❌ 无人值守下达到 `maxStreams` 仍无界开窗。

---

## 待决 Confirmation Gate

- **PD-1 并行范围 = 任务 vs 需求 vs 两者**:F3 的「并行开发」最小必达是「一个需求内同 repo 多 stream」(P1);并行**需求**(放松单活跃 demand)已**移出本需求范围**(见 Non-Goals),是否作为独立未来需求另立?用户痛点逐字是「并不了一个需求」,本设计取 P1 必达、放松单活跃 demand 不在本轮。**待用户拍是否同意此收窄。**
- **PD-2 stream-window 注册落点 = `workspace.config.json` `repositories[]` vs 运行时窗口注册表**:per-stream 窗口 `{windowName:<repo>__<streamId>, path:<worktree-dir>}` 登记进 `workspace.config.json`(持久、与 repo 同表,但污染 config),还是运行时窗口注册表(短生命、随 stream 建/拆,不进 tracked config)?建议运行时注册表(stream 是临时的),`readRepositoryForWindow` 须能从该注册表解析 cwd。**待拍。**
- **PD-3(已接地解决,留作记录)streamId 落点不触封闭 schema**:targetTask 若带 `streamId`,落 `wakeflow-state.schema.json:55` 的 `targetTasks[]` items —— 该项为开放对象(`{type:object}`,无 `additionalProperties:false`,已核),**无需任何 schema 编辑**。此前草稿「待核验」已消解;原「streamId 是否触封闭 state schema」的 schema-risk PD 移除。
- **PD-4 worktree teardown 时机**:stream 结果回收后立即 `git worktree remove`,还是 demand 归档时统一 GC,还是显式命令?建议结果回收 + 显式兜底(防 stale 堆积,今天无 worktree GC)。需定 teardown 触发点与失败处置(worktree 含未提交改动时拒删?)。**待拍。**
- **PD-5 drift 门 vs advisory**:本设计**建议永远 advisory**(observe-only,§0-6/§0-7);是否在足够 calibrate 后允许 drift 像 `blocked` 那样**让总控选** `redesign`(人选、非机械)?默认**只 advisory**,gate 化**待拍**(不确定故标 PD)。
- **PD-6 LLM-judge 形态(可弃 slice)**:低相似时的 LLM-judge 是否纳入(作可弃后续 slice)、如何 opt-in、是否仅在交互会话(非无人值守自动调)?默认**不纳入 P2 / observe-only + opt-in + 默认关 + 仅交互**;是否要这条 slice **待拍**(默认可整体不做)。
- **PD-7 stream 间依赖(范围外,留作记录)**:若用户确需「B stream 依赖 A 的 commit」或「stream 分支合并回 main」的依赖门,本需求**不**实现;需作为单独需求另定(定义 dependency-gate / merge 流程)。**待用户决定是否另立需求**;本需求只并行独立 stream。

> 在 PD 拍定前,本需求保持**修订稿待拍**,无派发目标、无可执行 prompt。

---

## 风险

- **worktree 共享 .git refs / 同分支拒检出**:`git worktree add` 拒绝在两个 worktree 检出同一分支,故**每条 stream 必须用独立分支 `<demandKey>/<streamId>`**(已落 C1 具体方案,非仅风险);teardown 必须显式(`git worktree remove`),否则 stale worktree 堆积(今天无 worktree GC)。
- **池规模 vs 真实资源**:每 stream = 一个完整 `claude` 进程 + 工作树 + 模型花费;须 `maxStreams` cap 与「池耗尽 block/排队」UX(已落 C3),否则无人值守可能无界开窗。tmux 就绪但 monitor 轮询/状态栏成本随窗口数线性(`wakeflow-claude-host.mjs:479-541`),大 fleet 下需核验。
- **stream-window 注册一致性**:`readRepositoryForWindow` 须能解析 stream-window 的 cwd(PD-2 落点);若注册落点与 launch/查找路径不一致,窗口起不来或起到错 cwd。
- **objective 作者化是漂移前置**:objective 今天仅从 summary 兜底(`wakeflow-dispatch-commands.mjs:415`),不 authored 则相似度近退化、漂移分无意义;且 objective 进 idempotency hash(`wakeflow-idempotency.mjs:60`)—— 同 state revision 重 prepare 不同 authored objective 会触「different content for same revision」守卫(`wakeflow-dispatch-commands.mjs:443-445`),漂移捕获须首 prepare 计算或把 objective 变更当新 revision。
- **漂移信号弱、易假阳**:Design「how」抽象 vs 总控「what」具体,低相似度是常态;未 calibrate 前近乎无用,只当弱提示(§0-6);designIntent 缺省须 skip 为 null,不得算空串相似度。
- **observe 输出需消费者**:新 sibling JSONL 需自带 reader(`render-progress` 今读 `controller-events.jsonl`,`wakeflow-render-progress.mjs:270`);否则 F1 端到端不可见。
- **双 edition 双写**:运行时/ schema 改一次同步;操作者散文(skills/references/AGENTS.md vs CLAUDE.md/templates/commands)**不被 sync-core 同步**,须写两次保持一致,host 词只在 L3。
- **比较引擎依赖洁净**:core 无相似度设施;引入须**只到廉价本地/词法基线**(守 §0-2),LLM-judge 若做须 opt-in/observe-only/默认关保 additive,**不得**给 MCP server 引网络/模型依赖。

---

## 证据与链接

**接地 file:line(全部来自本轮测绘 + 对抗式复核重验,绝对路径以 `/Users/gaoxuefeng/Documents/CodexPlugin/Wakeflow/` 为根)**

并发/并行(组件 C —— stream=独立窗口的根因证据):
- `core/schemas/wakeflow-state-machine/wakeflow-state.schema.json:55`(`targetTasks[]` items = 开放对象 `{type:object}`,无 `additionalProperties:false` → streamId 无需改 schema,**已重验**),`:89`/`:66`/`:76`/`:86`(封闭 root+review+automation+projection,避碰)
- `core/scripts/wakeflow-state.mjs:675`(targetTaskId=`${taskPackageId}__${slug(targetWindow)}`,独立窗口名天然不撞,**已重验**),`:1024-1031`(锁释放按 deliveryId 谓词,天然 stream-safe,**已重验**),`:339`(appendJsonLine),`:673`(--source-ref 旁加 flag)
- `core/scripts/lib/wakeflow-dispatch-commands.mjs:294-296`/`:475-477`(`writeWindowLock(targetWindow,...)` 锁获取点,键于裸 windowName,**已重验**),`:215-218`(`readWindowLock(packet.targetWindow)` fail-closed 读,**已重验**),`:361`(prepare-from-state),`:415`(objective 兜底),`:443-445`(idempotency 守卫),`:147`(开放 packet 字面量)
- `core/scripts/lib/wakeflow-delivery-store.mjs:152-153`(`lockFileFor = slug(windowName)`,**已重验**),`:171-184`(one-in-flight-per-window 契约)
- `core/scripts/wakeflow-delivery.mjs:306-308`(`sameTargetDescriptor` 键于 targetWindow+taskId,stream=窗口后天然可区分、无需改,**已重验**),`:354-361`(group fan-out / expectedTargets push)
- `core/scripts/lib/wakeflow-dispatch-group-review.mjs:82-131`(group review / partially-ready)
- `plugins/claude-code-wakeflow/scripts/lib/wakeflow-claude-host.mjs:1165-1180`(`readRepositoryForWindow`:windowName→config repo.path→cwd,**已重验** —— 注册 stream-window 即得独立 cwd),`:141-152`(tmux server),`:452-548`(monitor 纯可视),`:565-631`(launch-window/replace-all,`-c <cwd>`)
- `core/scripts/wakeflow-setup.mjs:254-263`(`normalizedRepositories` 接受任意 `{windowName,path}` 条目,**已重验**)
- `core/scripts/lib/wakeflow-host-profile.mjs:122`(Codex「do not create a worktree」策略串,全仓唯一 worktree 提及)
- `plugins/claude-code-wakeflow/skills/wakeflow-controller/SKILL.md:202-208`(return policy)
- 范围外(放松单活跃 demand,**移出本需求**):`core/scripts/lib/wakeflow-active-demands.mjs:46-50`、`core/scripts/wakeflow-next-work.mjs:267-270`、`core/scripts/wakeflow-demand-sequence.mjs:92-103`(单活跃硬门,本需求不动)

意图漂移(组件 A):
- `core/scripts/lib/wakeflow-dispatch-commands.mjs:415`(packet.objective 兜底,已核),`:147`(开放 packet 字面量),`:443-445`(idempotency 守卫)
- `core/scripts/lib/wakeflow-window-runtime.mjs:79-104`(formatTargetPrompt 薄信封,已核不含 objective)
- `core/scripts/wakeflow-state.mjs:339-344`(appendJsonLine),`:673`(--source-ref 旁加 flag,已核),`:473`(completionDefinition 是 demand 级非 per-task)
- `core/scripts/wakeflow-demand-sequence.mjs:205-211,:419-460`(per-item Design 字段模式 / claimItem)
- `core/lib/wakeflow-mcp-tools.mjs:663,:694-713,:700-712`(MCP add-task / prepare-delivery,无 --objective 转发)
- `core/scripts/lib/wakeflow-idempotency.mjs:60`(objective 进 content hash)
- `core/schemas/wakeflow-state-machine/task-package.schema.json:17`(开放,designIntent 落此),`automation-dispatch.schema.json:31`(开放),`controller-event.schema.json:33`(封闭、固定 required,不复用其事件形)

验收即产出(组件 B):
- `core/scripts/wakeflow-state.mjs:1314`(allowedDecisions),`:1333-1337`(accept-blocked 守卫),`:1342-1345`(reworkLike/next-state),`:1363-1377`(per-task 记录),`:1384-1403`(allowedActions/blocker),`:1188`(candidate allowedDecisions),`:1237-1265`(review.reduced),`:1422-1448`(review.decided),`:451/:473`(demand goal/completionDefinition)
- `core/scripts/lib/wakeflow-review-commands.mjs:388-422`(targetResults 1:1),`:400`(条目构造),`:87-105`(delivery-pack 条目),`:524-534`(rawEvidenceRequired),`:501-587`(state-root pack 字面量),`:536-551`(gates),`:572-577`(nextAction/forbidden)
- `core/scripts/lib/wakeflow-review-pack.mjs:17-28,:29-41,:57-76,:69-71`(delivery/group pack 门禁与字面量,已核 `:57` 起对象字面量无 schema 校验)
- `core/scripts/wakeflow-render-progress.mjs:270`(controller-events.jsonl reader,observe 输出消费者参照)

约束(keep/abandon):
- `tools/sync-core.mjs:29-40(TARGETS),:42-61(HOST_CONTRACT/HOST_LOCAL),:63-82(byte-equal),:102-121(copy/--check)`;`package.json`(sync:core/check:core/test chain,engines node>=20)
- `core/mcp/server.cjs:5-7`(只 node: 内建,依赖洁净)
- `README.md:51`(local-first)
- `core/scripts/lib/wakeflow-keep-live.mjs`(setInterval = 受准许 keep-alive,非 work-daemon 先例)

**被取代/放弃文档(命名供 supersede 指针)**
- `Design/docs/current/wakeflow-controller-master-loop-2026-06-26.md`(strict 版,本需求取代其 rubric 引擎/referee/MCTS/value-net/多信号漂移合成 + 重开其 PD-1/PD-2/PD-3/PD-8)
- `Design/docs/current/wakeflow-controller-master-loop-readable-2026-06-26.md`(可读伴档,标「施工以 strict 版为准」即非权威,亦须随 strict 版一并视为放弃)

**本设计 provenance**
- 来源:2026-06-26「围棋大师 master-loop」讨论的收束转向(pivot)—— 用户主动剪裁,从「读多分支→裁判→选最优」收窄为「意图漂移(派发缝)+ 验收即产出 + 并行开发(刚需)」三件事。
- 修订:2026-06-26 对抗式复核 —— 并行机制重设计为 stream=独立窗口(删复合锁键 / streamId 穿线 / 新 id 方案 / sameTargetDescriptor 改动);补齐分支命名、stream 间依赖(范围外)、池耗尽、designIntent 缺省、漂移假阳性;C4 放松单活跃 demand 移出范围;LLM-judge 切为可弃 slice;PD-3 接地落定(无 schema 改动)。
- 状态:Design 出稿,**未 deliver、未 intake、未派发**;待 PD-1..PD-6 拍定后交控制器 intake。
- 已接地、无遗留待核验项:此前「targetTask 子结构封闭 schema 约束」之「待核验」已由 `wakeflow-state.schema.json:55`(开放对象)消解。
