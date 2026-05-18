# Alembic Runtime Contract Consumption Wave 2 Workspace Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已验收；Alembic、AlembicPlugin、AlembicDashboard 均完成并通过总控轻量复核
阶段：前期开发 / 模块划分

## 背景

Wave 1 已完成模块边界的第一层落位：`AlembicCore` 提供 runtime / capability / file monitor headless contract，`Alembic` 暴露本地 runtime boundary，`AlembicPlugin` 标清 Codex adapter 与 Dashboard artifact 边界，`AlembicAgent` 标清 internal AI runtime，`AlembicDashboard` 开始消费 runtime boundary 展示。

本波不做大验收归档，也不做发布链路检查。目标是把 Wave 1 的边界从“声明清楚”推进到“消费清楚”：消费层尽量使用 `@alembic/core` 的 canonical runtime/capability contract，减少 Alembic / Plugin / Dashboard 各自手写 shape。

## 真实代码发现

- `AlembicCore/src/daemon/RuntimeContracts.ts` 已提供 `AlembicRuntimeHealthData`、`AlembicRuntimeCapabilities`、`createAlembicRuntimeCapabilities()`、`createAlembicRuntimeHealthData()`、`summarizeAlembicRuntimeCapabilities()` 和 route / file monitor constants。
- `Alembic/lib/daemon/RuntimeBoundary.ts` 目前仍有本地 route、file monitor、job kind、owner shape；`Alembic/lib/http/routes/daemon.ts` 还手写 health `enhancement` / `capabilities`，下一步应尽量由 Core helper 生成或归一化。
- `AlembicPlugin/lib/codex/EnhancementRoute.ts` 已消费 Core capability summary helper，但 route choice、local install fallback、internal AI provider extraction 仍在 Plugin adapter 层；本波要确保它消费 Alembic daemon health，不再扩张 Plugin-local runtime policy shape。
- `AlembicDashboard/src/api.ts` 已从 `/daemon/health` 与 `/modules/project-info` 归一化 `RuntimeBoundary`，但前端类型仍是本地 view model；本波要对齐 Alembic health 的 canonical 字段，继续只展示能力，不实现后端策略。
- `AlembicPlugin` 仍保留 `dashboard/dist` 打包与 Dashboard URL handoff。当前路线不直接删除内嵌 dist：先把前端产品所有权固定在 `AlembicDashboard`，再评估 release asset / local Alembic 依赖后再删除。

## 本波目标

- Alembic daemon health 尽量输出 Core canonical `enhancement` / `capabilities` / project identity，补齐 `dataRootSource`、file monitor、jobs、internal AI 和 Dashboard handoff 的稳定字段。
- AlembicPlugin route/status/diagnostics 只消费 Alembic daemon health 与 Core summary，不继续复制长期 runtime boundary 主实现。
- AlembicDashboard 对齐 daemon health 字段，只保留 view-model normalizer 和 UI 展示，不引入 ProjectRegistry、file monitor、JobStore 或 route policy。
- Dashboard artifact 继续保守推进：Plugin 不拥有前端源码和前端逻辑，只保留 URL handoff 与必要 artifact；本波产出 release asset 切换条件和代码边界证据，不删除 `dashboard/dist`。

## 执行节奏

