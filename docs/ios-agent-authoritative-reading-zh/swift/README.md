# Swift 权威材料中文精读

本目录收录 21 份 Swift 权威来源的中文阅读稿，包含两种文档类型：

- **完整中文译文**：[03 Swift 中的库演进](03-library-evolution.md)、
  [13 Swift 的全模块优化](13-whole-module-optimization.md)、
  [15 Swift 所有权宣言](15-ownership-manifesto.md)、
  [21 Swift 6.2 发布](21-swift-6-2-released.md)。
- **中文精读摘要**：其余 17 份文档，保留原文的问题意识、论证主线、关键机制、结论与
  版本边界，但不逐段全文翻译。其中 [10 编译 Swift 泛型](10-compiling-swift-generics.md)
  的来源是 684 页未完稿书籍，仍按精读摘要处理，不把整本书冒充为一篇全文译文。

两类文档都不替代原文。阅读时始终区分三层：

1. **语言语义**：源码必须表现出的行为。
2. **常见实现**：当前编译器或运行时通常怎样实现。
3. **优化结果**：在特定工具链、可见性和优化配置下可能得到的机器码。

标签含义：

- **主干**：建立当前知识体系的核心阅读。
- **进阶**：深入 ABI、编译器、运行时或低层内存模型。
- **历史边界**：设计动机仍重要，但语法、默认设置或实现细节需结合文内版本说明校正。

## 派发、ABI 与优化

- [01 理解 Swift 性能](01-understanding-swift-performance.md) — **进阶·历史边界**：从分配、引用计数和调用选择建立经典成本模型，并明确旧实现不能背成语言保证。
- [02 Swift 方法派发完全指南](02-method-dispatch-complete-guide.md) — **主干**：以直接、表、Objective-C 消息派发和内联串起调用选择，并用现代优化器校正死记规则。
- [03 Swift 中的库演进](03-library-evolution.md) — **进阶**：解释 resilience boundary、`@frozen`、`@inlinable`、派发 thunk 与二进制兼容责任。
- [11 探索 Swift 性能](11-explore-swift-performance.md) — **主干**：以现代编译器视角统一函数调用、布局、分配、复制和优化机会。
- [13 Swift 的全模块优化](13-whole-module-optimization.md) — **历史边界**：说明模块可见性如何开启内联、特化和去虚化，而非承诺这些优化必然发生。

## 值语义与 API 设计

- [04 Swift 中的协议导向编程](04-protocol-oriented-programming.md) — **主干·历史边界**：从继承的共享与类型关系问题出发，建立协议、泛型和值语义的组合思路。
- [05 用值类型构建更好的 Swift 应用](05-better-apps-value-types.md) — **主干·历史边界**：讲清独立修改、局部推理、COW 及“值类型不自动等于值语义”。
- [06 现代 Swift API 设计](06-modern-swift-api-design.md) — **主干**：以领域身份、共享和调用点清晰度决定 struct、class、协议与泛型，而不是遵循机械偏好。

## 泛型与协议接口

- [07 拥抱 Swift 泛型](07-embrace-generics.md) — **主干**：建立 `T: P`、`some P`、`any P` 的渐进选择框架。
- [08 设计 Swift 协议接口](08-design-protocol-interfaces.md) — **主干**：处理关联类型、隐藏类型身份、存在类型擦除和 same-type 关系。
- [09 Swift 泛型的实现](09-implementing-swift-generics.md) — **进阶·历史边界**：从元数据、value witness、protocol witness 到特化，解释独立编译模型。
- [10 编译 Swift 泛型](10-compiling-swift-generics.md) — **进阶**：概览 generic signature、substitution、conformance 与 requirement machine 的系统模型。

## 所有权、ARC 与内存

- [12 改善 Swift 的内存使用与性能](12-improve-memory-performance.md) — **进阶**：从算法与分配一路进入 `InlineArray`、`Span`、非逃逸和值泛型。
- [14 Swift ARC：基础与进阶](14-arc-basics-and-beyond.md) — **主干**：说明对象生命周期、可观察释放时机和安全的生命周期控制方式。
- [15 Swift 所有权宣言](15-ownership-manifesto.md) — **进阶·历史边界**：理解借用、消费、独占访问和非复制类型的长期设计动机。
- [16 在 Swift 中使用非复制类型](16-consume-noncopyable-types.md) — **主干**：用 `~Copyable`、`borrowing` 和 `consuming` 表达唯一资源的生命周期。

## 结构化并发、隔离与运行时

- [17 探索 Swift 结构化并发](17-structured-concurrency.md) — **主干**：用任务树组织子任务、错误、协作式取消和生命周期。
- [18 用 Swift actor 保护可变状态](18-protect-state-actors.md) — **主干**：解释 actor isolation、`Sendable`、`MainActor` 与跨 `await` 重入。
- [19 用 Swift 并发消除数据竞争](19-eliminate-data-races.md) — **主干**：统一 task isolation、actor isolation 和跨边界值传递的安全模型。
- [20 Swift 并发幕后机制](20-concurrency-behind-scenes.md) — **进阶**：说明 continuation、协作式线程池、forward progress 与 actor executor。
- [21 Swift 6.2 发布精读](21-swift-6-2-released.md) — **历史边界**：校准默认隔离、调用方执行上下文、`@concurrent` 与 6.2 安全系统编程能力。

## 建议路线

应用开发主线可按 `05 → 06 → 07 → 08 → 14 → 17 → 18 → 19 → 21` 阅读。需要解释性能与派发时，再走 `02 → 11 → 01 → 13 → 03`；需要深入编译器或系统编程时，继续 `09 → 10 → 15 → 16 → 12 → 20`。历史材料用于理解设计因果，当前结论以各篇“准确性与版本边界”为准。
