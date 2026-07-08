# 需求设计 — Alembic 激活链主动化(安装引导 + 冷启动建议 + 四工具消费)

- Design Key: `alembic-proactive-activation-2026-07-03`
- 日期: 2026-07-03
- 状态: **CG-1~8 全批(2026-07-03「全部按推荐」+ CG-8 补冷启动自动同步)**;未 deliver / 未 intake
- 原始方案: [alembic-proactive-activation-original-plan-2026-07-03.md](alembic-proactive-activation-original-plan-2026-07-03.md)
- 涉及仓: AlembicPlugin(主力:工具措辞/skill 导出/guidance/onboarding/StatusService/测量)+ **AlembicCore**(WS-5 托管块 util + PathGuard 根文件放行)+ Alembic 主体(WS-5 pathGuard configure 扩展;WS-3 不碰 SetupService)。详见 §10.0 范围更新
- 证据: 4 路诊断 Explore + 5 路 code-level Explore(§10 实现指导)+ 控制器亲验锚点(PathGuard 白名单/tools.ts:161·171·214·227/_trackSession:386)+ 联网研究外部 skill 写作规范(§11 Obsidian/Agent Skills spec)

## 1. 用户目标

四工具 `alembic_prime` / `alembic_search` / `alembic_recipe_map` / `alembic_graph`(host agent 消费知识的唯一出口)被观察到"不够积极使用"。要把从**安装 → 冷启动 → 四工具消费**整条前端激活链做主动:安装引导更积极、安装后冷启动建议更积极、四工具被更积极触发。核心洞察:这四工具是整条 Recipe 流水线的消费端,消费不活跃 = 前面生成/进化/维护全部 ROI 悬空。

## 2. 诊断:激活链七处漏点(全部 file:line 亲验)

激活链应为:`安装 setup → 冷启动 coldstart → KB 填充 → per-project skill 生成+挂载 → 宿主加载 .agents/skills → LLM 见主动措辞 → 调 prime → prime 导向 search/recipe_map/graph → 消费活跃`。逐环证据:

| # | 漏点 | 证据(file:line) | 严重度 |
| --- | --- | --- | --- |
| L1 | **测量缺 per-tool 明细**(§10.0 订正):已有会话级外露(`McpServer._trackSession:386` 记 toolCallCount+toolsUsed 去重 Set,`system.ts:120` 已外露 session 块),但缺"每工具次数 byTool + 最近调用时间";原以为的四计数器实为 prime/work/finish/guard 的 refId 线,与 search/recipe_map/graph 无关 | AlembicPlugin `McpServer.ts:386`、`system.ts:120`(亲验) | 载重(无法度量改进) |
| L2 | **cc 宿主可能不加载 per-project skill**:导出根硬编码 `.agents/skills`(codex 约定),变量名 codexSkillRoot,**无按宿主分叉**;Claude Code 技能发现走 `.claude/skills`+插件目录,非 `.agents/skills` | `ProjectSkillDelivery.ts:16` `PROJECT_SKILL_ROOT=path.join('.agents','skills')`、`:52/:74/:163` codexSkillRoot、`:223` addProjectWritePrefix('.agents') | **头号 P0**(消费主动机制对 cc 可能死信) |
| L3 | **install→coldstart 手动易跳过**:setup 是手动命令,只在 CLI 打印"下一步 coldstart";不跑冷启动→KB 空→ProjectSkillService 删除四知识技能→零主动信号 | Alembic `SetupService.ts:261-264`(CLI 打印);AlembicPlugin `ProjectSkillService.ts:327`(!hasKnowledgeBase 删技能) | 高 |
| L4 | **prime 非自动 + 缺席执行协议**:prime 是唯一主动措辞工具但无 session-start 触发;在 onboarding defaultOrder 里、却在 stagedProtocol(真正的执行步骤)完全缺席 | `agent-public-tools.ts:232`(handler 无 autoInvoke);`OnboardingContract.ts:122-132`(defaultOrder 有 prime)vs `:363-368`(stagedProtocol 无 prime) | 高 |
| L5 | **三工具措辞被动**:search/recipe_map/graph 的 MCP description 是纯能力列举,无 before/when/prerequisite;宿主看到的是"能干啥"不是"何时该调" | `tools.ts:214-223`(search)/`:171-181`(recipe_map)/`:227-238`(graph);对比 `:160-168` prime "Use before…" | 中高 |
| L6 | **prime 导流弱且漏 search**:prime 输出 recommendedTools 只在可选字段荐 recipe_map/graph,**完全不提 search**,且非强制 nextActions | `agent-public-tools.ts:2373-2382` recommendedTools:['alembic_recipe_map','alembic_graph'] | 中 |
| L7 | **两层引导不一致**:MCP onboarding/guidance 是"生成导向"(status→recipe_map→graph→search→prime→submit→dimension_complete,prime 晚且 stagedProtocol 缺);per-project skill 是"消费导向"主动。缺统一的消费循环 playbook | `guidance.ts:78-125`(Lifecycle 缺 search/recipe_map;Onboarding 只让读字段);`OnboardingContract.ts:122-148` | 中 |

