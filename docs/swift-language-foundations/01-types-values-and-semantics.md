# 类型、值与语义

本篇是[四条方法派发线路](03-method-dispatch/README.md)的第一层输入：静态类型决定
哪些成员可见、哪些重载可选，以及调用时已知多少 concrete type 信息；动态类型、
conformance 和 Objective-C 可表示性则分别为其他派发线路提供运行时条件。

## 1. 最小心智模型

Swift 程序由“值”和“对值的操作”组成。每个表达式都有类型，类型决定：

- 值可以表示什么；
- 可以执行哪些操作；
- 操作的输入和输出关系；
- 编译器能证明哪些安全条件；
- 需要在运行时保留哪些类型信息。

```swift
let count: Int = 3
let title = "Swift"       // 推断为 String
let pair = (count, title) // 推断为 (Int, String)
```

`count` 是名称，`Int` 是类型，`3` 是值，`let` 建立不可重新赋值的绑定。

## 2. 类型不是标签

类型参与编译期证明，而不只是给数据贴名字：

```swift
func double(_ value: Int) -> Int {
    value * 2
}

double(3)       // 合法
// double("3")  // 编译错误
```

静态类型系统在程序运行前排除一部分非法状态，但不能证明所有业务规则。例如 `Int` 不能表达“必须大于 0”，需要额外类型或运行时检查。

## 3. Named Type 与 Compound Type

### 3.1 Named Type

有名字的类型包括：

- `struct`；
- `class`；
- `enum`；
- `actor`；
- `protocol`；
- 标准库中的 `Int`、`String`、`Array` 等。

### 3.2 Compound Type

Swift 语言直接组合出的无名类型主要包括：

- tuple type：`(Int, String)`；
- function type：`(Int) -> String`。

Optional、Array、Dictionary 等看起来有特殊语法，但对应的是标准库泛型类型：

```swift
Int?            // Optional<Int>
[String]        // Array<String>
[String: Int]   // Dictionary<String, Int>
```

## 4. 类型推断与上下文

Swift 可以从字面量、赋值目标、参数和返回位置推断类型：

```swift
let integer = 1           // Int
let decimal = 1.0         // Double
let explicit: Float = 1.0 // Float
```

类型信息可以从表达式内部向外传播，也可以由外层上下文向内约束：

```swift
func consume(_ value: Float) {}
consume(1.0) // 此处字面量受参数类型约束
```

复杂表达式若导致推断缓慢或错误难读，可以通过：

- 增加局部类型标注；
- 拆分表达式；
- 给闭包参数或返回值标注类型；
- 减少同名重载。

## 5. `let` 与 `var`

`let` 固定绑定，`var` 允许重新赋值：

```swift
let fixed = 1
var changing = 1
changing = 2
```

对引用类型，`let` 固定的是引用绑定，不自动冻结对象内部状态：

```swift
final class Counter {
    var value = 0
}

let counter = Counter()
counter.value += 1 // 合法
// counter = Counter() // 不合法：绑定不可替换
```

这说明“binding 是否可变”和“对象内部状态是否可变”是两个维度。

## 6. Value Type 与 Reference Type

### 6.1 Value Type

`struct` 和 `enum` 是值类型。赋值、传参和返回表达值的复制语义：

```swift
struct Point {
    var x: Int
    var y: Int
}

var a = Point(x: 1, y: 2)
var b = a
b.x = 100

print(a.x) // 1
print(b.x) // 100
```

可观察语义上，修改 `b` 不改变 `a`。

### 6.2 Reference Type

`class` 实例具有身份，多个绑定可以引用同一对象：

```swift
final class Box {
    var value: Int
    init(_ value: Int) { self.value = value }
}

let first = Box(1)
let second = first
second.value = 100

print(first.value)       // 100
print(first === second)  // true
```

### 6.3 语义不等于存储位置

不能简化为：

```text
struct = 栈
class  = 堆
```

编译器可能把值放入栈、堆、寄存器或内联到其他对象中。应该依赖值/引用语义，而不是假设具体存储位置。

## 7. 如何选择 Struct、Enum、Class、Actor

| 类型 | 主要表达 |
| --- | --- |
| Struct | 一组字段组成的值；复制后应保持独立值语义 |
| Enum | 有限状态集合；每个 case 可携带不同关联值 |
| Class | 身份、共享引用、继承或集中生命周期 |
| Actor | 具有身份、且隔离其可变状态的并发实体 |
| Protocol | 一组能力和类型关系的合同，不直接表示存储 |

选择顺序通常是：

1. 先问是否需要稳定对象身份；
2. 再问是否需要共享可变状态；
3. 再问是否需要继承或 Objective-C 互操作；
4. 若共享状态还要跨并发访问，考虑 Actor 或其他隔离；
5. 不从“哪个更快”开始。

## 8. Enum 与代数数据类型

Swift enum 的 case 可以携带不同数据：

```swift
enum LoadState {
    case idle
    case loading(progress: Double)
    case loaded(Data)
    case failed(Error)
}
```

这让“状态”和“该状态允许的数据”绑定在一起。相比多个互相独立的 Optional/Bool，enum 可以减少非法组合：

