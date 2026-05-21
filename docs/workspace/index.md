# AlembicWorkspace 总控索引

更新日期：2026-05-21

本文件是 AlembicWorkspace 的唯一总控入口。`docs/workspace/` 根层级只保留当前状态、长期规则、长期契约、模板入口和正在执行的总控计划；通用模板正文统一保存在 `templates/`；已完成的 workspace 计划进入 `archive/`，单仓库执行记录留在对应 `docs/<Repo>/` 目录，不在这里逐条堆叠。

## 当前总控入口

| 类型 | 文档 | 状态 | 说明 |
| --- | --- | --- | --- |
| 当前计划 | [prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](prime-immediate-receipt-shout-workspace-plan-2026-05-21.md) | AlembicPlugin 待启动 | 用户确认 `prime` 后的知识呐喊必须发生在 Codex 接收 prime 后、继续任务前；本轮只派发 `AlembicPlugin` 强化 hostResponse / shoutInstruction / Skill 时序契约。 |
| 当前状态 | [workspace-current-status.md](workspace-current-status.md) | AlembicPlugin 待启动 | `AlembicPlugin` service request 边界和 `AlembicTest` BiliDili 复测均已收口；当前主线切到 prime immediate receipt shout，发送窗口为 `AlembicPlugin`。 |
| 当前测试结果 | [alembic-test-exchange.md](alembic-test-exchange.md) | 已完成，当前无待发测试 | Test-2026-05-21-02：BiliDili prime shout、serviceBoundary、Codex 知识呐喊和 BiliDili git 干净状态均通过；`AlembicTest` 封口提交 `af0430ad69b4da50469eeaded8caa77c59e996e5`。 |
| 上一完成计划 | [alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md) | 已完成 | 用户确认 Alembic 应作为常驻服务由 Plugin 按需请求，不做 MCP tool ownership bridge；Plugin service boundary 与 BiliDili 复测均已完成。 |
| 上一收口计划 | [bilidili-prime-shout-mcp-bridge-repair-wave-2026-05-21.md](bilidili-prime-shout-mcp-bridge-repair-wave-2026-05-21.md) | 已收口 | `Alembic` 已补齐 `/api/v1/mcp/call` 兼容 bridge，但不再作为 Codex-facing prime 主路径。 |
| 前序完成计划 | [alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md](alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md) | 已完成 | V1 `prime -> Codex 自主呐喊` 最小闭环已由 `AlembicPlugin` 回填并通过总控验收。 |
| 上一测试线计划 | [alembic-agent-evidence-recording-phase-chain-workspace-plan-2026-05-20.md](alembic-agent-evidence-recording-phase-chain-workspace-plan-2026-05-20.md) | 测试持续运行 | `AlembicDashboard` Wave 9F 已通过总控验收；既有真实项目复测由 `AlembicTest` 按测试线继续回填，总控当前不直接关注。 |
| 当前需求目录 | [alembic-multi-project-control-redesign](../requirement-designs/alembic-multi-project-control-redesign/) | 调研完成 | 保存本次重新开始的原始计划书、需求设计和代码实现依赖调研。 |
| 需求目标与分阶段确认流程 | [../goal-stage-confirmation/process.md](../goal-stage-confirmation/process.md) | 长期流程 | 规定较大目标必须先在 `docs/requirement-designs/` 完成需求设计，再确认最终目标和分阶段，最后派发窗口。 |
| 需求目标与分阶段确认模板 | [../../templates/goal-stage-confirmation-template.md](../../templates/goal-stage-confirmation-template.md) | 长期模板 | 用于每个新目标创建任务级确认文档，确认前发送名单必须为无。 |
| 需求设计文档模板 | [../../templates/requirement-design-template.md](../../templates/requirement-design-template.md) | 长期模板 | 用于需求目录中的 `requirement-design`，保存于 `docs/requirement-designs/<需求名>/`。 |
| 需求到 Wave 执行流程 | [requirement-to-wave-execution-flow.md](requirement-to-wave-execution-flow.md) | 长期流程 | 固化原始计划书、需求设计、代码依赖调研、目标阶段确认、用户确认、wave 执行计划和提示词发送的成熟路线。 |
| TODO 与空闲窗口调度规则 | [todo-window-scheduling-policy.md](todo-window-scheduling-policy.md) | 长期流程 | 规定通用 TODO 子模式如何服务需求设计、派发计划、验收滚动、主线 / 可并行判断，并避免空闲窗口空转。 |
| AlembicTest 测试交流文档 | [alembic-test-exchange.md](alembic-test-exchange.md) | 已完成，当前无待发测试 | Test-2026-05-21-02 已通过并完成 `AlembicTest` 封口提交；下一轮等 `AlembicPlugin` 完成 immediate receipt shout 后再创建新测试单。 |
| AlembicTest 测试交流规则 | [alembic-test-exchange-policy.md](alembic-test-exchange-policy.md) | 长期规则 | 规定总控如何创建测试单、派发 `AlembicTest`、验收回填和处理证据不足。 |
| AlembicTest 测试执行规则 | [../../AlembicTest/docs/testing-operation-policy.md](../../AlembicTest/docs/testing-operation-policy.md) | 长期规则 | 规定总控不直接执行测试操作，真实项目测试、冷启动监控、复现和报告由 `AlembicTest` 承接。 |
| AlembicTest 测试单模板 | [../../templates/alembic-test-handoff-template.md](../../templates/alembic-test-handoff-template.md) | 长期模板 | 用于生成 `docs/workspace/alembic-test-exchange.md` 中的统一测试单。 |
| `note_finding` 闭环判定记录 | [alembic-note-finding-closure-standard-2026-05-21.md](alembic-note-finding-closure-standard-2026-05-21.md) | 当前判定标准 | 固定区分代码连通性、单维度 `note_finding` 证据闭环和完整 cold-start 产候选闭环，避免总控口径反复。 |
| 最终目标与阶段路线图 | [alembic-final-goal-stage-roadmap.md](alembic-final-goal-stage-roadmap.md) | 长期路线图 | 只作为产品方向背景；具体任务仍需创建任务级目标阶段确认文档。 |
| Plugin first 增强契约 | [alembic-plugin-first-enhancement-contract.md](alembic-plugin-first-enhancement-contract.md) | 长期契约 | 规定 `AlembicPlugin` 作为 Codex host agent 入口，`Alembic` 作为本地增强底座，安装 Alembic 后增强 daemon / HTTP / Dashboard / internal AI 能力。 |
| 本地源码 resolver / script 契约 | [alembic-local-source-resolver-script-contract.md](alembic-local-source-resolver-script-contract.md) | 长期契约 | 统一本地源码 resolver 优先级、repo-local script 边界、portable runtime 例外和真实测试项目默认不进入日常流程的规则。 |
| Workspace 文档归档规则 | [workspace-doc-archive-policy.md](workspace-doc-archive-policy.md) | 长期规则 | 规定 `docs/workspace/` 当前入口、历史 wave 归档目录、归档条件和 `scripts/archive-workspace-docs.mjs` 使用方式。 |
| 分阶段迁移指挥长期模板 | [../../templates/phased-migration-command-template.md](../../templates/phased-migration-command-template.md) | 长期模板 | 用于真实代码挖掘、阶段拆分、一波一阶段推进、窗口分派、验收和下一波计划。 |

