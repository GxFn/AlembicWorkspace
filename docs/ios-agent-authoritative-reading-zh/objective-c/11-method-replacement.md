# 方法替换：从继承到 IMP 改写

- **Original title**: Friday Q&A 2010-01-29: Method Replacement for Fun and Profit
- **原文链接**: [原文](https://www.mikeash.com/pyblog/friday-qa-2010-01-29-method-replacement-for-fun-and-profit.html)
- **作者 / 机构**: Mike Ash
- **年份**: 2010
- **材料类型**: Runtime 工程实践文章
- **文档性质**: 忠实中文精读，不是原文全文翻译

## 文章要解决的问题

正常覆写依靠子类，但有时对象由系统或第三方代码创建，调用方无法让它实例化你的子类。原文比较几种“改变既有类行为”的路径，重点不是炫技，而是解释每种方案如何处理原实现、继承链和全局副作用。

## 原文论证主线

最安全的方案仍是继承，但它要求控制实例创建。旧 Runtime 的 class posing 曾能让子类冒充父类，文章写作时已被现代 64 位和 iPhone Runtime 移除。Category 可以给现有类增加同名方法，却无法可靠调用被覆盖的原实现；若原类或其他 Category 也提供同名方法，谁生效没有应当依赖的保证。

Swizzling 的做法是给新实现一个不同 selector，再交换两个 selector 对应的 IMP。新方法内部看似调用自己，实际由于映射已经互换，调用的是旧实现。通用实现必须区分目标类自己实现方法和仅从父类继承方法两种情况：若直接交换从 `class_getInstanceMethod` 获得的父类 Method，可能把父类及所有其他子类一起改掉。文章用 `class_addMethod` 探测并在目标类上落下独立条目，再进行替换。

作者随后提出直接保存旧 IMP 的变体：把旧实现放进类型正确的函数指针，再把 selector 映射到新的 C 函数。这样调用旧实现更直观，也能保留原 `_cmd`，但需要调用者正确处理签名和多方 Hook 链。

## 关键机制与结论

方法替换的本质是修改类级别的 selector→IMP 映射，而不是改某个实例。继承方法与本类方法的归属差异决定修改范围；调用 IMP 时，`self`、`_cmd`、参数与返回 ABI 必须完全匹配。Category 同名覆盖、Swizzling 和直接 IMP 替换不是三种等价写法，而是在可组合性、可回调原实现和风险上不同的工具。

## 准确性 / 版本边界

文章评论随后指出了简化代码、返回旧 IMP、多重 Hook 和错误 `_cmd` 等边界，说明正文片段不应被复制成生产库。2010 年的 AppKit 示例、posing 与部分调用约定已历史化；`objc_direct` 方法也不能参与普通 Runtime 替换。修改不拥有的系统类可能在任意系统版本破坏私有不变量，应优先使用组合、Delegate、公开扩展点或可控子类。

## 在知识体系中的位置

本篇是 Swizzling 的原理主干，比只给代码模板的文章更适合理解“为何要先 add 再 replace”。随后可读 NSHipster 的实践清单和 Apple 现代相对方法列表演讲。
