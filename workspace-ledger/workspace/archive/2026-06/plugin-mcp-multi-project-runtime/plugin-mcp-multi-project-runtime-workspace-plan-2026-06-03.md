# Plugin MCP Multi Project Runtime Workspace Plan

日期：2026-06-03
状态：已完成 / PMMPR Stage 5 P7 通过，总控验收通过
发送给：无
总控定位：本文件是 AlembicWorkspace 当前总控计划；只承载目标裁决、窗口分派、TODO 归口、测试交接和验收回填，不承载产品实现。

## 目标判断

- 用户目标：接收 `PLUGIN-MCP-MULTI-PROJECT-RUNTIME-2026-06-03`，并开启自动化推进。
- 最终完成定义：把 AlembicPlugin Codex MCP 多项目行为收敛为固定链路 `entry mode -> current real folder -> ghost project identity / dataRoot -> project space membership -> required service -> readiness / failure envelope`；per-window prime 稳定使用当前窗口真实 projectRoot 对应的 ghost 知识库；Alembic 主体只在 tool 需要且 identity 精确匹配时提供 on-demand resident-service handshake；local-dev restart/reload、packaged wrapper、status/diagnostics/job/cleanup/dashboard handoff、failure envelope 都围绕同一 identity/readiness contract 工作。
- 当前是否已经达到：已达到。Design 需求已 ready，Stage 0 三窗口只读 inventory 已回填并经总控抽查复核；Stage 1A producer contract 已由 AlembicCore / Alembic 实现并经总控复核；Stage 1B Plugin consumer 已由 AlembicPlugin 实现并经总控复核；Stage 2 Plugin startup/reload 已由 AlembicPlugin 实现并经总控复核；Stage 3/4 P4 初次回填未通过总控验收；P4R AlembicPlugin commit `4e5c3f98c1b4839c6d69f78ac216c15960447865` 与 runtime 子仓 commit `46b78ba242982e70743dc96e768a78d4795c31b8` 已通过总控复核；Stage 5 AlembicTest real smoke 初次回填为 blocked，经总控复核确认 direct packaged identity subset 通过，但 packaged npx wrapper 与 daemon recovery 两条真实 smoke 路径未通过；P6 AlembicPlugin commit `0cc1c5ca64e4e8c033aba9dd434412c4dc74c7c0` 与 runtime 子仓 commit `7b86de81d1102dc9c2a88cc9749cb29aa093320b` 已通过功能 smoke 复核，但总控复跑 `npm run prepare:codex-plugin-runtime` 后 runtime 子仓出现未提交产物差异，不能验收；P6R AlembicPlugin 父仓 commit `f0a94e929627d1e2b54045889ff6335153e082f6` 与 runtime 子仓 commit `e8ae2157631bb86a0654e2865415a893bc4755a6` 已通过总控复核；P7 AlembicTest 真实 installed / packaged Plugin MCP runtime smoke 已通过总控复核。
- 未达到时剩余差距：无当前需求内剩余必做差距。
- 已达到时验收 / 归档判断：可验收本需求并停止本条自动化，不再创建下一跳。归档时保留风险边界：P7 不证明 release publication、Dashboard UX 全量体验、所有 Codex host reload 场景、所有外部安装环境或 sourceRef / candidate / Recipe 质量门禁。
- 当前任务分区：Design 交接接收 + 分配计划 + 自动化闭环。
- 不纳入本轮事项：不改产品代码；不处理相邻的 `PLUGIN-CODEX-TASK-LIFECYCLE-REDESIGN-2026-06-03`；不接管 MRI/Aux 线路；不让 AlembicTest 修改产品仓库或真实项目源码。

## 总控决策记录

- 本次决策触发：用户要求“领取 `PLUGIN-MCP-MULTI-PROJECT-RUNTIME-2026-06-03` 需求进行自动化推进”。
- 需求 / 测试结果理解：这是已由 AlembicDesign 准备好的跨 AlembicPlugin / Alembic / AlembicCore runtime reliability 需求；Stage 5 real smoke 的 blocked 回填属于原需求完成定义内的 runtime reliability 缺口，不是新需求。
- 已核对证据：
  - `AlembicDesign/docs/current/plugin-mcp-multi-project-runtime-original-plan-2026-06-03.md`
  - `AlembicDesign/docs/current/plugin-mcp-multi-project-runtime-requirement-design-2026-06-03.md`
  - `AlembicDesign/docs/current/workspace-handoff-board.md`
  - `codex-control-workspace/.wakeflow-active/current/design-handoff-inbox.md`
  - `codex-control-workspace/skills/dev/codex-automation-controller/SKILL.md`
- 是否需要先验证 / 重新计划 / 用户确认：不需要用户二次确认；P7 raw evidence 已满足当前完成定义，当前只允许验收收口、同步状态和停止本条自动化，不允许继续派发或扩大为新需求。
- 本次允许更新：当前计划、当前状态同步面、全局 TODO、Design inbox 刷新结果、automation dispatch / delivery / keep-live 本地运行态。
- 本次不得更新：产品仓库源码、产品仓库测试、真实项目、旧 watch / refresh 实现、MCP / daemon 运行进程、MRI/Aux 当前计划结论。

## Design / 需求来源

- 来源类型：AlembicDesign handoff。
- 来源文档：
  - [original-plan](../../../../../AlembicDesign/docs/current/plugin-mcp-multi-project-runtime-original-plan-2026-06-03.md)
  - [requirement-design](../../../../../AlembicDesign/docs/current/plugin-mcp-multi-project-runtime-requirement-design-2026-06-03.md)
- 用户确认状态：`confirmed`
- 用户确认说明：用户已确认该需求为独立多项目 Plugin MCP runtime 架构需求，并确认 7 个推荐路线裁决全部执行。
- handoff 状态：`ready-for-workspace`
- 主线关系状态：`interrupts-current`
- 优先级枚举：`P1`
- 总控接收结论：正式接收为当前主线；保持独立 Design Key 和独立验收，不并入 MRI/Aux 或 Plugin architecture refactor。
- 是否需要目标阶段确认：需要。本文件先确认 Stage 0；Stage 1+ 需等 Stage 0 回填后再确认。
- 是否需要代码实现依赖调研：需要，当前 Stage 0 即为只读 code inventory / contract review。

## 代码事实与边界

- 相关仓库：`AlembicPlugin`、`Alembic`、`AlembicCore`；`AlembicDashboard` 观察；`AlembicTest` 后续如需真实 Codex multi-window smoke 再启动。
- 关键入口：
  - AlembicPlugin wrapper / MCP / resident / diagnostics：`plugins/alembic-codex/bin/alembic-codex-mcp-wrapper.mjs`、`bin/codex-mcp.ts`、`lib/codex/mcp/CodexMcpServer.ts`、`lib/daemon/DaemonSupervisor.ts`、`lib/service/resident/AlembicResidentServiceClient.ts`、`lib/codex/ProjectRootResolver.ts`、`lib/codex/KnowledgeState.ts`、`lib/service/task/PrimeSearchPipeline.ts`、`scripts/dev-verify-codex-plugin.mjs`、`scripts/dev-watch-codex-plugin.mjs`、`scripts/sync-codex-plugin-cache.mjs`。
  - Alembic runtime source of truth：`lib/project-scope/ProjectScopeRegistry.ts`、`lib/daemon/DaemonSupervisor.ts`、`lib/daemon/ProjectRuntimeControl.ts`、`bin/daemon-server.ts`、`lib/http/routes/daemon.ts`、`lib/http/routes/project-scope.ts`。
  - AlembicCore shared primitives：`src/shared/WorkspaceResolver.ts`、`src/daemon/DaemonState.ts`、`src/daemon/JobStore.ts`。
- producer / consumer 依赖：AlembicCore 候选提供 shared identity/readiness/failure primitives；Alembic 提供 ProjectScope/runtime-control/local daemon source of truth 和 adapter；AlembicPlugin 只做 Codex-facing presentation / MCP lifecycle / failure envelope 输出。
- 不可提前消费的上游：Stage 1 实现不得早于 Stage 0 contract inventory；AlembicPlugin 不得自造另一套 resolver；Alembic 不得被 Plugin 写 active/selected project。
- 不允许触碰的目录 / 仓库：不改 `BiliDili` / `Playground` / 真实项目；不在本轮修改产品源码；不记录真实 thread id 到 tracked 文档。
- 真实测试项目是否涉及：本轮不涉及。真实 multi-window MCP / daemon restart smoke 仅作为 Stage 1+ 后的 P1 补证候选。

## 阶段顺序

1. Stage 0：只读 contract inventory，三窗口分别复核代码事实、字段建议、删除影响和实施顺序，不改代码。已验收。
2. Stage 1A：producer contract。AlembicCore 收敛 shared ProjectIdentity / RuntimeReadiness / FailureEnvelope；Alembic 产出 ProjectScope/runtime-control/daemon source-of-truth adapter。已验收。
3. Stage 1B：Plugin consumer / presentation。AlembicPlugin 消费 Stage 1A contract，统一 Codex-facing runtime context、required-service decision 和 failure envelope。已验收。
4. Stage 2：Plugin MCP entry mode and startup reliability，区分 local-dev restart/reload 与 packaged wrapper/runtime.tgz。已验收。
5. Stage 3：Plugin tool runtime unification，status / diagnostics / dashboard / job / cleanup / resident probe 共用 identity chain。P4R 已验收。
6. Stage 4：Failure cleanup and Alembic daemon restart alignment，删除或隔离 embedded / JobStore / saved-root / selected fallback。P4R 已验收。
7. Stage 5：真实 smoke / regression，AlembicTest 回填 blocked，总控已复核原始证据。
8. P6 返工：AlembicPlugin 修复 packaged npx wrapper startup-lock 父目录缺失与 packaged daemon recovery readiness/lifecycle；功能 smoke 已通过，但 runtime 产物一致性未通过总控验收。
9. P6R 收口：AlembicPlugin 提交或清理 `prepare:codex-plugin-runtime` 后产生的 runtime 子仓差异，保证验证后双仓 clean；已通过总控复核。
10. P7 复跑：AlembicTest 复跑 Stage 5 真实 installed / packaged Plugin MCP runtime smoke；已通过总控复核。

