# Class vtable 派发线路

Class vtable 派发解释 Swift 继承体系中的一个核心现象：

> 编译器已经根据 receiver 的静态类型选中了某个可重写成员声明，但真正执行哪一个 override，要等到运行时看到 receiver 的动态类型才能确定。

最小例子：

```swift
class Renderer {
    func render() -> String {
        "Renderer"
    }
}

final class ImageRenderer: Renderer {
    override func render() -> String {
        "ImageRenderer"
    }
}

let renderer: Renderer = ImageRenderer()
print(renderer.render()) // ImageRenderer
```

这里有两个不同的选择：

1. 静态类型 `Renderer` 让编译器找到并选中 `Renderer.render()` 这个声明；
2. 动态类型 `ImageRenderer` 让运行时执行 `ImageRenderer.render()` 这个 override。

“vtable”是理解第二步的常见实现模型，不是 Swift 源语言要求程序员直接操作的数据结构。

---

## 1. 先固定三层事实

讨论 class 派发时，必须把下面三层分开：

| 层级 | 本文所说的内容 | 可以依赖到什么程度 |
| --- | --- | --- |
| **语言语义** | inheritance、`override`、`final`、`static`、`class`、`self`、`super` 的可观察行为 | Swift 程序可以依赖 |
| **常见实现 / ABI 模型** | class metadata、vtable slot、dispatch thunk、SIL `class_method` | 用于解释当前工具链和 ABI，不等于全部源语言合同 |
| **优化结果** | 去虚化、内联、ARC 合并、whole-module 分析 | 只对具体编译器、优化级别和模块边界成立 |

因此，下面两句话可以同时成立：

```text
语言语义：这次调用必须表现得像动态选择了正确 override。

优化结果：编译器已经证明动态类型唯一，于是机器码中没有保留 vtable 查找。
```

如果优化后的程序仍保持相同可观察行为，它就没有改变 class 多态语义。

---

## 2. 静态类型与动态类型

### 2.1 静态类型决定“可以调用什么”

静态类型参与：

- 名称查找；
- 成员可见性；
- 重载解析；
- 参数和返回值类型检查；
- generic constraint 检查；
- access control；
- 确定调用属于哪个 override family。

```swift
class Animal {
    func speak() -> String {
        "animal"
    }
}

class Dog: Animal {
    override func speak() -> String {
        "woof"
    }

    func fetch() {}
}

let animal: Animal = Dog()
animal.speak() // 合法：Animal 声明了 speak()
// animal.fetch() // 编译错误：Animal 的成员集中没有 fetch()
```

`animal` 的运行时对象是 `Dog`，但这不会让 `Dog.fetch()` 自动进入 `Animal` 静态类型的成员集合。

### 2.2 动态类型决定“哪个 override 实现”

当已选声明允许 override 时，receiver 的动态 class 类型参与最终实现选择：

```swift
let first: Animal = Animal()
let second: Animal = Dog()

first.speak()  // animal
second.speak() // woof
```

两次调用在编译期选中的都是 `Animal.speak()` 这一声明族，运行时对象类型不同，所以最终实现不同。

### 2.3 向上转型不会改变对象

```swift
let dog = Dog()
let animalView: Animal = dog
```

这不是创建一个新的 `Animal` 对象，也不是删除 `Dog` 部分。它只是用 `Animal` 静态类型观察同一个对象。

因此：

```text
upcast 改变静态可见能力
≠
改变对象身份或动态类型
```

### 2.4 向下转换先做运行时检查

```swift
if let dogView = animalView as? Dog {
    dogView.fetch()
}
```

`as? Dog` 检查动态对象是否可以按 `Dog` 使用。成功后，`dogView` 的静态类型也变成 `Dog`，于是 `fetch()` 进入可见成员集合。

类型转换和方法派发是相邻但不同的阶段：

```text
dynamic cast：这个对象能否被看作目标类型？
class dispatch：已选成员应执行哪个 override？
```

---

## 3. 哪些 class 声明形成可重写线路

### 3.1 普通实例方法

非 `final` 的 class 实例方法可以在允许继承和访问的范围内被重写：

```swift
class BaseService {
    func execute() {}
}

class CachedService: BaseService {
    override func execute() {}
}
```

`override` 让编译器验证父类链中存在匹配声明。它不是“打开动态派发”的开关；可重写能力来自 class inheritance，`override` 是子类实现的显式声明和校验。

### 3.2 `final`

`final` 从语言语义上关闭进一步重写：

```swift
class Service {
    final func identifier() -> String {
        "service"
    }
}
```

也可以关闭整个继承入口：

```swift
final class TerminalService {
    func execute() {}
}
```

对 `final` 成员，运行时不再需要按 subclass 选择实现。编译器通常可以直接引用目标，但跨 module 的符号调用、ABI thunk 和最终是否 inline 仍是另一层问题。

