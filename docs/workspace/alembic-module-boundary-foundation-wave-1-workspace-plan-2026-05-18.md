# Alembic Module Boundary Foundation Wave 1 Workspace Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已验收；AlembicCore、Alembic、AlembicPlugin、AlembicAgent、AlembicDashboard 均完成并通过总控轻量复核
阶段：前期开发 / 模块划分

## 背景

上一阶段已完成 AI source boundary 与 Plugin first enhancement 的残留收口：`host-agent`、`alembic-agent`、AI provider config 与 route choice 已经区分清楚。现在不进入大验收归档，也不急着做发布链路检查；先推进前期开发和模块划分，把多项目运行模型、文件监控扫描、前端边界和两条 AI 路线的代码结构稳定下来。

本阶段只要求必要 build / smoke / 局部测试，证明没有明显断裂。等模块划分和核心开发推进到稳定面后，再统一做跨仓库大验收、负向扫描、归档和发布链路检查。

## 真实代码发现

- `Alembic/lib/daemon/DaemonSupervisor.ts` 与 `AlembicPlugin/lib/daemon/DaemonSupervisor.ts` 仍有相近 daemon lifecycle / state / health 代码；需要明确主实现、Plugin adapter 和 embedded runtime 边界。
- `AlembicPlugin/lib/codex/ProjectRootResolver.ts` 已有 Codex projectRoot 候选、信任和保存逻辑；`Alembic` CLI / daemon 通过 `WorkspaceResolver`、`ProjectRegistry` 和 daemon state 管理本地项目。
- `Alembic/lib/service/evolution/DaemonFileChangeCollector.ts` 已经体现 daemon-owned git worktree file monitor；`AlembicPlugin/lib/service/evolution/git-diff-checkpoint/*` 和 `FileChangeDispatcher` 仍存在扫描 / 分发相关实现，需要区分 plugin embedded runtime 与 Codex adapter。
- `AlembicPlugin/lib/codex/EnhancementRoute.ts` 已能描述 local daemon / embedded runtime / local install / unavailable，但还需要和多项目运行模型、Dashboard API 展示边界对齐。
- `AlembicDashboard/src/types.ts` 和 `src/api.ts` 主要消费 `projectRoot`、`dataRoot`、`projectId`、`watcherStatus`、`aiConfig`；前端还没有稳定的 runtime route / capability / project registry 展示边界。
- `AlembicAgent` 已把 Tool V2 默认 source 切到 `alembic-agent`，但还需要把 internal AI runtime、terminal / sandbox tool capability、host-agent workflow helper import 的边界整理清楚。

## 本阶段目标

- 建立多项目运行模型边界：projectRoot / projectId / dataRoot / daemon state / active route 的共享 contract 与消费方式。
- 明确文件监控扫描归属：Alembic daemon 拥有长期 file monitor；Plugin 只做 host event bridge、embedded runtime adapter 或短期兼容；Dashboard 只展示能力与状态。
- 明确 Alembic / AlembicPlugin / Dashboard 前端边界：前端产品归 `AlembicDashboard`，运行和服务归 `Alembic`，`AlembicPlugin` 只做 Codex 入口和 Dashboard URL handoff，不做前端所有者。
- 明确 internal AI 与 Codex host-agent 两条线的模块分层：Alembic + AlembicAgent 负责 internal AI runtime；Plugin 负责 Codex host-agent route；Core 提供 headless contract。
- 暂不做跨仓库大验收归档；本波完成后只回填轻量验证证据和下一波建议。

## 前端边界计划

当前不要一次性删除 Plugin artifact 内的 Dashboard dist。本阶段按三步推进：

1. `AlembicPlugin` 不再拥有前端源码和前端逻辑，只保留 Dashboard URL handoff、Codex tool 返回链接和必要的 artifact 指向。
2. 评估 Plugin artifact 内的 `dashboard/dist` 是否应改成来自 `Alembic` / `AlembicDashboard` release asset，而不是 Plugin 自己构建或维护。
3. 只有确认 Codex 插件可以依赖本机 Alembic 的 Dashboard server / release asset 后，才允许删除 Plugin 内嵌 Dashboard dist。

本波只做前两步的模块边界和证据准备；第三步删除动作留给后续专门计划。

## 执行节奏

