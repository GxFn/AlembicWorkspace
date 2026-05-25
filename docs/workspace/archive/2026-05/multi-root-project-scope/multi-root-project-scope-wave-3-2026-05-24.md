# Multi-root ProjectScope Wave 3

日期：2026-05-24
状态：第三波 Plugin / Dashboard consumer 已验收
主线目标：让 ProjectScope producer 被 Codex Plugin 和 Dashboard 真实消费，进入 AlembicWorkspace 自用 smoke 前的最后接入阶段。

## 最终目标差距

用户最终要的是：`AlembicWorkspace` 下多个 Alembic 系列仓库可以被显式绑定为同一个抽象 Project；在任一绑定 folder 的 Codex 窗口中，Plugin 能使用同一 Project 级知识库；Alembic CLI / Dashboard 可以配置和展示 folder 绑定；Ghost dataRoot 是唯一标准。

已完成：

- `AlembicCore`：ProjectScope / Folder / Ghost-only contract 已验收，提交 `b72390f`。
- `Alembic`：ProjectScope registry、CLI、HTTP、daemon health / resident capability、ProjectScope-aware dataRoot 已验收，提交 `31788bb21b7bba49f571c00949dc02922d6d1c7e`。

本波要缩小的差距：

- `AlembicPlugin` 需要在 Alembic resident 存在时读取 ProjectScope identity，并把 prime / search / status 绑定到 Project 级 scope；Alembic 不存在时仍保持单 folder baseline。
- `AlembicDashboard` 需要消费 `/api/v1/project-scope`，展示并添加 folder 绑定，让用户可以通过前端配置多 folder Project。
- 本波不启动 `AlembicTest`；Plugin / Dashboard 已通过总控验收，真实 multi-root smoke 测试单见 [alembic-test-exchange.md](../../../current/alembic-test-exchange.md)。

## 本波边界

- Plugin first, Alembic install enhances：Plugin 是 Codex host agent 入口，Alembic 是增强底座。
- Plugin 不控制项目，不发起 folder add / remove / disable；它只读取 / resolve 当前 folder 的 ProjectScope，并据此消费知识库。
- Dashboard / CLI 是第一版 ProjectScope 配置入口；Dashboard 只做 add / list / resolve，不做 remove / disable。
- `controlRoot` 是抽象 Project 控制入口，不进入 `folders[]`，Dashboard 展示时必须与 source folders 分开。
- Ghost-only 是唯一标准；不做 standard 兼容、迁移、降级或分叉。
- 不触碰真实测试项目源码，不改 `AlembicAgent` tool root。
- `GTODO-2026-05-24-030` project-level skill visibility mount 继续保留，不在本波完成；skill 语义属于抽象 Project，不按 folder 拆分。

## 任务包

### MRPS-P3-PLUGIN

窗口：`AlembicPlugin`

派发时间（北京时间）：2026-05-24 23:33 CST
状态更新时间（北京时间）：2026-05-24 23:57 CST
状态：已验收

阶段目标：让 Codex Plugin 消费 Alembic resident ProjectScope identity，使 prime / search / status 在多 folder Project 下绑定同一 Project 级知识库。

主线动作：

- 先读取 workspace `AGENTS.md`、本 wave 文档、`AlembicPlugin/AGENTS.md`，并声明当前窗口定位和本轮职责。
- 深入读取 Plugin 的 resident service client、health/status、prime/search、workspace identity、skill delivery receipt / runtime export 相关入口，确认哪些地方仍以单 cwd / 单 projectRoot 判断项目身份。
- 消费 Alembic resident `capabilities.projectScope`、`projectScope`、`projectScopeId`、resident `serviceScope.scopeId` 和必要的 read/resolve endpoint。
- Plugin 只读取 / resolve，不调用 folder add / remove / disable；不存在 Alembic resident 时，降级为 Plugin 自己的单 folder baseline，并明确标注为 `resident project scope unavailable`，不是错误。
- 更新 prime / search / status / diagnostics 的身份摘要，让 Codex 能看见当前知识库绑定的是 ProjectScope 还是单 folder baseline。
- 不把 Alembic Dashboard 当成 Plugin 依赖；Dashboard 只作为 URL 跳转或外部配置入口。

合并 TODO：

- `GTODO-2026-05-24-036`：推进 multi-root ProjectScope Plugin consumer。

下一处真实阻塞点：

- 需要 `AlembicPlugin` 回填 ProjectScope identity 已进入 prime / search / status，否则无法开始 AlembicTest 的任一绑定 folder Codex smoke。

阻塞点之前还能做：

- 本包内应一次完成 resident capability 读取、ProjectScope resolve、baseline 降级、身份摘要、targeted tests 和回填证据；不要只改 status 字段后等待下一轮。

明确不包含：

