# Alembic Plugin Service Request Boundary Workspace Plan

状态：待启动，发送给 `AlembicPlugin`
总控窗口：AlembicWorkspace
创建日期：2026-05-21
适用范围：`AlembicPlugin`、`Alembic`、`AlembicCore`、`AlembicTest`

## 用户决策

对于深度绑定 IDE / Codex host agent 的 AlembicPlugin 能力，不再把本地 Alembic daemon bridge 作为默认执行路径。

更准确的长期模型是：`Alembic` 作为常驻本地服务，`AlembicPlugin` 根据需要请求 Alembic 提供的服务；不是把 Plugin 的 MCP tool ownership 桥接给 Alembic。Plugin 仍然拥有 Codex-facing 交互、tool policy、host response 和失败语义；Alembic 提供索引、搜索、状态、后台任务、Dashboard、多项目和文件监控等服务能力。

先把服务边界分清楚：哪些是 Plugin 自己的 Codex 交互能力，哪些是 Plugin 需要向 Alembic 常驻服务请求的数据 / 任务 / 状态，哪些确定性 contract 需要下沉到 `AlembicCore` 共享。

## 背景

`AlembicTest` 的 BiliDili prime 插件测试证明：

1. `alembic_codex_status` 可以读取 BiliDili 已生成 Recipes。
2. `alembic_task(operation=prime)` 被 `AlembicPlugin` 选择到 `local-alembic-daemon` route。
3. 当时 `Alembic` daemon 缺少 `/api/v1/mcp/call`，导致 404。
4. `Alembic` 窗口随后补齐了 daemon bridge，提交 `83130a6add9806c124d334281a0ec7f219afd33e`。

总控复核后发现：bridge 修好只能证明 HTTP route 可用，不能证明 `prime -> Codex 自主呐喊` 契约正确。`AlembicPlugin` 的 `alembic_task prime` 已实现 `primeKnowledgeMaterial` / `shoutInstruction` / `hostResponse`；`Alembic` 自己的 `taskHandler` 仍是旧 payload。若继续让 Plugin 把 `prime` 转发给 Alembic，真实复测很可能从 404 失败变成 payload 契约失败。

因此，本轮主线从“让 Alembic 承接 prime bridge”调整为“让 AlembicPlugin 保持 Codex-facing ownership，并按需请求 Alembic 常驻服务”。`prime` 的可见契约留在 Plugin；Recipe / Guard 搜索等数据能力可以后续改成 service request，但不改变 Plugin 返回给 Codex 的语义。

## 目标

- 明确 Codex-facing / IDE-agent-bound 能力归 `AlembicPlugin` 所有，不做 MCP tool 级 ownership bridge。
- 明确 `AlembicPlugin` 可以按需请求 `Alembic` 常驻服务，例如 daemon health、search/index、Dashboard server、JobStore、ProjectRegistry、file monitor、internal AI jobs。
- 修正 `AlembicPlugin` 的 dispatch：`alembic_task prime` 和同一 intent lifecycle 的 task 操作应由 Plugin 生成 Codex-facing payload；不能因为 local daemon ready 就把整个 tool call 转交给 Alembic 旧 handler。
- 保留 `Alembic` 已完成的 `/api/v1/mcp/call` 作为兼容入口，但本轮不再把它作为 Plugin 与 Alembic 的主要设计模型。
- 只有发现两边确有重复的确定性 contract / builder / schema，才派发 `AlembicCore` 做共享层下沉。

## 非目标

- 不撤销 `Alembic` 已完成的 daemon bridge；它可以作为兼容能力保留。
- 不让 `Alembic` 复制 `AlembicPlugin` 的 Codex host-response、shoutInstruction、tool policy 或 Skill 交互契约。
- 不修改 BiliDili 业务源码。
- 不立即重跑 BiliDili 测试；先等 `AlembicPlugin` service request 边界修正后再创建 / 启动复测。
- 不扩大默认 Codex agent 的 publish / deprecate / approve / fast_track 权限。

## 服务边界分类

### Plugin-owned，不能交出 ownership

这些能力深度绑定 Codex / IDE Agent 交互，入口、权限、payload 表达和用户可见动作归 `AlembicPlugin`：

- `alembic_task` 的 `prime / create / close / fail / record_decision`：Codex intent lifecycle、prime 知识接收、开发者可见呐喊、task session 状态。
- `alembic_bootstrap` / `alembic_rescan` 的 Codex host-agent 路径：由 Codex 阅读、提交知识、完成维度，不等同于 Alembic internal AI jobs。
- `alembic_codex_status`、`alembic_codex_diagnostics`、`alembic_codex_init`、Codex tool policy、Skill / marketplace onboarding、host response / next action 文案。
- 默认 Codex agent lifecycle 可见契约和权限收敛。

### Plugin-owned facade，按需请求 Alembic 服务

