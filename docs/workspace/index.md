# AlembicWorkspace 总控索引

更新日期：2026-05-23

本文件是 AlembicWorkspace 的唯一总控入口。`docs/workspace/` 根层级只保留长期规则、长期契约、模板入口、长期记录地图和唯一索引；当前状态、活跃 TODO、测试交流和正在执行的总控计划统一放在 `docs/workspace/current/`；通用模板正文统一保存在 `templates/`；已完成的 workspace 计划进入 `archive/`，单仓库执行记录留在对应 `docs/<Repo>/` 目录，不在这里逐条堆叠。

## 当前总控入口

| 类型 | 文档 | 状态 | 说明 |
| --- | --- | --- | --- |
| 当前状态 | [current/workspace-current-status.md](current/workspace-current-status.md) | 空闲 | 当前没有执行计划，发送窗口为无；历史记录从长期记录地图查询。 |
| 当前短期工作区 | [current/](current/) | 短期入口 | 当前状态、活跃 TODO、测试交流和后续执行计划统一放在这里。 |
| 长期记录地图 | [workspace-record-map.md](workspace-record-map.md) | 长期地图 | 查询历史计划、归档 topic、已完成 TODO、测试历史和证据入口。 |
| 全局职责功能划分长期契约 | [alembic-repository-responsibility-function-boundary-contract.md](alembic-repository-responsibility-function-boundary-contract.md) | 已生效 | 记录 Alembic 系列仓库职责、功能归属判断、跨仓库交界、后续候选和维护规则。 |
| 全局职责功能划分方案 | [alembic-global-responsibility-function-division-scheme.md](alembic-global-responsibility-function-division-scheme.md) | 长期方案 | 基于长期契约和六份 GFBD 证据，设计能力分层、能力流、归属判断步骤、跨仓库连接方式和开发者可读检查卡。 |
| 历史需求目录 | [alembic-multi-project-control-redesign](../requirement-designs/alembic-multi-project-control-redesign/) | 调研完成 | 保存多项目控制重设计的原始计划书、需求设计和代码实现依赖调研。 |
| 需求目标与分阶段确认流程 | [../goal-stage-confirmation/process.md](../goal-stage-confirmation/process.md) | 长期流程 | 规定较大目标必须先在 `docs/requirement-designs/` 完成需求设计，再确认最终目标和分阶段，最后派发窗口。 |
| 需求目标与分阶段确认模板 | [../../templates/goal-stage-confirmation-template.md](../../templates/goal-stage-confirmation-template.md) | 长期模板 | 用于每个新目标创建任务级确认文档，确认前发送名单必须为无。 |
| 需求设计文档模板 | [../../templates/requirement-design-template.md](../../templates/requirement-design-template.md) | 长期模板 | 用于需求目录中的 `requirement-design`，保存于 `docs/requirement-designs/<需求名>/`。 |
| 任务包派发模板 | [../../templates/workspace-task-package-template.md](../../templates/workspace-task-package-template.md) | 长期模板 | 用于 wave 执行计划，把当前阶段主线动作和可关闭 TODO 合并成可验收任务包。 |
| 需求到 Wave 执行流程 | [requirement-to-wave-execution-flow.md](requirement-to-wave-execution-flow.md) | 长期流程 | 固化原始计划书、需求设计、代码依赖调研、目标阶段确认、用户确认、wave 执行计划和提示词发送的成熟路线。 |
| TODO 与空闲窗口调度规则 | [todo-window-scheduling-policy.md](todo-window-scheduling-policy.md) | 长期流程 | 规定通用 TODO 子模式如何服务需求设计、派发计划、验收滚动、主线 / 可并行判断，并避免空闲窗口空转。 |
| Workspace 脚本索引 | [../../scripts/README.md](../../scripts/README.md) | 长期工具入口 | 记录 workspace 总控脚本，包括文档校验、短期区布局、分派覆盖、TODO board、任务包和归档检查。 |
| 全局 TODO 列表 | [current/global-todo-board.md](current/global-todo-board.md) | 维护中 | 记录跨计划、跨窗口、暂未进入当前波次或需要长期追踪的待办；无当前计划时只作为观察账本。 |
| AlembicTest 测试交流文档 | [current/alembic-test-exchange.md](current/alembic-test-exchange.md) | 空闲 | 当前无测试单；历史测试从长期记录地图查询。 |
| AlembicTest 测试交流规则 | [alembic-test-exchange-policy.md](alembic-test-exchange-policy.md) | 长期规则 | 规定总控如何创建测试单、派发 `AlembicTest`、验收回填和处理证据不足。 |
| AlembicTest 测试执行规则 | [../../AlembicTest/docs/testing-operation-policy.md](../../AlembicTest/docs/testing-operation-policy.md) | 长期规则 | 规定总控不直接执行测试操作，真实项目测试、冷启动监控、复现和报告由 `AlembicTest` 承接。 |
| AlembicTest 测试单模板 | [../../templates/alembic-test-handoff-template.md](../../templates/alembic-test-handoff-template.md) | 长期模板 | 用于生成 `docs/workspace/current/alembic-test-exchange.md` 中的统一测试单。 |
| `note_finding` 闭环判定标准 | [alembic-note-finding-closure-standard.md](alembic-note-finding-closure-standard.md) | 长期判定标准 | 固定区分代码连通性、单维度 `note_finding` 证据闭环和完整 cold-start 产候选闭环。 |
| 最终目标与阶段路线图 | [alembic-final-goal-stage-roadmap.md](alembic-final-goal-stage-roadmap.md) | 长期路线图 | 只作为产品方向背景；具体任务仍需创建任务级目标阶段确认文档。 |
| Plugin first 增强契约 | [alembic-plugin-first-enhancement-contract.md](alembic-plugin-first-enhancement-contract.md) | 长期契约 | 规定 `AlembicPlugin` 作为 Codex host agent 入口，`Alembic` 作为本地增强底座，安装 Alembic 后增强 daemon / HTTP / Dashboard / internal AI 能力。 |
| 本地源码 resolver / script 契约 | [alembic-local-source-resolver-script-contract.md](alembic-local-source-resolver-script-contract.md) | 长期契约 | 统一本地源码 resolver 优先级、repo-local script 边界、portable runtime 例外和真实测试项目默认不进入日常流程的规则。 |
| Workspace 文档归档规则 | [workspace-doc-archive-policy.md](workspace-doc-archive-policy.md) | 长期规则 | 规定 `docs/workspace/` 当前入口、历史 wave 归档目录、归档条件和 `scripts/archive-workspace-docs.mjs` 使用方式。 |
| 分阶段迁移指挥长期模板 | [../../templates/phased-migration-command-template.md](../../templates/phased-migration-command-template.md) | 长期模板 | 用于真实代码挖掘、阶段拆分、一波一阶段推进、窗口分派、验收和下一波计划。 |

后续启动新任务时，在 `docs/workspace/current/` 新建 workspace 级总控文档，并把本表当前状态行切到新计划；任务完成并归档后，再切回当前状态文档。

## 窗口覆盖状态

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>无任务 | CCIC 主线已完成并归档；本轮不发送。 |
| `AlembicCore`<br>观察中 | `normalizeLifecycle` additive readiness 已转入 `GTODO-2026-05-23-019`，Plugin / Alembic 主体交流接口后续再慢慢对齐。 |
| `AlembicAgent`<br>无任务 | CCIC-1 已完成；本波不涉及 AlembicAgent runtime、provider 或 tool system。 |
| `AlembicDashboard`<br>无任务 | 用户已确认 Dashboard 不再接入 Plugin；Dashboard 不作为 Plugin 兼容保留理由。 |
| `AlembicPlugin`<br>无任务 | CCIC 主线已完成并归档；本轮不发送。 |
| `AlembicTest`<br>无任务 | 本轮不操作真实项目；只有后续新主线刷新本机 Codex plugin cache、改变 prime/search/cold-start、daemon HTTP contract 或真实项目路径时再创建测试单。 |
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
