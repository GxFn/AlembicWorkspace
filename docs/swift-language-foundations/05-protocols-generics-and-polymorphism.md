# 协议、泛型与多态：从静态约束到 Witness

本篇建立[Protocol witness 派发](03-method-dispatch/03-protocol-witness-dispatch.md)
之前的静态模型。核心不是记 `protocol` 语法，而是理解：

> 一个抽象操作由谁声明、具体类型怎样证明自己满足它、调用处保留了多少类型关系，
> 以及这些信息如何变成运行时可用的 conformance。

## 1. 三种多态先分开

| 多态 | 选择发生在哪里 | Swift 典型形式 |
| --- | --- | --- |
| Ad-hoc | 编译期从同名候选中选声明 | overload |
| Subtype | 运行时按对象动态 class 选 override | class inheritance / vtable |
| Parametric / protocol-constrained | 一份算法对满足约束的类型工作 | generic + protocol conformance |

重载、class override 和 protocol witness 都可能让“同一个名字”表现不同，但不是同一
机制。

## 2. Protocol 是合同，不是残缺的 class

```swift
protocol Serializer {
    associatedtype Input
    func serialize(_ input: Input) throws -> Data
}
```

协议声明：

- 必须提供哪些成员；
- 成员之间有哪些类型关系；
- conforming type 必须满足哪些约束；
- 调用者在只知道协议合同的情况下能安全做什么。

协议本身通常不拥有实例存储，也不表达 superclass 对象布局。一个 `struct`、`enum`、
`class` 或 `actor` 可以在各自允许的边界内声明 conformance。

## 3. Requirement、Witness 与默认实现

### 3.1 Requirement

写在 protocol 主声明中的成员是 requirement：

```swift
protocol Named {
    var name: String { get }
    func describe() -> String
}
```

### 3.2 Witness

具体 conformance 为每个 requirement 提供满足实现。当前编译与 ABI 模型通常用
witness table 描述这种映射：

```text
Named.name requirement     → User.name getter
Named.describe requirement → User.describe
```

### 3.3 默认实现也可以成为 Witness

```swift
extension Named {
    func describe() -> String {
        "name=\(name)"
    }
}

struct User: Named {
    let name: String
}
```

`User` 没有自己声明 `describe()`，extension 的默认实现可以满足 requirement。

### 3.4 Extension-only 成员不是 Requirement

```swift
protocol Tagged {}

extension Tagged {
    func tag() -> String { "default" }
}

struct Item: Tagged {
    func tag() -> String { "item" }
}

let concrete = Item()
let erased: any Tagged = concrete

concrete.tag() // item
erased.tag()   // default
```

`tag()` 没有进入 protocol declaration，因此 conformance 没有为它建立 requirement
witness。对 `any Tagged` 的静态接口调用 extension member 时，选择依据与真正的
requirement 多态不同。

这不是“协议扩展不能动态派发”的万能口诀；准确问题是：

> 这个成员是否是 protocol requirement，调用点的静态类型和约束是什么？

## 4. Generic Parameter：调用者选择具体类型

```swift
func encode<S: Serializer>(
    _ input: S.Input,
    using serializer: S
) throws -> Data {
    try serializer.serialize(input)
}
```

调用者为一次调用提供某个具体 `S`。函数体不知道源码名字，却保留这些关系：

- `serializer` 与 `S` 是同一个具体类型；
- `input` 恰好是 `S.Input`；
- `S` 有一份 `Serializer` conformance；
- `serialize` 可以通过该 conformance 调用。

共享泛型实现通常接收 type metadata 和 witness 信息；优化器在具体 `S` 可见时可能
specialize。二者都满足同一 generic 语义。

```text
generic ≠ 编译期生成所有类型的模板副本
generic ≠ 永远走间接 witness
```

Swift 可以共享代码，也可以特化，选择取决于工具链、可见性和成本模型。

## 5. `some P`：隐藏类型身份，但保留一致性

### 5.1 返回位置

```swift
func makeCollection() -> some Collection<Int> {
    [1, 2, 3]
}
```

实现者选择一个固定但对调用者隐藏的 concrete return type。调用者不能假设它是
`Array<Int>`，但编译器仍跟踪这个 opaque type 的一致身份。

