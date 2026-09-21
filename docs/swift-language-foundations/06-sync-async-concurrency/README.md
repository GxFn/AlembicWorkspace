# 同步、异步与并发：四条时间线路

方法派发回答“执行哪个实现”，本组文档回答“实现如何随时间推进”。二者正交：

```text
名称与类型确定声明
→ 四种派发之一确定具体实现
→ 同步执行，或进入 async 状态机
→ 可能在 executor 上挂起与恢复
→ 与其他任务串行、并发或并行推进
```

本组同样不按 API 罗列，而按四条时间线路组织：

1. [同步与阻塞](01-synchronous-and-blocking.md)；
2. [异步与挂起](02-asynchronous-and-suspension.md)；
3. [并发与并行](03-concurrency-and-parallelism.md)；
4. [Task、Actor 与 Executor](04-task-actor-and-executor.md)。

## 1. 四组不能互换的概念

| 维度 | 两端 | 真正回答的问题 |
| --- | --- | --- |
| 调用关系 | synchronous / asynchronous | 调用者是否在普通调用栈中等到结果，函数是否允许挂起 |
| 等待方式 | blocking / suspending | 等待期间是否占住当前 OS thread |
| 工作组织 | serial / concurrent | 多项工作是否允许在时间上重叠推进 |
| 物理执行 | sequential / parallel | 同一时刻是否真的有多项工作在不同执行资源上运行 |

最重要的分离：

```text
async ≠ background thread
async ≠ concurrent
concurrent ≠ parallel
serial ≠ synchronous
suspending ≠ blocking
```

## 2. 组合而不是二选一

### 2.1 同步、快速、非阻塞

```swift
func normalize(_ value: Int) -> Int {
    max(0, min(value, 100))
}
```

调用者在普通调用栈中获得结果，但函数没有等待外部资源。

### 2.2 同步、阻塞

```swift
let data = try Data(contentsOf: url)
```

从调用者看是同步 API；如果底层 I/O 需要等待，执行它的线程可能被占住。具体 API
合同仍要查平台文档，示例只说明概念组合。

### 2.3 异步、可能挂起

```swift
let (data, _) = try await URLSession.shared.data(from: url)
```

调用 Task 在 `await` 对应的调用处允许挂起；运行该 Task 的线程可以去执行其他工作。
这不保证返回后仍在同一条 OS thread，也不等于自动并行。

### 2.4 并发但不并行

单线程 event loop 可以让多项工作交错推进，却在任一时刻只执行一项。

### 2.5 并行但调用点仍同步等待

一个同步函数内部可以使用并行算法或线程池，最后等待全部分支完成再同步返回。调用者
看到的是同步边界，内部实现却可能并行。

## 3. 一次 `await` 调用的完整剖面

```swift
protocol Repository {
    func load(id: Int) async throws -> Record
}

let record = try await repository.load(id: 42)
```

逐层分析：

1. `repository` 的静态类型决定 `load(id:)` requirement 可见；
2. 参数标签和类型完成重载解析；
3. 当前 conformer 的 witness 确定具体实现；
4. `try` 建立错误传播路径；
5. `await` 标记调用可能挂起当前 Task；
6. 若调用跨 actor isolation，执行还可能切换到目标 isolation 对应的 executor；
7. 挂起时 Task 的继续状态被保存，线程不需要等在原调用栈；
8. 被等待工作完成后，Task 成为可运行状态；
9. executor 调度 continuation 继续执行；
10. 成功返回 `Record`，或者沿错误 / 取消路径退出。

这段链把四类机制分开了：

```text
witness 选择实现
async 状态机保存控制流
executor 安排可运行工作
actor isolation 保护状态
```

它们可能协作，但不能相互定义。

## 4. `await` 的准确含义

`await` 表示“这里调用的异步操作可能使当前 Task 挂起”。它不保证每次实际挂起：

- 被调用函数可以同步完成；
- 优化和 Runtime 状态可能让结果立即可用；
- `await` 仍是重要的语义边界，因为 suspension 会使外部世界在恢复前发生变化。

在 actor-isolated 代码中，`await` 尤其意味着：

> 恢复时 actor 的隔离状态可能已经被其他工作修改，必须重新验证依赖条件。

因此含 `await` 的 actor 方法不能被当作一个自动跨挂起点的事务。

## 5. Task、Thread、Executor、Actor

| 概念 | 是什么 | 不是什么 |
| --- | --- | --- |
| Task | 一项异步工作的生命周期、优先级、取消和 task-local 上下文 | 固定的一条线程 |
| Thread | OS 调度的执行资源，有自己的调用栈 | Swift 结构化并发的逻辑任务单位 |
| Executor | 安排可运行 job 的抽象执行服务 | 语言保证的一线程一队列 |
| Actor | 隔离可变状态，并串行化对其隔离状态的同步访问 | 普通 GCD serial queue 或自动事务 |
| Continuation | 挂起后恢复逻辑工作的句柄 / 状态桥梁 | 可以任意重复恢复的 completion |

