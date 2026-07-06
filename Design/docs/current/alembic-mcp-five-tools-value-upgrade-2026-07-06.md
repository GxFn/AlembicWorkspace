# Alembic 五 MCP 功能价值深度评估与升级设计（2026-07-06）

> 评估对象：`alembic_status` / `alembic_search` / `alembic_recipe_map` / `alembic_prime` / `alembic_code_guard`。
> 证据基线：2026-07-06 真机测试全记录——75 条 active KB（用户全量冷启动+晋级）、问题 A 根修（refs 1→230 回填，主仓 2ade1ec）、受控新增测试（76 条，submit 门禁链全程实测）、daemon 50040 新 dist。
> 性质：Design 评估文档。所有升级项均为**建议**，须用户/控制器决策后才进入实现。

---

## 0. 总体判断

五工具构成一条"知识消费闭环"：**status（有没有）→ prime（写码前取）→ recipe_map/search（导航与查询）→ guard（写码后守门）**。本轮实测后的总体结论：

1. **单工具的证据链质量已经过硬**——search 的 laneEvidence/scoreBreakdown、prime 的 trust posture 分层、recipe_map 的确定性挂载（source-range）、guard 的 checkpoint 路由，可解释性设计在同类系统里是第一梯队。
2. **工具之间的闭环没有接上**——prime 发出的知识包 guard 不知道；submit 的拒因 MCP 通道吞掉；rescan 请求的 produceSession 无回执。价值损耗主要发生在"缝"上，不在单工具内。
3. **双进程架构（MCP 进程 + daemon）是当前最大的系统性价值折损源**——语义检索死在 MCP 侧无 embed provider、新增条目向量不同步、事件不跨进程、插件缓存与源仓 dist 漂移崩溃，四个症状同一根因。

---

## 1. 每工具评估与升级项

### 1.1 alembic_status —— 价值：会话首跳的"知识库仪表"

**真机基线**：`knowledge_ready`、75/75、3 skills、freshness current、aspect 分面（runtime/knowledge）工作正常。

**缺口**：

| # | 缺口 | 证据 |
|---|------|------|
| S1 | freshness 口径与 guard checkpoint 口径不一致：status 说 `current`，guard 的 gitDiffEvidence 却显示知识基线 commit `baad05d1` 之后 503 dirty paths / HEAD 漂移未消解 | 同一分钟内两工具输出对照 |
| S2 | 无 lifecycle 分布面：用户刚做的 75 条 staging→active 晋级在 status 里不可见 | `aspect=knowledge` 输出只有 recipeCount |
| S3 | jobs.total=40 只有计数，无失败/低产告警投影（4/0 低产事故类问题要翻 dashboard 才能发现） | 本轮 status 输出 |

**升级设计**：
- **S1 知识-代码双新鲜度**：status.freshness 增加 `codeDrift` 子块——读 guard 同源的 durable checkpoint（`DurableGitDiffCheckpointRouting`），输出 `{knowledgeBaseCommit, headCommit, driftFiles, driftCommits, recommendation: none|rescan-suggested|rescan-strongly-suggested}`。让"该不该 rescan"从人肉判断变成首跳可见。
- **S2 lifecycle 分布**：knowledge aspect 增加 `{staging, active, deprecated}` 计数与最近晋级时间。一行 SQL 的成本，补齐运营盲区。
- **S3 最近作业健康**：`jobs` 增加 `recentFailures` 与 per-dimension 产出摘要（复用 JobStore 已有数据）。

### 1.2 alembic_search —— 价值：显式查询的可解释检索

**真机基线**：keyword 道健康（"errorHandler 错误处理中间件" 3/7 命中，whyMatched/routeEvidence 完整）；抽象中文短语零命中（阈值准入 by design）；**语义道全程未用**。

**缺口**：

| # | 缺口 | 证据 |
|---|------|------|
| R1 | 语义道断路：MCP 本地 `embed-provider-missing`；resident（daemon）明明有 1520 条向量 + ollama embed 可用，但 `residentSearch.semanticUsed=false, used=false` | 两次 search 的 laneEvidence |
| R2 | 新增条目向量不同步：本轮 submit 成功但 `vector: {entrySyncStatus: skipped, degradedReason: embed-provider-missing}`；daemon 的 SyncCoordinator 监听 knowledge:changed，但事件发生在 MCP 进程内，不跨进程 | submit 返回的 freshness.recipes[0].vector |
| R3 | 抽象查询零命中后的引导只建议"换 query"，没有把"这类语义问题该走 resident 语义道"的路由决策暴露出来 | 零命中响应的 nextActions |

