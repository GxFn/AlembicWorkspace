# Multi-root ProjectScope Wave 5

日期：2026-05-25
状态：P7 总控验收通过；multi-root ProjectScope 当前硬门禁完成
主线目标：关闭 `Test-2026-05-25-02 / MRPS-P5-MultiRoot-Retest` 暴露的最后断点，使 Plugin 在任一已绑定 source folder 中执行 `alembic_health` / `alembic_task prime` / `alembic_search` 时使用同一 ProjectScope controlRoot / ghost dataRoot，而不是被当前源码 folder 的 excluded-project preflight 拦截。

## 总控验收结论

`AlembicTest` 已回填 P5 复测，结论是未通过，当前 multi-root ProjectScope 主线不能归档；随后 `AlembicPlugin` 完成 Wave 5 preflight 返修并通过总控代码侧验收。

`AlembicTest` 已回填 `Test-2026-05-25-03 / MRPS-P6-Preflight-Retest`，执行窗口结论为通过，但覆盖范围只有四个 source folder。用户随后指出 Dashboard 项目清单缺少 `AlembicAgent`；总控复核后确认这不满足最初五个 Alembic 系列仓库同属一个抽象 Project 的完成定义。详细报告：[../../../AlembicTest/docs/multi-root-project-scope-preflight-retest-2026-05-25.md](../../../../../AlembicTest/docs/multi-root-project-scope-preflight-retest-2026-05-25.md)

`AlembicTest` 已回填 `Test-2026-05-25-04 / MRPS-P7-Agent-Folder-Coverage`，执行窗口结论为通过：`AlembicAgent` 已加入同一 `projectScopeId=project-scope-a8083fdb335c`，五个 source folder 的 Plugin `health` / `prime` / `search(auto/semantic)` 均成功执行并带 ProjectScope telemetry，Dashboard 项目控制弹层显示 `5 个源文件夹`，source folders 无新增或修改 `.asd/` / `Alembic/` runtime data。详细报告：[../../../AlembicTest/docs/multi-root-project-scope-agent-folder-coverage-2026-05-25.md](../../../../../AlembicTest/docs/multi-root-project-scope-agent-folder-coverage-2026-05-25.md)

总控于 2026-05-25 11:06 CST 复核 P7 报告通过：五个 Alembic 系列仓库均已作为同一抽象 Project 的 source folder 可用，Plugin execution / Dashboard folder count / source folder no-write 三个硬门禁均闭合。`GTODO-2026-05-24-036` 关闭；project-level skill visibility mount 不属于本主线，继续保留在 `GTODO-2026-05-24-030`。

已通过的链路：

- `Alembic` daemon / API / ProjectScope resolve 通过，`Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard` 四个 source folder 均解析到同一 `projectScopeId=project-scope-a8083fdb335c` 和 ghost dataRoot。
- Plugin `status` / `diagnostics` / `tools/list` 通过，四个绑定 source folder 均返回 `mode=project-scope`、同一 `serviceScopeId=project-scope:project-scope-a8083fdb335c`，并暴露 `alembic_task` / `alembic_search` / `alembic_health`。
- Dashboard 新 ProjectScope 面板通过真实 DOM / 截图验证：外层只显示项目级摘要，详情展开后显示 `controlRoot` / `dataRoot` / `projectScopeId` / source folders / add / resolve，且无 remove / disable。
- 未绑定临时 folder baseline 仍保持 `single-folder-baseline`，不暴露 resident tools，未崩溃。

P6 覆盖不足（已由 P7 补齐）：

- P6 ProjectScope folder 绑定清单为 `Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard`，`folderCount=4`。
- 最初目标和阶段确认要求 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 五个 Alembic 系列仓库显式绑定为同一个 Project。
- 因此创建 `Test-2026-05-25-04 / MRPS-P7-Agent-Folder-Coverage`；P7 已补齐 `AlembicAgent` 第五 source folder 覆盖，不改 AlembicAgent 内部代码。

