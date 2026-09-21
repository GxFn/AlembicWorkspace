# Task、Job、Executor 与 Actor：Swift 并发运行时主干

## 1. 这条线路解决什么问题

四种方法派发回答：

> 这次调用最终进入哪个函数实现？

Task、Job、Executor 与 Actor 回答的是另一组问题：

> 已经选中的异步实现怎样推进、在哪里获得执行机会，以及它能安全访问哪一份状态？

把两组机制连接起来，一次调用的完整主干是：

```text
名称查找与重载解析
→ direct / class vtable / protocol witness / Objective-C message 选择实现
→ 在当前 Task 中进入 async 实现
→ 执行一个同步 Job
→ 遇到 suspension point，保存 continuation
→ 等待条件满足后，Job 被提交给合适的 Executor
→ 某条 Thread 运行这个 Job
→ 若跨 Actor isolation，则必须在目标 Actor 的执行上下文推进
→ 返回、抛错或协作式响应取消
```

因此，这篇不是另一份 API 清单，而是一张运行时地图。它以
`Task → Job → Executor` 为纵向主干，以 Actor isolation 为横向约束，再把结构化任务、
优先级、task-local、取消、`Sendable`、continuation 与四种方法派发挂到正确位置。

前置阅读：

- [同步、异步与并发总览](README.md)
- [异步与挂起](02-asynchronous-and-suspension.md)
- [并发与并行](03-concurrency-and-parallelism.md)
- [四种方法派发总览](../03-method-dispatch/README.md)

---

## 2. 先固定五个不能互换的名词

| 名词 | 稳定语义 | 不应理解成 |
| --- | --- | --- |
| Task | 一项异步工作的逻辑生命周期；携带结果、优先级、取消状态和 task-local 上下文 | 固定线程、GCD block、Actor mailbox 中的一条消息 |
| Job | Task 在两个 suspension point 之间可被调度的一段同步工作 | 完整 Task、业务 Job 模型、永久绑定的 closure |
| Executor | 接受可运行 Job，并安排某条 Thread 执行它的服务 | 必然等同于 DispatchQueue、必然拥有专属线程 |
| Thread | OS 真正调度的执行资源，在某一时刻运行一个同步调用栈 | Swift Task 的身份或生命周期 |
| Actor | 一个隔离域：约束其可变状态只能在合法隔离上下文访问 | 方法派发器、严格 FIFO 队列、跨 `await` 的事务 |

最短关系图：

```text
一个 Task
  ├─ Job A ──由 Executor X 安排──> Thread 1 执行
  ├─ suspension
  ├─ Job B ──由 Executor Y 安排──> Thread 3 执行
  ├─ suspension
  └─ Job C ──由 Executor X 安排──> Thread 2 执行

Actor isolation 决定某些 Job 必须在哪个隔离执行上下文中运行。
```

由此可以立即排除几条错误等式：

```text
Task ≠ Thread
Task ≠ Queue
Actor ≠ Thread
Actor ≠ FIFO transaction queue
Executor hop ≠ method dispatch
await ≠ 一定创建新 Task
await ≠ 一定切换 Thread
```

Swift Evolution 早期文本曾使用 “partial task”等术语，标准库的底层调度 API 也会随
版本演进为 `ExecutorJob` 等具体类型。基础知识应依赖上面的语义关系，而不是把某一版
Runtime 类型名当成永久语言合同。

---

## 3. Task：异步工作的逻辑身份

### 3.1 普通 async 调用不会自动创建新 Task

```swift
func parse() async throws -> Model {
    let data = try await loadData()
    return try decode(data)
}
```

如果现有 Task 调用 `parse()`：

```text
调用者所在 Task
→ 同一个 Task 进入 parse
→ 同一个 Task 进入 loadData
→ loadData 可能使这个 Task 挂起
→ 恢复后仍是同一个 Task
→ 返回 parse 的调用者
```

函数边界和 Task 边界不是同一件事。只有 `async let`、task group、`Task {}`、
`Task.detached` 等创建任务的构造，才会形成新的 Task。

### 3.2 一个 Task 内部没有“自我并发”

一个 Task 在任一时刻只推进一段工作。即使它先后由不同 Thread 运行，它也不会让自己的
两个 Job 同时执行。

真正的并发来自多个 Task 可以重叠推进：

```swift
async let profile = loadProfile()
async let settings = loadSettings()

let page = try await Page(
    profile: profile,
    settings: settings
)
```

这里创建两个结构化子 Task；并不是父 Task 同时执行自己的两段代码。

### 3.3 Task 的核心状态

可以用三个高层状态理解 Task：

```text
suspended：仍有后续工作，但暂时不能或尚未获得执行机会
running：某个 Job 正在某条 Thread 上执行
completed：已经返回或抛错，不再产生后续 Job
```

“Suspended”还要分：

- 等待外部事件，例如网络结果、时钟或 continuation；
- 已经可运行，只是在等待 Executor 安排执行。

这一区分对诊断很重要。前者应调查等待对象，后者应调查 Executor 饥饿、阻塞和优先级。

### 3.4 Task handle 不是所有权开关

```swift
let handle = Task {
    try await refreshCache()
}

let result = try await handle.value
```

handle 可以：

- 等待结果或错误；
- 请求取消；
- 保持对该 Task 的明确业务身份。

丢弃 handle **不会自动取消 Task**。它只会让调用方失去定向等待和定向取消的能力。
所以“fire-and-forget”不是没有生命周期，而是把生命周期管理责任藏起来了。

---

## 4. 三种任务组织：Structured、Unstructured、Detached

### 4.1 总对比

| 构造 | 是否是当前 Task 的结构化 child | 生命周期是否受词法作用域约束 | 创建时通常继承什么 | 取消是否沿父子树传播 |
| --- | --- | --- | --- | --- |
| `async let` | 是 | 是 | priority、task-local 等结构上下文 | 是，向下传播 |
| `withTaskGroup` / `withThrowingTaskGroup` | 是 | 是 | priority、task-local 等结构上下文 | 是，向下传播 |
| `Task { ... }` | **否**，它是 unstructured task | 否 | 当前 priority、task-local、可继承的 Actor context | 没有结构化父子取消关系 |
| `Task.detached { ... }` | 否 | 否 | 不继承创建点的 priority、task-local 或 Actor context | 没有结构化父子取消关系 |

最容易混淆的是：

> `Task {}` 虽然继承创建点的很多上下文，但它仍不是 child task。

