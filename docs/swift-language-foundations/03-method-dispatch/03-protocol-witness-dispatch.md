# Protocol Witness 派发线路

Protocol witness 派发回答：

> 当调用目标是一个协议 requirement，而具体符合类型由调用上下文提供时，Swift 如何从“这个类型符合协议”走到“执行这个实现”？

它是 Swift 协议多态的主干。`struct`、`enum`、`class`、`actor` 都可以通过同一种 conformance 语义满足协议；调用端不必依赖共同的 class 继承树。

本文始终分开三层事实：

| 层级 | 本文如何表述 | 可以依赖什么 |
| --- | --- | --- |
| **语言语义** | requirement 由 conformance 提供 witness；调用必须表现为该 conformance 选中的实现 | Swift 源代码可观察行为 |
| **常见实现 / ABI** | protocol witness table、conformance descriptor、witness thunk、existential container | 指定工具链和 ABI 文档所描述的运行模型 |
| **优化结果** | specialization、devirtualization、inline、existential elimination | 只对当前构建参数、模块边界和编译产物成立 |

“通过 witness 派发”不保证最终机器码一定保留一次表查询。反过来，在 SIL 或汇编中看到 witness table，也不能把具体表布局提升成所有平台永久不变的语言规则。

## 1. Requirement、Conformance 与 Witness

先建立最小模型：

```swift
protocol Rendering {
    func render() -> String
}

struct PDF: Rendering {
    func render() -> String {
        "PDF"
    }
}
```

这里有三个不同对象：

1. `Rendering.render()` 是 **requirement**，声明所有 conformer 必须提供什么能力；
2. `PDF: Rendering` 是 **conformance**，声明 `PDF` 以哪一组实现满足 `Rendering`；
3. `PDF.render()` 是该 requirement 的一个 **witness**。

可以把语言语义抽象为：

```text
(具体类型 PDF, 协议 Rendering)
→ 找到 PDF: Rendering 这份 conformance
→ 从 conformance 取得 render requirement 的 witness
→ 调用 PDF.render
```

### 1.1 Conformance 不是每个实例各自拥有

Swift 的协议符合关系属于类型与协议之间的全局关系，不是对象实例上的可替换策略：

```text
PDF 的实例 A ─┐
PDF 的实例 B ─┼─→ 共用 PDF: Rendering 的符合关系
PDF 的实例 C ─┘
```

同一程序中，一个具体类型不能以两套彼此不同的方式重复符合同一个协议。若业务确实需要两套语义，应使用不同 wrapper 类型，而不是期待实例携带不同 witness：

```swift
struct Compact<Value> {
    let value: Value
}

struct Verbose<Value> {
    let value: Value
}
```

### 1.2 Requirement 不限于实例方法

Protocol requirement 还可以是：

- property getter / setter；
- subscript accessor；
- `static` requirement；
- initializer requirement；
- `mutating` method；
- `async` / `throws` method；
- 使用 associated type 或 `Self` 的声明。

它们都需要 conformance 提供相应 witness，只是调用约定、`Self` 传递方式、返回值和错误/异步路径不同。

## 2. 默认实现仍然是 Requirement 的 Witness

协议 extension 可以为 requirement 提供默认实现：

```swift
protocol Describing {
    func describe() -> String
}

extension Describing {
    func describe() -> String {
        "default"
    }
}

struct User: Describing {
    func describe() -> String {
        "user"
    }
}

struct Empty: Describing {}
```

形成 conformance 时：

```text
User: Describing
└─ describe witness → User.describe

Empty: Describing
└─ describe witness → Describing extension 的默认实现
```

语言保证的是：

- conformer 自己提供匹配实现时，使用该实现；
- 否则，满足条件的默认实现可以成为 witness；
- 默认实现成为 witness 后，requirement 调用不需要 optional chaining。

默认实现不是“每次调用时再按动态类型重新搜索 extension”。关键选择发生在 conformance 形成时。

### 2.1 Synthesized implementation 也是 Witness

编译器为 `Equatable`、`Hashable`、`Codable` 等协议合成实现时，合成出来的声明同样可以成为 requirement witness。

“手写”“默认实现”“编译器合成”描述 witness 的来源，不改变 requirement 通过 conformance 被满足这一语义。

## 3. Protocol Extension-only 成员不进入 Witness 线路

下面两个方法虽然都写在协议相关代码中，地位完全不同：

```swift
protocol Rendering {
    func render() -> String       // requirement
}

extension Rendering {
    func render() -> String {     // requirement 的默认实现
        "default render"
    }

    func debugName() -> String {  // extension-only 成员
        "extension-only"
    }
}

struct PDF: Rendering {
    func render() -> String {
        "PDF.render"
    }

    func debugName() -> String {
        "PDF.debugName"
    }
}
```

观察三种调用：

```swift
func inspect<T: Rendering>(_ value: T) -> (String, String) {
    (value.render(), value.debugName())
}

let concrete = PDF()
let erased: any Rendering = PDF()

print(concrete.render())          // PDF.render
print(concrete.debugName())       // PDF.debugName

print(inspect(concrete).0)        // PDF.render
print(inspect(concrete).1)        // extension-only

print(erased.render())            // PDF.render
print(erased.debugName())         // extension-only
```

