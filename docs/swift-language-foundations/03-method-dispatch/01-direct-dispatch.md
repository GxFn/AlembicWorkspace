# 直接/静态派发线路

## 1. 线路定义

直接派发描述：

> 在当前语义和编译边界下，调用目标已经确定，不需要根据 receiver 的动态类型、protocol conformance 或 Objective-C selector 再选择实现。

概念线路：

```text
名称查找
→ 重载解析
→ 泛型和类型约束满足
→ 得到唯一、非虚目标
→ 生成对该目标的调用
→ 可能继续 inline
```

“直接派发”是语义目标已知的线路模型，不保证最终机器码一定保留一条普通 `call` 指令；函数可能被内联，也可能因 module resilience 通过 thunk 或其他符号边界调用。

### 1.1 这条线路挂载的知识

```text
静态类型与作用域
→ 名称查找、重载、泛型约束
→ 值类型 / final / 不可替换声明
→ 参数与 self 的所有权约定
→ 已知函数入口
→ 同步执行或进入 async 状态机
→ inline / specialization / 常量传播
```

其中只有“目标没有可观察的运行时替换点”定义了直接线路。值语义、所有权、异步和
inline 都会影响调用怎样实现，但它们不是直接派发的同义词。

### 1.2 三个事实层级

- **语言语义**：当前调用不需要根据 subclass override、protocol conformance 或
  Objective-C selector 再选择成员实现。
- **常见实现**：SIL 中可以出现已知的 `function_ref`，随后形成直接调用。
- **优化结果**：函数可能被 inline，调用边界甚至完全消失。

不要从第三层倒推第一层。看见机器码没有 `call`，只说明这次编译消除了调用，不说明
Swift 源语言多出了一种派发规则。

## 2. 常见来源

### 2.1 自由函数

```swift
func square(_ value: Int) -> Int {
    value * value
}

let result = square(4)
```

完成重载解析后，没有 receiver 动态类型需要参与。

### 2.2 Struct / Enum 成员

值类型不支持 class inheritance override：

```swift
struct Meter {
    var value: Double

    func convertedToCentimeters() -> Double {
        value * 100
    }
}
```

如果调用通过具体静态类型发生，目标方法已知。

### 2.3 `static` 成员

```swift
class Factory {
    static func make() -> Factory {
        Factory()
    }
}
```

`static` class member 不能被 subclass override。

### 2.4 `final`

```swift
class Service {
    final func identifier() -> String {
        "service"
    }
}
```

`final` 明确排除 override，因此编译器无需保留“由 subclass 替换实现”的语义。

`final class` 中的可见成员也没有 subclass override 的可能。

### 2.5 `private` 与不可见 override 边界

封装可能给编译器更多证明空间，但不要写成：

```text
private = 永远直接派发
```

真正决定因素是语言是否允许目标被替换、module/resilience 边界以及优化器能证明什么。

## 3. 直接调用前仍有编译期选择

### 3.1 重载不是派发

```swift
func describe(_ value: Int) -> String { "int" }
func describe(_ value: String) -> String { "string" }

describe(1)
```

先在编译期选择 `Int` 重载，之后才谈如何调用已选声明。

### 3.2 Generic 本身不等于直接派发

```swift
func duplicate<T>(_ value: T) -> (T, T) {
    (value, value)
}
```

函数体不调用 protocol requirement，生成方式可能是：

- 一份共享泛型实现；
- 对具体 `T` 的特化实现；
- 被完全 inline。

“generic specialization”是优化选择，不是另一种源语言派发语义。

### 3.3 Generic requirement 可能进入 Witness 线路

```swift
protocol Printable {
    func printValue()
}

func emit<T: Printable>(_ value: T) {
    value.printValue()
}
```

`emit` 是泛型函数，但函数体内 `printValue()` 是 protocol requirement。未特化时可通过 witness 选择；特化后编译器可能知道具体实现并去虚化。

## 4. Extension 成员

具体类型 extension 增加的非 override 成员通常具有已知静态目标：

```swift
struct Point {
    let x: Int
    let y: Int
}

extension Point {
    func magnitudeSquared() -> Int {
        x * x + y * y
    }
}
```

Protocol extension-only 成员也常表现为静态选择，但它有独特陷阱：

```swift
protocol Named {}

extension Named {
    func name() -> String { "default" }
}

struct User: Named {
    func name() -> String { "user" }
}

let concrete = User()
let erased: any Named = concrete

print(concrete.name()) // user
print(erased.name())   // default
```

原因不是“protocol 不支持动态派发”，而是 `name()` 没有声明为 protocol requirement。对静态类型 `any Named`，可见的是 extension 提供的成员。

把它加入 requirement：

```swift
protocol Named {
    func name() -> String
}
```

就进入 Witness 派发语义。

## 5. Property 与 Subscript

派发不只属于 `func`。Computed property 的 getter/setter 和 subscript accessor 本质上也是可调用实现：