- 下一处真实阻塞点：无。当前需求完成定义已满足。
- 阻塞点之前还能做：同步状态、停止本条自动化、等待用户是否要求提交 / 归档。
- 当前可派发窗口：无。
- 当前阻塞 / 观察窗口：无。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| PMMPR-STAGE0-PLUGIN-P0 | `AlembicPlugin` | 只读复核 Codex MCP wrapper / projectRoot / prime / resident / status-job-cleanup-dashboard / local-dev restart 边界。 | 已验收 |
| PMMPR-STAGE0-ALEMBIC-P0 | `Alembic` | 只读复核 ProjectScope runtime source of truth、daemon stale、runtime-control stale active/selected 与 resident routes。 | 已验收 |
| PMMPR-STAGE0-CORE-P0 | `AlembicCore` | 只读复核 WorkspaceResolver / DaemonState / JobStore shared primitive 和 ProjectScope descriptor 边界。 | 已验收 |
| PMMPR-STAGE1-CORE-P1 | `AlembicCore` | 收敛 shared ProjectIdentity / RuntimeReadiness / FailureEnvelope contract，优先复用 RuntimeContracts / ProjectRuntimeContracts。 | 已验收 |
| PMMPR-STAGE1-ALEMBIC-P1 | `Alembic` | 基于 Core contract 产出 ProjectScope/runtime-control/daemon source-of-truth adapter，区分诊断读取与显式 runtime action。 | 已验收 |
| PMMPR-STAGE1-PLUGIN-P2 | `AlembicPlugin` | 消费 Core/Alembic producer contract，统一 Codex-facing runtime context / required service / failure envelope。 | 已验收 |
| PMMPR-STAGE2-PLUGIN-P3 | `AlembicPlugin` | 实现 canonical local-dev restart/reload，并修正 packaged wrapper startup lock / diagnostics。 | 已验收 |
| PMMPR-STAGE3-4-PLUGIN-P4 | `AlembicPlugin` | 收敛 Plugin tool runtime identity chain，并删除或显式隔离 embedded / JobStore / saved-root / selected fallback。 | 未通过总控验收 |
| PMMPR-STAGE3-4-PLUGIN-P4R | `AlembicPlugin` | 修复 plugin-owned tool 无 resident ProjectScope 时缺失 `projectRuntime`，补测试并刷新 packaged runtime。 | 已验收 |
| PMMPR-STAGE5-TEST-P5 | `AlembicTest` | 真实 Plugin MCP runtime smoke，复核 installed / packaged runtime 在多项目 / daemon stopped / resident readiness 路径下的 identity/readiness/failure surface。 | blocked / 待 Plugin 返工 |
| PMMPR-STAGE5-PLUGIN-P6 | `AlembicPlugin` | 修复 Stage 5 暴露的 packaged wrapper startup-lock 父目录缺失与 packaged daemon recovery readiness/lifecycle。 | 功能通过 / runtime dirty，未验收 |
| PMMPR-STAGE5-PLUGIN-P6R | `AlembicPlugin` | 提交或清理 P6 后 `prepare:codex-plugin-runtime` 生成的 runtime 子仓差异，保证验证后双仓 clean。 | 已验收 |
| PMMPR-STAGE5-TEST-P7 | `AlembicTest` | 复跑 Stage 5 真实 installed / packaged Plugin MCP runtime smoke，验证 P6/P6R 后原 blocker 是否关闭。 | 已验收 |

### PMMPR-STAGE0-PLUGIN-P0：AlembicPlugin 只读 contract inventory

窗口：`AlembicPlugin`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 17:44 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 17:44 CST

阶段目标：

- 复核 AlembicPlugin 当前 Codex-facing MCP runtime、wrapper、resident client、prime、status / diagnostics / job / cleanup / dashboard handoff、local-dev restart/reload 的真实代码事实。

主线动作：

- 读取 AlembicPlugin `AGENTS.md` 和本计划。
- 只读复核 Design 指定关键文件和最新提交。
- 输出 Plugin 侧 inventory：entry mode matrix、projectRoot/dataRoot resolution chain、required service mapping、failure envelope 字段建议、legacy fallback 删除 / 隔离清单、canonical local-dev restart/reload 完整验证闭环。

合并 TODO：

- `PMMPR-2` wrapper startup lock scope/release/diagnostics。
- `PMMPR-4` status/job/cleanup/dashboard/diagnostics 统一 identity chain。
- `PMMPR-8` prime per-window project-scope contract。
- `PMMPR-9` MCP entry diagnostics。
- `PMMPR-10` canonical local-dev restart/reload。
- `PMMPR-13` embedded / JobStore / saved-root / selected fallback 删除或隔离。

明确不包含：

- 不改代码、不提交、不启动/停止 MCP 进程、不刷新插件缓存、不运行真实 Codex 多窗口 smoke。

下一处真实阻塞点：

- Plugin 侧旧 fallback / entry mode / failure envelope 的真实代码边界未复核。

阻塞点之前还能做：

- 静态代码 inventory、测试覆盖建议、后续 Stage 1+ 任务拆分建议。

验证命令：

```text
git status --short
git diff --check
```

回填要求：

- 完成范围：只读 inventory。
- 提交 hash：无，除非本任务被错误改代码则必须停止并说明。
- 证据：关键文件路径、摘录的代码事实、当前测试/脚本入口、建议 contract 字段、删除影响、后续任务建议。
- 遗留风险：真实 MCP multi-window / restart smoke 是否需要 AlembicTest。
- 下一步建议：Stage 1+ Plugin 实施包边界。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 AlembicPlugin `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 只读，不改代码。

### PMMPR-STAGE0-ALEMBIC-P0：Alembic 只读 contract inventory

窗口：`Alembic`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 17:44 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 17:44 CST

阶段目标：

- 复核 Alembic 主体作为 ProjectScope/runtime-control/local daemon source of truth 的当前代码事实和可供 Plugin on-demand handshake 消费的 adapter 边界。

主线动作：

- 读取 Alembic `AGENTS.md` 和本计划。
- 只读复核 ProjectScopeRegistry、resolveAlembicDaemonPaths、DaemonSupervisor stale/build 判断、ProjectRuntimeControl snapshot / stale active-selected、daemon health / project-scope routes。
- 输出 Alembic 侧 inventory：runtime source-of-truth 字段、stale/selected/active taxonomy、resident readiness payload、ProjectScope adapter 提议、不能被 Plugin 写入的边界。

合并 TODO：

- `PMMPR-3` stale/version/build readiness 对齐。
- `PMMPR-6` runtime-control stale active/selected 清理策略。
- `PMMPR-12` 统一 failure reason 中 Alembic source-of-truth 输入。

明确不包含：

- 不改代码、不提交、不启动/停止 daemon、不切换 active/selected project。

下一处真实阻塞点：

- Alembic 侧 source-of-truth / adapter 边界未复核。

阻塞点之前还能做：

- 静态代码 inventory、字段建议、Stage 1 producer/adapter 任务建议。

验证命令：

```text
git status --short
git diff --check
```

回填要求：

- 完成范围：只读 inventory。
- 提交 hash：无。
- 证据：关键文件路径、代码事实、runtime-control stale 行为判断、ProjectScope adapter 建议。
- 遗留风险：是否需要真实 daemon restart smoke。
- 下一步建议：Alembic Stage 1+ producer/adaptor 实施包边界。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 Alembic `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 只读，不改代码。

### PMMPR-STAGE0-CORE-P0：AlembicCore 只读 contract inventory

窗口：`AlembicCore`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 17:44 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 17:44 CST

阶段目标：

- 复核 AlembicCore 当前 WorkspaceResolver / DaemonState / JobStore shared primitive 是否适合作为 ProjectIdentity / RuntimeReadiness / FailureEnvelope contract 的基础。

主线动作：

- 读取 AlembicCore `AGENTS.md` 和本计划。
- 只读复核 WorkspaceResolver standard/ghost/ProjectScope descriptor 行为、resolveDaemonPaths、DaemonState、JobStore path assumptions。
- 输出 Core 侧 inventory：可共享 contract 字段、不能读取 Alembic-only runtime-control 的边界、ProjectScope descriptor 输入输出、JobStore fail-closed 建议。

合并 TODO：

- `PMMPR-1` shared ProjectIdentity / RuntimeReadiness / FailureEnvelope contract。
- `PMMPR-11` unified identity chain。
- `PMMPR-13` old JobStore fallback 删除或隔离边界。

明确不包含：

- 不改代码、不提交、不把 Alembic-only registry 读取下沉到 Core。

下一处真实阻塞点：

- Core shared primitive 归属与字段命名未复核。

阻塞点之前还能做：

- 静态代码 inventory、字段建议、Stage 1 producer contract 任务建议。

验证命令：

```text
git status --short
git diff --check
```

回填要求：