这些能力面向 Codex 的返回契约仍归 `AlembicPlugin`，但可以请求 `Alembic` 常驻服务或使用 `AlembicCore` 共享算法：

- Recipe / Guard 检索、结构查询、知识浏览、Guard 检查、submit / consolidate 返回契约。
- 共享候选：`primeKnowledgeMaterial` schema、evidenceRefs 解析、Recipe search result projection、可信 source contract。
- 约束：Plugin 可以请求 Alembic 的 search/index/API，但不能因为 local daemon ready 就绕过 Plugin 的 Codex-facing envelope、hostResponse、tool policy、降级和 fallback 语义。

### Alembic resident service

这些能力依赖本地长期进程或本地安装能力，应由 `Alembic` 作为常驻服务提供，Plugin 只请求服务结果：

- Dashboard server / Dashboard URL handoff。
- Explicit internal AI bootstrap / rescan jobs、JobStore、job status 查询。
- ProjectRegistry、WorkspaceResolver、多项目状态、本地 daemon health。
- file monitor、git/worktree 观察、后台增量任务。
- `/api/v1/mcp/call` 兼容入口：只作为过渡或兼容通道；长期优先设计为 Plugin 调用 Alembic 服务 API，而不是把 Plugin MCP tool 直接交给 Alembic handler 树。

## 真实代码证据

- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts` 当前 default 分支会把普通 Alembic tool 交给 `callDaemonTool()`，再 POST `${state.url}/api/v1/mcp/call`。
- `AlembicPlugin/lib/codex/EnhancementRoute.ts` 当前只要 local daemon ready 且 route 是 local Alembic，就优先选择 `local-alembic-daemon`；`requirement === "mcp"` 只检查 `apiAvailable`。
- `AlembicPlugin/lib/external/mcp/handlers/task.ts` 已有 `primeKnowledgeMaterial`、`shoutInstruction`、`hostResponse`。
- `Alembic/lib/external/mcp/handlers/task.ts` 仍是旧 prime payload，没有 `primeKnowledgeMaterial`。
- `Alembic/lib/http/routes/mcp.ts` 和 `Alembic/lib/external/mcp/McpBridgeDispatcher.ts` 已补齐 bridge，但它调用的是 Alembic 自己的 MCP handler 树；这证明 tool-level bridge 会绕开 Plugin 的 Codex-facing prime 契约。

## Producer / Consumer 依赖

- `AlembicPlugin` 是本轮 producer：产出 service request boundary / dispatch 规则，让 Codex-facing task prime 留在 Plugin，并把 Alembic 当作被请求的常驻服务。
- `Alembic` 是观察窗口：已完成 daemon bridge，当前不继续扩展 prime handler；后续按服务 API / resident service contract 被 Plugin 请求。
- `AlembicCore` 是观察窗口：仅当 Plugin / Alembic 重复 contract 需要收敛时，才启动共享 schema / builder 下沉。
- `AlembicTest` 阻塞：等待 Plugin 修正后，重跑 BiliDili prime shout 插件测试。

## TODO / Backlog

| ID | 状态 | 类型 | 严重度 / 优先级 | 归属 | 事项 / TODO | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SERVICE-1 | 待启动 | 主线修复 | P0 | `AlembicPlugin` | 为 `alembic_task` 建立 Codex-facing ownership：`prime / create / close / fail / record_decision` 不因 local daemon ready 而转发到 `Alembic`，应在 Plugin 侧执行并保留 `primeKnowledgeMaterial` / `hostResponse`。 | 是 | 用户确认 IDE Agent 深绑定能力不做 tool ownership bridge。 | `AlembicPlugin` |
| SERVICE-2 | 待启动 | 主线设计 / 修复 | P0 | `AlembicPlugin` | 建立 service request boundary：区分 Plugin-owned 交互、Plugin 请求 Alembic 常驻服务、Core shared contract；不再用 `requirement: "mcp"` 一刀切选择 local daemon handler。 | 是 | SERVICE-1 同步完成。 | `AlembicPlugin` |
| SERVICE-3 | 观察中 | contract | P1 | `AlembicPlugin` / `AlembicCore` | 梳理 `primeKnowledgeMaterial`、evidenceRefs、Recipe projection 是否需要下沉到 Core；只有确认两边都要长期消费时再派发 Core。 | 否 | 等 SERVICE-1/2 后看重复风险。 | `AlembicPlugin` / `AlembicCore` |
| SERVICE-4 | 阻塞 | 复测 | P0 | `AlembicTest` | Plugin service boundary 修正后，重跑 BiliDili prime shout 插件测试，验收 delivered `primeKnowledgeMaterial`、Codex 知识呐喊、BiliDili git 干净。 | 是 | 等 `AlembicPlugin` 提交和验证。 | `AlembicTest` |
| SERVICE-5 | 观察中 | service contract | P2 | `Alembic` / `AlembicPlugin` / `AlembicCore` | 后续为 Alembic resident service 增加明确 service API / capability / contract version，避免把服务请求退化成 MCP tool ownership bridge；不阻塞 prime 主闭环。 | 否 | 主闭环通过后再判断。 | 待定 |

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>待启动 | 执行 SERVICE-1/2：把 Codex-facing `alembic_task` ownership 留在 Plugin，并建立 service request boundary；补充目标测试证明 local daemon ready 时 prime 仍返回 Plugin 的 `primeKnowledgeMaterial`。 |
| `Alembic`<br>观察中 | 已完成 daemon bridge 兼容能力；当前不再扩展 Alembic prime handler，不复制 Plugin 的 host-response / shout 契约；后续作为 resident service 被请求。 |
| `AlembicTest`<br>阻塞 | 等待 Plugin 修正后复测 BiliDili prime shout；当前不发送，避免用已知错误路由继续测试。 |
| `AlembicCore`<br>观察中 | 等待 Plugin 梳理是否有确定性 schema / builder 需要共享层下沉。 |
| `AlembicAgent`<br>无任务 | 当前是 Codex host agent / Plugin service request 边界，不涉及 AlembicAgent runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及 Dashboard UI；Dashboard server 仍属于 Alembic-enhanced 能力。 |

## 空闲窗口调度

| 窗口 | 当前调度 | 理由 | 是否发送 |
| --- | --- | --- | --- |
| `AlembicPlugin` | 主线 | 唯一当前可推进窗口，需要修正 Codex MCP dispatch / service request 边界。 | 是 |
| `Alembic` | 观察 | bridge 已完成但不再作为 prime 主路径；后续作为 resident service。 | 否 |
| `AlembicTest` | 阻塞 | 等待 Plugin 修正后再复测。 | 否 |
| `AlembicCore` | 观察 | 共享层下沉需等重复点确认。 | 否 |
| `AlembicAgent` | 无任务 | 不涉及。 | 否 |
| `AlembicDashboard` | 无任务 | 不涉及。 | 否 |

## 当前执行顺序

发送给：`AlembicPlugin`。

不发送给：

- `Alembic`：观察中，已完成 bridge 兼容能力，本轮不继续扩展 prime。
- `AlembicTest`：阻塞，等待 Plugin 修正后复测。
- `AlembicCore`：观察中，等 Plugin 梳理共享层需要。
- `AlembicAgent`：无任务。
- `AlembicDashboard`：无任务。

## 可复制分派提示词

发送给：`AlembicPlugin`。

```text
读取 docs/workspace/alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

