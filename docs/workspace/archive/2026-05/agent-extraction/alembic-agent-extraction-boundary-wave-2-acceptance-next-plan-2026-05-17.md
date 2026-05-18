# Alembic Agent Extraction Boundary Wave 2 Acceptance And Next Plan

日期：2026-05-17
总控窗口：AlembicWorkspace
状态：执行中

本文承接 `alembic-agent-extraction-boundary-acceptance-next-plan-2026-05-17.md`。用户口径为四个仓库均已执行完一波任务；本文件记录总控验收结果，并派发下一波任务。

## 1. 本轮验收结论

| 窗口 | 结论 | 提交 / 记录 | 说明 |
| --- | --- | --- | --- |
| `AlembicAgent` | 已完成 | `755da83 Expose Tool V2 contracts`; `76b91e1 Build AlembicCore before Agent CI` | Tool V2 generic router/cache/compressor/parser/adapter contract 已进入 `@alembic/agent/tools/v2`；CI 已补上 Core build。 |
| `Alembic` | 已完成 | `d9f0091 chore: consume agent host contract surface` | 生产侧 `service` / `runtime` / `prompts` / `domain` 已消费 `@alembic/agent/*` host contract surface；本地生产 consumer 为 0。 |
| `AlembicPlugin` | 已完成 | `e372057 fix: make codex plugin runtime self-contained`; `alembic-plugin-npx-runtime-packaging-fix-2026-05-17.md` | npx runtime P0 阻塞解除；完整 Codex plugin smoke 包含 `npxRuntime: passed`。 |
| `AlembicDashboard` | 已完成 | `0927faf fix: handle host-managed AI endpoints`; `alembic-dashboard-host-managed-api-adapter-2026-05-17.md` | 前端已识别 host-managed / fail-closed API contract；候选补齐、润色、AI Chat 不再硬性期待本地 AI session。 |
| `AlembicCore` | 观察中 | 无直接提交 | Plugin packaging 修复无需 Core 代码变更；继续作为 vendor/package 关系观察对象。 |

总控判断：

- 上一波阻塞和待启动任务均可验收。
- `AlembicPlugin` 发布链路阻塞已解除，但正式 release / marketplace sync 前仍必须重新跑完整 smoke。
- 下一波主线应转向 `Alembic` 消费 Agent Tool V2 contract，并准备删除本地 generic Tool V2 重复实现。
- `AlembicDashboard` 和 `AlembicPlugin` 需要做一次 live daemon 联动复验，确认 host-managed UI 反馈和后端 fail-closed contract 在真实运行链路中一致。

## 2. 验收命令

| 仓库 | 命令 | 结果 |
| --- | --- | --- |
| `AlembicAgent` | `npm run check` | 通过；6 个 test files、27 个 tests。Biome 仍有 27 个 warning，未阻断。 |
| `Alembic` | `npm run lint:agent-extraction-boundary` | 通过；product `#agent` call sites 为 1；local service/runtime/prompts/domain consumers 为 0。 |
| `Alembic` | `npm run build:check` | 通过。 |
| `AlembicPlugin` | `npm run build:check` | 通过。 |
| `AlembicPlugin` | `npm run report:agent-extraction-boundary` | 通过；Agent / AI / Tool 边界导入均为 0。 |
| `AlembicPlugin` | `npm run verify:codex-plugin` | 通过；`./runtime.tgz -> alembic-ai@0.1.2`。 |
| `AlembicPlugin` | `npm run smoke:codex-plugin` | 通过；`install: passed`、`stdio: passed`、`npxRuntime: passed`。 |
| `AlembicDashboard` | `npm run build` | 通过；仅保留 Vite large chunk warning。 |

工作区状态：

- 四个子仓库 `git status --short` 均为空。
- workspace 根目录不是 Git 仓库；本轮只在 `docs/workspace/` 更新总控文档和索引。

## 3. 边界复核

### 3.1 AlembicAgent