```text
isLoading = true
data != nil
error != nil
```

上述三者同时成立时语义不清；一个 `LoadState` 同一时刻只能是一个 case。

### Raw Value 与 Associated Value

- raw value：每个 case 对应一个固定字面值；
- associated value：每个具体 enum 值在创建时携带数据。

二者解决的问题不同。

## 9. Optional

Optional 表达“有一个 `Wrapped` 值，或者没有值”：

```swift
enum Optional<Wrapped> {
    case none
    case some(Wrapped)
}
```

常见操作：

```swift
let name: String? = loadName()

if let name {
    print(name)
}

guard let name else {
    return
}

let length = name?.count
let fallback = name ?? "Anonymous"
```

选择：

- `if let`：局部条件分支；
- `guard let`：失败先退出，成功值服务于后续作用域；
- optional chaining：只在值存在时继续；
- `map`：变换内部值，保留“可能没有”；
- `flatMap`：变换本身也返回 Optional 时避免嵌套；
- `!`：只有当外部不变量已可靠保证存在时使用。

Optional 适合表达缺失，不适合承载丰富失败原因，后者见 [07-errors-cancellation-and-resources.md](07-errors-cancellation-and-resources.md)。

## 10. Tuple

Tuple 适合局部、轻量地组合有限值：

```swift
let result: (status: Int, body: String) = (200, "OK")
print(result.status)
```

当组合具有稳定业务含义、需要方法、协议一致性或长期演进时，应定义命名类型：

```swift
struct Response {
    let status: Int
    let body: String
}
```

## 11. Function Type

函数本身也是值：

```swift
func stringify(_ value: Int) -> String {
    String(value)
}

let transform: (Int) -> String = stringify
let output = transform(42)
```

函数类型包含参数类型、`async`、`throws` 和返回类型等语义：

```swift
typealias Loader = (URL) async throws -> Data
```

参数标签不是函数值类型的一部分，但属于函数声明及调用语法的一部分。

## 12. Metatype

类型本身也可以作为值：

```swift
protocol DefaultConstructible {
    init()
}

func make<T: DefaultConstructible>(_ type: T.Type) -> T {
    type.init()
}
```

- `SomeType.Type`：某个具体类型的 metatype；
- `any P.Type`：符合协议的某个运行时类型的 metatype；
- `type(of:)`：获得值的动态类型信息。

Metatype 不等于普通实例。

## 13. `Any`、`AnyObject` 与类型转换

- `Any` 可以容纳任意 Swift 值；
- `AnyObject` 表示任意 class 实例；
- `as`：编译器可证明的转换或桥接；
- `as?`：运行时尝试，失败返回 `nil`；
- `as!`：运行时强制，失败触发错误；
- `is`：运行时检查。

```swift
let value: Any = 42

if let integer = value as? Int {
    print(integer)
}
```

大量使用 `Any` 会丢失静态类型关系。优先考虑 enum、protocol、generic 或具体模型。

## 14. `Void` 与 `Never`

`Void` 是空 tuple `()` 的别名，表示函数正常完成但没有有意义的返回值：

```swift
func log(_ message: String) -> Void {
    print(message)
}
```

`Never` 表示函数不会正常返回：

```swift
func stop(_ message: String) -> Never {
    fatalError(message)
}
```

这让控制流分析知道调用点之后不可达。

## 15. Typealias

`typealias` 给现有类型关系命名，不创建新的独立类型：

```swift
typealias UserID = String

let id: UserID = "42"
let raw: String = id // 合法，它们仍是同一类型
```

若要阻止混用，应定义 wrapper：

```swift
struct UserID: Hashable {
    let rawValue: String
}
```

## 16. 类型关系

需要区分：

- 相同类型；
- class 继承形成的 subtype；
- protocol conformance；
- generic constraint；
- existential 容器；
- bridging conversion。

“符合协议”不等于“继承协议实现”。协议规定 requirement，具体 conformance 提供 witness；详见 [05-protocols-generics-and-polymorphism.md](05-protocols-generics-and-polymorphism.md)。

## 17. Copy-on-Write

Swift 标准集合通常对底层存储使用 Copy-on-Write：

```swift
var first = [1, 2, 3]
var second = first       // 可暂时共享存储
second.append(4)         // 写前确保独立
```

对调用方保持值语义，但复制不保证永远零成本。写入、桥接、共享状态和元素类型都会影响成本。

更完整的生命周期和 COW 机制见 [04-memory-lifetime-and-ownership.md](04-memory-lifetime-and-ownership.md)。

## 18. 本章边界

本章回答“值是什么、类型表达什么”。下面的问题在其他基石展开：

- 调用哪个实现：[四条方法派发线路](03-method-dispatch/README.md)；
- 值怎样被持有和销毁：[04-memory-lifetime-and-ownership.md](04-memory-lifetime-and-ownership.md)；
- 类型怎样抽象：[05-protocols-generics-and-polymorphism.md](05-protocols-generics-and-polymorphism.md)；
- 值怎样跨并发域：[同步、异步与并发](06-sync-async-concurrency/README.md)。

语言规则与版本边界见 [资料、研究方法与版本边界](references.md)。