后续启动新任务时，在 `docs/workspace/` 新建 workspace 级总控文档，并把本表第一行切到新计划；任务完成并归档后，再切回当前状态文档。

## 历史归档摘要
| 归档主题 | 目录 | 说明 |
| --- | --- | --- |
| `2026-05/github-actions-failure-recovery` | [github-actions-failure-recovery](archive/2026-05/github-actions-failure-recovery/) | 已归档 1 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/agent-efficiency-observability` | [agent-efficiency-observability](archive/2026-05/agent-efficiency-observability/) | 已归档 1 个 workspace 文档；冷启动效率、job 状态和 observability 历史计划，当前只保留目录入口。 |
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
| `AlembicPlugin`<br>待启动 | 当前计划 SHOUT-1/2：强化 `primeKnowledgeMaterial.hostResponse`、`shoutInstruction` 和 Alembic Codex Skill，让 Codex 在 prime 后立即做开发者可见知识接收呐喊，再继续任务。 |
| `AlembicTest`<br>阻塞 | 暂不发送；等 `AlembicPlugin` 提交 hash、runtime artifact 和总控验收后，再创建 BiliDili 真实项目复测单。 |
| `Alembic`<br>观察中 | daemon `/api/v1/mcp/call` 兼容 bridge 已完成；当前不承接 Codex-facing prime ownership，后续作为 resident service 被请求。 |
| `AlembicCore`<br>观察中 | 本轮暂无共享层下沉证据；如 Plugin 回填证明存在真实双向消费方，再评估共享 contract。 |
| `AlembicAgent`<br>无任务 | 当前是 Codex host agent / Plugin Skill 行为，不涉及 internal AI runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及 Dashboard UI。 |

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
- 长期模板：保存在 `templates/<topic>-template.md`，不加日期；`docs/workspace/` 只保留模板入口链接。
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
| `AlembicTest`<br>状态 |  |

派发细节用列表记录：文档动作、保存位置、挂载入口、回填位置、验证命令、阻塞 / 依赖。

如果读取代码后发现其它关联窗口、vendor 子仓库、插件资源、runtime 包或发布链路受影响，必须追加到覆盖表中。

## 分派提示词发送规则

- 状态为 `待启动` 或 `执行中`，且有实际任务的窗口，才进入当前可复制提示词发送名单。
- 状态为 `待验收` 的窗口由总控复核，不建议发送领取任务提示词；验收失败并需要窗口返工时，再改为 `待启动` 或 `执行中`。
- 状态为 `阻塞` 的窗口只保留在覆盖表中，不建议发送提示词；解除阻塞后再改为 `待启动` 或 `执行中`。
- 状态为 `观察中` 或 `无任务` 的窗口，只保留在覆盖表中防遗漏；不要建议用户发送提示词，除非后续回填触发了实际任务。