### 3.3 `static` 与 `class`

Class 的**实例方法**不需要写 `class`；普通非 `final` 实例方法本身就可能被重写。

`static` 和 `class` 的区别出现在**类型成员**：

```swift
class Formatter {
    class func name() -> String {
        "Formatter"
    }

    static func version() -> Int {
        1
    }
}

class JSONFormatter: Formatter {
    override class func name() -> String {
        "JSONFormatter"
    }

    // 不能 override version()
}

let formatterType: Formatter.Type = JSONFormatter.self
print(formatterType.name())    // JSONFormatter
print(formatterType.version()) // 1
```

可以这样记：

| 声明 | subclass 能否 override | 选择依据 |
| --- | --- | --- |
| `class func` / `class var` | 能，除非再加 `final` | 动态 metatype |
| `static func` / `static var` | 不能 | 已知类型成员 |
| `final class func` | 不能 | 已知类型成员 |

在 class 声明中，成员上的 `static` 对可重写性具有与 `class final` 相同的效果。不要把这个 Swift 关键字含义和广义的“静态派发”术语混为一谈。

### 3.4 `public` 与 `open`

跨 module 时，access control 也限制 override 的可能范围：

- `public` class 可以被其他 module 使用，但不能仅凭 `public` 就在其他 module 中 subclass；
- `public` member 可以被其他 module 调用，但不能仅凭 `public` 就在其他 module 中 override；
- `open` class 和 `open` member 才开放跨 module 的 subclass / override；
- module 内部仍要结合实际声明和可见性判断。

这不表示 `public` 方法“永远直接派发”。它仍可能在定义 module 内存在 override，编译器也仍需遵守 library evolution 和实际调用边界。

---

## 4. 一次 class 调用的完整链路

下面用一条调用贯穿编译期和运行时：

```swift
func draw(_ renderer: Renderer) -> String {
    renderer.render()
}

draw(ImageRenderer())
```

### 4.1 编译期：先选择声明

概念流程：

```text
解析 renderer.render()
→ 得到 receiver 的静态类型 Renderer
→ 在 Renderer 及其可见继承成员中查找 render
→ 根据参数标签、参数类型、返回值上下文完成重载解析
→ 确定调用的是 Renderer.render 这一 override family
→ 判断该声明允许 subclass 提供不同实现
→ 保留 class 动态派发语义
```

这里已经确定了“哪个声明”，但尚未把实现永久固定为 `Renderer.render()`。

### 4.2 常见未优化实现：按动态类型查 slot

一个有用的概念模型是：

```text
求值 receiver
→ 保证 receiver 在调用期间有效
→ 从对象取得动态 class metadata
→ 找到 Renderer.render 对应的 dispatch slot
→ slot 中得到当前动态类型的实现地址
→ 把同一个 receiver 作为 self 传给实现
→ 执行 ImageRenderer.render
→ 返回结果并结束 receiver 的本次使用
```

示意图：

```mermaid
flowchart LR
    C["调用点<br/>renderer.render()"]
    C --> R["receiver 引用"]
    R --> M["动态 class metadata"]
    M --> S["render 对应 slot"]
    S --> I["ImageRenderer.render 实现"]
    I --> O["返回结果"]
```

真实 ABI 不要求对象内部按这张图逐字段布局；关键关系是：动态 class 身份让程序找到该 override family 的当前实现。

### 4.3 Slot 代表声明族，不只是方法名

不能只用字符串 `"render"` 理解 vtable。Swift 在编译期已经处理：

- module 和作用域；
- 参数标签；
- overload；
- generic signature；
- instance / type member；
- accessor 种类；
- override 关系。

概念上的 slot 对应的是一个已确定的可重写声明族：

```text
Renderer.render() -> String
```

子类 override 通常替换这一族在子类 class metadata 中的实现入口，而不是在运行时重新做一次 Swift 源代码级重载解析。

### 4.4 `self` 是同一个对象

进入 override 后，`self` 仍是原来的动态对象：

```swift
class Parent {
    func describe() -> String {
        "Parent"
    }
}

class Child: Parent {
    let detail = "child state"

    override func describe() -> String {
        "\(detail), runtime type: \(type(of: self))"
    }
}

let value: Parent = Child()
value.describe()
```

调用过程中没有创建“父类部分对象”和“子类部分对象”两个 receiver。

---

## 5. `self` 与 `super`：同一对象，不同查找起点

### 5.1 `self.member`

`self` 表示当前实例。调用可重写成员时，正常 class override 语义仍然适用：

```swift
class Pipeline {
    func run() {
        step()
    }

    func step() {
        print("Pipeline.step")
    }
}

class CustomPipeline: Pipeline {
    override func step() {
        print("CustomPipeline.step")
    }
}

CustomPipeline().run() // CustomPipeline.step
```

