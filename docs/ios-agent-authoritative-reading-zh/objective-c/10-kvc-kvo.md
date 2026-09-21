# KVC 与 KVO：动态性如何变成数据绑定机制

- **Original title**: Key-Value Coding and Observing
- **原文链接**: [原文](https://www.objc.io/issues/7-foundation/key-value-coding-and-observing/)
- **作者 / 机构**: Daniel Eggert / objc.io
- **年份**: 2013
- **材料类型**: Foundation 深度文章
- **文档性质**: 忠实中文精读，不是原文全文翻译

## 文章要解决的问题

KVC/KVO 经常被压缩成“字符串取属性”和“监听属性变化”，于是依赖属性、集合增量通知、线程语义和合规边界都被遗漏。原文从模型—界面同步的真实场景出发，逐层展示它们如何利用 Objective-C 的动态调用和自省能力减少胶水代码。

## 原文论证主线

KVO 部分先用颜色模型说明依赖键：某个显示属性可能由多个基础分量计算而来，类需要声明哪些 key 的变化会影响派生 key。自动通知通常围绕合规 setter 触发 `willChange...` 与 `didChange...`；若关闭自动通知并手工发送，就必须把真实修改夹在两者之间，否则旧值、新值和 key path 级联都会失真。

通知可携带新旧值、变化前回调以及集合插入、删除、替换的索引信息。集合本身不是被观察关系，真正观察的是某个对象的集合属性；通过可变集合代理修改，KVO 才能给出细粒度变化。最关键的并发结论是：KVO 在实际修改发生的同一线程同步通知，没有隐含队列或 RunLoop 跳转。setter 返回时观察者已经执行完，因此跨线程修改会把线程安全责任同步传给所有观察者。

KVC 部分说明 `valueForKey:` / `setValue:forKey:` 以字符串驱动访问，可为标量和结构体装箱，也能按约定回退到实例变量、未定义键处理以及集合运算符和代理对象。灵活性的代价是拼写、类型和合规错误往往推迟到运行时。

## 关键机制与结论

KVC 是按命名约定进行动态访问，KVO 是围绕合规变更发送同步通知；二者相关但不相同。KVO 合规是类 API 合同，不能因为属性“看起来普通”就默认可观察。观察上下文应可区分来源，注册、移除和对象生命周期必须成对设计。

依赖键也不是“观察者自动读懂 getter”：类要通过约定方法显式声明依赖关系。对数组只改底层可变容器而绕过 KVC 代理，同样不会凭空产生正确的索引变化通知。换言之，KVO 的自动化建立在所有写入都经过合规入口之上。

## 准确性 / 版本边界

文章中的手工 observer、context 和移除样板属于 2013 年 Objective-C 风格。现代 Swift 可使用 `NSKeyValueObservation` token、Combine 或 Observation，但这不会让 Foundation、Core Data 和旧 Cocoa API 的 KVO 语义失效。不要把 KVO 当跨队列事件总线，也不要宣称所有系统属性天然 KVO-compliant。

## 在知识体系中的位置

本篇位于 Foundation 动态机制主干，向下连接 selector、setter 与 Runtime，向上连接数据绑定、Core Data、响应式流和现代 Observation 的取舍。
