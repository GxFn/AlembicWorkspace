# Multi Root Project Scope Goal Stage Confirmation

状态：已确认，进入第一波执行计划
维护窗口：AlembicWorkspace
创建时间：2026-05-24 22:03 CST

## 用户原始目标

```text
支持多个目录的项目汇总，比如 Alembic 现在的多个仓库汇总为一个项目。

Plugin 在某一个文件夹启动，我们的后台会确认这个文件夹本身为项目（从 Plugin 确认），用户可以选择，主动说明哪些文件夹是同一个项目，来做绑定，用户不讲就算了，我们做的是一个文件夹数组，支持添加；然后 Alembic 主体通过前端或者终端命令来配置多个文件夹；我们说的项目是抽象，文件夹是实体，一对多，现有的多项目切换也是抽象层面的；
```

补充确认：

- `AlembicWorkspace` 根目录可以包含在项目语义里，但需要特殊字段，不能放进源码 `folders[]`。
- 第一版 CLI 优先，Dashboard 做最小展示 / 添加即可。
- Plugin 没有本地 Alembic 增强底座时，继续单 folder Project 自洽。
- Ghost 是新标准形态；旧 standard 把运行文件放入真实项目目录的做法被抛弃，不再支持转回项目目录写入。
- 第一波只启动 `AlembicCore`；第一版暂不做 folder remove / disable，只做 add / list / resolve。
- standard 模式不做兼容，按照新逻辑做一致性闭环，不做降级和分叉。

## 总控理解

- 目标：让一个抽象 Alembic Project 拥有多个实体 Folder；第一版以 `AlembicWorkspace` 自用为硬门禁。
- 关键约束：Project 是抽象，Folder 是实体；多 folder 绑定必须由用户显式声明；Plugin 不做项目控制台，只消费 Alembic 生产的 ProjectScope；Project dataRoot 固定使用 Ghost 标准；standard 不再作为兼容分支。
- 不能偏离的边界：不把 workspace 根目录混入源码 folders；不把 Dashboard localStorage custom folder scan 当持久绑定；不把 Plugin 做成独立多项目控制面；不提供 Ghost 转回 standard / 项目目录写入的操作；不为 standard 维护降级和分叉。
- 当前不确定点：无；folder remove / disable 第一版不做。

## 前置需求设计

- 原始计划书：[../../requirement-designs/multi-root-project-scope/original-plan-2026-05-24.md](../../../../requirement-designs/multi-root-project-scope/original-plan-2026-05-24.md)
- 需求设计文档：[../../requirement-designs/multi-root-project-scope/requirement-design-2026-05-24.md](../../../../requirement-designs/multi-root-project-scope/requirement-design-2026-05-24.md)
- 代码实现依赖调研：[../../requirement-designs/multi-root-project-scope/code-implementation-dependency-research-2026-05-24.md](../../../../requirement-designs/multi-root-project-scope/code-implementation-dependency-research-2026-05-24.md)
- 调研结论：现有代码从 Core registry 到 Alembic daemon、Plugin MCP、Dashboard API、Agent tools 都是单 `projectRoot`；必须先下沉 ProjectScope contract，再由 Alembic 生产，Plugin / Dashboard / Agent 消费。
- 当前已有能力：Ghost dataRoot、ProjectRegistry v1、WorkspaceResolver、Alembic projects snapshot、resident service、Plugin prime/search、project skill runtime export、Dashboard project status、Agent 单 root tool context。
- 主要缺口：Project / Folder 一对多数据模型、folder -> project resolution、controlRoot、Ghost-only ProjectScope storage、multi-folder cold-start / search / prime 归属、multi-target project skill export。
- 功能闭环：用户绑定 folders → Alembic 持久化 ProjectScope → daemon / health 输出 ProjectScope → Plugin 从当前 folder 解析到 Project → cold-start/search/prime/skill 使用同一 Project dataRoot。
- 生产方 / 消费方：`AlembicCore` 是 contract 生产方；`Alembic` 是本地 runtime / API 生产方；`AlembicPlugin` / `AlembicDashboard` / `AlembicAgent` 是消费方；`AlembicTest` 做 smoke。
- 本确认文档对需求设计文档的调整：用户已确认阶段路线；同时确认 standard 不做兼容 / 迁移 / 降级分叉，第一波直接按 Ghost-only ProjectScope 做一致性闭环。

