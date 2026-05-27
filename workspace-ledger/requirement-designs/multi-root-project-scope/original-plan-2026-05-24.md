# Original Plan: Multi Root Project Scope

日期：2026-05-24
状态：已确认，进入代码调研与需求设计
维护窗口：AlembicWorkspace

## 用户原始口径

```text
接下来我有几个主线需求，你看下优先级和适合先做的顺序：
1、支持多个目录的项目汇总，比如 Alembic 现在的多个仓库汇总为一个项目；
2、Plugin 的意图同步和意图下面的知识注入与知识检索链路优化和增强；
3、Alembic 对于项目文件的监控，来代替之前的 VSCode 插件模式，支持知识进化逻辑；
4、Plugin 在没有文件监控下的知识进化逻辑
```

总控建议顺序：

1. 多目录项目汇总 / ProjectScope 地基。
2. Plugin 意图同步与意图下知识注入 / 检索。
3. Alembic 文件监控与知识进化。
4. Plugin 无文件监控 fallback 的知识进化。

用户确认：

```text
没问题，计入 TODO，然后开始第一个需求的设计吧
```

## 用户补充口径

```text
我有点累了，需要你更多的帮我思考；最主要的需求是现在 workspace 下面的 Alembic 急需使用自身，但是多文件夹现在无法使用插件
```

总控理解：

- 这不是一个为了“架构完整”而做的抽象 ProjectScope 设计。
- 当前最急迫的真实用户场景是：`AlembicWorkspace` 下面的 Alembic 系列多仓库，需要马上能被 AlembicPlugin 当作一个整体项目使用。
- 用户不希望继续承担大量概念拆分和确认负担；总控需要主动收敛到最小真实闭环，减少开放问题。
- 第一版完成定义必须围绕“Codex 窗口中能用插件访问 Alembic 自身的跨仓库知识”来设计，而不是围绕未来完整多项目平台。

## 用户项目 / 文件夹模型口径

```text
Plugin 在某一个文件夹启动，我们的后台会确认这个文件夹本身为项目（从 Plugin 确认），用户可以选择，主动说明哪些文件夹是同一个项目，来做绑定，用户不讲就算了，我们做的是一个文件夹数组，支持添加；然后 Alembic 主体通过前端或者终端命令来配置多个文件夹；我们说的项目是抽象，文件夹是实体，一对多，现有的多项目切换也是抽象层面的；
```

总控理解：

- `Project` 是抽象边界：知识库、运行数据、prime / search / skill、后续监控与进化归属都挂在 Project 上。
- `Folder` 是实体边界：真实文件系统目录、仓库或源码根，是 Plugin 启动和代码证据定位的物理锚点。
- Project 与 Folder 是一对多：一个 Project 拥有 `folders[]`，每个 folder 保留自己的路径、身份、角色、包含 / 排除规则和证据前缀。
- Plugin 在某个 folder 启动时，只能确认“当前 folder 本身是一个项目入口”；默认生成或使用单 folder Project。
- 多 folder 合并必须来自用户显式绑定；用户不声明同属一个 Project 时，不自动猜测、不自动合并。
- Alembic 主体通过 CLI 或 Dashboard 前端管理 Project 的 folder 数组；Plugin 消费这个绑定结果，不把自己变成项目控制台。
- 既有多项目切换仍是抽象 Project 层面的切换；folder 数组是单个 Project 内部的实体集合。

## 当前需求目标

第一条主线目标是让 Alembic 支持“抽象 Project 拥有多个实体 Folder”的项目模型。

当前示例是 AlembicWorkspace 内多个仓库：

- `Alembic`
- `AlembicCore`
- `AlembicAgent`
- `AlembicDashboard`
- `AlembicPlugin`
- 必要时再通过 `AlembicTest` 做测试验证

这些目录在文件系统上是多个独立仓库 / folder，但在用户显式绑定后，可以在产品语义上汇总为一个更大的 Alembic Project，用于统一知识库、统一检索、统一 prime / shout、统一 project skill export、统一后续文件监控和知识进化归属。

## 最急迫的最小真实闭环