**已证实为好的部分(不必动)**:per-project skill 生成措辞其实很主动、四工具全列、symlink 即时无需刷新(`ProjectSkillService.ts:354/635`);hasKnowledgeBase 门(databaseEntries/candidates/recipes)是有意的空项目克制。prime 自身措辞已是主动型。

## 3. 根因归纳

不是工具能力弱(prime/search/graph 输出质量都做过专项优化),而是**激活链在"触达宿主"这一段系统性漏**:生成的主动信号(per-project skill)可能到不了 cc 宿主(L2);到得了的引导又是生成导向、消费循环缺 prime(L4/L7);三工具措辞被动(L5);且全程无测量(L1)所以问题只能"凭感觉"。**先能测(L1)+ 确保信号触达宿主(L2)是地基,其余是措辞与协议的补齐。**

**补充洞察(用户 2026-07-03 提出,亲验)**:目前**完全没用 CLAUDE.md / AGENTS.md 这个通道**——它是两个宿主会话起点**必加载**的上下文文件(cc 读 CLAUDE.md,codex 读 AGENTS.md)。亲验:Plugin/主体现在都不往这两个文件写任何主动引导(仅 `ProjectSkillDelivery.ts:449` 一处无关提示)。这比修 `.agents/skills`(L2,宿主加载不确定)更稳:一行 managed 块**保证到达 LLM**。宜作为可靠主通道(WS-5),`.agents/skills`(WS-2)作为细节载体——两者互补;若 P0 证实 cc 不加载 skills,WS-5 就是 cc 的主激活通道。

## 4. 设计(四工作流)

### WS-1 测量先行(AlembicPlugin,地基)

把四工具调用信号外露成可读的度量:计数器不只生成 refId,经 AuditLogger 或 status 的诊断字段上报每工具调用次数/最近时间(会话级即可,不必持久 telemetry 服务)。目的:把"感觉不活跃"变成基线数据,后续每个改动可对照。**这是第一步——先能测**。

### WS-2 宿主可见性:per-project skill 导出 host-aware(AlembicPlugin,头号)

- **P0 先证**:cc 宿主到底从哪个路径发现技能(`.claude/skills` / 插件目录 / 是否读 `.agents/skills`)。
- 若证实 cc 不读 `.agents/skills`:`getProjectSkillRoot` 改 host-aware(codex→`.agents/skills`,claude-code→cc 的技能发现路径),沿用双宿主 L3 host-adapter 模式(host-name 分支只在 adapter 层,复用 DH 重构约定)。修完两个宿主的 per-project 主动技能都真加载到 LLM。
- 若证实 cc 已能读:记录证据,L2 关闭,主动性问题落到 L4-L7 措辞层。

### WS-3 安装 → 冷启动主动引导(Alembic 主体 + AlembicPlugin)

- 安装后"下一步 coldstart"不止 CLI 打印:经插件 `alembic_status`/初始化 onboarding 的 `primaryAction`/actionHints 让**宿主也主动看到**"该项目未冷启动,建议 bootstrap"(StatusService.buildStatusOnboarding 已有 needs_init 态,强化其触达)。
- **空项目克制不破**:仅在"有源码值得挖但未冷启动"时提示;真空/无关目录不提示(沿用现有门)。
- 是否自动跑冷启动:默认**仍不自动执行**(冷启动是重操作、耗 AI provider),只把建议做到宿主可见 + 一步可触发(CG-3 定)。

### WS-4 消费循环主动化(AlembicPlugin,措辞与协议)

- **三工具 description 改主动**:search/recipe_map/graph 的 MCP description 补场景驱动首句(如 search:"改动或回答项目标准前,先 search 既有 Recipe/决策";recipe_map:"定位项目结构/某模块的 Recipe 挂载前先 map";graph:"需要结构/依赖关系事实时先 graph")。**只改 description 措辞,不动输入输出契约/门禁/语义**。
- **prime 导流补全**:prime 输出的 recommendedTools/nextActions 补 `alembic_search`,并从可选字段升为明确"下一步"导向(recipe_map 结构 / search 细节 / graph 关系)。
- **guidance/onboarding 加消费循环 playbook**:在 `guidance.ts` 的 playbook 与 `OnboardingContract` 里,除现有"生成/bootstrap 流程"外,补一条**消费循环**:"回答项目问题/改动代码前:prime(任务语义)→ search(既有标准)→ recipe_map/graph(结构定位)";把 prime 放进 stagedProtocol 的消费分支(补 L4/L7)。

