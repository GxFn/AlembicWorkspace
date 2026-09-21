# 同步调用与阻塞等待：两条不同的轴

同步调用不等于阻塞等待。它们有时同时出现，所以容易被当成同一件事；但二者回答的是不同问题：

- **同步 / 异步**描述调用者与工作完成之间的控制关系：调用表达式何时完成，结果或错误何时可用。
- **阻塞 / 挂起**描述等待期间执行资源如何被占用：底层线程是否被留在原地等待，还是 Swift 任务让出线程、稍后再恢复。

还要再分开两个常被混入的概念：

- **忙碌执行**：线程正在做 CPU 计算，没有等待，却仍被长时间占用。
- **串行 / 并发、顺序 / 并行**：描述工作如何组织、是否可能同时推进，与调用是否同步也不是同一轴。

这一区分是理解 Swift 并发的起点。只有先判断“谁在等、等什么、占着什么资源”，才能正确讨论 `async`、`await`、actor、锁、信号量和 Dispatch 队列。

> 本文的事实分为三层：Swift 语言语义、Swift 标准库语义、Apple 平台 API / 运行时行为。某个 Apple API 会阻塞线程，不代表 Swift 语言把普通函数定义成了“阻塞函数”；某次实现恰好切换了线程，也不代表 API 具有这个语言保证。

---

## 1. 先建立四组互相独立的坐标

### 1.1 同步与异步：看完成边界

普通同步函数调用在语义上形成一条完整的调用链：

```text
调用者
  └─ 调用同步函数
       ├─ 正常 return
       ├─ throw
       └─ 永不返回
  └─ 调用者才可能继续执行
```

在 Swift 语言中，普通函数不会在中途产生 Swift 并发意义上的隐式挂起点。函数必须先返回、抛出错误，或者永不返回，调用表达式才算有结论。

`async` 函数则允许中途挂起。调用它通常需要 `await`，但 `await` 的准确含义是“这里**可能**挂起”，并不保证每次都真的挂起，也不等于创建新线程：

```swift
func loadProfile() async throws -> Profile {
    try await service.fetchProfile()
}
```

这里的调用任务在逻辑上仍然等待 `Profile` 或错误；不同之处是，等待期间它可以让出执行资源，底层线程可去运行其他任务。

回调式 API 又是另一种异步边界：

```swift
func submit(_ work: @escaping @Sendable () -> Void) {
    DispatchQueue.global(qos: .utility).async(execute: work)
}
```

`submit` 本身是一个同步函数：它完成入队后就返回。真正的 `work` 在另一个动态调用链中执行。这里的“异步”来自 API 的回调契约与 Dispatch 提交方式，不是因为 `submit` 被声明成了 Swift `async` 函数。

### 1.2 阻塞、挂起与忙碌：看线程占用

| 状态 | 当前工作能否继续 | 底层线程的典型状态 | 典型例子 |
|---|---|---|---|
| 正常同步执行 | 能，持续向前执行 | 正在运行 | 解析小型值、数组变换 |
| 忙碌执行 | 能，但计算很久 | 持续占用 CPU | 大量压缩、图像处理、死循环 |
| 阻塞等待 | 暂时不能，等待外部条件 | 线程被停放，或先自旋再停放 | 同步 I/O、锁竞争、信号量等待 |
| 任务挂起 | 当前任务暂时不能继续 | 任务让出线程，线程可运行别的任务 | `await` 未就绪结果、`Task.sleep` |

“低 CPU”不代表健康。一个线程可能几乎不消耗 CPU，却永远卡在信号量或锁上。反过来，一个主线程也可能完全没有“阻塞调用”，只是持续计算数秒，界面同样无法响应。

### 1.3 串行与并发：看工作组织

- **串行**：同一组织单元一次只执行一个工作项。
- **并发**：多个工作项的生命周期可以重叠推进。
- **并行**：某个时刻确实在多个处理器核心上同时执行。

串行队列可以接受异步提交；并发队列也可以接受同步提交。actor 串行化隔离状态的访问，但并不自动保证其中的每段工作足够短。

### 1.4 四种常见组合

| 调用边界 | 等待方式 | 例子 | 调用者看到什么 |
|---|---|---|---|
| 同步 | 没有等待 | 纯值计算 | 得到结果后继续 |
| 同步 | 阻塞线程 | `FileHandle.readToEnd()`、竞争中的 `Mutex` | 当前调用链与线程都在等待 |
| 回调式异步 | 工作线程内部阻塞 | 后台队列里执行同步文件读取 | 原调用者已返回，但某个工作线程仍被占用 |
| Swift `async` | 挂起任务 | `try await Task.sleep(for:)` | 当前任务等待，线程可服务其他任务 |

