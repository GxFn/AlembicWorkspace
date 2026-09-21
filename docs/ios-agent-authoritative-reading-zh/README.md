# Objective-C、Swift 与 AI Agent 权威资料中文精读库

本目录把经过筛选的英文权威资料整理成中文阅读稿：对许可明确且适合完整呈现的来源提供
完整中文译文，其余来源提供保留关键论证、机制和边界的中文精读摘要。

当前计划覆盖上一轮筛选出的 **69 个唯一来源**：

- Objective-C：20 篇；
- Swift：21 篇；
- AI Agent：28 篇。

## 文档类型

- **完整中文译文**：保留原文完整结构和内容，并在文首列出原文、许可、翻译日期和非官方
  改编说明。当前已完成 14 篇：
  - Swift：[03](swift/03-library-evolution.md)、[13](swift/13-whole-module-optimization.md)、
    [15](swift/15-ownership-manifesto.md)、[21](swift/21-swift-6-2-released.md)；
  - Objective-C：[12](objective-c/12-associated-objects.md)、
    [13](objective-c/13-method-swizzling.md)、[14](objective-c/14-objective-c-direct-methods.md)；
  - AI Agent：[04](ai-agent/04-react.md)、[05](ai-agent/05-coala.md)、
    [10](ai-agent/10-memgpt.md)、[11](ai-agent/11-lost-in-the-middle.md)、
    [13](ai-agent/13-twelve-factor-agents.md)、
    [25](ai-agent/25-camel-prompt-injection.md)、
    [26](ai-agent/26-owasp-agentic-top-10.md)。
- **中文精读摘要**：除上述完整译文外的文档。它们依据原文重组论证主线，但不是逐段全文
  翻译。Swift [10](swift/10-compiling-swift-generics.md) 的来源是 684 页未完稿书籍，仍按
  精读摘要处理，不把整本书冒充为一篇全文译文。

两类文档都保留原文入口；需要核对作者的原始措辞、代码、图表或实验设置时，请回到原作。

## 目录

- [阅读方法、证据层级与术语约定](00-reading-method-and-terms.md)
- [Objective-C 精读](objective-c/README.md)
- [Swift 精读](swift/README.md)
- [AI Agent 精读](ai-agent/README.md)
- [全部来源与文件映射](SOURCES.md)

## 三条主阅读路线

### Objective-C：从对象模型到动态能力

```text
对象、类与元类
→ 消息、selector 与 IMP
→ 方法查找、缓存和 objc_msgSend
→ 动态解析与消息转发
→ ARC、Autorelease Pool 与 Block
→ KVO、Swizzling、关联对象
→ 直接方法与 Swift 互操作
```

这条线路的核心问题是：

> 一次 Objective-C 消息发送怎样根据接收者的实际类型找到可以执行的实现？

### Swift：从调用目标到语言全景

```text
静态 / 直接派发
→ Class 虚派发
→ Protocol witness 派发
→ Objective-C 消息派发
→ 值语义与所有权
→ 泛型、some 与 any
→ 模块、ABI 与 resilience
→ Task、Actor、Executor 与数据竞争安全
```

这条线路始终区分：

- 语言规定的可观察语义；
- 编译器与 Runtime 的常见实现；
- 某次具体编译产生的优化结果。

### AI Agent：从模型调用到可控系统

```text
复合 AI 系统
→ Agent 与工作流的边界
→ 行动循环与工具
→ 上下文、状态和记忆
→ harness、暂停恢复与人工介入
→ 单 Agent 与多 Agent
→ 生产证据、评测和调试
→ 权限、沙箱与提示注入防御
```

这条线路的核心问题是：

> 一个会调用模型的程序，需要增加哪些状态、控制、工具、评测和安全边界，才能成为
> 可调试、可恢复、可验证的 Agent 系统？

## 怎样判断不同来源

目录中的来源不会被视为同等强度：

- 语言设计者、编译器和 Runtime 工程师的资料用于解释设计与实现；
- Apple/Swift/LLVM 的工程演讲用于校准平台和工具链；
- 同行评审论文用于理解经过限定的实验结果；
- 大型团队复盘用于观察真实工程约束；
- 独立深度文章用于建立直觉，但会标明需要交叉确认的简化；
- 立场文章用于暴露取舍和反例，不会被写成行业定律。

## 使用建议

第一次阅读时，不必按 69 篇顺序通读。先进入相应主题的 `README.md`，沿“主干”阅读；
遇到具体问题，再进入进阶实现、历史原点或生产复盘。

如果某条结论将用于正式文档或工程决策，至少同时检查：

1. 原文属于哪个证据层级；
2. 作者讨论的版本、平台、模型或任务范围；
3. 精读稿标出的过时点与不可外推范围；
4. 原文是否在之后出现修订或反方证据。
