# Recipe 消费面(5 MCP)+维护进化环审计 — 2026-07-10(进行中底稿)

背景:BiliDili 真实 KB 就位(75 候选;60 refs drifted;**30 个 drifted→update 提案
在 evolution_proposals**——维护环第一批真实工作负载)。本底稿记录现状发现与落地计划,
跨上下文续作的单一入口。

## 五个 Recipe 消费工具(Plugin MCP 面,见 alembic-mcp-layer-walkthrough)

`alembic_search` / `alembic_prime` / `alembic_recipe_map` / `alembic_code_guard` /
`alembic_status`。P1 漂移感知已实现于 search/prime 链(Core SearchEngine +
Plugin handlers,b32a8e5/40fa3d5);**活体测试待做**(本会话 cc-host 进程仍是旧代码,
重启 CC 会话后用新面直测;或经 Plugin dist EmbeddedToolExecutor 探针)。

## 已确认发现(真机)

- **F1 主体 HTTP knowledge 面无漂移标注**:`GET /api/v1/knowledge`(list/query)与
  `/:id` 详情的输出**均无 sourceStatus/sourceRefs/driftedSourceRefs**——Dashboard
  是人审 30 个 update 提案的主界面,却看不到"该知识源头已漂移/漂在哪几段"。
  P1 当时只覆盖 search/prime 链;这是消费面缺口第一优先。
- **F2 主体挖掘 refs 落锚 parity**(已登记):新 16 refs contentFp 空,靠下次
  reconcile 补;Plugin submit 链才是 at-submit 种子。主体 insert 路径应同种子。
- **F3 主体 reconcile 未接 P3 精判**(gitReader/baseline;Plugin rebuild 链已接)
  → 主体链 drifted 无 line-shift/content-change 细分。
- **F4 维护环观测**:30 提案生成正常(CoverageClassifier);提案队列 HTTP/Dashboard
  可见性+审批流+staging 复核队列(143:staging-review-queue 存在)串联体验待验。

## 落地计划(下一上下文执行序)

1. **P-A 主体 HTTP 漂移标注**(F1):list/detail 输出补 sourceStatus(按 refs 聚合:
   active/drifted)+详情带 sourceRefs(path/status/contentFp 有无);Dashboard 提案
   审批的知识卡即见漂移。小改(routes/knowledge.ts 投影层),不动契约语义。**✅ 已落地+真机验证(主体 commit 见 git log):detail drifted+3 段明细/list 24÷60 标注。**
2. **P-B 主体落锚 parity**(F2):主体候选创建链 insert refs 时同步 seed contentFp
   (对齐 Plugin `#insertSourceRef`);回归=rescan 后新 refs anchored=100%。
3. **P-C 主体 reconcile 接 P3**(F3):KnowledgeRescanWorkflow 的 reconcile 传
   gitReader+baseline(对齐 Plugin knowledge-index-rebuild 的 resolveDriftBaselineCommit)。
4. **P-D 五工具活体矩阵**:重启 CC 会话(新 cc-host)后逐一真测:search(漂移降权
   0.85×+driftedSourceRefs 输出)、prime(sourceStatus 对称)、recipe_map(挂载
   索引与 staging/active 一致)、code_guard(Recipe 规则+enhancement 精确包)、
   status(usage 计数)。发现即修。
5. **P-E 维护环端到端**:处理 30 个 update 提案的真实走查(Dashboard 审批→
   执行器→refs 重锚→drifted 清零),staging 复核队列(24h/72h 期限)行为核对。

## 约束

评分/门路由改动须 eval:mining 验证;主体/Plugin 双宿主 parity 是验收线;
push/发版等用户门不动。

## P-D 五工具活体矩阵结果(2026-07-11,headless host-mcp @ BiliDili)

方法:ALEMBIC_PROJECT_DIR=BiliDili 拉起 dist/bin/host-mcp.js,真实 stdio JSON-RPC
(MCP 行分隔),structuredContent 取证。逐工具:

- **alembic_search** 🐛→✅ **D1 已修**(Core 8e70217):top-5 被同一 Recipe 垄断
  (1 主命中+4 条 recipe_region_* 当独立条目,且 region 条目无漂移标注)。根因=
  三处向量映射不解析 region 向量(metadata.recipeId/id 前缀)+RRF 路径漏去重。
  修=#resolveVectorEntryId 单源+RRF 补 keep-best。真机复验 top-3 三条不同 Recipe,
  漂移标注保留(a5f6e50b drifted)。
