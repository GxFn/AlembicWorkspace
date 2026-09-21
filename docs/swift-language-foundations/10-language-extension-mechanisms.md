# 属性包装、Result Builder、Macro 与动态语法

Swift 提供多种“看起来像扩展语言”的机制，但它们最终仍要回到普通类型、声明、访问器
和调用：

```text
特殊源码表面
→ 编译期展开 / 重写 / 名称查找
→ 生成或选择普通 Swift 声明
→ 类型检查
→ 四条方法派发之一
→ 所有权、错误与并发语义
```

它们不是绕过 Swift 类型系统的逃生门，也不构成第五种方法派发。

## 1. Extension：在类型之外增加声明

```swift
extension String {
    var isBlank: Bool {
        allSatisfy(\.isWhitespace)
    }
}
```

Extension 可以增加：

- computed instance / type property；
- method；
- initializer；
- subscript；
- nested type；
- protocol conformance。

它不能给已有实例任意增加 stored property，也不能在 extension 中 override class
已有声明。调用新增成员时，仍根据具体类型、class、protocol requirement 或 `@objc`
边界决定派发。

### 1.1 Protocol Extension 的双重角色

- 为 requirement 提供默认 witness；
- 增加 extension-only member。

二者派发语义不同，详见
[Protocol witness 派发](03-method-dispatch/03-protocol-witness-dispatch.md)。

## 2. Property Wrapper：把属性合同拆成类型

```swift
@propertyWrapper
struct Clamped<Value: Comparable> {
    private var value: Value
    let range: ClosedRange<Value>

    init(wrappedValue: Value, _ range: ClosedRange<Value>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }

    var wrappedValue: Value {
        get { value }
        set {
            value = min(max(newValue, range.lowerBound), range.upperBound)
        }
    }
}

struct Settings {
    @Clamped(0...100) var volume = 50
}
```

概念展开：

```text
volume 的公开访问
→ 编译器合成 wrapper storage
→ getter/setter 转到 wrapper.wrappedValue
→ wrappedValue accessor 执行约束
```

具体合成名字属于语言约定和编译实现；阅读时可把它还原为：

```swift
private var _volume = Clamped(wrappedValue: 50, 0...100)

var volume: Int {
    get { _volume.wrappedValue }
    set { _volume.wrappedValue = newValue }
}
```

### 2.1 `projectedValue`

Wrapper 可以提供 `$property` 投影视图：

```swift
var projectedValue: SomeProjection { ... }
```

它可以暴露 binding、validation state 或控制接口，但不应泄漏能够绕开 wrapped
invariant 的任意可变存储。

### 2.2 Wrapper 与派发

一次 `settings.volume` 可能包含：

1. Settings 的 property accessor；
2. wrapper storage 访问；
3. `Clamped.wrappedValue` accessor；
4. generic Comparable requirement；
5. 可选的 observer / actor isolation。

每层都按普通成员规则分析。Wrapper 本身不保证 inline，也不自动线程安全。

### 2.3 Wrapper 不是观察系统

Property wrapper 能控制该属性的访问；它不自动知道对象图中所有间接 mutation，也不
自动提供 KVO、事务、持久化或跨 actor 同步。若 wrapper 保存 class reference，外部
仍可能绕过 setter 修改引用对象。

## 3. Result Builder：把语句序列翻译为构建调用

```swift
@resultBuilder
enum ListBuilder {
    static func buildBlock(_ components: [String]...) -> [String] {
        components.flatMap { $0 }
    }

    static func buildExpression(_ expression: String) -> [String] {
        [expression]
    }

    static func buildOptional(_ component: [String]?) -> [String] {
        component ?? []
    }
}
```

Builder closure 的源码：

```swift
@ListBuilder
func rows(showFooter: Bool) -> [String] {
    "header"
    "body"
    if showFooter {
        "footer"
    }
}
```

编译器概念上转换为 `buildExpression`、`buildOptional`、`buildBlock` 等静态调用。

### 3.1 Builder 不等于 Runtime Interpreter

Builder transformation 发生在编译期。生成结果可以是：

- 立即构造值；
- 一棵声明式树；
- closure；
- incremental component。

