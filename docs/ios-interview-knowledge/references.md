# 官方资料与版本基线

检查日期：**2026-07-26**

本知识库优先使用 Apple Developer Documentation、Swift.org 和 Apple 的历史文档归档。历史 Objective-C 文档用于解释仍然存在的语言/Runtime 机制，不代表其中所有旧式 API 都是当前推荐方案。

## 1. Swift 语言

| 主题 | 官方资料 | 用途 |
| --- | --- | --- |
| 版本基线 | [The Swift Programming Language — Revision History](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/revisionhistory/) | 官方修订历史显示 2026-03-23 更新至 Swift 6.3 |
| 基础与类型安全 | [The Basics](https://docs.swift.org/swift-book/LanguageGuide/TheBasics.html) | 类型安全、初始化、错误和基本语义 |
| ARC | [Automatic Reference Counting](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/automaticreferencecounting/) | 类实例生命周期、weak/unowned、闭包引用环 |
| 内存安全 | [Memory Safety](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/memorysafety/) | 独占访问和冲突访问 |
| 协议 | [Protocols](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/protocols/) | 协议、existential、delegation |
| 泛型 | [Generics](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/generics/) | 泛型、约束、associated type、Copyable |
| 并发 | [Concurrency](https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html) | async/await、Task、Actor、Sendable、数据竞争 |
| MainActor | [MainActor](https://developer.apple.com/documentation/Swift/MainActor) | 主全局 Actor 的公开合同 |

## 2. iOS 平台与生命周期

| 主题 | 官方资料 | 用途 |
| --- | --- | --- |
| App/Scene 生命周期 | [Managing your app’s life cycle](https://developer.apple.com/documentation/uikit/managing-your-app-s-life-cycle) | 前后台、Scene、资源响应 |
| Scene 配置 | [Specifying the scenes your app supports](https://developer.apple.com/documentation/UIKit/specifying-the-scenes-your-app-supports) | 多 Scene 和窗口声明 |
| Run Loop | [CFRunLoop](https://developer.apple.com/documentation/corefoundation/cfrunloop) | Source、Timer、Observer、Mode、每线程 Run Loop |
| Dispatch | [Dispatch](https://developer.apple.com/documentation/dispatch) | GCD 任务调度能力 |
| DispatchQueue | [DispatchQueue](https://developer.apple.com/documentation/dispatch/dispatchqueue) | serial/concurrent、sync/async、主队列死锁警告 |
| UIKit View | [Views and controls](https://developer.apple.com/documentation/uikit/views-and-controls) | View 层级、事件、绘制和动画 |
| UIKit Drawing | [Drawing](https://developer.apple.com/documentation/uikit/drawing) | UI update 与图形 API |

## 3. Objective-C 与互操作

| 主题 | 官方资料 | 用途 |
| --- | --- | --- |
| Objective-C 全览 | [Programming with Objective-C](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ProgrammingWithObjectiveC/) | 对象、属性、Block、ARC、Runtime 入口 |
| OC 内存管理 | [Advanced Memory Management Programming Guide](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/MemoryMgmt/Articles/MemoryMgmt.html) | 所有权规则、Autorelease Pool、弱引用 |
| KVC | [Key-Value Coding Programming Guide](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/KeyValueCoding/index.html) | 间接属性访问、查找和合规 |
| KVO | [Key-Value Observing Programming Guide](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/KeyValueObserving/KeyValueObserving.html) | 注册、通知和生命周期 |
| KVO 实现 | [KVO Implementation Details](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/KeyValueObserving/Articles/KVOImplementation.html) | isa-swizzling 的官方说明 |
| Nullability | [Designating Nullability in Objective-C APIs](https://developer.apple.com/documentation/swift/designating-nullability-in-objective-c-apis) | OC 声明如何导入 Swift Optional |
| Lightweight Generics | [Using Imported Lightweight Generics in Swift](https://developer.apple.com/documentation/swift/using-imported-lightweight-generics-in-swift) | OC 容器元素类型导入 Swift |

## 4. SwiftUI

| 主题 | 官方资料 | 用途 |
| --- | --- | --- |
| 数据与状态 | [Model data](https://developer.apple.com/documentation/swiftui/model-data) | State、Binding、Environment、Observation |
| Observation 实践 | [Managing model data in your app](https://developer.apple.com/documentation/SwiftUI/Managing-model-data-in-your-app) | `@Observable` 与 SwiftUI 数据模型 |
| 性能 | [Understanding and improving SwiftUI performance](https://developer.apple.com/documentation/Xcode/understanding-and-improving-swiftui-performance) | View 更新、依赖和 hitch |

版本提示：Observation 与 `@Observable` 在 Apple 平台上的可用版本需要结合 Deployment Target 检查；不要只按当前 Xcode 编译通过判断所有用户设备可用。

## 5. 网络、数据与安全

| 主题 | 官方资料 | 用途 |
| --- | --- | --- |
| URL Loading System | [URL Loading System](https://developer.apple.com/documentation/foundation/url-loading-system) | Session、Task、异步加载、缓存和认证 |
| URLSession | [URLSession](https://developer.apple.com/documentation/foundation/urlsession) | 配置类型、任务类型、delegate、后台传输、ATS |
| URLCache | [Accessing cached data](https://developer.apple.com/documentation/foundation/accessing-cached-data) | 请求 cache policy 和缓存控制 |
| Apple 平台安全 | [Security Overview](https://developer.apple.com/security/) | ATS、Keychain、App Attest、隐私与平台安全入口 |
| Secure Transport 迁移提示 | [Secure Transport](https://developer.apple.com/documentation/Security/secure-transport) | 官方将其标为 legacy，并建议使用 Network framework |

安全方案必须同时复核当前 App Store、隐私、加密和组织合规要求；面试答案不能把客户端当成最终信任根。

## 6. 性能、调试与测试

| 主题 | 官方资料 | 用途 |
| --- | --- | --- |
| 响应性 | [Improving app responsiveness](https://developer.apple.com/documentation/xcode/improving-app-responsiveness) | Hangs、Hitches、帧和主线程诊断 |
| SwiftUI 性能 | [Understanding and improving SwiftUI performance](https://developer.apple.com/documentation/Xcode/understanding-and-improving-swiftui-performance) | SwiftUI 更新频率和长耗时 |
| 内存 | [Gathering information about memory use](https://developer.apple.com/documentation/Xcode/gathering-information-about-memory-use) | Memory Report、Allocations、Memory Graph |
| Sanitizer | [Diagnosing memory, thread, and crash issues early](https://developer.apple.com/documentation/xcode/diagnosing-memory-thread-and-crash-issues-early) | ASan、TSan、UBSan、Main Thread Checker |
| 性能预警 | [Diagnosing performance issues early](https://developer.apple.com/documentation/xcode/diagnosing-performance-issues-early) | Thread Performance Checker、优先级反转 |
| Crash/设备日志 | [Diagnosing issues using crash reports and device logs](https://developer.apple.com/documentation/xcode/diagnosing-issues-using-crash-reports-and-device-logs) | crash、jetsam、设备日志、符号 |
| 内存访问崩溃 | [Investigating memory access crashes](https://developer.apple.com/documentation/xcode/investigating-memory-access-crashes) | EXC_BAD_ACCESS、sanitizer、malloc 工具 |
| XCTest 性能 | [Writing and running performance tests](https://developer.apple.com/documentation/xcode/writing-and-running-performance-tests) | 性能测试和 baseline |
| XCTest Metrics | [Performance Tests](https://developer.apple.com/documentation/xctest/performance-tests) | CPU、内存、hitch、launch、storage 指标 |

## 7. 事实使用规则

### 稳定事实

可以直接用于面试主回答，但仍要说明边界：

- ARC 是所有权管理，不是垃圾回收；
- Run Loop 处理 Source/Timer/Observer 并在无事时等待；
- `async` 不等于创建新线程；
- Swift Actor 不能自动消除跨 `await` 的业务竞态；
- 客户端不能成为权限和交易的最终信任根。

### 版本敏感事实

回答时附带版本条件：

- Swift 严格并发诊断；
- Observation；
- SwiftUI 导航和布局能力；
- Macro / Ownership / noncopyable 能力；
- 系统后台任务和平台隐私要求；
- 新 Xcode/Instruments 模板。

### 实现细节

仅用于解释，不作为稳定 API：

- Objective-C Runtime 内部缓存布局；
- Swift 编译器最终是否特化/内联；
- Swift 值最终位于栈还是堆；
- SwiftUI 内部差异算法；
- 系统私有线程、进程和渲染实现。

面试中最稳妥的表达是：

> 公开合同保证的是 X；当前实现通常可观察到 Y，但我不会让业务正确性依赖 Y。若性能依赖该行为，我会在目标工具链和设备上测量。

