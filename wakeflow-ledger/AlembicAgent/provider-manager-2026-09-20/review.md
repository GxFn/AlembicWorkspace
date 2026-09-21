# Provider manager 热切换与计量审阅

Agent 范围已完成。提交 `b303b3538d1b392d51461efc8aea69a0de2fe45b`，基线 `8f58bdedfe1ce31c52779f3805c40f026f765197`，分支 `codex/llm-sdk-adapters`；未 push。AGENTS.md / CLAUDE.md 原有改动保留，不在提交内。

## 完成范围与职责

- AiProviderManager 管理候选准备、路由发布、DI 同步、缓存失效与通知；management/contracts 保留原公共类型的兼容出口，ProviderUsageTracker 管用量绑定，observers 管同步异常与 Promise rejection。没有增加第二套 provider 或执行循环。
- 准备阶段完成能力/embedding 验证与计量绑定，再发布新路由。初始化或能力失败不会留下部分新状态；DI/缓存失效失败恢复 Manager 引用，并对可重复赋值的 DI hook 传入旧引用补偿。缓存对象不会伪造恢复。
- 失败 Error 带 AI_PROVIDER_SWITCH_FAILED、phase、recovery；补偿失败或异步合同违规后 isReady=false。同步切换中或未完成异步 hook 存在时拒绝再次修改路由。同步能力、初始化、DI、失效回调都观测 Promise，再明确拒绝，避免未处理 rejection 或迟到效果冲掉下一次切换。
- 通知按发出时订阅快照遍历，每个监听器独立 DTO；监听器、原观察者、记录器失败只诊断，日志不复制异常正文。
- 原有用量观察者保留，旧实例回调继续接收在途结果；真实 SDK + 延迟 fake HTTP 验证两代请求分别归档到自身请求模型，不受旧实例 model 后改影响。合法 input/output 才进入记录器，写入失败不重试。
- 每个实例只挂一次 hook，包括当前 embedding；宿主后来装饰/替换回调时尊重其所有权并诊断。失败补偿期间宿主装饰后的标记也保留，下一次尝试不会再包一层重计。没有按 DTO 永久去重，同一对象后续合法事件仍分别记录。

公开包入口仍为 15 个、运行时导出 451 个。原 AiProviderManager 正常用例从混合 Provider 测试迁入专项生命周期文件，未丢断言；新覆盖失败、补偿、重入、监听器修改、异步回调、计量归属与 hook 所有权。分层规则约束新模块只能向 DTO/观察者基础层依赖。消费方及替代入口扫描见 [consumer-scan.txt](consumer-scan.txt)。

## 验证与自审

基线：3 文件 / 40 测试通过。最终完整 npm run check 退出 0：76 文件 / 1218 测试；build/type、lint、公共边界、Core 边界、分层、provider-neutral、严格消费方、validation floor、退役符号检查通过。17 条既有非阻断 lint 警告全部位于未改动文件。

全量验证后仅删除一处已被前置 return 排除的冗余分支；随后再次通过 build:check、4 文件 / 58 项相关测试、改动文件 Biome 与 git diff --check，见 post-review-check.log。Node 22.23.2；Core 依赖仍为 file:../AlembicCore，安装链接仍指向相邻源码。模型验证只用 fake HTTP 和受控 Provider，不访问真实 key 或模型。

7 组有序 RED/GREEN 证据及 SHA256 见 [verification.json](verification.json)。两阶段自审：

1. 规格：保留同步公共方法和实际宿主成功时序、可重建缓存边界、旧请求继续完成及原类/类型出口；不擅自改变专用 embedding 的配置政策，不修改相邻仓或 Wakeflow 状态。
2. 质量：独立只读审阅找出的“宿主装饰 hook 导致重复计量”和“异步能力 predicate 产生未处理 rejection”均已复现并修复；根代理追加失败重试后的所有权回归。当前 Agent 验证范围无未解决 P1/P2。

## 限制与后续

Main 仍有两项 P2 接线缺口：无 provider 启动后首次启用 AI 未补 recorder/embedding；热切换的 selector 忽略专用 embedding 配置。它们已经只读追踪到实际入口，但没有在本轮修改或宣称通过 Main 集成测试。具体变更位置、行为证据与建议回归见 [host-followup.md](host-followup.md)。Main 源码是只读背景，后续实施需要明确跨仓授权。

不可逆宿主副作用不在路由补偿保证内；已清缓存由宿主重建，旧请求不自动取消。若宿主在绑定后完全替换用量槽而不转发旧 hook，Manager 不抢回该槽，也无法代其记录。当前 Gateway.embed 不发原生 token 用量事件，绑定 embedding observer 不等于完整 embedding 成本提取。

## 参考

[Node 22 EventEmitter](https://nodejs.org/download/release/v22.23.2/docs/api/events.html) 的同步通知与发出时监听器集合提供事件语义参考；[OpenTelemetry 错误处理](https://opentelemetry.io/docs/specs/otel/error-handling/) 支持将观测失败与业务结果隔离。本仓实现针对已有函数合同，没有引入新事件总线或遥测框架。

本地 TencentDB-Agent-Memory `06414ac10766b9bd61e4a69f3cf0ea414afb6d4f` 的 MemoryCore/src/adapters/standalone/llm-runner.ts 在执行后提供 lastUsage 旁路。本次继续使用带请求归属的响应事件，避免并发依赖最近一次共享结果；没有复制其 runner 或成本实现。