虽然 `run()` 的函数体写在 `Pipeline` 中，`self` 的动态类型仍是 `CustomPipeline`。

### 5.2 `super.member`

`super` 不是另一个对象。它表示：

> 对同一个 `self`，从当前类的 superclass 实现开始处理这个成员访问。

```swift
class LoggedPipeline: Pipeline {
    override func run() {
        print("before")
        super.run()
        print("after")
    }

    override func step() {
        print("LoggedPipeline.step")
    }
}

LoggedPipeline().run()
```

输出概念上是：

```text
before
LoggedPipeline.step
after
```

解释：

1. `super.run()` 进入 `Pipeline.run()`；
2. `Pipeline.run()` 内部再次调用的是 `self.step()`；
3. `self` 仍是 `LoggedPipeline` 对象；
4. 所以第二次调用又能动态选择 `LoggedPipeline.step()`。

因此：

```text
super.run()
≠
从此以后整条调用树都关闭动态派发
```

`super` 只改变这一个显式成员访问的实现起点。常见 SIL 可能使用 `super_method` 或已知函数引用；跨 resilience 边界也可能保留 thunk，不能仅从源代码推断一条固定机器指令。

---

## 6. 初始化、`self`、`super.init` 与动态调用

初始化不是普通实例方法调用，但它会与 class 派发相交。

### 6.1 两阶段初始化先保证对象有效

Class designated initializer 的核心次序是：

```text
初始化当前类引入的所有 stored properties
→ 调用 immediate superclass 的 designated initializer
→ 一直向上完成第一阶段
→ 从 superclass 向 subclass 返回，进入第二阶段定制
```

在第一阶段完成前，Swift 限制：

- 把 `self` 当成完整值使用；
- 调用实例方法；
- 读取实例属性；
- 触发可能观察未完成对象的行为。

这些规则先保证 class 实例有效，然后才允许普通成员调用语义介入。

### 6.2 `super.init` 是初始化委托，不是创建父对象

```swift
class BaseConnection {
    let endpoint: String

    init(endpoint: String) {
        self.endpoint = endpoint
    }
}

class AuthenticatedConnection: BaseConnection {
    let token: String

    init(endpoint: String, token: String) {
        self.token = token
        super.init(endpoint: endpoint)
    }
}
```

`super.init` 继续初始化同一个最终对象的 superclass 部分。它不会返回另一个独立 `BaseConnection` 实例。

### 6.3 一旦允许调用，`self` 仍具有真实动态类型

```swift
class BaseDocument {
    init() {
        didPrepare()
    }

    func didPrepare() {
        print("BaseDocument")
    }
}

class PDFDocument: BaseDocument {
    let format: String

    override init() {
        format = "PDF"      // subclass 自己的 stored property 先初始化
        super.init()
    }

    override func didPrepare() {
        print(format)
    }
}

_ = PDFDocument() // PDF
```

当语言的初始化安全检查允许 `BaseDocument.init` 调用实例方法时，`self` 仍是 `PDFDocument`，所以可重写调用仍能到达 subclass override。

但这不代表在 initializer 中调用 override 总是好的设计。Subclass 在 `super.init` 返回后的第二阶段定制尚未执行：

```swift
class RiskyDocument: BaseDocument {
    let format: String
    var cacheIsReady = false

    override init() {
        format = "risky"
        super.init()        // 这里可能调用 didPrepare()
        cacheIsReady = true // 第二阶段状态此时还没建立
    }

    override func didPrepare() {
        // format 已完成第一阶段初始化，
        // 但不能假定 cacheIsReady 已完成第二阶段定制。
    }
}
```

如果 superclass 初始化必须保持封闭不变量，优先使用不可重写的初始化辅助逻辑，而不是依赖 subclass hook 的调用时机。

### 6.4 Initializer 也可能具有动态 metatype 选择

```swift
class Document {
    required init() {}
}

class Spreadsheet: Document {
    required init() {
        super.init()
    }
}

func makeDocument(_ type: Document.Type) -> Document {
    type.init()
}

let document = makeDocument(Spreadsheet.self)
print(type(of: document)) // Spreadsheet
```

这里调用的是动态 metatype 上的 `required init`。语言保证每个 subclass 满足 required initializer 合同；常见实现可能通过 class metadata 中的 allocating initializer entry 完成选择。

需要区分：

- `self.init(...)`：在同一类的 initializer 集合中横向委托，convenience initializer 最终要到 designated initializer；
- `super.init(...)`：向 immediate superclass 的 designated initializer 委托；
- `SomeType(...)`：静态 metatype 已知的构造；
- `type.init(...)`：动态 metatype 上的 required initializer 选择。

“initializer 的 ABI entry 可能出现在 vtable/metadata 中”不表示源语言把 `init` 完全当成普通 `func`。

---

## 7. 属性和 Subscript 也是派发面

Class 动态派发不只发生在显式 `func`。

