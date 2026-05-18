# AlembicAgent Phase 4 Tool System Migration

日期：2026-05-17
阶段：Phase 4 - 迁移通用 Tool System
范围：只修改 `AlembicAgent` 仓库；只读参考 `Alembic` 主仓库；未修改 `Alembic`、`AlembicPlugin`、`AlembicCore`。

## 完成内容

Phase 4 已完成。`src/tools/**` 在 Phase 2 已从 `Alembic/lib/tools/**` 的 Agent 直接依赖子集复制进 `AlembicAgent`，本轮将通用 tool contracts、catalog、router、registry、result envelope 和 workflow registry 正式作为 AlembicAgent 的 Tool System 能力对外暴露，并补齐路由执行测试。

新增/调整：

- `src/tools/index.ts`：新增 Tool System public barrel。
- `package.json`：新增 `./tools` package export，指向 `dist/tools/index.js` 和对应声明文件。
- `src/index.ts`：根入口导出 `./tools/index.js`，package metadata 升级为 `phase-4-tool-system`。
- `src/tools/core/LightweightRouter.ts`：补齐 manifest surface gate、runtime policy gate、adapter preview、timeout/cancel、异常规范化、diagnostics recorder。
- `test/tool-system.test.ts`：新增 catalog/router/envelope 测试。
- `test/index.test.ts`：更新 package metadata 断言。

## 公开入口

Phase 4 后，主仓库/宿主代码应优先从以下入口消费 Agent 的通用 Tool System：

```ts
import {
  CapabilityCatalog,
  LightweightRouter,
  UnifiedToolCatalog,
  presentToolResult,
} from '@alembic/agent/tools';
```

根入口 `@alembic/agent` 也会导出同一组工具系统能力，便于主仓库/宿主渐进迁移；需要直接接入 Agent package 的宿主代码建议使用 `@alembic/agent/tools`，让边界更清晰。

`AlembicPlugin` 不属于这个接入方。Plugin 不新增 `@alembic/agent` dependency，不 import `@alembic/agent/tools`，它后续只通过宿主 agent contract/adapter 转发 Codex MCP tool call。

## Agent-owned Tool 子集

本轮正式归入 AlembicAgent 的通用子集：

- `src/tools/core/**` 中的 contracts、router、context、decision、result envelope、presenter、routing services。
- `src/tools/catalog/**` 中的 capability manifest、catalog、unified catalog。
- `src/tools/v2/**` 中的 capability schema、registry、types、compressor。
- `src/tools/workflow/WorkflowRegistry.ts`。

继续留给宿主仓库处理的能力：

- Alembic 主仓库的 CLI、daemon、Dashboard、native/macOS、IDE、HTTP/API wiring。
- Alembic 主仓库的平台 adapter，例如 Mac/native system adapter、Dashboard operation adapter。
- AlembicPlugin 的 Codex MCP schema projection、handler envelope、session/policy、skills/plugins/channels 和 release/smoke/verify 脚本。

## Router 行为

`LightweightRouter` 本轮补齐的行为：

- 未知工具返回 `error` envelope。
- manifest 不允许的 surface 返回 `blocked` envelope；`composer` / `system` 作为内部编排 surface 保持允许。
- `runtime.policyValidator.validateToolCall()` 拒绝时，在 adapter 执行前返回 `blocked` envelope。
- adapter `preview()` 进入 allowed decision。
- pre-aborted request 不启动 adapter，返回 `aborted` envelope。
- 执行中 timeout 返回 `timeout` envelope，并记录 `diagnostics.timedOutStages`。
- adapter throw 被规范化为 `error` envelope。
- `runtime.diagnostics.recordToolCallEnvelope()` 会收到最终 envelope 和 kind/surface/source 诊断上下文。

## 测试覆盖

新增测试覆盖 Phase 4 验收项：

- `UnifiedToolCatalog` 将 V2 definition 投影为 internal/lightweight/mixed schema，并保留 internal handler access。
- `LightweightRouter` 正常路由 adapter execution，并保留 structuredContent、artifacts、warnings、nextActionHint。
- runtime policy deny 在 adapter 执行前阻断，并记录 diagnostics。
- 不支持的 surface 被阻断。
- adapter 超过 timeout 返回 `timeout` envelope。
- 已取消请求不启动 adapter，返回 `aborted` envelope。
- adapter 异常规范化为 `error` envelope。

## 验证结果

已通过：

- `npm run build:check`
- `npm run lint`
- `npm run lint:agent-import-boundary`
- `npm run test`
- `npm run check`
- `npm run build`
- `node -e "import('./dist/index.js')..."`
- `node -e "import('./dist/tools/index.js')..."`

