# Non-fragile ivars 与二进制兼容

- **Original title**: [objc explain]: Non-fragile ivars
- **原文链接**: [原文](https://www.sealiesoftware.com/blog/archive/2009/01/27/objc_explain_Non-fragile_ivars.html)
- **作者 / 机构**: Greg Parker / Sealie Software（Apple Objective-C Runtime 工程师）
- **年份**: 2009
- **材料类型**: Runtime / ABI 原理文章
- **文档性质**: 忠实中文精读，不是原文全文翻译

## 文章要解决的问题

框架升级时，父类只是增加一个私有实例变量，为什么旧版编译好的第三方子类可能立刻损坏？原文从 fragile base class problem 出发，解释现代 Objective-C 怎样允许系统框架扩展对象布局，同时保持既有子类二进制可用。

## 原文论证主线

在脆弱布局中，编译器把子类 ivar 访问生成为固定偏移，类似 C 结构体字段。子类编译时假设父类大小为某个值，于是把自己的第一个 ivar 放在紧随其后的位置。若新版父类在末尾增加 ivar，旧子类仍使用原偏移，两者便占据同一内存，父类写入会破坏子类状态。即使新增成员对源码不可见，二进制布局仍发生冲突。

Objective-C 的方法通常没有这个问题，因为动态派发允许父类增加方法，只要 selector 不冲突；实例变量则需要另一层间接。Non-fragile ivar 让编译器不再把子类偏移永久写死，而是为每个 ivar 生成可由 Runtime 修正的 offset 变量。进程加载类时，Runtime 看到实际父类比子类编译时更大，就把子类字段整体后移，并更新这些 offset。既有机器代码通过变量取偏移，无需重新编译。

这项能力也为自动合成属性 backing ivar、在实现区域声明 ivar 等语言体验提供了 ABI 基础：框架作者不必在公开接口中提前占满未来布局。

## 关键机制与结论

二进制兼容不只关乎方法签名，还包括对象大小和字段偏移。Non-fragile ivar 用一次间接访问换取父类布局可演进性，把“子类从哪里开始”从编译期常量变成加载时可校正数据。它不能解决 selector 冲突，也不意味着可以随意修改所有已发布类层次，但消除了最直接的父类扩容碰撞。

## 准确性 / 版本边界

文章以 32 位 Mac 的脆弱布局和早期 iPhone、64 位 Mac 的现代 Runtime 对比，具体字节偏移与平台名单已属历史。当前 Apple 平台的实际 ABI 应由目标工具链和平台文档决定。应用不应手工计算系统对象 ivar 地址；稳定价值是理解 offset 间接层如何保护已编译子类。

## 在知识体系中的位置

本篇位于对象布局与框架 ABI 进阶层，连接类模型、Mach-O 元数据、动态库升级和 Swift/Objective-C 二进制边界。
