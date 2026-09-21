# Core 架构整合与测试精简

日期：2026-09-19。基线：`fec4b76`。用户直接要求继续架构优化、代码/测试清理、接口统一，并学习联网业界资料及本地 TencentDB-Agent-Memory。

Gate conclusion：属于明确的实施命令；现有公开 API 与真实外层接线可查，最小闭环为研究具体模式 → 选定内部重复实现 → 保留行为的合并与缺陷回归 → 完整验证 → 本地提交。当前无授权阻塞；先核实重复逻辑的语义和信任边界。

## 范围与恢复边界

- Core 产品代码/测试/必要文档；沿用已授权的 Alembic/AlembicPlugin 必要接线范围。TencentDB-Agent-Memory 只读研究，不导入宿主 Agent/provider/UI 功能。
- 稳定公开方法、构造方式、68 个 package exports、DTO、状态机、排序、预算和持久化格式保持兼容；内部接口可以重构。
- 保护原有 AGENTS.md、CLAUDE.md 修改与未跟踪 coverage/index.ts。dist 仅构建，不提交；无 push、发布、vendor 变更。
- 本次是直接用户开发，不创建 Wakeflow delivery、不改总控状态。使用 target-craft 的基线、缺陷先复现、自审和验证方法。

## 步骤

1. 阅读实际消费方、腾讯本地代码/commit 和官方技术资料，记录可迁移的具体模式及不能照搬的差异。
2. 收敛单条知识写入：知识服务 create/update/quality/lifecycle、Guard create 和 sustain update 的文件优先顺序、错误分流与 DB 读回校验。SQLite 同步批次 UoW 保留独立事务职责，不伪造文件/DB 原子事务。
3. 根据只读审查选择一个验证链整合切片；相同规则共用实现，不取消不同信任边界的必要检查。记录错误顺序/返回形状兼容证据。
4. 按行为职责整合测试，优先消除重复 fixture、运行和实现镜像断言；每项删除映射到保留覆盖。四个 Core 硬边界测试保留。
5. 每切片先跑相关基线；缺陷先记录 RED 再修复。最后跑 Core 完整 check 和必要外层消费验证，审查 public declarations/diff，提交并记录结果/限制。

## 当前兼容设计

知识服务与 Guard 的业务权限/状态机仍由各服务决定；内部写入口只接收已准备好的实体、明确文件动作和 DB 提交闭包。无 fileStore 的旧调用仍执行原 DB-only 分支并给诊断。文件失败阻止 DB；文件成功但 DB 失败/读回不一致时保留文件并报告已有 DivergenceError 与同步修复路径。公开错误字段的既有强语义不削弱。

## 实施结论

- 第 2 步已完成，独立复核补充并修复 UPDATE 被忽略时的错误成功，RED/GREEN 日志已保留。
- 第 3 步选择 strict admission 的两次相同 UnifiedValidator 调用；改为一次 detailed 返回，未合并语义不同的公开验证器。
- 第 4 步移除三份重复测试/辅助文件，保留覆盖映射并复用真实资源工厂；完整检查发现迁移留下的不可达三行，已清除并复验。
- 研究来源、兼容设计及删除映射见 research-and-design.md。最终验证与提交待记录在 verification.json 与 review-summary.md。

## 同链路补全（5f9e92e 后）

外层消费验证通过后，继续检查知识服务剩余写入口，确认自动关系/反向清理仍直写 DB，删除异常被吞，以及带 proposal/warning/lifecycle FK 的主行删除失败。它们属于用户原始代码审查/修复及本轮统一写入口目标，不是新的产品能力或外层仓库扩展。

- 先补真实自动关联→同步、删除→反向引用同步、unlink/归属不明、无文件、DB abort/ignore 重试及 FK 事务回滚用例；RED 日志为 red-secondary-writes / red-delete-dependents。
- 沿用内部协调器，将其命名为 commitKnowledgeWrite 并覆盖删除。保持 remove false=无匹配文件；IO/归属无法确认重抛；DB 删除失败恢复路径明确为同 id 重试 KnowledgeService.delete。
- 自动关系用最新实体合并并先写真相后投影边；反向引用持久化清理在主删除前完成。主 DELETE 与 FK 从表清理归 repository 同步事务，服务不复制表关系。
- 修改仅在 Core；二次验证需完整 Core check 及两外层受影响消费方复验。保留全部旧 public underscore 方法签名，内部使用共享实现。
- 独立复核补充的后台关联/删除竞态已先用真实 SQLite/writer 暂停探针 RED，再加入有界的任务失效协调并 GREEN；最终需在该状态重跑完整检查。

## 最终状态

计划及同链补全已完成。Core 最终完整 check 通过（2184 pass / 1 skip），两个宿主全仓 no-emit 与 37/102 相关用例通过。提交为 5f9e92e 与 8ab3783；无外层改动需要。最终材料为 review-summary.md、verification.json、research-and-design.md、change-inventory.json。
