# 分层题库与答案锚点

> 题目按 [00-knowledge-system-map.md](00-knowledge-system-map.md) 节点组织。答案锚点用于评分，不是要求逐字背诵。

## 使用规则

每道题按五级深度继续：

```text
定义 → 机制 → 边界 → 设计 → 验证
```

- 初级：定义、常规实现；
- 中级：机制、失败边界；
- 高级：跨层设计和验证；
- 资深：业务目标、演进和组织取舍。

## A0. 计算机科学基础

| 节点 | 主问题 | 答案锚点 | 追问 |
| --- | --- | --- | --- |
| A0.1.2 | Hash Table 为什么平均 O(1)，何时退化？ | hash、bucket、冲突、load factor、扩容；极端冲突会退化 | Hashable 的相等合同是什么？ |
| A0.1.3 | 如何用 O(1) 查找与更新实现 LRU？ | Hash Map + Doubly Linked List；访问移头、淘汰尾 | 如何按内存 cost 而非数量淘汰？ |
| A0.1.4 | 模块依赖为何可以用图表示？ | 节点/边、有向依赖、环、拓扑排序 | 检测循环依赖用什么算法？ |
| A0.2.1 | 摊销 O(1) 是什么？ | 一系列操作总成本均摊；Array 扩容是例子 | 单次 append 是否一定 O(1)？ |
| A0.2.2 | 什么条件下可以二分？ | 有序或单调判定、明确边界不变量 | 如何找第一个满足条件的位置？ |
| A0.3.1 | Process、Thread、Task 有什么区别？ | 地址空间/资源、内核调度执行流、高层异步工作；Task 不绑定固定线程 | 上下文切换成本来自什么？ |
| A0.3.2 | Virtual Memory 如何影响 iOS 内存判断？ | page、映射、dirty、mmap、COW；footprint 不只是对象 | 大文件 mmap 是否完全不占内存？ |
| A0.3.3 | 死锁的四个必要条件是什么？ | 互斥、持有等待、不可抢占、循环等待 | 工程上优先破坏哪个条件？ |
| A0.4.4 | 为什么 timeout 不等于失败？ | 请求可能已执行但响应丢失；分布式部分失败 | 下单如何做到安全重试？ |
| A0.5.2 | 事务的 ACID 是什么？ | 原子、一致、隔离、持久；说明各自边界 | 本地对象+outbox 为什么同事务写？ |
| A0.5.3 | lost update 如何发生？ | 并发基于同一旧版本写入，后写覆盖前写 | 版本号/CAS 怎样修？ |
| A0.6.2 | 静态链接与动态链接如何取舍？ | 产物、装载、模块、分发、体积；需测量 | 模块多为何可能启动更慢？ |

## A. Apple 平台与系统

| 节点 | 主问题 | 答案锚点 | 追问 |
| --- | --- | --- | --- |
| A1.2 | 从用户点击图标到首屏可交互发生什么？ | 校验/装载、dyld、Runtime 初始化、main/@main、UIApplication/Scene、UI、首帧；区分首帧与可交互 | 怎样分段测量？`+load` 有何影响？ |
| A2.1 | App 进入后台后一定会发生什么？ | 生命周期通知、执行受限、保存/释放；不保证终止回调 | 被挂起前未保存会怎样？ |
| A2.2 | 多 Scene 下哪些状态不能放全局单例？ | 导航、窗口、临时输入等 Scene 级状态；共享服务与 UI 状态分离 | Deep Link 应进入哪个 Scene？ |
| A2.3 | 如何完成可靠后台下载？ | background URLSession、稳定 identifier、事件重连、文件持久化、权限/系统调度 | 与普通 background task 有何不同？ |
| A3.1 | Run Loop 是什么，Mode 有什么作用？ | Source/Timer/Observer、休眠唤醒；Mode 过滤本次处理集合；common modes 是集合标记 | Timer 滚动时不触发为什么？ |
| A3.2 | 触摸如何找到最终 View？ | UIWindow、hit-testing、`pointInside`、子视图遍历、响应链、手势状态机 | 超出父视图边界为何点不到？ |
| A4.2 | 一次 UI 状态变化怎样成为屏幕上的一帧？ | 状态→布局/显示→CA 事务提交→Render Server/GPU→显示 | Commit hitch 与 render hitch 如何区分？ |
| A4.3 | 什么是离屏渲染，是否一定要消除？ | 特定合成需要中间缓冲；成本依设备/内容；先测量 | 圆角、阴影如何优化且保持效果？ |
| A5.1 | Documents、Caches、tmp 怎么选？ | 用户数据、可重建缓存、临时文件；备份、清理、数据保护 | 账号退出如何清理？ |
| A5.5 | Push 到达时 App 可能处于哪些状态？ | 前台、后台、未运行；展示/数据回调不同；系统调度不保证任意执行 | 消息去重和点击路由怎么做？ |

