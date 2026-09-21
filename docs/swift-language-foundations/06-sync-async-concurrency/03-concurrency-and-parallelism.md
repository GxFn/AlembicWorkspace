# 并发与并行线路：工作怎样重叠推进

并发与并行回答两个不同问题：

> **并发（concurrency）**：多项工作的生命周期能否重叠，系统能否在它们之间持续推进？
>
> **并行（parallelism）**：某个时刻是否真的有多项工作在不同执行资源上同时运行？

并发是程序结构和调度机会；并行是运行时、操作系统与硬件在某次执行中实现的物理事实。

```text
并发：A 和 B 在同一时间区间内都未完成，系统可以交错推进它们
并行：在某个瞬间，A 和 B 真的同时占用不同 CPU core / 执行资源
```

一个单核系统可以并发但不并行；一个同步 API 内部可以并行计算后再同步返回。`async`
只允许挂起，本身既不创建第二项工作，也不承诺并发或并行。

本文同样区分三层事实：

| 层级 | 本文如何使用 | 不能推出什么 |
| --- | --- | --- |
| **Swift 语言语义** | child task、actor isolation、`Sendable`、`await` 等公开规则 | 固定线程数、固定执行顺序 |
| **标准库与 Runtime** | `TaskGroup`、global executor、task priority 等常见执行支持 | 所有平台完全相同的调度策略 |
| **平台与硬件** | OS thread、CPU core、QoS、I/O、Instruments | Swift 源码一定产生某种机器时间线 |

## 1. 顺序、串行、并发、并行是四个轴

### 1.1 顺序关系（ordering）

顺序描述事件之间的约束：

```text
A 完成后才能开始 B
A 的写入必须先于 B 的读取被观察
结果必须按输入索引发布
```

顺序可以是：

- **全序**：任意两个事件都能比较先后；
- **偏序**：只有存在依赖的事件需要确定先后；
- **无业务顺序要求**：任何完成顺序都可接受。

顺序是正确性合同，不等于“使用一条线程”。多个并行任务仍可以通过依赖和同步产生
明确的 happens-before 关系。

### 1.2 串行（serial）

串行表示在选定执行域内，一次最多执行一个工作片段：

```text
时间 ──────────────────────────────>
A:    ███████
B:            █████
C:                 ███████
```

必须先说明“什么单位被串行化”：

- 一个同步函数的语句；
- 一个 serial executor 上的 job；
- actor 的隔离代码片段；
- 一条平台 serial queue 上的 closure；
- 一个资源上的写操作。

Actor 会串行化同一 actor 上的隔离 job，但一个含多个 `await` 的 actor 方法可以在挂起点
被其他 job 插入。因此“actor 串行”不等于“整个 async 方法从头到尾不可交错”。

### 1.3 并发（concurrent）

并发表示多项工作可以在重叠时间区间内推进：

```text
时间 ──────────────────────────────>
A:    ██ wait ───── ██ wait ── █
B:       ███ wait ───── █████
```

在单个执行资源上，A 与 B 可以通过挂起、事件循环或时间片交错推进；任一瞬间仍可能只执行
一个工作片段。

### 1.4 并行（parallel）

并行表示某个时刻多个工作片段真的同时执行：

```text
CPU 0: A █████████████
CPU 1: B   ███████████
CPU 2: C      ████████
时间  : ───────────────────────────>
```

是否并行取决于：

- 是否真的存在多个彼此独立、可运行的 job；
- executor 是否允许它们同时运行；
- actor / lock / 数据依赖是否把它们串行化；
- Runtime 与 OS 是否分配多个线程；
- 设备有多少可用 core；
- 其他进程、功耗和 thermal 状态。

程序可以表达“允许并行”，不能把“此刻一定在两核执行”当成 Swift 语言保证。

### 1.5 四轴组合

| 场景 | 有顺序依赖 | 串行 | 并发 | 可能并行 |
| --- | --- | --- | --- | --- |
| 连续两个普通函数调用 | 是 | 是 | 否 | 否 |
| 连续 `await` 两个 async 函数 | 通常是 | 当前 task 内顺序调用 | 不会因 `async` 自动产生 | 不会自动产生 |
| 单线程 event loop 处理多个连接 | 部分 | 每刻一个片段 | 是 | 否 |
| `async let` 加载两份独立数据 | 汇合点前无相互依赖 | 否 | 是 | 取决于等待和执行资源 |
| TaskGroup 切分 CPU 数组 | 汇合点前无相互依赖 | 否 | 是 | 有机会 |
| actor 处理多个请求 | mailbox 不保证 FIFO | 隔离片段串行 | async 方法可交错 | 同一 actor 隔离片段不并行 |
| 同步并行算法 | 调用方等待汇合 | API 边界同步 | 内部是 | 内部可能是 |

## 2. 与 `async` 和方法派发正交

### 2.1 `async` 不自动引入并发

```swift
let profile = try await loadProfile()
let settings = try await loadSettings()
```

第二次调用在第一次返回后才开始。两个函数都能挂起，但当前函数仍只有一条顺序工作链：

```text
loadProfile 完成
→ loadSettings 开始
→ 两者从未成为并列 child task
```

