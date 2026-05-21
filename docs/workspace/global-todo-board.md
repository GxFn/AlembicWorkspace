# AlembicWorkspace Global TODO Board

状态：维护中
维护窗口：AlembicWorkspace
更新日期：2026-05-22

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
| GTODO-2026-05-21-001 | 已完成 | 主线实现 | P0 | `AlembicPlugin` | 强化 `primeKnowledgeMaterial.hostResponse`、`shoutInstruction` 和 Skill，让 Codex 在 prime tool result 后立即做开发者可见知识接收呐喊，再继续任务。 | 是 | AlembicPlugin commit `829f838704159c7ed205f93ecd986c6234173721`，总控验收通过。 | `AlembicPlugin` | [prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](archive/2026-05/prime-immediate-receipt-shout/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md) |
| GTODO-2026-05-21-002 | 已完成 | 真实项目复测 | P0 | `AlembicTest` | 在 BiliDili 真实项目中验证 prime 后立即呐喊，而不是最终总结时才呐喊。 | 是 | Test-2026-05-21-03 功能验收通过并封口，AlembicTest commit `b532cd8bf7c40c8f12b93f91380befdea617d999`。 | `AlembicTest` | [prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](archive/2026-05/prime-immediate-receipt-shout/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md)、[alembic-test-exchange.md](alembic-test-exchange.md) |
| GTODO-2026-05-21-003 | 观察中 | shared contract | P2 | `AlembicCore` / `AlembicPlugin` | 观察 `PrimeHostResponseInstruction`、evidenceRef projection 或 Recipe projection 是否需要下沉为 Core 共享 contract。 | 否 | 只有出现第二个真实生产方 / 消费方时启动。 | `AlembicCore` | [prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](archive/2026-05/prime-immediate-receipt-shout/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md) |
| GTODO-2026-05-21-004 | 观察中 | service contract | P2 | `Alembic` / `AlembicPlugin` / `AlembicCore` | 为 Alembic resident service 增加明确 service API / capability / contract version，避免服务请求退化成 MCP tool ownership bridge。 | 否 | prime immediate shout 主闭环完成后再评估。 | 待定 | [alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md) |
| GTODO-2026-05-21-005 | 观察中 | 证据质量 | P2 | 待定 | 部分 Recipe evidenceRef 只有路径没有行号；后续若要强制行号级证据，需要回到 Recipe / sourceRefs 生成链路补强。 | 否 | Test-2026-05-21-02 风险记录；不阻塞当前 service boundary / immediate shout。 | 待定 | [alembic-test-exchange.md](alembic-test-exchange.md) |
| GTODO-2026-05-21-006 | 已完成 | resident vector search | P0 | `AlembicPlugin` / `Alembic` / `AlembicCore` / `AlembicTest` / `AlembicWorkspace` | 删除 Plugin misleading placeholder embed executable 逻辑，并连接 Alembic resident service 的真实 semantic / vector search，让 Codex prime/search 能消费 BiliDili 已生成的 HNSW 向量。 | 是 | Test-2026-05-22-01 已通过；本机 Codex plugin cache 已刷新到 AlembicPlugin `2c98f69b1388c478bbbb255e487c51fde621cff7`；workspace 文档已提交。 | `AlembicWorkspace` | [resident-vector-search-release-workspace-plan-2026-05-21.md](archive/2026-05/resident-vector-search-release/resident-vector-search-release-workspace-plan-2026-05-21.md)、[alembic-test-exchange.md](alembic-test-exchange.md) |
| GTODO-2026-05-21-007 | 已完成 | 可见摘要优化 | P0 | `AlembicPlugin` | 优化 prime receipt shout：开发者可见内容要像真的呐喊一样有声量地喊出知识摘要，不把 evidenceRefs 路径 / 行号作为主要可见内容倾倒出来。 | 是 | AlembicPlugin commit `58b82f8526d68aef516d68477d7a0e505fc114e9`；AlembicCodex runtime artifact `df608057bd274ebb6b39f6a9c0e964f1b8517426`；总控验收通过，本机 Codex plugin cache 已刷新。 | `AlembicPlugin` | [prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](archive/2026-05/prime-immediate-receipt-shout/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md) |
| GTODO-2026-05-21-008 | 已完成 | 真实项目复测 | P0 | `AlembicTest` | 在 BiliDili 真实项目中验证 SHOUT-5 后的 Codex 可见呐喊是否主动、有声量地喊出知识摘要，且不默认倾倒 evidenceRefs 路径 / 行号。 | 是 | Test-2026-05-21-04 功能验收通过并封口；AlembicTest commit `60bbd360be147062f834ee881630ca25918663d0`；BiliDili 前后干净。 | `AlembicTest` | [prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](archive/2026-05/prime-immediate-receipt-shout/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md)、[alembic-test-exchange.md](alembic-test-exchange.md) |
| GTODO-2026-05-21-009 | 已完成 | 可见语义修正 | P0 | `AlembicPlugin` | 收紧 prime receipt shout 的说话者主语：开发者可见呐喊应由 Codex / 我来声明接收到哪些知识，不要默认生成 “Alembic prime 已接收” 这类工具名作主语的表达。 | 不新增 AlembicTest 复测；只影响 Plugin 派发 | AlembicPlugin commit `45db3a780759b7e4db24f920acbd56f0b4684d63` 已通过总控验收；本机 cache 已在 VEC-6 刷新到后续 AlembicPlugin commit `2c98f69b1388c478bbbb255e487c51fde621cff7`，包含 SHOUT-7。 | `AlembicWorkspace` | [prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](archive/2026-05/prime-immediate-receipt-shout/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md) |
| GTODO-2026-05-21-010 | 执行中 | 下一主线 / 长线清理 | P0 | `AlembicPlugin` | 长线删除 `AlembicPlugin` 里旧内置第三方 AI 能力残留：删除 `HostAiAdapter` 可执行 provider 外形、`chat()` / `embed()` 占位、DI `_embedProvider` 误用入口，以及旧 AI 配置 / 状态 / 权限 surfaces；Codex 智能通过 tool result / Skill 交给 Codex agent，semantic/vector 通过 Alembic resident service，需要 AI 的主体能力回到 Alembic 主体配置入口。 | 是，影响后续 Plugin 边界、repo-boundary 和真实 Codex 验证 | 用户已确认旧 AI 配置来自早期整体 Codex 插件路线，现不再需要；当前计划进入 AIP-0 总控代码依赖调研，完成前不派发实现窗口。 | `AlembicWorkspace` / `AlembicPlugin` | [alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md](alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md) |

