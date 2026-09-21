# Swift 语言基础全景：以四条方法派发线路为主干

这套文档介绍的是 **Swift 语言如何工作**，不是面试题库，也不是把 Swift
官方文档按章节换一种说法。

组织方法是先提出一个能贯穿语言的大问题：

> 源码中的一次成员调用，如何从“一个名字”变成“最终执行的那段实现”？

围绕这个问题，整套知识以四条方法派发线路为主干：

1. [直接 / 静态派发](03-method-dispatch/01-direct-dispatch.md)；
2. [Swift Class vtable 派发](03-method-dispatch/02-class-vtable-dispatch.md)；
3. [Protocol witness 派发](03-method-dispatch/03-protocol-witness-dispatch.md)；
4. [Objective-C 消息派发](03-method-dispatch/04-objective-c-message-dispatch.md)。

类型系统、函数、值语义、继承、协议、泛型、existential、ARC、模块边界和优化，
都不是孤立词条，而是附着在这四条线路不同阶段上的条件或结果。

总入口：

- [Swift 语言全景](00-language-panorama.md)
- [四条方法派发线路总图](03-method-dispatch/README.md)

## 1. 共同解释框架

四篇主干文档都使用同一张“实现剖面”：

```text
源码表达式
→ 名称查找
→ 重载与泛型约束求解
→ 确定被调用的声明
→ 选择派发线路
→ 准备 receiver / 参数 / 所有权
→ 通过符号、vtable、witness 或 selector 找到实现
→ 执行函数体
→ 处理返回值、错误、生命周期与并发隔离
→ 在允许的边界内被 inline、特化或去虚拟化
```

这条长链刻意把三个经常混在一起的问题分开：

- **编译期选声明**：同名候选中究竟选了哪个声明；
- **运行时选实现**：所选声明存在多态入口时，究竟执行哪个实现；
- **优化后长什么样**：编译器是否把间接调用消除了。

## 2. 四条主干挂载哪些 Swift 知识

| 主干 | 运行时变化点 | 附着其上的核心知识 |
| --- | --- | --- |
| 直接派发 | 没有可观察的运行时替换点 | 值类型、自由函数、重载、extension、`static`、`final`、闭包、泛型特化、所有权、inline |
| Class vtable | receiver 的动态 class 类型 | 引用身份、继承、override、`self` / `super`、初始化、ARC、属性访问器、resilience、去虚拟化 |
| Protocol witness | 具体类型对协议的 conformance | requirement、默认实现、泛型约束、associated type、`some`、`any`、existential、装箱、witness thunk |
| Objective-C message | receiver class 与 selector 的运行时组合 | `NSObject`、`@objc`、`dynamic`、selector、KVO、target-action、optional requirement、bridging、swizzling |

这些不是四个互斥的“类型分类”。例如：

- 一个 class 可以通过 witness 满足 Swift protocol requirement；
- 一个 Swift class 方法也可以暴露成 Objective-C selector；
- 原本具有虚派发语义的调用可能被优化器去虚拟化；
- 泛型函数本身可以直接调用，但它在函数体内调用的 requirement 仍属于 witness
  语义。

因此应先问“当前调用表达式走哪条线路”，而不是给整个类型永久贴上一个派发标签。

## 3. 独立基石与横切知识

四条派发线路是主干，但不是 Swift 的全部。下面这些方向会横穿四条线路：