## 最终完成定义

- 用户场景完成：用户能把 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 显式绑定为同一抽象 Project，并把 `AlembicWorkspace` 根目录作为 `controlRoot`。
- 功能 / 边界完成：未绑定 folder 保持单 folder Project；绑定 folder 在任一 Codex 窗口都能解析到同一 Project；Plugin 没有 Alembic 时使用 single-folder baseline。
- 输入输出和状态变化完成：ProjectRegistry 保存 ProjectDescriptor、folders、controlRoot、Ghost dataRoot；HTTP / daemon health / Plugin status 可读出同一 ProjectScope；standard 不进入新 ProjectScope。
- 跨仓库消费完成：Alembic cold-start / search / prime / project skill 能消费 ProjectScope；Dashboard 能最小展示 / 添加；Agent 不越权开放多 root tools。
- 删除 / 保留完成：单 folder API 进入同一 Ghost-only ProjectScope 语义；不复用 Dashboard custom folder localStorage 作为 source of truth；移除或封禁 Ghost 转回项目目录写入的产品入口；不维护 standard 降级分叉。
- 文档和证据完成：每波回填代码证据、提交 hash、验证命令；完成后归档到 workspace record map。
- 验证完成：targeted 单测 / check 通过；AlembicTest 以 AlembicWorkspace 自身做 multi-root smoke，通过 prime/search/skill 基本链路。

## 非目标

- 不做完整多项目切换 UI 重设计。
- 不做跨多个 Project 并发 daemon 管理。
- 不把 Plugin 做成项目控制器。
- 不在第一版完成完整 file monitor 和 knowledge evolution。
- 不把 AlembicWorkspace 根目录当源码 folder 扫描。
- 不支持 Ghost 转回 standard / 项目目录写入。
- 不改真实测试项目业务源码。
- 不做抽象占位：任何新增 contract 都必须被至少一个后续消费窗口真实消费。

## 影响范围

最终覆盖窗口：

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>等待上游 | 消费 Core contract，生产 CLI/API/daemon health/ProjectRuntime/cold-start 多 folder 能力。 |
| `AlembicCore`<br>待启动 | 生产 ProjectScope contract、registry v2、Ghost-only storage contract、folder add/list/resolve contract、sourceRef 结构建议。 |
| `AlembicAgent`<br>观察中 | 第一版保持单 root tool context；后续按 per-folder scan 或 allowedFolders contract 消费。 |
| `AlembicDashboard`<br>等待上游 | 消费 Alembic API，做 ProjectScope 最小展示 / add folder。 |
| `AlembicPlugin`<br>等待上游 | 消费 Alembic resident ProjectScope；没有 resident 绑定时保持 single-folder 自洽路线，更新 prime/search/skill scope。 |
| `AlembicTest`<br>等待实现 | 用 AlembicWorkspace 自身做 multi-root smoke 和证据回填。 |

补充说明：

- 新发现的关联仓库 / vendor / artifact：无。
- 当前不纳入原因：真实测试项目只通过 `AlembicTest` 验证，不作为产品实现窗口。

## 依赖链判断

| 上游产出 | 生产窗口 | 消费窗口 | 派发判断 |
| --- | --- | --- | --- |
| ProjectDescriptor / ProjectFolder / controlRoot / resolution contract | `AlembicCore` | `Alembic` / `AlembicPlugin` / `AlembicDashboard` / `AlembicAgent` | 必须第一波先做，未完成前下游不派发实现。 |
| CLI/API/daemon health ProjectScope producer | `Alembic` | `AlembicPlugin` / `AlembicDashboard` / `AlembicTest` | 等 Core contract 后派发。 |
| current folder -> ProjectScope resident resolution | `AlembicPlugin` | Codex prime/search/skill | 等 Alembic health / resident status 后派发。 |
| multi-folder cold-start/search source evidence | `Alembic` / `AlembicCore` / `AlembicAgent` | `AlembicPlugin` / `AlembicTest` | 等 registry/API 基础后派发。 |
| ProjectScope UI minimal list/add | `AlembicDashboard` | 用户 / `AlembicTest` | 等 Alembic API 后派发。 |
| multi-root smoke | `AlembicTest` | 总控验收 | 等实现提交后派发。 |