P5 未通过的链路（已由 P6 复测覆盖）：

- Plugin 从四个绑定 source folder 调用 `alembic_health`、`alembic_task(operation=prime)`、`alembic_search(auto/semantic)` 均返回 `CODEX_MCP_ERROR`。
- 错误信息显示 MCP server 仍按当前 Alembic 系列源码 folder 的 excluded-project 规则拒绝创建运行时数据，没有沿用已经解析出的 ProjectScope controlRoot / ghost dataRoot 作为 tool execution root。
- 因 health / prime / search 没有进入 resident route，当时没有得到 `prime/search` 的 ProjectScope telemetry；该缺口后续已由 P6 / P7 覆盖。

详细报告：[../../../AlembicTest/docs/multi-root-project-scope-retest-2026-05-25.md](../../../../../AlembicTest/docs/multi-root-project-scope-retest-2026-05-25.md)

## 最终目标差距

用户最终要的是：`AlembicWorkspace` 下多个 Alembic 系列仓库可以显式绑定成同一个抽象 Project；在任一绑定 folder 的 Codex 窗口中，Plugin 能使用同一 Project 级知识库；Dashboard / CLI 可以配置和查看绑定；Ghost dataRoot 是唯一标准。

当前硬门禁已通过：

- ProjectScope identity、resident tool visibility 和 Dashboard UI 已通过真实复测。
- Plugin tool execution preflight 已在四个绑定 folders 复测通过，`health` / `prime` / `search(auto/semantic)` 均成功执行并带同一 `projectScopeId=project-scope-a8083fdb335c` 的 telemetry。
- `AlembicAgent` 已进入 ProjectScope source folders，P7 五文件夹绑定、Plugin execution、Dashboard folder count 和 source folder no-write 均通过；总控已关闭当前 multi-root ProjectScope 主线硬门禁。
- 语义结果数为 0 是未跑 full cold-start 的预期；本波验收点是 execution preflight、ProjectScope telemetry 和无 source folder runtime 写入。

## 本波边界

- Plugin first, Alembic install enhances：`AlembicPlugin` 是 Codex host agent 入口，`Alembic` 是本地增强底座。
- 本波只修 Plugin tool execution preflight / execution context；不重做 ProjectScope producer、Dashboard UI、Core contract 或 Agent tool root。
- 不削弱 excluded-project 保护。只有在 Plugin 已解析到 `project-scope` identity，且 resident route / controlRoot / ghost dataRoot 可用时，resident-backed tools 才可越过当前 source folder 的 excluded-project 短路，改用 ProjectScope 执行上下文。
- 未绑定 folder、无 resident、ProjectScope 不可用或无法确认 controlRoot / dataRoot 的场景仍保持 baseline 降级，不暴露 resident tools，不在源码 folder 创建 runtime data。
- 不实现 folder remove / disable。
- 不实现 project-level skill visibility mount；`GTODO-2026-05-24-030` 继续待排期。
- 不修改真实测试项目源码。

## 阶段时序（北京时间 UTC+8）