第一版必须优先让 AlembicWorkspace 自用闭环跑通：

1. Plugin 在任一 folder 启动时，能把当前 folder 确认为一个单 folder Project 入口，保持旧单目录项目可用。
2. 用户能通过 Alembic CLI 或 Dashboard 前端显式声明多个 folder 同属一个 Project，并支持向 `folders[]` 添加目录。
3. 用户未声明绑定时，各 folder 仍各自独立，不自动猜测 `AlembicWorkspace` 子仓库是否同属一个项目。
4. 绑定完成后，Codex 当前打开 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard` 或 `AlembicPlugin` 任一 folder 时，Plugin 都能解析到同一个 Project。
5. `alembic_task prime` / Recipe search / Guard / project skill 相关能力使用同一个 Project 级知识库，而不是每个 folder 一套割裂知识。
6. prime 或 search 的返回内容必须保留 folder 级证据，例如能区分证据来自 `AlembicPlugin/lib/...`、`Alembic/lib/...`、`AlembicCore/src/...`。
7. Ghost dataRoot 以 Project 为单位，不污染任何一个源码子仓库，也不把 AlembicWorkspace 根目录变成产品源码仓库。

这条闭环完成后，用户才能在当前 workspace 里真正用 Alembic 帮 Alembic 自己工作。后续文件监控、知识进化和意图链路都应该建立在这个闭环之上。

## 为什么先做它

本需求是后续三条主线的地基：

- Plugin 意图同步和知识检索必须知道当前意图属于哪个抽象 Project，而不是只属于单个 cwd。
- Alembic 文件监控必须知道 watch 哪些 folder、变更归属哪个项目、哪些目录不应纳入。
- Plugin 无文件监控的知识进化必须知道当前 Codex host folder 是否属于一个更大的 Project，以及如何把 diff / task intent 归入同一个项目知识库。
- Project skill runtime export 的多 folder 绑定已在 `GTODO-2026-05-24-030` 中等待，本需求会把它纳入更大的 Project 模型设计。

## 与历史多项目控制需求的区别

历史需求 [alembic-multi-project-control-redesign](../alembic-multi-project-control-redesign/) 关注的是：

- 多个项目如何在 Alembic 本体中注册、列出、切换和隔离。
- Plugin host project 与 Alembic selected project 不一致时如何 mismatch。
- 每个项目的 daemon、Dashboard、jobs、file monitor、internal AI context 如何不串线。

本需求关注的是：

- 一个 Project 内可以包含多个 folder / repo / directory。
- 这些 folder 如何表达身份、角色、包含 / 排除规则、data ownership、knowledge ownership 和验证边界。
- cold-start、rescan、prime、search、skill export、file monitor、evolution 如何消费同一 Project。

两者关系：

- 历史多项目控制解决“多个 Project 之间怎么管理和切换”。
- 本需求解决“一个 Project 里面怎么拥有多个 folder”。
- 后续可以把两者合并成完整项目模型，但第一阶段必须避免把这两个问题混成一个大而散的控制面。

## 原始目标边界

### 目标

- 设计一个可长期维护的 `Project` / `ProjectFolder` 模型，支持一个抽象项目下多个实体目录；代码命名可在调研后确定是否沿用 `ProjectScope` / `ProjectRoot`。
- 支持 AlembicWorkspace 这种多仓库项目作为第一类场景：多个产品仓库共同组成一个 Alembic 项目。
- 保持 `Plugin first, Alembic install enhances`：
  - `AlembicPlugin` 仍是 Codex host agent 当前窗口入口。
  - `Alembic` 仍是本地增强底座，负责 daemon、ProjectRegistry、file monitor、JobStore、Dashboard server、internal AI jobs。
  - 多 folder / multi-root 项目模型需要能被两条路线共同消费。
- Ghost 是唯一标准存储形态，不把 Alembic 运行数据写入各源码仓库；旧 standard 不作为兼容路线或迁移分支，不再支持转回项目目录写入。
- 真实测试项目仍通过 `AlembicTest` 承接；总控不直接操作真实项目。

### 非目标

- 第一阶段不直接实现完整多项目切换 UI。
- 第一阶段不直接实现跨多个 Project 的并发 daemon 管理。
- 第一阶段不把 Plugin 做成项目切换器。
- 第一阶段不要求一次完成文件监控和知识进化；但必须为后续监控和进化留下正确归属模型。
- 第一阶段不把 AlembicWorkspace 根目录本身变成产品源码仓库，也不把子仓库加入 workspace git 跟踪。
- 第一阶段不提供 Ghost 转回 standard / 项目目录写入的操作。
- 第一阶段不改真实测试项目业务结构。

## 初始功能闭环假设

后续需求设计需要验证并细化以下闭环：

1. Plugin 报告当前 folder，后台确认或创建默认单 folder Project。
2. 用户通过 Alembic CLI 或 Dashboard 把多个 folder 显式绑定到同一个 Project。
3. Project 记录多个 folder，每个 folder 有身份、路径、角色、仓库信息、包含 / 排除规则和健康状态。
4. Alembic 的 cold-start / rescan 能按 Project 汇总多个 folder，但保留每条 evidence / sourceRef 属于哪个 folder。
5. Recipe / Guard / search / prime 能基于 Project 返回跨 folder 的知识，同时保留 folder 级证据。
6. project skill export 能把同一个 Project 的 skills 暴露给对应 Codex 可见 folder，且不污染全局 skill。
7. Alembic file monitor 后续可以 watch Project 的多个 folder，把变更归入同一个项目知识库。
8. Plugin 在没有 file monitor 时，可以把当前 Codex host folder 的任务意图 / diff / search 结果归入对应 Project。

## 需要深度代码调研的范围

需求设计前必须基于真实代码挖掘以下链路：

- `AlembicCore`
  - `ProjectRegistry`、`WorkspaceResolver`、project identity、knowledge / recipe / skill path contract、project intelligence / structure / vector / search contract。
- `Alembic`
  - ProjectRegistry 消费、daemon projectRoot、JobStore、cold-start / rescan / bootstrap job、file monitor、Dashboard server、projects CLI / API、Ghost data root。
- `AlembicPlugin`
  - Codex project root resolver、host project alignment、prime / task intent、search、project skill runtime export、resident service request、portable runtime 数据位置。
- `AlembicDashboard`
  - project info / runtime boundary / jobs / candidates / recipes / search 的 API 消费，以及未来多 folder 展示需要哪些 summary。
- `AlembicAgent`
  - internal AI context、tool call context、source refs / evidence refs、multi-root 文件读取与边界限制。
- `AlembicTest`
  - 后续验证如何用 AlembicWorkspace 自身或其它受控项目构造 multi-root smoke；真实项目测试仍由测试窗口执行。

## 初始设计问题

以下问题需要在需求设计和代码调研中给出答案：

- Project 的稳定 id 是由用户命名 / 配置生成，还是由系统生成后允许用户重命名？
- folder 可以是 git repo、普通目录、workspace 根、包目录，还是必须是源码仓库根？
- folder 是否需要 role，例如 `core`、`plugin`、`dashboard`、`agent`、`test`、`docs`、`fixture`？
- folder 绑定关系的 source of truth 存在哪里：Alembic ProjectRegistry、Ghost dataRoot、workspace-local config，还是组合方案？
- Project 的 Ghost dataRoot 存在哪里？是否继续按 projectId 写入 `~/.asd/workspaces/<projectId>`？
- 单 folder 项目如何在新逻辑下直接成为 Ghost-only Project，且不保留 standard 分叉？
- Codex 当前只打开一个 folder 时，Plugin 如何从 Alembic 或本地配置发现它属于更大的 Project？
- 如果多个 Codex 窗口分别打开同一 Project 的不同 folder，它们是否共享同一个 project knowledge / skills / search index？
- sourceRef / evidenceRef 如何表达 folder：只写相对路径是否足够，还是需要 `{ folderId, path, line }`？
- cold-start 维度分析是跨 folder 汇总跑，还是按 folder 分块后汇总？
- file monitor 后续 watch 多 folder 时如何避免 vendor / build / test tmp 噪音？
- Dashboard 第一版是否需要展示 Project folder map，还是只在 API / 状态里表达？

## 推荐第一阶段完成定义

若用户确认本原始计划，第一阶段需求设计应以“设计 + 代码事实”为目标，不直接派发实现：

- 写清 Project / ProjectFolder 概念和数据模型。
- 写清 Project 与 Folder 的一对多关系，以及默认单 folder Project 与用户显式绑定的行为。
- 写清单 folder Project 统一 Ghost-only 的行为。
- 写清 AlembicWorkspace 多仓库作为一个项目的目标闭环。
- 写清 Plugin / Alembic / Core / Dashboard / Agent / Test 的职责边界。
- 写清后续阶段的 producer / consumer 顺序。
- 把 `GTODO-2026-05-24-030` 与本需求合并考虑。
- 形成正式 `requirement-design-2026-05-24.md` 和代码实现依赖调研附件。

用户疲劳场景下，总控应减少开放问题；默认采用以下判断进入设计，除非用户明确否定：

- 需求名继续使用 `multi-root-project-scope`。
- 第一版以 AlembicWorkspace 自用作为硬门禁。
- 第一版优先实现“单 folder 默认 project + 用户显式 folder 绑定 + shared dataRoot / knowledge + Plugin 可用”，不把 Dashboard 完整多项目切换 UI、文件监控和完整进化一起塞进第一波实现。
- 历史多项目控制文档只作为背景，不重开完整项目切换主线。

## 当前确认请求

当前只需要用户确认一个问题：

- 是否接受“一抽象 Project 对多实体 Folder；Plugin 默认确认当前 folder 的单 folder Project；只有用户通过 Alembic CLI / Dashboard 显式绑定时，多个 folder 才归入同一 Project；既有多项目切换保持在 Project 层”作为后续需求设计的核心模型，并继续以 AlembicWorkspace 自用闭环作为第一版硬门禁？

用户已确认：

```text
可以包含，可能需要用特别字段吧，因为不能放在数组里；可以；可以；
```

## Ghost 模式补充口径

用户补充：

```text
Ghost 才应该是默认的形态，旧的标准把所有文件都放在真实项目目录下的做法被抛弃；把 Ghost 模式做成标准模式，不再支持转回项目目录的操作，避免与多文件夹冲突；
```

总控理解：

- 对 multi-root ProjectScope 来说，Project dataRoot 不能落在任一源码 folder 内，否则会天然偏向某个 folder 并污染源码仓库。
- 新 ProjectScope 的标准形态就是 Ghost dataRoot：Project 级运行数据、知识库、jobs、reports、skills receipts 等写入 Project 级 Ghost 空间。
- 旧 `standard` 不作为新 ProjectScope 的兼容目标、迁移分支或可读写路线。
- 后续实现不得提供“从 Ghost 转回项目目录写入”的产品操作、CLI 操作或 Dashboard 操作。
- 单 folder 自洽路线也必须使用 Ghost，不保留 standard 降级。

确认结论：

- `AlembicWorkspace` 根目录可以作为当前 Project 的控制 / 协作入口，但不放进源码 `folders[]`；后续需求设计用 `controlRoot`、`coordinationRoot` 或等价特别字段表达。
- 第一版可以 CLI 优先，Dashboard 只做最小展示 / 添加入口。
- Plugin 在没有本地 Alembic 增强底座时，继续退回单 folder Project，不猜测 multi-folder 绑定。
- Ghost 是新标准，不再支持转回项目目录写入；旧 standard 不保留兼容 / 迁移语义，避免形成降级和分叉。
- `folders[]` 只放真实需要参与源码扫描、知识生产、search、prime、skill export 和后续文件监控的实体 folder，例如 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`。
- 第一版绑定入口可以先以 CLI 为主，Dashboard 做最小展示 / 添加能力。
- Plugin 无法连接 Alembic 主体时，不猜多 folder，不报错阻断，继续使用当前 folder 的单 folder Project；只有连接到 Alembic 并读到绑定关系时才进入多 folder Project。

总控下一步进入真实代码调研和正式需求设计文档。