- 本波原始可并行发送给 `Alembic`、`AlembicPlugin`、`AlembicDashboard`；当前三个执行窗口均已回填待验收，等待总控复核。
- 软依赖：`Alembic` 的 daemon health 是 Plugin / Dashboard 的最终消费面；如果 Plugin / Dashboard 先执行，必须兼容当前 health shape，发现缺字段只回填缺口，不在本仓库自造长期 contract。
- `AlembicCore` 本波观察，不发送提示词；只有消费者明确证明 Core contract 缺字段时，下一波再补 Core。
- `AlembicAgent` 本波观察，不发送提示词；internal AI runtime 边界已经足够本波消费层对齐。
- `BiliDili` 不进入本波；等模块划分稳定后再做真实项目 smoke。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | 已对齐 `/api/v1/daemon/health` 到 Core runtime/capability contract，并补稳定 project identity / file monitor / jobs / Dashboard handoff 字段；执行记录见 [alembic-runtime-contract-consumption-wave-2-daemon-health-2026-05-18.md](../Alembic/alembic-runtime-contract-consumption-wave-2-daemon-health-2026-05-18.md)。 |
| `AlembicPlugin`<br>已完成 | 已让 route/status/diagnostics 消费 Alembic daemon health、Core summary 与 runtimeBoundary fallback；执行记录见 [alembic-runtime-contract-consumption-wave-2-plugin-route-2026-05-18.md](../AlembicPlugin/alembic-runtime-contract-consumption-wave-2-plugin-route-2026-05-18.md)。 |
| `AlembicDashboard`<br>已完成 | 已对齐前端 runtime view model 到 Alembic daemon health；只展示 route/capability/project identity，不实现后端策略；执行记录见 [alembic-runtime-contract-consumption-wave-2-dashboard-view-2026-05-18.md](../AlembicDashboard/alembic-runtime-contract-consumption-wave-2-dashboard-view-2026-05-18.md)。 |
| `AlembicCore`<br>观察中 | 本波不主动改 Core；等待消费者证明 canonical contract 缺口。 |
| `AlembicAgent`<br>观察中 | 本波不主动改 Agent；保持 internal AI runtime boundary，等待 Alembic 消费反馈。 |
| `BiliDili`<br>无任务 | 本波仍是模块划分前期开发，不做真实项目 smoke。 |

## Alembic 执行要求

文档动作：新建执行记录。

保存位置：`docs/Alembic/alembic-runtime-contract-consumption-wave-2-daemon-health-2026-05-18.md`

挂载入口：本文“回填区 / Alembic”。

目标：

- 让 `/api/v1/daemon/health` 尽量使用 `@alembic/core/daemon` 的 helper / constants / types 构建 `enhancement`、`capabilities` 和 route/file monitor/job 字段。
- 保留 Alembic 自己对 daemon、WorkspaceResolver、ProjectRegistry、JobStore、Dashboard server、file monitor 和 internal AI job 的主实现所有权；不要把主实现迁给 Plugin。
- 补齐或稳定 `dataRootSource`、`runtimeDir`、`dashboardUrl`、file monitor availability、job endpoints、internal AI config source 等 Dashboard / Plugin 需要消费的字段。
- 如果发现 Core helper 缺少必要字段，先在执行记录中写明最小缺口和建议；本波不要在 Alembic 里复制长期 Core contract。
- 保持 `runtimeBoundary` 可以作为 Alembic-owned adapter 摘要，但字段应尽量从 Core contract 派生或与 Core 命名一致。

建议验证命令：

```text
npm run build:check
npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts
npm run lint:consumer-core-imports
git diff --check
```

## AlembicPlugin 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicPlugin/alembic-runtime-contract-consumption-wave-2-plugin-route-2026-05-18.md`

挂载入口：本文“回填区 / AlembicPlugin”。

目标：

- `EnhancementRoute`、status、diagnostics 优先消费 Alembic daemon health 的 `enhancement`、`capabilities`、`runtimeBoundary` 或等价 canonical 字段；保留 Plugin-local adapter 只做 Codex route choice 与 fallback。
- `host-agent` 继续只表示 Codex 宿主 Agent 路线；internal AI provider 继续只是 provider/config state，不作为 host-agent 来源。
- 保留 embedded runtime fallback，但明确它是 portable compatibility adapter，不是长期 Alembic daemon 主实现。
- Dashboard 前端边界：Plugin 不拥有 Dashboard 源码和前端逻辑；本波只保留 `dashboard/dist` artifact、Dashboard URL handoff 和构建/打包兼容，补充 release asset 切换条件或检查项。
- 如果 Alembic daemon health 缺字段，只回填缺口，不在 Plugin 增加新的长期 runtime contract。

建议验证命令：

```text
npm run build:check
npm run test:unit -- test/unit/CodexModuleBoundary.test.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts
npm run smoke:codex-plugin
git diff --check
git -C plugins/alembic-codex diff --check
```

## AlembicDashboard 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicDashboard/alembic-runtime-contract-consumption-wave-2-dashboard-view-2026-05-18.md`