## AlembicPlugin 执行要求

目标：

- 修正 Codex MCP dispatch：`alembic_task` 的 Codex intent lifecycle 操作由 Plugin 执行，不默认桥接到 Alembic daemon。
- 建立 service request boundary，让 Plugin-owned 交互、Alembic resident service 请求和 Core shared contract 分开。
- local daemon ready 时，`alembic_task(operation="prime")` 仍应返回 Plugin 已实现的 `primeKnowledgeMaterial` / `hostResponse` / `shoutInstruction`。

范围：

- 优先查看 `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts`、`AlembicPlugin/lib/codex/EnhancementRoute.ts`、`AlembicPlugin/lib/external/mcp/McpServer.ts`、`AlembicPlugin/lib/external/mcp/handlers/task.ts`。
- 可以新增 ownership / service-boundary helper 和 tests；避免把分类散落在多个 switch 中。
- 若发现需要共享 schema / builder，只记录为回填建议，不在本轮直接修改 `AlembicCore`。

禁止事项：

- 不修改 `Alembic` 本轮已完成的 bridge。
- 不让 Alembic 复制 Plugin 的 `hostResponse` / `shoutInstruction`。
- 不修改 BiliDili。
- 不启动 BiliDili cold-start / rescan。
- 不扩大默认 Codex agent lifecycle 权限。

建议验证：

```bash
npm run build:check
npm run test -- --runInBand CodexMcpServer
npm run test -- --runInBand task
git diff --check
```

如仓库测试命令名称不同，使用等价 targeted tests，并在回填中写明。

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令：
- 验证结果：
- local daemon ready 时 prime 是否仍由 Plugin 生成 Codex-facing payload：
- `primeKnowledgeMaterial` / `hostResponse` / `shoutInstruction` 是否保留：
- 是否需要 Core 共享层下沉：
- 是否可以启动 AlembicTest 复测：
- 遗留风险：
- 下一步建议：

## 回填区

- 2026-05-21：总控根据用户决策创建本计划。边界调整为：IDE / Codex host agent 深绑定能力不做 MCP tool ownership bridge；`prime -> Codex 知识呐喊` 留在 `AlembicPlugin`；`Alembic` 作为 resident service 被 Plugin 按需请求，已完成的 bridge 仅保留为兼容能力。