“继承上下文”和“属于结构化任务树”是两个不同维度。

### 4.2 Structured concurrency 的边界价值

```swift
func loadDashboard() async throws -> Dashboard {
    async let account = loadAccount()
    async let messages = loadMessages()
    return try await Dashboard(account: account, messages: messages)
}
```

该作用域建立了可推理边界：

```text
loadDashboard Task
├─ account child Task
└─ messages child Task
```

在 `loadDashboard()` 完成前，这两个 child 必须完成、抛错或经历取消后退出。父级不会
悄悄返回并留下一个无法定位的子操作。

task group 适合动态数量：

```swift
func loadAll(_ ids: [Int]) async throws -> [Item] {
    try await withThrowingTaskGroup(of: Item.self) { group in
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
}
```

结果默认按完成顺序被取出，不承诺输入顺序。若业务需要输入顺序，child 应返回 index，
由父级明确重排。

### 4.3 `Task {}` 的合理边界

`Task {}` 常用于：

- 从同步入口启动 async 工作；
- UI 生命周期对象持有一个可取消 handle；
- 一项工作确实需要超出当前函数调用栈，但仍希望继承 Actor context 和 task-local。

```swift
@MainActor
final class SearchModel {
    private var searchTask: Task<Void, Never>?
    private(set) var results: [ResultItem] = []

    func search(text: String) {
        searchTask?.cancel()

        searchTask = Task {
            do {
                let newResults = try await service.search(text)
                try Task.checkCancellation()
                results = newResults
            } catch is CancellationError {
                // 新搜索替代旧搜索，是这里明确允许的退出路径。
            } catch {
                // 记录或发布真实错误。
            }
        }
    }
}
```

这段 `Task` 在 `@MainActor` 隔离上下文创建，因此 closure 可继承 MainActor isolation；
但它不是 `search(text:)` 的 child。正确性来自对象保存 handle，并在替换或销毁时管理它，
不是来自结构化父子树。

### 4.4 `Task.detached` 是切断上下文，不是“更后台”

```swift
let handle = Task.detached {
    try await buildIndependentIndex()
}
```

Detached 表达：

```text
不继承创建点 Actor isolation
不继承创建点 task-local
不继承创建点 priority
没有结构化父任务
```

它并不表达：

```text
固定后台 Thread
一定并行
更高性能
低优先级
自动适合 CPU 密集工作
```

使用 detached 前应能回答：

1. 为什么这项工作不属于当前 task tree？
2. 谁保留 handle？
3. 谁请求取消并等待退出？
4. 哪些上下文必须显式传入？
5. 结果或错误交给谁？

答不出来时，优先选择 structured task 或有明确 owner 的 `Task {}`。

---

## 5. Task tree 上流动的三类上下文

### 5.1 Priority：调度提示，不是执行顺序合同

Task 有优先级。结构化 child 继承父级 priority；`Task {}` 在创建时继承当前 priority；
detached 不自动继承。

但 priority 只为 Executor 提供调度信息：

- 具体效果取决于平台和 Executor；
- 不保证立即执行；
- 不保证同优先级 FIFO；
- 不应拿来编码业务依赖或结果顺序；
- 高优先级 Task 等待较低优先级 Task 时，Runtime 可以进行 priority escalation，
  以缓解 priority inversion。

如果 B 必须在 A 后执行，应表达数据依赖或显式 `await`，而不是把 A 设为高优先级。

### 5.2 Task-local：沿异步调用链传播的动态作用域

```swift
enum TraceContext {
    @TaskLocal static var requestID: String?
}

func handleRequest() async throws {
    try await TraceContext.$requestID.withValue("req-42") {
        async let user = loadUser()
        async let orders = loadOrders()
        _ = try await (user, orders)
    }
}
```

Task-local 适合 tracing、日志关联和框架上下文：

- 通过 `withValue` 建立动态作用域，不是任意可变的全局变量；
- child task 继承绑定；
- 普通 async 调用仍在同一 Task 内，自然看见绑定；
- `Task {}` 会继承创建点的 task-local 值；
- `Task.detached` 不会自动继承；
- 值要求满足 `Sendable`，以支持安全传播。

它不适合承载必须显式审计的业务参数，也不应成为跨 detached 边界的隐式依赖。

### 5.3 Cancellation：向下传播的协作式信号

结构化任务树中，取消会向 child 传播；它不会自动反向取消 parent，也不会自动取消
sibling。取消某个 task group child，也不等于取消整个 group。

更关键的是：

```text
cancel()
→ 设置取消状态并传播信号
≠
在任意指令处强行终止 Task
```

CPU 密集循环要主动检查：

```swift
func checksum(_ bytes: [UInt8]) async throws -> UInt64 {
    var result: UInt64 = 0

    for (index, byte) in bytes.enumerated() {
        if index.isMultiple(of: 4096) {
            try Task.checkCancellation()
        }
        result &+= UInt64(byte)
    }

    return result
}
```

外部资源需要 cancellation handler：

```text
Task 被请求取消
→ handler 请求底层网络 / 文件 / 回调源停止
→ 底层完成路径与取消路径竞争
→ 一个受同步保护的一次性状态决定谁完成 continuation
→ Task 恢复并以结果或 CancellationError 退出
```

只检查 `Task.isCancelled` 而不关闭底层操作，通常只能停止上层等待，不能回收真实资源。

---

## 6. Job：Task 被 Executor 看见的粒度

### 6.1 Async 函数不是一个不可分割的大块

```swift
func refresh() async throws {
    let request = makeRequest()         // Job A 的同步工作
    let data = try await send(request)  // suspension point
    let model = try decode(data)        // Job B 的同步工作
    await store(model)                  // suspension point / isolation hop
    publishMetrics()                    // Job C 的同步工作
}
```

概念上：

```text
Task refresh
├─ Job A：makeRequest → 调用 send → 挂起
├─ Job B：send 返回 → decode → 调用 store → 挂起 / hop
└─ Job C：store 返回 → publishMetrics → 完成
```

Job 是可调度的同步片段。一个 Job 一旦开始，会一直运行到：

- 当前异步工作完成；
- 遇到实际发生的挂起；
- 为进入另一隔离执行上下文而需要让出。

这不意味着每个源码 `await` 都必然切出 Job。`await` 标记“可能挂起”；结果已就绪或
Executor 相同等情况可能允许连续推进。

### 6.2 Continuation 是后续工作，不是原 Thread

挂起时，编译器与 Runtime 保存后续所需状态：