挂载入口：本文“回填区 / AlembicDashboard”。

目标：

- 对齐 `RuntimeBoundary` view model 到 Alembic daemon health 的 canonical project identity、route、capability、file monitor、jobs、internal AI 与 Dashboard handoff 字段。
- 前端只做 API normalizer 和 UI 展示，不实现 daemon route policy、ProjectRegistry、WorkspaceResolver、file monitor、JobStore 或 internal AI 决策。
- 对缺失字段做兼容 fallback，并在执行记录中列出需要 Alembic / Plugin 后续补齐的字段。
- 记录 Dashboard artifact 对外输出需要的最小契约，例如 build output、版本/来源元数据、release asset 或 local source handoff；不把源码迁入 Plugin。

建议验证命令：

```text
npm run build
git diff --check
```

## 轻量完成条件

- 三个执行窗口均有执行记录、提交 hash、完成范围、必要验证结果和下一波建议。
- Alembic daemon health 的消费字段更加 canonical，Plugin / Dashboard 不再扩张自己的长期 runtime policy shape。
- Plugin 继续只作为 Codex 入口和 Dashboard URL handoff；不删除 `dashboard/dist`，但要把后续 release asset / local Alembic 切换条件写清楚。
- 本波只做必要 build / smoke / 局部测试；不要求大验收归档、负向扫描或发布链路检查。

总控复核命令：

```text
node scripts/verify-workspace-docs.mjs --all-workspace
node scripts/check-dispatch-coverage.mjs
git diff --check
```

## 总控轻量验收结果

状态：通过。

复核结论：

- `Alembic` 提交 `9ea629f` 已用 Core helper 生成 daemon health 主体，`RuntimeBoundary` 改为消费 Core types/constants，仍保留 Alembic-owned attribution / handoff 摘要。
- `AlembicPlugin` 提交 `61144ef` 与 embedded runtime 子仓库提交 `be01059` 已消费 Alembic daemon health、Core summary 与 `runtimeBoundary` fallback；Plugin 未扩张长期 runtime 主实现，`host-agent` 与 internal AI provider state 仍分离。
- `AlembicDashboard` 提交 `77d48fd` 已对齐 runtime view model 到 daemon health，仍只做 API normalizer 与 UI 展示，未引入后端策略实现。
- 三个产品仓库 worktree 均为 clean。
- 当前共同遗留不是消费层问题，而是 Core canonical project identity 缺字段：`dataRootSource`、`runtimeDir`、`workspaceMode` 等仍由 Alembic health extension / runtimeBoundary 兼容提供。下一波应先处理 Core + Alembic provider。

总控实际验证：

```text
Alembic: npm run build:check
Alembic: npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts
Alembic: npm run lint:consumer-core-imports
Alembic: git diff --check
AlembicPlugin: npm run build:check
AlembicPlugin: npm run test:unit -- test/unit/CodexModuleBoundary.test.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts
AlembicPlugin: npm run smoke:codex-plugin
AlembicPlugin: git diff --check
AlembicPlugin embedded runtime: git diff --check
AlembicDashboard: npm run build
AlembicDashboard: git diff --check
Workspace: node scripts/verify-workspace-docs.mjs --all-workspace
Workspace: node scripts/check-dispatch-coverage.mjs
Workspace: git diff --check
```

结果：

- 上述验证均通过。
- `AlembicPlugin npm run smoke:codex-plugin` 结果为 install / stdio / npxRuntime passed，recovery / daemon skipped，符合本波不做 live 大验收范围。
- `AlembicDashboard npm run build` 仍有既有 Vite large chunk warning，不阻塞本波。
- 下一波计划已新建：[alembic-runtime-project-identity-wave-3a-core-provider-plan-2026-05-18.md](alembic-runtime-project-identity-wave-3a-core-provider-plan-2026-05-18.md)。

## 可复制分派提示词

发送给：无

```text
本轮执行窗口均已回填，等待总控复核；无需发送领取提示词。
```