| 北京时间 | 类型 | 窗口 / 对象 | 事件 | 发送名单 / 状态 |
| --- | --- | --- | --- | --- |
| 2026-05-25 本轮 | 回填 | `AlembicTest` | `MRPS-P5-MultiRoot-Retest` 回填未通过：Dashboard 新面板通过，Plugin identity / tools-list 通过，health / prime / search 被 excluded-project preflight 拦截。 | 已复核并转 P6 |
| 2026-05-25 本轮 | 验收 | `AlembicWorkspace` | 总控确认 P5 未通过，剩余断点归口 `AlembicPlugin`。 | `AlembicPlugin` 待启动 |
| 2026-05-25 本轮 | 返修 | `AlembicPlugin` | 修复 ProjectScope-aware tool execution preflight。 | 发送给 `AlembicPlugin` |
| 2026-05-25 10:03 CST | 回填 | `AlembicPlugin` | `MRPS-P6-PLUGIN-PREFLIGHT` 已完成：ProjectScope runtime summary 注入 Plugin-owned MCP 执行、excluded source folder 仅在已绑定 ghost ProjectScope 下放行、`health/search/prime` targeted tests 通过并刷新 Codex runtime artifact。 | 已验收并转 `AlembicTest` |
| 2026-05-25 10:15 CST | 验收 | `AlembicWorkspace` | 总控完成 Plugin 代码侧验收并刷新本机 Codex plugin cache 到 `gitHead=2108a36db88bee4805a56b54f04bcfedb37b6cba`。 | 发送给 `AlembicTest` |
| 2026-05-25 10:15 CST | 复测 | `AlembicTest` | 复跑四个绑定 folder Plugin probes 和 Dashboard 摘要 / 详情最小检查。 | 当前发送 |
| 2026-05-25 本轮 | 回填 | `AlembicTest` | `MRPS-P6-Preflight-Retest` 通过：四绑定 source folder 的 `health` / `prime` / `search(auto/semantic)` 均成功，带同一 ProjectScope execution telemetry；未新增或修改 source folder `.asd/` / `Alembic/` runtime data。 | 四文件夹通过，覆盖不足 |
| 2026-05-25 10:42 CST | 复核 | `AlembicWorkspace` / 用户 | 用户发现 `AlembicAgent` 未加入项目；总控确认 P6 覆盖不足，创建 P7 五文件夹补测。 | 发送给 `AlembicTest` |
| 2026-05-25 本轮 | 回填 | `AlembicTest` | `MRPS-P7-Agent-Folder-Coverage` 通过：`AlembicAgent` 加入同一 ProjectScope，五个 source folder 的 health / prime / search 均成功并带 telemetry，Dashboard 显示 `5 个源文件夹`，source folder 无 runtime 写入。 | 总控验收通过 |

## 任务包

原真实阻塞点：Plugin resident-backed tools 已可见，但执行阶段仍按当前 source folder 做 excluded-project 短路，导致 `health` / `prime` / `search` 不进入 ProjectScope resident route。

当前状态：`AlembicPlugin` 已完成 preflight、execution context、telemetry、targeted tests 和 runtime artifact 刷新；`AlembicTest` 已完成四绑定 folder 复测，并已在 P7 补齐 `AlembicAgent` 第五 source folder 覆盖；总控验收通过。

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| MRPS-P6-PLUGIN-PREFLIGHT | `AlembicPlugin` | 修复 ProjectScope-aware tool execution preflight，使 `health` / `prime` / `search` 在绑定 folders 中使用 ProjectScope controlRoot / ghost dataRoot 执行。 | 代码侧已验收 |
| MRPS-P6-PREFLIGHT-RETEST | `AlembicTest` | 复测四绑定 source folder 的 Plugin `health` / `prime` / `search` execution preflight、ProjectScope telemetry、baseline 和无 source folder runtime 写入。 | 四文件夹通过，覆盖不足 |
| MRPS-P7-AGENT-FOLDER-RETEST | `AlembicTest` | 把 `AlembicAgent` 作为第五个 source folder 加入同一 ProjectScope，复测五文件夹 identity、resident tools、health / prime / search、Dashboard folder count 和无 source folder 写入。 | 总控验收通过 |

### MRPS-P7-AGENT-FOLDER-RETEST：补齐 AlembicAgent 第五 source folder

窗口：`AlembicTest`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 10:42 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 本轮

当前阶段目标：