原因：

- `render()` 出现在协议声明中，是 requirement；`PDF: Rendering` 为它选择 witness；
- `debugName()` 只出现在 extension 中，没有 requirement slot；
- 在 `T: Rendering` 或 `any Rendering` 的静态视角下，`debugName()` 解析为协议 extension 成员；
- 编译器不会因为运行时 payload 是 `PDF`，就把 extension-only 调用重新派发到 `PDF.debugName()`。

如果需要多态替换，必须把声明放进协议：

```swift
protocol Rendering {
    func render() -> String
    func debugName() -> String
}
```

### 3.1 “协议扩展是静态派发”为什么不够准确

这句话把两件事混在一起：

- extension **为 requirement 提供默认实现**：该实现可以成为 witness，requirement 调用仍遵守 conformance 多态；
- extension **新增非 requirement 成员**：调用通常由静态可见成员决定，不进入该协议的 witness 选择。

正确问题不是“方法写在哪里”，而是：

> 这个声明是否属于协议 requirement？当前调用是否正通过该 requirement 发生？

### 3.2 受约束的默认实现不会在每次调用时竞选

协议可能有多个带约束的 extension：

```swift
protocol Loggable {
    func log()
}

extension Loggable {
    func log() {
        print(self)
    }
}

extension Loggable where Self: CustomStringConvertible {
    func log() {
        print(description)
    }
}
```

具体表达式的重载解析可能看到更具体的 extension 成员，但 generic / existential requirement 调用使用 conformance 已选定的 witness。形成 conformance 时能使用哪些约束，决定哪一个实现可以成为 witness；调用时不会按某个实例临时拥有的更多静态知识重新生成另一份 conformance。

因此必须区分：

```text
某个具体表达式选择哪个重载
≠
某份 conformance 为 requirement 记录哪个 witness
```

## 4. 四种协议使用表面

同一个 requirement 可以从 concrete、generic、opaque 和 existential 四种表面被调用。它们都遵守 conformance，但保留的类型信息不同。

### 4.1 Concrete：具体类型已经可见

```swift
let value = PDF()
value.render()
```

编译器知道：

- 具体类型是 `PDF`；
- conformance 是 `PDF: Rendering`；
- witness 是 `PDF.render()`。

语义仍与 conformance 一致，但机器码通常有充分条件直接调用或 inline。

### 4.2 Generic `T: P`：调用方选择具体类型

```swift
func draw<T: Rendering>(_ value: T) -> String {
    value.render()
}
```

`T` 是“一个具体但参数化的类型”。调用方为每次泛型实例化选择 `T`：

```swift
draw(PDF())       // T == PDF
draw(SomeView())  // T == SomeView
```

在未特化的常见实现中，generic 调用需要：

- `T` 的值或地址；
- `T` 的类型 metadata；
- `T: Rendering` 的 conformance / witness table。

这不需要先把 `T` 装进 `any Rendering` existential。

### 4.3 `some P`：底层类型固定，但对一侧隐藏

返回位置：

```swift
func makeRenderer() -> some Rendering {
    PDF()
}
```

实现方选择一个固定底层类型，调用方看不到名字，但该 opaque type 保留静态类型 identity 和 conformance。

参数位置：

```swift
func draw(_ value: some Rendering) -> String {
    value.render()
}
```

这里的 `some Rendering` 是匿名 generic parameter 的简写，派发模型与 `T: Rendering` 对应。

必须分开：

```text
some P 返回值：实现方选择一个隐藏但固定的具体类型
some P 参数：调用方选择具体类型，语法上省略 generic parameter 名字
```

`some P` 本身不要求 existential container。跨 resilient module 边界时，客户端可能通过 opaque type metadata 与 conformance accessor 操作隐藏类型；那仍不同于“一个变量可在运行时装入任意 P conformer”的 `any P`。

### 4.4 `any P`：容器在运行时携带某个符合值

```swift
let value: any Rendering = PDF()
value.render()
```

变量的静态类型是 existential `any Rendering`，不同赋值时可以容纳不同 concrete type。调用 requirement 时，程序要从 existential 中取得：

- 当前 payload；
- payload 的动态类型信息；
- 该动态类型对 `Rendering` 的 conformance。

随后才调用对应 witness。

### 4.5 四种表面的类型信息

| 表面 | 谁选择具体类型 | 是否保留单一静态 identity | 是否天然需要 existential container | requirement 的语义依据 |
| --- | --- | --- | --- | --- |
| concrete `PDF` | 声明/表达式已确定 | 是 | 否 | `PDF: P` |
| generic `T: P` | 调用方 | 是，参数化为 `T` | 否 | `T: P` 隐藏 conformance 参数 |
| opaque `some P` 返回值 | 实现方 | 是，名字被隐藏 | 否 | opaque type 的 conformance |
| existential `any P` | 运行时容器中的值 | 容器外不保留具体 identity | 是，语义上需要类型擦除容器 | 容器携带的 concrete conformance |

