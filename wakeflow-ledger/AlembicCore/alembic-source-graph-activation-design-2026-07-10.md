# source_graph 激活方案(P2 设计稿,待用户决策)— 2026-07-10

状态:**设计输入,未 intake、未实现**。来源=模块能力深审登记项 (D) + 依赖图接线审计。

## 问题定义

"模块依赖关系"现有两种证据,只接通了第一种:

1. **清单声明**(已接通,2026-07-10):Discoverer getDependencyGraph → repo 上下文 →
   主体图 API/挖掘 briefing。回答"清单说模块依赖什么"。
2. **代码实引**(未接通):文件 import → 模块间真实边。BiliDili 实测
   `internal-edges:0, external-dependencies:82`——map 的 import 推导跑了,但 Swift
   的模块名导入(`import AOXFoundationKit`)解析不到本地模块;更完整的 source_graph
   子系统(code_entities+4 表+buildFull/buildIncremental)全仓零调用方,库中 0 行。

## 两轨方案

### Track 1(推荐先做,小):map internal-edges 的模块名解析

- 改动点:project-context map 的边解析,把 import specifier 对 discovery targets/
  localPackages 的名字做一次 join(`import AOXFoundationKit` → `Packages/AOXFoundationKit`
  模块)。数据都已在场(本次接线后 targets/packages 齐了)。
- 收益:dependencySummary 的 internal-edges 变真;Dashboard 声明边+实引边可对照
  (声明了没用/用了没声明=边界漂移信号)。
- 成本:小(单模块改动+回归);无新存储、无冷启动耗时。
- 验证:BiliDili internal-edges 0→≥6(AOX* 互引),easybox fixture ObjC
  `#import <NetKit/...>` 同理;check 全绿。

### Track 2(独立需求,大):SourceGraphLifecycle 接线

- 内容:buildFull(冷启动可选相)/buildIncremental(commit 驱动增量)→
  code_entities+file/entity 级边;CodeEntityGraph 消费(knowledge 侧富化)一并定位。
- 决策点(需用户定):
  1. 默认开 vs 旗标 opt-in(建议 observe-first:旗标开,先只写库+观测面,不进 briefing);
  2. 冷启动预算(BiliDili 规模实测建图耗时后定上限);
  3. 语言范围(建议 swift/objc 先行——你的项目形态;JS 系 map 已够用);
  4. CodeEntityGraph/knowledge 富化进第一期还是后置。
- 前置:Track 1 的边解析可复用其模块名 join 逻辑。
- 风险:冷启动时长、库体积;缓解=旗标+预算+增量优先。

## 非目标

- 不做运行时 call-graph 动态追踪;不引入新解析器(tree-sitter 资产已够);
- 不在本方案内改 briefing 结构(声明图已进,实引图进 briefing 属 Track 2 决策点 1)。

## 建议执行序

Track 1 先行(可与日常修复同批);Track 2 走 Design→confirm→独立 demand。

## 执行记录(同日,用户授权"Track2 也统一设计然后实现")

**Track 1 已落地(Core f3b5091)**:rollup 文件级解析落空后按模块名 join(精确名/
`Name/File.h` 首段;相对路径与 @scope 不命中,JS 系不变;自引用不产自环)。
真机:BiliDili internal-edges 0→11;单测 3 例。

**Track 2 已落地(Core d97ce66 + 主体 e0e872b),设计定案**:
- 决策 1(触发/旗标):不加旗标,挖掘准备段直接走 catchUpOnStartup(幂等:无快照
  全量/stale 增量/fresh noop)——消费面已存在且失败降级 null 不阻断;耗时打
  durationMs 日志,真机耗时不可接受再补旗标。
- 决策 2(预算):沿用 Indexer 内建(512KB 文件上限/256KB 解析上限/扩展名白名单/
  ignore 目录)。
- 决策 3(语言):本期 files 全语言入库(freshness 底座,.swift 含);实体/边仅
  JS 系——PARSABLE_EXTENSIONS 为自研提取器边界,Swift 实体需接 AstAnalyzer,
  登记 **Track2-b**(非白名单一行修,是解析器映射工作)。
- 决策 4(消费):observe-first——本期只建库+durableTables 观测日志;进维度
  prompt/briefing snapshot 槽位与 knowledge 富化(CodeEntityGraph)后置;
  Plugin 宿主 parity 后置。
- 出口:SourceGraphLifecycleService 经 ROOT 门面(SD-5 先例;此前连 service
  门面都未导出)。回归:真临时 sqlite 全量→noop→增量(durableTables 断言)。

验证:Core check exit 0(1622 tests);主体 tsc+unit 1036 绿;双 dist 已重建。
BiliDili 四表将在下次挖掘/rescan 时真实填充(files 全量+JS 系实体)。

## 真机验收(同日夜,BiliDili rescan,DeepSeek deepseek-v4-pro)

- 触发:POST /api/v1/jobs/rescan(dimensions=[performance-optimization]),859s 完成,
  7 候选 0 错误(in=354k/out=50k tokens)。
- ✅ 准备段双观测首现:`dependency graph loaded: nodes=38 edges=58 source=spm`;
  `source graph built-full: files=1408 symbols=1855 durationMs=3524`。
- ✅ Dashboard `/api/v1/modules/dep-graph`:38 节点/58 边(此前恒 0 边)。
- 🐛→✅ 验收抓到新缺陷:首量 87% 文件来自 `.build`(索引器私有排除表漏 '.build',
  ReDoS 同源入口)。修=对齐 COMMON_SOURCE_SCAN_EXCLUDE_DIRS(Core a2c31f0);
  忠实副本+真库 catchUp 自愈双验:built-incremental 250ms,files 1408→180、
  污染 symbols 1855→0(全来自 .build 第三方 JS,清除正确)。
- ✅ G-C 链首次真实触发:BiliDili 今日有真实代码改动(NetworkModule/Package.swift/
  AOX*),reconciler 判 60 refs drifted,CoverageClassifier 产 30 个 drifted→update
  提案——知识失效传播闭环在生产第一次跑通。
- 📌 登记 parity 跟进:主体挖掘管线新建 refs 的 contentFp 依赖下一次 reconcile
  补锚(16 条新 refs 暂无 fp;Plugin submit 链是 at-submit 种子)——主体 insert
  路径补 seed 属独立小修;P3 精判(gitReader/baseline)主体 reconcile 亦未接
  (Plugin rebuild 链已接),同归 parity 项。