- 下一段代码位置；
- 跨挂起点仍存活的局部值；
- 正常返回和错误路径；
- Task context；
- 恢复时必须满足的 isolation / Executor 约束。

被等待事件完成后，continuation 使 Task 的下一段 Job 可运行。它没有保存“必须回到
原 Thread”的一般合同。

### 6.3 Job 过长会伤害整个协作式调度池

没有 `await` 的长时间 CPU 循环、同步 I/O、锁等待或 semaphore 等待，会让当前 Job
一直占用 Thread：

```text
长 Job 占住 cooperative pool Thread
→ 可运行的其他 Job 得不到 Thread
→ latency 上升
→ 极端情况下形成 starvation 或依赖环
```

给函数加 `async` 不会把内部阻塞调用自动变成挂起式实现。应从底层 API 的等待合同判断，
而不是从函数签名猜测。

---

## 7. Executor：安排 Job，不选择方法实现

### 7.1 Executor 的基本合同

Executor 接受可运行 Job，并保证安排某条 Thread 执行它。常见角色：

| Executor 角色 | 主要用途 | 是否一般承诺串行 |
| --- | --- | --- |
| Global concurrent executor | 运行没有特定 Actor isolation 的并发工作 | 否 |
| Actor 的 serial executor | 保证该 Actor 的隔离 Job 不同时执行 | 是 |
| Global actor 的 executor | 让标注为同一 global actor 的声明共享隔离执行上下文 | 是 |
| Custom actor executor | 对接已有 event loop、queue affinity、特定 Thread 或调度系统 | 由实现满足 `SerialExecutor` 合同 |
| Task executor preference | 为适用的 nonisolated / structured child 工作提供执行偏好 | 取决于所选 TaskExecutor |

“Serial”只承诺互斥执行，不自动承诺严格提交顺序。Executor 可以考虑 Task priority，
Actor Runtime 也不把 mailbox 暴露为业务 FIFO。

### 7.2 什么是 Executor hop

假设当前 Task 正在 Actor A 上执行，却调用 Actor B 的隔离方法：

```text
Actor A 的 Job
→ 方法派发先确定 B.method 的实现
→ 调用要求 Actor B isolation
→ 当前 Task 在 A 上挂起
→ 后续 Job 被提交给 B 的 executor
→ B 的 executor 获得执行机会
→ 某条 Thread 运行 B.method
→ 返回后，调用者的后续 Job 回到满足 A isolation 的 executor
```

这个切换叫 executor hop。它解决的是“在哪里可以安全执行”，不是“调用哪个实现”。

### 7.3 `await`、挂起和 hop 是三个不同判断

| 问题 | 可能答案 |
| --- | --- |
| 源码是否写 `await` | 说明调用点允许潜在挂起 |
| 运行时是否真的挂起 | 结果是否就绪、callee 是否实际让出等共同决定 |
| 是否发生 executor hop | caller 与 callee 的 isolation / execution semantics 是否要求不同 Executor |

同一 Actor 上的 async 调用可能不需要 hop；nonisolated async 的执行位置又会受
Swift 6.2 相关 feature 与构建设置影响。不能把三者压缩成“遇到 await 就切线程”。

### 7.4 Executor 不等于 Thread

一个 serial executor 可以先后使用不同 Thread，只要它满足互斥执行合同。反过来，一条
Thread 也可以先后运行来自多个 Executor 的 Job。

只有明确的系统互操作合同要求 thread affinity 时，才应依赖特定 Thread；这通常是
custom executor 或平台入口的高级边界，而不是一般业务代码的默认假设。

---

## 8. Actor：隔离状态，而不是包住整段异步事务

### 8.1 Actor isolation 的核心保证

```swift
actor Counter {
    private var value = 0

    func next() -> Int {
        value += 1
        return value
    }
}
```

Actor 的实例属性和实例方法默认 actor-isolated。外部代码不能同步直接访问 `value`；
跨 Actor 调用 `next()` 时，需要让调用所在 Task 在 Counter 的隔离执行上下文推进：

```swift
let value = await counter.next()
```

这里即使 `next()` 本身是同步声明，跨 Actor 边界的调用仍是异步的，因为调用者可能要等
Counter 的 executor 获得执行机会。

Actor 保护的是：

```text
同一 Actor 的隔离可变状态
→ 不被两个 Actor-isolated Job 同时访问
```

它不自动保护：

- Actor 外部的全局可变状态；
- 通过 `nonisolated` 或 unsafe escape hatch 暴露的状态；
- 跨多个 Actor 的业务不变量；
- 含 `await` 方法从开头到结尾的原子性；
- 业务事件顺序。

### 8.2 `nonisolated`：退出隔离，而不是“后台执行”

```swift
actor UserStore {
    nonisolated let schemaVersion = 3

    private var users: [Int: User] = [:]

    nonisolated func formatKey(_ id: Int) -> String {
        "user:\(id)"
    }

    func user(id: Int) -> User? {
        users[id]
    }
}
```

同步 `nonisolated` member：

- 可从任意隔离域同步调用；
- 不能访问 Actor-isolated mutable state；
- 不表示把工作提交到 global queue。

`nonisolated async` 的执行语义有 Swift 6.2 feature 边界，不能套用一条跨版本口诀；
后文单独说明。

### 8.3 `isolated` parameter：让函数借用一个 Actor 的隔离

```swift
func currentBalance(
    of account: isolated BankAccount
) -> Int {
    account.balance
}
```

调用方跨边界时需要 `await`，而函数体已运行在 `account` 的 isolation 上，因此可以同步
访问其隔离成员。它适合把一段逻辑明确绑定到某个 Actor，减少重复 hop。

一次函数执行只能拥有相容的隔离上下文。`isolated` parameter 不是获得多个 Actor 状态的
“万能锁”；涉及另一个 Actor 时仍要跨边界。

### 8.4 Global actor：给分散声明一个共同隔离域

```swift
@globalActor
actor DatabaseActor {
    static let shared = DatabaseActor()
}

@DatabaseActor
final class Repository {
    private var cache: [String: Record] = [:]

    func record(for key: String) -> Record? {
        cache[key]
    }
}
```

Global actor 可标注类型、函数和属性，让它们共享一个全局隔离域。`MainActor` 是标准库
提供的 global actor。

