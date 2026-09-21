# 错误、取消与资源：调用如何沿非正常线路退出

方法派发决定进入哪个实现；错误、取消和资源管理决定实现不能正常产生结果时，控制流
和所有权怎样离开。

```text
选择具体实现
→ 获取资源
→ 执行
├─ success → 返回值
├─ domain failure → throw / Result
├─ absence → Optional
├─ cancellation → 协作停止并清理
└─ broken invariant → assertion / precondition / fatal termination
```

## 1. 先给失败分类

| 情况 | 合适模型 | 例子 |
| --- | --- | --- |
| 合法但没有值 | `Optional` | 字典没有某个 key |
| 可恢复的操作失败 | `throws` | 文件不存在、网络响应无效 |
| 失败要作为值存储/组合 | `Result` | callback、状态机、批量结果 |
| 异步工作不再需要 | Task cancellation | 页面离开、上游任务失败 |
| 程序员违反不变量 | `assert` / `precondition` | 越过内部状态机合法边界 |
| 无法继续且不应恢复 | fatal termination | 进程级不可恢复配置损坏 |

不要把所有失败都压成 `Bool` 或 `nil`，也不要把业务输入错误写成崩溃断言。

## 2. Optional 表达“可能缺席”

```swift
func user(id: ID) -> User?
```

Optional 非常适合“没有结果本身是预期状态”，但信息容量只有 `.some` / `.none`。
当调用者需要知道失败原因、重试策略或上下文时，应使用错误类型。

Optional chaining：

```swift
let city = user.profile?.address?.city
```

它传播缺席，不记录是哪一段为何缺席。过长的 optional chain 可能把数据损坏与合法
缺席混为一谈。

## 3. `throws` 把错误加入控制流

```swift
enum ParseError: Error {
    case empty
    case invalidNumber(String)
}

func parse(_ text: String) throws -> Int {
    guard !text.isEmpty else {
        throw ParseError.empty
    }
    guard let value = Int(text) else {
        throw ParseError.invalidNumber(text)
    }
    return value
}
```

调用处显式决定：

```swift
let value = try parse(input)             // 向外传播
let value = try? parse(input)            // 压成 Optional
let value = try! parse(trustedConstant)  // 失败即终止；需要真实不变量
```

`try?` 会丢失错误原因；`try!` 不是“我懒得处理”的缩写。

## 4. `do` / `catch` 是模式匹配

```swift
do {
    let value = try parse(input)
    use(value)
} catch ParseError.empty {
    showEmptyMessage()
} catch ParseError.invalidNumber(let text) {
    showInvalidMessage(text)
} catch {
    report(error)
}
```

Catch clause 按顺序匹配错误。处理策略可以：

- 恢复并继续；
- 转换为当前层的错误；
- 添加上下文后重新抛出；
- 记录并向外传播；
- 将某些底层错误归类为同一领域错误。

不要在底层库里过早显示 UI 或吞掉错误；错误应在拥有恢复决策的边界处理。

## 5. Typed Throws 与 Untyped Throws

```swift
func parse(_ text: String) throws(ParseError) -> Int {
    // ...
}
```

Typed throws 保留错误集合，让调用者和泛型算法获得更精确的类型关系。普通
`throws` 可以理解为错误类型被抽象到 `any Error` 边界。

选择 typed throws 时考虑：

- 失败集合是否稳定且有领域意义；
- 实现是否组合很多不可控下游错误；
- 公开错误是否会扩大 API 演进合同；
- 调用者是否真正需要穷举；
- 当前 Swift language mode 和依赖是否支持相应签名。

不要为了“更现代”把每个内部函数都暴露成巨大联合错误；也不要用一个无信息
`.unknown` 抵消 typed throws 的价值。

## 6. `rethrows` 保留高阶函数关系

```swift
func withLock<R>(
    _ body: () throws -> R
) rethrows -> R {
    lock.lock()
    defer { lock.unlock() }
    return try body()
}
```

`rethrows` 表示函数自身不会独立制造错误，只有传入的 throwing function 抛错时才
可能向外抛。它让非 throwing closure 的调用者不必写 `try`。

这是函数类型和错误效果的关系，不是一种派发方式。

## 7. `Result` 把完成状态变成值

```swift
func legacyLoad(
    completion: @escaping (Result<Data, LoadError>) -> Void
)
```

`Result<Success, Failure>` 适合：

- callback 同时携带成功 / 失败；
- 结果需要存储、排队或传给其他组件；
- 批量操作保留每项结果；
- 状态机将完成结果作为事件。

在纯 async/await 代码中，`async throws -> Value` 通常更自然；不要在每层同时叠加
`async -> Result<Value, Error>`，除非失败确实要作为普通值而非控制流。

## 8. 错误类型应保留恢复信息

好的错误类型包含调用者能据此决策的信息：

```swift
enum RepositoryError: Error {
    case unauthorized
    case notFound(id: ID)
    case rateLimited(retryAfter: Duration?)
    case invalidPayload(underlying: any Error)
}
```

注意平衡：

- 不泄漏不稳定的底层实现细节；
- 保留诊断所需 underlying error；
- 不把日志文本当结构化错误码；
- 不在错误中放 secret、完整 token 或隐私数据；
- `LocalizedError` 的用户文本与程序恢复分支分开。

## 9. Cancellation 不是普通业务失败

Task cancellation 表示“上游不再需要这项工作”，通常应快速清理并向结构化父级传播。
它不是：

- 任意杀死线程；
- 自动回滚已经发生的副作用；
- 所有 API 都会立刻检查的异常；
- 一定要显示给用户的错误。

