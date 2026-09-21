# 架构对照与本轮落地

研究日期：2026-09-19。Core 起点 `fec4b76`。本地 TencentDB-Agent-Memory 检出 `06414ac10766b9bd61e4a69f3cf0ea414afb6d4f`，origin 为 TencentCloud 官方仓库；源码只读，没有安装依赖或运行其服务。

## 可迁移模式与具体选择

| 源码 / 一手资料 | 观察 | 本轮 Core 应用 |
| --- | --- | --- |
| [Tencent IStorageBackend](https://github.com/TencentCloud/TencentDB-Agent-Memory/blob/06414ac10766b9bd61e4a69f3cf0ea414afb6d4f/MemoryCore/src/core/storage/types.ts#L97)、[ScopedStorageBackend](https://github.com/TencentCloud/TencentDB-Agent-Memory/blob/06414ac10766b9bd61e4a69f3cf0ea414afb6d4f/MemoryCore/src/core/storage/adapter.ts#L16) | 能力契约与路径映射/协调分离；兼容方法共享一个适配实现。 | 保留 KnowledgeFileStore 与宿主 writer，新增内部 commitKnowledgeWrite 集中单条文件写、DB 提交和失败确认，供真实知识、Guard、sustain 调用。 |
| [Tencent IsolationContext](https://github.com/TencentCloud/TencentDB-Agent-Memory/blob/06414ac10766b9bd61e4a69f3cf0ea414afb6d4f/sdk/memory-core/typescript/src/v3/client.ts#L54) | 固定身份在上下文边界检查，业务方法复用；写入 session 约束仍单独校验。 | 借鉴边界组织方式：UnifiedValidator 一次产生结构快照和最终结果；strict Gateway 不再完整跑两次。保留 G1/G2、完整 corpus 和写后确认这些不同信任边界。腾讯没有同款阶段快照实现，这里是适配设计。 |
| [Tencent metadata-store contract](https://github.com/TencentCloud/TencentDB-Agent-Memory/blob/06414ac10766b9bd61e4a69f3cf0ea414afb6d4f/MemoryCore/src/metadata/store/metadata-store.contract.ts#L40) | 行为断言通过 makeStore/teardown 组织，与资源构造分离。 | 新建内部真实 Markdown/SQLite fixture，知识写入、Guard、productization 三套测试共享资源管理；断言与故障注入留在各套件。 |
| [LangGraph BaseStore](https://github.com/langchain-ai/langgraph/blob/main/libs/checkpoint/langgraph/store/base/__init__.py#L659) | get 等便捷接口转发到 batch 原语；同步和异步执行契约分别定义。 | 稳定外部入口转发统一内部实现；Core 的异步单条写和同步批次 UoW 各守其执行语义，避免将 async callback 包进同步 SQLite 事务。 |
| [Practical Test Pyramid：Avoid Test Duplication](https://martinfowler.com/articles/practical-test-pyramid.html#AvoidTestDuplication) | 测试应按不同粒度承担不同风险，重复维护同一行为有成本。 | 领域套件保留诊断组合/字节基线，集成套件覆盖真实持久化和恢复；删除测试里的公共 API 分类器副本，改测正式 gate。 |
| [SQLite Atomic Commit](https://www.sqlite.org/atomiccommit.html) | SQLite 事务原子性有明确数据库文件/协议范围。 | 普通 Markdown 文件与 SQLite 的联合写入不宣称原子回滚；文件成功后 DB 失败保持文件，给明确 DivergenceError 与 sync 恢复路径。 |

## 不能照搬的部分

- Tencent StorageAdapter.rename 的源码明确说明 get → put → delete 不原子，不能替代 Core 原子文件替换与恢复语义。
- Tencent TdaiCore 包含 LLM runner；Core 的 provider、host Agent、HTTP/MCP/UI 仍归外层。没有复制腾讯运行时、身份默认值或其超时销毁策略。
- 本地腾讯检出只有一个被跟踪的 `.test.ts`；metadata-store.contract 没有检出调用方。借鉴其组织方式，不声称其双后端测试已运行/通过。
- Core RecipeCandidateValidator 与 UnifiedValidator 的内容、trigger 长度、category 和诊断语义不同；不能因为名字相似删除任何一套公开兼容入口。

## 实际设计与行为

1. `KnowledgeService` 的 create/update/quality/lifecycle、Guard create，以及既有 sustain update 共用内部写协调。更新白名单只保留 knowledgeType/tags 两个特殊分支，其余同义分支合并；业务权限/状态转换和旧构造保持原样。
2. 文件拒绝统一为现有 FileWriteError（旧知识服务错误文本保留）；文件成功后 DB 异常/null/异 ID 返回报告现有 DivergenceError，成功事件留到确认之后。旧 DB-only 构造保持并给诊断。
3. 独立复核发现 SQLite RAISE(IGNORE) 会读回同 ID 旧行而误报成功；真实用例先红后绿。Repository 的完整/部分更新合并到同一 SQL 路径并核对 changes=1，普通同值更新仍合法。
4. 新 `validateDetailed` 返回 `{ structural, result }`，不缓存、不生成校验票据；旧 validate 投影 result。字段、内容、唯一性仍按原序执行，结构快照复制数组。Facade 复用公共类型，仍调用旧 validate。
5. 68 个 package exports 保持不变。新增详细诊断方法及三个命名类型经既有 `./knowledge` 暴露，内部写 helper 不进入公共 barrel。无外层源码修改需求，现有 file: 依赖直接消费构建产物。

## 删除和替代证据

| 删除/精简 | 引用/替代路径 | 保留的行为 |
| --- | --- | --- |
| test/support/public-api-inventory.ts | 唯一消费者 PublicApiInventory 改用 scripts/public-api-boundary-policy.mjs | 全入口分类、wildcard 限制、policy 数量、实际 ReportReader 类型检查 |
| test/CandidateValidationFacade.test.ts | 独有断言并入 CandidateValidationFloor | 原始双结果/顺序/对象、duplicates 完整透传；AND 用例改为仅 Recipe 拒绝的真实差异输入 |
| test/StrictKnowledgePersistenceFaults.test.ts | writer 故障迁至 KnowledgeFileWriter；service 故障由 KnowledgeServicePersistence 真库矩阵覆盖 | rename 失败旧文件字节与路径保留、目录逃逸拒绝、生命周期/质量文件失败不写 DB |
| KnowledgeService 单元 mock 的手写字段更新分支 | 小型内存仓储复用实体归一化；真实 repository/文件故障由集成套件验证 | CRUD/状态机/业务 hook、事件、历史错误文本 |
| Guard/Productization 的资源创建样板 | test/support/knowledge-runtime.ts | 各测试独立真库、真实 writer、同样业务 seed 与完整原有断言 |

删除引用扫描使用 rg；被删除文件没有剩余源码/测试/脚本引用。四个 Core 硬边界测试和全部 package gates 保留。

## 剩余写入口补全

- 自动关联与反向引用清理此前写 DB 后被 Markdown 同步恢复。现在共用相同文件写协调，自动发现先用最新实体合并、持久化后再投影边，删除等待反向清理。
- remove 的 false 是已发布的“无匹配文件”返回，不能当成一般 IO 失败。保留 absence 兼容；读取、删除、目录扫描故障和无法确认 owner 的文件明确抛错。避免“文件仍在而 DB 删除成功”的假成功。
- DELETE 若未实际执行不能成功；已移除文件但 DB 出错时保留可重试主行，恢复路径是再次调用 KnowledgeService.delete。其他知识写分歧继续用 sync 恢复。
- 004/006/008 的 FK 子表没有 CASCADE。真实 repository 事务负责 lifecycle、proposal、warning 与主行删除；失败回滚 DB 内全部变更。其他条目的历史事件保留，只解除指向已删 proposal 的可空 FK。
- 文件与 DB 仍不是跨资源原子事务，多个反向关系文件的部分完成不会撤销；错误阻止主删除，重试继续完成。无新依赖/迁移/外层源码修改。

独立复核还发现新增后台文件写的删除竞态：已读实体暂停 → 删除成功 → 后台恢复写旧 Markdown → sync 复活。真实 gate 探针先 RED；同一 KnowledgeService 用只存活于执行期的每 id 关联任务标识和活动删除计数取消旧关联；删除在第一次 await 前使旧任务失效，所有并发删除退出后才解除阻止，后台任务 finally 仅清理自己的标识。取消有诊断，不累积永久墓碑，也不声称提供跨进程锁。回归检查删除后文件仍不存在且同步不能恢复条目。

并发删除补充探针进一步覆盖 D1 暂停、D2 失败先退出的情况，防止较新失败误解锁仍在途删除。单删除、多删除、多个 auto 任务的清理顺序经独立探针复核，正式套件保留两条决定性删除竞态回归。