- **alembic_recipe_map** 🐛→✅ **D2 已修**(Plugin cc03c17):75 条恒 0 mounts。
  三因:space 区域只收 project/package(真实锚 target/module 被排除)+localPackages
  不进图+target 节点 path 硬编码 'package.json'。真机复验 mounts 0→50,rollups 按
  target 分桶。遗留 D2-b:同路径双节点/rollup 重复行(观察,不阻塞)。
- **alembic_prime** ✅:严格 facet 契约(必填 taskAction+requirementGoal+至少一个
  locator facet;不认识 query)。合法参数下 status=ready,4 accepted items。
  可用性观察:探针连弹 3 次校验错误,description 引导值得复核(登记 D5:prime
  接受项以 detailRefs 交付,drift 对称在 ref 明细层,待细查)。
- **alembic_code_guard** ✅(带疑点 D4):violationCount=0 对三行强解包+后台改 UI
  Swift 代码——BiliDili KB 的 recipes 无 guard 规则型条目,内置 swift 规则未覆盖
  该形态,判"正确的空";但 G2 的 appliedRules 摘要在 cc 面缺席(null),登记待查。
- **alembic_status** ✅:ok/daemon/knowledge 面正常。
- 附:CodexStatusService 全套件偶发失败=测试污染(单跑 12/12,stash 前后一致),登记。

## 剩余执行序(P-B/P-C/P-E 未动)

P-B 主体落锚 parity → P-C 主体 reconcile 接 P3(gitReader/baseline)→ P-E 30 个
drifted→update 提案端到端走查(Dashboard 审批→执行→重锚→drifted 清零)。

## 补充:alembic_graph 进矩阵(2026-07-11,用户指认漏项)

- **space/module** ✅:20 节点/40 关系,AOX* targets 带真路径(吃到 D2 红利)。
- **file-symbols** ✅:11 个 Swift 符号(AppCoordinator/window/...)——fileSymbols
  白名单修复在 MCP 面端到端验证通过。
- **file-flow** 🐛→✅ **D6 已修**(Core 59dc046 + Plugin b98923e):对
  AppCoordinator.swift 恒 0 节点(partial),Core 直探同文件 9 imports。两因:
  ①PROJECT_CONTEXT_FLOW_SOURCE_EXTENSIONS 是**第 6 份 JS-only 白名单**(.swift 在
  目标选择层丢弃)→ 接 Core 解析语言单源(经 ./project-context 门面新导出);
  ②边构建对模块名导入整条丢弃 → 按 Track1 语义 join 既有 target 节点。
  真机:0→8 节点/7 条 imports 边,partial→ready。
- 白名单家族计数更新:**6 处**(Core fileFlow/fileSymbols/moduleLayers/
  sourceGraph-indexer-exclusions + Plugin graph flow-extensions),全部收敛到
  parserLanguage/COMMON_EXCLUDE 双单源。

## P-B/P-C/P-E 落地(2026-07-11 凌晨,连续推进)

**P-B 落锚 parity ✅**(Core dfc802a + 主体 655fce1 + Plugin 205ab8c):
- 主体挖掘钩子 _populateSourceRefsForEntry 插入时同步算 region 指纹(16 条 NULL 实证根治);
- ContentPatcher 注入 projectRoot,update 提案执行后 refs 立即落锚(第三处无 fp 写点);
- 指纹三件套(computeSourceRegionFingerprint/parseSourceLineRange/stripSourceRangeSuffix)
  经 ./knowledge 门面导出。InProcessFileChangeHandler 的 stale 标记点语义正确不动。

**P-C reconcile 接 P3 ✅**(主体 655fce1):
- 新增 sustain/driftBaseline.ts:统一演化 checkpoint(git_diff_checkpoints 双宿主同表)
  作精判基线,scope 口径与 Plugin 声明一致(登记下沉 Core 单源);
- sourceRefReconciler 单例+IncrementalRescanWorkflow 注入 gitReader;
  SourceRefSyncConsumer 与 rescan 的 reconcile 传 baselineCommit。

