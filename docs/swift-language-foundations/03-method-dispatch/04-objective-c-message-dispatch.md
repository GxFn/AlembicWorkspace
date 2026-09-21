# Objective-C 消息派发线路

Objective-C 消息派发不是“Swift 调用 Objective-C”这么简单。它是一条完整的动态调用线路：

```text
Swift 声明通过 Objective-C 可表示性检查
→ 形成 Objective-C runtime 可识别的 selector 与入口
→ 调用点把 receiver、selector 和参数交给消息系统
→ runtime 根据 receiver 的动态 class 寻找 IMP
→ IMP 或 Swift/Objective-C thunk 执行真正的方法体
→ 返回值、错误和所有权按边界约定回到调用者
```

这条线路是 Swift 与 Cocoa 动态生态相接的基础。KVO、target-action、selector 形式的通知、Objective-C protocol、运行时方法替换等机制，都不是互不相关的“框架技巧”；它们共享同一根主干：

> 把“调用哪个实现”的决定保留为 `receiver + selector → IMP` 的运行时映射。

理解这条主干时必须同时保留三层：

| 层次 | 回答的问题 | 本文标记 |
| --- | --- | --- |
| 语言语义 | Swift 代码允许观察到什么行为？ | **语义层** |
| ABI 与 Runtime | 当前 Apple 工具链通常如何实现？ | **实现层** |
| 编译优化 | 编译器在不改变语义时能消掉什么？ | **优化层** |

`dynamic` 的派发保证属于语义层；`objc_msgSend`、method cache、`isa`、IMP 查找顺序属于实现层；某次构建是否生成某个 thunk 或汇编入口属于优化/代码生成结果。三者不能混写成一条永久不变的语言规则。

## 1. 这条线路解决什么问题

假设一个框架只保存两个值：

```text
target object
action selector
```

事件发生时，框架并不需要在编译自身时知道 target 的 Swift 具体类型。它只要在运行时询问：

```text
这个 receiver 当前对这个 selector 使用哪个实现？
```

这与另外三条派发线路的核心区别是：

- 直接派发在编译期已有唯一目标；
- Class vtable 派发以 Swift class 的动态类型和虚表槽位为核心；
- Protocol witness 派发以类型的 protocol conformance 和 requirement 为核心；
- Objective-C 消息派发以 receiver 的 Objective-C runtime class 和 selector 为核心。

“一个类型属于哪种派发”不是一个好问题。派发线路属于**一次调用边**，而不是属于整个类型：

```swift
final class ScreenController: NSObject {
    @objc dynamic func handleTap(_ sender: Any?) {
        let values = [1, 2, 3]       // Swift value / generic 线路
        print(values.count)          // 这里不因外层 @objc dynamic 而变成消息派发
    }
}
```

框架进入 `handleTap(_:)` 的那条边可以是 Objective-C 消息派发；方法体内部的 Array、generic、直接函数调用仍各走自己的线路。

## 2. Objective-C 可表示性：进入消息世界的第一道门

`@objc` 的核心作用不是“变慢”或“开启动态”，而是：

> 要求编译器为一个声明建立 Objective-C 能识别的名字、类型形状和 runtime 入口。

[Swift 语言参考的 Attributes 章节](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/attributes/)把 `@objc` 定义为让声明可从 Objective-C 使用。可表示性检查发生在编译期；不满足边界的声明不能只靠写一个 attribute 强行变成 Objective-C API。

### 2.1 Class、NSObject 与 runtime 身份

最常见的 Objective-C 可见 Swift 对象继承自 `NSObject` 或其他 Objective-C class：

```swift
import Foundation

class ImageLoader: NSObject {
    @objc func cancel() {}
}
```

这里有三个不同事实：

1. `ImageLoader` 是 Swift class；
2. 它继承 `NSObject`，因而自然处于 Cocoa 的对象、继承和 runtime 协议体系中；
3. `cancel()` 有 Objective-C 入口，因为它被标记为 `@objc`。

不要把它们压缩成“继承 NSObject 就全部动态”：

- `NSObject` 提供 Cocoa 根对象行为和 Objective-C runtime 身份；
- 普通 Swift 成员是否暴露给 Objective-C，仍由显式或推断的 `@objc` 决定；
- 即使有 Objective-C 入口，Swift 到 Swift 的调用也不一定被强制走消息派发；
- KVO 等具体 Cocoa 机制还会增加更严格的契约。

在 Apple Swift 中，整类导出、Objective-C subclassing 和生成 `ModuleName-Swift.h` 通常以 `NSObject`/Objective-C superclass 为边界。个别 Swift class member 可以拥有 Objective-C runtime 入口，但这不等于整个 Swift class 的全部类型能力都能在 Objective-C header 中表达。

### 2.2 继承 Objective-C class 会带来哪些推断

当 Swift class 继承 Objective-C 中定义的 class 时，一些 `@objc` 信息可由编译器推断。例如：

- override 一个 Objective-C method；
- 满足一个 `@objc protocol` requirement；
- 使用 `IBAction`、`IBOutlet`、`NSManaged` 等本身隐含 Objective-C 互操作的 attribute。

这解释了为什么 UIKit/AppKit subclass 中常见代码没有逐个写 `@objc`：

```swift
final class DetailController: UIViewController {
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
    }
}
```

`viewDidAppear(_:)` 覆盖的是 Objective-C 可见 superclass method，override 必须继续参加同一个 Objective-C 契约。

推断只减少语法，不删除边界。方法的参数、返回值、actor isolation 等仍必须满足互操作规则。

### 2.3 哪些 Swift 类型能过边界

可以用“Objective-C 是否有对应 ABI 形状”来理解，而不要死记类型清单：

| Swift 形状 | Objective-C 边界中的常见表达 | 关键限制 |
| --- | --- | --- |
| `NSObject` subclass / Objective-C class | object pointer | 最自然的消息 receiver |
| `String`、`Array`、`Dictionary`、`Set`、部分 Foundation value | `NSString`、`NSArray` 等桥接对象 | 桥接可能包装、分配或转换 |
| `Int`、`Bool`、浮点数等 | 对应 C/Objective-C 标量 | 精确宽度和 importer 规则仍重要 |
| `@objc enum` | 整数 raw-value enum | 不能携带 Swift associated value |
| `@objc protocol` | Objective-C protocol | 只能由 class 采用 |
| Objective-C compatible closure | block | 需要兼容的参数、结果和 escaping 约定 |
| `throws` | 返回约定加 `NSError **` | 是编译器/importer 适配，不是 Objective-C exception |
| `async` | completion-handler method | 是并发互操作 thunk，不表示 Objective-C 理解 `await` |
| 普通 Swift `struct` / `enum` | 通常不能作为 Objective-C 对象声明本身导出 | 被桥接成对象不等于成员可成为 selector |
| generic parameter、associated type、opaque type | 没有直接 Objective-C 泛型语义 | 通常要做 nongeneric façade 或类型擦除 |
| Swift-only tuple / function effect / ownership 特性 | 通常无直接对应 | 以当前编译器诊断为准 |

