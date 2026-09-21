# Core 架构优化、写入整合与测试清理

日期：2026-09-19。起点 `fec4b76`，最终提交 `8ab3783c8aecc653db9ca37a1f100580ce7fdabc`。

## 已完成

- 统一知识创建、编辑、质量、生命周期、删除、Guard 与 sustain 的内部单条写入协调：`commitKnowledgeWrite` 管理文件操作 → DB 提交 → 确认/分歧诊断。调用者保留业务状态机和权限，旧构造与 DB-only 行为保留。
- 严格准入由同一候选完整验证两次改为一次 `validateDetailed`；结构快照与最终结果分开消费，旧 `validate`、错误顺序和 12 条历史字节基线保留。Facade 共用选项/结果类型，语义不同的兼容 Recipe 校验仍保留。
- 删除三份重复测试/辅助文件，独有断言迁至实际行为套件；移除测试中的公共 API 分类器副本和手写字段更新样板；三个持久化套件共用真实 Markdown/SQLite 资源工厂。
- 68 个 package exports 完全不变，四个强制边界套件均保留。新增详细验证方法和类型经既有 knowledge 子路径暴露，内部写协调不进入公共 barrel。

## 本轮修复的实际问题

1. 文件写成功后 DB 抛错/null 读回没有统一分歧处理；质量等入口可能仍宣告成功。现在统一报告 FileWriteError / DivergenceError，成功事件在确认之后。
2. SQLite RAISE(IGNORE) 使 UPDATE 未执行却读回同 ID 旧行。仓储共用完整/部分更新执行块并确认受影响行，正常同值更新仍通过。
3. 自动关联和反向引用清理直写 DB，随后被 Markdown 同步覆盖。现在关系本身也持久化，删除等待反向清理后再删主行。
4. 删除吞掉 IO/归属不明、忽略 DB 未删除；带提案/警告/生命周期 FK 时无法删除。现在区分已无文件与真实错误；FK 子表与主行由仓储事务一起处理，DB 失败可用同 ID 重试。
5. 新后台文件写在删除后恢复旧快照，会使条目经同步复活。独立复核发现后先加真实暂停探针 RED，再用活动删除计数和关联任务标识取消旧任务；覆盖单删除、并发删除先后失败、多 auto 与完成后同 ID 重建。

## 验证

使用 Node 22.23.2，最终源码执行：

| 范围 | 命令 | 结果 |
| --- | --- | --- |
| Core 全部门禁 | `npm run check` | exit 0；193 套件通过/1 跳过，2184 测试通过/1 原有跳过；含 build、公共 API、分层、消费者导入、scope、预算、smoke、测试、Biome、retired symbols |
| Alembic 类型 | `node node_modules/typescript/bin/tsc --noEmit` | exit 0 |
| Alembic 消费方 | Vitest 5 套件，精确文件见 verification.json | 37/37 通过 |
| AlembicPlugin 类型 | `node node_modules/typescript/bin/tsc --noEmit` | exit 0 |
| AlembicPlugin 消费方 | Vitest 7 套件，精确文件见 verification.json | 102/102 通过 |
| 差异检查 | `git diff --check`、提交前 staged diff check | 通过 |

旧测试套件数 195 → 194；通过用例数 2155 → 2184，新增来自真实故障/恢复/并发回归。总行数没有作为优化指标，详细增删数据见 change-inventory.json。故障 RED、修复 GREEN、最终命令/日志摘要与 SHA-256 均在 verification.json / checks.jsonl。中途完整检查发现的三行不可达测试代码已删除并通过最终检查。

## 研究与设计

已只读学习本地 TencentDB-Agent-Memory `06414ac10766b9bd61e4a69f3cf0ea414afb6d4f` 的 storage port、adapter、SDK IsolationContext、metadata-store contract；并联网核对 Tencent 官方仓库、LangGraph BaseStore、SQLite 事务说明、Practical Test Pyramid。采用稳定契约配内部协调、一次生成阶段结果、共享真实 fixture 的组织方式；没有复制 AI/宿主运行时或非原子的 rename 实现。

[研究来源、具体映射与不能照搬的边界](research-and-design.md)。腾讯 contract 在本检出没有调用方，没有将其当成已运行的测试证据。

## 提交、接入与边界

- `5f9e92ea17b67c8928c467bc80043eb4ca583ca3` — unify knowledge writes and validation stages。
- `8ab3783c8aecc653db9ca37a1f100580ce7fdabc` — preserve knowledge relation and deletion truth。
- 本地提交，没有 push/发布。两外层已通过既有 `file:../AlembicCore` 接入，无需额外源码接线或提交；dist 已构建且不提交，vendor/release 指针未变。
- 工作区只保留用户原有 AGENTS.md/CLAUDE.md 修改与原有未跟踪 coverage/index.ts；本轮源码与测试全部提交。
- 文件与 SQLite 不承诺跨资源原子回滚；更新分歧用 sync，删除分歧按错误给出的同 ID 重试。后台任务取消作用于同一 KnowledgeService 的在途任务，不代替宿主跨进程写协调。
- 既有公共兼容入口及下划线辅助方法的签名保留，内部正式写入口已迁移。本次范围内没有未解决的已复现 P1/P2；后续接口收缩仍需真实消费者与版本兼容设计，不能按直接引用为零删除公共能力。