### WS-5 宿主上下文文件主动引导(AlembicPlugin + 主体,最可靠主通道)

在项目 `CLAUDE.md`(cc)/ `AGENTS.md`(codex)写一个 **Alembic 托管块**,内容是极短的主动指针:「本项目有 Alembic 知识库;改代码或回答项目标准问题前,先 `alembic_prime`,再按需 `alembic_search`(既有标准)/ `alembic_recipe_map`·`alembic_graph`(结构定位)。」约束(每条都是硬要求):

- **托管块模式**:`begin/end` 标记(仿 workspace CLAUDE.md 的 Wakeflow Access Card 块),**幂等可重跑、可整块移除、绝不覆盖或改动用户已有内容**;标记外一律不碰。
- **尊重 ghost / 零侵入**:ghost 模式下**不写**(SetupService ghost=零侵入);标准模式下 **opt-in**(setup flag / config),写入时明确告知用户「此块由 Alembic 维护,可安全删除」。
- **空项目克制**:仅 `hasKnowledgeBase` 为真时写;KB 被删除时**同步移除该块**(镜像 `ProjectSkillService.ts:327` 删技能逻辑)。
- **host-aware**:cc→`CLAUDE.md`,codex→`AGENTS.md`(与 WS-2 同一宿主分叉主题,复用 L3 adapter)。
- **指针非复制**:保持极短(几行),只做「有知识 + 先调哪个工具」的指针,细节留 skills/MCP,**不膨胀用户上下文文件**。
- **生命周期**:冷启动完成(KB 就绪)时写/更新;与 WS-2 skill 生成同一时机。

## 5. 非目标 / 硬护栏

- **不改四工具对外输出契约/语义/知识门禁**(MCP clean-output contract、knowledgeGate、resident 路由策略全不动);本需求只改"何时/如何被触发"(description 措辞、guidance、onboarding、导出路径、测量)。
- **不破空项目克制**:hasKnowledgeBase 门保留;"更积极"仅对有真实知识的项目,空/无关项目不骚扰、不主动 prime、不写 CLAUDE.md/AGENTS.md。
- **CLAUDE.md/AGENTS.md 只写托管块**(WS-5):begin/end 标记内,幂等/可移除/绝不覆盖用户内容;ghost 模式不写;opt-in 且告知可删。这是用户文件,侵入性最低是硬约束。
- **不自动跑冷启动**(默认):冷启动重、耗 provider,只做到宿主可见建议 + 一步可触发。
- **不重引常驻/守护**:沿用非常驻 MCP;测量是会话级信号,不新引 telemetry 常驻服务。
- host-name 分支只在 L3 host-adapter 层(复用 DH 双宿主约定),不散落。
- 只在各仓边界内改;develop on main;push 用户门。

## 6. CG(全部已批 — 2026-07-03 用户「全部按推荐」)

下表"Design 推荐"列即用户已批决定(CG-1 加测量 / CG-2 P0 先证再修 / CG-3 宿主可见建议不自动跑 / CG-4 改主动措辞 / CG-5 补消费循环 / CG-6 加托管块 / CG-7 标准默认开·ghost 恒关)。

| CG | 问题 | 选项 | 决定(=推荐) |
| --- | --- | --- | --- |
| CG-1 | 测量先行 | 加会话级使用信号(status 诊断字段/AuditLogger)先建基线 / 不测直接改措辞 | **加测量**(先能测) |
| CG-2 | per-project skill 导出 host-aware | P0 先证 cc 加载路径→不读则改 host-aware / 已读则关闭 L2 | **P0 先证再修** |
| CG-3 | install→coldstart 主动度 | 宿主可见建议+一步可触发(空项目克制)/ 自动跑冷启动 / 仅保持 CLI 打印 | **宿主可见建议,不自动跑** |
| CG-4 | 三工具措辞 + prime 导流 | 改主动措辞 + prime 补 search 导流(不动契约)/ 维持 | **改**(仅措辞层) |
| CG-5 | 消费循环 playbook | guidance/onboarding 补消费循环分支(prime→search→map/graph)/ 维持生成导向 | **补** |
| CG-6 | CLAUDE.md/AGENTS.md 托管块(WS-5) | 加(最可靠主通道:opt-in + ghost 克制 + 托管块 + 空项目不写)/ 不加(只靠 skills) | **加**(最稳解 L2,保证到达 LLM) |
| CG-7 | opt-in 默认值 | 标准模式默认开托管块 / 默认关需显式开 | **默认开**(标准非 ghost 项目;ghost 恒关) |
| CG-8 | 冷启动自动同步(WS-6) | 补:冷启动尾自动 refreshKnowledgeSkills(skills/托管块随 KB 自动写删)/ 维持手动 refresh | ✅ **补**(2026-07-03 用户拍;激活链自动同步闭合件,详见 §10.7) |