是否运行时解释、diff 或 layout，由具体库设计决定，不是 result builder 语言机制
自动提供。

### 3.2 控制流支持来自 Builder Entry

`if`、`switch`、loop、availability 等语法需要 builder 提供相应构建入口。编译错误
往往不是“Swift 不支持 if”，而是该 builder 的类型关系无法表示某个分支。

调试时把 DSL 手动还原成 build calls，检查：

- 每个 expression 的转换类型；
- 分支的共同 component；
- overload 是否产生模糊；
- generic inference 在哪一步丢失。

## 4. Macro：编译期语法变换

Macro 接收源码语法并生成额外 Swift 代码：

- freestanding expression / declaration macro；
- attached peer、member、accessor、member-attribute、conformance 等角色。

概念管线：

```text
Macro invocation / attribute
→ SwiftSyntax 表示的输入
→ Macro implementation 产生语法
→ 展开结果进行语法与类型检查
→ 作为普通声明继续编译
```

Macro 展开不是任意 Runtime reflection，也不是不受检查的文本替换。

### 4.1 Macro 能看到什么

Macro 通常看到传入的语法、声明节点和受角色限定的上下文，不应假设它拥有整个程序的
完整类型检查数据库。需要 semantic information 的规则，应由 compiler diagnostics、
protocol conformance 或生成后的类型检查完成。

### 4.2 Attached Macro 与派发

一个 member macro 可以生成：

```swift
func save() {}
```

之后 `save()` 是否直接、vtable、witness 或 Objective-C message，取决于生成声明所在
类型、modifier、conformance 和调用点，而不是“由 macro 生成”。

### 4.3 Macro API 设计

好的 macro：

- 生成物可预测；
- diagnostics 指向用户源码；
- 命名冲突策略清楚；
- 展开可检查；
- 不隐藏关键副作用或隔离；
- 有普通 Swift 等价模型；
- compiler / swift-syntax 版本兼容边界明确。

宏减少重复，不应把复杂业务状态机藏到难以阅读的生成代码里。

## 5. `@dynamicMemberLookup`

```swift
@dynamicMemberLookup
struct Environment {
    private var values: [String: String]

    init(values: [String: String]) {
        self.values = values
    }

    subscript(dynamicMember name: String) -> String? {
        values[name]
    }
}

let environment = Environment(values: ["region": "cn"])
let region = environment.region
```

找不到普通成员时，编译器把 `.region` 转为 dynamic-member subscript 调用。这里仍有：

- 静态检查 wrapper 是否有合法 subscript；
- 运行时字符串 key；
- 返回值类型；
- 普通 subscript 派发。

Key-path 版本能保留更多类型信息：

```swift
subscript<T>(dynamicMember keyPath: KeyPath<Model, T>) -> T
```

“dynamic”在这里描述成员名字的语法映射，不等于 Objective-C `dynamic` modifier，也
不自动使用 `objc_msgSend`。

## 6. `@dynamicCallable`

```swift
@dynamicCallable
struct Command {
    func dynamicallyCall(
        withKeywordArguments arguments: KeyValuePairs<String, String>
    ) {
        // ...
    }
}
```

调用表面被重写到指定 `dynamicallyCall` 方法。它适合桥接动态语言或命令 DSL，但会
牺牲参数标签和类型的显式合同。

若参数形状稳定，优先使用普通 `callAsFunction`：

```swift
struct Multiplier {
    let factor: Int

    func callAsFunction(_ value: Int) -> Int {
        value * factor
    }
}
```

`callAsFunction` 是普通、完整类型检查的方法，只获得函数调用语法糖。

## 7. KeyPath：把属性访问变成值

```swift
let keyPath: KeyPath<User, String> = \.name
let name = user[keyPath: keyPath]
```

Key path 保存从 Root 到 Value 的类型化访问路径。不同种类表达：

- 只读；
- writable；
- reference-writable；
- type-erased partial / any key path。

KeyPath 可用于排序、binding、diff、dynamic member 和框架元数据，但：

