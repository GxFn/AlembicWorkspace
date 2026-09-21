# 用 Swift actor 保护可变状态

- **Original title**: Protect mutable state with Swift actors
- **原文链接**: [Apple Developer](https://developer.apple.com/videos/play/wwdc2021/10133/)
- **作者/机构**: Dario Rexin、Douglas Gregor / Apple Swift 团队
- **年份**: 2021
- **材料类型**: WWDC 并发与语言设计演讲、文字稿
- **文档性质**: 忠实中文精读，不是原文全文翻译

## 文章要解决的问题

两个并发执行单元访问同一可变状态且至少一个写入，会形成数据竞争。值语义能消除很多隐式共享，却不能满足计数器、缓存或数据库协调器这类必须共享状态的需求。原文介绍 actor 如何把共享状态与串行访问规则绑定进类型系统。

## 原文论证主线

actor 拥有自己的隔离域，外部代码不能直接同步读写其可变存储；跨域访问通常需要 `await`，由 actor 的 executor 安排一项工作。不可变且安全传递的值可以跨隔离域交换，`Sendable` 用来表达这种传递能力。演讲随后讨论 actor-isolated requirement 如何影响协议一致性，并以 `MainActor` 展示全局 actor 如何把 UI 相关状态统一隔离到主执行器。

## 关键机制与结论

actor 保证其隔离状态不会被两个 actor job 同时访问，但一个方法遇到 `await` 后可以暂停，actor 随即执行其他工作；恢复时，先前检查过的状态可能已经改变。因此跨 `await` 的不变量必须重新验证，或把需要原子完成的步骤放在同一无挂起区段。跨 actor 传递的可变引用若不满足 `Sendable`，仍可能绕过隔离，因此隔离和可发送性必须一起考虑。

## 准确性与版本边界

actor 不是“自带专用线程的 class”，也不等同于一条固定 GCD 串行队列。executor 可以在线程间调度，顺序、公平性和线程身份通常不作保证；actor 解决底层数据竞争，不自动消除重入导致的逻辑竞态。材料基于 Swift 5.5，Swift 6 完整检查及 Swift 6.2 默认隔离选项会改变诊断和注解数量，但不改变上述核心边界。

## 在知识体系中的位置

这篇文章把结构化任务与状态保护连接起来。它适合成为 actor 面试题的主来源：定义隔离、解释 `Sendable`，并重点讲清重入。随后《Eliminate data races》会把 task、actor 和全局状态放进统一的数据竞争安全模型。
