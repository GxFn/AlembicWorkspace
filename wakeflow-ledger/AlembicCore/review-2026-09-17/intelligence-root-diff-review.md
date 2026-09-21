# Root 当前 diff 独立只读复核

状态：review input，不是 accepted。复核时已使用 GenerateSession 的“保留对象身份并恢复磁盘快照”新版，不重复此前已修的外部进度丢失问题。本次没有修改产品代码。

未发现所读当前 diff 引入的新阻断回归。GenerateSession 的 Object.assign 恢复公开快照字段后，replaceProjectContext 恢复私有上下文，setOnChange 重新绑定新 submissionTracker 的回调；完成维度交集规则与未知维度拒绝一致。并发 manager 的全文件写竞争仍非本次补丁宣称解决的事务保证。

- EventBus rawListeners + apply(this) 同时保留 once 包装器与receiver；包装器移除时点符合EventEmitter语义，异步等待不再重复调用once。
- WorkflowResultPersistence 仅在snapshot.saved且report非null时清理恢复点；失败与跳过保留原返回结构及重试依据。
- SignalAggregator dispose取消订阅且清窗口，stop仍只停timer，符合“dispose终止、stop可重启”的区别。
- SignalTraceWriter允许的signal名字覆盖当前闭合SignalType枚举；拒绝路径不影响正常枚举，write失败仍非阻断，query边界错误显式抛出。
- SignalTraceWriter/ReportStore stats对0时间边界采用undefined判定，与query一致。
- .gitignore的/coverage/只忽略根覆盖率产物，source内coverage能力目录不再需负规则。
- CoreDelivery/ToolSystem/Codex三道测试各自禁止目录、禁止导入pattern、禁止符号及断言均未删除/改弱；新的source-files helper与原目录递归、node_modules/dist跳过、.ts筛选一致。
- host-agent-workflows/plans显式重复type export删除后，同一来源的export *仍保留这些类型；sourceContracts label转发userId与原switch各分支一致。
- ReportFacade旧测试只检测手写对象函数存在，替代PublicApiInventory使用真实TypeChecker检查ReportReader仅query/stats，证明更强。
- DomainLifecycle中默认值、kind推断、状态转移、历史及源元数据主要移入Lifecycle/KnowledgeEntry现有场景，未发现主要行为覆盖被删除。

## 留给主线程的两项观察

1. P2 / 既有隔离缺口（不是新增回归）：WorkflowResultPersistence成功后仍调用clearDimensionCheckpoints(dataRoot)，后者直接rm整个.asd/bootstrap-checkpoint。若同一dataRoot上A session完成而B session仍有恢复点，A会删除B。触发依据为GenerateSessionManager已允许不同projectRoot并存；当前新测试只有一个session。是否扩修由主线程决定，不能把此项算作本diff引入。
2. P3 / 测试合并细节：删除的DomainLifecycle显式断言isCandidate('deprecated')为false；Lifecycle当前只断言pending/staging为true、active为false。建议在现有predicate测试补这一输入，保留旧反例集合；不必恢复重复测试文件。

未读取本轮A新增知识helper或C在修的RecipeParser，不对其给结论。