已确认：

- `package.json` 新增 `./tools/v2` export。
- `src/tools/index.ts` 同步 re-export V2 contract。
- 新增 `test/tool-v2-contract.test.ts` 覆盖 catalog、cache、compressor/parser、router 和 adapter contract。
- `V2ToolRouterAdapter` 依赖 `V2ToolContextFactory` / `V2ToolContextProvider` contract，不再绑定 Alembic concrete `ToolContextFactory`。

保留边界：

- concrete `ToolContextFactory`、terminal sandbox executor、Dashboard/Mac/Skill adapter、Codex MCP delivery 仍属于宿主仓库。

### 3.2 Alembic

已确认：

- `@alembic/agent/service` consumer files：19
- `@alembic/agent/runtime` consumer files：2
- `@alembic/agent/prompts` consumer files：1
- `@alembic/agent/domain` consumer files：1
- local service/runtime/prompts/domain production consumers：0

保留边界：

- 本地 `lib/agent/service/**`、`lib/agent/runtime/**`、`lib/agent/prompts/**`、`lib/agent/domain/**` 仍作为 preserved local implementation / deletion candidates 保留。
- 本地 `#tools/v2/**` 仍有 production consumer，这是下一波要迁移的 generic Tool V2 重复实现。
- concrete `ToolContextFactory` 和 host adapter 继续留在 Alembic。

### 3.3 AlembicPlugin

已确认：

- `lib/agent/**`、`lib/tools/**`、`lib/external/ai/**` 仍保持删除状态。
- `report:agent-extraction-boundary` 为 0。
- embedded runtime 随包携带 `vendor/AlembicCore` 和 bundled production dependencies。
- wrapper 使用 offline npx 启动自包含 `./runtime.tgz`。

保留边界：

- Plugin 仍不应依赖 `@alembic/agent`。
- Plugin 保留 Codex MCP、Skill、channel、marketplace、runtime packaging、verification 和 release chain。

### 3.4 AlembicDashboard

已确认：

- `src/api.ts` 增加 `HostManagedUnavailableError` / `isHostManagedUnavailable`。
- `chatStream`、`refinePreviewStream` 先解析 501/410/host-managed JSON，不再直接落入 “No sessionId returned”。
- `CandidatesView` 对候选补齐/润色显示 host-managed 提示并禁用入口。
- `AiChatView` 和 `GlobalChatDrawer` 对 host-managed 错误显示宿主执行提示。

保留边界：

- Dashboard 不承载 Agent / AI provider / Tool runtime。
- 当前尚未做 live daemon 点击联调；这不是代码验收阻塞，但必须进入下一波联动任务。