- 完成范围：只读 inventory。
- 提交 hash：无。
- 证据：关键文件路径、代码事实、字段建议、Core boundary / non-goals。
- 遗留风险：Core shared type 与 Alembic ProjectScope adapter 的接口风险。
- 下一步建议：Core Stage 1+ shared contract 实施包边界。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 AlembicCore `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 只读，不改代码。

### PMMPR-STAGE1-PLUGIN-P2：AlembicPlugin consumer / presentation

窗口：`AlembicPlugin`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 18:34 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 19:11 CST

阶段目标：

- 消费 Stage 1A 已落地的 Core shared contract 与 Alembic source-of-truth adapter，统一 Plugin Codex-facing runtime context、required-service decision、readiness/failure envelope。

主线动作：

- 读取 AlembicPlugin `AGENTS.md`、本计划、Stage 1A 两个提交：AlembicCore `dc6a443b023f5779efe7cce37f204688b828b0e3` 与 Alembic `c3b51c388fcfd453f3349334de1cc0ee6e286fba`。
- 在 Plugin 内实现单一 presentation/context 层，输出 `entryMode`、effective project identity、required service、readiness、failure envelope 和 source-of-truth/read-only diagnostics 字段。
- 将 status、diagnostics、prime metadata、dashboard handoff、job read/enqueue、cleanup dry-run / confirm 路径接入同一 context。不得让 saved-root、runtime-control selected/active 或 local JobStore fallback 成为默认 effective identity。
- 保持 Alembic source-of-truth payload 只读；任何 ProjectScope registry、runtime-control selected/active、daemon lifecycle 写动作必须是显式用户 runtime action，不得由 prime/diagnostics/status 隐式触发。

合并 TODO：

- `PMMPR-2` wrapper startup lock scope/release/diagnostics 的 readiness 表达。
- `PMMPR-4` status/job/cleanup/dashboard/diagnostics 统一 identity chain。
- `PMMPR-8` prime per-window project-scope contract。
- `PMMPR-9` MCP entry diagnostics。
- `PMMPR-10` canonical local-dev restart/reload 的可观测字段。
- `PMMPR-13` embedded / JobStore / saved-root / selected fallback 删除或隔离边界。

明确不包含：

- 不修改 AlembicCore / Alembic；不启动真实 MCP / daemon smoke；不改 Codex 全局配置；不触碰真实项目。

下一处真实阻塞点：

- Plugin consumer 是否真实消费 Core/Alembic Stage 1A contract，而不是自造新 resolver 或 presentation-only mock。

阻塞点之前还能做：

- Plugin 代码实现、focused unit tests、local type/build check、diff/commit。

验证命令：

```text
git status --short
git diff --check
npm run build
npm run test -- <focused Plugin runtime/context/status/diagnostics/prime tests>
```

回填要求：

- 完成范围：Stage 1B Plugin consumer / presentation。
- 提交 hash：必须提供 AlembicPlugin 提交 hash。
- 证据：关键 diff 摘要、Core/Alembic contract import/消费位置、focused tests 输出、status/diagnostics/prime/dashboard/job/cleanup 中至少覆盖的入口列表。
- 遗留风险：是否需要 AlembicTest 真实 multi-window MCP / daemon restart smoke。
- 下一步建议：Stage 2/3/4 是否合并继续，或是否先测试。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 AlembicPlugin `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 不得修改 AlembicCore / Alembic，不得替它们改 contract；只能消费已回填的上游 contract。

总控验收结论：

- 已验收。AlembicPlugin commit `7ca25f1a19515af530deac660799679cfc6f992b` 新增 `lib/codex/runtime/ProjectRuntimeContext.ts`，消费 `@alembic/core/daemon` ProjectRuntime contract，并在 status、diagnostics、prime、dashboard、job、cleanup 路径展示统一 `projectRuntime`。
- 总控复核：`git show --stat`、关键 diff 抽查、`git diff --check`、`npm run build`、`npm run test -- test/unit/CodexProjectRootResolver.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexMcpServer.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts`、`npm run lint`、`npm run lint:core-import-boundary` 均通过。
- 剩余风险：未启动真实 MCP / daemon smoke；canonical local-dev restart/reload 和 wrapper startup lock/reliability 仍属 Stage 2 P0 缺口。

### PMMPR-STAGE2-PLUGIN-P3：AlembicPlugin startup / local-dev restart-reload

窗口：`AlembicPlugin`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 19:11 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 19:11 CST

阶段目标：

- 实现并验收 Plugin MCP entry mode / startup reliability：local-dev 对外只保留一个 canonical restart/reload 能力，packaged wrapper startup lock 有界、可诊断，并且 diagnostics 不混淆 local-dev direct dist 与 packaged wrapper/runtime.tgz。

主线动作：

- 读取 AlembicPlugin `AGENTS.md`、本计划和 Stage 1B commit `7ca25f1a19515af530deac660799679cfc6f992b`。
- 设计并实现一个开发者可用的 canonical local-dev restart/reload 命令或等价入口，完整覆盖 build、installed cache local dist rewrite、fresh MCP probe、stop old Alembic MCP processes、next startup/readback、真实 MCP tool-call verification 新 build。
- 删除、内化或明确 deprecated 旧 `watch` / `refresh` 公共入口；不得继续把它们作为开发者需要理解和选择的公共能力。
- 修正 packaged wrapper startup lock scope/release/diagnostics；锁等待必须能说明 lock owner / wait reason / timeout / next action，并避免跨项目误卡。
- 固化 entry mode diagnostics：local-dev direct dist、packaged wrapper/runtime.tgz、unknown/stale installed cache 分开判断，不互相覆盖或误报。

合并 TODO：

- `PMMPR-2` wrapper startup lock scope/release/diagnostics。
- `PMMPR-9` MCP entry diagnostics。
- `PMMPR-10` canonical local-dev restart/reload。

明确不包含：

- 不修改 AlembicCore / Alembic；不改变 Codex host MCP 协议；不派 AlembicTest；不触碰真实项目源码；不把旧 watch/refresh 包装成新公共能力。

下一处真实阻塞点：

- Plugin 是否有可运行、可验证、可复用的 canonical local-dev restart/reload，以及 packaged wrapper lock 是否不再因 stdout/stderr ready 语义误卡。

阻塞点之前还能做：

- Plugin 代码实现、focused unit / script tests、local process smoke、diff/commit。

验证命令：

```text
git status --short
git diff --check
npm run build
npm run test -- <focused Plugin startup/reload/wrapper/diagnostics tests>
npm run lint
```

回填要求：

- 完成范围：Stage 2 Plugin startup / local-dev restart-reload。
- 提交 hash：必须提供 AlembicPlugin 提交 hash。
- 证据：关键 diff 摘要、canonical command / entry 名称、旧 watch/refresh 处理方式、wrapper lock 释放/诊断证据、focused tests 输出、至少一次本地 restart/reload 或 process smoke 报告路径。
- 遗留风险：是否仍需 AlembicTest 真实 Codex 多窗口 MCP startup / daemon restart smoke。
- 下一步建议：Stage 3/4 是否继续合并，或是否先测试。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 AlembicPlugin `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 只在 AlembicPlugin 职责范围内处理 Plugin MCP startup / local-dev / wrapper，不替 Alembic 主体改 runtime-control 或 daemon source of truth。

总控验收结论：

- 已验收。AlembicPlugin 父仓 commit `2071e160965a890c1f8b8779980053c70982f422` 新增 canonical `npm run dev:codex-plugin:reload`，将 `dev:codex-plugin:refresh` 降为兼容 alias，`dev-watch` 委托 canonical reload；runtime subrepo commit `138040a7ca6c9757b7b53a88ee468bb24ceff0b9` 修正 packaged wrapper startup lock scope、owner diagnostics 和释放信号。
- 总控复核：`git show --stat`、关键 diff 抽查、双仓 `git diff --check`、`npm run build`、focused vitest 4 files / 51 tests、`npm run lint`、`npm run verify:codex-plugin` 均通过。隔离 `CODEX_HOME` 复跑 `npm run dev:codex-plugin:reload -- --codex-home /private/tmp/alembic-plugin-stage2-codex-home-review --project-root /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin --report-path scratch/pmmpr-stage2-dev-reload-report-review.json --probe-report-path scratch/pmmpr-stage2-dev-reload-probe-report-review.json --mcp-timeout-ms 45000 --no-stop-mcp --skip-build --skip-prepare`，结果 `ok=true`，marker gitHead 指向 `2071e160965a890c1f8b8779980053c70982f422`，fresh MCP probe 通过。
- 剩余风险：总控未在当前会话执行会停止真实 MCP 进程的 reload 路径，避免影响正在使用的 Codex；真实 multi-window MCP / daemon restart smoke 仍需等 Stage 3/4 后裁决是否派 AlembicTest。

### PMMPR-STAGE3-4-PLUGIN-P4：AlembicPlugin runtime unification / fallback cleanup

窗口：`AlembicPlugin`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 19:46 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 19:46 CST

阶段目标：

- 完成 Plugin tool runtime unification 与 failure/fallback cleanup：status / diagnostics / dashboard / job / cleanup / resident probe 必须复用 Stage 1/2 同一 identity/readiness chain；embedded / JobStore / saved-root / selected fallback 只能删除或显式隔离为非 effective identity。

主线动作：

- 读取 AlembicPlugin `AGENTS.md`、本计划和 Stage 2 commit `2071e160965a890c1f8b8779980053c70982f422`。
- 审计 Plugin status、diagnostics、dashboard handoff、job enqueue/read、cleanup dry-run/confirm、resident probe、prime metadata 的 current project identity / dataRoot / readiness / failure envelope 来源。
- 对仍会影响 effective identity、落库、候选创建、tool 路由或用户可见 readiness 的 embedded / JobStore / saved-root / selected fallback，删除或显式隔离；如果某 fallback 必须保留用于只读诊断，必须在代码和 evidence 中说明其不会成为 effective identity。
- 保持 Alembic source-of-truth payload 只读；不得替 Alembic 主体改 runtime-control 或 daemon source of truth。

合并 TODO：

- `PMMPR-4` status/job/cleanup/dashboard/diagnostics 统一 identity chain。
- `PMMPR-11` unified identity chain。
- `PMMPR-12` unified failure reason 中 source-of-truth 展示。
- `PMMPR-13` embedded / JobStore / saved-root / selected fallback 删除或隔离边界。

明确不包含：

- 不修改 AlembicCore / Alembic；不改变 Codex host MCP 协议；不派 AlembicTest；不触碰真实项目源码；不把保留的诊断 fallback 重新提升为执行期 effective identity。

下一处真实阻塞点：

- Plugin 是否仍有 tool/status/job/cleanup/resident/diagnostics 路径绕过 unified ProjectRuntimeContext 或把 legacy fallback 当作 effective identity。

阻塞点之前还能做：

- Plugin 代码审计、必要清理、focused unit / script tests、diff/commit。

验证命令：

```text
git status --short
git diff --check
npm run build
npm run test -- <focused Plugin runtime/context/status/diagnostics/job/cleanup/resident tests>
npm run lint
```

回填要求：

- 完成范围：Stage 3/4 Plugin runtime unification / fallback cleanup。
- 提交 hash：必须提供 AlembicPlugin 提交 hash。
- 证据：关键 diff 摘要、fallback inventory before/after、每个保留 fallback 的隔离理由、focused tests 输出、status/diagnostics/dashboard/job/cleanup/resident 覆盖入口清单。
- 遗留风险：是否仍需 AlembicTest 真实 Codex 多窗口 MCP startup / daemon restart smoke。
- 下一步建议：进入 Stage 5 AlembicTest smoke，或由总控裁决不需要真实 smoke。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 AlembicPlugin `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 不得把 sourceRef / candidate / Recipe 等非本需求问题引入生产 gate；本任务只处理 PMMPR 已确认的 MCP runtime identity/readiness/failure cleanup。