### 2.2 同步 API 可以内部并行

一个同步函数可以：

1. 切分 CPU 工作；
2. 提交到多个执行资源；
3. 等待所有分支；
4. 合并结果；
5. 同步返回。

调用者仍然阻塞在同步边界，但内部曾并行。调用关系与内部工作组织不是同一个轴。

### 2.3 方法派发只选择实现

```swift
protocol Loader {
    func load() async throws -> Data
}
```

调用可以分层理解：

```text
名称查找 / 重载解析
→ direct、vtable、witness 或 Objective-C bridge 选择具体 load 实现
→ async 状态机决定如何挂起和恢复
→ task tree 决定有没有并列 child task
→ executor / OS 决定何时运行
→ 硬件决定是否物理并行
```

同一份 witness 实现可以被一个调用者顺序调用，也可以被一百个 child task 并发调用。
派发方式不决定并发度。

### 2.4 `DispatchQueue.async` 的 “dispatch” 是另一层

Swift 方法派发回答“调用哪个实现”；Dispatch 框架提交 closure 回答“把一项工作交给哪条
queue”。二者都可能被译为“派发”，但没有从属关系：

```text
method dispatch ≠ Dispatch framework
Swift async function ≠ DispatchQueue.async
```

Dispatch、Operation、pthread 属于平台执行工具；`async let`、TaskGroup、actor 属于 Swift
并发模型。它们可以桥接，但必须保留各自的取消、优先级、隔离和阻塞边界。

## 3. 怎样真正引入并发

### 3.1 `async let`：固定数量的独立 child task

```swift
async let profile = loadProfile()
async let settings = loadSettings()

let page = try await Page(
    profile: profile,
    settings: settings
)
```

当执行到两个 `async let` 声明时，各自的 initializer 在 child task 中开始。它们的生命周期
重叠，因此表达了并发。

可以画成：

```text
parent refresh
├─ child loadProfile ────────┐
├─ child loadSettings ────┐  │
└─ await both             └──┴─→ build Page
```

语言保证的是结构化 child task 和作用域汇合，不保证：

- 哪个 child 先开始；
- 哪个先完成；
- 是否使用两条 OS thread；
- 是否真的在两个 core 上并行；
- 两个远端请求是否绕过平台连接限制。

### 3.2 TaskGroup：动态数量的 child task

```swift
let values = try await withThrowingTaskGroup(
    of: Item.self,
    returning: [Item].self
) { group in
    for id in ids {
        group.addTask {
            try await loadItem(id)
        }
    }

    var values: [Item] = []
    for try await value in group {
        values.append(value)
    }
    return values
}
```

TaskGroup 适合：

- child 数量运行时才知道；
- 每项工作相对独立；
- parent 需要在作用域内收集全部或部分结果；
- 错误、取消和优先级需要沿 task tree 管理。

`group.addTask` 创建 child task，不是“排一个普通 closure 等以后再说”。大量循环会很快
创建大量逻辑 task；executor 的线程宽度有限不等于 task、请求、buffer 或内存有界。

### 3.3 `Task {}` 不是结构化 child task 的替代写法

```swift
let handle = Task {
    await refreshCache()
}
```

这是 unstructured task。它可以继承当前的一些上下文，但不属于 `async let` / TaskGroup
那样的词法 child-task 树。

若丢弃 `handle`：

- 调用方失去显式等待结果的位置；
- 很难定向取消；
- 错误和资源生命周期容易脱离拥有者；
- scope 退出不自动建立同样的 child 汇合合同。

需要局部并发时优先使用 structured concurrency；确实需要越过当前 scope 的工作时，再
明确谁持有 handle、谁取消、谁观察错误、何时完成。

### 3.4 `Task.detached` 不表示“更多并行”

Detached task 切断更多继承关系，不承诺：

- 新建专属 thread；
- 绕过 executor 宽度；
- 更高优先级；
- 更快；
- 自动适合 CPU 密集工作。

它是上下文边界，不是性能开关。

## 4. Task Tree 是并发的生命周期骨架

结构化任务树示例：

```text
Task: refreshPage
├─ async let: loadProfile
├─ async let: loadSettings
└─ TaskGroup: loadCards
   ├─ child: card 0
   ├─ child: card 1
   └─ child: card 2
```

### 4.1 结构带来的保证

- child 不会任意越过创建它的结构化 scope；
- parent 在 scope 完成前会处理 child 的结束；
- parent 取消会向 child 传播取消状态；
- child 默认继承 parent 的 priority 和 task-local values；
- 工具可以重建 parent-child 关系；
- 资源上限、超时和取消策略更容易沿树推理。

### 4.2 取消只向下自然传播

Child 失败或自行取消，不表示 parent 自动在同一瞬间被取消。状态怎样向上传播取决于
parent 是否等待、读取或抛出 child 结果。

对 throwing TaskGroup：

- child 的错误存放在该 child 的结果中；
- `group.next()` 或 `for try await` 观察到错误时会抛出；
- group body 因该错误退出后，剩余 child 会被取消并等待；
- 若故意不消费 child 结果，不能假定错误会自动以业务期望的方式上抛。

