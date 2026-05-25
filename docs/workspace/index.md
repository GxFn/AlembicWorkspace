# AlembicWorkspace 总控索引

更新日期：2026-05-25

本文件是 AlembicWorkspace 的唯一总控入口。`docs/workspace/` 根层级只保留长期规则、长期契约、模板入口、长期记录地图和唯一索引；当前状态、活跃 TODO、测试交流和正在执行的总控计划统一放在 `docs/workspace/current/`；通用模板正文统一保存在 `templates/`；已完成的 workspace 计划进入 `archive/`，单仓库执行记录留在对应 `docs/<Repo>/` 目录，不在这里逐条堆叠。

面向用户主要阅读两类文档：

- 最终目标与阶段确认文档：确认要完成什么、完成定义和阶段顺序。
- 当前总控计划 / 窗口分派文档：确认本轮发送给谁、任务包是什么、如何验收。

其它同步索引、格式锚点、Design inbox、测试交流、归档摘要和脚本校验说明默认视为脚本维护或证据入口，不作为日常人工阅读主面。

## 当前总控入口

| 类型 | 文档 | 状态 | 说明 |
| --- | --- | --- | --- |
| 当前计划 | [current/artifact-drawer-parallel-dispatch-2026-05-25.md](current/artifact-drawer-parallel-dispatch-2026-05-25.md) | 并行分派完成：Artifact Drawer 总控验收通过 / LLM Wave 6 已验收 | LLM Wave 6 Test-09 已通过总控验收；`ARTIFACT-DRAWER-2026-05-25` 独立 Dashboard UI 优化提交 `d90f4d8ddde518f6e5db1477668bae13cf894a6a` 已通过总控验收。 |
| 当前状态 | [current/workspace-current-status.md](current/workspace-current-status.md) | 并行分派完成：Artifact Drawer 总控验收通过 / LLM Wave 6 已验收 | 当前窗口状态、发送名单和活跃观察项；LLM 输入优化 Wave 6 与 Artifact Drawer 并行任务均已通过总控验收。 |
| 当前短期工作区 | [current/](current/) | 短期入口 | 当前状态、活跃 TODO、测试交流和后续执行计划统一放在这里。 |
| Multi-root ProjectScope 原始计划书 | [../requirement-designs/multi-root-project-scope/original-plan-2026-05-24.md](../requirement-designs/multi-root-project-scope/original-plan-2026-05-24.md) | 已确认 | 支持“一抽象 Project 对多实体 Folder”，显式绑定多个 folder 后汇总为一个 Alembic 项目。 |
| Multi-root ProjectScope 代码调研 | [../requirement-designs/multi-root-project-scope/code-implementation-dependency-research-2026-05-24.md](../requirement-designs/multi-root-project-scope/code-implementation-dependency-research-2026-05-24.md) | 已完成 | 基于真实代码确认 Core / Alembic / Plugin / Dashboard / Agent 当前单 `projectRoot` 假设和实现依赖链。 |
| Multi-root ProjectScope 需求设计 | [../requirement-designs/multi-root-project-scope/requirement-design-2026-05-24.md](../requirement-designs/multi-root-project-scope/requirement-design-2026-05-24.md) | 已形成 | 设计 Project / Folder / controlRoot / Ghost-only storage 数据模型、职责边界、阶段候选和完成定义。 |
| Multi-root ProjectScope Core contract | [../AlembicCore/multi-root-project-scope-core-contract-2026-05-24.md](../AlembicCore/multi-root-project-scope-core-contract-2026-05-24.md) | 已回填 | `AlembicCore` 提交 `b72390f`，记录 ProjectScope 字段、下游消费建议、验证命令和遗留风险。 |
| LLM 输入优化 Package Runtime Test-09 报告 | [../../AlembicTest/docs/llm-input-package-runtime-integration-2026-05-25.md](../../AlembicTest/docs/llm-input-package-runtime-integration-2026-05-25.md) | 总控验收通过 | `Test-2026-05-25-09 / LLMI-P11-Package-Runtime-Integration` 证明 staged `@alembic/agent` package manifest、pack shasum、public imports、batch read、Observation Ledger 和 LLM input runtime layer 均通过最小 package/runtime probe。 |
| LLM 输入优化 Agent Runtime Package 回填 | [../AlembicAgent/llm-input-optimization-agent-runtime-package-2026-05-25.md](../AlembicAgent/llm-input-optimization-agent-runtime-package-2026-05-25.md) | 总控验收通过 | `LLMI-P10-AGENT-DIST-RUNTIME-PACKAGE` 完成范围、no source commit、验证命令、dist / package artifact 证据、遗留风险和总控验收结论。 |
| LLM 输入优化 Agent 回填 | [../AlembicAgent/llm-input-optimization-agent-correctness-2026-05-25.md](../AlembicAgent/llm-input-optimization-agent-correctness-2026-05-25.md) | 总控验收通过 | `LLMI-P1-AGENT-CORRECTNESS` 完成范围、提交 hash、验证命令、batch read 边界、未做事项、遗留风险和下一步建议。 |
| LLM 输入优化 Agent Input Layering 回填 | [../AlembicAgent/llm-input-optimization-agent-input-layering-2026-05-25.md](../AlembicAgent/llm-input-optimization-agent-input-layering-2026-05-25.md) | 总控代码侧验收通过 | `LLMI-P3-AGENT-INPUT-LAYERING` 完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。 |
| LLM 输入优化 Agent Observation Ledger 回填 | [../AlembicAgent/llm-input-optimization-agent-observation-ledger-2026-05-25.md](../AlembicAgent/llm-input-optimization-agent-observation-ledger-2026-05-25.md) | 总控代码侧验收通过 | `LLMI-P5-AGENT-OBSERVATION-LEDGER` 完成范围、提交 hash、验证命令、验证结果、ledger 边界、遗留风险和下一步建议。 |
| LLM 输入优化 Alembic Artifact 回填 | [../Alembic/llm-input-optimization-artifact-trace-metrics-2026-05-25.md](../Alembic/llm-input-optimization-artifact-trace-metrics-2026-05-25.md) | 总控验收通过 | `LLMI-P7-ALEMBIC-ARTIFACT-TRACE-METRICS` 完成范围、提交 hash、验证命令、artifact / trace / metrics 证据、遗留风险和下一步建议。 |
| Design Handoff Inbox | [current/design-handoff-inbox.md](current/design-handoff-inbox.md) | 维护中 | 总控脚本从 `AlembicDesign/docs/current/workspace-handoff-board.md` 生成；`ARTIFACT-DRAWER-2026-05-25` 已接收进入当前并行分派，`PCVM-2026-05-25` 仍等待总控接收评审。 |
| Artifact Drawer 并行分派 | [current/artifact-drawer-parallel-dispatch-2026-05-25.md](current/artifact-drawer-parallel-dispatch-2026-05-25.md) | 总控验收通过 | `AlembicDashboard` 提交 `d90f4d8ddde518f6e5db1477668bae13cf894a6a`，完成 Timeline artifact detail 双层 drawer stack、窄屏覆盖和返回按钮，并通过总控验收。 |
| Artifact Drawer Dashboard 回填 | [../AlembicDashboard/timeline-artifact-drawer-optimization-dashboard-2026-05-25.md](../AlembicDashboard/timeline-artifact-drawer-optimization-dashboard-2026-05-25.md) | 总控验收通过 | `ARTIFACT-DRAWER-P1-DASHBOARD-DRAWER-STACK` 完成范围、提交 hash、验证命令、DOM 等价视觉证据、遗留风险和总控验收结论。 |
| 长期记录地图 | [workspace-record-map.md](workspace-record-map.md) | 长期地图 | 查询历史计划、归档 topic、已完成 TODO、测试历史和证据入口。 |
| 全局职责功能划分长期契约 | [alembic-repository-responsibility-function-boundary-contract.md](alembic-repository-responsibility-function-boundary-contract.md) | 已生效 | 记录 Alembic 系列仓库职责、功能归属判断、跨仓库交界、后续候选和维护规则。 |
| 全局职责功能划分方案 | [alembic-global-responsibility-function-division-scheme.md](alembic-global-responsibility-function-division-scheme.md) | 长期方案 | 基于长期契约和六份 GFBD 证据，设计能力分层、能力流、归属判断步骤、跨仓库连接方式和开发者可读检查卡。 |
| AlembicDesign 需求设计窗口契约 | [alembic-design-window-contract.md](alembic-design-window-contract.md) | 已生效 | 定义 `AlembicDesign` 作为受总控管理的需求讨论 / 方案设计 / signal 判断窗口，只产出 signal、设计与 handoff board；子仓库已补齐总控能力对齐检查和交接前自检。 |
| 历史需求目录 | [alembic-multi-project-control-redesign](../requirement-designs/alembic-multi-project-control-redesign/) | 调研完成 | 保存多项目控制重设计的原始计划书、需求设计和代码实现依赖调研。 |
| 需求目标与分阶段确认流程 | [../goal-stage-confirmation/process.md](../goal-stage-confirmation/process.md) | 长期流程 | 规定较大目标必须先在 `docs/requirement-designs/` 完成需求设计，再确认最终目标和分阶段，最后派发窗口。 |
| 需求目标与分阶段确认模板 | [../../templates/goal-stage-confirmation-template.md](../../templates/goal-stage-confirmation-template.md) | 长期模板 | 用于每个新目标创建任务级确认文档，确认前发送名单必须为无。 |
| 需求设计文档模板 | [../../templates/requirement-design-template.md](../../templates/requirement-design-template.md) | 长期模板 | 用于需求目录中的 `requirement-design`，保存于 `docs/requirement-designs/<需求名>/`。 |
| Workspace 总控计划模板 | [../../templates/workspace-control-plan-template.md](../../templates/workspace-control-plan-template.md) | 长期模板 | 用于 `docs/workspace/current/` 当前计划，固定人读窗口分派面和脚本同步锚点。 |
| 任务包派发模板 | [../../templates/workspace-task-package-template.md](../../templates/workspace-task-package-template.md) | 长期模板 | 用于 wave 执行计划，把当前阶段主线动作和可关闭 TODO 合并成可验收任务包。 |
| 需求到 Wave 执行流程 | [requirement-to-wave-execution-flow.md](requirement-to-wave-execution-flow.md) | 长期流程 | 固化原始计划书、需求设计、代码依赖调研、目标阶段确认、用户确认、wave 执行计划和提示词发送的成熟路线。 |
| TODO 与空闲窗口调度规则 | [todo-window-scheduling-policy.md](todo-window-scheduling-policy.md) | 长期流程 | 规定通用 TODO 子模式如何服务需求设计、派发计划、验收滚动、主线 / 可并行判断，并避免空闲窗口空转。 |
| Workspace 脚本索引 | [../../scripts/README.md](../../scripts/README.md) | 长期工具入口 | 记录 workspace 总控脚本和脚本可读文档格式；这些内容默认由脚本 / agent 使用，不作为用户日常主文档。 |
| Workspace Skill 资产索引 | [../../skills/README.md](../../skills/README.md) | 试验中 | 当前试验 `dev/alembic-workspace-control/`，把 `AGENTS.md` 中 TODO / Backlog 与窗口分派两块大细则抽成 skill references。 |
| 全局 TODO 列表 | [current/global-todo-board.md](current/global-todo-board.md) | 维护中 | 记录跨计划、跨窗口、暂未进入当前波次或需要长期追踪的待办；无当前计划时只作为观察账本。 |
| 当前测试交流 | [current/alembic-test-exchange.md](current/alembic-test-exchange.md) | Test-09 总控验收通过 | `LLMI-P11-Package-Runtime-Integration` 已回填并通过总控验收，验证 package/runtime 链路消费最新 staged Agent runtime。 |
| AlembicTest 测试交流规则 | [alembic-test-exchange-policy.md](alembic-test-exchange-policy.md) | 长期规则 | 规定总控如何创建测试单、派发 `AlembicTest`、验收回填和处理证据不足。 |
| AlembicTest 测试执行规则 | [../../AlembicTest/docs/testing-operation-policy.md](../../AlembicTest/docs/testing-operation-policy.md) | 长期规则 | 规定总控不直接执行测试操作，真实项目测试、冷启动监控、复现和报告由 `AlembicTest` 承接。 |
| AlembicTest 测试单模板 | [../../templates/alembic-test-handoff-template.md](../../templates/alembic-test-handoff-template.md) | 长期模板 | 用于生成 `docs/workspace/current/alembic-test-exchange.md` 中的统一测试单。 |
| `note_finding` 闭环判定标准 | [alembic-note-finding-closure-standard.md](alembic-note-finding-closure-standard.md) | 长期判定标准 | 固定区分代码连通性、单维度 `note_finding` 证据闭环和完整 cold-start 产候选闭环。 |
| 最终目标与阶段路线图 | [alembic-final-goal-stage-roadmap.md](alembic-final-goal-stage-roadmap.md) | 长期路线图 | 只作为产品方向背景；具体任务仍需创建任务级目标阶段确认文档。 |
| Plugin first 增强契约 | [alembic-plugin-first-enhancement-contract.md](alembic-plugin-first-enhancement-contract.md) | 长期契约 | 规定 `AlembicPlugin` 作为 Codex host agent 入口，`Alembic` 作为本地增强底座，安装 Alembic 后增强 daemon / HTTP / Dashboard / internal AI 能力。 |
| 冷启动上下文社区与工具规划调研 | [alembic-cold-start-context-community-tool-use-research-2026-05-24.md](alembic-cold-start-context-community-tool-use-research-2026-05-24.md) | 已完成 | 聚焦 Alembic 冷启动 / prime 中项目工程信息如何组织给 Agent 使用，重点解释 UA 社区划分、邻居关系、可控批次实现逻辑，并提出 Alembic `ContextCommunity / NeighborContext / ToolUsePlan` 中间层建议。 |
| 本地源码 resolver / script 契约 | [alembic-local-source-resolver-script-contract.md](alembic-local-source-resolver-script-contract.md) | 长期契约 | 统一本地源码 resolver 优先级、repo-local script 边界、portable runtime 例外和真实测试项目默认不进入日常流程的规则。 |
| Workspace 文档归档规则 | [workspace-doc-archive-policy.md](workspace-doc-archive-policy.md) | 长期规则 | 规定 `docs/workspace/` 当前入口、历史 wave 归档目录、归档条件和 `scripts/archive-workspace-docs.mjs` 使用方式。 |
| 分阶段迁移指挥长期模板 | [../../templates/phased-migration-command-template.md](../../templates/phased-migration-command-template.md) | 长期模板 | 用于真实代码挖掘、阶段拆分、一波一阶段推进、窗口分派、验收和下一波计划。 |

