# Discoverer/Enhancement/第三方配置(easybox 等)链路验通审计 — 2026-07-10

## 目标

确认模块化发现(DiscovererRegistry)、已知模式(Enhancement 包)、第三方配置系统
(easybox/tuist/ks-component/mt-component/melos/gradle-convention 等)的注册→消费→
生效全链真实接通;修实证断点,登记孤儿。

## 链路一:Discoverer(含 easybox 第三方配置)——✅ 全通

- 默认注册集(discovery/index.ts getDiscovererRegistry):Spm/Node/Python/Jvm/Go/
  Dart/Rust/**CustomConfig**/Generic 九个,生产调用方=repo.ts:532
  collectDiscoveryFacts(analyzeConflict→detect→load→targets)。
- CustomConfigDiscoverer 支持的三方配置系:easybox(Boxfile+*.boxspec,ruby-dsl)、
  tuist、ks-component(快手)、mt-component(美团)、melos、gradle-convention、
  flutter-add-to-app、react-native-hybrid 等,RubyDslParser 解析 layer/box/host_app。
- **fixture 实证**(Boxfile 两层三模块+boxspec+ObjC 源):conflict 推荐 customConfig
  无歧义;targets=FeedModule/NetKit(本地模块,path 正确);repo 全链输出同 targets;
  module 探针 ownedFiles 含 .h/.m(与上轮 parserLanguage 修复交叉验证)。
- **BiliDili 真机**:SPM 无歧义胜出(不被 customConfig 误抢),23 targets(全部
  AOX* 包+App 模块)。

## 链路二:Enhancement(14 框架包)——❌ 消费两端偏离设计,已修

事实链:
- 14 包(react/nextjs/vue/node-server/django/fastapi/ml/langchain/spring/android/
  go-web/go-grpc/rust-web/rust-tokio)**全部**带 conditions.frameworks。
- 双宿主都正确灌注(initFrameworkEnhancements:主体 ServiceContainer:141/Plugin :246)。
- 但 `detectedFrameworks` 全仓**零生产来源** → Plugin MCP guard 的
  frameworkAgnostic 路径**恒空集**(其注释声称的"Bootstrap Phase 4 精确 resolve"
  经全仓扫描证实从未存在);主体 HTTP 路径无条件注入全部 54 条(评估期语言门只按
  语言过滤不看框架,纯 TS 无 React 项目照样装载 react 规则)。

修复(Core 623fa8c + Plugin 239c261 + 主体 ea02d9c):
- `core/enhancement/detectFrameworks.ts`:依赖清单(package.json/pyproject/
  requirements/go.mod/Cargo.toml/gradle/pom)→{languages,frameworks},词表与包
  conditions 对齐;只读、逐清单容错、256KB 封顶、确定性输出。
- guard 门面新增 `resolveEnhancementGuardRulesForProject(projectRoot)`:幂等自灌注+
  逐语言 resolve 并集,返回 {rules,packIds,detection};失败降级空集。
- 双宿主同一入口双端对称,注入结果打 info 日志。

真机证据:BiliDili(Swift)→packs=[] rules=0(无 Swift 包,正确空);React fixture→
packs=[react] rules=7;easybox fixture(ObjC)→packs=[](正确)。

## 登记不盲改(孤儿/缺口,需独立决策)

- **ConfigWatcher 零消费方**(discovery/ConfigWatcher.ts,含 easybox/tuist/xcodegen
  配置文件监听):疑 daemon 时代遗产,tick-on-access 架构下是否还需要属产品决策。
- **EnhancementPack.getExtraDimensions() 零消费方**:包的 Bootstrap 维度贡献
  (tierHint/knowledgeTypes/skillWorthy)从未接入 TierScheduler——接入会改冷启动
  维度集,需用户决策。
- repo 上下文对 customConfig 项目 buildSystems=[](targets 正常,构建系统摘要
  未覆盖三方配置系,显示面小缺口)。
- 无 Swift/iOS Enhancement 包(BiliDili 得空集是正确行为,但 iOS 生态的已知模式
  增强是空白,属产品路线图项)。

## 验证与提交

- Core:`npm run check` exit 0(170 files/1616 tests,含新增 DetectFrameworks 12 测),
  零警告;boundary OK 66 exports(detectProjectFrameworks 走 ./enhancement 门面,
  无收缩预算约束,已核)。
- Plugin:`build:check` exit 0 + test/unit 156 files/1735 tests;dist 已重建。
- 主体:`build:check` exit 0(Node 22)+ Guard 四测试文件 103 tests;dist 已重建。
- 提交:Core 623fa8c,Plugin 239c261,主体 ea02d9c(均未 push,推送归用户门)。

## 追加(同日晚):模块依赖图接线(用户问"easybox 项目还能分析模块依赖关系么")

深挖发现第三个消费断层:各 Discoverer 的 `getDependencyGraph()`(SPM target deps/
easybox boxspec `s.dependency`/Boxfile 层级/宿主 contains)一直有真实现,但主体图
API(Dashboard `/api/v1/modules`、WikiGenerator)的 edges **硬编码 []**
(ProjectContextConsumerFacts.ts),挖掘管线 `depGraphData` 类型即 `null`
(AiDimensionPreparation.ts)——解析能力从诞生起没到过任何用户可见面。

接线(Core 9ad18bc + 主体 5b829aa):
- domain 新增 RepoDependencyGraph{Node,Edge,Summary},RepoContext 增量字段
  dependencyGraph;repo.ts 读取选中 Discoverer 的图(归一化+800/3000 防御上限+
  失败降级 retryable)。
- 主体 projectContextDependencyGraph 消费真边+补声明图独有节点,
  dependencySummary 增 declaredEdgeCount/declaredEdgeSource;图缺席回落空边。

真机:easybox fixture nodes=6/edges=3(FeedModule→NetKit depends_on+DemoApp
contains);BiliDili nodes=35/edges=52(RxSwift/Kingfisher 外部+AOX* 内部)。
验证:Core check exit 0(1617 tests);主体 build:check+20 guard/facts/wiki tests 绿。
登记不盲改:挖掘管线 depGraphData 接入(AI 管线行为变更)与 CodeEntityGraph 的
spm 图消费(source_graph 族孤儿)需独立决策。