还存在“`async` 但这次没有挂起”的快速路径，也存在“同步 API 在内部并行计算，最后同步返回”的实现。函数名或关键字不足以判断线程是否被占用。

---

## 2. 普通调用栈、返回与抛错

### 2.1 同步调用是一条嵌套控制链

```swift
enum ParseError: Error {
    case invalidHeader
}

func decodeHeader(_ bytes: [UInt8]) throws -> Int {
    guard bytes.first == 0xCA else {
        throw ParseError.invalidHeader
    }
    return bytes.count
}

func inspect(_ bytes: [UInt8]) {
    do {
        let length = try decodeHeader(bytes)
        print(length)
    } catch {
        print(error)
    }
}
```

`decodeHeader` 的 `return` 把值交回调用点；`throw` 沿当前控制链转移到匹配的 `catch`。抛错不是异步，也不意味着阻塞。`throws` 与 `async` 是两种独立的函数效果，因此 Swift 同时允许：

```swift
func transform() -> Output
func parse() throws -> Output
func fetch() async -> Output
func fetchAndParse() async throws -> Output
```

返回 `Never` 的函数则不会正常返回，例如进程终止函数或无限运行的入口。它同样不是“异步”的同义词。

### 2.2 语言调用链不等于固定的机器栈帧

从源码推理时，可以把同步调用理解为嵌套调用栈。但优化器可能内联函数、消除帧、改变寄存器与栈布局。可靠的语言结论是：

1. 调用者不能越过尚未完成的同步调用继续执行；
2. 正常结果通过 `return` 返回；
3. 错误通过 `throw` 传播；
4. 普通同步代码没有 Swift 任务挂起点。

“每次函数调用都一定对应一个可见的机器栈帧”不是 Swift 语言保证。

### 2.3 `defer` 属于同步作用域退出语义

```swift
func process(_ handle: ResourceHandle) throws {
    defer {
        handle.close()
    }

    try handle.consume()
}
```

无论函数正常到达作用域末尾、显式 `return`，还是通过 `throw` 离开，`defer` 都会在离开该作用域前运行。它适合表达同步清理，但有三条边界：

- `defer` 不是故障恢复机制；进程被强制终止或崩溃时不能依赖它。
- `defer` 的代码不能包含 `await`，因此异步清理必须在控制流中显式设计。
- `defer` 只保证执行清理代码，不保证被调用的平台清理 API 一定快速或不阻塞。

---

## 3. “阻塞”究竟发生在哪里

阻塞通常不是函数调用语法产生的，而是被调用实现进入了某种等待：

| 等待来源 | 等待条件 | 常见 API 层 |
|---|---|---|
| 文件、网络、设备 I/O | 数据、设备或内核操作完成 | Foundation、POSIX、系统框架 |
| 互斥锁 | 当前持有者释放锁 | `Synchronization.Mutex`、平台锁 |
| 信号量 | 计数变为可取得 | Dispatch |
| 条件变量 / 事件 | 其他执行单元发出通知 | 平台同步原语 |
| 同步队列提交 | 被提交工作执行完成 | Dispatch |
| 休眠 | 时间截止 | Foundation `Thread.sleep` |
| 线程 / 进程等待 | 目标结束 | 平台 API |

运行时可能让等待线程先短暂自旋，再把它停放到内核；也可能直接进入系统调用。这个选择属于实现与平台。对调用方最重要的可观察事实是：**这条线程暂时不能被 Swift executor 用来执行其他任务。**

### 3.1 同步不保证阻塞，阻塞也不必发生在原调用者

一个同步内存读取通常立即完成：

```swift
func titleLength(_ title: String) -> Int {
    title.count
}
```

一个回调式异步 API 则可能把同步阻塞搬到了工作线程：

```text
调用线程：入队 ── 返回 ── 继续
                    │
工作线程：          └─ 同步读文件 ── 阻塞 ── 完成回调
```

原调用者不再等待，不代表系统没有线程被阻塞；它只说明阻塞位置发生了变化。

### 3.2 非阻塞 I/O也不等于异步 API

“非阻塞”在系统 I/O 中常表示一次操作若暂时不能完成，就立即返回“稍后再试”，而不是停住线程。调用者随后还需要轮询、事件通知或异步运行时来等待就绪。

因此：

- 同步 / 异步描述完成关系；
- 阻塞 / 非阻塞描述一次等待操作如何占用线程；
- 事件循环、回调或 `async` 任务描述如何在结果就绪后继续。