后续启动新任务时，在 `docs/workspace/current/` 新建 workspace 级总控文档，并把本表当前状态行切到新计划；任务完成并归档后，再切回当前状态文档。

## 窗口覆盖状态

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | Artifact Drawer 默认不改后端 artifact API；只有 `AlembicDashboard` 回填 API / contract 缺口时再返修。 |
| `AlembicCore`<br>无任务 | 无共享 contract 或 schema 变更。 |
| `AlembicAgent`<br>已完成 | Wave 6A package/runtime producer 已通过总控验收；本轮无返工任务。 |
| `AlembicDashboard`<br>已完成 | `ARTIFACT-DRAWER-P1-DASHBOARD-DRAWER-STACK` 已通过总控验收，提交 `d90f4d8ddde518f6e5db1477668bae13cf894a6a`。 |
| `AlembicPlugin`<br>无任务 | Artifact Drawer 不改变 Codex host-agent route 或 plugin runtime。 |
| `AlembicTest`<br>已完成 | Test-09 package/runtime 集成验证已通过总控验收。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## 状态枚举

任务状态只使用以下枚举：

- `待启动`：任务已分配但尚未开始。
- `执行中`：窗口正在改代码、写文档或运行验证。
- `待验收`：实现已完成，等待总控证据复核或跨仓库消费验证。
- `阻塞`：需要上游提交、接口、权限、依赖或用户决策。
- `已完成`：提交、扫描、验证和回填证据齐全。
- `暂停`：用户或总控明确延后。
- `观察中`：当前无直接改动，但受其它窗口结果影响。
- `无任务`：本轮判断无需行动，并已写明原因。