## 4. 下一波分派表

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Alembic` | 已完成 | 已消费 `@alembic/agent/tools/v2`，迁移本地 generic Tool V2 imports，`#tools/v2` deferred local import files 降到 2；只保留 concrete `ToolContextFactory` 和 host adapters。 | 已新建 | `docs/workspace/alembic-tool-v2-contract-consumption-2026-05-17.md` | `docs/workspace/index.md` 与本文第 4 节 | 新文档验收章节；已同步更新 `config/agent-extraction-boundary.json` | `npm run lint:agent-extraction-boundary`; `npm run build:check`; representative `V2ToolSystem` tests | 已完成；后续删除重复 local generic implementation 前不得删除 host adapter。 |
| `AlembicAgent` | 观察中 | 支援 Alembic Tool V2 消费；如 Alembic 发现 contract 缺口，补齐 `@alembic/agent/tools/v2` exports 或类型。 | 无需新建，除非发生 contract change | 本文；若改 contract 则更新 `docs/AlembicAgent/alembic-agent-tool-v2-contract-2026-05-17.md` | `docs/workspace/index.md` 与本文第 4 节 | 本文第 5.2；若改动则回填 Agent Tool V2 文档 | `npm run check` | 等待 Alembic 消费反馈。 |
| `AlembicPlugin` | 已完成 | 已完成 release readiness 封口：完整 plugin release gate 通过，daemon/dashboard smoke 通过，`ServiceMap` legacy Agent unknown 字段已清理。 | 已新建 | `docs/workspace/alembic-plugin-release-readiness-2026-05-17.md` | `docs/workspace/index.md` 与本文第 4 节 | 新文档验收章节；本文第 5.3 节 | `npm run build:check`; `npm run report:agent-extraction-boundary`; `npm run verify:codex-plugin`; `npm run verify:codex-channel`; `npm run smoke:codex-plugin`; `npm run smoke:codex-plugin -- --daemon`; `npm run release:codex-plugin` | 已完成；release / sync marketplace 前建议重跑基础 gate 和 daemon smoke。 |
| `AlembicDashboard` | 已完成 | 已与 Plugin live daemon 复验 host-managed API/UI 路径映射：Candidates enrich/refine、Global Chat refine、AI Chat；未发现需要补 Dashboard 源码的 UX 缺口。 | 已新建 | `docs/AlembicDashboard/alembic-dashboard-plugin-live-host-managed-verification-2026-05-17.md` | `docs/workspace/index.md` 与本文第 4 节 | 新文档验收章节；已回填 `docs/AlembicDashboard/alembic-dashboard-host-managed-api-adapter-2026-05-17.md` | `npm run build`; live daemon HTTP 手动记录 | 已完成；浏览器点击截图未采集，原因见 Dashboard 记录。 |
| `AlembicCore` | 观察中 | 暂无实现任务；仅观察 Tool V2 消费或 Plugin release gate 是否暴露 Core package/resource 问题。 | 无需新建 | 本文 | `docs/workspace/index.md` 与本文第 4 节 | 本文第 5.5 | 如触发 Core：源仓库验证 + 外层 build | 无直接任务。 |

## 5. 执行细则

### 5.1 Alembic

目标：

- 把本地 generic Tool V2 组件消费切到 `@alembic/agent/tools/v2`。
- 本轮优先处理：
  - `V2CapabilityCatalog`
  - `V2ToolRouterAdapter`
  - `DeltaCache`
  - `SearchCache`
  - `OutputCompressor`
  - parser / strip utilities
  - generic `ToolRouterV2` / `TOOL_REGISTRY` / V2 types
- 保留本地 host-owned：
  - `ToolContextFactory`
  - terminal sandbox/session/policy executor
  - Dashboard/Mac/Skill/Workflow adapters
  - DI container、repository/search/gateway/data-root wiring

完成标准：

- `config/agent-extraction-boundary.json` 明确记录 Tool V2 消费结果和保留项。
- `npm run lint:agent-extraction-boundary` 中 generic Tool V2 local consumer 明显下降，保留项必须可解释。
- `npm run build:check` 通过。
- 代表性 Tool V2 tests 通过。

执行回填：

- 完成范围：Alembic 生产侧 Tool V2 composition 已消费 `@alembic/agent/tools/v2` 的 `V2CapabilityCatalog`、`V2ToolRouterAdapter`、cache、compressor、registry、router 和 public types；本地仅保留 concrete `ToolContextFactory` 作为 host DI/repository/search/gateway/project-root/sandbox bridge。
- 提交 hash：`14faa15 chore: consume agent tool v2 contracts`。
- 验证命令与结果：
  - `npm run lint:agent-extraction-boundary`：通过；`@alembic/agent/tools/v2 consumer files: 4`，`deferred local tool import files: 2`，`local common tool consumers: 0`。
  - `npm run build:check`：通过。
  - `npm run lint -- --diagnostic-level=error`：通过。
  - `npm run test:unit -- test/unit/V2ToolSystem.test.ts test/unit/v2/ToolRegistryV2.test.ts test/unit/knowledge-manage-evolution.test.ts`：通过；3 个 test files、75 个 tests。
  - `npm run check`：通过；现有 Biome warnings 未阻断。
  - `npm run build`：通过。
  - `node dist/bin/cli.js status --json`：通过；workspace detected，当前测试环境 database not found。
