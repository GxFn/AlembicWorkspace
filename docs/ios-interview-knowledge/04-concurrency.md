# iOS 并发：GCD、同步原语与 Swift Concurrency

> 知识树定位：C1 基础执行模型、C2 GCD/Operation、C3 同步与一致性、C4 Swift Concurrency、C5 数据流。

## 1. 先建立术语

- 并发：多个任务的生命周期重叠；
- 并行：多个任务在同一时刻由不同计算资源执行；
- 异步：调用方不等待结果立即返回；
- 线程：操作系统调度的执行资源；
- 队列：任务的提交和排序抽象；
- Task：Swift Concurrency 中的异步工作单元，不等同于一条固定线程。

`async` 不保证并行，队列也不等于线程。

## 2. GCD

### 2.1 Serial 与 Concurrent

- 串行队列一次执行一个提交到该队列的任务，适合保护状态和表达顺序；
- 并发队列允许多个任务重叠执行；
- 两者通常都是 FIFO 开始顺序，不等于并发任务的完成顺序；
- 主队列是绑定主线程的串行队列。

### 2.2 `sync` 与 `async`

- `sync`：提交后等待任务完成；
- `async`：提交后立即继续；
- 在主线程对主队列 `sync` 会死锁；
- 在某个串行队列内部再次同步派发到同一队列也会死锁。

死锁的本质是等待图形成环，而不是某个 API 名字本身。

### 2.3 QoS

QoS 表达工作的用户可感知优先级：

- userInteractive；
- userInitiated；
- utility；
- background。

高优先级任务等待低优先级持有的资源会产生优先级反转。不要用提高所有任务优先级来掩盖依赖设计问题。

### 2.4 常用工具

| 工具 | 适用 | 注意 |
| --- | --- | --- |
| DispatchGroup | 等待一组异步任务 | enter/leave 必须严格配对 |
| Barrier | 在自建并发队列中协调读写 | 全局队列语义不同，不要滥用 |
| Semaphore | 限流或桥接少量同步边界 | 阻塞线程、易死锁/反转 |
| DispatchSource | Timer、文件、信号等系统事件 | 生命周期、取消处理 |
| DispatchWorkItem | 可观察/取消意图的工作项 | 取消通常是协作式 |

## 3. 锁与同步

### 3.1 选择原则

1. 优先消除共享可变状态；
2. 其次用串行执行域或 Actor 封装；
3. 必须用锁时，缩小临界区并规定锁顺序；
4. 不在持锁期间执行未知回调、同步 I/O 或跨模块调用；
5. 用 Thread Sanitizer、压力测试和日志验证。

### 3.2 常见原语

- `os_unfair_lock`：低层互斥，不保证公平，不能递归；
- `NSLock`：通用互斥；
- `NSRecursiveLock`：允许同线程递归，但可能掩盖结构问题；
- `NSCondition` / condition variable：等待条件变化；
- 读写锁：读多写少才可能有价值；
- 原子操作：适合小而明确的状态机，不等于整个对象线程安全。

### 3.3 数据竞争与竞态条件

- 数据竞争：并发访问同一内存，至少一个写且缺少同步；
- 竞态条件：结果依赖不可控时序，范围比数据竞争更广；
- 没有数据竞争的程序仍可能有逻辑竞态，例如过期请求覆盖新结果。

## 4. OperationQueue

相比裸 GCD，Operation/OperationQueue 提供：

- 依赖关系；
- 并发数限制；
- 状态观察；
- 取消；
- 更适合构建可组合任务图。

自定义异步 Operation 的难点是正确维护执行/完成状态、KVO 兼容和所有退出路径。若项目以 Swift Concurrency 为主，应重新判断是否还需要自定义 Operation 状态机。

## 5. Swift Concurrency

### 5.1 Structured Concurrency

结构化并发把子任务生命周期限制在词法作用域中：

- `async let`：固定少量并行子任务；
- `withTaskGroup`：动态数量子任务；
- 作用域结束前收集或取消子任务；
- 错误和取消沿结构传播，更容易推理资源释放。

```swift
async let profile = loadProfile()
async let feed = loadFeed()
let result = try await (profile, feed)
```

### 5.2 `Task` 与 `Task.detached`

