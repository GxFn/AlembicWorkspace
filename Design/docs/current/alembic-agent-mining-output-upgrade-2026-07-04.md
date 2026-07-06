# AlembicAgent 挖掘产出层架构升级——七点收敛设计（2026-07-04）

- 执行线：用户直推（不走 Wakeflow 派发），沿用 [alembic-coldstart-evidence-ledger-redesign-2026-07-04.md] 的证据台账底座与真机探针。
- 流程（用户裁定）：规划方案（Part I）→ 真实代码执行计划（Part II）→ 分阶段实施（Part III）→ 验证调校（Part IV）。
- 事实基础：8 跑真机取证（run-1~8）+ 四路并行代码测绘（2026-07-04，全部锚点已亲验或子代理带 file:line 回报、关键矛盾已亲验裁决）。

## Part I 规划方案（七点架构设计）

### P1 采集端——证据形态一等公民

**问题**：run-6 台账 56 条中 23 条（search/structure/terminal）无 file 归属，不能机械展开为引用；引发 run-6 误杀、run-7 LINE_MISSING 链。
**真根因（亲验）**：per-file 分组采集分支**已存在**（EvidenceCapture.ts:138-154，按文件分组、含行号内容），但 `handleSearch` 把结构化 `SearchMatch[]` 丢弃、只 `ok(formattedString)` 返回（code.ts:117-125）——`structuredContent.matches` 永远缺席，采集落入单条无 file 兜底（:156-171）。
**设计**：
1. search handler 结构化返回 matches（formatted 文本仍供模型阅读）——已写好的 per-file 采集分支即刻激活；
2. 展开器为「file 有、range 无」的 search 条目派生行号标签：条目 content 每行 `NN: text` 是采集真值，取首 K 个命中行输出 `file:NN-NN`（K 初值 2，调校项）；run-7 的行号回填降级为 legacy 兜底；
3. terminal 条目：命令 argv 含存在路径（cat/head/sed/ls 目标）时归属 file；
4. structure 条目保持无 file（布局证据支撑"存在性"断言），由 P4 的引用语义说明覆盖。
**非目标**：不改 Core 契约（EvidenceEntry 现有字段足够，`hits` 结构化字段留观察）；不动 8000 字符条目帽。

### P2 认知端——VERIFY 机械化（U-3 收编）

**问题**：保真链唯一无机械校验的一环——"引用真实"已保证，"结论与引用相符"没人查；producer 提示词说"Analyst 已确认的发现"是虚词。
**设计**：finding 获得校验状态机 `recorded → verified | unverified`：
1. VERIFY 相注入台账审计指令：逐 finding 用 evidence.get 取回 verbatim 与断言对照，确认/修正/撤回；
2. 机械规则：refs 全为非 read 类（layout/terminal）的 finding 标 `needs-read-verification`，nudge 强制 code.read 采集带区间条目后重引；
3. RECORD 配额只计 verified；SUMMARIZE 与 distill 只携带 verified（unverified 显式标注排除）；producer 输入的"已确认"变为真话。
**取舍**：模型自审不是强证明，但"逐条对照 verbatim+撤回通道+配额激励"三件套把成本压给捏造方；比 LLM-as-judge 二审（U-9，CG-10 未拍板）便宜一个数量级。

### P3 深度端——深度槽激活

**问题**：designIntent/boundaries/failureModes/tradeoffs 深度槽（P4/C10 管线）真机使用率 **0%**（run-8 日志零出现）——可选参数+指令不点名+配额不奖励。
**设计**：
1. RECORD 指令显式要求：importance ≥7 的 finding 必须携带至少一个深度槽（为什么这样设计/边界在哪/越界会怎样）；
2. 配额加权：带深度槽的 finding 计 1.5 个（tracker 计数），nudge 报告深度缺口；
3. producer 【价值与深度】区指令：把槽位映射为正文小节，喂给 C4 depthReview 评分。
**防博弈**：P2 的 VERIFY 同时审计槽位断言（槽内容与证据矛盾→撤回）；加权强度是调校项（CG-D）。

### P4 表达端——契约面对齐（E4 教训制度化）