三者可以组合，不能互相替换定义。

---

## 4. 同步 I/O：签名没有写出等待成本

下面的函数完全是普通 Swift 同步函数，但它调用了 Foundation 的同步文件 API：

```swift
import Foundation

func readAllBytes(from url: URL) throws -> Data {
    let handle = try FileHandle(forReadingFrom: url)
    defer {
        try? handle.close()
    }

    return try handle.readToEnd() ?? Data()
}
```

逐层看事实：

1. **Swift 语言层**：函数通过 `return` / `throw` 同步结束，`defer` 在离开作用域时运行。
2. **Foundation API 层**：`FileHandle.readToEnd()` 是同步读取；调用完成前不会把最终 `Data` 交回。
3. **操作系统层**：读取可能命中缓存而很快，也可能等待磁盘、网络文件系统或设备。
4. **类型系统层**：`(URL) throws -> Data` 只表达参数、返回值与抛错效果，没有“可能阻塞”的类型标记。

所以不能从一次快速测试推导“该调用不会阻塞”，也不能从同步签名推导“每次都会发生明显阻塞”。正确结论是：**这个平台 API 允许把调用线程保留到读取完成，延迟受外部资源影响。**

对于文件、数据库、证书、压缩流等稀缺资源，应优先使用显式关闭与作用域清理。不要只等待对象的最终释放时机；编译器可以延长对象生命周期，而外部资源的容量通常比内存更紧张。

---

## 5. 锁：临界区是同步的，竞争时会阻塞线程

Swift 6 的 `Synchronization` 模块提供 `Mutex`。它用闭包划定锁的持有范围：

```swift
import Synchronization

let counter = Mutex(0)

func increment() {
    counter.withLock { value in
        value += 1
    }
}

func currentValue() -> Int {
    counter.withLock { value in
        value
    }
}
```

这里有两个阶段：

1. 锁可用时，调用者取得互斥访问权并同步执行闭包；
2. 锁被占用时，调用线程等待持有者释放它。

`withLock` 的闭包是同步闭包，因此不能在里面 `await`。这不是偶然限制，而是重要的结构性保护：任务挂起后可能由不同线程继续，裸露的线程锁不应跨越挂起边界。

### 5.1 临界区应该保护状态转换，而不是包住整个业务流程

适合放进锁里的内容：

- 读取或修改被保护的内存状态；
- 验证与提交必须原子完成的不变量；
- 很短、耗时可预测的计算。

通常不应放进锁里的内容：

- 文件或网络 I/O；
- 等待回调或信号量；
- 调用未知耗时的外部代码；
- 大量 CPU 计算；
- 任何可能重入同一把非递归锁的路径。

锁持有时间越长，等待链越长。将 I/O 放在锁内还会把外部系统延迟传播给所有竞争者。

### 5.2 锁解决数据互斥，不自动解决进度

即使没有数据竞争，程序仍可能无法推进：

```text
线程 A：持有锁 X ── 等待锁 Y
线程 B：持有锁 Y ── 等待锁 X
```

这是死锁。还可能出现：

- **饥饿**：某个竞争者长期得不到执行机会；
- **优先级反转**：高优先级工作等待低优先级持锁者；
- **锁护航**：许多线程依次被唤醒，却只能串行通过同一热点锁。

`Mutex` 保证互斥，不应推断公平性或特定唤醒顺序。actor 也不能神奇消除所有进度问题；actor 内部仍可调用阻塞 API，多个 actor 之间也可能形成业务依赖环。

---

## 6. 信号量：计数许可，不是“把异步变同步”的安全按钮

Dispatch 信号量维护一个计数：

- `signal()` 增加计数并可能唤醒等待者；
- `wait()` 尝试取得一个许可；无许可时调用线程等待；
- 初始值为 `1` 时可以模拟互斥，但信号量本质上并不绑定“拥有者”，语义不同于互斥锁。

下面是常见但危险的异步转同步桥接：

```swift
import Dispatch

func waitForLegacyCallback(
    start: (@escaping () -> Void) -> Void
) {
    let finished = DispatchSemaphore(value: 0)

    start {
        finished.signal()
    }

    finished.wait()
}
```

如果 `start` 把完成回调安排到当前正在被阻塞的主线程或同一串行队列，就形成闭环：

```text
主线程 / 串行队列
  ├─ finished.wait() ───────────────┐
  └─ 无法返回事件循环               │
                                    │
完成回调等待同一主线程 / 串行队列 ───┘
```

