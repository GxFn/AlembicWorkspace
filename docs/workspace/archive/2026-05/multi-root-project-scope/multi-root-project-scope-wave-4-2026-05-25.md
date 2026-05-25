# Multi-root ProjectScope Wave 4

日期：2026-05-25
状态：P5 复测未通过；已转入 Wave 5 Plugin preflight 返修
主线目标：关闭 `AlembicTest` multi-root ProjectScope smoke 暴露的 Plugin bound-folder consumer 缺口，并把 Dashboard ProjectScope 面板调整成项目级外层 + 详情子面板 / 折叠区的开发者可读结构。

## 总控验收结论

`Test-2026-05-25-01 / MRPS-P4-MultiRoot-Smoke` 未通过，不能归档当前主线。

已通过的链路：

- `Alembic` CLI / daemon / API 能生产 ProjectScope。
- Dashboard 能消费 ProjectScope API，展示 `ProjectScope` summary 和 source folders，并且未暴露 remove / disable。
- 绑定清单已经证明 `Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard` 可以落到同一 ProjectScope 和 ghost dataRoot。

未通过的链路：

- Plugin 从已绑定 source folder 进入时，`status` / `diagnostics` / `prime` / `search` 仍回落 `single-folder-baseline`。
- 失败原因显示为 resident project scope unavailable / daemon is not started，且 `hostProjectAlignment.reason=selected-project-differs`。
- `tools/list` 缺少 `alembic_task` / `alembic_search`，prime / search 返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`。

用户最新 UI 反馈：

- ProjectScope 面板外层太复杂；外层只放项目级信息即可。
- `controlRoot`、`dataRoot`、source folders、add / resolve 等更多内容应进入子面板或折叠区。
- 这属于当前 ProjectScope 主线的开发者体验返修，可以与 Plugin 返修并行，不改变 ProjectScope contract。

## 最终目标差距

用户最终要的是：`AlembicWorkspace` 下多个 Alembic 系列仓库可以显式绑定成同一个抽象 Project；在任一绑定 folder 的 Codex 窗口中，Plugin 能使用同一 Project 级知识库；Dashboard / CLI 可以配置和查看绑定；Ghost dataRoot 是唯一标准。

当前剩余差距：

1. Plugin / Dashboard 第四波代码回填已通过总控复核。
2. `AlembicTest` 已完成 `Test-2026-05-25-02 / MRPS-P5-MultiRoot-Retest` 回填：Dashboard 新面板真实 UI 通过；Plugin `status` / `diagnostics` / `tools/list` 已能从四个绑定 source folder 识别同一 ProjectScope。
3. 当前剩余主线差距是 Plugin `alembic_health` / `alembic_task prime` / `alembic_search` 执行阶段仍被源码仓库排除预检拦截，返回 `CODEX_MCP_ERROR`，未能证明 bound-folder tool execution 闭合。
4. 不能只以单仓库 tests 或身份输出作为完成证据；execution preflight 修复并复测通过前，`GTODO-2026-05-24-036` 仍未完成。
5. 下一波返修计划已创建：[multi-root-project-scope-wave-5-2026-05-25.md](../../../current/multi-root-project-scope-wave-5-2026-05-25.md)，当前只发送给 `AlembicPlugin`。

## 第四波总控代码验收

验收时间：2026-05-25 02:45 CST

验收结论：`AlembicPlugin` 与 `AlembicDashboard` 第四波代码侧通过，可进入 `AlembicTest` 真实项目复测。

Plugin 验收事实：

- `AlembicPlugin` 工作区干净，HEAD 为 `4b7196c64a29cf19d8fad66c22ef76b0824067c5`（`fix: resolve project scope resident from bound folders`）。
- `AlembicPlugin/plugins/alembic-codex` 工作区干净，HEAD 为 `ff13a1a9b66c9c2ddc358de12b446199f6e85466`（`chore: refresh codex runtime project scope discovery`）。
- 提交范围集中在 `AlembicResidentServiceClient`、`HostProjectAlignment`、`ToolPolicy`、`Preflight`、`CodexMcpServer`、tool visibility、status 和相关 tests；没有新增 folder add / remove / disable。
- 关键代码证据：Plugin 通过只读 `runtime-control.json` 找 active controlRoot resident，再调用 resident `/api/v1/project-scope/resolve-folder` 验证当前 folder 是否属于同一 ProjectScope；`HostProjectAlignment` 将同一 ProjectScope 下的 controlRoot / source folder 视为同一抽象 Project；resident 可用但知识库为空时仍暴露 `alembic_task` / `alembic_search` / `alembic_health`。
- 总控复核 `git diff --check HEAD^ HEAD` 通过；回填验证记录包含 targeted tests、typecheck、lint、build、runtime refresh、verify plugin/channel、`npm run check` 和授权后完整 `npm test` 通过。

Dashboard 验收事实：

- `AlembicDashboard` 工作区干净，HEAD 为 `6621865105878b4b5cc01c4e223304ddf7e5b544`（`Refine project scope panel summary`）。
- 提交范围集中在 `ProjectScopePanel`、i18n 和 Dashboard contract test。
- 关键代码证据：`detailsOpen` 默认 `false`；外层展示 project/display name、ready/loading、storage kind、source folder count、bound/unbound；`controlRoot`、`dataRoot`、`projectScopeId`、source folders 和 add / resolve 管理区进入详情折叠区。
- `ProjectScopePanel` 仍调用 `api.getProjectScope()`、`api.listProjectScopeFolders()`、`api.addProjectScopeFolder()`、`api.resolveProjectScopeFolder()`；contract test 继续负向断言无 remove / delete / disable ProjectScope。
- 总控复核 `git diff --check HEAD^ HEAD` 通过；回填验证记录包含 `npm run test`、`npm run typecheck`、`npm run check` 通过。

验收限制：

- 总控没有直接跑真实项目 smoke；按 workspace 测试边界，真实 AlembicWorkspace 多 folder 复测交给 `AlembicTest`。
- Dashboard 没有本轮人工截图证据；`AlembicTest` 复测需要覆盖摘要外层和详情展开路径。

## AlembicTest P5 复测回填

测试单：`Test-2026-05-25-02 / MRPS-P5-MultiRoot-Retest`

复测结论：未通过，但缺口已经从 P4 的 `single-folder-baseline` 前移到 tool execution preflight。

已通过证据：

- daemon `/api/v1/project-scope*` 仍能解析 `Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard` 四个 source folder 到同一 `projectScopeId=project-scope-a8083fdb335c`，`controlRootIncludedInFolders=false`，`storageKind=ghost`。
- Plugin 从四个绑定 source folder 调用 `status` / `diagnostics` 时均返回 `mode=project-scope`、同一 `projectScopeId`、同一 `serviceScopeId=project-scope:project-scope-a8083fdb335c`，且 `hostProjectAlignment.handoffMismatch=null`。
- Plugin `tools/list` 在四个绑定 source folder 中均暴露 `alembic_task` / `alembic_search` / `alembic_health`，说明第四波 tool visibility 修复生效。
- Dashboard 新 ProjectScope 面板通过 Browser 真实 DOM / 截图验证：外层只显示项目级摘要、storage kind、folder count、bound 状态和详情入口；展开后显示 `controlRoot`、`dataRoot`、`projectScopeId`、source folders、add / resolve；未发现 ProjectScope remove / delete / disable 操作。
- 未绑定临时 folder baseline 仍保持 `single-folder-baseline`，不暴露 resident tools，未崩溃。

未通过证据：

- Plugin 从四个绑定 source folder 调用 `alembic_health` / `alembic_task prime` / `alembic_search(auto/semantic)` 均返回 `CODEX_MCP_ERROR`。
- 错误归口为 Plugin tool execution preflight 仍按当前 Alembic 系列源码 folder 做 excluded-project 判断，而不是沿用已经解析成功的 ProjectScope controlRoot / ghost dataRoot；因此 `prime/search` 没有产生可验收的 ProjectScope telemetry。
- 详细报告：[../../../AlembicTest/docs/multi-root-project-scope-retest-2026-05-25.md](../../../../../AlembicTest/docs/multi-root-project-scope-retest-2026-05-25.md)。

## 本波边界

- Plugin first, Alembic install enhances：Plugin 是 Codex host agent 入口，Alembic 是本地增强底座。
- Plugin 只读取 / resolve ProjectScope，不发起 folder add / remove / disable。
- Dashboard / CLI 仍是第一版 ProjectScope 配置入口；Dashboard 只保留 add / list / resolve，不做 remove / disable。
- `controlRoot` 是抽象 Project 控制入口，不进入 source `folders[]`。
- Ghost-only 是唯一标准；不做 standard 兼容、迁移、降级或分叉。
- 不触碰真实测试项目源码，不改 `AlembicAgent` tool root。
- `GTODO-2026-05-24-030` project-level skill visibility mount 继续待排期；本波不实现 skill 可见挂载。

## 阶段时序（北京时间 UTC+8）

| 北京时间 | 类型 | 窗口 / 对象 | 事件 | 发送名单 / 状态 |
| --- | --- | --- | --- | --- |
| 2026-05-25 02:10 CST | 验收 | `AlembicTest` | 总控复核 `MRPS-P4-MultiRoot-Smoke`，结论未通过。 | `AlembicTest` 待下一轮复测 |
| 2026-05-25 02:10 CST | 派发 | `AlembicPlugin` | 发送 `MRPS-P4A-PLUGIN`，修复 bound-folder ProjectScope discovery / HostProjectAlignment。 | `AlembicPlugin` 待启动 |
| 2026-05-25 02:10 CST | 派发 | `AlembicDashboard` | 发送 `MRPS-P4B-DASHBOARD`，调整 ProjectScope 面板信息架构。 | `AlembicDashboard` 待启动 |
| 2026-05-25 02:20 CST | 回填 | `AlembicDashboard` | `MRPS-P4B-DASHBOARD` 完成并提交 `6621865105878b4b5cc01c4e223304ddf7e5b544`；ProjectScope 面板改为外层项目摘要 + 折叠详情 / 管理区。 | `AlembicDashboard` 待验收 |
| 2026-05-25 02:35 CST | 回填 | `AlembicPlugin` | `MRPS-P4A-PLUGIN` 完成并提交 `4b7196c64a29cf19d8fad66c22ef76b0824067c5`；bound-folder ProjectScope resident discovery / HostProjectAlignment / tools/list 已接入 controlRoot resident resolve。 | `AlembicPlugin` 待验收 |
| 2026-05-25 02:45 CST | 验收 | `AlembicWorkspace` | 总控复核 Plugin / Dashboard 代码侧通过。 | `AlembicPlugin` / `AlembicDashboard` 已验收 |
| 2026-05-25 02:45 CST | 派发 | `AlembicTest` | 复跑 multi-root ProjectScope smoke。 | `AlembicTest` 待启动 |
| 2026-05-25 本轮 | 回填 | `AlembicTest` | `MRPS-P5-MultiRoot-Retest` 回填未通过：Dashboard 新面板通过，Plugin ProjectScope identity / tools/list 通过，但 health / prime / search 被 excluded-project preflight 拦截。 | 已转入 Wave 5 |

## 任务包

- 下一处真实阻塞点：Plugin 从任一已绑定 source folder 进入时，必须识别同一 ProjectScope resident，而不是回落 `single-folder-baseline`。
- 阻塞点之前还能做：Plugin 可独立修 discovery / alignment / telemetry；Dashboard 可独立降噪面板层级；两者不共享文件和验证链路，可以并行。

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| MRPS-P4A-PLUGIN | `AlembicPlugin` | 修复绑定 folder 中的 ProjectScope resident discovery、HostProjectAlignment 和 prime/search/status 身份输出。 | 已验收 |
| MRPS-P4B-DASHBOARD | `AlembicDashboard` | 将 ProjectScope 面板外层收敛为项目级摘要，把详细字段和 folder 操作移入子面板 / 折叠区。 | 已验收 |

### MRPS-P4A-PLUGIN：Bound-folder ProjectScope 返修

窗口：`AlembicPlugin`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 02:10 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 02:35 CST

当前阶段目标：

- 从已绑定 source folder 启动 Plugin 时，能发现并连接同一 ProjectScope resident。
- `status` / `diagnostics` / `prime` / `search` 都显示 `project-scope` identity，而不是误判为 `single-folder-baseline`。

可验证目标：

- 在 `Alembic` 和 `AlembicCore` 两个已绑定 folder 下，Plugin status / diagnostics 至少返回同一 `projectScopeId`。
- resident 可用但知识库为空时，不应把结果解释为 resident unavailable。
- `tools/list` 在 ProjectScope resident 可用时应暴露 `alembic_task` / `alembic_search` 等 resident-backed tools。
- 无 resident / 未绑定临时 folder 仍保持单 folder baseline，并明确标为可预期降级。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本 wave 文档、`docs/workspace/current/alembic-test-exchange.md` 和 `AlembicPlugin/AGENTS.md`，并声明当前窗口定位和本轮职责。
- 深入读取 resident discovery、daemon state、HostProjectAlignment、status / diagnostics、tools/list、prime / search pipeline 的真实代码。
- 修复 active runtime controlRoot 与 bound source folder 被误判为不同 selected project 的问题；同一 ProjectScope 下的 controlRoot 和 source folder 应被视为同一抽象 Project。
- 修复只按当前 folder-local daemon state 判断 resident 的路径；需要能通过 ProjectScope / controlRoot / resolve 结果识别已经启动的 Alembic resident。
- 区分三种状态：Alembic 不存在 / resident enhancement unavailable、Alembic 存在但请求失败、Alembic resident 可用但知识库为空。
- 更新 diagnostics 文案，避免把 ProjectScope resident 可用但 search 结果为空写成 daemon 未启动。
- 补 targeted tests 覆盖已绑定 folder、controlRoot、未绑定 baseline、resident available empty knowledge、tools/list 和 prime/search telemetry。

可一起关闭的 TODO：

- `GTODO-2026-05-24-036`：推进 multi-root ProjectScope Plugin consumer 返修部分。

明确不包含：

- 不实现 folder add / remove / disable。
- 不实现 project-level skill visibility mount。
- 不复制 Alembic ProjectScope registry，不自造第二套 storage。
- 不把 Dashboard 当成 Plugin 的运行时依赖；Dashboard 只可作为外部配置 / 跳转入口。

下一处真实阻塞点：

- 如果 Plugin 仍不能从绑定 folder 识别 ProjectScope resident，AlembicWorkspace 自用 Plugin 闭环无法进入复测通过。

阻塞点之前还能做：

- 本包应一次完成 discovery、alignment、tool exposure、prime/search/status telemetry、targeted tests、runtime artifact 刷新和回填证据；不要只修一个 status 字段后等待下一轮。

文件 / 模块边界：

- 允许：`AlembicPlugin` resident service client、status / diagnostics、MCP tools/list、prime/search pipeline、runtime artifact 和相关 tests。
- 禁止：`Alembic` ProjectScope producer、`AlembicDashboard` UI、真实测试项目源码。
- orphan 清理：只清理由本次改动产生的 orphan；无关 dead code 先记录，不直接删除。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 如果无法确认目标仓库定位，先停下回填阻塞，不继续扫描、改文档或写代码。

阻塞 / 依赖：

- 上游 ProjectScope producer 已验收；本包不等待 `Alembic` / `AlembicCore` 新提交。
- 复测依赖本包和 `MRPS-P4B-DASHBOARD` 均回填完成。

统一验证命令：

```text
# 由 AlembicPlugin 窗口按 AlembicPlugin/AGENTS.md 选择等价命令。
npm test -- AlembicResidentServiceClient SearchHandlerResidentSearch PrimeSearchPipelineResidentSearch CodexStatusService
npm run typecheck
npm run lint
npm run build
npm run prepare:codex-plugin-runtime
npm run verify:codex-plugin
npm run verify:codex-channel
npm run check
git diff --check
```

回填要求：

- 回填时间（北京时间，YYYY-MM-DD HH:mm CST）：
- 完成范围：
- 文件 / 模块变化：
- 提交 hash：
- 验证命令和结果：
- 已关闭 TODO 证据：
- 未关闭 TODO 去向：
- 遗留风险：
- 下一步建议：

### MRPS-P4B-DASHBOARD：ProjectScope 面板降噪

窗口：`AlembicDashboard`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 02:10 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 02:10 CST

当前阶段目标：

- 保留 ProjectScope add / list / resolve 能力，同时把 Header 项目控制面板外层调整为“项目级摘要优先”。
- 详细路径、source folders 和操作入口进入子面板或折叠区，减少一打开面板就被所有技术字段淹没。

可验证目标：

- 外层优先展示当前 Project 名称 / ProjectScope 状态 / storage kind / folder count / ready 状态等项目级信息。
- `controlRoot`、`dataRoot`、`projectScopeId`、source folder 列表、add / resolve 输入和操作按钮默认不挤在外层主面板。
- 用户可以展开或进入子面板查看 / 添加 / 解析 folders，原有 add / list / resolve 功能不丢失。
- Dashboard 仍不提供 remove / disable。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本 wave 文档、`AlembicDashboard/AGENTS.md`，并声明当前窗口定位和本轮职责。
- 深入读取 Header 项目控制下拉、`ProjectScopePanel`、API client、Dashboard contract tests 和样式约束。
- 重新设计 ProjectScope 面板信息架构：外层只放项目级摘要，更多技术字段移到“详情 / source folders / 管理”子面板或折叠区。
- 减少外层重复边框、密集路径和长字段对视觉的压迫；保留清晰的刷新、状态、错误和不可用反馈。
- 确保 `controlRoot` 仍与 source folders 分离，source folder count 可读。
- 更新相关前端测试 / contract tests；如无法做截图验证，回填 DOM / 测试证据和未手动截图的原因。

可一起关闭的 TODO：

- `GTODO-2026-05-25-001`：Dashboard ProjectScope 面板项目级外层与详情折叠区。

明确不包含：

- 不修改 ProjectScope API contract。
- 不实现 folder remove / disable。
- 不改变 Plugin / Alembic / Core 逻辑。
- 不处理旧 Jobs Timeline / LLM 输出侧边栏 polish。

下一处真实阻塞点：

- 如果 Dashboard 面板仍把所有 ProjectScope 技术字段铺在外层，用户在真实 multi-root 项目中难以确认当前项目状态和 source folders 关系。

阻塞点之前还能做：

- 本包应一次完成 UI 信息架构、样式收敛、add / resolve 操作保留、测试更新和回填；不要只隐藏字段导致功能缺失。

文件 / 模块边界：

- 允许：`AlembicDashboard` ProjectScope 面板、Header 项目控制 UI、API view-model tests、样式。
- 禁止：`Alembic` HTTP contract、`AlembicPlugin` ProjectScope discovery、真实测试项目源码。
- orphan 清理：只清理由本次改动产生的 orphan；无关 dead code 先记录，不直接删除。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 如果无法确认目标仓库定位，先停下回填阻塞，不继续扫描、改文档或写代码。

阻塞 / 依赖：

- 不依赖 Plugin 返修，可以并行执行。
- 后续 `AlembicTest` 复测需要确认新 UI 仍能展示 ProjectScope summary，并能进入详情完成 source folder 查看。

统一验证命令：

```text
# 由 AlembicDashboard 窗口按 AlembicDashboard/AGENTS.md 选择等价命令。
npm run test
npm run typecheck
npm run check
git diff --check
```

回填要求：

- 回填时间（北京时间，YYYY-MM-DD HH:mm CST）：
- 完成范围：
- 文件 / 模块变化：
- 提交 hash：
- 验证命令和结果：
- UI 层级调整说明：
- 已关闭 TODO 证据：
- 未关闭 TODO 去向：
- 遗留风险：
- 下一步建议：

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>阻塞 | `MRPS-P4A-PLUGIN` 身份识别 / tools/list 已被 P5 复测证明生效；health / prime / search tool execution preflight 仍拦截绑定源码 folder，返修已转入 [Wave 5](../../../current/multi-root-project-scope-wave-5-2026-05-25.md)。 |
| `AlembicDashboard`<br>已完成 | `MRPS-P4B-DASHBOARD` 已提交 `6621865105878b4b5cc01c4e223304ddf7e5b544` 并通过总控代码验收；P5 Browser DOM / 截图证明 summary 外层、详情展开、source folders、add / resolve 入口和无 remove / disable 均符合要求。 |
| `Alembic`<br>已完成 | Wave 2 producer 已验收；本波观察 Plugin / Dashboard 下游问题，不新增 Alembic producer 任务。 |
| `AlembicCore`<br>已完成 | Wave 1 contract 已验收；本波观察下游 contract 消费问题。 |
| `AlembicAgent`<br>观察中 | 第一版不扩大 tool root；本次问题不归口 Agent runtime。 |
| `AlembicTest`<br>阻塞 | `Test-2026-05-25-02 / MRPS-P5-MultiRoot-Retest` 已回填未通过，报告见 `AlembicTest/docs/multi-root-project-scope-retest-2026-05-25.md`；等待 Wave 5 Plugin 返修后再复测。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## 可复制分派提示词

发送给：无。

不发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicPlugin`、`AlembicDashboard`、`AlembicTest`、`BiliDili`。