- 不实现 project-level skill visibility mount；不把同一 ProjectScope 的 skill 拆成 folder 级语义。
- 不新增 Plugin 侧项目控制 UI / 命令。
- 不复制 Alembic ProjectScope registry，不自造第二套 storage。

验证命令：

- 按 `AlembicPlugin/AGENTS.md` 执行 targeted typecheck / lint / tests。
- 至少覆盖：resident ProjectScope 可用、resident 不存在、ProjectScope resolve 失败、baseline single folder、prime/search/status 身份字段。
- `git diff --check`。

回填要求：

- 完成范围、提交 hash、验证命令和结果。
- Plugin 消费的 Alembic 字段清单和降级行为。
- 说明 prime / search / status 如何使用 ProjectScope identity。
- 遗留风险，以及是否可以进入 AlembicTest multi-root Plugin smoke。

### MRPS-P3-DASHBOARD

窗口：`AlembicDashboard`

派发时间（北京时间）：2026-05-24 23:33 CST
状态更新时间（北京时间）：2026-05-24 23:57 CST
状态：已验收

阶段目标：让 Dashboard 成为 ProjectScope 的开发者可见配置入口，展示抽象 Project、controlRoot、Ghost dataRoot 和 folders[]，并支持第一版 add / list / resolve。

主线动作：

- 先读取 workspace `AGENTS.md`、本 wave 文档、`AlembicDashboard/AGENTS.md`，并声明当前窗口定位和本轮职责。
- 深入读取 Dashboard API client、后台任务 / runtime status 页面、project/runtime 卡片和现有数据加载链路，选择最小但真实可用的入口展示 ProjectScope。
- 消费 `/api/v1/project-scope`、`/api/v1/project-scope/folders`、`/api/v1/project-scope/resolve-folder` 和 daemon health 中的 `capabilities.projectScope`。
- 展示时把 `controlRoot`、`dataRoot`、`storageKind=ghost`、`projectScopeId` 和 source folders 分开；不要把 controlRoot 当成源码 folder。
- 提供 add folder 第一版交互；只允许 add / list / resolve，不提供 remove / disable。
- 若 resident 不支持 ProjectScope，UI 明确显示能力不可用，不制造假数据。

合并 TODO：

- `GTODO-2026-05-24-036`：推进 multi-root ProjectScope Dashboard consumer。

下一处真实阻塞点：

- 需要 `AlembicDashboard` 回填 ProjectScope UI / API client 已能展示和添加 folders，否则无法让用户通过前端配置 AlembicWorkspace 多 folder Project。

阻塞点之前还能做：

- 本包内应一次完成 API client、能力不可用状态、summary 展示、add folder 交互、targeted tests 和回填证据；不要只做字段类型或静态展示。

明确不包含：

- 不做 folder remove / disable。
- 不改 Dashboard 旧任务 timeline / LLM output 逻辑。
- 不引入 Plugin Dashboard 反向依赖。

验证命令：

- 按 `AlembicDashboard/AGENTS.md` 执行 typecheck / lint / check / targeted tests。
- 至少覆盖：API client contract、能力不可用、ProjectScope summary 展示、add folder 成功 / 失败、controlRoot 不进入 folder list。
- `git diff --check`。

回填要求：

- 完成范围、提交 hash、验证命令和结果。
- UI 入口和字段展示说明。
- API 字段清单和错误 / 不可用状态。
- 遗留风险，以及是否可以进入 AlembicTest multi-root Dashboard smoke。

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>已完成 | 已执行 `MRPS-P3-PLUGIN`，提交 `96f941803d71d93b76a4f85fe4014fdbe9257c58`，通过总控验收。 |
| `AlembicDashboard`<br>已完成 | 已执行 `MRPS-P3-DASHBOARD`，提交 `bd6f4050c18e3b441b87d10efa7734135600fce6`，通过总控验收。 |
| `Alembic`<br>已完成 | Wave 2 producer 已验收；本波观察下游消费问题。 |
| `AlembicCore`<br>已完成 | Wave 1 contract 已验收；本波观察下游 contract 消费问题。 |
| `AlembicAgent`<br>观察中 | 第一版不扩大 tool root；等待 multi-root smoke 结果。 |
| `AlembicTest`<br>待启动 | 总控已创建 `Test-2026-05-25-01 / MRPS-P4-MultiRoot-Smoke`，见 [alembic-test-exchange.md](../../../current/alembic-test-exchange.md)。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## 可复制分派提示词

发送给：无。

Plugin / Dashboard 均已通过总控验收；当前不再发送本 wave 执行提示词。

不发送给：`AlembicPlugin`（已回填待验收）、`AlembicDashboard`（已回填待验收）、`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicTest`、`BiliDili`。

## TODO / Backlog