结构化并发提供传播通道，不替业务定义“一个分支失败是否终止全部”。

### 4.3 Scope 结束不等于瞬间杀死 Child

取消是协作式。Scope 退出时 child 仍需：

- 收到取消状态；
- 在 suspension point 或显式检查处响应；
- 清理资源；
- 完成或抛错；
- 被 parent 等待收束。

一个忽略取消的 CPU 循环仍可能拖延整个结构化 scope 的退出。

## 5. 启动顺序、完成顺序、结果顺序

TaskGroup 的 child 可以按任意顺序被调度。必须分开：

```text
创建顺序：group.addTask 的源码顺序
启动顺序：executor 首次运行 child 的顺序
完成顺序：child 产生结果的顺序
消费顺序：parent 调用 next() 取得结果的顺序
发布顺序：业务把结果写入 UI / 文件 / 网络的顺序
```

它们没有自动相等。

```swift
for try await value in group {
    values.append(value)
}
```

通常按 child 完成并可供消费的顺序追加，不保留输入顺序。若结果必须按输入顺序发布，应
让 child 返回索引：

```swift
group.addTask {
    (index, try await transform(input))
}
```

然后在 parent 中按 index 写入预分配位置或排序。

`async let` 的名字会把结果重新绑定到各自位置，因此：

```swift
async let left = loadLeft()
async let right = loadRight()
let pair = try await (left, right)
```

无论谁先完成，`pair.0` 仍是 `left`，`pair.1` 仍是 `right`。这叫结果身份稳定，不叫执行
顺序稳定。

## 6. 并发度必须显式受资源约束

### 6.1 “Runtime 不会一 task 一 thread”仍然不代表安全无界

创建十万个 task 即使没有十万条 thread，也可能产生：

- task frame 和 capture 内存；
- 十万个 URL/request 对象；
- 大量 socket / 文件句柄竞争；
- 服务端限流；
- actor mailbox 堆积；
- 结果 buffer 峰值；
- 取消后的浪费工作。

并发上限应来自所保护资源：

| 资源 | 常见约束 |
| --- | --- |
| CPU | core 数、任务粒度、cache、memory bandwidth |
| 网络 | 服务端配额、连接数、带宽、重试策略 |
| 磁盘 | I/O 队列、随机/顺序访问、文件句柄 |
| 数据库 | 连接池、事务冲突、写入序列 |
| 内存 | input/output 大小、task captures、buffer |
| UI / actor | 响应预算、mailbox contention |

### 6.2 滑动窗口 TaskGroup

下面的 `boundedConcurrentMap` 同时保证：

- 最多 `limit` 个未完成 child；
- 完成一个后才加入下一个，形成局部反馈；
- child 可按任意顺序完成；
- 最终结果恢复输入顺序；
- 一个 child 抛错时，group body 抛出，剩余 child 被结构化取消并收束。

```swift
func boundedConcurrentMap<Input: Sendable, Output: Sendable>(
    _ inputs: [Input],
    limit: Int,
    transform: @Sendable @escaping (Input) async throws -> Output
) async throws -> [Output] {
    precondition(limit > 0)

    return try await withThrowingTaskGroup(
        of: (Int, Output).self,
        returning: [Output].self
    ) { group in
        var nextIndex = 0

        for _ in 0..<min(limit, inputs.count) {
            let index = nextIndex
            let input = inputs[index]
            nextIndex += 1
            group.addTask {
                (index, try await transform(input))
            }
        }

        var ordered = Array<Output?>(
            repeating: nil,
            count: inputs.count
        )

        while let (index, output) = try await group.next() {
            ordered[index] = output

            if nextIndex < inputs.count {
                let index = nextIndex
                let input = inputs[index]
                nextIndex += 1
                group.addTask {
                    (index, try await transform(input))
                }
            }
        }

        // 所有 child 成功完成后，每个位置都已被写入一次。
        return ordered.map { $0! }
    }
}
```

这里的 `limit` 不是通用最佳值。应按真实资源、设备和服务合同测量，且考虑同一进程中
是否有多个调用者各自创建一套窗口。

### 6.3 限流器应由资源拥有者统一管理

若十个页面都各自使用 `limit: 8`，整体可能有 80 个请求。真正受保护的是共享网络服务、
数据库或解码器时，限制通常应位于该资源的统一拥有者：

```text
所有调用者
→ 同一个 client / actor / async permit pool
→ 有界 in-flight 操作
→ 外部资源
```

实现可取消的 async permit pool 并不简单：等待者取消、permit 归还、优先级、公平性和
shutdown 都要形成状态机。不要用一个没有取消路径的 continuation 队列充当生产级 limiter。

## 7. Backpressure 不只是“加一个 Semaphore”

Backpressure 表示：

> 下游容量不足时，压力能沿数据流返回上游，使 producer 减速、暂停、合并、丢弃或拒绝
> 新工作。

### 7.1 并发上限与 Backpressure 的关系

滑动窗口只在当前函数内建立：

```text
一个 child 完成
→ parent 才读取并提交下一个 input
```

这是局部反馈。但若 `inputs` 早已被上游全部读入内存，或外部 callback 已经不断推送，
它还不是端到端 backpressure。