```swift
struct Buffer {
    private var storage: [Int]

    subscript(index: Int) -> Int {
        storage[index]
    }
}
```

当 accessor 目标在具体值类型上已知时，也属于直接目标线路。

## 6. 附着知识：值、所有权、闭包与异步

### 6.1 值类型并不等于“栈上直接调用”

`struct` 和 `enum` 的关键是值语义及不参与 class override，不是固定存储位置。
一个值可能：

- 以内联字段形式存在；
- 被捕获到 escaping closure 的上下文；
- 位于 Array 的堆存储中；
- 被装入 existential container，必要时使用额外 box；
- 因优化完全不对应一个稳定内存地址。

存储位置和方法目标是两个维度。即使 receiver 存在堆内存中，对一个已知值类型成员的
选择仍可属于直接线路。

### 6.2 `mutating` 解决修改权限，不引入虚派发

```swift
struct Counter {
    private(set) var value = 0

    mutating func increment() {
        value += 1
    }
}
```

`mutating` 允许方法替换 `self` 或修改其存储，并要求调用点拥有可变、独占的访问。
它改变访问与所有权约束，但没有因为“会修改”就改走 vtable。

分析这次调用应分成：

```text
编译期确定 Counter.increment
→ 建立对 counter 的独占修改访问
→ 把可修改的 self 交给实现
→ 执行
→ 结束独占访问
```

### 6.3 值复制、COW 与派发要分开

Swift 的赋值和参数传递遵守值语义时，程序应像获得独立值一样观察结果。标准库中的
`Array`、`Dictionary`、`String` 常用 copy-on-write 延迟实际缓冲区复制，但 COW 是
存储优化，不是方法派发机制。

一次 `array.append(x)` 可以同时包含：

1. 在静态上下文中选中具体成员；
2. 建立 `inout self` 的独占访问；
3. 检查缓冲区是否唯一引用；
4. 必要时复制存储；
5. 修改元素计数。

“调用目标已知”不能推导出“没有分配、复制或引用计数”。

### 6.4 参数所有权与调用目标是两个问题

Swift 可以用默认约定以及 `borrowing`、`consuming`、`inout` 等形式表达值如何跨过
调用边界。概念上：

- borrowing：在调用期间借用，调用者继续拥有值；
- consuming：把所有权交给被调用方；
- `inout`：在一次独占访问期间允许写回；
- 普通值参数：按语言的值语义理解，具体复制可被优化。

这些约定决定“数据如何进入已知实现”，不决定“选择哪个实现”。反过来，直接派发也
不保证无需 retain/release、copy、destroy 或 exclusivity check。

### 6.5 函数值会增加一层间接，但不是第五种成员派发

```swift
func twice(_ value: Int) -> Int { value * 2 }

let transform: (Int) -> Int = twice
let result = transform(21)
```

声明 `twice` 的身份已知；但 `transform` 是一个函数值，调用它时通常要通过函数值
携带的入口和上下文。优化器知道赋值来源时，仍可能把它还原为直接调用或 inline。

类似地：

```swift
struct Formatter {
    let prefix: String

    func format(_ value: Int) -> String {
        "\(prefix)\(value)"
    }
}

let formatter = Formatter(prefix: "#")
let format = formatter.format
```

成员引用形成的函数值需要保留调用所需的 receiver。这里要同时分析：

- 原成员属于哪条派发路线；
- receiver 是按值捕获还是保留引用；
- closure 是否 escaping；
- 最终函数值调用能否被优化器看穿。

“通过函数变量调用”是函数表示层的间接，不应和 class/witness/Objective-C 三种
运行时多态混成同一分类。

### 6.6 Operator、`callAsFunction` 和语法糖

```swift
struct Multiplier {
    let factor: Int

    func callAsFunction(_ value: Int) -> Int {
        factor * value
    }
}

let double = Multiplier(factor: 2)
let answer = double(21)
```

类型检查会把 `double(21)` 映射到 `callAsFunction(_:)` 声明。因为 receiver 是具体
值类型且成员不具有运行时替换点，这次成员实现选择属于直接线路。

Operator 和 subscript 也同理：先把语法映射到声明，再判断声明采用哪条路线。语法
长得像函数、运算符或数组访问，都不是派发结论。

### 6.7 `async` 不改变“选哪个实现”

```swift
struct FileLoader {
    func load() async throws -> Data {
        // ...
    }
}
```

对具体 `FileLoader` 调用 `load()`，成员实现可以是直接目标；进入实现以后，编译器
生成的异步状态机才负责挂起、保存 continuation 状态和恢复。

```text
直接确定 FileLoader.load
→ 建立 async 调用上下文
→ 执行到潜在挂起点
→ 让出执行资源
→ 恢复后继续同一逻辑任务
```

因此：

```text
直接派发 ≠ 同步
async ≠ 动态派发
```

