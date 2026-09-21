# Swift 中的库演进

- **原文标题**：Library Evolution in Swift
- **作者/机构**：Slava Pestov（`slavapestov`）/ Swift.org
- **原文发布日期**：2020-02-13
- **原文链接**：[Library Evolution in Swift](https://www.swift.org/blog/library-evolution/)
- **原文许可**：[Creative Commons Attribution 4.0 International（CC BY 4.0）](https://creativecommons.org/licenses/by/4.0/)
- **翻译日期**：2026-07-27
- **译文说明**：本文是非官方中文翻译，未获 Apple 或 Swift.org 背书。本译文属于对原文的中文改编，已在此明确标明修改；代码、编译器参数和资源链接保持原样。

Swift 5.0 在 Apple 平台上引入了稳定的二进制接口。这意味着，使用 Swift 5.0 编译器构建的应用可以使用操作系统内置的 Swift 运行时和标准库，而且现有应用将继续与未来操作系统版本中的新版 Swift 运行时兼容。

Swift 5.1 带来了两项与二进制稳定性有关的新特性，使二进制框架能够被分发并与他人共享：

- _模块稳定性_允许使用不同编译器版本构建的 Swift 模块共同用于一个应用。

- _库演进支持_允许二进制框架的开发者以增量方式扩展框架 API，同时继续与以前的版本保持二进制兼容。

模块稳定性目前要求启用库演进支持；构建用于分发的二进制框架时，通常会同时启用这两项特性。

若想进一步了解二进制稳定性、模块稳定性与库演进支持之间的关系，请参阅本博客此前的文章 [ABI 稳定性及更多内容](https://www.swift.org/blog/abi-stability-and-more/)。

## 何时启用库演进支持

库演进支持默认处于_关闭_状态。对于总是一起构建并分发的框架，例如 Swift Package Manager 软件包，或应用内部使用的二进制框架，_不应该_启用库演进支持。

**只有当框架会与其客户端分开构建和更新时，才应该使用库演进支持。**在这种场景中，针对旧版框架构建的客户端，可以在不重新编译的情况下与新版框架一起运行。

如果你计划以这种方式发布框架，请务必最迟从第一个发布版本开始启用库演进；更理想的做法，是在开发和测试周期中尽早启用。启用库演进支持会改变框架的性能特征，还会在针对枚举的 `switch` 穷尽性方面引入一项源代码不兼容的语言变化。此外，为框架启用库演进支持本身就是一项二进制不兼容的变化，因为没有启用库演进支持的框架不提供任何二进制兼容保证。

## 启用库演进支持

### Xcode

在使用 Xcode 为 Apple 平台开发时，请在框架的 target 中设置 `BUILD_LIBRARY_FOR_DISTRIBUTION` 构建设置。该设置会同时开启库演进和模块稳定性。请确保在 Debug 和 Release 构建中都使用这一设置。

WWDC 2019 的演讲 [Swift 中的二进制框架](https://developer.apple.com/wwdc19/416)介绍了 Xcode 的 `BUILD_LIBRARY_FOR_DISTRIBUTION` 构建设置及相关的 `.xcframework` 支持。

### 直接调用编译器

如果你直接调用 `swiftc`，无论是通过命令行还是其他构建系统，都可以传入 `-enable-library-evolution` 和 `-emit-module-interface` 标志。例如：

~~~shell
$ swiftc Tack.swift Barn.swift Hay.swift \
    -module-name Horse \
    -emit-module -emit-library -emit-module-interface \
    -enable-library-evolution
~~~

上述调用会生成名为 `Horse.swiftinterface` 的模块接口文件，以及动态链接库 `libHorse.dylib`（macOS）或 `libHorse.so`（Linux）。

## 库演进模型

库演进允许你对框架进行某些修改而不破坏二进制兼容性。如果框架的新版本同时与旧版本保持源代码兼容和二进制兼容，我们就称这项修改具有**韧性（resilient）**。

在详细说明哪些修改具有韧性之前，需要先介绍 **ABI-public 声明**这个概念。它指能够从另一个 Swift 模块中引用的声明。以下是一些例子：

- 所有 `public` 声明都是 ABI-public。

- 使用 [`@usableFromInline` 特性](https://docs.swift.org/swift-book/ReferenceManual/Attributes.html#ID597)标注的声明是 ABI-public，但在源语言中并不是 public；这意味着，它们可以从 `@inlinable` 代码中引用，却不能直接从源代码中引用。本文稍后会更详细地讨论这一特殊特性。

如果需要明确强调非 ABI-public 声明的行为，我们会使用 **ABI-private** 这个术语。ABI-private 声明包括被声明为 `private`、`fileprivate`，或者没有 `@usableFromInline` 特性的 `internal` 声明。

[`@frozen` 特性](https://docs.swift.org/swift-book/ReferenceManual/Attributes.html#ID620)也与库演进有关。该特性会改变 ABI-public 结构体或枚举的二进制接口，使其暴露更多实现细节。它通过限制未来哪些修改能够保持韧性，用一部分灵活性换取额外性能。

介绍完这些概念，接下来说明框架作者可以做的一些常见的韧性修改，以及应该避免的非韧性修改。

### 韧性修改示例

- 一项基本原则是，ABI-private 声明（定义见上文）可以随意添加、移除和修改。只有被明确声明为 ABI-public 的内容才会成为框架二进制接口的一部分。

- 源文件中的顶层声明可以重新排序，也可以在同一框架的不同源文件之间移动。类型或扩展内部的成员也可以重新排序，但有两个例外：在声明为 `@frozen` 的结构体中，存储属性不能重新排序；在声明为 `@frozen` 的枚举中，枚举用例不能重新排序。

  例如，下面先定义了一个顶层函数，随后定义了一个包含两个方法的类。函数和类可以按任意顺序出现，类中的两个方法也可以重新排序，而不会破坏二进制兼容性：

  ~~~swift
    public func sum<T : Sequence>(_ seq: T) -> Int
        where T.Element == Int {
      return array.reduce(0, (+))
    }

    open class NetworkHandle {
      open func open() {}
      open func close() {}
    }
  ~~~

  也可以反转这两个顶层声明的顺序来编写，且不会对框架的 ABI 产生任何影响：

  ~~~swift
    // The declarations of NetworkHandle and sum have been reordered.
    // This does NOT have any impact on the binary interface of
    // of the framework.
    open class NetworkHandle {
      open func open() {}
      open func close() {}
    }

    public func sum<T : Sequence>(_ seq: T) -> Int
        where T.Element == Int {
      return array.reduce(0, (+))
    }
  ~~~

  相比之下，在下面的 `@frozen` 枚举定义中，两个 `case` 声明_不能_重新排序，但两个方法可以重新排序。此外，方法和枚举用例之间的相对顺序_可以_改变：

  ~~~swift
    @frozen public enum Shape {
      // These cases of an @frozen enum cannot be reordered.
      // The order of the cases with repect to each other
      // is part of the framework's binary interface.
      case rect(w: Int, h: Int)
      case circle(radius: Int)

      // The order that these methods are declared
      // can be reordered. Their ordering is NOT
      // part of the framework's binary interface.
      public func area() -> Int {...}
      public func circumference() -> Int {...}
    }
  ~~~

- 可以在源文件的顶层添加声明。

- 可以向类、结构体和枚举类型添加成员，前提是容器类型没有声明为 `@frozen`。如果类型是 `@frozen`，则不能添加存储属性或枚举用例。其他任何种类的成员都可以不受限制地添加。

- 不可变属性可以变为可变属性。属性的二进制接口是一组**访问器函数**，因此引入可变性等同于添加一项新声明——setter。

  例如，假设有一个结构体，其中定义了只读计算属性 `fahrenheit`：

  ~~~swift
    public struct Temperature {
      public var celsius: Int
      public var fahrenheit: Int { (celsius * 9) / 5 + 32 }
    }
  ~~~

  新版库可以为 `fahrenheit` 添加 setter：

  ~~~swift
    public struct Temperature {
      public var celsius: Int
      public var fahrenheit: Int {
        get { (celsius * 9) / 5 + 32 }
        set { celsius = ((newValue - 32) * 5) / 9 }
      }
    }
  ~~~

- 可以向协议添加新的要求，前提是这个新要求在协议扩展中定义了默认实现。

  例如，假设有一个 `PointLike` 协议：

  ~~~swift
  public protocol PointLike {
    var x: Int { get }
    var y: Int { get }
  }
  ~~~

  新版库可以向协议添加新的属性要求 `z`，并提供一个返回 0 的默认实现：

  ~~~swift
  public protocol PointLike {
    var x: Int { get }
    var y: Int { get }
    var z: Int { get }
  }

  extension PointLike {
    public var z: Int { 0 }
  }
  ~~~

  如果关联类型在协议本身中指定了默认值，那么添加新的关联类型也与二进制兼容：

  ~~~swift
  public protocol PointLike {
    var x: Int { get }
    var y: Int { get }
    var z: Int { get }

    associatedtype Magnitude = Double

    var magnitude: Magnitude { get }
  }
  ~~~

  这里有一个重要的注意事项。请记住，Swift 允许将所有协议用作泛型约束。此外，没有定义关联类型或 `Self` 要求的协议还可以被用作_类型_。这项限制纯粹存在于源语言中，不影响协议类型值的二进制接口。

  在上面的例子中，旧版 `PointLike` 没有任何关联类型或 `Self` 要求，因此可以用作类型。然而，新版本包含了关联类型。所以实际上，这项修改虽然与二进制兼容，却不与_源代码_兼容。因此，最好只向那些_已经_具有相关类型或 `Self` 要求的协议添加新的关联类型或 `Self` 要求。这样才能确定客户端中不存在把该协议用作类型的既有代码。

- 可以从源文件顶层移除 ABI-private 声明。由于框架外部永远无法直接引用这些声明，因此它们不会影响框架的二进制接口。

- 可以从类、结构体和枚举类型中移除 ABI-private 成员，前提是容器类型不是 `@frozen`。如果结构体或枚举是 `@frozen`，则不能移除存储属性或枚举用例。其他任何种类的成员都可以不受限制地移除。

- private 和 internal 声明及成员可以变为 `public` 或 `@usableFromInline`。被声明为 `public` 的类和类成员可以变为 `open`。

- 可以修改公开声明的实现，前提是新实现与既有的预期行为兼容。例如，可以把函数体替换为产生相同结果但效率更高的算法。又如，可以把存储属性改为计算属性，只要计算属性具有相同的可观察行为。

  例如，下面的 `Temperature` 实现与此前看到的实现二进制兼容：

  ~~~swift
  public struct Temperature {
    public var celsius: Int {
      get { ((fahrenheit - 32) * 5) / 9 }
      set { fahrenheit = (newValue * 9) / 5 + 32 }
    }
    public var fahrenheit: Int
  }
  ~~~

  但是，如果 `Temperature` 是 `@frozen`，这项修改就*不*具有二进制兼容性。

- 可以为类、结构体和枚举添加新的协议遵循。（即使它们是 `@frozen` 也可以。）

  例如，回想一下前面的冻结枚举 `Shape`：

  ~~~swift
  @frozen public enum Shape {
    case rect(w: Int, h: Int)
    case circle(radius: Int)
  }
  ~~~

  可以让它遵循标准库中的 `CustomStringConvertible` 协议：

  ~~~swift
  @frozen public enum Shape : CustomStringConvertible {
    case rect(w: Int, h: Int)
    case circle(radius: Int)

    public var description: String { ... }
  }
  ~~~

  也可以改用扩展来定义该遵循关系，如下所示：

  ~~~swift
  extension Shape : CustomStringConvertible {
    public var description: String { ... }
  }
  ~~~

- 可以移除对 ABI-private 协议的遵循。

- 可以在两个既有类之间插入一个超类。例如，假设在版本 1 中，类 `Widget` 继承自类 `Gadget`：

  ~~~swift
  public class Gadget {}
  public class Widget : Gadget {}
  ~~~

  在版本 2 中，可以添加一个继承自 `Gadget` 的新类 `Gizmo`，并同时让 `Widget` 改为继承 `Gizmo`：

  ~~~swift
  public class Gadget {}
  public class Gizmo : Gadget {}
  public class Widget : Gizmo {}
  ~~~

### 非韧性修改示例

- 不允许移除 ABI-public 声明，因为既有客户端代码可能引用这些声明——既可能直接在源代码中引用，也可能通过已经被嵌入客户端的框架内联函数引用。例如，设想某个框架发布了以下代码：

  ~~~swift
    @usableFromInline func doInternalThing() { ... }

    @inlinable public func doPublicThing() {
      doInternalThing()
    }
  ~~~

  函数 `doInternalThing()` 是 ABI-public，不能被移除，因为既有客户端应用可能已经内联了带有 `@inlinable` 标记的 `doPublicThing()` 函数体。

- 可变的 ABI-public 属性不能变为不可变属性。在二进制接口中，这等同于移除 ABI-public setter 函数，而这种操作是不允许的。

- 不能向 `@frozen` 结构体添加或移除存储属性，_即使该属性是 private、fileprivate 或 internal_ 也不可以。

- 不允许向结构体或枚举添加或移除 `@frozen` 特性。

- 不允许修改协议所细化的协议列表。

- 同样，也不允许修改声明的_接口_。其中包括：

  - 修改属性的类型

  - 修改函数的返回类型或参数类型

  - 向函数的参数列表添加参数（即使提供了默认值也不可以）

  - 从函数的参数列表移除参数

  - 向泛型类型或函数的 `where` 子句添加泛型约束，或从中移除泛型约束

- 修改默认实参表达式在技术上不会破坏二进制兼容性；然而，由于默认实参表达式会在调用点内联，既有客户端在重新编译之前仍会继续使用旧的默认实参值。

若要查看一份更详尽的清单，了解哪些修改具有韧性、哪些没有，请参阅 Swift 编译器源代码仓库中的 [LibraryEvolution.rst](https://github.com/apple/swift/blob/master/docs/LibraryEvolution.rst) 文档。

## 有选择地退出库演进

下面详细讨论 `@frozen` 和 `@inlinable` 特性。

库演进通过在已编译客户端代码与框架之间引入一层抽象，以性能换取灵活性。多数时候，保留未来的灵活性是正确的默认选择。不过，有时框架会定义非常简单的数据类型，这些类型实际上不可能以任何合理方式继续演进。

例如，一个二维图形库可能会定义一个表示二维空间中某个点的 `struct`，由两个 `Double` 类型的存储属性 `x` 和 `y` 表示。这个结构体的存储属性布局未来不太可能发生变化。

在这些情况下，开发者如果能向编译器表明某项声明不会在未来的库版本中继续演进，就可能获得好处。作为回报，当客户端与这些声明交互时，编译器或许能够生成效率更高的代码。

这些特性应该审慎使用。不过，它们在某些场景下确实非常有价值，因此接下来逐一详细研究。

### 可内联函数

`@inlinable` 特性代表库开发者作出一项承诺：函数的当前定义在与库的未来版本一起使用时仍然正确。这个承诺允许编译器在构建客户端代码时查看函数体。需要注意的是，尽管名称中有“inlinable”，内联并不保证一定发生；编译器可能选择在客户端内部生成一份经过特化的非内联函数副本，也可能继续调用框架中的原始版本。

一种适合使用该特性的场景，是完全通过协议要求实现的泛型算法。假定协议公布的不变量不会改变，把泛型算法内联到客户端应用中应该始终是正确的。未来版本的库可能会用效率更高的实现替换这个泛型算法，但已经内联到客户端应用中的旧版本应该仍能继续工作。

编译器会对 `@inlinable` 函数体施加一项重要限制：它们只能引用其他 ABI-public 声明。请记住，ABI-public 声明要么是 `public`，要么是 `@usableFromInline`。`@usableFromInline` 特性的作用，是让辅助函数能够从可内联代码中使用，但不能作为公开接口的一部分被直接调用。要理解这项限制为何存在，可以想一想：如果 `@inlinable` 函数能够引用 `private` 函数或类型，会发生什么？这些 private 函数和类型将由此成为框架二进制接口的一部分，阻碍未来的演进。

从二进制兼容性的角度看，`@usableFromInline` 声明实际上与 public 声明相同。因此，我们始终使用 _ABI-public 声明_这个概念把二者涵盖在内。`@usableFromInline` 声明一旦发布，就绝不能移除，也不能对其接口做任何不兼容的修改。

Swift 演进提案 [SE-0193 跨模块内联与特化](https://github.com/swiftlang/swift-evolution/blob/master/proposals/0193-cross-module-inlining-and-specialization.md)更详细地介绍了可内联函数。

### 冻结结构体

可以把 `@frozen` 特性应用于结构体，从而向客户端公布它的存储属性布局。添加、移除或重新排列 `@frozen` 结构体的存储属性，属于二进制不兼容的修改。作为失去灵活性的回报，编译器可以跨模块边界对冻结结构体执行某些优化。

编译器对 `@frozen` 结构体施加了两项语言限制：

- 虽然 `@frozen` 结构体的存储属性本身不必是 ABI-public，但这些存储属性的_类型_必须是 ABI-public 类型。这意味着，ABI-private 结构体和枚举永远不能成为框架二进制接口的一部分，因为它们不能被递归包含在 ABI-public 的 `@frozen` 类型中。

  因此，下面的代码是合法的，因为 `Widget.id` 的类型是 ABI-public 的 `Int`：

  ~~~swift
    @frozen
    public struct Widget {
      private let id: Int
    }
  ~~~

  但是，如果用自定义 private 类型 `ID` 作为 `id` 属性的类型，类似的声明就是不合法的：

  ~~~swift
    @frozen
    public struct Widget {
      private let id: ID
    }

    fileprivate struct ID {
      private let id: Int
    }
  ~~~

  若要让上述代码通过编译，可以把 `ID` 的定义改为 `public` 或 `@usableFromInline`。

- 如果结构体中的任何存储属性带有初始值表达式，这些初始值表达式就会按照自身带有 `@inlinable` 标记的方式进行编译；也就是说，初始值只能通过对其他 ABI-public 声明的引用来表达。

  例如，下面的代码是合法的，因为 `doInternalThing()` 是 `@usableFromInline`：

  ~~~swift
    @usableFromInline
    func doInternalThing() -> Int { ... }

    public struct Widget {
      private let id: Int = doInternalThing()
    }
  ~~~

  但下面的代码不合法：

  ~~~swift
    func doInternalThing() -> Int { ... }

    public struct Widget {
      private let id: Int = doInternalThing()
    }
  ~~~

请记住，`@frozen` 只承诺存储属性成员的集合不会变化。它不会对其他种类的结构体成员施加任何限制。添加和重新排序方法及_计算_属性完全没有问题。不过，不要把计算属性改为存储属性，也不要反向修改；同时请记住，属性包装器和 `lazy` 属性在底层是通过存储属性实现的。

最后还有一项注意事项：实际向结构体添加或移除 `@frozen` 属于二进制_不兼容_的修改；结构体必须“生而冻结”，否则就要永远保持韧性！

Swift 演进提案 [SE-0260 面向稳定 ABI 的库演进](https://github.com/swiftlang/swift-evolution/blob/master/proposals/0260-library-evolution.md)提供了有关冻结结构体的更多细节。

### 冻结枚举

枚举也可以标记为 `@frozen`，这代表承诺不会添加、移除或重新排列枚举用例。（注意，虽然“移除”出现在这份列表中，但即使枚举不是 `@frozen`，从 ABI-public 枚举中移除一个用例也会破坏二进制兼容性，因为所有用例都是 ABI-public。）

与冻结结构体一样，编译器可以跨模块边界更高效地操作冻结枚举值。向枚举添加或移除 `@frozen` 与二进制不兼容。

如果针对冻结枚举的 `switch` 覆盖了所有用例，就会被视为穷尽；而针对非冻结枚举的 switch 始终必须提供 default 或 `@unknown` 分支。这是启用库演进支持所引入的唯一一项_源代码_不兼容。

Swift 演进提案 [SE-0192 非穷尽枚举](https://github.com/swiftlang/swift-evolution/blob/master/proposals/0192-non-exhaustive-enums.md)详细说明了 switch 穷尽性的行为。

## 平台支持

Swift 编译器目前只保证在 Apple 平台上，由不同编译器版本构建的产物之间具有二进制兼容性。这意味着，在 Linux 和其他平台上，如果应用和库是由不同版本的 Swift 编译器构建的，它们未必能够成功链接，也未必能在运行时正确工作。

不过，稳定的模块接口和库演进可以在 Swift 支持的所有平台上使用。因此，在非 Apple 平台上，只要所有二进制文件都是用同一个 Swift 编译器版本构建的，你仍然可以在不重新编译客户端应用的情况下使用同一个库的不同版本。

正如 [ABI 稳定性及更多内容](https://www.swift.org/blog/abi-stability-and-more/)所述，随着 Swift 在 Linux、Windows 和其他平台上的开发逐渐成熟，Swift 核心团队也会评估在这些平台上稳定 ABI。这将取消不能混合搭配由不同编译器版本构建的产物这一限制。

### Objective-C 互操作性

以下内容仅适用于 Apple 平台。

如果你的框架定义了一个 `open` 类，客户端代码中的子类定义就必须执行运行时初始化，以应对基类的韧性修改，例如添加新的存储属性或插入一个超类。Swift 运行时会在幕后处理这项初始化。

然而，如果某个类需要运行时初始化，它只有在较新的平台版本上运行时，才会对 _Objective-C_ 运行时可见。实际后果是：在较旧的平台上，对于需要运行时初始化的类，某些特性——例如构建于 `NSClassFromString()` 之上的功能——不会按预期工作。此外，除非把部署目标设置为足够新的平台版本，否则需要运行时初始化的类不会出现在 Swift 编译器生成的 Objective-C 头文件中。

所需的 Objective-C 运行时特性存在于以下操作系统版本中：

- macOS 10.15
- iOS 13.0
- tvOS 13.0
- watchOS 6.0

除非你能够确定框架中的类不会以上述方式与 Objective-C 动态特性结合使用，否则最稳妥的做法是：为框架和客户端代码都至少将上述平台版本设为最低部署目标。

## 与 -enable-testing 的交互

`-enable-testing` 编译器标志会以一种特殊模式构建框架，允许其他模块使用 `@testable` 特性导入该框架。`@testable import` 会让导入模块看到框架中的所有 `internal` 声明。需要测试不属于框架公开 API 的代码时，单元测试通常会使用这种方式。

`-enable-library-evolution` 编译器标志支持与 `-enable-testing` 结合使用；事实上，为测试构建框架 target 的推荐方式就是同时传入这两个标志。不过，需要注意的是，生成的框架只对公开 API 的修改具有韧性。这意味着，正常导入框架的客户端仍然与为测试构建的新版本保持二进制兼容。但是，实际使用 `@testable import` 的代码——例如框架自身的单元测试——会绕过访问控制，必然依赖于它所针对的特定框架版本中不具韧性的实现细节。因此，测试应该始终与框架一起构建。

## 库演进的实现

本文余下部分将深入探讨编译器实现细节。使用库演进特性并不要求理解这些细节。这些内容只适合 Swift 编译器贡献者，或者任何想知道底层如何运作的读者。

### 韧性边界

对于某一种给定的语言结构，Swift 编译器可能会根据上下文以及可用静态信息的多少，生成不同的代码模式。使用启用了库演进支持的框架与使用未启用该支持的框架，主要区别在于：启用库演进支持后，编译器在为某些语言结构生成代码时会更加保守。

一个重要概念是**韧性边界**。在单个框架内部，编译器始终充分了解框架的类型和函数。框架内部不存在韧性边界，因为我们假定框架的所有源代码都会一起编译。

然而，在构建客户端应用时，编译器必须谨慎，只能作出那些即使面对框架未来版本也一定成立的静态假设。跨越韧性边界时，编译期可用信息的范围会被有意限制；为了提供库演进支持所带来的灵活性，一些决策必须推迟到运行时。

### 结构体和枚举

如果结构体或枚举没有声明为 `@frozen`，其内存布局在跨越韧性边界时就是不透明的。其中包括值的大小和对齐方式，也包括在移动、复制和销毁该类型的值时是否必须执行额外工作（例如更新引用计数）。

在生成跨越韧性边界与韧性结构体或枚举交互的代码时，编译器始终会间接操作该值，并传递描述其内存布局的类型元数据。这类似于未特化的泛型函数操作泛型参数类型值的方式；2017 LLVM 开发者大会上题为 [实现 Swift 泛型](https://www.youtube.com/watch?v=ctS8FzqcRug)的演讲对此进行了详细讨论。

该实现的一项重要性质是：韧性结构体或枚举与非韧性结构体或枚举拥有相同的内存布局；在值这一层级不存在[装箱](https://en.wikipedia.org/wiki/Object_type_(object-oriented_programming\)#Boxing)，也不存在间接层。相反，操作这些值的代码必须执行额外步骤来计算字段偏移，或在函数之间把值作为参数传递。这保证了库演进支持虽然可能增加代码体积，却_不会_影响数据的[缓存局部性](https://en.wikipedia.org/wiki/Locality_of_reference)。

### 属性

Swift 中的属性有许多不同形式：存储属性、计算属性、带观察器的存储属性，以及 `lazy`、`@NSManaged` 等更特殊的变体。

请记住，从库演进的角度看，所有属性都会公开由访问器函数组成的统一接口。每个属性都有 getter 函数。如果属性可变，它还会有 setter 和一个_修改协程（modify coroutine）_。对于某些用法，例如把属性作为 `inout` 参数传递，修改协程能够生成效率更高的代码。如今，它的存在仍属于实现细节，但一份[向语言添加 modify 访问器的提案讨论](https://forums.swift.org/t/modify-accessors/31872)目前正在经历 Swift 演进流程。

跨越韧性边界访问属性时，编译器通常总会使用访问器函数。这保证了对属性底层实现所做的修改具有韧性。

当然，`@frozen` 结构体中的存储属性是例外。访问器函数仍然会生成，并用于生成协议见证表等某些场景；不过，编译器能够在可能时直接生成对存储属性的访问。

### 协议

当框架发布一个协议时，客户端代码可以声明遵循该协议的类型。编译器会生成一张称为_协议见证表_的函数指针表，用于描述每项协议遵循。对泛型参数调用协议要求时，需要从协议见证表中加载正确的函数指针。由于协议要求可以重新排序，而且还可以添加带默认实现的新协议要求，因此协议见证表的布局在跨越韧性边界时必须完全不透明。

这通过两个步骤实现。首先，对于每一项协议要求，二进制框架都会导出一个称为_派发桩（dispatch thunk）_的特殊函数。派发桩属于框架本身，因此可以直接把协议要求在见证表中的偏移硬编码进去。如果修改协议声明以重新排列要求，见证表中条目的顺序会改变，但派发桩的符号名称保持不变。由于客户端代码会通过派发桩调用所有协议方法，因此可以维持与框架未来版本的二进制兼容性。

最后，为了应对新增协议要求，协议见证表需要进行_运行时实例化_。编译器不会直接在客户端代码中生成见证表，而是生成对该遵循关系的符号化描述。实例化过程会把协议要求放到正确顺序中，并把缺失条目填充为指向其默认实现，从而得到一张结构完备、可以交给派发桩的见证表。

与结构体和枚举不同，协议没有定义一种退出机制，让开发者公布协议的精确布局并绕过派发桩。这是因为它的开销在实践中微不足道。

如果你一直看得格外仔细，可能会（正确地）猜到：与其他韧性特性一样，如果遵循关系与协议定义在同一个框架中，编译器就不会使用运行时实例化或派发桩。

### 类

Swift 中的类提供了大量功能，主要源于继承。一个类可以继承自另一个 Swift 超类，也可以继承自 Objective-C 超类；继承 Swift 超类时，超类可能位于同一模块，也可能位于另一个模块，而后者可能启用了库演进支持，也可能没有。

类的方法可以动态派发，因此能够在子类中被覆盖。继承自 Objective-C 类的 Swift 类也可以覆盖 Objective-C 方法。类可以把某个方法声明为 `final`，从而退出动态派发；整个类也可以声明为 `final`。最后但同样重要的是，类的方法可以使用 `@objc` 特性发布给 Objective-C。这里涉及很多机制，它们与韧性的交互可能相当复杂。

这里的关键结论是：在韧性类上派发 Swift 原生方法时，会调用派发桩；与协议一样，这使类中的方法能够重新排序，也能添加新方法，而不会干扰调用方。这个机制还允许_超类_添加或移除方法而不干扰子类。

当然，`@objc` 方法使用的是完全不同的方法派发策略，其中会调用 Objective-C 运行时函数 `objc_msgSend()`；这种策略通过哈希表查找而具备韧性。

### 开发历史

库演进背后的大量功能从 Swift 3.0 版本开始，已经在此前的编译器版本中逐步接受测试并推出。

在 Swift 4.0 之前，标准库以一种特殊模式构建，该模式通过未公开的 `-sil-serialize-all` 编译器标志启用。这个标志早于 `@inlinable` 特性的实现，本质上等同于把所有函数都声明为可内联。当时没有显式特性可以按函数选择加入这种行为；我们始终为标准库启用该标志，并在其他所有地方将其关闭。

Swift 4.0 引入了可内联函数的实验性实现，当时拼写为 `@_inlineable`，同时移除了特殊的 `-sil-serialize-all` 标志。为使迁移更轻松，我们只是把所有标准库函数都标记为 `@_inlineable`，所以这些修改起初几乎没有产生功能上的影响。

在 Swift 4.1 和 4.2 中，我们开始全面审查标准库，以决定哪些内容应该、哪些不应该是 `@_inlinable`。Swift 4.2 最终把 `@inlinable` 作为正式支持的特性推出，这表明可内联函数的实现已经达到了所需的完善度和正确性水平。

到 Swift 5.0 发布时，标准库审查已经完成，可内联代码被缩减到绝对最低限度，从而确保标准库未来仍可继续演进。

我们还继续完善韧性结构体和枚举的实现，引入了另一个实验性特性 `@_fixed_layout`，它后来会变成 `@frozen`。此时标准库已经实现 ABI 稳定，但用于实现这一目标的工具之一——`@_fixed_layout` 特性——仍然不是正式的语言特性。

Swift 5.1 最终引入 `@frozen`，取代实验性的 `@_fixed_layout`，同时继续与 Swift 5.0 的标准库保持 ABI 兼容。随着 `@frozen` 的引入，库演进现已可以投入普遍使用。

### 有问题吗？

欢迎在 [Swift 论坛][]上与本文[关联的主题](https://forums.swift.org/t/swift-org-blog-library-evolution-in-swift/33785)中提问。

[Swift 论坛]: https://forums.swift.org

## 参考资料

下面汇总了本文前面出现过的各个链接：

- 博客文章：[ABI 稳定性及更多内容](https://www.swift.org/blog/abi-stability-and-more/)
- WWDC 演讲：[Swift 中的二进制框架](https://developer.apple.com/wwdc19/416)
- 规范文档：[LibraryEvolution.rst](https://github.com/apple/swift/blob/master/docs/LibraryEvolution.rst)
- 演进提案：[SE-0193 跨模块内联与特化](https://github.com/swiftlang/swift-evolution/blob/master/proposals/0193-cross-module-inlining-and-specialization.md)
- 演进提案：[SE-0260 面向稳定 ABI 的库演进](https://github.com/swiftlang/swift-evolution/blob/master/proposals/0260-library-evolution.md)
- 演进提案：[SE-0192 非穷尽枚举](https://github.com/swiftlang/swift-evolution/blob/master/proposals/0192-non-exhaustive-enums.md)
- 演进提案讨论：[Modify accessors](https://forums.swift.org/t/modify-accessors/31872)
- LLVM 开发者大会演讲：[实现 Swift 泛型](https://www.youtube.com/watch?v=ctS8FzqcRug)
