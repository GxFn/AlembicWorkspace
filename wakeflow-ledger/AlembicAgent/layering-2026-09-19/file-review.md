# 本轮逐文件职责审查

本表覆盖本轮职责分层的 16 个文件。更早全仓审阅保留在上一轮清单；不是重新宣称本轮全文复读整个仓库。具体运行时声明的等价 SHA-256 见 relocation-equivalence.json。

| 文件 | 职责 | 已审查的运行时声明 |
| --- | --- | --- |
| `config/layer-contract.json` | 顶层与逐文件运行时依赖白名单 | 类型、装配、测试或声明式规则 |
| `docs/tool-pipeline.md` | 产品级职责图、接口语义与验证入口 | 类型、装配、测试或声明式规则 |
| `scripts/lint-layer-contract.mjs` | 基于 TypeScript AST 的实际依赖检查及 census | 类型、装配、测试或声明式规则 |
| `src/agent/runtime/ToolExecutionPipeline.ts` | 公开入口、注册表及默认组装 | createToolPipeline |
| `src/agent/runtime/toolPipeline/accessGates.ts` | 通用 capability、参数大小和安全策略门禁 | MAX_TOOL_ARG_BYTES, TOOL_ARGS_INVALID_CODE, TOOL_ARGS_TOO_LARGE_CODE, measureToolArgBytes, allowlistGate, toolArgumentBoundsGate, runtimeSafetyGate, isActionAllowed |
| `src/agent/runtime/toolPipeline/callNormalization.ts` | 字段读取与直接 note_finding 兼容翻译 | isDirectNoteFindingCall, toExecutableToolCall, getToolAction, getToolParams |
| `src/agent/runtime/toolPipeline/contracts.ts` | 类型叶子；复用公共 metadata，区分内部窄端口与公开完整上下文 | 类型、装配、测试或声明式规则 |
| `src/agent/runtime/toolPipeline/duplicateCache.ts` | 只读 snapshot 缓存准入与复用，拒绝失败 | SIDE_EFFECT_ACTIONS, getToolManifest, isReadLikeManifest, isDeterministicDuplicateCandidate, getEfficiencyCache, cloneCacheValue, resolveProjectSnapshotId, buildCacheKey, deterministicDuplicateGuard |
| `src/agent/runtime/toolPipeline/engine.ts` | 顺序生命周期执行器；executor 由装配入口注入 | diagnosticReason, runBeforeMiddlewares, runAfterMiddlewares |
| `src/agent/runtime/toolPipeline/observations.ts` | 证据→memory→tracker→trace 及可选事件 | evidenceCapture, observationRecord, trackerSignal, traceRecord, progressEmitter, eventBusPublisher |
| `src/agent/runtime/toolPipeline/phaseGates.ts` | 场景阶段的动作范围约束 | evolutionDecisionGate, RECORD_REPAIR_MEMORY_ACTIONS, ANALYST_VERIFY_CODE_ACTIONS, ANALYST_VERIFY_MEMORY_ACTIONS, EVIDENCE_READ_ACTIONS, ANALYST_VERIFY_GRAPH_QUERY_TYPES, PRODUCER_CODE_ACTIONS, PRODUCER_KNOWLEDGE_ACTIONS, PRODUCER_MEMORY_ACTIONS, PRODUCER_META_ACTIONS, recordRepairOnlyGate, analystVerifyOnlyGate, producerSubmitOnlyGate |
| `src/agent/runtime/toolPipeline/runtimeBridge.ts` | 唯一 host 路由调用点与请求/envelope/失败归一 | projectPipelineToolResult, BLOCKING_ENVELOPE_STATUSES, executeRuntimeToolCall, buildRuntimeToolCallRequest, resolvePipelineSourceName, resolveProjectLanguage, resolveDimensionScopeId, projectSessionToolCalls, recordExecutedEnvelope |
| `src/agent/runtime/toolPipeline/submissionLedger.ts` | 真实持久化候选的覆盖记账 | submitDedup, recordProducerSubmitLedger, isProducerLoop, hasCompleteSubmitPayload, submitSourceCount, stringValue, numberValue |
| `test/fixtures/public-strict-consumer/strict-facades.ts` | 真实宿主编译消费及 public middleware 完整上下文兼容 | 类型、装配、测试或声明式规则 |
| `test/layer-contract.test.ts` | 真实 CLI/temp-repo 的 38 个架构正反例 | 类型、装配、测试或声明式规则 |
| `test/runtime-efficiency.test.ts` | 生命周期、证据顺序、失败恢复和缓存行为 | 类型、装配、测试或声明式规则 |