- 不是任意函数；
- 不能自动表达带参数的 method；
- 类型擦除会丢失 Root / Value 关系；
- 是否与 Objective-C KVC 兼容要看 key path 形状和 `@objc` 可见性。

Swift KeyPath 与字符串 KVC key path 是相邻但不同的系统。

## 8. Custom Operator

Operator 声明定义名字和优先级，具体实现仍是函数：

```swift
infix operator <+>: AdditionPrecedence

func <+>(lhs: Vector, rhs: Vector) -> Vector {
    // ...
}
```

类型检查先做 overload resolution，之后函数调用通常进入直接或 generic/witness
线路。Operator 不获得额外 Runtime 魔法。

自定义 operator 只适合具有广泛、稳定代数直觉的操作；隐藏 I/O、异步、抛错或重大
副作用会使控制流难以发现。

## 9. Property Observer 与 Accessor

`willSet` / `didSet` 属于 property mutation 语义，不是通用事件总线：

- 初始化期间有特殊调用规则；
- `inout` 修改可能通过访问器在作用域结束时写回；
- 引用对象内部改变不等于重新设置外层 property；
- override property observer 仍受 class dispatch；
- actor-isolated property 仍受 isolation；
- KVO 还要求 Objective-C dynamic contract。

分析时把 property 展开为 getter、setter、modify access 和 observer 步骤，再确定对应
派发及所有权。

## 10. 组合机制时的完整例子

```swift
@Observable
@MainActor
final class SearchModel {
    @Clamped(1...100) var pageSize = 20

    func search() async throws -> [ResultItem] {
        // ...
    }
}
```

假设 `@Observable` 是生成 observation 相关成员的 macro，这段代码至少叠加：

1. Macro 展开生成声明；
2. property wrapper 生成 pageSize storage / access；
3. `final` 关闭 class override；
4. MainActor 规定 isolation；
5. `search` 是 async throwing function；
6. 生成或手写成员仍进入四条派发中的一条；
7. 观察系统对 mutation 的跟踪是库 / 生成代码合同。

不能用“这是 macro”概括它的运行行为。

## 11. 调试方法

### 11.1 还原语法糖

```text
@Wrapper property → storage + wrappedValue accessors
builder closure → buildExpression / buildBlock / buildEither
macro → expanded declarations
dynamic member → subscript(dynamicMember:)
call syntax → callAsFunction / dynamicallyCall
operator → overloaded function
```

### 11.2 查看展开

使用 Xcode 的 expanded macro / generated interface 能力，或匹配工具链的 compiler
diagnostic / dump 选项。具体命令属于工具链接口，先用 `swiftc -help` 核对，避免把
实验 flag 固化到文档和脚本。

### 11.3 再回到四条派发

对展开后的每个调用问：

```text
静态类型是什么？
→ 选中了哪个声明？
→ 是否是 override point / requirement / @objc dynamic？
→ receiver 与参数怎样传递？
→ 是否可能挂起或跨 isolation？
```

## 12. 常见误区

### “Property wrapper 自动让属性线程安全”

错误。Wrapper 只提供生成访问路径；同步和 isolation 需要单独设计。

### “Result builder 是一棵 UI 树”

错误。Builder 只定义源码变换；输出由库决定。

### “Macro 可以任意读取整个程序语义”

错误。Macro 主要处理语法并受角色 / 上下文限制，生成结果还要类型检查。

### “dynamicMemberLookup 等于 Objective-C 动态派发”

错误。它是编译期成员语法重写，底层 subscript 仍按普通规则派发。

### “KeyPath 就是字符串”

错误。Swift KeyPath 保留 Root / Value 类型关系；KVC 字符串是另一种 Runtime 合同。

### “语法糖没有成本”

不准确。它可以被 inline，也可能生成存储、closure、box、观察或间接访问；需要看
展开与优化。

## 13. 总结

```text
Extension 增加普通声明
Property wrapper 生成存储和访问器
Result builder 把语句变成构建调用
Macro 在编译期生成受检查语法
Dynamic member/callable 重写成员或调用表面
KeyPath 把类型化访问路径变成值
Operator 映射为函数声明
→ 最终全部回到类型系统、四种派发、所有权和并发
```