## B2. Objective-C

| 节点 | 主问题 | 答案锚点 | 追问 |
| --- | --- | --- | --- |
| B2.1 | Objective-C 对象、类、元类是什么关系？ | 实例由类描述实例方法，类对象也是对象，元类描述类方法；继承链 | 类方法消息怎样查找？ |
| B2.1.3 | `objc_msgSend` 如何找到 IMP？ | selector、类/父类、缓存、方法信息；ABI 细节不作为稳定合同 | 为什么动态派发不一定很慢？ |
| B2.2.1/2 | 找不到 selector 后的完整链是什么？ | 动态解析→快速转发→method signature/Invocation→异常 | 三层各适合什么场景？ |
| B2.2.3 | Category、Extension、Associated Object 区别？ | 方法扩展、编译期私有声明、运行时关联；Category 不能直接加 ivar | 同名 Category 方法安全吗？ |
| B2.2.4 | Method Swizzling 有哪些风险？ | 全局影响、顺序、继承、递归、系统变化；受控安装/测试/回滚 | 如何保留原实现？ |
| B2.2.5 | `+load` 与 `+initialize` 区别？ | 装载期 vs 首次消息前懒触发；启动和重入风险 | 业务初始化为什么应显式？ |
| B2.3.1 | ARC 是垃圾回收吗？ | 编译器管理引用所有权，不扫描/回收环；引用环需设计 | ARC 在何处插入操作是稳定合同吗？ |
| B2.3.2 | `atomic` 是否线程安全？ | 单个访问器语义不等于复合状态安全 | `if (obj.value) obj.value++` 为什么仍不安全？ |
| B2.3.3 | 何时需要 `@autoreleasepool`？ | 大循环、自建线程、临时对象峰值；不能修复真实泄漏 | 如何用 Allocations 验证？ |
| B2.3.4 | Block 为什么会循环引用？ | owner 持有 Block，Block 捕获 owner；`__block` 不天然弱 | 任务必须完成时还该 weak self 吗？ |
| B2.4.1 | KVC 查找和风险是什么？ | 字符串 key 的间接访问、访问器/ivar 规则、类型安全弱 | undefined key/nil scalar 怎么处理？ |
| B2.4.2 | KVO 为什么会改变动态 Class？ | 经典自动 KVO 使用动态子类和 isa-swizzling | 为什么用 `class` 而不是直接 `isa`？ |
| B4 | 怎样让 Objective-C API 对 Swift 友好？ | nullability、lightweight generics、命名、错误、集合类型 | 未标 nullability 会怎样导入？ |

## B3. Swift

