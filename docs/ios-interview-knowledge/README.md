# iOS / Objective-C / Swift 面试知识库

这是一套面向 iOS 面试的系统化中文资料，也可以作为面试 Agent 的检索知识库。全库采用“顶层目标 → 领域 → 能力域 → 主题 → 检查点”的统一知识树，不是若干互不关联的文章。

请先阅读 [00-knowledge-system-map.md](00-knowledge-system-map.md)。它是全库的权威分类入口，后续专题都从其中的 A～H 节点向下展开。

内容不以背 API 为目标，而是帮助回答四个问题：

1. 结论是什么；
2. 底层机制为什么会产生这个结论；
3. 方案在什么边界下成立；
4. 如何用代码、工具或线上证据验证。

资料基线检查日期为 **2026-07-26**。Swift 语言部分以已更新至 Swift 6.3 的官方 Swift Book 为基准；iOS API 以 Apple 当前文档为基准。具体项目仍需结合 Deployment Target、Xcode/Swift 版本和团队约束判断。

## 文档地图

| 文档 | 主题 | 面试目标 |
| --- | --- | --- |
| [00-knowledge-system-map.md](00-knowledge-system-map.md) | L0～L4 全景知识树、节点依赖、覆盖矩阵 | 先建立完整地图，再向下钻取 |
| [01-computer-science-foundations.md](01-computer-science-foundations.md) | 数据结构、算法、OS、网络、数据库、编译链接 | 给所有 iOS 专题建立底层根基 |
| [01-ios-system-fundamentals.md](01-ios-system-fundamentals.md) | 进程、启动、生命周期、Run Loop、事件与渲染 | 解释系统怎样运行一个 iOS App |
| [02-objective-c-runtime-and-memory.md](02-objective-c-runtime-and-memory.md) | Runtime、消息转发、ARC、Block、KVC/KVO | 说清 OC 动态性与对象生命周期 |
| [03-swift-language-and-runtime.md](03-swift-language-and-runtime.md) | 类型系统、协议、泛型、内存语义、派发 | 从“会写 Swift”提升到“理解 Swift” |
| [04-concurrency.md](04-concurrency.md) | GCD、锁、Operation、Swift Concurrency | 设计无死锁、无数据竞争的并发代码 |
| [05-ui-uikit-swiftui.md](05-ui-uikit-swiftui.md) | UIKit、SwiftUI、状态、布局、列表与渲染 | 回答 UI 架构和流畅度问题 |
| [06-network-storage-security.md](06-network-storage-security.md) | 网络、缓存、持久化、安全与离线 | 完成端到端客户端方案设计 |
| [07-performance-debugging-testing.md](07-performance-debugging-testing.md) | Instruments、崩溃、性能与测试 | 用证据定位问题，而不是凭感觉优化 |
| [08-architecture-and-system-design.md](08-architecture-and-system-design.md) | 架构、模块化、迁移、系统设计案例 | 应对高级/资深工程师面试 |
| [09-interviewer-agent-playbook.md](09-interviewer-agent-playbook.md) | Agent 提问、追问、评分与防幻觉 | 让 Agent 像合格面试官一样工作 |
| [10-question-bank.md](10-question-bank.md) | 分层题库与答案要点 | 快速自测和模拟面试 |
| [11-study-and-mock-plan.md](11-study-and-mock-plan.md) | 30 天计划、模拟流程、复盘表 | 把知识转化为稳定表达 |
| [references.md](references.md) | Apple / Swift 官方资料 | 复核版本敏感事实 |

## 顶层方向

| 节点 | 方向 | 解决的问题 |
| --- | --- | --- |
| A | 计算机科学与 Apple 平台 | 从算法、OS、网络、数据库到 App 装载、调度和显示 |
| B | 语言、Runtime 与内存 | OC/Swift 代码如何表达、派发和管理生命周期 |
| C | 并发、异步与状态 | 多任务下如何保证顺序、一致性和取消 |
| D | App 功能与用户体验 | 如何构建 UIKit/SwiftUI 与完整交互 |
| E | 数据、网络与安全 | 如何获取、保存、同步和保护数据 |
| F | 质量、性能与诊断 | 如何用证据证明正确、稳定和流畅 |
| G | 架构、工程与演进 | 如何控制复杂度并持续交付迁移 |
| H | 系统设计、业务与 Agent | 如何解决真实问题并完成面试评估 |

## 推荐使用方式

### 7 天冲刺

- 第 1 天：计算机基础、iOS 系统与生命周期；
- 第 2 天：Objective-C Runtime 与内存；
- 第 3 天：Swift 类型系统与内存语义；
- 第 4 天：并发；
- 第 5 天：UI、网络、存储、安全；
- 第 6 天：性能、调试、测试；
- 第 7 天：系统设计与两轮模拟面试。

### 30 天系统复习

按 [11-study-and-mock-plan.md](11-study-and-mock-plan.md) 执行。每天至少完成：

- 一个概念的 90 秒口述；
- 一个最小代码例子；
- 一个失败或反例；
- 一个验证工具或指标；
- 三道追问。

## 通用答题结构

面试题先用下面的结构组织，不要一上来堆名词。

```text
1. 结论：先给可执行答案。
2. 机制：说明对象、线程、队列、状态或调用链如何工作。
3. 边界：指出版本、生命周期、并发、失败路径和成本。
4. 方案：给首选方案和至少一个备选方案。
5. 验证：说明用什么测试、日志、Instruments 或线上指标证明。
```

例如“如何解决列表卡顿”不能只回答“异步加载图片”：

> 我先把卡顿分为主线程长任务、过度布局、图片解码、视图更新过频和 GPU 渲染五类。用 Hitches、Time Profiler 和 signpost 找到具体帧及主线程调用栈，再在对应边界修复。图片请求要支持复用取消、尺寸降采样和缓存；布局要减少重复计算；最后用同一设备、同一数据集和 XCTest 指标回归。

## 能力层级

| 层级 | 应达到的表达 |
| --- | --- |
| 初级 | 能正确描述 API 的用途和常见写法 |
| 中级 | 能解释生命周期、线程、内存、状态传播和失败路径 |
| 高级 | 能比较方案、量化成本、设计验证并处理迁移与兼容 |
| 资深 | 能把业务目标映射为架构边界、指标、组织协作和演进计划 |

## 知识库约定

- `结论`：适合先说出的面试答案；
- `机制`：支持结论的系统行为；
- `误区`：常见但不完整或错误的说法；
- `追问`：面试官用于区分理解深度的问题；
- `验证`：可以落地的工具、测试或指标；
- `版本提示`：需要结合工具链复核的内容。

## 范围与非目标

覆盖 UIKit 与 SwiftUI、Objective-C 与 Swift、传统并发与 Swift Concurrency，以及移动端架构和 AI Agent 面试官使用规范。

不追求：

- 穷举全部系统 API；
- 把某个第三方框架当作唯一正确答案；
- 用未经测量的“性能更好”代替证据；
- 把历史 Runtime 实现细节当成永远不变的 ABI 合同；
- 用背诵标准答案代替对真实项目的复盘。
