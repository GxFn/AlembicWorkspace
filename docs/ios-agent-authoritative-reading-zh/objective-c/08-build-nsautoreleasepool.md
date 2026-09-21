# Autorelease Pool 的最小心智模型

- **Original title**: Friday Q&A 2011-09-02: Let's Build NSAutoreleasePool
- **原文链接**: [原文](https://www.mikeash.com/pyblog/friday-qa-2011-09-02-lets-build-nsautoreleasepool.html)
- **作者 / 机构**: Mike Ash
- **年份**: 2011
- **材料类型**: 内存管理实现实验
- **文档性质**: 忠实中文精读，不是原文全文翻译

## 文章要解决的问题

`autorelease` 常被误解为“过一会儿系统自己释放”，这种说法既没说明由谁记录，也没说明“稍后”依赖什么边界。原文重建一个简化 `NSAutoreleasePool`，把延迟释放还原为线程局部、可嵌套的记录与清算过程。

## 原文论证主线

当对象接收 `autorelease` 时，它被加入当前线程最上层的 Pool。每个线程维护一个 Pool 栈，新 Pool 入栈，销毁时出栈；Pool 内部保留一组待处理对象。清空 Pool 的核心动作并不神秘：按记录向这些对象发送对应次数的 `release`。同一对象 autorelease 两次，就会被记录两次并在边界到来时释放两次。

Pool 可以嵌套。若外层被销毁而内层尚未正常退出，简化实现会处理其上的嵌套层，保证边界不会永久遗留。因为 Pool 属于线程，把对象从一个线程传到另一个线程不会迁移它原来的 autorelease 记录；若接收方需要延长生命，必须建立独立所有权。原文还用循环中的局部 Pool 解释如何降低大量临时对象造成的峰值内存。

## 关键机制与结论

Autorelease Pool 不是计时器，也不负责发现“没人使用的对象”。它只把一次所有权递减延迟到明确边界。事件循环、线程入口、队列执行环境或显式 `@autoreleasepool` 共同决定边界。Pool 只保存待释放动作，因而无法可靠回答“这个对象是否已经 autorelease”或把 autorelease 当成对象状态查询。

工程上还要区分“环境替你放了外层 Pool”与“释放频率满足当前任务”。系统管理的事件循环或队列即使提供边界，也未承诺在一个超长任务的每轮循环后清空；批量解码、图片处理和大规模 Foundation 转换仍可能需要内层 `@autoreleasepool` 来限制峰值。自己创建的线程则必须确认入口确有 Pool。

## 准确性 / 版本边界

原文的教学实现使用 `NSThread` 字典、每层容器和 MRC 消息，作者已说明 Lion 与 ARC 时期内部实现发生大改。现代代码通常写 `@autoreleasepool`，编译器和 Runtime 使用 push/pop token 及高度优化的池存储，还可能消除成对的 autorelease/retain。GC 讨论已经过时。不要依赖具体容器、释放顺序或“必定到下次 RunLoop 才释放”等过强结论。

## 在知识体系中的位置

本篇补齐引用计数的“延迟减一”环节。它对后台线程、大循环、图片处理、命令行工具和内存峰值诊断都很实用，也帮助理解 ARC 并没有取消 autorelease 机制。