## 7. 阶段与验收(P0→P4)

- **P0 证据门**:① cc 宿主技能发现路径实证(L2,决定 WS-2 修不修)② 加 WS-1 测量,跑一次真机取四工具调用基线(把"不活跃"量化)。
- **P1(AlembicPlugin)WS-1 + WS-4 措辞**:测量外露 + 三工具 description 改主动 + prime 导流补 search + guidance/onboarding 消费循环 playbook;单测(description/nextActions/guidance 文本)+ build:check + 全量 vitest 零回归 + 四工具输出契约测保持绿(证语义未变)。
- **P1b(AlembicPlugin + 主体)WS-5 托管块**:CLAUDE.md/AGENTS.md 托管块写/更新/移除(幂等 + ghost 不写 + hasKnowledgeBase 门 + host-aware)；单测(幂等重跑不重复/不覆盖用户内容/ghost 静默/KB 删除移除块)。
- **P2(AlembicPlugin)WS-2 host-aware 导出**(若 P0 证实需修):getProjectSkillRoot host-aware + 双宿主各自加载验证;单测 + 边界测试。
- **P3(Alembic 主体 + Plugin)WS-3 安装引导**:setup 后建议触达宿主 + needs_init onboarding 强化 + 空项目克制回归。
- **P4 真机双向验收(gate)**:装一个真实项目→冷启动→在两个宿主(codex + claude-code)分别验:① WS-5 托管块写入正确文件(cc=CLAUDE.md/codex=AGENTS.md)且**被宿主加载进 LLM 上下文**(这是 L2 的可靠兜底,优先验);② per-project 主动技能加载情况(WS-2,若 P0 证 cc 不加载则以 WS-5 为准);③ 宿主在"改代码/答项目问题"场景主动调 prime→search/map/graph;④ 测量信号显示四工具调用数较基线上升;⑤ **空项目 + ghost 模式**:不写 CLAUDE.md/AGENTS.md、不主动 prime、不被骚扰;⑥ KB 删除后托管块被移除。证据 = 两宿主上下文加载证 + 调用序列 + 测量基线/改后对照 + 空项目/ghost 静默证 + 块移除证。

## 8. 风险与开放问题

- **cc 技能加载(L2)= 头号未验证项**:代码事实(硬编码 .agents/skills、无宿主分支)已证;cc 侧到底读不读是宿主集成问题,P0 必须实证(关联记忆:cc 冷启动曾报"3 Skill"生成,但"生成"≠"被宿主加载到 LLM",须区分)。
- **测量口径**:会话级计数够不够回答"更积极",还是需要跨会话?建议先会话级基线,不足再议(避免过早引 telemetry 常驻)。
- **description 改措辞的副作用**:MCP description 是 host LLM 触发依据,改措辞可能改变调用频率分布;P1 需 description 文本快照测 + 语义契约不变证,避免误伤 clean-output 契约。
- **与 W 系列/双宿主直推交叠**:touches host-runtime/mcp、skills、StatusService,可能与用户直推工作同文件;排期用户定。
- **"更积极"的度**:过度主动会变骚扰(尤其空项目);硬护栏是空项目克制不破,度由 CG-3 + 真机 P4 校准。

## 9. Design 完备性自检

- 覆盖用户三诉求:四工具消费(WS-4)+ 安装引导(WS-3)+ 冷启动建议(WS-3)+ 底层使能(WS-1 测量 / WS-2 宿主可见性)。
- 断点全部 file:line 亲验(七点),区分"已漏"与"已好不必动";头号未验证项(cc 加载)显式标 P0 实证,不 over-claim。
- 验收含两宿主真机 + 测量基线对照 + 空项目克制回归,可证"更积极"且不骚扰。
- 硬护栏守住语义/契约/门禁/非常驻/空项目克制。
- 本文档为 Design 产出,不构成派发;deliver/认领/派发/验收为控制器动作,由用户决定。

## 10. 实现指导(code-level,基于真实代码 5-agent 深挖 + 控制器亲验)

### 10.0 亲验带来的修正与范围更新(先读)