### 7.2 Buffer 只是吸收速率差

`AsyncStream` 可以配置 buffering policy：

- unbounded；
- 保留指定数量的 oldest；
- 保留指定数量的 newest。

默认无界 buffer 可能导致内存增长；有界 buffer 可以丢弃元素，但
`AsyncStream.Continuation.yield` 本身不必挂起 producer。因此“有界 buffer”可能是
drop policy，不一定是“producer 被迫减速”的完整 backpressure。

### 7.3 每条流都要定义容量语义

当 producer 快于 consumer：

| 策略 | 适合 | 风险 |
| --- | --- | --- |
| suspend / slow producer | 每个事件都必须处理 | producer 必须支持反馈 |
| bounded queue | 短时突发 | 满载时仍要决定下一步 |
| drop oldest | 只关心最新状态 | 中间事件丢失 |
| drop newest | 已排队事件优先 | 最新变化可能丢失 |
| coalesce | 状态更新、进度 | 需要可合并语义 |
| reject / fail fast | 保护服务 | 调用方要重试或降级 |
| spill to disk | 必须持久处理的大流 | 延迟、磁盘和恢复复杂度 |

“无限缓存直到下游追上”不是默认安全方案。

## 8. I/O-bound 与 CPU-bound 的并发策略

### 8.1 I/O-bound

I/O-bound 工作的大部分 wall-clock 时间花在等待：

- 网络响应；
- 磁盘；
- 数据库；
- 系统服务；
- timer 或外部事件。

并发价值来自：

```text
Task A 等 I/O 时挂起
→ 执行资源推进 Task B
→ 用重叠等待提高吞吐与资源利用率
```

关键上限通常不是 CPU core 数，而是：

- 服务端 rate limit；
- connection pool；
- 带宽；
- 内存与 response size；
- timeout / retry 放大；
- 对端是否允许幂等重试；
- 用户取消后是否终止底层操作。

### 8.2 CPU-bound

CPU-bound 工作持续消耗处理器：

- 图片解码与变换；
- 压缩、加密、哈希；
- 大规模解析；
- 数值计算；
- 搜索和排序。

获得并行收益需要：

1. 工作可分成相对独立的 chunk；
2. chunk 足够大，收益超过 task 创建和汇合成本；
3. 数据安全跨 isolation boundary；
4. 没有被同一个 actor / lock 串行化；
5. 算法不是 memory-bandwidth bound；
6. Runtime 与设备有可用 core；
7. 合并步骤不吞掉主要收益。

为数组每个元素创建一个 task 往往粒度过小。优先按 range/chunk 切分，再实测不同 chunk
大小与并发度。

### 8.3 CPU Task 仍需协作

长 CPU 循环没有 suspension point，会持续占用当前执行线程。应在合理粒度：

- 检查 `Task.isCancelled` 或 `Task.checkCancellation()`；
- 必要时拆成 chunk；
- 谨慎使用 `Task.yield()` 给其他可运行工作机会；
- 避免在 MainActor 或热点 actor 上执行长计算。

`Task.yield()` 不是调度顺序保证，也不一定使另一个指定 task 运行。

### 8.4 混合 Pipeline

真实任务通常是：

```text
network I/O
→ decode CPU
→ database I/O
→ MainActor publish
```

每一阶段的合适并发度不同。网络阶段允许 8 个 in-flight，不代表图片解码也应该同时跑 8
个，更不代表 UI 发布可以并行。应为每个资源边界分别设置容量和测量。

## 9. 竞态、数据竞争与逻辑竞争

### 9.1 Data Race

数据竞争通常指：

```text
两个执行上下文并发访问同一内存位置
+ 至少一个是写
+ 缺少合法同步 / isolation
```

后果可能是：

- 读到撕裂或过期状态；
- 容器内部结构损坏；
- 崩溃；
- 只在优化构建或特定设备出现；
- 被 Swift 严格并发检查、运行时检查或 Thread Sanitizer 发现。

### 9.2 Race Condition

Race condition 范围更广：结果依赖不可控时序。它可以包含 data race，也可以完全没有
非法内存并发。

### 9.3 Actor 内仍可有逻辑竞争

```swift
actor SearchState {
    private let fetch: @Sendable (String) async -> String
    private var generation = 0
    private(set) var result = ""

    init(fetch: @escaping @Sendable (String) async -> String) {
        self.fetch = fetch
    }

    func refresh(query: String) async {
        generation += 1
        let requestGeneration = generation

        let newResult = await fetch(query)

        guard requestGeneration == generation else {
            return
        }
        result = newResult
    }
}
```

Actor 防止 `generation` 和 `result` 的 data race，但 `await fetch` 期间另一个 `refresh`
可以进入。没有 generation 检查时，较旧请求可能最后完成并覆盖新结果。

这是逻辑竞争：

```text
内存访问合法
≠
业务结果符合“最后一次请求获胜”
```

### 9.4 常见逻辑 Race

