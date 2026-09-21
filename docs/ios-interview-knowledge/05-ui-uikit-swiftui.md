# App 与用户体验：UIKit、SwiftUI、状态和渲染

> 知识树定位：D1 UIKit、D2 SwiftUI、D3 体验完整性、D4 媒体与设备能力；底层依赖 A3/A4，状态依赖 C，质量验证依赖 F。

## 1. 顶层模型

UI 系统的完整链路是：

```text
用户/系统输入
→ Intent / Action
→ 业务规则与副作用
→ 状态变化
→ UIKit 命令式更新 / SwiftUI 依赖失效
→ layout / drawing / commit
→ 屏幕显示
→ 无障碍、日志和指标反馈
```

面试中只谈控件 API 会遗漏三个更重要的问题：

- 状态归谁所有；
- 异步结果怎样避免过期；
- UI 更新怎样被测试和测量。

## 2. UIKit 对象层级

```text
UIApplication / Scene
└─ UIWindow
   └─ Root UIViewController
      ├─ Child UIViewController
      └─ UIView hierarchy
         └─ CALayer hierarchy
```

- Window/Scene 决定 UI 实例边界；
- View Controller 管理一块界面的生命周期、导航和协调；
- View 负责布局、绘制语义和事件；
- Layer 负责可合成内容和动画属性；
- Model 不应依赖具体 View Controller 才能工作。

## 3. UIViewController 生命周期

| 回调 | 语义 | 合适工作 |
| --- | --- | --- |
| `loadView` | 创建根 View | 纯代码创建或装载视图 |
| `viewDidLoad` | 根 View 已装载 | 一次性绑定、子视图配置 |
| `viewWillAppear` | 即将可见 | 轻量刷新、导航栏同步 |
| `viewDidAppear` | 已显示 | 依赖实际显示的埋点或动画 |
| `viewWillDisappear` | 即将离开 | 提交输入、暂停交互 |
| `viewDidDisappear` | 已离开 | 停止仅服务于当前可见界面的工作 |
| `viewWillLayoutSubviews` / `viewDidLayoutSubviews` | 布局前后 | 依赖最终几何的少量调整 |

生命周期可能多次调用。网络请求是否跟随“View 加载”“页面可见”还是“业务会话”结束，取决于产品语义。

### 3.1 Container

自定义容器需要正确执行：

- `addChild(_:)`；
- 加入 child view；
- 建立布局；
- `didMove(toParent:)`；
- 移除时执行反向流程。

只把 child view 加进层级而不维护 View Controller containment，会破坏生命周期和系统行为。

## 4. Auto Layout 与动态布局

从两个轴分别分析约束自由度：

1. 水平位置和宽度是否确定；
2. 垂直位置和高度是否确定；
3. intrinsic content size 是否参与；
4. hugging / compression resistance 是否表达了内容优先级；
5. 多语言、Dynamic Type 和长文本是否仍成立。

性能原则：

- 复用约束，不在滚动中重复创建完整约束树；
- 避免无意义的 `layoutIfNeeded()` 链；
- 自定义 size calculation 要缓存且以真实输入作为 key；
- 先用 Instruments/Time Profiler 证明布局是热点。

## 5. 列表与复用

一个正确的异步 Cell 配置合同：

```text
configure(modelID)
→ 立即渲染同步占位状态
→ 启动与 modelID 绑定的可取消任务
→ 复用/离屏时取消
→ 回调检查当前 modelID / generation
→ 主执行域更新
```

常见错误：

- Cell 自己保存 IndexPath 作为业务身份；
- 图片回调不检查复用后的模型；
- 在 `cellForItemAt` 同步解码大图；
- diff snapshot 在多个线程无序提交；
- 预取只增加请求，没有取消和限流；
- 高度缓存没有把字体、宽度、内容版本纳入 key。

Diffable Data Source 简化差异更新，但快照身份必须稳定，Hash 不能依赖频繁变化字段。

## 6. UIKit 导航

需要区分：

- push/pop：层级导航；
- present/dismiss：模态流程；
- child containment：同一界面组合；
- coordinator/router：把跨页面流程从单个页面移出；
- deep link：从外部状态恢复到目标路由。

路由设计至少包含：

- 类型安全的 destination；
- 参数和权限校验；
- 登录/数据预条件；
- 多 Scene 选择；
- 失败和恢复；
- 可测试的导航结果。

## 7. SwiftUI 心智模型

SwiftUI View 是界面描述值，不是长期存活的 UIKit View 对象。框架根据：

- View identity；
- 状态和环境依赖；
- 容器结构；
- 数据变更；

决定哪些描述需要重新计算、哪些底层存储和平台视图可以复用。

### 7.1 Identity

- 结构身份来自 View 树位置和类型；
- 显式身份来自 `id` / `Identifiable`；
- 身份不稳定会导致状态重置、动画异常和列表性能问题；
- 不要用随机 UUID 作为每次 body 计算的身份。

### 7.2 State ownership

