# Embedding 与 LLM 解耦执行计划

用户已确认固定独立 embedding（Qwen 模型），多厂商接入主要服务 LLM；并明确授权本任务修改、单独提交 Main 必要接线。Agent 基线 b303b35；Main 基线 999b60d。两仓原 AGENTS.md/CLAUDE.md 变更保留，不纳入提交。Core/Plugin/Dashboard 只读。

完成定义：生产 embedding 不从 LLM provider 选取或回退；无 LLM 也可用固定 embedding；LLM 切换保持 embedding 与向量/索引/检索实例及 active generation；Qwen query/document 格式和取消信号完整到 Core adapter；profile 变化不混用 Agent memory sidecar。

1. Agent：Manager 停止推导/重建 embedding，getter 不再返回 LLM；退役仅用于按 LLM 选 embedding 的 initializer，保留显式旧 embed API 兼容。Memory EmbeddingFn 增加输入用途，sidecar 可选 profile 绑定，旧调用保持可用。先 RED 再 GREEN。
2. Main：独立 embedding 工厂复用 Core OllamaEmbedProvider，固定明确 Qwen 型号/原生 endpoint/维度并验证真实返回；有依据补 dimension descriptor，不复制 Core 模型协议。AiModule 独立装配 embedding，首次启用 LLM 补 recorder。
3. Main：迁移 Search/Recipe generation/Indexing/Vector/Agent memory/回执入口，停止 LLM fallback；向量资源不再 aiDependent；稳定的 enrichment delegate 解析当前生成型服务。配置变化由独立迁移处理，不在切 LLM 时重建或删除索引。
4. 实际 SDK/Core adapter + fake HTTP、临时 DB/索引验证；运行适配的两仓检查，独立审阅，分别提交，保留迁移证据与风险。

本轮不删除仍有显式调用者的通用 SDK embedding 方法，不运行真实模型/拉取模型/读取真实凭据，不迁移用户数据。Main 接入只在测试沙箱验证。Qwen 官方模型卡的完整维度为 0.6B=1024 / 4B=2560 / 8B=4096，adapter 必须验证实际向量，未知或不一致配置明确失败。