- **L1 订正(WS-1 亲验)**:§2 L1"四工具都有计数器"不准。真相:`agent-public-tools.ts:177-183` 的 primeCounter/workCounter/finishCounter/guardCounter 是 **prime/work/finish/guard 的 refId 生成线**,search/recipe_map/graph 的 handler 不在该文件、零计数。且**已有会话级外露通道**——`McpServer._trackSession`(McpServer.ts:386,亲验)已记 `toolCallCount`+`toolsUsed` 去重 Set,`alembic_status` handler(system.ts:120,亲验)已外露 `session` 块。**真实缺口 = 缺"每工具次数 byTool + 最近调用时间"**,而非"从零外露"。WS-1 因此改动极小。
- **仓范围更新**:WS-5 需**动 AlembicCore**——`PathGuard.ts:62`(亲验)`PROJECT_ROOT_WRITABLE_FILES=['.gitignore']`,CLAUDE.md/AGENTS.md 不在白名单会抛 `PathGuardError`;托管块 upsert 工具亦建议落 Core 供双宿主复用。故涉仓 = **AlembicPlugin(主)+ AlembicCore(WS-5 PathGuard+util)+ Alembic 主体(WS-5 pathGuard configure 扩展,WS-3 不碰 SetupService)**。
- **ghost 双语义(WS-3 亲验修正)**:ghost 只是"数据存哪",非"无源码"。**WS-3 的 onboarding 建议是返回数据不写文件→ ghost + 有源码仍应提示(仅文案不同)**;**WS-5 是写项目根文件→ ghost 必须全静默**。两处 ghost 判据不同,勿混。
- **开放项(WS-2+WS-5 双发现)= 潜在 CG-8**:带 `hasKnowledgeBase` 全量门 + 删除对称路径的 `refreshKnowledgeSkills`(ProjectSkillService.ts:322)**目前只被手动 `alembic_project_skill refresh`(skill.ts:96)调用**;冷启动 finalizer 走另一条 per-dimension 链、不触发全量刷新。即 skills/托管块"随 KB 状态自动写/删"在冷启动结束并未自动发生。**是否在冷启动尾部(applyDimensionCompletionSideEffects)自动补调一次 refreshKnowledgeSkills = 行为变更,列为 CG-8 待用户决**(不擅自并入)。

### 10.1 WS-1 测量外露(AlembicPlugin,加性,契约不破)

- **改点**:① `McpServer.ts:54`(McpConnection 接口)+ `handlers/types.ts:30`(镜像接口)各加 `toolUsage: Map<string,{count:number;lastCalledAt:number}>`;② `McpServer.ts:177`(_connection 初始化)加 `toolUsage:new Map()`;③ `McpServer.ts:386` `_trackSession` 追加 per-tool 计数(单点覆盖全部工具,无需改四个分散 handler);④ `handlers/system.ts:116`(现有 `session` 块旁)加 `usage: buildToolUsageView(ctx.connection)`,新增 helper 投影 byTool.{prime,search,recipeMap,graph}={count,lastCalledAt}。
- **边界坑**:usage 只能挂 `handlers/system.ts`(embedded 出口),**不能挂 `StatusService.ts`**(另一实例、读不到该 connection)。
- **不做**:不接 AuditLogger、不引常驻 telemetry(会话内 Map,随空间切换重置)。
- **验收**:status 返回 `data.usage.byTool` 四工具 count/lastCalledAt;单测 prime×1→count=1、search×2→count=2、未调 graph→{0,null};grep 证四 handler 无各自计数;四工具输出 envelope 逐字节不变;`session` 旧字段不回归。

### 10.2 WS-2 host-aware skill 导出(AlembicPlugin;P0-A 阻塞)

- **改法 B(架构合规,推荐)**:L3 `HostAdapter.ts` 契约加 `projectSkillRoot(projectRoot)`;`CodexHostAdapter` 返回 `.agents/skills`(字节不变),`ClaudeCodeHostAdapter` 返回 cc 实证路径(P0-A 前占位 `.agents/skills`);`getProjectSkillRoot` 变薄委托 `resolveHostAdapter().projectSkillRoot(...)`——签名不变,**4 调用方(ProjectSkillDelivery.ts:74/163、ProjectSkillService.ts:95/424)+ 2 测试零改动**,host 分支收口 L3。
- **P0-A 硬门**:仓内**零证据**证明 cc 从哪读项目级技能(`.agents/skills`=codex 约定;cc manifest `"skills":"./skills/"` 只管插件自带)。**必须真机实证**(两路径各放探针 skill,cc 重启看哪个被加载),实证前**禁止填 `.claude/skills` 猜测路径**。**实证前先查开放规范(§11 B-5):Agent Skills 规范 agentskills.io + Claude Code 官方 skill-discovery 文档很可能直接写明 cc 项目级 skill 路径,可省一半真机探测**。
- **隐藏耦合**:`pathGuard.addProjectWritePrefix('.agents')`(ProjectSkillDelivery.ts:223、ProjectSkillService.ts:549)——若 cc 实证路径不在 `.agents/` 下,须同步 fork,否则 cc 导出被 pathGuard 挡成 failed。receipt 字段名 `codexSkillRoot`(Core 冻结)只改值不改名=零跨仓。
- **验收**:codex 路径字节不变;cc 用实证路径;host 分支只在 L3(service 层无裸 `===CLAUDE_CODE` 分支);两宿主路径解析单测;cc 真机端到端(export→cc 重启→技能真被加载可见,非仅落盘)。