- 本波可以并行启动 `AlembicCore`、`Alembic`、`AlembicPlugin`、`AlembicAgent`、`AlembicDashboard`。
- 如果某个消费层发现 Core contract 不足，只回填缺口和建议，不要在本仓库自造长期 contract。
- 本波只跑必要 build / smoke / 局部测试；不要求全量负向扫描、归档或发布链路检查。
- `BiliDili` 不进入本轮；等模块稳定后再作为真实项目 smoke。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>已完成 | 已补多项目 runtime / capability / file monitor 的 headless public contract，避免 Alembic 与 Plugin 各自定义 shape；提交 `58e21d64fc47e8c96b2885ac23b2d32460317497`。 |
| `Alembic`<br>已完成 | 已新增 runtime boundary capability adapter，明确 ProjectRegistry / WorkspaceResolver、daemon state、file monitor、JobStore、Dashboard handoff 与 internal AI job 归属；提交 `6b601b43a5b3a31a2f1af2687e4824500504a28a`。 |
| `AlembicPlugin`<br>已完成 | 已新增 Codex module boundary status，明确 Codex adapter / embedded runtime adapter / Dashboard artifact 边界，并消费 Core runtime capability summary helper；提交 `bdd98989b11fe6f8aa143913418a99fc37df4a67`，embedded runtime 子仓库提交 `014d014fc6474b8ca5514687caf04d34aee1529c`。 |
| `AlembicAgent`<br>已完成 | 已新增 internal runtime boundary public contract，明确 Agent 只服务 Alembic internal AI runtime，不承接 Plugin host-agent route；提交 `e043122efb55c050a33cc06b9a6067ce685593c6`。 |
| `AlembicDashboard`<br>已完成 | 已新增前端 runtime boundary view model 与 Header 能力展示；提交 `d537a6cdddc3b34b869bd3b7b355d15003b20588`。 |
| `BiliDili`<br>无任务 | 本波是模块划分前期开发，不做真实项目 smoke。 |

## AlembicCore 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicCore/alembic-module-boundary-foundation-wave-1-core-contracts-2026-05-18.md`

挂载入口：本文“回填区 / AlembicCore”。

目标：

- 读取现有 `@alembic/core/daemon`、`@alembic/core/workspace`、source contract 和 public exports，判断是否需要补充稳定 public types / helpers。
- 优先补充 headless contract，而不是引入 daemon / HTTP / Dashboard / Codex 依赖。可考虑 runtime identity、project identity、capability summary、file monitor capability、route kind 等类型。
- 保证 Alembic / Plugin / Dashboard 可以通过 public entrypoints 消费，不需要 deep import。
- 如果现有 contract 已足够，只提交文档证据和最小测试，不强行造抽象。

建议验证命令：

```text
npm run build:check
npm run smoke:public-api
npm run lint:public-api-boundary
git diff --check
```

## Alembic 执行要求

文档动作：新建执行记录。

保存位置：`docs/Alembic/alembic-module-boundary-foundation-wave-1-runtime-monitor-2026-05-18.md`

挂载入口：本文“回填区 / Alembic”。

目标：

- 梳理 `ProjectRegistry`、`WorkspaceResolver`、daemon state、daemon health/capabilities 的主实现归属，形成本地多项目运行模型的稳定模块边界。
- 梳理 `DaemonFileChangeCollector`、`FileChangeDispatcher`、`FileChangeHandler`、HTTP `/file-changes` 的归属关系；把 Alembic daemon 作为长期 file monitor 主实现。
- 确认 internal AI jobs、JobStore、Dashboard server、HTTP API 仍归 Alembic，本波不迁给 Plugin。
- 可做轻量代码调整：新增 runtime/capability adapter、补导出、补局部测试、调整注释或目录边界；不做大规模搬迁。

建议验证命令：

```text
npm run build:check
npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts
npm run lint:consumer-core-imports
git diff --check
```

## AlembicPlugin 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicPlugin/alembic-module-boundary-foundation-wave-1-plugin-adapters-2026-05-18.md`

挂载入口：本文“回填区 / AlembicPlugin”。

目标：