总控验收结论：

- 未通过。AlembicPlugin commit `f23a9e354b55ceea5e2221a40b0cfeaf234310de` 与 runtime subrepo commit `ecaf1b2cbb041dc8af9c6d159d54812c7b5939b0` 已完成部分 fallback isolation：新增 `fallbackIsolation`、JobStore fallback isolation、cleanup runtimeDir 对齐，并刷新 packaged runtime。
- 总控复核通过的证据：双仓 `git diff --check`、`npm run build`、focused vitest 6 files / 74 tests、`npm run lint`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin` 均通过；双仓工作区 clean。
- 未通过原因：源码抽查和最小 runtime probe 证明 `attachCodexExecutionContext` 在无 resident ProjectScope 时仍直接返回 result，导致 plugin-owned `alembic_health` 结果没有 `projectRuntime`。总控 probe 条件：临时可用知识库、daemon stopped、无 resident ProjectScope；输出 `success=true`、`hasProjectRuntime=false`，data keys 只有 `serviceBoundary` 等旧字段。该路径仍绕过 Stage 3/4 要求的 unified runtime identity / fallback isolation surface。
- 正确返工方向：`projectRuntime` 应作为 plugin-owned tool result 的统一 runtime context surface，只要已构建就必须附加；`codexProjectScopeExecution` 仍只在 resident ProjectScope ready 时附加。

### PMMPR-STAGE3-4-PLUGIN-P4R：AlembicPlugin runtime context surface rework

窗口：`AlembicPlugin`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 20:10 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 20:10 CST

阶段目标：

- 修复 Stage 3/4 验收发现的缺口：plugin-owned Codex-facing tool result 在无 resident ProjectScope 时也必须携带 `projectRuntime` 和 fallback isolation surface；不能只在 resident ProjectScope ready 时出现。

主线动作：

- 读取 AlembicPlugin `AGENTS.md`、本计划和未通过提交 `f23a9e354b55ceea5e2221a40b0cfeaf234310de`。
- 修复 `lib/codex/mcp/host/embedded-executor.ts` 的早退逻辑：`projectRuntime` patch 应先于 resident ProjectScope 判断生效；`codexProjectScopeExecution` 只在 resident ProjectScope ready 时附加。
- 补 focused tests：至少覆盖可用知识库、无 resident ProjectScope 的 plugin-owned `alembic_health` / 代表性 plugin-owned tool，断言 `data.projectRuntime.fallbackIsolation` 存在且 `serviceBoundary.executionPath="plugin-owned-codex-facing"`；保留 resident ProjectScope ready 时 `codexProjectScopeExecution` 的既有断言。
- 刷新 packaged runtime / runtime.tgz，并确认子仓库提交与父仓指针一致。

合并 TODO：

- `PMMPR-4` status/job/cleanup/dashboard/diagnostics 统一 identity chain。
- `PMMPR-11` unified identity chain。
- `PMMPR-13` embedded / JobStore / saved-root / selected fallback 删除或隔离边界。

明确不包含：

- 不修改 AlembicCore / Alembic；不改变 Codex host MCP 协议；不派 AlembicTest；不把 sourceRef、candidate 或 Recipe 校验引入任何 gate。

下一处真实阻塞点：

- 无 resident ProjectScope 的 plugin-owned tool result 缺 `projectRuntime`。

阻塞点之前还能做：

- AlembicPlugin 单仓修复、focused tests、runtime prepare、verify。

验证命令：

```text
git status --short
git diff --check
npm run build
npm run test -- test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexRuntimeContext.test.ts test/unit/AlembicResidentServiceClient.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts test/unit/CodexProjectRootResolver.test.ts
npm run lint
npm run prepare:codex-plugin-runtime
npm run verify:codex-plugin
```

回填要求：

- 完成范围：Stage 3/4 P4R runtime context surface rework。
- 提交 hash：必须提供 AlembicPlugin 父仓提交 hash；如 runtime 子仓库有提交，也必须提供 runtime 子仓库 hash。
- 证据：关键 diff 摘要、无 resident ProjectScope 的 plugin-owned tool result 包含 `projectRuntime` 的测试证据、focused tests 输出、runtime prepare / verifier 输出、双仓 clean 状态。
- 遗留风险：是否仍需 AlembicTest 真实 Codex 多窗口 MCP startup / daemon restart smoke。
- 下一步建议：返工通过后，由总控裁决 Stage 5 AlembicTest smoke 或停止归档。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 AlembicPlugin `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 只修本次验收发现的 Stage 3/4 runtime context surface 缺口，不扩大为新架构设计。

总控验收结论：

- 已验收。AlembicPlugin 父仓 commit `4e5c3f98c1b4839c6d69f78ac216c15960447865` 修正 `attachCodexExecutionContext` no-resident 早退：`projectRuntime` patch 在 resident ProjectScope 判断前生效，`codexProjectScopeExecution` 仍只在 resident ProjectScope ready 时附加；runtime 子仓 commit `46b78ba242982e70743dc96e768a78d4795c31b8` 刷新 packaged runtime。
- 总控复核：`git show --stat` / 关键 diff 抽查确认只触及 `embedded-executor.ts`、`CodexMcpServer.test.ts` 与 runtime subrepo 指针；双仓 `git diff --check` 通过；`npm run build` 通过；focused vitest 6 files / 74 tests passed；`npm run lint`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin` 均通过；双仓工作区 clean。
- 总控额外 runtime probe：临时可用知识库、daemon stopped、无 resident ProjectScope，直接调用 build 后 `CodexMcpServer.handleToolCall('alembic_health')`，输出 `success=true`、`hasProjectRuntime=true`、`hasCodexProjectScopeExecution=false`，`serviceBoundary.executionPath="plugin-owned-codex-facing"`，`fallbackIsolationIds` 包含 `embedded-plugin-owned-runtime`。
- 剩余风险：总控 probe 是本地构造路径，仍需 Stage 5 真实 installed / packaged Plugin MCP runtime smoke 复核。

### PMMPR-STAGE5-TEST-P5：AlembicTest real Plugin MCP runtime smoke

窗口：`AlembicTest`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 20:36 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 20:36 CST

阶段目标：

- 用真实 AlembicTest runtime smoke 复核 PMMPR 完整链路：installed / packaged Plugin MCP runtime 在多项目、daemon stopped / no resident ProjectScope、resident readiness / daemon available 相关路径下，仍稳定输出统一 `projectRuntime`、`serviceBoundary`、required service / readiness / failure envelope，不复用 stale selected / saved-root / JobStore fallback 作为 effective identity。

主线动作：

- 读取 AlembicTest `AGENTS.md`、本计划、P4R AlembicPlugin 父仓 commit `4e5c3f98c1b4839c6d69f78ac216c15960447865` 与 runtime 子仓 commit `46b78ba242982e70743dc96e768a78d4795c31b8`。
- 在 AlembicTest 职责根或临时目录中执行真实 plugin MCP runtime smoke；优先覆盖 packaged / installed plugin path，而不是只跑源码 unit。
- 至少覆盖：
  - 可用知识库 + daemon stopped / no resident ProjectScope 的 plugin-owned tool：必须有 `data.projectRuntime`、`serviceBoundary.executionPath="plugin-owned-codex-facing"`，且无 `codexProjectScopeExecution`。
  - resident ProjectScope ready 或 daemon available 的代表路径：必须保留 `projectRuntime`，并只在 resident ready 时出现 `codexProjectScopeExecution`。
  - status / diagnostics / job / cleanup / dashboard 或 prime 中至少两个代表性 Codex-facing tool：必须展示同一 runtime identity/readiness/failure surface。
  - 多项目 / 多 root 隔离：不同 projectRoot 的 runtime identity 不得被 saved-root、selected/active 或 local JobStore fallback 覆盖。

合并 TODO：

- `PMMPR-4` status/job/cleanup/dashboard/diagnostics 统一 identity chain 的真实 runtime 复核。
- `PMMPR-11` unified identity chain 的真实 runtime 复核。
- `PMMPR-12` unified failure reason 中 source-of-truth 展示的真实 runtime 复核。
- `PMMPR-13` embedded / JobStore / saved-root / selected fallback 隔离的真实 runtime 复核。

明确不包含：

- 不修改 AlembicPlugin / Alembic / AlembicCore / AlembicDashboard / AlembicAgent 产品源码。
- 不修改 BiliDili / Playground / 真实业务项目源码。
- 不做 Dashboard UI 手动验收，除非测试过程中自然生成可复核 Dashboard URL；URL 只能作为辅助证据。
- 不设计新 runtime contract，不新增 gate，不处理 sourceRef / candidate / Recipe 校验问题。

下一处真实阻塞点：

- 缺真实 installed / packaged Plugin MCP runtime smoke 的 raw evidence。

阻塞点之前还能做：

- AlembicTest 读取计划、选择受控临时项目 / 已安装插件 runtime、执行 smoke、采集 runtime JSON / logs / reports / git status。

验证命令：

```text
git status --short
<AlembicTest 选择的真实 plugin MCP runtime smoke 命令>
```

回填要求：

- 完成范围：Stage 5 real Plugin MCP runtime smoke。
- 提交 hash：本任务默认不提交产品源码；如 AlembicTest 产生 tracked 测试资产，需说明是否提交以及 hash。
- 证据：报告路径、命令输出摘要、runtime JSON / tool result 摘要、tested AlembicPlugin 父仓 commit、tested runtime 子仓 commit、plugin cache / runtime entry mode、projectRoot / dataRoot / source policy 摘要、clean git status。
- 成功结论边界：只能证明本次真实 smoke 覆盖的 installed / packaged Plugin MCP runtime 路径通过；不能推出所有项目、Dashboard UX 或 release 已完成。
- 失败结论边界：只能证明对应 runtime path 仍有问题；需回总控按原始证据归因到 Plugin / Alembic / Core / Test 环境，不得由 AlembicTest 自行设计新功能方案。
- 遗留风险：未覆盖的真实环境、Codex host reload / installed cache 差异、daemon state 差异。
- 下一步建议：通过则回总控最终验收 / 归档判断；失败则按证据归属返工。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 AlembicTest `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮测试职责，以及本仓库明确不承担的职责。
- 只执行本计划 Stage 5 smoke；测试产生的计划外问题不得自行扩展，必须停止并回填待裁决。