一个 Task 在生命周期内可以由不同线程运行；一个线程也会先后运行多个 Task 的 job。
代码应依赖 isolation 与 `Sendable`，不依赖线程身份保持不变。

## 6. Structured 与 Unstructured

### 6.1 Structured concurrency

`async let` 和 task group 把子任务生命周期限制在词法作用域内：

- 父任务能等待子任务；
- 优先级、取消和 task-local 上下文有结构化传播关系；
- 作用域退出前，子任务必须得到处理。

### 6.2 Unstructured task

`Task { ... }` 创建的任务有句柄和继承语义，但生命周期不由一个 task group 的词法
结构自动封闭。丢弃句柄会失去显式等待结果和定向取消的能力。

### 6.3 Detached task

`Task.detached` 切断更多上下文继承关系，应当是有理由的边界，而不是“更后台”或
“更快”的同义词。

## 7. Actor 隔离与可重入

Actor 的核心保证是对隔离状态的受控访问。一个没有挂起的 actor-isolated 同步片段
不会与同一 actor 上另一个这样的片段同时访问隔离状态。

但是：

```swift
actor Inventory {
    private var stock = 1

    func reserve() async -> Bool {
        guard stock > 0 else { return false }
        await auditAvailability()
        // stock 可能在挂起期间已变化
        guard stock > 0 else { return false }
        stock -= 1
        return true
    }
}
```

跨越 `await` 后，其他工作可能已经进入 actor。恢复时应重新验证不变量，或在挂起前
完成必须原子化的状态变化并设计补偿路径。

## 8. `Sendable` 与派发的关系

`Sendable` 约束值能否安全跨并发 isolation boundary；它不决定调用走 direct、
vtable、witness 还是 Objective-C message。

协议本身可以同时承担两个不同角色：

```swift
protocol Request: Sendable {
    func encoded() -> Data
}
```

- `Sendable` 说明值跨隔离域的安全合同；
- `encoded()` requirement 通过 conformance 形成 witness 派发语义。

同一个协议声明里出现二者，不代表 witness table 提供了 actor 安全；安全仍由类型
状态、可变性、隔离和编译器检查共同建立。

## 9. 取消是协作式控制流

调用 `cancel()` 通常只是设置取消状态并传播信号，不会任意中断当前指令。异步代码要
通过以下方式响应：

- 调用会检查取消的 async API；
- 使用 `Task.checkCancellation()`；
- 读取 `Task.isCancelled` 并清理；
- 正确处理取消造成的错误；
- 用 cancellation handler 关闭外部操作或桥接回调。

因此“已取消”与“已经停止执行”不是同一时刻的状态。

## 10. 与 GCD 的边界

`DispatchQueue.async` 是 Dispatch 框架提交 closure 的 API；Swift `async func` 是
语言级可挂起函数。二者可以桥接，但心智模型不同：

```text
Dispatch queue：把一个 block / closure 提交到队列
Swift async：把逻辑任务编译为可挂起、可恢复的控制流
```

不要为每个 async 函数手动包一层 `DispatchQueue.global().async`。只有真正阻塞的
遗留 API、明确的 queue affinity 合同或平台互操作需要相应边界，并且要考虑取消、
优先级、错误和 continuation 的正确桥接。

## 11. 版本敏感边界

异步函数在哪个 executor 上执行、未标注声明的默认 isolation，以及主模块是否默认
采用 `MainActor`，都可能受 Swift 版本与构建设置影响。特别是 Swift 6.2 之后的
approachable concurrency 相关提案，使“nonisolated async 一定去某个通用 executor”
这类旧口诀不再可靠。

分析真实项目时记录：

```text
编译器版本
Swift language mode
default actor isolation
upcoming features
目标 SDK / deployment target
调用声明的显式 isolation
```

## 12. 阅读决策

遇到“界面卡住”：

```text
先查是否在受限线程 / actor 上执行阻塞工作
→ 再查是否误把异步包装当作非阻塞
→ 最后查优先级、executor 饥饿和外部 I/O
```

遇到“数据竞争或编译器 isolation 报错”：

```text
先画 isolation boundary
→ 标出跨边界传递的值
→ 判断 Sendable / sending / ownership
→ 再决定 actor、锁、不可变快照或所有权转移
```

遇到“任务没有停止”：

```text
查取消信号是否到达
→ 查循环和桥接 API 是否检查取消
→ 查资源清理是否覆盖所有退出路径
```

下一步分别进入四条时间线路，而不是先背 Task API。