### 10.3 WS-3 安装→冷启动引导(AlembicPlugin;不碰主体 SetupService)

- **现状**:`needs_bootstrap` 分支(StatusService.ts:806)已有 primaryAction=alembic_bootstrap 且宿主可见(链路亲验:alembic_status→HostMcpServer.buildStatus→summarizeOnboarding→可见白名单 local-tools/output.ts 含 onboarding/primaryAction/nextActions)。**缺口=无法区分空目录 vs 有源码未挖**(inspectKnowledge 只扫 Alembic 数据目录,不扫源码树)。
- **改点**:① 新增 `status/SourcePresenceProbe.ts`(复用 ModuleService 的 SOURCE_CODE_EXTS/SCAN_EXCLUDE_DIRS/#countSourceFilesDeep 语义,带 maxDepth+早停 25,readdir 失败 catch);② `StatusService.ts:135` `StatusOnboardingInput` 加 `sourcePresence?`;③ `:229` 调用点仅 `!knowledge.initialized` 时跑探针填入;④ `:723` `needs_init` 分支按 `hasSource` 分流:有源码→primaryAction.reason/nextActions 加 alembic_bootstrap(明确"init 后 cold-start,不自动跑")、无源码→静默 note。
- **ghost**:**不全静默**——ghost+有源码仍提示(建议是返回数据非写文件),ghost 只改文案;只有"无源码"才静默。
- **不做**:不改主体 SetupService(console.log 宿主看不到);不自动跑冷启动(全程只构造 RecommendedAction,startsDaemon 未 init 阶段设 false);notes 注意 `.slice(0,6)` 别把 bootstrap note 挤出。
- **验收**:有源码未 init→nextActions 含 alembic_bootstrap+提示文案;空目录/ghost-空→无 bootstrap 建议+静默 note;任一态调用后 `.asd/jobs/` 无新 job(不自动跑);三态单测(有源码/空目录/ghost-空);needs_bootstrap 不回归。

### 10.4 WS-4 消费措辞(AlembicPlugin,只改文本,契约不破)

- **三工具 description 补场景首句**(tools.ts,inline 字面量,亲验 prime:161/recipe_map:171/search:214/graph:227):search:217 首行前加"Use to pull the exact Recipe/knowledge detail for a task after prime…";recipe_map:174 加"Use to see which Recipes govern a code region before you edit it…";graph:230 加"Use to trace how code connects — imports, impact radius, module layout, call paths — before changing…"。**能力枚举行 + Non-goal 段逐字保留;prime 不动**。**首句须含用户意图关键词(§11 B-1,Agent Skills 规范:description 写"何时用"+关键词)**——search 补"when the user asks about a project standard/convention/prior decision"、recipe_map 补"which Recipes govern a file/module before editing"、graph 补"about imports/dependencies/impact/structure",让宿主按用户意图匹配到工具。
- **prime 补 search 导流**(agent-public-tools.ts:2377):`recommendedTools` 改 `['alembic_search','alembic_recipe_map','alembic_graph']`(search 置首)+ `recommendedQueries` 首项加 search;schema `.max(8)` 接受任意工具名=零 schema 改动;**不动顶层 nextActions**(避开 RetrievalCheckpoint 断言)。
- **guidance 加消费循环**(host/guidance.ts:47 playbook 数组插 `buildConsumptionLoopPlaybookLine`)+ **stagedProtocol 补 prime 消费分支**(OnboardingContract.ts:363 末项追加消费步)。
- **验收**:三 description 首句场景驱动、枚举/Non-goal 逐字保留;prime recommendedTools 含 search;guidance instructions 含 "Consumption loop:"+prime+search;stagedProtocol 末项含消费分支;**四工具 zodToMcpSchema 输出契约逐字节不变**(ZodToMcpSchema/ZodSchemas 测绿)、门禁快照不变、KnowledgeContextPublicSurfaceGuidance 负向断言不触红(首句不含禁词)。

### 10.5 WS-5 托管块(AlembicCore util+PathGuard + AlembicPlugin 接线;ghost 全静默)

- **新建 managed-block util(落 Core,双宿主复用)**:`upsertAlembicManagedBlock(filePath,body)`(读原文→`<!-- alembic:managed-guidance:begin/end -->` 标记对间替换/无则追加,**标记外零改动、幂等、不 unlink**)+ `removeAlembicManagedBlock(filePath)`(只删标记对及其间、无块 no-op)。仓内无可复用工具(亲验),须新建;标记解析可参考 check-shared-asset-drift.mjs 的配对/嵌套处理。
- **PathGuard 扩展(Core,必须)**:`PathGuard.ts` 加运行时 `addProjectWritableFile(name)`(或 configure 期把当前 host 文件纳入),只放行当前 host 的一个文件名;排除项目保护语义不变。
- **接线(Plugin)**:挂进 `ProjectSkillService.refreshKnowledgeSkills`(:322)两分支——`hasKnowledgeBase` 真→`upsert`(host 文件=cc:CLAUDE.md/codex:AGENTS.md,经 `resolveHostRuntimeContext().pluginHost`)、假→`remove`(与删技能同点,镜像 `removeManagedRuntimeExport` 的 managedBy 守卫)。指针正文极短(prime→search→recipe_map/graph + 知识源路径),**指针非复制**(§11 B-2 渐进披露:永久位只放触发指针)。指针须含(§11 B-3/B-4)**① 一行具体消费示例**(如 "e.g. before editing AuthService: alembic_prime → alembic_search 'error handling'")+ **② 显式"knowledge grounded in THIS project's own code"**(接地=可信,驱动宿主消费)。per-project skill 正文同此两点强化。
- **ghost/opt-in**:ghost **全静默**(写文件违背零侵入);标准模式默认开(CG-7),读 `.asd/config.json` 开关(缺省 true)。
- **验收**:幂等重跑仅一对标记、块外字节不变;ghost 静默无 PathGuardError;空项目不写;KB 删移除块(不 unlink);正确文件 per host、另一个零触碰;opt-in 关不写;pathGuard 仅放行这两文件(其他根文件仍抛)。

### 10.6 阶段-验收总表(P0→P4,producer=Core→Plugin→主体,严格按序)

| 阶段 | 窗口 | 内容 | 验收 gate |
| --- | --- | --- | --- |
| **P0 证据门** | Plugin(cc 真机)+ Plugin | ① P0-A 实证 cc 项目级技能发现路径(决定 WS-2/WS-5 host 分支)② WS-1 测量外露先落 + 真机取四工具调用基线 | cc 加载路径有真机证据;status.usage 出基线数 |
| **P1 措辞+guidance** | Plugin | WS-4 三 description+prime 导流+guidance/stagedProtocol | §10.4 验收 + 四工具契约/门禁快照全绿(证语义未变) |
| **P1b 托管块** | Core + Plugin | WS-5 Core util+PathGuard + Plugin refreshKnowledgeSkills 接线 | §10.5 验收(幂等/ghost 静默/空项目不写/KB 删移除/per-host) |
| **P2 host-aware** | Plugin | WS-2 HostAdapter.projectSkillRoot(P0-A 确定后填 cc 路径)+ pathGuard 耦合 | §10.2 验收(codex 字节不变/cc 真机加载) |
| **P2b 自动同步** | Plugin | WS-6 冷启动尾自动 refreshKnowledgeSkills(仅 final、幂等、排 WS-2/WS-5 之后) | 冷启动完成免手动 refresh 即到位;per-dim 不触发;幂等;ghost 块静默(§10.7) |
| **P3 安装引导** | Plugin | WS-3 SourcePresenceProbe + needs_init 分流 | §10.3 验收(三态/不自动跑/needs_bootstrap 不回归) |
| **P4 真机双向验收(gate)** | Test/真机 | 两宿主(codex+cc)端到端 | §7 P4 六项:托管块被 LLM 加载优先验 + 主动调 prime→search/map/graph + usage 较基线上升 + 空/ghost 静默 + KB 删移除 + 四工具契约不变 |

### 10.7 WS-6 冷启动自动同步(CG-8 已决=补,2026-07-03 用户拍)

**决定**:冷启动结束**自动补调一次** `refreshKnowledgeSkills`,使 4 个知识技能 + WS-5 托管块 + WS-2 host-aware 导出**随 KB 就绪自动写/删,无需手动 `alembic_project_skill refresh`**。这是激活链"自动同步"的**闭合件**——不补则前面所有 WS 都要靠一次手动刷新才生效(WS-2/WS-5 亲验:refreshKnowledgeSkills 目前只被 skill.ts:96 手动调,冷启动 finalizer 走 per-dim 链不触发全量门)。

- **改点**:`dimension-completion.ts` `applyDimensionCompletionSideEffects`(:364)尾部(persistAndBroadcast 之后,:422-439),**仅在全维完成(isComplete / 最后一维)时**调一次 `service.refreshKnowledgeSkills()`。
- **护栏**:① 只在 final completion 触发、**不 per-dimension**(避免 N 次写);② 幂等(refreshKnowledgeSkills 本就可重跑);③ ghost 由内部各 WS 自理(WS-5 块写 ghost 静默、skills 导出沿既有);④ **排在 WS-2/WS-5 接线之后落地**,确保自动触发时走 host-aware 导出 + 托管块。
- **验收**:冷启动完成后**无需手动 refresh**,4 知识技能 + 托管块 + host-aware 导出即到位;per-dimension 完成不触发(仅 final 一次);重跑幂等;ghost→块静默、技能导出沿既有;KB 后续清空再触发→技能/块被对称移除。

## 11. 外部 skill/描述写作规范借鉴(Obsidian + Agent Skills 开放规范,2026-07-03 联网研究)

参照:[kepano/obsidian-skills](https://github.com/kepano/obsidian-skills)(Obsidian CEO 开源,**SKILL.md+frontmatter,跨 Claude Code/Codex/Gemini**——与我们同格式、同双宿主)+ [Agent Skills 开放规范](https://agentskills.io/specification)。提炼 5 条可迁移写法,**直接强化本需求既有 WS(措辞质量升级,非新增 WS,不改任何契约/语义)**:

| # | 规范/来源原则 | 折进哪(具体强化) |
|---|---|---|
| B-1 | description 须同时写"做什么"+**"何时用"**+关键词。规范原话:"describe both what the skill does and **when to use it**"+"specific keywords that help agents identify relevant tasks";好例含"…Use when the user mentions PDFs, forms…",坏例"Helps with PDFs." | **强化 §10.4 WS-4**:三工具场景首句在"Use to…"基础上补**用户意图关键词**——search:"…when the user asks about a project standard, convention, or prior decision";recipe_map:"…which Recipes govern a file/module before editing";graph:"…about imports, dependencies, impact radius, or structure"。**这是开放规范的权威背书,证明 WS-4 方向正确,非主观**。 |
| B-2 | 渐进披露三层:metadata(~100t,name+desc,**永远加载**)/ body(<5000t,激活加载)/ references(按需);SKILL.md<500 行,重料下沉 | **背书 §10.5 WS-5"指针非复制"**:托管块/description 是**唯一永久在上下文**的黄金位,只放极短触发指针,重内容留 skill/MCP。我们已一致,加此原理注记支撑决定。 |
| B-3 | body 给**具体输入/输出例子**,非抽象规则("showing exactly how to apply rather than abstract rules") | **强化 §10.5 WS-5 指针 + per-project skill**:指针/技能加**一行具体消费示例**(如 "e.g. before editing AuthService: `alembic_prime` → `alembic_search 'error handling'`"),比抽象 "proactively" 更能驱动真实调用。 |
| B-4 | 权威性带来可信("obsidian-markdown 准确,因为设计 OFM 的人写了它") | **强化 WS-5/per-project skill 措辞**:显式点出 "**knowledge grounded in THIS project's own code**"(我们 anti-fab 接地门的可信来源对应物)——宿主越信,越会去消费。 |
| B-5 | agent 无关/遵开放 Agent Skills 规范,跨 CC/Codex/Gemini | **给 §10.2 P0-A 一条查证线索**:cc 项目级 skill 发现路径,**先查 Agent Skills 开放规范(agentskills.io)+ Claude Code 官方 skill-discovery 文档,再真机试探**,可能直接定位、省一半探测。 |

**不照搬**:Obsidian 偏"人写笔记"的 prompt(扩写/摘要/会议纪要)与我们"AI 消费接地知识"场景不同,不引入;我们的 references/ 分层、recipe-authoring 富范例、clean-output 契约已符合或超出这些模式。

来源:[kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) · [Agent Skills specification](https://agentskills.io/specification) · [Steph Ango Obsidian Claude skills guide](https://claudeskills.info/blog/obsidian-claude-skills-guide/) · [Obsidian Copilot custom prompts](https://www.obsidiancopilot.com/en/docs/custom-prompts)。