原则：

- 上游 contract / API / artifact / schema / evidence 未完成前，下游只能是 `阻塞` 或 `观察中`。
- 不允许下游窗口猜字段、复制临时 contract 或提前做 resident 不可用时的多 folder 路线。

## 阶段计划

| 阶段 | 目标 | 前置条件 | 完成标准 | 当前可派发窗口 | 不派发窗口 |
| --- | --- | --- | --- | --- | --- |
| 1 | Core ProjectScope contract | 已确认 | Core 能表达 Project / Folder / controlRoot；单 folder 与 multi-folder 都走同一 Ghost-only storage；不保留 standard 分叉 | `AlembicCore` | 其它窗口观察 |
| 2 | Alembic producer | 阶段 1 提交 hash 和 contract 证据 | CLI/API/daemon health 能 list/add folders 并输出 ProjectScope | `Alembic` | Plugin/Dashboard 等待 API |
| 3 | Plugin consumer | 阶段 2 提交 hash 和 health contract | Plugin 从当前 folder 解析 ProjectScope，resident 不可用时使用 single-folder baseline | `AlembicPlugin` | Dashboard/Test 等待消费面 |
| 4 | multi-folder cold-start/search/prime | 阶段 2/3 基础闭合 | AlembicWorkspace 多 repo 可生成/检索/prime 同一 Project 知识 | `Alembic` / `AlembicCore` / `AlembicPlugin` / `AlembicAgent` | Dashboard 可观察 |
| 5 | Dashboard minimal + skill multi-target | 核心 project scope 可消费 | UI 可 list/add folder；project skill export 支持多 target | `AlembicDashboard` / `AlembicPlugin` / `AlembicCore` | Test 等待 |
| 6 | Smoke / 归档 | 实现窗口完成 | AlembicTest smoke 通过；总控验收归档 | `AlembicTest` / `AlembicWorkspace` | 产品窗口按缺口返修 |

## 当前阶段判断

- 当前阶段：已确认，进入第一波执行计划。
- 为什么先做这一阶段：所有下游实现都依赖 Core ProjectScope contract；用户已确认第一波只启动 `AlembicCore`。
- 为什么不先做其它阶段：所有下游实现都依赖 Core ProjectScope contract；提前做 Alembic / Plugin / Dashboard 会让下游猜字段。
- 本阶段形成的功能闭环：确认后先建立可被下游真实消费的 Project / Folder 合同。
- 下一处真实阻塞点：Core contract 未完成前，没有稳定 ProjectScope 给 Alembic 和 Plugin 使用。
- 阻塞点之前还能一波完成的主线动作：Core 可同时完成 registry v2 schema、Ghost-only ProjectScope storage、single-folder 同逻辑 resolution、folder add/list/resolve contract、WorkspaceResolver facts extension、runtime contract types、sourceRef 结构建议和 targeted tests。
- 第一波启动窗口：`AlembicCore`。
- 等待窗口：`Alembic`、`AlembicPlugin`、`AlembicDashboard`、`AlembicAgent`、`AlembicTest`。
- 是否需要新建 wave 执行计划：是，已进入下一阶段。

## 第一波任务包候选

用户已确认，下一步复制到 wave 执行计划。

- 下一处真实阻塞点：Core 没有 ProjectScope 合同。
- 阻塞点之前还能做：Core contract、registry v2 facts、resolver facts、daemon/shared types、sourceRef 建议、unit tests。

| 任务包 ID | 窗口 | 阶段目标 | 主线动作 | 可合并 TODO | 明确不包含 | 阻塞 / 依赖 | 验证命令 | 回填要求 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MRPS-P1-CORE | `AlembicCore` | ProjectScope contract | 新增 ProjectDescriptor / ProjectFolder / controlRoot；升级 registry v2；新 ProjectScope 固定 Ghost storage；封禁新入口转回 project-root 写入；不保留 standard 兼容 / 迁移 / 降级分叉；单 folder 与 multi-folder 走同一 ProjectScope；扩展 WorkspaceResolver facts；更新 runtime/resident shared contracts；提供 sourceRef folder metadata 建议 | `GTODO-2026-05-24-030` 的 projectScopeId / skill roots contract 只做 Core 数据结构预留 | 不实现 Alembic CLI/API、不改 Plugin/Dashboard、不做 file monitor；不做 folder remove / disable | 已确认 | Core targeted unit / typecheck / lint 按仓库规则 | 提交 hash、修改范围、验证命令、旧参数映射风险、下游字段说明 |

