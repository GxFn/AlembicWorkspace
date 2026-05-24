# AlembicWorkspace Global TODO Board

状态：维护中
维护窗口：AlembicWorkspace
更新日期：2026-05-24

## 定位

本文件是 AlembicWorkspace 的全局 TODO 记账本，用来记录跨计划、跨窗口、暂未进入当前波次或需要长期追踪的待办事项。

它不替代当前总控计划。任何会影响当前派发、窗口状态、复测顺序或完成定义的 TODO，仍必须同步写入当前计划的 `TODO / Backlog` 和 `空闲窗口调度`；有当前计划时，总控派发以当前计划为准。涉及真实项目测试的 TODO，只在这里记录触发条件，正式测试单仍必须写入 [alembic-test-exchange.md](alembic-test-exchange.md)。

## 维护规则

- 新增 TODO 时，必须写清事项类型、目标、归属仓库、优先级、是否影响复测 / 派发、依赖 / 触发条件、推荐窗口和当前挂载文档。
- 当前主线阻塞项必须同时出现在当前计划中；全局列表只做跨计划追踪。
- 当前主线进行时讨论出的新需求，如果不改变当前主线完成定义，先进入本列表；后续只能在空闲窗口条件满足时调度，或在当前主线彻底验收归档后经目标确认提升为新主线。
- 完成项不在本文件长期堆叠，完成后把提交 hash、验证结果和风险回填到来源计划或测试交流文档，再从本列表移除或改为短期 `已完成` 过渡项。
- `归属` 或 `推荐窗口` 标为 `待定` 的事项只能作为观察项，不能直接派发；派发前必须先补代码调研和窗口覆盖判断。
- 若用户调整优先级，总控必须重新计算当前计划派发顺序，并同步更新本文件。