- 梳理 `ProjectRootResolver`、`EnhancementRoute`、`DaemonSupervisor`、Codex MCP server、status/diagnostics/onboarding 的 adapter 边界。
- 明确 Plugin 拥有 Codex entry / host-agent tool route / marketplace artifact / runtime packaging；不长期拥有 Alembic daemon、ProjectRegistry、JobStore、file monitor 或 internal AI runtime。
- 对 embedded runtime 做边界标注或 adapter 分层，避免和本地 Alembic install enhancement route 混在同一层。
- 前端边界：Plugin 不拥有 Dashboard 前端源码和前端逻辑；本波保留 Dashboard URL handoff 和必要 artifact，不删除内嵌 Dashboard dist。
- 评估 Plugin artifact 内 `dashboard/dist` 来源：记录当前来源、构建入口、与 `AlembicDashboard` release asset 的差异，以及后续切换条件。
- 消费 Core / Alembic capability shape；如果缺字段，回填缺口，不复制主实现。

建议验证命令：

```text
npm run build:check
npm run test:unit -- test/unit/CodexEnhancementRoute.test.ts test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts
npm run verify:codex-plugin
npm run smoke:codex-plugin
git diff --check
```

## AlembicAgent 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicAgent/alembic-module-boundary-foundation-wave-1-internal-runtime-2026-05-18.md`

挂载入口：本文“回填区 / AlembicAgent”。

目标：

- 梳理 internal AI runtime 模块：AI provider、tool execution、terminal / sandbox、context / memory / prompt、Tool V2 handler 与 public export 的边界。
- 明确 AlembicAgent 只服务 Alembic internal AI runtime，不承接 Plugin Codex MCP / marketplace / host-agent route。
- 保留 terminal / sandbox 作为 Agent tool capability，并检查其 public contract 是否足够 Alembic 消费。
- 可做轻量整理：目录注释、public export 补齐、边界测试或 smoke，避免大规模重构。

建议验证命令：

```text
npm run build:check
npm run smoke:public-imports
npm run lint:public-api-boundary
npx vitest run test/tool-v2-contract.test.ts
git diff --check
```

## AlembicDashboard 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicDashboard/alembic-module-boundary-foundation-wave-1-frontend-contract-2026-05-18.md`

挂载入口：本文“回填区 / AlembicDashboard”。

目标：

- 梳理 Dashboard API client / types / UI 状态边界：project identity、runtime route、daemon capability、file monitor status、internal AI provider config、host-agent route 展示。
- 前端只消费 API / capability contract，不实现 daemon route policy、ProjectRegistry、file monitor 或 internal AI 决策。
- 明确 Dashboard 是前端产品所有者；如需供 `Alembic` 或 `AlembicPlugin` 使用，应通过 build artifact / release asset / API contract 输出，不把源码迁入 Plugin。
- 如果后端字段不足，先做兼容类型 / fallback 展示，并在执行记录中列出需要 Alembic / Plugin 补齐的字段。
- 可做轻量 UI / type / helper 调整，不做大规模界面改版。

建议验证命令：

```text
npm run build
git diff --check
```

## 轻量验收条件

本波不做跨仓库大验收归档。窗口完成后只需满足：

- 每个窗口有执行记录、提交 hash、完成范围、必要验证结果和下一波建议。
- build / smoke / 局部测试通过，或明确标注既有无关失败。
- 没有引入明显反向依赖：Core 不依赖 UI/daemon/Codex；Plugin 不复制长期 Alembic runtime 主实现；Dashboard 不拥有后端策略；Agent 不承接 host-agent route。
- 如果发现需要下一波拆迁的大块重复实现，先记录边界和迁移建议，不在本波硬拆。

总控复核命令：

```text
node scripts/verify-workspace-docs.mjs --all-workspace
node scripts/check-dispatch-coverage.mjs
git diff --check
```

## 总控轻量验收结果

状态：通过。

复核结论：

- 五个产品仓库 worktree 均为 clean。
- `AlembicCore` 提交 `58e21d6` 提供 runtime/capability/file monitor headless contract，未引入 UI / daemon / Codex 反向依赖。
- `Alembic` 提交 `6b601b4` 提供 Alembic-owned runtime boundary 和 daemon health capability adapter；下一波应继续对齐 Core canonical helper，减少本地重复 shape。
- `AlembicPlugin` 提交 `bdd9898` 与 embedded runtime 子仓库提交 `014d014` 明确 Codex entry / host-agent route / portable runtime / Dashboard URL handoff；仍保留 embedded runtime compatibility 和 `dashboard/dist`，符合本波不删除策略。
- `AlembicAgent` 提交 `e043122` 明确 `alembic-internal-ai` runtime line，terminal / sandbox 仍是 Agent tool capability，host-agent route 不由 Agent 承接。
- `AlembicDashboard` 提交 `d537a6c` 只新增 runtime boundary view model 与 Header 展示，未引入后端策略实现。