**问题**：submit schema `reasoning.required:['sources']`、evidenceRefs 可选（registry.ts:257,249-254）——与维度运行的强制契约相反，schema 在主动逼模型手写 sources；`scope` 字段根本不在 schema（模型无法自行声明 narrow）。run-8 首拒 3 次的结构性根源。
**设计**：维度运行注入 submit schema 变体：`reasoning.required:['evidenceRefs']`、sources 描述改"由台账自动展开，仅 search 类引用时补充"、新增 `scope` 枚举字段；非维度运行保持原 schema。
**制度化**：新增「契约面对齐」表征测试——维度变体的 required 与运行时闸逐项相等；任何新闸必须同步 schema 面（E4/run-6 两次教训的永久钉）。

### P5 视野端——producer KB 视野与 supersede 通路

**问题**：producer 对已有知识库全盲（existingTitles 只进 gateway 查重，模型看不见；submittedTitles 仅会话内）；饱和库上盲写→gateway 静默拒重烧回合；撞重无"证据更强→升级"通路。
**关键事实（测绘）**：基础设施大半已存在——insightProducer.ts:384-402（§9a rescan 模式已渲染 existingRecipes 标题+占用 trigger）、:405-420（§9b 衰减 supersedes 提示）；`knowledge.search` 动作已实现（handlers/knowledge.ts:229-231）只是 PRODUCE 工具集未放行；主仓→agent 已有 `_bootstrapDedup` 不透明通道（ToolExecutionPipeline.ts:419）。
**设计**：
1. bootstrap 模式激活 §9a：主仓准备阶段把本维度已 accepted 标题（top-N=15）填入 artifact（复用 rescan 的 existingRecipes 字段），提示语义="已存在勿重复；你的证据更强时用 supersedes:<id>"；
2. duplicate_blocked 响应已带 similar 标题——producer 提示教路由：真同→跳过换下一 finding；更深→supersedes 重提；
3. `knowledge:['search']` 放行与否为开放决策 CG-A（成本 vs 主动查重视野）。

### P6 综合端——跨维综合 pass

**问题**：维度 tier 内并行、彼此隔离（TierScheduler），跨维的深 recipe（分层×边界×barrel 是同一体系的三个执法面）无产出机制；run-8 architecture 全是单配置文件事实。
**关键事实（测绘）**：全维完成后有唯一收口点 `finalizeAiDimensionPipeline`（主仓 AiDimensionFinalizer.ts:114-178）；跨维 findings 已可读（SessionStore#evidenceStore 按 dimId 写透，searchEvidence 跨维查询）；台账按 `<dataRoot>/.asd/evidence-ledger/<jobId>/<dimensionId>.jsonl` 分文件、**无跨维 reader**。
**设计**：
1. Agent 侧新增台账跨维 reader（静态 `listForJob(dataRoot, jobId)` + 聚合只读视图，E-id 加维度前缀防冲突）；
2. 新合成维度 profile `cross-dimension-synthesis`（layer=universal）：输入=全维 verified findings+聚合台账；工具=evidence.get/search（跨维）+memory recall+knowledge.submit；配额 3-5；门禁与普通维度完全一致（sources 天然跨多文件，EVIDENCE_FLOOR 自动满足）；
3. 主仓在 finalize 前插入合成 stage（bootstrap 选项 `synthesis` 控制，限定维度 run 默认关）；
4. 是否放行 bounded code.read（合成常需 1-2 次连接性阅读，capture 使其自动成为合法证据）= 开放决策 CG-B。

### P7 下游端——产物化断链审计

**问题与新事实**：挖得再好也堆库里——但 run-8 日志显示 `EvolutionMaintenanceSweep` 活着且 `waitingCount=7、promotedCount=0` 持续：执行器已接线在跑，**是晋级判据/输入在饿死**（结合 [[alembic-recipe-productization-optimization]] 零调用方结论需修正为"sweep 有调用方，晋级条件不满足"）。
**设计**：审计先行不预设修法——取证 7 个 waiting 项卡在哪个判据（decayScore 缺失? 人工批准缺口? 阈值?），交付审计报告+修复提案；涉 Core/主仓，**独立确认后才动代码**（跨仓边界）。

## Part II 执行计划（真实代码锚点）

