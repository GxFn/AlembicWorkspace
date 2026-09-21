# 数据、网络与安全：从请求到可信状态

> 知识树定位：E1 网络基础、E2 Apple 网络栈、E3 持久化、E4 离线同步、E5 安全隐私；并发依赖 C，用户体验关联 D3，线上指标关联 F5。

## 1. 顶层数据链

```text
View State
→ Use Case
→ Repository（统一数据语义）
├─ Memory Cache
├─ Persistent Store
└─ Remote Data Source
   → URLSession
   → DNS / Connection / TLS / HTTP
   → Server / CDN
```

Repository 的价值不是“再包一层”，而是定义：

- 哪个源是权威；
- 缓存什么时候可用；
- 请求如何取消和合并；
- 失败如何映射；
- 本地与服务端怎样同步；
- 数据如何观测和测试。

## 2. 网络分层

| 层 | 关心的问题 |
| --- | --- |
| DNS | 域名解析、缓存、失败 |
| 连接 | TCP/QUIC、握手、复用、迁移 |
| TLS | 身份验证、加密、证书信任 |
| HTTP | 方法、状态码、Header、缓存、幂等 |
| API | 资源、Schema、分页、错误合同 |
| App | 取消、重试、状态、体验、指标 |

面试时不要把“网络错误”视为一个枚举值。需要区分解析、连接、TLS、超时、传输、HTTP、解码、业务和取消。

## 3. URLSession

### 3.1 对象关系

- `URLSessionConfiguration`：缓存、Cookie、连接、蜂窝、等待网络等策略；
- `URLSession`：协调一组相关任务；
- `URLSessionTask`：data/upload/download/WebSocket 等具体工作；
- Delegate：认证、重定向、增量数据、指标和生命周期；
- async API：以结构化方式等待常见任务结果。

### 3.2 Session 类型

| 类型 | 特点 | 适用 |
| --- | --- | --- |
| shared | 配置能力有限 | 简单请求 |
| default | 可配置缓存/Cookie/delegate | 普通业务网络层 |
| ephemeral | 尽量不把缓存、Cookie、凭据写入磁盘 | 隐私会话 |
| background | 由系统进程协助完成上传/下载 | 大文件、App 非运行时传输 |

Session 会持有 delegate，生命周期结束要正确 invalidate。后台 Session 还需要稳定 identifier 和 App 生命周期回调。

## 4. HTTP 语义

### 4.1 方法与幂等

- GET/HEAD 通常安全且幂等；
- PUT/DELETE 按语义应幂等；
- POST 通常不幂等；
- 网络层不能仅按方法名盲目重试；
- 关键写操作使用服务端支持的 idempotency key。

### 4.2 状态码

- 2xx：请求成功，但仍需验证业务和数据；
- 3xx：重定向和缓存；
- 4xx：调用方输入、权限、认证或资源状态；
- 5xx：服务端失败；
- 无 HTTP 响应：连接、TLS、取消、超时等传输问题。

### 4.3 缓存

HTTP 缓存依赖：

- `Cache-Control`；
- `Expires`；
- `ETag` / `If-None-Match`；
- `Last-Modified`；
- `Vary`；
- 请求 cache policy 和 URLCache。

业务缓存与 HTTP 缓存不是同一层。前者表达产品数据可接受的新鲜度，后者遵守协议响应语义。

## 5. 超时、重试和弱网

一个重试策略需要：

- 错误分类；
- 方法/业务幂等性；
- 最大次数和总 deadline；
- exponential backoff + jitter；
- 前后台和网络状态；
- 用户主动取消；
- 服务端 `Retry-After`；
- 防止请求风暴。

```text
单次请求 timeout
≠
整个用户动作 deadline
```

弱网体验包括：

- 显示已有缓存；
- 可理解的加载和超时；
- 用户可重试；
- 上传断点续传；
- 不重复提交写操作；
- 网络恢复后受控同步；
- 指标区分用户取消与真正失败。

## 6. 网络层接口设计

```swift
protocol HTTPClient: Sendable {
    func send<Response: Decodable & Sendable>(
        _ request: APIRequest<Response>
    ) async throws -> Response
}
```

需要明确：

- Request 构建与编码；
- Response 与状态码校验；
- DTO 解码和领域映射；
- Auth 刷新；
- Retry policy；
- 日志脱敏；
- Trace ID；
- Stub/Mock 注入；
- Cancellation 传播。

不要让每个页面自行拼 URL、刷新 Token 和解释错误。

## 7. 认证与 Token 刷新

典型并发问题：

```text
多个请求同时收到 401
→ 每个请求都刷新 token
→ 刷新相互覆盖 / 服务端限流
```

应由单一协调器：

- 合并进行中的刷新；
- 其他请求等待同一结果；
- 刷新成功后只重放允许重放的请求；
- 失败时原子清理会话；
- 避免无限 401→刷新循环；
- 记录但不泄露敏感 token。

## 8. 持久化选型

