# LLM 有效配置与装配收敛

已完成用户确认的 Agent 单仓下一轮。提交 `8f58bdedfe1ce31c52779f3805c40f026f765197`，分支 `codex/llm-sdk-adapters`，基线 `f863c52496026558cf0133910fc1053b9dc89827`。未 push；原有 AGENTS.md / CLAUDE.md 变更未纳入。

## 职责与实际链路

- `configuration.ts` 作为共同底层，解析别名、默认模型、连接、模型归属和适配器选项；只依赖配置目录、DTO、日志与并发解析，不构造 runner 或 SDK。
- Factory 选择 provider、构造公共 facade、保留已有探活/fallback 行为；五家 facade 不再各自读取环境变量或复制连接默认值。
- Gateway 创建时固定配置，Transport 消费明确设置并连接真实 SDK；模型能力查询、参数策略、重试及工具执行继续留在原有负责层。
- `shared/concurrency.ts` 统一数值与来源，公开容量提示和实际闸门一致；已知字符串字段在进入 SDK 前验证。

真实调用覆盖 Factory/Provider/Gateway/Transport → 真实 SDK → fixture HTTP；未使用真实 key、模型 API 或新增依赖。Core 仍为 `file:../AlembicCore` 并链接相邻源码，没有修改相邻产品。消费方扫描见 [consumer-scan.txt](consumer-scan.txt)。

## 行为修复与兼容

1. 显式 endpoint 优先级不再受 key 是否显式提供影响；惰性 SDK 构造不吸入后续环境配置。空 key 保持无凭据，undefined 才继承环境。
2. 生成/embedding 模型归属清晰；fallback 使用目标 provider 默认模型，独立 embedding 的公开 model 与实际请求模型一致。DeepSeek 原配置 embedModel 现在真正进入兼容端点请求。
3. Google/Ollama 裸根分别补 API 版本路径；别名共用规范，未知显式身份不再悄悄选 OpenAI。
4. 非法并发值在进入队列前抛 LLM_INVALID_REQUEST，避免 NaN 闸门无法释放。数字字符串、优先级和容量来源保留。
5. 保留各入口原默认超时、重试、并发、Ollama 主机名及发现/回退顺序。公共字段及 15 包入口 / 451 运行时导出保持。

自审修复：独立只读审阅指出 Main 的严格回执对 DeepSeek baseUrl 作原字符串比较。已保留 OpenAI/Claude/DeepSeek 公开配置原值，只在兼容 embedding URL 拼接处去尾斜杠；回归同时检查公开值与实际 HTTP URL。还避免给非 DeepSeek facade 附加未执行的 reasoningEffort 回执字段。

兼容提醒已写入产品说明：曾用 apiKey 空字符串继承环境的调用方改用省略字段或 undefined；Google/Ollama 直接构造现在也遵循通用模型环境规则。DeepSeek embedding 仍为明确兼容能力，不宣称官方支持。代理环境仍按请求读取；更换模型服务配置需要新建实例或重建共享 Gateway。

## 测试整理与证据

原 `embedding-capacity-hint.test.ts` 与 facade 内 URL helper 测试合入 `ai-configuration.test.ts` 的配置矩阵，保留 Core 实际消费者对象形状、只读提示、日志及代理路径断言；Gateway 的三个 usage 入口共用矩阵。协议、取消、超时、迟到结果、并发和权限等不同边界测试保留，测试文件总数仍为 75。扫描、替代入口和迁移依据见 consumer-scan，实际 RED/GREEN 配对见 [verification.json](verification.json)。

基线：5 文件 / 62 测试通过。最终 `npm run check` 退出 0：75 文件 / 1200 测试通过，build/type、lint、Core 边界、分层、provider-neutral、严格消费方、validation floor、退役符号检查通过。17 条既有非阻断 lint 警告均来自未改动文件；原始路径已替换为可移植标记，日志断言和结果未改动。

## 两阶段自审与后续

规格自审：本轮完成已确认的配置解析/装配整合及相关测试清理，保留 Agent 的真实 SDK 调用、工具与运行循环；未改 Main/Core、宿主壳、工具 V1 退役或 Wakeflow 状态。

代码自审：处理 endpoint 优先级、惰性配置漂移、外来模型泄漏、队列死锁、输入类型验证、别名路由及上述回执回归。当前验证范围没有未解决的 P1/P2。外部线上服务/代理互操作性未实测；现有 17 条警告不是本轮清理范围。

原用户持续 review 范围内的后续建议：审查 AiProviderManager 的热切换、用量回调与依赖失效链；继续按模块职责清理，先核实真实消费方。Main/Core 的父取消接线仍留在对应仓库边界，不从本轮推导跨仓修改授权。

## 参考依据

[AI SDK provider management](https://ai-sdk.dev/docs/ai-sdk-core/provider-management) 与 [显式 OpenAI provider 配置](https://ai-sdk.dev/providers/ai-sdk-providers/openai) 支持集中管理并显式构造配置实例。本仓继续使用自己的 Registry/Gateway，不额外引入另一套注册中心。已核对锁定 SDK 中各 provider 对 baseURL 的 withoutTrailingSlash 处理，公开配置值无须跟着改写。

本地 TencentDB-Agent-Memory `06414ac10766b9bd61e4a69f3cf0ea414afb6d4f` 的 `MemoryCore/src/gateway/llm-resolver.ts` 和 `MemoryCore/src/adapters/standalone/llm-provider-resolver.ts` 将有效配置计算与 runner 构造分离。本次采用这一职责划分，将共同解析置于本仓下层，未复制其两套解析器、proxy 身份或工具执行循环。
