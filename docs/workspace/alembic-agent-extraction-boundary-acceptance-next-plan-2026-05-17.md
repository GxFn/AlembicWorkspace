# Alembic Agent Extraction Boundary Acceptance And Next Plan

日期：2026-05-17
总控窗口：AlembicWorkspace
状态：已完成

后续入口：`alembic-agent-extraction-boundary-wave-2-acceptance-next-plan-2026-05-17.md`

本文是 `alembic-agent-extraction-boundary-plan-2026-05-17.md` 后续的新 workspace 级总控文档，用于承接本轮验收、阻塞项和下一波跨仓库任务分派。

## 1. 总体验收结论

| 仓库 / 窗口 | 结论 | 说明 |
| --- | --- | --- |
| `AlembicAgent` | 已完成 | `service` / `runtime` / `prompts` / `domain` 显式导出已补齐；Tool V2 adapter/cache/compressor 边界已形成评估记录。 |
| `Alembic` | 已完成，进入下一波 | Phase 4 证据已封存，Phase 5 memory/context 接入通过边界扫描；仍保留本地 `service` / `runtime` / `prompts` / `domain`，下一波再消费 Agent 新导出。 |
| `AlembicPlugin` | 已完成 | 本地 Agent/AI/Tool runtime 边界已清零；Codex plugin embedded runtime 已补齐 vendor Core 与 bundled production dependencies，完整 smoke 通过。 |
| `AlembicDashboard` | 受影响，待适配 | 编译通过，但仍调用 Plugin 已改为 host-managed/fail-closed 的 AI、Agent、candidate refine 端点，需要前端任务承接。 |
| `AlembicCore` | 观察中 | 当前验收未发现需要 Core 直接改动；仅作为 file dependency / vendor 构建关系观察对象。 |

总控判断：

- 本轮“Agent 抽取边界”代码迁移主体可以验收。
- `AlembicPlugin` P0 发布链路阻塞已解除；后续发布或 marketplace 同步前仍必须重新执行完整 `npm run smoke:codex-plugin`。
- 下一波计划必须同时覆盖 `AlembicAgent`、`Alembic`、`AlembicPlugin`、`AlembicDashboard`，否则会出现后端边界已切断但前端仍调用旧能力的问题。

## 2. 验收证据

### 2.1 AlembicAgent

已确认：

- `package.json` 已导出 `./service`、`./runtime`、`./prompts`、`./domain`。
- 源码存在 `src/agent/service/index.ts`、`src/agent/runtime/index.ts`、`src/agent/prompts/index.ts`、`src/agent/domain/index.ts`。
- Phase 6 文档已记录 Tool V2 后续边界：
  - `ToolContextFactory` 保持宿主侧具体实现。
  - `V2CapabilityCatalog`、`V2ToolRouterAdapter`、`DeltaCache`、`SearchCache`、`OutputCompressor`、解析器属于可迁入 Agent 的通用候选。
  - Dashboard、Mac、Skill、terminal、Codex 具体 adapter 保持宿主侧。

验证命令：

```text
npm run check
```

结果：通过。`build:check`、Agent import boundary lint、Vitest 均通过；Vitest 为 5 个文件、23 个测试。Biome 有 27 个 warning，未阻断。

### 2.2 Alembic

已确认：

- `config/agent-extraction-boundary.json` 已封存 Phase 4 和 Phase 5 证据。
- Phase 5 memory/context 已切到 `@alembic/agent/memory` 和 `@alembic/agent/context`。
- 本地 memory/context consumer 为 0。
- 本地 `service` / `runtime` / `prompts` / `domain` 仍存在且仍有调用点，这是下一波任务，不应在本轮直接删除。

验证命令：

```text
npm run lint:agent-extraction-boundary
npm run build:check
```

结果：通过。边界扫描结果包括：

- product `#agent` call sites：17
- `@alembic/agent/ai` consumer files：16
- local AI provider consumers：0
- `@alembic/agent/tools` consumer files：50
- local common tool consumers：0
- deferred local tool import files：4
- `@alembic/agent/memory` consumer files：7
- `@alembic/agent/context` consumer files：3
- local memory/context consumers：0
- classified `lib/tools` files：79

### 2.3 AlembicPlugin

已确认：

- `lib/agent/**`、`lib/tools/**`、`lib/external/ai/**` 不再存在。
- `package.json` 不再声明 `@alembic/agent`，也不再声明 `#agent/*`、`#tools/*` imports。
- `report:agent-extraction-boundary` 扫描为 0 个边界导入：
  - filesWithBoundaryImports：0
  - agentImportFiles：0
  - aiImportFiles：0
  - toolImportFiles：0
