# 编译 Swift 泛型

- **Original title**: Compiling Swift Generics
- **原文链接**: [Swift.org PDF](https://download.swift.org/docs/assets/generics.pdf)
- **作者/机构**: Slava Pestov / Swift 编译器团队
- **年份**: 2025
- **材料类型**: 编译器专著（持续更新，684 页）
- **文档性质**: 忠实中文精读，不是原文全文翻译

## 文章要解决的问题

Swift 泛型表面上只有参数、约束、协议和关联类型，编译器内部却必须回答更严格的问题：两个依赖类型何时相等，约束能推出什么隐含事实，一组替换是否满足声明，某个成员引用应解析成什么类型，以及怎样让这些判断规范、终止并可缓存。该书为这些问题建立统一术语和算法框架。

## 原文论证主线

全书先介绍编译流水线、模块、request evaluator，以及类型和声明在编译器中的表示；继而定义 generic signature、type parameter、requirement、substitution map、conformance、archetype 和 generic environment。中后部说明如何收集、最小化并比较约束，最后用 requirement machine 把协议与关联类型关系转成重写系统，通过规范形判断等价和推导关系。

## 关键机制与结论

generic signature 不只是源码 `where` 子句的文本，而是声明可依赖的完整约束环境。substitution map 把抽象参数替换为具体或另一组上下文类型，并同时携带所需一致性；conformance 描述一个类型如何满足协议及其关联类型见证。规范化至关重要：编译器需要让同一语义关系得到稳定表示，才能正确缓存查询、比较重载、序列化模块并生成后续中间表示。

## 准确性与版本边界

这是专著的结构性精读，不能替代原书算法、证明和源码索引。作者说明主体大多更新到 Swift 6.2，但没有完整覆盖参数包、非复制类型、非逃逸类型和整数泛型；这些应另读对应 Evolution 提案。书的重点是泛型语义与编译器实现，运行时元数据布局和泛型优化并非其完整主题，需配合《Implementing Swift Generics》等材料。

## 在知识体系中的位置

它是本资料集中最深入的泛型来源，适合编译器开发、复杂诊断定位和高级语言面试。应用开发者可优先读导论、编译模型、generic signature、substitution 与 conformance 章节；只有需要理解递归协议约束和 requirement machine 时，再进入重写系统与数学部分。
