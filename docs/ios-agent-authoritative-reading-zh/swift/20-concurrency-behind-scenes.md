# Swift 并发幕后机制

- **Original title**: Swift concurrency: Behind the scenes
- **原文链接**: [Apple Developer](https://developer.apple.com/videos/play/wwdc2021/10254/)
- **作者/机构**: Rokhini Prabhu、Varun Gandhi / Apple Darwin Runtime 团队
- **年份**: 2021
- **材料类型**: WWDC 运行时工程演讲与文字稿
- **文档性质**: 忠实中文精读，不是原文全文翻译

## 文章要解决的问题

把每项并发工作交给线程，并在等待串行队列或锁时阻塞，容易造成线程爆炸、上下文切换和优先级问题。原文解释 Swift task 如何暂停而不占住线程，运行时为何能使用受控的协作式线程池，以及 actor 在这个执行模型中怎样实现互斥和优先级传播。

## 原文论证主线

同步函数把帧压在线程栈上；async 函数可在潜在挂起点拆成 continuation，把跨挂起仍需存活的状态放进异步帧。等待异步结果时，task 保存 continuation，线程转去执行其他可运行 job。结构化任务又让运行时知道父子依赖，因此默认 executor 可以维持“线程上的工作最终能向前推进”的协作契约，而不必为每个阻塞等待补一条新线程。

## 关键机制与结论

在协作线程池上用信号量或条件锁等待另一项同池任务，可能占满所有可推进工作的线程，违反 forward-progress 假设；应使用真正可挂起的异步 API，或把不可避免的阻塞工作放到合适的专用设施。actor 的 executor 每次只运行一个访问其隔离状态的 job，并可利用任务依赖做优先级升级，但 actor 没有专属线程，恢复前后也可能换线程。

## 准确性与版本边界

演讲用接近 CPU 核数的线程解释设计目标，不能写成线程数永远严格等于核心数。调度顺序、线程亲和性、并行度和具体 executor 实现不是稳定语言保证；后续自定义 executor 与运行时改进也扩展了模型。`await` 只是可能挂起，连续执行不承诺固定线程。actor 的互斥同样不等于跨 `await` 的整个方法原子。

## 在知识体系中的位置

这是并发主干的运行时篇，回答 task 与 thread、actor 与 queue 为什么不能画等号。它应在结构化并发和 actor 之后阅读，再配合 Instruments 观察真实任务、挂起和线程状态，避免用 GCD 经验错误解释 Swift 并发。
