# 架构优化与代码、测试整合

用户直接授权：继续优化当前 AlembicAgent 架构和代码，清理测试，联网学习一手项目经验，并研究本地 TencentDB-Agent-Memory 后设计实施方案。基线是上一轮未提交工作区，不回退或重新覆盖该轮修复；相邻仓及参考项目只读。

## 研究与选择

本地 TencentDB-Agent-Memory commit：06414ac10766b9bd61e4a69f3cf0ea414afb6d4f。

参考当前真实路径：MemoryProxy 的 InjectionPipeline / TdaiProfileMemoryInjector 使用稳定摘要和索引并配合按需工具；MemoryCore 的 auto-recall/search 提供另一条召回入口，不把已下线的 Proxy L1 injector 当成现行默认能力。

一手资料：
- https://github.com/TencentCloud/TencentDB-Agent-Memory
- https://docs.langchain.com/oss/javascript/concepts/memory
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- https://github.com/mem0ai/mem0/blob/main/docs/core-concepts/how-it-works.mdx

借鉴边界、分层和可观测召回，不复制其代码或引入新的数据库、租户系统、完整代理服务。现有真实宿主链是 RuntimeInitializer → PersistentMemory → buildAnalystPrompt → MemoryRetriever；Runtime 每轮还消费 MemoryCoordinator 的 dynamic prompt。不能只修静态公共兼容接口而漏掉真实 Analyst 装配。

## 实施顺序与验证

1. **有界召回**：用共享 memory read policy 统一 abort/deadline/诊断；查询词汇候选可用时，embedding 故障或超时明确降级；取消后不写访问计数。保持已有 public facade 和排序默认值。RED：挂起/拒绝/无效 embedding、调用前/中取消；GREEN：限时完成、正确降级、无迟到副作用。
2. **统一 Prompt 装配**：相关性参数贯通；持久记忆、会话证据按独立预算装配，错误隔离；scope 间预算余量隔离；真实 Analyst 链复用同一读取和预算边界。对可按需恢复的会话内容优先提供相关摘要与索引，保留已有 evidence 工具。RED：超预算端口、异步scope交错、无关前序报告抢占上下文、持久层错误屏蔽会话层；GREEN：预算、来源顺序及同scope语义明确。
3. **向量 sidecar 一致性**：已有 Agent sidecar 关联记忆内容版本；无效/陈旧向量不参加排序；内容在 embedding await 期间变化不能写回陈旧结果；写失败保留 dirty 可重试并可释放 timer。使用现有 Core 公共 IO 能力（若适用），不搬存储内核或改 Core schema。RED：内容更新、迟到回填、写失败后恢复；GREEN：重试与重启可验证。
4. **测试整合**：依据当前测试与消费扫描确定可合并簇；保存每条原用例到新位置映射，消除重复 fixture 和文件，不降低公开边界、安全、取消、部分结果、跨进程证据等独立覆盖。
5. **验证交付**：针对性 RED/GREEN → typecheck/lint → 当前完整 check/真实 strict-consumer → public import。记录本轮增量、旧接口保留理由、来源、限制和无提交理由。

## 当前基线

Node 22.23.2；`npm run check` 已复验通过，71 个测试文件、740 项测试。原有工作区共 360 条文件状态和哈希记录在 `tmp/architecture-2026-09-19/baseline-files.json`。仍保留用户原始 AGENTS.md / CLAUDE.md 改动。不写 Wakeflow controller 状态，不发布、不发送外部消息。