- 遗留风险：本地 `lib/tools/v2/**` generic implementation 文件仍存在，当前只完成消费切换；`ToolContextFactory` 仍 host-owned；Agent 未导出 handler 深层子路径，测试通过公共 `TOOL_REGISTRY` 覆盖 handler 行为。
- 下一步建议：下一波删除或 quarantine 已由 `@alembic/agent/tools/v2` 覆盖的本地 generic Tool V2 文件；删除前继续保留 `ToolContextFactory` 和 host adapters，并让 AlembicAgent 补齐任何发现的 public contract 缺口。

### 5.2 AlembicAgent

目标：

- 等待 Alembic 消费反馈。
- 若 Alembic 无法只通过 `@alembic/agent/tools/v2` 完成迁移，Agent 负责补齐 contract，而不是让 Alembic 复制第二套 generic implementation。

完成标准：

- 无 contract change：保持观察，并在 Alembic 新文档中写明无需 Agent action。
- 有 contract change：更新 package export / tests / Tool V2 文档，并运行 `npm run check`。

### 5.3 AlembicPlugin

目标：

- 进入 release readiness，而不是继续迁移 Agent runtime。
- 保证自包含 runtime 修复没有破坏 Codex channel / marketplace / daemon dashboard path。
- 清理 `ServiceMap` 中 legacy Agent unknown fields，但不得重新引入 `lib/agent/**`。

完成标准：

- 所有 release gate 命令通过。
- 若无法做 live daemon/dashboard smoke，记录具体原因，不得写成通过。
- `report:agent-extraction-boundary` 仍为 0。

执行回填：

- 完成范围：清理 `ServiceMap` 中无运行时意义的 legacy Agent unknown fields，只保留 Codex plugin 仍需要的 `skillHooks`；更新 `ServiceContainer` 集成测试，确认 `skillHooks` 可解析且 `toolRegistry` 不再注册；完成 release gate、Codex channel verify、普通 smoke 和 daemon/dashboard smoke。
- 提交 hash：`e7840d0 chore: finalize codex plugin release readiness`。
- 验证命令与结果：
  - `npm run build:check`：通过。
  - `npm run lint -- --diagnostic-level=error`：通过。
  - `npm run report:agent-extraction-boundary`：通过；Agent / AI / Tool 边界导入均为 0。
  - `npm run verify:codex-plugin`：通过；`./runtime.tgz -> alembic-ai@0.1.2`。
  - `npm run verify:codex-channel`：通过；`alembic-ai@0.1.2`。
  - `./node_modules/.bin/vitest run test/integration/ServiceContainer.test.ts`：通过；1 个 test file、15 个 tests。
  - `npm run smoke:codex-plugin`：通过；`install: passed`、`stdio: passed`、`npxRuntime: passed`。
  - `npm run smoke:codex-plugin -- --daemon`：通过；`install: passed`、`stdio: passed`、`npxRuntime: passed`、`recovery: passed`，daemon 返回 Dashboard URL。
  - `npm run release:codex-plugin`：通过 6/6 steps；Dashboard build 仅保留既有 large chunk warning。
- 遗留风险：当前 Codex 普通沙箱不允许 daemon 绑定本机端口，daemon smoke 需在允许本机端口绑定后运行；Dashboard 三条 host-managed UI 点击路径仍由 AlembicDashboard 窗口继续复验；历史调用方如仍请求 `container.get('toolRegistry')` 将按预期失败。
- 下一步建议：release / marketplace sync 前继续运行 `npm run release:codex-plugin`，并在允许本机端口绑定的环境补跑 `npm run smoke:codex-plugin -- --daemon`；AlembicDashboard 继续完成 Candidates enrich/refine、Global Chat refine、AI Chat 三条 live UI 路径。

### 5.4 AlembicDashboard