- `GTODO-2026-05-24-036`：本波 Plugin / Dashboard consumer 已通过总控验收；已进入 `AlembicTest` multi-root smoke。
- `GTODO-2026-05-24-030`：project-level skill visibility mount 保持待排期，不并入本波；后续应以 ProjectScope canonical skill 为源，只给各授权 folder 提供 Codex 可见入口。

## 回填区

- 2026-05-24 23:33 CST：总控验收 `Alembic` Wave 2 producer 通过；启动本波，发送给 `AlembicPlugin`、`AlembicDashboard`。
- 2026-05-24 23:57 CST：`AlembicPlugin` 完成 `MRPS-P3-PLUGIN`。
  - 完成范围：
    - `AlembicResidentServiceClient` 新增 ProjectScope identity 解析：优先读取 resident health 的 `serviceScope.projectIdentity.projectScope`，缺失时通过 `/api/v1/project-scope/resolve-folder` 解析当前 folder，失败 / 未命中 / 无 token 时降级为单 folder baseline。
    - `status` / `diagnostics` 输出新增 `projectScopeIdentity`，让 Codex 可见当前知识库绑定的是 resident ProjectScope 还是 Plugin 单 folder baseline。
    - `search` telemetry 新增 `searchMeta.projectScopeIdentity` 和 `searchMeta.residentSearch.projectScopeIdentity`；prime 通过 `PrimeSearchPipeline` 继承 resident search metadata。
    - 更新 targeted tests，并同步 `plugins/alembic-codex` runtime dist、vendor Core snapshot 和 `runtime.tgz`。
  - 提交 hash：
    - `AlembicPlugin`：`96f941803d71d93b76a4f85fe4014fdbe9257c58`
    - `AlembicCodex` runtime artifact：`4ffb1314904ef11b41ddd491aa070bcb5c2b517c`
    - `runtime.tgz` sha256：`6a12ac4452661390047262fa80fea33a19f60b4186da1a80e19527cf4d5dee33`
  - Plugin 消费的 Alembic 字段清单：
    - resident health：`data.residentService.status.serviceScope.scopeId`、`data.residentService.status.serviceScope.projectIdentity.projectScope`、`projectScopeId`、`projectId`、`dataRootSource`、diagnostic paths。
    - resident capability：`data.capabilities.projectScope`。
    - resolve endpoint：`GET /api/v1/project-scope/resolve-folder?folderPath=...` 的 `data.summary`。
    - search response：继续透传 Alembic `/api/v1/search` 的 `searchMeta`，并在 Plugin resident telemetry 上补充 ProjectScope identity。
  - 降级行为：
    - 无 daemon state、非本地 Alembic resident、缺 token、resolve endpoint 失败或 resolve 未命中时，返回 `mode: single-folder-baseline`、`source: plugin-single-folder-baseline`，`reason` 以 `resident project scope unavailable` 开头；这是可预期降级，不作为错误。
    - Plugin 不调用 folder add / remove / disable，不复制 Alembic ProjectScope registry。
  - 验证命令 / 结果：
    - `npm test -- AlembicResidentServiceClient SearchHandlerResidentSearch PrimeSearchPipelineResidentSearch CodexStatusService`：通过，4 个测试文件 / 17 个测试。
    - `npm run typecheck`：通过。
    - `npm run lint`：通过。
    - `npm run build`：通过，使用 `../AlembicCore @ b72390f2066f6406ce432b7dc94448dcd05862a3`。
    - `npm run prepare:codex-plugin-runtime`：通过。
    - `npm run verify:codex-plugin`：通过。
    - `npm run verify:codex-channel`：通过。
    - `npm run lint:repo-boundary`：通过。
    - `npm run check`：通过。
    - `npm run test:unit`：通过，105 个测试文件 / 1503 个测试。
    - `git diff --check`（`AlembicPlugin` 与 `plugins/alembic-codex`）：通过。
  - 遗留风险：
    - 尚未跑 `AlembicTest` 的真实 multi-root Codex smoke；需要等 `AlembicDashboard` 回填后统一开测试单。
    - Plugin 只做读取 / resolve 和 telemetry 绑定；ProjectScope folder 配置仍依赖 Alembic CLI / Dashboard producer。
  - 下一步建议：
    - `AlembicDashboard` 完成后，进入 `AlembicTest`：在 AlembicWorkspace 多 folder 绑定下分别从任一 folder 启动 Codex Plugin，验证 status / diagnostics / prime / search 均指向同一 ProjectScope identity，并确认无 resident 时仍保持单 folder baseline。