[Apple 的 Foundation 类型桥接说明](https://developer.apple.com/documentation/swift/working-with-foundation-types)列出了大量 Swift value 与 Foundation reference type 的映射。映射说明“值可以穿过边界”，不说明值类型本身突然获得 Objective-C method table。

### 2.4 Value type 被桥接，不等于 Value type 走消息派发

```swift
let swiftString: String = "hello"
let object = swiftString as NSString
object.lowercased
```

这里至少有两件事：

1. `String` 值被桥接为 Objective-C 对象表示；
2. 后续对 `NSString`/Foundation API 的调用可以进入 Objective-C 互操作线路。

但原始 `String` 的 Swift 方法不会因此全部改走 `objc_msgSend`。桥接改变了边界表示，不会重写 Swift value semantics。

同理：

```swift
let payload: Any = "hello"
```

Objective-C 的 `id` 在 Swift 中通常作为 `Any` 导入，runtime 可以在边界处桥接对象和值；调用者仍应先理解或检查具体类型，而不是把 `Any` 当成一个无条件动态消息 receiver。[Apple 的动态对象说明](https://developer.apple.com/documentation/swift/handling-dynamically-typed-methods-and-objects-in-swift)专门说明了 `id`、`Any` 与桥接转换的关系。

## 3. `@objc` 与 `dynamic`：入口可见性和派发保证必须分开

这是本线路最重要的分界。

```swift
import Foundation

class Renderer: NSObject {
    @objc func exposed() {
        print("Objective-C can see this entry")
    }

    @objc dynamic func runtimeSelected() {
        print("Swift access must preserve Objective-C runtime dispatch")
    }
}
```

### 3.1 `@objc`：建立 Objective-C 入口

`@objc` 表示：

- 声明有 Objective-C 可识别的名字；
- 参数和结果可被 Objective-C ABI 表达或由编译器适配；
- Objective-C 调用者、selector API 或 runtime 可以找到对应入口；
- 编译器可能生成 Objective-C-to-Swift thunk。

它**不单独保证**所有 Swift 调用点都必须通过 Objective-C runtime 查找目标。对静态信息充分的 Swift 调用，编译器仍可能采用 Swift class/直接线路并进行相应优化，同时保留供 Objective-C 使用的入口。

可以把它想成“一扇门被建出来了”，而不是“所有人必须从这扇门走”。

### 3.2 `dynamic`：要求访问保留 Objective-C runtime 动态性

[Swift 语言参考的 Declarations 章节](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/declarations/)对 `dynamic` 给出更强的保证：

- 它只能用于 Objective-C 可表示的 class member；
- 对这个 member 的访问使用 Objective-C runtime 动态派发；
- 编译器不会对该访问 inline 或 devirtualize。

现代编译器可以因 `dynamic` 推断 `@objc`，但在讲解边界或依赖 Cocoa runtime 的代码中显式写成 `@objc dynamic` 更清楚：

```swift
class ObservableModel: NSObject {
    @objc dynamic var status: NSString = "idle"
}
```

### 3.3 对比表

| 问题 | `@objc` | `dynamic` |
| --- | --- | --- |
| Objective-C 是否能识别声明 | 是 | 必须可识别，编译器可推断 `@objc` |
| 是否建立 selector/runtime entry | 是 | 是 |
| 是否强制 Swift 访问保留 ObjC runtime 派发 | 否 | 是 |
| 是否禁止该访问被 inline/devirtualize | 否，不单凭 `@objc` | 是 |
| 典型用途 | Objective-C 调用、target-action、delegate requirement | KVO、运行时替换、必须拦截 Swift 调用 |

### 3.4 `@objcMembers`、`@nonobjc` 与相关 attribute

`@objcMembers` 是批量暴露工具，不是批量 `dynamic`：

```swift
@objcMembers
class LegacyFacade: NSObject {
    var title: String = ""

    @nonobjc
    func swiftOnly<T>(_ value: T) {}
}
```

要点：

- `@objcMembers` 扩大可推断的 Objective-C 可见成员；
- 不可表示的成员仍不能凭它穿过边界；
- `@nonobjc` 可以显式阻止某个成员形成 Objective-C entry；
- 它不会自动赋予 KVO 所需的 runtime 派发保证。

其他常见入口：

- `IBAction`：让 Interface Builder/target-action 识别 action，隐含 Objective-C 可见性；
- `IBOutlet`：把连接暴露给 Objective-C/Cocoa 工具链；
- `NSManaged`：声明实现和存储由 Core Data 在运行时提供，并隐含 `@objc`；
- override Objective-C method：继承原有 selector 契约。

这些 attribute 各自表达框架合同，不能全部简化成“它们等于 dynamic”。

## 4. 消息的三个核心量：receiver、selector、IMP

Objective-C 消息派发可以压缩为：

```text
(receiver, selector) → IMP
```

参数和返回值不消失；它们按该 selector 对应声明的 ABI 一起传递。这个公式只突出“实现选择”的两个动态输入。

### 4.1 Receiver

receiver 是接收消息的对象：

```swift
let controller: AnyObject = NSObject()
```

**语义层**关心它当前是什么对象、能否响应 selector。

**实现层**中，Objective-C object 持有通往其 runtime class 的信息；传统解释把它称为 `isa`。现代 runtime 对 `isa` 的位布局可以压缩、编码或随架构变化，因此：

```text
对象能够让 runtime 找到动态 class
```

是稳定的理解；

```text
对象首字永远是一个未经编码的普通 Class 指针
```

不是应当写入业务逻辑的永久假设。

### 4.2 Selector

selector 是 Objective-C method 的运行时名字：

```swift
class RenderController: NSObject {
    @objc dynamic var isEnabled = true

    @objc
    func render(_ name: NSString, quality: Double) {}
}
```

它可形成类似：

```text
render:quality:
```

冒号属于 selector 名称的一部分，并反映参数位置。selector 不是 Swift generic function type，也不携带 Swift overload system 的全部信息。

Swift 用 `#selector` 在编译期检查引用：

```swift
let action = #selector(RenderController.render(_:quality:))
```

属性 accessor 也有 selector：

```swift
let getter = #selector(getter: RenderController.isEnabled)
let setter = #selector(setter: RenderController.isEnabled)
```

[Swift 语言参考的 Expressions 章节](https://docs.swift.org/swift-book/ReferenceManual/Expressions.html)明确说明 `#selector` 在编译期创建，编译器会检查目标声明存在且已暴露给 Objective-C runtime。

与之相对，运行时由字符串构造 selector 会把拼写和存在性错误推迟到运行期：

```swift
let selector = NSSelectorFromString("render:quality:")
```

只有确实来自配置、插件或 Objective-C 动态协议时，才应主动承担这种风险。

### 4.3 IMP

IMP 是 method implementation 的函数指针表示。

从实现模型看，Objective-C method body 像一个至少接收两个隐藏参数的函数：

```text
self
_cmd
```

- `self` 是 receiver；
- `_cmd` 是当前 selector；
- 其后才是源代码声明的参数。

runtime 找到 IMP 后，按调用点已知的 ABI 形状把 receiver、selector 和其余参数交给实现。selector 名字本身不是完整类型安全证明；method metadata 还有 type encoding，而调用点必须使用匹配的参数和返回约定。

这也是手动替换 IMP 最危险的地方：

```text
selector 名字相同
≠
两个函数在寄存器、返回值、ARC 所有权上 ABI 兼容
```

Apple 的 [class_getMethodImplementation](<https://developer.apple.com/documentation/objectivec/class_getmethodimplementation(_:_:)>)
返回“若向该 class 实例发送 selector 时将调用的函数指针”，但也提醒返回值可能是
runtime forwarding machinery，而不一定是某个普通方法体。

### 4.4 Class method 与 Metaclass

Objective-C class 本身也是消息 receiver。实例方法在普通 class 的 method 体系中查找；class method 则通过 metaclass 体系查找。

源代码中的：

```swift
class Factory: NSObject {
    @objc
    class func makeDefault() -> Self {
        self.init()
    }

    required override init() {
        super.init()
    }
}
```

并不是一个脱离 runtime 的静态 C 函数。它对应向 class object 发送 selector 的模型。

## 5. 从 Swift 源码到 IMP：完整调用链

以这段代码为例：

```swift
import Foundation

class RuntimeRenderer: NSObject {
    @objc dynamic func render(_ name: NSString) -> NSString {
        "rendered: \(name)" as NSString
    }
}

let renderer = RuntimeRenderer()
let result = renderer.render("cover")
```

### 5.1 编译期：先解决 Swift 问题

在进入消息系统以前，编译器已经完成：

1. 名称查找：找到 `RuntimeRenderer.render(_:)`；
2. 重载解析：根据 label、参数静态类型和上下文选中该声明；
3. 可表示性检查：`RuntimeRenderer`、`NSString` 和方法形状可进入 Objective-C；
4. selector 形成：为方法建立 Objective-C runtime 名；
5. entry 生成：必要时生成 Swift/Objective-C calling convention 之间的 thunk；
6. 派发约束：`dynamic` 要求该访问保留 Objective-C runtime 选择。

所以，消息派发不负责 Swift overload resolution。runtime 接到 selector 时，Swift 编译期重载选择早已结束。

### 5.2 调用点：准备 Objective-C ABI

调用点需要：

- 保证 receiver 在调用期间有效；
- 把 Swift 参数桥接或转换为 Objective-C ABI 形状；
- 按声明选择正确的参数寄存器、返回值和所有权约定；
- 准备 receiver 与 selector；
- 进入 Objective-C messaging entry。

如果参数本来就是 Objective-C object reference，边界较薄；如果是 `String`、Array 或 error，可能需要桥接或适配。

### 5.3 Runtime 快路径：按 class cache 查 selector

**常见实现层**可画成：

```text
receiver
→ 找到 receiver 的动态 runtime class
→ 用 selector 查询该 class 的 method cache
→ cache hit：得到 IMP
→ 跳转到 IMP
```

Apple 的 [`objc_cache` 文档](https://developer.apple.com/documentation/objectivec/objc_cache)把 cache 描述为最近使用 method definition 的指针缓存，用来减少重复扫描 method list。

cache 是 lookup 的加速层，不是语义存储：

- cache miss 不等于方法不存在；
- swizzling/runtime mutation 需要 runtime 正确维护或失效相关 cache；
- “第二次调用可能更快”不是业务代码可依赖的正确性条件。

### 5.4 Runtime 慢路径：方法列表、父类、动态解析和转发

cache miss 后，当前 Apple runtime 的解释模型大致是：

```text
查当前 class 的 method metadata
→ 沿 superclass 链查找
→ 给 class 动态补充实现的机会
→ 进入消息转发
→ 最终仍无人处理则报 doesNotRecognizeSelector 类错误
```

Apple 公开的 [objc4 runtime 源码](https://github.com/apple-oss-distributions/objc4)展示了 cache lookup、class/superclass method lookup、resolver 和 forwarding 的实现；[Objective-C Runtime Programming Guide 的 Messaging 章节](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtHowMessagingWorks.html)给出了同一模型的概念说明。

必须标明：

- 这是 Apple Objective-C runtime 的实现线路；
- 具体函数名、cache 布局、锁和汇编会随 OS、架构与 runtime 版本变化；
- Swift 语言保证的是 `dynamic` 访问保留 Objective-C runtime 动态行为，不保证每台机器都出现完全相同的一串内部函数。

### 5.5 IMP 执行：可能先经过 thunk

找到的 IMP 可能是：

- Objective-C 实现本身；
- Swift 为 `@objc` member 生成的 Objective-C entry thunk；
- framework/runtime 动态提供的实现；
- forwarding 入口。

若它是 Swift thunk，典型职责包括：

```text
接收 Objective-C ABI 参数
→ 恢复/桥接为 Swift 值
→ 调用 Swift calling convention 的方法体
→ 把 Swift 结果、Error 或异步 completion 适配回 Objective-C
```

“Objective-C 调用了 Swift”通常不是 runtime 直接理解全部 Swift ABI，而是编译器生成的边界代码完成翻译。

### 5.6 返回与销毁

方法完成后：

- 普通结果按 ABI 返回；
- bridged value 转回调用点需要的 Swift 表示；
- `throws` 可能通过 `NSError` 约定适配；
- `async` 通过 completion handler 恢复 Swift continuation 或向 Objective-C callback 交付结果；
- ARC 清理调用期间产生的强引用和临时 bridge object。

因此，消息派发的真实成本不只是一趟 selector cache lookup。边界桥接、对象生命周期、错误适配和方法体算法往往更重要。

## 6. `objc_msgSend`：强大的实现入口，不是 Swift API 设计工具

Objective-C 编译器传统上把 message expression 转成 messaging function 调用；简单返回场景的代表是 `objc_msgSend`。

可以用伪代码理解：

```text
objc_msgSend(receiver, selector, arguments...)
→ lookup IMP
→ 以原调用 ABI 跳转到 IMP
```

但不要据此在 Swift 业务代码里手动调用 `objc_msgSend`：

- Apple 的 Runtime Guide 明确建议由编译器生成 messaging call；
- 不同参数和返回类型有不同 ABI；
- 错误的函数指针 cast 会让参数进入错误寄存器或破坏返回值；
- ARC 需要知道精确所有权约定；
- 不同架构和 runtime 可以使用不同消息入口或 stub。

在教学中写 `objc_msgSend(receiver, selector)` 是线路抽象，不是推荐代码。

### 6.1 Cache hit 为何仍是动态派发

cache hit 后 runtime 很快得到 IMP，但选择依据仍是：

```text
receiver 的动态 class + selector
```

所以：

```text
runtime cache
≠
编译器去虚化
```

前者每次仍尊重 runtime 可变映射；后者是在编译期证明目标固定后绕过动态选择。`dynamic` 明确禁止后一种消除访问动态性的优化。

### 6.2 `super` 不是“给另一个对象发消息”

```swift
class Base: NSObject {
    @objc dynamic func run() {}
}

class Child: Base {
    override func run() {
        super.run()
    }
}
```

`super.run()` 中的 receiver 仍是当前 `self`。变化的是 method lookup 的起点：

```text
普通 self message：从 receiver 的动态 class 开始找
super message：从当前实现所定义 class 的 superclass 开始找
```

Objective-C runtime 通常用专门的 super messaging 路径表达这一点。把 `super` 误解成 superclass object，会破坏对 override、状态和二次动态调用的理解。

### 6.3 消息发给 `nil`

Objective-C 允许向 `nil` receiver 发送消息，并对常见返回形状给出零值式行为。Swift 的主要模型不同：

- 非 Optional reference 不能是 `nil`；
- Optional chaining 显式描述“没有 receiver 时跳过调用”；
- Swift `nil` 是某个 Optional 没有值，不是通用空 object pointer。

不要把 Objective-C 的 nil messaging 当成 Swift Optional 的实现解释。跨边界的 implicitly unwrapped optional、旧 API nullability 不完整等情况更应该补足类型和 guard，而不是依赖消息吞掉错误。

## 7. Inheritance 与 Override 如何挂到消息主干

### 7.1 Override 继承的是 selector 契约

Objective-C superclass 已定义的 method 在 Swift subclass 中 override 时：

```swift
class TrackingViewController: UIViewController {
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        // ...
    }
}
```

subclass implementation 必须与 superclass method 保持兼容的 Objective-C 签名。runtime 查同一 selector 时，receiver 的动态 class 决定先看到 subclass IMP 还是继续向 superclass 查找。

概念链：

```text
静态声明：UIViewController.viewWillAppear:
→ receiver 动态类型：TrackingViewController
→ selector：viewWillAppear:
→ subclass method entry
→ Swift thunk/body
```

### 7.2 Swift vtable 与 ObjC message 可以同时存在

一个 Swift class method 可以同时拥有：

- Swift class dispatch 所需的 entry；
- Objective-C runtime entry；
- 二者之间的 thunk。

因此，看到 override 或 `@objc` 不能只凭源码断言“机器码只有一张表”。要问的是当前调用边：

```text
它从 Swift 静态调用进入？
还是从 selector/Objective-C caller 进入？
它是否标记 dynamic？
```

当需要 swizzling、KVO 或其他 runtime 替换对 Swift 调用也可观察时，`dynamic` 才是明确的语义信号。

### 7.3 `final` 只关闭 Swift subclass override，不自动关闭 runtime 合同

`final` 表达“不允许 Swift subclass override”。如果一个 member 同时是 `dynamic`，它仍要求访问通过 Objective-C runtime。

这在 KVO 一类动态 subclass/方法替换机制中尤其重要：

```text
源码层无法 override
≠
runtime mapping 绝对不可变化
```

不要用 `final` 推导“可以忽略 `dynamic`”。

### 7.4 Swift extension 不能用来 override

Swift extension 可以增加成员和 conformance，但不能 override 既有成员。Objective-C category 能向 runtime class 附加 method 的历史能力，不应反向套成“Swift extension 就是 category，因而可以随意替换”。

两者表面相似，语言规则和冲突处理并不相同。

## 8. `@objc protocol`：Protocol 知识如何附着到消息线路

原生 Swift protocol requirement 通常由 witness 线路解释；`@objc protocol` 则是 Objective-C 消息模型的一部分。

```swift
import Foundation

@objc protocol RefreshDelegate: AnyObject {
    func didRefresh(_ value: NSString)

    @objc optional
    func shouldRetry(_ error: NSError) -> Bool
}

func notify(
    _ delegate: any RefreshDelegate,
    value: NSString,
    error: NSError
) {
    delegate.didRefresh(value)
    let retry = delegate.shouldRetry?(error) ?? false
    print(retry)
}
```

### 8.1 `@objc protocol` 的边界

[Swift Book 的 Protocols 章节](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/protocols/)明确规定：

- optional requirement 是为 Objective-C 互操作提供的；
- protocol 和 optional requirement 都必须是 `@objc`；
- `@objc protocol` 只能由 class 采用，struct 和 enum 不能采用。

此外，`@objc protocol` 不能继承一个非 `@objc` protocol，因为 Objective-C runtime 无法表达后者的完整 Swift requirement 体系。

### 8.2 Required requirement

对 required `@objc` requirement：

```text
existential receiver
→ selector didRefresh:
→ receiver runtime class 查找 IMP
→ 调用 conforming class 的实现
```

编译器仍可能生成 conformance metadata 或 thunk 来连接 Swift 类型系统，但实现选择的关键运行时输入是 receiver 和 selector，不是原生 Swift witness table slot。

### 8.3 Optional requirement

`optional` 不等于“返回 Optional”。它表示**这个方法入口可能不存在**。

因此：

```swift
delegate.shouldRetry?(error)
```

包含两层语义：

1. 检查 receiver 是否有该 selector 的实现；
2. 若有，发送消息；若无，结果为 `nil`。

整个 function value 被视为 Optional，而不是把 `Bool` requirement 改写成 `Bool?` 声明。

这条线路解释了 Cocoa delegate 中大量：

```swift
delegate.optionalCallback?(...)
```

的根本原因。

### 8.4 何时不该为了 optional 而选 `@objc protocol`

纯 Swift 代码常可用：

- required requirement + protocol extension 默认实现；
- capability 拆分；
- Optional closure；
- enum/associated value；
- generic constraint。

它们保留 Swift 的 value type、associated type、Sendable 和静态检查能力。只有真正需要 Objective-C interoperability、selector presence 或 Cocoa delegate contract 时，`@objc optional` 才是自然选择。

## 9. Property 不是字段：Getter/Setter 也走消息

Objective-C property 的动态表面由 accessor method 构成：

```swift
class PlaybackState: NSObject {
    @objc dynamic var isPlaying: Bool = false
}
```

概念上至少有：

```text
getter selector：isPlaying
setter selector：setIsPlaying:
```

读取和写入分别是两个可派发调用：

```text
state.isPlaying
→ receiver + getter selector
→ getter IMP

state.isPlaying = true
→ receiver + setter selector + newValue
→ setter IMP
```

### 9.1 Stored property 与 accessor

`isPlaying` 在 Swift 中可以有 backing storage，但 Cocoa 动态机制拦截的是 accessor 线路，不是“直接观察一块内存”。

由此得到：

- KVO 要求修改经过兼容 accessor 或显式通知线路；
- 绕过 accessor 的底层 ivar 写入不会自动等同于 setter message；
- property observer、computed property 和 runtime replacement 要按生成的 accessor 分析。

### 9.2 自定义 Objective-C getter 名

Swift 可以给 accessor 指定 Objective-C 名：

```swift
class Feature: NSObject {
    @objc var enabled: Bool {
        @objc(isEnabled) get { true }
    }
}
```

这样 Swift property 名、Objective-C getter selector 和 runtime 名可能不同。KVC/KVO、selector、generated header 关心的是 Objective-C 侧名字合同。

### 9.3 Swift KeyPath 与 Objective-C key path

不要混淆：

- `KeyPath<Root, Value>`：带 Swift Root/Value 类型信息；
- `#keyPath(...)`：编译器检查后产生 Objective-C 字符串 key path；
- selector：method/accessor 的 Objective-C runtime 名。

KVC 用 key/key path 间接访问 accessor；KVO 在其上提供变化通知；二者都依赖 Objective-C 可见属性，但并不是同一种数据结构。

## 10. KVO：以动态 Setter 为拦截点

Apple 的 [Using Key-Value Observing in Swift](https://developer.apple.com/documentation/swift/using-key-value-observing-in-swift)给出明确合同：

- 被观察对象的 class 继承 `NSObject`；
- 被观察 property 标记 `@objc dynamic`。

```swift
class DownloadState: NSObject {
    @objc dynamic var progress: Double = 0
}
```

### 10.1 KVO 的主干线路

```text
观察注册
→ runtime 为目标 property 建立观察机制
→ 写入 progress
→ dynamic setter 必须经 ObjC runtime 派发
→ KVO 拦截/包装 setter 行为
→ 发送 before/after change
→ observer 收到变化
```

如果 Swift 编译器把 setter 静态绑定或 inline，runtime 就没有稳定拦截点。这正是 KVO 要求 `dynamic`，而不只要求 `@objc` 的原因。

### 10.2 isa-swizzling 是实现说明，不是业务合同

Apple 的历史 [KVO Implementation Details](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/KeyValueObserving/Articles/KVOImplementation.html)说明 automatic KVO 使用 isa-swizzling：为被观察对象建立动态 subclass，并改变对象查找 class 的运行时路径。

应这样分层：

- **语义层**：符合 KVO 的 property change 会通知 observer；
- **实现层**：Apple 的 automatic KVO 使用动态 subclass/isa-swizzling；
- **禁区**：业务代码不能依赖动态 subclass 的私有名字、精确层数或 raw `isa` 布局。

这也解释了为什么用底层 runtime API判断“对象真正是什么 class”容易与 KVO 冲突。业务类型判断应使用框架公开行为。

### 10.3 KVO 风险边界

- 观察 token 生命周期必须覆盖需要观察的区间；
- property 必须按 KVO-compatible 线路变化；
- 在 observer callback 中再次写属性要考虑递归和状态机；
- 多线程通知和 UI actor 约束不能由 Objective-C runtime 自动补齐；
- Swift Observation、Combine 或 actor-isolated state 可能更适合纯 Swift 新代码，但不能假定它们与既有 Cocoa KVO 合同完全等价。

## 11. Target-Action：把 receiver 与 selector 存起来，稍后发消息

Target-action 是消息主干最直观的框架化形式：

```swift
final class PlayerController: UIViewController {
    private let button = UIButton(type: .system)

    override func viewDidLoad() {
        super.viewDidLoad()

        button.addTarget(
            self,
            action: #selector(playTapped(_:)),
            for: .touchUpInside
        )
    }

    @objc
    private func playTapped(_ sender: UIButton) {
        // ...
    }
}
```

线路是：

```text
注册时：
target = self
selector = playTapped:

事件发生时：
UIControl 取得 target + selector
→ 检查/选择 receiver
→ 发送 Objective-C action message
→ Swift @objc thunk
→ playTapped 的 Swift body
```

这里 `@objc` 通常已经足够，因为真正调用者是 framework 的 selector 入口。只有还要求 Swift 直接调用也能被 runtime replacement 拦截时，才需要进一步讨论 `dynamic`。

[Apple 的 UIControl.addTarget 文档](<https://developer.apple.com/documentation/uikit/uicontrol/addtarget(_:action:for:)>)
还给出两个重要合同：

- action selector 必须符合 UIControl 允许的方法签名；
- control 不强持有 target，调用方负责 target 在需要期间存活。

### 11.1 `#selector` 只检查声明，不检查未来对象生命周期

编译器能验证：

- 方法存在；
- 方法暴露给 Objective-C；
- overload 引用能否消歧。

编译器不能从 selector 本身保证：

- target 事件发生时仍存活；
- framework 将在期望线程/actor 调用；
- 注册和移除生命周期正确；
- selector 与一个动态字符串协议永远一致。

消息系统解决的是“找到实现”，不是所有权和并发正确性。

### 11.2 Target 为 `nil` 时的 responder chain

UIKit/AppKit 的部分 target-action API 允许 target 为 `nil`，由 framework 在 responder chain 中寻找能响应 selector 的对象。

这又增加一层动态选择：

```text
先动态选择 receiver
→ 再由 receiver + selector 动态选择 IMP
```

不要把 responder-chain 查找误认为 `objc_msgSend` 本身的 superclass lookup；前者在框架层寻找 target，后者在 runtime 层为已选 receiver 寻找 method。

## 12. Notification：只有 Selector 变体挂在这条线路上

经典 NotificationCenter observer：

```swift
extension Notification.Name {
    static let didUpdate = Notification.Name("didUpdate")
}

final class NotificationObserver: NSObject {
    override init() {
        super.init()

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleNotification(_:)),
            name: .didUpdate,
            object: nil
        )
    }

    @objc
    private func handleNotification(_ notification: Notification) {
        // ...
    }
}
```

线路：

```text
NotificationCenter 按 name/object 找 observer entry
→ 取得 observer + selector
→ 向 observer 发送 selector message
→ Objective-C entry / Swift thunk
```

[Apple 的 selector observer 文档](https://developer.apple.com/documentation/foundation/notificationcenter/1415360-addobserver)明确规定 selector 对应 method 接收一个 `NSNotification` 参数。

但是，以下 Notification API 不应强行解释成 selector 派发：

- closure observer；
- Combine publisher；
- `AsyncSequence`；
- 新 SDK 中的 typed NotificationCenter message。

它们可能在内部仍使用 Foundation 对象，但它们对用户暴露的是 closure、subscription 或 async iteration 合同。派发分析必须跟随**实际调用边**，不能因类型叫 `NotificationCenter` 就一律归类为 Objective-C message。

## 13. Swizzling：改变 `selector → IMP` 映射

Method swizzling 的本质不是“交换两个 Swift 函数名”，而是修改 runtime class 中 selector 与 IMP 的关联。

常见概念操作：

```text
找到 Class
→ 找到 selector A / selector B 的 Method metadata
→ 交换或替换 IMP
→ runtime 维护相关 lookup/cache 状态
→ 后续 message send 观察到新映射
```

Objective-C runtime 提供 `method_setImplementation`、`method_exchangeImplementations` 等 API。这说明 runtime mutation 是一项能力，不说明任意 swizzling 都是稳定框架合同。

### 13.1 Swizzling 为什么要求调用真的经过消息线路

如果 Swift 调用点已经：

- 直接绑定目标；
- 使用 Swift vtable；
- 被 inline；

那么只改 Objective-C selector 的 IMP 映射不一定影响该调用。

因此，若一个 API 的设计确实要求 runtime replacement 对 Swift 调用可见，应由 `dynamic` 明确保留消息派发，而不是碰巧依赖某个 debug build 的代码生成。

### 13.2 正确性风险

Swizzling 至少要同时满足：

- selector 的参数和返回 ABI 完全兼容；
- `self`、`_cmd` 与所有权约定正确；
- 安装只发生一次，顺序确定；
- 与 superclass、其他 framework/category/swizzle 不冲突；
- 不因递归调用错误进入无限循环；
- runtime mutation API 正确处理 cache；
- 目标 selector 是允许依赖的公开合同。

### 13.3 工程风险

- 作用域通常是进程内整个 class，而不是某一个调用点；
- 多个模块替换同一 selector 时结果依赖加载/安装顺序；
- OS 升级可能改变私有实现；
- KVO 动态 subclass、Core Data、proxy/forwarding 可能让 class 结构不同于直觉；
- 测试如果只覆盖“安装成功”，而不覆盖重复安装、继承链和移除场景，风险会被隐藏。

优先顺序通常应是：

```text
公开 extension point / delegate / composition
→ subclass override
→ wrapper / forwarding
→ 确有 runtime 合同且风险可验证时才考虑 swizzling
```

## 14. Bridge 与 ARC：消息找到 IMP 后，值仍要安全过边界

消息派发只回答“哪个实现”。参数、返回值和对象生命周期由 ABI、bridge 与 ARC 共同保证。

### 14.1 Swift value 与 Foundation object 的桥接

常见映射：

```text
String      ↔ NSString
Array       ↔ NSArray
Dictionary  ↔ NSDictionary
Set         ↔ NSSet
Int 等      ↔ NSNumber（对象上下文）
Error       ↔ NSError
```

桥接可能：

- 复用已有对象；
- 建立 wrapper；
- 延迟转换；
- 复制元素；
- 在向下转换时失败。

所以性能分析不能只数 `objc_msgSend`。一个 Array 跨边界的元素 bridge 可能远大于 selector lookup。

### 14.2 ARC 在两侧都工作，但边界约定不能猜

普通 Objective-C interoperable object reference 会由 ARC 管理。编译器根据声明插入必要的 retain/release，并遵循 Objective-C method family 与参数 ownership 约定。

重要区分：

```text
ARC 自动管理
≠
对象一定没有 cycle
≠
手写 IMP cast 可以忽略 ownership
```

若手动把错误函数签名当成 IMP：

- 返回对象可能被按错误 ownership 接收；
- 标量/结构体可能从错误位置读取；
- `NSError **`/out parameter 可能破坏内存；
- block 的复制和生命周期可能错误。

### 14.3 `Unmanaged` 与 autoreleasing out parameter

`Unmanaged<T>` 表示调用者需要参与未由普通 ARC 平衡的对象引用传播。[Apple 的 Unmanaged 文档](https://developer.apple.com/documentation/swift/unmanaged)强调使用者要部分负责对象存活。

它适用于明确的 Core Foundation/C/Objective-C ownership 边界，不是让普通消息发送“更快”的工具。

`AutoreleasingUnsafeMutablePointer` 常出现在 Objective-C object out parameter 的 importer 形状中，例如历史 `NSError **` 模式。Swift 通常通过 `throws`、`inout` 或 importer 自动适配，业务代码不应无理由退回裸指针。

### 14.4 Closure 与 Block

Objective-C-compatible closure 通过 block 表示。跨边界时要继续分析：

- block 是否 escaping；
- 捕获对象是否形成 cycle；
- callback 在哪个 queue/thread 发生；
- Swift closure 的 actor isolation/`Sendable` 信息是否在 Objective-C 签名中丢失。

消息派发成功只表示 callback entry 被找到，不表示 callback 的并发和生命周期自动正确。

## 15. `throws`、`async` 与 Actor：不能简单写成“不支持”

Objective-C 没有 Swift 的 typed throws、`await`、Task 和 actor isolation，但 Swift 编译器可以通过 API 形状转换建立互操作。

### 15.1 `throws` 通常适配为 `NSError`

Objective-C Cocoa API 常用：

```text
返回成功值/BOOL + NSError **
```

Swift importer 可把它呈现为 `throws`。反向导出 Swift `@objc throws` method 时，编译器也建立对应 Objective-C error 约定。

这不是把 Objective-C exception 变成 Swift Error。`NSException` 仍主要代表 Objective-C programmer error，不应当作 Swift `do/catch` 的普通业务错误线路。

### 15.2 `async` 可以 `@objc`，但通过 completion-handler thunk

[SE-0297: Concurrency Interoperability with Objective-C](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0297-concurrency-objc.md)和 Apple 的 [Calling Objective-C APIs Asynchronously](https://developer.apple.com/documentation/swift/calling-objective-c-apis-asynchronously)定义了双向适配：

- 符合约定的 Objective-C completion-handler method 可作为 Swift `async` method 导入；
- Swift `@objc async` method 可作为 Objective-C completion-handler method 导出。

```swift
class Catalog: NSObject {
    @objc
    func fetchTitle() async throws -> NSString {
        "Swift" as NSString
    }
}
```

概念上导出为：

```text
Objective-C selector + completion handler
→ Swift-generated ObjC entry
→ 建立 Swift asynchronous task/call
→ await 方法体
→ 成功时 callback(value, nil)
→ 失败时 callback(nil, NSError)
```

关键结论：

> Objective-C 消息派发只负责选择异步方法的入口；后续 suspension、executor hop 和 continuation 属于 Swift concurrency 线路。

不要写成：

```text
async method 的每个 await 都通过 objc_msgSend
```

这是错误的。

### 15.3 Actor 的 Objective-C 边界

当前 Swift 语言参考规定，actor member 只有在以下情形可标记 `@objc`：

- member 是 asynchronous；
- 或 member 是 nonisolated。

原因是 Objective-C 不理解 actor-isolated synchronous access，无法在 selector 签名中证明调用已处于正确 isolation domain。

即使 method 能导出：

- Objective-C caller 仍看不到 Swift `Sendable` 的全部静态保证；
- callback queue 不自动等于某个 actor；
- UI/MainActor 合同需要 annotation/importer/runtime check 共同维护；
- 不能因入口是 `@objc async` 就跳过 data-race 检查。

### 15.4 Generic 与 opaque/associated type 的边界

Objective-C selector 不携带 Swift generic specialization 信息。如下 API 不能直接成为普通 Objective-C method contract：

```swift
protocol SwiftLoader {
    func load<T: Decodable>(_ type: T.Type) async throws -> T
}
```

常见边界设计是建立 nongeneric façade：

```swift
final class UserObject: NSObject {}

final class ObjectiveCLoader: NSObject {
    @objc
    func loadUser(
        completion: @escaping (UserObject?, NSError?) -> Void
    ) {
        // 把内部 generic/async 结果适配到这个 Objective-C 形状。
    }
}
```

或使用 Objective-C class/protocol/type-erased object 表达。

注意一个细节：当前编译器可能允许在 generic Swift class 的有限 member 上生成某些 Objective-C runtime entry，但 Objective-C header 无法表达完整 Swift generic class 语义。API 设计不能把“某个工具链接受 attribute”误当成“Objective-C 获得了 Swift 泛型模型”。

### 15.5 Value type 的边界

普通 Swift `struct`/associated-value `enum` 不能作为 Objective-C message receiver 暴露成员：

```swift
struct Coordinate {
    // @objc func move() {} // 不属于可导出的 class member 形状
}
```

可以选择：

- 用 `NSObject` wrapper；
- bridge 为 Foundation object；
- 暴露 C-compatible value；
- 在纯 Swift 边界保留 value type。

选择 wrapper 会改变 identity、ARC 和 mutation 模型，不能只把它当成语法修复。

## 16. Framework 机制在同一主干上的位置

| 机制 | 存下来的动态信息 | 消息派发负责什么 | 额外合同 |
| --- | --- | --- | --- |
| KVO | object + property/accessor | 让 runtime 可拦截 getter/setter | NSObject、`@objc dynamic`、观察生命周期 |
| Target-action | target + action selector | 事件时找到 action IMP | action 签名、target 生命周期、responder chain |
| Selector Notification | observer + selector | 通知时调用 observer method | name/object 过滤、注册移除 |
| `@objc protocol` | receiver + requirement selector | 选择 required/optional method | class-only、optional presence |
| Swizzling | class + selector + replacement IMP | 让后续消息看到新映射 | ABI 一致、顺序、全局副作用 |
| Core Data `NSManaged` | entity metadata + selector/property | runtime 提供实现/存储入口 | managed object context、模型合同 |
| Message forwarding / Proxy | unhandled selector + invocation | 把消息重定向到其他 receiver | signature、`responds`/introspection 一致性 |

这张表揭示同一个模式：

```text
先让声明有 Objective-C runtime 身份
→ 再由框架保存或生成 selector
→ 最终仍回到 receiver + selector → IMP
```

## 17. 与另外三条线路逐层比较

| 层次 | 直接/静态 | Swift Class vtable | Protocol witness | Objective-C message |
| --- | --- | --- | --- | --- |
| 编译期先选什么 | 唯一声明/函数 | class member declaration + slot 语义 | protocol requirement | Objective-C-visible declaration + selector |
| 运行时选择输入 | 无额外选择 | receiver 动态 Swift class | concrete type + conformance | receiver 动态 ObjC class + selector |
| 常见实现结构 | symbol/function ref | class metadata/vtable slot | witness table entry | method cache/list、IMP、messaging entry |
| 支持的替换来源 | 无语义替换点 | subclass override | 不同 conformance witness | subclass、category/runtime mutation、resolution/forwarding |
| Protocol 关系 | 无要求 | 可由 class 同时 conform | 原生 Swift requirement 核心线路 | `@objc protocol` requirement |
| Value type | 最自然 | 不适用 | 最自然 | 不能作为普通 message receiver；可 bridge/wrap |
| Generic | 可共享或特化 | 可存在 Swift generic class 约束 | 核心能力 | selector 无 Swift generic specialization 语义 |
| Property | 已知 accessor | overrideable accessor slot | property requirement witness | getter/setter selector |
| `super` | 普通已知调用 | superclass implementation 语义 | 不适用 | receiver 不变、lookup 从 superclass 起 |
| Runtime replacement | 不支持 | 通过合法 override | 通过选择另一 conformance/类型 | 通过 selector→IMP 映射及 runtime 机制 |
| 优化 | 最易 inline | 可证明时去虚化 | 特化后可去虚化 | `dynamic` 访问不得 inline/devirtualize |
| 失败模式 | 链接/逻辑错误 | 错误 override/类型假设 | conformance/requirement 混淆 | unrecognized selector、ABI mismatch、bridge/lifetime 问题 |
| 典型入口 | free function、struct、`final` | Swift overrideable class method | `T: P`、`any P` requirement | Cocoa/ObjC caller、selector API、`dynamic` |

### 17.1 同一继承例子的四种问题

```swift
class Base: NSObject {
    func swiftVirtual() {}
    @objc func objcVisible() {}
    @objc dynamic func objcDynamic() {}
}
```

不要只问“这三个都是 class method，派发一样吗”。应逐个问：

1. `swiftVirtual()`：调用边是否需要保留 Swift subclass override？通常由 Swift class/vtable 语义解释；
2. `objcVisible()`：Objective-C caller 有 selector entry，但 Swift caller 不因 `@objc` 自动承诺消息派发；
3. `objcDynamic()`：Swift 访问也必须保留 Objective-C runtime 动态选择。

### 17.2 同一个 Protocol 的两条不同主干

```swift
protocol NativeDelegate {
    func didUpdate()
}

@objc protocol CocoaDelegate: AnyObject {
    func didUpdate()
}
```

- `NativeDelegate.didUpdate()`：以 conformance/witness 为核心；
- `CocoaDelegate.didUpdate()`：以 receiver/selector 为核心。

名字相同不代表派发模型相同。

### 17.3 优化后的机器码不能倒推语义

如果某次 `-O` 构建中：

- vtable call 被 devirtualize；
- witness call 被 specialize；
- Objective-C call 命中某种快速 stub；

只能说明当前编译器在当前边界下生成了该代码。语义比较仍要按语言允许的替换点进行。尤其 `dynamic` 明确禁止编译器通过 inline/devirtualize 消除访问的 runtime 动态性。

## 18. 一条复合线路：按钮触发 Swift Async 工作

下面的例子把多条基础线路串起来：

```swift
protocol SearchService {
    func search() async throws -> [String]
}

final class SearchController: UIViewController {
    private let service: any SearchService

    init(service: any SearchService) {
        self.service = service
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    @objc
    private func searchTapped(_ sender: UIButton) {
        Task { @MainActor in
            let result = try await service.search()
            render(result)
        }
    }

    private func render(_ result: [String]) {
        // 更新界面
    }
}
```

完整线路不是一句“这是动态派发”：

```text
UIControl event
→ target-action 选择 receiver
→ selector searchTapped:
→ Objective-C message dispatch
→ Swift @objc thunk
→ searchTapped Swift body
→ Task creation
→ Swift executor 调度
→ await service.search()
→ 该调用按 service 的静态/动态类型走自己的派发线路
→ suspension/resumption
→ MainActor 上 render
```

这说明“方法派发”和“同步/异步”是正交轴：

- 派发决定执行哪个实现；
- async/await 决定调用何时可能暂停和恢复；
- actor/executor 决定隔离与执行位置；
- thread 只是运行这些工作的一种资源。

## 19. 决策指南

### 19.1 只需要 Objective-C/selector 调用

使用 `@objc`：

```swift
final class TapHandler: NSObject {
    @objc
    func handleTap(_ sender: UIButton) {}
}
```

典型场景：

- target-action；
- selector notification；
- Objective-C caller；
- `@objc protocol` requirement。

### 19.2 Swift 调用也必须被 runtime 观察或替换

使用 `dynamic`，通常显式写：

```swift
class RefreshController: NSObject {
    @objc dynamic func refresh() {}
}
```

典型场景：

- KVO property；
- 有明确 runtime replacement 合同；
- 必须让 swizzling 影响 Swift access。

### 19.3 纯 Swift 多态

优先考虑：

- class override/vtable；
- native protocol + witness；
- generic；
- closure；
- enum/state machine。

不要仅为“灵活”就把所有成员暴露给 Objective-C runtime。这样会扩大动态名字、兼容性和优化边界。

### 19.4 需要 optional behavior

先问：

```text
需要 Objective-C delegate interoperability？
```

- 是：`@objc optional` 可能正确；
- 否：优先拆分 protocol、默认实现或 Optional closure。

### 19.5 需要跨语言导出 generic/async API

建立清晰 façade：

```text
Swift 内部：generic + async + typed Error
Objective-C 边界：NSObject/protocol + completion + NSError
```

边界负责适配，不应让内部模型退化成全局动态对象。

## 20. 常见误区

### 20.1 “`@objc` 就是动态派发”

错误。`@objc` 建立 Objective-C 可见入口；`dynamic` 才要求 Swift access 使用 Objective-C runtime 动态派发。

### 20.2 “继承 NSObject 后，所有成员都走 `objc_msgSend`”

错误。NSObject 提供 runtime/Cocoa 根对象能力；具体 member 的可见性和调用线路仍需逐条分析。

### 20.3 “`dynamic` 只是给 KVO 用的”

不完整。KVO 是典型消费者；`dynamic` 的一般含义是保留 Objective-C runtime 派发。

### 20.4 “Selector 是字符串，所以每次都线性按字符串找”

错误。selector 有 runtime 注册表示，runtime 有 per-class cache 等快速结构。字符串可以创建 selector，但不等于每次调用都重新做普通字符串搜索。

### 20.5 “Cache hit 后就等于直接调用”

错误。它仍以 receiver 动态 class 和 selector 为选择依据，runtime mutation 后映射可以变化。

### 20.6 “IMP 就是 Swift 函数指针”

错误。IMP 遵守 Objective-C method ABI，包含隐藏的 `self`/`_cmd` 约定；Swift body 可能位于 thunk 之后。

### 20.7 “Swizzling 只要交换函数地址就安全”

错误。还必须满足完整 ABI、ARC、继承、cache、安装顺序和框架合同。

### 20.8 “Optional Objective-C protocol method 返回 Optional”

错误。可选的是 method presence；调用结果因 optional chaining 才被包成 Optional。

### 20.9 “KVO 只需要 `@objc`”

错误。Apple 的 Swift KVO 合同要求 NSObject subclass 上的 `@objc dynamic` property。

### 20.10 “Async 不能暴露给 Objective-C”

过时。Swift 可以把 `@objc async` 适配为 completion-handler method；Objective-C 仍不直接拥有 Swift suspension/actor 语义。

### 20.11 “Bridge 后的 struct 就成了 Objective-C class”

错误。bridge object 是边界表示；原 Swift value type 的方法、copy 和 identity 语义没有被全局改写。

### 20.12 “NotificationCenter 的所有 API 都是消息派发”

错误。只有 selector observer 明确存储并调用 selector；closure、publisher、AsyncSequence 有不同用户层合同。

### 20.13 “`super` 把消息发给 superclass object”

错误。receiver 仍是 `self`，只是 lookup 起点改为当前定义 class 的 superclass。

### 20.14 “Runtime 能找到方法，就证明类型安全”

错误。selector presence 只证明可找到某个入口；参数、返回 ABI、ownership 和 concurrency contract 仍必须匹配。

## 21. 如何观察这条线路

### 21.1 看 Swift SIL

```bash
swiftc -emit-sil source.swift
swiftc -O -emit-sil source.swift
```

常见观察点：

- `objc_method`；
- `objc_super_method`；
- `dynamic_method_br`；
- `@convention(objc_method)`；
- `...To` 一类 Objective-C entry thunk；
- 优化前后是否保留动态访问。

这些名字是编译器中间表示，不是源语言 API。

### 21.2 看 generated Objective-C header

Xcode 生成的 `ModuleName-Swift.h` 可以验证：

- Swift class/member 是否真正导出；
- selector 名怎样映射；
- `async` 是否转成 completion handler；
- `throws` 如何形成 NSError 约定；
- 哪些 generic/Swift-only 声明没有出现在 Objective-C 表面。

generated header 是比“我觉得这个类型能 bridge”更直接的边界证据。

### 21.3 看 Runtime 行为

调试时可以观察：

- `responds(to:)`；
- `class_getMethodImplementation`；
- method metadata；
- KVO 观察前后的行为；
- swizzling 安装前后 selector 的 IMP。

但这些 probe 只说明当前进程、OS、架构和 runtime 状态。不要把 raw class pointer、cache bucket 或私有 subclass 名写成业务合同。

### 21.4 同时验证语义和优化

一个可靠实验至少对比：

```text
未优化 SIL
优化 SIL
Objective-C generated header
实际 runtime 行为
```

只看汇编容易把优化结果误写成语言规则；只看源码又可能遗漏 bridge/thunk。

## 22. 线路摘要

```text
Swift 声明
→ Objective-C 可表示性
→ @objc 建立 selector 与入口
→ dynamic（若存在）强制访问保留 ObjC runtime 派发
→ receiver + selector
→ class cache / method lookup / superclass / resolution / forwarding
→ IMP
→ Objective-C 或 Swift thunk/body
→ bridge + ARC + error/async adaptation
```

最关键的五个结论：

1. `@objc` 是可见性与入口；`dynamic` 是派发保证。
2. selector 只标识 Objective-C method，调用类型安全来自完整声明和 ABI。
3. `objc_msgSend`、cache、`isa` 是重要实现模型，但不是 Swift 永久表布局保证。
4. KVO、target-action、`@objc protocol`、selector notification、swizzling 都附着在 `receiver + selector → IMP` 主干上。
5. 消息派发只选择入口；generic、ARC、bridge、async/await、actor/executor 仍各有自己的独立语义线路。

回到四路总览：[方法派发：四条调用线路](README.md)。

## 23. 一级资料

资料核对日期：2026-07-26。Swift 文档站可能同时展示稳定版与开发中语言版本；具体可用语法和生成结果还要结合项目的 Swift language mode、SDK 与 deployment target。

### Swift 语言与编译器

- [The Swift Programming Language — Declarations](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/declarations/)：`dynamic`、actor member 的 Objective-C 边界。
- [The Swift Programming Language — Attributes](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/attributes/)：`@objc`、`NSManaged`、Objective-C 可表示声明。
- [The Swift Programming Language — Protocols](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/protocols/)：`@objc protocol` 与 optional requirement。
- [The Swift Programming Language — Expressions](https://docs.swift.org/swift-book/ReferenceManual/Expressions.html)：`#selector`、getter/setter selector。
- [SE-0297 — Concurrency Interoperability with Objective-C](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0297-concurrency-objc.md)：completion handler 与 Swift async 的双向转换。

### Apple Swift / Cocoa 文档

- [Using Objective-C Runtime Features in Swift](https://developer.apple.com/documentation/swift/using-objective-c-runtime-features-in-swift)：selector、target-action、Objective-C key path。
- [Importing Swift into Objective-C](https://developer.apple.com/documentation/swift/importing-swift-into-objective-c)：generated header 和 Swift 声明导出。
- [Calling Objective-C APIs Asynchronously](https://developer.apple.com/documentation/swift/calling-objective-c-apis-asynchronously)：completion-handler API 的 async 导入。
- [Using Key-Value Observing in Swift](https://developer.apple.com/documentation/swift/using-key-value-observing-in-swift)：NSObject 与 `@objc dynamic` 的 KVO 合同。
- [Working with Foundation Types](https://developer.apple.com/documentation/swift/working-with-foundation-types)：Swift value 与 Foundation reference 的桥接。
- [Handling Dynamically Typed Methods and Objects in Swift](https://developer.apple.com/documentation/swift/handling-dynamically-typed-methods-and-objects-in-swift)：Objective-C `id`、Swift `Any` 与 runtime bridge。
- [UIControl.addTarget](<https://developer.apple.com/documentation/uikit/uicontrol/addtarget(_:action:for:)>):
  target-action 的 target、selector 与生命周期约定。
- [NotificationCenter selector observer](https://developer.apple.com/documentation/foundation/notificationcenter/1415360-addobserver)：selector 通知入口的签名合同。

### Objective-C Runtime

- [Apple Objective-C Runtime — objc_msgSend](https://developer.apple.com/documentation/objectivec/objc_msgsend)：消息发送入口。
- [Apple Objective-C Runtime — objc_cache](https://developer.apple.com/documentation/objectivec/objc_cache)：method cache 的作用。
- [Apple Objective-C Runtime — class_getMethodImplementation](<https://developer.apple.com/documentation/objectivec/class_getmethodimplementation(_:_:)>):
  selector 到 IMP 的查询含义。
- [Apple Objective-C Runtime Programming Guide — Messaging](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtHowMessagingWorks.html)：receiver、selector、IMP、`self`/`_cmd` 和 superclass lookup 的概念线路。此文档在 archive 中，应作为实现模型阅读。
- [Apple Objective-C Runtime Programming Guide — Dynamic Method Resolution](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtDynamicResolution.html)：运行时补充 method implementation。
- [Apple Objective-C Runtime Programming Guide — Message Forwarding](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtForwarding.html)：未处理 selector 的 forwarding 线路。
- [Apple objc4 open-source runtime](https://github.com/apple-oss-distributions/objc4)：当前公开 runtime 源码，用于核对 cache、lookup、resolver 和 forwarding 的实现；不能替代 Swift 语言语义。
