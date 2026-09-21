# 异步与挂起线路：Task 如何离开并恢复普通调用栈

## 1. 线路定义

Swift `async` 函数表示：

> 函数的执行允许在若干点挂起，稍后恢复并产生结果或错误；调用它的异步上下文用
> `await` 承认这种控制流边界。

概念线路：

```text
选择具体 async 实现
→ 建立异步调用上下文
→ 执行同步片段
→ 到达潜在 suspension point
→ 保存继续执行所需状态
→ 当前 Task 挂起，线程可执行其他工作
→ 外部事件使 Task 再次可运行
→ Executor 安排 continuation
→ 从保存状态恢复
→ 返回、抛错或响应取消
```

`async` 描述可挂起控制流，不是“把整个函数自动放到后台线程”的属性。

## 2. Async Function Type

```swift
func load() async throws -> Data
```

`async` 和 `throws` 都是函数类型的一部分。同步 closure 不能在没有适配的情况下替代
异步 closure，调用异步函数也必须处在允许 `await` 的上下文。

```swift
let operation: () async throws -> Data = load
```

这个函数值可能封装 direct、class、witness 或 Objective-C 桥接入口。函数值的异步
类型决定调用控制流，底层成员派发仍要单独分析。

## 3. `await` 是潜在挂起点

```swift
let data = try await client.load()
```

`await` 不承诺每次都真的挂起：

- 缓存结果可能立即可用；
- 被调用函数可能在第一次 suspension 前就返回；
- Runtime 状态可能允许同步推进。

它承诺的是调用点必须按“可能挂起”设计。跨过它以后：

- 局部状态仍须保持有效；
- 外部可变状态可能已经变化；
- 当前线程身份不能被假定；
- 取消状态可能已经设置；
- actor-isolated 状态可能被其他消息修改。

## 4. Async 函数由同步片段组成

可以把一个 async function 视为由 suspension point 分开的多个同步区域：

```swift
func refresh() async throws {
    let request = makeRequest()        // 同步片段 A
    let data = try await send(request) // 潜在挂起
    let model = try decode(data)       // 同步片段 B
    await store(model)                 // 潜在挂起
}
```

片段内部仍按普通顺序执行；`await` 允许 Task 离开当前执行资源，再在满足 isolation
约束的执行环境中继续。

“异步函数整体同时执行”是错误图像。更准确的是状态机推进：

```text
state A ──await──> suspended
                     │ result ready
                     v
state B ──await──> suspended ──> completed
```

## 5. 挂起不等于阻塞

### 挂起 Task

- 保存逻辑继续状态；
- 释放当前线程去运行其他 job；
- 将来由 executor 调度恢复。

### 阻塞 Thread

- OS thread 停在锁、同步 I/O、信号量或等待调用；
- 这条线程暂时不能运行其他 job；
- 如果发生在有限 cooperative thread pool 上，可能造成饥饿或死锁。

Async 函数内部依然可以错误地阻塞：

```swift
func badAsyncWrapper() async throws -> Data {
    try Data(contentsOf: remoteURL) // API 若同步等待 I/O，async 关键字不会改变它
}
```

把同步阻塞函数改名并加 `async` 不会自动生成非阻塞实现。

## 6. Runtime 状态机是实现模型

编译器常把 async function 降低成可恢复状态机，跨挂起点需要保留：

- 下一段代码位置；
- 仍然存活的局部变量；
- 返回 / 错误 continuation；
- Task context、优先级、取消等运行信息；
- isolation / executor 相关上下文。

具体 frame 布局、分配位置和 resume function 形状属于实现细节。可依赖的语言事实是：
局部值的语义、错误传播和 actor isolation 在挂起恢复后仍正确。

## 7. 派发主干怎样进入 Async 状态机

```swift
protocol Downloader {
    func download(_ url: URL) async throws -> Data
}

func fetch<D: Downloader>(
    _ url: URL,
    with downloader: D
) async throws -> Data {
    try await downloader.download(url)
}
```

这次调用分两层：

```text
D: Downloader 的 conformance
→ witness 选择 download 实现
→ 进入该实现的 async entry
→ 实现内部按状态机挂起和恢复
```

如果 `D` 被特化，witness 间接可能消失；如果 download 不实际挂起，调用可连续推进。
二者都不改变协议 requirement 是 async 的事实。

四条方法派发都可组合异步语义：

| 派发线路 | Async 组合 |
| --- | --- |
| 直接 | 具体类型的已知 async function |
| Class vtable | 可 override 的 async class member |
| Protocol witness | async protocol requirement |
| Objective-C message | 通过可表示 callback / completion API 桥接；原生 Swift async 本身受 ObjC 表示边界限制 |

## 8. `async let`：固定数量的结构化子任务

```swift
async let profile = loadProfile()
async let settings = loadSettings()

let page = try await Page(
    profile: profile,
    settings: settings
)
```

`async let` 允许两个子任务重叠推进，并把它们绑定在当前作用域：

- 子任务不能无界逃离作用域；
- 读取结果时等待；
- 错误和取消遵守结构化关系；
- 是否物理并行由 Runtime 和工作负载决定。

若先写：

```swift
let profile = try await loadProfile()
let settings = try await loadSettings()
```

第二项要等第一项完成才开始，虽然两个函数都是 async，调用结构仍是顺序的。

## 9. Task Group：动态数量的结构化子任务

```swift
let results = try await withThrowingTaskGroup(
    of: Item.self,
    returning: [Item].self
) { group in
    for id in ids {
        group.addTask {
            try await loadItem(id)
        }
    }

    var items: [Item] = []
    for try await item in group {
        items.append(item)
    }
    return items
}
```