- 2026-05-24 23:56 CST：`AlembicDashboard` 回填 `MRPS-P3-DASHBOARD` 完成，提交 `bd6f4050c18e3b441b87d10efa7734135600fce6`（`Consume ProjectScope in dashboard`）。
  - 完成范围：Dashboard API client 增加 ProjectScope normalizer 与 `getProjectScope` / `listProjectScopeFolders` / `addProjectScopeFolder` / `resolveProjectScopeFolder`；Header 项目控制下拉新增 `ProjectScopePanel`，展示 `controlRoot`、`dataRoot`、`storageKind`、`projectScopeId` 和 source folders，并提供 add / resolve / refresh；`capabilities.projectScope` 不可用时显示显式 unavailable 状态，不展示伪造数据。
  - API / view-model 示例：`RuntimeBoundary.capabilities.projectScope.available === true` 作为展示和加载门禁；`ProjectScopeSummary` 字段包括 `controlRoot`、`dataRoot`、`storageKind`、`projectScopeId`、`folders[]`；前端 `normalizeProjectScopeFolders(record.folders, controlRoot)` 会过滤与 `controlRoot` 同路径的 folder，避免把控制入口当成 source folder。
  - UI 入口和字段展示：入口位于 Header 左侧项目控制下拉；字段分区为 ProjectScope 摘要卡、source folders 列表、folder path 输入、`解析` 与 `添加` 按钮。第一版没有 remove / disable 入口。
  - 错误 / 不可用状态：resident 未声明 `capabilities.projectScope` 时显示 `ProjectScope API 暂不可用`；GET / add / resolve 失败会通过 `getErrorMessage` 展示错误，add 失败走 error notification。
  - 验证命令：`npm run test`、`npm run typecheck`、`npm run check`、`git diff --check`。
  - 验证结果：全部通过。`npm run check` 覆盖 lint、contract tests、typecheck、build；Vite build 保留既有 large chunk warning。
  - 遗留风险：尚未做真实 resident + Dashboard 浏览器交互 smoke；需要由 `AlembicTest` 创建 multi-root smoke，验证 AlembicWorkspace 多 folder add / resolve / Plugin search 端到端闭环。
  - 下一步建议：可以进入 `AlembicTest` multi-root Dashboard smoke 的前置条件已满足；建议总控验收 Plugin + Dashboard 后合并启动一次真实 multi-root smoke。

### 总控验收

- 验收时间：2026-05-25 00:06 CST
- 验收结论：通过，可启动 `AlembicTest` multi-root smoke。
- Plugin 验收事实：
  - `AlembicPlugin` 工作区干净，HEAD 为 `96f941803d71d93b76a4f85fe4014fdbe9257c58`（`feat: consume resident project scope in codex plugin`）。
  - `AlembicPlugin/plugins/alembic-codex` 工作区干净，HEAD 为 `4ffb1314904ef11b41ddd491aa070bcb5c2b517c`（`chore: refresh codex runtime project scope artifact`）。
  - 真实代码在 `AlembicResidentServiceClient` 中只读 resident health / `/api/v1/project-scope/resolve-folder`，无 ProjectScope add / remove / disable 调用；无 resident / 无 token / resolve 失败时返回 `single-folder-baseline`。
  - `StatusService`、`CodexMcpServer` diagnostics、resident search / prime search telemetry 已携带 `projectScopeIdentity`。
  - 总控复跑 `npm test -- AlembicResidentServiceClient SearchHandlerResidentSearch PrimeSearchPipelineResidentSearch CodexStatusService`：4 files / 17 tests 通过。
  - 总控复跑 `git diff --check HEAD^ HEAD`（`AlembicPlugin` 与 runtime artifact）：通过。
- Dashboard 验收事实：
  - `AlembicDashboard` 工作区干净，HEAD 为 `bd6f4050c18e3b441b87d10efa7734135600fce6`（`Consume ProjectScope in dashboard`）。
  - `src/api.ts` 消费 `/project-scope`、`/project-scope/folders`、`/project-scope/resolve-folder`，只提供 add / list / resolve；没有 remove / disable。
  - `ProjectScopePanel` 以 `capabilities.projectScope.available` 为门禁，展示 controlRoot / dataRoot / storageKind / projectScopeId / source folders，add 首个 folder 时使用 `primary-source`，并过滤 controlRoot。
  - `scripts/dashboard-contract.test.mjs` 覆盖 ProjectScope contract、不可用状态、controlRoot 不伪装成 source folder、无 remove / disable。
  - 总控复跑 `npm run test`：12 tests 通过。
  - 总控复跑 `git diff --check HEAD^ HEAD`：通过。
- 遗留风险：
  - 真实 resident + Dashboard 浏览器交互、AlembicWorkspace 多 folder 绑定、任一绑定 folder 中 Plugin status / diagnostics / prime / search 共用同一 ProjectScope identity 尚未跑；已创建 `AlembicTest` 测试单。
  - `GTODO-2026-05-24-030` project-level skill visibility mount 不属于本波，继续保留。
