# 声明、函数与控制流

本篇是[四条方法派发线路](03-method-dispatch/README.md)的编译期入口：先用作用域、
名称查找、重载和泛型约束确定“调用哪个声明”，再由该声明的多态合同决定运行时
“调用哪个实现”。控制流则描述实现被选中后如何求值。

## 1. 程序的两类基本动作

Swift 源代码主要在做两件事：

1. 声明名称和能力；
2. 执行语句与表达式。

声明建立“程序里有什么”，控制流决定“按什么路径求值”。

## 2. 声明

常见声明：

- `let` / `var`；
- `func`；
- `struct` / `class` / `enum` / `actor`；
- `protocol`；
- `init` / `deinit`；
- `extension`；
- `subscript`；
- `typealias`；
- `operator` / `precedencegroup`；
- `macro`。

Swift 中多数声明同时也是定义：声明函数时通常也给出函数体，声明类型时也给出成员。

## 3. 作用域与名称查找

名称只在其作用域内可见：

```swift
let outer = 1

func example() {
    let inner = 2
    print(outer + inner)
}
```

常见作用域：

- module；
- source file；
- type；
- extension；
- function；
- closure；
- code block。

内层声明可以遮蔽外层同名名称，但过度 shadowing 会降低可读性：

```swift
let value = 1

func work() {
    let value = 2 // 遮蔽外层 value
    print(value)
}
```

## 4. Access Control

Swift 访问级别：

| 级别 | 可见范围 |
| --- | --- |
| `open` | 其他模块可访问，class/成员还允许在其他模块继承或 override |
| `public` | 其他模块可访问，但继承/override 受限制 |
| `package` | 同一 Swift package 内 |
| `internal` | 当前 module，默认 |
| `fileprivate` | 当前 source file |
| `private` | 声明作用域及 Swift 规则允许的相关 extension |

访问控制既是封装工具，也是模块演进合同。公开 API 越多，兼容负担越大。

## 5. 函数声明

```swift
func greet(person name: String, prefix: String = "Hello") -> String {
    "\(prefix), \(name)"
}

greet(person: "Taylor")
```

函数声明可以包含：

- argument label；
- parameter name；
- parameter type；
- default argument；
- variadic parameter；
- generic parameter 和约束；
- `async`；
- `throws`；
- return type；
- ownership modifier；
- attributes。

调用语法是 API 设计的一部分：

```swift
func move(from source: Point, to destination: Point) {}
```

标签应让调用读起来接近一句清晰的描述。

## 6. 参数传递

普通参数在函数体内默认是不可重新赋值的绑定：

```swift
func increment(_ value: Int) -> Int {
    value + 1
}
```

### `inout`

`inout` 表达函数对调用方存储的一段读写访问：

```swift
func increment(_ value: inout Int) {
    value += 1
}

var count = 0
increment(&count)
```

不要把它简化为“永远直接传地址”。语言语义关注：

- 调用期间对该存储的独占访问；
- 函数结束时修改对调用方可见；
- 编译器可以选择 copy-in/copy-out 或直接访问等合法实现。

更深入见 [04-memory-lifetime-and-ownership.md](04-memory-lifetime-and-ownership.md)。

## 7. 函数是一等值

函数可以：

- 赋给变量；
- 作为参数；
- 作为返回值；
- 存入集合；
- 被闭包捕获。

```swift
func apply(
    _ value: Int,
    using transform: (Int) -> Int
) -> Int {
    transform(value)
}

let result = apply(3) { $0 * 2 }
```

高阶函数只是“函数操作函数”，不是特殊运行时魔法。

## 8. Closure

闭包是可以捕获上下文的函数值：

```swift
func makeCounter() -> () -> Int {
    var count = 0

    return {
        count += 1
        return count
    }
}
```

返回闭包必须让捕获的 `count` 在外层函数结束后继续存在，因此编译器会为捕获上下文选择合适存储。

### Capture List

```swift
let snapshot = 10

let closure = { [snapshot] in
    print(snapshot)
}
```

Capture list 可以：

- 显式按当前值捕获；
- 使用 `weak` / `unowned` 表达 class 引用生命周期；
- 给捕获值重命名。

### Escaping

如果闭包在函数返回后仍可能被调用，它是 escaping：

```swift
var callbacks: [() -> Void] = []

func register(_ callback: @escaping () -> Void) {
    callbacks.append(callback)
}
```

escaping 会影响捕获、生命周期和允许的优化。

### Autoclosure

`@autoclosure` 把调用点的表达式自动包装成无参闭包，常用于延迟求值：

```swift
func evaluate(_ condition: @autoclosure () -> Bool) -> Bool {
    condition()
}
```

它会隐藏函数调用形式，应只用于语义非常清楚的 API。

## 9. Overload

Swift 允许同名函数由不同签名区分：

```swift
func render(_ value: Int) -> String { "\(value)" }
func render(_ value: Double) -> String { "\(value)" }
```

编译器利用：

- 参数数量；
- argument label；
- 参数类型；
- generic constraint；
- 返回上下文；
- 可用性和可见性；

在编译期完成重载解析。

重载解析回答“选择哪个声明”，不回答 override、protocol witness 或 Objective-C message 最终使用哪个实现。后者见 [四条方法派发线路](03-method-dispatch/README.md)。

## 10. Control Flow

### 10.1 `if`

```swift
if score >= 60 {
    print("pass")
} else {
    print("retry")
}
```

`if` 也可以在允许的上下文中产生值：

```swift
let label = if score >= 60 { "pass" } else { "retry" }
```

