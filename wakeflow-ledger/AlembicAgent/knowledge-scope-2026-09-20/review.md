# 实施与复审

本轮完成上一轮方案中优先的知识接线、运行状态隔离及上下文投影闭环。修改范围为 Agent 与 Main；Core 与腾讯项目只读。原有 AGENTS.md / CLAUDE.md 改动保留，不纳入提交。

## 最终职责

- Agent kernel 定义 KnowledgeReadPort / KnowledgeManagementPort、ToolResourceScope 与释放合同；handler 真正消费显式端口。旧 knowledgeRepo 只在对应新字段未提供时兼容，缺方法或失败不能回落。
- Main KnowledgeServiceAdapter 绑定可信 actor 到 Core ServiceContext，读取转 DTO，更新/驳回委托 KnowledgeService；StagingManager 与 production/proposal 合同保留各自语义。
- Main ToolScopeResources 持有 run 记忆、独立 loop/view 缓存。工厂只装配依赖。显式 run 的生命周期来自 Agent finally；兼容身份会话有界保存；无身份请求仅获得调用内状态。
- AgentRuntime 使用模块级 AsyncLocalStorage 传递 run 身份，每个 loop 独立 view。闭合的异步链不能重建运行；失败的清理不会覆盖已确认业务回执。
- ContextWindow 对有损操作记录 revision；移动消息时同步移动 L3 边界。旧 window 缺少 revision 时告警并禁用 delta 复用。
- DeltaCache 区分磁盘指纹与全文可见性。范围、outline、batch/action 截断不能使下次完整读取变成 unchanged；模型历史配额截断也会使视图失效。
- Pipeline 平铺资源作为默认值，保留既有 system/显式 strategy 优先级。Main 两份 bootstrap compactor 合并，提取前后 AST 相同，关键共享对象引用保留。

## 复审发现与处理

| 严重度 | 触发与事实 | 处理和证据 |
| --- | --- | --- |
| P2 | Router action 配额截断超长单文件，DeltaCache 仍标记全文可见 | 真实 adapter 25k 字符 fixture RED；handler 从注入 registry 读取同一配额并撤销可见基线；同入口 GREEN |
| P2 | 自定义旧 Strategy 在 execute 超时后调用 reactLoop，省略可选 signal，可重建已清理状态 | run 记录 closed；真实 execute 超时后的迟到 loop 被拒绝，executor 未调用 |
| P2 | 旧 duck window 没有 revision，曾生成 NaN 导致宿主拒绝工具调用 | 明确告警并逐次更换兼容视图；同入口 RED→GREEN |
| P2 | L3 后替换旧 nudge 改变绝对索引，额外隐藏 assistant 工具调用 | nudge/L2 删除时调整折叠边界，禁止跨边界合并；工具调用/结果配对回归 GREEN |

另经官方文档复核，短命 runtime 各自创建 AsyncLocalStorage 需要额外 disable 生命周期。实现改为模块级单个 ALS，并校验 owner，保留并行/嵌套运行隔离。Node 官方说明其 store 会沿异步资源传播，且 run 的作用域适合 promise 链；本轮只使用 Node 22 已有的 run/getStore。[Node asynchronous context](https://nodejs.org/api/async_context.html)

状态从工厂单例移到运行/视图，沿用上一轮基于腾讯宿主闭包和端口装配的判断；共享可变请求对象造成跨请求影响的风险也与 Fastify 的公开说明一致。这里只采用生命周期原则，没有引入新框架。[Fastify decorators](https://fastify.dev/docs/latest/Reference/Decorators/)。腾讯原始文件扫描、固定 commit 与适用/不采用的具体判断见 `../interface-study-2026-09-20/architecture.md`。

## 验证与测试整理

- 基线：Agent 6 文件 186 项；Main 6 文件 22 项；两仓类型检查通过。
- Agent 最终 npm run check 通过：68 文件 979 项，含类型、Biome、公开签名/strict consumer、验证下限、各导入/分层/退役边界。
- Main 构建通过；相关 15 文件 63 项通过，随后新增真实 AgentRuntime→ToolRouterAdapter→Main factory 的端到端释放用例，所在文件 4 项通过。本轮合计验证 64 项独立 Main 用例。
- Main lint、repo/space/layer/doctrine/naming/Agent/Core/retired/ring 边界通过。lint 的 5 个既有 any 警告位于本轮未改文件。
- Main extraction guard 首次指出新文件与测试尚未分类；只补两个宿主文件职责、两个真实 host 测试的精确 import 条目，没有放宽通配边界或关闭扫描。
- Core 事实由临时 SQLite 验证：系统标签、profile 校验、可信审计、真实 review、未开始写入的取消，以及文件先写而 DB 失败的 STATE_DIVERGENCE/partial/readback。无真实 provider、API key 或线上数据库。
- 新回归使用入口级参数矩阵；Main 原分歧单元用例升级为最终 envelope 校验，没有保留一套同义重复测试。未删除仍保护公开兼容或错误语义的旧测试。

RED 的时间范围如实区分：Agent 端口、视图及 Main scope 均先看到新增行为失败再修实现。Main 知识完整 host 链另用 HEAD 工厂快照复核旧接线的 5 fail / 1 pass；这是实施后的历史对照，不冒充根线程修改前新增的测试。

## 边界与余项

本轮不声称完成全仓逐文件 review，也未运行 Main 全量 integration/coverage。score/validate、graph 仍不虚构缺失服务；旧知识字段、旧无 scope 宿主保留明确兼容路径。手动提供 scope 的宿主须保证 viewId 在 run 内唯一并在 finally 释放。跨 run 共享只来自显式注入的 memory/sharedState 资源。

下一阶段按原方案收敛 schema 查询/动作 allowlist 与可用性投影，再做 AI DTO/错误叶子化。新架构的公共端口和迁移约束已写入 Agent `docs/tool-host-integration.md`。提交 hash 与具体命令记录在同目录 `verification.json`。
