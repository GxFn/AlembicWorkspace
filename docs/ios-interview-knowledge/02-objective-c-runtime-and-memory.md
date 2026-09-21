# Objective-C：Runtime、内存与动态机制

> 知识树定位：B2 Objective-C、B4 混编与迁移；诊断关联 F2.4 内存与 F4 工具。

## 1. 对象模型

Objective-C 的方法调用本质是向对象发送消息。对象携带指向其类信息的 `isa` 关联；类对象描述实例方法、属性、协议等，元类描述类方法。Runtime 会在类及父类的方法信息和缓存中查找实现，再调用对应 IMP。

```objc
[receiver doWork:value];
```

可近似理解为编译器生成一次消息发送，但不要在业务代码里依赖未经声明的 `objc_msgSend` 调用签名。返回值、架构和 ABI 会影响具体调用形式。

### 1.1 方法缓存

动态查找有成本，Runtime 会缓存已解析的方法。由此可得到两个面试结论：

- 动态派发不等于每次都从头扫描方法列表；
- Method Swizzling 修改实现后要尊重 Runtime API 和时机，不能假设私有缓存布局。

## 2. 消息解析与转发

当接收者找不到 selector 时，常见处理链是：

1. 动态方法解析：`+resolveInstanceMethod:` / `+resolveClassMethod:`；
2. 快速转发：`-forwardingTargetForSelector:`；
3. 完整转发：提供 `-methodSignatureForSelector:`，再在 `-forwardInvocation:` 处理；
4. 未处理则触发无法识别 selector 的异常。

三层用途不同：

- 动态解析适合在类上补充方法实现；
- 快速转发适合把消息交给另一个对象；
- 完整转发能检查或改写 `NSInvocation`，灵活但成本更高。

面试追问：

- 类方法为什么要在元类上解析；
- 转发代理如何避免形成循环；
- Swift 纯类型为什么不能无条件套用整套 OC 消息转发机制。

## 3. Category、Class Extension 与关联对象

| 机制 | 作用 | 边界 |
| --- | --- | --- |
| Category | 给已有类增加方法、协议声明 | 不能直接增加实例变量；同名实现冲突结果不应被依赖 |
| Class Extension | 在编译期可见范围补充私有声明 | 常用于主实现内部；可声明实例变量的能力取决于声明位置和类控制权 |
| Associated Object | 运行时给对象关联额外值 | 不是“真正新增 ivar”；生命周期和线程语义由策略与调用方负责 |

关联对象适合无侵入附加元数据，但不应被滥用为隐藏的全局状态。Key 需要稳定且唯一，常用静态地址。

## 4. Method Swizzling

Swizzling 可以交换或替换方法实现，常见于埋点、兼容修复和框架扩展。风险包括：

- 全局影响且调用链隐蔽；
- 多个库交换同一方法时顺序不确定；
- 递归调用或原实现丢失；
- 系统内部行为变化；
- 启动和调试复杂度上升。

安全原则：

1. 有明确、不可替代的使用场景；
2. 限定到自有类或有稳定合同的接口；
3. 一次性安装并记录原 IMP；
4. 处理继承与“类本身未实现该方法”的情况；
5. 有集成测试、开关、日志和回滚方案；
6. 优先考虑组合、代理、通知或显式注入。

## 5. `+load` 与 `+initialize`

| 方法 | 触发 | 特点 | 建议 |
| --- | --- | --- | --- |
| `+load` | 类/Category 被 Runtime 装载时 | 早于正常业务入口；增加启动成本 | 只做极少、确定、无外部依赖的工作 |
| `+initialize` | 类首次收到相关消息前懒触发 | 可能把延迟带到首次业务调用 | 不要承载耗时或容易重入的复杂初始化 |

更现代的业务初始化通常应显式化，以便控制顺序、失败和测试。

## 6. ARC 与所有权

ARC 是编译器插入并优化 retain/release 等所有权操作，不是垃圾回收器。它不能自动解决对象图中的强引用环。

### 6.1 所有权修饰

| 修饰 | 含义 | 常见用途 |
| --- | --- | --- |
| `strong` | 持有对象 | 服务、模型、子对象 |
| `weak` | 不持有，目标释放后置 `nil` | delegate、反向关系 |
| `copy` | 保存一份复制结果 | `NSString`、Block、值语义配置 |
| `assign` | 简单赋值，不提供对象生命周期保护 | 标量；对象场景风险高 |
| `unsafe_unretained` | 不持有且不自动置空 | 极少数性能/兼容场景，风险高 |

`atomic` 只约束合成访问器单次读写的某种原子性，不保证复合业务操作线程安全，也不等于无数据竞争。

### 6.2 Retain Cycle

常见环：

```text
对象 → Block → 对象
父对象 → 子对象 → 父对象
Timer/DisplayLink → target → Timer
Session → delegate → Session
```