同一 opaque return declaration 的所有返回路径必须满足其底层具体类型一致性的语言
规则；“每次任意返回不同 conformer”是 existential 的能力，不是 opaque type 的
能力。

### 5.2 参数位置

```swift
func count<C: Collection>(_ values: C) -> Int {
    values.count
}

func count(_ values: some Collection) -> Int {
    values.count
}
```

参数位置的 `some Protocol` 表达匿名泛型风格：具体参数类型仍由调用者提供，而不是
在运行时先装进一个可变 existential 容器。

## 6. `any P`：运行时容纳不同 Conformer

```swift
protocol Shape {
    func area() -> Double
}

struct Circle: Shape {
    let radius: Double
    func area() -> Double { .pi * radius * radius }
}

struct Rectangle: Shape {
    let width: Double
    let height: Double
    func area() -> Double { width * height }
}

let shapes: [any Shape] = [
    Circle(radius: 2),
    Rectangle(width: 3, height: 4)
]
```

同一个数组能保存不同 concrete conformer，代价是静态类型身份被 existential 边界
隐藏。运行时需要保留足够信息来：

- 存放或引用实际值；
- 知道实际类型及其大小、复制和销毁操作；
- 找到该类型的 `Shape` conformance；
- 调用 requirement witness。

常见实现会使用 existential container，小值可能 inline，大值可能使用 box；具体
阈值、布局和是否最终分配不是源语言保证。

## 7. Generic、Opaque、Existential 横向比较

| 形式 | 谁选择 concrete type | 是否保持同一类型关系 | 是否可异构存储 | 常见调用模型 |
| --- | --- | --- | --- | --- |
| `T: P` | 调用者 | 是，显式命名为 `T` | 否，一次实例化中 `T` 固定 | metadata + witness；可特化 |
| 参数 `some P` | 调用者 | 是，匿名 generic parameter | 否 | 与 generic 类似 |
| 返回 `some P` | 实现者 | 是，每个声明隐藏一个固定身份 | 否 | opaque identity；可优化 |
| `any P` | 运行时每个值可不同 | concrete identity 被容器擦除 | 是 | existential + conformance；可被打开/去虚化 |

性能不能只从语法排序：

- generic specialization 可能带来更好优化，也可能增加代码体积；
- existential 不一定堆分配；
- 打开的 existential 或可见 concrete value 可能被优化器分析；
- 算法和数据布局通常比一次表间接更重要。

## 8. Associated Type 与 `Self`

### 8.1 Associated Type 表达关系

```swift
protocol Parser {
    associatedtype Input
    associatedtype Output

    func parse(_ input: Input) throws -> Output
}
```

`Input` 和 `Output` 不是两个“任意 any”；它们由每个 conformance 确定，并在所有
requirement 中保持一致关系。

### 8.2 `Self` 绑定 Conformer

```swift
protocol Mergeable {
    func merged(with other: Self) -> Self
}
```

`Self` 要求参数和返回值与当前 conforming type 保持类型身份关系。这类关系适合
generic 或 opaque 上下文；在 existential 上使用哪些成员，要看编译器能否安全打开
existential 并满足位置约束。

### 8.3 Primary Associated Type 与 Constrained Existential

协议可以把重要 associated type 暴露为 primary associated type，从而表达类似：

```swift
func consume(_ source: any AsyncSequence<Int, Never>) async {
    // ...
}
```

具体可用语法和标准协议声明随 Swift 版本演进，但核心目的是：在使用 existential
灵活性的同时，保留调用所需的部分类型等式。

## 9. Where Clause 是证明图

```swift
func compare<C1: Collection, C2: Collection>(
    _ lhs: C1,
    _ rhs: C2
) -> Bool
where C1.Element == C2.Element,
      C1.Element: Equatable {
    lhs.elementsEqual(rhs)
}
```

Where clause 不只是过滤输入，它把类型关系交给编译器：

```text
C1.Element == C2.Element
共同 Element: Equatable
→ 两边元素可安全比较
→ 调用 Equatable requirement 有合法 conformance
```

更强的约束可能让优化器获得 concrete information，但约束首先是 API 语义，不应为了
假想性能随意增加。

## 10. Conditional Conformance