不发送给：`Alembic`（已完成）、`AlembicPlugin`（已完成）、`AlembicDashboard`（已完成）、`AlembicCore`（观察中）、`AlembicAgent`（观察中）、`BiliDili`（无任务）。

## 回填区

### Alembic

- 状态：已完成
- 执行记录：[`docs/Alembic/alembic-runtime-contract-consumption-wave-2-daemon-health-2026-05-18.md`](../Alembic/alembic-runtime-contract-consumption-wave-2-daemon-health-2026-05-18.md)
- 提交 hash：`9ea629fc03a3e5de2d2c449ada6ca77dbeccb45c`
- 完成范围：
  - `/api/v1/daemon/health` 改为使用 `@alembic/core/daemon` 的 `createAlembicRuntimeCapabilities()` 与 `createAlembicRuntimeHealthData()` 构建 canonical `enhancement` / `capabilities` / project identity 主体字段。
  - `lib/daemon/RuntimeBoundary.ts` 改为消费 Core runtime/capability 类型与常量，不再本地手写 route、file monitor sources、job kinds 和 internal AI capability shape。
  - health data 补充 `dataRootSource`、`runtimeDir`、top-level `runtimeBoundary`，并保留 `capabilities.runtimeBoundary` 作为 Wave 1 consumer 兼容位置。
  - `runtimeBoundary` 保留为 Alembic-owned adapter 摘要，但 file monitor、jobs、internal AI 字段从 Core-generated capabilities 派生。
- 验证命令与结果：
  - `npm run build:check`：通过。
  - `npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts`：通过，2 个测试文件、5 个测试通过。
  - `npm run lint:consumer-core-imports`：通过，扫描 416 个文件、559 个 `@alembic/core` imports。
  - `npx biome check --diagnostic-level=error lib/daemon/RuntimeBoundary.ts lib/http/routes/daemon.ts lib/http/routes/file-changes.ts test/unit/DaemonCapabilities.test.ts`：通过。
  - `git diff --check`：通过。
  - `git diff --check HEAD~1..HEAD`：通过。
- 遗留风险：
  - Core `AlembicRuntimeHealthData` 当前未包含 `dataRootSource` / `runtimeDir`；Alembic 本波以 health extension 方式补充。若 Plugin / Dashboard 后续证明需要 canonical 类型，下一波应在 Core 补入 project identity 字段。
  - 为兼容 Wave 1 consumer，本波同时输出 top-level `runtimeBoundary` 和 `capabilities.runtimeBoundary`；下一波可在 Plugin / Dashboard 完成 canonical consumption 后收敛兼容位置。
- 下一波建议：
  - `AlembicPlugin` 优先通过 Core `summarizeAlembicRuntimeCapabilities()` 消费 `capabilities`，只把 `runtimeBoundary` 当 Alembic-owned attribution / handoff 摘要。
  - `AlembicDashboard` view model 优先对齐 canonical health fields，再以 fallback 读取 `runtimeBoundary` owner 信息。
  - 若两个消费者都需要 `dataRootSource` / `runtimeDir` 的 typed contract，下一波由 `AlembicCore` 扩展 `AlembicRuntimeProjectIdentity` 或新增 project identity helper。

### AlembicPlugin

- 状态：已完成
- 执行记录：[`docs/AlembicPlugin/alembic-runtime-contract-consumption-wave-2-plugin-route-2026-05-18.md`](../AlembicPlugin/alembic-runtime-contract-consumption-wave-2-plugin-route-2026-05-18.md)
- 提交 hash：
  - AlembicPlugin：`61144ef8e3d26f25596d46d01fb311642ab7c93b`
  - embedded Codex runtime 子仓库：`be01059d3f6dfc9f3980f09b10a701edc31baa37`
  - portable runtime 内嵌 Core source：`58e21d64fc47e8c96b2885ac23b2d32460317497`