即使没有死锁，这种桥接也占住一个线程、破坏取消传播，并可能在大量调用时造成线程池耗尽。Swift 标准并发模型没有提供一个通用的“从同步代码阻塞等待任意 `async` 结果”的安全函数；通常应从调用链上层逐步传播 `async`。

设置超时只会限制最长等待，并不会消除依赖环。超时以后还必须定义：后台工作是否取消、迟到回调是否丢弃、资源由谁释放、共享状态是否仍可提交。

---

## 7. 串行队列与 `sync` 是两件事

`DispatchQueue` 有两个互相独立的属性：

1. **队列宽度**：串行队列一次执行一个工作项；并发队列可让多个工作项重叠推进。
2. **提交方式**：`async` 入队后让调用者继续；`sync` 要等被提交工作完成后才返回。

| 队列 | `async` 提交 | `sync` 提交 |
|---|---|---|
| 串行队列 | 调用者返回；工作项仍按队列顺序逐个执行 | 调用者等待；工作项与队列中其他项仍串行 |
| 并发队列 | 调用者返回；多个工作项可能并发 | 调用者等待自己的工作项完成；队列仍可并发 |

```swift
import Dispatch

let serial = DispatchQueue(label: "example.serial")

serial.async {
    print("A")
}

serial.sync {
    print("B")
}

print("C")
```

`B` 的同步提交会等到其工作项完成后才允许打印 `C`。由于队列是串行的，先入队的 `A` 也必须先完成。但这不表示串行队列只能使用 `sync`。

### 7.1 `sync` 不保证切换线程

Dispatch 文档允许 `sync` 为了优化直接在当前线程执行工作项。因此不能把：

```swift
queue.sync {
    // ...
}
```

理解成“切换到 queue 的专属线程”。Dispatch 队列不是线程，绝大多数队列也没有固定线程身份。应依赖队列提供的顺序与互斥契约，而不是推断某条物理线程。

### 7.2 同步提交到当前串行队列会死锁

以下代码不能执行：

```swift
serial.sync {
    serial.sync {
        print("永远到不了这里")
    }
}
```

外层工作必须先结束，内层工作才有机会在串行队列执行；外层又在等待内层结束。`DispatchQueue.main.sync` 从主队列自身调用时也是同一类自等待。

### 7.3 同步 API 也可以在内部并行

```swift
DispatchQueue.concurrentPerform(iterations: 8) { index in
    _ = index * index
}

print("所有迭代都已完成")
```

`concurrentPerform` 可以并行执行迭代，但调用者要等所有迭代结束才继续。它是“同步完成边界 + 内部并行”的直接例子，说明同步与串行不是同义词。

---

## 8. 主线程、`MainActor` 与普通 actor 都可能被卡住

### 8.1 `async` 关键字不会自动把工作移到后台

```swift
import Foundation

@MainActor
func refresh(from url: URL) async throws -> Int {
    let data = try readAllBytes(from: url)
    return data.count
}
```

`refresh` 虽然声明为 `async`，但在 `readAllBytes` 这段同步调用期间没有挂起点。Foundation 的同步读取会占住当前执行线程。在 Apple UI 程序中，主 actor 上的这段工作会妨碍主线程处理输入、布局、绘制和事件循环。

以下几件事都不能单独证明工作“在后台”：

- 函数声明带 `async`；
- 调用处写了 `await`；
- 代码包在 `Task { ... }` 中；
- 工作位于 actor 方法中。

新建的 `Task` 还可能继承当前 actor 隔离。真正要问的是：**这一同步片段由哪个 executor 执行，它是否调用阻塞 API，是否长时间占用 CPU？**

### 8.2 actor 保证隔离，不保证响应速度

```swift
import Foundation

actor DocumentCache {
    private var bytes = Data()

    func reload(from url: URL) throws {
        bytes = try readAllBytes(from: url)
    }

    func count() -> Int {
        bytes.count
    }
}
```

从 actor 外调用 `reload` 需要跨 actor 隔离边界，通常写作 `try await cache.reload(from:)`。这个 `await` 可以等待 actor 获得执行机会；但 `reload` 函数体一旦开始执行，里面没有语言级挂起点。同步文件读取期间，该 actor 无法处理后续消息，并且承载它的执行线程也可能被阻塞。

同理，大型纯计算不会“阻塞等待”，却会让 actor 长时间不让出执行权。actor 隔离解决的是共享可变状态访问，不是吞吐量或界面流畅性。

### 8.3 处理不可避免的阻塞工作

优先级通常是：