```swift
struct Box<Value> {
    let value: Value
}

extension Box: Equatable where Value: Equatable {
    static func == (lhs: Box, rhs: Box) -> Bool {
        lhs.value == rhs.value
    }
}
```

`Box<Value>` 不是无条件 Equatable。只有存在 `Value: Equatable` 的证据时，才能构造
对应 conformance：

```text
Value 的 Equatable witness
→ 构造 Box<Value> 的 Equatable conformance
→ Box.== 内再调用 Value.==
```

这展示了 conformance 也可以依赖其他 conformance。

## 11. Class Conformance 与继承陷阱

协议 conformance 通常在声明它的类型上形成一份固定映射：

```swift
protocol Describing {
    func describe() -> String
}

extension Describing {
    func describe() -> String { "default" }
}

class Base: Describing {}

class Child: Base {
    func describe() -> String { "child" }
}

let value: any Describing = Child()
value.describe() // 仍可能使用 Base conformance 记录的默认 witness
```

`Child` 继承 `Base` 的 conformance；仅在 subclass 中声明一个同名成员，不会自动重写
已经固定的 witness 映射。若希望 subclass override 参与多态，应让 superclass 本身
提供可 override 的 requirement witness：

```swift
class Base: Describing {
    func describe() -> String { "base" }
}

class Child: Base {
    override func describe() -> String { "child" }
}
```

此时 protocol witness 可以转接到 class 的动态 override 线路。一次源代码调用由
witness 进入后，还可能继续通过 class dispatch 找到 subclass 实现。

## 12. Type Erasure

Existential 是语言提供的类型擦除容器，但有时 API 需要自定义 wrapper：

```swift
struct AnyProducer<Output> {
    private let _next: () -> Output?

    init<P: Producer>(_ producer: P) where P.Output == Output {
        var producer = producer
        _next = { producer.next() }
    }

    mutating func next() -> Output? {
        _next()
    }
}
```

自定义擦除通常把操作保存为 closure 或私有 box。它能：

- 固定公开 API 形状；
- 隐藏 concrete producer；
- 组合不同底层类型。

同时也会带来：

- 捕获与生命周期管理；
- 可能的分配和 ARC；
- 一层函数值间接；
- mutability / Sendable 合同需要手工设计。

标准 `any P` 已满足需求时，不要为了“设计模式”重复造 wrapper。

## 13. Conformance 的作用域与一致性

一个类型对同一协议的 conformance 必须保持全局一致，不能在两个调用点各自选择不同
实现。Retroactive conformance 会影响整个程序的组合：

```swift
extension ExternalType: ExternalProtocol {
    // 当前 module 添加 conformance
}
```

若类型和协议都由外部 module 拥有，未来任一所有者添加同样 conformance 可能冲突。
这类扩展要评估所有权、命名空间和库演进风险。

## 14. 协议不是自动的解耦

引入 protocol 之前问：

1. 是否真的存在多个 conformer 或替换边界？
2. requirement 是否表达稳定能力，而非复制某个 class 的全部方法？
3. associated type / `Self` 关系是否需要保留？
4. 调用者需要 generic、opaque，还是 heterogeneous existential？
5. conformance 由谁拥有，默认实现是否会隐藏行为？
6. 取消、错误、所有权和 actor isolation 是否进入 requirement 合同？

一个只有一个实现、只为测试 mock 而逐方法镜像巨大 service 的 protocol，可能增加
间接层却没有形成清晰抽象。

## 15. 与四条派发路线的连接

```text
具体 struct 成员
→ 通常进入直接线路

可 override class 成员
→ class vtable 线路

T: P / some P / any P 上的 requirement
→ protocol witness 线路

@objc protocol 的 optional requirement
→ Objective-C 可表示性与消息线路
```

类型不是永久绑定一条路线。class conformer 的 requirement witness 可以调用 class
override；`@objc` class 也可以满足纯 Swift protocol；generic specialization 可能
消除 witness 间接。

## 16. 总结

```text
Protocol 声明能力与类型关系
→ Conformance 为 requirement 提供 witness
→ Generic / some / any 决定保留多少 concrete identity
→ 调用点携带类型与 conformance 证据
→ Witness 选择实现
→ 特化或 existential opening 可能消除间接层
```

继续阅读 [Protocol witness 派发完整线路](03-method-dispatch/03-protocol-witness-dispatch.md)。