## 全局 TODO

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 | 当前挂载 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-21-003 | 观察中 | shared contract | P2 | `AlembicCore` / `AlembicPlugin` | 观察 `PrimeHostResponseInstruction`、evidenceRef projection 或 Recipe projection 是否需要下沉为 Core 共享 contract。 | 否 | 只有出现第二个真实生产方 / 消费方时启动。 | `AlembicCore` | [workspace-record-map.md](../workspace-record-map.md#todo-records) |
| GTODO-2026-05-21-004 | 观察中 | service contract | P2 | `Alembic` / `AlembicPlugin` / `AlembicCore` | 为 Alembic resident service 增加明确 service API / capability / contract version，避免服务请求退化成 MCP tool ownership bridge。 | 否 | prime immediate shout 主闭环完成后再评估。 | 待定 | [workspace-record-map.md](../workspace-record-map.md#todo-records) |
| GTODO-2026-05-21-005 | 观察中 | 证据质量 | P2 | 待定 | 部分 Recipe evidenceRef 只有路径没有行号；后续若要强制行号级证据，需要回到 Recipe / sourceRefs 生成链路补强。 | 否 | Test-2026-05-21-02 风险记录；不阻塞当前 service boundary / immediate shout。 | 待定 | [workspace-record-map.md](../workspace-record-map.md#todo-records) |
| GTODO-2026-05-23-019 | 观察中 | consumer residual readiness | P2 | `AlembicCore` / `Alembic` | Core 已在 `69bda3ff6ac413ac1fc318253a840986660a4386` 通过 `@alembic/core/knowledge` additive 导出 `normalizeLifecycle`；Alembic `DomainLifecycle` / `KnowledgeGovernance` 的 2 处 test-only `@alembic/core/domain/knowledge/Lifecycle` allowance 是否替换，等待 consumer 窗口按后续计划处理。 | 否 | 来源为 CCIC-TODO-21；只有继续收束 test-only residual、准备 Core public API closeout 或做 Plugin / Alembic service contract 对齐时启动。不得为清零 deep import 直接删除 test-only allowance。 | `Alembic` | [workspace-record-map.md](../workspace-record-map.md#todo-records) |
| GTODO-2026-05-23-022 | 待排期 | contract typing | P2 | `AlembicDashboard` / `Alembic` | 收敛 Dashboard `src/api.ts` 剩余 3 处动态 contract `any`，需要与后端 SSE / Guard contract 类型对齐。 | 否 | 来源 SFC-R2 Dashboard 回填；现由 lint budget 锁住，不阻塞本轮质量门禁。 | `AlembicDashboard` / `Alembic` | [workspace-record-map.md](../workspace-record-map.md#todo-records) |
| GTODO-2026-05-23-023 | 观察中 | performance follow-up | P3 | `AlembicDashboard` | Mermaid 已 lazy 为 async chunk，但体积仍较大；后续若 Dashboard 首次打开图表或构建体积成为目标，再做 Mermaid 内部依赖拆分 / 替代方案专项。 | 否 | 来源 SFC-R2 Dashboard 回填；已移出首屏，不阻塞本轮小问题修复。 | `AlembicDashboard` | [workspace-record-map.md](../workspace-record-map.md#todo-records) |
| GTODO-2026-05-23-024 | 观察中 | product behavior | P3 | `AlembicAgent` | L4 compaction 当前问题较多，暂不处理；仅在用户再次提及时重新进入需求分析 / 目标确认。 | 否 | 用户于 2026-05-23 确认低优等待提及；未确认前不派发实现。 | `AlembicAgent` | [workspace-record-map.md](../workspace-record-map.md#todo-records) |
| GTODO-2026-05-24-030 | 并入主线 | multi-root project skill export | P3 | `Alembic` / `AlembicPlugin` / `AlembicCore` | 多文件夹项目 / 多 root 场景下，将同一 `projectScopeId` 下的 project skills 绑定到多个 Codex 可见 `codexSkillRoots[]` 并保持项目级隔离。 | 否 | 已并入 `GTODO-2026-05-24-036` 的 ProjectScope 设计；等 multi-root 项目单位确认后一起设计。 | 待定 | [multi-root-project-scope](../../requirement-designs/multi-root-project-scope/) |
| GTODO-2026-05-24-036 | 第一波待启动 | multi-root project scope | P0 | `AlembicCore` / `Alembic` / `AlembicPlugin` / `AlembicDashboard` / `AlembicAgent` / `AlembicTest` | 支持“一抽象 Project 对多实体 Folder”的项目模型；Plugin 默认确认当前 folder 的单 folder Project，用户通过 Alembic CLI / Dashboard 显式绑定多个 folder 后，Plugin 在任一绑定 folder 中使用同一套跨仓库知识库；新 ProjectScope 固定 Ghost dataRoot，不支持 standard 兼容 / 降级 / 分叉。 | 是 | 用户 2026-05-24 已确认 Project / Folder / controlRoot / CLI 优先 / Plugin 单 folder 自洽路线 / Ghost-only 新标准；当前 wave 1 只发送给 `AlembicCore`。 | `AlembicCore` | [multi-root-project-scope-wave-1](multi-root-project-scope-wave-1-2026-05-24.md) |
| GTODO-2026-05-24-037 | 待排期 | plugin intent knowledge route | P1 | `AlembicPlugin` / `Alembic` / `AlembicCore` / `AlembicDashboard` | Plugin 意图同步，以及意图下面的知识注入与知识检索链路优化增强；让 Codex 当前任务意图驱动 prime / search / Recipe evidence / shout。 | 是 | 依赖 `GTODO-2026-05-24-036` 明确 ProjectScope，否则意图和知识检索会绑定到单 cwd 并返工。 | 待定 | [global-todo-board.md](global-todo-board.md) |
| GTODO-2026-05-24-038 | 待排期 | alembic file monitor evolution | P1 | `Alembic` / `AlembicCore` / `AlembicDashboard` / `AlembicTest` | Alembic 使用本地文件监控代替旧 VSCode 插件模式，支持文件变化触发知识进化逻辑。 | 是 | 依赖 `GTODO-2026-05-24-036` 明确 ProjectScope 多 root watch 范围、dataRoot 和 evidence 归属；后续与 `GTODO-2026-05-24-037` 的意图链路对齐。 | 待定 | [global-todo-board.md](global-todo-board.md) |
| GTODO-2026-05-24-039 | 待排期 | plugin no-monitor evolution | P1 | `AlembicPlugin` / `AlembicCore` / `AlembicTest` | Plugin 在没有 Alembic file monitor 时的知识进化逻辑：基于 Codex host-agent 当前任务、diff、Guard / search / submit 结果做机会式进化。 | 是 | 依赖 `GTODO-2026-05-24-036` 的 ProjectScope 归属和 `GTODO-2026-05-24-037` 的意图同步；不得复制 Alembic daemon file monitor。 | 待定 | [global-todo-board.md](global-todo-board.md) |
| GTODO-2026-05-24-029 | 观察中 | observability latency | P3 | `Alembic` / `AlembicAgent` / `AlembicDashboard` / `AlembicTest` | 观察 live process events 是否需要从“批量迟到追加”优化为更细粒度近实时追加，让开发者更快看到 tool / LLM output / reflection 进展；P5 证明无需刷新可恢复，但仍非严格逐条落屏。 | 否 | 不阻塞 `GTODO-2026-05-24-032`；若用户后续要求严格逐条终端式输出，再提升为独立实时性专项。 | 待定 | [workspace-record-map.md](../workspace-record-map.md#todo-records) |
| GTODO-2026-05-24-033 | 待排期 | process events recovery | P2 | `Alembic` / `AlembicDashboard` / `AlembicTest` | `Test-2026-05-24-08` 发现 daemon restart 后旧 job events API 返回 0 条；需要让 retained process events 跨 daemon restart 可恢复，或明确只支持 live memory 并在 UI / API 说明边界。 | 是 | 来源 LOTB-P2 报告；影响 Jobs Timeline REST recovery 可信度，但不阻塞本轮 output completeness 核心展示验收。 | `Alembic` | [llm-output-truncation-bug](../archive/2026-05/llm-output-truncation-bug/) |
| GTODO-2026-05-24-034 | 待排期 | job progress sync | P2 | `Alembic` / `AlembicDashboard` / `AlembicTest` | `Test-2026-05-24-08` 发现 events API 持续增长时 job status/progress 长时间停在 `filling/0%`；需要对齐 session progress、job summary 和 Dashboard active card。 | 是 | 来源 LOTB-P2 报告；影响进度可读性，不影响已验证的 `llm.output` metadata 展示。 | `Alembic` / `AlembicDashboard` | [llm-output-truncation-bug](../archive/2026-05/llm-output-truncation-bug/) |
| GTODO-2026-05-24-035 | 待排期 | provider length fixture | P2 | `AlembicAgent` / `Alembic` / `AlembicTest` | 为 provider `finishReason=length` / `providerOutputTruncated=true` 增加可控 test fixture 或专用 test job，避免真实复测依赖自然触发 provider length。 | 是 | 来源 LOTB-P2 报告；本轮只通过 Dashboard contract / source contract 验证展示路径，未自然触发真实 provider length。 | `AlembicAgent` / `AlembicTest` | [llm-output-truncation-bug](../archive/2026-05/llm-output-truncation-bug/) |

## 已完成 TODO 和历史同步记录

已完成 TODO、旧同步记录和来源归档统一从 [workspace-record-map.md](../workspace-record-map.md#todo-records) 查询。
