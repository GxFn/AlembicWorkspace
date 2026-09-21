# 找不到方法之后：Objective-C 消息转发

- **Original title**: Friday Q&A 2009-03-27: Objective-C Message Forwarding
- **原文链接**: [原文](https://www.mikeash.com/pyblog/friday-qa-2009-03-27-objective-c-message-forwarding.html)
- **作者 / 机构**: Mike Ash
- **年份**: 2009
- **材料类型**: Runtime 深度文章
- **文档性质**: 忠实中文精读，不是原文全文翻译

## 文章要解决的问题

消息派发只解释了“找到方法时怎么办”。原文继续追问：对象没有实现 selector 时，为何不一定立刻崩溃；Core Data 的动态属性、代理对象和 `NSUndoManager` 一类能力如何利用这段失败路径；几层转发钩子各自解决什么问题。

## 原文论证主线

第一层是动态方法解析。Runtime 请求类通过 `resolveInstanceMethod:` 或 `resolveClassMethod:` 补上实现；如果成功，原消息重新进入正常派发。这适合能根据 selector 生成固定签名 IMP 的场景，动态属性就是典型思路。

第二层是快速转发。`forwardingTargetForSelector:` 可以返回另一个接收者，原消息不改参数和 selector，改向新对象重新发送。它适合单纯委托给另一个对象，不需要检查或改写调用内容的情况。

第三层是完整转发。对象先通过 `methodSignatureForSelector:` 提供参数和返回值布局，Runtime 才能构造封装 target、selector、参数及返回值的 `NSInvocation`，随后交给 `forwardInvocation:`。若签名也不存在，最终进入 `doesNotRecognizeSelector:`。原文用“把消息批量作用于数组元素”展示表达力，同时指出直接在 `NSArray` 上做会被既有方法截获，真正的通用代理更适合从方法极少的 `NSProxy` 开始。

## 关键机制与结论

三层机制按成本和能力递增：补方法最快，换接收者简单，`NSInvocation` 最灵活也最重。动态派发仍受 C ABI 约束，编译器必须看到正确方法声明，不能因为最终会转发就忽略签名。代理若声称能响应可选协议方法，还需让 `respondsToSelector:` 等自省结果与实际转发能力一致。

还要区分“给类补实现”与“替某次调用兜底”：动态解析一旦把 IMP 加到类上，后续实例通常都会走正常派发；快速或完整转发则仍由当前接收者决定去向。选错层级，容易把本来只属于单个代理对象的行为扩散到整个类。

## 准确性 / 版本边界

这些公开钩子的语义至今仍有价值，但原文例子来自 2009 年 Cocoa，分布式对象等场景已不是现代主流。转发是异常路径和代理基础设施，不应为了“少写接口”而成为业务默认调用链；它削弱静态分析、可发现性和重构安全。具体 Runtime 私有慢路径也不是应用可依赖的 ABI。

## 在知识体系中的位置

本篇承接消息派发，并为 `NSProxy`、动态属性、AOP、测试替身和“未识别 selector”崩溃定位提供底层框架。理解后才能分清消息转发与 Swizzling：前者处理未找到实现，后者主动改写已存在的映射。
