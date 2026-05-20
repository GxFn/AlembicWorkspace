# AlembicWorkspace 总控索引

更新日期：2026-05-20

本文件是 AlembicWorkspace 的唯一总控入口。`docs/workspace/` 根层级只保留当前状态、长期规则、长期契约、长期模板和正在执行的总控计划；已完成的 workspace 计划进入 `archive/`，单仓库执行记录留在对应 `docs/<Repo>/` 目录，不在这里逐条堆叠。

## 当前总控入口

| 类型 | 文档 | 状态 | 说明 |
| --- | --- | --- | --- |
| 当前计划 | [alembic-agent-evidence-recording-phase-chain-workspace-plan-2026-05-20.md](alembic-agent-evidence-recording-phase-chain-workspace-plan-2026-05-20.md) | Wave 9D 阻塞 | `AlembicDashboard` Wave 9F 已通过总控验收；`BiliDili` 真实复测等待用户确认外部 AI 数据发送或替代安全路线。 |
| 当前状态 | [workspace-current-status.md](workspace-current-status.md) | Wave 9D 阻塞 | 当前不发送执行提示词；等待用户确认 BiliDili 真实项目数据发送策略。 |
| 当前需求目录 | [alembic-multi-project-control-redesign](../requirement-designs/alembic-multi-project-control-redesign/) | 调研完成 | 保存本次重新开始的原始计划书、需求设计和代码实现依赖调研。 |
| 需求目标与分阶段确认流程 | [../goal-stage-confirmation/process.md](../goal-stage-confirmation/process.md) | 长期流程 | 规定较大目标必须先在 `docs/requirement-designs/` 完成需求设计，再确认最终目标和分阶段，最后派发窗口。 |
| 需求目标与分阶段确认模板 | [../goal-stage-confirmation/template.md](../goal-stage-confirmation/template.md) | 长期模板 | 用于每个新目标创建任务级确认文档，确认前发送名单必须为无。 |
| 需求设计文档模板 | [requirement-design-template.md](../requirement-designs/requirement-design-template.md) | 长期模板 | 用于需求目录中的 `requirement-design`，保存于 `docs/requirement-designs/<需求名>/`。 |
| 需求到 Wave 执行流程 | [requirement-to-wave-execution-flow.md](requirement-to-wave-execution-flow.md) | 长期流程 | 固化原始计划书、需求设计、代码依赖调研、目标阶段确认、用户确认、wave 执行计划和提示词发送的成熟路线。 |
| TODO 与空闲窗口调度规则 | [todo-window-scheduling-policy.md](todo-window-scheduling-policy.md) | 长期流程 | 规定通用 TODO 子模式如何服务需求设计、派发计划、验收滚动、主线 / 可并行判断，并避免空闲窗口空转。 |
| 最终目标与阶段路线图 | [alembic-final-goal-stage-roadmap.md](alembic-final-goal-stage-roadmap.md) | 长期路线图 | 只作为产品方向背景；具体任务仍需创建任务级目标阶段确认文档。 |
| Plugin first 增强契约 | [alembic-plugin-first-enhancement-contract.md](alembic-plugin-first-enhancement-contract.md) | 长期契约 | 规定 `AlembicPlugin` 作为 Codex host agent 入口，`Alembic` 作为本地增强底座，安装 Alembic 后增强 daemon / HTTP / Dashboard / internal AI 能力。 |
| 本地源码 resolver / script 契约 | [alembic-local-source-resolver-script-contract.md](alembic-local-source-resolver-script-contract.md) | 长期契约 | 统一本地源码 resolver 优先级、repo-local script 边界、portable runtime 例外和 BiliDili 默认不进入日常流程的规则。 |
| Workspace 文档归档规则 | [workspace-doc-archive-policy.md](workspace-doc-archive-policy.md) | 长期规则 | 规定 `docs/workspace/` 当前入口、历史 wave 归档目录、归档条件和 `scripts/archive-workspace-docs.mjs` 使用方式。 |
| 分阶段迁移指挥长期模板 | [phased-migration-command-template.md](phased-migration-command-template.md) | 长期模板 | 用于真实代码挖掘、阶段拆分、一波一阶段推进、窗口分派、验收和下一波计划。 |

后续启动新任务时，在 `docs/workspace/` 新建 workspace 级总控文档，并把本表第一行切到新计划；任务完成并归档后，再切回当前状态文档。

