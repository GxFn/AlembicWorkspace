# 方法交换（Method Swizzling）

- **原文标题：** Method Swizzling
- **作者：** [Mattt](https://nshipster.com/authors/mattt/) / NSHipster
- **原文链接：** [NSHipster — Method Swizzling](https://nshipster.com/method-swizzling/)
- **原文发布日期：** 2014 年 2 月 17 日
- **许可协议：** [Creative Commons Attribution-NonCommercial 4.0 International（CC BY-NC 4.0）](https://creativecommons.org/licenses/by-nc/4.0/)
- **翻译日期：** 2026-07-27
- **文档性质：** 非官方中文翻译
- **修改说明：** 本文是对原文所作的中文改编，仅翻译说明文字，代码与标识符保持原样。译文仅可用于非商业用途；转载或继续改编时，须保留原作者署名、原文链接、许可链接，并说明已作修改。开篇第三方歌词不在 NSHipster 的许可授权范围内，故未逐句翻译；具体处理见正文中的版权说明。

> **第三方歌词版权说明：** 原文在这里引用了 The Flaming Lips 的歌曲 [《The Yeah Yeah Yeah Song (With All Your Power)》](https://en.wikipedia.org/wiki/The_Yeah_Yeah_Yeah_Song_(With_All_Your_Power))。该段歌词通过一连串假设追问：如果一个人拥有摧毁世界、以他人贫穷换取自身富有、坐享他人劳动或只索取爱而不付出的权力，他会怎样选择；最后把问题归结为“拥有这一切权力时，你会怎么做”。为避免未经授权地复现或逐句翻译第三方歌词，此处仅保留作品信息与非替代性概述。<br>
> ——**The Flaming Lips**

在上周讨论[关联对象](https://nshipster.com/associated-objects/)的文章中，我们开始探索 Objective-C Runtime 的黑魔法。本周，我们将继续深入，讨论或许是 Runtime hack 技巧中争议最大的一种：Method Swizzling。

---

Method Swizzling 是改变现有 selector 实现的过程。Objective-C 的方法调用可以在运行时改变，而实现这一点的方法，就是修改类的派发表中 selector 到底层函数的映射；Method Swizzling 正是由此成为可能。

例如，假设我们想在一个 iOS 应用中追踪每个 View Controller 向用户展示了多少次：

每个 View Controller 都可以在自己的 `viewDidAppear:` 实现里添加追踪代码，但这样会产生大量重复的样板代码。子类化是另一种可能，不过那将要求我们分别继承 `UIViewController`、`UITableViewController`、`UINavigationController` 以及其他所有 View Controller 类——这种方案同样会受到代码重复的困扰。

幸好还有另一条路：在 Category 中进行 **Method Swizzling**。做法如下：

```objective-c
#import <objc/runtime.h>

@implementation UIViewController (Tracking)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Class class = [self class];

        SEL originalSelector = @selector(viewWillAppear:);
        SEL swizzledSelector = @selector(xxx_viewWillAppear:);

        Method originalMethod = class_getInstanceMethod(class, originalSelector);
        Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);

        // When swizzling a class method, use the following:
        // Method originalMethod = class_getClassMethod(class, originalSelector);
        // Method swizzledMethod = class_getClassMethod(class, swizzledSelector);

        IMP originalImp = method_getImplementation(originalMethod);
        IMP swizzledImp = method_getImplementation(swizzledMethod);

        class_replaceMethod(class,
                swizzledSelector,
                originalImp,
                method_getTypeEncoding(originalMethod));
        class_replaceMethod(class,
                originalSelector,
                swizzledImp,
                method_getTypeEncoding(swizzledMethod));

    });
}

#pragma mark - Method Swizzling

- (void)xxx_viewWillAppear:(BOOL)animated {
    [self xxx_viewWillAppear:animated];
    NSLog(@"viewWillAppear: %@", self);
}

@end
```

现在，每当 `UIViewController` 或其任意子类的实例调用 `viewWillAppear:` 时，都会打印一条日志。

向 View Controller 生命周期、响应者事件、视图绘制过程或 Foundation 网络栈中注入行为，都是 Method Swizzling 能够大显身手的典型例子。还有许多其他场合也适合使用 Swizzling；Objective-C 开发者的经验越丰富，就越容易发现这些场合。

无论一个人出于*什么原因*、选择在*什么地方*使用 Swizzling，具体应当*怎样做*始终有几条绝对准则：

> **说明**
>
> 在计算机科学中，[指针重写（pointer swizzling）](https://en.wikipedia.org/wiki/Pointer_swizzling)是把基于名称或位置的引用转换为直接指针引用。Objective-C 为什么会使用这个术语，其起源并不完全清楚；不过，这个借用并不难理解，因为 Method Swizzling 所做的，正是通过 selector 改变函数指针的引用。

## `+load` 与 `+initialize`

**Swizzling 应当始终在 `+load` 中完成。**

Objective-C Runtime 会自动为每个类调用两个方法。类最初加载时会收到 `+load`，而 `+initialize` 会在应用第一次调用该类或该类实例上的方法之前被调用。这两个方法都是可选的，并且只有在实现了相应方法时才会执行。

因为 Method Swizzling 会影响全局状态，所以尽可能降低竞态条件出现的可能性非常重要。`+load` 保证在类初始化期间加载，这为改变整个系统的行为提供了一定程度的一致性。相比之下，`+initialize` 对何时执行并不提供这样的保证——事实上，如果应用从未直接向该类发送消息，它甚至可能*永远*不会被调用。

## `dispatch_once`

**Swizzling 应当始终在 `dispatch_once` 中完成。**

同样，因为 Swizzling 会改变全局状态，我们需要采取 Runtime 所能提供的一切防范措施。原子性是一项防范措施；即使跨越不同线程，也能保证代码恰好执行一次，则是另一项。Grand Central Dispatch 的 `dispatch_once` 同时提供了这两种理想行为；对于 Swizzling 来说，它应当像用于[初始化单例](https://nshipster.com/c-storage-classes/)时一样，被视为标准实践。

## Selector、Method 与 Implementation

在 Objective-C 中，*selector*、*method* 和 *implementation* 分别指 Runtime 的不同组成部分，尽管在日常讨论里，这些术语经常可以互换使用，泛指消息发送的过程。

Apple 的 [Objective-C Runtime Reference](https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/method_getImplementation) 对它们分别作出了如下说明：

> - Selector（`typedef struct objc_selector *SEL`）：Selector 用于表示方法在运行时的名称。方法 selector 是一个已经向 Objective-C Runtime 注册（或称“映射”）的 C 字符串。由编译器生成的 selector 会在类加载时由 Runtime 自动完成映射。
> - Method（`typedef struct objc_method *Method`）：表示类定义中一个方法的不透明类型。
> - Implementation（`typedef id (*IMP)(id, SEL, ...)`）：这种数据类型是一个指针，指向实现该方法的函数起始位置。该函数采用当前 CPU 架构所实现的标准 C 调用约定。第一个参数是指向 `self` 的指针（也就是这个类的特定实例所占用的内存；若为类方法，则是指向元类的指针）。第二个参数是方法 selector，随后才是方法本身的参数。

理解这些概念之间关系的最佳方式如下：一个类（`Class`）维护一张派发表，用来解析运行时发送的消息；表中的每个条目都是一个方法（`Method`），它把某个特定名称——即 selector（`SEL`）——映射到一个 implementation（`IMP`），后者是指向底层 C 函数的指针。

对一个方法进行 Swizzle，就是改变类的派发表，让来自现有 selector 的消息解析到另一份实现，同时把原方法实现作为别名绑定到一个新的 selector。

## 调用 `_cmd`

下面这段代码看起来可能会导致无限循环：

```objective-c
- (void)xxx_viewWillAppear:(BOOL)animated {
    [self xxx_viewWillAppear:animated];
    NSLog(@"viewWillAppear: %@", NSStringFromClass([self class]));
}
```

出人意料的是，它不会。在 Swizzling 过程中，`xxx_viewWillAppear:` 已经被重新指派给 `UIViewController -viewWillAppear:` 的原始实现。程序员看到一个方法在自身实现中向 `self` 调用同名方法，本能地亮起红灯，这是很好的直觉；但只要记得这里*真正*发生了什么，就会发现这段代码是合理的。不过，如果在这个方法里调用 `viewWillAppear:`，那就*会*造成无限循环，因为运行时会把当前方法的实现 Swizzle 到 `viewWillAppear:` selector 上。

> **警告**
>
> 请记得给 Swizzle 后的方法名加上前缀，就像对待任何可能发生冲突的 Category 方法一样。

## 注意事项

Swizzling 被广泛视为一种巫术般的技巧，容易带来不可预测的行为与未曾预见的后果。它虽然不是最安全的做法，但只要采取以下防范措施，Method Swizzling 仍然可以做到相当安全：

### 始终调用方法的原始实现（除非你有充分理由不这样做）

API 会对输入和输出作出契约，但两者之间的实现是一个黑箱。对方法进行 Swizzle 却不调用原始实现，可能会破坏有关私有状态的底层假设，继而让整个应用一同崩坏。

### 避免冲突

给 Category 方法加上前缀，并且务必确认你的代码库（或任何依赖项）里没有其他东西也在折腾同一块功能。

### 理解正在发生什么

不理解原理就直接复制粘贴 Swizzling 代码，不仅危险，也白白浪费了一次深入学习 Objective-C Runtime 的机会。通读 [Objective-C Runtime Reference](https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/method_getImplementation)，再浏览 `<objc/runtime.h>`，好好理解事情如何发生、为何发生。*始终努力用理解取代魔法式思维。*

### 谨慎行事

无论你对 Swizzle Foundation、UIKit 或其他任何内建框架多有信心，都要明白下一次版本发布就可能让一切崩溃。为此做好准备，并且多走一步，确保自己玩火时不会落得个 `NSBurned` 的下场。

---

和[关联对象](https://nshipster.com/associated-objects/)一样，Method Swizzling 是一种在需要时非常强大的技巧，但应当克制使用。

## 修订与反馈

**NSMutableHipster**

有问题？有修正意见？随时欢迎提交 [Issue](https://github.com/NSHipster/articles/issues) 和 [Pull Request](https://github.com/NSHipster/articles/blob/master/2014-02-17-method-swizzling.md)。

*本文最后一次审阅于 2015 年 1 月 28 日。*

## 原文作者

本文由 [Mattt](https://nshipster.com/authors/mattt/) 撰写。[Mattt](https://github.com/mattt)（[@mattt](https://twitter.com/mattt)）是一位居住在俄勒冈州波特兰的作家和开发者。