## 验证策略

- 每波最低验证：目标仓库 targeted unit / typecheck / lint；`git diff --check`。
- 阶段完成验证：
  - 阶段 1：Core registry v2 / 旧 projectRoot 参数映射 tests。
  - 阶段 2：Alembic CLI/API targeted tests，daemon health contract fixture。
  - 阶段 3：Plugin single-folder baseline + resident scope tests。
  - 阶段 4：multi-folder cold-start/search/prime targeted tests。
  - 阶段 5：Dashboard check + project skill export tests。
- 功能完整性验收：
  - 真实入口：CLI / Dashboard add folder，Plugin prime/search。
  - 真实数据来源：ProjectRegistry v2 + Project dataRoot。
  - 状态 / 数据变化：ProjectScope folders/controlRoot 持久化，health / status 可见。
  - 真实消费方：Plugin prime/search/skill，Dashboard project UI。
  - 错误 / 边界路径：未绑定 folder single-project baseline；resident unavailable single-folder route；missing folder status。
  - 用户可执行验证：在 AlembicWorkspace 任一子仓库打开 Codex，prime 能拿到同一 Project 知识。
  - 若发现最小实现：补齐 wave，不归档。
- 稳定面统一验收：Workspace 文档校验、子仓库 clean status、提交 hash。
- 真实项目 smoke 触发条件：实现进入阶段 4 后由 `AlembicTest` 对 AlembicWorkspace 自身执行。

## 风险与确认问题

- 风险：Core contract 一旦命名错误，会导致所有下游返工；第一波必须小心把旧 `projectRoot` 参数映射到新 ProjectScope 语义。
- 风险：Ghost 从可选模式变成唯一标准后，要避免残留 standard 降级分叉；旧 standard 不作为本主线兼容目标。
- 风险：multi-folder cold-start 可能耗时变长；执行 wave 需要 test mode / targeted 参数。
- 风险：project skill 多 target 写 `.agents/skills` 需要用户授权和 managed marker，不能默认覆盖用户内容。
- 用户已确认：第一波只发送 `AlembicCore`；folder remove / disable 第一版不做；standard 不做兼容，统一 Ghost-only 逻辑闭环。
- 不明确时禁止派发：已解除。
- 当前派发状态：进入 wave 执行计划，发送给 `AlembicCore`。

## 窗口分派

已确认，具体派发以 wave 执行计划为准。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>阻塞 | 等待 Core contract。 |
| `AlembicCore`<br>待启动 | 第一波生产 ProjectScope / Ghost-only storage contract。 |
| `AlembicAgent`<br>观察中 | 等待 Core / Alembic 上游。 |
| `AlembicDashboard`<br>阻塞 | 等待 Alembic API。 |
| `AlembicPlugin`<br>阻塞 | 等待 Alembic resident ProjectScope。 |
| `AlembicTest`<br>观察中 | 等待实现窗口完成后创建 smoke 测试单。 |

## 可复制提示词

发送给：`AlembicCore`

```text
先读取 AGENTS.md、docs/workspace/index.md、docs/workspace/current/multi-root-project-scope-wave-1-2026-05-24.md，以及 AlembicCore/AGENTS.md；先明确声明当前窗口定位和本轮仓库职责，再按照文档领取并完成分配给 AlembicCore 的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`Alembic`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`。

## 回填区

### 用户确认

- 状态：已确认
- 确认时间：2026-05-24 22:14 CST
- 用户调整：第一波只启动 `AlembicCore`；第一版不做 folder remove / disable；standard 不做兼容，统一 Ghost-only 逻辑闭环，不做降级和分叉。

### 确认后第一波

- 启动文档：[multi-root-project-scope-wave-1-2026-05-24.md](../../../current/multi-root-project-scope-wave-1-2026-05-24.md)
- 发送窗口：`AlembicCore`
- 阻塞窗口：`Alembic`、`AlembicPlugin`、`AlembicDashboard`
- 观察窗口：`AlembicAgent`、`AlembicTest`
- index 当前计划是否已切到 wave 执行计划：是