- 把 `AlembicAgent` 加入 AlembicWorkspace 当前 ProjectScope 的 source folders，使 `folderCount=5`。
- 证明五个 Alembic 系列 source folder：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicPlugin`、`AlembicDashboard` 均指向同一 `projectScopeId` 和 ghost dataRoot。
- 从 `AlembicAgent` folder 完整复测 Plugin `status` / `diagnostics` / `tools/list` / `alembic_health` / `alembic_task prime` / `alembic_search(auto/semantic)`；另外四个 folder 做最小回归。
- 证明 Dashboard ProjectScope panel 展示五个 source folders，且 `controlRoot` 仍不进入 `folders[]`。
- 证明五个 source folder 下没有新增或修改 `.asd/` / `Alembic/` runtime data。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、`docs/workspace/current/workspace-current-status.md`、本文档、`docs/workspace/current/alembic-test-exchange.md` 和 `AlembicTest/AGENTS.md`，并声明当前窗口定位和本轮职责。
- 复用 P6 probe / test-mode 路径，把测试范围从四个 source folder 扩展到五个。
- 不改 `AlembicAgent` 代码；本轮只验证它作为 source folder 被 ProjectScope 纳入。

可一起关闭的 TODO：

- `GTODO-2026-05-24-036` 的最终覆盖缺口：五个 Alembic 系列仓库作为一个抽象 Project 的可用闭环。

明确不包含：

- 不实现 folder remove / disable。
- 不实现 project-level skill visibility mount。
- 不跑 full cold-start。
- 不修改产品仓库代码或真实测试项目业务源码。
- 不扩大 `AlembicAgent` 内部 tool root。

下一处真实阻塞点：

- 如果 `AlembicAgent` 无法加入同一 ProjectScope，或加入后 Plugin / Dashboard / no-write 复测失败，multi-root ProjectScope 主线仍不能归档。

阻塞点之前还能做：

- 本包应一次完成 `AlembicAgent` folder add、五文件夹 ProjectScope identity 检查、五文件夹 Plugin probes、Dashboard folder count 检查、source folder 写入检查和报告回填；不要只确认 Dashboard 列表里出现 `AlembicAgent` 就结束。

统一验证命令：

```text
# 由 AlembicTest 窗口按 AlembicTest/AGENTS.md 选择等价最小命令。
# 建议复用 P6 probes，并把 source folder 列表扩展为五个。
```

回填要求：

- 完成范围、绑定清单、验证命令和结果。
- 五个 source folder 的 `status` / `diagnostics` / `tools/list` / `health` / `prime` / `search` 摘要。
- ProjectScope telemetry、Dashboard folder count / DOM 或截图证据。
- 五个 source folder 前后 `.asd/` / `Alembic/` runtime data 写入检查。
- 真实项目 git 状态、遗留风险和下一步建议。

回填结果：

- 结论：通过，已总控验收。
- 报告：[../../../AlembicTest/docs/multi-root-project-scope-agent-folder-coverage-2026-05-25.md](../../../../../AlembicTest/docs/multi-root-project-scope-agent-folder-coverage-2026-05-25.md)
- 绑定清单：`folderCount=5`，`Alembic=folder-278cdc6c8560(primary-source)`、`AlembicCore=folder-94c596418c32(source)`、`AlembicAgent=folder-8cd66f5af7fc(source)`、`AlembicPlugin=folder-13b22158ca25(source)`、`AlembicDashboard=folder-b5c9f02bf50a(source)`，`controlRootIncludedInFolders=false`。
- 验证结果：五个 source folder 的 Plugin `status` / `diagnostics` 均为 `project-scope`；tools/list 均包含 `alembic_task` / `alembic_search` / `alembic_health`；`alembic_health`、`alembic_task prime`、`alembic_search(auto/semantic)` 均成功。
- telemetry：五个 folder 的 health / prime / search 均带 `codexProjectScopeExecution.enabled=true`、`projectScopeId=project-scope-a8083fdb335c`、`serviceScopeId=project-scope:project-scope-a8083fdb335c`、ghost dataRoot `~/.asd/workspaces/ecf32806` 和对应 `currentFolderId`。
- Dashboard：右侧 in-app browser 项目控制弹层显示 `ProjectScope 范围`、`5 个源文件夹`，并列出 `AlembicAgent`；弹层正文未出现 `remove` / `disable` / `移除` / `删除` / `禁用` / `停用`；证据 `AlembicTest/tmp/mrps-p7-dashboard-projectscope-popover-body.txt` / `.html` / `.png`。
- source folder no-write：前后 stat 输出一致，仅保留 P7 前已有 `Alembic/.asd/**` 和 `AlembicPlugin/.asd/**` 历史目录；未在 `AlembicAgent` / `AlembicCore` / `AlembicDashboard` 下新增 `.asd/` 或 `Alembic/` runtime data。
- git 状态：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicPlugin`、`AlembicDashboard`、`BiliDili` 均 clean；`AlembicTest` / `AlembicWorkspace` 保留前序未提交文档和本轮报告 / 回填。

### 总控代码侧验收

验收时间：2026-05-25 10:15 CST

验收结论：`AlembicPlugin` Wave 5 代码侧通过，可进入 `AlembicTest` 真实四绑定目录复测。

代码证据：

- `AlembicPlugin` 工作区干净，HEAD 为 `2108a36db88bee4805a56b54f04bcfedb37b6cba`（`fix: allow project scope tool execution preflight`）。
- `AlembicPlugin/plugins/alembic-codex` 工作区干净，HEAD 为 `ced1bcc091eac2e980c09449e13d98abdda9bc79`（`chore: refresh project scope preflight runtime`）。
- `lib/shared/project-scope-runtime.ts` 新增 `ALEMBIC_CODEX_PROJECT_SCOPE_SUMMARY` 读写、ProjectScope summary -> descriptor 转换，以及 current folder / controlRoot / source folders 匹配判断。
- `lib/external/mcp/McpServer.ts` 的 excluded-project 初始化拒绝仍保留；只有 ProjectScope summary 标记为 `ghost` 且当前 folder 属于同一 ProjectScope 时才跳过源码 folder 拦截。
- `lib/external/mcp/CodexMcpServer.ts` 在 Plugin-owned MCP execution 中注入 ProjectScope summary，并在成功结果中附加 `data.codexProjectScopeExecution`，便于复测确认 execution context。
- `test/unit/CodexMcpServer.test.ts` 覆盖 excluded source folder 下 `alembic_health`、`alembic_search(auto)`、`alembic_task prime` 成功执行，且断言 source folder 下没有创建 `.asd/` 或 `Alembic/`。

总控复核命令：

```text
git -C AlembicPlugin diff --check HEAD^ HEAD
git -C AlembicPlugin/plugins/alembic-codex diff --check HEAD^ HEAD
npm test -- CodexMcpServer
npm run typecheck
npm run verify:codex-plugin
npm run dev:codex-plugin:refresh
```

复核结果：

- `git diff --check` 两处均通过。
- `npm test -- CodexMcpServer` 通过，1 file / 38 tests；其中包含 `executes ProjectScope resident-backed tools from an excluded source folder without source writes`。
- `npm run typecheck` 通过。
- `npm run verify:codex-plugin` 通过。
- `npm run dev:codex-plugin:refresh` 通过，刷新目标为 `/Users/gaoxuefeng/.codex/plugins/cache/gxfn/alembic-codex/0.2.0`；marker 显示 `gitHead=2108a36db88bee4805a56b54f04bcfedb37b6cba`，runtime tarball hash `b964d707e8636e8f1574c72bd7b5ffce44359f76164812e7d1f2e13565ec63fa`。

验收限制：

- 总控没有直接跑真实 AlembicWorkspace 四绑定目录 smoke；按 workspace 测试边界，真实复测交给 `AlembicTest`。
- 下一步重点不是重新验证 Plugin 单测，而是确认本机已刷新 runtime 在 `Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard` 四个绑定 source folder 中真实执行 `health` / `prime` / `search`。

### MRPS-P6-PLUGIN-PREFLIGHT：ProjectScope tool execution preflight 返修

窗口：`AlembicPlugin`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 本轮

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 10:03 CST

当前阶段目标：

- 从任一已绑定 source folder 启动 Plugin 时，`status` / `diagnostics` / `tools/list` 已识别的 ProjectScope identity 必须继续传递到 `alembic_health`、`alembic_task prime` 和 `alembic_search` 的执行预检与 resident route。
- `health` / `prime` / `search` 不再因为当前 folder 是 Alembic 系列源码仓库而被 excluded-project preflight 拦截；执行上下文应使用 ProjectScope controlRoot / ghost dataRoot。
- 未绑定 folder 或 ProjectScope 不可用时，baseline 降级行为保持不变。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、`docs/workspace/current/workspace-current-status.md`、本文档、`docs/workspace/current/alembic-test-exchange.md` 和 `AlembicPlugin/AGENTS.md`，并声明当前窗口定位和本轮职责。
- 深入读取 `AlembicPlugin` 的 `CodexMcpServer`、tool policy / visibility、preflight、host project alignment、resident service client、`alembic_health`、`alembic_task prime`、`alembic_search` 调用链。
- 找到当前 health / prime / search 执行阶段仍用 source folder 做 excluded-project 判断的位置，改为 ProjectScope-aware execution context。
- 明确三态：无 Alembic / 无 resident 时 baseline 不暴露 resident tools；ProjectScope identity 已解析且 resident 可用时允许 resident-backed tools 执行；resident 请求失败时记录为 resident request failure，而不是 excluded source folder。
- 补 telemetry / diagnostics：成功路径应能回填或暴露 `projectScopeId` / `serviceScopeId` / dataRoot 来源，便于 `AlembicTest` 复测。
- 补 targeted tests 覆盖四类场景：绑定 source folder 成功执行 preflight、controlRoot 执行、未绑定 baseline、ProjectScope identity 已解析但 resident 请求失败。
- 如果 packaged runtime 受影响，刷新 runtime artifact 并回填 artifact 提交 hash。

可一起关闭的 TODO：

- `GTODO-2026-05-24-036` 的当前主线剩余缺口：ProjectScope Plugin consumer execution 闭合。

明确不包含：

- 不修改 `Alembic` ProjectScope producer、CLI、daemon API，除非代码发现真实 contract 缺失并先回填阻塞。
- 不修改 `AlembicDashboard` UI；Dashboard P5 已通过。
- 不修改 `AlembicCore` contract；若需要新增 contract，先回填总控，不在 Plugin 中私造。
- 不实现 folder remove / disable。
- 不实现 project skill runtime export / skill visibility mount。
- 不关闭或绕过所有 excluded-project 保护。

下一处真实阻塞点：

- 如果 Plugin 无法把已解析的 ProjectScope identity 传递到 tool execution preflight，AlembicWorkspace 自用 Plugin 闭环仍不能通过真实复测。

阻塞点之前还能做：

- 本包应一次完成 preflight 修复、health / prime / search 真实调用链、targeted tests、runtime artifact 刷新、诊断 / telemetry 回填；不要只改 `tools/list` 或 status 文案。

文件 / 模块边界：

- 允许：`AlembicPlugin` MCP server、tool policy / preflight、resident service client、host project alignment、health / prime / search handlers、runtime artifact 和相关 tests。
- 禁止：`Alembic` producer、`AlembicDashboard` UI、`AlembicAgent` runtime、真实测试项目源码。
- orphan 清理：只清理由本次改动产生的 orphan；无关 dead code 先记录，不直接删除。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 如果无法确认目标仓库定位，先停下回填阻塞，不继续扫描、改文档或写代码。

阻塞 / 依赖：

- 上游 `AlembicCore` / `Alembic` / `AlembicDashboard` 均已验收；本包不等待新提交。
- 下游 `AlembicTest` 复测必须等待本包回填提交 hash、runtime artifact hash 和验证结果。

统一验证命令：

```text
# 由 AlembicPlugin 窗口按 AlembicPlugin/AGENTS.md 选择等价命令。
npm test -- AlembicResidentServiceClient CodexMcpServer CodexStatusService SearchHandlerResidentSearch PrimeSearchPipelineResidentSearch
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

- 回填时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 10:03 CST
- 完成范围：`AlembicPlugin` 已完成 ProjectScope-aware Plugin-owned tool execution preflight 返修；`alembic_health` / `alembic_search(auto)` / `alembic_task prime` 在被 `@alembic/*` 规则排除的绑定 source folder 中可通过已解析 resident ProjectScope identity 执行，并保持未绑定 / 无 resident baseline 保护。
- 文件 / 模块变化：新增 `lib/shared/project-scope-runtime.ts` 负责 ProjectScope summary env 读写与 summary→descriptor 转换；`lib/bootstrap.ts` 让 `WorkspaceResolver` 消费该 ProjectScope descriptor 并使用 ghost dataRoot；`lib/external/mcp/McpServer.ts` 仅在 ProjectScope summary 与当前 folder 匹配且 storage 为 ghost 时跳过 excluded source folder 初始化拒绝；`lib/external/mcp/CodexMcpServer.ts` 将 resident ProjectScope identity 注入 Plugin-owned MCP execution context 并在结果中附加 `codexProjectScopeExecution`；`test/unit/CodexMcpServer.test.ts` 增加 excluded source folder 下 `health/search/prime` 成功执行且不写 source folder 的回归测试。
- 提交 hash：`AlembicPlugin` `2108a36db88bee4805a56b54f04bcfedb37b6cba`
- runtime artifact 提交 hash（如有）：`plugins/alembic-codex` `ced1bcc091eac2e980c09449e13d98abdda9bc79`
- runtime artifact SHA-256：`b964d707e8636e8f1574c72bd7b5ffce44359f76164812e7d1f2e13565ec63fa`
- 验证命令和结果：`npm test -- AlembicResidentServiceClient CodexMcpServer CodexStatusService SearchHandlerResidentSearch PrimeSearchPipelineResidentSearch` 通过（5 files / 57 tests）；`npm test -- CodexMcpServer` 通过（1 file / 38 tests）；`npm run typecheck` 通过；`npm run lint` 通过；`npm run build` 通过（Core build used `../AlembicCore @ b72390f2066f6406ce432b7dc94448dcd05862a3`）；`npm run prepare:codex-plugin-runtime` 通过；`npm run verify:codex-plugin` 通过；`npm run verify:codex-channel` 通过；`npm run check` 通过；`git diff --check` 通过。
- P5 失败点对应修复证据：新增单测构造 `@alembic/plugin` excluded source folder、active ProjectScope controlRoot、ghost dataRoot 和 resident `/api/v1/project-scope/resolve-folder` / `/api/v1/search` 响应；断言 `alembic_health` 成功、`alembic_search(auto)` 带 resident ProjectScope telemetry、`alembic_task prime` delivered，且 source folder 下未创建 `.asd/` 或 `Alembic/`。
- telemetry / diagnostics 变化：成功路径的 Plugin-owned tool result 新增 `data.codexProjectScopeExecution`，包含 `projectScopeId`、`serviceScopeId`、`controlRoot`、`currentFolderId`、`currentFolderPath`、`dataRoot`、`mode` 和启用原因；search / prime 继续保留 resident search `projectScopeIdentity` telemetry。
- 已关闭 TODO 证据：`GTODO-2026-05-24-036` 的 Plugin consumer execution 代码侧缺口已由提交 `2108a36...` 关闭，进入 `AlembicTest` 真实复测门。
- 未关闭 TODO 去向：`GTODO-2026-05-24-030` project-level skill visibility mount 仍不属于本波；Dashboard 侧 `GTODO-2026-05-25-001` P5 已通过，保持已完成待归档。
- 遗留风险：当前为 Plugin 内 targeted / artifact 验收；仍需 `AlembicTest` 在真实四绑定 folder 中复测 `health` / `prime` / `search(auto/semantic)`，确认本机 Codex plugin cache 刷新后消费到 runtime artifact `ced1bcc...`。
- 下一步建议：总控验收 `AlembicPlugin` 提交后，发送 `AlembicTest` 复跑 P5 失败点；复测前刷新本机 Codex plugin cache / marketplace runtime artifact 到 `ced1bcc091eac2e980c09449e13d98abdda9bc79`。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 / 推荐窗口 | 事项 / 目标 | 影响复测 / 派发 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-24-036 | 已完成待归档 | multi-root project scope | P0 | `AlembicTest` | ProjectScope identity / tools-list 已通过；Plugin `health` / `prime` / `search` execution preflight 已在五个 source folder 真实复测通过，`AlembicAgent` 已加入同一 ProjectScope。 | 否 | P7 总控验收通过；后续归档时从全局 TODO 移出。 |
| GTODO-2026-05-25-001 | 已完成待移出 TODO | dashboard information architecture | P1 | `AlembicDashboard` / `AlembicTest` | Dashboard ProjectScope 面板外层收敛为项目级摘要，详情折叠后显示技术字段和 source folder 操作。 | 否 | P5 DOM / 截图已通过；本波作为已完成证据保留，后续归档时从全局 TODO 移出。 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 / 观察 | 否 | ProjectScope producer、daemon API、resolve-folder、search meta 在 P5 通过；本波不修改。 |
| `AlembicCore` | 已完成 | 否 | Core contract 已验收；当前断点是 Plugin execution preflight，不是 contract 缺口。 |
| `AlembicAgent` | 观察中 | 否 | 本轮只作为第五个 source folder 进入 ProjectScope 复测，不改 AlembicAgent 内部代码。 |
| `AlembicDashboard` | 已完成 | 否 | P5 真实 UI 验证通过，`GTODO-2026-05-25-001` 可关闭。 |
| `AlembicPlugin` | 已完成 | 否 | `MRPS-P6-PLUGIN-PREFLIGHT` 已通过总控代码侧验收。 |
| `AlembicTest` | 已完成 | 否 | `Test-2026-05-25-04 / MRPS-P7-Agent-Folder-Coverage` 已总控验收通过；当前无测试任务。 |
| `BiliDili` | 无任务 | 否 | 不改真实 iOS 项目源码。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | Wave 2 producer 已通过，P5 daemon / API / ProjectScope resolve 继续通过；本波无任务。 |
| `AlembicCore`<br>已完成 | Wave 1 contract 已通过；本波无任务。 |
| `AlembicAgent`<br>观察中 | 本轮只作为第五个 source folder 进入 ProjectScope 复测；不改内部 tool root 或代码。 |
| `AlembicDashboard`<br>已完成 | Wave 4 面板返修已由 P5 DOM / 截图验证通过；本波无任务。 |
| `AlembicPlugin`<br>已完成 | `MRPS-P6-PLUGIN-PREFLIGHT` 已通过总控代码侧验收：提交 `2108a36db88bee4805a56b54f04bcfedb37b6cba`，runtime artifact 提交 `ced1bcc091eac2e980c09449e13d98abdda9bc79`。 |
| `AlembicTest`<br>已完成 | P7 五文件夹补测已通过并完成总控验收；当前无测试任务。 |
| `BiliDili`<br>无任务 | 不参与本轮。 |

## 可复制分派提示词

发送给：无。P7 已完成总控验收，无新的执行窗口提示词。

## AlembicTest P7 复测结论

`AlembicTest` P7 已在 P6 基础上补齐并通过总控验收：

- 把 `AlembicAgent` 加入同一 ProjectScope source folders，最终绑定清单必须是五个 Alembic 系列仓库。
- 五个 folder 均覆盖 `status` / `diagnostics` / `tools/list` / `alembic_health` / `alembic_task prime` / `alembic_search(auto/semantic)`。
- `health` / `prime` / `search` 不返回 excluded-project preflight 错误；response / telemetry 可定位同一 `projectScopeId`。
- Dashboard folder count / details 包含 `AlembicAgent`。
- source folder no-write 通过。

本轮未重跑未绑定临时 folder baseline；P6 已证明 baseline 降级仍不暴露 resident tools，P7 只补齐五文件夹覆盖缺口。
