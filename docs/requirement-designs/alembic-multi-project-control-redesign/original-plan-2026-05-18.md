# Original Plan: Alembic Multi Project Control Redesign

日期：2026-05-18
状态：原始计划书已确认
维护窗口：AlembicWorkspace

## 用户原始口径

```text
我把alembic-multi-project-control-redesign 删掉了，你按照新的 agents.md 来重新开始Alembic 的多项目需求设计
```

## 当前需求口径

```text
现在需求是 Codex 插件作为入口，AlembicPlugin 从 Codex host agent 当前项目上下文开始项目，默认 Ghost 模式；然后 Alembic 需要通过 Ghost 模式和全局配置来管理这些从插件入口初始化的项目。

这个需求现在是我描述的内容，为了可用性还需要考虑，这个多项目要如何表示，如何切换，切换要对哪些内容进行切换和重连。
```

## 用户确认口径

确认时间：2026-05-18 23:01 CST

- `AlembicPlugin` 不承担多项目切换控制面。对 Plugin 来说，如果 `Alembic` 当前切换的项目不是 Codex host agent 当前项目，Plugin 默认和 Alembic 断开连接或显示 handoff mismatch，不在插件端伪切换到其它项目。
- Dashboard 切换项目的具体操作方式可以在需求设计和代码调研后决定。
- 每个项目都应独立，不能共用 daemon、Ghost dataRoot、jobs、file monitor、internal AI context 或缓存状态。
- 项目删除、移动或不可访问时，可以保留状态，不自动删除。
- `BiliDili` 不进入本需求的默认设计 / 执行范围。

## 总控记录

- 本次从新的 `AGENTS.md` 流程重新开始，不沿用已删除需求目录里的旧需求设计、旧阶段草案或旧派发判断。
- 原始计划书已由用户确认；下一步进入真实代码调研和需求设计文档创建。目标阶段确认和执行窗口派发仍需等待需求设计文档完成。
- 本需求必须按完整功能模块设计，不允许只做抽象接口、空 adapter、空 provider 或没有真实消费方的代码连接。
- 原始计划书确认后，总控需要先分析功能本质、用户场景、完整能力边界和完成定义，再挖掘本 workspace 内 `Alembic` 系列真实代码、文档、测试、构建和发布链路。
- 由于该需求涉及多项目 / 多租户控制、后台进程、项目注册、daemon、Dashboard handoff、Plugin 入口、internal AI 和文件监控归属，确认后需要判断是否联网调研官方文档、成熟项目或业界最佳实践；外部调研只能辅助设计，不能替代本地代码事实。

## 原始目标边界

- 目标对象：`Alembic` 的多项目控制能力。
- 入口边界：Codex 插件是用户进入 Alembic 的第一入口；`AlembicPlugin` 从 Codex host agent 当前项目上下文发起项目初始化。
- 初始化默认：插件入口初始化项目时默认使用 Ghost 模式，不要求把 Alembic 数据写入被扫描项目自身仓库。
- 管理边界：`Alembic` 本体需要通过 Ghost 模式和全局配置管理这些从插件入口初始化的项目，包括项目注册、项目识别、状态查看、选择、启动 / 停止项目运行环境和 Dashboard handoff。
- 运行归属：Plugin、Dashboard、internal AI、file monitor、jobs、dataRoot 和 daemon state 都必须绑定到正确项目，不能在多个项目之间串线。
- 可用性边界：需求设计必须明确“多项目如何表示、如何切换、切换后哪些内容需要切换或重连”。这不是纯内部数据结构问题，必须能被 CLI、Plugin status / handoff 和 Dashboard 清楚表达。
- 多项目表示至少需要考虑：项目名称 / 显示名、projectId、projectRoot、Ghost dataRoot、初始化来源、当前项目标识、最近使用 / 打开状态、daemon / Dashboard / jobs / file monitor / internal AI 状态，以及项目缺失或不可用时的显示。
- 项目切换至少需要考虑：从当前 Codex host agent 项目切到已注册项目、从 Dashboard 项目列表切到目标项目、从 Alembic CLI 指定项目切换或打开项目；切换必须有明确目标，不依赖用户猜路径。
- 切换和重连范围至少需要考虑：当前 project context、daemon 连接、Dashboard URL / API base、JobStore / job stream、file monitor 订阅、internal AI job context、Ghost dataRoot、缓存 / 状态展示、错误与权限状态。
- 安全边界：切换项目不应默认移动正在运行的 jobs，不应把一个项目的 file monitor 或 internal AI 上下文复用到另一个项目；旧项目 daemon 是否继续运行必须有清晰规则。
- Plugin 边界：`AlembicPlugin` 永远只绑定 Codex host agent 当前项目。若 Alembic / Dashboard / CLI 的当前选中项目不是这个 host project，Plugin 默认显示断开、不可用或 handoff mismatch，不自行切换、重连或管理其它项目。
- Dashboard 边界：Dashboard 的切换操作形态可以在需求设计阶段基于真实代码决定，允许跳转目标项目 Dashboard，也允许全局 Dashboard 切换 API target，但必须明确连接和缓存重连规则。
- 项目状态边界：项目缺失、移动、不可访问或 daemon 不可达时，可以保留为 missing / unavailable / disconnected 等状态，由用户显式 clean / unregister，不自动抹掉历史项目。
- 设计必须覆盖跨仓库边界：`AlembicCore`、`Alembic`、`AlembicPlugin`、`AlembicDashboard`、`AlembicAgent`，并判断 `BiliDili` 是否只作为后续真实项目 smoke。
- 当前不沿用旧需求里的阶段、窗口状态、候选派发或旧草案结论。

## 确认结论

- 用户已确认以上原始目标和边界可以作为后续代码调研、需求设计和分阶段确认的依据。
- `agent` 口径已统一为 `host agent`；当前具体指 Codex host agent。
- 下一步允许创建需求设计文档；但目标阶段确认和执行派发仍需等待需求设计文档完成并再次确认。
