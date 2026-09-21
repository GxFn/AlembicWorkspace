# Provider manager 审阅与修复

用户确认继续上一轮提出的 AiProviderManager 热切换、用量回调和依赖清理审阅。基线 8f58bde。直接用户任务，仅 AlembicAgent 产品代码；不生成 Wakeflow 派发状态。AGENTS.md / CLAUDE.md 既有改动保留。

1. 基线验证真实 facade/Gateway 及 Manager 旧用例。复现 fallback 初始化失败后的半切换状态，改为准备后发布；继续覆盖 DI 同步、缓存失效失败和补偿失败。外部任意副作用不能宣称自动回滚，错误必须说明阶段和恢复边界。
2. 验证同步回调重入、事件订阅变化和监听器失败；保持成功时序与旧接口，通知独立于状态提交。
3. 复现计量覆盖原回调、遗漏 embedding provider 事件与旧请求身份漂移；将计量绑定从路由管理分离，共用 DTO，避免重复绑定；实际 SDK/fake HTTP 验证切换中的旧请求与新请求。
4. 按职责移动现有 Manager 测试，保留成功链路，新增失败/补偿/事件/计量边界；更新接口说明与分层合同，完成自审、npm run check 和本仓提交。

只读 Main 证据已发现：专用 embedding 与启动 fallback 经同一 setter 装配；无 provider 冷启动后首次 reload 缺 recorder/embedding 初始化。两者归 Main，本轮不盲目新增永久覆盖政策或修改相邻仓库。

参考：Node EventEmitter 的同步监听器顺序与发出时订阅快照；OpenTelemetry 错误处理要求遥测故障不影响主业务。本地 TencentDB runner 在 run 后共享 lastUsage，本仓继续采用当前响应事件，不复制全局/实例最近用量旁路。所有模型验证使用受控 fixture，不使用真实凭据或 API。
