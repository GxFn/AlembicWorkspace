# 主线程 ProjectContext 补充审查

65 文件 / 基线 14,479 行全文语义审查。入口、组合边界、失败/取消、排序、输出预算与真实消费者逐层核对。

|编号|已验证问题|修复|RED / GREEN|
|---|---|---|---|
|ROOT-PC-1|block comment 中 export 产生虚假关系|与 import 共用保行号注释屏蔽|file-flow-root-review-red.log / file-flow-root-review-green.log|
|ROOT-PC-2|同名方法先匹配到其他类调用方|完整 qualifiedName 优先|同上|
|ROOT-PC-3|module cycleCount 始终0|按真实 map cycle refs 归属，每环每模块计一次|architecture-planning-root-red.log / architecture-planning-root-green.log|
|ROOT-PC-4|显式changedFiles时删除文件不触发模块变化|从前后文件集合查变更|同上|
|ROOT-PC-5|NodeNext .mts/.cts 被适配层排除|source语言、parser映射和module scan同口径|node-next-context-red.log / node-next-context-green.log|

重名space sourceRef首项绑定交给知识/scope审查追加验证，最终状态见其报告。

保留理由：fileSymbols引用按首次出现顺序；fileFlow最终引用采用末项覆盖；presenter引用有legacy fallback键并按id排序。它们与9处可合并的kind/id排序、首项优先逻辑不同，不能为减行数改变输出语义。模块/图能力属于现役公共Core能力，即使部分叶子没有当前宿主直接import，也不能由此删除。

兼容设计观察（未认定为当前生产故障）：模块名join的多归属/同名策略、构造式isSourceGraph*守卫与严格wire校验的区别、includeCycles对派生层不确定性语义。没有在缺少消费者语义时扩大改造。
