# 关联对象（Associated Objects）

- **原文标题：** Associated Objects
- **作者：** [Mattt](https://nshipster.com/authors/mattt/) / NSHipster
- **原文链接：** [NSHipster — Associated Objects](https://nshipster.com/associated-objects/)
- **原文发布日期：** 2014 年 2 月 10 日
- **许可协议：** [Creative Commons Attribution-NonCommercial 4.0 International（CC BY-NC 4.0）](https://creativecommons.org/licenses/by-nc/4.0/)
- **翻译日期：** 2026-07-27
- **文档性质：** 非官方中文翻译
- **修改说明：** 本文是对原文所作的中文改编，仅翻译说明文字，代码与标识符保持原样。译文仅可用于非商业用途；转载或继续改编时，须保留原作者署名、原文链接、许可链接，并说明已作修改。

```objective-c
#import <objc/runtime.h>
```

Objective-C 开发者早已养成习惯：看到这句不祥的咒语后，无论接下来出现什么，都要多加警惕。这种警惕不无道理——摆弄 Objective-C Runtime，会改变运行于其上的所有代码赖以存在的现实结构。

在正确的人手中，`<objc/runtime.h>` 中的函数有潜力为应用或框架增添强大的新行为，并且这些行为用其他方式根本无法实现。在错误的人手中，它则会耗尽代码以及所有与之交互之物的所谓[理智值](https://en.wikipedia.org/wiki/Eternal_Darkness:_Sanity's_Requiem#Sanity_effects)，还会带来[骇人的副作用](https://www.youtube.com/watch?v=RSXcajQnasc#t=0m30s)。

因此，我们带着极大的惶恐来审视这桩[浮士德式交易](https://en.wikipedia.org/wiki/Deal_with_the_Devil)，并讨论 NSHipster 读者最常点名希望看到的主题之一：关联对象。

---

关联对象（Associated Objects）——最初称为“关联引用”（Associative References）——是 Objective-C 2.0 Runtime 的一项特性，随 OS X Snow Leopard 引入（iOS 4 起可用）。这个术语指的是 `<objc/runtime.h>` 中声明的以下三个 C 函数；它们允许对象在运行时把任意值与键关联起来：

- `objc_setAssociatedObject`
- `objc_getAssociatedObject`
- `objc_removeAssociatedObjects`

这有什么用？它让开发者能够**通过 Category 给现有类添加自定义属性**，而这恰好弥补了 [Objective-C 一个显著的缺憾](https://developer.apple.com/library/ios/documentation/cocoa/conceptual/ProgrammingWithObjectiveC/CustomizingExistingClasses/CustomizingExistingClasses.html)。

```objective-c
@interface NSObject (AssociatedObject)
@property (nonatomic, strong) id associatedObject;
@end

@implementation NSObject (AssociatedObject)
@dynamic associatedObject;

- (void)setAssociatedObject:(id)object {
     objc_setAssociatedObject(self, @selector(associatedObject), object, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (id)associatedObject {
    return objc_getAssociatedObject(self, @selector(associatedObject));
}
```

人们经常建议用一个 `static char` 作为键——更理想的做法是使用指向它的指针。归根结底，键可以是任何保证恒定、唯一，并且作用域限定在 getter 和 setter 所用范围内的值：

```objective-c
static char kAssociatedObjectKey;

objc_getAssociatedObject(self, &kAssociatedObjectKey);
```

不过，还有一个简单得多的办法：直接使用 selector。

> 由于 `SEL` 保证唯一且恒定，你可以把 `_cmd` 用作 `objc_setAssociatedObject()` 的键。[#objective](https://twitter.com/search?q=%23objective&src=hash)-c [#snowleopard](https://twitter.com/search?q=%23snowleopard&src=hash)
>
> ——Bill Bumgarner（@bbum），[2009 年 8 月 28 日](https://twitter.com/bbum/statuses/3609098005)

## 关联对象的行为

可以按照枚举类型 `objc_AssociationPolicy` 所定义的行为，把值关联到对象上：

| 行为 | 对应的 `@property` | 说明 |
| --- | --- | --- |
| `OBJC_ASSOCIATION_ASSIGN` | `@property (assign)` 或 `@property (unsafe_unretained)` | 指定对关联对象的弱引用。 |
| `OBJC_ASSOCIATION_RETAIN_NONATOMIC` | `@property (nonatomic, strong)` | 指定对关联对象的强引用，并且关联操作不是原子的。 |
| `OBJC_ASSOCIATION_COPY_NONATOMIC` | `@property (nonatomic, copy)` | 指定复制关联对象，并且关联操作不是原子的。 |
| `OBJC_ASSOCIATION_RETAIN` | `@property (atomic, strong)` | 指定对关联对象的强引用，并且关联操作是原子的。 |
| `OBJC_ASSOCIATION_COPY` | `@property (atomic, copy)` | 指定复制关联对象，并且关联操作是原子的。 |

通过 `OBJC_ASSOCIATION_ASSIGN` 建立的对象弱关联并不是会自动置零的 `weak` 引用，而是采用与 `unsafe_unretained` 类似的行为。这意味着，在实现中访问弱关联对象时应当格外谨慎。

> **说明**
>
> 根据 [WWDC 2011 Session 322](https://asciiwwdc.com/2011/sessions/322)（约 36:00）介绍的释放时间线，关联对象会在对象生命周期中出人意料地晚才被清除——具体是在 `object_dispose()` 中，而这个函数由 `NSObject -dealloc` 调用。

## 移除值

初次尝试关联对象时，你可能会忍不住在某个地方调用 `objc_removeAssociatedObjects()`。然而，[正如文档所述](https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/objc_removeAssociatedObjects)，你大概不会遇到需要亲自调用它的场合：

> 这个函数的主要用途，是让对象能够方便地恢复到“原始状态”。不应使用这个函数来执行从对象中移除关联的一般操作，因为它还会移除其他调用方可能已经添加到该对象上的关联。通常，应当通过向 `objc_setAssociatedObject` 传入 `nil` 值来清除某项关联。

## 使用模式

### 添加私有变量，以支持实现细节

扩展内建类的行为时，可能需要记录额外状态。这正是关联对象的*教科书式*用例。

### 添加公开属性，用于配置 Category 的行为

有时，相比把配置作为方法参数，通过属性让 Category 的行为更加灵活会更合理。在这种情况下，使用关联对象实现面向外部的公开属性是可以接受的。

### 为 KVO 创建一个关联的观察者

在 Category 的实现中使用 [KVO](https://nshipster.com/key-value-observing/) 时，建议使用一个自定义关联对象充当观察者，而不是让对象观察自己。

## 反模式

### 在并不需要该值时存储关联对象

视图中有一种常见模式：创建一个便捷方法，根据模型对象或复合值填充字段与属性。如果之后不需要再次取回这个值，那么不把它与对象关联起来不仅可以接受，而且确实是更好的做法。

### 在能够推导出该值时存储关联对象

例如，为了在 `tableView:accessoryButtonTappedForRowWithIndexPath:` 中使用，有人可能会想保存自定义 accessory view 所属 `UITableViewCell` 的引用；然而，这个 cell 可以通过调用 `cellForRowAtIndexPath:` 取得。

### 使用关联对象来代替 *X*

……这里的 X 可以是下列任意一种方案：

- 当继承比组合更合理时，使用[子类化](https://developer.apple.com/library/ios/documentation/cocoa/conceptual/ProgrammingWithObjectiveC/CustomizingExistingClasses/CustomizingExistingClasses.html)。
- 为响应者添加交互事件时，使用 [Target-Action](https://developer.apple.com/library/ios/documentation/general/conceptual/Devpedia-CocoaApp/TargetAction.html)。
- 当 Target-Action 不足以满足需求时，使用[手势识别器](https://developer.apple.com/library/ios/documentation/EventHandling/Conceptual/EventHandlingiPhoneOS/GestureRecognizer_basics/GestureRecognizer_basics.html)。
- 当行为可以交给另一个对象处理时，使用[委托](https://developer.apple.com/library/ios/documentation/general/conceptual/DevPedia-CocoaCore/Delegation.html)。
- 需要以松耦合方式在系统各处传递事件时，使用 [`NSNotification` 与 `NSNotificationCenter`](https://nshipster.com/nsnotification-and-nsnotificationcenter/)。

---

关联对象应当被视为最后的手段，而不是一个拿着方案到处寻找问题的做法（而且说到底，Category 本身一开始也不应该位于工具选择顺序的最前面）。

与任何聪明技巧、hack 或变通方案一样，人们天然会主动寻找使用它的机会——尤其是在刚刚学会它之后。请尽力理解并辨别它何时才是正确方案，以免有人轻蔑地问你：“看在 `$DEITY` 的份上，你为什么偏偏选了*那个*方案？”到那时才感到难堪。

## 修订与反馈

**NSMutableHipster**

有问题？有修正意见？随时欢迎提交 [Issue](https://github.com/NSHipster/articles/issues) 和 [Pull Request](https://github.com/NSHipster/articles/blob/master/2014-02-10-associated-objects.md)。

## 原文作者

本文由 [Mattt](https://nshipster.com/authors/mattt/) 撰写。[Mattt](https://github.com/mattt)（[@mattt](https://twitter.com/mattt)）是一位居住在俄勒冈州波特兰的作家和开发者。