### 10.2 `switch`

Swift `switch` 必须穷尽所有可能：

```swift
enum Direction {
    case north, south, east, west
}

func axis(of direction: Direction) -> String {
    switch direction {
    case .north, .south:
        "vertical"
    case .east, .west:
        "horizontal"
    }
}
```

穷尽性让新增 enum case 时更容易暴露未处理路径。

### 10.3 Loop

- `for-in`：遍历 Sequence；
- `while`：条件为真时循环；
- `repeat-while`：至少执行一次；
- `break` / `continue`；
- labeled statement：控制嵌套结构。

```swift
for element in values where element.isValid {
    consume(element)
}
```

## 11. Pattern Matching

Pattern 把值的结构与名称绑定或检查条件：

```swift
let pair = (status: 200, body: "OK")

switch pair {
case (200, let body):
    print(body)
case (400..<500, _):
    print("client error")
default:
    print("other")
}
```

常见 pattern：

- wildcard `_`；
- identifier；
- value-binding；
- tuple；
- enum case；
- optional；
- type-casting；
- expression；
- `where` 条件。

`if case` 和 `for case` 可在不需要完整 switch 时使用：

```swift
if case .success(let value) = result {
    print(value)
}
```

## 12. Guard 与提前退出

`guard` 要求条件为真才能继续当前作用域：

```swift
func process(_ input: String?) {
    guard let input, !input.isEmpty else {
        return
    }

    print(input)
}
```

它适合把失败路径前置，但不应把复杂业务判断全部堆成一串难读的 guard。

## 13. Property

### Stored Property

```swift
struct User {
    let id: Int
    var name: String
}
```

### Computed Property

```swift
struct Rectangle {
    var width: Double
    var height: Double

    var area: Double {
        width * height
    }
}
```

### Property Observer

```swift
var progress: Double = 0 {
    willSet { print("will become", newValue) }
    didSet { print("was", oldValue) }
}
```

Observer 是赋值语义的一部分，不等于通用事件系统。

### Type Property

```swift
struct Configuration {
    static let defaultTimeout = 10
}
```

`static` 成员属于类型，不属于某个实例。

## 14. Initialization

初始化的目标是保证实例在首次使用前完整：

```swift
struct Account {
    let id: Int
    var balance: Decimal

    init(id: Int, balance: Decimal = 0) {
        self.id = id
        self.balance = balance
    }
}
```

概念：

- designated / convenience initializer（class）；
- memberwise initializer（struct 的自动能力有其可见性规则）；
- failable initializer `init?`；
- required initializer；
- two-phase initialization（class）；
- definite initialization；
- delegation；
- `deinit`（class/actor 生命周期结束）。

初始化规则首先保证安全，再服务于 API 便利。

## 15. Method、Type Method 与 Mutation

```swift
struct Counter {
    private(set) var value = 0

    mutating func increment() {
        value += 1
    }

    static func zero() -> Counter {
        Counter()
    }
}
```

值类型方法默认不能修改 `self`；`mutating` 表达方法可能用新值替换整个 `self`。

Class 方法：

- `static func`：不能被 subclass override；
- `class func`：允许 subclass override，除非 `final`。

这会直接影响方法派发。

## 16. Extension

Extension 可以为现有类型增加：

- computed property；
- method；
- initializer；
- subscript；
- nested type；
- protocol conformance。

```swift
extension Int {
    var isEven: Bool { self % 2 == 0 }
}
```

Extension 不应被理解为 subclass，也不能随意增加已有实例的存储布局。

Protocol extension 的派发边界见 [四条方法派发线路](03-method-dispatch/README.md)。

## 17. Subscript

Subscript 为索引式访问建立类型安全 API：

```swift
struct Matrix {
    let rows: Int
    let columns: Int
    private var values: [Double]

    subscript(row: Int, column: Int) -> Double {
        get { values[row * columns + column] }
        set { values[row * columns + column] = newValue }
    }
}
```

Subscript 也可以：

- 重载；
- 使用泛型；
- 抛错能力需按语言支持和 API 形态设计；
- 定义 static subscript。

## 18. Operator

Operator 是特殊名字的函数：

```swift
struct Vector {
    let x: Double
    let y: Double

    static func + (lhs: Vector, rhs: Vector) -> Vector {
        Vector(x: lhs.x + rhs.x, y: lhs.y + rhs.y)
    }
}
```

自定义 operator 应满足读者可预测的代数或领域语义。不要用符号隐藏副作用、I/O 或高成本操作。

## 19. Key Path

Swift key path 是类型化的属性路径值：

```swift
struct Person {
    var name: String
}

let path: WritableKeyPath<Person, String> = \.name
var person = Person(name: "A")
person[keyPath: path] = "B"
```

需要区分：

- Swift `KeyPath` 家族；
- Objective-C 的字符串 KVC key path；
- `#keyPath` 生成的 Objective-C 字符串表达。

## 20. 本章边界

本章建立声明和求值骨架。下一层：

- 同名声明如何解析、override 如何选择实现：[四条方法派发线路](03-method-dispatch/README.md)；
- 闭包捕获的生命周期：[04-memory-lifetime-and-ownership.md](04-memory-lifetime-and-ownership.md)；
- async function 和 Task：[同步、异步与并发](06-sync-async-concurrency/README.md)；
- `throws` / `defer`：[07-errors-cancellation-and-resources.md](07-errors-cancellation-and-resources.md)。

语言规则与版本边界见 [资料、研究方法与版本边界](references.md)。