| 存储 | 适合 | 不适合 |
| --- | --- | --- |
| UserDefaults | 小型偏好和开关 | 大数据、敏感数据、复杂查询 |
| Keychain | token、密码、密钥、小型敏感项 | 大对象、频繁批量读写 |
| File | 图片、文档、可流式大对象 | 复杂关系查询 |
| SQLite | 明确 schema、查询和事务控制 | 不愿承担数据层设计 |
| Core Data | 对象图、查询、变更跟踪、迁移 | 被误解为简单序列化 |
| SwiftData | 新平台上的 Swift 原生模型体验 | 部署/迁移/特性不满足时 |

选择时回答：

- 数据量、查询、关系；
- 并发读写；
- 事务和一致性；
- schema migration；
- 加密和数据保护；
- 备份与清理；
- 跨进程/扩展共享；
- 测试与恢复。

## 9. Core Data / SwiftData 心智模型

Core Data 是对象图和持久化管理框架，不等于 SQLite 包装器。关键概念：

- Model / Entity / Attribute / Relationship；
- persistent container/store；
- managed object context 是工作区和并发边界；
- object ID 可跨 context 标识对象，managed object 本身不能随意跨队列；
- save 是把 context 变更推向父级或 store；
- batch operation 可能绕过内存对象，需要合并变化；
- migration 必须有版本、映射和回滚/恢复策略。

SwiftData 提供更 Swift 原生的建模方式，但底层一致性、并发、迁移、查询成本仍必须设计。

## 10. 缓存与 Source of Truth

常见策略：

- cache-only；
- cache-first；
- network-first；
- stale-while-revalidate；
- offline-first。

每个策略必须定义：

- 新鲜度；
- 空缓存；
- 失败；
- 更新通知；
- 多请求合并；
- 用户手动刷新；
- 删除和失效；
- 内存/磁盘预算。

“有缓存”不是完整答案，缓存一致性和失效才是核心。

## 11. 离线同步

### 11.1 写路径

```text
用户操作
→ 本地事务写入业务对象 + pending operation
→ UI 立即展示本地状态
→ 后台同步
→ 服务端确认
→ 清理 pending / 合并服务端版本
```

### 11.2 必须设计

- 客户端操作 ID；
- 幂等；
- 顺序依赖；
- 冲突版本；
- 删除墓碑；
- 重试和 poison item；
- 账号切换；
- 时钟不可信；
- 多设备；
- 数据迁移和恢复。

冲突策略可能是服务端权威、last-write-wins、字段级 merge、CRDT 或人工解决；选择取决于业务损失，不是客户端单方面决定。

## 12. 安全顶层模型

先做威胁建模：

```text
资产：token、隐私数据、业务权限、支付状态
攻击面：网络、存储、日志、剪贴板、第三方 SDK、越狱环境
攻击者：本地用户、中间人、恶意 App、被攻陷服务
边界：客户端不可信，关键授权必须由服务端验证
```

## 13. Keychain 与 Data Protection

Keychain 适合存放小型敏感数据。设计要考虑：

- accessibility class；
- 锁屏可用性；
- 是否同步到 iCloud；
- Access Group；
- 生物识别/用户在场策略；
- 删除 App 后是否仍保留的产品语义；
- token 更新原子性；
- 错误码和设备迁移。

普通文件可结合 iOS Data Protection 选择保护等级。不要自创加密算法；密钥管理通常比“调用一次 AES”更难。

## 14. ATS、TLS 与证书

- ATS 为 URLSession 的 HTTP 连接施加安全策略；
- 优先使用 HTTPS 和系统信任评估；
- 不要为了开发方便全局放开 ATS；
- 自定义 challenge handler 必须覆盖默认信任逻辑；
- Certificate Pinning 增加抗特定攻击能力，也引入证书轮换、应急恢复和可用性风险；
- Pinning 不是替代服务端认证、授权和风控。

## 15. 隐私与第三方 SDK

- 只采集完成产品目标所需数据；
- 权限请求前解释价值；
- 目的字符串与真实行为一致；
- 日志、分析和崩溃报告脱敏；
- 检查第三方 SDK 的域名、数据和更新；
- 敏感字段不进入剪贴板、截图或通知正文；
- 数据保留和删除策略可执行；
- 版本发布前复核平台隐私要求。

## 16. 高频问题

### Q1：URLSession 的 background configuration 为什么特别？

传输可由系统进程继续，App 重新启动后通过稳定 session identifier 重新连接事件；它不是任意后台代码执行器。

### Q2：什么时候重试请求？

只有错误可恢复、操作可安全重放、未超出 deadline 且策略允许；写操作需要幂等合同。

### Q3：Token 放 UserDefaults 可以吗？

敏感凭据通常应使用 Keychain，并设计 accessibility 和生命周期；同时承认客户端无法成为最终信任根。

### Q4：如何设计离线编辑？

本地事务 + pending operation + 幂等 ID + 同步状态机 + 冲突策略 + 重试/恢复 + 用户可见状态。

### Q5：HTTP 缓存和图片内存缓存有什么区别？

HTTP 缓存遵循协议响应语义；图片缓存还涉及解码后对象、显示尺寸、内存预算和复用生命周期。

