# Swift 6.2 发布

- **原文标题**：Swift 6.2 Released
- **作者/机构**：Holly Borla / Swift.org
- **原文发布日期**：2025-09-15
- **原文链接**：[Swift 6.2 Released](https://www.swift.org/blog/swift-6.2-released/)
- **原文许可证**：[Creative Commons Attribution 4.0 International（CC BY 4.0）](https://creativecommons.org/licenses/by/4.0/)
- **翻译日期**：2026-07-27
- **译文声明**：这是非官方中文翻译，不代表 Apple 或 Swift.org 的官方译文或认可。译文属于对 CC BY 4.0 原文的中文改编，已在此明确标明修改；转载或继续改编时请保留作者、原文链接、许可证链接与修改说明。

我们很高兴宣布 Swift 6.2 正式发布。无论你在哪里、以何种方式编写代码，这一版本都致力于让每一位 Swift 开发者更高效。从工具和库的改进，到并发与性能方面的增强，Swift 6.2 带来了一整套面向真实开发场景的功能，覆盖软件栈的每一层。

请继续阅读，深入了解 Swift 6.2 在语言、库、工作流、平台支持方面的变化，以及开始使用这一版本的后续步骤。

## 更易上手的并发

Swift 6.2 通过一系列改动降低并发编程的门槛，减少样板代码，让你能够以更自然的方式编写安全的并发代码：

* **默认单线程：** 使用新的选项，让代码默认隔离到主 actor，无需显式添加 `@MainActor` 标注，就能在主线程上运行。这一选项非常适合脚本、UI 代码以及其他可执行目标。
* **直观的 `async` 函数：** 编写异步代码时，不必引入对可变状态的并发访问。过去，`nonisolated async` 方法总会切换到负责管理并发线程池的全局执行器，因此很难为类类型编写不触发数据竞争安全错误的异步方法。在 Swift 6.2 中，你可以迁移到一项[即将推出的语言特性](https://docs.swift.org/compiler/documentation/diagnostics/nonisolated-nonsending-by-default/)：`async` 函数在调用方的执行上下文中运行，即便它是从主 actor 上调用的。
* **使用 `@concurrent` 选择并发执行：** 通过新的 `@concurrent` 属性引入并发运行的代码。这样一来，你希望哪些代码继续在 actor 上串行运行、哪些代码可以并行运行，都会更加明确。

```swift
// In '-default-isolation MainActor' mode

struct Image {
  // The image cache is safe because it's protected
  // by the main actor.
  static var cachedImage: [URL: Image] = [:]

  static func create(from url: URL) async throws -> Image {
    if let image = cachedImage[url] {
      return image
    }

    let image = try await fetchImage(at: url)

    cachedImage[url] = image
    return image
  }

  // Fetch the data from the given URL and decode it.
  // This is performed on the concurrent thread pool to
  // keep the main actor free while decoding large images.
  @concurrent
  static func fetchImage(at url: URL) async throws -> Image {
    let (data, _) = try await URLSession.shared.data(from: url)
    return await decode(data: data)
  }
}
```

这些改进结合在一起，让你只需更少的标注就能编写无数据竞争的代码，为异步代码带来更可预测的行为，同时仍可在需要时引入并发。

## 安全的系统编程

Swift 6.2 包含一组旨在不牺牲安全性的前提下最大化性能的功能。这些功能可以帮助你编写安全、性能可预测且额外开销很小的底层代码。

[`InlineArray`](https://developer.apple.com/documentation/swift/inlinearray) 是一种新的定长数组，其元素使用内联存储；它可以存放在栈上，也可以直接存放在其他类型内部，而不需要额外的堆分配。要声明内联数组，可以把大小写在元素类型前的尖括号中，也可以使用 `of` 简写语法：

```swift
struct Game {
  // Shorthand for InlineArray<40, Sprite>
  var bricks: [40 of Sprite]

  init(_ brickSprite: Sprite) {
    bricks = .init(repeating: brickSprite)
  }
}
```

新的 [`Span`](https://developer.apple.com/documentation/swift/span?changes=_8) 类型提供对连续内存安全而直接的访问。`Span` 通过确保内存在使用期间始终有效来维持内存安全。这些保证会在编译期完成检查，不产生运行时开销，并从定义上排除了指针固有的内存安全问题，例如释放后使用。

除新增 API 外，Swift 6.2 还增强了面向底层项目和安全关键项目的能力：

* **Embedded Swift：** Embedded Swift 现在包含 Swift 完整的 `String` API、用于类约束协议的 `any` 类型，以及新的 `InlineArray` 和 `Span` 类型。
* **安全的 C++ 互操作：** 混合使用 Swift 与 C++ 的项目，可以通过头文件标注，让 C++ API [利用 Swift 的安全抽象](https://www.swift.org/documentation/cxx-interop/safe-interop/)，例如 `Span`。
* **可选择启用的严格内存安全：** Swift 从诞生之初就提供内存安全，同时在确有需要时允许使用不安全构造，例如调用接受指针的 C API。Swift 6.2 引入了*可选择启用的严格内存安全*：它会标记不安全构造的使用位置，使你能够改用安全替代方案，或在源码中明确确认这些用法。它之所以是可选的，是因为大多数项目并不需要这种强度的执行；严格内存安全最适合具有最高安全要求的项目。

## 更顺畅的工作流

除了语言改进外，Swift 6.2 还优化了编辑、构建和调试代码的日常迭代周期。

### VS Code Swift 扩展

[VS Code 的 Swift 扩展](https://marketplace.visualstudio.com/items?itemName=swiftlang.swift-vscode)现已通过官方验证，并由 Swift.org 发布。最新版扩展包括：

* **默认启用后台索引：** 在编写代码时获得快速且始终保持最新的编辑器功能，例如跳转到定义和代码补全。
* **内置 LLDB 调试：** 直接在 VS Code 中使用 LLDB 单步执行 Swift 代码、设置断点并检查状态。
* **Swift 项目面板：** 在资源管理器视图中浏览 Swift 项目的目标、依赖和任务。
* **实时 DocC 预览：** 在代码旁边预览渲染后的文档；内容会随着输入实时更新。

这些工作流改进让你能够在自己选择的环境中，以一流工具更轻松地开发 Swift 项目。

### 精确控制警告

Swift 6.2 允许在*诊断组*层级进行控制，从而增强了编译器警告的管理能力。诊断组是由名称标识的一类警告。你可以在 Swift 包清单中，使用 `SwiftSetting` 的 [`treatWarning`](https://docs.swift.org/swiftpm/documentation/packagedescription/swiftsetting/treatwarning(_:as:_:)/) 方法指定某个诊断组中警告的处理方式，或者使用 [`treatAllWarnings`](https://docs.swift.org/swiftpm/documentation/packagedescription/swiftsetting/treatallwarnings(as:_:)) 方法将所有警告提升为错误。例如，可以把除弃用 API 使用警告外的所有警告都提升为错误：

```swift
.target(
  name: "MyLibrary",
  swiftSettings: [
    .treatAllWarnings(as: .error),
    .treatWarning("DeprecatedDeclaration", as: .warning),
  ]
)
```

### 宏的构建性能

Swift 6.2 显著改善了使用基于宏的 API 的项目在全量构建时的耗时。过去，构建系统必须先从源码获取并构建 swift-syntax 包，之后才能构建宏项目；这会明显拉长编译时间，在 CI 环境中尤其如此。SwiftPM 现在支持预构建的 swift-syntax 依赖，彻底移除了这一成本高昂的构建步骤。

### 增强的异步调试

Swift 6.2 让使用 LLDB 调试并发代码时，更容易追踪正在发生的事情：

* **可靠的 `async` 单步调试：** 即使异步调用需要切换线程，也能在 LLDB 中可靠地单步进入异步函数。
* **显示任务上下文：** 在断点处暂停时，以及查看当前线程的回溯时，都能看到某段代码正在哪个任务上运行。
* **任务命名：** 创建任务时可以指定便于人类阅读的名称；调试和性能分析工具会在任务上下文中显示这些名称。

### 迁移到即将推出的特性

Swift 6.2 包含用于采用即将推出的语言特性的*迁移工具*：

* **识别源码不兼容：** 迁移工具会发出警告，找出在启用即将推出的特性后不再能够编译或行为将发生变化的代码模式。
* **自动修改代码：** 应用 fix-it 更新代码，以保持其现有行为。

这套能力消除了手动修改代码的繁琐工作，使启用即将推出的特性的过程更加顺畅。你可以在 [Swift 迁移指南](https://www.swift.org/migration/documentation/swift-6-concurrency-migration-guide/featuremigration)中进一步了解迁移工具。

## 核心库更新

无论你是在管理外部进程、响应状态变化，还是编写测试套件，Swift 6.2 的库都在持续演进，帮助你写出更简洁、更安全的代码。

### Subprocess

Swift 6.2 引入了新的 `Subprocess` 包，为启动和管理外部进程提供精简、便于并发使用的 API。其中包括基于 async/await 构建的 API、对进程执行的细粒度控制、特定平台的配置等功能，非常适合脚本、自动化和服务器端任务：

```swift
import Subprocess

let swiftPath = FilePath("/usr/bin/swift")
let result = try await run(
  .path(swiftPath),
  arguments: ["--version"]
)

let swiftVersion = result.standardOutput
```

你可以在 [swift-subprocess 仓库](https://github.com/swiftlang/swift-subprocess)中探索 0.1 版的完整 API；采用过程中的反馈将为 1.0 版最终发布的 API 提供参考。

### Foundation

在 Swift 6.2 中，Foundation 库加入了现代化的 `NotificationCenter` API：它使用具体通知类型，而不再依靠字符串和无类型字典表示通知名称与载荷。这意味着你可以定义带存储属性的通知结构体，观察者可以直接使用该类型，不再需要容易出错的索引访问和动态类型转换。通知类型还会通过遵循 [`MainActorMessage`](https://developer.apple.com/documentation/foundation/notificationcenter/mainactormessage) 或 [`AsyncMessage`](https://developer.apple.com/documentation/foundation/notificationcenter/asyncmessage)，说明通知是在主 actor 上同步发布，还是以异步方式发布；这可以消除处理主 actor 通知时的并发错误。

### Observation

Swift 6.2 可以使用新的 [`Observations`](https://developer.apple.com/documentation/observation/observations) 异步序列类型，以流的形式传递可观察类型在一个事务内的状态变化。一次更新包括对可观察属性所作的全部同步更改，并在下一个实际挂起的 `await` 处结束事务。这样可以避免多余的 UI 更新、改善性能，并确保代码针对值的一致快照作出响应。

### Swift Testing

Swift 6.2 中的 Swift Testing 新增了一组 API，让测试及其结果具有更强的表达能力：

* [**退出测试**](https://developer.apple.com/documentation/testing/exit-testing)可以验证代码是否在特定条件下终止，例如前置条件失败。退出测试会在新进程中运行，并验证退出行为是否符合预期，让关键失败路径也能像其他代码一样得到测试。
* [**附件**](https://developer.apple.com/documentation/testing/attachments)可以在测试结果中加入额外上下文，包括字符串、图像、日志和其他产物；这些内容会显示在测试报告中，或写入磁盘。借助具体证据，诊断失败会更加容易——无论证据是 UI 状态截图、JSON 载荷，还是导致问题的一系列步骤记录。
* [**原始标识符显示名称**](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0451-escaped-identifiers.md)让你用更少的代码自定义测试函数和测试套件类型的名称：

    ```diff
    -@Test("square() returns x * x")
    -func squareIsXTimesX() {
    +@Test func `square() returns x * x`() {
       #expect(square(4) == 4 * 4)
     }
    ```

## WebAssembly 支持

Swift 6.2 新增对 WebAssembly（也称 Wasm）的支持。WebAssembly 是一个以可移植性、安全性和高性能为重点的虚拟机平台。你可以为 Wasm 构建客户端和服务器应用，并将其部署到浏览器或其他运行时。要了解更多信息，请阅读 [Swift 的 WebAssembly 支持愿景](https://github.com/swiftlang/swift-evolution/blob/main/visions/webassembly.md)。

## 感谢

感谢每一位分享经验、挫折与见解的人，正是这些反馈指引了 Swift 6.2 的设计，尤其是更易上手的并发模型。你们的反馈清楚指出了语言可以在哪些地方变得更友好、安全性可以在哪些地方表现得更自然，以及工具可以如何进一步提高生产力。Swift 6.2 的这些改进，离不开你们的声音。

如果你对 Swift 的发展方向感到兴奋，那么现在正是参与 Swift 社区的好时机。你可以参与 Swift Evolution、在 GitHub 上贡献代码，也可以分享这门语言在真实项目中的使用感受；每一种声音都在帮助塑造 Swift 的未来。无论你经验丰富还是刚刚起步，我们的社区都因协作而蓬勃发展，并欢迎新的视角。加入我们，向他人学习，也帮助 Swift 成为更好的语言。

## 后续步骤

在 [Swift Evolution 仪表板](https://www.swift.org/swift-evolution/#?version=6.2)中，可以查看经由 [Swift Evolution](https://github.com/swiftlang/swift-evolution) 流程接受、并已在 Swift 6.2 中实现的全部语言提案。

准备升级了吗？使用 Swiftly 运行 `swiftly install 6.2`，或前往 [Swift.org/install](https://www.swift.org/install/) 安装最新工具链，立即开始探索 Swift 6.2。