要分别决定：

- 最大并发度是否需要限流；
- 结果要完成顺序还是输入顺序；
- 一个子任务失败后其他任务是否取消；
- 每个 child capture 是否 `Sendable`；
- 资源和重试是否有上限。

Task group 提供生命周期结构，不自动提供业务级 backpressure 或固定并发上限。

## 10. Continuation：把 Callback 桥接到 Suspension

```swift
func request() async throws -> Data {
    try await withCheckedThrowingContinuation { continuation in
        legacyRequest { result in
            continuation.resume(with: result)
        }
    }
}
```

关键合同：

```text
continuation 必须且只能恢复一次
```

- 不恢复：异步调用永久悬挂并泄漏逻辑工作；
- 重复恢复：违反 continuation 合同；
- callback 可能多次触发：桥接层必须自己建立一次性状态；
- callback API 有取消能力：应把 Task cancellation 转成底层取消；
- callback 同步回调也必须正确：桥接不能依赖“肯定稍后回调”。

Checked continuation 在调试中提供部分误用诊断，不替代完整状态机设计。

## 11. Actor 中的挂起与可重入

```swift
actor BankAccount {
    private var balance: Int

    func transfer(_ amount: Int) async throws {
        guard balance >= amount else { throw InsufficientFunds() }
        let approved = try await authorize(amount)
        guard approved else { return }
        guard balance >= amount else { throw InsufficientFunds() }
        balance -= amount
    }
}
```

第一次检查到第二次检查之间发生挂起。其他工作可能进入 actor 并修改 `balance`。
这说明：

```text
Actor 隔离防止同一隔离状态的数据竞争
≠
一整个含 await 的方法具有事务隔离
```

可以通过在挂起前预留状态、恢复后重新验证、使用版本号或设计补偿动作维持不变量。

## 12. 错误与取消

`throws` 和 cancellation 都会增加退出路径：

```swift
func process() async throws {
    try Task.checkCancellation()
    let data = try await load()
    try Task.checkCancellation()
    try decode(data)
}
```

取消是协作式：

- `cancel()` 设置状态并向结构化子任务传播；
- 一些系统 async API 会感知取消；
- CPU 密集循环需要主动检查；
- 清理应覆盖 CancellationError 和其他错误；
- 不要把所有错误都吞成“用户取消”。

## 13. AsyncSequence：把多次异步结果建模为序列

```swift
for try await event in events {
    handle(event)
}
```

每次 `next()` 都可能挂起。要考虑：

- 序列结束与错误；
- consumer 取消；
- producer 比 consumer 快时的 buffering / backpressure；
- element 是否安全跨 isolation；
- 一个 iterator 能否被多个任务同时消费。

AsyncSequence 是协议抽象，其 `next()` 调用还会进入 witness 线路；异步挂起是另一层。

## 14. Isolation 与执行位置的版本边界

不要用固定线程口诀描述 async function：

- actor-isolated member 必须遵守对应 isolation；
- global actor 可以规定隔离域；
- `nonisolated`、默认 actor isolation 和语言模式会影响函数语义；
- Swift 6.2 之后关于 async function isolation 的规则和默认设置发生演进；
- custom executor 进一步说明“函数 = 某条线程”不是合同。

真实项目需检查 compiler version、Swift language mode、default actor isolation 和
upcoming features。只有显式 isolation 与当前构建配置能支持执行位置结论。

## 15. 常见误区

### “写了 async 就不会卡线程”

错误。同步 I/O、锁、信号量或长时间 CPU 循环仍会占住执行线程。

### “每个 await 都会切线程”

错误。`await` 只表示潜在挂起；即使恢复在线程不同处，代码也不应依赖该细节。

### “两个 async 调用自然并发”

错误。连续 `await` 通常形成顺序依赖；需要 `async let`、task group 或明确的任务结构。

### “Continuation 就是 Completion Handler 的新名字”

错误。Continuation 是把挂起的 Swift task 与外部回调连接起来的一次性恢复合同。

### “Actor 方法从开头到结尾不能插入其他调用”

错误。跨 `await` 可以可重入；应重新验证隔离状态。

### “Task.detached 更适合后台工作”

不准确。Detached 表示切断结构和继承上下文，不等同于固定后台线程或更高性能。

## 16. 诊断线路

异步函数不返回：

```text
是否卡在同步阻塞
→ continuation 是否遗漏恢复
→ 底层 callback 是否真正触发
→ cancellation 是否关闭了资源却没完成 continuation
→ task 是否被不当丢弃或形成等待环
```

结果顺序错误：

```text
业务要求输入顺序还是完成顺序
→ async let / group 的收集逻辑
→ actor 重入后状态是否重新校验
→ 多个 producer 是否缺少版本或身份
```

界面卡顿：

```text
MainActor 上是否执行长 CPU 工作
→ async 函数内部是否调用阻塞 API
→ 是否用 semaphore 等待 async 结果
→ 是否存在 executor / thread pool starvation
```

## 17. 线路摘要

```text
Async 声明允许挂起
→ await 标出潜在控制流断点
→ 编译器保存跨断点状态
→ Task 让出执行线程
→ 外部完成使 continuation 可运行
→ Executor 在合法 isolation 上恢复
→ 正常、错误或取消路径完成
```

上一条：[同步与阻塞](01-synchronous-and-blocking.md)

下一条：[并发与并行](03-concurrency-and-parallelism.md)