**升级设计**：
- **R1 语义请求委托 resident（P1 优先级最高单项）**：MCP 侧 semantic lane 在本地 embed 缺失时，不降级放弃，而是把 query 原文 POST 给 daemon `/api/v1/search`（residentVector.endpoint 已在响应里自证可达），由 daemon 完成 embed+向量检索，结果按现有 admission 阈值准入。验收判据：`semantic.used=true` 且中文抽象查询（如"事件总线 完成事件 一次性监听"）命中 ≥1。
- **R2 跨进程向量补偿**：两选一——(a) MCP submit 成功后向 daemon 发一个轻量 HTTP 通知（daemon 已常驻），触发单条索引；(b) daemon 周期扫描 `vector_index` 缺失的 active/staging 条目补索引（EvolutionMaintenanceSweep 已有周期骨架可挂）。推荐 (b)：无新耦合、崩溃安全。
- **R3 检索路由建议**：零命中响应把 `laneEvidence` 里"resident 语义可用但未走通"翻译成一条 nextAction（去修/去等语义道），而不是只让用户换词。

### 1.3 alembic_recipe_map —— 价值：确定性结构挂载（"这个文件附近有哪些规矩"）

**真机基线**：问题 A 修复后 file 级 `source-range` 精确挂载实证（Bootstrap.ts 直挂 1 条 + lib 层 9 条 nearest-node）；space 级 rollup 21→61；diagnostics 干净。

**缺口**：

| # | 缺口 | 证据 |
|---|------|------|
| M1 | mounts 的 `sourceRefs:[]`/`matchedRefs:[]` 恒为空数组——挂载判定用了 refs，但不把行级明细带回给宿主，刚回填的 230 行区间数据在输出面浪费 | 本轮所有 recipe_map 输出 |
| M2 | region 之外的挂载去向不可见：75 条中 61 条进 rollup，其余（AlembicAgent 11/wakeflow-ledger 7/Test 4 前缀）在 space 默认视野外无踪迹，diagnostics 也为空 | space 级输出 + refs 分布 SQL 对照 |
| M3 | space 视野里 AlembicAgent 等 repo 节点缺席（只显示 4 个 package 节点），跨 repo 挂载天然掉出 | space 级 nodes 列表 |

**升级设计**：
- **M1 行级明细回填**：mount 输出补 `sourceRefs: ["path:start-end", ...]`（cap 3）与 matchedRefs 对应节点 ref id。宿主 agent 从"知道这里有规矩"升级到"一跳打开证据行"。
- **M2 未入区诊断**：diagnostics 增加 `outOfRegionMounts: [{recipeId, mountPath, reason: cross-repo|beyond-node-limit}]` 汇总行（cap 10 + 总数）。让"61≠75"从疑点变成可解释事实。
- **M3 space 顶层 repo 覆盖核对**：space 焦点下优先保证每个有 refs 的 repo 前缀至少有节点占位（占位不占 recipeMountLimit 预算）。

### 1.4 alembic_prime —— 价值：写码前的任务语义知识包 + 信任分层

**真机基线**：degraded 解除后 6 条精准命中（health 路由任务→三端点/无认证 fact/错误边界/JSON 信封/URL 前缀/Router 导出），全带 `source-ref exact locator evidence`；trust receipt 协议完整落地。

**缺口**：

| # | 缺口 | 证据 |
|---|------|------|
| P1 | locator 证据行级精度未用：detailRefs 全是 `health.ts:1`，而 refs 表里有真实行区间 | prime 输出 detailRefs uri |
| P2 | `usefulSlices:[]`/`matchedRegionClasses:[]` 恒空——宿主拿到 recipe id 还要再走 search get 一跳才能看到 coreCode/对比段 | compactPackage.acceptedKnowledge |
| P3 | prime→guard 闭环缺失：guard schema 注释明说 `primeRef ... intentionally not public until schema, handler, tests, and runtime evidence exist`——闭环是规划中而非否决掉的方向 | code_guard schema 描述 |
| P4 | `prime-vector-evidence-unavailable` 诊断常驻——语义证据面与 R1 同根因 | prime diagnostics |