说明：`AlembicTest` 已回填 P5 复测且总控验收为未通过；新提示词见 [Wave 5](../../../current/multi-root-project-scope-wave-5-2026-05-25.md)，本历史 wave 不再发送。

## TODO / Backlog

| ID | 状态 | 类型 | 归属 / 推荐窗口 | 处理方式 |
| --- | --- | --- | --- | --- |
| GTODO-2026-05-24-036 | 返修待启动 | 主线阻塞 | `AlembicPlugin` / `AlembicTest` | P5 证明 ProjectScope identity / tools/list 已过，但 health / prime / search execution preflight 仍按绑定源码 folder 做 excluded-project 拦截；已转入 Wave 5。 |
| GTODO-2026-05-25-001 | 已完成待归档 | Dashboard 信息架构 | `AlembicDashboard` / `AlembicTest` | Dashboard 已提交 `6621865105878b4b5cc01c4e223304ddf7e5b544`；P5 Browser DOM / 截图已确认真实 UI 摘要、详情展开、add / resolve 和无 remove / disable。 |
| GTODO-2026-05-24-030 | 待排期 | project-level skill visibility mount | 待定 | 保持待排期，不并入本波。 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `AlembicPlugin` | 已转 Wave 5 | 否 | P5 暴露 execution preflight 仍拦截绑定源码 folder；返修提示词见 Wave 5。 |
| `AlembicDashboard` | 已完成 | 否 | P5 UI 证据已通过，Dashboard 信息架构 TODO 已关闭。 |
| `Alembic` | 观察 | 否 | producer 已验收，本波没有新 Alembic 代码任务。 |
| `AlembicCore` | 观察 | 否 | contract 已验收，本波没有新 Core 任务。 |
| `AlembicAgent` | 观察 | 否 | 第一版不扩大 tool root，本波问题不归口 Agent runtime。 |
| `AlembicTest` | 阻塞 | 否 | P5 已验收为未通过，等待 Plugin 返修后再复测。 |
| `BiliDili` | 无任务 | 否 | 不改真实 iOS 项目源码。 |