总控实际验证：

```text
AlembicCore: npm run build:check
AlembicCore: npm run test -- test/RuntimeContracts.test.ts test/PublicFoundationEntrypoints.test.ts
Alembic: npm run build:check
Alembic: npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts
AlembicPlugin: npm run build:check
AlembicPlugin: npm run test:unit -- test/unit/CodexModuleBoundary.test.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts
AlembicAgent: npm run build:check
AlembicAgent: npx vitest run test/contract-surface.test.ts test/tool-v2-contract.test.ts
AlembicDashboard: npm run build
Workspace: node scripts/verify-workspace-docs.mjs --all-workspace
Workspace: node scripts/check-dispatch-coverage.mjs
Workspace: git diff --check
```

结果：

- 上述验证均通过。
- `AlembicDashboard` build 仍有既有 Vite large chunk warning，不阻塞本波。
- 下一波计划已新建：[alembic-runtime-contract-consumption-wave-2-workspace-plan-2026-05-18.md](alembic-runtime-contract-consumption-wave-2-workspace-plan-2026-05-18.md)。

## 可复制分派提示词

发送给：无

```text
本轮窗口均已回填，等待总控复核；无需发送领取提示词。
```

不发送给：`AlembicCore`（已完成）、`Alembic`（已完成）、`AlembicPlugin`（已完成）、`AlembicAgent`（已完成）、`AlembicDashboard`（已完成）、`BiliDili`。

## 回填区

### AlembicCore

- 状态：已完成
- 执行记录：[`docs/AlembicCore/alembic-module-boundary-foundation-wave-1-core-contracts-2026-05-18.md`](../AlembicCore/alembic-module-boundary-foundation-wave-1-core-contracts-2026-05-18.md)
- 提交 hash：`58e21d64fc47e8c96b2885ac23b2d32460317497`
- 完成范围：
  - 新增 `@alembic/core/daemon` runtime / capability / file monitor headless contract。
  - 新增 `AlembicRuntimeProjectIdentity`、`AlembicRuntimeEnhancementIdentity`、`AlembicRuntimeHealthData`，覆盖 `projectRoot` / `dataRoot` / `projectId` / daemon mode / route / version / schema migration 信息。
  - 新增 `AlembicRuntimeCapabilities`、`AlembicFileMonitorCapability`、`AlembicInternalAiCapability`、`AlembicJobsCapability`，覆盖 API、Dashboard、daemon-owned file monitor、internal AI 和 bootstrap / rescan jobs。
  - 新增 `createAlembicRuntimeCapabilities()`、`createAlembicRuntimeHealthData()`、`summarizeAlembicRuntimeCapabilities()` 和 route / file monitor normalizer，供 Alembic / Plugin / Dashboard 通过 public entrypoint 消费。
  - Public API smoke 增加 `@alembic/core/daemon` contract 检查；补 `RuntimeContracts` 和 foundation entrypoint 局部测试。
- 验证命令与结果：
  - `npm run build:check`：通过。
  - `npm run lint`：通过，419 files checked。
  - `npm run test -- test/RuntimeContracts.test.ts test/PublicFoundationEntrypoints.test.ts`：通过，2 files / 10 tests。
  - `npm run lint:public-api-boundary`：通过，136 package exports classified；stable=17 / provisional=21 / transitional=98。
  - `npm run build`：通过；`dist/` 为 ignored 构建产物，未提交。
  - `npm run smoke:public-api`：通过，Imported 75 exact public API entrypoints。
  - `git diff --check`：通过。
- 遗留风险：
  - 本阶段只补 Core contract，Alembic / AlembicPlugin / AlembicDashboard 尚未切换真实消费代码。
  - `embedded-plugin-runtime` 作为 route kind 进入 Core contract 只用于描述现有 Plugin adapter route，不代表 Core 拥有 Plugin runtime。
- 下一波模块划分建议：
  - Alembic 用 Core helper 生成 `/api/v1/daemon/health` 的 `enhancement` / `capabilities`。
  - AlembicPlugin 已收敛 daemon capability summary 到 Core helper；下一波继续对齐 Alembic daemon health 的 `runtimeBoundary` route / file monitor owner。
  - AlembicDashboard 对齐 `AlembicRuntimeHealthData` / `AlembicRuntimeCapabilities` 前端 API 类型，只展示 capability 和 route。

