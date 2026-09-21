# 让 Objective-C 框架在 Swift 中成为自然 API

- **Original title**: Refine Objective-C frameworks for Swift
- **原文链接**: [原文](https://developer.apple.com/videos/play/wwdc2020/10680/)
- **作者 / 机构**: Brent / Apple Swift Compiler Team
- **年份**: 2020
- **材料类型**: Apple WWDC 技术演讲
- **文档性质**: 忠实中文精读，不是原文全文翻译

## 文章要解决的问题

“Swift 能导入 Objective-C”并不等于导入后类型安全、命名自然或错误处理正确。演讲把互操作视为 API 翻译设计：同一个 Objective-C 头文件，怎样给编译器足够语义，使 Swift 客户端看到更强类型、更少隐式可选值和符合 Swift 习惯的调用点。

## 原文论证主线

第一步不是猜导入结果，而是在 Xcode 查看 Generated Interface，并实际写调用代码。Nullability 决定 Swift 是否看到 Optional；一旦声明 nonnull，Objective-C 编译器和静态分析器也能发现实现中的违约。Foundation 集合的轻量泛型让元素类型进入 Swift，`NSInteger` 等平台宽度类型比随意使用无符号整数更符合普通计数语义。

接着是把字符串常量提升为 `NS_STRING_ENUM` 一类受限类型，并用 designated initializer、不可用 initializer 和正确的 Objective-C 约定表达构造契约。对于 `NSError **`，Swift 是否导入为 `throws` 取决于方法形状和返回值约定；如果一个布尔返回值同时表达“无需保存”和“发生错误”，就必须先澄清 Objective-C API 语义，不能指望导入器猜出第三种状态。

当 Objective-C 本身无法表达理想 Swift 接口时，可用 `NS_REFINED_FOR_SWIFT` 把底层入口移出常规补全，再用 Swift extension 包装成自然的返回值或 `throws` API。`NS_SWIFT_NAME` 用于调整方法和类型在 Swift 中的命名，但最终判断标准不是 Generated Interface 漂不漂亮，而是客户端真实调用是否清晰。

## 关键机制与结论

互操作是有规则的语义翻译，不是无损语法替换。高质量边界依赖头文件提供空值、泛型、构造、错误和命名信息；必要时再用薄 Swift 包装补足表达能力。改标注后应同时检查 Objective-C 实现警告、Swift 生成接口和代表性调用测试。

一条可靠的改造顺序是先记录现有两端调用，再补最能证明事实的 nullability 和泛型，然后处理构造、错误与命名，最后才引入 refined 包装。每一步都要重新编译 Objective-C 实现与 Swift 客户端，因为“导入得更漂亮”也可能暴露原实现违约，或成为既有 Swift 源码的破坏性变更。

## 准确性 / 版本边界

演讲基于 Xcode 12 / Swift 5.3，具体导入名称、宏和错误桥接会随编译器演进。不能把视频中的某个生成签名当永久 ABI，也不能用标注掩盖实现实际可能返回 `nil` 的事实。当前工具链的 Generated Interface 和编译测试才是最终证据。

## 在知识体系中的位置

这是 Objective-C→Swift 互操作主干，适合 SDK、混合工程和渐进迁移。它把 Objective-C 类型设计、Swift API Design Guidelines 与真实兼容边界连接起来。
