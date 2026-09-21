# 剩余 Provider SDK 迁移

用户在首批提交 `36d34a6` 后确认继续。范围为 AlembicAgent 内 Google、Claude、DeepSeek 的 SDK 接入和可复用映射整理。Core、Main、Dashboard、Plugin 只读；已有 AGENTS.md / CLAUDE.md 修改保持不动。

沿已确认方案顺序执行：

1. 固定当前 AI 合同基线，核对已发布 SDK 类型/源码及真实消费者。
2. Google：先以真实 Gateway/Provider + fake HTTP 复现丢失 finishReason、用量细分及 embedding 分批重放问题；接 SDK 并保留 thought signature、取消、原生 schema 和代理。
3. Claude：验证工具结果、system、schema、结束原因与签名；接 SDK，保留无 embedding 的明确能力声明。
4. DeepSeek：先核对 V4 thinking、reasoning_content、tool_choice 与文本工具兼容路径是否能由固定 SDK 表达；在真实调用链验证后切换。SDK 未覆盖的已有实际能力保留有说明的兼容路径，不静默移除或空壳化。
5. 合并多 provider 已验证为等价的 SDK 消息/结果映射；保留厂商差异。共享合同测试代替重复装配。
6. 自审、公共 API/边界/类型检查及全量测试通过后提交，记录剩余风险和下一步。模型测试均不使用真实 key 或真实服务。

每个行为使用原入口 RED → GREEN。完成标准是生产 facade/Gateway 实际接到 SDK，成功、失败、取消、超时、无效工具参数及部分结果均有可复跑证据；SDK 不拥有工具执行或额外重试循环。