- check-then-act：检查库存后挂起，恢复时库存已变化；
- stale result：旧请求覆盖新请求；
- lost intent：取消后的旧任务仍发布结果；
- duplicate work：两个 task 同时发现 cache miss；
- double submit：状态机缺少一次性 transition；
- timeout race：超时与成功几乎同时发生，双方都尝试结束；
- retry race：原请求其实成功，重试造成重复写。

Actor、lock 或 atomic 只能为状态转换提供基础；业务仍需 generation、idempotency key、
状态机、事务或补偿路径。

## 10. 先消除共享，再选择同步工具

推荐优先级：

```text
不可变值 / 独立 value
→ 所有权转移 / 每 task 独占
→ child 返回结果，由 parent 汇合
→ actor 隔离异步状态
→ Mutex 保护短同步临界区
→ Atomic 表达单值或精心设计的 lock-free 状态机
```

前几项通常比“让多个 task 共同修改同一个容器”更容易证明。

### 10.1 用 Parent 汇合代替 Child 共享写

不要让 child 并发 append 同一个数组：

```swift
// 不要让多个 child 直接写共享 results。
```

更好的结构：

```text
child 只读取自己的 Sendable input
→ 返回 (index, output)
→ parent 单独写 results
```

这正是 `boundedConcurrentMap` 的做法。并发发生在变换阶段，结果可变状态只由 parent task
拥有。

## 11. Actor、Mutex、Atomic 怎么选

| 方案 | 适合 | 等待方式 | 能否跨 `await` 保持临界区 | 主要风险 |
| --- | --- | --- | --- | --- |
| 独占值 / child result | 可拆分工作 | 无共享等待 | 不需要 | 需要重新设计数据流 |
| Actor | async API、跨 task 状态机、UI/服务状态 | caller 挂起等待 isolation | 不会把整个方法变事务；会重入 | mailbox contention、逻辑 race |
| Mutex | 很短的同步共享状态 | 竞争时阻塞 thread | 不应 | 死锁、优先级反转、持锁回调 |
| Atomic | counter、flag、单字状态或 CAS 状态机 | 通常不阻塞 | 不适用 | memory ordering、复合不变量错误 |
| Serial Dispatch queue | 既有 queue affinity / 平台代码 | sync 可阻塞，async callback | queue closure 本身不能挂起为事务 | 与 Swift task 生命周期割裂 |

### 11.1 Actor：异步所有者

Actor 适合：

- 状态有明确逻辑所有者；
- 调用方可以 `await`；
- 操作需要和 Swift cancellation / task tree 协作；
- 跨隔离传递值能满足 `Sendable`；
- 可以把业务操作设计成小的状态转换。

Actor 不保证 FIFO。等待同一 actor 的任务不要求按最初到达顺序执行；Runtime 还可能考虑
priority。若业务要求订单顺序，应在 actor 状态中显式记录 sequence，而不是依赖 mailbox
偶然顺序。

### 11.2 Mutex：短而同步的临界区

现代 Swift 工具链的 `Synchronization` module 提供 `Mutex`。一个版本敏感的示例：

```swift
import Synchronization

final class Metrics: Sendable {
    private let state = Mutex((count: 0, total: 0))

    func record(_ value: Int) {
        state.withLock { state in
            state.count += 1
            state.total += value
        }
    }

    var snapshot: (count: Int, total: Int) {
        state.withLock { $0 }
    }
}
```

关键纪律：

- 临界区短；
- 不在持锁时 `await`；
- 不执行未知 callback；
- 不做同步 I/O；
- 多把锁规定全局顺序；
- 明确重入需求，不默认使用 recursive lock 掩盖设计；
- 测量 contention 和 hold time。

`Mutex` 在竞争时会阻塞 OS thread。它可以是小同步状态的正确工具，但不是把整个 async
workflow 锁起来的方式。

### 11.3 Atomic：单次操作原子不等于业务事务

Atomic 可以安全表达：

- 单调计数；
- 标志位；
- reference 发布；
- 一个编码在单值中的有限状态机；
- compare-and-exchange 循环。

但：

```text
atomic load(balance)
→ 检查 balance >= amount
→ atomic store(balance - amount)
```

三步组合并不因每一步是 atomic 就整体原子。多个变量间的不变量更适合 lock、actor 或
事务。

Atomic 还要求正确选择 memory ordering。`relaxed`、acquiring、releasing、sequentially
consistent 等不是性能档位，而是可见性合同；没有明确证明时不要自行降低 ordering。

`Synchronization.Atomic`、平台 C atomics 或 Swift Atomics package 都是库能力，不是
Swift 关键字；可用性和具体 API 要按工具链复核。

### 11.4 不要在 Async 代码里用 Semaphore 等待 Async 结果

典型反模式：

```text
启动 async 工作
→ semaphore.wait()
→ completion 中 signal()
```

若 completion 需要当前被阻塞的 executor / thread 才能运行，会形成死锁；即使不死锁，
也会阻塞 cooperative pool、造成 thread starvation 和 priority inversion。

应保持调用链 async，或用正确的一次性 continuation 桥接 callback API。

## 12. 顺序与确定性必须显式设计

### 12.1 Race-free 不等于 Deterministic

程序可以没有 data race，但输出仍受以下因素影响：