总控验收结论：

- 未通过。AlembicTest 回填为 blocked，提交 hash 为 `none`，产品源码 clean；总控复核 `AlembicTest/tmp/pmmpr-stage5-test-p5-2026-06-03/report.md`、TargetResultEnvelope、`packaged-direct-runtime-probe.json`、`raw/smoke-daemon-direct/combined.log` 和 AlembicPlugin wrapper / smoke script 源码后，确认 blocked 归属 AlembicPlugin 源仓 runtime reliability 缺口。
- 正向证据：supplemental direct packaged runtime identity subset 通过，diagnostics/status/job/dashboard/prime 均含 `projectRuntime`，多项目 roots 隔离成立，plugin-owned `alembic_task prime` 有 `serviceBoundary.executionPath="plugin-owned-codex-facing"` 且无 `codexProjectScopeExecution`。
- 失败证据 1：`npm run smoke:codex-plugin -- --daemon --keep` 在 packaged npx wrapper path 启动前失败，`startup-lock-failed` 报 `ENOENT: no such file or directory, mkdir '.../npx-home/npm-cache/<hash>.lock'`；总控源码抽查确认 wrapper 使用 `ALEMBIC_CODEX_NPM_CACHE` 构造 lockDir，但没有先保证 cache parent 存在。
- 失败证据 2：`npm run smoke:codex-plugin -- --daemon --keep --no-npx-runtime` 在 packaged daemon recovery path 失败，断言 `daemon recovery smoke did not start embedded runtime`；raw `combined.log` 显示 Alembic 初始化成功后立即 shutdown，没有观察到 `daemon.ready=true`。
- 裁决：Stage 5 不能归档，下一步只派 AlembicPlugin `PMMPR-STAGE5-PLUGIN-P6` 修复上述两条原需求内 blocker；不派 AlembicTest 复跑，直到 AlembicPlugin 回填提交和验证证据。

### PMMPR-STAGE5-PLUGIN-P6：AlembicPlugin packaged wrapper / daemon recovery rework

窗口：`AlembicPlugin`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 20:56 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 20:56 CST

阶段目标：

- 修复 Stage 5 real smoke 暴露的 packaged / installed Plugin MCP runtime blocker，使 packaged npx wrapper 和 packaged daemon recovery 两条路径都能稳定启动并保留 PMMPR 已验收的 `projectRuntime` / `serviceBoundary` / readiness-failure surface。

主线动作：

- 读取本 workspace `AGENTS.md`、当前总控文档和 AlembicPlugin `AGENTS.md`。
- 复核 AlembicTest 报告 `AlembicTest/tmp/pmmpr-stage5-test-p5-2026-06-03/report.md`、`packaged-direct-runtime-probe.json`、`raw/smoke-npx-wrapper/installed-mcp.json`、`raw/smoke-daemon-direct/combined.log`。
- 修复 `plugins/alembic-codex/bin/alembic-codex-mcp-wrapper.mjs` 的 startup lock parent 创建问题：当 `ALEMBIC_CODEX_NPM_CACHE` 指向不存在的 nested cache 目录时，wrapper 必须先安全创建 parent，再保持 lockDir owner / stale lock / wait diagnostic 语义。
- 修复 packaged daemon recovery readiness/lifecycle：`npm run smoke:codex-plugin -- --daemon --keep --no-npx-runtime` 必须能观察到 embedded runtime `daemon.ready=true`，且不能通过 mock、空 ready 或跳过 daemon recovery smoke 达标。
- 刷新 packaged runtime / runtime 子仓，如代码变更触及 runtime package，必须回填 runtime 子仓 commit 和 packaged runtime refresh 证据。

合并 TODO：

- `PMMPR-2` packaged wrapper startup lock scope/release/diagnostics 的真实 installed 路径修复。
- `PMMPR-10` canonical local-dev restart/reload 与 packaged daemon recovery readiness 的真实 smoke 修复。
- `PMMPR-13` embedded runtime / JobStore / selected fallback 隔离在 packaged daemon recovery 路径下的稳定性复核。

明确不包含：

- 不修改 Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicTest / BiliDili。
- 不新增 sourceRef / candidate / Recipe / knowledge quality gate，不拦截、重写或补全 Recipe 相关数据。
- 不把失败绕成“跳过 packaged npx runtime”或“跳过 daemon recovery”；必须让两条 Stage 5 smoke 命令真实通过。

下一处真实阻塞点：

- AlembicPlugin 尚未修复 packaged npx wrapper startup-lock parent ENOENT 和 packaged daemon recovery ready=false。

阻塞点之前还能做：

- 总控已经完成证据归因和任务包定义，可直接投递 AlembicPlugin P6。

验证命令：

```text
git diff --check
npm run build
<AlembicPlugin focused tests for wrapper startup lock and daemon recovery>
npm run smoke:codex-plugin -- --daemon --keep
npm run smoke:codex-plugin -- --daemon --keep --no-npx-runtime
npm run prepare:codex-plugin-runtime
npm run verify:codex-plugin
git status --short
```

回填要求：

