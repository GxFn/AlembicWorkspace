# 内存、生命周期与所有权：调用边界上的值怎样存活

本篇横穿[四条方法派发线路](03-method-dispatch/README.md)。派发决定“进入哪个实现”，
所有权决定“receiver、参数、返回值和捕获上下文怎样安全地进入并离开实现”。

## 1. 先拆开五个问题

| 问题 | 核心概念 | 不应混同为 |
| --- | --- | --- |
| 复制后是否独立 | 值语义 / 引用语义 | 栈 / 堆 |
| 对象何时销毁 | lifetime、ARC、作用域 | 变量是否写成 `let` |
| 谁负责一个值 | ownership、borrow、consume | 是否可修改 |
| 访问能否重叠 | exclusivity、`inout` | 多线程数据竞争 |
| 能否跨隔离域 | `Sendable`、`sending`、actor isolation | ARC 线程安全 |

这些系统相互作用，但分别解决不同问题。

## 2. 值语义、引用语义与对象身份

### 2.1 值语义

```swift
struct Point {
    var x: Int
    var y: Int
}

var a = Point(x: 1, y: 2)
var b = a
b.x = 9
```

程序应观察到 `a.x` 仍为 `1`。编译器是否真的逐字节复制、值放在哪里、是否暂时共享
存储，都属于实现与优化。

### 2.2 引用语义

```swift
final class Counter {
    var value = 0
}

let first = Counter()
let second = first
second.value += 1
```

两个绑定引用同一对象；`let first` 固定的是引用绑定，不能让对象的 `var value`
自动变为不可变。

### 2.3 `struct` 与 class 引用可以嵌套

```swift
struct Session {
    var cache: Cache
}
```

复制 `Session` 会复制其中的引用值，两个 Session 仍可能引用同一 `Cache` 对象。
因此：

```text
外层是 struct
≠
整个对象图具有深复制语义
≠
运行时完全不需要 ARC
```

## 3. 存储位置不是语言语义

“struct 在栈、class 在堆”无法解释真实 Swift：

- escaping closure 可以把值捕获到堆分配上下文；
- existential 可能 inline 存储小值，也可能使用 box；
- Array 的元素位于其缓冲区；
- class 引用本身可以位于寄存器、栈帧或另一个对象字段；
- 优化器可以消除分配或把对象提升到不同存储形式。

应讨论值语义、身份、生命周期和分配观测，而不是用类型声明直接推断物理位置。

## 4. ARC 管理什么

Automatic Reference Counting 主要跟踪 class 实例等引用对象的强引用生命周期：

```text
产生强引用
→ 对象保持存活
→ 强引用释放
→ 最后一个强引用消失
→ 执行 deinit
→ 回收对象存储
```

源代码中的每次赋值不等于机器码中的一次 retain；Swift 的所有权分析和优化器可以
合并、移动或消除引用计数操作，只要可观察生命周期保持正确。

### 4.1 Strong、weak、unowned

- strong：保持对象存活；
- `weak`：不保持对象存活，对象销毁后自动变成 `nil`，因此是可选引用；
- `unowned`：不保持对象存活，表达使用期间对象应仍存在；假设违反时会失败；
- `unowned(unsafe)`：去掉安全检查，错误生命周期可能造成未定义行为，只适合极少数
  已有外部证明的边界。

选择依据是对象图中的生命周期关系，不是“为了消除警告统一写 weak”。

### 4.2 引用环

```swift
final class Owner {
    var child: Child?
}

final class Child {
    weak var owner: Owner?
}
```

需要先画所有权图：

```text
谁拥有谁
谁只观察谁
谁保证比谁长寿
哪个边必须在结束时断开
```

闭包也可能成为图中的强引用节点：

```swift
final class Controller {
    var onEvent: (() -> Void)?

    func start() {
        onEvent = { [weak self] in
            self?.handle()
        }
    }

    private func handle() {}
}
```

捕获列表不是固定模板。若 closure 不逃逸或其生命周期严格短于对象，强捕获可以正确；
若任务必须让 owner 存活到完成，弱捕获反而可能破坏合同。

## 5. Copy-on-Write

COW 让值语义类型在未修改时共享底层存储：

```text
复制表面值
→ 暂时共享缓冲区
→ 修改前检查唯一性
→ 非唯一时复制缓冲区
→ 修改自己的存储
```

Swift 标准库的 Array、Dictionary、Set、String 广泛使用类似策略，但具体布局是实现
细节。自定义 COW 常用 class storage 配合唯一引用检查；正确性要求：

- 所有修改入口都在写前确保唯一；
- 不能把内部可变引用泄漏给外部；
- 线程安全不能只靠唯一性检查；
- 对切片、索引和借用的生命周期保持一致。

COW 回答“值复制如何优化”，不回答方法走 direct 还是 witness。

## 6. `inout` 与独占访问

```swift
func increment(_ value: inout Int) {
    value += 1
}

var count = 0
increment(&count)
```

语言模型可理解为 copy-in / copy-out；实现可以在满足同样行为时直接操作原存储。
调用期间需要对该值建立独占修改访问。

下面的模式可能产生重叠访问：

```swift
// modify(&value, using: value)  // 同时修改并读取同一存储
```

Exclusivity 主要保护同一内存位置的访问冲突；它不等于跨线程数据竞争防护。即使每次
局部访问都独占，不受同步保护地从多个并发任务访问共享可变状态仍然错误。

## 7. Borrow、Consume 与复制能力

### 7.1 Borrowing

借用允许被调用方在有限生命周期内使用值，而不取得销毁责任。概念上：