| 节点 | 主问题 | 答案锚点 | 追问 |
| --- | --- | --- | --- |
| B3.1.1 | Struct 和 Class 如何选？ | 值/身份/共享状态/生命周期/继承；不等同栈/堆 | Struct 一定更快吗？ |
| B3.1.3 | Optional、throws、Result 怎么选？ | 缺失、可恢复错误、作为值传递；保留失败语义 | 何时 `try?` 会掩盖问题？ |
| B3.2.1 | 闭包捕获列表解决什么？ | 明确强/弱/无主持有和值捕获；按任务 ownership 选 | weak-strong dance 的边界？ |
| B3.2.2 | Copy-on-Write 如何保持值语义？ | 共享存储、写前唯一性检查和复制；复制可能有成本 | 自定义 COW 如何避免泄漏可变引用？ |
| B3.2.3 | `inout` 表达什么？ | 一段对存储的独占读写访问，不保证简单传指针 | 哪些闭包捕获会造成重叠访问？ |
| B3.2.4 | borrowing/consuming/`~Copyable` 有何意义？ | 所有权转移、借用、非复制资源；版本敏感 | 何时不应使用？ |
| B3.3.1 | Protocol Extension 默认实现有什么坑？ | 协议 requirement 与 extension-only 方法派发不同 | existential 调用哪个实现？ |
| B3.3.2 | Associated Type 为什么影响协议作类型？ | 具体关联类型需被确定；使用 generic/existential/type erase | 何时用 enum 替代类型擦除？ |
| B3.3.3 | Generic 的性能一定比 existential 好吗？ | 可特化但看优化/代码体积/调用；需测量 | 泛型会如何影响二进制体积？ |
| B3.3.4/5 | `some P`、`any P`、`T: P` 区别？ | 实现方固定隐藏、运行时任意符合、调用方选择具体类型 | 异构数组选哪个？ |
| B3.4 | Swift 有哪些派发方式？ | static、vtable、witness、ObjC message、优化去虚化 | `dynamic` 的语义？ |
| B3.5.4 | Codable 在真实 API 中有哪些坑？ | schema、null/缺失、日期、精度、多态、错误、DTO 映射 | 如何兼容字段类型变化？ |
| B3.5.5 | Swift String 为什么不用 Int 下标？ | Unicode 扩展字形簇，可变宽度 | `count` 是否总是 O(1)？ |
| B3.5 | Macro/Wrapper/Builder 何时过度？ | 隐藏业务、调试/构建成本、工具链耦合 | 怎样建立可观察边界？ |

## C. 并发、异步与状态

| 节点 | 主问题 | 答案锚点 | 追问 |
| --- | --- | --- | --- |
| C1.1 | 并发、并行、异步、线程、队列、Task 的区别？ | 生命周期重叠、同时执行、调用返回、执行资源、调度抽象、异步工作 | `async` 一定开新线程吗？ |
| C1.3 | QoS 和优先级反转是什么？ | 用户意图优先级；高优任务等待低优资源 | 为什么不能全部设高优先级？ |
| C2.2 | 串行队列为什么也会死锁？ | 当前任务 sync 等待同队列后续任务，等待成环 | 跨两个队列如何形成环？ |
| C2.3 | Semaphore 适合什么，不适合什么？ | 限流/明确同步；阻塞线程、死锁、反转风险 | 如何用 async 方式限流？ |
| C3.2 | 数据竞争与逻辑竞态区别？ | 未同步内存读写 vs 结果依赖时序；后者可无数据竞争 | 举一个 Actor 内仍存在的竞态 |
| C3.4 | 搜索旧请求覆盖新结果怎么修？ | 取消 + generation/query 校验 + 单一状态提交 | 底层不能取消怎么办？ |
| C4.2 | `async let` 与 TaskGroup 区别？ | 固定少量子任务 vs 动态集合；结构化等待/错误/取消 | 子任务失败如何传播？ |
| C4.3 | `Task` 和 `Task.detached` 区别？ | 继承 Actor/priority/task-local vs 解耦 | detached 为什么不是后台线程 API？ |
| C4.4 | Task cancellation 是否立即停止？ | 协作式，检查/抛出/底层 API 响应 | 循环和 I/O 如何传播取消？ |
| C4.5 | Actor reentrancy 是什么？ | await 让出隔离域，其他任务可改变状态 | 如何防止余额/缓存状态过期？ |
| C4.6 | `@MainActor` 是否等于主线程？ | 主 Actor 隔离，通常与主执行器关联；关注隔离合同而非随意线程假设 | 非隔离重活怎么安排？ |
| C4.7 | `Sendable` 证明什么？ | 可安全跨隔离域；共享可变类需隔离/同步 | `@unchecked Sendable` 要证明什么？ |
| C4.8 | Continuation 最大风险是什么？ | 恰好 resume 一次、不能漏路径、取消桥接 | 底层回调可能多次怎么办？ |
| C5 | Combine 与 AsyncSequence 如何选？ | 多播/操作符/既有生态 vs 结构化迭代；生命周期和背压 | UI 订阅何时取消？ |