| 工具 | 所有权 | 适用 |
| --- | --- | --- |
| `@State` | 当前 View 身份管理本地状态 | 短生命周期 UI 状态、Observable 实例 |
| `@Binding` | 借用外部可变状态 | 子 View 编辑父级 source of truth |
| `@Environment` | 从环境读取依赖/Observable | 跨层共享、系统环境 |
| `@Observable` | 为引用模型生成 Observation 支持 | 新系统上的细粒度可观察模型 |
| `@StateObject` | 旧 Observation 模型由 View 创建并持有 | `ObservableObject` 生命周期 |
| `@ObservedObject` | 旧 Observation 模型由外部持有 | 观察但不拥有 |

Observation 与 `ObservableObject` 的工具组合不同，不能只看属性包装器名字机械迁移。部署版本和团队模型决定采用哪套。

### 7.3 `body`

`body` 应：

- 快速、确定；
- 不执行网络、磁盘或不可重放副作用；
- 不创建不稳定身份；
- 不把昂贵格式化和大数据变换重复放在热路径；
- 通过 action、task 和模型层触发副作用。

“body 会多次调用”不是问题；无法控制的副作用和高成本才是问题。

## 8. SwiftUI 导航与生命周期

导航状态应建模为可恢复数据，而不是散落的布尔值。考虑：

- path / destination 的类型；
- deep link 到 path 的映射；
- sheet/cover 与 push 的互斥；
- 异步权限或登录前置；
- 状态恢复；
- 多窗口独立导航。

`.task` 通常随 View 身份管理任务并支持取消，但业务是否需要更长生命周期仍要由上层所有权决定。

## 9. UIKit 与 SwiftUI 互操作

### 9.1 SwiftUI 使用 UIKit

- `UIViewRepresentable` / `UIViewControllerRepresentable`；
- Coordinator 处理 delegate 和回调；
- `make` 创建，`update` 同步状态；
- 避免每次 update 重建昂贵对象；
- 明确 UIKit 对象的可变状态与 SwiftUI source of truth。

### 9.2 UIKit 使用 SwiftUI

- `UIHostingController` 承载 SwiftUI；
- 明确 safe area、size、navigation 和生命周期；
- 渐进迁移时用稳定边界按页面或组件替换；
- 性能、可访问性、埋点和自动化测试要保持等价。

迁移完成定义是“行为和质量等价或提升”，不是“代码已经改成 SwiftUI”。

## 10. 单向数据流

一个可测试结构：

```text
View
→ Action
→ Reducer / ViewModel / UseCase
→ Effect
→ Repository / Service
→ Result
→ New State
→ View
```

关键不在模式名字，而在：

- source of truth 唯一；
- 状态转换可观察；
- 副作用可替换；
- 旧请求不会覆盖新状态；
- 错误、空态、加载和取消都被建模。

## 11. 可访问性与国际化

### 11.1 Accessibility

- 语义标签、值、提示和 trait；
- 合理的元素组合与阅读顺序；
- Dynamic Type；
- 颜色对比和非颜色提示；
- VoiceOver、Switch Control、Reduce Motion；
- 自定义控件必须补充语义和操作。

### 11.2 Localization

- 不拼接可翻译句子；
- 使用复数和格式化规则；
- 日期、时区、货币和数字由 Locale/Calendar 处理；
- 支持 RTL；
- 用伪本地化、长文本和不同日历测试；
- 服务端时间保存为明确时区/时间戳，显示时转换。

## 12. 媒体与系统能力

### 图片

- 按显示尺寸降采样；
- 网络、磁盘、内存缓存分层；
- 解码和格式成本；
- 复用取消、请求合并；
- 内存 warning 清理策略。

### 音视频

- 播放状态机；
- buffer 与网络自适应；
- time observer 生命周期；
- 音频 session、中断和后台；
- DRM、字幕和画中画；
- 首帧、卡顿、失败率指标。

### 设备能力

相机、定位、蓝牙等都要同时回答：

- 权限前置说明；
- denied/restricted/limited；
- 前后台行为；
- 电量和隐私；
- 设备不支持或服务不可用；
- 数据上传和保留策略。

## 13. 高频问题

### Q1：SwiftUI 为什么会丢失某个子 View 的状态？

优先检查 identity 是否变化、View 是否移出结构位置、显式 `id` 是否不稳定、状态所有权是否放错层。

### Q2：Cell 为什么会显示错图？

异步结果与复用后的模型身份不一致；需要取消、请求 token/generation 和回调身份检查。

### Q3：UIKit 和 SwiftUI 如何选？

根据部署版本、团队经验、现有资产、交互复杂度、性能证据和迁移成本；可渐进混合，不做信仰判断。

### Q4：ViewModel 是否一定正确？

不一定。要看是否真正隔离了 UI、业务、状态和副作用，是否变成巨型对象，是否可测试。

### Q5：如何验证无障碍质量？

真实 VoiceOver/动态字体/辅助功能设置、Accessibility Inspector、自动化检查与核心流程人工走查结合。