**升级设计**：
- **P1 行级 locator**：prime 的 source-ref locator 从 `file:1` 换成 refs 表的 `file:start-end`（数据已在，纯投影改动）。
- **P2 切片直出**：acceptedKnowledge 附 `usefulSlices: [{kind: coreCode|contrast, text}]`（预算 cap，走已有 briefing-budget 机制）。减一跳、提升"注入即用"率。
- **P3 prime→guard 受控闭环（本文档最重要的跨工具升级）**：分三步走——
  1. guard 接受可选 `primeRef`，仅用于**观测**：guard 结果回填"本次 prime 交付的 N 条知识中，K 条与被检文件重叠"；
  2. 积累运行时证据后，把重叠知识的 doClause/dontClause 升为 guard 的检查清单增强（advisory，不新增硬门）；
  3. 回执协议闭环：guard 报告里带 receiptId 核对位，prime 的 trust receipt 从"宿主自觉"变成可审计链。
  每步都有独立验收判据，符合 schema 注释里"evidence exists"的开闸条件。
- **P4 归并到 R1**（同一修复自动解除）。

### 1.5 alembic_code_guard —— 价值：编辑后规则守门 + commit 驱动进化维护入口

**真机基线**：2 文件 review 0 violations；`initializationSource` schema 修复在重启进程实证；evidenceGate `defer-to-alembic-service` 语义正确。

**缺口**：

| # | 缺口 | 证据 |
|---|------|------|
| G1 | `scale-guard:503>200` 截断在多仓 workspace 是常态：503 dirty paths 中绝大多数是 Design/docs、wakeflow-ledger 文档与 dist 构建产物，占满 200 事件预算，`routeStatus: truncated` | 本轮 guard 输出 gitDiffEvidence |
| G2 | 守门正面清单缺失：violationCount=0 但看不到"哪些 Recipe 规则参与了检查"——0 违规无法区分"检查了且干净"与"没什么可检查" | guard resultSummary |
| G3 | guard 的 events 列表把 dist/ 文件删除/创建也计入（本轮构建触发 host-edit 500 事件），进一步挤占预算 | combined.log host-edit 事件 |

**升级设计**：
- **G1+G3 diff 事件分级过滤**：checkpoint 路由在计数前按路径类过滤——(a) 各 repo `.gitignore` 语义（dist/、node_modules）；(b) 可配置的文档路径类（`Design/docs/**`、`wakeflow-ledger/**`、`*.md` 权重降级）。目标：源代码变更占满预算之前，文档/产物永不触发 scale-guard。验收：本 workspace 状态下 `routeStatus: complete`。
- **G2 守门清单投影**：guard 结果附 `appliedRules: [{recipeId, title, matchedBy: mount|language|category}]`（cap 10 + 总数）。与 M1 同源（refs 挂载），让 75 条规矩的守门存在感可见、可审计。

---

## 2. 横切升级（工具间的"缝"）

### X1 MCP error 通道吞结构化拒因（本轮最痛观测洞）

**证据**：submit 两次拒收，宿主只见 `全部 1 条知识条目被拒绝。请在单次调用中补齐所有字段后重新提交。`——插件明明构造了 `data.rejectedItems + requiredFields + commonErrors`（tool-router.ts:739-756 `buildAllRejectedSubmitResponse`），但 MCP error 路径只透出 message；gateway 的 `[Gateway] ✗ validation rejected` 日志也只写 daemon logger，MCP 进程不落盘。最终靠本地脚本直跑 `UnifiedValidator` 才拿到拒因（`缺少必填字段: content.rationale / headers`）。

**设计**：错误信封在 message 内联 `commonErrors` 前 3 条（`……被拒绝：content.rationale 缺失；headers 缺失`），并保证 error 响应仍带 structured data（若宿主协议允许 isError+content 并存则走 content）。**一行消息的改动，省掉宿主一整轮考古。**

### X2 双进程一致性（系统性价值折损的根）

**证据链**（同一根因的四个症状）：
1. 语义道死于 MCP 侧 embed-provider-missing（R1/P4）；
2. 新增条目向量不同步（R2，knowledge:changed 不跨进程）；
3. submit 惰性动态 import 解析到 AlembicPlugin 源仓 dist，而该 dist 是 W5-e 重命名前旧构建 → `Cannot find module RateLimiter.js` 崩溃（本轮重建源仓 dist 修复）；
4. status 的 resident:false 与 daemon 实际在跑的事实并存。

**设计方向（需用户决策，二选一）**：
- **方案 A：MCP 委托 daemon（推荐）**——MCP 进程保留工具面与门禁，重资产操作（embed/向量检索/事件消费）经 HTTP 委托常驻 daemon；daemon 不在则显式降级并在响应里声明。渐进落地：R1 语义委托就是第一块。
- **方案 B：单进程化**——MCP 进程内起完整 runtime（含 embed provider 注入）。改动大、与插件 as-guest 设计（provider 由宿主注入）冲突，不推荐。
- 无论 A/B：**dev 解析指向源仓 dist 的路线需要启动自检**（source-dist staleness probe：入口 import 一个 manifest 版本戳，错配即 fail-fast 报"rebuild AlembicPlugin dist"，而不是运行期在第 N 次工具调用时崩）。