### Alembic

- 状态：已完成
- 执行记录：[`docs/Alembic/alembic-module-boundary-foundation-wave-1-runtime-monitor-2026-05-18.md`](../Alembic/alembic-module-boundary-foundation-wave-1-runtime-monitor-2026-05-18.md)
- 提交 hash：`6b601b43a5b3a31a2f1af2687e4824500504a28a`
- 完成范围：
  - 新增 `lib/daemon/RuntimeBoundary.ts`，集中声明 Alembic 本地 runtime / capability 边界：`local-alembic` route、workspace contract、daemon state contract、Dashboard handoff、file monitor owner、JobStore owner、internal AI owner。
  - daemon health `capabilities` 增加 `runtimeBoundary`，供 Plugin / Dashboard 后续 route choice 与展示消费。
  - `/api/v1/file-changes` 与 daemon capability 复用同一份 canonical file-change event source 常量。
  - 扩展 `DaemonCapabilities` 单测，覆盖 runtime boundary owner、file monitor、JobStore、Dashboard handoff 和 internal AI runtime owner。
- 验证命令与结果：
  - `npm run build:check`：通过。
  - `npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts`：通过，2 个测试文件、5 个测试通过。
  - `npm run lint:consumer-core-imports`：通过，扫描 416 个文件、560 个 `@alembic/core` imports。
  - `npx biome check --diagnostic-level=error lib/daemon/RuntimeBoundary.ts lib/http/routes/daemon.ts lib/http/routes/file-changes.ts test/unit/DaemonCapabilities.test.ts`：通过。
  - `git diff --check`：通过。
  - `git diff --check HEAD~1..HEAD`：通过。
- 遗留风险：
  - `runtimeBoundary` 是 Alembic 本地主仓库 capability adapter；若 Core 本波补出 canonical runtime / capability public type，下一波应对齐字段和类型名称。
  - 本波没有重构 `DaemonSupervisor` 或拆 Plugin embedded runtime，只提供稳定边界摘要。
- 下一波模块划分建议：
  - `AlembicPlugin` route resolver 优先消费 daemon health 的 `enhancement.route` 与 `capabilities.runtimeBoundary`，保留 embedded runtime 作为 adapter fallback。
  - `AlembicDashboard` API types 可增加 runtime boundary 兼容类型，展示 project identity、file monitor owner、internal AI config 和 Dashboard handoff，不实现后端策略。
  - 若 `AlembicCore` 输出 canonical `RuntimeCapability` / `FileMonitorCapability` / `RouteKind`，Alembic 下一波将 `RuntimeBoundary` 对齐到 Core public type。

### AlembicPlugin

- 状态：已完成
- 执行记录：[`docs/AlembicPlugin/alembic-module-boundary-foundation-wave-1-plugin-adapters-2026-05-18.md`](../AlembicPlugin/alembic-module-boundary-foundation-wave-1-plugin-adapters-2026-05-18.md)
- 提交 hash：
  - AlembicPlugin：`bdd98989b11fe6f8aa143913418a99fc37df4a67`
  - embedded Codex runtime 子仓库：`014d014fc6474b8ca5514687caf04d34aee1529c`
  - portable runtime 内嵌 Core source：`58e21d64fc47e8c96b2885ac23b2d32460317497`
- 完成范围：
  - 新增 `lib/codex/ModuleBoundary.ts`，用 `CodexModuleBoundaryStatus` 明确 Plugin owns Codex entry / host-agent tool route / marketplace artifact / portable runtime packaging / Dashboard URL handoff。
  - 明确 Plugin 不长期拥有 Alembic daemon、ProjectRegistry、JobStore、file monitor、internal AI runtime 或 Dashboard frontend source。
  - `buildCodexStatus()` 与 `buildCodexRuntimeDiagnostics()` 新增 `moduleBoundary` 输出，Codex status / diagnostics 可直接展示模块归属和 Dashboard artifact 边界。
  - `EnhancementRoute` 的 daemon capability summary 改为消费 `@alembic/core/daemon` 的 `summarizeAlembicRuntimeCapabilities()`，不再由 Plugin 手写 API / Dashboard / jobs / fileMonitor summary。
  - Dashboard 边界记录为 `dashboard/dist` retained artifact；构建入口为 `npm run build:dashboard` / `scripts/build-dashboard.mjs`，来源通过 `scripts/local-source-paths.mjs#resolveDashboardSource` 优先 `../AlembicDashboard`、fallback `vendor/AlembicDashboard`；本波不删除内嵌 dist。
  - 刷新 `plugins/alembic-codex` portable runtime artifact，继续保留 `vendor/AlembicCore` 与 `.alembic-source.json`，未引入 `@alembic/agent`。