- 完成范围：Stage 5 packaged wrapper / daemon recovery rework。
- 提交 hash：AlembicPlugin 父仓提交 hash；如 runtime 子仓库有变更，也必须提供 runtime 子仓提交 hash。
- 证据：关键 diff 摘要、wrapper lock parent 修复证据、daemon recovery ready=true 证据、两条 smoke 命令输出、focused tests / build / runtime prepare / plugin verifier 输出、双仓 clean 状态。
- 成功结论边界：只证明 AlembicPlugin 修复了 Stage 5 real smoke 暴露的 source-owner blocker；仍需 AlembicTest 复跑 Stage 5 后才能最终归档 PMMPR。
- 失败结论边界：如仍失败，必须保留原始 stdout/stderr、runtime JSON、logs 和临时目录路径，回总控裁决，不得自行扩大需求。
- 下一步建议：P6 通过后，由总控派 AlembicTest 复跑 Stage 5。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 AlembicPlugin `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 只处理 Stage 5 blocked 证据指向的 packaged wrapper startup-lock 和 packaged daemon recovery readiness/lifecycle；不得扩大成新 runtime contract 或相邻插件问题。

总控验收结论：

- 未验收。AlembicPlugin 回填 commits：父仓 `0cc1c5ca64e4e8c033aba9dd434412c4dc74c7c0`，runtime 子仓 `7b86de81d1102dc9c2a88cc9749cb29aa093320b`。总控复核 diff 确认源码变更很窄：runtime wrapper 在 `acquireStartupLock()` 前创建 `npmCacheRoot` parent，并把 `npmCacheRoot` 写入 lock owner；父仓只增加诊断字段、verifier 和单测断言。
- 通过证据：总控复跑 `git diff --check`（父仓 + runtime 子仓）、focused tests 3 files / 52 tests、`npm run build`、`npm run lint`、`npm run verify:codex-plugin` 均通过；非沙箱复跑 `npm run smoke:codex-plugin -- --daemon --keep --no-npx-runtime` 通过，`daemon.ready=true`；非沙箱复跑 `npm run smoke:codex-plugin -- --daemon --keep` 通过，`npxRuntime=passed`、`recovery=passed`、`daemon.ready=true`。
- 阻塞证据：总控复跑 `npm run prepare:codex-plugin-runtime` 后，runtime 子仓出现未提交差异：`runtime/dist/lib/codex/diagnostics/Diagnostics.js` 生成格式从两行变一行，`runtime.tgz` 二进制随之变化；父仓显示 submodule dirty。该状态不满足 P6 回填要求中的“双仓 clean 状态”。
- 裁决：P6 功能修复方向成立，但不能通过总控验收；下一步只派 AlembicPlugin `PMMPR-STAGE5-PLUGIN-P6R` 做产物一致性收口，不派 AlembicTest 复跑。

### PMMPR-STAGE5-PLUGIN-P6R：AlembicPlugin runtime artifact consistency closeout

窗口：`AlembicPlugin`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 21:44 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 21:44 CST

阶段目标：

- 收口 P6 后的 packaged runtime 产物一致性：`npm run prepare:codex-plugin-runtime`、verifier 和 smoke 跑完后，AlembicPlugin 父仓与 `plugins/alembic-codex` runtime 子仓必须 clean，且 packaged runtime 仍包含 P6 wrapper parent creation 修复。

主线动作：

- 读取本 workspace `AGENTS.md`、当前总控文档和 AlembicPlugin `AGENTS.md`。
- 复核当前工作树 dirty：`plugins/alembic-codex/runtime/dist/lib/codex/diagnostics/Diagnostics.js` 与 `runtime.tgz` 是总控复跑 `prepare:codex-plugin-runtime` 后产生的 runtime 产物差异。
- 不改功能逻辑，优先提交或规范化 generated runtime artifact，使父仓 submodule pointer 与 runtime 子仓 commit 对齐。
- 确认 wrapper `mkdirSync(npmCacheRoot, { recursive: true })`、diagnostics `cacheParentCreation=true` 和 verifier 断言仍保留。

合并 TODO：

- `PMMPR-2` packaged wrapper startup lock 修复后的 runtime.tgz / installed cache artifact 一致性。

明确不包含：

- 不重写 P6 方案，不修改 daemon recovery 业务逻辑，除非验证证明必须修同一 blocker。
- 不修改 Alembic / AlembicCore / AlembicTest / BiliDili。
- 不新增 sourceRef / candidate / Recipe gate。

下一处真实阻塞点：

- runtime 子仓当前有 `runtime.tgz` 与 `runtime/dist/lib/codex/diagnostics/Diagnostics.js` 未提交差异；父仓 submodule dirty。

阻塞点之前还能做：

- AlembicPlugin 可直接提交或清理该 generated artifact 差异并复跑验证。

验证命令：

```text
git diff --check
npm run build
npm run test -- test/unit/CodexRuntimeContext.test.ts test/unit/CodexMcpServer.test.ts test/unit/DaemonSupervisor.test.ts
npm run lint
npm run prepare:codex-plugin-runtime
npm run verify:codex-plugin
npm run smoke:codex-plugin -- --daemon --keep
npm run smoke:codex-plugin -- --daemon --keep --no-npx-runtime
git status --short
git -C plugins/alembic-codex status --short
```

回填要求：

- 完成范围：P6 runtime artifact consistency closeout。
- 提交 hash：AlembicPlugin 父仓提交 hash；如 runtime 子仓库有提交，也必须提供 runtime 子仓提交 hash。
- 证据：说明是否提交了总控复跑生成的 runtime diff；两条 smoke 输出；build / focused tests / lint / runtime prepare / verifier 输出；父仓和 runtime 子仓 clean 状态。
- 成功结论边界：只证明 P6 source-owner blocker 和 packaged runtime artifact 一致性已收口；仍需 AlembicTest 复跑 Stage 5 后才能最终归档 PMMPR。
- 失败结论边界：如 clean 状态或 smoke 仍失败，保留 diff / stdout / stderr / temp dirs 回总控裁决。
- 下一步建议：P6R 通过后，由总控派 AlembicTest 复跑 Stage 5。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 AlembicPlugin `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 只处理 P6 后的 runtime artifact consistency，不扩大为新功能。

总控验收结论：

- 已验收。AlembicPlugin 回填 commits：父仓 `f0a94e929627d1e2b54045889ff6335153e082f6`，runtime 子仓 `e8ae2157631bb86a0654e2865415a893bc4755a6`。
- diff 复核：父仓只更新 `plugins/alembic-codex` 子仓指针；runtime 子仓只更新 `runtime/dist/lib/codex/diagnostics/Diagnostics.js` generated format 和 `runtime.tgz` 产物；未新增功能逻辑。
- 总控复跑：父仓 / runtime 子仓 `git diff --check` 通过；`npm run build` 通过；focused tests 3 files / 52 tests 通过；`npm run lint` 通过；`npm run prepare:codex-plugin-runtime` 通过且双仓保持 clean；`npm run verify:codex-plugin` 通过；非沙箱两条 smoke 均通过，完整 `--daemon --keep` 输出 `npxRuntime=passed`、`recovery=passed`、`daemon.ready=true`，`--no-npx-runtime` 输出 `npxRuntime=skipped`、`recovery=passed`、`daemon.ready=true`。
- 裁决：P6R 关闭 P6 的 runtime artifact consistency 阻塞；已按计划派 AlembicTest `PMMPR-STAGE5-TEST-P7` 复跑 Stage 5。

### PMMPR-STAGE5-TEST-P7：AlembicTest Stage 5 rerun after P6R

窗口：`AlembicTest`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 22:00 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-06-03 22:19 CST

阶段目标：

- 复跑真实 installed / packaged Plugin MCP runtime smoke，验证 P6/P6R 后 packaged npx wrapper startup-lock parent creation、daemon recovery readiness，以及 PMMPR runtime identity / readiness / failure surface 是否在真实测试窗口中通过。

主线动作：

- 读取本 workspace `AGENTS.md`、当前总控文档、`test-exchange.md` 和 AlembicTest `AGENTS.md`。
- 基于 `Test-PMMPR-STAGE5-PLUGIN-MCP-RUNTIME-SMOKE-001` 复跑，不修改产品源码或真实项目业务代码。
- 使用 P6R 已验收提交：AlembicPlugin 父仓 `f0a94e929627d1e2b54045889ff6335153e082f6`，runtime 子仓 `e8ae2157631bb86a0654e2865415a893bc4755a6`。
- 采集 raw report、runtime JSON、tool result、logs、tested runtime entry、git status。

验证 / 回填要求：

- 测试结论：`passed(scope=pmmpr-plugin-mcp-runtime-smoke)` / `failed(scope=pmmpr-plugin-mcp-runtime-smoke)` / `blocked(scope=...)`。
- 必须说明是否只复跑 PMMPR Stage 5 real Plugin MCP runtime smoke。
- 必须提供实际命令、参数、退出结果、runtime entry、plugin cache / runtime.tgz、daemon/resident 状态。
- 必须提供 tool result 摘要：`projectRuntime`、`serviceBoundary`、`codexProjectScopeExecution`、required service / failure envelope。
- 必须提供 raw evidence 目录、报告、日志、runtime JSON、相关仓库 git status。
- 失败时必须按 raw evidence 归因，不得由 AlembicTest 自行设计新功能方案。

总控验收结论：

- 已验收。AlembicTest P7 回填 status 为 `completed`，commit 为 `none`，证据目录为 `AlembicTest/tmp/pmmpr-stage5-test-p7-2026-06-03/`。
- 原始证据复核：`smoke-results.json` 显示 non-sandbox `npm run smoke:codex-plugin -- --daemon --keep` 通过，`install=passed`、`stdio=passed`、`npxRuntime=passed`、`recovery=passed`、`daemon.ready=true`；`npm run smoke:codex-plugin -- --daemon --keep --no-npx-runtime` 通过，`npxRuntime=skipped`、`recovery=passed`、`daemon.ready=true`。
- runtime identity 证据复核：`packaged-direct-runtime-probe.json` 显示 `projectRuntime` 出现在 diagnostics / status / job / dashboard / prime；两个临时 projectRoot 隔离成立；legacy saved-root / selected-active / local JobStore fallback 被阻止成为 effective identity；plugin-owned prime 保持 `serviceBoundary.executionPath="plugin-owned-codex-facing"` 且未附加 `codexProjectScopeExecution`。
- raw log 复核：full smoke 与 no-npx smoke 的 daemon log 均显示 HTTP server 启动、`Alembic daemon ready` 和对应端口；sandbox baseline 失败被记录为 sandbox daemon-readiness interference，不作为产品失败。
- 仓库状态复核：`codex-control-workspace`、`AlembicTest`、`Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicPlugin/plugins/alembic-codex` 均无未提交变更；AlembicTest 的 raw P7 evidence 位于 ignored `tmp/`。
- 裁决：P7 通过，PMMPR 当前完成定义已达到；不再派发下一跳，停止本条自动化。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLUGIN-MCP-MULTI-PROJECT-RUNTIME-2026-06-03 | 已完成 / 总控验收通过 | runtime reliability / multi-project MCP contract | P1 | AlembicWorkspace / AlembicPlugin / Alembic / AlembicCore / AlembicTest | 收敛 per-window MCP project identity、ghost dataRoot、ProjectScope/project space、required service、readiness/failure envelope、local-dev restart/reload 和 packaged wrapper 诊断。 | 否 | P7 raw evidence 通过；当前完成定义已满足。 | 无 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | Stage 1A 已验收 | 否 | Producer adapter 已回填，等待 Plugin 消费。 |
| `AlembicCore` | Stage 1A 已验收 | 否 | Shared contract 已回填并已被 Plugin 消费。 |
| `AlembicAgent` | 无任务 | 否 | 当前需求不涉及 Agent runtime / AI provider / tool loop。 |
| `AlembicDashboard` | 无任务 | 否 | 本需求不要求 Dashboard UX 手动验收；P7 只证明 fail-closed dashboard handoff surface。 |
| `AlembicPlugin` | Stage 5 P6R 已验收 | 否 | P6R commits / diff / build / focused tests / lint / prepare / verifier / smoke / 双仓 clean 均已通过总控复核。 |
| `AlembicDesign` | 无任务 | 否 | Design handoff 已完成。 |
| `AlembicTest` | Stage 5 P7 已验收 | 否 | P7 raw report / runtime JSON / logs 已通过总控复核。 |
| `BiliDili` | 无任务 | 否 | 真实项目受保护，仅作为后续可能 smoke 场景，不改源码。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已验收 | Stage 1A producer adapter 已完成。 |
| `AlembicCore`<br>已验收 | Stage 1A shared contract 已完成。 |
| `AlembicAgent`<br>无任务 | 本轮不涉及 Agent runtime。 |
| `AlembicDashboard`<br>无任务 | 本需求不要求 Dashboard UX 手动验收。 |
| `AlembicPlugin`<br>Stage 5 P6R 已验收 | P6R 已关闭 runtime artifact consistency 阻塞。 |
| `AlembicDesign`<br>无任务 | 已完成需求设计。 |
| `AlembicTest`<br>Stage 5 P7 已验收 | P7 已通过真实 installed / packaged Plugin MCP runtime smoke。 |
| `BiliDili`<br>无任务 | 真实项目受保护。 |