1. 使用能够真正挂起任务的原生异步 API；
2. 把 `async` 从上层调用链显式传播，而不是用信号量向下封堵；
3. 若只能调用遗留阻塞 API，把它隔离到容量受控、职责明确的工作执行环境；
4. 限制并发阻塞数量，保留取消、优先级、错误和资源释放语义；
5. 只把最终 UI 状态更新送回 `MainActor`。

简单地把每次阻塞调用都扔到全局并发队列，只是移动了线程占用位置。无界并发可能制造大量等待线程，仍会损害整个进程的可用性。

---

## 9. 回调式异步边界：`@escaping` 不等于稍后执行

`@escaping` 只允许闭包在函数返回后继续存活，并不承诺闭包一定逃逸，更不承诺异步调用：

```swift
func invokeImmediately(
    _ completion: @escaping () -> Void
) {
    completion()
}
```

这个 completion 仍在原同步调用栈中执行。判断回调 API 时必须阅读契约：

- 回调可能在返回前调用，还是保证返回后调用？
- 回调在哪个队列或 actor 上调用？
- 恰好一次、至多一次，还是可能多次？
- 失败、取消和对象释放时是否仍会调用？
- 回调是否允许重入调用者？

### 9.1 回调异步不代表工作线程不会阻塞

```swift
func enqueueBlockingWork(
    _ work: @escaping @Sendable () -> Void
) {
    DispatchQueue.global(qos: .utility).async(execute: work)
}
```

调用者在入队后继续，但 `work` 内若执行同步 I/O 或等待锁，Dispatch 的某个工作线程仍会被占住。API 对调用者是异步的，内部实现却可以是阻塞的。

### 9.2 continuation 恢复任务，不占线程等待

回调 API 若具有可靠的完成契约，可以用 checked continuation 桥接到 Swift `async`：

```swift
import Foundation

typealias LegacyLoader =
    (@escaping (Result<Data, Error>) -> Void) -> Void

func load(
    using legacyLoader: LegacyLoader
) async throws -> Data {
    try await withCheckedThrowingContinuation { continuation in
        legacyLoader { result in
            continuation.resume(with: result)
        }
    }
}
```

等待回调时，Swift 任务可以挂起而不是用信号量占住线程。但桥接必须满足关键前提：

- continuation 必须恰好恢复一次；
- 所有成功、失败与取消路径都要有明确归宿；
- 迟到或重复回调需要在原 API 层解决；
- continuation 不会自动创建后台线程。

最后一点尤其重要：`withCheckedThrowingContinuation` 的注册闭包会同步执行。如果 `legacyLoader` 在注册期间先做一大段阻塞工作、最后才调用回调，包装成 `async` 也不会消除那段阻塞。必须先确认原 API 存在真实的异步完成边界。

---

## 10. 资源清理与 autorelease 是另一组问题

阻塞路径经常与资源生命周期同时出现，但两者仍需分别处理。

### 10.1 优先使用词法作用域管理资源

| 资源 | 推荐边界 | 原因 |
|---|---|---|
| `Mutex` | `withLock` 闭包 | 自动限制持锁范围 |
| 文件句柄 | 显式 `close` + `defer` | 正常返回与抛错都释放 |
| 临时缓冲区 | 尽量缩小局部作用域 | 降低峰值内存 |
| 异步资源 | 显式成功 / 失败 / 取消流程 | `defer` 中不能 `await` |

如果清理操作本身是异步的，应在 `do` / `catch` 和取消策略中显式组织 `await cleanup()`，而不是假设同步 `defer` 能完成它。任务取消也不会自动中断任意同步系统调用；需要使用所选平台 API 支持的取消机制。

### 10.2 `autoreleasepool` 是 Objective-C 互操作的内存峰值工具

在 Apple 平台上，大量创建临时 Objective-C 对象的循环可以用更小的 autorelease pool 缩短这些对象的延迟释放周期：

```swift
import Foundation

func inspectFiles(_ urls: [URL]) {
    for url in urls {
        autoreleasepool {
            _ = NSData(contentsOf: url)
        }
    }
}
```

这段代码只是展示 pool 的作用域；`NSData(contentsOf:)` 本身是同步 I/O，不应因此放到主 actor 上。

需要准确区分：

- `autoreleasepool` 来自 Apple Objective-C 运行时 / Foundation 互操作环境，不是纯 Swift 语言控制结构；
- 它影响 autoreleased Objective-C 对象的回收时点，不修复 Swift 强引用环；
- 它不释放仍被强引用的对象，也不替代文件句柄的显式关闭；
- 它不会把同步 I/O 变成异步，更不会解除线程阻塞。