- `lib/http/routes/ai.ts` 中 chat、summarize、translate、agent tool/task/capabilities、stream 均返回 host-managed unavailable，不再执行本地 AI/Agent。
- `lib/http/routes/candidates.ts` 中 enrich、bootstrap refine、refine preview、refine stream 均 fail closed；`refine-apply` 只应用宿主传入 preview，不再 fallback 本地 AI。
- `lib/daemon/DaemonJobRunner.ts` 已通过 host-driven external handlers 执行 bootstrap/rescan，不再走 internal agent workflow。
- `lib/external/mcp/McpServer.ts` 不再使用内部 tool router / capability catalog / adapter。
- `lib/injection/modules/AgentModule.ts` 只保留 `SkillHooks` 兼容注册。

验证命令：

```text
npm run build:check
npm run report:agent-extraction-boundary
npm run verify:codex-plugin
npm run smoke:codex-plugin -- --no-npx-runtime
```

结果：通过。

完整 smoke：

```text
npm run smoke:codex-plugin
```

结果：已在 P0 follow-up 中修复并通过。最终结果包含：

```text
install: passed
stdio: passed
npxRuntime: passed
```

判断：`runtime.tgz` 现在随包携带 `vendor/AlembicCore`，并通过 `bundledDependencies` 携带生产依赖；plugin wrapper 使用 offline npx 安装自包含 runtime，不再依赖 registry 或本机缓存。

### 2.4 AlembicDashboard

已确认：

- `npm run build` 通过。
- 前端仍调用后端已改为 host-managed/fail-closed 的接口：
  - `src/api.ts`：`/candidates/enrich`
  - `src/api.ts`：`/candidates/bootstrap-refine`
  - `src/api.ts`：`/candidates/refine-preview`
  - `src/api.ts`：`/candidates/refine-preview-stream`
  - `src/api.ts`：`/api/v1/ai/chat/stream`
  - `src/api.ts`：`/api/v1/ai/chat/events/:sessionId`
  - `src/components/Views/CandidatesView.tsx`：候选补齐和润色按钮仍按旧 AI 行为组织交互

判断：`AlembicPlugin` 会涉及 `AlembicDashboard`。当前不是编译问题，而是运行时能力语义已变化，前端必须识别 `HOST_AI_MANAGED`、`hostManaged: true`、501/410，并把旧本地 AI 入口改成宿主能力入口、禁用态或清晰的不可用反馈。

## 3. 剩余风险

| 风险 | 级别 | 影响 | 处理方式 |
| --- | --- | --- | --- |
| Plugin full smoke npx runtime 失败 | 已关闭 | 发布链路 P0 阻塞解除 | AlembicPlugin 已完成 runtime package dependency / bundling 修复，完整 smoke 通过。 |
| Dashboard 仍调用 host-managed 端点 | P1 | 用户点击旧按钮会遇到 501/410 或 stream session 缺失 | AlembicDashboard 启动 API contract 适配。 |
| Alembic 仍保留本地 `service` / `runtime` / `prompts` / `domain` | P1 | Agent 新导出未被宿主消费，后续删除边界未完成 | Alembic 下一波分批替换到 `@alembic/agent/*`。 |
| Plugin `ServiceMap` 仍有 AgentModule legacy unknown 字段 | P2 | 类型表面有历史残留，运行时未注册本地 Agent | Plugin 在发布阻塞修复后清理。 |
| Agent Tool V2 adapter/cache/compressor 尚未迁移 | P2 | Alembic 仍持有部分通用工具运行组件 | Agent 和 Alembic 协同定义下一组 contract exports。 |

