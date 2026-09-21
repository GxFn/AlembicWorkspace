# Swift 方法派发完全指南

- **Original title**: Method Dispatch in Swift: The Complete Guide
- **原文链接**: [Jacob’s Tech Tavern](https://blog.jacobstechtavern.com/p/swift-method-dispatch)
- **作者/机构**: Jacob Bartlett / Jacob’s Tech Tavern
- **年份**: 2025
- **材料类型**: 工程技术分析文章
- **文档性质**: 忠实中文精读，不是原文全文翻译

## 文章要解决的问题

Swift 的方法调用究竟如何落到具体实现？文章用一张地图串起直接调用、表派发、Objective-C 消息派发与内联，并纠正常见口诀：`struct` 不等于“永远静态派发”，类也不等于“每次都查虚函数表”；`final`、`private` 可能提供优化信息，却不应在没有测量时被当成性能处方。

## 原文论证主线

作者先问调用目标能否在编译阶段确定。目标已知时可以直接调用；需要保留运行时多态时，类通常通过虚函数表选择覆写实现，抽象的协议调用则可借助一致性的见证信息寻找 requirement 实现。Objective-C 绑定得更晚：运行时按接收者与 selector 查找方法，并缓存结果。文章还观察 SIL 中的内联：优化器可能把函数体带到调用点并继续折叠计算，让原调用消失。去虚化与跨模块示例最终说明，关键不是背类型分类表，而是判断编译器此刻能证明什么。

## 关键机制与结论

直接调用路径短，也更容易继续内联；表派发支持子类覆写或协议多态，但间接选择可能限制后续优化。Objective-C 消息机制支持 swizzling、转发等动态能力，语义不同于 Swift 表派发。实际热点中，间接跳转未必最贵，更大的影响常是阻碍内联、常量传播和预计算。若具体类型、实际覆写或协议一致性在优化点可知，编译器就可能特化或去虚化。因此应先保留正确抽象，再用发布构建、SIL/汇编和性能工具验证。

## 准确性与版本边界

这是现代工程综述，不是 Swift 语言规范。文章把“内联”并列为派发类型便于教学；更严谨地说，它是可消除调用成本的优化结果。类型分类也只是基线模型：值可能被装箱，类调用可能被直接化；协议 requirement 在抽象处常由见证信息支持，但具体类型已知、泛型已特化或调用被内联时，不保证发生真实的 witness-table 跳转。结果还受优化级别、Whole-Module Optimization、库韧性、动态替换和 Objective-C 互操作影响。

## 在知识体系中的位置

这篇文章适合作为派发总览：它覆盖的机制比单讲协议扩展更完整，也把旧经验放回现代优化器中检验。可用 WWDC16《Understanding Swift Performance》补足成本模型，用 WWDC24《Explore Swift performance》理解现代取舍，再以《Library Evolution in Swift》解释跨模块限制。