## 文档命名

- 当前入口：`current/workspace-current-status.md`
- 长期模板：保存在 `templates/<topic>-template.md`，不加日期；`docs/workspace/` 只保留模板入口链接。
- 长期规则 / 契约：`<topic>-policy.md` 或 `<topic>-contract.md`，不加日期。
- workspace 总控计划：`current/<topic>-workspace-plan-YYYY-MM-DD.md`
- 总控状态快照：`current/<topic>-workspace-status-YYYY-MM-DD.md`
- 窗口分派表：`current/<topic>-window-dispatch-YYYY-MM-DD.md`
- 单仓库阶段记录：`<topic>-<repo>-phase-N-YYYY-MM-DD.md`
- 边界或扫描记录：`<topic>-<repo>-boundary-YYYY-MM-DD.md`

文档名使用小写 kebab-case。日期使用执行日 `YYYY-MM-DD`。不要在文档名或正文中写入用户本机绝对路径、API key、token 或其它私密信息。

## 分派模板

给窗口分配任务时，默认使用以下字段：

```text
窗口：
状态：
派发时间（北京时间，YYYY-MM-DD HH:mm CST）：
状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：
任务：
目标：
范围：
禁止事项：
验证命令：
阻塞/依赖：
文档动作：新建 / 更新 / 无需新建
保存位置：
挂载入口：
回填位置：
下一步允许启动：是/否，原因：
执行前置硬规则：先读取目标仓库 AGENTS.md，并明确当前窗口定位 / 仓库职责。
```

