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