修复不是机械地把所有引用改为 `weak`。先明确所有权图：

- 谁拥有谁；
- 谁必须至少活到异步完成；
- 是否需要 weak-strong dance；
- 回调能否取消；
- 生命周期结束时谁断开关系。

## 7. Autorelease Pool

Autorelease Pool 推迟对象释放。App 主线程通常在事件循环边界管理 Pool，但下面场景可能需要显式 `@autoreleasepool`：

- 大循环创建大量临时 OC 对象；
- 自建长期线程；
- 图片、字符串、桥接对象的批处理；
- 需要降低峰值内存而非只看最终泄漏。

```objc
for (NSInteger i = 0; i < count; i++) {
    @autoreleasepool {
        [self processItem:i];
    }
}
```

Pool 只能提前释放已无其他强引用的 autoreleased 对象，不能修复真实泄漏。

## 8. Block

Block 捕获外部变量并封装代码。面试需要区分：

- 全局 Block：不依赖局部捕获；
- 栈/堆语义：现代 ARC 下复制与生命周期多由编译器处理，但仍要理解捕获对象可能被强持有；
- `__block`：允许修改捕获变量；在 ARC 下不天然等于弱引用；
- Block 属性通常使用 `copy`，以表达持久保存闭包的语义。

典型循环引用：

```objc
__weak typeof(self) weakSelf = self;
self.completion = ^{
    __strong typeof(weakSelf) self = weakSelf;
    if (!self) { return; }
    [self finish];
};
```

这段代码的含义不是“所有 Block 都照抄 weak-strong”，而是：

- Block 不负责延长 owner 的完整生命周期；
- 回调开始后，用强局部变量保证本次执行期间对象稳定；
- 若业务要求任务必须完成，即使 owner 消失，也应把任务所有权交给独立对象。

## 9. KVC 与 KVO

### 9.1 KVC

KVC 通过字符串 Key/KeyPath 间接访问属性，是 KVO、Core Data 等机制的基础。风险：

- 编译期类型安全弱；
- Key 写错可能运行时崩溃；
- 标量 `nil` 赋值和未定义 Key 需要特殊处理；
- 访问器/实例变量查找规则复杂，不应靠猜。

### 9.2 KVO

KVO 让观察者接收指定属性变化。经典自动 KVO 的实现会动态创建中间子类并调整被观察对象的 `isa` 指向，这也是为什么不应直接用 `isa` 判断真实类。

经典手工 KVO 生命周期包括：

1. 注册观察；
2. 接收变化；
3. 正确区分 context；
4. 在不再需要时解除。

现代 Swift 可使用 key-path KVO、Observation、Combine 或显式状态流；选择取决于兼容性和数据边界，不是“新 API 永远更好”。

## 10. Delegate、Notification 与回调

| 方式 | 耦合 | 适用 |
| --- | --- | --- |
| Delegate | 一对一、协议明确 | 对象职责转交、同步询问 |
| Notification | 一对多、发送者不关心接收者 | 跨模块事件广播 |
| Block/Closure | 局部、表达直接 | 异步结果和短链路回调 |
| KVO/Observation | 围绕状态变化 | 模型到观察者的数据驱动 |

选型要回答：事件是否有返回值、订阅者数量、生命周期、线程、顺序、错误传播、取消和可测试性。

## 11. Objective-C 与 Swift 互操作

高质量 OC API 应：

- 使用 nullability 注解，避免 Swift 导入为隐式解包 Optional；
- 使用 lightweight generics 保留容器元素类型；
- 采用 Swift 友好的命名和错误模型；
- 对需要暴露给 OC 的 Swift 声明明确继承、`@objc` 和动态派发边界；
- 不把 Swift-only 的泛型、值类型或并发能力假装成无成本 OC 接口。

渐进迁移时先稳定模块合同，再迁移内部实现。不要在同一阶段同时改变语言、架构、数据模型和行为。

## 12. 高频问题

### Q1：`objc_msgSend` 找不到方法后发生什么？

先说明缓存/类层级查找，再依次讲动态解析、快速转发、完整转发和最终异常。

### Q2：为什么 weak 能自动置 nil？

回答 Runtime 维护弱引用关系并在目标销毁时清理；内部表结构是实现细节，不应当成业务合同。

### Q3：`copy` 和 `strong` 修饰 NSString 有什么差别？

若传入可变字符串，`strong` 保留同一对象，外部修改会影响属性；`copy` 保存独立不可变语义。还要说明复制的深浅取决于类型实现。

### Q4：Category 方法覆盖原类方法安全吗？

同名实现冲突不应被依赖；如果必须替换行为，应采用明确、受控、可测试的 Runtime 操作或更显式设计。

### Q5：KVO 为什么可能改变 `object_getClass` 的结果？

经典自动 KVO 通过动态子类和 `isa` 调整拦截 setter 并发送变化通知。