- 网络完成顺序；
- TaskGroup completion order；
- actor reentrancy；
- priority；
- timeout；
- 随机数；
- 时钟；
- 并行浮点 reduction 的组合顺序。

“每次结果都一样”是比“没有 data race”更强的要求。

### 12.2 先声明哪一种顺序重要

不要只说“保持顺序”，要说明：

- 输入顺序；
- 调用顺序；
- 开始顺序；
- 完成顺序；
- 提交顺序；
- 数据库 commit 顺序；
- UI 发布顺序；
- 事件 sequence 顺序。

很多系统只需要“发布顺序稳定”，内部仍可以并发完成。

### 12.3 保持输出顺序的策略

- child 返回 `(index, value)`，parent 按 index 汇合；
- 使用 sequence number / generation；
- 只让单一 owner 发布；
- 用状态机拒绝过期 transition；
- 将无序完成结果写入 keyed storage；
- 所有输入完成后执行稳定 sort；
- 对 side effect 使用 idempotency key。

### 12.4 Parallel Reduction 可能改变数值结果

整数在不溢出的前提下，某些结合操作可以自由分组。浮点加法不满足数学上的严格结合律：

```text
(a + b) + c 可能不等于 a + (b + c)
```

并行 reduction 改变组合树后，低位结果可能变化。需要 bitwise reproducibility 时必须固定
reduction 顺序或采用专门数值算法。

### 12.5 不要用 `sleep` 建立顺序

测试中加入延迟只能改变概率：

```text
Task.sleep
≠
happens-before
≠
某个 task 已开始
≠
某个写入已发布
```

应使用可观察状态、awaitable test gate、continuation、actor 状态机或真实 completion
事件建立因果关系。

## 13. Priority、Fairness 与 Starvation

### 13.1 Task Priority 是调度提示

Task priority 可以影响 executor 和平台 scheduler，但精确解释由 executor / 平台决定。
不能用 priority 保证：

- 严格先后；
- deadline；
- 公平；
- 立即执行；
- 固定 QoS thread；
- 永不饥饿。

### 13.2 Task Tree 帮助传播 Priority

Structured child 默认继承 parent priority。当高优先级 task 等待较低优先级工作时，
Runtime 模型可以进行 priority escalation，减少 inversion。

这仍不能修复：

- 长时间持锁；
- 高优先级工作依赖低优先级同步 I/O；
- 无界高优先级 fan-out；
- actor 内单个 job 执行太久；
- 外部服务根本不理解 Swift priority。

### 13.3 Priority Inversion

```text
高优先级 Task H
→ 等待资源 R
→ R 被低优先级 Task L 持有
→ 中优先级工作持续抢占 L
→ H 间接被延迟
```

修复优先考虑：

- 缩短临界区；
- 避免跨模块持锁；
- 不在锁内 I/O / callback；
- 使用结构化依赖让 Runtime 看见等待关系；
- 将资源 owner 放在合适的 isolation；
- 避免用 priority 掩盖错误依赖图。

### 13.4 `Task.yield()` 不是公平调度器

`yield()` 表示当前 task 自愿让出一次运行机会。没有其他合适工作时，它可以很快恢复；
有竞争时也不保证指定 task 先运行。它适合长计算中的合作点，不适合实现锁、barrier 或
确定顺序。

## 14. 并发性能如何测量

### 14.1 先建立串行 Baseline

对同一输入、设备、构建配置，记录并发度 1 的：

- wall-clock latency；
- CPU time；
- peak memory；
- energy；
- I/O bytes；
- 请求错误率。

没有 baseline，就无法判断并发是在加速还是只增加复杂度。

### 14.2 扫描并发度，而不是猜一个常数

测试：

```text
concurrency = 1, 2, 4, 8, 16, ...
```

观察：

- throughput 是否继续增长；
- p50 / p95 / p99 latency；
- CPU utilization 和 core scaling；
- task running / alive / total；
- max in-flight；
- actor wait / lock wait；
- context switch；
- cache miss / memory bandwidth；
- peak memory；
- server 429 / timeout / retry；
- cancellation 后浪费工作。

最佳并发度可能随设备、输入大小、网络和 thermal state 改变。

### 14.3 Amdahl 上限

若工作中串行比例是 `S`，理想使用 `N` 个并行资源时，理论加速上限近似：

```text
speedup ≤ 1 / (S + (1 - S) / N)
```

它提醒：

- 串行汇合、锁和 actor 热点会限制收益；
- 增加 task 数无法突破串行部分；
- 现实还要减去 task、同步、cache 和合并开销。

### 14.4 Task 粒度

任务太大：

- core 利用不足；
- 取消响应慢；
- tail latency 高。

任务太小：

- 创建/调度/汇合成本占比高；
- captures 和 frame 增多；
- cache locality 变差；
- instrumentation 噪声增大。

应测量 chunk size，而不是默认“一元素一 task”。

### 14.5 Apple 平台工具

根据 Xcode 版本可使用：

- Swift Tasks / Swift Actors / Swift Concurrency instruments；
- Time Profiler 或 CPU Profiler；
- System Trace；
- Points of Interest / signpost；
- Thread Sanitizer；
- Memory 和 Allocations；
- Energy Log 或相应功耗工具。

