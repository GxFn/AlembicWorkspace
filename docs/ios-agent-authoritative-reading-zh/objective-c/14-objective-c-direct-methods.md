# Objective-C 直接方法（Objective-C Direct Methods）

- **原文标题：** Objective-C Direct Methods
- **作者：** [Mattt](https://nshipster.com/authors/mattt/) / NSHipster
- **原文链接：** [NSHipster — Objective-C Direct Methods](https://nshipster.com/direct/)
- **原文发布日期：** 2019 年 12 月 16 日
- **许可协议：** [Creative Commons Attribution-NonCommercial 4.0 International（CC BY-NC 4.0）](https://creativecommons.org/licenses/by-nc/4.0/)
- **翻译日期：** 2026-07-27
- **文档性质：** 非官方中文翻译
- **修改说明：** 本文是对原文所作的中文改编，仅翻译说明文字，代码与标识符保持原样。译文仅可用于非商业用途；转载或继续改编时，须保留原作者署名、原文链接、许可链接，并说明已作修改。

Objective-C 增加新特性时，实在很难让人兴奋起来。如今，这类改进都是为了服务 Swift 的互操作性，而不是对这门语言本身进行投入*（参见[可空性](https://developer.apple.com/swift/blog/?id=25)和[轻量级泛型](https://developer.apple.com/documentation/swift/imported_c_and_objective-c_apis/using_imported_lightweight_generics_in_swift)）*。

因此，当我们得知[最近合入 Clang 的这个补丁](https://reviews.llvm.org/D69991)为 Objective-C 方法添加了一种新的直接派发机制时，着实有些意外。

这项新语言特性的起源并不清楚；我们能找到的最具体线索，只是 Apple 内部的一个 [Radar 编号](https://nshipster.com/bug-reporting/)（[`2684889`](rdar://2684889)）。除了它的大致年代之外，这个编号没有告诉我们多少东西（据我们估计，应当是在 21 世纪初的某个时候）。幸好，[这项特性最终落地](https://github.com/llvm/llvm-project/commit/d4e1ba3fa9dfec2613bdcc7db0b58dea490c56b1)，并且附带了足够的文档与测试覆盖，让我们得以充分了解它的工作方式。*（向实现者 Pierre Habouzit、评审负责人 John McCall 以及其他 LLVM 贡献者致意。）*

本周的 NSHipster，我们将借这个机会回顾 Objective-C 的方法派发，并试着理解这项新语言特性可能会对未来代码库产生怎样的影响。

> **旁注**
>
> Direct Method 最早可能出现在 Xcode 11.x 中，但更有可能会在 WWDC 2020 上发布。

---

要理解 Direct Method 的意义，你需要先了解一些 Objective-C Runtime 的知识。不过，让我们从更早一步开始，也就是 OOP 本身的起源：

## 面向对象编程

Alan Kay 在 20 世纪 60 年代末创造了“面向对象编程”（object-oriented programming）这个术语。在 Adele Goldberg、Dan Ingalls 以及 Xerox PARC 其他同事的帮助下，Kay 于 70 年代通过创造 Smalltalk 编程语言，将这个构想付诸实践。

> **旁注**
>
> 在这一时期，Xerox PARC 的研究人员还开发了 [Xerox Alto](https://en.wikipedia.org/wiki/Xerox_Alto)，它后来成为 Apple Macintosh 以及所有其他 GUI 计算机的灵感来源。

20 世纪 80 年代，Brad Cox 和 Tom Love 开始开发 Objective-C 的第一个版本。这门语言试图把 Smalltalk 的面向对象范式建立在 C 语言的坚实基础之上。经过 90 年代一连串机缘巧合的事件，Objective-C 后来成为 NeXT、继而成为 Apple 的官方语言。

对于我们这些在 iPhone 时代开始学习 Objective-C 的人来说，这门语言过去常被视为 Apple 又一项专有技术——公司[“非我发明”（Not invented here）](https://en.wikipedia.org/wiki/Not_invented_here)（NIH）文化所产生的无数晦涩副产品之一。然而，Objective-C 不只是“一种面向对象的 C”；它还是*最早的一批*面向对象语言之一，在 OOP 资历上拥有不逊于任何其他语言的有力主张。

那么，OOP 到底是什么意思？这是个好问题。20 世纪 90 年代的一轮轮炒作，已经让这个术语几乎失去意义。不过，就今天的讨论而言，让我们把注意力放在 Alan Kay 1998 年写下的一段话上：

> 很抱歉，我很久以前为这个主题创造了“对象”一词，因为它让许多人把注意力放在了那个较次要的概念上。真正重要的构想是“消息传递”……<br>
> ——[Alan Kay](https://wiki.c2.com/?AlanKayOnMessaging)

## 动态派发与 Objective-C Runtime

在 Objective-C 中，一个程序由一组对象构成；对象通过相互传递消息进行交互，而消息又会调用*方法*，也就是函数。方括号语法用来表示这种消息传递行为：

```objective-c
[someObject aMethod:withAnArgument];
```

Objective-C 代码编译时，消息发送会被转换成对一个名为 [`objc_msgSend`](https://developer.apple.com/documentation/objectivec/1456712-objc_msgsend) 的函数的调用（字面意思就是*“带着一个参数，向某个对象发送消息”*）。

```objective-c
objc_msgSend(object, @selector(message), withAnArgument);
```

- 第一个参数是接收者（对于实例方法，就是 `self`）。
- 第二个参数是 `_cmd`：selector，也就是方法名。
- 方法的所有参数都作为额外的函数参数传入。

`objc_msgSend` 负责决定应当调用哪一份底层实现来响应这条消息，这个过程称为*方法派发*。

在 Objective-C 中，每个类（`Class`）都维护一张派发表，用于解析运行时发送的消息。派发表中的每个条目都是一个方法（`Method`），它把 selector（`SEL`）映射到相应的 implementation（`IMP`），后者是一个指向 C 函数的指针。当对象收到一条消息时，它会查询自己所属类的派发表。如果能够找到该 selector 的实现，就调用与之关联的函数；否则，对象会继续查询其父类的派发表。这个过程沿继承链不断向上，直到找到匹配项，或者抵达根类（`NSObject`），由它判定该 selector 无法识别为止。

> **旁注**
>
> 这还完全没提 Objective-C 如何允许你在运行时替换方法实现、动态创建新类之类的操作。它能做到的事情简直疯狂。

如果你觉得所有这些间接层听起来工作量很大……某种意义上，你的感觉没有错！

如果代码中存在一条热路径，其中某个开销很大的方法会被频繁调用，那么可以设想，避开所有这些间接层会带来一些收益。为此，一些开发者使用 C 函数绕过动态派发。

## 使用 C 函数进行直接派发

正如我们通过 `objc_msgSend` 所看到的，只要把隐式的 `self` 作为第一个参数传入，任何方法调用都可以用一个等价函数来表示。

例如，看看下面这个 Objective-C 类声明，其中包含一个按常规方式动态派发的方法。

```objective-c
@interface MyClass: NSObject
- (void)dynamicMethod;
@end
```

如果开发者想在 `MyClass` 上实现某些功能，但又不想经历消息发送的整套流程，就可以声明一个静态 C 函数，让它接收一个 `MyClass` 实例作为参数。

```objective-c
static void directFunction(MyClass *__unsafe_unretained object);
```

这两种方案在调用点分别表现如下：

```objective-c
MyClass *object = [[[MyClass] alloc] init];

// Dynamic Dispatch
[object dynamicMethod];

// Direct Dispatch
directFunction(object);
```

## Direct Method

*Direct Method* 看起来、用起来都像常规方法，行为却与 C 函数相同。调用 Direct Method 时，它会直接调用底层实现，而不会经过 `objc_msgSend`。

有了这个新的 LLVM 补丁，你现在可以对 Objective-C 方法添加注解，有选择地避免它参与动态派发。

### `objc_direct`、`@property(direct)` 与 `objc_direct_members`

要让实例方法或类方法成为 Direct Method，可以用 `objc_direct` 这个 [Clang 属性](https://nshipster.com/__attribute__/)标记它。同样，也可以在声明 Objective-C 属性时使用 `direct` 属性特性，让该属性对应的方法成为 Direct Method。

```objective-c
@interface MyClass: NSObject
@property(nonatomic) BOOL dynamicProperty;
@property(nonatomic, direct) BOOL directProperty;

- (void)dynamicMethod;
- (void)directMethod __attribute__((objc_direct));
@end
```

> **说明**
>
> 据我们统计，加入 `direct` 之后，`@property` 的属性特性总数达到了 16 个：
>
> - `getter` 与 `setter`
> - `readwrite` 与 `readonly`
> - `atomic` 与 `nonatomic`
> - `weak`、`strong`、`copy`、`retain` 与 `unsafe_unretained`
> - `nullable`、`nonnullable` 与 `null_resettable`
> - `class`

当一个 Category 或类扩展的 `@interface` 标有 `objc_direct_members` 属性时，其中包含的所有方法声明和属性声明都会被视为 Direct Method，除非该类此前已经声明过它们。

> **警告**
>
> 不能在类的主接口上添加 `objc_direct_members` 属性。

```objective-c
__attribute__((objc_direct_members))
@interface MyClass ()
@property (nonatomic) BOOL directExtensionProperty;
- (void)directExtensionMethod;
@end
```

给 `@implementation` 添加 `objc_direct_members` 也有类似效果：此前未声明的成员会被视为 Direct Method，其中包括属性自动合成所产生的所有隐式方法。

```objective-c
__attribute__((objc_direct_members))
@implementation MyClass
- (BOOL)directProperty {…}
- (void)dynamicMethod {…}
- (void)directMethod {…}
- (void)directExtensionMethod {…}
- (void)directImplementationMethod {…}
@end
```

> **错误**
>
> 子类不能用 Direct Method 覆写动态方法，而 Direct Method 根本不能被覆写。
>
> 协议不能声明 Direct Method 要求，类也不能用 Direct Method 来实现协议要求。

把这些注解应用到前面的示例后，可以看到 Direct Method 与动态方法在调用点上无法区分：

```objective-c
MyClass *object = [[[MyClass] alloc] init];

// Dynamic Dispatch
[object dynamicMethod];

// Direct Dispatch
[object directMethod];
```

---

对于注重性能的开发者而言，Direct Method 看起来像是一项稳赢的特性。但转折来了：

**在大多数情况下，把方法改成 Direct Method 很可能不会带来可察觉的性能优势。**

事实证明，[`objc_msgSend` 快得出人意料](https://www.mikeash.com/pyblog/friday-qa-2016-04-15-performance-comparisons-of-common-operations-2016-edition.html)。得益于激进的缓存、大量底层优化以及现代处理器固有的性能特征，`objc_msgSend` 的开销极低。

iPhone 硬件可以被合理描述为资源受限环境的时代，早已离我们而去。因此，除非 Apple 正在为一个新的嵌入式平台做准备*（[比如 AR 眼镜？](http://appleinsider.com/articles/17/01/09/rumor-apple-working-with-carl-zeiss-on-ar-glasses-to-debut-in-2018)）*，否则，对 Apple 在 2019 年实现 Objective-C Direct Method 这件事，最合理的解释就应当来自性能以外的因素。

> **说明**
>
> [Mike Ash](https://www.mikeash.com) 是互联网上首屈一指的 `objc_msgSend` 专家。多年来，他的文章对 Objective-C Runtime 作出了极其深入而完整的解析；在 Cupertino 之外，很难再找到更好的资料。对于好奇的读者，[《Dissecting objc_msgSend on ARM64》](https://www.mikeash.com/pyblog/friday-qa-2017-06-30-dissecting-objc_msgsend-on-arm64.html)是个很好的起点。

## 隐藏的动机

当一个 Objective-C 方法被标记为 direct 时，它的实现具有隐藏可见性。也就是说，Direct Method 只能在同一个模块中调用*（或者更严谨地说，是同一个[链接单元](https://clang.llvm.org/docs/LTOVisibility.html)中）*。它甚至不会出现在 Objective-C Runtime 中。

隐藏可见性有两个直接优势：

- 二进制体积更小
- 无法从外部调用

没有外部可见性，也无法通过 Objective-C Runtime 动态调用，Direct Method 实际上就成了私有方法。

> **说明**
>
> 如果你想参与直接派发，同时又想让 API 可以从外部访问，可以用一个 C 函数把它包装起来。
>
> ```objective-c
> static inline void performDirectMethod(MyClass *__unsafe_unretained object) {
>     [object directMethod];
> }
> ```

Apple 可以利用隐藏可见性来阻止 Swizzling 和私有 API 的使用，但这似乎并不是首要动机。

[据实现这项特性的 Pierre 所说](https://twitter.com/pedantcoder/status/1197269246289444864)，这项优化的主要收益是减小代码体积。据称，未使用的 Objective-C 元数据所占的空间，可以达到编译后二进制文件 `__text` 段的 5%～10%。

---

可以想象，从现在到明年的开发者大会，几名工程师或许能够逐一检查各个 SDK 框架：用 `objc_direct` 标记私有方法，用 `objc_direct_members` 标记私有类，以此作为一种轻量方式，逐步收紧其 SDK。

如果事实果真如此，那么我们对 Objective-C 新特性产生怀疑，或许也不是什么坏事。这些特性若不是服务于 Swift，就是服务于 Apple。尽管 Objective-C 在编程史和 Apple 自身的历史中占有重要地位，我们仍然很难不把它看成恰恰就是那个词——*历史*。

## 原文作者

本文由 [Mattt](https://nshipster.com/authors/mattt/) 撰写。[Mattt](https://github.com/mattt)（[@mattt](https://twitter.com/mattt)）是一位居住在俄勒冈州波特兰的作家和开发者。