## 回填区

- 2026-05-25 02:10 CST：总控验收 `Test-2026-05-25-01 / MRPS-P4-MultiRoot-Smoke` 未通过，启动第四波；当前发送给 `AlembicPlugin`、`AlembicDashboard`。
- 2026-05-25 02:20 CST：`AlembicDashboard` 回填 `MRPS-P4B-DASHBOARD` 完成。完成范围：Header 项目控制中的 `ProjectScopePanel` 改为外层项目级摘要，展示 project/display name、ready/loading、storage kind、source folder count、bound/unbound 状态；`controlRoot`、`dataRoot`、`projectScopeId`、source folder list、add / resolve 输入和操作按钮移入默认收起的详情与管理区；保留 refresh、error、unsupported、resolution 反馈，不新增 remove / disable，不修改 API contract。文件 / 模块变化：`src/components/Layout/ProjectScopePanel.tsx`、`src/i18n/locales/zh.ts`、`src/i18n/locales/en.ts`、`scripts/dashboard-contract.test.mjs`。提交 hash：`6621865105878b4b5cc01c4e223304ddf7e5b544`。验证命令和结果：`npm run test` 通过 12 tests；`npm run typecheck` 通过；`npm run check` 通过 lint / test / typecheck / build，保留既有 Vite 大 chunk warning；Dashboard 仓库 `git diff --check` 通过；workspace `git diff --check` 通过；`node scripts/verify-workspace-docs.mjs` 通过，检查 74 个 Markdown links；曾误跑旧路径 `node scripts/verify-alembic-docs.mjs`，因该脚本不存在失败，已改用当前 workspace 正确脚本。UI 层级调整说明：外层只保留项目级摘要和 `aria-expanded` 详情切换；详情区打开后才展示 ProjectScope 技术字段、source folders 和 folder path resolve/add 管理。DOM / 测试证据：contract test 断言 `detailsOpen` 默认 `false`、详情切换 `aria-expanded={detailsOpen}`、详情 label、bound/unbound 文案、source folder count 文案、manage 文案，并继续负向断言无 `removeProjectScope` / `deleteProjectScope` / `disableProjectScope` / `mock` / `fake`。截图证据：本轮 Browser 工具未在可用工具列表中暴露，未做人工截图冒烟；已用 DOM contract + build 产物验证替代记录。已关闭 TODO 证据：`GTODO-2026-05-25-001` Dashboard 侧已完成待验收。未关闭 TODO 去向：`GTODO-2026-05-24-036` 仍等待 Plugin 返修和 AlembicTest 复测；`GTODO-2026-05-24-030` 继续待排期。遗留风险：未做真实 Dashboard 页面截图 / 手动点击详情 add / resolve；后续 `AlembicTest` 需在 Plugin 回填后确认 ProjectScope summary 与详情管理入口可用。下一步建议：等待 `AlembicPlugin` 回填 `MRPS-P4A-PLUGIN` 后，由 `AlembicTest` 复跑 `MRPS-P4-MultiRoot-Smoke`，同时覆盖 Dashboard 新摘要与详情展开路径。
- 2026-05-25 02:35 CST：`AlembicPlugin` 回填 `MRPS-P4A-PLUGIN` 完成。完成范围：`AlembicResidentServiceClient` 增加 active `runtime-control` controlRoot 候选读取，并通过 Alembic resident `/api/v1/project-scope/resolve-folder` 证明当前 source folder 属于同一 ProjectScope 后再接入 controlRoot daemon；`HostProjectAlignment` 将同一 ProjectScope 下的 controlRoot / source folder 视为同一抽象 Project，避免 `selected-project-differs` 误报；MCP `tools/list`、preflight 与 `ToolPolicy` 在 ProjectScope resident 可用但本地 knowledge 为空时仍暴露 `alembic_task` / `alembic_search` / `alembic_health`，让 prime/search 返回 telemetry 而不是 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`；`status` / `diagnostics` 传递 ProjectScope identity；同步刷新 AlembicCodex runtime artifact。文件 / 模块变化：`lib/service/resident/AlembicResidentServiceClient.ts`、`lib/codex/HostProjectAlignment.ts`、`lib/codex/status/StatusService.ts`、`lib/codex/ToolPolicy.ts`、`lib/codex/preflight/Preflight.ts`、`lib/external/mcp/CodexMcpServer.ts`、`lib/external/mcp/codex/tool-visibility.ts`、相关单元测试、`plugins/alembic-codex/runtime/dist/**`、`plugins/alembic-codex/runtime.tgz`。提交 hash：`AlembicPlugin` `4b7196c64a29cf19d8fad66c22ef76b0824067c5`；`AlembicCodex` runtime artifact 子仓库 `ff13a1a9b66c9c2ddc358de12b446199f6e85466`；`runtime.tgz` SHA-256 `9b8cfc721ccd4d29b92c04bf293ef3ea706afb111ddb6d2bbcd37e55a0fc67f2`。验证命令和结果：`npm test -- AlembicResidentServiceClient SearchHandlerResidentSearch PrimeSearchPipelineResidentSearch CodexStatusService CodexToolPolicy CodexMcpServer` 通过 6 files / 65 tests；`npm run typecheck` 通过；`npm run lint` 通过，检查 176 files；`npm run build` 通过，core build 使用 `../AlembicCore @ b72390f2066f6406ce432b7dc94448dcd05862a3`；`npm run prepare:codex-plugin-runtime` 通过并刷新 `plugins/alembic-codex/runtime.tgz`；`npm run verify:codex-plugin` 通过；`npm run verify:codex-channel` 通过；`npm run check` 通过 typecheck / lint / core import boundary，扫描 327 files 和 443 个 `@alembic/core` imports；`git diff --check` 通过；`rg -n "residentProjectScopeAvailable|resolveActiveProjectScopeProbe|runtime-control|sameProjectScopeRoot|resident-backed" plugins/alembic-codex/runtime/dist/lib` 命中 runtime dist 中的新逻辑；完整 `npm test` 首次在 sandbox 内因 `listen EPERM: operation not permitted ::1:3150/3250` 失败，按 sandbox 规则授权重跑后通过 139 files / 2296 tests。已关闭 TODO 证据：`GTODO-2026-05-24-036` 的 Plugin consumer 返修部分已提交并待总控验收。未关闭 TODO 去向：`GTODO-2026-05-24-036` 仍需 `AlembicTest` 在真实 multi-root ProjectScope 下复测；`GTODO-2026-05-24-030` project-level skill visibility mount 未纳入本波，继续待排期。遗留风险：Plugin 窗口未直接操作真实测试项目，真实 bound-folder status / diagnostics / tools/list / prime / search 结果仍需 `AlembicTest` 复测确认；如果 `runtime-control` 指向过期 controlRoot 或 `/resolve-folder` 判断未绑定，Plugin 会继续按设计降级为 single-folder baseline；ProjectScope resident 可用但知识库为空时语义结果数量仍可能为 0，但应带 telemetry。下一步建议：总控复核 Plugin / Dashboard 两个回填后，派发 `AlembicTest` 复跑 `MRPS-P4-MultiRoot-Smoke`，重点覆盖 `Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard` 四个绑定 folder 的 Plugin `status` / `diagnostics` / `tools/list` / `alembic_task prime` / `alembic_search` 与 Dashboard 摘要 + 详情展开路径。
- 2026-05-25 02:45 CST：总控完成第四波代码验收。`AlembicPlugin` / `AlembicPlugin/plugins/alembic-codex` / `AlembicDashboard` 工作区均干净；提交分别为 `4b7196c64a29cf19d8fad66c22ef76b0824067c5`、`ff13a1a9b66c9c2ddc358de12b446199f6e85466`、`6621865105878b4b5cc01c4e223304ddf7e5b544`。总控复核 `git diff --check HEAD^ HEAD` 均通过，并抽查 Plugin runtime-control / resolve-folder / HostProjectAlignment / resident-backed tools 代码证据，以及 Dashboard `detailsOpen` 默认收起、摘要外层和 add / resolve 保留证据。当前派发 `AlembicTest` 复测。
- 2026-05-25 本轮：`AlembicTest` 回填 `Test-2026-05-25-02 / MRPS-P5-MultiRoot-Retest`。完成范围：使用 `ALEMBIC_TEST_MODE=1` 重启 Alembic dev link，在 `AlembicWorkspace` ProjectScope 下验证 daemon API、四个绑定 source folder 的 Plugin status / diagnostics / tools/list / health / prime / search、未绑定 baseline，以及 Dashboard 新 ProjectScope 面板 Browser DOM / 截图。测试结论：未通过。已通过：daemon 解析四个 source folder 到同一 `projectScopeId=project-scope-a8083fdb335c` 和 ghost dataRoot；Plugin `status` / `diagnostics` 均返回 `mode=project-scope`、同一 `serviceScopeId` 且无 handoff mismatch；`tools/list` 均包含 `alembic_task` / `alembic_search` / `alembic_health`；Dashboard summary 外层和 details 展开真实 UI 通过，未暴露 ProjectScope remove / delete / disable；未绑定 baseline 保持单 folder 降级。未通过：四个绑定 source folder 的 `alembic_health` / `alembic_task prime` / `alembic_search(auto/semantic)` 均返回 `CODEX_MCP_ERROR`，错误显示 execution preflight 仍把 Alembic 系列源码仓库视为 excluded project，没有沿用已解析的 ProjectScope controlRoot / ghost dataRoot。报告路径：[../../../AlembicTest/docs/multi-root-project-scope-retest-2026-05-25.md](../../../../../AlembicTest/docs/multi-root-project-scope-retest-2026-05-25.md)。提交 hash：无，本轮 AlembicTest 只回填报告和 probe 脚本，待用户另行要求封口提交。下一步建议：总控验收 P5 失败归口后，创建 `AlembicPlugin` 返修任务，聚焦 ProjectScope resident identity 已建立后的 tool execution preflight 路径。