## 4. 下一波分派表

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AlembicPlugin` | 已完成 | 修复 `runtime.tgz` npx 安装后无法解析 `@alembic/core` 的发布链路问题；确认 `npm run smoke:codex-plugin` 完整通过。 | 已新建 | `docs/workspace/alembic-plugin-npx-runtime-packaging-fix-2026-05-17.md` | `docs/workspace/index.md` 与本文第 4 节 | 本文第 5.1 节与 Plugin 阶段记录 | `npm run build:check`; `npm run report:agent-extraction-boundary`; `npm run verify:codex-plugin`; `npm run smoke:codex-plugin` | 已解除 P0 阻塞；release / sync marketplace 前仍需重跑完整 smoke。 |
| `AlembicDashboard` | 已完成 | 适配 Plugin host-managed AI/Agent/candidate API：识别 501/410、`HOST_AI_MANAGED`、`hostManaged`，修正 chat/refine stream 对 sessionId 的假设，候选补齐/润色 UI 改为宿主能力入口或禁用反馈。 | 已新建 | `docs/AlembicDashboard/alembic-dashboard-host-managed-api-adapter-2026-05-17.md` | 本文第 4 节 | 本文第 5.2 节 | `npm run build` | 等待 Plugin 启动 host-managed daemon 后做 live 点击复验。 |
| `Alembic` | 待启动 | 在 Agent exports 已补齐后，评估并分批把本地 `#agent/service`、`#agent/runtime`、`#agent/prompts`、`#agent/domain` 消费切到 `@alembic/agent/*`；保留宿主特有 workflow glue。 | 新建 | `docs/workspace/alembic-host-contract-surface-consumption-2026-05-17.md` | `docs/workspace/index.md` 与本文第 4 节 | 本文第 5.3 节与 `config/agent-extraction-boundary.json` | `npm run lint:agent-extraction-boundary`; `npm run build:check` | 依赖 Agent contract exports 稳定；不得一次性删除本地实现。 |
| `AlembicAgent` | 已完成 | 将 Tool V2 adapter/cache/compressor 从“评估边界”推进为 contract proposal，明确哪些进入 Agent exports、哪些保持 host-owned。 | 新建 | `docs/AlembicAgent/alembic-agent-tool-v2-contract-2026-05-17.md` | `docs/workspace/index.md` 与本文第 4 节 | 本文第 5.4 节与 Agent Phase 6 文档 | `npm run check`; 新增 contract-surface tests | 已完成；Alembic 可开始消费 generic Tool V2 exports。 |
| `AlembicCore` | 观察中 | 暂不分派实现；仅检查 Plugin npx packaging 修复是否需要调整 Core 发布形态或 package dependency 表达。 | 无需新建 | 本文 | `docs/workspace/index.md` | 本文第 5.5 节 | 如涉及 Core：`npm run build:core` 或各宿主对应 build | 只有 Plugin packaging 修复指向 Core 时才启动。 |

## 5. 执行要求

### 5.1 AlembicPlugin

目标：

- 让完整 `npm run smoke:codex-plugin` 通过。
- 不回滚已删除的本地 Agent/AI/Tool runtime。
- 修复必须围绕 Codex plugin embedded runtime 的依赖可解析性，而不是重新引入 `@alembic/agent` 或本地 AI provider。

建议检查点：

- `scripts/prepare-codex-plugin-runtime.mjs`
- `scripts/release-codex-plugin.mjs`
- `plugins/alembic-codex/runtime/package.json` 生成逻辑
- `@alembic/core` 在 embedded runtime 中应以 bundled 产物、workspace vendor、或可安装包形式被解析，不能保留对不存在路径的 `file:vendor/AlembicCore` 假设。

完成标准：

- `npm run build:check` 通过。
- `npm run report:agent-extraction-boundary` 仍为 0。
- `npm run verify:codex-plugin` 通过。
- `npm run smoke:codex-plugin` 完整通过，且不需要 `--no-npx-runtime`。

执行回填（2026-05-17）：

- 已新建记录：`docs/workspace/alembic-plugin-npx-runtime-packaging-fix-2026-05-17.md`。
- `scripts/prepare-codex-plugin-runtime.mjs` 已将 embedded runtime 改为 vendor Core + bundled production dependencies。
- `plugins/alembic-codex/bin/alembic-codex-mcp-wrapper.mjs` 已改为 offline npx 启动自包含 `./runtime.tgz`。
- `scripts/verify-codex-plugin.mjs` 和 `scripts/smoke-codex-plugin.mjs` 已补齐 vendor Core、bundled deps、offline wrapper 断言。
- 验证通过：
  - `npm run prepare:codex-plugin-runtime`
  - `npm run build:check`
  - `npm run report:agent-extraction-boundary`
  - `npm run verify:codex-plugin`
  - `npm run smoke:codex-plugin`

### 5.2 AlembicDashboard

目标：

- Dashboard 不再把 Plugin host-managed/fail-closed 端点当成本地 AI 能力。
- `chatStream`、`refinePreviewStream` 必须正确处理 501 JSON / 410 JSON，不再硬性期待 `sessionId`。
- Candidate enrich/refine UI 需要根据 response contract 显示 host-managed 状态，避免用户以为操作成功但没有实际补齐。

建议实现：

- 在 `src/api.ts` 增加统一 `HostManagedUnavailable` 解析工具。
- 更新 `enrichCandidates`、`bootstrapRefine`、`refinePreview`、`refinePreviewStream`、`chatStream` 的错误模型。
- 在 `CandidatesView` 中将补齐/润色按钮接入禁用态、host handoff、或明确不可用状态。
- 更新中英文 i18n，不再把 Plugin 本地 AI 描述为可用能力。

完成标准：