## 可复制提示词

发送给：无

```text
无。
```

## 测试交接

- 是否需要 `AlembicTest`：需要。
- 总控自测结论：Stage 0-4 代码侧和本地 probe 已完成；P4R no-resident runtime probe 通过，但仍不足以替代 installed / packaged Plugin MCP runtime 的真实 smoke。
- 需要真实场景的理由：最终完成定义包含真实 MCP / runtime smoke 或明确不需要真实 smoke；当前总控裁决需要 AlembicTest 用真实 runtime 复核 installed / packaged Plugin MCP 多项目身份、daemon stopped / no resident 和 resident readiness 相关路径。
- 测试前边界与多条件判断：
  - 测试要回答的问题：PMMPR Stage 0-4 后，真实 installed / packaged Plugin MCP runtime 是否在多项目 / daemon stopped / no resident ProjectScope / resident readiness 相关路径下稳定输出统一 `projectRuntime`、`serviceBoundary`、required service / readiness / failure envelope。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：执行窗口为 `AlembicTest`；对象为 AlembicPlugin packaged / installed runtime 与 AlembicTest 临时项目或受控测试项目；不得修改 BiliDili / Playground / 产品源码。
  - 成功能推出的结论：只能证明本次真实 runtime smoke 覆盖路径通过，可供总控做最终归档判断。
  - 失败能推出的结论：只能证明对应 runtime path 仍有缺口，需回总控按 raw evidence 归因返工。
  - 不能推出的结论：不能推出所有项目、Dashboard UX、Codex host reload 全场景或 release 已完成。
  - 停止或不开始条件：测试会修改真实项目源码、需要启动未授权产品实现、插件 runtime 不可用、无法采集 raw report/runtime JSON、或发现需求设计外问题需要用户裁决。
- 测试单：`Test-PMMPR-STAGE5-PLUGIN-MCP-RUNTIME-SMOKE-001`。
- 测试交流入口：[test-exchange.md](../../../../../codex-control-workspace/.wakeflow-active/current/test-exchange.md)
- 真实项目保护说明：BiliDili / Playground 仅作为后续可能 smoke 场景，不作为可改仓库。
- 当前测试结论：P7 已通过，总控已验收。

## 回填区