### 7.1 Property 暴露 accessor

```swift
class Theme {
    var name: String {
        "base"
    }
}

class DarkTheme: Theme {
    override var name: String {
        "dark"
    }
}

let theme: Theme = DarkTheme()
print(theme.name) // dark
```

从调用模型看，`theme.name` 需要执行 getter。可变属性还可能涉及：

- setter；
- modify accessor / coroutine；
- property observers；
- 跨 resilience 边界的 accessor thunk。

所以不要把所有 class property access 都画成：

```text
对象地址 + 固定字段偏移
```

语言允许 subclass 用 computed property override 继承属性，也允许为继承属性增加 observers。公开 ABI 通常把 property 视为一组 accessor 函数。

### 7.2 不能用新 stored property“替换父类存储”

Subclass 可以 override 继承 property 的 getter/setter 行为，但这不是声明一块同名新存储来覆盖父类字段。

“property override”描述的是访问语义。底层是否有存储、存储在哪里、是否直接取字段，取决于原声明、访问位置、resilience 和优化。

### 7.3 Subscript 也有 accessor

```swift
class Table {
    subscript(index: Int) -> String {
        "row \(index)"
    }
}

class FilteredTable: Table {
    override subscript(index: Int) -> String {
        "filtered row \(index)"
    }
}

let table: Table = FilteredTable()
print(table[2]) // filtered row 2
```

Subscript 的 getter/setter 可以像方法和 property accessor 一样形成 override family。

### 7.4 `super` 对 accessor 同样生效

```swift
class DecoratedTheme: Theme {
    override var name: String {
        "decorated(\(super.name))"
    }
}
```

`super.name` 选择 superclass getter 实现，但 receiver 仍是同一个 `DecoratedTheme` 对象。

---

## 8. 闭包捕获 receiver 后，派发与生命周期仍是两件事

### 8.1 默认强捕获让 receiver 继续存活

```swift
class Worker {
    func work() {
        print("Worker")
    }
}

class SpecializedWorker: Worker {
    override func work() {
        print("SpecializedWorker")
    }
}

let worker: Worker = SpecializedWorker()
let action = {
    worker.work()
}

action() // SpecializedWorker
```

这里有两层：

1. closure 默认强捕获 `worker`，影响对象生命周期；
2. closure 执行 `worker.work()` 时，仍按动态类型选择 override。

强捕获不会把调用“冻结”为 `Worker.work()`。

### 8.2 方法值绑定 receiver

实例方法也可以形成已绑定 receiver 的函数值：

```swift
let action: () -> Void = worker.work
action()
```

从源代码心智模型看，`action` 同时保存了“调用能力”和对应 receiver。对于 class receiver，这通常也会让对象保持存活。

当生命周期关系重要时，显式 closure 和 capture list 更清楚：

```swift
let weakAction: () -> Void = { [weak worker] in
    worker?.work()
}
```

### 8.3 `weak` 改变可用性，不改变 override 规则

`weak` 不拥有对象，读取时得到 Optional：

```swift
let action: () -> Void = { [weak worker] in
    guard let worker else { return }
    worker.work()
}
```

成功解包后，这次调用仍根据对象的动态 class 类型派发。`weak` 决定“对象是否还存在”，vtable 语义决定“存在时执行哪个 override”。

### 8.4 Closure 与实例可能形成引用环

```swift
class Controller {
    var callback: (() -> Void)?

    func install() {
        callback = {
            self.refresh()
        }
    }

    func refresh() {}
}
```

如果实例强持有 closure，closure 又强捕获 `self`，就可能形成强引用环。这是 ARC/所有权问题，不是派发表的问题。

---

## 9. vtable、class metadata 与 dispatch thunk

### 9.1 最小 vtable 心智模型

假设：

```swift
class Base {
    func first() {}
    func second() {}
}

class Derived: Base {
    override func second() {}
}
```

可以把常见实现想象为：

```text
Base metadata
  slot(Base.first)  → Base.first
  slot(Base.second) → Base.second

Derived metadata
  slot(Base.first)  → Base.first
  slot(Base.second) → Derived.second
```

Subclass 复用 `Base.second` 的 override slot，并让它指向新实现。

这张表只表达关系，不承诺：

- slot 的数值偏移；
- metadata 的完整内存布局；
- 每个成员都必须占一个普通函数指针；
- initializer、deinitializer、generic method、accessor 的具体 entry 形式；
- 所有平台和 Swift 版本使用完全相同布局。

### 9.2 Class metadata 不只包含方法表

Swift Runtime 需要 class metadata 描述类型。常见 ABI 还可能关联：

- superclass；
- class size / instance layout 信息；
- method dispatch entries；
- initializer / deallocator entries；
- generic metadata 参数；
- field 和 reflection 描述；
- Objective-C 互操作信息。