| 基石 | 核心问题 | 与派发主干的关系 |
| --- | --- | --- |
| [类型、值与语义](01-types-values-and-semantics.md) | 一个值是什么，静态类型允许哪些操作 | 决定名称查找、重载候选和 receiver 形态 |
| [声明、函数与控制流](02-declarations-functions-and-control-flow.md) | 能力如何声明、求值和组合 | 形成可被调用的声明和参数传递过程 |
| [内存、生命周期与所有权](04-memory-lifetime-and-ownership.md) | 值何时复制、借用、保留与销毁 | 决定调用前后如何准备和清理数据 |
| [协议、泛型与多态](05-protocols-generics-and-polymorphism.md) | 如何表达抽象同时保留类型关系 | 是 witness 路线的静态模型，也是优化依据 |
| [同步、异步与并发](06-sync-async-concurrency/README.md) | 调用者是否等待，任务何时挂起，状态如何隔离 | 与四条派发正交；先选实现，再按同步或异步语义执行 |
| [错误、取消与资源](07-errors-cancellation-and-resources.md) | 非正常路径如何传播和清理 | 改变调用的退出线路，但不替代方法派发 |
| [集合、序列与文本](08-collections-sequences-and-text.md) | 标准库如何组织和遍历数据 | 综合运用泛型、COW、witness 与迭代控制流 |
| [Runtime、模块、ABI 与互操作](09-runtime-modules-abi-and-interop.md) | 语义怎样跨编译和二进制边界成立 | 解释 table、thunk、metadata、resilience 与桥接 |
| [属性包装、Builder 与 Macro](10-language-extension-mechanisms.md) | 语言表面如何安全扩展 | 最终仍展开或生成普通声明、访问器和调用 |
| [术语表与学习线路](11-glossary-and-learning-path.md) | 如何复习并校准相近概念 | 提供跨文档索引和阅读路径 |

## 4. 为什么同步 / 异步不并入四种派发

派发回答：

> 执行哪一个实现？

同步、异步和并发回答：

> 这个实现如何随时间推进，调用者是否等待，执行资源是否被占住，状态是否允许并发访问？

二者会组合，但不是同一个维度：

```swift
protocol Repository {
    func load() async throws -> Data
}
```

调用 `load()` 时：

1. 先通过 protocol conformance 找到 requirement 的实现；
2. 进入实现后，`async` 状态机才决定何处可能挂起与恢复；
3. Actor isolation、`Sendable`、取消和 executor 再约束跨隔离域执行。

详见 [同步、异步与并发总图](06-sync-async-concurrency/README.md)。

## 5. 推荐阅读线路

第一次建立底层全景：

```text
语言全景
→ 类型、声明与函数
→ 四条派发总图
→ 依次阅读四条派发线路
→ 内存与所有权
→ 协议、泛型与多态
→ 同步、异步与并发
→ Runtime、模块与 ABI
```

已经能写 Swift，希望解释“为什么”：

```text
四条派发总图
→ 选择一条实际代码线路
→ 沿该篇的“知识挂载图”补齐相关基石
→ 回到四路线横向对比
```

分析真实调用时，按下面七问检查：

1. receiver 的静态类型是什么？
2. 名称查找和重载解析选中了哪个声明？
3. 该声明是 class override point、protocol requirement，还是 Objective-C
   dynamic member？
4. 运行时选择实现需要什么输入：动态 class、conformance，还是 selector？
5. 参数和 receiver 在调用边界上是复制、借用、消费，还是引用保留？
6. 调用是否可能挂起、抛错、取消或跨 actor isolation？
7. 当前 module、resilience 和优化配置允许消除多少间接层？

## 6. 事实层级与版本边界

每篇文档明确区分：

- **语言语义**：Swift 对可观察行为作出的承诺；
- **常见实现**：当前 Swift 编译器、ABI 或 Runtime 常用的实现模型；
- **优化结果**：只在具体工具链、优化级别和模块边界下成立的结果。

例如“override 会保留动态类型语义”是语言层事实；“通过某个固定 vtable slot
调用”是很有用的实现模型；“最后被 inline 成零次间接调用”则是一次具体编译的
优化结果。

文档以 Swift 6 系列的稳定语义为主。strict concurrency、默认 actor
isolation、noncopyable types、typed throws、宏和 C++ 互操作等能力必须结合：

- 编译器版本；
- Swift language mode；
- module 的默认隔离设置；
- Apple SDK 与最低部署版本；
- library evolution 配置。

资料来源、核验日期与版本注意事项见 [资料与版本说明](references.md)。

## 7. 范围

包含 Swift 语言、标准库核心抽象、Swift Concurrency、必要的编译器 / ABI
模型，以及 Apple 平台常见的 Objective-C 互操作。

不展开 UIKit、SwiftUI、Combine、Core Data 等框架的完整用法，不讲 App
架构流派，也不组织算法题或面试问答。GCD、Foundation 和 Objective-C Runtime
在解释真实执行边界时会出现，但会清楚标注它们是平台或库能力，不等同于 Swift
语言本身。