- `Task {}` 通常继承当前优先级、Task Local 和 Actor 上下文；
- `Task.detached` 切断大部分继承关系；
- detached 不是“更快的后台线程”，只在确实需要独立上下文时使用；
- 创建无主 Task 会削弱结构化生命周期，必须明确谁取消、谁等待、谁接收错误。

### 5.3 Cancellation

Swift Task 取消是协作式：

- 检查 `Task.isCancelled`；
- 使用 `Task.checkCancellation()`；
- 调用支持取消的异步 API；
- 在循环和阶段边界及时响应；
- 清理资源并保留正确错误语义。

取消标记不等于代码瞬间停止。

## 6. Actor

Actor 通过隔离可变状态降低数据竞争风险。

```swift
actor ImageCache {
    private var values: [URL: Data] = [:]

    func value(for url: URL) -> Data? {
        values[url]
    }

    func insert(_ data: Data, for url: URL) {
        values[url] = data
    }
}
```

### 6.1 Reentrancy

Actor 方法执行到 `await` 时可能让其他任务进入同一 Actor。因此：

```text
await 之前读取的状态
≠
await 之后仍然有效的状态
```

修复方式：

- 在 await 后重新验证版本或状态；
- 把关键变更设计为原子状态转换；
- 在 Actor 外完成慢操作，再回 Actor 提交；
- 使用请求 ID / generation 防止过期结果覆盖。

Actor 避免数据竞争，但不会自动消灭业务竞态。

## 7. MainActor

`@MainActor` 表达与全局主 Actor 的隔离，适合 UI 状态和需要主执行域的模型。它不应被简单解释为“每一行都重新 dispatch 到主队列”。

原则：

- UI 可观察状态集中在 MainActor；
- 网络、解析、图片处理不要因为调用点在 MainActor 就全部做在主执行域；
- 异步非隔离工作完成后再回主 Actor 提交最小状态；
- 不用 `MainActor.assumeIsolated` 绕过不能证明的隔离。

## 8. Sendable

`Sendable` 表示值可以安全跨并发隔离域传递：

- 纯值且成员都 Sendable 的结构通常容易满足；
- 含共享可变状态的类需要隔离、同步或不可变设计；
- `@unchecked Sendable` 是开发者承担正确性证明，不是消除警告的按钮；
- 闭包跨域时常需要 `@Sendable`，捕获也必须满足安全要求。

## 9. Continuation

Continuation 用于把 completion-handler API 桥接为 async：

```swift
func load() async throws -> Data {
    try await withCheckedThrowingContinuation { continuation in
        legacyLoad { result in
            continuation.resume(with: result)
        }
    }
}
```

硬规则：

- 每条路径恰好 resume 一次；
- 不能漏掉取消、超时或早退；
- Checked Continuation 帮助发现部分误用，但不替代生命周期设计；
- 若底层支持取消，应建立 Task 取消到旧 API 的传播。

## 10. 典型方案：可取消图片加载

需求：

- cell 复用时取消旧请求；
- 相同 URL 合并请求；
- 限制并发；
- 内存/磁盘缓存；
- 只让最新 generation 更新 UI。

可分层：

```text
Cell/View
→ ImageLoader（请求 token / Task）
→ In-flight registry actor
→ URLSession
→ decode/downsample worker
→ cache actor
→ MainActor 更新当前 cell
```

验证：

- 快速滚动不出现错图；
- 复用后旧任务及时取消；
- 同 URL 不重复下载；
- 内存峰值可控；
- 主线程无图片解码长任务；
- 弱网/失败/重试遵守策略。

## 11. 高频问题

### Q1：串行队列为什么还会死锁？

当前任务同步等待同一串行队列上的后续任务，而后续任务必须等当前任务结束。

### Q2：Actor 是否保证业务逻辑正确？

只提供隔离和串行访问语义；跨 `await` 会重入，过期覆盖等逻辑竞态仍需状态版本控制。

### Q3：`Task.detached` 什么时候用？

确实需要与当前 Actor、优先级和 Task Local 解耦的独立任务；普通异步工作优先保持结构化继承。

### Q4：如何定位偶现并发问题？

先收集线程/任务、状态版本和时间线；使用 TSan（受平台支持限制）、压力测试、可重放输入、锁等待/挂起证据；不要只加延迟“修复”。

### Q5：Semaphore 可以把异步 API 变同步吗？

技术上可能，但会阻塞线程、引入死锁和优先级反转，尤其不能在回调所需执行域上等待。应优先用 async 桥接和结构化生命周期。