- 完成范围：
  - `EnhancementRoute` 继续优先消费 `@alembic/core/daemon#summarizeAlembicRuntimeCapabilities()`，并新增对 Alembic daemon health `runtimeBoundary` 的消费。
  - 支持读取 `data.capabilities.runtimeBoundary`，兼容 `data.runtimeBoundary`；从中读取 route、workspace project identity、Dashboard handoff、daemon owner、file monitor owner / mode、internal AI owner、jobs owner / store。
  - 当 canonical `capabilities.dashboard`、`capabilities.fileMonitor`、`capabilities.internalAi` 或 `capabilities.jobs` 不完整时，用 `runtimeBoundary` 作为兼容 fallback；不新增 Plugin 长期 runtime policy 主实现。
  - route choice 仍保留在 Plugin adapter 层：`local-alembic` / `local-alembic-daemon` 映射为 `local-alembic-daemon`，`embedded-plugin-runtime` 继续作为 portable compatibility fallback。
  - `host-agent` 仍只表示 Codex 宿主 Agent 路线，internal AI provider 仍只是 provider / config state。
  - `ModuleBoundary` 更新为 Wave 2，新增 `runtimeContract` 状态和 Dashboard release asset 切换检查项；继续保留 `dashboard/dist`，不声明 Plugin 拥有前端源码。
  - 刷新 `plugins/alembic-codex` portable runtime artifact，保持 runtime/dist 与 `runtime.tgz` 对齐本次源码。