- `npm run build` 通过。
- 关键交互路径有手动验证记录或测试覆盖。
- 与 Plugin 的 501/410/hostManaged response contract 一致。

执行记录：

- Dashboard 窗口已完成。
- 提交：`0927faf fix: handle host-managed AI endpoints`。
- 验收记录：`docs/AlembicDashboard/alembic-dashboard-host-managed-api-adapter-2026-05-17.md`。
- 验证：`npm run build` 通过。
- 剩余：等待 AlembicPlugin 窗口启动对应 daemon 后复测 Candidates 补齐、候选润色和 AI Chat 三条真实点击路径。

### 5.3 Alembic

目标：

- 消费 AlembicAgent 新补齐的 `service` / `runtime` / `prompts` / `domain` exports。
- 每批替换后更新 `config/agent-extraction-boundary.json`，保持 evidence 可追踪。
- 宿主专属 workflow、HTTP、Lark、Dashboard glue 不迁入 Agent。

完成标准：

- `npm run lint:agent-extraction-boundary` 中 deferred local service/runtime/prompts/domain 下降，并解释保留项。
- `npm run build:check` 通过。
- 不在 Agent contract 未覆盖前删除本地实现。

### 5.4 AlembicAgent

目标：

- 将 Tool V2 通用层形成可消费 contract：
  - capability catalog
  - generic router adapter contract
  - delta/search cache contract
  - output compressor contract
  - parser / strip utility contract
- 保留宿主具体 IO adapter、terminal adapter、Dashboard adapter。

完成标准：

- `package.json` exports 与 `src/*/index.ts` 同步。
- contract-surface tests 覆盖新增 exports。
- `npm run check` 通过。

执行回填（2026-05-17）：

- 已新增 `@alembic/agent/tools/v2` package subpath。
- 已通过 `src/tools/index.ts` 让 `@alembic/agent/tools` 同步 re-export V2 contract。
- 已迁入 Agent-owned generic candidates：
  - `ToolRouterV2`
  - `V2CapabilityCatalog`
  - `V2ToolRouterAdapter`
  - `DeltaCache`
  - `SearchCache`
  - `OutputCompressor`
  - `compressor/parsers/**`
  - `cleanOutput` / `truncateOutput`
- `V2ToolRouterAdapter` 已改为依赖 `V2ToolContextFactory` / `V2ToolContextProvider` contract，不再依赖 Alembic concrete `ToolContextFactory`。
- 继续 host-owned：
  - concrete `ToolContextFactory`
  - terminal sandbox executor / platform permission
  - repository/search/gateway-backed context wiring
  - Dashboard/Mac/Skill adapters
  - Codex MCP schema/handler/channel/skill/delivery code
- 已新增 `test/tool-v2-contract.test.ts` 覆盖新增 exports、cache、compressor/parser、router 和 adapter contract。
- 详细记录见 `docs/AlembicAgent/alembic-agent-tool-v2-contract-2026-05-17.md`。
- 验证结果：
  - `npm run build:check` 通过。
  - `npm run lint` 通过，仍有 27 个既有 Biome warning。
  - `npm run test` 通过，6 个 test files、27 个 tests。
  - `npm run check` 通过。
  - `npm run build` 通过。
  - `@alembic/agent/tools/v2` self-reference import smoke 通过。

### 5.5 AlembicCore

目标：

- 默认不动 Core。
- 如果 Plugin packaging 修复需要 Core 被 embedded runtime 解析，先形成方案再执行，避免破坏 `Alembic`、`AlembicPlugin`、`AlembicAgent` 三方 vendor 关系。

完成标准：

- 若无 Core 改动：在 Plugin 修复文档中写明“无需 Core”原因。
- 若有 Core 改动：必须提供受影响宿主验证命令。

## 6. 总控决策

下一步启动顺序：

1. `AlembicPlugin` P0：已修复完整 smoke 的 npx runtime packaging。
2. `AlembicDashboard` P1：已适配 host-managed API contract，等待 Plugin daemon live click 复验。
3. `Alembic` P1：消费 Agent `service` / `runtime` / `prompts` / `domain` exports。
4. `AlembicAgent` P2：已推进 Tool V2 contract exports。
5. `AlembicCore` 继续观察，本轮 Plugin packaging 无需 Core 直接改动。

禁止事项：

- 不得为了让 Plugin smoke 通过而重新引入本地 AI provider、`lib/agent/**` 或 `@alembic/agent` 运行时依赖。
- 不得在 Alembic 尚未完成消费替换前删除本地 `service` / `runtime` / `prompts` / `domain`。
- 不得让 Dashboard 静默吞掉 `HOST_AI_MANAGED`，必须给用户明确状态或进入宿主执行路径。
