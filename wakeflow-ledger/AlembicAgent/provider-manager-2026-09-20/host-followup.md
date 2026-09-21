# Main 宿主接线待办（只读审阅，不是跨仓实施授权）

本轮只修改 AlembicAgent。以下缺口从真实 Main 调用链确认；相关代码未改动。

## 专用 embedding 在热切换时丢失

入口：`Alembic/lib/injection/modules/AiModule.ts` 的 initialize / ensureManagerForProvider / createEmbedFallback。初始化既把独立配置生成的 embedding，也把自动 fallback，交给同一个 setEmbedProvider。切换时的选择器只调用 createEmbedFallback：切到支持 embedding 的生成 provider 时返回 null，当前 embedding 路由变成生成 provider。

受控只读 probe：配置 embedding 为 Ollama，切换前有效实例 ollama:fixture-embed，切到 OpenAI 后 raw embedding=null，有效实例 openai:fixture-next，专用配置仍为 Ollama。不能在 Manager 内把全部 setter 调用都改成永久覆盖，这会固定原本临时的 fallback。

拟修复位置：Main 抽取统一的 embedding 选择函数，供 initialize 与 switch 的 selector 共用，保留既有专用配置优先及错误处理语义。回归应以实际 AiModule 装配 Manager，验证专用配置存在/不存在、生成 provider 支持/不支持 embedding、重载前后的 DI 引用与缓存失效。避免虚构任何新厂商 embedding 能力。

## 无 AI 启动后首次启用漏装计量与 embedding

入口：`Alembic/lib/injection/ServiceContainer.ts` 的 reloadAiProvider 无 Manager 分支，以及 `AiModule.ts` 的 register / ensureManagerForProvider / attachTokenRecorder。启动无 provider 时 register 不挂 recorder；后续 ensureManagerForProvider 只创建 Manager 并绑定 hooks，没有补 recorder 或选择初始 embedding。

受控只读 probe：首次 reload 后 Manager 存在，但发 usage 后记录数 0、raw embedding=null；手工执行现有 attachTokenRecorder 后同样事件产生 1 条记录。

拟修复位置：Main 把初次启用需要的 Manager、recorder、embedding、DI 初始化收敛到可复用的装配路径，供启动与运行中首次启用调用。回归从无 provider 的真实 Container 开始，使用受控 Provider、实际回调和假的同步 store，验证一条事件只记录一次、专用 embedding 生效，以及后续普通热切换不重复挂载。

## 已验证边界

Main 的 DI hook 只赋两个 singleton 引用，可用旧引用补偿；缓存失效只置 null，不保留旧对象，不能还原对象身份。Core TokenUsageStore.record 是没有幂等键的同步 INSERT，不能自动重试。AgentRuntime 保持旧 provider 引用，旧请求不会因新路由自动取消。Main 没有生产 onSwitch 监听器注册；异步观察者验证属于公开接口鲁棒性，不代表已有实时广播链。

以上 probe 由只读辅助审阅执行，根代理已核对对应源码分支；本轮不宣称 Main 集成测试或接线修复完成。独立 embedding usage 绑定仅消费实例已有事件，Gateway.embed 当前没有原生 token 上报，不能称为完整 embedding 成本计量。
