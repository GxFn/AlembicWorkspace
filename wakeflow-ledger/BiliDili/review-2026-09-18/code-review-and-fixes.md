# BiliDili 逐文件代码审查与修复记录 — 2026-09-17 至 2026-09-18

状态：代码审查、已确认缺陷修复、自动测试及本报告列出的最小可见流程已完成，最终 App 已构建并启动。系统打开确认已解除；部分视频在模拟器 seek/重播时仍出现绿屏，作为未解决的剩余问题保留。原视频的独立解码对照提供了媒体与 AVFoundation 组合的定位证据，尚不能解释所有绿屏或确定最终根因。

用户要求按文件和模块小区域分析代码实现、定位问题并修复。本次覆盖自有 App、Core、Infrastructure、Features 和四个本地 Swift Package：150 个生产 Swift 文件、56 个测试/夹具 Swift 文件、5 个 Package.swift，另核对产品文档与工程配置。第三方包源码未纳入逐文件修复范围。

历史阶段审查报告中“未修改、未构建、未测试”描述的是各有界只读审查交付当时；后续主审已逐 diff 合并补丁、补齐播放器/UI 边界、更新产品文档，并完成下表验证。本报告按当前文件状态记录，不把历史建议当作仍未应用，也不把静态阅读等同于运行证明。

## 结论与接入边界

优先修复了账号会话误清理与跨账号迟到提交、分页取消和漏页、播放资源范围/EOF、媒体时间陷阱与生命周期问题。完整登录、Cookie、路由、Feed、独立/共享播放器、双轨 DASH、直播弹幕和 Rx 兼容入口均保留；修复落在原有所属模块，没有用空壳、删功能或更换架构替代。

App 前期两次 BuildProject 成功；媒体、手势及 EOF 重播补修后的最终 RunProject 再次构建启动成功，最终日志为 `RunProject-Log-20260918-010227.txt`。最新五组包测试共 261 项，其中 260 项通过、0 项失败、1 项因测试宿主 Keychain entitlement 缺失跳过，其中 AOXPlayer 为 19 项 XCTest 与 24 项 Swift Testing。新增两项重播/片尾定位参数化测试共覆盖 4 个单段/多段用例，方法计数不重复叠加参数用例。Alembic Guard 基线检查 37 个文件为 0 错误并保留 VideoPlayerView/CookieManager 规模建议；媒体补修 3 文件为 0 错误/0 警告；最终 2 文件为 0 错误、1 项既有 class_bloat 建议（VideoPlayerView 34 个方法）。各轮范围可能重叠，不相加为唯一文件数量。

| 接入类型 | 当前事实 | 报告口径 |
| --- | --- | --- |
| 真实 App 链路 | Home、Following、VideoPlay、LiveRoom 经 AppCoordinator/RouterModule 接入；Account、分页、DTO、预取、ResourceLoader 被这些页面消费。 | 有明确调用链的代码缺陷；异常数值、取消和账号切换输入以 fixture 验证，不声称线上已经发生。 |
| 公开可复用能力 | 独立 LiveChat 页当前无仓内导航入口；Following Rx transform、consumeSource 是保留兼容接口；PaddingLabel 为公开通用 UI。 | 修复其可构造 API/生命周期缺陷，不把它们描述为本次用户界面必经故障。 |
| 可选网络/模块能力 | Bili 客户端未注入 CircuitBreaker、RequestDeduplicator、RateLimitMiddleware；现有 Endpoint 未启用 memory 缓存；App 正常启动使用 registerAll。 | 熔断、去重、缓存签名组合和隐私分阶段注册属于已修复的包 API 潜伏缺陷。 |

## 模块问题与已落地修复

下列位置是本次工作区当前行号。编号按根因归组，避免把同一缺陷的调用方、实现和测试分别计为多个问题。

| 编号 | 模块与问题 | 当前路径与行号 | 修复结果 |
| --- | --- | --- | --- |
| A01 | Account：读取失败误当登出 | Sources/Infrastructure/Account/CookieManager.swift:358；Sources/Infrastructure/Account/AccountManager.swift:59、349 | 增加 loggedIn/loggedOut/unavailable 三态。暂时读失败不写登出 tombstone、不删除持久会话；活跃身份保留，冷启动不假登录，本次请求不补发旧 Cookie。 |
| A02 | Following：列表/游标跨账号 | Sources/Features/Following/FollowingViewController.swift:161、300；Sources/Features/Following/FollowingViewModel.swift:199、246 | 出现/订阅/提交时复核会话，清旧 UI/播放/预取；每会话独享分页器和 tracker；旧 completion 不清新请求 loading。 |
| A03 | Home：隐藏期间漏账号事件 | Sources/Features/Home/HomeViewController.swift:67、82、158、255 | 订阅后与页面出现/响应提交前核对快照，失效旧推荐；事件消费只调度刷新，不 await 网络。 |
| A04 | LiveChat：凭证与 UID 跨会话混用 | Sources/Features/LiveChat/LiveRoomViewModel.swift:381、436；Sources/Features/LiveChat/LiveChatViewModel.swift:120、137 | 凭证请求前捕获身份，安装时校验 revision 和登录位；同会话 mid 补全允许；旧会话撤销弹幕服务/binding，保留直播视频独立成功结果。 |
| N01 | 分页与 fallback：吞取消/迟到提交 | Sources/Core/PaginationKit/PaginationController.swift:109、154、197；Sources/Features/Following/FollowingViewModel.swift:210；Sources/Features/Home/HomeViewModel.swift:158 | 启动和状态锁内提交前检查取消；Following 先取消检查再 commit cursor；Home 不因取消进入下一条网络 fallback。 |
| N02 | 直播 Feed：失败子页永久跳过 | Sources/Infrastructure/Networking/Repository/FeedRepository.swift:45 | 保留三页并行、稳定顺序与去重，任一子页失败/取消使整批抛出；分页重试同一批，已有列表保留。 |
| N03 | DASH：坏首选遮蔽有效候选 | Sources/Infrastructure/Networking/Models/VideoPlayURL.swift:144、178 | 先分别过滤无效视频/音频 URL，再按既有 AVC/清晰度/带宽规则选流；不降级为无音轨。 |
| N04 | DTO：展示文本数字转换陷阱 | Sources/Infrastructure/Networking/Models/BiliDisplayValueParser.swift:8、42；Sources/Infrastructure/Networking/Models/FeedResponse.swift:187；Sources/Infrastructure/Networking/Models/FollowingResponse.swift:88；Sources/Infrastructure/Networking/Models/AuthorResponse.swift:76 | 检查有限性、非负和 Int 可表示性，时长分段乘加使用 overflow 检查；调用方保留原有默认值。 |
| N05 | ContentPrefetch：后台被网络恢复唤起 | Sources/Infrastructure/ContentPrefetch/VideoContentPrefetchCoordinator.swift:339、439、449、477 | App 活跃状态与网络模式分开；后台保留需求但不执行，回前台才恢复。 |
| F01 | 独立弹幕页：VM 释放/缺默认凭证 | Sources/Features/LiveChat/LiveChatViewController.swift:17、66；Sources/Features/LiveChat/LiveChatViewModel.swift:110、188 | Store 强持有 VM；默认依次解析真实房间、获取非空凭证并连接；准备期间可断开，重复连接/断开/销毁撤销旧提交权。 |
| F02 | 弹幕上限后不再自动滚动 | Sources/Features/LiveChat/LiveChatViewController.swift:82；Sources/Features/LiveChat/LiveRoomViewController.swift:267 | 从监听 count 改为末条消息 ID，保留最新 200 条的内存上限。 |
| F03 | 详情首载失败关闭提示后无重试 | Sources/Features/VideoPlay/VideoPlayViewController.swift:23、144、179、219 | 持久加载错误独立于一次性 Alert；关闭提示仍显示 inline retry，新请求/成功后清除旧错误。 |
| F04 | Following Rx transform 持有环 | Sources/Features/Following/FollowingViewModel.swift:371、387 | 长寿命触发闭包弱持有 VM，仅单次异步请求维持必要生命周期，保留 Input/Output。 |
| F05 | 播放详情：父容器点击手势截走控制条触摸 | Sources/Features/VideoPlay/VideoPlayViewController.swift:569 | 画面显示/隐藏控制条的 tap 只挂 playerView；controlView 和返回按钮为同级视图，不再经过全容器手势取消触摸。 |
| P01 | ResourceLoader：内部分段被当成 EOF | Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoResourceRequestManager.swift:232；Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoResourceLoader.swift:365 | 内部 1/2 MB 下载窗口独立于 AVFoundation 完成条件；all-to-end 忽略 requestedLength，固定范围按权威 EOF 裁剪，probe 精确累计交集。 |
| P02 | ResourceLoader：未知总长/纯信息请求 | Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoResourceRequestManager.swift:117、159、204；Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoResourceLoader.swift:210、349、398 | 独立信息请求可启动 probe；Content-Range 取总长；chunked 完整 200 在成功 EOF 以累计字节补长；未知长度不提前完成，后续允许补写信息。 |
| P03 | 缓存交付：大分配与旧新内容混拼 | Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoResourceLoader.swift:156、172 | 先轻量检查全请求范围覆盖，填充已验证 contentInformationRequest 后再有界分块交付。交付前 miss 可回源；交付部分后读失败明确结束错误，不续接可能换版的网络后缀。 |
| P04 | 媒体 URL：HTTP/file 被强制 HTTPS | Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoResourceLoader.swift:89、99 | HTTP/HTTPS 使用可逆自定义 scheme，query 不改写；file 等本地资源交回 AVURLAsset。 |
| P05 | 媒体时间：非有限时长/seek/进度 | Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoPlayerView.swift:574、627、1111；Packages/AOXPlayer/Sources/AOXPlayer/Core/PlaybackProgressManager.swift:51；Packages/AOXFoundationKit/Sources/AOXFoundationKit/Extensions/Int+AOX.swift:39 | 对外时间始终有限非负；未知为 0 并继续更新有效时长，seek 拒绝非法输入且限制 0...1，持久化拒绝非有限值；格式化防 Double→Int 陷阱。 |
| P06 | DASH 准备任务长期持有视图 | Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoPlayerView.swift:410 | 等待期间只持有 builder/assets；完成/失败时才重新取得弱 view 并检查 generation，让释放能触发 cancel。 |
| P07 | 播放器：慢错误无限重试/暂停后续播 | Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoPlayerView.swift:501、541、746、818 | 重试预算由换源或 ready 成功重置，不按五秒错误间隔重置；段结束沿用当前播放意图；stop 清理时长/后台意图。 |
| P08 | 预取 consume 绕过源 TTL | Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoURLPreloader.swift:351 | consume 与 peek 共用 TTL；过期条目移除并计数，调用者回到实时取源路径。 |
| P09 | ResourceLoader：未来块填入较早缺口 | Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoResourceLoader.swift:116、365 | 新增 contiguousDataRange；输入块必须包含当前下一字节，只交付从 currentOffset 开始的连续部分；拒绝未来块、重复前缀和非法溢出范围并诊断。 |
| P10 | HTTP 206：实际字节坐标和响应正文校验 | Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoResourceRequestManager.swift:6、159、191、204；Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoResourceLoader.swift:210、349 | 解析合法单段 Content-Range，按响应真实 start 标记正文并校验 end/total/Content-Length；拒绝不支持的 multipart、超长和截断。206 切片大小不冒充整片总长，错误坐标不进入缓存写入链。 |
| P11 | 播放器：片尾显式播放不回到开头/定位后误重播 | Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoPlayerView.swift:501、509、574、585；docs/VideoPlayback.md:260 | 单段复用已加载 asset，seek 零点后按当前意图播放；多段先离开 finished 并重新装载第 0 段，保留原 generation/音轨/缓存身份。有效 seek 拖离片尾时撤销 finished、保持暂停，下一次 play 从所选位置继续。 |
| P12 | 播放器：同 item 的迟到 playing 快照覆盖暂停 | Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoPlayerView.swift:1026、1052；docs/VideoPlayback.md:188 | 保留 generation/item 校验，并在 KVO playing 分支执行 UI/relay 更新前核对 shouldAutoPlay；显式 pause 已撤销意图时丢弃迟到快照并诊断，不误拦后续明确 play。 |
| K01 | Router：编码/取消/非法 delay | Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/SchemeRouter.swift:177、228、319、517；Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/SchemeRoute.swift:30；BiliDili/SceneDelegate.swift:75 | 保留裸加号空格兼容，百分号只解一次；取消终止 handler/backup/next，返回 cancelled；拒绝非有限或不可表示 delay。 |
| K02 | Registry：同短类型名覆盖 | Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/ServiceRegistry.swift:42、246 | 注册身份用 ObjectIdentifier(metatype)+tag；类型名只用于诊断，主表/alias/tag 一致。 |
| K03 | ModuleManager：分阶段重复注册 | Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/ModuleManager.swift:83、159、177、289 | 三个注册入口共享已注册模块身份集，重复调用跳过；reset 清空身份；隐私两阶段能力保留。 |
| K04 | 熔断：neutral 半开出口耗尽许可 | Packages/AOXNetworkKit/Sources/AOXNetworkKit/Client/NetworkClient.swift:99；Packages/AOXNetworkKit/Sources/AOXNetworkKit/Resilience/CircuitBreaker.swift:68、167 | 真实 leader 领取带 generation 的许可，全部结束路径结算；取消/4xx/业务/解码等 neutral 归还探测，旧结果不影响新代。 |
| K05 | 缓存：签名/改写后读写 key 不同 | Packages/AOXNetworkKit/Sources/AOXNetworkKit/Client/NetworkClient.swift:264；Packages/AOXNetworkKit/Sources/AOXNetworkKit/Middleware/CacheMiddleware.swift:38、76、87 | context.id 记录改写前完整 URL key，写响应与后续读取一致；不靠删签名字段的字符串猜测。 |
| K06 | 去重：取消 follower 仍等待成功 | Packages/AOXNetworkKit/Sources/AOXNetworkKit/Resilience/RequestDeduplicator.swift:22、53、65 | 每个等待者独立 continuation/取消；共享 work 继续，成功/失败完成负责 key 清理，取消不误伤其他等待者。 |
| K07 | MockClient：非递归锁内运行 factory | Packages/AOXNetworkKit/Sources/AOXNetworkKit/Testing/MockClient.swift:104、109 | 锁内仅记录/选择，锁外执行用户工厂，允许其读取 requests 或调整 fallback。 |
| U01 | PaddingLabel：多行测量不足/未重绘 | Packages/AOXUIKit/Sources/AOXUIKit/Components/PaddingLabel.swift:11、26 | 先扣内边距再给 UILabel 测量，最后加回 padding；修改 inset 同时 invalidates intrinsic size 和 setNeedsDisplay。 |

