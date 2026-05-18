# AlembicWorkspace 总控索引

更新日期：2026-05-18

本文件是 AlembicWorkspace 的唯一总控入口。`docs/workspace/` 根层级只保留当前状态、长期规则、长期契约、长期模板和正在执行的总控计划；已完成的 workspace 计划进入 `archive/`，单仓库执行记录留在对应 `docs/<Repo>/` 目录，不在这里逐条堆叠。

## 当前总控入口

| 类型 | 文档 | 状态 | 说明 |
| --- | --- | --- | --- |
| 当前计划 | [alembic-codex-only-host-agent-mode-workspace-plan-2026-05-18.md](alembic-codex-only-host-agent-mode-workspace-plan-2026-05-18.md) | 待验收 | 直接放弃 Alembic 主包多 IDE Agent 默认 / 支持路径，只保留 Codex 插件宿主 Agent 线与 Alembic internal AI 线；`Alembic`、`AlembicPlugin`、`AlembicDashboard` 已完成并回填证据，等待总控复核。 |
| 当前状态 | [workspace-current-status.md](workspace-current-status.md) | 待验收 | 当前无需要发送领取提示词的窗口；三个执行窗口已完成，`AlembicCore`、`AlembicAgent`、`BiliDili` 观察不发。 |
| 本地源码 resolver / script 契约 | [alembic-local-source-resolver-script-contract.md](alembic-local-source-resolver-script-contract.md) | 长期契约 | 统一本地源码 resolver 优先级、repo-local script 边界、portable runtime 例外和 BiliDili 默认不进入日常流程的规则。 |
| Workspace 文档归档规则 | [workspace-doc-archive-policy.md](workspace-doc-archive-policy.md) | 长期规则 | 规定 `docs/workspace/` 当前入口、历史 wave 归档目录、归档条件和 `scripts/archive-workspace-docs.mjs` 使用方式。 |
| 分阶段迁移指挥长期模板 | [phased-migration-command-template.md](phased-migration-command-template.md) | 长期模板 | 用于真实代码挖掘、阶段拆分、一波一阶段推进、窗口分派、验收和下一波计划。 |

后续启动新任务时，在 `docs/workspace/` 新建 workspace 级总控文档，并把本表第一行切到新计划；任务完成并归档后，再切回当前状态文档。

## 历史归档摘要

| 归档主题 | 目录 | 说明 |
| --- | --- | --- |
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
| `Alembic`<br>已完成 | 已删除主包多 IDE Agent 默认 / 支持路径，保留 CLI / daemon / Dashboard / HTTP / internal AI；执行记录见 [../Alembic/alembic-codex-only-internal-ai-main-cleanup-2026-05-18.md](../Alembic/alembic-codex-only-internal-ai-main-cleanup-2026-05-18.md)。 |
| `AlembicPlugin`<br>已完成 | Codex 插件 cold-start / rescan 主路径已切成 Codex 宿主 Agent 线；执行记录见 [../AlembicPlugin/alembic-plugin-codex-host-agent-single-line-2026-05-18.md](../AlembicPlugin/alembic-plugin-codex-host-agent-single-line-2026-05-18.md)。 |
| `AlembicDashboard`<br>已完成 | 已删除可见 IDE / Cursor / VSCode / Copilot 等文案，改成 Codex host agent + Alembic internal AI 两线；执行记录见当前计划回填区。 |
| `AlembicCore`<br>观察中 | 不派发；观察 host-agent contract 是否阻塞 Plugin 收束。 |
| `AlembicAgent`<br>观察中 | 不派发；保留为 Alembic internal AI runtime。 |
| `BiliDili`<br>观察中 | 不派发；必要时只作为只读 smoke 目标。 |

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