- 2026-06-03 17:44 CST：总控接收 `PLUGIN-MCP-MULTI-PROJECT-RUNTIME-2026-06-03`。已读取 Design 原始计划、需求设计、handoff board 和自动化 controller skill；裁决为独立当前主线，Stage 0 只读 contract inventory 先投 AlembicPlugin / Alembic / AlembicCore，不派 AlembicTest，不改产品源码。
- 2026-06-03 17:51 CST：已开启 keep-live，并通过 direct thread dispatch 投递 `PMMPR-STAGE0-CONTRACT-INVENTORY-20260603` 给 AlembicPlugin / Alembic / AlembicCore；三条 delivery run 均已记录 send/readback。`review-results` 显示 group `partially-ready`：AlembicCore 已返回 result envelope，AlembicPlugin / Alembic 仍 missing；按 `group-ready` returnPolicy 等待整组回填，不创建下一跳。
- 2026-06-03 18:08 CST：收到 `PMMPR-STAGE0-CONTRACT-INVENTORY-20260603` group-ready 回跳。总控读取 review-pack、三份 TargetResultEnvelope、AlembicPlugin inventory dossier，并抽查三仓库源码与 clean 状态。裁决：Stage 0 只读 inventory 证据足够；下一步只派 Stage 1A producer contract 给 AlembicCore / Alembic，AlembicPlugin 等上游 contract 回填后再消费。
- 2026-06-03 18:11 CST：已为 `PMMPR-STAGE1-PRODUCER-CONTRACT-20260603` 添加 keep-live lease；已顺序创建 AlembicCore / Alembic 两个 dispatch packet 与 delivery envelope，并通过 direct thread 投递到真实职责窗口。两条 delivery run 均已记录 `sent` 与 `readback.ok=true`。`review-results` 显示 group `waiting`，等待 AlembicCore / Alembic 回填。
- 2026-06-03 18:34 CST：收到 `PMMPR-STAGE1-PRODUCER-CONTRACT-20260603` group-ready 回跳。总控读取 review-pack、两份 TargetResultEnvelope，复核 AlembicCore commit `dc6a443b023f5779efe7cce37f204688b828b0e3` 与 Alembic commit `c3b51c388fcfd453f3349334de1cc0ee6e286fba`，抽查关键源码，并复跑 targeted tests：AlembicCore 2 files / 16 tests passed，Alembic 3 files / 12 tests passed，双仓 `git diff --check` passed，双仓工作区 clean。裁决：Stage 1A producer contract 证据足够；下一步派 AlembicPlugin `PMMPR-STAGE1-PLUGIN-P2` 消费上游 contract。
- 2026-06-03 18:37 CST：已为 `PMMPR-STAGE1B-PLUGIN-CONSUMER-20260603` 添加 keep-live lease；已创建 AlembicPlugin dispatch packet / delivery envelope，并通过 direct thread 投递到真实职责窗口。delivery run 已记录 `sent` 与 `readback.ok=true`。`review-results` 显示 group `waiting`，等待 AlembicPlugin 回填。
- 2026-06-03 19:11 CST：收到 `PMMPR-STAGE1B-PLUGIN-CONSUMER-20260603` group-ready 回跳。总控读取 review-pack 和 TargetResultEnvelope，复核 AlembicPlugin commit `7ca25f1a19515af530deac660799679cfc6f992b`，抽查 `ProjectRuntimeContext`、MCP/status/diagnostics/prime/job/cleanup diff，并复跑 `git diff --check`、`npm run build`、focused vitest 4 files / 57 tests、`npm run lint`、`npm run lint:core-import-boundary` 均通过。裁决：Stage 1B Plugin consumer 证据足够；剩余 P0 缺口是 canonical local-dev restart/reload 与 packaged wrapper startup reliability，下一步只派 AlembicPlugin `PMMPR-STAGE2-PLUGIN-P3`，不派 AlembicTest。
- 2026-06-03 19:15 CST：已为 `PMMPR-STAGE2-PLUGIN-STARTUP-RELOAD-20260603` 添加 keep-live lease；已创建 AlembicPlugin dispatch packet / delivery envelope，并通过 direct thread 投递到真实职责窗口。delivery run 已记录 `sent` 与 `readback.ok=true`。`review-results` 后续应显示 group `waiting`，等待 AlembicPlugin 回填。
- 2026-06-03 19:46 CST：收到 `PMMPR-STAGE2-PLUGIN-STARTUP-RELOAD-20260603` group-ready 回跳。总控读取 review-pack、TargetResultEnvelope 和 AlembicPlugin smoke reports，复核父仓 commit `2071e160965a890c1f8b8779980053c70982f422` 与 runtime subrepo commit `138040a7ca6c9757b7b53a88ee468bb24ceff0b9`，抽查 canonical reload / wrapper lock / diagnostics diff，并复跑双仓 `git diff --check`、`npm run build`、focused vitest 4 files / 51 tests、`npm run lint`、`npm run verify:codex-plugin` 和隔离 `CODEX_HOME` reload smoke 均通过。裁决：Stage 2 证据足够；剩余缺口是 Stage 3/4 runtime identity chain 和 legacy fallback cleanup，下一步只派 AlembicPlugin `PMMPR-STAGE3-4-PLUGIN-P4`，不派 AlembicTest。
- 2026-06-03 19:49 CST：已为 `PMMPR-STAGE3-4-PLUGIN-RUNTIME-CLEANUP-20260603` 添加 keep-live lease；已创建 AlembicPlugin dispatch packet / delivery envelope，并通过 direct thread 投递到真实职责窗口。delivery run 已记录 `sent` 与 `readback.ok=true`；`review-results` 显示 group `waiting`，等待 AlembicPlugin 回填。
- 2026-06-03 20:10 CST：收到 `PMMPR-STAGE3-4-PLUGIN-RUNTIME-CLEANUP-20260603` group-ready 回跳。总控读取 review-pack、TargetResultEnvelope，复核父仓 commit `f23a9e354b55ceea5e2221a40b0cfeaf234310de` 与 runtime 子仓 commit `ecaf1b2cbb041dc8af9c6d159d54812c7b5939b0`，复跑双仓 `git diff --check`、`npm run build`、focused vitest 6 files / 74 tests、`npm run lint`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin` 均通过；但源码抽查和最小 runtime probe 证明无 resident ProjectScope 的 plugin-owned `alembic_health` result 没有 `projectRuntime`，不满足 Stage 3/4 unified runtime context surface。裁决：P4 未通过，下一步只返工 AlembicPlugin `PMMPR-STAGE3-4-PLUGIN-P4R`。
- 2026-06-03 20:13 CST：已为 `PMMPR-STAGE3-4-PLUGIN-REWORK-20260603` 添加 keep-live lease；已创建 AlembicPlugin P4R dispatch packet / delivery envelope，并通过 direct thread 投递到真实职责窗口。delivery run 已记录 `sent` 与 `readback.ok=true`；`review-results` 显示 group `waiting`，等待 AlembicPlugin P4R 回填。
- 2026-06-03 20:31 CST：收到 `PMMPR-STAGE3-4-PLUGIN-REWORK-20260603` group-ready 回跳。总控读取 review-pack 和 TargetResultEnvelope，复核 AlembicPlugin 父仓 commit `4e5c3f98c1b4839c6d69f78ac216c15960447865` 与 runtime 子仓 commit `46b78ba242982e70743dc96e768a78d4795c31b8`，抽查 `attachCodexExecutionContext` diff，复跑双仓 `git diff --check`、`npm run build`、focused vitest 6 files / 74 tests、`npm run lint`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin` 均通过；总控 no-resident runtime probe 输出 `hasProjectRuntime=true` 且 `hasCodexProjectScopeExecution=false`。裁决：P4R 通过，下一步进入 Stage 5 AlembicTest real Plugin MCP runtime smoke。
- 2026-06-03 20:36 CST：已为 `PMMPR-STAGE5-TEST-RUNTIME-SMOKE-20260603` 添加 keep-live lease；已创建 AlembicTest dispatch packet / delivery envelope，并通过 direct thread 投递到真实职责窗口。delivery run 已记录 `sent` 与 `readback.ok=true`；readback 显示 AlembicTest 最新 turn `inProgress` 且包含 `PMMPR-STAGE5-TEST-P5`。当前等待 AlembicTest TargetResultEnvelope，不创建下一跳。
- 2026-06-03 20:50 CST：收到 `PMMPR-STAGE5-TEST-RUNTIME-SMOKE-20260603` blocked 回跳。总控读取 review-pack、TargetResultEnvelope、`AlembicTest/tmp/pmmpr-stage5-test-p5-2026-06-03/report.md`、direct packaged runtime probe JSON、daemon combined log，并抽查 AlembicPlugin wrapper / smoke script 源码。裁决：direct packaged identity subset 通过，但 packaged npx wrapper startup-lock 因缺失 `npx-home/npm-cache` parent 失败，packaged daemon recovery 初始化后未进入 `daemon.ready=true`；Stage 5 不能归档，下一步只派 AlembicPlugin `PMMPR-STAGE5-PLUGIN-P6` 返工，不派 Test 复跑。
- 2026-06-03 20:56 CST：已为 `PMMPR-STAGE5-PLUGIN-REWORK-20260603` 添加 keep-live lease；已创建 AlembicPlugin P6 dispatch packet / delivery envelope，并通过 direct thread 投递到 AlembicPlugin 职责窗口。delivery run 已记录 `sent` 与 `readback.ok=true`；readback 显示 AlembicPlugin 最新 turn `inProgress` 且包含 `PMMPR-STAGE5-PLUGIN-P6`。当前等待 AlembicPlugin TargetResultEnvelope，不创建下一跳。
- 2026-06-03 21:39 CST：收到 `PMMPR-STAGE5-PLUGIN-REWORK-20260603` ready 回跳。总控读取 review-pack、TargetResultEnvelope，复核 AlembicPlugin 父仓 commit `0cc1c5ca64e4e8c033aba9dd434412c4dc74c7c0` 与 runtime 子仓 commit `7b86de81d1102dc9c2a88cc9749cb29aa093320b`；复跑父仓 / runtime 子仓 `git diff --check`、focused tests 3 files / 52 tests、`npm run build`、`npm run lint`、`npm run verify:codex-plugin` 均通过；非沙箱复跑两条 smoke 均通过，完整 `--daemon --keep` 输出 `npxRuntime=passed`、`recovery=passed`、`daemon.ready=true`。但总控复跑 `npm run prepare:codex-plugin-runtime` 后 runtime 子仓产生未提交差异（`runtime/dist/lib/codex/diagnostics/Diagnostics.js` 与 `runtime.tgz`），父仓 submodule dirty；裁决：P6 功能通过但未满足双仓 clean，不验收，下一步只派 AlembicPlugin `PMMPR-STAGE5-PLUGIN-P6R` 产物一致性收口。
- 2026-06-03 21:44 CST：已为 `PMMPR-STAGE5-PLUGIN-ARTIFACT-CLEAN-20260603` 添加 keep-live lease；已创建 AlembicPlugin P6R dispatch packet / delivery envelope，并通过 direct thread 投递到 AlembicPlugin 职责窗口。delivery run 已记录 `sent` 与 `readback.ok=true`；readback 显示 AlembicPlugin 最新 turn `inProgress` 且包含 `PMMPR-STAGE5-PLUGIN-P6R`。当前等待 AlembicPlugin TargetResultEnvelope，不创建下一跳。
- 2026-06-03 21:58 CST：收到 `PMMPR-STAGE5-PLUGIN-ARTIFACT-CLEAN-20260603` ready 回跳。总控读取 review-pack、TargetResultEnvelope，复核 AlembicPlugin 父仓 commit `f0a94e929627d1e2b54045889ff6335153e082f6` 与 runtime 子仓 commit `e8ae2157631bb86a0654e2865415a893bc4755a6`；确认父仓只更新子仓指针，runtime 子仓只提交 generated `Diagnostics.js` 格式与 `runtime.tgz`。总控复跑 `git diff --check`（父仓 + runtime 子仓）、`npm run build`、focused tests 3 files / 52 tests、`npm run lint`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、两条非沙箱 smoke 均通过，且双仓保持 clean。裁决：P6R 通过，下一步派 AlembicTest `PMMPR-STAGE5-TEST-P7` 复跑 Stage 5。
- 2026-06-03 22:00 CST：已为 `PMMPR-STAGE5-TEST-RERUN-20260603` 添加 keep-live lease；已创建 AlembicTest P7 dispatch packet / delivery envelope，并通过 direct thread 投递到 AlembicTest 职责窗口。delivery run 已记录 `sent` 与 `readback.ok=true`；readback 显示 AlembicTest 最新 turn `inProgress` 且包含 `PMMPR-STAGE5-TEST-P7`。当前等待 AlembicTest TargetResultEnvelope，不创建下一跳。
- 2026-06-03 22:13 CST：收到 `PMMPR-STAGE5-TEST-RERUN-20260603` ready 回跳。总控读取 review-pack、TargetResultEnvelope、`AlembicTest/tmp/pmmpr-stage5-test-p7-2026-06-03/report.md`、`smoke-results.json`、`packaged-direct-runtime-probe.json`、full/no-npx daemon logs 和 raw package/project files。裁决：P7 通过，full packaged wrapper/npx runtime/daemon recovery smoke 与 no-npx packaged daemon recovery smoke 均通过；runtime identity probe 证明 projectRuntime / serviceBoundary / fallback isolation 满足 PMMPR contract。当前需求完成定义已达到，不创建下一跳。
- 2026-06-03 22:19 CST：总控释放 PMMPR 主线全部遗留 automation / keep-live lease：`PMMPR-STAGE0-CONTRACT-INVENTORY-20260603`、`PMMPR-STAGE1-PRODUCER-CONTRACT-20260603`、`PMMPR-STAGE1B-PLUGIN-CONSUMER-20260603`、`PMMPR-STAGE2-PLUGIN-STARTUP-RELOAD-20260603`、`PMMPR-STAGE3-4-PLUGIN-RUNTIME-CLEANUP-20260603`、`PMMPR-STAGE3-4-PLUGIN-REWORK-20260603`、`PMMPR-STAGE5-TEST-RUNTIME-SMOKE-20260603`、`PMMPR-STAGE5-PLUGIN-REWORK-20260603`、`PMMPR-STAGE5-PLUGIN-ARTIFACT-CLEAN-20260603`。最后一次 `stop-loop` 返回 keep-live `status=stopped`、`activeRunCount=0`，本主线无继续投递意图。

<!-- workspace-sync
{
  "status": "已完成 / PMMPR Stage 5 P7 通过，总控验收通过",
  "indexPlanDescription": "Plugin MCP Multi Project Runtime：P7 真实 smoke 通过，总控验收通过。",
  "indexStatusDescription": "Plugin MCP Multi Project Runtime 当前状态：P7 raw evidence 通过，当前完成定义已满足；PMMPR automation / keep-live 已停止，无下一跳。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "Plugin MCP Multi Project Runtime：P7 passed, accepted by total control。",
  "currentStatusSummary": "当前计划：[plugin-mcp-multi-project-runtime-workspace-plan-2026-06-03.md](../../../../../codex-control-workspace/.wakeflow-active/current/plugin-mcp-multi-project-runtime-workspace-plan-2026-06-03.md)。当前用户目标：接收 `PLUGIN-MCP-MULTI-PROJECT-RUNTIME-2026-06-03` 并开启无人值守自动化；Stage 0 只读 inventory 已验收，Stage 1A producer contract 已验收，Stage 1B Plugin consumer 已验收，Stage 2 Plugin startup/reload 已验收，Stage 3/4 P4R runtime context surface 已通过总控复核；Stage 5 AlembicTest real smoke 曾回填 blocked；AlembicPlugin P6 功能修复和 P6R runtime artifact consistency 已通过总控复核；AlembicTest P7 真实 installed / packaged Plugin MCP runtime smoke 已通过总控复核。当前完成定义已满足，PMMPR automation / keep-live 已停止，无下一跳。",
  "indexRows": [],
  "currentIndexRows": []
}
-->