## 可重复的输入与修复前后行为

以下均为合成输入/可控制生命周期；不使用真实账号身份或凭证。测试通过与主审代码复核分别标明，避免把手工调用管理器方法写成已经跑通真实 CDN/AVFoundation 的端到端测试。

| 编号 | 复现输入/时序 | 修复前 → 修复后 | 已执行证据与边界 |
| --- | --- | --- | --- |
| A01 | 已激活会话的 secureStore.read 注入 failure；另测无已激活状态的冷启动。 | 读失败变空→自然登出/永久 tombstone；现在区分未知，活跃会话保留、请求无凭证，恢复读取后继续；冷启动不假登录。 | CookieReadAvailabilityTests 两项通过；真实系统 Keychain 往返仍受 entitlement 限制。 |
| A02/A03 | A 列表已加载→隐藏页换 B 无事件回放；A 慢请求在 B 请求期间返回。 | 旧列表/游标可保留或旧结果抢先提交；现在出现与提交均核对身份，旧请求无提交权/无权清新 loading。 | FollowingSessionIsolationTests、HomeSessionIsolationTests 通过。 |
| A04 | danmuInfo await 期间 revision 或登录位变化；另测同 revision 的 mid 从未知补全。 | 旧凭证与新 UID 混配；现在拒绝旧会话、保持播放；同会话资料补全使用当前 UID。 | LiveRoomSessionIdentityTests 四项、StandaloneLiveChatTests 换号场景通过；真实登录切换见可见验证。 |
| N01 | continuation 模拟忽略取消的网络 SDK：取消 refresh/loadMore 后释放成功结果；推荐首请求抛 CancellationError。 | 分页/offset 推进或继续 fallback；现在保留页码和旧列表、抛取消、不新增 fallback 请求。 | PaginationCancellationTests、Following/Home 新回归通过。 |
| N02 | 列表 page=1 对应服务端 1/2/3；第 2 页 timeout/取消，其余成功。 | 2 被当空永久跳过；现在整批失败，重试仍为 1/2/3，成功后按原顺序提交。 | LiveFeedBatchTests 两项通过。 |
| N03 | 最高带宽 AVC 或音轨 URL 无效，但同响应存在有效低带宽/备用编码候选。 | 整个 source=nil；现在过滤坏候选后选择有效视频和独立音频。 | PlaybackCandidateRecoveryTests 三项与已有 source validation 通过。 |
| N04 | count 为 1e309万、nan亿、9e99亿、-3万；时长包含 Int 极大分段/空分段；正常 1:04:57。 | Double→Int 或乘加 trap；现在返回既有 0/nil 回退并只记录字段分类，正常 3897 秒不变。 | DisplayValueBoundaryTests 通过，fixture 从公开 DTO 转换进入。 |
| N05 | 先保存 desiredRequest→进入后台→网络恢复/模式切换→回前台。 | 后台事件重启预取；现在后台执行次数不增加，active 后恢复保存需求。 | PrefetchLifecycleTests 两项通过；策略禁用真实图片/媒体请求，以计划执行观察验证。 |
| F01 | 临时 VM 创建 Store 后释放外部引用；默认连接短房间号；准备中断开或返回空凭证。 | VM 释放导致按钮无效，默认空凭证拒连；现在 Store 保持 VM、真实房间/凭证就绪后连接，迟到/空凭证不连接。 | StandaloneLiveChatTests 五项通过；transport 为可控 fixture，不声称独立页已加入导航。 |
| F02 | 顺序到达第 201...205 条消息，窗口仍保留最新 200 条。 | count 恒为 200 不触发滚动；现在 last.id 改变触发滚动。 | 两处 SwiftUI 观察点已复核并构建；尚无独立 205 条可见自动滚动录证。 |
| F03 | loadPlayback 第一次失败→关闭 Alert→点 inline retry→第二次成功。 | 关闭提示时唯一重试入口消失；现在可重试保持，成功后清空加载错误。 | VideoPlayRetryPresentationTests 通过。 |
| F04 | Rx 输入使用 never，建立 transform 后移除唯一外部 VM 强引用。 | VM→bag→subscription→VM 不释放；现在 weak VM 为空。 | FollowingSessionIsolationTests 中生命周期项通过。 |
| P01/P02 | all-to-end requestedLength=2、总长 5,000,000；offset=4,900,000；未知总长；chunked 200 交付 17 字节成功 EOF。 | 内部窗口/probe 长度提前结束或 EOF 反复回源；现在用真实总长/EOF，17 字节完整 200 得到总长 17。 | VideoResourceRangeTests 现十项通过（含三项连续交付补充）；含算术和手工注入 HTTP response/data/completion，不是实际 AVAssetResourceLoadingRequest 全场景端到端。 |
| P03 | 全缓存大请求；或已交付第一块后下一块读失败/被淘汰。 | 整片分配或新实现可能接旧前缀+新网络后缀；现在有界块、全范围先检，部分交付后失败交上层完整重试。 | 代码路径复核与 App/包构建；没有单独注入缓存淘汰中断的 AVFoundation 集成测试。 |
| P04 | http://localhost:8080/video.mp4?key=A%2BB、对应 HTTPS、合成本地 file URL。 | HTTP/file 被还原为 HTTPS；现在协议/query 往返一致，file 不进 HTTP 加载器。 | PlaybackReviewTests 协议/query 与本地媒体排除项通过。 |
| P05 | NaN、±∞、负时长、Double(Int.max)、极大值，以及合法 0.5 秒；无效 seek/progress。 | 显示格式 trap/未知值污染时间状态；现在未知时间 0、拒绝坏 seek/持久化，保留合法短时长和格式。 | PlaybackReviewTests、RouteAndDurationReviewTests 通过；seek/持久化防护为代码检查，未宣称每分支均有新增独立测试。 |
| P06 | 注入挂起的 DASH builder，开始解析后移除 view 的唯一外部引用。 | Task 在 await 前强持有 view 阻止释放；现在 weak view 立即为空，能够走销毁取消。 | PlaybackReviewTests 的 releasingViewCancelsItsPendingDASHPreparation 通过。 |
| P07 | 连续慢超时每次间隔超过 5 秒；段结束通知排在暂停/租约移交之后。 | 重试预算反复重置、下一段强制起播；现在有限预算、继承当前意图。 | 代码路径和构建复核；未单独注入慢超时/通知队列竞争的可见回归。 |
| P08 | 独立 preloader sourceTTL=0.1 秒，成功缓存后等待 0.15 秒再 consume。 | 过期 source 仍交给播放器；现在返回 nil、expirationCount 增加且缓存移除。 | PlaybackReviewTests 通过。 |
| P09 | 当前下一字节 1,000,000，收到从 4,000,000 起的 1024 字节；另测重叠/已耗尽/Int64 溢出。 | 旧交集计算会 respond 未来块，让系统按字节数推进错误位置；现在无连续前缀则不 respond，有重叠时只切出下一字节起的片段。 | VideoResourceRangeTests 新增三项通过；不是以绿屏现象反推根因。 |
| P10 | 206 bytes 100-103/1000 交付四字节；bytes 42-1233/* 配切片长 1192；坏范围、长度不一致、multipart、超长/截断。 | 原实现沿用请求起点且可能把 206 切片长当总长；现在 delegate 输出 offset=100、未知总长仍未知，异常响应/越界正文不继续缓存转发，短正文报告中断。 | VideoResourceResponseTests 六项通过；检验真实 Manager→delegate 数据边界，不宣称已做磁盘字节往返。 |
| F05 | 点击或拖动详情播放控制条，父容器同时安装 tap；另有返回按钮与画面为同级子视图。 | 全容器 tap 可能取消按钮/滑杆触摸；现在手势只覆盖视频画面。 | RunProject 构建启动成功；后续控制条可见交互由主审补录，不以单元测试替代触摸验证。 |
| P11 | 本地 2 秒静音 CAF，分别 1/2 段；自然 finished 后再次 play；再次 finished 后 seek(0.4)，停稳后显式 play。 | 旧实现仅置播放速率，仍停片尾；定位后还可能残留 finished。现在重播从全片起点实际前进，片尾定位保持暂停，随后从目标位置继续。 | PlaybackReviewTests 新增两个参数化方法（4 个输入用例）最终通过；观察公开 rx_currentTime 的真实进度，不把同步 .playing 当成功。 |
| P12 | 单段 finished→play→立即 pause，等待 300 ms 后记录时间，再观察 650 ms；多段同样运行。 | 旧同 item KVO playing 快照在 pause 后到达，会把 relay 改回 playing；现在意图门拒绝该快照，状态不播放且时间不继续推进。 | 同一真实 CAF 回归最终通过；该断言先有效失败，加入意图门后转绿。它不验证视频画面颜色。 |
| K01 | query name=C%2B%2B、裸 +、%20、%252B；取消长 delay 的 next；delay=inf/nan/1e100。 | 字面加号损坏/取消反而立即 next/非法 Duration trap；现在单次解码、终止取消链、invalidParams。 | RouteAndDurationReviewTests 通过，保留裸 + 为空格的兼容约定。 |
| K02/K03 | 两个命名空间同名 Service 与同 tag；重复 privacy/remaining、privacy→all、reset 新周期。 | 注册互相覆盖或一个模块重复 register；现在 metatype 身份隔离、每周期每实例只注册一次。 | RegistryAndModuleReviewTests 通过。 |
| K04 | threshold=1/cooldown=0，half-open probe 在 adapt 中抛取消、404、业务、解码、invalid URL；旧许可随后返回。 | neutral 占满额度永久半开；现在归还本代许可，旧代不影响当前，下一探测可成功关闭。 | CircuitAndMockReviewTests 通过；错误注入在 transport 之前，不把 fixture 写成实网 404 观测。 |
| K05 | 原始 URL ?page=1；写响应 URL 增加 signature；随后真实 NetworkClient.send 读原 endpoint。 | 写入签名 key，原始读取 miss；现在同稳定身份命中且 side table 清零，page=2 隔离。 | CacheAndDedupReviewTests 通过；fixture 预置响应与真实 send 读缓存，未声称已跑远端 redirect。 |
| K06 | 两个等待者共享挂起 work；只取消 follower；完成后同 key 再请求；另测 work 失败。 | follower 仍等成功；现在及时抛取消、另一等待者成功、work 只运行一次且完成后 key 可重用。 | CacheAndDedupReviewTests 通过；策略明确即使全体取消也让已开始 work 完成。 |
| K07 | stub factory 读取 requests.count 并设置 fallback；并发 16 次 send。 | 锁重入异常；现在工厂锁外执行，响应和记录数量符合 first-match/原子记录。 | CircuitAndMockReviewTests 通过。 |
| U01 | 多行文本、宽 140、左右 padding 各 20，上下各 6。 | 按 140 测量却在 100 文本宽度绘制导致少算行；现在按 100 测文本，加回 padding，inset 修改触发重绘。 | PaddingLabelLayoutTests 通过。 |

补充协议依据：Apple 要求增量数据从 currentOffset 的下一字节连续响应，内容信息应先于数据交付；HTTP 206 可只返回请求范围的子集，客户端须读取响应 Content-Range，不能把原请求起点或 Content-Length 当作响应的完整坐标/总长。参见 [Apple currentOffset](https://developer.apple.com/documentation/avfoundation/avassetresourceloadingdatarequest/currentoffset)、[Apple dataRequest](https://developer.apple.com/documentation/avfoundation/avassetresourceloadingrequest/datarequest)、[RFC 9110 §15.3.7](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.3.7)。

## 验证结果与限制

| 范围 | 通过 | 失败 | 跳过 | 最终结果证据 |
| --- | --- | --- | --- | --- |
| 主包 BiliDili-Package | 163 | 0 | 1 | `bilidili-review-app-package-tests-final-summary.json` |
| AOXFoundationKit | 13 | 0 | 0 | `bilidili-review-foundation-tests-summary.json` |
| AOXNetworkKit | 35 | 0 | 0 | `bilidili-review-network-tests-summary.json` |
| AOXPlayer | 43 | 0 | 0 | `bilidili-review-player-tests-replay-final-summary.json`；`bilidili-review-player-tests-replay-final.log`（19 XCTest + 24 Swift Testing） |
| AOXUIKit | 6 | 0 | 0 | `bilidili-review-uikit-tests-summary.json` |
| 合计 | 260 | 0 | 1 | 统计来自以上五组最终结果；参数化输入不另行重复计数。 |

| 验证 | 实际结果 | 可得结论 |
| --- | --- | --- |
| App 构建与启动 | 两次 BuildProject 成功；前期日志 `BuildProject-Log-20260917-223157.txt`。最终 RunProject 成功，日志 `RunProject-Log-20260918-010227.txt`。 | 最终源码能够编译/链接并启动；当前构建的首页→详情→EOF 重播→立即暂停→返回已完成下表可见检查。 |
| Alembic Guard | 基线 37 文件为 0 错误、两类规模建议；媒体补修 3 文件为 0 错误/0 警告；最终 2 文件为 0 错误、1 项既有 class_bloat 建议（34 个方法）。 | 轮次范围可能重叠；保留 VideoPlayerView/CookieManager 原规模建议，不为指标拆分真实职责。 |
| 系统 Keychain 往返 | `CookieSecureStorageTests.testSystemKeychainStoreRoundTripAndDelete` 跳过；OSStatus=-34018。 | 测试宿主缺可用 entitlement；未证明系统存储往返成功。Memory/失败注入/迁移/回滚等可控路径通过。 |
| iOS 27 Device Hub 阶段观察 | 首页加载；首视频从 0 顺播至 1:50 EOF；中段 seek 一度绿屏，随后恢复。媒体补修后另一 23 秒冷源完整播放，首尾 seek 画面正常。手势补修后已进入关注页。 | 这些是已执行的阶段观察；绿屏根因未确认，另一视频通过不能证明原源问题已修复。 |
| 首页与详情 | iPhone 18 Pro / iOS 27：列表与图片显示；从首页进入视频详情，观察真实视频画面及顺播 EOF。 | 首页→详情的数据/导航/播放主路径已有可见证据。 |
| 关注→视频流→关注 | 关注列表出现并应用自动播放源；切到全屏视频流显示实际画面；点击暂停后可访问性值变为“已暂停”；切回关注页重新出现当前视频。运行日志记录旧租约释放、新租约取得。 | 两个共享播放器消费方的页面切换、暂停和接管已观察；不据此推断所有快速切换竞态都已覆盖。 |
| 背景切换 | 已通过设备 Home 返回系统主屏；系统打开确认步骤随后解除，实际通过 AX 回到同原视频。 | 之前 Safari Open 确认阻塞已解除；没有继续请求用户手动解除已不存在的步骤。 |
| 同视频 seek 复测 | 已实际回到最初视频，同源 seek 绿屏仍存在；后续独立本地文件解码也能复现特定时间点绿色帧。 | 不能标记绿屏修复；暂按媒体与 AVFoundation 组合定位，具体范围见下方独立对照，尚非特定系统根因结论。 |
| 控制条手势及 EOF 补修 | 手势范围已调整；EOF 重播与片尾定位经真实 CAF 自动回归通过，最终构建也完成播放按钮/暂停/返回的可见操作。 | Safari 确认步骤已解除；控制条响应与重播时间推进已观察，颜色异常仍单独保留。 |
| 最终构建最小可见流程 | 首页载入→打开约 26 秒短视频→实际到 EOF（AX 为播放、00:26）→点击播放（AX 为正在播放、00:01，进度继续前进）→再次结束后重播并立即暂停（AX 为已暂停、00:00，等待工具往返仍为 00:00）→点击返回成功回到首页。 | 显式重播、立即暂停保持与返回主路径通过可见检查。这条不同视频重播中也曾发绿，片尾/暂停起点恢复正常，因此绿色帧问题并不限于最初原视频。 |

真实媒体回归保留了有效的红→绿证据：`bilidili-review-player-replay-before.log` 中，单段/多段的重播与片尾定位共 4 个参数用例失败；补修后增加的即时 pause 检查又暴露单段同 item 的迟到 playing 竞态。最终 `bilidili-review-player-tests-replay-final.log` 显示两项方法的 4 个参数用例均通过，播放器全套 43 项无失败。这里只记录有效运行中的失败与最终通过，不把测试编译迭代计作行为证据。

### 部分视频在模拟器 seek/重播时的绿色帧对照与剩余边界

独立只读程序直接使用同一本地 MP4 副本与 `AVAssetImageGenerator.image(at:)`，只导入 AVFoundation/CoreGraphics/Foundation/ImageIO/UniformTypeIdentifiers；该执行链不经过 AOXPlayer、ResourceLoader、网络请求或 App UI。在 iOS 27 和 iOS 26.2 中，100 秒位置均输出绿色帧；iOS 27 的 fresh generator 复核按 100→55→0 顺序、每个时间点新建 generator，100 秒的 R/G/B 均值仍为 `[0, 87.671875, 0]`，55/0 秒正常。导出的 100 秒 PNG 已肉眼确认绿色。

同一本地文件用 FFmpeg 全片解码退出码为 0、未报告解码错误，100 秒对照图像正常。证据为[脱敏对照 JSON](./bilidili-native-decode-comparison.json)、[原生 100 秒绿色帧](./bilidili-native-media-100.png)和[FFmpeg 100 秒对照帧](./bilidili-original-video-100.png)。[可移植诊断程序](./native-media-decode-diagnostic.swift)通过命令行接收媒体参数，已编译通过，不含本机或媒体绝对路径。

这些结果证明原视频无需本次 App 实时读取/UI 链路也能复现，并排除“仅截图工具造成绿色”的解释；对该原视频，目前暂定位为媒体与 AVFoundation 解码的兼容组合。它们**不证明**媒体完全符合码流规范、不确定为某个 Apple 系统缺陷，也不能外推真机表现或直接解释另一视频的全部绿屏。CAF 回归只验证时间与播放意图，不证明视频颜色正常。最终 App 的最小可见流程已完成，部分视频在模拟器 seek/重播时的绿色帧仍列为剩余问题。

当前运行验证不覆盖所有真实账号/网络/媒体组合：未使用真实登录凭证完成换号，没有将合成错误注入算作线上故障。新增 206 测试直接验证 Manager 发给 Loader 的 offset/数据/错误，但未实际读写磁盘缓存；连续区间 helper 的测试也不等同完整 AVAssetResourceLoadingRequest 集成。纯信息请求、缓存中途失效、慢超时段结束竞争仍未各自建立完整 AVFoundation 端到端夹具。部分视频在模拟器 seek/重播时的绿屏已再次观察到；原视频由上述独立解码对照缩小范围。不能把另一冷源的部分操作正常或 CAF 重播测试通过写成绿色帧根因已消除。

Alamofire/RxSwift 的 watchOS 清单弃用警告仍保留。此前建议的 Alamofire 5.12.2 要求 Swift tools 6.4，而 `.github/workflows/ios-ci.yml:13` 固定 Xcode 16.4；仅凭本机工具链可用不能判定 CI 兼容。本次不升级依赖锁，不通过修改 DerivedData 清单或降低 BiliDili 能力消警告。

### 未确认为当前 App 故障的后续验证边界

| 区域 | 原审查观察 | 当前处置/不能得出的结论 |
| --- | --- | --- |
| Following 自动播放 | 刷新后如果条数/几何完全相同，frame preference 未变可能暂不重选播放候选。 | 需要同尺寸刷新可见证据；本次不将“可能”写成已修/已复现。 |
| LiveRoom 离场 | 隐藏但保留的 SwiftUI tree 若继续消费迟到候选，可能重新创建播放器。 | 由主审可见流程检查；加载候选到达本身不证明不可见时起播。 |
| BiliLiveProtocol | 切片 Data 对齐、深层压缩需要有界专项探针。 | 没有确认当前传输输入触发；未把风格警告等同崩溃。 |
| WebLogin/WebSocket/Download | 旧 WebKit prepare 与新实例竞争、独立 connect 等待者取消、损坏 resumeData 恢复需要专门契约/环境验证。 | 保留既有 generation、显式 disconnect 与 Download sticky 终态；不擅自改成隐式重试。 |
| RateLimitMiddleware | 非法 tokensPerSecond、取消后预扣欠账是公共配置/取消契约边界。 | 当前未接入 Bili 客户端；未进行定向实验，本报告不宣告此可选能力所有输入已验证。 |
| ModuleManager reset / String 编码 | reset 测试入口旧 asyncAfter 可能进入新周期；aox_urlEncoded 使用 urlQueryAllowed 不适合作为通用单参数值编码。 | 前者非正常 App 单次启动链；后者当前无仓内消费方，使用契约需专项确认，不计当前已修清单。 |
| 其它配置边界 | 签名缓存尚无账号私有缓存契约；bare/delegate Session 的 pinning 配置、多 scene 首项选择、图片 query/缩略后缀需要实际消费场景。 | 当前 App 无相关注入/场景证据；本轮不引入新功能或擅自扩大接口承诺。 |

## 全文件覆盖清单

每行列出实际阅读的小区域与当前结论。未修改文件仍列入，避免把“review”缩成只看 diff。覆盖来自 Core/Infrastructure、Features、Foundation/Network 的逐文件审查证据，以及主审对 App、Player、UIKit 与新增测试的补充阅读；最终修复行号另见前表。无新增确定问题仅代表本轮证据未确认缺陷，不保证没有缺陷。

### App 入口与组装（6 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `BiliDili/AppCoordinator.swift` | Tab Controller 复用、登录拦截、登出选回首页、导航定位；提供 A02/A03 的真实调用证据，修复落在页面会话边界。 |
| `BiliDili/AppDelegate.swift` | 启动配置、API 环境、模块顺序、播放器 Header、完整播放源预取注入；主审逐文件阅读，未确认新增缺陷。 |
| `BiliDili/Modules/AccountModule.swift` | Cookie/身份/事件服务装配及首次资料同步；核对 Account 的单一所有权，未确认新增缺陷。 |
| `BiliDili/Modules/NetworkModule.swift` | Repository 服务注册、网络初始化与基础能力消费；未确认新增缺陷。 |
| `BiliDili/Modules/RouterModule.swift` | 视频、作者、网页、直播等路由参数校验与页面创建；K01 的真实消费者，保留既有导航语义。 |
| `BiliDili/SceneDelegate.swift` | Scene 生命周期、URL 入口、路由诊断；同步处理新增 RouteError.cancelled，见 K01。 |

### Core（3 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `Sources/Core/PaginationKit/PaginationController.swift` | 状态锁、generation、refresh/loadMore、页码/hasMore 提交和失败恢复；N01 已补启动及提交取消门。 |
| `Sources/Core/ServiceKit/Logger+Categories.swift` | 类别与隐私默认；未确认运行时缺陷。 |
| `Sources/Core/ServiceKit/ServiceProtocols.swift` | Cookie按URL、身份原子值快照、会话失效revision、事件流及闭包适配；未确认新增缺陷。 |

### Infrastructure / Account 与预取（5 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `Sources/Infrastructure/Account/AccountManager.swift` | 登录 single-flight、revision、身份快照、明确登出与自然过期；A01 已区分已登出和存储暂不可用。 |
| `Sources/Infrastructure/Account/AccountSessionEventHub.swift` | 多订阅者buffer/termination、生产发布经MainActor串行；未确认新增缺陷。 |
| `Sources/Infrastructure/Account/AccountUser.swift` | 账号域DTO与Networking隔离；未确认新增缺陷。 |
| `Sources/Infrastructure/Account/CookieManager.swift` | Keychain 迁移/回滚、tombstone、WebKit purge、host/path/secure 与读取结果；A01 已保留读取未知态且不给请求补发旧凭证。 |
| `Sources/Infrastructure/ContentPrefetch/VideoContentPrefetchCoordinator.swift` | owner、窗口规划、80 ms 合并、网络/后台/内存状态；N05 已将前台状态与网络条件独立约束，保留待恢复需求。 |

### Infrastructure / Networking（32 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `Sources/Infrastructure/Networking/BiliImageURL.swift` | 协议修复及CDN后缀；合法带query地址应将缩略参数放path是可改进边界，未找到真实当前响应证据，不列确认产品缺陷。 |
| `Sources/Infrastructure/Networking/Client/NetworkClient+Bili.swift` | 普通/bare共用CookieStorage禁用传输、幂等重试；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Client/NetworkError+Bili.swift` | 对用户错误映射、风控分类；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Client/ResponseDecoder+Bili.swift` | BiliResponse业务校验桥接；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Core/BiliMediaURL.swift` | scheme/host/userinfo/音轨/分段验证；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Core/WBISigner.swift` | canonical query、key缓存、single-flight、恢复epoch、端口；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Endpoint/Endpoint+Author.swift` | authorSpace/authorVideos参数与签名标记；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Endpoint/Endpoint+Following.swift` | cursor offset、接口不使用ps的显式兼容；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Endpoint/Endpoint+Home.swift` | popular/rcmd/app feed分页参数；未确认此文件新增缺陷。 |
| `Sources/Infrastructure/Networking/Endpoint/Endpoint+Live.swift` | live推荐/房间状态/播放/弹幕端点参数、优先级和签名；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Endpoint/Endpoint+Reply.swift` | type/sort、一级和子回复参数；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Endpoint/Endpoint+User.swift` | nav类型绑定；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Endpoint/Endpoint+Video.swift` | bvid/aid详情、durl请求、related端点；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Exports.swift` | 既有AOXNetworkKit re-export；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Middleware/AuthMiddleware.swift` | HTTPS域名、Cookie/CSRF、nav复核条件失效、pending队列；没有把内部expired状态误写成外部logout。pending waiter取消响应可改进，网络请求有界，未列永久hang。 |
| `Sources/Infrastructure/Networking/Middleware/AuthState.swift` | canTransitionTo已不用于recover守卫；未确认当前调用链缺陷。 |
| `Sources/Infrastructure/Networking/Middleware/BiliMiddlewareChain.swift` | Header→Auth→Signing→Cache顺序；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Middleware/HeaderMiddleware.swift` | 只填补缺失头、服务端所需UA/Referer/Origin；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Models/AuthorResponse.swift` | 投稿 DTO、展示时长转 VideoModel；N04 已接入统一解析并保留原有 0 回退。 |
| `Sources/Infrastructure/Networking/Models/BiliDisplayValueParser.swift` | 新增展示计数/时长转换边界；有限性、非负、Int 可表示性、乘加 overflow、字段级诊断；N04。 |
| `Sources/Infrastructure/Networking/Models/FeedResponse.swift` | Feed ID/aid、容错卡片、直播过滤、HLS 镜像与 URL 拼接；N04 修复展示计数/时长陷阱，保留 playerArgs.duration 回退。 |
| `Sources/Infrastructure/Networking/Models/FollowingResponse.swift` | 动态 archive、游标/hasMore、计数和时长转换；N04 已接入受保护解析。 |
| `Sources/Infrastructure/Networking/Models/ReplyResponse.swift` | rpid身份、嵌套回复容错、页码总量；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Models/UserInfo.swift` | nav缺字段兼容、VIP/level；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Models/VideoModel.swift` | 编码一致性、Owner/Stat缺省；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Models/VideoPlayURL.swift` | durl 分段完整性、DASH codec/清晰度/带宽和独立音轨；N03 先过滤无效 URL 再排序，保留缺音轨拒绝。 |
| `Sources/Infrastructure/Networking/Repository/FeedRepository.swift` | 三服务端页并行、稳定顺序/去重、失败和取消；N02 已改为完整批次成功才允许分页提交。 |
| `Sources/Infrastructure/Networking/Repository/FollowingRepository.swift` | 动态过滤与服务端游标/hasMore保存；取消副作用在调用方Feature，仓库未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Repository/ReplyRepository.swift` | 默认参数转发、data=nil错误、子回复；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Repository/VideoRepository.swift` | bvid/cid/aid三路解析及无效响应；未确认新增缺陷。 |
| `Sources/Infrastructure/Networking/Rx/AsyncRxBridge.swift` | dispose与投递门、锁外observer、MainActor、取消；未确认新增缺陷，C2在更早分页提交点。 |
| `Sources/Infrastructure/Networking/Rx/NetworkClient+Rx.swift` | 统一桥接、不复制异步状态；未确认新增缺陷。 |

### Infrastructure / WebSocket（3 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `Sources/Infrastructure/WebSocket/HeartbeatScheduler.swift` | start/stop generation、先安deadline后send、pong/timeout单次出口；未确认新增当前场景缺陷。 |
| `Sources/Infrastructure/WebSocket/ReconnectPolicy.swift` | 固定/指数/custom空数组和负下标防护；真实调用参数正常，未确认新增缺陷。 |
| `Sources/Infrastructure/WebSocket/WebSocketClient.swift` | actor连接代次、注册时序、异步结束/显式断开、send状态；未确认新增当前场景缺陷。 |

### Features / Home 与 Following（6 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `Sources/Features/Following/FollowingAutoplaySelector.swift` | 面积阈值、中心距离、稳定下标 tie-break；未发现确定缺陷 |
| `Sources/Features/Following/FollowingViewController.swift` | 身份快照/请求提交、租约、可见自动播放、分页和账号事件；A02 已隔离账号列表和 loading 收尾，刷新后几何不变的自动播放边界见限制。 |
| `Sources/Features/Following/FollowingViewModel.swift` | 游标 generation、空页预算、循环/重叠、断点重试、播放解析及 Rx；A02 按会话更换分页器，N01 保护游标提交，F04 解除长期持有。 |
| `Sources/Features/Home/HomeRequestRefreshGate.swift` | begin/invalidate/commit/finish 与多账号边沿合并；原有纯 gate 保留，A03 在真实 Store 调用点补齐。 |
| `Sources/Features/Home/HomeViewController.swift` | Store 提交门、视图出现、账号事件、预取与 Grid/Tab/路由；A03 已用会话快照补漏事件并解除事件消费对网络刷新等待。 |
| `Sources/Features/Home/HomeViewModel.swift` | 分类分页、推荐→Feed→热门兼容链、Rx/async；N01 保留取消语义，不在取消后继续下一条 fallback 请求。 |

### Features / Profile（3 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `Sources/Features/Profile/AuthorViewController.swift` | 初载部分失败、分页失败保留、页码提交、预取与路由、作者卡片；未发现确定缺陷 |
| `Sources/Features/Profile/ProfileViewController.swift` | Account快照、资料刷新、退出、事件流与展示；账号管理层拒绝过期用户结果；未新增确定问题 |
| `Sources/Features/Profile/WebLoginViewController.swift` | Cookie保存代次、授权/首载门、WebKit Store隔离、导航主机、生命周期、按钮绑定；已有安全边界成立；新WKWebView替换恰逢旧prepare回调未结束需专门验证 |

### Features / VideoFeed 与 VideoPlay（7 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `Sources/Features/VideoFeed/VideoFeedGesturePolicy.swift` | 慢拖、预测位移、首尾边界与非法高度；未发现确定缺陷 |
| `Sources/Features/VideoFeed/VideoFeedViewController.swift` | 翻页/横滑、租约与身份门、暂停/重试、表面重建、动作路由；未发现确定核心故障 |
| `Sources/Features/VideoFeed/VideoFeedViewModel.swift` | 热门分页、缓存/播放源验证、Rx兼容；Rx刷新失败清空列表与async保留语义不一致，当前主流程未调用此兼容入口 |
| `Sources/Features/VideoPlay/CommentListViewController.swift` | 评论初载/刷新/分页、错误保留、稳定reply身份、关闭；未发现确定缺陷 |
| `Sources/Features/VideoPlay/VideoPlayLoadGenerationGate.swift` | 离场取消和迟到提交门；逻辑成立 |
| `Sources/Features/VideoPlay/VideoPlayViewController.swift` | 加载/离场代次、独立 PlayerHost、seek/控制条/路由；F03 分离持久加载错误和 Alert；F05 将画面点击手势限定于 playerView，避免父容器截走控制条/返回按钮触摸。 |
| `Sources/Features/VideoPlay/VideoPlayViewModel.swift` | 主源先行、缓存、详情/推荐并行、Rx兼容；附属请求 try? 未打印失败诊断，非确定功能故障 |

### Features / LiveChat（10 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `Sources/Features/LiveChat/BiliLiveProtocol.swift` | 二进制头、包边界、auth/heartbeat组包、brotli/zlib解压、JSON；恶意深层压缩/对齐需要有界专项探针，未编造可复现结论 |
| `Sources/Features/LiveChat/DanmakuDisplayHelper.swift` | 主线程 relay、binding token、200 条上限、状态格式化；F02 在调用方改末条 ID 观察，上限保留。 |
| `Sources/Features/LiveChat/LiveChatModels.swift` | cmd归一化、弹幕/礼物/SC/下播解析、安全数组下标、展示；过滤类系统消息是已有策略，不擅自扩展 |
| `Sources/Features/LiveChat/LiveChatService.swift` | transport generation、认证截止、心跳/重连预算、取消、二进制事件顺序；F01 修默认凭证调用方，服务本身保留认证门。 |
| `Sources/Features/LiveChat/LiveChatViewController.swift` | Store/VM 所有权、连接和取消按钮、弹幕滚动；F01 强持有 VM 并允许准备期间断开，F02 监听末条 ID。 |
| `Sources/Features/LiveChat/LiveChatViewModel.swift` | 保留 Input/Output 和 service 注入；F01 补真实房间/凭证链、任务与 binding 取消，A04 校验凭证所属账号会话。 |
| `Sources/Features/LiveChat/LivePlaybackQualityLadder.swift` | 五档有界降级/终态/reset；逻辑成立 |
| `Sources/Features/LiveChat/LiveRoomRepository.swift` | roomInit/roomInfo/playInfo/danmuInfo和data非空检查；未发现确定缺陷 |
| `Sources/Features/LiveChat/LiveRoomViewController.swift` | Store/VM、播放候选、重试/离场、资料和弹幕；F02 改末条 ID 驱动滚动；隐藏页面迟到候选仍属可见流程验证边界。 |
| `Sources/Features/LiveChat/LiveRoomViewModel.swift` | roomInit、三路并行、加载代次、清晰度降级、弹幕 binding；A04 绑定 token 请求会话并校验安装，拒绝旧凭证时保留视频成功状态。 |

### AOXFoundationKit 生产源码（19 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/Extensions/Array+BD.swift` | 安全下标边界，未新增确定问题。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/Extensions/Dictionary+AOX.swift` | String/Int 安全读取和转换，未新增确定问题。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/Extensions/Int+AOX.swift` | 短数字、Int/TimeInterval 时长；P05 保护 NaN/∞/超界转换及小时位 64 位格式，不更改合法值语义。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/Extensions/String+AOX.swift` | trimming、Optional 判空、URL 编码；单个参数的保留字符边界见上。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/Logger+Foundation.swift` | 日志分类/模块私有性，未新增确定问题。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/AppModule.swift` | 优先级、MainActor 上下文、事件 Sendable、隐私协议，未新增确定问题。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/ModuleManager.swift` | add/register/initialize、隐私两阶段、通知及 reset；K03 以模块身份实现幂等注册；reset 后旧延时 block 仍属测试入口边界。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/RouteMiddleware.swift` | 洋葱链、登录拦截、参数注入、analytics；未新增确定问题。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/SchemeRoute.swift` | 路由上下文、参数类型、错误/source；K01 增加明确 cancelled，App 穷尽分类同步。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/SchemeRouter.swift` | query/options、重定向、深度、backup/next、中间件/handler/observer；K01 修复重复解码、取消链继续和非法 delay。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/ServiceRegistry.swift` | singleton/transient、alias/tag、重入与嵌套 factory、注入缓存；K02 主表/alias/tag 统一使用 metatype 身份。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/Network/NetworkMonitor.swift` | 同锁 start/stop、generation、NWPath 值快照、主队列通知、昂贵/受限路径；未新增确定问题。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/Network/NetworkPermissionManager.swift` | CTCellularData、首启标记、reachability fallback、锁外 callback；未新增确定问题。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/Protocols/Reusable.swift` | cell 注册/解队、reuseIdentifier；强制 cast 依赖注册约定，未把偏好当缺陷。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/Protocols/ServiceProtocols.swift` | DIContainer 兼容转发，不删除既有能力；未新增确定问题。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/Protocols/UserFacingError.swift` | 用户错误消息 fallback，未新增确定问题。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/Utilities/AppEnvironment.swift` | 编译环境、API 配置锁、未配置前的明确前置条件，未新增确定问题。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/Utilities/Screen.swift` | MainActor、screen/safeArea 读取，多 scene 首项策略需按宿主使用场景评估，未确认新 bug。 |
| `Packages/AOXFoundationKit/Sources/AOXFoundationKit/Utilities/ThreadSafeDictionary.swift` | 读写 barrier、原子 getOrInsert，同步写入可见性；未新增确定问题。 |

### AOXNetworkKit 生产源码（26 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Client/DownloadClient.swift` | 多等待者、独立取消、pause/resume generation、sticky 终态、resumeData 持久化；未新增确定问题，额外恢复边界见上。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Client/NetworkClient.swift` | cache/dedup/熔断、adapt/receive/recovery、错误和 key；K04 leader 领取并结算许可，K05 缓存读写同一原始请求身份。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Client/UploadClient.swift` | multipart/raw、header、进度、验证与解码；未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Client/WebSocketClient.swift` | 全部 858 行：一次性 gate、delegate 聚合、握手/timeout、代次、广播背压、ping、重连预算与清理；单等待者取消契约待上层核实。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Core/Endpoint.swift` | URL/参数/form/json 转换、timeout、cache 元数据；固定 base+path 使用边界未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Core/HTTPMethod.swift` | 自有类型/Alamofire 桥接，未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Core/NetworkError.swift` | AF 错误分类、HTTP/业务/解码/传输；取消通过 transport 暴露需由主审结合调用方评估，未重复列新问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Core/ParameterEncoding.swift` | URL/json/form 语义，未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Core/RequestContext.swift` | request 身份、锁保护 retry、时间/priority/signing，未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Core/RequestPriority.swift` | API/realtime/prefetch/upload/download 选择，未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Core/ResponseDecoder.swift` | JSON 解码与业务失败保留，未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Middleware/CacheMiddleware.swift` | TTL、side table、命中和回收；K05 context.id 同时绑定 policy 和稳定 key，兼容原有手动注册。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Middleware/DefaultHeadersMiddleware.swift` | 保留已有 header，未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Middleware/Middleware.swift` | adapt/didReceive/recover 默认透传契约，未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Middleware/MiddlewareInterceptor.swift` | Session adapter 与 pipeline 上下文区分、retier 组合，未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Middleware/RateLimitMiddleware.swift` | 预扣令牌并发错峰、refill、取消/配置边界见上。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Middleware/SigningMiddleware.swift` | query 提取、signer、单次恢复门限；未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Monitor/MetricsCollector.swift` | weak delegate、history 上限、饱和字节总计、P95 口径；未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Monitor/NetworkEventMonitor.swift` | 单逻辑请求门禁、弱引用、status/serializer 错误、事务聚合；未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Resilience/CircuitBreaker.swift` | open/cooldown/halfOpen、许可代次及全部结束路径；K04 neutral 释放探测额度，旧代结果不结算新代。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Resilience/RequestDeduplicator.swift` | 原子 leader、共享结果、独立 waiter、完成/取消竞争和 key 清理；K06 只取消当前等待者，共享 work 完成驱动清理。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Session/RequestSigner.swift` | 签名/可恢复协议语义，未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Session/RetryPolicy.swift` | 幂等方法/最大次数、HTTP 408/429、URL error、日志；保留 POST 不自动重试，未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Session/SSLPinning.swift` | Alamofire cert/public-key evaluator、chain 参数；未新增确定问题。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Session/SessionPool.swift` | 三层 session、CookieStorage 策略、分优先级超时/QoS/cache；bare/delegate 不执行自定义 pinning 是配置边界，当前 App 无 pinning 注入。 |
| `Packages/AOXNetworkKit/Sources/AOXNetworkKit/Testing/MockClient.swift` | stub first-match、请求记录、fallback、delay/type；K07 在锁外调用用户 factory，保留记录和规则选择的原子性。 |

### AOXPlayer 生产源码（17 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `Packages/AOXPlayer/Sources/AOXPlayer/Core/DASHCompositionBuilder.swift` | 并行加载 AVAsset 音视频轨、时长/offset、双轨 composition 与错误/取消；保留现有 DASH 能力，未确认新增缺陷。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/Core/LiveStreamPlaybackState.swift` | 候选 generation、状态推进、首帧门和终态；未确认新增缺陷。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/Core/LiveStreamPlayerView.swift` | HLS 候选换源、KVO/首帧、旧回调隔离、播放/cleanup；与 LiveRoom 调用链交叉检查。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/Core/PlayURLFetching.swift` | 完整播放源、音轨/分段/已知时长、旧 URL fetcher 兼容；未删除接口或反向依赖业务层。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/Core/PlaybackAudioSessionCoordinator.swift` | 音频会话激活/释放、共享生命周期与播放器调用；未确认新增缺陷。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/Core/PlaybackProgressManager.swift` | 进度有效性、节流、barrier 持久化、续播清理；P05 拒绝非有限快照覆盖已存进度。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/Core/PlayerTheme.swift` | 播放器主题配置及默认值；未确认新增缺陷。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoCacheManager.swift` | 稀疏范围、磁盘读写、meta、总长改变作废、读失败和缓存覆盖；为 P03 全范围预检/分块消费提供边界。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoPlayerManager.swift` | MainActor 租约、旧 owner 拒绝、挂载/摘除、buffer、共享播放器生命周期；现有租约回归保留。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoPlayerView.swift` | 逐段加载、DASH 准备、item/observer generation、暂停/seek、重试、后台、进度/首帧；P05/P06/P07 修复时间、持有环和播放意图；P11 处理片尾重播/所选位置继续，P12 拒绝与显式暂停冲突的同 item 迟到 KVO。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoResourceLoader.swift` | URL scheme、缓存/内容信息顺序、响应校验、task ID、EOF 清理；P01/P02/P03/P04 保留；P09 按 currentOffset 连续交付，P10 使用合法响应坐标并区分 206 切片长度。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoResourceRequestManager.swift` | probe/fixed/all-to-end 调度、Range 结构化解析、200/206 起点/终点/总长、正文超长/截断/溢出、完成与取消；P01/P02/P10。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/Core/VideoURLPreloader.swift` | 身份 key、缓存 TTL、容量、owner/任务取消、peek/consume、诊断计数；P08 修复 consume 绕过 TTL。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/Logger+Player.swift` | 播放器、缓存、加载器与预取分类；核对诊断覆盖，不输出认证凭证。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/Models/LiveStreamCandidate.swift` | HLS 候选 URL、镜像/清晰度/编码元数据；未确认新增缺陷。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/Models/PlaybackState.swift` | 加载/就绪/播放/暂停/错误状态契约；与有限时长发射路径核对。 |
| `Packages/AOXPlayer/Sources/AOXPlayer/UI/PlayerControlView.swift` | 播放按钮、滑动 seek、时间/进度绑定、无障碍及清理；P05 的真实 UI 消费方，未散落 AVPlayer 生命周期。 |

### AOXUIKit 生产源码（13 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `Packages/AOXUIKit/Sources/AOXUIKit/Base/BaseNavigationController.swift` | 导航栈、状态栏和转场宿主边界；未确认新增缺陷。 |
| `Packages/AOXUIKit/Sources/AOXUIKit/Base/BaseViewController.swift` | 页面生命周期、主题/基础 UI 钩子与控制器宿主；未确认新增缺陷。 |
| `Packages/AOXUIKit/Sources/AOXUIKit/Components/ErrorPresenter.swift` | 用户可见错误转换、展示和重试入口；未确认新增缺陷。 |
| `Packages/AOXUIKit/Sources/AOXUIKit/Components/GradientView.swift` | 渐变 layer 创建、颜色配置、布局更新；未确认新增缺陷。 |
| `Packages/AOXUIKit/Sources/AOXUIKit/Components/PaddingLabel.swift` | 绘制 inset、intrinsic size、sizeThatFits 和属性更新重绘；U01 修复多行测量与实际绘制宽度不一致。 |
| `Packages/AOXUIKit/Sources/AOXUIKit/Components/RefreshLoadMore.swift` | 刷新/加载更多状态、触发与结束、UIKit 消费；未确认新增缺陷。 |
| `Packages/AOXUIKit/Sources/AOXUIKit/Components/ToastView.swift` | 提示挂载、显示/移除和生命周期；未确认新增缺陷。 |
| `Packages/AOXUIKit/Sources/AOXUIKit/Extensions/UIColor+AOX.swift` | 颜色转换和主题辅助；未确认新增缺陷。 |
| `Packages/AOXUIKit/Sources/AOXUIKit/Extensions/UIView+AOX.swift` | 视图通用方法和布局边界；未确认新增缺陷。 |
| `Packages/AOXUIKit/Sources/AOXUIKit/Logger+UIKit.swift` | UI 日志类别与模块边界；未确认新增缺陷。 |
| `Packages/AOXUIKit/Sources/AOXUIKit/SwiftUI/AOXAsyncStateView.swift` | loading/empty/error/loaded 显示及重试、无障碍；未确认新增缺陷。 |
| `Packages/AOXUIKit/Sources/AOXUIKit/SwiftUI/AOXDesignSystem.swift` | 颜色/字型/卡片、布局和可访问性约定；未确认新增缺陷。 |
| `Packages/AOXUIKit/Sources/AOXUIKit/SwiftUI/AOXHostingController.swift` | SwiftUI 与 UIKit 生命周期、导航及容器装配；真实 Feature 入口交叉阅读。 |

### 根包测试/夹具（36 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `Tests/AOXPlayerTests/VideoURLPreloaderTests.swift` | 根包的预取完整源、身份隔离、兼容 fetcher 与容量/任务行为；与包内新增 TTL 回归共同覆盖。 已纳入对应最终测试结果。 |
| `Tests/AccountTests/AccountManagerSessionTests.swift` | 旧登录/重登录、资料 single-flight、服务拒绝 revision、自然/冷启动过期；A01 的新增读取未知场景由 CookieReadAvailabilityTests 补齐。 |
| `Tests/AccountTests/AccountSessionEventHubTests.swift` | 全量读：多消费者事件顺序；未确认断言错误。 |
| `Tests/AccountTests/CookieDomainBoundaryTests.swift` | 全量读：根域/真子域/伪后缀；未确认断言错误。 |
| `Tests/AccountTests/CookieReadAvailabilityTests.swift` | 活跃会话读取失败不销毁/不输出旧 Cookie，读取恢复；冷启动未知不假登录、不删除原存储。 已纳入对应最终测试结果。 |
| `Tests/AccountTests/CookieSecureStorageTests.swift` | 系统往返、存储隔离、迁移/回滚、tombstone、Cookie 筛选与 WebKit 屏障；系统 Keychain 往返 1 项因 entitlement 跳过，其余已纳入通过汇总。 |
| `Tests/ContentPrefetchTests/PrefetchLifecycleTests.swift` | 后台网络模式变化、后台断网恢复均不执行计划；回到前台才使用保留需求。 已纳入对应最终测试结果。 |
| `Tests/ContentPrefetchTests/VideoPrefetchWindowPlannerTests.swift` | owner 取消隔离、窗口/去重/live 过滤和空输入；N05 后台/网络组合另由 PrefetchLifecycleTests 补齐。 |
| `Tests/FollowingTests/FollowingAutoplaySelectorTests.swift` | 可见比例、中心优先、阈值3项；与选择器一致 |
| `Tests/FollowingTests/FollowingPaginationTests.swift` | 游标/终态/失败保留、空页预算/断点/循环/重叠；A02 会话与取消另由 FollowingSessionIsolationTests 补齐。 |
| `Tests/FollowingTests/FollowingPlaybackIdentityStateTests.swift` | 已应用/失败/旧解析/离場播放身份；与新增 Store 会话回归互补。 |
| `Tests/FollowingTests/FollowingSessionIsolationTests.swift` | 新旧账号列表/游标、取消后 offset、隐藏期间换号、旧收尾不清新 loading、Rx 生命周期。 已纳入对应最终测试结果。 |
| `Tests/HomeTests/HomeRequestRefreshGateTests.swift` | 纯 gate 的三个既有场景；A03 真实 Store 漏事件/提交身份另由 HomeSessionIsolationTests 补齐。 |
| `Tests/HomeTests/HomeSessionIsolationTests.swift` | 漏账号事件的重新出现、事件消费前身份已变、取消不开始 fallback。 已纳入对应最终测试结果。 |
| `Tests/LiveChatTests/HeartbeatSchedulerTests.swift` | ping失败/悬挂/先pong/stop/间隔规范化；完整读取 |
| `Tests/LiveChatTests/LiveChatServiceStateTests.swift` | 空凭证、认证门、超时/拒绝、替换/重连/手动断开；F01 默认页面凭证链由新测试补齐。 |
| `Tests/LiveChatTests/LiveRoomLoadingTests.swift` | 并行辅助降级、非法room、清晰度有界与错误分类、重试迟到、binding token；完整读取 |
| `Tests/LiveChatTests/LiveRoomSessionIdentityTests.swift` | revision/登录位改变拒绝旧凭证、同会话 mid 补全、旧 binding 撤销且保留视频成功状态。 已纳入对应最终测试结果。 |
| `Tests/LiveChatTests/StandaloneLiveChatTests.swift` | Store 持有 VM、service 注入、真实房间→凭证→连接、空凭证、准备期间断开、换号晚回包。 已纳入对应最终测试结果。 |
| `Tests/NetworkingTests/AsyncRxBridgeTests.swift` | 全量读：迟到成功抑制、主线程error、onNext重入和跨线程dispose；未确认断言错误。 |
| `Tests/NetworkingTests/AuthMiddlewareCredentialBoundaryTests.swift` | 全量读：-101 vs风控、HTTPS域名、JSON/form CSRF；未确认断言错误。 |
| `Tests/NetworkingTests/DisplayValueBoundaryTests.swift` | 异常展示计数/时长通过公开 DTO 转换不 trap；正常万/亿与长时长兼容。 已纳入对应最终测试结果。 |
| `Tests/NetworkingTests/LiveFeedBatchTests.swift` | 三子页中间失败不提交、重试仍得到原三页、子页取消不变部分成功。 已纳入对应最终测试结果。 |
| `Tests/NetworkingTests/LivePlaybackCandidateTests.swift` | 全量读：全HLS镜像、排序、无效/非HTTP地址、query拼接；未确认断言错误。 |
| `Tests/NetworkingTests/NetworkClientReliabilityTests.swift` | 全量读：去重key host/type、熔断/重试分类、缓存policy回收；未确认断言错误。 |
| `Tests/NetworkingTests/PlaybackCandidateRecoveryTests.swift` | 坏高优先级视频/AVC/音轨不能遮蔽有效候选。 已纳入对应最终测试结果。 |
| `Tests/NetworkingTests/RecommendResponseTests.swift` | 全量读：id→aid、显式aid优先、非视频卡；未确认断言错误。 |
| `Tests/NetworkingTests/SessionPoolCookieIsolationTests.swift` | 全量读：Bili禁用、delegate配置、通用默认兼容；未确认断言错误。 |
| `Tests/NetworkingTests/VideoPlaybackSourceValidationTests.swift` | progressive/DASH、缺/坏音轨、URL 安全；N03 混合有效候选另由 PlaybackCandidateRecoveryTests 补齐。 |
| `Tests/NetworkingTests/WBISignerTests.swift` | 全量读：RFC3986、固定签名向量、reserved字段、port/IPv6、key长度、-352并发恢复；未确认断言错误。 |
| `Tests/PaginationKitTests/PaginationCancellationTests.swift` | 不配合取消的 continuation 迟到成功不得改 refresh/loadMore 的 items/page/hasMore。 已纳入对应最终测试结果。 |
| `Tests/PaginationKitTests/PaginationControllerTests.swift` | 旧 refresh/reset/loadMore、预取距离及终态；N01 迟到取消另由 PaginationCancellationTests 补齐。 |
| `Tests/ProfileTests/WebDataStorePolicyTests.swift` | 持久/临时Store、HTTPS主域、Cookie保存门、首载门；完整读取 |
| `Tests/VideoFeedTests/VideoFeedGesturePolicyTests.swift` | 翻页预测、上下界、空源/非法高度；完整读取 |
| `Tests/VideoPlayTests/VideoPlayLoadingTests.swift` | 主源不等待附属、预取命中、离场 gate；F03 Alert 关闭和重试由新测试补齐。 |
| `Tests/VideoPlayTests/VideoPlayRetryPresentationTests.swift` | 播放首载失败，关闭 Alert 后 inline retry 保留，第二次请求成功后清除。 已纳入对应最终测试结果。 |

### 四个本地包测试/夹具（20 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `Packages/AOXFoundationKit/Tests/AOXFoundationKitTests/NetworkMonitorLifecycleStateTests.swift` | 网络监控重复启动、停止和重启隔离；本次路由/注册新增边界由两份新回归覆盖。 |
| `Packages/AOXFoundationKit/Tests/AOXFoundationKitTests/RegistryAndModuleReviewTests.swift` | 命名空间同名类型/tag/alias、嵌套 singleton、重复 privacy/remaining、privacy→all、reset 注册周期。 已纳入对应最终测试结果。 |
| `Packages/AOXFoundationKit/Tests/AOXFoundationKitTests/RouteAndDurationReviewTests.swift` | 编码加号/嵌套参数、取消延时及已取消分发、非法 delay、非有限/超界时长和正常格式。 已纳入对应最终测试结果。 |
| `Packages/AOXNetworkKit/Tests/AOXNetworkKitTests/CacheAndDedupReviewTests.swift` | 签名后响应写入原始缓存身份并由真实 send 命中；独立取消共享等待者、成功/失败后的 key 回收。 已纳入对应最终测试结果。 |
| `Packages/AOXNetworkKit/Tests/AOXNetworkKitTests/CircuitAndMockReviewTests.swift` | 半开 neutral 退出、旧许可隔离、坏 URL key、factory 重入/并发 16 请求记录。 已纳入对应最终测试结果。 |
| `Packages/AOXNetworkKit/Tests/AOXNetworkKitTests/DownloadTaskStateMachineTests.swift` | 共享结果、独立取消、终态重读、HTTP 失败、立即恢复；已纳入最终包测试，结果见验证表。 |
| `Packages/AOXNetworkKit/Tests/AOXNetworkKitTests/LocalRFC6455Server.swift` | 全部 629 行：loopback 监听、HTTP upgrade、frame mask/长度/close、超时/清理；夹具只覆盖指定场景，不宣称完整 RFC 服务。 |
| `Packages/AOXNetworkKit/Tests/AOXNetworkKitTests/NetworkEventMonitorMetricsTests.swift` | 多 serializer 去重、redirect 统计、error/溢出/weak delegate；已纳入最终包测试，结果见验证表。 |
| `Packages/AOXNetworkKit/Tests/AOXNetworkKitTests/SigningMiddlewareRecoveryTests.swift` | signed/unsigned 和重签次数；已纳入最终包测试，结果见验证表。 |
| `Packages/AOXNetworkKit/Tests/AOXNetworkKitTests/WebSocketIntegrationTests.swift` | 本地 RFC6455、403、close、重连预算、buffer、TLS 拒绝、deadline inbox；已纳入最终包测试，结果见验证表。 |
| `Packages/AOXNetworkKit/Tests/AOXNetworkKitTests/WebSocketStateMachineTests.swift` | gate 竞争/取消、握手 delegate、close/completion 聚合；已纳入最终包测试，结果见验证表。 |
| `Packages/AOXPlayer/Tests/AOXPlayerTests/DASHCompositionBuilderTests.swift` | DASH 双轨准备、轨道/时长、offset 与取消/失败边界。 已纳入对应最终测试结果。 |
| `Packages/AOXPlayer/Tests/AOXPlayerTests/LiveStreamPlaybackStateTests.swift` | 直播候选状态、首帧与旧 generation。 已纳入对应最终测试结果。 |
| `Packages/AOXPlayer/Tests/AOXPlayerTests/PlaybackReviewTests.swift` | 有限时长、协议/本地媒体、TTL、DASH 释放回归保留；新增两个单段/多段参数化方法共 4 case，用真实 2 秒 CAF 验证 EOF 重播、立即暂停后状态和时间稳定、片尾 seek 后从所选位置继续；最终均通过。 |
| `Packages/AOXPlayer/Tests/AOXPlayerTests/PlayerLoadGenerationStateTests.swift` | 视频换源/停止和迟到回调的代次门。 已纳入对应最终测试结果。 |
| `Packages/AOXPlayer/Tests/AOXPlayerTests/VideoPlayerManagerLeaseTests.swift` | 共享播放器租约获取/释放、过期 owner 拒绝和挂载隔离。 已纳入对应最终测试结果。 |
| `Packages/AOXPlayer/Tests/AOXPlayerTests/VideoResourceRangeTests.swift` | 原七项 all-to-end/EOF/Content-Range 回归，加未来块拒绝、重叠块只交当前所需、耗尽/溢出三项；十项纳入最新通过结果。 |
| `Packages/AOXPlayer/Tests/AOXPlayerTests/VideoResourceResponseTests.swift` | 新增六项 Swift Testing：Manager 实际 delegate offset/数据，未知 total 不用切片长，坏范围/不一致 Content-Length/multipart 拒绝，正文超长阻止转发、截断报错；测试不声称实际磁盘读写。 |
| `Packages/AOXUIKit/Tests/AOXUIKitTests/AOXAccessibilityTests.swift` | 通用 SwiftUI/UIKit 组件可访问性标签、状态与语义。 已纳入对应最终测试结果。 |
| `Packages/AOXUIKit/Tests/AOXUIKitTests/PaddingLabelLayoutTests.swift` | 140 点可用宽度含 40 点水平内边距时，多行测量与 UILabel 的 100 点文本宽度一致。 已纳入对应最终测试结果。 |

### Swift Package 清单（5 文件）

| 文件（仓库相对路径） | 小区域与当前结论 |
| --- | --- |
| `Package.swift` | Swift 6/iOS 16 声明、product/target 路径、依赖和测试目标；与真实 Xcode/SPM 构建入口交叉核对。 本次补 Following 的 ServiceKit 依赖和新增测试的显式依赖；第三方版本锁保持不变。 |
| `Packages/AOXFoundationKit/Package.swift` | Swift 6/iOS 16 声明、product/target 路径、依赖和测试目标；与真实 Xcode/SPM 构建入口交叉核对。 |
| `Packages/AOXNetworkKit/Package.swift` | Swift 6/iOS 16 声明、product/target 路径、依赖和测试目标；与真实 Xcode/SPM 构建入口交叉核对。 |
| `Packages/AOXPlayer/Package.swift` | Swift 6/iOS 16 声明、product/target 路径、依赖和测试目标；与真实 Xcode/SPM 构建入口交叉核对。 |
| `Packages/AOXUIKit/Package.swift` | Swift 6/iOS 16 声明、product/target 路径、依赖和测试目标；与真实 Xcode/SPM 构建入口交叉核对。 |

## 文档、配置与交付状态

| 文件/范围 | 检查与结果 |
| --- | --- |
| README.md；docs/Architecture.md | 定位、真实模块边界、SwiftUI 展示/ UIKit 宿主及三层依赖；Architecture 与实际账号/预取/路由实现同步。 |
| docs/LaunchFlow.md | 启动、注册、服务注入、登录/登出、Keychain 未知态与账号事件；消除旧通知/旧调用链说明。 |
| docs/VideoPlayback.md | 按真实 Store、租约、双轨/多段、Range/EOF/缓存、时间与直播凭证链更新；`:188` 补同 item playing 快照的当前意图门，`:260` 补单段/多段片尾重播及定位后继续语义。 |
| BiliDili/Configurations/BiliDiliDebug.xcconfig；BiliDiliRelease.xcconfig；对应 entitlements | 构建配置、签名/权限边界只读核对；没有为包测试 entitlement 改动发布权限。 |
| BiliDili/Info.plist；BiliDili/Base.lproj/LaunchScreen.storyboard；BiliDili/Assets.xcassets | App 资源与入口核对；未作与修复无关的资源改动。 |
| BiliDili.xcodeproj；.github/workflows/ios-ci.yml；Package.resolved | 共享 BiliDili scheme、本地包接入和固定 CI Xcode 版本；构建入口以真实工程为准，第三方锁未升级。 |
| AGENTS.md 与父 workspace 规则 | 仅作为职责/模块/文档位置和验证边界；本次没有领派 Wakeflow 任务或修改控制状态。 |

所有本次源码/测试/产品文档修复保存在工作区，尚未提交 Git。四个 Packages 子模块均有 dirty 源码；后续如需交付提交，应先在各子模块提交并取得可复现的提交，再更新父仓库 gitlink 指针。本次未执行 commit/push，也没有回退其他已有改动。

本报告长期归档位置属于 workspace 的 `wakeflow-ledger/BiliDili/`，不放进产品源码 `docs/`。临时证据报告与测试摘要仅以文件名记录：`bilidili-review-core-infra.md`、`bilidili-review-features.md`、`bilidili-review-foundation-network.md`、`bilidili-player-range-review.md`、`bilidili-live-room-session-review.md`、`bilidili-range-continuity-review.md`、`bilidili-eof-replay-review.md` 及上表最终测试摘要；独立解码 JSON/两张 PNG 以本节同目录相对链接归档。


## 收尾检查与继续入口

- 主仓库及 AOXFoundationKit、AOXNetworkKit、AOXPlayer、AOXUIKit 的 `git diff --check` 均通过。
- 复核使用现有模块入口与当前工作树，没有提交、合并、发布或修改第三方锁定版本。
- 系统打开确认阻塞已解除，已回到同原视频；最终构建所列最小可见流程已完成。部分视频在模拟器 seek/重播时仍出现绿色帧，保留限定结论与独立对照证据，由主审验收本报告并归档，不再要求用户完成旧 Open 步骤。
- 路由/播放器观测中的公开媒体标识、具体账号、凭证、设备标识和本机运行目录未写入本报告。
- UIKit 手势语义依据：[cancelsTouchesInView](https://developer.apple.com/documentation/uikit/uigesturerecognizer/cancelstouchesinview)。默认识别手势时会取消待传给子视图的触摸，本次将手势范围限定到视频子视图。