任务包派发时，先使用以下字段把主线动作和可关闭 TODO 打包，再落到窗口分派表：

```text
任务包 ID：
窗口：
派发时间（北京时间，YYYY-MM-DD HH:mm CST）：
状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：
阶段目标：
主线动作：
合并 TODO：
明确不包含：
下一处真实阻塞点：
阻塞点之前还能做：
验证命令：
回填要求：
执行前置硬规则：
```

## 窗口覆盖模板

每次跨仓库总控计划必须覆盖所有主要窗口。派发表只保留两列，细节放在表后，避免 `index.md` 和当前计划出现难读宽表。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>状态 |  |
| `AlembicCore`<br>状态 |  |
| `AlembicAgent`<br>状态 |  |
| `AlembicDashboard`<br>状态 |  |
| `AlembicPlugin`<br>状态 |  |
| `AlembicTest`<br>状态 |  |
| `BiliDili`<br>状态 |  |

派发细节用列表记录：派发时间（北京时间）、状态更新时间（北京时间）、文档动作、保存位置、挂载入口、回填位置、验证命令、阻塞 / 依赖。

如果读取代码后发现其它关联窗口、vendor 子仓库、插件资源、runtime 包或发布链路受影响，必须追加到覆盖表中。

## 分派提示词发送规则

- 状态为 `待启动` 或 `执行中`，且有实际任务的窗口，才进入当前可复制提示词发送名单。
- 可复制提示词必须包含 `AGENTS.md` 读取要求和“定位”声明要求；缺任一项时不得发送，先修当前计划或提示词。
- 状态为 `待验收` 的窗口由总控复核，不建议发送领取任务提示词；验收失败并需要窗口返工时，再改为 `待启动` 或 `执行中`。
- 状态为 `阻塞` 的窗口只保留在覆盖表中，不建议发送提示词；解除阻塞后再改为 `待启动` 或 `执行中`。
- 状态为 `观察中` 或 `无任务` 的窗口，只保留在覆盖表中防遗漏；不要建议用户发送提示词，除非后续回填触发了实际任务。
