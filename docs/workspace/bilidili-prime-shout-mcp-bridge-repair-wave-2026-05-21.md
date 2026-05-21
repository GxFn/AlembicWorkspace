# BiliDili Prime Shout MCP Bridge Repair Wave

状态：待启动，发送给 `Alembic`
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

## 本轮目标

让 Alembic 本地 daemon 暴露 Plugin 已经调用的 MCP bridge 入口 `/api/v1/mcp/call`，使 BiliDili 项目上下文中的 `alembic_task prime` 能返回 delivered `primeKnowledgeMaterial`，并让 `AlembicTest` 后续复测可以验证 Codex 知识呐喊。

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
- `AlembicPlugin` 当前观察：如果 Alembic 修复后复测仍因 route selection / capability 判断失败，再启动 Plugin hardening；本波不让 Plugin 先做 fallback，以免绕开主断点。
- `AlembicTest` 当前阻塞：等待 `Alembic` 修复提交和验证后，重跑 Test-2026-05-21-01。
- `AlembicCore` 当前无任务：MCP bridge capability contract 可作为后续硬化 TODO；本波先不改共享 contract，避免扩大闭环。

## TODO / Backlog

| ID | 状态 | 类型 | 严重度 / 优先级 | 归属 | 事项 / TODO | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BRIDGE-1 | 待启动 | 修复 | P0 | `Alembic` | 在 Alembic 本地 daemon 中补齐 `/api/v1/mcp/call` bridge 路由，兼容 Plugin 当前调用格式 `{ name, args, actor }` 和 daemon token 校验。 | 是 | AlembicTest Test-2026-05-21-01 失败证据。 | `Alembic` |
| BRIDGE-2 | 阻塞 | 复测 | P0 | `AlembicTest` | 修复后重跑 BiliDili prime shout 插件测试，验收 delivered `primeKnowledgeMaterial`、知识 / Guard / evidence refs、`hostResponse` / `shoutInstruction` 和 BiliDili git 干净性。 | 是 | 等待 `Alembic` BRIDGE-1 提交与验证。 | `AlembicTest` |
| BRIDGE-3 | 观察中 | 硬化 | P1 | `AlembicPlugin` | 若 Alembic daemon bridge 修复后仍出现 route selection 误判，则增强 `requirement: "mcp"` 的 capability 判断或 404 fail-closed / fallback 提示。 | 否 | 等待 BRIDGE-1 + BRIDGE-2 结果。 | `AlembicPlugin` |
| BRIDGE-4 | 观察中 | contract | P2 | `AlembicCore` / `Alembic` / `AlembicPlugin` | 后续考虑在 shared runtime capabilities 中显式声明 MCP bridge endpoint / availability，避免只用 `apiAvailable` 推断。 | 否 | 主闭环跑通后再判断是否需要下沉共享 contract。 | `AlembicCore` |

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动 | 执行 BRIDGE-1：在 Alembic 本地 daemon 中补齐 `/api/v1/mcp/call` bridge route，并用最小验证证明 POST 不再 404 且能触发 `alembic_task prime` 或等价 MCP tool handler。 |
| `AlembicPlugin`<br>观察中 | 当前不派发；等待 Alembic 修复和 AlembicTest 复测结果。若 daemon bridge 仍不可用或 route selection 继续误判，再启动 Plugin hardening。 |
| `AlembicTest`<br>阻塞 | 等待 Alembic 回填提交和验证后，重跑 Test-2026-05-21-01。当前不发送，避免对已知 404 断点重复测试。 |
| `AlembicCore`<br>无任务 | 本波先不改 shared runtime capability contract；后续如需要显式 `mcpBridge` capability，再另开 contract 任务。 |
| `AlembicAgent`<br>无任务 | 当前问题是 Plugin -> Alembic daemon HTTP bridge，不涉及 internal AI runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及前端 UI。 |

## 空闲窗口调度

| 窗口 | 当前调度 | 理由 | 是否发送 |
| --- | --- | --- | --- |
| `Alembic` | 主线 | 真实断点是 Alembic daemon 没有 `/api/v1/mcp/call` route。 | 是 |
| `AlembicPlugin` | 观察 | 现有 Plugin 已按固定 endpoint 调用；先让 daemon route 接上。 | 否 |
| `AlembicTest` | 阻塞 | 等待 Alembic 修复后复测。 | 否 |
| `AlembicCore` | 无任务 | 本波不改 shared capability contract。 | 否 |
| `AlembicAgent` | 无任务 | 不涉及 internal AI runtime。 | 否 |
| `AlembicDashboard` | 无任务 | 不涉及前端。 | 否 |

## 当前执行顺序

发送给：`Alembic`。

不发送给：

- `AlembicPlugin`：观察中，等待 Alembic 修复和复测结果。
- `AlembicTest`：阻塞，等待 Alembic 提交后复测。
- `AlembicCore`：无任务。
- `AlembicAgent`：无任务。
- `AlembicDashboard`：无任务。

## 可复制分派提示词

发送给：`Alembic`。

```text
读取 docs/workspace/bilidili-prime-shout-mcp-bridge-repair-wave-2026-05-21.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
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