## 5. Existential Container 与 Opening

### 5.1 “Boxed protocol type”不等于每次都堆分配

Swift Book 把 `any P` 称为 boxed protocol type，强调它抹去了底层类型名字并增加间接层。这里的“box”首先是类型系统概念，不应直接翻译成“一定创建一个 heap object”。

Swift ABI 文档描述的常见 opaque existential container 包含：

```text
payload buffer 或指向外部存储的引用
+ concrete type metadata
+ 每个所需 protocol conformance 的 witness table 引用
```

小 payload 可以内联在固定缓冲区；较大或对齐不合适的 payload 可以使用外部存储。class-constrained existential 还能采用更紧凑的对象引用加 witness table 表示。优化器也可能证明 concrete type 后消除整个容器。

因此：

```text
any P 有类型擦除与容器语义
≠
每次构造、复制或调用都必然发生一次堆分配
```

### 5.2 打开 Existential

调用：

```swift
func use(_ value: any Rendering) -> String {
    value.render()
}
```

可以用下面的语义模型理解：

```text
读取 existential container
→ 取出当前 concrete type 与 conformance
→ 为该次操作创建一个不可从作用域逃逸的 opened type
→ 将 payload 视为这个 opened type 的值
→ 通过它的 Rendering conformance 调用 render witness
→ 把需要暴露到外部的结果重新擦除
```

“打开”给容器中的动态类型一个临时、唯一的编译器内部名字，使 requirement 中的 `Self` 和 associated type 关系可以在这次操作内保持一致。

### 5.3 Member call 与隐式打开

对 existential 的 requirement member call 本身就需要打开 payload：

```swift
value.render()
```

常见 SIL 形态可简化为：

```text
open_existential_addr / open_existential_value
→ witness_method $OpenedType, #Rendering.render
→ apply
```

这些 SIL 指令是当前编译器的中间表示，不是 Swift 源语言语法。

### 5.4 把 `any P` 传给 `T: P`

现代 Swift 在满足规则时可以隐式打开 existential：

```swift
func draw<T: Rendering>(_ value: T) -> String {
    value.render()
}

func forward(_ value: any Rendering) -> String {
    draw(value)
}
```

这里通常不是把 generic parameter `T` 简单绑定为 existential box 类型。更准确的模型是：

```text
打开 value
→ T 绑定到 value 当前 payload 的底层类型
→ 将 payload 和对应 conformance 传给 draw
→ 返回后抹去不能逃逸的 opened type identity
```

### 5.5 不要把“能调用”简化成 `any P: P`

对大多数 Swift 协议，existential box 本身并没有一份普通的、用户声明的 `P` conformance；能调用 requirement 或传入某些 generic API，常来自 member opening 或 implicitly opened existential。

存在语言特例与版本规则，例如 `Error`、部分 `@objc` protocol 以及 Swift 5 / Swift 6 language mode 对 opening 的兼容行为。因此更安全的判断方式是：

1. 当前表达式是否打开底层 concrete type；
2. generic parameter 能否绑定到该 opened type；
3. associated type / `Self` 关系能否在结果中被重新擦除；
4. 当前 Swift language mode 是否允许这次 opening。

不要把所有情况压缩为一句“`any P` 符合 P”或“`any P` 永远不符合 P”。

## 6. Associated Type 与 `Self`

```swift
protocol Source<Element> {
    associatedtype Element
    func next() -> Element
}

struct IntSource: Source {
    func next() -> Int {
        42
    }
}
```

`IntSource: Source` 不只需要为 `next()` 提供函数 witness，还要提供：

- `Element == Int` 的 associated type witness；
- 若 associated type 自己带 protocol constraint，还需要对应 conformance 信息。

在常见 ABI 模型中，这些信息可通过 protocol conformance / witness table 访问。

### 6.1 Generic 保留关系

```swift
func first<S: Source>(_ source: S) -> S.Element {
    source.next()
}
```

函数体内，`S.Element` 与 `source` 的具体 `S` 始终相关联。

### 6.2 Constrained Existential 保留已声明的部分关系

```swift
func read(_ source: any Source<Int>) -> Int {
    first(source)
}
```

primary associated type 语法让 existential 明确记录 `Element == Int`。打开 `source` 后，generic helper 可以使用这份关系。

### 6.3 `Self` 参数需要同一底层类型

```swift
protocol SameValue {
    func isSame(as other: Self) -> Bool
}

func compare<T: SameValue>(_ lhs: T, _ rhs: T) -> Bool {
    lhs.isSame(as: rhs)
}
```

两个独立的 `any SameValue` 容器可能装着不同 concrete type，因此不能任意把其中一个当作另一个 requirement 所需的 `Self` 参数：

```swift
func cannotGenerallyCompare(
    _ lhs: any SameValue,
    _ rhs: any SameValue
) {
    // lhs.isSame(as: rhs)
    // rhs 不保证与 lhs 打开后的 concrete Self 相同。
}
```

