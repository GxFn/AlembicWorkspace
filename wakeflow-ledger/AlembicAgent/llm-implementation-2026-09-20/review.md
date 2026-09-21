# LLM 接入首批实施与自审

用户确认继续实施后，本轮完成 AI 合同整理及首个 SDK provider 迁移。提交：`36d34a66a46cddf3229b8356127965c8f8265faf`；分支：`codex/llm-sdk-adapters`；基线：`94df98f`。产品变更仅在 AlembicAgent，共 41 个文件。已有 AGENTS.md / CLAUDE.md 修改未纳入提交，未推送远端。

## 已完成的真实链路

- OpenAI 和共享其兼容协议的 Ollama 通过现有 Provider/Gateway/Transport 接入 `@ai-sdk/openai` 的 V4 单次模型接口；没有增加第二套 Agent 循环或工具执行器。
- SDK 负责厂商协议；Gateway 继续负责重试、并发、熔断、用量；AgentRuntime 与 ToolExecutionPipeline 继续负责业务循环和权限。真实 Runtime 两轮工具测试验证模型建议→本仓工具执行一次→模型最终响应。
- AI DTO/错误进入底层模块，Transport 不再运行时依赖 AiProvider 门面；原导出路径保留，文件级依赖门禁防止循环回流。
- structured、embedding、probe、summarize 的可选取消合同已贯通本仓调用入口。自定义 Error 取消原因不再误计 provider 故障；HTTP/body 迟到结果不会复活已取消调用。
- Ajv 统一验证三个 structured API（测试含基类与具体 Provider 两种入口）。有 schema 时要求完整 JSON；无 schema 保留旧解析语义；不强转、不补默认值、不删字段、不请求远端引用。
- SDK 错误映射 HTTP status、Retry-After 与网络分类；不会把 SDK 原始请求/body 放入普通错误链。无效工具参数明确拒绝，已确认用量仍记录一次。
- Responses reasoning 引用随消息经 Gateway、Runtime、两种消息适配器回传，以 provider/model/连接摘要隔离；配置和凭据原值不进入 continuation。
- embedding 校验数量、索引、维度、有限数值并恢复输入顺序。普通 facade 失败返回空向量的兼容行为保留；取消明确抛错。

## 测试与验证

`npm run check` 最终退出码为 0。74 个文件、1129 项测试全部通过；15 个包入口与 451 个运行时导出不变。构建、类型、Core/import/layer/doctrine/provider-neutral 门禁、宿主 strict-consumer、validation floor 与退役符号检查通过。全量 lint 仍报告未改动文件中的 17 条非阻断警告，本轮未扩大范围整理这些文件。

所有模型测试使用真实 SDK + fake HTTP 或受控 provider，没有真实模型请求、真实 key 依赖或凭据创建。Node 版本为 22.23.2。`@alembic/core` 保持 `file:../AlembicCore`，安装目录仍解析到相邻源码仓库；npm lock 中的 Core 版本元数据同步反映相邻已安装源码版本，未改 Core 文件。

12 组先失败后通过的行为映射及日志摘要见 [verification.json](verification.json)。完整通过日志为 [full-check-verified.log](full-check-verified.log)。之前两次全量未通过记录保留：一次为旧测试名称登记失配，一次为遗漏的非标准 HTTP fixture；都已在同一验证链中修复。

测试整理使用共享 `jsonResponse` / 原生 Responses fixture 和参数化 schema 矩阵，保留权限、取消和真实调用边界断言。历史“streaming abort”测试实际调用的是普通 HTTP chat，本轮改为等待真实请求开始后取消，并同步修正验证登记名称，没有声称提供 SSE/流式能力，也没有删掉取消测试。

## 两阶段自审

规格自审：本轮完成已确认方案的合同基础与首批 SDK 接入闭环。旧公开构造器与方法仍可用；生产路由真实使用 SDK，测试覆盖成功、错误、取消、超时、工具参数拒绝、用量、消息回传与部分 embedding 结果。没有改 Core 实现、宿主壳、Dashboard 或插件，也没有把 Agent 能力替换为空接口。

代码自审：已处理的阻断项包括取消归类、迟到响应、schema 旁路、坏工具 JSON 变空对象、用量遗漏、Ollama 身份混用、SDK 错误 payload 外溢和跨连接 reasoning 引用。现有权限测试与新增 Runtime SDK 回合均通过；没有发现需要阻止本批提交的剩余问题。

兼容边界：原生协议响应现在经过 SDK 验证。仅返回客户端便利字段 `output_text`、遗漏必要原生字段的自定义代理响应会明确失败，不能继续当有效原生响应。详细调用合同及迁移说明在产品文档 `AlembicAgent/docs/llm-adapters.md`。本轮没有实测线上 provider 或自定义代理，因此不宣称覆盖所有远端实现。

## 后续责任

原确认方案内的后续 Agent 工作：Google、Claude、DeepSeek 逐个迁移，保留厂商字段与降级语义；进一步统一有效配置；处理 Google 内部分批 embedding 与外层整次重试的粒度。当前保留其旧 transport，未提前删除真实消费者。

源码审计发现的仓外接线问题（未由本轮实施）：Main RuntimeInitializer 的 embeddingFn 丢第二参数；部分 Strict job 与后台 refine session 尚未提供父生命周期信号；Core legacy embedding adapter、batch/search 消费者尚未完整向下传 signal。这些需要所属仓库在其授权边界内处理，不能把本仓 Provider 支持 signal 说成整个系统已经端到端可取消。

流式、多模态、stateless encrypted-reasoning 和 LiteLLM 独立部署未提升为本批新功能。Responses stored-item continuation 仍受模型服务的保存期限约束。