## D. UI 与体验

| 节点 | 主问题 | 答案锚点 | 追问 |
| --- | --- | --- | --- |
| D1.1 | `viewDidLoad` 和 `viewWillAppear` 各放什么？ | 一次性视图配置 vs 每次可见前同步；请求生命周期看业务 | 页面缓存后会怎样？ |
| D1.1 | 自定义 Container 要做哪些步骤？ | addChild、view、layout、didMove；移除反向 | 只加 view 有何问题？ |
| D1.3 | hugging 和 compression resistance 区别？ | 不愿拉大 vs 不愿压小；两个轴和优先级 | 多语言长文本如何验证？ |
| D1.4 | Cell 错图的根因与完整修复？ | 复用身份、取消、token/generation、缓存、主执行域 | 预取如何取消？ |
| D1.4 | Diffable Data Source 的 identity 有何要求？ | 稳定唯一，hash 不依赖频繁变化状态 | snapshot 并发提交怎么办？ |
| D2.1 | SwiftUI View 是什么？ | 界面描述值；identity/lifetime/state storage 由框架协调 | 为什么不能在 body 做副作用？ |
| D2.3/4 | State/Binding/Environment/Observable 如何选？ | 所有权、借用、环境依赖、可观察引用模型 | Observation 与 ObservableObject 如何迁移？ |
| D2.1 | SwiftUI 状态为何突然重置？ | 结构或显式 identity 变化、ownership 错层 | 随机 UUID 会怎样？ |
| D2.6 | UIKit/SwiftUI 渐进迁移怎样闭环？ | hosting/representable、状态边界、行为等价、性能/测试、回滚 | 先迁页面还是基础组件？ |
| D3.1 | 自定义控件怎样支持无障碍？ | label/value/trait/action/order、动态字体、真实辅助功能测试 | 只加 identifier 够吗？ |
| D3.2 | 时间和本地化常见坑？ | 时区、Locale、Calendar、复数、RTL、不可拼句子 | 服务端时间怎样存？ |
| D4.1 | 图片管线需要哪些层？ | 请求合并、encoded disk cache、decoded memory cache、downsample、取消 | 内存 warning 怎么处理？ |

## E. 数据、网络与安全