Dispatch 队列还提供 `autoreleaseFrequency` 配置，例如 `.workItem` 可让队列围绕工作项建立并排空 autorelease pool。这是 Dispatch 的平台级内存管理策略，不是 Swift 并发语义。

---

## 11. 与四种方法派发完全正交

方法派发回答：

> 这次调用最终选择哪一个实现？

同步、异步与阻塞回答：

> 选中的实现如何完成？调用者何时继续？等待时是否占着线程？

因此四种常见派发路线都可能进入快速同步代码、阻塞同步代码，或带异步边界的实现：

| 派发路线 | 解决的问题 | 与阻塞的关系 |
|---|---|---|
| 直接 / 静态派发 | 编译期已知具体实现 | 实现仍可做同步 I/O、竞争锁或调用异步函数 |
| 类方法表派发 | 根据动态对象类型选择 override | 被选中的 override 可能快、慢、阻塞或声明为 `async` |
| 协议 witness table 派发 | 根据具体遵循类型选择协议实现 | witness 只决定实现，协议同步签名不会声明“不会阻塞” |
| Objective-C 消息派发 | 运行时按 selector 查找实现 | Objective-C 方法可以同步阻塞，也可以安排 completion 回调 |

例如：

```swift
import Foundation

protocol BytesLoading {
    func load() throws -> Data
}

struct DiskLoader: BytesLoading {
    let url: URL

    func load() throws -> Data {
        try readAllBytes(from: url)
    }
}

func consume<L: BytesLoading>(_ loader: L) throws -> Int {
    try loader.load().count
}
```

无论编译器最终将泛型调用特化成直接调用，还是通过协议 witness 找到 `DiskLoader.load`，可能等待文件 I/O 的原因都是被选中实现调用了同步 Foundation API，而不是派发路线本身。

`async` 与 `throws` 是函数类型的一部分，会约束协议要求、override 和调用语法；“可能阻塞”通常不在 Swift 函数类型中。性能分析时应把“派发成本”和“实现内部等待”分别测量。一次 Objective-C 消息查找的开销不能解释数秒 I/O 等待，反过来也不应在没有数据时忽略热点循环中的派发成本。

---

## 12. 各层分别负责什么

| 层次 | 本章涉及的能力 | 能保证什么 | 不能从中推导什么 |
|---|---|---|---|
| Swift 语言 | 普通函数、`return`、`throw`、`async`、`await`、actor 隔离、`defer`、闭包 | 控制流、可能的挂起点、隔离与作用域退出规则 | 固定线程、I/O 延迟、锁公平性 |
| Swift 标准并发库 / 运行时 | `Task`、任务取消、continuation、`Task.sleep` | 任务挂起与恢复的契约 | 任意平台调用都可取消或非阻塞 |
| `Synchronization` 模块 | `Mutex` 等同步原语 | 临界区互斥及对应 API 契约 | 业务无死锁、固定公平顺序 |
| Foundation | `FileHandle`、`Thread.sleep`、Objective-C 互操作 | 各 API 文档承诺的同步读取、线程休眠等 | 自动继承 Swift 任务取消语义 |
| Dispatch | 串行 / 并发队列、`sync` / `async`、信号量、autorelease 频率 | 提交、排序、等待和计数语义 | 每个队列都有专属线程 |
| 操作系统与具体运行时 | 线程停放、I/O 完成、中断、调度、缓存 | 当前平台的实际执行结果 | 跨平台不变的 Swift 语言语义 |

一个结论若跨越多层，应把每一跳写清楚。例如：

```text
Swift 同步函数
  → 调用 Foundation 同步读取
  → Foundation 进入操作系统 I/O
  → 当前线程可能等待设备
  → 若该线程承载 MainActor，则 UI 事件无法及时处理
```

这样才能区分语言保证、API 契约与一次运行时观测。

---

## 13. 系统化诊断：先找等待链，再选修复

遇到“卡住”“偶发无响应”或“async 也很慢”时，按下面顺序定位。

### 第一步：确定执行上下文

记录问题代码运行在：

- 主线程或 `MainActor`；
- 某个普通 actor；
- 自定义串行队列；
- Dispatch 全局并发队列；
- Swift 并发 executor；
- 自建线程或 OperationQueue。

不要只看函数是否带 `async`。真正的上下文来自隔离、调用链和提交位置。

### 第二步：标出精确时间边界

在可疑调用前后记录时间，必要时使用 Instruments、Points of Interest / signpost：