在 Apple 平台，MainActor 的执行器与主执行环境紧密对应；但代码层应依赖
`@MainActor` isolation，而不是用 `Thread.isMainThread` 代替类型系统合同。MainActor
同样不意味着“函数里所有工作都很轻”；在其 Job 内执行长 CPU 工作仍会阻塞 UI 推进。

### 8.5 Actor reentrancy：`await` 两侧不是一个事务

```swift
actor Inventory {
    private var stock = 1

    func reserve() async throws -> Bool {
        guard stock > 0 else { return false }

        let approved = try await askRemoteApproval()

        // 挂起期间，另一个 Task 可能已经进入 Inventory 并修改 stock。
        guard approved, stock > 0 else { return false }
        stock -= 1
        return true
    }
}
```

时间线：

```text
Task A 进入 Inventory，看到 stock == 1
→ A 在 askRemoteApproval 挂起
→ Inventory executor 可以运行 Task B 的 Job
→ B 把 stock 改为 0
→ A 恢复
→ A 必须重新验证 stock
```

可重入带来两个好处：

- Actor 不因一个挂起操作被整段占住；
- 减少 Actor 之间相互等待导致的死锁机会，并允许更合理的优先级调度。

代价是必须显式维护跨 `await` 不变量。常用设计：

1. **挂起前提交状态**：先写入“reserved / in-flight”状态，再发起外部操作；
2. **恢复后重新验证**：用版本号、generation、identity 检查结果是否仍适用；
3. **两阶段与补偿**：外部操作失败时回滚或补偿；
4. **缩小隔离片段**：把纯计算移出 Actor，只把状态读写留在 Actor；
5. **避免把顺序寄托给 mailbox**：用 sequence number 或显式状态机表达业务顺序。

### 8.6 Actor 串行不等于严格 FIFO

同一 Actor 的隔离 Job 不会同时执行，但等待 Actor 的 Task 不保证按最初到达顺序运行。
Runtime 可以考虑优先级和其他调度因素。

所以：

```swift
Task { await recorder.append("A") }
Task { await recorder.append("B") }
```

不构成稳定的 `"A", "B"` 业务顺序合同。若顺序重要，应由一个 Task 顺序 `await`，或给
事件编号并由 Actor 按业务规则接收。

---

## 9. `Sendable`、`sending` 与 Region-based Isolation

### 9.1 三层问题

跨 isolation boundary 时，编译器依次关心：

```text
类型层：这种类型的值一般能否安全跨并发域？         → Sendable
函数层：这个 closure 能否安全在并发域之间传递？     → @Sendable
值与控制流层：这个特定 non-Sendable 值能否移交一次？ → sending + region analysis
```

它们都不决定方法走 direct、vtable、witness 还是 Objective-C message。

### 9.2 `Sendable` 是类型合同

```swift
struct Snapshot: Sendable {
    let generation: Int
    let values: [Int]
}
```

`Sendable` 表达该类型的值可以安全跨 concurrency domain。可满足它的设计包括：

- 由 `Sendable` 成员组成的 value-semantic 类型；
- 不可变且安全共享的引用类型；
- 内部正确同步的引用类型；
- Actor reference；
- `@Sendable` closure。

因此：

```text
Sendable ≠ 只能是 struct
Sendable ≠ 一定深拷贝
Sendable ≠ 一定不可变
Sendable ≠ 自动没有逻辑竞态
```

`@unchecked Sendable` 只是把证明责任从编译器转给作者。它应有可审计的 immutable、
lock、atomic 或其他同步不变量，不能当作消除诊断的标签。

### 9.3 `@Sendable` 约束 closure 及其捕获

并发边界使用的 closure 常要求 `@Sendable`。编译器会检查捕获值是否安全：

```swift
let requestID = "req-42"

let operation: @Sendable () async -> Void = {
    await logger.write(requestID)
}
```

捕获一个可被其他代码同时修改的局部变量或 non-Sendable reference，可能产生：

```text
capture of non-Sendable type in a @Sendable closure
task-isolated value passed as a strongly transferred parameter
sending ... risks causing data races
```

修复方向是重新设计所有权和隔离，而不是机械添加 `@unchecked Sendable`。

### 9.4 `sending` 是特定值的移交合同

有些 reference type 本身不是 `Sendable`，但一个刚创建、没有其他别名且移交后不再使用
的实例，可以安全地交给另一隔离域：

```swift
final class Packet {
    var bytes: [UInt8] = []
}

actor Sink {
    private var totalBytes = 0

    func consume(_ packet: sending Packet) {
        totalBytes += packet.bytes.count
    }
}

func sendOnce(to sink: Sink) async {
    let packet = Packet()
    packet.bytes = [1, 2, 3]
    await sink.consume(packet)

    // 此后不要再使用 packet；它已被移交给 Sink 的隔离域。
}
```

如果移交后再次访问：

```swift
await sink.consume(packet)
print(packet.bytes) // error：发送后的访问可能与 Sink 内访问形成数据竞争
```

`sending`：

- 不让 `Packet` 类型整体变成 `Sendable`；
- 不隐式深拷贝对象；
- 不要求运行时搬迁内存；
- 表达调用边界上的值所有权 / isolation transfer；
- 让编译器在后续别名使用处给出诊断。

### 9.5 Region-based isolation 是编译器的别名分析模型

Region 可以理解为：

> 在某个程序点，可能通过引用关系相互到达的一组 non-Sendable 值。

如果一个值刚创建、没有连接到其他仍会被使用的 non-Sendable 值，它处于 disconnected
region。编译器可以允许把这个 region 发送到 Actor，然后禁止发送方继续使用相关别名。

这是一种控制流敏感的静态分析，不是：

- Runtime 中真实分配的“Region 对象”；
- 自动锁；
- garbage collector；
- 深拷贝机制。

诊断一个 `sending` 错误时，要追踪的不只是变量名，还包括可能与它同 region 的别名、
closure capture、容器和对象字段。

---

## 10. Task、Thread、Queue、Executor、Actor 的工程对比