判断 existential member 是否可用时，要看 associated type / `Self` 出现的位置：

- 只作为协变结果时，编译器常能把结果重新擦除到可表示的上界；
- 作为参数要求精确的同一 concrete type 时，调用方通常没有足够证据；
- 出现在不变容器或无法表达的返回关系中时，implicit opening 可能被拒绝；
- constrained existential 可以保留 primary associated type 的部分等式，但不会凭空恢复所有类型关系。

“带 associated type 的协议不能用作 existential”已经不是现代 Swift 的准确规则。正确问题是：某个具体 member 的类型关系在打开和重新擦除后是否仍可表达。

## 7. Class Conformer 与继承陷阱

Protocol witness 与 class vtable 可以组成两级线路。最重要的区别是：class conformance 在哪一级形成，以及它选择了什么 witness。

### 7.1 Superclass 采用默认 Witness

```swift
protocol Auditing {
    func audit() -> String
}

extension Auditing {
    func audit() -> String {
        "default"
    }
}

class DefaultBase: Auditing {}

final class DefaultChild: DefaultBase {
    func audit() -> String {
        "child"
    }
}

func runAudit<T: Auditing>(_ value: T) -> String {
    value.audit()
}

let child = DefaultChild()

print(child.audit())                       // child
print(runAudit(child))                     // default
print((child as any Auditing).audit())     // default
```

原因：

1. `DefaultBase: Auditing` 形成 conformance；
2. `DefaultBase` 没有 class method 实现 requirement；
3. conformance 选择协议 extension 的默认实现作为 witness；
4. `DefaultChild` 继承的是同一份 conformance；
5. `DefaultChild.audit()` 是一个同名 class 成员，但没有 override 一个 `DefaultBase.audit()`；
6. concrete member lookup 可以找到 child 成员，protocol requirement 调用仍走已选定的默认 witness。

子类不能通过重复声明 `DefaultChild: Auditing` 创建第二份 conformance 来替换继承的 conformance。

### 7.2 Superclass 显式实现 Requirement

```swift
class VirtualBase: Auditing {
    func audit() -> String {
        "base"
    }
}

final class VirtualChild: VirtualBase {
    override func audit() -> String {
        "child override"
    }
}

let child = VirtualChild()

print(runAudit(child))                     // child override
print((child as any Auditing).audit())     // child override
```

此时常见调用链是：

```text
Auditing witness slot
→ witness thunk
→ 对 VirtualBase.audit 的 class virtual dispatch
→ 根据 receiver 动态 class 选择 VirtualChild.audit
```

所以“通过协议调用”不表示 class vtable 消失。Witness 可以是一个适配入口，内部继续使用 class override 语义。

### 7.3 设计建议

若 superclass 的 conformance 明确允许 subclass 定制 requirement：

- superclass 应显式提供可 override 的 requirement 实现；
- 不要让 superclass 仅依赖协议 extension 默认实现，再期待 subclass 同名方法替换 witness；
- 若不同子类需要完全不同的 conformances，优先使用 composition / wrapper，而不是让继承层级承担多套协议语义；
- initializer requirement 还要遵守 `required` 等 class 初始化规则。

## 8. 从编译期到运行时的完整调用链

### 8.1 编译 conformance

以：

```swift
struct PDF: Rendering {
    func render() -> String { "PDF" }
}
```

为例，编译器大致完成：

1. 解析 `Rendering` 的 requirement 集合；
2. 检查 `PDF` 声明的 conformance；
3. 对每个 requirement 执行 witness matching；
4. 必要时选择默认或 synthesized implementation；
5. 验证 associated type、`Self`、ownership、`async`、`throws` 和 isolation 等签名要求；
6. 形成 `PDF: Rendering` 的 conformance 记录；
7. 生成或引用 protocol witness table；
8. 若实现签名与统一调用约定需要适配，生成 witness thunk；
9. 为 conditional conformance 生成按 generic 条件取得 witness table 的 accessor。

语言只要求这份 conformance 的行为正确，不要求每一步都以独立运行对象保留到最终二进制。

### 8.2 调用 `T: P`

源代码：

```swift
func draw<T: Rendering>(_ value: T) -> String {
    value.render()
}
```

未特化的常见运行链：

```text
调用方
├─ 传递 value
├─ 提供 T 的 metadata（需要时）
└─ 提供 T: Rendering 的 conformance / witness table
        ↓
draw 的共享泛型实现
        ↓
按 render requirement 取得 witness entry
        ↓
witness thunk（若需要）
        ↓
具体实现
        ↓
按抽象调用约定返回 String
```

简化 SIL 模型：

```text
%method = witness_method $T, #Rendering.render
%result = apply %method<T>(%value)
```

### 8.3 调用 `some P`

Opaque result 的 producer 固定底层类型及 conformance。跨模块时，常见实现会通过 opaque type descriptor / accessor 向客户端提供必要 metadata 和 conformance：