本文只关心“动态 class 身份如何连到可重写实现”，不把 metadata 简化成单独一张 vtable。

### 9.3 为什么 resilience 需要 thunk

如果 framework 独立升级，client 不能把旧版本看到的 vtable slot 偏移永久写死，否则 framework：

- 重排方法；
- 新增方法；
- 调整 superclass；
- 在继承链中插入新 superclass；

都可能破坏旧 client。

Swift 的 library evolution 模型中，对 resilient Swift-native class 的跨边界调用可以经过 **dispatch thunk**：

```text
旧 client 调用稳定符号
→ framework 内的 dispatch thunk
→ thunk 使用当前 framework 知道的布局定位实现
→ 运行当前动态类型的 override
```

Thunk 提供的是 ABI 间接层，不是第五种源语言多态：

```text
语言语义仍是 class override
实现为满足二进制演进而增加 thunk
```

### 9.4 同一 module 内不必付出相同边界

同一编译单元、同一 module 或关闭 library evolution 时，编译器掌握的信息通常更多，可能：

- 直接使用已知 slot；
- 省略某些 dispatch thunk；
- 完成 class hierarchy analysis；
- 去虚化；
- inline。

不能把 binary framework 的 resilience 路径无条件套到所有 App target 或 Swift Package 上。

### 9.5 `@objc` 进入另一套 Runtime

Swift-native vtable 路径和 Objective-C message dispatch 不是同一件事。

```swift
import Foundation

class RuntimeWorker: NSObject {
    @objc dynamic func work() {}
}
```

`dynamic` 保证访问通过 Objective-C Runtime 动态派发，并要求声明可表示为 Objective-C。常见入口是 `objc_msgSend` 及 selector/method cache 体系，而不是本文的 Swift-native vtable slot。

仅有 `@objc` 表示声明可以暴露给 Objective-C；它本身不等于所有 Swift 调用都必须使用 Objective-C 消息派发。

---

## 10. SIL 中如何观察这条线路

可以比较未优化和优化后的 SIL：

```bash
swiftc -emit-silgen sample.swift
swiftc -emit-sil sample.swift
swiftc -O -emit-sil sample.swift
```

常见观察点：

| SIL 线索 | 常见含义 |
| --- | --- |
| `class_method` | 从动态 class 实例取得可重写方法 |
| `super_method` | 显式 superclass 实现查找 |
| `function_ref` | 已知函数引用，可能来自直接目标或去虚化结果 |
| `sil_vtable` | SIL 层记录 class override entries |
| `apply` | 调用得到的函数值 |
| `strong_retain` / `strong_release` / borrow 相关指令 | receiver 与参数生命周期操作 |

观察顺序：

```text
先看 -emit-silgen / 未优化 SIL 是否表达 class_method
→ 再看 -O 后是否变为 function_ref 或被 inline
→ 最后结合 module、access level、library evolution 和调用点解释原因
```

SIL 输出只证明：

- 当前 Swift 工具链；
- 当前 target；
- 当前优化参数；
- 当前源代码；
- 当前 module/resilience 边界。

它不自动成为所有未来 Swift 版本的语言保证。

---

## 11. 去虚化：保留语义，消除间接选择

### 11.1 什么是去虚化

去虚化是编译器证明动态目标唯一后，把概念上的：

```text
metadata → slot → implementation
```

变成：

```text
known implementation
```

例如：

```swift
func makeAndRun() {
    let worker = SpecializedWorker()
    worker.work()
}
```

调用点直接创建 `SpecializedWorker`，没有把对象逃逸到编译器看不见的位置。优化器可能证明这里只有 `SpecializedWorker.work()`，于是消除虚调用。

### 11.2 常见证明来源

| 证明来源 | 为什么有帮助 |
| --- | --- |
| `final class` | 不存在 subclass |
| `final` member | 不存在该成员的 override |
| `static` class member | 语言禁止 override |
| 已知的具体 allocation | 调用点可能知道精确动态类型 |
| `private` / `fileprivate` | override 搜索范围受限 |
| Whole Module Optimization | 优化器可能看到整个 module 的 subclass |
| 封闭的 `internal` hierarchy | module 内可能证明没有其他 override |
| generic specialization | 具体类型信息可能让间接调用变为已知目标 |

这些是“可能提供证明”，不是“写了就保证生成某种指令”的性能合同。

### 11.3 去虚化后才更容易 inline

Inline 需要先知道要展开哪个函数体：

```text
virtual target 未知
→ 很难 inline 某个确定实现

去虚化得到确定 target
→ 如果函数体可见且成本模型允许
→ 可能 inline
```

Inline 后，编译器还可能：

- 常量传播；
- 删除分支；
- 消除临时值；
- 合并 ARC retain/release；
- 展开更多泛型；
- 删除整个无可观察效果的调用。

### 11.4 为什么可能不能去虚化

