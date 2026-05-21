# AlembicWorkspace Global TODO Board

状态：维护中
维护窗口：AlembicWorkspace
更新日期：2026-05-21

## 定位

本文件是 AlembicWorkspace 的全局 TODO 记账本，用来记录跨计划、跨窗口、暂未进入当前波次或需要长期追踪的待办事项。

它不替代当前总控计划。任何会影响当前派发、窗口状态、复测顺序或完成定义的 TODO，仍必须同步写入当前计划的 `TODO / Backlog` 和 `空闲窗口调度`；总控派发以当前计划为准。涉及真实项目测试的 TODO，只在这里记录触发条件，正式测试单仍必须写入 [alembic-test-exchange.md](alembic-test-exchange.md)。

## 维护规则

- 新增 TODO 时，必须写清事项类型、目标、归属仓库、优先级、是否影响复测 / 派发、依赖 / 触发条件、推荐窗口和当前挂载文档。
- 当前主线阻塞项必须同时出现在当前计划中；全局列表只做跨计划追踪。
- 完成项不在本文件长期堆叠，完成后把提交 hash、验证结果和风险回填到来源计划或测试交流文档，再从本列表移除或改为短期 `已完成` 过渡项。
- `归属` 或 `推荐窗口` 标为 `待定` 的事项只能作为观察项，不能直接派发；派发前必须先补代码调研和窗口覆盖判断。
- 若用户调整优先级，总控必须重新计算当前计划派发顺序，并同步更新本文件。

## 全局 TODO

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 | 当前挂载 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-21-001 | 已完成 | 主线实现 | P0 | `AlembicPlugin` | 强化 `primeKnowledgeMaterial.hostResponse`、`shoutInstruction` 和 Skill，让 Codex 在 prime tool result 后立即做开发者可见知识接收呐喊，再继续任务。 | 是 | AlembicPlugin commit `829f838704159c7ed205f93ecd986c6234173721`，总控验收通过。 | `AlembicPlugin` | [prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](prime-immediate-receipt-shout-workspace-plan-2026-05-21.md) |
| GTODO-2026-05-21-002 | 待启动 | 真实项目复测 | P0 | `AlembicTest` | 在 BiliDili 真实项目中验证 prime 后立即呐喊，而不是最终总结时才呐喊。 | 是 | Test-2026-05-21-03 已创建；本机 Codex plugin cache 已刷新到 Plugin `829f838704159c7ed205f93ecd986c6234173721`。 | `AlembicTest` | [prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](prime-immediate-receipt-shout-workspace-plan-2026-05-21.md)、[alembic-test-exchange.md](alembic-test-exchange.md) |
| GTODO-2026-05-21-003 | 观察中 | shared contract | P2 | `AlembicCore` / `AlembicPlugin` | 观察 `PrimeHostResponseInstruction`、evidenceRef projection 或 Recipe projection 是否需要下沉为 Core 共享 contract。 | 否 | 只有出现第二个真实生产方 / 消费方时启动。 | `AlembicCore` | [prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](prime-immediate-receipt-shout-workspace-plan-2026-05-21.md) |
| GTODO-2026-05-21-004 | 观察中 | service contract | P2 | `Alembic` / `AlembicPlugin` / `AlembicCore` | 为 Alembic resident service 增加明确 service API / capability / contract version，避免服务请求退化成 MCP tool ownership bridge。 | 否 | prime immediate shout 主闭环完成后再评估。 | 待定 | [alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md) |
| GTODO-2026-05-21-005 | 观察中 | 证据质量 | P2 | 待定 | 部分 Recipe evidenceRef 只有路径没有行号；后续若要强制行号级证据，需要回到 Recipe / sourceRefs 生成链路补强。 | 否 | Test-2026-05-21-02 风险记录；不阻塞当前 service boundary / immediate shout。 | 待定 | [alembic-test-exchange.md](alembic-test-exchange.md) |
| GTODO-2026-05-21-006 | 观察中 | runtime quality | P2 | `AlembicPlugin` | 插件运行时 embedding 因不捆绑 AI execution 降级为 sparse-only；后续可评估是否需要更明确的诊断、配置或安装态说明。 | 否 | Test-2026-05-21-02 风险记录；不阻塞当前主线。 | `AlembicPlugin` | [alembic-test-exchange.md](alembic-test-exchange.md) |

## 最近同步记录

- 2026-05-21：根据用户要求创建全局 TODO 列表。当前主线 TODO 来源为 [prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](prime-immediate-receipt-shout-workspace-plan-2026-05-21.md)；后续风险项来源为 Test-2026-05-21-02 和 service request boundary 收口计划。
- 2026-05-21：`AlembicPlugin` immediate receipt shout 已通过总控验收，GTODO-2026-05-21-001 标为已完成；Test-2026-05-21-03 已创建，GTODO-2026-05-21-002 转为待启动。
