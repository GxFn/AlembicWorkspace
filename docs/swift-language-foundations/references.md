# 资料、研究方法与版本边界

## 1. 这套文档怎样使用资料

资料用于确认语言合同、实现模型和版本边界，不用于决定文档目录。本文档的组织单位
不是官方手册章节，而是：

```text
一个真实问题
→ 多份一级资料交叉确认
→ 区分语言语义、常见实现与优化结果
→ 沿执行线路重新组织
→ 用边界案例检验心智模型
```

例如“Protocol witness 派发”同时需要协议、泛型、existential、ABI resilience 和
优化资料，不能从官方《Protocols》一章直接复制得到完整模型。

## 2. 版本基线

复核日期：**2026-07-26**。

- 稳定语言基线采用 **Swift 6.3**。官方
  [Version Compatibility](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/compatibility/)
  说明 Swift Book 的稳定内容描述 Swift 6.3；官方
  [Swift 6.3 Released](https://www.swift.org/blog/swift-6.3-released/)
  记录了 2026-03-24 的发布。
- 在线 Swift Book 的部分入口已经显示
  [Swift 6.4 beta](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/)。
  因而仅在 beta 页面出现的内容不能无标注地当作稳定项目基线。
- “编译器版本”和“Swift language mode”不是同一个维度。项目还可能受 upcoming
  feature、module 默认 actor isolation、SDK 版本和最低部署版本影响。

这套文档优先陈述跨 Swift 6.x 稳定的语义。版本敏感能力会要求读者回到项目构建配置
复核，不以“最新编译器通常如此”替代语言合同。

## 3. 四条方法派发主干

### 3.1 语言声明与行为

- [Declarations](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/declarations/)：
  declaration modifier、`dynamic`、`final`、函数与 `inout` 的语言规则。尤其用于确认：
  `dynamic` member 的访问通过 Objective-C Runtime 派发，并且该访问不能被 inline
  或 devirtualize。
- [Methods](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/methods/)：
  instance/type method、`self`、mutating method 和 type member。
- [Inheritance](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/inheritance/)：
  override、`super`、属性和 subscript override、`final`。
- [Protocols](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/protocols/)：
  requirement、conformance、protocol extension、class-only protocol。
- [Extensions](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/extensions/)：
  extension 可以增加什么，不能 override 什么。

### 3.2 Swift 编译与 ABI 实现资料

- [Library Evolution in Swift](https://www.swift.org/blog/library-evolution/)：
  resilience boundary、class dispatch thunk、protocol witness table、witness dispatch
  thunk，以及为什么跨模块不能硬编码所有布局。
- [Compiling Swift Generics](https://download.swift.org/docs/assets/generics.pdf)：
  type metadata、value witness、protocol witness、共享泛型实现和 specialization 的
  编译模型。
- [Whole-Module Optimization](https://www.swift.org/blog/whole-module-optimizations/)：
  函数体可见性怎样影响 inline、generic specialization、dead code elimination 和
  ARC 优化。
- [Swift Intermediate Language](https://github.com/swiftlang/swift/tree/main/docs/SIL)：
  SIL 的函数、方法引用、所有权和中间表示语义。SIL 输出只证明具体工具链与参数下的
  编译结果，不是永久源码合同。
- [Swift ABI Stability Manifesto](https://github.com/swiftlang/swift/blob/main/docs/ABIStabilityManifesto.md)：
  API、ABI、metadata、vtable、witness table 与 binary evolution 的设计背景。

`vtable slot`、`witness table entry` 和 `dispatch thunk` 在这套文档中属于
**常见实现 / ABI 模型**；override 与 protocol conformance 的可观察行为才是
**语言语义**。Embedded Swift 的 ABI 资料不直接外推为完整 Swift Runtime 的永久
布局。

### 3.3 Objective-C 消息与互操作

- [Using Objective-C Runtime Features in Swift](https://developer.apple.com/documentation/swift/using-objective-c-runtime-features-in-swift)：
  Swift 如何使用 selector、动态 Runtime 能力和 Objective-C 表示。
- [`objc_msgSend`](https://developer.apple.com/documentation/objectivec/objc_msgsend)：
  receiver 与 selector 怎样进入 Objective-C 消息发送入口。
- [`objc_cache`](https://developer.apple.com/documentation/objectivec/objc_cache)：
  Runtime 对常用 selector → implementation 查找的缓存模型。
- [Objective-C Runtime Programming Guide: Messaging](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtHowMessagingWorks.html)：
  消息查找、继承链、动态方法解析与转发的概念模型。
- [Importing Objective-C into Swift](https://developer.apple.com/documentation/swift/importing-objective-c-into-swift)：
  Objective-C API 如何映射成 Swift 声明。
- [Importing Swift into Objective-C](https://developer.apple.com/documentation/swift/importing-swift-into-objective-c)：
  Swift 声明的 Objective-C 可表示边界。

“Objective-C Runtime 常见实现先查 method cache”不应简化成固定的每次线性查表
成本，也不应据此给四条线路作脱离实测的性能排名。

## 4. 类型、泛型与 existential

- [Types](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/types/)：
  named/compound type、function type、metatype、`any` existential。
- [Generics](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/generics/)：
  generic parameter、constraint、associated type 和 where clause。
- [Opaque and Boxed Protocol Types](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/opaquetypes/)：
  `some P` 与 boxed existential 的语义差异。
- [SE-0335: Existential `any`](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0335-existential-any.md)
- [SE-0352: Implicitly Opened Existentials](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0352-implicit-open-existentials.md)
- [SE-0353: Constrained Existential Types](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0353-constrained-existential-types.md)

使用这些资料时保持四个结论：

1. `T: P` 保留调用者选择的具体类型关系；
2. 返回位置的 `some P` 由实现者选择一个固定但隐藏的 concrete type；
3. `any P` 是可以容纳不同 conformer 的 existential；
4. 特化、inline buffer、box 和去虚拟化是具体表示或优化结果，不能从语法一眼断言。

## 5. 内存、生命周期与所有权

- [Automatic Reference Counting](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/automaticreferencecounting/)
- [Memory Safety](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/memorysafety/)
- [SE-0377: `borrowing` and `consuming` Parameters](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0377-parameter-ownership-modifiers.md)
- [SE-0366: `consume` Operator](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0366-move-function.md)
- [SE-0390: Noncopyable Structs and Enums](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0390-noncopyable-structs-and-enums.md)
- [SE-0430: `sending` Parameters and Results](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0430-transferring-parameters-and-results.md)

ARC、copy-on-write、ownership modifier、`Copyable` / `~Copyable`、`Sendable` /
`sending` 是相关但不同的系统。它们分别回答引用生命周期、值存储优化、所有权转移、
复制能力和跨隔离域安全；文档不会用“struct 在栈、class 在堆”把这些问题合并。

## 6. 同步、异步与并发

- [Concurrency](https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html)：
  async/await、Task、Task Group、Actor、`Sendable` 和 cancellation 的语言入口。
- [Swift 6 Concurrency Migration Guide — Data-Race Safety](https://www.swift.org/migration/documentation/swift-6-concurrency-migration-guide/dataracesafety/)：
  strict concurrency 与 isolation 迁移模型。
- [SE-0306: Actors](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0306-actors.md)
- [SE-0304: Structured Concurrency](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0304-structured-concurrency.md)
- [SE-0316: Global Actors](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0316-global-actors.md)
- [SE-0461: `nonisolated async` execution](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0461-async-function-isolation.md)
- [SE-0466: Default Actor Isolation](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0466-control-default-actor-isolation.md)
- [Apple Dispatch](https://developer.apple.com/documentation/dispatch)：
  GCD 是平台调度库，不能与 Swift async function 直接画等号。
- [Apple Synchronization](https://developer.apple.com/documentation/synchronization)：
  锁与原子等同步原语属于共享状态协调工具。

并发资料按四条独立轴整理：

```text
sync / async          调用与结果的时间关系
blocking / suspending 执行资源是否被占住等待
serial / concurrent   工作能否重叠推进
parallel              是否在同一时刻真实执行
```

Actor 提供数据隔离，不等于普通串行队列；跨 `await` 的 actor-isolated function
可能可重入；Task cancellation 是协作式。

## 7. 错误、标准库与语言扩展

- [Error Handling](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/errorhandling/)
- [Collection Types](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/collectiontypes/)
- [Strings and Characters](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/stringsandcharacters/)
- [Properties](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/properties/)
- [Macros](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/macros/)
- [SE-0382: Expression Macros](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0382-expression-macros.md)
- [SE-0389: Attached Macros](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0389-attached-macros.md)

Macro 被当作编译期受检查的语法变换；property wrapper 和 result builder 被还原为
生成的存储、访问器、声明或普通调用。它们不会绕开类型系统，也不会形成第五种方法
派发。

## 8. 资料解释纪律

遇到下列表述时，应回到源码上下文和工具链验证：

- “所有 class 方法都走 vtable”；
- “`@objc` 就一定调用 `objc_msgSend`”；
- “protocol 调用一定 box / 堆分配”；
- “泛型一定静态派发并且一定更快”；
- “struct 不涉及 ARC”；
- “async 自动在后台线程运行”；
- “Actor 就是一条严格 FIFO 的串行队列”；
- “SIL 里出现某条指令就是语言的永久保证”。

正确的复核顺序是：

```text
语言规则
→ 调用点静态上下文
→ module / resilience / isolation 配置
→ 当前编译器中间表示
→ 目标平台实测
```