## 最近同步记录

- 2026-05-21：根据用户要求创建全局 TODO 列表。当前主线 TODO 来源为 [prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](archive/2026-05/prime-immediate-receipt-shout/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md)；后续风险项来源为 Test-2026-05-21-02 和 service request boundary 收口计划。
- 2026-05-21：`AlembicPlugin` immediate receipt shout 已通过总控验收，GTODO-2026-05-21-001 标为已完成；Test-2026-05-21-03 已创建，GTODO-2026-05-21-002 转为待启动。
- 2026-05-21：Test-2026-05-21-03 功能验收通过，GTODO-2026-05-21-002 转为执行中；当前剩余动作是 `AlembicTest` 封口提交测试报告、probe 脚本和相关文档变更。
- 2026-05-21：Test-2026-05-21-03 已由 `AlembicTest` commit `b532cd8bf7c40c8f12b93f91380befdea617d999` 封口，GTODO-2026-05-21-002 标为已完成；根据用户人工验证反馈新增 GTODO-2026-05-21-007，派发 `AlembicPlugin` 优化可见呐喊摘要，要求像真的呐喊一样有声量地喊出内容。
- 2026-05-21：`AlembicPlugin` SHOUT-5 已通过总控验收并刷新本机 Codex plugin cache，GTODO-2026-05-21-007 标为已完成；新增 GTODO-2026-05-21-008 / Test-2026-05-21-04，派发 `AlembicTest` 做 BiliDili 可见摘要复测。
- 2026-05-21：Test-2026-05-21-04 功能验收通过，GTODO-2026-05-21-008 转为执行中；当前剩余动作是 `AlembicTest` 封口提交 readable receipt shout 测试报告、probe 脚本和相关测试文档变更。
- 2026-05-21：Test-2026-05-21-04 已由 `AlembicTest` commit `60bbd360be147062f834ee881630ca25918663d0` 封口，GTODO-2026-05-21-008 标为已完成。
- 2026-05-21：根据用户截图反馈新增 GTODO-2026-05-21-009 / SHOUT-7，派发 `AlembicPlugin` 修正 receipt shout 主语为 Codex / 我；用户确认该项不走 AlembicTest 真实项目测试。
- 2026-05-21：用户确认删除 `AlembicPlugin` misleading embedding placeholder 并连接 `Alembic` resident service 实现真实向量能力；GTODO-2026-05-21-006 从观察项升级为 P0 当前发布计划，挂入 [resident-vector-search-release-workspace-plan-2026-05-21.md](archive/2026-05/resident-vector-search-release/resident-vector-search-release-workspace-plan-2026-05-21.md)，状态为暂停，等待用户确认阶段顺序后派发。
- 2026-05-21：用户确认 resident vector search 发布计划可以执行；GTODO-2026-05-21-006 转为执行中，当前只派发 `AlembicCore` / `Alembic` 做 VEC-1 resident search contract / telemetry，上游回填后再启动 `AlembicPlugin`。
- 2026-05-21：用户口径更新 `AlembicCore` / `Alembic` 完成；总控复核后确认 Core 可收，但 Alembic `d6526aa0541dc8ce54e10d4efe97366b7646e7bf` 的 `/api/v1/search` telemetry 会覆盖 Core `searchMeta` 并可能把 sparse-only RRF 误报为真实 vector used，GTODO-2026-05-21-006 继续执行中，当前只返工 `Alembic`。
- 2026-05-21：用户口径更新 `Alembic` 返工完成；总控复核 `2cfd935b83241ee72263e18528c9647ded65dec7` 通过，确认 Alembic 已优先保留 Core `searchMeta.semanticUsed/vectorUsed/fallbackReason`，GTODO-2026-05-21-006 进入 VEC-2，当前派发 `AlembicPlugin`。
- 2026-05-21：根据用户确认新增 GTODO-2026-05-21-010，作为下一条主线等待执行：长线删除 `AlembicPlugin` 中旧内置第三方 AI provider / embedding provider 能力残留。当前不抢 resident vector bridge 派发位，等 VEC-2/VEC-4 验收后另开独立 workspace 计划。
- 2026-05-21：用户口径更新 `AlembicPlugin` 完成；总控复核 `AlembicPlugin` commit `7a81721061bbaaba437343876a56eec62356297a` 与 AlembicCodex runtime artifact `c160c062e95329ff0126cb98f1a9c36bbd451678` 通过，确认 VEC-2 placeholder embed 清理与 VEC-3 resident search adapter / prime-search integration 已形成 Plugin 侧闭环；GTODO-2026-05-21-006 继续执行中，当前创建 Test-2026-05-21-05 派发 `AlembicTest` 做 BiliDili 真实项目复测。
- 2026-05-21：用户口径更新 `AlembicTest` 完成；总控验收 Test-2026-05-21-05 结论为失败：prime 成功且 Plugin-owned 边界保持，但 direct `alembic_search` 被错误桥接到不存在的 `/api/v1/mcp/call`，daemon `/api/v1/search` 能命中但运行态未返回 telemetry。用户确认删除 `/api/v1/mcp/call`；GTODO-2026-05-21-006 继续执行中，当前派发 `AlembicPlugin` / `Alembic` 做 VEC-4R。
- 2026-05-21：`AlembicPlugin` 完成 VEC-4R Plugin 侧修复，commit `f46e28179aac306e7fff12fe9d7d68965494c1d8`，AlembicCodex runtime artifact `daec908a340f4dbe60a8cec643efdc126cf9ff77`；GTODO-2026-05-21-006 继续执行中，当前只等待 / 派发 `Alembic` 删除自身 `/api/v1/mcp/call` route。
- 2026-05-21：用户口径更新 `AlembicPlugin` / `Alembic` 均完成；总控代码复核 Alembic `d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10` 通过，确认 `Alembic/lib` / `Alembic/test` 中 `/api/v1/mcp/call`、`McpBridgeDispatcher`、`routes/mcp` 和 `daemon-mcp-compat-bridge` 负向扫描清零；GTODO-2026-05-21-006 继续执行中，当时创建 Test-2026-05-21-06 派发 `AlembicTest` 做 BiliDili 真实项目复测。
- 2026-05-21：用户口径更新 `AlembicTest` 完成；总控验收 Test-2026-05-21-06 结论为失败但部分通过：direct search 已不再走 `/api/v1/mcp/call`，但 daemon `/api/v1/search` 运行态仍无 `searchMeta`，direct `auto` resident request 因 `Query parameter validation failed` 降级。GTODO-2026-05-21-006 继续执行中，当前派发 `AlembicPlugin` / `Alembic` 做 VEC-5R；`AlembicTest` 阻塞等待下一张测试单。
- 2026-05-21：`AlembicPlugin` 完成 VEC-5R Plugin 侧修复，commit `2c98f69b1388c478bbbb255e487c51fde621cff7`，AlembicCodex runtime artifact `33689ec1cd0266023fab2d7c1bebf7ad6fd59732`；GTODO-2026-05-21-006 继续执行中，当前只等待 / 派发 `Alembic` 处理 running daemon `/api/v1/search` telemetry。
- 2026-05-22：用户口径更新 `AlembicPlugin` / `Alembic` 均完成；总控复核发现 Plugin 侧提交与执行记录齐全，Alembic 侧无新代码提交且工作区干净，按运行态刷新 / 无代码变更完成口径进入真实复测。GTODO-2026-05-21-006 继续执行中，当前创建 Test-2026-05-22-01 派发 `AlembicTest`。
- 2026-05-22：用户口径更新 `AlembicTest` 完成；总控验收 Test-2026-05-22-01 结论通过，direct `alembic_search(auto)` 保留 `codexRequestedMode=auto` 并以 `residentRequestMode=semantic` 请求 Alembic，daemon `/api/v1/search` 与 direct `auto/semantic` 均返回 `semanticUsed=true` / `vectorUsed=true` / `residentVector.available=true`，BiliDili 前后干净；GTODO-2026-05-21-006 继续执行中，当前进入 VEC-6，由 `AlembicWorkspace` 做 cache refresh / 发布态验证和文档收口。
- 2026-05-22：总控完成 VEC-6 cache refresh，命令 `npm run dev:codex-plugin:local-mcp -- --clean --all-installed` 成功，cache marker `gitHead=2c98f69b1388c478bbbb255e487c51fde621cff7`、mode `local-mcp`、target `~/.codex/plugins/cache/gxfn/alembic-codex/0.1.2`；workspace 文档已提交，GTODO-2026-05-21-006 标为已完成。
- 2026-05-22：总控验收 SHOUT-7 通过，GTODO-2026-05-21-009 标为已完成；不创建 AlembicTest 复测单。
- 2026-05-22：用户确认功能完成并要求文档归档、准备下一条 TODO 主线；总控已归档 prime immediate receipt shout 与 resident vector search release 两条计划，创建 [alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md](alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md)，GTODO-2026-05-21-010 进入 AIP-0 总控代码依赖调研；当前发送窗口为无。
- 2026-05-22：用户补充确认 Plugin 侧旧 AI 配置来自早期“整体做成 Codex 插件”的路线；由于 Codex 不允许插件使用第三方 AI 扫描项目，现路线为 Codex 插件 + Alembic 主体，因此 Plugin 侧 AI 配置 / 状态 / 权限 surfaces 默认进入删除范围，长期配置归 Alembic 主体。