| 维度 | Task | Thread | DispatchQueue | Executor | Actor |
| --- | --- | --- | --- | --- | --- |
| 抽象层 | Swift 异步逻辑 | OS 执行资源 | Dispatch 提交与排序原语 | Swift 并发调度服务 | Swift 隔离域 |
| 生命周期 | 跨多次挂起恢复 | 由 OS / Runtime 管理 | 队列对象长期存在 | 服务可长期存在 | Actor 实例生命周期 |
| 是否携带结果 | 可以 | 不直接表达 Swift async 结果 | 提交的 block 自行处理 | 不拥有业务结果 | 方法调用产生结果 |
| 取消 | Task 的协作式状态 | 不是 Swift 结构化取消 | Work item 有不同语义 | 调度 Job，不定义业务取消 | 调用所在 Task 的取消 |
| 优先级 | TaskPriority 与 escalation | OS thread priority | QoS | 可参考 Task priority | Job 调度可参考 priority |
| 状态安全 | 本身不隔离共享状态 | 本身不提供 | serial queue 需人为维护约束 | 本身不定义数据所有权 | 编译器检查 Actor isolation |
| 是否固定线程 | 否 | 自身就是 Thread | 未必 | 一般不 | 一般不；MainActor / custom affinity 是特殊合同 |
| 顺序合同 | 由控制流决定 | 无业务顺序 | serial queue 通常按 Dispatch 合同入队 | serial 只保证互斥，不一般保证 FIFO | 不保证消息严格 FIFO |

### 10.1 为什么 Task-local 不能换成 Thread-local

Task 可在不同 Thread 间恢复。如果把 request ID 存在线程局部变量：

```text
Job A 在 Thread 1 写入 thread-local
→ Task 挂起
→ Job B 在 Thread 3 恢复
→ Thread 3 看不到正确上下文，或看到另一个 Task 的值
```

Task-local 跟随逻辑 Task，而不是物理 Thread，才与 async 控制流一致。

### 10.2 为什么 SerialQueue 迁移成 Actor 不能只做语法替换

迁移前要重新检查：

- 原代码是否依赖 Dispatch FIFO；
- 是否有 queue-specific key 或 thread-local；
- 是否允许 callback 在锁 / queue 上同步回调；
- 是否使用 barrier、target queue、QoS；
- Actor reentrancy 会不会改变跨异步调用的不变量；
- callback API 的取消与 continuation 怎样接回 Task；
- 旧 queue 是否仍被 Objective-C 或 C++ consumer 使用。

Actor 提供更强的静态隔离表达，但不是所有 Dispatch 行为的逐项同义替代。

---

## 11. Continuation：把外部完成事件接回原 Task

### 11.1 正确模型

```swift
func beginOperation(
    completion: @escaping @Sendable (Result<Data, any Error>) -> Void
) {
    // 遗留 callback API
}

func load() async throws -> Data {
    try await withCheckedThrowingContinuation { continuation in
        beginOperation { result in
            continuation.resume(with: result)
        }
    }
}
```

线路是：

```text
当前 Task 调用 withCheckedThrowingContinuation
→ operation closure 立即在当前上下文启动 callback API
→ 当前 Task 挂起
→ callback 在任意被合同允许的执行环境触发
→ resume 使原 Task 的后续 Job 变为可运行
→ 合适的 Executor 重新调度它
→ await 表达式返回或抛错
```

`resume` 不等于：

- 立刻在 callback 当前调用栈执行后续 async 代码；
- 选择后续 Thread；
- 跳过 Actor isolation；
- 创建一个新 Task。

### 11.2 Exactly-once 是硬合同

每条执行路径必须且只能恢复一次：

```text
漏掉 resume
→ Task 永久挂起，持有的资源和调用链无法完成

重复 resume
→ continuation 合同被破坏；checked 版本会报告 misuse
```

默认优先使用 checked continuation。只有在性能数据证明检查成本关键，并且 exactly-once
已被严格封装和测试时，才考虑 unsafe continuation。

### 11.3 同步回调也必须正确

遗留 API 可能在 `beginOperation` 返回前同步调用 completion。桥接代码不能假定 callback
一定“稍后”发生。Continuation API 允许这种情况：`resume` 先把 Task 标记为可继续，
真正后续执行仍由 Executor 调度。

### 11.4 Cancellation 不会自动穿过 callback API

Continuation 只桥接完成，不自动给旧 API 添加取消。完整 adapter 需要一个受同步保护的
一次性状态机：

```text
pending
├─ callback 抢先：resume(result)，状态变 completed
└─ cancellation 抢先：cancel underlying operation，
                     resume(throwing: CancellationError)，状态变 completed

后到的一方只能观察 completed，不能再次 resume
```

如果底层 API 不能取消，也要明确：上层取消是继续等待、丢弃迟到结果，还是立即让上层
Task 完成；不能让 continuation 悬空。

---

## 12. Custom Executor：高级互操作边界

### 12.1 Custom actor executor 解决什么

SE-0392 允许 Actor 提供自己的 serial executor。合理场景：

- 旧系统要求所有调用进入现有 serial DispatchQueue；
- event-loop Runtime 要求在它管理的 Thread 上执行；
- C / C++ 库依赖 thread-local 或固定 Thread；
- 多个 Actor 有经过测量的共置需求；
- 特殊硬件或平台调度器有明确 affinity。

Actor 通过 `unownedExecutor` 暴露其 executor。这里的 “unowned” 是底层引用与生命周期
合同；实现者必须保证 executor 生命周期覆盖 Actor 的使用，并正确实现
`SerialExecutor` 的 enqueue 与 identity 语义。

### 12.2 共享 Executor 不会合并 Actor identity

两个 Actor 可以共享同一个 serial executor：

```text
Actor A isolation ─┐
                  ├─ Shared SerialExecutor
Actor B isolation ─┘
```

结果是它们的 Job 不会物理并发，但 A 和 B 仍是不同 isolation domain。代码不能因为
底层 Executor 相同，就绕过跨 Actor 的类型系统规则。

反过来，Executor identity 与 Actor identity 也不应随意混为一谈；custom executor 的
兼容性检查和 wrapper 设计属于 Runtime 专家边界。

### 12.3 Task executor preference 是另一条轴

SE-0417 引入 Task executor preference，用于控制适用的 Task / nonisolated 工作更倾向
在哪个 TaskExecutor 上执行。其关键边界：

- structured child 可以继承 preference；
- `Task {}` 和 `Task.detached` 作为 unstructured task 不自动继承这项 preference；
- 进入明确 Actor isolation 的代码仍必须满足该 Actor 的 executor；
- custom-executor Actor 不会被一个 Task preference 改写；
- preference 影响“在哪里执行”，不改变 Actor isolation 或方法派发。

一般应用代码应首先依赖 Task、Actor 和系统 Executor。只有存在真实 affinity、legacy
integration 或已测量的调度问题时，才进入 custom executor API；不要为了“控制线程”
而过早接管 Runtime 调度。

---