### X2 落地细化：daemon 可用性矩阵与 ensure-on-use 自启（2026-07-06 下午已实现第一块）

用户补充两条约束后定型：**daemon 入口属于 Alembic 主体**（runtime 包 = 插件仓 dist + @alembic/core，经 `prepare-codex-runtime-package.mjs` 的 `copyTree('dist','dist')` 核验——不含主仓 lib/daemon，仅插件形态起不了完整 daemon）；**主体在场时 daemon 必须常驻+自动启动**。

**形态矩阵**：

| 形态 | daemon 入口 | 行为 |
|------|------------|------|
| 1 主体在场（曾跑过 daemon） | daemon.json 自注册的 `entrypoint`+`execPath`（主仓 `6d7d447` 写入，Core `53752f5` 字段） | MCP 启动 fire-and-forget ensure：health 探测失败 → 按同款入口+同款 Node detached 拉起 → 等就绪（8s 预算） |
| 1' 主体在场（首次/或显式指定） | env `ALEMBIC_DAEMON_ENTRYPOINT`（+可选 `ALEMBIC_DAEMON_EXEC_PATH`），优先级高于自注册 | 同上 |
| 2 仅插件 | 无已知入口 | 诚实降级 `unavailable`（不是错误），resident 增强不可用并声明原因 |
| 3 主体在但 daemon 死 | 同形态 1 | 崩溃自愈：60s 冷却窗内不重复 spawn，超窗自动重拉 |

**实现**（插件 `a503906`+`c65d8b1`）：`lib/service/resident/DaemonAutostart.ts`（`ensureResidentDaemonRunning`，全分支留痕、依赖注入可测、8 例单测）+ HostMcpServer.start() 挂点；`ALEMBIC_DAEMON_AUTOSTART=0` 显式关闭；就绪预算 12s（真机实测 daemon 完整就绪 ~8.1s）。

**graceful-exit 缝隙修复**（真机验证暴露，Core `e5d2b6a`/主仓 `22d681b`）：daemon 优雅退出会清理 daemon.json——自注册 entrypoint 一并丢失，自启对 graceful kill 失忆。修 = **入口注册表 `daemon-entrypoint.json`** 与运行状态分离：启动时覆盖写、退出不清理；插件解析链变为 env > daemon.json > 注册表。**端到端真机闭环**：graceful kill（daemon.json 被清）→ ensure 走 `entrypointSource: entrypoint-registry` → detached spawn → 8.1s 后 daemon 复活（health ok + daemon.json 重新自注册）。

**后续（未做，属 P3）**：resident 调用点（search 语义委托等）的 lazy ensure 复用同一模块；launchd 开机自启（覆盖"不使用时的后台进化"价值）作为可选安装命令，需用户决策。

**运维事实修正（重要教训）**：插件缓存目录归 npm 管——entrypoint 缺失会触发自愈重装恢复包原貌，直接 rsync 外来内容进缓存既无效又有破坏性（2026-07-06 上午把主仓 dist rsync 进缓存删掉了 host-mcp.js 即此教训）。正确刷新 = `prepare-codex-runtime-package` 产出正宗包 → 同步产物到缓存包根（保留 node_modules）→ 重启宿主。

### X3 produceSession 契约未闭合（2026-07-06 下午核验升级：schema-only 未接线）

**证据**：rescan 请求带完整 `produceSession:{enabled, controllerAuthorized, gaps...}`，briefing 114KB 里无任何 session 回执字段；进一步核验——**插件仓全库 grep 该字段仅存在于 schema 与 args 归一化，下游零消费者**。submit 的会话门禁实际通过靠的是 rescan 自身的 generate 会话，与 produceSession 无关。

**已做（`a503906`）**：schema 描述改为诚实标注"保留字段（当前未接线）；rescan 的 generate 会话即提交凭证"，防宿主再被误导。

**后续设计（P3 决策项）**：真实现 produce session（独立预算/gap 绑定/回执 `{sessionId, expiresAt, createBudget}`），或删除该 schema 面——两者都比 schema-only 好。

### X4 noPadding 与完成地板的正面矛盾

**证据**：`alembic_dimension_complete` 提供 `noPadding: true`（"禁止为凑 target 生成虚假 Recipe"——反凑数的正确设计），但 `validateDimensionCompletionEvidenceGate` 的 `DIMENSION_COMPLETION_FLOOR.minCandidates` 地板不认 noPadding（recipe-evidence-gate.ts:409-416）——诚实的"本维度只有 1 条真 pattern"无法关闭维度，唯一出路是凑数（恰是 noPadding 禁止的）。