Smoke import 结果：

```json
{"hasAgentRuntime":true,"hasMockProvider":true,"hasLightweightRouter":true,"hasUnifiedToolCatalog":true,"phase":"phase-4-tool-system"}
```

```json
{"hasLightweightRouter":true,"hasCapabilityCatalog":true,"hasUnifiedToolCatalog":true,"hasPresenter":true}
```

测试结果：

```text
Test Files  3 passed (3)
Tests       15 passed (15)
```

说明：`npm run lint` 返回成功，但 Biome 对迁入的原始 Agent/AI/Tool 源码仍报告 27 个 warning，主要是 non-null assertion、unused import/private member 和 optional-chain 风格建议。本阶段为保持行为不变未做批量清理。

## 交给 Alembic 窗口的接入任务

`Alembic` 主仓库仍不要立即删除 `lib/tools/**`。Phase 4 后可以开始做接入准备：

1. 扫描主仓库所有 `#tools/*`、`lib/tools/core`、`lib/tools/catalog`、`lib/tools/v2`、`lib/tools/workflow` 和相对 tool 引用，形成替换清单。
2. 将通用 tool contracts、capability catalog、unified catalog、lightweight router、result envelope/presenter、workflow registry 消费点切到 `@alembic/agent/tools`。
3. 保留 CLI、daemon、HTTP/API、Dashboard、native/macOS、IDE 和主产品 wiring 作为宿主 adapter。
4. 先保留 `MacSystemAdapter.ts`、`MacSystemCapabilities.ts`、Dashboard operation adapter 和平台工具执行入口；除非后续有明确 host adapter contract 和测试，不迁入 Agent package。
5. 删除候选：完成替换并验证后，`Alembic/lib/tools/core/**`、`Alembic/lib/tools/catalog/**`、`Alembic/lib/tools/v2/**`、`Alembic/lib/tools/workflow/**` 中已由 Agent 接管的通用部分可删除。
6. 删除前必须提供 import 扫描结果、build/check/lint 结果，以及 CLI/daemon/Dashboard/native tool smoke 证据。

## 交给 AlembicPlugin 窗口的宿主适配与删除逻辑

`AlembicPlugin` 不能新增 `@alembic/agent` dependency，也不能 import `@alembic/agent/tools`。Plugin 的任务是删除内置 Tool System / Agent runtime，并通过宿主 agent contract/adapter 使用宿主提供的 tool runtime。

任务：

1. 不为 Plugin 接入 `@alembic/agent` dependency，开发期也不要使用 `file:../AlembicAgent`。
2. 扫描 `AlembicPlugin/lib/**` 中所有 `#tools/*`、`lib/tools/core`、`lib/tools/catalog`、`lib/tools/v2`、`lib/tools/workflow` 和相对 tool 引用。
3. Codex MCP handler 只保留 schema projection、handler envelope、session、policy、Codex-specific adapter；agent/tool execution 改为调用宿主 agent contract。
4. 保留 `lib/external/mcp/**`、`lib/codex/**`、Codex schema/envelope/session/policy、skills、injectable-skills、plugins、channels 和 release/smoke/verify 脚本。
5. 删除候选：宿主 adapter 替代路径验证完成后，删除 `AlembicPlugin/lib/tools/core/**`、`AlembicPlugin/lib/tools/catalog/**`、`AlembicPlugin/lib/tools/v2/**`、`AlembicPlugin/lib/tools/workflow/**` 中重复的通用 runtime。
6. 删除前必须运行 import 扫描；删除后至少运行 `npm run build:check`、`npm run lint -- --diagnostic-level=error`、`npm run lint:core-import-boundary`、`npm run smoke:codex-plugin`、`npm run verify:codex-plugin`。
7. 如果发现 Plugin 专属 Codex tool schema 或 response shape 逻辑，保留在 Plugin adapter 中；tool execution 能力由宿主 agent 提供，不由 Plugin 直接依赖 `@alembic/agent/tools`。

## 下一阶段

下一轮进入 Phase 5：迁移 Agent Memory / Context 持久化。

Phase 5 应在当前 `src/agent/context/**` 和 `src/agent/memory/**` 基础上：

- 明确 Agent-owned context/memory/session/embedding store 的持久化边界。
- 使用 Core 提供的 stable facade 或 repository/vector contract；不要复制 Core migration。
- 补 MemoryStore、SessionStore、embedding memory、恢复/损坏数据处理测试。
- 更新 Alembic 的 memory/context 接入清单，以及 AlembicPlugin 的宿主 agent adapter / 删除清单。