| 节点 | 主问题 | 答案锚点 | 追问 |
| --- | --- | --- | --- |
| E1.1 | 一次 HTTPS 请求经过哪些主要阶段？ | DNS、连接、TLS、HTTP、API/解码 | 如何区分哪层慢？ |
| E1.4 | 怎样设计重试？ | 错误分类、幂等、deadline、backoff+jitter、Retry-After、取消 | POST 如何安全重试？ |
| E2.1 | URLSession 的 Session/Task/Configuration/Delegate 关系？ | 共享配置和 delegate 的任务协调；生命周期 | Session 持有 delegate 有何影响？ |
| E2.2 | default、ephemeral、background 区别？ | 持久缓存/Cookie、隐私、系统后台传输 | background 是否适合普通 API？ |
| E2.3 | HTTP 缓存和业务缓存区别？ | 协议新鲜度/验证 vs 产品 source of truth/可用性 | ETag 如何工作？ |
| E2.4 | Token 同时过期如何避免刷新风暴？ | single-flight、等待同一结果、安全重放、失败原子退出 | 如何防止 401 循环？ |
| E3.2 | UserDefaults、Keychain、File 如何选？ | 偏好、敏感小数据、大对象；生命周期/备份/保护 | 删除 App 后语义？ |
| E3.3 | Core Data 的 Context 是什么边界？ | 工作区、变更跟踪和并发边界；object ID 跨 context | Batch update 后如何同步内存？ |
| E3.4 | Schema migration 需要什么？ | 版本、映射、备份/恢复、灰度、兼容测试 | 迁移中断怎么办？ |
| E4 | 离线写入如何设计？ | 本地事务+outbox、幂等 ID、同步状态机、冲突、墓碑 | 多设备冲突由谁决定？ |
| E5.2 | Token 为什么放 Keychain？ | 安全存储、accessibility、access group；仍不让客户端成为信任根 | 生物识别保护如何影响后台？ |
| E5.3 | Certificate Pinning 是否越多越安全？ | 增强特定信任约束，也增加轮换和可用性风险 | 如何做应急证书轮换？ |
| E5.6 | 第三方 SDK 隐私怎样治理？ | 最小采集、域名/数据清单、日志脱敏、权限、版本审查 | 怎样在 App 内验证实际网络行为？ |

## F. 质量、性能与诊断

| 节点 | 主问题 | 答案锚点 | 追问 |
| --- | --- | --- | --- |
| F1.1 | 单元、集成、UI 测试边界？ | 快速局部规则、组件接口、真实流程；按风险组合 | 哪些测试最容易 flaky？ |
| F1.3 | 异步测试如何避免 sleep？ | 可控 clock/scheduler、async expectation、stub、明确 timeout | 怎样测试乱序回调？ |
| F2.1 | 启动优化如何定义终点？ | 首帧/首屏/可交互分开；真实用户目标和分段指标 | 延后任务是否算优化？ |
| F2.2 | Hang 如何定位？ | Hangs/Time Profiler、主线程栈、锁/I/O/计算；同场景回归 | watchdog 与普通 hang 区别？ |
| F2.3 | 平均 FPS 高为何仍卡？ | 长尾 hitch、交互延迟、帧生命周期；平均掩盖异常 | 看哪些 Instruments 轨道？ |
| F2.4 | Memory Graph 看到对象是否等于泄漏？ | 先定义预期释放；查看强引用路径和业务生命周期 | abandoned memory 怎么找？ |
| F3.1/2 | 崩溃日志怎样调查？ | 正确 dSYM、symbolication、triggered thread、上下文、复现和聚类 | 栈顶是否一定根因？ |
| F3.3 | Jetsam 与普通 crash 区别？ | 系统内存压力终止，未必有普通 crash stack；看 jetsam 报告和峰值 | 如何构造回归？ |
| F4.3 | ASan/TSan/Main Thread Checker 分别做什么？ | 内存访问、数据竞争、主线程 API；各有覆盖和平台限制 | 工具无报告能否证明安全？ |
| F5 | 怎样设计移动端可观测性？ | 结构化日志、trace、signpost、分位、cohort、隐私、采样 | 如何连接用户动作和网络请求？ |

## G. 架构与工程