- 验证命令与结果：
  - `./node_modules/.bin/biome check lib/codex/EnhancementRoute.ts lib/codex/Diagnostics.ts lib/codex/StatusService.ts lib/codex/ModuleBoundary.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexModuleBoundary.test.ts test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts`：通过。
  - `npm run build:check`：通过；Core build 使用 `../AlembicCore @ 58e21d64fc47e8c96b2885ac23b2d32460317497`。
  - `npm run test:unit -- test/unit/CodexModuleBoundary.test.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts`：通过，4 个测试文件 / 39 个测试。
  - `npm run build`：通过。
  - `npm run prepare:codex-plugin-runtime`：通过，刷新 `plugins/alembic-codex/runtime` 与 `runtime.tgz`。
  - `npm run verify:codex-plugin`：通过，`./runtime.tgz -> alembic-ai@0.1.2`。
  - `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime passed；recovery / daemon skipped。
  - `git diff --check`：通过。
  - `git -C plugins/alembic-codex diff --check`：通过。
- 遗留风险：
  - `EnhancementRoute` 已消费 Core capability summary helper，但 route choice、internal AI provider config extraction 和 local install fallback 仍是 Plugin adapter 逻辑；下一波应消费 Alembic daemon health canonical `runtimeBoundary` 字段。
  - `DaemonSupervisor`、`DaemonJobRunner`、git-diff checkpoint 和 JobStore fallback 仍作为 embedded runtime compatibility 存在；本波只做边界标注和 status 暴露，没有强拆兼容层。
  - `dashboard/dist` 仍由 Plugin release flow 构建并打包；切到 Alembic / AlembicDashboard release asset 需要后续明确 artifact contract。
  - 本波未做跨仓库大验收归档，也未启用 smoke 脚本的 daemon / recovery 路径，符合前期开发范围。
- 下一波模块划分建议：
  - AlembicPlugin 下一波继续把 route choice、file monitor owner 和 local / embedded route reason 对齐到 Alembic daemon health 的 `runtimeBoundary`，避免在 Plugin 保留长期 route policy shape。
  - Alembic daemon health 稳定输出 `runtimeBoundary`、file monitor owner、jobs capability、internal AI provider config 和 Dashboard handoff 字段后，Plugin 只消费并展示缺口。
  - Dashboard artifact 后续切到 AlembicDashboard 或 Alembic 发布产物；Plugin 只负责 portable runtime 打包和 Dashboard URL handoff。
  - 等 Alembic daemon API 覆盖 job status、file monitor 和 checkpoint 后，再收缩 Plugin embedded runtime compatibility adapter。

### AlembicAgent

- 状态：已完成
- 执行记录：[`docs/AlembicAgent/alembic-module-boundary-foundation-wave-1-internal-runtime-2026-05-18.md`](../AlembicAgent/alembic-module-boundary-foundation-wave-1-internal-runtime-2026-05-18.md)
- 提交 hash：`e043122efb55c050a33cc06b9a6067ce685593c6`
- 完成范围：
  - 新增 `AgentRuntimeBoundary` public contract，由 `@alembic/agent/runtime` 导出。
  - 明确 `AlembicAgent` runtimeLine 为 `alembic-internal-ai`，`hostAgentRouteSupported` 为 `false`。
  - 将 AI provider、tool execution、terminal / sandbox、context / memory、prompt runtime、Tool V2 的 public subpath 和 ownership 写入 manifest。
  - 显式标记 `host-agent-route` 为 host / Plugin-owned，不提供 Agent public subpath。
  - terminal / sandbox 继续作为 Agent tool capability；`@alembic/core/host-agent-workflows` 仅作为 Core public helper 引用。
  - 更新 public API boundary matrix，并补充 contract surface 测试。
- 验证命令与结果：
  - `npx biome format --write src/agent/runtime/AgentRuntimeBoundary.ts src/agent/runtime/index.ts test/contract-surface.test.ts`：通过，3 个文件处理，1 个文件格式化。
  - `npx vitest run test/contract-surface.test.ts`：通过，1 个测试文件、5 个测试通过。
  - `npm run build:check`：通过。
  - `npm run smoke:public-imports`：通过，15 个 public subpath 可导入，5 个 forbidden subpath 被拒绝。
  - `npm run lint:public-api-boundary`：通过，15 个精确 export，无 wildcard export。
  - `npx vitest run test/tool-v2-contract.test.ts`：通过，1 个测试文件、6 个测试通过。
  - `npx vitest run test/contract-surface.test.ts test/tool-v2-contract.test.ts`：通过，2 个测试文件、11 个测试通过。
  - `git diff --check`：通过。
- 遗留风险：
  - `AgentRuntimeBoundary` 是 Agent 侧模块边界 manifest，不替代 Core 的多项目 runtime / capability contract。
  - `@alembic/core/host-agent-workflows` 仍可能作为 Core public helper 名称出现，不代表 Agent 承接 Plugin host-agent route。
- 下一波模块划分建议：
  - 若 `AlembicCore` 本波补出 canonical runtime / route kind / capability shape，下一波可让 `AgentRuntimeBoundary` 对齐 Core canonical 类型。
  - `Alembic` 消费 internal AI runtime 时优先使用 `@alembic/agent/runtime`、`@alembic/agent/ai`、`@alembic/agent/tools/v2`、`@alembic/agent/tools/terminal`。
  - `AlembicPlugin` host-agent route 继续留在 Plugin Codex adapter 层，不从 Agent 引入 Codex MCP / marketplace 路由。

### AlembicDashboard

- 状态：已完成
- 执行记录：[`docs/AlembicDashboard/alembic-module-boundary-foundation-wave-1-frontend-contract-2026-05-18.md`](../AlembicDashboard/alembic-module-boundary-foundation-wave-1-frontend-contract-2026-05-18.md)
- 提交 hash：`d537a6cdddc3b34b869bd3b7b355d15003b20588`
- 完成范围：
  - `src/types.ts` 新增 `RuntimeBoundary` view model，覆盖 project identity、runtime route、daemon capability、file monitor、jobs、internal AI provider config 和可选 host-agent route。
  - `src/api.ts` 兼容读取 `/daemon/health` 与 `/modules/project-info`，归一化为 `ProjectData.runtimeBoundary`；缺失 daemon health 时 fallback 为 `unknown`，不阻塞 Dashboard 主数据。
  - `ProjectData.watcherStatus` 改为从 file monitor capability 派生，不再前端硬写 active。
  - Header 新增运行边界状态胶囊和 tooltip，只展示 route / capability 摘要，不实现 daemon route policy。
  - 未迁移 Dashboard 源码到 Plugin，未引入 ProjectRegistry、WorkspaceResolver、daemon state、file monitor、JobStore 或 internal AI 决策。
- 验证命令与结果：
  - `npm run build`：通过；Vite 仍提示既有 large chunk warning。
  - `git diff --check`：通过。
  - `rg -n "runtimeBoundary|RuntimeBoundary|daemon/health|ProjectRegistry|FileChange|WorkspaceResolver|internal AI decision|route policy" src --glob '!**/dist/**'`：通过；命中仅为新增前端 view model、API normalizer、Header 展示和 i18n 文案，未引入后端策略实现或 Registry / WorkspaceResolver 依赖。
- 遗留风险：
  - `/daemon/health` 由 Alembic 提供；Plugin embedded runtime 或旧后端缺失时 Dashboard 会显示 `unknown` route / capability，需要下一波补 canonical contract。
  - `hostAgentRoute` 只做可选展示字段，当前 Alembic daemon health 未提供，需要 AlembicPlugin 或 Core 后续确认。
  - 本轮未做浏览器截图或跨仓库大验收，符合 Wave 1 前期开发范围。
- 下一波模块划分建议：
  - 若 `AlembicCore` 补出 canonical runtime / route kind / capability summary 类型，Dashboard 下一波应对齐该 public contract。
  - `Alembic` 可稳定输出 `dataRootSource`、file monitor status、jobs capability 和 internal AI provider config。
  - `AlembicPlugin` 可补 Dashboard handoff 所需 `hostAgentRoute` / `enhancementRoute` 字段；Dashboard 继续只展示，不决定 route。
  - 前端 artifact 归属建议下一波明确 release asset / build artifact 交付方式，Plugin 只消费 URL 或产物，不维护 Dashboard 源码逻辑。

### BiliDili

- 状态：无任务