- receiver 从外部输入，动态类型未知；
- `open` hierarchy 允许外部 module 新增 subclass；
- binary framework 启用了 library evolution；
- 函数体或 class hierarchy 对 optimizer 不可见；
- 对象通过复杂控制流或存储逃逸；
- 需要保留动态替换点；
- 调用实际属于 Objective-C `dynamic` 路线；
- 优化级别未启用相应分析；
- 成本模型认为优化收益不足。

### 11.5 `@inlinable` 不是普通“加速按钮”

`@inlinable` 把函数体的一部分 ABI 可见实现暴露给 client optimizer，可能带来跨 module inline 和去虚化机会，但也扩大兼容合同。

它不能：

- 违反 class override 语义；
- 让未知的 `open` subclass 消失；
- 保证每个 client 都 inline；
- 替代正确的访问控制和 API 设计。

---

## 12. ARC、receiver lifetime 与调用

### 12.1 派发选择和所有权是正交维度

一次调用同时要回答两个问题：

```text
派发：调用哪个实现？
所有权：receiver 和参数在调用期间如何保持有效？
```

Vtable 只解释第一个问题。Class 实例由 ARC 管理，编译器会根据所有权约定插入或优化：

- retain；
- release；
- borrow；
- lifetime extension；
- closure capture storage。

不能写成：

```text
一次 vtable 调用 = 一次 retain + 一次 release
```

实际 ARC traffic 取决于调用约定、作用域、逃逸分析和优化结果。

### 12.2 Receiver 必须在本次使用期间有效

```swift
func invoke(_ worker: Worker) {
    worker.work()
}
```

语言保证 `worker` 在合法调用期间不会突然成为悬空对象。常见实现可以借用调用者已经持有的强引用，而不是每次调用都机械增加引用计数。

### 12.3 去虚化和 inline 可能帮助 ARC 优化

当实现体变得可见，优化器更容易证明：

- 某个 retain/release 可以配对消除；
- receiver 没有逃逸；
- 临时 closure 不需要分配；
- 某个对象生命周期可缩短或延后释放。

这仍是优化结果，不改变 ARC 对可观察对象生命周期的合同。

### 12.4 `weak` 与 `unowned`

- `weak` 不保持对象存活，访问时得到 Optional，目标销毁后自动变为 `nil`；
- `unowned` 不保持对象存活，并假定访问时对象仍然有效，假定失败会产生运行时错误；
- 成功获得有效 receiver 后，成员是否 override 仍由正常派发规则决定。

### 12.5 `deinit` 不是普通 override 方法

Subclass 可以声明自己的 `deinit`，Swift 会在销毁链中先执行 subclass 清理，再自动执行 superclass deinitializer。

虽然 ABI/SIL 的 class metadata 可能含有 destroy/deallocate entry，源语言不要求写：

```swift
override deinit
```

也不应把 `deinit` 当作应用层可以任意调用的普通 vtable 方法。

---

## 13. Class 与 Actor 的边界

Actor 和 class 都是 reference type，但它们回答不同问题：

| 能力 | Class inheritance | Actor isolation |
| --- | --- | --- |
| 主要问题 | 哪个 override 实现 | 哪个隔离域允许执行和访问状态 |
| subclass | class 可按规则继承 | actor 不能继承 class 或另一个 actor |
| 典型运行结构 | class metadata / vtable | actor isolation / executor |
| 调用可能要求 `await` | 普通同步 class 调用本身不要求 | 跨 actor 隔离访问通常要求 |

### 13.1 Actor 不是“带锁的 vtable class”

```swift
actor Counter {
    private var value = 0

    func increment() {
        value += 1
    }
}
```

`await counter.increment()` 的关键问题是先进入正确 actor 隔离域，而不是根据 subclass 选择 override。Actor 不能通过 class inheritance 建立本文的 override hierarchy。

### 13.2 Global-actor-isolated class 仍然是 class

```swift
@MainActor
class ViewModel {
    func refresh() {}
}
```

这里存在两层：

1. 隔离检查决定调用者是否已经在 `MainActor`，或是否需要 `await` 形成潜在 hop；
2. 如果 `refresh()` 位于可重写 class hierarchy 中，进入正确隔离域后仍遵守 class override 语义。

Swift 会检查 override 与基类声明的 isolation 是否兼容。Actor hop 和 vtable lookup 可能同时出现在一条调用链中，但二者不是同一种派发。

---

## 14. 与另外三条线路的逐层比较

### 14.1 语言语义层

| 线路 | 已选声明后，最终实现依据什么 |
| --- | --- |
| 直接/静态 | 目标已唯一，不保留运行时替换点 |
| **Class vtable** | receiver 的动态 class 类型 |
| Protocol witness | concrete type 的 protocol conformance |
| Objective-C message | receiver 的 Objective-C class + selector |

### 14.2 常见实现层