```text
调用者拥有值
→ 临时借给函数
→ 借用结束
→ 调用者继续拥有
```

### 7.2 Consuming

消费把值的所有权交给被调用方；原绑定不能再作为仍拥有该值的入口使用。消费语义可
用于避免不必要复制、明确资源移交或支持 noncopyable value。

### 7.3 Copyable 与 noncopyable

大多数普通 Swift 值允许复制。`~Copyable` 类型可以表达“资源不能隐式复制”的合同，
适合文件描述符、锁保护 token 或唯一资源句柄等模型。

不要把 noncopyable 简化为“只是一种性能优化”。它首先排除会产生双重所有权的非法
程序，然后才可能减少复制。

### 7.4 `sending` 与所有权转移

并发边界上的 `sending` 关注值从一个 isolation domain 移交到另一个域后，原域不能
继续并发访问同一非 Sendable 状态。它与普通函数调用的 consuming 有联系，但服务于
跨隔离域的数据竞争安全。

## 8. 四条派发线路上的所有权

| 派发线路 | receiver / metadata | 主要生命周期问题 |
| --- | --- | --- |
| 直接 | 具体值、已知函数或 `final` class reference | 值复制/借用、mutating exclusivity、函数值捕获、可能的 ARC |
| Class vtable | class reference + 动态类型信息 | receiver 保活、override 中的对象身份、closure / delegate 环 |
| Protocol witness | 值 + type metadata + conformance；或 existential container | generic value 操作、inline/box 表示、打开 existential、witness thunk 适配 |
| Objective-C message | Objective-C object reference + selector | ARC 与 ObjC ownership convention、autorelease/bridging、动态 callback 生命周期 |

这张表不表示直接派发没有 ARC，也不表示 existential 必然 box。

## 9. 一次调用的所有权剖面

```swift
import Foundation

struct Image {}

final class ImageStore {
    func decode(_ data: consuming Data) -> Image {
        // ...
    }
}

func process(store: borrowing ImageStore, data: consuming Data) -> Image {
    store.decode(data)
}
```

概念分析：

1. 静态类型与成员规则先选择 `decode` 声明及派发线路；
2. `store` 在 `process` 中被借用，调用期间对象必须存活；
3. `data` 的所有权进入 `process`；
4. `data` 再被消费进 `decode`，不能继续从原所有入口使用；
5. 返回值的所有权交给调用者；
6. 中间 retain、release、copy 或 move 可以被优化，但必须保持上述合同。

代码能否在某一稳定 Swift 版本中使用具体 ownership spelling，要以项目 language
mode 和工具链为准；分析框架不依赖某次机器码是否真的发生复制。

## 10. Async 与生命周期

异步函数可能把局部状态保存到跨挂起点存在的 task frame 中：

```swift
func load(using client: Client) async throws -> Data {
    let request = makeRequest()
    return try await client.send(request)
}
```

如果 `client`、`request` 或 closure capture 在恢复后仍要使用，它们必须跨挂起点
保持有效。编译器和 Runtime 决定具体存储与 retain 时机，源码层应关注：

- 谁必须活到异步操作完成；
- 取消时谁关闭资源；
- closure / Task 是否反向强持有 owner；
- 跨 actor boundary 的值是否安全传递；
- continuation 是否恰好恢复一次。

`[weak self]` 不是所有 Task 的默认答案。先决定任务是否属于对象生命周期：

- 对象销毁应取消任务：保存句柄，在 `deinit` 或显式 stop 中取消；
- 任务必须完成并让对象存活：强捕获可能是合同的一部分；
- 任务可以独立，owner 只可选参与：弱捕获更合适。

## 11. 销毁与资源清理

`deinit` 是 class 实例生命周期终点的钩子，但不应成为所有资源协议的唯一保障：

- 资源可能需要确定性、可抛错的 `close()`；
- 引用环会推迟或阻止 `deinit`；
- async 清理不能简单依赖普通 `deinit` 完成任意等待；
- 值类型资源可能通过 noncopyable ownership 和作用域 API 表达。

`defer` 适合保证当前作用域每条退出路径都执行同步清理：

```swift
lock.lock()
defer { lock.unlock() }
// 临界区
```

清理结构应覆盖正常返回、`throw`、取消和早退，而不是只覆盖 happy path。

## 12. 常见错误模型

### “值类型完全不需要 ARC”

错误。值可以包含 class 引用、closure 或 COW storage，复制和销毁时可能需要引用计数。

### “ARC 是垃圾回收”

不准确。ARC 基于所有权和引用计数插入/优化生命周期操作，不以追踪式 GC 的周期扫描
作为基本模型；强引用环不会自动被发现并回收。

### “weak 总比 strong 安全”

错误。weak 表达不拥有并允许对象提前消失；如果业务要求任务或关系保持对象存活，
使用 weak 会让操作静默丢失。

### “`inout` 就是 C++ reference”

不准确。应依赖 Swift 的独占访问与 copy-in/copy-out 语义，而不是依赖某次编译直接
传地址的优化。

### “Sendable 表示对象内部用了锁”

错误。`Sendable` 是跨隔离域安全合同；安全可以来自不可变值、内部同步、actor
隔离、所有权转移或编译器可验证结构。

## 13. 线路摘要

```text
值语义 / 引用身份
→ 所有者与借用关系
→ 调用前建立合法访问
→ 按派发路线找到实现
→ 参数、receiver、metadata 跨过边界
→ 正常 / 错误 / 取消路径归还或销毁资源
→ 优化器在合同内消除复制与 ARC 操作
```

进一步复核见 [ARC、Memory Safety 与 ownership 资料](references.md#5-内存生命周期与所有权)。
