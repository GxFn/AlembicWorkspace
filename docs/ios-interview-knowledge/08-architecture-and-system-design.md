# 架构、工程与系统设计

> 知识树定位：G1 架构原则、G2 分层、G3 模式、G4 模块化、G5 演进、G6 交付；系统设计方法关联 H1/H2。

## 1. 顶层判断

架构的目标不是使用最多模式，而是让重要变化：

- 发生在可预测的位置；
- 不破坏无关模块；
- 能被测试；
- 能被观测；
- 能逐步发布和回滚；
- 团队能理解并持续维护。

先问：

1. 产品最常变化什么；
2. 哪些质量属性最重要；
3. 哪些依赖最不稳定；
4. 哪些状态必须一致；
5. 当前团队和时间能承担多少复杂度。

## 2. 架构质量属性

| 属性 | 设计问题 |
| --- | --- |
| 正确性 | 状态不变量在哪里维护 |
| 可测试性 | 副作用和时间能否替换 |
| 可维护性 | 一个变化涉及多少模块 |
| 性能 | 关键路径和预算在哪里 |
| 可靠性 | 失败、重试、恢复是否明确 |
| 安全 | 信任边界和敏感数据在哪里 |
| 可观测性 | 能否看到真实调用链和状态 |
| 交付性 | 能否灰度、回滚、兼容迁移 |

## 3. 分层与依赖方向

一种常见但非强制的结构：

```text
App / Composition Root
├─ Presentation
│  ├─ View
│  └─ ViewModel / Presenter / Store
├─ Domain
│  ├─ Entity / Value
│  └─ Use Case / Policy
├─ Data
│  ├─ Repository
│  ├─ DTO / Mapping
│  └─ Cache / Persistence adapter
└─ Infrastructure
   ├─ HTTP client
   ├─ Database
   ├─ Analytics
   └─ Apple platform service
```

Domain 是否值得独立取决于业务复杂度。简单 CRUD 页面不必制造空洞 UseCase；复杂规则也不应塞进 ViewModel。

## 4. Source of Truth 与状态所有权

每份可变状态要回答：

- 谁创建；
- 谁拥有；
- 谁可修改；
- 谁只读观察；
- 生命周期；
- 持久化位置；
- 跨线程隔离；
- 冲突处理；
- 销毁和清理。

重复状态会产生同步成本。派生值优先计算或缓存，不要无依据地再存一份。

## 5. 依赖注入

依赖注入的价值：

- 依赖显式；
- 构造时保证不变量；
- 替换测试实现；
- 把具体实现选择集中在 composition root。

方式：

- initializer injection：首选，依赖完整；
- method injection：一次调用所需依赖；
- property injection：生命周期可变但更难保证；
- environment/service locator：方便但依赖隐藏，需严格边界。

协议不是越多越好。只为测试而给每个类创建一比一协议会增加维护成本；在真实替换边界抽象。

## 6. 模式比较

| 模式 | 优势 | 风险 | 适用 |
| --- | --- | --- | --- |
| MVC | 简单、贴近 UIKit | Controller 膨胀 | 小页面、清晰分工 |
| MVVM | 展示状态可测试、适合绑定 | ViewModel 变成万能层 | 状态驱动页面 |
| MVP | View 接口明确 | 胶水代码多 | 强测试需求的命令式 UI |
| VIPER | 职责细、路由明确 | 文件和协调成本高 | 大团队稳定复杂流程 |
| Redux/UDF | 状态变化可追踪 | 全局 Store、样板和性能 | 复杂状态与时间旅行需求 |
| Clean | 依赖方向清晰 | 容易形式主义 | 业务规则复杂、长期演进 |

正确问题不是“哪个最好”，而是“当前变化和失败会落在哪一层”。

## 7. 模块化

### 7.1 切分维度

- Feature：按业务能力；
- Layer：按技术层；
- Capability：网络、日志、设计系统等共享能力；
- Product：不同 App/品牌；
- Platform：iOS、Widget、Extension。

大型项目常组合：顶层按 Feature，内部按必要层次，共享稳定 Capability。

### 7.2 模块合同

- 最小 public API；
- 数据类型和错误；
- 线程/Actor 隔离；
- 生命周期；
- 资源访问；
- 版本兼容；
- 指标和测试；
- 禁止的反向依赖。

### 7.3 循环依赖

修复方法：

- 提取更低层稳定合同；
- 用事件/回调反转依赖；
- composition root 连接双方；
- 重新划分 ownership；
- 不用全局 service locator 把编译期循环变成运行时隐式循环。

## 8. 构建与包管理

要理解：

- SPM target/product/dependency；
- static/dynamic linking 的启动、体积和分发取舍；
- XCFramework 的多平台二进制封装；
- module interface、ABI 和 source compatibility；
- 代码生成、macro/plugin 对构建图的影响；
- clean build 与 incremental build；
- Derived Data/remote cache 的可复现性。

优化构建前先用 Build Timing Summary 或构建日志定位瓶颈。

## 9. 渐进迁移

### 9.1 通用策略

1. 冻结现状与完成定义；
2. 建立兼容边界；
3. 选择可独立验证的垂直切片；
4. 新旧路径并存时明确 source of truth；
5. 灰度或影子验证；
6. 证明消费者已切换；
7. 最后删除旧实现；
8. 保留回滚和数据兼容。

### 9.2 OC → Swift

