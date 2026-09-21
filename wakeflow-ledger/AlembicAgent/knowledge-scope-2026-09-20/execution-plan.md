# 知识接线与运行作用域整理

2026-09-20。用户确认上一轮接口研究方案，当前执行首个 Agent + Main 闭环。基线：Agent `69ee567`、Main `4dc86fb`、Core `4a0b277`。Core、Tencent 及其他仓库仅只读。两个仓库已有的治理文档改动不属于本轮，不纳入提交。本轮是直接用户工作，不创建 Wakeflow 派发或控制状态。

## 顺序与范围

1. 记录 Agent/Main 相关测试与类型检查基线。
2. 知识端口：Agent 增加窄的读取/管理合同并让真实 handler 消费；保留旧 knowledgeRepo 兼容入口。Main 绑定可信请求身份，调用真实 Core KnowledgeService 的 get/update/reject，缺失能力继续明确失败。用真实 Core 临时数据库验证 detail/update/reject/review 路由。
3. 运行作用域：明确工具会话、读取视图和清理的 owner。Main 工具状态同运行复用、跨运行隔离；Agent 传递运行/视图身份并触发结束清理。增量读取只使用当前可见视图的历史，覆盖阶段重置、分段读取、并发运行与取消。
4. 上下文：修复 AgentService 平铺 context 到 PipelineStrategy 的资源丢失，保持显式 strategyContext 优先级及可变资源引用；Main 合并两份等价的 bootstrap compactor。
5. 构建 Agent 后验证 Main 公开包消费者，执行边界检查与独立 diff review，按仓库分别提交，记录命令、结果、hash、风险及下一阶段建议。

## 行为验收与 RED/GREEN 对应

| 行为 | 真实入口/回归接缝 | RED 原因 | GREEN 标准 |
| --- | --- | --- | --- |
| 知识读取与受控写入 | Main ToolContextFactory + Agent ToolRouterAdapter + Core 临时数据库 | 原始 repository 缺 getById/reject；update 绕过服务规则 | DTO 读取；更新保留 Core 规则；驳回/审核通过真实服务；缺能力有结构化错误 |
| 会话隔离 | Main factory + memory/code 工具 | 单例 factory 复用同一可变 store/cache | 相同 scope 连续使用；不同 scope 无 recall/已读状态串用 |
| 视图正确性 | Agent 循环/ContextWindow + code.read | 阶段/压缩/分段读取可能借用不可见全文历史 | 新视图首次得到内容；仅确认可见的读取允许 unchanged/delta |
| 清理 | 实际 runtime/router/factory 生命周期 | 工厂没有运行结束释放接口 | 成功/失败/取消均释放自身状态，并发 run 不受影响 |
| 上下文投影 | AgentService → PipelineStrategy → reactLoop | 仅平铺 sharedState 被忽略 | 平铺资源透传；显式嵌套字段优先；共享 Set/ledger 引用保留 |

## 实施约束

- 不依赖真实 API key、模型或线上数据库；使用可控 provider 与临时 SQLite。
- 不删除公开兼容接口，不合并具有不同语义的业务合同、调用协议和展示对象。
- 生产源码前先看到行为 RED；每个子步骤完成验证再整合。
- schema/AI 叶子合同、graph 服务接线是后续阶段，本轮不混入。
- 不以真实写入后的取消/observer 失败覆盖 Core 已确认结果；不靠模型参数选择身份或权限。

## 基线命令

- Agent：Node 22 下运行 tool-system、recipe-production-profile-adapter、agent-lifecycle、pipeline-outcome-abandoned、ContextWindow、runtime-terminal-safety；`npm run typecheck`。
- Main：Node 22 下运行 ToolContextFactory、AgentService、GenerateInputBuilder、GenerateDimensionRuntimeBuilder、KnowledgeModuleFileFirst、AgentModuleBoundaries；`npm run typecheck`。

原始输出先留在两个仓库 ignored 临时目录，完成后汇总可复查证据到本目录。