## 13. Swift 6.2 / 6.3：默认 Isolation 与 Async 执行语义

这一节必须把三类配置分开：

```text
Swift compiler / toolchain 版本
Swift language mode 与 strict concurrency 检查
模块的 default actor isolation 与 upcoming feature
```

只说“项目使用 Swift 6.3”仍不足以判断一个未标注函数的 isolation。

### 13.1 Default actor isolation 是模块设置

Swift 6.2 提供了让未标注声明默认推断为 `MainActor` 的选项。常见入口：

- 编译器：`-default-isolation MainActor` 或 `nonisolated`；
- Xcode：`SWIFT_DEFAULT_ACTOR_ISOLATION`；
- SwiftPM（PackageDescription 6.2 起）：
  `.defaultIsolation(MainActor.self)`。

按 SE-0466，未提供设置时模块默认仍是 `nonisolated`；当前模块的选择也不会反向改变已
编译依赖模块的 isolation。MainActor default isolation 是一组 inference 规则，不是
简单文本替换：显式 isolation、Actor 内声明、从 superclass / override / protocol
conformance 推断的 isolation，以及若干不能带 global actor 的声明都有自己的规则。

如果模块选择 MainActor 默认隔离：

```swift
// 在 -default-isolation MainActor 的模块中
final class AppModel {
    var title = ""

    func updateTitle() {
        title = "Ready"
    }
}
```

未标注的 `AppModel` 和相关声明会按该设置获得 MainActor inference。若未选择该设置，
不能因为编译器版本是 6.2 或 6.3 就假定所有代码自动 `@MainActor`。

库作者尤其应谨慎：默认 isolation 会进入公开 API 的隔离合同，影响其他模块的调用方式。

### 13.2 `NonisolatedNonsendingByDefault` 是独立 upcoming feature

历史规则来自 SE-0338：

```text
普通 nonisolated async
→ 离开调用者 Actor
→ 在与 Actor 无关的 generic / global concurrent executor 上运行
```

SE-0461 与 Swift 6.2 提供的 upcoming feature 改变默认：

```text
启用 NonisolatedNonsendingByDefault
→ 普通 nonisolated async 默认在调用者的 isolation / execution context 上运行
→ 不仅因为写了 async 就自动引入并发
```

需要明确离开 Actor、允许并发执行时，使用：

```swift
@concurrent
func decodeLargePayload(_ data: Data) async throws -> Model {
    try decode(data)
}
```

过渡期还可以显式写：

```swift
nonisolated(nonsending)
func stayWithCaller() async {
    await Task.yield()
}
```

它表达函数随调用者 Actor 执行，语义不依赖该 upcoming feature 是否开启。

### 13.3 版本矩阵

| 配置 | 未标注声明默认 isolation | 普通 nonisolated async | 显式 `@concurrent async` |
| --- | --- | --- | --- |
| default isolation = `nonisolated`，feature 关闭 | nonisolated | 按 SE-0338 离开 Actor，在 generic executor 运行 | 离开 Actor，允许并发执行 |
| default isolation = `nonisolated`，feature 开启 | nonisolated | 按 SE-0461 留在 caller execution context | 离开 Actor，允许并发执行 |
| default isolation = `MainActor`，feature 关闭 | 未标注声明通常推断 MainActor | 显式退出 isolation 后仍按旧 nonisolated async 规则 | 明确离开 MainActor |
| default isolation = `MainActor`，feature 开启 | 未标注声明通常推断 MainActor | 显式 nonisolated async 默认随 caller context | 明确离开 MainActor |

真实 inference 还会受声明种类、显式标注、protocol requirement、override 和导入模块 API
合同影响，表格用于建立方向，不替代编译器诊断。

### 13.4 Swift 6.3 没有把这些选项压成一个固定默认

Swift 6.3 于 2026 年 3 月发布。它延续前述语言能力，但“6.3”本身不能回答：

- 模块是否启用 MainActor default isolation；
- 是否启用 `NonisolatedNonsendingByDefault`；
- 依赖模块用什么 language mode 编译；
- API 是 `@concurrent`、`nonisolated(nonsending)` 还是 Actor-isolated。

诊断项目时应记录：

```text
swiftc --version
SWIFT_VERSION / language mode
SWIFT_STRICT_CONCURRENCY
SWIFT_DEFAULT_ACTOR_ISOLATION
SWIFT_UPCOMING_FEATURE_NONISOLATED_NONSENDING_BY_DEFAULT
Package.swift 中的 swiftLanguageMode、defaultIsolation 与 upcomingFeature
每个依赖模块公开 API 的 isolation
```

旧文章写的“nonisolated async 一定去全局执行器”，以及新文章写的“async 默认永远留在
调用者”，都只有在相应构建配置下才成立。

---

## 14. 与四种方法派发正交：把并发知识挂回主干

### 14.1 总对比

| 方法派发线路 | 先怎样选择实现 | 可附着的并发语义 | Executor 是否参与实现选择 |
| --- | --- | --- | --- |
| Direct dispatch | 编译期已知函数地址，或经优化后直接调用 | async 状态机、Actor isolation、`@concurrent`、Task cancellation | 否 |
| Class vtable dispatch | 根据动态 class type 从 vtable 选择 override | override 继承 / 声明 isolation；选中 async override 后再发生挂起或 hop | 否 |
| Protocol witness dispatch | 根据 conformance 的 witness table 选择 requirement 实现 | async requirement、Actor conformer、`Sendable` protocol、existential 跨隔离调用 | 否 |
| Objective-C message dispatch | selector 通过 Objective-C Runtime 查找 IMP | completion-handler bridge、`@MainActor` 入口、continuation、取消适配 | 否 |

Executor 只接收“已经知道要执行什么”的 Job。它不会：

- 做 Swift overload resolution；
- 从 vtable 找 override；
- 从 witness table 找 conformance witness；
- 用 selector 查 IMP。

### 14.2 Direct dispatch + Actor hop

```swift
actor Counter {
    private var value = 0

    func next() -> Int {
        value += 1
        return value
    }
}

func read(_ counter: Counter) async -> Int {
    await counter.next()
}
```

`counter` 的静态具体类型已知，`next()` 的实现可以直接确定；但调用仍跨 Actor isolation：

```text
direct 选择 Counter.next
→ 检查 Counter instance isolation
→ 必要时 hop 到 counter executor
→ 执行同步 Job
→ 返回调用者合法的 isolation context
```

“直接派发”不等于“不需要 await”，也不等于“在当前 Thread 立即完成”。