| 线路 | 常见结构 |
| --- | --- |
| 直接/静态 | 已知符号、函数引用或直接 inline |
| **Class vtable** | class metadata slot，跨 resilience 边界可能有 dispatch thunk |
| Protocol witness | witness table entry / witness thunk |
| Objective-C message | `objc_msgSend`、method cache/list |

### 14.3 优化层

| 线路 | 典型优化机会 |
| --- | --- |
| 直接/静态 | inline、常量传播 |
| **Class vtable** | 精确类型分析后去虚化，再 inline |
| Protocol witness | generic specialization 或 existential opening 后去虚化 |
| Objective-C message | Runtime cache 可加速查找；`dynamic` 明确限制 Swift inline/去虚化 |

### 14.4 Module / ABI 层

| 线路 | 跨边界的主要约束 |
| --- | --- |
| 直接/静态 | 函数体是否对 client 可见、符号兼容 |
| **Class vtable** | `open` hierarchy、vtable layout、dispatch thunk、library evolution |
| Protocol witness | conformance 可见性、witness layout、witness thunk |
| Objective-C message | selector 与 Objective-C Runtime 合同 |

### 14.5 所有权层

| 线路 | 所有权是否决定目标 |
| --- | --- |
| 直接/静态 | 否；所有权只保证值和参数有效 |
| **Class vtable** | 否；ARC 保证 receiver 有效，动态类型决定 override |
| Protocol witness | 否；existential/generic 容器的生命周期与 conformance 选择分开 |
| Objective-C message | 否；ARC 与 ObjC receiver 生命周期仍是另一层 |

---

## 15. 路线可以叠加，不一定只经过一张表

### 15.1 Witness thunk 再进入 class vtable

```swift
protocol Runnable {
    func run()
}

class BaseRunner: Runnable {
    func run() {
        print("base")
    }
}

class ChildRunner: BaseRunner {
    override func run() {
        print("child")
    }
}

func execute<T: Runnable>(_ runner: T) {
    runner.run()
}

execute(ChildRunner()) // child
```

源语言上：

1. `run()` 是 protocol requirement；
2. `BaseRunner: Runnable` 提供 conformance；
3. `ChildRunner` 继承该 conformance；
4. conformance 使用的 class 方法仍允许 override；
5. 最终必须表现为调用 `ChildRunner.run()`。

常见未优化实现可能是：

```text
generic call
→ protocol witness entry / witness thunk
→ class_method
→ ChildRunner.run
```

优化器也可能特化整个链，直接得到 `ChildRunner.run()`。

所以：

```text
“通过 protocol 调用”
不保证机器码只经过 witness table 而绝不接触 class vtable。
```

### 15.2 Swift class 与 Objective-C superclass

Swift class 可以继承 Objective-C class，并 override Objective-C 成员。这时某些成员属于 Objective-C message 路线，另一些 Swift-native 成员可能属于 Swift class 路线。

不能仅看“receiver 是 class”就断言所有成员都走同一种 Runtime。

### 15.3 Final 方法离开动态 override 线路

```swift
class MixedService {
    func replaceable() {}
    final func sealed() {}
}
```

同一个 class 上：

- `replaceable()` 保留 override 语义；
- `sealed()` 的目标不可被 subclass 替换。

派发线路属于**具体声明和调用上下文**，不是给整个类型永久贴一个标签。

---

## 16. 常见误区

### 误区 1：“只要是 class 方法，就一定查 vtable”

不准确。`final`、`static`、已知具体类型、Whole Module Optimization 和去虚化都可能让最终代码没有 vtable 间接调用；`dynamic` 则进入 Objective-C Runtime。

### 误区 2：“静态类型决定最终实现”

静态类型先决定可见声明和 overload；可重写声明的最终 override 由动态类型决定。

### 误区 3：“动态类型会参与 Swift overload resolution”

不会重新进行源代码级 overload resolution。Overload 在编译期根据静态信息完成；运行时只在已选 override family 中选择实现。

### 误区 4：“`super` 是另一个父类对象”

错误。`super` 对同一个 `self` 改变一次成员访问的查找起点。

### 误区 5：“调用一次 `super`，后续内部调用都固定在父类”

错误。Superclass 实现内部的 `self.someMember()` 仍可按真实动态类型派发。

### 误区 6：“只有 `func` 能 override”

错误。Property accessor、subscript、`class` type member 和某些 initializer 都有相应 override / required 规则。

### 误区 7：“Stored property 总是固定偏移直接访问”

错误。Class property 可以被 accessor override；跨 resilience 边界通常使用 accessor。只有在编译器拥有足够布局和语义信息时才可能直接访问存储。

### 误区 8：“Superclass initializer 调方法一定只会到 superclass”

错误。一旦初始化安全规则允许调用，可重写成员仍可能到达真实动态类型的 override。Subclass 的第二阶段定制此时可能尚未完成。