```text
进入读取 → 等锁 → 发起 I/O → I/O 返回 → 解析完成 → 更新 UI
```

把一段十秒“卡顿”拆成可测区间，才能判断时间花在排队、锁、I/O、CPU 还是回调迟到。

### 第三步：区分忙碌与阻塞

- CPU 很高、采样栈反复停在计算函数：更像忙碌执行。
- CPU 很低、线程栈停在锁、信号量、同步队列或系统读取：更像阻塞等待。
- 任务很多但关键任务长期得不到执行：可能是 executor / 线程池饥饿。
- 最终会恢复的是长等待；存在闭环且永不推进的是死锁。二者的修复不同。

具体系统符号会随平台与实现变化，栈中的 `semaphore_wait`、锁等待、`dispatch_sync`、文件读取等只能作为证据线索，不能代替完整调用链。

### 第四步：画 wait-for graph

把“谁等谁”写出来：

```text
MainActor
  └─ 等待 semaphore
       └─ 等待 completion
            └─ 已安排回 MainActor
```

或：

```text
serialQueue
  └─ sync 提交到 serialQueue 自身
```

常见检查项：

- 是否同步提交到当前串行队列？
- 完成回调是否需要当前被阻塞的队列 / actor？
- 是否在持锁期间等待 I/O 或回调？
- 多把锁的取得顺序是否一致？
- 是否存在未 `signal`、未恢复 continuation 或重复恢复路径？
- 并发入口是否无界地制造阻塞工作？

### 第五步：选择最小、同链路的修复

根据根因选择：

- 有原生异步 API：改用可挂起版本，并向上传播 `async`。
- 锁范围过大：只在锁内快照或提交共享状态，把 I/O / 计算移出。
- 回调桥接：使用 continuation，并证明恰好一次恢复与真实异步边界。
- 遗留阻塞 API：隔离到容量受控的工作环境，不占用主 actor。
- 自队列 `sync`：移除自等待，重新设计队列所有权与调用方向。
- CPU 重任务：分块、并行或移出 UI 隔离域；不要把它误报为锁等待。

### 第六步：验证完整行为

修复后至少复查：

- 主线程响应时间；
- 峰值线程数与 CPU；
- 取消前后状态是否一致；
- 错误和迟到回调；
- 文件、锁和临时对象是否释放；
- actor / 队列的顺序不变量；
- 在慢磁盘、低资源和高并发条件下是否仍能推进。

Thread Sanitizer 很适合发现数据竞争，但它不是通用的阻塞、卡顿或所有死锁诊断器。没有 race 报告不能证明程序具备进度。

---

## 14. 常见误区

### 误区 1：同步函数就会阻塞

同步只表示调用完成前调用者不越过该调用点。快速纯计算也是同步的，却没有等待。

### 误区 2：`async` 就不会阻塞

`async` 函数仍能调用同步阻塞 API；只有到达真正的挂起点，任务才可能让出线程。

### 误区 3：`await` 一定切换线程

`await` 标记可能挂起，不承诺挂起，也不承诺恢复到某条固定线程。应依赖 actor 隔离，而不是线程猜测。

### 误区 4：`Task {}` 就是后台线程

任务不是线程，并可能继承当前 actor。主 actor 中的 `Task` 仍可能在主线程执行长同步片段。

### 误区 5：串行队列就是同步队列

串行描述队列一次执行一个工作项；`sync` 描述提交者是否等该工作项完成。两个维度可以自由组合。

### 误区 6：`queue.sync` 一定切换到另一条线程

Dispatch 允许在当前线程直接执行同步工作项。队列提供执行语义，不提供普遍的线程绑定。

### 误区 7：actor 里不会死锁或卡顿

actor 防止隔离状态的数据竞争，但 actor 方法仍能同步 I/O、等锁或长时间计算。错误的跨组件等待关系仍可破坏进度。

### 误区 8：`@escaping` 表示稍后回调

它只允许闭包逃逸。闭包仍可在函数返回前同步调用，具体时序必须由 API 契约说明。

### 误区 9：信号量能安全地把任何异步 API 变成同步 API

它会占住线程，并可能阻塞完成回调所需的同一执行环境。取消、超时与迟到结果也会变得更复杂。

### 误区 10：设置超时就解决了死锁

超时只让某个等待者退出。依赖环、遗留工作、重复提交和资源所有权仍需处理。

### 误区 11：`Thread.sleep` 与 `Task.sleep` 等价

`Thread.sleep` 是 Foundation 的线程休眠，会占住当前线程；`Task.sleep` 是 Swift 并发 API，挂起当前任务并支持取消。