```text
调用 producer
→ 得到隐藏但固定的 concrete value
→ 通过该 opaque type 的 Rendering conformance 调用 requirement
→ 需要时使用 witness entry
```

若函数体、底层类型和 conformance 对优化器可见，调用可以被特化或直接化。Opaque 不等于 dynamic existential。

### 8.4 调用 `any P`

源代码：

```swift
func draw(_ value: any Rendering) -> String {
    value.render()
}
```

常见运行链：

```text
existential container
├─ payload / payload storage
├─ concrete type metadata
└─ concrete type : Rendering witness table
        ↓
打开 payload，形成临时 opened type
        ↓
从携带的 conformance 取得 render witness
        ↓
witness thunk（若需要）
        ↓
具体实现
        ↓
结果按可表示的外部类型返回或重新擦除
```

### 8.5 Witness Thunk 做什么

Witness table entry 不一定直接等于源码方法的函数地址。Thunk 可以适配：

- 协议统一的 `Self` 调用约定与 concrete type 的调用约定；
- value `self`、`inout self`、class reference 的差异；
- 参数与返回值的间接/直接表示；
- generic / associated type 的 reabstraction；
- ownership convention；
- nonthrowing 实现满足 throwing requirement 等允许的签名差异；
- class conformer 继续进入 vtable；
- Objective-C 可表示 requirement 的桥接入口；
- resilient module 边界。

因此更准确的线路是：

```text
witness slot
→ witness entry / thunk
→ 直接实现、class vtable 或其他合法后续入口
```

四条派发路线是解释层，不是互斥的单条机器指令。

## 9. Protocol Witness Table 不等于 Value Witness Table

这两个名字相似，但职责不同：

| 结构 | 回答的问题 | 常见内容 |
| --- | --- | --- |
| **Protocol Witness Table（PWT）** | `T` 如何满足某个协议的 requirements | requirement 函数入口、associated type / conformance 访问 |
| **Value Witness Table（VWT）** | 一个未知布局的 `T` 如何被复制、移动、销毁和分配 | size、alignment、copy、destroy 等值操作 |

处理 `any P` 时，两者可能同时参与：

```text
VWT：怎样管理容器中的具体值
PWT：怎样调用这个值对 P 的 requirement 实现
```

把 existential 复制、销毁和方法调用全都归因于 PWT，会丢失值生命周期这一层。

## 10. Conformance Descriptor、Table 与 Accessor

Swift ABI 的常见实现不只是一张静态函数指针数组：

- **protocol descriptor** 描述协议及 requirements；
- **conformance descriptor** 关联 conforming type、protocol 与取得 witness table 的方式；
- **protocol witness table** 提供一份具体 conformance 的 witnesses；
- **witness table accessor** 可以返回或按需实例化 table；
- **conditional conformance** 的 accessor 还依赖 generic arguments 的其他 conformances；
- **associated conformance** 可能需要进一步取得 associated type 的 witness table。

例如：

```swift
extension Array: Rendering where Element: Rendering {
    func render() -> String {
        map { $0.render() }.joined()
    }
}
```

`Array<Element>: Rendering` 只在 `Element: Rendering` 时存在。常见实现需要在取得 `Array<Element>` 的 conformance 时，同时获得 `Element: Rendering` 的 conformance。

概念链：

```text
Element metadata
+ Element: Rendering witness table
→ 构造/取得 Array<Element>: Rendering witness table
→ Array.render witness 可继续调用每个 Element 的 render witness
```

这说明 witness table 可能静态生成，也可能通过 runtime/accessor 按 generic 条件取得。

## 11. Resilience 与跨 Module 边界

在同一 module、whole-module optimization 下，编译器往往看到 concrete type、conformance 和实现体。跨一个启用 library evolution 的 module 边界时，客户端应依赖公开协议合同，而不是：

- hard-code 某个 witness slot 的物理偏移；
- 假定 public type 的内部布局；
- 假定默认实现函数体永远不变；
- 假定 opaque type 的底层类型名字；
- 假定 generic call 一定已特化。

Swift 的 library evolution 规则允许某些受约束的协议演进，例如在适当 availability 和默认实现条件下增加 requirement；删除已有 requirement、改变既有约束等通常不是安全演进。具体规则必须以目标工具链的 Library Evolution 文档为准。

### 11.1 Requirement 与 Extension-only 成员的演进成本不同

- 增加 extension-only helper 不增加 requirement witness；
- 把一个既有 extension-only 成员改成 requirement，会改变 conformance 合同；
- 新 requirement 需要所有 conformer 可获得合法 witness，并遵守 binary/source compatibility 规则；
- 改动默认实现函数体可以改变未来调用行为；已经被客户端内联的旧代码还涉及重新编译与部署边界。

### 11.2 `@inlinable` 是兼容性合同，不是普通加速按钮

把 generic 函数或默认实现标为 `@inlinable`，可以让客户端优化器看到函数体，从而增加 specialization / devirtualization 机会；同时也把更多实现细节暴露为跨 module 合同。

不能从“想去掉一次 witness 调用”直接推出“应该加 `@inlinable`”。还要权衡：

