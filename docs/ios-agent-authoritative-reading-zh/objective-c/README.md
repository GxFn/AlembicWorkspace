# Objective-C 权威材料中文精读

本目录收录 20 份基于原文的中文阅读稿，包含两种文档类型：

- **完整中文译文**：[12 Associated Objects](12-associated-objects.md)、
  [13 Method Swizzling](13-method-swizzling.md)、
  [14 Objective-C Direct Methods](14-objective-c-direct-methods.md)。
- **中文精读摘要**：其余 17 份文档，保留原始材料的问题意识、论证顺序、关键机制和
  结论，同时单独标注版本与准确性边界，但不逐段全文翻译。

两类文档都不替代原文。

建议先完成“主干”，再按需要进入“进阶”。带“历史边界”的材料仍有很强解释力，但其中的 ABI、工具链、内存管理写法或平台结论不能直接当作 2026 年实现事实。

## 一、对象与消息

1. **主干** — [Objective-C 的类与元类](01-classes-and-metaclasses.md)：建立实例、类对象、元类以及两条继承/归属关系链。
2. **主干** — [Objective-C 消息派发的基本模型](02-objective-c-messaging.md)：分清 message、method、selector、IMP 与缓存查找。
3. **进阶** — [找不到方法之后：Objective-C 消息转发](03-objective-c-message-forwarding.md)：串起动态解析、快速转发和 `NSInvocation` 完整转发。
4. **进阶 · 历史边界** — [从零搭一个教学版 objc_msgSend](04-build-objc-msgsend.md)：用 x86-64 汇编理解参数透传、缓存和尾跳转。
5. **主干** — [现代 Objective-C Runtime 如何压缩内存](05-advancements-objective-c-runtime.md)：由 Apple 解释类数据、相对方法列表和 Tagged Pointer 的现代演进。

## 二、所有权与闭包

6. **主干** — [ARC 到底自动了什么](06-automatic-reference-counting.md)：把 ARC 定位为编译期所有权系统，而非循环垃圾回收。
7. **进阶 · 历史边界** — [用最小实现看懂引用计数](07-build-reference-counting.md)：通过计数表与并发临界区理解 retain/release 状态机。
8. **进阶 · 历史边界** — [Autorelease Pool 的最小心智模型](08-build-nsautoreleasepool.md)：理解线程局部、嵌套边界与延迟所有权递减。
9. **主干 · 历史示例** — [Blocks：捕获上下文的可调用对象](09-practical-blocks.md)：连接闭包捕获、逃逸、生命周期和持有环。

## 三、Foundation 动态机制与 Runtime 改写

10. **主干** — [KVC 与 KVO：动态性如何变成数据绑定机制](10-kvc-kvo.md)：掌握字符串访问、合规通知、依赖键、集合与同步线程语义。
11. **进阶** — [方法替换：从继承到 IMP 改写](11-method-replacement.md)：比较 Category、Swizzling 与直接保存 IMP，并处理继承方法归属。
12. **进阶** — [Associated Objects：给现有对象附加旁路状态](12-associated-objects.md)：理解 Category 状态、唯一键、所有权策略与反模式。
13. **进阶** — [Method Swizzling 的操作模型与风险清单](13-method-swizzling.md)：把全局 selector→IMP 改写落实到初始化、组合和升级风险。
14. **进阶** — [Objective-C Direct Methods：主动退出动态派发](14-objective-c-direct-methods.md)：理解 `objc_direct` 用元数据与动态能力换取封闭边界。

## 四、互操作、ABI、调度与大型架构

15. **主干** — [让 Objective-C 框架在 Swift 中成为自然 API](15-refine-objective-c-for-swift.md)：以生成接口和真实调用点设计 nullability、泛型、错误与命名。
16. **进阶 · 历史位布局** — [Non-pointer isa：类指针之外还能放什么](16-non-pointer-isa.md)：理解压缩对象头与 side table，但不依赖任何固定位图。
17. **进阶 · 历史平台对比** — [Non-fragile ivars 与二进制兼容](17-non-fragile-ivars.md)：理解可修正 ivar offset 如何允许父类布局演进。
18. **进阶 · 历史边界** — [从源码到 Mach-O：编译、链接与装载如何接起来](18-mach-o-executables.md)：沿 Clang、目标文件、符号、Segment / Section 与 dyld 建立完整构建链。
19. **进阶 · 历史实现** — [用线程池重建一个最小 dispatch_queue](19-build-dispatch-queue.md)：区分队列语义、共享线程池、同步/异步与串行/并发。
20. **进阶 · 架构案例** — [Facebook iOS 架构十年演进中的真实取舍](20-facebook-ios-architecture.md)：观察 Objective-C++、Swift、dylib、构建图和组织规模如何共同塑造架构。

## 阅读时统一遵守的边界

- 经典文章中的裸 `isa`、公开结构体字段、x86 寄存器和固定缓存布局只用于解释历史实现。
- MRC、Objective-C Garbage Collection、`OSSpinLock` 和早期 `__block` 对象语义不能直接移植到 ARC 工程。
- Runtime 私有结构、Tagged Pointer 位图和 Mach-O 某版格式都不是应用兼容性合同。
- Swift 导入结果、C++ 互操作和编译器优化应以当前 Xcode / Clang / Swift 工具链实测为准。
- Swizzling、Associated Objects、消息转发是受约束的底层能力，不是因为“动态”就应成为默认业务架构。