- 先改善 nullability、generics、命名；
- 从叶子模块或稳定边界迁移；
- 不同时重写所有架构；
- 对 ObjC 可见 API 设计桥接层；
- 重点验证内存、异常、动态机制和 KVO。

### 9.3 UIKit → SwiftUI

- 先选可隔离页面/组件；
- 用 hosting/representable 建桥；
- 状态 ownership 先统一；
- 维持导航、埋点、无障碍、性能等价；
- 根据部署版本保留必要 fallback；
- 完成后再清理旧路径。

### 9.4 GCD/callback → async/await

- 先桥接叶子 API；
- cancellation/timeout/error 语义不能丢；
- 再建立 Actor 隔离；
- 避免用 detached 临时消警告；
- 开启严格并发检查后逐模块修复；
- `@unchecked Sendable` 必须有可审查证明。

## 10. 系统设计答题框架

### 10.1 第一步：澄清

- 用户和核心流程；
- 数据量、并发、媒体大小；
- 在线/离线；
- 最低系统版本；
- 安全和隐私；
- SLO：启动、响应、成功率；
- 非目标。

### 10.2 第二步：画主链

```text
Input
→ State / Use Case
→ Data boundary
→ Network / Storage
→ State transition
→ UI
→ Metrics
```

### 10.3 第三步：补失败

- 请求失败/超时；
- 进程被杀；
- 数据过期/冲突；
- 重复操作；
- 权限拒绝；
- 内存/磁盘不足；
- 账号切换；
- 版本迁移；
- 服务端不兼容。

### 10.4 第四步：证明

- 单元/集成/UI；
- 性能预算；
- 弱网和故障注入；
- 灰度与回滚；
- 线上指标。

## 11. 案例一：图片 Feed

目标：

- 首屏快；
- 滚动无错图和明显 hitch；
- 弱网可用；
- 内存可控。

设计：

```text
Feed View
→ ViewModel/Store
→ Feed Repository
├─ local page cache
└─ API client

Cell
→ Image Pipeline
├─ memory decoded cache
├─ disk encoded cache
├─ in-flight request merge
└─ URLSession + downsample
```

关键点：

- cursor 分页和去重；
- generation 防过期页覆盖；
- cell 复用取消；
- 图片按尺寸降采样；
- 缓存预算；
- diff 更新；
- 首屏、hitch、流量和错误率。

## 12. 案例二：即时通信

状态：

- connecting / connected / reconnecting / offline；
- sending / sent / delivered / read / failed；
- 本地临时 ID 与服务端 ID；
- 会话游标和未读数。

设计重点：

- WebSocket + HTTP 补偿；
- 本地先写与 outbox；
- 幂等消息 ID；
- 顺序和去重；
- 断线重连 backoff；
- 增量同步；
- 推送与前台连接协调；
- 多设备已读同步；
- 加密和敏感日志。

## 13. 案例三：音视频播放

链路：

```text
Playback UI
→ Player State Machine
→ AVPlayer
→ network/cache/DRM
→ audio session / background / interruption
```

指标：

- 首帧时间；
- 播放成功率；
- rebuffer 次数和时长；
- seek 成功率；
- 错误分类；
- 电量和流量。

不能只回答“用 AVPlayer”。

## 14. 案例四：离线笔记

- 本地数据库是 UI 的即时 source of truth；
- 变更以 operation log/outbox 同事务写入；
- 服务端使用版本/etag；
- 删除使用墓碑；
- 冲突按业务字段或副本解决；
- 附件独立传输；
- 账号切换隔离；
- schema migration 可回滚；
- 同步进度和冲突对用户可见。

## 15. 案例五：端侧 AI / Agent 客户端

客户端职责：

- 会话和消息状态；
- 流式输出；
- tool call 展示与确认；
- 前后台和断网恢复；
- 本地敏感上下文最小化；
- 上传前脱敏和授权；
- 响应缓存与过期；
- 模型/服务端错误分类；
- 取消、重试和幂等；
- token、延迟、成功率和用户反馈指标。

信任边界：

- 模型输出不是事实；
- 高风险工具动作要再次授权；
- tool 结果与自然语言分离；
- prompt injection 不能获得额外客户端权限；
- 秘密不进入提示、日志或分析。

## 16. 交付闭环

```text
Requirement
→ Design/ADR
→ Small vertical slice
→ Code review
→ Automated + real-device validation
→ Feature flag / staged rollout
→ Metrics
→ Retrospective / cleanup
```

高级候选人要能说明：

- 谁拥有模块；
- 上下游接口；
- 数据迁移顺序；
- 兼容窗口；
- 发布和回滚；
- 什么时候删除旧代码；
- 怎样避免“新旧双系统永久并存”。

## 17. 高频问题

### Q1：如何判断架构是否过度设计？

抽象没有真实变化来源或第二消费者，却增加层、协议和状态同步；验证方式是用具体需求变化走一遍调用链。

### Q2：模块化后启动反而变慢怎么办？

检查动态链接、初始化、资源加载和依赖容器；模块边界和产物链接方式是两个维度。

### Q3：如何安全删除旧实现？

证明所有入口和消费者已切换、数据兼容完成、灰度指标稳定、回滚窗口结束，再做 import/引用/运行链扫描。

### Q4：系统设计为什么要先问 SLO？

没有质量目标就无法判断缓存、并发、持久化和降级方案是否值得成本。

### Q5：怎样评价一个 ViewModel？

看状态所有权、副作用边界、依赖、可测试性和变化原因，不看行数或是否使用某个框架。