**设计**：gate 对 `noPadding===true` 分支放行 minCandidates 地板，条件为：(a) exhaustedReason ≥50 字且引用 ≥2 个真实文件；(b) 完成记录标记 `completionMode: exhausted-honest` 供人审与统计。凑数条目比少产条目对 KB 的伤害大一个量级——地板的本意是防敷衍，不是逼注水。

### X5 提交契约可发现性

**证据**：`content.rationale`、`headers` 是硬必填，但 submit 的 MCP schema 描述里不可见（藏在 Core UnifiedValidator）；配合 X1 的拒因吞没，宿主的学习成本 = 两次盲拒 + 一次源码考古。

**设计**：(a) schema 描述补必填字段清单（一次性文档改动）；(b) requiredFields 结构已存在于拒收响应，随 X1 一起透出。

---

## 3. 分阶段实现建议

| 阶段 | 内容 | 改动面 | 验收判据 |
|------|------|--------|----------|
| **P0 观测与契约** ✅（2026-07-06 已落地：Core `53752f5`/主仓 `6d7d447`/插件 `a503906`） | X1 拒因内联、X5 schema 必填清单、X3 诚实标注、S2 lifecycle 分布 + **daemon ensure-on-use 自启**（用户补充约束，提前实现） | Plugin tool-router/schemas/status + DaemonAutostart + Core DaemonState 字段 + 主仓自注册 | 拒收消息带具体缺字段 ✓（代码级）；daemon.json 自注册 ✓（真机）；自启 7 例单测 ✓；重启 CC 后 MCP 侧生效待复测 |
| **P1 语义道接通** 🔶（2026-07-06 深夜：三层修二） | ✅ 第一层 embed 404 根修（Agent `e21f6a1`：settings 裸 host:port 缺 /v1，OllamaProvider 归一化）；✅ 第二层索引尸体+对账死代码（Core `c619b0e` reconcileIndex 公开面 + 主仓 `37ed09f` Stage 3 接通——此前访问私有字段**从未运行过**；尸体索引清除后 76/76 向量重建，qwen3 1024 维）；🔶 第三层残留：daemon 运行态内存图不可搜（同容器同文件干净进程 SearchEngine 全链命中 0.67-0.73，daemon 恒 0，诊断 qdim=1024 nodes=76 活节点 0）——嫌疑面收窄到 daemon 独有启动流程（watcher/region 索引共享 store/Stage 交互），四道诊断已埋（下轮把 size==0 情形也纳入留痕） | Agent provider + Core vector + 主仓 startup | 干净进程判据已达（语义命中）；daemon 判据未达（恒 0）——R1 语义委托 resident 在 daemon 侧修复后自然达成 |
| **P2 精度与守门可见性** | P1 行级 locator、M1 mounts 明细、G2 appliedRules、M2 未入区诊断 | 投影层为主（数据都已在库） | prime detailRef 带行区间；guard 0-violation 时可见参与规则数 |
| **P3 结构性决策项**（需用户先决策） | X2 方案 A、G1 diff 分级过滤、X4 noPadding 放行、P3 prime→guard 闭环 step1 | 跨仓（Core floor 常量/Plugin gate/主仓 checkpoint） | guard routeStatus complete；诚实收尾可关维度 |

**依赖关系**：P0 无依赖；P1 依赖 daemon 常驻（已是现状）；P2 依赖问题 A 的 refs 数据（已落）；P3 的 X4 涉及 Core `DIMENSION_COMPLETION_FLOOR` 单源常量（两宿主同步，须走 Core-first 流程）。

---

## 4. 本轮实测留下的既成事实（供实现阶段引用）

- 问题 A 根修：主仓 `2ade1ec`（SourceRefSyncConsumer + ColdStartWorkflow 接线 + 5 单测）；75 条 refs 回填（230 行，entries 指纹逐字节不变）。
- 受控新增实测：KB 75→76（`01647e04`，staging），原 75 条无损；submit 单条路径 refs 当场填充（per-recipe reconcile 在插件 submit 链内——批量建库路径才需要收尾钩子）。
- AlembicPlugin 源仓 dist 已重建（W5-e 后首次），submit 惰性加载崩溃已解。
- 备份：`~/.asd/backups/alembic-db-user-full-coldstart-20260706-063301.db`。
- 未决用户门：主仓 commit 未 push；staging 新条目走 24-72h 观察窗晋级。