### 14.3 Class vtable + Global actor

```swift
@MainActor
class Screen {
    func refresh() async {}
}

@MainActor
final class DetailScreen: Screen {
    override func refresh() async {
        // 更新隔离到 MainActor 的状态
    }
}

func update(_ screen: Screen) async {
    await screen.refresh()
}
```

线路：

```text
screen 的动态 class type
→ vtable 选择 DetailScreen.refresh
→ isolation 要求 MainActor
→ 必要时 hop 到 MainActor executor
→ 在同一个调用 Task 中推进 async override
```

Vtable 决定“哪个 override”，MainActor 决定“在哪个隔离执行上下文运行”。

### 14.4 Protocol witness + Actor conformer

```swift
protocol Store: Sendable {
    func load(_ key: String) async -> String?
}

actor Cache: Store {
    private var values: [String: String] = [:]

    func load(_ key: String) async -> String? {
        values[key]
    }
}

func read(_ store: any Store) async -> String? {
    await store.load("token")
}
```

一次 existential 调用同时包含：

```text
any Store 的 existential container
→ conformance metadata / witness table 选择 Cache.load
→ witness 的 Actor isolation 要求进入 Cache instance
→ 当前 Task 必要时 hop 到 Cache executor
→ 执行 load 的 Job
→ 结果跨回调用者
```

`Store: Sendable` 说明 conforming value 可安全跨 concurrency domain；witness table 说明
requirement 的实现。二者在同一协议出现，职责仍完全不同。

### 14.5 Objective-C message + Continuation

假设旧对象以 selector 和 completion handler 提供 API：

```text
Swift 调用 ObjC 对象的 loadWithCompletion:
→ objc_msgSend 按 selector 找到 IMP
→ IMP 启动异步操作并立即返回
→ Swift Task 在 continuation 处挂起
→ completion 被 Objective-C 侧调用
→ continuation.resume 使 Swift Task 可运行
→ Executor 在合法 isolation 上恢复 Task
```

这里至少有三层机制：

```text
Objective-C message dispatch：选择 IMP
Continuation：桥接 callback 与挂起 Task
Executor / Actor：安排恢复并维护 isolation
```

把 completion API 自动或手动导入为 Swift async，不会把 Objective-C message dispatch
变成 witness dispatch，也不会让 continuation 自己承担 Actor 安全。

---

## 15. 常见误区及其准确替代

### “`async` 就是在后台线程执行”

错误。`async` 只允许挂起。函数可能留在 MainActor，也可能进入其他 Actor，或按
`@concurrent` / nonisolated 规则运行。

### “一次 async 调用会创建一个 Task”

错误。普通 async 调用仍在当前 Task。创建新 Task 要使用明确的任务构造。

### “`Task {}` 是当前 Task 的 child”

错误。它是 unstructured task，只是会继承创建点的若干上下文。

### “`Task.detached` 更适合耗时任务”

错误。Detached 只表示切断结构与上下文继承；是否适合取决于生命周期、所有权和资源
约束。

### “每个 `await` 都会切换 Thread”

错误。`await` 是潜在挂起点；实际挂起、executor hop 和 Thread 变化是不同判断。

### “Actor 是一条严格 FIFO serial queue”

错误。Actor serial executor 保证隔离 Job 不并发执行，不保证等待者严格 FIFO。

### “Actor 方法整体是原子的”

错误。Actor-isolated function 在 `await` 处可重入，隔离状态可能变化。

### “MainActor 上的代码一定不会卡 UI”

错误。MainActor 提供 isolation，不会自动把同步 I/O 或重 CPU 工作变成挂起式执行。

### “`Sendable` 会复制对象”

错误。它是安全跨域的类型合同；可能是值复制、不可变共享、内部同步或 Actor reference。

### “`sending` 等于 `Sendable`”

错误。`sending` 允许一个具体 region 被移交，并限制发送后的使用；它不改变整个类型。

### “`cancel()` 会立即终止 Task”

错误。取消是协作式状态，代码和底层 API 必须响应。

### “Continuation 的 `resume` 会立刻在当前 callback Thread 继续”

错误。`resume` 让后续 Job 可调度，Executor 决定何时以及由哪条 Thread 执行。

### “Executor 决定调用哪个方法”

错误。方法派发先选实现，Executor 后安排该实现产生的 Job。

---

## 16. 编译诊断：沿正确轴定位

### 16.1 “actor-isolated property / method cannot be referenced”

检查：

```text
当前代码属于哪个 isolation domain
→ 目标声明属于哪个 Actor / global actor
→ 调用能否改为 async 并 await hop
→ 调用者本身是否应标注同一 global actor
→ 逻辑是否应移动成目标 Actor 的方法
→ 该成员是否真正不依赖隔离状态，才考虑 nonisolated
```

不要先用 `nonisolated(unsafe)`、`MainActor.assumeIsolated` 或关闭检查掩盖边界。

### 16.2 “sending ... risks causing data races”

画出值的 region：

```text
值在哪里创建
→ 被哪些变量 / 对象 / closure 捕获
→ 哪一次调用把它发送到另一 isolation
→ 发送后哪里仍在访问
→ 能否改为 Sendable snapshot
→ 能否转移后停止使用
→ 能否让同一 Actor 持有整个生命周期
```

诊断常标在“发送点”，真正冲突可能是后续使用或隐藏别名。

### 16.3 “capture of non-Sendable type in @Sendable closure”

判断捕获属于哪类：

- 可改成 immutable `Sendable` value snapshot；
- 可把可变状态放入 Actor；
- 可让内部同步类型正确实现 `Sendable`；
- 可把 closure 留在原 isolation，不跨并发边界；
- 只有已有同步证明时才用 `@unchecked Sendable`。

### 16.4 Task 不响应取消

```text
是否保留并取消了正确 handle
→ unstructured / detached 是否根本不在父子取消树中
→ CPU loop 是否检查取消
→ 系统 async API 是否感知取消
→ callback adapter 是否取消底层资源
→ cleanup 是否又阻塞或漏 resume
```

### 16.5 Actor 中结果过期或顺序错误

```text
列出每个 await
→ 在 await 前记录依赖的不变量
→ 枚举挂起期间可进入 Actor 的其他方法
→ 恢复后重新读取 / 校验 generation
→ 业务是否错误依赖 Actor FIFO
→ 用一个 Task 串行提交或显式 sequence number 修复
```

### 16.6 Async 系统偶发 hang