```swift
func index(_ documents: [Document]) async throws -> Index {
    var builder = IndexBuilder()

    for document in documents {
        try Task.checkCancellation()
        builder.add(try parse(document))
    }

    return builder.finish()
}
```

CPU 循环需要在合适粒度检查；太少会反应迟缓，太频繁也有成本。

## 10. 取消与副作用

考虑：

```swift
try await charge()
try Task.checkCancellation()
try await sendReceipt()
```

若 charge 已成功，之后收到取消不能假装一切未发生。需要明确：

- 操作是否幂等；
- 是否有 transaction；
- 是否需要补偿；
- 重试会不会重复副作用；
- 哪个阶段仍允许取消；
- 完成信号怎样持久化。

取消安全是一种业务状态机设计，不只是插入 `checkCancellation()`。

## 11. Cancellation Handler

当 Swift Task 要桥接可取消的底层工作时，需要把取消信号传给资源所有者：

```swift
try await withTaskCancellationHandler {
    try await operation.value()
} onCancel: {
    operation.cancel()
}
```

要处理取消与正常完成的竞态：

- onCancel 可能在 operation 完成前后发生；
- 底层 cancel 可能只是请求；
- continuation 仍必须只恢复一次；
- 状态共享要有 actor、锁或原子保护；
- 资源关闭必须幂等。

## 12. `defer`：封闭作用域退出路径

```swift
let handle = try openFile()
defer { handle.close() }

try process(handle)
```

`defer` 在当前 scope 退出时运行，覆盖正常 return 和 throw。多个 defer 按后进先出
执行，适合表达资源获取的逆序释放。

它不自动等待异步清理：

```swift
// defer { await connection.close() } // 普通 defer body 不能这样任意挂起
```

需要异步关闭的资源应设计显式 `await close()`、作用域 helper，或让结构化 API 在
closure 返回前完成清理。

## 13. `deinit` 不是业务事务提交点

ARC 在最后一个强引用消失时触发 class `deinit`。它适合释放对象拥有的同步底层资源，
但不适合承载必须可靠发生的远程提交：

- 对象可能被引用环延长；
- 具体释放时机不应成为业务时钟；
- 异步工作不能简单在 deinit 中等待；
- 进程异常结束不会保证任意清理逻辑。

重要资源应有显式生命周期和幂等关闭。

## 14. Assertion、Precondition 与 Fatal Error

概念区分：

- `assert`：开发期验证内部假设，优化构建下行为与检查可能不同；
- `precondition`：调用者必须满足的运行前条件，失败代表程序错误；
- `fatalError`：当前实现没有合法继续路径；
- `preconditionFailure` / `assertionFailure`：对应无条件失败形式。

它们不应处理服务器 500、用户输入错误或文件缺失等可恢复情况。

## 15. Dispatch 与错误是正交层

```swift
protocol Decoder {
    func decode(_ data: Data) throws -> Model
}
```

调用链：

```text
先通过 witness 找到具体 decode 实现
→ 进入 throwing function
→ success 返回 Model
→ failure 沿 error continuation 返回
```

Class override、direct target 和 Objective-C bridge 同样可以携带错误效果；Objective-C
边界可能把 `NSError**`、exception-free Cocoa convention 或 completion result
映射成 Swift `throws`，要以 importer 合同为准。

## 16. Async Throws 的完整退出面

```swift
func refresh() async throws -> Model {
    let token = try await authenticate()
    try Task.checkCancellation()
    let data = try await download(token: token)
    return try decode(data)
}
```

至少有这些出口：

```text
authentication error
explicit cancellation
download error / cancellation
decode error
success
```

每个已获取资源和已发生副作用都要在所有相关出口上有清理或状态记录。

## 17. 错误转换的层级

```text
系统层：POSIX / URL / database error
→ 基础设施层：TransportError / StorageError
→ 领域层：AuthenticationRequired / DuplicateOrder
→ 展示层：本地化消息与用户操作
```

并非每层都必须创建新枚举。只有当新层：

- 隐藏下层不稳定细节；
- 增加恢复语义；
- 合并多个等价失败；
- 添加必要上下文；

错误转换才产生价值。否则保留 underlying error 和调用链更易诊断。

## 18. 常见误区

### “所有失败都用 throws”

缺席、取消、业务状态、程序错误有不同模型。

### “catch 以后打印一下就算处理”

如果不能恢复，应传播或转换；仅打印后继续可能制造无效状态。

### “取消会立即终止 Task”

取消是协作信号，代码和底层 API 必须观察它。

### “defer 能处理一切清理”

普通 defer 不能跨作用域异步等待，也无法补偿已经提交的外部副作用。

### “deinit 一定及时发生”

生命周期受所有权图影响，且 deinit 不应是远程业务操作的可靠触发器。

### “typed throws 永远更好”

精确错误类型扩大合同，组合不稳定依赖时可能增加耦合。

## 19. 设计检查表

```text
失败属于缺席、可恢复错误、取消还是程序错误？
→ 调用者需要什么恢复信息？
→ 错误是否应跨 module / actor / process？
→ 哪些副作用已经发生？
→ 哪些资源必须在每条出口释放？
→ 取消能在哪些阶段被接受？
→ 重试是否幂等、是否限流？
→ 日志与用户消息是否泄漏敏感信息？
```

## 20. 总结

```text
错误类型描述可恢复失败
Optional 描述合法缺席
Result 把完成状态保存为值
Cancellation 表示工作不再需要并要求协作
defer / 显式 close 封闭资源生命周期
assertion / precondition 保护程序不变量
```

它们都附着在函数调用的退出面上，不替代四种方法派发主干。
