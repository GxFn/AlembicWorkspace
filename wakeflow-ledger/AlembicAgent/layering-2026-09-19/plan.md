# 工具执行管道职责分层与继续 review

用户已授权控制提交节奏，并继续逐文件 review、职责设计、联网研究和实现架构优化。前两轮未提交内容经哈希比较没有额外变化；AGENTS.md、CLAUDE.md 为用户原有改动，保持在提交之外。

## 提交与执行顺序

1. 前两轮互相依赖的 runtime/tool/memory/provider 修复、测试及维护门禁作为完整基线提交；先复验，不能拆出中间不可构建的任意历史片段。
2. 为已确认的“宿主瞬时异常被 duplicate cache 永久复用”增加真实 createToolPipeline 回归，修复失败归一与缓存准入并单独验证/提交。
3. 在当前 public use/execute 入口补齐生命周期行为表征，再按职责拆分 ToolExecutionPipeline：types/runner、request+envelope bridge、权限与阶段 gates、snapshot cache、evidence/observers、producer ledger；原导出与默认顺序保持。
4. 为新内部边界添加可执行依赖约束；现有顶层 agent/ai/tools/shared 约束继续生效。规则由实际 import 图导出，新增负例应先证明原门禁无法阻止逆向耦合。
5. 发布源码职责图和逐文件归属/消费/验证记录；执行完整 check、公开包导入和独立复审后提交本轮分层。

## 完整行为约束

- before 依注册顺序；blocked 或显式 result 短路 host 调用；已有 after 顺序和异常传播语义不变。
- 默认链保持 allowlist→argument bounds→runtime safety→phase gates→snapshot cache→evidence→observation→tracker→trace→submission。
- evidence envelope 变更先于 memory/trace 消费；cache 在该变更前记录；实际成功入库才记 submission。
- runtime bridge 保留 sharedState、Set、ledger、scope 及取消 signal 的引用/身份语义。
- 可选 progress/EventBus hook 不加入默认链，以免与 Runtime 重复发事件。
- 新内部模块不形成新的 package export；重复 ToolMetadata 以现有公共类型为源，仅扩展内部 cache key。
- 不改变 Core 确定性能力，不修改相邻仓或参考项目，不引入新 framework 依赖，不削弱权限和失败语义。

## 研究方向

研究本地 TencentDB-Agent-Memory 的 injection types/registry/runner/adapter 分工和真实主链；其内容注入 hook 的容错方式不能直接用于权限门禁。并核对 Fastify 官方 lifecycle/hooks 和 Google ADK 官方 callback 设计，采用明确顺序、观察与控制分离、短路后处理语义，不照搬框架或代码。

## 基线说明

起始 HEAD：00a27d7。上一轮 65 文件/766 测试通过。此次首轮复验有 64 文件/757 测试通过，contract-surface 因相邻 Core logging 产物短暂不可解析未加载；随后新进程导入与该 9 项测试恢复。保留原失败日志并补全量复验后提交，不修改 Agent import 来掩盖相邻产物更新窗口。