工具分别回答不同问题：

| 问题 | 证据 |
| --- | --- |
| task 是否真的重叠 | Task timeline / running tasks |
| 是否物理并行 | 多线程 on-CPU 区间、CPU utilization |
| actor 是否成为瓶颈 | actor wait、mailbox / executor contention |
| 是 CPU 慢还是在等待 | samples、thread state、System Trace |
| 是否无界创建 task | alive / total tasks、内存 |
| 是否有底层 data race | Thread Sanitizer |

Thread Sanitizer 不会证明业务逻辑没有 stale-result race；Swift Concurrency instrument 也不
会替代业务不变量。

## 15. Swift 语言与平台实现的边界

| 层 | 例子 | 本篇能依赖的内容 |
| --- | --- | --- |
| Swift 语言 | `async`/`await`、`async let`、actor、isolation、`Sendable` | 控制流、child task 和数据隔离语义 |
| Swift 标准库 | `Task`、`TaskGroup`、`AsyncSequence`、`Synchronization` | API 合同，需按工具链版本复核 |
| Swift Runtime | executor、task scheduling、continuation frame | 实现公开并发语义；具体策略可演进 |
| OS | thread、scheduler、core、I/O、QoS | 实际执行资源和平台行为 |
| Apple frameworks | Dispatch、URLSession、Operation | 平台 API 自己的 queue、取消和资源合同 |
| 开发工具 | Instruments、Thread Sanitizer | 当前一次运行的观测证据 |

特别不能依赖：

- global executor 固定有几条 thread；
- 一个 Task 固定绑定一条 thread；
- child 按创建顺序启动；
- actor mailbox FIFO；
- async let 一定并行；
- `Task.detached` 一定离开某个 actor 后在后台 core 运行；
- 某个设备测得的最佳并发度适合所有平台。

## 16. 常见误区

### “Async 就是并发”

错误。连续 `await` 仍然是单 task 的顺序调用。并发需要 child task、独立 producer 或其他
同时存活的工作。

### “并发一定更快”

错误。并发可能增加调度、内存、cache、锁、服务端限流和合并成本。

### “并发就是并行”

错误。并发可以在一个执行资源上交错；并行要求同刻使用多个执行资源。

### “TaskGroup 会自动选择最佳并发度”

错误。Runtime 限制执行线程宽度，不等于限制 child task、网络请求或内存。业务资源上限
仍需显式设计。

### “创建一万个 Task 不会创建一万条线程，所以没有成本”

错误。Task、capture、请求、buffer、结果和外部资源仍有成本。

### “TaskGroup 保持 addTask 顺序”

错误。Child 可以按任意顺序调度和完成；`next()` 面向可用完成结果。

### “Actor 等于 FIFO Serial Queue”

错误。Actor 隔离片段互斥，但等待任务不保证按到达顺序运行，async 方法还可在 `await`
处重入。

### “Actor 消除了所有 Race”

错误。它防止隔离状态的 data race；stale result、check-then-act 等逻辑 race 仍要用状态机
解决。

### “`Sendable` 表示对象内部所有操作都是线程安全的”

不准确。`Sendable` 是跨 concurrency domain 的安全合同；具体安全可能来自不可变值、
内部同步或 isolation，并不自动让任意复合操作成为事务。

### “Atomic 变量让整个对象线程安全”

错误。Atomic 只保护相应原子操作；多字段不变量和多步操作仍需更高层同步。

### “Mutex 一定比 Actor 快”

错误。负载、竞争、临界区、调用边界、阻塞成本和优化目标不同，必须测量。

### “在锁里 await，回来再解锁就能保护 async 事务”

错误且危险。会阻塞执行资源、形成死锁和优先级反转。跨 `await` 的业务不变量应以状态机、
预留/提交或补偿设计。

### “提高 Priority 就能修复卡顿”

错误。Priority 不减少工作量，也不能修复 blocking、actor contention、锁依赖或错误算法。

### “加一点 sleep 可以让测试稳定”

错误。Sleep 改变概率，不建立因果顺序。

### “Thread Sanitizer 没报警就没有并发 Bug”

错误。它主要发现运行路径上的底层 data race，不发现所有逻辑 race、deadlock、starvation
或遗漏取消。

## 17. 诊断路线

### 17.1 结果偶尔错误

```text
先写出正确不变量和要求的顺序
→ 判断是否同一内存并发读写（data race）
→ 开严格并发检查与 Thread Sanitizer
→ 若内存访问合法，检查 actor await 前后、generation、状态机
→ 检查完成顺序是否误当输入顺序
→ 用受控 gate 重现，不用 sleep 猜时间
```

### 17.2 “用了并发却没有加速”

```text
建立 concurrency=1 baseline
→ 确认真的创建了独立 child task
→ 看 task timeline 是否重叠
→ 看是否都被同一 actor / lock 串行化
→ 判断 CPU-bound 还是 I/O-bound
→ 看 CPU core 利用、I/O wait、server limit
→ 检查任务粒度和汇合成本
→ 扫描并发度并比较吞吐、尾延迟、内存
```