| 点 | 改动 | 锚点 | 要点 |
|---|---|---|---|
| P1a | search 结构化返回 | Agent code.ts:117-125 | `ok(output)` → 结构化 `{matches, total}`+模型可读文本；对齐 ToolRouterAdapter.ts:140-164 的 data→structuredContent 包装契约（实施时先读 ok()/适配器签名） |
| P1b | 展开器行号派生 | submitEvidenceExpansion.ts:104-110 | file-无-range 条目：解析 content `^\d+:` 行，输出首 K 命中 `file:NN-NN`；行号回填（:219-260 一带）降级 legacy 兜底 |
| P1c | terminal 归属 | EvidenceCapture.ts:156-171 | argv 路径 token 存在性检查→file 归属 |
| P2a | evidence.audit | handlers/evidence.ts | 新 action：批量取回 finding refs 的 verbatim 对照视图 |
| P2b | 校验状态机 | ActiveContext.ts:152,440,456 + tracker | Finding 增 verification 字段；配额只计 verified；distill 过滤 |
| P2c | VERIFY 注入 | ExplorationStrategies.ts:190-211、NudgeGenerator:433,453 | 审计指令+needs-read-verification nudge |
| P3 | 深度槽激活 | ScanAnalyze.ts:28-33、GenerateAnalyze.ts:44-45、quota tracker、GenerateProduce 价值区 | 指令点名+1.5 加权+槽位→正文小节映射 |
| P4 | schema 变体 | AgentRuntime.ts:840-857（#getIterationToolSchemas 缝）、2139-2176（buildDirectNoteFindingSchema 先例）、registry.ts:218-279 | **新建对象绝不改注册表静态原件**（schema 按引用直达 provider）；evidenceRefs required+sources 降述+scope 枚举；对齐表征测试 |
| P5a | 已有标题注入 | 主仓 SessionExecutionBuilder.ts:143-174（per-dim 输入）→ artifact existingRecipes → insightProducer.ts:384-402 复用 | 主仓查本维度 accepted 标题 top-15 传入；bootstrap 模式激活 §9a/9b 渲染 |
| P5b | dup 路由教育 | GenerateProduce.ts 关键规则 + duplicate_blocked 响应 | 真同跳过/更深 supersedes |
| P6a | 跨维 reader | EvidenceLedgerStore.ts:109-115 布局 | 静态 listForJob+聚合只读视图（E-id 带维度前缀） |
| P6b | 合成 stage | 主仓 AiDimensionFinalizer.ts:114-178 finalize 前 | bootstrap 选项 synthesis；合成 profile+配额 3-5 |
| P7 | 审计 | 主仓 EvolutionMaintenanceSweep 判据链 | waiting=7 promoted=0 逐项归因；报告先行 |

## Part III 阶段划分（producer→consumer 序，每 Wave 独立验收可回滚）

- **Wave M1（表达与视野，Agent 为主+主仓一点，小时级）**：P4 schema 变体+对齐钉、P5a/b、P3 全部、唯一候选口径日志行（[Producer] 汇总增 uniqueAccepted/uniqueAttempted）。门禁：437+ 全绿、契约对齐钉、真机 2 维探针。
- **Wave M2（采集形态，Agent-only）**：P1a/b/c。验收：单测（search 3 文件命中→3 条带 file 条目；展开产出 file:NN-NN）+真机无 file 占比 41%→<15%、label-less 放行次数→≈0。
- **Wave M3（VERIFY 机械化）**：P2 全部。验收：表征（坏 ref finding 标 unverified 不计配额）+真机 verified 率入报告。
- **Wave M4（跨维综合）**：P6。验收：e2e 合成 stage 产出 ≥1 条引用 ≥2 维度证据的 accepted；synthesis 关闭时零回归。
- **Wave M5（产物化审计，跨仓独立确认）**：P7 审计报告→用户决策后另立执行。

依赖序：M1 无前置；M2 使 search 证据一等公民（M3 审计与 M4 合成的输入质量前提）；M3 在 M4 前（合成吃 verified findings）；M5 独立。

## Part IV 验证调校

**标准探针**：真实 workspace 两维（architecture+ts-js-module）scoped bootstrap，与 run-8 基线对照；每 Wave 落地后一跑。

| 指标 | run-8 基线 | 目标 |
|---|---|---|
| 首拒 EVIDENCE_REFS_REQUIRED | 3 次/跑 | 0（M1） |
| 无 file 台账占比 | ~41% | <15%（M2） |
| label-less 放行次数 | 4 | ≈0（M2） |
| 深度槽使用率（importance≥7） | 0% | ≥60%（M1） |
| verified finding 率 | 无此概念 | 报告可见+只计 verified（M3） |
| dup 静默烧回合 | ~4 次 | 显式跳过/supersede 决策（M1） |
| 唯一候选接受率 | ≈75%/73% | 双口径入报告、稳中有升 |
| 跨维合成产出 | 0 | ≥1 条/全量跑（M4） |

