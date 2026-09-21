# 主线程精简与复核记录

本轮从 `e274e31` 开始。用户授权 Core 全仓审查/修复/清理，并允许 Alembic、AlembicPlugin 必要接线。没有变更其他宿主、vendor、发布快照、当前 Wakeflow 控制状态。原有 AGENTS.md / CLAUDE.md 修改与早于本轮存在的 coverage/index.ts 未纳入本次提交。

## 删除与替代

|原实现/测试|处理与保留依据|替代入口/证据|
|---|---|---|
|test/DomainLifecycle.test.ts|与 Lifecycle / KnowledgeEntry 重叠；独有状态、时间戳、来源/历史断言迁移后删除|Lifecycle.test.ts、KnowledgeEntry.test.ts；consolidated-tests-green|
|test/AstGrammar.test.ts|旧grammar独有infer/ensure/reload/isAvailable/analyze断言迁入public真实入口|intelligence-tests-findings.md 与迁移前9 suites226/后8 suites218|
|test/ReportFacade.test.ts|擦除后运行时 typeof 类型断言没有验证接口形状|PublicApiInventory 通过 TypeScript checker 检查 ReportReader 精确成员|
|三道 Core 边界测试重复walk|保留三份禁用项清单，抽取相同文件遍历|test/support/source-files.ts；第四 CorePackage 测试独立保留|
|ProposalExecutorBounding / ConsolidationAdvisor / ContentPatcher / authoring guidance 重复case|只删被真实行为case包含的断言；不删失败路径、数据/协议边界|duplicate-test-case-cleanup、consolidated-tests-green|
|SnapshotViews.toResponseData|没有公共出口及三外层消费者；重复数据投影删除|活跃 toSessionCache 保留；production-cleanup-map.md|
|ProjectContext九处ref去重|首项保留且 kind/id 排序语义完全相同|内部 shared/refs.ts，未加公共出口|
|其它近似dedupeRefs|fileSymbols首见顺序、fileFlow末项覆盖、presenter fallback键各不同，保留|root-intelligence-review.json|
|GenerateRepository.create/saveWithDimFiles重复制表|同默认值、JSON与wire映射收敛|内部 snapshotToRow；两种真实数据库路径字段回归|
|RecipeSimilarity / GenerateDedup重复Jaccard|只共享已有纯算法，不合并各自预处理和权重|内部 ngramJaccardSimilarity；稳定shared facade仍只导出既有4项|
|sourceContracts sourceLabel重复映射|原函数委托同语义 userId映射|原公开函数保留|
|LifecycleEventRepository重复row映射|统一既有私有 #mapRow|原分页/排序/DTO保留|
|AstAnalyzer/Swift未使用私有函数、SimilarityService未用局部值、RecipeParser未用正则、EnhancementSuggester未读私有字段|引用扫描证实无调用；不删公共constructor兼容选项|相应领域真实行为回归|
|plans/host-agent、daemon/vector/foundation重复具名type导出|只删除同一来源已被 export* 覆盖的声明|后三门面570个TS符号名称/flags/声明来源逐项相同；facade-type-export-parity.json|
|.gitignore非锚定coverage/|改为根/coverage/，避免忽略真正的src/repository/coverage源码|不提交已存在的未跟踪index.ts|
|CI与release重复/分叉命令|复用npm run check，普通PR补上已有完整门禁，release去掉重复build/smoke|YAML及check本地执行；未发布|

## 主线程修复矩阵

- 会话：reload 保持对象身份且更新磁盘字段，避免重复start/跨项目读取后后续修改不落盘；未知维度不能把session误判完成。
- 工作流恢复：snapshot/report失败保留checkpoint；成功只清理自己的session，未知/损坏归属不删除。
- 事件与信号：异步emit遵守once和this；dispose取消订阅；0时间戳查询边界与统计一致。
- 文件/配置：GraphCache/SignalTrace路径约束；ConfigLoader阻止原型写入；workspace配置损坏时拒绝覆盖且错误不泄漏JSON片段。
- 检索：raw ISO时间转Unix秒，增量包含同秒边界，新增/编辑/弃用可正确刷新。
- 快照仓储：clearProject无隐藏9999行上限；opaque自定义dimension id不与Object原型成员冲突。
- 源差异：真实Git diff的++/--源码行不再当文件头丢弃。
- rename脚本：移动导入方时，重新计算其未移动依赖的相对路径；保留dry-run和git mv。
- ProjectContext：注释导出不造假、同名方法绑定正确容器、环计数归属参与模块、删除文件进入模块变化、NodeNext源扩展名三层对齐。
- 独立复审修复：KnowledgeFileWriter所有权检查兼容旧parser支持的key空白；不同ID、前缀和重复ID仍拒绝。

## 复核发现与兼容边界

- 默认WAL的保存/重放失败不能清日志，异步追加只能确认已保存前缀。额外发现walEnabled:false在保存期间新增数据后dirty被覆盖，真实Hnsw重启复现；已交intelligence修复，最终结果见其报告。
- 文件是真相、DB是索引。文件批次并非跨文件/SQLite分布式原子事务；部分文件成功会保留真相并明确报错和同步恢复路径，不再删除覆盖过的旧知识。
- 公共API、历史migration、deep-path shim、严格生产多版本协议和外层仍消费能力保留。未把主路径功能删成空壳。
- 未证明所有权的旧向量条目不自动删除；后续需要可审查的迁移范围。
- 未用测试绿灯证明真实用户项目全量功能，也未做外部服务、真实AI调用、发布或远端推送。历史数据库全版本组合与平台差异不由本次临时fixture覆盖。

追加复核：ContentPatcher legacy桥表引用在reasoning归一为空数组时不能被正文补丁清空；显式引用补丁仍可清空，非空canonical来源按原规则重新落锚。2 RED→4 suites75 GREEN，独立同输入probe复验通过。SourceGraph目录EACCES不冒充删除；两召回通道共享source-line预算；索引后symlink越界不读取正文，均真实入口RED/GREEN。

独立SourceGraph复核追加：incoming import保留规则原误覆盖calls等符号边，目标符号删除后留下悬空引用。现仅无toSymbolId的文件级import走保留规则，其他边恢复原impacted规则；incoming-symbol-edge-red/green证明imports保留、旧calls删除，2 suites17 PASS。

最终门禁/外层消费追加修复：
- smoke原来只找声明文件中的文字，无法识别合法export*；改为TypeScript实际export symbol图，全部required/forbidden清单保留。真实去掉导出但仍保留同名文字的negative control会失败，dist原字节已恢复。
- 原有ASTChunker多行nullable callback被doctrine正则误报；等价内部type别名使null-slot可识别，未增加豁免。
- 非REQUIRED字段类型拒绝增加一条真实Stage3错误分支；同步matrix与其冻结计数为12，保留原golden corpus与全部阈值，不声称规则总数没变。
- 两外层旧生命周期调用使用plain JSON stats；Core保留原DTO读取兼容，真实SQLite委托adapter证明状态、统计和事件均写入。lifecycle-plain-stats-red/green记录回归，没有删除或弱化旧宿主测试。