### 17.3 CPU 很低但延迟很高

```text
区分 task suspended 与 thread blocked
→ 查网络/磁盘/数据库等待
→ 查 actor / lock contention
→ 查 semaphore 和同步 I/O
→ 画 wait-for graph
→ 查 continuation 是否漏 resume
→ 查 task group 是否等待不响应取消的 child
```

### 17.4 CPU 满载但吞吐不增长

```text
查过量并发和 context switch
→ 查 cache / memory bandwidth
→ 查热点锁或 atomic retry
→ 查重复工作与取消后浪费
→ 增大 task chunk
→ 降低并发度
→ 优化算法和数据布局
```

### 17.5 内存随流量增长

```text
统计 alive / total task
→ 查是否一次性 addTask 全部输入
→ 查 AsyncStream 是否默认 unbounded
→ 查结果是否必须全部保留
→ 查 actor mailbox / queue 深度
→ 查取消后 task 是否仍运行
→ 引入滑动窗口、分页、流式消费或明确 drop policy
```

### 17.6 完成或 UI 发布顺序错误

```text
列出创建、启动、完成、消费、发布五种顺序
→ 标记业务真正需要哪一个
→ child 返回 identity / index
→ parent 或单一 actor 统一发布
→ 加 generation / idempotency
→ 不依赖 actor FIFO、priority 或 sleep
```

### 17.7 偶发 Hang / Deadlock

```text
抓取所有等待对象
→ 构造 thread / lock / task / actor 的 wait-for graph
→ 找同步等待环
→ 查持锁 callback、持锁 I/O
→ 查 async→semaphore→async bridge
→ 查 cooperative pool 内 blocking
→ 查 continuation exactly-once
→ 查取消路径是否归还 permit / 关闭资源
```

## 18. 设计决策清单

引入并发前回答：

1. 哪些工作没有数据或业务依赖，可以重叠？
2. 目标是降低单次 latency，还是提高 throughput？
3. 工作是 I/O-bound、CPU-bound，还是多阶段混合？
4. 真正受限资源是什么？
5. 最大 in-flight 怎样得出，谁统一拥有这个限制？
6. 结果需要输入顺序、完成顺序还是无序？
7. 一个 child 失败后，是 fail-fast、收集部分结果还是继续？
8. 取消怎样到达底层 I/O / CPU loop？
9. 状态能否由 parent 独占汇合，避免共享写？
10. 必须共享时，用 actor、Mutex 还是 Atomic，为什么？
11. 跨 `await` 的业务不变量怎样重新验证？
12. 如何证明没有 data race，又如何发现逻辑 race？
13. 需要哪些 latency、throughput、memory、energy 和错误指标？
14. 在哪些设备、构建模式、输入规模上验证？

如果这些问题没有答案，“把循环改成 TaskGroup”还不是一个完整并发设计。

## 19. 线路摘要

```text
先确定业务依赖与顺序
→ 找出可以独立推进的工作
→ 用 async let / TaskGroup 建立结构化 task tree
→ 按真实资源限制 in-flight
→ 让 child 返回值，优先由 parent 汇合
→ 必须共享时选择 actor / Mutex / Atomic
→ 显式处理错误、取消、backpressure 和结果顺序
→ Runtime 调度可运行 job
→ OS / 硬件决定是否物理并行
→ 用 timeline、CPU、等待、内存和尾延迟验证
```

最短结论：

```text
async 提供挂起能力
concurrency 提供重叠推进
parallelism 是同刻执行
isolation / synchronization 提供状态安全
ordering / state machine 提供业务正确性
measurement 才能证明性能收益
```

上一条：[异步与挂起](02-asynchronous-and-suspension.md)。

下一条：[Task、Actor 与 Executor](04-task-actor-and-executor.md)。

## 一级资料

- [The Swift Programming Language — Concurrency](https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html)
- [SE-0304: Structured Concurrency](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0304-structured-concurrency.md)
- [SE-0317: `async let` Bindings](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0317-async-let.md)
- [SE-0306: Actors](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0306-actors.md)
- [SE-0302: `Sendable` and `@Sendable` Closures](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0302-concurrent-value-and-concurrent-closures.md)
- [Swift Standard Library — TaskGroup](https://developer.apple.com/documentation/swift/taskgroup)
- [Swift Standard Library — Task](https://developer.apple.com/documentation/swift/task/)
- [Swift Standard Library — AsyncStream](https://developer.apple.com/documentation/swift/asyncstream)
- [Swift Synchronization Module](https://developer.apple.com/documentation/synchronization)
- [Swift Synchronization — Mutex](https://developer.apple.com/documentation/synchronization/mutex)
- [Swift Synchronization — Atomic Update Ordering](https://developer.apple.com/documentation/synchronization/atomicupdateordering)
- [Xcode — Data Races and Thread Sanitizer](https://developer.apple.com/documentation/xcode/data-races)
- [WWDC22 — Visualize and Optimize Swift Concurrency](https://developer.apple.com/videos/play/wwdc2022/110350/)
- [WWDC25 — Optimize CPU Performance with Instruments](https://developer.apple.com/videos/play/wwdc2025/308/)
