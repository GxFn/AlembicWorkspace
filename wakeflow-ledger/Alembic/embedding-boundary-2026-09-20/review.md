# 独立 Qwen embedding 宿主接线审阅

执行日期：2026-09-20 至 2026-09-21。用户已明确允许修改 Main 必要接线并单独提交。本任务由用户直接授权，不属于当前其他 Wakeflow demand；未写控制状态、派送或回填其他窗口。

Main 提交 `615e4c47b37a74dc13b84afebae5eafafb3b8615`；基线 `999b60d294e35f196466394da8766e9cb140caae`。Agent 配套提交 `c5bc99b218756657e7b0a37635e8022857669f70`。Core 基线 `516e05ac11210505eb7fa2d36e87e270391ecdfa`，未修改 Core 产品源码。两仓已有 AGENTS.md/CLAUDE.md 变更均保留并排除提交。

## 需求与架构审阅

1. 独立 embedding 只读自身配置，复用 Core OllamaEmbedProvider/EmbeddingPort。支持明确 Qwen 型号、官方完整维度、原生 query/document 格式；验证响应，覆盖取消、完整正文期限与错误脱敏。没有生成模型 fallback。
2. 无 LLM 启动也装配 embedding；LLM 切换保留 embedding、索引管线、检索服务与 active generation。只有生成型 enricher 重新解析，初次启用 LLM 也绑定计量。
3. Memory query/document 和取消信号直接到 typed port；sidecar 绑定模型空间。向量查询和写入使用同一个已验证 generation 快照，同维度异模型不能混用。profile 本地不兼容不计入远端熔断。
4. base vectors 在写入时标记模型空间，利用 Core 既有 tags 过滤在 topK 之前限定候选，保留业务 tag 条件。增量管线在写入之前检查旧空间，显式 force/clear 才走 Core 重建，避免复用旧向量后误标新 profile。
5. 配置 HTTP 接口分别处理 LLM 与 embedding，无效 embedding 在保存前拒绝；报告重启/模型空间变更，保存不热换实例。Dashboard 重建入口独立检查 embedding，无 LLM 可构建；缺 port 时在服务获取/clear/build 之前报错。CLI 相关提示同步。
6. 保留 Core 分块、索引算法、storage、generation 构建/CAS；没有复制数学算法或搬迁 Core 能力。仅受影响 Dashboard handler 的加载改为相对 lazy import，避免源执行命中旧 dist。

## 自审结论

需求符合性：本轮独立向量/生成能力接线完整，未把 Agent/provider/tool 能力空壳化，未修改 Core/Plugin/Dashboard 源仓库。

已修 P1：LLM→embedding fallback；热切换向量资源失效；记忆用途丢失；同维度不同模型混用；generation 读写校验与使用之间的竞争；增量复用历史向量误标新模型；无 LLM 的重建入口被错误拦截。另修 ContextualEnricher 使用 system 而非 systemPrompt 的上下文丢失，以及本地索引不可读的错误归类。未发现本轮未处理的 P0/P1。

测试保留有意义的生命周期、协议与存储边界：新 provider、隔离、配置路由三个测试文件；其余回归合入原消费者测试，使用参数矩阵避免逐场景拆文件。成功、失败、取消、超时、缺能力拒绝、部分/稀疏结果和恢复均有对应受控场景。

## 验证结果

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| Agent npm run check | 76文件/1222通过，17既有警告 | Agent同名目录/full-check.log |
| Main npm run build:self | 通过，编译 ESM 与 postbuild 完成 | verified-build.log |
| Main 本轮及共享 Dashboard 回归 | 9文件/84通过 | verified-scoped-tests.log |
| Main 变更文件 Biome | 23个TS文件通过 | verified-changed-lint.log |
| Main 类型/lint/分层/空间/Agent/Core边界 | 通过；全量lint保留5既有警告 | verified-check.log 中 unit 之前各阶段 |
| 编译后入口探针 | 无LLM成功；缺embedding拒绝，0索引修改/0网络请求 | compiled-entry-probe.json 与 .mjs |
| Main 全量 unit，maxWorkers=4 | 1284通过/19失败，164文件通过/4失败 | bounded-unit.log |
| Main integration，maxWorkers=4 | 477通过/4失败/10跳过，29文件通过/3失败 | bounded-integration.log |
| 现有局部 coverage 门槛 | 3文件/11测试通过；覆盖率只针对其既有配置范围 | verified-coverage.log |
| shared-asset drift、retired symbols、ring direction | 全通过 | verified-drift.log、verified-retired.log、verified-rings.log |

Main全量检查不通过，不能把本轮专项成功当成仓库全绿。19项unit失败涉及SDK HTTP fixture、工具registry身份、evolution成功回执与Insight分流预期。3项integration涉及EventBus自应答旧预期和缺持久化回执的QualityGate fixture；另1项IndexingPipeline fixture只给sourceHash，不满足既有source/producer完整性合同。

基线判断有可重放的依据：baseline-agent-contract-probe.mjs 从 git show b303b35 内存转译41个实际Agent模块，对比工作区源码全部一致，复现旧断言与正确回执差别；六个Main旧测试文件与999b60d相同。Core IndexingPipeline/Chunker及其Main直接消费测试同样与基线逐字节相同（baseline-indexing-comparison.json）。这不是完整旧checkout全量跑绿的声明。

中间验证记录也保留：曾同时构建Agent导致Main类型解析产物竞争，串行build-check通过；曾外部设置共享测试目录引起DB锁，恢复test/setup.ts逐worker隔离后消失；曾新增别名加载旧dist而失败，源码与编译入口均已修正验证。默认高并发最终check有一次未改动StrictExternalSetupRecovery超时；maxWorkers=4复跑该文件31项全过，未改超时阈值。最终剩余稳定失败数为19 unit +4 integration。

## RED/GREEN 与证据限度

有效行为RED包括：embedding-isolation-red（无LLM漏装配）、receipt-red、memory-contract-red、enricher-red、provider-lifecycle-red、embedding-configuration-route-matrix-red、generation-snapshot-red、generation-write-snapshot-red、indexing-profile-red、dashboard-embedding-red。最终GREEN由verified-scoped-tests及相关局部日志覆盖。早期新模块缺失与memory测试支架错误不当作产品缺陷证明；后补错误归类矩阵属于额外回归覆盖，不虚称全部RED-first。

所有模型请求使用受控fetch或loopback HTTP；存储使用临时SQLite/JSON。没有真实API key、模型下载、真实索引迁移或进程重启。配置与迁移说明见 Alembic/docs/embedding-and-llm.md；模型维度依据 Qwen 官方模型卡：https://huggingface.co/Qwen/Qwen3-Embedding-0.6B 。

## 遗留限制与下一步

- Main既有23项失败需要由Main测试维护任务对齐真实SDK/回执/索引合同；不能放宽产品检查来迁就旧fixture。本轮跨仓授权聚焦embedding必要接线，未顺便修改这些无关门禁。
- 配置身份使用明确模型标签与descriptor，尚未验证服务器权重digest；endpoint/凭据变化视为同一声明模型空间。
- embedding配置修改需重启；模型空间变化需显式迁移。管理读取和旧数据保留；未验证旧profile的dense读取禁用。
- 增量预检保守扫描通用base向量，额外O(n)读取；foreign旧向量不由文件force扫描自动删除，需其生产者迁移或调用者明确clear。大索引可在后续Core公开profile/provenance入口时优化，不复制Core ownership规则。
- 尚未做真实Qwen服务性能/质量验收；下一步实际环境接入应按产品文档配置、dry-run与显式rebuild，不代替用户操作现有索引。