- 代码体积；
- 编译时间；
- ABI-public 依赖；
- 后续修复能否仅靠更新动态库生效；
- 实测是否存在瓶颈。

## 12. Specialization、Devirtualization 与 Inline

### 12.1 Generic Specialization

对：

```swift
func draw<T: Rendering>(_ value: T) -> String {
    value.render()
}

draw(PDF())
```

优化器可能生成 `T == PDF` 的专门版本：

```text
共享泛型版本：
value + metadata + witness table
→ witness_method

PDF 特化版本：
PDF value
→ 已知 PDF.render
→ 可能直接调用或 inline
```

这不改变：

- `PDF: Rendering` 选择哪个 witness；
- requirement 的可观察结果；
- extension-only 成员与 requirement 的差别。

### 12.2 Existential Devirtualization

即使源码使用 `any P`，若优化器能证明容器只可能装入一个 concrete type，也可能：

- 消除 existential container；
- 直接使用 concrete value；
- 把 witness 调用改成直接调用；
- inline 实现。

若值来自跨 module 返回、运行时集合、插件边界或动态 cast，concrete type 可能无法证明，间接调用和容器会保留。

### 12.3 性能不能只按“表查找次数”判断

真实成本还包括：

- payload 是否发生外部存储；
- copy / destroy / ARC；
- cache locality；
- branch prediction；
- generic specialization 带来的代码膨胀；
- 实现体本身的算法、I/O 和分配；
- module resilience 对可见性的限制。

一次 witness 间接调用通常不应在没有 profile 的情况下成为架构决策依据。

## 13. 所有权、值语义与装箱边界

### 13.1 `T: P` 不要求类型擦除

泛型参数保留 `T` 的类型 identity。调用 protocol requirement 需要 conformance 信息，但不需要先构造 `any P`：

```text
generic abstraction
≠
existential type erasure
```

### 13.2 `some P` 不等于 Box

Opaque type 隐藏名字但保留一个固定 identity；它通常按抽象 generic value 处理，不具备 `any P` 那种“同一变量可装入不同 conformer”的语义。

### 13.3 复制 `any P` 时由 Payload 语义决定

```swift
protocol Counter {
    mutating func increment()
    var value: Int { get }
}

struct ValueCounter: Counter {
    private(set) var value = 0

    mutating func increment() {
        value += 1
    }
}

final class ReferenceCounter: Counter {
    private(set) var value = 0

    func increment() {
        value += 1
    }
}
```

若 existential 装入 `ValueCounter`，复制 existential 必须维持底层值的复制语义；即使大值暂时使用外部存储，实现也不能暴露错误的共享可变状态。

若 existential 装入 `ReferenceCounter`，复制的是 class reference，两个 existential 可以指向同一对象 identity。

所以：

```text
any P 是 existential
≠
payload 自动变成引用语义
```

### 13.4 Mutating Requirement 需要可写打开

```swift
func advance(_ counter: inout any Counter) {
    counter.increment()
}
```

对 value payload，编译器需要以可写方式打开 existential storage，并在调用后保持容器处于正确状态。常见 SIL 会区分 immutable / mutable existential access。

Witness thunk 还必须遵守 `borrowing`、`consuming`、`inout` 等所有权约定。Witness 派发本身不授予额外别名权限，也不会绕开 Swift 的独占访问规则。

### 13.5 Box 生命周期不是业务生命周期

Existential container 管理 payload 的存储与销毁，不会自动：

- 取消异步任务；
- 解除 payload 内部的引用环；
- 关闭文件或 socket；
- 保证 callback 不再执行。

资源所有权仍由具体类型的 API、`deinit`、显式 `close`、取消协议和调用方作用域决定。

## 14. Sendable 与 Actor：只在协议合同处相交

Witness 派发不等于并发调度。

### 14.1 `Sendable` 不提供可调用的业务方法

`Sendable` 主要表达跨并发域传递的语义要求。一个类型符合业务协议 `P`，不因此自动 `Sendable`：

```swift
func transfer<T: Rendering & Sendable>(_ value: T) {
    // ...
}
```

同样，`any Rendering` 不因为携带一份 `Rendering` witness table 就自动满足跨隔离安全。

### 14.2 Actor Conformance 先满足 Isolation 合同

Actor 或 global-actor-isolated type 可以符合协议，但 requirement 的 isolation 必须与 witness 兼容：

- nonisolated synchronous requirement 不能被任意 actor-isolated 实现冒充；
- async requirement、isolated requirement 或版本支持的 isolated conformance 可以表达合法 hop；
- requirement 通过哪份 witness 选择实现，与调用是否需要 `await`、是否跨 actor，是相邻但不同的规则。

常见实现可能由 witness thunk 继续进入 async / actor executor 入口，但 witness table 本身不是 scheduler，也不提供串行执行保证。

严格并发和 isolated conformance 规则持续演进，应按项目 Swift language mode 复核；本篇只建立它们与 conformance 的连接。

## 15. 与另外三条派发线路逐层对比

