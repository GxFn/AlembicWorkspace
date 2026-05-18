# Requirement To Wave Execution Flow

状态：长期流程规则
维护窗口：AlembicWorkspace

本文档固化从用户需求到第一波执行派发的成熟路线。它不是某一次任务计划，而是总控窗口后续处理较大需求时的默认流程。

## 成熟路线

1. 原始需求进入需求目录
   - 在 `docs/requirement-designs/<需求名>/` 新建 `original-plan-YYYY-MM-DD.md`。
   - 只记录用户目标、约束、口径和确认问题，不提前拆执行任务。
   - 用户确认前，发送给必须是无。

2. 原始计划书确认
   - 用户确认原始计划书后，才进入需求设计。
   - 如果用户补充或改变目标，先更新原始计划书或需求目录 README，再继续。

3. 需求设计
   - 创建 `requirement-design-YYYY-MM-DD.md`。
   - 写清用户场景、完整功能闭环、输入输出、状态变化、生产方、消费方、验证方式和完成定义。
   - 这里可以写阶段候选方向，但不能作为执行派发依据。

4. 深度代码实现依赖调研
   - 对跨仓库、架构边界、运行时、发布链路、删除清理、多项目控制等任务，必须在需求目录下创建 `code-implementation-dependency-research-YYYY-MM-DD.md` 或等价调研附件。
   - 该文档记录真实代码入口、调用链、生命周期、共享状态、持久化位置、producer / consumer、不能切换或不能删除的硬边界。
   - 外部调研是否需要由总控判断；需要时引用官方文档或权威来源，不需要时写明理由。

5. 目标阶段确认
   - 基于需求设计和深度代码证据，在 `docs/workspace/` 创建任务级目标阶段确认文档。
   - 目标阶段确认文档必须写清最终完成定义、非目标、影响窗口、依赖链、阶段计划、验证策略和确认问题。
   - 用户确认前，确认文档和 `workspace-current-status.md` 都必须保持不派发；发送给为无。

6. 用户确认目标阶段
   - 在确认文档回填用户确认。
   - 仍不要把确认文档当作长期执行文档堆叠所有 wave。

7. 创建第一波执行计划
   - 用户确认后，新建或激活 `docs/workspace/<topic>-wave-N-...-plan-YYYY-MM-DD.md`。
   - 把 `docs/workspace/index.md` 当前计划第一行切到 wave 执行计划。
   - `workspace-current-status.md` 同步成当前 wave 状态。
   - 只把当前无上游阻塞、发送后能推进的窗口标为 `待启动` 或 `执行中`。

8. 输出可复制提示词
   - 只输出当前 wave 中应发送窗口的提示词。
   - 状态为 `阻塞`、`观察中`、`无任务`、`暂停`、`已完成`、`待验收` 的窗口不发送。

## 强化检查点

- 需求是否是完整功能模块，而不是抽象连接。
- 需求设计的阶段是否仍然只是候选方向。
- 是否已有足够代码证据支撑最终阶段顺序。
- 是否逐一覆盖 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`BiliDili`。
- producer / consumer 是否清晰：上游 contract / API / artifact / evidence 未完成前，下游不得猜字段。
- 当前计划是否指向真正的 wave 执行文档，而不是还在等待确认的目标阶段文档。
- `发送给` 是否与 `待启动` / `执行中` 状态一致。
- 是否运行 `node scripts/verify-workspace-docs.mjs --all-workspace`、`node scripts/check-dispatch-coverage.mjs` 和 `git diff --check`。

## 文档关系

- 需求目录保存原始计划书、需求设计、代码实现依赖调研。
- `docs/workspace/` 保存目标阶段确认、wave 执行计划、当前状态和总控索引。
- `docs/<Repo>/` 保存单仓库执行回填文档。
- `docs/workspace/index.md` 永远指向当前实际入口；确认阶段指向目标阶段确认，执行阶段指向当前 wave 执行计划。