目标：

- 与 Plugin live daemon 真实交互，确认 host-managed 反馈可见、可理解、不会误报成功。
- 覆盖三条路径：
  - Candidate enrich
  - Candidate refine / refine stream
  - AI Chat / Global Chat

完成标准：

- `npm run build` 通过。
- 有 live 手动记录或截图证据。
- 若发现缺口，补代码并回填旧 Dashboard adapter 文档。

执行回填：

- 完成范围：Dashboard 与 Plugin live daemon 完成 host-managed / fail-closed contract 复验；覆盖 Candidate enrich、Candidate refine / Global Chat refine、AI Chat，以及 Plugin production Dashboard HTML 壳。前端代码路径已确认仍由 `api.enrichCandidates`、`api.refinePreviewStream`、`api.refinePreview` 和 `api.chatStream` 统一转换为 host-managed UI 提示。
- 提交 hash：`17a4ff5 docs: record plugin live host-managed verification`。
- 验证命令与结果：
  - `npm run build`：通过；仅保留 Vite large chunk warning。
  - `GET /api/v1/daemon/health`：live daemon 返回 `success: true`、`surface: "codex-plugin"`、`mode: "daemon"`。
  - `GET /`：返回 `200 OK` Dashboard HTML，并包含 `<div id="root">`。
  - `POST /api/v1/candidates/enrich`：返回 `success: true`、`hostManaged: true`、`unavailable: true`、`reason: "HOST_AI_MANAGED"`。
  - `POST /api/v1/candidates/refine-preview-stream`、`POST /api/v1/candidates/refine-preview`、`GET /api/v1/candidates/refine-preview/events/fake-session`：均返回 host-managed fail-closed body。
  - `POST /api/v1/ai/chat/stream`：返回 `success: false`、`error.code: "HOST_AI_MANAGED"`、`data.hostManaged: true`，不返回 `sessionId`。
- 遗留风险：本轮有 live daemon HTTP 手动记录和前端代码路径映射，但未采集浏览器点击截图；Dashboard 仓库当前无 Playwright 运行依赖，本轮避免接管用户正在使用的 Chrome 标签页。沙箱内直接监听 localhost 会失败，live daemon 启动使用用户批准的临时提权，验证结束后已停止。
- 下一步建议：Plugin release readiness 阶段引用本轮 Dashboard live contract 记录；若后续需要更强 UI 回归保障，可为 Dashboard 增加轻量浏览器 smoke，自动覆盖 host-managed banner、禁用按钮和 AI Chat 提示。

### 5.5 AlembicCore

目标：

- 默认不动。
- 只有当 Alembic Tool V2 消费或 Plugin release gate 暴露 Core package/resource 真实缺口时才启动。

完成标准：

- 若无 Core action，在对应执行文档中写明原因。
- 若有 Core action，必须先在 Core 源仓库提交，再由外层更新 vendor / package 接入。

## 6. 总控决策

下一步启动顺序：

1. `Alembic`：Tool V2 contract consumption 已完成，下一波可进入本地重复 generic Tool V2 文件删除或 quarantine。
2. `AlembicPlugin`：release readiness 已完成，release / sync marketplace 前继续重跑基础 gate 和 daemon smoke。
3. `AlembicDashboard`：继续 live host-managed UI 复验。
4. `AlembicAgent`：保持支援态，等待下一波 Alembic 删除重复实现时的 contract 反馈。
5. `AlembicCore`：继续观察。

禁止事项：

- 不得把 Dashboard 的 host-managed 反馈降级为静默失败或普通 error toast。
- 不得为了消除本地 `#tools/v2` 计数而删除 host-owned adapter / terminal sandbox / DI wiring。
- 不得让 Plugin 重新依赖 `@alembic/agent` 或恢复本地 Agent/AI/Tool runtime。
- 不得在没有 import 扫描、替代入口和验证结果前删除 Alembic preserved local Agent implementation。