| 层级 | 直接 / 静态 | Class vtable | **Protocol witness** | Objective-C message |
| --- | --- | --- | --- | --- |
| 源码前提 | 已选声明没有可观察替换点 | 可 override 的 class member | 通过 protocol requirement 调用 | 通过 Objective-C 动态成员调用 |
| 语义选择依据 | 编译期已知声明 | receiver 的动态 class | concrete type 对 protocol 的 conformance | receiver 的 Objective-C class + selector |
| 编译期主要产物 | 已知函数引用 | class override slot / method entry | conformance、witness、可能的 thunk | selector、ObjC entry / bridge |
| 运行时主要输入 | 参数 | object reference + class metadata | value / opened value + conformance | object reference + selector |
| 常见间接结构 | 无，或普通外部符号 thunk | vtable | protocol witness table | method cache / method list |
| 值类型可参与 | 是 | 否 | 是 | 一般不能直接作为 receiver |
| class override | 不支持 | 核心语义 | witness thunk 可继续进入 vtable | ObjC override / replacement |
| protocol requirement | 不需要 | 不需要 | 核心语义 | 可与 `@objc protocol` 相交 |
| extension-only 成员 | 常按静态声明调用 | 若是 class extension 仍不能新增 override | 不产生 requirement witness | Category/Runtime 规则不同，不能类推 |
| generic `T: P` | 无 requirement 时可直接 | class constraint 内仍可虚派发 | 共享 generic 常携带 conformance | 仅在 ObjC 可表示边界相交 |
| `any P` | 证明 concrete type 后可能直接化 | payload 是 class 时可能作为后续线路 | 打开 existential 后取得 witness | `@objc` existential 可能采用 ObjC 表示 |
| 常见存储成本 | 无派发专属容器 | class object 自身 | generic 无 box；existential 可能有容器/外部存储 | object 与 Runtime metadata |
| 跨 module resilience | 外部符号或 thunk | resilient class dispatch | conformance descriptor/table/accessor | Objective-C Runtime 合同 |
| 可否去虚化 | 已经是已知目标 | 证明动态类型后可以 | 证明 conformance/concrete type 后可以 | `dynamic` 明确保留 ObjC 动态访问 |
| 最容易误解 | “一定零成本” | “class 方法全走 vtable” | “协议 extension 全动态/全静态” | “`@objc` 等于 `dynamic`” |

四条完整概念线路：

```text
直接：
已选声明
→ 已知目标 / 外部符号
→ 实现

Class vtable：
已选可 override 声明
→ receiver 动态 class
→ vtable slot
→ override 实现

Protocol witness：
已选 requirement
→ concrete type : protocol conformance
→ witness entry / thunk
→ 直接实现，或继续进入 class vtable / bridge

Objective-C message：
已选 Objective-C 动态成员
→ receiver + selector
→ objc_msgSend / cache / method lookup
→ IMP
```

### 15.1 为什么 Witness 线路最容易与其他线路叠加

Protocol 描述能力，不限制 conformer 的存储类别：

- struct witness 常落到值类型函数；
- final class witness 可能落到已知 class 实现；
- non-final class witness thunk 可能继续走 vtable；
- `@objc` requirement 或桥接成员可能继续使用 Objective-C 调用约定；
- generic specialization 后 witness 线路可能被优化成直接调用。

因此“源码是 protocol call”说明语言语义依据 conformance，不足以单独预测最后一条机器指令。

## 16. 常见错误心智模型

### “Protocol 的所有 extension 方法都有动态多态”

错误。只有 requirement 才有相应 conformance witness；extension-only 成员由静态可见声明决定。

### “Protocol extension 的默认实现是静态派发，所以 conformer 不能替换”

错误。若该成员是 requirement，conformer 的实现可以成为 witness。应区分 requirement default 与 extension-only。

### “默认实现会在每次调用时与 concrete method 重新比较”

错误。Conformance 形成时选择 witness；调用时使用这份 conformance。

### “Generic 一定直接派发”

错误。未特化的 `T: P` 实现通常通过隐藏 conformance 参数调用 requirement；特化后才可能直接化。

### “`T: P` 会先转成 `any P`”

错误。Generic 保留 `T` 的静态 identity，不需要 existential type erasure。

### “`some P` 是更高效的 `any P` 拼写”

错误。Opaque 保留一个固定底层 identity；existential 在运行时容纳任意符合值。性能是结果，不是两者的定义。

### “`any P` 一定在堆上”

错误。Existential 有容器语义；payload 可内联、可外部存储，也可能被优化消除。

### “能把 `any P` 传给 `T: P`，所以 existential box 普通地符合 P”

不够准确。很多调用依赖 implicit opening，把 `T` 绑定到 payload 的底层类型；还存在协议和 language mode 特例。

### “有 associated type 的协议不能写 `any P`”

过时。现代 Swift 允许更多 existential 操作；真正限制来自 associated type / `Self` 关系能否被打开并重新擦除。

### “Witness table 每个对象一张”