| 节点 | 主问题 | 答案锚点 | 追问 |
| --- | --- | --- | --- |
| G1 | 好架构的判断标准是什么？ | 变化可定位、依赖清晰、状态所有权、可测试/观测/演进 | 如何识别过度设计？ |
| G2 | Domain 层是否每个 App 都需要？ | 取决于业务规则复杂度和变化；简单 CRUD 不造空层 | 规则放 ViewModel 有何风险？ |
| G2.5 | 依赖注入有哪些方式？ | initializer/method/property/environment；显式性和生命周期 | 协议是否越多越好？ |
| G3 | MVC、MVVM、Redux、Clean 如何选？ | 根据状态、变化、团队、测试和复杂度；模式可组合 | ViewModel 变巨型怎么办？ |
| G4.1 | 模块按 Feature 还是 Layer 切？ | 业务变化/ownership 与共享能力；常组合 | 怎样防止底层模块反向依赖业务？ |
| G4.2 | 模块 public API 应包含什么合同？ | 类型、错误、线程、生命周期、版本、资源、指标 | SPI 如何治理？ |
| G4.3 | 如何消除循环依赖？ | 提取合同、依赖反转、事件、composition root、重划 ownership | Service locator 是修复吗？ |
| G5.1 | OC→Swift 怎样渐进迁移？ | 先改善互操作合同、垂直切片、行为等价、测试、最后删除 | 同时重写架构有何风险？ |
| G5.2 | UIKit→SwiftUI 的完成标准？ | 用户行为、性能、可访问性、埋点和测试等价；旧入口切换 | 如何保留回滚？ |
| G5.3 | Swift 6 并发迁移如何避免大量 unchecked？ | 明确隔离域、修正 ownership、桥接叶子、逐模块严格检查 | 第三方非 Sendable 类型怎么办？ |
| G6.2 | 发布为什么需要 feature flag？ | 分离部署/启用、灰度、快速关闭；也需生命周期和清理 | Flag 永久存在有何问题？ |

## H. 系统设计与综合题

| 节点 | 题目 | 必须覆盖 |
| --- | --- | --- |
| H1/H2.1 | 设计一个百万内容规模的图片 Feed 客户端 | 分页/去重、图片管线、缓存、复用取消、弱网、指标、内存 |
| H1/H2.2 | 设计即时通信客户端 | WebSocket/HTTP 补偿、本地 DB、outbox、幂等、顺序、重连、推送 |
| H1/H2.3 | 设计视频播放页 | 状态机、缓冲、首帧、seek、后台/中断、DRM、指标 |
| H1/H2.4 | 设计购物车和下单前端 | 本地乐观状态、价格/库存服务端权威、幂等、防重复提交、恢复 |
| H1/H2.5 | 设计持续记录轨迹的运动 App | 权限、后台定位、能耗、批量上传、断网、隐私、数据精度 |
| H1/H2.6 | 设计离线优先笔记 | 本地权威、outbox、冲突、墓碑、附件、迁移、多账号 |
| H1/H2.7 | 设计支持多窗口和多账号的 iPad App | Scene ownership、共享服务、账号隔离、路由、状态恢复 |
| H1/H2.8 | 设计带流式输出和工具调用的 AI Agent 客户端 | 会话状态、流取消、tool 权限、注入防护、敏感上下文、观测 |
| G5/H1 | 把大型 OC UIKit App 迁移到 Swift/SwiftUI | 边界、阶段、兼容、指标、灰度、回滚、旧代码删除证明 |
| F/H1 | 线上新版本卡顿率翻倍但 crash 不变，如何处置 | cohort、回滚/flag、Hangs/Hitches、主链证据、修复与回归 |

## 行为与项目深挖

| 主题 | 问题 | 证据 |
| --- | --- | --- |
| 性能 | 最有价值的一次性能优化？ | 基线、工具、根因、修复、数字、回归 |
| 事故 | 一次你负责的线上事故？ | 影响、止损、诊断、修复、预防 |
| 迁移 | 一次跨版本或跨架构迁移？ | 分段、兼容、消费者、灰度、删除旧路径 |
| 决策 | 一次你反对主流方案的经历？ | 事实、取舍、沟通、结果、反思 |
| 失败 | 一个没有达到目标的项目？ | 自己的错误、早期信号、修正 |
| 影响力 | 如何提高团队工程质量？ | 机制、采用率、指标、长期维护 |

## 评分记录

```markdown
## Question
- Node:
- Prompt:

## Candidate Evidence
- Conclusion:
- Mechanism:
- Boundary:
- Design:
- Verification:

## Score
- Accuracy: /4
- Mechanism: /4
- Boundary: /4
- Design: /4
- Verification: /4
- Communication: /4

## Next Probe
- ...
```
