# 剩余 Provider SDK 迁移与自审

提交 `f863c52496026558cf0133910fc1053b9dc89827`，分支 `codex/llm-sdk-adapters`，基线 `36d34a6`。本轮在用户确认后完成 Google、Claude、DeepSeek 的生成协议迁移，产品修改仅限 AlembicAgent，共 23 个文件；未推送远端。AGENTS.md / CLAUDE.md 的原有修改保持未提交。

## 职责与真实调用链

五家 Provider 的生成均进入固定 SDK 的 V4 单次模型接口，公开 Provider/Transport 类和包入口保留。Google SDK 为 `4.0.76`，Anthropic SDK 为 `4.0.58`，DeepSeek SDK 为 `3.0.49`，共同使用 provider 规范 `4.0.17`。

| 模块 | 本轮职责 |
| --- | --- |
| 各厂商 Transport | 客户端装配、协议选项与必要兼容政策；调用真实 SDK |
| sdkProtocol | 本仓 DTO 与 SDK 的共同投影、工具建议验证、结束原因与用量归一化；同次响应复用 schema 校验器 |
| sdkContinuation | 按模型和连接隔离续接数据，保存原生内容次序，以范围/ID 引用可见文本与工具 |
| sdkErrors | SDK 输入、响应、HTTP 和网络错误边界；原始敏感 payload 不进入普通错误链 |
| LLMGateway | 保留调用意图、并发、重试、熔断和用量；Google embedding 按批次重试 |
| AgentRuntime / ContextWindow | 真实工具循环、进度投影和上下文压缩；保留续接消息原子性与预算计量 |

SDK 不执行本仓工具，不拥有额外重试循环。新增的三家真实 Runtime 测试均验证模型建议→工具管道执行一次→模型最终响应；进度事件不出现推理原文或签名。消费方扫描见 [consumer-scan.txt](consumer-scan.txt)，本仓 Gateway 仍直接装配这些类，公开入口及 Main 的直接导入保留。

## 修复与验证

- Google：推理不再混入可见文本，finishReason 和 thinking/cache 用量完整返回。第二批 embedding 失败只重试第二批，取消不会重放已完成批次；返回数量、维度和有限数值经过验证。
- Claude：保留 `thinking`（包括空文本）、signature 与 `redacted_thinking` 的原始次序；缓存输入计入输入总量并提供细分。显式重试配置由 Gateway 执行，默认仍为 0。
- DeepSeek：保留 V4 thinking/reasoning 回传、`tool_choice` 省略和原有预算政策；文本工具转译有单独诊断并统一校验参数。原生无效参数不会变成可执行空对象。
- Gateway：`toolChoice: none` 不再因 wire 参数过滤而丢失，违背禁用意图的建议被拒绝。Google 环境端点配置与空 embedding 配置默认值经过真实 facade/transport 测试。
- 结果：重复调用 ID 明确拒绝；HTTP 2xx 的坏 body 归为协议失败；负数/异常 token 数不进入预算。SDK 本地输入拒绝不会触发服务端熔断，修正输入后同一 Provider 仍可正常调用。
- 上下文：L2 不合并带续接数据的消息，防止丢失签名顺序或破坏文本范围；旧 reasoning 也完整估算，replay 内容避免重复计数。

上述行为有 13 组 RED→GREEN 记录，详见 [verification.json](verification.json)。部分回归以参数化矩阵覆盖多 Provider 或多入口，避免复制整套装配。历史畸形响应测试已从“空文本成功”改为明确拒绝，并同步验证登记，没有删去该失败场景。

## 最终验证与两阶段自审

`npm run check` 退出 0：75 个测试文件、1170 项测试通过；构建、类型、边界、分层、命名、副作用、provider-neutral、宿主 strict-consumer、validation floor 和退役符号检查通过。公开入口仍为 15 个，运行时导出仍为 451 个。Node 为 22.23.2；Core 依赖仍为 `file:../AlembicCore`，链接指向相邻源码。

完整日志见 [full-check-accepted.log](full-check-accepted.log)。lint 保留未改动文件中的 17 条既有非阻断警告。模型验证全部使用真实 SDK + fake HTTP 或受控 provider，没有真实模型请求、真实 key 依赖或凭据创建。

规格自审：既有真实能力和入口有替代实现与消费方证据；工具权限、执行循环、运行预算和 Core 确定性能力保持原归属。迁移不依赖新宿主壳或空实现。

代码自审：已处理工具禁用意图丢失、旧批次重放、私有块丢失、重复调用 ID、畸形 body、预算计数、配置遗漏和本地校验误计熔断。提交前追加并修复了上下文压缩的续接原子性问题。当前验证范围内没有阻止本批提交的未解决问题。

## 兼容边界与下一步

DeepSeek SDK 没有 embedding adapter，原来可配置 `/embeddings` 路径继续真实调用并校验向量，有明确兼容诊断；这不代表官方 DeepSeek 服务提供该能力。Claude 继续声明不支持 embedding。

Google 改用原生 key 请求头和 JSON Schema 字段；Claude system 使用内容块；所有原生响应由 SDK 验证。自定义代理需要遵循更新后的协议说明。没有实测线上厂商或代理，不宣称覆盖全部远端实现。Responses stored-item 仍受服务端保留期限约束；未新增 SSE、多模态或外部 LiteLLM 部署。

厂商依据包括已锁定 npm 发布包源码，以及 [Claude thinking 回传规则](https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking)、[DeepSeek thinking 规则](https://api-docs.deepseek.com/guides/thinking_mode/)和 [V4 集成兼容字段](https://api-docs.deepseek.com/quick_start/agent_integrations/oh_my_pi/)。使用已确认的字段保真要求，不复制腾讯 runner 的自动工具循环或共享 lastUsage 旁路。

原方案内的下一步是统一有效配置的解析与装配，继续逐文件收敛历史 wrapper 和重复测试。Main/Core 父取消信号的接线仍由其仓库 owner 在对应授权下处理，本轮未修改它们。产品调用说明已更新至 `AlembicAgent/docs/llm-adapters.md`。