```text
Task 是等待外部事件，还是 ready 但没被调度
→ continuation 是否每条路径 exactly once
→ cooperative pool 是否被同步 I/O / semaphore / lock 占满
→ Actor 之间是否形成 await 环
→ 取消路径是否关闭资源但没有完成 Task
→ unstructured Task 的 handle 是否被丢弃
```

### 16.7 同一代码在两个 Target 行为不同

首先比较：

```text
compiler / Xcode toolchain
Swift language mode
strict concurrency
default actor isolation
NonisolatedNonsendingByDefault upcoming feature
依赖模块的编译配置与公开 isolation
```

不要只比较源码。Swift 6.2 起，模块构建设置本身就是 isolation 语义的一部分。

---

## 17. 设计与审查清单

为一个异步功能画图时，逐项回答：

1. 哪个现有 Task 发起调用？
2. 普通 async call 与“新建 Task”的边界分别在哪里？
3. 新 Task 是 structured、unstructured 还是 detached，为什么？
4. 谁拥有每个 unstructured Task 的 handle？
5. Task tree 的 parent / child 生命周期是否闭合？
6. priority、task-local 和 Actor context 应继承还是显式传入？
7. 取消从哪里发出，能传播到哪些 child？
8. 哪些循环或底层 API实际响应取消？
9. 每个 suspension point 前后哪些不变量可能变化？
10. 哪些 Job 可能过长、阻塞 cooperative pool？
11. 每段代码属于哪个 Actor / global actor isolation？
12. 哪些调用需要 executor hop？
13. 跨 isolation 的值是 `Sendable`，还是通过 `sending` 移交？
14. 是否存在同 region 的隐藏别名或发送后使用？
15. Continuation 是否覆盖成功、失败、取消与同步回调，并 exactly once？
16. 方法实现通过 direct、vtable、witness 还是 Objective-C message 选择？
17. 是否误把 Executor 当成方法派发器？
18. 是否依赖 Actor FIFO、Thread identity 或 priority 来表达业务顺序？
19. 是否真的需要 custom executor，真实 affinity 合同是什么？
20. 当前 Target 的 Swift 版本、language mode、default isolation 和 upcoming feature 是什么？

这些问题有答案后，Task / Actor 设计才从“能编译”上升到“可推理”。

---

## 18. 完整线路摘要

```text
调用点先完成 Swift / Objective-C 的方法派发
→ 具体 async 实现在当前 Task 中开始推进
→ Task 携带 priority、cancellation、task-local 与结果生命周期
→ Task 的同步执行片段形成 Job
→ Job 在 suspension point 让出 Thread
→ continuation 使后续 Job 重新可运行
→ Executor 安排 Thread 执行 Job
→ Actor / global actor isolation 约束合法 Executor
→ Actor 在 await 处可重入，所以恢复后重验不变量
→ Sendable 证明类型可跨域，sending + region analysis 证明特定值可移交
→ structured task tree 封闭生命周期并传播上下文与取消
→ unstructured / detached 必须由明确 owner 补足生命周期管理
→ Swift 6.2 / 6.3 项目还要核对 default isolation 与 upcoming feature
```

最短结论：

```text
Dispatch 选择实现
Task 保存逻辑身份
Job 提供调度粒度
Executor 安排执行机会
Thread 真正执行指令
Actor 保护隔离状态
Sendable / sending 约束跨域数据
Structured concurrency 约束生命周期
```

上一条：[并发与并行](03-concurrency-and-parallelism.md)。

---

## 一级资料

### 语言与运行时主干

- [The Swift Programming Language — Concurrency](https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html)
- [SE-0296: Async/await](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0296-async-await.md)
- [SE-0304: Structured Concurrency](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0304-structured-concurrency.md)
- [SE-0317: `async let` Bindings](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0317-async-let.md)
- [Swift Standard Library — Task](https://developer.apple.com/documentation/swift/task/)
- [Swift Standard Library — ExecutorJob](https://developer.apple.com/documentation/swift/executorjob)
- [Swift Standard Library — Executor](https://developer.apple.com/documentation/swift/executor)
- [Swift Standard Library — SerialExecutor](https://developer.apple.com/documentation/swift/serialexecutor)

### Actor 与 Executor

- [SE-0306: Actors](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0306-actors.md)
- [SE-0313: Improved Control over Actor Isolation](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0313-actor-isolation-control.md)
- [SE-0316: Global Actors](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0316-global-actors.md)
- [SE-0392: Custom Actor Executors](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0392-custom-actor-executors.md)
- [SE-0417: Task Executor Preference](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0417-task-executor-preference.md)

### 数据跨隔离域

- [SE-0302: `Sendable` and `@Sendable` Closures](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0302-concurrent-value-and-concurrent-closures.md)
- [SE-0414: Region-based Isolation](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0414-region-based-isolation.md)
- [SE-0430: `sending` Parameter and Result Values](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0430-transferring-parameters-and-results.md)
- [SE-0311: Task Local Values](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0311-task-locals.md)

### Continuation 与 Objective-C 桥接

- [SE-0300: Continuations for Interfacing Async Tasks with Synchronous Code](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0300-continuation.md)
- [SE-0297: Concurrency Interoperability with Objective-C](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0297-concurrency-objc.md)
- [Swift Standard Library — CheckedContinuation](https://developer.apple.com/documentation/swift/checkedcontinuation)

### Swift 6.2 / 6.3 版本边界

- [Swift 6.2 Released — Approachable Concurrency](https://www.swift.org/blog/swift-6.2-released/)
- [SE-0466: Control Default Actor Isolation Inference](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0466-control-default-actor-isolation.md)
- [SE-0338: Clarify the Execution of Non-Actor-Isolated Async Functions](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0338-clarify-execution-non-actor-async.md)
- [SE-0461: Run Nonisolated Async Functions on the Caller's Actor by Default](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0461-async-function-isolation.md)
- [Compiler Diagnostic: Nonisolated Nonsending By Default](https://docs.swift.org/compiler/documentation/diagnostics/nonisolated-nonsending-by-default/)
- [SwiftPM: `SwiftSetting.defaultIsolation`](https://docs.swift.org/swiftpm/documentation/packagedescription/swiftsetting/defaultisolation%28_%3A_%3A%29/)
- [Xcode Build Settings Reference](https://developer.apple.com/documentation/xcode/build-settings-reference)
- [Swift 6.3 Released](https://www.swift.org/blog/swift-6.3-released/)
