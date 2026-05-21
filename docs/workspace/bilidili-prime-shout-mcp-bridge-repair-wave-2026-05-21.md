# BiliDili Prime Shout MCP Bridge Repair Wave

状态：已收口，方向调整，发送给无
总控窗口：AlembicWorkspace
创建日期：2026-05-21
适用范围：`Alembic`、`AlembicPlugin`、`AlembicTest`

## 背景

`AlembicTest` 已完成 Test-2026-05-21-01。测试结论为失败：BiliDili Recipes 已生成并可被 `alembic_codex_status` 读取，status 层显示 `knowledge_ready`、`recipeCount=79`、`sourceRefs=196`、`alembic_task` 工具可见；但真实 `alembic_task(operation=prime)` 被 Plugin -> local Alembic daemon bridge 404 截断。

失败链路：

1. Alembic Codex MCP stdio runtime 成功启动。
2. `alembic_codex_status` 在 BiliDili 上下文读取到 usable knowledge。
3. `alembic_task prime` 选择 `local-alembic-daemon` enhancement route。
4. Plugin POST 到 `http://127.0.0.1:63030/api/v1/mcp/call`。
5. 当前 Alembic daemon 返回 404 `NOT_FOUND`。
6. `primeKnowledgeMaterial` 没有生成，Codex 不能做真实知识呐喊。

详细测试报告：[../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md)。

## 总控边界修正

2026-05-21 用户确认：对于深度绑定 IDE / Codex host agent 的 AlembicPlugin 能力，不再把本地 Alembic daemon bridge 作为默认执行路径；先把功能分清楚，只在有必要增强的能力上做桥接与共享层下沉。

因此，本 wave 的 `Alembic` bridge 修复保留为兼容能力和本地增强入口，不再作为 `prime -> Codex 自主呐喊` 的主路径。`primeKnowledgeMaterial`、`hostResponse` 和 `shoutInstruction` 仍归 `AlembicPlugin` 的 Codex-facing 契约所有。

后续当前计划切换到：[alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md)。

## 本轮原目标

让 Alembic 本地 daemon 暴露 Plugin 已经调用的 MCP bridge 入口 `/api/v1/mcp/call`，使 BiliDili 项目上下文中的 `alembic_task prime` 能返回 delivered `primeKnowledgeMaterial`，并让 `AlembicTest` 后续复测可以验证 Codex 知识呐喊。

修正后口径：本 wave 只验收 `/api/v1/mcp/call` 不再 404；不再要求 Alembic daemon 自己承接 `primeKnowledgeMaterial`。BiliDili prime 呐喊复测等待新计划中 `AlembicPlugin` service request 边界修复后再启动。

## 非目标

- 不重新生成 BiliDili Recipes。
- 不启动 BiliDili cold-start / rescan。
- 不修改 BiliDili 业务源码。
- 本波不扩展默认 Codex agent 的 publish / deprecate / approve / fast_track 权限。
- 本波不优先做大型 route selection 重构、portable runtime 发布或 Codex 全局插件 cache 同步；若 Alembic daemon bridge 修复后仍失败，再单独判断。

## 真实代码事实

- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts` 的 daemon bridge 调用固定 POST `${state.url}/api/v1/mcp/call`，携带 `x-alembic-daemon-token`。
- `AlembicPlugin/lib/http/routes/mcp.ts` 已有兼容 bridge 路由实现：校验 daemon token 后用 `McpServer._handleToolCall()` 执行工具。
- `AlembicPlugin/lib/http/HttpServer.ts` 已挂载 `${apiPrefix}/mcp`，所以 embedded/plugin runtime 有 `/api/v1/mcp/call`。
- `Alembic/lib/http/HttpServer.ts` 当前只挂载 health、daemon、jobs、projects、auth 等路由，没有挂载 `${apiPrefix}/mcp`。
- `Alembic/lib/http/routes/daemon.ts` health capabilities 来自 `@alembic/core/daemon` 的 `createAlembicRuntimeCapabilities()`，当前只有 api、dashboard、fileMonitor、internalAi、jobs；没有独立 MCP bridge capability。
- `AlembicPlugin/lib/codex/EnhancementRoute.ts` 对 `requirement === "mcp"` 只检查 `daemon.capabilities.apiAvailable === false`，未检查 `/api/v1/mcp/call` 是否真实存在。

## Producer / Consumer 依赖

- 当前最小闭环 producer 是 `Alembic`：补齐 daemon MCP bridge route，让现有 `AlembicPlugin` 调用链先跑通。
- `AlembicPlugin` 转入新计划：按用户确认，Codex-facing `prime` 不应默认桥接到 Alembic；下一步修正 service request boundary，让 Plugin 保持 tool ownership 并按需请求 Alembic resident service。
- `AlembicTest` 当前阻塞：等待新计划中 `AlembicPlugin` 修正 service request 边界后，重跑 Test-2026-05-21-01。
- `AlembicCore` 当前无任务：MCP bridge capability contract 可作为后续硬化 TODO；本波先不改共享 contract，避免扩大闭环。

## TODO / Backlog

| ID | 状态 | 类型 | 严重度 / 优先级 | 归属 | 事项 / TODO | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BRIDGE-1 | 已完成 | 修复 / 兼容能力 | P0 | `Alembic` | 在 Alembic 本地 daemon 中补齐 `/api/v1/mcp/call` bridge 路由，兼容 Plugin 当前调用格式 `{ name, args, actor }` 和 daemon token 校验。 | 否 | Alembic 回填提交 `83130a6add9806c124d334281a0ec7f219afd33e`。 | `Alembic` |
| BRIDGE-2 | 暂停 | 复测 | P0 | `AlembicTest` | 原计划在 bridge 后重跑 BiliDili prime shout；现暂停，改由新计划 SERVICE-4 在 Plugin service request 边界修复后复测。 | 是 | 等待新计划 `AlembicPlugin` 修复。 | `AlembicTest` |
| BRIDGE-3 | 转入新计划 | 硬化 | P1 | `AlembicPlugin` | route selection 不能再按 `requirement: "mcp"` 一刀切；已转入新计划 SERVICE-1/2。 | 是 | 用户确认 IDE Agent 深绑定能力不做 MCP tool ownership bridge。 | `AlembicPlugin` |
| BRIDGE-4 | 转入新计划 | contract | P2 | `AlembicCore` / `Alembic` / `AlembicPlugin` | Alembic resident service contract / capability version 判断转入新计划 SERVICE-5，且不阻塞 prime 主闭环。 | 否 | 等 Plugin 路由修复后判断。 | 待定 |

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | BRIDGE-1 已完成，保留 `/api/v1/mcp/call` 作为兼容 bridge；当前不继续扩展 Alembic prime handler。 |
| `AlembicPlugin`<br>转入新计划 | route selection / Codex-facing task ownership 转入 [alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md)。 |
| `AlembicTest`<br>阻塞 | 等待新计划 Plugin service request 边界修复后再重跑 Test-2026-05-21-01。 |
| `AlembicCore`<br>观察中 | shared runtime capability / prime material schema 是否下沉，转入新计划观察项。 |
| `AlembicAgent`<br>无任务 | 当前问题已转为 Plugin service request 边界，不涉及 internal AI runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及前端 UI。 |

## 空闲窗口调度

| 窗口 | 当前调度 | 理由 | 是否发送 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 | daemon bridge 兼容能力已完成；不再作为 prime 主路径。 | 否 |
| `AlembicPlugin` | 转入新计划 | 当前实际主线变为 Plugin service request 边界。 | 否 |
| `AlembicTest` | 阻塞 | 等待 Plugin 修正后复测。 | 否 |
| `AlembicCore` | 观察 | 等 Plugin 梳理共享层下沉需要。 | 否 |
| `AlembicAgent` | 无任务 | 不涉及 internal AI runtime。 | 否 |
| `AlembicDashboard` | 无任务 | 不涉及前端。 | 否 |

## 当前执行顺序

发送给：无。

不发送给：

- `AlembicPlugin`：已转入新计划，不在旧 bridge wave 发送。
- `Alembic`：已完成兼容 bridge。
- `AlembicTest`：阻塞，等待 Plugin service request 边界修复后复测。
- `AlembicCore`：观察中。
- `AlembicAgent`：无任务。
- `AlembicDashboard`：无任务。

## 可复制分派提示词

发送给：无。

```text
当前旧 bridge wave 已收口，不再发送领取提示词。新的当前计划为 docs/workspace/alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md。
```

## Alembic 执行要求

目标：

- 在 Alembic 本地 daemon 中补齐 `/api/v1/mcp/call` bridge route，让 AlembicPlugin 的 `callDaemonBridge()` 不再 404。
- bridge 行为应兼容 Plugin 已有请求体 `{ name, args, actor }` 与 header `x-alembic-daemon-token`。
- route 应调用 Alembic 自身 MCP tool handler，不要绕过权限 / actor / surface 语义。

范围：

- 优先查看 `Alembic/lib/http/HttpServer.ts`、`Alembic/lib/external/mcp/McpServer.ts`、`Alembic/lib/http/routes/daemon.ts`、`AlembicPlugin/lib/http/routes/mcp.ts`。
- 可以从 `AlembicPlugin/lib/http/routes/mcp.ts` 迁移等价 bridge 逻辑，但必须使用 Alembic 仓库自己的 imports、DI container 和测试风格。
- 如需最小 health 文案，可只在 Alembic 回填中说明 `/api/v1/mcp/call` 已可用；不要在本波强行改 Core runtime capability contract。

禁止事项：

- 不修改 BiliDili。
- 不启动 BiliDili cold-start / rescan。
- 不改 AlembicPlugin 源码。
- 不扩大默认 Codex agent lifecycle 权限。
- 不把 bridge 做成静态 mock；必须接真实 MCP handler。

建议验证：

```bash
npm run build:check
npm run test -- test/integration/ZodSchemas.test.ts
# 如果 Alembic 有 HTTP route / daemon route targeted tests，补充或新增针对 /api/v1/mcp/call 的最小测试。
git diff --check
```

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令：
- 验证结果：
- `/api/v1/mcp/call` 是否不再 404：
- 是否可以启动 AlembicTest 复测：
- 遗留风险：
- 下一步建议：

## 回填区

- 2026-05-21：总控基于 `AlembicTest` Test-2026-05-21-01 失败回填创建本 wave。测试证明 BiliDili Recipes 可读、status 层 ready，但 `alembic_task prime` 失败在 Plugin -> Alembic daemon `/api/v1/mcp/call` 404；本 wave 先派发 `Alembic` 修复最小真实断点。
- 2026-05-21：`Alembic` 窗口完成 BRIDGE-1。
  - 完成范围：在 Alembic daemon 中新增 `lib/http/routes/mcp.ts` 并挂载到 `HttpServer` 的 `/api/v1/mcp`；新增 `lib/external/mcp/McpBridgeDispatcher.ts`，通过现有 MCP schema 校验、真实 handler、会话上下文和 actor/source/surface/gateway 语义转发 `{ name, args, actor }`；补充 `test/unit/McpBridgeRoute.test.ts` 覆盖 token 拒绝、`alembic_task prime` 真实 handler 调用和 unknown tool 返回 tool error 而非 route 404。
  - 提交 hash：`83130a6add9806c124d334281a0ec7f219afd33e`（已推送 `GxFn/Alembic main`）。
  - 验证命令：`npm run test -- test/unit/McpBridgeRoute.test.ts`；`npm run test -- test/integration/ZodSchemas.test.ts`；`npm run build:check`；`npm run lint -- --diagnostic-level=error`；`git diff --check`。
  - 验证结果：以上命令均通过；targeted route 测试中 `POST /api/v1/mcp/call` 使用合法 `x-alembic-daemon-token` 返回 200，并进入 `alembic_task prime` handler，缺失 token 返回 401，未知 MCP tool 返回 400 tool error。
  - `/api/v1/mcp/call` 是否不再 404：是，Alembic daemon 已挂载 `${apiPrefix}/mcp`，targeted 测试证明 `/call` 被路由处理。
  - 是否可以启动 AlembicTest 复测：按 Alembic 当时回填可以；但总控后续根据用户边界决策暂停 BRIDGE-2，复测改为等待 `AlembicPlugin` service request 边界修正后启动。
  - 遗留风险：本轮只修复 Alembic daemon bridge 断点；若直接复测，仍可能因 Plugin tool ownership 被 daemon bridge 绕开而拿不到 `primeKnowledgeMaterial`。
  - 下一步建议：不要直接启动旧 BRIDGE-2；先执行 [alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md)，再由 `AlembicTest` 复测。