**调校环**：每 Wave 真机跑→拒因与使用率复盘→参数调整（K 命中行数、top-N 标题数、深度加权、合成配额）；100% 认证仍以新鲜 KB 测量为准（Dashboard 初始化新项目，既有阻塞记录沿用）。

**开放决策（实施前用户可改判）**：CG-A producer 放行 knowledge.search？（默认不放，静态注入优先）；CG-B 合成 stage 放行 bounded code.read？（默认放行+capture 兜底）；CG-C supersede 自动化程度（默认提示引导，Core 不强判）；CG-D 深度加权强度（默认 1.5）。——用户 2026-07-04 批"按推荐"，全部锁默认。

## Wave M1 执行实录（2026-07-04）

- **实现**：Agent commit（M1a schema 变体+对齐钉/M1c 深度槽双面+1.5 加权+RECORD 指令/P5b dup 路由/§9c 渲染面，441/441）+主仓 commit（M1b findAllByLifecycles 播种+existingDimensionTitles/M1d unique 双口径/E4-E3 既有测试钉修，996 绿）。
- **KB 真相修正**：knowledge_entries 只存最近一跑 staging（bootstrap 重跑同维度替换旧条目）——先前"8 跑饱和"主要是会话 dedup+语义记忆效应，非 DB 累积。
- **run-9 清库认证**（用户授权清库；备份 `~/.asd/backups/alembic-db-before-clean-kb-test-20260704-122311.db`；`bootstrap_mr5uznff_87521f62`）：两维各 6/13=46%（attempt）、**unique 67%/60%（新双口径首航）**；机制状态=advisory×5、无标签放行×9、机械展开×11、gateway 拒绝留痕×6 首次可见、清库下 dedup seed=0/duplicate=0 全部正确；accepted 12 条全部带机械展开引用。
- **run-9 暴露的三个残余（下一迭代 M1 收尾）**：
  1. **EVIDENCE_REFS_REQUIRED 首拒仍 ×6**：schema 变体在场仍发生——最可能是 provider（DeepSeek）不强制执行嵌套 required（`reasoning.required` 深层弱执行）；且缺"变体已应用"观测日志，无法证伪未生效假说。修向：①变体应用留痕；②把 evidenceRefs 要求上提到 params 顶层 description/required 观感位；③自救链已兜底（首拒→重提带 refs 全部成功）。
  2. **Core reasoning 持久化白名单丢扩展字段**：styleAdvisories（本跑 attach×5 全部未落库）与 evidenceRefs 均不在持久化 reasoning JSON——人工复核入口与证据溯源断裂。修向：Core reasoning 序列化白名单增两字段（additive 小改）。
  3. **深度槽零观测面**：tracker 已计数（depthSlottedFindingCount）但不出报告/日志，使用率无法测量。修向：[Producer]/report 增一行 depth 指标；首个可测跑后再调 CG-D。

- **M1 收尾（三残余修复 + run-10 验证）**：修复=Core `ReasoningSchema` 声明 evidenceRefs/styleAdvisories/styleWaiver 三可选字段（1563 绿）+ Agent 变体应用留痕/description 顶层双通道强化/相位转换行增 findings+depthSlotted（441 绿）。**run-10 结果**（`bootstrap_mr64gokt_8cad6e17`，daemon 49944）：unique **83%/63%**（architecture 峰值）；**EVIDENCE_REFS_REQUIRED 首拒=0**（双通道强化生效，run-9 ×6→0）；**深度槽使用率 0%→100%**（两维 findings=9/depthSlotted=9）；advisory×3。
- **run-10 未竟（下一迭代首项）**：①**M1b 播种静默未跑**——"bootstrap dedup seed"与降级 warn 双缺席：疑 generate workflow ctx 容器无 'knowledgeRepository' 键 → undefined-repo 走了无日志空路径（代码只在 length>0 或 catch 时留痕）。修=undefined/空双留痕+核对 generate 上下文容器键。②**styleAdvisories/evidenceRefs 落库仍=0**——ReasoningSchema 补字段未生效，zod-strip 假说未证实；真剥离点需 Core 内 gateway→repository 链单测实证（候选：UnifiedValidator 的 parse 输出替换、KnowledgeEntry 工厂字段挑选、或 stage-3 别处的白名单投影）。