- 验证命令与结果：
  - `./node_modules/.bin/biome check --write lib/codex/EnhancementRoute.ts lib/codex/ModuleBoundary.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexModuleBoundary.test.ts`：通过，无需修复。
  - `npm run build:check`：通过；Core build 使用 `../AlembicCore @ 58e21d64fc47e8c96b2885ac23b2d32460317497`。
  - `npm run test:unit -- test/unit/CodexModuleBoundary.test.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts`：通过，4 个测试文件 / 40 个测试。
  - `npm run build`：通过。
  - `npm run prepare:codex-plugin-runtime`：通过，刷新 `plugins/alembic-codex/runtime` 与 `runtime.tgz`。
  - `npm run verify:codex-plugin`：通过，`./runtime.tgz -> alembic-ai@0.1.2`。
  - `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime passed；recovery / daemon skipped。
  - `git diff --check`：通过。
  - `git -C plugins/alembic-codex diff --check`：通过。
- 遗留风险：
  - `runtimeBoundary` 目前仍是 Alembic-owned adapter 摘要；Plugin 已消费它作为 attribution / fallback，但不应把它扩展成 Plugin-local runtime policy。
  - `dataRootSource`、`runtimeDir`、`databasePath` 可以从 future `runtimeBoundary.workspace` 读取；如果 Plugin / Dashboard 都稳定依赖，应由下一波上提到 Core canonical project identity。
  - `DaemonSupervisor`、`DaemonJobRunner`、git-diff checkpoint 和 JobStore fallback 仍作为 embedded runtime compatibility 存在；本波只确保 route/status/diagnostics 不扩张长期 daemon 主实现。
  - Dashboard artifact 仍通过 Plugin release flow 打包 `dashboard/dist`；本波只补 release asset 切换检查项，没有删除 dist，也没有改前端源码所有权。
- 下一波建议：
  - 若 Alembic 和 Dashboard 均继续依赖 `dataRootSource`、`runtimeDir`、`databasePath`、Dashboard handoff owner 字段，下一波由 `AlembicCore` 扩展 canonical runtime project identity / handoff typing。
  - AlembicPlugin 可继续收缩 embedded runtime compatibility：当 Alembic daemon API 覆盖 job status、file monitor checkpoint 和 Dashboard handoff 后，逐步降低 Plugin fallback 面。
  - Dashboard artifact 后续可要求 AlembicDashboard release asset 提供 source version / commit metadata；Plugin 只验证并打包 release asset，不运行或维护前端源码。
  - 总控可安排一次 Alembic daemon + Plugin `alembic_codex_status` / `alembic_codex_dashboard` + Dashboard runtime chip 的轻量 live smoke。

### AlembicDashboard

- 状态：已完成
- 执行记录：[`docs/AlembicDashboard/alembic-runtime-contract-consumption-wave-2-dashboard-view-2026-05-18.md`](../AlembicDashboard/alembic-runtime-contract-consumption-wave-2-dashboard-view-2026-05-18.md)
- 提交 hash：`77d48fd5753f90c0f7af24d50c256451c4f30037`
- 完成范围：
  - `RuntimeBoundary` 前端 view model 扩展为可消费 Alembic daemon health 的 project identity、route、capability、file monitor、jobs、internal AI 与 Dashboard handoff 字段。
  - `src/api.ts` runtime normalizer 优先读取 `/daemon/health` 的 canonical `enhancement` / `capabilities`，并兼容 `data.runtimeBoundary`、`capabilities.runtimeBoundary`、`projectInfo.runtimeBoundary` 和 `projectInfo.capabilities.runtimeBoundary`。
  - Header runtime chip 支持 `local-alembic-daemon`、`embedded-plugin-runtime`、`local-alembic-install` route alias，并展示 workspace mode 与 Dashboard handoff。
  - 已记录 Dashboard artifact 最小输出契约：production build output、版本 / 来源元数据、源码提交 hash、release asset 或 local source handoff 规则；不把源码迁入 Plugin。
- 验证命令与结果：
  - `npm run build`：通过，执行 `tsc && vite build`；Vite 仅保留既有大 chunk warning。
  - `git diff --check`：通过。
  - `rg -n "@alembic/core|ProjectRegistry|WorkspaceResolver|FileChangeDispatcher|JobStore|ALEMBIC_DAEMON|process\\.env|node:fs|from 'fs'|from \"fs\"" src --glob '!**/dist/**'`：仅命中既有 `src/hooks/useBootstrapSocket.ts` 中 “daemon JobStore record” 类型注释；未新增 Core/daemon 实现引用、文件系统访问或环境变量策略。
  - `git status --short`：Dashboard 仓库提交后干净。
  - `node scripts/verify-workspace-docs.mjs --all-workspace`：通过。
  - `node scripts/check-dispatch-coverage.mjs`：通过；当前只发送给 `AlembicPlugin`。
  - `git diff --check -- docs/workspace/alembic-runtime-contract-consumption-wave-2-workspace-plan-2026-05-18.md docs/workspace/index.md docs/workspace/workspace-current-status.md docs/AlembicDashboard/alembic-runtime-contract-consumption-wave-2-dashboard-view-2026-05-18.md`：通过。
  - `rg -n "/Users/|sk-|AIza|token|API key|api key" docs/workspace/alembic-runtime-contract-consumption-wave-2-workspace-plan-2026-05-18.md docs/workspace/index.md docs/workspace/workspace-current-status.md docs/AlembicDashboard/alembic-runtime-contract-consumption-wave-2-dashboard-view-2026-05-18.md`：仅命中 `index.md` 既有文档规则文字；本轮文档未写入本机绝对路径或密钥。
- 遗留风险：
  - `dataRootSource`、`runtimeDir` 等字段目前由 Alembic health extension 稳定输出；如 Plugin / Dashboard 都依赖这些字段，下一波应考虑上提到 `AlembicCore` canonical project identity 类型。
  - 本轮只做前端 build 与静态边界扫描，没有运行真实 Alembic daemon + Dashboard live smoke。
  - `RuntimeBoundary` 仍是前端 view model；后续强 typed contract 应由后端生成或稳定包入口提供。
- 下一波建议：
  - `AlembicPlugin` 完成 daemon health 消费后，总控安排一次 Alembic daemon + Dashboard route chip 轻量 live smoke。
  - 若 Plugin / Dashboard 均继续使用 `runtimeDir`、`dataRootSource`、Dashboard handoff owner 字段，建议由 `AlembicCore` 补充 canonical project identity / runtime handoff typing。
  - Dashboard artifact 下一波可以增加 build metadata 文件或 release asset 清单，但仍保持源码唯一维护点在 `AlembicDashboard`。

### AlembicCore

- 状态：观察中
- 观察原因：本波先验证消费者是否能使用现有 Core runtime / capability contract；若消费者证明缺字段，下一波再补 Core。

### AlembicAgent

- 状态：观察中
- 观察原因：本波不触碰 internal AI runtime 实现；等待 Alembic 消费 Agent runtime boundary 的真实反馈。

### BiliDili

- 状态：无任务
- 原因：本波不做真实项目 smoke。