### 误区 12：`autoreleasepool` 会解决 Swift 内存泄漏

它只影响 Objective-C autoreleased 对象的回收批次，不解决强引用环，也不替代显式资源关闭。

### 误区 13：只要移到后台就没有成本

后台阻塞仍占线程；无界搬运可能造成线程膨胀、优先级问题与整体吞吐下降。应控制容量并优先采用真正可挂起的 API。

### 误区 14：方法派发方式决定会不会阻塞

派发只决定选择哪个实现。真正的等待来自所选实现调用的 I/O、锁、信号量或队列依赖。

---

## 15. 一套可复用的判断问题

看到任何调用时，依次问：

1. 它是普通同步函数、Swift `async` 函数，还是回调式异步 API？
2. 完成结果何时可用？调用者在逻辑上等到哪里？
3. 等待期间是任务挂起、线程阻塞，还是 CPU 忙碌？
4. 当前执行上下文是主 actor、普通 actor、串行队列还是通用执行池？
5. 是否持有锁、文件句柄、数据库事务或其他稀缺资源？
6. 完成工作需要回到当前被占用的上下文吗？
7. 并发数量是否有界？取消、错误和超时由谁处理？
8. 这里选择实现的方法派发路线是什么？它与等待成本是否被错误地混为一谈？
9. 结论属于 Swift 语言保证、标准库契约、平台 API 契约，还是一次运行时观测？

把这九个问题回答清楚，绝大多数“同步 / 异步 / 阻塞 / actor / queue”的概念混乱都会消失。

---

## 16. 本章结论

可以把整章压缩成一句话：

> 同步描述控制流何时完成，阻塞描述等待时线程是否被占用；串行描述工作如何组织，方法派发描述实现如何被选中。

进一步记住：

- 普通同步调用必须返回、抛错或永不返回，调用者才有下一步；
- 同步函数可能很快，也可能因 I/O、锁、信号量或 `queue.sync` 阻塞；
- `async` 与 `await` 提供任务挂起能力，但不会自动搬走同步阻塞代码；
- actor 保证隔离，不保证短延迟；主 actor 上的阻塞和长计算都会造成界面卡顿；
- 回调边界可以让原调用者先返回，但工作线程内部仍可能阻塞；
- `defer`、`withLock` 与 autorelease pool 各自管理不同资源边界；
- 四种方法派发与时间行为正交，应该分别分析和测量；
- 诊断时先画真实等待链，再沿同一链路修复。

下一章继续讨论：[异步与挂起](02-asynchronous-and-suspension.md)。

---

## 17. 官方与一级资料

### Swift 语言与标准并发

- [The Swift Programming Language — Concurrency](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/)
- [The Swift Programming Language — Declarations](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/declarations/)
- [The Swift Programming Language — Expressions](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/expressions/)
- [The Swift Programming Language — Statements](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/statements/)
- [The Swift Programming Language — Closures](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/closures/)
- [Swift `CheckedContinuation`](https://developer.apple.com/documentation/swift/checkedcontinuation)

### 锁、队列与信号量

- [SE-0433: Synchronous Mutual Exclusion Lock](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0433-mutex.md)
- [Apple — `Synchronization.Mutex`](https://developer.apple.com/documentation/synchronization/mutex)
- [Apple — `DispatchQueue`](https://developer.apple.com/documentation/dispatch/dispatchqueue)
- [Apple — `DispatchQueue.sync(execute:)`](https://developer.apple.com/documentation/dispatch/dispatchqueue/sync%28execute%3A%29-3segw)
- [Apple — Dispatch Semaphore](https://developer.apple.com/documentation/dispatch/dispatch-semaphore)

### I/O、响应性与资源管理

- [Apple — `FileHandle.readToEnd()`](https://developer.apple.com/documentation/foundation/filehandle/readtoend%28%29)
- [Apple — `Thread.sleep(forTimeInterval:)`](https://developer.apple.com/documentation/foundation/thread/sleep%28fortimeinterval%3A%29)
- [Apple — Improving app responsiveness](https://developer.apple.com/documentation/xcode/improving-app-responsiveness)
- [Apple — Improving performance and stability when accessing the file system](https://developer.apple.com/documentation/foundation/improving-performance-and-stability-when-accessing-the-file-system)
- [Apple — Autorelease Pool Blocks](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/MemoryMgmt/Articles/mmAutoreleasePools.html)
- [Apple — `DispatchQueue.AutoreleaseFrequency`](https://developer.apple.com/documentation/dispatch/dispatchqueue/autoreleasefrequency)