错误。Witness table 描述 conformance，通常由同一具体类型的实例共享；conditional conformance 还可能通过 accessor 按 generic arguments 取得。

### “Protocol witness table 负责复制和销毁值”

错误。那主要是 value witness table 的职责；PWT 负责协议 requirement conformance。

### “Subclass 同名方法一定能替换 superclass 使用的默认 witness”

错误。Subclass 继承 superclass conformance；若 superclass 选择了协议 extension 默认 witness，subclass 同名方法不会改写那份 conformance。

### “通过 protocol 调用 class，就不会走 class vtable”

错误。Witness entry / thunk 可以继续进行 class virtual dispatch。

### “Witness 派发天然线程安全”

错误。它选择实现，不负责 actor isolation、锁、Sendable 或任务调度。

### “Witness 调用一定比直接调用慢”

错误。优化器可能特化、去虚化或 inline；即便保留间接调用，也要基于真实 profile 判断系统成本。

### “`-emit-sil` 看到的结果就是永久语言规则”

错误。SIL 是观察当前编译器 lowering 和优化的证据；语言规则应由 Swift Book、Language Reference 和正式 Evolution 提案支持。

## 17. 如何验证一条 Witness 调用

最小实验应同时覆盖：

1. concrete 调用；
2. `T: P` generic 调用；
3. `some P` opaque 调用；
4. `any P` existential 调用；
5. requirement default；
6. extension-only 同名成员；
7. class conformer 与 subclass override；
8. Debug / Release；
9. 同 module / 跨 module。

可使用：

```bash
swiftc -emit-sil source.swift
swiftc -O -emit-sil source.swift
swiftc -emit-ir source.swift
```

在 SIL 中重点观察：

- `witness_method`；
- `open_existential_addr` / `open_existential_value`；
- `init_existential_*`；
- `function_ref`；
- `class_method`；
- `apply`；
- 优化后 witness 调用是否被替换或 inline。

验证结论应写成：

```text
在 Swift <版本>、<优化级别>、<模块边界>、<目标平台> 下，
该调用被 lowering / 优化为……
```

不要只写“Swift 的协议调用永远是……”。

## 18. 线路摘要

Protocol witness 派发的稳定心智模型：

```text
协议声明 requirement
→ 具体类型声明 conformance
→ 编译器为每个 requirement 选择 witness
→ generic / opaque 调用携带或取得 conformance
→ existential 调用先打开 payload，再取得 conformance
→ witness entry / thunk 适配抽象调用约定
→ 落到具体实现，必要时继续进入 class vtable 或 ObjC bridge
→ 优化器可在不改变语义时特化、去虚化、inline 或消除容器
```

判断任何“协议方法为什么执行这个实现”时，依次问：

1. 调用的声明真的是 protocol requirement 吗？
2. 哪个 concrete type 对哪个 protocol 的 conformance 被使用？
3. 这份 conformance 选择了 conformer、自带默认还是 synthesized witness？
4. 当前表面是 concrete、`T: P`、`some P` 还是 `any P`？
5. 若是 existential，底层类型怎样被打开，结果怎样重新擦除？
6. requirement 是否带 associated type、`Self`、ownership 或 isolation 约束？
7. conformer 若为 class，witness 后是否继续进入 vtable？
8. 当前看到的是语言语义、ABI 常见实现，还是优化后的代码形态？

基础对照：[直接/静态派发](01-direct-dispatch.md)。

上一条线路：[Class 虚表派发](02-class-vtable-dispatch.md)。

下一条线路：[Objective-C 消息派发](04-objective-c-message-dispatch.md)。

## 一级资料

- [The Swift Programming Language — Protocols](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/protocols/)
- [The Swift Programming Language — Generics](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/generics/)
- [The Swift Programming Language — Opaque and Boxed Protocol Types](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/opaquetypes/)
- [The Swift Programming Language — Declarations](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/declarations/)
- [SE-0244: Opaque Result Types](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0244-opaque-result-types.md)
- [SE-0309: Unlock Existential Types for All Protocols](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0309-unlock-existential-types-for-all-protocols.md)
- [SE-0341: Opaque Parameter Declarations](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0341-opaque-parameters.md)
- [SE-0346: Lightweight Same-type Requirements for Primary Associated Types](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0346-light-weight-same-type-syntax.md)
- [SE-0352: Implicitly Opened Existentials](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0352-implicit-open-existentials.md)
- [SE-0353: Constrained Existential Types](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0353-constrained-existential-types.md)
- [Swift ABI — Type Layout: Existential Container Layout](https://github.com/swiftlang/swift/blob/main/docs/ABI/TypeLayout.rst#existential-container-layout)
- [Swift ABI — Type Metadata](https://github.com/swiftlang/swift/blob/main/docs/ABI/TypeMetadata.rst)
- [Swift SIL — Instructions: `witness_method` and existential operations](https://github.com/swiftlang/swift/blob/main/docs/SIL/Instructions.md)
- [Swift Compiler — Library Evolution](https://github.com/swiftlang/swift/blob/main/docs/LibraryEvolution.rst)