### 误区 9：“Closure 捕获了 Base 类型，所以只会调用 Base 实现”

错误。静态类型选择声明，closure 中有效 receiver 的动态类型仍参与 override 选择。

### 误区 10：“Vtable 派发本身负责对象生命周期”

错误。Vtable 负责实现选择；ARC/ownership 保证 receiver 生命周期。二者可能在同一调用中共同出现，但职责不同。

### 误区 11：“`@objc` 和 `dynamic` 完全相同”

错误。`@objc` 负责 Objective-C 可表示和暴露；`dynamic` 强制该成员访问使用 Objective-C Runtime。

### 误区 12：“`final` 应该为了性能到处添加”

不应先从微小派发成本倒推 API 语义。`final` 是继承合同：确认成员不应被扩展时使用。性能判断还要结合 profile、代码体积、模块边界和真实工具链。

### 误区 13：“间接调用一定是性能瓶颈”

一次 vtable lookup 通常只是系统成本的一小部分。I/O、分配、算法、cache locality、ARC traffic 和代码体积都可能更重要。先保持正确多态语义，再测量热点。

### 误区 14：“Actor 就是另一种 class vtable”

错误。Actor isolation 处理并发访问；class vtable 处理 inheritance override。Global-actor-isolated class 可以同时涉及两者。

---

## 17. 分析一个真实调用时的检查顺序

面对：

```swift
receiver.member(arguments)
```

按下面顺序分析：

1. `receiver` 的静态类型是什么？
2. 编译器通过名称查找和 overload resolution 选中了哪个声明？
3. 它是实例方法、type method、property accessor 还是 subscript accessor？
4. 声明是否属于 class inheritance hierarchy？
5. 是否允许 override：`final`、`static`、access level、module 边界如何？
6. 调用是否显式使用 `super`？
7. 是否其实通过 protocol requirement 进入？
8. 是否有 `@objc dynamic`，从而进入 Objective-C Runtime？
9. Receiver 的精确动态类型在调用点是否可证明？
10. 是否启用优化、WMO、library evolution？
11. 调用前是否还需 actor hop 或其他 isolation 检查？
12. Receiver 被谁持有：局部强引用、`weak`、closure capture、existential？
13. 未优化 SIL 表达什么？
14. 优化 SIL 是否去虚化或 inline？

这个顺序可以避免把：

- 编译期 overload；
- 运行时 override；
- ABI thunk；
- ARC；
- actor isolation；
- optimizer 结果

混成一个模糊的“动态调用”概念。

---

## 18. 线路摘要

Class vtable 派发的主干可以压缩为：

```text
receiver 具有静态 class 类型
→ 编译期完成名称查找和 overload resolution
→ 选中一个可重写声明族
→ 运行时使用 receiver 的动态 class 类型选择 override
→ 常见实现通过 class metadata / vtable slot
→ resilience 边界可能增加 dispatch thunk
→ 优化器若证明动态目标唯一，可去虚化并进一步 inline
→ ARC 独立保证 receiver 在合法使用期间有效
```

最重要的边界：

```text
override 行为是语言语义
vtable / thunk 是常见实现与 ABI 模型
去虚化 / inline 是优化结果
```

上一条线路：[直接/静态派发](01-direct-dispatch.md)。

下一条线路：[Protocol Witness Table 派发](03-protocol-witness-dispatch.md)。

---

## 19. 官方与一级资料

### Swift 语言语义

- [The Swift Programming Language — Inheritance](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/inheritance/)
- [The Swift Programming Language — Declarations](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/declarations/)
- [The Swift Programming Language — Methods](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/methods/)
- [The Swift Programming Language — Initialization](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/initialization/)
- [The Swift Programming Language — Properties](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/properties/)
- [The Swift Programming Language — Subscripts](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/subscripts/)
- [The Swift Programming Language — Access Control](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/accesscontrol/)
- [The Swift Programming Language — Closures](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/closures/)
- [The Swift Programming Language — Automatic Reference Counting](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/automaticreferencecounting/)
- [The Swift Programming Language — Deinitialization](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/deinitialization/)
- [The Swift Programming Language — Concurrency](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/)

### Swift ABI 与编译器实现

- [Swift.org — Library Evolution in Swift](https://www.swift.org/blog/library-evolution/)
- [Swift compiler — Writing High-Performance Swift Code](https://github.com/swiftlang/swift/blob/main/docs/OptimizationTips.rst)
- [Swift compiler — Type Metadata ABI](https://github.com/swiftlang/swift/blob/main/docs/ABI/TypeMetadata.rst)
- [SE-0193 — Cross-module inlining and specialization](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0193-cross-module-inlining-and-specialization.md)

这些实现资料用于理解当前编译器与 ABI。遇到具体二进制布局、SIL 指令或优化结果时，应以目标 Swift 工具链的实际输出为准。