四条派发路线中的任何一条都可以通向一个 `async` 实现，只要对应声明允许这种函数
类型。并发语义详见 [同步、异步与并发](../06-sync-async-concurrency/README.md)。

## 7. 优化器可以做什么

目标已知后，编译器可能：

- inline 函数体；
- 常量折叠；
- 删除无用分支；
- 展开泛型；
- 消除临时对象；
- 合并 ARC 操作。

### Inline 不是无条件收益

可能收益：

- 消除调用开销；
- 暴露更多优化机会。

可能成本：

- 增加代码体积；
- 指令 cache 压力；
- 构建时间；
- 把实现暴露到跨 module 优化合同。

## 8. 跨 Module 边界

调用公开函数时，客户端未必拥有函数体。编译器可能只能调用一个外部符号。

`@inlinable` 可以把实现暴露给客户端编译器，但也扩大兼容合同；它不是“让函数更快”的普通开关。

因此：

```text
语义目标唯一
≠
函数体一定在调用点可见
≠
一定被 inline
```

## 9. 与其他线路比较

| 问题 | 直接派发 | Class vtable | Protocol witness | ObjC message |
| --- | --- | --- | --- | --- |
| 运行时是否需按 receiver class 选实现 | 否 | 是 | 不直接按 class；按 conformance | 是 |
| 是否依赖 protocol requirement | 否 | 否 | 是 | 可选 |
| 是否天然支持 swizzling/KVO | 否 | 否 | 否 | 是 |
| 优化器目标可见度 | 通常最高 | 可去虚化 | 可特化后去虚化 | `dynamic` 明确限制 |

## 10. 从源码到执行：完整例子

```swift
import Foundation

protocol EncodingStrategy {
    associatedtype Input
    func encode(_ input: Input) -> Data
}

struct IntegerEncoder: EncodingStrategy {
    func encode(_ input: Int) -> Data {
        Data(String(input).utf8)
    }
}

struct RequestBuilder<Encoder: EncodingStrategy>
where Encoder.Input == Int {
    let encoder: Encoder

    func build(id: Int) -> Data {
        encoder.encode(id)
    }
}

let builder = RequestBuilder(encoder: IntegerEncoder())
let body = builder.build(id: 42)
```

这段代码故意同时出现具体值类型和 protocol constraint。逐层分析：

1. `builder.build(id:)` 的 receiver 是具体 `RequestBuilder<IntegerEncoder>`，
   `build` 不是 requirement，也不存在 override，属于直接目标。
2. `build` 内部的 `encoder.encode(id)` 在泛型定义中由
   `EncodingStrategy` requirement 提供语义，概念上属于 witness 线路。
3. 当 `Encoder == IntegerEncoder` 对优化器可见时，泛型特化可能把 witness 调用解析
   为 `IntegerEncoder.encode`。
4. 随后 `build` 和 `encode` 都可能 inline，最终机器码中不再保留两次源码级调用。
5. 这一优化结果不改变第 2 步：泛型源代码仍依赖 conformance 合同，而不是偶然认识
   `IntegerEncoder`。

这个例子说明“一个函数是直接派发”不能粗暴扩展成“函数体里的所有调用都直接派发”。
必须逐个调用表达式分析。

## 11. 错误心智模型

### “Struct 方法永远没有调用成本”

错误。方法体仍需执行，未 inline 时仍有调用；值复制和泛型可能产生其他成本。

### “Direct dispatch 永远最快”

错误。系统性能还受算法、内存、I/O、代码体积和分支预测影响。

### “Generic 一定直接派发”

错误。对 protocol requirement 的操作需要 conformance 语义；特化只是可能的优化。

### “Extension 方法都是静态派发”

不够准确。要先区分：

- 扩展具体类型；
- 扩展 protocol；
- 成员是否为 protocol requirement；
- class/Objective-C 动态边界；
- 当前 Swift 语言规则和 module 环境。

## 12. 线路摘要

```text
静态类型与约束完成名称/重载选择
→ 已选声明没有可观察的运行时替换点
→ 按所有权规则准备 receiver 和参数
→ 调用已知目标或形成函数值入口
→ 进入同步函数体或 async 状态机
→ 在 module / resilience 允许的范围内继续优化
```

下一条线路：[Class 虚表派发](02-class-vtable-dispatch.md)。

## 13. 一级资料

- [Swift Methods](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/methods/)
- [Swift Declarations](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/declarations/)
- [Swift Extensions](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/extensions/)
- [Swift Memory Safety](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/memorysafety/)
- [Whole-Module Optimization](https://www.swift.org/blog/whole-module-optimizations/)
- [Library Evolution in Swift](https://www.swift.org/blog/library-evolution/)
- [Compiling Swift Generics](https://download.swift.org/docs/assets/generics.pdf)

资料用于确认语义和实现边界；本文按直接派发的执行线路重新组织，并非上述页面的章节
转述。