## 历史归档摘要
| 归档主题 | 目录 | 说明 |
| --- | --- | --- |
| `2026-05/github-actions-failure-recovery` | [github-actions-failure-recovery](archive/2026-05/github-actions-failure-recovery/) | 已归档 1 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/dev-link-global-environment` | [dev-link-global-environment](archive/2026-05/dev-link-global-environment/) | 已归档 1 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/init-convergence-contract` | [init-convergence-contract](archive/2026-05/init-convergence-contract/) | 已归档 1 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/plugin-first-enhancement` | [plugin-first-enhancement](archive/2026-05/plugin-first-enhancement/) | 已归档 3 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/codex-only-host-agent-mode` | [codex-only-host-agent-mode](archive/2026-05/codex-only-host-agent-mode/) | 已归档 3 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/module-boundary-foundation` | [module-boundary-foundation](archive/2026-05/module-boundary-foundation/) | 已归档 4 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/multi-project-control` | [multi-project-control](archive/2026-05/multi-project-control/) | 已归档 9 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/facade-readiness` | [facade-readiness](archive/2026-05/facade-readiness/) | 已归档 2 个 workspace 文档；Wave 3B Core facade readiness / consumer replacement。 |
| `2026-05/release-portable-snapshot-closeout` | [release-portable-snapshot-closeout](archive/2026-05/release-portable-snapshot-closeout/) | 已归档 2 个 workspace 文档；release / portable snapshot closeout 与 publish staging。 |
| `2026-05/interface-boundary` | [interface-boundary](archive/2026-05/interface-boundary/) | 已归档 7 个 workspace 文档；接口边界优化与消费层收敛历史计划。 |
| `2026-05/local-source-import-unification` | [local-source-import-unification](archive/2026-05/local-source-import-unification/) | 已归档 2 个 workspace 文档；本地源码引入统一历史计划。 |
| `2026-05/redundant-systems-removal` | [redundant-systems-removal](archive/2026-05/redundant-systems-removal/) | 已归档 2 个 workspace 文档；飞书截屏连带、推荐系统、ReverseGuard 等冗余清理。 |
| `2026-05/feishu-remote-removal` | [feishu-remote-removal](archive/2026-05/feishu-remote-removal/) | 已归档 1 个 workspace 文档；Feishu / Lark remote removal。 |
| `2026-05/agent-extraction` | [agent-extraction](archive/2026-05/agent-extraction/) | 已归档 9 个 workspace 文档；AlembicAgent 抽取和 Plugin agent-free 历史 wave。 |

## 窗口覆盖状态

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicDashboard`<br>已完成 | Wave 9F 已通过总控验收：消费 Alembic Wave 9E 新增 progress freshness 字段，Jobs 页面显示 active task status、event count 和最近 active task update，避免前端仍用旧 job `updatedAt` 误判卡住；提交 `c1aa2c09e6f171192ccfc81a89f392fb5b5c0848`。 |
| `Alembic`<br>已完成 | Wave 9E 已通过总控验收：已修复 job progress stale、cancel / timeout / child-run-error 分类和 efficiency summary payload；提交 `633ed228d1c0ba9cd04ef431dc4aadac18c3ac06`。 |
| `AlembicAgent`<br>已完成 | Wave 9A4 已通过总控验收：提交 `c2d3b5316b28d4d750283c324a2fd2babaa221ce`，L4 memory package、summary validation、typed memory summary、budget hard stop 和 abort 门控已落地。 |
| `BiliDili`<br>阻塞 | Wave 9D：等待用户确认真实项目外部 AI 数据发送或替代安全路线。 |
| `AlembicCore`<br>无任务 | 当前优化属于 Agent runtime / Alembic consumer 状态，不需要 Core contract；若 repair status 下沉为共享 contract，再重新判断。 |
| `AlembicPlugin`<br>无任务 | 当前不涉及 Codex plugin marketplace、MCP skill 或 embedded runtime packaging。 |

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

- 当前入口：`workspace-current-status.md`
- 长期模板：`<topic>-template.md`，不加日期。
- 长期规则 / 契约：`<topic>-policy.md` 或 `<topic>-contract.md`，不加日期。
- workspace 总控计划：`<topic>-workspace-plan-YYYY-MM-DD.md`
- 总控状态快照：`<topic>-workspace-status-YYYY-MM-DD.md`
- 窗口分派表：`<topic>-window-dispatch-YYYY-MM-DD.md`
- 单仓库阶段记录：`<topic>-<repo>-phase-N-YYYY-MM-DD.md`
- 边界或扫描记录：`<topic>-<repo>-boundary-YYYY-MM-DD.md`

文档名使用小写 kebab-case。日期使用执行日 `YYYY-MM-DD`。不要在文档名或正文中写入用户本机绝对路径、API key、token 或其它私密信息。

## 分派模板

给窗口分配任务时，默认使用以下字段：

```text
窗口：
状态：
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
| `BiliDili`<br>状态 |  |

派发细节用列表记录：文档动作、保存位置、挂载入口、回填位置、验证命令、阻塞 / 依赖。

如果读取代码后发现其它关联窗口、vendor 子仓库、插件资源、runtime 包或发布链路受影响，必须追加到覆盖表中。

## 分派提示词发送规则

- 状态为 `待启动` 或 `执行中`，且有实际任务的窗口，才进入当前可复制提示词发送名单。
- 状态为 `待验收` 的窗口由总控复核，不建议发送领取任务提示词；验收失败并需要窗口返工时，再改为 `待启动` 或 `执行中`。
- 状态为 `阻塞` 的窗口只保留在覆盖表中，不建议发送提示词；解除阻塞后再改为 `待启动` 或 `执行中`。
- 状态为 `观察中` 或 `无任务` 的窗口，只保留在覆盖表中防遗漏；不要建议用户发送提示词，除非后续回填触发了实际任务。