**P-E 提案环走查 → 抓到维护环致命缺陷并修复 ✅**(Core 52570eb):
- 时间线证据:15:07:24 CoverageClassifier 产 30 个 drifted→update 提案(observing),
  15:07:56 被 rescan 起始 sweep 的 checkAndExecute 兜底循环送进 evaluateUpdate 的
  hasUsage 闸批量 auto-reject('no usage during observation')——**出生 32 秒处决**;
  库中 51 条历史提案全由同机制拒,提案人审环从未运转过(Dashboard 队列恒空根因)。
- 根因:信号驱动改造(U5 #8)后兜底循环自称'对长期 observing 兜底'却从不检查时长,
  观察窗口(EvolutionPolicy 24h/72h/7d)形同虚设。
- 修:兜底循环按 assessRisk→observationWindow 检查 proposedAt,窗口未满 skipped
  留 observing;信号路径本就 fail-silent 不受影响;人工 executeOne 不拦。
  回归:新鲜提案活过 sweep(14 测绿,旧 13 测兼容)。
- 登记决策项:①人工 executeOne 仍受 hasUsage 闸(人审通过被机器拒);
  ②drifted 来源 update 是否豁免 hasUsage(修复漂移 vs 使用率语义混闸)。
- 下次 rescan 产的提案将存活 24h+ 进入人审;60 条 drifted refs 仍在,环可再触发。

## ⚠️ DB 损坏事故与恢复(2026-07-11 00:5x)

- 现象:daemon 重启失败 SQLITE_CORRUPT('database disk image is malformed'),
  integrity_check 直接报错,.recover 仅出 2704 行(不全)。
- 恢复:23:52 的 .backup() 忠实副本(integrity ok,75 entries/337 refs/51 proposals)
  回填;坏库三件留存 scratchpad db-incident/ 取证。丢失窗口仅两项机械可重建:
  source_graph 自愈(下次挖掘准备段按新排除表自动 1588→~180)与 Plugin checkpoint
  推进(下次 guard 自动)。恢复后服务 ready,60 active/24 drifted 标注/图 38n58e 全在。
- 根因嫌疑(未定罪):P-D 期间多个 headless host-mcp 进程与 daemon 并发读写同一
  WAL 库,且探针进程 child.kill() 可能斩于写事务中。**流程改进(硬规则)**:
  headless 真库验收必须 daemon 停机窗口内进行或改只读;探针进程用优雅关闭
  (stdin end + 等待退出)代替 kill;高风险操作前先 .backup()。

## 四项决策裁定与落地(2026-07-11,用户全按推荐)

- **决策① hasUsage 闸双豁免 ✅ 已落地**(Core 3250809):人工 executeOne=人审终审
  (manual 旗标穿线,update 免 hasUsage/deprecate 免 decayScore 复核);drifted 修复型
  update(evidence 带 sourceStatus:'drifted')走新 evaluateDriftRepair(免 hasUsage,
  FP 护栏保留)。回归 2 测。至此提案环三层修齐:窗口闸(52570eb)+双豁免——下次
  rescan 的漂移提案将活过观察期且可被人审/自动执行。
- **决策② getExtraDimensions 暂不接入 ✅**:并入 swift-ios 包立项(包内已定义 2 个
  维度贡献,TierScheduler 消费登记待接)。
- **决策③ swift-ios 包立项(小步) ✅ 已落地**(Core 3250809+d0c5a80):仅语言条件
  {swift,objectivec};前置=detectFrameworks 补 Apple 生态(Package.swift/Podfile/
  Cartfile→语言检出,此前 Swift 项目三空集使包永不激活)。首批规则真机复核后与
  内置集查重收敛为 2 条独有(IUO 属性/Timer target 循环引用;as!/try!/main.sync
  内置已有,双报删除)。真机:resolve(BiliDili)=swift-ios/2 规则;HTTP guard 对
  探针代码双命中。**扩规则前先对照内置集查重(教训)**。
- **决策④ source_graph eval 对照后进 briefing ✅ 方向锁定,执行工单登记**:
  preparation.sourceGraphResult 字段已备;snapshot 组装深链接线+eval:mining A/B
  为下一工单(不深夜硬凿)。
